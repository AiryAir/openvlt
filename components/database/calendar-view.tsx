"use client"

import * as React from "react"
import {
  FileTextIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SettingsIcon,
  PlusIcon,
  CalendarDaysIcon,
  CalendarIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useTabStore } from "@/lib/stores/tab-store"
import type {
  DatabaseViewRow,
  PropertyDefinition,
  DatabaseViewConfig,
} from "@/types"

// ── Types ──────────────────────────────────────────────────────────────

interface CalendarViewProps {
  rows: DatabaseViewRow[]
  definitions: PropertyDefinition[]
  config: DatabaseViewConfig
  onConfigUpdate: (config: DatabaseViewConfig) => void
  onRefresh: () => void
}

interface CalendarEvent {
  noteId: string
  title: string
  icon: string | null
  start: string
  end: string
  isMultiDay: boolean
  properties: Record<string, string | number | boolean | string[] | null>
}

interface CellInteractionHandlers {
  onMouseDown: (e: React.MouseEvent) => void
  onMouseEnter: () => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
}

// ── Constants ──────────────────────────────────────────────────────────

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const BAR_H = 21
const BAR_GAP = 2
const MAX_SINGLE = 2
const MAX_LANES = 3
const DATE_HEADER_H = 26

// ── Date Helpers ───────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function parseDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number)
  return new Date(y, m - 1, d)
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function daysBetween(a: string, b: string): number {
  return Math.round(
    (parseDate(b).getTime() - parseDate(a).getTime()) / 86400000
  )
}

function getMonthWeeks(year: number, month: number): Date[][] {
  const first = new Date(year, month, 1)
  const start = addDays(first, -first.getDay())
  const weeks: Date[][] = []
  let cur = new Date(start)
  for (let w = 0; w < 6; w++) {
    const week: Date[] = []
    for (let d = 0; d < 7; d++) {
      week.push(new Date(cur))
      cur = addDays(cur, 1)
    }
    weeks.push(week)
  }
  return weeks
}

