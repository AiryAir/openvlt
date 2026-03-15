"use client"

import * as React from "react"
import { TimelineSlider } from "@/components/history/timeline-slider"
import { FileTextIcon, FolderIcon } from "lucide-react"
import type { StructureEvent } from "@/types"

interface VaultState {
  notes: {
    id: string
    title: string
    filePath: string
    parentId: string | null
  }[]
  folders: {
    id: string
    name: string
    path: string
    parentId: string | null
  }[]
  events: StructureEvent[]
  timestamp: string
}

interface TreeItem {
  id: string
  name: string
  type: "folder" | "note"
  children: TreeItem[]
}

export function VaultTimeBrowser() {
  const [state, setState] = React.useState<VaultState | null>(null)
  const [events, setEvents] = React.useState<
    { timestamp: string; label: string }[]
  >([])
  const [selectedTime, setSelectedTime] = React.useState(
    new Date().toISOString()
  )
  const [loading, setLoading] = React.useState(false)
  const [earliest, setEarliest] = React.useState<string | null>(null)

  // Fetch all events for the timeline
  React.useEffect(() => {
    fetch("/api/history/events?limit=500")
      .then((r) => r.json())
      .then((data) => {
        const evts = (data.events ?? []).map((e: StructureEvent) => ({
          timestamp: e.createdAt,
          label: e.eventType.replace(/_/g, " "),
        }))
        setEvents(evts)
        if (evts.length > 0) {
          setEarliest(evts[evts.length - 1].timestamp)
        }
      })
      .catch(() => {})
  }, [])

  // Fetch vault state at selected time
  React.useEffect(() => {
    setLoading(true)
    fetch(`/api/history/vault?at=${selectedTime}`)
      .then((r) => r.json())
      .then((data) => setState(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [selectedTime])

  const now = new Date().toISOString()
  const tree = state ? buildTree(state.folders, state.notes) : []

  return (
    <div className="flex flex-col gap-4 p-3">
      <TimelineSlider
        events={events}
        value={selectedTime}
        onChange={setSelectedTime}
        min={
          earliest ??
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        }
        max={now}
      />

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : state ? (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            {state.folders.length} folder{state.folders.length !== 1 ? "s" : ""},{" "}
            {state.notes.length} note{state.notes.length !== 1 ? "s" : ""}
          </p>

          <div className="space-y-0.5">
            {tree.map((item) => (
              <TreeItemView key={item.id} item={item} depth={0} />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">
          Select a point in time to view vault state
        </div>
      )}
    </div>
  )
}

function TreeItemView({ item, depth }: { item: TreeItem; depth: number }) {
  const [expanded, setExpanded] = React.useState(true)

  return (
    <div>
      <button
        onClick={() => item.type === "folder" && setExpanded(!expanded)}
        className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-muted/50"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {item.type === "folder" ? (
          <FolderIcon className="size-4 text-muted-foreground" />
        ) : (
          <FileTextIcon className="size-4 text-muted-foreground" />
        )}
        <span className="truncate">{item.name}</span>
      </button>
      {item.type === "folder" && expanded && item.children.length > 0 && (
        <div>
          {item.children.map((child) => (
            <TreeItemView key={child.id} item={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

function buildTree(
  folders: VaultState["folders"],
  notes: VaultState["notes"]
): TreeItem[] {
  const folderMap = new Map<string | null, TreeItem[]>()

  // Initialize root
  folderMap.set(null, [])

  // Add folders
  for (const f of folders) {
    const item: TreeItem = {
      id: f.id,
      name: f.name,
      type: "folder",
      children: [],
    }
    const parentKey = f.parentId
    if (!folderMap.has(parentKey)) folderMap.set(parentKey, [])
    folderMap.get(parentKey)!.push(item)
  }

  // Add notes
  for (const n of notes) {
    const item: TreeItem = {
      id: n.id,
      name: n.title,
      type: "note",
      children: [],
    }
    const parentKey = n.parentId
    if (!folderMap.has(parentKey)) folderMap.set(parentKey, [])
    folderMap.get(parentKey)!.push(item)
  }

  // Build tree recursively
  function buildChildren(parentId: string | null): TreeItem[] {
    const children = folderMap.get(parentId) ?? []
    for (const child of children) {
      if (child.type === "folder") {
        child.children = buildChildren(child.id)
      }
    }
    // Sort: folders first, then alphabetically
    return children.sort((a, b) => {
      if (a.type !== b.type) return a.type === "folder" ? -1 : 1
      return a.name.localeCompare(b.name)
    })
  }

  return buildChildren(null)
}
