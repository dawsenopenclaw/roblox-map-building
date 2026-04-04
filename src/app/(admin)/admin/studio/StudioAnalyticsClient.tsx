'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { RefreshCw, Wifi, Download, Zap, Clock, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface SessionRow {
  sessionId: string
  placeName: string
  placeId: string
  pluginVersion: string
  connected: boolean
  lastHeartbeat: number
  queueDepth: number
}

interface MetricsData {
  activeSessions: number
  totalDownloads: number
  cmdsLastHour: number
  avgSyncLatencyMs: number
  redisOk: boolean
  timestamp: number
  connectionsByHour: { hour: string; count: number }[]
  versionDistribution: Record<string, number>
  commandsByType: Record<string, number>
  errorRate: number
}

// ─── Demo data ───────────────────────────────────────────────────────────────

function makeDemoMetrics(): MetricsData {
  const now = new Date()
  const connectionsByHour = Array.from({ length: 24 }, (_, i) => {
    const d = new Date(now.getTime() - (23 - i) * 3_600_000)
    const y  = d.getUTCFullYear()
    const mo = String(d.getUTCMonth() + 1).padStart(2, '0')
    const dd = String(d.getUTCDate()).padStart(2, '0')
    const h  = String(d.getUTCHours()).padStart(2, '0')
    return {
      hour: `${y}-${mo}-${dd}-${h}`,
      count: Math.floor(Math.random() * 12 + (i > 6 && i < 20 ? 8 : 1)),
    }
  })
  return {
    activeSessions: 7,
    totalDownloads: 1432,
    cmdsLastHour: 284,
    avgSyncLatencyMs: 38,
    redisOk: true,
    timestamp: Date.now(),
    connectionsByHour,
    versionDistribution: { '4.4.0': 5, '4.3.0': 2, '4.2.0': 1 },
    commandsByType: {
      execute_luau: 140,
      insert_asset: 62,
      update_property: 48,
      insert_model: 22,
      delete_model: 8,
      scan_workspace: 4,
    },
    errorRate: 0.032,
  }
}

