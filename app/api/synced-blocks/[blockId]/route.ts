import { NextRequest, NextResponse } from "next/server"
import {
  getSyncedBlock,
  updateSyncedBlock,
  deleteSyncedBlock,
  getBlockRefCount,
} from "@/lib/synced-blocks"
import { AuthError, requireAuthWithVault } from "@/lib/auth/middleware"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ blockId: string }> }
) {
  try {
    const { user, vaultId } = await requireAuthWithVault()
    const { blockId } = await params
    const block = getSyncedBlock(blockId, user.id, vaultId)

    if (!block) {
      return NextResponse.json({ error: "Block not found" }, { status: 404 })
    }

    const refCount = getBlockRefCount(blockId)
    return NextResponse.json({ ...block, refCount })
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ blockId: string }> }
) {
  try {
    const { user, vaultId } = await requireAuthWithVault()
    const { blockId } = await params
    const body = await request.json()
    const { content } = body

    if (typeof content !== "string") {
      return NextResponse.json({ error: "content is required" }, { status: 400 })
    }

    const block = updateSyncedBlock(blockId, content, user.id, vaultId)
    if (!block) {
      return NextResponse.json({ error: "Block not found" }, { status: 404 })
    }

    return NextResponse.json(block)
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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ blockId: string }> }
) {
  try {
    const { user, vaultId } = await requireAuthWithVault()
    const { blockId } = await params
    const deleted = deleteSyncedBlock(blockId, user.id, vaultId)

    if (!deleted) {
      return NextResponse.json({ error: "Block not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
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
