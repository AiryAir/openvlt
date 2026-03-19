"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTabStore } from "@/lib/stores/tab-store"

export default function SettingsPage() {
  const { openTab } = useTabStore()
  const router = useRouter()

  useEffect(() => {
    openTab("__settings__", "Settings")
    // Redirect /settings to /settings/general so the URL always has a section
    router.replace("/settings/general")
  }, [openTab, router])

  return null
}
