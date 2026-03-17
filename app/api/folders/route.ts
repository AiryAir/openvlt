import { NextRequest, NextResponse } from "next/server"
import { createFolder, getFolderTree, getAllFilesTree } from "@/lib/folders"
import { AuthError, requireAuthWithVault } from "@/lib/auth/middleware"
import { reconcileVault } from "@/lib/sync/reconcile"

export async function GET(request: NextRequest) {
  try {
    const { user, vaultId } = await requireAuthWithVault()
    // Reconcile DB with disk before returning tree (catches external changes)
    reconcileVault(vaultId)
    const showAll = request.nextUrl.searchParams.get("showAll") === "true"
    if (showAll) {
      const tree = getAllFilesTree(user.id, vaultId)
      return NextResponse.json(tree)
    }
    const advanced = request.nextUrl.searchParams.get("mode") === "advanced"
    const tree = getFolderTree(user.id, vaultId, advanced)
    return NextResponse.json(tree)
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
    const { name, parentId } = body

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Folder name is required" },
        { status: 400 }
      )
    }

    const folder = createFolder(name.trim(), user.id, vaultId, parentId || null)
    return NextResponse.json(folder, { status: 201 })
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
