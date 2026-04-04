'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import useSWR from 'swr'
import { NotificationPreferences } from '@/components/NotificationPreferences'
import { useTheme as useThemeHook } from '@/components/ThemeProvider'
import {
  User,
  Key,
  Bell,
  Palette,
  Link2,
  Trash2,
  Plus,
  Copy,
  Eye,
  EyeOff,
  Github,
  Sun,
  Moon,
  Check,
  Upload,
  TrendingUp,
  Zap,
  ChevronDown,
  CreditCard,
  Plug,
  Download,
  BarChart,
  Twitter,
  MessageCircle,
  AtSign,
  Sparkles,
} from 'lucide-react'

const fetcher = (url: string) => fetch(url).then(r => r.json())

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'profile' | 'billing' | 'studio' | 'api-keys' | 'notifications' | 'appearance' | 'connected'

type ApiKey = {
  id: string
  name: string
  prefix: string
  createdAt: string
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium shadow-xl border ${
        type === 'success'
          ? 'bg-[#141414] border-green-500/30 text-green-300'
          : 'bg-[#141414] border-red-500/30 text-red-300'
      }`}
    >
      {type === 'success' ? <Check size={14} /> : <Trash2 size={14} />}
      {message}
    </div>
  )
}

function useToast() {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const show = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }
  return { toast, show }
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean
  onChange: () => void
  disabled?: boolean
}) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      aria-pressed={checked}
      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
        checked ? 'bg-[#FFB81C]' : 'bg-white/15'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function AvatarUpload({ name, onError }: { name: string; onError?: (msg: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      onError?.('Please upload an image file.')
      e.target.value = ''
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      onError?.('File too large. Max 5MB.')
      e.target.value = ''
      return
    }
    setPreview(URL.createObjectURL(file))
  }

  return (
    <div className="flex items-center gap-5">
      <div className="relative group">
        <label
          htmlFor="avatar-upload"
          className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#FFB81C]/30 to-[#FFB81C]/10 border border-[#FFB81C]/20 cursor-pointer"
          aria-label="Upload avatar image"
        >
          {preview ? (
            <Image src={preview} alt="Avatar preview" width={64} height={64} unoptimized className="w-full h-full object-cover" />
          ) : (
            <span className="text-[#FFB81C] font-bold text-lg" aria-hidden="true">{initials}</span>
          )}
        </label>
        <label
          htmlFor="avatar-upload"
          className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          aria-hidden="true"
        >
          <Upload size={16} className="text-white" />
        </label>
        <input ref={inputRef} id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleFile} aria-label="Upload avatar image" />
      </div>
      <div>
        <p className="text-white text-sm font-semibold">{name}</p>
        <label
          htmlFor="avatar-upload"
          className="text-xs text-[#FFB81C] hover:text-[#E6A519] transition-colors mt-0.5 cursor-pointer"
        >
          Change avatar
        </label>
      </div>
    </div>
  )
}

// ─── Account Stats Card ───────────────────────────────────────────────────────

const ACCT_STATS: {
  totalBuilds: number | null
  tokensUsed: number | null
  memberSince: string | null
  tierLabel: string | null
  tierColor: string
  referralCode: string | null
  streakDays: number | null
  totalXp: number | null
} = {
  totalBuilds:  null,
  tokensUsed:   null,
  memberSince:  null,
  tierLabel:    null,
  tierColor:    '#60A5FA',
  referralCode: null,
  streakDays:   null,
  totalXp:      null,
}

function InlineCopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const doCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }
  return (
    <button
      onClick={doCopy}
      className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors border flex-shrink-0"
      style={{
        color: copied ? '#10B981' : '#FFB81C',
        borderColor: copied ? '#10B98130' : '#FFB81C30',
        background: copied ? '#10B98108' : '#FFB81C08',
      }}
    >
      {copied ? <><Check size={11} /> Copied!</> : <><Copy size={11} /> Copy</>}
    </button>
  )
}

function AccountStatsCard() {
  const s = ACCT_STATS
  const statItems = [
    { label: 'Total Builds', value: s.totalBuilds != null ? Number(s.totalBuilds).toLocaleString() : '—', icon: '🔨' },
    { label: 'Tokens Used',  value: s.tokensUsed  != null ? Number(s.tokensUsed).toLocaleString()  : '—', icon: '⚡' },
    { label: 'Streak Days',  value: s.streakDays  != null ? `${s.streakDays} days`                 : '—', icon: '🔥' },
    { label: 'Member Since', value: s.memberSince ?? '—',                                                icon: '📅' },
  ]
  return (
    <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-6">
      <h3 className="text-white font-semibold mb-5">Account Stats</h3>
      {/* Tier badge row */}
      <div
        className="flex items-center gap-3 p-4 rounded-xl mb-4"
        style={{ background: `${s.tierColor}08`, border: `1px solid ${s.tierColor}22` }}
      >
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: `${s.tierColor}12`, border: `1px solid ${s.tierColor}20` }}
        >
          🎓
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Current Tier</p>
          <p className="text-lg font-bold" style={{ color: s.tierColor }}>{s.tierLabel ?? '—'}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-bold text-white tabular-nums">{s.totalXp !== null ? `${s.totalXp.toLocaleString()} XP` : '—'}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">—</p>
        </div>
      </div>
      {/* XP progress */}
      <div className="h-1.5 rounded-full bg-white/[0.08] overflow-hidden mb-5">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${s.totalXp !== null ? Math.round((s.totalXp / 2000) * 100) : 0}%`, background: s.tierColor }}
        />
      </div>
      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {statItems.map((item) => (
          <div
            key={item.label}
            className="rounded-xl p-3"
            style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-sm">{item.icon}</span>
              <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest truncate">{item.label}</span>
            </div>
            <p className="text-base font-bold text-white tabular-nums">{item.value}</p>
          </div>
        ))}
      </div>
      {/* Referral code */}
      <div>
        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">Referral Code</p>
        <div
          className="flex items-center justify-between gap-3 p-3 rounded-xl"
          style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <code className="text-sm font-mono text-[#FFB81C] tracking-wide truncate">{s.referralCode ?? '—'}</code>
          {s.referralCode && <InlineCopyButton text={s.referralCode} />}
        </div>
        <p className="text-[11px] text-gray-600 mt-1.5">
          Share to earn 500 tokens per friend who signs up.
        </p>
      </div>
    </div>
  )
}

