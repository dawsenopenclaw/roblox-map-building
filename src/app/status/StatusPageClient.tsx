'use client'

import { useCallback, useEffect, useState } from 'react'
import { ComponentStatus } from '@/components/status/ComponentStatus'
import { StatusIndicator, type Status } from '@/components/status/StatusIndicator'

interface PublicComponent {
  id: string
  name: string
  description: string
  status: Status
}

interface PublicStatusResponse {
  status: Status
  updatedAt: string
  lastIncidentAt: string | null
  components: PublicComponent[]
}

const HERO_COPY: Record<Status, { title: string; subtitle: string }> = {
  operational: {
    title: 'All systems operational',
    subtitle: 'Everything is running smoothly.',
  },
  degraded: {
    title: 'Some systems are degraded',
    subtitle: 'We are aware of an issue and are investigating.',
  },
  outage: {
    title: 'Major service outage',
    subtitle: 'Our team is actively working to restore service.',
  },
}

const HERO_BG: Record<Status, { border: string; glow: string; text: string }> = {
  operational: {
    border: 'rgba(16, 185, 129, 0.25)',
    glow: 'rgba(16, 185, 129, 0.12)',
    text: '#34d399',
  },
  degraded: {
    border: 'rgba(245, 158, 11, 0.3)',
    glow: 'rgba(245, 158, 11, 0.12)',
    text: '#fbbf24',
  },
  outage: {
    border: 'rgba(239, 68, 68, 0.35)',
    glow: 'rgba(239, 68, 68, 0.14)',
    text: '#f87171',
  },
}

function formatRelative(iso: string | null): string {
  if (!iso) return 'No incidents reported in the last 90 days'
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return 'No incidents reported in the last 90 days'
  const days = Math.floor((Date.now() - then) / (1000 * 60 * 60 * 24))
  if (days <= 0) return 'Last incident: today'
  if (days === 1) return 'Last incident: 1 day ago'
  return `Last incident: ${days} days ago`
}

