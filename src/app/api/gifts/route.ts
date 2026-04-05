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

    return NextResponse.json({ sent, received })
  } catch (err) {
    console.error('[gifts] Unhandled error', err)
    return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
  }
}
