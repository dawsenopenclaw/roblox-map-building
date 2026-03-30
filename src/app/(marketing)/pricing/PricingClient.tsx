'use client'

import { useState, useRef, useEffect, useId } from 'react'
import Link from 'next/link'
import { Check, X, ChevronDown, Heart, Zap, Star, Rocket, Building2 } from 'lucide-react'

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
    key: 'STARTER',
    name: 'Starter',
    icon: Star,
    priceMonthly: 9.99,
    priceYearly: 7.99,
    tagline: 'For hobbyists leveling up',
    highlight: false,
    badge: null,
    cta: 'Start Starter Trial',
    ctaHref: '/sign-up?plan=starter',
    features: [
      '100 AI generations / day',
      '5 projects',
      'Marketplace access',
      'All basic templates',
      'Email support',
      'COPPA compliant',
    ],
  },
  {
    key: 'PRO',
    name: 'Pro',
    icon: Rocket,
    priceMonthly: 24.99,
    priceYearly: 19.99,
    tagline: 'For serious creators',
    highlight: true,
    badge: 'Most Popular',
    cta: 'Start Pro Trial',
    ctaHref: '/sign-up?plan=pro',
    features: [
      '1,000 AI generations / day',
      'Unlimited projects',
      'Marketplace access + selling',
      'Team collaboration (3 members)',
      'Game DNA scanner',
      'Priority support',
      'All premium templates',
      'Advanced analytics',
    ],
  },
  {
    key: 'STUDIO',
    name: 'Studio',
    icon: Building2,
    priceMonthly: 49.99,
    priceYearly: 39.99,
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
      'Team collaboration (50 members)',
      'Dedicated support',
      'Priority AI queue',
      'Custom integrations',
      'All Pro features included',
    ],
  },
]

// Feature matrix for comparison table
const COMPARE_FEATURES = [
  { label: 'AI generations / day',        free: '10',         starter: '100',          pro: '1,000',        studio: 'Unlimited'  },
  { label: 'Projects',                    free: '1',          starter: '5',            pro: 'Unlimited',    studio: 'Unlimited'  },
  { label: 'Basic templates',             free: true,         starter: true,           pro: true,           studio: true         },
  { label: 'Marketplace access',          free: false,        starter: true,           pro: true,           studio: true         },
  { label: 'Marketplace selling',         free: false,        starter: false,          pro: true,           studio: true         },
  { label: 'Team members',               free: 'Solo',       starter: 'Solo',         pro: '3',            studio: '50'         },
  { label: 'Game DNA scanner',           free: false,        starter: false,          pro: true,           studio: true         },
  { label: 'Priority AI queue',          free: false,        starter: false,          pro: true,           studio: true         },
  { label: 'API access',                 free: false,        starter: false,          pro: false,          studio: true         },
  { label: 'White-label exports',        free: false,        starter: false,          pro: false,          studio: true         },
  { label: 'Support',                    free: 'Community',  starter: 'Email',        pro: 'Priority',     studio: 'Dedicated'  },
  { label: 'COPPA compliant',            free: true,         starter: true,           pro: true,           studio: true         },
]

