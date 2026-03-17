"use client"

import * as React from "react"
import { NodeViewWrapper } from "@tiptap/react"
import type { NodeViewProps } from "@tiptap/react"
import {
  Link2Icon,
  PencilIcon,
  CheckIcon,
  UnlinkIcon,
  Loader2Icon,
} from "lucide-react"
import { Button } from "@/components/ui/button"

export function SyncedBlockView({
  node,
  editor,
  updateAttributes,
  deleteNode,
}: NodeViewProps) {
  const { blockId } = node.attrs
  const [content, setContent] = React.useState("")
  const [version, setVersion] = React.useState(0)
  const [refCount, setRefCount] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [editing, setEditing] = React.useState(false)
  const [editContent, setEditContent] = React.useState("")
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState(false)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  const fetchBlock = React.useCallback(async () => {
    if (!blockId) return
    try {
      const res = await fetch(`/api/synced-blocks/${blockId}`)
      if (res.ok) {
        const data = await res.json()
        setContent(data.content)
        setVersion(data.version)
        setRefCount(data.refCount ?? 0)
        setError(false)
      } else {
        setError(true)
      }
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [blockId])

  React.useEffect(() => {
    fetchBlock()
  }, [fetchBlock])

  // Listen for cross-instance updates
  React.useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail?.blockId === blockId) {
        fetchBlock()
      }
    }
    window.addEventListener("openvlt:synced-block-updated", handler)
    return () =>
      window.removeEventListener("openvlt:synced-block-updated", handler)
  }, [blockId, fetchBlock])

  // BroadcastChannel for cross-tab sync
  React.useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return
    const channel = new BroadcastChannel("openvlt:synced-blocks")
    const handler = (e: MessageEvent) => {
      if (e.data?.blockId === blockId) {
        fetchBlock()
      }
    }
    channel.addEventListener("message", handler)
    return () => {
      channel.removeEventListener("message", handler)
      channel.close()
    }
  }, [blockId, fetchBlock])

  function startEditing() {
    if (!editor?.isEditable) return
    setEditContent(content)
    setEditing(true)
    requestAnimationFrame(() => textareaRef.current?.focus())
  }

  async function saveEdit() {
    setSaving(true)
    try {
      const res = await fetch(`/api/synced-blocks/${blockId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      })
      if (res.ok) {
        const data = await res.json()
        setContent(data.content)
        setVersion(data.version)
        setEditing(false)

        // Notify other instances on this page
        window.dispatchEvent(
          new CustomEvent("openvlt:synced-block-updated", {
            detail: { blockId },
          })
        )

        // Notify other tabs
        if (typeof BroadcastChannel !== "undefined") {
          const channel = new BroadcastChannel("openvlt:synced-blocks")
          channel.postMessage({ blockId })
          channel.close()
        }
      }
    } finally {
      setSaving(false)
    }
  }

  function detachBlock() {
    if (!editor) return
    // Replace the synced block node with its content as regular paragraphs
    const lines = content.split("\n").filter(Boolean)
    const nodes = lines.map((line) => ({
      type: "paragraph",
      content: [{ type: "text", text: line }],
    }))
    deleteNode()
    editor.commands.insertContent(nodes.length > 0 ? nodes : [{ type: "paragraph" }])
  }

  return (
    <NodeViewWrapper data-synced-block="">
      <div className="synced-block-wrapper group my-4 rounded-lg border-2 border-dashed border-orange-400/40 bg-orange-50/30 dark:bg-orange-950/10">
        {/* Header bar */}
        <div className="flex items-center gap-1.5 border-b border-orange-400/20 px-3 py-1">
          <Link2Icon className="size-3 text-orange-500" />
          <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
            Synced block
          </span>
          {refCount > 1 && (
            <span className="text-xs text-muted-foreground">
              ({refCount} references)
            </span>
          )}

          <div className="ml-auto flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            {!editing && editor?.isEditable && (
              <Button
                variant="ghost"
                size="sm"
                className="h-5 gap-1 px-1 text-xs text-muted-foreground"
                onClick={startEditing}
              >
                <PencilIcon className="size-3" />
                Edit
              </Button>
            )}
            {editor?.isEditable && (
              <Button
                variant="ghost"
                size="sm"
                className="h-5 gap-1 px-1 text-xs text-muted-foreground"
                onClick={detachBlock}
                title="Detach: convert to regular content"
              >
                <UnlinkIcon className="size-3" />
                Detach
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="px-3 py-2">
          {loading && (
            <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
              <Loader2Icon className="size-3.5 animate-spin" />
              Loading synced block...
            </div>
          )}

          {error && !loading && (
            <div className="py-2 text-sm text-muted-foreground">
              Synced block not found. It may have been deleted.
            </div>
          )}

          {!loading && !error && !editing && (
            <div
              className="synced-block-content prose prose-sm dark:prose-invert max-w-none cursor-pointer"
              onDoubleClick={startEditing}
            >
              {content ? (
                content.split("\n").map((line, i) => (
                  <p key={i} className={!line ? "h-4" : undefined}>
                    {line}
                  </p>
                ))
              ) : (
                <p className="italic text-muted-foreground">
                  Empty synced block. Double-click to edit.
                </p>
              )}
            </div>
          )}

          {editing && (
            <div className="flex flex-col gap-2">
              <textarea
                ref={textareaRef}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full resize-none rounded border bg-background p-2 font-mono text-sm text-foreground outline-none focus:border-primary"
                rows={Math.max(3, editContent.split("\n").length + 1)}
                placeholder="Enter content for this synced block..."
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    e.preventDefault()
                    setEditing(false)
                  }
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault()
                    saveEdit()
                  }
                }}
              />
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="h-6 gap-1 text-xs"
                  onClick={saveEdit}
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2Icon className="size-3 animate-spin" />
                  ) : (
                    <CheckIcon className="size-3" />
                  )}
                  Save
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </Button>
                <span className="ml-auto text-xs text-muted-foreground">
                  Cmd+Enter to save
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </NodeViewWrapper>
  )
}
