import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { getStripe } from '@/lib/stripe'
import Stripe from 'stripe'
import { marketplaceWriteRateLimit, rateLimitHeaders } from '@/lib/rate-limit'
import { PLATFORM_FEE_PERCENT } from '@/lib/constants'

// POST /api/marketplace/templates/[id]/purchase
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: templateId } = await params

  let clerkId: string | null = null
  try {
    const session = await auth()
    clerkId = session?.userId ?? null
  } catch { /* demo mode — Clerk not configured */ }

  if (!clerkId) {
    return NextResponse.json({ demo: true, message: 'Purchases are not available in demo mode' }, { status: 200 })
  }

  const rl = await marketplaceWriteRateLimit(clerkId)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests — please slow down' },
      { status: 429, headers: rateLimitHeaders(rl) },
    )
  }

  // Block purchases on demo templates (no DB)
  if (templateId.startsWith('demo-')) {
    return NextResponse.json({ error: 'This is a demo template — purchases are not available yet' }, { status: 400 })
  }

  let user: { id: string; email: string; subscription: { stripeCustomerId: string } | null } | null = null
  try {
    user = await db.user.findUnique({
      where: { clerkId },
      select: {
        id: true,
        email: true,
        subscription: { select: { stripeCustomerId: true } },
      },
    })
  } catch (err) {
    return NextResponse.json({ error: 'Service temporarily unavailable — please try again later' }, { status: 503 })
  }
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  let template: {
    id: string; title: string; status: string; priceCents: number; creatorId: string;
    creator: { id: string; displayName: string | null; username: string | null; creatorAccount: { stripeAccountId: string; chargesEnabled: boolean } | null }
  } | null = null
  try {
    template = await db.template.findUnique({
      where: { id: templateId },
      select: {
        id: true,
        title: true,
        status: true,
        priceCents: true,
        creatorId: true,
        creator: {
          select: {
            id: true,
            displayName: true,
            username: true,
            creatorAccount: {
              select: { stripeAccountId: true, chargesEnabled: true },
            },
          },
        },
      },
    })
  } catch (err) {
    return NextResponse.json({ error: 'Service temporarily unavailable — please try again later' }, { status: 503 })
  }
  if (!template || template.status !== 'PUBLISHED') {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }

  if (template.creatorId === user.id) {
    return NextResponse.json({ error: 'You cannot purchase your own template' }, { status: 400 })
  }

  try {
    // Use unique index (templateId + buyerId) for O(1) lookup
    const existing = await db.templatePurchase.findUnique({
      where: { templateId_buyerId: { templateId, buyerId: user.id } },
      select: { id: true },
    })
    if (existing) {
      return NextResponse.json({ error: 'Already purchased' }, { status: 409 })
    }
  } catch (err) {
    return NextResponse.json({ error: 'Service temporarily unavailable — please try again later' }, { status: 503 })
  }

  if (template.priceCents < 0) {
    return NextResponse.json({ error: 'Template has invalid price' }, { status: 500 })
  }

  const platformFeeCents = Math.round(template.priceCents * PLATFORM_FEE_PERCENT)
  const creatorPayoutCents = template.priceCents - platformFeeCents

  // Free template — create purchase record directly
  if (template.priceCents === 0) {
    try {
      const purchase = await db.$transaction(async (tx) => {
        const newPurchase = await tx.templatePurchase.create({
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
        await tx.template.update({
          where: { id: templateId },
          data: { downloads: { increment: 1 } },
        })

        return newPurchase
      })

      return NextResponse.json({ success: true, purchaseId: purchase.id })
    } catch (err: unknown) {
      // P2002 = unique constraint violation — concurrent duplicate purchase attempt
      if ((err as { code?: string })?.code === 'P2002') {
        return NextResponse.json({ error: 'Already purchased' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Service temporarily unavailable — please try again later' }, { status: 503 })
    }
  }

  // Paid template — create Stripe Checkout session
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://forjegames.com'

  const stripe = getStripe()
  if (!stripe) {
    return NextResponse.json(
      { error: 'Payment service not configured' },
      { status: 503 },
    )
  }

  try {
    // Get or create Stripe customer for buyer
    let stripeCustomerId = user.subscription?.stripeCustomerId
    if (!stripeCustomerId || stripeCustomerId.startsWith('pending_')) {
      const customer = await stripe.customers.create(
        {
          email: user.email,
          metadata: { userId: user.id },
        },
        { idempotencyKey: `customer_create_${user.id}` },
      )
      stripeCustomerId = customer.id
      // Persist so future purchases reuse the same customer
      await db.subscription.upsert({
        where: { userId: user.id },
        create: { userId: user.id, stripeCustomerId, tier: 'FREE', status: 'ACTIVE' },
        update: { stripeCustomerId },
      })
    }

    const creatorStripeAccountId = template.creator.creatorAccount?.stripeAccountId

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: stripeCustomerId,
      mode: 'payment',
      automatic_tax: { enabled: true },
      customer_update: { address: 'auto' },
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
        // platformFeeCents and creatorPayoutCents are intentionally omitted here —
        // the webhook recomputes them server-side from session.amount_total to
        // prevent any client-supplied amount from influencing financial records.
      },
    }

    // Use Stripe Connect transfer if creator has a charges-enabled account.
    // If not, we still complete the purchase but flag the session metadata so the
    // manual payout worker (admin/worker/process-token-grants) knows to queue a
    // manual transfer once the creator onboards Connect.
    if (creatorStripeAccountId && template.creator.creatorAccount?.chargesEnabled) {
      sessionParams.payment_intent_data = {
        application_fee_amount: platformFeeCents,
        transfer_data: {
          destination: creatorStripeAccountId,
        },
      }
    } else {
      // Tag the session so the webhook and payout worker can identify manual-payout purchases
      sessionParams.metadata = {
        ...sessionParams.metadata,
        payoutMethod: 'manual',
        creatorId: template.creatorId,
      }
      console.warn(
        `[marketplace/purchase] Creator ${template.creatorId} has no charges-enabled Connect account — purchase will require manual payout`,
        { templateId, creatorStripeAccountId: creatorStripeAccountId ?? 'none' }
      )
    }

    const session = await stripe.checkout.sessions.create(
      sessionParams,
      { idempotencyKey: `checkout_template_${templateId}_${user.id}` },
    )

    return NextResponse.json({ checkoutUrl: session.url })
  } catch (err) {
    return NextResponse.json({ error: 'Payment service temporarily unavailable — please try again later' }, { status: 503 })
  }
}
