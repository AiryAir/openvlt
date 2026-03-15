import bcrypt from "bcryptjs"
import crypto from "crypto"

const SALT_ROUNDS = 12

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateRecoveryKey(): string {
  const bytes = crypto.randomBytes(32)
  const words: string[] = []
  for (let i = 0; i < 24; i++) {
    const index = bytes[i % 32]! % 256
    words.push(index.toString(16).padStart(2, "0"))
  }
  return words.join("-")
}

export function generateSessionToken(): string {
  return crypto.randomUUID()
}

// ── Note encryption (AES-256-GCM with PBKDF2 key derivation) ──

const PBKDF2_ITERATIONS = 100000
const KEY_LENGTH = 32 // 256 bits
const IV_LENGTH = 12
const TAG_LENGTH = 16

export function deriveLockKey(
  password: string,
  salt: Buffer
): Buffer {
  return crypto.pbkdf2Sync(
    password,
    salt,
    PBKDF2_ITERATIONS,
    KEY_LENGTH,
    "sha256"
  )
}

export function encryptNote(
  content: string,
  password: string
): { encrypted: string; salt: string; iv: string; tag: string } {
  const salt = crypto.randomBytes(16)
  const key = deriveLockKey(password, salt)
  const iv = crypto.randomBytes(IV_LENGTH)

  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv)
  const encrypted = Buffer.concat([
    cipher.update(content, "utf-8"),
    cipher.final(),
  ])
  const tag = cipher.getAuthTag()

  return {
    encrypted: encrypted.toString("base64"),
    salt: salt.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
  }
}

export function decryptNote(
  encryptedBase64: string,
  password: string,
  saltBase64: string,
  ivBase64: string,
  tagBase64: string
): string {
  const salt = Buffer.from(saltBase64, "base64")
  const key = deriveLockKey(password, salt)
  const iv = Buffer.from(ivBase64, "base64")
  const tag = Buffer.from(tagBase64, "base64")
  const encrypted = Buffer.from(encryptedBase64, "base64")

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv)
  decipher.setAuthTag(tag)
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ])

  return decrypted.toString("utf-8")
}
