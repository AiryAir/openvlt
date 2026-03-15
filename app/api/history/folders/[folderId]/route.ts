import { NextRequest, NextResponse } from "next/server"
import { getFolderStateAtTime } from "@/lib/versions/structure-events"
import { AuthError, requireAuthWithVault } from "@/lib/auth/middleware"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ folderId: string }> }
) {
  try {
    const { user, vaultId } = await requireAuthWithVault()
    const { folderId } = await params
    const { searchParams } = request.nextUrl

    const at = searchParams.get("at")
    if (!at) {
      return NextResponse.json(
        { error: "'at' timestamp parameter is required" },
        { status: 400 }
      )
    }

    const state = getFolderStateAtTime(vaultId, user.id, folderId, at)
    return NextResponse.json({ ...state, timestamp: at })
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
