'use client'

import { useState, useEffect, useCallback } from 'react'

// ---- Types -----------------------------------------------------------------

interface AchievementNotification {
  id: string
  slug: string
  name: string
  icon: string
  xpReward: number
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary'
}

// ---- Constants -------------------------------------------------------------

const RARITY_COLORS: Record<string, string> = {
  Common: '#71717A',
  Rare: '#60A5FA',
  Epic: '#A855F7',
  Legendary: '#D4AF37',
}

const AUTO_DISMISS_MS = 5000

// ---- Singleton event bus ---------------------------------------------------
// Other components call showAchievementToast() to trigger the notification.

type Listener = (achievement: AchievementNotification) => void
const listeners: Set<Listener> = new Set()

export function showAchievementToast(
  achievement: Omit<AchievementNotification, 'id'>
) {
  const notification: AchievementNotification = {
    ...achievement,
    id: `${achievement.slug}-${Date.now()}`,
  }
  listeners.forEach((fn) => fn(notification))
}

// ---- Check Icon SVG --------------------------------------------------------

function CheckCircle({ color }: { color: string }) {
  return (
    <svg
      className="w-5 h-5 flex-shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5" />
      <path
        d="M8 12l3 3 5-5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ---- Toast Item ------------------------------------------------------------

function ToastItem({
  achievement,
  onDismiss,
}: {
  achievement: AchievementNotification
  onDismiss: (id: string) => void
}) {
  const [visible, setVisible] = useState(false)
  const [exiting, setExiting] = useState(false)
  const rarityColor = RARITY_COLORS[achievement.rarity]

  useEffect(() => {
    // Enter animation
    const enterTimer = setTimeout(() => setVisible(true), 20)

    // Auto-dismiss
    const dismissTimer = setTimeout(() => {
      setExiting(true)
      setTimeout(() => onDismiss(achievement.id), 300)
    }, AUTO_DISMISS_MS)

    return () => {
      clearTimeout(enterTimer)
      clearTimeout(dismissTimer)
    }
  }, [achievement.id, onDismiss])

  return (
    <div
      className="pointer-events-auto"
      style={{
        transform: visible && !exiting
          ? 'translateX(0)'
          : 'translateX(120%)',
        opacity: visible && !exiting ? 1 : 0,
        transition: 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s ease',
      }}
    >
      <div
        className="rounded-xl border p-4 flex items-center gap-3 min-w-[280px] max-w-[360px]"
        style={{
          background: 'rgba(10, 14, 32, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderColor: `${rarityColor}40`,
          boxShadow: `0 0 30px ${rarityColor}15, 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)`,
        }}
      >
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
          style={{
            background: `${rarityColor}15`,
            border: `1px solid ${rarityColor}30`,
          }}
        >
          {achievement.icon}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <CheckCircle color={rarityColor} />
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: rarityColor }}>
              Achievement Unlocked
            </p>
          </div>
          <p className="text-sm font-bold text-white mt-0.5 truncate">
            {achievement.name}
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">
            +{achievement.xpReward} XP
          </p>
        </div>

        {/* Dismiss */}
        <button
          onClick={() => {
            setExiting(true)
            setTimeout(() => onDismiss(achievement.id), 300)
          }}
          className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors flex-shrink-0"
          aria-label="Dismiss"
        >
          <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// ---- Provider / Container --------------------------------------------------

export function AchievementToastContainer() {
  const [toasts, setToasts] = useState<AchievementNotification[]>([])

  const handleDismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  useEffect(() => {
    const listener: Listener = (achievement) => {
      setToasts((prev) => [...prev.slice(-2), achievement]) // max 3 visible
    }
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])

  if (toasts.length === 0) return null

  return (
    <div
      className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none"
      role="status"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} achievement={t} onDismiss={handleDismiss} />
      ))}
    </div>
  )
}
