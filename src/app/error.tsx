'use client'

import { useEffect, useState } from 'react'
import type { ReactElement } from 'react'
import Link from 'next/link'
import * as Sentry from '@sentry/nextjs'

export default function ErrorPage({
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
        iconBg="bg-amber-500/10"
        iconBorder="border-amber-500/20"
        accentColor="#F59E0B"
        heading="Taking longer than usual"
        body="Our AI is handling a lot of requests right now. Your work is safe — nothing was lost. Give it a moment and try again."
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
        accentColor="#F87171"
        heading="Payment issue"
        body="There was a problem processing your payment. Your subscription status was not changed and no charge was made."
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
      accentColor="#F87171"
      heading="Something went wrong"
      body="An unexpected error occurred. We've been automatically notified and are looking into it. Your data is safe."
      digest={error.digest}
      reset={reset}
      primaryLabel="Try again"
      reportType="unknown"
    />
  )
}

// ─── Shared shell ──────────────────────────────────────────────────────────────

function ErrorShell({
  icon,
  iconBg,
  iconBorder,
  accentColor,
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
  accentColor: string
  heading: string
  body: string
  digest?: string
  reset: () => void
  primaryLabel: string
  primaryHref?: string
  reportType: string
}) {
  const [retrying, setRetrying] = useState(false)

  function handleReset() {
    setRetrying(true)
    setTimeout(() => {
      setRetrying(false)
      reset()
    }, 600)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center">
        <div
          className="w-[500px] h-[500px] rounded-full blur-[100px] opacity-10"
          style={{ backgroundColor: accentColor }}
        />
      </div>

      <div className="relative max-w-md w-full text-center">
        <div className="bg-[#141414]/90 backdrop-blur-sm border border-white/10 rounded-2xl p-10 shadow-2xl">

          {/* Icon */}
          <div
            className={`w-20 h-20 mx-auto mb-6 rounded-full ${iconBg} border ${iconBorder} flex items-center justify-center`}
          >
            {icon}
          </div>

          <h1 className="text-2xl font-bold text-white mb-3">{heading}</h1>
          <p className="text-gray-300 text-sm leading-relaxed mb-2">{body}</p>

          {digest && (
            <p className="text-gray-500 text-xs font-mono mb-1 mt-4">
              Error ID: {digest}
            </p>
          )}

          {/* Inline status hint */}
          <p className="text-gray-500 text-xs mb-6">
            We&apos;ve been notified — no action needed on your end.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {primaryHref ? (
              <Link
                href={primaryHref}
                className="bg-[#FFB81C] hover:bg-[#E6A519] text-black font-bold px-6 py-3 rounded-xl transition-all text-sm text-center shadow-lg shadow-[#FFB81C]/20 hover:shadow-[#FFB81C]/30 hover:-translate-y-0.5"
              >
                {primaryLabel}
              </Link>
            ) : (
              <button
                onClick={handleReset}
                disabled={retrying}
                className="inline-flex items-center justify-center gap-2 bg-[#FFB81C] hover:bg-[#E6A519] disabled:opacity-70 text-black font-bold px-6 py-3 rounded-xl transition-all text-sm shadow-lg shadow-[#FFB81C]/20 hover:shadow-[#FFB81C]/30 hover:-translate-y-0.5"
              >
                {retrying ? (
                  <>
                    <SpinnerIcon />
                    Retrying…
                  </>
                ) : (
                  <>
                    <RetryIcon />
                    {primaryLabel}
                  </>
                )}
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
          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-gray-500 text-xs">
              Still stuck?{' '}
              <a
                href={`mailto:support@forjegames.com?subject=Bug+report+[${reportType}]${digest ? `&body=Error+ID:+${digest}` : ''}`}
                className="text-[#FFB81C] hover:underline"
              >
                Report this issue
              </a>
              {' · '}
              <a
                href="https://status.ForjeGames.gg"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#FFB81C] hover:underline"
              >
                Check status page
              </a>
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}

// ─── Icons ─────────────────────────────────────────────────────────────────────

function AlertIcon() {
  return (
    <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg className="w-10 h-10 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.3}>
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

function RetryIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
  )
}

function SpinnerIcon() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}
