'use client'

import { Component, type ReactNode, type ErrorInfo } from 'react'

// ─── Props / State ─────────────────────────────────────────────────────────────

interface Props {
  /** Human-readable name shown in the fallback card */
  name: string
  children: ReactNode
  /** Optional extra class on the fallback card */
  className?: string
}

interface State {
  hasError: boolean
  error: Error | null
  /** Incrementing this unmounts + remounts children */
  retryKey: number
}

// ─── Boundary ──────────────────────────────────────────────────────────────────

/**
 * Wraps new editor features so a crash in one feature never breaks the
 * core editor. Shows a compact "Feature unavailable" card with a Retry button.
 *
 * @example
 * <FeatureErrorBoundary name="Build Progress">
 *   <BuildProgressDashboard buildId={id} />
 * </FeatureErrorBoundary>
 */
export class FeatureErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, retryKey: 0 }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log to console always
    console.error(`[FeatureErrorBoundary] "${this.props.name}" crashed:`, error, info)

    // Report to Sentry if available (doesn't import sentry at build time —
    // uses dynamic require so it's optional and tree-shakeable)
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Sentry = require('@sentry/nextjs') as {
        captureException: (e: unknown, ctx?: object) => void
      }
      Sentry.captureException(error, {
        extra: {
          featureName: this.props.name,
          componentStack: info.componentStack,
        },
      })
    } catch {
      // Sentry not installed — skip silently
    }
  }

  private handleRetry = () => {
    this.setState((s) => ({
      hasError: false,
      error: null,
      retryKey: s.retryKey + 1,
    }))
  }

  render() {
    if (this.state.hasError) {
      return (
        <FallbackCard
          name={this.props.name}
          onRetry={this.handleRetry}
          className={this.props.className}
        />
      )
    }

    // key forces a full remount on retry, clearing any broken state inside
    return (
      <div key={this.state.retryKey}>
        {this.props.children}
      </div>
    )
  }
}

// ─── Fallback card ─────────────────────────────────────────────────────────────

function FallbackCard({
  name,
  onRetry,
  className = '',
}: {
  name: string
  onRetry: () => void
  className?: string
}) {
  return (
    <div
      role="alert"
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${className}`}
      style={{
        background: 'rgba(239,68,68,0.06)',
        border: '1px solid rgba(239,68,68,0.2)',
      }}
    >
      {/* Warning icon */}
      <div
        className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center"
        style={{ background: 'rgba(239,68,68,0.12)' }}
        aria-hidden="true"
      >
        <svg
          className="w-3.5 h-3.5"
          viewBox="0 0 14 14"
          fill="none"
          style={{ color: '#EF4444' }}
        >
          <path
            d="M7 2L13 12H1L7 2z"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
          <path
            d="M7 6v3M7 10.5v.5"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold" style={{ color: '#FCA5A5' }}>
          {name} unavailable
        </p>
        <p className="text-[10px]" style={{ color: '#71717a' }}>
          This feature encountered an error.
        </p>
      </div>

      {/* Retry */}
      <button
        onClick={onRetry}
        aria-label={`Retry ${name}`}
        className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all hover:brightness-110 active:scale-[0.97]"
        style={{
          background: 'rgba(239,68,68,0.15)',
          border: '1px solid rgba(239,68,68,0.3)',
          color: '#FCA5A5',
        }}
      >
        <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
          <path
            d="M1.5 6A4.5 4.5 0 0010.5 6M10.5 6V3m0 3h-3"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Retry
      </button>
    </div>
  )
}
