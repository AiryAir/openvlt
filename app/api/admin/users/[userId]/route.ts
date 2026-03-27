import { NextRequest, NextResponse } from "next/server"
import { requireAdmin, AuthError } from "@/lib/auth/middleware"
import { getDb } from "@/lib/db"
import { hashPassword } from "@/lib/auth/crypto"

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const admin = await requireAdmin()
    const { userId } = await params
    const body = await request.json()

    const db = getDb()

    const user = db
      .prepare("SELECT id, is_admin FROM users WHERE id = ?")
      .get(userId) as { id: string; is_admin: number } | undefined
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Toggle admin status
    if (typeof body.isAdmin === "boolean") {
      if (userId === admin.id) {
        return NextResponse.json(
          { error: "You cannot change your own admin status" },
          { status: 400 }
        )
      }
      db.prepare("UPDATE users SET is_admin = ? WHERE id = ?").run(
        body.isAdmin ? 1 : 0,
        userId
      )
    }

    // Reset password
    if (typeof body.password === "string") {
      if (body.password.length < 8) {
        return NextResponse.json(
          { error: "Password must be at least 8 characters" },
          { status: 400 }
        )
      }
      const passwordHash = await hashPassword(body.password)
      db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(
        passwordHash,
        userId
      )
      // Invalidate all sessions for this user (except if admin is resetting their own)
      if (userId !== admin.id) {
        db.prepare("DELETE FROM sessions WHERE user_id = ?").run(userId)
      }
    }

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
