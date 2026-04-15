import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import * as Sentry from '@sentry/nextjs'

const schema = z.union([
  z.object({
    type: z.literal('subscription'),
    tier: z.enum(['HOBBY', 'CREATOR', 'STUDIO']),
    yearly: z.boolean().optional(),
  }),
  z.object({
    type: z.literal('token_pack'),
    packSlug: z.string(),
  }),
])

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()

    const body = await req.json().catch(() => ({}))
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

    // Demo mode — no Clerk session
    if (!clerkId) {
      return NextResponse.json(
        {
          error: 'Authentication required',
          redirect: '/sign-in',
        },
        { status: 401 },
      )
    }

    // Stripe not configured — return a clear, non-crashing error
    const stripeKeyMissing = !process.env.STRIPE_SECRET_KEY
    if (stripeKeyMissing) {
      return NextResponse.json(
        {
          error: 'Stripe not configured yet',
          setup: 'Add STRIPE_SECRET_KEY to environment variables',
        },
        { status: 503 },
      )
    }

    const { db } = await import('@/lib/db')
    const {
      createSubscriptionCheckoutSession,
      createTokenPackCheckoutSession,
      createCustomer,
    } = await import('@/lib/stripe')
    const { SUBSCRIPTION_TIERS, getTokenPackBySlug } = await import('@/lib/subscription-tiers')
    const { clientEnv } = await import('@/lib/env')

    let user = await db.user.findUnique({ where: { clerkId }, include: { subscription: true } })

    // Auto-create user if webhook never fired (e.g. webhook secret was misconfigured)
    if (!user) {
      const { clerkClient } = await import('@clerk/nextjs/server')
      const clerk = await clerkClient()
      const clerkUser = await clerk.users.getUser(clerkId)
      const email = clerkUser.emailAddresses.find(
        e => e.id === clerkUser.primaryEmailAddressId
      )?.emailAddress ?? `${clerkId}@forjegames.com`
      const displayName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || email.split('@')[0]

      user = await db.user.create({
        data: {
          clerkId,
          email,
          displayName,
          avatarUrl: clerkUser.imageUrl,
          ageVerified: true,
          subscription: {
            create: { tier: 'FREE', status: 'ACTIVE', stripeCustomerId: `pending_${clerkId}` },
          },
        },
        include: { subscription: true },
      })
      console.log('[billing/checkout] Auto-created user from Clerk data:', { clerkId, email })
    }

    const appUrl = clientEnv.NEXT_PUBLIC_APP_URL

    // Ensure Stripe customer exists
    let customerId = user.subscription?.stripeCustomerId
    if (!customerId || customerId.startsWith('pending_')) {
      const customer = await createCustomer({ email: user.email, userId: user.id })
      customerId = customer.id
      // Upsert guards against P2025 when the subscription row was never created
      // (e.g. Clerk webhook delivery failure during sign-up).
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
      if (!pack || !pack.stripePriceId)
        return NextResponse.json({ error: 'Token pack not found' }, { status: 404 })

      const session = await createTokenPackCheckoutSession({
        customerId,
        priceId: pack.stripePriceId,
        userId: user.id,
        tokenPackSlug: pack.slug,
        successUrl: `${appUrl}/tokens?tokens_added=true`,
        cancelUrl: `${appUrl}/tokens`,
      })
      return NextResponse.json({ url: session.url })
    }

    return NextResponse.json({ error: 'Invalid checkout type' }, { status: 400 })
  } catch (err) {
    Sentry.captureException(err, { tags: { route: 'billing/checkout' } })
    const errMsg = err instanceof Error ? err.message : String(err)
    console.error('[billing/checkout] Unhandled error', errMsg, err)
    return NextResponse.json({
      error: process.env.NODE_ENV === 'production'
        ? `Checkout failed: ${errMsg.slice(0, 200)}`
        : `Checkout failed: ${errMsg}`,
    }, { status: 503 })
  }
}
