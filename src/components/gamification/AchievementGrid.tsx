'use client'

import { useState } from 'react'
import type { AchievementCategory } from '@prisma/client'

// ---- Types -----------------------------------------------------------------

export interface AchievementItem {
  slug: string
  name: string
  description: string
  icon: string
  category: AchievementCategory
  xpReward: number
  unlocked: boolean
  unlockedAt: string | null
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary'
  progress: number // 0-100
}

// ---- Constants -------------------------------------------------------------

const GOLD = '#D4AF37'

const RARITY_COLORS: Record<string, string> = {
  Common: '#71717A',
  Rare: '#60A5FA',
  Epic: '#A855F7',
  Legendary: '#D4AF37',
}

const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  FIRST_STEPS: 'Getting Started',
  VELOCITY: 'Building',
  MARKETPLACE: 'Marketplace',
  COMMUNITY: 'Social',
  QUALITY: 'Milestones',
  EXPLORATION: 'Streaks',
  SOCIAL: 'Social',
}

const CATEGORY_ORDER: AchievementCategory[] = [
  'FIRST_STEPS',
  'VELOCITY',
  'MARKETPLACE',
  'COMMUNITY',
  'QUALITY',
  'EXPLORATION',
]

// ---- Helpers ---------------------------------------------------------------

function getRarity(xpReward: number): 'Common' | 'Rare' | 'Epic' | 'Legendary' {
  if (xpReward >= 500) return 'Legendary'
  if (xpReward >= 200) return 'Epic'
  if (xpReward >= 75) return 'Rare'
  return 'Common'
}

export function enrichAchievement(
  a: {
    slug: string
    name: string
    description: string
    icon: string
    category: AchievementCategory
    xpReward: number
    unlocked: boolean
    unlockedAt: string | null
    condition?: Record<string, unknown>
  }
): AchievementItem {
  return {
    ...a,
    rarity: getRarity(a.xpReward),
    progress: a.unlocked ? 100 : 0,
  }
}

// ---- Lock Icon SVG ---------------------------------------------------------

function LockIcon({ className = 'w-3 h-3' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  )
}

function CheckIcon({ className = 'w-3 h-3' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={3}
        d="M5 13l4 4L19 7"
      />
    </svg>
  )
}

// ---- Achievement Card ------------------------------------------------------

function AchievementCard({ achievement }: { achievement: AchievementItem }) {
  const { unlocked, name, description, icon, rarity, xpReward, unlockedAt } =
    achievement
  const rarityColor = RARITY_COLORS[rarity]

  return (
    <div
      className="relative rounded-xl border p-4 flex flex-col gap-3 transition-all duration-200 hover:-translate-y-0.5"
      style={{
        background: 'rgba(10, 14, 32, 0.6)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderColor: unlocked ? `${rarityColor}35` : 'rgba(255, 255, 255, 0.06)',
        boxShadow: unlocked
          ? `0 0 20px ${rarityColor}12, inset 0 1px 0 rgba(255,255,255,0.04)`
          : 'inset 0 1px 0 rgba(255,255,255,0.04)',
        opacity: unlocked ? 1 : 0.75,
      }}
    >
      {/* Status indicator */}
      <div className="absolute top-3 right-3">
        {unlocked ? (
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: rarityColor }}
          >
            <CheckIcon className="w-3 h-3 text-black" />
          </div>
        ) : (
          <div className="w-5 h-5 rounded-full bg-white/[0.08] flex items-center justify-center">
            <LockIcon className="w-3 h-3 text-gray-500" />
          </div>
        )}
      </div>

      {/* Icon */}
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
        style={{
          background: unlocked ? `${rarityColor}12` : 'rgba(255,255,255,0.04)',
          border: `1px solid ${unlocked ? `${rarityColor}25` : 'rgba(255,255,255,0.06)'}`,
          filter: unlocked ? 'none' : 'grayscale(0.8)',
        }}
      >
        {icon}
      </div>

      {/* Text */}
      <div className="flex-1">
        <p
          className={`text-sm font-bold leading-tight ${
            unlocked ? 'text-white' : 'text-gray-400'
          }`}
        >
          {name}
        </p>
        <p className="text-[11px] text-gray-500 mt-0.5 leading-snug line-clamp-2">
          {description}
        </p>
      </div>

      {/* Bottom row: rarity + xp + date */}
      <div className="flex items-center justify-between flex-wrap gap-1">
        <div className="flex items-center gap-2">
          <span
            className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
            style={{
              color: rarityColor,
              background: `${rarityColor}12`,
              border: `1px solid ${rarityColor}20`,
            }}
          >
            {rarity}
          </span>
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
            style={{
              color: unlocked ? GOLD : '#6b7280',
              background: unlocked ? `${GOLD}12` : 'rgba(255,255,255,0.05)',
            }}
          >
            +{xpReward} XP
          </span>
        </div>
        {unlocked && unlockedAt && (
          <span className="text-[10px] text-gray-500">
            {new Date(unlockedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        )}
      </div>
    </div>
  )
}

