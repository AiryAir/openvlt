import { NextRequest, NextResponse } from "next/server"
import { createVault, listVaults } from "@/lib/vaults/service"
import { AuthError, requireAuth } from "@/lib/auth/middleware"

export async function GET() {
  try {
    const user = await requireAuth()
    const vaults = listVaults(user.id)
    return NextResponse.json(vaults)
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

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { name, path: vaultPath } = body

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      )
    }

    if (!vaultPath || typeof vaultPath !== "string") {
      return NextResponse.json(
        { error: "path is required" },
        { status: 400 }
      )
    }

    const vault = createVault(user.id, name, vaultPath)
    return NextResponse.json(vault, { status: 201 })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      )
    }
    const message = error instanceof Error ? error.message : "Unknown error"
    const status = message.includes("UNIQUE constraint") ? 409 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
