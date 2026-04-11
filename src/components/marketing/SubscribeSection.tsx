'use client'

import { useState, useRef } from 'react'

type SubmitState = 'idle' | 'loading' | 'success' | 'error'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function SubscribeSection() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<SubmitState>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const trimmed = email.trim()
    if (!trimmed || !EMAIL_RE.test(trimmed)) {
      setErrorMsg('Please enter a valid email address.')
      setState('error')
      inputRef.current?.focus()
      return
    }

    setState('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      })

      const json = (await res.json()) as { success: boolean; message?: string }

      if (json.success) {
        setState('success')
        setEmail('')
      } else {
        setErrorMsg(json.message ?? "Couldn't subscribe. Check your email address and try again.")
        setState('error')
      }
    } catch {
      setErrorMsg('Network error. Please try again.')
      setState('error')
    }
  }

  return (
    <section
      className="relative py-20 px-6 overflow-hidden"
      style={{
        background: '#070B1A',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      {/* Ambient glow */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 80% at 50% 50%, rgba(212,175,55,0.04) 0%, transparent 70%)',
        }}
      />

      <div className="relative max-w-lg mx-auto text-center">
        {/* Eyebrow */}
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.14em] mb-4"
          style={{ color: 'rgba(212,175,55,0.6)' }}
        >
          Newsletter
        </p>

        {/* Heading */}
        <h2
          className="text-3xl font-bold tracking-tight mb-3"
          style={{ color: '#FAFAFA', letterSpacing: '-0.02em' }}
        >
          Stay in the loop
        </h2>

        {/* Subtext */}
        <p
          className="text-base leading-relaxed mb-8"
          style={{ color: '#71717A' }}
        >
          Get updates on new features, AI tools, and game dev tips.
        </p>

        {state === 'success' ? (
          /* ── Success state ───────────────────────────────────────────── */
          <div
            className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-medium"
            style={{
              background: 'rgba(16,185,129,0.08)',
              border: '1px solid rgba(16,185,129,0.2)',
              color: '#10B981',
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            You&rsquo;re in! Watch your inbox.
          </div>
        ) : (
          /* ── Subscribe form ──────────────────────────────────────────── */
          <form
            onSubmit={handleSubmit}
            noValidate
            className="flex flex-col sm:flex-row items-stretch gap-3 w-full"
          >
            <label htmlFor="subscribe-email" className="sr-only">
              Email address
            </label>
            <input
              ref={inputRef}
              id="subscribe-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (state === 'error') {
                  setState('idle')
                  setErrorMsg('')
                }
              }}
              placeholder="you@example.com"
              autoComplete="email"
              disabled={state === 'loading'}
              required
              className="flex-1 rounded-xl px-4 py-3 text-sm outline-none transition-all duration-150 placeholder:text-[#3F3F46] disabled:opacity-50"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border:
                  state === 'error'
                    ? '1px solid rgba(239,68,68,0.5)'
                    : '1px solid rgba(255,255,255,0.09)',
                color: '#FAFAFA',
              }}
              onFocus={(e) => {
                if (state !== 'error') {
                  e.currentTarget.style.border = '1px solid rgba(212,175,55,0.35)'
                }
              }}
              onBlur={(e) => {
                if (state !== 'error') {
                  e.currentTarget.style.border = '1px solid rgba(255,255,255,0.09)'
                }
              }}
            />

            <button
              type="submit"
              disabled={state === 'loading'}
              className="flex-shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #D4AF37 100%)',
                color: '#09090b',
                boxShadow:
                  state === 'loading'
                    ? 'none'
                    : '0 0 24px rgba(212,175,55,0.25), 0 4px 12px rgba(0,0,0,0.4)',
              }}
            >
              {state === 'loading' ? (
                <>
                  <svg
                    className="animate-spin"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    aria-hidden="true"
                  >
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Subscribing…
                </>
              ) : (
                'Subscribe'
              )}
            </button>
          </form>
        )}

        {/* ── Error message ───────────────────────────────────────────── */}
        {state === 'error' && errorMsg && (
          <p
            className="mt-3 text-sm"
            style={{ color: '#EF4444' }}
            role="alert"
            aria-live="polite"
          >
            {errorMsg}
          </p>
        )}

        {/* ── Fine print ──────────────────────────────────────────────── */}
        {state !== 'success' && (
          <p className="mt-4 text-[12px]" style={{ color: '#3F3F46' }}>
            No spam, ever. Unsubscribe at any time.
          </p>
        )}
      </div>
    </section>
  )
}
