import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth'
import { db } from '../lib/db'
import { randomBytes } from 'crypto'

export const referralRoutes = new Hono()

function generateReferralCode(): string {
  return randomBytes(4).toString('hex').toUpperCase()
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
  const totalCommission = referrals.reduce((sum, r) => sum + r.commission, 0)

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
    referralUrl: `https://robloxforge.com/ref/${myCode}`,
    stats: {
      total: referrals.length,
      converted: converted.length,
      pending: referrals.filter((r) => r.status === 'PENDING').length,
      totalCommissionUsd: (totalCommission / 100).toFixed(2),
    },
    recent: referrals.slice(0, 10),
  })
})

// POST /api/referrals/track — track a referral conversion on signup
referralRoutes.post('/track', async (c) => {
  const body = await c.req.json().catch(() => null)
  if (!body) return c.json({ error: 'Invalid JSON body' }, 400)

  const { code, newUserId } = body as { code?: string; newUserId?: string }
  if (!code || !newUserId) return c.json({ error: 'code and newUserId are required' }, 400)

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

  await db.referral.update({
    where: { code },
    data: {
      referredId: newUserId,
      status: 'CONVERTED',
      commission: 100, // $1.00 in cents
      convertedAt: new Date(),
    },
  })

  // Credit $1 (100 tokens) to referring user's token balance
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

  return c.json({ success: true })
})
