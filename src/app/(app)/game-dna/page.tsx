'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@clerk/nextjs'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ScanRecord {
  id: string
  robloxUrl: string
  gameName: string | null
  status: 'PENDING' | 'PROCESSING' | 'COMPLETE' | 'FAILED'
  errorMsg: string | null
  createdAt: string
}

// ─── Hardcoded example scans (always visible) ────────────────────────────────

interface ExampleScan {
  id: string
  name: string
  icon: string
  score: number
  monetization: number
  retention: number
  robloxUrl: string
}

const EXAMPLE_SCANS: ExampleScan[] = [
  {
    id: 'demo-pet-sim',
    name: 'Pet Simulator X',
    icon: '🐾',
    score: 92,
    monetization: 85,
    retention: 90,
    robloxUrl: 'https://www.roblox.com/games/6284583030/Pet-Simulator-X',
  },
  {
    id: 'demo-adopt-me',
    name: 'Adopt Me',
    icon: '🏠',
    score: 88,
    monetization: 75,
    retention: 92,
    robloxUrl: 'https://www.roblox.com/games/920587237/Adopt-Me',
  },
  {
    id: 'demo-bee-swarm',
    name: 'Bee Swarm Sim',
    icon: '🐝',
    score: 85,
    monetization: 65,
    retention: 80,
    robloxUrl: 'https://www.roblox.com/games/1537690962/Bee-Swarm-Simulator',
  },
]

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  PENDING:    { label: 'Pending',    color: 'text-yellow-400', bg: 'bg-yellow-400/10', dot: 'bg-yellow-400' },
  PROCESSING: { label: 'Scanning…',  color: 'text-blue-400',   bg: 'bg-blue-400/10',   dot: 'bg-blue-400 animate-pulse' },
  COMPLETE:   { label: 'Complete',   color: 'text-green-400',  bg: 'bg-green-400/10',  dot: 'bg-green-400' },
  FAILED:     { label: 'Failed',     color: 'text-red-400',    bg: 'bg-red-400/10',    dot: 'bg-red-400' },
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs text-gray-400 w-8 text-right">{value}%</span>
    </div>
  )
}

function ExampleScanCard({ scan }: { scan: ExampleScan }) {
  const scoreColor = scan.score >= 90 ? '#34D399' : scan.score >= 80 ? '#FFB81C' : '#60A5FA'

  return (
    <Link
      href={`/game-dna/${scan.id}`}
      className="block bg-[#0D1231] border border-white/10 rounded-xl px-5 py-4 hover:border-[#FFB81C]/30 hover:bg-[#0D1231]/80 transition-all group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-xl">{scan.icon}</span>
          <span className="text-white text-sm font-semibold">{scan.name}</span>
        </div>
        <div
          className="text-sm font-bold px-2 py-0.5 rounded-lg"
          style={{ color: scoreColor, backgroundColor: `${scoreColor}18` }}
        >
          {scan.score}/100
        </div>
      </div>

      <div className="space-y-2 mb-3">
        <div>
          <p className="text-xs text-gray-500 mb-1">Monetization</p>
          <ScoreBar value={scan.monetization} color="#FFB81C" />
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Retention</p>
          <ScoreBar value={scan.retention} color="#60A5FA" />
        </div>
      </div>

      <div className="flex justify-end">
        <span className="text-xs text-[#FFB81C] group-hover:underline">
          View Full Report →
        </span>
      </div>
    </Link>
  )
}

