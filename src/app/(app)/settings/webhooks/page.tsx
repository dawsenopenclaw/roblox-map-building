'use client'
import { useState, useEffect } from 'react'

type Endpoint = {
  id: string
  url: string
  events: string[]
  active: boolean
  createdAt: string
  deliveries: { event: string; statusCode: number | null; success: boolean; createdAt: string }[]
}

const ALL_EVENTS = [
  { value: 'build.completed', label: 'Build Completed', description: 'When a map build finishes successfully' },
  { value: 'build.failed', label: 'Build Failed', description: 'When a map build fails' },
  { value: 'template.sold', label: 'Template Sold', description: 'When a marketplace template is purchased' },
  { value: 'token.low', label: 'Tokens Low', description: 'When token balance drops below 200' },
]

export default function WebhooksPage() {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newSecret, setNewSecret] = useState<{ secret: string; id: string } | null>(null)
  const [form, setForm] = useState({ url: '', events: ALL_EVENTS.map((e) => e.value) })
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

  useEffect(() => { fetchEndpoints() }, [])

  async function fetchEndpoints() {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/webhooks`, { credentials: 'include' })
      if (res.ok) setEndpoints((await res.json()).endpoints)
    } finally {
      setLoading(false)
    }
  }

  async function createEndpoint() {
    if (!form.url) return
    setCreating(true)
    try {
      const res = await fetch(`${API_BASE}/api/webhooks`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        const data = await res.json()
        setNewSecret({ secret: data.endpoint.secret, id: data.endpoint.id })
        setShowCreate(false)
        setForm({ url: '', events: ALL_EVENTS.map((e) => e.value) })
        await fetchEndpoints()
      }
    } finally {
      setCreating(false)
    }
  }

  async function deleteEndpoint(id: string) {
    await fetch(`${API_BASE}/api/webhooks/${id}`, { method: 'DELETE', credentials: 'include' })
    setDeleteConfirm(null)
    await fetchEndpoints()
  }

  function toggleEvent(event: string) {
    setForm((f) => ({
      ...f,
      events: f.events.includes(event) ? f.events.filter((e) => e !== event) : [...f.events, event],
    }))
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Webhooks</h1>
          <p className="text-gray-400 mt-1 text-sm">
            Receive HTTP POST callbacks when events occur in your account.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-[#FFB81C] hover:bg-[#E6A519] text-black font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
        >
          + Add Endpoint
        </button>
      </div>

      {/* Secret banner */}
      {newSecret && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 mb-6">
          <p className="text-green-400 font-semibold mb-2">Webhook Secret</p>
          <p className="text-gray-300 text-sm mb-3">
            Use this to verify webhook signatures (HMAC-SHA256). Not shown again.
          </p>
          <div className="flex items-center gap-2 bg-black/30 rounded-xl px-4 py-3">
            <code className="text-green-300 text-sm font-mono flex-1 break-all">{newSecret.secret}</code>
            <button
              onClick={() => navigator.clipboard.writeText(newSecret.secret)}
              className="text-xs text-gray-400 hover:text-white border border-white/10 hover:border-white/30 px-2 py-1 rounded-lg transition-colors flex-shrink-0"
            >
              Copy
            </button>
          </div>
          <button onClick={() => setNewSecret(null)} className="mt-3 text-gray-500 hover:text-white text-sm">
            Dismiss
          </button>
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-6 w-full max-w-lg">
            <h2 className="text-white font-bold text-lg mb-6">Add Webhook Endpoint</h2>

            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-1.5">Endpoint URL</label>
              <input
                type="url"
                value={form.url}
                onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                placeholder="https://your-server.com/webhooks/robloxforge"
                className="w-full bg-[#111640] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#FFB81C]/50 transition-colors"
              />
              <p className="text-gray-600 text-xs mt-1">Must be HTTPS.</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-3">Events to Subscribe</label>
              <div className="space-y-3">
                {ALL_EVENTS.map((evt) => (
                  <label key={evt.value} className="flex items-start gap-3 cursor-pointer group">
                    <div
                      className={`w-5 h-5 rounded border flex items-center justify-center transition-colors mt-0.5 flex-shrink-0 ${
                        form.events.includes(evt.value)
                          ? 'bg-[#FFB81C] border-[#FFB81C]'
                          : 'border-white/20 group-hover:border-white/40'
                      }`}
                      onClick={() => toggleEvent(evt.value)}
                    >
                      {form.events.includes(evt.value) && (
                        <span className="text-black text-xs font-bold">&#10003;</span>
                      )}
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{evt.label}</p>
                      <p className="text-gray-500 text-xs">{evt.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={createEndpoint}
                disabled={creating || !form.url}
                className="flex-1 bg-[#FFB81C] hover:bg-[#E6A519] text-black font-bold py-3 rounded-xl text-sm transition-colors disabled:opacity-50"
              >
                {creating ? 'Adding...' : 'Add Endpoint'}
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="px-5 border border-white/10 hover:border-white/30 text-gray-400 hover:text-white rounded-xl text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Endpoints list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-[#0D1231] border border-white/10 rounded-2xl p-5 animate-pulse h-28" />
          ))}
        </div>
      ) : endpoints.length === 0 ? (
        <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-12 text-center">
          <div className="text-4xl mb-4">&#128257;</div>
          <h3 className="text-white font-semibold mb-2">No webhook endpoints</h3>
          <p className="text-gray-400 text-sm mb-6">
            Add an endpoint to start receiving real-time event notifications.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {endpoints.map((ep) => {
            const lastDelivery = ep.deliveries[0]
            return (
              <div key={ep.id} className="bg-[#0D1231] border border-white/10 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${ep.active ? 'bg-green-400' : 'bg-gray-500'}`}
                      />
                      <code className="text-white text-sm font-mono truncate">{ep.url}</code>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {ep.events.map((e) => (
                        <span key={e} className="text-xs bg-white/5 border border-white/10 text-gray-400 px-2 py-0.5 rounded-full">
                          {e}
                        </span>
                      ))}
                    </div>
                    {lastDelivery ? (
                      <p className="text-gray-600 text-xs">
                        Last delivery: {new Date(lastDelivery.createdAt).toLocaleString()} &mdash;{' '}
                        <span className={lastDelivery.success ? 'text-green-500' : 'text-red-500'}>
                          {lastDelivery.success ? 'Success' : `Failed (${lastDelivery.statusCode ?? 'no response'})`}
                        </span>
                      </p>
                    ) : (
                      <p className="text-gray-600 text-xs">No deliveries yet</p>
                    )}
                  </div>

                  {deleteConfirm === ep.id ? (
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => deleteEndpoint(ep.id)}
                        className="text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg transition-colors font-semibold"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="text-xs border border-white/10 text-gray-400 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(ep.id)}
                      className="text-xs border border-red-500/20 hover:border-red-500/50 text-red-400 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Signature verification guide */}
      <div className="mt-8 bg-[#0D1231] border border-white/10 rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-3">Verifying Signatures</h3>
        <p className="text-gray-400 text-sm mb-4">
          Every request includes an <code className="text-[#FFB81C] bg-[#FFB81C]/10 px-1 rounded">X-RobloxForge-Signature</code> header
          with an HMAC-SHA256 signature. Verify it to ensure authenticity.
        </p>
        <pre className="bg-black/40 rounded-xl p-4 text-xs text-green-300 font-mono overflow-x-auto">
{`import crypto from 'crypto'

function verifySignature(secret, payload, signature) {
  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signature)
  )
}`}
        </pre>
      </div>
    </div>
  )
}
