'use client'

import React, { useEffect, useState, useCallback } from 'react'
import {
  Server,
  Database,
  Wifi,
  WifiOff,
  Cpu,
  Clock,
  Users,
  Search,
  CreditCard,
  Plus,
  Minus,
  Youtube,
  Mail,
  Send,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  Zap,
  Activity,
  Hash,
  UserPlus,
  Copy,
} from 'lucide-react'

// ═══════════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════════

interface ServerStatus {
  database: { connected: boolean; latencyMs?: number; error?: string }
  redis: { connected: boolean; latencyMs?: number; error?: string }
  aiProviders: Record<string, { configured: boolean }>
  memory: { rssMb: number; heapUsedMb: number; heapTotalBytes: number; rssBytes: number }
  uptimeSeconds: number
  activeConnections: number
  totalUsers: number
  totalBuilds: number
  responseTimeMs: number
}

interface Session {
  userId: string
  username: string | null
  displayName: string | null
  email: string
  avatarUrl: string | null
  lastActivity: string
  lastAction: string
  lastResource: string
  aiMode: string | null
  activityCount: number
  firstSeen: string
}

interface SearchUser {
  id: string
  clerkId: string
  email: string
  username: string | null
  displayName: string | null
  avatarUrl: string | null
  role: string
  createdAt: string
  deletedAt: string | null
  robloxUsername: string | null
  subscription: { tier: string; status: string; currentPeriodEnd: string | null } | null
  tokenBalance: { balance: number; lifetimeEarned: number; lifetimeSpent: number } | null
  _count: { builds: number; referralsMade: number }
}

interface Creator {
  id: string
  email: string
  username: string | null
  displayName: string | null
  referralCode: string
  role: string
  tier: string
  joinedAt: string
  totalReferrals: number
  convertedReferrals: number
  totalCommissionCents: number
  totalEarnedCents: number
  pendingBalanceCents: number
  chargesEnabled: boolean
  lastPayoutAt: string | null
}

interface NewsletterSub {
  email: string
  source: string
  joinedAt: string
}

// ═══════════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════════

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const parts: string[] = []
  if (d > 0) parts.push(`${d}d`)
  if (h > 0) parts.push(`${h}h`)
  if (m > 0) parts.push(`${m}m`)
  parts.push(`${s}s`)
  return parts.join(' ')
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const secs = Math.floor(diff / 1000)
  if (secs < 60) return 'just now'
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function cents(amount: number): string {
  return (amount / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  })
}

const TIER_COLORS: Record<string, string> = {
  FREE: 'bg-[#1c1c1c] text-[#B0B0B0]',
  HOBBY: 'bg-blue-900/40 text-blue-300',
  CREATOR: 'bg-purple-900/40 text-purple-300',
  STUDIO: 'bg-[#D4AF37]/10 text-[#D4AF37]',
}

// ═══════════════════════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════════════════════

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full ${ok ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]' : 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]'}`}
    />
  )
}

function SectionHeader({
  icon,
  title,
  action,
}: {
  icon: React.ReactNode
  title: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-[#B0B0B0] uppercase tracking-wider">
        {icon}
        {title}
      </h2>
      {action}
    </div>
  )
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[#141414] border border-[#1c1c1c] rounded-xl p-5 ${className}`}>
      {children}
    </div>
  )
}

