'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function MarketingError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[marketing-error]', error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-10">
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-3">Something went wrong</h2>
          <p className="text-gray-400 text-sm mb-6">
            This page ran into an error. Try refreshing or head to the app.
          </p>
          {error.digest && (
            <p className="text-gray-600 text-xs font-mono mb-4">ID: {error.digest}</p>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={reset}
              className="bg-[#FFB81C] hover:bg-[#E6A519] text-black font-bold px-5 py-2.5 rounded-xl transition-colors text-sm"
            >
              Try again
            </button>
            <Link
              href="/"
              className="border border-white/20 hover:border-white/40 text-white px-5 py-2.5 rounded-xl transition-colors text-sm text-center"
            >
              Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
