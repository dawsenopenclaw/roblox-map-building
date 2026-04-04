'use client'

import { useEffect, useState, useCallback } from 'react'
import { Search, Ban, RefreshCw, BadgeCheck, ChevronDown } from 'lucide-react'

type SubscriptionTier = 'FREE' | 'HOBBY' | 'CREATOR' | 'STUDIO'
type UserRole = 'USER' | 'ADMIN' | 'CREATOR' | 'MODERATOR'

interface AdminUser {
  id: string
  email: string
  username: string | null
  displayName: string | null
  role: UserRole
  verified: boolean
  createdAt: string
  deletedAt: string | null
  subscription: { tier: SubscriptionTier; status: string } | null
  tokenBalance: { balance: number } | null
}

interface UserListResponse {
  users: AdminUser[]
  total: number
  page: number
  pageSize: number
}

const DEMO_USERS: AdminUser[] = [
  { id: '1', email: 'alice@example.com', username: 'alice', displayName: 'Alice Smith', role: 'USER', verified: true, createdAt: '2026-01-15T10:00:00Z', deletedAt: null, subscription: { tier: 'CREATOR', status: 'active' }, tokenBalance: { balance: 2400 } },
  { id: '2', email: 'bob@example.com', username: 'bob99', displayName: 'Bob Jones', role: 'USER', verified: false, createdAt: '2026-01-20T14:30:00Z', deletedAt: null, subscription: { tier: 'HOBBY', status: 'active' }, tokenBalance: { balance: 800 } },
  { id: '3', email: 'carol@example.com', username: 'caroldev', displayName: 'Carol Dev', role: 'CREATOR', verified: true, createdAt: '2026-02-01T09:00:00Z', deletedAt: null, subscription: { tier: 'STUDIO', status: 'active' }, tokenBalance: { balance: 12500 } },
  { id: '4', email: 'dave@example.com', username: 'dave_rb', displayName: 'Dave R', role: 'USER', verified: false, createdAt: '2026-02-10T16:00:00Z', deletedAt: '2026-03-01T00:00:00Z', subscription: { tier: 'FREE', status: 'inactive' }, tokenBalance: { balance: 0 } },
  { id: '5', email: 'eve@example.com', username: 'evegames', displayName: 'Eve Games', role: 'MODERATOR', verified: true, createdAt: '2026-02-14T11:00:00Z', deletedAt: null, subscription: { tier: 'HOBBY', status: 'active' }, tokenBalance: { balance: 350 } },
  { id: '6', email: 'frank@example.com', username: 'frank_b', displayName: 'Frank B', role: 'USER', verified: false, createdAt: '2026-03-01T08:00:00Z', deletedAt: null, subscription: null, tokenBalance: { balance: 100 } },
  { id: '7', email: 'grace@example.com', username: 'grace_rblx', displayName: 'Grace L', role: 'USER', verified: false, createdAt: '2026-03-05T13:30:00Z', deletedAt: null, subscription: { tier: 'FREE', status: 'active' }, tokenBalance: { balance: 200 } },
  { id: '8', email: 'henry@example.com', username: 'henry_h', displayName: 'Henry H', role: 'ADMIN', verified: true, createdAt: '2025-12-01T00:00:00Z', deletedAt: null, subscription: { tier: 'STUDIO', status: 'active' }, tokenBalance: { balance: 99999 } },
]

const TIER_COLORS: Record<SubscriptionTier, string> = {
  FREE: 'bg-[#1c1c1c] text-[#B0B0B0]',
  HOBBY: 'bg-blue-900/40 text-blue-300',
  CREATOR: 'bg-purple-900/40 text-purple-300',
  STUDIO: 'bg-[#D4AF37]/10 text-[#D4AF37]',
}

const ROLE_COLORS: Record<UserRole, string> = {
  USER: 'bg-[#1c1c1c] text-[#B0B0B0]',
  CREATOR: 'bg-purple-900/40 text-purple-300',
  MODERATOR: 'bg-blue-900/40 text-blue-300',
  ADMIN: 'bg-[#D4AF37]/10 text-[#D4AF37]',
}

