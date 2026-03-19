import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { isSetupComplete, isRegistrationOpen } from "@/lib/admin/config"

export async function GET() {
  try {
    const db = getDb()
    const setupComplete = isSetupComplete()
    const registrationOpen = isRegistrationOpen()
    const { count: userCount } = db
      .prepare("SELECT COUNT(*) as count FROM users")
      .get() as { count: number }

    return NextResponse.json({ setupComplete, registrationOpen, userCount })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
