'use client'
import { useState } from 'react'
import dynamic from 'next/dynamic'

// Lazy-load the recharts inner component to keep recharts (~300 KB) out of
// the initial bundle — it only loads once this component is first rendered.
const ApiUsageChartInner = dynamic(
  () => import('./ApiUsageChartInner').then(m => ({ default: m.ApiUsageChartInner })),
  {
    ssr: false,
    loading: () => <div className="h-48 bg-white/5 rounded-xl animate-pulse" />,
  },
)

export type UsageBucket = {
  /** ISO timestamp for the bucket start */
  hour: string
  /** Total requests in this bucket */
  requests: number
  /** Failed requests in this bucket */
  errors: number
}

type TimeRange = '1h' | '6h' | '24h' | '7d'

const RANGE_LABELS: Record<TimeRange, string> = {
  '1h': '1 Hour',
  '6h': '6 Hours',
  '24h': '24 Hours',
  '7d': '7 Days',
}

export type ApiUsageChartProps = {
  data: UsageBucket[]
  /** Rate limit cap to show as dashed threshold line */
  rateLimit?: number
  range: TimeRange
  onRangeChange: (r: TimeRange) => void
  loading?: boolean
}

export function ApiUsageChart({
  data,
  rateLimit,
  range,
  onRangeChange,
  loading = false,
}: ApiUsageChartProps) {
  return (
    <div className="bg-[#141414] border border-white/10 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-white font-semibold">Requests Over Time</h3>
        <div className="flex gap-1 bg-white/5 rounded-lg p-1">
          {(Object.keys(RANGE_LABELS) as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => onRangeChange(r)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                range === r
                  ? 'bg-[#D4AF37] text-black'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              {RANGE_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-48 bg-white/5 rounded-xl animate-pulse" />
      ) : (
        <ApiUsageChartInner data={data} rateLimit={rateLimit} range={range} />
      )}

      <div className="flex gap-4 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-[#D4AF37]" />
          <span className="text-gray-300 text-xs">Requests</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-red-500" />
          <span className="text-gray-300 text-xs">Errors</span>
        </div>
        {rateLimit !== undefined && (
          <div className="flex items-center gap-2">
            <div className="w-4 border-t border-dashed border-red-500" />
            <span className="text-gray-300 text-xs">Rate Limit</span>
          </div>
        )}
      </div>
    </div>
  )
}
