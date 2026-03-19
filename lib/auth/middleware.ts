import { cookies } from "next/headers"
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_MS } from "@/lib/constants"
import { validateSession } from "@/lib/auth/service"
import { getActiveVault } from "@/lib/vaults/service"
import type { User } from "@/types"

export class AuthError extends Error {
  status: number
  constructor(message: string, status: number = 401) {
    super(message)
    this.name = "AuthError"
    this.status = status
  }
}

export async function getSession(): Promise<{
  user: User
  token: string
} | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!token) return null

  const result = validateSession(token)
  if (!result) return null

  // Refresh cookie expiry to match the (possibly extended) DB session
  try {
    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_MS / 1000,
    })
  } catch {
    // cookies().set can fail in certain RSC contexts, ignore
  }

  return { user: result.user, token: result.session.token }
}

export async function requireAuth(): Promise<User> {
  const session = await getSession()

  if (!session) {
    throw new AuthError("Unauthorized")
  }

  return session.user
}

export async function requireAdmin(): Promise<User> {
  const session = await getSession()

  if (!session) {
    throw new AuthError("Unauthorized")
  }

  if (!session.user.isAdmin) {
    throw new AuthError("Forbidden", 403)
  }

  return session.user
}

export async function requireAuthWithVault(): Promise<{
  user: User
  vaultId: string
}> {
  const user = await requireAuth()
  const vault = getActiveVault(user.id)
  if (!vault) {
    throw new AuthError(
      "No active vault. Please create or select a vault.",
      400
    )
  }
  return { user, vaultId: vault.id }
}
