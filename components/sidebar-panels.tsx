"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import {
  FileTextIcon,
  FolderPlusIcon,
  PlusIcon,
  StarIcon,
  TrashIcon,
  SearchIcon,
  CalendarIcon,
  BookmarkIcon,
  PenLineIcon,
  PencilRulerIcon,
  TableIcon,
  HomeIcon,
  EyeIcon,
  SettingsIcon,
  UserIcon,
  LogOutIcon,
  ChevronsUpDownIcon,
  SunIcon,
  MoonIcon,
} from "lucide-react"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroupContent,
} from "@/components/ui/sidebar"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { SidebarTree } from "@/components/sidebar-tree"
import { BookmarksPanel } from "@/components/bookmarks-panel"
import {
  useShortcuts,
  ShortcutKeys,
} from "@/lib/stores/shortcuts-store"
import type { useSidebarData } from "@/hooks/use-sidebar-data"

// ── Types ─────────────────────────────────────────────────────────────

export type SidebarPanel =
  | "files"
  | "search"
  | "quickAccess"
  | "bookmarks"
  | "database"

// ── Helpers ───────────────────────────────────────────────────────────

export async function openDailyNote(
  openTab: (id: string, title: string) => void
) {
  try {
    const res = await fetch("/api/notes/daily")
    if (res.ok) {
      const note = await res.json()
      openTab(note.id, note.title)
      window.dispatchEvent(new Event("openvlt:tree-refresh"))
    }
  } catch {}
}

// ── Panel Components ──────────────────────────────────────────────────

export function FilesPanel({
  data,
}: {
  data: ReturnType<typeof useSidebarData>
}) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex h-8 shrink-0 items-center justify-between px-3">
            <span className="text-xs font-medium text-muted-foreground">
              Files
            </span>
            <span className="flex items-center gap-0.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={data.toggleShowAllFiles}
                    className={`inline-flex size-5 items-center justify-center rounded-md transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
                      data.showAllFiles ? "text-primary" : "text-sidebar-foreground"
                    }`}
                  >
                    <EyeIcon className="size-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {data.showAllFiles ? "Show notes only" : "Show all files"}
                </TooltipContent>
              </Tooltip>
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="inline-flex size-5 items-center justify-center rounded-md text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      >
                        <PlusIcon className="size-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">New file</TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem onClick={data.handleCreateNote}>
                    <FileTextIcon className="mr-2 size-4" />
                    Markdown
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={data.handleCreateCanvas}>
                    <PenLineIcon className="mr-2 size-4" />
                    Canvas
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={data.handleCreateExcalidraw}>
                    <PencilRulerIcon className="mr-2 size-4" />
                    Excalidraw
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={data.handleCreateFolder}
                    className="inline-flex size-5 items-center justify-center rounded-md text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  >
                    <FolderPlusIcon className="size-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">New folder</TooltipContent>
              </Tooltip>
            </span>
          </div>
          <div className="flex h-8 shrink-0 items-stretch border-y border-border/60 bg-background/40">
            {(
              [
                { value: "simple", label: "Simple" },
                { value: "advanced", label: "Advanced" },
                { value: "card", label: "Card" },
              ] as const
            ).map((tab, i) => {
              const active = data.sidebarMode === tab.value
              return (
                <button
                  key={tab.value}
                  onClick={() => data.handleModeChange(tab.value)}
                  className={`relative flex-1 text-xs font-medium tracking-wide transition-colors ${
                    i > 0 ? "border-l border-border/40" : ""
                  } ${
                    active
                      ? "bg-foreground/10 text-foreground"
                      : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground/80"
                  }`}
                >
                  {active && (
                    <span className="absolute inset-x-0 top-0 h-px bg-foreground/50" />
                  )}
                  {tab.label}
                </button>
              )
            })}
          </div>
          <div className="flex-1 overflow-y-auto">
            {data.sidebarMode === "card" ? (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                Use the section panels to browse your notes.
              </div>
            ) : (
              <SidebarGroupContent>
                <SidebarTree
                  nodes={data.tree}
                  onRefresh={data.fetchTree}
                  activeFolderId={data.activeFolderId}
                  onFolderActivate={data.setActiveFolderId}
                  activeItemId={data.activeItemId}
                  onItemActivate={data.setActiveItemId}
                />
              </SidebarGroupContent>
            )}
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={data.handleCreateNote}>
          <FileTextIcon className="mr-2 size-4" />
          New Markdown
        </ContextMenuItem>
        <ContextMenuItem onClick={data.handleCreateCanvas}>
          <PenLineIcon className="mr-2 size-4" />
          New Canvas
        </ContextMenuItem>
        <ContextMenuItem onClick={data.handleCreateExcalidraw}>
          <PencilRulerIcon className="mr-2 size-4" />
          New Excalidraw
        </ContextMenuItem>
        <ContextMenuItem onClick={data.handleCreateFolder}>
          <FolderPlusIcon className="mr-2 size-4" />
          New Folder
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

export function SearchPanel() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden p-3">
      <button
        onClick={() =>
          window.dispatchEvent(new Event("openvlt:open-command-palette"))
        }
        className="flex h-9 w-full items-center gap-2 rounded-md border bg-background px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        <SearchIcon className="size-4 shrink-0" />
        <span className="flex-1 text-left">Search notes...</span>
      </button>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        Use the search bar or the command palette to find notes.
      </p>
    </div>
  )
}

