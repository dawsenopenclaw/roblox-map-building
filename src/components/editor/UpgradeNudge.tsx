'use client'

import { useState } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { Zap, X } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then(r => r.ok ? r.json() : null)

/**
 * Subtle gold banner that appears when a free-tier user has used 80%+ of
 * their daily builds. Dismissible — stays dismissed for the rest of the day.
 */
export function UpgradeNudge() {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false
    const key = `forje-nudge-dismissed-${new Date().toISOString().slice(0, 10)}`
    return localStorage.getItem(key) === '1'
  })

  const { data } = useSWR<{ used: number; limit: number; tier: string }>(
    '/api/usage/daily',
    fetcher,
    { revalidateOnFocus: false, refreshInterval: 30_000 }
  )

  if (dismissed || !data) return null

  // Only show for free tier when 80%+ used
  const { used, limit, tier } = data
  if (tier !== 'FREE' && tier !== 'free') return null
  if (limit <= 0 || used / limit < 0.8) return null

  const remaining = Math.max(limit - used, 0)

  const handleDismiss = () => {
    setDismissed(true)
    const key = `forje-nudge-dismissed-${new Date().toISOString().slice(0, 10)}`
    localStorage.setItem(key, '1')
  }

  return (
    <div
      className="flex items-center gap-3 px-4 py-2 border-b border-[#D4AF37]/15 bg-gradient-to-r from-[#D4AF37]/8 via-[#D4AF37]/5 to-transparent"
      role="status"
    >
      <Zap className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0" />
      <p className="text-xs text-white/80 flex-1">
        {remaining === 0 ? (
          <>No builds left today. <Link href="/pricing" className="text-[#D4AF37] font-semibold hover:underline">Upgrade for unlimited</Link></>
        ) : (
          <>{remaining} build{remaining !== 1 ? 's' : ''} left today. <Link href="/pricing" className="text-[#D4AF37] font-semibold hover:underline">Upgrade for more</Link></>
        )}
      </p>
      <button
        onClick={handleDismiss}
        className="p-1 text-white/30 hover:text-white/60 transition-colors flex-shrink-0"
        aria-label="Dismiss"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  )
}
