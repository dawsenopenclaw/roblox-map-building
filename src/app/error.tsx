'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to Sentry/PostHog in production
    if (process.env.NODE_ENV === 'production') {
      console.error('Global error boundary:', error)
    }
  }, [error])

  const isTimeout = error.message?.toLowerCase().includes('timeout') ||
    error.message?.toLowerCase().includes('timed out')

  const isPaymentError = error.message?.toLowerCase().includes('payment') ||
    error.message?.toLowerCase().includes('stripe')

  if (isTimeout) {
    return (
      <div className="min-h-screen bg-[#0A0E27] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-[#0D1231] border border-[#FFB81C]/20 rounded-2xl p-8">
            <div className="text-5xl mb-4">⏳</div>
            <h2 className="text-2xl font-bold text-white mb-3">Taking longer than usual</h2>
            <p className="text-gray-400 text-sm mb-6">
              Our AI is handling a lot of requests right now. Your work is safe — nothing was lost.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={reset}
                className="bg-[#FFB81C] hover:bg-[#E6A519] text-black font-bold px-6 py-3 rounded-xl transition-colors text-sm"
              >
                Try again
              </button>
              <Link
                href="/dashboard"
                className="border border-white/20 hover:border-white/40 text-white px-6 py-3 rounded-xl transition-colors text-sm text-center"
              >
                Go to dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isPaymentError) {
    return (
      <div className="min-h-screen bg-[#0A0E27] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-[#0D1231] border border-red-500/20 rounded-2xl p-8">
            <div className="text-5xl mb-4">💳</div>
            <h2 className="text-2xl font-bold text-white mb-3">Payment issue</h2>
            <p className="text-gray-400 text-sm mb-6">
              There was a problem with your payment. Your subscription was not changed.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/billing"
                className="bg-[#FFB81C] hover:bg-[#E6A519] text-black font-bold px-6 py-3 rounded-xl transition-colors text-sm text-center"
              >
                Update payment method
              </Link>
              <a
                href="mailto:support@robloxforge.gg"
                className="border border-white/20 hover:border-white/40 text-white px-6 py-3 rounded-xl transition-colors text-sm text-center"
              >
                Contact support
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Generic error recovery card
  return (
    <div className="min-h-screen bg-[#0A0E27] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-8">
          <div className="text-5xl mb-4">🔧</div>
          <h2 className="text-2xl font-bold text-white mb-3">Something went wrong</h2>
          <p className="text-gray-400 text-sm mb-2">
            An unexpected error occurred. We've been notified and are looking into it.
          </p>
          {error.digest && (
            <p className="text-gray-600 text-xs mb-6 font-mono">
              Error ID: {error.digest}
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={reset}
              className="bg-[#FFB81C] hover:bg-[#E6A519] text-black font-bold px-6 py-3 rounded-xl transition-colors text-sm"
            >
              Try again
            </button>
            <Link
              href="/dashboard"
              className="border border-white/20 hover:border-white/40 text-white px-6 py-3 rounded-xl transition-colors text-sm text-center"
            >
              Back to dashboard
            </Link>
          </div>
          <p className="text-gray-600 text-xs mt-6">
            Still stuck?{' '}
            <a href="mailto:support@robloxforge.gg" className="text-[#FFB81C] hover:underline">
              support@robloxforge.gg
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
