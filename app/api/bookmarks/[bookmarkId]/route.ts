import { NextResponse } from "next/server"
import { deleteBookmark } from "@/lib/bookmarks"
import { AuthError, requireAuthWithVault } from "@/lib/auth/middleware"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ bookmarkId: string }> }
) {
  try {
    const { user, vaultId } = await requireAuthWithVault()
    const { bookmarkId } = await params

    deleteBookmark(bookmarkId, user.id, vaultId)
    return NextResponse.json({ success: true })
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
