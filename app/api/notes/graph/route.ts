import fs from "fs"
import path from "path"
import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { getVaultPath } from "@/lib/vaults/service"
import { AuthError, requireAuthWithVault } from "@/lib/auth/middleware"

export async function GET() {
  try {
    const { user, vaultId } = await requireAuthWithVault()
    const db = getDb()
    const vaultRoot = getVaultPath(vaultId)

    const notes = db
      .prepare(
        "SELECT id, title, file_path FROM notes WHERE is_trashed = 0 AND user_id = ? AND vault_id = ?"
      )
      .all(user.id, vaultId) as {
      id: string
      title: string
      file_path: string
    }[]

    // Build title -> id lookup (case-insensitive)
    const titleToId = new Map<string, string>()
    for (const note of notes) {
      titleToId.set(note.title.toLowerCase(), note.id)
    }

    const nodes = notes.map((n) => ({ id: n.id, title: n.title }))
    const links: { source: string; target: string }[] = []
    const wikiLinkRegex = /\[\[([^\]]+)\]\]/g

    for (const note of notes) {
      try {
        const content = fs.readFileSync(
          path.join(vaultRoot, note.file_path),
          "utf-8"
        )

        let match
        while ((match = wikiLinkRegex.exec(content)) !== null) {
          const linkedTitle = match[1].toLowerCase()
          const targetId = titleToId.get(linkedTitle)
          if (targetId && targetId !== note.id) {
            links.push({ source: note.id, target: targetId })
          }
        }

        // Also detect /notes/{uuid} references
        const uuidRegex =
          /\/notes\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/g
        while ((match = uuidRegex.exec(content)) !== null) {
          const targetId = match[1]
          if (
            targetId !== note.id &&
            notes.some((n) => n.id === targetId)
          ) {
            links.push({ source: note.id, target: targetId })
          }
        }
      } catch {
        // file unreadable
      }
    }

    // Deduplicate links
    const seen = new Set<string>()
    const uniqueLinks = links.filter((l) => {
      const key = `${l.source}->${l.target}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    return NextResponse.json({ nodes, links: uniqueLinks })
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
