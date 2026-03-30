import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { requireAuth } from '../middleware/auth'
import { db } from '../lib/db'
import { randomBytes } from 'crypto'
import { referralTrackSchema } from '../lib/validators'
import { notifyReferralConverted } from '../lib/notifications'

export const referralRoutes = new Hono()

/**
 * Generate a cryptographically random referral code.
 * Format: FG-XXXXXXXX (8 hex chars = 4 294 967 296 possible values).
 */
function generateReferralCode(): string {
  return `FG-${randomBytes(4).toString('hex').toUpperCase()}`
}

// GET /api/referrals/stats — dashboard stats
referralRoutes.get('/stats', requireAuth, async (c) => {
  const clerkId = (c as any).get('clerkId') as string
  const user = await db.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return c.json({ error: 'User not found' }, 404)

  const referrals = await db.referral.findMany({
    where: { referrerId: user.id },
    orderBy: { createdAt: 'desc' },
  })

  const converted = referrals.filter((r) => r.status !== 'PENDING')
  const totalCommission = referrals.reduce((sum, r) => sum + r.commissionCents, 0)

  // Get or create the user's referral code
  let myCode = referrals[0]?.code ?? null
  if (!myCode) {
    // Create a standing referral entry for this user
    const code = generateReferralCode()
    const created = await db.referral.create({
      data: {
        referrerId: user.id,
        code,
        status: 'PENDING',
      },
    })
    myCode = created.code
  }

  return c.json({
    code: myCode,
    referralUrl: `https://forjegames.com/ref/${myCode}`,
    stats: {
      total: referrals.length,
      converted: converted.length,
      pending: referrals.filter((r) => r.status === 'PENDING').length,
      totalCommissionUsd: (totalCommission / 100).toFixed(2),
    },
    recent: referrals.slice(0, 10),
  })
})

// Monthly referral reward cap — max 50 rewarded referrals per calendar month
const MONTHLY_REFERRAL_CAP = 50

// POST /api/referrals/track — track a referral conversion on signup (internal, requires auth)
referralRoutes.post('/track', requireAuth, zValidator('json', referralTrackSchema), async (c) => {
  const { code, newUserId } = c.req.valid('json')

  const referral = await db.referral.findUnique({ where: { code } })
  if (!referral) return c.json({ error: 'Invalid referral code' }, 404)
  if (referral.status !== 'PENDING' || referral.referredId) {
    return c.json({ error: 'Referral already used' }, 409)
  }

  // Make sure the new user exists
  const newUser = await db.user.findUnique({ where: { id: newUserId }, select: { id: true } })
  if (!newUser) return c.json({ error: 'New user not found' }, 404)

  // Prevent self-referral
  if (referral.referrerId === newUserId) {
    return c.json({ error: 'Cannot refer yourself' }, 400)
  }

  // Monthly cap check — load referrer's monthly counters
  const referrer = await db.user.findUnique({
    where: { id: referral.referrerId },
    select: { id: true, monthlyReferralCount: true, monthlyReferralMonth: true },
  })
  if (!referrer) return c.json({ error: 'Referrer not found' }, 404)

  const currentMonth = new Date().toISOString().slice(0, 7) // "YYYY-MM"
  const isNewMonth = referrer.monthlyReferralMonth !== currentMonth
  const monthlyCount = isNewMonth ? 0 : referrer.monthlyReferralCount

  const rewardEligible = monthlyCount < MONTHLY_REFERRAL_CAP

  // Mark referral converted regardless of cap (conversion still counts, reward may be skipped)
  await db.referral.update({
    where: { code },
    data: {
      referredId: newUserId,
      status: 'CONVERTED',
      commissionCents: rewardEligible ? 100 : 0,
      convertedAt: new Date(),
    },
  })

  // Update referrer's monthly counter (always, regardless of reward eligibility)
  await db.user.update({
    where: { id: referral.referrerId },
    data: {
      monthlyReferralCount: isNewMonth ? 1 : { increment: 1 },
      monthlyReferralMonth: currentMonth,
    },
  })

  // Credit 100 tokens only when under the monthly cap
  if (rewardEligible) {
    const referrerBalance = await db.tokenBalance.findUnique({
      where: { userId: referral.referrerId },
    })
    if (referrerBalance) {
      await db.tokenBalance.update({
        where: { userId: referral.referrerId },
        data: {
          balance: { increment: 100 },
          lifetimeEarned: { increment: 100 },
          transactions: {
            create: {
              type: 'BONUS',
              amount: 100,
              description: 'Referral bonus - new user signed up',
            },
          },
        },
      })
    }
  }

  // Fire notification to referrer (best-effort)
  const commissionCents = rewardEligible ? 100 : 0
  notifyReferralConverted(referral.referrerId, { commissionCents }).catch(() => {})

  return c.json({ success: true, rewardGranted: rewardEligible })
})
