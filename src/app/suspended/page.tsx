'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

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
  'chargeback': {
    label: 'Disputed charge',
    detail:
      'A chargeback was filed against a recent transaction. Please contact our billing team to resolve this.',
  },
  'fraud': {
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
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-[#141414] border border-red-500/20 rounded-2xl p-10 shadow-2xl">

          {/* Icon */}
          <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <svg
              className="w-9 h-9 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
          </div>

          {/* Heading */}
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Account Suspended</h1>
          <p className="text-gray-300 text-sm mb-8">
            Access to your ForjeGames account has been suspended.
          </p>

          {/* Reason card */}
          {reason ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-5 py-4 text-left mb-8">
              <p className="text-xs text-red-400 uppercase tracking-wider font-medium mb-1">
                Reason
              </p>
              <p className="text-white font-semibold text-sm mb-1">{reason.label}</p>
              <p className="text-gray-300 text-sm">{reason.detail}</p>
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-left mb-8">
              <p className="text-gray-300 text-sm">
                Your account has been suspended. Please contact our support team for details.
              </p>
            </div>
          )}

          {/* Appeal process */}
          <div className="text-left mb-8">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-3">
              Appeal process
            </p>
            <ol className="space-y-3">
              {[
                'Review our Acceptable Use Policy to understand the violation.',
                'Gather any relevant information that supports your appeal.',
                'Submit a support ticket with "Account Appeal" as the subject.',
                'Our team will respond within 2–3 business days.',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
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
              href="mailto:support@ForjeGames.gg?subject=Account%20Appeal"
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#FFB81C] hover:bg-[#E6A519] text-black font-bold text-sm transition-colors"
            >
              Contact support
            </a>
            <a
              href="/acceptable-use"
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-white/10 hover:border-white/30 text-white text-sm font-medium transition-colors"
            >
              View policy
            </a>
          </div>

        </div>
      </div>
    </div>
  )
}

export default function SuspendedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a]" />}>
      <SuspendedContent />
    </Suspense>
  )
}
