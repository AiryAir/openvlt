import fs from "fs"
import path from "path"
import { v4 as uuid } from "uuid"
import { getDb } from "@/lib/db"
import { getVaultPath } from "@/lib/vaults/service"
import type { AttachmentVersion } from "@/types"

/**
 * Version an attachment before it gets overwritten.
 * Copies the old file to .versions/attachments/{attachmentId}/{timestamp}-{fileName}
 */
export function versionAttachment(
  attachmentId: string,
  noteId: string,
  vaultId: string,
  oldFilePath: string,
  fileName: string,
  mimeType: string,
  sizeBytes: number
): AttachmentVersion | null {
  const vaultRoot = getVaultPath(vaultId)
  const oldFullPath = path.join(vaultRoot, oldFilePath)

  // Check the source file exists
  if (!fs.existsSync(oldFullPath)) return null

  // Create version directory
  const versionDir = path.join(
    vaultRoot,
    ".versions",
    "attachments",
    attachmentId
  )
  fs.mkdirSync(versionDir, { recursive: true })

  // Copy old file to version directory
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
  const versionFileName = `${timestamp}-${fileName}`
  const versionFullPath = path.join(versionDir, versionFileName)
  fs.copyFileSync(oldFullPath, versionFullPath)

  // Record in database
  const db = getDb()
  const id = uuid()
  const now = new Date().toISOString()
  const versionPath = path.relative(vaultRoot, versionFullPath)

  db.prepare(
    `INSERT INTO attachment_versions (id, attachment_id, note_id, file_name, version_path, mime_type, size_bytes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, attachmentId, noteId, fileName, versionPath, mimeType, sizeBytes, now)

  return {
    id,
    attachmentId,
    noteId,
    fileName,
    versionPath,
    mimeType,
    sizeBytes,
    createdAt: now,
  }
}

/**
 * List all versions of a specific attachment.
 */
export function listAttachmentVersions(
  attachmentId: string,
  userId: string,
  vaultId: string
): AttachmentVersion[] {
  const db = getDb()

  const rows = db
    .prepare(
      `SELECT av.* FROM attachment_versions av
       JOIN notes n ON n.id = av.note_id
       WHERE av.attachment_id = ? AND n.user_id = ? AND n.vault_id = ?
       ORDER BY av.created_at DESC`
    )
    .all(attachmentId, userId, vaultId) as {
    id: string
    attachment_id: string
    note_id: string
    file_name: string
    version_path: string
    mime_type: string
    size_bytes: number
    created_at: string
  }[]

  return rows.map((r) => ({
    id: r.id,
    attachmentId: r.attachment_id,
    noteId: r.note_id,
    fileName: r.file_name,
    versionPath: r.version_path,
    mimeType: r.mime_type,
    sizeBytes: r.size_bytes,
    createdAt: r.created_at,
  }))
}

/**
 * Restore an old attachment version, making it the current version.
 */
export function restoreAttachmentVersion(
  versionId: string,
  userId: string,
  vaultId: string
): void {
  const db = getDb()
  const vaultRoot = getVaultPath(vaultId)

  const version = db
    .prepare(
      `SELECT av.*, a.file_path as current_file_path
       FROM attachment_versions av
       JOIN notes n ON n.id = av.note_id
       LEFT JOIN attachments a ON a.id = av.attachment_id
       WHERE av.id = ? AND n.user_id = ? AND n.vault_id = ?`
    )
    .get(versionId, userId, vaultId) as
    | {
        id: string
        attachment_id: string
        note_id: string
        file_name: string
        version_path: string
        mime_type: string
        size_bytes: number
        current_file_path: string | null
      }
    | undefined

  if (!version) throw new Error("Attachment version not found")

  const versionFullPath = path.join(vaultRoot, version.version_path)
  if (!fs.existsSync(versionFullPath)) {
    throw new Error("Version file not found on disk")
  }

  // If the current attachment still exists, version it before restoring
  if (version.current_file_path) {
    const currentFullPath = path.join(vaultRoot, version.current_file_path)
    if (fs.existsSync(currentFullPath)) {
      const currentStats = fs.statSync(currentFullPath)
      versionAttachment(
        version.attachment_id,
        version.note_id,
        vaultId,
        version.current_file_path,
        version.file_name,
        version.mime_type,
        currentStats.size
      )
    }

    // Restore old version over current file
    fs.copyFileSync(versionFullPath, path.join(vaultRoot, version.current_file_path))

    // Update attachment size
    const restoredStats = fs.statSync(versionFullPath)
    db.prepare("UPDATE attachments SET size_bytes = ? WHERE id = ?").run(
      restoredStats.size,
      version.attachment_id
    )
  }
}

/**
 * Prune old attachment versions beyond retention period.
 * Deletes both the files on disk and DB records.
 */
export function pruneAttachmentVersions(retentionDays: number): number {
  const db = getDb()
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - retentionDays)
  const cutoffStr = cutoff.toISOString()

  const oldVersions = db
    .prepare(
      `SELECT av.id, av.version_path, n.vault_id
       FROM attachment_versions av
       JOIN notes n ON n.id = av.note_id
       WHERE av.created_at < ?`
    )
    .all(cutoffStr) as { id: string; version_path: string; vault_id: string }[]

  let deleted = 0
  for (const v of oldVersions) {
    try {
      const vaultRoot = getVaultPath(v.vault_id)
      const fullPath = path.join(vaultRoot, v.version_path)
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath)
      }
    } catch {
      // Non-critical
    }
    db.prepare("DELETE FROM attachment_versions WHERE id = ?").run(v.id)
    deleted++
  }

  // Clean up empty version directories
  try {
    const vaults = db
      .prepare("SELECT DISTINCT vault_id FROM attachment_versions")
      .all() as { vault_id: string }[]

    for (const v of vaults) {
      const vaultRoot = getVaultPath(v.vault_id)
      const versionsDir = path.join(vaultRoot, ".versions", "attachments")
      if (fs.existsSync(versionsDir)) {
        const dirs = fs.readdirSync(versionsDir)
        for (const dir of dirs) {
          const dirPath = path.join(versionsDir, dir)
          try {
            const files = fs.readdirSync(dirPath)
            if (files.length === 0) {
              fs.rmdirSync(dirPath)
            }
          } catch {
            // Skip
          }
        }
      }
    }
  } catch {
    // Non-critical cleanup
  }

  return deleted
}
