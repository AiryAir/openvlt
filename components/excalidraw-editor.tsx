"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import dynamic from "next/dynamic"
import { FileTextIcon } from "lucide-react"
import { ExcalidrawMdEmbed } from "@/components/excalidraw-md-embed"
import { ExcalidrawEmbedPicker } from "@/components/excalidraw-embed-picker"
import "@excalidraw/excalidraw/index.css"

const ExcalidrawComponent = dynamic(
  () => import("@excalidraw/excalidraw").then((mod) => mod.Excalidraw),
  { ssr: false, loading: () => <ExcalidrawSkeleton /> },
)

// Lazy module loader — only triggers on first call, avoids SSR issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _excalidrawMod: Promise<any> | null = null
function getExcalidrawModule() {
  if (!_excalidrawMod) {
    _excalidrawMod = import("@excalidraw/excalidraw")
  }
  return _excalidrawMod
}

async function getSyncInvalidIndices() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mod: any = await getExcalidrawModule()
  return mod.syncInvalidIndices as
    | ((elements: unknown[]) => unknown[])
    | undefined
}

async function getConvertToExcalidrawElements() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mod: any = await getExcalidrawModule()
  return mod.convertToExcalidrawElements as (elements: unknown[]) => unknown[]
}

const OPENVLT_EMBED_PREFIX = "openvlt://embed/"

function parseEmbedLink(link: string): {
  noteId: string
  anchor: string
  noteTitle?: string
} | null {
  if (!link.startsWith(OPENVLT_EMBED_PREFIX)) return null
  const rest = link.slice(OPENVLT_EMBED_PREFIX.length)
  const hashIdx = rest.indexOf("#")
  if (hashIdx === -1) {
    return { noteId: rest, anchor: "" }
  }
  return {
    noteId: rest.slice(0, hashIdx),
    anchor: rest.slice(hashIdx + 1),
  }
}

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const apiRef = React.useRef<any>(null)
  const [pickerOpen, setPickerOpen] = React.useState(false)

  // Listen for embed trigger from header bar
  React.useEffect(() => {
    const handler = () => setPickerOpen(true)
    window.addEventListener("openvlt:excalidraw-embed", handler)
    return () => window.removeEventListener("openvlt:excalidraw-embed", handler)
  }, [])

  // Set asset path for fonts
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(window as any).EXCALIDRAW_ASSET_PATH = "/"
    }
  }, [])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [parsedInitial, setParsedInitial] = React.useState<any>(null)

  React.useEffect(() => {
    async function parse() {
      try {
        const data = JSON.parse(initialData)
        let elements = data.elements || []

        // Repair corrupted fractional indices to prevent Excalidraw crash
        try {
          const syncInvalidIndices = await getSyncInvalidIndices()
          if (syncInvalidIndices) {
            elements = syncInvalidIndices(elements)
          }
        } catch {
          // If sync fails, use elements as-is
        }

        setParsedInitial({
          elements,
          appState: {
            ...data.appState,
            collaborators: new Map(),
          },
          files: data.files || undefined,
        })
      } catch {
        setParsedInitial({ elements: [], appState: {} })
      }
    }
    parse()
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

  async function handleInsertEmbed(
    embedNoteId: string,
    embedNoteTitle: string,
    anchor: string,
  ) {
    const api = apiRef.current
    if (!api) return

    const convertToExcalidrawElements =
      await getConvertToExcalidrawElements()
    if (!convertToExcalidrawElements) return

    const link = anchor
      ? `${OPENVLT_EMBED_PREFIX}${embedNoteId}#${anchor}`
      : `${OPENVLT_EMBED_PREFIX}${embedNoteId}`

    const { scrollX, scrollY, width, height } = api.getAppState()
    const centerX = -scrollX + width / 2 - 200
    const centerY = -scrollY + height / 2 - 150

    const newElements = convertToExcalidrawElements([
      {
        type: "embeddable",
        x: centerX,
        y: centerY,
        width: 400,
        height: 300,
        link,
        backgroundColor: "transparent",
        strokeColor: "transparent",
        fillStyle: "solid",
        strokeWidth: 1,
        roughness: 0,
        opacity: 100,
        customData: {
          openvltEmbed: {
            noteId: embedNoteId,
            anchor,
            noteTitle: embedNoteTitle,
            anchorType: anchor.startsWith("^") ? "block-id" : "heading",
          },
        },
      },
    ])

    api.updateScene({
      elements: [...api.getSceneElements(), ...newElements],
    })

    // Force Excalidraw to re-validate embeddable elements
    // Without this, the embed won't render until page refresh
    setTimeout(() => api.refresh(), 50)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function renderEmbeddable(element: any, _appState: any) {
    const link = element.link
    if (!link || !link.startsWith(OPENVLT_EMBED_PREFIX)) return null

    const parsed = parseEmbedLink(link)
    if (!parsed) return null

    const customTitle = element.customData?.openvltEmbed?.noteTitle

    return (
      <ExcalidrawMdEmbed
        noteId={parsed.noteId}
        anchor={parsed.anchor}
        noteTitle={customTitle}
      />
    )
  }

  if (!parsedInitial) {
    return <ExcalidrawSkeleton />
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
          excalidrawAPI={(api: unknown) => {
            apiRef.current = api
          }}
          initialData={parsedInitial}
          onChange={handleChange}
          theme={resolvedTheme === "dark" ? "dark" : "light"}
          validateEmbeddable={(link: string) => {
            if (link.startsWith(OPENVLT_EMBED_PREFIX)) return true
            return undefined
          }}
          renderEmbeddable={renderEmbeddable}
          UIOptions={{
            canvasActions: {
              loadScene: false,
              saveToActiveFile: false,
              export: false,
            },
          }}
        />
      </div>
      <ExcalidrawEmbedPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleInsertEmbed}
      />
    </div>
  )
}
