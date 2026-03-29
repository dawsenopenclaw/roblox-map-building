'use client'

import React, { useEffect, useState } from 'react'
import { Users, DollarSign, Layers, CreditCard, Activity } from 'lucide-react'

interface DashboardStats {
  totalUsers: number
  mrrCents: number
  totalBuilds: number
  activeSubscriptions: number
  revenueChart: { date: string; revenueCents: number }[]
  recentActivity: {
    id: string
    action: string
    resource: string
    createdAt: string
    user?: { email: string }
  }[]
}

const DEMO_STATS: DashboardStats = {
  totalUsers: 1284,
  mrrCents: 489500,
  totalBuilds: 9731,
  activeSubscriptions: 312,
  revenueChart: [
    { date: '2026-02-27', revenueCents: 38000 },
    { date: '2026-02-28', revenueCents: 42000 },
    { date: '2026-03-01', revenueCents: 35000 },
    { date: '2026-03-02', revenueCents: 51000 },
    { date: '2026-03-03', revenueCents: 46000 },
    { date: '2026-03-04', revenueCents: 39000 },
    { date: '2026-03-05', revenueCents: 55000 },
    { date: '2026-03-06', revenueCents: 60000 },
    { date: '2026-03-07', revenueCents: 48000 },
    { date: '2026-03-08', revenueCents: 52000 },
    { date: '2026-03-09', revenueCents: 58000 },
    { date: '2026-03-10', revenueCents: 44000 },
    { date: '2026-03-11', revenueCents: 62000 },
    { date: '2026-03-12', revenueCents: 57000 },
    { date: '2026-03-13', revenueCents: 71000 },
    { date: '2026-03-14', revenueCents: 65000 },
    { date: '2026-03-15', revenueCents: 49500 },
  ],
  recentActivity: [
    { id: '1', action: 'POST /api/templates', resource: 'template', createdAt: new Date(Date.now() - 3 * 60000).toISOString(), user: { email: 'alice@example.com' } },
    { id: '2', action: 'PUT /api/users/123', resource: 'user', createdAt: new Date(Date.now() - 12 * 60000).toISOString(), user: { email: 'bob@example.com' } },
    { id: '3', action: 'DELETE /api/builds/456', resource: 'build', createdAt: new Date(Date.now() - 35 * 60000).toISOString(), user: { email: 'carol@example.com' } },
    { id: '4', action: 'POST /api/subscriptions', resource: 'subscription', createdAt: new Date(Date.now() - 2 * 3600000).toISOString(), user: { email: 'dave@example.com' } },
    { id: '5', action: 'GET /api/templates', resource: 'template', createdAt: new Date(Date.now() - 4 * 3600000).toISOString(), user: { email: 'eve@example.com' } },
  ],
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const METHOD_COLORS: Record<string, string> = {
  POST: 'text-green-400',
  PUT: 'text-blue-400',
  PATCH: 'text-blue-400',
  DELETE: 'text-red-400',
  GET: 'text-[#6B7280]',
}

function StatCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-[#141414] border border-[#1c1c1c] rounded-xl p-5 flex items-start gap-4">
      <div className="w-10 h-10 bg-[#FFB81C]/10 rounded-lg flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-xs text-[#6B7280] uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold text-white mt-1">{value}</p>
      </div>
    </div>
  )
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<DashboardStats>(DEMO_STATS)
  const [isDemo, setIsDemo] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`)
        return r.json()
      })
      .then((data) => {
        setStats(data)
        setIsDemo(false)
      })
      .catch(() => {
        setStats(DEMO_STATS)
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

  const mrrDisplay = (stats.mrrCents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  })

  const maxRevenue = Math.max(...stats.revenueChart.map((d) => d.revenueCents), 1)

  return (
    <div className="space-y-8 p-6 max-w-[1600px] mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Overview</h1>
          <p className="text-[#6B7280] text-sm mt-1">Platform health at a glance</p>
        </div>
        {isDemo && (
          <span className="text-xs px-2 py-1 bg-[#FFB81C]/10 text-[#FFB81C] border border-[#FFB81C]/20 rounded-full">
            Demo data — DB unavailable
          </span>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          icon={<Users className="w-5 h-5 text-[#FFB81C]" />}
        />
        <StatCard
          title="MRR"
          value={mrrDisplay}
          icon={<DollarSign className="w-5 h-5 text-[#FFB81C]" />}
        />
        <StatCard
          title="Total Builds"
          value={stats.totalBuilds.toLocaleString()}
          icon={<Layers className="w-5 h-5 text-[#FFB81C]" />}
        />
        <StatCard
          title="Active Subscriptions"
          value={stats.activeSubscriptions.toLocaleString()}
          icon={<CreditCard className="w-5 h-5 text-[#FFB81C]" />}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className="xl:col-span-2 bg-[#141414] border border-[#1c1c1c] rounded-xl p-6">
          <h2 className="text-sm font-semibold text-[#6B7280] uppercase tracking-wider mb-1">
            Revenue — Last 30 Days
          </h2>
          <p className="text-xs text-[#6B7280] mb-4">
            Total:{' '}
            <span className="text-[#FFB81C] font-semibold">
              ${(stats.revenueChart.reduce((s, d) => s + d.revenueCents, 0) / 100).toLocaleString()}
            </span>
          </p>
          <div className="flex items-end gap-1 h-40">
            {stats.revenueChart.map((point, i) => {
              const height = (point.revenueCents / maxRevenue) * 100
              return (
                <div
                  key={i}
                  className="flex-1"
                  style={{ height: '100%', display: 'flex', alignItems: 'flex-end' }}
                >
                  <div
                    title={`${point.date}: $${(point.revenueCents / 100).toFixed(0)}`}
                    className="w-full rounded-t bg-[#FFB81C]/25 hover:bg-[#FFB81C]/50 transition-colors cursor-pointer"
                    style={{ height: `${Math.max(height, 2)}%` }}
                  />
                </div>
              )
            })}
          </div>
          <div className="flex justify-between mt-2 text-xs text-[#6B7280]">
            <span>{stats.revenueChart[0]?.date?.slice(5)}</span>
            <span>{stats.revenueChart[stats.revenueChart.length - 1]?.date?.slice(5)}</span>
          </div>
        </div>

        {/* Recent activity */}
        <div className="bg-[#141414] border border-[#1c1c1c] rounded-xl p-6">
          <h2 className="text-sm font-semibold text-[#6B7280] uppercase tracking-wider mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#FFB81C]" />
            Recent Activity
          </h2>
          {stats.recentActivity.length === 0 ? (
            <p className="text-[#6B7280] text-sm py-4">No recent activity</p>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {stats.recentActivity.map((item) => {
                const method = item.action.split(' ')[0]
                const path = item.action.split(' ').slice(1).join(' ')
                return (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 py-2 border-b border-[#1c1c1c] last:border-0"
                  >
                    <span
                      className={`text-xs font-mono font-bold w-12 flex-shrink-0 ${METHOD_COLORS[method] ?? 'text-[#6B7280]'}`}
                    >
                      {method}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-mono truncate">{path}</p>
                      {item.user && (
                        <p className="text-xs text-[#6B7280] truncate">{item.user.email}</p>
                      )}
                    </div>
                    <span className="text-xs text-[#6B7280] flex-shrink-0">
                      {timeAgo(item.createdAt)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
