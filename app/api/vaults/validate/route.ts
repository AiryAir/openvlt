import fs from "fs"
import { NextRequest, NextResponse } from "next/server"
import { validateVaultPath } from "@/lib/vaults/service"
import { AuthError, requireAuth } from "@/lib/auth/middleware"

export async function POST(request: NextRequest) {
  try {
    await requireAuth()
    const body = await request.json()
    const { path: dirPath } = body

    if (!dirPath || typeof dirPath !== "string") {
      return NextResponse.json(
        { error: "path is required" },
        { status: 400 }
      )
    }

    const result = validateVaultPath(dirPath)
    return NextResponse.json({
      valid: result.valid,
      error: result.error,
      exists: fs.existsSync(dirPath),
    })
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
