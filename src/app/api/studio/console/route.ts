/**
 * /api/studio/console
 *
 * POST — Store console log entries from the Studio plugin into Redis.
 *        Body: { sessionId, logs: Array<{message, type, timestamp}> }
 *
 * GET  — Retrieve buffered console logs for a session.
 *        Query: ?sessionId=<id>&limit=50
 *
 * Logs are stored in a Redis list with a 10-minute TTL so they don't
 * accumulate forever. The AI chat route can pull these to understand
 * what errors are happening in the user's game.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getRedis } from '@/lib/redis'
import { getSession } from '@/lib/studio-session'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Session-Id',
}

const REDIS_KEY_PREFIX = 'fj:studio:console:'
const REDIS_TTL = 600 // 10 minutes
const MAX_STORED_LOGS = 100

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

interface ConsoleEntry {
  message: string
  type: string
  timestamp: number
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      sessionId?: string
      logs?: ConsoleEntry[]
    }

    const sessionId = body.sessionId || req.headers.get('x-session-id')
    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400, headers: CORS_HEADERS },
      )
    }

    const logs = body.logs
    if (!Array.isArray(logs) || logs.length === 0) {
      return NextResponse.json(
        { error: 'logs array is required and must not be empty' },
        { status: 400, headers: CORS_HEADERS },
      )
    }

    // Verify session exists
    const session = await getSession(sessionId)
    if (!session) {
      return NextResponse.json(
        { error: 'session_not_found' },
        { status: 404, headers: CORS_HEADERS },
      )
    }

    const redis = getRedis()
    if (!redis) {
      // Fall through — no Redis available, just acknowledge
      return NextResponse.json(
        { stored: false, reason: 'redis_unavailable' },
        { status: 200, headers: CORS_HEADERS },
      )
    }

    const key = REDIS_KEY_PREFIX + sessionId

    // Push each log entry as a JSON string
    const pipeline = redis.pipeline()
    for (const entry of logs.slice(-MAX_STORED_LOGS)) {
      pipeline.rpush(key, JSON.stringify({
        message: String(entry.message ?? '').slice(0, 500),
        type: String(entry.type ?? 'unknown'),
        timestamp: entry.timestamp ?? Math.floor(Date.now() / 1000),
      }))
    }
    // Trim to max size and refresh TTL
    pipeline.ltrim(key, -MAX_STORED_LOGS, -1)
    pipeline.expire(key, REDIS_TTL)
    await pipeline.exec()

    return NextResponse.json(
      { stored: true, count: Math.min(logs.length, MAX_STORED_LOGS) },
      { status: 200, headers: CORS_HEADERS },
    )
  } catch (err) {
    console.error('[studio/console] POST error:', err)
    return NextResponse.json(
      { error: 'internal_error' },
      { status: 500, headers: CORS_HEADERS },
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get('sessionId')
    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId query param is required' },
        { status: 400, headers: CORS_HEADERS },
      )
    }

    const limit = Math.min(
      parseInt(req.nextUrl.searchParams.get('limit') ?? '50', 10) || 50,
      MAX_STORED_LOGS,
    )

    const redis = getRedis()
    if (!redis) {
      return NextResponse.json(
        { logs: [], reason: 'redis_unavailable' },
        { status: 200, headers: CORS_HEADERS },
      )
    }

    const key = REDIS_KEY_PREFIX + sessionId
    const raw = await redis.lrange(key, -limit, -1)

    const logs: ConsoleEntry[] = raw.map((entry) => {
      try {
        return JSON.parse(entry) as ConsoleEntry
      } catch {
        return { message: entry, type: 'unknown', timestamp: 0 }
      }
    })

    return NextResponse.json(
      { logs, count: logs.length },
      { status: 200, headers: CORS_HEADERS },
    )
  } catch (err) {
    console.error('[studio/console] GET error:', err)
    return NextResponse.json(
      { error: 'internal_error' },
      { status: 500, headers: CORS_HEADERS },
    )
  }
}
