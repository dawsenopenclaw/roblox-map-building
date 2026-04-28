// ─── Referral System ──────────────────────────────────────────────────────────
// Unique codes, chain tracking, one-time flat commissions, milestone rewards,
// and leaderboard logic.
//
// Commission model (one-time per signup):
//   - Any referred signup: $20 flat to affiliate
//   - If referred user subscribes to $25/mo Builder plan: $12.50 to affiliate
//     (half goes to affiliate, half kept for taxes)
// ─────────────────────────────────────────────────────────────────────────────

// ─── Types ────────────────────────────────────────────────────────────────────

export type ReferralCode = {
  code: string       // e.g. "FG-4521"
  userId: string
  createdAt: Date
  totalUses: number
  activeReferrals: number
}

export type ReferralChainNode = {
  userId: string
  username: string
  referredAt: Date
  tier: number           // depth in chain — 1 = direct referral
  status: 'pending' | 'signed_up' | 'paying'
  commissionEarned: number // USD cents total from this node
}

export type ReferralChain = {
  rootUserId: string
  nodes: ReferralChainNode[]
  totalCommissionEarned: number // USD cents
  directReferrals: number
  indirectReferrals: number
}

export type CommissionEvent = {
  id: string
  referrerId: string
  referredUserId: string
  type: 'paid_subscription' | 'builder_plan'
  grossAmountCents: number
  commissionCents: number        // $20 flat or $12.50 for Builder plan
  createdAt: Date
  paid: boolean
}

export type MilestoneReward = {
  id: string
  threshold: number              // number of paying referrals needed
  label: string
  rewardType: 'tokens' | 'subscription_month' | 'badge' | 'cash'
  rewardValue: number            // tokens, months, or USD cents
  description: string
  emoji: string
  unlocked: boolean
  unlockedAt?: Date
}

export type ReferralLeaderboardEntry = {
  rank: number
  userId: string
  username: string
  avatarInitials: string
  totalReferrals: number
  payingReferrals: number
  lifetimeCommissionCents: number
  badge?: string
}

// ─── Referral creation (server-side only) ─────────────────────────────────────

/** Maximum referral rewards granted per referrer per calendar month. */
export const MONTHLY_REFERRAL_REWARD_CAP = 20

/**
 * Create a referral record in the database.
 *
 * Guards:
 *  - Throws if referrerId === referredId (self-referral).
 *  - Throws if the referrer has already earned MONTHLY_REFERRAL_REWARD_CAP
 *    rewards this calendar month.
 *
 * Must be called server-side only (Clerk webhook, sign-up handler, etc.).
 */
export async function createReferral(referrerId: string, referredId: string): Promise<void> {
  if (referrerId === referredId) {
    throw new Error('Self-referral is not allowed')
  }

  const { db } = await import('@/lib/db')

  // Monthly cap: check and increment atomically using a transaction.
  await db.$transaction(async (tx) => {
    const currentMonth = new Date().toISOString().slice(0, 7) // "YYYY-MM"

    const referrer = await tx.user.findUnique({
      where: { id: referrerId },
      select: { monthlyReferralCount: true, monthlyReferralMonth: true },
    })

    if (!referrer) throw new Error('Referrer not found')

    // Reset counter if we're in a new month
    const effectiveCount =
      referrer.monthlyReferralMonth === currentMonth ? referrer.monthlyReferralCount : 0

    if (effectiveCount >= MONTHLY_REFERRAL_REWARD_CAP) {
      throw new Error(`Monthly referral reward cap (${MONTHLY_REFERRAL_REWARD_CAP}) reached`)
    }

    await tx.user.update({
      where: { id: referrerId },
      data: {
        monthlyReferralCount: effectiveCount + 1,
        monthlyReferralMonth: currentMonth,
      },
    })

    // Referral.code is a required unique field — generate a cryptographically random token
    const { randomBytes } = await import('crypto')
    const code = randomBytes(8).toString('hex').toUpperCase()

    await tx.referral.create({
      data: { referrerId, referredId, code },
    })
  })
}

// ─── Code generation ──────────────────────────────────────────────────────────

/**
 * Generate a cryptographically random referral code.
 * Format: FG-XXXXXXXX (8 hex chars = 4 294 967 296 possible values).
 * Server-side only — requires Node.js `crypto` module.
 */
