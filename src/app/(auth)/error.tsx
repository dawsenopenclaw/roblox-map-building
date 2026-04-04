'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import * as Sentry from '@sentry/nextjs'

export default function AuthError({
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
    <div className="w-full max-w-md">
      <div className="bg-[#141414] border border-white/10 rounded-2xl p-8 text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-white mb-2">Something went wrong</h2>
        <p className="text-gray-300 text-sm mb-5">
          We couldn't complete this action. Please try again.
        </p>
        {error.digest && (
          <p className="text-gray-500 text-xs font-mono mb-4">ID: {error.digest}</p>
        )}
        <div className="flex flex-col gap-2">
          <button
            onClick={reset}
            className="bg-[#D4AF37] hover:bg-[#E6A519] text-black font-bold px-5 py-2.5 rounded-xl transition-colors text-sm w-full"
          >
            Try again
          </button>
          <Link
            href="/"
            className="border border-white/20 hover:border-white/40 text-white px-5 py-2.5 rounded-xl transition-colors text-sm text-center"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
