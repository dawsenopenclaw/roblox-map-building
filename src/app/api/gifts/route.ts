import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

export async function GET(_req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({ where: { clerkId }, select: { id: true, email: true } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const [sent, received] = await Promise.all([
      db.gift.findMany({
        where: { senderId: user.id },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          recipientEmail: true,
          giftType: true,
          tier: true,
          tokenAmount: true,
          message: true,
          status: true,
          redeemCode: true,
          redeemedAt: true,
          expiresAt: true,
          createdAt: true,
          redeemedBy: {
            select: { id: true, displayName: true, email: true },
          },
        },
      }),
      db.gift.findMany({
        where: { redeemedById: user.id },
        orderBy: { redeemedAt: 'desc' },
        select: {
          id: true,
          giftType: true,
          tier: true,
          tokenAmount: true,
          message: true,
          status: true,
          redeemedAt: true,
          expiresAt: true,
          createdAt: true,
          sender: {
            select: { id: true, displayName: true, email: true },
          },
        },
      }),
    ])

    // Normalize to the shape GiftsClient expects
    const normalize = (
      g: typeof sent[0] | typeof received[0],
      side: 'sent' | 'received',
    ) => {
      const isSent = side === 'sent'
      const raw = g as Record<string, unknown>
      const tier = raw.tier as string | null | undefined
      const tokenAmount = raw.tokenAmount as number | null | undefined
      const giftType = raw.giftType as string
      const itemLabel =
        giftType === 'subscription' && tier
          ? `${tier.charAt(0)}${tier.slice(1).toLowerCase()} Plan`
          : giftType === 'tokens' && tokenAmount
            ? `${tokenAmount.toLocaleString()} Tokens`
            : giftType

      const senderObj = (raw.sender as { email?: string } | null | undefined)
      const recipientObj = (raw.redeemedBy as { email?: string } | null | undefined)

      return {
        id:             raw.id,
        createdAt:      raw.createdAt,
        type:           giftType,
        itemLabel,
        code:           raw.redeemCode,
        status:         raw.status,
        recipientEmail: isSent ? raw.recipientEmail : (recipientObj?.email ?? null),
        senderEmail:    isSent ? null : (senderObj?.email ?? null),
      }
    }

    return NextResponse.json({
      sent:     sent.map((g)     => normalize(g, 'sent')),
      received: received.map((g) => normalize(g, 'received')),
    })
  } catch (err) {
    console.error('[gifts] Unhandled error', err)
    return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
  }
}
