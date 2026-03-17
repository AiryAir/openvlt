"use client"

import { useCallback, useSyncExternalStore } from "react"

export interface SidebarSections {
  dailyNote: boolean
  allNotes: boolean
  favorites: boolean
  trash: boolean
  bookmarks: boolean
  databaseViews: boolean
}

const STORAGE_KEY = "openvlt:sidebar-sections"

const defaults: SidebarSections = {
  dailyNote: true,
  allNotes: true,
  favorites: true,
  trash: true,
  bookmarks: true,
  databaseViews: true,
}

let listeners: (() => void)[] = []

function emitChange() {
  for (const listener of listeners) listener()
}

function read(): SidebarSections {
  if (typeof window === "undefined") return defaults
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaults
    return { ...defaults, ...JSON.parse(raw) }
  } catch {
    return defaults
  }
}

let snapshot = read()

function getSnapshot() {
  return snapshot
}

function getServerSnapshot() {
  return defaults
}

function subscribe(listener: () => void) {
  listeners.push(listener)
  return () => {
    listeners = listeners.filter((l) => l !== listener)
  }
}

export function useSidebarSections() {
  const sections = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const toggle = useCallback((key: keyof SidebarSections) => {
    const current = read()
    const updated = { ...current, [key]: !current[key] }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    snapshot = updated
    emitChange()
  }, [])

  return { sections, toggle }
}
