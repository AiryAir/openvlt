import { NextRequest, NextResponse } from "next/server"
import { listVersions, getVersionCount } from "@/lib/versions/service"
import { AuthError, requireAuthWithVault } from "@/lib/auth/middleware"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    await requireAuthWithVault()
    const { noteId } = await params
    const versions = listVersions(noteId)
    const count = getVersionCount(noteId)
    return NextResponse.json({ versions, count })
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
