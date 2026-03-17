import { NextRequest, NextResponse } from "next/server"
import { createSyncedBlock, listSyncedBlocks } from "@/lib/synced-blocks"
import { AuthError, requireAuthWithVault } from "@/lib/auth/middleware"

export async function GET() {
  try {
    const { user, vaultId } = await requireAuthWithVault()
    const blocks = listSyncedBlocks(user.id, vaultId)
    return NextResponse.json(blocks)
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

export async function POST(request: NextRequest) {
  try {
    const { user, vaultId } = await requireAuthWithVault()
    const body = await request.json()
    const { content } = body

    if (typeof content !== "string") {
      return NextResponse.json({ error: "content is required" }, { status: 400 })
    }

    const block = createSyncedBlock(content, user.id, vaultId)
    return NextResponse.json(block, { status: 201 })
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
