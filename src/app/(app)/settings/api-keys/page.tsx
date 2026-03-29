'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

type ApiKey = {
  id: string
  name: string
  prefix: string
  scopes: string[]
  tier: string
  lastUsedAt: string | null
  expiresAt: string | null
  createdAt: string
}

const SCOPE_OPTIONS = [
  { value: 'full', label: 'Full Access', description: 'All endpoints' },
  { value: 'terrain-only', label: 'Terrain Only', description: 'Terrain generation endpoints' },
  { value: 'assets-only', label: 'Assets Only', description: 'Asset generation endpoints' },
  { value: 'read-only', label: 'Read Only', description: 'Read endpoints only' },
]

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard not available
    }
  }
  return (
    <button
      onClick={copy}
      className="text-xs text-gray-400 hover:text-white border border-white/10 hover:border-white/30 px-2 py-1 rounded-lg transition-colors"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newKeyData, setNewKeyData] = useState<{ rawKey: string; id: string } | null>(null)
  const [form, setForm] = useState({ name: '', scopes: ['read-only'] as string[] })
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? ''

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchKeys()
  }, [])

  async function fetchKeys() {
    setLoading(true)
    setFetchError(null)
    try {
      const url = API_BASE ? `${API_BASE}/api/keys` : '/api/keys'
      const res = await fetch(url, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setKeys(Array.isArray(data.keys) ? data.keys : [])
      } else if (res.status === 401) {
        setFetchError('Session expired. Please sign in again.')
      } else {
        setKeys([])
      }
    } catch {
      setFetchError(null) // No API server yet — show empty state instead of error
      setKeys([])
    } finally {
      setLoading(false)
    }
  }

  async function createKey() {
    if (!form.name.trim()) return
    setCreating(true)
    setCreateError(null)
    try {
      const url = API_BASE ? `${API_BASE}/api/keys` : '/api/keys'
      const res = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, scopes: form.scopes }),
      })
      if (res.ok) {
        const data = await res.json()
        setNewKeyData({ rawKey: data.key.rawKey, id: data.key.id })
        setShowCreate(false)
        setForm({ name: '', scopes: ['read-only'] })
        await fetchKeys()
      } else {
        const err = await res.json().catch(() => ({}))
        setCreateError(err.error ?? 'Failed to create key. Please try again.')
      }
    } catch {
      setCreateError('Could not reach the API. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  async function deleteKey(id: string) {
    setDeleteError(null)
    try {
      const url = API_BASE ? `${API_BASE}/api/keys/${id}` : `/api/keys/${id}`
      const res = await fetch(url, { method: 'DELETE', credentials: 'include' })
      if (!res.ok) throw new Error('Delete failed')
    } catch {
      setDeleteError('Failed to revoke key. Please try again.')
    } finally {
      setDeleteConfirm(null)
      await fetchKeys()
    }
  }

  function toggleScope(scope: string) {
    setForm((f) => ({
      ...f,
      scopes: f.scopes.includes(scope)
        ? f.scopes.filter((s) => s !== scope)
        : [...f.scopes, scope],
    }))
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">API Keys</h1>
          <p className="text-gray-400 mt-1 text-sm">
            Manage keys for programmatic access to RobloxForge.
          </p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setCreateError(null) }}
          className="bg-[#FFB81C] hover:bg-[#E6A519] text-black font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
        >
          + New Key
        </button>
      </div>

      {/* Newly created key banner */}
      {newKeyData && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-green-400 font-semibold mb-2">API Key Created</p>
              <p className="text-gray-300 text-sm mb-3">
                Copy this key now — it will never be shown again.
              </p>
              <div className="flex items-center gap-2 bg-black/30 rounded-xl px-4 py-3">
                <code className="text-green-300 text-sm font-mono flex-1 break-all">
                  {newKeyData.rawKey}
                </code>
                <CopyButton text={newKeyData.rawKey} />
              </div>
            </div>
            <button onClick={() => setNewKeyData(null)} className="text-gray-500 hover:text-white text-xl">
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Create form modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-white font-bold text-lg mb-6">Create API Key</h2>

            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-1.5">Key Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && createKey()}
                placeholder="e.g. Production, My Script"
                className="w-full bg-[#111640] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#FFB81C]/50 transition-colors"
                autoFocus
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-3">Scopes</label>
              <div className="space-y-2">
                {SCOPE_OPTIONS.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-3 cursor-pointer group">
                    <div
                      className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                        form.scopes.includes(opt.value)
                          ? 'bg-[#FFB81C] border-[#FFB81C]'
                          : 'border-white/20 group-hover:border-white/40'
                      }`}
                      onClick={() => toggleScope(opt.value)}
                    >
                      {form.scopes.includes(opt.value) && (
                        <span className="text-black text-xs font-bold">&#10003;</span>
                      )}
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{opt.label}</p>
                      <p className="text-gray-500 text-xs">{opt.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {createError && (
              <p className="text-red-400 text-sm mb-4">{createError}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={createKey}
                disabled={creating || !form.name.trim() || form.scopes.length === 0}
                className="flex-1 bg-[#FFB81C] hover:bg-[#E6A519] text-black font-bold py-3 rounded-xl text-sm transition-colors disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create Key'}
              </button>
              <button
                onClick={() => { setShowCreate(false); setCreateError(null) }}
                className="px-5 border border-white/10 hover:border-white/30 text-gray-400 hover:text-white rounded-xl text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fetch error */}
      {fetchError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-4">
          <p className="text-red-400 text-sm">{fetchError}</p>
        </div>
      )}

      {/* Delete error */}
      {deleteError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-4">
          <p className="text-red-400 text-sm">{deleteError}</p>
        </div>
      )}

      {/* Key list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-[#0D1231] border border-white/10 rounded-2xl p-5 animate-pulse h-24" />
          ))}
        </div>
      ) : keys.length === 0 ? (
        <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-12 text-center">
          <div className="text-4xl mb-4">&#128273;</div>
          <h3 className="text-white font-semibold mb-2">No API keys yet</h3>
          <p className="text-gray-400 text-sm mb-6">
            Create your first key to start using the RobloxForge API.
          </p>
          <button
            onClick={() => { setShowCreate(true); setCreateError(null) }}
            className="bg-[#FFB81C] hover:bg-[#E6A519] text-black font-bold px-6 py-2.5 rounded-xl text-sm transition-colors"
          >
            Create API Key
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {keys.map((key) => (
            <div key={key.id} className="bg-[#0D1231] border border-white/10 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <Link href={`/settings/api-keys/${key.id}`} className="text-white font-semibold hover:text-[#FFB81C] transition-colors">
                      {key.name}
                    </Link>
                    <span className="text-xs bg-white/5 border border-white/10 text-gray-400 px-2 py-0.5 rounded-full">
                      {key.tier}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <code className="text-[#FFB81C] text-sm font-mono">{key.prefix}...</code>
                    <CopyButton text={key.prefix} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {key.scopes.map((s) => (
                      <span
                        key={s}
                        className="text-xs bg-[#FFB81C]/10 text-[#FFB81C] border border-[#FFB81C]/20 px-2 py-0.5 rounded-full"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                  <p className="text-gray-600 text-xs mt-2">
                    Created {new Date(key.createdAt).toLocaleDateString()}
                    {key.lastUsedAt && ` · Last used ${new Date(key.lastUsedAt).toLocaleDateString()}`}
                    {key.expiresAt && ` · Expires ${new Date(key.expiresAt).toLocaleDateString()}`}
                  </p>
                </div>

                {deleteConfirm === key.id ? (
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => deleteKey(key.id)}
                      className="text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg transition-colors font-semibold"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="text-xs border border-white/10 hover:border-white/30 text-gray-400 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(key.id)}
                    className="text-xs border border-red-500/20 hover:border-red-500/50 text-red-400 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
                  >
                    Revoke
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rate limit info */}
      <div className="mt-8 bg-[#0D1231] border border-white/10 rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-3">Rate Limits by Tier</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-white/10">
                <th className="text-left py-2 pr-4">Tier</th>
                <th className="text-left py-2 pr-4">Requests/min</th>
                <th className="text-left py-2">Requests/day</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              {[
                { tier: 'Free', rpm: '60', rpd: '1,000' },
                { tier: 'Hobby', rpm: '120', rpd: '10,000' },
                { tier: 'Creator', rpm: '300', rpd: '50,000' },
                { tier: 'Studio', rpm: '600', rpd: 'Unlimited' },
              ].map((row) => (
                <tr key={row.tier} className="border-b border-white/5">
                  <td className="py-2.5 pr-4 font-medium">{row.tier}</td>
                  <td className="py-2.5 pr-4">{row.rpm}</td>
                  <td className="py-2.5">{row.rpd}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
