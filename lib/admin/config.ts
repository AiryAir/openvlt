import { getDb } from "@/lib/db"

const ENV_MAP: Record<string, string> = {
  setup_completed: "OPENVLT_SETUP_COMPLETED",
  registration_open: "OPENVLT_REGISTRATION_OPEN",
  instance_domain: "OPENVLT_DOMAIN",
  instance_port: "OPENVLT_PORT",
}

export function getConfig(key: string): string | null {
  // Check env var first
  const envKey = ENV_MAP[key]
  if (envKey && process.env[envKey]) {
    return process.env[envKey]!
  }

  const db = getDb()
  const row = db
    .prepare("SELECT value FROM instance_config WHERE key = ?")
    .get(key) as { value: string } | undefined

  return row?.value ?? null
}

export function setConfig(key: string, value: string): void {
  const db = getDb()
  db.prepare(
    `INSERT INTO instance_config (key, value, updated_at)
     VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
  ).run(key, value)
}

export function isSetupComplete(): boolean {
  return getConfig("setup_completed") === "true"
}

export function isRegistrationOpen(): boolean {
  return getConfig("registration_open") === "true"
}
