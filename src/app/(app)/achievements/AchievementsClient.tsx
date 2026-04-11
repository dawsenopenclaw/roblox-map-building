'use client'

import { useState, useEffect } from 'react'
import { TierBadge, TierProgressBar, type Tier } from '@/components/TierBadge'

// ─── Types & Demo Data ────────────────────────────────────────────────────────

const GOLD = '#D4AF37'

type AchievementCategory = 'Builder' | 'Creator' | 'Social' | 'Streak'

interface Achievement {
  id: string
  iconKey: string
  name: string
  description: string
  xp: number
  unlocked: boolean
  unlockedDate?: string
  current?: number
  target?: number
  category: AchievementCategory
}

// ─── SVG Icon Map ─────────────────────────────────────────────────────────────

function AchievementIcon({ iconKey, className = 'w-5 h-5' }: { iconKey: string; className?: string }) {
  switch (iconKey) {
    case 'hammer':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      )
    case 'zap':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    case 'factory':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    case 'mountain':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 21l6.5-13 4 8 2.5-5 5 10H3z" />
        </svg>
      )
    case 'code':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      )
    case 'box':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    case 'rocket':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 2C12 2 17 7 17 12s-5 10-5 10-5-5-5-10S12 2 12 2zM12 2v20M7 7l5-5 5 5" />
        </svg>
      )
    case 'cart':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    case 'plug':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      )
    case 'folder':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      )
    case 'handshake':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zm8 0a4 4 0 100-8 4 4 0 000 8zm2 10v-2a4 4 0 00-3-3.87" />
        </svg>
      )
    case 'megaphone':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      )
    case 'fire':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
        </svg>
      )
    case 'star':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      )
    case 'gem':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M20 7H4L2 12l10 10 10-10-2-5zM4 7l2-4h12l2 4" />
        </svg>
      )
    case 'crown':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M5 19l-2-8 5 3 4-7 4 7 5-3-2 8H5zm0 0h14" />
        </svg>
      )
    case 'palette':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      )
    default:
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      )
  }
}

// ─── Category SVG Icons ───────────────────────────────────────────────────────

function CategorySvgIcon({ category, className = 'w-5 h-5' }: { category: AchievementCategory; className?: string }) {
  switch (category) {
    case 'Builder':
      return <AchievementIcon iconKey="hammer" className={className} />
    case 'Creator':
      return <AchievementIcon iconKey="palette" className={className} />
    case 'Social':
      return <AchievementIcon iconKey="handshake" className={className} />
    case 'Streak':
      return <AchievementIcon iconKey="fire" className={className} />
  }
}

const ACHIEVEMENTS: Achievement[] = [
  // Builder
  { id: 'first_build',    iconKey: 'hammer',    name: 'First Build',       description: 'Complete your very first AI build',           xp: 50,  unlocked: true,  unlockedDate: '2026-03-01', category: 'Builder' },
  { id: 'speed_builder',  iconKey: 'zap',       name: 'Speed Builder',     description: 'Complete 10 builds in a single day',          xp: 150, unlocked: false, current: 7,  target: 10, category: 'Builder' },
  { id: 'prolific',       iconKey: 'factory',   name: 'Prolific',          description: 'Complete 100 total AI builds',                xp: 300, unlocked: false, current: 47, target: 100, category: 'Builder' },
  { id: 'terrain_master', iconKey: 'mountain',  name: 'Terrain Master',    description: 'Generate 20 terrain builds',                  xp: 200, unlocked: true,  unlockedDate: '2026-03-15', category: 'Builder' },
  { id: 'scripter',       iconKey: 'code',      name: 'Scripter',          description: 'Generate 15 Luau scripts with AI',            xp: 175, unlocked: false, current: 9,  target: 15, category: 'Builder' },
  { id: 'asset_hoarder',  iconKey: 'box',       name: 'Asset Hoarder',     description: 'Generate 50 mesh or texture assets',          xp: 250, unlocked: false, current: 12, target: 50, category: 'Builder' },

  // Creator
  { id: 'publisher',      iconKey: 'rocket',    name: 'Publisher',         description: 'Publish your first asset to the marketplace', xp: 100, unlocked: false, current: 0, target: 1, category: 'Creator' },
  { id: 'market_maven',   iconKey: 'cart',      name: 'Market Maven',      description: 'Purchase 5 marketplace assets',               xp: 100, unlocked: false, current: 2, target: 5, category: 'Creator' },
  { id: 'studio_link',    iconKey: 'plug',      name: 'Studio Link',       description: 'Connect ForjeGames to Roblox Studio',         xp: 75,  unlocked: true,  unlockedDate: '2026-03-05', category: 'Creator' },
  { id: 'project_maker',  iconKey: 'folder',    name: 'Project Maker',     description: 'Create 5 distinct projects',                  xp: 125, unlocked: false, current: 3, target: 5, category: 'Creator' },

  // Social
  { id: 'social_start',   iconKey: 'handshake', name: 'Social Starter',    description: 'Refer your first friend to ForjeGames',       xp: 150, unlocked: false, current: 0, target: 1, category: 'Social' },
  { id: 'influencer',     iconKey: 'megaphone', name: 'Influencer',        description: 'Refer 5 friends who make a build',            xp: 400, unlocked: false, current: 0, target: 5, category: 'Social' },

  // Streak
  { id: 'streak_3',       iconKey: 'fire',      name: 'Hot Streak',        description: 'Build 3 days in a row',                      xp: 75,  unlocked: true,  unlockedDate: '2026-03-20', category: 'Streak' },
  { id: 'streak_7',       iconKey: 'star',      name: 'Week Warrior',      description: 'Build 7 days in a row',                      xp: 150, unlocked: false, current: 7, target: 7, category: 'Streak' },
  { id: 'streak_14',      iconKey: 'gem',       name: 'On Fire',           description: 'Maintain a 14-day build streak',              xp: 300, unlocked: false, current: 7, target: 14, category: 'Streak' },
  { id: 'streak_30',      iconKey: 'crown',     name: 'Legend',            description: 'Maintain a 30-day build streak',              xp: 750, unlocked: false, current: 7, target: 30, category: 'Streak' },
]

