'use client'

import { useState } from 'react'
import { TierBadge, TierProgressBar, type Tier } from '@/components/TierBadge'

// ─── Types & Demo Data ────────────────────────────────────────────────────────

const GOLD = '#FFB81C'

type AchievementCategory = 'Builder' | 'Creator' | 'Social' | 'Streak'

interface Achievement {
  id: string
  icon: string
  name: string
  description: string
  xp: number
  unlocked: boolean
  unlockedDate?: string
  current?: number
  target?: number
  category: AchievementCategory
}

const ACHIEVEMENTS: Achievement[] = [
  // Builder
  { id: 'first_build',    icon: '🔨', name: 'First Build',       description: 'Complete your very first AI build',           xp: 50,  unlocked: true,  unlockedDate: '2026-03-01', category: 'Builder' },
  { id: 'speed_builder',  icon: '⚡', name: 'Speed Builder',      description: 'Complete 10 builds in a single day',          xp: 150, unlocked: false, current: 7,  target: 10, category: 'Builder' },
  { id: 'prolific',       icon: '🏭', name: 'Prolific',           description: 'Complete 100 total AI builds',                xp: 300, unlocked: false, current: 47, target: 100, category: 'Builder' },
  { id: 'terrain_master', icon: '🏔️', name: 'Terrain Master',     description: 'Generate 20 terrain builds',                  xp: 200, unlocked: true,  unlockedDate: '2026-03-15', category: 'Builder' },
  { id: 'scripter',       icon: '⚙️', name: 'Scripter',           description: 'Generate 15 Luau scripts with AI',            xp: 175, unlocked: false, current: 9,  target: 15, category: 'Builder' },
  { id: 'asset_hoarder',  icon: '📦', name: 'Asset Hoarder',      description: 'Generate 50 mesh or texture assets',          xp: 250, unlocked: false, current: 12, target: 50, category: 'Builder' },

  // Creator
  { id: 'publisher',      icon: '🚀', name: 'Publisher',          description: 'Publish your first asset to the marketplace', xp: 100, unlocked: false, current: 0, target: 1, category: 'Creator' },
  { id: 'market_maven',   icon: '🛒', name: 'Market Maven',       description: 'Purchase 5 marketplace assets',               xp: 100, unlocked: false, current: 2, target: 5, category: 'Creator' },
  { id: 'studio_link',    icon: '🔌', name: 'Studio Link',        description: 'Connect ForjeGames to Roblox Studio',         xp: 75,  unlocked: true,  unlockedDate: '2026-03-05', category: 'Creator' },
  { id: 'project_maker',  icon: '🗂️', name: 'Project Maker',      description: 'Create 5 distinct projects',                  xp: 125, unlocked: false, current: 3, target: 5, category: 'Creator' },

  // Social
  { id: 'social_start',   icon: '🤝', name: 'Social Starter',     description: 'Refer your first friend to ForjeGames',       xp: 150, unlocked: false, current: 0, target: 1, category: 'Social' },
  { id: 'influencer',     icon: '📣', name: 'Influencer',         description: 'Refer 5 friends who make a build',            xp: 400, unlocked: false, current: 0, target: 5, category: 'Social' },

  // Streak
  { id: 'streak_3',       icon: '🔥', name: 'Hot Streak',         description: 'Build 3 days in a row',                      xp: 75,  unlocked: true,  unlockedDate: '2026-03-20', category: 'Streak' },
  { id: 'streak_7',       icon: '🌟', name: 'Week Warrior',       description: 'Build 7 days in a row',                      xp: 150, unlocked: false, current: 7, target: 7, category: 'Streak' },
  { id: 'streak_14',      icon: '💎', name: 'On Fire',            description: 'Maintain a 14-day build streak',              xp: 300, unlocked: false, current: 7, target: 14, category: 'Streak' },
  { id: 'streak_30',      icon: '👑', name: 'Legend',             description: 'Maintain a 30-day build streak',              xp: 750, unlocked: false, current: 7, target: 30, category: 'Streak' },
]

const CATEGORY_META: Record<AchievementCategory, { icon: string; color: string }> = {
  Builder: { icon: '🔨', color: GOLD },
  Creator: { icon: '🎨', color: '#60A5FA' },
  Social:  { icon: '🤝', color: '#34D399' },
  Streak:  { icon: '🔥', color: '#F59E0B' },
}

