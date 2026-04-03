'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

type SectionId =
  | 'quickstart'
  | 'features'
  | 'pricing'
  | 'getting-started'
  | 'authentication'
  | 'endpoint-voice-to-game'
  | 'endpoint-image-to-map'
  | 'endpoint-generate'
  | 'endpoint-mesh'
  | 'endpoint-texture'
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
  { id: 'quickstart', label: 'Quick Start', group: 'Overview' },
  { id: 'features', label: 'Features', group: 'Overview' },
  { id: 'pricing', label: 'Pricing', group: 'Overview' },
  { id: 'getting-started', label: 'Getting Started', group: 'API Reference' },
  { id: 'authentication', label: 'Authentication', group: 'API Reference' },
  { id: 'endpoint-voice-to-game', label: 'POST /api/ai/voice-to-game', group: 'Endpoints' },
  { id: 'endpoint-image-to-map', label: 'POST /api/ai/image-to-map', group: 'Endpoints' },
  { id: 'endpoint-generate', label: 'POST /api/ai/generate', group: 'Endpoints' },
  { id: 'endpoint-mesh', label: 'POST /api/ai/mesh', group: 'Endpoints' },
  { id: 'endpoint-texture', label: 'POST /api/ai/texture', group: 'Endpoints' },
  { id: 'endpoint-marketplace-search', label: 'GET /api/marketplace/search', group: 'Endpoints' },
  { id: 'sdks', label: 'SDKs', group: 'API Reference' },
  { id: 'rate-limits', label: 'Rate Limits', group: 'API Reference' },
  { id: 'errors', label: 'Errors', group: 'API Reference' },
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
  // keys — match "key": (key must not contain newlines; stop at first closing quote not preceded by backslash)
  s = s.replace(/(&quot;(?:[^&\\]|\\.|&(?!quot;))*&quot;)(?=\s*:)/g, '<span class="hl-key">$1</span>')
  // string values — after colon, match quoted string (handles escaped chars represented as HTML entities)
  s = s.replace(/(:\s*)(&quot;(?:[^&\\]|\\.|&(?!quot;))*&quot;)/g, (_, colon, val) => `${colon}<span class="hl-string">${val}</span>`)
  // numbers (integer or float, not inside strings)
  s = s.replace(/(:\s*)(-?\d+\.?\d*)\b/g, (_, colon, val) => `${colon}<span class="hl-number">${val}</span>`)
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
    const succeed = () => { setCopied(true); setTimeout(() => setCopied(false), 1800) }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code).then(succeed).catch(() => {
        // fallback for browsers without clipboard API or non-HTTPS
        try {
          const ta = document.createElement('textarea')
          ta.value = code
          ta.style.position = 'fixed'
          ta.style.opacity = '0'
          document.body.appendChild(ta)
          ta.focus()
          ta.select()
          document.execCommand('copy')
          document.body.removeChild(ta)
          succeed()
        } catch {/* silent */ }
      })
    } else {
      try {
        const ta = document.createElement('textarea')
        ta.value = code
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.focus()
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
        succeed()
      } catch {/* silent */ }
    }
  }

  const html = lang === 'curl' ? highlightCurl(code) : highlightJson(code)

  return (
    <div className="relative group rounded-xl overflow-hidden border border-[#1A2550]" style={{ background: '#0F1535' }}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#1A2550]">
        <span className="text-xs font-mono" style={{ color: '#8B95B0' }}>{lang === 'curl' ? 'bash' : 'json'}</span>
        <button
          onClick={copy}
          className="text-xs transition-colors px-2 py-0.5 rounded hover:text-white"
          style={{ color: '#8B95B0' }}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="p-5 text-sm font-mono leading-relaxed overflow-x-auto" style={{ color: '#8B95B0' }}>
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
    <div className="overflow-x-auto rounded-xl border border-[#1A2550]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#1A2550]" style={{ background: '#0A0E27' }}>
            <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider w-40" style={{ color: '#8B95B0' }}>
              Parameter
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider w-28" style={{ color: '#8B95B0' }}>
              Type
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider w-24" style={{ color: '#8B95B0' }}>
              Required
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#8B95B0' }}>
              Description
            </th>
          </tr>
        </thead>
        <tbody>
          {params.map((p, i) => (
            <tr
              key={p.name}
              className={i < params.length - 1 ? 'border-b border-[#1A2550]' : ''}
              style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(26,37,80,0.3)' }}
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
                  <span className="text-xs" style={{ color: '#71717A' }}>Optional</span>
                )}
              </td>
              <td className="px-4 py-3 text-sm" style={{ color: '#8B95B0' }}>{p.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-3 mt-1 text-[12px] font-semibold uppercase tracking-[0.12em]" style={{ color: 'rgba(212,175,55,0.6)' }}>
      {children}
    </h3>
  )
}

function SectionHeading({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <h2 id={id} className="text-2xl font-bold text-white mb-2 scroll-mt-28">
      {children}
    </h2>
  )
}

function Divider() {
  return <hr className="my-14 border-[#1A2550]" />
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
      <p className="text-sm mb-7 leading-relaxed" style={{ color: '#8B95B0' }}>{description}</p>

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
  const [activeSection, setActiveSection] = useState<SectionId>('quickstart')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  // When user clicks a nav item, suppress the observer for 1 second so the
  // smooth-scroll animation doesn't fight with the manually-set active state.
  const suppressObserverUntil = useRef<number>(0)

  // Highlight active section based on scroll position.
  // Uses a two-pass strategy: IntersectionObserver for most sections, plus a
  // scroll-end fallback that picks the topmost visible section — this ensures
  // the last section ("Errors") highlights when the page is scrolled to the bottom.
  useEffect(() => {
    const ids = NAV.map((n) => n.id)

    function getTopmostVisible(): SectionId | null {
      for (const id of ids) {
        const el = document.getElementById(id)
        if (!el) continue
        const rect = el.getBoundingClientRect()
        // Section is in or near the top 60% of the viewport
        if (rect.top <= window.innerHeight * 0.6 && rect.bottom > 0) {
          return id as SectionId
        }
      }
      return null
    }

    // Scroll-end fallback — fires when momentum dies, catches bottom-of-page
    let scrollTimer: ReturnType<typeof setTimeout>
    function onScroll() {
      clearTimeout(scrollTimer)
      scrollTimer = setTimeout(() => {
        if (Date.now() < suppressObserverUntil.current) return
        const top = getTopmostVisible()
        if (top) setActiveSection(top)
      }, 80)
    }

    window.addEventListener('scroll', onScroll, { passive: true })

    observerRef.current?.disconnect()
    const elements = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[]

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (Date.now() < suppressObserverUntil.current) return
        // Pick the first intersecting entry whose section is nearest the top
        const intersecting = entries.filter((e) => e.isIntersecting)
        if (intersecting.length === 0) return
        intersecting.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        setActiveSection(intersecting[0].target.id as SectionId)
      },
      { rootMargin: '-10% 0px -55% 0px', threshold: 0 }
    )

    elements.forEach((el) => observerRef.current!.observe(el))
    return () => {
      observerRef.current?.disconnect()
      window.removeEventListener('scroll', onScroll)
      clearTimeout(scrollTimer)
    }
  }, [])

  const scrollTo = useCallback((id: SectionId) => {
    setSidebarOpen(false)
    setActiveSection(id)
    // Suppress observer for 1 s so smooth-scroll doesn't flip active state back
    suppressObserverUntil.current = Date.now() + 1000
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

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

      <div className="min-h-screen" style={{ background: '#050810', color: '#8B95B0' }}>

        {/* Sub-header bar */}
        <div
          className="sticky top-[57px] z-30 border-b border-[#1A2550] backdrop-blur-xl"
          style={{ background: 'rgba(5,8,16,0.85)' }}
        >
          <div className="max-w-7xl mx-auto px-5 h-12 flex items-center gap-4">
            <span className="text-white font-semibold text-sm">Documentation</span>
            <span className="text-[10px] border border-[#1A2550] px-2 py-0.5 rounded font-mono" style={{ color: '#8B95B0' }}>v1</span>
            {/* Mobile hamburger */}
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="lg:hidden ml-auto p-1.5 rounded-lg border border-[#1A2550] hover:border-[#FFB81C]/40 transition-colors"
              aria-label={sidebarOpen ? 'Close navigation' : 'Open navigation'}
              aria-expanded={sidebarOpen}
            >
              {sidebarOpen ? (
                // X icon when open
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M2 2L14 14M14 2L2 14" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              ) : (
                // Hamburger icon when closed
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M2 4H14M2 8H14M2 12H14" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              )}
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
              className="absolute left-0 top-0 bottom-0 w-72 border-r border-[#1A2550] p-6 overflow-y-auto"
              style={{ background: '#050810' }}
              onClick={(e) => e.stopPropagation()}
            >
              <SidebarContent groups={groups} activeSection={activeSection} onSelect={scrollTo} />
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-5 pt-24 pb-12 flex gap-12">

          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-56 flex-shrink-0">
            <div className="sticky top-28 overflow-y-auto max-h-[calc(100vh-8rem)]">
              <SidebarContent groups={groups} activeSection={activeSection} onSelect={scrollTo} />
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0 max-w-3xl">

            {/* ── Quick Start ─────────────────────────────────────────── */}
            <section id="quickstart" className="scroll-mt-28">
              <SectionHeading id="quickstart">Quick Start</SectionHeading>
              <p className="text-sm leading-relaxed mb-8" style={{ color: '#8B95B0' }}>
                Go from zero to your first AI-generated Roblox map in under 5 minutes. No install required — everything
                runs in the browser.
              </p>

              {/* Step 1 */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-7 h-7 rounded-full bg-[#FFB81C]/15 border border-[#FFB81C]/30 flex items-center justify-center text-[#FFB81C] text-xs font-bold flex-shrink-0">1</span>
                  <h3 className="text-white font-semibold text-sm">Sign up for free</h3>
                </div>
                <p className="text-sm leading-relaxed ml-10" style={{ color: '#8B95B0' }}>
                  Create an account at{' '}
                  <Link href="/sign-up" className="text-[#FFB81C] hover:underline">forjegames.com/sign-up</Link>.
                  No credit card required. You get 10 free AI calls per day on the Free plan immediately after sign-up.
                </p>
              </div>

              {/* Step 2 */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-7 h-7 rounded-full bg-[#FFB81C]/15 border border-[#FFB81C]/30 flex items-center justify-center text-[#FFB81C] text-xs font-bold flex-shrink-0">2</span>
                  <h3 className="text-white font-semibold text-sm">Open the Editor</h3>
                </div>
                <p className="text-sm leading-relaxed ml-10 mb-3" style={{ color: '#8B95B0' }}>
                  From your dashboard, click <strong className="text-white">New Project</strong> then{' '}
                  <strong className="text-white">Open Editor</strong>. The AI editor loads in the same tab — no download needed.
                </p>
                <div className="ml-10 rounded-xl border border-[#1A2550] overflow-hidden" style={{ background: '#0F1535' }}>
                  <div className="px-4 py-3 border-b border-[#1A2550] flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
                    <span className="text-xs ml-2 font-mono" style={{ color: '#71717A' }}>forjegames.com/editor</span>
                  </div>
                  <div className="px-5 py-4 text-xs leading-relaxed" style={{ color: '#8B95B0' }}>
                    <span className="text-[#FFB81C]">ForjeGames Editor</span> — AI Build Assistant ready
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-7 h-7 rounded-full bg-[#FFB81C]/15 border border-[#FFB81C]/30 flex items-center justify-center text-[#FFB81C] text-xs font-bold flex-shrink-0">3</span>
                  <h3 className="text-white font-semibold text-sm">Type or speak your first build command</h3>
                </div>
                <p className="text-sm leading-relaxed ml-10 mb-3" style={{ color: '#8B95B0' }}>
                  Type a plain-English prompt in the command bar, or click the mic icon to speak. The AI returns a
                  Luau script, map blueprint, or 3D model — depending on what you asked for.
                </p>
                <div className="ml-10">
                  <SectionLabel>Example prompts</SectionLabel>
                  <div className="space-y-2">
                    {[
                      'Build a city map with 3 zones — residential, industrial, and a park',
                      'Generate a coin shop script with 5 items and a leaderboard',
                      'Create a low-poly oak tree 3D model',
                    ].map((prompt) => (
                      <div
                        key={prompt}
                        className="rounded-lg border border-[#1A2550] px-4 py-2.5 text-xs font-mono"
                        style={{ background: '#0F1535', color: '#8B95B0' }}
                      >
                        <span className="text-[#FFB81C] mr-2">&gt;</span>{prompt}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-7 h-7 rounded-full bg-[#FFB81C]/15 border border-[#FFB81C]/30 flex items-center justify-center text-[#FFB81C] text-xs font-bold flex-shrink-0">4</span>
                  <h3 className="text-white font-semibold text-sm">Import to Roblox Studio</h3>
                </div>
                <p className="text-sm leading-relaxed ml-10 mb-3" style={{ color: '#8B95B0' }}>
                  Install the free <strong className="text-white">ForjeGames Studio Plugin</strong> from the Roblox
                  marketplace, then click <strong className="text-white">Export &rarr; Send to Studio</strong> inside
                  the editor. The plugin receives the build and places it in your game automatically.
                </p>
                <div className="ml-10">
                  <CodeBlock
                    lang="curl"
                    code={`-- The plugin runs this in Studio automatically after export
local ForjeGames = require(game:GetService("ServerScriptService").ForjeGamesPlugin)
ForjeGames.import("https://api.forjegames.com/imports/YOUR_BUILD_ID")`}
                  />
                </div>
              </div>
            </section>

            <Divider />

            {/* ── Features ────────────────────────────────────────────── */}
            <section id="features" className="scroll-mt-28">
              <SectionHeading id="features">Features</SectionHeading>
              <p className="text-sm leading-relaxed mb-8" style={{ color: '#8B95B0' }}>
                Every feature is available via the web editor and the REST API. Use them individually or chain them
                together in a single pipeline.
              </p>

              <div className="grid sm:grid-cols-2 gap-5">
                {[
                  {
                    title: 'Voice to Game',
                    badge: 'POST /api/ai/voice-to-game',
                    color: 'blue',
                    icon: (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                        <line x1="12" y1="19" x2="12" y2="23" />
                        <line x1="8" y1="23" x2="16" y2="23" />
                      </svg>
                    ),
                    desc: 'Speak or type a game mechanic in plain English. The AI generates production-ready Luau scripts with event handlers, UI, and DataStore logic baked in.',
                  },
                  {
                    title: 'Image to Map',
                    badge: 'POST /api/ai/image-to-map',
                    color: 'purple',
                    icon: (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    ),
                    desc: 'Upload concept art, a sketch, or a top-down photo. Claude Vision + Depth Pro convert it into a full map blueprint with terrain regions and marketplace asset placements.',
                  },
                  {
                    title: 'AI Script Generator',
                    badge: 'POST /api/ai/generate',
                    color: 'emerald',
                    icon: (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="16 18 22 12 16 6" />
                        <polyline points="8 6 2 12 8 18" />
                      </svg>
                    ),
                    desc: 'Generate any Roblox game system from a prompt: leaderboards, pet systems, tycoon builders, obby checkpoints, economy configs, NPC dialogue trees, and more.',
                  },
                  {
                    title: '3D Model Generator',
                    badge: 'POST /api/ai/mesh',
                    color: 'amber',
                    icon: (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                      </svg>
                    ),
                    desc: 'Text-to-3D via Meshy AI. Describe any prop, vehicle, building, or character and receive a Roblox-ready .obj mesh with UV-mapped textures in under 60 seconds.',
                  },
                  {
                    title: 'Game DNA Scanner',
                    badge: 'Analysis',
                    color: 'rose',
                    icon: (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                    ),
                    desc: 'Paste any Roblox game URL. The scanner reverse-engineers its mechanics, economy, monetization model, and design patterns — giving you a competitive teardown in seconds.',
                  },
                  {
                    title: 'Marketplace',
                    badge: 'GET /api/marketplace/search',
                    color: 'cyan',
                    icon: (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <path d="M16 10a4 4 0 0 1-8 0" />
                      </svg>
                    ),
                    desc: 'Programmatic search across the entire Roblox asset marketplace. Filter by category, price, and creator. Results include asset IDs ready for auto-placement in map blueprints.',
                  },
                ].map((f) => {
                  const colorMap: Record<string, { bg: string; border: string; text: string; badge: string }> = {
                    blue:    { bg: 'bg-blue-500/10',    border: 'border-blue-500/20',    text: 'text-blue-400',    badge: 'text-blue-400 bg-blue-400/10 border-blue-400/25' },
                    purple:  { bg: 'bg-purple-500/10',  border: 'border-purple-500/20',  text: 'text-purple-400',  badge: 'text-purple-400 bg-purple-400/10 border-purple-400/25' },
                    emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', badge: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/25' },
                    amber:   { bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   text: 'text-amber-400',   badge: 'text-amber-400 bg-amber-400/10 border-amber-400/25' },
                    rose:    { bg: 'bg-rose-500/10',    border: 'border-rose-500/20',    text: 'text-rose-400',    badge: 'text-rose-400 bg-rose-400/10 border-rose-400/25' },
                    cyan:    { bg: 'bg-cyan-500/10',    border: 'border-cyan-500/20',    text: 'text-cyan-400',    badge: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/25' },
                  }
                  const c = colorMap[f.color]
                  return (
                    <div
                      key={f.title}
                      className="rounded-xl border border-[#1A2550] p-5"
                      style={{ background: '#0F1535' }}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`w-9 h-9 rounded-lg ${c.bg} border ${c.border} flex items-center justify-center flex-shrink-0 ${c.text}`}>
                          {f.icon}
                        </div>
                        <div className="min-w-0">
                          <p className="text-white text-sm font-semibold mb-1">{f.title}</p>
                          <span className={`inline-flex items-center border text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${c.badge}`}>
                            {f.badge}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: '#8B95B0' }}>{f.desc}</p>
                    </div>
                  )
                })}
              </div>
            </section>

            <Divider />

            {/* ── Pricing ─────────────────────────────────────────────── */}
            <section id="pricing" className="scroll-mt-28">
              <SectionHeading id="pricing">Pricing</SectionHeading>
              <p className="text-sm leading-relaxed mb-8" style={{ color: '#8B95B0' }}>
                All plans include access to every feature. The difference is in usage limits and team seats.
                Upgrade or downgrade at any time — billing is pro-rated to the day.
              </p>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                  {
                    name: 'Free',
                    price: '$0',
                    period: 'forever',
                    highlight: false,
                    features: [
                      '10 AI calls / day',
                      '500 API requests / day',
                      '1 concurrent request',
                      'Community support',
                      'Watermarked exports',
                    ],
                  },
                  {
                    name: 'Hobby',
                    price: '$12',
                    period: 'per month',
                    highlight: false,
                    features: [
                      '100 AI calls / day',
                      '5,000 API requests / day',
                      '3 concurrent requests',
                      'Email support',
                      'No watermarks',
                    ],
                  },
                  {
                    name: 'Creator',
                    price: '$49',
                    period: 'per month',
                    highlight: true,
                    features: [
                      '1,000 AI calls / day',
                      '50,000 API requests / day',
                      '10 concurrent requests',
                      'Priority support',
                      'Team seats (up to 5)',
                    ],
                  },
                  {
                    name: 'Studio',
                    price: '$199',
                    period: 'per month',
                    highlight: false,
                    features: [
                      'Unlimited AI calls',
                      'Unlimited API requests',
                      '25 concurrent requests',
                      'Dedicated support',
                      'Unlimited team seats',
                    ],
                  },
                ].map((plan) => (
                  <div
                    key={plan.name}
                    className={`rounded-xl border p-5 flex flex-col ${
                      plan.highlight
                        ? 'border-[#FFB81C]/40'
                        : 'border-[#1A2550]'
                    }`}
                    style={{ background: plan.highlight ? 'rgba(255,184,28,0.04)' : '#0F1535' }}
                  >
                    {plan.highlight && (
                      <span className="inline-flex self-start text-[10px] font-bold text-[#FFB81C] bg-[#FFB81C]/10 border border-[#FFB81C]/25 px-2 py-0.5 rounded mb-3">
                        MOST POPULAR
                      </span>
                    )}
                    <p className="text-white font-bold text-base mb-0.5">{plan.name}</p>
                    <div className="flex items-end gap-1 mb-4">
                      <span className="text-2xl font-bold text-white">{plan.price}</span>
                      <span className="text-xs mb-1" style={{ color: '#8B95B0' }}>{plan.period}</span>
                    </div>
                    <ul className="space-y-2 flex-1">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-xs" style={{ color: '#8B95B0' }}>
                          <svg className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="2 8 6 12 14 4" />
                          </svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href="/sign-up"
                      className={`mt-5 block text-center text-xs font-semibold py-2 rounded-lg transition-colors ${
                        plan.highlight
                          ? 'bg-[#FFB81C] text-black hover:bg-[#e6a619]'
                          : 'border border-[#1A2550] hover:border-[#FFB81C]/40 hover:text-white'
                      }`}
                      style={!plan.highlight ? { color: '#8B95B0' } : undefined}
                    >
                      {plan.name === 'Free' ? 'Get started' : 'Start free trial'}
                    </Link>
                  </div>
                ))}
              </div>

              <div
                className="rounded-xl border border-[#1A2550] p-4 text-sm leading-relaxed"
                style={{ background: '#0F1535', color: '#8B95B0' }}
              >
                <strong className="text-white">Enterprise?</strong> Custom contracts, SLA guarantees, on-premise
                deployment, and volume discounts are available. Contact{' '}
                <a href="mailto:enterprise@forjegames.com" className="text-[#FFB81C] hover:underline">
                  enterprise@forjegames.com
                </a>.
              </div>
            </section>

            <Divider />

            {/* ── Getting Started ─────────────────────────────────────── */}
            <section id="getting-started" className="scroll-mt-28">
              <SectionHeading id="getting-started">Getting Started</SectionHeading>
              <p className="text-sm leading-relaxed mb-7" style={{ color: '#8B95B0' }}>
                The ForjeGames API lets you build AI-powered Roblox experiences — convert voice commands to game
                scripts, transform images into playable maps, and search the Roblox marketplace programmatically.
                All endpoints are REST-based and return JSON.
              </p>

              <div className="mb-7">
                <SectionLabel>Base URL</SectionLabel>
                <CodeBlock
                  lang="curl"
                  code={`https://api.forjegames.com`}
                />
              </div>

              <div className="mb-7">
                <SectionLabel>1. Get an API key</SectionLabel>
                <p className="text-sm mb-4" style={{ color: '#8B95B0' }}>
                  Sign in to your dashboard and navigate to{' '}
                  <Link href="/settings/api-keys" className="text-[#FFB81C] hover:underline">
                    Settings &rarr; API Keys
                  </Link>{' '}
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
              <p className="text-sm leading-relaxed mb-7" style={{ color: '#8B95B0' }}>
                All API requests must be authenticated with a Bearer token in the{' '}
                <code className="text-[#FFB81C] font-mono text-xs px-1.5 py-0.5 rounded" style={{ background: '#0F1535' }}>
                  Authorization
                </code>{' '}
                header. API keys are prefixed with{' '}
                <code className="text-[#FFB81C] font-mono text-xs px-1.5 py-0.5 rounded" style={{ background: '#0F1535' }}>fg_sk_</code>.
              </p>

              <div className="mb-7">
                <SectionLabel>Request Header</SectionLabel>
                <CodeBlock
                  lang="curl"
                  code={`Authorization: Bearer fg_sk_your_api_key_here`}
                />
              </div>

              <div
                className="rounded-xl border border-[#D4AF37]/20 p-4 text-sm leading-relaxed"
                style={{ background: 'rgba(212,175,55,0.04)', color: '#FAFAFA99' }}
              >
                <strong className="text-[#FFB81C]">Security:</strong> Never expose your API key in client-side code or
                public repositories. Use environment variables and server-side requests only.
              </div>
            </section>

            <Divider />

            {/* ── Endpoints header ────────────────────────────────────── */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-white mb-2">Endpoints</h2>
              <p className="text-sm" style={{ color: '#8B95B0' }}>
                All endpoints accept and return <code className="font-mono text-xs" style={{ color: '#8B95B0' }}>application/json</code>.
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

            {/* ── POST /api/ai/mesh ────────────────────────────────────── */}
            <EndpointSection
              id="endpoint-mesh"
              method="POST"
              path="/api/ai/mesh"
              description="Generate a Roblox-ready 3D mesh from a text description using Meshy AI. Returns a .obj file URL with UV-mapped textures. Meshes are scaled and centered for direct insertion into Roblox Studio via the ForjeGames plugin."
              params={[
                { name: 'prompt', type: 'string', required: true, description: 'Text description of the 3D object to generate. Be specific about shape, style, and detail level.' },
                { name: 'style', type: 'string', required: false, description: 'Visual style: "realistic" | "cartoon" | "lowpoly" | "voxel". Defaults to "lowpoly" for Roblox compatibility.' },
                { name: 'negative_prompt', type: 'string', required: false, description: 'Describe what to avoid in the generated mesh (e.g. "high poly, organic shapes").' },
                { name: 'texture_richness', type: 'string', required: false, description: '"low" | "medium" | "high". Controls texture resolution and detail. Defaults to "medium".' },
                { name: 'seed', type: 'number', required: false, description: 'Random seed for reproducible generation. Omit for a random result.' },
              ]}
              curlExample={`curl -X POST https://api.forjegames.com/api/ai/mesh \\
  -H "Authorization: Bearer fg_sk_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "A medieval wooden chest with iron hinges and lock",
    "style": "lowpoly",
    "texture_richness": "high"
  }'`}
              responseExample={`{
  "id": "mesh_k3l4m5n6",
  "status": "complete",
  "prompt": "A medieval wooden chest with iron hinges and lock",
  "style": "lowpoly",
  "output": {
    "obj_url": "https://cdn.forjegames.com/meshes/mesh_k3l4m5n6/model.obj",
    "mtl_url": "https://cdn.forjegames.com/meshes/mesh_k3l4m5n6/model.mtl",
    "texture_url": "https://cdn.forjegames.com/meshes/mesh_k3l4m5n6/texture_0.png",
    "poly_count": 3840,
    "plugin_import_url": "https://api.forjegames.com/imports/mesh_k3l4m5n6"
  },
  "created_at": "2026-03-28T12:00:00Z"
}`}
            />

            <Divider />

            {/* ── POST /api/ai/texture ─────────────────────────────────── */}
            <EndpointSection
              id="endpoint-texture"
              method="POST"
              path="/api/ai/texture"
              description="Generate or restyle a texture for an existing 3D mesh. Provide either a mesh ID from a previous /api/ai/mesh call or upload your own .obj file URL. Returns a new diffuse texture PNG at the requested resolution."
              params={[
                { name: 'mesh_id', type: 'string', required: false, description: 'ID of a mesh previously generated by /api/ai/mesh. Either mesh_id or mesh_url is required.' },
                { name: 'mesh_url', type: 'string', required: false, description: 'Publicly accessible .obj URL for texturing. Either mesh_id or mesh_url is required.' },
                { name: 'prompt', type: 'string', required: true, description: 'Text description of the desired texture appearance (e.g. "weathered oak wood with iron accents").' },
                { name: 'resolution', type: 'number', required: false, description: 'Output texture resolution in pixels. Accepted: 512, 1024, 2048. Defaults to 1024.' },
                { name: 'style', type: 'string', required: false, description: 'Texture style: "realistic" | "cartoon" | "stylized" | "pbr". Defaults to "stylized".' },
                { name: 'negative_prompt', type: 'string', required: false, description: 'What to avoid in the texture (e.g. "dark, muddy colors").' },
              ]}
              curlExample={`curl -X POST https://api.forjegames.com/api/ai/texture \\
  -H "Authorization: Bearer fg_sk_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "mesh_id": "mesh_k3l4m5n6",
    "prompt": "Weathered oak wood with iron accents, cartoon style",
    "resolution": 1024,
    "style": "cartoon"
  }'`}
              responseExample={`{
  "id": "tex_w1x2y3z4",
  "status": "complete",
  "mesh_id": "mesh_k3l4m5n6",
  "prompt": "Weathered oak wood with iron accents, cartoon style",
  "output": {
    "texture_url": "https://cdn.forjegames.com/textures/tex_w1x2y3z4/diffuse_1024.png",
    "resolution": 1024,
    "style": "cartoon",
    "roblox_decal_id": null,
    "plugin_import_url": "https://api.forjegames.com/imports/tex_w1x2y3z4"
  },
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
              <p className="text-sm leading-relaxed mb-8" style={{ color: '#8B95B0' }}>
                Official client libraries handle authentication, retries, and response parsing automatically.
              </p>

              <div className="grid sm:grid-cols-2 gap-5">
                <div
                  className="rounded-xl border border-[#1A2550] p-6"
                  style={{ background: '#0F1535' }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/20 flex items-center justify-center">
                      <span className="text-blue-400 font-bold text-xs">TS</span>
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold">TypeScript / Node.js</p>
                      <p className="text-xs" style={{ color: '#8B95B0' }}>Node 18+</p>
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
                  className="rounded-xl border border-[#1A2550] p-6"
                  style={{ background: '#0F1535' }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-yellow-500/15 border border-yellow-500/20 flex items-center justify-center">
                      <span className="text-yellow-400 font-bold text-xs">PY</span>
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold">Python</p>
                      <p className="text-xs" style={{ color: '#8B95B0' }}>Python 3.9+</p>
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
              <p className="text-sm leading-relaxed mb-7" style={{ color: '#8B95B0' }}>
                Limits are enforced per API key. Current usage is exposed via response headers on every request.
              </p>

              <div className="overflow-x-auto rounded-xl border border-[#1A2550] mb-7">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#1A2550]" style={{ background: '#0A0E27' }}>
                      {['Plan', 'Req / min', 'Req / day', 'AI calls / day', 'Concurrent'].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#8B95B0' }}>
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
                      <tr key={row.plan} className={i < 3 ? 'border-b border-[#1A2550]' : ''}>
                        <td className="px-4 py-3 text-white font-medium">{row.plan}</td>
                        <td className="px-4 py-3 font-mono" style={{ color: '#8B95B0' }}>{row.rpm}</td>
                        <td className="px-4 py-3 font-mono" style={{ color: '#8B95B0' }}>{row.rpd}</td>
                        <td className="px-4 py-3 font-mono" style={{ color: '#8B95B0' }}>{row.ai}</td>
                        <td className="px-4 py-3 font-mono" style={{ color: '#8B95B0' }}>{row.concurrent}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mb-4">
                <SectionLabel>Rate Limit Headers</SectionLabel>
                <div className="overflow-x-auto rounded-xl border border-[#1A2550]">
                  <table className="w-full text-sm">
                    <tbody>
                      {[
                        { header: 'X-RateLimit-Limit',     desc: 'Maximum requests allowed in the current window' },
                        { header: 'X-RateLimit-Remaining', desc: 'Requests remaining before the limit resets' },
                        { header: 'X-RateLimit-Reset',     desc: 'Unix timestamp when the window resets' },
                        { header: 'Retry-After',           desc: 'Seconds to wait before retrying (only on 429 responses)' },
                      ].map((row, i) => (
                        <tr key={row.header} className={i < 3 ? 'border-b border-[#1A2550]' : ''}>
                          <td className="px-4 py-3 w-72">
                            <code className="text-[#FFB81C] font-mono text-xs">{row.header}</code>
                          </td>
                          <td className="px-4 py-3 text-sm" style={{ color: '#8B95B0' }}>{row.desc}</td>
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
              <p className="text-sm leading-relaxed mb-7" style={{ color: '#8B95B0' }}>
                All errors return a consistent JSON body with a machine-readable{' '}
                <code className="font-mono text-xs px-1.5 py-0.5 rounded" style={{ color: '#8B95B0', background: '#0F1535' }}>code</code> and
                a human-readable{' '}
                <code className="font-mono text-xs px-1.5 py-0.5 rounded" style={{ color: '#8B95B0', background: '#0F1535' }}>message</code>.
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

              <div className="overflow-x-auto rounded-xl border border-[#1A2550]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#1A2550]" style={{ background: '#0A0E27' }}>
                      {['Status', 'Error Code', 'Description'].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#8B95B0' }}>
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
                      <tr key={row.status} className={i < arr.length - 1 ? 'border-b border-[#1A2550]' : ''}>
                        <td className="px-4 py-3 font-mono text-rose-400 text-sm w-16">{row.status}</td>
                        <td className="px-4 py-3 w-52">
                          <code className="text-purple-400 font-mono text-xs">{row.code}</code>
                        </td>
                        <td className="px-4 py-3 text-sm" style={{ color: '#8B95B0' }}>{row.desc}</td>
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
            <p className="text-xs font-semibold uppercase tracking-widest mb-2 px-2" style={{ color: '#71717A' }}>
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
                        : 'hover:text-white hover:bg-[#1A2550]/50'
                    }`}
                    style={!isActive ? { color: '#8B95B0' } : undefined}
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
