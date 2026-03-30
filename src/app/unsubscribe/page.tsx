'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function UnsubscribeContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  type Status = 'loading' | 'success' | 'invalid' | 'error'
  const [status, setStatus] = useState<Status>(token ? 'loading' : 'invalid')

  useEffect(() => {
    if (!token) {
      setStatus('invalid')
      return
    }

    fetch('/api/email/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        if (res.ok) {
          setStatus('success')
        } else if (res.status === 400 || res.status === 404) {
          setStatus('invalid')
        } else {
          setStatus('error')
        }
      })
      .catch(() => setStatus('error'))
  }, [token])

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-4 bg-[#141414] border border-white/10 rounded-2xl p-8">

        {status === 'loading' && (
          <>
            <div className="w-10 h-10 rounded-full border-2 border-[#FFB81C] border-t-transparent animate-spin mx-auto" />
            <h1 className="text-xl font-bold text-white">Processing…</h1>
            <p className="text-gray-400 text-sm">Recording your opt-out, please wait.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">Unsubscribed</h1>
            <p className="text-gray-400">You have been unsubscribed from ForjeGames marketing emails.</p>
            <p className="text-gray-500 text-sm">You will still receive important account and billing notifications.</p>
            <a href="/" className="inline-block mt-4 text-[#FFB81C] hover:underline underline-offset-2 text-sm">
              Return to ForjeGames
            </a>
          </>
        )}

        {status === 'invalid' && (
          <>
            <div className="w-12 h-12 rounded-full bg-yellow-500/15 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">Link Expired or Invalid</h1>
            <p className="text-gray-400 text-sm">
              This unsubscribe link is missing, expired, or has already been used.
              To manage your email preferences, contact{' '}
              <a href="mailto:privacy@forjegames.com" className="text-[#FFB81C] hover:underline">
                privacy@forjegames.com
              </a>
              .
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-12 h-12 rounded-full bg-red-500/15 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">Something Went Wrong</h1>
            <p className="text-gray-400 text-sm">
              We could not process your unsubscribe request. Please try again or contact{' '}
              <a href="mailto:privacy@forjegames.com" className="text-[#FFB81C] hover:underline">
                privacy@forjegames.com
              </a>
              .
            </p>
          </>
        )}

      </div>
    </div>
  )
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-[#FFB81C] border-t-transparent animate-spin" />
      </div>
    }>
      <UnsubscribeContent />
    </Suspense>
  )
}
