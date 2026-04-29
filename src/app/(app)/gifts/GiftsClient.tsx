'use client'

import { useState, useEffect, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import { useToast } from '@/components/ui/toast-notification'

// ── Types ─────────────────────────────────────────────────────────────────────

type GiftType = 'subscription' | 'tokens'
type GiftStatus = 'pending' | 'redeemed' | 'expired'

interface GiftRecord {
  id: string
  createdAt: string
  type: GiftType
  itemLabel: string
  recipientEmail?: string
  senderEmail?: string
  status: GiftStatus
  code: string
}

interface GiftHistoryResponse {
  sent: GiftRecord[]
  received: GiftRecord[]
}

// ── Static data ───────────────────────────────────────────────────────────────

const SUBSCRIPTION_TIERS = [
  { value: 'BUILDER', label: 'Builder',  price: '$25/mo'  },
  { value: 'CREATOR', label: 'Creator',  price: '$50/mo'  },
  { value: 'PRO',     label: 'Pro',      price: '$150/mo' },
  { value: 'STUDIO',  label: 'Studio',   price: '$200/mo' },
] as const

const TOKEN_PACKS = [
  { value: 'starter', label: 'Starter — 1,000 tokens', price: '$10.00'  },
  { value: 'creator', label: 'Creator — 5,000 tokens', price: '$45.00'  },
  { value: 'pro',     label: 'Pro — 15,000 tokens',    price: '$120.00' },
] as const

// ── Tiny primitives ───────────────────────────────────────────────────────────

function Gold({ children }: { children: React.ReactNode }) {
  return <span style={{ color: '#D4AF37' }}>{children}</span>
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
      {children}
    </h2>
  )
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 ${className}`}
    >
      {children}
    </div>
  )
}

function StatusBadge({ status }: { status: GiftStatus }) {
  const styles: Record<GiftStatus, { bg: string; color: string; label: string }> = {
    pending: { bg: 'rgba(212,175,55,0.12)', color: '#D4AF37', label: 'Pending' },
    redeemed: { bg: 'rgba(52,211,153,0.12)', color: '#34d399', label: 'Redeemed' },
    expired: { bg: 'rgba(248,113,113,0.12)', color: '#f87171', label: 'Expired' },
  }
  const s = styles[status]
  return (
    <span
      className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  )
}

// ── Input / Select helpers ────────────────────────────────────────────────────

const inputCls =
  'w-full rounded-lg border border-white/[0.1] bg-white/[0.03] px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/20 transition-colors'

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputCls} ${props.className ?? ''}`} />
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`${inputCls} cursor-pointer ${props.className ?? ''}`}
      style={{ appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%236b7280'%3E%3Cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', backgroundSize: '16px', paddingRight: '2rem', ...(props.style ?? {}) }}
    />
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-medium text-gray-400 mb-1.5">{children}</p>
}

// ── Send a Gift section ───────────────────────────────────────────────────────

