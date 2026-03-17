import { NextRequest, NextResponse } from "next/server"
import { searchNotesWithSnippets } from "@/lib/notes"
import { AuthError, requireAuthWithVault } from "@/lib/auth/middleware"

export async function GET(request: NextRequest) {
  try {
    const { user, vaultId } = await requireAuthWithVault()
    const q = request.nextUrl.searchParams.get("q")
    if (!q || !q.trim()) {
      return NextResponse.json([])
    }
    const results = searchNotesWithSnippets(q, user.id, vaultId, 8)
    return NextResponse.json(results)
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
