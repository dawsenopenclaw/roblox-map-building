'use client'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

const TIERS = [
  { name: 'Apprentice', minXp: 0, color: '#6B7280' },
  { name: 'Builder', minXp: 500, color: '#60A5FA' },
  { name: 'Creator', minXp: 2000, color: '#A78BFA' },
  { name: 'Architect', minXp: 5000, color: '#FFB81C' },
  { name: 'Master', minXp: 15000, color: '#F43F5E' },
]

function getTier(xp: number) {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (xp >= TIERS[i].minXp) return TIERS[i]
  }
  return TIERS[0]
}

function getNextTier(xp: number) {
  for (const tier of TIERS) {
    if (xp < tier.minXp) return tier
  }
  return null
}

export function StreakWidget() {
  // In production this would hit a real endpoint
  // Using static data as stub — real data wired in Phase 7
  const streak = 7
  const xp = 1240
  const tier = getTier(xp)
  const nextTier = getNextTier(xp)
  const progress = nextTier
    ? ((xp - tier.minXp) / (nextTier.minXp - tier.minXp)) * 100
    : 100

  return (
    <div className="bg-[#0D1231] border border-white/10 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-gray-400 text-sm font-medium uppercase tracking-wide">Streak & XP</p>
        <div className="flex items-center gap-1.5 bg-[#FFB81C]/10 border border-[#FFB81C]/20 rounded-full px-2.5 py-1">
          <span className="text-base">🔥</span>
          <span className="text-[#FFB81C] text-sm font-bold">{streak} days</span>
        </div>
      </div>

      <div className="flex items-end gap-3 mb-4">
        <div>
          <p className="text-3xl font-bold text-white">{xp.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-0.5">XP earned</p>
        </div>
        <div className="mb-1">
          <span
            className="text-sm font-semibold px-2 py-0.5 rounded-full"
            style={{ background: `${tier.color}20`, color: tier.color, border: `1px solid ${tier.color}40` }}
          >
            {tier.name}
          </span>
        </div>
      </div>

      {nextTier && (
        <>
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>{tier.name}</span>
            <span>{nextTier.name} at {nextTier.minXp.toLocaleString()} XP</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${progress}%`, background: tier.color }}
            />
          </div>
        </>
      )}
    </div>
  )
}
