'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Users, DollarSign } from 'lucide-react'

interface AnalyticsData {
  mrrTrend: { date: string; mrrCents: number }[]
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
  costVsRevenue: {
    date: string
    costMicro: number
    revenueMicro: number
    marginMicro: number
  }[]
}

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
}: {
  title: string
  value: string
  subtitle?: string
  icon: React.ReactNode
  trend?: { direction: 'up' | 'down'; value: string }
}) {
  return (
    <div className="bg-[#0D1231] border border-[#1E2451] rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-[#6B7280] uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {subtitle && <p className="text-xs text-[#6B7280] mt-1">{subtitle}</p>}
          {trend && (
            <div
              className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend.direction === 'up' ? 'text-green-400' : 'text-red-400'}`}
            >
              {trend.direction === 'up' ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              {trend.value} vs last month
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

function FunnelBar({
  label,
  count,
  total,
  color,
}: {
  label: string
  count: number
  total: number
  color: string
}) {
  const pct = total > 0 ? (count / total) * 100 : 0
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-[#6B7280]">{label}</span>
        <span className="text-white font-medium">
          {count.toLocaleString()} ({pct.toFixed(1)}%)
        </span>
      </div>
      <div className="h-2 bg-[#111640] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  )
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-[#FFB81C] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-red-400">Failed to load analytics</p>
      </div>
    )
  }

  const funnelTotal = data.funnel.visits

  return (
    <div className="space-y-8 p-6 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Business Analytics</h1>
        <p className="text-[#6B7280] text-sm mt-1">Revenue, growth, and retention metrics</p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          title="MRR"
          value={`$${(data.mrrTrend[data.mrrTrend.length - 1]?.mrrCents / 100 || 0).toLocaleString()}`}
          icon={<DollarSign className="w-5 h-5 text-[#FFB81C]" />}
        />
        <MetricCard
          title="Churn Rate"
          value={`${data.churnRate.toFixed(2)}%`}
          subtitle="Monthly"
          icon={<TrendingDown className="w-5 h-5 text-[#FFB81C]" />}
        />
        <MetricCard
          title="LTV"
          value={`$${data.ltv.toFixed(0)}`}
          subtitle="Avg lifetime value"
          icon={<Users className="w-5 h-5 text-[#FFB81C]" />}
        />
        <MetricCard
          title="ARPU"
          value={`$${data.arpu.toFixed(2)}`}
          subtitle="Per active user"
          icon={<DollarSign className="w-5 h-5 text-[#FFB81C]" />}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* MRR Trend */}
        <div className="xl:col-span-2 bg-[#0D1231] border border-[#1E2451] rounded-xl p-6">
          <h2 className="text-sm font-semibold text-[#6B7280] uppercase tracking-wider mb-6">
            MRR Trend
          </h2>
          <div className="h-48 flex items-end gap-1">
            {data.mrrTrend.map((point, i) => {
              const maxMrr = Math.max(...data.mrrTrend.map((p) => p.mrrCents))
              const height = maxMrr > 0 ? (point.mrrCents / maxMrr) * 100 : 0
              return (
                <div
                  key={i}
                  className="flex-1 group relative"
                  style={{ height: '100%', display: 'flex', alignItems: 'flex-end' }}
                >
                  <div
                    className="w-full bg-[#FFB81C]/20 hover:bg-[#FFB81C]/40 rounded-t transition-colors cursor-pointer"
                    style={{ height: `${Math.max(height, 2)}%` }}
                    title={`${point.date}: $${(point.mrrCents / 100).toFixed(0)}`}
                  />
                </div>
              )
            })}
          </div>
          <div className="flex justify-between mt-2 text-xs text-[#6B7280]">
            <span>{data.mrrTrend[0]?.date}</span>
            <span>{data.mrrTrend[data.mrrTrend.length - 1]?.date}</span>
          </div>
        </div>

        {/* Conversion Funnel */}
        <div className="bg-[#0D1231] border border-[#1E2451] rounded-xl p-6">
          <h2 className="text-sm font-semibold text-[#6B7280] uppercase tracking-wider mb-6">
            Conversion Funnel
          </h2>
          <div className="space-y-4">
            <FunnelBar
              label="Visits"
              count={data.funnel.visits}
              total={funnelTotal}
              color="#FFB81C"
            />
            <FunnelBar
              label="Sign Ups"
              count={data.funnel.signups}
              total={funnelTotal}
              color="#E6A519"
            />
            <FunnelBar
              label="Activated"
              count={data.funnel.activated}
              total={funnelTotal}
              color="#c88d15"
            />
            <FunnelBar
              label="Paying"
              count={data.funnel.paying}
              total={funnelTotal}
              color="#a87210"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Top Templates */}
        <div className="bg-[#0D1231] border border-[#1E2451] rounded-xl p-6">
          <h2 className="text-sm font-semibold text-[#6B7280] uppercase tracking-wider mb-4">
            Top Templates by Revenue
          </h2>
          <div className="space-y-3">
            {data.topTemplates.length === 0 ? (
              <p className="text-[#6B7280] text-sm">No template revenue data</p>
            ) : (
              data.topTemplates.map((template, i) => (
                <div key={template.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#6B7280] w-4">{i + 1}</span>
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
              ))
            )}
          </div>
        </div>

        {/* Cohort Retention */}
        <div className="bg-[#0D1231] border border-[#1E2451] rounded-xl p-6">
          <h2 className="text-sm font-semibold text-[#6B7280] uppercase tracking-wider mb-4">
            Cohort Retention
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-[#6B7280] border-b border-[#1E2451]">
                  <th className="pb-2 text-left">Cohort</th>
                  <th className="pb-2 text-right">Wk 1</th>
                  <th className="pb-2 text-right">Wk 2</th>
                  <th className="pb-2 text-right">Wk 4</th>
                  <th className="pb-2 text-right">Wk 8</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2451]">
                {data.cohortRetention.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-[#6B7280]">
                      No cohort data
                    </td>
                  </tr>
                ) : (
                  data.cohortRetention.map((row) => (
                    <tr key={row.cohort}>
                      <td className="py-2 text-[#6B7280]">{row.cohort}</td>
                      {[row.week1, row.week2, row.week4, row.week8].map((pct, i) => (
                        <td
                          key={i}
                          className="py-2 text-right font-medium"
                          style={{
                            color: `rgba(255,184,28,${0.4 + (pct / 100) * 0.6})`,
                          }}
                        >
                          {pct.toFixed(0)}%
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

      {/* API Cost vs Revenue */}
      <div className="bg-[#0D1231] border border-[#1E2451] rounded-xl p-6">
        <h2 className="text-sm font-semibold text-[#6B7280] uppercase tracking-wider mb-6">
          API Cost vs Revenue Margin
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-[#6B7280] border-b border-[#1E2451]">
                <th className="pb-2 text-left">Date</th>
                <th className="pb-2 text-right">API Cost</th>
                <th className="pb-2 text-right">Revenue</th>
                <th className="pb-2 text-right">Margin</th>
                <th className="pb-2 text-right">Margin %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2451]">
              {data.costVsRevenue.slice(-14).map((row) => {
                const cost = row.costMicro / 1_000_000
                const revenue = row.revenueMicro / 1_000_000
                const margin = row.marginMicro / 1_000_000
                const marginPct = revenue > 0 ? (margin / revenue) * 100 : 0
                return (
                  <tr key={row.date}>
                    <td className="py-2 text-[#6B7280]">{row.date}</td>
                    <td className="py-2 text-right text-red-400">${cost.toFixed(2)}</td>
                    <td className="py-2 text-right text-green-400">${revenue.toFixed(2)}</td>
                    <td className="py-2 text-right text-white">${margin.toFixed(2)}</td>
                    <td
                      className={`py-2 text-right font-medium ${marginPct >= 60 ? 'text-green-400' : marginPct >= 30 ? 'text-[#FFB81C]' : 'text-red-400'}`}
                    >
                      {marginPct.toFixed(1)}%
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