function getWeekDays(date: Date): Date[] {
  const start = addDays(date, -date.getDay())
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

// ── Lane Assignment for Multi-Day Bars ─────────────────────────────────

interface LaneEntry {
  event: CalendarEvent
  startCol: number
  endCol: number
  startsInWeek: boolean
  endsInWeek: boolean
}

function assignLanes(
  events: CalendarEvent[],
  weekStart: string,
  weekEnd: string
): LaneEntry[][] {
  const relevant = events
    .filter((e) => e.isMultiDay && e.start <= weekEnd && e.end >= weekStart)
    .sort((a, b) => {
      if (a.start !== b.start) return a.start < b.start ? -1 : 1
      return daysBetween(a.start, a.end) > daysBetween(b.start, b.end) ? -1 : 1
    })

  const lanes: LaneEntry[][] = []
  for (const event of relevant) {
    const clampedStart = event.start < weekStart ? weekStart : event.start
    const clampedEnd = event.end > weekEnd ? weekEnd : event.end
    const startCol = daysBetween(weekStart, clampedStart)
    const endCol = daysBetween(weekStart, clampedEnd)
    const entry: LaneEntry = {
      event,
      startCol,
      endCol,
      startsInWeek: event.start >= weekStart,
      endsInWeek: event.end <= weekEnd,
    }

    let placed = false
    for (const lane of lanes) {
      const overlaps = lane.some(
        (e) => !(endCol < e.startCol || startCol > e.endCol)
      )
      if (!overlaps) {
        lane.push(entry)
        placed = true
        break
      }
    }
    if (!placed) {
      if (lanes.length < MAX_LANES) {
        lanes.push([entry])
      }
    }
  }
  return lanes
}

// ── Main Component ─────────────────────────────────────────────────────

export function CalendarView({
  rows,
  definitions,
  config,
  onConfigUpdate,
  onRefresh,
}: CalendarViewProps) {
  const { openTab } = useTabStore()
  const [mode, setMode] = React.useState<"month" | "week">("month")
  const [currentDate, setCurrentDate] = React.useState(() => new Date())
  const [creatingOnDate, setCreatingOnDate] = React.useState<string | null>(
    null
  )
  const [newCardTitle, setNewCardTitle] = React.useState("")
  const [dayPopover, setDayPopover] = React.useState<string | null>(null)
  const [hoverEvent, setHoverEvent] = React.useState<{
    event: CalendarEvent
    rect: DOMRect
  } | null>(null)
  const hoverTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null
  )

  // Drag-to-create
  const dragStartRef = React.useRef<string | null>(null)
  const dragEndRef = React.useRef<string | null>(null)
  const [dragRange, setDragRange] = React.useState<{
    start: string
    end: string
  } | null>(null)
  const [showDragCreate, setShowDragCreate] = React.useState(false)

  const today = new Date()
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const calendarDef = config.calendarPropertyId
    ? definitions.find((d) => d.id === config.calendarPropertyId)
    : null
  const endDef = config.calendarEndPropertyId
    ? definitions.find((d) => d.id === config.calendarEndPropertyId)
    : null
  const dateDefs = definitions.filter((d) => d.type === "date")

  // ── Parse events ────────────────────────────────────────────────────

  const events = React.useMemo<CalendarEvent[]>(() => {
    if (!calendarDef) return []
    return rows
      .map((row) => {
        const startVal = row.properties[calendarDef.name]
        if (!startVal) return null
        const start = String(startVal).slice(0, 10)
        const endVal = endDef ? row.properties[endDef.name] : null
        const end = endVal ? String(endVal).slice(0, 10) : start
        const finalEnd = end >= start ? end : start
        return {
          noteId: row.noteId,
          title: row.title,
          icon: row.icon,
          start,
          end: finalEnd,
          isMultiDay: finalEnd !== start,
          properties: row.properties,
        }
      })
      .filter(Boolean) as CalendarEvent[]
  }, [rows, calendarDef, endDef])

  const singleByDate = React.useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    for (const ev of events) {
      if (ev.isMultiDay) continue
      if (!map.has(ev.start)) map.set(ev.start, [])
      map.get(ev.start)!.push(ev)
    }
    return map
  }, [events])

  // All events for a date (including multi-day)
  const allByDate = React.useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    for (const ev of events) {
      const s = parseDate(ev.start)
      const e = parseDate(ev.end)
      const cur = new Date(s)
      while (cur <= e) {
        const ds = toDateStr(cur)
        if (!map.has(ds)) map.set(ds, [])
        map.get(ds)!.push(ev)
        cur.setDate(cur.getDate() + 1)
      }
    }
    return map
  }, [events])

  // ── Empty state ─────────────────────────────────────────────────────

  if (!calendarDef) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
        <p className="text-sm text-muted-foreground">
          Choose a date property to display notes on the calendar
        </p>
        {dateDefs.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {dateDefs.map((d) => (
              <Button
                key={d.id}
                variant="outline"
                size="sm"
                onClick={() =>
                  onConfigUpdate({ ...config, calendarPropertyId: d.id })
                }
              >
                {d.name}
              </Button>
            ))}
          </div>
        ) : (
          <p className="max-w-xs text-center text-xs text-muted-foreground">
            No date properties exist yet. Create a date property on any note
            first, then switch to calendar view.
          </p>
        )}
      </div>
    )
  }

  // ── Navigation ──────────────────────────────────────────────────────

  function prev() {
    if (mode === "month") setCurrentDate(new Date(year, month - 1, 1))
    else setCurrentDate(addDays(currentDate, -7))
  }
  function next() {
    if (mode === "month") setCurrentDate(new Date(year, month + 1, 1))
    else setCurrentDate(addDays(currentDate, 7))
  }
  function goToday() {
    setCurrentDate(new Date())
  }

  const headerLabel =
    mode === "month"
      ? currentDate.toLocaleString("default", {
          month: "long",
          year: "numeric",
        })
      : (() => {
          const wd = getWeekDays(currentDate)
          return `${wd[0].toLocaleDateString("default", { month: "short", day: "numeric" })} \u2013 ${wd[6].toLocaleDateString("default", { month: "short", day: "numeric", year: "numeric" })}`
        })()

  // ── Handlers ────────────────────────────────────────────────────────

  async function handleCreateCard(startDate: string, endDate?: string) {
    const title = newCardTitle.trim()
    if (!title || !calendarDef) return
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      })
      if (res.ok) {
        const note = await res.json()
        await fetch(`/api/notes/${note.id}/properties`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: calendarDef.name, value: startDate }),
        })
        if (endDate && endDate !== startDate && endDef) {
          await fetch(`/api/notes/${note.id}/properties`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: endDef.name, value: endDate }),
          })
        }
        setNewCardTitle("")
        setCreatingOnDate(null)
        setShowDragCreate(false)
        setDragRange(null)
        window.dispatchEvent(new Event("openvlt:tree-refresh"))
        onRefresh()
      }
    } catch {}
  }

  async function handleDropOnDate(e: React.DragEvent, dateStr: string) {
    e.preventDefault()
    if (!calendarDef) return
    const noteId = e.dataTransfer.getData("text/plain")
    if (!noteId) return
    await fetch(`/api/notes/${noteId}/properties`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: calendarDef.name, value: dateStr }),
    })
    onRefresh()
  }

  // ── Hover preview ───────────────────────────────────────────────────

  function handleEventMouseEnter(ev: CalendarEvent, el: HTMLElement) {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
    hoverTimeoutRef.current = setTimeout(() => {
      setHoverEvent({ event: ev, rect: el.getBoundingClientRect() })
    }, 400)
  }

  function handleEventMouseLeave() {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
    setHoverEvent(null)
  }

  // ── Drag-to-create ──────────────────────────────────────────────────

  function handleCellMouseDown(e: React.MouseEvent, dateStr: string) {
    if ((e.target as HTMLElement).closest("button, input, form, a")) return
    e.preventDefault()
    dragStartRef.current = dateStr
    dragEndRef.current = dateStr
    setDragRange({ start: dateStr, end: dateStr })
    setShowDragCreate(false)
  }

  function handleCellMouseEnter(dateStr: string) {
    if (!dragStartRef.current) return
    dragEndRef.current = dateStr
    const s = dragStartRef.current
    const e = dateStr
    setDragRange(s <= e ? { start: s, end: e } : { start: e, end: s })
  }

  React.useEffect(() => {
    function handleMouseUp() {
      const s = dragStartRef.current
      const e = dragEndRef.current
      if (!s) return
      dragStartRef.current = null
      dragEndRef.current = null

      if (!e || s === e) {
        setDragRange(null)
        return
      }
      const [start, end] = s <= e ? [s, e] : [e, s]
      setDragRange({ start, end })
      setShowDragCreate(true)
    }
    document.addEventListener("mouseup", handleMouseUp)
    return () => document.removeEventListener("mouseup", handleMouseUp)
  }, [])

  React.useEffect(() => {
    if (dragStartRef.current) {
      document.body.style.userSelect = "none"
      return () => {
        document.body.style.userSelect = ""
      }
    }
  })

  function isDragHighlighted(dateStr: string): boolean {
    if (!dragRange || showDragCreate) return false
    return dateStr >= dragRange.start && dateStr <= dragRange.end
  }

  // ── Shared cell props builder ───────────────────────────────────────

  function cellInteraction(dateStr: string): CellInteractionHandlers {
    return {
      onMouseDown: (e: React.MouseEvent) => handleCellMouseDown(e, dateStr),
      onMouseEnter: () => handleCellMouseEnter(dateStr),
      onDragOver: (e: React.DragEvent) => e.preventDefault(),
      onDrop: (e: React.DragEvent) => handleDropOnDate(e, dateStr),
    }
  }

  // ── Data for views ──────────────────────────────────────────────────

  const weeks = React.useMemo(() => getMonthWeeks(year, month), [year, month])
  const weekDays = React.useMemo(
    () => getWeekDays(currentDate),
    [currentDate]
  )

  // ── Render ──────────────────────────────────────────────────────────

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-2 px-4 py-2">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={prev}>
            <ChevronLeftIcon className="size-4" />
          </Button>
          <span className="min-w-[160px] text-center text-sm font-medium">
            {headerLabel}
          </span>
          <Button variant="ghost" size="icon-sm" onClick={next}>
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={goToday}
        >
          Today
        </Button>

        {/* Mode toggle */}
        <div className="ml-2 flex overflow-hidden rounded-md border">
          <button
            onClick={() => setMode("month")}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs transition-colors ${
              mode === "month"
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <CalendarIcon className="size-3.5" />
            Month
          </button>
          <button
            onClick={() => setMode("week")}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs transition-colors ${
              mode === "week"
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <CalendarDaysIcon className="size-3.5" />
            Week
          </button>
        </div>

        {/* Settings */}
        <div className="ml-auto">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon-sm" title="Calendar settings">
                <SettingsIcon className="size-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-52 p-2" align="end">
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                Start date property
              </p>
              {dateDefs.map((d) => (
                <button
                  key={d.id}
                  onClick={() =>
                    onConfigUpdate({ ...config, calendarPropertyId: d.id })
                  }
                  className={`flex w-full rounded-md px-2 py-1.5 text-sm hover:bg-muted ${
                    d.id === config.calendarPropertyId ? "bg-muted" : ""
                  }`}
                >
                  {d.name}
                </button>
              ))}
              <div className="my-2 border-t" />
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                End date property (for ranges)
              </p>
              <button
                onClick={() =>
                  onConfigUpdate({
                    ...config,
                    calendarEndPropertyId: undefined,
                  })
                }
                className={`flex w-full rounded-md px-2 py-1.5 text-sm hover:bg-muted ${
                  !config.calendarEndPropertyId ? "bg-muted" : ""
                }`}
              >
                None
              </button>
              {dateDefs
                .filter((d) => d.id !== config.calendarPropertyId)
                .map((d) => (
                  <button
                    key={d.id}
                    onClick={() =>
                      onConfigUpdate({
                        ...config,
                        calendarEndPropertyId: d.id,
                      })
                    }
                    className={`flex w-full rounded-md px-2 py-1.5 text-sm hover:bg-muted ${
                      d.id === config.calendarEndPropertyId ? "bg-muted" : ""
                    }`}
                  >
                    {d.name}
                  </button>
                ))}
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Grid */}
      <div className="flex min-h-0 flex-1 flex-col px-4 pb-4">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b">
          {(mode === "week" ? weekDays : WEEKDAYS).map((d, i) => (
            <div
              key={i}
              className="py-1.5 text-center text-xs font-medium text-muted-foreground"
            >
              {mode === "week"
                ? `${WEEKDAYS[i]} ${(d as Date).getDate()}`
                : (d as string)}
            </div>
          ))}
        </div>

        {mode === "month" ? (
          <MonthGrid
            weeks={weeks}
            month={month}
            today={today}
            events={events}
            singleByDate={singleByDate}
            allByDate={allByDate}
            cellInteraction={cellInteraction}
            isDragHighlighted={isDragHighlighted}
            openTab={openTab}
            onEventMouseEnter={handleEventMouseEnter}
            onEventMouseLeave={handleEventMouseLeave}
            creatingOnDate={creatingOnDate}
            setCreatingOnDate={setCreatingOnDate}
            newCardTitle={newCardTitle}
            setNewCardTitle={setNewCardTitle}
            onCreateCard={handleCreateCard}
            dayPopover={dayPopover}
            setDayPopover={setDayPopover}
          />
        ) : (
          <WeekGrid
            days={weekDays}
            today={today}
            events={events}
            singleByDate={singleByDate}
            allByDate={allByDate}
            cellInteraction={cellInteraction}
            isDragHighlighted={isDragHighlighted}
            openTab={openTab}
            onEventMouseEnter={handleEventMouseEnter}
            onEventMouseLeave={handleEventMouseLeave}
            creatingOnDate={creatingOnDate}
            setCreatingOnDate={setCreatingOnDate}
            newCardTitle={newCardTitle}
            setNewCardTitle={setNewCardTitle}
            onCreateCard={handleCreateCard}
          />
        )}
      </div>

      {/* Drag-create overlay */}
      {showDragCreate && dragRange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm">
          <div className="w-80 rounded-lg border bg-popover p-4 shadow-lg">
            <p className="mb-1 text-sm font-medium">New note</p>
            <p className="mb-3 text-xs text-muted-foreground">
              {parseDate(dragRange.start).toLocaleDateString("default", {
                month: "short",
                day: "numeric",
              })}{" "}
              &rarr;{" "}
              {parseDate(dragRange.end).toLocaleDateString("default", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleCreateCard(dragRange.start, dragRange.end)
              }}
            >
              <input
                type="text"
                value={newCardTitle}
                onChange={(e) => setNewCardTitle(e.target.value)}
                placeholder="Note title"
                autoFocus
                className="mb-3 h-8 w-full rounded-md border bg-background px-2.5 text-sm outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setShowDragCreate(false)
                    setDragRange(null)
                    setNewCardTitle("")
                  }
                }}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowDragCreate(false)
                    setDragRange(null)
                    setNewCardTitle("")
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!newCardTitle.trim()}
                >
                  Create
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hover preview */}
      {hoverEvent && (
        <HoverPreview
          event={hoverEvent.event}
          rect={hoverEvent.rect}
          calendarDefName={calendarDef.name}
          endDefName={endDef?.name}
        />
      )}
    </div>
  )
}

