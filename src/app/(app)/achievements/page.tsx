'use client'

import { useState } from 'react'
import { ACHIEVEMENTS } from '@/lib/achievements'

const CATEGORY_LABELS: Record<string, string> = {
  FIRST_STEPS: 'First Steps',
  VELOCITY: 'Velocity',
  MARKETPLACE: 'Marketplace',
  COMMUNITY: 'Community',
  QUALITY: 'Quality',
  EXPLORATION: 'Exploration',
}

const TABS = ['All', 'First Steps', 'Velocity', 'Marketplace', 'Community', 'Quality', 'Exploration']

export default function AchievementsPage() {
  const [activeTab, setActiveTab] = useState('All')

  const filtered =
    activeTab === 'All'
      ? ACHIEVEMENTS
      : ACHIEVEMENTS.filter(
          (a) => CATEGORY_LABELS[a.category as string] === activeTab
        )

  const total = ACHIEVEMENTS.length
  const unlocked = 0

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <h1 className="text-2xl font-bold text-white">Achievements</h1>
      <p className="text-gray-400 text-sm mt-1">
        {unlocked}/{total} unlocked
      </p>

      {/* Progress bar */}
      <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#FFB81C] rounded-full transition-all duration-700"
          style={{ width: `${total > 0 ? (unlocked / total) * 100 : 0}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-1">
        {total > 0 ? Math.round((unlocked / total) * 100) : 0}% complete
      </p>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mt-6 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-[#FFB81C] text-black'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {filtered.map((achievement) => (
          <div
            key={achievement.slug}
            className="bg-[#0D1231] border border-white/10 rounded-xl p-4 flex flex-col items-center text-center opacity-60"
          >
            <div className="text-4xl mb-3">{achievement.icon}</div>
            <p className="text-sm font-semibold text-gray-300 mb-1">
              {achievement.name}
            </p>
            <p className="text-xs text-gray-500 leading-snug mb-3">
              {achievement.description}
            </p>
            {achievement.xpReward > 0 && (
              <div className="inline-flex items-center gap-1 bg-[#FFB81C]/10 px-2 py-0.5 rounded-full mb-2">
                <span className="text-[11px] text-[#FFB81C] font-bold">
                  +{achievement.xpReward} XP
                </span>
              </div>
            )}
            <div className="mt-auto pt-2 flex items-center gap-1 text-gray-600 text-xs">
              <span>🔒</span>
              <span>Locked</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
