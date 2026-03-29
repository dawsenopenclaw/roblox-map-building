'use client'

import { WifiOff, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'

interface CachedData {
  projects?: number
  lastSync?: string
}

export default function OfflinePage() {
  const [cachedData, setCachedData] = useState<CachedData | null>(null)
  const [queuedCount, setQueuedCount] = useState(0)
  const [retrying, setRetrying] = useState(false)

  useEffect(() => {
    // Load cached dashboard data from localStorage
    try {
      const raw = localStorage.getItem('ForjeGames-dashboard-cache')
      if (raw) setCachedData(JSON.parse(raw))
    } catch {
      // ignore parse errors
    }

    // Count queued builds from IndexedDB
    const req = indexedDB.open('ForjeGames-queue', 1)
    req.onsuccess = (e) => {
      const db = (e.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains('queue')) return
      const tx = db.transaction('queue', 'readonly')
      const store = tx.objectStore('queue')
      const countReq = store.count()
      countReq.onsuccess = () => setQueuedCount(countReq.result)
    }

    // Auto-retry when connection restores
    const handleOnline = () => {
      window.location.href = '/dashboard'
    }
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [])

  function handleRetry() {
    setRetrying(true)
    setTimeout(() => {
      window.location.href = '/dashboard'
    }, 800)
  }

  return (
    <div className="min-h-screen bg-[#0A0E27] flex flex-col items-center justify-center px-6 text-white overflow-hidden">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center">
        <div className="w-[450px] h-[450px] rounded-full bg-[#F5A623]/6 blur-[100px]" />
      </div>

      <div className="relative max-w-sm w-full text-center">

        {/* Icon */}
        <div className="mb-8 mx-auto relative w-24 h-24">
          <div className="absolute inset-0 rounded-full bg-[#F5A623]/8 animate-ping" style={{ animationDuration: '3s' }} />
          <div className="relative w-24 h-24 rounded-full bg-[#F5A623]/10 border border-[#F5A623]/20 flex items-center justify-center">
            <WifiOff className="w-10 h-10 text-[#F5A623]" strokeWidth={1.5} />
          </div>
        </div>

        {/* Text */}
        <h1 className="text-3xl font-bold mb-3 tracking-tight">You&apos;re offline</h1>
        <p className="text-white/50 text-sm mb-3 leading-relaxed">
          No internet connection detected. We&apos;ll reconnect you automatically when your network is back.
        </p>
        <p className="text-white/30 text-xs mb-8">
          Listening for connection…
        </p>

        {/* Queued builds badge */}
        {queuedCount > 0 && (
          <div className="mb-6 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F5A623]/10 border border-[#F5A623]/20 text-[#F5A623] text-sm font-medium">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            {queuedCount} build{queuedCount !== 1 ? 's' : ''} queued — will sync on reconnect
          </div>
        )}

        {/* Cached data card */}
        {cachedData && (
          <div className="mb-8 w-full rounded-2xl bg-white/5 border border-white/10 p-5">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-3 font-medium">
              Cached snapshot
            </p>
            {cachedData.projects !== undefined && (
              <div className="flex justify-between items-center text-sm mb-2.5">
                <span className="text-white/50">Projects saved</span>
                <span className="font-semibold text-white">{cachedData.projects}</span>
              </div>
            )}
            {cachedData.lastSync && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-white/50">Last synced</span>
                <span className="font-semibold text-white/80 tabular-nums">
                  {new Date(cachedData.lastSync).toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Retry button */}
        <button
          onClick={handleRetry}
          disabled={retrying}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#F5A623] hover:bg-[#E6951F] disabled:opacity-70 text-[#0A0E27] font-bold text-sm transition-all shadow-lg shadow-[#F5A623]/20 hover:shadow-[#F5A623]/30 hover:-translate-y-0.5"
        >
          <RefreshCw className={`w-4 h-4 ${retrying ? 'animate-spin' : ''}`} />
          {retrying ? 'Reconnecting…' : 'Try again'}
        </button>

      </div>
    </div>
  )
}
