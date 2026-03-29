/**
 * POST /api/ai/image-to-map
 * Accept image upload → Claude Vision analysis → terrain + building placement data
 */

import { Hono } from 'hono'
import { requireAuth } from '../../middleware/auth'
import { aiRateLimit } from '../../middleware/security'
import { claudeVision } from '../../lib/ai/providers/anthropic'
import { anthropicBreaker } from '../../lib/ai/circuit-breaker'
import { buildCacheKey, withCache } from '../../lib/ai/cache'
import { estimateCost, usdToTokens } from '../../lib/ai/cost-estimator'
import { validateAIResponse } from '../../lib/ai/quality-gate'
import { db } from '../../lib/db'
import { createLogger } from '../../lib/logger'
import { incrementCounter, recordDuration } from '../../lib/metrics'

const log = createLogger('ai:image')

async function spendTokens(userId: string, amount: number, description: string) {
  return db.$transaction(async (tx) => {
    const current = await tx.tokenBalance.findUnique({ where: { userId } })
    if (!current) throw new Error('Token balance not found')
    if (current.balance < amount) throw new Error('Insufficient token balance')
    const balance = await tx.tokenBalance.update({
      where: { userId },
      data: { balance: { decrement: amount }, lifetimeSpent: { increment: amount } },
    })
    await tx.tokenTransaction.create({
      data: {
        balanceId: balance.id,
        type: 'SPEND',
        amount: -amount,
        description,
        metadata: {} as never,
      },
    })
    return balance
  })
}

export const imageRoutes = new Hono()

imageRoutes.use('*', requireAuth)
imageRoutes.use('*', aiRateLimit)

const IMAGE_TO_MAP_PROMPT = `You are a Roblox map designer analyzing a reference image to create a game map layout.

Analyze this image and output ONLY valid JSON with this structure:
{
  "mapType": "terrain" | "city" | "dungeon" | "island" | "custom",
  "dimensions": { "width": number, "height": number, "unit": "studs" },
  "terrain": {
    "biome": "grass" | "desert" | "snow" | "forest" | "volcanic" | "ocean",
    "elevation": { "min": number, "max": number },
    "features": [{ "type": string, "x": number, "z": number, "radius": number }]
  },
  "buildings": [
    {
      "name": string,
      "type": "shop" | "house" | "tower" | "warehouse" | "landmark" | "other",
      "x": number,
      "z": number,
      "width": number,
      "height": number,
      "depth": number,
      "style": string
    }
  ],
  "paths": [
    { "from": { "x": number, "z": number }, "to": { "x": number, "z": number }, "width": number, "type": "road" | "path" | "river" }
  ],
  "lighting": {
    "timeOfDay": "morning" | "afternoon" | "evening" | "night",
    "ambience": string
  },
  "colorPalette": ["#hex1", "#hex2", "#hex3"],
  "notes": string
}

Scale: use Roblox stud units. Typical map: 1000x1000 studs. Building heights: 10-50 studs.
Be precise with coordinates. Place buildings logically based on image composition.`

/**
 * POST /api/ai/image-to-map
 * Body: multipart with field "image" (file) OR JSON { imageUrl: string, prompt?: string }
 * Returns: { layout, tokens_spent, duration_ms }
 */
