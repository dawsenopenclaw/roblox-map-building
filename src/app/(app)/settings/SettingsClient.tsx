'use client'

import { useState, useRef, useEffect } from 'react'
import { useToast } from '@/components/ui/toast-notification'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { useUser, UserProfile } from '@clerk/nextjs'
import useSWR from 'swr'
import { NotificationPreferences } from '@/components/NotificationPreferences'
import RobloxLinkCard from '@/components/settings/RobloxLinkCard'
import { useTheme as useThemeHook } from '@/components/ThemeProvider'
import { useEditorSettings } from '@/app/(app)/editor/hooks/useEditorSettings'
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

const fetcher = (url: string) => fetch(url).then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'profile' | 'billing' | 'studio' | 'api-keys' | 'notifications' | 'appearance' | 'connected'

type ApiKey = {
  id: string
  name: string
  prefix: string
  scopes: string[]
  tier: string
  lastUsedAt: string | null
  createdAt: string
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
        checked ? 'bg-[#D4AF37]' : 'bg-white/15'
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

function AvatarUpload({
  name,
  initialUrl,
  onError,
  onUploaded,
}: {
  name: string
  initialUrl?: string | null
  onError?: (msg: string) => void
  onUploaded?: (url: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(initialUrl ?? null)
  const [uploading, setUploading] = useState(false)

  // Sync when parent provides an initial URL after fetch
  useEffect(() => {
    if (initialUrl) setPreview(initialUrl)
  }, [initialUrl])

  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      onError?.('Please upload a PNG, JPEG, or WebP image.')
      e.target.value = ''
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      onError?.('File too large. Max 2 MB.')
      e.target.value = ''
      return
    }

    // Optimistic preview
    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)
    setUploading(true)

    try {
      const form = new FormData()
      form.append('avatar', file)
      const res = await fetch('/api/settings/avatar', { method: 'POST', body: form })
      if (!res.ok) {
        const err = await res.json() as { error?: string }
        throw new Error(err?.error ?? 'Upload failed')
      }
      const data = await res.json() as { avatarUrl: string }
      setPreview(data.avatarUrl)
      onUploaded?.(data.avatarUrl)
    } catch (err) {
      // Revert optimistic preview
      setPreview(initialUrl ?? null)
      onError?.(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="flex items-center gap-5">
      <div className="relative group">
        <label
          htmlFor="avatar-upload"
          className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#D4AF37]/30 to-[#D4AF37]/10 border border-[#D4AF37]/20 cursor-pointer"
          aria-label="Upload avatar image"
        >
          {preview ? (
            <Image src={preview} alt="Avatar preview" width={64} height={64} unoptimized className="w-full h-full object-cover" />
          ) : (
            <span className="text-[#D4AF37] font-bold text-lg" aria-hidden="true">{initials}</span>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center">
              <svg className="animate-spin w-5 h-5 text-[#D4AF37]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            </div>
          )}
        </label>
        {!uploading && (
          <label
            htmlFor="avatar-upload"
            className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            aria-hidden="true"
          >
            <Upload size={16} className="text-white" />
          </label>
        )}
        <input
          ref={inputRef}
          id="avatar-upload"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => { void handleFile(e) }}
          aria-label="Upload avatar image"
          disabled={uploading}
        />
      </div>
      <div>
        <p className="text-white text-sm font-semibold">{name}</p>
        <label
          htmlFor="avatar-upload"
          className={`text-xs transition-colors mt-0.5 cursor-pointer ${uploading ? 'text-gray-500 cursor-not-allowed' : 'text-[#D4AF37] hover:text-[#E6A519]'}`}
        >
          {uploading ? 'Uploading...' : 'Change avatar'}
        </label>
        <p className="text-[11px] text-gray-600 mt-0.5">PNG, JPEG, WebP · max 2 MB</p>
      </div>
    </div>
  )
}

// ─── Account Stats Card ───────────────────────────────────────────────────────

type AccountStats = {
  totalBuilds:     number
  tokensUsed:      number
  tokensRemaining: number
  memberSince:     string
  apiKeysActive:   number
  streakDays:      number
  totalXp:         number
  xpTier:          string
  tierLabel:       string
  tierColor:       string
  referralCode:    string | null
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
        color: copied ? '#10B981' : '#D4AF37',
        borderColor: copied ? '#10B98130' : '#D4AF3730',
        background: copied ? '#10B98108' : '#D4AF3708',
      }}
    >
      {copied ? <><Check size={11} /> Copied!</> : <><Copy size={11} /> Copy</>}
    </button>
  )
}

