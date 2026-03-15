"use client"

import { useAttachmentModal } from "./attachment-modal-context"
import { AttachmentViewerShell } from "./attachment-viewer-shell"

export function LightboxModal() {
  const { state, close } = useAttachmentModal()

  if (state.type !== "lightbox") return null

  const url = `/api/attachments/${state.attachmentId}`

  return (
    <AttachmentViewerShell
      fileName={state.fileName}
      downloadUrl={url}
      onClose={close}
    >
      <div className="flex flex-1 items-center justify-center overflow-hidden bg-black/95 p-4">
        <img
          src={url}
          alt={state.fileName}
          className="max-h-full max-w-full object-contain"
        />
      </div>
    </AttachmentViewerShell>
  )
}
