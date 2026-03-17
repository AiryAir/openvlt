import fs from "fs"
import { v4 as uuid } from "uuid"
import { getDb } from "@/lib/db"
import { getVaultPath, safeResolvePath } from "@/lib/vaults/service"
import { parseFrontmatter, setFrontmatterField } from "@/lib/frontmatter"
import type { PropertyDefinition, PropertyType, NoteProperty } from "@/types"

// ── Reserved frontmatter keys (not user properties) ──

const RESERVED_KEYS = new Set(["cover", "locked"])

// ── Property Definition CRUD ──

export function listPropertyDefinitions(vaultId: string): PropertyDefinition[] {
  const db = getDb()
  const rows = db
    .prepare(
      "SELECT * FROM property_definitions WHERE vault_id = ? ORDER BY sort_order, name"
    )
    .all(vaultId) as Record<string, unknown>[]
  return rows.map(toPropertyDefinition)
}

export function getOrCreatePropertyDefinition(
  vaultId: string,
  name: string,
  type: PropertyType = "text"
): PropertyDefinition {
  const db = getDb()
  const existing = db
    .prepare(
      "SELECT * FROM property_definitions WHERE vault_id = ? AND name = ?"
    )
    .get(vaultId, name) as Record<string, unknown> | undefined

  if (existing) return toPropertyDefinition(existing)

  const id = uuid()
  const maxOrder = (
    db
      .prepare(
        "SELECT MAX(sort_order) as m FROM property_definitions WHERE vault_id = ?"
      )
      .get(vaultId) as { m: number | null }
  ).m ?? -1

  db.prepare(
    `INSERT INTO property_definitions (id, vault_id, name, type, sort_order)
     VALUES (?, ?, ?, ?, ?)`
  ).run(id, vaultId, name, type, maxOrder + 1)

  return toPropertyDefinition(
    db.prepare("SELECT * FROM property_definitions WHERE id = ?").get(id) as Record<string, unknown>
  )
}

export function updatePropertyDefinition(
  id: string,
  vaultId: string,
  updates: { name?: string; type?: PropertyType; options?: string[] }
): PropertyDefinition {
  const db = getDb()
  const existing = db
    .prepare(
      "SELECT * FROM property_definitions WHERE id = ? AND vault_id = ?"
    )
    .get(id, vaultId) as Record<string, unknown> | undefined

  if (!existing) throw new Error("Property definition not found")

  if (updates.name !== undefined) {
    db.prepare(
      "UPDATE property_definitions SET name = ? WHERE id = ?"
    ).run(updates.name, id)
  }
  if (updates.type !== undefined) {
    db.prepare(
      "UPDATE property_definitions SET type = ? WHERE id = ?"
    ).run(updates.type, id)
  }
  if (updates.options !== undefined) {
    db.prepare(
      "UPDATE property_definitions SET options = ? WHERE id = ?"
    ).run(JSON.stringify(updates.options), id)
  }

  return toPropertyDefinition(
    db.prepare("SELECT * FROM property_definitions WHERE id = ?").get(id) as Record<string, unknown>
  )
}

export function deletePropertyDefinition(id: string, vaultId: string): void {
  const db = getDb()
  db.prepare(
    "DELETE FROM property_definitions WHERE id = ? AND vault_id = ?"
  ).run(id, vaultId)
}

// ── Note Property Read/Write ──

export function getNoteProperties(
  noteId: string,
  vaultId: string
): NoteProperty[] {
  const db = getDb()
  const rows = db
    .prepare(
      `SELECT np.property_id, np.value_text, np.value_number,
              pd.name, pd.type, pd.options
       FROM note_properties np
       JOIN property_definitions pd ON pd.id = np.property_id
       WHERE np.note_id = ? AND pd.vault_id = ?
       ORDER BY pd.sort_order, pd.name`
    )
    .all(noteId, vaultId) as {
    property_id: string
    value_text: string | null
    value_number: number | null
    name: string
    type: PropertyType
    options: string | null
  }[]

  return rows.map((r) => ({
    propertyId: r.property_id,
    name: r.name,
    type: r.type,
    value: deserializeValue(r.type, r.value_text),
  }))
}

