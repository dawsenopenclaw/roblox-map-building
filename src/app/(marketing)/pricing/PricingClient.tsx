'use client'
import { useState, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { Info, Check, X, Minus, ArrowRight, Zap } from 'lucide-react'
import { AnimatedCard } from '@/components/ui/animated-card'
import { AnimatedButton } from '@/components/ui/animated-button'
import { AnimatedCounter } from '@/components/ui/animated-counter'

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

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
  {
    feature: 'Tokens/month',
    tooltip: 'Tokens power every AI operation. Simple terrain = ~50 tokens. Full game scene = ~500 tokens.',
    free: '500',
    hobby: '2,000',
    creator: '7,000',
    studio: '20,000',
  },
  {
    feature: 'Voice Build',
    tooltip: 'Speak a description and watch AI generate terrain + assets in real-time.',
    free: 'Limited',
    hobby: 'Full',
    creator: 'Full',
    studio: 'Full',
  },
  {
    feature: 'Image to Map',
    tooltip: 'Upload any photo or sketch; AI converts it into a Roblox map.',
    free: 'Limited',
    hobby: 'Full',
    creator: 'Full',
    studio: 'Full',
  },
  {
    feature: 'Marketplace',
    tooltip: 'Browse community assets. Creator+ can list and sell your own.',
    free: 'Browse only',
    hobby: 'Browse + Buy',
    creator: 'Browse + Sell',
    studio: 'Browse + Sell',
  },
  {
    feature: 'Game DNA scanner',
    tooltip: 'Analyzes top-grossing Roblox games and extracts design patterns for your genre.',
    free: '✗',
    hobby: '✗',
    creator: '✓',
    studio: '✓',
  },
  {
    feature: 'Priority processing',
    tooltip: 'Your builds jump the queue. Typical response < 5 s vs. up to 30 s on free.',
    free: '✗',
    hobby: '✗',
    creator: '✓',
    studio: '✓',
  },
  {
    feature: 'Team collaboration',
    tooltip: 'Invite teammates to co-build. Assign roles, comment on scenes, version control.',
    free: '✗',
    hobby: '✗',
    creator: '3 members',
    studio: 'Unlimited',
  },
  {
    feature: 'API access',
    tooltip: 'Programmatic access to all build endpoints. Automate workflows and integrate with CI/CD.',
    free: '✗',
    hobby: '✗',
    creator: '✗',
    studio: '✓',
  },
  {
    feature: 'Support',
    tooltip: 'How fast you hear back from us.',
    free: 'Community',
    hobby: 'Email',
    creator: 'Priority',
    studio: 'Dedicated',
  },
  {
    feature: '14-day free trial',
    tooltip: 'All paid plans start with a full-featured 14-day trial. No credit card required.',
    free: '—',
    hobby: '✓',
    creator: '✓',
    studio: '✓',
  },
]

const TOKEN_USES = [
  { action: 'Simple terrain build', tokens: 50 },
  { action: 'Voice command (30 s)', tokens: 80 },
  { action: 'Image to map (basic)', tokens: 200 },
  { action: 'Full game scene', tokens: 500 },
  { action: 'Game DNA scan', tokens: 300 },
  { action: 'Custom asset generation', tokens: 150 },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function cellClass(val: string) {
  if (val === '✓' || val === 'Full' || val.includes('Sell')) return 'text-green-400'
  if (val === '✗') return 'text-gray-600'
  if (val === '—') return 'text-gray-600'
  return 'text-gray-300'
}

function CellIcon({ val }: { val: string }) {
  if (val === '✓') return <Check className="w-4 h-4 text-green-400 mx-auto" />
  if (val === '✗') return <X className="w-4 h-4 text-gray-600 mx-auto" />
  if (val === '—') return <Minus className="w-4 h-4 text-gray-600 mx-auto" />
  return <span className={cellClass(val)}>{val}</span>
}

function Tooltip({ tip }: { tip: string }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative inline-flex ml-1 align-middle">
      <button
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="text-gray-600 hover:text-gray-400 transition-colors"
        aria-label="More info"
      >
        <Info className="w-3.5 h-3.5" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 bg-[#1A1F45] border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300 leading-relaxed z-20 shadow-xl pointer-events-none"
          >
            {tip}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1A1F45]" />
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  )
}

