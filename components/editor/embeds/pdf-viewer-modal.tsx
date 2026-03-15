"use client"

import { useAttachmentModal } from "./attachment-modal-context"
import { AttachmentViewerShell } from "./attachment-viewer-shell"

export function PdfViewerModal() {
  const { state, close } = useAttachmentModal()

  if (state.type !== "pdf") return null

  const url = `/api/attachments/${state.attachmentId}`

  return (
    <AttachmentViewerShell
      fileName={state.fileName}
      downloadUrl={url}
      onClose={close}
    >
      <div className="flex-1 overflow-hidden">
        <iframe
          src={url}
          className="size-full border-none"
          title={state.fileName}
        />
      </div>
    </AttachmentViewerShell>
  )
}