function Badge({ text, color }: { text: string; color?: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${color ?? TIER_COLORS[text] ?? 'bg-[#1c1c1c] text-[#B0B0B0]'}`}
    >
      {text}
    </span>
  )
}

function Spinner() {
  return <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
}

// ═══════════════════════════════════════════════════════════════════════════════
// Tab Navigation
// ═══════════════════════════════════════════════════════════════════════════════

type TabId = 'status' | 'sessions' | 'users' | 'creators' | 'newsletter'

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'status', label: 'Server Status', icon: Server },
  { id: 'sessions', label: 'Active Sessions', icon: Activity },
  { id: 'users', label: 'User Management', icon: Users },
  { id: 'creators', label: 'Creator Program', icon: Youtube },
  { id: 'newsletter', label: 'Newsletter', icon: Mail },
]

// ═══════════════════════════════════════════════════════════════════════════════
// Server Status Panel
// ═══════════════════════════════════════════════════════════════════════════════

function ServerStatusPanel() {
  const [status, setStatus] = useState<ServerStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/server-status')
      if (!res.ok) throw new Error(`${res.status}`)
      setStatus(await res.json())
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 30000)
    return () => clearInterval(interval)
  }, [fetchStatus])

  if (loading && !status) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    )
  }

  if (error && !status) {
    return (
      <Card>
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">Failed to load server status: {error}</span>
        </div>
      </Card>
    )
  }

  if (!status) return null

  const providers = Object.entries(status.aiProviders)

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={<Server className="w-4 h-4 text-[#D4AF37]" />}
        title="Infrastructure"
        action={
          <button
            onClick={fetchStatus}
            disabled={loading}
            className="text-xs text-[#B0B0B0] hover:text-white flex items-center gap-1 transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        }
      />

      {/* Core services */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {/* Database */}
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#D4AF37]/10 rounded-lg flex items-center justify-center">
              <Database className="w-4 h-4 text-[#D4AF37]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <StatusDot ok={status.database.connected} />
                <span className="text-sm text-white font-medium">Database</span>
              </div>
              <p className="text-xs text-[#B0B0B0] mt-0.5">
                {status.database.connected
                  ? `${status.database.latencyMs}ms latency`
                  : status.database.error ?? 'Disconnected'}
              </p>
            </div>
          </div>
        </Card>

        {/* Redis */}
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#D4AF37]/10 rounded-lg flex items-center justify-center">
              {status.redis.connected ? (
                <Wifi className="w-4 h-4 text-[#D4AF37]" />
              ) : (
                <WifiOff className="w-4 h-4 text-[#B0B0B0]" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <StatusDot ok={status.redis.connected} />
                <span className="text-sm text-white font-medium">Redis / Upstash</span>
              </div>
              <p className="text-xs text-[#B0B0B0] mt-0.5">
                {status.redis.connected
                  ? `${status.redis.latencyMs}ms latency`
                  : status.redis.error ?? 'Not connected'}
              </p>
            </div>
          </div>
        </Card>

        {/* Memory */}
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#D4AF37]/10 rounded-lg flex items-center justify-center">
              <Cpu className="w-4 h-4 text-[#D4AF37]" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm text-white font-medium">Memory</span>
              <p className="text-xs text-[#B0B0B0] mt-0.5">
                RSS: {status.memory.rssMb}MB / Heap: {status.memory.heapUsedMb}MB
              </p>
            </div>
          </div>
        </Card>

        {/* Uptime */}
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#D4AF37]/10 rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4 text-[#D4AF37]" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm text-white font-medium">Uptime</span>
              <p className="text-xs text-[#B0B0B0] mt-0.5">
                {formatUptime(status.uptimeSeconds)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="text-center">
          <p className="text-2xl font-bold text-white">{status.activeConnections}</p>
          <p className="text-xs text-[#B0B0B0] mt-1">Active (15m)</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-white">{status.totalUsers.toLocaleString()}</p>
          <p className="text-xs text-[#B0B0B0] mt-1">Total Users</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-white">{status.totalBuilds.toLocaleString()}</p>
          <p className="text-xs text-[#B0B0B0] mt-1">Total Builds</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-white">{status.responseTimeMs}ms</p>
          <p className="text-xs text-[#B0B0B0] mt-1">API Response</p>
        </Card>
      </div>

      {/* AI Providers */}
      <Card>
        <SectionHeader
          icon={<Zap className="w-4 h-4 text-[#D4AF37]" />}
          title="AI Provider Status"
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {providers.map(([name, info]) => (
            <div
              key={name}
              className="flex items-center gap-2 px-3 py-2 bg-[#0a0a0a] rounded-lg border border-[#1c1c1c]"
            >
              {info.configured ? (
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-red-400/50 flex-shrink-0" />
              )}
              <span className="text-sm text-white capitalize">{name}</span>
              <span
                className={`ml-auto text-xs ${info.configured ? 'text-green-400' : 'text-[#B0B0B0]'}`}
              >
                {info.configured ? 'Ready' : 'No key'}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Active Sessions Monitor
// ═══════════════════════════════════════════════════════════════════════════════

function SessionsPanel() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSessions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/sessions')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setSessions(data.sessions ?? [])
    } catch {
      setSessions([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSessions()
    const interval = setInterval(fetchSessions, 15000)
    return () => clearInterval(interval)
  }, [fetchSessions])

  return (
    <div>
      <SectionHeader
        icon={<Activity className="w-4 h-4 text-[#D4AF37]" />}
        title={`Active Sessions (${sessions.length})`}
        action={
          <button
            onClick={fetchSessions}
            disabled={loading}
            className="text-xs text-[#B0B0B0] hover:text-white flex items-center gap-1 transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        }
      />

      {loading && sessions.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <Spinner />
        </div>
      ) : sessions.length === 0 ? (
        <Card>
          <p className="text-[#B0B0B0] text-sm text-center py-8">
            No active sessions in the last 15 minutes
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {sessions.map((session) => (
            <Card key={session.userId}>
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="w-10 h-10 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-full flex items-center justify-center text-sm font-bold text-[#D4AF37] flex-shrink-0">
                  {(session.displayName ?? session.username ?? session.email)[0]?.toUpperCase() ?? '?'}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white font-medium truncate">
                      {session.displayName ?? session.username ?? session.email}
                    </span>
                    {session.aiMode && (
                      <Badge text={session.aiMode} color="bg-purple-900/40 text-purple-300" />
                    )}
                  </div>
                  <p className="text-xs text-[#B0B0B0] truncate mt-0.5">
                    {session.email}
                  </p>
                </div>

                {/* Activity */}
                <div className="text-right flex-shrink-0 hidden sm:block">
                  <p className="text-xs text-white font-mono">
                    {session.lastAction} {session.lastResource}
                  </p>
                  <p className="text-xs text-[#B0B0B0] mt-0.5">
                    {session.activityCount} actions &middot; {timeAgo(session.lastActivity)}
                  </p>
                </div>

                {/* Duration */}
                <div className="text-right flex-shrink-0 hidden lg:block">
                  <p className="text-xs text-[#D4AF37]">
                    Session: {timeAgo(session.firstSeen).replace(' ago', '')}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// User Management
// ═══════════════════════════════════════════════════════════════════════════════

function UserManagementPanel() {
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState<SearchUser[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null)
  const [creditAction, setCreditAction] = useState<'grant' | 'deduct'>('grant')
  const [creditAmount, setCreditAmount] = useState('')
  const [creditReason, setCreditReason] = useState('')
  const [creditLoading, setCreditLoading] = useState(false)
  const [creditMsg, setCreditMsg] = useState<string | null>(null)
  const [transactions, setTransactions] = useState<
    { id: string; type: string; amount: number; description: string; createdAt: string }[]
  >([])
  const [txLoading, setTxLoading] = useState(false)

  const searchUsers = useCallback(
    async (q: string, p: number) => {
      if (!q.trim()) {
        setUsers([])
        setTotal(0)
        return
      }
      setLoading(true)
      try {
        const res = await fetch(
          `/api/admin/users/search?q=${encodeURIComponent(q)}&page=${p}&pageSize=20`
        )
        if (!res.ok) throw new Error()
        const data = await res.json()
        setUsers(data.users ?? [])
        setTotal(data.total ?? 0)
      } catch {
        setUsers([])
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    searchUsers(query, 1)
  }

  const selectUser = async (user: SearchUser) => {
    setSelectedUser(user)
    setCreditMsg(null)
    setTxLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${user.id}/credits`)
      if (res.ok) {
        const data = await res.json()
        setTransactions(data.transactions ?? [])
      }
    } catch {
      setTransactions([])
    } finally {
      setTxLoading(false)
    }
  }

  const handleCreditSubmit = async () => {
    if (!selectedUser || !creditAmount || !creditReason) return
    setCreditLoading(true)
    setCreditMsg(null)
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}/credits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: creditAction,
          amount: parseInt(creditAmount, 10),
          reason: creditReason,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setCreditMsg(`Success! New balance: ${data.newBalance?.toLocaleString()} tokens`)
      setCreditAmount('')
      setCreditReason('')
      // Refresh user in list
      searchUsers(query, page)
      selectUser(selectedUser)
    } catch (e) {
      setCreditMsg(e instanceof Error ? e.message : 'Error')
    } finally {
      setCreditLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={<Users className="w-4 h-4 text-[#D4AF37]" />}
        title="User Management"
      />

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B0B0B0]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by email, username, or Clerk ID..."
            className="w-full bg-[#141414] border border-[#1c1c1c] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#B0B0B0] focus:outline-none focus:border-[#D4AF37]/40"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2.5 bg-[#D4AF37] text-black text-sm font-medium rounded-lg hover:bg-[#c9a227] disabled:opacity-50 transition-colors"
        >
          {loading ? <Spinner /> : 'Search'}
        </button>
      </form>

      {/* Results */}
      {users.length > 0 && (
        <div>
          <p className="text-xs text-[#B0B0B0] mb-2">{total} result{total !== 1 ? 's' : ''}</p>
          <div className="space-y-2">
            {users.map((user) => (
              <Card
                key={user.id}
                className={`cursor-pointer hover:border-[#D4AF37]/30 transition-colors ${selectedUser?.id === user.id ? 'border-[#D4AF37]/50' : ''}`}
              >
                <button
                  onClick={() => selectUser(user)}
                  className="w-full text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[#D4AF37]/10 rounded-full flex items-center justify-center text-xs font-bold text-[#D4AF37] flex-shrink-0">
                      {(user.displayName ?? user.username ?? user.email)[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-white font-medium">
                          {user.displayName ?? user.username ?? user.email}
                        </span>
                        <Badge text={user.subscription?.tier ?? 'FREE'} />
                        <Badge text={user.role} color={user.role === 'ADMIN' ? 'bg-[#D4AF37]/10 text-[#D4AF37]' : undefined} />
                        {user.deletedAt && <Badge text="BANNED" color="bg-red-900/40 text-red-300" />}
                      </div>
                      <p className="text-xs text-[#B0B0B0] truncate mt-0.5">{user.email}</p>
                    </div>
                    <div className="text-right flex-shrink-0 hidden sm:block">
                      <p className="text-sm text-white font-mono tabular-nums">
                        {(user.tokenBalance?.balance ?? 0).toLocaleString()} tokens
                      </p>
                      <p className="text-xs text-[#B0B0B0]">
                        {user._count.builds} builds
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#B0B0B0] flex-shrink-0" />
                  </div>
                </button>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {total > 20 && (
            <div className="flex justify-center gap-2 mt-4">
              <button
                onClick={() => {
                  const p = page - 1
                  setPage(p)
                  searchUsers(query, p)
                }}
                disabled={page <= 1}
                className="px-3 py-1 text-xs text-[#B0B0B0] border border-[#1c1c1c] rounded-lg disabled:opacity-30 hover:text-white hover:border-[#D4AF37]/30 transition-colors"
              >
                Prev
              </button>
              <span className="px-3 py-1 text-xs text-[#B0B0B0]">
                Page {page} of {Math.ceil(total / 20)}
              </span>
              <button
                onClick={() => {
                  const p = page + 1
                  setPage(p)
                  searchUsers(query, p)
                }}
                disabled={page >= Math.ceil(total / 20)}
                className="px-3 py-1 text-xs text-[#B0B0B0] border border-[#1c1c1c] rounded-lg disabled:opacity-30 hover:text-white hover:border-[#D4AF37]/30 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* User detail panel */}
      {selectedUser && (
        <Card className="border-[#D4AF37]/20">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-white">
                {selectedUser.displayName ?? selectedUser.username ?? selectedUser.email}
              </h3>
              <p className="text-xs text-[#B0B0B0] mt-1">
                ID: {selectedUser.id} &middot; Clerk: {selectedUser.clerkId}
              </p>
              {selectedUser.robloxUsername && (
                <p className="text-xs text-[#B0B0B0]">
                  Roblox: {selectedUser.robloxUsername}
                </p>
              )}
            </div>
            <button
              onClick={() => setSelectedUser(null)}
              className="text-[#B0B0B0] hover:text-white"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          {/* User stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="bg-[#0a0a0a] rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-white">
                {(selectedUser.tokenBalance?.balance ?? 0).toLocaleString()}
              </p>
              <p className="text-xs text-[#B0B0B0]">Balance</p>
            </div>
            <div className="bg-[#0a0a0a] rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-white">
                {(selectedUser.tokenBalance?.lifetimeEarned ?? 0).toLocaleString()}
              </p>
              <p className="text-xs text-[#B0B0B0]">Lifetime Earned</p>
            </div>
            <div className="bg-[#0a0a0a] rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-white">{selectedUser._count.builds}</p>
              <p className="text-xs text-[#B0B0B0]">Total Builds</p>
            </div>
            <div className="bg-[#0a0a0a] rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-white">
                {new Date(selectedUser.createdAt).toLocaleDateString()}
              </p>
              <p className="text-xs text-[#B0B0B0]">Joined</p>
            </div>
          </div>

          {/* Credit management */}
          <div className="bg-[#0a0a0a] rounded-lg p-4 mb-4">
            <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#D4AF37]" />
              Credit Management
            </h4>
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setCreditAction('grant')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${creditAction === 'grant' ? 'bg-green-900/40 text-green-300 border border-green-500/30' : 'bg-[#1c1c1c] text-[#B0B0B0] border border-transparent hover:text-white'}`}
              >
                <Plus className="w-3 h-3" /> Grant
              </button>
              <button
                onClick={() => setCreditAction('deduct')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${creditAction === 'deduct' ? 'bg-red-900/40 text-red-300 border border-red-500/30' : 'bg-[#1c1c1c] text-[#B0B0B0] border border-transparent hover:text-white'}`}
              >
                <Minus className="w-3 h-3" /> Deduct
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                placeholder="Amount"
                min="1"
                className="w-28 bg-[#141414] border border-[#1c1c1c] rounded-lg px-3 py-2 text-sm text-white placeholder-[#B0B0B0] focus:outline-none focus:border-[#D4AF37]/40"
              />
              <input
                type="text"
                value={creditReason}
                onChange={(e) => setCreditReason(e.target.value)}
                placeholder="Reason..."
                className="flex-1 bg-[#141414] border border-[#1c1c1c] rounded-lg px-3 py-2 text-sm text-white placeholder-[#B0B0B0] focus:outline-none focus:border-[#D4AF37]/40"
              />
              <button
                onClick={handleCreditSubmit}
                disabled={creditLoading || !creditAmount || !creditReason}
                className="px-4 py-2 bg-[#D4AF37] text-black text-sm font-medium rounded-lg hover:bg-[#c9a227] disabled:opacity-50 transition-colors"
              >
                {creditLoading ? <Spinner /> : 'Apply'}
              </button>
            </div>
            {creditMsg && (
              <p
                className={`text-xs mt-2 ${creditMsg.startsWith('Success') ? 'text-green-400' : 'text-red-400'}`}
              >
                {creditMsg}
              </p>
            )}
          </div>

          {/* Transaction log */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <Hash className="w-4 h-4 text-[#D4AF37]" />
              Recent Transactions
            </h4>
            {txLoading ? (
              <div className="flex justify-center py-4">
                <Spinner />
              </div>
            ) : transactions.length === 0 ? (
              <p className="text-xs text-[#B0B0B0] py-2">No transactions found</p>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-1">
                {transactions.slice(0, 50).map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center gap-3 py-1.5 border-b border-[#1c1c1c] last:border-0 text-xs"
                  >
                    <span
                      className={`font-mono font-bold w-8 ${tx.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}
                    >
                      {tx.amount >= 0 ? '+' : ''}
                      {tx.amount.toLocaleString()}
                    </span>
                    <span className="text-[#B0B0B0] flex-1 truncate">{tx.description}</span>
                    <span className="text-[#B0B0B0] flex-shrink-0">
                      {timeAgo(tx.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Creator Program Panel
// ═══════════════════════════════════════════════════════════════════════════════

function CreatorProgramPanel() {
  const [creators, setCreators] = useState<Creator[]>([])
  const [loading, setLoading] = useState(true)
  const [enrollOpen, setEnrollOpen] = useState(false)
  const [enrollUserId, setEnrollUserId] = useState('')
  const [enrollChannel, setEnrollChannel] = useState('')
  const [enrollLoading, setEnrollLoading] = useState(false)
  const [enrollMsg, setEnrollMsg] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  const fetchCreators = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/creators')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setCreators(data.creators ?? [])
    } catch {
      setCreators([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCreators()
  }, [fetchCreators])

  const handleEnroll = async () => {
    if (!enrollUserId) return
    setEnrollLoading(true)
    setEnrollMsg(null)
    try {
      const res = await fetch('/api/admin/creators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: enrollUserId,
          channelName: enrollChannel || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setEnrollMsg(`Enrolled! Code: ${data.referralCode}`)
      setEnrollUserId('')
      setEnrollChannel('')
      fetchCreators()
    } catch (e) {
      setEnrollMsg(e instanceof Error ? e.message : 'Error')
    } finally {
      setEnrollLoading(false)
    }
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
  }

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={<Youtube className="w-4 h-4 text-[#D4AF37]" />}
        title={`Creator / YouTuber Program (${creators.length})`}
        action={
          <button
            onClick={() => setEnrollOpen(!enrollOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#D4AF37] text-black text-xs font-medium rounded-lg hover:bg-[#c9a227] transition-colors"
          >
            <UserPlus className="w-3 h-3" />
            Enroll Creator
          </button>
        }
      />

      {/* Enrollment form */}
      {enrollOpen && (
        <Card className="border-[#D4AF37]/20">
          <h4 className="text-sm font-semibold text-white mb-3">Enroll New Creator</h4>
          <div className="flex gap-2 flex-wrap">
            <input
              type="text"
              value={enrollUserId}
              onChange={(e) => setEnrollUserId(e.target.value)}
              placeholder="User ID (from user search)"
              className="flex-1 min-w-[200px] bg-[#0a0a0a] border border-[#1c1c1c] rounded-lg px-3 py-2 text-sm text-white placeholder-[#B0B0B0] focus:outline-none focus:border-[#D4AF37]/40"
            />
            <input
              type="text"
              value={enrollChannel}
              onChange={(e) => setEnrollChannel(e.target.value)}
              placeholder="Channel name (optional)"
              className="flex-1 min-w-[200px] bg-[#0a0a0a] border border-[#1c1c1c] rounded-lg px-3 py-2 text-sm text-white placeholder-[#B0B0B0] focus:outline-none focus:border-[#D4AF37]/40"
            />
            <button
              onClick={handleEnroll}
              disabled={enrollLoading || !enrollUserId}
              className="px-4 py-2 bg-[#D4AF37] text-black text-sm font-medium rounded-lg hover:bg-[#c9a227] disabled:opacity-50 transition-colors"
            >
              {enrollLoading ? <Spinner /> : 'Enroll'}
            </button>
          </div>
          {enrollMsg && (
            <p
              className={`text-xs mt-2 ${enrollMsg.startsWith('Enrolled') ? 'text-green-400' : 'text-red-400'}`}
            >
              {enrollMsg}
            </p>
          )}
        </Card>
      )}

      {/* Creators list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner />
        </div>
      ) : creators.length === 0 ? (
        <Card>
          <p className="text-[#B0B0B0] text-sm text-center py-8">
            No creators enrolled yet. Use the button above to add one.
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {creators.map((creator) => (
            <Card key={creator.id}>
              <button
                onClick={() => setExpanded(expanded === creator.id ? null : creator.id)}
                className="w-full text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-[#D4AF37]/10 rounded-full flex items-center justify-center text-xs font-bold text-[#D4AF37] flex-shrink-0">
                    {(creator.displayName ?? creator.username ?? creator.email)[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-white font-medium">
                        {creator.displayName ?? creator.username ?? creator.email}
                      </span>
                      <Badge text={creator.tier} />
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-xs text-[#D4AF37] font-mono">
                        {creator.referralCode}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          copyCode(creator.referralCode)
                        }}
                        className="text-[#B0B0B0] hover:text-white"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="hidden sm:flex items-center gap-4 text-xs flex-shrink-0">
                    <div className="text-center">
                      <p className="text-white font-bold">{creator.totalReferrals}</p>
                      <p className="text-[#B0B0B0]">Referrals</p>
                    </div>
                    <div className="text-center">
                      <p className="text-white font-bold">{creator.convertedReferrals}</p>
                      <p className="text-[#B0B0B0]">Converted</p>
                    </div>
                    <div className="text-center">
                      <p className="text-white font-bold">{cents(creator.totalEarnedCents)}</p>
                      <p className="text-[#B0B0B0]">Earned</p>
                    </div>
                  </div>

                  <ChevronDown
                    className={`w-4 h-4 text-[#B0B0B0] flex-shrink-0 transition-transform ${expanded === creator.id ? 'rotate-180' : ''}`}
                  />
                </div>
              </button>

              {expanded === creator.id && (
                <div className="mt-4 pt-4 border-t border-[#1c1c1c]">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-[#0a0a0a] rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-white">{creator.totalReferrals}</p>
                      <p className="text-xs text-[#B0B0B0]">Total Referrals</p>
                    </div>
                    <div className="bg-[#0a0a0a] rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-green-400">
                        {cents(creator.totalCommissionCents)}
                      </p>
                      <p className="text-xs text-[#B0B0B0]">Commission</p>
                    </div>
                    <div className="bg-[#0a0a0a] rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-[#D4AF37]">
                        {cents(creator.pendingBalanceCents)}
                      </p>
                      <p className="text-xs text-[#B0B0B0]">Pending Payout</p>
                    </div>
                    <div className="bg-[#0a0a0a] rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-white">
                        {creator.lastPayoutAt
                          ? new Date(creator.lastPayoutAt).toLocaleDateString()
                          : 'Never'}
                      </p>
                      <p className="text-xs text-[#B0B0B0]">Last Payout</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-[#B0B0B0]">
                    <span>Email: {creator.email}</span>
                    <span>&middot;</span>
                    <span>Stripe: {creator.chargesEnabled ? 'Connected' : 'Not connected'}</span>
                    <span>&middot;</span>
                    <span>
                      Joined: {new Date(creator.joinedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Newsletter Panel
// ═══════════════════════════════════════════════════════════════════════════════

function NewsletterPanel() {
  const [subscribers, setSubscribers] = useState<NewsletterSub[]>([])
  const [subCount, setSubCount] = useState(0)
  const [breakdown, setBreakdown] = useState<{ users: number; waitlist: number }>({ users: 0, waitlist: 0 })
  const [loading, setLoading] = useState(true)

  // Compose state
  const [subject, setSubject] = useState('')
  const [htmlContent, setHtmlContent] = useState('')
  const [toWaitlist, setToWaitlist] = useState(false)
  const [tier, setTier] = useState<string>('')
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<string | null>(null)

  const fetchSubs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/newsletter')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setSubscribers(data.subscribers ?? [])
      setSubCount(data.total ?? 0)
      setBreakdown(data.breakdown ?? { users: 0, waitlist: 0 })
    } catch {
      setSubscribers([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSubs()
  }, [fetchSubs])

  const handleSend = async () => {
    if (!subject || !htmlContent) return
    setSending(true)
    setSendResult(null)
    try {
      const res = await fetch('/api/admin/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          htmlContent,
          toWaitlist,
          ...(tier ? { tier } : {}),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setSendResult(`Sent to ${data.sent} recipients (${data.failed} failed)`)
      setSubject('')
      setHtmlContent('')
    } catch (e) {
      setSendResult(e instanceof Error ? e.message : 'Error')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={<Mail className="w-4 h-4 text-[#D4AF37]" />}
        title="Newsletter Management"
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center">
          <p className="text-2xl font-bold text-white">{subCount}</p>
          <p className="text-xs text-[#B0B0B0] mt-1">Total Subscribers</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-white">{breakdown.users}</p>
          <p className="text-xs text-[#B0B0B0] mt-1">Active Users</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-white">{breakdown.waitlist}</p>
          <p className="text-xs text-[#B0B0B0] mt-1">Waitlist</p>
        </Card>
      </div>

      {/* Compose */}
      <Card className="border-[#D4AF37]/20">
        <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Send className="w-4 h-4 text-[#D4AF37]" />
          Compose Newsletter
        </h4>

        <div className="space-y-3">
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject line..."
            className="w-full bg-[#0a0a0a] border border-[#1c1c1c] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#B0B0B0] focus:outline-none focus:border-[#D4AF37]/40"
          />

          <textarea
            value={htmlContent}
            onChange={(e) => setHtmlContent(e.target.value)}
            placeholder="HTML content... (supports full HTML email markup)"
            rows={8}
            className="w-full bg-[#0a0a0a] border border-[#1c1c1c] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#B0B0B0] focus:outline-none focus:border-[#D4AF37]/40 font-mono resize-y"
          />

          <div className="flex items-center gap-4 flex-wrap">
            <label className="flex items-center gap-2 text-sm text-[#B0B0B0] cursor-pointer">
              <input
                type="checkbox"
                checked={toWaitlist}
                onChange={(e) => setToWaitlist(e.target.checked)}
                className="rounded border-[#1c1c1c] bg-[#0a0a0a] text-[#D4AF37] focus:ring-[#D4AF37]/40"
              />
              Send to waitlist only
            </label>

            {!toWaitlist && (
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value)}
                className="bg-[#0a0a0a] border border-[#1c1c1c] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#D4AF37]/40"
              >
                <option value="">All tiers</option>
                <option value="FREE">FREE</option>
                <option value="HOBBY">HOBBY</option>
                <option value="CREATOR">CREATOR</option>
                <option value="STUDIO">STUDIO</option>
              </select>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSend}
              disabled={sending || !subject || !htmlContent}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#D4AF37] text-black text-sm font-medium rounded-lg hover:bg-[#c9a227] disabled:opacity-50 transition-colors"
            >
              {sending ? <Spinner /> : <Send className="w-4 h-4" />}
              Send Newsletter
            </button>
            {sendResult && (
              <p
                className={`text-xs ${sendResult.startsWith('Sent') ? 'text-green-400' : 'text-red-400'}`}
              >
                {sendResult}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Subscriber list */}
      {!loading && subscribers.length > 0 && (
        <Card>
          <h4 className="text-sm font-semibold text-[#B0B0B0] uppercase tracking-wider mb-3">
            Recent Subscribers
          </h4>
          <div className="max-h-80 overflow-y-auto space-y-1">
            {subscribers.slice(0, 100).map((sub, i) => (
              <div
                key={`${sub.email}-${i}`}
                className="flex items-center gap-3 py-1.5 border-b border-[#1c1c1c] last:border-0 text-xs"
              >
                <span className="text-white flex-1 truncate">{sub.email}</span>
                <Badge
                  text={sub.source}
                  color={sub.source === 'user' ? 'bg-blue-900/40 text-blue-300' : 'bg-purple-900/40 text-purple-300'}
                />
                <span className="text-[#B0B0B0] flex-shrink-0">
                  {new Date(sub.joinedAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main Dashboard Page
// ═══════════════════════════════════════════════════════════════════════════════

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<TabId>('status')

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Command Center</h1>
        <p className="text-[#B0B0B0] text-sm mt-1">
          Server monitoring, user management, creator program, and outreach
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto pb-1 border-b border-[#1c1c1c]">
        {TABS.map((tab) => {
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg whitespace-nowrap transition-colors ${
                active
                  ? 'bg-[#141414] text-[#D4AF37] border border-[#1c1c1c] border-b-[#141414] -mb-px'
                  : 'text-[#B0B0B0] hover:text-white'
              }`}
            >
              <tab.icon className={`w-4 h-4 ${active ? 'text-[#D4AF37]' : ''}`} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'status' && <ServerStatusPanel />}
        {activeTab === 'sessions' && <SessionsPanel />}
        {activeTab === 'users' && <UserManagementPanel />}
        {activeTab === 'creators' && <CreatorProgramPanel />}
        {activeTab === 'newsletter' && <NewsletterPanel />}
      </div>
    </div>
  )
}
