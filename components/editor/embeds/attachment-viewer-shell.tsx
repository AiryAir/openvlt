"use client"

import { DownloadIcon, XIcon } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface AttachmentViewerShellProps {
  fileName: string
  downloadUrl: string
  onClose: () => void
  children: React.ReactNode
}

export function AttachmentViewerShell({
  fileName,
  downloadUrl,
  onClose,
  children,
}: AttachmentViewerShellProps) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[90vh] max-w-5xl flex-col gap-0 p-0 sm:max-w-5xl"
      >
        <DialogHeader className="flex flex-row items-center border-b px-4 py-3">
          <DialogTitle className="min-w-0 flex-1 truncate text-sm font-medium">
            {fileName}
          </DialogTitle>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => window.open(downloadUrl, "_blank")}
              title="Download"
            >
              <DownloadIcon />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              title="Close"
            >
              <XIcon />
            </Button>
          </div>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}
