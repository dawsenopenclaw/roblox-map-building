'use client'

import { useState, useCallback } from 'react'
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
  GET: 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/20',
  POST: 'text-[#FFB81C] bg-[#FFB81C]/10 border border-[#FFB81C]/20',
  PUT: 'text-amber-400 bg-amber-400/10 border border-amber-400/20',
  DELETE: 'text-rose-400 bg-rose-400/10 border border-rose-400/20',
}

const TIER_COLOR: Record<string, string> = {
  All: 'text-[#71717A] bg-white/[0.025] border border-white/[0.07]',
  Free: 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/20',
  Pro: 'text-[#FFB81C] bg-[#FFB81C]/10 border border-[#FFB81C]/20',
  Studio: 'text-purple-400 bg-purple-400/10 border border-purple-400/20',
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    }).catch(() => {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.cssText = 'position:fixed;opacity:0'
      document.body.appendChild(ta)
      ta.focus(); ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }, [text])
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs text-[#71717A] transition-colors hover:bg-white/[0.05] hover:text-[#FAFAFA]"
    >
      {copied ? (
        <>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <polyline points="2 8 6 12 14 4" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-emerald-400">Copied</span>
        </>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          Copy
        </>
      )}
    </button>
  )
}

function CodePane({ code, lang }: { code: string; lang: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.07]" style={{ background: '#0A0E27' }}>
      <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-2">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[#52525B]">{lang}</span>
        <CopyButton text={code} />
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-sm leading-relaxed text-[#FAFAFA]/65">
        <code>{code}</code>
      </pre>
    </div>
  )
}

