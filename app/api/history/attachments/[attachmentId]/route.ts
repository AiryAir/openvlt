import { NextRequest, NextResponse } from "next/server"
import {
  listAttachmentVersions,
  restoreAttachmentVersion,
} from "@/lib/versions/attachment-versions"
import { AuthError, requireAuthWithVault } from "@/lib/auth/middleware"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ attachmentId: string }> }
) {
  try {
    const { user, vaultId } = await requireAuthWithVault()
    const { attachmentId } = await params

    const versions = listAttachmentVersions(attachmentId, user.id, vaultId)
    return NextResponse.json({ versions })
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
  { params }: { params: Promise<{ attachmentId: string }> }
) {
  try {
    const { user, vaultId } = await requireAuthWithVault()
    const { attachmentId } = await params

    restoreAttachmentVersion(attachmentId, user.id, vaultId)
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      )
    }
    const message = error instanceof Error ? error.message : "Unknown error"
    const status = message.includes("not found") ? 404 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
