'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import Image from 'next/image'
import { useToast } from '@/components/ui/toast-notification'
import { useUser } from '@clerk/nextjs'
import { EditorTour, useEditorTour } from './EditorTour'
import { EditorEmptyState } from './EditorEmptyState'
import { ViewportPreview } from '@/components/editor/ViewportPreview'
import type { ViewportState } from '@/components/editor/ViewportPreview'

// ─── Lazy-loaded heavy components (code-split) ─────────────────────────────────

const CommandPalette  = dynamic(() => import('@/components/CommandPalette').then(m => ({ default: m.CommandPalette })), { ssr: false })
const ShortcutsDialog = dynamic(() => import('@/components/ShortcutsDialog').then(m => ({ default: m.ShortcutsDialog })), { ssr: false })
const AssetsPanel     = dynamic(() => import('./panels/AssetsPanel').then(m => ({ default: m.AssetsPanel })),     { ssr: false })
const DnaPanel        = dynamic(() => import('./panels/DnaPanel').then(m => ({ default: m.DnaPanel })),           { ssr: false })
const TokensPanel     = dynamic(() => import('./panels/TokensPanel').then(m => ({ default: m.TokensPanel })),     { ssr: false })
const SettingsPanel   = dynamic(() => import('./panels/SettingsPanel').then(m => ({ default: m.SettingsPanel })), { ssr: false })

// ─── Types ─────────────────────────────────────────────────────────────────────

type MessageRole = 'user' | 'assistant' | 'system' | 'status'

// ─── Marketplace build result type (mirrors API shape) ─────────────────────

interface MarketplaceAssetClient {
  assetId: number
  name: string
  creator: string
  thumbnailUrl: string | null
  isFree: boolean
  catalogUrl: string
  searchTerm: string
}

interface BuildResult {
  foundAssets: MarketplaceAssetClient[]
  missingTerms: string[]
  luauCode: string
  totalMarketplace: number
  totalCustom: number
  estimatedCustomCost: number
}

interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  tokensUsed?: number
  timestamp: Date
  model?: string
  /** Present for building/terrain/fullgame intents */
  buildResult?: BuildResult
  /** True when this message represents a failed build — renders with retry button */
  isError?: boolean
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

// ─── Studio connection types ───────────────────────────────────────────────────

interface StudioStatus {
  connected: boolean
  placeName?: string
  placeId?: number
  screenshotUrl?: string
  lastActivity?: string
  sessionId?: string
}

interface StudioActivity {
  id: string
  message: string
  timestamp: Date
}

interface RobloxGame {
  id: string
  name: string
  thumbnailUrl: string
  visits: number
  updated: string
  isPublished: boolean
  genre: string
}

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
  { label: '3D Mesh',      icon: '💎', prompt: 'Generate a 3D mesh: medieval stone tower, Roblox game asset' },
  { label: 'Dungeon',      icon: '⚔️', prompt: 'Generate a dungeon with corridors and traps' },
]

// Build-intent keywords that should trigger real 3D mesh generation from the chat
const BUILD_MESH_KEYWORDS = ['build', 'generate 3d', 'create mesh', 'make a 3d', 'generate mesh', '3d model', 'mesh:']

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

const DEMO_GAMES: RobloxGame[] = [
  { id: 'demo-1', name: 'Medieval Kingdom', thumbnailUrl: '', visits: 15200, updated: '2h ago',      isPublished: true,  genre: 'RPG'     },
  { id: 'demo-2', name: 'Speed Racing',     thumbnailUrl: '', visits: 8700,  updated: 'Yesterday',   isPublished: true,  genre: 'Racing'  },
  { id: 'demo-3', name: 'Tycoon Master',    thumbnailUrl: '', visits: 42100, updated: '3 days ago',  isPublished: true,  genre: 'Tycoon'  },
  { id: 'demo-4', name: 'Obby Challenge',   thumbnailUrl: '', visits: 3200,  updated: '1 week ago',  isPublished: true,  genre: 'Obby'    },
  { id: 'demo-5', name: 'My First Game',    thumbnailUrl: '', visits: 156,   updated: '2 weeks ago', isPublished: false, genre: 'Sandbox' },
]

function formatVisits(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

// ─── Roblox Marketplace Types ──────────────────────────────────────────────────

interface RobloxAsset {
  id: number
  name: string
  description: string
  creatorName: string
  price: number
  priceStatus: string | null
  thumbnailUrl: string | null
}

const ASSET_CATEGORIES = ['All', 'Models', 'Meshes', 'Audio', 'Images', 'Plugins'] as const
type AssetCategory = typeof ASSET_CATEGORIES[number]

const CATEGORY_PARAM: Record<AssetCategory, string> = {
  All:     'all',
  Models:  'models',
  Meshes:  'meshes',
  Audio:   'audio',
  Images:  'images',
  Plugins: 'plugins',
}

interface DnaExample { name: string; score: number; players: string; rating: string; genre: string }
const DNA_EXAMPLES: DnaExample[] = [
  { name: 'Pet Simulator X', score: 92, players: '98K avg',  rating: '94%', genre: 'Pet Sim'   },
  { name: 'Adopt Me',        score: 88, players: '145K avg', rating: '91%', genre: 'Roleplay'  },
]

const RECENT_USAGE = [
  { cmd: 'Build castle with moat',      tokens: 42 },
  { cmd: 'Add NPC patrol system',       tokens: 38 },
  { cmd: 'Generate forest biome',       tokens: 51 },
  { cmd: 'Create race track layout',    tokens: 29 },
  { cmd: 'Design dungeon entrance',     tokens: 35 },
]

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
        <svg className="w-3 h-3 text-gray-400" viewBox="0 0 12 12" fill="none">
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 bottom-full mb-2 w-52 bg-[#141414] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
          <div className="px-3 py-2 border-b border-white/8">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Select Model</p>
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
                <span className="text-[11px] text-gray-400">{m.provider}</span>
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
          <path d="M7 2L8.5 5.5H12L9 7.5l1 3.5L7 9l-3 2 1-3.5-3-2h3.5L7 2z"/>
        </svg>
      </div>
      {/* Bubble with dots + label */}
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl rounded-tl-sm"
        style={{
          background: 'linear-gradient(135deg, rgba(13,18,49,1) 0%, rgba(17,24,64,1) 100%)',
          border: '1px solid rgba(255,184,28,0.15)',
          boxShadow: '0 0 20px rgba(255,184,28,0.06)',
        }}>
        <span className="text-xs text-[#FFB81C]/70 font-medium">ForjeGames is building</span>
        <div className="flex gap-1 items-center">
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

// ─── Build Result Card ─────────────────────────────────────────────────────────

function AssetPill({ asset }: { asset: MarketplaceAssetClient }) {
  const [imgErr, setImgErr] = useState(false)
  return (
    <a
      href={asset.catalogUrl}
      target="_blank"
      rel="noopener noreferrer"
      title={`${asset.name} by ${asset.creator}`}
      className="flex flex-col items-center gap-1 group"
    >
      <div
        className="relative w-12 h-12 rounded-lg overflow-hidden border flex items-center justify-center transition-all"
        style={{
          background: 'rgba(74,222,128,0.06)',
          borderColor: 'rgba(74,222,128,0.25)',
        }}
      >
        {asset.thumbnailUrl && !imgErr ? (
          <Image
            src={`/api/roblox/thumbnail?id=${asset.assetId}&size=150x150`}
            alt={asset.name}
            fill
            className="object-cover"
            onError={() => setImgErr(true)}
          />
        ) : (
          <svg className="w-5 h-5 text-green-500/50" viewBox="0 0 20 20" fill="none">
            <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
            <circle cx="10" cy="10" r="3" fill="currentColor" opacity="0.4"/>
          </svg>
        )}
      </div>
      <span
        className="text-[8px] text-center leading-tight max-w-[48px] truncate text-gray-500 group-hover:text-gray-300 transition-colors"
        title={asset.name}
      >
        {asset.name.split(' ').slice(0, 2).join(' ')}
      </span>
    </a>
  )
}

// ─── Simple Luau syntax highlighter ───────────────────────────────────────────

function LuauHighlighted({ code }: { code: string }) {
  const keywords = /\b(local|function|end|if|then|else|elseif|for|do|while|repeat|until|return|and|or|not|true|false|nil|in|break|continue)\b/g
  const builtins = /\b(print|wait|game|workspace|Instance|Vector3|CFrame|Enum|script|math|table|string|pcall|xpcall|error|tostring|tonumber|pairs|ipairs|next|select|type|typeof|unpack)\b/g
  const strings  = /"([^"\\]|\\.)*"|'([^'\\]|\\.)*'|\[\[[\s\S]*?\]\]/g
  const comments = /--.*$/gm
  const numbers  = /\b\d+(\.\d+)?\b/g

  // Tokenise by running each pattern and marking ranges
  const len = code.length
  type TokenKind = 'keyword' | 'builtin' | 'string' | 'comment' | 'number' | 'plain'
  interface Span { start: number; end: number; kind: TokenKind }
  const spans: Span[] = []

  const mark = (re: RegExp, kind: TokenKind) => {
    re.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = re.exec(code)) !== null) {
      spans.push({ start: m.index, end: m.index + m[0].length, kind })
    }
  }
  mark(comments, 'comment')
  mark(strings,  'string')
  mark(keywords, 'keyword')
  mark(builtins, 'builtin')
  mark(numbers,  'number')

  // Sort by start; filter overlaps (first wins)
  spans.sort((a, b) => a.start - b.start)
  const filtered: Span[] = []
  let cursor = 0
  for (const s of spans) {
    if (s.start < cursor) continue
    filtered.push(s)
    cursor = s.end
  }

  // Build output with interleaved plain text
  const parts: React.ReactNode[] = []
  let pos = 0
  const COLOR: Record<TokenKind, string> = {
    keyword: '#C792EA',
    builtin: '#82AAFF',
    string:  '#C3E88D',
    comment: '#546E7A',
    number:  '#F78C6C',
    plain:   '#CDD3DE',
  }
  filtered.forEach((s, i) => {
    if (pos < s.start) parts.push(<span key={`p${i}`} style={{ color: COLOR.plain }}>{code.slice(pos, s.start)}</span>)
    parts.push(<span key={`t${i}`} style={{ color: COLOR[s.kind] }}>{code.slice(s.start, s.end)}</span>)
    pos = s.end
  })
  if (pos < len) parts.push(<span key="last" style={{ color: COLOR.plain }}>{code.slice(pos)}</span>)

  return <>{parts}</>
}

