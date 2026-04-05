import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '../../_adminGuard'
import { db } from '@/lib/db'
import { adminUserUpdateSchema, parseBody } from '@/lib/validations'

type Params = { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const adminResult = await requireAdmin()
    if (adminResult.error) return adminResult.error

    const { id } = await params
    const parsed = await parseBody(req, adminUserUpdateSchema)
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: parsed.status })
    }
    const { role, tier, banned, verified, refundTokens, giftTokens, setTier, customOffer } = parsed.data

    // Update role
    if (role) {
      await db.user.update({
        where: { id },
        data: { role },
      })
    }

    // Update subscription tier (legacy — no reason log)
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

    // Force-set subscription tier with audit trail
    if (setTier) {
      const previousSub = await db.subscription.findUnique({
        where: { userId: id },
        select: { tier: true },
      })
      await db.subscription.upsert({
        where: { userId: id },
        create: {
          userId: id,
          stripeCustomerId: `admin_override_${id}`,
          tier: setTier.tier,
          status: 'ACTIVE',
        },
        update: { tier: setTier.tier },
      })
      await db.auditLog.create({
        data: {
          userId: adminResult.user?.id ?? null,
          action: 'admin.set_tier',
          resource: 'user',
          resourceId: id,
          metadata: {
            previousTier: previousSub?.tier ?? null,
            newTier: setTier.tier,
            reason: setTier.reason,
          },
        },
      })
    }

    // Mark verified / unverified — no dedicated DB field, recorded via audit log
    if (typeof verified === 'boolean') {
      await db.auditLog.create({
        data: {
          userId: adminResult.user?.id ?? null,
          action: verified ? 'admin.verify_user' : 'admin.unverify_user',
          resource: 'user',
          resourceId: id,
          metadata: { verified },
        },
      })
    }

    // Ban / unban
    if (typeof banned === 'boolean') {
      await db.user.update({
        where: { id },
        data: { deletedAt: banned ? new Date() : null },
      })
      await db.auditLog.create({
        data: {
          userId: adminResult.user?.id ?? null,
          action: banned ? 'admin.ban_user' : 'admin.unban_user',
          resource: 'user',
          resourceId: id,
          metadata: {},
        },
      })
    }

    // Refund tokens (legacy — fixed 500)
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

    // Gift tokens — any amount, or unlimited (sets to 999,999,999)
    if (giftTokens) {
      const { amount, reason, unlimited } = giftTokens
      const effectiveAmount = unlimited ? 999_999_999 : amount
      const balance = await db.tokenBalance.upsert({
        where: { userId: id },
        create: { userId: id, balance: effectiveAmount, lifetimeEarned: effectiveAmount },
        update: unlimited
          ? { balance: 999_999_999, lifetimeEarned: 999_999_999 }
          : {
              balance: { increment: effectiveAmount },
              lifetimeEarned: { increment: effectiveAmount },
            },
      })
      await db.$transaction([
        db.tokenTransaction.create({
          data: {
            balanceId: balance.id,
            type: 'BONUS',
            amount,
            description: `Admin gift: ${reason}`,
            metadata: {
              adminId: adminResult.user?.id ?? null,
              reason,
              type: 'ADMIN_GIFT',
            },
          },
        }),
        db.auditLog.create({
          data: {
            userId: adminResult.user?.id ?? null,
            action: 'admin.gift_tokens',
            resource: 'user',
            resourceId: id,
            metadata: { amount, reason, newBalance: balance.balance },
          },
        }),
      ])
    }

    // Custom offer — store as AuditLog entry (no dedicated table needed yet)
    if (customOffer) {
      const { name, priceCents, tokenAmount, description } = customOffer
      const offerId = `offer_${Date.now()}_${id.slice(0, 8)}`
      await db.auditLog.create({
        data: {
          userId: adminResult.user?.id ?? null,
          action: 'admin.create_custom_offer',
          resource: 'user',
          resourceId: id,
          metadata: {
            offerId,
            name,
            priceCents,
            tokenAmount,
            description: description ?? '',
            targetUserId: id,
            createdAt: new Date().toISOString(),
            status: 'PENDING',
          },
        },
      })
      return NextResponse.json({ ok: true, offerId })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json(
      { error: 'Service temporarily unavailable', details: 'Database not connected' },
      { status: 503 }
    )
  }
}
