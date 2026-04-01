'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

export default function AgeGatePage() {
  const router = useRouter()
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [today, setToday] = useState('')

  useEffect(() => {
    setToday(new Date().toISOString().split('T')[0])
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!dateOfBirth) {
      setError('Please enter your date of birth.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dateOfBirth: new Date(`${dateOfBirth}T00:00:00Z`).toISOString() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.')
        return
      }

      // Demo mode — no Clerk session, skip straight to editor
      if (data.demo) {
        router.push(data.redirectUrl ?? '/editor')
        return
      }

      if (data.isUnder13 === true) {
        import('posthog-js').then(({ default: posthog }) => {
          posthog.opt_out_capturing()
        }).catch(() => {/* silent */})
      }

      const redirect: string = data.redirect ?? (data.isUnder13 ? '/onboarding/parental-consent' : '/editor')
      router.push(redirect)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm"
      >
        {/* Icon */}
        <div className="flex justify-center mb-5">
          <div
            className="flex items-center justify-center rounded-xl w-12 h-12"
            style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <rect x="3" y="4" width="18" height="17" rx="2.5" stroke="#D4AF37" strokeWidth="1.5" />
              <path d="M3 9h18" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M8 2v4M16 2v4" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="8" cy="14" r="1" fill="#D4AF37" />
              <circle cx="12" cy="14" r="1" fill="#D4AF37" />
              <circle cx="16" cy="14" r="1" fill="rgba(212,175,55,0.4)" />
              <circle cx="8" cy="18" r="1" fill="rgba(212,175,55,0.4)" />
              <circle cx="12" cy="18" r="1" fill="rgba(212,175,55,0.4)" />
            </svg>
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-1.5">One quick thing</h2>
          <p className="text-sm" style={{ color: '#A1A1AA' }}>
            We need your date of birth to keep everyone safe.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            id="dob"
            type="date"
            min="1900-01-01"
            max={today}
            value={dateOfBirth}
            onChange={(e) => { setDateOfBirth(e.target.value); setError('') }}
            required
            autoComplete="bday"
            aria-label="Date of birth"
            className="w-full rounded-xl px-4 py-4 text-white text-base font-medium focus:outline-none transition-all [color-scheme:dark]"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${error ? 'rgba(239,68,68,0.5)' : dateOfBirth ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.1)'}`,
              boxShadow: dateOfBirth ? '0 0 0 3px rgba(212,175,55,0.08)' : 'none',
            }}
          />

          <AnimatePresence>
            {error && (
              <motion.p
                role="alert"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="text-sm"
                style={{ color: '#EF4444' }}
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button
            type="submit"
            disabled={loading || !dateOfBirth}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: loading || !dateOfBirth ? 'rgba(212,175,55,0.4)' : 'linear-gradient(135deg, #D4AF37 0%, #FFB81C 100%)',
              color: '#09090b',
              boxShadow: !loading && dateOfBirth ? '0 4px 24px rgba(212,175,55,0.25)' : 'none',
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                  className="block w-4 h-4 rounded-full border-2"
                  style={{ borderColor: '#09090b', borderTopColor: 'transparent' }}
                />
                Saving…
              </span>
            ) : (
              'Continue →'
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  )
}
