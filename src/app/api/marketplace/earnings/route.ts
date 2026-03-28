import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { stripe } from '@/lib/stripe'

// GET /api/marketplace/earnings — creator earnings summary
export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.user.findUnique({
    where: { clerkId },
    include: { creatorAccount: true },
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  if (!user.creatorAccount) {
    return NextResponse.json({
      connected: false,
      pendingBalanceCents: 0,
      totalEarnedCents: 0,
      lastPayoutAt: null,
    })
  }

  const { creatorAccount } = user

  // Sync account status from Stripe
  try {
    const stripeAccount = await stripe.accounts.retrieve(creatorAccount.stripeAccountId)
    await db.creatorAccount.update({
      where: { id: creatorAccount.id },
      data: {
        chargesEnabled: stripeAccount.charges_enabled,
        payoutsEnabled: stripeAccount.payouts_enabled,
        detailsSubmitted: stripeAccount.details_submitted,
      },
    })
  } catch {
    // Non-fatal — return cached data
  }

  // Recent purchases where this creator earned
  const recentSales = await db.templatePurchase.findMany({
    where: {
      template: { creatorId: user.id },
      createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { template: { select: { title: true } } },
  })

  return NextResponse.json({
    connected: true,
    chargesEnabled: creatorAccount.chargesEnabled,
    payoutsEnabled: creatorAccount.payoutsEnabled,
    detailsSubmitted: creatorAccount.detailsSubmitted,
    pendingBalanceCents: creatorAccount.pendingBalanceCents,
    totalEarnedCents: creatorAccount.totalEarnedCents,
    lastPayoutAt: creatorAccount.lastPayoutAt,
    recentSales,
  })
}
