import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { AuthError, requireAuthWithVault } from "@/lib/auth/middleware"

export async function GET() {
  try {
    const { user, vaultId } = await requireAuthWithVault()
    const db = getDb()

    const row = db
      .prepare(
        "SELECT id, title FROM notes WHERE user_id = ? AND vault_id = ? AND is_trashed = 0 ORDER BY RANDOM() LIMIT 1"
      )
      .get(user.id, vaultId) as { id: string; title: string } | undefined

    if (!row) {
      return NextResponse.json({ error: "No notes found" }, { status: 404 })
    }

    return NextResponse.json(row)
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