export function setNoteProperty(
  noteId: string,
  userId: string,
  vaultId: string,
  propertyName: string,
  value: unknown,
  propertyType?: PropertyType
): void {
  const db = getDb()

  // Get or create the property definition
  const inferredType = propertyType ?? inferType(value)
  const propDef = getOrCreatePropertyDefinition(vaultId, propertyName, inferredType)

  // Auto-register select options
  if (
    (propDef.type === "select" || propDef.type === "multi_select") &&
    value !== null &&
    value !== undefined
  ) {
    autoRegisterOptions(propDef, value)
  }

  // Serialize values
  const textVal = serializeValue(propDef.type, value)
  const numVal = toNumericValue(propDef.type, value)

  // Upsert note_properties
  db.prepare(
    `INSERT INTO note_properties (note_id, property_id, value_text, value_number)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(note_id, property_id) DO UPDATE SET value_text = ?, value_number = ?`
  ).run(noteId, propDef.id, textVal, numVal, textVal, numVal)

  // Write to frontmatter on disk
  writeFrontmatterProperty(noteId, userId, vaultId, propertyName, value)
}

export function removeNoteProperty(
  noteId: string,
  userId: string,
  vaultId: string,
  propertyName: string
): void {
  const db = getDb()

  const propDef = db
    .prepare(
      "SELECT id FROM property_definitions WHERE vault_id = ? AND name = ?"
    )
    .get(vaultId, propertyName) as { id: string } | undefined

  if (propDef) {
    db.prepare(
      "DELETE FROM note_properties WHERE note_id = ? AND property_id = ?"
    ).run(noteId, propDef.id)
  }

  // Remove from frontmatter on disk
  writeFrontmatterProperty(noteId, userId, vaultId, propertyName, null)
}

// ── Sync frontmatter from disk into SQLite index ──

export function syncNoteProperties(
  noteId: string,
  userId: string,
  vaultId: string
): void {
  const db = getDb()
  const row = db
    .prepare(
      "SELECT file_path, note_type FROM notes WHERE id = ? AND user_id = ? AND vault_id = ?"
    )
    .get(noteId, userId, vaultId) as
    | { file_path: string; note_type: string }
    | undefined

  if (!row || row.note_type !== "markdown") return

  const vaultRoot = getVaultPath(vaultId)
  const fullPath = safeResolvePath(vaultRoot, row.file_path)

  let raw: string
  try {
    raw = fs.readFileSync(fullPath, "utf-8")
  } catch {
    return
  }

  const { data } = parseFrontmatter(raw)

  // Get current indexed properties for this note
  const currentProps = db
    .prepare(
      `SELECT pd.name, np.property_id
       FROM note_properties np
       JOIN property_definitions pd ON pd.id = np.property_id
       WHERE np.note_id = ? AND pd.vault_id = ?`
    )
    .all(noteId, vaultId) as { name: string; property_id: string }[]

  const currentNames = new Set(currentProps.map((p) => p.name))
  const frontmatterNames = new Set(
    Object.keys(data).filter((k) => !RESERVED_KEYS.has(k))
  )

  // Remove properties that no longer exist in frontmatter
  for (const prop of currentProps) {
    if (!frontmatterNames.has(prop.name)) {
      db.prepare(
        "DELETE FROM note_properties WHERE note_id = ? AND property_id = ?"
      ).run(noteId, prop.property_id)
    }
  }

  // Upsert properties from frontmatter
  for (const [key, value] of Object.entries(data)) {
    if (RESERVED_KEYS.has(key)) continue

    const inferredType = inferType(value)
    const propDef = getOrCreatePropertyDefinition(vaultId, key, inferredType)

    if (
      (propDef.type === "select" || propDef.type === "multi_select") &&
      value !== null &&
      value !== undefined
    ) {
      autoRegisterOptions(propDef, value)
    }

    const textVal = serializeValue(propDef.type, value)
    const numVal = toNumericValue(propDef.type, value)

    db.prepare(
      `INSERT INTO note_properties (note_id, property_id, value_text, value_number)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(note_id, property_id) DO UPDATE SET value_text = ?, value_number = ?`
    ).run(noteId, propDef.id, textVal, numVal, textVal, numVal)
  }
}

