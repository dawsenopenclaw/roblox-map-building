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
