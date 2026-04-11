/**
 * POST /api/ai/icon/remix
 *
 * Generate a variation of an existing icon via FAL image-to-image.
 *
 * Body:
 *   {
 *     generatedAssetId: string   // the source icon to remix
 *     tweakPrompt:      string
 *     strength?:        number   // 0.1-1.0, default 0.55
 *   }
 *
 * Cost: ICON_REMIX_COST (8) tokens.
 *
 * Security:
 *   - Clerk auth required
 *   - Resolves dbUserId from clerkId at the route boundary (critical fix
 *     pattern — never pass clerkId to spendTokens or remixIcon)
 *   - remixIcon re-checks ownership so cross-user remixing is impossible
 *   - Rate limit: 30 remix requests per hour per user
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'

import { db } from '@/lib/db'
import { spendTokens } from '@/lib/tokens-server'
import {
  remixIcon,
  ICON_REMIX_COST,
} from '@/lib/icon-studio/icon-pipeline'
import {
  checkRateLimit,
  rateLimitHeaders,
  type RateLimitResult,
} from '@/lib/rate-limit'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

export const runtime = 'nodejs'
export const maxDuration = 300

const bodySchema = z.object({
  generatedAssetId: z.string().min(1).max(64),
  tweakPrompt: z.string().min(1).max(500),
  strength: z.number().min(0.1).max(1).optional(),
})

const remixRateLimiter: Ratelimit | null =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Ratelimit({
        redis: new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL,
          token: process.env.UPSTASH_REDIS_REST_TOKEN,
        }),
        limiter: Ratelimit.slidingWindow(30, '1 h'),
        prefix: 'ratelimit:ai:icon:remix',
      })
    : null

async function remixRateLimit(userId: string): Promise<RateLimitResult> {
  return checkRateLimit(remixRateLimiter, userId, 30, 3600)
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // 1. Clerk auth
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Rate limit
  const rl = await remixRateLimit(clerkId)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Icon remix rate limit exceeded (30/hour).' },
      { status: 429, headers: rateLimitHeaders(rl) },
    )
  }

  // 3. Validate body
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

  // 4. CRITICAL: resolve dbUserId BEFORE spendTokens. Do not pass clerkId.
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

  // 5. Deduct remix cost
  try {
    await spendTokens(
      dbUserId,
      ICON_REMIX_COST,
      `Icon Studio remix: ${body.generatedAssetId}`,
      { sourceAssetId: body.generatedAssetId, strength: body.strength },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'spend failed'
    const status = message.toLowerCase().includes('insufficient') ? 402 : 500
    return NextResponse.json({ error: message }, { status })
  }

  // 6. Run remix
  try {
    const icon = await remixIcon({
      sourceAssetId: body.generatedAssetId,
      tweakPrompt: body.tweakPrompt,
      userId: dbUserId,
      strength: body.strength,
    })

    return NextResponse.json(
      { status: 'complete', cost: ICON_REMIX_COST, icon },
      { headers: rateLimitHeaders(rl) },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'remix failed'
    console.error('[icon/remix] Remix failed:', message)

    // Refund tokens
    try {
      await db.$transaction(async (tx) => {
        const balance = await tx.tokenBalance.findUnique({
          where: { userId: dbUserId },
        })
        if (!balance) return
        await tx.tokenBalance.update({
          where: { userId: dbUserId },
          data: {
            balance: { increment: ICON_REMIX_COST },
            lifetimeSpent: { decrement: ICON_REMIX_COST },
          },
        })
        await tx.tokenTransaction.create({
          data: {
            balanceId: balance.id,
            type: 'REFUND',
            amount: ICON_REMIX_COST,
            description: `Icon Studio remix refund: ${message}`,
          },
        })
      })
    } catch (refundErr) {
      console.error('[icon/remix] Refund failed:', refundErr)
    }

    const status = message.toLowerCase().includes('not found') ? 404 : 502
    return NextResponse.json(
      { error: 'Icon remix failed', detail: message },
      { status },
    )
  }
}
