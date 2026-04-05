import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { earnTokens } from '@/lib/tokens-server'

const schema = z.object({
  code: z.string().min(1).max(20),
})

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const recipient = await db.user.findUnique({ where: { clerkId } })
    if (!recipient) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { code } = parsed.data
    const now = new Date()

    const gift = await db.gift.findFirst({
      where: {
        redeemCode: code,
        status: 'pending',
        expiresAt: { gt: now },
      },
    })

    if (!gift) {
      return NextResponse.json({ error: 'Gift not found, already redeemed, or expired' }, { status: 404 })
    }

    // Prevent self-redemption — sender cannot redeem their own gift
    if (gift.senderId === recipient.id) {
      return NextResponse.json({ error: 'You cannot redeem your own gift' }, { status: 400 })
    }

    if (gift.giftType === 'subscription') {
      if (!gift.tier) {
        return NextResponse.json({ error: 'Gift data corrupted: missing tier' }, { status: 500 })
      }

      const periodStart = now
      const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days

      // Upsert subscription — if user already has one, upgrade/extend it
      await db.subscription.upsert({
        where: { userId: recipient.id },
        create: {
          userId: recipient.id,
          // Placeholder customer ID — will be replaced if/when user sets up billing
          stripeCustomerId: `gift_${gift.id}`,
          tier: gift.tier as 'FREE' | 'HOBBY' | 'CREATOR' | 'STUDIO',
          status: 'ACTIVE',
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: false,
        },
        update: {
          tier: gift.tier as 'FREE' | 'HOBBY' | 'CREATOR' | 'STUDIO',
          status: 'ACTIVE',
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: false,
        },
      })

      // Mark gift as redeemed
      await db.gift.update({
        where: { id: gift.id },
        data: {
          status: 'redeemed',
          redeemedById: recipient.id,
          redeemedAt: now,
        },
      })

      return NextResponse.json({
        success: true,
        giftType: 'subscription',
        details: {
          tier: gift.tier,
          periodEnd,
          message: gift.message ?? null,
        },
      })
    }

    if (gift.giftType === 'tokens') {
      if (!gift.tokenAmount) {
        return NextResponse.json({ error: 'Gift data corrupted: missing tokenAmount' }, { status: 500 })
      }

      await earnTokens(
        recipient.id,
        gift.tokenAmount,
        'BONUS',
        `Gift from sender — ${gift.tokenAmount} tokens`,
        { giftId: gift.id, senderId: gift.senderId },
      )

      await db.gift.update({
        where: { id: gift.id },
        data: {
          status: 'redeemed',
          redeemedById: recipient.id,
          redeemedAt: now,
        },
      })

      return NextResponse.json({
        success: true,
        giftType: 'tokens',
        details: {
          tokenAmount: gift.tokenAmount,
          message: gift.message ?? null,
        },
      })
    }

    return NextResponse.json({ error: 'Unknown gift type' }, { status: 400 })
  } catch (err) {
    console.error('[gifts/redeem] Unhandled error', err)
    return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
  }
}
