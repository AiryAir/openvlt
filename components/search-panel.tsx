"use client"

import * as React from "react"
import {
  SearchIcon,
  FileTextIcon,
  StarIcon,
  TagIcon,
  CalendarIcon,
  FilterIcon,
} from "lucide-react"
import { useTabStore } from "@/lib/stores/tab-store"
import { useDebouncedCallback } from "@/hooks/use-debounce"
import type { NoteMetadata } from "@/types"

type FilterType = "all" | "favorites" | "locked" | "tagged"

export function SearchPanel() {
  const { openTab } = useTabStore()
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<NoteMetadata[]>([])
  const [loading, setLoading] = React.useState(false)
  const [filter, setFilter] = React.useState<FilterType>("all")
  const [tagFilter, setTagFilter] = React.useState("")
  const [allTags, setAllTags] = React.useState<string[]>([])

  // Load tags on mount
  React.useEffect(() => {
    fetch("/api/tags")
      .then((r) => (r.ok ? r.json() : []))
      .then((tags: { name: string }[]) => setAllTags(tags.map((t) => t.name)))
      .catch(() => {})
  }, [])

  const search = useDebouncedCallback(async (q: string) => {
    setLoading(true)
    try {
      let url = "/api/notes?"

      if (q.trim()) {
        url += `search=${encodeURIComponent(q.trim())}`
      } else if (filter === "favorites") {
        url += "filter=favorites"
      } else {
        url += "filter=all"
      }

      const res = await fetch(url)
      if (res.ok) {
        let data: NoteMetadata[] = await res.json()

        // Client-side filtering
        if (filter === "favorites" && q.trim()) {
          data = data.filter((n) => n.isFavorite)
        }
        if (filter === "locked") {
          data = data.filter((n) => n.isLocked)
        }
        if (filter === "tagged" && tagFilter) {
          data = data.filter((n) => n.tags.includes(tagFilter))
        }

        setResults(data)
      }
    } catch {}
    setLoading(false)
  }, 200)

  React.useEffect(() => {
    search(query)
  }, [query, filter, tagFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes..."
            className="h-9 w-full rounded-md border bg-background pl-8 pr-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            autoFocus
          />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Filter sidebar */}
        <div className="w-48 shrink-0 space-y-1 overflow-y-auto border-r p-3">
          <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <FilterIcon className="size-3.5" /> Filters
          </p>
          {(
            [
              { value: "all", label: "All Notes", icon: FileTextIcon },
              { value: "favorites", label: "Favorites", icon: StarIcon },
              { value: "locked", label: "Locked", icon: FileTextIcon },
            ] as const
          ).map((f) => (
            <button
              key={f.value}
              onClick={() => {
                setFilter(f.value)
                setTagFilter("")
              }}
              className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm ${
                filter === f.value && !tagFilter
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/50"
              }`}
            >
              <f.icon className="size-3.5" />
              {f.label}
            </button>
          ))}

          {allTags.length > 0 && (
            <>
              <p className="mb-1 mt-3 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                <TagIcon className="size-3.5" /> Tags
              </p>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    setFilter("tagged")
                    setTagFilter(tag)
                  }}
                  className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm ${
                    tagFilter === tag
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/50"
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </>
          )}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="size-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
            </div>
          ) : results.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {query ? "No results found" : "Start typing to search"}
            </div>
          ) : (
            <div className="space-y-1">
              <p className="mb-3 text-sm text-muted-foreground">
                {results.length} result{results.length !== 1 ? "s" : ""}
              </p>
              {results.map((note) => (
                <button
                  key={note.id}
                  onClick={() => openTab(note.id, note.title)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-accent"
                >
                  <FileTextIcon className="size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {note.title}
                      {note.isLocked && " 🔒"}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="size-3" />
                        {new Date(note.updatedAt).toLocaleDateString()}
                      </span>
                      {note.isFavorite && (
                        <StarIcon className="size-3 fill-yellow-400 text-yellow-400" />
                      )}
                      {note.tags.map((tag) => (
                        <span key={tag} className="rounded bg-muted px-1">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
