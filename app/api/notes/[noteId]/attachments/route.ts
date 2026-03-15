import { NextRequest, NextResponse } from "next/server"
import { saveAttachment, listAttachments } from "@/lib/attachments"
import { AuthError, requireAuthWithVault } from "@/lib/auth/middleware"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    const { user, vaultId } = await requireAuthWithVault()
    const { noteId } = await params
    const attachments = listAttachments(noteId, user.id, vaultId)
    return NextResponse.json(attachments)
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
    const { user, vaultId } = await requireAuthWithVault()
    const { noteId } = await params
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json(
        { error: "file is required" },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const attachment = saveAttachment(
      noteId,
      user.id,
      vaultId,
      file.name,
      buffer,
      file.type || "application/octet-stream"
    )

    return NextResponse.json(attachment, { status: 201 })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    const message = error instanceof Error ? error.message : "Unknown error"
    const status = message === "Note not found" ? 404 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
