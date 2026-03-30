import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { db } from '@/lib/db'
import { Resend } from 'resend'
import { clientEnv } from '@/lib/env'

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

// COPPA requires annual notice to parents of under-13 users.
// We use parentConsentAt as the reference; if it's been >= 365 days, resend.
const ANNUAL_NOTICE_DAYS = 365

function getResend(): Resend {
  return new Resend(process.env.RESEND_API_KEY ?? '')
}

async function runCoppaAnnualNotice(req: NextRequest): Promise<NextResponse> {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()
    const dueBefore = new Date(now)
    dueBefore.setDate(now.getDate() - ANNUAL_NOTICE_DAYS)

    const appUrl = clientEnv.NEXT_PUBLIC_APP_URL
    const resend = getResend()

    // Paginated in batches of 200 to avoid OOM.
    const PAGE_SIZE = 200
    let cursor: string | undefined
    let totalSent = 0
    let totalSkipped = 0

    while (true) {
      // Find under-13 users whose parent gave consent >= 365 days ago and account is active
      const users = await db.user.findMany({
        where: {
          isUnder13: true,
          deletedAt: null,
          parentEmail: { not: null },
          parentConsentAt: { lte: dueBefore },
        },
        select: {
          id: true,
          email: true,
          displayName: true,
          username: true,
          parentEmail: true,
          parentConsentAt: true,
        },
        take: PAGE_SIZE,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        orderBy: { id: 'asc' },
      })

      if (users.length === 0) break
      cursor = users[users.length - 1]!.id

      for (const user of users) {
        if (!user.parentEmail) {
          totalSkipped++
          continue
        }

        const childName = user.displayName ?? user.username ?? 'your child'
        const privacyUrl = `${appUrl}/legal/privacy`
        const manageUrl = `${appUrl}/settings/account`

        try {
          await resend.emails.send({
            from: 'ForjeGames <noreply@ForjeGames.com>',
            to: user.parentEmail,
            subject: `Annual COPPA notice — ${childName}'s ForjeGames account`,
            html: `
<p>Dear parent or guardian,</p>
<p>
  This is your annual notice regarding <strong>${childName}</strong>'s account on ForjeGames,
  as required by the Children's Online Privacy Protection Act (COPPA).
</p>
<p>
  ForjeGames collects the following information from users under 13:
  username, email address, and activity data (builds, tokens used).
  This information is used solely to operate the service and is never sold to third parties.
</p>
<p>
  You may review our <a href="${privacyUrl}">Privacy Policy</a>,
  update account settings, or delete the account at any time from
  <a href="${manageUrl}">Account Settings</a>.
</p>
<p>
  To revoke consent and delete ${childName}'s account, reply to this email or
  visit the account settings page above.
</p>
<p>Thank you for trusting ForjeGames.</p>
<p>— The ForjeGames Team</p>
            `.trim(),
          })
          totalSent++
        } catch (err) {
          console.error(`[cron/coppa-annual-notice] email failed for user ${user.id}:`, err)
          totalSkipped++
        }
      }

      if (users.length < PAGE_SIZE) break
    }

    return NextResponse.json({ ok: true, totalSent, totalSkipped })
  } catch (error) {
    console.error('[cron/coppa-annual-notice] fatal:', error)
    return NextResponse.json(
      { error: 'Service temporarily unavailable' },
      { status: 503 }
    )
  }
}

export async function GET(req: NextRequest) {
  return runCoppaAnnualNotice(req)
}

export async function POST(req: NextRequest) {
  return runCoppaAnnualNotice(req)
}
