import { NextResponse } from "next/server"
import { createWelcomeNote } from "@/lib/welcome-note"
import { AuthError, requireAuthWithVault } from "@/lib/auth/middleware"

export async function POST() {
  try {
    const { user, vaultId } = await requireAuthWithVault()
    const note = createWelcomeNote(user.id, vaultId)
    return NextResponse.json(note, { status: 201 })
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
