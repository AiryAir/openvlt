import { NextRequest, NextResponse } from "next/server"
import { getNote } from "@/lib/notes"
import { extractSection, listAnchors } from "@/lib/markdown/section-parser"
import { AuthError, requireAuthWithVault } from "@/lib/auth/middleware"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    const { user, vaultId } = await requireAuthWithVault()
    const { noteId } = await params
    const { searchParams } = request.nextUrl

    const note = getNote(noteId, user.id, vaultId)
    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 })
    }

    const listMode = searchParams.get("list")
    if (listMode === "true") {
      const anchors = listAnchors(note.content)
      return NextResponse.json({ anchors })
    }

    const anchor = searchParams.get("anchor")
    if (anchor === null) {
      return NextResponse.json(
        { error: "Missing anchor or list parameter" },
        { status: 400 }
      )
    }

    // Empty anchor = return entire note content (minus frontmatter)
    if (anchor === "") {
      const body = note.content.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "")
      return NextResponse.json({
        markdown: body,
        found: true,
        noteTitle: note.metadata.title,
      })
    }

    const { markdown, found } = extractSection(note.content, anchor)
    return NextResponse.json({
      markdown,
      found,
      noteTitle: note.metadata.title,
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
