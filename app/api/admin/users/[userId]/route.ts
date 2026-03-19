import { NextRequest, NextResponse } from "next/server"
import { requireAdmin, AuthError } from "@/lib/auth/middleware"
import { getDb } from "@/lib/db"

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const admin = await requireAdmin()
    const { userId } = await params

    if (userId === admin.id) {
      return NextResponse.json(
        { error: "You cannot delete your own account" },
        { status: 400 }
      )
    }

    const db = getDb()

    const user = db.prepare("SELECT id FROM users WHERE id = ?").get(userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Delete user (cascading deletes handle sessions, credentials, etc.)
    db.prepare("DELETE FROM users WHERE id = ?").run(userId)

    return NextResponse.json({ success: true })
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
