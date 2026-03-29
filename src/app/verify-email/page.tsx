'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'

const RESEND_COOLDOWN = 60 // seconds

function MailIcon({ animated }: { animated: boolean }) {
  return (
    <div className="relative mx-auto mb-6 w-24 h-24">
      {/* Outer pulse rings */}
      {animated && (
        <>
          <span className="absolute inset-0 rounded-full bg-[#FFB81C]/10 animate-ping" style={{ animationDuration: '2s' }} />
          <span className="absolute inset-2 rounded-full bg-[#FFB81C]/5 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
        </>
      )}
      {/* Icon container */}
      <div className="relative w-24 h-24 rounded-full bg-[#FFB81C]/10 border border-[#FFB81C]/20 flex items-center justify-center">
        <svg
          className={`w-10 h-10 text-[#FFB81C] transition-transform duration-500 ${animated ? 'scale-110' : 'scale-100'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect width="20" height="16" x="2" y="4" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
      </div>
    </div>
  )
}

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') ?? null

  const [cooldown, setCooldown] = useState(0)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [animating, setAnimating] = useState(true)

  // Stop icon animation after initial entrance
  useEffect(() => {
    const t = setTimeout(() => setAnimating(false), 4000)
    return () => clearTimeout(t)
  }, [])

  // Cooldown ticker
  useEffect(() => {
    if (cooldown <= 0) return
    const id = setInterval(() => {
      setCooldown((c) => Math.max(0, c - 1))
    }, 1000)
    return () => clearInterval(id)
  }, [cooldown])

  async function handleResend() {
    if (sending || cooldown > 0) return
    setSending(true)
    setError(null)
    setSent(false)

    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error ?? 'Failed to resend. Please try again.')
      }

      setSent(true)
      setCooldown(RESEND_COOLDOWN)
      setAnimating(true)
      setTimeout(() => setAnimating(false), 4000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-[#242424] border border-[#FFB81C]/20 rounded-2xl p-10 shadow-2xl">

          {/* Animated mail icon */}
          <MailIcon animated={animating} />

          {/* Heading */}
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
            Check your email
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed mb-2">
            We sent a verification link to
          </p>
          {email ? (
            <p className="text-[#FFB81C] font-semibold text-sm mb-8 break-all">{email}</p>
          ) : (
            <p className="text-gray-300 font-semibold text-sm mb-8">your email address</p>
          )}

          {/* Hint */}
          <div className="bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-sm text-gray-400 text-left mb-8">
            <p className="font-medium text-white mb-1 text-sm">Didn&apos;t get the email?</p>
            <ul className="space-y-1 text-xs text-gray-500 list-disc list-inside">
              <li>Check your spam or junk folder</li>
              <li>Make sure you entered the correct email</li>
              <li>Allow a few minutes for delivery</li>
            </ul>
          </div>

          {/* Success / error banners */}
          {sent && (
            <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm rounded-xl px-4 py-3 mb-4">
              Verification email resent successfully.
            </div>
          )}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3 mb-4">
              {error}
            </div>
          )}

          {/* Resend button */}
          <button
            onClick={handleResend}
            disabled={sending || cooldown > 0}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#FFB81C] hover:bg-[#E6A519] disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold text-sm transition-colors"
          >
            {sending ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                </svg>
                Sending…
              </>
            ) : cooldown > 0 ? (
              `Resend in ${cooldown}s`
            ) : (
              'Resend verification email'
            )}
          </button>

          {/* Footer */}
          <p className="text-xs text-gray-600 mt-6">
            Wrong email?{' '}
            <Link href="/sign-in" className="text-[#FFB81C] hover:underline">
              Go back to sign in
            </Link>
          </p>

        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#1a1a1a]" />}>
      <VerifyEmailContent />
    </Suspense>
  )
}
