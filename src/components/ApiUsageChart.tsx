'use client'
import { useState } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'

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

function formatHour(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatDay(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

type CustomTooltipProps = {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
  range: TimeRange
}

function CustomTooltip({ active, payload, label, range }: CustomTooltipProps) {
  if (!active || !payload?.length || !label) return null
  const formatter = range === '7d' ? formatDay : formatHour
  return (
    <div className="bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm shadow-xl">
      <p className="text-gray-300 mb-2">{formatter(label)}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="font-medium">
          {p.name}: <span className="text-white">{p.value.toLocaleString()}</span>
        </p>
      ))}
    </div>
  )
}

type ApiUsageChartProps = {
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
  const labelFormatter = range === '7d' ? formatDay : formatHour

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
                  ? 'bg-[#FFB81C] text-black'
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
      ) : data.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
          No usage data for this period
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FFB81C" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#FFB81C" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="redGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="hour"
              tickFormatter={labelFormatter}
              tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              content={<CustomTooltip range={range} />}
              cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
            />
            {rateLimit !== undefined && (
              <ReferenceLine
                y={rateLimit}
                stroke="#ef4444"
                strokeDasharray="6 3"
                strokeWidth={1.5}
                label={{
                  value: `Limit: ${rateLimit}`,
                  position: 'insideTopRight',
                  fill: '#ef4444',
                  fontSize: 10,
                }}
              />
            )}
            <Area
              type="monotone"
              dataKey="requests"
              name="Requests"
              stroke="#FFB81C"
              strokeWidth={2}
              fill="url(#goldGradient)"
              dot={false}
              activeDot={{ r: 4, fill: '#FFB81C', stroke: '#0a0a0a', strokeWidth: 2 }}
            />
            <Area
              type="monotone"
              dataKey="errors"
              name="Errors"
              stroke="#ef4444"
              strokeWidth={2}
              fill="url(#redGradient)"
              dot={false}
              activeDot={{ r: 4, fill: '#ef4444', stroke: '#0a0a0a', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}

      <div className="flex gap-4 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-[#FFB81C]" />
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
