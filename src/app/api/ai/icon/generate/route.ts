/**
 * POST /api/ai/icon/generate
 *
 * Generate a batch (1-4) of Roblox game icons from a preset id + user prompt.
 *
 * Body (validated by Zod):
 *   {
 *     prompt:            string   (1-800 chars)
 *     presetId:          string   (one of ICON_PRESET_IDS)
 *     count:             1-4
 *     removeBackground?: boolean
 *     upscale?:          boolean
 *     sessionId?:        string
 *     seed?:             number
 *   }
 *
 * Security:
 *   - Clerk auth required (userId from @clerk/nextjs/server)
 *   - dbUserId is resolved from clerkId at the route boundary BEFORE
 *     calling spendTokens/generateIcon. This is the exact bug pattern the
 *     deep verification agent flagged in earlier routes — do not regress.
 *   - Rate limit: 30 icon generations per hour per user (custom window).
 *
 * Cost: ICON_GENERATION_COST (5) tokens per icon, deducted after FAL success.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'

import { db } from '@/lib/db'
import { moderateContent, getModerationMessage } from '@/lib/content-moderation'
import { spendTokens } from '@/lib/tokens-server'
import {
  generateIcon,
  ICON_GENERATION_COST,
} from '@/lib/icon-studio/icon-pipeline'
import { ICON_PRESET_IDS } from '@/lib/icon-studio/icon-presets'
import {
  checkRateLimit,
  rateLimitHeaders,
  type RateLimitResult,
} from '@/lib/rate-limit'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

export const runtime = 'nodejs'
export const maxDuration = 300

// ─── Validation ──────────────────────────────────────────────────────────

const bodySchema = z.object({
  prompt: z.string().min(1, 'prompt is required').max(800),
  presetId: z.enum(ICON_PRESET_IDS),
  count: z.number().int().min(1).max(4),
  removeBackground: z.boolean().optional().default(false),
  upscale: z.boolean().optional().default(false),
  sessionId: z.string().max(128).optional(),
  seed: z.number().int().min(0).max(2_147_483_647).optional(),
})

// ─── NSFW guard ─────────────────────────────────────────────────────────

const NSFW_TERMS = [
  'nude',
  'naked',
  'nsfw',
  'porn',
  'hentai',
  'xxx',
  'sexual',
  'erotic',
  'explicit',
  'gore',
  'gory',
  'mutilat',
  'child abuse',
  'underage',
  'loli',
  'shota',
]

function isNsfw(prompt: string): boolean {
  const lower = prompt.toLowerCase()
  return NSFW_TERMS.some((t) => lower.includes(t))
}

// ─── Dedicated rate limiter: 30/hour ─────────────────────────────────────

const iconRateLimiter: Ratelimit | null =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Ratelimit({
        redis: new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL,
          token: process.env.UPSTASH_REDIS_REST_TOKEN,
        }),
        limiter: Ratelimit.slidingWindow(30, '1 h'),
        prefix: 'ratelimit:ai:icon',
      })
    : null

async function iconRateLimit(
  userId: string,
): Promise<RateLimitResult> {
  return checkRateLimit(iconRateLimiter, userId, 30, 3600)
}

// ─── Handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  // 1. Clerk auth
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Rate limit (pre-DB to short-circuit hostile traffic)
  const rl = await iconRateLimit(clerkId)
  if (!rl.allowed) {
    return NextResponse.json(
      {
        error:
          'Icon rate limit exceeded. You can generate up to 30 icon batches per hour.',
      },
      { status: 429, headers: rateLimitHeaders(rl) },
    )
  }

  // 3. Parse + validate body
  let body: z.infer<typeof bodySchema>
  try {
    const parsed = bodySchema.safeParse(await req.json())
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

  // ── Content moderation — COPPA compliance (replaces old isNsfw check) ──
  try {
    const modResult = await moderateContent(body.prompt, { skipAI: false })
    if (!modResult.allowed) {
      return NextResponse.json({ error: getModerationMessage(modResult) }, { status: 422 })
    }
  } catch {
    console.warn('[icon/generate] Content moderation threw unexpectedly — allowing through')
  }

  // 4. CRITICAL: resolve dbUserId from clerkId BEFORE touching tokens/pipeline.
  //    The deep verification agent flagged this exact bug in other routes —
  //    spendTokens + generateIcon both take the internal User.id, never clerkId.
  const dbUser = await db.user.findUnique({
    where: { clerkId },
    select: { id: true },
  })
  if (!dbUser) {
    return NextResponse.json(
      { error: 'User record not found. Please complete onboarding.' },
      { status: 404 },
    )
  }
  const dbUserId = dbUser.id

  const totalCost =
    body.count * ICON_GENERATION_COST +
    (body.upscale ? body.count : 0) +
    (body.removeBackground ? body.count : 0)

  // 5. Deduct tokens up-front so failures roll back via DB transaction on
  //    our side (generateIcon marks rows failed; refund handled below).
  try {
    await spendTokens(
      dbUserId,
      totalCost,
      `Icon Studio: ${body.count}x ${body.presetId}`,
      {
        presetId: body.presetId,
        count: body.count,
        upscale: body.upscale,
        removeBackground: body.removeBackground,
      },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'spend failed'
    const status = message.toLowerCase().includes('insufficient') ? 402 : 500
    return NextResponse.json({ error: message }, { status })
  }

  // 6. Generate
  try {
    const result = await generateIcon({
      prompt: body.prompt,
      presetId: body.presetId,
      userId: dbUserId,
      sessionId: body.sessionId,
      count: body.count,
      upscale: body.upscale,
      removeBackground: body.removeBackground,
      seed: body.seed,
    })

    return NextResponse.json(
      {
        status: 'complete',
        cost: totalCost,
        preset: {
          id: result.preset.id,
          name: result.preset.name,
          category: result.preset.category,
        },
        icons: result.icons,
        generationMs: result.generationMs,
        enrichedPrompt: result.enrichedPrompt,
      },
      { headers: rateLimitHeaders(rl) },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'generation failed'
    console.error('[icon/generate] Generation failed:', message)

    // Refund the tokens so the user isn't billed for nothing.
    try {
      await db.$transaction(async (tx) => {
        const balance = await tx.tokenBalance.findUnique({
          where: { userId: dbUserId },
        })
        if (!balance) return
        await tx.tokenBalance.update({
          where: { userId: dbUserId },
          data: {
            balance: { increment: totalCost },
            lifetimeSpent: { decrement: totalCost },
          },
        })
        await tx.tokenTransaction.create({
          data: {
            balanceId: balance.id,
            type: 'REFUND',
            amount: totalCost,
            description: `Icon Studio refund: ${message}`,
          },
        })
      })
    } catch (refundErr) {
      console.error('[icon/generate] Refund failed:', refundErr)
    }

    return NextResponse.json(
      { error: 'Icon generation failed', detail: message },
      { status: 502 },
    )
  }
}
