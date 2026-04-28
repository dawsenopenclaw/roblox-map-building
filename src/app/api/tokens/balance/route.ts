import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'

const FREE_SIGNUP_TOKENS = 1000

export async function GET() {
  try {
    const { userId: clerkId } = await auth()

    // Unauthenticated — return zero state, not fake transaction history
    if (!clerkId) {
      return NextResponse.json({
        balance: 0,
        lifetimeEarned: 0,
        lifetimeSpent: 0,
        transactions: [],
        demo: true,
      })
    }

    // Try real database first
    try {
      const { db } = await import('@/lib/db')
      const user = await db.user.findUnique({
        where: { clerkId },
        select: {
          id: true,
          tokenBalance: {
            select: {
              balance: true,
              lifetimeEarned: true,
              lifetimeSpent: true,
              transactions: {
                orderBy: { createdAt: 'desc' },
                take: 10,
                select: { id: true, type: true, amount: true, description: true, createdAt: true },
              },
            },
          },
        },
      })
      if (user?.tokenBalance) {
        return NextResponse.json({
          balance: user.tokenBalance.balance,
          lifetimeEarned: user.tokenBalance.lifetimeEarned,
          lifetimeSpent: user.tokenBalance.lifetimeSpent,
          transactions: user.tokenBalance.transactions,
          demo: false,
        })
      }

      // User row exists but tokenBalance is missing — create it now.
      // This covers the case where the webhook created the user but crashed
      // before inserting the tokenBalance row.
      if (user && !user.tokenBalance) {
        const created = await db.tokenBalance.upsert({
          where: { userId: user.id },
          create: { userId: user.id, balance: FREE_SIGNUP_TOKENS, lifetimeEarned: FREE_SIGNUP_TOKENS },
          update: {}, // race guard — if another request just created it, leave it alone
        })
        return NextResponse.json({
          balance: created.balance,
          lifetimeEarned: created.lifetimeEarned,
          lifetimeSpent: created.lifetimeSpent,
          transactions: [],
          demo: false,
        })
      }

      // User row doesn't exist yet — the Clerk webhook hasn't fired or is delayed.
      // Create the full user + subscription + tokenBalance inline so the new user
      // doesn't stare at a 0-token balance while waiting for the webhook.
      if (!user) {
        let email = `${clerkId}@placeholder.local`
        let displayName: string | null = null
        let avatarUrl: string | null = null
        try {
          const client = await clerkClient()
          const clerkUser = await client.users.getUser(clerkId)
          const primary = clerkUser.emailAddresses.find(
            (e) => e.id === clerkUser.primaryEmailAddressId
          )
          if (primary) email = primary.emailAddress
          displayName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || null
          avatarUrl = clerkUser.imageUrl
        } catch { /* use placeholder */ }

        const created = await db.$transaction(async (tx) => {
          const newUser = await tx.user.create({
            data: { clerkId, email, displayName, avatarUrl },
          })
          await tx.subscription.create({
            data: {
              userId: newUser.id,
              stripeCustomerId: `pending_${newUser.id}`,
              tier: 'FREE',
              status: 'ACTIVE',
            },
          })
          return tx.tokenBalance.upsert({
            where: { userId: newUser.id },
            create: { userId: newUser.id, balance: FREE_SIGNUP_TOKENS, lifetimeEarned: FREE_SIGNUP_TOKENS },
            update: {},
          })
        })
        return NextResponse.json({
          balance: created.balance,
          lifetimeEarned: created.lifetimeEarned,
          lifetimeSpent: created.lifetimeSpent,
          transactions: [],
          demo: false,
        })
      }
    } catch {
      // DB not connected — fall through to demo mode
    }

    // Authenticated but DB unavailable — return empty state, not fake history
    return NextResponse.json({
      balance: 0,
      lifetimeEarned: 0,
      lifetimeSpent: 0,
      transactions: [],
      demo: true,
    })
  } catch {
    // Last-resort fallback — always return something usable
    return NextResponse.json({
      balance: 0,
      lifetimeEarned: 0,
      lifetimeSpent: 0,
      transactions: [],
      demo: true,
    })
  }
}
