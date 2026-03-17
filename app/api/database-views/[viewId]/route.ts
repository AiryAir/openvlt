import { NextRequest, NextResponse } from "next/server"
import { getView, updateView, deleteView, queryView } from "@/lib/database-views"
import { AuthError, requireAuthWithVault } from "@/lib/auth/middleware"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ viewId: string }> }
) {
  try {
    const { user, vaultId } = await requireAuthWithVault()
    const { viewId } = await params
    const result = queryView(viewId, user.id, vaultId)

    if (!result) {
      return NextResponse.json({ error: "View not found" }, { status: 404 })
    }

    return NextResponse.json(result)
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
  { params }: { params: Promise<{ viewId: string }> }
) {
  try {
    const { user, vaultId } = await requireAuthWithVault()
    const { viewId } = await params
    const body = await request.json()
    const { name, viewType, config } = body

    const view = updateView(viewId, user.id, vaultId, {
      name,
      viewType,
      config,
    })
    return NextResponse.json(view)
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
  { params }: { params: Promise<{ viewId: string }> }
) {
  try {
    const { user, vaultId } = await requireAuthWithVault()
    const { viewId } = await params
    deleteView(viewId, user.id, vaultId)
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