function SectionFade({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function PricingPage() {
  const [annual, setAnnual] = useState(false)
  const [calcTokens, setCalcTokens] = useState(2000)

  const recommendedPlan = (tokens: number) => {
    if (tokens <= 500) return { name: 'Free', href: '/sign-up', price: '$0' }
    if (tokens <= 2000) return { name: 'Hobby', href: '/sign-up?plan=hobby', price: annual ? '$3.99' : '$4.99' }
    if (tokens <= 7000) return { name: 'Creator', href: '/sign-up?plan=creator', price: annual ? '$11.99' : '$14.99' }
    return { name: 'Studio', href: '/sign-up?plan=studio', price: annual ? '$39.99' : '$49.99' }
  }

  const rec = recommendedPlan(calcTokens)

  const annualSavings = (monthly: number) =>
    monthly === 0 ? 0 : Math.round(monthly * 12 - monthly * 0.8 * 12)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
      {/* Header */}
      <div className="text-center mb-12">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl sm:text-5xl font-bold text-white mb-4"
        >
          Simple, Transparent Pricing
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-xl text-gray-400 max-w-2xl mx-auto mb-8"
        >
          Start free. Upgrade when your game grows. All paid plans include a 14-day free trial.
        </motion.p>

        {/* Annual toggle */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="inline-flex items-center gap-3 bg-[#0D1231] border border-white/10 rounded-full p-1.5"
        >
          <button
            onClick={() => setAnnual(false)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              !annual ? 'bg-[#FFB81C] text-black' : 'text-gray-400 hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setAnnual(true)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
              annual ? 'bg-[#FFB81C] text-black' : 'text-gray-400 hover:text-white'
            }`}
          >
            Annual
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full border font-semibold transition-all ${
                annual
                  ? 'bg-black/20 text-black border-black/10'
                  : 'bg-green-500/20 text-green-400 border-green-500/30'
              }`}
            >
              Save 20%
            </span>
          </button>
        </motion.div>

        {/* Annual savings callout */}
        <AnimatePresence>
          {annual && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <p className="text-green-400 text-sm font-medium">
                Annual billing saves up to{' '}
                <span className="font-bold text-base">
                  ${annualSavings(TIERS.find((t) => t.key === 'STUDIO')!.priceMonthly)}/year
                </span>{' '}
                on Studio.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tier cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
        {TIERS.map((tier, i) => {
          const price = annual ? tier.priceYearly : tier.priceMonthly
          const savings = annualSavings(tier.priceMonthly)
          return (
            <AnimatedCard
              key={tier.key}
              index={i}
              noGlow={!tier.highlight}
              className={`relative flex flex-col rounded-2xl border p-6 ${
                tier.highlight
                  ? 'bg-gradient-to-b from-[#FFB81C]/8 to-[#0D1231] border-[#FFB81C]/50 ring-2 ring-[#FFB81C]/25 shadow-2xl shadow-[#FFB81C]/10'
                  : 'bg-[#0D1231] border-white/10'
              }`}
            >
              {tier.highlight && (
                <>
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-[#FFB81C] text-black text-xs font-bold px-3 py-1 rounded-full shadow-lg shadow-[#FFB81C]/30 whitespace-nowrap">
                      Most Popular
                    </span>
                  </div>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-[#FFB81C]/10 via-transparent to-transparent pointer-events-none" />
                </>
              )}

              <div className="mb-5 relative">
                <p className="text-lg font-bold text-white mb-0.5">{tier.name}</p>
                <p className="text-gray-400 text-sm leading-snug">{tier.description}</p>
              </div>

              <div className="mb-6 relative">
                {price === 0 ? (
                  <p className="text-4xl font-bold text-white">Free</p>
                ) : (
                  <div>
                    <div className="flex items-end gap-1">
                      <p className="text-4xl font-bold text-white">${price}</p>
                      <span className="text-gray-500 text-sm mb-1.5">/mo</span>
                    </div>
                    <AnimatePresence mode="wait">
                      {annual ? (
                        <motion.div
                          key="annual"
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-0.5"
                        >
                          <p className="text-xs text-gray-400">
                            Billed ${(price * 12).toFixed(0)}/year
                          </p>
                          {savings > 0 && (
                            <p className="text-xs text-green-400 font-medium">
                              Save ${savings}/year
                            </p>
                          )}
                        </motion.div>
                      ) : (
                        <motion.p
                          key="monthly"
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.2 }}
                          className="text-xs text-gray-500"
                        >
                          or ${tier.priceYearly}/mo billed annually
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                )}
                <p className="text-sm text-[#FFB81C] mt-2 font-medium flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" />
                  <AnimatedCounter value={tier.tokens} /> tokens/month
                </p>
              </div>

              <Link href={tier.ctaHref} className="mb-6 block">
                <AnimatedButton
                  glowColor={tier.highlight ? 'gold' : 'blue'}
                  className={`w-full font-bold py-3 rounded-xl text-sm ${
                    tier.highlight
                      ? 'bg-[#FFB81C] hover:bg-[#E6A519] text-black shadow-lg shadow-[#FFB81C]/25'
                      : 'border border-white/20 hover:border-white/40 text-white hover:bg-white/5'
                  }`}
                >
                  {tier.cta}
                </AnimatedButton>
              </Link>

              <div className="space-y-2 flex-1 relative">
                {tier.features.map((f) => (
                  <div key={f} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300 text-sm">{f}</span>
                  </div>
                ))}
                {tier.limits.map((l) => (
                  <div key={l} className="flex items-start gap-2">
                    <X className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600 text-sm">{l}</span>
                  </div>
                ))}
              </div>
            </AnimatedCard>
          )
        })}
      </div>

      {/* Token calculator */}
      <SectionFade className="mb-20">
        <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-8 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-1">
            How Many Tokens Do I Need?
          </h2>
          <p className="text-gray-400 text-center text-sm mb-8">
            Drag to estimate your monthly usage
          </p>

          <input
            type="range"
            min={100}
            max={20000}
            step={100}
            value={calcTokens}
            onChange={(e) => setCalcTokens(Number(e.target.value))}
            className="w-full accent-[#FFB81C] cursor-pointer mb-2"
          />
          <div className="flex justify-between text-xs text-gray-500 mb-8">
            <span>100</span>
            <span className="text-[#FFB81C] font-bold text-base">
              {calcTokens.toLocaleString()} tokens/mo
            </span>
            <span>20,000</span>
          </div>

          {/* Recommendation box */}
          <div className="bg-[#111640] rounded-xl p-5 mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-gray-400 text-sm">Recommended plan</p>
              <p className="text-2xl font-bold text-[#FFB81C] mt-0.5">{rec.name}</p>
              <p className="text-gray-400 text-sm mt-0.5">
                {rec.name === 'Free'
                  ? 'Free forever'
                  : `${annual ? 'Annual' : 'Monthly'}: ${rec.price}/mo`}
              </p>
            </div>
            <Link
              href={rec.href}
              className="flex-shrink-0 flex items-center gap-1.5 bg-[#FFB81C] hover:bg-[#E6A519] text-black font-bold px-4 py-2.5 rounded-xl text-sm transition-all"
            >
              Get started
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Token use reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {TOKEN_USES.map((use) => (
              <div
                key={use.action}
                className="flex items-center justify-between text-sm bg-[#0A0E27] rounded-lg px-3 py-2"
              >
                <span className="text-gray-400">{use.action}</span>
                <span className="text-[#FFB81C] font-medium ml-2 flex items-center gap-0.5">
                  <Zap className="w-3 h-3" />
                  {use.tokens}
                </span>
              </div>
            ))}
          </div>
        </div>
      </SectionFade>

      {/* Feature matrix */}
      <SectionFade className="mb-20">
        <h2 className="text-2xl font-bold text-white text-center mb-8">Full Feature Comparison</h2>
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-[#0D1231]">
                <th className="text-left py-4 px-4 text-sm text-gray-400 font-medium w-48">
                  Feature
                </th>
                {TIERS.map((t) => (
                  <th
                    key={t.key}
                    className={`py-4 px-4 text-center text-sm font-semibold ${
                      t.highlight ? 'text-[#FFB81C]' : 'text-white'
                    }`}
                  >
                    {t.highlight && (
                      <span className="block text-xs text-[#FFB81C]/60 font-normal mb-0.5">
                        Popular
                      </span>
                    )}
                    {t.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURE_MATRIX.map((row, i) => (
                <tr
                  key={row.feature}
                  className={`border-b border-white/5 transition-colors hover:bg-white/2 ${
                    i % 2 === 0 ? 'bg-[#0A0E27]/40' : ''
                  }`}
                >
                  <td className="py-3.5 px-4 text-sm text-gray-300 whitespace-nowrap">
                    <span className="inline-flex items-center">
                      {row.feature}
                      {row.tooltip && <Tooltip tip={row.tooltip} />}
                    </span>
                  </td>
                  {[row.free, row.hobby, row.creator, row.studio].map((val, j) => (
                    <td
                      key={j}
                      className={`py-3.5 px-4 text-center text-sm ${
                        TIERS[j].highlight ? 'bg-[#FFB81C]/3' : ''
                      }`}
                    >
                      <CellIcon val={val} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionFade>

      {/* Guarantees */}
      <SectionFade className="mb-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          {[
            {
              icon: '🔒',
              title: '14-Day Free Trial',
              body: 'All paid plans. No credit card required to start.',
            },
            {
              icon: '↩',
              title: 'Cancel Anytime',
              body: 'One-click cancellation. No retention dark patterns.',
            },
            {
              icon: '💛',
              title: '10% to Charity',
              body: 'Every dollar supports a cause you choose.',
            },
          ].map((g) => (
            <div key={g.title} className="bg-[#0D1231] border border-white/10 rounded-2xl p-6">
              <div className="text-4xl mb-3">{g.icon}</div>
              <p className="font-semibold text-white mb-2">{g.title}</p>
              <p className="text-gray-400 text-sm">{g.body}</p>
            </div>
          ))}
        </div>
      </SectionFade>

      {/* FAQ note */}
      <div className="text-center text-gray-500 text-sm">
        Questions?{' '}
        <a href="mailto:support@robloxforge.gg" className="text-[#FFB81C] hover:underline">
          support@robloxforge.gg
        </a>{' '}
        or see the{' '}
        <Link href="/#faq" className="text-[#FFB81C] hover:underline">
          FAQ
        </Link>
        .
      </div>
    </div>
  )
}
