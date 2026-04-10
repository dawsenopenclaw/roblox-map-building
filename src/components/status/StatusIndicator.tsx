'use client'

import type { CSSProperties } from 'react'

export type Status = 'operational' | 'degraded' | 'outage'

interface StatusIndicatorProps {
  status: Status
  /** Hide the text label and show only the dot. */
  compact?: boolean
  /** Override the rendered label text. */
  label?: string
}

const LABELS: Record<Status, string> = {
  operational: 'Operational',
  degraded: 'Degraded performance',
  outage: 'Major outage',
}

const COLORS: Record<Status, { dot: string; glow: string; text: string }> = {
  operational: {
    dot: '#10b981',
    glow: 'rgba(16, 185, 129, 0.55)',
    text: '#34d399',
  },
  degraded: {
    dot: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.55)',
    text: '#fbbf24',
  },
  outage: {
    dot: '#ef4444',
    glow: 'rgba(239, 68, 68, 0.6)',
    text: '#f87171',
  },
}

/**
 * Reusable colored dot + label used across the public status page.
 * Pulses gently so users can tell at a glance that the page is live.
 */
export function StatusIndicator({ status, compact = false, label }: StatusIndicatorProps) {
  const palette = COLORS[status]
  const text = label ?? LABELS[status]

  const dotStyle: CSSProperties = {
    backgroundColor: palette.dot,
    boxShadow: `0 0 0 0 ${palette.glow}`,
  }

  return (
    <span
      className="inline-flex items-center gap-2"
      role="status"
      aria-label={`Status: ${text}`}
    >
      <span className="relative inline-flex h-2.5 w-2.5">
        <span
          className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-70"
          style={{ backgroundColor: palette.dot }}
          aria-hidden="true"
        />
        <span
          className="relative inline-flex h-2.5 w-2.5 rounded-full"
          style={dotStyle}
          aria-hidden="true"
        />
      </span>
      {!compact && (
        <span
          className="text-sm font-medium"
          style={{ color: palette.text }}
        >
          {text}
        </span>
      )}
    </span>
  )
}

export default StatusIndicator
