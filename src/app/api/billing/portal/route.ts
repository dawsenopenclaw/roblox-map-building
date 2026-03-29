import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { createBillingPortalSession } from '@/lib/stripe'
import { clientEnv } from '@/lib/env'

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.user.findUnique({ where: { clerkId }, include: { subscription: true } })
  if (!user?.subscription?.stripeCustomerId)
    return NextResponse.json({ error: 'No billing account' }, { status: 404 })

  try {
    const session = await createBillingPortalSession({
      customerId: user.subscription.stripeCustomerId,
      returnUrl: `${clientEnv.NEXT_PUBLIC_APP_URL}/dashboard`,
    })
    return NextResponse.json({ url: session.url })
  } catch (e) {
    console.error('Billing portal session error:', e)
    return NextResponse.json({ error: 'Failed to create billing portal session' }, { status: 500 })
  }
}
