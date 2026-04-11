/**
 * POST /api/ai/image/remove-bg
 *
 * Removes the background from an uploaded image, producing a transparent PNG.
 * Uses Fal AI's background removal model (birefnet).
 *
 * Body (application/json):
 *   { imageUrl: string }           -- public URL of the image
 *   OR { base64: string }          -- data URI or raw base64
 *
 * Returns:
 *   { imageUrl: string, status: 'complete' | 'demo' }
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { requireTier } from '@/lib/tier-guard'
import { aiRateLimit, rateLimitHeaders } from '@/lib/rate-limit'
import { z } from 'zod'

export const maxDuration = 60

const bodySchema = z
  .object({
    imageUrl: z.string().url().optional(),
    base64: z.string().min(1).optional(),
  })
  .refine((b) => b.imageUrl || b.base64, {
    message: 'Either imageUrl or base64 is required',
  })

// ── Fal queue helpers ────────────────────────────────────────────────────────

const FAL_QUEUE_BASE = 'https://queue.fal.run'
const FAL_BG_MODEL = 'fal-ai/birefnet'

interface FalQueueResponse {
  request_id: string
}

interface FalStatusResponse {
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
}

interface FalBgOutput {
  image?: { url: string; width: number; height: number }
}

async function falSubmit(input: Record<string, unknown>, apiKey: string): Promise<string> {
  const res = await fetch(`${FAL_QUEUE_BASE}/${FAL_BG_MODEL}`, {
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

async function falPoll(requestId: string, apiKey: string): Promise<FalBgOutput> {
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, i === 0 ? 2_000 : 3_000))

    const statusRes = await fetch(
      `${FAL_QUEUE_BASE}/${FAL_BG_MODEL}/requests/${requestId}/status`,
      { headers: { Authorization: `Key ${apiKey}` }, signal: AbortSignal.timeout(8_000) },
    )
    if (!statusRes.ok) continue

    const status = (await statusRes.json()) as FalStatusResponse

    if (status.status === 'COMPLETED') {
      const resultRes = await fetch(
        `${FAL_QUEUE_BASE}/${FAL_BG_MODEL}/requests/${requestId}`,
        { headers: { Authorization: `Key ${apiKey}` }, signal: AbortSignal.timeout(10_000) },
      )
      if (!resultRes.ok) throw new Error('Fal result fetch failed')
      return (await resultRes.json()) as FalBgOutput
    }

    if (status.status === 'FAILED') throw new Error(`Fal BG removal job ${requestId} failed`)
  }
  throw new Error('Background removal timed out')
}

// ── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (process.env.DEMO_MODE !== 'true') {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const tierDenied = await requireTier(userId, 'HOBBY')
    if (tierDenied) return tierDenied

    try {
      const rl = await aiRateLimit(userId)
      if (!rl.allowed) {
        return NextResponse.json(
          { error: 'Too many requests. Please wait before removing another background.' },
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
      const message = result.error.errors.map((e) => e.message).join(', ')
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
      status: 'demo',
      message: 'Set FAL_KEY to enable background removal',
    })
  }

  try {
    const input: Record<string, unknown> = {}

    if (parsed.imageUrl) {
      input.image_url = parsed.imageUrl
    } else if (parsed.base64) {
      // Fal accepts data URIs directly for some models
      input.image_url = parsed.base64.startsWith('data:') ? parsed.base64 : `data:image/png;base64,${parsed.base64}`
    }

    const requestId = await falSubmit(input, apiKey)
    const output = await falPoll(requestId, apiKey)

    return NextResponse.json({
      imageUrl: output.image?.url ?? null,
      status: 'complete',
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[remove-bg POST] Failed:', message)
    return NextResponse.json({ error: 'Background removal failed', detail: message }, { status: 502 })
  }
}
