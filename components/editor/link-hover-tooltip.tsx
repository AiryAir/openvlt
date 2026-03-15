"use client"

import * as React from "react"
import type { Editor } from "@tiptap/core"
import { ExternalLink, Pencil, Unlink } from "lucide-react"

interface LinkHoverTooltipProps {
  editor: Editor | null
  scrollContainerRef: React.RefObject<HTMLDivElement | null>
}

export function LinkHoverTooltip({
  editor,
  scrollContainerRef,
}: LinkHoverTooltipProps) {
  const [link, setLink] = React.useState<{
    href: string
    rect: DOMRect
  } | null>(null)
  const hideTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null
  )
  const tooltipRef = React.useRef<HTMLDivElement>(null)

  const isMac =
    typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform)
  const modKey = isMac ? "\u2318" : "Ctrl"

  function cancelHide() {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }
  }

  function scheduleHide(delay = 200) {
    cancelHide()
    hideTimeoutRef.current = setTimeout(() => {
      setLink(null)
    }, delay)
  }

  React.useEffect(() => {
    if (!editor) return

    const editorDom = editor.view.dom

    function handleMouseOver(e: MouseEvent) {
      const target = e.target as HTMLElement
      const anchor = target.closest("a[href]") as HTMLAnchorElement | null
      if (!anchor) return

      cancelHide()
      const href = anchor.getAttribute("href")
      if (!href) return

      const rect = anchor.getBoundingClientRect()
      setLink({ href, rect })
    }

    function handleMouseOut(e: MouseEvent) {
      const target = e.relatedTarget as HTMLElement | null
      // Don't hide if moving into the tooltip itself
      if (target && tooltipRef.current?.contains(target)) return
      const anchor = (e.target as HTMLElement).closest("a[href]")
      if (anchor) {
        scheduleHide()
      }
    }

    editorDom.addEventListener("mouseover", handleMouseOver)
    editorDom.addEventListener("mouseout", handleMouseOut)

    return () => {
      editorDom.removeEventListener("mouseover", handleMouseOver)
      editorDom.removeEventListener("mouseout", handleMouseOut)
      cancelHide()
    }
  }, [editor]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reposition on scroll
  React.useEffect(() => {
    if (!link) return
    const container = scrollContainerRef.current
    if (!container) return

    function handleScroll() {
      setLink(null)
    }

    container.addEventListener("scroll", handleScroll, { passive: true })
    return () => container.removeEventListener("scroll", handleScroll)
  }, [link, scrollContainerRef])

  if (!link || !editor) return null

  const container = scrollContainerRef.current
  if (!container) return null

  const containerRect = container.getBoundingClientRect()
  const top = link.rect.bottom - containerRect.top + container.scrollTop + 6
  const left = link.rect.left - containerRect.left + container.scrollLeft

  function truncateUrl(url: string, maxLen = 45) {
    if (url.length <= maxLen) return url
    return url.slice(0, maxLen - 1) + "\u2026"
  }

  function handleOpen() {
    window.open(link!.href, "_blank", "noopener,noreferrer")
  }

  function handleEdit() {
    if (!editor) return
    const url = prompt("Edit link URL:", link!.href)
    if (url === null) return
    if (url === "") {
      editor.chain().focus().unsetLink().run()
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
    }
    setLink(null)
  }

  function handleUnlink() {
    if (!editor) return
    editor.chain().focus().unsetLink().run()
    setLink(null)
  }

  return (
    <div
      ref={tooltipRef}
      onMouseEnter={cancelHide}
      onMouseLeave={() => scheduleHide()}
      className="absolute z-50 flex items-center gap-1.5 rounded-lg border border-border bg-popover px-3 py-2 shadow-lg animate-in fade-in-0 zoom-in-95 duration-100"
      style={{
        top,
        left,
        maxWidth: "min(400px, calc(100% - 32px))",
      }}
    >
      <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
      <a
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        className="truncate text-sm text-primary underline underline-offset-2 hover:text-primary/80"
        title={link.href}
      >
        {truncateUrl(link.href)}
      </a>
      <span className="shrink-0 text-xs text-muted-foreground">
        {modKey}+Click
      </span>
      <div className="mx-0.5 h-4 w-px bg-border" />
      <button
        type="button"
        onClick={handleEdit}
        className="rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
        title="Edit link"
      >
        <Pencil className="size-3.5" />
      </button>
      <button
        type="button"
        onClick={handleUnlink}
        className="rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
        title="Remove link"
      >
        <Unlink className="size-3.5" />
      </button>
    </div>
  )
}
