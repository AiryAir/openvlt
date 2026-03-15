import { NextResponse } from "next/server"
import { exportAllNotes } from "@/lib/export/service"
import { AuthError, requireAuthWithVault } from "@/lib/auth/middleware"

export async function GET() {
  try {
    const { vaultId } = await requireAuthWithVault()
    const zipBuffer = await exportAllNotes(vaultId)
    const timestamp = new Date().toISOString().slice(0, 10)

    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="openvlt-export-${timestamp}.zip"`,
        "Content-Length": String(zipBuffer.length),
      },
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Export failed" },
      { status: 500 }
    )
  }
}
