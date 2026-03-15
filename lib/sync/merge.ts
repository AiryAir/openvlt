import { diffArrays } from "diff"
import type { ConflictRegion } from "@/types"

interface MergeResult {
  success: boolean
  content: string
  conflicts: ConflictRegion[]
}

/**
 * Three-way merge for text content.
 *
 * Given the common ancestor and two divergent versions ("ours" from the client,
 * "theirs" from the server), produces a merged result.
 *
 * - If only one side changed a region, that change is accepted.
 * - If both sides changed the same region identically, deduplicate.
 * - If both sides changed the same region differently, mark as conflict.
 */
export function threeWayMerge(
  ancestor: string,
  theirs: string,
  ours: string
): MergeResult {
  // If either side is identical to ancestor, take the other
  if (ours === ancestor) return { success: true, content: theirs, conflicts: [] }
  if (theirs === ancestor) return { success: true, content: ours, conflicts: [] }
  if (ours === theirs) return { success: true, content: ours, conflicts: [] }

  const ancestorLines = ancestor.split("\n")
  const theirLines = theirs.split("\n")
  const ourLines = ours.split("\n")

  // Compute diffs from ancestor to each side
  const theirDiff = diffArrays(ancestorLines, theirLines)
  const ourDiff = diffArrays(ancestorLines, ourLines)

  // Build change maps: for each ancestor line range, what changed
  const theirChanges = buildChangeMap(theirDiff)
  const ourChanges = buildChangeMap(ourDiff)

  const merged: string[] = []
  const conflicts: ConflictRegion[] = []
  let ancestorIdx = 0

  // Merge by walking through the ancestor line by line
  const allChangePoints = new Set<number>()
  for (const c of theirChanges) allChangePoints.add(c.start)
  for (const c of ourChanges) allChangePoints.add(c.start)

  // Sort change starts
  const sortedPoints = [...allChangePoints].sort((a, b) => a - b)

  // Simple approach: process non-overlapping regions
  let ai = 0 // current position in ancestor

  while (ai < ancestorLines.length) {
    const theirChange = theirChanges.find(
      (c) => c.start <= ai && c.start + c.count > ai
    )
    const ourChange = ourChanges.find(
      (c) => c.start <= ai && c.start + c.count > ai
    )

    if (!theirChange && !ourChange) {
      // No changes — keep ancestor line
      merged.push(ancestorLines[ai])
      ai++
    } else if (theirChange && !ourChange) {
      // Only theirs changed this region
      merged.push(...theirChange.replacement)
      ai = theirChange.start + theirChange.count
    } else if (!theirChange && ourChange) {
      // Only ours changed this region
      merged.push(...ourChange.replacement)
      ai = ourChange.start + ourChange.count
    } else if (theirChange && ourChange) {
      // Both changed — check if identical
      const theirText = theirChange.replacement.join("\n")
      const ourText = ourChange.replacement.join("\n")

      if (theirText === ourText) {
        // Same change on both sides
        merged.push(...theirChange.replacement)
      } else {
        // Real conflict
        conflicts.push({
          startLine: merged.length,
          endLine: merged.length,
          ours: ourText,
          theirs: theirText,
        })
        // Take theirs by default, client will resolve
        merged.push(...theirChange.replacement)
      }

      // Advance past the larger region
      const end = Math.max(
        theirChange.start + theirChange.count,
        ourChange.start + ourChange.count
      )
      ai = end
    }
  }

  // Handle additions at the end (lines added beyond ancestor)
  // The diffArrays approach handles this in the change map, but
  // let's also check for trailing additions
  const theirTrailing = theirChanges.find((c) => c.start >= ancestorLines.length)
  const ourTrailing = ourChanges.find((c) => c.start >= ancestorLines.length)

  if (theirTrailing) merged.push(...theirTrailing.replacement)
  if (ourTrailing && !theirTrailing) merged.push(...ourTrailing.replacement)

  return {
    success: conflicts.length === 0,
    content: merged.join("\n"),
    conflicts,
  }
}

interface Change {
  start: number // ancestor line index
  count: number // number of ancestor lines removed
  replacement: string[] // lines that replace them
}

function buildChangeMap(
  diff: ReturnType<typeof diffArrays<string>>
): Change[] {
  const changes: Change[] = []
  let ancestorIdx = 0

  let i = 0
  while (i < diff.length) {
    const part = diff[i]

    if (!part.added && !part.removed) {
      // Unchanged
      ancestorIdx += part.count!
      i++
    } else {
      // Collect the full change (removed + added pair)
      let removed = 0
      const added: string[] = []

      const start = ancestorIdx

      if (part.removed) {
        removed = part.count!
        ancestorIdx += removed
        i++
        // Check if next part is the corresponding addition
        if (i < diff.length && diff[i].added) {
          added.push(...(diff[i].value as unknown as string[]))
          i++
        }
      } else if (part.added) {
        added.push(...(part.value as unknown as string[]))
        i++
      }

      changes.push({ start, count: removed, replacement: added })
    }
  }

  return changes
}
