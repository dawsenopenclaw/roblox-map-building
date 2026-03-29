'use client'

import { useEffect } from 'react'
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

  return (
    <html lang="en">
      <body className="bg-[#0A0E27] text-white antialiased">
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-10">
              {/* Icon */}
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                  />
                </svg>
              </div>

              <h1 className="text-2xl font-bold text-white mb-3">
                Something went wrong
              </h1>
              <p className="text-gray-400 text-sm leading-relaxed mb-2">
                An unexpected error occurred. We&apos;ve been notified and are looking into it.
              </p>

              {error.digest && (
                <p className="text-gray-600 text-xs font-mono mb-6">
                  Error ID: {error.digest}
                </p>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
                <button
                  onClick={reset}
                  className="bg-[#FFB81C] hover:bg-[#E6A519] text-black font-bold px-6 py-3 rounded-xl transition-colors text-sm"
                >
                  Try again
                </button>
                <a
                  href="/dashboard"
                  className="border border-white/20 hover:border-white/40 text-white px-6 py-3 rounded-xl transition-colors text-sm text-center"
                >
                  Go home
                </a>
              </div>

              <p className="text-gray-600 text-xs mt-6">
                Still stuck?{' '}
                <a
                  href={`mailto:support@robloxforge.gg?subject=Bug+report+[global]${error.digest ? `&body=Error+ID:+${error.digest}` : ''}`}
                  className="text-[#FFB81C] hover:underline"
                >
                  Report a bug
                </a>
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
