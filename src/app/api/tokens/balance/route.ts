import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
              select: {
                id: true,
                type: true,
                amount: true,
                description: true,
                createdAt: true,
              },
            },
          },
        },
      },
    })

    if (!user?.tokenBalance) {
      return NextResponse.json({ balance: 0, lifetimeEarned: 0, lifetimeSpent: 0, transactions: [] })
    }

    return NextResponse.json({
      balance: user.tokenBalance.balance,
      lifetimeEarned: user.tokenBalance.lifetimeEarned,
      lifetimeSpent: user.tokenBalance.lifetimeSpent,
      transactions: user.tokenBalance.transactions,
    })
  } catch (error) {
    console.error('Token balance error:', error)
    return NextResponse.json(
      { error: 'Service temporarily unavailable', details: 'Database not connected' },
      { status: 503 }
    )
  }
}
