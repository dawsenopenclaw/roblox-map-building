'use client'

import { useState, useRef, useEffect, useId, useCallback } from 'react'
import Link from 'next/link'
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
  CheckCircle2,
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
    tagline: 'Try the platform risk-free',
    highlight: false,
    badge: null,
    cta: 'Get Started Free',
    ctaHref: '/sign-up',
    features: [
      '1,000 tokens / month',
      '1 project',
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
    tagline: 'For hobbyists leveling up',
    highlight: false,
    badge: null,
    cta: 'Start Free Trial',
    ctaHref: '/sign-up?plan=hobby',
    features: [
      '2,000 tokens / month',
      '5 projects',
      'Voice-to-game',
      'Image-to-map',
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
    tagline: 'For serious creators',
    highlight: true,
    badge: 'Most Popular',
    cta: 'Start Free Trial',
    ctaHref: '/sign-up?plan=creator',
    features: [
      '7,000 tokens / month',
      'Unlimited projects',
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
    tagline: 'For agencies & studios',
    highlight: false,
    badge: null,
    cta: 'Start Free Trial',
    ctaHref: '/sign-up?plan=studio',
    features: [
      '20,000 tokens / month',
      'Unlimited projects',
      'Full API access',
      'White-label exports',
      'Team collaboration (50 members)',
      'Dedicated support',
      'Priority AI queue',
      'Custom integrations',
    ],
  },
  {
    key: 'CUSTOM',
    name: 'Custom',
    icon: Crown,
    priceMonthly: null,
    priceYearly: null,
    yearlyTotal: null,
    tagline: 'Need more than 20K tokens/month?',
    highlight: false,
    badge: null,
    cta: 'Talk to Sales',
    ctaHref: '#contact-sales',
    features: [
      'Custom token limits',
      'Unlimited projects',
      'Dedicated AI cluster',
      'Custom model training',
      'Unlimited team members',
      'White-glove onboarding',
      'SLA guarantee',
      'Invoice billing',
    ],
  },
] as const

// Feature matrix for comparison table
const COMPARE_FEATURES = [
  { label: 'Tokens / month',        free: '1,000',     hobby: '2,000',     creator: '7,000',     studio: '20,000',    custom: 'Custom'     },
  { label: 'Projects',              free: '1',         hobby: '5',         creator: 'Unlimited', studio: 'Unlimited', custom: 'Unlimited'  },
  { label: 'Basic templates',       free: true,        hobby: true,        creator: true,        studio: true,        custom: true         },
  { label: 'Voice-to-game',         free: false,       hobby: true,        creator: true,        studio: true,        custom: true         },
  { label: 'Image-to-map',          free: false,       hobby: true,        creator: true,        studio: true,        custom: true         },
  { label: 'Marketplace access',    free: false,       hobby: false,       creator: true,        studio: true,        custom: true         },
  { label: 'Marketplace selling',   free: false,       hobby: false,       creator: true,        studio: true,        custom: true         },
  { label: 'Team members',          free: 'Solo',      hobby: 'Solo',      creator: '3',         studio: '50',        custom: 'Unlimited'  },
  { label: 'Game DNA scanner',      free: false,       hobby: false,       creator: true,        studio: true,        custom: true         },
  { label: 'Advanced analytics',    free: false,       hobby: false,       creator: true,        studio: true,        custom: true         },
  { label: 'Priority AI queue',     free: false,       hobby: false,       creator: true,        studio: true,        custom: true         },
  { label: 'API access',            free: false,       hobby: false,       creator: false,       studio: true,        custom: true         },
  { label: 'White-label exports',   free: false,       hobby: false,       creator: false,       studio: true,        custom: true         },
  { label: 'Custom integrations',   free: false,       hobby: false,       creator: false,       studio: true,        custom: true         },
  { label: 'Dedicated AI cluster',  free: false,       hobby: false,       creator: false,       studio: false,       custom: true         },
  { label: 'Custom model training', free: false,       hobby: false,       creator: false,       studio: false,       custom: true         },
  { label: 'SLA guarantee',         free: false,       hobby: false,       creator: false,       studio: false,       custom: true         },
  { label: 'Invoice billing',       free: false,       hobby: false,       creator: false,       studio: false,       custom: true         },
  { label: 'Support',               free: 'Community', hobby: 'Email',     creator: 'Priority',  studio: 'Dedicated', custom: 'White-glove'},
  { label: 'COPPA compliant',       free: true,        hobby: true,        creator: true,        studio: true,        custom: true         },
]

const TOKEN_USAGE_OPTIONS = [
  '20K – 50K / month',
  '50K – 100K / month',
  '100K – 500K / month',
  '500K+ / month',
]

const FAQ = [
  {
    q: 'What is a token and how are they used?',
    a: 'Tokens are the currency for AI operations on ForjeGames. Each generation — terrain, buildings, scripts, maps, voice commands — consumes a certain number of tokens. Simple generations cost fewer tokens; complex multi-step builds cost more. Your token balance resets every month.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. No contracts, no cancellation fees. Cancel in one click from your account settings and you keep full access until the end of your current billing period.',
  },
  {
    q: 'Is ForjeGames safe for kids?',
    a: 'Yes. ForjeGames is COPPA compliant with parental controls built in. Safe for creators aged 8 and up with parental consent. All content is moderated.',
  },
  {
    q: "What is the 14-day free trial?",
    a: 'All paid plans include a 14-day free trial. No credit card required to start. You only get charged after your trial ends — and you can cancel before then at zero cost.',
  },
  {
    q: "What's the 10% donation?",
    a: '10% of every subscription payment goes directly to education charities. We partner with organizations that teach kids coding and STEM skills worldwide.',
  },
  {
    q: 'Do I need to know how to code?',
    a: 'No. The AI handles everything. Describe what you want in plain English and the platform builds it — scripts, terrain, assets, all of it.',
  },
  {
    q: 'Can I sell what I make?',
    a: 'Yes. Creator and Studio plans let you list templates and assets on the ForjeGames marketplace. You keep 70% of every sale.',
  },
  {
    q: 'How does annual billing work?',
    a: 'Annual billing charges you once per year at a 20% discount compared to monthly. Hobby billed at $95.90/yr, Creator at $239.90/yr, Studio at $479.90/yr. Switch between billing cycles anytime from account settings.',
  },
  {
    q: 'What is API access on Studio?',
    a: 'Studio plan includes full REST API and SDK access (npm, Python, Go) so you can integrate ForjeGames into your own tools, CI/CD pipelines, or custom automation workflows.',
  },
  {
    q: 'Can I upgrade or downgrade my plan?',
    a: "Yes. Upgrades take effect immediately and are prorated. Downgrades take effect at your next billing cycle so you never lose features you've already paid for.",
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
// ContactSalesSection
// ---------------------------------------------------------------------------

type FormState = 'idle' | 'loading' | 'success' | 'error'

function ContactSalesSection() {
  const [name, setName]       = useState('')
  const [email, setEmail]     = useState('')
  const [message, setMessage] = useState('')
  const [budget, setBudget]   = useState('')
  const [status, setStatus]   = useState<FormState>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      setStatus('loading')
      setErrorMsg('')
      try {
        const res = await fetch('/api/contact/sales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, message, budget }),
        })
        if (!res.ok) {
          const data = (await res.json()) as { error?: string }
          throw new Error(data.error ?? 'Something went wrong')
        }
        setStatus('success')
      } catch (err) {
        setStatus('error')
        setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      }
    },
    [name, email, message, budget],
  )

  const inputBase =
    'w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-[#4A5580] outline-none transition-all duration-200 focus:border-[#7C3AED]/50 focus:bg-white/[0.06] focus:shadow-[0_0_0_3px_rgba(124,58,237,0.12)]'

  return (
    <section
      id="contact-sales"
      className="mb-24 scroll-mt-20"
    >
      {/* Section header */}
      <div className="text-center mb-10">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
          Need more tokens?
        </h2>
        <p className="text-[#6B7699] text-sm max-w-md mx-auto leading-relaxed">
          Our standard plans go up to 20,000 tokens/month. Need more? Tell us what you&apos;re building and we&apos;ll create a custom plan.
        </p>
      </div>

      <div className="max-w-xl mx-auto">
        <div
          className="relative rounded-2xl border border-[rgba(124,58,237,0.2)] overflow-hidden"
          style={{
            background: 'linear-gradient(160deg, #0D0B1A 0%, #0A0914 50%, #0C0B1C 100%)',
          }}
        >
          {/* Purple ambient glow */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: '-60px',
              right: '-60px',
              width: '300px',
              height: '300px',
              background:
                'radial-gradient(ellipse at center, rgba(124,58,237,0.12) 0%, transparent 65%)',
              filter: 'blur(30px)',
              pointerEvents: 'none',
            }}
          />

          <div className="relative p-8">
            {status === 'success' ? (
              <div className="flex flex-col items-center justify-center py-10 gap-4 text-center">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(124,58,237,0.15)' }}
                >
                  <CheckCircle2 className="w-7 h-7 text-[#A78BFA]" />
                </div>
                <p className="text-white font-bold text-lg">Message received</p>
                <p className="text-[#6B7699] text-sm">
                  We&apos;ll be in touch within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="sales-name"
                      className="block text-xs font-semibold text-[#8B95B0] mb-1.5 uppercase tracking-wide"
                    >
                      Name <span className="text-[#7C3AED]">*</span>
                    </label>
                    <input
                      id="sales-name"
                      type="text"
                      required
                      autoComplete="name"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={inputBase}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="sales-email"
                      className="block text-xs font-semibold text-[#8B95B0] mb-1.5 uppercase tracking-wide"
                    >
                      Email <span className="text-[#7C3AED]">*</span>
                    </label>
                    <input
                      id="sales-email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputBase}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="sales-tokens"
                    className="block text-xs font-semibold text-[#8B95B0] mb-1.5 uppercase tracking-wide"
                  >
                    Monthly token usage needed <span className="text-[#7C3AED]">*</span>
                  </label>
                  <select
                    id="sales-tokens"
                    required
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className={`${inputBase} appearance-none cursor-pointer`}
                    style={{ colorScheme: 'dark' }}
                  >
                    <option value="" disabled>
                      Select token range
                    </option>
                    {TOKEN_USAGE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="sales-message"
                    className="block text-xs font-semibold text-[#8B95B0] mb-1.5 uppercase tracking-wide"
                  >
                    Message <span className="text-[#7C3AED]">*</span>
                  </label>
                  <textarea
                    id="sales-message"
                    required
                    rows={4}
                    placeholder="What are you building? Tell us about your project and token needs..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className={`${inputBase} resize-none`}
                  />
                </div>

                {status === 'error' && (
                  <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                    {errorMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full font-bold py-3.5 rounded-xl text-sm text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] shadow-[0_4px_24px_rgba(124,58,237,0.35)]"
                  style={{
                    background: 'linear-gradient(135deg, #7C3AED, #6366F1)',
                  }}
                >
                  {status === 'loading' ? 'Sending...' : 'Send message'}
                </button>

                <p className="text-center text-[11px] text-[#3D4A6A]">
                  We respond within 24 hours on business days.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function PricingClient() {
  const [annual, setAnnual]   = useState(false)
  const [openFaq, setOpenFaq] = useState<string | null>(null)

  const handleCustomCta = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    const target = document.getElementById('contact-sales')
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
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

          <p className="text-lg text-[#6B7699] mb-10 max-w-lg mx-auto leading-relaxed">
            Start free. No credit card required.
            <br />
            Upgrade when you&apos;re ready.
          </p>

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 mb-16 items-start">
          {TIERS.map((tier) => {
            const price  = annual ? tier.priceYearly : tier.priceMonthly
            const Icon   = tier.icon
            const isCustom = tier.key === 'CUSTOM'

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

                {/* Custom card glow orb */}
                {isCustom && (
                  <div
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      inset: '-20px',
                      background:
                        'radial-gradient(ellipse at 50% 40%, rgba(124,58,237,0.12) 0%, transparent 65%)',
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
                      : isCustom
                      ? 'bg-[#0A0A18] border-[rgba(124,58,237,0.3)] p-6 group-hover:-translate-y-1.5 group-hover:border-[rgba(124,58,237,0.5)] group-hover:shadow-[0_12px_40px_rgba(124,58,237,0.15)]'
                      : 'bg-[#0A0F1E] border-[#141C35] p-6 group-hover:-translate-y-1.5 group-hover:border-[#1E2A4A] group-hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)]'
                  }`}
                  style={
                    tier.highlight
                      ? {
                          background:
                            'linear-gradient(160deg, #0D1226 0%, #0A0E20 50%, #0C1128 100%)',
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
                        style={{
                          background: 'linear-gradient(135deg, #D4AF37 0%, #FFD966 100%)',
                        }}
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
                          : isCustom
                          ? 'bg-[#7C3AED]/15 text-[#A78BFA] shadow-[0_0_20px_rgba(124,58,237,0.2)]'
                          : 'bg-white/[0.06] text-[#6B7699]'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <p
                      className={`text-2xl font-bold mb-1 ${
                        tier.highlight
                          ? 'text-[#D4AF37]'
                          : isCustom
                          ? 'text-[#A78BFA]'
                          : 'text-white'
                      }`}
                    >
                      {tier.name}
                    </p>
                    <p className="text-[#6B7699] text-base">{tier.tagline}</p>
                  </div>

                  {/* Price block */}
                  <div className="mb-6 min-h-[80px]">
                    {isCustom ? (
                      <>
                        <p
                          className="text-5xl font-extrabold tracking-tight"
                          style={{
                            background: 'linear-gradient(135deg, #A78BFA 0%, #C4B5FD 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                          }}
                        >
                          Custom
                        </p>
                        <p className="text-xs text-[#6B7699] mt-1.5">Let&apos;s talk</p>
                      </>
                    ) : price === 0 ? (
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
                  {isCustom ? (
                    <a
                      href="#contact-sales"
                      onClick={handleCustomCta}
                      className="block text-center font-bold py-4 rounded-xl text-base text-white transition-all duration-200 mb-2 hover:opacity-90 hover:scale-[1.02] active:scale-[0.99] shadow-[0_6px_28px_rgba(124,58,237,0.45)]"
                      style={{
                        background: 'linear-gradient(135deg, #7C3AED, #6366F1)',
                      }}
                    >
                      {tier.cta}
                    </a>
                  ) : (
                    <Link
                      href={tier.ctaHref}
                      className={`block text-center font-bold py-4 rounded-xl text-base transition-all duration-200 mb-2 ${
                        tier.highlight
                          ? 'text-[#0A0810] hover:opacity-90 hover:scale-[1.02] shadow-[0_6px_32px_rgba(212,175,55,0.5)] active:scale-[0.99]'
                          : 'border border-[#1E2A4A] text-[#CBD2E8] hover:border-[#2A3870] hover:bg-white/[0.04] hover:text-white active:scale-[0.99]'
                      }`}
                      style={
                        tier.highlight
                          ? { background: 'linear-gradient(135deg, #D4AF37 0%, #FFD966 100%)' }
                          : {}
                      }
                    >
                      {tier.cta}
                    </Link>
                  )}

                  {/* Trial / free / contact notice */}
                  <p className="text-center text-[11px] text-[#3D4A6A] mb-6 leading-relaxed">
                    {isCustom
                      ? 'Respond within 24 hours'
                      : (tier.priceMonthly as number) > 0
                      ? '14-day free trial · No credit card required'
                      : 'No credit card required'}
                  </p>

                  {/* Divider */}
                  <div
                    className={`h-px mb-5 ${
                      tier.highlight
                        ? 'bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent'
                        : isCustom
                        ? 'bg-gradient-to-r from-transparent via-[#7C3AED]/25 to-transparent'
                        : 'bg-[#141C35]'
                    }`}
                  />

                  {/* Features list */}
                  <ul className="space-y-3.5 flex-1">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                            tier.highlight
                              ? 'bg-[#D4AF37]/15'
                              : isCustom
                              ? 'bg-[#7C3AED]/15'
                              : 'bg-white/[0.06]'
                          }`}
                        >
                          <Check
                            className={`w-3 h-3 ${
                              tier.highlight
                                ? 'text-[#D4AF37]'
                                : isCustom
                                ? 'text-[#A78BFA]'
                                : 'text-[#6B7699]'
                            }`}
                          />
                        </div>
                        <span
                          className={`text-[15px] leading-snug ${
                            tier.highlight
                              ? 'text-[#E8EBF5]'
                              : isCustom
                              ? 'text-[#C4B5FD]'
                              : 'text-[#8B95B0]'
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
            <table className="w-full min-w-[800px] border-collapse">
              <thead>
                <tr className="border-b border-[#141C35]">
                  <th className="text-left py-5 px-6 text-[15px] font-semibold text-[#6B7699] w-[28%] bg-[#0A0F1E]">
                    Feature
                  </th>
                  {TIERS.map((tier) => {
                    const isCustom = tier.key === 'CUSTOM'
                    return (
                      <th
                        key={tier.key}
                        className={`text-center py-5 px-4 text-[15px] font-bold ${
                          tier.highlight
                            ? 'text-[#D4AF37] bg-[#D4AF37]/[0.06]'
                            : isCustom
                            ? 'text-[#A78BFA] bg-[#7C3AED]/[0.06]'
                            : 'text-white bg-[#0A0F1E]'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span>{tier.name}</span>
                          <span className="text-sm font-normal text-[#4A5580]">
                            {isCustom
                              ? "Let's talk"
                              : annual
                              ? tier.priceYearly === 0
                                ? 'Free'
                                : `${formatPrice(tier.priceYearly as number)}/mo`
                              : tier.priceMonthly === 0
                              ? 'Free'
                              : `${formatPrice(tier.priceMonthly as number)}/mo`}
                          </span>
                        </div>
                      </th>
                    )
                  })}
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
                      className={`py-4 px-4 text-center ${
                        i % 2 === 0 ? 'bg-[#D4AF37]/[0.04]' : 'bg-[#D4AF37]/[0.025]'
                      }`}
                    >
                      <CompareCell value={row.creator} isCreator />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <CompareCell value={row.studio} />
                    </td>
                    <td
                      className={`py-4 px-4 text-center ${
                        i % 2 === 0 ? 'bg-[#7C3AED]/[0.04]' : 'bg-[#7C3AED]/[0.025]'
                      }`}
                    >
                      <CompareCell value={row.custom} isCustom />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-[#141C35]">
                  <td className="py-6 px-6 bg-[#0A0F1E]" />
                  {TIERS.map((tier) => {
                    const isCustom = tier.key === 'CUSTOM'
                    return (
                      <td
                        key={tier.key}
                        className={`py-6 px-4 text-center ${
                          tier.highlight
                            ? 'bg-[#D4AF37]/[0.06]'
                            : isCustom
                            ? 'bg-[#7C3AED]/[0.06]'
                            : 'bg-[#0A0F1E]'
                        }`}
                      >
                        {isCustom ? (
                          <a
                            href="#contact-sales"
                            onClick={handleCustomCta}
                            className="inline-block text-sm font-bold py-3 px-6 rounded-xl transition-all duration-200 text-white hover:opacity-90 shadow-[0_4px_18px_rgba(124,58,237,0.4)]"
                            style={{
                              background: 'linear-gradient(135deg, #7C3AED, #6366F1)',
                            }}
                          >
                            Talk to Sales
                          </a>
                        ) : (
                          <Link
                            href={tier.ctaHref}
                            className={`inline-block text-sm font-bold py-3 px-6 rounded-xl transition-all duration-200 ${
                              tier.highlight
                                ? 'text-[#0A0810] hover:opacity-90 shadow-[0_4px_18px_rgba(212,175,55,0.4)]'
                                : 'border border-[#1E2A4A] text-[#CBD2E8] hover:border-[#2A3870] hover:bg-white/[0.04]'
                            }`}
                            style={
                              tier.highlight
                                ? {
                                    background:
                                      'linear-gradient(135deg, #D4AF37 0%, #FFD966 100%)',
                                  }
                                : {}
                            }
                          >
                            {tier.key === 'FREE' ? 'Get Started' : 'Try Free'}
                          </Link>
                        )}
                      </td>
                    )
                  })}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Contact Sales Section                                               */}
        {/* ------------------------------------------------------------------ */}
        <ContactSalesSection />

        {/* ------------------------------------------------------------------ */}
        {/* FAQ                                                                 */}
        {/* ------------------------------------------------------------------ */}
        <div className="max-w-2xl mx-auto mb-24">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Frequently asked questions
            </h2>
            <p className="text-[#6B7699] text-sm">
              Still unsure?{' '}
              <Link
                href="#contact-sales"
                className="text-[#D4AF37] hover:text-[#FFD966] transition-colors underline underline-offset-2"
              >
                Chat with us
              </Link>
              .
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
            style={{
              background: 'linear-gradient(135deg, #0D1120 0%, #0A0E1A 100%)',
            }}
          >
            {/* Subtle glow behind heart */}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '120px',
                height: '120px',
                background:
                  'radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)',
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
