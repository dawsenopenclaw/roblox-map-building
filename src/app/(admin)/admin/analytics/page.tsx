'use client'

import React, { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Users, DollarSign } from 'lucide-react'

interface AnalyticsData {
  mrrCents: number
  churnRate: number
  ltv: number
  arpu: number
  funnel: {
    visits: number
    signups: number
    activated: number
    paying: number
  }
  topTemplates: {
    id: string
    title: string
    revenueCents: number
    downloads: number
  }[]
  cohortRetention: {
    cohort: string
    week1: number
    week2: number
    week4: number
    week8: number
  }[]
  mrrHistory: { month: string; mrrCents: number }[]
}

const DEMO_DATA: AnalyticsData = {
  mrrCents: 489500,
  churnRate: 2.4,
  ltv: 312,
  arpu: 18.5,
  funnel: { visits: 48200, signups: 3840, activated: 2100, paying: 312 },
  topTemplates: [
    { id: '1', title: 'Modern City Block', revenueCents: 124800, downloads: 412 },
    { id: '2', title: 'Tropical Island Pack', revenueCents: 87300, downloads: 291 },
    { id: '3', title: 'Medieval Castle Walls', revenueCents: 63500, downloads: 890 },
    { id: '4', title: 'Sci-Fi Space Station', revenueCents: 44200, downloads: 148 },
    { id: '5', title: 'Forest Terrain Bundle', revenueCents: 31000, downloads: 207 },
  ],
  cohortRetention: [
    { cohort: 'Jan 2026', week1: 82, week2: 68, week4: 55, week8: 42 },
    { cohort: 'Feb 2026', week1: 79, week2: 65, week4: 51, week8: 0 },
    { cohort: 'Mar 2026', week1: 85, week2: 0, week4: 0, week8: 0 },
  ],
  mrrHistory: [
    { month: 'Oct 2025', mrrCents: 210000 },
    { month: 'Nov 2025', mrrCents: 268000 },
    { month: 'Dec 2025', mrrCents: 315000 },
    { month: 'Jan 2026', mrrCents: 382000 },
    { month: 'Feb 2026', mrrCents: 441000 },
    { month: 'Mar 2026', mrrCents: 489500 },
  ],
}

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trendUp,
}: {
  title: string
  value: string
  subtitle?: string
  icon: React.ReactNode
  trendUp?: boolean
}) {
  return (
    <div className="bg-[#242424] border border-[#3a3a3a] rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-[#6B7280] uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {subtitle && <p className="text-xs text-[#6B7280] mt-1">{subtitle}</p>}
          {trendUp !== undefined && (
            <div
              className={`flex items-center gap-1 mt-2 text-xs font-medium ${trendUp ? 'text-green-400' : 'text-red-400'}`}
            >
              {trendUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {trendUp ? 'Up' : 'Down'} vs last month
            </div>
          )}
        </div>
        <div className="w-10 h-10 bg-[#FFB81C]/10 rounded-lg flex items-center justify-center">
          {icon}
        </div>
      </div>
    </div>
  )
}

function ProgressBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-[#6B7280]">{label}</span>
        <span className="text-white font-medium">
          {count.toLocaleString()} <span className="text-[#6B7280]">({pct.toFixed(1)}%)</span>
        </span>
      </div>
      <div className="h-2 bg-[#2e2e2e] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  )
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData>(DEMO_DATA)
  const [isDemo, setIsDemo] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`)
        return r.json()
      })
      .then((raw) => {
        // Normalize API shape into our local shape
        setData({
          mrrCents: raw.mrrTrend?.at(-1)?.mrrCents ?? raw.mrrCents ?? 0,
          churnRate: raw.churnRate ?? 0,
          ltv: raw.ltv ?? 0,
          arpu: raw.arpu ?? 0,
          funnel: raw.funnel ?? DEMO_DATA.funnel,
          topTemplates: raw.topTemplates ?? [],
          cohortRetention: raw.cohortRetention ?? [],
          mrrHistory: (raw.mrrTrend ?? []).map((p: { date: string; mrrCents: number }) => ({
            month: p.date,
            mrrCents: p.mrrCents,
          })),
        })
        setIsDemo(false)
      })
      .catch(() => {
        setData(DEMO_DATA)
        setIsDemo(true)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-[#FFB81C] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const maxMrr = Math.max(...data.mrrHistory.map((m) => m.mrrCents), 1)

  return (
    <div className="space-y-8 p-6 max-w-[1600px] mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-[#6B7280] text-sm mt-1">Revenue, growth, and retention metrics</p>
        </div>
        {isDemo && (
          <span className="text-xs px-2 py-1 bg-[#FFB81C]/10 text-[#FFB81C] border border-[#FFB81C]/20 rounded-full">
            Demo data — DB unavailable
          </span>
        )}
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          title="MRR"
          value={`$${(data.mrrCents / 100).toLocaleString()}`}
          icon={<DollarSign className="w-5 h-5 text-[#FFB81C]" />}
          trendUp={true}
        />
        <MetricCard
          title="Churn Rate"
          value={`${data.churnRate.toFixed(2)}%`}
          subtitle="Monthly"
          icon={<TrendingDown className="w-5 h-5 text-[#FFB81C]" />}
          trendUp={false}
        />
        <MetricCard
          title="LTV"
          value={`$${data.ltv.toFixed(0)}`}
          subtitle="Avg lifetime value"
          icon={<Users className="w-5 h-5 text-[#FFB81C]" />}
          trendUp={true}
        />
        <MetricCard
          title="ARPU"
          value={`$${data.arpu.toFixed(2)}`}
          subtitle="Per active user"
          icon={<DollarSign className="w-5 h-5 text-[#FFB81C]" />}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* MRR bar chart */}
        <div className="xl:col-span-2 bg-[#242424] border border-[#3a3a3a] rounded-xl p-6">
          <h2 className="text-sm font-semibold text-[#6B7280] uppercase tracking-wider mb-6">
            MRR Trend
          </h2>
          {data.mrrHistory.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-[#6B7280] text-sm">
              No data available
            </div>
          ) : (
            <>
              <div className="flex items-end gap-2 h-40">
                {data.mrrHistory.map((point, i) => {
                  const height = (point.mrrCents / maxMrr) * 100
                  return (
                    <div
                      key={i}
                      className="flex-1 flex flex-col items-center justify-end"
                      style={{ height: '100%' }}
                    >
                      <div
                        className="w-full rounded-t bg-[#FFB81C]/25 hover:bg-[#FFB81C]/50 transition-colors cursor-pointer"
                        style={{ height: `${Math.max(height, 4)}%` }}
                        title={`${point.month}: $${(point.mrrCents / 100).toLocaleString()}`}
                      />
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-between mt-3">
                {data.mrrHistory.map((point, i) => (
                  <span key={i} className="text-xs text-[#6B7280] text-center flex-1">
                    {point.month.split(' ')[0]}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Conversion funnel */}
        <div className="bg-[#242424] border border-[#3a3a3a] rounded-xl p-6">
          <h2 className="text-sm font-semibold text-[#6B7280] uppercase tracking-wider mb-6">
            Conversion Funnel
          </h2>
          <div className="space-y-4">
            <ProgressBar label="Visits" count={data.funnel.visits} total={data.funnel.visits} color="#FFB81C" />
            <ProgressBar label="Sign Ups" count={data.funnel.signups} total={data.funnel.visits} color="#E6A519" />
            <ProgressBar label="Activated" count={data.funnel.activated} total={data.funnel.visits} color="#c88d15" />
            <ProgressBar label="Paying" count={data.funnel.paying} total={data.funnel.visits} color="#a87210" />
          </div>
          <div className="mt-6 pt-4 border-t border-[#3a3a3a]">
            <p className="text-xs text-[#6B7280]">
              Paid conversion:{' '}
              <span className="text-white font-semibold">
                {data.funnel.visits > 0 ? ((data.funnel.paying / data.funnel.visits) * 100).toFixed(2) : '0.00'}%
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Top templates */}
        <div className="bg-[#242424] border border-[#3a3a3a] rounded-xl p-6">
          <h2 className="text-sm font-semibold text-[#6B7280] uppercase tracking-wider mb-4">
            Top Templates by Revenue
          </h2>
          {data.topTemplates.length === 0 ? (
            <p className="text-[#6B7280] text-sm">No template revenue data</p>
          ) : (
            <div className="space-y-3">
              {data.topTemplates.map((template, i) => (
                <div key={template.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#6B7280] w-4 flex-shrink-0">{i + 1}</span>
                    <div>
                      <p className="text-sm text-white font-medium">{template.title}</p>
                      <p className="text-xs text-[#6B7280]">
                        {template.downloads.toLocaleString()} downloads
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-[#FFB81C]">
                    ${(template.revenueCents / 100).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cohort retention */}
        <div className="bg-[#242424] border border-[#3a3a3a] rounded-xl p-6">
          <h2 className="text-sm font-semibold text-[#6B7280] uppercase tracking-wider mb-4">
            Cohort Retention
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-[#6B7280] border-b border-[#3a3a3a]">
                  <th className="pb-2 text-left font-medium">Cohort</th>
                  <th className="pb-2 text-right font-medium">Wk 1</th>
                  <th className="pb-2 text-right font-medium">Wk 2</th>
                  <th className="pb-2 text-right font-medium">Wk 4</th>
                  <th className="pb-2 text-right font-medium">Wk 8</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3a3a3a]">
                {data.cohortRetention.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-[#6B7280]">
                      No cohort data
                    </td>
                  </tr>
                ) : (
                  data.cohortRetention.map((row) => (
                    <tr key={row.cohort}>
                      <td className="py-2.5 text-[#6B7280] text-xs">{row.cohort}</td>
                      {[row.week1, row.week2, row.week4, row.week8].map((pct, i) => (
                        <td
                          key={i}
                          className="py-2.5 text-right text-sm font-medium"
                          style={{
                            color: pct === 0 ? '#374151' : `rgba(255,184,28,${0.4 + (pct / 100) * 0.6})`,
                          }}
                        >
                          {pct === 0 ? '—' : `${pct.toFixed(0)}%`}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