const BuildResultCard = React.memo(function BuildResultCard({ result }: { result: BuildResult }) {
  const [showCode, setShowCode] = useState(false)
  const [copied, setCopied]     = useState(false)
  const [importDone, setImportDone] = useState(false)
  const { show: showToast } = useToast()
  const copyTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const importTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cancel pending reset timers on unmount to avoid setState on dead component
  useEffect(() => {
    return () => {
      if (copyTimerRef.current)   clearTimeout(copyTimerRef.current)
      if (importTimerRef.current) clearTimeout(importTimerRef.current)
    }
  }, [])

  // Rough part/time estimates based on code line count
  const lineCount = result.luauCode.split('\n').length
  const estimatedParts = Math.max(8, lineCount * 2 + result.totalMarketplace * 4)
  const estimatedSeconds = Math.max(1, Math.round(estimatedParts / 15))

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result.luauCode)
    setCopied(true)
    showToast({ variant: 'success', title: 'Copied to clipboard!', description: 'Paste the Luau code into Roblox Studio to import.', duration: 4000 })
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
    copyTimerRef.current = setTimeout(() => setCopied(false), 2000)
  }

  const handleImport = () => {
    // Copy code to clipboard and signal done
    navigator.clipboard.writeText(result.luauCode).catch(() => {})
    setImportDone(true)
    if (importTimerRef.current) clearTimeout(importTimerRef.current)
    importTimerRef.current = setTimeout(() => setImportDone(false), 3000)
  }

  return (
    <div
      className="mt-3 rounded-xl overflow-hidden"
      style={{ border: '1px solid rgba(74,222,128,0.2)', background: 'rgba(0,0,0,0.3)' }}
    >
      {/* Header row */}
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{ background: 'rgba(74,222,128,0.06)', borderBottom: '1px solid rgba(74,222,128,0.1)' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400" style={{ boxShadow: '0 0 6px #4ADE80' }}/>
          <span className="text-[11px] font-semibold text-green-400">
            {result.totalMarketplace} marketplace asset{result.totalMarketplace !== 1 ? 's' : ''} found
          </span>
        </div>
        {result.totalCustom > 0 && (
          <span className="text-[10px] text-[#FFB81C] font-medium">
            + {result.totalCustom} custom ({result.estimatedCustomCost} credit{result.estimatedCustomCost !== 1 ? 's' : ''})
          </span>
        )}
      </div>

      {/* Asset thumbnails row */}
      {result.foundAssets.length > 0 && (
        <div className="px-3 py-3">
          <p className="text-[9px] text-gray-600 uppercase tracking-wider font-medium mb-2">
            From Roblox Creator Store — free &amp; ready to use
          </p>
          <div className="flex flex-wrap gap-2">
            {result.foundAssets.map((asset) => (
              <AssetPill key={asset.assetId} asset={asset} />
            ))}
            {/* Custom placeholders */}
            {result.missingTerms.map((term) => (
              <div key={term} className="flex flex-col items-center gap-1">
                <div
                  className="w-12 h-12 rounded-lg overflow-hidden border flex items-center justify-center"
                  style={{ background: 'rgba(255,184,28,0.06)', borderColor: 'rgba(255,184,28,0.25)', borderStyle: 'dashed' }}
                >
                  <svg className="w-5 h-5 text-[#FFB81C]/40" viewBox="0 0 20 20" fill="none">
                    <path d="M10 5v10M5 10h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <span className="text-[8px] text-center max-w-[48px] leading-tight text-[#FFB81C]/60">
                  {term.split(' ').slice(0, 2).join(' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom gen notice */}
      {result.missingTerms.length > 0 && (
        <div
          className="px-3 py-2 flex items-center gap-2"
          style={{ background: 'rgba(255,184,28,0.04)', borderTop: '1px solid rgba(255,184,28,0.1)' }}
        >
          <svg className="w-3 h-3 text-[#FFB81C] flex-shrink-0" viewBox="0 0 12 12" fill="currentColor">
            <path d="M6 1l1.5 3.5H11l-2.75 2 1 3.5L6 8.25 2.75 10l1-3.5L1 4.5h3.5L6 1z"/>
          </svg>
          <span className="text-[10px] text-[#FFB81C]/80">
            Generating {result.missingTerms.length} custom model{result.missingTerms.length !== 1 ? 's' : ''} with Meshy AI:
            {' '}{result.missingTerms.map((t) => `"${t}"`).join(', ')}
          </span>
        </div>
      )}

      {/* Estimated stats */}
      <div
        className="flex items-center gap-3 px-3 py-2"
        style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
      >
        <svg className="w-3 h-3 text-[#FFB81C]/60 flex-shrink-0" viewBox="0 0 12 12" fill="none">
          <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1"/>
          <path d="M6 4v2.5l1.5 1.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
        </svg>
        <span className="text-[10px] text-gray-500">
          ~{estimatedParts} parts &nbsp;&middot;&nbsp; ~{estimatedSeconds}s to import
        </span>
        <div className="flex-1" />
        <span className="text-[9px] text-gray-700 uppercase tracking-wider">Preview</span>
        <svg className="w-14 h-6 flex-shrink-0" viewBox="0 0 56 24" fill="none" aria-hidden>
          {/* Mini isometric build preview */}
          <rect x="4" y="10" width="16" height="12" rx="1" fill="#1E3A5F" stroke="#3B6EA8" strokeWidth="0.8"/>
          <rect x="4" y="4" width="16" height="8" rx="0.5" fill="#2E5A8A" stroke="#4A7DC0" strokeWidth="0.6"/>
          <rect x="24" y="12" width="12" height="10" rx="1" fill="#3A2010" stroke="#7A5230" strokeWidth="0.8"/>
          <rect x="40" y="8" width="13" height="14" rx="1" fill="#1A3A28" stroke="#2E6644" strokeWidth="0.8"/>
          <circle cx="48" cy="6" r="3" fill="#166534" stroke="#22883C" strokeWidth="0.6"/>
          <line x1="0" y1="22" x2="56" y2="22" stroke="#2a2a2a" strokeWidth="0.8"/>
        </svg>
      </div>

      {/* Luau code section */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <button
          onClick={() => setShowCode((s) => !s)}
          className="w-full flex items-center justify-between px-3 py-2 text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
              <path d="M4 3l-3 3 3 3M8 3l3 3-3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            View Luau Code
          </span>
          <svg className={`w-3 h-3 transition-transform ${showCode ? 'rotate-180' : ''}`} viewBox="0 0 12 12" fill="none">
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
        </button>
        {showCode && (
          <div className="relative">
            <pre
              className="px-3 py-2 text-[9px] font-mono overflow-x-auto leading-relaxed"
              style={{ background: 'rgba(0,0,0,0.5)', maxHeight: '180px', tabSize: 2 }}
            >
              <LuauHighlighted code={result.luauCode} />
            </pre>
            <button
              onClick={handleCopy}
              className="absolute top-1.5 right-2 flex items-center gap-1 text-[9px] px-2 py-0.5 rounded transition-all"
              style={{
                background: copied ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.06)',
                color: copied ? '#4ADE80' : '#B0B0B0',
                border: `1px solid ${copied ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.08)'}`,
              }}
            >
              {copied ? (
                <>
                  <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none"><rect x="1" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/><path d="M3 3V2a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                  Copy to Clipboard
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Import to Studio CTA */}
      <div className="px-3 pb-3 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <button
          onClick={handleImport}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg font-semibold text-xs transition-all duration-200 active:scale-[0.97]"
          style={{
            background: importDone
              ? 'rgba(74,222,128,0.15)'
              : 'linear-gradient(135deg, #D4AF37 0%, #FFB81C 100%)',
            color: importDone ? '#4ADE80' : '#030712',
            border: importDone ? '1px solid rgba(74,222,128,0.3)' : 'none',
            boxShadow: importDone ? 'none' : '0 0 16px rgba(212,175,55,0.25)',
          }}
        >
          {importDone ? (
            <>
              <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none"><path d="M2 7l4 4 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Copied! Paste in Roblox Studio
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none">
                <path d="M7 1v8M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M1 11h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
              Import to Studio
            </>
          )}
        </button>

        {/* Studio paste instructions — shown after copy */}
        {importDone && (
          <div
            className="mt-2 px-2.5 py-2 rounded-lg text-[10px] text-gray-400 leading-relaxed space-y-0.5"
            style={{ background: 'rgba(74,222,128,0.04)', border: '1px solid rgba(74,222,128,0.12)' }}
          >
            <p className="font-semibold text-green-400 mb-1">How to paste in Roblox Studio:</p>
            <p>1. Open Roblox Studio and your place.</p>
            <p>2. In the top menu, go to <span className="text-gray-200 font-medium">View → Script Editor</span>.</p>
            <p>3. Insert a new <span className="text-gray-200 font-medium">Script</span> in ServerScriptService.</p>
            <p>4. Paste the code (<span className="text-gray-200 font-medium">Ctrl+V</span>) and press <span className="text-gray-200 font-medium">Play</span>.</p>
          </div>
        )}
      </div>
    </div>
  )
})

// ─── Timestamp display ─────────────────────────────────────────────────────────

function MessageTimestamp({ ts }: { ts: Date }) {
  const label = ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return (
    <span
      className="text-[9px] text-gray-600 select-none"
      style={{ animation: 'timestamp-fade 0.15s ease-out forwards' }}
    >
      {label}
    </span>
  )
}

// ─── Message bubble ────────────────────────────────────────────────────────────

const Message = React.memo(function Message({
  msg,
  onRetry,
}: {
  msg: ChatMessage
  onRetry?: () => void
}) {
  const [showTs, setShowTs] = useState(false)

  if (msg.role === 'system') {
    return (
      <div className="flex justify-center my-2">
        <span className="text-[11px] text-gray-500 bg-white/5 border border-white/8 rounded-full px-3 py-0.5">
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
      <div
        className="flex justify-end gap-2 group"
        onMouseEnter={() => setShowTs(true)}
        onMouseLeave={() => setShowTs(false)}
      >
        <div className="flex flex-col items-end gap-1">
          <div
            className="max-w-[80%] px-4 py-3 rounded-2xl rounded-tr-sm transition-all duration-200"
            style={{
              background: 'linear-gradient(135deg, rgba(255,184,28,0.14) 0%, rgba(255,107,53,0.09) 100%)',
              border: '1px solid rgba(255,184,28,0.28)',
              boxShadow: '0 2px 12px rgba(255,184,28,0.08)',
            }}
          >
            <p className="text-sm text-gray-100 leading-relaxed">{msg.content}</p>
          </div>
          {showTs && <MessageTimestamp ts={msg.timestamp} />}
        </div>
        <div className="w-7 h-7 rounded-full flex-shrink-0 bg-white/10 border border-white/15 flex items-center justify-center self-end">
          <svg className="w-3.5 h-3.5 text-gray-300" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M1.5 12.5c0-2.5 2.5-4 5.5-4s5.5 1.5 5.5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
        </div>
      </div>
    )
  }

  // assistant error state — show explanation + retry button
  if (msg.isError) {
    return (
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 bg-red-500/20 border border-red-500/30">
          <svg className="w-3.5 h-3.5 text-red-400" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M7 4.5v3M7 9.5v0.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
        </div>
        <div
          className="flex flex-col gap-2 max-w-[82%] px-4 py-3 rounded-2xl rounded-tl-sm"
          style={{
            background: 'rgba(239,68,68,0.06)',
            border: '1px solid rgba(239,68,68,0.2)',
          }}
        >
          <p className="text-sm text-red-300 leading-relaxed">{msg.content}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="self-start flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
              style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}
            >
              <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                <path d="M2 6a4 4 0 014-4 4 4 0 014 4M10 2l2 2-2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Try again
            </button>
          )}
        </div>
      </div>
    )
  }

  // assistant — words fade in progressively
  const modelColor = MODELS.find((m) => m.id === msg.model)?.color ?? '#FFB81C'
  const words = msg.content.split(' ')

  return (
    <div
      className="flex items-start gap-3 group"
      onMouseEnter={() => setShowTs(true)}
      onMouseLeave={() => setShowTs(false)}
    >
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
          <p className="text-sm text-gray-100 leading-relaxed whitespace-pre-wrap font-[inherit]">
            {words.map((word, i) => (
              <span
                key={i}
                style={{
                  animation: 'word-fade-in 0.25s ease-out forwards',
                  animationDelay: `${Math.min(i * 18, 600)}ms`,
                  opacity: 0,
                  display: 'inline',
                }}
              >
                {word}{i < words.length - 1 ? ' ' : ''}
              </span>
            ))}
          </p>
        </div>
        {/* Marketplace-first build result card */}
        {msg.buildResult && <BuildResultCard result={msg.buildResult} />}
        <div className="flex items-center gap-2 pl-1">
          {msg.tokensUsed !== undefined && (
            <span className="text-[10px] text-blue-400/70 flex items-center gap-1">
              <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1"/>
                <path d="M6 4v2.5l1.5 1.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
              </svg>
              {msg.tokensUsed} tokens
            </span>
          )}
          {showTs && <MessageTimestamp ts={msg.timestamp} />}
        </div>
      </div>
    </div>
  )
})

// ─── Viewport ──────────────────────────────────────────────────────────────────

// Static scene objects always present in the mock isometric scene
const SCENE_BASE_OBJECTS = [
  { id: 'b1', type: 'building', color: '#3B6EA8', darkColor: '#1E4A7A', topColor: '#5B8EC7', accent: '#7AB3E8', x: 52, y: 40, w: 62, h: 50 },
  { id: 'b2', type: 'building', color: '#5A6472', darkColor: '#3A4451', topColor: '#8A9BB0', accent: '#A8B8CC', x: 34, y: 54, w: 46, h: 36 },
  { id: 'b3', type: 'building', color: '#7A5230', darkColor: '#5A3418', topColor: '#A87850', accent: '#D4A878', x: 66, y: 59, w: 38, h: 28 },
  { id: 'b4', type: 'building', color: '#2E3A4A', darkColor: '#1A2230', topColor: '#5A6880', accent: '#7A90AA', x: 24, y: 38, w: 30, h: 62 },
  { id: 't1', type: 'tree', x: 20, y: 33, size: 20 },
  { id: 't2', type: 'tree', x: 75, y: 36, size: 15 },
  { id: 't3', type: 'tree', x: 81, y: 54, size: 17 },
  { id: 't4', type: 'tree', x: 15, y: 61, size: 13 },
  { id: 't5', type: 'tree', x: 73, y: 47, size: 11 },
  { id: 't6', type: 'tree', x: 23, y: 49, size: 14 },
]

export const SPAWN_COLORS = [
  { color: '#7C3AED', darkColor: '#5B21B6', topColor: '#8B5CF6' },
  { color: '#DC2626', darkColor: '#991B1B', topColor: '#EF4444' },
  { color: '#047857', darkColor: '#064E3B', topColor: '#10B981' },
  { color: '#B45309', darkColor: '#78350F', topColor: '#F59E0B' },
  { color: '#0E7490', darkColor: '#164E63', topColor: '#06B6D4' },
  { color: '#BE185D', darkColor: '#831843', topColor: '#EC4899' },
]

export const SPAWN_SLOTS = [
  { x: 44, y: 34 }, { x: 82, y: 44 }, { x: 30, y: 68 },
  { x: 60, y: 70 }, { x: 14, y: 45 }, { x: 68, y: 30 },
]

export interface SceneBlock {
  id: string
  color: string
  darkColor: string
  topColor: string
  x: number
  y: number
  w: number
  h: number
  spawned: boolean
}

function IsometricBuilding({
  color, darkColor, topColor, accent, x, y, w, h, spawned,
}: {
  color: string; darkColor: string; topColor: string; accent?: string
  x: number; y: number; w: number; h: number; spawned: boolean
}) {
  const halfW = w / 2
  // Window grid: how many windows fit
  const winCols = Math.max(1, Math.floor(halfW / 10))
  const winRows = Math.max(1, Math.floor(h / 14))

  return (
    <div
      className="absolute"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: `${w}px`,
        animation: spawned ? 'block-spawn-smooth 0.65s cubic-bezier(0.22,1,0.36,1) forwards' : 'none',
        opacity: spawned ? 0 : 1,
        filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.5))',
      }}
    >
      {/* ── Top face (roof) ── */}
      <div style={{
        width: `${w}px`,
        height: `${halfW * 0.55}px`,
        background: `linear-gradient(135deg, ${topColor} 0%, ${topColor}CC 100%)`,
        transform: 'skewX(-30deg) scaleY(0.58)',
        transformOrigin: 'bottom left',
        position: 'relative',
        zIndex: 3,
        boxShadow: `inset 0 -3px 8px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.15)`,
      }}>
        {/* Roof edge highlight */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
          background: `rgba(255,255,255,0.2)`,
        }} />
      </div>

      {/* ── Front-left face (light side) ── */}
      <div style={{
        width: `${halfW}px`,
        height: `${h}px`,
        background: `linear-gradient(180deg, ${color} 0%, ${darkColor}AA 100%)`,
        position: 'absolute',
        top: `${halfW * 0.55 * 0.58 - 2}px`,
        left: 0,
        transform: 'skewY(15deg)',
        transformOrigin: 'top left',
        zIndex: 2,
        overflow: 'hidden',
      }}>
        {/* Ambient occlusion at base */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '8px', background: 'rgba(0,0,0,0.25)' }} />
        {/* Window grid — left face */}
        {Array.from({ length: winRows }).map((_, r) =>
          Array.from({ length: winCols }).map((_, c) => {
            const lit = (r + c) % 3 !== 0
            return (
              <div key={`lw${r}-${c}`} style={{
                position: 'absolute',
                left: `${8 + c * (86 / winCols)}%`,
                top: `${8 + r * (80 / winRows)}%`,
                width: `${Math.max(4, 60 / winCols)}%`,
                height: `${Math.max(3, 55 / winRows)}%`,
                background: lit ? `rgba(255,220,120,0.55)` : 'rgba(0,0,0,0.4)',
                borderRadius: '1px',
                boxShadow: lit ? '0 0 4px rgba(255,200,80,0.4)' : 'none',
              }} />
            )
          })
        )}
      </div>

      {/* ── Front-right face (shadow side) ── */}
      <div style={{
        width: `${halfW}px`,
        height: `${h * 0.87}px`,
        background: `linear-gradient(180deg, ${darkColor} 0%, ${darkColor}88 100%)`,
        position: 'absolute',
        top: `${halfW * 0.55 * 0.58 - 2}px`,
        left: `${halfW}px`,
        transform: 'skewY(-15deg)',
        transformOrigin: 'top right',
        zIndex: 2,
        overflow: 'hidden',
      }}>
        {/* Ambient occlusion at base */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '6px', background: 'rgba(0,0,0,0.3)' }} />
        {/* Edge highlight where faces meet */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '2px', height: '100%', background: `rgba(255,255,255,0.08)` }} />
        {/* Window grid — right face (dimmer) */}
        {Array.from({ length: winRows }).map((_, r) =>
          Array.from({ length: Math.max(1, winCols - 1) }).map((_, c) => {
            const lit = (r * 2 + c) % 4 !== 0
            return (
              <div key={`rw${r}-${c}`} style={{
                position: 'absolute',
                left: `${10 + c * (78 / Math.max(1, winCols - 1))}%`,
                top: `${10 + r * (78 / winRows)}%`,
                width: `${Math.max(5, 55 / Math.max(1, winCols - 1))}%`,
                height: `${Math.max(4, 50 / winRows)}%`,
                background: lit ? `rgba(255,200,100,0.28)` : 'rgba(0,0,0,0.35)',
                borderRadius: '1px',
              }} />
            )
          })
        )}
      </div>

      {/* ── Accent stripe on roof edge ── */}
      {accent && (
        <div style={{
          position: 'absolute',
          top: `${halfW * 0.55 * 0.58 - 3}px`,
          left: 0,
          width: `${w}px`,
          height: '3px',
          background: accent,
          opacity: 0.6,
          zIndex: 4,
        }} />
      )}
    </div>
  )
}

