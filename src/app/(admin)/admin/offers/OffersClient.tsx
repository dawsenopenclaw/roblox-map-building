'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Ticket,
  RefreshCw,
  Plus,
  X,
  Loader2,
  Check,
  Search,
  Send,
  Clock,
  ShoppingCart,
} from 'lucide-react'

interface CustomOffer {
  id: string
  offerId: string
  name: string
  priceCents: number
  tokenAmount: number
  description: string
  targetUserId: string
  status: 'PENDING' | 'SENT' | 'PURCHASED' | 'EXPIRED'
  createdAt: string
  createdBy: string | null
}

interface UserSearchResult {
  id: string
  email: string
  displayName: string | null
  username: string | null
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-yellow-900/30 text-yellow-400 border border-yellow-800/30',
  SENT: 'bg-blue-900/30 text-blue-400 border border-blue-800/30',
  PURCHASED: 'bg-green-900/30 text-green-400 border border-green-800/30',
  EXPIRED: 'bg-[#1c1c1c] text-[#555] border border-[#2a2a2a]',
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  PENDING: <Clock className="w-3 h-3" />,
  SENT: <Send className="w-3 h-3" />,
  PURCHASED: <ShoppingCart className="w-3 h-3" />,
  EXPIRED: <X className="w-3 h-3" />,
}

const DEMO_OFFERS: CustomOffer[] = [
  { id: '1', offerId: 'offer_1', name: 'Black Friday Special', priceCents: 1999, tokenAmount: 5000, description: 'Limited time offer for loyal users', targetUserId: 'u1', status: 'SENT', createdAt: '2026-03-20T10:00:00Z', createdBy: 'dawsenporter@example.com' },
  { id: '2', offerId: 'offer_2', name: 'Bug Compensation Pack', priceCents: 0, tokenAmount: 2000, description: 'Free tokens for downtime', targetUserId: 'u2', status: 'PURCHASED', createdAt: '2026-03-22T14:00:00Z', createdBy: 'dawsenporter@example.com' },
  { id: '3', offerId: 'offer_3', name: 'Partner Deal — Studio', priceCents: 4900, tokenAmount: 20000, description: 'Discounted Studio tier tokens', targetUserId: 'u3', status: 'PENDING', createdAt: '2026-04-01T09:00:00Z', createdBy: 'dawsenporter@example.com' },
  { id: '4', offerId: 'offer_4', name: 'Early Bird Promo', priceCents: 999, tokenAmount: 1500, description: '', targetUserId: 'u4', status: 'EXPIRED', createdAt: '2026-02-10T08:00:00Z', createdBy: 'dawsenporter@example.com' },
]