function AccountStatsCard() {
  const { data, isLoading } = useSWR<AccountStats>('/api/settings/stats', fetcher, {
    revalidateOnFocus: false,
  })
  const [mobileExpanded, setMobileExpanded] = useState(false)

  const s = data
  const tierColor = s?.tierColor ?? '#60A5FA'

  const memberSinceFormatted = s?.memberSince
    ? new Date(s.memberSince).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : '—'

  const statItems = [
    { label: 'Total Builds', value: s ? s.totalBuilds.toLocaleString()   : '—', icon: '🔨' },
    { label: 'Tokens Used',  value: s ? s.tokensUsed.toLocaleString()    : '—', icon: '⚡' },
    { label: 'Streak Days',  value: s ? `${s.streakDays} days`           : '—', icon: '🔥' },
    { label: 'Member Since', value: memberSinceFormatted,                        icon: '📅' },
  ]

  return (
    <div className="card-premium rounded-xl p-6">
      {/* Collapsible header on mobile to prevent covering profile fields */}
      <button
        className="w-full flex items-center justify-between sm:pointer-events-none"
        onClick={() => setMobileExpanded(v => !v)}
      >
        <h3 className="text-white font-semibold mb-0 sm:mb-5">Account Stats</h3>
        <ChevronDown
          size={16}
          className={`text-gray-400 sm:hidden transition-transform ${mobileExpanded ? 'rotate-180' : ''}`}
        />
      </button>
      <div className={`${mobileExpanded ? 'block' : 'hidden'} sm:block mt-4 sm:mt-0`}>
      {/* Tier badge row */}
      <div
        className="flex items-center gap-3 p-4 rounded-xl mb-4"
        style={{ background: `${tierColor}08`, border: `1px solid ${tierColor}22` }}
      >
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: `${tierColor}12`, border: `1px solid ${tierColor}20` }}
        >
          🎓
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Current Tier</p>
          {isLoading
            ? <div className="h-5 w-16 bg-white/10 rounded animate-pulse mt-1" />
            : <p className="text-lg font-bold" style={{ color: tierColor }}>{s?.tierLabel ?? '—'}</p>
          }
        </div>
        <div className="text-right flex-shrink-0">
          {isLoading
            ? <div className="h-4 w-14 bg-white/10 rounded animate-pulse" />
            : <p className="text-sm font-bold text-white tabular-nums">{s ? `${s.totalXp.toLocaleString()} XP` : '—'}</p>
          }
          <p className="text-[10px] text-gray-500 mt-0.5">{s?.xpTier ?? '—'}</p>
        </div>
      </div>
      {/* XP progress */}
      <div className="h-1.5 rounded-full bg-white/[0.08] overflow-hidden mb-5">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${s ? Math.min(100, Math.round((s.totalXp / 2000) * 100)) : 0}%`, background: tierColor }}
        />
      </div>
      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {statItems.map((item) => (
          <div
            key={item.label}
            className="rounded-xl p-3"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-sm">{item.icon}</span>
              <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest truncate">{item.label}</span>
            </div>
            {isLoading
              ? <div className="h-5 w-12 bg-white/10 rounded animate-pulse mt-1" />
              : <p className="text-base font-bold text-white tabular-nums">{item.value}</p>
            }
          </div>
        ))}
      </div>
      {/* Referral code */}
      <div>
        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">Referral Code</p>
        <div
          className="flex items-center justify-between gap-3 p-3 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          {isLoading
            ? <div className="h-4 w-32 bg-white/10 rounded animate-pulse" />
            : <code className="text-sm font-mono text-[#D4AF37] tracking-wide truncate">{s?.referralCode ?? '—'}</code>
          }
          {s?.referralCode && <InlineCopyButton text={s.referralCode} />}
        </div>
        <p className="text-[11px] text-gray-600 mt-1.5">
          Share to earn 500 tokens per friend who signs up.
        </p>
      </div>
      </div>{/* End collapsible wrapper */}
    </div>
  )
}

// ─── Profile Tab ──────────────────────────────────────────────────────────────

type ProfileData = {
  displayName: string | null
  username: string | null
  avatarUrl: string | null
  bio: string | null
  twitterHandle: string | null
  discordHandle: string | null
  githubHandle: string | null
}

function ProfileTab() {
  const { show } = useToast()
  const { user } = useUser()
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [twitter, setTwitter] = useState('')
  const [discord, setDiscord] = useState('')
  const [github, setGithub] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [charity, setCharity] = useState('Code.org')
  const [saving, setSaving] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const [deleting, setDeleting] = useState(false)

  // Snapshot of last-saved values, used to detect dirty form state
  const initialRef = useRef({
    displayName: '', username: '', bio: '',
    twitter: '', discord: '', github: '',
  })

  const charities = ['Code.org', 'Girls Who Code', 'Khan Academy']

  // Hydrate everything from the API — schema has all these columns
  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/settings/profile', { signal: controller.signal })
      .then((r) => r.json())
      .then((data: { profile?: ProfileData }) => {
        const p = data.profile
        if (!p) return
        if (p.displayName) setDisplayName(p.displayName)
        if (p.username)    setUsername(p.username)
        if (p.bio)         setBio(p.bio)
        if (p.twitterHandle) setTwitter(p.twitterHandle)
        if (p.discordHandle) setDiscord(p.discordHandle)
        if (p.githubHandle)  setGithub(p.githubHandle)
        if (p.avatarUrl)     setAvatarUrl(p.avatarUrl)
        initialRef.current = {
          displayName: p.displayName ?? '',
          username:    p.username ?? '',
          bio:         p.bio ?? '',
          twitter:     p.twitterHandle ?? '',
          discord:     p.discordHandle ?? '',
          github:      p.githubHandle ?? '',
        }
      })
      .catch((err) => { if ((err as Error).name !== 'AbortError') {/* non-fatal */} })
    return () => controller.abort()
  }, [])

  const isDirty =
    displayName !== initialRef.current.displayName ||
    username    !== initialRef.current.username    ||
    bio         !== initialRef.current.bio         ||
    twitter     !== initialRef.current.twitter     ||
    discord     !== initialRef.current.discord     ||
    github      !== initialRef.current.github

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: displayName || undefined,
          username: username || undefined,
          bio,
          twitterHandle: twitter || null,
          discordHandle: discord || null,
          githubHandle: github || null,
        }),
      })
      if (res.ok) {
        // Reset baseline so the save button becomes inactive again
        initialRef.current = { displayName, username, bio, twitter, discord, github }
        // Sync display name to Clerk so the nav/profile button updates immediately
        try {
          if (displayName) {
            const parts = displayName.trim().split(/\s+/)
            await user?.update({
              firstName: parts[0] ?? '',
              lastName: parts.slice(1).join(' ') || undefined,
              username: username || undefined,
            })
          }
        } catch { /* non-fatal — DB is the source of truth */ }
        show({ variant: 'success', title: 'Profile saved' })
      } else {
        const err = await res.json() as { error?: string }
        show({ variant: 'error', title: 'Could not save profile', description: err?.error ?? 'Please check your details and try again.' })
      }
    } catch {
      show({ variant: 'error', title: 'Could not save profile', description: 'Network error — please check your connection and try again.' })
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
    show({ variant: 'error', title: 'Failed to delete account. Contact support.' })
  }

  return (
    <div className="space-y-4">
      {/* Profile card */}
      <div className="card-premium rounded-xl p-6">
        <h3 className="text-white font-semibold mb-5">Profile</h3>

        {/* Avatar */}
        <div className="mb-6 pb-6 border-b border-white/5">
          <AvatarUpload
            name={displayName || user?.fullName || 'User'}
            initialUrl={avatarUrl}
            onError={(msg) => show({ variant: 'error', title: msg })}
            onUploaded={(url) => { setAvatarUrl(url); show({ variant: 'success', title: 'Avatar updated' }) }}
          />
        </div>

        <div className="space-y-4">
          {/* Email (read-only) */}
          <div>
            <label htmlFor="profile-email" className="label-premium">Email</label>
            <input
              id="profile-email"
              type="email"
              value={user?.primaryEmailAddress?.emailAddress ?? ''}
              disabled
              className="input-premium"
            />
            <p className="text-gray-500 text-xs mt-1.5">Managed by Clerk — change in account settings.</p>
          </div>

          {/* Display Name */}
          <div>
            <label htmlFor="profile-display-name" className="label-premium">Display Name</label>
            <input
              id="profile-display-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={50}
              placeholder="Your display name"
              className="input-premium"
            />
          </div>

          {/* Username */}
          <div>
            <label htmlFor="profile-username" className="label-premium">Username</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm select-none z-10">@</span>
              <input
                id="profile-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                maxLength={30}
                placeholder="your_username"
                className="input-premium pl-7"
              />
            </div>
            <p className="text-gray-500 text-xs mt-1.5">Letters, numbers, underscores, hyphens only.</p>
          </div>

          {/* Bio */}
          <div>
            <label htmlFor="profile-bio" className="label-premium">
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
              className="input-premium resize-none"
            />
          </div>

          {/* Social Links */}
          <div>
            <p className="label-premium mb-3">Social Links</p>
            <div className="space-y-2.5">
              <div className="relative">
                <Twitter size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sky-400 z-10 pointer-events-none" />
                <input
                  type="text"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  maxLength={50}
                  placeholder="Twitter / X handle"
                  aria-label="Twitter handle"
                  className="input-premium pl-9"
                />
              </div>
              <div className="relative">
                <MessageCircle size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-400 z-10 pointer-events-none" />
                <input
                  type="text"
                  value={discord}
                  onChange={(e) => setDiscord(e.target.value)}
                  maxLength={50}
                  placeholder="Discord username"
                  aria-label="Discord username"
                  className="input-premium pl-9"
                />
              </div>
              <div className="relative">
                <Github size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none" />
                <input
                  type="text"
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  maxLength={50}
                  placeholder="GitHub username"
                  aria-label="GitHub username"
                  className="input-premium pl-9"
                />
              </div>
            </div>
          </div>

          {/* Charity */}
          <div>
            <label htmlFor="profile-charity" className="label-premium">Charity Preference</label>
            <div className="relative">
              <select
                id="profile-charity"
                value={charity}
                onChange={(e) => setCharity(e.target.value)}
                className="input-premium pr-10 appearance-none cursor-pointer"
              >
                {charities.map((c) => (
                  <option key={c} value={c} className="bg-[#141414]">{c}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <p className="text-gray-500 text-xs mt-1.5">A portion of revenue is donated to this organisation.</p>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving || !isDirty}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
              isDirty && !saving
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#E6A519] text-black shadow-[0_0_20px_rgba(212,175,55,0.25)] hover:shadow-[0_0_28px_rgba(212,175,55,0.4)]'
                : 'bg-white/[0.04] text-white/30 cursor-not-allowed border border-white/[0.06]'
            }`}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          {isDirty && !saving && (
            <span className="text-xs text-[#D4AF37]/70">Unsaved changes</span>
          )}
        </div>
      </div>

      {/* Account Stats */}
      <AccountStatsCard />

      {/* Danger Zone */}
      <div className="card-premium !border-red-500/20 rounded-xl p-6">
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
              className="w-full bg-white/[0.04] border border-red-500/30 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-red-500 transition-colors"
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
  const tokensUsed = tokenLimit - tokenBalance
  const tokenPct = Math.min(100, Math.round((tokensUsed / tokenLimit) * 100))

  return (
    <div className="space-y-4">
      {/* Plan */}
      <div className="card-premium rounded-xl p-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Current Plan</p>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="text-2xl font-bold text-white">{plan}</span>
              {/* Gold active badge */}
              <span className="inline-flex items-center gap-1.5 bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 text-xs font-bold px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] inline-block" />
                Active
              </span>
            </div>
            <p className="text-gray-300 text-sm">
              {billingData?.tokenLimit
                ? `${billingData.tokenLimit.toLocaleString()} tokens/month`
                : 'Loading plan details…'}
              {billingData?.tier && billingData.tier !== 'FREE' ? ' · Full AI · Priority builds' : billingData?.tier === 'FREE' ? ' · Basic AI access' : ''}
            </p>
            <p className="text-gray-400 text-xs mt-1.5">
              {billingData?.monthlyPrice ? (
                <>
                  <span className="text-white font-semibold">
                    {billingData.monthlyPrice}{billingData.monthlyPrice !== 'Free' ? '/mo' : ''}
                  </span>
                  {billingData.renewDate && (
                    <> · {billingData.cancelAtPeriodEnd ? 'Cancels' : 'Renews'} {billingData.renewDate}</>
                  )}
                </>
              ) : null}
            </p>
          </div>
          <div className="flex flex-col gap-2 flex-shrink-0">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1.5 bg-gradient-to-br from-[#D4AF37] to-[#C8962A] hover:brightness-110 active:scale-[0.97] text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
            >
              <TrendingUp size={14} />
              Change Plan
            </Link>
            <button
              onClick={async () => {
                try {
                  const res = await fetch('/api/billing/portal', { method: 'POST' })
                  const data = await res.json() as { url?: string }
                  if (data.url) window.location.href = data.url
                } catch { window.location.href = '/billing' }
              }}
              className="text-xs text-gray-300 hover:text-blue-400 text-center transition-colors"
            >
              Manage billing →
            </button>
          </div>
        </div>
      </div>

      {/* Token Balance */}
      <div className="card-premium rounded-xl p-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Token Balance</p>
        <div className="flex items-end gap-3 mb-1">
          <span className="text-5xl font-bold text-[#D4AF37] tabular-nums leading-none">
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
                  : 'linear-gradient(90deg, #D4AF37, #E6A519)',
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mb-5">
          <span>{tokensUsed.toLocaleString()} used</span>
          <span>{tokenPct}% used</span>
        </div>

        <Link
          href="/tokens"
          className="inline-flex items-center gap-2 text-sm font-semibold border border-[#D4AF37]/30 hover:border-[#D4AF37]/60 hover:bg-[#D4AF37]/5 text-[#D4AF37] px-4 py-2.5 rounded-xl transition-colors"
        >
          <Zap size={14} />
          Buy More Tokens
        </Link>
      </div>

      {/* Usage Breakdown */}
      <div className="card-premium rounded-xl p-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-5">Usage This Month</p>
        <div className="space-y-5">
          {[
            ...(billingData?.usageBreakdown ?? [
            { label: 'AI Generations', used: 0, limit: 200, color: '#D4AF37' },
            { label: 'Marketplace Searches', used: 0, limit: 500, color: '#60a5fa' },
            { label: 'API Calls', used: 0, limit: 10_000, color: '#a78bfa' },
          ]),
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
      <div className="card-premium rounded-xl p-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-5">Payment History</p>
        <div className="py-4 text-center">
          <p className="text-gray-500 text-sm mb-2">Full payment history is available on the billing page.</p>
          <Link
            href="/billing"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#D4AF37] hover:text-[#E6A519] transition-colors"
          >
            View invoices →
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─── API Keys Tab ─────────────────────────────────────────────────────────────

function ApiKeysTab() {
  const { data, error, mutate } = useSWR<{ keys: ApiKey[] }>('/api/settings/api-keys', fetcher)
  const [showCreate, setShowCreate] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [creating, setCreating] = useState(false)
  const [revealedKey, setRevealedKey] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState(false)
  const [copiedConfig, setCopiedConfig] = useState(false)
  const [revoking, setRevoking] = useState<string | null>(null)
  const [showSetup, setShowSetup] = useState(false)
  const toast = useToast()

  const keys = data?.keys ?? []

  async function createKey() {
    if (!newKeyName.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/settings/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName.trim() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to create key')
      setRevealedKey(json.key.rawKey)
      setNewKeyName('')
      setShowCreate(false)
      mutate()
      toast.success('API key created')
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setCreating(false)
    }
  }

  async function revokeKey(keyId: string) {
    setRevoking(keyId)
    try {
      const res = await fetch('/api/settings/api-keys', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyId }),
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || 'Failed to revoke')
      }
      mutate()
      toast.success('Key revoked')
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setRevoking(null)
    }
  }

  function copyKey(text: string) {
    navigator.clipboard.writeText(text)
    setCopiedKey(true)
    setTimeout(() => setCopiedKey(false), 2000)
  }

  function copyConfig(text: string) {
    navigator.clipboard.writeText(text)
    setCopiedConfig(true)
    setTimeout(() => setCopiedConfig(false), 2000)
  }

  const mcpConfig = `{
  "mcpServers": {
    "forje-games": {
      "command": "npx",
      "args": ["-y", "@forjegames/mcp-forje"],
      "env": {
        "FORJE_API_KEY": "${revealedKey || 'fj_live_your_key_here'}"
      }
    }
  }
}`

  return (
    <div className="space-y-4">
      {/* Revealed key banner */}
      {revealedKey && (
        <div className="card-premium rounded-xl p-5 border border-[#D4AF37]/30 bg-[#D4AF37]/5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Key size={16} className="text-[#D4AF37]" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-white font-semibold text-sm">Your new API key</h4>
              <p className="text-gray-400 text-xs mt-0.5 mb-3">
                Copy this now — it won&apos;t be shown again.
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[#D4AF37] text-xs font-mono break-all select-all">
                  {revealedKey}
                </code>
                <button
                  onClick={() => copyKey(revealedKey)}
                  className="flex-shrink-0 p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                  title="Copy key"
                >
                  {copiedKey ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-gray-400" />}
                </button>
              </div>
              <button
                onClick={() => setShowSetup(s => !s)}
                className="mt-3 text-xs font-medium text-[#D4AF37] hover:text-[#E6A519] transition-colors flex items-center gap-1"
              >
                {showSetup ? 'Hide' : 'Show'} MCP setup instructions
                <ChevronDown size={12} className={`transition-transform ${showSetup ? 'rotate-180' : ''}`} />
              </button>
              {showSetup && (
                <div className="mt-3 space-y-3">
                  <p className="text-gray-400 text-xs">
                    Add this to your editor&apos;s MCP config:
                  </p>
                  <div className="relative">
                    <pre className="bg-black/60 border border-white/10 rounded-lg p-3 text-xs text-gray-300 font-mono overflow-x-auto whitespace-pre">
                      {mcpConfig}
                    </pre>
                    <button
                      onClick={() => copyConfig(mcpConfig)}
                      className="absolute top-2 right-2 p-1.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/[0.06] transition-colors"
                      title="Copy config"
                    >
                      {copiedConfig ? <Check size={12} className="text-green-400" /> : <Copy size={12} className="text-gray-400" />}
                    </button>
                  </div>
                  <div className="text-xs text-gray-500 space-y-1">
                    <p><strong className="text-gray-400">Claude Code:</strong> Add to <code className="text-[#D4AF37]/70">.claude/settings.json</code></p>
                    <p><strong className="text-gray-400">Cursor:</strong> Add to <code className="text-[#D4AF37]/70">.cursor/mcp.json</code></p>
                    <p><strong className="text-gray-400">Windsurf:</strong> Add to <code className="text-[#D4AF37]/70">.windsurf/mcp.json</code></p>
                  </div>
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-3">
                    <p className="text-xs text-gray-400 font-medium mb-2">Available tools:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {[
                        { name: 'forje_build', desc: 'Build anything from a prompt' },
                        { name: 'forje_script', desc: 'Generate Luau scripts' },
                        { name: 'forje_template', desc: 'Use instant templates' },
                        { name: 'forje_status', desc: 'Check tokens & connection' },
                        { name: 'forje_templates_list', desc: 'List all templates' },
                      ].map(t => (
                        <div key={t.name} className="flex items-baseline gap-2">
                          <code className="text-[10px] text-[#D4AF37]/80 font-mono">{t.name}</code>
                          <span className="text-[10px] text-gray-500">{t.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <button
                onClick={() => setRevealedKey(null)}
                className="mt-3 text-xs text-gray-500 hover:text-gray-400 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main card */}
      <div className="card-premium rounded-xl p-6">
        <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
          <div>
            <h3 className="text-white font-semibold">API Keys</h3>
            <p className="text-gray-400 text-xs mt-0.5">
              Use API keys to build Roblox games from Claude Code, Cursor, or any MCP-compatible editor.
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1.5 text-sm bg-gradient-to-br from-[#D4AF37] to-[#C8962A] hover:brightness-110 active:scale-[0.97] text-white font-bold px-4 py-2 rounded-xl transition-all"
          >
            <Plus size={14} />
            New Key
          </button>
        </div>

        {/* Loading */}
        {!data && !error && (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="bg-white/[0.03] rounded-xl p-4 animate-pulse">
                <div className="h-4 bg-white/10 rounded w-1/3 mb-2" />
                <div className="h-3 bg-white/5 rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
            <p className="text-red-400 text-sm">Failed to load API keys</p>
            <button onClick={() => mutate()} className="text-xs text-red-400/70 hover:text-red-400 mt-1 transition-colors">
              Retry
            </button>
          </div>
        )}

        {/* Empty */}
        {data && keys.length === 0 && !revealedKey && (
          <div className="text-center py-10">
            <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mx-auto mb-3">
              <Key size={20} className="text-gray-500" />
            </div>
            <p className="text-gray-400 text-sm font-medium">No API keys yet</p>
            <p className="text-gray-500 text-xs mt-1 max-w-xs mx-auto">
              Create a key to start building Roblox games from your favorite AI editor.
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#D4AF37] hover:text-[#E6A519] transition-colors"
            >
              <Plus size={14} />
              Create your first key
            </button>
          </div>
        )}

        {/* Key list */}
        {data && keys.length > 0 && (
          <div className="space-y-2">
            {keys.map(key => (
              <div
                key={key.id}
                className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 flex items-center justify-between gap-4 hover:border-white/[0.1] transition-colors group"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-white text-sm font-medium truncate">{key.name}</span>
                    <code className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/[0.06] text-gray-400 font-mono">
                      {key.prefix}
                    </code>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-gray-500 flex-wrap">
                    <span>Created {new Date(key.createdAt).toLocaleDateString()}</span>
                    {key.lastUsedAt ? (
                      <span>Last used {new Date(key.lastUsedAt).toLocaleDateString()}</span>
                    ) : (
                      <span className="text-gray-600">Never used</span>
                    )}
                    <span className="hidden sm:inline text-gray-600">
                      {key.scopes.join(', ')}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => revokeKey(key.id)}
                  disabled={revoking === key.id}
                  className="flex-shrink-0 p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-50"
                  title="Revoke key"
                >
                  {revoking === key.id ? (
                    <div className="w-3.5 h-3.5 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MCP info card */}
      <div className="card-premium rounded-xl p-6">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center flex-shrink-0">
            <Plug size={16} className="text-[#D4AF37]" />
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm">MCP Integration</h4>
            <p className="text-gray-400 text-xs mt-1 leading-relaxed">
              ForjeGames works with any MCP-compatible AI editor. Build entire Roblox games
              without leaving your code editor. Create an API key, then add the config to your editor.
            </p>
            <div className="flex items-center gap-4 mt-3 flex-wrap">
              {['Claude Code', 'Cursor', 'Windsurf', 'Any MCP Client'].map(name => (
                <span key={name} className="text-[11px] text-gray-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Create key modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowCreate(false)}>
          <div
            className="bg-[#141414] border border-white/[0.08] rounded-2xl p-6 w-full max-w-md shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-white font-semibold mb-1">Create API Key</h3>
            <p className="text-gray-400 text-xs mb-5">
              Give your key a name so you can identify it later.
            </p>
            <label className="label-premium block mb-1.5">Key Name</label>
            <input
              type="text"
              value={newKeyName}
              onChange={e => setNewKeyName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createKey()}
              placeholder="e.g. Claude Code, Cursor, My MCP Server"
              maxLength={64}
              autoFocus
              className="input-premium w-full mb-5"
            />
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createKey}
                disabled={creating || !newKeyName.trim()}
                className="inline-flex items-center gap-1.5 text-sm bg-gradient-to-br from-[#D4AF37] to-[#C8962A] hover:brightness-110 active:scale-[0.97] text-white font-bold px-5 py-2 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Key size={14} />
                    Create Key
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Notifications Tab ────────────────────────────────────────────────────────

function NotificationsTab() {
  return (
    <div className="space-y-4">
      <div className="card-premium rounded-xl p-6">
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

const ACCENT_PRESETS = [
  { label: 'Gold',    value: '#D4AF37' },
  { label: 'Blue',    value: '#60A5FA' },
  { label: 'Purple',  value: '#A78BFA' },
  { label: 'Green',   value: '#34D399' },
  { label: 'Rose',    value: '#FB7185' },
  { label: 'Orange',  value: '#FB923C' },
  { label: 'Cyan',    value: '#22D3EE' },
  { label: 'Default', value: undefined as string | undefined },
]

function AppearanceTab() {
  const { show } = useToast()
  const { theme: currentTheme, setTheme, themes, accentColor, setAccentColor } = useThemeHook()
  const { settings, update } = useEditorSettings()
  const [activeCategory, setActiveCategory] = useState<ThemeCategoryKey>('minimal')
  const [syncing, setSyncing] = useState(false)

  // Default to the category of the current active theme
  useEffect(() => {
    const cat = currentTheme.category as ThemeCategoryKey
    if (CATEGORY_META.some((c) => c.key === cat)) setActiveCategory(cat)
  }, [currentTheme.category])

  // On mount: pull server preferences and apply them (cross-device sync).
  // Read localStorage directly here — settings state may not have hydrated yet
  // (useEditorSettings also hydrates in a useEffect, creating a race).
  useEffect(() => {
    let localSettings: Record<string, unknown> = {}
    try {
      const raw = localStorage.getItem('fg_editor_settings')
      if (raw) localSettings = JSON.parse(raw) as Record<string, unknown>
    } catch { /* corrupt storage — treat as empty */ }

    fetch('/api/settings/preferences')
      .then((r) => r.json())
      .then((data: { preferences?: { theme?: string; fontSize?: string; accentColor?: string | null } }) => {
        const p = data.preferences
        if (!p) return
        // Server wins only if localStorage has no stored value for that key
        // (localStorage is the source of truth for the current device)
        if (p.theme && !localSettings.theme) update('theme', p.theme)
        if (p.fontSize && !localSettings.fontSize) {
          update('fontSize', p.fontSize as 'small' | 'medium' | 'large')
        }
        if ('accentColor' in p && !('accentColor' in localSettings)) {
          update('accentColor', p.accentColor ?? undefined)
        }
      })
      .catch(() => {/* non-fatal — offline or DB unreachable */})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const persistPreferences = async (patch: { theme?: string; fontSize?: string; accentColor?: string | null }) => {
    setSyncing(true)
    try {
      await fetch('/api/settings/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
    } catch {
      /* non-fatal */
    } finally {
      setSyncing(false)
    }
  }

  const handleSelectTheme = (id: string) => {
    setTheme(id)
    void persistPreferences({ theme: id })
    const t = themes.find((th) => th.id === id)
    show({ variant: 'info', title: `Theme: ${t?.name ?? 'Applied'}` })
  }

  const handleFontSize = (size: 'small' | 'medium' | 'large') => {
    update('fontSize', size)
    void persistPreferences({ fontSize: size })
  }

  const handleAccent = (value: string | undefined) => {
    setAccentColor(value)
    void persistPreferences({ accentColor: value ?? null })
  }

  const catThemes = themes.filter((t) => t.category === activeCategory && !t.hidden)
  const isLight = currentTheme.id === 'light' || currentTheme.id === 'paper'

  return (
    <div className="space-y-5">
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
            {syncing && (
              <span className="text-[10px] text-gray-500">syncing...</span>
            )}
          </div>
          <p className="text-gray-400 text-xs truncate">{currentTheme.description}</p>
        </div>
        <Sparkles size={16} style={{ color: currentTheme.preview.accent }} className="flex-shrink-0 opacity-60" />
      </div>

      {/* Light / Dark quick toggle */}
      <div className="card-premium rounded-xl p-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Mode</p>
        <div className="flex gap-2">
          <button
            onClick={() => handleSelectTheme('default')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
              !isLight
                ? 'bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/25'
                : 'text-gray-400 border-white/[0.06] hover:text-white hover:border-white/15'
            }`}
          >
            <Moon size={14} />
            Dark
          </button>
          <button
            onClick={() => handleSelectTheme('light')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
              isLight
                ? 'bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/25'
                : 'text-gray-400 border-white/[0.06] hover:text-white hover:border-white/15'
            }`}
          >
            <Sun size={14} />
            Light
          </button>
        </div>
      </div>

      {/* Accent color */}
      <div className="card-premium rounded-xl p-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Accent Color</p>
        <div className="flex flex-wrap gap-2">
          {ACCENT_PRESETS.map((preset) => {
            const displayColor = preset.value ?? currentTheme.preview.accent
            const isActive = preset.value === undefined
              ? accentColor === undefined
              : accentColor === preset.value
            return (
              <button
                key={preset.label}
                onClick={() => handleAccent(preset.value)}
                title={preset.label}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  isActive ? 'scale-110 border-white' : 'border-transparent hover:scale-105 hover:border-white/40'
                }`}
                style={{ background: displayColor }}
                aria-label={`${preset.label} accent${preset.value === undefined ? ' (default)' : ''}`}
              >
                {isActive && (
                  <Check size={12} className="mx-auto" style={{ color: '#000' }} />
                )}
              </button>
            )
          })}
        </div>
        <p className="text-[11px] text-gray-600 mt-2">
          Overrides the theme&apos;s default accent across buttons, highlights, and indicators.
        </p>
      </div>

      {/* Font size */}
      <div className="card-premium rounded-xl p-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Font Size</p>
        <div className="flex gap-2">
          {(['small', 'medium', 'large'] as const).map((size) => (
            <button
              key={size}
              onClick={() => handleFontSize(size)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all capitalize ${
                settings.fontSize === size
                  ? 'bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/25'
                  : 'text-gray-400 border-white/[0.06] hover:text-white hover:border-white/15'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Category tab strip */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Theme</p>
        <div className="flex gap-1.5 flex-wrap mb-3">
          {CATEGORY_META.map((cat) => {
            const isSelected = activeCategory === cat.key
            const count = themes.filter((t) => t.category === cat.key && !t.hidden).length
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all duration-150 ${
                  isSelected
                    ? 'bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/25'
                    : 'text-gray-400 border-white/[0.06] hover:text-white hover:border-white/15'
                }`}
              >
                <span className="text-[11px]">{cat.icon}</span>
                {cat.label}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${isSelected ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-white/[0.07] text-gray-500'}`}>
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
              onSelect={() => handleSelectTheme(t.id)}
            />
          ))}
        </div>
      </div>

      <p className="text-[11px] text-gray-600 px-1">
        Preferences sync across devices. Toggle light/dark quickly via the Sun/Moon button in the topbar.
      </p>
    </div>
  )
}

// ─── Connected Accounts Tab ───────────────────────────────────────────────────

type PlatformKey = 'roblox' | 'github'

type ConnectionState = {
  connected: boolean
  username: string | null
  connectedAt: string | null
}

function ConnectedTab() {
  const { show } = useToast()

  const { data: connData, mutate: revalidate } = useSWR<{
    roblox: ConnectionState
    github: ConnectionState
  }>('/api/settings/connections', fetcher, { revalidateOnFocus: false })

  const [connections, setConnections] = useState<Record<PlatformKey, ConnectionState>>({
    roblox: { connected: false, username: null, connectedAt: null },
    github: { connected: false, username: null, connectedAt: null },
  })

  // Which platform's input form is open
  const [inputOpen, setInputOpen] = useState<PlatformKey | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [saving, setSaving] = useState(false)

  // Hydrate from API once loaded
  useEffect(() => {
    if (connData) {
      setConnections({
        roblox: connData.roblox ?? { connected: false, username: null, connectedAt: null },
        github: connData.github ?? { connected: false, username: null, connectedAt: null },
      })
    }
  }, [connData])

  const handleOpenConnect = (platform: PlatformKey) => {
    setInputOpen(platform)
    setInputValue('')
  }

  const handleSaveConnect = async () => {
    if (!inputOpen || !inputValue.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/settings/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: inputOpen, username: inputValue.trim() }),
      })
      if (!res.ok) {
        const err = await res.json() as { error?: string }
        show({ variant: 'error', title: err?.error ?? 'Failed to connect' })
        return
      }
      setConnections((c) => ({
        ...c,
        [inputOpen]: { connected: true, username: inputValue.trim(), connectedAt: 'now' },
      }))
      show({ variant: 'success', title: `${inputOpen === 'roblox' ? 'Roblox' : 'GitHub'} connected` })
      setInputOpen(null)
      setInputValue('')
      void revalidate()
    } catch {
      show({ variant: 'error', title: 'Network error — please try again.' })
    } finally {
      setSaving(false)
    }
  }

  const handleDisconnect = async (platform: PlatformKey) => {
    // Optimistic UI update
    setConnections((c) => ({
      ...c,
      [platform]: { connected: false, username: null, connectedAt: null },
    }))
    show({ variant: 'info', title: `${platform === 'roblox' ? 'Roblox' : 'GitHub'} disconnected` })
    try {
      await fetch('/api/settings/connections', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform }),
      })
      void revalidate()
    } catch {
      // Non-fatal — optimistic update already applied
    }
  }

  const items: {
    key: PlatformKey
    label: string
    description: string
    placeholder: string
    icon: React.ReactNode
    iconBg: string
  }[] = [
    {
      key: 'github',
      label: 'GitHub',
      description: 'Sync your projects with GitHub repositories for version control.',
      placeholder: 'Your GitHub username',
      icon: <Github size={20} />,
      iconBg: 'bg-white/10 text-white',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Clerk-managed sign-in methods — Google, Apple, phone, email.
          Users can add/remove sign-in methods, connect social accounts,
          and manage their phone number all from this embedded profile.
          The appearance overrides match ForjeGames' dark theme. */}
      <div className="card-premium rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center flex-shrink-0">
            <Link2 size={20} className="text-[#D4AF37]" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">Sign-in Methods</p>
            <p className="text-gray-400 text-xs">Add Google, phone, or other sign-in options to your account</p>
          </div>
        </div>
        <UserProfile
          routing="hash"
          appearance={{
            variables: {
              colorPrimary: '#D4AF37',
              colorBackground: 'transparent',
              colorText: '#FAFAFA',
              colorTextSecondary: '#A1A1AA',
              colorInputBackground: 'rgba(255,255,255,0.03)',
              colorInputText: '#FAFAFA',
              borderRadius: '0.625rem',
            },
            elements: {
              rootBox: 'w-full',
              card: 'shadow-none border-0 bg-transparent p-0',
              navbar: 'hidden',
              navbarMobileMenuButton: 'hidden',
              headerTitle: 'hidden',
              headerSubtitle: 'hidden',
              pageScrollBox: 'p-0',
              page: 'gap-4',
              profileSection__connectedAccounts: '',
              profileSection__danger: 'hidden',
              profileSection__activeDevices: 'hidden',
              profileSection__profile: 'hidden',
              profileSection__emailAddresses: '',
              profileSection__phoneNumbers: '',
              profileSection__password: 'hidden',
              profileSection__username: 'hidden',
              profileSectionTitle: 'text-xs text-zinc-400 uppercase tracking-wider font-bold',
              profileSectionContent: 'border border-white/[0.06] rounded-lg bg-white/[0.02]',
              formButtonPrimary: 'bg-[#D4AF37] hover:bg-[#E6A619] text-black font-semibold',
              formFieldInput: 'bg-white/[0.03] border border-white/[0.08] text-white',
              badge: 'bg-green-500/10 text-green-400 border-green-500/20',
              menuButton: 'text-zinc-400 hover:text-white',
              menuList: 'bg-[#111] border border-white/10',
              menuItem: 'text-zinc-300 hover:bg-white/5',
            },
          }}
        />
      </div>

      {/* Verified Roblox account linking (with bio-phrase verification) */}
      <RobloxLinkCard />

      {items.map((item) => {
        const conn = connections[item.key]
        const isOpen = inputOpen === item.key
        return (
          <div key={item.key} className="card-premium rounded-xl p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${item.iconBg}`}
                >
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-white font-semibold text-sm">{item.label}</p>
                    {conn.connected && (
                      <span className="inline-flex items-center gap-1 text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                        Connected
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-xs">{item.description}</p>
                  {conn.connected && conn.username && (
                    <p className="text-gray-400 text-xs mt-1">
                      @{conn.username}{conn.connectedAt && conn.connectedAt !== 'now' ? ` · Since ${conn.connectedAt}` : ''}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex-shrink-0">
                {conn.connected ? (
                  <button
                    onClick={() => handleDisconnect(item.key)}
                    className="text-xs border border-white/20 hover:border-red-500/30 hover:text-red-400 text-gray-300 px-3 py-2 rounded-xl transition-colors"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={() => handleOpenConnect(item.key)}
                    className="inline-flex items-center gap-1.5 text-xs bg-gradient-to-br from-[#D4AF37] to-[#C8962A] hover:brightness-110 active:scale-[0.97] text-white font-bold px-3 py-2 rounded-xl transition-colors"
                  >
                    <Link2 size={12} />
                    Connect
                  </button>
                )}
              </div>
            </div>

            {/* Username input form — shown when Connect is clicked */}
            {isOpen && (
              <div className="mt-4 pt-4 border-t border-white/[0.06]">
                <p className="text-xs text-gray-400 mb-2">
                  Enter your {item.label} username to link your account:
                </p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <AtSign size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') void handleSaveConnect() }}
                      placeholder={item.placeholder}
                      maxLength={100}
                      autoFocus
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-8 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4AF37]/40 transition-colors"
                    />
                  </div>
                  <button
                    onClick={() => void handleSaveConnect()}
                    disabled={saving || !inputValue.trim()}
                    className="px-4 py-2.5 bg-gradient-to-br from-[#D4AF37] to-[#C8962A] hover:brightness-110 active:scale-[0.97] text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    onClick={() => { setInputOpen(null); setInputValue('') }}
                    className="px-3 py-2.5 border border-white/10 text-gray-400 hover:text-white rounded-xl text-sm transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
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
      <div className="card-premium rounded-xl p-6">
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
            href="/settings/studio"
            className="inline-flex items-center gap-2 bg-gradient-to-br from-[#D4AF37] to-[#C8962A] hover:brightness-110 active:scale-[0.97] text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
          >
            <Plug size={14} />
            Connect Studio
          </Link>
        )}
      </div>

      {/* Plugin Download */}
      <div className="card-premium rounded-xl p-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Studio Plugin</p>
        <p className="text-gray-300 text-sm mb-4">
          Install the ForjeGames plugin in Roblox Studio to sync builds directly.
        </p>
        <div className="space-y-3">
          <a
            href="/api/studio/plugin"
            download="ForjeGames.rbxmx"
            className="inline-flex items-center gap-2 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-white font-medium px-4 py-2.5 rounded-xl text-sm transition-colors"
          >
            <Download size={14} />
            Download Plugin
          </a>
        </div>
      </div>

      {/* Quick Setup */}
      <div className="card-premium rounded-xl p-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Setup Guide</p>
        <ol className="space-y-3 text-sm text-gray-300">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] text-xs font-bold flex items-center justify-center">1</span>
            <span>Download and install the plugin above</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] text-xs font-bold flex items-center justify-center">2</span>
            <span>Open Roblox Studio and enable the ForjeGames plugin</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] text-xs font-bold flex items-center justify-center">3</span>
            <span>Click &quot;Connect&quot; in the plugin &mdash; enter the code shown in the editor</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] text-xs font-bold flex items-center justify-center">4</span>
            <span>Start building! AI-generated code runs directly in Studio</span>
          </li>
        </ol>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'profile', label: 'Profile', icon: <User size={16} strokeWidth={1.8} /> },
  { key: 'billing', label: 'Billing', icon: <CreditCard size={16} strokeWidth={1.8} /> },
  { key: 'notifications', label: 'Notifications', icon: <Bell size={16} strokeWidth={1.8} /> },
  { key: 'appearance', label: 'Appearance', icon: <Palette size={16} strokeWidth={1.8} /> },
  { key: 'studio', label: 'Studio', icon: <Plug size={16} strokeWidth={1.8} /> },
  { key: 'api-keys', label: 'API Keys', icon: <Key size={16} strokeWidth={1.8} /> },
  { key: 'connected', label: 'Connected', icon: <Link2 size={16} strokeWidth={1.8} /> },
]

const VALID_TABS = TABS.map((t) => t.key)

export default function SettingsClient() {
  const searchParams = useSearchParams()
  const initialTab = (searchParams.get('tab') as Tab) || 'profile'
  const [tab, setTab] = useState<Tab>(
    VALID_TABS.includes(initialTab) ? initialTab : 'profile'
  )

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Account</h1>
          <p className="text-gray-300 mt-1 text-sm">Manage your profile, notifications, appearance, and integrations.</p>
        </div>
        <a
          href="/admin"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-[#D4AF37] bg-white/5 hover:bg-[#D4AF37]/10 border border-white/[0.06] hover:border-[#D4AF37]/20 rounded-lg transition-colors"
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
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0 border ${
              tab === t.key
                ? 'bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20 shadow-[0_0_12px_rgba(212,175,55,0.08)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5 border-transparent'
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
