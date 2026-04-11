/**
 * POST /api/ai/ideas/generate
 *
 * Generate 1-5 viral Roblox game concepts for the authenticated user.
 * Cost: 20 credits per generation regardless of count (users can remix
 * cheaper if they want to twist one idea).
 *
 * Critical bug fix from deep audit: we resolve the internal User.id
 * (`dbUserId`) from Clerk's `userId` BEFORE calling `spendTokens`, because
 * `TokenBalance.userId` references `User.clerkId`, not the Clerk ID string.
 * Regressing this costs users credits they can't get back.
 *
 * Body: { userPrompt?, genre?, count: 1..5 }
 * Rate limit: 20/hour per user.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { spendTokens } from '@/lib/tokens-server'
import { generateIdeas } from '@/lib/idea-generator/idea-pipeline'
import { IDEA_GENRES } from '@/lib/idea-generator/idea-presets'

export const maxDuration = 120
export const runtime = 'nodejs'

const COST_PER_GENERATION = 20
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour
const RATE_LIMIT_MAX = 20

// Simple in-memory rate limiter keyed by dbUserId. Falls back gracefully
// if the process restarts. Upstash-based limiter is used elsewhere but is
// not required at this boundary.
const rateMap = new Map<string, { count: number; resetAt: number }>()

function checkRate(key: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const entry = rateMap.get(key)
  if (!entry || entry.resetAt < now) {
    const next = { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS }
    rateMap.set(key, next)
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetAt: next.resetAt }
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }
  entry.count += 1
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count, resetAt: entry.resetAt }
}

const bodySchema = z.object({
  userPrompt: z.string().max(1000).optional(),
  genre: z.enum(IDEA_GENRES as [string, ...string[]]).optional(),
  count: z.number().int().min(1).max(5).default(3),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  // ── Auth ────────────────────────────────────────────────────────────────
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── CRITICAL: resolve dbUserId from clerkId BEFORE spendTokens ─────────
  // TokenBalance.userId references User.clerkId (see schema), but we need
  // the internal User.id for any row that references User.id. The audit
  // flagged inconsistent resolution across routes — we standardize to
  // always fetch both values up front.
  const user = await db.user.findUnique({
    where: { clerkId },
    select: { id: true, clerkId: true },
  })
  if (!user) {
    return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
  }
  const dbUserId = user.id

  // ── Rate limit (per dbUserId) ──────────────────────────────────────────
  const rl = checkRate(dbUserId)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Max 20 idea generations per hour.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.floor(rl.resetAt / 1000)),
        },
      },
    )
  }

  // ── Parse body ─────────────────────────────────────────────────────────
  let body: z.infer<typeof bodySchema>
  try {
    const raw = await req.json()
    const parsed = bodySchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors.map((e) => e.message).join(', ') },
        { status: 422 },
      )
    }
    body = parsed.data
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // ── Spend credits (uses clerkId because TokenBalance → User.clerkId) ──
  try {
    await spendTokens(
      user.clerkId,
      COST_PER_GENERATION,
      `Idea Generator: ${body.count} ideas${body.genre ? ` (${body.genre})` : ''}`,
      { feature: 'idea-generator', count: body.count, genre: body.genre },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Token spend failed'
    return NextResponse.json(
      { error: message, code: 'INSUFFICIENT_CREDITS' },
      { status: 402 },
    )
  }

  // ── Generate ───────────────────────────────────────────────────────────
  try {
    const ideas = await generateIdeas({
      userPrompt: body.userPrompt,
      genre: body.genre as never,
      count: body.count,
      userId: dbUserId,
    })

    return NextResponse.json(
      {
        ideas,
        cost: COST_PER_GENERATION,
        remaining: rl.remaining,
      },
      {
        headers: {
          'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
          'X-RateLimit-Remaining': String(rl.remaining),
          'X-RateLimit-Reset': String(Math.floor(rl.resetAt / 1000)),
        },
      },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Idea generation failed'
    console.error('[ideas/generate] failed:', message)
    // NOTE: credits are already spent. Surfacing the error is the best
    // we can do — a full refund path belongs in the audit follow-up work.
    return NextResponse.json(
      { error: 'Idea generation failed', detail: message },
      { status: 502 },
    )
  }
}
