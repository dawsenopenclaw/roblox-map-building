'use client'
import { useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { useAnalytics } from '@/hooks/useAnalytics'

const fetcher = (url: string) => fetch(url).then(r => r.json())

// Safe client-side copy — no serverEnv import
const TOKEN_PACKS_CLIENT = [
  { slug: 'starter', name: 'Starter Pack', tokens: 1000, priceCents: 1000 },
  { slug: 'creator', name: 'Creator Pack', tokens: 5000, priceCents: 4500 },
  { slug: 'pro',     name: 'Pro Pack',     tokens: 15000, priceCents: 12000 },
] as const

// Stub invoice data — real data wired via Stripe API
const STUB_INVOICES = [
  { id: 'inv_001', date: '2026-03-01', amount: 14.99, status: 'paid', plan: 'Creator' },
  { id: 'inv_002', date: '2026-02-01', amount: 14.99, status: 'paid', plan: 'Creator' },
  { id: 'inv_003', date: '2026-01-01', amount: 14.99, status: 'paid', plan: 'Creator' },
]

const USAGE_DATA = [
  { month: 'Oct', tokens: 3200 },
  { month: 'Nov', tokens: 4800 },
  { month: 'Dec', tokens: 5100 },
  { month: 'Jan', tokens: 6200 },
  { month: 'Feb', tokens: 5800 },
  { month: 'Mar', tokens: 2400 },
]

function UsageChart({ data }: { data: typeof USAGE_DATA }) {
  const max = Math.max(...data.map(d => d.tokens))
  return (
    <div className="flex items-end gap-2 h-24">
      {data.map((d) => (
        <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-t-md bg-[#FFB81C]/60 hover:bg-[#FFB81C] transition-colors"
            style={{ height: `${(d.tokens / max) * 80}px` }}
            title={`${d.tokens.toLocaleString()} tokens`}
          />
          <span className="text-xs text-gray-500">{d.month}</span>
        </div>
      ))}
    </div>
  )
}

export default function BillingPage() {
  const { track } = useAnalytics()
  const { data: balance } = useSWR('/api/tokens/balance', fetcher, {
    onErrorRetry: (error, _key, _config, revalidate, { retryCount }) => {
      if (retryCount >= 2) return
      setTimeout(() => revalidate({ retryCount }), 3000)
    },
  })
  const [cancelConfirm, setCancelConfirm] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [buyingPack, setBuyingPack] = useState<string | null>(null)
  const [portalError, setPortalError] = useState<string | null>(null)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  const handlePortal = async () => {
    setPortalLoading(true)
    setPortalError(null)
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setPortalError(data.error || 'Could not open billing portal. Try again.')
        track('error_encountered', { errorType: 'billing_portal_failed', page: '/billing' })
        return
      }
      if (data.url) {
        track('subscription_upgraded', { fromTier: 'unknown', toTier: 'portal' })
        window.location.href = data.url
      }
    } catch {
      setPortalError('Network error — could not open billing portal. Try again.')
      track('error_encountered', { errorType: 'billing_portal_failed', page: '/billing' })
    } finally {
      setPortalLoading(false)
    }
  }

  const handleTokenPurchase = async (packSlug: string) => {
    setBuyingPack(packSlug)
    setCheckoutError(null)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'token_pack', packSlug }),
      })
      const data = await res.json()
      if (!res.ok) {
        setCheckoutError(data.error || 'Could not start checkout. Try again.')
        track('error_encountered', { errorType: 'token_checkout_failed', page: '/billing' })
        return
      }
      if (data.url) {
        track('token_purchased', { packSlug })
        window.location.href = data.url
      }
    } catch {
      setCheckoutError('Network error — could not start checkout. Try again.')
      track('error_encountered', { errorType: 'token_checkout_failed', page: '/billing' })
    } finally {
      setBuyingPack(null)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Billing</h1>
        <p className="text-gray-400 mt-1 text-sm">Manage your subscription and tokens.</p>
      </div>

      <div className="space-y-6">
        {/* Current plan */}
        <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Current Plan</h2>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-2xl font-bold text-white">Creator</p>
              <p className="text-gray-400 text-sm mt-1">$14.99/month · Renews April 1, 2026</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-sm text-green-400">Active</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/pricing"
                className="text-sm border border-white/20 hover:border-white/40 text-white px-4 py-2.5 rounded-xl transition-colors text-center"
              >
                Change plan
              </Link>
              <button
                onClick={handlePortal}
                disabled={portalLoading}
                className="text-sm bg-[#FFB81C] hover:bg-[#E6A519] text-black font-semibold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-60"
              >
                {portalLoading ? 'Loading...' : 'Manage payment'}
              </button>
            </div>
          </div>
          {portalError && (
            <p className="mt-3 text-sm text-red-400">{portalError}</p>
          )}
        </div>

        {/* Token balance + usage */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Token Balance</h2>
            <p className="text-4xl font-bold text-[#FFB81C]">
              {balance?.balance !== undefined ? balance.balance.toLocaleString() : '—'}
            </p>
            <p className="text-gray-500 text-sm mt-1">of 7,000 this month</p>
            <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#FFB81C] rounded-full"
                style={{ width: `${Math.min(100, ((balance?.balance || 0) / 7000) * 100)}%` }}
              />
            </div>
          </div>

          <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Usage History</h2>
            <UsageChart data={USAGE_DATA} />
          </div>
        </div>

        {/* Token packs */}
        <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Buy More Tokens</h2>
          {checkoutError && (
            <p className="mb-4 text-sm text-red-400">{checkoutError}</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {TOKEN_PACKS_CLIENT.map((pack) => {
              const discount = pack.slug !== 'starter'
                ? Math.round((1 - pack.priceCents / (pack.tokens * 0.1)) * 100)
                : 0
              return (
                <div key={pack.slug} className="bg-[#111640] border border-white/10 rounded-xl p-4">
                  <p className="font-semibold text-white">{pack.name}</p>
                  <p className="text-[#FFB81C] text-2xl font-bold mt-1">
                    {pack.tokens.toLocaleString()}
                    <span className="text-sm text-gray-400 font-normal ml-1">tokens</span>
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    ${(pack.priceCents / 100).toFixed(2)}
                    {discount > 0 && (
                      <span className="ml-2 text-xs text-green-400">{discount}% off</span>
                    )}
                  </p>
                  <button
                    onClick={() => handleTokenPurchase(pack.slug)}
                    disabled={buyingPack === pack.slug}
                    className="mt-3 w-full bg-[#FFB81C] hover:bg-[#E6A519] text-black text-sm font-bold py-2 rounded-lg transition-colors disabled:opacity-60"
                  >
                    {buyingPack === pack.slug ? 'Loading...' : 'Buy now'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Invoice list */}
        <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Invoices</h2>
          <div className="space-y-3">
            {STUB_INVOICES.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                <div>
                  <p className="text-white text-sm font-medium">{inv.plan} Plan</p>
                  <p className="text-gray-500 text-xs mt-0.5">{inv.date}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${
                    inv.status === 'paid'
                      ? 'bg-green-500/10 text-green-400 border-green-500/30'
                      : 'bg-red-500/10 text-red-400 border-red-500/30'
                  }`}>
                    {inv.status}
                  </span>
                  <span className="text-white text-sm font-medium">${inv.amount}</span>
                  <button
                    onClick={handlePortal}
                    className="text-xs text-[#FFB81C] hover:underline"
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={handlePortal}
            className="mt-4 text-sm text-[#FFB81C] hover:underline"
          >
            View all invoices in Stripe &rarr;
          </button>
        </div>

        {/* Cancel */}
        <div className="bg-[#0D1231] border border-red-500/20 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-2">
            Cancel Subscription
          </h2>
          <p className="text-gray-400 text-sm mb-4">
            You can cancel at any time. Your access continues until the end of the billing period.
            No penalties, no questions asked.
          </p>
          {!cancelConfirm ? (
            <button
              onClick={() => setCancelConfirm(true)}
              className="text-sm border border-red-500/30 hover:border-red-500/60 text-red-400 hover:text-red-300 px-4 py-2.5 rounded-xl transition-colors"
            >
              Cancel subscription
            </button>
          ) : (
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
              <p className="text-white text-sm font-medium mb-3">
                Are you sure? Your access ends on April 1, 2026.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handlePortal}
                  className="text-sm bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
                >
                  Yes, cancel
                </button>
                <button
                  onClick={() => setCancelConfirm(false)}
                  className="text-sm border border-white/20 text-gray-400 hover:text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Keep subscription
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
