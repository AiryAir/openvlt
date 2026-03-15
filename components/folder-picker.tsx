"use client"

import * as React from "react"
import {
  FolderIcon,
  FolderOpenIcon,
  FolderPlusIcon,
  ChevronUpIcon,
  HomeIcon,
  CheckIcon,
  Loader2Icon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface FolderEntry {
  name: string
  path: string
}

interface FolderPickerProps {
  value: string
  onChange: (path: string) => void
}

export function FolderPicker({ value, onChange }: FolderPickerProps) {
  const [currentPath, setCurrentPath] = React.useState("")
  const [parentPath, setParentPath] = React.useState<string | null>(null)
  const [folders, setFolders] = React.useState<FolderEntry[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState("")
  const [creatingFolder, setCreatingFolder] = React.useState(false)
  const [newFolderName, setNewFolderName] = React.useState("")
  const newFolderInputRef = React.useRef<HTMLInputElement>(null)

  const fetchFolders = React.useCallback(async (dirPath?: string) => {
    setLoading(true)
    setError("")
    try {
      const params = dirPath ? `?path=${encodeURIComponent(dirPath)}` : ""
      const res = await fetch(`/api/filesystem${params}`)
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Failed to load directory")
        return
      }
      const data = await res.json()
      setCurrentPath(data.current)
      setParentPath(data.parent)
      setFolders(data.folders)
      onChange(data.current)
    } catch {
      setError("Failed to load directory")
    } finally {
      setLoading(false)
    }
  }, [onChange])

  React.useEffect(() => {
    fetchFolders(value || undefined)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleNavigate(dirPath: string) {
    fetchFolders(dirPath)
    setCreatingFolder(false)
  }

  async function handleCreateFolder() {
    if (!newFolderName.trim()) return

    try {
      const res = await fetch("/api/filesystem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: currentPath,
          name: newFolderName.trim(),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Failed to create folder")
        return
      }

      const data = await res.json()
      setCreatingFolder(false)
      setNewFolderName("")
      // Navigate into the new folder
      handleNavigate(data.path)
    } catch {
      setError("Failed to create folder")
    }
  }

  function handleStartCreate() {
    setCreatingFolder(true)
    setTimeout(() => newFolderInputRef.current?.focus(), 50)
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Current path + navigation */}
      <div className="flex items-center gap-1 rounded-md border bg-muted/50 px-3 py-2">
        <FolderOpenIcon className="size-4 shrink-0 text-muted-foreground" />
        <span className="flex-1 truncate text-sm font-mono">
          {currentPath}
        </span>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => fetchFolders(undefined)}
          title="Home directory"
        >
          <HomeIcon className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => parentPath && handleNavigate(parentPath)}
          disabled={!parentPath}
          title="Go up"
        >
          <ChevronUpIcon className="size-4" />
        </Button>
        <div className="flex-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleStartCreate}
          className="gap-1.5 text-xs"
        >
          <FolderPlusIcon className="size-3.5" />
          New Folder
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}

      {/* Folder list */}
      <ScrollArea className="h-[240px] rounded-md border">
        <div className="p-1">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* New folder input */}
              {creatingFolder && (
                <div className="flex items-center gap-2 rounded-md bg-accent p-2">
                  <FolderPlusIcon className="size-4 shrink-0 text-muted-foreground" />
                  <input
                    ref={newFolderInputRef}
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateFolder()
                      if (e.key === "Escape") {
                        setCreatingFolder(false)
                        setNewFolderName("")
                      }
                    }}
                    placeholder="Folder name"
                    className="h-6 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={handleCreateFolder}
                    disabled={!newFolderName.trim()}
                  >
                    <CheckIcon className="size-3.5" />
                  </Button>
                </div>
              )}

              {folders.length === 0 && !creatingFolder && (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  Empty directory
                </div>
              )}

              {folders.map((folder) => (
                <button
                  key={folder.path}
                  type="button"
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
                  onClick={() => handleNavigate(folder.path)}
                >
                  <FolderIcon className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{folder.name}</span>
                </button>
              ))}
            </>
          )}
        </div>
      </ScrollArea>

      <p className="text-xs text-muted-foreground">
        Navigate to the folder you want as your vault. The current folder will
        be used.
      </p>
    </div>
  )
}
