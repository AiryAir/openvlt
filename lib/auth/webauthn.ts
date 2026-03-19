import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server"
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from "@simplewebauthn/server"
import { v4 as uuid } from "uuid"
import { getDb } from "@/lib/db"
import { getConfig } from "@/lib/admin/config"

const RP_NAME = "openvlt"

function getRpId(): string {
  if (process.env.WEBAUTHN_RP_ID) return process.env.WEBAUTHN_RP_ID
  const domain = getConfig("instance_domain")
  if (domain) {
    try {
      return new URL(domain).hostname
    } catch {
      // Invalid URL, fall through
    }
  }
  return "localhost"
}

function getOrigin(): string {
  if (process.env.WEBAUTHN_ORIGIN) return process.env.WEBAUTHN_ORIGIN
  const domain = getConfig("instance_domain")
  if (domain) return domain
  return "http://localhost:3456"
}

// In-memory challenge store (per-user, short-lived)
const challenges = new Map<string, string>()

export async function generateRegOptions(userId: string, username: string) {
  const db = getDb()

  // Get existing credentials for exclusion
  const existing = db
    .prepare("SELECT credential_id FROM webauthn_credentials WHERE user_id = ?")
    .all(userId) as { credential_id: string }[]

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: getRpId(),
    userName: username,
    userID: new TextEncoder().encode(userId),
    attestationType: "none",
    excludeCredentials: existing.map((c) => ({
      id: c.credential_id,
    })),
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
  })

  challenges.set(userId, options.challenge)

  return options
}

export async function verifyRegistration(
  userId: string,
  response: RegistrationResponseJSON,
  deviceName?: string
) {
  const expectedChallenge = challenges.get(userId)
  if (!expectedChallenge) throw new Error("Challenge not found or expired")

  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge,
    expectedOrigin: getOrigin(),
    expectedRPID: getRpId(),
  })

  if (!verification.verified || !verification.registrationInfo) {
    throw new Error("Registration verification failed")
  }

  const { credential } = verification.registrationInfo
  const db = getDb()
  const id = uuid()

  db.prepare(
    `INSERT INTO webauthn_credentials (id, user_id, credential_id, public_key, counter, device_name)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    userId,
    credential.id,
    Buffer.from(credential.publicKey).toString("base64"),
    credential.counter,
    deviceName || "Unnamed device"
  )

  challenges.delete(userId)
  return { id, credentialId: credential.id }
}

export async function generateAuthOptions(username: string) {
  const db = getDb()
  const user = db
    .prepare("SELECT id FROM users WHERE username = ?")
    .get(username) as { id: string } | undefined

  if (!user) throw new Error("User not found")

  const credentials = db
    .prepare("SELECT credential_id FROM webauthn_credentials WHERE user_id = ?")
    .all(user.id) as { credential_id: string }[]

  if (credentials.length === 0) {
    throw new Error("No passkeys registered for this user")
  }

  const options = await generateAuthenticationOptions({
    rpID: getRpId(),
    allowCredentials: credentials.map((c) => ({
      id: c.credential_id,
    })),
    userVerification: "preferred",
  })

  challenges.set(user.id, options.challenge)

  return { options, userId: user.id }
}

export async function verifyAuthentication(
  userId: string,
  response: AuthenticationResponseJSON
) {
  const expectedChallenge = challenges.get(userId)
  if (!expectedChallenge) throw new Error("Challenge not found or expired")

  const db = getDb()
  const credential = db
    .prepare(
      "SELECT credential_id, public_key, counter FROM webauthn_credentials WHERE credential_id = ? AND user_id = ?"
    )
    .get(response.id, userId) as
    | { credential_id: string; public_key: string; counter: number }
    | undefined

  if (!credential) throw new Error("Credential not found")

  const verification = await verifyAuthenticationResponse({
    response,
    expectedChallenge,
    expectedOrigin: getOrigin(),
    expectedRPID: getRpId(),
    credential: {
      id: credential.credential_id,
      publicKey: Buffer.from(credential.public_key, "base64"),
      counter: credential.counter,
    },
  })

  if (!verification.verified) {
    throw new Error("Authentication verification failed")
  }

  // Update counter
  db.prepare(
    "UPDATE webauthn_credentials SET counter = ? WHERE credential_id = ? AND user_id = ?"
  ).run(
    verification.authenticationInfo.newCounter,
    credential.credential_id,
    userId
  )

  challenges.delete(userId)
  return { verified: true }
}

export function listCredentials(userId: string) {
  const db = getDb()
  return db
    .prepare(
      "SELECT id, device_name, created_at FROM webauthn_credentials WHERE user_id = ? ORDER BY created_at DESC"
    )
    .all(userId) as { id: string; device_name: string; created_at: string }[]
}

export function deleteCredential(credentialDbId: string, userId: string) {
  const db = getDb()
  db.prepare(
    "DELETE FROM webauthn_credentials WHERE id = ? AND user_id = ?"
  ).run(credentialDbId, userId)
}
