'use client'
import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Copy, Check, ChevronLeft, RefreshCw, Trash2 } from 'lucide-react'
import { ApiUsageChart, type UsageBucket } from '@/components/ApiUsageChart'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? ''

// ─── Types ────────────────────────────────────────────────────────────────────

type TimeRange = '1h' | '6h' | '24h' | '7d'

type ApiKeyDetail = {
  id: string
  name: string
  prefix: string
  tier: string
  scopes: string[]
  lastUsedAt: string | null
  createdAt: string
  revokedAt: string | null
  expiresAt: string | null
}

type TopEndpoint = {
  method: string
  path: string
  count: number
  errors: number
  errorRate: number
}

type UsageData = {
  key: ApiKeyDetail
  usage: {
    range: string
    totalRequests: number
    totalErrors: number
    errorRate: number
    totalTokens: number
    hourlyBuckets: UsageBucket[]
  }
  rateLimit: {
    tier: string
    limitPerHour: number
    currentHourUsage: number
    remaining: number
  }
  topEndpoints: TopEndpoint[]
}

type RotationResult = {
  key: { id: string; rawKey: string; prefix: string }
  rotation: { oldKeyId: string; graceEndsAt: string; message: string }
}

// ─── Fallback empty usage data ────────────────────────────────────────────────

