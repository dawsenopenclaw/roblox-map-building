'use client'

import { useMemo } from 'react'
import type { Status } from './StatusIndicator'

interface UptimeBarProps {
  /** Number of days to render. Defaults to 90 like Stripe's status page. */
  days?: number
  /**
   * Optional per-day status, indexed oldest → newest. If shorter than
   * `days` the missing days are assumed operational. If omitted entirely
   * we render 100% green — which is what we want for a brand-new page
   * with no real history yet.
   */
  history?: Status[]
}

const BAR_COLORS: Record<Status, string> = {
  operational: '#10b981',
  degraded: '#f59e0b',
  outage: '#ef4444',
}

const BAR_HOVER: Record<Status, string> = {
  operational: '#34d399',
  degraded: '#fbbf24',
  outage: '#f87171',
}

const STATUS_LABEL: Record<Status, string> = {
  operational: 'Operational',
  degraded: 'Degraded performance',
  outage: 'Major outage',
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * 90 colored bars (configurable), one per day, mimicking Stripe's
 * uptime visualization. Each bar has a native tooltip showing the date
 * and status so users can audit the timeline without extra UI.
 */
export function UptimeBar({ days = 90, history }: UptimeBarProps) {
  const bars = useMemo(() => {
    const out: { date: Date; status: Status }[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const idx = days - 1 - i
      const status: Status = history?.[idx] ?? 'operational'
      out.push({ date: d, status })
    }
    return out
  }, [days, history])

  return (
    <div
      className="flex items-end gap-[2px] w-full"
      role="img"
      aria-label={`Uptime for the last ${days} days`}
    >
      {bars.map((bar, i) => (
        <span
          key={i}
          title={`${formatDate(bar.date)} — ${STATUS_LABEL[bar.status]}`}
          className="flex-1 h-8 rounded-[2px] transition-colors duration-150"
          style={{
            backgroundColor: BAR_COLORS[bar.status],
            ['--hover-color' as string]: BAR_HOVER[bar.status],
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = BAR_HOVER[bar.status]
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = BAR_COLORS[bar.status]
          }}
        />
      ))}
    </div>
  )
}

export default UptimeBar
