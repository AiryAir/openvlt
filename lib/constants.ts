import path from "path"

export const DB_PATH =
  process.env.OPENVLT_DB_PATH ??
  path.join(process.cwd(), "data", ".openvlt", "openvlt.db")

export const SESSION_COOKIE_NAME = "openvlt_session"

export const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000 // 30 days
