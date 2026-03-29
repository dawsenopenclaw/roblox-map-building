'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'

// ─── Types ─────────────────────────────────────────────────────────────────────

type MessageRole = 'user' | 'assistant' | 'system' | 'status'

interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  tokensUsed?: number
  timestamp: Date
  model?: string
}

type ModelId = 'claude-4' | 'claude-3-5' | 'gemini-2' | 'gpt-4o' | 'grok-3'

interface ModelOption {
  id: ModelId
  label: string
  provider: string
  color: string
  badge?: string
}

type PanelId = 'projects' | 'assets' | 'dna' | 'tokens' | 'settings' | null

// ─── Constants ─────────────────────────────────────────────────────────────────

const MODELS: ModelOption[] = [
  { id: 'claude-4',    label: 'Claude 4',       provider: 'Anthropic', color: '#CC785C', badge: 'BEST' },
  { id: 'claude-3-5',  label: 'Claude 3.5',     provider: 'Anthropic', color: '#CC785C' },
  { id: 'gemini-2',    label: 'Gemini 2.0',     provider: 'Google',    color: '#4285F4' },
  { id: 'gpt-4o',      label: 'GPT-4o',         provider: 'OpenAI',    color: '#10A37F' },
  { id: 'grok-3',      label: 'Grok 3',         provider: 'xAI',       color: '#8B5CF6' },
]

const QUICK_ACTIONS = [
  { label: 'Castle',       icon: '🏰', prompt: 'Build a medieval castle with towers and a moat' },
  { label: 'Forest',       icon: '🌲', prompt: 'Generate a dense forest biome with trees and rocks' },
  { label: 'NPC',          icon: '🧑', prompt: 'Create an NPC with patrol AI and dialogue' },
  { label: 'City Block',   icon: '🏙️', prompt: 'Build a city district with roads and buildings' },
  { label: 'Race Track',   icon: '🏎️', prompt: 'Design a racing track with banked corners' },
  { label: 'Dungeon',      icon: '⚔️', prompt: 'Generate a dungeon with corridors and traps' },
]

const DEMO_RESPONSES: Record<string, string> = {
  castle:  'Castle placed at map center. Added 4 towers (32 studs tall), a main great hall, iron portcullis, and a water moat with drawbridge mechanics.',
  forest:  'Forest biome generated. 847 trees, 23 boulders, and 12 fallen logs placed across the eastern quadrant. Fog density set to 0.35.',
  npc:     'NPC spawned near town square. Patrol radius: 40 studs. Equipped with idle, walk, and interact animations. Dialogue system with 3 greeting variants.',
  terrain: 'Terrain sculpted: rolling hills with a river valley cutting north-south. Baseplate 2048×2048 studs. Water plane at Y=0 with foam shader.',
  city:    'City district built: 12 buildings (3–8 floors), road grid with crosswalks, 24 street lights, 3 pocket parks. 400×400 stud footprint.',
  racing:  'Racing circuit placed: 1.2km loop with 8 banked corners, pit lane exit, grandstand seating for 500, timing boards at start/finish.',
  dungeon: 'Dungeon generated: 14-room procedural layout, spike traps on 3 tiles, pressure plates, 2 locked doors with key items, torch lighting.',
  default: 'Command received. I would generate and place the requested assets directly in your Roblox Studio scene. Connect an API key in Settings to enable live execution.',
}

const PANEL_TITLE: Record<NonNullable<PanelId>, string> = {
  projects: 'Projects',
  assets:   'Assets',
  dna:      'Game DNA',
  tokens:   'Tokens',
  settings: 'Settings',
}

const RECENT_PROJECTS = ['My First Game', 'Castle Adventure', 'Racing Sim']
const ALL_ASSETS = ['Castle Kit', 'Forest Pack', 'City Builder', 'Dungeon Set', 'Ocean Terrain', 'Neon City']

// ─── Helpers ───────────────────────────────────────────────────────────────────

function uid(): string {
  return Math.random().toString(36).slice(2, 9)
}

