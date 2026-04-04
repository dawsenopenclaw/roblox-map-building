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
    // Errors are logged to Sentry automatically
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
      <style dangerouslySetInnerHTML={{ __html: `
        @media (prefers-reduced-motion: no-preference) {
          @keyframes eb-card-in {
            from { opacity: 0; transform: translateY(10px) scale(0.98); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
          }
          @keyframes eb-btn-glow {
            0%, 100% { box-shadow: 0 0 0 0 rgba(212,175,55,0); }
            50%       { box-shadow: 0 0 16px 0 rgba(212,175,55,0.35); }
          }
          .eb-card { animation: eb-card-in 0.35s cubic-bezier(0.16,1,0.3,1) both; }
          .eb-btn-primary:hover { animation: eb-btn-glow 1.5s ease-in-out infinite; }
        }
        .eb-btn-primary:focus-visible,
        .eb-btn-secondary:focus-visible {
          outline: 2px solid #D4AF37;
          outline-offset: 2px;
        }
      ` }} />

      <div className="max-w-md w-full text-center">
        <div
          className="eb-card rounded-2xl p-8"
          style={{
            position: 'relative',
            background: 'rgba(20,20,20,0.98)',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 0 0 1px rgba(212,175,55,0.06), 0 8px 40px rgba(0,0,0,0.6), 0 0 60px rgba(212,175,55,0.04)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {/* Icon well */}
          <div
            className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center"
            style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.18)',
              boxShadow: '0 0 24px rgba(239,68,68,0.08)',
            }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              {/* Triangular warning outline */}
              <path
                d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
                stroke="rgba(248,113,113,0.9)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <line
                x1="12" y1="9" x2="12" y2="13"
                stroke="rgba(248,113,113,0.9)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <circle cx="12" cy="17" r="0.8" fill="rgba(248,113,113,0.9)" />
            </svg>
          </div>

          {/* Gold top accent line */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 0,
              left: '20%',
              right: '20%',
              height: 1,
              background: 'linear-gradient(to right, transparent, rgba(212,175,55,0.4), transparent)',
              borderRadius: '0 0 4px 4px',
            }}
          />

          <h2
            className="text-xl font-bold mb-2"
            style={{ color: '#FFFFFF', letterSpacing: '-0.01em' }}
          >
            Something went wrong
          </h2>

          <p
            className="text-sm leading-relaxed mb-2"
            style={{ color: 'rgba(255,255,255,0.55)' }}
          >
            {safeMessage}
          </p>

          {eventId && (
            <p
              className="text-xs font-mono mb-5 mt-1 px-3 py-1.5 rounded-lg inline-block"
              style={{
                color: 'rgba(255,255,255,0.3)',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              ID: {eventId}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-5">
            <button
              onClick={onReset}
              className="eb-btn-primary font-bold text-sm px-5 py-2.5 rounded-xl transition-all duration-200"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #D4AF37 100%)',
                color: '#050810',
                border: '1px solid rgba(212,175,55,0.5)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #FFD060 0%, #D4AF37 100%)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #D4AF37 0%, #D4AF37 100%)'
              }}
            >
              Try again
            </button>
            <Link
              href="/dashboard"
              className="eb-btn-secondary text-sm text-center px-5 py-2.5 rounded-xl transition-all duration-200"
              style={{
                color: 'rgba(255,255,255,0.7)',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.03)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.2)'
                ;(e.currentTarget as HTMLAnchorElement).style.color = '#fff'
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.1)'
                ;(e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.7)'
              }}
            >
              Go to Dashboard
            </Link>
          </div>

          <p className="text-xs mt-5" style={{ color: 'rgba(255,255,255,0.25)' }}>
            Need help?{' '}
            <a
              href="mailto:support@forjegames.com"
              className="transition-colors"
              style={{ color: '#D4AF37' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'underline' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'none' }}
            >
              support@forjegames.com
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
