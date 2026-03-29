'use client'
import { useState } from 'react'
import Link from 'next/link'
import { CharitySelector } from '@/components/CharitySelector'
import { resetOnboardingTour } from '@/components/OnboardingTooltips'

type Tab = 'account' | 'notifications' | 'charity' | 'team' | 'danger'

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'account', label: 'Account', icon: '👤' },
  { key: 'notifications', label: 'Notifications', icon: '🔔' },
  { key: 'charity', label: 'Charity', icon: '💛' },
  { key: 'team', label: 'Team', icon: '👥' },
  { key: 'danger', label: 'Danger Zone', icon: '⚠️' },
]

function AccountTab() {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    username: 'creator_dawsen',
    email: 'dawsen@robloxforge.gg',
    displayName: 'Dawsen',
  })

  const handleSave = async () => {
    setSaving(true)
    // Real call to /api/user/update would go here
    await new Promise(r => setTimeout(r, 800))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Avatar */}
      <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-4">Profile Photo</h3>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#FFB81C]/20 border-2 border-[#FFB81C]/30 flex items-center justify-center text-[#FFB81C] text-2xl font-bold">
            D
          </div>
          <div>
            <button
              onClick={() => alert('Photo upload coming soon. Use Clerk profile settings.')}
              className="text-sm bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Upload photo
            </button>
            <p className="text-gray-600 text-xs mt-1">JPG or PNG. Max 2MB.</p>
          </div>
        </div>
      </div>

      {/* Profile fields */}
      <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-4">Profile Details</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Display Name</label>
            <input
              type="text"
              value={form.displayName}
              onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
              className="w-full bg-[#111640] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#FFB81C]/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Username</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">@</span>
              <input
                type="text"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                className="w-full bg-[#111640] border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white text-sm focus:outline-none focus:border-[#FFB81C]/50 transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full bg-[#111640] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#FFB81C]/50 transition-colors"
            />
            <p className="text-gray-600 text-xs mt-1">Email changes require verification.</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-6 bg-[#FFB81C] hover:bg-[#E6A519] text-black font-bold px-6 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-70"
        >
          {saved ? 'Saved!' : saving ? 'Saving...' : 'Save changes'}
        </button>
      </div>

      {/* Onboarding tour */}
      <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-1">Product Tour</h3>
        <p className="text-gray-500 text-sm mb-4">Re-run the onboarding tooltips to rediscover key features.</p>
        <button
          onClick={() => { resetOnboardingTour(); window.location.href = '/dashboard' }}
          className="text-sm bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Re-run dashboard tour
        </button>
      </div>

      {/* Password */}
      <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-2">Password</h3>
        <p className="text-gray-400 text-sm mb-4">
          Password management is handled through Clerk. Click below to update.
        </p>
        <button
          onClick={() => window.open('https://accounts.clerk.dev', '_blank')}
          className="text-sm border border-white/20 hover:border-white/40 text-white px-4 py-2.5 rounded-xl transition-colors"
        >
          Change password
        </button>
      </div>

      {/* Billing link */}
      <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-2">Billing</h3>
        <p className="text-gray-400 text-sm mb-4">
          Manage your subscription, invoices, and payment methods.
        </p>
        <Link
          href="/billing"
          className="text-sm bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-2.5 rounded-xl transition-colors inline-block"
        >
          Go to Billing →
        </Link>
      </div>
    </div>
  )
}

