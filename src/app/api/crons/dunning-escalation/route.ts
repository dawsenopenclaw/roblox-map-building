/**
 * GET /api/crons/dunning-escalation
 *
 * Daily dunning escalation (8am UTC). Sends follow-up emails to users whose
 * subscriptions are PAST_DUE:
 *
 *   Day 1: Already handled by the invoice.payment_failed webhook (existing dunning email)
 *   Day 3: "Heads up — your subscription is pausing soon" (gold accents, friendly)
 *   Day 7: "Last chance — your plan will be canceled tomorrow" (red accents, urgent)
 *
 * Dedup: Each send is gated by an AuditLog entry (DUNNING_DAY3_SENT / DUNNING_DAY7_SENT)
 * keyed by subscription ID, so re-runs are safe.
 *
 * CRON_SECRET gated.
 */

import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { db } from '@/lib/db'
import { sendDunningDay3Email, sendDunningDay7Email } from '@/lib/email'

export const runtime = 'nodejs'
export const maxDuration = 60

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

function verifyCronSecret(req: NextRequest): boolean {
  const secret =
    req.headers.get('x-cron-secret') ||
    req.headers.get('authorization')?.replace('Bearer ', '')
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

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const now = new Date()
  let day3Sent = 0
  let day7Sent = 0
  let skipped = 0

  try {
    // Find all PAST_DUE subscriptions
    const pastDueSubs = await db.subscription.findMany({
      where: { status: 'PAST_DUE' },
      select: {
        id: true,
        stripeSubscriptionId: true,
        tier: true,
        currentPeriodEnd: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            marketingEmailsOptOut: true,
          },
        },
      },
    })

    for (const sub of pastDueSubs) {
      if (!sub.user?.email) {
        skipped++
        continue
      }

      // Calculate days since subscription went PAST_DUE.
      // We use the first DUNNING_DAY1 audit log (the webhook dunning email)
      // or fall back to the subscription's updatedAt timestamp.
      const firstDunning = await db.auditLog.findFirst({
        where: {
          action: 'STRIPE_WEBHOOK_PROCESSED',
          userId: sub.user.id,
          metadata: {
            path: ['eventType'],
            equals: 'invoice.payment_failed',
          },
        },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      })

      const pastDueSince = firstDunning?.createdAt ?? sub.updatedAt
      const daysSinceFail = Math.floor(
        (now.getTime() - pastDueSince.getTime()) / (1000 * 60 * 60 * 24)
      )

      const subKey = sub.stripeSubscriptionId ?? sub.id

      // Day 7 check first (higher priority — if both are due, send day 7)
      if (daysSinceFail >= 7) {
        const alreadySent = await db.auditLog.findFirst({
          where: {
            action: 'DUNNING_DAY7_SENT',
            resourceId: subKey,
          },
          select: { id: true },
        })
        if (!alreadySent) {
          await sendDunningDay7Email({
            email: sub.user.email,
            name: sub.user.displayName ?? 'Creator',
            tier: sub.tier,
          })
          await db.auditLog.create({
            data: {
              action: 'DUNNING_DAY7_SENT',
              resource: 'subscription',
              resourceId: subKey,
              userId: sub.user.id,
              metadata: { tier: sub.tier, daysSinceFail },
            },
          })
          day7Sent++
          continue
        }
        skipped++
        continue
      }

      // Day 3 check
      if (daysSinceFail >= 3) {
        const alreadySent = await db.auditLog.findFirst({
          where: {
            action: 'DUNNING_DAY3_SENT',
            resourceId: subKey,
          },
          select: { id: true },
        })
        if (!alreadySent) {
          await sendDunningDay3Email({
            email: sub.user.email,
            name: sub.user.displayName ?? 'Creator',
            tier: sub.tier,
          })
          await db.auditLog.create({
            data: {
              action: 'DUNNING_DAY3_SENT',
              resource: 'subscription',
              resourceId: subKey,
              userId: sub.user.id,
              metadata: { tier: sub.tier, daysSinceFail },
            },
          })
          day3Sent++
          continue
        }
        skipped++
        continue
      }

      // Less than 3 days — too early for escalation
      skipped++
    }

    return NextResponse.json({
      ok: true,
      pastDueCount: pastDueSubs.length,
      day3Sent,
      day7Sent,
      skipped,
    })
  } catch (err) {
    console.error('[dunning-escalation] Error:', err)
    return NextResponse.json(
      { error: 'internal_error', message: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}
