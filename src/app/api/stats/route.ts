/**
 * Public stats endpoint — returns non-sensitive aggregate counts
 * for the landing page social proof counter.
 *
 * Cached for 60 seconds (in-memory) to avoid DB load from marketing traffic.
 * Also returns activeNow count from Redis studio sessions.
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getRedis } from '@/lib/redis'

interface StatsCache {
  data: { totalUsers: number; totalBuilds: number; activeNow: number }
  ts: number
}

let cache: StatsCache | null = null
const CACHE_TTL = 60 * 1000 // 60 seconds — fresher data for live counter

const SESSION_KEY_PREFIX = 'fj:studio:session:'
const SESSION_TTL_MS = 5 * 60 * 1000 // 5 min — matches studio-session.ts

/** Count active studio sessions by scanning Redis keys */
async function countActiveSessions(): Promise<number> {
  try {
    const redis = getRedis()
    if (!redis) return 0
    let cursor = 0
    let active = 0
    const now = Date.now()

    // SCAN for all studio session keys
    do {
      const [nextCursor, keys] = await redis.scan(cursor, {
        match: `${SESSION_KEY_PREFIX}*`,
        count: 100,
      })
      cursor = typeof nextCursor === 'string' ? parseInt(nextCursor, 10) : nextCursor

      if (keys.length > 0) {
        // Fetch all session objects in one pipeline
        const pipeline = redis.pipeline()
        for (const key of keys) {
          pipeline.get(key)
        }
        const results = await pipeline.exec()

        for (const result of results) {
          if (result && typeof result === 'object') {
            const session = result as Record<string, unknown>
            const lastHeartbeat = typeof session.lastHeartbeat === 'number'
              ? session.lastHeartbeat
              : 0
            if (now - lastHeartbeat <= SESSION_TTL_MS && session.connected) {
              active++
            }
          }
        }
      }
    } while (cursor !== 0)

    return active
  } catch {
    return 0
  }
}

export async function GET() {
  // Return cached data if fresh
  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    return NextResponse.json(cache.data, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
    })
  }

  try {
    const [totalUsers, totalBuilds, activeNow] = await Promise.all([
      db.user.count().catch(() => 0),
      // ChatMessage tracks actual AI generations — Build table isn't populated
      db.chatMessage.count().catch(() => db.build.count().catch(() => 0)),
      countActiveSessions(),
    ])

    const data = { totalUsers, totalBuilds, activeNow }
    cache = { data, ts: Date.now() }

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
    })
  } catch {
    return NextResponse.json({ totalUsers: 0, totalBuilds: 0, activeNow: 0 })
  }
}