function formatPrice(cents: number) {
  if (cents === 0) return 'Free'
  return `$${(cents / 100).toFixed(2)}`
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${days}d ago`
}

// ─── Create Offer Panel ────────────────────────────────────────────────────────

function CreateOfferPanel({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState('')
  const [priceDollars, setPriceDollars] = useState('')
  const [tokenAmount, setTokenAmount] = useState('')
  const [description, setDescription] = useState('')
  const [expiresInDays, setExpiresInDays] = useState('30')
  const [userSearch, setUserSearch] = useState('')
  const [userResults, setUserResults] = useState<UserSearchResult[]>([])
  const [selectedUsers, setSelectedUsers] = useState<UserSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const searchUsers = useCallback(async (q: string) => {
    if (!q.trim()) { setUserResults([]); return }
    setSearching(true)
    try {
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(q)}&limit=8`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setUserResults(data.users ?? [])
    } catch {
      setUserResults([])
    } finally {
      setSearching(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => searchUsers(userSearch), 300)
    return () => clearTimeout(t)
  }, [userSearch, searchUsers])

  const addUser = (u: UserSearchResult) => {
    if (!selectedUsers.find((s) => s.id === u.id)) {
      setSelectedUsers((prev) => [...prev, u])
    }
    setUserSearch('')
    setUserResults([])
  }

  const removeUser = (id: string) => setSelectedUsers((prev) => prev.filter((u) => u.id !== id))

  const handleSubmit = async () => {
    const priceCents = Math.round(parseFloat(priceDollars || '0') * 100)
    const tokens = parseInt(tokenAmount || '0', 10)
    if (!name.trim()) { setError('Offer name is required'); return }
    if (isNaN(priceCents) || priceCents < 0) { setError('Invalid price'); return }
    if (!tokens || tokens < 1) { setError('Token amount must be at least 1'); return }
    if (selectedUsers.length === 0) { setError('Select at least one target user'); return }

    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          priceCents,
          tokenAmount: tokens,
          description: description.trim(),
          targetUserIds: selectedUsers.map((u) => u.id),
          expiresInDays: parseInt(expiresInDays || '30', 10),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setSuccess(true)
      setName(''); setPriceDollars(''); setTokenAmount(''); setDescription('')
      setSelectedUsers([]); setExpiresInDays('30')
      setTimeout(() => { setSuccess(false); onCreated() }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-[#141414] border border-[#1c1c1c] rounded-2xl p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-[#c9a227]/10 border border-[#c9a227]/20 rounded-xl flex items-center justify-center">
          <Plus className="w-4 h-4 text-[#c9a227]" />
        </div>
        <h2 className="text-white font-bold text-base">Create Custom Offer</h2>
      </div>

      {/* Fields */}
      <div className="space-y-4">
        <div>
          <label className="text-xs text-[#B0B0B0] uppercase tracking-wider block mb-1.5">Offer Name</label>
          <input
            type="text"
            placeholder="e.g. Black Friday Special"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={200}
            className="w-full px-4 py-2.5 bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl text-white placeholder:text-[#555] focus:outline-none focus:border-[#c9a227] transition-colors text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-[#B0B0B0] uppercase tracking-wider block mb-1.5">Price (USD)</label>
            <input
              type="number"
              min={0}
              step={0.01}
              placeholder="19.99 (0 = free)"
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
            placeholder="Any extra context for this offer..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={1000}
            rows={2}
            className="w-full px-4 py-2.5 bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl text-white placeholder:text-[#555] focus:outline-none focus:border-[#c9a227] transition-colors text-sm resize-none"
          />
        </div>

        <div>
          <label className="text-xs text-[#B0B0B0] uppercase tracking-wider block mb-1.5">Expires In (days)</label>
          <input
            type="number"
            min={1}
            max={365}
            value={expiresInDays}
            onChange={(e) => setExpiresInDays(e.target.value)}
            className="w-full px-4 py-2.5 bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl text-white placeholder:text-[#555] focus:outline-none focus:border-[#c9a227] transition-colors text-sm"
          />
        </div>

        {/* User search */}
        <div>
          <label className="text-xs text-[#B0B0B0] uppercase tracking-wider block mb-1.5">Target Users</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B0B0B0]" />
            <input
              type="text"
              placeholder="Search by email or username..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl text-white placeholder:text-[#555] focus:outline-none focus:border-[#c9a227] transition-colors text-sm"
            />
            {searching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B0B0B0] animate-spin" />
            )}
          </div>

          {/* Search results */}
          {userResults.length > 0 && (
            <div className="mt-1 bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl overflow-hidden shadow-xl">
              {userResults.map((u) => (
                <button
                  key={u.id}
                  onClick={() => addUser(u)}
                  className="w-full text-left px-4 py-2.5 hover:bg-[#2a2a2a] transition-colors flex items-center gap-3"
                >
                  <div className="w-6 h-6 bg-[#c9a227]/10 rounded-full flex items-center justify-center text-xs font-bold text-[#c9a227] flex-shrink-0">
                    {(u.email[0] ?? '?').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">{u.displayName || u.username || u.email}</p>
                    <p className="text-[#B0B0B0] text-xs truncate">{u.email}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Selected users */}
          {selectedUsers.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedUsers.map((u) => (
                <span
                  key={u.id}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-[#c9a227]/10 border border-[#c9a227]/20 rounded-full text-xs text-[#c9a227]"
                >
                  {u.displayName || u.username || u.email}
                  <button onClick={() => removeUser(u.id)} className="hover:text-white transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      {name && priceDollars && tokenAmount && selectedUsers.length > 0 && (
        <div className="bg-[#1c1c1c] rounded-xl px-4 py-3 text-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[#B0B0B0]">Offer</span>
            <span className="text-white font-medium">{name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#B0B0B0]">Price → Tokens</span>
            <span className="text-[#c9a227] font-bold">
              {formatPrice(Math.round(parseFloat(priceDollars) * 100))} → {parseInt(tokenAmount).toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#B0B0B0]">Recipients</span>
            <span className="text-white">{selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''}</span>
          </div>
        </div>
      )}

      {error && (
        <p className="text-red-400 text-xs bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || success}
        className="w-full py-3 bg-[#c9a227] hover:bg-[#b8921f] disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : success ? (
          <Check className="w-4 h-4" />
        ) : (
          <Ticket className="w-4 h-4" />
        )}
        {success ? 'Created!' : 'Create Offer'}
      </button>
    </div>
  )
}

// ─── Offer Row ─────────────────────────────────────────────────────────────────

function OfferRow({ offer, onStatusChange }: { offer: CustomOffer; onStatusChange: () => void }) {
  const [updating, setUpdating] = useState(false)

  const markAs = async (status: string) => {
    setUpdating(true)
    try {
      await fetch('/api/admin/offers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logId: offer.id, status }),
      })
      onStatusChange()
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="flex items-start gap-4 p-4 hover:bg-[#1a1a1a] transition-colors rounded-xl">
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-white font-semibold text-sm">{offer.name}</span>
          <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[offer.status] ?? STATUS_STYLES.PENDING}`}>
            {STATUS_ICONS[offer.status]}
            {offer.status}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-[#B0B0B0] flex-wrap">
          <span className="text-[#c9a227] font-bold">{formatPrice(offer.priceCents)}</span>
          <span>→</span>
          <span className="text-white">{offer.tokenAmount.toLocaleString()} tokens</span>
          {offer.description && <span className="text-[#555] truncate max-w-[200px]">{offer.description}</span>}
        </div>
        <p className="text-xs text-[#555]">{timeAgo(offer.createdAt)} by {offer.createdBy ?? 'admin'}</p>
      </div>

      {/* Status actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {offer.status === 'PENDING' && (
          <button
            onClick={() => markAs('SENT')}
            disabled={updating}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-900/20 border border-blue-800/30 text-blue-400 hover:bg-blue-900/40 rounded-lg text-xs font-medium transition-colors disabled:opacity-40"
          >
            {updating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
            Mark Sent
          </button>
        )}
        {offer.status === 'SENT' && (
          <>
            <button
              onClick={() => markAs('PURCHASED')}
              disabled={updating}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-green-900/20 border border-green-800/30 text-green-400 hover:bg-green-900/40 rounded-lg text-xs font-medium transition-colors disabled:opacity-40"
            >
              <ShoppingCart className="w-3 h-3" />
              Purchased
            </button>
            <button
              onClick={() => markAs('EXPIRED')}
              disabled={updating}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#1c1c1c] border border-[#2a2a2a] text-[#B0B0B0] hover:border-red-800/40 hover:text-red-400 rounded-lg text-xs font-medium transition-colors disabled:opacity-40"
            >
              <X className="w-3 h-3" />
              Expire
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export default function OffersClient() {
  const [offers, setOffers] = useState<CustomOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [isDemo, setIsDemo] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  const fetchOffers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/offers?limit=100')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setOffers(data.offers ?? [])
      setIsDemo(false)
    } catch {
      setOffers(DEMO_OFFERS)
      setIsDemo(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchOffers() }, [fetchOffers])

  const filtered = statusFilter === 'ALL' ? offers : offers.filter((o) => o.status === statusFilter)

  const counts = {
    ALL: offers.length,
    PENDING: offers.filter((o) => o.status === 'PENDING').length,
    SENT: offers.filter((o) => o.status === 'SENT').length,
    PURCHASED: offers.filter((o) => o.status === 'PURCHASED').length,
    EXPIRED: offers.filter((o) => o.status === 'EXPIRED').length,
  }

  return (
    <div className="space-y-6 p-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Custom Offers</h1>
          <p className="text-[#B0B0B0] text-sm mt-1">Create and track personalised pricing for users</p>
        </div>
        <div className="flex items-center gap-2">
          {isDemo && (
            <span className="text-xs px-2 py-1 bg-[#c9a227]/10 text-[#c9a227] border border-[#c9a227]/20 rounded-full">
              Demo data
            </span>
          )}
          <button
            onClick={fetchOffers}
            className="flex items-center gap-2 px-3 py-2 bg-[#141414] border border-[#1c1c1c] rounded-lg text-sm text-[#B0B0B0] hover:text-white hover:border-[#c9a227] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Create panel */}
        <div className="xl:col-span-1">
          <CreateOfferPanel onCreated={fetchOffers} />
        </div>

        {/* Offers list */}
        <div className="xl:col-span-2 space-y-4">
          {/* Status filter tabs */}
          <div className="flex gap-1 bg-[#141414] border border-[#1c1c1c] rounded-xl p-1">
            {(['ALL', 'PENDING', 'SENT', 'PURCHASED', 'EXPIRED'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  statusFilter === s
                    ? 'bg-[#c9a227] text-black'
                    : 'text-[#B0B0B0] hover:text-white'
                }`}
              >
                {s} {counts[s as keyof typeof counts] > 0 && (
                  <span className={`ml-1 ${statusFilter === s ? 'text-black/60' : 'text-[#555]'}`}>
                    {counts[s as keyof typeof counts]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="bg-[#141414] border border-[#1c1c1c] rounded-2xl overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 border-2 border-[#c9a227] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center">
                <Ticket className="w-8 h-8 text-[#333] mx-auto mb-3" />
                <p className="text-[#B0B0B0] text-sm">No offers found</p>
                <p className="text-[#555] text-xs mt-1">Create one using the form on the left</p>
              </div>
            ) : (
              <div className="divide-y divide-[#1c1c1c]">
                {filtered.map((offer) => (
                  <OfferRow key={offer.id} offer={offer} onStatusChange={fetchOffers} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
