/**
 * GET /api/internal/cron/coppa-annual-notice
 *
 * Sends annual COPPA parental consent renewal notices to parents of minor users.
 * Required by COPPA: operators must obtain renewed verifiable parental consent annually.
 * Scheduled: annually on January 1st at 08:00 UTC via vercel.json cron.
 * Secured by CRON_SECRET header.
 */

import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual, randomBytes } from 'crypto'
import { db } from '@/lib/db'
import { sendParentalConsentEmail } from '@/lib/email'

function isCronAuthorized(req: NextRequest): boolean {
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

const CONSENT_RENEWAL_DAYS = 365
const TOKEN_EXPIRY_DAYS = 30

export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const renewalThreshold = new Date()
  renewalThreshold.setDate(renewalThreshold.getDate() - CONSENT_RENEWAL_DAYS)

  try {
    // Find minor users (under 13 via dateOfBirth) with parental consent older than 1 year
    // or those who have a parent email but consent was never confirmed
    const minorUsers = await db.user.findMany({
      where: {
        deletedAt: null,
        parentEmail: { not: null },
        OR: [
          // Consent was granted but is now more than 1 year old
          { parentConsentAt: { lte: renewalThreshold } },
          // Consent was never granted (parentConsentAt is null but parentEmail exists)
          { parentConsentAt: null },
        ],
      },
      select: {
        id: true,
        displayName: true,
        parentEmail: true,
      },
      take: 200, // COPPA users are a small subset
    })

    let sent = 0
    let failed = 0

    await Promise.allSettled(
      minorUsers.map(async (user) => {
        if (!user.parentEmail) return

        try {
          // Issue a fresh consent token
          const token = randomBytes(32).toString('hex')
          const tokenExp = new Date()
          tokenExp.setDate(tokenExp.getDate() + TOKEN_EXPIRY_DAYS)

          await db.user.update({
            where: { id: user.id },
            data: {
              parentConsentToken: token,
              parentConsentTokenExp: tokenExp,
              // Reset consent so they must re-approve
              parentConsentAt: null,
            },
          })

          await sendParentalConsentEmail({
            parentEmail: user.parentEmail,
            childName: user.displayName ?? 'your child',
            token,
          })
          sent++
        } catch {
          failed++
        }
      })
    )

    return NextResponse.json({ ok: true, sent, failed, total: minorUsers.length })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[cron/coppa-annual-notice] failed:', message)
    return NextResponse.json({ error: 'Internal error', details: message }, { status: 500 })
  }
}
