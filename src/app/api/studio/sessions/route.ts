/**
 * GET /api/studio/sessions
 *
 * Returns all currently live Studio sessions for the authenticated user.
 * Reads from both in-memory store and Redis to handle cross-Lambda visibility
 * on Vercel serverless.
 *
 * Response:
 * {
 *   sessions: Array<{
 *     sessionId:    string
 *     placeName:    string
 *     placeId:      string
 *     connected:    boolean
 *     pluginVersion: string
 *     lastHeartbeat: number   // Unix ms
 *     queueDepth:   number
 *   }>
 * }
 */

import { NextResponse } from 'next/server'
import { listSessions, SESSION_TTL_MS } from '@/lib/studio-session'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

/** Try to scan Redis for sessions not in this Lambda's memory. */
async function getRedisSessionsSafe(): Promise<
  Array<{
    sessionId: string
    placeId: string
    placeName: string
    connected: boolean
    lastHeartbeat: number
    pluginVersion: string
    queueDepth: number
  }>
> {
  try {
    // Dynamic require to avoid build-time crashes
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@/lib/redis') as { getRedis?: () => import('ioredis').Redis | null }
    const r = mod.getRedis ? mod.getRedis() : null
    if (!r) return []

    // Scan for session keys
    const keys: string[] = []
    let cursor = '0'
    do {
      const [nextCursor, batch] = await r.scan(cursor, 'MATCH', 'fj:studio:session:*', 'COUNT', 50)
      cursor = nextCursor
      keys.push(...batch)
    } while (cursor !== '0')

    if (keys.length === 0) return []

    const pipeline = r.pipeline()
    for (const key of keys) {
      pipeline.get(key)
    }
    const results = await pipeline.exec()
    if (!results) return []

    const now = Date.now()
    const sessions: Array<{
      sessionId: string
      placeId: string
      placeName: string
      connected: boolean
      lastHeartbeat: number
      pluginVersion: string
      queueDepth: number
    }> = []

    for (const [err, val] of results) {
      if (err || !val) continue
      try {
        const obj = JSON.parse(val as string) as {
          sessionId: string
          placeId: string
          placeName: string
          lastHeartbeat: number
          pluginVersion: string
          commandQueue?: unknown[]
        }
        sessions.push({
          sessionId: obj.sessionId,
          placeId: obj.placeId,
          placeName: obj.placeName,
          connected: now - obj.lastHeartbeat < SESSION_TTL_MS,
          lastHeartbeat: obj.lastHeartbeat,
          pluginVersion: obj.pluginVersion,
          queueDepth: Array.isArray(obj.commandQueue) ? obj.commandQueue.length : 0,
        })
      } catch {
        // skip malformed entries
      }
    }

    return sessions
  } catch {
    return []
  }
}

export async function GET() {
  // Memory-based sessions (this Lambda instance)
  const memorySessions = listSessions()
  const memoryIds = new Set(memorySessions.map((s) => s.sessionId))

  // Redis-based sessions (cross-Lambda)
  const redisSessions = await getRedisSessionsSafe()

  // Merge: memory wins when a session exists in both (memory has fresher state)
  const merged = [...memorySessions]
  for (const rs of redisSessions) {
    if (!memoryIds.has(rs.sessionId)) {
      merged.push(rs)
    }
  }

  // Sort by most recent heartbeat first
  merged.sort((a, b) => b.lastHeartbeat - a.lastHeartbeat)

  return NextResponse.json(
    { sessions: merged },
    { status: 200, headers: CORS_HEADERS },
  )
}
