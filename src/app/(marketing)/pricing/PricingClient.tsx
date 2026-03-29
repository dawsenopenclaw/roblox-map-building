'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Check, ChevronDown, Heart, Zap, Rocket, Building2 } from 'lucide-react'

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const TIERS = [
  {
    key: 'FREE',
    name: 'Free',
    icon: Zap,
    priceMonthly: 0,
    priceYearly: 0,
    tagline: 'Start building today',
    highlight: false,
    badge: null,
    cta: 'Get Started Free',
    ctaHref: '/sign-up',
    features: [
      '10 AI generations / day',
      '1 project',
      'Basic templates',
      'Community support',
      'COPPA compliant',
    ],
  },
  {
    key: 'PRO',
    name: 'Pro',
    icon: Rocket,
    priceMonthly: 15,
    priceYearly: 12,
    tagline: 'For serious creators',
    highlight: true,
    badge: 'Most Popular',
    cta: 'Start Free Trial',
    ctaHref: '/sign-up?plan=pro',
    features: [
      '1,000 AI generations / day',
      'Unlimited projects',
      'Marketplace access + selling',
      'Team collaboration (up to 5)',
      'Game DNA scanner',
      'Priority support',
      'All premium templates',
    ],
  },
  {
    key: 'STUDIO',
    name: 'Studio',
    icon: Building2,
    priceMonthly: 50,
    priceYearly: 40,
    tagline: 'For agencies & studios',
    highlight: false,
    badge: null,
    cta: 'Start Studio Trial',
    ctaHref: '/sign-up?plan=studio',
    features: [
      'Unlimited AI generations',
      'Unlimited projects',
      'Full API access',
      'White-label exports',
      'Dedicated account manager',
      'Priority AI queue',
      'Custom integrations',
      'Team collaboration (unlimited)',
    ],
  },
]

const FAQ = [
  {
    q: 'What counts as an AI generation?',
    a: 'Each time the AI generates something — terrain, a building, a map scene, a script — that counts as 1 generation. Free plan includes 10 per day. Pro gets 1,000/day. Studio is unlimited.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. No contracts, no cancellation fees. Cancel in one click and you keep access until the end of your billing period.',
  },
  {
    q: 'Is it safe for kids?',
    a: 'Yes. ForjeGames is COPPA compliant with parental controls built in. Safe for players aged 8 and up.',
  },
  {
    q: "What's the 10% donation?",
    a: '10% of every subscription payment goes to education charities. We partner with organizations that teach kids coding and STEM skills worldwide.',
  },
  {
    q: 'Do I need to know how to code?',
    a: 'No. The AI handles everything. Describe what you want in plain English and the platform builds it — scripts, terrain, assets, all of it.',
  },
  {
    q: 'Can I sell what I make?',
    a: 'Yes. Pro and Studio plans let you list templates and assets on the marketplace. You keep 70% of every sale.',
  },
  {
    q: 'What is white-label on Studio?',
    a: 'Studio plan lets you export games and assets with your own branding — no ForjeGames watermarks. Ideal for agencies delivering work to clients.',
  },
  {
    q: 'How does annual billing work?',
    a: 'Annual billing charges you once per year at a 20% discount compared to monthly. You can switch between monthly and annual at any time from your account settings.',
  },
]

// ---------------------------------------------------------------------------
// Animated FAQ item
// ---------------------------------------------------------------------------

