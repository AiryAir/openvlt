"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { useSidebar } from "@/components/ui/sidebar"

const STORAGE_KEY = "openvlt:sidebar-width"
const MIN_WIDTH = 200
const MAX_WIDTH = 480

export function SidebarResizer() {
  const { open } = useSidebar()
  const [container, setContainer] = React.useState<HTMLElement | null>(null)
  const dragging = React.useRef(false)

  // Find the sidebar-container element to portal into
  React.useEffect(() => {
    const el = document.querySelector(
      "[data-slot='sidebar-container']"
    ) as HTMLElement | null
    setContainer(el)
  }, [])

  // Apply saved width on mount
  React.useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const width = Number(saved)
      if (width >= MIN_WIDTH && width <= MAX_WIDTH) {
        applyWidth(width)
      }
    }
  }, [])

  // Re-apply width when sidebar opens (after collapse/expand)
  React.useEffect(() => {
    if (open) {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const width = Number(saved)
        if (width >= MIN_WIDTH && width <= MAX_WIDTH) {
          applyWidth(width)
        }
      }
    }
  }, [open])

  function applyWidth(width: number) {
    const wrapper = document.querySelector("[data-slot='sidebar-wrapper']")
    if (wrapper instanceof HTMLElement) {
      wrapper.style.setProperty("--sidebar-width", `${width}px`)
    }
  }

  function onPointerDown(e: React.PointerEvent) {
    e.preventDefault()
    dragging.current = true
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"

    function onPointerMove(ev: PointerEvent) {
      if (!dragging.current) return
      const width = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, ev.clientX))
      applyWidth(width)
    }

    function onPointerUp(ev: PointerEvent) {
      dragging.current = false
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
      document.removeEventListener("pointermove", onPointerMove)
      document.removeEventListener("pointerup", onPointerUp)

      const width = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, ev.clientX))
      localStorage.setItem(STORAGE_KEY, String(width))
    }

    document.addEventListener("pointermove", onPointerMove)
    document.addEventListener("pointerup", onPointerUp)
  }

  if (!open || !container) return null

  return createPortal(
    <div
      onPointerDown={onPointerDown}
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        width: 4,
        zIndex: 40,
        cursor: "col-resize",
      }}
      className="transition-colors hover:bg-primary/30 active:bg-primary/50"
    />,
    container
  )
}
