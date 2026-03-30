'use client'

import { useState } from 'react'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Endpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
  summary: string
  auth: boolean
  tier: 'Free' | 'Pro' | 'Studio' | 'All'
  requestBody?: string
  response: string
  curl: string
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const ENDPOINTS: Record<string, Endpoint[]> = {
  'AI Generation': [
    {
      method: 'POST',
      path: '/api/ai/generate',
      summary: 'Generate Luau scripts, terrain configs, or NPC data from a text prompt.',
      auth: true,
      tier: 'All',
      requestBody: JSON.stringify(
        { prompt: 'Build a zombie survival map with fog', agent: 'terrain', model: 'claude-sonnet-4-5', stream: true },
        null,
        2
      ),
      response: JSON.stringify(
        { id: 'gen_abc123', tokens_used: 12, output: '-- Generated Luau script…', agent: 'terrain', model: 'claude-sonnet-4-5', created_at: '2026-03-29T12:00:00Z' },
        null,
        2
      ),
      curl: `curl -X POST https://forjegames.com/api/ai/generate \\
  -H "Authorization: Bearer fg_YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"prompt":"Build a zombie survival map","agent":"terrain","stream":true}'`,
    },
    {
      method: 'POST',
      path: '/api/ai/voice-to-game',
      summary: 'Convert a base64-encoded audio clip to an AI build command and execute it.',
      auth: true,
      tier: 'Pro',
      requestBody: JSON.stringify({ audio_base64: '<base64>', mime_type: 'audio/webm', language: 'en' }, null, 2),
      response: JSON.stringify(
        { transcript: 'Add ambient torches to my map', command_executed: true, generation_id: 'gen_xyz456', tokens_used: 8 },
        null,
        2
      ),
      curl: `curl -X POST https://forjegames.com/api/ai/voice-to-game \\
  -H "Authorization: Bearer fg_YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"audio_base64":"<base64>","mime_type":"audio/webm"}'`,
    },
    {
      method: 'POST',
      path: '/api/ai/image-to-map',
      summary: 'Upload an image and receive a fully built Roblox map. Supports PNG, JPG, WebP up to 10 MB.',
      auth: true,
      tier: 'Pro',
      requestBody: JSON.stringify({ image_base64: '<base64>', mime_type: 'image/png', style: 'realistic' }, null, 2),
      response: JSON.stringify(
        { map_id: 'map_def789', place_file_url: 'https://cdn.forjegames.com/maps/map_def789.rbxl', tokens_used: 5, latency_ms: 11200 },
        null,
        2
      ),
      curl: `curl -X POST https://forjegames.com/api/ai/image-to-map \\
  -H "Authorization: Bearer fg_YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"image_base64":"<base64>","mime_type":"image/png"}'`,
    },
    {
      method: 'POST',
      path: '/api/ai/mesh',
      summary: 'Generate a 3D mesh asset via Meshy AI from a text description.',
      auth: true,
      tier: 'Studio',
      requestBody: JSON.stringify({ prompt: 'Viking longhouse, weathered oak wood', format: 'obj', lod: 'medium' }, null, 2),
      response: JSON.stringify(
        { mesh_id: 'mesh_ghi012', download_url: 'https://cdn.forjegames.com/meshes/mesh_ghi012.obj', tokens_used: 8, poly_count: 4200 },
        null,
        2
      ),
      curl: `curl -X POST https://forjegames.com/api/ai/mesh \\
  -H "Authorization: Bearer fg_YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"prompt":"Viking longhouse, weathered oak wood","format":"obj"}'`,
    },
    {
      method: 'POST',
      path: '/api/ai/texture',
      summary: 'Generate a tileable PBR texture via Fal.ai Flux Pro from a text prompt.',
      auth: true,
      tier: 'Studio',
      requestBody: JSON.stringify({ prompt: 'Mossy stone bricks, seamless tileable 1024x1024', maps: ['albedo', 'normal', 'roughness'] }, null, 2),
      response: JSON.stringify(
        { texture_id: 'tex_jkl345', albedo_url: '…', normal_url: '…', roughness_url: '…', tokens_used: 6 },
        null,
        2
      ),
      curl: `curl -X POST https://forjegames.com/api/ai/texture \\
  -H "Authorization: Bearer fg_YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"prompt":"Mossy stone bricks, seamless","maps":["albedo","normal","roughness"]}'`,
    },
  ],
  'Marketplace': [
    {
      method: 'GET',
      path: '/api/marketplace/search',
      summary: 'Search 500K+ Roblox marketplace assets by keyword, category, and creator.',
      auth: true,
      tier: 'All',
      response: JSON.stringify(
        {
          total: 142,
          page: 1,
          results: [
            { asset_id: 12345678, name: 'Medieval Castle Gate', creator: 'BuilderPro', category: 'Model', thumbnail_url: '…', free: true },
          ],
        },
        null,
        2
      ),
      curl: `curl "https://forjegames.com/api/marketplace/search?q=medieval+castle&category=Model&limit=20" \\
  -H "Authorization: Bearer fg_YOUR_API_KEY"`,
    },
  ],
  'Projects': [
    {
      method: 'GET',
      path: '/api/projects',
      summary: 'List all projects for the authenticated user.',
      auth: true,
      tier: 'All',
      response: JSON.stringify(
        { projects: [{ id: 'proj_abc', name: 'My Zombie Game', created_at: '2026-03-01T00:00:00Z', last_edited: '2026-03-29T12:00:00Z' }] },
        null,
        2
      ),
      curl: `curl https://forjegames.com/api/projects \\
  -H "Authorization: Bearer fg_YOUR_API_KEY"`,
    },
    {
      method: 'POST',
      path: '/api/projects',
      summary: 'Create a new project.',
      auth: true,
      tier: 'All',
      requestBody: JSON.stringify({ name: 'Tower Defense Game', description: 'Classic tower defense with AI-generated waves' }, null, 2),
      response: JSON.stringify({ id: 'proj_new123', name: 'Tower Defense Game', created_at: '2026-03-29T12:00:00Z' }, null, 2),
      curl: `curl -X POST https://forjegames.com/api/projects \\
  -H "Authorization: Bearer fg_YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Tower Defense Game"}'`,
    },
    {
      method: 'POST',
      path: '/api/projects/:id/publish',
      summary: 'Publish a project to Roblox via the Open Cloud API.',
      auth: true,
      tier: 'Pro',
      requestBody: JSON.stringify({ roblox_universe_id: 9876543210, version_type: 'Published' }, null, 2),
      response: JSON.stringify(
        { success: true, place_id: 12345678901, url: 'https://www.roblox.com/games/12345678901', published_at: '2026-03-29T12:00:00Z' },
        null,
        2
      ),
      curl: `curl -X POST https://forjegames.com/api/projects/proj_abc/publish \\
  -H "Authorization: Bearer fg_YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"roblox_universe_id":9876543210}'`,
    },
  ],
  'Tokens': [
    {
      method: 'GET',
      path: '/api/tokens/balance',
      summary: 'Get current token balance and daily usage for the authenticated user.',
      auth: true,
      tier: 'All',
      response: JSON.stringify(
        { balance: 487, daily_limit: 500, used_today: 13, resets_at: '2026-03-30T00:00:00Z', plan: 'starter' },
        null,
        2
      ),
      curl: `curl https://forjegames.com/api/tokens/balance \\
  -H "Authorization: Bearer fg_YOUR_API_KEY"`,
    },
  ],
}

