/**
 * XP engine — a pure, framework-agnostic module that converts actions into XP
 * awards, level math, and unlock metadata. No I/O: callers (API routes,
 * background jobs) are responsible for persistence.
 *
 * Keeping this pure makes it trivially unit-testable and reusable by the
 * gamification API, cron jobs, and webhook handlers.
 */

export type XpAction =
  | 'FIRST_BUILD'
  | 'BUILD'
  | 'BUILD_STREAK_BONUS'
  | 'FORK_GIVEN' // user forked someone else's project
  | 'FORK_RECEIVED' // user's project was forked by someone else
  | 'LIKE_RECEIVED'
  | 'SHARE_CREATED'
  | 'SHARE_CLICKTHROUGH'
  | 'DAILY_LOGIN'
  | 'DAILY_STREAK_7'
  | 'DAILY_STREAK_30'
  | 'CHALLENGE_COMPLETE'
  | 'REFERRAL_CONVERTED'
  | 'PROJECT_PUBLISHED'

export interface XpAward {
  action: XpAction
  amount: number
  reason: string
}

/**
 * Fixed XP amounts per action. Tune these carefully — they define the pace
 * at which users level up and should remain proportional (a daily login should
 * never outpace a first build).
 */
export const XP_AMOUNTS: Record<XpAction, number> = {
  FIRST_BUILD: 250,
  BUILD: 25,
  BUILD_STREAK_BONUS: 15,
  FORK_GIVEN: 10,
  FORK_RECEIVED: 40,
  LIKE_RECEIVED: 5,
  SHARE_CREATED: 15,
  SHARE_CLICKTHROUGH: 3,
  DAILY_LOGIN: 10,
  DAILY_STREAK_7: 75,
  DAILY_STREAK_30: 500,
  CHALLENGE_COMPLETE: 100,
  REFERRAL_CONVERTED: 200,
  PROJECT_PUBLISHED: 60,
}

/**
 * Base XP required for level N (1-indexed). A slightly sub-quadratic curve
 * keeps early levels fast and later levels meaningful.
 *
 *   xpForLevel(1) = 0
 *   xpForLevel(2) = 100
 *   xpForLevel(3) = 250
 *   xpForLevel(10) ≈ 2700
 *   xpForLevel(50) ≈ 49750
 */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0
  const n = level - 1
  // 50 * n * (n + 1) gives a gentle quadratic ramp.
  return 50 * n * (n + 1)
}

/** Level for a given total XP value. */
export function levelForXp(totalXp: number): number {
  if (totalXp < 0) return 1
  let level = 1
  while (xpForLevel(level + 1) <= totalXp) level++
  return level
}

export interface LevelProgress {
  level: number
  currentLevelXp: number
  nextLevelXp: number
  xpIntoLevel: number
  xpToNext: number
  progressPct: number // 0..1
}

export function computeProgress(totalXp: number): LevelProgress {
  const level = levelForXp(totalXp)
  const currentLevelXp = xpForLevel(level)
  const nextLevelXp = xpForLevel(level + 1)
  const xpIntoLevel = totalXp - currentLevelXp
  const xpToNext = Math.max(0, nextLevelXp - totalXp)
  const span = nextLevelXp - currentLevelXp
  const progressPct = span <= 0 ? 1 : Math.min(1, Math.max(0, xpIntoLevel / span))
  return { level, currentLevelXp, nextLevelXp, xpIntoLevel, xpToNext, progressPct }
}

/**
 * Compute the result of granting XP from an action.
 * Pure: does not touch storage.
 */
export interface GrantResult {
  award: XpAward
  totalXpBefore: number
  totalXpAfter: number
  levelBefore: number
  levelAfter: number
  leveledUp: boolean
  levelsGained: number
  progress: LevelProgress
}

export function grantXp(currentXp: number, action: XpAction): GrantResult {
  const amount = XP_AMOUNTS[action]
  const totalXpBefore = Math.max(0, currentXp)
  const totalXpAfter = totalXpBefore + amount
  const levelBefore = levelForXp(totalXpBefore)
  const levelAfter = levelForXp(totalXpAfter)
  return {
    award: { action, amount, reason: humanReason(action) },
    totalXpBefore,
    totalXpAfter,
    levelBefore,
    levelAfter,
    leveledUp: levelAfter > levelBefore,
    levelsGained: levelAfter - levelBefore,
    progress: computeProgress(totalXpAfter),
  }
}

export interface LevelRewardDefinition {
  level: number
  reward: string
  kind: 'cosmetic' | 'credits' | 'feature' | 'badge' | 'title'
}

/**
 * Rewards unlocked at specific levels. Not exhaustive — used by the
 * gamification UI to show upcoming unlocks.
 */
export const LEVEL_REWARDS: ReadonlyArray<LevelRewardDefinition> = [
  { level: 2, reward: 'Custom profile color', kind: 'cosmetic' },
  { level: 3, reward: '50 bonus credits', kind: 'credits' },
  { level: 5, reward: 'Unlock project tagging', kind: 'feature' },
  { level: 7, reward: 'Early adopter badge', kind: 'badge' },
  { level: 10, reward: '250 bonus credits', kind: 'credits' },
  { level: 12, reward: 'Custom project thumbnails', kind: 'feature' },
  { level: 15, reward: '"Creator" title', kind: 'title' },
  { level: 20, reward: 'Legendary badge slot', kind: 'badge' },
  { level: 25, reward: '1000 bonus credits', kind: 'credits' },
  { level: 30, reward: 'Private beta access', kind: 'feature' },
  { level: 40, reward: '"Architect" title', kind: 'title' },
  { level: 50, reward: 'Lifetime cosmetic pack', kind: 'cosmetic' },
]

export function rewardsAtLevel(level: number): LevelRewardDefinition[] {
  return LEVEL_REWARDS.filter((r) => r.level === level)
}

export function nextRewardAfter(level: number): LevelRewardDefinition | null {
  return LEVEL_REWARDS.find((r) => r.level > level) ?? null
}

function humanReason(action: XpAction): string {
  const map: Record<XpAction, string> = {
    FIRST_BUILD: 'First game built',
    BUILD: 'Built a game',
    BUILD_STREAK_BONUS: 'Build streak bonus',
    FORK_GIVEN: 'Remixed a project',
    FORK_RECEIVED: 'Your project was remixed',
    LIKE_RECEIVED: 'Someone liked your project',
    SHARE_CREATED: 'Shared a project',
    SHARE_CLICKTHROUGH: 'Share link click',
    DAILY_LOGIN: 'Daily login',
    DAILY_STREAK_7: '7-day streak',
    DAILY_STREAK_30: '30-day streak',
    CHALLENGE_COMPLETE: 'Daily challenge complete',
    REFERRAL_CONVERTED: 'Referred a new creator',
    PROJECT_PUBLISHED: 'Published a project',
  }
  return map[action]
}
