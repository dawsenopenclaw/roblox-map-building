import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { stripe } from '@/lib/stripe'

// POST /api/marketplace/connect/onboard — create or retrieve Stripe Connect Express account
export async function POST(req: NextRequest) {
  // Demo mode: if auth() throws (no Clerk keys), return a demo response
  let clerkId: string | null = null
  try {
    const session = await auth()
    clerkId = session?.userId ?? null
  } catch { /* demo mode — Clerk not configured */ }

  if (!clerkId) {
    return NextResponse.json({ demo: true, url: '/marketplace' })
  }

  try {

    const user = await db.user.findUnique({
      where: { clerkId },
      include: { creatorAccount: true },
    })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    let stripeAccountId: string

    if (user.creatorAccount?.stripeAccountId) {
      stripeAccountId = user.creatorAccount.stripeAccountId
    } else {
      // Create new Express account
      const account = await stripe.accounts.create(
        {
          type: 'express',
          email: user.email,
          metadata: { userId: user.id },
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
        },
        { idempotencyKey: `connect_account_create_${user.id}` },
      )
      stripeAccountId = account.id

      try {
        await db.creatorAccount.create({
          data: {
            userId: user.id,
            stripeAccountId,
          },
        })
      } catch (dbErr) {
        // Rollback the Stripe account to avoid orphaned accounts
        await stripe.accounts.del(stripeAccountId).catch(() => {
          // Best-effort — log if deletion also fails
          console.error('[connect/onboard] Failed to delete orphaned Stripe account', { stripeAccountId })
        })
        throw dbErr
      }
    }

    // Generate onboarding link
    const body = await req.json().catch(() => ({})) as { returnUrl?: string; refreshUrl?: string }
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://forjegames.com'
    const returnUrl = body.returnUrl || `${baseUrl}/marketplace/earnings?onboarded=1`
    const refreshUrl = body.refreshUrl || `${baseUrl}/marketplace/earnings?refresh=1`

    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    })

    return NextResponse.json({ url: accountLink.url })
  } catch (error) {
    return NextResponse.json(
      { error: 'Service temporarily unavailable', details: 'Database not connected' },
      { status: 503 }
    )
  }
}
