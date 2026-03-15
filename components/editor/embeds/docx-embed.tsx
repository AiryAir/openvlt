"use client"

import { FileTextIcon } from "lucide-react"
import { formatFileSize, resolveWidth } from "./mime-utils"
import { useAttachmentModal } from "./attachment-modal-context"
import { DocxPreview } from "./docx-preview"

const PREVIEW_MIN_WIDTH = 300

interface DocxEmbedProps {
  attachmentId: string
  fileName: string
  sizeBytes: number
  displaySize: string
}

export function DocxEmbed({
  attachmentId,
  fileName,
  sizeBytes,
  displaySize,
}: DocxEmbedProps) {
  const { openDocxViewer } = useAttachmentModal()
  const { widthPx, heightPx, isFull } = resolveWidth(displaySize)
  const style: React.CSSProperties | undefined =
    widthPx || heightPx
      ? { ...(widthPx ? { width: widthPx } : {}), ...(heightPx ? { height: heightPx } : {}) }
      : undefined

  const effectiveWidth = isFull ? 800 : (widthPx ?? 0)
  const showPreview = effectiveWidth >= PREVIEW_MIN_WIDTH

  function handleOpen(e: React.MouseEvent) {
    e.stopPropagation()
    openDocxViewer(attachmentId, fileName)
  }

  if (showPreview) {
    return (
      <div
        className={`overflow-hidden rounded-lg border bg-card ${isFull ? "w-full" : ""}`}
        style={style}
        onDoubleClick={handleOpen}
      >
        <div className="max-h-[480px] overflow-y-auto">
          <DocxPreview url={`/api/attachments/${attachmentId}`} />
        </div>
        <div className="flex items-center gap-2 border-t px-3 py-2">
          <FileTextIcon className="size-4 shrink-0 text-blue-500" />
          <p className="min-w-0 truncate text-sm font-medium">{fileName}</p>
          <p className="ml-auto shrink-0 text-sm text-muted-foreground">
            {formatFileSize(sizeBytes)}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      onDoubleClick={handleOpen}
      className={`flex items-center gap-3 rounded-lg border bg-card p-3 text-left transition-colors hover:bg-accent/50 ${isFull ? "w-full" : "max-w-sm"}`}
      style={style}
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-blue-500/10 text-blue-500">
        <FileTextIcon className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{fileName}</p>
        <p className="text-sm text-muted-foreground">
          DOCX &middot; {formatFileSize(sizeBytes)}
        </p>
      </div>
    </div>
  )
}
