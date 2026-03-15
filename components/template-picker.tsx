"use client"

import * as React from "react"
import { FileTextIcon } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useTabStore } from "@/lib/stores/tab-store"

interface Template {
  id: string
  name: string
  content: string
}

interface TemplatePickerProps {
  open: boolean
  onClose: () => void
  parentId?: string | null
}

export function TemplatePicker({ open, onClose, parentId }: TemplatePickerProps) {
  const { openTab } = useTabStore()
  const [templates, setTemplates] = React.useState<Template[]>([])

  React.useEffect(() => {
    if (open) {
      fetch("/api/templates")
        .then((r) => (r.ok ? r.json() : []))
        .then(setTemplates)
        .catch(() => {})
    }
  }, [open])

  async function handleSelect(template: Template) {
    // Replace variables
    const now = new Date()
    const content = template.content
      .replace(/\{\{date\}\}/g, now.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }))
      .replace(/\{\{time\}\}/g, now.toLocaleTimeString())

    const title = template.name === "Daily Journal"
      ? now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : template.name

    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, parentId, content }),
      })
      if (res.ok) {
        const note = await res.json()
        openTab(note.id, note.title)
        window.dispatchEvent(new Event("openvlt:tree-refresh"))
        onClose()
      }
    } catch {}
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New from Template</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2">
          {templates.map((t) => (
            <button
              key={t.id}
              onClick={() => handleSelect(t)}
              className="flex items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent"
            >
              <FileTextIcon className="size-5 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{t.name}</p>
                <p className="text-sm text-muted-foreground">
                  {t.content.slice(0, 60).replace(/[#\n]/g, " ").trim()}...
                </p>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
