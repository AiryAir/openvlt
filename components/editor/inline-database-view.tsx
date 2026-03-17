"use client"

import * as React from "react"
import { NodeViewWrapper } from "@tiptap/react"
import type { NodeViewProps } from "@tiptap/react"
import {
  TableIcon,
  ColumnsIcon,
  CalendarIcon,
  FilterIcon,
  RefreshCwIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  DatabaseIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
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

export function InlineDatabaseView({ node, deleteNode }: NodeViewProps) {
  const { viewId } = node.attrs
  const [view, setView] = React.useState<DatabaseView | null>(null)
  const [rows, setRows] = React.useState<DatabaseViewRow[]>([])
  const [definitions, setDefinitions] = React.useState<PropertyDefinition[]>([])
  const [loading, setLoading] = React.useState(true)
  const [collapsed, setCollapsed] = React.useState(false)
  const [showFilters, setShowFilters] = React.useState(false)
  const [error, setError] = React.useState(false)

  const fetchData = React.useCallback(async () => {
    if (!viewId) return
    try {
      const [viewRes, defsRes] = await Promise.all([
        fetch(`/api/database-views/${viewId}`),
        fetch("/api/properties"),
      ])
      if (viewRes.ok) {
        const data = await viewRes.json()
        setView(data.view)
        setRows(data.rows)
        setError(false)
      } else {
        setError(true)
      }
      if (defsRes.ok) {
        setDefinitions(await defsRes.json())
      }
    } catch {
      setError(true)
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
    if (res.ok) fetchData()
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

  const viewTypeIcons: Record<DatabaseViewType, React.ReactNode> = {
    table: <TableIcon className="size-3.5" />,
    kanban: <ColumnsIcon className="size-3.5" />,
    calendar: <CalendarIcon className="size-3.5" />,
  }

  return (
    <NodeViewWrapper data-inline-database="">
      <div className="my-4 overflow-hidden rounded-lg border border-primary/20 bg-background">
        {/* Header */}
        <div className="flex items-center gap-2 border-b bg-muted/30 px-3 py-1.5">
          <button
            className="flex items-center gap-1.5 text-sm font-medium text-foreground"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <ChevronRightIcon className="size-3.5 text-muted-foreground" />
            ) : (
              <ChevronDownIcon className="size-3.5 text-muted-foreground" />
            )}
            <DatabaseIcon className="size-3.5 text-primary" />
            {loading ? "Loading..." : view?.name || "Database"}
          </button>

          {!collapsed && view && (
            <div className="ml-auto flex items-center gap-1">
              {(["table", "kanban", "calendar"] as DatabaseViewType[]).map(
                (t) => (
                  <Button
                    key={t}
                    variant={view.viewType === t ? "secondary" : "ghost"}
                    size="sm"
                    className="h-6 gap-1 px-1.5 text-xs"
                    onClick={() => handleSwitchViewType(t)}
                  >
                    {viewTypeIcons[t]}
                  </Button>
                )
              )}

              <Button
                variant={showFilters ? "secondary" : "ghost"}
                size="sm"
                className="h-6 gap-1 px-1.5 text-xs"
                onClick={() => setShowFilters(!showFilters)}
              >
                <FilterIcon className="size-3" />
                {view.config.filters.length > 0 && (
                  <span className="text-xs text-primary">
                    {view.config.filters.length}
                  </span>
                )}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-1.5 text-xs"
                onClick={fetchData}
              >
                <RefreshCwIcon className="size-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Content */}
        {!collapsed && (
          <>
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="size-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
              </div>
            )}

            {error && !loading && (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                Database view not found or could not be loaded.
              </div>
            )}

            {!loading && !error && view && (
              <>
                {showFilters && (
                  <FilterBar
                    config={view.config}
                    definitions={definitions}
                    onUpdate={handleUpdateConfig}
                  />
                )}
                <div className="max-h-[400px] overflow-auto">
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
              </>
            )}
          </>
        )}
      </div>
    </NodeViewWrapper>
  )
}
