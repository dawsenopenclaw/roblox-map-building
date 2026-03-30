import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '../../_adminGuard'
import { db } from '@/lib/db'
import { adminUserUpdateSchema, parseBody } from '@/lib/validations'

type Params = { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { id } = await params
    const parsed = await parseBody(req, adminUserUpdateSchema)
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: parsed.status })
    }
    const { role, tier, banned, refundTokens } = parsed.data

    // Update role
    if (role) {
      await db.user.update({
        where: { id },
        data: { role },
      })
    }

    // Update subscription tier
    if (tier) {
      await db.subscription.upsert({
        where: { userId: id },
        create: {
          userId: id,
          stripeCustomerId: `admin_override_${id}`,
          tier,
          status: 'ACTIVE',
        },
        update: { tier },
      })
    }

    // Ban / unban
    if (typeof banned === 'boolean') {
      await db.user.update({
        where: { id },
        data: { deletedAt: banned ? new Date() : null },
      })
    }

    // Refund tokens (grant 500 back)
    if (refundTokens) {
      const balance = await db.tokenBalance.findUnique({ where: { userId: id } })
      if (balance) {
        const REFUND_AMOUNT = 500
        await db.$transaction([
          db.tokenBalance.update({
            where: { userId: id },
            data: {
              balance: { increment: REFUND_AMOUNT },
              lifetimeEarned: { increment: REFUND_AMOUNT },
            },
          }),
          db.tokenTransaction.create({
            data: {
              balanceId: balance.id,
              type: 'REFUND',
              amount: REFUND_AMOUNT,
              description: 'Admin-issued token refund',
            },
          }),
        ])
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Service temporarily unavailable', details: 'Database not connected' },
      { status: 503 }
    )
  }
}
