---
phase: 01-foundation
plan: C
type: execute
wave: 2
depends_on:
  - 01-PLAN-A
files_modified:
  - apps/api/src/routes/billing.ts
  - apps/api/src/routes/tokens.ts
  - apps/api/src/routes/charity.ts
  - apps/api/src/webhooks/stripe.ts
  - src/app/api/webhooks/stripe/route.ts
  - src/app/(app)/dashboard/page.tsx
  - src/components/TokenBalanceWidget.tsx
  - src/lib/stripe.ts
  - src/lib/tokens-server.ts
  - src/lib/charity.ts
autonomous: true
requirements:
  - FOUND-04
  - FOUND-05
  - FOUND-06

must_haves:
  truths:
    - "User can subscribe to Hobby, Creator, or Studio tier via Stripe Checkout"
    - "Stripe webhook updates the Subscription row in Postgres on payment events"
    - "User can purchase token packs and balance increases immediately"
    - "Token balance displays in the dashboard UI with live count"
    - "10% of every payment is transferred to the charity Stripe account"
    - "Charity selection (3 options) is stored per user and applied to their donations"
    - "Token spend deducts from balance; balance never goes below 0"
  artifacts:
    - path: "src/lib/stripe.ts"
      provides: "Stripe singleton + helper functions for checkout, webhooks, transfers"
      exports: ["stripe", "createCheckoutSession", "createCustomer"]
    - path: "apps/api/src/routes/billing.ts"
      provides: "Hono routes for billing operations"
      exports: ["billingRoutes"]
    - path: "apps/api/src/webhooks/stripe.ts"
      provides: "Stripe webhook handler for Hono backend"
      exports: ["stripeWebhookRoute"]
    - path: "src/components/TokenBalanceWidget.tsx"
      provides: "Token balance display component"
  key_links:
    - from: "apps/api/src/webhooks/stripe.ts"
      to: "db.subscription.update"
      via: "customer.subscription.updated event"
      pattern: "prisma.subscription.update"
    - from: "apps/api/src/routes/charity.ts"
      to: "stripe.transfers.create"
      via: "10% donation on invoice.paid"
      pattern: "stripe.transfers.create"
    - from: "src/components/TokenBalanceWidget.tsx"
      to: "/api/tokens/balance"
      via: "SWR fetch"
      pattern: "useSWR.*tokens/balance"
---

<objective>
Integrate Stripe Billing for subscription tiers and token pack purchases, implement the token balance system with usage tracking, and wire the 10% charity auto-donation on every payment.

Purpose: Revenue is the foundation of the platform. Token metering enables fair usage billing. The charity donation is a core brand differentiator that must fire reliably on every payment.
Output: Stripe Checkout for subscriptions and token packs, Stripe webhook handler that updates DB on payment events, token balance system with spend/earn tracking, charity donation auto-transfer, and a token balance widget in the dashboard.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/01-foundation/01-A-SUMMARY.md

<interfaces>
<!-- From Plan A — use these directly -->

From prisma/schema.prisma:
```prisma
model Subscription {
  id                   String             @id @default(cuid())
  userId               String             @unique
  stripeCustomerId     String             @unique
  stripeSubscriptionId String?            @unique
  stripePriceId        String?
  tier                 SubscriptionTier   @default(FREE)
  status               SubscriptionStatus @default(ACTIVE)
  currentPeriodStart   DateTime?
  currentPeriodEnd     DateTime?
}

model TokenBalance {
  id            String @id @default(cuid())
  userId        String @unique
  balance       Int    @default(0)
  transactions  TokenTransaction[]
}

model TokenTransaction {
  id          String              @id @default(cuid())
  balanceId   String
  type        TokenTransactionType
  amount      Int
  description String
}

model CharityDonation {
  id               String @id @default(cuid())
  userId           String
  stripeTransferId String? @unique
  charitySlug      String
  amountCents      Int
  status           DonationStatus @default(PENDING)
}

enum SubscriptionTier { FREE HOBBY CREATOR STUDIO }
enum TokenTransactionType { PURCHASE SPEND REFUND BONUS ROLLOVER SUBSCRIPTION_GRANT }
```

