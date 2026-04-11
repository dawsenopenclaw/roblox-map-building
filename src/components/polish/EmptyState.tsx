'use client'

import * as React from 'react'

export interface EmptyStateAction {
  label: string
  onClick?: () => void
  href?: string
  loading?: boolean
}

export interface EmptyStateProps {
  /** Illustration slot — accepts any React node (SVG, image, icon). */
  illustration?: React.ReactNode
  /** Main heading, shown as an h2. */
  headline: string
  /** Supporting copy. Keep it short — one or two sentences. */
  body?: string
  /** Primary CTA button. */
  primary?: EmptyStateAction
  /** Secondary CTA button. */
  secondary?: EmptyStateAction
  /** Extra className for outer wrapper. */
  className?: string
  /** Compact variant — tighter spacing, smaller illustration. */
  compact?: boolean
  /** Optional ARIA label for the region (defaults to "Empty state"). */
  ariaLabel?: string
}

/**
 * Beautiful, reusable empty state component.
 *
 * Accessibility:
 * - Rendered as a semantic <section> with role="status" and aria-live="polite"
 *   so screen readers announce when content loads into an empty view.
 * - CTAs are focusable buttons/links with visible focus rings.
 *
 * Usage:
 *   <EmptyState
 *     illustration={<SparkleIcon />}
 *     headline="No projects yet"
 *     body="Start by describing the game you want to build."
 *     primary={{ label: 'Create project', onClick: handleCreate }}
 *     secondary={{ label: 'Browse templates', href: '/templates' }}
 *   />
 */
export function EmptyState({
  illustration,
  headline,
  body,
  primary,
  secondary,
  className,
  compact = false,
  ariaLabel = 'Empty state',
}: EmptyStateProps): React.ReactElement {
  const paddingClass = compact ? 'py-8 px-4' : 'py-16 px-6'
  const illoSize = compact ? 'h-20 w-20' : 'h-32 w-32'

  return (
    <section
      role="status"
      aria-live="polite"
      aria-label={ariaLabel}
      className={`flex flex-col items-center justify-center text-center ${paddingClass} ${className ?? ''}`}
    >
      {illustration && (
        <div
          aria-hidden="true"
          className={`${illoSize} mb-6 flex items-center justify-center text-muted-foreground/60`}
        >
          {illustration}
        </div>
      )}
      <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
        {headline}
      </h2>
      {body && (
        <p className="mt-2 max-w-md text-sm text-muted-foreground sm:text-base">
          {body}
        </p>
      )}
      {(primary || secondary) && (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          {primary && <EmptyStateButton action={primary} variant="primary" />}
          {secondary && <EmptyStateButton action={secondary} variant="secondary" />}
        </div>
      )}
    </section>
  )
}

function EmptyStateButton({
  action,
  variant,
}: {
  action: EmptyStateAction
  variant: 'primary' | 'secondary'
}): React.ReactElement {
  const base =
    'inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
  const styles =
    variant === 'primary'
      ? 'bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-primary'
      : 'border border-border bg-background text-foreground hover:bg-muted focus-visible:ring-muted-foreground'

  if (action.href) {
    return (
      <a
        href={action.href}
        className={`${base} ${styles}`}
        aria-disabled={action.loading || undefined}
      >
        {action.label}
      </a>
    )
  }
  return (
    <button
      type="button"
      onClick={action.onClick}
      disabled={action.loading}
      className={`${base} ${styles}`}
    >
      {action.loading ? 'Loading…' : action.label}
    </button>
  )
}

export default EmptyState
