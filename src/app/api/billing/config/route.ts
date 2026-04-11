import { NextResponse } from 'next/server'

/**
 * GET /api/billing/config
 *
 * Public endpoint — returns which Stripe price IDs are configured.
 * Returns NO secret values. Safe to call from the client.
 * Used by the pricing page to show "Contact us" instead of broken checkout buttons.
 */

function has(key: string): boolean {
  const val = process.env[key]
  if (!val || val.trim() === '') return false
  const lower = val.toLowerCase()
  // Reject placeholder values
  return !['placeholder', 'add_real_key', 'your_key_here', 'xxxxx'].some((p) => lower.includes(p))
}

export async function GET() {
  return NextResponse.json({
    stripeConfigured: has('STRIPE_SECRET_KEY'),
    subscriptions: {
      HOBBY:   { monthly: has('STRIPE_HOBBY_PRICE_ID'),   yearly: has('STRIPE_HOBBY_YEARLY_PRICE_ID') },
      CREATOR: { monthly: has('STRIPE_CREATOR_PRICE_ID'), yearly: has('STRIPE_CREATOR_YEARLY_PRICE_ID') },
      STUDIO:  { monthly: has('STRIPE_STUDIO_PRICE_ID'),  yearly: has('STRIPE_STUDIO_YEARLY_PRICE_ID') },
    },
    tokenPacks: {
      starter: has('STRIPE_TOKEN_STARTER_PRICE_ID'),
      creator: has('STRIPE_TOKEN_CREATOR_PRICE_ID'),
      pro:     has('STRIPE_TOKEN_PRO_PRICE_ID'),
    },
  })
}