function estimateTokens(text: string): number {
  return Math.max(8, Math.ceil(text.split(/\s+/).length * 1.3))
}

function getDemoResponse(prompt: string): string {
  const lower = prompt.toLowerCase()
  for (const [key, response] of Object.entries(DEMO_RESPONSES)) {
    if (key !== 'default' && lower.includes(key)) return response
  }
  return DEMO_RESPONSES.default
}

// ─── Speech hook ───────────────────────────────────────────────────────────────

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

// ─── Model Selector ────────────────────────────────────────────────────────────

function ModelSelector({ value, onChange }: { value: ModelId; onChange: (id: ModelId) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = MODELS.find((m) => m.id === value)!

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/8 border border-white/10 hover:border-white/20 transition-all text-xs text-gray-300 hover:text-white"
        aria-label="Select AI model"
      >
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: current.color }}
        />
        <span className="font-medium">{current.label}</span>
        <svg className="w-3 h-3 text-gray-500" viewBox="0 0 12 12" fill="none">
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 bottom-full mb-2 w-52 bg-[#0D1231] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
          <div className="px-3 py-2 border-b border-white/8">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Select Model</p>
          </div>
          {MODELS.map((m) => (
            <button
              key={m.id}
              onClick={() => { onChange(m.id); setOpen(false) }}
              className={[
                'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors',
                value === m.id ? 'bg-white/8' : 'hover:bg-white/5',
              ].join(' ')}
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: m.color }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-white font-medium">{m.label}</span>
                  {m.badge && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#FFB81C]/20 text-[#FFB81C]">
                      {m.badge}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-gray-500">{m.provider}</span>
              </div>
              {value === m.id && (
                <svg className="w-3.5 h-3.5 text-[#FFB81C] flex-shrink-0" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7l4 4 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Typing Indicator ──────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-center gap-3">
      {/* Avatar */}
      <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #FFB81C 0%, #FF6B35 100%)' }}>
        <svg className="w-3.5 h-3.5 text-black" viewBox="0 0 14 14" fill="currentColor">
          <path d="M7 1a6 6 0 110 12A6 6 0 017 1zm0 1.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9zm.75 2.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm-.75 2a.75.75 0 01.75.75v2a.75.75 0 11-1.5 0v-2A.75.75 0 017 6.75z"/>
        </svg>
      </div>
      {/* Bubble with dots */}
      <div className="px-4 py-3 rounded-2xl rounded-tl-sm"
        style={{
          background: 'linear-gradient(135deg, rgba(13,18,49,1) 0%, rgba(17,24,64,1) 100%)',
          border: '1px solid rgba(255,184,28,0.15)',
          boxShadow: '0 0 20px rgba(255,184,28,0.06)',
        }}>
        <div className="flex gap-1.5 items-center h-4">
          {[0, 150, 300].map((d) => (
            <div
              key={d}
              className="w-1.5 h-1.5 rounded-full bg-[#FFB81C]"
              style={{
                animation: 'typing-bounce 1.2s ease-in-out infinite',
                animationDelay: `${d}ms`,
                opacity: 0.7,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Message bubble ────────────────────────────────────────────────────────────

function Message({ msg }: { msg: ChatMessage }) {
  if (msg.role === 'system') {
    return (
      <div className="flex justify-center my-2">
        <span className="text-[11px] text-gray-600 bg-white/5 border border-white/8 rounded-full px-3 py-0.5">
          {msg.content}
        </span>
      </div>
    )
  }

  if (msg.role === 'status') {
    return <TypingIndicator />
  }

  if (msg.role === 'user') {
    return (
      <div className="flex justify-end gap-2">
        <div
          className="max-w-[80%] px-4 py-3 rounded-2xl rounded-tr-sm"
          style={{
            background: 'linear-gradient(135deg, rgba(255,184,28,0.12) 0%, rgba(255,107,53,0.08) 100%)',
            border: '1px solid rgba(255,184,28,0.25)',
          }}
        >
          <p className="text-sm text-gray-100 leading-relaxed">{msg.content}</p>
        </div>
        <div className="w-7 h-7 rounded-full flex-shrink-0 bg-white/10 border border-white/15 flex items-center justify-center self-end">
          <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M1.5 12.5c0-2.5 2.5-4 5.5-4s5.5 1.5 5.5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
        </div>
      </div>
    )
  }

  // assistant
  const modelColor = MODELS.find((m) => m.id === msg.model)?.color ?? '#FFB81C'

  return (
    <div className="flex items-start gap-3">
      {/* AI Avatar */}
      <div
        className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
        style={{ background: `linear-gradient(135deg, ${modelColor} 0%, ${modelColor}88 100%)` }}
      >
        <svg className="w-3.5 h-3.5 text-black" viewBox="0 0 14 14" fill="currentColor">
          <path d="M7 2L8.5 5.5H12L9 7.5l1 3.5L7 9l-3 2 1-3.5-3-2h3.5L7 2z"/>
        </svg>
      </div>

      {/* Bubble */}
      <div className="flex flex-col gap-1.5 max-w-[82%]">
        <div
          className="relative px-4 py-3 rounded-2xl rounded-tl-sm"
          style={{
            background: 'linear-gradient(135deg, rgba(13,18,49,1) 0%, rgba(17,24,64,1) 100%)',
            border: '1px solid rgba(255,184,28,0.15)',
            boxShadow: '0 0 24px rgba(255,184,28,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
          }}
        >
          {/* Top gradient line */}
          <div
            className="absolute top-0 left-4 right-4 h-px rounded-full"
            style={{ background: `linear-gradient(90deg, transparent, ${modelColor}40, transparent)` }}
          />
          <p className="text-sm text-gray-100 leading-relaxed">{msg.content}</p>
        </div>
        {msg.tokensUsed !== undefined && (
          <span className="text-[10px] text-gray-600 pl-1 flex items-center gap-1">
            <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1"/>
              <path d="M6 4v2.5l1.5 1.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
            </svg>
            {msg.tokensUsed} tokens
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Viewport ──────────────────────────────────────────────────────────────────

function Viewport({ hasGame }: { hasGame: boolean }) {
  return (
    <div className="flex-1 relative bg-[#050812] overflow-hidden">
      {/* Perspective grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      {/* Radial gold glow at center */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(255,184,28,0.04) 0%, transparent 70%)',
        }}
      />
      {/* Corner vignette */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 120% 120% at 50% 50%, transparent 55%, rgba(5,8,18,0.8) 100%)',
        }}
      />

      {!hasGame && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 text-center px-8">
          {/* 3D cube icon */}
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(255,184,28,0.08) 0%, rgba(255,184,28,0.02) 100%)',
              border: '1px solid rgba(255,184,28,0.15)',
              boxShadow: '0 0 40px rgba(255,184,28,0.08)',
            }}
          >
            <svg className="w-10 h-10 text-[#FFB81C]/40" viewBox="0 0 40 40" fill="none">
              <path d="M20 5L6 13v14l14 8 14-8V13L20 5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M6 13l14 8 14-8" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M20 21v14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M13 9l7 4 7-4" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" strokeDasharray="2 2" opacity="0.4"/>
            </svg>
          </div>
          <div>
            <p className="text-gray-300 text-base font-semibold mb-1">3D Preview</p>
            <p className="text-gray-600 text-xs max-w-xs leading-relaxed">
              Your Roblox scene will render here in real-time as the AI builds it
            </p>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="h-px w-12 bg-white/8" />
            <span className="text-[11px] text-gray-700">Connect Studio to start</span>
            <div className="h-px w-12 bg-white/8" />
          </div>
        </div>
      )}

      {/* Top HUD bar */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
        {/* Scene info */}
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] text-gray-500"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
              <rect x="1" y="1" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1"/>
              <path d="M4 4h4M4 6h2.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
            </svg>
            No scene loaded
          </div>
        </div>
        {/* Studio connection */}
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg pointer-events-auto"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-yellow-500/50" />
          <span className="text-[10px] text-gray-500 font-medium">Studio offline</span>
        </div>
      </div>

      {/* Bottom viewport toolbar */}
      <div
        className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-1.5 rounded-xl pointer-events-auto"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {[
          { label: 'Pan',    icon: 'M5 1v10M1 5h10', type: 'path' },
          { label: 'Orbit',  icon: 'M6 1a5 5 0 100 10A5 5 0 006 1zM1 6h10', type: 'path' },
          { label: 'Zoom',   icon: 'M5 2a3 3 0 100 6A3 3 0 005 2zM9 9l2 2', type: 'path' },
          { label: 'Reset',  icon: 'M2 6a4 4 0 014-4 4 4 0 014 4M10 2l2 2-2 2', type: 'path' },
        ].map(({ label, icon }) => (
          <button
            key={label}
            title={label}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-white/8 transition-colors"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 12 12" fill="none">
              <path d={icon} stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        ))}
        <div className="w-px h-4 bg-white/10 mx-0.5" />
        <button
          title="Fullscreen"
          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-white/8 transition-colors"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 12 12" fill="none">
            <path d="M1 4V1h3M8 1h3v3M11 8v3H8M4 11H1V8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

// ─── Panel sub-components ──────────────────────────────────────────────────────

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
          <button key={name} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-left transition-colors group">
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
            <div key={name} className="bg-white/5 border border-white/8 hover:border-white/15 rounded-lg p-2.5 cursor-pointer transition-colors">
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

function TokensPanel({ tokensUsed }: { tokensUsed: number }) {
  const TOKEN_LIMIT = 1000
  const remaining = Math.max(0, TOKEN_LIMIT - tokensUsed)
  const usedPct = Math.min(100, (tokensUsed / TOKEN_LIMIT) * 100)

  return (
    <div className="p-4 space-y-4">
      <div className="bg-[#FFB81C]/10 border border-[#FFB81C]/20 rounded-xl p-4 text-center">
        <p className="text-3xl font-bold text-[#FFB81C]">{remaining.toLocaleString()}</p>
        <p className="text-xs text-gray-500 mt-1">tokens remaining</p>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full bg-[#FFB81C] rounded-full transition-all duration-500" style={{ width: `${usedPct}%` }} />
      </div>
      <p className="text-[11px] text-gray-600 text-center">Free tier &middot; {tokensUsed.toLocaleString()} tokens used</p>
      <Link href="/billing" className="flex items-center justify-center gap-2 w-full bg-white/5 hover:bg-white/8 border border-white/10 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors">
        Buy more tokens
      </Link>
    </div>
  )
}

function SettingsPanel() {
  return (
    <div className="p-4 space-y-1">
      {[
        { label: 'Profile',  href: '/settings' },
        { label: 'API Keys', href: '/settings/api-keys' },
        { label: 'Billing',  href: '/billing' },
        { label: 'Team',     href: '/team' },
        { label: 'Referrals', href: '/referrals' },
      ].map(({ label, href }) => (
        <Link key={label} href={href} className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/5 text-gray-300 hover:text-white transition-colors text-sm">
          {label}
          <svg className="w-4 h-4 text-gray-600" viewBox="0 0 16 16" fill="none">
            <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
      ))}
    </div>
  )
}

// ─── Icon sidebar button ───────────────────────────────────────────────────────

function IconBtn({
  id, label, active, onClick, children,
}: {
  id: PanelId; label: string; active: boolean; onClick: (id: PanelId) => void; children: React.ReactNode
}) {
  return (
    <button
      onClick={() => onClick(id)}
      title={label}
      aria-label={label}
      className={[
        'w-10 h-10 rounded-xl flex items-center justify-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FFB81C]',
        active ? 'bg-[#FFB81C]/15 text-[#FFB81C]' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

// ─── Main editor ───────────────────────────────────────────────────────────────

export function EditorClient() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: uid(),
      role: 'system',
      content: 'ForjeAI ready — describe what you want to build',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [activePanel, setActivePanel] = useState<PanelId>(null)
  const [hasGame] = useState(false)
  const [totalTokens, setTotalTokens] = useState(0)
  const [selectedModel, setSelectedModel] = useState<ModelId>('claude-4')
  const [imageFile, setImageFile] = useState<File | null>(null)

  const chatEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px'
  }, [input])

  const handleVoiceResult = useCallback((text: string) => {
    setInput((prev) => (prev ? prev + ' ' + text : text))
    textareaRef.current?.focus()
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
      setImageFile(null)
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
            body: JSON.stringify({ message: trimmed, model: selectedModel }),
          })
          if (res.ok) {
            const data = await res.json() as { message?: string; tokensUsed?: number }
            responseText = data.message ?? null
            tokensUsed = data.tokensUsed ?? tokensUsed
          }
        } catch {
          // fall through to demo
        }

        if (!responseText) responseText = getDemoResponse(trimmed)

        setTotalTokens((prev) => prev + tokensUsed)

        setMessages((prev) => {
          const without = prev.filter((m) => m.id !== statusMsg.id)
          return [
            ...without,
            {
              id: uid(),
              role: 'assistant',
              content: responseText!,
              tokensUsed,
              timestamp: new Date(),
              model: selectedModel,
            },
          ]
        })
      } catch {
        setMessages((prev) => {
          const without = prev.filter((m) => m.id !== statusMsg.id)
          return [
            ...without,
            {
              id: uid(),
              role: 'assistant',
              content: 'Something went wrong. Please try again.',
              timestamp: new Date(),
              model: selectedModel,
            },
          ]
        })
      } finally {
        setLoading(false)
        setTimeout(() => textareaRef.current?.focus(), 50)
      }
    },
    [loading, selectedModel],
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit(input)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setImageFile(file)
    e.target.value = ''
  }

  const currentModel = MODELS.find((m) => m.id === selectedModel)!

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
    <>
      {/* Keyframe for typing bounce */}
      <style>{`
        @keyframes typing-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>

      <div className="flex h-screen bg-[#06080F] overflow-hidden" style={{ height: '100dvh' }}>

        {/* ── Left icon bar ──────────────────────────────────────────────── */}
        <div className="hidden md:flex flex-col items-center gap-1 py-3 px-1 bg-[#090C1A] border-r border-white/6 w-14 flex-shrink-0">
          <Link href="/" title="Home" className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors mb-2">
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
              <path d="M3 9.5L10 3l7 6.5V17a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M7 18v-6h6v6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
          </Link>
          <div className="w-6 h-px bg-white/8 mb-1" />
          {iconBarButtons}
        </div>

        {/* ── Left slide-out panel ────────────────────────────────────────── */}
        {activePanel && (
          <div className="hidden md:flex w-56 bg-[#090C1A] border-r border-white/6 flex-col flex-shrink-0 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 flex-shrink-0">
              <span className="text-sm font-semibold text-white">{PANEL_TITLE[activePanel]}</span>
              <button onClick={() => setActivePanel(null)} className="text-gray-600 hover:text-gray-400 transition-colors" aria-label="Close panel">
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0">
              {activePanel === 'projects' && <ProjectsPanel />}
              {activePanel === 'assets'   && <AssetsPanel />}
              {activePanel === 'dna'      && <DnaPanel />}
              {activePanel === 'tokens'   && <TokensPanel tokensUsed={totalTokens} />}
              {activePanel === 'settings' && <SettingsPanel />}
            </div>
          </div>
        )}

        {/* ── Mobile panel overlay ────────────────────────────────────────── */}
        {activePanel && (
          <div className="md:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={() => setActivePanel(null)}>
            <div className="absolute left-0 right-0 bottom-0 bg-[#090C1A] border-t border-white/8 rounded-t-2xl max-h-[70dvh] flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 flex-shrink-0">
                <span className="text-sm font-semibold text-white">{PANEL_TITLE[activePanel]}</span>
                <button onClick={() => setActivePanel(null)} className="w-9 h-9 flex items-center justify-center text-gray-600 hover:text-gray-400 transition-colors" aria-label="Close panel">
                  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                    <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto min-h-0">
                {activePanel === 'projects' && <ProjectsPanel />}
                {activePanel === 'assets'   && <AssetsPanel />}
                {activePanel === 'dna'      && <DnaPanel />}
                {activePanel === 'tokens'   && <TokensPanel tokensUsed={totalTokens} />}
                {activePanel === 'settings' && <SettingsPanel />}
              </div>
            </div>
          </div>
        )}

        {/* ── Main two-column area ────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* Mobile top bar */}
          <div className="md:hidden flex items-center gap-3 px-3 py-2 bg-[#090C1A] border-b border-white/6 flex-shrink-0">
            <Link href="/" className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors" aria-label="Home">
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
                <path d="M3 9.5L10 3l7 6.5V17a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M7 18v-6h6v6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
            </Link>
            <span className="text-sm font-semibold text-white flex-1">AI Editor</span>
            <span className="text-[10px] text-gray-600">{totalTokens} tokens</span>
          </div>

          {/* Two-column layout */}
          <div className="flex-1 flex min-h-0 overflow-hidden">

            {/* ── LEFT: Chat column ────────────────────────────────────────── */}
            <div
              className="flex flex-col min-h-0 overflow-hidden flex-shrink-0"
              style={{
                width: 'min(420px, 40vw)',
                borderRight: '1px solid rgba(255,255,255,0.06)',
                background: 'linear-gradient(180deg, #090C1A 0%, #06080F 100%)',
              }}
            >
              {/* Chat header */}
              <div
                className="flex items-center justify-between px-4 py-3 flex-shrink-0"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: 'radial-gradient(circle, #FFB81C 30%, #FFB81C44 100%)', boxShadow: '0 0 6px #FFB81C80' }}
                  />
                  <span className="text-xs font-semibold text-gray-300 uppercase tracking-widest">Build Chat</span>
                </div>
                <span className="text-[10px] text-gray-600 hidden md:block">{totalTokens} tokens used</span>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
                {/* Quick action chips — visible when empty */}
                {messages.length === 1 && (
                  <div className="space-y-3">
                    <p className="text-[11px] text-gray-600 uppercase tracking-wider">Quick start</p>
                    <div className="grid grid-cols-2 gap-2">
                      {QUICK_ACTIONS.map(({ label, icon, prompt }) => (
                        <button
                          key={label}
                          onClick={() => submit(prompt)}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-all hover:scale-[1.02]"
                          style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.08)',
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.border = '1px solid rgba(255,184,28,0.25)'
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.border = '1px solid rgba(255,255,255,0.08)'
                          }}
                        >
                          <span className="text-base">{icon}</span>
                          <span className="text-xs text-gray-400 font-medium">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg) => (
                  <Message key={msg.id} msg={msg} />
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* ── Input area ─────────────────────────────────────────────── */}
              <div
                className="px-4 py-4 flex-shrink-0 space-y-3"
                style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
              >
                {/* Image preview */}
                {imageFile && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                    <svg className="w-4 h-4 text-[#FFB81C] flex-shrink-0" viewBox="0 0 16 16" fill="none">
                      <rect x="1" y="3" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                      <circle cx="5.5" cy="7" r="1.5" stroke="currentColor" strokeWidth="1"/>
                      <path d="M1 11l4-3 3 2.5 2-2 5 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                    </svg>
                    <span className="text-xs text-gray-400 flex-1 min-w-0 truncate">{imageFile.name}</span>
                    <button onClick={() => setImageFile(null)} className="text-gray-600 hover:text-gray-400">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none">
                        <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                )}

                {/* Textarea bubble */}
                <div
                  className="relative rounded-2xl transition-all duration-200"
                  style={{
                    background: 'rgba(5,8,18,0.8)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: loading ? '0 0 0 2px rgba(255,184,28,0.15)' : 'none',
                  }}
                >
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={listening ? 'Listening...' : 'Describe what you want to build...'}
                    disabled={loading}
                    rows={1}
                    className="w-full bg-transparent text-sm text-gray-100 placeholder-gray-600 focus:outline-none resize-none px-4 pt-3.5 pb-2 disabled:opacity-50"
                    style={{ minHeight: '52px', maxHeight: '160px' }}
                  />

                  {/* Action row inside textarea */}
                  <div className="flex items-center justify-between px-3 pb-3">
                    <div className="flex items-center gap-1">
                      {/* Voice */}
                      {supported && (
                        <button
                          onClick={() => listening ? stop() : start()}
                          aria-label={listening ? 'Stop voice input' : 'Start voice input'}
                          title={listening ? 'Stop' : 'Voice input'}
                          className={[
                            'w-8 h-8 rounded-lg flex items-center justify-center transition-all',
                            listening
                              ? 'bg-red-500/20 text-red-400 scale-110'
                              : 'text-gray-600 hover:text-[#FFB81C] hover:bg-[#FFB81C]/10',
                          ].join(' ')}
                        >
                          {listening ? (
                            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                              <rect x="4" y="4" width="8" height="8" rx="1" fill="currentColor"/>
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                              <rect x="5" y="1" width="6" height="9" rx="3" stroke="currentColor" strokeWidth="1.3"/>
                              <path d="M2 8c0 3.31 2.69 5 6 5s6-1.69 6-5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                              <path d="M8 13v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                            </svg>
                          )}
                        </button>
                      )}

                      {/* Image upload */}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        title="Upload image"
                        aria-label="Upload image"
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 hover:text-[#FFB81C] hover:bg-[#FFB81C]/10 transition-all"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                          <rect x="1" y="3" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                          <circle cx="5.5" cy="7.5" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
                          <path d="M1 11.5l4-3.5 3 2.5 2-2 5 3" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </div>

                    {/* Send button */}
                    <button
                      onClick={() => submit(input)}
                      disabled={!input.trim() || loading}
                      aria-label="Send message"
                      className={[
                        'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all',
                        input.trim() && !loading
                          ? 'bg-[#FFB81C] text-black hover:bg-[#E6A519] shadow-lg'
                          : 'bg-white/5 text-gray-600 cursor-not-allowed',
                      ].join(' ')}
                      style={input.trim() && !loading ? { boxShadow: '0 4px 16px rgba(255,184,28,0.3)' } : {}}
                    >
                      {loading ? (
                        <>
                          <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 14 14" fill="none">
                            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="8 8"/>
                          </svg>
                          <span>Building</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none">
                            <path d="M2 7h10M7 2l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <span>Build</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Bottom toolbar row */}
                <div className="flex items-center gap-2">
                  {/* Model selector */}
                  <ModelSelector value={selectedModel} onChange={setSelectedModel} />

                  <div className="flex-1" />

                  {/* Templates */}
                  <button
                    title="Templates"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/8 border border-white/8 hover:border-white/15 text-xs text-gray-500 hover:text-gray-300 transition-all"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none">
                      <rect x="1" y="1" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                      <rect x="7.5" y="1" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                      <rect x="1" y="7.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                      <rect x="7.5" y="7.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                    </svg>
                    Templates
                  </button>

                  {/* Shift+Enter hint */}
                  <span className="text-[10px] text-gray-700 hidden lg:block">Shift+Enter for newline</span>
                </div>

                {/* Model indicator strip */}
                <div className="flex items-center gap-2 px-1">
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: currentModel.color }}
                  />
                  <span className="text-[11px] text-gray-600">
                    {currentModel.label} by {currentModel.provider}
                  </span>
                  {currentModel.badge && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#FFB81C]/15 text-[#FFB81C]">
                      {currentModel.badge}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* ── RIGHT: Viewport ──────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
              <Viewport hasGame={hasGame} />
            </div>
          </div>

          {/* ── Mobile bottom icon bar ───────────────────────────────────── */}
          <div
            className="md:hidden flex items-center justify-around px-2 py-1 bg-[#090C1A] border-t border-white/6 flex-shrink-0"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 4px)' }}
          >
            {iconBarButtons}
          </div>
        </div>
      </div>
    </>
  )
}