export function QuickAccessPanel({
  openTab,
  closeAllTabs,
  getBinding,
}: {
  openTab: (id: string, title: string) => void
  closeAllTabs: () => void
  getBinding: (id: string) => any
}) {
  const items = [
    {
      title: "Home",
      icon: HomeIcon,
      action: () => closeAllTabs(),
      shortcutId: null,
    },
    {
      title: "Daily Note",
      icon: CalendarIcon,
      action: () => openDailyNote(openTab),
      shortcutId: "dailyNote",
    },
    {
      title: "All Notes",
      icon: FileTextIcon,
      action: () => openTab("__all__", "All Notes"),
      shortcutId: "allNotes",
    },
    {
      title: "Favorites",
      icon: StarIcon,
      action: () => {
        openTab("__all__", "All Notes")
        setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent("openvlt:notes-filter", {
              detail: { favorites: true },
            })
          )
        }, 0)
      },
      shortcutId: "favorites",
    },
    {
      title: "Bookmarks",
      icon: BookmarkIcon,
      action: () => openTab("__bookmarks__", "Bookmarks"),
      shortcutId: "bookmarks",
    },
    {
      title: "Trash",
      icon: TrashIcon,
      action: () => openTab("__trash__", "Trash"),
      shortcutId: "trash",
    },
  ]

  return (
    <div className="flex-1 overflow-y-auto px-1">
      <div className="flex h-8 shrink-0 items-center px-2">
        <span className="text-xs font-medium text-muted-foreground">
          Quick Access
        </span>
      </div>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              onClick={item.action}
              className="overflow-visible"
            >
              <item.icon className="size-4" />
              <span className="flex-1 truncate">{item.title}</span>
              {item.shortcutId && (
                <ShortcutKeys
                  binding={getBinding(item.shortcutId)}
                  className="ml-auto shrink-0 opacity-60"
                />
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </div>
  )
}

export function BookmarksSidebarPanel() {
  return (
    <div className="flex-1 overflow-y-auto px-1">
      <div className="flex h-8 shrink-0 items-center px-2">
        <span className="text-xs font-medium text-muted-foreground">
          Bookmarks
        </span>
      </div>
      <SidebarMenu>
        <BookmarksPanel />
      </SidebarMenu>
    </div>
  )
}

export function DatabasePanel({
  dbViews,
  openTab,
  onCreateView,
}: {
  dbViews: { id: string; name: string; viewType: string }[]
  openTab: (id: string, title: string) => void
  onCreateView: () => void
}) {
  return (
    <div className="flex-1 overflow-y-auto px-1">
      <div className="flex h-8 shrink-0 items-center justify-between px-2">
        <span className="text-xs font-medium text-muted-foreground">
          Database Views
        </span>
        <button
          onClick={onCreateView}
          title="New Database View"
          className="inline-flex size-5 items-center justify-center rounded-md text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <PlusIcon className="size-3.5" />
        </button>
      </div>
      <SidebarMenu>
        {dbViews.length === 0 ? (
          <p className="px-3 py-2 text-xs text-muted-foreground">
            No views yet. Click + to create one.
          </p>
        ) : (
          dbViews.map((view) => (
            <SidebarMenuItem key={view.id}>
              <SidebarMenuButton
                onClick={() => openTab(`__dbview_${view.id}__`, view.name)}
              >
                <TableIcon className="size-4" />
                <span>{view.name}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))
        )}
      </SidebarMenu>
    </div>
  )
}

// ── User Footer ───────────────────────────────────────────────────────

export function SidebarUserFooter({
  user,
  openTab,
}: {
  user: { username: string; displayName: string } | null
  openTab: (id: string, title: string) => void
}) {
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const { getBinding } = useShortcuts()
  // Track mounted state so we only render the theme icon after hydration,
  // avoiding a flash where the icon doesn't match the actual theme.
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  const isDark = resolvedTheme === "dark"

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="cursor-pointer gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UserIcon className="size-4" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col leading-tight">
                <span className="truncate text-sm font-medium">
                  {user?.displayName || user?.username || "Account"}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  @{user?.username || "..."}
                </span>
              </div>
              <ChevronsUpDownIcon className="ml-auto size-4 shrink-0 text-muted-foreground" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align="start"
            className="min-w-(--radix-dropdown-menu-trigger-width) bg-popover! shadow-2xl ring-1 ring-border rounded-xl! p-1.5"
          >
            <DropdownMenuItem
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="rounded-lg px-2 py-2"
            >
              {mounted && isDark ? (
                <SunIcon className="mr-2 size-4" />
              ) : (
                <MoonIcon className="mr-2 size-4" />
              )}
              {mounted ? (isDark ? "Light Mode" : "Dark Mode") : "Toggle Theme"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => openTab("__settings__", "Settings")}
              className="rounded-lg px-2 py-2"
            >
              <SettingsIcon className="mr-2 size-4" />
              Settings
              <ShortcutKeys
                binding={getBinding("openSettings")}
                className="ml-auto"
              />
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" })
                router.push("/login")
              }}
              className="rounded-lg px-2 py-2"
            >
              <LogOutIcon className="mr-2 size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
