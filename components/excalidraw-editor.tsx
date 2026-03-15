"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import dynamic from "next/dynamic"
import "@excalidraw/excalidraw/index.css"

const ExcalidrawComponent = dynamic(
  () => import("@excalidraw/excalidraw").then((mod) => mod.Excalidraw),
  { ssr: false, loading: () => <ExcalidrawSkeleton /> }
)

function ExcalidrawSkeleton() {
  return (
    <div className="flex h-full items-center justify-center bg-background">
      <div className="size-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
    </div>
  )
}

interface ExcalidrawEditorProps {
  noteId: string
  initialData: string // JSON string of the .excalidraw.json content
}

export function ExcalidrawEditor({ noteId, initialData }: ExcalidrawEditorProps) {
  const { resolvedTheme } = useTheme()
  const saveTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const [saving, setSaving] = React.useState(false)

  // Set asset path for fonts
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(window as any).EXCALIDRAW_ASSET_PATH = "/"
    }
  }, [])

  const parsedInitial = React.useMemo(() => {
    try {
      const data = JSON.parse(initialData)
      return {
        elements: data.elements || [],
        appState: {
          ...data.appState,
          collaborators: undefined,
        },
        files: data.files || undefined,
      }
    } catch {
      return { elements: [], appState: {} }
    }
  }, [initialData])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleChange(elements: any, appState: any, files: any) {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(async () => {
      setSaving(true)
      try {
        const data = JSON.stringify({
          type: "excalidraw",
          version: 2,
          source: "openvlt",
          elements,
          appState: {
            gridSize: appState.gridSize,
            viewBackgroundColor: appState.viewBackgroundColor,
          },
          files,
        })

        await fetch(`/api/notes/${noteId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: data }),
        })
      } finally {
        setSaving(false)
      }
    }, 1000)
  }

  return (
    <div className="relative flex-1">
      {saving && (
        <div className="absolute right-4 top-2 z-30 text-xs text-muted-foreground">
          Saving...
        </div>
      )}
      <div className="h-full w-full">
        <ExcalidrawComponent
          initialData={parsedInitial}
          onChange={handleChange}
          theme={resolvedTheme === "dark" ? "dark" : "light"}
          UIOptions={{
            canvasActions: {
              loadScene: false,
              saveToActiveFile: false,
              export: false,
            },
          }}
        />
      </div>
    </div>
  )
}
