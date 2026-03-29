'use client'
import { useEffect, useState } from 'react'
import { SilentBoundary } from './ErrorBoundary'

// Lazy import analytics so a missing posthog config never throws at module load
let _captureClientEvent: ((event: string, props: Record<string, unknown>) => void) | null = null
async function fireAnalytics(event: string, props: Record<string, unknown>) {
  try {
    if (!_captureClientEvent) {
      const mod = await import('@/lib/analytics-client')
      _captureClientEvent = mod.captureClientEvent as typeof _captureClientEvent
    }
    _captureClientEvent?.(event as Parameters<typeof _captureClientEvent>[0], props)
  } catch {
    // Analytics unavailable — never block achievement display
  }
}

interface AchievementUnlockEvent {
  name: string
  icon: string
  xpReward: number
  achievementId?: string
}

// In-memory event bus for achievement unlocks
const listeners: Array<(e: AchievementUnlockEvent) => void> = []

export function notifyAchievementUnlock(event: AchievementUnlockEvent) {
  // Fire analytics asynchronously — never throws, never blocks
  fireAnalytics('achievement_unlocked', {
    achievementId: event.achievementId ?? event.name,
    achievementName: event.name,
  })
  listeners.forEach(l => l(event))
}

function AchievementToastProviderInner() {
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
    // aria-live="assertive" interrupts the user to announce achievement unlocks
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none"
      aria-live="assertive"
      aria-atomic="false"
      role="status"
    >
      {toasts.map(toast => (
        <div
          key={toast.id}
          className="bg-[#141414] border border-[#FFB81C]/40 rounded-xl px-5 py-4 flex items-center gap-3 shadow-lg shadow-black/40 animate-in slide-in-from-bottom-4"
          style={{ minWidth: 280 }}
        >
          <div className="text-3xl flex-shrink-0" aria-hidden="true">{toast.icon}</div>
          <div>
            <p className="text-xs text-[#FFB81C] font-semibold uppercase tracking-wide">Achievement Unlocked!</p>
            <p className="text-white font-semibold text-sm mt-0.5">{toast.name}</p>
            {toast.xpReward > 0 && (
              <p className="text-xs text-gray-300 mt-0.5">+{toast.xpReward} XP earned</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Exported wrapper with silent error boundary ───────────────────────────────

export function AchievementToastProvider() {
  return (
    <SilentBoundary>
      <AchievementToastProviderInner />
    </SilentBoundary>
  )
}
