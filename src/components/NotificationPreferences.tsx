'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronDown } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

type NotificationType =
  | 'BUILD_COMPLETE' | 'BUILD_FAILED' | 'TOKEN_LOW' | 'TOKEN_DEPLETED'
  | 'SALE' | 'REFERRAL_EARNED' | 'TEAM_INVITE' | 'ACHIEVEMENT_UNLOCKED'
  | 'SYSTEM' | 'WEEKLY_DIGEST' | 'TEMPLATE_PURCHASED' | 'PAYOUT_COMPLETED'
  | 'REVIEW_RECEIVED' | 'PAYOUT_FAILED'

type Channel = 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP'

type PreferenceMap = Record<NotificationType, Record<Channel, boolean>>

interface PreferencesData {
  preferences: PreferenceMap
  phone: string | null
  hasPhone: boolean
  marketingEmailsOptOut: boolean
}

// ─── Config ──────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<NotificationType, { label: string; description: string; category: string }> = {
  BUILD_COMPLETE:       { label: 'Build complete',       description: 'When your AI build finishes successfully',     category: 'Builds' },
  BUILD_FAILED:         { label: 'Build failed',         description: 'When a build encounters an error',             category: 'Builds' },
  TOKEN_LOW:            { label: 'Low tokens',           description: 'When your token balance drops below threshold', category: 'Account' },
  TOKEN_DEPLETED:       { label: 'Tokens depleted',      description: 'When you run out of tokens',                   category: 'Account' },
  SALE:                 { label: 'Template sold',        description: 'When someone purchases your template',         category: 'Earnings' },
  REFERRAL_EARNED:      { label: 'Referral converted',   description: 'When someone signs up with your referral',     category: 'Earnings' },
  TEAM_INVITE:          { label: 'Team invite',          description: 'When you\'re invited to join a team',          category: 'Social' },
  ACHIEVEMENT_UNLOCKED: { label: 'Achievement unlocked', description: 'When you earn a new achievement',              category: 'Social' },
  SYSTEM:               { label: 'System updates',       description: 'Important platform announcements',             category: 'General' },
  WEEKLY_DIGEST:        { label: 'Weekly digest',        description: 'Your weekly stats and trending templates',     category: 'General' },
  TEMPLATE_PURCHASED:   { label: 'Template purchased',   description: 'When someone buys your template',              category: 'Earnings' },
  PAYOUT_COMPLETED:     { label: 'Payout completed',     description: 'When your earnings payout is processed',       category: 'Earnings' },
  REVIEW_RECEIVED:      { label: 'Review received',      description: 'When someone reviews your template',           category: 'Social' },
  PAYOUT_FAILED:        { label: 'Payout failed',        description: 'When a payout fails and needs attention',      category: 'Earnings' },
}

const CATEGORY_ICONS: Record<string, string> = {
  Builds: '🔨',
  Account: '👤',
  Earnings: '💰',
  Social: '💬',
  General: '📢',
}

const CHANNEL_LABELS: Record<Channel, { label: string; short: string }> = {
  IN_APP: { label: 'In-App', short: 'App' },
  EMAIL:  { label: 'Email',  short: 'Email' },
  SMS:    { label: 'SMS',    short: 'SMS' },
  PUSH:   { label: 'Push',   short: 'Push' },
}

const CATEGORIES = ['Builds', 'Account', 'Earnings', 'Social', 'General'] as const

const CHANNELS: Channel[] = ['IN_APP', 'EMAIL', 'SMS', 'PUSH']