From src/lib/db.ts:
```typescript
export const db: PrismaClient
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Stripe client + Checkout session + subscription tier definitions</name>
  <files>
    src/lib/stripe.ts
    src/lib/subscription-tiers.ts
    src/app/api/billing/checkout/route.ts
    src/app/api/billing/portal/route.ts
    src/app/api/billing/token-packs/route.ts
  </files>
  <behavior>
    - stripe singleton uses STRIPE_SECRET_KEY, throws if missing
    - createCheckoutSession creates a Stripe Checkout session for subscription or one-time payment
    - Subscription tier definitions: FREE (0, 500 tokens/mo), HOBBY ($9.99, 2000 tokens/mo), CREATOR ($24.99, 7000 tokens/mo), STUDIO ($49.99, 20000 tokens/mo)
    - Token pack definitions: Starter (1000 tokens, $10), Creator (5000 tokens, $45), Pro (15000 tokens, $120)
    - POST /api/billing/checkout with { tier, userId } returns { url: checkoutSessionUrl }
    - POST /api/billing/portal with { customerId } returns { url: billingPortalUrl }
    - Test: getTierTokenAllowance('HOBBY') === 2000
    - Test: getTierTokenAllowance('FREE') === 500
    - Test: getTokenPackBySlug('starter') returns { tokens: 1000, priceCents: 1000 }
  </behavior>
  <action>
Install Stripe: `npm install stripe --workspace=. && npm install @stripe/stripe-js --workspace=.`

**src/lib/subscription-tiers.ts** — canonical tier definitions (single source of truth):
```typescript
export const SUBSCRIPTION_TIERS = {
  FREE: {
    name: 'Free',
    priceMonthly: 0,
    priceYearly: 0,
    tokensPerMonth: 500,
    features: ['500 tokens/month', 'Basic terrain generation', 'Community support'],
    stripePriceIdMonthly: process.env.STRIPE_FREE_PRICE_ID || '',
    stripePriceIdYearly: '',
  },
  HOBBY: {
    name: 'Hobby',
    priceMonthly: 999, // cents
    priceYearly: 9590, // cents (20% discount)
    tokensPerMonth: 2000,
    features: ['2,000 tokens/month', 'Voice-to-game', 'Image-to-map', 'Email support'],
    stripePriceIdMonthly: process.env.STRIPE_HOBBY_PRICE_ID || '',
    stripePriceIdYearly: process.env.STRIPE_HOBBY_YEARLY_PRICE_ID || '',
  },
  CREATOR: {
    name: 'Creator',
    priceMonthly: 2499,
    priceYearly: 23990,
    tokensPerMonth: 7000,
    features: ['7,000 tokens/month', 'All Hobby features', 'Game DNA scanner', 'Priority support'],
    stripePriceIdMonthly: process.env.STRIPE_CREATOR_PRICE_ID || '',
    stripePriceIdYearly: process.env.STRIPE_CREATOR_YEARLY_PRICE_ID || '',
  },
  STUDIO: {
    name: 'Studio',
    priceMonthly: 4999,
    priceYearly: 47990,
    tokensPerMonth: 20000,
    features: ['20,000 tokens/month', 'All Creator features', 'Team collaboration', 'API access', 'Dedicated support'],
    stripePriceIdMonthly: process.env.STRIPE_STUDIO_PRICE_ID || '',
    stripePriceIdYearly: process.env.STRIPE_STUDIO_YEARLY_PRICE_ID || '',
  },
} as const

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS

export function getTierTokenAllowance(tier: SubscriptionTier): number {
  return SUBSCRIPTION_TIERS[tier].tokensPerMonth
}

export const TOKEN_PACKS = [
  { slug: 'starter', name: 'Starter Pack', tokens: 1000, priceCents: 1000, stripePriceId: process.env.STRIPE_TOKEN_STARTER_PRICE_ID || '' },
  { slug: 'creator', name: 'Creator Pack', tokens: 5000, priceCents: 4500, stripePriceId: process.env.STRIPE_TOKEN_CREATOR_PRICE_ID || '' },
  { slug: 'pro', name: 'Pro Pack', tokens: 15000, priceCents: 12000, stripePriceId: process.env.STRIPE_TOKEN_PRO_PRICE_ID || '' },
] as const

