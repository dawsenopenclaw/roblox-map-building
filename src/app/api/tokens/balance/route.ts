import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

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
