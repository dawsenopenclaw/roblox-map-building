/**
 * POST /api/ai/image
 *
 * Generates game icons, thumbnails, GFX renders, UI elements, and styled
 * artwork via Fal AI (FLUX model). Supports 12 style presets, batch
 * generation (1-12 images), custom sizes, and optional background removal.
 *
 * Body:
 *   {
 *     prompt:           string         -- text description of the image
 *     style:            string         -- one of 12 preset keys (see image-styles.ts)
 *     count?:           number         -- 1-12, default 1
 *     size?:            { width: number; height: number }  -- override default
 *     removeBackground?: boolean       -- run background removal on each result
 *     skipEnhance?:     boolean        -- skip FREE Groq prompt enhancement (default false)
 *   }
 *
 * Features:
 *   - Automatic prompt enhancement via Groq/Llama (FREE, skippable)
 *   - Shared seed across batch jobs for visual consistency (seed, seed+1, ...)
 *   - 12 style presets with tuned guidance/steps/dimensions
 *
 * Returns:
 *   {
 *     images: Array<{ url: string; prompt: string; style: string }>
 *     cost: number
 *     status: 'complete' | 'demo'
 *   }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDbUserOrUnauthorized } from '@/lib/auth/get-db-user'
import { requireTier } from '@/lib/tier-guard'
import { aiImageRateLimit, rateLimitHeaders } from '@/lib/rate-limit'
import { IMAGE_STYLE_KEYS, getImageStyle } from '@/lib/image-styles'
import { enhancePrompt } from '@/lib/ai/prompt-enhancer'
import { spendTokens, earnTokens } from '@/lib/tokens-server'
import { z } from 'zod'

export const maxDuration = 120

// Per-image credit cost. Charged once per generation call, multiplied by the
// caller-requested `count`. Matches the audio cost scale (music=30, sfx=10) so
// a batch of images lands in the same ballpark as a single sfx clip.
const IMAGE_CREDIT_COST = 5

// ── Validation ──────────────────────────────────────────────────────────────

const bodySchema = z.object({
  prompt: z.string().min(1, 'prompt is required').max(2000),
  style: z.enum(IMAGE_STYLE_KEYS),
  count: z.number().int().min(1).max(12).optional().default(1),
  size: z
    .object({
      width: z.number().int().min(64).max(2048),
      height: z.number().int().min(64).max(2048),
    })
    .optional(),
  removeBackground: z.boolean().optional().default(false),
  skipEnhance: z.boolean().optional().default(false),
  seed: z.number().int().min(0).max(2_147_483_647).optional(),
  upscale: z.boolean().optional().default(false),
  watermark: z.boolean().optional().default(false),
})

// ── NSFW content filter ────────────────────────────────────────────────────

const NSFW_BLOCKLIST: string[] = [
  'nude', 'naked', 'nsfw', 'porn', 'pornographic', 'hentai', 'xxx',
  'sexual', 'erotic', 'genitals', 'genital', 'topless', 'bottomless',
  'explicit', 'gore', 'gory', 'dismember', 'mutilat', 'torture',
  'child abuse', 'underage', 'loli', 'shota',
]

function containsNSFW(prompt: string): boolean {
  const lower = prompt.toLowerCase()
  return NSFW_BLOCKLIST.some((term) => lower.includes(term))
}

// ── Fal queue helpers (same pattern as texture route) ───────────────────────

const FAL_QUEUE_BASE = 'https://queue.fal.run'
const FAL_FLUX_MODEL = 'fal-ai/flux-pro/v1.1'
const FAL_BG_MODEL = 'fal-ai/birefnet'
const FAL_UPSCALE_MODEL = 'fal-ai/clarity-upscaler'

interface FalQueueResponse {
  request_id: string
}

interface FalStatusResponse {
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
}

interface FalImageOutput {
  images?: Array<{ url: string; width: number; height: number }>
}

interface FalBgOutput {
  image?: { url: string; width: number; height: number }
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

  throw new Error('Image generation timed out')
}

// ── Background removal helper ───────────────────────────────────────────────

async function removeBackground(imageUrl: string, apiKey: string): Promise<string> {
  const requestId = await falQueueSubmit(FAL_BG_MODEL, { image_url: imageUrl }, apiKey)
  const output = await falQueuePoll<FalBgOutput>(FAL_BG_MODEL, requestId, apiKey, 20)
  return output.image?.url ?? imageUrl // fall back to original if removal fails silently
}

// ── HD Upscale helper ──────────────────────────────────────────────────────

interface FalUpscaleOutput {
  image?: { url: string; width: number; height: number }
}

async function upscaleImage(imageUrl: string, apiKey: string): Promise<string> {
  const requestId = await falQueueSubmit(
    FAL_UPSCALE_MODEL,
    { image_url: imageUrl, scale: 2 },
    apiKey,
  )
  const output = await falQueuePoll<FalUpscaleOutput>(FAL_UPSCALE_MODEL, requestId, apiKey, 30, 4_000)
  return output.image?.url ?? imageUrl
}

// ── Watermark helper ───────────────────────────────────────────────────────

/**
 * Build a watermarked URL by appending a text overlay query parameter.
 * In production this would call an image processing service; for now we
 * append a query hint that the CDN/edge can use to stamp a watermark.
 */
