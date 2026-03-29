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

  useEffect(() => {
    // Try to load cached dashboard data from localStorage
    try {
      const raw = localStorage.getItem('robloxforge-dashboard-cache')
      if (raw) {
        setCachedData(JSON.parse(raw))
      }
    } catch {
      // ignore parse errors
    }

    // Count queued builds from IndexedDB
    const req = indexedDB.open('robloxforge-queue', 1)
    req.onsuccess = (e) => {
      const db = (e.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains('queue')) return
      const tx = db.transaction('queue', 'readonly')
      const store = tx.objectStore('queue')
      const countReq = store.count()
      countReq.onsuccess = () => setQueuedCount(countReq.result)
    }
  }, [])

  function handleRetry() {
    window.location.href = '/dashboard'
  }

  return (
    <div className="min-h-screen bg-[#0A0E27] flex flex-col items-center justify-center px-6 text-white">
      {/* Icon */}
      <div className="mb-8 relative">
        <div className="w-24 h-24 rounded-full bg-[#F5A623]/10 flex items-center justify-center border border-[#F5A623]/20">
          <WifiOff className="w-10 h-10 text-[#F5A623]" strokeWidth={1.5} />
        </div>
        <div className="absolute inset-0 rounded-full bg-[#F5A623]/5 animate-ping" />
      </div>

      {/* Heading */}
      <h1 className="text-3xl font-bold mb-3 tracking-tight">
        You&apos;re offline
      </h1>
      <p className="text-white/50 text-center max-w-sm mb-10 leading-relaxed">
        No internet connection detected. Your queued builds will process
        automatically when you reconnect.
      </p>

      {/* Queued builds notice */}
      {queuedCount > 0 && (
        <div className="mb-8 px-5 py-3 rounded-xl bg-[#F5A623]/10 border border-[#F5A623]/20 text-[#F5A623] text-sm font-medium">
          {queuedCount} build{queuedCount !== 1 ? 's' : ''} queued — will sync
          on reconnect
        </div>
      )}

      {/* Cached data */}
      {cachedData && (
        <div className="mb-8 w-full max-w-sm rounded-2xl bg-white/5 border border-white/10 p-5">
          <p className="text-xs text-white/40 uppercase tracking-wider mb-3 font-medium">
            Cached Data
          </p>
          {cachedData.projects !== undefined && (
            <div className="flex justify-between text-sm mb-2">
              <span className="text-white/60">Projects</span>
              <span className="font-semibold">{cachedData.projects}</span>
            </div>
          )}
          {cachedData.lastSync && (
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Last synced</span>
              <span className="font-semibold text-white/80">
                {new Date(cachedData.lastSync).toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Retry button */}
      <button
        onClick={handleRetry}
        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#F5A623] text-[#0A0E27] font-semibold text-sm hover:bg-[#F5A623]/90 transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        Try again
      </button>
    </div>
  )
}
