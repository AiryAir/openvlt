import { v4 as uuid } from "uuid"
import { getDb } from "@/lib/db"
import { saveVersion } from "@/lib/versions/service"
import type { VersionMeta } from "@/lib/versions/service"
import type { VersionTrigger } from "@/types"

/** 2 minutes idle → promote working version to snapshot */
const IDLE_TIMEOUT_MS = 2 * 60 * 1000

/** 10 minutes max continuous editing → force snapshot */
const MAX_INTERVAL_MS = 10 * 60 * 1000

/** 5 minutes no edits → session expires */
const SESSION_EXPIRE_MS = 5 * 60 * 1000

interface EditSessionRow {
  id: string
  note_id: string
  user_id: string
  started_at: string
  last_edit_at: string
  ended_at: string | null
  version_id: string | null
}

/**
 * Find the active edit session for a note+user.
 * An active session has no ended_at and last_edit_at within SESSION_EXPIRE_MS.
 */
function getActiveSession(
  noteId: string,
  userId: string
): EditSessionRow | null {
  const db = getDb()
  const cutoff = new Date(Date.now() - SESSION_EXPIRE_MS).toISOString()

  return (
    (db
      .prepare(
        `SELECT * FROM edit_sessions
         WHERE note_id = ? AND user_id = ? AND ended_at IS NULL AND last_edit_at > ?
         ORDER BY started_at DESC LIMIT 1`
      )
      .get(noteId, userId, cutoff) as EditSessionRow | undefined) ?? null
  )
}

/**
 * Promote the current working version (is_snapshot=0) for a session to a snapshot.
 */
function promoteWorkingVersion(sessionId: string): void {
  const db = getDb()
  db.prepare(
    `UPDATE note_versions SET is_snapshot = 1
     WHERE session_id = ? AND is_snapshot = 0`
  ).run(sessionId)
}

/**
 * Close an edit session: promote its working version and set ended_at.
 */
function closeSession(sessionId: string): void {
  const db = getDb()
  promoteWorkingVersion(sessionId)

  // Get the latest version for this session to link it
  const latestVersion = db
    .prepare(
      `SELECT id FROM note_versions
       WHERE session_id = ? ORDER BY version_number DESC LIMIT 1`
    )
    .get(sessionId) as { id: string } | undefined

  db.prepare(
    "UPDATE edit_sessions SET ended_at = ?, version_id = ? WHERE id = ?"
  ).run(new Date().toISOString(), latestVersion?.id ?? null, sessionId)
}

/**
 * Create a new edit session.
 */
function createSession(noteId: string, userId: string): EditSessionRow {
  const db = getDb()
  const id = uuid()
  const now = new Date().toISOString()

  db.prepare(
    `INSERT INTO edit_sessions (id, note_id, user_id, started_at, last_edit_at)
     VALUES (?, ?, ?, ?, ?)`
  ).run(id, noteId, userId, now, now)

  return {
    id,
    note_id: noteId,
    user_id: userId,
    started_at: now,
    last_edit_at: now,
    ended_at: null,
    version_id: null,
  }
}

/**
 * Save a version with session-based grouping.
 *
 * Instead of creating a new version row on every 800ms autosave, this:
 * - Maintains an edit session per note+user
 * - UPSERTs a working version (is_snapshot=0) for autosave triggers
 * - Promotes to snapshot on idle timeout, max interval, or explicit triggers
 *
 * Result: ~6-10 snapshots/hour vs ~100+ with the old approach.
 */
export function saveVersionGrouped(
  noteId: string,
  content: string,
  title: string,
  userId: string,
  trigger: VersionTrigger = "autosave"
): { versionMeta: VersionMeta | null; sessionId: string } {
  const db = getDb()
  const now = Date.now()
  const nowIso = new Date(now).toISOString()

  // Close any expired sessions for this note+user
  const expiredSessions = db
    .prepare(
      `SELECT id FROM edit_sessions
       WHERE note_id = ? AND user_id = ? AND ended_at IS NULL AND last_edit_at < ?`
    )
    .all(noteId, userId, new Date(now - SESSION_EXPIRE_MS).toISOString()) as {
    id: string
  }[]

  for (const expired of expiredSessions) {
    closeSession(expired.id)
  }

  // Find or create active session
  let session = getActiveSession(noteId, userId)
  if (!session) {
    session = createSession(noteId, userId)
  }

  const sessionId = session.id
  const lastEditAt = new Date(session.last_edit_at).getTime()
  const startedAt = new Date(session.started_at).getTime()
  const idleGap = now - lastEditAt
  const elapsed = now - startedAt

  // Determine if we should promote to snapshot
  const isExplicitTrigger =
    trigger === "navigate" ||
    trigger === "explicit" ||
    trigger === "restore" ||
    trigger === "merge"
  const isIdleTimeout = idleGap >= IDLE_TIMEOUT_MS
  const isMaxInterval = elapsed >= MAX_INTERVAL_MS
  const shouldSnapshot = isExplicitTrigger || isIdleTimeout || isMaxInterval

  if (shouldSnapshot) {
    // Promote any existing working version to snapshot
    promoteWorkingVersion(sessionId)

    // Save new content as a snapshot
    const snapshotTrigger: VersionTrigger = isExplicitTrigger
      ? trigger
      : isIdleTimeout
        ? "idle"
        : "max_interval"

    const versionMeta = saveVersion(noteId, content, title, {
      sessionId,
      isSnapshot: true,
      trigger: snapshotTrigger,
    })

    // If max interval hit, reset the session start time
    if (isMaxInterval && !isExplicitTrigger) {
      db.prepare(
        "UPDATE edit_sessions SET started_at = ?, last_edit_at = ? WHERE id = ?"
      ).run(nowIso, nowIso, sessionId)
    } else {
      db.prepare(
        "UPDATE edit_sessions SET last_edit_at = ? WHERE id = ?"
      ).run(nowIso, sessionId)
    }

    return { versionMeta, sessionId }
  }

  // Autosave: UPSERT working version (is_snapshot=0)
  const existingWorking = db
    .prepare(
      `SELECT id, content FROM note_versions
       WHERE session_id = ? AND is_snapshot = 0
       ORDER BY version_number DESC LIMIT 1`
    )
    .get(sessionId) as { id: string; content: string } | undefined

  let versionMeta: VersionMeta | null = null

  if (existingWorking) {
    // Update existing working version in-place
    if (existingWorking.content !== content) {
      db.prepare(
        `UPDATE note_versions SET content = ?, title = ?, created_at = ?
         WHERE id = ?`
      ).run(content, title, nowIso, existingWorking.id)
    }
    // Return null since we didn't create a new version
    versionMeta = null
  } else {
    // Create new working version
    versionMeta = saveVersion(noteId, content, title, {
      sessionId,
      isSnapshot: false,
      trigger: "autosave",
    })
  }

  // Update session last_edit_at
  db.prepare(
    "UPDATE edit_sessions SET last_edit_at = ? WHERE id = ?"
  ).run(nowIso, sessionId)

  return { versionMeta, sessionId }
}

/**
 * End an active edit session for a note+user.
 * Called when user navigates away or closes the note.
 */
export function endEditSession(noteId: string, userId: string): void {
  const session = getActiveSession(noteId, userId)
  if (session) {
    closeSession(session.id)
  }
}
