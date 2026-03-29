'use client'

import { useEffect } from 'react'
import type { ReactElement } from 'react'
import Link from 'next/link'
import * as Sentry from '@sentry/nextjs'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  const isTimeout =
    error.message?.toLowerCase().includes('timeout') ||
    error.message?.toLowerCase().includes('timed out')

  const isPaymentError =
    error.message?.toLowerCase().includes('payment') ||
    error.message?.toLowerCase().includes('stripe')

  if (isTimeout) {
    return (
      <ErrorShell
        icon={<ClockIcon />}
        iconBg="bg-yellow-500/10"
        iconBorder="border-yellow-500/20"
        heading="Taking longer than usual"
        body="Our AI is handling a lot of requests right now. Your work is safe — nothing was lost."
        digest={error.digest}
        reset={reset}
        primaryLabel="Try again"
        reportType="timeout"
      />
    )
  }

  if (isPaymentError) {
    return (
      <ErrorShell
        icon={<CardIcon />}
        iconBg="bg-red-500/10"
        iconBorder="border-red-500/20"
        heading="Payment issue"
        body="There was a problem with your payment. Your subscription was not changed."
        digest={error.digest}
        reset={reset}
        primaryLabel="Update billing"
        primaryHref="/billing"
        reportType="payment"
      />
    )
  }

  return (
    <ErrorShell
      icon={<AlertIcon />}
      iconBg="bg-red-500/10"
      iconBorder="border-red-500/20"
      heading="Something went wrong"
      body="An unexpected error occurred. We've been notified and are looking into it."
      digest={error.digest}
      reset={reset}
      primaryLabel="Try again"
      reportType="unknown"
    />
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function ErrorShell({
  icon,
  iconBg,
  iconBorder,
  heading,
  body,
  digest,
  reset,
  primaryLabel,
  primaryHref,
  reportType,
}: {
  icon: ReactElement
  iconBg: string
  iconBorder: string
  heading: string
  body: string
  digest?: string
  reset: () => void
  primaryLabel: string
  primaryHref?: string
  reportType: string
}) {
  return (
    <div className="min-h-screen bg-[#0A0E27] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-10">
          {/* Illustration / Icon */}
          <div className={`w-20 h-20 mx-auto mb-6 rounded-full ${iconBg} border ${iconBorder} flex items-center justify-center`}>
            {icon}
          </div>

          <h1 className="text-2xl font-bold text-white mb-3">{heading}</h1>

          <p className="text-gray-400 text-sm leading-relaxed mb-2">{body}</p>

          {digest && (
            <p className="text-gray-600 text-xs font-mono mb-6">
              Error ID: {digest}
            </p>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
            {primaryHref ? (
              <Link
                href={primaryHref}
                className="bg-[#FFB81C] hover:bg-[#E6A519] text-black font-bold px-6 py-3 rounded-xl transition-colors text-sm text-center"
              >
                {primaryLabel}
              </Link>
            ) : (
              <button
                onClick={reset}
                className="bg-[#FFB81C] hover:bg-[#E6A519] text-black font-bold px-6 py-3 rounded-xl transition-colors text-sm"
              >
                {primaryLabel}
              </button>
            )}
            <Link
              href="/dashboard"
              className="border border-white/20 hover:border-white/40 text-white px-6 py-3 rounded-xl transition-colors text-sm text-center"
            >
              Go home
            </Link>
          </div>

          {/* Report bug */}
          <p className="text-gray-600 text-xs mt-6">
            Still stuck?{' '}
            <a
              href={`mailto:support@robloxforge.gg?subject=Bug+report+[${reportType}]${digest ? `&body=Error+ID:+${digest}` : ''}`}
              className="text-[#FFB81C] hover:underline"
            >
              Report a bug
            </a>
            {' · '}
            <a href="mailto:support@robloxforge.gg" className="text-[#FFB81C] hover:underline">
              support@robloxforge.gg
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

function AlertIcon() {
  return (
    <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg className="w-10 h-10 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  )
}

function CardIcon() {
  return (
    <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
    </svg>
  )
}
