'use client'

import { useEffect, useState, useCallback } from 'react'
import { Search, ChevronRight, Shield, Ban, RefreshCw } from 'lucide-react'

type SubscriptionTier = 'FREE' | 'HOBBY' | 'CREATOR' | 'STUDIO'
type UserRole = 'USER' | 'ADMIN' | 'CREATOR' | 'MODERATOR'

interface AdminUser {
  id: string
  email: string
  username: string | null
  displayName: string | null
  role: UserRole
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  subscription: { tier: SubscriptionTier; status: string } | null
  tokenBalance: { balance: number } | null
  _count: { apiUsage: number }
}

interface UserListResponse {
  users: AdminUser[]
  total: number
  page: number
  pageSize: number
}

const TIER_COLORS: Record<SubscriptionTier, string> = {
  FREE: 'bg-[#1E2451] text-[#6B7280]',
  HOBBY: 'bg-blue-900/40 text-blue-300',
  CREATOR: 'bg-purple-900/40 text-purple-300',
  STUDIO: 'bg-[#FFB81C]/10 text-[#FFB81C]',
}

const ROLE_COLORS: Record<UserRole, string> = {
  USER: 'bg-[#1E2451] text-[#6B7280]',
  CREATOR: 'bg-purple-900/40 text-purple-300',
  MODERATOR: 'bg-blue-900/40 text-blue-300',
  ADMIN: 'bg-[#FFB81C]/10 text-[#FFB81C]',
}

