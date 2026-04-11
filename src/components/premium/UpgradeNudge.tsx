'use client'

import * as React from 'react'

export type UpgradeReason =
  | 'out-of-credits'
  | 'pro-feature'
  | 'project-limit'
  | 'export-blocked'
  | 'generic'

export interface UpgradeNudgeProps {
  /** Unique key used for localStorage dismissal + cooldown. */
  dismissKey: string
  /** Why we're showing this nudge — chooses copy + icon. */
  reason?: UpgradeReason
  /** Optional custom headline. */
  headline?: string
  /** Optional custom body. */
  body?: string
  /** CTA href — where Upgrade leads. */
  upgradeHref?: string
  /** Cooldown period in ms after dismissal before nudge re-appears. Defaults to 7 days. */
  cooldownMs?: number
  /** Called when user clicks the CTA. */
  onUpgradeClick?: () => void
  /** Render inline rather than as a floating card. */
  inline?: boolean
  className?: string
}

/**
 * Context-aware upgrade nudge with smart frequency + dismissal.
 *
 * Accessibility:
 * - Rendered as role="complementary" (inline) or role="dialog" (floating) with
 *   aria-live="polite".
 * - Dismiss button has an aria-label.
 * - Focus is NOT stolen on mount (keeps the user in their flow).
 *
 * Storage: uses localStorage with key `forje:nudge:<dismissKey>`. Stores a
 * timestamp of the last dismissal so cooldowns can be enforced.
 */
export function UpgradeNudge({
  dismissKey,
  reason = 'generic',
  headline,
  body,
  upgradeHref = '/pricing',
  cooldownMs = 7 * 24 * 60 * 60 * 1000,
  onUpgradeClick,
  inline = false,
  className,
}: UpgradeNudgeProps): React.ReactElement | null {
  const [visible, setVisible] = React.useState(false)

  React.useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem(storageKey(dismissKey))
      if (!raw) {
        setVisible(true)
        return
      }
      const dismissedAt = Number(raw)
      if (!Number.isFinite(dismissedAt)) {
        setVisible(true)
        return
      }
      if (Date.now() - dismissedAt >= cooldownMs) {
        setVisible(true)
      }
    } catch {
      setVisible(true)
    }
  }, [dismissKey, cooldownMs])

  const copy = DEFAULT_COPY[reason]
  const finalHeadline = headline ?? copy.headline
  const finalBody = body ?? copy.body

  const handleDismiss = React.useCallback(() => {
    setVisible(false)
    try {
      window.localStorage.setItem(storageKey(dismissKey), String(Date.now()))
    } catch {
      /* localStorage blocked — still hide */
    }
  }, [dismissKey])

  if (!visible) return null

  const baseClasses = inline
    ? 'relative rounded-xl border border-amber-300/60 bg-gradient-to-br from-amber-50 to-yellow-50 p-4 shadow-sm dark:border-amber-500/40 dark:from-amber-950/30 dark:to-yellow-950/30'
    : 'fixed bottom-4 right-4 z-[9998] w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-amber-300/60 bg-gradient-to-br from-amber-50 to-yellow-50 p-4 shadow-lg dark:border-amber-500/40 dark:from-amber-950/30 dark:to-yellow-950/30'

  return (
    <div
      role={inline ? 'complementary' : 'dialog'}
      aria-live="polite"
      aria-label={finalHeadline}
      className={`${baseClasses} ${className ?? ''}`}
    >
      <div className="flex items-start gap-3">
        <div aria-hidden="true" className="flex-shrink-0 text-2xl">
          {copy.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100">
            {finalHeadline}
          </h3>
          <p className="mt-1 text-xs text-amber-800/90 dark:text-amber-200/80">{finalBody}</p>
          <div className="mt-3 flex items-center gap-2">
            <a
              href={upgradeHref}
              onClick={onUpgradeClick}
              className="inline-flex items-center rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 focus-visible:ring-offset-2"
            >
              Upgrade
            </a>
            <button
              type="button"
              onClick={handleDismiss}
              className="text-xs font-medium text-amber-800/80 underline-offset-2 hover:underline dark:text-amber-200/80 focus:outline-none focus-visible:underline"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss upgrade nudge"
          className="flex-shrink-0 rounded p-1 text-amber-800/70 transition-colors hover:bg-amber-100 hover:text-amber-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 dark:text-amber-200/70 dark:hover:bg-amber-900/40"
        >
          <svg
            aria-hidden="true"
            width="14"
            height="14"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="4" y1="4" x2="16" y2="16" />
            <line x1="16" y1="4" x2="4" y2="16" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function storageKey(k: string): string {
  return `forje:nudge:${k}`
}

interface NudgeCopy {
  headline: string
  body: string
  icon: string
}

const DEFAULT_COPY: Record<UpgradeReason, NudgeCopy> = {
  'out-of-credits': {
    headline: 'You\'re out of credits',
    body: 'Upgrade to Pro for unlimited builds and priority generation.',
    icon: '⚡',
  },
  'pro-feature': {
    headline: 'This is a Pro feature',
    body: 'Upgrade to unlock advanced generators, custom themes, and more.',
    icon: '🔒',
  },
  'project-limit': {
    headline: 'Project limit reached',
    body: 'Upgrade to Pro for unlimited saved projects.',
    icon: '📁',
  },
  'export-blocked': {
    headline: 'Export unavailable on Free',
    body: 'Upgrade to download your .rbxl files and ship to Roblox.',
    icon: '📦',
  },
  generic: {
    headline: 'Get more out of ForjeGames',
    body: 'Pro unlocks unlimited builds, priority queue, and pro-only features.',
    icon: '✨',
  },
}

export default UpgradeNudge