export function generateReferralCode(): string {
  // crypto is available in Node.js and the Next.js edge runtime
  const { randomBytes } = require('crypto') as typeof import('crypto')
  return `FG-${randomBytes(4).toString('hex').toUpperCase()}`
}

export function buildReferralLink(code: string, baseUrl = 'https://forjegames.com'): string {
  return `${baseUrl}/sign-up?ref=${code}`
}

// ─── Commission calculation ───────────────────────────────────────────────────
// One-time flat commissions on PAID subscriptions only — NOT on free signups.

/** $20 flat commission per referred PAID subscription. In cents. */
export const PAID_SIGNUP_COMMISSION_CENTS = 2000

/** Commission for Builder plan ($25/mo): affiliate gets half ($12.50). In cents. */
export const BUILDER_PLAN_COMMISSION_CENTS = 1250

/**
 * Calculate the one-time affiliate commission for a referred paid subscription.
 *
 * Only triggers on PAID plans — free signups get zero commission.
 *
 * @param tier - subscription tier name (e.g. 'BUILDER', 'CREATOR', 'STARTER')
 * @returns commission in cents (0 for FREE tier)
 *
 * Rules:
 *   - FREE tier: $0 (no commission on free signups)
 *   - BUILDER plan ($25/mo): $12.50 (half — other half kept for taxes)
 *   - All other paid plans: $20 flat
 */
export function calculateCommission(tier: string): number {
  if (tier === 'FREE') return 0
  if (tier === 'BUILDER') return BUILDER_PLAN_COMMISSION_CENTS
  // STARTER, CREATOR, PRO, STUDIO — $20 flat
  return PAID_SIGNUP_COMMISSION_CENTS
}

/**
 * Project total earnings for an affiliate based on paid referral count.
 * Since commissions are one-time, this is simply: paidReferrals x $20.
 */
export function projectTotalCommission(paidReferrals: number): number {
  return paidReferrals * PAID_SIGNUP_COMMISSION_CENTS
}

/**
 * Process a referral commission payout via Stripe Connect.
 *
 * Called from the Stripe webhook when a referred user's first paid subscription
 * is confirmed. Creates a Stripe Transfer to the affiliate's Connect account.
 *
 * @param referrerId - the affiliate's user ID
 * @param referredId - the referred user's ID
 * @param tier - the subscription tier the referred user signed up for
 * @returns true if payout was created, false if skipped (no Connect account, already paid, etc.)
 */
export async function processReferralPayout(
  referrerId: string,
  referredId: string,
  tier: string,
): Promise<boolean> {
  const commissionCents = calculateCommission(tier)
  if (commissionCents === 0) return false

  const { db } = await import('@/lib/db')
  const { getStripe } = await import('@/lib/stripe')

  // Find the referral record
  const referral = await db.referral.findFirst({
    where: {
      referrerId,
      referredId,
      status: { in: ['PENDING', 'CONVERTED'] }, // not already PAID
    },
  })
  if (!referral) return false

  // Check if affiliate has a Stripe Connect account with payouts enabled
  const creatorAccount = await db.creatorAccount.findUnique({
    where: { userId: referrerId },
    select: { stripeAccountId: true, payoutsEnabled: true },
  })

  // Update the referral record with commission amount regardless of payout capability
  await db.referral.update({
    where: { id: referral.id },
    data: {
      commissionCents,
      convertedAt: new Date(),
      status: creatorAccount?.payoutsEnabled ? 'PAID' : 'CONVERTED',
    },
  })

  // If no Connect account or payouts not enabled, commission is recorded but not transferred yet.
  // It will be paid out when the affiliate completes Stripe Connect onboarding.
  if (!creatorAccount?.payoutsEnabled) {
    console.log(`[referral] Commission $${(commissionCents / 100).toFixed(2)} recorded for ${referrerId} but payout deferred — no Connect account`)

    // Track pending balance
    await db.creatorAccount.upsert({
      where: { userId: referrerId },
      create: {
        userId: referrerId,
        stripeAccountId: 'pending_setup',
        pendingBalanceCents: commissionCents,
        totalEarnedCents: commissionCents,
      },
      update: {
        pendingBalanceCents: { increment: commissionCents },
        totalEarnedCents: { increment: commissionCents },
      },
    })
    return false
  }

  // Create the Stripe Transfer to the affiliate's Connect account
  const stripe = getStripe()
  if (!stripe) {
    console.error('[referral] Stripe not configured — cannot process payout')
    return false
  }

  try {
    await stripe.transfers.create(
      {
        amount: commissionCents,
        currency: 'usd',
        destination: creatorAccount.stripeAccountId,
        description: `Referral commission: ${tier} plan signup ($${(commissionCents / 100).toFixed(2)})`,
        metadata: {
          referralId: referral.id,
          referrerId,
          referredId,
          tier,
          type: 'referral_commission',
        },
      },
      { idempotencyKey: `referral_payout_${referral.id}` },
    )

    // Update balances
    await db.creatorAccount.update({
      where: { userId: referrerId },
      data: {
        totalEarnedCents: { increment: commissionCents },
        lastPayoutAt: new Date(),
      },
    })

    // Mark referral as paid
    await db.referral.update({
      where: { id: referral.id },
      data: { status: 'PAID' },
    })

    console.log(`[referral] Paid $${(commissionCents / 100).toFixed(2)} to ${referrerId} for ${tier} referral (${referral.id})`)
    return true
  } catch (err) {
    console.error('[referral] Stripe transfer failed:', err instanceof Error ? err.message : err)
    // Commission is still recorded in the Referral row — can be retried
    return false
  }
}

