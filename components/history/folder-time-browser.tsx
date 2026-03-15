"use client"

import * as React from "react"
import { TimelineSlider } from "@/components/history/timeline-slider"
import { FileTextIcon, FolderIcon, PlusIcon, MinusIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { StructureEvent } from "@/types"

interface FolderTimeBrowserProps {
  folderId: string
}

interface FolderState {
  notes: { id: string; title: string; filePath: string }[]
  folders: { id: string; name: string; path: string }[]
  events: StructureEvent[]
  timestamp: string
}

export function FolderTimeBrowser({ folderId }: FolderTimeBrowserProps) {
  const [state, setState] = React.useState<FolderState | null>(null)
  const [events, setEvents] = React.useState<
    { timestamp: string; label: string }[]
  >([])
  const [selectedTime, setSelectedTime] = React.useState(
    new Date().toISOString()
  )
  const [loading, setLoading] = React.useState(false)
  const [earliest, setEarliest] = React.useState<string | null>(null)

  // Fetch events for the timeline
  React.useEffect(() => {
    fetch(
      `/api/history/events?entityType=folder&entityId=${folderId}&limit=500`
    )
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
  }, [folderId])

  // Fetch folder state at selected time
  React.useEffect(() => {
    setLoading(true)
    fetch(`/api/history/folders/${folderId}?at=${selectedTime}`)
      .then((r) => r.json())
      .then((data) => setState(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [folderId, selectedTime])

  const now = new Date().toISOString()

  return (
    <div className="flex flex-col gap-4 p-3">
      <TimelineSlider
        events={events}
        value={selectedTime}
        onChange={setSelectedTime}
        min={earliest ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()}
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
            {state.folders.map((f) => (
              <div
                key={f.id}
                className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm"
              >
                <FolderIcon className="size-4 text-muted-foreground" />
                <span>{f.name}</span>
              </div>
            ))}
            {state.notes.map((n) => (
              <div
                key={n.id}
                className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm"
              >
                <FileTextIcon className="size-4 text-muted-foreground" />
                <span>{n.title}</span>
              </div>
            ))}
          </div>

          {/* Recent events */}
          {state.events.length > 0 && (
            <div className="mt-4 space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                Changes since selected time
              </p>
              {state.events.slice(0, 20).map((e) => (
                <EventRow key={e.id} event={e} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">
          Select a point in time to view folder state
        </div>
      )}
    </div>
  )
}

function EventRow({ event }: { event: StructureEvent }) {
  const isCreation = event.eventType.includes("created") || event.eventType.includes("added")
  const isDeletion = event.eventType.includes("deleted") || event.eventType.includes("removed") || event.eventType.includes("trashed")

  return (
    <div className="flex items-center gap-2 rounded-sm px-2 py-1 text-xs text-muted-foreground">
      {isCreation ? (
        <PlusIcon className="size-3 text-green-500" />
      ) : isDeletion ? (
        <MinusIcon className="size-3 text-red-500" />
      ) : (
        <span className="size-3" />
      )}
      <span>{event.eventType.replace(/_/g, " ")}</span>
      <span className="ml-auto">
        {new Date(event.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
    </div>
  )
}
