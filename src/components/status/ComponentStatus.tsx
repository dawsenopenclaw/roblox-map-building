'use client'

import { StatusIndicator, type Status } from './StatusIndicator'
import { UptimeBar } from './UptimeBar'

interface ComponentStatusProps {
  name: string
  description?: string
  status: Status
  /** Uptime percentage over the last 90 days, e.g. 99.98 */
  uptimePct?: number
  /** Per-day history for the uptime bar. Omit for synthetic all-green. */
  history?: Status[]
  /** Hide the 90-day bar below the row. */
  hideUptimeBar?: boolean
}

/**
 * A single row on the public status page. Shows a component's name,
 * description, live indicator, and optional 90-day uptime visualization.
 */
export function ComponentStatus({
  name,
  description,
  status,
  uptimePct,
  history,
  hideUptimeBar = false,
}: ComponentStatusProps) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 transition-colors hover:bg-white/[0.04]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-semibold text-white">{name}</h3>
          {description && (
            <p className="mt-0.5 text-sm text-zinc-400 leading-relaxed">
              {description}
            </p>
          )}
        </div>
        <div className="flex-shrink-0 pt-0.5">
          <StatusIndicator status={status} />
        </div>
      </div>

      {!hideUptimeBar && (
        <div className="mt-4">
          <UptimeBar history={history} />
          <div className="mt-2 flex items-center justify-between text-[11px] uppercase tracking-wide text-zinc-500">
            <span>90 days ago</span>
            <span className="text-zinc-400">
              {uptimePct !== undefined
                ? `${uptimePct.toFixed(2)}% uptime`
                : '100.00% uptime'}
            </span>
            <span>Today</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default ComponentStatus