// ── Month Grid ─────────────────────────────────────────────────────────

function MonthGrid({
  weeks,
  month,
  today,
  events,
  singleByDate,
  allByDate,
  cellInteraction,
  isDragHighlighted,
  openTab,
  onEventMouseEnter,
  onEventMouseLeave,
  creatingOnDate,
  setCreatingOnDate,
  newCardTitle,
  setNewCardTitle,
  onCreateCard,
  dayPopover,
  setDayPopover,
}: {
  weeks: Date[][]
  month: number
  today: Date
  events: CalendarEvent[]
  singleByDate: Map<string, CalendarEvent[]>
  allByDate: Map<string, CalendarEvent[]>
  cellInteraction: (dateStr: string) => CellInteractionHandlers
  isDragHighlighted: (dateStr: string) => boolean
  openTab: (id: string, title: string) => void
  onEventMouseEnter: (ev: CalendarEvent, el: HTMLElement) => void
  onEventMouseLeave: () => void
  creatingOnDate: string | null
  setCreatingOnDate: (d: string | null) => void
  newCardTitle: string
  setNewCardTitle: (t: string) => void
  onCreateCard: (start: string, end?: string) => void
  dayPopover: string | null
  setDayPopover: (d: string | null) => void
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {weeks.map((week, wIdx) => {
        const weekStartStr = toDateStr(week[0])
        const weekEndStr = toDateStr(week[6])
        const lanes = assignLanes(events, weekStartStr, weekEndStr)
        const laneHeight = lanes.length * (BAR_H + BAR_GAP)

        return (
          <div key={wIdx} className="relative flex min-h-0 flex-1">
            {/* Day cells */}
            <div className="grid flex-1 grid-cols-7">
              {week.map((day, dIdx) => {
                const dateStr = toDateStr(day)
                const isCurrentMonth = day.getMonth() === month
                const isToday = isSameDay(day, today)
                const singles = singleByDate.get(dateStr) ?? []
                const allForDay = allByDate.get(dateStr) ?? []
                const isCreating = creatingOnDate === dateStr
                const highlighted = isDragHighlighted(dateStr)

                return (
                  <div
                    key={dIdx}
                    className={`flex flex-col border-b border-r p-1 ${
                      dIdx === 0 ? "border-l" : ""
                    } ${!isCurrentMonth ? "bg-muted/20" : ""} ${
                      highlighted ? "bg-primary/5" : ""
                    }`}
                    {...cellInteraction(dateStr)}
                  >
                    {/* Date header */}
                    <div className="group flex shrink-0 items-center justify-between">
                      <span
                        className={`flex size-6 items-center justify-center rounded-full text-xs ${
                          isToday
                            ? "bg-primary font-semibold text-primary-foreground"
                            : !isCurrentMonth
                              ? "text-muted-foreground/50"
                              : "text-foreground"
                        }`}
                      >
                        {day.getDate()}
                      </span>
                      {isCurrentMonth && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setCreatingOnDate(dateStr)
                            setNewCardTitle("")
                          }}
                          className="flex size-5 items-center justify-center rounded text-muted-foreground/0 transition-colors group-hover:text-muted-foreground hover:bg-accent"
                        >
                          <PlusIcon className="size-3" />
                        </button>
                      )}
                    </div>

                    {/* Spacer for multi-day bars */}
                    {laneHeight > 0 && (
                      <div
                        className="shrink-0"
                        style={{ height: laneHeight }}
                      />
                    )}

                    {/* Single-day events + overflow */}
                    <div className="mt-0.5 min-h-0 flex-1 space-y-0.5 overflow-hidden">
                      {isCreating && (
                        <InlineCreateForm
                          title={newCardTitle}
                          setTitle={setNewCardTitle}
                          onSubmit={() => onCreateCard(dateStr)}
                          onCancel={() => {
                            setCreatingOnDate(null)
                            setNewCardTitle("")
                          }}
                        />
                      )}
                      {singles.slice(0, MAX_SINGLE).map((ev) => (
                        <EventCard
                          key={ev.noteId}
                          event={ev}
                          openTab={openTab}
                          onMouseEnter={onEventMouseEnter}
                          onMouseLeave={onEventMouseLeave}
                        />
                      ))}
                      {allForDay.length > MAX_SINGLE && (
                        <Popover
                          open={dayPopover === dateStr}
                          onOpenChange={(open) =>
                            setDayPopover(open ? dateStr : null)
                          }
                        >
                          <PopoverTrigger asChild>
                            <button
                              className="w-full rounded px-1 text-left text-xs text-muted-foreground hover:bg-muted"
                              onClick={(e) => e.stopPropagation()}
                            >
                              +{allForDay.length - MAX_SINGLE} more
                            </button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-56 p-2"
                            align="start"
                            side="right"
                          >
                            <p className="mb-2 text-xs font-medium text-muted-foreground">
                              {day.toLocaleDateString("default", {
                                weekday: "long",
                                month: "long",
                                day: "numeric",
                              })}
                            </p>
                            <div className="space-y-1">
                              {allForDay.map((ev) => (
                                <EventCard
                                  key={ev.noteId}
                                  event={ev}
                                  openTab={openTab}
                                  onMouseEnter={onEventMouseEnter}
                                  onMouseLeave={onEventMouseLeave}
                                />
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Multi-day bars overlay */}
            {lanes.length > 0 && (
              <div
                className="pointer-events-none absolute inset-x-0 z-10"
                style={{ top: DATE_HEADER_H }}
              >
                {lanes.map((lane, lIdx) =>
                  lane.map((entry) => {
                    const leftPad = entry.startsInWeek ? 3 : 0
                    const rightPad = entry.endsInWeek ? 3 : 0
                    return (
                      <button
                        key={`${entry.event.noteId}-${wIdx}`}
                        className="pointer-events-auto absolute flex items-center gap-1 truncate bg-primary/15 px-1.5 text-xs text-primary transition-colors hover:bg-primary/25"
                        style={{
                          top: lIdx * (BAR_H + BAR_GAP),
                          left: `calc(${(entry.startCol / 7) * 100}% + ${leftPad}px)`,
                          width: `calc(${((entry.endCol - entry.startCol + 1) / 7) * 100}% - ${leftPad + rightPad}px)`,
                          height: BAR_H,
                          borderRadius: `${entry.startsInWeek ? 4 : 0}px ${entry.endsInWeek ? 4 : 0}px ${entry.endsInWeek ? 4 : 0}px ${entry.startsInWeek ? 4 : 0}px`,
                        }}
                        onClick={() =>
                          openTab(entry.event.noteId, entry.event.title)
                        }
                        onMouseEnter={(e) =>
                          onEventMouseEnter(entry.event, e.currentTarget)
                        }
                        onMouseLeave={onEventMouseLeave}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData(
                            "text/plain",
                            entry.event.noteId
                          )
                          e.dataTransfer.effectAllowed = "move"
                        }}
                      >
                        {entry.startsInWeek &&
                          (entry.event.icon ? (
                            <span className="shrink-0 text-xs">
                              {entry.event.icon}
                            </span>
                          ) : (
                            <FileTextIcon className="size-3 shrink-0" />
                          ))}
                        <span className="truncate">{entry.event.title}</span>
                      </button>
                    )
                  })
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Week Grid ──────────────────────────────────────────────────────────

function WeekGrid({
  days,
  today,
  events,
  singleByDate,
  allByDate,
  cellInteraction,
  isDragHighlighted,
  openTab,
  onEventMouseEnter,
  onEventMouseLeave,
  creatingOnDate,
  setCreatingOnDate,
  newCardTitle,
  setNewCardTitle,
  onCreateCard,
}: {
  days: Date[]
  today: Date
  events: CalendarEvent[]
  singleByDate: Map<string, CalendarEvent[]>
  allByDate: Map<string, CalendarEvent[]>
  cellInteraction: (dateStr: string) => CellInteractionHandlers
  isDragHighlighted: (dateStr: string) => boolean
  openTab: (id: string, title: string) => void
  onEventMouseEnter: (ev: CalendarEvent, el: HTMLElement) => void
  onEventMouseLeave: () => void
  creatingOnDate: string | null
  setCreatingOnDate: (d: string | null) => void
  newCardTitle: string
  setNewCardTitle: (t: string) => void
  onCreateCard: (start: string, end?: string) => void
}) {
  const weekStartStr = toDateStr(days[0])
  const weekEndStr = toDateStr(days[6])
  const lanes = assignLanes(events, weekStartStr, weekEndStr)
  const laneHeight = lanes.length * (BAR_H + BAR_GAP)

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      {/* Multi-day bars at top */}
      {laneHeight > 0 && (
        <div className="relative shrink-0" style={{ height: laneHeight }}>
          {lanes.map((lane, lIdx) =>
            lane.map((entry) => {
              const leftPad = entry.startsInWeek ? 3 : 0
              const rightPad = entry.endsInWeek ? 3 : 0
              return (
                <button
                  key={entry.event.noteId}
                  className="absolute flex items-center gap-1 truncate bg-primary/15 px-1.5 text-xs text-primary transition-colors hover:bg-primary/25"
                  style={{
                    top: lIdx * (BAR_H + BAR_GAP),
                    left: `calc(${(entry.startCol / 7) * 100}% + ${leftPad}px)`,
                    width: `calc(${((entry.endCol - entry.startCol + 1) / 7) * 100}% - ${leftPad + rightPad}px)`,
                    height: BAR_H,
                    borderRadius: `${entry.startsInWeek ? 4 : 0}px ${entry.endsInWeek ? 4 : 0}px ${entry.endsInWeek ? 4 : 0}px ${entry.startsInWeek ? 4 : 0}px`,
                  }}
                  onClick={() =>
                    openTab(entry.event.noteId, entry.event.title)
                  }
                  onMouseEnter={(e) =>
                    onEventMouseEnter(entry.event, e.currentTarget)
                  }
                  onMouseLeave={onEventMouseLeave}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", entry.event.noteId)
                    e.dataTransfer.effectAllowed = "move"
                  }}
                >
                  {entry.startsInWeek &&
                    (entry.event.icon ? (
                      <span className="shrink-0 text-xs">
                        {entry.event.icon}
                      </span>
                    ) : (
                      <FileTextIcon className="size-3 shrink-0" />
                    ))}
                  <span className="truncate">{entry.event.title}</span>
                </button>
              )
            })
          )}
        </div>
      )}

      {/* Day columns */}
      <div className="grid min-h-0 flex-1 grid-cols-7">
        {days.map((day, dIdx) => {
          const dateStr = toDateStr(day)
          const isToday = isSameDay(day, today)
          const singles = singleByDate.get(dateStr) ?? []
          const isCreating = creatingOnDate === dateStr
          const highlighted = isDragHighlighted(dateStr)

          return (
            <div
              key={dIdx}
              className={`flex flex-col border-b border-r p-1.5 ${
                dIdx === 0 ? "border-l" : ""
              } ${highlighted ? "bg-primary/5" : ""}`}
              {...cellInteraction(dateStr)}
            >
              {/* Add button */}
              <div className="group mb-1 flex shrink-0 items-center justify-between">
                {isToday && (
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                    Today
                  </span>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setCreatingOnDate(dateStr)
                    setNewCardTitle("")
                  }}
                  className="ml-auto flex size-5 items-center justify-center rounded text-muted-foreground/0 transition-colors group-hover:text-muted-foreground hover:bg-accent"
                >
                  <PlusIcon className="size-3" />
                </button>
              </div>

              {/* Events (all shown, scrollable) */}
              <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
                {isCreating && (
                  <InlineCreateForm
                    title={newCardTitle}
                    setTitle={setNewCardTitle}
                    onSubmit={() => onCreateCard(dateStr)}
                    onCancel={() => {
                      setCreatingOnDate(null)
                      setNewCardTitle("")
                    }}
                  />
                )}
                {singles.map((ev) => (
                  <EventCard
                    key={ev.noteId}
                    event={ev}
                    openTab={openTab}
                    onMouseEnter={onEventMouseEnter}
                    onMouseLeave={onEventMouseLeave}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Event Card ─────────────────────────────────────────────────────────

function EventCard({
  event,
  openTab,
  onMouseEnter,
  onMouseLeave,
}: {
  event: CalendarEvent
  openTab: (id: string, title: string) => void
  onMouseEnter: (ev: CalendarEvent, el: HTMLElement) => void
  onMouseLeave: () => void
}) {
  return (
    <button
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", event.noteId)
        e.dataTransfer.effectAllowed = "move"
      }}
      onClick={(e) => {
        e.stopPropagation()
        openTab(event.noteId, event.title)
      }}
      onMouseEnter={(e) => onMouseEnter(event, e.currentTarget)}
      onMouseLeave={onMouseLeave}
      className="flex w-full items-center gap-1 truncate rounded bg-primary/10 px-1.5 py-0.5 text-left text-xs text-primary transition-colors hover:bg-primary/20"
      title={event.title}
    >
      {event.icon ? (
        <span className="shrink-0 text-xs">{event.icon}</span>
      ) : (
        <FileTextIcon className="size-3 shrink-0" />
      )}
      <span className="truncate">{event.title}</span>
    </button>
  )
}

// ── Inline Create Form ─────────────────────────────────────────────────

function InlineCreateForm({
  title,
  setTitle,
  onSubmit,
  onCancel,
}: {
  title: string
  setTitle: (t: string) => void
  onSubmit: () => void
  onCancel: () => void
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        autoFocus
        className="h-5 w-full rounded border bg-background px-1 text-xs outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
        onKeyDown={(e) => {
          if (e.key === "Escape") onCancel()
        }}
        onBlur={() => {
          if (!title.trim()) onCancel()
        }}
      />
    </form>
  )
}

// ── Hover Preview ──────────────────────────────────────────────────────

function HoverPreview({
  event,
  rect,
  calendarDefName,
  endDefName,
}: {
  event: CalendarEvent
  rect: DOMRect
  calendarDefName: string
  endDefName?: string
}) {
  const top = rect.bottom + 8
  const left = Math.min(rect.left, window.innerWidth - 280)
  const showAbove = top + 120 > window.innerHeight
  const style = showAbove
    ? { bottom: window.innerHeight - rect.top + 8, left }
    : { top, left }

  const skipKeys = new Set([calendarDefName])
  if (endDefName) skipKeys.add(endDefName)

  const propEntries = Object.entries(event.properties)
    .filter(([k, v]) => v !== null && v !== undefined && !skipKeys.has(k))
    .slice(0, 3)

  return (
    <div
      className="pointer-events-none fixed z-50 w-64 rounded-lg border bg-popover p-3 shadow-lg"
      style={style}
    >
      <div className="flex items-center gap-1.5">
        {event.icon ? (
          <span className="text-base">{event.icon}</span>
        ) : (
          <FileTextIcon className="size-4 text-muted-foreground" />
        )}
        <p className="truncate text-sm font-medium">{event.title}</p>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {parseDate(event.start).toLocaleDateString("default", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
        {event.isMultiDay &&
          ` \u2192 ${parseDate(event.end).toLocaleDateString("default", { month: "short", day: "numeric", year: "numeric" })}`}
      </p>
      {propEntries.length > 0 && (
        <div className="mt-2 space-y-1 border-t pt-2">
          {propEntries.map(([key, val]) => (
            <div
              key={key}
              className="flex items-baseline gap-1.5 text-xs text-muted-foreground"
            >
              <span className="shrink-0 font-medium">{key}</span>
              <span className="truncate">{String(val)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
