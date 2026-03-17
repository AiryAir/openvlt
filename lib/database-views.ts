import { v4 as uuid } from "uuid"
import { getDb } from "@/lib/db"
import { reindexFolderProperties } from "@/lib/properties"
import type {
  DatabaseView,
  DatabaseViewConfig,
  DatabaseViewType,
  DatabaseViewRow,
  PropertyType,
} from "@/types"

// ── CRUD ──

export function createView(
  name: string,
  folderId: string | null,
  viewType: DatabaseViewType,
  userId: string,
  vaultId: string
): DatabaseView {
  const db = getDb()
  const id = uuid()
  const now = new Date().toISOString()
  const config: DatabaseViewConfig = {
    visibleProperties: [],
    sorts: [],
    filters: [],
  }

  db.prepare(
    `INSERT INTO database_views (id, vault_id, user_id, name, folder_id, view_type, config, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, vaultId, userId, name, folderId, viewType, JSON.stringify(config), now, now)

  // Index frontmatter properties for notes in this folder
  reindexFolderProperties(folderId, userId, vaultId)

  return toView(
    db.prepare("SELECT * FROM database_views WHERE id = ?").get(id) as Record<string, unknown>
  )
}

export function getView(
  id: string,
  userId: string,
  vaultId: string
): DatabaseView | null {
  const db = getDb()
  const row = db
    .prepare(
      "SELECT * FROM database_views WHERE id = ? AND user_id = ? AND vault_id = ?"
    )
    .get(id, userId, vaultId) as Record<string, unknown> | undefined

  return row ? toView(row) : null
}

export function updateView(
  id: string,
  userId: string,
  vaultId: string,
  updates: {
    name?: string
    viewType?: DatabaseViewType
    config?: DatabaseViewConfig
  }
): DatabaseView {
  const db = getDb()
  const now = new Date().toISOString()

  if (updates.name !== undefined) {
    db.prepare(
      "UPDATE database_views SET name = ?, updated_at = ? WHERE id = ? AND user_id = ? AND vault_id = ?"
    ).run(updates.name, now, id, userId, vaultId)
  }
  if (updates.viewType !== undefined) {
    db.prepare(
      "UPDATE database_views SET view_type = ?, updated_at = ? WHERE id = ? AND user_id = ? AND vault_id = ?"
    ).run(updates.viewType, now, id, userId, vaultId)
  }
  if (updates.config !== undefined) {
    db.prepare(
      "UPDATE database_views SET config = ?, updated_at = ? WHERE id = ? AND user_id = ? AND vault_id = ?"
    ).run(JSON.stringify(updates.config), now, id, userId, vaultId)
  }

  const row = db
    .prepare("SELECT * FROM database_views WHERE id = ?")
    .get(id) as Record<string, unknown>

  return toView(row)
}

export function deleteView(
  id: string,
  userId: string,
  vaultId: string
): void {
  const db = getDb()
  db.prepare(
    "DELETE FROM database_views WHERE id = ? AND user_id = ? AND vault_id = ?"
  ).run(id, userId, vaultId)
}

export function listViews(
  userId: string,
  vaultId: string
): DatabaseView[] {
  const db = getDb()
  const rows = db
    .prepare(
      "SELECT * FROM database_views WHERE user_id = ? AND vault_id = ? ORDER BY name"
    )
    .all(userId, vaultId) as Record<string, unknown>[]

  return rows.map(toView)
}

// ── Query Engine ──

export function queryView(
  viewId: string,
  userId: string,
  vaultId: string
): { view: DatabaseView; rows: DatabaseViewRow[] } | null {
  const view = getView(viewId, userId, vaultId)
  if (!view) return null

  const db = getDb()

  // Get notes in scope
  let notesQuery: string
  let notesParams: unknown[]

  if (view.folderId) {
    notesQuery = `SELECT id, title, icon, created_at, updated_at
                  FROM notes
                  WHERE parent_id = ? AND user_id = ? AND vault_id = ? AND is_trashed = 0 AND note_type = 'markdown'`
    notesParams = [view.folderId, userId, vaultId]
  } else {
    notesQuery = `SELECT id, title, icon, created_at, updated_at
                  FROM notes
                  WHERE user_id = ? AND vault_id = ? AND is_trashed = 0 AND note_type = 'markdown'`
    notesParams = [userId, vaultId]
  }

  const notes = db.prepare(notesQuery).all(...notesParams) as {
    id: string
    title: string
    icon: string | null
    created_at: string
    updated_at: string
  }[]

  if (notes.length === 0) return { view, rows: [] }

  // Get all property definitions for this vault
  const propDefs = db
    .prepare(
      "SELECT id, name, type FROM property_definitions WHERE vault_id = ? ORDER BY sort_order, name"
    )
    .all(vaultId) as { id: string; name: string; type: PropertyType }[]

  const propById = new Map(propDefs.map((p) => [p.id, p]))
  const noteIds = notes.map((n) => n.id)

  // Batch-load all properties for these notes
  const placeholders = noteIds.map(() => "?").join(",")
  const allProps = db
    .prepare(
      `SELECT np.note_id, np.property_id, np.value_text, np.value_number
       FROM note_properties np
       WHERE np.note_id IN (${placeholders})`
    )
    .all(...noteIds) as {
    note_id: string
    property_id: string
    value_text: string | null
    value_number: number | null
  }[]

  // Group properties by note
  const propsByNote = new Map<string, Map<string, string | null>>()
  for (const p of allProps) {
    if (!propsByNote.has(p.note_id)) {
      propsByNote.set(p.note_id, new Map())
    }
    propsByNote.get(p.note_id)!.set(p.property_id, p.value_text)
  }

  // Build rows
  let rows: DatabaseViewRow[] = notes.map((n) => {
    const noteProps = propsByNote.get(n.id) ?? new Map()
    const properties: Record<string, string | number | boolean | string[] | null> = {}

    for (const def of propDefs) {
      const textVal = noteProps.get(def.id) ?? null
      properties[def.name] = deserializeValue(def.type, textVal)
    }

    return {
      noteId: n.id,
      title: n.title,
      icon: n.icon,
      createdAt: n.created_at,
      updatedAt: n.updated_at,
      properties,
    }
  })

  // Apply filters
  for (const filter of view.config.filters) {
    const def = propById.get(filter.propertyId)
    if (!def) continue

    rows = rows.filter((row) => {
      const val = row.properties[def.name]
      return applyFilter(val, filter.operator, filter.value, def.type)
    })
  }

  // Apply sorts
  if (view.config.sorts.length > 0) {
    rows.sort((a, b) => {
      for (const sort of view.config.sorts) {
        const def = propById.get(sort.propertyId)
        if (!def) continue
        const aVal = a.properties[def.name]
        const bVal = b.properties[def.name]
        const cmp = compareValues(aVal, bVal, def.type)
        if (cmp !== 0) return sort.direction === "asc" ? cmp : -cmp
      }
      return 0
    })
  }

  return { view, rows }
}

// ── Helpers ──

function toView(row: Record<string, unknown>): DatabaseView {
  let config: DatabaseViewConfig
  try {
    config = JSON.parse(row.config as string)
  } catch {
    config = { visibleProperties: [], sorts: [], filters: [] }
  }

  return {
    id: row.id as string,
    vaultId: row.vault_id as string,
    userId: row.user_id as string,
    name: row.name as string,
    folderId: (row.folder_id as string) || null,
    viewType: row.view_type as DatabaseViewType,
    config,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
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

function applyFilter(
  value: unknown,
  operator: string,
  filterValue: string,
  type: PropertyType
): boolean {
  const strVal = value === null || value === undefined ? "" : String(value)

  switch (operator) {
    case "is_empty":
      return !strVal
    case "is_not_empty":
      return !!strVal
    case "eq":
      return strVal === filterValue
    case "neq":
      return strVal !== filterValue
    case "contains":
      return strVal.toLowerCase().includes(filterValue.toLowerCase())
    case "not_contains":
      return !strVal.toLowerCase().includes(filterValue.toLowerCase())
    case "gt":
    case "lt":
    case "gte":
    case "lte": {
      const a = type === "number" ? Number(strVal) : strVal
      const b = type === "number" ? Number(filterValue) : filterValue
      if (operator === "gt") return a > b
      if (operator === "lt") return a < b
      if (operator === "gte") return a >= b
      return a <= b
    }
    default:
      return true
  }
}

function compareValues(
  a: unknown,
  b: unknown,
  type: PropertyType
): number {
  if (a === null && b === null) return 0
  if (a === null) return 1
  if (b === null) return -1

  if (type === "number") {
    return Number(a) - Number(b)
  }
  if (type === "checkbox") {
    return (a ? 1 : 0) - (b ? 1 : 0)
  }
  return String(a).localeCompare(String(b))
}