// ─── Milestone rewards ────────────────────────────────────────────────────────

export const MILESTONE_REWARDS: Omit<MilestoneReward, 'unlocked' | 'unlockedAt'>[] = [
  {
    id: 'milestone_1',
    threshold: 1,
    label: 'First Referral',
    rewardType: 'tokens',
    rewardValue: 500,
    description: 'You referred your first creator to ForjeGames.',
    emoji: '⭐',
  },
  {
    id: 'milestone_5',
    threshold: 5,
    label: 'Squad Builder',
    rewardType: 'tokens',
    rewardValue: 2500,
    description: '5 referrals — you\'re building a squad.',
    emoji: '🔥',
  },
  {
    id: 'milestone_10',
    threshold: 10,
    label: 'Ambassador',
    rewardType: 'subscription_month',
    rewardValue: 1,
    description: '10 referrals — earn a free month of Pro.',
    emoji: '🏆',
  },
  {
    id: 'milestone_25',
    threshold: 25,
    label: 'Growth Engine',
    rewardType: 'tokens',
    rewardValue: 15000,
    description: '25 referrals — you\'re a certified growth engine.',
    emoji: '💎',
  },
  {
    id: 'milestone_50',
    threshold: 50,
    label: 'Top Partner',
    rewardType: 'cash',
    rewardValue: 10000, // $100 USD in cents
    description: '50 paying referrals — $100 cash bonus.',
    emoji: '💰',
  },
  {
    id: 'milestone_100',
    threshold: 100,
    label: 'Legend',
    rewardType: 'cash',
    rewardValue: 50000, // $500 USD in cents
    description: '100 paying referrals — ForjeGames Legend status + $500.',
    emoji: '🌟',
  },
]

export function computeMilestones(payingReferrals: number): MilestoneReward[] {
  return MILESTONE_REWARDS.map((m) => ({
    ...m,
    unlocked: payingReferrals >= m.threshold,
    unlockedAt: payingReferrals >= m.threshold ? new Date() : undefined,
  }))
}

export function getNextMilestone(payingReferrals: number): Omit<MilestoneReward, 'unlocked' | 'unlockedAt'> | null {
  return MILESTONE_REWARDS.find((m) => m.threshold > payingReferrals) ?? null
}

// ─── Chain tracker ────────────────────────────────────────────────────────────

/**
 * Given raw referral DB rows, reconstruct the tree and compute totals.
 */
