import fs from "fs"
import path from "path"
import { v4 as uuid } from "uuid"
import { getDb } from "@/lib/db"
import { getVaultPath } from "@/lib/vaults/service"
import type { VersionTrigger } from "@/types"

export interface VersionMeta {
  id: string
  noteId: string
  title: string
  versionNumber: number
  createdAt: string
  sessionId: string | null
  isSnapshot: boolean
  trigger: VersionTrigger
}

export interface Version extends VersionMeta {
  content: string
}

export function saveVersion(
  noteId: string,
  content: string,
  title: string,
  options: {
    sessionId?: string
    isSnapshot?: boolean
    trigger?: VersionTrigger
  } = {}
): VersionMeta | null {
  const db = getDb()

  const last = db
    .prepare(
      `SELECT content, version_number FROM note_versions
       WHERE note_id = ? ORDER BY version_number DESC LIMIT 1`
    )
    .get(noteId) as { content: string; version_number: number } | undefined

  if (last && last.content === content) return null

  const versionNumber = last ? last.version_number + 1 : 1
  const id = uuid()
  const now = new Date().toISOString()
  const sessionId = options.sessionId ?? null
  const isSnapshot = options.isSnapshot ?? true
  const trigger = options.trigger ?? "autosave"

  db.prepare(
    `INSERT INTO note_versions (id, note_id, content, title, created_at, version_number, session_id, is_snapshot, trigger)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, noteId, content, title, now, versionNumber, sessionId, isSnapshot ? 1 : 0, trigger)

  return {
    id,
    noteId,
    title,
    versionNumber,
    createdAt: now,
    sessionId,
    isSnapshot,
    trigger,
  }
}

export function listVersions(
  noteId: string,
  includeWorking: boolean = false
): VersionMeta[] {
  const db = getDb()
  const query = includeWorking
    ? `SELECT id, note_id, title, version_number, created_at, session_id, is_snapshot, trigger
       FROM note_versions WHERE note_id = ?
       ORDER BY version_number DESC`
    : `SELECT id, note_id, title, version_number, created_at, session_id, is_snapshot, trigger
       FROM note_versions WHERE note_id = ? AND is_snapshot = 1
       ORDER BY version_number DESC`

  const rows = db.prepare(query).all(noteId) as {
    id: string
    note_id: string
    title: string
    version_number: number
    created_at: string
    session_id: string | null
    is_snapshot: number
    trigger: string
  }[]

  return rows.map((r) => ({
    id: r.id,
    noteId: r.note_id,
    title: r.title,
    versionNumber: r.version_number,
    createdAt: r.created_at,
    sessionId: r.session_id,
    isSnapshot: r.is_snapshot === 1,
    trigger: r.trigger as VersionTrigger,
  }))
}

export function getVersion(versionId: string): Version | null {
  const db = getDb()
  const row = db
    .prepare(
      `SELECT id, note_id, content, title, version_number, created_at, session_id, is_snapshot, trigger
       FROM note_versions WHERE id = ?`
    )
    .get(versionId) as
    | {
        id: string
        note_id: string
        content: string
        title: string
        version_number: number
        created_at: string
        session_id: string | null
        is_snapshot: number
        trigger: string
      }
    | undefined

  if (!row) return null

  return {
    id: row.id,
    noteId: row.note_id,
    content: row.content,
    title: row.title,
    versionNumber: row.version_number,
    createdAt: row.created_at,
    sessionId: row.session_id,
    isSnapshot: row.is_snapshot === 1,
    trigger: row.trigger as VersionTrigger,
  }
}

export function restoreVersion(
  noteId: string,
  versionId: string,
  userId: string,
  vaultId: string
): Version {
  const db = getDb()
  const vaultRoot = getVaultPath(vaultId)

  const version = getVersion(versionId)
  if (!version) throw new Error("Version not found")
  if (version.noteId !== noteId)
    throw new Error("Version does not belong to this note")

  const note = db
    .prepare(
      "SELECT title FROM notes WHERE id = ? AND user_id = ? AND vault_id = ?"
    )
    .get(noteId, userId, vaultId) as { title: string } | undefined

  if (!note) throw new Error("Note not found")

  // Save current state as a new version before restoring
  const currentNote = db
    .prepare(
      "SELECT file_path FROM notes WHERE id = ? AND user_id = ? AND vault_id = ?"
    )
    .get(noteId, userId, vaultId) as { file_path: string }

  const fullPath = path.join(vaultRoot, currentNote.file_path)
  let currentContent = ""
  try {
    currentContent = fs.readFileSync(fullPath, "utf-8")
  } catch {
    // file may not exist
  }

  saveVersion(noteId, currentContent, note.title, { trigger: "restore", isSnapshot: true })

  // Restore the old version content to disk
  fs.writeFileSync(fullPath, version.content, "utf-8")

  const now = new Date().toISOString()
  db.prepare(
    "UPDATE notes SET updated_at = ? WHERE id = ? AND user_id = ? AND vault_id = ?"
  ).run(now, noteId, userId, vaultId)

  return version
}

export function pruneVersions(
  userId: string,
  retentionDays: number
): number {
  const db = getDb()
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - retentionDays)
  const cutoffStr = cutoff.toISOString()

  const result = db
    .prepare(
      `DELETE FROM note_versions WHERE created_at < ?
       AND note_id IN (SELECT id FROM notes WHERE user_id = ?)`
    )
    .run(cutoffStr, userId)

  return result.changes
}

export function getVersionCount(noteId: string): number {
  const db = getDb()
  const row = db
    .prepare(
      "SELECT COUNT(*) as count FROM note_versions WHERE note_id = ? AND is_snapshot = 1"
    )
    .get(noteId) as { count: number }

  return row.count
}