const CATEGORY_META: Record<AchievementCategory, { color: string }> = {
  Builder: { color: GOLD },
  Creator: { color: '#60A5FA' },
  Social:  { color: '#34D399' },
  Streak:  { color: '#F59E0B' },
}

const CATEGORIES: AchievementCategory[] = ['Builder', 'Creator', 'Social', 'Streak']

// ─── API response shape ───────────────────────────────────────────────────────

interface ApiAchievement {
  slug: string
  unlocked: boolean
  unlockedAt: string | null
}

interface AchievementsApiResponse {
  achievements: ApiAchievement[]
  unlockedCount: number
  total: number
  demo?: boolean
  _fallback?: boolean
}

const DEMO_XP   = 850
const DEMO_TIER = 'APPRENTICE' as Tier

// ─── Achievement Card ─────────────────────────────────────────────────────────

function AchievementCard({ achievement }: { achievement: Achievement }) {
  const { unlocked, current, target, xp, iconKey, name, description, unlockedDate, category } = achievement
  const catColor = CATEGORY_META[category].color
  const pct = target ? Math.round(((current ?? 0) / target) * 100) : 0

  return (
    <div
      className="relative rounded-xl border p-4 flex flex-col gap-3 transition-all duration-200 hover:-translate-y-0.5"
      style={{
        background: 'rgba(10, 14, 32, 0.6)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderColor: unlocked ? `${catColor}35` : 'rgba(255, 255, 255, 0.06)',
        boxShadow: unlocked ? `0 0 18px ${catColor}10, inset 0 1px 0 rgba(255,255,255,0.04)` : 'inset 0 1px 0 rgba(255,255,255,0.04)',
        opacity: unlocked ? 1 : 0.85,
      }}
    >
      {/* Lock overlay */}
      {!unlocked && (
        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-white/[0.08] flex items-center justify-center">
          <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
      )}

      {/* Unlocked checkmark */}
      {unlocked && (
        <div
          className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ background: catColor }}
        >
          <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      {/* Icon */}
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
          background: unlocked ? `${catColor}12` : 'rgba(255,255,255,0.04)',
          border: `1px solid ${unlocked ? `${catColor}25` : 'rgba(255,255,255,0.06)'}`,
          color: unlocked ? catColor : '#4b5563',
          filter: unlocked ? 'none' : 'grayscale(0.8)',
        }}
      >
        <AchievementIcon iconKey={iconKey} className="w-5 h-5" />
      </div>

      {/* Text */}
      <div className="flex-1">
        <p className={`text-sm font-bold leading-tight ${unlocked ? 'text-white' : 'text-gray-400'}`}>{name}</p>
        <p className="text-[11px] text-gray-400 mt-0.5 leading-snug line-clamp-2">{description}</p>
      </div>

      {/* XP / date */}
      <div className="flex items-center justify-between">
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{
            color: unlocked ? catColor : '#6b7280',
            background: unlocked ? `${catColor}12` : 'rgba(255,255,255,0.05)',
          }}
        >
          +{xp} XP
        </span>
        {unlocked && unlockedDate && (
          <span className="text-[10px] text-gray-400">{unlockedDate}</span>
        )}
      </div>

      {/* Progress bar for in-progress */}
      {!unlocked && target && (
        <div>
          <div className="flex justify-between text-[10px] text-gray-400 mb-1">
            <span>{current ?? 0} / {target}</span>
            <span>{pct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: catColor }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Category Section ─────────────────────────────────────────────────────────

function CategorySection({
  category,
  achievements,
  active,
}: {
  category: AchievementCategory
  achievements: Achievement[]
  active: boolean
}) {
  if (!active) return null
  const meta = CATEGORY_META[category]
  const unlocked = achievements.filter((a) => a.unlocked).length
  const total = achievements.length
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ color: meta.color }}>
            <CategorySvgIcon category={category} className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-white">{category}</h2>
        </div>
        <span className="text-xs text-gray-400">{unlocked}/{total} unlocked</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {achievements.map((a) => (
          <AchievementCard key={a.id} achievement={a} />
        ))}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AchievementsPage() {
  const [activeCategory, setActiveCategory] = useState<AchievementCategory | 'All'>('All')

  const unlockedCount = ACHIEVEMENTS.filter((a) => a.unlocked).length
  const total = ACHIEVEMENTS.length
  const totalXp = ACHIEVEMENTS.filter((a) => a.unlocked).reduce((s, a) => s + a.xp, 0)
  const progressPct = Math.round((unlockedCount / total) * 100)

  const byCategory = CATEGORIES.reduce<Record<AchievementCategory, Achievement[]>>(
    (acc, cat) => {
      acc[cat] = ACHIEVEMENTS.filter((a) => a.category === cat)
      return acc
    },
    {} as Record<AchievementCategory, Achievement[]>
  )

  return (
    <div className="max-w-5xl mx-auto text-white space-y-8 pb-12">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Achievements</h1>
          <p className="text-gray-400 text-sm mt-1">{unlockedCount} of {total} unlocked &mdash; {(DEMO_XP + totalXp).toLocaleString()} XP total</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <p className="text-3xl font-black tabular-nums" style={{ color: GOLD }}>{progressPct}%</p>
            <p className="text-[11px] text-gray-400">complete</p>
          </div>
          <TierBadge tier={DEMO_TIER} size="md" />
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="h-2.5 w-full rounded-full overflow-hidden bg-white/[0.08]">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${progressPct}%`, background: `linear-gradient(90deg, ${GOLD}aa, ${GOLD})` }}
          />
        </div>
        <div className="mt-3">
          <TierProgressBar totalXp={DEMO_XP} tier={DEMO_TIER} />
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {CATEGORIES.map((cat) => {
          const catAch = byCategory[cat]
          const catUnlocked = catAch.filter((a) => a.unlocked).length
          const meta = CATEGORY_META[cat]
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(activeCategory === cat ? 'All' : cat)}
              className="rounded-xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: activeCategory === cat || activeCategory === 'All' ? `${meta.color}12` : 'rgba(10, 14, 32, 0.6)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                borderColor: activeCategory === cat ? `${meta.color}40` : 'rgba(255,255,255,0.06)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
              }}
            >
              <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-2" style={{ color: meta.color, background: `${meta.color}15` }}>
                <CategorySvgIcon category={cat} className="w-4 h-4" />
              </div>
              <p className="text-sm font-bold text-white">{cat}</p>
              <p className="text-[11px] text-gray-400">{catUnlocked}/{catAch.length}</p>
              <div className="mt-2 h-1 rounded-full bg-white/[0.08] overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.round((catUnlocked / catAch.length) * 100)}%`,
                    background: meta.color,
                  }}
                />
              </div>
            </button>
          )
        })}
      </div>

      {/* Category tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {(['All', ...CATEGORIES] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className="px-3 py-1.5 rounded-xl text-sm font-semibold transition-all duration-150"
            style={{
              background: activeCategory === cat ? GOLD : 'rgba(255,255,255,0.06)',
              color: activeCategory === cat ? '#000' : '#9ca3af',
              border: activeCategory === cat ? 'none' : '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Achievement grids */}
      {activeCategory === 'All' ? (
        <div className="space-y-10">
          {CATEGORIES.map((cat) => (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-5 h-5 flex items-center justify-center" style={{ color: CATEGORY_META[cat].color }}>
                  <CategorySvgIcon category={cat} className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-white">{cat}</h2>
                <span className="text-xs text-gray-400 ml-1">
                  {byCategory[cat].filter((a) => a.unlocked).length}/{byCategory[cat].length}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {byCategory[cat].map((a) => (
                  <AchievementCard key={a.id} achievement={a} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        CATEGORIES.map((cat) => (
          <CategorySection
            key={cat}
            category={cat}
            achievements={byCategory[cat]}
            active={activeCategory === cat}
          />
        ))
      )}
    </div>
  )
}
