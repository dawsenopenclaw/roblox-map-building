// ─── Referral System ──────────────────────────────────────────────────────────
// Unique codes, chain tracking, 20% lifetime commissions, milestone rewards,
// and leaderboard logic.
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
  type: 'subscription_payment' | 'token_purchase' | 'marketplace_sale'
  grossAmountCents: number
  commissionCents: number        // 20% of gross
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

// ─── Code generation ──────────────────────────────────────────────────────────

/**
 * Deterministic referral code derived from userId — stable across sessions.
 * Format: FG-XXXX where XXXX is a 4-digit number.
 */
export function generateReferralCode(userId: string): string {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0
  }
  return `FG-${(hash % 9000 + 1000).toString()}`
}

export function buildReferralLink(userId: string, baseUrl = 'https://forjegames.com'): string {
  return `${baseUrl}/sign-up?ref=${generateReferralCode(userId)}`
}

// ─── Commission calculation ───────────────────────────────────────────────────

export const COMMISSION_RATE = 0.20 // 20% lifetime

export function calculateCommission(grossAmountCents: number): number {
  return Math.round(grossAmountCents * COMMISSION_RATE)
}

export function projectLifetimeCommission(
  payingReferrals: number,
  avgMonthlyRevenuePerUser: number, // cents
  avgRetentionMonths: number,
): number {
  return Math.round(
    payingReferrals * avgMonthlyRevenuePerUser * avgRetentionMonths * COMMISSION_RATE,
  )
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
  return buildLeaderboard([
    { userId: 'u_01', username: 'BloxStudio_Pro',    avatarInitials: 'BP', totalReferrals: 142, payingReferrals: 118, lifetimeCommissionCents: 423600 },
    { userId: 'u_02', username: 'DevMaster_Z',       avatarInitials: 'DZ', totalReferrals: 97,  payingReferrals: 84,  lifetimeCommissionCents: 302400 },
    { userId: 'u_03', username: 'MapBuilder99',      avatarInitials: 'MB', totalReferrals: 73,  payingReferrals: 61,  lifetimeCommissionCents: 219600 },
    { userId: 'u_04', username: 'ScriptWizard_X',    avatarInitials: 'SW', totalReferrals: 54,  payingReferrals: 47,  lifetimeCommissionCents: 169200 },
    { userId: 'u_05', username: 'LuauLegend',        avatarInitials: 'LL', totalReferrals: 38,  payingReferrals: 32,  lifetimeCommissionCents: 115200 },
    { userId: 'u_06', username: 'RobloxForge_Fan',   avatarInitials: 'RF', totalReferrals: 29,  payingReferrals: 25,  lifetimeCommissionCents: 90000  },
    { userId: 'u_07', username: 'GameDevGuru',       avatarInitials: 'GG', totalReferrals: 21,  payingReferrals: 18,  lifetimeCommissionCents: 64800  },
    { userId: 'u_08', username: 'StudioArchitect',   avatarInitials: 'SA', totalReferrals: 15,  payingReferrals: 12,  lifetimeCommissionCents: 43200  },
    { userId: 'u_09', username: 'AssetHunter_7',     avatarInitials: 'AH', totalReferrals: 10,  payingReferrals: 8,   lifetimeCommissionCents: 28800  },
    { userId: 'u_10', username: 'TemplateKing',      avatarInitials: 'TK', totalReferrals: 7,   payingReferrals: 6,   lifetimeCommissionCents: 21600  },
  ])
}

export function getDemoCommissionEvents(): CommissionEvent[] {
  const now = new Date()
  return [
    {
      id: 'ce_001',
      referrerId: 'u_01',
      referredUserId: 'u_ref_001',
      type: 'subscription_payment',
      grossAmountCents: 2999,
      commissionCents: 599,
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      paid: false,
    },
    {
      id: 'ce_002',
      referrerId: 'u_01',
      referredUserId: 'u_ref_002',
      type: 'token_purchase',
      grossAmountCents: 4999,
      commissionCents: 999,
      createdAt: new Date(now.getTime() - 8 * 60 * 60 * 1000),
      paid: false,
    },
    {
      id: 'ce_003',
      referrerId: 'u_01',
      referredUserId: 'u_ref_003',
      type: 'marketplace_sale',
      grossAmountCents: 1499,
      commissionCents: 299,
      createdAt: new Date(now.getTime() - 26 * 60 * 60 * 1000),
      paid: true,
    },
  ]
}
