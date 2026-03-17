import { NextRequest, NextResponse } from "next/server"
import {
  getNoteProperties,
  setNoteProperty,
  removeNoteProperty,
} from "@/lib/properties"
import { AuthError, requireAuthWithVault } from "@/lib/auth/middleware"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    const { user, vaultId } = await requireAuthWithVault()
    const { noteId } = await params
    const properties = getNoteProperties(noteId, vaultId)
    return NextResponse.json(properties)
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
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    const { user, vaultId } = await requireAuthWithVault()
    const { noteId } = await params
    const body = await request.json()
    const { name, value, type } = body

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Property name is required" },
        { status: 400 }
      )
    }

    setNoteProperty(noteId, user.id, vaultId, name, value, type)
    const properties = getNoteProperties(noteId, vaultId)
    return NextResponse.json(properties)
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
  request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    const { user, vaultId } = await requireAuthWithVault()
    const { noteId } = await params
    const { searchParams } = request.nextUrl
    const name = searchParams.get("name")

    if (!name) {
      return NextResponse.json(
        { error: "Property name is required" },
        { status: 400 }
      )
    }

    removeNoteProperty(noteId, user.id, vaultId, name)
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
