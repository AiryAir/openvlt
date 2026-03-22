import path from "path"
import { getOrCreateServerKey } from "@/lib/server-key"

export const DB_PATH =
  process.env.OPENVLT_DB_PATH ??
  path.join(process.cwd(), "data", ".openvlt", "openvlt.db")

export const SESSION_COOKIE_NAME = "openvlt_session"

export const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

// Server-side encryption key for OAuth tokens and backup keys at rest
// Auto-generated on first boot if not set via env var
export const SERVER_KEY = getOrCreateServerKey()

// Google Drive OAuth
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? ""
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? ""
export const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI ?? ""
