import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { stripe, constructWebhookEvent } from '@/lib/stripe'
import { db } from '@/lib/db'
import { earnTokens, spendTokens } from '@/lib/tokens-server'
import { processDonation } from '@/lib/charity'
import { getTierTokenAllowance, getTokenPackBySlug, type SubscriptionTier, SUBSCRIPTION_TIERS } from '@/lib/subscription-tiers'
import type Stripe from 'stripe'
import { PLATFORM_FEE_PERCENT } from '@/lib/constants'

import { notifyTemplateSoldClient, sendNotification } from '@/lib/notifications-client'
import {
  sendSaleNotificationEmail,
  sendDunningEmail,
  sendTrialEndingEmail,
  sendPaymentActionRequiredEmail,
} from '@/lib/email'
import { dispatchWebhookEvent } from '@/lib/webhook-dispatch'

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
            // Idempotency: check if we already credited this session.
            // We store BOTH sessionId and paymentIntentId so that the
            // payment_intent.succeeded handler can find this record and skip
            // double-crediting (it searches by paymentIntentId).
            const alreadyCredited = await db.tokenTransaction.findFirst({
              where: { metadata: { path: ['sessionId'], equals: session.id } },
              select: { id: true },
            })
            if (!alreadyCredited) {
              const paymentIntentId = typeof session.payment_intent === 'string'
                ? session.payment_intent
                : session.payment_intent?.toString() ?? undefined
              await earnTokens(userId, pack.tokens, 'PURCHASE', `Purchased ${pack.name}`, {
                sessionId: session.id,
                paymentIntentId,
              })
            }
          }
        }

        // Template purchase — record DB purchase + notify creator
        if (isPaid && session.metadata?.type === 'template_purchase' && session.metadata.templateId) {
          const { templateId, buyerId } = session.metadata
          const amountCents = session.amount_total ?? 0
          // Recompute fee split server-side from the authoritative amount_total — never trust client metadata
          const platformFeeCentsComputed = Math.round(amountCents * PLATFORM_FEE_PERCENT)
          const creatorPayoutCentsComputed = amountCents - platformFeeCentsComputed

          // Fetch template to get creator + title
          const template = await db.template.findUnique({
            where: { id: templateId },
            select: { id: true, title: true, creatorId: true },
          })

          if (template && buyerId) {
            // Check for existing purchase before upsert so we can guard the
            // download counter increment — Prisma upsert does not expose whether
            // a row was created or updated.
            const existingPurchase = await db.templatePurchase.findUnique({
              where: { templateId_buyerId: { templateId, buyerId } },
              select: { id: true },
            })

            // Upsert purchase record — idempotent
            await db.templatePurchase.upsert({
              where: { templateId_buyerId: { templateId, buyerId } },
              create: {
                templateId,
                buyerId,
                stripePaymentIntentId: (session.payment_intent as string) ?? null,
                amountCents,
                platformFeeCents: platformFeeCentsComputed,
                creatorPayoutCents: creatorPayoutCentsComputed,
                payoutStatus: 'PENDING',
              },
              update: {
                stripePaymentIntentId: (session.payment_intent as string) ?? null,
                payoutStatus: 'PENDING',
              },
            })

            // Only increment downloads on first purchase creation, not on replays
            if (!existingPurchase) {
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
                  netCents: creatorPayoutCentsComputed,
                  buyerId,
                  status: 'PENDING',
                },
              })
            }

            // Notify creator via WebSocket (best-effort)
            notifyTemplateSoldClient(template.creatorId, {
              templateTitle: template.title,
              amountCents,
            }).catch(() => {
              // Best-effort notification
            })

            // Send email notification to creator (best-effort)
            const creator = await db.user.findUnique({
              where: { id: template.creatorId },
              select: { email: true },
            })
            if (creator?.email) {
              sendSaleNotificationEmail({
                email: creator.email,
                templateName: template.title,
                saleAmount: amountCents / 100, // Convert cents to dollars
                platformFee: platformFeeCentsComputed / 100,
              }).catch((err) => {
                console.warn('[stripe-webhook] Failed to send sale notification email:', err)
              })
            }

            // Dispatch template.sold webhook to the seller (best-effort)
            dispatchWebhookEvent(template.creatorId, 'template.sold', {
              templateId,
              templateName: template.title,
              buyerId: buyerId ?? '',
              sellerId: template.creatorId,
              priceCents: amountCents,
              earningsCents: creatorPayoutCentsComputed,
              currency: 'USD',
            }).catch(() => {})
          }
        }

        // 10% charity donation on all real payments
        if (isPaid && session.amount_total && session.amount_total > 0) {
          if (!process.env.STRIPE_CHARITY_ACCOUNT_ID) {
            console.warn('[stripe-webhook] STRIPE_CHARITY_ACCOUNT_ID not set — skipping charity donation for session', session.id)
          } else {
            await processDonation({
              userId,
              paymentAmountCents: session.amount_total,
              sourcePurchaseId: session.id,
            }).catch(() => {
              // Non-blocking side effect
            })
          }
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

        // Reactivate subscriptions that were PAST_DUE — payment has now cleared
        if (sub.status === 'PAST_DUE') {
          await db.subscription.update({
            where: { id: sub.id },
            data: { status: 'ACTIVE' },
          })
        }

        // Charity donation on recurring billing
        if (!process.env.STRIPE_CHARITY_ACCOUNT_ID) {
          console.warn('[stripe-webhook] STRIPE_CHARITY_ACCOUNT_ID not set — skipping charity donation for invoice', invoice.id)
        } else {
          await processDonation({
            userId,
            paymentAmountCents: invoice.amount_paid,
            sourcePurchaseId: invoice.id,
          }).catch(() => {
            // Non-blocking side effect
          })
        }
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

        // Read existing tier before upsert so we can compute the changeType
        const existingSub = await db.subscription.findUnique({
          where: { stripeSubscriptionId: subscription.id },
          select: { tier: true },
        })
        const previousPlan = existingSub?.tier ?? 'FREE'

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

        // Determine change type for the webhook payload
        const tierOrder: Record<string, number> = { FREE: 0, HOBBY: 1, CREATOR: 2, STUDIO: 3 }
        const prevOrder = tierOrder[previousPlan] ?? 0
        const newOrder = tierOrder[tier] ?? 0
        const isNew = !existingSub
        const changeType =
          isNew && subscription.status === 'trialing' ? 'trial_started'
          : isNew ? 'upgrade'
          : subscription.cancel_at_period_end ? 'cancel'
          : newOrder > prevOrder ? 'upgrade'
          : newOrder < prevOrder ? 'downgrade'
          : 'reactivate'

        // Dispatch subscription.changed webhook (best-effort)
        dispatchWebhookEvent(userId, 'subscription.changed', {
          userId,
          previousPlan,
          newPlan: tier,
          changeType,
          effectiveAt: new Date().toISOString(),
          billingCycleEnd: new Date(subscription.current_period_end * 1000).toISOString(),
        }).catch(() => {})
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const deletedUserId = subscription.metadata?.userId

        // Read tier before we mark canceled so we can populate previousPlan
        const deletedSub = deletedUserId
          ? await db.subscription.findUnique({
              where: { stripeSubscriptionId: subscription.id },
              select: { tier: true },
            })
          : null

        // updateMany is safe when the row is absent — avoids P2025 on replay
        await db.subscription.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: { status: 'CANCELED', cancelAtPeriodEnd: false },
        })

        // Dispatch subscription.changed webhook (best-effort)
        if (deletedUserId) {
          dispatchWebhookEvent(deletedUserId, 'subscription.changed', {
            userId: deletedUserId,
            previousPlan: deletedSub?.tier ?? 'FREE',
            newPlan: 'FREE',
            changeType: 'cancel',
            effectiveAt: new Date().toISOString(),
          }).catch(() => {})
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string
        const user = await db.user.findFirst({
          where: { subscription: { stripeCustomerId: customerId } },
          select: { id: true, email: true, displayName: true },
        })
        if (user) {
          // updateMany is safe when the row is absent — avoids P2025 on missing subscription
          await db.subscription.updateMany({
            where: { userId: user.id },
            data: { status: 'PAST_DUE' },
          })
          // Send dunning email (best-effort)
          sendDunningEmail({
            email: user.email,
            name: user.displayName ?? 'Creator',
            invoiceUrl: (invoice.hosted_invoice_url as string | null) ?? undefined,
            amountDueCents: invoice.amount_due,
            nextAttemptAt: invoice.next_payment_attempt
              ? new Date(invoice.next_payment_attempt * 1000)
              : undefined,
          }).catch((err) => {
            console.warn('[stripe-webhook] Failed to send dunning email:', err)
          })
        }
        break
      }

      case 'charge.dispute.created': {
        const dispute = event.data.object as Stripe.Dispute
        // Log the dispute for admin review
        await db.auditLog.create({
          data: {
            action: 'CHARGE_DISPUTED',
            resource: 'stripe',
            resourceId: dispute.id,
            metadata: { amount: dispute.amount, reason: dispute.reason, status: dispute.status },
          },
        })
        // Alert admin via Sentry so on-call is paged
        Sentry.captureMessage(`[stripe] Dispute created: ${dispute.id}`, {
          level: 'warning',
          tags: { webhook: 'stripe', eventType: 'charge.dispute.created' },
          extra: { disputeId: dispute.id, amount: dispute.amount, reason: dispute.reason },
        })
        // Freeze creator payouts linked to the disputed charge
        if (dispute.charge) {
          const chargeId = typeof dispute.charge === 'string' ? dispute.charge : dispute.charge.id
          const charge = await stripe.charges.retrieve(chargeId)
          const paymentIntentId = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id
          if (paymentIntentId) {
            await db.templatePurchase.updateMany({
              where: { stripePaymentIntentId: paymentIntentId, payoutStatus: 'PENDING' },
              data: { payoutStatus: 'FROZEN' },
            })
            // Find the purchase to get templateId + buyerId for the earnings filter
            const purchase = await db.templatePurchase.findFirst({
              where: { stripePaymentIntentId: paymentIntentId },
              select: { templateId: true, buyerId: true },
            })
            if (purchase) {
              await db.creatorEarning.updateMany({
                where: {
                  templateId: purchase.templateId,
                  buyerId: purchase.buyerId,
                  status: 'PENDING',
                },
                data: { status: 'FROZEN' },
              })
            }
          }
        }
        break
      }

      case 'charge.dispute.closed': {
        const dispute = event.data.object as Stripe.Dispute
        const won = dispute.status === 'won'

        await db.auditLog.create({
          data: {
            action: won ? 'CHARGE_DISPUTE_WON' : 'CHARGE_DISPUTE_LOST',
            resource: 'stripe',
            resourceId: dispute.id,
            metadata: { amount: dispute.amount, reason: dispute.reason, status: dispute.status },
          },
        })

        Sentry.captureMessage(`[stripe] Dispute ${won ? 'won' : 'lost'}: ${dispute.id}`, {
          level: won ? 'info' : 'error',
          tags: { webhook: 'stripe', eventType: 'charge.dispute.closed' },
          extra: { disputeId: dispute.id, amount: dispute.amount, reason: dispute.reason, status: dispute.status },
        })

        if (dispute.charge) {
          const chargeId = typeof dispute.charge === 'string' ? dispute.charge : dispute.charge.id
          const charge = await stripe.charges.retrieve(chargeId)
          const paymentIntentId = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id
          if (paymentIntentId) {
            const purchase = await db.templatePurchase.findFirst({
              where: { stripePaymentIntentId: paymentIntentId },
              select: { templateId: true, buyerId: true, template: { select: { creatorId: true } } },
            })

            if (won) {
              // Dispute won — unfreeze payouts so the creator can be paid out
              await db.templatePurchase.updateMany({
                where: { stripePaymentIntentId: paymentIntentId, payoutStatus: 'FROZEN' },
                data: { payoutStatus: 'PENDING' },
              })
              if (purchase) {
                await db.creatorEarning.updateMany({
                  where: { templateId: purchase.templateId, buyerId: purchase.buyerId, status: 'FROZEN' },
                  data: { status: 'PENDING' },
                })
                // Notify the creator that the dispute was resolved in their favour
                if (purchase.template.creatorId) {
                  sendNotification({
                    userId: purchase.template.creatorId,
                    type: 'SYSTEM',
                    title: 'Dispute resolved in your favour',
                    body: 'A payment dispute was closed and decided in your favour. Your payout has been unfrozen.',
                    actionUrl: '/dashboard/earnings',
                    priority: 'high',
                  }).catch(() => {})
                }
              }
            } else {
              // Dispute lost — payouts stay frozen; mark purchase and earnings as lost
              await db.templatePurchase.updateMany({
                where: { stripePaymentIntentId: paymentIntentId, payoutStatus: 'FROZEN' },
                data: { payoutStatus: 'REFUNDED' },
              })
              if (purchase) {
                await db.creatorEarning.updateMany({
                  where: { templateId: purchase.templateId, buyerId: purchase.buyerId, status: 'FROZEN' },
                  data: { status: 'REFUNDED' },
                })
                // Notify the creator that the dispute was lost
                if (purchase.template.creatorId) {
                  sendNotification({
                    userId: purchase.template.creatorId,
                    type: 'SYSTEM',
                    title: 'Dispute resolved against you',
                    body: 'A payment dispute was closed and decided against you. The associated payout has been cancelled.',
                    actionUrl: '/dashboard/earnings',
                    priority: 'critical',
                  }).catch(() => {})
                }
              }
            }
          }
        }
        break
      }

      case 'charge.dispute.updated': {
        const dispute = event.data.object as Stripe.Dispute
        // Keep the audit trail current as the dispute progresses through Stripe's review stages
        await db.auditLog.create({
          data: {
            action: 'CHARGE_DISPUTE_UPDATED',
            resource: 'stripe',
            resourceId: dispute.id,
            metadata: { amount: dispute.amount, reason: dispute.reason, status: dispute.status },
          },
        })
        break
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const userId = paymentIntent.metadata?.userId
        const tokenPackSlug = paymentIntent.metadata?.tokenPackSlug
        if (!userId || !tokenPackSlug) break

        const pack = getTokenPackBySlug(tokenPackSlug)
        if (!pack) break

        // Idempotency: check if tokens were already credited via checkout.session.completed
        const alreadyCredited = await db.tokenTransaction.findFirst({
          where: { metadata: { path: ['paymentIntentId'], equals: paymentIntent.id } },
          select: { id: true },
        })
        if (!alreadyCredited) {
          await earnTokens(userId, pack.tokens, 'PURCHASE', `Purchased ${pack.name}`, { paymentIntentId: paymentIntent.id })
        }
        break
      }

      case 'customer.subscription.trial_will_end': {
        const sub = event.data.object as Stripe.Subscription
        const userId = sub.metadata?.userId
        if (!userId) break

        const user = await db.user.findFirst({
          where: { id: userId },
          select: { email: true, displayName: true },
        })
        if (user) {
          const trialEndDate = sub.trial_end ? new Date(sub.trial_end * 1000) : undefined
          sendTrialEndingEmail({
            email: user.email,
            name: user.displayName ?? 'Creator',
            trialEndDate,
            upgradeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
          }).catch((err) => {
            console.warn('[stripe-webhook] Failed to send trial-ending email:', err)
          })
        }
        break
      }

      // Stripe sends both names depending on SDK/API version — handle both
      case 'invoice.payment_action_required':
      // falls through
      // @ts-ignore — older Stripe API versions emit this alias
      case 'invoice.requires_action': {
        // Fires when SCA / 3D Secure authentication is required before an invoice can be paid.
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string
        const user = await db.user.findFirst({
          where: { subscription: { stripeCustomerId: customerId } },
          select: { id: true, email: true, displayName: true },
        })
        if (user) {
          const paymentUrl = (invoice.hosted_invoice_url as string | null) ?? undefined
          sendPaymentActionRequiredEmail({
            email: user.email,
            name: user.displayName ?? 'Creator',
            paymentUrl,
            amountDueCents: invoice.amount_due,
          }).catch((err) => {
            console.warn('[stripe-webhook] Failed to send payment-action-required email:', err)
          })
          // Also send an in-app notification so the dashboard banner shows
          sendNotification({
            userId: user.id,
            type: 'SYSTEM',
            title: 'Action required: complete your payment',
            body: 'Your subscription requires 3D Secure authentication. Click to complete payment.',
            actionUrl: paymentUrl ?? '/billing',
            priority: 'critical',
          }).catch(() => {})
        }
        break
      }

      case 'customer.deleted': {
        // Stripe customer was deleted — nullify stripeCustomerId on our subscription row
        // so no future billing operations target a non-existent customer.
        const customer = event.data.object as Stripe.Customer
        await db.subscription.updateMany({
          where: { stripeCustomerId: customer.id },
          data: { stripeCustomerId: `deleted_${customer.id}` },
        })
        await db.auditLog.create({
          data: {
            action: 'STRIPE_CUSTOMER_DELETED',
            resource: 'stripe',
            resourceId: customer.id,
            metadata: { email: customer.email },
          },
        })
        break
      }

      case 'account.updated': {
        const account = event.data.object as Stripe.Account
        await db.creatorAccount.updateMany({
          where: { stripeAccountId: account.id },
          data: {
            chargesEnabled: account.charges_enabled,
            payoutsEnabled: account.payouts_enabled,
            detailsSubmitted: account.details_submitted,
          },
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
    // Transient infrastructure errors (DB connection, timeout, network) should
    // return 500 so Stripe retries delivery — the event was not processed.
    // Permanent logic/validation errors return 200 to stop retry loops, since
    // redelivery cannot fix a bad event or missing metadata.
    const isTransient =
      /connect|timeout|ECONNREFUSED|P1001/i.test(message)
    if (isTransient) {
      return NextResponse.json({ error: 'transient_error' }, { status: 500 })
    }
    return NextResponse.json({ received: true })
  }

  return NextResponse.json({ received: true })
}
