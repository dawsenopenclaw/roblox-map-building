'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

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
          <svg className="w-3.5 h-3.5 text-gray-300" viewBox="0 0 14 14" fill="none">
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
          <span className="text-[10px] text-blue-400/70 pl-1 flex items-center gap-1">
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

// Static scene objects always present in the mock isometric scene
const SCENE_BASE_OBJECTS = [
  { id: 'b1', type: 'building', color: '#4A7CB5', darkColor: '#2E5A8E', topColor: '#5B8EC7', x: 52, y: 42, w: 60, h: 44 },
  { id: 'b2', type: 'building', color: '#6B7280', darkColor: '#4B5563', topColor: '#9CA3AF', x: 36, y: 55, w: 44, h: 32 },
  { id: 'b3', type: 'building', color: '#8B5E3C', darkColor: '#6B4423', topColor: '#A8784F', x: 64, y: 60, w: 36, h: 24 },
  { id: 'b4', type: 'building', color: '#374151', darkColor: '#1F2937', topColor: '#6B7280', x: 26, y: 40, w: 28, h: 56 },
  { id: 't1', type: 'tree', x: 20, y: 35, size: 18 },
  { id: 't2', type: 'tree', x: 74, y: 38, size: 14 },
  { id: 't3', type: 'tree', x: 80, y: 55, size: 16 },
  { id: 't4', type: 'tree', x: 16, y: 62, size: 12 },
  { id: 't5', type: 'tree', x: 72, y: 48, size: 10 },
  { id: 't6', type: 'tree', x: 24, y: 50, size: 13 },
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
  color, darkColor, topColor, x, y, w, h, spawned,
}: {
  color: string; darkColor: string; topColor: string
  x: number; y: number; w: number; h: number; spawned: boolean
}) {
  const halfW = w / 2

  return (
    <div
      className="absolute"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: `${w}px`,
        animation: spawned ? 'block-spawn 0.55s cubic-bezier(0.22,1,0.36,1) forwards' : 'none',
        opacity: spawned ? 0 : 1,
      }}
    >
      {/* Top face */}
      <div style={{
        width: `${w}px`,
        height: `${halfW * 0.5}px`,
        background: topColor,
        transform: 'skewX(-30deg) scaleY(0.6)',
        transformOrigin: 'bottom left',
        position: 'relative',
        zIndex: 3,
        boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.3)',
      }} />
      {/* Front-left face */}
      <div style={{
        width: `${halfW}px`,
        height: `${h}px`,
        background: color,
        position: 'absolute',
        top: `${halfW * 0.5 * 0.6 - 2}px`,
        left: 0,
        transform: 'skewY(15deg)',
        transformOrigin: 'top left',
        zIndex: 2,
        boxShadow: 'inset -2px 0 6px rgba(0,0,0,0.2)',
      }} />
      {/* Front-right face */}
      <div style={{
        width: `${halfW}px`,
        height: `${h * 0.85}px`,
        background: darkColor,
        position: 'absolute',
        top: `${halfW * 0.5 * 0.6 - 2}px`,
        left: `${halfW}px`,
        transform: 'skewY(-15deg)',
        transformOrigin: 'top right',
        zIndex: 2,
      }} />
    </div>
  )
}

function IsometricTree({ x, y, size }: { x: number; y: number; size: number }) {
  return (
    <div className="absolute pointer-events-none" style={{ left: `${x}%`, top: `${y}%` }}>
      <div style={{
        width: `${size * 0.25}px`,
        height: `${size * 0.4}px`,
        background: '#6B4423',
        margin: '0 auto',
        position: 'relative',
        zIndex: 1,
      }} />
      <div style={{
        width: 0,
        height: 0,
        borderLeft: `${size * 0.6}px solid transparent`,
        borderRight: `${size * 0.6}px solid transparent`,
        borderBottom: `${size * 0.9}px solid #16A34A`,
        position: 'absolute',
        top: `-${size * 0.85}px`,
        left: `-${size * 0.475}px`,
        zIndex: 2,
        filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.4))',
      }} />
      <div style={{
        width: 0,
        height: 0,
        borderLeft: `${size * 0.45}px solid transparent`,
        borderRight: `${size * 0.45}px solid transparent`,
        borderBottom: `${size * 0.7}px solid #22C55E`,
        position: 'absolute',
        top: `-${size * 1.1}px`,
        left: `-${size * 0.35}px`,
        zIndex: 3,
      }} />
    </div>
  )
}

