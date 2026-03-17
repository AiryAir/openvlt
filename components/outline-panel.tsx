"use client"

import * as React from "react"
import { ListTreeIcon, XIcon } from "lucide-react"
import type { Editor } from "@tiptap/react"

interface HeadingItem {
  id: string
  level: number
  text: string
  pos: number
}

interface OutlinePanelProps {
  editor: Editor | null
  pane?: "main" | "split"
}

export function OutlinePanel({ editor, pane = "main" }: OutlinePanelProps) {
  const storageKey = `openvlt:outline-open:${pane}`
  const [headings, setHeadings] = React.useState<HeadingItem[]>([])
  const [open, setOpen] = React.useState(false)
  const [mobileOpen, setMobileOpen] = React.useState(false)

  // Sync from localStorage after mount to avoid SSR/client mismatch
  React.useEffect(() => {
    setOpen(localStorage.getItem(storageKey) !== "false")
  }, [storageKey])
  const [activeId, setActiveId] = React.useState<string | null>(null)

  function toggleOpen() {
    setOpen((prev) => {
      const next = !prev
      localStorage.setItem(storageKey, String(next))
      return next
    })
  }

  // Listen for outline toggle event scoped to this pane
  React.useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail?.pane && detail.pane !== pane) return
      // On mobile toggle the overlay, on desktop toggle the inline panel
      if (window.innerWidth < 768) {
        setMobileOpen((prev) => !prev)
      } else {
        toggleOpen()
      }
    }
    window.addEventListener("openvlt:toggle-outline", handler)
    return () => window.removeEventListener("openvlt:toggle-outline", handler)
  }, [pane, storageKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // Extract headings from the editor document
  const extractHeadings = React.useCallback(() => {
    if (!editor) return

    const items: HeadingItem[] = []
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === "heading") {
        const id = `outline-${pos}`
        items.push({
          id,
          level: node.attrs.level as number,
          text: node.textContent,
          pos,
        })
      }
    })
    setHeadings(items)
  }, [editor])

  // Re-extract headings on document changes
  React.useEffect(() => {
    if (!editor) return

    extractHeadings()

    const handler = () => extractHeadings()
    editor.on("update", handler)
    return () => {
      editor.off("update", handler)
    }
  }, [editor, extractHeadings])

  // Track which heading is in view during scroll
  React.useEffect(() => {
    if (!editor || headings.length === 0) return

    const scrollContainer = editor.view.dom.closest(
      ".overflow-y-auto"
    ) as HTMLElement | null
    if (!scrollContainer) return

    function handleScroll() {
      if (!editor) return

      const containerRect = scrollContainer!.getBoundingClientRect()
      let closest: string | null = null
      let closestDist = Infinity

      for (const heading of headings) {
        try {
          const domPos = editor.view.coordsAtPos(heading.pos)
          const dist = Math.abs(domPos.top - containerRect.top)
          if (domPos.top <= containerRect.top + 100 && dist < closestDist) {
            closest = heading.id
            closestDist = dist
          }
        } catch {
          // pos may be stale
        }
      }

      if (closest) setActiveId(closest)
    }

    scrollContainer.addEventListener("scroll", handleScroll, { passive: true })
    return () => scrollContainer.removeEventListener("scroll", handleScroll)
  }, [editor, headings])

  function scrollToHeading(pos: number) {
    if (!editor) return
    editor.commands.focus()
    editor.commands.setTextSelection(pos + 1)

    // Scroll the heading into view
    try {
      const coords = editor.view.coordsAtPos(pos)
      const scrollContainer = editor.view.dom.closest(
        ".overflow-y-auto"
      ) as HTMLElement | null
      if (scrollContainer) {
        const containerRect = scrollContainer.getBoundingClientRect()
        scrollContainer.scrollTo({
          top:
            scrollContainer.scrollTop + (coords.top - containerRect.top) - 60,
          behavior: "smooth",
        })
      }
    } catch {
      // fallback: at least the cursor is at the heading
    }
  }

  if (headings.length === 0) return null

  const outlineContent = (
    <>
      <div className="flex h-10 items-center justify-between border-b px-3">
        <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          <ListTreeIcon className="size-3.5" />
          <span>Outline</span>
          <span className="tabular-nums">({headings.length})</span>
        </div>
        <button
          onClick={() => {
            toggleOpen()
            setMobileOpen(false)
          }}
          className="flex size-5 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground"
          title="Hide outline"
        >
          <XIcon className="size-3.5" />
        </button>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-x-hidden overflow-y-auto p-2">
        {headings.map((heading) => (
          <button
            key={heading.id}
            onClick={() => {
              scrollToHeading(heading.pos)
              setMobileOpen(false)
            }}
            title={heading.text}
            className={`block w-full truncate rounded-sm px-2.5 py-1 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground ${
              activeId === heading.id
                ? "bg-accent/50 font-medium text-foreground"
                : "text-muted-foreground"
            }`}
            style={{ paddingLeft: `${(heading.level - 1) * 12 + 10}px` }}
          >
            {heading.text || "Untitled"}
          </button>
        ))}
      </nav>
    </>
  )

  if (!open && !mobileOpen) return null

  return (
    <>
      {/* Desktop inline panel */}
      {open && (
        <div className="hidden w-52 min-w-52 max-w-52 shrink-0 flex-col border-l md:flex">
          {outlineContent}
        </div>
      )}

      {/* Mobile overlay panel */}
      {mobileOpen && (
        <div className="absolute inset-y-0 right-0 z-30 flex w-52 flex-col border-l bg-background md:hidden">
          {outlineContent}
        </div>
      )}
    </>
  )
}
