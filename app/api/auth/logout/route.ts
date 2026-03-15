import { NextResponse } from "next/server"
import { SESSION_COOKIE_NAME } from "@/lib/constants"
import { getSession } from "@/lib/auth/middleware"
import { destroySession } from "@/lib/auth/service"

export async function POST() {
  try {
    const session = await getSession()

    if (session) {
      destroySession(session.token)
    }

    const response = NextResponse.json({ success: true })
    response.cookies.set(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    })

    return response
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
