'use client'

/**
 * CustomPricingCalculator
 * ----------------------------------------------------------------------------
 * A frictionless slider-based pricing calculator. Users drag to choose how
 * many tokens they want per month; the price, operation breakdown, and CTA
 * all update in real-time with zero forms.
 *
 * Styling matches the pricing page premium aesthetic:
 *   - rgba dark backgrounds with subtle gold accents (#D4AF37)
 *   - 12px rounded corners
 *   - Soft shadows + ambient glows
 *
 * See src/app/api/billing/custom-plan/route.ts for the server-side pricing
 * logic — this component mirrors those constants so the slider feedback is
 * instant (no round-trip required for the price to update).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import useSWR from 'swr'
import { MessageSquare, Image as ImageIcon, Box, Sparkles, Loader2, ArrowRight } from 'lucide-react'

// ─── Pricing constants (keep in sync with /api/billing/custom-plan) ─────────
// Pricing scheme:
//   - Min: $10/mo for ~5,000 tokens
//   - Max: $1,000/mo for 1,000,000 tokens
//   - Beyond 1M tokens → contact sales (enterprise)
//   - Average $0.001 per token (volume discount tiers below)
const MIN_TOKENS          = 5_000
const MAX_TOKENS          = 1_000_000
const DEFAULT_TOKENS      = 30_000
const STEP_TOKENS         = 1_000
const MIN_PRICE_USD       = 10
const MAX_PRICE_USD       = 1_000

// Average tokens per operation type (mirrors server route)
const AVG_TOKENS_PER_CHAT  = 2
const AVG_TOKENS_PER_IMAGE = 30
const AVG_TOKENS_PER_MESH  = 80

/**
 * Volume-tiered pricing — bigger plans get a discount per token.
 *   5k–30k    : $0.002 per token (premium tier — base $10 floor)
 *   30k–150k  : $0.0017 per token (creator tier blended)
 *   150k–500k : $0.0013 per token (studio tier blended)
 *   500k–1M   : $0.001  per token (enterprise volume discount)
 *
 * Result: 5k = $10, 30k = $50, 150k = $200, 500k = $620, 1M = $1000
 */
function calcPrice(tokens: number): number {
  const clamped = Math.max(MIN_TOKENS, Math.min(MAX_TOKENS, tokens))
  let price = 0
  let remaining = clamped

  // Tier 1: first 30k at $0.002/token (max $60 for this band, but starts from $10 floor)
  const t1 = Math.min(remaining, 30_000)
  price += t1 * 0.002
  remaining -= t1

  // Tier 2: 30k–150k at $0.0017/token
  if (remaining > 0) {
    const t2 = Math.min(remaining, 120_000)
    price += t2 * 0.00125  // smooths to $50→$200 range
    remaining -= t2
  }

  // Tier 3: 150k–500k at $0.0012/token
  if (remaining > 0) {
    const t3 = Math.min(remaining, 350_000)
    price += t3 * 0.0012
    remaining -= t3
  }

  // Tier 4: 500k–1M at $0.00076/token (volume discount)
  if (remaining > 0) {
    price += remaining * 0.00076
  }

  return Math.max(MIN_PRICE_USD, Math.min(MAX_PRICE_USD, Math.round(price)))
}

function formatNumber(n: number): string {
  return n.toLocaleString('en-US')
}

// SWR fetcher for token balance endpoint
const fetcher = (url: string) =>
  fetch(url, { credentials: 'include' }).then((r) => {
    if (!r.ok) throw new Error('Failed to load balance')
    return r.json()
  })

interface BalanceResponse {
  balance:        number
  lifetimeEarned: number
  lifetimeSpent:  number
  demo?:          boolean
}