function Viewport({ sceneBlocks }: { sceneBlocks: SceneBlock[] }) {
  const [activeView, setActiveView] = useState<'Perspective' | 'Top' | 'Front' | 'Side'>('Perspective')
  const [showGrid, setShowGrid] = useState(true)

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

      {/* TOP-LEFT: connection status */}
      <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-auto">
        <div
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px]"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-gray-500" />
          <span className="text-gray-300 font-medium">Studio Not Connected</span>
        </div>
        <button
          className="text-[10px] text-[#FFB81C]/70 hover:text-[#FFB81C] transition-colors text-left px-1"
          style={{ lineHeight: '1' }}
        >
          Connect Studio &rarr;
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
                color: activeView === mode ? '#FFB81C' : '#6B7280',
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
              color: showGrid ? '#FFB81C' : '#6B7280',
            }}
          >
            Show Grid
          </button>
          <div
            className="flex gap-0.5 rounded-lg overflow-hidden"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <button className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-white transition-colors text-sm font-bold">−</button>
            <div className="w-px self-stretch bg-white/8" />
            <button className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-white transition-colors text-sm font-bold">+</button>
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
        {[
          { label: 'Pan',   icon: 'M5 1v10M1 5h10' },
          { label: 'Orbit', icon: 'M6 1a5 5 0 100 10A5 5 0 006 1zM1 6h10' },
          { label: 'Zoom',  icon: 'M5 2a3 3 0 100 6A3 3 0 005 2zM9 9l2 2' },
          { label: 'Reset', icon: 'M2 6a4 4 0 014-4 4 4 0 014 4M10 2l2 2-2 2' },
        ].map(({ label, icon }) => (
          <button
            key={label}
            title={label}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-300 hover:bg-white/8 transition-colors"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 12 12" fill="none">
              <path d={icon} stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        ))}
        <div className="w-px h-4 bg-white/10 mx-0.5" />
        <button
          title="Fullscreen"
          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-300 hover:bg-white/8 transition-colors"
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
    Obby: '#10B981', Sandbox: '#6B7280',
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
                  className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden"
                  style={{
                    background: isActive
                      ? 'linear-gradient(135deg, rgba(255,184,28,0.2) 0%, rgba(255,107,53,0.15) 100%)'
                      : 'rgba(255,255,255,0.05)',
                    border: isActive ? '1px solid rgba(255,184,28,0.3)' : '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  {game.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={game.thumbnailUrl} alt={game.name} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <svg className="w-5 h-5" style={{ color: isActive ? '#FFB81C' : '#4B5563' }} viewBox="0 0 20 20" fill="none">
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
                      style={{ backgroundColor: GENRE_COLORS[game.genre] ?? '#6B7280' }}
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

const FALLBACK_ASSETS: Array<{ name: string; price: string; category: string }> = [
  { name: 'Castle Model',  price: 'Free',   category: 'Models'  },
  { name: 'Tree Pack',     price: '$2.99',  category: 'Models'  },
  { name: 'UI Kit',        price: '$4.99',  category: 'Plugins' },
  { name: 'NPC Bundle',    price: '$9.99',  category: 'Models'  },
  { name: 'Sound Pack',    price: 'Free',   category: 'Audio'   },
  { name: 'Vehicle Set',   price: '$7.99',  category: 'Models'  },
]

function AssetsPanel() {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('All')

  const filtered = FALLBACK_ASSETS.filter((a) => {
    const matchesSearch = !query.trim() || a.name.toLowerCase().includes(query.toLowerCase())
    const matchesCat = activeCategory === 'All' || a.category === activeCategory
    return matchesSearch && matchesCat
  })

  return (
    <div className="p-4 space-y-3">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 16 16" fill="none">
          <circle cx="7" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M10.5 10.5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search marketplace..."
          className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-blue-400/50"
        />
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-1">
        {ASSET_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={[
              'px-2.5 py-1 rounded-full text-[10px] font-semibold transition-colors',
              activeCategory === cat
                ? 'bg-[#FFB81C] text-black'
                : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-gray-200 border border-white/10',
            ].join(' ')}
          >
            {cat}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-xs text-gray-500 text-center py-6">No assets found</p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {filtered.map(({ name, price }) => (
            <div key={name} className="bg-white/[0.03] border border-white/8 hover:border-white/18 rounded-lg p-2.5 transition-colors group">
              <div className="w-full h-10 rounded-md bg-white/5 mb-2 flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-700" viewBox="0 0 20 20" fill="none">
                  <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M7 10l2 2 4-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-[11px] text-gray-300 font-medium leading-tight">{name}</p>
              <div className="flex items-center justify-between mt-1.5">
                <span className={[
                  'text-[10px] font-bold',
                  price === 'Free' ? 'text-emerald-400' : 'text-[#FFB81C]',
                ].join(' ')}>{price}</span>
                <button className="text-[9px] font-semibold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 px-1.5 py-0.5 rounded transition-colors">
                  Add
                </button>
              </div>
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
  const [selectedExample, setSelectedExample] = useState<DnaExample | null>(null)

  const handleScan = () => {
    if (!url.trim() || scanning) return
    setScanning(true)
    setSelectedExample(null)
    setTimeout(() => {
      setScanning(false)
      setSelectedExample({ name: 'Custom Game', score: 76, players: 'N/A', rating: 'N/A', genre: 'Unknown' })
    }, 1400)
  }

  const active = selectedExample

  return (
    <div className="p-4 space-y-4">
      <p className="text-[11px] text-gray-400 leading-relaxed font-medium">Analyze any Roblox game</p>

      <div className="flex gap-2">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleScan()}
          placeholder="https://roblox.com/games/..."
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-blue-400/50"
        />
        <button
          onClick={handleScan}
          disabled={!url.trim() || scanning}
          className="bg-[#FFB81C] hover:bg-[#E6A519] disabled:opacity-40 disabled:cursor-not-allowed text-black text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
        >
          {scanning ? '...' : 'Scan'}
        </button>
      </div>

      {/* Example scans */}
      <div>
        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mb-2">Example Scans</p>
        <div className="space-y-1.5">
          {DNA_EXAMPLES.map((ex) => (
            <button
              key={ex.name}
              onClick={() => setSelectedExample(selectedExample?.name === ex.name ? null : ex)}
              className={[
                'w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-left transition-colors',
                selectedExample?.name === ex.name
                  ? 'bg-[#FFB81C]/10 border-[#FFB81C]/30'
                  : 'bg-white/[0.03] border-white/8 hover:bg-white/6 hover:border-white/15',
              ].join(' ')}
            >
              <div>
                <p className="text-xs text-gray-200 font-medium">{ex.name}</p>
                <p className="text-[10px] text-gray-500">{ex.genre}</p>
              </div>
              <div className="text-right">
                <p className={[
                  'text-sm font-bold',
                  ex.score >= 90 ? 'text-emerald-400' : 'text-[#FFB81C]',
                ].join(' ')}>{ex.score}/100</p>
                <p className="text-[10px] text-gray-500">Score</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Stats for selected */}
      {active && (
        <div className="bg-white/[0.03] border border-white/10 rounded-lg p-3 space-y-2">
          <p className="text-xs text-gray-300 font-semibold">{active.name}</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Score',   value: `${active.score}/100` },
              { label: 'Players', value: active.players },
              { label: 'Rating',  value: active.rating },
            ].map(({ label, value }) => (
              <div key={label} className="text-center bg-white/5 rounded-md py-1.5">
                <p className="text-[11px] text-blue-400 font-bold">{value}</p>
                <p className="text-[9px] text-gray-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <Link href="/game-dna" className="block text-center text-[11px] text-[#FFB81C]/70 hover:text-[#FFB81C] transition-colors">
        View full DNA reports &rarr;
      </Link>
    </div>
  )
}

function TokensPanel({ tokensUsed }: { tokensUsed: number }) {
  const TOKEN_LIMIT = 1000
  const balance = 1000
  const remaining = Math.max(0, balance - tokensUsed)
  const usedPct = Math.min(100, (tokensUsed / TOKEN_LIMIT) * 100)
  const barColor = usedPct > 80 ? '#ef4444' : usedPct > 60 ? '#f97316' : '#60A5FA'

  return (
    <div className="p-4 space-y-4">
      {/* Balance display */}
      <div className="bg-blue-400/8 border border-blue-400/20 rounded-xl p-4 text-center">
        <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Balance</p>
        <p className="text-3xl font-bold text-blue-400">{remaining.toLocaleString()}</p>
        <p className="text-xs text-gray-400 mt-1">tokens</p>
      </div>

      {/* Usage bar */}
      <div>
        <div className="flex justify-between mb-1.5">
          <span className="text-[10px] text-gray-500">Used this session</span>
          <span className="text-[10px] text-blue-400">{tokensUsed} / {TOKEN_LIMIT.toLocaleString()}</span>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${usedPct}%`, backgroundColor: barColor }}
          />
        </div>
      </div>

      <Link href="/pricing" className="flex items-center justify-center gap-2 w-full bg-[#FFB81C] hover:bg-[#E6A519] text-black text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors">
        Buy More
      </Link>

      {/* Recent usage */}
      <div>
        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mb-2">Recent Usage</p>
        <div className="space-y-1">
          {RECENT_USAGE.map(({ cmd, tokens }) => (
            <div key={cmd} className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-white/4 transition-colors">
              <p className="text-[11px] text-gray-300 truncate flex-1 mr-2">{cmd}</p>
              <span className="text-[10px] text-blue-400/70 font-medium flex-shrink-0">{tokens}t</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SettingsPanel() {
  return (
    <div className="p-4 space-y-3">
      {/* Inline setting row */}
      <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/8">
        <span className="text-xs text-gray-300">Theme</span>
        <span className="text-xs font-semibold text-gray-300 bg-white/8 px-2 py-0.5 rounded-md">Dark</span>
      </div>

      {/* Link rows */}
      <div className="space-y-1">
        {[
          { label: 'API Keys', sub: 'Configure',   href: '/settings/api-keys' },
          { label: 'Account',  sub: 'Manage',       href: '/settings' },
          { label: 'Billing',  sub: 'View',         href: '/billing' },
          { label: 'Help',     sub: 'Docs',         href: '/docs' },
        ].map(({ label, sub, href }) => (
          <Link
            key={label}
            href={href}
            className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/8 transition-colors group"
          >
            <span className="text-xs text-gray-300 group-hover:text-gray-200 transition-colors">{label}</span>
            <div className="flex items-center gap-1 text-[#FFB81C]/60 group-hover:text-[#FFB81C] transition-colors">
              <span className="text-[11px] font-medium">{sub}</span>
              <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none">
                <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </Link>
        ))}
      </div>

      <div className="pt-1 border-t border-white/6">
        <p className="text-[10px] text-gray-700 text-center">ForjeAI v0.1.0</p>
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
        'w-10 h-10 rounded-xl flex items-center justify-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FFB81C]',
        active ? 'bg-[#FFB81C]/15 text-[#FFB81C]' : 'text-gray-400 hover:text-gray-300 hover:bg-white/5',
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
  const [sceneBlocks, setSceneBlocks] = useState<SceneBlock[]>([])
  const [totalTokens, setTotalTokens] = useState(0)
  const [selectedModel, setSelectedModel] = useState<ModelId>('claude-4')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [activeGame, setActiveGame] = useState<RobloxGame | null>(DEMO_GAMES[0])

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
            body: JSON.stringify({
              message: trimmed,
              model: selectedModel,
              gameContext: activeGame
                ? { id: activeGame.id, name: activeGame.name, genre: activeGame.genre }
                : null,
            }),
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
    [loading, selectedModel, activeGame],
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
      {/* Keyframes */}
      <style>{`
        @keyframes typing-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
        @keyframes block-spawn {
          0%   { opacity: 0; transform: translateY(-20px) scale(0.7); }
          60%  { opacity: 1; transform: translateY(4px) scale(1.04); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <div className="flex h-screen bg-[#06080F] overflow-hidden" style={{ height: '100dvh' }}>

        {/* ── Left icon bar ──────────────────────────────────────────────── */}
        <div className="hidden md:flex flex-col items-center gap-1 py-3 px-1 bg-[#090C1A] border-r border-white/6 w-14 flex-shrink-0">
          <Link href="/" title="Home" className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-300 hover:bg-white/5 transition-colors mb-2">
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
              <button onClick={() => setActivePanel(null)} className="text-gray-500 hover:text-gray-300 transition-colors" aria-label="Close panel">
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0">
              {activePanel === 'projects' && <ProjectsPanel activeGameId={activeGame?.id ?? null} onSelectGame={(g) => { setActiveGame(g); setActivePanel(null) }} />}
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
                <button onClick={() => setActivePanel(null)} className="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-gray-300 transition-colors" aria-label="Close panel">
                  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                    <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto min-h-0">
                {activePanel === 'projects' && <ProjectsPanel activeGameId={activeGame?.id ?? null} onSelectGame={(g) => { setActiveGame(g); setActivePanel(null) }} />}
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
            <Link href="/" className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-300 hover:bg-white/5 transition-colors" aria-label="Home">
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
                <path d="M3 9.5L10 3l7 6.5V17a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M7 18v-6h6v6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
            </Link>
            <span className="text-sm font-semibold text-white flex-1">AI Editor</span>
            <span className="text-[10px] text-blue-400">{totalTokens} tokens</span>
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
                className="flex-shrink-0"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ background: 'radial-gradient(circle, #FFB81C 30%, #FFB81C44 100%)', boxShadow: '0 0 6px #FFB81C80' }}
                    />
                    <span className="text-xs font-semibold text-gray-300 uppercase tracking-widest">Build Chat</span>
                  </div>
                  <span className="text-[10px] text-blue-400 hidden md:block">{totalTokens} tokens used</span>
                </div>
                {activeGame && (
                  <div
                    className="flex items-center gap-2 mx-4 mb-3 px-3 py-1.5 rounded-lg"
                    style={{ background: 'rgba(255,184,28,0.06)', border: '1px solid rgba(255,184,28,0.18)' }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-[#FFB81C] flex-shrink-0" style={{ boxShadow: '0 0 4px #FFB81C' }} />
                    <span className="text-[11px] text-[#FFB81C]/80 font-medium truncate">
                      Working on: <span className="text-[#FFB81C] font-semibold">{activeGame.name}</span>
                    </span>
                    <span className="ml-auto text-[10px] text-gray-600 flex-shrink-0">{activeGame.genre}</span>
                  </div>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
                {/* Quick action chips — visible when empty */}
                {messages.length === 1 && (
                  <div className="space-y-3">
                    <p className="text-[11px] text-gray-500 uppercase tracking-wider">Quick start</p>
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
                          <span className="text-xs text-gray-300 font-medium">{label}</span>
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
                    <span className="text-xs text-gray-300 flex-1 min-w-0 truncate">{imageFile.name}</span>
                    <button onClick={() => setImageFile(null)} className="text-gray-500 hover:text-gray-300">
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
                              : 'text-gray-500 hover:text-[#FFB81C] hover:bg-[#FFB81C]/10',
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
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-[#FFB81C] hover:bg-[#FFB81C]/10 transition-all"
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
                          : 'bg-white/5 text-gray-500 cursor-not-allowed',
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
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/8 border border-white/8 hover:border-white/15 text-xs text-gray-400 hover:text-gray-300 transition-all"
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
                  <span className="text-[11px] text-gray-500">
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
              <Viewport sceneBlocks={sceneBlocks} />
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
