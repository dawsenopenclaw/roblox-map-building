'use client'

import { useState, useRef, useEffect, useId, useCallback } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import {
  Check,
  X,
  ChevronDown,
  Heart,
  Zap,
  Star,
  Rocket,
  Building2,
  Sparkles,
  Crown,
  Shield,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const ANNUAL_TOTALS = {
  HOBBY:   95.90,
  CREATOR: 239.90,
  STUDIO:  479.90,
}

const TIERS = [
  {
    key: 'FREE',
    name: 'Free',
    icon: Zap,
    priceMonthly: 0,
    priceYearly: 0,
    yearlyTotal: 0,
    tagline: 'Build real games — no card needed',
    highlight: false,
    badge: null,
    cta: 'Start Free',
    ctaHref: '/editor',
    features: [
      '1,000 tokens / month',
      '1 project',
      'AI script generation',
      'Basic terrain generation',
      'Live Studio sync',
      'Basic templates',
      'Community support',
      'COPPA compliant',
    ],
  },
  {
    key: 'HOBBY',
    name: 'Hobby',
    icon: Star,
    priceMonthly: 9.99,
    priceYearly: 7.99,
    yearlyTotal: ANNUAL_TOTALS.HOBBY,
    tagline: 'For hobbyists leveling up fast',
    highlight: false,
    badge: null,
    cta: 'Get Hobby',
    ctaHref: '/sign-up?plan=hobby',
    features: [
      '2,000 tokens / month',
      '5 projects',
      'Voice-to-game',
      'Image-to-map',
      'Terrain generation',
      '3D asset generation',
      'Email support',
    ],
  },
  {
    key: 'CREATOR',
    name: 'Creator',
    icon: Rocket,
    priceMonthly: 24.99,
    priceYearly: 19.99,
    yearlyTotal: ANNUAL_TOTALS.CREATOR,
    tagline: 'For serious creators who ship',
    highlight: true,
    badge: 'Most Popular',
    cta: 'Get Creator',
    ctaHref: '/sign-up?plan=creator',
    features: [
      '7,000 tokens / month',
      'Unlimited projects',
      'Voice-to-game + image-to-map',
      'Terrain & 3D asset generation',
      'UI builder & economy design',
      'Marketplace access + selling',
      'Team collaboration (3 members)',
      'Game DNA scanner',
      'Priority support',
      'Advanced analytics',
    ],
  },
  {
    key: 'STUDIO',
    name: 'Studio',
    icon: Building2,
    priceMonthly: 49.99,
    priceYearly: 39.99,
    yearlyTotal: ANNUAL_TOTALS.STUDIO,
    tagline: 'For agencies & game studios',
    highlight: false,
    badge: null,
    cta: 'Get Studio',
    ctaHref: '/sign-up?plan=studio',
    features: [
      '20,000 tokens / month',
      'Unlimited projects',
      'All Creator features',
      'Full terrain & world generation',
      'Bulk 3D asset generation',
      'Full API access + SDKs',
      'White-label exports',
      'Team collaboration (50 members)',
      'Dedicated support',
      'Priority AI queue',
      'Custom integrations',
    ],
  },
] as const

// Feature matrix for comparison table (4 tiers, 9 rows)
const COMPARE_FEATURES = [
  { label: 'Tokens / month',     free: '1,000',     hobby: '2,000',     creator: '7,000',    studio: '20,000'    },
  { label: 'AI Models',          free: 'Basic',     hobby: 'Standard',  creator: 'Advanced', studio: 'Advanced'  },
  { label: 'Voice Commands',     free: false,       hobby: true,        creator: true,       studio: true        },
  { label: 'Image-to-Map',       free: false,       hobby: true,        creator: true,       studio: true        },
  { label: 'Game DNA',           free: false,       hobby: false,       creator: true,       studio: true        },
  { label: 'Marketplace',        free: false,       hobby: false,       creator: true,       studio: true        },
  { label: 'Team Members',       free: 'Solo',      hobby: 'Solo',      creator: '3',        studio: '50'        },
  { label: 'API Access',         free: false,       hobby: false,       creator: false,      studio: true        },
  { label: 'Support Level',      free: 'Community', hobby: 'Email',     creator: 'Priority', studio: 'Dedicated' },
]

const TOKEN_PACKS = [
  {
    name: 'Starter',
    tokens: '1,000',
    price: '$10',
    badge: null,
    description: 'Perfect for one-off projects',
  },
  {
    name: 'Creator',
    tokens: '5,000',
    price: '$45',
    badge: null,
    description: 'Stock up and keep building',
  },
  {
    name: 'Pro',
    tokens: '15,000',
    price: '$120',
    badge: 'Best Value',
    description: 'Best price per token',
  },
]

const FAQ = [
  {
    q: 'What is a token and how are they used?',
    a: 'Tokens are the currency for AI operations on ForjeGames. Each generation — terrain, buildings, scripts, maps, voice commands — consumes tokens. Simple generations cost fewer; complex multi-step builds cost more. Your monthly allocation resets every billing cycle.',
  },
  {
    q: 'How does annual billing work?',
    a: 'Annual billing charges you once per year at a 20% discount vs. monthly. Hobby is billed at $95.90/yr ($7.99/mo), Creator at $239.90/yr ($19.99/mo), Studio at $479.90/yr ($39.99/mo). Switch billing cycles anytime from account settings.',
  },
  {
    q: 'Can I buy extra tokens without upgrading my plan?',
    a: 'Yes. Token packs let you add tokens to any plan without changing your subscription. Packs never expire — they roll over month to month until used.',
  },
  {
    q: 'Can I upgrade, downgrade, or cancel anytime?',
    a: 'Yes to all three. Upgrades take effect immediately and are prorated. Downgrades take effect at your next billing cycle so you keep features you\'ve already paid for. Cancellations are instant with no fees — you retain access until the period ends.',
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(p: number) {
  return p % 1 === 0 ? `$${p}` : `$${p.toFixed(2)}`
}

// ---------------------------------------------------------------------------
// FaqItem — animated accordion
// ---------------------------------------------------------------------------

function FaqItem({
  q,
  a,
  isOpen,
  onToggle,
}: {
  q: string
  a: string
  isOpen: boolean
  onToggle: () => void
}) {
  const bodyRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(0)
  const uid = useId()
  const panelId = `faq-panel-${uid}`
  const buttonId = `faq-btn-${uid}`

  useEffect(() => {
    if (!bodyRef.current) return
    setHeight(isOpen ? bodyRef.current.scrollHeight : 0)
  }, [isOpen])

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
        isOpen
          ? 'border-[rgba(212,175,55,0.25)] bg-[#0D1225]'
          : 'border-[#141C35] bg-[#0A0F1E] hover:border-[#1E2A4A]'
      }`}
    >
      <button
        id={buttonId}
        onClick={onToggle}
        className="w-full flex items-center justify-between px-6 py-5 text-left transition-colors"
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        <span
          className={`font-semibold text-sm pr-6 transition-colors ${
            isOpen ? 'text-white' : 'text-[#CBD2E8]'
          }`}
        >
          {q}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`w-4 h-4 flex-shrink-0 transition-all duration-300 ${
            isOpen ? 'rotate-180 text-[#D4AF37]' : 'text-[#4A5580]'
          }`}
        />
      </button>
      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        style={{
          height,
          overflow: 'hidden',
          transition: 'height 280ms cubic-bezier(0.4, 0, 0.2, 1)',
          willChange: 'height',
        }}
      >
        <div ref={bodyRef} className="px-6 pb-5 pt-0">
          <p className="text-[#6B7699] text-sm leading-relaxed">{a}</p>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// CompareCell
// ---------------------------------------------------------------------------

function CompareCell({
  value,
  isCreator = false,
  isCustom = false,
}: {
  value: string | boolean
  isCreator?: boolean
  isCustom?: boolean
}) {
  if (typeof value === 'boolean') {
    return value ? (
      <Check
        className={`w-5 h-5 mx-auto ${
          isCreator ? 'text-[#D4AF37]' : isCustom ? 'text-[#A78BFA]' : 'text-emerald-400'
        }`}
      />
    ) : (
      <X className="w-4 h-4 text-[#252D4A] mx-auto" />
    )
  }
  return (
    <span
      className={`text-[15px] font-medium ${
        isCreator
          ? 'text-[#FFD966]'
          : isCustom
          ? 'text-[#C4B5FD]'
          : 'text-[#8B95B0]'
      }`}
    >
      {value}
    </span>
  )
}

// ---------------------------------------------------------------------------
// TokenPacksSection
// ---------------------------------------------------------------------------

function TokenPacksSection() {
  return (
    <section className="mb-24">
      <div className="text-center mb-10">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
          Need more tokens?
        </h2>
        <p className="text-[#6B7699] text-sm max-w-md mx-auto leading-relaxed">
          Top up any plan with a one-time token pack. Packs never expire — they roll over until used.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
        {TOKEN_PACKS.map((pack) => {
          const isBestValue = pack.badge === 'Best Value'
          return (
            <div
              key={pack.name}
              className={`relative flex flex-col rounded-2xl border p-6 transition-all duration-300 group hover:-translate-y-1 ${
                isBestValue
                  ? 'border-[rgba(212,175,55,0.4)] shadow-[0_0_40px_rgba(212,175,55,0.12)]'
                  : 'border-[#141C35] bg-[#0A0F1E] hover:border-[#1E2A4A] hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)]'
              }`}
              style={
                isBestValue
                  ? { background: 'linear-gradient(160deg, #0D1226 0%, #0A0E20 50%, #0C1128 100%)' }
                  : {}
              }
            >
              {/* Best Value badge */}
              {isBestValue && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span
                    className="inline-flex items-center gap-1.5 text-xs font-extrabold px-4 py-1.5 rounded-full text-[#0A0810] whitespace-nowrap shadow-[0_4px_16px_rgba(212,175,55,0.5)]"
                    style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #FFD966 100%)' }}
                  >
                    <Sparkles className="w-3 h-3" />
                    {pack.badge}
                  </span>
                </div>
              )}

              {/* Gold ambient glow for best value */}
              {isBestValue && (
                <div
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    inset: '-20px',
                    background: 'radial-gradient(ellipse at 50% 30%, rgba(212,175,55,0.14) 0%, transparent 65%)',
                    filter: 'blur(16px)',
                    pointerEvents: 'none',
                    zIndex: 0,
                    borderRadius: '2rem',
                  }}
                />
              )}

              <div className="relative z-10">
                <p
                  className={`text-lg font-bold mb-1 ${isBestValue ? 'text-[#D4AF37]' : 'text-white'}`}
                >
                  {pack.name}
                </p>
                <p className="text-[#6B7699] text-sm mb-5">{pack.description}</p>

                <div className="flex items-end gap-1.5 mb-1">
                  <span
                    className={`text-4xl font-extrabold tracking-tight ${isBestValue ? 'text-white' : 'text-white'}`}
                  >
                    {pack.price}
                  </span>
                </div>
                <p
                  className={`text-sm font-semibold mb-6 ${isBestValue ? 'text-[#D4AF37]' : 'text-[#8B95B0]'}`}
                >
                  {pack.tokens} tokens
                </p>

                <Link
                  href="/sign-up"
                  className={`block text-center font-bold py-3 rounded-xl text-sm transition-all duration-200 hover:opacity-90 hover:scale-[1.02] active:scale-[0.99] ${
                    isBestValue
                      ? 'text-[#0A0810] shadow-[0_4px_20px_rgba(212,175,55,0.4)]'
                      : 'border border-[#1E2A4A] text-[#CBD2E8] hover:border-[#2A3870] hover:bg-white/[0.04]'
                  }`}
                  style={
                    isBestValue
                      ? { background: 'linear-gradient(135deg, #D4AF37 0%, #FFD966 100%)' }
                      : {}
                  }
                >
                  Buy Pack
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// SubscribeCta — handles checkout for paid tiers + current-plan state
// ---------------------------------------------------------------------------

type SubscribeCtaProps = {
  tierKey: string
  highlight: boolean
  cta: string
  ctaHref: string
  annual: boolean
  currentTier: string | null
  onManageBilling: () => void
}

function SubscribeCta({ tierKey, highlight, cta, ctaHref, annual, currentTier, onManageBilling }: SubscribeCtaProps) {
  const [loading, setLoading] = useState(false)

  const isCurrent = currentTier !== null && currentTier === tierKey
  const isSubscribed = currentTier !== null && currentTier !== 'FREE'

  const baseHighlight = `text-[#0A0810] hover:opacity-90 hover:scale-[1.02] shadow-[0_6px_32px_rgba(212,175,55,0.5)] active:scale-[0.99]`
  const baseDefault = `border border-[#1E2A4A] text-[#CBD2E8] hover:border-[#2A3870] hover:bg-white/[0.04] hover:text-white active:scale-[0.99]`
  const baseCurrent = `border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/5 active:scale-[0.99]`

  const className = `block text-center font-bold py-4 rounded-xl text-base transition-all duration-200 mb-2 disabled:opacity-60 disabled:cursor-not-allowed ${
    isCurrent ? baseCurrent : highlight ? baseHighlight : baseDefault
  }`

  const style = isCurrent
    ? {}
    : highlight
    ? { background: 'linear-gradient(135deg, #D4AF37 0%, #FFD966 100%)' }
    : {}

  // Free tier — plain link
  if (tierKey === 'FREE') {
    return (
      <Link href={ctaHref} className={className} style={style}>
        {isCurrent ? 'Current Plan' : cta}
      </Link>
    )
  }

  // Current paid tier — open billing portal
  if (isCurrent) {
    return (
      <button className={className} style={style} onClick={onManageBilling}>
        Manage Plan
      </button>
    )
  }

  // Other paid tiers — checkout
  async function handleCheckout() {
    setLoading(true)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'subscription',
          tier: tierKey,
          yearly: annual,
        }),
      })
      const data = await res.json() as { url?: string; demo?: boolean }
      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      window.location.href = ctaHref
    } finally {
      setLoading(false)
    }
  }

  // Not yet subscribed and this tier needs auth — fall through to sign-up if demo
  const label = loading ? 'Redirecting...' : isSubscribed ? 'Switch Plan' : cta

  return (
    <button
      className={className}
      style={style}
      onClick={handleCheckout}
      disabled={loading}
    >
      {label}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function PricingClient() {
  const [annual, setAnnual]   = useState(false)
  const [openFaq, setOpenFaq] = useState<string | null>(null)

  // Fetch current billing status to highlight active plan
  const { data: billingStatus } = useSWR<{ tier: string } | null>(
    '/api/billing/status',
    (url: string) => fetch(url).then(r => r.ok ? r.json() as Promise<{ tier: string }> : null),
    { revalidateOnFocus: false }
  )
  const currentTier: string | null = billingStatus?.tier ?? null

  const openBillingPortal = useCallback(async () => {
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      const data = await res.json() as { url: string }
      if (data.url) window.location.href = data.url
    } catch {
      window.location.href = '/billing'
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#050810] text-white overflow-hidden">

      {/* Ambient background orbs */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden"
        style={{ zIndex: 0 }}
      >
        {/* Top-center warm orb */}
        <div
          style={{
            position: 'absolute',
            top: '-10%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '900px',
            height: '600px',
            background:
              'radial-gradient(ellipse at center, rgba(212,175,55,0.045) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
        {/* Bottom-left cool orb */}
        <div
          style={{
            position: 'absolute',
            bottom: '0',
            left: '-5%',
            width: '700px',
            height: '500px',
            background:
              'radial-gradient(ellipse at center, rgba(99,102,241,0.04) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
        {/* Bottom-right purple orb (for Custom tier visibility) */}
        <div
          style={{
            position: 'absolute',
            bottom: '10%',
            right: '-5%',
            width: '600px',
            height: '500px',
            background:
              'radial-gradient(ellipse at center, rgba(124,58,237,0.04) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
      </div>

      <div
        className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24"
        style={{ zIndex: 1 }}
      >

        {/* ------------------------------------------------------------------ */}
        {/* Header                                                              */}
        {/* ------------------------------------------------------------------ */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-full px-4 py-1.5 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="text-xs font-bold tracking-widest uppercase text-[#D4AF37]">
              Pricing
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-5">
            <span
              style={{
                background: 'linear-gradient(135deg, #FFFFFF 0%, #CBD2E8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Simple,{' '}
            </span>
            <span
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #FFD966 60%, #D4AF37 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              transparent
            </span>
            <br />
            <span
              style={{
                background: 'linear-gradient(135deg, #FFFFFF 0%, #CBD2E8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              pricing
            </span>
          </h1>

          <p className="text-lg text-[#6B7699] mb-6 max-w-lg mx-auto leading-relaxed">
            Start free. No credit card required.
            <br />
            Upgrade when you&apos;re ready.
          </p>

          {/* Competitor differentiation badge */}
          <div className="inline-flex items-center gap-2 rounded-full px-5 py-2 mb-10 text-sm font-medium"
            style={{
              background: 'rgba(212,175,55,0.07)',
              border: '1px solid rgba(212,175,55,0.2)',
              color: '#D4AF37',
            }}
          >
            <Shield className="w-4 h-4 flex-shrink-0" />
            The only Roblox AI that builds terrain, scripts, 3D assets, UI &amp; economy — not just code
          </div>

          {/* Billing toggle */}
          <div className="inline-flex items-center bg-[#0A0F1E] border border-[#141C35] rounded-full p-1.5 gap-1">
            <button
              onClick={() => setAnnual(false)}
              className={`px-7 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                !annual ? 'text-[#0A0810] shadow-lg' : 'text-[#6B7699] hover:text-white'
              }`}
              style={
                !annual
                  ? { background: 'linear-gradient(135deg, #D4AF37 0%, #FFD966 100%)' }
                  : {}
              }
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-7 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 flex items-center gap-2.5 ${
                annual ? 'text-[#0A0810] shadow-lg' : 'text-[#6B7699] hover:text-white'
              }`}
              style={
                annual
                  ? { background: 'linear-gradient(135deg, #D4AF37 0%, #FFD966 100%)' }
                  : {}
              }
            >
              Annual
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                  annual
                    ? 'bg-black/20 text-black'
                    : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                }`}
              >
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Tier Cards                                                          */}
        {/* ------------------------------------------------------------------ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-16 items-start">
          {TIERS.map((tier) => {
            const price = annual ? tier.priceYearly : tier.priceMonthly
            const Icon  = tier.icon

            return (
              <div
                key={tier.key}
                className="relative flex flex-col group"
                style={tier.highlight ? { marginTop: '-16px', marginBottom: '-16px' } : {}}
              >
                {/* Creator card glow orb */}
                {tier.highlight && (
                  <div
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      inset: '-30px',
                      background:
                        'radial-gradient(ellipse at 50% 40%, rgba(212,175,55,0.18) 0%, transparent 65%)',
                      filter: 'blur(20px)',
                      pointerEvents: 'none',
                      zIndex: 0,
                      borderRadius: '2rem',
                    }}
                  />
                )}

                <div
                  className={`relative flex flex-col rounded-2xl border transition-all duration-300 ${
                    tier.highlight
                      ? 'border-[rgba(212,175,55,0.4)] shadow-[0_0_60px_rgba(212,175,55,0.15),0_20px_60px_rgba(0,0,0,0.6)] pt-10 pb-10 px-6 group-hover:-translate-y-2 group-hover:shadow-[0_0_80px_rgba(212,175,55,0.22),0_30px_80px_rgba(0,0,0,0.7)]'
                      : 'bg-[#0A0F1E] border-[#141C35] p-6 group-hover:-translate-y-1.5 group-hover:border-[#1E2A4A] group-hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)]'
                  }`}
                  style={
                    tier.highlight
                      ? {
                          background: 'linear-gradient(160deg, #0D1226 0%, #0A0E20 50%, #0C1128 100%)',
                          zIndex: 1,
                        }
                      : { zIndex: 1 }
                  }
                >
                  {/* Most Popular badge */}
                  {tier.badge && (
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                      <span
                        className="inline-flex items-center gap-1.5 text-sm font-extrabold px-5 py-2 rounded-full text-[#0A0810] whitespace-nowrap shadow-[0_4px_20px_rgba(212,175,55,0.6)]"
                        style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #FFD966 100%)' }}
                      >
                        <Crown className="w-3.5 h-3.5" />
                        {tier.badge}
                      </span>
                    </div>
                  )}

                  {/* Icon + name + tagline */}
                  <div className="mb-6">
                    <div
                      className={`inline-flex items-center justify-center w-11 h-11 rounded-xl mb-4 ${
                        tier.highlight
                          ? 'bg-[#D4AF37]/15 text-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.2)]'
                          : 'bg-white/[0.06] text-[#6B7699]'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <p
                      className={`text-2xl font-bold mb-1 ${
                        tier.highlight ? 'text-[#D4AF37]' : 'text-white'
                      }`}
                    >
                      {tier.name}
                    </p>
                    <p className="text-[#6B7699] text-base">{tier.tagline}</p>
                  </div>

                  {/* Price block */}
                  <div className="mb-6 min-h-[80px]">
                    {price === 0 ? (
                      <>
                        <p className="text-5xl font-extrabold text-white tracking-tight">Free</p>
                        <p className="text-xs text-[#6B7699] mt-1.5">Forever free</p>
                      </>
                    ) : (
                      <>
                        <div className="flex items-end gap-1">
                          <p className="text-5xl font-extrabold text-white tracking-tight">
                            {formatPrice(price as number)}
                          </p>
                          <span className="text-[#6B7699] text-sm mb-2.5">/mo</span>
                        </div>
                        {annual ? (
                          <p className="text-xs text-[#6B7699] mt-1.5">
                            Billed annually at{' '}
                            <span className="text-[#8B95B0] font-medium">
                              {formatPrice(tier.yearlyTotal as number)}/yr
                            </span>
                          </p>
                        ) : (
                          <p className="text-xs text-[#6B7699] mt-1.5">
                            or{' '}
                            <span className="text-[#D4AF37] font-semibold">
                              {formatPrice(tier.priceYearly as number)}/mo
                            </span>{' '}
                            billed annually
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  {/* CTA button */}
                  <SubscribeCta
                    tierKey={tier.key}
                    highlight={tier.highlight}
                    cta={tier.cta}
                    ctaHref={tier.ctaHref}
                    annual={annual}
                    currentTier={currentTier}
                    onManageBilling={openBillingPortal}
                  />

                  {/* Trial / free notice */}
                  <p className="text-center text-[11px] text-[#3D4A6A] mb-6 leading-relaxed">
                    {(tier.priceMonthly as number) > 0
                      ? '14-day free trial · No credit card required'
                      : 'No credit card required'}
                  </p>

                  {/* Divider */}
                  <div
                    className={`h-px mb-5 ${
                      tier.highlight
                        ? 'bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent'
                        : 'bg-[#141C35]'
                    }`}
                  />

                  {/* Features list */}
                  <ul className="space-y-3.5 flex-1">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                            tier.highlight ? 'bg-[#D4AF37]/15' : 'bg-white/[0.06]'
                          }`}
                        >
                          <Check
                            className={`w-3 h-3 ${
                              tier.highlight ? 'text-[#D4AF37]' : 'text-[#6B7699]'
                            }`}
                          />
                        </div>
                        <span
                          className={`text-[15px] leading-snug ${
                            tier.highlight ? 'text-[#E8EBF5]' : 'text-[#8B95B0]'
                          }`}
                        >
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )
          })}
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Trust bar                                                           */}
        {/* ------------------------------------------------------------------ */}
        <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-3 mb-24 pt-4">
          {[
            { icon: Shield, label: 'COPPA compliant' },
            { label: 'No contracts' },
            { label: 'Cancel anytime' },
            { label: 'SSL encrypted' },
            { label: '14-day free trial' },
          ].map(({ label, icon: TrustIcon }) => (
            <span key={label} className="flex items-center gap-2 text-sm text-[#4A5580]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
              {TrustIcon && <TrustIcon className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{label}</span>
            </span>
          ))}
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Comparison table                                                    */}
        {/* ------------------------------------------------------------------ */}
        <div className="mb-24">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">Compare plans</h2>
            <p className="text-[#6B7699] text-sm">Everything you need to pick the right plan.</p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[#141C35]">
            <table className="w-full min-w-[640px] border-collapse">
              <thead>
                <tr
                  className="border-b border-[#141C35]"
                  style={{ background: 'linear-gradient(90deg, #0D1020 0%, #0A0E1A 100%)' }}
                >
                  <th className="text-left py-5 px-6 text-[15px] font-semibold text-[#6B7699] w-[30%]">
                    Feature
                  </th>
                  {TIERS.map((tier) => (
                    <th
                      key={tier.key}
                      className={`text-center py-5 px-4 text-[15px] font-bold ${
                        tier.highlight ? 'text-[#D4AF37]' : 'text-white'
                      }`}
                      style={tier.highlight ? { background: 'rgba(212,175,55,0.07)' } : {}}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span>{tier.name}</span>
                        <span className="text-sm font-normal text-[#4A5580]">
                          {annual
                            ? tier.priceYearly === 0
                              ? 'Free'
                              : `${formatPrice(tier.priceYearly as number)}/mo`
                            : tier.priceMonthly === 0
                            ? 'Free'
                            : `${formatPrice(tier.priceMonthly as number)}/mo`}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARE_FEATURES.map((row, i) => (
                  <tr
                    key={row.label}
                    className={`border-b border-[#0E1428] transition-colors hover:bg-white/[0.015] ${
                      i % 2 === 0 ? 'bg-[#080C1A]' : 'bg-[#0A0F1E]'
                    }`}
                  >
                    <td className="py-4 px-6 text-[15px] text-[#8B95B0]">{row.label}</td>
                    <td className="py-4 px-4 text-center">
                      <CompareCell value={row.free} />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <CompareCell value={row.hobby} />
                    </td>
                    <td
                      className="py-4 px-4 text-center"
                      style={{
                        background: i % 2 === 0
                          ? 'rgba(212,175,55,0.04)'
                          : 'rgba(212,175,55,0.025)',
                      }}
                    >
                      <CompareCell value={row.creator} isCreator />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <CompareCell value={row.studio} />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-[#141C35]">
                  <td className="py-6 px-6 bg-[#0A0F1E]" />
                  {TIERS.map((tier) => (
                    <td
                      key={tier.key}
                      className="py-6 px-4 text-center"
                      style={tier.highlight ? { background: 'rgba(212,175,55,0.06)' } : { background: '#0A0F1E' }}
                    >
                      <Link
                        href={tier.ctaHref}
                        className={`inline-block text-sm font-bold py-3 px-6 rounded-xl transition-all duration-200 ${
                          tier.highlight
                            ? 'text-[#0A0810] hover:opacity-90 shadow-[0_4px_18px_rgba(212,175,55,0.4)]'
                            : 'border border-[#1E2A4A] text-[#CBD2E8] hover:border-[#2A3870] hover:bg-white/[0.04]'
                        }`}
                        style={
                          tier.highlight
                            ? { background: 'linear-gradient(135deg, #D4AF37 0%, #FFD966 100%)' }
                            : {}
                        }
                      >
                        {tier.cta}
                      </Link>
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Token Packs Section                                                 */}
        {/* ------------------------------------------------------------------ */}
        <TokenPacksSection />

        {/* ------------------------------------------------------------------ */}
        {/* FAQ                                                                 */}
        {/* ------------------------------------------------------------------ */}
        <div className="max-w-2xl mx-auto mb-24">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Have questions?
            </h2>
            <p className="text-[#6B7699] text-sm">
              The answers to the most common pricing questions.
            </p>
          </div>

          <div className="space-y-2">
            {FAQ.map(({ q, a }) => (
              <FaqItem
                key={q}
                q={q}
                a={a}
                isOpen={openFaq === q}
                onToggle={() => setOpenFaq(openFaq === q ? null : q)}
              />
            ))}
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Charity callout                                                     */}
        {/* ------------------------------------------------------------------ */}
        <div className="flex justify-center">
          <div
            className="relative overflow-hidden inline-flex items-start sm:items-center gap-5 rounded-2xl border border-[#D4AF37]/15 px-7 py-5 max-w-lg w-full"
            style={{ background: 'linear-gradient(135deg, #0D1120 0%, #0A0E1A 100%)' }}
          >
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '120px',
                height: '120px',
                background: 'radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)',
                pointerEvents: 'none',
              }}
            />
            <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center">
              <Heart className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">
                10% of all revenue donated to charity
              </p>
              <p className="text-[#6B7699] text-xs mt-1 leading-relaxed">
                Every paid subscription contributes to coding and STEM education nonprofits
                worldwide. Building games, funding futures.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
