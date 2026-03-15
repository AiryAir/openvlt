"use client"

import * as React from "react"
import type { NoteMetadata } from "@/types"

let cachedNotes: NoteMetadata[] = []
let cacheTimestamp = 0
const CACHE_TTL = 30_000 // 30 seconds

export function useNoteCache() {
  const [notes, setNotes] = React.useState<NoteMetadata[]>(cachedNotes)
  const [loading, setLoading] = React.useState(false)

  const refresh = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/notes?filter=all")
      if (res.ok) {
        const data = await res.json()
        cachedNotes = data
        cacheTimestamp = Date.now()
        setNotes(data)
      }
    } catch {}
    setLoading(false)
  }, [])

  // Refresh if stale
  React.useEffect(() => {
    if (Date.now() - cacheTimestamp > CACHE_TTL) {
      refresh()
    } else {
      setNotes(cachedNotes)
    }
  }, [refresh])

  // Listen for tree refresh events to invalidate cache
  React.useEffect(() => {
    const handler = () => {
      cacheTimestamp = 0 // invalidate
      refresh()
    }
    window.addEventListener("openvlt:tree-refresh", handler)
    return () => window.removeEventListener("openvlt:tree-refresh", handler)
  }, [refresh])

  return { notes, loading, refresh }
}
