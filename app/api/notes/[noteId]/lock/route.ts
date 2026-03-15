import fs from "fs"
import path from "path"
import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { getVaultPath } from "@/lib/vaults/service"
import { encryptNote, decryptNote } from "@/lib/auth/crypto"
import { AuthError, requireAuthWithVault } from "@/lib/auth/middleware"

/** POST: lock or unlock a note */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    const { user, vaultId } = await requireAuthWithVault()
    const { noteId } = await params
    const body = await request.json()
    const { action, password } = body

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      )
    }

    const db = getDb()
    const vaultRoot = getVaultPath(vaultId)
    const row = db
      .prepare(
        "SELECT file_path, is_locked, lock_salt, lock_iv, lock_tag FROM notes WHERE id = ? AND user_id = ? AND vault_id = ?"
      )
      .get(noteId, user.id, vaultId) as
      | {
          file_path: string
          is_locked: number
          lock_salt: string | null
          lock_iv: string | null
          lock_tag: string | null
        }
      | undefined

    if (!row) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 })
    }

    const fullPath = path.join(vaultRoot, row.file_path)

    if (action === "lock") {
      if (row.is_locked) {
        return NextResponse.json(
          { error: "Note is already locked" },
          { status: 400 }
        )
      }

      // Read current content and encrypt it
      const content = fs.readFileSync(fullPath, "utf-8")
      const { encrypted, salt, iv, tag } = encryptNote(content, password)

      // Write encrypted content to disk
      fs.writeFileSync(fullPath, encrypted, "utf-8")

      // Store encryption metadata in DB
      db.prepare(
        "UPDATE notes SET is_locked = 1, lock_salt = ?, lock_iv = ?, lock_tag = ? WHERE id = ?"
      ).run(salt, iv, tag, noteId)

      return NextResponse.json({ success: true, locked: true })
    }

    if (action === "unlock") {
      if (!row.is_locked) {
        return NextResponse.json(
          { error: "Note is not locked" },
          { status: 400 }
        )
      }

      if (!row.lock_salt || !row.lock_iv || !row.lock_tag) {
        return NextResponse.json(
          { error: "Missing encryption metadata" },
          { status: 500 }
        )
      }

      try {
        const encrypted = fs.readFileSync(fullPath, "utf-8")
        const decrypted = decryptNote(
          encrypted,
          password,
          row.lock_salt,
          row.lock_iv,
          row.lock_tag
        )

        // Write decrypted content back
        fs.writeFileSync(fullPath, decrypted, "utf-8")

        // Clear lock metadata
        db.prepare(
          "UPDATE notes SET is_locked = 0, lock_salt = NULL, lock_iv = NULL, lock_tag = NULL WHERE id = ?"
        ).run(noteId)

        return NextResponse.json({ success: true, locked: false })
      } catch {
        return NextResponse.json(
          { error: "Incorrect password" },
          { status: 403 }
        )
      }
    }

    if (action === "decrypt") {
      // Decrypt for viewing without permanently unlocking
      if (!row.is_locked || !row.lock_salt || !row.lock_iv || !row.lock_tag) {
        return NextResponse.json(
          { error: "Note is not locked" },
          { status: 400 }
        )
      }

      try {
        const encrypted = fs.readFileSync(fullPath, "utf-8")
        const decrypted = decryptNote(
          encrypted,
          password,
          row.lock_salt,
          row.lock_iv,
          row.lock_tag
        )
        return NextResponse.json({ content: decrypted })
      } catch {
        return NextResponse.json(
          { error: "Incorrect password" },
          { status: 403 }
        )
      }
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      )
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
