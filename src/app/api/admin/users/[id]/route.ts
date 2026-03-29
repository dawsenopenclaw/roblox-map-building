import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '../../_adminGuard'
import { db } from '@/lib/db'

type Params = { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: Params) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const { role, tier, banned, refundTokens } = body as {
    role?: string
    tier?: string
    banned?: boolean
    refundTokens?: boolean
  }

  const validRoles = ['USER', 'ADMIN', 'CREATOR', 'MODERATOR']
  const validTiers = ['FREE', 'HOBBY', 'CREATOR', 'STUDIO']

  try {
    // Update role
    if (role && validRoles.includes(role)) {
      await db.user.update({
        where: { id },
        data: { role: role as 'USER' | 'ADMIN' | 'CREATOR' | 'MODERATOR' },
      })
    }

    // Update subscription tier
    if (tier && validTiers.includes(tier)) {
      await db.subscription.upsert({
        where: { userId: id },
        create: {
          userId: id,
          stripeCustomerId: `admin_override_${id}`,
          tier: tier as 'FREE' | 'HOBBY' | 'CREATOR' | 'STUDIO',
          status: 'ACTIVE',
        },
        update: { tier: tier as 'FREE' | 'HOBBY' | 'CREATOR' | 'STUDIO' },
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
  } catch (e) {
    console.error('Admin user update error:', e)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}