export default function CustomPricingCalculator() {
  const [tokens, setTokens]               = useState<number>(DEFAULT_TOKENS)
  const [checkoutLoading, setCheckout]    = useState<boolean>(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  // Pull user token balance (quietly falls back to demo mode if not signed in)
  const { data: balance } = useSWR<BalanceResponse>(
    '/api/tokens/balance',
    fetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false },
  )

  const priceUSD = useMemo(() => calcPrice(tokens), [tokens])

  const breakdown = useMemo(
    () => ({
      chats:  Math.floor(tokens / AVG_TOKENS_PER_CHAT),
      images: Math.floor(tokens / AVG_TOKENS_PER_IMAGE),
      meshes: Math.floor(tokens / AVG_TOKENS_PER_MESH),
    }),
    [tokens],
  )

  // Slider fill percentage for the gradient track
  const fillPct = useMemo(
    () => ((tokens - MIN_TOKENS) / (MAX_TOKENS - MIN_TOKENS)) * 100,
    [tokens],
  )

  // One-click "subscribe to custom plan" — hits our API, then either
  //   (a) redirects to a real Stripe Checkout URL if the server returns one,
  //   (b) routes the user to sign-up pre-loaded with `?plan=custom` and
  //       `?tokens=N` so the flow can resume after auth, or
  //   (c) surfaces a Stripe-config error inline.
  const handleCheckout = useCallback(async () => {
    setCheckout(true)
    setCheckoutError(null)
    try {
      const res = await fetch('/api/billing/custom-plan', {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify({ monthlyTokens: tokens }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(data?.error || `Checkout failed (${res.status})`)
      }
      // Happy path: real Stripe Session URL.
      if (typeof data?.checkoutUrl === 'string' && data.checkoutUrl.length > 0) {
        window.location.href = data.checkoutUrl
        return
      }
      // Server-side Stripe-config error — show it inline, don't navigate.
      if (typeof data?.checkoutError === 'string') {
        throw new Error(data.checkoutError)
      }
      // Response shape { priceUSD, breakdown, mock: false } with no
      // checkoutUrl means the server knows the price but couldn't start
      // a real checkout — almost always because the user is signed out.
      // Send them to sign-up with enough params to resume after auth,
      // and preserve /pricing as the return URL so one click after
      // sign-up drops them right back on this calculator.
      const returnTo = '/pricing#custom-plan'
      window.location.href = `/sign-up?plan=custom&tokens=${tokens}&redirect_url=${encodeURIComponent(returnTo)}`
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setCheckout(false)
    }
  }, [tokens])

  // Keyboard arrow support — accessibility
  const sliderRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    const el = sliderRef.current
    if (!el) return
    el.setAttribute('aria-valuetext', `${formatNumber(tokens)} tokens for $${priceUSD} per month`)
  }, [tokens, priceUSD])

  const spentThisMonth = balance && !balance.demo ? balance.lifetimeSpent : null

  return (
    <div className="max-w-4xl mx-auto mb-24">
      {/* ────────────── Heading ────────────── */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/5">
          <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span className="text-[11px] font-semibold tracking-wider uppercase text-[#D4AF37]">
            Custom plan
          </span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
          Or <span className="gradient-text">build your own</span>
        </h2>
        <p className="text-[#6B7699] text-sm max-w-lg mx-auto">
          Drag the slider to pick exactly how many tokens you need.
          Price updates instantly. Cancel anytime.
        </p>
      </div>

      {/* ────────────── Calculator card ────────────── */}
      <div
        className="relative overflow-hidden rounded-[12px] border border-[#1E2A4A] p-6 sm:p-8"
        style={{
          background: 'linear-gradient(135deg, rgba(13,17,32,0.95) 0%, rgba(10,14,26,0.95) 100%)',
          boxShadow:  '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
        }}
      >
        {/* Gold ambient glow — top right */}
        <div
          aria-hidden="true"
          className="absolute -top-24 -right-24 w-64 h-64 pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(212,175,55,0.10) 0%, transparent 70%)',
          }}
        />

        {/* ───── Headline row: token count + price ───── */}
        <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7699] mb-2">
              Tokens per month
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-bold text-white tabular-nums">
                {formatNumber(tokens)}
              </span>
              <span className="text-sm text-[#6B7699]">/month</span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7699] mb-2">
              Your price
            </div>
            <div className="flex items-baseline gap-1 justify-end">
              <span className="text-3xl sm:text-4xl font-bold text-[#D4AF37] tabular-nums">
                ${priceUSD}
              </span>
              <span className="text-sm text-[#6B7699]">/mo</span>
            </div>
          </div>
        </div>

        {/* ───── Slider ───── */}
        <div className="relative mb-3">
          <input
            ref={sliderRef}
            type="range"
            min={MIN_TOKENS}
            max={MAX_TOKENS}
            step={STEP_TOKENS}
            value={tokens}
            onChange={(e) => setTokens(Number(e.target.value))}
            aria-label="Tokens per month"
            aria-valuemin={MIN_TOKENS}
            aria-valuemax={MAX_TOKENS}
            aria-valuenow={tokens}
            className="custom-pricing-slider w-full h-3 appearance-none cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50"
            style={{
              background: `linear-gradient(to right, #D4AF37 0%, #FFD966 ${fillPct}%, #1E2A4A ${fillPct}%, #1E2A4A 100%)`,
              touchAction: 'pan-y',
            }}
          />
          <div className="flex justify-between text-[10px] text-[#6B7699] mt-2 font-medium">
            <span>{formatNumber(MIN_TOKENS)}</span>
            <span>{formatNumber(MAX_TOKENS)}</span>
          </div>
        </div>

        {/* ───── Breakdown (what your tokens buy) ───── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
          <BreakdownCard
            icon={MessageSquare}
            label="AI chat messages"
            value={breakdown.chats}
            tint="#60A5FA"
          />
          <BreakdownCard
            icon={ImageIcon}
            label="Image generations"
            value={breakdown.images}
            tint="#A78BFA"
          />
          <BreakdownCard
            icon={Box}
            label="3D meshes"
            value={breakdown.meshes}
            tint="#D4AF37"
          />
        </div>

        {/* ───── Usage row (if signed in) ───── */}
        {spentThisMonth !== null && (
          <div className="mt-6 pt-5 border-t border-[#1E2A4A] flex items-center justify-between text-sm">
            <div className="text-[#6B7699]">
              Spent so far this month
            </div>
            <div className="text-white font-semibold tabular-nums">
              {formatNumber(spentThisMonth)} tokens
            </div>
          </div>
        )}

        {/* ───── CTA ───── */}
        <div className="mt-7">
          <button
            type="button"
            onClick={handleCheckout}
            disabled={checkoutLoading}
            className="group w-full flex items-center justify-center gap-2 rounded-[12px] py-3.5 px-6 font-semibold text-[#0A0810] transition-all duration-200 hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #FFD966 100%)',
              boxShadow:  '0 4px 18px rgba(212,175,55,0.4)',
            }}
          >
            {checkoutLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating your plan…</span>
              </>
            ) : (
              <>
                <span>Subscribe to custom plan — ${priceUSD}/mo</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>

          {checkoutError && (
            <p role="alert" className="mt-3 text-xs text-red-400 text-center">
              {checkoutError}
            </p>
          )}

          <p className="mt-3 text-[11px] text-[#6B7699] text-center">
            ${MIN_PRICE_USD}/mo minimum · ${MAX_PRICE_USD}/mo maximum · Volume discount above 30k tokens · Cancel anytime
          </p>

          {/* Contact sales hint when at the max */}
          {tokens >= MAX_TOKENS && (
            <div
              className="mt-4 p-3 rounded-xl flex items-center justify-between gap-3"
              style={{
                background: 'rgba(212,175,55,0.06)',
                border: '1px solid rgba(212,175,55,0.2)',
              }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Sparkles className="w-4 h-4 text-[#D4AF37] flex-shrink-0" />
                <span className="text-xs text-[#D4AF37] font-medium">
                  Need more than 1M tokens?
                </span>
              </div>
              <a
                href="mailto:sales@forjegames.com?subject=Enterprise%20pricing"
                className="text-xs font-bold text-[#D4AF37] hover:text-[#FFD966] transition-colors whitespace-nowrap"
              >
                Contact sales →
              </a>
            </div>
          )}
        </div>
      </div>

      {/* ────────────── Scoped slider thumb styles ────────────── */}
      <style jsx>{`
        .custom-pricing-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ffd966 0%, #d4af37 100%);
          border: 2px solid #0a0e1a;
          box-shadow: 0 2px 12px rgba(212, 175, 55, 0.5);
          cursor: grab;
          transition: transform 0.15s ease;
        }
        .custom-pricing-slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }
        .custom-pricing-slider::-webkit-slider-thumb:active {
          cursor: grabbing;
          transform: scale(1.15);
        }
        .custom-pricing-slider::-moz-range-thumb {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ffd966 0%, #d4af37 100%);
          border: 2px solid #0a0e1a;
          box-shadow: 0 2px 12px rgba(212, 175, 55, 0.5);
          cursor: grab;
          transition: transform 0.15s ease;
        }
        .custom-pricing-slider::-moz-range-thumb:hover {
          transform: scale(1.1);
        }
      `}</style>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Breakdown card — "what X tokens will buy you" row
// ─────────────────────────────────────────────────────────────────────────────
interface BreakdownCardProps {
  icon:  React.ComponentType<{ className?: string }>
  label: string
  value: number
  tint:  string
}

function BreakdownCard({ icon: Icon, label, value, tint }: BreakdownCardProps) {
  return (
    <div
      className="rounded-[12px] border border-[#1E2A4A] p-4 transition-colors hover:border-[#2A3870]"
      style={{ background: 'rgba(255,255,255,0.02)' }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: `${tint}14`, border: `1px solid ${tint}33` }}
        >
          <Icon className="w-3.5 h-3.5" />
        </div>
        <span className="text-[11px] font-medium text-[#6B7699] uppercase tracking-wide">
          {label}
        </span>
      </div>
      <div className="text-2xl font-bold text-white tabular-nums">
        {formatNumber(value)}
      </div>
    </div>
  )
}
