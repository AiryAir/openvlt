"use client"

import * as React from "react"
import {
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  ScissorsIcon,
  Trash2Icon,
} from "lucide-react"
import { Input } from "@/components/ui/input"

const SIZE_PRESETS = [
  { value: "xs", label: "Extra small (150px)", shortLabel: "XS" },
  { value: "small", label: "Small (240px)", shortLabel: "S" },
  { value: "medium", label: "Medium (400px)", shortLabel: "M" },
  { value: "large", label: "Large (640px)", shortLabel: "L" },
  { value: "full", label: "Full width", shortLabel: "F" },
]

interface AttachmentToolbarProps {
  attachmentId: string
  displaySize: string
  onResize: (size: string) => void
  onDelete: () => void
  onCut: () => void
  onCopy: () => void
}

function parseCustomSize(displaySize: string): { w: string; h: string } {
  if (displaySize.includes("x")) {
    const [wStr, hStr] = displaySize.split("x")
    return { w: wStr || "", h: hStr || "" }
  }
  const px = parseInt(displaySize, 10)
  return { w: px > 0 ? String(px) : "", h: "" }
}

export function AttachmentToolbar({
  attachmentId,
  displaySize,
  onResize,
  onDelete,
  onCut,
  onCopy,
}: AttachmentToolbarProps) {
  const [customW, setCustomW] = React.useState("")
  const [customH, setCustomH] = React.useState("")
  const [showCustom, setShowCustom] = React.useState(false)
  const wInputRef = React.useRef<HTMLInputElement>(null)
  const formRef = React.useRef<HTMLDivElement>(null)

  function handleDownload(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    window.open(`/api/attachments/${attachmentId}`, "_blank")
  }

  function handleDelete(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    onDelete()
  }

  function handleCustomSubmit() {
    const w = parseInt(customW, 10)
    const h = parseInt(customH, 10)
    const hasW = w > 0
    const hasH = h > 0
    if (!hasW && !hasH) return
    const size = hasW && hasH ? `${w}x${h}` : hasW ? `${w}x` : `x${h}`
    onResize(size)
    setShowCustom(false)
    setCustomW("")
    setCustomH("")
  }

  const isCustom = !SIZE_PRESETS.some((p) => p.value === displaySize)

  return (
    <div
      className="absolute top-0 left-[calc(100%+0.5rem)] z-10 flex flex-col gap-0.5 rounded-lg border bg-popover p-1 shadow-md opacity-0 transition-opacity group-hover/embed:opacity-100"
      onMouseDown={(e) => {
        // Allow default behavior on inputs so they're clickable/focusable
        const target = e.target as HTMLElement
        if (target.tagName === "INPUT") return
        e.preventDefault()
      }}
    >
      {/* Row 1: Actions */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onCut()
          }}
          className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          title="Cut"
        >
          <ScissorsIcon className="size-4" />
        </button>
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onCopy()
          }}
          className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          title="Copy"
        >
          <CopyIcon className="size-4" />
        </button>
        <button
          onClick={handleDownload}
          className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          title="Download"
        >
          <DownloadIcon className="size-4" />
        </button>
        <button
          onClick={handleDelete}
          className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          title="Delete"
        >
          <Trash2Icon className="size-4" />
        </button>
      </div>

      {/* Row 2: Size presets + custom */}
      <div className="flex items-center gap-0.5">
        {SIZE_PRESETS.map((opt) => (
          <button
            key={opt.value}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onResize(opt.value)
              setShowCustom(false)
            }}
            className={`rounded px-1.5 py-1 text-xs font-medium whitespace-nowrap hover:bg-accent hover:text-foreground ${displaySize === opt.value ? "bg-accent text-foreground" : "text-muted-foreground"}`}
            title={opt.label}
          >
            {opt.shortLabel}
          </button>
        ))}

        <div className="mx-0.5 h-4 w-px bg-border" />

        {showCustom ? (
          <div ref={formRef} className="flex items-center gap-1.5">
            <label className="flex items-center gap-1">
              <span className="text-xs font-medium text-muted-foreground">
                W
              </span>
              <Input
                ref={wInputRef}
                type="number"
                min={50}
                max={2000}
                placeholder="auto"
                value={customW}
                onChange={(e) => setCustomW(e.target.value)}
                onKeyDown={(e) => {
                  e.stopPropagation()
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleCustomSubmit()
                  } else if (e.key === "Escape") {
                    setShowCustom(false)
                    setCustomW("")
                    setCustomH("")
                  }
                }}
                onBlur={(e) => {
                  if (
                    !customW &&
                    !customH &&
                    !formRef.current?.contains(e.relatedTarget)
                  ) {
                    setShowCustom(false)
                  }
                }}
                className="h-6 w-16 px-1.5 text-center text-xs [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </label>
            <label className="flex items-center gap-1">
              <span className="text-xs font-medium text-muted-foreground">
                H
              </span>
              <Input
                type="number"
                min={50}
                max={2000}
                placeholder="auto"
                value={customH}
                onChange={(e) => setCustomH(e.target.value)}
                onKeyDown={(e) => {
                  e.stopPropagation()
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleCustomSubmit()
                  } else if (e.key === "Escape") {
                    setShowCustom(false)
                    setCustomW("")
                    setCustomH("")
                  }
                }}
                onBlur={(e) => {
                  if (
                    !customW &&
                    !customH &&
                    !formRef.current?.contains(e.relatedTarget)
                  ) {
                    setShowCustom(false)
                  }
                }}
                className="h-6 w-16 px-1.5 text-center text-xs [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </label>
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleCustomSubmit()
              }}
              className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
              title="Apply custom size"
            >
              <CheckIcon className="size-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setShowCustom(true)
              if (isCustom) {
                const parsed = parseCustomSize(displaySize)
                setCustomW(parsed.w)
                setCustomH(parsed.h)
              }
              setTimeout(() => wInputRef.current?.focus(), 0)
            }}
            className={`rounded px-1.5 py-1 text-xs font-medium whitespace-nowrap hover:bg-accent hover:text-foreground ${isCustom ? "bg-accent text-foreground" : "text-muted-foreground"}`}
            title="Custom size (px)"
          >
            {isCustom
              ? (() => {
                  const parsed = parseCustomSize(displaySize)
                  const parts = []
                  if (parsed.w) parts.push(`W${parsed.w}`)
                  if (parsed.h) parts.push(`H${parsed.h}`)
                  return parts.join(" ")
                })()
              : "px"}
          </button>
        )}
      </div>
    </div>
  )
}
