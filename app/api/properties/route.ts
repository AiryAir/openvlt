import { NextRequest, NextResponse } from "next/server"
import {
  listPropertyDefinitions,
  getOrCreatePropertyDefinition,
  updatePropertyDefinition,
  deletePropertyDefinition,
} from "@/lib/properties"
import { AuthError, requireAuthWithVault } from "@/lib/auth/middleware"
import type { PropertyType } from "@/types"

export async function GET() {
  try {
    const { vaultId } = await requireAuthWithVault()
    const definitions = listPropertyDefinitions(vaultId)
    return NextResponse.json(definitions)
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
    const { vaultId } = await requireAuthWithVault()
    const body = await request.json()
    const { name, type, options } = body

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Property name is required" },
        { status: 400 }
      )
    }

    const prop = getOrCreatePropertyDefinition(
      vaultId,
      name.trim(),
      (type as PropertyType) || "select"
    )

    // If options were provided, update them
    if (options && Array.isArray(options)) {
      const updated = updatePropertyDefinition(prop.id, vaultId, { options })
      return NextResponse.json(updated, { status: 201 })
    }

    return NextResponse.json(prop, { status: 201 })
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

export async function PUT(request: NextRequest) {
  try {
    const { vaultId } = await requireAuthWithVault()
    const body = await request.json()
    const { id, name, type, options } = body

    if (!id) {
      return NextResponse.json(
        { error: "Property definition id is required" },
        { status: 400 }
      )
    }

    const updated = updatePropertyDefinition(id, vaultId, {
      name,
      type,
      options,
    })
    return NextResponse.json(updated)
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

export async function DELETE(request: NextRequest) {
  try {
    const { vaultId } = await requireAuthWithVault()
    const { searchParams } = request.nextUrl
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "Property definition id is required" },
        { status: 400 }
      )
    }

    deletePropertyDefinition(id, vaultId)
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
