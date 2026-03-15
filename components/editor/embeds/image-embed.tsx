"use client"

import * as React from "react"
import { ImageOffIcon } from "lucide-react"
import { useAttachmentModal } from "./attachment-modal-context"
import { resolveWidth } from "./mime-utils"

interface ImageEmbedProps {
  attachmentId: string
  fileName: string
  displaySize: string
}

export function ImageEmbed({
  attachmentId,
  fileName,
  displaySize,
}: ImageEmbedProps) {
  const { openLightbox } = useAttachmentModal()
  const [error, setError] = React.useState(false)

  const { widthPx, heightPx, isFull } = resolveWidth(displaySize)
  const style: React.CSSProperties | undefined =
    widthPx || heightPx
      ? { ...(widthPx ? { width: widthPx } : {}), ...(heightPx ? { height: heightPx, objectFit: "cover" as const } : {}) }
      : undefined

  if (error) {
    return (
      <div
        className={`flex items-center gap-3 rounded-lg border border-dashed bg-muted/30 p-4 ${isFull ? "w-full" : ""}`}
        style={style}
      >
        <ImageOffIcon className="size-5 shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <p className="truncate text-sm text-muted-foreground">{fileName}</p>
          <p className="text-xs text-muted-foreground/60">
            Image could not be loaded
          </p>
        </div>
      </div>
    )
  }

  return (
    <img
      src={`/api/attachments/${attachmentId}`}
      alt={fileName}
      className={`cursor-pointer rounded-lg border ${isFull ? "w-full" : ""}`}
      style={style}
      onClick={(e) => {
        e.stopPropagation()
        openLightbox(attachmentId, fileName)
      }}
      onError={() => setError(true)}
      draggable={false}
    />
  )
}
