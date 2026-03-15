"use client"

import { getFileIcon, getFileLabel, formatFileSize, resolveWidth } from "./mime-utils"

interface FileEmbedProps {
  attachmentId: string
  fileName: string
  mimeType: string
  sizeBytes: number
  displaySize: string
}

export function FileEmbed({
  attachmentId,
  fileName,
  mimeType,
  sizeBytes,
  displaySize,
}: FileEmbedProps) {
  const Icon = getFileIcon(mimeType)
  const label = getFileLabel(mimeType)
  const { widthPx, isFull } = resolveWidth(displaySize)
  const style: React.CSSProperties | undefined = widthPx ? { width: widthPx } : undefined

  return (
    <div
      onDoubleClick={() => window.open(`/api/attachments/${attachmentId}`, "_blank")}
      className={`flex items-center gap-3 rounded-lg border bg-card p-3 text-left transition-colors hover:bg-accent/50 ${isFull ? "w-full" : "max-w-sm"}`}
      style={style}
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted">
        <Icon className="size-5 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{fileName}</p>
        <p className="text-sm text-muted-foreground">
          {label} &middot; {formatFileSize(sizeBytes)}
        </p>
      </div>
    </div>
  )
}
