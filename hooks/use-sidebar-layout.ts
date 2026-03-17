"use client"

import { useCallback, useSyncExternalStore } from "react"

export type SidebarLayout = "rail" | "horizontal"

const STORAGE_KEY = "openvlt:sidebar-layout"

let listeners: (() => void)[] = []

function emitChange() {
  for (const listener of listeners) listener()
}

function read(): SidebarLayout {
  if (typeof window === "undefined") return "rail"
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === "rail" || raw === "horizontal") return raw as SidebarLayout
  } catch {}
  return "rail"
}

let snapshot = read()

function getSnapshot() {
  return snapshot
}

function getServerSnapshot(): SidebarLayout {
  return "rail"
}

function subscribe(listener: () => void) {
  listeners.push(listener)
  return () => {
    listeners = listeners.filter((l) => l !== listener)
  }
}

export function useSidebarLayout() {
  const layout = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  )

  const setLayout = useCallback((value: SidebarLayout) => {
    localStorage.setItem(STORAGE_KEY, value)
    snapshot = value
    emitChange()
  }, [])

  return { layout, setLayout }
}
