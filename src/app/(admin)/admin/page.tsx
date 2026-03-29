'use client'

import { useEffect, useState } from 'react'
import {
  Users,
  DollarSign,
  Layers,
  CreditCard,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react'
import { StatCard } from '@/components/admin/StatCard'
import { RevenueChart } from '@/components/admin/RevenueChart'
import { SignupsChart } from '@/components/admin/SignupsChart'
import { ActivityFeedAdmin } from '@/components/admin/ActivityFeedAdmin'
import { SystemHealth } from '@/components/admin/SystemHealth'

interface DashboardStats {
  totalUsers: number
  mrrCents: number
  totalBuilds: number
  activeSubscriptions: number
  revenueChart: { date: string; revenueCents: number }[]
  signupsChart: { date: string; count: number }[]
  recentActivity: {
    id: string
    action: string
    resource: string
    createdAt: string
    user?: { email: string }
  }[]
  health: {
    api: 'ok' | 'degraded' | 'down'
    db: 'ok' | 'degraded' | 'down'
    redis: 'ok' | 'degraded' | 'down'
    ai: 'ok' | 'degraded' | 'down'
  }
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`)
        return r.json()
      })
      .then((data) => setStats(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-[#FFB81C] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-red-400">Failed to load dashboard: {error}</p>
      </div>
    )
  }

  const mrrDisplay = (stats.mrrCents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  })

  return (
    <div className="space-y-8 p-6 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Overview</h1>
        <p className="text-[#6B7280] text-sm mt-1">RobloxForge platform health at a glance</p>
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

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-[#0D1231] border border-[#1E2451] rounded-xl p-6">
          <h2 className="text-sm font-semibold text-[#6B7280] uppercase tracking-wider mb-4">
            Revenue — Last 30 Days
          </h2>
          <RevenueChart data={stats.revenueChart} />
        </div>
        <div className="bg-[#0D1231] border border-[#1E2451] rounded-xl p-6">
          <h2 className="text-sm font-semibold text-[#6B7280] uppercase tracking-wider mb-4">
            New Signups — Last 30 Days
          </h2>
          <SignupsChart data={stats.signupsChart} />
        </div>
      </div>

      {/* Activity + Health */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-[#0D1231] border border-[#1E2451] rounded-xl p-6">
          <h2 className="text-sm font-semibold text-[#6B7280] uppercase tracking-wider mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#FFB81C]" />
            Recent Activity
          </h2>
          <ActivityFeedAdmin items={stats.recentActivity} />
        </div>
        <div className="bg-[#0D1231] border border-[#1E2451] rounded-xl p-6">
          <h2 className="text-sm font-semibold text-[#6B7280] uppercase tracking-wider mb-4 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-[#FFB81C]" />
            System Health
          </h2>
          <SystemHealth health={stats.health} />
        </div>
      </div>
    </div>
  )
}
