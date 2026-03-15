import { NextRequest, NextResponse } from "next/server"
import { getBacklinks } from "@/lib/notes"
import { AuthError, requireAuthWithVault } from "@/lib/auth/middleware"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    const { user, vaultId } = await requireAuthWithVault()
    const { noteId } = await params
    const backlinks = getBacklinks(noteId, user.id, vaultId)
    return NextResponse.json(backlinks)
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