function applyWatermark(imageUrl: string): string {
  const sep = imageUrl.includes('?') ? '&' : '?'
  return `${imageUrl}${sep}watermark=ForjeGames+Free+Tier`
}

// ── Cost ────────────────────────────────────────────────────────────────────

const COST_PER_IMAGE = 0.055
const COST_BG_REMOVAL = 0.01
const COST_UPSCALE = 0.03

// ── Demo fallback ───────────────────────────────────────────────────────────

function buildDemoImages(count: number, prompt: string, style: string) {
  const preset = getImageStyle(style)
  const { width, height } = preset.defaultDimensions
  return Array.from({ length: count }, (_, i) => ({
    url: `https://placehold.co/${width}x${height}/1a1a2e/d4af37?text=${encodeURIComponent(preset.name)}+${i + 1}`,
    prompt,
    style,
  }))
}

// ── Handler ─────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  // ── Auth + rate limit ───────────────────────────────────────────────────
  // `dbUser` is null in DEMO_MODE so we can skip the per-image credit charge.
  let dbUserId: string | null = null
  if (process.env.DEMO_MODE !== 'true') {
    const authResult = await getDbUserOrUnauthorized()
    if ('response' in authResult) return authResult.response
    const { user, clerkId: userId } = authResult
    dbUserId = user.id

    const tierDenied = await requireTier(userId, 'FREE') // Beta: all testers get full access
    if (tierDenied) return tierDenied

    try {
      const rl = await aiImageRateLimit(userId)
      if (!rl.allowed) {
        return NextResponse.json(
          { error: 'Too many requests. Please wait before generating more images.' },
          { status: 429, headers: rateLimitHeaders(rl) },
        )
      }
    } catch {
      // Redis unavailable -- allow through
    }
  }

  // ── Parse body ──────────────────────────────────────────────────────────
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

  const { prompt, style, count, removeBackground: shouldRemoveBg, skipEnhance, upscale: shouldUpscale, watermark: shouldWatermark } = body

  // ── NSFW content filter ─────────────────────────────────────────────────
  if (containsNSFW(prompt)) {
    return NextResponse.json(
      { error: 'Your prompt was rejected because it contains inappropriate content. Please revise and try again.' },
      { status: 422 },
    )
  }
  const preset = getImageStyle(style)
  const width = body.size?.width ?? preset.defaultDimensions.width
  const height = body.size?.height ?? preset.defaultDimensions.height

  // ── Prompt enhancement (automatic, FREE via Groq) ─────────────────────
  // Runs the enhancer to rewrite the user's prompt into a richer description
  // before appending the style suffix. Skippable via `skipEnhance: true`.
  let finalUserPrompt = prompt.trim()
  if (!skipEnhance) {
    try {
      const enhanced = await enhancePrompt(prompt, `Image generation for style: ${preset.name}`)
      // Use the enhanced prompt if it differs meaningfully from the original
      if (enhanced.enhancedPrompt && enhanced.enhancedPrompt !== prompt) {
        finalUserPrompt = enhanced.enhancedPrompt
      }
    } catch (err) {
      // Enhancement is best-effort — fall through to original prompt
      console.warn('[image POST] Prompt enhancement failed, using original:', err instanceof Error ? err.message : err)
    }
  }

  // Build enriched prompt: (enhanced) user prompt + style-specific suffix
  const enrichedPrompt = `${finalUserPrompt}, ${preset.promptSuffix}`

  const apiKey = process.env.FAL_KEY ?? process.env.FAL_API_KEY

  // ── Demo mode ─────────────────────────────────────────────────────────
  if (!apiKey) {
    return NextResponse.json({
      images: buildDemoImages(count, prompt, style),
      cost: 0,
      status: 'demo',
      message: 'Set FAL_KEY to generate real images via Fal AI',
    })
  }

  // ── Credits: charge up front (skipped in DEMO_MODE) ─────────────────────
  // Charged per image multiplied by count. If generation fails below, we
  // refund the charge via earnTokens('REFUND', ...). Previously the catch
  // handler just returned 502 and left the user out-of-pocket — an image
  // route double-charge was one of the flagged audit bugs.
  const creditsToCharge = IMAGE_CREDIT_COST * count
  if (dbUserId) {
    try {
      await spendTokens(dbUserId, creditsToCharge, 'ai.image.generate', {
        prompt: prompt.slice(0, 120),
        style,
        count,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Credit charge failed'
      return NextResponse.json({ error: message }, { status: 402 })
    }
  }

  // ── Generate ──────────────────────────────────────────────────────────
  try {
    // Use caller-provided seed for reproducibility, or generate one for batch consistency
    const baseSeed = body.seed ?? Math.floor(Math.random() * 2_147_483_647)

    // Submit batch jobs in parallel (one Fal request per image)
    const jobPromises = Array.from({ length: count }, (_, i) =>
      falQueueSubmit(
        FAL_FLUX_MODEL,
        {
          prompt: enrichedPrompt,
          image_size: { width, height },
          num_inference_steps: preset.steps,
          guidance_scale: preset.guidance,
          num_images: 1,
          seed: baseSeed + i,
          enable_safety_checker: true,
        },
        apiKey,
      ),
    )

    const requestIds = await Promise.all(jobPromises)

    // Poll all jobs in parallel
    const results = await Promise.all(
      requestIds.map((id) => falQueuePoll<FalImageOutput>(FAL_FLUX_MODEL, id, apiKey)),
    )

    // Extract image URLs
    let imageUrls = results.flatMap(
      (r) => r.images?.map((img) => img.url) ?? [],
    )

    // ── Background removal (optional) ─────────────────────────────────
    if (shouldRemoveBg && imageUrls.length > 0) {
      const bgResults = await Promise.all(
        imageUrls.map((url) => removeBackground(url, apiKey)),
      )
      imageUrls = bgResults
    }

    // ── HD upscale (optional) ───────────────────────────────────────
    if (shouldUpscale && imageUrls.length > 0) {
      const upscaleResults = await Promise.all(
        imageUrls.map((url) => upscaleImage(url, apiKey)),
      )
      imageUrls = upscaleResults
    }

    // ── Watermark for free tier (optional) ──────────────────────────
    if (shouldWatermark) {
      imageUrls = imageUrls.map(applyWatermark)
    }

    // Build response array with { url, prompt, style } per the spec
    const images = imageUrls.map((url) => ({
      url,
      prompt,
      style,
    }))

    const cost =
      count * COST_PER_IMAGE
      + (shouldRemoveBg ? imageUrls.length * COST_BG_REMOVAL : 0)
      + (shouldUpscale ? imageUrls.length * COST_UPSCALE : 0)

    return NextResponse.json({
      images,
      cost,
      status: 'complete',
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[image POST] Generation failed:', message)

    // Refund the upfront credit charge if we actually spent any. Best-
    // effort: if the refund itself fails we log (the user can chargeback
    // via support) but we still return the original 502 to the caller.
    if (dbUserId) {
      try {
        await earnTokens(
          dbUserId,
          creditsToCharge,
          'REFUND',
          'Refund: ai.image.generate failed',
          {
            prompt: prompt.slice(0, 120),
            style,
            count,
            reason: message,
          },
        )
      } catch (refundErr) {
        console.error(
          '[image POST] REFUND FAILED — user charged for failed generation:',
          {
            userId: dbUserId,
            credits: creditsToCharge,
            generationError: message,
            refundError:
              refundErr instanceof Error ? refundErr.message : String(refundErr),
          },
        )
      }
    }

    return NextResponse.json(
      { error: 'Image generation failed', detail: message },
      { status: 502 },
    )
  }
}
