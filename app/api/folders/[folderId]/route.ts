import { NextRequest, NextResponse } from "next/server"
import { renameFolder, deleteFolder, moveFolder } from "@/lib/folders"
import { AuthError, requireAuthWithVault } from "@/lib/auth/middleware"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ folderId: string }> }
) {
  try {
    const { user, vaultId } = await requireAuthWithVault()
    const { folderId } = await params
    const body = await request.json()

    if (body.action === "move" && body.parentId !== undefined) {
      moveFolder(folderId, body.parentId, user.id, vaultId)
      return NextResponse.json({ success: true })
    }

    if (body.name) {
      renameFolder(folderId, body.name, user.id, vaultId)
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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ folderId: string }> }
) {
  try {
    const { user, vaultId } = await requireAuthWithVault()
    const { folderId } = await params
    deleteFolder(folderId, user.id, vaultId)
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
