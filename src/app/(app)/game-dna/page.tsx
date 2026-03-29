'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@clerk/nextjs'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface ScanRecord {
  id: string
  robloxUrl: string
  gameName: string | null
  status: 'PENDING' | 'PROCESSING' | 'COMPLETE' | 'FAILED'
  errorMsg: string | null
  createdAt: string
}

const STATUS_CONFIG = {
  PENDING:    { label: 'Pending',    color: 'text-yellow-400', bg: 'bg-yellow-400/10', dot: 'bg-yellow-400' },
  PROCESSING: { label: 'Scanning…', color: 'text-blue-400',   bg: 'bg-blue-400/10',   dot: 'bg-blue-400 animate-pulse' },
  COMPLETE:   { label: 'Complete',   color: 'text-green-400',  bg: 'bg-green-400/10',  dot: 'bg-green-400' },
  FAILED:     { label: 'Failed',     color: 'text-red-400',    bg: 'bg-red-400/10',    dot: 'bg-red-400' },
}

// Demo scans shown when API is unavailable
const DEMO_SCANS: ScanRecord[] = [
  {
    id: 'demo-a',
    robloxUrl: 'https://www.roblox.com/games/920587237/Adopt-Me',
    gameName: 'Adopt Me! (Demo)',
    status: 'COMPLETE',
    errorMsg: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: 'demo-b',
    robloxUrl: 'https://www.roblox.com/games/6284583030/Pet-Simulator-X',
    gameName: 'Pet Simulator X (Demo)',
    status: 'COMPLETE',
    errorMsg: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
]

function ScanningAnimation() {
  return (
    <div className="flex flex-col items-center gap-4 py-6">
      {/* DNA helix animation */}
      <div className="relative w-16 h-20">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="absolute w-full" style={{ top: `${i * 16}px` }}>
            <div className="flex justify-between items-center">
              <span
                className="w-3 h-3 rounded-full bg-[#FFB81C]"
                style={{ animation: `bounce 1s ease-in-out ${i * 0.1}s infinite alternate` }}
              />
              <div className="flex-1 h-px bg-white/20 mx-1" />
              <span
                className="w-3 h-3 rounded-full bg-blue-400"
                style={{ animation: `bounce 1s ease-in-out ${i * 0.1 + 0.5}s infinite alternate` }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="text-sm text-gray-400 animate-pulse">Extracting game DNA…</p>
      <style>{`@keyframes bounce { from { transform: translateY(0); } to { transform: translateY(-4px); } }`}</style>
    </div>
  )
}

export default function GameDnaPage() {
  const { getToken } = useAuth()
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [scans, setScans] = useState<ScanRecord[]>([])
  const [loadingScans, setLoadingScans] = useState(true)
  const [activeScanId, setActiveScanId] = useState<string | null>(null)
  const [isDemo, setIsDemo] = useState(false)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

  const fetchScans = useCallback(async () => {
    try {
      const token = await getToken()
      const res = await fetch(`${apiUrl}/api/dna/scans`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        setIsDemo(true)
        setScans(DEMO_SCANS)
        return
      }
      const data = await res.json() as { scans: ScanRecord[] }
      if (data.scans.length === 0) {
        // No scans yet — stay empty (not demo mode), let user submit their first scan
        setScans([])
      } else {
        setScans(data.scans)
      }
    } catch {
      // Network unavailable — show demo scans so the list isn't blank
      setIsDemo(true)
      setScans(DEMO_SCANS)
    } finally {
      setLoadingScans(false)
    }
  }, [apiUrl, getToken])

  useEffect(() => {
    fetchScans()
  }, [fetchScans])

  // Poll for active scan completion
  useEffect(() => {
    if (!activeScanId) return

    const interval = setInterval(async () => {
      try {
        const token = await getToken()
        const res = await fetch(`${apiUrl}/api/dna/${activeScanId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) return
        const data = await res.json() as { scan: ScanRecord }
        if (data.scan.status === 'COMPLETE') {
          clearInterval(interval)
          setActiveScanId(null)
          router.push(`/game-dna/${activeScanId}`)
        } else if (data.scan.status === 'FAILED') {
          clearInterval(interval)
          setActiveScanId(null)
          setError(data.scan.errorMsg || 'Scan failed. Please try again.')
          fetchScans()
        }
      } catch {
        // ignore polling errors
      }
    }, 2500)

    return () => clearInterval(interval)
  }, [activeScanId, apiUrl, getToken, router, fetchScans])

  async function handleScan(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim()) return

    setError('')
    setLoading(true)

    try {
      const token = await getToken()
      const res = await fetch(`${apiUrl}/api/dna/scan`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url.trim() }),
      })

      const data = await res.json() as { scanId?: string; error?: string }

      if (!res.ok) {
        setError(data.error || 'Failed to start scan')
        return
      }

      setActiveScanId(data.scanId!)
      await fetchScans()
    } catch {
      setError('Backend unavailable. Start the API server and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#FFB81C]/10 border border-[#FFB81C]/20 flex items-center justify-center text-xl">
            🧬
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Game DNA Scanner</h1>
            <p className="text-gray-400 text-sm">Analyze any Roblox game's genetic blueprint</p>
          </div>
        </div>
      </div>

      {/* Demo banner */}
      {isDemo && (
        <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3">
          <span className="text-yellow-400 text-sm">Demo</span>
          <p className="text-yellow-400/80 text-sm">
            API unavailable — showing sample data. Start the backend to scan real games.
          </p>
        </div>
      )}

      {/* Scan form */}
      <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-6">
        <form onSubmit={handleScan} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Roblox Game URL
            </label>
            <div className="flex gap-3">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.roblox.com/games/123456789/Game-Name"
                className="flex-1 bg-[#111640] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#FFB81C]/40 focus:ring-1 focus:ring-[#FFB81C]/20 transition-colors"
                disabled={loading || !!activeScanId}
              />
              <button
                type="submit"
                disabled={loading || !!activeScanId || !url.trim()}
                className="bg-[#FFB81C] hover:bg-[#E5A619] disabled:bg-[#FFB81C]/30 disabled:cursor-not-allowed text-black font-semibold px-6 py-3 rounded-xl transition-colors text-sm whitespace-nowrap"
              >
                {loading ? 'Starting…' : 'Scan'}
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Paste any Roblox game URL — public games only
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <span className="text-red-400 text-sm">⚠</span>
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </form>

        {/* Active scan animation */}
        {activeScanId && (
          <div className="mt-6 border-t border-white/5 pt-6">
            <ScanningAnimation />
            <p className="text-center text-xs text-gray-500">
              This takes 15-30 seconds — Claude is analyzing the game
            </p>
          </div>
        )}
      </div>

      {/* Compare shortcut */}
      <div className="flex justify-end">
        <Link
          href="/game-dna/compare"
          className="flex items-center gap-2 text-sm text-[#FFB81C] hover:text-[#E5A619] transition-colors"
        >
          <span>Compare two games</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Recent scans */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Recent Scans</h2>

        {loadingScans ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-[#0D1231] border border-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : scans.length === 0 ? (
          <div className="bg-[#0D1231] border border-dashed border-white/10 rounded-2xl p-10 text-center">
            <div className="text-4xl mb-3">🧬</div>
            <p className="text-gray-400 text-sm">No scans yet. Paste a Roblox game URL above to start.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {scans.map((scan) => {
              const config = STATUS_CONFIG[scan.status]
              let displayName = scan.gameName
              if (!displayName) {
                try {
                  displayName = new URL(scan.robloxUrl).pathname.split('/')[3]?.replace(/-/g, ' ') || 'Unknown Game'
                } catch {
                  displayName = 'Unknown Game'
                }
              }
              return (
                <div
                  key={scan.id}
                  className="bg-[#0D1231] border border-white/10 rounded-xl px-5 py-4 flex items-center justify-between hover:border-white/20 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${config.dot}`} />
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">{displayName}</p>
                      <p className="text-gray-600 text-xs truncate max-w-xs">{scan.robloxUrl}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>
                      {config.label}
                    </span>
                    {scan.status === 'COMPLETE' && (
                      <Link
                        href={`/game-dna/${scan.id}`}
                        className="text-xs text-[#FFB81C] hover:text-[#E5A619] transition-colors group-hover:underline"
                      >
                        View report →
                      </Link>
                    )}
                    {scan.status === 'FAILED' && scan.errorMsg && (
                      <span className="text-xs text-red-400 max-w-32 truncate" title={scan.errorMsg}>
                        {scan.errorMsg}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