export function buildReferralChain(
  rootUserId: string,
  rows: { userId: string; username: string; referredAt: Date; referredBy: string; status: ReferralChainNode['status']; commissionEarned: number }[],
  maxDepth = 2,
): ReferralChain {
  const nodes: ReferralChainNode[] = []

  function walk(parentId: string, tier: number) {
    if (tier > maxDepth) return
    for (const row of rows) {
      if (row.referredBy === parentId) {
        nodes.push({
          userId: row.userId,
          username: row.username,
          referredAt: row.referredAt,
          tier,
          status: row.status,
          commissionEarned: row.commissionEarned,
        })
        walk(row.userId, tier + 1)
      }
    }
  }

  walk(rootUserId, 1)

  const totalCommissionEarned = nodes.reduce((sum, n) => sum + n.commissionEarned, 0)
  const directReferrals = nodes.filter((n) => n.tier === 1).length
  const indirectReferrals = nodes.filter((n) => n.tier > 1).length

  return { rootUserId, nodes, totalCommissionEarned, directReferrals, indirectReferrals }
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────

export function buildLeaderboard(
  entries: Omit<ReferralLeaderboardEntry, 'rank' | 'badge'>[],
): ReferralLeaderboardEntry[] {
  return entries
    .sort((a, b) => b.payingReferrals - a.payingReferrals)
    .map((e, i) => ({
      ...e,
      rank: i + 1,
      badge: i === 0 ? 'Legend' : i === 1 ? 'Champion' : i === 2 ? 'Veteran' : undefined,
    }))
}

// ─── Demo data ────────────────────────────────────────────────────────────────

export function getDemoLeaderboard(): ReferralLeaderboardEntry[] {
  // Demo data: $20 per referral signup (one-time)
  return buildLeaderboard([
    { userId: 'u_01', username: 'BloxStudio_Pro',    avatarInitials: 'BP', totalReferrals: 142, payingReferrals: 118, lifetimeCommissionCents: 284000 },
    { userId: 'u_02', username: 'DevMaster_Z',       avatarInitials: 'DZ', totalReferrals: 97,  payingReferrals: 84,  lifetimeCommissionCents: 194000 },
    { userId: 'u_03', username: 'MapBuilder99',      avatarInitials: 'MB', totalReferrals: 73,  payingReferrals: 61,  lifetimeCommissionCents: 146000 },
    { userId: 'u_04', username: 'ScriptWizard_X',    avatarInitials: 'SW', totalReferrals: 54,  payingReferrals: 47,  lifetimeCommissionCents: 108000 },
    { userId: 'u_05', username: 'LuauLegend',        avatarInitials: 'LL', totalReferrals: 38,  payingReferrals: 32,  lifetimeCommissionCents: 76000  },
    { userId: 'u_06', username: 'ForjeGames_Fan',    avatarInitials: 'FG', totalReferrals: 29,  payingReferrals: 25,  lifetimeCommissionCents: 58000  },
    { userId: 'u_07', username: 'GameDevGuru',       avatarInitials: 'GG', totalReferrals: 21,  payingReferrals: 18,  lifetimeCommissionCents: 42000  },
    { userId: 'u_08', username: 'StudioArchitect',   avatarInitials: 'SA', totalReferrals: 15,  payingReferrals: 12,  lifetimeCommissionCents: 30000  },
    { userId: 'u_09', username: 'AssetHunter_7',     avatarInitials: 'AH', totalReferrals: 10,  payingReferrals: 8,   lifetimeCommissionCents: 20000  },
    { userId: 'u_10', username: 'TemplateKing',      avatarInitials: 'TK', totalReferrals: 7,   payingReferrals: 6,   lifetimeCommissionCents: 14000  },
  ])
}

export function getDemoCommissionEvents(): CommissionEvent[] {
  const now = new Date()
  return [
    {
      id: 'ce_001',
      referrerId: 'u_01',
      referredUserId: 'u_ref_001',
      type: 'paid_subscription',
      grossAmountCents: 5000,
      commissionCents: 2000, // $20 flat (Creator plan)
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      paid: false,
    },
    {
      id: 'ce_002',
      referrerId: 'u_01',
      referredUserId: 'u_ref_002',
      type: 'builder_plan',
      grossAmountCents: 2500,
      commissionCents: 1250, // $12.50 (half of $25, other half for taxes)
      createdAt: new Date(now.getTime() - 8 * 60 * 60 * 1000),
      paid: false,
    },
    {
      id: 'ce_003',
      referrerId: 'u_01',
      referredUserId: 'u_ref_003',
      type: 'paid_subscription',
      grossAmountCents: 1000,
      commissionCents: 2000, // $20 flat (Starter plan)
      createdAt: new Date(now.getTime() - 26 * 60 * 60 * 1000),
      paid: true,
    },
  ]
}
