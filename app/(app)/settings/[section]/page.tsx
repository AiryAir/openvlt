"use client"

import { useEffect } from "react"
import { useParams } from "next/navigation"
import { useTabStore } from "@/lib/stores/tab-store"

export default function SettingsSectionPage() {
  const { openTab } = useTabStore()
  const params = useParams()

  useEffect(() => {
    openTab("__settings__", "Settings")
  }, [openTab, params])

  return null
}
