'use client'

import { useState } from 'react'
import useSWR from 'swr'
import {
  Building2,
  Users,
  BarChart3,
  Zap,
  TrendingUp,
  DollarSign,
  FolderOpen,
  Plus,
  Mail,
  Shield,
  Crown,
  Code2,
  Eye,
  MoreHorizontal,
  CheckCircle2,
  Clock,
  Layers,
  ArrowUpRight,
  ChevronRight,
  Paintbrush,
  Globe,
  Activity,
} from 'lucide-react'
import type { BusinessAnalytics } from '@/app/api/business/analytics/route'
import type { TeamData, TeamRole } from '@/app/api/business/team/route'
import type { BusinessProfile } from '@/app/api/business/connect/route'

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'team' | 'analytics' | 'white-label'

// ─── Fetcher ──────────────────────────────────────────────────────────────────

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    return r.json()
  })

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (cents: number) =>
  `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const fmtK = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(0)}K` : String(n)

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60)  return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24)  return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

// ─── Role badge ───────────────────────────────────────────────────────────────

const ROLE_META: Record<TeamRole, { label: string; color: string; Icon: typeof Crown }> = {
  OWNER:     { label: 'Owner',     color: 'text-[#D4AF37] bg-[#D4AF37]/10 border-[#D4AF37]/20', Icon: Crown   },
  ADMIN:     { label: 'Admin',     color: 'text-blue-400   bg-blue-400/10   border-blue-400/20',  Icon: Shield  },
  DEVELOPER: { label: 'Developer', color: 'text-green-400  bg-green-400/10  border-green-400/20', Icon: Code2   },
  VIEWER:    { label: 'Viewer',    color: 'text-gray-400   bg-white/5       border-white/10',     Icon: Eye     },
}