export function getTokenPackBySlug(slug: string) {
  return TOKEN_PACKS.find(p => p.slug === slug) || null
}
```

**src/lib/stripe.ts** — Stripe client singleton + helpers:
```typescript
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
```

**src/app/api/billing/checkout/route.ts** — Next.js API route for creating checkout sessions:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { createSubscriptionCheckoutSession, createTokenPackCheckoutSession, createCustomer, stripe } from '@/lib/stripe'
import { SUBSCRIPTION_TIERS, getTokenPackBySlug } from '@/lib/subscription-tiers'
import { z } from 'zod'

const schema = z.union([
  z.object({ type: z.literal('subscription'), tier: z.enum(['HOBBY', 'CREATOR', 'STUDIO']), yearly: z.boolean().optional() }),
  z.object({ type: z.literal('token_pack'), packSlug: z.string() }),
])

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.user.findUnique({ where: { clerkId }, include: { subscription: true } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  // Ensure Stripe customer exists
  let customerId = user.subscription?.stripeCustomerId
  if (!customerId || customerId.startsWith('pending_')) {
    const customer = await createCustomer({ email: user.email, userId: user.id })
    customerId = customer.id
    await db.subscription.update({
      where: { userId: user.id },
      data: { stripeCustomerId: customerId },
    })
  }

  if (parsed.data.type === 'subscription') {
    const tier = SUBSCRIPTION_TIERS[parsed.data.tier]
    const priceId = parsed.data.yearly ? tier.stripePriceIdYearly : tier.stripePriceIdMonthly
    if (!priceId) return NextResponse.json({ error: 'Price not configured' }, { status: 500 })

    const session = await createSubscriptionCheckoutSession({
      customerId,
      priceId,
      userId: user.id,
      successUrl: `${appUrl}/dashboard?upgraded=true`,
      cancelUrl: `${appUrl}/pricing`,
    })
    return NextResponse.json({ url: session.url })
  }

  if (parsed.data.type === 'token_pack') {
    const pack = getTokenPackBySlug(parsed.data.packSlug)
    if (!pack || !pack.stripePriceId) return NextResponse.json({ error: 'Token pack not found' }, { status: 404 })

    const session = await createTokenPackCheckoutSession({
      customerId,
      priceId: pack.stripePriceId,
      userId: user.id,
      tokenPackSlug: pack.slug,
      successUrl: `${appUrl}/dashboard?tokens_added=true`,
      cancelUrl: `${appUrl}/dashboard`,
    })
    return NextResponse.json({ url: session.url })
  }
}
```

**src/app/api/billing/portal/route.ts** — create billing portal session:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { createBillingPortalSession } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await db.user.findUnique({ where: { clerkId }, include: { subscription: true } })
  if (!user?.subscription?.stripeCustomerId) return NextResponse.json({ error: 'No billing account' }, { status: 404 })
  const session = await createBillingPortalSession({
    customerId: user.subscription.stripeCustomerId,
    returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  })
  return NextResponse.json({ url: session.url })
}
```

Add all new env vars to .env.example: STRIPE_HOBBY_YEARLY_PRICE_ID, STRIPE_CREATOR_YEARLY_PRICE_ID, STRIPE_STUDIO_YEARLY_PRICE_ID, STRIPE_TOKEN_STARTER_PRICE_ID, STRIPE_TOKEN_CREATOR_PRICE_ID, STRIPE_TOKEN_PRO_PRICE_ID.
  </action>
  <verify>
    <automated>cd "C:/Users/Dawse/OneDrive/Desktop/roblox-map-building" && npx tsc --noEmit 2>&1 | grep -c "error TS" || echo "0"</automated>
  </verify>
  <done>
    TypeScript compiles without errors.
    SUBSCRIPTION_TIERS and TOKEN_PACKS constants exist with all tiers/packs defined.
    getTierTokenAllowance('HOBBY') returns 2000.
    POST /api/billing/checkout returns {url} for both subscription and token_pack types.
    POST /api/billing/portal returns {url} for billing portal.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Stripe webhook handler + token balance system + charity donation</name>
  <files>
    src/app/api/webhooks/stripe/route.ts
    src/lib/tokens-server.ts
    src/lib/charity.ts
    apps/api/src/routes/tokens.ts
  </files>
  <behavior>
    - Stripe webhook verifies svix/stripe-signature before processing any event
    - invoice.paid event: grants monthly token allowance to subscription user
    - checkout.session.completed for token_pack: credits the purchased token amount
    - checkout.session.completed triggers 10% charity transfer via Stripe Transfers API
    - customer.subscription.updated: updates Subscription row with new tier/status
    - customer.subscription.deleted: sets status to CANCELED
    - spendTokens(userId, amount, description): deducts from balance, creates TokenTransaction, throws if insufficient
    - earnTokens(userId, amount, type, description): adds to balance, creates TokenTransaction
    - Test: spendTokens with insufficient balance throws "Insufficient token balance"
    - Test: earnTokens(userId, 100, 'PURCHASE', 'test') increments balance by 100
    - Test: charity 10% calculation: $9.99 payment → $1.00 (rounded) charity transfer
  </behavior>
  <action>
**src/lib/tokens-server.ts** — token balance operations (server-only):
```typescript
import { db } from './db'

