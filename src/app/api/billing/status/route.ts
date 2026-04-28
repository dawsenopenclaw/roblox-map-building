import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { SUBSCRIPTION_TIERS } from '@/lib/subscription-tiers'

export async function GET() {
  try {
    const { userId: clerkId } = await auth()

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      const { db } = await import('@/lib/db')

      const periodStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)

      const [user, marketplaceSearchCount, apiCallCount, buildsThisMonth] = await Promise.all([
        db.user.findUnique({
          where: { clerkId },
          include: {
            subscription: true,
            tokenBalance: {
              include: {
                transactions: {
                  where: {
                    type: 'SPEND',
                    createdAt: { gte: periodStart },
                  },
                  select: { amount: true },
                },
              },
            },
          },
        }),
        // Marketplace searches: provider = 'marketplace' or operation contains 'search'
        db.apiUsageRecord.count({
          where: {
            user: { clerkId },
            createdAt: { gte: periodStart },
            OR: [
              { provider: 'marketplace' },
              { operation: { contains: 'search', mode: 'insensitive' } },
            ],
          },
        }),
        // API calls: all records this month
        db.apiUsageRecord.count({
          where: {
            user: { clerkId },
            createdAt: { gte: periodStart },
          },
        }),
        // Builds this month — Build.user relation has clerkId via nested filter
        db.build.count({
          where: {
            user: { clerkId },
            createdAt: { gte: periodStart },
          },
        }),
      ])

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      const tier = (user.subscription?.tier ?? 'FREE') as keyof typeof SUBSCRIPTION_TIERS
      const tierConfig = SUBSCRIPTION_TIERS[tier]
      const tokenLimit = tierConfig.tokensPerMonth
      const tokenBalance = user.tokenBalance?.balance ?? 0

      // Sum of tokens spent this month from transactions
      const tokensSpentThisMonth = user.tokenBalance?.transactions.reduce(
        (sum, tx) => sum + Math.abs(tx.amount),
        0
      ) ?? 0

      // Tokens used = limit minus current balance, floored at 0, capped at limit
      // Fallback: use transaction sum if balance approach gives unexpected results
      const tokensUsed = Math.min(tokenLimit, Math.max(0, tokensSpentThisMonth))

      const renewDate = user.subscription?.currentPeriodEnd
        ? new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(
            new Date(user.subscription.currentPeriodEnd)
          )
        : null

      const priceMonthly = tierConfig.priceMonthly
      // Format cents to dollars: strip unnecessary trailing zeros (e.g. 999 → "$9.99", 1000 → "$10")
      const priceInDollars = priceMonthly / 100
      const monthlyPriceDisplay =
        priceMonthly === 0
          ? 'Free'
          : Number.isInteger(priceInDollars)
          ? `$${priceInDollars}`
          : `$${priceInDollars.toFixed(2)}`

      return NextResponse.json({
        plan: tier === 'FREE' ? 'Test Drive' : tierConfig.name,
        tier,
        status: user.subscription?.status ?? 'ACTIVE',
        tokensUsed,
        tokenLimit,
        tokenBalance,
        renewDate,
        monthlyPrice: monthlyPriceDisplay,
        cancelAtPeriodEnd: user.subscription?.cancelAtPeriodEnd ?? false,
        marketplaceSearches: marketplaceSearchCount,
        apiCallsThisMonth: apiCallCount,
        buildsThisMonth,
      })
    } catch (dbErr) {
      // DB not reachable at all (e.g. cold start, misconfigured) — return null so
      // the client can show Free plan defaults rather than a hard error screen.
      // Re-throw anything that isn't a connectivity error so it surfaces in Sentry.
      const msg = dbErr instanceof Error ? dbErr.message : String(dbErr)
      const isConnectivityError =
        msg.includes('Connection refused') ||
        msg.includes('Can\'t reach database') ||
        msg.includes('ECONNREFUSED') ||
        msg.includes('connect ETIMEDOUT')
      if (!isConnectivityError) throw dbErr
      return NextResponse.json(null, { status: 200 })
    }
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
