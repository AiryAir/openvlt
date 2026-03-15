import { v4 as uuid } from "uuid"
import { getDb } from "@/lib/db"
import type { StructureEvent, StructureEventType } from "@/types"

/**
 * Record a structural change event (create, move, rename, delete, etc.)
 */
export function recordStructureEvent(
  vaultId: string,
  userId: string,
  eventType: StructureEventType,
  entityType: "note" | "folder" | "attachment",
  entityId: string,
  fromState: Record<string, unknown> | null,
  toState: Record<string, unknown> | null,
  metadata?: Record<string, unknown>
): void {
  const db = getDb()
  const id = uuid()
  const now = new Date().toISOString()

  db.prepare(
    `INSERT INTO structure_events (id, vault_id, user_id, event_type, entity_type, entity_id, from_state, to_state, metadata, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    vaultId,
    userId,
    eventType,
    entityType,
    entityId,
    fromState ? JSON.stringify(fromState) : null,
    toState ? JSON.stringify(toState) : null,
    metadata ? JSON.stringify(metadata) : null,
    now
  )
}

/**
 * List structure events with optional filters.
 */
export function listStructureEvents(
  vaultId: string,
  options: {
    entityType?: "note" | "folder" | "attachment"
    entityId?: string
    since?: string
    until?: string
    limit?: number
    offset?: number
  } = {}
): { events: StructureEvent[]; total: number } {
  const db = getDb()
  const conditions = ["vault_id = ?"]
  const params: unknown[] = [vaultId]

  if (options.entityType) {
    conditions.push("entity_type = ?")
    params.push(options.entityType)
  }
  if (options.entityId) {
    conditions.push("entity_id = ?")
    params.push(options.entityId)
  }
  if (options.since) {
    conditions.push("created_at >= ?")
    params.push(options.since)
  }
  if (options.until) {
    conditions.push("created_at <= ?")
    params.push(options.until)
  }

  const where = conditions.join(" AND ")

  const countRow = db
    .prepare(`SELECT COUNT(*) as count FROM structure_events WHERE ${where}`)
    .get(...params) as { count: number }

  const limit = options.limit ?? 100
  const offset = options.offset ?? 0

  const rows = db
    .prepare(
      `SELECT * FROM structure_events WHERE ${where}
       ORDER BY created_at DESC LIMIT ? OFFSET ?`
    )
    .all(...params, limit, offset) as {
    id: string
    vault_id: string
    user_id: string
    event_type: string
    entity_type: string
    entity_id: string
    from_state: string | null
    to_state: string | null
    metadata: string | null
    created_at: string
  }[]

  const events: StructureEvent[] = rows.map((r) => ({
    id: r.id,
    vaultId: r.vault_id,
    userId: r.user_id,
    eventType: r.event_type as StructureEventType,
    entityType: r.entity_type as "note" | "folder" | "attachment",
    entityId: r.entity_id,
    fromState: r.from_state ? JSON.parse(r.from_state) : null,
    toState: r.to_state ? JSON.parse(r.to_state) : null,
    metadata: r.metadata ? JSON.parse(r.metadata) : null,
    createdAt: r.created_at,
  }))

  return { events, total: countRow.count }
}

/**
 * Get the state of a folder at a specific point in time.
 * Reconstructs by starting from current state and undoing events in reverse.
 */
export function getFolderStateAtTime(
  vaultId: string,
  userId: string,
  folderId: string,
  timestamp: string
): {
  notes: { id: string; title: string; filePath: string }[]
  folders: { id: string; name: string; path: string }[]
  events: StructureEvent[]
} {
  const db = getDb()

  // Get events between timestamp and now for this folder's entities
  const events = db
    .prepare(
      `SELECT * FROM structure_events
       WHERE vault_id = ? AND created_at > ?
       AND (
         (entity_type = 'note' AND (
           json_extract(from_state, '$.parentId') = ? OR
           json_extract(to_state, '$.parentId') = ?
         ))
         OR (entity_type = 'folder' AND entity_id = ?)
       )
       ORDER BY created_at DESC`
    )
    .all(vaultId, timestamp, folderId, folderId, folderId) as {
    id: string
    vault_id: string
    user_id: string
    event_type: string
    entity_type: string
    entity_id: string
    from_state: string | null
    to_state: string | null
    metadata: string | null
    created_at: string
  }[]

  // Get current folder contents
  const currentNotes = db
    .prepare(
      `SELECT id, title, file_path FROM notes
       WHERE parent_id = ? AND user_id = ? AND vault_id = ? AND is_trashed = 0`
    )
    .all(folderId, userId, vaultId) as {
    id: string
    title: string
    file_path: string
  }[]

  const currentFolders = db
    .prepare(
      `SELECT id, name, path FROM folders
       WHERE parent_id = ? AND user_id = ? AND vault_id = ?`
    )
    .all(folderId, userId, vaultId) as {
    id: string
    name: string
    path: string
  }[]

  // Reconstruct by undoing events in reverse chronological order
  const noteMap = new Map(
    currentNotes.map((n) => [n.id, { id: n.id, title: n.title, filePath: n.file_path }])
  )
  const folderMap = new Map(
    currentFolders.map((f) => [f.id, { id: f.id, name: f.name, path: f.path }])
  )

  for (const event of events) {
    const fromState = event.from_state ? JSON.parse(event.from_state) : null
    const toState = event.to_state ? JSON.parse(event.to_state) : null

    switch (event.event_type) {
      case "note_created":
        // Note was created after timestamp → remove it
        if (toState?.parentId === folderId) {
          noteMap.delete(event.entity_id)
        }
        break

      case "note_deleted":
      case "note_trashed":
        // Note was deleted/trashed after timestamp → add it back
        if (fromState?.parentId === folderId) {
          noteMap.set(event.entity_id, {
            id: event.entity_id,
            title: fromState.title ?? "Untitled",
            filePath: fromState.filePath ?? "",
          })
        }
        break

      case "note_restored":
        // Note was restored after timestamp → it was trashed at timestamp
        if (toState?.parentId === folderId) {
          noteMap.delete(event.entity_id)
        }
        break

      case "note_moved":
        // Note was moved after timestamp → undo the move
        if (toState?.parentId === folderId && fromState?.parentId !== folderId) {
          // Moved INTO this folder after timestamp → remove
          noteMap.delete(event.entity_id)
        } else if (
          fromState?.parentId === folderId &&
          toState?.parentId !== folderId
        ) {
          // Moved OUT of this folder after timestamp → add back
          noteMap.set(event.entity_id, {
            id: event.entity_id,
            title: fromState.title ?? "Untitled",
            filePath: fromState.filePath ?? "",
          })
        }
        break

      case "note_renamed":
        // Note was renamed after timestamp → use old title
        if (fromState && noteMap.has(event.entity_id)) {
          noteMap.set(event.entity_id, {
            id: event.entity_id,
            title: fromState.title ?? noteMap.get(event.entity_id)!.title,
            filePath: fromState.filePath ?? noteMap.get(event.entity_id)!.filePath,
          })
        }
        break
    }
  }

  const parsedEvents: StructureEvent[] = events.map((r) => ({
    id: r.id,
    vaultId: r.vault_id,
    userId: r.user_id,
    eventType: r.event_type as StructureEventType,
    entityType: r.entity_type as "note" | "folder" | "attachment",
    entityId: r.entity_id,
    fromState: r.from_state ? JSON.parse(r.from_state) : null,
    toState: r.to_state ? JSON.parse(r.to_state) : null,
    metadata: r.metadata ? JSON.parse(r.metadata) : null,
    createdAt: r.created_at,
  }))

  return {
    notes: Array.from(noteMap.values()),
    folders: Array.from(folderMap.values()),
    events: parsedEvents,
  }
}

/**
 * Get the state of the entire vault at a specific point in time.
 * Reconstructs the full tree by undoing all events after the given timestamp.
 */
export function getVaultStateAtTime(
  vaultId: string,
  userId: string,
  timestamp: string
): {
  notes: { id: string; title: string; filePath: string; parentId: string | null }[]
  folders: { id: string; name: string; path: string; parentId: string | null }[]
  events: StructureEvent[]
} {
  const db = getDb()

  // Get ALL events between timestamp and now
  const events = db
    .prepare(
      `SELECT * FROM structure_events
       WHERE vault_id = ? AND created_at > ?
       ORDER BY created_at DESC`
    )
    .all(vaultId, timestamp) as {
    id: string
    vault_id: string
    user_id: string
    event_type: string
    entity_type: string
    entity_id: string
    from_state: string | null
    to_state: string | null
    metadata: string | null
    created_at: string
  }[]

  // Get current vault state
  const currentNotes = db
    .prepare(
      `SELECT id, title, file_path, parent_id FROM notes
       WHERE user_id = ? AND vault_id = ? AND is_trashed = 0`
    )
    .all(userId, vaultId) as {
    id: string
    title: string
    file_path: string
    parent_id: string | null
  }[]

  const currentFolders = db
    .prepare(
      `SELECT id, name, path, parent_id FROM folders
       WHERE user_id = ? AND vault_id = ?`
    )
    .all(userId, vaultId) as {
    id: string
    name: string
    path: string
    parent_id: string | null
  }[]

  // Reconstruct by undoing events
  const noteMap = new Map(
    currentNotes.map((n) => [
      n.id,
      { id: n.id, title: n.title, filePath: n.file_path, parentId: n.parent_id },
    ])
  )
  const folderMap = new Map(
    currentFolders.map((f) => [
      f.id,
      { id: f.id, name: f.name, path: f.path, parentId: f.parent_id },
    ])
  )

  for (const event of events) {
    const fromState = event.from_state ? JSON.parse(event.from_state) : null
    const toState = event.to_state ? JSON.parse(event.to_state) : null

    switch (event.event_type) {
      // Note events
      case "note_created":
        noteMap.delete(event.entity_id)
        break

      case "note_deleted":
      case "note_trashed":
        if (fromState) {
          noteMap.set(event.entity_id, {
            id: event.entity_id,
            title: fromState.title ?? "Untitled",
            filePath: fromState.filePath ?? "",
            parentId: fromState.parentId ?? null,
          })
        }
        break

      case "note_restored":
        // Was restored after timestamp → was trashed at timestamp, so remove
        noteMap.delete(event.entity_id)
        break

      case "note_moved":
        if (fromState && noteMap.has(event.entity_id)) {
          const note = noteMap.get(event.entity_id)!
          noteMap.set(event.entity_id, {
            ...note,
            parentId: fromState.parentId ?? null,
            filePath: fromState.filePath ?? note.filePath,
          })
        }
        break

      case "note_renamed":
        if (fromState && noteMap.has(event.entity_id)) {
          const note = noteMap.get(event.entity_id)!
          noteMap.set(event.entity_id, {
            ...note,
            title: fromState.title ?? note.title,
            filePath: fromState.filePath ?? note.filePath,
          })
        }
        break

      // Folder events
      case "folder_created":
        folderMap.delete(event.entity_id)
        break

      case "folder_deleted":
        if (fromState) {
          folderMap.set(event.entity_id, {
            id: event.entity_id,
            name: fromState.name ?? "Untitled",
            path: fromState.path ?? "",
            parentId: fromState.parentId ?? null,
          })
        }
        break

      case "folder_moved":
        if (fromState && folderMap.has(event.entity_id)) {
          const folder = folderMap.get(event.entity_id)!
          folderMap.set(event.entity_id, {
            ...folder,
            parentId: fromState.parentId ?? null,
            path: fromState.path ?? folder.path,
          })
        }
        break

      case "folder_renamed":
        if (fromState && folderMap.has(event.entity_id)) {
          const folder = folderMap.get(event.entity_id)!
          folderMap.set(event.entity_id, {
            ...folder,
            name: fromState.name ?? folder.name,
            path: fromState.path ?? folder.path,
          })
        }
        break
    }
  }

  const parsedEvents: StructureEvent[] = events.map((r) => ({
    id: r.id,
    vaultId: r.vault_id,
    userId: r.user_id,
    eventType: r.event_type as StructureEventType,
    entityType: r.entity_type as "note" | "folder" | "attachment",
    entityId: r.entity_id,
    fromState: r.from_state ? JSON.parse(r.from_state) : null,
    toState: r.to_state ? JSON.parse(r.to_state) : null,
    metadata: r.metadata ? JSON.parse(r.metadata) : null,
    createdAt: r.created_at,
  }))

  return {
    notes: Array.from(noteMap.values()),
    folders: Array.from(folderMap.values()),
    events: parsedEvents,
  }
}

/**
 * Prune old structure events beyond retention period.
 */
export function pruneStructureEvents(
  vaultId: string,
  retentionDays: number
): number {
  const db = getDb()
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - retentionDays)

  const result = db
    .prepare("DELETE FROM structure_events WHERE vault_id = ? AND created_at < ?")
    .run(vaultId, cutoff.toISOString())

  return result.changes
}
