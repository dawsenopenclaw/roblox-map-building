'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

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

    // Auto-redirect when connection restores
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
    <div className="min-h-screen bg-[#050810] flex flex-col items-center justify-center px-6 overflow-hidden">
      {/* Radial glow */}
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center">
        <div className="w-[500px] h-[500px] rounded-full bg-[#7C3AED]/8 blur-[120px]" />
      </div>

      <div className="relative max-w-sm w-full text-center">

        {/* Icon */}
        <div className="mx-auto mb-7 relative w-20 h-20">
          <div className="absolute inset-0 rounded-full bg-[#7C3AED]/10 animate-ping" style={{ animationDuration: '3s' }} />
          <div className="relative w-20 h-20 rounded-full bg-[#7C3AED]/10 border border-[#7C3AED]/20 flex items-center justify-center">
            <svg
              className="w-9 h-9 text-[#7C3AED]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 0 1 1.06 0Z" />
              <line x1="3" y1="3" x2="21" y2="21" strokeWidth={1.5} />
            </svg>
          </div>
        </div>

        <div className="bg-white/[0.025] border border-white/[0.07] rounded-2xl p-8 shadow-2xl backdrop-blur-sm">

          <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">You&apos;re Offline</h1>
          <p className="text-gray-400 text-sm leading-relaxed mb-2">
            No internet connection detected. We&apos;ll redirect you automatically when your network is back.
          </p>
          <p className="text-gray-600 text-xs mb-7">Listening for connection...</p>

          {/* Queued builds badge */}
          {queuedCount > 0 && (
            <div className="mb-6 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#7C3AED]/10 border border-[#7C3AED]/20 text-[#7C3AED] text-sm font-medium">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              {queuedCount} build{queuedCount !== 1 ? 's' : ''} queued — will sync on reconnect
            </div>
          )}

          {/* Cached data card */}
          {cachedData && (
            <div className="mb-7 w-full rounded-xl bg-white/[0.03] border border-white/[0.07] p-5 text-left">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 font-medium">Cached snapshot</p>
              {cachedData.projects !== undefined && (
                <div className="flex justify-between items-center text-sm mb-2.5">
                  <span className="text-gray-500">Projects saved</span>
                  <span className="font-semibold text-white">{cachedData.projects}</span>
                </div>
              )}
              {cachedData.lastSync && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Last synced</span>
                  <span className="font-semibold text-gray-300 tabular-nums">
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
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-black font-bold text-sm transition-all shadow-lg shadow-[#7C3AED]/25 hover:shadow-[#7C3AED]/40 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #6366F1 100%)' }}
          >
            <svg
              className={`w-4 h-4 ${retrying ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            {retrying ? 'Reconnecting...' : 'Try again'}
          </button>

        </div>

        {/* Branding */}
        <p className="mt-6 text-xs text-gray-500">
          <Link href="/" className="hover:text-[#D4AF37] transition-colors font-medium">ForjeGames</Link>
          {' '}— AI-powered Roblox game builder
        </p>
      </div>
    </div>
  )
}
