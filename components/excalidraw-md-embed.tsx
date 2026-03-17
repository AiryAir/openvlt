"use client"

import * as React from "react"
import { FileTextIcon, AlertCircleIcon, ExternalLinkIcon } from "lucide-react"
import { useTabStore } from "@/lib/stores/tab-store"

const embedStyles = `
  .embed-content {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 13px;
    line-height: 1.6;
    color: var(--foreground, #1a1a1a);
  }
  .embed-content p {
    margin: 0.4em 0;
  }
  .embed-content h1, .embed-content h2, .embed-content h3,
  .embed-content h4, .embed-content h5, .embed-content h6 {
    margin: 0.8em 0 0.3em;
    font-weight: 600;
    line-height: 1.3;
  }
  .embed-content h1 { font-size: 1.4em; }
  .embed-content h2 { font-size: 1.2em; }
  .embed-content h3 { font-size: 1.1em; }
  .embed-content h4, .embed-content h5, .embed-content h6 { font-size: 1em; }
  .embed-content strong { font-weight: 600; }
  .embed-content em { font-style: italic; }
  .embed-content a {
    color: var(--primary, #2563eb);
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  .embed-content code {
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
    font-size: 0.9em;
    padding: 0.15em 0.35em;
    border-radius: 4px;
    background: var(--muted, rgba(0,0,0,0.06));
  }
  .embed-content pre {
    margin: 0.5em 0;
    padding: 0.75em 1em;
    border-radius: 6px;
    background: var(--muted, rgba(0,0,0,0.06));
    overflow-x: auto;
    font-size: 0.9em;
    line-height: 1.5;
  }
  .embed-content pre code {
    padding: 0;
    background: none;
  }
  .embed-content table {
    width: 100%;
    border-collapse: collapse;
    margin: 0.5em 0;
    font-size: 0.95em;
  }
  .embed-content table td,
  .embed-content table th {
    border: 1px solid var(--border, rgba(0,0,0,0.1));
    padding: 0.4em 0.6em;
    text-align: left;
  }
  .embed-content table tr:first-child td {
    font-weight: 600;
    background: var(--muted, rgba(0,0,0,0.03));
  }
  .embed-content ul, .embed-content ol {
    margin: 0.4em 0;
    padding-left: 1.5em;
  }
  .embed-content li {
    margin: 0.15em 0;
  }
  .embed-content blockquote {
    margin: 0.5em 0;
    padding: 0.3em 0.8em;
    border-left: 3px solid var(--border, rgba(0,0,0,0.15));
    color: var(--muted-foreground, #666);
  }
  .embed-content hr {
    border: none;
    border-top: 1px solid var(--border, rgba(0,0,0,0.1));
    margin: 0.8em 0;
  }
`

interface ExcalidrawMdEmbedProps {
  noteId: string
  anchor: string
  noteTitle?: string
}

export function ExcalidrawMdEmbed({
  noteId,
  anchor,
  noteTitle,
}: ExcalidrawMdEmbedProps) {
  const [html, setHtml] = React.useState<string | null>(null)
  const [found, setFound] = React.useState(true)
  const [loading, setLoading] = React.useState(true)
  const [title, setTitle] = React.useState(noteTitle ?? "")
  const { openTab } = useTabStore()

  const fetchSection = React.useCallback(async () => {
    try {
      const res = await fetch(
        `/api/notes/${noteId}/section?anchor=${encodeURIComponent(anchor)}`,
      )
      if (!res.ok) {
        setFound(false)
        setLoading(false)
        return
      }
      const data = await res.json()
      setFound(data.found)
      setTitle(data.noteTitle ?? noteTitle ?? "")
      if (data.found && data.markdown) {
        // Convert markdown to simple HTML
        setHtml(markdownToHtml(data.markdown))
      }
    } catch {
      setFound(false)
    } finally {
      setLoading(false)
    }
  }, [noteId, anchor, noteTitle])

  // Initial fetch
  React.useEffect(() => {
    fetchSection()
  }, [fetchSection])

  // Re-fetch on window focus and on interval
  React.useEffect(() => {
    const onFocus = () => fetchSection()
    window.addEventListener("focus", onFocus)
    const interval = setInterval(fetchSection, 10000)
    return () => {
      window.removeEventListener("focus", onFocus)
      clearInterval(interval)
    }
  }, [fetchSection])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-background/80 p-4">
        <div className="size-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
      </div>
    )
  }

  if (!found) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 bg-background/80 p-4 text-center">
        <AlertCircleIcon className="size-5 text-muted-foreground/50" />
        <p className="text-xs text-muted-foreground">
          Section not found
        </p>
        <p className="text-xs text-muted-foreground/50">
          {anchor.startsWith("^") ? `Block ${anchor}` : `#${anchor}`} in{" "}
          {title || "unknown note"}
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background/95">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-1.5 border-b border-border/40 px-3 py-1.5">
        <FileTextIcon className="size-3 text-muted-foreground/50" />
        <span className="flex-1 truncate text-xs text-muted-foreground/70">
          {title}
          <span className="text-muted-foreground/40">
            {" "}
            {anchor.startsWith("^") ? anchor : `#${anchor}`}
          </span>
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation()
            openTab(noteId, title)
          }}
          className="rounded p-0.5 text-muted-foreground/40 transition-colors hover:text-foreground"
          title="Open source note"
        >
          <ExternalLinkIcon className="size-3" />
        </button>
      </div>
      {/* Content */}
      <div className="flex-1 overflow-auto px-4 py-3">
        <style>{embedStyles}</style>
        <div
          className="embed-content"
          dangerouslySetInnerHTML={{ __html: html ?? "" }}
        />
      </div>
    </div>
  )
}

