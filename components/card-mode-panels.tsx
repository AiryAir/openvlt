"use client"

import * as React from "react"
import {
  FileTextIcon,
  FolderIcon,
  ChevronRightIcon,
  FolderPlusIcon,
  PlusIcon,
  PenLineIcon,
  PencilRulerIcon,
  LayoutDashboardIcon,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useCardModeStore } from "@/lib/stores/card-mode-store"
import { useTabStore } from "@/lib/stores/tab-store"
import { CreateFolderDialog } from "@/components/create-folder-dialog"
import type { TreeNode } from "@/types"

const FULL_WIDTH = 224 // w-56 = 14rem
const STRIP_WIDTH = 40

// Color palette for cascading panels (hue values)
const PANEL_HUES = [
  { hue: 220, name: "blue" },
  { hue: 275, name: "purple" },
  { hue: 170, name: "teal" },
  { hue: 35, name: "amber" },
  { hue: 345, name: "rose" },
  { hue: 155, name: "emerald" },
  { hue: 240, name: "indigo" },
]

function getPanelColors(index: number) {
  const { hue } = PANEL_HUES[index % PANEL_HUES.length]
  return {
    bg: `hsla(${hue}, 40%, 8%, 0.5)`,
    bgLight: `hsla(${hue}, 50%, 97%, 1)`,
    border: `hsla(${hue}, 30%, 30%, 0.3)`,
    borderLight: `hsla(${hue}, 30%, 80%, 0.6)`,
    header: `hsla(${hue}, 40%, 6%, 0.7)`,
    headerLight: `hsla(${hue}, 40%, 93%, 1)`,
    dot: `hsla(${hue}, 70%, 60%, 1)`,
    selected: `hsla(${hue}, 50%, 40%, 0.35)`,
    selectedLight: `hsla(${hue}, 50%, 60%, 0.25)`,
    hover: `hsla(${hue}, 50%, 40%, 0.2)`,
    hoverLight: `hsla(${hue}, 50%, 60%, 0.15)`,
    text: `hsla(${hue}, 40%, 80%, 1)`,
    textLight: `hsla(${hue}, 40%, 30%, 1)`,
  }
}

function getNoteIcon(path: string) {
  if (path.endsWith(".canvas.json") || path.endsWith(".openvlt"))
    return LayoutDashboardIcon
  if (path.endsWith(".excalidraw.json")) return PenLineIcon
  return FileTextIcon
}

/**
 * Calculate how many panels (from the left) should be collapsed into strips.
 * We always keep at least 1 panel at full width.
 */
function calcStripCount(panelCount: number, availableWidth: number): number {
  if (panelCount <= 1) return 0
  // All panels fit at full width
  if (panelCount * FULL_WIDTH <= availableWidth) return 0
  // How many panels need to become strips?
  // strips * STRIP_WIDTH + fulls * FULL_WIDTH <= availableWidth
  // where fulls = panelCount - strips
  const minStrips = Math.ceil(
    (panelCount * FULL_WIDTH - availableWidth) / (FULL_WIDTH - STRIP_WIDTH)
  )
  // At least 1 panel stays full
  return Math.min(Math.max(0, minStrips), panelCount - 1)
}

interface CardModePanelsProps {
  tree: TreeNode[]
  onRefresh: () => void
  /** Available width in pixels for all card panels */
  availableWidth: number
}

