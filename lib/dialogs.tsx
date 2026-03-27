"use client"

import * as React from "react"
import { createRoot } from "react-dom/client"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

// ---------------------------------------------------------------------------
// confirmDialog — imperative replacement for window.confirm()
// Usage: if (await confirmDialog("Delete this?")) { ... }
// ---------------------------------------------------------------------------

interface ConfirmOptions {
  title?: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
}

export function confirmDialog(
  descriptionOrOpts: string | ConfirmOptions
): Promise<boolean> {
  const opts: ConfirmOptions =
    typeof descriptionOrOpts === "string"
      ? { description: descriptionOrOpts }
      : descriptionOrOpts

  return new Promise((resolve) => {
    const container = document.createElement("div")
    document.body.appendChild(container)
    const root = createRoot(container)

    let resolved = false
    let pendingValue: boolean | null = null

    function finish() {
      if (pendingValue === null) return
      if (resolved) return
      resolved = true
      resolve(pendingValue)
      root.unmount()
      container.remove()
      // Radix DismissableLayer sets body pointer-events to "none" on mount
      // and restores on unmount — but force-unmounting skips the cleanup
      document.body.style.pointerEvents = ""
    }

    function ConfirmImpl() {
      const [open, setOpen] = React.useState(true)
      // When open transitions to false, wait for the exit animation then clean up
      React.useEffect(() => {
        if (!open && pendingValue !== null) {
          const timer = setTimeout(finish, 300)
          return () => clearTimeout(timer)
        }
      }, [open])

      function settle(value: boolean) {
        if (pendingValue !== null) return
        pendingValue = value
        setOpen(false)
      }

      return (
        <AlertDialog
          open={open}
          onOpenChange={(v) => {
            if (!v) settle(false)
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {opts.title || "Are you sure?"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {opts.description}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => settle(false)}>
                {opts.cancelLabel || "Cancel"}
              </AlertDialogCancel>
              <AlertDialogAction
                variant={opts.destructive ? "destructive" : "default"}
                onClick={() => settle(true)}
              >
                {opts.confirmLabel || "Continue"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )
    }

    root.render(<ConfirmImpl />)
  })
}

// ---------------------------------------------------------------------------
// promptDialog — imperative replacement for window.prompt()
// Usage: const name = await promptDialog("Enter name:", "default")
// ---------------------------------------------------------------------------

interface PromptOptions {
  title?: string
  description?: string
  defaultValue?: string
  placeholder?: string
  confirmLabel?: string
  cancelLabel?: string
  type?: string
  /** Fixed suffix shown after the input (e.g. ".md"). Not included in the returned value. */
  suffix?: string
  /** Return an error string to show below the input, or null/undefined if valid. */
  validate?: (value: string) => string | null | undefined
}

export function promptDialog(
  descriptionOrOpts: string | PromptOptions,
  defaultValue?: string
): Promise<string | null> {
  const opts: PromptOptions =
    typeof descriptionOrOpts === "string"
      ? { description: descriptionOrOpts, defaultValue }
      : descriptionOrOpts

  return new Promise((resolve) => {
    const container = document.createElement("div")
    document.body.appendChild(container)
    const root = createRoot(container)

    let resolved = false
    let pendingValue: string | null | undefined = undefined

    function finish() {
      if (pendingValue === undefined) return
      if (resolved) return
      resolved = true
      resolve(pendingValue)
      root.unmount()
      container.remove()
      document.body.style.pointerEvents = ""
    }

    function PromptImpl() {
      const [open, setOpen] = React.useState(true)
      const [value, setValue] = React.useState(opts.defaultValue || "")
      const inputRef = React.useRef<HTMLInputElement>(null)

      const validationError = opts.validate ? opts.validate(value) : null

      React.useEffect(() => {
        // Focus and select on open
        requestAnimationFrame(() => inputRef.current?.select())
      }, [])

      React.useEffect(() => {
        if (!open && pendingValue !== undefined) {
          const timer = setTimeout(finish, 300)
          return () => clearTimeout(timer)
        }
      }, [open])

      function settle(v: string | null) {
        if (pendingValue !== undefined) return
        pendingValue = v
        setOpen(false)
      }

      function handleSubmit() {
        if (validationError) return
        settle(value)
      }

      function handleCancel() {
        settle(null)
      }

      return (
        <Dialog
          open={open}
          onOpenChange={(v) => {
            if (!v) handleCancel()
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{opts.title || "Input"}</DialogTitle>
              {opts.description && (
                <DialogDescription>{opts.description}</DialogDescription>
              )}
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSubmit()
              }}
            >
              {opts.suffix ? (
                <div
                  className={`flex items-center rounded-lg border border-input bg-transparent focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30 ${validationError ? "mb-1" : "mb-4"}`}
                >
                  <input
                    ref={inputRef}
                    type={opts.type || "text"}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={opts.placeholder}
                    className="h-8 min-w-0 flex-1 rounded-lg bg-transparent px-2.5 py-1 text-base outline-none placeholder:text-muted-foreground md:text-sm"
                    autoFocus
                  />
                  <span className="pointer-events-none select-none pr-2.5 text-muted-foreground md:text-sm">
                    {opts.suffix}
                  </span>
                </div>
              ) : (
                <Input
                  ref={inputRef}
                  type={opts.type || "text"}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={opts.placeholder}
                  className={validationError ? "mb-1" : "mb-4"}
                  autoFocus
                />
              )}
              {validationError && (
                <p className="mb-3 text-sm text-destructive">{validationError}</p>
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  {opts.cancelLabel || "Cancel"}
                </Button>
                <Button type="submit" disabled={!!validationError}>
                  {opts.confirmLabel || "OK"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )
    }

    root.render(<PromptImpl />)
  })
}
