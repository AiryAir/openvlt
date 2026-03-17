import { NextRequest, NextResponse } from "next/server"
import { createView, listViews } from "@/lib/database-views"
import { AuthError, requireAuthWithVault } from "@/lib/auth/middleware"

export async function GET() {
  try {
    const { user, vaultId } = await requireAuthWithVault()
    const views = listViews(user.id, vaultId)
    return NextResponse.json(views)
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
    const { name, folderId, viewType } = body

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      )
    }

    const view = createView(
      name.trim(),
      folderId || null,
      viewType || "table",
      user.id,
      vaultId
    )
    return NextResponse.json(view, { status: 201 })
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