function emptyUsageData(keyId: string): UsageData {
  return {
    key: {
      id: keyId,
      name: 'Unknown Key',
      prefix: '...',
      tier: 'free',
      scopes: [],
      lastUsedAt: null,
      createdAt: new Date().toISOString(),
      revokedAt: null,
      expiresAt: null,
    },
    usage: {
      range: '24h',
      totalRequests: 0,
      totalErrors: 0,
      errorRate: 0,
      totalTokens: 0,
      hourlyBuckets: [],
    },
    rateLimit: {
      tier: 'free',
      limitPerHour: 60,
      currentHourUsage: 0,
      remaining: 60,
    },
    topEndpoints: [],
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-[#141414] border border-white/[0.08] rounded-2xl p-5">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{label}</p>
      <p className="text-white text-2xl font-bold">{value}</p>
      {sub && <p className="text-gray-500 text-xs mt-1">{sub}</p>}
    </div>
  )
}

function RateLimitBar({
  current,
  limit,
  tier,
}: {
  current: number
  limit: number
  tier: string
}) {
  const pct = limit > 0 ? Math.min(100, (current / limit) * 100) : 0
  const color =
    pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-yellow-500' : 'bg-[#FFB81C]'

  return (
    <div className="bg-[#141414] border border-white/[0.08] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-white font-semibold">Rate Limit Status</p>
        <span className="text-xs bg-white/[0.05] border border-white/[0.08] text-gray-400 px-2 py-1 rounded-full uppercase tracking-wide">
          {tier}
        </span>
      </div>
      <div className="flex items-end gap-2 mb-3">
        <span className="text-3xl font-bold text-white tabular-nums">{current}</span>
        <span className="text-gray-400 text-sm mb-1">/ {limit} this hour</span>
      </div>
      <div className="w-full bg-white/[0.05] rounded-full h-2 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between mt-2">
        <p className="text-gray-500 text-xs">{Math.round(pct)}% used</p>
        <p className="text-gray-500 text-xs">{limit - current} remaining</p>
      </div>
    </div>
  )
}

function TopEndpointsTable({ endpoints }: { endpoints: TopEndpoint[] }) {
  if (endpoints.length === 0) {
    return (
      <div className="bg-[#141414] border border-white/[0.08] rounded-2xl p-6">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Top Endpoints</h3>
        <p className="text-gray-500 text-sm text-center py-6">No endpoint data for this period</p>
      </div>
    )
  }
  const maxCount = endpoints[0].count

  return (
    <div className="bg-[#141414] border border-white/[0.08] rounded-2xl p-6">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Top Endpoints</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 border-b border-white/[0.08]">
              <th className="text-left py-2 pr-4 font-semibold">Method</th>
              <th className="text-left py-2 pr-4 font-semibold">Path</th>
              <th className="text-right py-2 pr-4 font-semibold">Calls</th>
              <th className="text-right py-2 font-semibold">Error Rate</th>
            </tr>
          </thead>
          <tbody>
            {endpoints.map((ep, i) => (
              <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                <td className="py-2.5 pr-4">
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded font-mono ${
                      ep.method === 'GET'
                        ? 'bg-blue-500/10 text-blue-400'
                        : ep.method === 'POST'
                          ? 'bg-green-500/10 text-green-400'
                          : ep.method === 'DELETE'
                            ? 'bg-red-500/10 text-red-400'
                            : 'bg-white/[0.05] text-gray-300'
                    }`}
                  >
                    {ep.method}
                  </span>
                </td>
                <td className="py-2.5 pr-4">
                  <code className="text-gray-300 text-xs">{ep.path}</code>
                  <div className="w-full bg-white/[0.05] rounded-full h-1 mt-1.5 overflow-hidden">
                    <div
                      className="h-1 bg-[#FFB81C]/40 rounded-full"
                      style={{ width: `${(ep.count / maxCount) * 100}%` }}
                    />
                  </div>
                </td>
                <td className="py-2.5 pr-4 text-right text-white font-medium tabular-nums">
                  {ep.count.toLocaleString()}
                </td>
                <td className="py-2.5 text-right tabular-nums">
                  <span
                    className={
                      ep.errorRate > 10
                        ? 'text-red-400'
                        : ep.errorRate > 0
                          ? 'text-yellow-400'
                          : 'text-green-400'
                    }
                  >
                    {ep.errorRate}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ConfirmDialog({
  title,
  description,
  confirmLabel,
  confirmClass,
  onConfirm,
  onCancel,
}: {
  title: string
  description: string
  confirmLabel: string
  confirmClass: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#141414] border border-white/[0.08] rounded-2xl p-6 w-full max-w-sm">
        <h2 className="text-white font-bold text-lg mb-2">{title}</h2>
        <p className="text-gray-400 text-sm mb-6">{description}</p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className={`flex-1 font-bold py-2.5 rounded-xl text-sm transition-colors ${confirmClass}`}
          >
            {confirmLabel}
          </button>
          <button
            onClick={onCancel}
            className="px-5 border border-white/[0.08] hover:border-[#FFB81C]/30 text-gray-400 hover:text-[#FFB81C] rounded-xl text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ApiKeyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [data, setData] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [range, setRange] = useState<TimeRange>('24h')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showRotateConfirm, setShowRotateConfirm] = useState(false)
  const [rotationResult, setRotationResult] = useState<RotationResult | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const fetchUsage = useCallback(async (r: TimeRange) => {
    setLoading(true)
    setFetchError(null)
    try {
      const base = API_BASE || ''
      const res = await fetch(`${base}/api/keys/${id}/usage?range=${r}`, {
        credentials: 'include',
      })
      if (res.ok) {
        setData(await res.json())
      } else if (res.status === 404) {
        router.push('/settings/api-keys')
      } else if (res.status === 401) {
        setFetchError('Session expired. Please sign in again.')
      } else {
        // Show empty data so page remains usable
        setData(emptyUsageData(id))
      }
    } catch {
      // API not reachable — show empty placeholder
      setData(emptyUsageData(id))
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => {
    fetchUsage(range)
  }, [fetchUsage, range])

  async function handleRotate() {
    setActionLoading(true)
    setShowRotateConfirm(false)
    setActionError(null)
    try {
      const base = API_BASE || ''
      const res = await fetch(`${base}/api/keys/${id}/rotate`, {
        method: 'POST',
        credentials: 'include',
      })
      if (res.ok) {
        const result = await res.json() as RotationResult
        setRotationResult(result)
        setTimeout(() => router.push(`/settings/api-keys/${result.key.id}`), 3000)
      } else {
        const err = await res.json().catch(() => ({}))
        setActionError(err.error ?? 'Failed to rotate key. Please try again.')
      }
    } catch {
      setActionError('Could not reach the API. Please try again.')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleDelete() {
    setActionLoading(true)
    setShowDeleteConfirm(false)
    setActionError(null)
    try {
      const base = API_BASE || ''
      const res = await fetch(`${base}/api/keys/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (res.ok) {
        router.push('/settings/api-keys')
      } else {
        const err = await res.json().catch(() => ({}))
        setActionError(err.error ?? 'Failed to delete key. Please try again.')
      }
    } catch {
      setActionError('Could not reach the API. Please try again.')
    } finally {
      setActionLoading(false)
    }
  }

  async function copyKey(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard not available
    }
  }

  if (loading && !data) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="h-8 bg-white/[0.05] rounded-xl animate-pulse w-48 mb-8" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-[#141414] border border-white/[0.08] rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-[#141414] border border-white/[0.08] rounded-2xl animate-pulse" />
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="max-w-4xl mx-auto">
        <Link
          href="/settings/api-keys"
          className="inline-flex items-center gap-1.5 text-gray-400 hover:text-[#FFB81C] text-sm transition-colors mb-6"
        >
          <ChevronLeft size={14} />
          Back to API Keys
        </Link>
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center">
          <p className="text-red-400 font-semibold mb-2">Error loading key</p>
          <p className="text-gray-400 text-sm">{fetchError}</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  const { key, usage, rateLimit, topEndpoints } = data

  return (
    <div className="max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-2">
        <Link
          href="/settings/api-keys"
          className="inline-flex items-center gap-1 text-gray-500 hover:text-[#FFB81C] text-sm transition-colors"
        >
          <ChevronLeft size={13} />
          API Keys
        </Link>
        <span className="text-gray-600">/</span>
        <span className="text-gray-400 text-sm">{key.name}</span>
      </div>

      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">{key.name}</h1>
            {key.revokedAt && (
              <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full">
                Revoked
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <code className="text-[#FFB81C] text-sm font-mono">{key.prefix}...</code>
            <span className="text-xs bg-white/[0.05] border border-white/[0.08] text-gray-400 px-2 py-0.5 rounded-full uppercase tracking-wide">
              {key.tier}
            </span>
            {key.scopes.map((s) => (
              <span
                key={s}
                className="text-xs bg-[#FFB81C]/10 text-[#FFB81C] border border-[#FFB81C]/20 px-2 py-0.5 rounded-full"
              >
                {s}
              </span>
            ))}
          </div>
          {key.lastUsedAt && (
            <p className="text-gray-500 text-xs mt-1.5">
              Last used {new Date(key.lastUsedAt).toLocaleString()}
            </p>
          )}
        </div>

        {!key.revokedAt && (
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => { setShowRotateConfirm(true); setActionError(null) }}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 text-sm border border-[#FFB81C]/30 hover:border-[#FFB81C]/60 hover:bg-[#FFB81C]/[0.06] text-[#FFB81C] px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
            >
              <RefreshCw size={13} />
              Rotate
            </button>
            <button
              onClick={() => { setShowDeleteConfirm(true); setActionError(null) }}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 text-sm border border-red-500/20 hover:border-red-500/50 hover:bg-red-500/[0.06] text-red-400 hover:text-red-300 px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
            >
              <Trash2 size={13} />
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Action error */}
      {actionError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-6">
          <p className="text-red-400 text-sm">{actionError}</p>
        </div>
      )}

      {/* Rotation result banner */}
      {rotationResult && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-5 mb-6">
          <p className="text-green-400 font-semibold mb-1">Key Rotated Successfully</p>
          <p className="text-gray-400 text-sm mb-3">{rotationResult.rotation.message}</p>
          <div className="flex items-center gap-3 bg-black/30 rounded-xl px-4 py-3">
            <code className="text-green-300 text-sm font-mono flex-1 break-all">
              {rotationResult.key.rawKey}
            </code>
            <button
              onClick={() => copyKey(rotationResult.key.rawKey)}
              className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-[#FFB81C] border border-white/[0.08] hover:border-[#FFB81C]/30 px-2 py-1 rounded-lg transition-colors flex-shrink-0"
            >
              {copied ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p className="text-gray-500 text-xs mt-2">
            Copy this key now — it will never be shown again. Redirecting to new key...
          </p>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Requests"
          value={usage.totalRequests.toLocaleString()}
          sub={`in ${usage.range}`}
        />
        <StatCard
          label="Error Rate"
          value={`${usage.errorRate}%`}
          sub={`${usage.totalErrors} errors`}
        />
        <StatCard
          label="Tokens Used"
          value={usage.totalTokens.toLocaleString()}
          sub={`in ${usage.range}`}
        />
        <StatCard
          label="Created"
          value={new Date(key.createdAt).toLocaleDateString()}
          sub={key.expiresAt ? `Expires ${new Date(key.expiresAt).toLocaleDateString()}` : 'No expiry'}
        />
      </div>

      {/* Rate limit bar */}
      <div className="mb-6">
        <RateLimitBar
          current={rateLimit.currentHourUsage}
          limit={rateLimit.limitPerHour}
          tier={rateLimit.tier}
        />
      </div>

      {/* Usage chart */}
      <div className="mb-6">
        <ApiUsageChart
          data={usage.hourlyBuckets}
          rateLimit={rateLimit.limitPerHour}
          range={range}
          onRangeChange={(r) => setRange(r)}
          loading={loading}
        />
      </div>

      {/* Top endpoints table */}
      <TopEndpointsTable endpoints={topEndpoints} />

      {/* Dialogs */}
      {showRotateConfirm && (
        <ConfirmDialog
          title="Rotate API Key"
          description="This will generate a new key. Your old key will remain valid for 24 hours to give you time to update your integrations."
          confirmLabel="Rotate Key"
          confirmClass="bg-[#FFB81C] hover:bg-[#E6A519] text-black"
          onConfirm={handleRotate}
          onCancel={() => setShowRotateConfirm(false)}
        />
      )}

      {showDeleteConfirm && (
        <ConfirmDialog
          title="Delete API Key"
          description="This will permanently delete this key and all its usage history. Any integrations using this key will immediately stop working. This cannot be undone."
          confirmLabel="Delete Key"
          confirmClass="bg-red-600 hover:bg-red-700 text-white"
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  )
}
