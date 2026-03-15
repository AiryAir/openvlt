"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface TimelineSliderProps {
  events: { timestamp: string; label: string }[]
  value: string
  onChange: (timestamp: string) => void
  min: string
  max: string
}

export function TimelineSlider({
  events,
  value,
  onChange,
  min,
  max,
}: TimelineSliderProps) {
  const minTime = new Date(min).getTime()
  const maxTime = new Date(max).getTime()
  const range = maxTime - minTime || 1

  const valuePercent = ((new Date(value).getTime() - minTime) / range) * 100

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const ts = new Date(minTime + percent * range).toISOString()
    onChange(ts)
  }

  function handleEventClick(timestamp: string, e: React.MouseEvent) {
    e.stopPropagation()
    onChange(timestamp)
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{formatDate(min)}</span>
        <span>{formatDate(max)}</span>
      </div>
      <div
        className="relative h-8 cursor-pointer rounded-md border bg-muted/30"
        onClick={handleClick}
      >
        {/* Event tick marks */}
        {events.map((event, i) => {
          const pos =
            ((new Date(event.timestamp).getTime() - minTime) / range) * 100
          return (
            <button
              key={i}
              className="absolute top-1 h-6 w-px bg-foreground/30 hover:bg-primary hover:w-0.5 transition-all"
              style={{ left: `${pos}%` }}
              onClick={(e) => handleEventClick(event.timestamp, e)}
              title={`${event.label} – ${formatDate(event.timestamp)}`}
            />
          )
        })}

        {/* Current position indicator */}
        <div
          className="absolute top-0 h-full w-0.5 bg-primary"
          style={{ left: `${Math.max(0, Math.min(100, valuePercent))}%` }}
        >
          <div className="absolute -left-1.5 -top-1 size-3 rounded-full border-2 border-primary bg-background" />
        </div>
      </div>
      <div className="text-center text-xs font-medium">
        {new Date(value).toLocaleString()}
      </div>
    </div>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })
}
