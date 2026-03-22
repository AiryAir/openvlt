import crypto from "crypto"
import fs from "fs"
import path from "path"

const KEY_FILE = path.join(
  process.env.OPENVLT_DATA_DIR || path.join(process.cwd(), "data"),
  ".openvlt",
  "server.key"
)

/**
 * Get or auto-generate the server encryption key.
 * Checks: env var → file on disk → generate new.
 * Sets process.env.OPENVLT_SERVER_KEY so all consumers see it.
 */
export function getOrCreateServerKey(): string {
  // 1. Check env var
  const envKey = process.env.OPENVLT_SERVER_KEY
  if (envKey && /^[0-9a-f]{64}$/i.test(envKey)) {
    return envKey
  }

  // 2. Try to load from file
  try {
    if (fs.existsSync(KEY_FILE)) {
      const fileKey = fs.readFileSync(KEY_FILE, "utf-8").trim()
      if (/^[0-9a-f]{64}$/i.test(fileKey)) {
        process.env.OPENVLT_SERVER_KEY = fileKey
        return fileKey
      }
    }
  } catch {
    // Fall through to generation
  }

  // 3. Generate new key
  const newKey = crypto.randomBytes(32).toString("hex")
  try {
    fs.mkdirSync(path.dirname(KEY_FILE), { recursive: true })
    fs.writeFileSync(KEY_FILE, newKey, { mode: 0o600 })
  } catch {
    // If we can't write the file, still use the key for this session
    console.warn("[server-key] Could not persist server key to disk")
  }
  process.env.OPENVLT_SERVER_KEY = newKey
  return newKey
}
