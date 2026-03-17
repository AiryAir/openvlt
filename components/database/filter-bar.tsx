"use client"

import * as React from "react"
import { PlusIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type {
  DatabaseViewConfig,
  DatabaseViewFilter,
  PropertyDefinition,
} from "@/types"

interface FilterBarProps {
  config: DatabaseViewConfig
  definitions: PropertyDefinition[]
  onUpdate: (config: DatabaseViewConfig) => void
}

const OPERATORS = [
  { value: "eq", label: "is" },
  { value: "neq", label: "is not" },
  { value: "contains", label: "contains" },
  { value: "not_contains", label: "does not contain" },
  { value: "gt", label: "greater than" },
  { value: "lt", label: "less than" },
  { value: "is_empty", label: "is empty" },
  { value: "is_not_empty", label: "is not empty" },
]

export function FilterBar({ config, definitions, onUpdate }: FilterBarProps) {
  const [addOpen, setAddOpen] = React.useState(false)

  function addFilter(propertyId: string) {
    const newFilter: DatabaseViewFilter = {
      propertyId,
      operator: "eq",
      value: "",
    }
    onUpdate({
      ...config,
      filters: [...config.filters, newFilter],
    })
    setAddOpen(false)
  }

  function updateFilter(index: number, updates: Partial<DatabaseViewFilter>) {
    const filters = config.filters.map((f, i) =>
      i === index ? { ...f, ...updates } : f
    )
    onUpdate({ ...config, filters })
  }

  function removeFilter(index: number) {
    onUpdate({
      ...config,
      filters: config.filters.filter((_, i) => i !== index),
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border-b px-4 py-2">
      {config.filters.map((filter, i) => {
        const def = definitions.find((d) => d.id === filter.propertyId)
        if (!def) return null

        const needsValue = !["is_empty", "is_not_empty"].includes(
          filter.operator
        )

        return (
          <div
            key={i}
            className="flex items-center gap-1 rounded-md border bg-muted/50 px-2 py-1 text-xs"
          >
            <span className="font-medium">{def.name}</span>
            <select
              value={filter.operator}
              onChange={(e) => updateFilter(i, { operator: e.target.value as DatabaseViewFilter["operator"] })}
              className="border-none bg-transparent text-xs focus-visible:outline-none"
            >
              {OPERATORS.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </select>
            {needsValue && (
              <input
                type="text"
                value={filter.value}
                onChange={(e) => updateFilter(i, { value: e.target.value })}
                placeholder="value"
                className="w-20 border-none bg-transparent text-xs focus-visible:outline-none"
              />
            )}
            <button onClick={() => removeFilter(i)}>
              <XIcon className="size-3 text-muted-foreground hover:text-foreground" />
            </button>
          </div>
        )
      })}

      <Popover open={addOpen} onOpenChange={setAddOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
            <PlusIcon className="size-3.5" />
            Add filter
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-1" align="start">
          {definitions.map((def) => (
            <button
              key={def.id}
              onClick={() => addFilter(def.id)}
              className="flex w-full rounded-md px-2 py-1.5 text-sm hover:bg-muted"
            >
              {def.name}
            </button>
          ))}
          {definitions.length === 0 && (
            <p className="px-2 py-3 text-center text-xs text-muted-foreground">
              No properties defined yet
            </p>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}
