import { requireAdmin } from '../_adminGuard'
import { db } from '@/lib/db'
import { earnTokens } from '@/lib/tokens-server'
import { NextResponse } from 'next/server'

/**
 * POST /api/admin/test-payment
 * Simulates a $1 payment: creates a token transaction, a cost snapshot,
 * and an audit log entry. Admin-only.
 */
export async function POST() {
  const { error, user } = await requireAdmin()
  if (error) return error

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  // 1. Grant 100 tokens (simulating a $1 purchase)
  await earnTokens(user!.id, 100, 'PURCHASE', 'Test payment — $1.00 (100 tokens)', {
    test: true,
    amountCents: 100,
    source: 'admin-test',
  })

  // 2. Record in DailyCostSnapshot (simulate $1 revenue = 1,000,000 micro-dollars)
  await db.dailyCostSnapshot.upsert({
    where: { date: today },
    create: {
      date: today,
      providerCosts: { test_payment: 1_000_000 },
      totalCostUsdMicro: 0,
      totalRevenueMicro: 1_000_000,
      marginMicro: 1_000_000,
    },
    update: {
      totalRevenueMicro: { increment: 1_000_000 },
      marginMicro: { increment: 1_000_000 },
    },
  })

  // 3. Audit log
  await db.auditLog.create({
    data: {
      userId: user!.id,
      action: 'admin.test_payment',
      resource: 'payment',
      metadata: {
        amountCents: 100,
        tokens: 100,
        description: 'Simulated $1 test payment',
      },
    },
  })

  return NextResponse.json({
    success: true,
    message: 'Test payment simulated: $1.00 → 100 tokens credited',
    userId: user!.id,
    tokens: 100,
    amountCents: 100,
  })
}
