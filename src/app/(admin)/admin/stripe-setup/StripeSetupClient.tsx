'use client'

import { useEffect, useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type PriceStatus = {
  envKey: string
  label: string
  description: string
  required: boolean
  configured: boolean
  value: string | null
}

type SetupStatus = {
  stripeConfigured: boolean
  webhookConfigured: boolean
  prices: PriceStatus[]
  allRequiredConfigured: boolean
  summary: {
    total: number
    configured: number
    missing: number
    requiredMissing: string[]
  }
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconCheck() {
  return (
    <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  )
}

function IconX() {
  return (
    <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function IconWarning() {
  return (
    <svg className="w-4 h-4 text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 3h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  )
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
        ok
          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          : 'bg-red-500/10 text-red-400 border-red-500/20'
      }`}
    >
      {ok ? <IconCheck /> : <IconX />}
      {label}
    </span>
  )
}

// ─── Setup instructions ───────────────────────────────────────────────────────

function SetupInstructions() {
  return (
    <div className="bg-[#0d0d14] border border-[#D4AF37]/20 rounded-2xl p-6">
      <h2 className="text-white font-bold text-base mb-4 flex items-center gap-2">
        <span className="text-[#D4AF37]">How to set up Stripe price IDs</span>
      </h2>
      <ol className="space-y-4 text-sm text-gray-300 list-decimal list-inside">
        <li>
          Go to{' '}
          <a
            href="https://dashboard.stripe.com/products"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#D4AF37] underline underline-offset-2 hover:text-yellow-300"
          >
            dashboard.stripe.com/products
          </a>{' '}
          and click <strong className="text-white">+ Add product</strong>.
        </li>
        <li>
          Create one product per subscription tier (Hobby, Creator, Studio). For each product,
          add <strong className="text-white">two prices</strong>: one monthly recurring and one
          yearly recurring.
        </li>
        <li>
          After saving, click into each price to copy its{' '}
          <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs text-gray-200">price_...</code>{' '}
          ID.
        </li>
        <li>
          Create three more products for token packs (Starter, Creator, Pro). Each needs a single
          one-time price.
        </li>
        <li>
          Paste each price ID into your{' '}
          <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs text-gray-200">.env.local</code>{' '}
          (or Vercel environment variables) using the key names shown in the table below.
        </li>
        <li>
          Set up your Stripe webhook at{' '}
          <a
            href="https://dashboard.stripe.com/webhooks"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#D4AF37] underline underline-offset-2 hover:text-yellow-300"
          >
            dashboard.stripe.com/webhooks
          </a>
          . Endpoint URL:{' '}
          <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs text-gray-200">
            https://yourdomain.com/api/webhooks/stripe
          </code>
          . Events to listen for:{' '}
          <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs text-gray-200">
            checkout.session.completed, customer.subscription.*, invoice.payment_*
          </code>
          .
        </li>
        <li>
          Redeploy (or restart your dev server) after updating env vars — Next.js reads them at
          startup.
        </li>
      </ol>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function StripeSetupClient() {
  const [status, setStatus] = useState<SetupStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/stripe-setup')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() as Promise<SetupStatus>
      })
      .then(setStatus)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }, [])

  const subscriptionPrices = status?.prices.filter((p) =>
    p.envKey.startsWith('STRIPE_HOBBY') ||
    p.envKey.startsWith('STRIPE_CREATOR_PRICE') ||
    p.envKey.startsWith('STRIPE_CREATOR_YEARLY') ||
    p.envKey.startsWith('STRIPE_STUDIO')
  ) ?? []

  const tokenPrices = status?.prices.filter((p) => p.envKey.startsWith('STRIPE_TOKEN')) ?? []

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Stripe Setup</h1>
        <p className="text-gray-400 mt-1 text-sm">
          Configure billing price IDs and verify your Stripe integration.
        </p>
      </div>

      {loading && (
        <div className="text-gray-400 text-sm py-12 text-center">Checking configuration...</div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-5 py-4 text-red-300 text-sm flex items-center gap-2">
          <IconX />
          {error}
        </div>
      )}

      {status && (
        <div className="space-y-6">
          {/* Overall health */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-[#0d0d14] border border-white/10 rounded-xl p-4 flex flex-col gap-2">
              <p className="text-gray-400 text-xs uppercase tracking-wide">Stripe Secret Key</p>
              <StatusBadge ok={status.stripeConfigured} label={status.stripeConfigured ? 'Configured' : 'Missing'} />
            </div>
            <div className="bg-[#0d0d14] border border-white/10 rounded-xl p-4 flex flex-col gap-2">
              <p className="text-gray-400 text-xs uppercase tracking-wide">Webhook Secret</p>
              <StatusBadge ok={status.webhookConfigured} label={status.webhookConfigured ? 'Configured' : 'Missing'} />
            </div>
            <div className="bg-[#0d0d14] border border-white/10 rounded-xl p-4 flex flex-col gap-2">
              <p className="text-gray-400 text-xs uppercase tracking-wide">Price IDs</p>
              <span className="text-white font-bold text-lg tabular-nums">
                {status.summary.configured}
                <span className="text-gray-500 font-normal text-sm"> / {status.summary.total}</span>
              </span>
              <p className="text-gray-500 text-xs">{status.summary.missing} missing</p>
            </div>
          </div>

          {/* Warning banner if required IDs missing */}
          {status.summary.requiredMissing.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-5 py-4 flex items-start gap-3">
              <IconWarning />
              <div>
                <p className="text-amber-300 text-sm font-semibold">Required price IDs missing</p>
                <p className="text-amber-400/70 text-xs mt-1">
                  Checkout will return &quot;Price not configured&quot; for:{' '}
                  {status.summary.requiredMissing.join(', ')}
                </p>
              </div>
            </div>
          )}

          {/* All good banner */}
          {status.allRequiredConfigured && status.stripeConfigured && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-5 py-4 flex items-center gap-3">
              <IconCheck />
              <p className="text-emerald-300 text-sm font-semibold">
                All required price IDs are configured. Checkout is fully operational.
              </p>
            </div>
          )}

          {/* Subscription prices */}
          <div className="bg-[#0d0d14] border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5">
              <p className="text-white font-semibold text-sm">Subscription Prices</p>
            </div>
            <div className="divide-y divide-white/5">
              {subscriptionPrices.map((price) => (
                <div key={price.envKey} className="px-6 py-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white text-sm font-medium">{price.label}</p>
                      {price.required && (
                        <span className="text-xs text-amber-400 border border-amber-400/30 px-1.5 py-0.5 rounded-full">
                          required
                        </span>
                      )}
                    </div>
                    <p className="text-gray-500 text-xs mt-0.5">{price.description}</p>
                    <code className="text-gray-600 text-xs">{price.envKey}</code>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {price.configured && price.value && (
                      <code className="text-gray-400 text-xs bg-white/5 px-2 py-1 rounded">
                        {price.value}
                      </code>
                    )}
                    {price.configured ? <IconCheck /> : <IconX />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Token pack prices */}
          <div className="bg-[#0d0d14] border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5">
              <p className="text-white font-semibold text-sm">Token Pack Prices</p>
            </div>
            <div className="divide-y divide-white/5">
              {tokenPrices.map((price) => (
                <div key={price.envKey} className="px-6 py-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">{price.label}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{price.description}</p>
                    <code className="text-gray-600 text-xs">{price.envKey}</code>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {price.configured && price.value && (
                      <code className="text-gray-400 text-xs bg-white/5 px-2 py-1 rounded">
                        {price.value}
                      </code>
                    )}
                    {price.configured ? <IconCheck /> : <IconX />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Setup instructions */}
          <SetupInstructions />
        </div>
      )}
    </div>
  )
}