export function reindexFolderProperties(
  folderId: string | null,
  userId: string,
  vaultId: string
): void {
  const db = getDb()
  let notes: { id: string }[]

  if (folderId) {
    notes = db
      .prepare(
        "SELECT id FROM notes WHERE parent_id = ? AND user_id = ? AND vault_id = ? AND is_trashed = 0 AND note_type = 'markdown'"
      )
      .all(folderId, userId, vaultId) as { id: string }[]
  } else {
    notes = db
      .prepare(
        "SELECT id FROM notes WHERE user_id = ? AND vault_id = ? AND is_trashed = 0 AND note_type = 'markdown'"
      )
      .all(userId, vaultId) as { id: string }[]
  }

  for (const note of notes) {
    syncNoteProperties(note.id, userId, vaultId)
  }
}

// ── Helpers ──

function toPropertyDefinition(row: Record<string, unknown>): PropertyDefinition {
  return {
    id: row.id as string,
    vaultId: row.vault_id as string,
    name: row.name as string,
    type: row.type as PropertyType,
    options: row.options ? JSON.parse(row.options as string) : null,
    sortOrder: row.sort_order as number,
    createdAt: row.created_at as string,
  }
}

function inferType(value: unknown): PropertyType {
  if (typeof value === "boolean") return "checkbox"
  if (typeof value === "number") return "number"
  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) return "date"
    if (/^https?:\/\//.test(value)) return "url"
  }
  if (Array.isArray(value)) return "multi_select"
  return "text"
}

function serializeValue(type: PropertyType, value: unknown): string | null {
  if (value === null || value === undefined) return null
  if (type === "checkbox") return value ? "true" : "false"
  if (type === "multi_select") {
    if (Array.isArray(value)) return value.join(",")
    return String(value)
  }
  return String(value)
}

function deserializeValue(
  type: PropertyType,
  textValue: string | null
): string | number | boolean | string[] | null {
  if (textValue === null) return null
  switch (type) {
    case "checkbox":
      return textValue === "true"
    case "number":
      return Number(textValue)
    case "multi_select":
      return textValue ? textValue.split(",") : []
    default:
      return textValue
  }
}

function toNumericValue(type: PropertyType, value: unknown): number | null {
  if (value === null || value === undefined) return null
  if (type === "number") {
    const n = Number(value)
    return isNaN(n) ? null : n
  }
  if (type === "date") {
    const d = new Date(String(value))
    return isNaN(d.getTime()) ? null : d.getTime()
  }
  if (type === "checkbox") {
    return value ? 1 : 0
  }
  return null
}

function autoRegisterOptions(propDef: PropertyDefinition, value: unknown): void {
  const db = getDb()
  const currentOptions: string[] = propDef.options ?? []
  const newValues =
    propDef.type === "multi_select" && Array.isArray(value)
      ? value.map(String)
      : [String(value)]

  let changed = false
  for (const v of newValues) {
    if (v && !currentOptions.includes(v)) {
      currentOptions.push(v)
      changed = true
    }
  }

  if (changed) {
    db.prepare(
      "UPDATE property_definitions SET options = ? WHERE id = ?"
    ).run(JSON.stringify(currentOptions), propDef.id)
    propDef.options = currentOptions
  }
}

function writeFrontmatterProperty(
  noteId: string,
  userId: string,
  vaultId: string,
  key: string,
  value: unknown
): void {
  const db = getDb()
  const row = db
    .prepare(
      "SELECT file_path, note_type FROM notes WHERE id = ? AND user_id = ? AND vault_id = ?"
    )
    .get(noteId, userId, vaultId) as
    | { file_path: string; note_type: string }
    | undefined

  if (!row || row.note_type !== "markdown") return

  const vaultRoot = getVaultPath(vaultId)
  const fullPath = safeResolvePath(vaultRoot, row.file_path)

  try {
    const raw = fs.readFileSync(fullPath, "utf-8")
    const updated = setFrontmatterField(raw, key, value)
    fs.writeFileSync(fullPath, updated, "utf-8")
  } catch {
    // File may not exist
  }
}
