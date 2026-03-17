"use client"

import * as React from "react"
import {
  TableIcon,
  ColumnsIcon,
  CalendarIcon,
  FilterIcon,
  ArrowUpDownIcon,
  RefreshCwIcon,
  SettingsIcon,
  Trash2Icon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { TableView } from "@/components/database/table-view"
import { KanbanView } from "@/components/database/kanban-view"
import { CalendarView } from "@/components/database/calendar-view"
import { FilterBar } from "@/components/database/filter-bar"
import type {
  DatabaseView,
  DatabaseViewRow,
  DatabaseViewType,
  DatabaseViewConfig,
  PropertyDefinition,
} from "@/types"

interface DatabaseViewPanelProps {
  viewId: string
}

export function DatabaseViewPanel({ viewId }: DatabaseViewPanelProps) {
  const [view, setView] = React.useState<DatabaseView | null>(null)
  const [rows, setRows] = React.useState<DatabaseViewRow[]>([])
  const [definitions, setDefinitions] = React.useState<PropertyDefinition[]>([])
  const [loading, setLoading] = React.useState(true)
  const [showFilters, setShowFilters] = React.useState(false)

  const fetchData = React.useCallback(async () => {
    try {
      const [viewRes, defsRes] = await Promise.all([
        fetch(`/api/database-views/${viewId}`),
        fetch("/api/properties"),
      ])
      if (viewRes.ok) {
        const data = await viewRes.json()
        setView(data.view)
        setRows(data.rows)
      }
      if (defsRes.ok) {
        setDefinitions(await defsRes.json())
      }
    } catch {
    } finally {
      setLoading(false)
    }
  }, [viewId])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  async function handleUpdateConfig(config: DatabaseViewConfig) {
    if (!view) return
    const res = await fetch(`/api/database-views/${viewId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config }),
    })
    if (res.ok) {
      fetchData()
    }
  }

  async function handleSwitchViewType(viewType: DatabaseViewType) {
    if (!view) return
    await fetch(`/api/database-views/${viewId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ viewType }),
    })
    fetchData()
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="size-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
      </div>
    )
  }

  if (!view) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">View not found</p>
      </div>
    )
  }

  const viewTypeIcons: Record<DatabaseViewType, React.ReactNode> = {
    table: <TableIcon className="size-4" />,
    kanban: <ColumnsIcon className="size-4" />,
    calendar: <CalendarIcon className="size-4" />,
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b px-4 py-2">
        <h2 className="text-sm font-medium">{view.name}</h2>

        <div className="ml-auto flex items-center gap-1">
          {/* View type switcher */}
          {(["table", "kanban", "calendar"] as DatabaseViewType[]).map((t) => (
            <Button
              key={t}
              variant={view.viewType === t ? "secondary" : "ghost"}
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={() => handleSwitchViewType(t)}
            >
              {viewTypeIcons[t]}
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Button>
          ))}

          <div className="mx-1 h-4 w-px bg-border" />

          <Button
            variant={showFilters ? "secondary" : "ghost"}
            size="sm"
            className="h-7 gap-1.5 text-xs"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FilterIcon className="size-3.5" />
            Filter
            {view.config.filters.length > 0 && (
              <span className="rounded-full bg-primary/20 px-1.5 text-xs text-primary">
                {view.config.filters.length}
              </span>
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={fetchData}
          >
            <RefreshCwIcon className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      {showFilters && (
        <FilterBar
          config={view.config}
          definitions={definitions}
          onUpdate={handleUpdateConfig}
        />
      )}

      {/* View content */}
      <div className="min-h-0 flex-1 overflow-auto">
        {view.viewType === "table" ? (
          <TableView
            rows={rows}
            definitions={definitions}
            config={view.config}
            onConfigUpdate={handleUpdateConfig}
            onRefresh={fetchData}
          />
        ) : view.viewType === "kanban" ? (
          <KanbanView
            rows={rows}
            definitions={definitions}
            config={view.config}
            onConfigUpdate={handleUpdateConfig}
            onRefresh={fetchData}
          />
        ) : (
          <CalendarView
            rows={rows}
            definitions={definitions}
            config={view.config}
            onConfigUpdate={handleUpdateConfig}
            onRefresh={fetchData}
          />
        )}
      </div>
    </div>
  )
}
