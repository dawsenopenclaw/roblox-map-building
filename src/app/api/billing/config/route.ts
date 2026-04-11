import { NextResponse } from 'next/server'
import { getBillingConfig } from '@/lib/billing-config'

/**
 * GET /api/billing/config
 *
 * Public endpoint — returns which Stripe price IDs are configured.
 * Returns NO secret values. Safe to call from the client.
 * Used by the pricing page to show "Contact us" instead of broken checkout buttons.
 *
 * Same data is also prerendered into the pricing server component so the
 * CTA buttons render in their final state on first paint.
 */
export async function GET() {
  return NextResponse.json(getBillingConfig())
}
