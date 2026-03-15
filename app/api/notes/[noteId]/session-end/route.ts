import { NextRequest, NextResponse } from "next/server"
import { endEditSession } from "@/lib/versions/grouping"
import { AuthError, requireAuthWithVault } from "@/lib/auth/middleware"

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    const { user } = await requireAuthWithVault()
    const { noteId } = await params
    endEditSession(noteId, user.id)
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
