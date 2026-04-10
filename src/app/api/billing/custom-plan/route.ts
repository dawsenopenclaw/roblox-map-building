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
  checkoutUrl: string
  mock:        boolean
}

/**
 * Calculate the USD price for a custom token plan.
 * Pure function — safe to import/reuse client-side.
 */
function calculateCustomPlanPrice(monthlyTokens: number): CustomPlanResponse {
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

  return {
    priceUSD,
    breakdown,
    // TODO(stripe): replace with real Stripe Checkout session once dynamic
    // price IDs for custom plans are wired up. For now we return a mock URL
    // so the frontend can exercise the full checkout flow end-to-end.
    checkoutUrl: `/billing/custom-plan/mock-checkout?tokens=${clamped}&price=${priceUSD}`,
    mock: true,
  }
}

export async function POST(req: NextRequest) {
  try {
    // Auth is optional for price-calc (allows anonymous slider previews),
    // but we still log the user if present for analytics/TODO Stripe.
    await auth().catch(() => null)

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

    const result = calculateCustomPlanPrice(parsed.data.monthlyTokens)
    return NextResponse.json(result)
  } catch (err) {
    Sentry.captureException(err, { tags: { route: 'billing/custom-plan' } })
    console.error('[billing/custom-plan] Unhandled error', err)
    return NextResponse.json(
      { error: 'Service temporarily unavailable — please try again later' },
      { status: 503 },
    )
  }
}
