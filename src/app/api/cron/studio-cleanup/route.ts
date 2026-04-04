/**
 * GET /api/cron/studio-cleanup
 *
 * Vercel cron job — runs every 10 minutes (see vercel.json).
 *
 * Scans Redis for stale Studio session keys (no heartbeat in > 30 min) and
 * deletes them along with their associated command queues and index keys.
 * This supplements Redis TTLs by eagerly reclaiming memory and keeping the
 * session list clean between natural expirations.
 *
 * Protected by the CRON_SECRET env var (set automatically by Vercel for cron
 * invocations; header: Authorization: Bearer <CRON_SECRET>).
 *
 * Response:
 * {
 *   ok: true,
 *   scanned:  number,   // total session keys examined
 *   removed:  number,   // stale sessions deleted
 *   durationMs: number,
 * }
 */

import { NextRequest, NextResponse } from 'next/server'

const CRON_SECRET = process.env.CRON_SECRET ?? ''
const STALE_THRESHOLD_MS = 30 * 60 * 1000  // 30 minutes

const REDIS_SESSION_PREFIX = 'fj:studio:session:'
const REDIS_CMD_PREFIX     = 'fj:studio:cmd:'
const REDIS_TOKEN_PREFIX   = 'fj:studio:token:'
const REDIS_PLACE_PREFIX   = 'fj:studio:place:'

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

function isAuthorized(req: NextRequest): boolean {
  if (!CRON_SECRET) return false
  const auth = req.headers.get('authorization') ?? ''
  return auth === `Bearer ${CRON_SECRET}`
}

// ---------------------------------------------------------------------------
// Redis
// ---------------------------------------------------------------------------

function getRedis() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@/lib/redis') as { getRedis?: () => import('ioredis').Redis | null }
    return mod.getRedis ? mod.getRedis() : null
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const start = Date.now()
  const r = getRedis()

  if (!r) {
    return NextResponse.json(
      { ok: false, error: 'redis_unavailable', scanned: 0, removed: 0, durationMs: Date.now() - start },
      { status: 503 },
    )
  }

  let scanned = 0
  let removed = 0
  const staleThreshold = Date.now() - STALE_THRESHOLD_MS

  try {
    let cursor = '0'
    do {
      const [nextCursor, keys] = await r.scan(
        cursor,
        'MATCH', `${REDIS_SESSION_PREFIX}*`,
        'COUNT', '200',
      )
      cursor = nextCursor
      scanned += keys.length

      await Promise.all(
        keys.map(async (key) => {
          try {
            const raw = await r.get(key)
            if (!raw) return

            const session = JSON.parse(raw) as {
              sessionId: string
              authToken?: string
              placeId?: string
              lastHeartbeat?: number
            }

            if (!session.lastHeartbeat || session.lastHeartbeat > staleThreshold) return

            // Session is stale — delete main key + all indexes + command queue
            const toDelete: string[] = [key]
            toDelete.push(`${REDIS_CMD_PREFIX}${session.sessionId}`)
            if (session.authToken) toDelete.push(`${REDIS_TOKEN_PREFIX}${session.authToken}`)
            if (session.placeId)   toDelete.push(`${REDIS_PLACE_PREFIX}${session.placeId}`)

            await r.del(...toDelete)
            removed++

            console.log(
              `[studio-cleanup] Removed stale session ${session.sessionId} ` +
              `(last heartbeat ${Math.round((Date.now() - session.lastHeartbeat) / 60_000)}m ago)`,
            )
          } catch {
            // Corrupt key or race condition — skip
          }
        }),
      )
    } while (cursor !== '0')
  } catch (err) {
    console.error('[studio-cleanup] Redis scan failed:', (err as Error).message)
    return NextResponse.json(
      { ok: false, error: 'scan_failed', scanned, removed, durationMs: Date.now() - start },
      { status: 500 },
    )
  }

  const durationMs = Date.now() - start
  console.log(`[studio-cleanup] Done — scanned=${scanned} removed=${removed} duration=${durationMs}ms`)

  return NextResponse.json({ ok: true, scanned, removed, durationMs })
}
