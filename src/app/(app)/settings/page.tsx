'use client'

import { useState } from 'react'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'account' | 'billing' | 'api-keys' | 'notifications'

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
      className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-lg transition-all ${
        type === 'success'
          ? 'bg-green-500/20 border border-green-500/30 text-green-300'
          : 'bg-red-500/20 border border-red-500/30 text-red-300'
      }`}
    >
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

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      aria-pressed={checked}
      className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${
        checked ? 'bg-[#FFB81C]' : 'bg-white/15'
      }`}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}

// ─── Account Tab ──────────────────────────────────────────────────────────────

function AccountTab() {
  const { toast, show } = useToast()
  const [displayName, setDisplayName] = useState('Dawsen')
  const [charity, setCharity] = useState('Code.org')
  const [saving, setSaving] = useState(false)

  // Delete account state
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
        body: JSON.stringify({ displayName, charity }),
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
    <div className="space-y-6">
      {/* Profile */}
      <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-4">Profile</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Email</label>
            <input
              type="email"
              value="dawsen@robloxforge.gg"
              disabled
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-gray-400 text-sm cursor-not-allowed"
            />
            <p className="text-gray-600 text-xs mt-1">Managed by Clerk. Change via account settings.</p>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className="w-full bg-[#111640] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#FFB81C]/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Charity Preference</label>
            <select
              value={charity}
              onChange={e => setCharity(e.target.value)}
              className="w-full bg-[#111640] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#FFB81C]/50 transition-colors appearance-none"
            >
              {charities.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <p className="text-gray-600 text-xs mt-1">A portion of revenue is donated to this org.</p>
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
      <div className="bg-[#0D1231] border border-red-500/20 rounded-2xl p-6">
        <h3 className="text-red-400 font-semibold mb-2">Danger Zone</h3>
        <p className="text-gray-400 text-sm mb-4">
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
              Type <span className="font-mono text-red-400">delete my account</span> to confirm:
            </p>
            <input
              type="text"
              value={deleteInput}
              onChange={e => setDeleteInput(e.target.value)}
              placeholder="delete my account"
              autoComplete="off"
              className="w-full bg-[#111640] border border-red-500/30 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-red-500 transition-colors"
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
                onClick={() => { setShowDeleteDialog(false); setDeleteInput('') }}
                className="text-sm border border-white/20 text-gray-400 hover:text-white px-4 py-2 rounded-lg transition-colors"
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

  return (
    <div className="space-y-6">
      <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-4">Current Plan</h3>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-white font-bold text-lg">{plan}</span>
              <span className="text-xs bg-[#FFB81C]/10 text-[#FFB81C] border border-[#FFB81C]/20 px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>
            <p className="text-gray-400 text-sm">Billed monthly. Renews April 28, 2026.</p>
          </div>
          <Link
            href="/pricing"
            className="text-sm bg-[#FFB81C] hover:bg-[#E6A519] text-black font-bold px-4 py-2.5 rounded-xl transition-colors"
          >
            Upgrade
          </Link>
        </div>
      </div>

      <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-4">Token Balance</h3>
        <div className="flex items-end gap-2 mb-2">
          <span className="text-3xl font-bold text-white">{tokenBalance.toLocaleString()}</span>
          <span className="text-gray-400 text-sm mb-1">tokens remaining</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2 mb-4">
          <div
            className="bg-[#FFB81C] h-2 rounded-full transition-all"
            style={{ width: `${Math.min(100, (tokenBalance / 5000) * 100)}%` }}
          />
        </div>
        <Link
          href="/pricing"
          className="text-sm border border-white/20 hover:border-white/40 text-white px-4 py-2.5 rounded-xl transition-colors inline-block"
        >
          Buy more tokens
        </Link>
      </div>

      <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-2">Billing Portal</h3>
        <p className="text-gray-400 text-sm mb-4">
          Manage invoices, payment methods, and subscription details via Stripe.
        </p>
        <button
          onClick={() => window.open('/api/billing/portal', '_blank')}
          className="text-sm border border-white/20 hover:border-white/40 text-white px-4 py-2.5 rounded-xl transition-colors"
        >
          Manage Billing
        </button>
      </div>
    </div>
  )
}

// ─── API Keys Tab ─────────────────────────────────────────────────────────────

function ApiKeysTab() {
  const { toast, show } = useToast()

  const [keys, setKeys] = useState<ApiKey[]>([
    { id: '1', name: 'Production', prefix: 'rf_sk_prod_...', createdAt: '2026-03-01' },
    { id: '2', name: 'Development', prefix: 'rf_sk_dev_...', createdAt: '2026-03-15' },
  ])

  const [showCreate, setShowCreate] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [creating, setCreating] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const handleCreate = async () => {
    if (!newKeyName.trim()) return
    setCreating(true)
    try {
      await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName }),
      })
    } catch {
      // API not wired — optimistic
    } finally {
      const newKey: ApiKey = {
        id: Date.now().toString(),
        name: newKeyName.trim(),
        prefix: 'rf_sk_' + Math.random().toString(36).slice(2, 8) + '_...',
        createdAt: new Date().toISOString().slice(0, 10),
      }
      setKeys(k => [...k, newKey])
      setNewKeyName('')
      setShowCreate(false)
      setCreating(false)
      show('API key created')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/keys/${id}`, { method: 'DELETE' })
    } catch {
      // optimistic
    }
    setKeys(k => k.filter(key => key.id !== id))
    setDeleteConfirm(null)
    show('API key deleted')
  }

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} />}

      <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
          <h3 className="text-white font-semibold">API Keys</h3>
          <button
            onClick={() => setShowCreate(true)}
            className="text-sm bg-[#FFB81C] hover:bg-[#E6A519] text-black font-bold px-4 py-2 rounded-xl transition-colors"
          >
            Create New Key
          </button>
        </div>

        {/* Create form */}
        {showCreate && (
          <div className="mb-4 p-4 bg-white/5 border border-white/10 rounded-xl">
            <p className="text-white text-sm font-medium mb-3">New API Key</p>
            <input
              type="text"
              value={newKeyName}
              onChange={e => setNewKeyName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="Key name (e.g. Production)"
              className="w-full bg-[#111640] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#FFB81C]/50 transition-colors mb-3"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={handleCreate}
                disabled={!newKeyName.trim() || creating}
                className="text-sm bg-[#FFB81C] hover:bg-[#E6A519] text-black font-bold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
              <button
                onClick={() => { setShowCreate(false); setNewKeyName('') }}
                className="text-sm border border-white/20 text-gray-400 hover:text-white px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Keys list */}
        {keys.length === 0 ? (
          <p className="text-gray-500 text-sm py-4">No API keys yet. Create one to get started.</p>
        ) : (
          <div className="space-y-3">
            {keys.map(key => (
              <div key={key.id} className="flex items-center justify-between gap-4 py-3 border-b border-white/5 last:border-0 flex-wrap">
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium">{key.name}</p>
                  <p className="text-gray-500 text-xs font-mono mt-0.5">{key.prefix}</p>
                  <p className="text-gray-600 text-xs mt-0.5">Created {key.createdAt}</p>
                </div>
                {deleteConfirm === key.id ? (
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleDelete(key.id)}
                      className="text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="text-xs border border-white/20 text-gray-400 hover:text-white px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(key.id)}
                    className="text-xs border border-red-500/20 hover:border-red-500/40 text-red-400 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
                  >
                    Delete
                  </button>
                )}
              </div>
            ))}
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
    marketingEmails: false,
  })

  const toggle = (key: keyof typeof prefs) => {
    setPrefs(p => ({ ...p, [key]: !p[key] }))
  }

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

  const rows: { key: keyof typeof prefs; label: string; description: string }[] = [
    {
      key: 'emailNotifications',
      label: 'Email Notifications',
      description: 'Receive important account and product emails',
    },
    {
      key: 'buildAlerts',
      label: 'Build Completion Alerts',
      description: 'Get notified when a map or voice build finishes',
    },
    {
      key: 'marketingEmails',
      label: 'Marketing Emails',
      description: 'New features, tips, and product announcements',
    },
  ]

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} />}

      <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-4">Notification Preferences</h3>
        <div className="space-y-5">
          {rows.map(row => (
            <div key={row.key} className="flex items-center justify-between gap-4">
              <div>
                <p className="text-white text-sm font-medium">{row.label}</p>
                <p className="text-gray-500 text-xs mt-0.5">{row.description}</p>
              </div>
              <Toggle checked={prefs[row.key]} onChange={() => toggle(row.key)} />
            </div>
          ))}
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="mt-6 bg-[#FFB81C] hover:bg-[#E6A519] text-black font-bold px-6 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-70"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

const TABS: { key: Tab; label: string }[] = [
  { key: 'account', label: 'Account' },
  { key: 'billing', label: 'Billing' },
  { key: 'api-keys', label: 'API Keys' },
  { key: 'notifications', label: 'Notifications' },
]

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('account')

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 mt-1 text-sm">Manage your account and preferences.</p>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-1 mb-6 pb-1 -mx-1 px-1">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              tab === t.key
                ? 'bg-[#FFB81C]/10 text-[#FFB81C] border border-[#FFB81C]/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'account' && <AccountTab />}
      {tab === 'billing' && <BillingTab />}
      {tab === 'api-keys' && <ApiKeysTab />}
      {tab === 'notifications' && <NotificationsTab />}
    </div>
  )
}
