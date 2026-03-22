import { NextResponse } from "next/server"
import { AuthError, requireAuthWithVault } from "@/lib/auth/middleware"
import { generatePairingCode } from "@/lib/sync/peer"

export async function POST() {
  try {
    const { vaultId } = await requireAuthWithVault()
    const { code, expiresAt } = generatePairingCode(vaultId)
    return NextResponse.json({ code, expiresAt })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      )
    }
    console.error("[pair/code/generate]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
