'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import * as Sentry from '@sentry/nextjs'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [retrying, setRetrying] = useState(false)

  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  const isAiTimeout =
    error.message?.toLowerCase().includes('timeout') ||
    error.message?.toLowerCase().includes('aborted')

  function handleReset() {
    setRetrying(true)
    setTimeout(() => {
      setRetrying(false)
      reset()
    }, 600)
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <div className="max-w-md w-full text-center">
        <div
          className={`bg-[#141414] rounded-2xl p-8 border ${
            isAiTimeout ? 'border-[#D4AF37]/20' : 'border-white/10'
          }`}
        >
          {/* Icon */}
          <div
            className={`w-16 h-16 mx-auto mb-5 rounded-full flex items-center justify-center ${
              isAiTimeout
                ? 'bg-amber-500/10 border border-amber-500/20'
                : 'bg-red-500/10 border border-red-500/20'
            }`}
          >
            {isAiTimeout ? (
              <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
            )}
          </div>

          <h2 className="text-xl font-bold text-white mb-3">
            {isAiTimeout ? 'Taking longer than usual' : 'This section crashed'}
          </h2>
          <p className="text-gray-300 text-sm mb-6">
            {isAiTimeout
              ? 'Your build is taking longer than expected. Try again — nothing was lost.'
              : 'This section hit an error. Your projects and tokens are safe — try reloading.'}
          </p>

          {error.digest && (
            <p className="text-gray-500 text-xs font-mono mb-4">ID: {error.digest}</p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleReset}
              disabled={retrying}
              className="inline-flex items-center justify-center gap-2 bg-[#D4AF37] hover:bg-[#E6A519] disabled:opacity-70 text-black font-bold px-5 py-2.5 rounded-xl transition-colors text-sm"
            >
              {retrying ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Retrying…
                </>
              ) : (
                'Try again'
              )}
            </button>
            <Link
              href="/dashboard"
              className="border border-white/20 hover:border-white/40 text-white px-5 py-2.5 rounded-xl transition-colors text-sm text-center"
            >
              Dashboard
            </Link>
          </div>

          <div className="mt-6 pt-5 border-t border-white/10">
            <p className="text-gray-500 text-xs">
              Still stuck?{' '}
              <a
                href={`mailto:support@forjegames.com?subject=Bug+report+[app]${error.digest ? `&body=Error+ID:+${error.digest}` : ''}`}
                className="text-[#D4AF37] hover:underline"
              >
                Report this issue
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
