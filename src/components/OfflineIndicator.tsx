'use client'

import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false)
  const [visible, setVisible] = useState(false)
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    // Set initial state (avoid hydration mismatch — always start false, then sync)
    setIsOffline(!navigator.onLine)
    if (!navigator.onLine) setVisible(true)

    function handleOffline() {
      setIsOffline(true)
      setFadeOut(false)
      setVisible(true)
    }

    function handleOnline() {
      setIsOffline(false)
      // Brief "back online" flash, then fade out
      setFadeOut(true)
      setTimeout(() => setVisible(false), 2000)
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)
    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  if (!visible) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className={`
        fixed top-0 left-0 right-0 z-[9999]
        flex items-center justify-center gap-2
        px-4 py-2.5 text-sm font-medium
        transition-all duration-500
        ${
          isOffline
            ? 'bg-amber-500/15 border-b border-amber-500/30 text-amber-400'
            : 'bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-400'
        }
        ${fadeOut ? 'opacity-0 -translate-y-full' : 'opacity-100 translate-y-0'}
      `}
    >
      {isOffline ? (
        <>
          <WifiOff className="w-4 h-4 flex-shrink-0" />
          <span>
            You&apos;re offline &mdash; changes will sync when connected
          </span>
        </>
      ) : (
        <span>Back online — syncing changes</span>
      )}
    </div>
  )
}
