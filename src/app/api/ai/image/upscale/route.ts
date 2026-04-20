/**
 * POST /api/ai/image/upscale
 *
 * Upscales an image to 2K or 4K resolution using Fal AI upscaling models.
 *
 * Body:
 *   { imageUrl: string, scale?: 2 | 4 }
 *
 * Returns:
 *   { imageUrl: string, width: number, height: number, status: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { requireTier } from '@/lib/tier-guard'
import { aiRateLimit, rateLimitHeaders } from '@/lib/rate-limit'
import { z } from 'zod'

export const maxDuration = 90

const bodySchema = z.object({
  imageUrl: z.string().url('imageUrl must be a valid URL'),
  scale: z.union([z.literal(2), z.literal(4)]).optional().default(2),
})

// ── Fal queue helpers ────────────────────────────────────────────────────────

const FAL_QUEUE_BASE = 'https://queue.fal.run'
const FAL_UPSCALE_MODEL = 'fal-ai/aura-sr'

interface FalQueueResponse {
  request_id: string
}

interface FalStatusResponse {
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
}

interface FalUpscaleOutput {
  image?: { url: string; width: number; height: number }
}

async function falSubmit(input: Record<string, unknown>, apiKey: string): Promise<string> {
  const res = await fetch(`${FAL_QUEUE_BASE}/${FAL_UPSCALE_MODEL}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Key ${apiKey}` },
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(15_000),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Fal submit failed (${res.status}): ${err}`)
  }
  return ((await res.json()) as FalQueueResponse).request_id
}

async function falPoll(requestId: string, apiKey: string): Promise<FalUpscaleOutput> {
  for (let i = 0; i < 25; i++) {
    await new Promise((r) => setTimeout(r, i === 0 ? 2_000 : 3_000))

    const statusRes = await fetch(
      `${FAL_QUEUE_BASE}/${FAL_UPSCALE_MODEL}/requests/${requestId}/status`,
      { headers: { Authorization: `Key ${apiKey}` }, signal: AbortSignal.timeout(8_000) },
    )
    if (!statusRes.ok) continue

    const status = (await statusRes.json()) as FalStatusResponse

    if (status.status === 'COMPLETED') {
      const resultRes = await fetch(
        `${FAL_QUEUE_BASE}/${FAL_UPSCALE_MODEL}/requests/${requestId}`,
        { headers: { Authorization: `Key ${apiKey}` }, signal: AbortSignal.timeout(10_000) },
      )
      if (!resultRes.ok) throw new Error('Fal result fetch failed')
      return (await resultRes.json()) as FalUpscaleOutput
    }

    if (status.status === 'FAILED') throw new Error(`Fal upscale job ${requestId} failed`)
  }
  throw new Error('Image upscaling timed out')
}

// ── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (process.env.DEMO_MODE !== 'true') {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const tierDenied = await requireTier(userId, 'FREE') // Beta: all testers get full access
    if (tierDenied) return tierDenied

    try {
      const rl = await aiRateLimit(userId)
      if (!rl.allowed) {
        return NextResponse.json(
          { error: 'Too many requests. Please wait before upscaling another image.' },
          { status: 429, headers: rateLimitHeaders(rl) },
        )
      }
    } catch {
      // Redis unavailable
    }
  }

  let parsed: z.infer<typeof bodySchema>
  try {
    const raw = await req.json()
    const result = bodySchema.safeParse(raw)
    if (!result.success) {
      const message = result.error.errors.map((e) => `${e.path.join('.') || 'body'}: ${e.message}`).join(', ')
      return NextResponse.json({ error: message }, { status: 422 })
    }
    parsed = result.data
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const apiKey = process.env.FAL_KEY ?? process.env.FAL_API_KEY

  if (!apiKey) {
    return NextResponse.json({
      imageUrl: null,
      width: 0,
      height: 0,
      status: 'demo',
      message: 'Set FAL_KEY to enable HD upscaling',
    })
  }

  try {
    // For 4x, run upscale twice (2x each pass) since most models support 2x natively
    const scale = parsed.scale ?? 2
    let currentUrl = parsed.imageUrl
    const passes = scale === 4 ? 2 : 1

    let finalOutput: FalUpscaleOutput | null = null

    for (let pass = 0; pass < passes; pass++) {
      const requestId = await falSubmit(
        {
          image_url: currentUrl,
          upscaling_factor: 2,
        },
        apiKey,
      )
      finalOutput = await falPoll(requestId, apiKey)
      if (finalOutput.image?.url) {
        currentUrl = finalOutput.image.url
      }
    }

    return NextResponse.json({
      imageUrl: finalOutput?.image?.url ?? null,
      width: finalOutput?.image?.width ?? 0,
      height: finalOutput?.image?.height ?? 0,
      scale,
      status: 'complete',
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[upscale POST] Failed:', message)
    return NextResponse.json({ error: 'Image upscaling failed', detail: message }, { status: 502 })
  }
}