export async function earnTokens(
  userId: string,
  amount: number,
  type: 'PURCHASE' | 'BONUS' | 'ROLLOVER' | 'SUBSCRIPTION_GRANT' | 'REFUND',
  description: string,
  metadata?: Record<string, unknown>
) {
  return db.$transaction(async (tx) => {
    const balance = await tx.tokenBalance.update({
      where: { userId },
      data: {
        balance: { increment: amount },
        lifetimeEarned: { increment: amount },
      },
    })
    await tx.tokenTransaction.create({
      data: {
        balanceId: balance.id,
        type,
        amount,
        description,
        metadata: metadata as any,
      },
    })
    return balance
  })
}

export async function spendTokens(
  userId: string,
  amount: number,
  description: string,
  metadata?: Record<string, unknown>
) {
  return db.$transaction(async (tx) => {
    const current = await tx.tokenBalance.findUnique({ where: { userId } })
    if (!current) throw new Error('Token balance not found')
    if (current.balance < amount) throw new Error('Insufficient token balance')

    const balance = await tx.tokenBalance.update({
      where: { userId },
      data: {
        balance: { decrement: amount },
        lifetimeSpent: { increment: amount },
      },
    })
    await tx.tokenTransaction.create({
      data: {
        balanceId: balance.id,
        type: 'SPEND',
        amount: -amount,
        description,
        metadata: metadata as any,
      },
    })
    return balance
  })
}

export async function getTokenBalance(userId: string) {
  return db.tokenBalance.findUnique({
    where: { userId },
    include: { transactions: { orderBy: { createdAt: 'desc' }, take: 20 } },
  })
}
```

**src/lib/charity.ts** — charity auto-donation logic:
```typescript
import { stripe } from './stripe'
import { db } from './db'

export const CHARITIES = [
  { slug: 'code-org', name: 'Code.org', description: 'Computer science education for all students', url: 'https://code.org' },
  { slug: 'girls-who-code', name: 'Girls Who Code', description: 'Closing the gender gap in tech', url: 'https://girlswhocode.com' },
  { slug: 'khan-academy', name: 'Khan Academy', description: 'Free world-class education for anyone', url: 'https://khanacademy.org' },
] as const

export type CharitySlug = typeof CHARITIES[number]['slug']

export function calculateDonationAmount(paymentAmountCents: number): number {
  return Math.floor(paymentAmountCents * 0.1)
}

