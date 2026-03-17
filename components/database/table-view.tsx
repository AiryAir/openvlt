"use client"

import * as React from "react"
import { ArrowUpIcon, ArrowDownIcon, FileTextIcon } from "lucide-react"
import { useTabStore } from "@/lib/stores/tab-store"
import type {
  DatabaseViewRow,
  PropertyDefinition,
  DatabaseViewConfig,
  PropertyType,
} from "@/types"

interface TableViewProps {
  rows: DatabaseViewRow[]
  definitions: PropertyDefinition[]
  config: DatabaseViewConfig
  onConfigUpdate: (config: DatabaseViewConfig) => void
  onRefresh: () => void
}

export function TableView({
  rows,
  definitions,
  config,
  onConfigUpdate,
  onRefresh,
}: TableViewProps) {
  const { openTab } = useTabStore()

  // Determine visible columns: use config.visibleProperties if set, otherwise show all
  const visibleDefs =
    config.visibleProperties.length > 0
      ? config.visibleProperties
          .map((id) => definitions.find((d) => d.id === id))
          .filter(Boolean) as PropertyDefinition[]
      : definitions

  function handleSort(defId: string) {
    const existing = config.sorts.find((s) => s.propertyId === defId)
    let sorts = [...config.sorts]
    if (existing) {
      if (existing.direction === "asc") {
        sorts = sorts.map((s) =>
          s.propertyId === defId ? { ...s, direction: "desc" as const } : s
        )
      } else {
        sorts = sorts.filter((s) => s.propertyId !== defId)
      }
    } else {
      sorts.push({ propertyId: defId, direction: "asc" })
    }
    onConfigUpdate({ ...config, sorts })
  }

  async function handleInlineEdit(
    noteId: string,
    propName: string,
    value: unknown
  ) {
    await fetch(`/api/notes/${noteId}/properties`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: propName, value }),
    })
    onRefresh()
  }

  return (
    <div className="overflow-auto">
      <table className="w-full border-collapse text-sm">
        <thead className="sticky top-0 z-10 bg-background">
          <tr className="border-b">
            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
              Title
            </th>
            {visibleDefs.map((def) => {
              const sort = config.sorts.find(
                (s) => s.propertyId === def.id
              )
              return (
                <th
                  key={def.id}
                  className="cursor-pointer px-3 py-2 text-left text-xs font-medium text-muted-foreground hover:text-foreground"
                  onClick={() => handleSort(def.id)}
                >
                  <span className="flex items-center gap-1">
                    {def.name}
                    {sort &&
                      (sort.direction === "asc" ? (
                        <ArrowUpIcon className="size-3" />
                      ) : (
                        <ArrowDownIcon className="size-3" />
                      ))}
                  </span>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={visibleDefs.length + 1}
                className="px-3 py-8 text-center text-sm text-muted-foreground"
              >
                No notes in this view. Add notes to the folder or adjust filters.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={row.noteId}
                className="group border-b transition-colors hover:bg-muted/50"
              >
                <td className="px-3 py-1.5">
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
                </td>
                {visibleDefs.map((def) => (
                  <td key={def.id} className="px-3 py-1.5">
                    <InlineCell
                      type={def.type}
                      value={row.properties[def.name]}
                      options={def.options ?? []}
                      onUpdate={(val) =>
                        handleInlineEdit(row.noteId, def.name, val)
                      }
                    />
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

// ── Inline Cell Editors ──

function InlineCell({
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
          className="size-4 accent-primary"
        />
      )
    case "select":
      return (
        <select
          value={String(value ?? "")}
          onChange={(e) => onUpdate(e.target.value || null)}
          className="h-7 rounded border-none bg-transparent text-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
        >
          <option value="">-</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      )
    case "multi_select":
      return (
        <div className="flex flex-wrap gap-1">
          {Array.isArray(value) && value.length > 0 ? (
            value.map((v: string) => (
              <span
                key={v}
                className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
              >
                {v}
              </span>
            ))
          ) : (
            <span className="text-xs text-muted-foreground">-</span>
          )}
        </div>
      )
    case "date":
      return (
        <input
          type="date"
          value={value ? String(value).slice(0, 10) : ""}
          onChange={(e) => onUpdate(e.target.value || null)}
          className="h-7 rounded border-none bg-transparent text-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
        />
      )
    case "number":
      return (
        <input
          type="number"
          value={value === null || value === undefined ? "" : String(value)}
          onChange={(e) =>
            onUpdate(e.target.value === "" ? null : Number(e.target.value))
          }
          className="h-7 w-20 rounded border-none bg-transparent text-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
        />
      )
    case "url":
      return value ? (
        <a
          href={String(value)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-500 underline hover:text-blue-600"
        >
          {String(value).replace(/^https?:\/\//, "").slice(0, 30)}
        </a>
      ) : (
        <span className="text-xs text-muted-foreground">-</span>
      )
    default:
      return (
        <span className="text-sm">
          {value !== null && value !== undefined ? String(value) : "-"}
        </span>
      )
  }
}
