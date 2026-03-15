"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangleIcon } from "lucide-react"

interface ConflictDialogProps {
  open: boolean
  onResolve: (choice: "mine" | "theirs") => void
  myContent: string
  serverContent: string
}

export function ConflictDialog({
  open,
  onResolve,
  myContent,
  serverContent,
}: ConflictDialogProps) {
  const myPreview = myContent.slice(0, 500)
  const serverPreview = serverContent.slice(0, 500)

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-3xl" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangleIcon className="size-5 text-yellow-500" />
            Conflict Detected
          </DialogTitle>
          <DialogDescription>
            This note was modified on another device. Choose which version to
            keep.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Your Version</h3>
            <pre className="max-h-60 overflow-auto rounded-lg border bg-muted p-3 text-xs">
              {myPreview}
              {myContent.length > 500 && "..."}
            </pre>
            <Button
              onClick={() => onResolve("mine")}
              className="w-full"
            >
              Keep My Version
            </Button>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Server Version</h3>
            <pre className="max-h-60 overflow-auto rounded-lg border bg-muted p-3 text-xs">
              {serverPreview}
              {serverContent.length > 500 && "..."}
            </pre>
            <Button
              variant="outline"
              onClick={() => onResolve("theirs")}
              className="w-full"
            >
              Keep Server Version
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