export default function ApiReferencePage() {
  const [activeTab, setActiveTab] = useState<Record<string, 'curl' | 'request' | 'response'>>({})

  const getTab = (path: string): 'curl' | 'request' | 'response' =>
    activeTab[path] ?? 'curl'

  const setTab = (path: string, tab: 'curl' | 'request' | 'response') =>
    setActiveTab((prev) => ({ ...prev, [path]: tab }))

  return (
    <div className="min-h-screen bg-[#050810] text-[#FAFAFA]">
      {/* Breadcrumb */}
      <div className="border-b border-white/[0.07] bg-[#0A0E27]/60 px-6 py-3 text-xs text-[#52525B]">
        <Link href="/docs" className="transition-colors hover:text-[#D4AF37]">Docs</Link>
        <span className="mx-2 text-white/15">/</span>
        <span className="text-[#71717A]">API Reference</span>
      </div>

      {/* Hero */}
      <section className="border-b border-white/[0.07] px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.12em]" style={{ color: 'rgba(212,175,55,0.6)' }}>
            API Reference
          </p>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-[#FAFAFA]">REST API</h1>
          <p className="mb-6 max-w-xl text-base text-[#71717A]">
            Base URL:{' '}
            <code className="rounded-md border border-white/[0.07] bg-white/[0.025] px-2 py-0.5 font-mono text-sm text-[#FAFAFA]/70">
              https://forjegames.com
            </code>
            <br className="mt-1 block" />
            All endpoints return JSON. All authenticated endpoints require a Bearer token.
          </p>

          {/* Auth block */}
          <div className="rounded-2xl border border-white/[0.07] p-5" style={{ background: 'rgba(255,255,255,0.025)' }}>
            <div className="mb-2 text-[12px] font-semibold uppercase tracking-[0.12em]" style={{ color: 'rgba(212,175,55,0.6)' }}>
              Authentication
            </div>
            <p className="mb-4 text-sm text-[#71717A]">
              Generate an API key in{' '}
              <Link href="/settings/api-keys" className="text-[#D4AF37] transition-colors hover:underline">
                Settings → API Keys
              </Link>
              . Pass it as a Bearer token on every request.
            </p>
            <CodePane code="Authorization: Bearer fg_YOUR_API_KEY" lang="http" />
          </div>
        </div>
      </section>

      {/* Endpoints */}
      <section className="mx-auto max-w-4xl space-y-16 px-6 py-16">
        {Object.entries(ENDPOINTS).map(([group, endpoints]) => (
          <div key={group}>
            <h2 className="mb-6 text-xl font-bold text-[#FAFAFA]">{group}</h2>
            <div className="space-y-5">
              {endpoints.map((ep) => (
                <div
                  key={ep.path}
                  className="overflow-hidden rounded-2xl border border-white/[0.07]"
                  style={{ background: 'rgba(255,255,255,0.025)' }}
                >
                  {/* Header */}
                  <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.07] px-5 py-4">
                    <span className={`rounded px-2 py-0.5 font-mono text-xs font-bold ${METHOD_COLOR[ep.method]}`}>
                      {ep.method}
                    </span>
                    <code className="flex-1 font-mono text-sm text-[#FAFAFA]/80">{ep.path}</code>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${TIER_COLOR[ep.tier]}`}>
                      {ep.tier}
                    </span>
                    {ep.auth && (
                      <span className="rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-2.5 py-0.5 text-[10px] font-semibold text-[#D4AF37]">
                        Auth
                      </span>
                    )}
                  </div>

                  {/* Summary */}
                  <div className="border-b border-white/[0.07] px-5 py-3">
                    <p className="text-sm text-[#71717A]">{ep.summary}</p>
                  </div>

                  {/* Tabs */}
                  <div className="border-b border-white/[0.07] px-5">
                    <div className="flex gap-4">
                      {(['curl', ...(ep.requestBody ? ['request'] : []), 'response'] as const).map(
                        (tab) => (
                          <button
                            key={tab}
                            onClick={() => setTab(ep.path, tab as 'curl' | 'request' | 'response')}
                            className={`border-b-2 py-3 text-xs font-semibold transition-colors ${
                              getTab(ep.path) === tab
                                ? 'border-[#D4AF37] text-[#D4AF37]'
                                : 'border-transparent text-[#52525B] hover:text-[#71717A]'
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
                    <div className="flex items-start justify-between gap-2">
                      <pre className="flex-1 overflow-x-auto font-mono text-sm leading-relaxed text-[#FAFAFA]/60">
                        {getTab(ep.path) === 'curl'
                          ? ep.curl
                          : getTab(ep.path) === 'request'
                          ? ep.requestBody
                          : ep.response}
                      </pre>
                      <CopyButton
                        text={
                          getTab(ep.path) === 'curl'
                            ? ep.curl
                            : getTab(ep.path) === 'request'
                            ? (ep.requestBody ?? '')
                            : ep.response
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Rate Limits */}
        <div id="rate-limits">
          <h2 className="mb-6 text-xl font-bold text-[#FAFAFA]">Rate Limits</h2>
          <div className="overflow-hidden rounded-2xl border border-white/[0.07]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.07]" style={{ background: 'rgba(255,255,255,0.025)' }}>
                  {['Plan', 'Tokens', 'Requests/min', 'Concurrent'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-[#52525B]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {RATE_LIMITS.map((row, i) => (
                  <tr key={i} className="border-b border-white/[0.07] last:border-0 transition-colors hover:bg-white/[0.02]">
                    <td className="px-5 py-3 text-[#FAFAFA]/70">{row.plan}</td>
                    <td className="px-5 py-3 font-mono text-[#71717A]">{row.tokens}</td>
                    <td className="px-5 py-3 font-mono text-[#71717A]">{row.requests}</td>
                    <td className="px-5 py-3 font-mono text-[#71717A]">{row.concurrent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-[#52525B]">
            Rate limit headers are returned on every response:{' '}
            <code className="rounded border border-white/[0.07] bg-white/[0.025] px-1.5 py-0.5 font-mono text-[#71717A]">X-RateLimit-Remaining</code>,{' '}
            <code className="rounded border border-white/[0.07] bg-white/[0.025] px-1.5 py-0.5 font-mono text-[#71717A]">X-RateLimit-Reset</code>,{' '}
            <code className="rounded border border-white/[0.07] bg-white/[0.025] px-1.5 py-0.5 font-mono text-[#71717A]">Retry-After</code>.
          </p>
        </div>

        {/* Errors */}
        <div id="errors">
          <h2 className="mb-6 text-xl font-bold text-[#FAFAFA]">Error Codes</h2>
          <div className="space-y-2.5">
            {ERROR_CODES.map((e) => (
              <div
                key={e.code}
                className="flex gap-4 rounded-2xl border border-white/[0.07] px-5 py-4 transition-colors hover:border-white/[0.12]"
                style={{ background: 'rgba(255,255,255,0.025)' }}
              >
                <span className="shrink-0 w-12 font-mono text-sm font-bold text-[#FFB81C]">{e.code}</span>
                <div>
                  <div className="mb-0.5 text-sm font-semibold text-[#FAFAFA]">{e.name}</div>
                  <div className="text-sm text-[#71717A]">{e.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SDKs */}
        <div id="sdks">
          <h2 className="mb-4 text-xl font-bold text-[#FAFAFA]">SDKs</h2>
          <p className="mb-5 text-sm text-[#71717A]">
            Official SDKs are in development. The REST API works with any HTTP client.
            Community SDKs for Python, Node.js, and Luau are on{' '}
            <a href="https://github.com/forjegames" className="text-[#D4AF37] transition-colors hover:underline">
              GitHub
            </a>
            .
          </p>
          <CodePane
            lang="typescript"
            code={`const res = await fetch('https://forjegames.com/api/ai/generate', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer fg_YOUR_API_KEY',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ prompt: 'Build a volcano island', agent: 'terrain' }),
})
const data = await res.json()
console.log(data.output)`}
          />
        </div>
      </section>
    </div>
  )
}
