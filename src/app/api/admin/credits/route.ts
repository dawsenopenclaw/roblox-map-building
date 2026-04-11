import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '../_adminGuard'
import { db } from '@/lib/db'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const creditSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  amount: z.number().int().min(1, 'Amount must be at least 1').max(999_999_999),
  reason: z.string().min(1, 'Reason is required').max(500),
})

/**
 * POST /api/admin/credits
 *
 * Grant or deduct credits for a user.
 * Positive `amount` = grant, negative `amount` = deduct.
 *
 * Body: { userId: string, amount: number, reason: string }
 */
export async function POST(req: NextRequest) {
  const adminResult = await requireAdmin()
  if (adminResult.error) return adminResult.error

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Allow negative amounts for deductions at the schema level
  const parsed = creditSchema
    .extend({ amount: z.number().int().min(-999_999_999).max(999_999_999).refine((v) => v !== 0, 'Amount cannot be zero') })
    .safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { userId, amount, reason } = parsed.data
  const isGrant = amount > 0
  const absAmount = Math.abs(amount)

  // Verify user exists
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true },
  })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  try {
    if (isGrant) {
      // --- Grant credits ---
      const balance = await db.tokenBalance.upsert({
        where: { userId },
        create: { userId, balance: absAmount, lifetimeEarned: absAmount },
        update: {
          balance: { increment: absAmount },
          lifetimeEarned: { increment: absAmount },
        },
      })

      await db.$transaction([
        db.tokenTransaction.create({
          data: {
            balanceId: balance.id,
            type: 'BONUS',
            amount: absAmount,
            description: `Admin grant: ${reason}`,
            metadata: {
              adminId: adminResult.user?.id ?? null,
              adminEmail: adminResult.user?.email ?? null,
              reason,
              label: 'ADMIN_CREDIT_GRANT',
            },
          },
        }),
        db.auditLog.create({
          data: {
            userId: adminResult.user?.id ?? null,
            action: 'ADMIN_CREDIT_GRANT',
            resource: 'tokenBalance',
            resourceId: userId,
            metadata: { targetEmail: user.email, amount: absAmount, reason },
          },
        }),
      ])

      return NextResponse.json({
        success: true,
        action: 'grant',
        amount: absAmount,
        newBalance: balance.balance + absAmount,
        userId,
      })
    } else {
      // --- Deduct credits ---
      const existing = await db.tokenBalance.findUnique({ where: { userId } })
      if (!existing) {
        return NextResponse.json({ error: 'User has no token balance' }, { status: 400 })
      }
      if (existing.balance < absAmount) {
        return NextResponse.json(
          {
            error: `Insufficient balance: user has ${existing.balance} tokens, tried to deduct ${absAmount}`,
            currentBalance: existing.balance,
          },
          { status: 400 }
        )
      }

      const updated = await db.tokenBalance.update({
        where: { userId },
        data: {
          balance: { decrement: absAmount },
          lifetimeSpent: { increment: absAmount },
        },
      })

      await db.$transaction([
        db.tokenTransaction.create({
          data: {
            balanceId: updated.id,
            type: 'SPEND',
            amount: -absAmount,
            description: `Admin deduction: ${reason}`,
            metadata: {
              adminId: adminResult.user?.id ?? null,
              adminEmail: adminResult.user?.email ?? null,
              reason,
              label: 'ADMIN_CREDIT_DEDUCT',
            },
          },
        }),
        db.auditLog.create({
          data: {
            userId: adminResult.user?.id ?? null,
            action: 'ADMIN_CREDIT_DEDUCT',
            resource: 'tokenBalance',
            resourceId: userId,
            metadata: { targetEmail: user.email, amount: absAmount, reason },
          },
        }),
      ])

      return NextResponse.json({
        success: true,
        action: 'deduct',
        amount: absAmount,
        newBalance: updated.balance,
        userId,
      })
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Credit operation failed' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/credits?userId=...
 *
 * Fetch credit balance and transaction history for a user.
 */
export async function GET(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'userId query parameter is required' }, { status: 400 })
  }

  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, username: true },
    })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const balance = await db.tokenBalance.findUnique({
      where: { userId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 100,
        },
      },
    })

    if (!balance) {
      return NextResponse.json({
        user,
        balance: 0,
        lifetimeEarned: 0,
        lifetimeSpent: 0,
        transactions: [],
      })
    }

    return NextResponse.json({
      user,
      balance: balance.balance,
      lifetimeEarned: balance.lifetimeEarned,
      lifetimeSpent: balance.lifetimeSpent,
      transactions: balance.transactions.map((t) => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        description: t.description,
        metadata: t.metadata,
        createdAt: t.createdAt.toISOString(),
      })),
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to fetch credits' },
      { status: 500 }
    )
  }
}
