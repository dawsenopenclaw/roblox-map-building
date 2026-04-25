/**
 * Error Learning Service — Logs script errors and their fixes to build
 * institutional knowledge. Before fixing an error, queries past successful
 * fixes for similar errors to include in the AI prompt.
 *
 * This creates a LEARNING LOOP — every error makes the system smarter.
 * No competitor has this.
 */

import 'server-only'
import { db as prisma } from '@/lib/db'

interface ErrorLogEntry {
  sessionId?: string | null
  userId?: string | null
  errorMessage: string
  errorType: 'syntax' | 'runtime' | 'timeout' | 'hallucination'
  originalCode: string
  fixedCode?: string | null
  fixAttempt?: number
  fixSucceeded?: boolean
  model?: string | null
  prompt?: string | null
}

/**
 * Log a script error (and optionally its fix) to the database.
 */
export async function logScriptError(entry: ErrorLogEntry): Promise<string | null> {
  try {
    const record = await prisma.scriptErrorLog.create({
      data: {
        sessionId: entry.sessionId ?? null,
        userId: entry.userId ?? null,
        errorMessage: entry.errorMessage,
        errorType: entry.errorType,
        originalCode: entry.originalCode,
        fixedCode: entry.fixedCode ?? null,
        fixAttempt: entry.fixAttempt ?? 1,
        fixSucceeded: entry.fixSucceeded ?? false,
        model: entry.model ?? null,
        prompt: entry.prompt ?? null,
      },
    })
    return record.id
  } catch (err) {
    console.error('[ErrorLearning] Failed to log error:', err)
    return null
  }
}

/**
 * Mark an error log as successfully fixed.
 */
export async function markErrorFixed(logId: string, fixedCode: string): Promise<void> {
  try {
    await prisma.scriptErrorLog.update({
      where: { id: logId },
      data: { fixedCode, fixSucceeded: true },
    })
  } catch (err) {
    console.error('[ErrorLearning] Failed to mark fixed:', err)
  }
}

/**
 * Find past SUCCESSFUL fixes for similar errors.
 * Uses error type + keyword matching to find relevant fixes.
 * Returns up to `limit` recent fixes.
 */
export async function findSimilarFixes(
  errorMessage: string,
  errorType: string,
  limit: number = 3,
): Promise<Array<{ errorMessage: string; fixedCode: string }>> {
  try {
    // Extract key error tokens (class names, method names, etc.)
    const tokens = errorMessage
      .replace(/[^a-zA-Z0-9_.:]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 3)
      .slice(0, 5)

    if (tokens.length === 0) return []

    // Query recent successful fixes of the same type
    const fixes = await prisma.scriptErrorLog.findMany({
      where: {
        fixSucceeded: true,
        errorType,
        fixedCode: { not: null },
        // Match at least one error keyword
        OR: tokens.map(t => ({
          errorMessage: { contains: t, mode: 'insensitive' as const },
        })),
      },
      select: {
        errorMessage: true,
        fixedCode: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return fixes.filter((f): f is { errorMessage: string; fixedCode: string } => f.fixedCode !== null)
  } catch (err) {
    console.error('[ErrorLearning] Failed to query fixes:', err)
    return []
  }
}

/**
 * Build a context block from past fixes to inject into AI error-recovery prompts.
 */
export async function buildFixContext(errorMessage: string, errorType: string): Promise<string> {
  const fixes = await findSimilarFixes(errorMessage, errorType)
  if (fixes.length === 0) return ''

  const examples = fixes.map((f, i) =>
    `Example Fix ${i + 1}:\nError: ${f.errorMessage.slice(0, 200)}\nFixed code:\n${f.fixedCode.slice(0, 500)}`
  ).join('\n\n')

  return `\n\n--- PAST SUCCESSFUL FIXES FOR SIMILAR ERRORS ---\nWe've fixed similar errors before. Use these patterns:\n\n${examples}\n\n--- END PAST FIXES ---\n`
}

/**
 * Get error stats for admin dashboard.
 */
export async function getErrorStats(): Promise<{
  total: number
  fixed: number
  fixRate: number
  topErrors: Array<{ errorType: string; count: number }>
}> {
  try {
    const [total, fixed, topErrors] = await Promise.all([
      prisma.scriptErrorLog.count(),
      prisma.scriptErrorLog.count({ where: { fixSucceeded: true } }),
      prisma.scriptErrorLog.groupBy({
        by: ['errorType'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
    ])

    return {
      total,
      fixed,
      fixRate: total > 0 ? Math.round((fixed / total) * 100) : 0,
      topErrors: topErrors.map(e => ({
        errorType: e.errorType,
        count: e._count.id,
      })),
    }
  } catch {
    return { total: 0, fixed: 0, fixRate: 0, topErrors: [] }
  }
}
