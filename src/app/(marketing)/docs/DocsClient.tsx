'use client'
import { useState, useEffect, useRef } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type SectionId =
  | 'getting-started'
  | 'authentication'
  | 'endpoint-voice-to-game'
  | 'endpoint-image-to-map'
  | 'endpoint-generate'
  | 'endpoint-marketplace-search'
  | 'sdks'
  | 'rate-limits'
  | 'errors'

interface NavSection {
  id: SectionId
  label: string
  group?: string
}

// ─── Navigation structure ─────────────────────────────────────────────────────

const NAV: NavSection[] = [
  { id: 'getting-started', label: 'Getting Started' },
  { id: 'authentication', label: 'Authentication' },
  { id: 'endpoint-voice-to-game', label: 'POST /api/ai/voice-to-game', group: 'Endpoints' },
  { id: 'endpoint-image-to-map', label: 'POST /api/ai/image-to-map', group: 'Endpoints' },
  { id: 'endpoint-generate', label: 'POST /api/ai/generate', group: 'Endpoints' },
  { id: 'endpoint-marketplace-search', label: 'GET /api/marketplace/search', group: 'Endpoints' },
  { id: 'sdks', label: 'SDKs' },
  { id: 'rate-limits', label: 'Rate Limits' },
  { id: 'errors', label: 'Errors' },
]