export async function processDonation({
  userId,
  paymentAmountCents,
  sourcePurchaseId,
}: {
  userId: string
  paymentAmountCents: number
  sourcePurchaseId: string
}) {
  const user = await db.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error('User not found')

  const charitySlug = (user.charityChoice as CharitySlug) || 'code-org'
  const charity = CHARITIES.find(c => c.slug === charitySlug) || CHARITIES[0]
  const donationAmountCents = calculateDonationAmount(paymentAmountCents)

  if (donationAmountCents < 50) return null // Stripe minimum transfer is $0.50

  const donationRecord = await db.charityDonation.create({
    data: {
      userId,
      charitySlug: charity.slug,
      charityName: charity.name,
      amountCents: donationAmountCents,
      sourcePurchaseId,
      status: 'PROCESSING',
    },
  })

  try {
    const transfer = await stripe.transfers.create({
      amount: donationAmountCents,
      currency: 'usd',
      destination: process.env.STRIPE_CHARITY_ACCOUNT_ID!,
      transfer_group: `donation_${donationRecord.id}`,
      metadata: {
        donationId: donationRecord.id,
        userId,
        charitySlug: charity.slug,
        sourcePurchaseId,
      },
    })

    await db.charityDonation.update({
      where: { id: donationRecord.id },
      data: { stripeTransferId: transfer.id, status: 'COMPLETED', processedAt: new Date() },
    })

    return transfer
  } catch (err) {
    await db.charityDonation.update({
      where: { id: donationRecord.id },
      data: { status: 'FAILED' },
    })
    console.error('Charity donation failed:', err)
    throw err
  }
}
```

**src/app/api/webhooks/stripe/route.ts** — Stripe webhook handler. This is the critical path for all payment events:
```typescript
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { stripe, constructWebhookEvent } from '@/lib/stripe'
import { db } from '@/lib/db'
import { earnTokens } from '@/lib/tokens-server'
import { processDonation } from '@/lib/charity'
import { getTierTokenAllowance } from '@/lib/subscription-tiers'
import type Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const headerPayload = await headers()
  const signature = headerPayload.get('stripe-signature')

  if (!signature) return NextResponse.json({ error: 'Missing signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = constructWebhookEvent(body, signature)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        if (!userId) break

        // Token pack purchase
        if (session.metadata?.type === 'token_pack' && session.metadata.tokenPackSlug) {
          const { getTokenPackBySlug } = await import('@/lib/subscription-tiers')
          const pack = getTokenPackBySlug(session.metadata.tokenPackSlug)
          if (pack) {
            await earnTokens(userId, pack.tokens, 'PURCHASE', `Purchased ${pack.name}`, { sessionId: session.id })
          }
        }

        // 10% charity donation on all payments
        if (session.amount_total && session.amount_total > 0) {
          await processDonation({
            userId,
            paymentAmountCents: session.amount_total,
            sourcePurchaseId: session.id,
          }).catch(err => console.error('Donation failed (non-blocking):', err))
        }
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = invoice.subscription as string
        if (!subscriptionId) break

        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const userId = subscription.metadata?.userId
        if (!userId) break

        // Grant monthly token allowance
        const sub = await db.subscription.findFirst({ where: { stripeSubscriptionId: subscriptionId } })
        if (sub) {
          const allowance = getTierTokenAllowance(sub.tier as any)
          await earnTokens(userId, allowance, 'SUBSCRIPTION_GRANT', `Monthly ${sub.tier} token grant`, { invoiceId: invoice.id })
        }

        // Charity donation on recurring billing
        if (invoice.amount_paid > 0) {
          await processDonation({
            userId,
            paymentAmountCents: invoice.amount_paid,
            sourcePurchaseId: invoice.id,
          }).catch(err => console.error('Recurring donation failed (non-blocking):', err))
        }
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId
        if (!userId) break

        const priceId = subscription.items.data[0]?.price.id
        const tierEntry = Object.entries(
          (await import('@/lib/subscription-tiers')).SUBSCRIPTION_TIERS
        ).find(([, tier]) => tier.stripePriceIdMonthly === priceId || (tier as any).stripePriceIdYearly === priceId)
        const tier = (tierEntry?.[0] || 'FREE') as 'FREE' | 'HOBBY' | 'CREATOR' | 'STUDIO'

        await db.subscription.update({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            tier,
            status: subscription.status.toUpperCase() as any,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            stripePriceId: priceId,
          },
        })
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await db.subscription.update({
          where: { stripeSubscriptionId: subscription.id },
          data: { status: 'CANCELED', cancelAtPeriodEnd: false },
        })
        break
      }
    }
  } catch (err) {
    console.error(`Webhook handler failed for ${event.type}:`, err)
    // Return 200 anyway — Stripe will retry if we return 5xx
    // Log to Sentry in production
  }

  return NextResponse.json({ received: true })
}
```

**apps/api/src/routes/tokens.ts** — Hono routes for token operations:
```typescript
import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth'
import { db } from '../lib/db'

export const tokenRoutes = new Hono()

