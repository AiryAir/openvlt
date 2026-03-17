"use client"

import * as React from "react"
import {
  PlusIcon,
  SearchIcon,
  BookmarkIcon,
  TableIcon,
  FolderIcon,
  ZapIcon,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useTabStore } from "@/lib/stores/tab-store"
import { VaultSelector } from "@/components/vault-selector"
import { CreateVaultDialog } from "@/components/create-vault-dialog"
import { CreateFolderDialog } from "@/components/create-folder-dialog"
import { SyncStatus } from "@/components/sync-status"
import { SidebarResizer } from "@/components/sidebar-resizer"
import { useShortcuts } from "@/lib/stores/shortcuts-store"
import { useSidebarData } from "@/hooks/use-sidebar-data"
import {
  type SidebarPanel,
  FilesPanel,
  SearchPanel,
  QuickAccessPanel,
  BookmarksSidebarPanel,
  DatabasePanel,
  SidebarUserFooter,
} from "@/components/sidebar-panels"

const PANEL_KEY = "openvlt:horizontal-active-panel"

export function AppSidebarHorizontal() {
  const { openTab, closeAllTabs } = useTabStore()
  const { getBinding } = useShortcuts()
  const data = useSidebarData()

  const [activePanel, setActivePanel] = React.useState<SidebarPanel>(() => {
    if (typeof window === "undefined") return "files"
    return (localStorage.getItem(PANEL_KEY) as SidebarPanel) || "files"
  })

  function switchPanel(panel: SidebarPanel) {
    setActivePanel(panel)
    localStorage.setItem(PANEL_KEY, panel)
  }

  const railItems: {
    id: SidebarPanel
    icon: React.FC<{ className?: string }>
    tooltip: string
  }[] = [
    { id: "files", icon: FolderIcon, tooltip: "Files" },
    { id: "search", icon: SearchIcon, tooltip: "Search" },
    { id: "quickAccess", icon: ZapIcon, tooltip: "Quick Access" },
    { id: "bookmarks", icon: BookmarkIcon, tooltip: "Bookmarks" },
    { id: "database", icon: TableIcon, tooltip: "Database Views" },
  ]

  return (
    <>
      <Sidebar>
        <SidebarHeader>
          <VaultSelector onVaultChange={data.handleVaultChange} />
          {/* Horizontal icon bar */}
          {data.hasVault && (
            <div className="flex items-center gap-0.5 border-b pb-2">
              {railItems.map((item) => {
                const active = activePanel === item.id
                return (
                  <Tooltip key={item.id}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => switchPanel(item.id)}
                        className={`relative flex size-8 flex-1 items-center justify-center rounded-md transition-colors ${
                          active
                            ? "bg-accent text-foreground"
                            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                        }`}
                      >
                        {active && (
                          <span className="absolute inset-x-1.5 bottom-0 h-0.5 rounded-full bg-primary" />
                        )}
                        <item.icon className="size-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      {item.tooltip}
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </div>
          )}
        </SidebarHeader>

        <SidebarContent>
          {data.hasVault ? (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              {activePanel === "files" && <FilesPanel data={data} />}
              {activePanel === "search" && <SearchPanel />}
              {activePanel === "quickAccess" && (
                <QuickAccessPanel
                  openTab={openTab}
                  closeAllTabs={closeAllTabs}
                  getBinding={getBinding}
                />
              )}
              {activePanel === "bookmarks" && <BookmarksSidebarPanel />}
              {activePanel === "database" && (
                <DatabasePanel
                  dbViews={data.dbViews}
                  openTab={openTab}
                  onCreateView={data.handleCreateDbView}
                />
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
              <p className="text-sm text-muted-foreground">
                Create a vault to get started
              </p>
              <CreateVaultDialog
                trigger={
                  <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">
                    <PlusIcon className="size-4" />
                    Create Vault
                  </button>
                }
              />
            </div>
          )}
        </SidebarContent>

        <SidebarFooter>
          <SyncStatus />
          <SidebarUserFooter user={data.user} openTab={openTab} />
        </SidebarFooter>
        <SidebarResizer />
      </Sidebar>

      <CreateFolderDialog
        open={data.folderDialogOpen}
        onOpenChange={data.setFolderDialogOpen}
        onCreated={data.handleFolderCreated}
      />
    </>
  )
}
