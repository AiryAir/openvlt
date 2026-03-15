"use client"

import * as React from "react"
import type { Editor } from "@tiptap/react"

interface WordCountBarProps {
  editor: Editor | null
}

function countStats(text: string) {
  const trimmed = text.trim()
  if (!trimmed) return { characters: 0, words: 0, readingTime: "0 min" }

  const characters = trimmed.length
  const words = trimmed.split(/\s+/).filter(Boolean).length
  const minutes = Math.max(1, Math.ceil(words / 200))
  const readingTime = `${minutes} min read`

  return { characters, words, readingTime }
}

export function WordCountBar({ editor }: WordCountBarProps) {
  const [stats, setStats] = React.useState({
    characters: 0,
    words: 0,
    readingTime: "0 min",
  })

  React.useEffect(() => {
    if (!editor) return

    function update() {
      if (!editor) return
      const text = editor.state.doc.textContent
      setStats(countStats(text))
    }

    update()
    editor.on("update", update)
    return () => {
      editor.off("update", update)
    }
  }, [editor])

  if (!editor) return null

  return (
    <div className="flex h-6 shrink-0 items-center gap-4 border-t bg-muted/30 px-4 text-sm text-muted-foreground">
      <span>{stats.words.toLocaleString()} words</span>
      <span>{stats.characters.toLocaleString()} characters</span>
      <span>{stats.readingTime}</span>
    </div>
  )
}
