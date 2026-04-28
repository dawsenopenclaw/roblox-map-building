import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()

    // Demo mode — no Clerk session
    if (!clerkId) {
      return NextResponse.json({ url: '/billing?demo=true', demo: true })
    }

    // Try real Stripe portal
    try {
      const { db } = await import('@/lib/db')
      const { createBillingPortalSession } = await import('@/lib/stripe')
      const { clientEnv } = await import('@/lib/env')

      const user = await db.user.findUnique({ where: { clerkId }, include: { subscription: true } })
      const customerId = user?.subscription?.stripeCustomerId
      if (!customerId || customerId.startsWith('pending_')) {
        // No real Stripe customer yet — send to pricing
        return NextResponse.json({ url: '/pricing', demo: false })
      }

      const session = await createBillingPortalSession({
        customerId,
        returnUrl: `${clientEnv.NEXT_PUBLIC_APP_URL}/dashboard`,
      })
      return NextResponse.json({ url: session.url })
    } catch (err) {
      console.error('[billing/portal] DB or Stripe error, falling back to demo:', err instanceof Error ? err.message : err)
      return NextResponse.json({ url: '/billing?demo=true', demo: true })
    }
  } catch (err) {
    console.error('[billing/portal] Auth error, falling back to demo:', err instanceof Error ? err.message : err)
    return NextResponse.json({ url: '/billing?demo=true', demo: true })
  }
}
