import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

const DEMO_TRANSACTIONS = [
  { id: 'tx_d1', type: 'CREDIT', amount: 1000, description: 'Monthly token refresh — Pro plan', createdAt: new Date('2026-03-01').toISOString() },
  { id: 'tx_d2', type: 'DEBIT',  amount:   45, description: 'Terrain generation (volcanic island)', createdAt: new Date('2026-03-05').toISOString() },
  { id: 'tx_d3', type: 'DEBIT',  amount:   62, description: 'Building placement (medieval castle)', createdAt: new Date('2026-03-08').toISOString() },
  { id: 'tx_d4', type: 'DEBIT',  amount:   38, description: 'NPC creation (Gareth the Smith)',      createdAt: new Date('2026-03-10').toISOString() },
  { id: 'tx_d5', type: 'DEBIT',  amount:   52, description: 'Script generation (coin collection)',  createdAt: new Date('2026-03-14').toISOString() },
  { id: 'tx_d6', type: 'DEBIT',  amount:   28, description: 'UI build (health bar HUD)',            createdAt: new Date('2026-03-17').toISOString() },
  { id: 'tx_d7', type: 'DEBIT',  amount:   72, description: 'Combat system deployment',             createdAt: new Date('2026-03-21').toISOString() },
  { id: 'tx_d8', type: 'DEBIT',  amount:   55, description: 'Economy system configuration',         createdAt: new Date('2026-03-25').toISOString() },
]

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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

    // Demo mode: 1,000 starting tokens minus what the demo transactions spent
    const spent = DEMO_TRANSACTIONS.filter((t) => t.type === 'DEBIT').reduce((s, t) => s + t.amount, 0)
    const demoBalance = Math.max(0, 1000 - spent)

    return NextResponse.json({
      balance: demoBalance,
      lifetimeEarned: 1000,
      lifetimeSpent: spent,
      transactions: DEMO_TRANSACTIONS.slice().reverse(),
      demo: true,
    })
  } catch (error) {
    // Last-resort fallback — always return something usable
    return NextResponse.json({
      balance: 1000,
      lifetimeEarned: 1000,
      lifetimeSpent: 0,
      transactions: [],
      demo: true,
    })
  }
}