export function CardModePanels({
  tree,
  onRefresh,
  availableWidth,
}: CardModePanelsProps) {
  const { panels, selectFolder, selectNote, truncateToPanel } =
    useCardModeStore()
  const { openTab } = useTabStore()
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const [isDark, setIsDark] = React.useState(true)

  // Detect theme
  React.useEffect(() => {
    function check() {
      setIsDark(document.documentElement.classList.contains("dark"))
    }
    check()
    const observer = new MutationObserver(check)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })
    return () => observer.disconnect()
  }, [])

  // Auto-scroll right when new panels are added
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        left: scrollRef.current.scrollWidth,
        behavior: "smooth",
      })
    }
  }, [panels.length])

  // Find children for a given folder ID from the tree
  function findChildren(folderId: string, nodes: TreeNode[]): TreeNode[] {
    for (const node of nodes) {
      if (node.id === folderId) return node.children ?? []
      if (node.children) {
        const found = findChildren(folderId, node.children)
        if (found.length > 0) return found
      }
    }
    return []
  }

  function handleItemClick(panelIndex: number, node: TreeNode) {
    if (node.type === "folder") {
      selectFolder(panelIndex, node)
    } else {
      selectNote(panelIndex, node.id)
      openTab(node.id, node.name)
    }
  }

  if (panels.length === 0) return null

  const stripCount = calcStripCount(panels.length, availableWidth)

  return (
    <div
      ref={scrollRef}
      className="flex min-h-svh overflow-x-auto overflow-y-hidden border-l border-border/50"
      style={{ scrollbarWidth: "none" }}
    >
      {panels.map((panel, index) => {
        const isCollapsed = index < stripCount
        const colors = getPanelColors(index)
        const children =
          panel.folderId === "__root__"
            ? tree
            : findChildren(panel.folderId, tree)
        const folders = children.filter((c) => c.type === "folder")
        const notes = children.filter((c) => c.type === "file")

        return (
          <div
            key={`${panel.folderId}-${index}`}
            className="shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out"
            style={{
              width: isCollapsed ? STRIP_WIDTH : FULL_WIDTH,
              minHeight: "100svh",
            }}
          >
            {isCollapsed ? (
              <CollapsedStrip
                panel={panel}
                colors={colors}
                isDark={isDark}
                onClick={() => truncateToPanel(index)}
              />
            ) : (
              <PanelColumn
                panel={panel}
                panelIndex={index}
                colors={colors}
                isDark={isDark}
                folders={folders}
                notes={notes}
                onItemClick={handleItemClick}
                onBackgroundClick={truncateToPanel}
                onRefresh={onRefresh}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ─── Collapsed strip ─────────────────────────────────────────────── */

function CollapsedStrip({
  panel,
  colors,
  isDark,
  onClick,
}: {
  panel: { folderId: string; folderName: string; selectedId: string | null }
  colors: ReturnType<typeof getPanelColors>
  isDark: boolean
  onClick: () => void
}) {
  const bg = isDark ? colors.bg : colors.bgLight
  const borderColor = isDark ? colors.border : colors.borderLight
  const headerBg = isDark ? colors.header : colors.headerLight
  const textColor = isDark ? colors.text : colors.textLight
  const hoverBg = isDark ? colors.hover : colors.hoverLight

  return (
    <button
      onClick={onClick}
      className="flex h-full w-10 flex-col items-center cursor-pointer transition-colors"
      style={{
        backgroundColor: bg,
        borderRight: `1px solid ${borderColor}`,
      }}
      title={panel.folderName}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = hoverBg
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = bg
      }}
    >
      {/* Mini header area */}
      <div
        className="flex h-10 w-full shrink-0 items-center justify-center"
        style={{
          backgroundColor: headerBg,
          borderBottom: `1px solid ${borderColor}`,
        }}
      >
        <div
          className="size-2.5 rounded-full"
          style={{ backgroundColor: colors.dot }}
        />
      </div>
      {/* Vertical folder name */}
      <div className="flex flex-1 items-start justify-center overflow-hidden pt-3">
        <span
          className="max-h-40 truncate text-xs font-medium"
          style={{
            color: textColor,
            writingMode: "vertical-lr",
          }}
        >
          {panel.folderName}
        </span>
      </div>
    </button>
  )
}

/* ─── Full panel column ───────────────────────────────────────────── */

interface PanelColumnProps {
  panel: {
    folderId: string
    folderName: string
    selectedId: string | null
  }
  panelIndex: number
  colors: ReturnType<typeof getPanelColors>
  isDark: boolean
  folders: TreeNode[]
  notes: TreeNode[]
  onItemClick: (panelIndex: number, node: TreeNode) => void
  onBackgroundClick: (panelIndex: number) => void
  onRefresh: () => void
}

function PanelColumn({
  panel,
  panelIndex,
  colors,
  isDark,
  folders,
  notes,
  onItemClick,
  onBackgroundClick,
  onRefresh,
}: PanelColumnProps) {
  const [folderDialogOpen, setFolderDialogOpen] = React.useState(false)
  const [hoveredId, setHoveredId] = React.useState<string | null>(null)

  async function handleCreateFile(
    noteType: "markdown" | "canvas" | "excalidraw"
  ) {
    const parentId = panel.folderId === "__root__" ? null : panel.folderId
    const titles: Record<string, string> = {
      markdown: "Untitled",
      canvas: "Untitled Canvas",
      excalidraw: "Untitled Drawing",
    }
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: titles[noteType],
          parentId,
          ...(noteType !== "markdown" && { noteType }),
        }),
      })
      if (res.ok) {
        onRefresh()
      }
    } catch {}
  }

  async function handleFolderCreated(name: string) {
    const parentId = panel.folderId === "__root__" ? null : panel.folderId
    await fetch("/api/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, parentId }),
    })
    onRefresh()
  }

  const bg = isDark ? colors.bg : colors.bgLight
  const borderColor = isDark ? colors.border : colors.borderLight
  const headerBg = isDark ? colors.header : colors.headerLight
  const textColor = isDark ? colors.text : colors.textLight
  const selectedBg = isDark ? colors.selected : colors.selectedLight
  const hoverBg = isDark ? colors.hover : colors.hoverLight

  return (
    <>
      <div
        className="flex min-h-svh w-56 flex-col"
        style={{
          backgroundColor: bg,
          borderRight: `1px solid ${borderColor}`,
        }}
      >
        {/* Panel header */}
        <div
          className="flex h-10 items-center gap-2 px-3"
          style={{
            backgroundColor: headerBg,
            borderBottom: `1px solid ${borderColor}`,
          }}
        >
          <div
            className="size-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: colors.dot }}
          />
          <span
            className="truncate text-sm font-semibold"
            style={{ color: textColor }}
          >
            {panel.folderName}
          </span>
          <div className="ml-auto flex items-center gap-0.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  title="New file"
                  className="inline-flex size-6 items-center justify-center rounded-md transition-opacity hover:opacity-80"
                  style={{ color: textColor }}
                >
                  <PlusIcon className="size-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => handleCreateFile("markdown")}>
                  <FileTextIcon className="mr-2 size-4" />
                  Markdown
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleCreateFile("canvas")}>
                  <PenLineIcon className="mr-2 size-4" />
                  Canvas
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleCreateFile("excalidraw")}
                >
                  <PencilRulerIcon className="mr-2 size-4" />
                  Excalidraw
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <button
              onClick={() => setFolderDialogOpen(true)}
              title="New Folder"
              className="inline-flex size-6 items-center justify-center rounded-md transition-opacity hover:opacity-80"
              style={{ color: textColor }}
            >
              <FolderPlusIcon className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Panel content — clicking empty space truncates deeper panels */}
        <div
          className="flex-1 overflow-y-auto px-1.5 py-1.5"
          onClick={(e) => {
            if (e.target === e.currentTarget) onBackgroundClick(panelIndex)
          }}
        >
          {folders.length === 0 && notes.length === 0 && (
            <div className="px-2 py-6 text-center text-sm text-muted-foreground">
              Empty
            </div>
          )}

          {/* Folders */}
          {folders.map((folder) => {
            const isSelected = panel.selectedId === folder.id
            const isHovered = hoveredId === folder.id
            return (
              <button
                key={folder.id}
                onClick={() => onItemClick(panelIndex, folder)}
                onMouseEnter={() => setHoveredId(folder.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-all"
                style={{
                  backgroundColor: isSelected
                    ? selectedBg
                    : isHovered
                      ? hoverBg
                      : "transparent",
                  color: isSelected ? textColor : undefined,
                  fontWeight: isSelected ? 600 : 400,
                }}
              >
                <FolderIcon className="size-4 shrink-0" />
                <span className="min-w-0 flex-1 truncate">{folder.name}</span>
                <ChevronRightIcon
                  className="size-3.5 shrink-0 transition-opacity"
                  style={{
                    opacity: isSelected ? 1 : isHovered ? 0.6 : 0,
                    color: textColor,
                  }}
                />
              </button>
            )
          })}

          {/* Divider */}
          {folders.length > 0 && notes.length > 0 && (
            <div
              className="my-1.5"
              style={{
                borderTop: `1px solid ${borderColor}`,
              }}
            />
          )}

          {/* Notes */}
          {notes.map((note) => {
            const isSelected = panel.selectedId === note.id
            const isHovered = hoveredId === note.id
            const NoteIcon = getNoteIcon(note.path)
            return (
              <button
                key={note.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = "move"
                  e.dataTransfer.setData(
                    "application/openvlt-note",
                    JSON.stringify({ noteId: note.id, title: note.name })
                  )
                }}
                onClick={() => onItemClick(panelIndex, note)}
                onMouseEnter={() => setHoveredId(note.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-all"
                style={{
                  backgroundColor: isSelected
                    ? selectedBg
                    : isHovered
                      ? hoverBg
                      : "transparent",
                  color: isSelected ? textColor : undefined,
                  fontWeight: isSelected ? 500 : 400,
                }}
              >
                <NoteIcon className="size-4 shrink-0" />
                <span className="min-w-0 flex-1 truncate">{note.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      <CreateFolderDialog
        open={folderDialogOpen}
        onOpenChange={setFolderDialogOpen}
        onCreated={handleFolderCreated}
      />
    </>
  )
}