function IsometricTree({ x, y, size }: { x: number; y: number; size: number }) {
  const trunkW = size * 0.22
  const trunkH = size * 0.45
  const r1 = size * 0.78   // outer canopy radius
  const r2 = size * 0.58   // mid canopy radius
  const r3 = size * 0.38   // top canopy radius

  return (
    <div className="absolute pointer-events-none" style={{ left: `${x}%`, top: `${y}%` }}>
      {/* Ground shadow */}
      <div style={{
        position: 'absolute',
        bottom: `-${size * 0.05}px`,
        left: `${-r1 * 0.6}px`,
        width: `${r1 * 1.2}px`,
        height: `${r1 * 0.35}px`,
        background: 'radial-gradient(ellipse, rgba(0,0,0,0.4) 0%, transparent 70%)',
        zIndex: 0,
      }} />

      {/* Trunk */}
      <div style={{
        width: `${trunkW}px`,
        height: `${trunkH}px`,
        background: 'linear-gradient(180deg, #7A5230 0%, #5A3A18 100%)',
        margin: '0 auto',
        position: 'relative',
        zIndex: 1,
        borderRadius: '2px 2px 0 0',
        boxShadow: `inset -2px 0 4px rgba(0,0,0,0.3)`,
      }} />

      {/* Canopy — bottom layer (widest, darkest) */}
      <div style={{
        width: `${r1 * 2}px`,
        height: `${r1 * 1.1}px`,
        background: 'radial-gradient(ellipse at 45% 40%, #1A6B30 0%, #0F4A20 60%, #0A3518 100%)',
        borderRadius: '50% 50% 40% 40%',
        position: 'absolute',
        bottom: `${trunkH * 0.55}px`,
        left: `${trunkW / 2 - r1}px`,
        zIndex: 2,
        boxShadow: '0 4px 12px rgba(0,0,0,0.45)',
      }} />

      {/* Canopy — mid layer */}
      <div style={{
        width: `${r2 * 2}px`,
        height: `${r2 * 1.15}px`,
        background: 'radial-gradient(ellipse at 40% 35%, #22883C 0%, #166B28 55%, #0D4A1A 100%)',
        borderRadius: '50% 50% 38% 38%',
        position: 'absolute',
        bottom: `${trunkH * 0.72}px`,
        left: `${trunkW / 2 - r2}px`,
        zIndex: 3,
        boxShadow: `inset 0 -2px 8px rgba(0,0,0,0.3), inset 2px 2px 6px rgba(100,200,80,0.15)`,
      }} />

      {/* Canopy — top layer (brightest) */}
      <div style={{
        width: `${r3 * 2}px`,
        height: `${r3 * 1.2}px`,
        background: 'radial-gradient(ellipse at 38% 30%, #34D058 0%, #22A840 45%, #168830 100%)',
        borderRadius: '50% 50% 35% 35%',
        position: 'absolute',
        bottom: `${trunkH * 0.92}px`,
        left: `${trunkW / 2 - r3}px`,
        zIndex: 4,
        boxShadow: `inset 1px 1px 6px rgba(120,255,100,0.2)`,
      }} />

      {/* Light catch on top canopy */}
      <div style={{
        width: `${r3 * 0.8}px`,
        height: `${r3 * 0.5}px`,
        background: 'radial-gradient(ellipse, rgba(120,255,100,0.18) 0%, transparent 70%)',
        borderRadius: '50%',
        position: 'absolute',
        bottom: `${trunkH * 1.05}px`,
        left: `${trunkW / 2 - r3 * 0.4}px`,
        zIndex: 5,
      }} />
    </div>
  )
}

