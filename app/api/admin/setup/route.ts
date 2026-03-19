import { NextRequest, NextResponse } from "next/server"
import { createUser, createSession } from "@/lib/auth/service"
import { isSetupComplete, setConfig } from "@/lib/admin/config"
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_MS } from "@/lib/constants"

export async function POST(request: NextRequest) {
  try {
    if (isSetupComplete()) {
      return NextResponse.json(
        { error: "Setup has already been completed" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { admin, vault, config, additionalUsers } = body

    // Validate admin fields
    if (
      !admin?.username ||
      typeof admin.username !== "string" ||
      !admin?.password ||
      typeof admin.password !== "string" ||
      admin.password.length < 8 ||
      !admin?.displayName ||
      typeof admin.displayName !== "string"
    ) {
      return NextResponse.json(
        { error: "Invalid admin account details" },
        { status: 400 }
      )
    }

    // Create admin user
    const { user: adminUser, recoveryKey } = await createUser(
      admin.username.trim().toLowerCase(),
      admin.password,
      admin.displayName.trim(),
      { isAdmin: true }
    )

    // Save config
    if (config?.domain) {
      setConfig("instance_domain", config.domain)
    }
    if (config?.port) {
      setConfig("instance_port", String(config.port))
    }
    setConfig(
      "registration_open",
      config?.registrationOpen === true ? "true" : "false"
    )

    // Create additional users
    const createdUsers: string[] = []
    if (Array.isArray(additionalUsers)) {
      for (const u of additionalUsers) {
        if (
          u.username &&
          typeof u.username === "string" &&
          u.password &&
          typeof u.password === "string" &&
          u.password.length >= 8
        ) {
          try {
            const { user: newUser } = await createUser(
              u.username.trim().toLowerCase(),
              u.password,
              u.displayName?.trim() || u.username.trim()
            )
            createdUsers.push(newUser.username)
          } catch {
            // Skip users that fail (e.g. duplicate username)
          }
        }
      }
    }

    // Mark setup as complete
    setConfig("setup_completed", "true")

    // Create session for admin
    const session = createSession(adminUser.id)

    const res = NextResponse.json(
      {
        user: adminUser,
        recoveryKey,
        createdUsers,
      },
      { status: 201 }
    )

    res.cookies.set(SESSION_COOKIE_NAME, session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_MS / 1000,
    })

    return res
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