const RATE_LIMITS = [
  { plan: 'Starter (Free)', tokens: '50 / day', requests: '60 / min', concurrent: '1' },
  { plan: 'Pro ($29/mo)', tokens: '2,000 / day', requests: '200 / min', concurrent: '3' },
  { plan: 'Studio ($79/mo)', tokens: '10,000 / day', requests: '600 / min', concurrent: '10' },
  { plan: 'Team ($149/mo)', tokens: '50,000 / day', requests: '2,000 / min', concurrent: '25' },
]

const ERROR_CODES = [
  { code: '400', name: 'Bad Request', detail: 'Missing or invalid request body fields.' },
  { code: '401', name: 'Unauthorized', detail: 'API key missing or invalid. Check Authorization header.' },
  { code: '403', name: 'Forbidden', detail: 'Your plan does not include this endpoint.' },
  { code: '429', name: 'Too Many Requests', detail: 'Rate limit exceeded. Retry after the Retry-After header value.' },
  { code: '500', name: 'Internal Server Error', detail: 'ForjeGames server error. Retryable. Contact support if persistent.' },
  { code: '503', name: 'AI Unavailable', detail: 'Upstream AI provider (Claude / Meshy / Fal) is unreachable. Retry with exponential backoff.' },
]

const METHOD_COLOR: Record<string, string> = {
  GET: 'text-emerald-400 bg-emerald-400/10',
  POST: 'text-blue-400 bg-blue-400/10',
  PUT: 'text-yellow-400 bg-yellow-400/10',
  DELETE: 'text-red-400 bg-red-400/10',
}

