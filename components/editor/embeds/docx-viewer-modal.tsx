"use client"

import * as React from "react"
import { LoaderIcon } from "lucide-react"
import { useAttachmentModal } from "./attachment-modal-context"
import { AttachmentViewerShell } from "./attachment-viewer-shell"

export function DocxViewerModal() {
  const { state, close } = useAttachmentModal()
  const [html, setHtml] = React.useState<string>("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (state.type !== "docx") return

    let cancelled = false
    setLoading(true)
    setError(null)
    setHtml("")

    async function convert() {
      try {
        const res = await fetch(`/api/attachments/${state.attachmentId}`)
        if (!res.ok) throw new Error("Failed to fetch file")
        const arrayBuffer = await res.arrayBuffer()

        const mammoth = await import("mammoth")
        const result = await mammoth.convertToHtml({ arrayBuffer })

        if (!cancelled) {
          setHtml(result.value)
        }
      } catch {
        if (!cancelled) {
          setError("Failed to render document")
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    convert()
    return () => {
      cancelled = true
    }
  }, [state])

  if (state.type !== "docx") return null

  const url = `/api/attachments/${state.attachmentId}`

  return (
    <AttachmentViewerShell
      fileName={state.fileName}
      downloadUrl={url}
      onClose={close}
    >
      <div className="flex-1 overflow-auto bg-background p-8">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <LoaderIcon className="size-5 animate-spin text-muted-foreground" />
          </div>
        )}
        {error && (
          <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
            {error}
          </div>
        )}
        {!loading && !error && html && (
          <div
            className="prose prose-stone dark:prose-invert mx-auto max-w-3xl"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )}
      </div>
    </AttachmentViewerShell>
  )
}
