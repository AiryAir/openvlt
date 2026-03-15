import { NextRequest, NextResponse } from "next/server"
import {
  generateAuthOptions,
  verifyAuthentication,
} from "@/lib/auth/webauthn"
import { createSession } from "@/lib/auth/service"
import { getDb } from "@/lib/db"

/** POST: start or complete authentication */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Step 1: Generate challenge
    if (body.action === "options") {
      const { options, userId } = await generateAuthOptions(body.username)
      return NextResponse.json({ options, userId })
    }

    // Step 2: Verify response
    if (body.action === "verify") {
      const result = await verifyAuthentication(body.userId, body.response)
      if (!result.verified) {
        return NextResponse.json(
          { error: "Verification failed" },
          { status: 403 }
        )
      }

      // Create session (same as password login)
      const db = getDb()
      const user = db
        .prepare("SELECT id, username, display_name FROM users WHERE id = ?")
        .get(body.userId) as {
        id: string
        username: string
        display_name: string
      }

      const session = createSession(user.id)

      const res = NextResponse.json({
        user: {
          id: user.id,
          username: user.username,
          displayName: user.display_name,
        },
      })

      res.cookies.set("session", session.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      })

      return res
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
