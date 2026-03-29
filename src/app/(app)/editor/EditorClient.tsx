'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

type MessageRole = 'user' | 'assistant' | 'system' | 'status'

interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  tokensUsed?: number
  timestamp: Date
}

type PanelId = 'projects' | 'assets' | 'dna' | 'tokens' | 'settings' | null

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid(): string {
  return Math.random().toString(36).slice(2, 9)
}

function estimateTokens(text: string): number {
  return Math.max(8, Math.ceil(text.split(/\s+/).length * 1.3))
}

// Demo responses for when AI isn't configured
const DEMO_RESPONSES: Record<string, string> = {
  castle: 'Castle placed at map center. Added 4 towers, a main hall, and a drawbridge over the moat.',
  forest: 'Forest biome generated. 847 trees and 23 rocks placed across the eastern half of the map.',
  npc: 'NPC spawned with patrol AI, idle animations, and a dialogue system. Appears near the town square.',
  terrain: 'Terrain generated: rolling hills with a river valley running north-south. Baseplate is 2048x2048 studs.',
  city: 'City district built: 12 buildings, road grid, street lights, and 3 parks. Covers a 400x400 stud area.',
  racing: 'Racing track placed with banked corners, pit lane, and grandstand seating for 500 players.',
  default: 'Command received. I would generate and place the requested assets in your Roblox Studio scene. (Configure an API key in Settings to enable live execution.)',
}

function getDemoResponse(prompt: string): string {
  const lower = prompt.toLowerCase()
  for (const [key, response] of Object.entries(DEMO_RESPONSES)) {
    if (key !== 'default' && lower.includes(key)) return response
  }
  return DEMO_RESPONSES.default
}

// ─── Speech hook ──────────────────────────────────────────────────────────────

// Web Speech API — browser-only types
type SpeechRecognitionCtor = new () => {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  onstart: (() => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
  onresult: ((e: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void) | null
  start: () => void
  stop: () => void
}

function useSpeechRecognition(onResult: (text: string) => void) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)
  const [listening, setListening] = useState(false)
  const [supported, setSupported] = useState(false)

  useEffect(() => {
    setSupported(
      typeof window !== 'undefined' &&
        ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window),
    )
  }, [])

  const start = useCallback(() => {
    if (!supported) return
    const win = window as typeof window & {
      webkitSpeechRecognition?: SpeechRecognitionCtor
      SpeechRecognition?: SpeechRecognitionCtor
    }
    const SR = win.webkitSpeechRecognition ?? win.SpeechRecognition
    if (!SR) return
    const rec = new SR()
    rec.lang = 'en-US'
    rec.interimResults = false
    rec.maxAlternatives = 1
    rec.onstart = () => setListening(true)
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript
      if (transcript.trim()) onResult(transcript.trim())
    }
    recognitionRef.current = rec
    rec.start()
  }, [supported, onResult])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
    setListening(false)
  }, [])

  return { listening, supported, start, stop }
}

// ─── Viewport ────────────────────────────────────────────────────────────────

function Viewport({ hasGame }: { hasGame: boolean }) {
  return (
    <div className="flex-1 relative bg-[#060916] overflow-hidden">
      {/* Grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Perspective grid lines for depth */}
      <div className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: 'radial-gradient(ellipse at 50% 50%, rgba(255,184,28,0.05) 0%, transparent 70%)',
        }}
      />

      {!hasGame && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center px-8">
          <div className="w-16 h-16 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-600" viewBox="0 0 32 32" fill="none">
              <path d="M16 6L6 12v8l10 6 10-6v-8L16 6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M6 12l10 6 10-6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M16 18v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <p className="text-gray-500 text-sm font-medium">No game loaded</p>
            <p className="text-gray-600 text-xs mt-1">Type a command to start building, or load an existing project</p>
          </div>
        </div>
      )}

      {/* Studio connection badge */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/40 backdrop-blur-sm border border-white/10 rounded-full px-3 py-1">
        <div className="w-1.5 h-1.5 rounded-full bg-yellow-500/60" />
        <span className="text-[10px] text-gray-500 font-medium">Studio not connected</span>
      </div>
    </div>
  )
}

// ─── Chat message ────────────────────────────────────────────────────────────