function BuildPreviewSvg() {
  return (
    <svg
      viewBox="0 0 200 120"
      className="w-full h-full"
      style={{ opacity: 0.15, filter: 'drop-shadow(0 0 8px rgba(212,175,55,0.3))' }}
      aria-hidden
    >
      {/* Ground */}
      <rect x="10" y="80" width="180" height="35" rx="2" fill="#1A4731" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5"/>
      {/* Grid on ground */}
      {[30,50,70,90,110,130,150,170].map(x => (
        <line key={x} x1={x} y1="80" x2={x} y2="115" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5"/>
      ))}
      {[88,96,104,112].map(y => (
        <line key={y} x1="10" y1={y} x2="190" y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="0.5"/>
      ))}
      {/* Buildings — isometric-ish */}
      <rect x="30" y="45" width="30" height="35" rx="1" fill="#2E4A7A" stroke="#4A6EA8" strokeWidth="0.8"/>
      <rect x="30" y="35" width="30" height="12" rx="0.5" fill="#3B6EA8" stroke="#5B8EC7" strokeWidth="0.5"/>
      <rect x="75" y="52" width="24" height="28" rx="1" fill="#5A4A30" stroke="#A87850" strokeWidth="0.8"/>
      <rect x="110" y="38" width="36" height="42" rx="1" fill="#1E3A28" stroke="#2E6644" strokeWidth="0.8"/>
      <rect x="110" y="28" width="36" height="12" rx="0.5" fill="#2E6040" stroke="#3A8050" strokeWidth="0.5"/>
      <rect x="155" y="58" width="20" height="22" rx="1" fill="#3A2A4A" stroke="#7A5090" strokeWidth="0.8"/>
      {/* Trees */}
      <circle cx="22" cy="76" r="6" fill="#166534" stroke="#22883C" strokeWidth="0.5"/>
      <circle cx="168" cy="74" r="5" fill="#166534" stroke="#22883C" strokeWidth="0.5"/>
      <circle cx="103" cy="78" r="4" fill="#14522A" stroke="#20703A" strokeWidth="0.5"/>
      {/* Windows */}
      {[[36,52],[50,52],[36,62],[50,62]].map(([wx,wy],i) => (
        <rect key={i} x={wx} y={wy} width="5" height="4" rx="0.5" fill="rgba(255,220,120,0.5)"/>
      ))}
      {[[117,46],[127,46],[137,46],[117,58],[127,58],[137,58]].map(([wx,wy],i) => (
        <rect key={i} x={wx} y={wy} width="5" height="4" rx="0.5" fill="rgba(255,220,120,0.4)"/>
      ))}
    </svg>
  )
}

