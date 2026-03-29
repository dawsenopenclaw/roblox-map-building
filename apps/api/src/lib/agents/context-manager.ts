/**
 * Context manager — tracks game state, session history, and conversation
 * for the duration of a user's interaction.
 *
 * State is keyed by conversationId and held in-process memory.
 * For multi-instance deployments, back this with Redis (same pattern as
 * lib/redis.ts is already set up for elsewhere in the codebase).
 */

import type { GameContext, SessionEntry } from './types'

// ---------------------------------------------------------------------------
// In-memory store (single process; swap for Redis if horizontally scaled)
// ---------------------------------------------------------------------------

const contextStore = new Map<string, GameContext>()

const MAX_HISTORY_ENTRIES = 50
const SESSION_TTL_MS = 4 * 60 * 60 * 1000 // 4 hours

interface StoredContext {
  ctx: GameContext
  updatedAt: number
}

const timedStore = new Map<string, StoredContext>()

/** Periodically evict stale sessions to prevent memory leaks */
function evictStale(): void {
  const cutoff = Date.now() - SESSION_TTL_MS
  for (const [key, value] of timedStore) {
    if (value.updatedAt < cutoff) {
      timedStore.delete(key)
      contextStore.delete(key)
    }
  }
}

setInterval(evictStale, 30 * 60 * 1000).unref()

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Retrieve existing context or create a fresh one for the conversation.
 */
export function getContext(conversationId: string, userId: string, gameId?: string): GameContext {
  const stored = timedStore.get(conversationId)
  if (stored) {
    stored.updatedAt = Date.now()
    return stored.ctx
  }

  const ctx: GameContext = {
    gameId,
    conversationId,
    userId,
    sessionHistory: [],
    instanceCount: 0,
  }

  timedStore.set(conversationId, { ctx, updatedAt: Date.now() })
  contextStore.set(conversationId, ctx)
  return ctx
}

/**
 * Append a completed action to session history.
 * Keeps the last MAX_HISTORY_ENTRIES entries to avoid unbounded growth.
 */
export function recordAction(
  conversationId: string,
  entry: Omit<SessionEntry, 'timestamp'>
): void {
  const stored = timedStore.get(conversationId)
  if (!stored) return

  stored.ctx.sessionHistory.push({
    ...entry,
    timestamp: new Date().toISOString(),
  })

  if (stored.ctx.sessionHistory.length > MAX_HISTORY_ENTRIES) {
    stored.ctx.sessionHistory.splice(0, stored.ctx.sessionHistory.length - MAX_HISTORY_ENTRIES)
  }

  stored.updatedAt = Date.now()
}

/**
 * Update the game context with partial fields (e.g., after loading a game).
 */
export function updateContext(
  conversationId: string,
  patch: Partial<Omit<GameContext, 'conversationId' | 'userId'>>
): void {
  const stored = timedStore.get(conversationId)
  if (!stored) return

  Object.assign(stored.ctx, patch)
  stored.updatedAt = Date.now()
}

/**
 * Increment the instance counter (used for performance budget tracking).
 */
export function incrementInstanceCount(conversationId: string, delta: number): void {
  const stored = timedStore.get(conversationId)
  if (!stored) return
  stored.ctx.instanceCount = (stored.ctx.instanceCount ?? 0) + delta
  stored.updatedAt = Date.now()
}

/**
 * Get recent session entries for prompt building.
 * Returns the last `n` entries as a compact summary string.
 */
export function getRecentHistorySummary(conversationId: string, n = 5): string {
  const stored = timedStore.get(conversationId)
  if (!stored || stored.ctx.sessionHistory.length === 0) {
    return 'No previous actions this session.'
  }

  const recent = stored.ctx.sessionHistory.slice(-n)
  return recent.map((e) => `[${e.intent}] ${e.description}`).join('\n')
}

/**
 * Clear context for a conversation (e.g., user starts fresh).
 */
export function clearContext(conversationId: string): void {
  timedStore.delete(conversationId)
  contextStore.delete(conversationId)
}

/**
 * Returns the number of active sessions tracked in memory.
 */
export function activeSessionCount(): number {
  return timedStore.size
}
