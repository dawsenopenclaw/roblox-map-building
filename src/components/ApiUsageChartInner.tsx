'use client'

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
  hour: string
  requests: number
  errors: number
}

type TimeRange = '1h' | '6h' | '24h' | '7d'

function formatHour(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' })
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

export type ApiUsageChartInnerProps = {
  data: UsageBucket[]
  rateLimit?: number
  range: TimeRange
}

export function ApiUsageChartInner({ data, rateLimit, range }: ApiUsageChartInnerProps) {
  const labelFormatter = range === '7d' ? formatDay : formatHour

  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
        No usage data for this period
      </div>
    )
  }

  return (
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
  )
}
