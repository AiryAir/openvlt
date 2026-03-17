"use client"

import * as React from "react"
import {
  FileTextIcon,
  SettingsIcon,
  PlusIcon,
  GripVerticalIcon,
  PencilIcon,
  TrashIcon,
  ChevronsLeftRightIcon,
  SearchIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useTabStore } from "@/lib/stores/tab-store"
import { toast } from "sonner"
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
  const [newPropertyName, setNewPropertyName] = React.useState("")
  const [creatingProperty, setCreatingProperty] = React.useState(false)
  const [newColumnName, setNewColumnName] = React.useState("")
  const [addingColumn, setAddingColumn] = React.useState(false)
  const [editingColumn, setEditingColumn] = React.useState<string | null>(null)
  const [editingColumnName, setEditingColumnName] = React.useState("")
  const [collapsedColumns, setCollapsedColumns] = React.useState<Set<string>>(
    () => new Set()
  )
  const [search, setSearch] = React.useState("")
  const [creatingInColumn, setCreatingInColumn] = React.useState<
    string | null
  >(null)
  const [newCardTitle, setNewCardTitle] = React.useState("")

  // Column drag state
  const [draggedColumn, setDraggedColumn] = React.useState<string | null>(null)
  const [columnDropTarget, setColumnDropTarget] = React.useState<string | null>(
    null
  )
  const [columnDropSide, setColumnDropSide] = React.useState<
    "left" | "right" | null
  >(null)

  // Card drag state
  const [draggedCard, setDraggedCard] = React.useState<string | null>(null)
  const [cardDropTarget, setCardDropTarget] = React.useState<{
    column: string
    cardId?: string
    side?: "above" | "below"
  } | null>(null)

  // Find the group-by property
  const groupDef = config.groupByPropertyId
    ? definitions.find((d) => d.id === config.groupByPropertyId)
    : null

  const selectDefs = definitions.filter(
    (d) => d.type === "select" || d.type === "multi_select"
  )

  // ── Property creation ──────────────────────────────────────────────

  async function handleCreateProperty() {
    const name = newPropertyName.trim()
    if (!name) return
    setCreatingProperty(true)
    try {
      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          type: "select",
          options: ["To Do", "In Progress", "Done"],
        }),
      })
      if (res.ok) {
        const prop = await res.json()
        onConfigUpdate({ ...config, groupByPropertyId: prop.id })
        setNewPropertyName("")
        onRefresh()
      }
    } catch {}
    setCreatingProperty(false)
  }

  // ── Column management ──────────────────────────────────────────────

  async function updateOptions(newOptions: string[]) {
    if (!groupDef) return
    await fetch("/api/properties", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: groupDef.id, options: newOptions }),
    })
    onRefresh()
  }

  async function handleAddColumn() {
    const name = newColumnName.trim()
    if (!name || !groupDef) return
    const currentOptions = groupDef.options ?? []
    if (currentOptions.includes(name)) {
      toast.error("Column already exists")
      return
    }
    await updateOptions([...currentOptions, name])
    setNewColumnName("")
    setAddingColumn(false)
  }

  async function handleRenameColumn(oldName: string) {
    const newName = editingColumnName.trim()
    if (!newName || !groupDef || newName === oldName) {
      setEditingColumn(null)
      return
    }
    const currentOptions = groupDef.options ?? []
    if (currentOptions.includes(newName)) {
      toast.error("Column name already exists")
      return
    }
    // Update the option name
    const newOptions = currentOptions.map((o) => (o === oldName ? newName : o))
    await updateOptions(newOptions)

    // Update all notes that had the old value
    const affectedRows = rows.filter(
      (r) => String(r.properties[groupDef.name]) === oldName
    )
    for (const row of affectedRows) {
      await fetch(`/api/notes/${row.noteId}/properties`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: groupDef.name, value: newName }),
      })
    }
    setEditingColumn(null)
    onRefresh()
  }

  async function handleDeleteColumn(colName: string, moveTo: string | null) {
    if (!groupDef) return
    const currentOptions = groupDef.options ?? []
    const newOptions = currentOptions.filter((o) => o !== colName)

    // Move cards to new column or unset
    const affectedRows = rows.filter(
      (r) => String(r.properties[groupDef.name]) === colName
    )
    for (const row of affectedRows) {
      await fetch(`/api/notes/${row.noteId}/properties`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: groupDef.name, value: moveTo }),
      })
    }

    await updateOptions(newOptions)
    onRefresh()
  }

  // ── Column reorder ─────────────────────────────────────────────────

  function handleColumnDragOver(e: React.DragEvent, col: string) {
    if (!draggedColumn || draggedColumn === col) return
    e.preventDefault()
    const rect = e.currentTarget.getBoundingClientRect()
    const midX = rect.left + rect.width / 2
    setColumnDropTarget(col)
    setColumnDropSide(e.clientX < midX ? "left" : "right")
  }

  async function handleColumnDrop(e: React.DragEvent, col: string) {
    e.preventDefault()
    if (!draggedColumn || !groupDef || draggedColumn === col) return
    const currentOptions = groupDef.options ?? []
    const fromIdx = currentOptions.indexOf(draggedColumn)
    const toIdx = currentOptions.indexOf(col)
    if (fromIdx === -1 || toIdx === -1) return

    const newOptions = [...currentOptions]
    newOptions.splice(fromIdx, 1)
    let insertIdx = newOptions.indexOf(col)
    if (columnDropSide === "right") insertIdx++
    newOptions.splice(insertIdx, 0, draggedColumn)

    setDraggedColumn(null)
    setColumnDropTarget(null)
    setColumnDropSide(null)
    await updateOptions(newOptions)
  }

  // ── Card move ──────────────────────────────────────────────────────

  async function handleMoveCard(noteId: string, newValue: string | null) {
    if (!groupDef) return
    await fetch(`/api/notes/${noteId}/properties`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: groupDef.name, value: newValue }),
    })
    onRefresh()
  }

  // ── Create card in column ──────────────────────────────────────────

  async function handleCreateCard(columnValue: string | null) {
    const title = newCardTitle.trim()
    if (!title || !groupDef) return
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      })
      if (res.ok) {
        const note = await res.json()
        // Set the property to this column's value
        if (columnValue !== null) {
          await fetch(`/api/notes/${note.id}/properties`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: groupDef.name, value: columnValue }),
          })
        }
        setNewCardTitle("")
        setCreatingInColumn(null)
        window.dispatchEvent(new Event("openvlt:tree-refresh"))
        onRefresh()
      }
    } catch {}
  }

  // ── Collapse toggle ────────────────────────────────────────────────

  function toggleCollapse(col: string) {
    setCollapsedColumns((prev) => {
      const next = new Set(prev)
      if (next.has(col)) next.delete(col)
      else next.add(col)
      return next
    })
  }

  // ── Empty state: no grouping property ──────────────────────────────

  if (!groupDef) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
        <p className="text-sm text-muted-foreground">
          Choose a property to group cards by, or create one
        </p>
        {selectDefs.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectDefs.map((d) => (
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
            ))}
          </div>
        )}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span className="h-px w-8 bg-border" />
          {selectDefs.length > 0
            ? "or create a new property"
            : "create a property to get started"}
          <span className="h-px w-8 bg-border" />
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleCreateProperty()
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={newPropertyName}
            onChange={(e) => setNewPropertyName(e.target.value)}
            placeholder="e.g. Status, Priority"
            className="h-8 rounded-md border bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
          />
          <Button
            type="submit"
            size="sm"
            disabled={!newPropertyName.trim() || creatingProperty}
          >
            <PlusIcon className="mr-1 size-3.5" />
            Create
          </Button>
        </form>
        <p className="max-w-xs text-center text-xs text-muted-foreground">
          This creates a select property with To Do, In Progress, and Done
          columns. You can rename or add columns afterwards.
        </p>
      </div>
    )
  }

  // ── Build columns and group rows ───────────────────────────────────

  const options = groupDef.options ?? []
  const allColumns = [...options, "__unset__"]

  const grouped = new Map<string, DatabaseViewRow[]>()
  for (const col of allColumns) {
    grouped.set(col, [])
  }

  const lowerSearch = search.toLowerCase()
  for (const row of rows) {
    if (search && !row.title.toLowerCase().includes(lowerSearch)) continue
    const val = row.properties[groupDef.name]
    const key = val && String(val) ? String(val) : "__unset__"
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)!.push(row)
  }

  const chipDefs = definitions
    .filter((d) => d.id !== groupDef.id)
    .slice(0, 3)

  // ── Render ─────────────────────────────────────────────────────────

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Search bar */}
      <div className="flex shrink-0 items-center gap-2 px-4 py-2">
        <div className="relative flex-1 max-w-xs">
          <SearchIcon className="absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter cards..."
            className="h-7 w-full rounded-md border bg-transparent pr-2 pl-7 text-xs outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      {/* Columns */}
      <div className="flex min-h-0 flex-1 gap-3 overflow-x-auto px-4 pb-4">
        {allColumns.map((col) => {
          const columnRows = grouped.get(col) ?? []
          const isUnset = col === "__unset__"
          const isCollapsed = collapsedColumns.has(col)
          const showDropLeft =
            columnDropTarget === col && columnDropSide === "left"
          const showDropRight =
            columnDropTarget === col && columnDropSide === "right"

          if (isCollapsed) {
            return (
              <React.Fragment key={col}>
                {showDropLeft && (
                  <div className="w-1 shrink-0 rounded-full bg-primary" />
                )}
                <button
                  onClick={() => toggleCollapse(col)}
                  className="flex w-10 shrink-0 flex-col items-center gap-2 rounded-lg bg-muted/30 px-1 py-3"
                  title="Expand column"
                  onDragOver={(e) => {
                    e.preventDefault()
                    if (draggedCard) {
                      handleMoveCard(draggedCard, isUnset ? null : col)
                      setDraggedCard(null)
                    }
                  }}
                >
                  <span
                    className="text-xs font-medium text-muted-foreground"
                    style={{ writingMode: "vertical-rl" }}
                  >
                    {isUnset ? "No value" : col}
                  </span>
                  <span className="rounded-full bg-muted px-1.5 text-xs text-muted-foreground">
                    {columnRows.length}
                  </span>
                </button>
                {showDropRight && (
                  <div className="w-1 shrink-0 rounded-full bg-primary" />
                )}
              </React.Fragment>
            )
          }

          return (
            <React.Fragment key={col}>
              {showDropLeft && !isUnset && (
                <div className="w-1 shrink-0 rounded-full bg-primary" />
              )}
              <div
                className={`flex w-64 shrink-0 flex-col rounded-lg bg-muted/30 ${
                  draggedColumn === col ? "opacity-50" : ""
                }`}
                draggable={!isUnset}
                onDragStart={(e) => {
                  if (isUnset) return
                  // Only start column drag from the header area
                  setDraggedColumn(col)
                  e.dataTransfer.effectAllowed = "move"
                  e.dataTransfer.setData("application/kanban-column", col)
                }}
                onDragEnd={() => {
                  setDraggedColumn(null)
                  setColumnDropTarget(null)
                  setColumnDropSide(null)
                }}
                onDragOver={(e) => {
                  // Column reorder
                  if (draggedColumn) {
                    handleColumnDragOver(e, col)
                    return
                  }
                  // Card drop on column
                  e.preventDefault()
                }}
                onDragLeave={() => {
                  if (draggedColumn) {
                    setColumnDropTarget(null)
                    setColumnDropSide(null)
                  }
                }}
                onDrop={(e) => {
                  if (draggedColumn) {
                    handleColumnDrop(e, col)
                    return
                  }
                  e.preventDefault()
                  const noteId = e.dataTransfer.getData("text/plain")
                  if (noteId) {
                    handleMoveCard(noteId, isUnset ? null : col)
                  }
                }}
              >
                {/* Column header */}
                <div className="flex items-center gap-1.5 px-2 py-2">
                  {!isUnset && (
                    <GripVerticalIcon className="size-3 shrink-0 cursor-grab text-muted-foreground/40" />
                  )}
                  {editingColumn === col ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        handleRenameColumn(col)
                      }}
                      className="flex-1"
                    >
                      <input
                        type="text"
                        value={editingColumnName}
                        onChange={(e) => setEditingColumnName(e.target.value)}
                        autoFocus
                        className="h-6 w-full rounded border bg-transparent px-1.5 text-xs font-medium outline-none focus:ring-1 focus:ring-ring"
                        onBlur={() => handleRenameColumn(col)}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") setEditingColumn(null)
                        }}
                      />
                    </form>
                  ) : isUnset ? (
                    <span className="flex-1 text-xs font-medium text-muted-foreground">
                      No value
                    </span>
                  ) : (
                    <span
                      className="flex-1 cursor-text rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                      onDoubleClick={() => {
                        setEditingColumn(col)
                        setEditingColumnName(col)
                      }}
                    >
                      {col}
                    </span>
                  )}
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {columnRows.length}
                  </span>

                  {/* Column actions */}
                  {!isUnset && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground/60 transition-colors hover:bg-accent hover:text-foreground">
                          <SettingsIcon className="size-3" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-40 p-1" align="end">
                        <button
                          onClick={() => {
                            setEditingColumn(col)
                            setEditingColumnName(col)
                          }}
                          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-muted"
                        >
                          <PencilIcon className="size-3" />
                          Rename
                        </button>
                        <button
                          onClick={() => toggleCollapse(col)}
                          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-muted"
                        >
                          <ChevronsLeftRightIcon className="size-3" />
                          Collapse
                        </button>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-destructive hover:bg-muted">
                              <TrashIcon className="size-3" />
                              Delete
                            </button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-48 p-2"
                            side="right"
                            align="start"
                          >
                            <p className="mb-2 text-xs text-muted-foreground">
                              Move {columnRows.length} card
                              {columnRows.length !== 1 ? "s" : ""} to:
                            </p>
                            <button
                              onClick={() => handleDeleteColumn(col, null)}
                              className="flex w-full rounded-md px-2 py-1.5 text-xs hover:bg-muted"
                            >
                              No value
                            </button>
                            {options
                              .filter((o) => o !== col)
                              .map((o) => (
                                <button
                                  key={o}
                                  onClick={() => handleDeleteColumn(col, o)}
                                  className="flex w-full rounded-md px-2 py-1.5 text-xs hover:bg-muted"
                                >
                                  {o}
                                </button>
                              ))}
                          </PopoverContent>
                        </Popover>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>

                {/* Cards */}
                <div className="flex-1 space-y-2 overflow-y-auto px-2 pb-2">
                  {columnRows.map((row) => (
                    <div
                      key={row.noteId}
                      draggable
                      onDragStart={(e) => {
                        e.stopPropagation()
                        setDraggedCard(row.noteId)
                        e.dataTransfer.setData("text/plain", row.noteId)
                        e.dataTransfer.effectAllowed = "move"
                      }}
                      onDragEnd={() => setDraggedCard(null)}
                      className={`cursor-grab rounded-lg border bg-background p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing ${
                        draggedCard === row.noteId ? "opacity-50" : ""
                      }`}
                    >
                      <button
                        onClick={() => openTab(row.noteId, row.title)}
                        className="flex items-center gap-2 text-left text-sm font-medium hover:underline"
                      >
                        {row.icon ? (
                          <span className="text-base">{row.icon}</span>
                        ) : (
                          <FileTextIcon className="size-4 shrink-0 text-muted-foreground" />
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

                  {/* New card form */}
                  {creatingInColumn === col ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        handleCreateCard(isUnset ? null : col)
                      }}
                      className="space-y-1.5"
                    >
                      <input
                        type="text"
                        value={newCardTitle}
                        onChange={(e) => setNewCardTitle(e.target.value)}
                        placeholder="Note title"
                        autoFocus
                        className="h-8 w-full rounded-md border bg-background px-2.5 text-sm outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
                        onKeyDown={(e) => {
                          if (e.key === "Escape") {
                            setCreatingInColumn(null)
                            setNewCardTitle("")
                          }
                        }}
                      />
                      <div className="flex gap-1.5">
                        <Button
                          type="submit"
                          size="sm"
                          className="h-7 flex-1 text-xs"
                          disabled={!newCardTitle.trim()}
                        >
                          Add
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => {
                            setCreatingInColumn(null)
                            setNewCardTitle("")
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => {
                        setCreatingInColumn(col)
                        setNewCardTitle("")
                      }}
                      className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      <PlusIcon className="size-3.5" />
                      New
                    </button>
                  )}
                </div>
              </div>
              {showDropRight && !isUnset && (
                <div className="w-1 shrink-0 rounded-full bg-primary" />
              )}
            </React.Fragment>
          )
        })}

        {/* Add column */}
        <div className="flex w-64 shrink-0 flex-col rounded-lg border border-dashed border-border/60">
          {addingColumn ? (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleAddColumn()
              }}
              className="flex items-center gap-1.5 p-2"
            >
              <input
                type="text"
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                placeholder="Column name"
                autoFocus
                className="h-7 min-w-0 flex-1 rounded border bg-transparent px-2 text-xs outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setAddingColumn(false)
                    setNewColumnName("")
                  }
                }}
              />
              <Button
                type="submit"
                size="sm"
                className="h-7 text-xs"
                disabled={!newColumnName.trim()}
              >
                Add
              </Button>
            </form>
          ) : (
            <button
              onClick={() => setAddingColumn(true)}
              className="flex h-10 items-center justify-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <PlusIcon className="size-3.5" />
              Add column
            </button>
          )}
        </div>

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
    </div>
  )
}
