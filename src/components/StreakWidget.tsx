'use client'
import useSWR from 'swr'
import { TierBadge, TierProgressBar, type Tier } from './TierBadge'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function StreakWidget() {
  const { data, isLoading } = useSWR('/api/gamification/status', fetcher, {
    refreshInterval: 60_000,
  })

  const xp = data?.xp?.totalXp ?? 0
  const tier = (data?.xp?.tier ?? 'NOVICE') as Tier
  const loginStreak = data?.streak?.loginStreak ?? 0
  const buildStreak = data?.streak?.buildStreak ?? 0

  if (isLoading) {
    return (
      <div className="bg-[#0D1231] border border-white/10 rounded-xl p-4 animate-pulse">
        <div className="h-4 w-24 bg-white/10 rounded mb-4" />
        <div className="h-8 w-32 bg-white/10 rounded mb-4" />
        <div className="h-2 bg-white/10 rounded-full" />
      </div>
    )
  }

  return (
    <div className="bg-[#0D1231] border border-white/10 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-gray-400 text-sm font-medium uppercase tracking-wide">Streak & XP</p>
        <div className="flex items-center gap-2">
          {buildStreak > 0 && (
            <div className="flex items-center gap-1 bg-blue-500/10 border border-blue-500/20 rounded-full px-2 py-0.5">
              <span className="text-sm">🔨</span>
              <span className="text-blue-400 text-xs font-bold">{buildStreak}d</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 bg-[#FFB81C]/10 border border-[#FFB81C]/20 rounded-full px-2.5 py-1">
            <span className="text-base">🔥</span>
            <span className="text-[#FFB81C] text-sm font-bold">{loginStreak} days</span>
          </div>
        </div>
      </div>

      <div className="flex items-end gap-3 mb-4">
        <div>
          <p className="text-3xl font-bold text-white">{xp.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-0.5">XP earned</p>
        </div>
        <div className="mb-1">
          <TierBadge tier={tier} size="sm" />
        </div>
      </div>

      <TierProgressBar totalXp={xp} tier={tier} />
    </div>
  )
}
