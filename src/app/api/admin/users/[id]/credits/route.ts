import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '../../../_adminGuard'
import { db } from '@/lib/db'
import { z } from 'zod'

const creditSchema = z.object({
  action: z.enum(['grant', 'deduct']),
  amount: z.number().int().min(1).max(999_999_999),
  reason: z.string().min(1).max(500),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminResult = await requireAdmin()
  if (adminResult.error) return adminResult.error

  const { id: userId } = await params
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = creditSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { action, amount, reason } = parsed.data

  // Verify user exists
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true },
  })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  try {
    if (action === 'grant') {
      const balance = await db.tokenBalance.upsert({
        where: { userId },
        create: { userId, balance: amount, lifetimeEarned: amount },
        update: {
          balance: { increment: amount },
          lifetimeEarned: { increment: amount },
        },
      })

      await db.$transaction([
        db.tokenTransaction.create({
          data: {
            balanceId: balance.id,
            type: 'BONUS',
            amount,
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
            metadata: { targetEmail: user.email, amount, reason },
          },
        }),
      ])

      return NextResponse.json({ success: true, newBalance: balance.balance + amount, action })
    } else {
      // Deduct
      const existing = await db.tokenBalance.findUnique({ where: { userId } })
      if (!existing) {
        return NextResponse.json({ error: 'User has no token balance' }, { status: 400 })
      }
      if (existing.balance < amount) {
        return NextResponse.json(
          { error: `Insufficient balance: ${existing.balance} < ${amount}` },
          { status: 400 }
        )
      }

      const updated = await db.tokenBalance.update({
        where: { userId },
        data: {
          balance: { decrement: amount },
          lifetimeSpent: { increment: amount },
        },
      })

      await db.$transaction([
        db.tokenTransaction.create({
          data: {
            balanceId: updated.id,
            type: 'SPEND',
            amount: -amount,
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
            metadata: { targetEmail: user.email, amount, reason },
          },
        }),
      ])

      return NextResponse.json({ success: true, newBalance: updated.balance, action })
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Credit operation failed' },
      { status: 500 }
    )
  }
}

// GET: Fetch credit transaction log for a user
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id: userId } = await params

  try {
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
      return NextResponse.json({ balance: 0, transactions: [] })
    }

    return NextResponse.json({
      balance: balance.balance,
      lifetimeEarned: balance.lifetimeEarned,
      lifetimeSpent: balance.lifetimeSpent,
      transactions: balance.transactions,
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to fetch credits' },
      { status: 500 }
    )
  }
}
