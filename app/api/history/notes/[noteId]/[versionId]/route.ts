import { NextRequest, NextResponse } from "next/server"
import { getVersion, restoreVersion } from "@/lib/versions/service"
import { AuthError, requireAuthWithVault } from "@/lib/auth/middleware"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ noteId: string; versionId: string }> }
) {
  try {
    await requireAuthWithVault()
    const { versionId } = await params

    const version = getVersion(versionId)
    if (!version) {
      return NextResponse.json(
        { error: "Version not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(version)
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

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ noteId: string; versionId: string }> }
) {
  try {
    const { user, vaultId } = await requireAuthWithVault()
    const { noteId, versionId } = await params
    const restored = restoreVersion(noteId, versionId, user.id, vaultId)
    return NextResponse.json(restored)
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      )
    }
    const message = error instanceof Error ? error.message : "Unknown error"
    const status =
      message === "Version not found" || message === "Note not found"
        ? 404
        : message === "Version does not belong to this note"
          ? 400
          : 500
    return NextResponse.json({ error: message }, { status })
  }
}
