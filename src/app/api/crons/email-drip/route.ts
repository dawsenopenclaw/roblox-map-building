/**
 * GET|POST /api/crons/email-drip
 *
 * Automated drip campaign — sends 2 milestone emails to free-tier signups:
 *
 *   Day 3 (2.5-3.5 days after signup): "Did you try building yet?" — showcase
 *   Day 7 (6.5-7.5 days after signup): "Builders like you" — social proof + CTA
 *
 * Runs every 2 hours via Vercel cron. CRON_SECRET gated.
 *
 * Welcome email (Day 1) is sent immediately on signup via the Clerk webhook,
 * so it's NOT included in this cron.
 *
 * Skip logic:
 *   - Users with 5+ builds (token DEBIT transactions) are engaged — skip them
 *   - Users who opted out of marketing emails — skip them
 *   - Users who already received this drip step — skip (dedup via AuditLog)
 *
 * CAN-SPAM: All emails include unsubscribe link + physical address.
 */

import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { Resend } from 'resend'
import { db } from '@/lib/db'
import { dripDay3, dripDay7 } from '@/lib/email/drip-templates'
import { createUnsubscribeToken } from '@/app/api/email/unsubscribe/route'

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
// Resend client
// ---------------------------------------------------------------------------

let _resend: Resend | null = null
function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY || '')
  }
  return _resend
}

const FROM_EMAIL = process.env.FROM_EMAIL || 'ForjeGames <noreply@forjegames.com>'
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://forjegames.com'

/** Users with this many or more builds are already engaged — skip drip emails */
const ENGAGED_BUILD_THRESHOLD = 5

// ---------------------------------------------------------------------------
// Drip windows (in milliseconds from signup)
// ---------------------------------------------------------------------------

interface DripStep {
  day: number
  action: string
  /** Minimum ms since signup */
  minMs: number
  /** Maximum ms since signup */
  maxMs: number
  subject: (name: string) => string
  html: (params: { name: string; baseUrl: string; unsubscribeToken: string }) => string
}

const DAY = 24 * 60 * 60 * 1000

const DRIP_STEPS: DripStep[] = [
  {
    day: 3,
    action: 'DRIP_EMAIL_DAY_3',
    minMs: 2.5 * DAY,
    maxMs: 3.5 * DAY,
    subject: (name) => `${name}, did you try building yet?`,
    html: dripDay3,
  },
  {
    day: 7,
    action: 'DRIP_EMAIL_DAY_7',
    minMs: 6.5 * DAY,
    maxMs: 7.5 * DAY,
    subject: (name) => `Builders like you are creating games, ${name}`,
    html: dripDay7,
  },
]

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

async function handler(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 })
  }

  const now = Date.now()
  const stats: Record<string, number> = {
    day3Sent: 0,
    day7Sent: 0,
    skippedEngaged: 0,
    skippedDupe: 0,
    skippedNoEmail: 0,
    errors: 0,
  }

  try {
    for (const step of DRIP_STEPS) {
      const windowStart = new Date(now - step.maxMs)
      const windowEnd = new Date(now - step.minMs)

      // Find users who signed up within this drip window
      const users = await db.user.findMany({
        where: {
          createdAt: { gte: windowStart, lte: windowEnd },
          deletedAt: null,
          marketingEmailsOptOut: false,
          email: { not: null },
        },
        select: {
          id: true,
          email: true,
          displayName: true,
          username: true,
          tokenBalance: {
            select: {
              transactions: {
                where: { type: 'DEBIT' },
                select: { id: true },
              },
            },
          },
        },
        take: 200, // cap per step to stay within lambda timeout
      })

      for (const user of users) {
        if (!user.email) {
          stats.skippedNoEmail++
          continue
        }

        // Skip engaged users (5+ builds)
        const buildCount = user.tokenBalance?.transactions?.length ?? 0
        if (buildCount >= ENGAGED_BUILD_THRESHOLD) {
          stats.skippedEngaged++
          continue
        }

        // Dedup: check if we already sent this drip email to this user
        const alreadySent = await db.auditLog.findFirst({
          where: {
            userId: user.id,
            action: step.action,
          },
          select: { id: true },
        })

        if (alreadySent) {
          stats.skippedDupe++
          continue
        }

        const name = user.displayName || user.username || 'Builder'
        const unsubscribeToken = createUnsubscribeToken(user.id)

        try {
          await getResend().emails.send({
            from: FROM_EMAIL,
            to: user.email,
            subject: step.subject(name),
            html: step.html({ name, baseUrl: BASE_URL, unsubscribeToken }),
          })

          // Record successful send in audit log
          await db.auditLog.create({
            data: {
              userId: user.id,
              action: step.action,
              resource: 'email',
              resourceId: user.email,
              metadata: { day: step.day, sentAt: new Date().toISOString() },
            },
          })

          const key = `day${step.day}Sent` as keyof typeof stats
          stats[key]++
        } catch (err) {
          console.error(`[email-drip] Failed to send Day ${step.day} to ${user.email}:`, err)
          stats.errors++
        }
      }
    }

    return NextResponse.json({ ok: true, ...stats })
  } catch (err) {
    console.error('[email-drip] fatal', err)
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err), ...stats },
      { status: 500 },
    )
  }
}

export async function GET(req: NextRequest) {
  return handler(req)
}

export async function POST(req: NextRequest) {
  return handler(req)
}
