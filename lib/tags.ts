import { v4 as uuid } from "uuid"
import { getDb } from "@/lib/db"

export interface Tag {
  id: string
  name: string
  userId: string
}

export function createTag(
  userId: string,
  name: string,
  vaultId: string
): Tag {
  const db = getDb()
  const trimmed = name.trim()

  if (!trimmed) throw new Error("Tag name is required")

  const existing = db
    .prepare("SELECT id FROM tags WHERE name = ? AND vault_id = ?")
    .get(trimmed, vaultId) as { id: string } | undefined

  if (existing) throw new Error("Tag already exists")

  const id = uuid()
  db.prepare(
    "INSERT INTO tags (id, name, user_id, vault_id) VALUES (?, ?, ?, ?)"
  ).run(id, trimmed, userId, vaultId)

  return { id, name: trimmed, userId }
}

export function deleteTag(
  userId: string,
  tagId: string,
  vaultId: string
): void {
  const db = getDb()
  const result = db
    .prepare(
      "DELETE FROM tags WHERE id = ? AND user_id = ? AND vault_id = ?"
    )
    .run(tagId, userId, vaultId)

  if (result.changes === 0) throw new Error("Tag not found")
}

export function listTags(userId: string, vaultId: string): Tag[] {
  const db = getDb()
  const rows = db
    .prepare(
      "SELECT id, name, user_id FROM tags WHERE user_id = ? AND vault_id = ? ORDER BY name"
    )
    .all(userId, vaultId) as { id: string; name: string; user_id: string }[]

  return rows.map((r) => ({ id: r.id, name: r.name, userId: r.user_id }))
}

export function addTagToNote(noteId: string, tagId: string): void {
  const db = getDb()

  const existing = db
    .prepare("SELECT 1 FROM note_tags WHERE note_id = ? AND tag_id = ?")
    .get(noteId, tagId)

  if (existing) return

  db.prepare("INSERT INTO note_tags (note_id, tag_id) VALUES (?, ?)").run(
    noteId,
    tagId
  )
}

export function removeTagFromNote(noteId: string, tagId: string): void {
  const db = getDb()
  db.prepare("DELETE FROM note_tags WHERE note_id = ? AND tag_id = ?").run(
    noteId,
    tagId
  )
}

export function getNoteTags(noteId: string): Tag[] {
  const db = getDb()
  const rows = db
    .prepare(
      `SELECT t.id, t.name, t.user_id FROM tags t
       JOIN note_tags nt ON nt.tag_id = t.id
       WHERE nt.note_id = ?
       ORDER BY t.name`
    )
    .all(noteId) as { id: string; name: string; user_id: string }[]

  return rows.map((r) => ({ id: r.id, name: r.name, userId: r.user_id }))
}

export function getNotesByTag(
  userId: string,
  tagId: string,
  vaultId: string
): { noteId: string }[] {
  const db = getDb()

  const tag = db
    .prepare(
      "SELECT id FROM tags WHERE id = ? AND user_id = ? AND vault_id = ?"
    )
    .get(tagId, userId, vaultId)

  if (!tag) throw new Error("Tag not found")

  const rows = db
    .prepare(
      `SELECT n.id as note_id FROM notes n
       JOIN note_tags nt ON nt.note_id = n.id
       WHERE nt.tag_id = ? AND n.is_trashed = 0
       ORDER BY n.updated_at DESC`
    )
    .all(tagId) as { note_id: string }[]

  return rows.map((r) => ({ noteId: r.note_id }))
}