// ─── Profile Tab ──────────────────────────────────────────────────────────────

const SOCIAL_STORAGE_KEY = 'fg_profile_social'

function loadSocialFromStorage() {
  if (typeof window === 'undefined') return { bio: '', twitter: '', discord: '', github: '' }
  try {
    const raw = localStorage.getItem(SOCIAL_STORAGE_KEY)
    return raw ? JSON.parse(raw) as { bio: string; twitter: string; discord: string; github: string } : { bio: '', twitter: '', discord: '', github: '' }
  } catch {
    return { bio: '', twitter: '', discord: '', github: '' }
  }
}

function ProfileTab() {
  const { toast, show } = useToast()
  const { user } = useUser()
  const [displayName, setDisplayName] = useState('Dawsen')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [twitter, setTwitter] = useState('')
  const [discord, setDiscord] = useState('')
  const [github, setGithub] = useState('')
  const [charity, setCharity] = useState('Code.org')
  const [saving, setSaving] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const [deleting, setDeleting] = useState(false)

  const charities = ['Code.org', 'Girls Who Code', 'Khan Academy']

  // Hydrate from API + localStorage on mount
  useEffect(() => {
    const social = loadSocialFromStorage()
    setBio(social.bio)
    setTwitter(social.twitter)
    setDiscord(social.discord)
    setGithub(social.github)

    fetch('/api/settings/profile')
      .then((r) => r.json())
      .then((data: { profile?: { displayName?: string | null; username?: string | null } }) => {
        if (data.profile?.displayName) setDisplayName(data.profile.displayName)
        if (data.profile?.username) setUsername(data.profile.username)
      })
      .catch(() => {/* non-fatal */})
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName,
          username: username || undefined,
          bio,
          twitterHandle: twitter || null,
          discordHandle: discord || null,
          githubHandle: github || null,
        }),
      })
      if (res.ok) {
        // Persist social/bio locally since schema columns may not exist yet
        localStorage.setItem(SOCIAL_STORAGE_KEY, JSON.stringify({ bio, twitter, discord, github }))
        show('Profile saved')
      } else {
        const err = await res.json() as { error?: string }
        show(err?.error ?? 'Failed to save', 'error')
      }
    } catch {
      show('Failed to save', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteInput !== 'delete my account') return
    setDeleting(true)
    try {
      const res = await fetch('/api/user/delete', { method: 'DELETE' })
      if (res.ok) {
        window.location.href = '/sign-in'
        return
      }
    } catch {
      // fall through
    }
    setDeleting(false)
    show('Failed to delete account. Contact support.', 'error')
  }

  return (
    <div className="space-y-4">
      {/* Profile card */}
      <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-6">
        <h3 className="text-white font-semibold mb-5">Profile</h3>

        {/* Avatar */}
        <div className="mb-6 pb-6 border-b border-white/5">
          <AvatarUpload name={displayName} onError={(msg) => show(msg, 'error')} />
        </div>

        <div className="space-y-4">
          {/* Email (read-only) */}
          <div>
            <label htmlFor="profile-email" className="block text-sm text-gray-300 mb-1.5">Email</label>
            <input
              id="profile-email"
              type="email"
              value={user?.primaryEmailAddress?.emailAddress ?? ''}
              disabled
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-gray-400 text-sm cursor-not-allowed"
            />
            <p className="text-gray-500 text-xs mt-1.5">Managed by Clerk — change in account settings.</p>
          </div>

          {/* Display Name */}
          <div>
            <label htmlFor="profile-display-name" className="block text-sm text-gray-300 mb-1.5">Display Name</label>
            <input
              id="profile-display-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={50}
              placeholder="Your display name"
              className="w-full bg-[#1c1c1c] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#FFB81C]/40 transition-colors"
            />
          </div>

          {/* Username */}
          <div>
            <label htmlFor="profile-username" className="block text-sm text-gray-300 mb-1.5">Username</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm select-none">@</span>
              <input
                id="profile-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                maxLength={30}
                placeholder="your_username"
                className="w-full bg-[#1c1c1c] border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white text-sm focus:outline-none focus:border-[#FFB81C]/40 transition-colors"
              />
            </div>
            <p className="text-gray-500 text-xs mt-1.5">Letters, numbers, underscores, hyphens only.</p>
          </div>

          {/* Bio */}
          <div>
            <label htmlFor="profile-bio" className="block text-sm text-gray-300 mb-1.5">
              Bio
              <span className="ml-2 text-gray-600 text-xs font-normal">{bio.length}/500</span>
            </label>
            <textarea
              id="profile-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Tell the world what you build..."
              className="w-full bg-[#1c1c1c] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#FFB81C]/40 transition-colors resize-none"
            />
          </div>

          {/* Social Links */}
          <div>
            <p className="block text-sm text-gray-300 mb-3">Social Links</p>
            <div className="space-y-2.5">
              <div className="relative">
                <Twitter size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-400" />
                <input
                  type="text"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  maxLength={50}
                  placeholder="Twitter / X handle"
                  aria-label="Twitter handle"
                  className="w-full bg-[#1c1c1c] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#FFB81C]/40 transition-colors"
                />
              </div>
              <div className="relative">
                <MessageCircle size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" />
                <input
                  type="text"
                  value={discord}
                  onChange={(e) => setDiscord(e.target.value)}
                  maxLength={50}
                  placeholder="Discord username"
                  aria-label="Discord username"
                  className="w-full bg-[#1c1c1c] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#FFB81C]/40 transition-colors"
                />
              </div>
              <div className="relative">
                <Github size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  maxLength={50}
                  placeholder="GitHub username"
                  aria-label="GitHub username"
                  className="w-full bg-[#1c1c1c] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#FFB81C]/40 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Charity */}
          <div>
            <label htmlFor="profile-charity" className="block text-sm text-gray-300 mb-1.5">Charity Preference</label>
            <div className="relative">
              <select
                id="profile-charity"
                value={charity}
                onChange={(e) => setCharity(e.target.value)}
                className="w-full bg-[#1c1c1c] border border-white/10 rounded-xl px-4 pr-10 py-3 text-white text-sm focus:outline-none focus:border-[#FFB81C]/40 transition-colors appearance-none"
              >
                {charities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <p className="text-gray-500 text-xs mt-1.5">A portion of revenue is donated to this organisation.</p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-6 bg-[#FFB81C] hover:bg-[#E6A519] text-black font-bold px-6 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-70"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Account Stats */}
      <AccountStatsCard />

      {/* Danger Zone */}
      <div className="bg-[#141414] border border-red-500/20 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-2">
          <Trash2 size={15} className="text-red-400" />
          <h3 className="text-red-400 font-semibold">Danger Zone</h3>
        </div>
        <p className="text-gray-300 text-sm mb-4">
          Permanently delete your account and all associated data. This cannot be undone.
        </p>

        {!showDeleteDialog ? (
          <button
            onClick={() => setShowDeleteDialog(true)}
            className="text-sm border border-red-500/30 hover:border-red-500/60 hover:bg-red-500/5 text-red-400 px-4 py-2.5 rounded-xl transition-colors"
          >
            Delete Account
          </button>
        ) : (
          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 space-y-3">
            <p className="text-white text-sm font-medium">
              Type{' '}
              <span className="font-mono text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">
                delete my account
              </span>{' '}
              to confirm:
            </p>
            <label htmlFor="delete-confirm-input" className="sr-only">Type &quot;delete my account&quot; to confirm</label>
            <input
              id="delete-confirm-input"
              type="text"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder="delete my account"
              autoComplete="off"
              className="w-full bg-[#1c1c1c] border border-red-500/30 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-red-500 transition-colors"
            />
            <div className="flex gap-3">
              <button
                disabled={deleteInput !== 'delete my account' || deleting}
                onClick={handleDeleteAccount}
                className="text-sm bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {deleting ? 'Deleting...' : 'Permanently Delete'}
              </button>
              <button
                onClick={() => {
                  setShowDeleteDialog(false)
                  setDeleteInput('')
                }}
                className="text-sm border border-white/20 text-gray-300 hover:text-blue-400 px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}

// ─── Billing Tab ──────────────────────────────────────────────────────────────

function BillingTab() {
  const { data: tokenData } = useSWR('/api/tokens/balance', fetcher, { refreshInterval: 30_000 })
  const { data: billingData } = useSWR('/api/billing/status', fetcher, { refreshInterval: 60_000 })

  const plan = billingData?.tier ?? 'Free'
  const tokenBalance = tokenData?.balance ?? 0
  const tokenLimit = billingData?.tokenLimit ?? 1_000
  const tokenPct = Math.min(100, Math.round((tokenBalance / tokenLimit) * 100))

  return (
    <div className="space-y-4">
      {/* Plan */}
      <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Current Plan</p>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="text-2xl font-bold text-white">{plan}</span>
              {/* Gold active badge */}
              <span className="inline-flex items-center gap-1.5 bg-[#FFB81C]/15 text-[#FFB81C] border border-[#FFB81C]/30 text-xs font-bold px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FFB81C] inline-block" />
                Active
              </span>
            </div>
            <p className="text-gray-300 text-sm">5,000 tokens/month · Full AI · Priority builds</p>
            <p className="text-gray-400 text-xs mt-1.5">
              <span className="text-white font-semibold">$29/mo</span> · Renews April 28, 2026
            </p>
          </div>
          <div className="flex flex-col gap-2 flex-shrink-0">
            <Link
              href="/#pricing"
              className="inline-flex items-center gap-1.5 bg-[#FFB81C] hover:bg-[#E6A519] text-black font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
            >
              <TrendingUp size={14} />
              Change Plan
            </Link>
            <button
              onClick={() => window.open('/api/billing/portal', '_blank')}
              className="text-xs text-gray-300 hover:text-blue-400 text-center transition-colors"
            >
              Manage billing →
            </button>
          </div>
        </div>
      </div>

      {/* Token Balance */}
      <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Token Balance</p>
        <div className="flex items-end gap-3 mb-1">
          <span className="text-5xl font-bold text-[#FFB81C] tabular-nums leading-none">
            {tokenBalance.toLocaleString()}
          </span>
          <span className="text-gray-300 text-sm mb-1">remaining</span>
        </div>
        <p className="text-gray-400 text-xs mb-4">of {tokenLimit.toLocaleString()} total this month</p>

        <div className="relative h-3 bg-white/10 rounded-full overflow-hidden mb-1">
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
            style={{
              width: `${tokenPct}%`,
              background:
                tokenPct >= 80
                  ? 'linear-gradient(90deg, #f87171, #ef4444)'
                  : 'linear-gradient(90deg, #FFB81C, #E6A519)',
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mb-5">
          <span>{(tokenLimit - tokenBalance).toLocaleString()} used</span>
          <span>{tokenPct}%</span>
        </div>

        <Link
          href="/billing#tokens"
          className="inline-flex items-center gap-2 text-sm font-semibold border border-[#FFB81C]/30 hover:border-[#FFB81C]/60 hover:bg-[#FFB81C]/5 text-[#FFB81C] px-4 py-2.5 rounded-xl transition-colors"
        >
          <Zap size={14} />
          Buy More Tokens
        </Link>
      </div>

      {/* Usage Breakdown */}
      <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-5">Usage This Month</p>
        <div className="space-y-5">
          {[
            { label: 'AI Generations', used: 142, limit: 200, color: '#FFB81C' },
            { label: 'Marketplace Searches', used: 58, limit: 500, color: '#60a5fa' },
            { label: 'API Calls', used: 3_420, limit: 10_000, color: '#a78bfa' },
          ].map((stat) => {
            const pct = Math.min(100, Math.round((stat.used / stat.limit) * 100))
            return (
              <div key={stat.label} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-gray-300 text-sm">{stat.label}</span>
                  <span className="text-gray-300 text-xs tabular-nums">
                    {stat.used.toLocaleString()} / {stat.limit.toLocaleString()}
                  </span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: pct >= 80 ? '#f87171' : stat.color,
                    }}
                  />
                </div>
                <p className="text-gray-500 text-xs text-right">{pct}% used</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-5">Payment History</p>
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full text-sm min-w-[400px]">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-xs text-gray-400 font-medium pb-3">Date</th>
                <th className="text-left text-xs text-gray-400 font-medium pb-3">Description</th>
                <th className="text-right text-xs text-gray-400 font-medium pb-3">Amount</th>
                <th className="text-right text-xs text-gray-400 font-medium pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[
                { id: '1', date: 'Mar 28, 2026', description: 'Pro Plan — Monthly', amount: '$29.00', status: 'Paid' },
                { id: '2', date: 'Feb 28, 2026', description: 'Pro Plan — Monthly', amount: '$29.00', status: 'Paid' },
                { id: '3', date: 'Jan 28, 2026', description: 'Pro Plan — Monthly', amount: '$29.00', status: 'Paid' },
              ].map((row) => (
                <tr key={row.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 text-gray-300 text-xs whitespace-nowrap">{row.date}</td>
                  <td className="py-3.5 text-white pr-4">{row.description}</td>
                  <td className="py-3.5 text-white text-right tabular-nums font-medium">{row.amount}</td>
                  <td className="py-3.5 text-right">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full border bg-green-500/10 text-green-400 border-green-500/20">
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── API Keys Tab ─────────────────────────────────────────────────────────────

const STORAGE_KEY = 'forje_api_keys'

const DEFAULT_KEYS: ApiKey[] = [
  { id: '1', name: 'Production', prefix: 'rf_sk_prod_a3f9b72e...', createdAt: '2026-03-01' },
  { id: '2', name: 'Development', prefix: 'rf_sk_dev_c7e2d891...', createdAt: '2026-03-15' },
]

function loadKeys(): ApiKey[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as ApiKey[]
  } catch { /* ignore */ }
  return DEFAULT_KEYS
}

function saveKeys(keys: ApiKey[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keys))
  } catch { /* ignore */ }
}

function ApiKeysTab() {
  const { toast, show } = useToast()

  const [keys, setKeys] = useState<ApiKey[]>(DEFAULT_KEYS)
  const [hydrated, setHydrated] = useState(false)

  // Load from localStorage after hydration to avoid SSR mismatch
  useEffect(() => {
    setKeys(loadKeys())
    setHydrated(true)
  }, [])

  const [showCreate, setShowCreate] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyScope, setNewKeyScope] = useState<'read' | 'write' | 'admin'>('write')
  const [creating, setCreating] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set())
  const [justCreated, setJustCreated] = useState<string | null>(null)

  const persistAndSet = (updater: (prev: ApiKey[]) => ApiKey[]) => {
    setKeys((prev) => {
      const next = updater(prev)
      saveKeys(next)
      return next
    })
  }

  const generateKeyString = (name: string) => {
    const slug = name.toLowerCase().replace(/\s+/g, '_').slice(0, 8)
    const rand = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10)
    return `rf_sk_${slug}_${rand}`
  }

  const handleCreate = async () => {
    if (!newKeyName.trim()) return
    setCreating(true)
    await new Promise((r) => setTimeout(r, 600)) // simulate API call
    const fullKey = generateKeyString(newKeyName.trim())
    const newKey: ApiKey = {
      id: Date.now().toString(),
      name: newKeyName.trim(),
      prefix: fullKey.slice(0, 22) + '...',
      createdAt: new Date().toISOString().slice(0, 10),
    }
    // Store the full key temporarily for one-time display
    setJustCreated(fullKey)
    persistAndSet((k) => [...k, newKey])
    setNewKeyName('')
    setNewKeyScope('write')
    setShowCreate(false)
    setCreating(false)
    show('API key created — copy it now, it won\'t be shown again')
  }

  const handleDelete = async (id: string) => {
    persistAndSet((k) => k.filter((key) => key.id !== id))
    setDeleteConfirm(null)
    if (justCreated) setJustCreated(null)
    show('API key revoked')
  }

  const toggleReveal = (id: string) =>
    setRevealedKeys((s) => {
      const next = new Set(s)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const copyKey = (text: string) => {
    void navigator.clipboard.writeText(text)
    show('Copied to clipboard')
  }

  void hydrated // suppress unused warning

  return (
    <div className="space-y-4">
      {toast && <Toast message={toast.message} type={toast.type} />}

      <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-6">
        <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
          <div>
            <h3 className="text-white font-semibold">API Keys</h3>
            <p className="text-gray-400 text-xs mt-0.5">
              Use these keys to authenticate ForjeGames API calls.
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1.5 text-sm bg-[#FFB81C] hover:bg-[#E6A519] text-black font-bold px-4 py-2 rounded-xl transition-colors"
          >
            <Plus size={14} />
            New Key
          </button>
        </div>

        {/* Just-created key banner — one-time display */}
        {justCreated && (
          <div className="mb-5 p-4 bg-[#FFB81C]/10 border border-[#FFB81C]/40 rounded-xl">
            <p className="text-[#FFB81C] text-xs font-bold uppercase tracking-wider mb-2">
              Copy your new API key now — it won&apos;t be shown again
            </p>
            <div className="flex items-center gap-2 bg-black/30 border border-white/10 rounded-lg px-3 py-2">
              <code className="flex-1 text-white text-xs font-mono break-all select-all">{justCreated}</code>
              <button
                onClick={() => copyKey(justCreated)}
                className="text-[#FFB81C] hover:text-[#E6A519] flex-shrink-0"
              >
                <Copy size={14} />
              </button>
            </div>
            <button
              onClick={() => setJustCreated(null)}
              className="mt-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              I&apos;ve saved it — dismiss
            </button>
          </div>
        )}

        {/* Create form */}
        {showCreate && (
          <div className="mb-5 p-4 bg-white/5 border border-white/10 rounded-xl">
            <p className="text-white text-sm font-medium mb-3">New API Key</p>
            <label htmlFor="new-key-name" className="sr-only">Key name</label>
            <input
              id="new-key-name"
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void handleCreate()}
              placeholder="Key name (e.g. Production)"
              className="w-full bg-[#1c1c1c] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-400/50 transition-colors mb-3"
              autoFocus
            />
            <div className="mb-3">
              <p id="key-permissions-label" className="block text-xs text-gray-400 mb-1.5">Permissions</p>
              <div className="flex gap-2" role="group" aria-labelledby="key-permissions-label">
                {(['read', 'write', 'admin'] as const).map((scope) => (
                  <button
                    key={scope}
                    onClick={() => setNewKeyScope(scope)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all capitalize ${
                      newKeyScope === scope
                        ? 'bg-[#FFB81C]/15 border-[#FFB81C]/40 text-[#FFB81C]'
                        : 'border-white/10 text-gray-400 hover:border-white/20'
                    }`}
                  >
                    {scope}
                  </button>
                ))}
              </div>
              <p className="text-gray-500 text-xs mt-1.5">
                {newKeyScope === 'read' && 'Read-only access to your projects and assets.'}
                {newKeyScope === 'write' && 'Create and modify projects, trigger AI builds.'}
                {newKeyScope === 'admin' && 'Full access including billing and team management.'}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => void handleCreate()}
                disabled={!newKeyName.trim() || creating}
                className="text-sm bg-[#FFB81C] hover:bg-[#E6A519] text-black font-bold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {creating ? 'Generating...' : 'Generate Key'}
              </button>
              <button
                onClick={() => {
                  setShowCreate(false)
                  setNewKeyName('')
                }}
                className="text-sm border border-white/20 text-gray-300 hover:text-blue-400 px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Keys list */}
        {keys.length === 0 ? (
          <p className="text-gray-400 text-sm py-4">No API keys yet. Create one to get started.</p>
        ) : (
          <div className="space-y-3">
            {keys.map((key) => {
              const revealed = revealedKeys.has(key.id)
              return (
                <div
                  key={key.id}
                  className="flex items-center justify-between gap-4 py-4 border-b border-white/5 last:border-0 flex-wrap"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Key size={13} className="text-[#FFB81C] flex-shrink-0" />
                      <p className="text-white text-sm font-medium">{key.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-gray-400 text-xs font-mono">
                        {revealed ? key.prefix : '\u2022'.repeat(16) + '...'}
                      </p>
                      <button
                        onClick={() => toggleReveal(key.id)}
                        className="text-gray-500 hover:text-gray-300 transition-colors"
                      >
                        {revealed ? <EyeOff size={12} /> : <Eye size={12} />}
                      </button>
                      <button
                        onClick={() => copyKey(key.prefix)}
                        className="text-gray-500 hover:text-[#FFB81C] transition-colors"
                      >
                        <Copy size={12} />
                      </button>
                    </div>
                    <p className="text-gray-500 text-xs mt-0.5">Created {key.createdAt}</p>
                  </div>

                  {deleteConfirm === key.id ? (
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => void handleDelete(key.id)}
                        className="text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="text-xs border border-white/20 text-gray-300 hover:text-blue-400 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(key.id)}
                      className="text-xs border border-red-500/20 hover:border-red-500/40 hover:bg-red-500/5 text-red-400 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Notifications Tab ────────────────────────────────────────────────────────

function NotificationsTab() {
  return (
    <div className="space-y-4">
      <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-6">
        <h3 className="text-white font-semibold mb-1">Notification Preferences</h3>
        <p className="text-gray-400 text-xs mb-5">
          Choose how you want to be notified for each event type. Configure email, SMS, push, and in-app alerts.
        </p>
        <NotificationPreferences />
      </div>
    </div>
  )
}

// ─── Appearance Tab ───────────────────────────────────────────────────────────

type ThemeCategoryKey = 'minimal' | 'vibrant' | 'aesthetic' | 'luxury'

const CATEGORY_META: { key: ThemeCategoryKey; label: string; description: string; icon: string }[] = [
  { key: 'minimal',   label: 'Minimal',   description: 'Clean and understated',  icon: '◻' },
  { key: 'vibrant',   label: 'Vibrant',   description: 'Bold and energetic',      icon: '⚡' },
  { key: 'aesthetic', label: 'Aesthetic', description: 'Curated vibes',           icon: '✦' },
  { key: 'luxury',    label: 'Luxury',    description: 'Premium and refined',     icon: '◆' },
]

function ThemePreviewCard({
  t,
  isActive,
  onSelect,
}: {
  t: { id: string; name: string; description: string; preview: { bg: string; accent: string; surface: string } }
  isActive: boolean
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      title={t.description}
      className={`group relative rounded-xl overflow-hidden transition-all duration-200 ${
        isActive ? 'scale-[1.02]' : 'hover:scale-[1.01]'
      }`}
      style={{
        outline: isActive ? `2px solid ${t.preview.accent}` : '1px solid rgba(255,255,255,0.07)',
        boxShadow: isActive ? `0 0 18px ${t.preview.accent}30` : undefined,
      }}
    >
      {/* Preview swatch */}
      <div className="h-24 relative overflow-hidden" style={{ background: t.preview.bg }}>
        {/* Simulated sidebar */}
        <div className="absolute left-0 top-0 bottom-0 w-3 opacity-60" style={{ background: t.preview.surface }} />
        {/* Simulated top bar */}
        <div className="absolute top-0 left-3 right-0 h-4" style={{ background: t.preview.surface }} />
        {/* Accent button in top bar */}
        <div className="absolute top-1 right-2 h-2 w-5 rounded-sm" style={{ background: t.preview.accent }} />
        {/* Content lines */}
        <div className="absolute top-7 left-6 right-3 space-y-1.5">
          <div className="h-1 rounded-full w-3/4 opacity-25" style={{ background: t.preview.accent }} />
          <div className="h-1 rounded-full w-1/2 opacity-12" style={{ background: t.preview.surface }} />
          <div className="h-1 rounded-full w-2/3 opacity-10" style={{ background: t.preview.surface }} />
        </div>
        {/* Surface card at bottom */}
        <div className="absolute bottom-2 left-5 right-3 h-5 rounded-md" style={{ background: t.preview.surface, opacity: 0.85 }} />
        <div className="absolute bottom-3.5 left-7 w-2 h-2 rounded-full" style={{ background: t.preview.accent }} />
      </div>

      {/* Label row */}
      <div
        className="px-3 py-2 flex items-center justify-between gap-2"
        style={{ background: '#111113' }}
      >
        <p className={`text-xs font-semibold truncate transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
          {t.name}
        </p>
        {isActive && (
          <span className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: t.preview.accent }}>
            <Check size={9} className="text-black" />
          </span>
        )}
      </div>
    </button>
  )
}

function AppearanceTab() {
  const { toast, show } = useToast()
  const { theme: currentTheme, setTheme, themes } = useThemeHook()
  const [activeCategory, setActiveCategory] = useState<ThemeCategoryKey>('minimal')

  // Default to the category of the current active theme
  useEffect(() => {
    const cat = currentTheme.category as ThemeCategoryKey
    if (CATEGORY_META.some((c) => c.key === cat)) setActiveCategory(cat)
  }, [currentTheme.category])

  const handleSelect = (id: string) => {
    setTheme(id)
    const t = themes.find((th) => th.id === id)
    show(`${t?.name ?? 'Theme'} applied`)
  }

  const catThemes = themes.filter((t) => t.category === activeCategory)

  return (
    <div className="space-y-5">
      {toast && <Toast message={toast.message} type={toast.type} />}

      {/* Active theme banner */}
      <div
        className="rounded-xl p-4 flex items-center gap-4 border transition-all duration-500"
        style={{
          background: `linear-gradient(120deg, ${currentTheme.preview.bg} 0%, ${currentTheme.preview.surface} 100%)`,
          borderColor: `${currentTheme.preview.accent}30`,
        }}
      >
        <div
          className="w-12 h-12 rounded-xl flex-shrink-0 overflow-hidden"
          style={{ border: `1px solid ${currentTheme.preview.accent}40` }}
        >
          <div className="w-full h-full" style={{ background: currentTheme.preview.bg }}>
            <div className="w-full h-1/2" style={{ background: currentTheme.preview.surface }} />
            <div className="mx-auto mt-1 w-4 h-1 rounded-full" style={{ background: currentTheme.preview.accent }} />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-white font-bold text-sm">{currentTheme.name}</p>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{
                background: `${currentTheme.preview.accent}18`,
                color: currentTheme.preview.accent,
                border: `1px solid ${currentTheme.preview.accent}35`,
              }}
            >
              Active
            </span>
          </div>
          <p className="text-gray-400 text-xs truncate">{currentTheme.description}</p>
        </div>
        <Sparkles size={16} style={{ color: currentTheme.preview.accent }} className="flex-shrink-0 opacity-60" />
      </div>

      {/* Category tab strip */}
      <div className="flex gap-1.5 flex-wrap">
        {CATEGORY_META.map((cat) => {
          const isSelected = activeCategory === cat.key
          const count = themes.filter((t) => t.category === cat.key).length
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all duration-150 ${
                isSelected
                  ? 'bg-[#FFB81C]/10 text-[#FFB81C] border-[#FFB81C]/25'
                  : 'text-gray-400 border-white/[0.06] hover:text-white hover:border-white/15'
              }`}
            >
              <span className="text-[11px]">{cat.icon}</span>
              {cat.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${isSelected ? 'bg-[#FFB81C]/20 text-[#FFB81C]' : 'bg-white/[0.07] text-gray-500'}`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Theme grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {catThemes.map((t) => (
          <ThemePreviewCard
            key={t.id}
            t={t}
            isActive={currentTheme.id === t.id}
            onSelect={() => handleSelect(t.id)}
          />
        ))}
      </div>

      <p className="text-[11px] text-gray-600 px-1">
        Themes save locally and apply instantly across the entire app — includes light mode. Toggle quickly via the Sun/Moon button in the topbar.
      </p>
    </div>
  )
}

// ─── Connected Accounts Tab ───────────────────────────────────────────────────

function ConnectedTab() {
  const { toast, show } = useToast()

  const [connections, setConnections] = useState({
    roblox: { connected: true, username: 'Dawsen_Dev', connectedAt: '2026-01-14' },
    github: {
      connected: false,
      username: null as string | null,
      connectedAt: null as string | null,
    },
  })

  type PlatformKey = keyof typeof connections

  const handleConnect = (platform: PlatformKey) => {
    window.location.href = platform === 'roblox' ? '/api/auth/roblox' : '/api/auth/github'
  }

  const handleDisconnect = (platform: PlatformKey) => {
    setConnections((c) => ({
      ...c,
      [platform]: { connected: false, username: null, connectedAt: null },
    }))
    show(`${platform === 'roblox' ? 'Roblox' : 'GitHub'} disconnected`)
  }

  const items: {
    key: PlatformKey
    label: string
    description: string
    icon: React.ReactNode
    iconBg: string
  }[] = [
    {
      key: 'roblox',
      label: 'Roblox',
      description: 'Publish maps, sync assets, and deploy directly to your games.',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
          <path d="M5.04 3L3 18.96 18.96 21 21 5.04 5.04 3zm10.2 11.4l-4.56-.6-.6 4.56-2.52-.36.6-4.56-4.56-.6.36-2.52 4.56.6.6-4.56 2.52.36-.6 4.56 4.56.6-.36 2.52z" />
        </svg>
      ),
      iconBg: 'bg-red-500/20 text-red-400',
    },
    {
      key: 'github',
      label: 'GitHub',
      description: 'Sync your projects with GitHub repositories for version control.',
      icon: <Github size={20} />,
      iconBg: 'bg-white/10 text-white',
    },
  ]

  return (
    <div className="space-y-4">
      {toast && <Toast message={toast.message} type={toast.type} />}

      {items.map((item) => {
        const conn = connections[item.key]
        return (
          <div key={item.key} className="bg-[#111113] border border-white/[0.06] rounded-xl p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-start gap-4">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${item.iconBg}`}
                >
                  {item.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-white font-semibold text-sm">{item.label}</p>
                    {conn.connected && (
                      <span className="inline-flex items-center gap-1 text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                        Connected
                      </span>
                    )}
                  </div>
                  <p className="text-gray-300 text-xs">{item.description}</p>
                  {conn.connected && conn.username && (
                    <p className="text-gray-400 text-xs mt-1">
                      @{conn.username} · Since {conn.connectedAt}
                    </p>
                  )}
                </div>
              </div>

              {conn.connected ? (
                <button
                  onClick={() => handleDisconnect(item.key)}
                  className="text-xs border border-white/20 hover:border-red-500/30 hover:text-red-400 text-gray-300 px-3 py-2 rounded-xl transition-colors flex-shrink-0"
                >
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={() => handleConnect(item.key)}
                  className="inline-flex items-center gap-1.5 text-xs bg-[#FFB81C] hover:bg-[#E6A519] text-black font-bold px-3 py-2 rounded-xl transition-colors flex-shrink-0"
                >
                  <Link2 size={12} />
                  Connect
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

// ─── Studio Tab ──────────────────────────────────────────────────────────────

function StudioTab() {
  const { data: studioData } = useSWR('/api/studio/status', fetcher, { refreshInterval: 10_000 })
  const isConnected = studioData?.connected ?? false

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Studio Connection</p>
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-gray-500'}`}
            style={isConnected ? { boxShadow: '0 0 8px #4ADE80' } : undefined}
          />
          <span className={`text-sm font-medium ${isConnected ? 'text-green-400' : 'text-gray-400'}`}>
            {isConnected ? 'Connected to Roblox Studio' : 'Not connected'}
          </span>
        </div>
        {!isConnected && (
          <Link
            href="/connect"
            className="inline-flex items-center gap-2 bg-[#FFB81C] hover:bg-[#E6A519] text-black font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
          >
            <Plug size={14} />
            Connect Studio
          </Link>
        )}
      </div>

      {/* Plugin Download */}
      <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Studio Plugin</p>
        <p className="text-gray-300 text-sm mb-4">
          Install the ForjeGames plugin in Roblox Studio to sync builds directly.
        </p>
        <div className="space-y-3">
          <Link
            href="/api/studio/plugin"
            className="inline-flex items-center gap-2 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-white font-medium px-4 py-2.5 rounded-xl text-sm transition-colors"
          >
            <Download size={14} />
            Download Plugin
          </Link>
        </div>
      </div>

      {/* Quick Setup */}
      <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Setup Guide</p>
        <ol className="space-y-3 text-sm text-gray-300">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#FFB81C]/15 text-[#FFB81C] text-xs font-bold flex items-center justify-center">1</span>
            <span>Download and install the plugin above</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#FFB81C]/15 text-[#FFB81C] text-xs font-bold flex items-center justify-center">2</span>
            <span>Open Roblox Studio and enable the ForjeGames plugin</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#FFB81C]/15 text-[#FFB81C] text-xs font-bold flex items-center justify-center">3</span>
            <span>Click &quot;Connect&quot; in the plugin &mdash; enter the code shown in the editor</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#FFB81C]/15 text-[#FFB81C] text-xs font-bold flex items-center justify-center">4</span>
            <span>Start building! AI-generated code runs directly in Studio</span>
          </li>
        </ol>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'profile', label: 'Profile', icon: <User size={15} /> },
  { key: 'billing', label: 'Billing', icon: <CreditCard size={15} /> },
  { key: 'notifications', label: 'Notifications', icon: <Bell size={15} /> },
  { key: 'appearance', label: 'Appearance', icon: <Palette size={15} /> },
  { key: 'studio', label: 'Studio', icon: <Plug size={15} /> },
  { key: 'api-keys', label: 'API Keys', icon: <Key size={15} /> },
  { key: 'connected', label: 'Connected', icon: <Link2 size={15} /> },
]

const VALID_TABS = TABS.map((t) => t.key)

export default function SettingsClient() {
  const searchParams = useSearchParams()
  const initialTab = (searchParams.get('tab') as Tab) || 'profile'
  const [tab, setTab] = useState<Tab>(
    VALID_TABS.includes(initialTab) ? initialTab : 'profile'
  )

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Account</h1>
          <p className="text-gray-300 mt-1 text-sm">Manage your profile, notifications, appearance, and integrations.</p>
        </div>
        <a
          href="/admin"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-[#FFB81C] bg-white/5 hover:bg-[#FFB81C]/10 border border-white/[0.06] hover:border-[#FFB81C]/20 rounded-lg transition-colors"
        >
          <BarChart size={12} />
          Admin
        </a>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-1 mb-6 pb-1 -mx-1 px-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 border ${
              tab === t.key
                ? 'bg-[#FFB81C]/10 text-[#FFB81C] border-[#FFB81C]/20'
                : 'text-gray-300 hover:text-blue-400 hover:bg-white/5 border-transparent'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'profile' && <ProfileTab />}
      {tab === 'billing' && <BillingTab />}
      {tab === 'notifications' && <NotificationsTab />}
      {tab === 'appearance' && <AppearanceTab />}
      {tab === 'studio' && <StudioTab />}
      {tab === 'api-keys' && <ApiKeysTab />}
      {tab === 'connected' && <ConnectedTab />}
    </div>
  )
}
