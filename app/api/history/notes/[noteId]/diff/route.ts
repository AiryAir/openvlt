import { NextRequest, NextResponse } from "next/server"
import { getVersion } from "@/lib/versions/service"
import { AuthError, requireAuthWithVault } from "@/lib/auth/middleware"
import type { DiffLine } from "@/types"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    await requireAuthWithVault()
    await params

    const { searchParams } = request.nextUrl
    const fromId = searchParams.get("from")
    const toId = searchParams.get("to")

    if (!fromId || !toId) {
      return NextResponse.json(
        { error: "Both 'from' and 'to' version IDs are required" },
        { status: 400 }
      )
    }

    const fromVersion = getVersion(fromId)
    const toVersion = getVersion(toId)

    if (!fromVersion) {
      return NextResponse.json(
        { error: "From version not found" },
        { status: 404 }
      )
    }
    if (!toVersion) {
      return NextResponse.json(
        { error: "To version not found" },
        { status: 404 }
      )
    }

    const diff = computeDiff(fromVersion.content, toVersion.content)
    return NextResponse.json({ diff, from: fromVersion, to: toVersion })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      )
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

function computeDiff(oldContent: string, newContent: string): DiffLine[] {
  const oldLines = oldContent.split("\n")
  const newLines = newContent.split("\n")
  const diff: DiffLine[] = []

  // Simple line-by-line diff using LCS approach
  const lcs = longestCommonSubsequence(oldLines, newLines)
  let oldIdx = 0
  let newIdx = 0
  let lineNumber = 1

  for (const [oldLcsIdx, newLcsIdx] of lcs) {
    // Lines removed (in old but not in LCS match position)
    while (oldIdx < oldLcsIdx) {
      diff.push({ type: "removed", content: oldLines[oldIdx], lineNumber: lineNumber++ })
      oldIdx++
    }
    // Lines added (in new but not in LCS match position)
    while (newIdx < newLcsIdx) {
      diff.push({ type: "added", content: newLines[newIdx], lineNumber: lineNumber++ })
      newIdx++
    }
    // Unchanged line
    diff.push({ type: "unchanged", content: oldLines[oldIdx], lineNumber: lineNumber++ })
    oldIdx++
    newIdx++
  }

  // Remaining removed lines
  while (oldIdx < oldLines.length) {
    diff.push({ type: "removed", content: oldLines[oldIdx], lineNumber: lineNumber++ })
    oldIdx++
  }
  // Remaining added lines
  while (newIdx < newLines.length) {
    diff.push({ type: "added", content: newLines[newIdx], lineNumber: lineNumber++ })
    newIdx++
  }

  return diff
}

function longestCommonSubsequence(
  a: string[],
  b: string[]
): [number, number][] {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  )

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  // Backtrack to find pairs
  const result: [number, number][] = []
  let i = m
  let j = n
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      result.unshift([i - 1, j - 1])
      i--
      j--
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--
    } else {
      j--
    }
  }

  return result
}
