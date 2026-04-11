/**
 * Cloud session persistence via Upstash Redis (REST).
 *
 * Stores AI chat sessions per-user with a 30-day TTL and a sorted-set index
 * for fast listing by recency. All operations are non-blocking and
 * fail-gracefully — callers should handle null returns.
 *
 * Required env vars:
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 */

import { Redis } from '@upstash/redis'

// ---------------------------------------------------------------------------
// Redis client
// ---------------------------------------------------------------------------

const upstashConfigured = !!(
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
)

const redis = upstashConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CloudSession {
  id: string
  userId: string
  title: string
  messages: Array<{ role: string; content: string; timestamp: string }>
  aiMode: string
  createdAt: string
  updatedAt: string
}

export interface SessionSummary {
  id: string
  title: string
  updatedAt: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Sessions expire after 30 days of inactivity. */
const SESSION_TTL = 60 * 60 * 24 * 30 // 30 days in seconds

/** Maximum sessions stored per user in the index. */
const MAX_SESSIONS_PER_USER = 200

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sessionKey(userId: string, sessionId: string): string {
  return `session:${userId}:${sessionId}`
}

function indexKey(userId: string): string {
  return `sessions:${userId}`
}

// ---------------------------------------------------------------------------
// CRUD operations
// ---------------------------------------------------------------------------

/**
 * Save (create or update) a cloud session.
 * Also updates the user's sorted-set index, scored by timestamp for recency ordering.
 */
export async function saveSession(session: CloudSession): Promise<void> {
  if (!redis) {
    console.warn('[cloud-sessions] Redis not configured — session not persisted')
    return
  }

  const key = sessionKey(session.userId, session.id)
  const idxKey = indexKey(session.userId)

  await Promise.all([
    redis.set(key, JSON.stringify(session), { ex: SESSION_TTL }),
    redis.zadd(idxKey, { score: Date.now(), member: session.id }),
  ])

  // Trim index to prevent unbounded growth
  const count = await redis.zcard(idxKey)
  if (count > MAX_SESSIONS_PER_USER) {
    // Remove oldest entries beyond the cap
    await redis.zremrangebyrank(idxKey, 0, count - MAX_SESSIONS_PER_USER - 1)
  }
}

/**
 * Load a single session by ID.
 * Returns null if not found or expired.
 */
export async function loadSession(
  userId: string,
  sessionId: string,
): Promise<CloudSession | null> {
  if (!redis) return null

  const data = await redis.get<string>(sessionKey(userId, sessionId))
  if (!data) return null

  try {
    return typeof data === 'string' ? JSON.parse(data) : (data as unknown as CloudSession)
  } catch {
    return null
  }
}

/**
 * List sessions for a user, most recent first.
 * Returns lightweight summaries (id, title, updatedAt) — call loadSession for full data.
 */
export async function listSessions(
  userId: string,
  limit = 50,
): Promise<SessionSummary[]> {
  if (!redis) return []

  // Fetch session IDs from sorted set, newest first
  const sessionIds = await redis.zrange<string[]>(indexKey(userId), 0, limit - 1, {
    rev: true,
  })

  if (!sessionIds || sessionIds.length === 0) return []

  // Batch-fetch session data via pipeline
  const pipeline = redis.pipeline()
  for (const id of sessionIds) {
    pipeline.get(sessionKey(userId, id))
  }
  const results = await pipeline.exec<(string | null)[]>()

  const sessions: SessionSummary[] = []
  const expiredIds: string[] = []

  for (let i = 0; i < sessionIds.length; i++) {
    const raw = results[i]
    if (!raw) {
      // Session expired from Redis but index entry remains — mark for cleanup
      expiredIds.push(sessionIds[i])
      continue
    }

    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
      sessions.push({
        id: parsed.id,
        title: parsed.title,
        updatedAt: parsed.updatedAt,
      })
    } catch {
      expiredIds.push(sessionIds[i])
    }
  }

  // Async cleanup of stale index entries (fire and forget)
  if (expiredIds.length > 0) {
    redis.zrem(indexKey(userId), ...expiredIds).catch(() => {})
  }

  return sessions
}

/**
 * Delete a session and remove it from the user's index.
 */
export async function deleteSession(
  userId: string,
  sessionId: string,
): Promise<void> {
  if (!redis) return

  await Promise.all([
    redis.del(sessionKey(userId, sessionId)),
    redis.zrem(indexKey(userId), sessionId),
  ])
}