// ---- Grid ------------------------------------------------------------------

interface AchievementGridProps {
  achievements: AchievementItem[]
  /** Show category filter tabs (default true) */
  showFilters?: boolean
}

export function AchievementGrid({
  achievements,
  showFilters = true,
}: AchievementGridProps) {
  const [activeCategory, setActiveCategory] = useState<
    AchievementCategory | 'ALL'
  >('ALL')

  // Group by category
  const categories = CATEGORY_ORDER.filter((cat) =>
    achievements.some((a) => a.category === cat)
  )

  const filtered =
    activeCategory === 'ALL'
      ? achievements
      : achievements.filter((a) => a.category === activeCategory)

  const unlockedCount = achievements.filter((a) => a.unlocked).length

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">
          <span className="text-white font-bold">{unlockedCount}</span> of{' '}
          <span className="text-white font-bold">{achievements.length}</span>{' '}
          unlocked
        </p>
        <div className="h-1.5 w-32 rounded-full bg-white/[0.08] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${
                achievements.length > 0
                  ? (unlockedCount / achievements.length) * 100
                  : 0
              }%`,
              background: `linear-gradient(90deg, ${GOLD}aa, ${GOLD})`,
            }}
          />
        </div>
      </div>

      {/* Category filters */}
      {showFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveCategory('ALL')}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150"
            style={{
              background: activeCategory === 'ALL' ? GOLD : 'rgba(255,255,255,0.06)',
              color: activeCategory === 'ALL' ? '#000' : '#9ca3af',
              border:
                activeCategory === 'ALL'
                  ? 'none'
                  : '1px solid rgba(255,255,255,0.08)',
            }}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() =>
                setActiveCategory(activeCategory === cat ? 'ALL' : cat)
              }
              className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150"
              style={{
                background:
                  activeCategory === cat ? GOLD : 'rgba(255,255,255,0.06)',
                color: activeCategory === cat ? '#000' : '#9ca3af',
                border:
                  activeCategory === cat
                    ? 'none'
                    : '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {CATEGORY_LABELS[cat] ?? cat}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      {activeCategory === 'ALL' ? (
        <div className="space-y-8">
          {categories.map((cat) => {
            const catAchievements = achievements.filter(
              (a) => a.category === cat
            )
            const catUnlocked = catAchievements.filter((a) => a.unlocked).length
            return (
              <div key={cat}>
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-sm font-bold text-white">
                    {CATEGORY_LABELS[cat] ?? cat}
                  </h3>
                  <span className="text-xs text-gray-500">
                    {catUnlocked}/{catAchievements.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {catAchievements.map((a) => (
                    <AchievementCard key={a.slug} achievement={a} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((a) => (
            <AchievementCard key={a.slug} achievement={a} />
          ))}
        </div>
      )}
    </div>
  )
}
