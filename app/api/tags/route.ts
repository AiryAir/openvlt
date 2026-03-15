import { NextResponse } from "next/server"
import { createTag, listTags } from "@/lib/tags"
import { AuthError, requireAuthWithVault } from "@/lib/auth/middleware"

export async function GET() {
  try {
    const { user, vaultId } = await requireAuthWithVault()
    const tags = listTags(user.id, vaultId)
    return NextResponse.json(tags)
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

export async function POST(request: Request) {
  try {
    const { user, vaultId } = await requireAuthWithVault()
    const body = await request.json()
    const { name } = body

    if (!name) {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      )
    }

    const tag = createTag(user.id, name, vaultId)
    return NextResponse.json(tag, { status: 201 })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    const message = error instanceof Error ? error.message : "Unknown error"
    const status = message === "Tag already exists" ? 409 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