function FaqItem({ q, a, isOpen, onToggle }: { q: string; a: string; isOpen: boolean; onToggle: () => void }) {
  const bodyRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(0)

  useEffect(() => {
    if (!bodyRef.current) return
    setHeight(isOpen ? bodyRef.current.scrollHeight : 0)
  }, [isOpen])

  return (
    <div className="border border-white/10 rounded-xl overflow-hidden bg-[#0a0d19]">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/5 transition-colors"
        aria-expanded={isOpen}
      >
        <span className="text-white font-semibold text-sm pr-4">{q}</span>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 flex-shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      <div
        style={{ height, overflow: 'hidden', transition: 'height 220ms ease' }}
      >
        <div ref={bodyRef} className="px-5 pb-5">
          <p className="text-gray-400 text-sm leading-relaxed">{a}</p>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PricingClient() {
  const [annual, setAnnual] = useState(false)
  const [openFaq, setOpenFaq] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-[#060810] text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">

        {/* ------------------------------------------------------------------ */}
        {/* Header                                                              */}
        {/* ------------------------------------------------------------------ */}
        <div className="text-center mb-14">
          <p className="text-xs font-bold tracking-widest uppercase text-[#FFB81C] mb-3 opacity-80">
            Pricing
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-4 tracking-tight">
            <span
              style={{
                background: 'linear-gradient(135deg, #FFB81C 0%, #FFD966 50%, #FFB81C 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Simple, transparent pricing
            </span>
          </h1>
          <p className="text-lg text-gray-400 mb-10 max-w-xl mx-auto">
            Start free. No credit card required. Upgrade when you&apos;re ready.
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center bg-white/5 border border-white/10 rounded-full p-1">
            <button
              onClick={() => setAnnual(false)}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
                !annual
                  ? 'bg-white text-black shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
                annual
                  ? 'bg-white text-black shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Annual
              <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Tier Cards                                                          */}
        {/* ------------------------------------------------------------------ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-14 items-start">
          {TIERS.map((tier) => {
            const price = annual ? tier.priceYearly : tier.priceMonthly
            const Icon = tier.icon

            return (
              <div
                key={tier.key}
                className={`relative flex flex-col rounded-2xl border p-7 transition-all ${
                  tier.highlight
                    ? 'bg-[#0f1320] border-[#FFB81C]/70 shadow-[0_0_50px_rgba(255,184,28,0.15)] sm:-mt-4 sm:pb-11 sm:pt-11'
                    : 'bg-[#0a0d19] border-white/10 hover:border-white/20'
                }`}
              >
                {/* Most Popular badge */}
                {tier.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span
                      className="text-xs font-bold px-4 py-1.5 rounded-full text-black whitespace-nowrap"
                      style={{
                        background: 'linear-gradient(135deg, #FFB81C, #FFD966)',
                      }}
                    >
                      {tier.badge}
                    </span>
                  </div>
                )}

                {/* Icon + Name + tagline */}
                <div className="mb-5 mt-1">
                  <div
                    className={`inline-flex items-center justify-center w-10 h-10 rounded-xl mb-3 ${
                      tier.highlight
                        ? 'bg-[#FFB81C]/15 text-[#FFB81C]'
                        : 'bg-white/5 text-gray-400'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <p
                    className={`text-lg font-bold mb-1 ${
                      tier.highlight ? 'text-[#FFB81C]' : 'text-white'
                    }`}
                  >
                    {tier.name}
                  </p>
                  <p className="text-gray-500 text-sm">{tier.tagline}</p>
                </div>

                {/* Price */}
                <div className="mb-6">
                  {price === 0 ? (
                    <p className="text-5xl font-extrabold text-white">Free</p>
                  ) : (
                    <div className="flex items-end gap-1">
                      <p className="text-5xl font-extrabold text-white">
                        ${price}
                      </p>
                      <span className="text-gray-500 text-sm mb-2">/mo</span>
                    </div>
                  )}
                  {annual && price > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Billed ${price * 12}/year
                    </p>
                  )}
                  {!annual && price > 0 && (
                    <p className="text-xs text-gray-600 mt-1">
                      or ${tier.priceYearly}/mo billed annually
                    </p>
                  )}
                </div>

                {/* CTA */}
                <Link
                  href={tier.ctaHref}
                  className={`block text-center font-bold py-3 rounded-xl text-sm mb-7 transition-all ${
                    tier.highlight
                      ? 'text-black hover:opacity-90 hover:scale-[1.02]'
                      : 'border border-white/20 hover:border-white/40 text-white hover:bg-white/5'
                  }`}
                  style={
                    tier.highlight
                      ? { background: 'linear-gradient(135deg, #FFB81C, #FFD966)' }
                      : {}
                  }
                >
                  {tier.cta}
                </Link>

                {/* Divider */}
                <div className={`h-px mb-5 ${tier.highlight ? 'bg-[#FFB81C]/20' : 'bg-white/5'}`} />

                {/* Features */}
                <ul className="space-y-3">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check
                        className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                          tier.highlight ? 'text-[#FFB81C]' : 'text-gray-500'
                        }`}
                      />
                      <span
                        className={`text-sm ${
                          tier.highlight ? 'text-gray-200' : 'text-gray-400'
                        }`}
                      >
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Trust bar                                                           */}
        {/* ------------------------------------------------------------------ */}
        <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 mb-20 text-sm text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            COPPA compliant
          </span>
          <span className="hidden sm:inline text-gray-700">·</span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            No contracts
          </span>
          <span className="hidden sm:inline text-gray-700">·</span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Cancel anytime
          </span>
          <span className="hidden sm:inline text-gray-700">·</span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            SSL encrypted
          </span>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* FAQ                                                                 */}
        {/* ------------------------------------------------------------------ */}
        <div className="max-w-2xl mx-auto mb-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-10">
            Frequently asked questions
          </h2>
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
        {/* Charity badge                                                       */}
        {/* ------------------------------------------------------------------ */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-3 bg-[#0f1320] border border-white/10 rounded-2xl px-6 py-4 text-sm">
            <Heart className="w-5 h-5 text-[#FFB81C] flex-shrink-0" />
            <div>
              <p className="text-white font-semibold">10% of revenue donated to charity</p>
              <p className="text-gray-500 text-xs mt-0.5">
                Every paid plan contributes to coding &amp; STEM education nonprofits worldwide.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
