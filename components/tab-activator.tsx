"use client"

import * as React from "react"
import { useTabStore } from "@/lib/stores/tab-store"

interface TabActivatorProps {
  noteId: string
  title: string
}

export function TabActivator({ noteId, title }: TabActivatorProps) {
  const { openTab } = useTabStore()
  const calledRef = React.useRef(false)

  React.useEffect(() => {
    if (!calledRef.current) {
      calledRef.current = true
      openTab(noteId, title)
    }
  }, [noteId, title, openTab])

  return null
}
