import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { stripe } from '@/lib/stripe'
import Stripe from 'stripe'

const PLATFORM_FEE_PERCENT = 0.30 // 30% platform fee, 70% to creator

// POST /api/marketplace/templates/[id]/purchase
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: templateId } = await params
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.user.findUnique({
    where: { clerkId },
    include: { subscription: true },
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const template = await db.template.findUnique({
    where: { id: templateId },
    include: { creator: { include: { creatorAccount: true } } },
  })
  if (!template || template.status !== 'PUBLISHED') {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }

  if (template.creatorId === user.id) {
    return NextResponse.json({ error: 'You cannot purchase your own template' }, { status: 400 })
  }

  // Check if already purchased
  const existing = await db.templatePurchase.findFirst({
    where: { templateId, buyerId: user.id },
  })
  if (existing) {
    return NextResponse.json({ error: 'Already purchased' }, { status: 409 })
  }

  const platformFeeCents = Math.round(template.priceCents * PLATFORM_FEE_PERCENT)
  const creatorPayoutCents = template.priceCents - platformFeeCents

  // Free template — create purchase record directly
  if (template.priceCents === 0) {
    const purchase = await db.templatePurchase.create({
      data: {
        templateId,
        buyerId: user.id,
        amountCents: 0,
        platformFeeCents: 0,
        creatorPayoutCents: 0,
        payoutStatus: 'PAID',
      },
    })

    // Increment download count
    await db.template.update({
      where: { id: templateId },
      data: { downloads: { increment: 1 } },
    })

    return NextResponse.json({ success: true, purchaseId: purchase.id })
  }

  // Paid template — create Stripe Checkout session
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  // Get or create Stripe customer for buyer
  let stripeCustomerId = user.subscription?.stripeCustomerId
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId: user.id },
    })
    stripeCustomerId = customer.id
  }

  const creatorStripeAccountId = template.creator.creatorAccount?.stripeAccountId

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    customer: stripeCustomerId,
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: template.title,
            description: `Template by ${template.creator.displayName || template.creator.username || 'Creator'}`,
          },
          unit_amount: template.priceCents,
        },
        quantity: 1,
      },
    ],
    success_url: `${baseUrl}/marketplace/${templateId}?purchased=1`,
    cancel_url: `${baseUrl}/marketplace/${templateId}`,
    metadata: {
      templateId,
      buyerId: user.id,
      type: 'template_purchase',
      platformFeeCents: String(platformFeeCents),
      creatorPayoutCents: String(creatorPayoutCents),
    },
  }

  // Use Stripe Connect transfer if creator has account
  if (creatorStripeAccountId && template.creator.creatorAccount?.chargesEnabled) {
    sessionParams.payment_intent_data = {
      application_fee_amount: platformFeeCents,
      transfer_data: {
        destination: creatorStripeAccountId,
      },
    }
  }

  const session = await stripe.checkout.sessions.create(sessionParams)

  return NextResponse.json({ checkoutUrl: session.url })
}
