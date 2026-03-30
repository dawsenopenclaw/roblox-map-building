import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { stripe, constructWebhookEvent } from '@/lib/stripe'
import { db } from '@/lib/db'
import { earnTokens, spendTokens } from '@/lib/tokens-server'
import { processDonation } from '@/lib/charity'
import { getTierTokenAllowance, getTokenPackBySlug, type SubscriptionTier, SUBSCRIPTION_TIERS } from '@/lib/subscription-tiers'
import type Stripe from 'stripe'

import { notifyTemplateSoldClient } from '@/lib/notifications-client'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const headerPayload = await headers()
  const signature = headerPayload.get('stripe-signature')

  if (!signature) return NextResponse.json({ error: 'Missing signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = constructWebhookEvent(body, signature)
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        if (!userId) break

        // Only process fully paid sessions — free/coupon sessions can complete with payment_status 'no_payment_required'
        // but should not trigger token grants or donations unless money actually changed hands.
        const isPaid = session.payment_status === 'paid'

        // Token pack purchase — idempotent via sessionId in metadata check
        if (isPaid && session.metadata?.type === 'token_pack' && session.metadata.tokenPackSlug) {
          const pack = getTokenPackBySlug(session.metadata.tokenPackSlug)
          if (pack) {
            // Idempotency: check if we already credited this session
            const alreadyCredited = await db.tokenTransaction.findFirst({
              where: { metadata: { path: ['sessionId'], equals: session.id } },
              select: { id: true },
            })
            if (!alreadyCredited) {
              await earnTokens(userId, pack.tokens, 'PURCHASE', `Purchased ${pack.name}`, { sessionId: session.id })
            }
          }
        }

        // Template purchase — record DB purchase + notify creator
        if (isPaid && session.metadata?.type === 'template_purchase' && session.metadata.templateId) {
          const { templateId, buyerId, platformFeeCents, creatorPayoutCents } = session.metadata
          const amountCents = session.amount_total ?? 0

          // Fetch template to get creator + title
          const template = await db.template.findUnique({
            where: { id: templateId },
            select: { id: true, title: true, creatorId: true },
          })

          if (template && buyerId) {
            // Upsert purchase record — idempotent
            const purchase = await db.templatePurchase.upsert({
              where: { templateId_buyerId: { templateId, buyerId } },
              create: {
                templateId,
                buyerId,
                stripePaymentIntentId: (session.payment_intent as string) ?? null,
                amountCents,
                platformFeeCents: parseInt(platformFeeCents ?? '0', 10),
                creatorPayoutCents: parseInt(creatorPayoutCents ?? '0', 10),
                payoutStatus: 'PENDING',
              },
              update: {
                stripePaymentIntentId: (session.payment_intent as string) ?? null,
                payoutStatus: 'PENDING',
              },
            })

            // Increment downloads only on first creation (upsert returns the record either way,
            // but we guard by checking whether the stripePaymentIntentId was just set)
            if (!purchase.stripePaymentIntentId || purchase.stripePaymentIntentId === session.payment_intent) {
              await db.template.update({
                where: { id: templateId },
                data: { downloads: { increment: 1 } },
              })
            }

            // Record creator earning — idempotent: only create if one doesn't exist for this buyerId+templateId
            const existingEarning = await db.creatorEarning.findFirst({
              where: { templateId, buyerId },
              select: { id: true },
            })
            if (!existingEarning) {
              await db.creatorEarning.create({
                data: {
                  userId: template.creatorId,
                  templateId,
                  templateName: template.title,
                  amountCents,
                  netCents: parseInt(creatorPayoutCents ?? '0', 10),
                  buyerId,
                  status: 'PENDING',
                },
              })
            }

            // Notify creator (best-effort)
            notifyTemplateSoldClient(template.creatorId, {
              templateTitle: template.title,
              amountCents,
            }).catch(() => {
              // Best-effort notification
            })
          }
        }

        // 10% charity donation on all real payments
        if (isPaid && session.amount_total && session.amount_total > 0) {
          await processDonation({
            userId,
            paymentAmountCents: session.amount_total,
            sourcePurchaseId: session.id,
          }).catch(() => {
            // Non-blocking side effect
          })
        }
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = invoice.subscription as string
        if (!subscriptionId) break

        // Only grant tokens when the invoice was actually paid (not $0 trial invoices)
        if (invoice.amount_paid <= 0) break

        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const userId = subscription.metadata?.userId
        if (!userId) break

        // Grant monthly token allowance — idempotent via invoiceId
        const sub = await db.subscription.findFirst({ where: { stripeSubscriptionId: subscriptionId } })
        if (!sub) {
          console.warn('[stripe-webhook] Subscription not found for invoice.paid — skipping token grant', { subscriptionId, invoiceId: invoice.id })
          break
        }

        const alreadyGranted = await db.tokenTransaction.findFirst({
          where: { metadata: { path: ['invoiceId'], equals: invoice.id } },
          select: { id: true },
        })
        if (!alreadyGranted) {
          // sub.tier is guaranteed to be a SubscriptionTier enum from Prisma schema
          const allowance = getTierTokenAllowance(sub.tier as SubscriptionTier)
          await earnTokens(userId, allowance, 'SUBSCRIPTION_GRANT', `Monthly ${sub.tier} token grant`, { invoiceId: invoice.id })
        }

        // Charity donation on recurring billing
        await processDonation({
          userId,
          paymentAmountCents: invoice.amount_paid,
          sourcePurchaseId: invoice.id,
        }).catch(() => {
          // Non-blocking side effect
        })
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId
        if (!userId) break

        const priceId = subscription.items.data[0]?.price.id
        const tierEntry = Object.entries(SUBSCRIPTION_TIERS).find(([, tier]) =>
          tier.stripePriceIdMonthly === priceId || tier.stripePriceIdYearly === priceId
        )
        const tier = (tierEntry?.[0] || 'FREE') as SubscriptionTier

        // Use upsert — subscription row may not yet exist if 'created' fires before checkout session
        // Map Stripe subscription status to our SubscriptionStatus enum
        const normalizeStatus = (stripeStatus: string): 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'TRIALING' | 'INCOMPLETE' | 'INCOMPLETE_EXPIRED' | 'PAUSED' | 'UNPAID' => {
          const statusMap: Record<string, 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'TRIALING' | 'INCOMPLETE' | 'INCOMPLETE_EXPIRED' | 'PAUSED' | 'UNPAID'> = {
            'active': 'ACTIVE',
            'past_due': 'PAST_DUE',
            'canceled': 'CANCELED',
            'trialing': 'TRIALING',
            'incomplete': 'INCOMPLETE',
            'incomplete_expired': 'INCOMPLETE_EXPIRED',
            'paused': 'PAUSED',
            'unpaid': 'UNPAID',
          }
          return statusMap[stripeStatus.toLowerCase()] || 'INCOMPLETE'
        }

        const normalizedStatus = normalizeStatus(subscription.status)

        await db.subscription.upsert({
          where: { stripeSubscriptionId: subscription.id },
          create: {
            userId,
            stripeCustomerId: typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id,
            stripeSubscriptionId: subscription.id,
            tier,
            status: normalizedStatus,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            stripePriceId: priceId,
          },
          update: {
            tier,
            status: normalizedStatus,
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

      // Refund handling — reverse tokens and mark purchase for review
      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        const paymentIntentId = charge.payment_intent as string | null
        if (!paymentIntentId) break

        // Determine refunded amount
        const refundedCents = charge.amount_refunded
        if (refundedCents <= 0) break

        // Look up template purchase by payment intent
        const templatePurchase = await db.templatePurchase.findFirst({
          where: { stripePaymentIntentId: paymentIntentId },
          select: { id: true, buyerId: true, templateId: true, amountCents: true, payoutStatus: true },
        })

        if (templatePurchase) {
          // Mark purchase as refunded so creator payout is blocked
          await db.templatePurchase.update({
            where: { id: templatePurchase.id },
            data: { payoutStatus: 'REFUNDED' },
          })

          // Mark any associated creator earning as refunded
          await db.creatorEarning.updateMany({
            where: { templateId: templatePurchase.templateId, buyerId: templatePurchase.buyerId },
            data: { status: 'REFUNDED' },
          })
        }

        // Reverse token pack purchase if applicable — find session via payment intent
        const sessions = await stripe.checkout.sessions.list({ payment_intent: paymentIntentId, limit: 1 })
        const session = sessions.data[0]
        if (session?.metadata?.type === 'token_pack' && session.metadata.userId && session.metadata.tokenPackSlug) {
          const pack = getTokenPackBySlug(session.metadata.tokenPackSlug)
          if (pack) {
            // Reverse the token grant — use spendTokens so balance can't go below 0
            await spendTokens(
              session.metadata.userId,
              pack.tokens,
              `Refund: ${pack.name} token pack reversed`,
              { paymentIntentId, refundedCents }
            ).catch(() => {
              // Balance may already be spent — non-critical
            })
          }
        }
        break
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const stack = err instanceof Error ? err.stack : undefined
    console.error('[stripe-webhook] Unhandled error processing event', {
      eventId: event.id,
      eventType: event.type,
      message,
      stack,
    })
    Sentry.captureException(err, {
      tags: { webhook: 'stripe', eventType: event.type },
      extra: { eventId: event.id },
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
