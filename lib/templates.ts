import { v4 as uuid } from "uuid"
import { getDb } from "@/lib/db"

export interface Template {
  id: string
  name: string
  content: string
  userId: string
  createdAt: string
}

const BUILT_IN_TEMPLATES: Omit<Template, "id" | "userId" | "createdAt">[] = [
  {
    name: "Meeting Notes",
    content: `# Meeting Notes

## Date
{{date}}

## Attendees
-

## Agenda
1.

## Discussion


## Action Items
- [ ]
`,
  },
  {
    name: "Daily Journal",
    content: `# {{date}}

## Grateful For
-

## Today's Goals
- [ ]

## Notes


## Reflection

`,
  },
  {
    name: "Project Brief",
    content: `# Project:

## Overview


## Goals
-

## Timeline
| Phase | Start | End |
|-------|-------|-----|
|       |       |     |

## Resources


## Risks

`,
  },
]

export function listTemplates(userId: string): Template[] {
  const db = getDb()
  const rows = db
    .prepare(
      "SELECT * FROM note_templates WHERE user_id = ? ORDER BY name"
    )
    .all(userId) as {
    id: string
    name: string
    content: string
    user_id: string
    created_at: string
  }[]

  const userTemplates = rows.map((r) => ({
    id: r.id,
    name: r.name,
    content: r.content,
    userId: r.user_id,
    createdAt: r.created_at,
  }))

  // Prepend built-in templates
  const builtIn = BUILT_IN_TEMPLATES.map((t) => ({
    ...t,
    id: `builtin:${t.name}`,
    userId,
    createdAt: "",
  }))

  return [...builtIn, ...userTemplates]
}

export function createTemplate(
  name: string,
  content: string,
  userId: string
): Template {
  const db = getDb()
  const id = uuid()
  const now = new Date().toISOString()

  db.prepare(
    "INSERT INTO note_templates (id, name, content, user_id, created_at) VALUES (?, ?, ?, ?, ?)"
  ).run(id, name, content, userId, now)

  return { id, name, content, userId, createdAt: now }
}

export function deleteTemplate(id: string, userId: string): void {
  const db = getDb()
  db.prepare(
    "DELETE FROM note_templates WHERE id = ? AND user_id = ?"
  ).run(id, userId)
}

/** Replace template variables like {{date}} */
export function renderTemplate(content: string): string {
  const now = new Date()
  return content
    .replace(/\{\{date\}\}/g, now.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }))
    .replace(/\{\{time\}\}/g, now.toLocaleTimeString())
    .replace(/\{\{iso\}\}/g, now.toISOString())
}