function NotificationsTab() {
  const [prefs, setPrefs] = useState({
    emailBuildComplete: true,
    emailTokenLow: true,
    emailMarketing: false,
    emailInvoices: true,
    pushBuildComplete: true,
    pushTokenLow: false,
  })
  const [saved, setSaved] = useState(false)

  const toggle = (key: keyof typeof prefs) => {
    setPrefs(p => ({ ...p, [key]: !p[key] }))
  }

  const save = async () => {
    await new Promise(r => setTimeout(r, 500))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const rows: { key: keyof typeof prefs; label: string; description: string; type: 'email' | 'push' }[] = [
    { key: 'emailBuildComplete', label: 'Build complete', description: 'When a voice build or map finishes', type: 'email' },
    { key: 'emailTokenLow', label: 'Tokens running low', description: 'When you have under 200 tokens left', type: 'email' },
    { key: 'emailInvoices', label: 'Invoices & receipts', description: 'For all billing events', type: 'email' },
    { key: 'emailMarketing', label: 'Product updates', description: 'New features and announcements', type: 'email' },
    { key: 'pushBuildComplete', label: 'Build complete', description: 'Browser push when a build finishes', type: 'push' },
    { key: 'pushTokenLow', label: 'Tokens running low', description: 'Browser push for low balance', type: 'push' },
  ]

  return (
    <div className="space-y-6">
      {(['email', 'push'] as const).map(type => (
        <div key={type} className="bg-[#0D1231] border border-white/10 rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-4 capitalize">{type} Notifications</h3>
          <div className="space-y-4">
            {rows.filter(r => r.type === type).map(row => (
              <div key={row.key} className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-white text-sm font-medium">{row.label}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{row.description}</p>
                </div>
                <button
                  onClick={() => toggle(row.key)}
                  className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${
                    prefs[row.key] ? 'bg-[#FFB81C]' : 'bg-white/10'
                  }`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    prefs[row.key] ? 'translate-x-4' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
      <button
        onClick={save}
        className="bg-[#FFB81C] hover:bg-[#E6A519] text-black font-bold px-6 py-2.5 rounded-xl text-sm transition-colors"
      >
        {saved ? 'Saved!' : 'Save preferences'}
      </button>
    </div>
  )
}

function TeamTab() {
  return (
    <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-8 text-center">
      <div className="text-4xl mb-4">👥</div>
      <h3 className="text-white font-semibold text-lg mb-2">Team Collaboration</h3>
      <p className="text-gray-400 text-sm max-w-sm mx-auto mb-4">
        Invite teammates, assign roles, and build together.
        Team features are coming in Phase 7.
      </p>
      <span className="text-xs bg-[#FFB81C]/10 text-[#FFB81C] border border-[#FFB81C]/20 px-3 py-1 rounded-full">
        Coming soon
      </span>
    </div>
  )
}

function DangerTab() {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')

  return (
    <div className="space-y-6">
      <div className="bg-[#0D1231] border border-red-500/20 rounded-2xl p-6">
        <h3 className="text-red-400 font-semibold mb-2">Delete Account</h3>
        <p className="text-gray-400 text-sm mb-4">
          Permanently delete your account and all data. This action cannot be undone.
          Your subscription will be cancelled and data deleted within 30 days per our{' '}
          <Link href="/privacy" className="text-[#FFB81C] hover:underline">Privacy Policy</Link>.
        </p>

        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="text-sm border border-red-500/30 hover:border-red-500/60 text-red-400 px-4 py-2.5 rounded-xl transition-colors"
          >
            Delete my account
          </button>
        ) : (
          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
            <p className="text-white text-sm font-medium mb-3">
              Type <span className="font-mono text-red-400">delete my account</span> to confirm:
            </p>
            <input
              type="text"
              value={deleteInput}
              onChange={e => setDeleteInput(e.target.value)}
              placeholder="delete my account"
              className="w-full bg-[#111640] border border-red-500/30 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-red-500 mb-4 transition-colors"
            />
            <div className="flex gap-3">
              <button
                disabled={deleteInput !== 'delete my account'}
                onClick={async () => {
                  try {
                    await fetch('/api/user/delete', { method: 'DELETE' })
                    window.location.href = '/sign-in'
                  } catch {
                    // non-fatal — user stays on page
                  }
                }}
                className="text-sm bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Permanently delete
              </button>
              <button
                onClick={() => { setConfirmDelete(false); setDeleteInput('') }}
                className="text-sm border border-white/20 text-gray-400 hover:text-white px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-2">Export Data</h3>
        <p className="text-gray-400 text-sm mb-4">
          Download all your projects, builds, and account data. Provided within 48 hours per GDPR/CCPA.
        </p>
        <button
          onClick={async () => {
            try {
              await fetch('/api/user/export', { method: 'POST' })
              alert('Export requested. You will receive an email within 48 hours.')
            } catch {
              alert('Failed to request export. Please try again.')
            }
          }}
          className="text-sm border border-white/20 hover:border-white/40 text-white px-4 py-2.5 rounded-xl transition-colors"
        >
          Request data export
        </button>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('account')

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 mt-1 text-sm">Manage your account and preferences.</p>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-1 mb-6 pb-1">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              tab === t.key
                ? 'bg-[#FFB81C]/10 text-[#FFB81C] border border-[#FFB81C]/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'account' && <AccountTab />}
      {tab === 'notifications' && <NotificationsTab />}
      {tab === 'charity' && (
        <div className="max-w-lg">
          <CharitySelector />
        </div>
      )}
      {tab === 'team' && <TeamTab />}
      {tab === 'danger' && <DangerTab />}
    </div>
  )
}
