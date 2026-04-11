/**
 * POST /api/crons/stripe-reconcile
 *
 * Hourly job that reconciles local Subscription rows with Stripe's source
 * of truth. Catches the edge case where the `customer.subscription.created`
 * webhook failed, arrived out of order, or was rate-limited by Upstash —
 * the user has paid Stripe but has no local row, so `requireTier()` still
 * rejects them and their chat throws 402.
 *
 * Strategy:
 *   1. List the N most recently updated Stripe subscriptions (last 2h window
 *      with a small safety margin).
 *   2. For each, pull `customer.metadata.userId` and look up the local User.
 *   3. If the local Subscription row is missing or stale (status / period
 *      drift), upsert it from the Stripe payload.
 *
 * Idempotent: upsert on (userId) means rerunning the cron is safe.
 * Auth: CRON_SECRET header, same pattern as weekly-digest.
 *
 * Schedule this in vercel.json or an external scheduler. The endpoint runs
 * its own TTL so running it every 30 min is cheap.
 */

import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import Stripe from 'stripe'
import { db } from '@/lib/db'
import { getStripe } from '@/lib/stripe'

export const runtime = 'nodejs'
export const maxDuration = 60

function verifyCronSecret(req: NextRequest): boolean {
  const secret = req.headers.get('x-cron-secret')
  const expected = process.env.CRON_SECRET
  if (!secret || !expected) return false
  try {
    const a = Buffer.from(secret)
    const b = Buffer.from(expected)
    return a.length === b.length && timingSafeEqual(a, b)
  } catch {
    return false
  }
}

/** Map a Stripe subscription status to our local enum. */
function mapStatus(s: Stripe.Subscription.Status): 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'TRIALING' | 'INCOMPLETE' | 'INCOMPLETE_EXPIRED' | 'PAUSED' | 'UNPAID' {
  switch (s) {
    case 'active':              return 'ACTIVE'
    case 'past_due':            return 'PAST_DUE'
    case 'canceled':            return 'CANCELED'
    case 'trialing':            return 'TRIALING'
    case 'incomplete':          return 'INCOMPLETE'
    case 'incomplete_expired':  return 'INCOMPLETE_EXPIRED'
    case 'paused':              return 'PAUSED'
    case 'unpaid':              return 'UNPAID'
    default:                    return 'INCOMPLETE'
  }
}

/** Map a Stripe price ID to our tier enum using env vars. */
function mapTier(priceId: string | null): 'FREE' | 'HOBBY' | 'CREATOR' | 'STUDIO' {
  if (!priceId) return 'FREE'
  if (priceId === process.env.STRIPE_HOBBY_PRICE_ID || priceId === process.env.STRIPE_HOBBY_YEARLY_PRICE_ID) return 'HOBBY'
  if (priceId === process.env.STRIPE_CREATOR_PRICE_ID || priceId === process.env.STRIPE_CREATOR_YEARLY_PRICE_ID) return 'CREATOR'
  if (priceId === process.env.STRIPE_STUDIO_PRICE_ID || priceId === process.env.STRIPE_STUDIO_YEARLY_PRICE_ID) return 'STUDIO'
  return 'FREE'
}

export async function POST(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const stripe = getStripe()
  if (!stripe) {
    return NextResponse.json({ ok: true, skipped: 'stripe_not_configured' })
  }

  const stats = { checked: 0, created: 0, updated: 0, skipped: 0, errors: [] as string[] }

  try {
    // Look back 2 hours — catches webhooks that landed in the last hour
    // plus a safety margin for clock skew and retry backoff.
    const lookbackSeconds = 2 * 60 * 60
    const since = Math.floor(Date.now() / 1000) - lookbackSeconds

    // Paginate all subscriptions touched since `since`. Stripe caps at 100
    // per page; realistic production volume for an hourly cron is well
    // under that. We still paginate defensively in case of a backlog.
    let startingAfter: string | undefined
    let more = true
    let pageCount = 0
    const MAX_PAGES = 20 // hard cap at 2000 subscriptions per run — bail out after

    while (more && pageCount < MAX_PAGES) {
      const page: Stripe.ApiList<Stripe.Subscription> = await stripe.subscriptions.list({
        limit: 100,
        starting_after: startingAfter,
        status: 'all',
        expand: ['data.customer'],
      })
      pageCount += 1

      for (const sub of page.data) {
        stats.checked += 1

        // Filter to subs touched in our window (created OR recently updated
        // to catch period rollovers). Stripe doesn't expose `updated` in
        // list filters so we filter client-side using `current_period_start`.
        const touched = Math.max(sub.created, sub.current_period_start ?? 0, sub.ended_at ?? 0)
        if (touched < since) {
          stats.skipped += 1
          continue
        }

        const customer = sub.customer as Stripe.Customer | string
        if (typeof customer === 'string') {
          stats.skipped += 1
          continue
        }
        const userId = customer.metadata?.userId
        if (!userId) {
          // No userId tag — not one of ours (or an old test customer)
          stats.skipped += 1
          continue
        }

        const user = await db.user.findUnique({ where: { id: userId }, select: { id: true } })
        if (!user) {
          stats.skipped += 1
          continue
        }

        const priceId = sub.items.data[0]?.price.id ?? null
        const tier = mapTier(priceId)
        const status = mapStatus(sub.status)
        const currentPeriodStart = sub.current_period_start
          ? new Date(sub.current_period_start * 1000)
          : null
        const currentPeriodEnd = sub.current_period_end
          ? new Date(sub.current_period_end * 1000)
          : null

        try {
          const existing = await db.subscription.findUnique({
            where: { userId },
            select: { stripeSubscriptionId: true, status: true, tier: true, currentPeriodEnd: true },
          })

          if (!existing) {
            await db.subscription.create({
              data: {
                userId,
                stripeCustomerId: customer.id,
                stripeSubscriptionId: sub.id,
                stripePriceId: priceId,
                tier,
                status,
                currentPeriodStart,
                currentPeriodEnd,
                cancelAtPeriodEnd: sub.cancel_at_period_end,
              },
            })
            stats.created += 1
          } else {
            // Idempotent update: only write if something actually drifted
            const drift =
              existing.stripeSubscriptionId !== sub.id ||
              existing.status !== status ||
              existing.tier !== tier ||
              (existing.currentPeriodEnd?.getTime() ?? 0) !== (currentPeriodEnd?.getTime() ?? 0)
            if (drift) {
              await db.subscription.update({
                where: { userId },
                data: {
                  stripeSubscriptionId: sub.id,
                  stripePriceId: priceId,
                  tier,
                  status,
                  currentPeriodStart,
                  currentPeriodEnd,
                  cancelAtPeriodEnd: sub.cancel_at_period_end,
                },
              })
              stats.updated += 1
            } else {
              stats.skipped += 1
            }
          }
        } catch (err) {
          stats.errors.push(`${userId}: ${err instanceof Error ? err.message : String(err)}`)
        }
      }

      if (!page.has_more) {
        more = false
      } else {
        startingAfter = page.data[page.data.length - 1]?.id
      }
    }

    return NextResponse.json({ ok: true, ...stats })
  } catch (err) {
    console.error('[stripe-reconcile] fatal', err)
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err), ...stats },
      { status: 500 },
    )
  }
}

export async function GET(req: NextRequest) {
  // Vercel cron scheduler uses GET by default — alias to POST
  return POST(req)
}
