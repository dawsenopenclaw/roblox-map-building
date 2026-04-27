/**
 * POST /api/ai/clothing
 *
 * Generates Roblox Classic Shirt (585x559) and Pants (585x559) clothing
 * templates using AI image generation via Fal AI.  The design is generated
 * as a flat texture that maps directly onto the Roblox clothing UV layout.
 *
 * Body:
 *   {
 *     prompt:       string              -- description of the clothing design
 *     type:         'shirt' | 'pants'   -- clothing type
 *     stylePreset?: string              -- optional style modifier
 *   }
 *
 * Returns:
 *   {
 *     imageUrl:    string   -- generated clothing template image URL
 *     type:        string   -- 'shirt' or 'pants'
 *     width:       number   -- always 585
 *     height:      number   -- always 559
 *     regions:     object   -- UV region metadata for the template
 *     cost:        number   -- estimated cost in USD
 *     status:      string   -- 'complete' | 'demo'
 *   }
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { requireTier } from '@/lib/tier-guard'
import { spendTokens } from '@/lib/tokens-server'
import { aiRateLimit, rateLimitHeaders } from '@/lib/rate-limit'
import { z } from 'zod'
import { moderateContent, getModerationMessage } from '@/lib/content-moderation'

export const maxDuration = 120

// ── Roblox clothing template definitions ────────────────────────────────────

const SHIRT_TEMPLATE = {
  width: 585,
  height: 559,
  regions: {
    front:       { x: 172, y: 172, w: 128, h: 128 },
    back:        { x: 312, y: 172, w: 128, h: 128 },
    leftArm:     { x: 452, y: 172, w: 64,  h: 128 },
    rightArm:    { x: 32,  y: 172, w: 64,  h: 128 },
    leftArmTop:  { x: 452, y: 108, w: 64,  h: 64  },
    rightArmTop: { x: 32,  y: 108, w: 64,  h: 64  },
    collar:      { x: 172, y: 108, w: 128, h: 64  },
    backCollar:  { x: 312, y: 108, w: 128, h: 64  },
  },
} as const

const PANTS_TEMPLATE = {
  width: 585,
  height: 559,
  regions: {
    leftLeg:       { x: 172, y: 300, w: 64,  h: 128 },
    rightLeg:      { x: 312, y: 300, w: 64,  h: 128 },
    leftLegBack:   { x: 236, y: 300, w: 64,  h: 128 },
    rightLegBack:  { x: 376, y: 300, w: 64,  h: 128 },
    waistFront:    { x: 172, y: 236, w: 128, h: 64  },
    waistBack:     { x: 312, y: 236, w: 128, h: 64  },
    leftLegBottom:  { x: 172, y: 428, w: 64,  h: 32  },
    rightLegBottom: { x: 312, y: 428, w: 64,  h: 32  },
  },
} as const

// ── Style presets ───────────────────────────────────────────────────────────

const STYLE_PRESETS: Record<string, string> = {
  streetwear: 'urban streetwear style, bold graphics, modern fashion',
  military: 'military camouflage pattern, tactical gear, army style',
  sporty: 'athletic sportswear, jersey style, dynamic stripes',
  formal: 'formal wear, clean lines, professional look, suit texture',
  casual: 'casual everyday wear, relaxed fit, comfortable style',
  fantasy: 'fantasy armor texture, medieval knight, enchanted clothing',
  scifi: 'sci-fi futuristic suit, holographic accents, cyber armor',
  anime: 'anime-inspired clothing, cel-shaded, manga fashion',
  vintage: 'retro vintage style, 80s/90s fashion, nostalgic patterns',
  neon: 'neon glow accents, cyberpunk fashion, dark with vivid colors',
  pixel: 'pixel art style clothing, retro 8-bit pattern',
  minimal: 'minimalist design, clean solid colors, simple elegant',
}

// ── Validation ──────────────────────────────────────────────────────────────

const bodySchema = z.object({
  prompt: z.string().min(1, 'prompt is required').max(2000),
  type: z.enum(['shirt', 'pants']),
  stylePreset: z.string().optional(),
})

// ── Fal queue helpers ───────────────────────────────────────────────────────

const FAL_QUEUE_BASE = 'https://queue.fal.run'
const FAL_MODEL = 'fal-ai/flux-pro/v1.1'

interface FalQueueResponse {
  request_id: string
}

interface FalStatusResponse {
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
}

interface FalImageOutput {
  images?: Array<{ url: string; width: number; height: number }>
}

async function falQueueSubmit(
  model: string,
  input: Record<string, unknown>,
  apiKey: string,
): Promise<string> {
  const res = await fetch(`${FAL_QUEUE_BASE}/${model}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Key ${apiKey}` },
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(15_000),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Fal queue submit failed (${res.status}): ${err}`)
  }
  const data = (await res.json()) as FalQueueResponse
  return data.request_id
}

async function falQueuePoll<T>(
  model: string,
  requestId: string,
  apiKey: string,
  maxAttempts = 30,
  intervalMs = 3_000,
): Promise<T> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, i === 0 ? 2_000 : intervalMs))

    const statusRes = await fetch(`${FAL_QUEUE_BASE}/${model}/requests/${requestId}/status`, {
      headers: { Authorization: `Key ${apiKey}` },
      signal: AbortSignal.timeout(8_000),
    })
    if (!statusRes.ok) continue

    const status = (await statusRes.json()) as FalStatusResponse

    if (status.status === 'COMPLETED') {
      const resultRes = await fetch(`${FAL_QUEUE_BASE}/${model}/requests/${requestId}`, {
        headers: { Authorization: `Key ${apiKey}` },
        signal: AbortSignal.timeout(10_000),
      })
      if (!resultRes.ok) throw new Error('Fal result fetch failed')
      return (await resultRes.json()) as T
    }

    if (status.status === 'FAILED') {
      throw new Error(`Fal job ${requestId} failed`)
    }
  }

  throw new Error('Clothing generation timed out')
}

// ── Cost ────────────────────────────────────────────────────────────────────

const TOKEN_COST = 30 // tokens per clothing generation
const COST_PER_IMAGE = 0.055

// ── Handler ─────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  const isDemo = process.env.DEMO_MODE === 'true'
  let authedUserId: string | null = null

  if (!isDemo) {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const tierDenied = await requireTier(userId, 'FREE')
    if (tierDenied) return tierDenied
    authedUserId = userId

    try {
      const rl = await aiRateLimit(userId)
      if (!rl.allowed) {
        return NextResponse.json(
          { error: 'Too many requests. Please wait before generating more clothing.' },
          { status: 429, headers: rateLimitHeaders(rl) },
        )
      }
    } catch {
      // Redis unavailable -- allow through
    }
  }

  // Parse body
  let body: z.infer<typeof bodySchema>
  try {
    const raw = await req.json()
    const parsed = bodySchema.safeParse(raw)
    if (!parsed.success) {
      const message = parsed.error.errors
        .map((e) => `${e.path.join('.') || 'body'}: ${e.message}`)
        .join(', ')
      return NextResponse.json({ error: message }, { status: 422 })
    }
    body = parsed.data
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // ── Content moderation — COPPA compliance ──────────────────────────────
  try {
    const modResult = await moderateContent(body.prompt, { skipAI: false })
    if (!modResult.allowed) {
      return NextResponse.json({ error: getModerationMessage(modResult) }, { status: 422 })
    }
  } catch {
    console.warn('[clothing] Content moderation threw unexpectedly — allowing through')
  }

  const template = body.type === 'shirt' ? SHIRT_TEMPLATE : PANTS_TEMPLATE
  const typeLabel = body.type === 'shirt' ? 'shirt' : 'pants'

  // Build enriched prompt for flat clothing texture generation
  const styleSuffix =
    body.stylePreset && STYLE_PRESETS[body.stylePreset]
      ? `, ${STYLE_PRESETS[body.stylePreset]}`
      : ''
  const enrichedPrompt = [
    `Roblox classic ${typeLabel} clothing template, flat 2D texture map,`,
    `top-down UV layout for game character clothing,`,
    `seamless edges between body regions, consistent color and pattern across all panels,`,
    body.prompt,
    styleSuffix,
  ].join(' ')

  const apiKey = process.env.FAL_KEY ?? process.env.FAL_API_KEY

  // Demo mode -- return placeholder
  if (!apiKey) {
    return NextResponse.json({
      imageUrl: `https://placehold.co/${template.width}x${template.height}/1a1a2e/d4af37?text=Demo+${typeLabel}+Template`,
      type: body.type,
      width: template.width,
      height: template.height,
      regions: template.regions,
      cost: 0,
      status: 'demo',
      message: 'Set FAL_KEY to generate real clothing templates via Fal AI',
    })
  }

  // Deduct tokens before generation
  if (!isDemo && authedUserId) {
    try {
      await spendTokens(authedUserId, TOKEN_COST, `AI clothing template generation (${typeLabel})`, {
        prompt: body.prompt.slice(0, 100),
        type: body.type,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Token error'
      return NextResponse.json({ error: message }, { status: 402 })
    }
  }

  try {
    const requestId = await falQueueSubmit(
      FAL_MODEL,
      {
        prompt: enrichedPrompt,
        image_size: { width: template.width, height: template.height },
        num_inference_steps: 28,
        guidance_scale: 3.5,
        num_images: 1,
        enable_safety_checker: true,
      },
      apiKey,
    )

    const result = await falQueuePoll<FalImageOutput>(FAL_MODEL, requestId, apiKey)
    const image = result.images?.[0]

    if (!image) {
      return NextResponse.json({ error: 'No image returned from generation' }, { status: 502 })
    }

    return NextResponse.json({
      imageUrl: image.url,
      type: body.type,
      width: template.width,
      height: template.height,
      regions: template.regions,
      cost: COST_PER_IMAGE,
      status: 'complete',
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[clothing POST] Generation failed:', message)
    return NextResponse.json(
      { error: 'Clothing generation failed', detail: message },
      { status: 502 },
    )
  }
}
