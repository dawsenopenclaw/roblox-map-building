import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '../_adminGuard'
import { db } from '@/lib/db'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const sendSchema = z.object({
  subject: z.string().min(1).max(200),
  htmlContent: z.string().min(1),
  textContent: z.string().optional(),
  // If true, send to waitlist; if false, send to all users who haven't opted out
  toWaitlist: z.boolean().default(false),
  // Optional: limit to specific tier
  tier: z.enum(['FREE', 'HOBBY', 'CREATOR', 'STUDIO']).optional(),
})

// GET: List all newsletter subscribers (users + waitlist)
export async function GET(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const source = searchParams.get('source') ?? 'all' // all, users, waitlist

  try {
    const results: { email: string; source: string; joinedAt: string }[] = []

    if (source === 'all' || source === 'users') {
      const users = await db.user.findMany({
        where: {
          deletedAt: null,
          marketingEmailsOptOut: false,
        },
        select: { email: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      })
      for (const u of users) {
        results.push({ email: u.email, source: 'user', joinedAt: u.createdAt.toISOString() })
      }
    }

    if (source === 'all' || source === 'waitlist') {
      const waitlist = await db.waitlist.findMany({
        select: { email: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      })
      for (const w of waitlist) {
        results.push({ email: w.email, source: 'waitlist', joinedAt: w.createdAt.toISOString() })
      }
    }

    // Deduplicate by email
    const seen = new Set<string>()
    const unique = results.filter((r) => {
      const lower = r.email.toLowerCase()
      if (seen.has(lower)) return false
      seen.add(lower)
      return true
    })

    return NextResponse.json({
      subscribers: unique,
      total: unique.length,
      breakdown: {
        users: unique.filter((r) => r.source === 'user').length,
        waitlist: unique.filter((r) => r.source === 'waitlist').length,
      },
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to fetch subscribers' },
      { status: 500 }
    )
  }
}

// POST: Send a newsletter
export async function POST(req: NextRequest) {
  const adminResult = await requireAdmin()
  if (adminResult.error) return adminResult.error

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = sendSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { subject, htmlContent, textContent, toWaitlist, tier } = parsed.data

  try {
    // Collect recipients
    const recipients: string[] = []

    if (toWaitlist) {
      const waitlist = await db.waitlist.findMany({ select: { email: true } })
      recipients.push(...waitlist.map((w) => w.email))
    } else {
      const where: Record<string, unknown> = {
        deletedAt: null,
        marketingEmailsOptOut: false,
      }
      if (tier) {
        where.subscription = { tier }
      }
      const users = await db.user.findMany({
        where,
        select: { email: true },
      })
      recipients.push(...users.map((u) => u.email))
    }

    if (recipients.length === 0) {
      return NextResponse.json({ error: 'No recipients found' }, { status: 400 })
    }

    // Send via Resend in batches of 50
    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey) {
      return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 })
    }

    let sent = 0
    let failed = 0
    const batchSize = 50
    const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'ForjeGames <noreply@forjegames.com>'

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize)
      try {
        const res = await fetch('https://api.resend.com/emails/batch', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(
            batch.map((email) => ({
              from: fromEmail,
              to: email,
              subject,
              html: htmlContent,
              ...(textContent ? { text: textContent } : {}),
            }))
          ),
        })
        if (res.ok) {
          sent += batch.length
        } else {
          failed += batch.length
        }
      } catch {
        failed += batch.length
      }
    }

    // Log the campaign
    await db.auditLog.create({
      data: {
        userId: adminResult.user?.id ?? null,
        action: 'ADMIN_NEWSLETTER_SEND',
        resource: 'newsletter',
        metadata: {
          subject,
          recipientCount: recipients.length,
          sent,
          failed,
          toWaitlist,
          tier: tier ?? null,
        },
      },
    })

    return NextResponse.json({
      success: true,
      sent,
      failed,
      totalRecipients: recipients.length,
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to send newsletter' },
      { status: 500 }
    )
  }
}
