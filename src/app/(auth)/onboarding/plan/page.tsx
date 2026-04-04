'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Check, Zap, Rocket, Building2 } from 'lucide-react'

// ---------------------------------------------------------------------------
// Plan definitions — aligned with billing checkout tiers
// ---------------------------------------------------------------------------

const PLANS = [
  {
    key: 'FREE' as const,
    name: 'Free',
    icon: Zap,
    price: '$0',
    period: 'forever',
    tagline: '1,000 tokens to get started',
    highlight: false,
    cta: 'Start free',
    features: [
      '1,000 AI tokens',
      '1 project',
      'Basic templates',
      'Community support',
      'COPPA compliant',
    ],
  },
  {
    key: 'CREATOR' as const,
    name: 'Creator',
    icon: Rocket,
    price: '$15',
    period: '/mo',
    tagline: '50K tokens + priority AI',
    highlight: true,
    badge: 'Recommended',
    cta: 'Start 14-day trial',
    features: [
      '50,000 AI tokens / mo',
      'Unlimited projects',
      'Priority AI queue',
      'Mesh generation',
      'All templates',
      'Email support',
    ],
  },
  {
    key: 'STUDIO' as const,
    name: 'Studio',
    icon: Building2,
    price: '$50',
    period: '/mo',
    tagline: '200K tokens + team + API',
    highlight: false,
    cta: 'Start 14-day trial',
    features: [
      '200,000 AI tokens / mo',
      'Team collaboration',
      'Full API access',
      'White-label exports',
      'Dedicated support',
      'All Creator features',
    ],
  },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function OnboardingPlanPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  async function handlePaidPlan(tier: 'CREATOR' | 'STUDIO') {
    setLoading(tier)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'subscription', tier }),
      })
      const data = (await res.json()) as { url?: string; error?: string }
      if (data.url) {
        window.location.href = data.url
      } else {
        // Billing not configured / demo mode — go to editor
        router.push('/editor')
      }
    } catch {
      router.push('/editor')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16" style={{ background: '#050810' }}>
      {/* Logo */}
      <div className="mb-10 text-center">
        <Link href="/" className="inline-flex items-center gap-2 select-none">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden>
            <polygon
              points="16,2 30,10 30,22 16,30 2,22 2,10"
              stroke="#D4AF37"
              strokeWidth="1.5"
              fill="rgba(212,175,55,0.08)"
            />
            <polygon points="16,8 24,13 24,19 16,24 8,19 8,13" fill="#D4AF37" opacity="0.6" />
            <circle cx="16" cy="16" r="3" fill="#D4AF37" />
          </svg>
          <span className="text-lg font-bold tracking-tight">
            <span className="text-white">Forje</span>
            <span style={{ color: '#D4AF37' }}>Games</span>
          </span>
        </Link>
      </div>

      {/* Header */}
      <div className="text-center mb-12 max-w-lg">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
          Choose your plan
        </h1>
        <p className="text-[#8B95B0] text-base">
          Pick the plan that fits your ambition. Start free, upgrade anytime.
        </p>
      </div>

      {/* Cards */}
      <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-3 gap-5 items-start">
        {PLANS.map((plan) => {
          const Icon = plan.icon
          const isLoading = loading === plan.key

          return (
            <div
              key={plan.key}
              className={`relative flex flex-col rounded-2xl border p-6 transition-all duration-300 ${
                plan.highlight
                  ? 'shadow-[0_0_50px_rgba(212,175,55,0.12),0_8px_32px_rgba(212,175,55,0.08)] sm:-mt-4 sm:pb-10 sm:pt-10'
                  : 'hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)]'
              }`}
              style={
                plan.highlight
                  ? {
                      background: 'linear-gradient(160deg, #0E1530 0%, #0B1028 100%)',
                      borderColor: 'rgba(212,175,55,0.3)',
                    }
                  : { background: '#0F1535', borderColor: '#1A2550' }
              }
            >
              {/* Badge */}
              {'badge' in plan && plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span
                    className="text-xs font-bold px-4 py-1.5 rounded-full text-black whitespace-nowrap"
                    style={{ background: 'linear-gradient(135deg, #D4AF37, #FFD966)' }}
                  >
                    {plan.badge}
                  </span>
                </div>
              )}

              {/* Icon + name */}
              <div className="mb-5 mt-1">
                <div
                  className={`inline-flex items-center justify-center w-10 h-10 rounded-xl mb-3 ${
                    plan.highlight ? 'bg-[#D4AF37]/15 text-[#D4AF37]' : 'bg-white/5 text-[#8B95B0]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <p
                  className={`text-lg font-bold mb-1 ${
                    plan.highlight ? 'text-[#D4AF37]' : 'text-white'
                  }`}
                >
                  {plan.name}
                </p>
                <p className="text-[#8B95B0] text-sm">{plan.tagline}</p>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-end gap-1">
                  <p className="text-4xl font-extrabold text-white">{plan.price}</p>
                  <span className="text-[#8B95B0] text-sm mb-2">{plan.period}</span>
                </div>
              </div>

              {/* CTA */}
              {plan.key === 'FREE' ? (
                <Link
                  href="/editor"
                  className="block text-center font-bold py-3 rounded-xl text-sm transition-all border border-[#1A2550] hover:border-[#2A3570] text-white hover:bg-white/5"
                >
                  {plan.cta}
                </Link>
              ) : (
                <button
                  onClick={() => handlePaidPlan(plan.key)}
                  disabled={isLoading}
                  className={`w-full font-bold py-3 rounded-xl text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                    plan.highlight
                      ? 'text-black hover:opacity-90 hover:scale-[1.02]'
                      : 'border border-[#1A2550] hover:border-[#2A3570] text-white hover:bg-white/5'
                  }`}
                  style={
                    plan.highlight
                      ? { background: 'linear-gradient(135deg, #D4AF37, #FFD966)' }
                      : {}
                  }
                >
                  {isLoading ? 'Redirecting…' : plan.cta}
                </button>
              )}

              {plan.key !== 'FREE' && (
                <p className="text-center text-xs text-[#8B95B0] mt-2 mb-4">
                  After trial, billed {plan.price}/mo. Cancel anytime.
                </p>
              )}
              {plan.key === 'FREE' && <div className="mb-6" />}

              {/* Divider */}
              <div
                className="h-px mb-5"
                style={{
                  background: plan.highlight ? 'rgba(212,175,55,0.2)' : '#1A2550',
                }}
              />

              {/* Features */}
              <ul className="space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check
                      className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                        plan.highlight ? 'text-[#D4AF37]' : 'text-[#8B95B0]'
                      }`}
                    />
                    <span
                      className={`text-sm ${
                        plan.highlight ? 'text-[#FAFAFA]' : 'text-[#8B95B0]'
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

      {/* Skip */}
      <p className="mt-8 text-sm text-[#8B95B0]">
        Not sure yet?{' '}
        <Link href="/editor" className="text-white hover:text-[#D4AF37] transition-colors underline underline-offset-2">
          Skip for now
        </Link>{' '}
        — you can upgrade from your dashboard anytime.
      </p>
    </div>
  )
}
