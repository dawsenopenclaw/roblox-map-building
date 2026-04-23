/**
 * Shared billing config — single source of truth for which Stripe price IDs
 * are live. Used by:
 *   - /api/billing/config route (returns to the pricing client via SWR)
 *   - /pricing server component (prerenders the config so the CTA buttons
 *     render in their final state on first paint — no "Contact us" flash
 *     before the client-side fetch resolves)
 *
 * Returns NO secret values — only booleans. Safe to embed in server HTML.
 */

export type BillingConfig = {
  stripeConfigured: boolean
  subscriptions: {
    STARTER: { monthly: boolean; yearly: boolean }
    BUILDER: { monthly: boolean; yearly: boolean }
    CREATOR: { monthly: boolean; yearly: boolean }
    PRO:     { monthly: boolean; yearly: boolean }
    STUDIO:  { monthly: boolean; yearly: boolean }
    // Backward compat — old tier name
    HOBBY:   { monthly: boolean; yearly: boolean }
  }
  tokenPacks: {
    starter: boolean
    creator: boolean
    pro:     boolean
  }
}

export const EMPTY_BILLING_CONFIG: BillingConfig = {
  stripeConfigured: false,
  subscriptions: {
    STARTER: { monthly: false, yearly: false },
    BUILDER: { monthly: false, yearly: false },
    CREATOR: { monthly: false, yearly: false },
    PRO:     { monthly: false, yearly: false },
    STUDIO:  { monthly: false, yearly: false },
    HOBBY:   { monthly: false, yearly: false },
  },
  tokenPacks: { starter: false, creator: false, pro: false },
}

function has(key: string): boolean {
  const val = process.env[key]
  if (!val || val.trim() === '') return false
  const lower = val.toLowerCase()
  // Reject placeholder values so a stubbed env var does not falsely enable
  // the paid-tier buttons in prod.
  return !['placeholder', 'add_real_key', 'your_key_here', 'xxxxx'].some((p) => lower.includes(p))
}

export function getBillingConfig(): BillingConfig {
  const hobbyMonthly = has('STRIPE_HOBBY_PRICE_ID')
  const hobbyYearly = has('STRIPE_HOBBY_YEARLY_PRICE_ID')

  return {
    stripeConfigured: has('STRIPE_SECRET_KEY'),
    subscriptions: {
      // STARTER uses the old HOBBY price IDs (same $10 tier, renamed)
      STARTER: { monthly: has('STRIPE_STARTER_PRICE_ID') || hobbyMonthly, yearly: has('STRIPE_STARTER_YEARLY_PRICE_ID') || hobbyYearly },
      BUILDER: { monthly: has('STRIPE_BUILDER_PRICE_ID'), yearly: has('STRIPE_BUILDER_YEARLY_PRICE_ID') },
      CREATOR: { monthly: has('STRIPE_CREATOR_PRICE_ID'), yearly: has('STRIPE_CREATOR_YEARLY_PRICE_ID') },
      PRO:     { monthly: has('STRIPE_PRO_PRICE_ID'),     yearly: has('STRIPE_PRO_YEARLY_PRICE_ID') },
      STUDIO:  { monthly: has('STRIPE_STUDIO_PRICE_ID'),  yearly: has('STRIPE_STUDIO_YEARLY_PRICE_ID') },
      // Backward compat — maps to STARTER
      HOBBY:   { monthly: hobbyMonthly, yearly: hobbyYearly },
    },
    tokenPacks: {
      starter: has('STRIPE_TOKEN_STARTER_PRICE_ID'),
      creator: has('STRIPE_TOKEN_CREATOR_PRICE_ID'),
      pro:     has('STRIPE_TOKEN_PRO_PRICE_ID'),
    },
  }
}
