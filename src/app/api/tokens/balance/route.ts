import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.user.findUnique({
    where: { clerkId },
    include: {
      tokenBalance: {
        include: {
          transactions: { orderBy: { createdAt: 'desc' }, take: 10 },
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
}
