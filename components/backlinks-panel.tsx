"use client"

import * as React from "react"
import { LinkIcon, ChevronRightIcon, Link2OffIcon } from "lucide-react"
import { useTabStore } from "@/lib/stores/tab-store"

interface BacklinkItem {
  id: string
  title: string
  linked?: boolean
}

interface BacklinksPanelProps {
  noteId: string
}

export function BacklinksPanel({ noteId }: BacklinksPanelProps) {
  const { openTab } = useTabStore()
  const [backlinks, setBacklinks] = React.useState<BacklinkItem[]>([])
  const [expanded, setExpanded] = React.useState(false)
  const [loaded, setLoaded] = React.useState(false)

  React.useEffect(() => {
    if (!expanded || loaded) return
    fetch(`/api/notes/${noteId}/backlinks`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: BacklinkItem[]) => {
        setBacklinks(data)
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [noteId, expanded, loaded])

  // Reset when noteId changes
  React.useEffect(() => {
    setLoaded(false)
    setBacklinks([])
  }, [noteId])

  const linked = backlinks.filter((b) => b.linked !== false)
  const unlinked = backlinks.filter((b) => b.linked === false)

  return (
    <div className="border-t">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:bg-accent/50"
      >
        <ChevronRightIcon
          className={`size-3 transition-transform ${expanded ? "rotate-90" : ""}`}
        />
        <LinkIcon className="size-3" />
        Backlinks
        {loaded && backlinks.length > 0 && (
          <span className="rounded-full bg-muted px-1.5 text-xs">
            {backlinks.length}
          </span>
        )}
      </button>
      {expanded && (
        <div className="px-4 pb-2">
          {!loaded ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : backlinks.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No notes link to or mention this one.
            </p>
          ) : (
            <div className="space-y-2">
              {linked.length > 0 && (
                <div className="space-y-0.5">
                  {linked.map((bl) => (
                    <button
                      key={bl.id}
                      onClick={() => openTab(bl.id, bl.title)}
                      className="flex w-full items-center gap-2 rounded px-2 py-1 text-sm hover:bg-accent"
                    >
                      <LinkIcon className="size-3 shrink-0 text-muted-foreground" />
                      <span className="truncate">{bl.title}</span>
                    </button>
                  ))}
                </div>
              )}
              {unlinked.length > 0 && (
                <>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Link2OffIcon className="size-3" />
                    Unlinked mentions
                  </p>
                  <div className="space-y-0.5">
                    {unlinked.map((bl) => (
                      <button
                        key={bl.id}
                        onClick={() => openTab(bl.id, bl.title)}
                        className="flex w-full items-center gap-2 rounded px-2 py-1 text-sm hover:bg-accent"
                      >
                        <Link2OffIcon className="size-3 shrink-0 text-muted-foreground" />
                        <span className="truncate">{bl.title}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
