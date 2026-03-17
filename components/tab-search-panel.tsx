"use client"

import * as React from "react"
import { SearchIcon, XIcon, RotateCcwIcon, FileTextIcon, ListXIcon } from "lucide-react"
import { useTabStore } from "@/lib/stores/tab-store"

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function TabSearchPanel({ onClose }: { onClose: () => void }) {
  const {
    tabs,
    activeTabId,
    setActiveTab,
    closeTab,
    closeAllTabs,
    recentlyClosed,
    reopenClosedTab,
  } = useTabStore()
  const [query, setQuery] = React.useState("")
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const lowerQuery = query.toLowerCase()
  const filteredTabs = query
    ? tabs.filter((t) => t.title.toLowerCase().includes(lowerQuery))
    : tabs
  const filteredClosed = query
    ? recentlyClosed.filter((t) =>
        t.title.toLowerCase().includes(lowerQuery)
      )
    : recentlyClosed

  function handleSelectTab(noteId: string) {
    setActiveTab(noteId)
    onClose()
  }

  function handleReopenTab(noteId: string) {
    reopenClosedTab(noteId)
    onClose()
  }

  return (
    <div className="flex max-h-[400px] w-[320px] flex-col overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-md">
      {/* Search input */}
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search tabs"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Open tabs */}
        {filteredTabs.length > 0 && (
          <div>
            <div className="flex items-center px-3 pt-3 pb-1">
              <span className="text-xs font-medium text-muted-foreground">
                Open Tabs
              </span>
              <button
                onClick={() => {
                  closeAllTabs()
                  onClose()
                }}
                className="ml-auto flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <ListXIcon className="size-3" />
                Close all
              </button>
            </div>
            {filteredTabs.map((tab) => (
              <button
                key={tab.noteId}
                onClick={() => handleSelectTab(tab.noteId)}
                className={`group flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-accent ${
                  tab.noteId === activeTabId
                    ? "bg-accent/50"
                    : ""
                }`}
              >
                <FileTextIcon className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate text-sm">
                  {tab.title}
                </span>
                <span
                  role="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    closeTab(tab.noteId)
                  }}
                  className="flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground/60 opacity-0 transition-all hover:bg-foreground/10 hover:text-foreground group-hover:opacity-100"
                >
                  <XIcon className="size-3" />
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Recently closed */}
        {filteredClosed.length > 0 && (
          <div>
            <div className="px-3 pt-3 pb-1 text-xs font-medium text-muted-foreground">
              Recently Closed
            </div>
            {filteredClosed.map((tab) => (
              <button
                key={tab.noteId}
                onClick={() => handleReopenTab(tab.noteId)}
                className="group flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-accent"
              >
                <RotateCcwIcon className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm">{tab.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {timeAgo(tab.closedAt)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Empty state */}
        {filteredTabs.length === 0 && filteredClosed.length === 0 && (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">
            No matching tabs
          </div>
        )}
      </div>
    </div>
  )
}
