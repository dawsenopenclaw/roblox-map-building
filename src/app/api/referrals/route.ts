import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { generateReferralCode } from '@/lib/growth/referral'
import { z } from 'zod'

// ─── Types ────────────────────────────────────────────────────────────────────

type ReferralRow = {
  id: string
  user: string
  joinedAt: string
  status: 'Signed Up' | 'Pending'
  tokensAwarded: number
}

// ─── Demo data (shown when DB is unavailable) ─────────────────────────────────

const DEMO_REFERRALS: ReferralRow[] = [
  { id: 'r1', user: 'alex_builds',    joinedAt: 'Mar 20, 2026', status: 'Signed Up', tokensAwarded: 500 },
  { id: 'r2', user: 'gamesdev99',     joinedAt: 'Mar 14, 2026', status: 'Signed Up', tokensAwarded: 500 },
  { id: 'r3', user: 'robloxstudio_x', joinedAt: 'Feb 28, 2026', status: 'Signed Up', tokensAwarded: 500 },
  { id: 'r4', user: 'mapmaker_z',     joinedAt: 'Feb 10, 2026', status: 'Pending',   tokensAwarded: 0   },
  { id: 'r5', user: 'studio_pro7',    joinedAt: 'Jan 22, 2026', status: 'Signed Up', tokensAwarded: 500 },
]

const DEMO_SIGNED_UP = DEMO_REFERRALS.filter((r) => r.status === 'Signed Up').length
const DEMO_TOKENS    = DEMO_REFERRALS.reduce((sum, r) => sum + r.tokensAwarded, 0)

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Try real database first
    try {
      const { db } = await import('@/lib/db')

      // Fetch user with referral code and referrals made in a single query
      const user = await db.user.findUnique({
        where: { clerkId },
        select: {
          id: true,
          referralCode: true,
          referralsMade: {
            orderBy: { createdAt: 'desc' },
            take: 1000,
            select: {
              id: true,
              referred: { select: { username: true } },
              createdAt: true,
              commissionCents: true,
              status: true,
            },
          },
        },
      })

      if (user) {
        // Ensure the user has a server-generated referral code persisted in the DB.
        // If not yet assigned, generate one and persist it now.
        let referralCode = user.referralCode
        if (!referralCode) {
          referralCode = generateReferralCode()
          await db.user.update({
            where: { id: user.id },
            data: { referralCode },
          })
        }

        const rows: ReferralRow[] = (user.referralsMade ?? []).map((r) => ({
          id: r.id,
          user: r.referred?.username ?? 'unknown',
          joinedAt: new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          status: r.status === 'CONVERTED' ? 'Signed Up' : 'Pending',
          tokensAwarded: r.commissionCents ?? 0,
        }))

        const signups     = rows.filter((r) => r.status === 'Signed Up').length
        const tokensEarned = rows.reduce((s, r) => s + r.tokensAwarded, 0)

        return NextResponse.json({
          invitesSent:  rows.length,
          signups,
          tokensEarned,
          referrals: rows,
          referralCode,
          demo: false,
        })
      }
    } catch {
      // DB not connected — fall through to demo mode
    }

    // Authenticated but DB unavailable — return empty state without a referral code
    // so the client shows a placeholder rather than copying literal '...'
    return NextResponse.json({
      invitesSent:  0,
      signups:      0,
      tokensEarned: 0,
      referrals:    [],
      referralCode: null,
      demo:         true,
    })
  } catch (error) {
    return NextResponse.json({
      invitesSent:  0,
      signups:      0,
      tokensEarned: 0,
      referrals:    [],
      referralCode: null,
      demo:         true,
    })
  }
}

// ─── POST /api/referrals ────────────────────────────────────────────────────
// Apply a referral code — gives both users 500 bonus credits.
// This is a convenience alias; the canonical endpoint is /api/referrals/redeem.
// ─────────────────────────────────────────────────────────────────────────────

const ApplySchema = z.object({
  referralCode: z.string().min(1).max(20).trim(),
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

    const parsed = ApplySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 422 },
      )
    }

    const { referralCode: code } = parsed.data

    const { db } = await import('@/lib/db')
    const { earnTokens } = await import('@/lib/tokens-server')

    const BONUS = 500

    // Look up the current user
    const currentUser = await db.user.findUnique({
      where: { clerkId },
      select: { id: true, referralReceived: { select: { id: true }, take: 1 } },
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prevent duplicate redemption
    if (currentUser.referralReceived.length > 0) {
      return NextResponse.json(
        { error: 'You have already redeemed a referral code.' },
        { status: 409 },
      )
    }

    // Find the referrer
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

    // Create referral record
    await db.$transaction(async (tx) => {
      const { randomBytes } = await import('crypto')
      const referralRecordCode = randomBytes(8).toString('hex').toUpperCase()

      await tx.referral.create({
        data: {
          referrerId: referrer.id,
          referredId: currentUser.id,
          code: referralRecordCode,
          status: 'CONVERTED',
          commissionCents: BONUS,
          convertedAt: new Date(),
        },
      })
    })

    // Credit both users
    await Promise.all([
      earnTokens(
        referrer.id,
        BONUS,
        'BONUS',
        'Referral bonus: a friend signed up with your code',
        { referredUserId: currentUser.id, referralCode: code },
      ),
      earnTokens(
        currentUser.id,
        BONUS,
        'BONUS',
        `Welcome bonus: signed up with referral code ${code}`,
        { referrerId: referrer.id, referralCode: code },
      ),
    ])

    return NextResponse.json({
      success: true,
      creditsEarned: BONUS,
      message: `You and your friend each earned ${BONUS} credits!`,
    })
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'This referral has already been recorded.' },
        { status: 409 },
      )
    }

    console.error('[referrals] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to apply referral code. Please try again.' },
      { status: 500 },
    )
  }
}
