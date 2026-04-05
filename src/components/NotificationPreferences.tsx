'use client'

import { useState, useEffect, useCallback } from 'react'

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

const CHANNEL_LABELS: Record<Channel, { label: string; icon: React.ReactNode }> = {
  IN_APP: {
    label: 'In-App',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
  EMAIL: {
    label: 'Email',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  SMS: {
    label: 'SMS',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  },
  PUSH: {
    label: 'Push',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
}

const CATEGORIES = ['Builds', 'Account', 'Earnings', 'Social', 'General'] as const

const CHANNELS: Channel[] = ['IN_APP', 'EMAIL', 'SMS', 'PUSH']

// ─── Toggle component ────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  disabled,
  size = 'sm',
}: {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
  size?: 'sm' | 'md'
}) {
  const w = size === 'sm' ? 'w-8' : 'w-10'
  const h = size === 'sm' ? 'h-[18px]' : 'h-5'
  const dot = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'
  const translate = checked ? (size === 'sm' ? 'translate-x-[14px]' : 'translate-x-5') : 'translate-x-0.5'

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`
        relative inline-flex ${w} ${h} items-center rounded-full transition-colors
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
        ${checked ? 'bg-[#D4AF37]' : 'bg-white/10'}
      `}
    >
      <span
        className={`
          inline-block ${dot} rounded-full bg-white shadow transition-transform
          ${translate}
        `}
      />
    </button>
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

  // Fetch preferences
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

  // Toggle a single preference
  const handleToggle = useCallback(async (type: NotificationType, channel: Channel, enabled: boolean) => {
    if (!data) return

    // Optimistic update
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
      // Revert on error
      fetchPrefs()
    }
  }, [data, fetchPrefs])

  // Save phone number
  const handleSavePhone = useCallback(async () => {
    setSaving(true)
    setError(null)
    setSuccessMsg(null)

    try {
      const res = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.trim() || null,
        }),
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
      <div className="animate-pulse space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-white/5 rounded-lg" />
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
    <div className="space-y-6">
      {/* SMS phone number setup */}
      <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-white">SMS Notifications</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Add your phone number to receive critical alerts via text message
            </p>
          </div>
          {CHANNEL_LABELS.SMS.icon}
        </div>

        {phoneEditing ? (
          <div className="flex gap-2 items-center">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+15551234567"
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-[#D4AF37]/50 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/25"
            />
            <button
              onClick={handleSavePhone}
              disabled={saving}
              className="px-3 py-2 bg-[#D4AF37] text-black text-xs font-semibold rounded-lg hover:bg-[#D4AF37]/90 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => { setPhoneEditing(false); setPhone(data.phone || '') }}
              className="px-3 py-2 text-gray-400 text-xs hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            {data.hasPhone ? (
              <>
                <span className="text-sm text-gray-300 font-mono">
                  {data.phone?.replace(/(\+\d{1,3})\d{4,}(\d{4})/, '$1****$2')}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">
                  Active
                </span>
              </>
            ) : (
              <span className="text-sm text-gray-500">No phone number configured</span>
            )}
            <button
              onClick={() => setPhoneEditing(true)}
              className="ml-auto text-xs text-[#D4AF37] hover:text-[#D4AF37]/80 transition-colors font-medium"
            >
              {data.hasPhone ? 'Change' : 'Add phone'}
            </button>
          </div>
        )}
      </div>

      {/* Status messages */}
      {error && (
        <div className="px-4 py-2.5 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-400">
          {successMsg}
        </div>
      )}

      {/* Channel legend */}
      <div className="flex items-center gap-4 px-1">
        {CHANNELS.map((ch) => (
          <div key={ch} className="flex items-center gap-1.5 text-xs text-gray-400">
            <span className="text-gray-500">{CHANNEL_LABELS[ch].icon}</span>
            <span>{CHANNEL_LABELS[ch].label}</span>
          </div>
        ))}
      </div>

      {/* Preferences by category */}
      {CATEGORIES.map((cat) => {
        const types = typesInCategory(cat)
        if (types.length === 0) return null

        return (
          <div key={cat} className="space-y-1">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 mb-2">
              {cat}
            </h3>
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl overflow-hidden divide-y divide-white/[0.05]">
              {types.map(([type, info]) => (
                <div key={type} className="px-4 py-3.5 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{info.label}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{info.description}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {CHANNELS.map((ch) => {
                      const enabled = data.preferences[type]?.[ch] ?? false
                      const isSmsDisabled = ch === 'SMS' && !data.hasPhone

                      return (
                        <div key={ch} className="flex flex-col items-center gap-1">
                          <Toggle
                            checked={enabled}
                            onChange={(v) => handleToggle(type, ch, v)}
                            disabled={isSmsDisabled}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {/* Note */}
      <p className="text-[11px] text-gray-600 px-1">
        In-app notifications are always delivered. SMS requires a verified phone number.
        Standard messaging rates may apply.
      </p>
    </div>
  )
}