tokenRoutes.get('/balance', requireAuth, async (c) => {
  const clerkId = c.get('clerkId')
  const user = await db.user.findUnique({
    where: { clerkId },
    include: { tokenBalance: { include: { transactions: { orderBy: { createdAt: 'desc' }, take: 10 } } } },
  })
  if (!user?.tokenBalance) return c.json({ balance: 0, transactions: [] })
  return c.json({
    balance: user.tokenBalance.balance,
    lifetimeEarned: user.tokenBalance.lifetimeEarned,
    lifetimeSpent: user.tokenBalance.lifetimeSpent,
    transactions: user.tokenBalance.transactions,
  })
})
```

Register tokenRoutes in apps/api/src/index.ts:
```typescript
import { tokenRoutes } from './routes/tokens'
app.route('/api/tokens', tokenRoutes)
```
  </action>
  <verify>
    <automated>cd "C:/Users/Dawse/OneDrive/Desktop\roblox-map-building" && npx tsc --noEmit 2>&1 | grep -c "error TS" || echo "0"</automated>
  </verify>
  <done>
    TypeScript compiles without errors.
    Stripe webhook route at /api/webhooks/stripe handles: checkout.session.completed, invoice.paid, customer.subscription.updated, customer.subscription.deleted.
    spendTokens throws on insufficient balance.
    earnTokens creates TokenTransaction and increments balance atomically.
    processDonation: calculates 10% with floor rounding, creates CharityDonation record, calls stripe.transfers.create, handles failures non-blocking.
    GET /api/tokens/balance returns {balance, lifetimeEarned, lifetimeSpent, transactions}.
  </done>
</task>

<task type="auto">
  <name>Task 3: Token balance dashboard widget + charity selection UI</name>
  <files>
    src/components/TokenBalanceWidget.tsx
    src/components/CharitySelector.tsx
    src/app/(app)/dashboard/page.tsx
    src/app/(app)/layout.tsx
    src/app/api/user/charity/route.ts
  </files>
  <action>
**src/components/TokenBalanceWidget.tsx** — displays current token balance. Uses SWR for polling:
```tsx
'use client'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function TokenBalanceWidget() {
  const { data, isLoading } = useSWR('/api/tokens/balance', fetcher, { refreshInterval: 30000 })

  if (isLoading) return (
    <div className="bg-[#0D1231] border border-white/10 rounded-xl p-4 animate-pulse">
      <div className="h-4 bg-white/10 rounded w-24 mb-2" />
      <div className="h-8 bg-white/10 rounded w-16" />
    </div>
  )

  return (
    <div className="bg-[#0D1231] border border-white/10 rounded-xl p-4">
      <p className="text-gray-400 text-sm font-medium uppercase tracking-wide">Token Balance</p>
      <p className="text-3xl font-bold text-[#FFB81C] mt-1">{(data?.balance || 0).toLocaleString()}</p>
      <p className="text-gray-500 text-xs mt-1">{(data?.lifetimeSpent || 0).toLocaleString()} spent lifetime</p>
    </div>
  )
}
```

Install swr: `npm install swr --workspace=.`

**src/components/CharitySelector.tsx** — lets user pick which charity gets their 10%:
```tsx
'use client'
import { useState } from 'react'
import { CHARITIES } from '@/lib/charity'

export function CharitySelector({ current }: { current?: string }) {
  const [selected, setSelected] = useState(current || 'code-org')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function save(slug: string) {
    setSaving(true)
    await fetch('/api/user/charity', { method: 'POST', body: JSON.stringify({ charitySlug: slug }), headers: { 'Content-Type': 'application/json' } })
    setSelected(slug)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="bg-[#0D1231] border border-white/10 rounded-xl p-4">
      <p className="text-white font-medium mb-1">Your 10% goes to</p>
      <p className="text-gray-400 text-sm mb-4">10% of every payment is automatically donated.</p>
      <div className="space-y-2">
        {CHARITIES.map(charity => (
          <button
            key={charity.slug}
            onClick={() => save(charity.slug)}
            className={`w-full text-left p-3 rounded-lg border transition-colors ${selected === charity.slug ? 'border-[#FFB81C] bg-[#FFB81C]/10 text-white' : 'border-white/10 text-gray-400 hover:border-white/30'}`}
          >
            <span className="font-medium">{charity.name}</span>
            <span className="block text-xs mt-0.5 opacity-70">{charity.description}</span>
          </button>
        ))}
      </div>
      {saved && <p className="text-[#FFB81C] text-sm mt-2">Saved!</p>}
    </div>
  )
}
```

**src/app/api/user/charity/route.ts** — updates user's charity preference:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { CHARITIES } from '@/lib/charity'
import { z } from 'zod'

const validSlugs = CHARITIES.map(c => c.slug) as [string, ...string[]]
const schema = z.object({ charitySlug: z.enum(validSlugs) })

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid charity' }, { status: 400 })
  await db.user.update({ where: { clerkId }, data: { charityChoice: parsed.data.charitySlug } })
  return NextResponse.json({ ok: true })
}
```

