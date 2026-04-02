'use client'

import { useEffect, useState, useCallback } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────────

interface DailySpend {
  meshesGenerated:   number
  texturesGenerated: number
  buildsRun:         number
  totalCostUsd:      number
  tierLimit:         number   // -1 = unlimited
  percentUsed:       number
  warnThresholdHit:  boolean
  limitHit:          boolean
}

interface GenerationLimits {
  mesh: {
    allowed:   boolean
    remaining: number
    limit:     number
    resetsAt:  string
  }
  build: {
    allowed:   boolean
    remaining: number
    limit:     number
    resetsAt:  string
  }
  texture: {
    allowed:   boolean
    remaining: number
    limit:     number
    resetsAt:  string
  }
}

interface UsageData {
  spend:      DailySpend
  limits:     GenerationLimits
  tier:       string
  isStudio:   boolean
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function formatUsd(usd: number): string {
  return `$${usd.toFixed(3)}`
}

function useCountdown(resetsAtIso: string): string {
  const [remaining, setRemaining] = useState('')

  useEffect(() => {
    function compute() {
      const diff = new Date(resetsAtIso).getTime() - Date.now()
      if (diff <= 0) { setRemaining('00:00:00'); return }
      const h = Math.floor(diff / 3_600_000)
      const m = Math.floor((diff % 3_600_000) / 60_000)
      const s = Math.floor((diff % 60_000) / 1000)
      setRemaining(
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`,
      )
    }
    compute()
    const id = setInterval(compute, 1000)
    return () => clearInterval(id)
  }, [resetsAtIso])

  return remaining
}

// ── Sub-components ────────────────────────────────────────────────────────────

function UsageBar({
  label,
  used,
  limit,
  color = 'gold',
}: {
  label:  string
  used:   number
  limit:  number // -1 = unlimited
  color?: 'gold' | 'blue' | 'green'
}) {
  const isUnlimited = limit === -1
  const pct = isUnlimited ? 0 : clamp((used / limit) * 100, 0, 100)
  const isCritical = pct >= 100
  const isWarning  = pct >= 80 && !isCritical

  const barColor = isCritical
    ? 'bg-red-500'
    : isWarning
      ? 'bg-amber-400'
      : color === 'gold'
        ? 'bg-[#D4AF37]'
        : color === 'blue'
          ? 'bg-blue-500'
          : 'bg-emerald-500'

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-400">{label}</span>
        <span className={isCritical ? 'text-red-400 font-medium' : isWarning ? 'text-amber-400 font-medium' : 'text-gray-300'}>
          {isUnlimited ? (
            <span className="text-emerald-400">Unlimited</span>
          ) : (
            `${used} / ${limit}`
          )}
        </span>
      </div>
      {!isUnlimited && (
        <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  )
}

function SkeletonBar() {
  return (
    <div className="space-y-1">
      <div className="flex justify-between">
        <div className="h-3 w-20 rounded bg-gray-800 animate-pulse" />
        <div className="h-3 w-12 rounded bg-gray-800 animate-pulse" />
      </div>
      <div className="h-1.5 rounded-full bg-gray-800 animate-pulse" />
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export interface UsageDashboardProps {
  /** If provided, shows an upgrade CTA. Omit for embedded/minimal mode. */
  onUpgradeClick?: () => void
  /** Compact mode — no cost breakdown, smaller padding */
  compact?: boolean
}

export function UsageDashboard({ onUpgradeClick, compact = false }: UsageDashboardProps) {
  const [data, setData]         = useState<UsageData | null>(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const resetIso = data?.limits.mesh.resetsAt ?? new Date(Date.now() + 3_600_000).toISOString()
  const countdown = useCountdown(resetIso)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/dashboard/usage')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json() as UsageData
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load usage')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load, refreshKey])

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const id = setInterval(() => setRefreshKey((k) => k + 1), 60_000)
    return () => clearInterval(id)
  }, [])

  const tierLabel = data
    ? { FREE: 'Free', HOBBY: 'Hobby', CREATOR: 'Creator', STUDIO: 'Studio' }[data.tier] ?? data.tier
    : '—'

  const nearLimit  = data?.spend.warnThresholdHit && !data.spend.limitHit
  const hitLimit   = data?.spend.limitHit

  const pad = compact ? 'p-3' : 'p-4'

  return (
    <div className={`bg-gray-900 border border-gray-800 rounded-xl ${pad} space-y-4`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-[#D4AF37]">
            <rect x="1" y="10" width="3" height="5" rx="0.5" />
            <rect x="6" y="6"  width="3" height="9" rx="0.5" />
            <rect x="11" y="2" width="3" height="13" rx="0.5" />
          </svg>
          <span className="text-sm font-semibold text-white">Daily Usage</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-300 border border-gray-700">
            {tierLabel}
          </span>
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="p-1 rounded text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
            aria-label="Refresh usage"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
              <path d="M2 8a6 6 0 1 1 1.4 3.8" strokeLinecap="round" />
              <path d="M2 12V8h4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Limit hit banner */}
      {hitLimit && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-950/60 border border-red-800 text-xs text-red-300">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5 shrink-0">
            <circle cx="8" cy="8" r="6" />
            <path d="M8 5v3.5" strokeLinecap="round" />
            <circle cx="8" cy="11.5" r="0.5" fill="currentColor" />
          </svg>
          Daily limit reached. Resets in {countdown}.
        </div>
      )}

      {/* Warn banner */}
      {nearLimit && !hitLimit && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-950/60 border border-amber-800 text-xs text-amber-300">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5 shrink-0">
            <path d="M8 2L14 13H2L8 2z" strokeLinejoin="round" />
            <path d="M8 7v2.5" strokeLinecap="round" />
            <circle cx="8" cy="11.5" r="0.5" fill="currentColor" />
          </svg>
          Approaching daily limit — {Math.round(100 - (data?.spend.percentUsed ?? 0))}% remaining.
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <p className="text-xs text-red-400 text-center py-2">{error}</p>
      )}

      {/* Usage bars */}
      <div className="space-y-3">
        {loading ? (
          <>
            <SkeletonBar />
            <SkeletonBar />
            <SkeletonBar />
          </>
        ) : data ? (
          <>
            <UsageBar
              label="3D Meshes"
              used={data.spend.meshesGenerated}
              limit={data.limits.mesh.limit}
              color="gold"
            />
            <UsageBar
              label="Builds / Scans"
              used={data.spend.buildsRun}
              limit={data.limits.build.limit}
              color="blue"
            />
            <UsageBar
              label="Textures"
              used={data.spend.texturesGenerated}
              limit={data.limits.texture.limit}
              color="green"
            />
          </>
        ) : null}
      </div>

      {/* Cost breakdown — Studio tier only */}
      {data?.isStudio && !compact && (
        <div className="pt-1 border-t border-gray-800">
          <div className="text-xs text-gray-500 mb-2">Cost breakdown (today)</div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Meshes</span>
              <span className="text-gray-300">
                {formatUsd(data.spend.meshesGenerated * 0.03)}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Textures</span>
              <span className="text-gray-300">
                {formatUsd(data.spend.texturesGenerated * 0.08)}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">AI Inference</span>
              <span className="text-gray-300">
                {formatUsd(data.spend.totalCostUsd - (data.spend.meshesGenerated * 0.03) - (data.spend.texturesGenerated * 0.08))}
              </span>
            </div>
            <div className="flex justify-between text-xs pt-1 border-t border-gray-800">
              <span className="text-gray-300 font-medium">Total</span>
              <span className="text-[#D4AF37] font-medium">{formatUsd(data.spend.totalCostUsd)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Reset countdown + upgrade CTA */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
            <circle cx="8" cy="8" r="6" />
            <path d="M8 5v3l2 1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {loading ? '—' : `Resets in ${countdown}`}
        </div>

        {onUpgradeClick && data && !data.isStudio && (
          <button
            onClick={onUpgradeClick}
            className="text-xs px-2.5 py-1 rounded-lg bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/30 text-[#D4AF37] font-medium transition-colors"
          >
            Upgrade
          </button>
        )}
      </div>
    </div>
  )
}

export default UsageDashboard
