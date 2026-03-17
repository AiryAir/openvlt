"use client"

import * as React from "react"
import { FileTextIcon, SettingsIcon } from "lucide-react"
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

interface KanbanViewProps {
  rows: DatabaseViewRow[]
  definitions: PropertyDefinition[]
  config: DatabaseViewConfig
  onConfigUpdate: (config: DatabaseViewConfig) => void
  onRefresh: () => void
}

export function KanbanView({
  rows,
  definitions,
  config,
  onConfigUpdate,
  onRefresh,
}: KanbanViewProps) {
  const { openTab } = useTabStore()

  // Find the group-by property
  const groupDef = config.groupByPropertyId
    ? definitions.find((d) => d.id === config.groupByPropertyId)
    : null

  // If no group-by property is set, show selector
  const selectDefs = definitions.filter(
    (d) => d.type === "select" || d.type === "multi_select"
  )

  if (!groupDef) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <p className="text-sm text-muted-foreground">
          Choose a select property to group cards by
        </p>
        <div className="flex flex-wrap gap-2">
          {selectDefs.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No select properties found. Add a select property to a note first.
            </p>
          ) : (
            selectDefs.map((d) => (
              <Button
                key={d.id}
                variant="outline"
                size="sm"
                onClick={() =>
                  onConfigUpdate({ ...config, groupByPropertyId: d.id })
                }
              >
                {d.name}
              </Button>
            ))
          )}
        </div>
      </div>
    )
  }

  const options = groupDef.options ?? []
  const allColumns = [...options, "__unset__"]

  // Group rows by the property value
  const grouped = new Map<string, DatabaseViewRow[]>()
  for (const col of allColumns) {
    grouped.set(col, [])
  }

  for (const row of rows) {
    const val = row.properties[groupDef.name]
    const key = val && String(val) ? String(val) : "__unset__"
    if (!grouped.has(key)) {
      grouped.set(key, [])
    }
    grouped.get(key)!.push(row)
  }

  async function handleMoveCard(noteId: string, newValue: string | null) {
    await fetch(`/api/notes/${noteId}/properties`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: groupDef!.name, value: newValue }),
    })
    onRefresh()
  }

  // Visible property chips on cards (exclude the group-by property)
  const chipDefs = definitions.filter(
    (d) => d.id !== groupDef.id
  ).slice(0, 3)

  return (
    <div className="flex h-full gap-3 overflow-x-auto p-4">
      {allColumns.map((col) => {
        const columnRows = grouped.get(col) ?? []
        const isUnset = col === "__unset__"

        return (
          <div
            key={col}
            className="flex w-64 shrink-0 flex-col rounded-lg bg-muted/30"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              const noteId = e.dataTransfer.getData("text/plain")
              if (noteId) {
                handleMoveCard(noteId, isUnset ? null : col)
              }
            }}
          >
            {/* Column header */}
            <div className="flex items-center gap-2 px-3 py-2">
              {isUnset ? (
                <span className="text-xs font-medium text-muted-foreground">
                  No value
                </span>
              ) : (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {col}
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                {columnRows.length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex-1 space-y-2 overflow-y-auto px-2 pb-2">
              {columnRows.map((row) => (
                <div
                  key={row.noteId}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", row.noteId)
                  }}
                  className="cursor-grab rounded-lg border bg-background p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing"
                >
                  <button
                    onClick={() => openTab(row.noteId, row.title)}
                    className="flex items-center gap-2 text-sm font-medium hover:underline"
                  >
                    {row.icon ? (
                      <span className="text-base">{row.icon}</span>
                    ) : (
                      <FileTextIcon className="size-4 text-muted-foreground" />
                    )}
                    {row.title}
                  </button>

                  {chipDefs.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {chipDefs.map((def) => {
                        const val = row.properties[def.name]
                        if (val === null || val === undefined) return null
                        return (
                          <span
                            key={def.id}
                            className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
                          >
                            {def.name}: {String(val)}
                          </span>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {/* Config button */}
      <div className="flex w-10 shrink-0 items-start pt-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon-sm" title="Kanban settings">
              <SettingsIcon className="size-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2" align="start">
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">
              Group by
            </p>
            {selectDefs.map((d) => (
              <button
                key={d.id}
                onClick={() =>
                  onConfigUpdate({ ...config, groupByPropertyId: d.id })
                }
                className={`flex w-full rounded-md px-2 py-1.5 text-sm hover:bg-muted ${
                  d.id === config.groupByPropertyId ? "bg-muted" : ""
                }`}
              >
                {d.name}
              </button>
            ))}
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
