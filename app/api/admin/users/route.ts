import path from "path"
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin, AuthError } from "@/lib/auth/middleware"
import { createUser } from "@/lib/auth/service"
import { createVault } from "@/lib/vaults/service"
import { getDb } from "@/lib/db"

export async function GET() {
  try {
    await requireAdmin()

    const db = getDb()
    const users = db
      .prepare(
        "SELECT id, username, display_name, is_admin, created_at FROM users ORDER BY created_at"
      )
      .all() as {
      id: string
      username: string
      display_name: string
      is_admin: number
      created_at: string
    }[]

    return NextResponse.json({
      users: users.map((u) => ({
        id: u.id,
        username: u.username,
        displayName: u.display_name,
        isAdmin: u.is_admin === 1,
        createdAt: u.created_at,
      })),
    })
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

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const body = await request.json()
    const { username, password, displayName } = body

    if (!username || typeof username !== "string") {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      )
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      )
    }

    if (!displayName || typeof displayName !== "string") {
      return NextResponse.json(
        { error: "Display name is required" },
        { status: 400 }
      )
    }

    const { user, recoveryKey } = await createUser(
      username.trim().toLowerCase(),
      password,
      displayName.trim()
    )

    // Create a vault for the new user
    const vaultPath = path.join(process.cwd(), "data", "vault", user.id)
    createVault(user.id, "My Vault", vaultPath)

    return NextResponse.json({ user, recoveryKey }, { status: 201 })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      )
    }
    if (
      error instanceof Error &&
      error.message === "Username already taken"
    ) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
