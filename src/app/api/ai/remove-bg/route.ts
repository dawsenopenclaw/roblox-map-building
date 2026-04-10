/**
 * POST /api/ai/remove-bg
 *
 * Removes background from an image using FAL AI (BiRefNet model).
 * Returns a transparent PNG suitable for Roblox decals, icons, and UI elements.
 *
 * Body:
 *   { imageUrl: string }
 *
 * Returns:
 *   { imageUrl: string, width: number, height: number, cost: number }
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { requireTier } from '@/lib/tier-guard'
import { aiRateLimit, rateLimitHeaders } from '@/lib/rate-limit'
import { z } from 'zod'

export const maxDuration = 60

const FAL_API_BASE = 'https://queue.fal.run'
const FAL_BG_REMOVAL_MODEL = 'fal-ai/birefnet'
const COST_BG_REMOVAL = 0.02

const bodySchema = z.object({
  imageUrl: z.string().url('Valid image URL required'),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Auth
  if (process.env.DEMO_MODE !== 'true') {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const tierDenied = await requireTier(userId, 'HOBBY')
    if (tierDenied) return tierDenied

    try {
      const rl = await aiRateLimit(userId)
      if (!rl.allowed) {
        return NextResponse.json(
          { error: 'Rate limited. Please wait.' },
          { status: 429, headers: rateLimitHeaders(rl) },
        )
      }
    } catch { /* Redis unavailable */ }
  }

  // Parse body
  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 422 })
  }

  const apiKey = process.env.FAL_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'FAL_KEY not configured' }, { status: 500 })
  }

  try {
    // Submit to FAL queue
    const submitRes = await fetch(`${FAL_API_BASE}/${FAL_BG_REMOVAL_MODEL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Key ${apiKey}` },
      body: JSON.stringify({ image_url: parsed.data.imageUrl }),
      signal: AbortSignal.timeout(15_000),
    })

    if (!submitRes.ok) {
      const err = await submitRes.text()
      throw new Error(`FAL submit failed: ${err}`)
    }

    const { request_id } = await submitRes.json()

    // Poll for completion
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, i === 0 ? 2000 : 3000))

      const statusRes = await fetch(
        `${FAL_API_BASE}/${FAL_BG_REMOVAL_MODEL}/requests/${request_id}/status`,
        { headers: { Authorization: `Key ${apiKey}` } },
      )
      if (!statusRes.ok) continue

      const status = await statusRes.json()

      if (status.status === 'COMPLETED') {
        const resultRes = await fetch(
          `${FAL_API_BASE}/${FAL_BG_REMOVAL_MODEL}/requests/${request_id}`,
          { headers: { Authorization: `Key ${apiKey}` } },
        )
        const result = await resultRes.json()

        return NextResponse.json({
          imageUrl: result.image?.url || result.images?.[0]?.url,
          width: result.image?.width || result.images?.[0]?.width,
          height: result.image?.height || result.images?.[0]?.height,
          cost: COST_BG_REMOVAL,
        })
      }

      if (status.status === 'FAILED') {
        throw new Error('Background removal failed')
      }
    }

    throw new Error('Background removal timed out')
  } catch (err) {
    console.error('[api/ai/remove-bg]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Background removal failed' },
      { status: 500 },
    )
  }
}
