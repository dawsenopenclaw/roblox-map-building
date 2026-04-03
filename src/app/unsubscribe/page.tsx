'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

type Status = 'loading' | 'success' | 'invalid' | 'error'

function UnsubscribeContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
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
    <div className="min-h-screen bg-[#050810] flex items-center justify-center p-4 overflow-hidden">
      {/* Radial glow — color shifts by status */}
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center">
        <div
          className="w-[500px] h-[500px] rounded-full blur-[120px]"
          style={{
            background:
              status === 'success'
                ? 'rgba(16,185,129,0.07)'
                : status === 'error'
                ? 'rgba(248,113,113,0.07)'
                : status === 'invalid'
                ? 'rgba(251,191,36,0.07)'
                : 'rgba(16,185,129,0.05)',
          }}
        />
      </div>

      <div className="relative max-w-md w-full text-center">
        <div className="bg-white/[0.025] border border-white/[0.07] rounded-2xl p-10 shadow-2xl backdrop-blur-sm">

          {/* Loading */}
          {status === 'loading' && (
            <div className="space-y-4">
              <div className="mx-auto mb-7 w-20 h-20 rounded-full bg-[#10B981]/10 border border-[#10B981]/20 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-[#10B981] border-t-transparent animate-spin" />
              </div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Processing...</h1>
              <p className="text-gray-400 text-sm">Recording your opt-out, please wait.</p>
            </div>
          )}

          {/* Success */}
          {status === 'success' && (
            <>
              <div className="mx-auto mb-7 relative w-20 h-20">
                <div className="absolute inset-0 rounded-full bg-[#10B981]/10 animate-ping" style={{ animationDuration: '3s' }} />
                <div className="relative w-20 h-20 rounded-full bg-[#10B981]/10 border border-[#10B981]/20 flex items-center justify-center">
                  <svg
                    className="w-9 h-9 text-[#10B981]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                </div>
              </div>
              <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">Unsubscribed</h1>
              <p className="text-gray-400 text-sm leading-relaxed mb-2">
                You have been unsubscribed from ForjeGames marketing emails.
              </p>
              <p className="text-gray-600 text-xs mb-8">
                You will still receive important account and billing notifications.
              </p>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-black font-bold text-sm transition-all shadow-lg shadow-[#10B981]/20 hover:shadow-[#10B981]/30 hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}
              >
                Return to ForjeGames
              </Link>
              <p className="text-xs text-gray-600 mt-5">
                Changed your mind?{' '}
                <a href="mailto:privacy@forjegames.com" className="text-[#FFB81C] hover:underline">
                  Resubscribe via email
                </a>
              </p>
            </>
          )}

          {/* Invalid */}
          {status === 'invalid' && (
            <>
              <div className="mx-auto mb-7 w-20 h-20 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                <svg
                  className="w-9 h-9 text-yellow-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">Link Expired</h1>
              <p className="text-gray-400 text-sm leading-relaxed mb-8">
                This unsubscribe link is missing, expired, or has already been used. To manage your
                email preferences, contact{' '}
                <a href="mailto:privacy@forjegames.com" className="text-[#FFB81C] hover:underline">
                  privacy@forjegames.com
                </a>
                .
              </p>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-white/10 hover:border-white/25 text-white text-sm font-medium transition-colors"
              >
                Return home
              </Link>
            </>
          )}

          {/* Error */}
          {status === 'error' && (
            <>
              <div className="mx-auto mb-7 w-20 h-20 rounded-full bg-[#f87171]/10 border border-[#f87171]/20 flex items-center justify-center">
                <svg
                  className="w-9 h-9 text-[#f87171]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">Request Failed</h1>
              <p className="text-gray-400 text-sm leading-relaxed mb-8">
                We could not process your unsubscribe request. Please try again or contact{' '}
                <a href="mailto:privacy@forjegames.com" className="text-[#FFB81C] hover:underline">
                  privacy@forjegames.com
                </a>
                .
              </p>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-black font-bold text-sm transition-all shadow-lg shadow-[#f87171]/20 hover:shadow-[#f87171]/30 hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)' }}
              >
                Try again
              </button>
            </>
          )}

        </div>

        {/* Branding */}
        <p className="mt-6 text-xs text-gray-500">
          <Link href="/" className="hover:text-[#FFB81C] transition-colors font-medium">ForjeGames</Link>
          {' '}— AI-powered Roblox game builder
        </p>
      </div>
    </div>
  )
}

export default function UnsubscribePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#050810] flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-[#10B981] border-t-transparent animate-spin" />
        </div>
      }
    >
      <UnsubscribeContent />
    </Suspense>
  )
}
