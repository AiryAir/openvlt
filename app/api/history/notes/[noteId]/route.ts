import { NextRequest, NextResponse } from "next/server"
import { listVersions, getVersionCount } from "@/lib/versions/service"
import { AuthError, requireAuthWithVault } from "@/lib/auth/middleware"
import { getDb } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    await requireAuthWithVault()
    const { noteId } = await params
    const { searchParams } = request.nextUrl

    const includeWorking = searchParams.get("includeWorking") === "true"
    const versions = listVersions(noteId, includeWorking)
    const count = getVersionCount(noteId)

    // Fetch edit sessions for this note
    const db = getDb()
    const sessions = db
      .prepare(
        `SELECT id, note_id, user_id, started_at, last_edit_at, ended_at, version_id
         FROM edit_sessions WHERE note_id = ?
         ORDER BY started_at DESC`
      )
      .all(noteId) as {
      id: string
      note_id: string
      user_id: string
      started_at: string
      last_edit_at: string
      ended_at: string | null
      version_id: string | null
    }[]

    const formattedSessions = sessions.map((s) => ({
      id: s.id,
      noteId: s.note_id,
      userId: s.user_id,
      startedAt: s.started_at,
      lastEditAt: s.last_edit_at,
      endedAt: s.ended_at,
      versionId: s.version_id,
    }))

    return NextResponse.json({ versions, count, sessions: formattedSessions })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      )
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