// ─── Toggle component ────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`
        relative inline-flex w-8 h-[18px] items-center rounded-full transition-colors
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
        ${checked ? 'bg-[#D4AF37]' : 'bg-white/10'}
      `}
    >
      <span
        className={`
          inline-block w-3.5 h-3.5 rounded-full bg-white shadow transition-transform
          ${checked ? 'translate-x-[14px]' : 'translate-x-0.5'}
        `}
      />
    </button>
  )
}

// ─── Category section (collapsible) ─────────────────────────────────────────

function CategorySection({
  category,
  types,
  preferences,
  hasPhone,
  onToggle,
  defaultOpen,
}: {
  category: string
  types: [NotificationType, { label: string; description: string }][]
  preferences: PreferenceMap
  hasPhone: boolean
  onToggle: (type: NotificationType, channel: Channel, enabled: boolean) => void
  defaultOpen: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  // Count how many channels are enabled across all types in this category
  const enabledCount = types.reduce((sum, [type]) => {
    return sum + CHANNELS.reduce((chSum, ch) => chSum + (preferences[type]?.[ch] ? 1 : 0), 0)
  }, 0)
  const totalCount = types.length * CHANNELS.length

  return (
    <div className="rounded-xl border border-white/[0.06] overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
      >
        <span className="text-base">{CATEGORY_ICONS[category] ?? '📋'}</span>
        <span className="text-sm font-semibold text-white flex-1 text-left">{category}</span>
        <span className="text-[10px] text-gray-500 tabular-nums">{enabledCount}/{totalCount}</span>
        <ChevronDown size={14} className={`text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="divide-y divide-white/[0.04]">
          {/* Column headers */}
          <div className="px-4 py-2 flex items-center gap-2 bg-white/[0.01]">
            <div className="flex-1" />
            <div className="flex items-center gap-2 flex-shrink-0">
              {CHANNELS.map(ch => (
                <span key={ch} className="w-8 text-center text-[9px] font-bold text-gray-600 uppercase tracking-wider">
                  {CHANNEL_LABELS[ch].short}
                </span>
              ))}
            </div>
          </div>

          {types.map(([type, info]) => (
            <div key={type} className="px-4 py-2.5 flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-gray-200 leading-tight">{info.label}</p>
                <p className="text-[10px] text-gray-600 mt-0.5 leading-tight hidden sm:block">{info.description}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {CHANNELS.map(ch => (
                  <div key={ch} className="w-8 flex justify-center">
                    <Toggle
                      checked={preferences[type]?.[ch] ?? false}
                      onChange={(v) => onToggle(type, ch, v)}
                      disabled={ch === 'SMS' && !hasPhone}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

export function NotificationPreferences() {
  const [data, setData] = useState<PreferencesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [phone, setPhone] = useState('')
  const [phoneEditing, setPhoneEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const fetchPrefs = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications/preferences')
      if (!res.ok) throw new Error('Failed to load')
      const result: PreferencesData = await res.json()
      setData(result)
      setPhone(result.phone || '')
    } catch {
      setError('Failed to load notification preferences')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPrefs() }, [fetchPrefs])

  const handleToggle = useCallback(async (type: NotificationType, channel: Channel, enabled: boolean) => {
    if (!data) return

    setData((prev) => {
      if (!prev) return prev
      const next = { ...prev, preferences: { ...prev.preferences } }
      next.preferences[type] = { ...next.preferences[type], [channel]: enabled }
      return next
    })

    try {
      await fetch('/api/notifications/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, channel, enabled }),
      })
    } catch {
      fetchPrefs()
    }
  }, [data, fetchPrefs])

  const handleSavePhone = useCallback(async () => {
    setSaving(true)
    setError(null)
    setSuccessMsg(null)

    try {
      const res = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() || null }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to save')
      }

      const result: PreferencesData = await res.json()
      setData(result)
      setPhoneEditing(false)
      setSuccessMsg('Phone number updated')
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save phone number')
    } finally {
      setSaving(false)
    }
  }, [phone])

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-12 bg-white/5 rounded-xl" />
        ))}
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p>{error || 'Unable to load preferences'}</p>
        <button onClick={fetchPrefs} className="mt-2 text-[#D4AF37] text-sm hover:underline">
          Retry
        </button>
      </div>
    )
  }

  const typesInCategory = (cat: string) =>
    (Object.entries(TYPE_LABELS) as [NotificationType, typeof TYPE_LABELS[NotificationType]][])
      .filter(([, v]) => v.category === cat)

  return (
    <div className="space-y-4">
      {/* SMS setup — compact */}
      <div className="rounded-xl border border-white/[0.06] p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white">SMS Alerts</p>
              {!phoneEditing && (
                <p className="text-[11px] text-gray-500 truncate">
                  {data.hasPhone ? (
                    <span className="text-gray-400 font-mono">{data.phone?.replace(/(\+\d{1,3})\d{4,}(\d{4})/, '$1****$2')}</span>
                  ) : (
                    'No phone number set'
                  )}
                </p>
              )}
            </div>
          </div>
          {!phoneEditing && (
            <button
              onClick={() => setPhoneEditing(true)}
              className="text-xs font-medium text-[#D4AF37] hover:text-[#E6A519] transition-colors flex-shrink-0"
            >
              {data.hasPhone ? 'Change' : 'Add'}
            </button>
          )}
        </div>

        {phoneEditing && (
          <div className="flex gap-2 items-center mt-3">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+15551234567"
              autoFocus
              className="flex-1 bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-[#D4AF37]/50 focus:outline-none"
            />
            <button
              onClick={handleSavePhone}
              disabled={saving}
              className="px-3 py-2 bg-[#D4AF37] text-black text-xs font-bold rounded-lg hover:bg-[#D4AF37]/90 disabled:opacity-50 transition-colors"
            >
              {saving ? '...' : 'Save'}
            </button>
            <button
              onClick={() => { setPhoneEditing(false); setPhone(data.phone || '') }}
              className="px-2 py-2 text-gray-500 text-xs hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Status messages */}
      {error && (
        <div className="px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-400">
          {successMsg}
        </div>
      )}

      {/* Collapsible categories */}
      {CATEGORIES.map((cat, i) => {
        const types = typesInCategory(cat)
        if (types.length === 0) return null
        return (
          <CategorySection
            key={cat}
            category={cat}
            types={types}
            preferences={data.preferences}
            hasPhone={data.hasPhone}
            onToggle={handleToggle}
            defaultOpen={i < 2}
          />
        )
      })}

      <p className="text-[10px] text-gray-600 px-1">
        In-app notifications are always delivered. SMS requires a verified phone number.
      </p>
    </div>
  )
}
