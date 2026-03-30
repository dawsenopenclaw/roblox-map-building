'use client'

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Legend,
} from 'recharts'

export type RadarDataPoint = {
  subject: string
  a: number
  b: number
}

export function DnaSingleRadarChart({
  data,
  dataKey,
  label,
  stroke,
  fill,
  height = 260,
}: {
  data: RadarDataPoint[]
  dataKey: 'a' | 'b'
  label: string
  stroke: string
  fill: string
  height?: number
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
        <PolarGrid stroke="#ffffff15" />
        <PolarAngleAxis dataKey="subject" tick={{ fill: '#9CA3AF', fontSize: 10 }} />
        <Radar name={label} dataKey={dataKey} stroke={stroke} fill={fill} fillOpacity={0.2} strokeWidth={2} />
      </RadarChart>
    </ResponsiveContainer>
  )
}

export function DnaOverlayRadarChart({
  data,
  labelA,
  labelB,
}: {
  data: RadarDataPoint[]
  labelA: string
  labelB: string
}) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <RadarChart data={data} margin={{ top: 10, right: 40, bottom: 10, left: 40 }}>
        <PolarGrid stroke="#ffffff15" />
        <PolarAngleAxis dataKey="subject" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
        <Radar name={labelA} dataKey="a" stroke="#FFB81C" fill="#FFB81C" fillOpacity={0.2} strokeWidth={2} />
        <Radar name={labelB} dataKey="b" stroke="#60A5FA" fill="#60A5FA" fillOpacity={0.15} strokeWidth={2} />
        <Legend wrapperStyle={{ fontSize: 12, color: '#9CA3AF' }} />
      </RadarChart>
    </ResponsiveContainer>
  )
}