/**
 * Lightweight markdown-to-HTML converter for embed previews.
 * Handles: headings, bold, italic, code, links, tables, lists, blockquotes, hr.
 * Not a full parser — just enough for readable section previews.
 */
function markdownToHtml(md: string): string {
  const lines = md.split("\n")
  const output: string[] = []
  let inTable = false
  let inCodeBlock = false
  let inList: "ul" | "ol" | null = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Code fences
    if (line.trimStart().startsWith("```")) {
      if (inCodeBlock) {
        output.push("</code></pre>")
        inCodeBlock = false
      } else {
        closeList()
        inCodeBlock = true
        output.push('<pre class="embed-code"><code>')
      }
      continue
    }
    if (inCodeBlock) {
      output.push(escapeHtml(line))
      continue
    }

    const trimmed = line.trim()

    // Empty line
    if (!trimmed) {
      closeList()
      closeTable()
      output.push("")
      continue
    }

    // Headings
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/)
    if (headingMatch) {
      closeList()
      closeTable()
      const level = headingMatch[1].length
      output.push(
        `<h${level} class="embed-h">${inline(headingMatch[2])}</h${level}>`,
      )
      continue
    }

    // HR
    if (/^[-*_]{3,}$/.test(trimmed)) {
      closeList()
      closeTable()
      output.push("<hr/>")
      continue
    }

    // Table rows
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      closeList()
      // Skip separator rows
      if (/^\|[\s:|-]+\|$/.test(trimmed)) continue
      if (!inTable) {
        inTable = true
        output.push('<table class="embed-table">')
      }
      const cells = trimmed
        .slice(1, -1)
        .split("|")
        .map((c) => c.trim())
      output.push(
        "<tr>" + cells.map((c) => `<td>${inline(c)}</td>`).join("") + "</tr>",
      )
      continue
    }

    // Unordered list
    const ulMatch = trimmed.match(/^[-*+]\s+(.+)$/)
    if (ulMatch) {
      closeTable()
      if (inList !== "ul") {
        closeList()
        inList = "ul"
        output.push("<ul>")
      }
      output.push(`<li>${inline(ulMatch[1])}</li>`)
      continue
    }

    // Ordered list
    const olMatch = trimmed.match(/^\d+[.)]\s+(.+)$/)
    if (olMatch) {
      closeTable()
      if (inList !== "ol") {
        closeList()
        inList = "ol"
        output.push("<ol>")
      }
      output.push(`<li>${inline(olMatch[1])}</li>`)
      continue
    }

    // Blockquote
    if (trimmed.startsWith("> ")) {
      closeList()
      closeTable()
      output.push(
        `<blockquote class="embed-bq">${inline(trimmed.slice(2))}</blockquote>`,
      )
      continue
    }

    // Paragraph
    closeList()
    closeTable()
    output.push(`<p>${inline(trimmed)}</p>`)
  }

  closeList()
  closeTable()
  if (inCodeBlock) output.push("</code></pre>")

  return output.join("\n")

  function closeList() {
    if (inList) {
      output.push(inList === "ul" ? "</ul>" : "</ol>")
      inList = null
    }
  }
  function closeTable() {
    if (inTable) {
      output.push("</table>")
      inTable = false
    }
  }
}

function inline(text: string): string {
  let s = escapeHtml(text)
  // Bold
  s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
  s = s.replace(/__(.+?)__/g, "<strong>$1</strong>")
  // Italic
  s = s.replace(/\*(.+?)\*/g, "<em>$1</em>")
  s = s.replace(/_(.+?)_/g, "<em>$1</em>")
  // Inline code
  s = s.replace(/`(.+?)`/g, '<code class="embed-ic">$1</code>')
  // Links
  s = s.replace(
    /\[(.+?)\]\((.+?)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
  )
  return s
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