function SendGiftSection() {
  const { show } = useToast()
  const [giftType, setGiftType] = useState<GiftType>('subscription')
  const [subscriptionTier, setSubscriptionTier] = useState<string>('HOBBY')
  const [tokenPack, setTokenPack] = useState<string>('starter')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const selectedSub = SUBSCRIPTION_TIERS.find((t) => t.value === subscriptionTier)
  const selectedPack = TOKEN_PACKS.find((p) => p.value === tokenPack)
  const priceLabel = giftType === 'subscription' ? selectedSub?.price : selectedPack?.price

  async function handleSend() {
    if (!recipientEmail.trim()) {
      show({ variant: 'error', title: 'Recipient email is required.' })
      return
    }

    setLoading(true)
    try {
      const body = {
        type: giftType,
        ...(giftType === 'subscription' ? { tier: subscriptionTier } : { tokenPackSlug: tokenPack }),
        recipientEmail: recipientEmail.trim(),
        message: message.trim() || undefined,
      }

      const res = await fetch('/api/gifts/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data: { checkoutUrl?: string; error?: string } = await res.json()

      if (!res.ok) {
        show({ variant: 'error', title: data.error ?? 'Failed to create gift.' })
        return
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else {
        show({ variant: 'success', title: 'Gift created!', description: 'The recipient will receive an email.' })
        setRecipientEmail('')
        setMessage('')
      }
    } catch {
      show({ variant: 'error', title: 'Network error. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mb-10">
      <SectionHeading>
        <svg className="w-5 h-5" style={{ color: '#D4AF37' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
        </svg>
        Send a Gift
      </SectionHeading>

      {/* Gift type toggle */}
      <div className="flex gap-3 mb-5">
        {(['subscription', 'tokens'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setGiftType(t)}
            className="flex-1 rounded-xl border px-4 py-4 text-sm font-medium transition-all text-left"
            style={{
              borderColor: giftType === t ? '#D4AF37' : 'rgba(255,255,255,0.06)',
              background: giftType === t ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.02)',
              color: giftType === t ? '#D4AF37' : '#9ca3af',
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              {t === 'subscription' ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {t === 'subscription' ? 'Gift a Subscription' : 'Gift Tokens'}
            </div>
            <p className="text-xs opacity-60 font-normal">
              {t === 'subscription' ? 'Hobby, Creator, or Studio' : 'Token pack one-time purchase'}
            </p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Left column — item picker */}
        <Card>
          <Label>{giftType === 'subscription' ? 'Subscription Tier' : 'Token Pack'}</Label>
          {giftType === 'subscription' ? (
            <Select value={subscriptionTier} onChange={(e) => setSubscriptionTier(e.target.value)}>
              {SUBSCRIPTION_TIERS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label} — {t.price}
                </option>
              ))}
            </Select>
          ) : (
            <Select value={tokenPack} onChange={(e) => setTokenPack(e.target.value)}>
              {TOKEN_PACKS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label} — {p.price}
                </option>
              ))}
            </Select>
          )}
          {priceLabel && (
            <p className="mt-2 text-xs text-gray-500">
              Total charge: <Gold>{priceLabel}</Gold>
            </p>
          )}
        </Card>

        {/* Right column — recipient + message */}
        <Card>
          <div className="mb-3">
            <Label>Recipient Email</Label>
            <Input
              type="email"
              placeholder="friend@example.com"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
            />
          </div>
          <div>
            <Label>Personal Message (optional)</Label>
            <textarea
              className={`${inputCls} resize-none`}
              rows={3}
              maxLength={200}
              placeholder="Happy birthday! Enjoy building with ForjeGames..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <p className="text-right text-[10px] text-gray-600 mt-1">{message.length}/200</p>
          </div>
        </Card>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={handleSend}
          disabled={loading}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #B8962E 100%)', color: '#0a0a0a' }}
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Processing...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
              Send Gift
            </>
          )}
        </button>
      </div>
    </section>
  )
}

// ── Redeem a Gift section ─────────────────────────────────────────────────────

function RedeemGiftSection() {
  const { show } = useToast()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRedeem() {
    const trimmed = code.trim().toUpperCase()
    if (trimmed.length !== 8) {
      show({ variant: 'error', title: 'Gift code must be exactly 8 characters.' })
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/gifts/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trimmed }),
      })

      const data: { success?: boolean; giftType?: string; details?: { tier?: string; tokenAmount?: number; message?: string | null }; error?: string } = await res.json()

      if (!res.ok) {
        show({ variant: 'error', title: data.error ?? 'Failed to redeem gift.' })
        return
      }

      const successMsg =
        data.giftType === 'subscription' && data.details?.tier
          ? `Subscription activated — ${data.details.tier.charAt(0)}${data.details.tier.slice(1).toLowerCase()} Plan is now live!`
          : data.giftType === 'tokens' && data.details?.tokenAmount
            ? `${data.details.tokenAmount.toLocaleString()} tokens added to your account!`
            : 'Gift redeemed successfully!'
      show({ variant: 'success', title: successMsg })
      setCode('')
    } catch {
      show({ variant: 'error', title: 'Network error. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  function handleCodeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)
    setCode(val)
  }

  return (
    <section className="mb-10">
      <SectionHeading>
        <svg className="w-5 h-5" style={{ color: '#D4AF37' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
        Redeem a Gift
      </SectionHeading>

      <Card className="max-w-md">
        <Label>Gift Code</Label>
        <div className="flex gap-3">
          <input
            type="text"
            value={code}
            onChange={handleCodeChange}
            placeholder="XXXXXXXX"
            maxLength={8}
            className={`${inputCls} font-mono tracking-[0.25em] text-center uppercase`}
            style={{ letterSpacing: '0.25em' }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleRedeem() }}
          />
          <button
            onClick={handleRedeem}
            disabled={loading || code.length !== 8}
            className="flex-shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #B8962E 100%)', color: '#0a0a0a' }}
          >
            {loading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              'Redeem'
            )}
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-500">Enter the 8-character code from your gift email.</p>
      </Card>
    </section>
  )
}

// ── Gift History section ──────────────────────────────────────────────────────

function GiftHistorySection() {
  const [activeTab, setActiveTab] = useState<'sent' | 'received'>('sent')
  const [history, setHistory] = useState<GiftHistoryResponse>({ sent: [], received: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHistory = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/gifts')
      if (!res.ok) throw new Error('Failed to load gift history.')
      const data: GiftHistoryResponse = await res.json()
      setHistory(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchHistory()
  }, [fetchHistory])

  const rows = activeTab === 'sent' ? history.sent : history.received

  return (
    <section>
      <SectionHeading>
        <svg className="w-5 h-5" style={{ color: '#D4AF37' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        Gift History
      </SectionHeading>

      {/* Tabs */}
      <div className="flex gap-1 mb-4">
        {(['sent', 'received'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize border ${
              activeTab === tab
                ? 'bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20'
                : 'text-gray-500 hover:text-white border-transparent hover:bg-white/[0.04]'
            }`}
          >
            {tab}
            <span
              className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full"
              style={{
                background: activeTab === tab ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.05)',
                color: activeTab === tab ? '#D4AF37' : '#4b5563',
              }}
            >
              {tab === 'sent' ? history.sent.length : history.received.length}
            </span>
          </button>
        ))}
      </div>

      <Card className="overflow-hidden p-0">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-500 text-sm">
            <svg className="w-5 h-5 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading history...
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-16 text-red-400 text-sm gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500 text-sm gap-2">
            <svg className="w-8 h-8 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
            No {activeTab} gifts yet.
          </div>
        ) : (
          <>
            {/* Table header */}
            <div
              className="grid text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-2.5 border-b border-white/[0.06]"
              style={{ gridTemplateColumns: '1fr 1fr 1.5fr auto auto' }}
            >
              <span>Date</span>
              <span>Type</span>
              <span>{activeTab === 'sent' ? 'Recipient' : 'From'}</span>
              <span className="text-center">Code</span>
              <span className="text-right">Status</span>
            </div>

            {rows.map((row, i) => (
              <div
                key={row.id}
                className="grid items-center px-5 py-3 text-sm border-b border-white/[0.04] last:border-b-0 transition-colors hover:bg-white/[0.02]"
                style={{ gridTemplateColumns: '1fr 1fr 1.5fr auto auto' }}
              >
                <span className="text-gray-400 text-xs">
                  {new Date(row.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>

                <span className="text-gray-300 text-xs font-medium capitalize">
                  {row.type === 'subscription' ? (
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                      {row.itemLabel}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      {row.itemLabel}
                    </span>
                  )}
                </span>

                <span className="text-gray-400 text-xs truncate pr-3">
                  {activeTab === 'sent' ? row.recipientEmail : row.senderEmail}
                </span>

                <span
                  className="font-mono text-xs tracking-widest text-center px-2"
                  style={{ color: '#D4AF37', letterSpacing: '0.15em' }}
                >
                  {row.code}
                </span>

                <div className="flex justify-end">
                  <StatusBadge status={row.status} />
                </div>
              </div>
            ))}
          </>
        )}
      </Card>
    </section>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function GiftsPage() {
  const { isLoaded, isSignedIn } = useUser()

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#050810] flex items-center justify-center">
        <svg className="w-6 h-6 animate-spin text-[#D4AF37]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-[#050810] flex items-center justify-center text-gray-400 text-sm">
        Please sign in to access gifts.
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050810]">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Gifts</h1>
          <p className="text-gray-400 mt-1 text-sm">Send subscriptions or token packs to other ForjeGames users.</p>
        </div>

        <SendGiftSection />
        <RedeemGiftSection />
        <GiftHistorySection />
      </div>
    </div>
  )
}
