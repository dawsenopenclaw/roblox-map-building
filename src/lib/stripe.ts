import Stripe from 'stripe'
import { serverEnv } from './env'

if (!serverEnv.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set — cannot initialise Stripe client')
}
if (!serverEnv.STRIPE_WEBHOOK_SECRET) {
  // Warn loudly in non-production; hard-fail in production
  if (process.env.NODE_ENV === 'production') {
    throw new Error('STRIPE_WEBHOOK_SECRET is not set — webhook signature verification will be insecure')
  } else {
    console.warn('[stripe] STRIPE_WEBHOOK_SECRET is not set — webhook signature verification disabled in dev')
  }
}

export const stripe = new Stripe(serverEnv.STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
})

export async function createCustomer({ email, userId }: { email: string; userId: string }) {
  return stripe.customers.create({
    email,
    metadata: { userId },
  })
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
  return stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
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
  })
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
  return stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    automatic_tax: { enabled: true },
    customer_update: { address: 'auto' },
    metadata: { userId, type: 'token_pack', tokenPackSlug },
  })
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
