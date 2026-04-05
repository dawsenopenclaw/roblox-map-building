import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { randomBytes } from 'crypto'
import { db } from '@/lib/db'
import { stripe } from '@/lib/stripe'
import { SUBSCRIPTION_TIERS, TOKEN_PACKS } from '@/lib/subscription-tiers'

const schema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('subscription'),
    tier: z.enum(['HOBBY', 'CREATOR', 'STUDIO']),
    recipientEmail: z.string().email(),
    message: z.string().max(500).optional(),
  }),
  z.object({
    type: z.literal('tokens'),
    tokenPackSlug: z.enum(['starter', 'creator', 'pro']),
    recipientEmail: z.string().email(),
    message: z.string().max(500).optional(),
  }),
])

function generateRedeemCode(): string {
  // 8 uppercase alphanumeric chars, URL-safe
  return randomBytes(6).toString('base64url').toUpperCase().slice(0, 8)
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
    }

    const sender = await db.user.findUnique({
      where: { clerkId },
      include: { subscription: true },
    })
    if (!sender) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

    // Ensure Stripe customer exists
    let customerId = sender.subscription?.stripeCustomerId
    if (!customerId || customerId.startsWith('pending_') || customerId.startsWith('deleted_')) {
      const customer = await stripe.customers.create(
        { email: sender.email, metadata: { userId: sender.id } },
        { idempotencyKey: `customer_create_${sender.id}` },
      )
      customerId = customer.id
      if (sender.subscription) {
        await db.subscription.update({
          where: { userId: sender.id },
          data: { stripeCustomerId: customerId },
        })
      }
    }

    const redeemCode = generateRedeemCode()

    if (parsed.data.type === 'subscription') {
      const { tier, recipientEmail, message } = parsed.data
      const tierConfig = SUBSCRIPTION_TIERS[tier]
      const priceId = tierConfig.stripePriceIdMonthly
      if (!priceId) {
        return NextResponse.json({ error: 'Subscription tier not configured' }, { status: 500 })
      }

      // Create the Gift record first so we have an ID for metadata
      const gift = await db.gift.create({
        data: {
          senderId: sender.id,
          recipientEmail,
          giftType: 'subscription',
          tier,
          message: message ?? null,
          status: 'pending',
          redeemCode,
          expiresAt,
        },
      })

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${appUrl}/dashboard/gifts?gifted=true&code=${redeemCode}`,
        cancel_url: `${appUrl}/dashboard/gifts?canceled=true`,
        automatic_tax: { enabled: true },
        customer_update: { address: 'auto' },
        subscription_data: {
          metadata: {
            userId: sender.id,
            type: 'gift',
            giftId: gift.id,
            giftType: 'subscription',
            recipientEmail,
          },
        },
        metadata: {
          userId: sender.id,
          type: 'gift',
          giftId: gift.id,
          giftType: 'subscription',
          recipientEmail,
        },
      })

      // Store the Stripe session ID on the gift
      await db.gift.update({
        where: { id: gift.id },
        data: { stripeSessionId: session.id },
      })

      return NextResponse.json({
        checkoutUrl: session.url,
        giftId: gift.id,
        redeemCode,
      })
    }

    // tokens gift
    const { tokenPackSlug, recipientEmail, message } = parsed.data
    const pack = TOKEN_PACKS.find(p => p.slug === tokenPackSlug)
    if (!pack || !pack.stripePriceId) {
      return NextResponse.json({ error: 'Token pack not found or not configured' }, { status: 404 })
    }

    const gift = await db.gift.create({
      data: {
        senderId: sender.id,
        recipientEmail,
        giftType: 'tokens',
        tokenAmount: pack.tokens,
        message: message ?? null,
        status: 'pending',
        redeemCode,
        expiresAt,
      },
    })

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{ price: pack.stripePriceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard/gifts?gifted=true&code=${redeemCode}`,
      cancel_url: `${appUrl}/dashboard/gifts?canceled=true`,
      automatic_tax: { enabled: true },
      customer_update: { address: 'auto' },
      metadata: {
        userId: sender.id,
        type: 'gift',
        giftId: gift.id,
        giftType: 'tokens',
        tokenPackSlug,
        recipientEmail,
      },
    })

    await db.gift.update({
      where: { id: gift.id },
      data: { stripeSessionId: session.id },
    })

    return NextResponse.json({
      checkoutUrl: session.url,
      giftId: gift.id,
      redeemCode,
    })
  } catch (err) {
    console.error('[gifts/send] Unhandled error', err)
    return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
  }
}