function makeDemoSessions(): SessionRow[] {
  const now = Date.now()
  return [
    { sessionId: 'abc123xyz789def', placeName: 'Flip or Flop City', placeId: '112233445', pluginVersion: '4.4.0', connected: true,  lastHeartbeat: now - 5_000,    queueDepth: 2 },
    { sessionId: 'def456uvw012ghi', placeName: 'Brainrot Empire',    placeId: '998877665', pluginVersion: '4.4.0', connected: true,  lastHeartbeat: now - 18_000,   queueDepth: 0 },
    { sessionId: 'ghi789rst345jkl', placeName: 'Game Factory',       placeId: '556677889', pluginVersion: '4.3.0', connected: true,  lastHeartbeat: now - 55_000,   queueDepth: 0 },
    { sessionId: 'jkl012opq678mno', placeName: 'Aura Clash Test',    placeId: '334455667', pluginVersion: '4.2.0', connected: false, lastHeartbeat: now - 145_000,  queueDepth: 1 },
    { sessionId: 'mno345lmn901pqr', placeName: 'Dev Sandbox',        placeId: '112233000', pluginVersion: '4.3.0', connected: true,  lastHeartbeat: now - 90_000,   queueDepth: 0 },
  ]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(ms: number): string {
  const diff = Date.now() - ms
  const s = Math.floor(diff / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  return `${Math.floor(m / 60)}h ago`
}

function sessionStatus(session: SessionRow): 'active' | 'stale' | 'dead' {
  const age = Date.now() - session.lastHeartbeat
  if (!session.connected || age > 120_000) return 'dead'
  if (age > 30_000) return 'stale'
  return 'active'
}

const STATUS_STYLES = {
  active: { dot: 'bg-emerald-400', text: 'text-emerald-400', label: 'Active' },
  stale:  { dot: 'bg-amber-400',   text: 'text-amber-400',   label: 'Stale'  },
  dead:   { dot: 'bg-red-500',     text: 'text-red-400',     label: 'Dead'   },
}

function truncateId(id: string): string {
  return id.length > 12 ? `${id.slice(0, 6)}…${id.slice(-4)}` : id
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({ title, value, sub, icon, accent = false }: {
  title: string
  value: string
  sub?: string
  icon: React.ReactNode
  accent?: boolean
}) {
  return (
    <div className={`bg-[#111111] border rounded-xl p-5 ${accent ? 'border-[#c9a227]/30' : 'border-white/[0.06]'}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${accent ? 'bg-[#c9a227]/15' : 'bg-white/5'}`}>
          <span className={accent ? 'text-[#c9a227]' : 'text-gray-400'}>{icon}</span>
        </div>
      </div>
      <p className="text-2xl font-bold text-white font-mono tracking-tight">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{title}</p>
      {sub && <p className="text-[10px] text-gray-600 mt-0.5">{sub}</p>}
    </div>
  )
}

function ConnectionChart({ data }: { data: { hour: string; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1)
  const now = new Date()
  const currentHour = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}-${String(now.getUTCHours()).padStart(2, '0')}`

  return (
    <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Connection History</h3>
          <p className="text-xs text-gray-500">Active connections — last 24 hours</p>
        </div>
        <span className="text-xs text-gray-600 font-mono">
          peak {Math.max(...data.map((d) => d.count))}
        </span>
      </div>
      <div className="flex items-end gap-[3px] h-32">
        {data.map((point, i) => {
          const isCurrentHour = point.hour === currentHour
          const heightPct = Math.max((point.count / max) * 100, point.count > 0 ? 4 : 1)
          return (
            <div
              key={i}
              className="flex-1 flex items-end"
              style={{ height: '100%' }}
              title={`${point.hour.slice(-5).replace('-', ':')}h — ${point.count} connections`}
            >
              <div
                className="w-full rounded-t-[2px] transition-all"
                style={{
                  height: `${heightPct}%`,
                  background: isCurrentHour
                    ? '#c9a227'
                    : point.count > 0
                      ? 'rgba(201,162,39,0.35)'
                      : 'rgba(255,255,255,0.04)',
                }}
              />
            </div>
          )
        })}
      </div>
      <div className="flex justify-between mt-2 text-[10px] text-gray-600 font-mono">
        <span>{data[0]?.hour.slice(-5).replace('-', ':') ?? ''}h</span>
        <span>now</span>
      </div>
    </div>
  )
}

function VersionPie({ dist }: { dist: Record<string, number> }) {
  const entries = Object.entries(dist).sort((a, b) => b[1] - a[1])
  const total   = entries.reduce((s, [, n]) => s + n, 0)
  const COLORS   = ['#c9a227', '#22C55E', '#60A5FA', '#A78BFA', '#F472B6']
  const LATEST   = entries[0]?.[0] ?? ''

  if (total === 0) {
    return (
      <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-5 flex items-center justify-center min-h-[140px]">
        <p className="text-xs text-gray-600">No version data</p>
      </div>
    )
  }

  return (
    <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-5">
      <h3 className="text-sm font-semibold text-white mb-4">Plugin Versions</h3>
      <div className="space-y-2.5">
        {entries.map(([ver, count], i) => {
          const pct = total > 0 ? Math.round((count / total) * 100) : 0
          const isOutdated = ver !== LATEST
          return (
            <div key={ver} className="flex items-center gap-3">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: COLORS[i % COLORS.length] }}
              />
              <div className="flex-1 bg-white/5 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }}
                />
              </div>
              <span className={`text-xs font-mono w-12 text-right ${isOutdated ? 'text-red-400' : 'text-gray-300'}`}>
                {ver}
              </span>
              <span className="text-[10px] text-gray-500 w-8 text-right font-mono">{pct}%</span>
              {isOutdated && <AlertTriangle size={11} className="text-red-400 flex-shrink-0" />}
            </div>
          )
        })}
      </div>
      <p className="text-[10px] text-gray-600 mt-3">{total} total active sessions tracked</p>
    </div>
  )
}

function CommandStats({ byType, errorRate }: { byType: Record<string, number>; errorRate: number }) {
  const entries = Object.entries(byType).sort((a, b) => b[1] - a[1])
  const max     = Math.max(...entries.map(([, n]) => n), 1)

  const CMD_COLORS: Record<string, string> = {
    execute_luau:    '#c9a227',
    insert_asset:    '#22C55E',
    update_property: '#60A5FA',
    insert_model:    '#A78BFA',
    delete_model:    '#F87171',
    scan_workspace:  '#94A3B8',
  }

  return (
    <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">Command Breakdown</h3>
        <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${
          errorRate > 0.1 ? 'bg-red-500/10 text-red-400' :
          errorRate > 0.03 ? 'bg-amber-500/10 text-amber-400' :
          'bg-emerald-500/10 text-emerald-400'
        }`}>
          {(errorRate * 100).toFixed(1)}% errors
        </span>
      </div>
      {entries.length === 0 ? (
        <p className="text-xs text-gray-600 py-4">No command data</p>
      ) : (
        <div className="space-y-2.5">
          {entries.map(([type, count]) => (
            <div key={type} className="flex items-center gap-3">
              <span className="text-[10px] text-gray-500 font-mono w-28 flex-shrink-0 truncate">{type}</span>
              <div className="flex-1 bg-white/5 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(count / max) * 100}%`,
                    background: CMD_COLORS[type] ?? '#71717A',
                  }}
                />
              </div>
              <span className="text-xs font-mono text-gray-300 w-10 text-right">{count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SessionRow({ session }: { session: SessionRow }) {
  const [expanded, setExpanded] = useState(false)
  const status = sessionStatus(session)
  const style  = STATUS_STYLES[status]

  return (
    <div className="border-b border-white/[0.04] last:border-0">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors text-left"
      >
        {/* Status dot */}
        <span className="relative flex-shrink-0">
          <span className={`w-2 h-2 rounded-full inline-block ${style.dot}`} />
          {status === 'active' && (
            <span className={`absolute inset-0 rounded-full animate-ping ${style.dot} opacity-40`} />
          )}
        </span>

        {/* Session ID */}
        <span className="text-xs font-mono text-gray-400 w-20 flex-shrink-0">
          {truncateId(session.sessionId)}
        </span>

        {/* Place name */}
        <span className="flex-1 text-sm text-white truncate min-w-0">{session.placeName}</span>

        {/* Plugin version */}
        <span className="text-xs font-mono text-gray-500 w-14 flex-shrink-0 hidden sm:block">
          v{session.pluginVersion}
        </span>

        {/* Last heartbeat */}
        <span className="text-xs text-gray-500 w-16 text-right flex-shrink-0 hidden md:block">
          {timeAgo(session.lastHeartbeat)}
        </span>

        {/* Queue depth */}
        <span className={`text-xs font-mono w-8 text-right flex-shrink-0 ${session.queueDepth > 0 ? 'text-[#c9a227]' : 'text-gray-600'}`}>
          {session.queueDepth}
        </span>

        {/* Expand chevron */}
        <span className="text-gray-600 flex-shrink-0">
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 bg-white/[0.01]">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-1">
            <Detail label="Session ID"     value={session.sessionId} mono />
            <Detail label="Place ID"       value={session.placeId} mono />
            <Detail label="Plugin Version" value={`v${session.pluginVersion}`} mono />
            <Detail label="Status"         value={style.label} className={style.text} />
            <Detail label="Last Heartbeat" value={new Date(session.lastHeartbeat).toLocaleTimeString()} />
            <Detail label="Queue Depth"    value={String(session.queueDepth)} mono />
          </div>
        </div>
      )}
    </div>
  )
}

function Detail({ label, value, mono, className }: {
  label: string
  value: string
  mono?: boolean
  className?: string
}) {
  return (
    <div>
      <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-0.5">{label}</p>
      <p className={`text-xs text-gray-300 truncate ${mono ? 'font-mono' : ''} ${className ?? ''}`}>
        {value}
      </p>
    </div>
  )
}

function SessionsTable({ sessions, loading }: { sessions: SessionRow[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="space-y-px">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-12 bg-white/[0.02] animate-pulse rounded" />
        ))}
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div className="py-12 text-center">
        <Wifi className="w-8 h-8 text-gray-700 mx-auto mb-3" />
        <p className="text-sm text-gray-500">No active sessions</p>
        <p className="text-xs text-gray-600 mt-1">Sessions appear here when a Roblox Studio plugin connects</p>
      </div>
    )
  }

  const active = sessions.filter((s) => sessionStatus(s) === 'active').length
  const stale  = sessions.filter((s) => sessionStatus(s) === 'stale').length
  const dead   = sessions.filter((s) => sessionStatus(s) === 'dead').length

  return (
    <div>
      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2 border-b border-white/[0.04]">
        <LegendDot color="bg-emerald-400" label={`${active} active`} />
        <LegendDot color="bg-amber-400"   label={`${stale} stale`}   />
        <LegendDot color="bg-red-500"     label={`${dead} dead`}     />
        <span className="ml-auto text-[10px] text-gray-600">click row to expand</span>
      </div>

      {/* Column headers */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-white/[0.04]">
        <span className="w-2 flex-shrink-0" />
        <span className="text-[10px] text-gray-600 uppercase w-20 flex-shrink-0">Session</span>
        <span className="flex-1 text-[10px] text-gray-600 uppercase">Place</span>
        <span className="text-[10px] text-gray-600 uppercase w-14 flex-shrink-0 hidden sm:block">Version</span>
        <span className="text-[10px] text-gray-600 uppercase w-16 text-right flex-shrink-0 hidden md:block">Heartbeat</span>
        <span className="text-[10px] text-gray-600 uppercase w-8 text-right flex-shrink-0">Queue</span>
        <span className="w-[14px] flex-shrink-0" />
      </div>

      {sessions.map((s) => (
        <SessionRow key={s.sessionId} session={s} />
      ))}
    </div>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-[10px] text-gray-500 font-mono">{label}</span>
    </div>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────

export function StudioAnalyticsClient() {
  const [metrics, setMetrics]     = useState<MetricsData | null>(null)
  const [sessions, setSessions]   = useState<SessionRow[]>([])
  const [metricsLoading, setMetricsLoading] = useState(true)
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [isDemo, setIsDemo]       = useState(false)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const metricsSecret = typeof window !== 'undefined'
    ? (document.cookie.match(/METRICS_SECRET=([^;]+)/)?.[1] ?? '')
    : ''

  const fetchMetrics = useCallback(async () => {
    try {
      const res = await fetch(`/api/studio/metrics?token=${encodeURIComponent(metricsSecret)}`, {
        cache: 'no-store',
      })
      if (!res.ok) throw new Error(`${res.status}`)
      const data = await res.json() as MetricsData
      setMetrics(data)
      setIsDemo(false)
    } catch {
      setMetrics(makeDemoMetrics())
      setIsDemo(true)
    } finally {
      setMetricsLoading(false)
      setLastRefresh(new Date())
    }
  }, [metricsSecret])

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/studio/sessions', { cache: 'no-store' })
      if (!res.ok) throw new Error(`${res.status}`)
      const data = await res.json() as { sessions: SessionRow[] }
      setSessions(data.sessions ?? [])
    } catch {
      setSessions(makeDemoSessions())
    } finally {
      setSessionsLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    fetchMetrics()
    fetchSessions()
  }, [fetchMetrics, fetchSessions])

  // Sessions auto-refresh every 5s
  useEffect(() => {
    const id = setInterval(fetchSessions, 5_000)
    return () => clearInterval(id)
  }, [fetchSessions])

  // Metrics auto-refresh every 30s
  useEffect(() => {
    const id = setInterval(fetchMetrics, 30_000)
    return () => clearInterval(id)
  }, [fetchMetrics])

  const handleRefresh = () => {
    setMetricsLoading(true)
    setSessionsLoading(true)
    fetchMetrics()
    fetchSessions()
  }

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Studio Connections</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {isDemo && <span className="text-[#c9a227] mr-2">[Demo Data]</span>}
            Sessions refresh every 5s &middot; Metrics every 30s &middot; Last: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
        >
          <RefreshCw size={12} className={metricsLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Connections"
          value={metricsLoading ? '—' : String(metrics?.activeSessions ?? 0)}
          sub="Sessions with recent heartbeat"
          icon={<Wifi size={16} />}
          accent
        />
        <StatCard
          title="Total Downloads"
          value={metricsLoading ? '—' : (metrics?.totalDownloads ?? 0).toLocaleString()}
          sub="Cumulative plugin installs"
          icon={<Download size={16} />}
        />
        <StatCard
          title="Commands This Hour"
          value={metricsLoading ? '—' : (metrics?.cmdsLastHour ?? 0).toLocaleString()}
          sub="Current UTC hour bucket"
          icon={<Zap size={16} />}
        />
        <StatCard
          title="Avg Sync Latency"
          value={metricsLoading ? '—' : `${metrics?.avgSyncLatencyMs ?? 0}ms`}
          sub="Rolling average across sessions"
          icon={<Clock size={16} />}
          accent={(metrics?.avgSyncLatencyMs ?? 0) < 100}
        />
      </div>

      {/* Connection chart + version pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          {metrics ? (
            <ConnectionChart data={metrics.connectionsByHour} />
          ) : (
            <div className="bg-[#111111] border border-white/[0.06] rounded-xl h-[220px] animate-pulse" />
          )}
        </div>
        <div>
          {metrics ? (
            <VersionPie dist={metrics.versionDistribution} />
          ) : (
            <div className="bg-[#111111] border border-white/[0.06] rounded-xl h-[220px] animate-pulse" />
          )}
        </div>
      </div>

      {/* Active sessions table */}
      <div className="bg-[#111111] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <h3 className="text-sm font-semibold text-white">Active Sessions</h3>
          <span className="text-[10px] text-gray-500 font-mono">
            {sessionsLoading ? '…' : `${sessions.length} total`}
          </span>
        </div>
        <SessionsTable sessions={sessions} loading={sessionsLoading} />
      </div>

      {/* Command stats */}
      {metrics && (
        <CommandStats
          byType={metrics.commandsByType}
          errorRate={metrics.errorRate}
        />
      )}
    </div>
  )
}
