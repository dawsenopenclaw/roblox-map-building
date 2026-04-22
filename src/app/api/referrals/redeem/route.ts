import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { earnTokens } from '@/lib/tokens-server'
import { REFERRAL_BONUS_CREDITS } from '@/lib/referral'
import { z } from 'zod'

// ─── POST /api/referrals/redeem ──────────────────────────────────────────────
// Redeems a referral code during signup.
// Validates the code, prevents self-referral and duplicate redemption,
// then credits both referrer and referee.
// ─────────────────────────────────────────────────────────────────────────────

const RedeemSchema = z.object({
  code: z.string().min(1).max(20).trim(),
})

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }
    const parsed = RedeemSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 422 },
      )
    }

    const { code } = parsed.data

    // Look up the current user
    const currentUser = await db.user.findUnique({
      where: { clerkId },
      select: { id: true, referralReceived: { select: { id: true }, take: 1 } },
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if the user has already redeemed a referral
    if (currentUser.referralReceived.length > 0) {
      return NextResponse.json(
        { error: 'You have already redeemed a referral code.' },
        { status: 409 },
      )
    }

    // Find the referrer by their referral code (stored on the User model)
    const referrer = await db.user.findFirst({
      where: { referralCode: code },
      select: { id: true },
    })

    if (!referrer) {
      return NextResponse.json(
        { error: 'Invalid referral code. Please check and try again.' },
        { status: 404 },
      )
    }

    // Prevent self-referral
    if (referrer.id === currentUser.id) {
      return NextResponse.json(
        { error: 'You cannot use your own referral code.' },
        { status: 400 },
      )
    }

    // Create the referral relationship and credit both users in a transaction
    await db.$transaction(async (tx) => {
      // Generate a unique code for the Referral record itself
      const { randomBytes } = await import('crypto')
      const referralRecordCode = randomBytes(8).toString('hex').toUpperCase()

      await tx.referral.create({
        data: {
          referrerId: referrer.id,
          referredId: currentUser.id,
          code: referralRecordCode,
          status: 'CONVERTED',
          commissionCents: REFERRAL_BONUS_CREDITS,
          convertedAt: new Date(),
        },
      })
    })

    // Credit both users outside the referral transaction for cleaner error isolation
    await Promise.all([
      earnTokens(
        referrer.id,
        REFERRAL_BONUS_CREDITS,
        'BONUS',
        `Referral bonus: a friend signed up with your code`,
        { referredUserId: currentUser.id, referralCode: code },
      ),
      earnTokens(
        currentUser.id,
        REFERRAL_BONUS_CREDITS,
        'BONUS',
        `Welcome bonus: signed up with referral code ${code}`,
        { referrerId: referrer.id, referralCode: code },
      ),
    ])

    return NextResponse.json({
      success: true,
      creditsEarned: REFERRAL_BONUS_CREDITS,
      message: `You and your friend each earned ${REFERRAL_BONUS_CREDITS} credits!`,
    })
  } catch (error) {
    // Handle unique constraint violations (duplicate redemption race condition)
    if (
      error instanceof Error &&
      error.message.includes('Unique constraint')
    ) {
      return NextResponse.json(
        { error: 'This referral has already been recorded.' },
        { status: 409 },
      )
    }

    console.error('[referrals/redeem] Error:', error)
    return NextResponse.json(
      { error: 'Failed to redeem referral code. Please try again.' },
      { status: 500 },
    )
  }
}
