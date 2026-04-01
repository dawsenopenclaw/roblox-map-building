'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAnalytics } from '@/hooks/useAnalytics'
import { OnboardingShell } from '../_components/OnboardingShell'

const TOTAL_STEPS = 5
const CURRENT_STEP = 1

export default function AgeGatePage() {
  const router = useRouter()
  const { track } = useAnalytics()
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
        track('error_encountered', {
          errorType: 'onboarding_age_gate',
          message: data.error,
          page: '/onboarding/age-gate',
        })
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

      if (!data.isUnder13) {
        track('onboarding_step_completed', { step: 'age_gate', stepIndex: 1 })
      }

      const redirect: string = data.redirect ?? (data.isUnder13 ? '/onboarding/parental-consent' : '/editor')
      router.push(redirect)
    } catch {
      setError('Network error. Please try again.')
      track('error_encountered', { errorType: 'network_error', page: '/onboarding/age-gate' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <OnboardingShell currentStep={CURRENT_STEP} totalSteps={TOTAL_STEPS}>
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Illustration */}
        <div className="flex justify-center mb-6">
          <div
            className="relative flex items-center justify-center rounded-2xl w-20 h-20"
            style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)' }}
          >
            {/* Calendar SVG illustration */}
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden>
              <rect x="3" y="4" width="18" height="17" rx="2.5" stroke="#D4AF37" strokeWidth="1.5" />
              <path d="M3 9h18" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M8 2v4M16 2v4" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="8" cy="14" r="1" fill="#D4AF37" />
              <circle cx="12" cy="14" r="1" fill="#D4AF37" />
              <circle cx="16" cy="14" r="1" fill="rgba(212,175,55,0.4)" />
              <circle cx="8" cy="18" r="1" fill="rgba(212,175,55,0.4)" />
              <circle cx="12" cy="18" r="1" fill="rgba(212,175,55,0.4)" />
            </svg>
            {/* Corner sparkle */}
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full"
              style={{ background: '#D4AF37' }}
            />
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">When were you born?</h2>
          <p className="text-sm leading-relaxed" style={{ color: '#A1A1AA' }}>
            We use your age only to keep you safe — never for ads or profiling.
          </p>
        </div>

        {/* Safety badge */}
        <div
          className="flex items-center gap-2.5 rounded-xl px-4 py-3 mb-6"
          style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.15)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 2L4 6v6c0 5.25 3.5 10.14 8 11.25C16.5 22.14 20 17.25 20 12V6l-8-4z" stroke="#D4AF37" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M9 12l2 2 4-4" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="text-xs font-medium" style={{ color: '#D4AF37' }}>
            We keep you safe — COPPA compliant &amp; privacy-first
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="dob" className="block text-sm font-medium mb-2" style={{ color: '#A1A1AA' }}>
              Date of Birth
            </label>
            <input
              id="dob"
              type="date"
              min="1900-01-01"
              max={today}
              value={dateOfBirth}
              onChange={(e) => { setDateOfBirth(e.target.value); setError('') }}
              required
              autoComplete="bday"
              className="w-full rounded-xl px-4 py-3.5 text-white text-base font-medium focus:outline-none transition-all [color-scheme:dark]"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${error ? 'rgba(239,68,68,0.5)' : dateOfBirth ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.1)'}`,
                boxShadow: dateOfBirth ? '0 0 0 3px rgba(212,175,55,0.08)' : 'none',
              }}
            />
          </div>

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
    </OnboardingShell>
  )
}
