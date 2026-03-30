'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export type ChartDataPoint = { name: string; value: number }

type TooltipPayloadItem = { value: number; payload: ChartDataPoint }

function ChartTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayloadItem[] }) {
  if (!active || !payload?.length) return null
  const p = payload[0]
  return (
    <div className="bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm shadow-xl">
      <p className="text-gray-400 text-xs mb-1">{p.payload.name}</p>
      <p className="text-white font-semibold">${(p.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
    </div>
  )
}

export function RevenueBarChart({
  data,
  chartMax,
  barColor = '#D4AF37',
}: {
  data: ChartDataPoint[]
  chartMax: number
  barColor?: string
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fill: '#6b7280', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#6b7280', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => `$${v}`}
          domain={[0, Math.ceil(chartMax * 1.2)]}
          width={50}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: '#ffffff06' }} />
        <Bar dataKey="value" fill={barColor} radius={[4, 4, 0, 0]} maxBarSize={48} />
      </BarChart>
    </ResponsiveContainer>
  )
}
