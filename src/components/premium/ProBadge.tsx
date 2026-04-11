'use client'

import * as React from 'react'
import { GoldShimmer } from './GoldShimmer'

export type ProTier = 'free' | 'starter' | 'pro' | 'studio' | 'enterprise'

export interface ProBadgeProps {
  tier?: ProTier
  /** Size variant. */
  size?: 'xs' | 'sm' | 'md' | 'lg'
  /** Optional label override. */
  label?: string
  className?: string
  /** Disable the shimmer animation (still shows gold gradient). */
  disableShimmer?: boolean
}

/**
 * Pro tier badge component.
 *
 * Accessibility:
 * - Uses role="img" with aria-label describing the tier.
 * - Text is visible to all users and readable by screen readers.
 */
export function ProBadge({
  tier = 'pro',
  size = 'sm',
  label,
  className,
  disableShimmer = false,
}: ProBadgeProps): React.ReactElement {
  const text = label ?? TIER_LABELS[tier]
  const sizeClass = SIZE_CLASSES[size]
  const ariaLabel = `${text} plan`

  if (tier === 'free') {
    return (
      <span
        role="img"
        aria-label={ariaLabel}
        className={`inline-flex items-center rounded-full border border-border bg-muted font-semibold text-muted-foreground ${sizeClass} ${className ?? ''}`}
      >
        {text}
      </span>
    )
  }

  if (tier === 'starter') {
    return (
      <span
        role="img"
        aria-label={ariaLabel}
        className={`inline-flex items-center rounded-full border border-blue-400 bg-blue-50 font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 ${sizeClass} ${className ?? ''}`}
      >
        {text}
      </span>
    )
  }

  if (tier === 'enterprise') {
    return (
      <span
        role="img"
        aria-label={ariaLabel}
        className={`inline-flex items-center rounded-full border border-slate-700 bg-slate-900 font-semibold text-slate-100 ${sizeClass} ${className ?? ''}`}
      >
        {text}
      </span>
    )
  }

  // Pro / Studio — gold shimmer.
  return (
    <span
      role="img"
      aria-label={ariaLabel}
      className={`inline-flex items-center rounded-full border border-amber-300 bg-gradient-to-r from-amber-100 to-yellow-100 font-semibold dark:border-amber-500 dark:from-amber-950/40 dark:to-yellow-950/40 ${sizeClass} ${className ?? ''}`}
    >
      <GoldShimmer disabled={disableShimmer}>{text}</GoldShimmer>
    </span>
  )
}

const TIER_LABELS: Record<ProTier, string> = {
  free: 'FREE',
  starter: 'STARTER',
  pro: 'PRO',
  studio: 'STUDIO',
  enterprise: 'ENTERPRISE',
}

const SIZE_CLASSES: Record<NonNullable<ProBadgeProps['size']>, string> = {
  xs: 'px-1.5 py-0.5 text-[10px] leading-none',
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
}

export default ProBadge