imageRoutes.post('/', async (c) => {
  const start = Date.now()
  const userId = c.get('userId') as string
  const requestId = c.get('requestId') as string | undefined
  const reqLog = log.child({ requestId, userId })
  if (!userId) return c.json({ error: 'Unauthorized' }, 401)

  reqLog.info('ai image-to-map request started')

  const contentType = c.req.header('content-type') ?? ''
  let imageData: { base64: string; mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' } | { url: string }
  let imageHash = ''
  let userPrompt = ''

  if (contentType.includes('multipart/form-data')) {
    const formData = await c.req.formData()
    const imageFile = formData.get('image') as File | null
    if (!imageFile) {
      return c.json({ error: 'Missing image file in form data (field: "image")' }, 400)
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    const mimeType = imageFile.type || 'image/jpeg'
    if (!validTypes.includes(mimeType)) {
      return c.json({ error: `Unsupported image type: ${mimeType}. Supported: ${validTypes.join(', ')}` }, 400)
    }

    // Validate file size (max 5MB)
    if (imageFile.size > 5 * 1024 * 1024) {
      return c.json({ error: 'Image too large. Maximum 5MB.' }, 413)
    }

    const buffer = Buffer.from(await imageFile.arrayBuffer())
    const base64 = buffer.toString('base64')
    imageData = { base64, mediaType: mimeType as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' }

    // Hash image for caching
    const { createHash } = await import('crypto')
    imageHash = createHash('sha256').update(buffer).digest('hex').slice(0, 20)

    userPrompt = (formData.get('prompt') as string | null) ?? ''
  } else {
    const body = await c.req.json<{ imageUrl?: string; prompt?: string }>().catch(() => ({}))
    if (!body.imageUrl) {
      return c.json({ error: 'Provide image file (multipart) or imageUrl in JSON body' }, 400)
    }
    imageData = { url: body.imageUrl }
    imageHash = Buffer.from(body.imageUrl).toString('base64').slice(0, 20)
    userPrompt = body.prompt ?? ''
  }

  // --- Cost estimate + balance check ---
  const estimate = estimateCost('image-to-map')
  const tokensToSpend = estimate.totalTokens

  const balance = await db.tokenBalance.findUnique({ where: { userId } })
  if (!balance || balance.balance < tokensToSpend) {
    return c.json({
      error: 'Insufficient tokens',
      required: tokensToSpend,
      available: balance?.balance ?? 0,
      estimate: estimate.summary,
    }, 402)
  }

  // --- Claude Vision analysis ---
  const cacheKey = buildCacheKey('claude', 'image-to-map', imageHash + userPrompt)

  let layout: unknown
  let visionCostUsd = 0

  try {
    reqLog.debug('ai image-to-map: calling claude vision', { cacheKey })
    const { result: visionResult, fromCache } = await withCache(cacheKey, () =>
      anthropicBreaker.execute(() =>
        claudeVision(
          imageData,
          userPrompt
            ? `${IMAGE_TO_MAP_PROMPT}\n\nAdditional context from user: ${userPrompt}`
            : IMAGE_TO_MAP_PROMPT,
          { maxTokens: 4000 }
        )
      )
    )

    visionCostUsd = fromCache ? 0 : visionResult.costUsd
    layout = visionResult.analysis

    if (fromCache) {
      reqLog.debug('ai image-to-map: cache hit')
      incrementCounter('ai_cache_hits_total', { provider: 'claude', type: 'image-to-map' })
    } else {
      reqLog.debug('ai image-to-map: cache miss, used claude vision')
      incrementCounter('ai_cache_misses_total', { provider: 'claude', type: 'image-to-map' })
    }

    // Validate response
    const gate = validateAIResponse(
      typeof visionResult.content === 'string' ? visionResult.content : JSON.stringify(visionResult.content),
      'json'
    )
    if (gate.status === 'FAIL') {
      reqLog.warn('ai image-to-map: quality gate failed, using raw fallback', { reasons: gate.failReasons })
      // Fallback: return raw analysis
      layout = {
        raw: visionResult.content,
        parseError: gate.failReasons.join(', '),
        mapType: 'custom',
        notes: 'Could not parse structured layout — raw analysis provided',
      }
    }
  } catch (err) {
    const durationMs = Date.now() - start
    reqLog.error('ai image-to-map: vision analysis failed', {
      durationMs,
      error: err instanceof Error ? err.message : String(err),
    })
    incrementCounter('ai_requests_total', { mode: 'image-to-map', status: 'error' })
    recordDuration('ai_request_duration_ms', durationMs, { mode: 'image-to-map', status: 'error' })
    return c.json({
      error: 'Vision analysis failed',
      detail: err instanceof Error ? err.message : String(err),
    }, 502)
  }

  // --- Deduct tokens ---
  const actualTokens = usdToTokens(visionCostUsd)
  const tokensCharged = Math.max(actualTokens, 10) // minimum 10 tokens
  await spendTokens(userId, tokensCharged, 'image-to-map analysis')

  const durationMs = Date.now() - start
  reqLog.info('ai image-to-map: completed', {
    durationMs,
    tokensCharged,
    cached: visionCostUsd === 0,
  })
  incrementCounter('ai_requests_total', { mode: 'image-to-map', status: 'success' })
  recordDuration('ai_request_duration_ms', durationMs, { mode: 'image-to-map', status: 'success' })

  return c.json({
    layout,
    estimate: estimate.summary,
    tokens_spent: tokensCharged,
    duration_ms: durationMs,
    cached: visionCostUsd === 0,
  })
})

/**
 * GET /api/ai/image-to-map/estimate
 */
imageRoutes.get('/estimate', async (c) => {
  const estimate = estimateCost('image-to-map')
  return c.json({
    estimate: estimate.summary,
    breakdown: estimate.breakdown,
    totalUsd: estimate.totalUsd,
    totalTokens: estimate.totalTokens,
  })
})