const TIER_COLOR: Record<string, string> = {
  All: 'text-white/40 bg-white/5',
  Free: 'text-emerald-400 bg-emerald-400/10',
  Pro: 'text-blue-400 bg-blue-400/10',
  Studio: 'text-purple-400 bg-purple-400/10',
}

export default function ApiReferencePage() {
  const [activeTab, setActiveTab] = useState<Record<string, 'curl' | 'request' | 'response'>>({})

  const getTab = (path: string): 'curl' | 'request' | 'response' =>
    activeTab[path] ?? 'curl'

  const setTab = (path: string, tab: 'curl' | 'request' | 'response') =>
    setActiveTab((prev) => ({ ...prev, [path]: tab }))

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Breadcrumb */}
      <div className="border-b border-white/5 px-6 py-3 text-xs text-white/30">
        <Link href="/docs" className="hover:text-[#D4AF37]">Docs</Link>
        <span className="mx-2">/</span>
        <span className="text-white/60">API Reference</span>
      </div>

      {/* Hero */}
      <section className="border-b border-white/5 px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#D4AF37]">
            API Reference
          </p>
          <h1 className="mb-4 text-4xl font-bold tracking-tight">REST API</h1>
          <p className="mb-6 max-w-xl text-base text-white/45">
            Base URL: <code className="rounded bg-white/5 px-2 py-0.5 font-mono text-sm text-white/70">https://forjegames.com</code>
            <br />
            All endpoints return JSON. All authenticated endpoints require a Bearer token.
          </p>

          {/* Auth block */}
          <div className="rounded-xl border border-white/5 bg-[#141414] p-5">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/30">Authentication</div>
            <p className="mb-3 text-sm text-white/50">
              Generate an API key in{' '}
              <Link href="/settings/api-keys" className="text-[#D4AF37] hover:underline">
                Settings → API Keys
              </Link>
              . Pass it as a Bearer token on every request.
            </p>
            <pre className="overflow-x-auto rounded-lg bg-black/40 p-4 font-mono text-sm text-white/65">
              {`Authorization: Bearer fg_YOUR_API_KEY`}
            </pre>
          </div>
        </div>
      </section>

      {/* Endpoints */}
      <section className="mx-auto max-w-4xl px-6 py-16 space-y-16">
        {Object.entries(ENDPOINTS).map(([group, endpoints]) => (
          <div key={group}>
            <h2 className="mb-6 text-xl font-bold text-white">{group}</h2>
            <div className="space-y-6">
              {endpoints.map((ep) => (
                <div
                  key={ep.path}
                  className="overflow-hidden rounded-2xl border border-white/5 bg-[#141414]"
                >
                  {/* Header */}
                  <div className="flex flex-wrap items-center gap-3 border-b border-white/5 px-5 py-4">
                    <span className={`rounded px-2 py-0.5 text-xs font-bold ${METHOD_COLOR[ep.method]}`}>
                      {ep.method}
                    </span>
                    <code className="flex-1 font-mono text-sm text-white/80">{ep.path}</code>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${TIER_COLOR[ep.tier]}`}>
                      {ep.tier}
                    </span>
                    {ep.auth && (
                      <span className="rounded-full bg-[#D4AF37]/10 px-2.5 py-0.5 text-[10px] font-semibold text-[#D4AF37]">
                        Auth
                      </span>
                    )}
                  </div>

                  {/* Summary */}
                  <div className="border-b border-white/5 px-5 py-3">
                    <p className="text-sm text-white/50">{ep.summary}</p>
                  </div>

                  {/* Tabs */}
                  <div className="border-b border-white/5 px-5">
                    <div className="flex gap-4">
                      {(['curl', ...(ep.requestBody ? ['request'] : []), 'response'] as const).map(
                        (tab) => (
                          <button
                            key={tab}
                            onClick={() => setTab(ep.path, tab as 'curl' | 'request' | 'response')}
                            className={`border-b-2 py-3 text-xs font-semibold transition ${
                              getTab(ep.path) === tab
                                ? 'border-[#D4AF37] text-[#D4AF37]'
                                : 'border-transparent text-white/30 hover:text-white/60'
                            }`}
                          >
                            {tab === 'curl' ? 'cURL' : tab === 'request' ? 'Request' : 'Response'}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* Code */}
                  <div className="px-5 py-4">
                    <pre className="overflow-x-auto font-mono text-sm leading-relaxed text-white/60">
                      {getTab(ep.path) === 'curl'
                        ? ep.curl
                        : getTab(ep.path) === 'request'
                        ? ep.requestBody
                        : ep.response}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Rate Limits */}
        <div id="rate-limits">
          <h2 className="mb-6 text-xl font-bold">Rate Limits</h2>
          <div className="overflow-hidden rounded-2xl border border-white/5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-[#141414]">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/30">Plan</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/30">Tokens</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/30">Requests/min</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/30">Concurrent</th>
                </tr>
              </thead>
              <tbody>
                {RATE_LIMITS.map((row, i) => (
                  <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/2">
                    <td className="px-5 py-3 text-white/70">{row.plan}</td>
                    <td className="px-5 py-3 font-mono text-white/55">{row.tokens}</td>
                    <td className="px-5 py-3 font-mono text-white/55">{row.requests}</td>
                    <td className="px-5 py-3 font-mono text-white/55">{row.concurrent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-white/30">
            Rate limit headers are returned on every response: <code className="font-mono">X-RateLimit-Remaining</code>,{' '}
            <code className="font-mono">X-RateLimit-Reset</code>, <code className="font-mono">Retry-After</code>.
          </p>
        </div>

        {/* Errors */}
        <div id="errors">
          <h2 className="mb-6 text-xl font-bold">Error Codes</h2>
          <div className="space-y-3">
            {ERROR_CODES.map((e) => (
              <div key={e.code} className="flex gap-4 rounded-xl border border-white/5 bg-[#141414] px-5 py-4">
                <span className="shrink-0 font-mono text-sm font-bold text-[#D4AF37]">{e.code}</span>
                <div>
                  <div className="mb-0.5 text-sm font-semibold text-white">{e.name}</div>
                  <div className="text-sm text-white/45">{e.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SDKs */}
        <div id="sdks">
          <h2 className="mb-4 text-xl font-bold">SDKs</h2>
          <p className="mb-5 text-sm text-white/45">
            Official SDKs are in development. In the meantime, the REST API works with any HTTP client.
            Community SDKs for Python, Node.js, and Luau are maintained by the community on{' '}
            <a href="https://github.com/forjegames" className="text-[#D4AF37] hover:underline">
              GitHub
            </a>
            .
          </p>
          <div className="overflow-hidden rounded-xl border border-white/5 bg-[#141414]">
            <div className="border-b border-white/5 px-5 py-3">
              <span className="text-xs text-white/30">JavaScript / TypeScript</span>
            </div>
            <pre className="overflow-x-auto p-5 font-mono text-sm text-white/60">
              {`const res = await fetch('https://forjegames.com/api/ai/generate', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer fg_YOUR_API_KEY',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ prompt: 'Build a volcano island', agent: 'terrain' }),
})
const data = await res.json()
console.log(data.output)`}
            </pre>
          </div>
        </div>
      </section>
    </div>
  )
}
