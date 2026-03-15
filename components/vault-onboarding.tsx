"use client"

import * as React from "react"
import { ShieldCheckIcon, PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CreateVaultDialog } from "@/components/create-vault-dialog"

interface VaultOnboardingProps {
  onCreated?: () => void
}

export function VaultOnboarding({ onCreated }: VaultOnboardingProps) {
  const [createOpen, setCreateOpen] = React.useState(false)

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
      <div className="flex size-20 items-center justify-center rounded-2xl bg-primary/10">
        <ShieldCheckIcon className="size-10 text-primary" />
      </div>

      <div className="max-w-sm">
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome to openvlt
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          A vault is a folder on your computer where your notes are stored as
          plain Markdown files. Create your first vault to get started.
        </p>
      </div>

      <CreateVaultDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => {
          onCreated?.()
          window.location.reload()
        }}
        trigger={
          <Button size="lg">
            <PlusIcon className="size-4" />
            Create your first vault
          </Button>
        }
      />
    </div>
  )
}
