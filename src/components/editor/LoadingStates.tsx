'use client'

import { type ReactNode } from 'react'

// ─── Pulse animation (CSS-only, respects prefers-reduced-motion) ───────────────

const pulseStyle: React.CSSProperties = {
  animation: 'forje-skeleton-pulse 1.6s ease-in-out infinite',
}

// ─── Skeleton primitives ────────────────────────────────────────────────────────

interface SkeletonProps {
  className?: string
  style?: React.CSSProperties
  /** Override the pulsing background color */
  color?: string
}

function Skeleton({ className = '', style, color }: SkeletonProps) {
  return (
    <div
      role="presentation"
      aria-hidden="true"
      className={`rounded-lg ${className}`}
      style={{
        background: color ?? 'rgba(255,255,255,0.06)',
        ...pulseStyle,
        ...style,
      }}
    />
  )
}

// ─── SkeletonCard ───────────────────────────────────────────────────────────────

/**
 * Pulsing card placeholder — use while a feature panel is loading.
 */
export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div
      className="rounded-xl p-3 space-y-2.5"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Header row */}
      <div className="flex items-center gap-2">
        <Skeleton className="w-7 h-7 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Skeleton style={{ height: 10, width: '60%' }} />
          <Skeleton style={{ height: 8, width: '40%' }} />
        </div>
      </div>

      {/* Body lines */}
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          style={{
            height: 8,
            width: i === lines - 1 ? '70%' : '100%',
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  )
}

// ─── SkeletonList ───────────────────────────────────────────────────────────────

/**
 * Pulsing list placeholder — use while task lists are loading.
 */
export function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-2.5 px-2 py-1.5">
          <Skeleton className="w-4 h-4 rounded flex-shrink-0" style={{ animationDelay: `${i * 0.08}s` }} />
          <div className="flex-1 space-y-1.5">
            <Skeleton style={{ height: 9, width: `${55 + (i % 3) * 15}%`, animationDelay: `${i * 0.08}s` }} />
            <Skeleton style={{ height: 7, width: `${30 + (i % 4) * 10}%`, animationDelay: `${i * 0.1}s` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── SkeletonProgress ───────────────────────────────────────────────────────────

/**
 * Pulsing progress bar placeholder.
 */
export function SkeletonProgress({ label = true }: { label?: boolean }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <div className="flex justify-between">
          <Skeleton style={{ height: 9, width: '35%' }} />
          <Skeleton style={{ height: 9, width: '15%' }} />
        </div>
      )}
      <div
        className="rounded-full overflow-hidden"
        style={{ height: 6, background: 'rgba(255,255,255,0.06)' }}
      >
        <Skeleton
          className="h-full rounded-full"
          style={{ width: '60%', background: 'rgba(212,175,55,0.2)' }}
        />
      </div>
    </div>
  )
}

// ─── EmptyState ─────────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

/**
 * Empty state with optional icon, title, description, and CTA button.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center px-6 py-8 gap-3 ${className}`}
    >
      {icon && (
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{
            background: 'rgba(212,175,55,0.08)',
            border: '1px solid rgba(212,175,55,0.2)',
          }}
          aria-hidden="true"
        >
          {icon}
        </div>
      )}

      <div className="space-y-1">
        <p className="text-sm font-semibold" style={{ color: '#FAFAFA' }}>
          {title}
        </p>
        {description && (
          <p className="text-xs leading-relaxed" style={{ color: '#71717a' }}>
            {description}
          </p>
        )}
      </div>

      {action && (
        <button
          onClick={action.onClick}
          className="mt-1 flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:brightness-110 active:scale-[0.97]"
          style={{
            background: 'linear-gradient(135deg, #D4AF37 0%, #F5D060 100%)',
            color: '#030712',
            boxShadow: '0 0 16px rgba(212,175,55,0.25)',
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

// ─── ErrorState ─────────────────────────────────────────────────────────────────

interface ErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
  className?: string
}

/**
 * Error state with optional retry button.
 */
export function ErrorState({
  title = 'Something went wrong',
  description = 'An unexpected error occurred. Please try again.',
  onRetry,
  className = '',
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center text-center px-6 py-6 gap-3 ${className}`}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
        aria-hidden="true"
      >
        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" style={{ color: '#EF4444' }}>
          <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
          <path d="M10 7v4M10 13v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      <div className="space-y-1">
        <p className="text-sm font-semibold" style={{ color: '#FCA5A5' }}>{title}</p>
        <p className="text-xs" style={{ color: '#71717a' }}>{description}</p>
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          aria-label="Retry"
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all hover:brightness-110 active:scale-[0.97]"
          style={{
            background: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.25)',
            color: '#FCA5A5',
          }}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none">
            <path
              d="M1.5 7A5.5 5.5 0 0012.5 7M12.5 7V4m0 3h-3"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Try again
        </button>
      )}
    </div>
  )
}

// ─── Keyframes (injected once) ─────────────────────────────────────────────────

if (typeof document !== 'undefined') {
  const id = 'forje-skeleton-styles'
  if (!document.getElementById(id)) {
    const style = document.createElement('style')
    style.id = id
    style.textContent = `
      @keyframes forje-skeleton-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
      }
      @media (prefers-reduced-motion: reduce) {
        [style*="forje-skeleton-pulse"] { animation: none !important; }
      }
    `
    document.head.appendChild(style)
  }
}
