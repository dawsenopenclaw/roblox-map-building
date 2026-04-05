import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '../_adminGuard'
import { db } from '@/lib/db'
import { adminGiftTokensSchema, parseBody } from '@/lib/validations'

export async function POST(req: NextRequest) {
  try {
    const adminResult = await requireAdmin()
    if (adminResult.error) return adminResult.error

    const parsed = await parseBody(req, adminGiftTokensSchema)
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: parsed.status })
    }
    const { userId, amount, reason, type, unlimited } = parsed.data

    // Unlimited tokens = set balance to 999,999,999 (effectively infinite)
    const effectiveAmount = unlimited ? 999_999_999 : amount

    // Verify target user exists
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Upsert balance + create transaction atomically
    const balance = await db.tokenBalance.upsert({
      where: { userId },
      create: { userId, balance: effectiveAmount, lifetimeEarned: effectiveAmount },
      update: unlimited
        ? { balance: 999_999_999, lifetimeEarned: 999_999_999 }
        : {
            balance: { increment: effectiveAmount },
            lifetimeEarned: { increment: effectiveAmount },
          },
    })

    const [transaction] = await db.$transaction([
      db.tokenTransaction.create({
        data: {
          balanceId: balance.id,
          type: 'BONUS',
          amount,
          description: unlimited ? `Admin unlimited tokens: ${reason}` : `Admin ${type.toLowerCase()}: ${reason}`,
          metadata: {
            adminId: adminResult.user?.id ?? null,
            adminEmail: adminResult.user?.email ?? null,
            reason,
            giftType: type,
            label: 'ADMIN_GIFT',
            unlimited: unlimited ?? false,
          },
        },
      }),
      db.auditLog.create({
        data: {
          userId: adminResult.user?.id ?? null,
          action: 'admin.gift_tokens',
          resource: 'user',
          resourceId: userId,
          metadata: {
            amount,
            reason,
            type,
            newBalance: balance.balance,
            targetEmail: user.email,
          },
        },
      }),
    ])

    return NextResponse.json({
      ok: true,
      newBalance: balance.balance,
      transactionId: transaction.id,
    })
  } catch {
    return NextResponse.json(
      { error: 'Service temporarily unavailable' },
      { status: 503 }
    )
  }
}