export default function AdminUsersPage() {
  const [data, setData] = useState<UserListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [actionUserId, setActionUserId] = useState<string | null>(null)
  const [actionType, setActionType] = useState<'role' | 'tier' | 'ban' | 'refund' | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), search })
      const res = await fetch(`/api/admin/users?${params}`)
      if (!res.ok) throw new Error(`${res.status}`)
      setData(await res.json())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    const t = setTimeout(fetchUsers, search ? 400 : 0)
    return () => clearTimeout(t)
  }, [fetchUsers, search])

  const handleAction = async (
    userId: string,
    type: 'role' | 'tier' | 'ban' | 'refund',
    value?: string
  ) => {
    setActionUserId(userId)
    setActionType(type)
    try {
      const body: Record<string, unknown> = {}
      if (type === 'role') body.role = value
      if (type === 'tier') body.tier = value
      if (type === 'ban') {
        const user = data?.users.find((u) => u.id === userId)
        body.banned = !user?.deletedAt
      }
      if (type === 'refund') body.refundTokens = true

      await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      await fetchUsers()
    } finally {
      setActionUserId(null)
      setActionType(null)
    }
  }

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 1

  return (
    <div className="space-y-6 p-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-[#6B7280] text-sm mt-1">
            {data ? `${data.total.toLocaleString()} total users` : '—'}
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="flex items-center gap-2 px-3 py-2 bg-[#0D1231] border border-[#1E2451] rounded-lg text-sm text-[#6B7280] hover:text-white hover:border-[#FFB81C] transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
        <input
          type="text"
          placeholder="Search by email or username..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          className="w-full pl-10 pr-4 py-3 bg-[#0D1231] border border-[#1E2451] rounded-xl text-white placeholder:text-[#6B7280] focus:outline-none focus:border-[#FFB81C] transition-colors"
        />
      </div>

      {/* Table */}
      <div className="bg-[#0D1231] border border-[#1E2451] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1E2451]">
                {['User', 'Tier', 'Role', 'Tokens', 'Created', 'Status', 'Actions'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2451]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-[#6B7280]">
                    <div className="flex justify-center">
                      <div className="w-6 h-6 border-2 border-[#FFB81C] border-t-transparent rounded-full animate-spin" />
                    </div>
                  </td>
                </tr>
              ) : !data?.users.length ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-[#6B7280]">
                    No users found
                  </td>
                </tr>
              ) : (
                data.users.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    onAction={handleAction}
                    isActing={actionUserId === user.id}
                    actingType={actionUserId === user.id ? actionType : null}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#1E2451]">
            <p className="text-sm text-[#6B7280]">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 bg-[#111640] border border-[#1E2451] rounded-lg text-sm text-white disabled:opacity-40 hover:border-[#FFB81C] transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 bg-[#111640] border border-[#1E2451] rounded-lg text-sm text-white disabled:opacity-40 hover:border-[#FFB81C] transition-colors"
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

function UserRow({
  user,
  onAction,
  isActing,
  actingType,
}: {
  user: AdminUser
  onAction: (id: string, type: 'role' | 'tier' | 'ban' | 'refund', value?: string) => void
  isActing: boolean
  actingType: 'role' | 'tier' | 'ban' | 'refund' | null
}) {
  const tier = user.subscription?.tier ?? 'FREE'
  const isBanned = !!user.deletedAt

  return (
    <tr className={`hover:bg-[#111640] transition-colors ${isBanned ? 'opacity-50' : ''}`}>
      <td className="px-4 py-4">
        <div className="flex flex-col">
          <span className="text-white text-sm font-medium">
            {user.displayName || user.username || '—'}
          </span>
          <span className="text-[#6B7280] text-xs">{user.email}</span>
        </div>
      </td>
      <td className="px-4 py-4">
        <select
          value={tier}
          onChange={(e) => onAction(user.id, 'tier', e.target.value)}
          disabled={isActing}
          className={`text-xs px-2 py-1 rounded-full border-0 font-medium cursor-pointer ${TIER_COLORS[tier]} bg-transparent outline-none`}
        >
          {(['FREE', 'HOBBY', 'CREATOR', 'STUDIO'] as SubscriptionTier[]).map((t) => (
            <option key={t} value={t} className="bg-[#0D1231] text-white">
              {t}
            </option>
          ))}
        </select>
      </td>
      <td className="px-4 py-4">
        <select
          value={user.role}
          onChange={(e) => onAction(user.id, 'role', e.target.value)}
          disabled={isActing}
          className={`text-xs px-2 py-1 rounded-full border-0 font-medium cursor-pointer ${ROLE_COLORS[user.role]} bg-transparent outline-none`}
        >
          {(['USER', 'CREATOR', 'MODERATOR', 'ADMIN'] as UserRole[]).map((r) => (
            <option key={r} value={r} className="bg-[#0D1231] text-white">
              {r}
            </option>
          ))}
        </select>
      </td>
      <td className="px-4 py-4 text-sm text-white">
        {user.tokenBalance?.balance.toLocaleString() ?? 0}
      </td>
      <td className="px-4 py-4 text-xs text-[#6B7280]">
        {new Date(user.createdAt).toLocaleDateString()}
      </td>
      <td className="px-4 py-4">
        {isBanned ? (
          <span className="text-xs px-2 py-1 bg-red-900/40 text-red-400 rounded-full">Banned</span>
        ) : (
          <span className="text-xs px-2 py-1 bg-green-900/40 text-green-400 rounded-full">
            Active
          </span>
        )}
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onAction(user.id, 'ban')}
            disabled={isActing && actingType === 'ban'}
            title={isBanned ? 'Unban user' : 'Ban user'}
            className="p-1.5 rounded-lg border border-[#1E2451] hover:border-red-500 hover:text-red-400 text-[#6B7280] transition-colors"
          >
            <Ban className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onAction(user.id, 'refund')}
            disabled={isActing && actingType === 'refund'}
            title="Refund tokens"
            className="p-1.5 rounded-lg border border-[#1E2451] hover:border-[#FFB81C] hover:text-[#FFB81C] text-[#6B7280] transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <a
            href={`/admin/users/${user.id}`}
            className="p-1.5 rounded-lg border border-[#1E2451] hover:border-[#FFB81C] text-[#6B7280] hover:text-[#FFB81C] transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </td>
    </tr>
  )
}
