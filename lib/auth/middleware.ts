import { cookies } from "next/headers"
import { SESSION_COOKIE_NAME } from "@/lib/constants"
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

  return { user: result.user, token: result.session.token }
}

export async function requireAuth(): Promise<User> {
  const session = await getSession()

  if (!session) {
    throw new AuthError("Unauthorized")
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
