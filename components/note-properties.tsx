"use client"

import * as React from "react"
import {
  PlusIcon,
  XIcon,
  ChevronRightIcon,
  HashIcon,
  CalendarIcon,
  LinkIcon,
  CheckSquareIcon,
  TypeIcon,
  TagIcon,
  ListIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { NoteProperty, PropertyDefinition, PropertyType } from "@/types"

interface NotePropertiesProps {
  noteId: string
}

const TYPE_ICONS: Record<PropertyType, React.ReactNode> = {
  text: <TypeIcon className="size-3" />,
  number: <HashIcon className="size-3" />,
  date: <CalendarIcon className="size-3" />,
  select: <ListIcon className="size-3" />,
  multi_select: <TagIcon className="size-3" />,
  checkbox: <CheckSquareIcon className="size-3" />,
  url: <LinkIcon className="size-3" />,
}

const TYPE_LABELS: Record<PropertyType, string> = {
  text: "Text",
  number: "Number",
  date: "Date",
  select: "Select",
  multi_select: "Multi-select",
  checkbox: "Checkbox",
  url: "URL",
}

function formatValue(type: PropertyType, value: unknown): string {
  if (value === null || value === undefined || value === "") return ""
  if (type === "checkbox") return value ? "Yes" : "No"
  if (type === "multi_select" && Array.isArray(value)) return value.join(", ")
  if (type === "date" && typeof value === "string") {
    try {
      return new Date(value).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    } catch {
      return String(value)
    }
  }
  return String(value)
}

export function NoteProperties({ noteId }: NotePropertiesProps) {
  const [properties, setProperties] = React.useState<NoteProperty[]>([])
  const [definitions, setDefinitions] = React.useState<PropertyDefinition[]>([])
  const [expanded, setExpanded] = React.useState(false)
  const [addOpen, setAddOpen] = React.useState(false)
  const [newPropName, setNewPropName] = React.useState("")
  const [newPropType, setNewPropType] = React.useState<PropertyType>("text")

  const fetchProperties = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/notes/${noteId}/properties`)
      if (res.ok) setProperties(await res.json())
    } catch {}
  }, [noteId])

  const fetchDefinitions = React.useCallback(async () => {
    try {
      const res = await fetch("/api/properties")
      if (res.ok) setDefinitions(await res.json())
    } catch {}
  }, [])

  React.useEffect(() => {
    fetchProperties()
    fetchDefinitions()
  }, [fetchProperties, fetchDefinitions])

  async function handleSetProperty(
    name: string,
    value: unknown,
    type?: PropertyType
  ) {
    await fetch(`/api/notes/${noteId}/properties`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, value, type }),
    })
    fetchProperties()
    fetchDefinitions()
  }

  async function handleRemoveProperty(name: string) {
    await fetch(
      `/api/notes/${noteId}/properties?name=${encodeURIComponent(name)}`,
      { method: "DELETE" }
    )
    fetchProperties()
  }

  function handleAddProperty() {
    if (!newPropName.trim()) return
    const defaultValue =
      newPropType === "checkbox"
        ? false
        : newPropType === "number"
          ? 0
          : ""
    handleSetProperty(newPropName.trim(), defaultValue, newPropType)
    setNewPropName("")
    setNewPropType("text")
    setAddOpen(false)
    setExpanded(true)
  }

  const existingNames = new Set(properties.map((p) => p.name))
  const availableDefs = definitions.filter((d) => !existingNames.has(d.name))

  const addButton = (
    <Popover open={addOpen} onOpenChange={setAddOpen}>
      <PopoverTrigger asChild>
        <button
          className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground/50 transition-colors hover:bg-muted hover:text-muted-foreground"
          title="Add property"
        >
          <PlusIcon className="size-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        {availableDefs.length > 0 && (
          <div className="mb-3">
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">
              Existing properties
            </p>
            <div className="space-y-0.5">
              {availableDefs.map((def) => (
                <button
                  key={def.id}
                  onClick={() => {
                    const defaultVal =
                      def.type === "checkbox"
                        ? false
                        : def.type === "number"
                          ? 0
                          : ""
                    handleSetProperty(def.name, defaultVal, def.type)
                    setAddOpen(false)
                    setExpanded(true)
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                >
                  {TYPE_ICONS[def.type]}
                  {def.name}
                </button>
              ))}
            </div>
            <div className="my-2 border-t" />
          </div>
        )}
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">
          New property
        </p>
        <input
          type="text"
          placeholder="Property name"
          value={newPropName}
          onChange={(e) => setNewPropName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddProperty()}
          className="mb-2 h-8 w-full rounded-md border bg-background px-2 text-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
          autoFocus
        />
        <div className="mb-2 grid grid-cols-4 gap-1">
          {(Object.keys(TYPE_LABELS) as PropertyType[]).map((t) => (
            <button
              key={t}
              onClick={() => setNewPropType(t)}
              className={`flex flex-col items-center gap-0.5 rounded-md p-1.5 text-xs ${
                newPropType === t
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted"
              }`}
              title={TYPE_LABELS[t]}
            >
              {TYPE_ICONS[t]}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {TYPE_LABELS[newPropType]}
          </span>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleAddProperty}
          >
            Add
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )

  /* ── No properties: just show the + button inline ── */
  if (properties.length === 0 && !addOpen) {
    return (
      <div className="note-properties-bar group/props flex items-center gap-1 px-[calc(var(--editor-left,120px))] pr-[calc(var(--editor-right,48px))] py-2.5">
        <div className="opacity-0 transition-opacity group-hover/props:opacity-100">
          {addButton}
        </div>
      </div>
    )
  }

  /* ── Collapsed: horizontal chip strip ── */
  if (!expanded) {
    return (
      <div className="note-properties-bar border-b border-border/40 px-[calc(var(--editor-left,120px))] pr-[calc(var(--editor-right,48px))] pt-2.5 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded(true)}
            className="group/toggle ml-3 inline-flex shrink-0 items-center gap-1 rounded-md p-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ChevronRightIcon className="size-3 transition-transform" />
          </button>

          <div className="flex flex-wrap items-center gap-1.5 overflow-hidden">
            {properties.map((prop) => {
              const val = formatValue(prop.type, prop.value)
              return (
                <span
                  key={prop.propertyId}
                  className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-0.5 text-xs text-muted-foreground"
                  title={`${prop.name}: ${val || "(empty)"}`}
                >
                  <span className="opacity-60">{TYPE_ICONS[prop.type]}</span>
                  <span className="font-medium text-foreground/70">
                    {prop.name}
                  </span>
                  {val && (
                    <>
                      <span className="text-muted-foreground/40">:</span>
                      <span className="max-w-[120px] truncate">{val}</span>
                    </>
                  )}
                </span>
              )
            })}
            {addButton}
          </div>
        </div>
      </div>
    )
  }

  /* ── Expanded: flat grid (no card wrapper) ── */
  return (
    <div className="note-properties-bar border-b border-border/40 px-[calc(var(--editor-left,120px))] pr-[calc(var(--editor-right,48px))] pt-2.5 pb-2">
      {/* Header: same row structure as collapsed state */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setExpanded(false)}
          className="ml-3 inline-flex shrink-0 items-center gap-1 rounded-md p-0.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ChevronRightIcon className="size-3 rotate-90 transition-transform" />
          Properties
        </button>
        <div className="ml-auto">{addButton}</div>
      </div>

      {/* Property rows */}
      <div className="mt-1.5 ml-3 space-y-0">
        {properties.map((prop, i) => (
          <PropertyRow
            key={prop.propertyId}
            property={prop}
            definitions={definitions}
            onUpdate={(value) => handleSetProperty(prop.name, value)}
            onRemove={() => handleRemoveProperty(prop.name)}
            isLast={i === properties.length - 1}
          />
        ))}
      </div>
    </div>
  )
}

// ── Property Row ──

function PropertyRow({
  property,
  definitions,
  onUpdate,
  onRemove,
  isLast,
}: {
  property: NoteProperty
  definitions: PropertyDefinition[]
  onUpdate: (value: unknown) => void
  onRemove: () => void
  isLast: boolean
}) {
  const def = definitions.find((d) => d.id === property.propertyId)
  const options = def?.options ?? []

  return (
    <div
      className="group/row flex items-center gap-3 rounded-md py-1 transition-colors hover:bg-muted/30"
    >
      <div className="flex w-32 shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
        <span className="opacity-50">{TYPE_ICONS[property.type]}</span>
        <span className="truncate font-medium">{property.name}</span>
      </div>
      <div className="min-w-0 flex-1">
        <PropertyValueEditor
          type={property.type}
          value={property.value}
          options={options}
          onUpdate={onUpdate}
        />
      </div>
      <button
        onClick={onRemove}
        className="shrink-0 rounded p-0.5 opacity-0 transition-opacity hover:bg-muted group-hover/row:opacity-100"
        title="Remove property"
      >
        <XIcon className="size-3 text-muted-foreground" />
      </button>
    </div>
  )
}

// ── Value Editors ──

function PropertyValueEditor({
  type,
  value,
  options,
  onUpdate,
}: {
  type: PropertyType
  value: unknown
  options: string[]
  onUpdate: (value: unknown) => void
}) {
  switch (type) {
    case "checkbox":
      return (
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onUpdate(e.target.checked)}
          className="size-3.5 rounded border-muted-foreground/30 accent-primary"
        />
      )
    case "number":
      return (
        <input
          type="number"
          value={value === null ? "" : String(value)}
          onChange={(e) =>
            onUpdate(e.target.value === "" ? null : Number(e.target.value))
          }
          className="h-7 w-full rounded border-none bg-transparent px-1 text-sm text-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
        />
      )
    case "date":
      return (
        <input
          type="date"
          value={value ? String(value).slice(0, 10) : ""}
          onChange={(e) => onUpdate(e.target.value || null)}
          className="h-7 rounded border-none bg-transparent px-1 text-sm text-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
        />
      )
    case "select":
      return (
        <SelectEditor
          value={value as string | null}
          options={options}
          onUpdate={onUpdate}
        />
      )
    case "multi_select":
      return (
        <MultiSelectEditor
          value={(value as string[]) ?? []}
          options={options}
          onUpdate={onUpdate}
        />
      )
    case "url":
      return (
        <input
          type="url"
          value={String(value ?? "")}
          onChange={(e) => onUpdate(e.target.value || null)}
          placeholder="https://..."
          className="h-7 w-full rounded border-none bg-transparent px-1 text-sm text-primary underline underline-offset-2 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
        />
      )
    default:
      return (
        <input
          type="text"
          value={String(value ?? "")}
          onChange={(e) => onUpdate(e.target.value || null)}
          placeholder="Empty"
          className="h-7 w-full rounded border-none bg-transparent px-1 text-sm text-foreground placeholder:text-muted-foreground/40 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
        />
      )
  }
}

function SelectEditor({
  value,
  options,
  onUpdate,
}: {
  value: string | null
  options: string[]
  onUpdate: (value: unknown) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [newOption, setNewOption] = React.useState("")

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex h-7 items-center gap-1 rounded px-1 text-sm hover:bg-muted/50">
          {value ? (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {value}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground/50">
              Select...
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1" align="start">
        {value && (
          <button
            onClick={() => {
              onUpdate(null)
              setOpen(false)
            }}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted"
          >
            <XIcon className="size-3" />
            Clear
          </button>
        )}
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => {
              onUpdate(opt)
              setOpen(false)
            }}
            className={`flex w-full items-center rounded-md px-2 py-1.5 text-sm hover:bg-muted ${
              value === opt ? "bg-muted" : ""
            }`}
          >
            {opt}
          </button>
        ))}
        <div className="border-t p-1">
          <input
            type="text"
            placeholder="New option..."
            value={newOption}
            onChange={(e) => setNewOption(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newOption.trim()) {
                onUpdate(newOption.trim())
                setNewOption("")
                setOpen(false)
              }
            }}
            className="h-7 w-full rounded border-none bg-transparent px-1 text-sm focus-visible:outline-none"
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}

function MultiSelectEditor({
  value,
  options,
  onUpdate,
}: {
  value: string[]
  options: string[]
  onUpdate: (value: unknown) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [newOption, setNewOption] = React.useState("")

  function toggle(opt: string) {
    if (value.includes(opt)) {
      onUpdate(value.filter((v) => v !== opt))
    } else {
      onUpdate([...value, opt])
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex min-h-[28px] flex-wrap items-center gap-1 rounded px-1 hover:bg-muted/50">
          {value.length > 0 ? (
            value.map((v) => (
              <span
                key={v}
                className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
              >
                {v}
              </span>
            ))
          ) : (
            <span className="text-xs text-muted-foreground/50">
              Select...
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1" align="start">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => toggle(opt)}
            className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted ${
              value.includes(opt) ? "bg-muted" : ""
            }`}
          >
            <input
              type="checkbox"
              checked={value.includes(opt)}
              readOnly
              className="size-3.5 accent-primary"
            />
            {opt}
          </button>
        ))}
        <div className="border-t p-1">
          <input
            type="text"
            placeholder="New option..."
            value={newOption}
            onChange={(e) => setNewOption(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newOption.trim()) {
                onUpdate([...value, newOption.trim()])
                setNewOption("")
              }
            }}
            className="h-7 w-full rounded border-none bg-transparent px-1 text-sm focus-visible:outline-none"
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
