import { NextRequest, NextResponse } from "next/server"
import { generateRegOptions, verifyRegistration } from "@/lib/auth/webauthn"
import { AuthError, requireAuth } from "@/lib/auth/middleware"

/** GET: generate registration options (challenge) */
export async function GET() {
  try {
    const user = await requireAuth()
    const options = await generateRegOptions(user.id, user.username)
    return NextResponse.json(options)
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

/** POST: verify registration response */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const result = await verifyRegistration(user.id, body.response, body.deviceName)
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
