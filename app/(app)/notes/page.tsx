"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { FileTextIcon, FilePlusIcon } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { VaultOnboarding } from "@/components/vault-onboarding"
import { useModifierKey } from "@/hooks/use-platform"
import type { Vault } from "@/types"

export default function NotesPage() {
  const router = useRouter()
  const mod = useModifierKey()
  const [vaults, setVaults] = React.useState<Vault[] | null>(null)

  React.useEffect(() => {
    fetch("/api/vaults")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setVaults(data))
      .catch(() => setVaults([]))
  }, [])

  const hasActiveVault = vaults?.some((v) => v.isActive)

  if (vaults === null) {
    return (
      <div className="flex h-svh min-w-0 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <span className="text-sm font-medium">Notes</span>
        </header>
        <div className="flex flex-1 items-center justify-center">
          <div className="size-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        </div>
      </div>
    )
  }

  if (!hasActiveVault) {
    return (
      <div className="flex h-svh min-w-0 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <span className="text-sm font-medium">Notes</span>
        </header>
        <VaultOnboarding onCreated={() => router.refresh()} />
      </div>
    )
  }

  return (
    <div className="flex h-svh min-w-0 flex-col overflow-hidden">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <span className="text-sm font-medium">Notes</span>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
          <FileTextIcon className="size-8 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-lg font-medium">No note selected</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Select a note from the sidebar or create a new one
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-xs">
              {mod}
            </kbd>
            <span>+</span>
            <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-xs">
              O
            </kbd>
            <span>new note</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-xs">
              {mod}
            </kbd>
            <span>+</span>
            <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-xs">
              K
            </kbd>
            <span>command palette</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-xs">
              {mod}
            </kbd>
            <span>+</span>
            <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-xs">
              B
            </kbd>
            <span>toggle sidebar</span>
          </div>
        </div>
      </div>
    </div>
  )
}
