import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia',
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
  return stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET!)
}
