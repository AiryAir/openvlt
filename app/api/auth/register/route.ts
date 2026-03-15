import { NextRequest, NextResponse } from "next/server"
import { createUser } from "@/lib/auth/service"

export async function POST(request: NextRequest) {
  try {
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

    return NextResponse.json({ user, recoveryKey }, { status: 201 })
  } catch (error) {
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