function RoleBadge({ role }: { role: TeamRole }) {
  const { label, color, Icon } = ROLE_META[role]
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${color}`}>
      <Icon size={10} />
      {label}
    </span>
  )
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ACTIVE:    'text-green-400 bg-green-400/10 border-green-400/20',
    INVITED:   'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    SUSPENDED: 'text-red-400 bg-red-400/10 border-red-400/20',
    VERIFIED:  'text-green-400 bg-green-400/10 border-green-400/20',
    PENDING:   'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    REJECTED:  'text-red-400 bg-red-400/10 border-red-400/20',
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${styles[status] ?? styles.PENDING}`}>
      {status === 'ACTIVE' || status === 'VERIFIED' ? <CheckCircle2 size={10} /> : <Clock size={10} />}
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  )
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
  const sz = size === 'sm' ? 'w-7 h-7 text-xs' : size === 'lg' ? 'w-12 h-12 text-base' : 'w-9 h-9 text-sm'
  return (
    <div
      className={`${sz} rounded-full flex items-center justify-center font-bold text-[#0a0a0a] flex-shrink-0`}
      style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #F5D878 50%, #B8962E 100%)' }}
    >
      {initials}
    </div>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: typeof DollarSign
  label: string
  value: string
  sub?: string
  accent?: boolean
}) {
  return (
    <div className="bg-[#111111] border border-white/8 rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{label}</span>
        <div
          className={`w-8 h-8 rounded-xl flex items-center justify-center ${accent ? 'bg-[#D4AF37]/15' : 'bg-white/8'}`}
        >
          <Icon size={16} className={accent ? 'text-[#D4AF37]' : 'text-gray-400'} />
        </div>
      </div>
      <div>
        <p className={`text-2xl font-bold ${accent ? 'text-[#D4AF37]' : 'text-white'}`}>{value}</p>
        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ─── Quick action ─────────────────────────────────────────────────────────────

function QuickAction({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Plus
  label: string
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-white/4 hover:bg-white/8 border border-white/6 hover:border-[#D4AF37]/30 text-sm text-gray-300 hover:text-white transition-all group"
    >
      <div className="w-7 h-7 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center group-hover:bg-[#D4AF37]/20 transition-colors">
        <Icon size={14} className="text-[#D4AF37]" />
      </div>
      {label}
      <ChevronRight size={14} className="ml-auto text-gray-600 group-hover:text-gray-400 transition-colors" />
    </button>
  )
}

// ─── Activity item ────────────────────────────────────────────────────────────

const ACT_ICONS: Record<string, typeof Activity> = {
  sale:            DollarSign,
  project_shipped: Layers,
  member_joined:   Users,
  token_refill:    Zap,
  milestone:       TrendingUp,
}

function ActivityItem({
  type,
  message,
  timestamp,
  valueCents,
}: {
  type: string
  message: string
  timestamp: string
  valueCents?: number
}) {
  const Icon = ACT_ICONS[type] ?? Activity
  return (
    <div className="flex items-start gap-3 py-3 border-b border-white/5 last:border-0">
      <div className="w-7 h-7 rounded-lg bg-white/6 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon size={13} className="text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-200 leading-snug">{message}</p>
        <p className="text-xs text-gray-500 mt-0.5">{timeAgo(timestamp)}</p>
      </div>
      {valueCents !== undefined && (
        <span className="text-xs font-semibold text-green-400 flex-shrink-0">{fmt(valueCents)}</span>
      )}
    </div>
  )
}

// ─── Token bar ────────────────────────────────────────────────────────────────

function TokenBar({
  used,
  total,
  label,
}: {
  used: number
  total: number
  label: string
}) {
  const pct = Math.min(100, Math.round((used / total) * 100))
  const color = pct >= 90 ? 'bg-red-500' : pct >= 75 ? 'bg-yellow-500' : 'bg-[#D4AF37]'
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-gray-400">
        <span>{label}</span>
        <span>{fmtK(used)} / {fmtK(total)}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

// ─── Overview tab ─────────────────────────────────────────────────────────────

function OverviewTab({
  business,
  team,
  analytics,
  onTabChange,
}: {
  business: BusinessProfile
  team: TeamData
  analytics: BusinessAnalytics
  onTabChange: (t: Tab) => void
}) {
  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          label="Revenue MTD"
          value={fmt(analytics.revenue.total)}
          sub="vs $1,980 last month"
          accent
        />
        <StatCard
          icon={Users}
          label="Team Size"
          value={String(team.members.length)}
          sub={`${team.seats.used} / ${team.seats.max} seats`}
        />
        <StatCard
          icon={FolderOpen}
          label="Active Projects"
          value={String(analytics.projects.active)}
          sub={`${analytics.projects.total} total`}
        />
        <StatCard
          icon={Zap}
          label="Tokens Used"
          value={fmtK(analytics.tokens.totalUsedThisMonth)}
          sub="this month"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Business profile card */}
        <div className="bg-[#111111] border border-white/8 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Business Profile</h3>
            <StatusBadge status={business.verificationStatus} />
          </div>
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #B8962E 100%)' }}
            >
              <Building2 size={22} className="text-[#0a0a0a]" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">{business.name}</p>
              <p className="text-xs text-gray-400">{business.type} &middot; {business.website ?? 'No website'}</p>
            </div>
          </div>
          <div className="space-y-2 text-xs text-gray-400">
            <div className="flex justify-between">
              <span>Stripe Connect</span>
              <span className={business.stripeConnectEnabled ? 'text-green-400' : 'text-yellow-400'}>
                {business.stripeConnectEnabled ? 'Connected' : 'Not connected'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>API Key</span>
              <span className="text-gray-300 font-mono">{business.apiKeyPrefix}••••</span>
            </div>
          </div>
        </div>

        {/* Team snapshot */}
        <div className="bg-[#111111] border border-white/8 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Team</h3>
            <button
              onClick={() => onTabChange('team')}
              className="text-xs text-[#D4AF37] hover:text-[#F5D878] transition-colors flex items-center gap-1"
            >
              Manage <ArrowUpRight size={11} />
            </button>
          </div>
          <div className="space-y-3">
            {team.members.map((m) => (
              <div key={m.id} className="flex items-center gap-2.5">
                <Avatar name={m.displayName} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">{m.displayName}</p>
                  <p className="text-xs text-gray-500 truncate">{m.email}</p>
                </div>
                <RoleBadge role={m.role} />
              </div>
            ))}
          </div>
          <TokenBar
            used={analytics.tokens.totalUsedThisMonth}
            total={team.tokenPool.totalMonthly}
            label="Shared pool"
          />
        </div>

        {/* Quick actions */}
        <div className="bg-[#111111] border border-white/8 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-white">Quick Actions</h3>
          <div className="space-y-2">
            <QuickAction icon={Mail}        label="Invite team member"     onClick={() => onTabChange('team')}       />
            <QuickAction icon={FolderOpen}  label="Create new project"     onClick={() => window.location.href = '/editor?new=1'} />
            <QuickAction icon={BarChart3}   label="View analytics"         onClick={() => onTabChange('analytics')}  />
            <QuickAction icon={Paintbrush}  label="Configure white-label"  onClick={() => onTabChange('white-label')}/>
            <QuickAction icon={Globe}       label="Set up custom domain"   onClick={() => onTabChange('white-label')}/>
          </div>
        </div>
      </div>

      {/* Activity feed */}
      <div className="bg-[#111111] border border-white/8 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Recent Activity</h3>
        <div>
          {analytics.activityFeed.map((item) => (
            <ActivityItem key={item.id} {...item} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Team tab ─────────────────────────────────────────────────────────────────

function TeamTab({ team }: { team: TeamData }) {
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<TeamRole>('DEVELOPER')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null)
  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const handleRemoveMember = async (memberId: string) => {
    setRemovingId(memberId)
    try {
      const res = await fetch('/api/business/team', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string }
        setInviteError(data.error ?? 'Failed to remove member')
      }
    } catch {
      setInviteError('Network error — please try again.')
    } finally {
      setRemovingId(null)
      setMenuOpenFor(null)
    }
  }

  const handleInvite = async () => {
    if (!inviteEmail.includes('@')) {
      setInviteError('Enter a valid email address.')
      return
    }
    setInviting(true)
    setInviteError(null)
    try {
      const res = await fetch('/api/business/team', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: inviteEmail, role: inviteRole }),
      })
      const data = await res.json().catch(() => ({})) as { error?: string; demo?: boolean }
      if (!res.ok && !data.demo) {
        setInviteError(data.error ?? `Failed to send invite (${res.status})`)
        return
      }
      setInviteSuccess(`Invite sent to ${inviteEmail}`)
      setShowInvite(false)
      setInviteEmail('')
      setTimeout(() => setInviteSuccess(null), 4000)
    } catch {
      setInviteError('Network error — please try again.')
    } finally {
      setInviting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">{team.seats.used} of {team.seats.max} seats used</p>
        </div>
        <button
          onClick={() => { setShowInvite(true); setInviteError(null) }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-[#0a0a0a] transition-all hover:brightness-110"
          style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #F5D878 50%, #B8962E 100%)' }}
        >
          <Plus size={15} />
          Invite Member
        </button>
      </div>

      {/* Invite success toast */}
      {inviteSuccess && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 text-green-400 text-sm">
          {inviteSuccess}
        </div>
      )}

      {/* Invite panel */}
      {showInvite && (
        <div className="bg-[#141414] border border-[#D4AF37]/20 rounded-2xl p-5 space-y-4">
          <h4 className="text-sm font-semibold text-white">Invite a team member</h4>
          <div className="flex gap-3">
            <input
              type="email"
              placeholder="email@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37]/40"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as TeamRole)}
              className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]/40"
            >
              {(['ADMIN', 'DEVELOPER', 'VIEWER'] as TeamRole[]).map((r) => (
                <option key={r} value={r}>{ROLE_META[r].label}</option>
              ))}
            </select>
          </div>
          {inviteError && (
            <p className="text-red-400 text-xs">{inviteError}</p>
          )}
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => { setShowInvite(false); setInviteError(null) }}
              className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleInvite}
              disabled={inviting}
              className="px-4 py-2 rounded-xl text-sm font-bold text-[#0a0a0a] disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #F5D878 50%, #B8962E 100%)' }}
            >
              {inviting ? 'Sending...' : 'Send Invite'}
            </button>
          </div>
        </div>
      )}

      {/* Member list */}
      <div className="bg-[#111111] border border-white/8 rounded-2xl overflow-hidden">
        <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-3 border-b border-white/6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <span>Member</span>
          <span>Role</span>
          <span>Projects</span>
          <span>Tokens MTD</span>
          <span>Status</span>
        </div>
        {team.members.map((member, i) => (
          <div
            key={member.id}
            className={`flex flex-col sm:grid sm:grid-cols-[1fr_auto_auto_auto_auto] gap-3 sm:gap-4 px-5 py-4 ${i < team.members.length - 1 ? 'border-b border-white/5' : ''} hover:bg-white/2 transition-colors`}
          >
            {/* Name / email */}
            <div className="flex items-center gap-3">
              <Avatar name={member.displayName} />
              <div>
                <p className="text-sm font-medium text-white">{member.displayName}</p>
                <p className="text-xs text-gray-500">{member.email}</p>
              </div>
            </div>

            <div className="flex items-center"><RoleBadge role={member.role} /></div>

            <div className="flex items-center">
              <span className="text-sm text-gray-300">{member.projectsCount}</span>
            </div>

            <div className="flex items-center">
              <div className="space-y-1 w-28">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>{fmtK(member.tokensUsedThisMonth)}</span>
                  {member.tokensAllotment && <span className="text-gray-600">{fmtK(member.tokensAllotment)}</span>}
                </div>
                {member.tokensAllotment && (
                  <div className="h-1 rounded-full bg-white/8 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#D4AF37]"
                      style={{ width: `${Math.min(100, (member.tokensUsedThisMonth / member.tokensAllotment) * 100)}%` }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-start gap-2 relative">
              <StatusBadge status={member.status} />
              {member.role !== 'OWNER' && (
                <>
                  <button
                    onClick={() => setMenuOpenFor(menuOpenFor === member.id ? null : member.id)}
                    className="p-1.5 rounded-lg hover:bg-white/8 transition-colors text-gray-500 hover:text-white"
                    aria-label={`More options for ${member.displayName ?? 'member'}`}
                  >
                    <MoreHorizontal size={14} aria-hidden="true" />
                  </button>
                  {menuOpenFor === member.id && (
                    <div
                      className="absolute right-0 top-full mt-1 z-20 bg-[#141414] border border-white/10 rounded-xl shadow-xl overflow-hidden min-w-[140px]"
                      onMouseLeave={() => setMenuOpenFor(null)}
                    >
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        disabled={removingId === member.id}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                      >
                        {removingId === member.id ? 'Removing...' : 'Remove Member'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Token pool summary */}
      <div className="bg-[#111111] border border-white/8 rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-white">Shared Token Pool</h3>
        <TokenBar
          used={team.tokenPool.usedThisMonth}
          total={team.tokenPool.totalMonthly}
          label={`${fmtK(team.tokenPool.remaining)} remaining — resets ${new Date(team.tokenPool.resetAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
        />
      </div>
    </div>
  )
}

// ─── Analytics tab ────────────────────────────────────────────────────────────

function AnalyticsTab({ analytics }: { analytics: BusinessAnalytics }) {
  const maxRevenue = Math.max(...analytics.growthChart.map((p) => p.projected))

  return (
    <div className="space-y-6">
      {/* Revenue cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign}  label="Total Revenue MTD"   value={fmt(analytics.revenue.total)}              accent />
        <StatCard icon={BarChart3}   label="Marketplace Sales"   value={fmt(analytics.revenue.marketplaceSales)}   />
        <StatCard icon={Zap}         label="Subscriptions"       value={fmt(analytics.revenue.subscriptions)}      />
        <StatCard icon={TrendingUp}  label="ROI Multiplier"      value={`${analytics.roi.roiMultiplier}x`}         sub="tokens → revenue" />
      </div>

      {/* Growth chart */}
      <div className="bg-[#111111] border border-white/8 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white mb-6">Revenue Growth</h3>
        <div className="flex items-end gap-2 h-36">
          {analytics.growthChart.map((p) => {
            const h = Math.round(((p.actual ?? p.projected) / maxRevenue) * 100)
            const isFuture = p.actual === null
            return (
              <div key={p.period} className="flex-1 flex flex-col items-center gap-1.5 group">
                <span className="text-xs text-gray-600 group-hover:text-gray-400 transition-colors opacity-0 group-hover:opacity-100">
                  {fmt(p.actual ?? p.projected)}
                </span>
                <div
                  className={`w-full rounded-t-md transition-all ${isFuture ? 'bg-[#D4AF37]/25 border border-dashed border-[#D4AF37]/30' : 'bg-[#D4AF37]'}`}
                  style={{ height: `${h}%` }}
                />
                <span className="text-xs text-gray-500">{p.period}</span>
              </div>
            )
          })}
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
          <div className="flex items-center gap-1.5"><div className="w-3 h-2 rounded-sm bg-[#D4AF37]" />Actual</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-2 rounded-sm bg-[#D4AF37]/25 border border-dashed border-[#D4AF37]/30" />Projected</div>
        </div>
      </div>

      {/* Token usage by member */}
      <div className="bg-[#111111] border border-white/8 rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-white">Token Usage by Member</h3>
        {analytics.tokens.usedByMember.map((m) => (
          <div key={m.memberId} className="flex items-center gap-3">
            <Avatar name={m.displayName} size="sm" />
            <div className="flex-1 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-300">{m.displayName}</span>
                <span className="text-gray-500">{fmtK(m.used)} tokens · {m.percentage}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                <div className="h-full rounded-full bg-[#D4AF37]" style={{ width: `${m.percentage}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Top projects */}
      <div className="bg-[#111111] border border-white/8 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Top Projects by Token Usage</h3>
        <div className="space-y-3">
          {analytics.projects.topProjects.map((p, i) => {
            const max = analytics.projects.topProjects[0].tokensUsed
            return (
              <div key={p.id} className="flex items-center gap-3">
                <span className="text-xs text-gray-600 w-4 text-right">{i + 1}</span>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-200 font-medium">{p.name}</span>
                    <span className="text-gray-500">{fmtK(p.tokensUsed)}</span>
                  </div>
                  <div className="h-1 rounded-full bg-white/8 overflow-hidden">
                    <div className="h-full rounded-full bg-[#D4AF37]/70" style={{ width: `${(p.tokensUsed / max) * 100}%` }} />
                  </div>
                </div>
                <span className={`text-xs px-1.5 py-0.5 rounded-md ${p.status === 'active' ? 'text-green-400 bg-green-400/10' : p.status === 'shipped' ? 'text-blue-400 bg-blue-400/10' : 'text-gray-500 bg-white/5'}`}>
                  {p.status}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── White-label tab ──────────────────────────────────────────────────────────

function WhiteLabelTab() {
  const [primaryColor, setPrimaryColor] = useState('#D4AF37')
  const [companyName, setCompanyName]   = useState('Dawsen Porter LLC')
  const [domain, setDomain]             = useState('')
  const [saving, setSaving]             = useState(false)
  const [saved, setSaved]               = useState(false)

  const save = async () => {
    setSaving(true)
    await fetch('/api/business/white-label', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ primaryColor, companyName }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const verifyDomain = async () => {
    if (!domain) return
    await fetch('/api/business/white-label', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ domain }),
    })
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Branding */}
      <div className="bg-[#111111] border border-white/8 rounded-2xl p-5 space-y-5">
        <h3 className="text-sm font-semibold text-white">Branding</h3>

        <div className="space-y-3">
          <label className="block">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Company Name</span>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37]/40"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Primary Color</span>
            <div className="mt-2 flex items-center gap-3">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-10 h-10 rounded-lg border border-white/10 bg-transparent cursor-pointer"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-[#D4AF37]/40"
              />
            </div>
          </label>
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-[#0a0a0a] disabled:opacity-70 transition-all hover:brightness-110"
          style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #F5D878 50%, #B8962E 100%)' }}
        >
          {saving ? 'Saving...' : saved ? <><CheckCircle2 size={14} /> Saved</> : 'Save Branding'}
        </button>
      </div>

      {/* Custom domain */}
      <div className="bg-[#111111] border border-white/8 rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-white">Custom Domain</h3>
        <p className="text-xs text-gray-400">Point your domain to ForjeGames and serve your branded agent dashboard.</p>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="studio.yourcompany.com"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37]/40"
          />
          <button
            onClick={verifyDomain}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-white/8 hover:bg-white/12 border border-white/10 transition-colors whitespace-nowrap"
          >
            Verify DNS
          </button>
        </div>
      </div>

      {/* API rate limits info */}
      <div className="bg-[#111111] border border-white/8 rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-semibold text-white">Business API Limits</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Per Minute',   value: '120 req' },
            { label: 'Per Hour',     value: '2,000 req' },
            { label: 'Per Day',      value: '20,000 req' },
            { label: 'Tokens / Mo',  value: '2,000K' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white/4 rounded-xl p-3">
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-sm font-semibold text-white mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BusinessPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  const { data: bizData }       = useSWR<{ business: BusinessProfile; demo: boolean }>('/api/business/connect', fetcher)
  const { data: teamData }      = useSWR<TeamData & { demo: boolean }>('/api/business/team', fetcher)
  const { data: analyticsData } = useSWR<{ analytics: BusinessAnalytics; demo: boolean }>('/api/business/analytics', fetcher)

  const business  = bizData?.business  ?? null
  const team      = teamData           ?? null
  const analytics = analyticsData?.analytics ?? null

  const loading = !business || !team || !analytics

  const TABS: { id: Tab; label: string; Icon: typeof Building2 }[] = [
    { id: 'overview',     label: 'Overview',     Icon: Building2  },
    { id: 'team',         label: 'Team',         Icon: Users      },
    { id: 'analytics',    label: 'Analytics',    Icon: BarChart3  },
    { id: 'white-label',  label: 'White-Label',  Icon: Paintbrush },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 pt-2">
      {/* Page header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#D4AF37]/70 uppercase tracking-widest">Business</span>
          <span className="w-1 h-1 rounded-full bg-white/20" />
          <span className="text-xs text-gray-400">LLC &amp; Team Management</span>
        </div>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
              <span className="text-[#D4AF37] drop-shadow-[0_0_20px_rgba(212,175,55,0.4)]">Business</span>{' '}
              Hub
            </h1>
            <p className="text-gray-300 text-sm mt-1.5 max-w-xl leading-relaxed">
              Manage your LLC, team members, revenue analytics, and white-label configuration.
            </p>
          </div>
          {bizData?.demo && (
            <span className="text-xs px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 font-medium flex-shrink-0">
              Demo Mode
            </span>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-[#111111] border border-white/8 rounded-2xl p-1 w-fit">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === id
                ? 'bg-[#D4AF37] text-[#0a0a0a] font-bold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Icon size={15} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-white/4 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {activeTab === 'overview'    && <OverviewTab    business={business!}  team={team!}  analytics={analytics!} onTabChange={setActiveTab} />}
          {activeTab === 'team'        && <TeamTab        team={team!} />}
          {activeTab === 'analytics'   && <AnalyticsTab   analytics={analytics!} />}
          {activeTab === 'white-label' && <WhiteLabelTab />}
        </>
      )}
    </div>
  )
}
