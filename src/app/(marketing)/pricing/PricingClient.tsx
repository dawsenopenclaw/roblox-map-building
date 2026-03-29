'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check } from 'lucide-react'

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const TIERS = [
  {
    key: 'FREE',
    name: 'Free',
    priceMonthly: 0,
    priceYearly: 0,
    tagline: '1,000 tokens — no credit card',
    highlight: false,
    cta: 'Try It Free',
    ctaHref: '/sign-up',
    features: [
      '1,000 free tokens',
      'Voice & image AI',
      'Basic templates',
      'Community support',
    ],
  },
  {
    key: 'CREATOR',
    name: 'Creator',
    priceMonthly: 15,
    priceYearly: 12,
    tagline: 'For serious creators',
    highlight: true,
    cta: 'See Creator Plan',
    ctaHref: '/sign-up',
    features: [
      'Unlimited builds',
      'Game DNA scanner',
      'Marketplace access',
      'Sell templates',
      'Email support',
    ],
  },
  {
    key: 'STUDIO',
    name: 'Studio',
    priceMonthly: 50,
    priceYearly: 40,
    tagline: 'For teams & studios',
    highlight: false,
    cta: 'See Studio Plan',
    ctaHref: '/sign-up',
    features: [
      'Everything in Creator',
      'Up to 10 team members',
      'Priority AI queue',
      'Custom API keys',
      'Dedicated support',
    ],
  },
]

const FAQ = [
  {
    q: 'What are tokens?',
    a: 'Tokens are spent when the AI generates something — terrain, a building, a full game scene. Every account starts with 1,000 free tokens, no credit card required. Buy more whenever you need them.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. No contracts, no cancellation fees. Cancel in one click and you keep access until the end of your billing period.',
  },
  {
    q: 'Is it safe for kids?',
    a: 'Yes. RobloxForge is COPPA compliant with parental controls built in. Safe for players aged 8 and up.',
  },
  {
    q: "What's the 10% donation?",
    a: '10% of every subscription payment goes to education charities. We partner with organizations that teach kids coding and STEM skills.',
  },
  {
    q: 'Do I need to code?',
    a: 'No. The AI handles everything. Describe what you want in plain English, and the platform builds it for you.',
  },
  {
    q: 'Can I sell what I make?',
    a: 'Yes. Creator and Studio plans let you list templates and assets on the marketplace. You keep 70% of every sale.',
  },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PricingClient() {
  const [annual, setAnnual] = useState(false)

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20">

      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
          Simple, transparent pricing
        </h1>
        <p className="text-lg text-gray-400 mb-8">
          Use it free. Pay only if you need more.
        </p>

        {/* Toggle */}
        <div className="inline-flex items-center bg-white/5 border border-white/10 rounded-full p-1">
          <button
            onClick={() => setAnnual(false)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
              !annual
                ? 'bg-white text-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setAnnual(true)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
              annual
                ? 'bg-white text-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Annual
            <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-1.5 py-0.5 rounded-full font-semibold">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
        {TIERS.map((tier) => {
          const price = annual ? tier.priceYearly : tier.priceMonthly

          return (
            <div
              key={tier.key}
              className={`relative flex flex-col rounded-2xl border p-7 ${
                tier.highlight
                  ? 'bg-[#0f1320] border-[#FFB81C]/60 ring-1 ring-[#FFB81C]/30'
                  : 'bg-[#0a0d19] border-white/10'
              }`}
            >

              {/* Tier name + tagline */}
              <div className="mb-6">
                <p
                  className={`text-xl font-bold mb-1 ${
                    tier.highlight ? 'text-[#FFB81C]' : 'text-white'
                  }`}
                >
                  {tier.name}
                </p>
                <p className="text-gray-400 text-sm">{tier.tagline}</p>
              </div>

              {/* Price */}
              <div className="mb-6">
                {price === 0 ? (
                  <p className="text-4xl font-bold text-white">Free</p>
                ) : (
                  <div className="flex items-end gap-1">
                    <p className="text-4xl font-bold text-white">${price}</p>
                    <span className="text-gray-500 text-sm mb-1.5">/mo</span>
                  </div>
                )}
                {annual && price > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Billed ${price * 12}/year
                  </p>
                )}
              </div>

              {/* CTA */}
              <Link
                href={tier.ctaHref}
                className={`block text-center font-semibold py-3 rounded-xl text-sm mb-7 transition-colors ${
                  tier.highlight
                    ? 'bg-[#FFB81C] hover:bg-[#e6a519] text-black'
                    : 'border border-white/20 hover:border-white/40 text-white hover:bg-white/5'
                }`}
              >
                {tier.cta}
              </Link>

              {/* Features */}
              <ul className="space-y-3">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300 text-sm">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>

      {/* Trust line */}
      <p className="text-center text-gray-500 text-sm mb-20">
        All plans include:{' '}
        <span className="text-gray-400">COPPA compliance</span>
        {' · '}
        <span className="text-gray-400">10% donated to education</span>
        {' · '}
        <span className="text-gray-400">Cancel anytime</span>
      </p>

      {/* FAQ */}
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-white text-center mb-10">
          Frequently asked questions
        </h2>
        <div className="space-y-8">
          {FAQ.map(({ q, a }) => (
            <div key={q}>
              <p className="text-white font-semibold mb-2">{q}</p>
              <p className="text-gray-400 text-sm leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
