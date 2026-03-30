'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
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
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'profile' | 'api-keys' | 'notifications' | 'appearance' | 'connected'

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

function AvatarUpload({ name }: { name: string }) {
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
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Avatar preview" className="w-full h-full object-cover" />
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

// ─── Profile Tab ──────────────────────────────────────────────────────────────

function ProfileTab() {
  const { toast, show } = useToast()
  const { user } = useUser()
  const [displayName, setDisplayName] = useState('Dawsen')
  const [bio, setBio] = useState('Building Roblox games autonomously.')
  const [charity, setCharity] = useState('Code.org')
  const [saving, setSaving] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const [deleting, setDeleting] = useState(false)

  const charities = ['Code.org', 'Girls Who Code', 'Khan Academy']

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch('/api/user/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName, bio, charity }),
      })
    } catch {
      // API not wired yet — optimistic
    } finally {
      setSaving(false)
      show('Changes saved')
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
      <div className="bg-[#141414] border border-white/10 rounded-xl p-6">
        <h3 className="text-white font-semibold mb-5">Profile</h3>

        {/* Avatar */}
        <div className="mb-6 pb-6 border-b border-white/5">
          <AvatarUpload name={displayName} />
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="profile-email" className="block text-sm text-gray-300 mb-1.5">Email</label>
            <input
              id="profile-email"
              type="email"
              value={user?.primaryEmailAddress?.emailAddress || ''}
              disabled
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-gray-400 text-sm cursor-not-allowed"
            />
            <p className="text-gray-500 text-xs mt-1.5">Managed by Clerk — change in account settings.</p>
          </div>

          <div>
            <label htmlFor="profile-display-name" className="block text-sm text-gray-300 mb-1.5">Display Name</label>
            <input
              id="profile-display-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-[#1c1c1c] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-400/50 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="profile-bio" className="block text-sm text-gray-300 mb-1.5">Bio</label>
            <textarea
              id="profile-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={2}
              className="w-full bg-[#1c1c1c] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-400/50 transition-colors resize-none"
            />
          </div>

          <div>
            <label htmlFor="profile-charity" className="block text-sm text-gray-300 mb-1.5">Charity Preference</label>
            <select
              id="profile-charity"
              value={charity}
              onChange={(e) => setCharity(e.target.value)}
              className="w-full bg-[#1c1c1c] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-400/50 transition-colors appearance-none"
            >
              {charities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <p className="text-gray-500 text-xs mt-1.5">
              A portion of revenue is donated to this organisation.
            </p>
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
  const plan = 'Pro'
  const tokenBalance = 1_240
  const tokenLimit = 5_000
  const tokenPct = Math.min(100, Math.round((tokenBalance / tokenLimit) * 100))

  return (
    <div className="space-y-4">
      {/* Plan */}
      <div className="bg-[#141414] border border-white/10 rounded-xl p-6">
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
              href="/pricing"
              className="inline-flex items-center gap-1.5 bg-[#FFB81C] hover:bg-[#E6A519] text-black font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
            >
              <TrendingUp size={14} />
              Upgrade Plan
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
      <div className="bg-[#141414] border border-white/10 rounded-xl p-6">
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
          href="/pricing"
          className="inline-flex items-center gap-2 text-sm font-semibold border border-[#FFB81C]/30 hover:border-[#FFB81C]/60 hover:bg-[#FFB81C]/5 text-[#FFB81C] px-4 py-2.5 rounded-xl transition-colors"
        >
          <Zap size={14} />
          Buy More Tokens
        </Link>
      </div>

      {/* Usage Breakdown */}
      <div className="bg-[#141414] border border-white/10 rounded-xl p-6">
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
      <div className="bg-[#141414] border border-white/10 rounded-xl p-6">
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
  useState(() => {
    if (typeof window !== 'undefined') {
      setKeys(loadKeys())
      setHydrated(true)
    }
  })

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

      <div className="bg-[#141414] border border-white/10 rounded-xl p-6">
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
            <input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void handleCreate()}
              placeholder="Key name (e.g. Production)"
              className="w-full bg-[#1c1c1c] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-400/50 transition-colors mb-3"
              autoFocus
            />
            <div className="mb-3">
              <label className="block text-xs text-gray-400 mb-1.5">Permissions</label>
              <div className="flex gap-2">
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
  const { toast, show } = useToast()
  const [saving, setSaving] = useState(false)

  const [prefs, setPrefs] = useState({
    emailNotifications: true,
    buildAlerts: true,
    tokenWarnings: true,
    marketingEmails: false,
    teamActivity: true,
    weeklyDigest: false,
  })

  const toggle = (key: keyof typeof prefs) =>
    setPrefs((p) => ({ ...p, [key]: !p[key] }))

  const save = async () => {
    setSaving(true)
    try {
      await fetch('/api/user/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      })
    } catch {
      // API not wired — optimistic
    } finally {
      setSaving(false)
      show('Preferences saved')
    }
  }

  const groups: {
    section: string
    rows: { key: keyof typeof prefs; label: string; description: string }[]
  }[] = [
    {
      section: 'Account',
      rows: [
        {
          key: 'emailNotifications',
          label: 'Account Emails',
          description: 'Security alerts, receipts, and account changes',
        },
        {
          key: 'tokenWarnings',
          label: 'Token Warnings',
          description: 'Alert when token balance drops below 20%',
        },
      ],
    },
    {
      section: 'Activity',
      rows: [
        {
          key: 'buildAlerts',
          label: 'Build Completion',
          description: 'Notify when a map or voice build finishes',
        },
        {
          key: 'teamActivity',
          label: 'Team Activity',
          description: 'Comments, reviews, and collaborator updates',
        },
      ],
    },
    {
      section: 'Marketing',
      rows: [
        {
          key: 'marketingEmails',
          label: 'Product Announcements',
          description: 'New features, tips, and releases',
        },
        {
          key: 'weeklyDigest',
          label: 'Weekly Digest',
          description: 'Summary of your builds and platform stats',
        },
      ],
    },
  ]

  return (
    <div className="space-y-4">
      {toast && <Toast message={toast.message} type={toast.type} />}

      {groups.map((group) => (
        <div key={group.section} className="bg-[#141414] border border-white/10 rounded-xl p-6">
          <h3 className="text-white font-semibold mb-5">{group.section}</h3>
          <div className="space-y-5">
            {group.rows.map((row) => (
              <div key={row.key} className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-white text-sm font-medium">{row.label}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{row.description}</p>
                </div>
                <Toggle checked={prefs[row.key]} onChange={() => toggle(row.key)} />
              </div>
            ))}
          </div>
        </div>
      ))}

      <button
        onClick={() => void save()}
        disabled={saving}
        className="bg-[#FFB81C] hover:bg-[#E6A519] text-black font-bold px-6 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-70"
      >
        {saving ? 'Saving...' : 'Save Preferences'}
      </button>
    </div>
  )
}

// ─── Appearance Tab ───────────────────────────────────────────────────────────

function AppearanceTab() {
  const { toast, show } = useToast()
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [accentColor, setAccentColor] = useState<'gold' | 'blue' | 'purple'>('gold')
  const [compactMode, setCompactMode] = useState(false)

  const selectTheme = (t: 'dark' | 'light') => {
    setTheme(t)
    show(`${t === 'dark' ? 'Dark' : 'Light'} theme applied`)
  }

  const ACCENTS: { key: 'gold' | 'blue' | 'purple'; label: string; color: string }[] = [
    { key: 'gold', label: 'Gold', color: '#FFB81C' },
    { key: 'blue', label: 'Blue', color: '#60a5fa' },
    { key: 'purple', label: 'Purple', color: '#a78bfa' },
  ]

  return (
    <div className="space-y-4">
      {toast && <Toast message={toast.message} type={toast.type} />}

      {/* Theme */}
      <div className="bg-[#141414] border border-white/10 rounded-xl p-6">
        <h3 className="text-white font-semibold mb-5">Theme</h3>
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              ['dark', 'Dark', Moon],
              ['light', 'Light', Sun],
            ] as const
          ).map(([key, label, Icon]) => (
            <button
              key={key}
              onClick={() => selectTheme(key)}
              className={`relative flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                theme === key
                  ? 'border-[#FFB81C] bg-[#FFB81C]/5'
                  : 'border-white/10 hover:border-white/20 bg-white/[0.02]'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  key === 'dark' ? 'bg-[#060b1f]' : 'bg-gray-100'
                }`}
              >
                <Icon size={20} className={key === 'dark' ? 'text-[#FFB81C]' : 'text-gray-500'} />
              </div>
              <span
                className={`text-sm font-medium ${theme === key ? 'text-[#FFB81C]' : 'text-gray-300'}`}
              >
                {label}
              </span>
              {theme === key && (
                <div className="absolute top-2 right-2 w-4 h-4 bg-[#FFB81C] rounded-full flex items-center justify-center">
                  <Check size={10} className="text-black" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Accent Color */}
      <div className="bg-[#141414] border border-white/10 rounded-xl p-6">
        <h3 className="text-white font-semibold mb-5">Accent Color</h3>
        <div className="flex gap-3 flex-wrap">
          {ACCENTS.map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => setAccentColor(key)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border transition-all text-sm font-medium ${
                accentColor === key
                  ? 'border-white/30 bg-white/5 text-white'
                  : 'border-white/10 hover:border-white/20 text-gray-300 hover:text-blue-400'
              }`}
            >
              <span
                className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Compact Mode */}
      <div className="bg-[#141414] border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-medium text-sm">Compact Mode</p>
            <p className="text-gray-400 text-xs mt-0.5">
              Reduce padding and spacing across the dashboard
            </p>
          </div>
          <Toggle checked={compactMode} onChange={() => setCompactMode((v) => !v)} />
        </div>
      </div>
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
          <div key={item.key} className="bg-[#141414] border border-white/10 rounded-xl p-6">
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

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'profile', label: 'Profile', icon: <User size={15} /> },
  { key: 'api-keys', label: 'API Keys', icon: <Key size={15} /> },
  { key: 'notifications', label: 'Notifications', icon: <Bell size={15} /> },
  { key: 'appearance', label: 'Appearance', icon: <Palette size={15} /> },
  { key: 'connected', label: 'Connected', icon: <Link2 size={15} /> },
]

export default function SettingsClient() {
  const [tab, setTab] = useState<Tab>('profile')

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Settings</h1>
        <p className="text-gray-300 mt-1 text-sm">Manage your account and preferences.</p>
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
      {tab === 'api-keys' && <ApiKeysTab />}
      {tab === 'notifications' && <NotificationsTab />}
      {tab === 'appearance' && <AppearanceTab />}
      {tab === 'connected' && <ConnectedTab />}
    </div>
  )
}
