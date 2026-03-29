'use client'

import Link from 'next/link'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const isAiTimeout = error.message?.toLowerCase().includes('timeout') ||
    error.message?.toLowerCase().includes('aborted')

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <div className="max-w-md w-full text-center">
        <div className={`bg-[#141414] rounded-2xl p-8 border ${
          isAiTimeout ? 'border-[#FFB81C]/20' : 'border-white/10'
        }`}>
          <div className="text-5xl mb-4">{isAiTimeout ? '⏳' : '🔧'}</div>
          <h2 className="text-xl font-bold text-white mb-3">
            {isAiTimeout ? 'Taking longer than usual' : 'Something went wrong'}
          </h2>
          <p className="text-gray-300 text-sm mb-6">
            {isAiTimeout
              ? 'Your build is taking longer than expected. Try again — nothing was lost.'
              : 'An error occurred in this section. Your projects and tokens are safe.'}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={reset}
              className="bg-[#FFB81C] hover:bg-[#E6A519] text-black font-bold px-5 py-2.5 rounded-xl transition-colors text-sm"
            >
              Try again
            </button>
            <Link
              href="/dashboard"
              className="border border-white/20 hover:border-white/40 text-white px-5 py-2.5 rounded-xl transition-colors text-sm text-center"
            >
              Dashboard
            </Link>
          </div>

          {error.digest && (
            <p className="text-gray-700 text-xs mt-4 font-mono">ID: {error.digest}</p>
          )}
        </div>
      </div>
    </div>
  )
}
