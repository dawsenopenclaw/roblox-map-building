import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import * as Sentry from '@sentry/nextjs'

// ─────────────────────────────────────────────────────────────────────────────
// Custom Plan pricing route
//
// Pricing model (v1):
//   - $0.001 per token (after the first 1,000 free tokens)
//   - $5 minimum charge
//   - Rounded to the nearest whole dollar
//
// Breakdown mirrors the approximate on-platform operation costs so the client
// can show users "what their tokens will buy". Keep these loosely synced with:
//   - src/app/api/ai/chat/route.ts       (INTENT_TOKEN_COST — chat = 2)
//   - src/components/editor/AssetGenerator.tsx (BASE_TOKEN_COSTS — mesh ≈ 80)
//   - src/app/api/ai/clothing/route.ts   (TOKEN_COST = 30 for images)
// ─────────────────────────────────────────────────────────────────────────────

const MIN_TOKENS = 1_000
const MAX_TOKENS = 100_000
const FREE_TOKEN_FLOOR = 1_000
const PRICE_PER_TOKEN_USD = 0.001
const MIN_PRICE_USD = 5

// Average token cost per operation — used for the "visual breakdown"
const AVG_TOKENS_PER_CHAT  = 2
const AVG_TOKENS_PER_IMAGE = 30
const AVG_TOKENS_PER_MESH  = 80

const schema = z.object({
  monthlyTokens: z
    .number({ invalid_type_error: 'monthlyTokens must be a number' })
    .int('monthlyTokens must be an integer')
    .min(MIN_TOKENS, `Minimum is ${MIN_TOKENS} tokens`)
    .max(MAX_TOKENS, `Maximum is ${MAX_TOKENS} tokens`),
})

interface CustomPlanBreakdown {
  monthlyTokens:       number
  freeTokens:          number
  billableTokens:      number
  pricePerToken:       number
  rawPriceUsd:         number
  approxChats:         number
  approxImages:        number
  approxMeshes:        number
}

interface CustomPlanResponse {
  priceUSD:    number
  breakdown:   CustomPlanBreakdown
  /** Present only when the caller is authenticated and Stripe is configured. */
  checkoutUrl?: string
  /**
   * `true` iff `checkoutUrl` is a real Stripe Checkout Session URL.
   * `false` means price-calc-only (slider preview before sign-in, or Stripe disabled).
   */
  mock: boolean
  /** Surfaces optional auth/Stripe errors without blocking the price preview. */
  checkoutError?: string
}

/**
 * Pure price-calculation helper. Safe to call during anonymous slider
 * previews — does not touch Stripe, DB, or auth. The /api/billing/custom-plan
 * POST handler wraps this with optional real-Stripe checkout for authed users.
 */
function calculateCustomPlanPrice(monthlyTokens: number): Pick<CustomPlanResponse, 'priceUSD' | 'breakdown'> {
  const clamped = Math.max(MIN_TOKENS, Math.min(MAX_TOKENS, Math.floor(monthlyTokens)))
  const billableTokens = Math.max(0, clamped - FREE_TOKEN_FLOOR)
  const rawPriceUsd    = billableTokens * PRICE_PER_TOKEN_USD
  const priceUSD       = Math.max(MIN_PRICE_USD, Math.round(rawPriceUsd))

  const breakdown: CustomPlanBreakdown = {
    monthlyTokens:  clamped,
    freeTokens:     FREE_TOKEN_FLOOR,
    billableTokens,
    pricePerToken:  PRICE_PER_TOKEN_USD,
    rawPriceUsd,
    approxChats:    Math.floor(clamped / AVG_TOKENS_PER_CHAT),
    approxImages:   Math.floor(clamped / AVG_TOKENS_PER_IMAGE),
    approxMeshes:   Math.floor(clamped / AVG_TOKENS_PER_MESH),
  }

  return { priceUSD, breakdown }
}

export async function POST(req: NextRequest) {
  try {
    const body   = await req.json().catch(() => ({}))
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          error:   'Invalid request',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      )
    }

    const { priceUSD, breakdown } = calculateCustomPlanPrice(parsed.data.monthlyTokens)

    // Try to upgrade the price-calc response to a real Stripe Checkout URL
    // when the caller is authed. Anonymous slider previews still get a
    // useful response (priceUSD + breakdown) — they just won't get a URL.
    const authResult = await auth().catch(() => null)
    const clerkId = authResult?.userId
    if (!clerkId) {
      return NextResponse.json<CustomPlanResponse>({
        priceUSD,
        breakdown,
        mock: false,
        // Deliberately omit checkoutUrl — the client can detect its absence
        // and redirect the user to /sign-up?plan=custom before retrying.
      })
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json<CustomPlanResponse>({
        priceUSD,
        breakdown,
        mock: true,
        checkoutError: 'Stripe not configured on this environment',
      })
    }

    const { db } = await import('@/lib/db')
    const { createCustomer, createCustomPlanCheckoutSession } = await import('@/lib/stripe')
    const { clientEnv } = await import('@/lib/env')

    const user = await db.user.findUnique({
      where: { clerkId },
      include: { subscription: true },
    })
    if (!user) {
      return NextResponse.json<CustomPlanResponse>({
        priceUSD,
        breakdown,
        mock: true,
        checkoutError: 'User record missing — re-authenticate and try again',
      })
    }

    // Ensure Stripe customer exists — mirrors the logic in /api/billing/checkout.
    let customerId = user.subscription?.stripeCustomerId
    if (!customerId || customerId.startsWith('pending_')) {
      const customer = await createCustomer({ email: user.email, userId: user.id })
      customerId = customer.id
      await db.subscription.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          stripeCustomerId: customerId,
          tier: 'FREE',
          status: 'ACTIVE',
        },
        update: { stripeCustomerId: customerId },
      })
    }

    const appUrl = clientEnv.NEXT_PUBLIC_APP_URL
    const session = await createCustomPlanCheckoutSession({
      customerId,
      userId: user.id,
      monthlyTokens: breakdown.monthlyTokens,
      priceUSD,
      successUrl: `${appUrl}/dashboard?upgraded=true&plan=custom`,
      cancelUrl: `${appUrl}/pricing`,
    })

    return NextResponse.json<CustomPlanResponse>({
      priceUSD,
      breakdown,
      checkoutUrl: session.url ?? undefined,
      mock: false,
    })
  } catch (err) {
    Sentry.captureException(err, { tags: { route: 'billing/custom-plan' } })
    console.error('[billing/custom-plan] Unhandled error', err)
    return NextResponse.json(
      { error: 'Service temporarily unavailable — please try again later' },
      { status: 503 },
    )
  }
}
