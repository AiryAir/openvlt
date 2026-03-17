import { v4 as uuid } from "uuid"
import { getDb } from "@/lib/db"
import type { SyncedBlock } from "@/types"

export function createSyncedBlock(
  content: string,
  userId: string,
  vaultId: string
): SyncedBlock {
  const db = getDb()
  const id = uuid()
  const now = new Date().toISOString()

  db.prepare(
    `INSERT INTO synced_blocks (id, vault_id, user_id, content, version, created_at, updated_at)
     VALUES (?, ?, ?, ?, 1, ?, ?)`
  ).run(id, vaultId, userId, content, now, now)

  return { id, vaultId, userId, content, version: 1, createdAt: now, updatedAt: now }
}

export function getSyncedBlock(
  id: string,
  userId: string,
  vaultId: string
): SyncedBlock | null {
  const db = getDb()
  const row = db
    .prepare(
      "SELECT * FROM synced_blocks WHERE id = ? AND user_id = ? AND vault_id = ?"
    )
    .get(id, userId, vaultId) as Record<string, unknown> | undefined

  return row ? toBlock(row) : null
}

export function updateSyncedBlock(
  id: string,
  content: string,
  userId: string,
  vaultId: string
): SyncedBlock | null {
  const db = getDb()
  const now = new Date().toISOString()

  const result = db.prepare(
    `UPDATE synced_blocks SET content = ?, version = version + 1, updated_at = ?
     WHERE id = ? AND user_id = ? AND vault_id = ?`
  ).run(content, now, id, userId, vaultId)

  if (result.changes === 0) return null

  const row = db.prepare("SELECT * FROM synced_blocks WHERE id = ?").get(id) as Record<string, unknown>
  return toBlock(row)
}

export function deleteSyncedBlock(
  id: string,
  userId: string,
  vaultId: string
): boolean {
  const db = getDb()
  const result = db.prepare(
    "DELETE FROM synced_blocks WHERE id = ? AND user_id = ? AND vault_id = ?"
  ).run(id, userId, vaultId)
  return result.changes > 0
}

export function listSyncedBlocks(
  userId: string,
  vaultId: string
): SyncedBlock[] {
  const db = getDb()
  const rows = db
    .prepare(
      "SELECT * FROM synced_blocks WHERE user_id = ? AND vault_id = ? ORDER BY updated_at DESC"
    )
    .all(userId, vaultId) as Record<string, unknown>[]

  return rows.map(toBlock)
}

export function upsertBlockRef(blockId: string, noteId: string): void {
  const db = getDb()
  db.prepare(
    "INSERT OR IGNORE INTO synced_block_refs (synced_block_id, note_id) VALUES (?, ?)"
  ).run(blockId, noteId)
}

export function removeBlockRef(blockId: string, noteId: string): void {
  const db = getDb()
  db.prepare(
    "DELETE FROM synced_block_refs WHERE synced_block_id = ? AND note_id = ?"
  ).run(blockId, noteId)
}

export function getBlockRefCount(blockId: string): number {
  const db = getDb()
  const row = db
    .prepare("SELECT COUNT(*) as count FROM synced_block_refs WHERE synced_block_id = ?")
    .get(blockId) as { count: number }
  return row.count
}

function toBlock(row: Record<string, unknown>): SyncedBlock {
  return {
    id: row.id as string,
    vaultId: row.vault_id as string,
    userId: row.user_id as string,
    content: row.content as string,
    version: row.version as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}