const Viewport = React.memo(function Viewport({ sceneBlocks, onConnectClick }: { sceneBlocks: SceneBlock[]; onConnectClick?: () => void }) {
  const [activeView, setActiveView] = useState<'Perspective' | 'Top' | 'Front' | 'Side'>('Perspective')
  const [showGrid, setShowGrid] = useState(true)
  const [zoom, setZoom] = useState(100)
  const [activeTool, setActiveTool] = useState<'Pan' | 'Orbit' | 'Zoom' | null>(null)

  const objectCount = 24 + sceneBlocks.length * 3
  const instanceCount = 156 + sceneBlocks.length * 12

  return (
    <div
      className="flex-1 relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #0A1628 0%, #0D1F3C 35%, #141414 100%)' }}
    >
      {/* Sky gradient */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'linear-gradient(180deg, #0D1B38 0%, #152444 40%, transparent 70%)',
      }} />

      {/* Stars */}
      {([
        [8,6],[15,3],[22,8],[31,2],[38,7],[45,4],[55,3],[63,7],[70,2],[78,5],[85,8],[92,4],
        [12,14],[28,11],[42,15],[58,12],[73,9],[88,13],
      ] as [number,number][]).map(([sx, sy], i) => (
        <div key={i} className="absolute rounded-full bg-white pointer-events-none" style={{
          left: `${sx}%`, top: `${sy}%`,
          width: i % 3 === 0 ? '2px' : '1px',
          height: i % 3 === 0 ? '2px' : '1px',
          opacity: 0.3 + (i % 4) * 0.12,
        }} />
      ))}

      {/* Ground plane */}
      <div className="absolute pointer-events-none" style={{
        left: '5%', top: '28%',
        width: '90%', height: '50%',
        background: 'linear-gradient(135deg, #1A4731 0%, #14532D 40%, #166534 100%)',
        transform: 'perspective(600px) rotateX(55deg) rotateZ(-2deg)',
        transformOrigin: 'top center',
        borderRadius: '4px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
      }} />

      {/* Grid overlay on ground */}
      {showGrid && (
        <div className="absolute pointer-events-none" style={{
          left: '5%', top: '28%',
          width: '90%', height: '50%',
          transform: 'perspective(600px) rotateX(55deg) rotateZ(-2deg)',
          transformOrigin: 'top center',
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)',
          backgroundSize: '10% 10%',
        }} />
      )}

      {/* Water / river */}
      <div className="absolute pointer-events-none" style={{
        left: '38%', top: '55%',
        width: '24%', height: '7%',
        background: 'linear-gradient(90deg, #1D4ED8 0%, #2563EB 50%, #1D4ED8 100%)',
        transform: 'perspective(600px) rotateX(55deg) rotateZ(-2deg)',
        transformOrigin: 'top center',
        opacity: 0.85,
        borderRadius: '2px',
        boxShadow: 'inset 0 1px 4px rgba(147,197,253,0.3)',
      }} />

      {/* Scene objects */}
      <div className="absolute pointer-events-none" style={{ left: '10%', top: '14%', width: '80%', height: '65%' }}>
        {SCENE_BASE_OBJECTS.filter(o => o.type === 'building').map(o => (
          <IsometricBuilding
            key={o.id}
            color={(o as {color:string}).color}
            darkColor={(o as {darkColor:string}).darkColor}
            topColor={(o as {topColor:string}).topColor}
            x={o.x} y={o.y}
            w={(o as {w:number}).w} h={(o as {h:number}).h}
            spawned={false}
          />
        ))}
        {sceneBlocks.map(b => (
          <IsometricBuilding
            key={b.id}
            color={b.color}
            darkColor={b.darkColor}
            topColor={b.topColor}
            x={b.x} y={b.y}
            w={b.w} h={b.h}
            spawned={b.spawned}
          />
        ))}
        {SCENE_BASE_OBJECTS.filter(o => o.type === 'tree').map(o => (
          <IsometricTree key={o.id} x={o.x} y={o.y} size={(o as {size:number}).size} />
        ))}
      </div>

      {/* Bottom fog */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{
        height: '20%',
        background: 'linear-gradient(0deg, rgba(6,8,15,0.7) 0%, transparent 100%)',
      }} />

      {/* Build preview SVG when scene blocks exist */}
      {sceneBlocks.length > 0 && (
        <div
          className="absolute inset-0 pointer-events-none flex items-center justify-center"
          style={{ opacity: 0, animation: 'word-fade-in 0.6s ease-out 0.2s forwards' }}
        >
          <div className="absolute inset-0 flex items-end justify-center pb-16 px-12">
            <BuildPreviewSvg />
          </div>
        </div>
      )}

      {/* TOP-LEFT: connection status */}
      <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-auto">
        <div
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px]"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-gray-500" />
          <span className="text-gray-300 font-medium">Demo Mode</span>
        </div>
        <button
          onClick={onConnectClick}
          className="text-[10px] text-[#FFB81C]/70 hover:text-[#FFB81C] transition-colors text-left px-1"
          style={{ lineHeight: '1' }}
        >
          Connect Roblox Studio to see live preview &rarr;
        </button>
      </div>

      {/* TOP-RIGHT: view mode + grid + zoom */}
      <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end pointer-events-auto">
        <div
          className="flex gap-0.5 rounded-lg overflow-hidden"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {(['Perspective', 'Top', 'Front', 'Side'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setActiveView(mode)}
              className="px-2.5 py-1.5 text-[10px] font-medium transition-colors"
              style={{
                color: activeView === mode ? '#FFB81C' : '#B0B0B0',
                background: activeView === mode ? 'rgba(255,184,28,0.12)' : 'transparent',
              }}
            >
              {mode}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setShowGrid(g => !g)}
            className="px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-colors"
            style={{
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(8px)',
              border: `1px solid ${showGrid ? 'rgba(255,184,28,0.3)' : 'rgba(255,255,255,0.08)'}`,
              color: showGrid ? '#FFB81C' : '#B0B0B0',
            }}
          >
            Show Grid
          </button>
          <div
            className="flex gap-0.5 rounded-lg overflow-hidden items-center"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <button
              onClick={() => setZoom((z) => Math.max(25, z - 25))}
              className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-white transition-colors text-sm font-bold"
              title="Zoom out"
            >−</button>
            <span className="text-[9px] text-gray-500 w-8 text-center font-mono">{zoom}%</span>
            <div className="w-px self-stretch bg-white/[0.08]" />
            <button
              onClick={() => setZoom((z) => Math.min(400, z + 25))}
              className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-white transition-colors text-sm font-bold"
              title="Zoom in"
            >+</button>
          </div>
        </div>
      </div>

      {/* BOTTOM-LEFT: stats */}
      <div
        className="absolute bottom-3 left-3 pointer-events-none"
        style={{
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '8px',
          padding: '6px 10px',
        }}
      >
        <span className="text-[10px] font-mono" style={{ color: '#9CA3AF' }}>
          Objects: <span style={{ color: '#E5E7EB' }}>{objectCount}</span>
          &nbsp;|&nbsp;Instances: <span style={{ color: '#E5E7EB' }}>{instanceCount}</span>
          &nbsp;|&nbsp;FPS: <span style={{ color: '#4ADE80' }}>60</span>
        </span>
      </div>

      {/* BOTTOM-CENTER: viewport toolbar */}
      <div
        className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-1.5 rounded-xl pointer-events-auto"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {([
          { label: 'Pan',   icon: 'M5 1v10M1 5h10' },
          { label: 'Orbit', icon: 'M6 1a5 5 0 100 10A5 5 0 006 1zM1 6h10' },
          { label: 'Zoom',  icon: 'M5 2a3 3 0 100 6A3 3 0 005 2zM9 9l2 2' },
        ] as { label: 'Pan' | 'Orbit' | 'Zoom'; icon: string }[]).map(({ label, icon }) => (
          <button
            key={label}
            title={label}
            onClick={() => setActiveTool((t) => (t === label ? null : label))}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{
              color: activeTool === label ? '#FFB81C' : '#9CA3AF',
              background: activeTool === label ? 'rgba(255,184,28,0.12)' : 'transparent',
            }}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 12 12" fill="none">
              <path d={icon} stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        ))}
        <button
          title="Reset view"
          onClick={() => { setZoom(100); setActiveTool(null) }}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 12 12" fill="none">
            <path d="M2 6a4 4 0 014-4 4 4 0 014 4M10 2l2 2-2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="w-px h-4 bg-white/10 mx-0.5" />
        <button
          title="Fullscreen"
          onClick={() => document.documentElement.requestFullscreen?.()}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/[0.08] transition-colors"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 12 12" fill="none">
            <path d="M1 4V1h3M8 1h3v3M11 8v3H8M4 11H1V8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  )
})

// ─── Panel sub-components ──────────────────────────────────────────────────────

