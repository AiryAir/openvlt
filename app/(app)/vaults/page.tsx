"use client"

import * as React from "react"
import { ShieldCheckIcon, PlusIcon, TrashIcon, FolderIcon } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CreateVaultDialog } from "@/components/create-vault-dialog"
import type { Vault } from "@/types"

export default function VaultsPage() {
  const [vaults, setVaults] = React.useState<Vault[]>([])
  const [deleteTarget, setDeleteTarget] = React.useState<Vault | null>(null)
  const [deleting, setDeleting] = React.useState(false)

  const fetchVaults = React.useCallback(async () => {
    try {
      const res = await fetch("/api/vaults")
      if (res.ok) {
        const data = await res.json()
        setVaults(data)
      }
    } catch {
      // silently fail
    }
  }, [])

  React.useEffect(() => {
    fetchVaults()
  }, [fetchVaults])

  async function handleDelete(vault: Vault) {
    setDeleting(true)
    try {
      const res = await fetch(`/api/vaults/${vault.id}`, { method: "DELETE" })
      if (res.ok) {
        setDeleteTarget(null)
        fetchVaults()
      }
    } catch {
      // silently fail
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex h-svh flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <ShieldCheckIcon className="size-4" />
        <span className="text-sm font-medium">Vaults</span>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold">Your Vaults</h1>
              <p className="text-sm text-muted-foreground">
                Manage the folders where your notes are stored.
              </p>
            </div>
            <CreateVaultDialog
              onCreated={fetchVaults}
              trigger={
                <Button>
                  <PlusIcon className="size-4" />
                  Create Vault
                </Button>
              }
            />
          </div>

          <Separator className="my-4" />

          {vaults.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
                <ShieldCheckIcon className="size-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                No vaults yet. Create one to get started.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {vaults.map((vault) => (
                <div
                  key={vault.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
                    <ShieldCheckIcon className="size-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {vault.name}
                      </span>
                      {vault.isActive && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                      <FolderIcon className="size-3" />
                      <span className="truncate">{vault.path}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setDeleteTarget(vault)}
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                  >
                    <TrashIcon className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Vault</DialogTitle>
            <DialogDescription>
              This only removes &ldquo;{deleteTarget?.name}&rdquo; from openvlt.
              Your files stay on disk and are not deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
              disabled={deleting}
            >
              Remove Vault
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
