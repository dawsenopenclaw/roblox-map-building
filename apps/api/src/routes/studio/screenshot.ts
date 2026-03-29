/**
 * Studio screenshot streaming
 * GET  /api/studio/screenshot — returns latest screenshot URL or base64
 * POST /api/studio/screenshot — Studio plugin uploads a new screenshot
 */

import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { requireAuth } from '../../middleware/auth'
import { redis } from '../../lib/redis'

export const screenshotRoutes = new Hono()

// ---------------------------------------------------------------------------
// Redis key helpers
// ---------------------------------------------------------------------------
function screenshotKey(userId: string): string {
  return `studio:screenshot:${userId}`
}

function screenshotTimestampKey(userId: string): string {
  return `studio:screenshot:${userId}:ts`
}

// ---------------------------------------------------------------------------
// Auth on all routes
// ---------------------------------------------------------------------------
screenshotRoutes.use('*', requireAuth)

// ---------------------------------------------------------------------------
// GET /api/studio/screenshot
// Returns the latest screenshot for the authenticated user.
// Response shape:
//   { connected: true,  url: "https://...", capturedAt: 1234567890 }
//   { connected: false, url: null,          capturedAt: null }
// ---------------------------------------------------------------------------
screenshotRoutes.get('/', async (c) => {
  const userId = c.get('userId') as string

  let screenshotData: string | null = null
  let capturedAt: number | null = null

  try {
    screenshotData = await redis.get(screenshotKey(userId))
    const tsRaw = await redis.get(screenshotTimestampKey(userId))
    capturedAt = tsRaw ? parseInt(tsRaw, 10) : null
  } catch (err) {
    console.error('[studio/screenshot] Redis read error:', err)
  }

  if (!screenshotData) {
    return c.json({ connected: false, url: null, capturedAt: null }, 200)
  }

  // screenshotData may be a URL or raw base64 — return either way
  const isUrl = screenshotData.startsWith('http')

  return c.json(
    {
      connected: true,
      url: isUrl ? screenshotData : null,
      base64: isUrl ? null : screenshotData,
      capturedAt,
    },
    200
  )
})

// ---------------------------------------------------------------------------
// POST /api/studio/screenshot
// Studio plugin uploads a new screenshot (URL or base64).
// Body: { url?: string, base64?: string }
// At least one of url or base64 is required.
// ---------------------------------------------------------------------------
const uploadSchema = z.object({
  url: z.string().url().optional(),
  base64: z.string().min(1).optional(),
}).refine((d) => d.url || d.base64, {
  message: 'Either url or base64 is required',
})

screenshotRoutes.post('/', zValidator('json', uploadSchema), async (c) => {
  const userId = c.get('userId') as string
  const body   = c.req.valid('json')
  const now    = Math.floor(Date.now() / 1000)

  const payload = body.url ?? body.base64!

  try {
    // Store screenshot with 5-minute TTL — if plugin goes silent, we know
    await redis.set(screenshotKey(userId), payload, 'EX', 300)
    await redis.set(screenshotTimestampKey(userId), String(now), 'EX', 300)
  } catch (err) {
    console.error('[studio/screenshot] Redis write error:', err)
    return c.json({ error: 'Failed to store screenshot' }, 500)
  }

  return c.json({ stored: true, capturedAt: now }, 200)
})
