"use client"

import * as React from "react"

interface ModalState {
  type: "lightbox" | "pdf" | "docx" | null
  attachmentId: string
  fileName: string
}

interface AttachmentModalContextValue {
  state: ModalState
  openLightbox: (attachmentId: string, fileName: string) => void
  openPdfViewer: (attachmentId: string, fileName: string) => void
  openDocxViewer: (attachmentId: string, fileName: string) => void
  close: () => void
}

const initial: ModalState = { type: null, attachmentId: "", fileName: "" }

const AttachmentModalContext =
  React.createContext<AttachmentModalContextValue | null>(null)

export function AttachmentModalProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [state, setState] = React.useState<ModalState>(initial)

  const value = React.useMemo<AttachmentModalContextValue>(
    () => ({
      state,
      openLightbox: (attachmentId, fileName) =>
        setState({ type: "lightbox", attachmentId, fileName }),
      openPdfViewer: (attachmentId, fileName) =>
        setState({ type: "pdf", attachmentId, fileName }),
      openDocxViewer: (attachmentId, fileName) =>
        setState({ type: "docx", attachmentId, fileName }),
      close: () => setState(initial),
    }),
    [state]
  )

  return (
    <AttachmentModalContext.Provider value={value}>
      {children}
    </AttachmentModalContext.Provider>
  )
}

export function useAttachmentModal() {
  const ctx = React.useContext(AttachmentModalContext)
  if (!ctx)
    throw new Error(
      "useAttachmentModal must be used within AttachmentModalProvider"
    )
  return ctx
}
