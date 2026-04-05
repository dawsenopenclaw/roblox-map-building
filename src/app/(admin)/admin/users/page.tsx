'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import {
  Search,
  Ban,
  RefreshCw,
  BadgeCheck,
  ChevronDown,
  Gift,
  Tag,
  Ticket,
  X,
  Check,
  Loader2,
} from 'lucide-react'

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
  STUDIO: 'bg-[#c9a227]/10 text-[#c9a227]',
}

const ROLE_COLORS: Record<UserRole, string> = {
  USER: 'bg-[#1c1c1c] text-[#B0B0B0]',
  CREATOR: 'bg-purple-900/40 text-purple-300',
  MODERATOR: 'bg-blue-900/40 text-blue-300',
  ADMIN: 'bg-[#c9a227]/10 text-[#c9a227]',
}

const TIERS: SubscriptionTier[] = ['FREE', 'HOBBY', 'CREATOR', 'STUDIO']

const GIFT_PRESETS = [100, 500, 1000, 5000, 10000, 50000, 100000, 1000000, 10000000]

// ─── Gift Tokens Dialog ────────────────────────────────────────────────────────

function GiftTokensDialog({
  user,
  onClose,
  onSuccess,
}: {
  user: AdminUser
  onClose: () => void
  onSuccess: (newBalance: number) => void
}) {
  const [amount, setAmount] = useState(1000)
  const [customAmount, setCustomAmount] = useState('')
  const [useCustom, setUseCustom] = useState(false)
  const [unlimited, setUnlimited] = useState(false)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const effectiveAmount = unlimited ? 999_999_999 : (useCustom ? parseInt(customAmount || '0', 10) : amount)

  const handleSubmit = async () => {
    if (!unlimited && (effectiveAmount < 1 || effectiveAmount > 999_999_999)) {
      setError('Amount must be between 1 and 999,999,999')
      return
    }
    if (!reason.trim()) {
      setError('Reason is required')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/gift-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, amount: effectiveAmount, reason: reason.trim(), type: 'GIFT', unlimited }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to gift tokens')
      onSuccess(data.newBalance)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[#141414] border border-[#2a2a2a] rounded-2xl w-full max-w-md p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#c9a227]/10 border border-[#c9a227]/20 rounded-xl flex items-center justify-center">
              <Gift className="w-4 h-4 text-[#c9a227]" />
            </div>
            <div>
              <h2 className="text-white font-bold text-base">Gift Tokens</h2>
              <p className="text-[#B0B0B0] text-xs truncate max-w-[200px]">
                {user.displayName || user.username || user.email}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#B0B0B0] hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current balance */}
        <div className="bg-[#1c1c1c] rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-[#B0B0B0] text-sm">Current balance</span>
          <span className="text-white font-bold tabular-nums">
            {(user.tokenBalance?.balance ?? 0).toLocaleString()} tokens
          </span>
        </div>

        {/* Preset amounts */}
        <div>
          <p className="text-xs text-[#B0B0B0] uppercase tracking-wider mb-2">Amount</p>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {GIFT_PRESETS.map((preset) => (
              <button
                key={preset}
                onClick={() => { setAmount(preset); setUseCustom(false) }}
                className={`py-2 rounded-lg text-xs font-semibold border transition-colors ${
                  !useCustom && amount === preset
                    ? 'bg-[#c9a227]/10 border-[#c9a227]/40 text-[#c9a227]'
                    : 'bg-[#1c1c1c] border-[#2a2a2a] text-[#B0B0B0] hover:border-[#c9a227]/30 hover:text-white'
                }`}
              >
                {preset >= 1000 ? `${preset / 1000}k` : preset}
              </button>
            ))}
            <button
              onClick={() => { setUseCustom(true); setUnlimited(false) }}
              className={`py-2 rounded-lg text-xs font-semibold border transition-colors col-span-2 ${
                useCustom && !unlimited
                  ? 'bg-[#c9a227]/10 border-[#c9a227]/40 text-[#c9a227]'
                  : 'bg-[#1c1c1c] border-[#2a2a2a] text-[#B0B0B0] hover:border-[#c9a227]/30 hover:text-white'
              }`}
            >
              Custom amount
            </button>
            <button
              onClick={() => { setUnlimited(!unlimited); setUseCustom(false) }}
              className={`py-2 rounded-lg text-xs font-bold border transition-colors col-span-2 ${
                unlimited
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                  : 'bg-[#1c1c1c] border-[#2a2a2a] text-[#B0B0B0] hover:border-emerald-500/30 hover:text-white'
              }`}
            >
              {unlimited ? '∞ UNLIMITED' : '∞ Unlimited'}
            </button>
          </div>
          {unlimited && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2.5 text-emerald-400 text-xs">
              This will set the user&apos;s balance to 999,999,999 tokens (effectively unlimited).
            </div>
          )}
          {useCustom && !unlimited && (
            <input
              type="number"
              min={1}
              max={999999999}
              placeholder="Enter amount (1 – 999,999,999)"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl text-white placeholder:text-[#555] focus:outline-none focus:border-[#c9a227] transition-colors text-sm"
            />
          )}
        </div>

        {/* Reason */}
        <div>
          <p className="text-xs text-[#B0B0B0] uppercase tracking-wider mb-2">Reason</p>
          <input
            type="text"
            placeholder="e.g. Contest prize, compensation for bug..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
            className="w-full px-4 py-2.5 bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl text-white placeholder:text-[#555] focus:outline-none focus:border-[#c9a227] transition-colors text-sm"
          />
        </div>

        {/* Preview */}
        <div className="bg-[#1c1c1c] rounded-xl px-4 py-3 flex items-center justify-between text-sm">
          <span className="text-[#B0B0B0]">New balance after gift</span>
          <span className="text-[#c9a227] font-bold tabular-nums">
            {unlimited
              ? '∞ Unlimited'
              : ((user.tokenBalance?.balance ?? 0) + effectiveAmount).toLocaleString() + ' tokens'}
          </span>
        </div>

        {error && (
          <p className="text-red-400 text-xs bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || (!unlimited && effectiveAmount < 1)}
          className="w-full py-3 bg-[#c9a227] hover:bg-[#b8921f] disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gift className="w-4 h-4" />}
          {unlimited ? 'Gift ∞ Unlimited Tokens' : `Gift ${effectiveAmount >= 1 ? effectiveAmount.toLocaleString() : '—'} Tokens`}
        </button>
      </div>
    </div>
  )
}

// ─── Set Tier Dialog ───────────────────────────────────────────────────────────

function SetTierDialog({
  user,
  onClose,
  onSuccess,
}: {
  user: AdminUser
  onClose: () => void
  onSuccess: () => void
}) {
  const currentTier = user.subscription?.tier ?? 'FREE'
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>(currentTier)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const TIER_LABELS: Record<SubscriptionTier, { price: string; tokens: string }> = {
    FREE: { price: 'Free', tokens: '1,000 tokens/mo' },
    HOBBY: { price: '$9/mo', tokens: '2,000 tokens/mo' },
    CREATOR: { price: '$29/mo', tokens: '7,000 tokens/mo' },
    STUDIO: { price: '$79/mo', tokens: '20,000 tokens/mo' },
  }

  const handleSubmit = async () => {
    if (!reason.trim()) { setError('Reason is required'); return }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setTier: { tier: selectedTier, reason: reason.trim() } }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[#141414] border border-[#2a2a2a] rounded-2xl w-full max-w-md p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#c9a227]/10 border border-[#c9a227]/20 rounded-xl flex items-center justify-center">
              <Tag className="w-4 h-4 text-[#c9a227]" />
            </div>
            <div>
              <h2 className="text-white font-bold text-base">Set Subscription Tier</h2>
              <p className="text-[#B0B0B0] text-xs">{user.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#B0B0B0] hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {TIERS.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTier(t)}
              className={`p-3 rounded-xl border text-left transition-colors ${
                selectedTier === t
                  ? 'bg-[#c9a227]/10 border-[#c9a227]/40'
                  : 'bg-[#1c1c1c] border-[#2a2a2a] hover:border-[#c9a227]/20'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-sm font-bold ${TIER_COLORS[t].split(' ')[1]}`}>{t}</span>
                {selectedTier === t && <Check className="w-3.5 h-3.5 text-[#c9a227]" />}
              </div>
              <p className="text-xs text-[#B0B0B0]">{TIER_LABELS[t].price}</p>
              <p className="text-xs text-[#555]">{TIER_LABELS[t].tokens}</p>
            </button>
          ))}
        </div>

        {currentTier !== selectedTier && (
          <div className="flex items-center gap-2 text-xs text-[#B0B0B0] bg-[#1c1c1c] rounded-xl px-4 py-3">
            <span className={`px-2 py-0.5 rounded-full font-medium ${TIER_COLORS[currentTier]}`}>{currentTier}</span>
            <span>→</span>
            <span className={`px-2 py-0.5 rounded-full font-medium ${TIER_COLORS[selectedTier]}`}>{selectedTier}</span>
          </div>
        )}

        <div>
          <p className="text-xs text-[#B0B0B0] uppercase tracking-wider mb-2">Reason for change</p>
          <input
            type="text"
            placeholder="e.g. Partnership deal, error correction..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
            className="w-full px-4 py-2.5 bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl text-white placeholder:text-[#555] focus:outline-none focus:border-[#c9a227] transition-colors text-sm"
          />
        </div>

        {error && (
          <p className="text-red-400 text-xs bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || !reason.trim()}
          className="w-full py-3 bg-[#c9a227] hover:bg-[#b8921f] disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Tag className="w-4 h-4" />}
          Set to {selectedTier}
        </button>
      </div>
    </div>
  )
}

// ─── Custom Offer Dialog ───────────────────────────────────────────────────────

function CustomOfferDialog({
  user,
  onClose,
  onSuccess,
}: {
  user: AdminUser
  onClose: () => void
  onSuccess: () => void
}) {
  const [name, setName] = useState('')
  const [priceDollars, setPriceDollars] = useState('')
  const [tokenAmount, setTokenAmount] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    const priceCents = Math.round(parseFloat(priceDollars || '0') * 100)
    const tokens = parseInt(tokenAmount || '0', 10)
    if (!name.trim()) { setError('Offer name is required'); return }
    if (isNaN(priceCents) || priceCents < 0) { setError('Invalid price'); return }
    if (!tokens || tokens < 1) { setError('Token amount must be at least 1'); return }

    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customOffer: {
            name: name.trim(),
            priceCents,
            tokenAmount: tokens,
            description: description.trim(),
          },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[#141414] border border-[#2a2a2a] rounded-2xl w-full max-w-md p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#c9a227]/10 border border-[#c9a227]/20 rounded-xl flex items-center justify-center">
              <Ticket className="w-4 h-4 text-[#c9a227]" />
            </div>
            <div>
              <h2 className="text-white font-bold text-base">Custom Offer</h2>
              <p className="text-[#B0B0B0] text-xs">{user.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#B0B0B0] hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-[#B0B0B0] uppercase tracking-wider block mb-1.5">Offer Name</label>
            <input
              type="text"
              placeholder="e.g. Black Friday Special, Loyalty Reward..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={200}
              className="w-full px-4 py-2.5 bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl text-white placeholder:text-[#555] focus:outline-none focus:border-[#c9a227] transition-colors text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#B0B0B0] uppercase tracking-wider block mb-1.5">Price (USD)</label>
              <input
                type="number"
                min={0}
                step={0.01}
                placeholder="19.99"
                value={priceDollars}
                onChange={(e) => setPriceDollars(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl text-white placeholder:text-[#555] focus:outline-none focus:border-[#c9a227] transition-colors text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-[#B0B0B0] uppercase tracking-wider block mb-1.5">Tokens</label>
              <input
                type="number"
                min={1}
                placeholder="5000"
                value={tokenAmount}
                onChange={(e) => setTokenAmount(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl text-white placeholder:text-[#555] focus:outline-none focus:border-[#c9a227] transition-colors text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-[#B0B0B0] uppercase tracking-wider block mb-1.5">Description (optional)</label>
            <textarea
              placeholder="Include any extra context for this offer..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
              rows={3}
              className="w-full px-4 py-2.5 bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl text-white placeholder:text-[#555] focus:outline-none focus:border-[#c9a227] transition-colors text-sm resize-none"
            />
          </div>
        </div>

        {priceDollars && tokenAmount && (
          <div className="bg-[#1c1c1c] rounded-xl px-4 py-3 text-sm flex items-center justify-between">
            <span className="text-[#B0B0B0]">Offer summary</span>
            <span className="text-[#c9a227] font-bold">
              ${parseFloat(priceDollars || '0').toFixed(2)} → {parseInt(tokenAmount || '0').toLocaleString()} tokens
            </span>
          </div>
        )}

        {error && (
          <p className="text-red-400 text-xs bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || !name.trim()}
          className="w-full py-3 bg-[#c9a227] hover:bg-[#b8921f] disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ticket className="w-4 h-4" />}
          Create Offer
        </button>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

type DialogState =
  | { type: 'gift'; user: AdminUser }
  | { type: 'tier'; user: AdminUser }
  | { type: 'offer'; user: AdminUser }
  | null

export default function AdminUsersPage() {
  const [data, setData] = useState<UserListResponse | null>(null)
  const [isDemo, setIsDemo] = useState(false)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL')
  const [page, setPage] = useState(1)
  const [actionUserId, setActionUserId] = useState<string | null>(null)
  const [tierDropdownId, setTierDropdownId] = useState<string | null>(null)
  const [actionsMenuId, setActionsMenuId] = useState<string | null>(null)
  const [dialog, setDialog] = useState<DialogState>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const actionsRef = useRef<HTMLDivElement | null>(null)

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

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (actionsRef.current && !actionsRef.current.contains(e.target as Node)) {
        setActionsMenuId(null)
        setTierDropdownId(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(null), 3500)
  }

  const handleBan = async (userId: string) => {
    if (isDemo) return
    setActionUserId(userId)
    try {
      const user = data?.users.find((u) => u.id === userId)
      const isBanned = !!user?.deletedAt
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ banned: !isBanned }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        showSuccess(`Error: ${(err as { error?: string }).error ?? `HTTP ${res.status}`}`)
        return
      }
      showSuccess(isBanned ? 'User unbanned' : 'User banned')
      await fetchUsers()
    } catch {
      showSuccess('Error: request failed')
    } finally {
      setActionUserId(null)
    }
  }

  const handleVerify = async (userId: string, currentVerified: boolean) => {
    if (isDemo) return
    setActionUserId(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verified: !currentVerified }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        showSuccess(`Error: ${(err as { error?: string }).error ?? `HTTP ${res.status}`}`)
        return
      }
      showSuccess(currentVerified ? 'Verification removed' : 'User verified')
      await fetchUsers()
    } catch {
      showSuccess('Error: request failed')
    } finally {
      setActionUserId(null)
    }
  }

  const handleChangeTier = async (userId: string, tier: SubscriptionTier) => {
    setTierDropdownId(null)
    if (isDemo) return
    setActionUserId(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        showSuccess(`Error: ${(err as { error?: string }).error ?? `HTTP ${res.status}`}`)
        return
      }
      showSuccess(`Tier set to ${tier}`)
      await fetchUsers()
    } catch {
      showSuccess('Error: request failed')
    } finally {
      setActionUserId(null)
    }
  }

  const totalPages = data ? Math.ceil(data.total / (data.pageSize || 20)) : 1

  return (
    <div className="space-y-6 p-6 max-w-[1600px] mx-auto">
      {/* Success toast */}
      {successMsg && (
        <div className="fixed top-4 right-4 z-50 bg-green-900/90 border border-green-700/50 text-green-300 text-sm px-4 py-3 rounded-xl shadow-xl flex items-center gap-2">
          <Check className="w-4 h-4" />
          {successMsg}
        </div>
      )}

      {/* Dialogs */}
      {dialog?.type === 'gift' && (
        <GiftTokensDialog
          user={dialog.user}
          onClose={() => setDialog(null)}
          onSuccess={(newBalance) => {
            setDialog(null)
            showSuccess(`Gifted tokens. New balance: ${newBalance.toLocaleString()}`)
            fetchUsers()
          }}
        />
      )}
      {dialog?.type === 'tier' && (
        <SetTierDialog
          user={dialog.user}
          onClose={() => setDialog(null)}
          onSuccess={() => {
            setDialog(null)
            showSuccess('Subscription tier updated')
            fetchUsers()
          }}
        />
      )}
      {dialog?.type === 'offer' && (
        <CustomOfferDialog
          user={dialog.user}
          onClose={() => setDialog(null)}
          onSuccess={() => {
            setDialog(null)
            showSuccess('Custom offer created')
          }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-[#B0B0B0] text-sm mt-1">
            {data ? `${data.total.toLocaleString()} total users` : '—'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isDemo && (
            <span className="text-xs px-2 py-1 bg-[#c9a227]/10 text-[#c9a227] border border-[#c9a227]/20 rounded-full">
              Demo data
            </span>
          )}
          <button
            onClick={fetchUsers}
            className="flex items-center gap-2 px-3 py-2 bg-[#141414] border border-[#1c1c1c] rounded-lg text-sm text-[#B0B0B0] hover:text-white hover:border-[#c9a227] transition-colors"
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
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-10 pr-4 py-3 bg-[#141414] border border-[#1c1c1c] rounded-xl text-white placeholder:text-[#B0B0B0] focus:outline-none focus:border-[#c9a227] transition-colors"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value as UserRole | 'ALL'); setPage(1) }}
          className="px-4 py-3 bg-[#141414] border border-[#1c1c1c] rounded-xl text-white focus:outline-none focus:border-[#c9a227] transition-colors text-sm"
        >
          <option value="ALL">All Roles</option>
          <option value="USER">User</option>
          <option value="CREATOR">Creator</option>
          <option value="MODERATOR">Moderator</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-[#141414] border border-[#1c1c1c] rounded-xl overflow-hidden" ref={actionsRef}>
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-[#1c1c1c]">
                {['User', 'Tier', 'Role', 'Tokens', 'Joined', 'Status', 'Verified', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#B0B0B0] uppercase tracking-wider">
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
                      <div className="w-6 h-6 border-2 border-[#c9a227] border-t-transparent rounded-full animate-spin" />
                    </div>
                  </td>
                </tr>
              ) : !data?.users.length ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-[#B0B0B0]">No users found</td>
                </tr>
              ) : (
                data.users.map((user) => {
                  const tier = user.subscription?.tier ?? 'FREE'
                  const isBanned = !!user.deletedAt
                  const isActing = actionUserId === user.id
                  const balance = user.tokenBalance?.balance ?? 0

                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-[#1a1a1a] transition-colors ${isBanned ? 'opacity-50' : ''}`}
                    >
                      {/* User */}
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="text-white text-sm font-medium">
                            {user.displayName || user.username || '—'}
                          </span>
                          <span className="text-[#B0B0B0] text-xs">{user.email}</span>
                        </div>
                      </td>

                      {/* Tier dropdown */}
                      <td className="px-4 py-4">
                        <div className="relative">
                          <button
                            onClick={() => setTierDropdownId(tierDropdownId === user.id ? null : user.id)}
                            disabled={isActing || isDemo}
                            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${TIER_COLORS[tier]} border border-transparent hover:border-[#c9a227]/40 transition-colors disabled:cursor-not-allowed`}
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

                      {/* Role */}
                      <td className="px-4 py-4">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${ROLE_COLORS[user.role]}`}>
                          {user.role}
                        </span>
                      </td>

                      {/* Tokens — colored by threshold */}
                      <td className="px-4 py-4">
                        <span className={`text-sm font-semibold tabular-nums ${
                          balance === 0 ? 'text-red-400' :
                          balance < 500 ? 'text-orange-400' :
                          balance > 10000 ? 'text-[#c9a227]' : 'text-white'
                        }`}>
                          {balance.toLocaleString()}
                        </span>
                      </td>

                      {/* Joined */}
                      <td className="px-4 py-4 text-xs text-[#B0B0B0]">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        {isBanned ? (
                          <span className="text-xs px-2 py-1 bg-red-900/40 text-red-400 rounded-full">Banned</span>
                        ) : (
                          <span className="text-xs px-2 py-1 bg-green-900/40 text-green-400 rounded-full">Active</span>
                        )}
                      </td>

                      {/* Verified */}
                      <td className="px-4 py-4">
                        {user.verified ? (
                          <span className="text-xs px-2 py-1 bg-blue-900/40 text-blue-300 rounded-full">Verified</span>
                        ) : (
                          <span className="text-xs px-2 py-1 bg-[#1c1c1c] text-[#B0B0B0] rounded-full">Unverified</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1">
                          {/* Gift tokens */}
                          <button
                            onClick={() => setDialog({ type: 'gift', user })}
                            disabled={isActing}
                            title="Gift tokens"
                            className="p-1.5 rounded-lg border border-[#1c1c1c] text-[#B0B0B0] hover:border-[#c9a227]/50 hover:text-[#c9a227] transition-colors disabled:opacity-40"
                          >
                            <Gift className="w-3.5 h-3.5" />
                          </button>

                          {/* Set tier */}
                          <button
                            onClick={() => setDialog({ type: 'tier', user })}
                            disabled={isActing}
                            title="Set subscription tier"
                            className="p-1.5 rounded-lg border border-[#1c1c1c] text-[#B0B0B0] hover:border-purple-500/50 hover:text-purple-400 transition-colors disabled:opacity-40"
                          >
                            <Tag className="w-3.5 h-3.5" />
                          </button>

                          {/* Custom offer */}
                          <button
                            onClick={() => setDialog({ type: 'offer', user })}
                            disabled={isActing}
                            title="Create custom offer"
                            className="p-1.5 rounded-lg border border-[#1c1c1c] text-[#B0B0B0] hover:border-green-500/50 hover:text-green-400 transition-colors disabled:opacity-40"
                          >
                            <Ticket className="w-3.5 h-3.5" />
                          </button>

                          {/* Verify */}
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

                          {/* Ban */}
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
            <p className="text-sm text-[#B0B0B0]">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 bg-[#1c1c1c] border border-[#1c1c1c] rounded-lg text-sm text-white disabled:opacity-40 hover:border-[#c9a227] transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 bg-[#1c1c1c] border border-[#1c1c1c] rounded-lg text-sm text-white disabled:opacity-40 hover:border-[#c9a227] transition-colors"
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
