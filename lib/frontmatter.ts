import matter from "gray-matter"

/**
 * Parse frontmatter from markdown file content.
 * Returns the frontmatter data and the content without frontmatter.
 */
export function parseFrontmatter(raw: string): {
  data: Record<string, unknown>
  content: string
} {
  try {
    const parsed = matter(raw)
    return { data: parsed.data, content: parsed.content }
  } catch {
    return { data: {}, content: raw }
  }
}

/**
 * Update a single frontmatter field in a markdown file's raw content.
 * If the field value is null/undefined, removes it from frontmatter.
 * If no frontmatter exists, creates one.
 */
export function setFrontmatterField(
  raw: string,
  key: string,
  value: unknown
): string {
  const { data, content } = parseFrontmatter(raw)

  if (value === null || value === undefined) {
    delete data[key]
  } else {
    data[key] = value
  }

  // If no frontmatter fields remain, return plain content
  if (Object.keys(data).length === 0) {
    return content.startsWith("\n") ? content.slice(1) : content
  }

  return matter.stringify(content, data)
}

/**
 * Set multiple frontmatter fields at once.
 */
export function setFrontmatterFields(
  raw: string,
  fields: Record<string, unknown>
): string {
  const { data, content } = parseFrontmatter(raw)

  for (const [key, value] of Object.entries(fields)) {
    if (value === null || value === undefined) {
      delete data[key]
    } else {
      data[key] = value
    }
  }

  if (Object.keys(data).length === 0) {
    return content.startsWith("\n") ? content.slice(1) : content
  }

  return matter.stringify(content, data)
}
