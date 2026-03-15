"use client"

import * as React from "react"
import { LockIcon, UnlockIcon, EyeIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

interface LockDialogProps {
  open: boolean
  onClose: () => void
  noteId: string
  isLocked: boolean
  onLockChange: (locked: boolean) => void
}

export function LockDialog({
  open,
  onClose,
  noteId,
  isLocked,
  onLockChange,
}: LockDialogProps) {
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState("")
  const [loading, setLoading] = React.useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!password) return

    setError("")
    setLoading(true)

    try {
      const res = await fetch(`/api/notes/${noteId}/lock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: isLocked ? "unlock" : "lock",
          password,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        onLockChange(data.locked)
        setPassword("")
        onClose()
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || "Operation failed")
      }
    } catch {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isLocked ? (
              <>
                <UnlockIcon className="size-4" /> Unlock Note
              </>
            ) : (
              <>
                <LockIcon className="size-4" /> Lock Note
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isLocked
              ? "Enter the password to permanently unlock this note."
              : "Set a password to encrypt this note with AES-256-GCM. The note content will be encrypted on disk."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isLocked ? "Enter password" : "Set a lock password"}
              className="h-9 w-full rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              autoFocus
            />
            {error && (
              <p className="mt-1 text-xs text-destructive">{error}</p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={!password || loading}>
              {loading
                ? "..."
                : isLocked
                  ? "Unlock"
                  : "Lock Note"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/** Prompt shown when opening a locked note — just for viewing */
interface LockPromptProps {
  noteId: string
  onDecrypted: (content: string) => void
}

export function LockPrompt({ noteId, onDecrypted }: LockPromptProps) {
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState("")
  const [loading, setLoading] = React.useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!password) return

    setError("")
    setLoading(true)

    try {
      const res = await fetch(`/api/notes/${noteId}/lock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "decrypt", password }),
      })

      if (res.ok) {
        const data = await res.json()
        onDecrypted(data.content)
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || "Decryption failed")
      }
    } catch {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
        <LockIcon className="size-8 text-muted-foreground" />
      </div>
      <div className="text-center">
        <h2 className="text-lg font-medium">This note is locked</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter the password to view its contents
        </p>
      </div>
      <form onSubmit={handleSubmit} className="flex w-64 flex-col gap-2">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
          className="h-9 w-full rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          autoFocus
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        <Button type="submit" size="sm" disabled={!password || loading}>
          {loading ? "Decrypting..." : "Unlock"}
        </Button>
      </form>
    </div>
  )
}
