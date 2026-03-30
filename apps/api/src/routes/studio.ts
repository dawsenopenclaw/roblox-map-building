/**
 * Studio sync API routes
 * GET  /api/studio/sync?lastSync=<timestamp>  — poll pending changes
 * POST /api/studio/update                      — receive Studio changes
 * GET  /api/studio/status                      — connection health + metadata
 */

import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { requireAuth } from '../middleware/auth'
import { redis } from '../lib/redis'

export const studioRoutes = new Hono()

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface StudioChange {
  type: 'insert_model' | 'delete_model' | 'update_property' | 'insert_script' | 'terrain_update'
  data: Record<string, unknown>
  timestamp: number
  source?: string
}

export interface SyncResponse {
  serverTime: number
  changes: StudioChange[]
  nextPollIn: number  // recommended poll interval in seconds
}

// ---------------------------------------------------------------------------
// Redis key helpers
// ---------------------------------------------------------------------------
function changeQueueKey(userId: string): string {
  return `studio:changes:${userId}`
}

function sessionKey(userId: string): string {
  return `studio:session:${userId}`
}

// ---------------------------------------------------------------------------
// Auth middleware applied to all studio routes
// ---------------------------------------------------------------------------
studioRoutes.use('*', requireAuth)

// ---------------------------------------------------------------------------
// GET /api/studio/sync
// Poll for pending changes since lastSync timestamp
// ---------------------------------------------------------------------------
const syncQuerySchema = z.object({
  lastSync: z.string().optional().default('0'),
})

studioRoutes.get('/sync', zValidator('query', syncQuerySchema), async (c) => {
  const userId    = c.get('userId') as string
  const lastSync  = parseInt(c.req.query('lastSync') ?? '0', 10)
  const serverTime = Math.floor(Date.now() / 1000)

  // Update session timestamp
  await redis.set(sessionKey(userId), serverTime, 'EX', 3600)

  // Get pending changes from queue
  let changes: StudioChange[] = []
  const queueKey = changeQueueKey(userId)

  try {
    // Get all changes newer than lastSync
    const raw = await redis.lrange(queueKey, 0, -1)

    for (const item of raw) {
      try {
        const change = JSON.parse(item) as StudioChange
        if (change.timestamp > lastSync) {
          changes.push(change)
        }
      } catch {
        // Skip malformed entries
      }
    }

    // Remove consumed changes (all entries older than or equal to lastSync)
    if (changes.length > 0) {
      // Only clear changes we just sent
      const keepChanges = (await redis.lrange(queueKey, 0, -1))
        .filter((item) => {
          try {
            // Renamed from `c` to `parsed` to avoid shadowing the outer Hono context `c`
            const parsed = JSON.parse(item) as StudioChange
            return !changes.some((sent) => sent.timestamp === parsed.timestamp && sent.type === parsed.type)
          } catch {
            return false
          }
        })

      await redis.del(queueKey)
      if (keepChanges.length > 0) {
        await redis.rpush(queueKey, ...keepChanges)
      }
    }
  } catch (err) {
    console.error('[studio/sync] Redis error:', err)
    // Return empty changes on error — don't break the plugin
    changes = []
  }

  const response: SyncResponse = {
    serverTime,
    changes,
    nextPollIn: changes.length > 0 ? 2 : 5,  // poll faster when there are changes
  }

  return c.json(response, 200)
})

// ---------------------------------------------------------------------------
// POST /api/studio/update
// Receive local Studio changes and broadcast to other clients
// ---------------------------------------------------------------------------
const updateBodySchema = z.object({
  timestamp: z.number(),
  changes: z.array(
    z.object({
      type: z.enum(['insert_model', 'delete_model', 'update_property', 'insert_script', 'terrain_update']),
      data: z.record(z.unknown()),
      timestamp: z.number().optional(),
      source: z.string().optional(),
    })
  ),
  source: z.string().optional().default('studio-plugin'),
  placeId: z.number().optional(),
  jobId: z.string().optional(),
})

