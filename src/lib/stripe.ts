// server-only removed — breaks prerender
import Stripe from 'stripe'
import { serverEnv } from '@/lib/env'

// Lazy initialization — don't throw during build when env vars aren't set

let _stripe: Stripe | null = null

export function getStripe(): Stripe | null {
  if (_stripe) return _stripe
  const key = serverEnv.STRIPE_SECRET_KEY
  if (!key) {
    console.warn('[stripe] STRIPE_SECRET_KEY is not set — billing features disabled')
    return null
  }
  _stripe = new Stripe(key, {
    apiVersion: '2025-02-24.acacia' as Stripe.LatestApiVersion,
    typescript: true,
  })
  return _stripe
}

/** Throws if Stripe is not configured — use in routes that REQUIRE billing. */
export function requireStripe(): Stripe {
  const s = getStripe()
  if (!s) throw new Error('STRIPE_SECRET_KEY is not set')
  return s
}

// Backward compat — lazy getter (throws if not configured)
export const stripe = new Proxy({} as Stripe, {
  get: (_, prop) => {
    const s = requireStripe()
    const val = (s as unknown as Record<string, unknown>)[prop as string]
    return typeof val === 'function' ? val.bind(s) : val
  },
})

export async function createCustomer({ email, userId }: { email: string; userId: string }) {
  return stripe.customers.create(
    {
      email,
      metadata: { userId },
    },
    { idempotencyKey: `customer_create_${userId}` },
  )
}

export async function createSubscriptionCheckoutSession({
  customerId,
  priceId,
  userId,
  successUrl,
  cancelUrl,
}: {
  customerId: string
  priceId: string
  userId: string
  successUrl: string
  cancelUrl: string
}) {
  // Scope idempotency key to UTC date so a user can retry on a new day
  // without getting back a stale/expired session from a previous attempt.
  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  return stripe.checkout.sessions.create(
    {
      customer: customerId,
      mode: 'subscription',
      // payment_method_types omitted — Stripe auto-shows all enabled methods
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: {
        metadata: { userId },
        trial_period_days: 14,
      },
      automatic_tax: { enabled: true },
      customer_update: { address: 'auto' },
      metadata: { userId, type: 'subscription' },
    },
    { idempotencyKey: `checkout_subscription_${userId}_${priceId}_${today}` },
  )
}

export async function createTokenPackCheckoutSession({
  customerId,
  priceId,
  userId,
  tokenPackSlug,
  successUrl,
  cancelUrl,
}: {
  customerId: string
  priceId: string
  userId: string
  tokenPackSlug: string
  successUrl: string
  cancelUrl: string
}) {
  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  return stripe.checkout.sessions.create(
    {
      customer: customerId,
      mode: 'payment',
      // payment_method_types omitted — Stripe auto-shows all enabled methods
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      automatic_tax: { enabled: true },
      customer_update: { address: 'auto' },
      metadata: { userId, type: 'token_pack', tokenPackSlug },
    },
    { idempotencyKey: `checkout_tokenpack_${userId}_${tokenPackSlug}_${today}` },
  )
}

/**
 * Creates a real Stripe Checkout Session for the Custom Plan tier on /pricing.
 *
 * The Custom Plan lets a user pick any monthly token allowance between
 * MIN_TOKENS and MAX_TOKENS via a slider, and the price is calculated
 * dynamically server-side. Rather than creating a persistent Stripe Price
 * for every possible combination (which pollutes the Stripe catalog and
 * risks duplicate/stale entries), we use Stripe's `price_data` inline
 * pattern — the line item carries the amount + recurrence directly in
 * the session.
 *
 * Customer metadata captures the token allowance so the webhook handler
 * can provision the correct monthly grant on subscription.created /
 * invoice.paid.
 */
export async function createCustomPlanCheckoutSession({
  customerId,
  userId,
  monthlyTokens,
  priceUSD,
  successUrl,
  cancelUrl,
}: {
  customerId: string
  userId: string
  monthlyTokens: number
  priceUSD: number
  successUrl: string
  cancelUrl: string
}) {
  const today = new Date().toISOString().slice(0, 10)
  return stripe.checkout.sessions.create(
    {
      customer: customerId,
      mode: 'subscription',
      // payment_method_types omitted — Stripe auto-shows all enabled methods
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: priceUSD * 100, // Stripe expects cents
            recurring: { interval: 'month' },
            product_data: {
              name: `ForjeGames Custom Plan — ${monthlyTokens.toLocaleString()} tokens/mo`,
              metadata: {
                plan: 'custom',
                monthlyTokens: String(monthlyTokens),
              },
            },
          },
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: {
        metadata: { userId, plan: 'custom', monthlyTokens: String(monthlyTokens) },
        trial_period_days: 14,
      },
      automatic_tax: { enabled: true },
      customer_update: { address: 'auto' },
      metadata: { userId, type: 'custom_plan', monthlyTokens: String(monthlyTokens) },
    },
    // Idempotency: same user + same token count + same UTC day returns the
    // same session. Changing the token slider produces a fresh session.
    { idempotencyKey: `checkout_custom_${userId}_${monthlyTokens}_${today}` },
  )
}

export async function createBillingPortalSession({ customerId, returnUrl }: { customerId: string; returnUrl: string }) {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
}

export function constructWebhookEvent(payload: string, signature: string) {
  const secret = serverEnv.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured — refusing to process webhook')
  }
  return stripe.webhooks.constructEvent(payload, signature, secret)
}
