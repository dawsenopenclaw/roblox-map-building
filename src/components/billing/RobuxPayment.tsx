'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { ExternalLink, Coins, Check, Loader2, AlertCircle, Zap, Crown, Building2 } from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

type RobuxTier = 'starter' | 'pro' | 'studio' | 'credits_100' | 'credits_500'

interface RobuxPricing {
  usd: number
  robux: number
  credits: number
  type: 'gamepass' | 'devproduct'
}

interface PollResponse {
  status: string
  credited: boolean
}

// ── Pricing data ─────────────────────────────────────────────────────────────
// Aligned with the main pricing tiers ($10/$50/$200) at the Roblox DevEx rate
// of ~286 Robux per $1 USD. Credits match the tier token allocations.

const ROBUX_PRICES: Record<RobuxTier, RobuxPricing> = {
  starter:     { usd: 10,  robux: 2860,  credits: 5000,   type: 'gamepass' },
  pro:         { usd: 50,  robux: 14300, credits: 30000,  type: 'gamepass' },
  studio:      { usd: 200, robux: 57200, credits: 150000, type: 'gamepass' },
  credits_100: { usd: 5,   robux: 1430,  credits: 2500,   type: 'devproduct' },
  credits_500: { usd: 25,  robux: 7150,  credits: 15000,  type: 'devproduct' },
}

const TIER_META: Record<RobuxTier, { label: string; description: string; icon: React.ReactNode; featured?: boolean }> = {
  credits_100: {
    label: '2,500 Credits',
    description: 'Quick top-up for a few generations',
    icon: <Coins size={16} />,
  },
  credits_500: {
    label: '15,000 Credits',
    description: 'Best value credit pack',
    icon: <Coins size={16} />,
  },
  starter: {
    label: 'Starter',
    description: '5,000 credits/mo with Starter features',
    icon: <Zap size={16} />,
  },
  pro: {
    label: 'Creator',
    description: '30,000 credits/mo with Creator features',
    icon: <Crown size={16} />,
    featured: true,
  },
  studio: {
    label: 'Studio',
    description: '150,000 credits/mo with full access',
    icon: <Building2 size={16} />,
  },
}

// ── Component ────────────────────────────────────────────────────────────────

type ViewMode = 'plans' | 'credits'