function ScanningAnimation() {
  return (
    <div className="flex flex-col items-center gap-4 py-6">
      <div className="relative w-16 h-20">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="absolute w-full" style={{ top: `${i * 16}px` }}>
            <div className="flex justify-between items-center">
              <span
                className="w-3 h-3 rounded-full bg-[#FFB81C]"
                style={{ animation: `dna-bounce 1s ease-in-out ${i * 0.1}s infinite alternate` }}
              />
              <div className="flex-1 h-px bg-white/20 mx-1" />
              <span
                className="w-3 h-3 rounded-full bg-blue-400"
                style={{ animation: `dna-bounce 1s ease-in-out ${i * 0.1 + 0.5}s infinite alternate` }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="text-sm text-gray-400 animate-pulse">Extracting game DNA…</p>
      <style>{`@keyframes dna-bounce { from { transform: translateY(0); } to { transform: translateY(-4px); } }`}</style>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function GameDnaPage() {
  const { getToken } = useAuth()
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [scans, setScans] = useState<ScanRecord[]>([])
  const [loadingScans, setLoadingScans] = useState(true)
  const [activeScanId, setActiveScanId] = useState<string | null>(null)
  const [apiAvailable, setApiAvailable] = useState(false)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

  const fetchScans = useCallback(async () => {
    try {
      const token = await getToken()
      const res = await fetch(`${apiUrl}/api/dna/scans`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        setApiAvailable(false)
        setScans([])
        return
      }
      setApiAvailable(true)
      const data = await res.json() as { scans: ScanRecord[] }
      setScans(data.scans)
    } catch {
      setApiAvailable(false)
      setScans([])
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

      if (!res.ok) {
        // API unavailable or auth issue — show demo prompt
        setError('API unavailable. View example scans below or sign up for API access.')
        return
      }

      const data = await res.json() as { scanId?: string; error?: string }
      if (data.error) {
        setError(data.error)
        return
      }

      setActiveScanId(data.scanId!)
      await fetchScans()
    } catch {
      setError('Backend unavailable. View the example scans below to see what a report looks like.')
    } finally {
      setLoading(false)
    }
  }

  function getDisplayName(scan: ScanRecord) {
    if (scan.gameName) return scan.gameName
    try {
      return new URL(scan.robloxUrl).pathname.split('/')[3]?.replace(/-/g, ' ') || 'Unknown Game'
    } catch {
      return 'Unknown Game'
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#FFB81C]/10 border border-[#FFB81C]/20 flex items-center justify-center text-xl flex-shrink-0">
          🧬
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Game DNA Scanner</h1>
          <p className="text-gray-400 text-sm">Analyze any Roblox game&apos;s formula</p>
        </div>
      </div>

      {/* Scan form */}
      <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-6">
        <form onSubmit={handleScan} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste a Roblox game URL..."
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

          <p className="text-xs text-gray-600">
            Paste any public Roblox game URL — e.g. https://www.roblox.com/games/123456/My-Game
          </p>

          {error && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <span className="text-red-400 text-sm flex-shrink-0">!</span>
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </form>

        {activeScanId && (
          <div className="mt-6 border-t border-white/5 pt-6">
            <ScanningAnimation />
            <p className="text-center text-xs text-gray-500">
              This takes 15–30 seconds — Claude is analyzing the game
            </p>
          </div>
        )}
      </div>

      {/* Compare shortcut */}
      <div className="flex justify-end">
        <Link
          href="/game-dna/compare"
          className="flex items-center gap-1.5 text-sm text-[#FFB81C] hover:text-[#E5A619] transition-colors"
        >
          Compare two games
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Real scans (only when API is live and has results) */}
      {apiAvailable && !loadingScans && scans.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Your Scans</h2>
          <div className="space-y-2">
            {scans.map((scan) => {
              const config = STATUS_CONFIG[scan.status]
              return (
                <div
                  key={scan.id}
                  className="bg-[#0D1231] border border-white/10 rounded-xl px-5 py-4 flex items-center justify-between hover:border-white/20 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${config.dot}`} />
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">{getDisplayName(scan)}</p>
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
        </div>
      )}

      {/* Example scans — always visible */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Example Scans</h2>
          <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded-lg">Demo data</span>
        </div>
        <div className="space-y-3">
          {EXAMPLE_SCANS.map((scan) => (
            <ExampleScanCard key={scan.id} scan={scan} />
          ))}
        </div>
      </div>
    </div>
  )
}
