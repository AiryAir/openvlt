import { NextRequest, NextResponse } from "next/server"
import { getVaultStateAtTime } from "@/lib/versions/structure-events"
import { AuthError, requireAuthWithVault } from "@/lib/auth/middleware"

export async function GET(request: NextRequest) {
  try {
    const { user, vaultId } = await requireAuthWithVault()
    const { searchParams } = request.nextUrl

    const at = searchParams.get("at")
    if (!at) {
      return NextResponse.json(
        { error: "'at' timestamp parameter is required" },
        { status: 400 }
      )
    }

    const state = getVaultStateAtTime(vaultId, user.id, at)
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
