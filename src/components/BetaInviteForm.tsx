'use client'

/**
 * BetaInviteForm — invite code redemption widget.
 *
 * Dark theme with gold accents. Handles all UX states:
 * - idle  → input + Redeem button
 * - loading → disabled state with spinner
 * - success → celebrates, shows bonus credits earned
 * - error → inline error message (invalid, expired, exhausted, already-redeemed)
 */

import { useState, useCallback, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'

interface BetaInviteFormProps {
  /** Where to navigate after a successful redemption. Defaults to /editor. */
  redirectTo?: string
  /** Hide the "Continue to editor" button after success. */
  hideRedirect?: boolean
}

type Status =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'success'; bonusCredits: number; message: string }

export function BetaInviteForm({ redirectTo = '/editor', hideRedirect = false }: BetaInviteFormProps) {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  const onSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      const trimmed = code.trim()
      if (!trimmed) {
        setStatus({ kind: 'error', message: 'Please enter an invite code.' })
        return
      }
      setStatus({ kind: 'loading' })
      try {
        const res = await fetch('/api/beta/invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: trimmed }),
        })
        const data = (await res.json().catch(() => ({}))) as {
          error?: string
          message?: string
          bonusCredits?: number
        }
        if (!res.ok) {
          setStatus({
            kind: 'error',
            message: data.error ?? 'Failed to redeem invite code. Please try again.',
          })
          return
        }
        setStatus({
          kind: 'success',
          bonusCredits: data.bonusCredits ?? 0,
          message: data.message ?? "You're in! Beta access granted.",
        })
      } catch {
        setStatus({
          kind: 'error',
          message: 'Network error. Check your connection and try again.',
        })
      }
    },
    [code],
  )

  const onContinue = useCallback(() => {
    router.push(redirectTo)
    router.refresh()
  }, [router, redirectTo])

  if (status.kind === 'success') {
    return (
      <div
        className="w-full max-w-md rounded-xl border border-amber-500/40 bg-gradient-to-b from-amber-500/10 to-neutral-900/80 p-6 text-center shadow-[0_0_40px_-10px_rgba(245,158,11,0.4)]"
        role="status"
        aria-live="polite"
      >
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20">
          <svg className="h-6 w-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="mb-1 text-xl font-semibold text-amber-300">You&apos;re in!</h3>
        <p className="mb-4 text-sm text-neutral-300">{status.message}</p>
        {status.bonusCredits > 0 && (
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-sm font-medium text-amber-200">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.963a1 1 0 00.95.69h4.166c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.963c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.963a1 1 0 00-.364-1.118L2.05 9.39c-.783-.57-.38-1.81.588-1.81h4.166a1 1 0 00.95-.69l1.286-3.963z" />
            </svg>
            +{status.bonusCredits.toLocaleString()} bonus credits
          </div>
        )}
        {!hideRedirect && (
          <button
            type="button"
            onClick={onContinue}
            className="w-full rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 px-4 py-2.5 text-sm font-semibold text-neutral-900 transition hover:from-amber-400 hover:to-yellow-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-neutral-900"
          >
            Continue to editor →
          </button>
        )}
      </div>
    )
  }

  const isLoading = status.kind === 'loading'

  return (
    <form
      onSubmit={onSubmit}
      className="w-full max-w-md rounded-xl border border-neutral-800 bg-neutral-900/80 p-6 shadow-[0_0_40px_-10px_rgba(0,0,0,0.5)]"
    >
      <label htmlFor="beta-code" className="mb-2 block text-sm font-medium text-neutral-200">
        Invite code
      </label>
      <div className="flex flex-col gap-3">
        <input
          id="beta-code"
          name="code"
          type="text"
          autoComplete="off"
          inputMode="text"
          spellCheck={false}
          placeholder="FORJ-XXXX-XXXX"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          disabled={isLoading}
          aria-invalid={status.kind === 'error'}
          aria-describedby={status.kind === 'error' ? 'beta-code-error' : undefined}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-4 py-3 font-mono text-base tracking-wider text-amber-200 placeholder:text-neutral-600 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isLoading || code.trim().length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 px-4 py-3 text-sm font-semibold text-neutral-900 transition hover:from-amber-400 hover:to-yellow-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-neutral-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Redeeming…
            </>
          ) : (
            'Redeem invite'
          )}
        </button>
      </div>
      {status.kind === 'error' && (
        <p
          id="beta-code-error"
          role="alert"
          className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300"
        >
          {status.message}
        </p>
      )}
      <p className="mt-4 text-xs text-neutral-500">
        Don&apos;t have a code?{' '}
        <a href="/waitlist" className="text-amber-400 underline-offset-2 hover:underline">
          Join the waitlist
        </a>{' '}
        to get notified when we open sign-ups.
      </p>
    </form>
  )
}

export default BetaInviteForm
