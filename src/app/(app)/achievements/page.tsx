'use client'

import useSWR from 'swr'
import { notifyAchievementUnlock } from '@/components/AchievementToast'
import { StreakWidget } from '@/components/StreakWidget'
import { TierBadge, type Tier } from '@/components/TierBadge'
import { useEffect, useRef } from 'react'

type AchievementCategory =
  | 'FIRST_STEPS'
  | 'VELOCITY'
  | 'MARKETPLACE'
  | 'COMMUNITY'
  | 'QUALITY'
  | 'EXPLORATION'

interface Achievement {
  slug: string
  name: string
  description: string
  icon: string
  category: AchievementCategory
  xpReward: number
  unlocked: boolean
  unlockedAt: string | null
}

interface AchievementsResponse {
  achievements: Achievement[]
  unlockedCount: number
  total: number
  _fallback?: boolean
}

interface StatusResponse {
  xp: { totalXp: number; tier: string; dailyXpToday: number }
  streak: { loginStreak: number; buildStreak: number }
  recentAchievements: Array<{
    unlockedAt: string
    achievement: { slug: string; name: string; icon: string; xpReward: number }
  }>
}

const CATEGORY_META: Record<AchievementCategory, { label: string; icon: string }> = {
  FIRST_STEPS: { label: 'First Steps', icon: '👣' },
  VELOCITY:    { label: 'Velocity',    icon: '⚡' },
  MARKETPLACE: { label: 'Marketplace', icon: '🏪' },
  COMMUNITY:   { label: 'Community',   icon: '🤝' },
  QUALITY:     { label: 'Quality',     icon: '🏖️' },
  EXPLORATION: { label: 'Exploration', icon: '🗺️' },
}

const CATEGORY_ORDER: AchievementCategory[] = [
  'FIRST_STEPS',
  'VELOCITY',
  'MARKETPLACE',
  'COMMUNITY',
  'QUALITY',
  'EXPLORATION',
]

const fetcher = (url: string) => fetch(url).then(r => r.json())

function AchievementCard({ achievement }: { achievement: Achievement }) {
  const earned = achievement.unlocked
  const formattedDate = achievement.unlockedAt
    ? new Date(achievement.unlockedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null

  return (
    <div
      className={`relative rounded-xl p-3 text-center flex flex-col items-center transition-all duration-200 ${
        earned
          ? 'bg-[#141414] border border-[#FFB81C]/40 shadow-sm shadow-[#FFB81C]/10'
          : 'bg-[#0F0F0F] border border-white/[0.08] opacity-60'
      }`}
      title={earned && formattedDate ? `Unlocked ${formattedDate}` : achievement.description}
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-2 flex-shrink-0 ${
          earned ? 'bg-[#FFB81C]/15' : 'bg-white/5 grayscale'
        }`}
      >
        {achievement.icon}
      </div>
      <p className={`text-xs font-semibold leading-tight mb-1 ${earned ? 'text-white' : 'text-gray-500'}`}>
        {achievement.name}
      </p>
      <p className="text-[10px] text-gray-500 leading-tight mb-2 line-clamp-2">
        {achievement.description}
      </p>
      {achievement.xpReward > 0 ? (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${earned ? 'bg-[#FFB81C]/20 text-[#FFB81C]' : 'bg-white/5 text-gray-500'}`}>
          +{achievement.xpReward} XP
        </span>
      ) : (
        <span className="text-[10px] text-gray-600 px-2 py-0.5">Tier unlock</span>
      )}
      {earned && (
        <div className="absolute top-2 right-2 w-4 h-4 bg-[#FFB81C] rounded-full flex items-center justify-center">
          <svg className="w-2.5 h-2.5 text-black" fill="none" viewBox="0 0 10 10" stroke="currentColor" strokeWidth={2}>
            <path d="M2 5l2.5 2.5L8 3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
    </div>
  )
}

