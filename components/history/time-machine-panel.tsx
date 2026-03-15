"use client"

import * as React from "react"
import { XIcon, HistoryIcon } from "lucide-react"
import { VersionTimeline } from "@/components/history/version-timeline"
import { VersionPreview } from "@/components/history/version-preview"
import { FolderTimeBrowser } from "@/components/history/folder-time-browser"
import { VaultTimeBrowser } from "@/components/history/vault-time-browser"
import { cn } from "@/lib/utils"

type Tab = "note" | "folder" | "vault"

interface TimeMachinePanelProps {
  noteId: string
  folderId?: string | null
  onClose: () => void
  onRestored: () => void
}

export function TimeMachinePanel({
  noteId,
  folderId,
  onClose,
  onRestored,
}: TimeMachinePanelProps) {
  const [tab, setTab] = React.useState<Tab>("note")
  const [selectedVersionId, setSelectedVersionId] = React.useState<
    string | undefined
  >()

  return (
    <div className="flex h-full w-80 shrink-0 flex-col border-l bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-3 py-2">
        <div className="flex items-center gap-2">
          <HistoryIcon className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">History</span>
        </div>
        <button
          onClick={onClose}
          className="rounded-sm p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <XIcon className="size-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        {(
          [
            { id: "note", label: "Note" },
            { id: "folder", label: "Folder" },
            { id: "vault", label: "Vault" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex-1 px-3 py-2 text-xs font-medium transition-colors",
              tab === t.id
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {tab === "note" && (
          <div className="flex flex-col">
            <VersionTimeline
              noteId={noteId}
              onSelectVersion={setSelectedVersionId}
              selectedVersionId={selectedVersionId}
            />
            {selectedVersionId && (
              <div className="border-t">
                <VersionPreview
                  noteId={noteId}
                  versionId={selectedVersionId}
                  onRestore={() => {
                    setSelectedVersionId(undefined)
                    onRestored()
                  }}
                />
              </div>
            )}
          </div>
        )}

        {tab === "folder" &&
          (folderId ? (
            <FolderTimeBrowser folderId={folderId} />
          ) : (
            <div className="p-4 text-sm text-muted-foreground">
              This note is in the vault root (no folder)
            </div>
          ))}

        {tab === "vault" && <VaultTimeBrowser />}
      </div>
    </div>
  )
}
