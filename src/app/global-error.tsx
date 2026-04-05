'use client'

import { useEffect, useState } from 'react'
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

  const [retrying, setRetrying] = useState(false)

  function handleReset() {
    setRetrying(true)
    setTimeout(() => {
      setRetrying(false)
      reset()
    }, 600)
  }

  return (
    <html lang="en">
      <body className="bg-[#0a0a0a] text-white antialiased">
        {/* Ambient red glow */}
        <div className="pointer-events-none fixed inset-0 flex items-center justify-center">
          <div className="w-[500px] h-[500px] rounded-full bg-red-500/8 blur-[120px]" />
        </div>

        <div className="relative min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <div className="bg-[#141414]/90 backdrop-blur-sm border border-white/10 rounded-2xl p-10 shadow-2xl">

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
              <p className="text-gray-300 text-sm leading-relaxed">
                An unexpected error occurred at the application level. We&apos;ve been
                automatically notified. Your data is safe.
              </p>

              {error.digest && (
                <p className="text-gray-500 text-xs font-mono mt-4">
                  Error ID: {error.digest}
                </p>
              )}

              <p className="text-gray-500 text-xs mt-1 mb-6">
                Our team has been notified — no action needed on your end.
              </p>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleReset}
                  disabled={retrying}
                  className="inline-flex items-center justify-center gap-2 bg-[#D4AF37] hover:bg-[#E6A519] disabled:opacity-70 text-black font-bold px-6 py-3 rounded-xl transition-all text-sm shadow-lg shadow-[#D4AF37]/20 hover:shadow-[#D4AF37]/30 hover:-translate-y-0.5"
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
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                      </svg>
                      Try again
                    </>
                  )}
                </button>
                <a
                  href="/dashboard"
                  className="border border-white/20 hover:border-white/40 text-white px-6 py-3 rounded-xl transition-colors text-sm text-center"
                >
                  Go home
                </a>
              </div>

              {/* Report */}
              <div className="mt-8 pt-6 border-t border-white/10">
                <p className="text-gray-500 text-xs">
                  Still stuck?{' '}
                  <a
                    href={`mailto:support@forjegames.com?subject=Global+error+report${error.digest ? `&body=Error+ID:+${error.digest}` : ''}`}
                    className="text-[#D4AF37] hover:underline"
                  >
                    Report this issue
                  </a>
                  {' · '}
                  <a
                    href="https://status.forjegames.gg"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#D4AF37] hover:underline"
                  >
                    Status page
                  </a>
                </p>
              </div>

            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
