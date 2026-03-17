"use client"

import * as React from "react"
import {
  BookmarkIcon,
  FileTextIcon,
  HashIcon,
  SearchIcon,
  XIcon,
} from "lucide-react"
import { useTabStore } from "@/lib/stores/tab-store"
import type { Bookmark } from "@/types"

function formatRelativeTime(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

const typeLabels: Record<Bookmark["type"], string> = {
  note: "Note",
  heading: "Heading",
  search: "Search",
}

const typeIcons: Record<Bookmark["type"], React.FC<{ className?: string }>> = {
  note: FileTextIcon,
  heading: HashIcon,
  search: SearchIcon,
}

type FilterType = "all" | "note" | "heading" | "search"

export function BookmarksListPanel() {
  const { openTab } = useTabStore()
  const [bookmarks, setBookmarks] = React.useState<Bookmark[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [filter, setFilter] = React.useState<FilterType>("all")

  const fetchBookmarks = React.useCallback(async () => {
    try {
      const res = await fetch("/api/bookmarks")
      if (res.ok) {
        setBookmarks(await res.json())
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchBookmarks()
  }, [fetchBookmarks])

  React.useEffect(() => {
    const handler = () => fetchBookmarks()
    window.addEventListener("openvlt:bookmarks-refresh", handler)
    return () =>
      window.removeEventListener("openvlt:bookmarks-refresh", handler)
  }, [fetchBookmarks])

  async function handleRemove(id: string) {
    await fetch(`/api/bookmarks/${id}`, { method: "DELETE" })
    setBookmarks((prev) => prev.filter((b) => b.id !== id))
  }

  function handleClick(bookmark: Bookmark) {
    switch (bookmark.type) {
      case "note":
        if (bookmark.targetId) {
          openTab(bookmark.targetId, bookmark.label)
        }
        break
      case "heading":
        if (bookmark.targetId) {
          openTab(bookmark.targetId, bookmark.label)
          setTimeout(() => {
            if (bookmark.data) {
              window.dispatchEvent(
                new CustomEvent("openvlt:scroll-to-heading", {
                  detail: { headingText: bookmark.data },
                })
              )
            }
          }, 500)
        }
        break
      case "search":
        if (bookmark.data) {
          window.location.href = `/notes?search=${encodeURIComponent(bookmark.data)}`
        }
        break
    }
  }

  const filtered = React.useMemo(() => {
    let result = bookmarks
    if (filter !== "all") {
      result = result.filter((b) => b.type === filter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (b) =>
          b.label.toLowerCase().includes(q) ||
          (b.data && b.data.toLowerCase().includes(q))
      )
    }
    return result
  }, [bookmarks, search, filter])

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <BookmarkIcon className="size-4 text-muted-foreground" />
        <span className="text-sm font-medium">Bookmarks</span>
        <span className="text-sm text-muted-foreground">
          ({filtered.length})
        </span>
      </div>

      {/* Search + Filter */}
      <div className="flex shrink-0 items-center gap-2 border-b px-4 py-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search bookmarks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-full rounded-md border bg-transparent pr-3 pl-8 text-sm outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as FilterType)}
          className="h-8 rounded-md border bg-transparent px-2 text-xs text-muted-foreground outline-none"
        >
          <option value="all">All types</option>
          <option value="note">Notes</option>
          <option value="heading">Headings</option>
          <option value="search">Searches</option>
        </select>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="size-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <BookmarkIcon className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {search.trim()
                ? "No matching bookmarks"
                : bookmarks.length === 0
                  ? "No bookmarks yet"
                  : "No bookmarks of this type"}
            </p>
            {bookmarks.length === 0 && (
              <p className="max-w-[240px] text-xs text-muted-foreground">
                Bookmark notes, headings, or searches from the editor or command palette
              </p>
            )}
          </div>
        ) : (
          <div className="divide-y">
            {filtered.map((bookmark) => {
              const Icon = typeIcons[bookmark.type]
              return (
                <div
                  key={bookmark.id}
                  role="button"
                  tabIndex={0}
                  className="group flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
                  onClick={() => handleClick(bookmark)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      handleClick(bookmark)
                    }
                  }}
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
                    <Icon className="size-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {bookmark.label}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{typeLabels[bookmark.type]}</span>
                      <span>&middot;</span>
                      <span>{formatRelativeTime(bookmark.createdAt)}</span>
                      {bookmark.type === "heading" && bookmark.data && (
                        <>
                          <span>&middot;</span>
                          <span className="truncate">#{bookmark.data}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemove(bookmark.id)
                    }}
                    className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-all hover:bg-foreground/10 hover:text-foreground group-hover:opacity-100"
                    title="Remove bookmark"
                  >
                    <XIcon className="size-3.5" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
