import { v4 as uuid } from "uuid"
import { getDb } from "@/lib/db"
import { SESSION_MAX_AGE_MS } from "@/lib/constants"
import {
  hashPassword,
  verifyPassword,
  generateRecoveryKey,
  generateSessionToken,
} from "@/lib/auth/crypto"
import type { User, Session } from "@/types"

interface CreateUserResult {
  user: User
  recoveryKey: string
}

export async function createUser(
  username: string,
  password: string,
  displayName: string,
  options?: { isAdmin?: boolean }
): Promise<CreateUserResult> {
  const db = getDb()

  const existing = db
    .prepare("SELECT id FROM users WHERE username = ?")
    .get(username)
  if (existing) {
    throw new Error("Username already taken")
  }

  const id = uuid()
  const passwordHash = await hashPassword(password)
  const recoveryKey = generateRecoveryKey()
  const recoveryKeyHash = await hashPassword(recoveryKey)
  const now = new Date().toISOString()
  const isAdmin = options?.isAdmin ? 1 : 0

  db.prepare(
    `INSERT INTO users (id, username, display_name, password_hash, recovery_key_hash, is_admin, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, username, displayName, passwordHash, recoveryKeyHash, isAdmin, now)

  return {
    user: { id, username, displayName, isAdmin: !!options?.isAdmin, createdAt: now },
    recoveryKey,
  }
}

export function isUserAdmin(userId: string): boolean {
  const db = getDb()
  const row = db
    .prepare("SELECT is_admin FROM users WHERE id = ?")
    .get(userId) as { is_admin: number } | undefined
  return row?.is_admin === 1
}

export async function authenticateUser(
  username: string,
  password: string
): Promise<User | null> {
  const db = getDb()
  const row = db
    .prepare("SELECT * FROM users WHERE username = ?")
    .get(username) as
    | {
        id: string
        username: string
        display_name: string
        password_hash: string
        is_admin: number
        created_at: string
      }
    | undefined

  if (!row) return null

  const valid = await verifyPassword(password, row.password_hash)
  if (!valid) return null

  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    isAdmin: row.is_admin === 1,
    createdAt: row.created_at,
  }
}

export function createSession(userId: string): Session {
  const db = getDb()
  const id = uuid()
  const token = generateSessionToken()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + SESSION_MAX_AGE_MS)

  db.prepare(
    `INSERT INTO sessions (id, user_id, token, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?)`
  ).run(id, userId, token, expiresAt.toISOString(), now.toISOString())

  return {
    id,
    userId,
    token,
    expiresAt: expiresAt.toISOString(),
    createdAt: now.toISOString(),
  }
}

export function validateSession(
  token: string
): { session: Session; user: User } | null {
  const db = getDb()
  const row = db
    .prepare(
      `SELECT s.*, u.id as uid, u.username, u.display_name, u.is_admin, u.created_at as user_created_at
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token = ?`
    )
    .get(token) as
    | {
        id: string
        user_id: string
        token: string
        expires_at: string
        created_at: string
        uid: string
        username: string
        display_name: string
        is_admin: number
        user_created_at: string
      }
    | undefined

  if (!row) return null

  // Check expiration
  const expiresAt = new Date(row.expires_at)
  const now = new Date()
  if (expiresAt < now) {
    db.prepare("DELETE FROM sessions WHERE id = ?").run(row.id)
    return null
  }

  // Sliding window: if past half the max age, extend the session
  const createdAt = new Date(row.created_at)
  const halfLife = SESSION_MAX_AGE_MS / 2
  if (now.getTime() - createdAt.getTime() > halfLife) {
    const newExpiry = new Date(now.getTime() + SESSION_MAX_AGE_MS)
    db.prepare("UPDATE sessions SET expires_at = ? WHERE id = ?").run(
      newExpiry.toISOString(),
      row.id
    )
    row.expires_at = newExpiry.toISOString()
  }

  return {
    session: {
      id: row.id,
      userId: row.user_id,
      token: row.token,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
    },
    user: {
      id: row.uid,
      username: row.username,
      displayName: row.display_name,
      isAdmin: row.is_admin === 1,
      createdAt: row.user_created_at,
    },
  }
}

export function destroySession(token: string): void {
  const db = getDb()
  db.prepare("DELETE FROM sessions WHERE token = ?").run(token)
}
