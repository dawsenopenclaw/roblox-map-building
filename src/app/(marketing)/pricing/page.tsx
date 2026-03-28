'use client'
import { useState } from 'react'
import Link from 'next/link'

const TIERS = [
  {
    key: 'FREE',
    name: 'Free',
    priceMonthly: 0,
    priceYearly: 0,
    tokens: 500,
    highlight: false,
    cta: 'Get started free',
    ctaHref: '/sign-up',
    description: 'Try the tools. No credit card required.',
    features: [
      '500 tokens/month',
      'Basic terrain generation',
      'Voice Build (limited)',
      'Image to Map (limited)',
      'Community support',
    ],
    limits: [
      'No priority processing',
      'No Game DNA scanner',
      'No team collaboration',
    ],
  },
  {
    key: 'HOBBY',
    name: 'Hobby',
    priceMonthly: 4.99,
    priceYearly: 3.99,
    tokens: 2000,
    highlight: false,
    cta: 'Start 14-day trial',
    ctaHref: '/sign-up?plan=hobby',
    description: 'For weekend creators and learners.',
    features: [
      '2,000 tokens/month',
      'Full Voice Build',
      'Full Image to Map',
      'Marketplace access',
      'Email support',
    ],
    limits: [
      'No Game DNA scanner',
      'No team collaboration',
    ],
  },
  {
    key: 'CREATOR',
    name: 'Creator',
    priceMonthly: 14.99,
    priceYearly: 11.99,
    tokens: 7000,
    highlight: true,
    cta: 'Start 14-day trial',
    ctaHref: '/sign-up?plan=creator',
    description: 'The sweet spot for serious creators.',
    features: [
      '7,000 tokens/month',
      'Everything in Hobby',
      'Game DNA scanner',
      'Priority processing',
      'Marketplace selling',
      'Priority support',
    ],
    limits: [
      'Up to 3 team members',
    ],
  },
  {
    key: 'STUDIO',
    name: 'Studio',
    priceMonthly: 49.99,
    priceYearly: 39.99,
    tokens: 20000,
    highlight: false,
    cta: 'Start 14-day trial',
    ctaHref: '/sign-up?plan=studio',
    description: 'For professional studios shipping hits.',
    features: [
      '20,000 tokens/month',
      'Everything in Creator',
      'Team collaboration (unlimited)',
      'API access',
      'Advanced analytics',
      'Dedicated support',
      'Custom token top-ups',
    ],
    limits: [],
  },
]

const FEATURE_MATRIX = [
  { feature: 'Tokens/month', free: '500', hobby: '2,000', creator: '7,000', studio: '20,000' },
  { feature: 'Voice Build', free: 'Limited', hobby: '✓', creator: '✓', studio: '✓' },
  { feature: 'Image to Map', free: 'Limited', hobby: '✓', creator: '✓', studio: '✓' },
  { feature: 'Marketplace', free: 'Browse only', hobby: '✓', creator: '✓ + Sell', studio: '✓ + Sell' },
  { feature: 'Game DNA scanner', free: '✗', hobby: '✗', creator: '✓', studio: '✓' },
  { feature: 'Priority processing', free: '✗', hobby: '✗', creator: '✓', studio: '✓' },
  { feature: 'Team collaboration', free: '✗', hobby: '✗', creator: '3 members', studio: 'Unlimited' },
  { feature: 'API access', free: '✗', hobby: '✗', creator: '✗', studio: '✓' },
  { feature: 'Support', free: 'Community', hobby: 'Email', creator: 'Priority', studio: 'Dedicated' },
  { feature: '14-day free trial', free: '—', hobby: '✓', creator: '✓', studio: '✓' },
]

const TOKEN_USES = [
  { action: 'Simple terrain build', tokens: 50 },
  { action: 'Voice command (30s)', tokens: 80 },
  { action: 'Image to map (basic)', tokens: 200 },
  { action: 'Full game scene', tokens: 500 },
  { action: 'Game DNA scan', tokens: 300 },
  { action: 'Custom asset generation', tokens: 150 },
]

