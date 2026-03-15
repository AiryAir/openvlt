import { NextRequest, NextResponse } from "next/server"
import { listStructureEvents } from "@/lib/versions/structure-events"
import { AuthError, requireAuthWithVault } from "@/lib/auth/middleware"

export async function GET(request: NextRequest) {
  try {
    const { vaultId } = await requireAuthWithVault()
    const { searchParams } = request.nextUrl

    const entityType = searchParams.get("entityType") as
      | "note"
      | "folder"
      | "attachment"
      | null
    const entityId = searchParams.get("entityId")
    const since = searchParams.get("since")
    const until = searchParams.get("until")
    const limit = searchParams.get("limit")
    const offset = searchParams.get("offset")

    const result = listStructureEvents(vaultId, {
      entityType: entityType ?? undefined,
      entityId: entityId ?? undefined,
      since: since ?? undefined,
      until: until ?? undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    })

    return NextResponse.json(result)
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
