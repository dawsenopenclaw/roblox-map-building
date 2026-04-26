/**
 * fix-cache.ts
 *
 * Redis-based cache for error fixes. When the AI pipeline fixes a Luau error,
 * the fix is cached so identical errors skip the AI call next time.
 *
 * Uses the same Redis instance as the rest of the app via getRedis().
 * Gracefully degrades to no-ops when Redis is unavailable.
 */

import 'server-only'
import { getRedis } from '@/lib/redis'

const FIX_PREFIX = 'fix:'
const FIX_TTL_SECONDS = 7 * 24 * 60 * 60 // 7 days

// ── Signature Generation ───────────────────────────────────────────────────

/**
 * Normalize error message into a stable hash key.
 * - Replace line numbers with N
 * - Replace quoted strings with "..."
 * - Collapse whitespace
 * - Lowercase
 * - Truncate to 200 chars
 */
export function errorSignature(error: string): string {
  const normalized = error
    // Replace line numbers (e.g., :42:, line 42, Line 123)
    .replace(/(?::)\d+(?=:|\b)/g, ':N')
    .replace(/\b[Ll]ine\s+\d+/g, 'line N')
    // Replace quoted strings
    .replace(/"[^"]*"/g, '"..."')
    .replace(/'[^']*'/g, "'...'")
    // Collapse whitespace
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()

  return normalized.slice(0, 200)
}

// ── Cache Operations ───────────────────────────────────────────────────────

/**
 * Check Redis for a cached fix matching this error.
 * Returns the cached fix code or null.
 */
export async function getCachedFix(error: string): Promise<string | null> {
  const r = getRedis()
  if (!r) return null

  try {
    const key = `${FIX_PREFIX}${errorSignature(error)}`
    const cached = await r.get(key)
    return cached
  } catch {
    return null
  }
}

/**
 * Store a fix in Redis with 7-day TTL.
 */
export async function cacheFix(error: string, fix: string): Promise<void> {
  const r = getRedis()
  if (!r) return

  try {
    const key = `${FIX_PREFIX}${errorSignature(error)}`
    await r.set(key, fix, 'EX', FIX_TTL_SECONDS)
  } catch {
    // Redis write failed — skip caching silently
  }
}

/**
 * Count fix:* keys in Redis for monitoring.
 */
export async function getCacheStats(): Promise<{ totalFixes: number }> {
  const r = getRedis()
  if (!r) return { totalFixes: 0 }

  try {
    let cursor = '0'
    let count = 0

    // Use SCAN to count keys without blocking
    do {
      const [nextCursor, keys] = await r.scan(cursor, 'MATCH', `${FIX_PREFIX}*`, 'COUNT', 100)
      cursor = nextCursor
      count += keys.length
    } while (cursor !== '0')

    return { totalFixes: count }
  } catch {
    return { totalFixes: 0 }
  }
}
