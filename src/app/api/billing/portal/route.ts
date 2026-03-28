import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { createBillingPortalSession } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.user.findUnique({ where: { clerkId }, include: { subscription: true } })
  if (!user?.subscription?.stripeCustomerId)
    return NextResponse.json({ error: 'No billing account' }, { status: 404 })

  const session = await createBillingPortalSession({
    customerId: user.subscription.stripeCustomerId,
    returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  })
  return NextResponse.json({ url: session.url })
}