export default function PricingPage() {
  const [annual, setAnnual] = useState(false)
  const [calcTokens, setCalcTokens] = useState(500)

  const recommendedPlan = (tokens: number) => {
    if (tokens <= 500) return 'Free'
    if (tokens <= 2000) return 'Hobby'
    if (tokens <= 7000) return 'Creator'
    return 'Studio'
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
          Simple, Transparent Pricing
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
          Start free. Upgrade when your game grows.
          All plans include a 14-day free trial.
        </p>

        {/* Annual toggle */}
        <div
          className="inline-flex items-center gap-3 bg-[#0D1231] border border-white/10 rounded-full p-1.5"
          role="group"
          aria-label="Billing frequency"
        >
          <button
            onClick={() => setAnnual(false)}
            aria-pressed={!annual}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FFB81C] ${
              !annual ? 'bg-[#FFB81C] text-black' : 'text-gray-400 hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setAnnual(true)}
            aria-pressed={annual}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FFB81C] ${
              annual ? 'bg-[#FFB81C] text-black' : 'text-gray-400 hover:text-white'
            }`}
          >
            Annual
            <span className="ml-1.5 text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-1.5 py-0.5 rounded-full">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* Tier cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
        {TIERS.map((tier) => {
          const price = annual ? tier.priceYearly : tier.priceMonthly
          return (
            <div
              key={tier.key}
              className={`relative flex flex-col rounded-2xl border p-6 ${
                tier.highlight
                  ? 'bg-gradient-to-b from-[#FFB81C]/5 to-[#0D1231] border-[#FFB81C]/40 ring-1 ring-[#FFB81C]/20'
                  : 'bg-[#0D1231] border-white/10'
              }`}
            >
              {tier.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-[#FFB81C] text-black text-xs font-bold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <p className="text-lg font-bold text-white mb-1">{tier.name}</p>
                <p className="text-gray-400 text-sm leading-snug">{tier.description}</p>
              </div>

              <div className="mb-6">
                {price === 0 ? (
                  <p className="text-4xl font-bold text-white">Free</p>
                ) : (
                  <div>
                    <p className="text-4xl font-bold text-white">
                      ${price}
                      <span className="text-lg text-gray-500 font-normal">/mo</span>
                    </p>
                    {annual && (
                      <p className="text-xs text-green-400 mt-1">
                        Billed ${(price * 12).toFixed(0)}/year
                      </p>
                    )}
                  </div>
                )}
                <p className="text-sm text-[#FFB81C] mt-2 font-medium">
                  {tier.tokens.toLocaleString()} tokens/month
                </p>
              </div>

              <Link
                href={tier.ctaHref}
                className={`block text-center font-bold py-3 rounded-xl text-sm transition-colors mb-6 ${
                  tier.highlight
                    ? 'bg-[#FFB81C] hover:bg-[#E6A519] text-black'
                    : 'border border-white/20 hover:border-white/40 text-white'
                }`}
              >
                {tier.cta}
              </Link>

              <div className="space-y-2 flex-1">
                {tier.features.map((f) => (
                  <div key={f} className="flex items-start gap-2">
                    <span className="text-green-400 text-sm mt-0.5 flex-shrink-0">✓</span>
                    <span className="text-gray-300 text-sm">{f}</span>
                  </div>
                ))}
                {tier.limits.map((l) => (
                  <div key={l} className="flex items-start gap-2">
                    <span className="text-gray-600 text-sm mt-0.5 flex-shrink-0">✗</span>
                    <span className="text-gray-600 text-sm">{l}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Feature matrix */}
      <section className="mb-20">
        <h2 className="text-2xl font-bold text-white text-center mb-8">Full Feature Comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" role="table" aria-label="Feature comparison across plans">
            <thead>
              <tr className="border-b border-white/10">
                <th scope="col" className="text-left py-3 px-4 text-sm text-gray-400 font-medium w-40">Feature</th>
                {TIERS.map((t) => (
                  <th key={t.key} scope="col" className={`py-3 px-4 text-center text-sm font-semibold ${
                    t.highlight ? 'text-[#FFB81C]' : 'text-white'
                  }`}>
                    {t.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURE_MATRIX.map((row, i) => (
                <tr key={row.feature} className={`border-b border-white/5 ${i % 2 === 0 ? 'bg-white/[0.02]' : ''}`}>
                  <th scope="row" className="py-3 px-4 text-sm text-gray-300 font-normal text-left">{row.feature}</th>
                  {[row.free, row.hobby, row.creator, row.studio].map((val, j) => (
                    <td key={j} className={`py-3 px-4 text-center text-sm ${
                      val === '✓' || val?.includes('✓') ? 'text-green-400' :
                      val === '✗' ? 'text-gray-600' :
                      val === '—' ? 'text-gray-600' : 'text-gray-300'
                    }`}>
                      <span aria-label={
                        val === '✓' ? 'Included' :
                        val === '✗' ? 'Not included' :
                        val === '—' ? 'Not applicable' : val ?? ''
                      }>
                        {val}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Token calculator */}
      <section className="mb-20">
        <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-8 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-2">
            How Many Tokens Do I Need?
          </h2>
          <p className="text-gray-400 text-center text-sm mb-8">
            Drag to estimate your monthly usage
          </p>

          <label htmlFor="token-estimator" className="sr-only">
            Monthly token usage estimate: {calcTokens.toLocaleString()} tokens
          </label>
          <input
            id="token-estimator"
            type="range"
            min={100}
            max={20000}
            step={100}
            value={calcTokens}
            onChange={(e) => setCalcTokens(Number(e.target.value))}
            className="w-full accent-[#FFB81C] mb-4"
            aria-valuemin={100}
            aria-valuemax={20000}
            aria-valuenow={calcTokens}
            aria-valuetext={`${calcTokens.toLocaleString()} tokens per month`}
          />
          <div className="flex justify-between text-xs text-gray-500 mb-8">
            <span>100</span>
            <span className="text-[#FFB81C] font-bold text-base">{calcTokens.toLocaleString()} tokens/mo</span>
            <span>20,000</span>
          </div>

          <div className="bg-[#111640] rounded-xl p-4 mb-6">
            <p className="text-center text-gray-400 text-sm mb-1">Recommended plan</p>
            <p className="text-center text-2xl font-bold text-[#FFB81C]">
              {recommendedPlan(calcTokens)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {TOKEN_USES.map((use) => (
              <div key={use.action} className="flex items-center justify-between text-sm">
                <span className="text-gray-400">{use.action}</span>
                <span className="text-[#FFB81C] font-medium ml-2">⚡{use.tokens}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Guarantees */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16 text-center">
        {[
          { icon: '🔒', title: '14-Day Free Trial', body: 'All paid plans. No credit card required to start.' },
          { icon: '↩️', title: 'Cancel Anytime', body: 'One-click cancellation. No retention dark patterns.' },
          { icon: '💛', title: '10% to Charity', body: 'Every dollar supports a cause you choose.' },
        ].map((g) => (
          <div key={g.title} className="bg-[#0D1231] border border-white/10 rounded-2xl p-6">
            <div className="text-4xl mb-3">{g.icon}</div>
            <p className="font-semibold text-white mb-2">{g.title}</p>
            <p className="text-gray-400 text-sm">{g.body}</p>
          </div>
        ))}
      </section>

      {/* FAQ note */}
      <div className="text-center text-gray-500 text-sm">
        Questions?{' '}
        <a href="mailto:support@robloxforge.gg" className="text-[#FFB81C] hover:underline">
          support@robloxforge.gg
        </a>
        {' '}or see the{' '}
        <Link href="/#faq" className="text-[#FFB81C] hover:underline">FAQ</Link>.
      </div>
    </div>
  )
}
