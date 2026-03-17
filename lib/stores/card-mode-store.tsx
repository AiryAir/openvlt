"use client"

import * as React from "react"
import type { TreeNode } from "@/types"

const STORAGE_KEY = "openvlt:card-mode-panels"

export interface CardPanel {
  /** The folder ID whose children are displayed in this panel */
  folderId: string
  folderName: string
  /** The selected item ID in this panel (folder or note) */
  selectedId: string | null
}

interface CardModeState {
  panels: CardPanel[]
}

interface CardModeStore extends CardModeState {
  /** Select a folder in a panel, opening a new panel to its right */
  selectFolder: (panelIndex: number, folder: TreeNode) => void
  /** Select a note in a panel (no new panel opens) */
  selectNote: (panelIndex: number, noteId: string) => void
  /** Truncate panels to the given index (navigate back to that depth) */
  truncateToPanel: (panelIndex: number) => void
  /** Reset all panels (e.g. when switching mode) */
  reset: () => void
  /** Set the root folders (initializes with root panel) */
  setPanels: (panels: CardPanel[]) => void
}

const CardModeContext = React.createContext<CardModeStore | null>(null)

function loadState(): CardModeState {
  if (typeof window === "undefined") return { panels: [] }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed.panels)) return parsed
    }
  } catch {}
  return { panels: [] }
}

function persist(state: CardModeState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function CardModeProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<CardModeState>({ panels: [] })
  const hydratedRef = React.useRef(false)

  React.useEffect(() => {
    if (!hydratedRef.current) {
      hydratedRef.current = true
      setState(loadState())
    }
  }, [])

  React.useEffect(() => {
    if (hydratedRef.current) {
      persist(state)
    }
  }, [state])

  const selectFolder = React.useCallback(
    (panelIndex: number, folder: TreeNode) => {
      setState((prev) => {
        // Update selection on the current panel and add new panel
        const panels = prev.panels.slice(0, panelIndex + 1)
        panels[panelIndex] = {
          ...panels[panelIndex],
          selectedId: folder.id,
        }
        panels.push({
          folderId: folder.id,
          folderName: folder.name,
          selectedId: null,
        })
        return { panels }
      })
    },
    []
  )

  const selectNote = React.useCallback(
    (panelIndex: number, noteId: string) => {
      setState((prev) => {
        // Truncate panels after this one and update selection
        const panels = prev.panels.slice(0, panelIndex + 1)
        panels[panelIndex] = {
          ...panels[panelIndex],
          selectedId: noteId,
        }
        return { panels }
      })
    },
    []
  )

  const truncateToPanel = React.useCallback(
    (panelIndex: number) => {
      setState((prev) => {
        const panels = prev.panels.slice(0, panelIndex + 1)
        panels[panelIndex] = { ...panels[panelIndex], selectedId: null }
        return { panels }
      })
    },
    []
  )

  const reset = React.useCallback(() => {
    setState({ panels: [] })
  }, [])

  const setPanels = React.useCallback((panels: CardPanel[]) => {
    setState({ panels })
  }, [])

  const store = React.useMemo<CardModeStore>(
    () => ({
      ...state,
      selectFolder,
      selectNote,
      truncateToPanel,
      reset,
      setPanels,
    }),
    [state, selectFolder, selectNote, truncateToPanel, reset, setPanels]
  )

  return (
    <CardModeContext.Provider value={store}>
      {children}
    </CardModeContext.Provider>
  )
}

export function useCardModeStore(): CardModeStore {
  const ctx = React.useContext(CardModeContext)
  if (!ctx)
    throw new Error("useCardModeStore must be used within CardModeProvider")
  return ctx
}
