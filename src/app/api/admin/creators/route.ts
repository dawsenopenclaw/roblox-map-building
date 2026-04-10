import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '../_adminGuard'
import { db } from '@/lib/db'
import { z } from 'zod'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

const enrollSchema = z.object({
  userId: z.string().min(1),
  commissionPercent: z.number().min(0).max(100).default(15),
  channelUrl: z.string().url().optional(),
  channelName: z.string().min(1).optional(),
})

// GET: List all creators / YouTuber program members
export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    // Get all users who have a referral code (creators in the program)
    const creators = await db.user.findMany({
      where: {
        referralCode: { not: null },
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        referralCode: true,
        robloxUsername: true,
        createdAt: true,
        role: true,
        subscription: {
          select: { tier: true, status: true },
        },
        _count: {
          select: { referralsMade: true },
        },
        referralsMade: {
          select: {
            id: true,
            status: true,
            commissionCents: true,
            convertedAt: true,
            referred: {
              select: { email: true, username: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        creatorAccount: {
          select: {
            totalEarnedCents: true,
            pendingBalanceCents: true,
            chargesEnabled: true,
            lastPayoutAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Compute stats for each creator
    const creatorsWithStats = creators.map((creator) => {
      const totalReferrals = creator._count.referralsMade
      const convertedReferrals = creator.referralsMade.filter(
        (r) => r.status === 'CONVERTED' || r.status === 'PAID'
      ).length
      const totalCommissionCents = creator.referralsMade.reduce(
        (sum, r) => sum + r.commissionCents,
        0
      )

      return {
        id: creator.id,
        email: creator.email,
        username: creator.username,
        displayName: creator.displayName,
        avatarUrl: creator.avatarUrl,
        referralCode: creator.referralCode,
        robloxUsername: creator.robloxUsername,
        role: creator.role,
        tier: creator.subscription?.tier ?? 'FREE',
        joinedAt: creator.createdAt,
        totalReferrals,
        convertedReferrals,
        totalCommissionCents,
        totalEarnedCents: creator.creatorAccount?.totalEarnedCents ?? 0,
        pendingBalanceCents: creator.creatorAccount?.pendingBalanceCents ?? 0,
        chargesEnabled: creator.creatorAccount?.chargesEnabled ?? false,
        lastPayoutAt: creator.creatorAccount?.lastPayoutAt,
        recentReferrals: creator.referralsMade.slice(0, 10),
      }
    })

    return NextResponse.json({
      creators: creatorsWithStats,
      total: creatorsWithStats.length,
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to fetch creators' },
      { status: 500 }
    )
  }
}

// POST: Enroll a new creator in the YouTuber/Creator program
export async function POST(req: NextRequest) {
  const adminResult = await requireAdmin()
  if (adminResult.error) return adminResult.error

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = enrollSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { userId, channelUrl, channelName } = parsed.data

  try {
    // Verify user exists
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, referralCode: true, role: true },
    })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Generate unique referral code if they don't already have one
    let referralCode = user.referralCode
    if (!referralCode) {
      referralCode = crypto.randomBytes(6).toString('hex')
      await db.user.update({
        where: { id: userId },
        data: {
          referralCode,
          role: user.role === 'USER' ? 'CREATOR' : user.role,
        },
      })
    }

    // Log the enrollment
    await db.auditLog.create({
      data: {
        userId: adminResult.user?.id ?? null,
        action: 'ADMIN_CREATOR_ENROLL',
        resource: 'user',
        resourceId: userId,
        metadata: {
          targetEmail: user.email,
          referralCode,
          channelUrl: channelUrl ?? null,
          channelName: channelName ?? null,
        },
      },
    })

    return NextResponse.json({
      success: true,
      referralCode,
      userId,
      message: `Creator enrolled with code: ${referralCode}`,
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Enrollment failed' },
      { status: 500 }
    )
  }
}
