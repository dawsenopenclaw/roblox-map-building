export type DiffLineType = 'added' | 'removed' | 'unchanged'

export interface DiffLine {
  type: DiffLineType
  content: string
}

/**
 * Simple line-by-line diff using the longest-common-subsequence patience
 * approach — good enough for Luau code blocks, zero dependencies.
 */
export function computeLineDiff(oldCode: string, newCode: string): DiffLine[] {
  const oldLines = oldCode.split('\n')
  const newLines = newCode.split('\n')
  const m = oldLines.length
  const n = newLines.length

  // Build LCS table
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (oldLines[i] === newLines[j]) {
        dp[i][j] = dp[i + 1][j + 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1])
      }
    }
  }

  // Walk the table to produce diff lines
  const result: DiffLine[] = []
  let i = 0
  let j = 0
  while (i < m || j < n) {
    if (i < m && j < n && oldLines[i] === newLines[j]) {
      result.push({ type: 'unchanged', content: oldLines[i] })
      i++
      j++
    } else if (j < n && (i >= m || dp[i][j + 1] >= dp[i + 1][j])) {
      result.push({ type: 'added', content: newLines[j] })
      j++
    } else {
      result.push({ type: 'removed', content: oldLines[i] })
      i++
    }
  }

  return result
}

/** Returns true only if there is at least one added or removed line. */
export function hasDiff(lines: DiffLine[]): boolean {
  return lines.some((l) => l.type !== 'unchanged')
}
