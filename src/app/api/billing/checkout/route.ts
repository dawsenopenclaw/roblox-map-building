import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import {
  createSubscriptionCheckoutSession,
  createTokenPackCheckoutSession,
  createCustomer,
} from '@/lib/stripe'
import { SUBSCRIPTION_TIERS, getTokenPackBySlug } from '@/lib/subscription-tiers'
import { clientEnv } from '@/lib/env'
import { z } from 'zod'

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
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await db.user.findUnique({ where: { clerkId }, include: { subscription: true } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

    const appUrl = clientEnv.NEXT_PUBLIC_APP_URL

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

    return NextResponse.json({ error: 'Invalid checkout type' }, { status: 400 })
  } catch (error) {
    console.error('Checkout session error:', error)
    return NextResponse.json(
      { error: 'Service temporarily unavailable', details: 'Database not connected' },
      { status: 503 }
    )
  }
}
