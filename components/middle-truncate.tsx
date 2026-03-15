"use client"

import * as React from "react"

interface MiddleTruncateProps {
  text: string
  className?: string
}

/**
 * Truncates text in the middle, preserving the start and the file extension.
 * Uses two spans: one for the start (truncated with ellipsis) and one for the
 * end (the extension or last few chars), which is pinned to the right.
 *
 * Inspired by macOS Finder's file name truncation.
 */
export function MiddleTruncate({ text, className }: MiddleTruncateProps) {
  // Split into name and extension
  const lastDot = text.lastIndexOf(".")
  const hasExtension = lastDot > 0 && lastDot < text.length - 1

  // Keep the extension + a few chars before it for context
  const endLength = hasExtension ? text.length - lastDot + 2 : 4
  const end = text.slice(-Math.min(endLength, text.length))
  const start = text.slice(0, text.length - end.length)

  if (!start) {
    // Text is short enough that splitting doesn't make sense
    return <span className={className}>{text}</span>
  }

  return (
    <span className={`flex min-w-0 ${className ?? ""}`} title={text}>
      <span className="truncate">{start}</span>
      <span className="shrink-0">{end}</span>
    </span>
  )
}