// ─── Lightweight syntax highlighter ──────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function highlightCurl(raw: string): string {
  let s = escapeHtml(raw)
  // strings (single + double quoted)
  s = s.replace(/(&#39;[^<]*?&#39;)/g, '<span class="hl-string">$1</span>')
  s = s.replace(/(&quot;[^<]*?&quot;)/g, '<span class="hl-string">$1</span>')
  // flags
  s = s.replace(/(\s)(--[\w-]+|-[XHd])\b/g, '$1<span class="hl-flag">$2</span>')
  // http method after -X
  s = s.replace(/\b(GET|POST|PUT|DELETE|PATCH)\b/g, '<span class="hl-method">$1</span>')
  // url
  s = s.replace(/(https?:\/\/[^\s\\<]+)/g, '<span class="hl-url">$1</span>')
  // curl keyword
  s = s.replace(/^(curl)/m, '<span class="hl-keyword">$1</span>')
  return s
}

function highlightJson(raw: string): string {
  let s = escapeHtml(raw)
  // keys
  s = s.replace(/(&quot;[^&]+&quot;)(?=\s*:)/g, '<span class="hl-key">$1</span>')
  // string values
  s = s.replace(/:\s*(&quot;[^&]*&quot;)/g, (m, val) => m.replace(val, `<span class="hl-string">${val}</span>`))
  // numbers
  s = s.replace(/:\s*(\d+\.?\d*)/g, (m, val) => m.replace(val, `<span class="hl-number">${val}</span>`))
  // booleans / null
  s = s.replace(/\b(true|false|null)\b/g, '<span class="hl-boolean">$1</span>')
  return s
}

// ─── Reusable primitives ──────────────────────────────────────────────────────

function MethodBadge({ method }: { method: 'GET' | 'POST' }) {
  const cls =
    method === 'GET'
      ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/25'
      : 'text-blue-400 bg-blue-400/10 border-blue-400/25'
  return (
    <span className={`inline-flex items-center border text-xs font-bold px-2 py-0.5 rounded font-mono ${cls}`}>
      {method}
    </span>
  )
}

function CodeBlock({ code, lang }: { code: string; lang: 'curl' | 'json' }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(code).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  const html = lang === 'curl' ? highlightCurl(code) : highlightJson(code)

  return (
    <div className="relative group rounded-xl overflow-hidden border border-white/8" style={{ background: '#111827' }}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/8">
        <span className="text-xs text-gray-500 font-mono">{lang === 'curl' ? 'bash' : 'json'}</span>
        <button
          onClick={copy}
          className="text-xs text-gray-500 hover:text-gray-200 transition-colors px-2 py-0.5 rounded"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="p-5 text-sm font-mono leading-relaxed overflow-x-auto text-gray-300">
        <code dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
    </div>
  )
}

interface Param {
  name: string
  type: string
  required: boolean
  description: string
}

function ParamTable({ params }: { params: Param[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/8">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/8" style={{ background: '#0f1629' }}>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-40">
              Parameter
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">
              Type
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">
              Required
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Description
            </th>
          </tr>
        </thead>
        <tbody>
          {params.map((p, i) => (
            <tr
              key={p.name}
              className={i < params.length - 1 ? 'border-b border-white/5' : ''}
              style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}
            >
              <td className="px-4 py-3">
                <code className="text-[#FFB81C] font-mono text-xs">{p.name}</code>
              </td>
              <td className="px-4 py-3">
                <code className="text-purple-400 font-mono text-xs">{p.type}</code>
              </td>
              <td className="px-4 py-3">
                {p.required ? (
                  <span className="text-xs text-rose-400 font-medium">Required</span>
                ) : (
                  <span className="text-xs text-gray-600">Optional</span>
                )}
              </td>
              <td className="px-4 py-3 text-gray-400 text-sm">{p.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3 mt-1">{children}</h3>
}

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-2xl font-bold text-white mb-2 scroll-mt-28">
      {children}
    </h2>
  )
}

function Divider() {
  return <hr className="border-white/8 my-14" />
}

// ─── Endpoint section wrapper ─────────────────────────────────────────────────

function EndpointSection({
  id,
  method,
  path,
  description,
  params,
  curlExample,
  responseExample,
}: {
  id: string
  method: 'GET' | 'POST'
  path: string
  description: string
  params: Param[]
  curlExample: string
  responseExample: string
}) {
  return (
    <section id={id} className="scroll-mt-28">
      <div className="flex items-center gap-3 mb-3">
        <MethodBadge method={method} />
        <code className="text-white font-mono text-base">{path}</code>
      </div>
      <p className="text-gray-400 text-sm mb-7 leading-relaxed">{description}</p>

      {params.length > 0 && (
        <div className="mb-7">
          <SectionLabel>Parameters</SectionLabel>
          <ParamTable params={params} />
        </div>
      )}

      <div className="mb-7">
        <SectionLabel>Example Request</SectionLabel>
        <CodeBlock code={curlExample} lang="curl" />
      </div>

      <div>
        <SectionLabel>Example Response</SectionLabel>
        <CodeBlock code={responseExample} lang="json" />
      </div>
    </section>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DocsClient() {
  const [activeSection, setActiveSection] = useState<SectionId>('getting-started')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)

  // Highlight active section based on scroll position
  useEffect(() => {
    observerRef.current?.disconnect()

    const ids = NAV.map((n) => n.id)
    const elements = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[]

    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id as SectionId)
          }
        }
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 }
    )

    elements.forEach((el) => observerRef.current!.observe(el))
    return () => observerRef.current?.disconnect()
  }, [])

  function scrollTo(id: SectionId) {
    setSidebarOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setActiveSection(id)
  }

  // Group nav items
  const groups: { label: string | null; items: NavSection[] }[] = []
  for (const item of NAV) {
    const groupLabel = item.group ?? null
    const last = groups[groups.length - 1]
    if (last && last.label === groupLabel) {
      last.items.push(item)
    } else {
      groups.push({ label: groupLabel, items: [item] })
    }
  }

  return (
    <>
      {/* Inline styles for syntax highlighting */}
      <style>{`
        .hl-keyword { color: #c084fc; }
        .hl-string  { color: #86efac; }
        .hl-key     { color: #7dd3fc; }
        .hl-number  { color: #fb923c; }
        .hl-boolean { color: #f472b6; }
        .hl-flag    { color: #FFB81C; }
        .hl-method  { color: #c084fc; }
        .hl-url     { color: #86efac; }
      `}</style>

      <div className="min-h-screen bg-[#060918] text-gray-300">

        {/* Sub-header bar */}
        <div
          className="sticky top-[57px] z-30 border-b border-white/8 backdrop-blur-xl"
          style={{ background: 'rgba(6,9,24,0.85)' }}
        >
          <div className="max-w-7xl mx-auto px-5 h-12 flex items-center gap-4">
            <span className="text-white font-semibold text-sm">API Reference</span>
            <span className="text-[10px] border border-white/10 text-gray-500 px-2 py-0.5 rounded font-mono">v1</span>
            {/* Mobile hamburger */}
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="lg:hidden ml-auto p-1.5 rounded-lg border border-white/10 hover:border-white/25 transition-colors"
              aria-label="Toggle navigation"
            >
              <span className="block w-4 h-px bg-gray-400 mb-1" />
              <span className="block w-4 h-px bg-gray-400 mb-1" />
              <span className="block w-4 h-px bg-gray-400" />
            </button>
          </div>
        </div>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          >
            <div
              className="absolute left-0 top-0 bottom-0 w-72 border-r border-white/8 p-6 overflow-y-auto"
              style={{ background: '#060918' }}
              onClick={(e) => e.stopPropagation()}
            >
              <SidebarContent groups={groups} activeSection={activeSection} onSelect={scrollTo} />
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-5 py-12 flex gap-12">

          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-56 flex-shrink-0">
            <div className="sticky top-28 overflow-y-auto max-h-[calc(100vh-8rem)]">
              <SidebarContent groups={groups} activeSection={activeSection} onSelect={scrollTo} />
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0 max-w-3xl">

            {/* ── Getting Started ─────────────────────────────────────── */}
            <section id="getting-started" className="scroll-mt-28">
              <SectionHeading id="getting-started">Getting Started</SectionHeading>
              <p className="text-gray-400 text-sm leading-relaxed mb-7">
                The ForjeGames API lets you build AI-powered Roblox experiences — convert voice commands to game
                scripts, transform images into playable maps, and search the Roblox marketplace programmatically.
                All endpoints are REST-based and return JSON.
              </p>

              <div className="mb-7">
                <SectionLabel>Base URL</SectionLabel>
                <CodeBlock
                  lang="json"
                  code={`https://api.forjegames.com`}
                />
              </div>

              <div className="mb-7">
                <SectionLabel>1. Get an API key</SectionLabel>
                <p className="text-gray-400 text-sm mb-4">
                  Sign in to your dashboard and navigate to{' '}
                  <a href="/settings/api-keys" className="text-[#FFB81C] hover:underline">
                    Settings &rarr; API Keys
                  </a>{' '}
                  to create a key. The raw key is shown once — save it immediately.
                </p>
              </div>

              <div>
                <SectionLabel>2. Make your first request</SectionLabel>
                <CodeBlock
                  lang="curl"
                  code={`curl -X GET https://api.forjegames.com/api/marketplace/search \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -G --data-urlencode "q=sword"`}
                />
              </div>
            </section>

            <Divider />

            {/* ── Authentication ──────────────────────────────────────── */}
            <section id="authentication" className="scroll-mt-28">
              <SectionHeading id="authentication">Authentication</SectionHeading>
              <p className="text-gray-400 text-sm leading-relaxed mb-7">
                All API requests must be authenticated with a Bearer token in the{' '}
                <code className="text-[#FFB81C] font-mono text-xs bg-white/5 px-1.5 py-0.5 rounded">
                  Authorization
                </code>{' '}
                header. API keys are prefixed with{' '}
                <code className="text-[#FFB81C] font-mono text-xs bg-white/5 px-1.5 py-0.5 rounded">fg_sk_</code>.
              </p>

              <div className="mb-7">
                <SectionLabel>Request Header</SectionLabel>
                <CodeBlock
                  lang="curl"
                  code={`Authorization: Bearer fg_sk_your_api_key_here`}
                />
              </div>

              <div
                className="rounded-xl border border-amber-500/20 p-4 text-sm text-amber-200/80 leading-relaxed"
                style={{ background: 'rgba(245,158,11,0.05)' }}
              >
                <strong className="text-amber-400">Security:</strong> Never expose your API key in client-side code or
                public repositories. Use environment variables and server-side requests only.
              </div>
            </section>

            <Divider />

            {/* ── Endpoints header ────────────────────────────────────── */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-white mb-2">Endpoints</h2>
              <p className="text-gray-400 text-sm">
                All endpoints accept and return <code className="text-gray-300 font-mono text-xs">application/json</code>.
              </p>
            </div>

            {/* ── POST /api/ai/voice-to-game ──────────────────────────── */}
            <EndpointSection
              id="endpoint-voice-to-game"
              method="POST"
              path="/api/ai/voice-to-game"
              description="Convert a voice recording or transcript into a Roblox Luau game script. The AI interprets natural language commands and generates structured game logic, event handlers, and UI elements."
              params={[
                { name: 'audio_url', type: 'string', required: false, description: 'Publicly accessible URL of an audio file (mp3, wav, ogg, webm). Provide either this or transcript.' },
                { name: 'transcript', type: 'string', required: false, description: 'Pre-transcribed text to convert. Used when audio_url is not provided.' },
                { name: 'language', type: 'string', required: false, description: 'BCP-47 language code for transcription. Defaults to "en-US".' },
                { name: 'style', type: 'string', required: false, description: 'Output style hint: "simulator" | "obby" | "roleplay" | "generic". Helps the model target the correct game genre.' },
                { name: 'include_ui', type: 'boolean', required: false, description: 'When true, the response includes ScreenGui XML alongside the Luau script.' },
              ]}
              curlExample={`curl -X POST https://api.forjegames.com/api/ai/voice-to-game \\
  -H "Authorization: Bearer fg_sk_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "audio_url": "https://cdn.example.com/recording.mp3",
    "style": "simulator",
    "include_ui": true
  }'`}
              responseExample={`{
  "id": "vtg_a1b2c3d4",
  "status": "complete",
  "transcript": "Create a shop button that opens a store menu with three items",
  "output": {
    "script": "local Players = game:GetService(\\"Players\\")\\n-- generated Luau...",
    "ui_xml": "<ScreenGui>...</ScreenGui>",
    "tokens_used": 1840
  },
  "created_at": "2026-03-28T12:00:00Z"
}`}
            />

            <Divider />

            {/* ── POST /api/ai/image-to-map ───────────────────────────── */}
            <EndpointSection
              id="endpoint-image-to-map"
              method="POST"
              path="/api/ai/image-to-map"
              description="Transform an image — concept art, a hand-drawn sketch, or a top-down photo — into a Roblox map definition. Returns a structured JSON blueprint that can be imported via the ForjeGames Studio plugin."
              params={[
                { name: 'image_url', type: 'string', required: true, description: 'Publicly accessible URL of the source image (jpg, png, webp). Max 10 MB.' },
                { name: 'map_size', type: 'number', required: false, description: 'Target map width in studs. Accepted values: 512, 1024, 2048, 4096. Defaults to 1024.' },
                { name: 'terrain_type', type: 'string', required: false, description: 'Dominant terrain material: "grass" | "sand" | "snow" | "rock" | "mud". Defaults to "grass".' },
                { name: 'include_assets', type: 'boolean', required: false, description: 'When true, the response embeds marketplace asset IDs for auto-placement.' },
                { name: 'style', type: 'string', required: false, description: 'Visual style hint: "realistic" | "cartoon" | "lowpoly".' },
              ]}
              curlExample={`curl -X POST https://api.forjegames.com/api/ai/image-to-map \\
  -H "Authorization: Bearer fg_sk_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "image_url": "https://cdn.example.com/concept-art.png",
    "map_size": 2048,
    "terrain_type": "grass",
    "include_assets": true,
    "style": "cartoon"
  }'`}
              responseExample={`{
  "id": "itm_x9y8z7w6",
  "status": "complete",
  "map": {
    "size": 2048,
    "terrain_material": "Grass",
    "regions": [
      { "type": "water", "x": 0, "z": 0, "width": 256, "depth": 512 },
      { "type": "forest", "x": 256, "z": 0, "width": 512, "depth": 512 }
    ],
    "asset_placements": [
      { "asset_id": "7483950123", "name": "Oak Tree", "x": 300, "y": 0, "z": 150 }
    ]
  },
  "plugin_import_url": "https://api.forjegames.com/imports/itm_x9y8z7w6",
  "created_at": "2026-03-28T12:00:00Z"
}`}
            />

            <Divider />

            {/* ── POST /api/ai/generate ───────────────────────────────── */}
            <EndpointSection
              id="endpoint-generate"
              method="POST"
              path="/api/ai/generate"
              description="General-purpose AI generation endpoint. Provide a prompt and output type to generate Luau scripts, UI layouts, economy configs, NPC dialogue, or map blueprints from a text description."
              params={[
                { name: 'prompt', type: 'string', required: true, description: 'Natural language description of what to generate. Be specific — include genre, mechanics, and style.' },
                { name: 'output_type', type: 'string', required: true, description: '"script" | "ui" | "map" | "dialogue" | "economy". Determines the output schema.' },
                { name: 'model', type: 'string', required: false, description: 'Model to use: "fast" (lower latency) | "quality" (higher fidelity). Defaults to "quality".' },
                { name: 'max_tokens', type: 'number', required: false, description: 'Maximum output tokens. Range: 256–8192. Defaults to 2048.' },
                { name: 'context', type: 'string', required: false, description: 'Existing code or context the model should build on or stay consistent with.' },
              ]}
              curlExample={`curl -X POST https://api.forjegames.com/api/ai/generate \\
  -H "Authorization: Bearer fg_sk_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "A leaderboard script that tracks player coins and updates every 5 seconds",
    "output_type": "script",
    "model": "quality",
    "max_tokens": 2048
  }'`}
              responseExample={`{
  "id": "gen_p5q6r7s8",
  "status": "complete",
  "output_type": "script",
  "result": {
    "code": "local Players = game:GetService(\\"Players\\")\\nlocal RunService = game:GetService(\\"RunService\\")\\n-- leaderboard logic...",
    "language": "luau",
    "tokens_used": 712,
    "warnings": []
  },
  "model": "quality",
  "created_at": "2026-03-28T12:00:00Z"
}`}
            />

            <Divider />

            {/* ── GET /api/marketplace/search ─────────────────────────── */}
            <EndpointSection
              id="endpoint-marketplace-search"
              method="GET"
              path="/api/marketplace/search"
              description="Search the Roblox marketplace for assets. Returns models, meshes, decals, audio, and plugins with metadata. All parameters are passed as query string values."
              params={[
                { name: 'q', type: 'string', required: true, description: 'Search query string.' },
                { name: 'category', type: 'string', required: false, description: '"model" | "mesh" | "decal" | "audio" | "plugin". Omit to search all categories.' },
                { name: 'limit', type: 'number', required: false, description: 'Number of results per page. Max 50. Defaults to 20.' },
                { name: 'cursor', type: 'string', required: false, description: 'Pagination cursor returned by the previous response.' },
                { name: 'sort', type: 'string', required: false, description: 'Sort order: "relevance" | "updated" | "favorites". Defaults to "relevance".' },
                { name: 'free_only', type: 'boolean', required: false, description: 'When true, only returns free assets.' },
              ]}
              curlExample={`curl -X GET "https://api.forjegames.com/api/marketplace/search" \\
  -H "Authorization: Bearer fg_sk_..." \\
  -G \\
  --data-urlencode "q=low poly tree" \\
  --data-urlencode "category=model" \\
  --data-urlencode "limit=10" \\
  --data-urlencode "free_only=true"`}
              responseExample={`{
  "results": [
    {
      "asset_id": "7483950123",
      "name": "Low Poly Oak Tree",
      "category": "model",
      "creator": "NatureAssets",
      "description": "A simple low-poly oak tree. 48 polygons.",
      "thumbnail_url": "https://tr.rbxcdn.com/abc123/150/150/Image/Png",
      "marketplace_url": "https://www.roblox.com/catalog/7483950123",
      "is_free": true,
      "favorites": 14200,
      "updated_at": "2025-11-04T09:32:00Z"
    }
  ],
  "total": 342,
  "has_more": true,
  "next_cursor": "eyJwIjoxfQ=="
}`}
            />

            <Divider />

            {/* ── SDKs ────────────────────────────────────────────────── */}
            <section id="sdks" className="scroll-mt-28">
              <SectionHeading id="sdks">SDKs</SectionHeading>
              <p className="text-gray-400 text-sm leading-relaxed mb-8">
                Official client libraries handle authentication, retries, and response parsing automatically.
              </p>

              <div className="grid sm:grid-cols-2 gap-5">
                <div
                  className="rounded-xl border border-white/8 p-6"
                  style={{ background: '#0a0f24' }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/20 flex items-center justify-center">
                      <span className="text-blue-400 font-bold text-xs">TS</span>
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold">TypeScript / Node.js</p>
                      <p className="text-gray-500 text-xs">Node 18+</p>
                    </div>
                  </div>
                  <div className="mb-5">
                    <CodeBlock lang="curl" code={`npm install @forjegames/sdk`} />
                  </div>
                  <CodeBlock
                    lang="curl"
                    code={`import { ForjeGames } from '@forjegames/sdk'

const fg = new ForjeGames({ apiKey: process.env.FG_API_KEY })

const result = await fg.ai.generate({
  prompt: 'A coin shop UI with 3 items',
  output_type: 'ui',
})`}
                  />
                </div>

                <div
                  className="rounded-xl border border-white/8 p-6"
                  style={{ background: '#0a0f24' }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-yellow-500/15 border border-yellow-500/20 flex items-center justify-center">
                      <span className="text-yellow-400 font-bold text-xs">PY</span>
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold">Python</p>
                      <p className="text-gray-500 text-xs">Python 3.9+</p>
                    </div>
                  </div>
                  <div className="mb-5">
                    <CodeBlock lang="curl" code={`pip install forjegames`} />
                  </div>
                  <CodeBlock
                    lang="curl"
                    code={`import forjegames

fg = forjegames.Client(api_key=os.environ["FG_API_KEY"])

result = fg.ai.generate(
    prompt="A coin shop UI with 3 items",
    output_type="ui",
)`}
                  />
                </div>
              </div>
            </section>

            <Divider />

            {/* ── Rate Limits ─────────────────────────────────────────── */}
            <section id="rate-limits" className="scroll-mt-28">
              <SectionHeading id="rate-limits">Rate Limits</SectionHeading>
              <p className="text-gray-400 text-sm leading-relaxed mb-7">
                Limits are enforced per API key. Current usage is exposed via response headers on every request.
              </p>

              <div className="overflow-x-auto rounded-xl border border-white/8 mb-7">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/8" style={{ background: '#0f1629' }}>
                      {['Plan', 'Req / min', 'Req / day', 'AI calls / day', 'Concurrent'].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { plan: 'Free',    rpm: '30',  rpd: '500',       ai: '10',      concurrent: '1' },
                      { plan: 'Hobby',   rpm: '60',  rpd: '5,000',     ai: '100',     concurrent: '3' },
                      { plan: 'Creator', rpm: '300', rpd: '50,000',    ai: '1,000',   concurrent: '10' },
                      { plan: 'Studio',  rpm: '600', rpd: 'Unlimited', ai: 'Unlimited', concurrent: '25' },
                    ].map((row, i) => (
                      <tr key={row.plan} className={i < 3 ? 'border-b border-white/5' : ''}>
                        <td className="px-4 py-3 text-white font-medium">{row.plan}</td>
                        <td className="px-4 py-3 text-gray-300 font-mono">{row.rpm}</td>
                        <td className="px-4 py-3 text-gray-300 font-mono">{row.rpd}</td>
                        <td className="px-4 py-3 text-gray-300 font-mono">{row.ai}</td>
                        <td className="px-4 py-3 text-gray-300 font-mono">{row.concurrent}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mb-4">
                <SectionLabel>Rate Limit Headers</SectionLabel>
                <div className="overflow-x-auto rounded-xl border border-white/8">
                  <table className="w-full text-sm">
                    <tbody>
                      {[
                        { header: 'X-RateLimit-Limit',     desc: 'Maximum requests allowed in the current window' },
                        { header: 'X-RateLimit-Remaining', desc: 'Requests remaining before the limit resets' },
                        { header: 'X-RateLimit-Reset',     desc: 'Unix timestamp when the window resets' },
                        { header: 'Retry-After',           desc: 'Seconds to wait before retrying (only on 429 responses)' },
                      ].map((row, i) => (
                        <tr key={row.header} className={i < 3 ? 'border-b border-white/5' : ''}>
                          <td className="px-4 py-3 w-72">
                            <code className="text-[#FFB81C] font-mono text-xs">{row.header}</code>
                          </td>
                          <td className="px-4 py-3 text-gray-400 text-sm">{row.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <Divider />

            {/* ── Errors ──────────────────────────────────────────────── */}
            <section id="errors" className="scroll-mt-28">
              <SectionHeading id="errors">Errors</SectionHeading>
              <p className="text-gray-400 text-sm leading-relaxed mb-7">
                All errors return a consistent JSON body with a machine-readable{' '}
                <code className="text-gray-300 font-mono text-xs bg-white/5 px-1.5 py-0.5 rounded">code</code> and
                a human-readable{' '}
                <code className="text-gray-300 font-mono text-xs bg-white/5 px-1.5 py-0.5 rounded">message</code>.
              </p>

              <div className="mb-7">
                <SectionLabel>Error Response Shape</SectionLabel>
                <CodeBlock
                  lang="json"
                  code={`{
  "error": {
    "code": "invalid_api_key",
    "message": "The API key provided is invalid or has been revoked.",
    "status": 401,
    "request_id": "req_2b3c4d5e"
  }
}`}
                />
              </div>

              <div className="overflow-x-auto rounded-xl border border-white/8">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/8" style={{ background: '#0f1629' }}>
                      {['Status', 'Error Code', 'Description'].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { status: '400', code: 'invalid_request',    desc: 'Missing or malformed request parameters.' },
                      { status: '401', code: 'invalid_api_key',    desc: 'API key is missing, invalid, or revoked.' },
                      { status: '403', code: 'insufficient_scope', desc: 'The key exists but lacks the required scope for this endpoint.' },
                      { status: '404', code: 'not_found',          desc: 'The requested resource does not exist.' },
                      { status: '409', code: 'conflict',           desc: 'Request conflicts with existing state (e.g. duplicate resource).' },
                      { status: '422', code: 'unprocessable',      desc: 'Request is well-formed but semantically invalid.' },
                      { status: '429', code: 'rate_limit_exceeded', desc: 'Too many requests. Check Retry-After header.' },
                      { status: '500', code: 'internal_error',     desc: 'Unexpected server error. Retry with exponential backoff.' },
                      { status: '503', code: 'service_unavailable', desc: 'Temporary downtime or maintenance. Check status.forjegames.com.' },
                    ].map((row, i, arr) => (
                      <tr key={row.status} className={i < arr.length - 1 ? 'border-b border-white/5' : ''}>
                        <td className="px-4 py-3 font-mono text-rose-400 text-sm w-16">{row.status}</td>
                        <td className="px-4 py-3 w-52">
                          <code className="text-purple-400 font-mono text-xs">{row.code}</code>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-sm">{row.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Bottom padding */}
            <div className="h-24" />
          </main>
        </div>
      </div>
    </>
  )
}

// ─── Sidebar content (shared between desktop + mobile) ────────────────────────

function SidebarContent({
  groups,
  activeSection,
  onSelect,
}: {
  groups: { label: string | null; items: NavSection[] }[]
  activeSection: SectionId
  onSelect: (id: SectionId) => void
}) {
  return (
    <nav className="space-y-6">
      {groups.map((group, gi) => (
        <div key={gi}>
          {group.label && (
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-2 px-2">
              {group.label}
            </p>
          )}
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const isActive = item.id === activeSection
              return (
                <li key={item.id}>
                  <button
                    onClick={() => onSelect(item.id)}
                    className={`w-full text-left text-xs px-2 py-1.5 rounded-lg transition-colors leading-snug font-mono ${
                      isActive
                        ? 'text-[#FFB81C] bg-[#FFB81C]/8'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-white/4'
                    }`}
                  >
                    {item.label}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}
