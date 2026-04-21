/**
 * GET|POST /api/crons/email-drip
 *
 * Automated drip campaign — sends 3 milestone emails to free-tier signups:
 *
 *   Day 1 (23-25h after signup):  Welcome + first build nudge
 *   Day 3 (71-73h after signup):  Social proof / showcase
 *   Day 7 (167-169h after signup): Upgrade pitch
 *
 * Runs every 2 hours via Vercel cron. CRON_SECRET gated.
 *
 * Deduplication: checks AuditLog for DRIP_EMAIL_DAY_1 / DAY_3 / DAY_7
 * entries per user before sending. Creates an entry after each successful send.
 *
 * Respects marketingEmailsOptOut on the User model.
 */

import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { Resend } from 'resend'
import { db } from '@/lib/db'
import { dripDay1, dripDay3, dripDay7 } from '@/lib/email/drip-templates'

export const runtime = 'nodejs'
export const maxDuration = 60

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

function verifyCronSecret(req: NextRequest): boolean {
  // Support both x-cron-secret header (Vercel cron) and Authorization bearer
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

// ---------------------------------------------------------------------------
// Drip windows (in milliseconds from signup)
// ---------------------------------------------------------------------------

interface DripStep {
  day: number
  /** Action string stored in AuditLog */
  action: string
  /** Minimum ms since signup */
  minMs: number
  /** Maximum ms since signup */
  maxMs: number
  subject: (name: string) => string
  html: (params: { name: string; baseUrl: string; unsubscribeToken: string }) => string
}

const HOUR = 60 * 60 * 1000

const DRIP_STEPS: DripStep[] = [
  {
    day: 1,
    action: 'DRIP_EMAIL_DAY_1',
    minMs: 23 * HOUR,
    maxMs: 25 * HOUR,
    subject: (name) => `Your first build awaits, ${name}`,
    html: dripDay1,
  },
  {
    day: 3,
    action: 'DRIP_EMAIL_DAY_3',
    minMs: 71 * HOUR,
    maxMs: 73 * HOUR,
    subject: (name) => `${name}, check out what others are building`,
    html: dripDay3,
  },
  {
    day: 7,
    action: 'DRIP_EMAIL_DAY_7',
    minMs: 167 * HOUR,
    maxMs: 169 * HOUR,
    subject: (name) => `Ready to level up, ${name}?`,
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
    day1Sent: 0,
    day3Sent: 0,
    day7Sent: 0,
    skipped: 0,
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
        },
        take: 200, // cap per step to stay within lambda timeout
      })

      for (const user of users) {
        if (!user.email) {
          stats.skipped++
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
          stats.skipped++
          continue
        }

        const name = user.displayName || user.username || 'Builder'
        // Use the user ID as a simple unsubscribe token (the unsubscribe
        // page should validate and set marketingEmailsOptOut = true)
        const unsubscribeToken = user.id

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