**src/app/(app)/layout.tsx** — app shell layout (for /dashboard and other authenticated routes):
```tsx
import { requireAuthUser } from '@/lib/clerk'
import { redirect } from 'next/navigation'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuthUser().catch(() => null)
  if (!user) redirect('/sign-in')
  if (user.isUnder13 && !user.parentConsentAt) redirect('/onboarding/parental-consent')
  return (
    <div className="min-h-screen bg-[#0A0E27]">
      <nav className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <span className="text-[#FFB81C] font-bold text-lg">RobloxForge</span>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">{user.email}</span>
        </div>
      </nav>
      <main className="p-6">{children}</main>
    </div>
  )
}
```

**src/app/(app)/dashboard/page.tsx** — placeholder dashboard with token widget and charity selector:
```tsx
import { requireAuthUser } from '@/lib/clerk'
import { TokenBalanceWidget } from '@/components/TokenBalanceWidget'
import { CharitySelector } from '@/components/CharitySelector'

export default async function DashboardPage() {
  const user = await requireAuthUser()
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <TokenBalanceWidget />
        <div className="bg-[#0D1231] border border-white/10 rounded-xl p-4">
          <p className="text-gray-400 text-sm font-medium uppercase tracking-wide">Subscription</p>
          <p className="text-3xl font-bold text-white mt-1">{user.subscription?.tier || 'FREE'}</p>
        </div>
      </div>
      <div className="max-w-md">
        <CharitySelector current={user.charityChoice || undefined} />
      </div>
    </div>
  )
}
```

Create `src/app/(app)/tokens/` directory with a route group — this is where Phase 4 will add the full token UI.
  </action>
  <verify>
    <automated>cd "C:/Users/Dawse/OneDrive/Desktop/roblox-map-building" && npx tsc --noEmit 2>&1 | grep -c "error TS" || echo "0"</automated>
  </verify>
  <done>
    TypeScript compiles without errors.
    Dashboard renders at /dashboard with TokenBalanceWidget and CharitySelector.
    TokenBalanceWidget fetches from /api/tokens/balance via SWR, shows balance in gold (#FFB81C).
    CharitySelector shows 3 charity options, POST /api/user/charity updates charityChoice.
    App layout redirects under-13 users without consent to /onboarding/parental-consent.
  </done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` — zero errors
2. POST /api/billing/checkout with { type: 'subscription', tier: 'HOBBY' } returns { url: 'https://checkout.stripe.com/...' } (requires test mode Stripe keys)
3. Stripe webhook: simulate `checkout.session.completed` event → TokenBalance.balance increments by pack tokens
4. Stripe webhook: simulate `invoice.paid` → CharityDonation record created with 10% of invoice amount
5. Stripe webhook: invalid signature → returns 400
6. GET /api/tokens/balance with auth → returns { balance: number, transactions: [] }
7. spendTokens with balance=0 → throws "Insufficient token balance"
8. Dashboard page renders with dark background, TokenBalanceWidget in gold
9. CharitySelector shows Code.org, Girls Who Code, Khan Academy options
</verification>

<success_criteria>
- FOUND-04: Stripe Billing integrated with 4 tiers (FREE/HOBBY/CREATOR/STUDIO). Checkout session creation works for both subscriptions and token packs. Billing portal accessible.
- FOUND-05: Token balance system: earnTokens/spendTokens with atomic DB transactions, never goes below 0, TokenTransaction history tracked, displayed in dashboard widget.
- FOUND-06: 10% charity auto-donation fires on every Stripe invoice.paid and checkout.session.completed event via processDonation(). CharityDonation record created. User can select charity from 3 options.
</success_criteria>

<output>
After completion, create `.planning/phases/01-foundation/01-C-SUMMARY.md` with:
- Stripe webhook events handled and their effects
- Token earn/spend API signatures for Phase 3 AI engine to call
- Charity donation flow (amount calculation, transfer API call)
- All new env vars needed (Stripe price IDs)
- Any deviations from the plan
</output>