function CategorySection({ category, achievements }: { category: AchievementCategory; achievements: Achievement[] }) {
  const meta = CATEGORY_META[category]
  const unlocked = achievements.filter(a => a.unlocked).length
  const total = achievements.length
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{meta.icon}</span>
          <h2 className="text-sm font-semibold text-white uppercase tracking-wide">{meta.label}</h2>
        </div>
        <span className="text-xs text-gray-500">{unlocked}/{total}</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {achievements.map(a => (
          <AchievementCard key={a.slug} achievement={a} />
        ))}
      </div>
    </div>
  )
}

export default function AchievementsPage() {
  const { data: achievementsData, isLoading: loadingAchievements } =
    useSWR<AchievementsResponse>('/api/gamification/achievements', fetcher, { revalidateOnFocus: false })

  const { data: statusData } = useSWR<StatusResponse>('/api/gamification/status', fetcher, { refreshInterval: 60_000 })

  const toastedRef = useRef(false)
  useEffect(() => {
    if (toastedRef.current || !achievementsData?.achievements) return
    toastedRef.current = true
    const recent = achievementsData.achievements
      .filter(a => a.unlocked && a.unlockedAt)
      .sort((a, b) => new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime())[0]
    if (recent) {
      const age = Date.now() - new Date(recent.unlockedAt!).getTime()
      if (age < 30_000) {
        notifyAchievementUnlock({ name: recent.name, icon: recent.icon, xpReward: recent.xpReward, achievementId: recent.slug })
      }
    }
  }, [achievementsData])

  const unlockedCount = achievementsData?.unlockedCount ?? 0
  const total         = achievementsData?.total ?? 30
  const progressPct   = total > 0 ? Math.round((unlockedCount / total) * 100) : 0
  const xp            = statusData?.xp?.totalXp ?? 0
  const tier          = (statusData?.xp?.tier ?? 'NOVICE') as Tier

  const byCategory = CATEGORY_ORDER.reduce<Record<AchievementCategory, Achievement[]>>(
    (acc, cat) => { acc[cat] = []; return acc },
    {} as Record<AchievementCategory, Achievement[]>
  )
  if (achievementsData?.achievements) {
    for (const a of achievementsData.achievements) {
      if (byCategory[a.category]) byCategory[a.category].push(a)
    }
  }

  if (loadingAchievements) {
    return (
      <div className="max-w-5xl mx-auto animate-pulse">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="h-7 w-40 bg-white/10 rounded-xl mb-2" />
            <div className="h-4 w-28 bg-white/10 rounded" />
          </div>
          <div className="h-9 w-16 bg-white/10 rounded-xl" />
        </div>
        <div className="h-2 w-full bg-white/10 rounded-full mb-10" />
        {CATEGORY_ORDER.map(cat => (
          <div key={cat} className="mb-8">
            <div className="h-5 w-32 bg-white/10 rounded mb-3" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-[#141414] border border-white/10 rounded-xl h-28" />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Achievements</h1>
          <p className="text-gray-400 text-sm">{unlockedCount} of {total} unlocked</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <p className="text-3xl font-bold text-[#FFB81C]">{progressPct}%</p>
            <p className="text-xs text-gray-500">complete</p>
          </div>
          <TierBadge tier={tier} size="md" />
        </div>
      </div>
      <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden mb-2">
        <div className="h-full rounded-full bg-[#FFB81C] transition-all duration-700" style={{ width: `${progressPct}%` }} />
      </div>
      <p className="text-xs text-gray-600 mb-8">{xp.toLocaleString()} XP total</p>
      <div className="mb-8">
        <StreakWidget />
      </div>
      {CATEGORY_ORDER.map(cat => (
        <CategorySection key={cat} category={cat} achievements={byCategory[cat]} />
      ))}
      {!achievementsData && !loadingAchievements && (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-3">🏆</p>
          <p className="text-sm">Could not load achievements. Try refreshing.</p>
        </div>
      )}
    </div>
  )
}
