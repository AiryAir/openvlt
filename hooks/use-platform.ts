"use client"

import { useMemo } from "react"

export function useModifierKey(): string {
  return useMemo(() => {
    if (typeof navigator === "undefined") return "Ctrl"
    return navigator.platform?.includes("Mac") ? "⌘" : "Ctrl"
  }, [])
}
