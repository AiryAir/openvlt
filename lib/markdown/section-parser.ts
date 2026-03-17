/**
 * Extracts sections from markdown content by heading anchor or block ID.
 * Pure module: no I/O, no database access.
 */

function stripFrontmatter(content: string): string {
  const match = content.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/)
  return match ? content.slice(match[0].length) : content
}

function headingToSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
}

function getHeadingLevel(line: string): number | null {
  const match = line.match(/^(#{1,6})\s/)
  return match ? match[1].length : null
}

function getHeadingText(line: string): string {
  return line.replace(/^#{1,6}\s+/, "").trim()
}

/**
 * Determines the contiguous block around a given line index.
 * Handles paragraphs, code blocks, tables, and lists.
 */
function extractContiguousBlock(lines: string[], targetIndex: number): string[] {
  // Check if inside a fenced code block
  let insideCodeBlock = false
  let codeBlockStart = -1
  let codeBlockEnd = -1

  for (let i = 0; i <= Math.max(targetIndex, lines.length - 1); i++) {
    if (lines[i]?.match(/^```/)) {
      if (!insideCodeBlock) {
        insideCodeBlock = true
        codeBlockStart = i
      } else {
        insideCodeBlock = false
        codeBlockEnd = i
        if (targetIndex >= codeBlockStart && targetIndex <= codeBlockEnd) {
          return lines.slice(codeBlockStart, codeBlockEnd + 1)
        }
        codeBlockStart = -1
        codeBlockEnd = -1
      }
    }
    if (i > targetIndex && !insideCodeBlock) break
  }

  // If still inside an unclosed code block containing targetIndex
  if (insideCodeBlock && targetIndex >= codeBlockStart) {
    return lines.slice(codeBlockStart, lines.length)
  }

  // Check if the target line is part of a table
  if (lines[targetIndex].match(/^\|/)) {
    let start = targetIndex
    let end = targetIndex
    while (start > 0 && lines[start - 1].match(/^\|/)) start--
    while (end < lines.length - 1 && lines[end + 1].match(/^\|/)) end++
    return lines.slice(start, end + 1)
  }

  // Check if the target line is part of a list
  if (lines[targetIndex].match(/^(\s*[-*+]|\s*\d+\.)\s/)) {
    let start = targetIndex
    let end = targetIndex
    const isListLine = (line: string) =>
      line.match(/^(\s*[-*+]|\s*\d+\.)\s/) || line.match(/^\s+\S/)
    while (start > 0 && isListLine(lines[start - 1])) start--
    while (end < lines.length - 1 && isListLine(lines[end + 1])) end++
    return lines.slice(start, end + 1)
  }

  // Default: contiguous non-empty paragraph
  let start = targetIndex
  let end = targetIndex
  while (start > 0 && lines[start - 1].trim() !== "") start--
  while (end < lines.length - 1 && lines[end + 1].trim() !== "") end++
  return lines.slice(start, end + 1)
}

export function extractSection(
  content: string,
  anchor: string,
): { markdown: string; found: boolean } {
  const body = stripFrontmatter(content)
  const lines = body.split(/\r?\n/)

  // Block ID reference
  if (anchor.startsWith("^")) {
    const blockId = anchor.slice(1)
    const pattern = new RegExp(`\\s\\^${escapeRegExp(blockId)}$`)
    const targetIndex = lines.findIndex((line) => pattern.test(line))

    if (targetIndex === -1) {
      return { markdown: "", found: false }
    }

    const block = extractContiguousBlock(lines, targetIndex)
    const cleaned = block
      .map((line) => line.replace(new RegExp(`\\s\\^${escapeRegExp(blockId)}$`), ""))
      .join("\n")

    return { markdown: cleaned, found: true }
  }

  // Heading anchor reference
  const targetSlug = anchor
  let headingIndex = -1
  let headingLevel = 0

  for (let i = 0; i < lines.length; i++) {
    const level = getHeadingLevel(lines[i])
    if (level !== null) {
      const text = getHeadingText(lines[i])
      const slug = headingToSlug(text)
      if (slug === targetSlug) {
        headingIndex = i
        headingLevel = level
        break
      }
    }
  }

  if (headingIndex === -1) {
    return { markdown: "", found: false }
  }

  // Collect from heading until next heading of same or higher level
  let endIndex = lines.length
  for (let i = headingIndex + 1; i < lines.length; i++) {
    const level = getHeadingLevel(lines[i])
    if (level !== null && level <= headingLevel) {
      endIndex = i
      break
    }
  }

  const markdown = lines.slice(headingIndex, endIndex).join("\n").trimEnd()
  return { markdown, found: true }
}

export function listAnchors(
  content: string,
): { type: "heading" | "block-id"; anchor: string; label: string; level?: number }[] {
  const body = stripFrontmatter(content)
  const lines = body.split(/\r?\n/)
  const results: {
    type: "heading" | "block-id"
    anchor: string
    label: string
    level?: number
  }[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Check for heading
    const headingLevel = getHeadingLevel(line)
    if (headingLevel !== null) {
      const text = getHeadingText(line)
      results.push({
        type: "heading",
        anchor: headingToSlug(text),
        label: text,
        level: headingLevel,
      })
    }

    // Check for block ID
    const blockMatch = line.match(/\s\^([a-zA-Z0-9-]+)$/)
    if (blockMatch) {
      const blockId = blockMatch[1]
      const cleanLine = line.replace(/\s\^[a-zA-Z0-9-]+$/, "").trim()
      const label = cleanLine.length > 50 ? cleanLine.slice(0, 50) + "..." : cleanLine
      results.push({
        type: "block-id",
        anchor: `^${blockId}`,
        label,
      })
    }
  }

  return results
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