const TIERS: SubscriptionTier[] = ['FREE', 'HOBBY', 'CREATOR', 'STUDIO']

export default function AdminUsersPage() {
  const [data, setData] = useState<UserListResponse | null>(null)
  const [isDemo, setIsDemo] = useState(false)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL')
  const [page, setPage] = useState(1)
  const [actionUserId, setActionUserId] = useState<string | null>(null)
  const [tierDropdownId, setTierDropdownId] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), search })
      if (roleFilter !== 'ALL') params.set('role', roleFilter)
      const res = await fetch(`/api/admin/users?${params}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setData(await res.json())
      setIsDemo(false)
    } catch {
      // Fall back to filtered demo data
      const filtered = DEMO_USERS.filter((u) => {
        const matchSearch =
          !search ||
          u.email.toLowerCase().includes(search.toLowerCase()) ||
          (u.username ?? '').toLowerCase().includes(search.toLowerCase())
        const matchRole = roleFilter === 'ALL' || u.role === roleFilter
        return matchSearch && matchRole
      })
      setData({ users: filtered, total: filtered.length, page: 1, pageSize: 20 })
      setIsDemo(true)
    } finally {
      setLoading(false)
    }
  }, [page, search, roleFilter])

  useEffect(() => {
    const t = setTimeout(fetchUsers, search ? 300 : 0)
    return () => clearTimeout(t)
  }, [fetchUsers, search])

  const handleBan = async (userId: string) => {
    if (isDemo) return
    setActionUserId(userId)
    try {
      const user = data?.users.find((u) => u.id === userId)
      await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ banned: !user?.deletedAt }),
      })
      await fetchUsers()
    } finally {
      setActionUserId(null)
    }
  }

  const handleVerify = async (userId: string, currentVerified: boolean) => {
    if (isDemo) return
    setActionUserId(userId)
    try {
      await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verified: !currentVerified }),
      })
      await fetchUsers()
    } finally {
      setActionUserId(null)
    }
  }

  const handleChangeTier = async (userId: string, tier: SubscriptionTier) => {
    setTierDropdownId(null)
    if (isDemo) return
    setActionUserId(userId)
    try {
      await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      })
      await fetchUsers()
    } finally {
      setActionUserId(null)
    }
  }

  const totalPages = data ? Math.ceil(data.total / (data.pageSize || 20)) : 1

  return (
    <div className="space-y-6 p-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-[#B0B0B0] text-sm mt-1">
            {data ? `${data.total.toLocaleString()} total users` : '—'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isDemo && (
            <span className="text-xs px-2 py-1 bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 rounded-full">
              Demo data
            </span>
          )}
          <button
            onClick={fetchUsers}
            className="flex items-center gap-2 px-3 py-2 bg-[#141414] border border-[#1c1c1c] rounded-lg text-sm text-[#B0B0B0] hover:text-white hover:border-[#D4AF37] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B0B0B0]" />
          <input
            type="text"
            placeholder="Search by email or username..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full pl-10 pr-4 py-3 bg-[#141414] border border-[#1c1c1c] rounded-xl text-white placeholder:text-[#B0B0B0] focus:outline-none focus:border-[#D4AF37] transition-colors"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value as UserRole | 'ALL'); setPage(1) }}
          className="px-4 py-3 bg-[#141414] border border-[#1c1c1c] rounded-xl text-white focus:outline-none focus:border-[#D4AF37] transition-colors text-sm"
        >
          <option value="ALL">All Roles</option>
          <option value="USER">User</option>
          <option value="CREATOR">Creator</option>
          <option value="MODERATOR">Moderator</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-[#141414] border border-[#1c1c1c] rounded-xl overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-[#1c1c1c]">
                {['User', 'Tier', 'Role', 'Tokens', 'Joined', 'Status', 'Verified', 'Actions'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-[#B0B0B0] uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1c1c1c]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center">
                    <div className="flex justify-center">
                      <div className="w-6 h-6 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
                    </div>
                  </td>
                </tr>
              ) : !data?.users.length ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-[#B0B0B0]">
                    No users found
                  </td>
                </tr>
              ) : (
                data.users.map((user) => {
                  const tier = user.subscription?.tier ?? 'FREE'
                  const isBanned = !!user.deletedAt
                  const isActing = actionUserId === user.id
                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-[#1c1c1c] transition-colors ${isBanned ? 'opacity-50' : ''}`}
                    >
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="text-white text-sm font-medium">
                            {user.displayName || user.username || '—'}
                          </span>
                          <span className="text-[#B0B0B0] text-xs">{user.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {/* Tier change dropdown */}
                        <div className="relative">
                          <button
                            onClick={() => setTierDropdownId(tierDropdownId === user.id ? null : user.id)}
                            disabled={isActing || isDemo}
                            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${TIER_COLORS[tier]} border border-transparent hover:border-[#D4AF37]/40 transition-colors disabled:cursor-not-allowed`}
                          >
                            {tier}
                            <ChevronDown className="w-3 h-3" />
                          </button>
                          {tierDropdownId === user.id && (
                            <div className="absolute z-10 top-full mt-1 left-0 bg-[#1c1c1c] border border-[#2a2a2a] rounded-lg shadow-xl overflow-hidden min-w-[110px]">
                              {TIERS.map((t) => (
                                <button
                                  key={t}
                                  onClick={() => handleChangeTier(user.id, t)}
                                  className={`w-full text-left px-3 py-2 text-xs font-medium hover:bg-[#2a2a2a] transition-colors ${TIER_COLORS[t]} ${t === tier ? 'opacity-40 cursor-default' : ''}`}
                                >
                                  {t}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${ROLE_COLORS[user.role]}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-white">
                        {(user.tokenBalance?.balance ?? 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-4 text-xs text-[#B0B0B0]">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4">
                        {isBanned ? (
                          <span className="text-xs px-2 py-1 bg-red-900/40 text-red-400 rounded-full">
                            Banned
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-1 bg-green-900/40 text-green-400 rounded-full">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {user.verified ? (
                          <span className="text-xs px-2 py-1 bg-blue-900/40 text-blue-300 rounded-full">
                            Verified
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-1 bg-[#1c1c1c] text-[#B0B0B0] rounded-full">
                            Unverified
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1">
                          {/* Verify / unverify */}
                          <button
                            onClick={() => handleVerify(user.id, user.verified)}
                            disabled={isActing || isDemo}
                            title={user.verified ? 'Remove verification' : 'Verify user'}
                            className={`p-1.5 rounded-lg border transition-colors disabled:opacity-40 ${
                              user.verified
                                ? 'border-blue-700/40 text-blue-400 hover:border-blue-500 hover:bg-blue-900/20'
                                : 'border-[#1c1c1c] text-[#B0B0B0] hover:border-blue-500 hover:text-blue-400'
                            }`}
                          >
                            <BadgeCheck className="w-3.5 h-3.5" />
                          </button>
                          {/* Ban / unban */}
                          <button
                            onClick={() => handleBan(user.id)}
                            disabled={isActing || isDemo}
                            title={isBanned ? 'Unban user' : 'Ban user'}
                            className={`p-1.5 rounded-lg border transition-colors disabled:opacity-40 ${
                              isBanned
                                ? 'border-red-700/40 text-red-400 hover:border-red-500 hover:bg-red-900/20'
                                : 'border-[#1c1c1c] text-[#B0B0B0] hover:border-red-500 hover:text-red-400'
                            }`}
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#1c1c1c]">
            <p className="text-sm text-[#B0B0B0]">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 bg-[#1c1c1c] border border-[#1c1c1c] rounded-lg text-sm text-white disabled:opacity-40 hover:border-[#D4AF37] transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 bg-[#1c1c1c] border border-[#1c1c1c] rounded-lg text-sm text-white disabled:opacity-40 hover:border-[#D4AF37] transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