function ProjectsPanel({
  activeGameId,
  onSelectGame,
}: {
  activeGameId: string | null
  onSelectGame: (game: RobloxGame) => void
}) {
  const [showConnect, setShowConnect] = useState(false)
  const [placeInput, setPlaceInput]   = useState('')
  const [games, setGames]             = useState<RobloxGame[]>(DEMO_GAMES)

  // Genre colour dots
  const GENRE_COLORS: Record<string, string> = {
    RPG: '#8B5CF6', Racing: '#3B82F6', Tycoon: '#F59E0B',
    Obby: '#10B981', Sandbox: '#B0B0B0',
  }

  const handleConnectGame = () => {
    const raw = placeInput.trim()
    if (!raw) return
    // Extract numeric ID from URL or raw input
    const match = raw.match(/(\d{6,})/)
    const id = match ? match[1] : `custom-${Date.now()}`
    const newGame: RobloxGame = {
      id,
      name: `Game ${id}`,
      thumbnailUrl: '',
      visits: 0,
      updated: 'Just now',
      isPublished: false,
      genre: 'Unknown',
    }
    setGames((prev) => [newGame, ...prev])
    onSelectGame(newGame)
    setPlaceInput('')
    setShowConnect(false)
  }

  return (
    <div className="p-4 space-y-3">
      {/* Header buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowConnect((s) => !s)}
          className="flex-1 flex items-center justify-center gap-1.5 bg-white/5 hover:bg-white/8 border border-white/10 hover:border-[#FFB81C]/30 text-gray-300 hover:text-[#FFB81C] text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none">
            <path d="M2 7h10M7 2v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Connect Game
        </button>
        <button className="flex-1 flex items-center justify-center gap-1.5 bg-[#FFB81C] hover:bg-[#E6A519] text-black text-xs font-semibold px-3 py-2 rounded-lg transition-colors">
          <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none">
            <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          New Game
        </button>
      </div>

      {/* Connect dialog inline */}
      {showConnect && (
        <div className="bg-white/[0.03] border border-[#FFB81C]/20 rounded-xl p-3 space-y-2">
          <p className="text-[10px] text-gray-400 font-medium">Enter Place ID or game URL</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={placeInput}
              onChange={(e) => setPlaceInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleConnectGame()}
              placeholder="e.g. 12345678 or roblox.com/games/..."
              className="flex-1 bg-black/30 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-blue-400/50"
            />
            <button
              onClick={handleConnectGame}
              disabled={!placeInput.trim()}
              className="bg-[#FFB81C] hover:bg-[#E6A519] disabled:opacity-40 text-black text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Section label */}
      <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium pt-1">Connected Games</p>

      {/* Game cards */}
      <div className="space-y-2">
        {games.map((game) => {
          const isActive = game.id === activeGameId
          return (
            <button
              key={game.id}
              onClick={() => onSelectGame(game)}
              className="w-full text-left group"
            >
              <div
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all"
                style={{
                  background: isActive ? 'rgba(255,184,28,0.06)' : 'rgba(255,255,255,0.02)',
                  borderColor: isActive ? 'rgba(255,184,28,0.5)' : 'rgba(255,255,255,0.08)',
                  boxShadow: isActive ? '0 0 0 1px rgba(255,184,28,0.2)' : 'none',
                }}
              >
                {/* Thumbnail / placeholder */}
                <div
                  className="relative w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden"
                  style={{
                    background: isActive
                      ? 'linear-gradient(135deg, rgba(255,184,28,0.2) 0%, rgba(255,107,53,0.15) 100%)'
                      : 'rgba(255,255,255,0.05)',
                    border: isActive ? '1px solid rgba(255,184,28,0.3)' : '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  {game.thumbnailUrl ? (
                    <Image src={game.thumbnailUrl} alt={game.name} fill className="object-cover rounded-lg" />
                  ) : (
                    <svg className="w-5 h-5" style={{ color: isActive ? '#FFB81C' : '#808080' }} viewBox="0 0 20 20" fill="none">
                      <path d="M10 2L12.5 7H17l-4 3 1.5 5L10 12 5.5 15 7 10 3 7h4.5L10 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className={`text-sm font-semibold truncate transition-colors ${isActive ? 'text-[#FFB81C]' : 'text-gray-200 group-hover:text-white'}`}>
                      {game.name}
                    </p>
                    {!game.isPublished && (
                      <span className="flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-gray-700/60 text-gray-400 border border-gray-600/50">
                        PRIVATE
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: GENRE_COLORS[game.genre] ?? '#B0B0B0' }}
                    />
                    <p className="text-[10px] text-gray-500">
                      {formatVisits(game.visits)} visits &middot; {game.updated}
                    </p>
                  </div>
                </div>

                {/* Active indicator */}
                {isActive && (
                  <div className="w-1.5 h-1.5 rounded-full bg-[#FFB81C] flex-shrink-0" style={{ boxShadow: '0 0 6px #FFB81C' }} />
                )}
              </div>
            </button>
          )
        })}
      </div>
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
        'forge-focus relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200',
        active
          ? 'bg-[#FFB81C]/15 text-[#FFB81C]'
          : 'text-gray-500 hover:text-gray-200 hover:bg-white/6',
      ].join(' ')}
      style={active ? { boxShadow: '0 0 12px rgba(255,184,28,0.18)' } : {}}
    >
      {children}
      {/* Gold underline indicator when active */}
      {active && (
        <span
          className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full"
          style={{ background: '#FFB81C', boxShadow: '0 0 4px #FFB81C' }}
        />
      )}
    </button>
  )
}

// ─── Main editor ───────────────────────────────────────────────────────────────

export function EditorClient() {
  const { show: showToast } = useToast()

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
  const [sceneBlocks, setSceneBlocks] = useState<SceneBlock[]>([])
  const [totalTokens, setTotalTokens] = useState(0)
  const [selectedModel, setSelectedModel] = useState<ModelId>('claude-4')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [activeGame, setActiveGame] = useState<RobloxGame | null>(DEMO_GAMES[0])
  const [projectName, setProjectName] = useState('Medieval Kingdom')
  const [editingProjectName, setEditingProjectName] = useState(false)
  const [showBuildOverlay, setShowBuildOverlay] = useState(false)
  const projectNameInputRef = useRef<HTMLInputElement>(null)

  const chatEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  /** Tracks the last submitted prompt so the error retry button can resubmit it */
  const lastSubmittedTextRef = useRef<string>('')

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

  // Sync project name when active game changes
  useEffect(() => {
    if (activeGame) setProjectName(activeGame.name)
  }, [activeGame])

  // Focus project name input when editing starts
  useEffect(() => {
    if (editingProjectName) projectNameInputRef.current?.select()
  }, [editingProjectName])

  const handleVoiceResult = useCallback((text: string) => {
    setInput((prev) => (prev ? prev + ' ' + text : text))
    textareaRef.current?.focus()
  }, [])

  const { listening, supported, start, stop } = useSpeechRecognition(handleVoiceResult)

  const togglePanel = useCallback((id: PanelId) => {
    setActivePanel((prev) => (prev === id ? null : id))
  }, [])

  // ── User info (for empty state personalisation) ───────────────────────────
  const { user } = useUser()
  const editorFirstName =
    user?.firstName ||
    user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] ||
    undefined

  // ── Editor tour ────────────────────────────────────────────────────────────
  const { shouldShow: showTour, dismiss: dismissTour } = useEditorTour()

  // ── Command palette + shortcuts dialog state ──────────────────────────────
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)

  // ── Editor-level keyboard shortcuts ──────────────────────────────────────
  useEffect(() => {
    const PANEL_KEYS: Record<string, PanelId> = {
      '1': 'projects',
      '2': 'assets',
      '3': 'dna',
      '4': 'tokens',
      '5': 'settings',
    }

    function handler(e: KeyboardEvent) {
      const mod = e.ctrlKey || e.metaKey

      // Ctrl/Cmd+K — command palette (GlobalShortcuts handles it globally;
      // this duplicate ensures it works when an editor input is focused)
      if (mod && e.key === 'k') {
        e.preventDefault()
        setPaletteOpen((v) => !v)
        return
      }

      // Ctrl/Cmd+/ — shortcuts dialog
      if (mod && e.key === '/') {
        e.preventDefault()
        setShortcutsOpen((v) => !v)
        return
      }

      // Ctrl/Cmd+B — toggle active panel (sidebar visibility)
      if (mod && e.key === 'b') {
        e.preventDefault()
        setActivePanel((prev) => (prev ? null : 'projects'))
        return
      }

      // Ctrl/Cmd+1-5 — switch panels
      if (mod && PANEL_KEYS[e.key]) {
        e.preventDefault()
        const id = PANEL_KEYS[e.key]
        setActivePanel((prev) => (prev === id ? null : id))
        return
      }

      // Ctrl+Enter — send message (textarea may or may not be focused)
      if (mod && e.key === 'Enter') {
        // Only fire if a textarea in this editor is NOT already handling it
        const active = document.activeElement
        if (!active || active.tagName !== 'TEXTAREA') {
          e.preventDefault()
          submit(input)
        }
        return
      }

      // Escape — close open panel
      if (e.key === 'Escape' && !paletteOpen && !shortcutsOpen) {
        setActivePanel(null)
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [paletteOpen, shortcutsOpen, input, submit])

  // Studio state — must be declared before submit so the callback closes over them
  const [studioStatus, setStudioStatus] = useState<StudioStatus>({ connected: false })
  const [demoMode, setDemoMode]             = useState(false)
  const [studioActivity, setStudioActivity] = useState<StudioActivity[]>([])
  const [executeStatus, setExecuteStatus]   = useState<'idle' | 'sending' | 'done' | 'error'>('idle')

  const submit = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || loading) return

      lastSubmittedTextRef.current = trimmed
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
        content: 'ForjeAI is thinking...',
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMsg, statusMsg])
      showToast({ variant: 'info', title: 'Building…', description: 'ForjeAI is generating your build.', duration: 4000, loading: true })

      try {
        let responseText: string | null = null
        let tokensUsed = estimateTokens(trimmed)

        // Detect build-mesh intent — run mesh generation in parallel with chat
        const lowerTrimmed = trimmed.toLowerCase()
        const isBuildMeshIntent = BUILD_MESH_KEYWORDS.some((kw) => lowerTrimmed.includes(kw))

        // Fire both in parallel: chat + optional mesh generation
        const chatPromise = fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: trimmed,
            model: selectedModel,
            gameContext: activeGame
              ? { id: activeGame.id, name: activeGame.name, genre: activeGame.genre }
              : null,
          }),
        })

        // Extract a clean mesh prompt from the user message
        const meshPrompt = trimmed
          .replace(/^(build|generate|create|make)\s+(a\s+)?(3d\s+)?(mesh\s*[:：]?\s*)?/i, '')
          .trim()
          .slice(0, 200)

        type MeshAPIResponse = {
          meshUrl?: string | null
          fbxUrl?: string | null
          thumbnailUrl?: string | null
          textures?: { albedo: string; normal: string; roughness: string } | null
          luauCode?: string | null
          costEstimateUsd?: number
          polygonCount?: number | null
          taskId?: string | null
          status: string
        }

        const meshPromise: Promise<MeshAPIResponse | null> = isBuildMeshIntent
          ? fetch('/api/ai/mesh', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prompt: meshPrompt, quality: 'standard', withTextures: true }),
            }).then((r) => r.ok ? r.json() as Promise<MeshAPIResponse> : null).catch(() => null)
          : Promise.resolve(null)

        const [chatRes, meshData] = await Promise.all([chatPromise, meshPromise])

        if (!chatRes.ok) throw new Error(`API error ${chatRes.status}`)

        const data = await chatRes.json() as {
          message?: string
          tokensUsed?: number
          buildResult?: BuildResult
        }
        responseText = data.message ?? getDemoResponse(trimmed)
        tokensUsed = data.tokensUsed ?? tokensUsed
        const buildResult = data.buildResult

        setTotalTokens((prev) => prev + tokensUsed)

        // Show "building" overlay briefly
        setShowBuildOverlay(true)
        setTimeout(() => setShowBuildOverlay(false), 1800)

        // Spawn a new block in the viewport for each AI response
        setSceneBlocks((prev) => {
          const idx = prev.length % SPAWN_SLOTS.length
          const colorIdx = prev.length % SPAWN_COLORS.length
          const slot = SPAWN_SLOTS[idx]
          const palette = SPAWN_COLORS[colorIdx]
          const newBlock: SceneBlock = {
            id: uid(),
            ...palette,
            x: slot.x,
            y: slot.y,
            w: 28 + (prev.length % 3) * 10,
            h: 20 + (prev.length % 4) * 8,
            spawned: true,
          }
          return [...prev, newBlock]
        })

        setMessages((prev) => {
          const without = prev.filter((m) => m.id !== statusMsg.id)
          const assistantMsg: ChatMessage = {
            id: uid(),
            role: 'assistant',
            content: responseText!,
            tokensUsed,
            timestamp: new Date(),
            model: selectedModel,
            ...(buildResult ? { buildResult } : {}),
          }
          const msgs: ChatMessage[] = [...without, assistantMsg]

          // If mesh was generated, append a system message with mesh details
          if (meshData) {
            const meshStatus = meshData.status === 'complete' ? 'complete' : meshData.status === 'pending' ? 'pending' : meshData.status
            const polyText = meshData.polygonCount ? ` ${meshData.polygonCount.toLocaleString()} polygons.` : ''
            const costText = (meshData.costEstimateUsd ?? 0) > 0 ? ` Cost: $${meshData.costEstimateUsd!.toFixed(3)}.` : ''
            const hasTextures = !!(meshData.textures?.albedo)
            msgs.push({
              id: uid(),
              role: 'system',
              content: meshStatus === 'complete'
                ? `3D mesh generated.${polyText}${costText}${hasTextures ? ' PBR textures included.' : ''} MeshPart Luau ready — open Assets > Generate to copy it.`
                : meshStatus === 'pending'
                ? `3D mesh is generating (task ${meshData.taskId ?? 'unknown'}). Poll GET /api/ai/mesh?taskId=${meshData.taskId ?? ''} for completion.`
                : meshStatus === 'demo'
                ? '3D mesh demo mode — add MESHY_API_KEY to generate real meshes.'
                : `3D mesh: ${meshStatus}`,
              timestamp: new Date(),
            })
          }
          return msgs
        })

        showToast({
          variant: 'success',
          title: 'Build complete!',
          description: buildResult ? 'Copy the Luau code to import into Roblox Studio.' : 'AI response ready.',
          duration: 5000,
          ...(buildResult ? {
            action: { label: 'View code', onClick: () => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) },
          } : {}),
        })

        // If Studio is actually connected (not demo), send Luau code to Studio for execution
        if (studioStatus.connected) {
          // Extract Luau from buildResult or mesh data
          const luauToExecute = buildResult?.luauCode ?? meshData?.luauCode ?? null
          if (luauToExecute) {
            setExecuteStatus('sending')
            setStudioActivity((prev) => [
              { id: uid(), message: `Sending build commands to Studio...`, timestamp: new Date() },
              ...prev.slice(0, 19),
            ])
            fetch('/api/studio/execute', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ code: luauToExecute, prompt: trimmed }),
            })
              .then((r) => {
                setExecuteStatus(r.ok ? 'done' : 'error')
                setStudioActivity((prev) => [
                  { id: uid(), message: r.ok ? `Executed in Studio` : `Studio execution failed`, timestamp: new Date() },
                  ...prev.slice(0, 19),
                ])
              })
              .catch(() => {
                setExecuteStatus('error')
                setStudioActivity((prev) => [
                  { id: uid(), message: `Studio unreachable`, timestamp: new Date() },
                  ...prev.slice(0, 19),
                ])
              })
              .finally(() => {
                setTimeout(() => setExecuteStatus('idle'), 3000)
              })
          }
        }
      } catch {
        setMessages((prev) => {
          const without = prev.filter((m) => m.id !== statusMsg.id)
          return [
            ...without,
            {
              id: uid(),
              role: 'assistant',
              content: 'Build failed. Check your connection and try again.',
              timestamp: new Date(),
              model: selectedModel,
              isError: true,
            },
          ]
        })
      } finally {
        setLoading(false)
        setTimeout(() => textareaRef.current?.focus(), 50)
      }
    },
    [loading, selectedModel, activeGame, studioStatus, setExecuteStatus, setStudioActivity, showToast],
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

  const [studioPolling, setStudioPolling] = useState(false)
  const studioIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Studio status polling
  const pollStudioStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/studio/status')
      if (!res.ok) return
      const data = await res.json() as StudioStatus
      setStudioStatus(data)
    } catch {
      // Network error — don't crash, just keep polling
    }
  }, [])

  // Screenshot polling (only when connected)
  const pollScreenshot = useCallback(async () => {
    try {
      const res = await fetch('/api/studio/screenshot')
      if (!res.ok) return
      const data = await res.json() as { screenshotUrl?: string }
      if (data.screenshotUrl) {
        setStudioStatus((prev) => ({ ...prev, screenshotUrl: data.screenshotUrl }))
      }
    } catch {
      // silently ignore
    }
  }, [])

  // Start polling when user clicks "Connect to Studio"
  const handleStartPolling = useCallback(() => {
    setStudioPolling(true)
    // Immediately poll once
    pollStudioStatus()
  }, [pollStudioStatus])

  // Set up polling interval
  useEffect(() => {
    if (!studioPolling) return
    studioIntervalRef.current = setInterval(() => {
      pollStudioStatus()
      if (studioStatus.connected) pollScreenshot()
    }, 3000)
    return () => {
      if (studioIntervalRef.current) clearInterval(studioIntervalRef.current)
    }
  }, [studioPolling, studioStatus.connected, pollStudioStatus, pollScreenshot])

  // Stop polling if we enter demo mode
  useEffect(() => {
    if (demoMode && studioIntervalRef.current) {
      clearInterval(studioIntervalRef.current)
      studioIntervalRef.current = null
    }
  }, [demoMode])

  // Derived: show connected viewport if actually connected OR in demo mode
  const studioConnected = studioStatus.connected || demoMode

  // Derived: viewport animation state for ViewportPreview
  const viewportState: ViewportState = showBuildOverlay
    ? 'building'
    : sceneBlocks.length > 0
    ? 'complete'
    : 'idle'

  // ── Quick tip toast ───────────────────────────────────────────────────────
  const [showTipToast, setShowTipToast] = useState(false)
  const [tipToastVisible, setTipToastVisible] = useState(false)

  useEffect(() => {
    // Show tip toast 3 seconds after mounting
    const showTimer = setTimeout(() => {
      setShowTipToast(true)
      setTimeout(() => setTipToastVisible(true), 10) // trigger CSS transition
    }, 3000)
    // Auto-hide after 7 seconds total (4 seconds visible)
    const hideTimer = setTimeout(() => {
      setTipToastVisible(false)
      setTimeout(() => setShowTipToast(false), 400)
    }, 7000)
    return () => { clearTimeout(showTimer); clearTimeout(hideTimer) }
  }, [])

  return (
    <>
      {/* Keyframes + global polish */}
      <style>{`
        @keyframes typing-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes block-spawn-smooth {
          0%   { opacity: 0; transform: translateY(-20px) scale(0.7); }
          60%  { opacity: 1; transform: translateY(4px) scale(1.04); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes word-fade-in {
          from { opacity: 0; transform: translateY(3px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes float-particle {
          0%   { transform: translateY(0px) translateX(0px); opacity: 0.4; }
          33%  { transform: translateY(-8px) translateX(4px); opacity: 0.8; }
          66%  { transform: translateY(-4px) translateX(-3px); opacity: 0.5; }
          100% { transform: translateY(0px) translateX(0px); opacity: 0.4; }
        }
        @keyframes timestamp-fade {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(212,175,55,0.4); }
          70% { box-shadow: 0 0 0 6px rgba(212,175,55,0); }
          100% { box-shadow: 0 0 0 0 rgba(212,175,55,0); }
        }
        @keyframes panel-slide-in {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes toast-slide-up {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes grid-pulse {
          0%, 100% { opacity: 0.25; }
          50%       { opacity: 0.45; }
        }
        .forge-scroll::-webkit-scrollbar { width: 4px; height: 4px; }
        .forge-scroll::-webkit-scrollbar-track { background: transparent; }
        .forge-scroll::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.2); border-radius: 99px; }
        .forge-scroll::-webkit-scrollbar-thumb:hover { background: rgba(212,175,55,0.4); }
        .forge-focus:focus-visible { outline: 2px solid #D4AF37; outline-offset: 2px; }
      `}</style>

      <div className="flex h-screen overflow-hidden" style={{ height: '100dvh', background: '#0a0a0a' }}>

        {/* ── Left icon bar (desktop) ─────────────────────────────────────── */}
        <div className="hidden md:flex flex-col items-center gap-1 py-3 px-1 w-12 flex-shrink-0" style={{ background: '#0e0e0e', borderRight: '1px solid #1a1a1a' }}>
          <Link href="/" title="Home" className="w-9 h-9 rounded-lg flex items-center justify-center mb-2 transition-colors text-[#6B7280] hover:text-white hover:bg-white/5">
            <svg className="w-[18px] h-[18px]" viewBox="0 0 20 20" fill="none">
              <path d="M3 9.5L10 3l7 6.5V17a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M7 18v-6h6v6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
          </Link>
          <div className="w-5 h-px bg-white/[0.06] mb-1" />
          {iconBarButtons}
        </div>

        {/* ── Left slide-out panel ────────────────────────────────────────── */}
        {activePanel && (
          <div className="hidden md:flex w-56 flex-col flex-shrink-0 overflow-hidden" style={{ background: '#0e0e0e', borderRight: '1px solid #1a1a1a' }}>
            <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid #1a1a1a' }}>
              <span className="text-sm font-semibold text-white">{PANEL_TITLE[activePanel]}</span>
              <button onClick={() => setActivePanel(null)} className="text-[#6B7280] hover:text-white transition-colors" aria-label="Close panel">
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto forge-scroll min-h-0">
              {activePanel === 'projects' && <ProjectsPanel activeGameId={activeGame?.id ?? null} onSelectGame={(g) => { setActiveGame(g); setActivePanel(null) }} />}
              {activePanel === 'assets'   && <AssetsPanel onInsertAsset={(luau, name) => { submit(`Insert asset "${name}" into the build:\n\`\`\`lua\n${luau}\n\`\`\``) }} />}
              {activePanel === 'dna'      && <DnaPanel />}
              {activePanel === 'tokens'   && <TokensPanel tokensUsed={totalTokens} />}
              {activePanel === 'settings' && <SettingsPanel studioStatus={studioStatus} />}
            </div>
          </div>
        )}

        {/* ── Mobile panel overlay ────────────────────────────────────────── */}
        {activePanel && (
          <div className="md:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={() => setActivePanel(null)}>
            <div className="absolute left-0 right-0 bottom-0 rounded-t-2xl max-h-[70dvh] flex flex-col" style={{ background: '#0e0e0e', borderTop: '1px solid #1a1a1a' }} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid #1a1a1a' }}>
                <span className="text-sm font-semibold text-white">{PANEL_TITLE[activePanel]}</span>
                <button onClick={() => setActivePanel(null)} className="w-9 h-9 flex items-center justify-center text-[#6B7280] hover:text-white transition-colors" aria-label="Close panel">
                  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                    <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto forge-scroll min-h-0">
                {activePanel === 'projects' && <ProjectsPanel activeGameId={activeGame?.id ?? null} onSelectGame={(g) => { setActiveGame(g); setActivePanel(null) }} />}
                {activePanel === 'assets'   && <AssetsPanel onInsertAsset={(luau, name) => { submit(`Insert asset "${name}" into the build:\n\`\`\`lua\n${luau}\n\`\`\``) }} />}
                {activePanel === 'dna'      && <DnaPanel />}
                {activePanel === 'tokens'   && <TokensPanel tokensUsed={totalTokens} />}
                {activePanel === 'settings' && <SettingsPanel studioStatus={studioStatus} />}
              </div>
            </div>
          </div>
        )}

        {/* ── Main content area ───────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* ── Top bar ──────────────────────────────────────────────────── */}
          <div className="flex items-center gap-3 px-4 h-12 flex-shrink-0" style={{ background: '#0e0e0e', borderBottom: '1px solid #1a1a1a' }}>
            {/* Mobile home */}
            <Link href="/" className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center text-[#6B7280] hover:text-white transition-colors" aria-label="Home">
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
                <path d="M3 9.5L10 3l7 6.5V17a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
            </Link>

            {/* Logo — links to dashboard */}
            <Link href="/dashboard" className="hidden md:flex items-center gap-2 group" aria-label="ForjeGames home">
              <div className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-black transition-opacity group-hover:opacity-80" style={{ background: 'linear-gradient(135deg, #D4AF37, #FFB81C)', color: '#030712' }}>F</div>
            </Link>

            {/* Project name */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {editingProjectName ? (
                <input
                  ref={projectNameInputRef}
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  onBlur={() => setEditingProjectName(false)}
                  onKeyDown={(e) => { if (e.key === 'Enter') setEditingProjectName(false) }}
                  maxLength={100}
                  className="text-sm font-semibold text-white bg-transparent border-b border-[#D4AF37] focus:outline-none px-0 py-0 w-40"
                />
              ) : (
                <button onClick={() => setEditingProjectName(true)} className="text-sm font-semibold text-white hover:text-[#D4AF37] transition-colors truncate">
                  {projectName}
                </button>
              )}
              {activeGame && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-white/[0.04] text-[#6B7280] hidden sm:block">{activeGame.genre}</span>
              )}
            </div>

            {/* Connection status */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ background: studioConnected ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${studioConnected ? 'rgba(16,185,129,0.2)' : '#1a1a1a'}` }}>
                <span className={`w-1.5 h-1.5 rounded-full ${studioConnected ? 'bg-[#10B981]' : 'bg-[#6B7280]'}`} style={studioConnected ? { boxShadow: '0 0 4px #10B981' } : {}} />
                <span className="text-[11px] text-[#9CA3AF]">{studioConnected ? 'Studio Connected' : 'Demo Mode'}</span>
              </div>
              <span className="text-[11px] text-[#D4AF37] font-medium">{1000 - totalTokens} tokens</span>
            </div>
          </div>

          {/* ── Two-column content ───────────────────────────────────────── */}
          <div className="flex-1 flex min-h-0 overflow-hidden">

            {/* ── LEFT: Chat ─────────────────────────────────────────────── */}
            <div className="flex flex-col min-h-0 overflow-hidden flex-shrink-0" style={{ width: 'min(400px, 38vw)', borderRight: '1px solid #1a1a1a' }}>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto forge-scroll px-4 py-4 space-y-4 min-h-0">
                {messages.length === 1 && (
                  <EditorEmptyState
                    firstName={editorFirstName}
                    onSelectPrompt={(prompt) => submit(prompt)}
                  />
                )}
                {messages.map((msg) => (
                  <Message
                    key={msg.id}
                    msg={msg}
                    onRetry={msg.isError ? () => submit(lastSubmittedTextRef.current) : undefined}
                  />
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* ── Flat input bar ───────────────────────────────────────── */}
              <div className="flex-shrink-0" style={{ borderTop: '1px solid #1a1a1a' }}>
                {imageFile && (
                  <div className="flex items-center gap-2 px-4 py-2" style={{ borderBottom: '1px solid #1a1a1a' }}>
                    <svg className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0" viewBox="0 0 16 16" fill="none">
                      <rect x="1" y="3" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                    </svg>
                    <span className="text-xs text-[#9CA3AF] flex-1 min-w-0 truncate">{imageFile.name}</span>
                    <button onClick={() => setImageFile(null)} className="text-[#6B7280] hover:text-white transition-colors">
                      <svg className="w-3 h-3" viewBox="0 0 14 14" fill="none">
                        <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                )}

                <div className="flex items-end gap-2 px-3 py-2.5" style={{ background: '#0e0e0e' }}>
                  {/* Left tools */}
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    {supported && (
                      <button
                        onClick={() => listening ? stop() : start()}
                        aria-label={listening ? 'Stop voice input' : 'Start voice input'}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${listening ? 'bg-red-500/20 text-red-400' : 'text-[#6B7280] hover:text-[#D4AF37] hover:bg-[#D4AF37]/10'}`}
                      >
                        {listening ? (
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        ) : (
                          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                            <rect x="5" y="1" width="6" height="9" rx="3" stroke="currentColor" strokeWidth="1.3"/>
                            <path d="M2 8c0 3.31 2.69 5 6 5s6-1.69 6-5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                            <path d="M8 13v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                          </svg>
                        )}
                      </button>
                    )}
                    <button onClick={() => fileInputRef.current?.click()} aria-label="Upload image" className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6B7280] hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all">
                      <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                        <rect x="1" y="3" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                        <circle cx="5.5" cy="7.5" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
                      </svg>
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </div>

                  {/* Textarea */}
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={listening ? 'Listening...' : 'Describe what to build...'}
                    disabled={loading}
                    rows={1}
                    maxLength={4000}
                    className="flex-1 bg-transparent text-sm text-white placeholder-[#808080] focus:outline-none resize-none py-1.5 disabled:opacity-50"
                    style={{ minHeight: '32px', maxHeight: '120px' }}
                  />

                  {/* Character counter */}
                  {input.length > 0 && (
                    <span className={`flex-shrink-0 text-[10px] tabular-nums ${input.length >= 3800 ? 'text-red-400' : 'text-[#4a4a4a]'}`}>
                      {input.length}/4000
                    </span>
                  )}

                  {/* Send */}
                  <button
                    onClick={() => submit(input)}
                    disabled={!input.trim() || loading}
                    aria-label="Send message"
                    className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${input.trim() && !loading ? 'bg-[#D4AF37] text-black hover:bg-[#FFB81C]' : 'bg-white/[0.04] text-[#808080]'}`}
                    style={input.trim() && !loading ? { boxShadow: '0 0 12px rgba(212,175,55,0.3)' } : {}}
                  >
                    {loading ? (
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 14 14" fill="none">
                        <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="8 8"/>
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" viewBox="0 0 14 14" fill="none">
                        <path d="M2 7h10M7 2l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                </div>

                {/* Model + hint row */}
                <div className="flex items-center gap-2 px-3 pb-2">
                  <ModelSelector value={selectedModel} onChange={setSelectedModel} />
                  <div className="flex-1" />
                  <span className="text-[10px] text-[#3a3a3a] hidden lg:block">Shift+Enter for newline</span>
                </div>
              </div>
            </div>

            {/* ── RIGHT: Studio Viewport ──────────────────────────────────── */}
            <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">

              {/* Viewport area */}
              <div className="flex-1 relative min-h-0 overflow-hidden">
                {studioConnected ? (
                  /* Connected — show viewport (with animated preview backdrop during build) */
                  <>
                    {showBuildOverlay && (
                      <ViewportPreview
                        state="building"
                        builtBlockCount={sceneBlocks.length}
                        className="absolute inset-0 z-0"
                      />
                    )}
                    <div className={showBuildOverlay ? 'absolute inset-0 z-10' : 'absolute inset-0'}>
                      <Viewport sceneBlocks={sceneBlocks} />
                    </div>
                  </>
                ) : (
                  /* Not connected — show animated ViewportPreview + connection guide */
                  <div className="absolute inset-0 flex flex-col items-center justify-center px-8">
                    {/* Animated isometric scene background */}
                    <ViewportPreview
                      state={viewportState}
                      builtBlockCount={sceneBlocks.length}
                      className="absolute inset-0"
                    />

                    <div className="relative z-10 max-w-md w-full text-center">
                      {/* Roblox Studio icon */}
                      <div className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.15)' }}>
                        <svg className="w-8 h-8 text-[#D4AF37]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2"/>
                          <path d="M3 9h18"/>
                          <path d="M9 21V9"/>
                        </svg>
                      </div>

                      <h2 className="text-xl font-bold text-white mb-2">Connect Roblox Studio</h2>
                      <p className="text-sm text-[#9CA3AF] mb-8 leading-relaxed">
                        Your game will appear here in real-time once connected. AI commands will build directly in your place.
                      </p>

                      {/* Steps */}
                      <div className="space-y-4 text-left mb-8">
                        {[
                          { step: '1', title: 'Install the ForjeGames Plugin', desc: 'Download from Settings > Plugin, or get it from the Roblox Creator Store', icon: '📥' },
                          { step: '2', title: 'Open your place in Roblox Studio', desc: 'The plugin auto-detects when Studio is running on this machine', icon: '🎮' },
                          { step: '3', title: 'Click "Connect" in the plugin toolbar', desc: 'The viewport will show your live game — start building with AI', icon: '🔗' },
                        ].map((s) => (
                          <div key={s.step} className="flex items-start gap-3 p-3 rounded-xl transition-colors" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid #1a1a1a' }}>
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.15)' }}>
                              {s.icon}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-white">{s.title}</p>
                              <p className="text-xs text-[#6B7280] mt-0.5">{s.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Connect button */}
                      <button
                        onClick={() => setDemoMode(true)}
                        className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5"
                        style={{ background: 'linear-gradient(135deg, #D4AF37, #FFB81C)', color: '#030712', boxShadow: '0 0 24px rgba(212,175,55,0.2)' }}
                      >
                        Connect to Studio
                      </button>

                      <button
                        onClick={() => setDemoMode(true)}
                        className="mt-3 text-xs text-[#6B7280] hover:text-[#D4AF37] transition-colors"
                      >
                        Skip — use demo viewport instead
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* ── Mobile bottom icon bar ───────────────────────────────────── */}
          <div className="md:hidden flex items-center justify-around px-2 py-1 flex-shrink-0" style={{ background: '#0e0e0e', borderTop: '1px solid #1a1a1a', paddingBottom: 'env(safe-area-inset-bottom, 4px)' }}>
            {iconBarButtons}
          </div>
        </div>
      </div>

      {/* ── First-run editor tour ─────────────────────────────────────────── */}
      {showTour && <EditorTour onDone={dismissTour} />}

      {/* ── Editor-scoped command palette + shortcuts ─────────────────────── */}
      <CommandPalette
        isOpen={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onNewProject={() => {
          setPaletteOpen(false)
          setActivePanel(null)
          submit('Start a new project')
        }}
        onShowShortcuts={() => {
          setPaletteOpen(false)
          setShortcutsOpen(true)
        }}
      />
      <ShortcutsDialog
        isOpen={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />

      {/* ── Quick tip toast ────────────────────────────────────────────────── */}
      {showTipToast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto"
          style={{
            opacity: tipToastVisible ? 1 : 0,
            transform: tipToastVisible ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(12px)',
            transition: 'opacity 0.35s ease-out, transform 0.35s ease-out',
          }}
        >
          <div
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm"
            style={{
              background: 'rgba(14,14,14,0.95)',
              border: '1px solid rgba(212,175,55,0.3)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 16px rgba(212,175,55,0.1)',
              backdropFilter: 'blur(12px)',
              color: '#D1D5DB',
            }}
          >
            <span
              className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 text-[11px]"
              style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.2)' }}
            >
              💡
            </span>
            <span className="text-[12px]">
              <span className="text-[#FFB81C] font-semibold">Tip:</span>
              {' '}Press{' '}
              <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#E5E7EB' }}>
                Ctrl+Enter
              </kbd>
              {' '}to send, or click the{' '}
              <svg className="inline w-3 h-3 mx-0.5 text-[#D4AF37]" viewBox="0 0 16 16" fill="none">
                <rect x="5" y="1" width="6" height="9" rx="3" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M2 8c0 3.31 2.69 5 6 5s6-1.69 6-5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              {' '}mic for voice input
            </span>
            <button
              onClick={() => { setTipToastVisible(false); setTimeout(() => setShowTipToast(false), 400) }}
              className="text-gray-600 hover:text-gray-300 transition-colors flex-shrink-0 ml-1"
              aria-label="Dismiss tip"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none">
                <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  )
}
