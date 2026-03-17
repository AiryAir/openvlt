"use client"

import * as React from "react"
import { CardModePanels } from "@/components/card-mode-panels"
import { useSidebar } from "@/components/ui/sidebar"
import { useCardModeStore } from "@/lib/stores/card-mode-store"
import type { TreeNode } from "@/types"

const SIDEBAR_WIDTH = 256 // 16rem
const SIDEBAR_COLLAPSED_WIDTH = 48 // 3rem
const MIN_NOTE_AREA = 80
const STRIP_WIDTH = 40

export function CardModeContainer() {
  const { open: sidebarOpen, setOpen: setSidebarOpen } = useSidebar()
  const { panels } = useCardModeStore()
  const [mode, setMode] = React.useState<string>("simple")
  const [tree, setTree] = React.useState<TreeNode[]>([])
  const [viewportWidth, setViewportWidth] = React.useState(1200)
  const autoCollapsedRef = React.useRef(false)
  const selfCollapsingRef = React.useRef(false)

  // Track viewport width (client-only)
  React.useEffect(() => {
    setViewportWidth(window.innerWidth)
    const handler = () => setViewportWidth(window.innerWidth)
    window.addEventListener("resize", handler)
    return () => window.removeEventListener("resize", handler)
  }, [])

  // Available width for card panels
  const sidebarW = sidebarOpen ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED_WIDTH
  const availableForPanels = viewportWidth - sidebarW - MIN_NOTE_AREA

  // Auto-collapse sidebar when even 1 strip doesn't fit, if collapsing would help
  React.useEffect(() => {
    if (mode !== "card" || panels.length === 0 || !sidebarOpen) return

    if (availableForPanels < STRIP_WIDTH) {
      const availableIfCollapsed =
        viewportWidth - SIDEBAR_COLLAPSED_WIDTH - MIN_NOTE_AREA
      if (availableIfCollapsed >= STRIP_WIDTH) {
        autoCollapsedRef.current = true
        selfCollapsingRef.current = true
        setSidebarOpen(false)
      }
    }
  }, [
    mode,
    panels.length,
    availableForPanels,
    sidebarOpen,
    viewportWidth,
    setSidebarOpen,
  ])

  // Clear auto-collapsed flag when sidebar is manually reopened
  React.useEffect(() => {
    if (sidebarOpen && autoCollapsedRef.current) {
      if (selfCollapsingRef.current) {
        selfCollapsingRef.current = false
        return
      }
      autoCollapsedRef.current = false
    }
  }, [sidebarOpen])

  const fetchTree = React.useCallback(async () => {
    try {
      const res = await fetch("/api/folders")
      if (res.ok) {
        setTree(await res.json())
      }
    } catch {}
  }, [])

  // Listen for mode changes from the sidebar
  React.useEffect(() => {
    function syncMode() {
      const stored = localStorage.getItem("openvlt:sidebar-mode") || "simple"
      setMode(stored)
    }
    syncMode()

    window.addEventListener("storage", syncMode)
    window.addEventListener("openvlt:mode-change", syncMode)
    return () => {
      window.removeEventListener("storage", syncMode)
      window.removeEventListener("openvlt:mode-change", syncMode)
    }
  }, [])

  // Fetch tree when card mode is active
  React.useEffect(() => {
    if (mode === "card") {
      fetchTree()
    }
  }, [mode, fetchTree])

  // Also refresh when the sidebar triggers tree refresh
  React.useEffect(() => {
    if (mode !== "card") return
    const handler = () => fetchTree()
    window.addEventListener("openvlt:tree-refresh", handler)
    return () => window.removeEventListener("openvlt:tree-refresh", handler)
  }, [mode, fetchTree])

  // Hide if not card mode
  if (mode !== "card") return null
  // Hide if sidebar manually collapsed (not auto-collapsed)
  if (!sidebarOpen && !autoCollapsedRef.current) return null
  // Hide if not even a single strip fits
  if (availableForPanels < STRIP_WIDTH) return null

  return (
    <CardModePanels
      tree={tree}
      onRefresh={fetchTree}
      availableWidth={availableForPanels}
    />
  )
}
