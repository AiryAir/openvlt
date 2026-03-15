import { NextRequest, NextResponse } from "next/server"
import { deleteTag } from "@/lib/tags"
import { AuthError, requireAuthWithVault } from "@/lib/auth/middleware"

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ tagId: string }> }
) {
  try {
    const { user, vaultId } = await requireAuthWithVault()
    const { tagId } = await params
    deleteTag(user.id, tagId, vaultId)
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    const message = error instanceof Error ? error.message : "Unknown error"
    const status = message === "Tag not found" ? 404 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
