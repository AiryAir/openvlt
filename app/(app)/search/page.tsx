"use client"

import { useEffect } from "react"
import { useTabStore } from "@/lib/stores/tab-store"

export default function SearchPage() {
  const { openTab } = useTabStore()

  useEffect(() => {
    openTab("__search__", "Search")
  }, [openTab])

  return null
}
