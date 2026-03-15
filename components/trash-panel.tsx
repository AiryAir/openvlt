"use client"

import * as React from "react"
import { TrashIcon, RotateCcwIcon, Trash2Icon } from "lucide-react"
import { useTabStore } from "@/lib/stores/tab-store"
import type { NoteMetadata } from "@/types"

export function TrashPanel() {
  const { openTab, closeTab } = useTabStore()
  const [notes, setNotes] = React.useState<NoteMetadata[]>([])
  const [loading, setLoading] = React.useState(true)

  const fetchTrashed = React.useCallback(async () => {
    try {
      const res = await fetch("/api/notes?filter=trash")
      if (res.ok) {
        setNotes(await res.json())
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchTrashed()
  }, [fetchTrashed])

  async function handleRestore(noteId: string) {
    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore" }),
      })
      if (res.ok) {
        setNotes((prev) => prev.filter((n) => n.id !== noteId))
        window.dispatchEvent(new Event("openvlt:tree-refresh"))
      }
    } catch {
      // silently fail
    }
  }

  async function handlePermanentDelete(noteId: string) {
    if (!confirm("Permanently delete this note? This cannot be undone.")) return
    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: "DELETE",
      })
      if (res.ok) {
        setNotes((prev) => prev.filter((n) => n.id !== noteId))
        closeTab(noteId)
      }
    } catch {
      // silently fail
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <TrashIcon className="size-4 text-muted-foreground" />
        <span className="text-sm font-medium">Trash</span>
        <span className="text-sm text-muted-foreground">
          ({notes.length})
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="size-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
          </div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <TrashIcon className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Trash is empty</p>
          </div>
        ) : (
          <div className="divide-y">
            {notes.map((note) => (
              <div
                key={note.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50"
              >
                <button
                  className="min-w-0 flex-1 text-left"
                  onClick={() => openTab(note.id, note.title)}
                >
                  <p className="truncate text-sm font-medium">{note.title}</p>
                  {note.trashedAt && (
                    <p className="text-sm text-muted-foreground">
                      Deleted{" "}
                      {new Date(note.trashedAt).toLocaleDateString()}
                    </p>
                  )}
                </button>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => handleRestore(note.id)}
                    title="Restore"
                    className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    <RotateCcwIcon className="size-4" />
                  </button>
                  <button
                    onClick={() => handlePermanentDelete(note.id)}
                    title="Delete permanently"
                    className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2Icon className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