export function StatusPageClient() {
  const [data, setData] = useState<PublicStatusResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [email, setEmail] = useState('')
  const [subscribeState, setSubscribeState] = useState<
    'idle' | 'submitting' | 'success' | 'error'
  >('idle')
  const [subscribeMessage, setSubscribeMessage] = useState<string>('')

  const fetchStatus = useCallback(async (isInitial = false) => {
    if (!isInitial) setRefreshing(true)
    try {
      const res = await fetch('/api/status', { cache: 'no-store' })
      if (res.ok) {
        const json = (await res.json()) as PublicStatusResponse
        setData(json)
      }
    } catch (err) {
      console.error('[StatusPage] Failed to fetch system status:', err instanceof Error ? err.message : err)
    } finally {
      if (isInitial) setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus(true)
    const id = setInterval(() => fetchStatus(false), 30_000)
    return () => clearInterval(id)
  }, [fetchStatus])

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setSubscribeState('submitting')
    setSubscribeMessage('')
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const json = (await res.json().catch(() => null)) as
        | { success?: boolean; message?: string }
        | null
      if (res.ok && json?.success) {
        setSubscribeState('success')
        setSubscribeMessage("You're subscribed. We'll email you about incidents.")
        setEmail('')
      } else {
        setSubscribeState('error')
        setSubscribeMessage(json?.message || 'Something went wrong. Please try again.')
      }
    } catch {
      setSubscribeState('error')
      setSubscribeMessage('Network error. Please try again.')
    }
  }

  const overall: Status = data?.status ?? 'operational'
  const hero = HERO_COPY[overall]
  const heroColors = HERO_BG[overall]

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12 sm:py-16">
      {/* Hero card */}
      <section
        className="relative overflow-hidden rounded-2xl border px-6 sm:px-10 py-10 sm:py-12"
        style={{
          borderColor: heroColors.border,
          background: `radial-gradient(ellipse at top, ${heroColors.glow}, transparent 70%), rgba(10, 10, 15, 0.6)`,
        }}
      >
        <div className="flex items-center gap-3 mb-3">
          <StatusIndicator status={overall} compact />
          <span
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: heroColors.text }}
          >
            Live status
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
          {loading ? 'Checking systems…' : hero.title}
        </h1>
        <p className="mt-2 text-zinc-400 text-base sm:text-lg">
          {loading ? 'Fetching live status from every region.' : hero.subtitle}
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-500">
          <span>
            {data?.updatedAt
              ? `Updated ${new Date(data.updatedAt).toLocaleTimeString()}`
              : 'Updating…'}
          </span>
          <span aria-hidden="true">•</span>
          <span>Auto-refreshes every 30 seconds</span>
          {refreshing && (
            <>
              <span aria-hidden="true">•</span>
              <span className="text-zinc-400">Refreshing…</span>
            </>
          )}
        </div>
      </section>

      {/* Components list */}
      <section className="mt-10">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-white">Components</h2>
          <span className="text-xs text-zinc-500">Updated in realtime</span>
        </div>
        <div className="space-y-3">
          {loading && !data
            ? Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 rounded-xl border border-white/[0.05] bg-white/[0.02] animate-pulse"
                />
              ))
            : data?.components.map((c) => (
                <ComponentStatus
                  key={c.id}
                  name={c.name}
                  description={c.description}
                  status={c.status}
                />
              ))}
        </div>
      </section>

      {/* Incident history */}
      <section className="mt-12">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-white">Incident history</h2>
          <span className="text-xs text-zinc-500">Last 90 days</span>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-6 py-10 text-center">
          <div className="inline-flex items-center gap-2 text-sm font-medium text-zinc-300">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: '#10b981' }}
              aria-hidden="true"
            />
            {formatRelative(data?.lastIncidentAt ?? null)}
          </div>
          <p className="mt-2 text-sm text-zinc-500">
            If you are experiencing an issue we have not acknowledged, please contact
            support.
          </p>
        </div>
      </section>

      {/* Subscribe */}
      <section className="mt-12">
        <div
          className="rounded-2xl border border-white/[0.08] p-6 sm:p-8"
          style={{
            background:
              'radial-gradient(ellipse at top left, rgba(212, 175, 55, 0.08), transparent 60%), rgba(10, 10, 15, 0.6)',
          }}
        >
          <h2 className="text-xl font-bold text-white">Subscribe to updates</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Get an email the moment an incident is opened, updated, or resolved.
          </p>
          <form
            onSubmit={handleSubscribe}
            className="mt-5 flex flex-col sm:flex-row gap-3"
          >
            <label htmlFor="status-email" className="sr-only">
              Email address
            </label>
            <input
              id="status-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="flex-1 rounded-lg border border-white/[0.08] bg-black/40 px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30"
              disabled={subscribeState === 'submitting'}
            />
            <button
              type="submit"
              disabled={subscribeState === 'submitting'}
              className="rounded-lg px-5 py-3 text-sm font-semibold text-black transition-all duration-150 hover:brightness-110 active:scale-[0.97] disabled:opacity-60"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #C8962A 100%)',
                boxShadow: '0 0 20px rgba(212,175,55,0.25)',
              }}
            >
              {subscribeState === 'submitting' ? 'Subscribing…' : 'Subscribe'}
            </button>
          </form>
          {subscribeMessage && (
            <p
              className={`mt-3 text-sm ${
                subscribeState === 'success' ? 'text-emerald-400' : 'text-red-400'
              }`}
              role="status"
            >
              {subscribeMessage}
            </p>
          )}
          <p className="mt-3 text-[11px] text-zinc-500">
            We only use this address for status notifications. Unsubscribe anytime.
          </p>
        </div>
      </section>

      <footer className="mt-12 text-center text-xs text-zinc-600">
        Powered by ForjeGames realtime health probes
      </footer>
    </div>
  )
}

export default StatusPageClient