const FAQ = [
  {
    q: 'What counts as an AI generation?',
    a: 'Each time the AI generates something — terrain, a building, a map scene, a script — that counts as 1 generation. Free plan includes 10 per day, Starter gets 100/day, Pro gets 1,000/day, and Studio is unlimited.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. No contracts, no cancellation fees. Cancel in one click and you keep access until the end of your billing period.',
  },
  {
    q: 'Is it safe for kids?',
    a: 'Yes. ForjeGames is COPPA compliant with parental controls built in. Safe for creators aged 8 and up with parental consent.',
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
  {
    q: 'What is API access on Studio?',
    a: 'Studio plan includes full REST API and SDK access (npm, Python, Go) so you can integrate ForjeGames into your own tools, CI/CD pipelines, or custom workflows.',
  },
  {
    q: 'Can I upgrade or downgrade my plan?',
    a: "Yes. You can switch plans at any time. Upgrades take effect immediately (prorated). Downgrades take effect at the next billing cycle so you don't lose features you've paid for.",
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(p: number) {
  return p % 1 === 0 ? `$${p}` : `$${p.toFixed(2)}`
}

// ---------------------------------------------------------------------------
// Animated FAQ item
// ---------------------------------------------------------------------------

function FaqItem({ q, a, isOpen, onToggle }: { q: string; a: string; isOpen: boolean; onToggle: () => void }) {
  const bodyRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(0)
  const uid = useId()
  const panelId = `faq-panel-${uid}`
  const buttonId = `faq-btn-${uid}`

  useEffect(() => {
    if (!bodyRef.current) return
    const el = bodyRef.current
    setHeight(isOpen ? el.scrollHeight : 0)
  }, [isOpen])

  return (
    <div className="border border-white/10 rounded-xl overflow-hidden bg-[#0a0d19]">
      <button
        id={buttonId}
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/5 transition-colors"
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        <span className="text-white font-semibold text-sm pr-4">{q}</span>
        <ChevronDown
          aria-hidden="true"
          className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        style={{ height, overflow: 'hidden', transition: 'height 220ms ease', willChange: 'height' }}
      >
        <div ref={bodyRef} className="px-5 pb-5 pt-1">
          <p className="text-gray-300 text-sm leading-relaxed">{a}</p>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Comparison table cell
// ---------------------------------------------------------------------------

function CompareCell({ value }: { value: string | boolean }) {
  if (typeof value === 'boolean') {
    return value ? (
      <Check className="w-4 h-4 text-[#FFB81C] mx-auto" />
    ) : (
      <X className="w-4 h-4 text-gray-600 mx-auto" />
    )
  }
  return <span className="text-sm text-gray-300">{value}</span>
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
          <p className="text-lg text-gray-300 mb-10 max-w-xl mx-auto">
            Start free. No credit card required. Upgrade when you&apos;re ready.
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center bg-white/5 border border-white/10 rounded-full p-1">
            <button
              onClick={() => setAnnual(false)}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
                !annual
                  ? 'bg-white text-black shadow'
                  : 'text-gray-300 hover:text-[#FFB81C]'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
                annual
                  ? 'bg-white text-black shadow'
                  : 'text-gray-300 hover:text-[#FFB81C]'
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-14 items-start">
          {TIERS.map((tier) => {
            const price = annual ? tier.priceYearly : tier.priceMonthly
            const Icon = tier.icon

            return (
              <div
                key={tier.key}
                className={`relative flex flex-col rounded-2xl border p-6 transition-all ${
                  tier.highlight
                    ? 'bg-[#0f1320] border-[#FFB81C]/70 shadow-[0_0_50px_rgba(255,184,28,0.15)] lg:-mt-4 lg:pb-10 lg:pt-10'
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
                        : 'bg-white/5 text-gray-300'
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
                  <p className="text-gray-400 text-sm">{tier.tagline}</p>
                </div>

                {/* Price */}
                <div className="mb-6">
                  {price === 0 ? (
                    <p className="text-5xl font-extrabold text-white">Free</p>
                  ) : (
                    <div className="flex items-end gap-1">
                      <p className="text-4xl font-extrabold text-white">
                        {formatPrice(price)}
                      </p>
                      <span className="text-gray-400 text-sm mb-2">/mo</span>
                    </div>
                  )}
                  {annual && price > 0 && (
                    <p className="text-xs text-gray-400 mt-1">
                      Billed {formatPrice(price * 12)}/year
                    </p>
                  )}
                  {!annual && price > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      or {formatPrice(tier.priceYearly)}/mo billed annually
                    </p>
                  )}
                </div>

                {/* CTA */}
                <Link
                  href={tier.ctaHref}
                  className={`block text-center font-bold py-3 rounded-xl text-sm transition-all ${
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
                {tier.priceMonthly > 0 && (
                  <p className="text-center text-xs text-gray-500 mt-2 mb-5">Cancel anytime. No hidden fees.</p>
                )}
                {tier.priceMonthly === 0 && <div className="mb-7" />}

                {/* Divider */}
                <div className={`h-px mb-5 ${tier.highlight ? 'bg-[#FFB81C]/20' : 'bg-white/5'}`} />

                {/* Features */}
                <ul className="space-y-3">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check
                        className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                          tier.highlight ? 'text-[#FFB81C]' : 'text-gray-400'
                        }`}
                      />
                      <span
                        className={`text-sm ${
                          tier.highlight ? 'text-gray-200' : 'text-gray-300'
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
        <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 mb-20 text-sm text-gray-400">
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
        {/* Comparison Table                                                    */}
        {/* ------------------------------------------------------------------ */}
        <div className="mb-20 overflow-x-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-8">
            Compare plans
          </h2>
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400 w-1/3">Feature</th>
                {TIERS.map((tier) => (
                  <th
                    key={tier.key}
                    className={`text-center py-3 px-3 text-sm font-bold ${
                      tier.highlight ? 'text-[#FFB81C]' : 'text-white'
                    }`}
                  >
                    {tier.name}
                  </th>
                ))}
              </tr>
              <tr>
                <td />
                {TIERS.map((tier) => {
                  const price = annual ? tier.priceYearly : tier.priceMonthly
                  return (
                    <td key={tier.key} className="text-center pb-4 px-3">
                      <span className="text-xs text-gray-400">
                        {price === 0 ? 'Free' : `${formatPrice(price)}/mo`}
                      </span>
                    </td>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {COMPARE_FEATURES.map((row, i) => (
                <tr
                  key={row.label}
                  className={i % 2 === 0 ? 'bg-white/[0.02]' : ''}
                >
                  <td className="py-3 px-4 text-sm text-gray-300 rounded-l-lg">{row.label}</td>
                  <td className="py-3 px-3 text-center"><CompareCell value={row.free} /></td>
                  <td className="py-3 px-3 text-center"><CompareCell value={row.starter} /></td>
                  <td className={`py-3 px-3 text-center ${i % 2 === 0 ? 'bg-[#FFB81C]/[0.04]' : 'bg-[#FFB81C]/[0.02]'}`}>
                    <CompareCell value={row.pro} />
                  </td>
                  <td className="py-3 px-3 text-center rounded-r-lg"><CompareCell value={row.studio} /></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td />
                {TIERS.map((tier) => (
                  <td key={tier.key} className="pt-6 px-3 text-center">
                    <Link
                      href={tier.ctaHref}
                      className={`inline-block text-xs font-bold py-2 px-4 rounded-lg transition-all ${
                        tier.highlight
                          ? 'text-black hover:opacity-90'
                          : 'border border-white/20 hover:border-white/40 text-white hover:bg-white/5'
                      }`}
                      style={
                        tier.highlight
                          ? { background: 'linear-gradient(135deg, #FFB81C, #FFD966)' }
                          : {}
                      }
                    >
                      {tier.key === 'FREE' ? 'Get Started' : 'Try Free'}
                    </Link>
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
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
              <p className="text-white font-semibold">10% of all revenue donated to charity</p>
              <p className="text-gray-400 text-xs mt-0.5">
                Every paid plan contributes to coding &amp; STEM education nonprofits worldwide.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
