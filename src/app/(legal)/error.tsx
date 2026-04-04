'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import * as Sentry from '@sentry/nextjs'

export default function LegalError({
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
    <main className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        <h2 className="text-xl font-bold text-white mb-3">Couldn't load this page</h2>
        <p className="text-gray-300 text-sm mb-5">Something went wrong loading this legal document.</p>
        {error.digest && (
          <p className="text-gray-500 text-xs font-mono mb-4">ID: {error.digest}</p>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-[#D4AF37] hover:bg-[#E6A519] text-black font-bold px-5 py-2.5 rounded-xl transition-colors text-sm"
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
    </main>
  )
}
