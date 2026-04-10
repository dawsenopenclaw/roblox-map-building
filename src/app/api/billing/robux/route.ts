/**
 * POST /api/billing/robux
 *
 * Initiates a Robux payment flow.  The user purchases a GamePass or
 * DevProduct inside the ForjeGames Roblox experience, which triggers a
 * webhook back to /api/webhooks/roblox to credit the account.
 *
 * This endpoint returns the GamePass/DevProduct details so the client can
 * link the user to the correct Roblox experience page.
 *
 * Body:
 *   { tier: string, robloxUserId?: number }
 *
 * Returns:
 *   {
 *     gamePassUrl:   string   -- URL to the Roblox GamePass/experience
 *     tier:          string
 *     robuxPrice:    number
 *     credits:       number
 *     usdEquivalent: number
 *     pollToken:     string   -- token to poll for purchase confirmation
 *   }
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import * as Sentry from '@sentry/nextjs'

// ── Robux pricing tiers ─────────────────────────────────────────────────────
// Exchange rate: ~286 Robux = $1 USD (based on DevEx rate)

const ROBUX_PRICES = {
  starter:     { usd: 10,  robux: 2860,  credits: 5000,   type: 'gamepass' as const },
  pro:         { usd: 50,  robux: 14300, credits: 30000,  type: 'gamepass' as const },
  studio:      { usd: 200, robux: 57200, credits: 150000, type: 'gamepass' as const },
  credits_100: { usd: 5,   robux: 1430,  credits: 2500,   type: 'devproduct' as const },
  credits_500: { usd: 25,  robux: 7150,  credits: 15000,  type: 'devproduct' as const },
} as const

type RobuxTier = keyof typeof ROBUX_PRICES

// ── GamePass / DevProduct IDs ───────────────────────────────────────────────
// These map to real GamePass/DevProduct IDs in the ForjeGames Roblox experience.
// Set via environment variables so they can be updated without code changes.

function getGamePassId(tier: RobuxTier): string {
  const envMap: Record<RobuxTier, string> = {
    starter:     'ROBLOX_GAMEPASS_STARTER_ID',
    pro:         'ROBLOX_GAMEPASS_PRO_ID',
    studio:      'ROBLOX_GAMEPASS_STUDIO_ID',
    credits_100: 'ROBLOX_DEVPRODUCT_CREDITS_100_ID',
    credits_500: 'ROBLOX_DEVPRODUCT_CREDITS_500_ID',
  }
  return process.env[envMap[tier]] ?? ''
}

// ── Validation ──────────────────────────────────────────────────────────────

const bodySchema = z.object({
  tier: z.enum(['starter', 'pro', 'studio', 'credits_100', 'credits_500']),
  robloxUserId: z.number().int().positive().optional(),
})

// ── Handler ─────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: 'Authentication required', redirect: '/sign-in' }, { status: 401 })
    }

    const raw = await req.json().catch(() => ({}))
    const parsed = bodySchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const { tier, robloxUserId } = parsed.data
    const pricing = ROBUX_PRICES[tier]
    const gamePassId = getGamePassId(tier)

    const experienceId = process.env.ROBLOX_EXPERIENCE_ID
    if (!experienceId) {
      return NextResponse.json(
        { error: 'Robux payments not configured yet', setup: 'Add ROBLOX_EXPERIENCE_ID to environment' },
        { status: 503 },
      )
    }

    // Generate a poll token so the client can check for purchase completion.
    // This is a simple signed token the webhook will match against.
    const { db } = await import('@/lib/db')
    const user = await db.user.findUnique({ where: { clerkId }, select: { id: true } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Create a pending Robux purchase record for webhook matching
    const pendingPurchase = await db.auditLog.create({
      data: {
        action: 'ROBUX_PURCHASE_INITIATED',
        resource: 'robux',
        resourceId: `${tier}_${Date.now()}`,
        userId: user.id,
        metadata: {
          tier,
          robux: pricing.robux,
          credits: pricing.credits,
          robloxUserId: robloxUserId ?? null,
          status: 'pending',
        },
      },
    })

    // Build the Roblox URL for the GamePass/experience
    const gamePassUrl = gamePassId
      ? `https://www.roblox.com/game-pass/${gamePassId}`
      : `https://www.roblox.com/games/${experienceId}`

    return NextResponse.json({
      gamePassUrl,
      experienceUrl: `https://www.roblox.com/games/${experienceId}`,
      tier,
      robuxPrice: pricing.robux,
      credits: pricing.credits,
      usdEquivalent: pricing.usd,
      type: pricing.type,
      pollToken: pendingPurchase.id,
    })
  } catch (err) {
    Sentry.captureException(err, { tags: { route: 'billing/robux' } })
    console.error('[billing/robux] Unhandled error', err)
    return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
  }
}

// ── Poll endpoint ───────────────────────────────────────────────────────────
// GET /api/billing/robux?pollToken=xxx — checks if a Robux purchase completed

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const pollToken = req.nextUrl.searchParams.get('pollToken')
    if (!pollToken) return NextResponse.json({ error: 'pollToken required' }, { status: 400 })

    const { db } = await import('@/lib/db')

    // Look up the audit log entry to check status
    const entry = await db.auditLog.findUnique({
      where: { id: pollToken },
      select: { metadata: true },
    })

    if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const metadata = entry.metadata as Record<string, unknown> | null
    const status = metadata?.status ?? 'pending'

    return NextResponse.json({
      status,
      credited: status === 'completed',
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