function Message({ msg }: { msg: ChatMessage }) {
  if (msg.role === 'system') {
    return (
      <div className="flex justify-center">
        <span className="text-[11px] text-gray-600 bg-white/5 border border-white/8 rounded-full px-3 py-0.5">
          {msg.content}
        </span>
      </div>
    )
  }

  if (msg.role === 'status') {
    return (
      <div className="flex items-center gap-2 px-1">
        <div className="flex gap-1">
          {[0, 100, 200].map((d) => (
            <div
              key={d}
              className="w-1 h-1 rounded-full bg-[#FFB81C] animate-bounce"
              style={{ animationDelay: `${d}ms` }}
            />
          ))}
        </div>
        <span className="text-xs text-gray-500">{msg.content}</span>
      </div>
    )
  }

  if (msg.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] bg-[#FFB81C]/10 border border-[#FFB81C]/20 rounded-2xl rounded-tr-sm px-4 py-2.5">
          <p className="text-sm text-white">{msg.content}</p>
        </div>
      </div>
    )
  }

  // assistant
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] flex flex-col gap-1">
        <div className="bg-[#0D1231] border border-white/8 rounded-2xl rounded-tl-sm px-4 py-2.5">
          <p className="text-sm text-gray-200 leading-relaxed">
            <span className="text-green-400 mr-1">&#10003;</span>
            {msg.content}
          </p>
        </div>
        {msg.tokensUsed !== undefined && (
          <span className="text-[10px] text-gray-600 pl-1">{msg.tokensUsed} tokens</span>
        )}
      </div>
    </div>
  )
}

// ─── Panel body components ────────────────────────────────────────────────────

const RECENT_PROJECTS = ['My First Game', 'Castle Adventure', 'Racing Sim']

