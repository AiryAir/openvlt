"use client"

import * as React from "react"

interface DocxPreviewProps {
  url: string
}

export const DocxPreview = React.memo(function DocxPreview({
  url,
}: DocxPreviewProps) {
  const [html, setHtml] = React.useState("")
  const [error, setError] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false
    setError(false)
    setHtml("")

    async function render() {
      try {
        const [res, mammoth] = await Promise.all([
          fetch(url, { credentials: "same-origin" }),
          import("mammoth"),
        ])
        if (cancelled) return

        if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`)
        const arrayBuffer = await res.arrayBuffer()
        if (cancelled) return

        const result = await mammoth.convertToHtml({ arrayBuffer })
        if (!cancelled) setHtml(result.value)
      } catch {
        if (!cancelled) setError(true)
      }
    }

    render()
    return () => {
      cancelled = true
    }
  }, [url])

  if (error) {
    return (
      <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
        Failed to render document
      </div>
    )
  }

  if (!html) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="size-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
      </div>
    )
  }

  return (
    <div
      className="prose prose-stone prose-sm dark:prose-invert p-4"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
})
