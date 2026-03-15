import { NextRequest, NextResponse } from "next/server"
import { getNoteTags, addTagToNote, removeTagFromNote } from "@/lib/tags"
import { AuthError, requireAuthWithVault } from "@/lib/auth/middleware"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    await requireAuthWithVault()
    const { noteId } = await params
    const tags = getNoteTags(noteId)
    return NextResponse.json(tags)
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    await requireAuthWithVault()
    const { noteId } = await params
    const body = await request.json()
    const { tagId } = body

    if (!tagId) {
      return NextResponse.json(
        { error: "tagId is required" },
        { status: 400 }
      )
    }

    addTagToNote(noteId, tagId)
    return NextResponse.json({ success: true }, { status: 201 })
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    await requireAuthWithVault()
    const { noteId } = await params
    const { searchParams } = request.nextUrl
    const tagId = searchParams.get("tagId")

    if (!tagId) {
      return NextResponse.json(
        { error: "tagId is required" },
        { status: 400 }
      )
    }

    removeTagFromNote(noteId, tagId)
    return NextResponse.json({ success: true })
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
