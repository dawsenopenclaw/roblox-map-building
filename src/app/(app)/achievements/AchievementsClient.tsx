'use client'

import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { TierBadge, TierProgressBar, type Tier } from '@/components/TierBadge'
import {
  AchievementGrid,
  enrichAchievement,
  type AchievementItem,
} from '@/components/gamification/AchievementGrid'
import { StreakBanner } from '@/components/gamification/StreakBanner'
import {
  AchievementToastContainer,
  showAchievementToast,
} from '@/components/gamification/AchievementToast'

// ---- Types -----------------------------------------------------------------

const GOLD = '#D4AF37'

interface ApiAchievement {
  slug: string
  name: string
  description: string
  icon: string
  category: string
  xpReward: number
  unlocked: boolean
  unlockedAt: string | null
  condition?: Record<string, unknown>
}

interface AchievementsResponse {
  achievements: ApiAchievement[]
  unlockedCount: number
  total: number
  demo?: boolean
  _fallback?: boolean
}

interface GamificationStatus {
  xp: { totalXp: number; tier: string; dailyXpToday: number }
  streak: { loginStreak: number; buildStreak: number }
  recentAchievements: unknown[]
  demo?: boolean
}

interface CheckResult {
  newlyAwarded: Array<{
    slug: string
    name: string
    icon: string
    xpReward: number
    category: string
  }>
  newCount: number
}

function getRarityFromXp(xp: number): 'Common' | 'Rare' | 'Epic' | 'Legendary' {
  if (xp >= 500) return 'Legendary'
  if (xp >= 200) return 'Epic'
  if (xp >= 75) return 'Rare'
  return 'Common'
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

// ---- Page ------------------------------------------------------------------

export default function AchievementsClient() {
  const { data: achievementsData, mutate: mutateAchievements } =
    useSWR<AchievementsResponse>('/api/gamification/achievements', fetcher, {
      revalidateOnFocus: true,
    })

  const { data: statusData } = useSWR<GamificationStatus>(
    '/api/gamification/status',
    fetcher,
    { revalidateOnFocus: true }
  )

  const [hasChecked, setHasChecked] = useState(false)

  // Auto-check for new achievements on page load
  useEffect(() => {
    if (hasChecked) return
    setHasChecked(true)

    fetch('/api/gamification/achievements/check', { method: 'POST' })
      .then((r) => r.json())
      .then((data: CheckResult) => {
        if (data.newCount > 0) {
          // Show toast for each newly awarded achievement
          for (const a of data.newlyAwarded) {
            showAchievementToast({
              slug: a.slug,
              name: a.name,
              icon: a.icon,
              xpReward: a.xpReward,
              rarity: getRarityFromXp(a.xpReward),
            })
          }
          // Refresh achievement list
          mutateAchievements()
        }
      })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const achievements: AchievementItem[] = (
    achievementsData?.achievements ?? []
  ).map((a) =>
    enrichAchievement({
      ...a,
      category: a.category as never,
    })
  )

  const totalXp = statusData?.xp?.totalXp ?? 0
  const tier = (statusData?.xp?.tier ?? 'NOVICE') as Tier
  const unlockedCount = achievementsData?.unlockedCount ?? 0
  const total = achievementsData?.total ?? 0
  const progressPct = total > 0 ? Math.round((unlockedCount / total) * 100) : 0

  return (
    <div className="max-w-5xl mx-auto text-white space-y-8 pb-12">
      <AchievementToastContainer />

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Achievements</h1>
          <p className="text-gray-400 text-sm mt-1">
            {unlockedCount} of {total} unlocked &mdash;{' '}
            {totalXp.toLocaleString()} XP total
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <p
              className="text-3xl font-black tabular-nums"
              style={{ color: GOLD }}
            >
              {progressPct}%
            </p>
            <p className="text-[11px] text-gray-400">complete</p>
          </div>
          <TierBadge tier={tier} size="md" />
        </div>
      </div>

      {/* Overall progress bar */}
      <div>
        <div className="h-2.5 w-full rounded-full overflow-hidden bg-white/[0.08]">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${progressPct}%`,
              background: `linear-gradient(90deg, ${GOLD}aa, ${GOLD})`,
            }}
          />
        </div>
        <div className="mt-3">
          <TierProgressBar totalXp={totalXp} tier={tier} />
        </div>
      </div>

      {/* Streak banner */}
      <StreakBanner />

      {/* Achievement grid */}
      <AchievementGrid achievements={achievements} showFilters />
    </div>
  )
}
