/**
 * POST /api/ai/upscale
 *
 * Upscales an image to 2K/4K using FAL AI (Clarity Upscaler).
 * Premium feature — supports 2x and 4x upscaling.
 *
 * Body:
 *   { imageUrl: string, scale?: 2 | 4 }
 *
 * Returns:
 *   { imageUrl: string, width: number, height: number, scale: number, cost: number }
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { requireTier } from '@/lib/tier-guard'
import { aiRateLimit, rateLimitHeaders } from '@/lib/rate-limit'
import { z } from 'zod'

export const maxDuration = 120

const FAL_API_BASE = 'https://queue.fal.run'
const FAL_UPSCALE_MODEL = 'fal-ai/clarity-upscaler'
const COST_UPSCALE_2X = 0.04
const COST_UPSCALE_4X = 0.08

const bodySchema = z.object({
  imageUrl: z.string().url('Valid image URL required'),
  scale: z.union([z.literal(2), z.literal(4)]).optional().default(2),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Auth — upscale requires at least CREATOR tier
  if (process.env.DEMO_MODE !== 'true') {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const tierDenied = await requireTier(userId, 'FREE') // Beta: all testers get full access
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

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 422 })
  }

  const { imageUrl, scale } = parsed.data
  const apiKey = process.env.FAL_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'FAL_KEY not configured' }, { status: 500 })
  }

  try {
    const submitRes = await fetch(`${FAL_API_BASE}/${FAL_UPSCALE_MODEL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Key ${apiKey}` },
      body: JSON.stringify({
        image_url: imageUrl,
        upscale_factor: scale,
        prompt: 'high quality, detailed, sharp, clean',
        negative_prompt: 'blurry, noisy, low quality, artifacts',
      }),
      signal: AbortSignal.timeout(15_000),
    })

    if (!submitRes.ok) {
      const err = await submitRes.text()
      throw new Error(`FAL submit failed: ${err}`)
    }

    const { request_id } = await submitRes.json()

    // Poll for completion (upscale can take longer)
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, i === 0 ? 3000 : 4000))

      const statusRes = await fetch(
        `${FAL_API_BASE}/${FAL_UPSCALE_MODEL}/requests/${request_id}/status`,
        { headers: { Authorization: `Key ${apiKey}` } },
      )
      if (!statusRes.ok) continue

      const status = await statusRes.json()

      if (status.status === 'COMPLETED') {
        const resultRes = await fetch(
          `${FAL_API_BASE}/${FAL_UPSCALE_MODEL}/requests/${request_id}`,
          { headers: { Authorization: `Key ${apiKey}` } },
        )
        const result = await resultRes.json()
        const image = result.image || result.images?.[0]

        return NextResponse.json({
          imageUrl: image?.url,
          width: image?.width,
          height: image?.height,
          scale,
          cost: scale === 4 ? COST_UPSCALE_4X : COST_UPSCALE_2X,
        })
      }

      if (status.status === 'FAILED') {
        throw new Error('Upscaling failed')
      }
    }

    throw new Error('Upscaling timed out')
  } catch (err) {
    console.error('[api/ai/upscale]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Upscaling failed' },
      { status: 500 },
    )
  }
}
