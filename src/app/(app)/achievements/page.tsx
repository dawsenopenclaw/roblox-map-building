'use client'
import useSWR from 'swr'
import { AchievementCategory } from '@prisma/client'
import { ShareButtons } from '@/components/ShareButtons'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://robloxforge.gg'

const fetcher = (url: string) => fetch(url).then(r => r.json())

const CATEGORY_LABELS: Record<string, string> = {
  FIRST_STEPS: 'First Steps',
  VELOCITY: 'Velocity',
  MARKETPLACE: 'Marketplace',
  COMMUNITY: 'Community',
  QUALITY: 'Quality',
  EXPLORATION: 'Exploration',
}

const CATEGORY_ORDER = ['FIRST_STEPS', 'VELOCITY', 'MARKETPLACE', 'COMMUNITY', 'QUALITY', 'EXPLORATION']

interface Achievement {
  slug: string
  name: string
  description: string
  icon: string
  category: string
  xpReward: number
  unlocked: boolean
  unlockedAt: string | null
}

export default function AchievementsPage() {
  const { data, isLoading } = useSWR('/api/gamification/achievements', fetcher)

  const achievements: Achievement[] = data?.achievements || []
  const unlockedCount: number = data?.unlockedCount ?? 0
  const total: number = data?.total ?? 0

  const grouped = CATEGORY_ORDER.reduce<Record<string, Achievement[]>>((acc, cat) => {
    acc[cat] = achievements.filter(a => a.category === cat)
    return acc
  }, {})

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto animate-pulse">
        <div className="h-8 bg-white/10 rounded w-48 mb-8" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-32 bg-white/5 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Achievements</h1>
          <p className="text-gray-400 text-sm mt-1">
            {unlockedCount} / {total} unlocked
          </p>
        </div>
        {/* Progress ring */}
        <div className="text-right">
          <p className="text-3xl font-bold text-[#FFB81C]">
            {total > 0 ? Math.round((unlockedCount / total) * 100) : 0}%
          </p>
          <p className="text-xs text-gray-500">complete</p>
        </div>
      </div>

      {/* Overall progress bar */}
      <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-8">
        <div
          className="h-full bg-[#FFB81C] rounded-full transition-all duration-700"
          style={{ width: `${total > 0 ? (unlockedCount / total) * 100 : 0}%` }}
        />
      </div>

      {/* Categories */}
      {CATEGORY_ORDER.map(cat => {
        const catAchievements = grouped[cat] || []
        const catUnlocked = catAchievements.filter(a => a.unlocked).length
        return (
          <div key={cat} className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-white">
                {CATEGORY_LABELS[cat] || cat}
              </h2>
              <span className="text-xs text-gray-500">{catUnlocked}/{catAchievements.length}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {catAchievements.map(achievement => (
                <div
                  key={achievement.slug}
                  className={`bg-[#0D1231] border rounded-xl p-3 text-center transition-all ${
                    achievement.unlocked
                      ? 'border-[#FFB81C]/30 ring-1 ring-[#FFB81C]/10'
                      : 'border-white/10 opacity-50 grayscale'
                  }`}
                >
                  <div className="text-3xl mb-2">{achievement.icon}</div>
                  <p className={`text-xs font-semibold mb-1 ${achievement.unlocked ? 'text-white' : 'text-gray-400'}`}>
                    {achievement.name}
                  </p>
                  <p className="text-xs text-gray-500 leading-tight">{achievement.description}</p>
                  {achievement.xpReward > 0 && (
                    <div className="mt-2 inline-flex items-center gap-1 bg-[#FFB81C]/10 px-1.5 py-0.5 rounded-full">
                      <span className="text-[10px] text-[#FFB81C] font-bold">+{achievement.xpReward} XP</span>
                    </div>
                  )}
                  {achievement.unlocked && achievement.unlockedAt && (
                    <p className="text-[10px] text-gray-600 mt-1">
                      {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </p>
                  )}
                  {achievement.unlocked && (
                    <div className="mt-2 flex justify-center">
                      <ShareButtons
                        url={`${APP_URL}/achievements`}
                        text={`I just unlocked "${achievement.name}" on RobloxForge! ${achievement.icon} ${achievement.description}`}
                        compact
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
