'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'

const SUSPENSION_REASONS: Record<string, { label: string; detail: string }> = {
  'policy-violation': {
    label: 'Policy violation',
    detail:
      'Your account was suspended for violating our Acceptable Use Policy. This includes prohibited content, abuse of the platform, or harmful activity.',
  },
  'payment-issue': {
    label: 'Payment issue',
    detail:
      'We were unable to process your payment and your subscription has lapsed. Please update your billing information to restore access.',
  },
  chargeback: {
    label: 'Disputed charge',
    detail:
      'A chargeback was filed against a recent transaction. Please contact our billing team to resolve this.',
  },
  fraud: {
    label: 'Suspected fraud',
    detail:
      'Unusual activity was detected on your account and it has been temporarily suspended for review.',
  },
}

function SuspendedContent() {
  const searchParams = useSearchParams()
  const reasonKey = searchParams.get('reason') ?? ''
  const reason = SUSPENSION_REASONS[reasonKey] ?? null

  return (
    <div className="min-h-screen bg-[#050810] flex items-center justify-center p-4 overflow-hidden">
      {/* Radial glow */}
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center">
        <div className="w-[500px] h-[500px] rounded-full bg-[#f87171]/8 blur-[120px]" />
      </div>

      <div className="relative max-w-md w-full text-center">
        <div className="bg-white/[0.025] border border-white/[0.07] rounded-2xl p-10 shadow-2xl backdrop-blur-sm">

          {/* Icon */}
          <div className="mx-auto mb-7 relative w-20 h-20">
            <div className="absolute inset-0 rounded-full bg-[#f87171]/10 animate-ping" style={{ animationDuration: '3s' }} />
            <div className="relative w-20 h-20 rounded-full bg-[#f87171]/10 border border-[#f87171]/20 flex items-center justify-center">
              <svg
                className="w-9 h-9 text-[#f87171]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M4.93 4.93L19.07 19.07" />
              </svg>
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">Account Suspended</h1>
          <p className="text-gray-400 text-sm mb-8">
            Access to your ForjeGames account has been suspended.
          </p>

          {/* Reason card */}
          {reason ? (
            <div className="bg-[#f87171]/8 border border-[#f87171]/20 rounded-xl px-5 py-4 text-left mb-8">
              <p className="text-xs text-[#f87171] uppercase tracking-wider font-medium mb-1">Reason</p>
              <p className="text-white font-semibold text-sm mb-1">{reason.label}</p>
              <p className="text-gray-400 text-sm">{reason.detail}</p>
            </div>
          ) : (
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl px-5 py-4 text-left mb-8">
              <p className="text-gray-400 text-sm">
                Your account has been suspended. Please contact our support team for details.
              </p>
            </div>
          )}

          {/* Appeal process */}
          <div className="text-left mb-8">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-4">Appeal process</p>
            <ol className="space-y-3">
              {[
                'Review our Acceptable Use Policy to understand the violation.',
                'Gather any relevant information that supports your appeal.',
                'Submit a support ticket with "Account Appeal" as the subject.',
                'Our team will respond within 2–3 business days.',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-400">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/10 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="mailto:support@forjegames.com?subject=Account%20Appeal"
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-black font-bold text-sm transition-all shadow-lg shadow-[#f87171]/20 hover:shadow-[#f87171]/30 hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)' }}
            >
              Contact support
            </a>
            <a
              href="/acceptable-use"
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-white/10 hover:border-white/25 text-white text-sm font-medium transition-colors"
            >
              View policy
            </a>
          </div>

        </div>

        {/* Branding */}
        <p className="mt-6 text-xs text-gray-500">
          <Link href="/" className="hover:text-[#D4AF37] transition-colors font-medium">ForjeGames</Link>
          {' '}— AI-powered Roblox game builder
        </p>
      </div>
    </div>
  )
}

export default function SuspendedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050810]" />}>
      <SuspendedContent />
    </Suspense>
  )
}