function ProjectsPanel() {
  return (
    <div className="p-4 space-y-3">
      <button className="w-full flex items-center gap-2 bg-[#FFB81C] hover:bg-[#E6A519] text-black font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors">
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
          <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        New Game
      </button>
      <div className="space-y-1 pt-2">
        <p className="text-[10px] text-gray-600 uppercase tracking-wider font-medium px-1 mb-2">Recent</p>
        {RECENT_PROJECTS.map((name) => (
          <button
            key={name}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-left transition-colors group"
          >
            <div className="w-8 h-8 rounded-md bg-white/5 border border-white/8 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-gray-500" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.2"/>
              </svg>
            </div>
            <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

const ALL_ASSETS = ['Castle Kit', 'Forest Pack', 'City Builder', 'Dungeon Set', 'Ocean Terrain', 'Neon City']

function AssetsPanel() {
  const [query, setQuery] = useState('')
  const filtered = query.trim()
    ? ALL_ASSETS.filter((a) => a.toLowerCase().includes(query.toLowerCase()))
    : ALL_ASSETS

  return (
    <div className="p-4">
      <div className="relative mb-4">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" viewBox="0 0 16 16" fill="none">
          <circle cx="7" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M10.5 10.5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search assets..."
          className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-[#FFB81C]/50"
        />
      </div>
      {filtered.length === 0 ? (
        <p className="text-xs text-gray-600 text-center py-6">No assets match &ldquo;{query}&rdquo;</p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {filtered.map((name) => (
            <div
              key={name}
              className="bg-white/5 border border-white/8 hover:border-white/15 rounded-lg p-2.5 cursor-pointer transition-colors"
            >
              <div className="w-full h-12 rounded-md bg-white/5 mb-2" />
              <p className="text-[11px] text-gray-300 font-medium">{name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function DnaPanel() {
  const [url, setUrl] = useState('')
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const handleScan = () => {
    if (!url.trim() || scanning) return
    setScanning(true)
    setResult(null)
    setTimeout(() => {
      setScanning(false)
      setResult('Analysis complete. Connect an API key in Settings to enable live DNA scanning.')
    }, 1200)
  }

  return (
    <div className="p-4 space-y-4">
      <p className="text-xs text-gray-500 leading-relaxed">
        Paste any Roblox game URL to analyze its core loop, retention hooks, and monetization formula.
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleScan()}
          placeholder="https://roblox.com/games/..."
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-[#FFB81C]/50"
        />
        <button
          onClick={handleScan}
          disabled={!url.trim() || scanning}
          className="bg-[#FFB81C] hover:bg-[#E6A519] disabled:opacity-50 disabled:cursor-not-allowed text-black text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
        >
          {scanning ? '...' : 'Scan'}
        </button>
      </div>
      {result && (
        <div className="bg-white/5 border border-white/8 rounded-lg px-3 py-2.5">
          <p className="text-[11px] text-gray-400 leading-relaxed">{result}</p>
        </div>
      )}
      <Link href="/game-dna" className="block text-center text-[11px] text-[#FFB81C]/70 hover:text-[#FFB81C] transition-colors pt-1">
        View full DNA reports &rarr;
      </Link>
    </div>
  )
}

const TOKEN_LIMIT = 1000

function TokensPanel({ tokensUsed }: { tokensUsed: number }) {
  const remaining = Math.max(0, TOKEN_LIMIT - tokensUsed)
  const usedPct = Math.min(100, (tokensUsed / TOKEN_LIMIT) * 100)

  return (
    <div className="p-4 space-y-4">
      <div className="bg-[#FFB81C]/10 border border-[#FFB81C]/20 rounded-xl p-4 text-center">
        <p className="text-3xl font-bold text-[#FFB81C]">{remaining.toLocaleString()}</p>
        <p className="text-xs text-gray-500 mt-1">tokens remaining</p>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#FFB81C] rounded-full transition-all duration-500"
          style={{ width: `${usedPct}%` }}
        />
      </div>
      <p className="text-[11px] text-gray-600 text-center">Free tier &middot; {tokensUsed.toLocaleString()} tokens used</p>
      <Link
        href="/billing"
        className="flex items-center justify-center gap-2 w-full bg-white/5 hover:bg-white/8 border border-white/10 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
      >
        Buy more tokens
      </Link>
    </div>
  )
}

function SettingsPanel() {
  return (
    <div className="p-4 space-y-1">
      {[
        { label: 'Profile', href: '/settings' },
        { label: 'API Keys', href: '/settings/api-keys' },
        { label: 'Billing', href: '/billing' },
        { label: 'Team', href: '/team' },
        { label: 'Referrals', href: '/referrals' },
      ].map(({ label, href }) => (
        <Link
          key={label}
          href={href}
          className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/5 text-gray-300 hover:text-white transition-colors text-sm"
        >
          {label}
          <svg className="w-4 h-4 text-gray-600" viewBox="0 0 16 16" fill="none">
            <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
      ))}
    </div>
  )
}

// ─── Panel title map ──────────────────────────────────────────────────────────

const PANEL_TITLE: Record<NonNullable<PanelId>, string> = {
  projects: 'Projects',
  assets: 'Assets',
  dna: 'Game DNA',
  tokens: 'Tokens',
  settings: 'Settings',
}

// ─── Icon bar button ──────────────────────────────────────────────────────────

function IconBtn({
  id,
  label,
  active,
  onClick,
  children,
}: {
  id: PanelId
  label: string
  active: boolean
  onClick: (id: PanelId) => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={() => onClick(id)}
      title={label}
      aria-label={label}
      className={[
        'w-10 h-10 rounded-xl flex items-center justify-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FFB81C]',
        active
          ? 'bg-[#FFB81C]/15 text-[#FFB81C]'
          : 'text-gray-500 hover:text-gray-300 hover:bg-white/5',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

// ─── Main editor ──────────────────────────────────────────────────────────────

const SUGGESTION_CHIPS = [
  'Build a castle',
  'Add terrain',
  'Create NPC',
  'Design UI',
  'Forest biome',
  'Racing track',
]

export function EditorClient() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: uid(),
      role: 'system',
      content: 'Editor ready — type a command to start building',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [activePanel, setActivePanel] = useState<PanelId>(null)
  const [hasGame] = useState(false)
  const [totalTokens, setTotalTokens] = useState(0)

  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleVoiceResult = useCallback((text: string) => {
    setInput(text)
    inputRef.current?.focus()
  }, [])

  const { listening, supported, start, stop } = useSpeechRecognition(handleVoiceResult)

  const togglePanel = useCallback((id: PanelId) => {
    setActivePanel((prev) => (prev === id ? null : id))
  }, [])

  const submit = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || loading) return

      setInput('')
      setLoading(true)

      const userMsg: ChatMessage = {
        id: uid(),
        role: 'user',
        content: trimmed,
        timestamp: new Date(),
      }

      const statusMsg: ChatMessage = {
        id: uid(),
        role: 'status',
        content: 'Thinking...',
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMsg, statusMsg])

      try {
        let responseText: string | null = null
        let tokensUsed = estimateTokens(trimmed)

        try {
          const res = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: trimmed }),
          })
          if (res.ok) {
            const data = await res.json() as { message?: string; tokensUsed?: number; intent?: string }
            responseText = data.message ?? null
            tokensUsed = data.tokensUsed ?? tokensUsed
          }
        } catch {
          // API not available — use demo response
        }

        if (!responseText) {
          responseText = getDemoResponse(trimmed)
        }

        setTotalTokens((prev) => prev + tokensUsed)

        setMessages((prev) => {
          const withoutStatus = prev.filter((m) => m.id !== statusMsg.id)
          return [
            ...withoutStatus,
            {
              id: uid(),
              role: 'assistant',
              content: responseText!,
              tokensUsed,
              timestamp: new Date(),
            },
          ]
        })
      } catch {
        setMessages((prev) => {
          const withoutStatus = prev.filter((m) => m.id !== statusMsg.id)
          return [
            ...withoutStatus,
            {
              id: uid(),
              role: 'assistant',
              content: 'Something went wrong. Please try again.',
              timestamp: new Date(),
            },
          ]
        })
      } finally {
        setLoading(false)
      }
    },
    [loading],
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit(input)
    }
  }

  // Shared icon buttons — rendered in desktop sidebar and mobile bottom bar
  const iconBarButtons = (
    <>
      <IconBtn id="projects" label="Projects" active={activePanel === 'projects'} onClick={togglePanel}>
        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
          <rect x="3" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
          <rect x="11" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
          <rect x="3" y="11" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
          <rect x="11" y="11" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      </IconBtn>

      <IconBtn id="assets" label="Assets" active={activePanel === 'assets'} onClick={togglePanel}>
        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
          <path d="M10 2l2.5 5H17l-4 3 1.5 5L10 12l-4.5 3L7 10 3 7h4.5L10 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        </svg>
      </IconBtn>

      <IconBtn id="dna" label="Game DNA" active={activePanel === 'dna'} onClick={togglePanel}>
        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
          <path d="M5 3c1 2 4 3 4 5s-3 3-4 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M15 3c-1 2-4 3-4 5s3 3 4 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M4.5 7h11M4.5 13h11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
      </IconBtn>

      <IconBtn id="tokens" label="Tokens" active={activePanel === 'tokens'} onClick={togglePanel}>
        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M10 7v6M7.5 8.5c0-.83.67-1.5 2.5-1.5s2.5.67 2.5 1.5S12.5 10 10 10s-2.5.83-2.5 1.5S8.17 13 10 13s2.5-.67 2.5-1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
      </IconBtn>

      <IconBtn id="settings" label="Settings" active={activePanel === 'settings'} onClick={togglePanel}>
        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.41 1.41M14.37 14.37l1.41 1.41M4.22 15.78l1.41-1.41M14.37 5.63l1.41-1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </IconBtn>
    </>
  )

  return (
    <div className="flex h-screen bg-[#080B1E] overflow-hidden" style={{ height: '100dvh' }}>

      {/* ── Desktop icon bar (hidden on mobile) ──────────────────────────── */}
      <div className="hidden md:flex flex-col items-center gap-1 py-3 px-1 bg-[#0A0E1F] border-r border-white/8 w-14 flex-shrink-0">
        {/* Home */}
        <Link
          href="/"
          title="Home"
          className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors mb-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
            <path d="M3 9.5L10 3l7 6.5V17a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M7 18v-6h6v6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
          </svg>
        </Link>

        <div className="w-6 h-px bg-white/8 mb-1" />

        {iconBarButtons}
      </div>

      {/* ── Desktop slide-out panel (hidden on mobile) ────────────────────── */}
      {activePanel && (
        <div className="hidden md:flex w-56 bg-[#0A0E1F] border-r border-white/8 flex-col flex-shrink-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 flex-shrink-0">
            <span className="text-sm font-semibold text-white">{PANEL_TITLE[activePanel]}</span>
            <button
              onClick={() => setActivePanel(null)}
              className="text-gray-600 hover:text-gray-400 transition-colors"
              aria-label="Close panel"
            >
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">
            {activePanel === 'projects' && <ProjectsPanel />}
            {activePanel === 'assets' && <AssetsPanel />}
            {activePanel === 'dna' && <DnaPanel />}
            {activePanel === 'tokens' && <TokensPanel tokensUsed={totalTokens} />}
            {activePanel === 'settings' && <SettingsPanel />}
          </div>
        </div>
      )}

      {/* ── Mobile panel overlay (full-width bottom sheet) ───────────────── */}
      {activePanel && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/60"
          onClick={() => setActivePanel(null)}
        >
          <div
            className="absolute left-0 right-0 bottom-0 bg-[#0A0E1F] border-t border-white/8 rounded-t-2xl max-h-[70dvh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 flex-shrink-0">
              <span className="text-sm font-semibold text-white">{PANEL_TITLE[activePanel]}</span>
              <button
                onClick={() => setActivePanel(null)}
                className="w-9 h-9 flex items-center justify-center text-gray-600 hover:text-gray-400 transition-colors"
                aria-label="Close panel"
              >
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0">
              {activePanel === 'projects' && <ProjectsPanel />}
              {activePanel === 'assets' && <AssetsPanel />}
              {activePanel === 'dna' && <DnaPanel />}
              {activePanel === 'tokens' && <TokensPanel tokensUsed={totalTokens} />}
              {activePanel === 'settings' && <SettingsPanel />}
            </div>
          </div>
        </div>
      )}

      {/* ── Main area ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 px-3 py-2 bg-[#0A0E1F] border-b border-white/8 flex-shrink-0">
          <Link
            href="/"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors"
            aria-label="Home"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
              <path d="M3 9.5L10 3l7 6.5V17a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M7 18v-6h6v6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
          </Link>
          <span className="text-sm font-semibold text-white flex-1">Editor</span>
          <span className="text-[10px] text-gray-600">{totalTokens} tokens</span>
        </div>

        {/* Viewport */}
        <div className="flex-[5] flex flex-col min-h-0">
          <Viewport hasGame={hasGame} />
        </div>

        {/* Divider */}
        <div className="h-px bg-white/8 flex-shrink-0" />

        {/* Chat panel */}
        <div className="flex-[4] flex flex-col min-h-0 bg-[#0A0E1F]">

          {/* Chat header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/8 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#FFB81C]" />
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Build Chat</span>
            </div>
            <span className="text-[10px] text-gray-600 hidden md:block">{totalTokens} tokens used</span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
            {messages.length === 1 && (
              /* Empty state with suggestion chips */
              <div className="flex flex-wrap gap-2 pt-1">
                {SUGGESTION_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    onClick={() => submit(chip)}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/8 border border-white/10 hover:border-white/20 text-xs text-gray-400 hover:text-gray-200 rounded-full transition-colors"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}

            {messages.map((msg) => (
              <Message key={msg.id} msg={msg} />
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input bar */}
          <div className="px-3 py-3 border-t border-white/8 flex-shrink-0">
            <div className="flex items-center gap-2 bg-[#060916] border border-white/10 rounded-xl px-3 py-2 focus-within:border-[#FFB81C]/40 transition-colors">
              {/* Mic */}
              {supported && (
                <button
                  onClick={() => listening ? stop() : start()}
                  aria-label={listening ? 'Stop listening' : 'Start voice input'}
                  className={[
                    'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
                    listening
                      ? 'bg-red-500/20 text-red-400'
                      : 'text-gray-600 hover:text-gray-400 hover:bg-white/5',
                  ].join(' ')}
                >
                  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                    <rect x="5" y="1" width="6" height="9" rx="3" stroke="currentColor" strokeWidth="1.3"/>
                    <path d="M2 8c0 3.31 2.69 5 6 5s6-1.69 6-5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                    <path d="M8 13v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                </button>
              )}

              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={listening ? 'Listening...' : 'What do you want to build?'}
                disabled={loading}
                className="flex-1 min-w-0 bg-transparent text-sm text-gray-200 placeholder-gray-600 focus:outline-none disabled:opacity-50"
              />

              {/* Send */}
              <button
                onClick={() => submit(input)}
                disabled={!input.trim() || loading}
                aria-label="Send"
                className={[
                  'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
                  input.trim() && !loading
                    ? 'bg-[#FFB81C] text-black hover:bg-[#E6A519]'
                    : 'bg-white/5 text-gray-600 cursor-not-allowed',
                ].join(' ')}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7h10M7 2l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile bottom icon bar ───────────────────────────────────────── */}
        <div
          className="md:hidden flex items-center justify-around px-2 py-1 bg-[#0A0E1F] border-t border-white/8 flex-shrink-0"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 4px)' }}
        >
          {iconBarButtons}
        </div>
      </div>
    </div>
  )
}
