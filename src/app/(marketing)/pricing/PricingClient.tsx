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
  Hammer,
  Shield,
  AlertTriangle,
  Mail,
  Users,
  Quote,
} from 'lucide-react'
import CustomPricingCalculator from '@/components/pricing/CustomPricingCalculator'
// RobuxPayment removed — Robux payments not yet functional
import { captureClientEvent } from '@/lib/analytics-client'

// ---------------------------------------------------------------------------
// Billing config — which price IDs are live
// ---------------------------------------------------------------------------

type BillingConfig = {
  stripeConfigured: boolean
  subscriptions: {
    STARTER: { monthly: boolean; yearly: boolean }
    BUILDER: { monthly: boolean; yearly: boolean }
    HOBBY: { monthly: boolean; yearly: boolean }
    CREATOR: { monthly: boolean; yearly: boolean }
    PRO:     { monthly: boolean; yearly: boolean }
    STUDIO:  { monthly: boolean; yearly: boolean }
  }
  tokenPacks: {
    starter: boolean
    creator: boolean
    pro: boolean
  }
}

const EMPTY_CONFIG: BillingConfig = {
  stripeConfigured: false,
  subscriptions: {
    STARTER: { monthly: false, yearly: false },
    BUILDER: { monthly: false, yearly: false },
    HOBBY: { monthly: false, yearly: false },
    CREATOR: { monthly: false, yearly: false },
    PRO:     { monthly: false, yearly: false },
    STUDIO:  { monthly: false, yearly: false },
  },
  tokenPacks: { starter: false, creator: false, pro: false },
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

// Tier prices — premium positioning (we're the only all-in-one platform)
// 3-day free trial → convert fast, show value immediately
const ANNUAL_TOTALS = {
  BUILDER: 240.00,   // $20/mo annual = $240/year (20% off)
  CREATOR: 480.00,   // $40/mo annual = $480/year (20% off)
  PRO: 1440.00,      // $120/mo annual = $1440/year (20% off)
  STUDIO:  1920.00,  // $160/mo annual = $1920/year (20% off)
}

const TIERS = [
  {
    key: 'FREE',
    name: 'Test Drive',
    icon: Zap,
    priceMonthly: 0,
    priceYearly: 0,
    yearlyTotal: 0,
    tagline: '1,000 tokens to test everything — no credit card needed',
    highlight: true,
    badge: 'FREE',
    cta: 'Start Building Free',
    ctaHref: '/sign-up?plan=free',
    gameDepth: 'Small builds & props',
    features: [
      'Small builds & props',
      '1,000 tokens (one-time, never expires)',
      '50 builds per month',
      '5 AI models included',
      'Script generation',
      'Game system templates',
      'Studio plugin',
      'Community support',
    ],
  },
  {
    key: 'BUILDER',
    name: 'Builder',
    icon: Hammer,
    priceMonthly: 25,
    priceYearly: 20,
    yearlyTotal: ANNUAL_TOTALS.BUILDER,
    tagline: 'For creators getting started',
    highlight: false,
    badge: 'Most Popular',
    cta: 'Start Building',
    ctaHref: '/sign-up?plan=builder',
    gameDepth: '25% game completion / month',
    features: [
      '25% game completion / month',
      '15,000 tokens / month',
      '50 builds per day',
      'All AI build modes',
      'UI builder',
      'Game system templates',
      'Script generation',
      'Studio plugin',
      'MCP integration',
    ],
  },
  {
    key: 'CREATOR',
    name: 'Creator',
    icon: Rocket,
    priceMonthly: 50,
    priceYearly: 40,
    yearlyTotal: ANNUAL_TOTALS.CREATOR,
    tagline: 'For serious creators who ship',
    highlight: false,
    badge: null,
    cta: 'Get Creator',
    ctaHref: '/sign-up?plan=creator',
    gameDepth: '50% game completion / month',
    features: [
      '50% game completion / month',
      '40,000 tokens / month',
      'Unlimited builds',
      'All Builder features',
      '3D mesh generation',
      'Image to map',
      'Voice input',
      'MCP integration',
      'Marketplace access + selling',
      'Team collaboration (3)',
    ],
  },
  {
    key: 'PRO',
    name: 'Pro',
    icon: Crown,
    priceMonthly: 150,
    priceYearly: 120,
    yearlyTotal: ANNUAL_TOTALS.PRO,
    tagline: 'For power users and small teams',
    highlight: false,
    badge: null,
    cta: 'Go Pro',
    ctaHref: '/sign-up?plan=pro',
    gameDepth: '75% game completion / month',
    features: [
      '75% game completion / month',
      '100,000 tokens / month',
      'Unlimited everything',
      'All Creator features',
      'Priority AI queue',
      'Bulk 3D generation',
      'Game DNA scanner',
      'MCP integration',
      'Team collaboration (10)',
      'Advanced analytics',
    ],
  },
  {
    key: 'STUDIO',
    name: 'Studio',
    icon: Building2,
    priceMonthly: 200,
    priceYearly: 160,
    yearlyTotal: ANNUAL_TOTALS.STUDIO,
    tagline: 'For agencies & game studios',
    highlight: false,
    badge: null,
    cta: 'Get Studio',
    ctaHref: '/sign-up?plan=studio',
    gameDepth: '100% — unlimited full game building',
    features: [
      '100% — unlimited full game building',
      '200,000 tokens / month',
      'Unlimited everything',
      'All Pro features',
      'Full API access + SDKs',
      'MCP integration',
      'White-label builds',
      'Team collaboration (50)',
      'Dedicated support',
      'Custom integrations',
    ],
  },
] as const

// Feature matrix for comparison table (all tiers including FREE)
const COMPARE_FEATURES = [
  { label: 'Price',              free: '$0',          builder: '$25/mo',    creator: '$50/mo',    pro: '$150/mo',   studio: '$200/mo'   },
  { label: 'Game Building Depth', free: 'Props only', builder: '25%',       creator: '50%',       pro: '75%',       studio: '100%'      },
  { label: 'Tokens / month',    free: '1,000',       builder: '15,000',    creator: '40,000',    pro: '100,000',   studio: '200,000'   },
  { label: 'Builds',            free: '50/month',    builder: '50/day',    creator: 'Unlimited', pro: 'Unlimited', studio: 'Unlimited' },
  { label: 'AI Models',         free: '5',           builder: 'All',       creator: 'All',       pro: 'All',       studio: 'All'       },
  { label: 'Voice Commands',    free: false,         builder: true,        creator: true,        pro: true,        studio: true        },
  { label: 'Image-to-Map',      free: false,         builder: false,       creator: true,        pro: true,        studio: true        },
  { label: 'Script Generation', free: true,          builder: true,        creator: true,        pro: true,        studio: true        },
  { label: '3D Mesh Generation',free: false,         builder: false,       creator: true,        pro: true,        studio: true        },
  { label: 'Game Templates',    free: true,          builder: true,        creator: true,        pro: true,        studio: true        },
  { label: 'Studio Plugin',     free: true,          builder: true,        creator: true,        pro: true,        studio: true        },
  { label: 'Game DNA Scanner',  free: false,         builder: false,       creator: false,       pro: true,        studio: true        },
  { label: 'MCP Integration',  free: false,         builder: true,        creator: true,        pro: true,        studio: true        },
  { label: 'Marketplace',       free: false,         builder: false,       creator: true,        pro: true,        studio: true        },
  { label: 'Team Members',      free: 'Solo',        builder: 'Solo',      creator: '3',         pro: '10',        studio: '50'        },
  { label: 'Priority AI Queue', free: false,         builder: false,       creator: false,       pro: true,        studio: true        },
  { label: 'API Access',        free: false,         builder: false,       creator: false,       pro: false,       studio: true        },
  { label: 'Support Level',     free: 'Community',   builder: 'Standard',  creator: 'Priority',  pro: 'Priority',  studio: 'Dedicated' },
]

const TOKEN_PACKS = [
  {
    name: 'Boost',
    tokens: '5,000',
    price: '$10',
    badge: null,
    description: 'Quick top-up when you need it',
  },
  {
    name: 'Builder Pack',
    tokens: '25,000',
    price: '$40',
    badge: 'Best Value',
    description: 'Best price per token — save 20%',
  },
  {
    name: 'Studio Pack',
    tokens: '100,000',
    price: '$120',
    badge: 'Max Power',
    description: 'For studios shipping at scale — save 40%',
  },
]

const FAQ = [
  {
    q: 'Is the free plan really free?',
    a: 'Yes, 100% free. No credit card, no catch. You get 1,000 tokens to test everything — builds, scripts, templates, the Studio plugin. Tokens are a one-time grant and never expire, but they don\'t refresh monthly. Upgrade when you need more.',
  },
  {
    q: 'What is a token and how are they used?',
    a: 'Tokens are the currency for AI operations on ForjeGames. Each generation — terrain, buildings, scripts, maps, voice commands — uses tokens. Simple builds cost fewer; complex multi-step builds cost more. Your monthly tokens reset every billing cycle.',
  },
  {
    q: 'What can I build with the free plan?',
    a: 'A lot more than you think. 50 builds a month means roughly 15 houses, 10 game scripts, or 5 full game scenes. Most creators start free and upgrade once they have a game idea they want to go all-in on.',
  },
  {
    q: 'How does the 3-day free trial work on paid plans?',
    a: 'Pick any paid plan and try it free for 3 days. No credit card needed to start. If you like it, add payment before the trial ends. If not, you drop back to the Free plan automatically. No charge, no hassle.',
  },
  {
    q: 'How does annual billing work?',
    a: 'Annual billing charges you once per year at a 20% discount vs. monthly. Builder is billed at $240/yr ($20/mo), Creator at $480/yr ($40/mo), Studio at $1,920/yr ($160/mo). Switch billing cycles anytime from account settings.',
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
// useCheckout — shared hook for all checkout actions
// ---------------------------------------------------------------------------

type CheckoutPayload =
  | { type: 'subscription'; tier: string; yearly: boolean }
  | { type: 'token_pack'; packSlug: string }

// Discriminated union. The `never` stubs on the opposite arm of each
// variant force TypeScript to narrow reliably even under strict mode —
// without them, `result.redirect` in an `else` branch still reads as
// "property does not exist on CheckoutResult" because TS loses the
// narrow when property sets don't overlap. The `never` stubs give it
// a full shape to intersect and narrowing becomes automatic.
type CheckoutResult =
  | { ok: true;  url: string;  error?: never; redirect?: never }
  | { ok: false; url?: never; error: string;  redirect?: string }

async function postCheckout(payload: CheckoutPayload): Promise<CheckoutResult> {
  let res: Response
  try {
    res = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    return { ok: false, error: 'Network error — please try again.' }
  }

  let data: Record<string, unknown>
  try {
    data = (await res.json()) as Record<string, unknown>
  } catch {
    return { ok: false, error: 'Unexpected server response.' }
  }

  // Handler returns { error: 'Authentication required', redirect: '/sign-in' }
  // for unauthed users. Preserve the pricing page as the post-sign-in
  // destination so the visitor lands back here and can click Buy again
  // in one click instead of having to re-navigate from the dashboard.
  //
  // Also: the route may return 200 OR 401 with the redirect — accept both.
  // Status 200 happens when the middleware lets the request through and
  // the handler short-circuits with the redirect; status 401 happens when
  // the middleware catches it first. Treating both identically is
  // forward-compatible.
  if (typeof data.redirect === 'string') {
    const returnTo =
      typeof window !== 'undefined'
        ? window.location.pathname + window.location.search + window.location.hash
        : '/pricing'
    const sep = data.redirect.includes('?') ? '&' : '?'
    const redirectWithReturn = `${data.redirect}${sep}redirect_url=${encodeURIComponent(returnTo)}`
    return { ok: false, error: 'Sign in to continue.', redirect: redirectWithReturn }
  }
  if (!res.ok) {
    const msg = typeof data.error === 'string' ? data.error : 'Checkout failed.'
    const setup = typeof data.setup === 'string' ? ` ${data.setup}` : ''
    return { ok: false, error: `${msg}${setup}` }
  }
  if (typeof data.url === 'string') {
    return { ok: true, url: data.url }
  }
  return { ok: false, error: 'No checkout URL returned.' }
}

// ---------------------------------------------------------------------------
// ErrorToast — dismissible banner shown when checkout fails
// ---------------------------------------------------------------------------

function ErrorToast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div
      role="alert"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-start gap-3 bg-[#1A0F0F] border border-red-500/30 text-red-300 rounded-2xl px-5 py-4 shadow-2xl max-w-sm w-full text-sm"
    >
      <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-400" />
      <span className="flex-1 leading-relaxed">{message}</span>
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className="text-red-500/60 hover:text-red-400 transition-colors flex-shrink-0 mt-0.5"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Social proof — live signup counter + testimonials
// ---------------------------------------------------------------------------

const TESTIMONIALS = [
  { name: 'RblxKing42', text: "Built my first tycoon in under a minute. Took me 3 weeks to do manually last time.", tier: 'Creator' },
  { name: 'ObbyQueen_', text: "The AI actually understands what I mean. I said 'rainbow obby with checkpoints' and it just worked.", tier: 'Studio' },
  { name: 'DevJordan2013', text: "I was about to quit making games because scripting was too hard. This changed everything.", tier: 'Builder' },
  { name: 'xStarBuilder', text: "My friend showed me this and I signed up the same day. Built something real on day one.", tier: 'Builder' },
  { name: 'NovaScripts', text: "Used Ropilot before, had to bring my own API keys and it still broke half the time. This just works.", tier: 'Creator' },
  { name: 'CastleCraft_YT', text: "Made a full medieval RPG map for my YouTube video. 200+ parts. Chat told me what to change and fixed it live.", tier: 'Studio' },
]

function SocialProofSection() {
  const { data } = useSWR<{ count: number }>(
    '/api/public/signup-count',
    (url: string) => fetch(url).then(r => r.ok ? r.json() : { count: 0 }),
    { fallbackData: { count: 0 }, revalidateOnFocus: false }
  )
  const count = data?.count ?? 0
  const displayCount = count > 10 ? count : null

  const [visibleIdx, setVisibleIdx] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setVisibleIdx(i => (i + 1) % TESTIMONIALS.length), 5000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="max-w-3xl mx-auto mb-24 space-y-8">
      {/* Live counter */}
      {displayCount && (
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-[#D4AF37]/15 bg-[#D4AF37]/5">
            <Users className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-sm text-white font-medium">
              <span className="text-[#D4AF37] font-bold">{displayCount.toLocaleString()}</span> creators joined this week
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>
      )}

      {/* Testimonial carousel */}
      <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] px-8 py-7 min-h-[120px]">
        <Quote className="absolute top-4 left-4 w-8 h-8 text-[#D4AF37]/10" />
        {TESTIMONIALS.map((t, i) => (
          <div
            key={t.name}
            className="transition-all duration-500 absolute inset-0 px-8 py-7 flex flex-col justify-center"
            style={{
              opacity: i === visibleIdx ? 1 : 0,
              transform: i === visibleIdx ? 'translateY(0)' : 'translateY(8px)',
              pointerEvents: i === visibleIdx ? 'auto' : 'none',
            }}
          >
            <p className="text-white/90 text-base leading-relaxed mb-4">
              &ldquo;{t.text}&rdquo;
            </p>
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/25 flex items-center justify-center text-xs font-bold text-[#D4AF37]">
                {t.name[0]}
              </div>
              <span className="text-sm text-white/70 font-medium">{t.name}</span>
              <span className="text-xs text-[#D4AF37]/60 px-2 py-0.5 rounded-full border border-[#D4AF37]/15 bg-[#D4AF37]/5">
                {t.tier}
              </span>
            </div>
          </div>
        ))}

        {/* Dots */}
        <div className="absolute bottom-3 right-4 flex gap-1.5">
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              onClick={() => setVisibleIdx(i)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                i === visibleIdx ? 'bg-[#D4AF37] w-4' : 'bg-white/15 hover:bg-white/25'
              }`}
              aria-label={`Show testimonial ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
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
  isFree = false,
  isCreator = false,
  isCustom = false,
}: {
  value: string | boolean
  isFree?: boolean
  isCreator?: boolean
  isCustom?: boolean
}) {
  if (typeof value === 'boolean') {
    return value ? (
      <Check
        className={`w-5 h-5 mx-auto ${
          isFree ? 'text-[#D4AF37]' : isCreator ? 'text-[#D4AF37]' : isCustom ? 'text-[#A78BFA]' : 'text-emerald-400'
        }`}
      />
    ) : (
      <X className="w-4 h-4 text-[#252D4A] mx-auto" />
    )
  }
  return (
    <span
      className={`text-[15px] font-medium ${
        isFree
          ? 'text-[#FFD966] font-bold'
          : isCreator
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

// slug map: display name → API slug
const PACK_SLUGS: Record<string, string> = {
  Boost: 'starter',
  'Builder Pack': 'creator',
  'Studio Pack': 'pro',
}

function TokenPacksSection({
  onError,
  packConfig,
}: {
  onError: (msg: string) => void
  packConfig: BillingConfig['tokenPacks']
}) {
  const [loadingPack, setLoadingPack] = useState<string | null>(null)

  async function handleBuyPack(packName: string) {
    const packSlug = PACK_SLUGS[packName]
    if (!packSlug) return
    setLoadingPack(packName)
    try {
      const result = await postCheckout({ type: 'token_pack', packSlug })
      if (result.ok) {
        window.location.href = result.url
      } else {
        if (result.redirect) {
          window.location.href = result.redirect
        } else {
          console.error('[buy-pack] Error:', result.error)
          onError(result.error)
          if (typeof window !== 'undefined') {
            window.alert(`Checkout error: ${result.error}`)
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unexpected error'
      console.error('[buy-pack] Unhandled:', msg)
      onError(msg)
      if (typeof window !== 'undefined') {
        window.alert(`Checkout error: ${msg}`)
      }
    } finally {
      setLoadingPack(null)
    }
  }

  return (
    <section className="mb-24">
      <div className="text-center mb-10">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
          Choose your token pack
        </h2>
        <p className="text-[#6B7699] text-sm max-w-md mx-auto leading-relaxed">
          One-time purchase. No subscriptions. Tokens never expire — use them whenever you want.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
        {TOKEN_PACKS.map((pack) => {
          const isBestValue = pack.badge === 'Best Value'
          const isLoading = loadingPack === pack.name
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
                  <span className="text-4xl font-extrabold tracking-tight text-white">
                    {pack.price}
                  </span>
                </div>
                <p
                  className={`text-sm font-semibold mb-6 ${isBestValue ? 'text-[#D4AF37]' : 'text-[#8B95B0]'}`}
                >
                  {pack.tokens} tokens
                </p>

                {packConfig[PACK_SLUGS[pack.name] as keyof typeof packConfig] ? (
                  <button
                    onClick={() => void handleBuyPack(pack.name)}
                    disabled={isLoading}
                    className={`w-full text-center font-bold py-3 rounded-xl text-sm transition-all duration-200 hover:opacity-90 hover:scale-[1.02] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 ${
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
                    {isLoading ? 'Redirecting...' : 'Buy Pack'}
                  </button>
                ) : (
                  <a
                    href="mailto:hello@forjegames.com?subject=Token pack inquiry"
                    className="w-full block text-center font-bold py-3 rounded-xl text-sm border border-white/10 text-gray-400 hover:border-white/20 hover:text-gray-300 transition-all duration-200"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <Mail className="w-3.5 h-3.5" />
                      Contact us
                    </span>
                  </a>
                )}
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
  priceConfigured: boolean
  onManageBilling: () => void
  onError: (msg: string) => void
}

function SubscribeCta({ tierKey, highlight, cta, ctaHref, annual, currentTier, priceConfigured, onManageBilling, onError }: SubscribeCtaProps) {
  const [loading, setLoading] = useState(false)

  const isCurrent = currentTier !== null && currentTier === tierKey
  const isSubscribed = currentTier !== null && currentTier !== 'FREE'

  const baseHighlight = `text-[#0A0810] hover:opacity-90 hover:scale-[1.02] shadow-[0_6px_32px_rgba(212,175,55,0.5)] active:scale-[0.99]`
  const baseDefault = `border border-[#1E2A4A] text-[#CBD2E8] hover:border-[#2A3870] hover:bg-white/[0.04] hover:text-white active:scale-[0.99]`
  const baseCurrent = `border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/5 active:scale-[0.99]`
  const baseContactUs = `border border-white/10 text-gray-400 hover:border-white/20 hover:text-gray-300 active:scale-[0.99]`

  const className = `block text-center font-bold py-4 rounded-xl text-base transition-all duration-200 mb-2 disabled:opacity-60 disabled:cursor-not-allowed ${
    isCurrent ? baseCurrent : highlight ? `${baseHighlight} cta-shimmer` : baseDefault
  }`

  const style = isCurrent
    ? {}
    : highlight
    ? { background: 'linear-gradient(135deg, #D4AF37 0%, #FFD966 100%)' }
    : {}

  // Free tier — plain link, always available
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

  // Price not configured in Stripe — fall back to sign-up link so users can
  // still onboard. They'll be on the free tier until the price is set up.
  if (!priceConfigured) {
    return (
      <Link href={ctaHref} className={className} style={style}>
        {cta}
      </Link>
    )
  }

  // Other paid tiers — checkout
  async function handleCheckout() {
    setLoading(true)
    // ── Funnel: track payment_started ──
    try { captureClientEvent('payment_started', { tier: tierKey, annual }) } catch { /* analytics never breaks the app */ }
    try {
      const result = await postCheckout({
        type: 'subscription',
        tier: tierKey,
        yearly: annual,
      })
      if (result.ok) {
        window.location.href = result.url
      } else {
        if (result.redirect) {
          window.location.href = result.redirect
        } else {
          console.error('[checkout] Error:', result.error)
          onError(result.error)
          // Fallback alert in case toast is hidden
          if (typeof window !== 'undefined') {
            window.alert(`Checkout error: ${result.error}`)
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unexpected error'
      console.error('[checkout] Unhandled:', msg)
      onError(msg)
      if (typeof window !== 'undefined') {
        window.alert(`Checkout error: ${msg}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const label = loading ? 'Redirecting...' : isSubscribed ? 'Switch Plan' : cta

  return (
    <button
      className={className}
      style={style}
      onClick={() => void handleCheckout()}
      disabled={loading}
    >
      {label}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface PricingClientProps {
  /**
   * Billing config prerendered by the server component (pricing/page.tsx).
   * Passed to SWR as fallbackData so the paid-tier CTAs render in their
   * final state on first paint — without this, useSWR starts with
   * EMPTY_CONFIG and briefly flashes "Contact us" before hydration.
   */
  initialBillingConfig?: BillingConfig
}

export default function PricingClient({ initialBillingConfig }: PricingClientProps = {}) {
  const [annual, setAnnual]     = useState(true)
  const [openFaq, setOpenFaq]   = useState<string | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  // Plans are shown immediately on /pricing — the earlier "click to reveal"
  // gate added friction and was removed per user request. The home page has
  // its own standalone pricing section that links here.

  const showError = useCallback((msg: string) => {
    setToastMsg(msg)
  }, [])

  // Fetch current billing status to highlight active plan
  const { data: billingStatus } = useSWR<{ tier: string } | null>(
    '/api/billing/status',
    (url: string) => fetch(url).then(r => r.ok ? r.json() as Promise<{ tier: string }> : null),
    { revalidateOnFocus: false }
  )
  const currentTier: string | null = billingStatus?.tier ?? null

  // Fetch which price IDs are configured — drives adaptive CTA rendering.
  // `fallbackData` is seeded from the server-prerendered config so first
  // paint shows the real CTAs (no "Contact us" flash on hydration).
  const { data: billingConfig } = useSWR<BillingConfig>(
    '/api/billing/config',
    (url: string) => fetch(url).then(r => r.ok ? r.json() as Promise<BillingConfig> : EMPTY_CONFIG),
    { revalidateOnFocus: false, fallbackData: initialBillingConfig ?? EMPTY_CONFIG }
  )
  const config = billingConfig ?? EMPTY_CONFIG

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
        className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24"
        style={{ zIndex: 1 }}
      >

        {/* ------------------------------------------------------------------ */}
        {/* Top CTA — Start Free                                               */}
        {/* ------------------------------------------------------------------ */}
        <div className="text-center mb-8">
          <Link
            href="/sign-up?plan=free"
            className="inline-flex items-center gap-2 text-sm font-bold px-6 py-3 rounded-full transition-all duration-200 hover:scale-105 active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #FFD966 100%)',
              color: '#0A0810',
              boxShadow: '0 4px 20px rgba(212,175,55,0.4)',
            }}
          >
            <Zap className="w-4 h-4" />
            Start Building Free — No Credit Card
          </Link>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* 3-Day Free Trial Banner                                            */}
        {/* ------------------------------------------------------------------ */}
        <div
          className="relative overflow-hidden rounded-2xl mb-12 px-6 py-5 text-center"
          style={{
            background: 'linear-gradient(135deg, #D4AF37 0%, #B8941F 50%, #D4AF37 100%)',
          }}
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'repeating-linear-gradient(135deg, transparent, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 20px)',
            }}
          />
          <p className="relative text-white font-extrabold text-lg sm:text-xl mb-1">
            Try any paid plan free for 3 days
          </p>
          <p className="relative text-white/80 text-sm font-medium">
            No credit card needed. Cancel anytime. Keep everything you build.
          </p>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Header                                                              */}
        {/* ------------------------------------------------------------------ */}
        <div className="text-center mb-16">
          {/* Social proof */}
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-6">
            <Users className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="text-xs font-bold text-white/80">
              Trusted by <span className="text-[#D4AF37]">100+</span> Roblox creators
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-5">
            <span
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #FFD966 60%, #D4AF37 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Free
            </span>
            <span
              style={{
                background: 'linear-gradient(135deg, #FFFFFF 0%, #CBD2E8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {' '}to start.
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
              Pay when you&apos;re ready.
            </span>
          </h1>

          <p className="text-lg text-[#6B7699] mb-6 max-w-lg mx-auto leading-relaxed">
            Build your first Roblox game in minutes. No credit card. Upgrade only if you want more.
          </p>

          {/* Competitor differentiation */}
          <div className="flex flex-col items-center gap-2 mb-10">
            <div className="inline-flex items-center gap-2 rounded-full px-4 sm:px-5 py-2 text-xs sm:text-sm font-medium text-center"
              style={{
                background: 'rgba(212,175,55,0.07)',
                border: '1px solid rgba(212,175,55,0.2)',
                color: '#D4AF37',
              }}
            >
              <Shield className="w-4 h-4 flex-shrink-0" />
              The only Roblox AI that builds the whole game — not just scripts
            </div>
            <p className="text-[12px]" style={{ color: '#3D4A6A' }}>
              Other tools: scripts only &nbsp;&middot;&nbsp; Forje: terrain + scripts + 3D assets + UI + economy
            </p>
          </div>

        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Monthly / Annual toggle                                            */}
        {/* ------------------------------------------------------------------ */}
        <div className="flex justify-center mb-12">
          <div
            className="inline-flex items-center rounded-full p-1"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <button
              onClick={() => setAnnual(false)}
              className="px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200"
              style={{
                background: !annual ? 'rgba(212,175,55,0.15)' : 'transparent',
                color: !annual ? '#D4AF37' : '#6B7699',
                border: !annual ? '1px solid rgba(212,175,55,0.3)' : '1px solid transparent',
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className="px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 flex items-center gap-2"
              style={{
                background: annual ? 'rgba(212,175,55,0.15)' : 'transparent',
                color: annual ? '#D4AF37' : '#6B7699',
                border: annual ? '1px solid rgba(212,175,55,0.3)' : '1px solid transparent',
              }}
            >
              Annual
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}>
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Subscription tier cards                                            */}
        {/* ------------------------------------------------------------------ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-20 items-start transition-all duration-300">
          {TIERS.map((tier) => {
            const price = annual ? tier.priceYearly : tier.priceMonthly
            const Icon  = tier.icon

            return (
              <div
                key={tier.key}
                className="relative flex flex-col group"
                style={tier.highlight ? { marginTop: '-16px', marginBottom: '-16px' } : {}}
              >
                {/* FREE / highlighted card glow orb */}
                {(tier.highlight || tier.key === 'FREE') && (
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
                    tier.key === 'FREE'
                      ? 'border-[rgba(212,175,55,0.5)] shadow-[0_0_60px_rgba(212,175,55,0.2),0_20px_60px_rgba(0,0,0,0.6)] pt-10 pb-10 px-6 group-hover:-translate-y-2 group-hover:shadow-[0_0_80px_rgba(212,175,55,0.28),0_30px_80px_rgba(0,0,0,0.7)]'
                      : tier.highlight
                      ? 'border-[rgba(212,175,55,0.4)] shadow-[0_0_60px_rgba(212,175,55,0.15),0_20px_60px_rgba(0,0,0,0.6)] pt-10 pb-10 px-6 group-hover:-translate-y-2 group-hover:shadow-[0_0_80px_rgba(212,175,55,0.22),0_30px_80px_rgba(0,0,0,0.7)]'
                      : 'bg-[#0A0F1E] border-[#141C35] p-6 group-hover:-translate-y-1.5 group-hover:border-[#1E2A4A] group-hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)]'
                  }`}
                  style={
                    tier.key === 'FREE'
                      ? {
                          background: 'linear-gradient(160deg, #0D1226 0%, #0A0E20 50%, #0C1128 100%)',
                          zIndex: 1,
                        }
                      : tier.highlight
                      ? {
                          background: 'linear-gradient(160deg, #0D1226 0%, #0A0E20 50%, #0C1128 100%)',
                          zIndex: 1,
                        }
                      : { zIndex: 1 }
                  }
                >
                  {/* Tier badge */}
                  {tier.badge && (
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                      <span
                        className={`inline-flex items-center gap-1.5 font-extrabold px-5 py-2 rounded-full whitespace-nowrap ${
                          tier.key === 'FREE'
                            ? 'text-lg text-[#0A0810] shadow-[0_4px_24px_rgba(212,175,55,0.6)]'
                            : 'text-sm text-[#0A0810] shadow-[0_4px_20px_rgba(212,175,55,0.6)]'
                        }`}
                        style={{
                          background: 'linear-gradient(135deg, #D4AF37 0%, #FFD966 100%)',
                        }}
                      >
                        {tier.key === 'FREE' ? <Zap className="w-4 h-4" /> : tier.highlight ? <Crown className="w-3.5 h-3.5" /> : <Star className="w-3.5 h-3.5" />}
                        {tier.badge}
                      </span>
                    </div>
                  )}

                  {/* Icon + name + tagline */}
                  <div className="mb-6">
                    <div
                      className={`inline-flex items-center justify-center w-11 h-11 rounded-xl mb-4 ${
                        tier.key === 'FREE' || tier.highlight
                          ? 'bg-[#D4AF37]/15 text-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.2)]'
                          : 'bg-white/[0.06] text-[#6B7699]'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <p
                      className={`text-2xl font-bold mb-1 ${
                        tier.key === 'FREE' || tier.highlight ? 'text-[#D4AF37]' : 'text-white'
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
                        <p className="text-5xl font-extrabold tracking-tight" style={{
                          background: 'linear-gradient(135deg, #D4AF37 0%, #FFD966 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                        }}>$0</p>
                        <p className="text-sm text-emerald-400 font-bold mt-1.5">Free to start</p>
                        <p className="text-xs text-[#6B7699] mt-0.5">1,000 tokens · one-time · no credit card</p>
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
                    priceConfigured={
                      tier.key === 'FREE'
                        ? true
                        : annual
                        ? config.subscriptions[tier.key as keyof typeof config.subscriptions]?.yearly ?? false
                        : config.subscriptions[tier.key as keyof typeof config.subscriptions]?.monthly ?? false
                    }
                    onManageBilling={openBillingPortal}
                    onError={showError}
                  />

                  {/* Trial / free notice */}
                  <p className="text-center text-[11px] text-[#3D4A6A] mb-1 leading-relaxed">
                    {(tier.priceMonthly as number) > 0
                      ? '3-day free trial · No credit card required'
                      : (
                        <span className="text-emerald-400 font-semibold">
                          1,000 tokens · one-time grant · no credit card
                        </span>
                      )}
                  </p>
                  <div className="mb-6" />

                  {/* Divider */}
                  <div
                    className={`h-px mb-5 ${
                      tier.key === 'FREE' || tier.highlight
                        ? 'bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent'
                        : 'bg-[#141C35]'
                    }`}
                  />

                  {/* Features list */}
                  <ul className="space-y-3.5 flex-1">
                    {tier.features.map((f) => {
                      const isGameDepth = f === tier.gameDepth
                      return (
                        <li key={f} className={`flex items-start gap-3 ${isGameDepth ? 'mb-1' : ''}`}>
                          <div
                            className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                              isGameDepth
                                ? 'bg-[#D4AF37]/20'
                                : tier.key === 'FREE' || tier.highlight ? 'bg-[#D4AF37]/15' : 'bg-white/[0.06]'
                            }`}
                          >
                            {isGameDepth ? (
                              <Rocket className="w-3 h-3 text-[#D4AF37]" />
                            ) : (
                              <Check
                                className={`w-3 h-3 ${
                                  tier.key === 'FREE' || tier.highlight ? 'text-[#D4AF37]' : 'text-[#6B7699]'
                                }`}
                              />
                            )}
                          </div>
                          <div className="flex flex-col gap-1 flex-1 min-w-0">
                            <span
                              className={`text-[15px] leading-snug ${
                                isGameDepth
                                  ? 'text-[#D4AF37] font-semibold'
                                  : tier.key === 'FREE' || tier.highlight ? 'text-[#E8EBF5]' : 'text-[#8B95B0]'
                              }`}
                            >
                              {isGameDepth ? (
                                <>
                                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#D4AF37]/60 block mb-0.5">Game Depth</span>
                                  {f}
                                </>
                              ) : f}
                            </span>
                            {isGameDepth && tier.key !== 'FREE' && (
                              <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden w-full max-w-[120px]">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: tier.key === 'STUDIO' ? '100%' : tier.key === 'PRO' ? '75%' : tier.key === 'CREATOR' ? '50%' : '25%',
                                    background: 'linear-gradient(90deg, #B8941F, #D4AF37, #FFD966)',
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </div>
            )
          })}
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Custom Pricing Calculator — the 5th tier ("build your own plan")   */}
        {/* ------------------------------------------------------------------ */}
        <div className="mb-24">
          <CustomPricingCalculator />
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Token Explainer                                                    */}
        {/* ------------------------------------------------------------------ */}
        <section className="mb-24">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              What can I build with tokens?
            </h2>
            <p className="text-[#6B7699] text-sm max-w-md mx-auto leading-relaxed">
              1 token = 1 AI generation. Here&apos;s what that looks like in practice.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              { icon: Hammer, count: '~30', label: 'Houses & Buildings', desc: 'Terrain, walls, roofs, interiors — all generated' },
              { icon: Sparkles, count: '~20', label: 'Game Scripts', desc: 'Leaderboards, shops, combat systems, NPCs' },
              { icon: Rocket, count: '~10', label: 'Full Game Scenes', desc: 'Complete playable levels with logic and UI' },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-[#141C35] bg-[#0A0F1E] p-6 text-center hover:border-[#1E2A4A] transition-all duration-200"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 mb-4">
                  <item.icon className="w-6 h-6 text-[#D4AF37]" />
                </div>
                <p className="text-3xl font-extrabold text-white mb-1">{item.count}</p>
                <p className="text-sm font-bold text-[#D4AF37] mb-1">{item.label}</p>
                <p className="text-xs text-[#6B7699]">{item.desc}</p>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-[#3D4A6A] mt-6">
            Based on 100 tokens. Simple builds use fewer tokens, complex multi-step builds use more.
          </p>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* Plan Comparison Table                                               */}
        {/* ------------------------------------------------------------------ */}
        <section className="mb-24">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Compare all plans
            </h2>
            <p className="text-[#6B7699] text-sm">
              Every feature, every plan. The Free column is highlighted so you can see exactly what you get for $0.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/[0.06]" style={{ background: 'rgba(8,10,22,0.6)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-3 px-4 text-[#6B7699] font-medium">Feature</th>
                  <th className="py-3 px-4 text-[#D4AF37] font-bold" style={{ background: 'rgba(212,175,55,0.06)' }}>Test Drive</th>
                  <th className="py-3 px-4 text-white font-medium">Builder</th>
                  <th className="py-3 px-4 text-white font-medium">Creator</th>
                  <th className="py-3 px-4 text-white font-medium">Pro</th>
                  <th className="py-3 px-4 text-white font-medium">Studio</th>
                </tr>
              </thead>
              <tbody className="text-[#8B95B0]">
                {COMPARE_FEATURES.map((row) => (
                  <tr key={row.label} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 px-4 text-white font-medium">{row.label}</td>
                    <td className="py-2.5 px-4 text-center" style={{ background: 'rgba(212,175,55,0.04)' }}>
                      <CompareCell value={row.free} isFree />
                    </td>
                    <td className="py-2.5 px-4 text-center"><CompareCell value={row.builder} /></td>
                    <td className="py-2.5 px-4 text-center"><CompareCell value={row.creator} /></td>
                    <td className="py-2.5 px-4 text-center"><CompareCell value={row.pro} /></td>
                    <td className="py-2.5 px-4 text-center"><CompareCell value={row.studio} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Token Packs — supplementary */}
        <TokenPacksSection onError={showError} packConfig={config.tokenPacks} />

        {/* ------------------------------------------------------------------ */}
        {/* Trust bar                                                           */}
        {/* ------------------------------------------------------------------ */}
        <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-3 mb-24 pt-4">
          {[
            { icon: Shield, label: 'COPPA compliant' },
            { label: 'No contracts' },
            { label: 'Cancel anytime' },
            { label: 'SSL encrypted' },
            { label: '3-day free trial on all paid plans' },
          ].map(({ label, icon: TrustIcon }) => (
            <span key={label} className="flex items-center gap-2 text-sm text-[#4A5580]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
              {TrustIcon && <TrustIcon className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{label}</span>
            </span>
          ))}
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Competitor comparison                                               */}
        {/* ------------------------------------------------------------------ */}
        <div className="max-w-4xl mx-auto mb-24">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              How we compare
            </h2>
            <p className="text-[#6B7699] text-sm">
              Honest comparison. We win on features, they may win on price.
            </p>
          </div>
          <div className="overflow-x-auto rounded-xl border border-white/[0.06]" style={{ background: 'rgba(8,10,22,0.6)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-3 px-4 text-[#6B7699] font-medium">Feature</th>
                  <th className="py-3 px-4 text-[#D4AF37] font-bold">ForjeGames</th>
                  <th className="py-3 px-4 text-[#7574cf] font-medium">Lemonade</th>
                  <th className="py-3 px-4 text-[#ef4444] font-medium">Rebirth</th>
                  <th className="py-3 px-4 text-[#3b82f6] font-medium">Ropilot</th>
                </tr>
              </thead>
              <tbody className="text-[#8B95B0]">
                {[
                  ['AI Models', '4+ (Gemini, Groq, Claude, OpenRouter)', '15 via OpenRouter', '1-2', 'BYOK (you pay)'],
                  ['Script Generation', '200+ specialist agents', 'General AI', 'Basic', 'MCP-based'],
                  ['3D Mesh Generation', 'Built-in (Meshy)', 'No', 'Hunyuan3D', 'No'],
                  ['Image Generation', '13 styles', 'No', 'Reference upload', 'No'],
                  ['Error Self-Repair', '3-attempt loop', 'Auto-fix', 'No', 'Playtest loop'],
                  ['Code Review', 'Auto (Security/Perf/Reliability)', 'No', 'No', 'No'],
                  ['Knowledge Base', '25 API patterns injected', 'Context injection', 'No', 'No'],
                  ['Version Control', 'Checkpoints', 'Prompt rollback', 'No', 'No'],
                  ['Studio Plugin', 'Live sync + console', 'File sync', 'Basic', 'Desktop app'],
                  ['Starting Price', 'Free (1,000 tokens)', 'Free (1/day)', '$8.99/mo', '$20/mo + API keys'],
                ].map(([feature, forje, lemonade, rebirth, ropilot], i) => (
                  <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 px-4 text-white font-medium">{feature}</td>
                    <td className="py-2.5 px-4 text-center text-[#D4AF37]">{forje}</td>
                    <td className="py-2.5 px-4 text-center">{lemonade}</td>
                    <td className="py-2.5 px-4 text-center">{rebirth}</td>
                    <td className="py-2.5 px-4 text-center">{ropilot}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-center text-xs text-[#3F3F46] mt-4">
            Data from public websites as of April 2026. Competitors may have updated since.
          </p>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Social proof                                                        */}
        {/* ------------------------------------------------------------------ */}
        <SocialProofSection />

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

      {/* Sticky mobile CTA — "Start Free" pinned to bottom on small screens */}
      <div className="fixed bottom-0 left-0 right-0 z-40 sm:hidden" style={{ background: 'linear-gradient(to top, #050810 0%, #050810 70%, transparent 100%)' }}>
        <div className="px-4 pb-4 pt-6">
          <Link
            href="/sign-up?plan=free"
            className="flex items-center justify-center gap-2 w-full text-base font-extrabold py-4 rounded-2xl transition-all duration-200 active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #FFD966 100%)',
              color: '#0A0810',
              boxShadow: '0 -4px 30px rgba(212,175,55,0.3)',
            }}
          >
            <Zap className="w-5 h-5" />
            Start Building Free
          </Link>
        </div>
      </div>

      {/* Error toast — shown when checkout fails */}
      {toastMsg && (
        <ErrorToast message={toastMsg} onDismiss={() => setToastMsg(null)} />
      )}
    </div>
  )
}
