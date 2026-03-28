'use client'
import { useEffect, useState } from 'react'

interface AchievementUnlockEvent {
  name: string
  icon: string
  xpReward: number
}

// In-memory event bus for achievement unlocks
const listeners: Array<(e: AchievementUnlockEvent) => void> = []

export function notifyAchievementUnlock(event: AchievementUnlockEvent) {
  listeners.forEach(l => l(event))
}

export function AchievementToastProvider() {
  const [toasts, setToasts] = useState<Array<AchievementUnlockEvent & { id: number }>>([])

  useEffect(() => {
    let id = 0
    const handler = (e: AchievementUnlockEvent) => {
      const toastId = ++id
      setToasts(prev => [...prev, { ...e, id: toastId }])
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toastId))
      }, 5000)
    }
    listeners.push(handler)
    return () => {
      const idx = listeners.indexOf(handler)
      if (idx !== -1) listeners.splice(idx, 1)
    }
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className="bg-[#0D1231] border border-[#FFB81C]/40 rounded-xl px-5 py-4 flex items-center gap-3 shadow-lg shadow-black/40 animate-in slide-in-from-bottom-4"
          style={{ minWidth: 280 }}
        >
          <div className="text-3xl flex-shrink-0">{toast.icon}</div>
          <div>
            <p className="text-xs text-[#FFB81C] font-semibold uppercase tracking-wide">Achievement Unlocked!</p>
            <p className="text-white font-semibold text-sm mt-0.5">{toast.name}</p>
            {toast.xpReward > 0 && (
              <p className="text-xs text-gray-400 mt-0.5">+{toast.xpReward} XP earned</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
