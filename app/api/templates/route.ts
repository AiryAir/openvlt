import { NextRequest, NextResponse } from "next/server"
import { listTemplates, createTemplate, deleteTemplate } from "@/lib/templates"
import { AuthError, requireAuth } from "@/lib/auth/middleware"

export async function GET() {
  try {
    const user = await requireAuth()
    const templates = listTemplates(user.id)
    return NextResponse.json(templates)
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
    const user = await requireAuth()
    const { name, content } = await request.json()

    if (!name?.trim() || !content) {
      return NextResponse.json(
        { error: "Name and content are required" },
        { status: 400 }
      )
    }

    const template = createTemplate(name.trim(), content, user.id)
    return NextResponse.json(template, { status: 201 })
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
    const user = await requireAuth()
    const { id } = await request.json()
    deleteTemplate(id, user.id)
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
