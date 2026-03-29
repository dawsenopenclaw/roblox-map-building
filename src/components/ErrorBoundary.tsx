'use client'

import { Component, type ReactNode, type ErrorInfo } from 'react'
import Link from 'next/link'
import * as Sentry from '@sentry/nextjs'

// ─── SilentBoundary ───────────────────────────────────────────────────────────
// Use this for non-critical UI (notifications, toasts, analytics) where a crash
// should render nothing rather than a visible error card.

interface SilentBoundaryState { hasError: boolean }

export class SilentBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  SilentBoundaryState
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): SilentBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log to console in dev so engineers can see it, but never surface to users
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[SilentBoundary] caught error:', error, info.componentStack)
    }
    try {
      Sentry.captureException(error, {
        contexts: { react: { componentStack: info.componentStack ?? '' } },
      })
    } catch {
      // Sentry itself might not be configured — ignore
    }
  }

  render() {
    if (this.state.hasError) return this.props.fallback ?? null
    return this.props.children
  }
}

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, info: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  eventId: string | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, eventId: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, eventId: null }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const eventId = Sentry.captureException(error, {
      contexts: { react: { componentStack: info.componentStack ?? '' } },
    })
    this.setState({ eventId: eventId ?? null })
    this.props.onError?.(error, info)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, eventId: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <ErrorCard
          error={this.state.error}
          eventId={this.state.eventId}
          onReset={this.handleReset}
        />
      )
    }

    return this.props.children
  }
}

function ErrorCard({
  error,
  eventId,
  onReset,
}: {
  error: Error | null
  eventId: string | null
  onReset: () => void
}) {
  // Sanitize message — never expose stack traces or internal paths
  const safeMessage = sanitizeErrorMessage(error?.message)

  return (
    <div className="min-h-[300px] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="bg-[#242424] border border-white/10 rounded-2xl p-8">
          {/* Icon */}
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
              />
            </svg>
          </div>

          <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>

          <p className="text-gray-400 text-sm mb-1 leading-relaxed">{safeMessage}</p>

          {eventId && (
            <p className="text-gray-600 text-xs font-mono mb-5">
              Report ID: {eventId}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-5">
            <button
              onClick={onReset}
              className="bg-[#FFB81C] hover:bg-[#E6A519] text-black font-bold px-5 py-2.5 rounded-xl transition-colors text-sm"
            >
              Try again
            </button>
            <Link
              href="/dashboard"
              className="border border-white/20 hover:border-white/40 text-white px-5 py-2.5 rounded-xl transition-colors text-sm text-center"
            >
              Go to Dashboard
            </Link>
          </div>

          <p className="text-gray-600 text-xs mt-5">
            Need help?{' '}
            <a
              href="mailto:support@ForjeGames.gg"
              className="text-[#FFB81C] hover:underline"
            >
              support@ForjeGames.gg
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

/** Strip internal paths, module names, and stack traces from error messages */
function sanitizeErrorMessage(message?: string): string {
  if (!message) return 'An unexpected error occurred. Our team has been notified.'

  // Block patterns that expose internals
  const internals = [
    /at\s+\w+\s+\(.*\)/g,          // stack frames
    /webpack[:/]/gi,                // webpack internals
    /node_modules\/.*/gi,          // node_modules paths
    /\/src\//gi,                   // source paths
    /chunk-[a-z0-9]+/gi,           // chunk names
  ]

  const safe = message
  for (const pattern of internals) {
    if (pattern.test(safe)) {
      return 'An unexpected error occurred. Our team has been notified.'
    }
  }

  // Truncate to avoid leaking excessive detail
  return safe.length > 120 ? safe.slice(0, 117) + '...' : safe
}