const CATEGORIES: AchievementCategory[] = ['Builder', 'Creator', 'Social', 'Streak']

const DEMO_XP   = 850
const DEMO_TIER = 'APPRENTICE' as Tier

// ─── Achievement Card ─────────────────────────────────────────────────────────

function AchievementCard({ achievement }: { achievement: Achievement }) {
  const { unlocked, current, target, xp, icon, name, description, unlockedDate, category } = achievement
  const catColor = CATEGORY_META[category].color
  const pct = target ? Math.round(((current ?? 0) / target) * 100) : 0

  return (
    <div
      className="relative rounded-2xl border p-4 flex flex-col gap-3 transition-all duration-200"
      style={{
        background: unlocked ? '#141414' : '#0D0D0D',
        borderColor: unlocked ? `${catColor}30` : 'rgba(255,255,255,0.05)',
        boxShadow: unlocked ? `0 0 16px ${catColor}08` : 'none',
        opacity: unlocked ? 1 : 0.7,
      }}
    >
      {/* Lock overlay for locked achievements */}
      {!unlocked && (
        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-white/[0.08] flex items-center justify-center">
          <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
        style={{
          background: unlocked ? `${catColor}12` : 'rgba(255,255,255,0.04)',
          border: `1px solid ${unlocked ? `${catColor}25` : 'rgba(255,255,255,0.06)'}`,
          filter: unlocked ? 'none' : 'grayscale(0.8)',
        }}
      >
        {icon}
      </div>

      {/* Text */}
      <div className="flex-1">
        <p className={`text-sm font-bold leading-tight ${unlocked ? 'text-white' : 'text-gray-400'}`}>{name}</p>
        <p className="text-[11px] text-gray-600 mt-0.5 leading-snug line-clamp-2">{description}</p>
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
          <span className="text-[10px] text-gray-600">{unlockedDate}</span>
        )}
      </div>

      {/* Progress bar for in-progress */}
      {!unlocked && target && (
        <div>
          <div className="flex justify-between text-[10px] text-gray-600 mb-1">
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
          <span className="text-lg">{meta.icon}</span>
          <h2 className="text-sm font-bold text-white">{category}</h2>
        </div>
        <span className="text-xs text-gray-500">{unlocked}/{total} unlocked</span>
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

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Achievements</h1>
          <p className="text-gray-500 text-sm mt-1">{unlockedCount} of {total} unlocked &mdash; {(DEMO_XP + totalXp).toLocaleString()} XP total</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <p className="text-3xl font-black tabular-nums" style={{ color: GOLD }}>{progressPct}%</p>
            <p className="text-[11px] text-gray-600">complete</p>
          </div>
          <TierBadge tier={DEMO_TIER} size="md" />
        </div>
      </div>

      {/* ── Progress bar ─────────────────────────────────────────────────── */}
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

      {/* ── Stats strip ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {CATEGORIES.map((cat) => {
          const catAch = byCategory[cat]
          const catUnlocked = catAch.filter((a) => a.unlocked).length
          const meta = CATEGORY_META[cat]
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(activeCategory === cat ? 'All' : cat)}
              className="rounded-2xl border p-4 text-left transition-all duration-200 hover:scale-[1.02]"
              style={{
                background: activeCategory === cat || activeCategory === 'All' ? `${meta.color}08` : '#0D0D0D',
                borderColor: activeCategory === cat ? `${meta.color}40` : 'rgba(255,255,255,0.06)',
              }}
            >
              <span className="text-xl">{meta.icon}</span>
              <p className="text-sm font-bold text-white mt-2">{cat}</p>
              <p className="text-[11px] text-gray-500">{catUnlocked}/{catAch.length}</p>
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

      {/* ── Category tabs ────────────────────────────────────────────────── */}
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

      {/* ── Achievement grids ─────────────────────────────────────────────── */}
      {activeCategory === 'All' ? (
        <div className="space-y-10">
          {CATEGORIES.map((cat) => (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">{CATEGORY_META[cat].icon}</span>
                <h2 className="text-sm font-bold text-white">{cat}</h2>
                <span className="text-xs text-gray-600 ml-1">
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