export default function RobuxPayment() {
  const [viewMode, setViewMode] = useState<ViewMode>('plans')
  const [selectedTier, setSelectedTier] = useState<RobuxTier | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pollToken, setPollToken] = useState<string | null>(null)
  const [gamePassUrl, setGamePassUrl] = useState<string | null>(null)
  const [purchaseComplete, setPurchaseComplete] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  // Poll for purchase confirmation
  useEffect(() => {
    if (!pollToken) return

    const poll = async () => {
      try {
        const res = await fetch(`/api/billing/robux?pollToken=${pollToken}`)
        if (!res.ok) return
        const data = (await res.json()) as PollResponse
        if (data.credited) {
          setPurchaseComplete(true)
          setLoading(false)
          if (pollRef.current) {
            clearInterval(pollRef.current)
            pollRef.current = null
          }
        }
      } catch {
        // Silently retry on next interval
      }
    }

    // Poll every 5 seconds
    pollRef.current = setInterval(poll, 5000)
    // Initial check after 3 seconds
    const initialTimeout = setTimeout(poll, 3000)

    return () => {
      clearTimeout(initialTimeout)
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [pollToken])

  const initiatePayment = useCallback(async (tier: RobuxTier) => {
    setSelectedTier(tier)
    setLoading(true)
    setError(null)
    setPurchaseComplete(false)
    setPollToken(null)
    setGamePassUrl(null)

    try {
      const res = await fetch('/api/billing/robux', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      })

      const data = await res.json()

      // Unauthed users get redirected to sign-in with /pricing as the
      // post-auth return URL — one click later they're back ready to buy.
      // Handler returns { error: 'Authentication required', redirect: '/sign-in' }.
      if (typeof data?.redirect === 'string') {
        const returnTo = '/pricing#robux'
        const sep = data.redirect.includes('?') ? '&' : '?'
        window.location.href = `${data.redirect}${sep}redirect_url=${encodeURIComponent(returnTo)}`
        return
      }

      if (!res.ok) {
        setError(data.error ?? 'Failed to initiate payment')
        setLoading(false)
        return
      }

      setGamePassUrl(data.gamePassUrl)
      setPollToken(data.pollToken)

      // Open the Roblox page in a new tab
      window.open(data.gamePassUrl, '_blank', 'noopener,noreferrer')
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }, [])

  const cancelPoll = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
    setPollToken(null)
    setGamePassUrl(null)
    setLoading(false)
    setSelectedTier(null)
  }, [])

  const planTiers: RobuxTier[] = ['starter', 'pro', 'studio']
  const creditTiers: RobuxTier[] = ['credits_100', 'credits_500']
  const displayedTiers = viewMode === 'plans' ? planTiers : creditTiers

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-[#00A2FF]/10 border border-[#00A2FF]/20 flex items-center justify-center">
          <Coins size={18} className="text-[#00A2FF]" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Pay with Robux</h3>
          <p className="text-xs text-gray-500">
            Purchase via Roblox GamePass at ~286 R$ per $1 USD
          </p>
        </div>
      </div>

      {/* View mode toggle */}
      <div className="flex gap-1 p-1 bg-white/[0.05] rounded-xl border border-white/[0.08]">
        <button
          onClick={() => setViewMode('plans')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            viewMode === 'plans'
              ? 'bg-[#00A2FF]/15 text-[#00A2FF] border border-[#00A2FF]/30'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Subscription Plans
        </button>
        <button
          onClick={() => setViewMode('credits')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            viewMode === 'credits'
              ? 'bg-[#00A2FF]/15 text-[#00A2FF] border border-[#00A2FF]/30'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Credit Packs
        </button>
      </div>

      {/* Purchase complete state */}
      {purchaseComplete && selectedTier && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3">
            <Check size={24} className="text-green-400" />
          </div>
          <p className="text-green-400 font-bold text-lg mb-1">Purchase Complete</p>
          <p className="text-gray-400 text-sm">
            {ROBUX_PRICES[selectedTier].credits.toLocaleString()} credits have been added to your account.
          </p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-red-400 text-sm font-medium">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-xs text-red-400/60 hover:text-red-400 mt-1 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Waiting for purchase confirmation */}
      {pollToken && !purchaseComplete && (
        <div className="bg-[#00A2FF]/5 border border-[#00A2FF]/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Loader2 size={20} className="text-[#00A2FF] animate-spin" />
            <div>
              <p className="text-white font-semibold text-sm">Waiting for purchase confirmation...</p>
              <p className="text-gray-500 text-xs">Complete the purchase in Roblox, then come back here</p>
            </div>
          </div>
          {gamePassUrl && (
            <a
              href={gamePassUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[#00A2FF] hover:text-[#00A2FF]/80 text-sm font-medium transition-colors mb-3"
            >
              <ExternalLink size={13} />
              Open Roblox page again
            </a>
          )}
          <div className="flex justify-end">
            <button
              onClick={cancelPoll}
              className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Pricing cards */}
      {!pollToken && !purchaseComplete && (
        <div className={`grid gap-3 ${viewMode === 'plans' ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
          {displayedTiers.map((tier) => {
            const pricing = ROBUX_PRICES[tier]
            const meta = TIER_META[tier]
            const isLoading = loading && selectedTier === tier

            return (
              <div
                key={tier}
                className={`relative overflow-hidden bg-[#0F1320] border rounded-2xl p-5 transition-all hover:border-[#00A2FF]/30 ${
                  meta.featured
                    ? 'border-[#00A2FF]/40 shadow-[0_0_24px_rgba(0,162,255,0.12)]'
                    : 'border-white/[0.08]'
                }`}
              >
                {meta.featured && (
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00A2FF]/60 to-transparent" />
                )}

                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[#00A2FF]">{meta.icon}</span>
                  <span className="text-white font-bold text-sm">{meta.label}</span>
                  {meta.featured && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#00A2FF] bg-[#00A2FF]/10 px-2 py-0.5 rounded-full border border-[#00A2FF]/20">
                      Popular
                    </span>
                  )}
                </div>

                <p className="text-gray-500 text-xs mb-4">{meta.description}</p>

                {/* Pricing */}
                <div className="space-y-1.5 mb-5">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-white">
                      {pricing.robux.toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-500">R$</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="line-through">${pricing.usd}</span>
                    <span>USD equivalent</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[#D4AF37]">
                    <Zap size={11} />
                    <span className="font-medium">{pricing.credits.toLocaleString()} credits</span>
                  </div>
                </div>

                <button
                  onClick={() => initiatePayment(tier)}
                  disabled={isLoading || loading}
                  className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all ${
                    meta.featured
                      ? 'bg-[#00A2FF] hover:bg-[#0090E0] text-white shadow-lg shadow-[#00A2FF]/20'
                      : 'bg-white/[0.08] hover:bg-white/[0.12] text-white border border-white/[0.08] hover:border-white/[0.15]'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={14} className="animate-spin" />
                      Opening Roblox...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Coins size={14} />
                      Pay {pricing.robux.toLocaleString()} R$
                    </span>
                  )}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* How it works */}
      {!pollToken && !purchaseComplete && (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.12em] mb-3">
            How Robux payment works
          </p>
          <ol className="space-y-2 text-xs text-gray-500">
            <li className="flex items-start gap-2">
              <span className="text-[#00A2FF] font-bold">1.</span>
              Click a plan above to open the Roblox GamePass page
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#00A2FF] font-bold">2.</span>
              Purchase the GamePass using your Robux balance
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#00A2FF] font-bold">3.</span>
              Return here and your credits will be added automatically
            </li>
          </ol>
          <p className="text-[10px] text-gray-600 mt-3">
            Make sure your Roblox account is linked in Settings before purchasing.
            Exchange rate: ~286 R$ = $1 USD (DevEx rate).
          </p>
        </div>
      )}
    </div>
  )
}
