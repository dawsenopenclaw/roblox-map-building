'use client'

import { useEffect } from 'react'
import useSWR from 'swr'
import Link from 'next/link'

// ---- Types -----------------------------------------------------------------

interface StreakData {
  loginStreak: number
  buildStreak: number
  longestLoginStreak: number
  longestBuildStreak: number
  totalLogins: number
  totalBuilds: number
  demo?: boolean
}

// ---- Constants -------------------------------------------------------------

const MILESTONES = [3, 7, 14, 30, 60, 90, 180, 365]
const AMBER = '#F59E0B'
const AMBER_DARK = '#B45309'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function nextMilestone(current: number): number {
  for (const m of MILESTONES) {
    if (current < m) return m
  }
  return current + 30
}

// ---- Fire SVG (no emoji) ---------------------------------------------------

function FireIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z"
      />
    </svg>
  )
}

// ---- Component -------------------------------------------------------------

export function StreakBanner({ compact = false }: { compact?: boolean }) {
  const { data, mutate } = useSWR<StreakData>(
    '/api/gamification/streak',
    fetcher,
    { refreshInterval: 120000, revalidateOnFocus: true }
  )

  // Bump login streak on mount (fire-and-forget)
  useEffect(() => {
    fetch('/api/gamification/streak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'login' }),
    })
      .then((r) => {
        if (r.ok) mutate()
      })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const streak = data?.loginStreak ?? 0
  const longest = data?.longestLoginStreak ?? 0
  const target = nextMilestone(streak)
  const progress = streak > 0 ? Math.min((streak / target) * 100, 100) : 0

  if (compact) {
    return (
      <Link
        href="/achievements"
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-200 hover:border-amber-500/40"
        style={{
          background: streak > 0 ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.04)',
          borderColor: streak > 0 ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.08)',
        }}
      >
        <span style={{ color: streak > 0 ? AMBER : '#6b7280' }}>
          <FireIcon className="w-4 h-4" />
        </span>
        <span
          className="text-xs font-bold tabular-nums"
          style={{ color: streak > 0 ? AMBER : '#6b7280' }}
        >
          {streak > 0 ? `Day ${streak}` : 'No streak'}
        </span>
        {streak > 0 && (
          <div className="w-12 h-1 rounded-full bg-white/[0.08] overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${AMBER_DARK}, ${AMBER})`,
              }}
            />
          </div>
        )}
      </Link>
    )
  }

  return (
    <div
      className="rounded-xl border p-4 transition-all duration-200"
      style={{
        background: streak > 0
          ? 'rgba(245,158,11,0.06)'
          : 'rgba(10,14,32,0.6)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderColor: streak > 0
          ? 'rgba(245,158,11,0.2)'
          : 'rgba(255,255,255,0.06)',
        boxShadow: streak > 0
          ? '0 0 20px rgba(245,158,11,0.06), inset 0 1px 0 rgba(255,255,255,0.04)'
          : 'inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: streak > 0 ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.06)',
              color: streak > 0 ? AMBER : '#6b7280',
            }}
          >
            <FireIcon className="w-4.5 h-4.5" />
          </div>
          <div>
            {streak > 0 ? (
              <p className="text-sm font-bold" style={{ color: AMBER }}>
                Day {streak}
              </p>
            ) : (
              <p className="text-sm font-bold text-gray-400">No streak yet</p>
            )}
            <p className="text-[10px] text-gray-500">
              {streak > 0
                ? `Best: ${longest} days`
                : 'Start your streak. Build something today.'}
            </p>
          </div>
        </div>
        {streak > 0 && (
          <span className="text-[10px] text-gray-500 tabular-nums">
            {streak}/{target}
          </span>
        )}
      </div>

      {/* Progress bar to next milestone */}
      <div className="h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${progress}%`,
            background: `linear-gradient(90deg, ${AMBER_DARK}, ${AMBER})`,
            boxShadow: progress > 10 ? `0 0 6px rgba(245,158,11,0.4)` : 'none',
          }}
        />
      </div>

      {/* Milestone markers */}
      {streak > 0 && (
        <div className="flex items-center justify-between mt-2">
          {MILESTONES.filter((m) => m <= target * 1.5 && m >= streak * 0.3)
            .slice(0, 5)
            .map((m) => (
              <span
                key={m}
                className="text-[9px] tabular-nums"
                style={{
                  color: streak >= m ? AMBER : '#4b5563',
                  fontWeight: streak >= m ? 700 : 400,
                }}
              >
                {m}d
              </span>
            ))}
        </div>
      )}
    </div>
  )
}