studioRoutes.post('/update', zValidator('json', updateBodySchema), async (c) => {
  const userId  = c.get('userId') as string
  const body    = c.req.valid('json')
  const now     = Math.floor(Date.now() / 1000)

  if (!body.changes || body.changes.length === 0) {
    return c.json({ accepted: 0, message: 'No changes' }, 200)
  }

  // Validate change count (prevent abuse)
  if (body.changes.length > 100) {
    return c.json({ error: 'Too many changes in one batch (max 100)' }, 400)
  }

  const queueKey = changeQueueKey(userId)
  let accepted = 0

  try {
    for (const change of body.changes) {
      const enriched: StudioChange = {
        type: change.type,
        data: change.data,
        timestamp: change.timestamp ?? now,
        source: change.source ?? body.source,
      }

      // Push to Redis list (capped at 500 entries)
      await redis.rpush(queueKey, JSON.stringify(enriched))
      accepted++
    }

    // Cap queue size
    await redis.ltrim(queueKey, -500, -1)

    // Set TTL on queue (auto-cleanup after 1 hour of inactivity)
    await redis.expire(queueKey, 3600)

    // Update session
    await redis.set(sessionKey(userId), now, 'EX', 3600)
  } catch (err) {
    console.error('[studio/update] Redis error:', err)
    return c.json({ error: 'Failed to queue changes' }, 500)
  }

  return c.json({
    accepted,
    total: body.changes.length,
    serverTime: now,
  }, 200)
})

// ---------------------------------------------------------------------------
// GET /api/studio/status
// Connection health + session metadata
// ---------------------------------------------------------------------------
studioRoutes.get('/status', async (c) => {
  const userId = c.get('userId') as string
  const now    = Math.floor(Date.now() / 1000)

  let lastSeen    = 0
  let queueDepth  = 0

  try {
    const sessionData = await redis.get(sessionKey(userId))
    lastSeen = sessionData ? parseInt(sessionData, 10) : 0

    queueDepth = await redis.llen(changeQueueKey(userId))
  } catch (err) {
    console.error('[studio/status] Redis error:', err)
  }

  const connected    = lastSeen > 0 && (now - lastSeen) < 30  // active in last 30s
  const lastSeenDiff = lastSeen > 0 ? now - lastSeen : null

  return c.json({
    status: 'ok',
    connected,
    userId,
    lastSeen,
    lastSeenAgo: lastSeenDiff,
    queueDepth,
    serverTime: now,
    pluginVersion: c.req.header('X-Plugin-Version') ?? null,
  }, 200)
})

// ---------------------------------------------------------------------------
// POST /api/studio/push-change (internal — push change TO Studio from web app)
// Called by generation routes when AI creates something
// ---------------------------------------------------------------------------
const pushChangeBodySchema = z.object({
  userId: z.string(),
  change: z.object({
    type: z.enum(['insert_model', 'delete_model', 'update_property', 'insert_script', 'terrain_update']),
    data: z.record(z.unknown()),
  }),
})

studioRoutes.post('/push-change', zValidator('json', pushChangeBodySchema), async (c) => {
  const body           = c.req.valid('json')
  const authenticatedId = c.get('userId') as string
  const now            = Math.floor(Date.now() / 1000)

  // Ownership check — the authenticated user must match the target userId
  if (authenticatedId !== body.userId) {
    return c.json({ error: 'Forbidden: cannot push changes to another user\'s session' }, 403)
  }

  const queueKey = changeQueueKey(body.userId)

  const enriched: StudioChange = {
    type: body.change.type,
    data: body.change.data,
    timestamp: now,
    source: 'web-app',
  }

  try {
    await redis.rpush(queueKey, JSON.stringify(enriched))
    await redis.ltrim(queueKey, -500, -1)
    await redis.expire(queueKey, 3600)
  } catch (err) {
    console.error('[studio/push-change] Redis error:', err)
    return c.json({ error: 'Failed to push change' }, 500)
  }

  return c.json({ queued: true, serverTime: now }, 200)
})
