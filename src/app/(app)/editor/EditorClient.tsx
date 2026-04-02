'use client'

import React, { useState, useRef, useCallback, useEffect, memo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useToast } from '@/components/ui/toast-notification'
import { useUser } from '@clerk/nextjs'
import dynamic from 'next/dynamic'

const CommandPalette = dynamic(
  () => import('@/components/CommandPalette').then((m) => m.CommandPalette),
  { ssr: false }
)
const ShortcutsDialog = dynamic(
  () => import('@/components/ShortcutsDialog').then((m) => m.ShortcutsDialog),
  { ssr: false }
)
const MarketplacePanel = dynamic(
  () => import('./panels/MarketplacePanel'),
  { ssr: false }
)
const DnaPanel = dynamic(
  () => import('./panels/DnaPanel'),
  { ssr: false }
)
const TokensPanel = dynamic(
  () => import('./panels/TokensPanel'),
  { ssr: false }
)
const SettingsPanel = dynamic(
  () => import('./panels/SettingsPanel'),
  { ssr: false }
)
const TokenGateCard = dynamic(
  () => import('./panels/TokenGateCard'),
  { ssr: false }
)
const ApiKeysModal = dynamic(
  () => import('./panels/ApiKeysModal'),
  { ssr: false }
)
import { EditorTour, useEditorTour } from './EditorTour'
import { EditorEmptyState } from './EditorEmptyState'
import { ViewportPreview } from '@/components/editor/ViewportPreview'
import type { ViewportState } from '@/components/editor/ViewportPreview'
import { PropertiesPanel } from '@/components/editor/PropertiesPanel'
import type { SceneObject } from '@/components/editor/PropertiesPanel'
import { ObjectList } from '@/components/editor/ObjectList'
import { Toolbar } from '@/components/editor/Toolbar'
import type { ToolMode } from '@/components/editor/Toolbar'
import { EditorIntegrations, EditorVoiceButton } from '@/components/editor/EditorIntegrations'
import { BuildHistory, useBuildHistory } from '@/components/editor/BuildHistory'
import { OnboardingOverlay, useOnboarding } from '@/components/editor/OnboardingOverlay'
import { AIContextPanel } from '@/components/editor/AIContextPanel'
import { CodePreview } from '@/components/editor/CodePreview'
import { useEditorSettings, FONT_SIZE_MAP, THEME_BG_MAP } from './hooks/useEditorSettings'
import { getContextualEnhancements } from '@/lib/ai/build-enhancer'
import type { Enhancement } from '@/lib/ai/build-enhancer'
import { parseLuauCode, extractLuauBlocks } from '@/lib/luau-parser'
import type { ParsedPart } from '@/lib/luau-parser'
const Viewport3D = dynamic(
  () => import('@/components/editor/Viewport3D').then((m) => m.Viewport3D),
  { ssr: false }
)

// ─── Types ─────────────────────────────────────────────────────────────────────

type MessageRole = 'user' | 'assistant' | 'system' | 'status' | 'upgrade' | 'signup'

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

interface BuildPlan {
  totalSteps: number
  currentStep: number
  stepLabel: string
  nextStepPrompt: string | null
  autoNext: boolean
  planLines: string[]
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
  /** Present when this message is part of a multi-step build sequence */
  buildPlan?: BuildPlan
}

type ModelId =
  | 'claude-4'
  | 'claude-3-5'
  | 'gemini-2'
  | 'gpt-4o'
  | 'grok-3'
  | 'custom-anthropic'
  | 'custom-openai'
  | 'custom-google'

interface ModelOption {
  id: ModelId
  label: string
  provider: string
  color: string
  badge?: string
}

type PanelId = 'projects' | 'assets' | 'dna' | 'tokens' | 'settings' | 'history' | null

// ─── Studio connection types ───────────────────────────────────────────────────

interface StudioStatus {
  connected: boolean
  placeName?: string
  placeId?: number
  screenshotUrl?: string
  lastActivity?: string
  sessionId?: string
  /** JWT token returned by /api/studio/auth — used to authenticate execute/sync calls */
  jwt?: string
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
  { id: 'claude-4',          label: 'Claude 4',           provider: 'Anthropic',     color: '#CC785C', badge: 'BEST' },
  { id: 'claude-3-5',        label: 'Claude 3.5',         provider: 'Anthropic',     color: '#CC785C' },
  { id: 'gemini-2',          label: 'Gemini 2.0',         provider: 'Google',        color: '#4285F4' },
  { id: 'gpt-4o',            label: 'GPT-4o',             provider: 'OpenAI',        color: '#10A37F' },
  { id: 'grok-3',            label: 'Grok 3',             provider: 'xAI',           color: '#8B5CF6' },
  { id: 'custom-anthropic',  label: 'My Anthropic Key',   provider: 'Custom',        color: '#D4AF37', badge: 'BYO' },
  { id: 'custom-openai',     label: 'My OpenAI Key',      provider: 'Custom',        color: '#D4AF37', badge: 'BYO' },
  { id: 'custom-google',     label: 'My Google Key',      provider: 'Custom',        color: '#D4AF37', badge: 'BYO' },
]

const QUICK_ACTIONS = [
  { label: 'Castle',       icon: '🏰', prompt: 'Build a medieval castle with towers and a moat' },
  { label: 'Forest',       icon: '🌲', prompt: 'Generate a dense forest biome with trees and rocks' },
  { label: 'NPC',          icon: '🧑', prompt: 'Create an NPC with patrol AI and dialogue' },
  { label: 'City Block',   icon: '🏙️', prompt: 'Build a city district with roads and buildings' },
  { label: '3D Mesh',      icon: '💎', prompt: 'Generate a 3D mesh: medieval stone tower, Roblox game asset' },
  { label: 'Dungeon',      icon: '⚔️', prompt: 'Generate a dungeon with corridors and traps' },
]

// ─── Slash commands ────────────────────────────────────────────────────────────

interface SlashCommand {
  command: string
  description: string
  placeholder?: string
  /** If true, no text argument needed — this command fires immediately */
  immediate?: boolean
}

const SLASH_COMMANDS: SlashCommand[] = [
  { command: '/build',    description: 'Force build mode',            placeholder: 'describe what to build...' },
  { command: '/script',   description: 'Force script generation',     placeholder: 'describe the script...' },
  { command: '/terrain',  description: 'Terrain generation',          placeholder: 'describe the terrain...' },
  { command: '/ui',       description: 'UI / GUI generation',         placeholder: 'describe the UI...' },
  { command: '/optimize', description: 'Scan workspace & optimise',  immediate: true },
  { command: '/undo',     description: 'Undo last build in Studio',   immediate: true },
  { command: '/export',   description: 'Export code from last build', immediate: true },
  { command: '/clear',    description: 'Clear conversation',          immediate: true },
  { command: '/help',     description: 'Show all commands',           immediate: true },
]

// ─── Power-user quick-action pills ─────────────────────────────────────────────

interface PowerQuickAction {
  label: string
  prefix: string
}

const POWER_QUICK_ACTIONS: PowerQuickAction[] = [
  { label: 'Build',    prefix: '/build '   },
  { label: 'Script',   prefix: '/script '  },
  { label: 'Terrain',  prefix: '/terrain ' },
  { label: 'UI',       prefix: '/ui '      },
  { label: 'Optimize', prefix: '/optimize' },
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
  history:  'Build History',
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

// ─── Studio Connect — inline copy buttons ──────────────────────────────────────

const LOADSTRING_CMD = 'loadstring(game:HttpGet("https://forjegames.com/api/studio/plugin"))()'

function LoadstringCopyButton() {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    void navigator.clipboard.writeText(LOADSTRING_CMD).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button
      onClick={handleCopy}
      className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-all"
      style={{
        background: copied ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${copied ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.08)'}`,
        color: copied ? '#D4AF37' : '#71717a',
      }}
      title="Copy loadstring"
    >
      {copied ? (
        <>
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5"/>
          </svg>
          Copied
        </>
      ) : (
        <>
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
          Copy
        </>
      )}
    </button>
  )
}

function CodeCopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    void navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button
      onClick={handleCopy}
      className="flex-shrink-0 flex items-center justify-center w-9 h-9 md:w-7 md:h-7 rounded transition-all"
      style={{
        background: copied ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${copied ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.1)'}`,
        color: copied ? '#D4AF37' : '#52525b',
      }}
      title="Copy code"
    >
      {copied ? (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6 9 17l-5-5"/>
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
      )}
    </button>
  )
}

// ─── Download Tab ──────────────────────────────────────────────────────────────

function DownloadTab({ pluginFolder }: { pluginFolder: string }) {
  const [step, setStep] = useState<'download' | 'copied' | 'done'>('download')
  const [folderCopied, setFolderCopied] = useState(false)

  const copyFolder = () => {
    void navigator.clipboard.writeText(pluginFolder).then(() => {
      setFolderCopied(true)
      setTimeout(() => setFolderCopied(false), 2000)
    })
  }

  return (
    <div className="space-y-3">
      {/* Step 1: Download */}
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5"
          style={{ background: step !== 'download' ? '#10B981' : '#D4AF37', color: '#000' }}>
          {step !== 'download' ? '✓' : '1'}
        </span>
        <div className="flex-1">
          <p className="text-[12px] font-medium text-zinc-200 mb-2">Download the plugin</p>
          <a
            href="/api/studio/plugin"
            download="ForjeGames.rbxm"
            onClick={() => setTimeout(() => setStep('copied'), 500)}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-bold transition-all hover:brightness-110 active:scale-[0.98]"
            style={{ background: '#D4AF37', color: '#030712' }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Download ForjeGames.rbxm
          </a>
        </div>
      </div>

      {/* Step 2: Move to folder */}
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5"
          style={{ background: step === 'done' ? '#10B981' : 'rgba(255,255,255,0.08)', color: step === 'done' ? '#000' : '#71717a' }}>
          {step === 'done' ? '✓' : '2'}
        </span>
        <div className="flex-1">
          <p className="text-[12px] font-medium text-zinc-200 mb-1.5">Move it to your Plugins folder</p>
          <p className="text-[10px] text-zinc-500 mb-2">Open this folder and drag the file in:</p>
          <button
            onClick={copyFolder}
            className="w-full flex items-center gap-2 rounded-lg px-3 py-2.5 text-left transition-all"
            style={{
              background: folderCopied ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${folderCopied ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.08)'}`,
            }}
          >
            <code className="flex-1 text-[11px] break-all" style={{ fontFamily: '"JetBrains Mono", monospace', color: folderCopied ? '#D4AF37' : '#a3a3a3' }}>
              {pluginFolder}
            </code>
            <span className="flex-shrink-0 text-[10px] font-medium px-2 py-1 rounded"
              style={{ background: folderCopied ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.06)', color: folderCopied ? '#D4AF37' : '#71717a' }}>
              {folderCopied ? 'Copied!' : 'Copy'}
            </span>
          </button>
          <p className="text-[10px] text-zinc-600 mt-1.5">
            Tip: Press <kbd className="px-1 py-0.5 rounded text-zinc-400" style={{ background: 'rgba(255,255,255,0.06)', fontSize: 9 }}>Win+R</kbd>, paste the path, hit Enter
          </p>
        </div>
      </div>

      {/* Step 3: Restart */}
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5"
          style={{ background: 'rgba(255,255,255,0.08)', color: '#71717a' }}>3</span>
        <div className="flex-1">
          <p className="text-[12px] font-medium text-zinc-200 mb-1">Restart Studio</p>
          <p className="text-[10px] text-zinc-500">Close Studio completely, then reopen it. Click &quot;ForjeGames&quot; in the toolbar.</p>
          {step === 'copied' && (
            <button
              onClick={() => setStep('done')}
              className="mt-2 text-[10px] font-medium px-3 py-1.5 rounded-md transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', color: '#a1a1aa', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              Done — I restarted Studio ✓
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Setup Panel (tabbed install methods) ──────────────────────────────────────

type InstallTab = 'download' | 'command' | 'manual'

function SetupPanel({ connectFlow, connectCode, connectTimer, onDemoMode, onConfirmConnected, onGenerateCode }: {
  connectFlow: 'idle' | 'code'
  connectCode: string
  connectTimer: number
  onDemoMode: () => void
  onConfirmConnected: () => void
  onGenerateCode: () => void
}) {
  const [tab, setTab] = useState<InstallTab>('download')
  const PLUGIN_FOLDER = (typeof navigator !== 'undefined' && navigator.userAgent.includes('Mac'))
    ? '~/Documents/Roblox/Plugins/'
    : '%LOCALAPPDATA%\\Roblox\\Plugins\\'

  const tabs: { id: InstallTab; label: string; icon: string }[] = [
    { id: 'download', label: 'Download', icon: '↓' },
    { id: 'command', label: 'Command Bar', icon: '>' },
    { id: 'manual', label: 'Manual', icon: '⚙' },
  ]

  return (
    <>
      {/* Header */}
      <h2 className="text-base font-semibold text-zinc-100 mb-1">Connect Roblox Studio</h2>
      <p className="text-[11px] text-zinc-500 mb-4">Choose how to install the plugin:</p>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 p-0.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-medium transition-all"
            style={{
              background: tab === t.id ? 'rgba(212,175,55,0.12)' : 'transparent',
              color: tab === t.id ? '#D4AF37' : '#71717a',
              border: tab === t.id ? '1px solid rgba(212,175,55,0.25)' : '1px solid transparent',
            }}
          >
            <span style={{ fontSize: 13 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="text-left mb-4">
        {tab === 'download' && (
          <DownloadTab pluginFolder={PLUGIN_FOLDER} />
        )}

        {tab === 'command' && (
          <div className="space-y-3">
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              <strong className="text-zinc-200">Quick method.</strong> Paste this in Studio&apos;s Command Bar (View → Command Bar).
            </p>
            <div className="rounded-lg px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-start gap-2">
                <code className="flex-1 text-[11px] leading-relaxed break-all" style={{ fontFamily: '"JetBrains Mono", monospace', color: '#a3a3a3' }}>
                  <span style={{ color: '#D4AF37' }}>loadstring</span>
                  {'(game:HttpGet("https://forjegames.com/api/studio/plugin"))()'}
                </code>
                <LoadstringCopyButton />
              </div>
            </div>
            <div className="rounded-lg px-3 py-2 flex items-start gap-2" style={{ background: 'rgba(255,180,0,0.04)', border: '1px solid rgba(255,180,0,0.12)' }}>
              <span className="text-[11px] mt-px">⚠️</span>
              <p className="text-[10px] text-zinc-400 leading-relaxed">
                Requires <strong className="text-zinc-300">HttpService</strong> enabled. In Studio: Game Settings → Security → Allow HTTP Requests → ON
              </p>
            </div>
          </div>
        )}

        {tab === 'manual' && (
          <div className="space-y-3">
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              <strong className="text-zinc-200">Works everywhere.</strong> Create the plugin manually in Studio.
            </p>
            <div className="space-y-1.5">
              {[
                'In Studio, go to View → Command Bar',
                'Type: game.HttpService.HttpEnabled = true',
                'Press Enter, then paste the loadstring above',
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-2 px-2.5 py-2 rounded-md" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <span className="text-[10px] font-bold text-zinc-600 mt-px w-3 flex-shrink-0">{i + 1}</span>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-zinc-600">
              Or download the file above and place it in your Plugins folder.
            </p>
          </div>
        )}
      </div>

      {/* Connection code — always shown below tabs */}
      <div className="mb-4">
        <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 px-0.5">
          Enter this code in the plugin
        </p>
        {connectFlow === 'idle' ? (
          <button
            onClick={onGenerateCode}
            className="w-full rounded-lg px-4 py-3 flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.98]"
            style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.25)', color: '#D4AF37', fontWeight: 600, fontSize: 13 }}
          >
            Generate Connection Code
          </button>
        ) : (
          <div className="rounded-lg px-4 py-3 flex items-center justify-between gap-3" style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.25)' }}>
            <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 28, fontWeight: 700, letterSpacing: '0.2em', color: '#D4AF37', lineHeight: 1 }}>
              {connectCode}
            </span>
            <CodeCopyButton code={connectCode} />
          </div>
        )}
      </div>

      {/* Waiting indicator */}
      {connectFlow === 'code' && (
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <span key={i} className="w-1 h-1 rounded-full bg-zinc-600" style={{ animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
            ))}
          </div>
          <p className="text-[11px] text-zinc-500">
            Waiting...{' '}
            <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              {Math.floor(connectTimer / 60)}:{String(connectTimer % 60).padStart(2, '0')}
            </span>
          </p>
        </div>
      )}

      {/* Confirm connected */}
      {connectFlow === 'code' && (
        <button
          onClick={onConfirmConnected}
          className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all hover:brightness-110 active:scale-[0.98] mb-2"
          style={{ background: '#10B981', color: '#fff' }}
        >
          I&apos;ve connected the plugin ✓
        </button>
      )}
      {/* Skip */}
      <button onClick={onDemoMode} className="text-[11px] text-zinc-700 hover:text-zinc-500 transition-colors">
        Skip — use demo preview
      </button>
    </>
  )
}

// ─── Plugin Connection Section (collapsible, shown below "How it works") ──────

function PluginConnectionSection({
  connectFlow,
  connectCode,
  connectTimer,
  onGenerateCode,
  onConfirmConnected,
}: {
  connectFlow: 'idle' | 'generating' | 'code' | 'connected'
  connectCode: string
  connectTimer: number
  onGenerateCode: () => void
  onConfirmConnected: () => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
      {/* Collapsible header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-3.5 py-3 text-left transition-colors hover:bg-white/[0.02]"
        style={{ background: 'rgba(255,255,255,0.015)' }}
      >
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0 text-zinc-500">
            <rect x="1" y="3" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M4 7h6M7 5v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          <span className="text-[11px] font-medium text-zinc-400">Advanced: Live Plugin Connection</span>
        </div>
        <svg
          width="12" height="12" viewBox="0 0 12 12" fill="none"
          className="flex-shrink-0 text-zinc-600 transition-transform"
          style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="px-3.5 pb-4 pt-3 space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <p className="text-[11px] text-zinc-500 leading-relaxed">
            Install the ForjeGames plugin in Roblox Studio to have AI commands run automatically.{' '}
            <span className="text-zinc-600">Works best when Studio stays open.</span>
          </p>

          {/* Generate code button / code display */}
          {connectFlow === 'idle' || connectFlow === 'generating' ? (
            <button
              onClick={onGenerateCode}
              disabled={connectFlow === 'generating'}
              className="w-full rounded-lg px-4 py-2.5 flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
              style={{ background: 'rgba(212,175,55,0.10)', border: '1px solid rgba(212,175,55,0.22)', color: '#D4AF37', fontWeight: 600, fontSize: 12 }}
            >
              {connectFlow === 'generating' ? (
                <>
                  <svg className="w-3 h-3 animate-spin" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="8 8"/>
                  </svg>
                  Generating...
                </>
              ) : (
                'Generate Connection Code'
              )}
            </button>
          ) : (
            <div className="space-y-2.5">
              <div className="rounded-lg px-4 py-3 flex items-center justify-between gap-3" style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.22)' }}>
                <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 24, fontWeight: 700, letterSpacing: '0.18em', color: '#D4AF37', lineHeight: 1 }}>
                  {connectCode}
                </span>
                <CodeCopyButton code={connectCode} />
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="w-1 h-1 rounded-full bg-zinc-600" style={{ animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                  ))}
                </div>
                <p className="text-[10px] text-zinc-500">
                  Enter this code in the plugin.{' '}
                  <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                    {Math.floor(connectTimer / 60)}:{String(connectTimer % 60).padStart(2, '0')}
                  </span>
                </p>
              </div>

              <button
                onClick={onConfirmConnected}
                className="w-full py-2 rounded-lg text-[12px] font-semibold transition-all hover:brightness-110 active:scale-[0.98]"
                style={{ background: '#10B981', color: '#fff' }}
              >
                I&apos;ve connected the plugin ✓
              </button>
            </div>
          )}

          {/* Install plugin hint */}
          <p className="text-[10px] text-zinc-600 leading-relaxed">
            Don&apos;t have the plugin?{' '}
            <a
              href="/api/studio/plugin"
              download
              className="text-zinc-500 hover:text-zinc-300 underline underline-offset-2 transition-colors"
            >
              Download it
            </a>
            {' '}or paste{' '}
            <code className="text-[10px]" style={{ fontFamily: '"JetBrains Mono", monospace', color: '#D4AF37' }}>
              loadstring(game:HttpGet(&quot;https://forjegames.com/api/studio/plugin&quot;))()
            </code>
            {' '}into Studio&apos;s Command Bar.
          </p>
        </div>
      )}
    </div>
  )
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

// ─── Studio Connect Banner ─────────────────────────────────────────────────────

interface StudioConnectBannerProps {
  onDismiss: () => void
  /** Incrementing this number auto-triggers code generation */
  autoConnectSignal?: number
}

function StudioConnectBanner({ onDismiss, autoConnectSignal = 0 }: StudioConnectBannerProps) {
  const [phase, setPhase] = useState<'idle' | 'loading' | 'code' | 'error'>('idle')
  const [code, setCode] = useState<string>('')
  const [codeCopied, setCodeCopied] = useState(false)

  const generateCode = async () => {
    setPhase('loading')
    try {
      const res = await fetch('/api/studio/auth?action=generate')
      if (!res.ok) throw new Error('non-2xx response')
      const data = await res.json() as { code?: string }
      if (typeof data.code === 'string' && data.code.length > 0) {
        setCode(data.code.toUpperCase())
        setPhase('code')
      } else {
        setPhase('error')
      }
    } catch {
      setPhase('error')
    }
  }

  const copyCode = async () => {
    await navigator.clipboard.writeText(code).catch(() => {})
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2000)
  }

  // Auto-trigger code generation when signal fires from empty-state card
  const prevSignalRef = useRef(0)
  useEffect(() => {
    if (autoConnectSignal > prevSignalRef.current && phase === 'idle') {
      prevSignalRef.current = autoConnectSignal
      generateCode()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoConnectSignal])

  return (
    <div
      className="flex-shrink-0 mx-3 mt-3 rounded-xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(212,175,55,0.07) 0%, rgba(212,175,55,0.03) 100%)',
        border: '1px solid rgba(212,175,55,0.25)',
        boxShadow: '0 2px 16px rgba(212,175,55,0.08)',
      }}
    >
      {/* Gold top stripe */}
      <div
        className="h-[2px]"
        style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.7) 30%, rgba(212,175,55,0.7) 70%, transparent 100%)' }}
      />

      <div className="px-3 py-2.5">
        {phase === 'code' ? (
          /* ── Code reveal state ── */
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-white">Paste this code in the ForjeGames plugin</p>
              <button onClick={onDismiss} className="text-zinc-600 hover:text-zinc-400 transition-colors ml-2 flex-shrink-0" aria-label="Dismiss banner">
                <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                  <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="flex items-center gap-2 mb-1.5">
              <div
                className="flex-1 flex items-center justify-center py-2 rounded-lg"
                style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(212,175,55,0.3)' }}
              >
                <span
                  className="text-2xl font-bold tracking-[0.3em] select-all"
                  style={{
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    color: '#D4AF37',
                    textShadow: '0 0 20px rgba(212,175,55,0.5)',
                  }}
                >
                  {code}
                </span>
              </div>
              <button
                onClick={copyCode}
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all flex-shrink-0"
                style={{
                  background: codeCopied ? 'rgba(74,222,128,0.15)' : 'rgba(212,175,55,0.12)',
                  border: `1px solid ${codeCopied ? 'rgba(74,222,128,0.3)' : 'rgba(212,175,55,0.25)'}`,
                  color: codeCopied ? '#4ADE80' : '#D4AF37',
                }}
              >
                {codeCopied ? (
                  <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                    <rect x="1" y="3" width="7" height="8" rx="1" stroke="currentColor" strokeWidth="1.1" />
                    <path d="M4 3V2a1 1 0 011-1h5a1 1 0 011 1v7a1 1 0 01-1 1H9" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
                  </svg>
                )}
                {codeCopied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="text-[10px] text-zinc-600">
              Open ForjeGames plugin in Studio, click Connect, then enter this code.
            </p>
          </div>
        ) : (
          /* ── Default / loading / error state ── */
          <div className="flex items-center gap-3">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.25)' }}
            >
              <svg className="w-3.5 h-3.5 text-[#D4AF37]" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="1" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                <path d="M1 5h12" stroke="currentColor" strokeWidth="1.2" />
                <path d="M4 1v4" stroke="currentColor" strokeWidth="1.2" />
              </svg>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white leading-tight">
                {phase === 'error' ? 'Could not generate code' : 'Connect Roblox Studio'}
              </p>
              <p className="text-[10px] text-zinc-500 leading-tight mt-0.5">
                {phase === 'error' ? 'Check your connection and try again.' : 'Push builds live — no copy-paste.'}
              </p>
            </div>

            <button
              onClick={generateCode}
              disabled={phase === 'loading'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold flex-shrink-0 transition-all duration-150 active:scale-[0.96] disabled:opacity-60"
              style={{
                background: phase === 'error'
                  ? 'rgba(239,68,68,0.15)'
                  : 'linear-gradient(135deg, #D4AF37 0%, #F5D060 100%)',
                color: phase === 'error' ? '#F87171' : '#030712',
                border: phase === 'error' ? '1px solid rgba(239,68,68,0.3)' : 'none',
                boxShadow: phase === 'error' ? 'none' : '0 0 12px rgba(212,175,55,0.3)',
              }}
            >
              {phase === 'loading' ? (
                <svg className="w-3 h-3 animate-spin" viewBox="0 0 12 12" fill="none">
                  <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6 6" />
                </svg>
              ) : (
                <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                  <rect x="1" y="1" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                  <path d="M1 4.5h10" stroke="currentColor" strokeWidth="1.2" />
                  <path d="M4 1v3.5" stroke="currentColor" strokeWidth="1.2" />
                </svg>
              )}
              {phase === 'loading' ? 'Generating…' : phase === 'error' ? 'Retry' : 'Connect Now'}
            </button>

            <button onClick={onDismiss} className="text-zinc-700 hover:text-zinc-500 transition-colors flex-shrink-0" aria-label="Dismiss banner">
              <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Typing Indicator ──────────────────────────────────────────────────────────

const THINKING_PHRASES = [
  'Thinking...',
  'Planning your build...',
  'Generating code...',
  'Almost ready...',
]

function TypingIndicator() {
  const [phraseIdx, setPhraseIdx] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setPhraseIdx((p) => (p + 1) % THINKING_PHRASES.length)
    }, 1800)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex items-center gap-3">
      {/* Avatar */}
      <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #FFB81C 0%, #FF6B35 100%)' }}>
        <svg className="w-3.5 h-3.5 text-black" viewBox="0 0 14 14" fill="currentColor">
          <path d="M7 2L8.5 5.5H12L9 7.5l1 3.5L7 9l-3 2 1-3.5-3-2h3.5L7 2z"/>
        </svg>
      </div>
      {/* Bubble with rotating status + dots */}
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl rounded-tl-sm"
        style={{
          background: 'linear-gradient(135deg, rgba(13,18,49,1) 0%, rgba(17,24,64,1) 100%)',
          border: '1px solid rgba(255,184,28,0.15)',
          boxShadow: '0 0 20px rgba(255,184,28,0.06)',
        }}>
        <span
          key={phraseIdx}
          className="text-xs text-[#FFB81C]/70 font-medium"
          style={{ animation: 'word-fade-in 0.3s ease-out forwards' }}
        >
          {THINKING_PHRASES[phraseIdx]}
        </span>
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
        className="w-12 h-12 rounded-lg overflow-hidden border flex items-center justify-center transition-all"
        style={{
          background: 'rgba(74,222,128,0.06)',
          borderColor: 'rgba(74,222,128,0.25)',
        }}
      >
        {asset.thumbnailUrl && !imgErr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/roblox/thumbnail?id=${asset.assetId}&size=150x150`}
            alt={asset.name}
            className="w-full h-full object-cover"
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

// ─── Luau syntax highlighter (gold keywords · green strings · gray comments · blue numbers · purple globals) ───

function LuauHighlighted({ code }: { code: string }) {
  const keywords = /\b(local|function|end|if|then|else|elseif|for|do|while|repeat|until|return|and|or|not|true|false|nil|in|break|continue)\b/g
  const globals  = /\b(game|workspace|Instance|Vector3|CFrame|Color3|BrickColor|Enum|script|Players|RunService|TweenService|UserInputService|CollectionService|ReplicatedStorage|ServerStorage|ServerScriptService|StarterGui|StarterPack|Lighting)\b/g
  const builtins = /\b(print|warn|error|wait|task|math|table|string|pcall|xpcall|tostring|tonumber|pairs|ipairs|next|select|type|typeof|unpack|rawget|rawset|setmetatable|getmetatable|require|coroutine|os|tick|time)\b/g
  const strings  = /"([^"\\]|\\.)*"|'([^'\\]|\\.)*'|\[\[[\s\S]*?\]\]/g
  const comments = /--.*$/gm
  const numbers  = /\b\d+(\.\d+)?\b/g

  const len = code.length
  type TokenKind = 'keyword' | 'globals' | 'builtin' | 'string' | 'comment' | 'number' | 'plain'
  interface Span { start: number; end: number; kind: TokenKind }
  const spans: Span[] = []

  const mark = (re: RegExp, kind: TokenKind) => {
    re.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = re.exec(code)) !== null) {
      spans.push({ start: m.index, end: m.index + m[0].length, kind })
    }
  }
  // Priority: comments > strings > globals > keywords > builtins > numbers
  mark(comments, 'comment')
  mark(strings,  'string')
  mark(globals,  'globals')
  mark(keywords, 'keyword')
  mark(builtins, 'builtin')
  mark(numbers,  'number')

  spans.sort((a, b) => a.start - b.start)
  const filtered: Span[] = []
  let cursor = 0
  for (const s of spans) {
    if (s.start < cursor) continue
    filtered.push(s)
    cursor = s.end
  }

  const parts: React.ReactNode[] = []
  let pos = 0
  const COLOR: Record<TokenKind, string> = {
    keyword: '#D4AF37',   // gold
    globals: '#A78BFA',   // purple — Roblox globals
    builtin: '#60A5FA',   // blue — std builtins
    string:  '#10B981',   // green
    comment: '#6B7280',   // gray
    number:  '#60A5FA',   // blue
    plain:   '#E2E8F0',   // off-white
  }
  filtered.forEach((s, i) => {
    if (pos < s.start) parts.push(<span key={`p${i}`} style={{ color: COLOR.plain }}>{code.slice(pos, s.start)}</span>)
    parts.push(<span key={`t${i}`} style={{ color: COLOR[s.kind] }}>{code.slice(s.start, s.end)}</span>)
    pos = s.end
  })
  if (pos < len) parts.push(<span key="last" style={{ color: COLOR.plain }}>{code.slice(pos)}</span>)

  return <>{parts}</>
}

// ─── Code editor container with line numbers, file tab, and collapse ──────────

function LuauCodeBlock({
  code,
  collapsed,
  onToggle,
}: {
  code: string
  collapsed: boolean
  onToggle: () => void
}) {
  const lines = code.split('\n')
  const lineCount = lines.length
  const gutterWidth = String(lineCount).length * 8 + 20

  return (
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      {/* Editor tab bar */}
      <div
        className="flex items-center justify-between px-3 py-1.5"
        style={{
          background: '#0D1117',
          borderBottom: collapsed ? 'none' : '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex items-center gap-2">
          {/* Traffic-light dots */}
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ background: '#FF5F57' }} />
            <div className="w-2 h-2 rounded-full" style={{ background: '#FFBD2E' }} />
            <div className="w-2 h-2 rounded-full" style={{ background: '#28CA41' }} />
          </div>
          {/* Active file tab */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-0.5"
            style={{
              background: '#161B22',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '4px 4px 0 0',
              borderBottom: collapsed ? undefined : '1px solid #0D1117',
              marginBottom: collapsed ? 0 : -1,
            }}
          >
            <svg className="w-2.5 h-2.5 flex-shrink-0" viewBox="0 0 10 10" fill="none">
              <path d="M2 1h4l2 2v6H2V1z" stroke="#A78BFA" strokeWidth="0.8" fill="rgba(167,139,250,0.1)"/>
              <path d="M6 1v2h2" stroke="#A78BFA" strokeWidth="0.8"/>
            </svg>
            <span className="text-[9px] font-mono" style={{ color: '#A78BFA' }}>ServerScript.lua</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] tabular-nums" style={{ color: '#374151' }}>{lineCount} lines</span>
          <button
            onClick={onToggle}
            className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded transition-colors hover:bg-white/5"
            style={{ color: '#6B7280' }}
          >
            <svg
              className={`w-2.5 h-2.5 transition-transform duration-150 ${collapsed ? '' : 'rotate-180'}`}
              viewBox="0 0 10 10"
              fill="none"
            >
              <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {collapsed ? 'Expand' : 'Collapse'}
          </button>
        </div>
      </div>

      {/* Code area */}
      {!collapsed && (
        <div
          className="overflow-auto font-mono text-[10px] leading-[1.65]"
          style={{ background: '#0D1117', maxHeight: '260px', tabSize: 2 }}
        >
          <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: gutterWidth }} />
              <col />
            </colgroup>
            <tbody>
              {lines.map((line, idx) => (
                <tr key={idx} className="group hover:bg-white/[0.025]">
                  <td
                    className="text-right pr-3 pl-2 align-top select-none tabular-nums"
                    style={{
                      color: '#374151',
                      borderRight: '1px solid rgba(255,255,255,0.04)',
                      minWidth: gutterWidth,
                    }}
                  >
                    {idx + 1}
                  </td>
                  <td className="pl-3 pr-3 whitespace-pre align-top">
                    <LuauHighlighted code={line} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
const BuildResultCard = memo(function BuildResultCard({ result, studioConnected, studioSessionId, studioJwt }: { result: BuildResult; studioConnected?: boolean; studioSessionId?: string; studioJwt?: string }) {
  const [codeCollapsed, setCodeCollapsed] = useState(true)
  const [copied, setCopied]               = useState(false)
  const [runSent, setRunSent]             = useState(false)
  const [importDone, setImportDone]       = useState(false)
  const { show: showToast } = useToast()
  const copyTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const importTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const runTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (copyTimerRef.current)   clearTimeout(copyTimerRef.current)
      if (importTimerRef.current) clearTimeout(importTimerRef.current)
      if (runTimerRef.current)    clearTimeout(runTimerRef.current)
    }
  }, [])

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

  const handleRunInStudio = () => {
    navigator.clipboard.writeText(result.luauCode).catch(() => {})

    if (studioConnected && studioSessionId) {
      fetch('/api/studio/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(studioJwt ? { 'Authorization': `Bearer ${studioJwt}` } : {}) },
        body: JSON.stringify({ code: result.luauCode, sessionId: studioSessionId }),
      }).catch(() => {})
      setTimeout(() => {
        fetch('/api/studio/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: studioSessionId }),
        }).catch(() => {})
      }, 2000)
      setRunSent(true)
      showToast({ variant: 'success', title: 'Sent to Studio!', description: 'Script is executing in Roblox Studio.', duration: 4000 })
      if (runTimerRef.current) clearTimeout(runTimerRef.current)
      runTimerRef.current = setTimeout(() => setRunSent(false), 3000)
    } else {
      setImportDone(true)
      showToast({ variant: 'success', title: 'Code copied!', description: 'Studio not connected. Paste into a Script in Roblox Studio.', duration: 5000 })
      if (importTimerRef.current) clearTimeout(importTimerRef.current)
      importTimerRef.current = setTimeout(() => setImportDone(false), 3000)
    }
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
            From Roblox Creator Store &mdash; free &amp; ready to use
          </p>
          <div className="flex flex-wrap gap-2">
            {result.foundAssets.map((asset) => (
              <AssetPill key={asset.assetId} asset={asset} />
            ))}
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
          <rect x="4" y="10" width="16" height="12" rx="1" fill="#1E3A5F" stroke="#3B6EA8" strokeWidth="0.8"/>
          <rect x="4" y="4" width="16" height="8" rx="0.5" fill="#2E5A8A" stroke="#4A7DC0" strokeWidth="0.6"/>
          <rect x="24" y="12" width="12" height="10" rx="1" fill="#3A2010" stroke="#7A5230" strokeWidth="0.8"/>
          <rect x="40" y="8" width="13" height="14" rx="1" fill="#1A3A28" stroke="#2E6644" strokeWidth="0.8"/>
          <circle cx="48" cy="6" r="3" fill="#166534" stroke="#22883C" strokeWidth="0.6"/>
          <line x1="0" y1="22" x2="56" y2="22" stroke="#2a2a2a" strokeWidth="0.8"/>
        </svg>
      </div>

      {/* Professional code editor block */}
      <LuauCodeBlock
        code={result.luauCode}
        collapsed={codeCollapsed}
        onToggle={() => setCodeCollapsed((s) => !s)}
      />

      {/* Action bar: Copy + Run in Studio */}
      <div
        className="flex items-center gap-2 px-3 py-2.5"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: '#0D1117' }}
      >
        {/* Copy — always visible */}
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all duration-150 active:scale-[0.97]"
          style={{
            background: copied ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.06)',
            color: copied ? '#4ADE80' : '#9CA3AF',
            border: `1px solid ${copied ? 'rgba(74,222,128,0.25)' : 'rgba(255,255,255,0.08)'}`,
            minWidth: 72,
          }}
        >
          {copied ? (
            <>
              <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                <rect x="1" y="4" width="7" height="7" rx="1.2" stroke="currentColor" strokeWidth="1.1"/>
                <path d="M4 4V2.5A1.5 1.5 0 015.5 1h4A1.5 1.5 0 0111 2.5v5A1.5 1.5 0 019.5 9H8" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
              </svg>
              Copy
            </>
          )}
        </button>

        {/* Run in Studio — gold, prominent */}
        <button
          onClick={handleRunInStudio}
          className="flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg font-semibold text-[11px] transition-all duration-150 active:scale-[0.97]"
          style={{
            background: runSent || importDone
              ? 'rgba(74,222,128,0.15)'
              : 'linear-gradient(135deg, #D4AF37 0%, #FFB81C 100%)',
            color: runSent || importDone ? '#4ADE80' : '#030712',
            border: runSent || importDone ? '1px solid rgba(74,222,128,0.3)' : '1px solid transparent',
            boxShadow: runSent || importDone ? 'none' : '0 0 18px rgba(212,175,55,0.3), 0 2px 6px rgba(0,0,0,0.4)',
          }}
        >
          {runSent ? (
            <>
              <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none">
                <path d="M2 7l4 4 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Sent to Studio!
            </>
          ) : importDone ? (
            <>
              <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none">
                <path d="M2 7l4 4 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Copied &mdash; paste in Script
            </>
          ) : studioConnected ? (
            <>
              <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none">
                <polygon points="3,2 12,7 3,12" fill="currentColor"/>
              </svg>
              Run in Studio
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none">
                <path d="M7 1v8M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M1 11h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
              Run in Studio
            </>
          )}
        </button>

        {/* Studio connection pill */}
        <div
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[9px] flex-shrink-0"
          style={{
            background: studioConnected ? 'rgba(74,222,128,0.08)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${studioConnected ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.06)'}`,
            color: studioConnected ? '#4ADE80' : '#4B5563',
          }}
          title={studioConnected ? 'Roblox Studio connected' : 'Roblox Studio not connected'}
        >
          <div
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{
              background: studioConnected ? '#4ADE80' : '#374151',
              boxShadow: studioConnected ? '0 0 5px #4ADE80' : 'none',
            }}
          />
          {studioConnected ? 'Live' : 'Offline'}
        </div>
      </div>
    </div>
  )
})

// ─── Timestamp display ─────────────────────────────────────────────────────────

const MessageTimestamp = memo(function MessageTimestamp({ ts }: { ts: Date }) {
  const label = ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return (
    <span
      className="text-[9px] text-gray-600 select-none"
      style={{ animation: 'timestamp-fade 0.15s ease-out forwards' }}
    >
      {label}
    </span>
  )
})

// ─── Message bubble ────────────────────────────────────────────────────────────

const Message = memo(function Message({ msg, studioConnected, studioSessionId, studioJwt }: { msg: ChatMessage; studioConnected?: boolean; studioSessionId?: string; studioJwt?: string }) {
  const [showTs, setShowTs] = useState(false)

  if (msg.role === 'system') {
    return (
      <div className="flex justify-center my-1.5">
        <span className="text-[11px] text-zinc-500 px-3 py-0.5">
          {msg.content}
        </span>
      </div>
    )
  }

  if (msg.role === 'status') {
    return <TypingIndicator />
  }

  if (msg.role === 'upgrade') {
    return (
      <div className="flex justify-start my-2 px-1">
        <TokenGateCard />
      </div>
    )
  }

  if (msg.role === 'signup') {
    return (
      <div className="flex justify-start my-3 px-1">
        <div
          style={{
            background: 'rgba(212,175,55,0.06)',
            border: '1px solid rgba(212,175,55,0.2)',
            borderRadius: 16,
            padding: '24px 28px',
            maxWidth: 420,
          }}
        >
          <p style={{ color: '#D4AF37', fontWeight: 700, fontSize: 16, marginBottom: 6 }}>
            You&apos;re building great stuff!
          </p>
          <p style={{ color: '#A1A1AA', fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
            Create a free account to keep building, save your projects, and get 1,000 free tokens.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link
              href="/sign-up"
              style={{
                background: 'linear-gradient(135deg, #D4AF37, #FFB81C)',
                color: '#09090b',
                padding: '10px 24px',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              Create free account
            </Link>
            <Link
              href="/sign-in"
              style={{
                color: '#A1A1AA',
                padding: '10px 16px',
                borderRadius: 10,
                fontSize: 13,
                border: '1px solid rgba(255,255,255,0.08)',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (msg.role === 'user') {
    // Strip internal [FORJE_STEP:N/M] prefixes — auto-sent continuation steps
    // look cleaner as just the step description, not a raw instruction string.
    const displayContent = msg.content.replace(/^\[FORJE_STEP:\d+\/\d+\]\s*/, '')
    const isContinuationStep = /^\[FORJE_STEP:\d+\/\d+\]/.test(msg.content)
    return (
      <div
        className="flex justify-end gap-2 group"
        onMouseEnter={() => setShowTs(true)}
        onMouseLeave={() => setShowTs(false)}
      >
        <div className="flex flex-col items-end gap-1">
          {isContinuationStep && (
            <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ color: '#D4AF37', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)' }}>
              auto-step
            </span>
          )}
          <div
            className="max-w-[80%] px-3.5 py-2.5 rounded-2xl rounded-tr-sm"
            style={{
              background: 'rgba(212,175,55,0.07)',
              border: '1px solid rgba(212,175,55,0.14)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}
          >
            <p className="text-sm text-zinc-100 leading-relaxed">{displayContent}</p>
          </div>
          {showTs && <MessageTimestamp ts={msg.timestamp} />}
        </div>
      </div>
    )
  }

  // assistant — strip suggestions, JSON metadata, and other non-display content
  const displayContent = msg.content
    .replace(/\[SUGGESTIONS\][\s\S]*?(?:\[\/SUGGESTIONS\]|$)/gi, '')
    .replace(/[,\s]*"?tokensUsed"?\s*:\s*\d[\s\S]*$/m, '')
    .replace(/\s*\{[^{}]*"tokensUsed"[^{}]*\}\s*$/m, '')
    .replace(/```(?:lua|luau)?\s*\n[\s\S]*?```/g, '')
    .replace(/\s*[}\]]\s*$/, '')
    .trim()

  const modelColor = MODELS.find((m) => m.id === msg.model)?.color ?? '#FFB81C'
  const words = displayContent.split(' ')

  return (
    <div
      className="flex items-start gap-3 group"
      onMouseEnter={() => setShowTs(true)}
      onMouseLeave={() => setShowTs(false)}
    >
      {/* AI Avatar */}
      <div
        className="w-6 h-6 rounded-md flex-shrink-0 flex items-center justify-center mt-0.5"
        style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)' }}
      >
        <svg className="w-3 h-3" viewBox="0 0 14 14" fill="none" style={{ color: '#D4AF37' }}>
          <path d="M7 2L8.5 5.5H12L9 7.5l1 3.5L7 9l-3 2 1-3.5-3-2h3.5L7 2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* Bubble */}
      <div className="flex flex-col gap-1.5 max-w-[82%]">
        <div
          className="relative px-3.5 py-2.5 rounded-2xl rounded-tl-sm"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 2px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)',
          }}
        >
          <p className="text-sm text-zinc-100 leading-relaxed whitespace-pre-wrap font-[inherit]">
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
        {/* Multi-step build progress bar */}
        {msg.buildPlan && (
          <div
            className="rounded-lg p-3 mt-2"
            style={{ background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.18)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold" style={{ color: '#D4AF37' }}>
                {msg.buildPlan.autoNext ? `Building step ${msg.buildPlan.currentStep} of ${msg.buildPlan.totalSteps}...` : `Build complete — ${msg.buildPlan.totalSteps} steps done`}
              </span>
              <span className="text-[10px]" style={{ color: '#a1a1aa' }}>
                {Math.round((msg.buildPlan.currentStep / msg.buildPlan.totalSteps) * 100)}%
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.round((msg.buildPlan.currentStep / msg.buildPlan.totalSteps) * 100)}%`,
                  background: 'linear-gradient(90deg, #D4AF37, #FFB81C)',
                }}
              />
            </div>
            {/* Step list */}
            <div className="mt-2 space-y-0.5">
              {msg.buildPlan.planLines.map((line, i) => {
                const stepNum = i + 1
                const isDone = stepNum < msg.buildPlan!.currentStep
                const isCurrent = stepNum === msg.buildPlan!.currentStep
                return (
                  <div key={i} className="flex items-start gap-1.5 text-[10px]">
                    <span style={{ color: isDone ? '#D4AF37' : isCurrent ? '#FFB81C' : '#52525b', flexShrink: 0 }}>
                      {isDone ? '✓' : isCurrent ? '▶' : '○'}
                    </span>
                    <span style={{ color: isDone ? '#a1a1aa' : isCurrent ? '#e4e4e7' : '#52525b' }}>
                      {line}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
        {/* Marketplace-first build result card */}
        {msg.buildResult && <BuildResultCard result={msg.buildResult} studioConnected={studioConnected} studioSessionId={studioSessionId} studioJwt={studioJwt} />}
        {/* Code preview — shown when a build result has Luau code */}
        {msg.buildResult?.luauCode && (
          <CodePreview code={msg.buildResult.luauCode} />
        )}
        <div className="flex items-center gap-2 pl-1">
          {msg.tokensUsed !== undefined && (
            <span className="text-[10px] text-zinc-600 flex items-center gap-1">
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

function Viewport({ sceneBlocks, onConnectClick }: { sceneBlocks: SceneBlock[]; onConnectClick?: () => void }) {
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

      {/* TOP-RIGHT: view mode + grid + zoom — condensed on mobile */}
      <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end pointer-events-auto">
        <div
          className="hidden md:flex gap-0.5 rounded-lg overflow-hidden"
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
            className="px-2.5 py-2 md:py-1.5 rounded-lg text-[10px] font-medium transition-colors"
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
              className="w-9 h-9 md:w-7 md:h-7 flex items-center justify-center text-gray-400 hover:text-white transition-colors text-sm font-bold"
              title="Zoom out"
            >−</button>
            <span className="text-[9px] text-gray-500 w-8 text-center font-mono">{zoom}%</span>
            <div className="w-px self-stretch bg-white/[0.08]" />
            <button
              onClick={() => setZoom((z) => Math.min(400, z + 25))}
              className="w-9 h-9 md:w-7 md:h-7 flex items-center justify-center text-gray-400 hover:text-white transition-colors text-sm font-bold"
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
}

// ─── Studio Live Viewport ──────────────────────────────────────────────────────
// Shows real Studio screenshot when available; falls back to Three.js viewport.
// Supports crossfade transitions and before/after slider comparison.

interface StudioLiveViewportProps {
  liveScreenshot: string | null
  prevScreenshot: string | null
  screenshotFading: boolean
  beforeScreenshot: string | null
  afterScreenshot: string | null
  showComparison: boolean
  sliderPos: number
  onSliderChange: (pos: number) => void
  onDismissComparison: () => void
  sliderDraggingRef: React.MutableRefObject<boolean>
  children: React.ReactNode  // Three.js viewport as fallback
}

function StudioLiveViewport({
  liveScreenshot,
  prevScreenshot,
  screenshotFading,
  beforeScreenshot,
  afterScreenshot,
  showComparison,
  sliderPos,
  onSliderChange,
  onDismissComparison,
  sliderDraggingRef,
  children,
}: StudioLiveViewportProps) {
  const hasLive = Boolean(liveScreenshot)

  // Pointer events for slider drag
  const handleSliderPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    sliderDraggingRef.current = true
  }, [sliderDraggingRef])

  const handleSliderPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!sliderDraggingRef.current) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100))
    onSliderChange(pct)
  }, [sliderDraggingRef, onSliderChange])

  const handleSliderPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId)
    sliderDraggingRef.current = false
  }, [sliderDraggingRef])

  return (
    <div className="absolute inset-0">
      {/* ── Three.js fallback — always mounted, hidden when live screenshot available ── */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{ opacity: hasLive ? 0 : 1, pointerEvents: hasLive ? 'none' : 'auto' }}
      >
        {children}
      </div>

      {/* ── Live Studio screenshot layer ── */}
      {hasLive && (
        <div className="absolute inset-0">
          {/* Previous screenshot (fades out during transition) */}
          {prevScreenshot && screenshotFading && (
            <img
              src={`data:image/png;base64,${prevScreenshot}`}
              alt=""
              draggable={false}
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-600"
              style={{ opacity: screenshotFading ? 0 : 1 }}
            />
          )}
          {/* Current live screenshot */}
          <img
            src={`data:image/png;base64,${liveScreenshot}`}
            alt="Studio viewport"
            draggable={false}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-600"
            style={{ opacity: screenshotFading ? 0.4 : 1 }}
          />

          {/* "Live from Studio" badge */}
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', border: '1px solid rgba(16,185,129,0.4)' }}>
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: '#10B981',
                boxShadow: '0 0 6px #10B981',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
            <span className="text-[10px] font-semibold text-emerald-400 tracking-wide uppercase">Live from Studio</span>
          </div>
        </div>
      )}

      {/* ── Before/After comparison slider ── */}
      {showComparison && beforeScreenshot && afterScreenshot && (
        <div
          className="absolute inset-0 z-20 cursor-col-resize select-none"
          onPointerDown={handleSliderPointerDown}
          onPointerMove={handleSliderPointerMove}
          onPointerUp={handleSliderPointerUp}
        >
          {/* After (right side) */}
          <img
            src={`data:image/png;base64,${afterScreenshot}`}
            alt="After build"
            draggable={false}
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Before (left clip) */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
          >
            <img
              src={`data:image/png;base64,${beforeScreenshot}`}
              alt="Before build"
              draggable={false}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
          {/* Divider line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 z-30 pointer-events-none"
            style={{ left: `${sliderPos}%`, background: '#D4AF37', boxShadow: '0 0 8px rgba(212,175,55,0.8)' }}
          >
            {/* Drag handle */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: '#D4AF37', boxShadow: '0 2px 12px rgba(0,0,0,0.5)' }}
            >
              <svg className="w-4 h-4 text-black" viewBox="0 0 16 16" fill="currentColor">
                <path d="M5 3L2 8l3 5V3zm6 0v10l3-5-3-5z"/>
              </svg>
            </div>
          </div>
          {/* Labels */}
          <div className="absolute bottom-12 left-3 text-[10px] font-bold text-white px-2 py-0.5 rounded"
            style={{ background: 'rgba(0,0,0,0.7)' }}>BEFORE</div>
          <div className="absolute bottom-12 right-3 text-[10px] font-bold text-white px-2 py-0.5 rounded"
            style={{ background: 'rgba(0,0,0,0.7)' }}>AFTER</div>
          {/* Dismiss button */}
          <button
            className="absolute top-3 right-3 z-40 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all hover:brightness-110"
            style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.15)', color: '#a3a3a3' }}
            onClick={onDismissComparison}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M1 1l10 10M11 1L1 11"/>
            </svg>
            Close
          </button>
        </div>
      )}
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
                  className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden"
                  style={{
                    background: isActive
                      ? 'linear-gradient(135deg, rgba(255,184,28,0.2) 0%, rgba(255,107,53,0.15) 100%)'
                      : 'rgba(255,255,255,0.05)',
                    border: isActive ? '1px solid rgba(255,184,28,0.3)' : '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  {game.thumbnailUrl ? (
                    <Image src={game.thumbnailUrl} alt={game.name} width={40} height={40} className="w-full h-full object-cover rounded-lg" />
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
        'forge-focus relative w-9 h-9 rounded-lg flex items-center justify-center transition-colors duration-150',
        active
          ? 'text-[#D4AF37]'
          : 'text-zinc-600 hover:text-zinc-300',
      ].join(' ')}
    >
      {children}
      {active && (
        <span
          className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-3 h-px rounded-full"
          style={{ background: '#D4AF37' }}
        />
      )}
    </button>
  )
}

// ─── Main editor ───────────────────────────────────────────────────────────────

export function EditorClient() {
  const { show: showToast } = useToast()
  const { settings: editorSettings, update: updateEditorSetting } = useEditorSettings()

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: uid(),
      role: 'assistant',
      content: "Hey! I'm Forje — your game dev partner. Hit the mic and say \"build me a castle\" or type what you want. I'll build it right into Studio with pro details — window depth, lighting, plants, the works. Let's make something insane.",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [activePanel, setActivePanel] = useState<PanelId>(null)
  const [sceneBlocks, setSceneBlocks] = useState<SceneBlock[]>([])
  const [parsedParts, setParsedParts] = useState<ParsedPart[]>([])
  const [totalTokens, setTotalTokens] = useState(0)
  const [suggestedReplies, setSuggestedReplies] = useState<string[]>([])
  const [buildCount, setBuildCount] = useState(0)

  // ─── Properties editor state ───────────────────────────────────────────────
  const [sceneObjects, setSceneObjects] = useState<SceneObject[]>([])
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null)
  const [activeTool, setActiveTool] = useState<ToolMode>('select')
  const [undoStack, setUndoStack] = useState<SceneObject[][]>([])
  const [redoStack, setRedoStack] = useState<SceneObject[][]>([])
  const [propertiesPanelOpen, setPropertiesPanelOpen] = useState(false)
  const [selectedModel, setSelectedModel] = useState<ModelId>('claude-4')
  const [apiKeysOpen, setApiKeysOpen] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [activeGame, setActiveGame] = useState<RobloxGame | null>(DEMO_GAMES[0])
  const [projectName, setProjectName] = useState('Medieval Kingdom')
  const [editingProjectName, setEditingProjectName] = useState(false)
  const [showBuildOverlay, setShowBuildOverlay] = useState(false)
  const projectNameInputRef = useRef<HTMLInputElement>(null)

  // ── Slash commands state ────────────────────────────────────────────────────
  const [slashMenuOpen, setSlashMenuOpen] = useState(false)
  const [slashFilter, setSlashFilter] = useState('')

  // Guest mode — allow 3 free messages before prompting sign-up
  // Persisted to sessionStorage so a page refresh doesn't reset the counter.
  const GUEST_MESSAGE_LIMIT = 3
  const [guestMessageCount, setGuestMessageCount] = useState<number>(() => {
    try {
      const stored = sessionStorage.getItem('fg_guest_msg_count')
      return stored ? parseInt(stored, 10) : 0
    } catch {
      return 0
    }
  })

  // Persist guest message count to sessionStorage whenever it changes
  useEffect(() => {
    try { sessionStorage.setItem('fg_guest_msg_count', String(guestMessageCount)) } catch { /* ignore */ }
  }, [guestMessageCount])

  // Studio connect banner — persist dismissal per session via localStorage
  const [bannerDismissed, setBannerDismissed] = useState<boolean>(() => {
    try { return localStorage.getItem('fg_studio_banner_dismissed') === '1' } catch { return false }
  })

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

  // Auto-focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  // Sync project name when active game changes
  useEffect(() => {
    if (activeGame) setProjectName(activeGame.name)
  }, [activeGame])

  // Focus project name input when editing starts
  useEffect(() => {
    if (editingProjectName) projectNameInputRef.current?.select()
  }, [editingProjectName])

  const submitRef = useRef<((text: string) => void) | null>(null)
  const handleVoiceResult = useCallback((text: string) => {
    if (!text.trim()) return
    // Auto-submit voice commands that sound like build requests
    const isBuildCommand = /^(build|create|make|add|place|generate|spawn|put|drop|give me|set up|design)/i.test(text.trim())
    if (isBuildCommand && submitRef.current) {
      // Auto-send build commands immediately — voice-first experience
      submitRef.current(text.trim())
    } else {
      // For questions/conversation, put in input so user can review
      setInput((prev) => (prev ? prev + ' ' + text : text))
      textareaRef.current?.focus()
    }
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


  // ── Mobile tab state ────────────────────────────────────────────────────────
  const [mobileTab, setMobileTab] = useState<'chat' | 'preview'>('chat')

  // ── Build history ────────────────────────────────────────────────────────────
  const { entries: buildHistory, addBuild } = useBuildHistory()

  // ── Onboarding ───────────────────────────────────────────────────────────────
  const { showOnboarding, dismissOnboarding, triggerOnboarding } = useOnboarding()

  // Studio state — must be declared before submit so the callback closes over them
  const [studioStatus, setStudioStatus] = useState<StudioStatus>({ connected: false })
  const [demoMode, setDemoMode]             = useState(false)
  const [studioActivity, setStudioActivity] = useState<StudioActivity[]>([])
  const [executeStatus, setExecuteStatus]   = useState<'idle' | 'sending' | 'done' | 'error'>('idle')

  // Multi-step build orchestration state
  const [pendingNextStep, setPendingNextStep] = useState<string | null>(null)
  const [activeBuildPlan, setActiveBuildPlan] = useState<BuildPlan | null>(null)

  // Live screenshot state
  const [liveScreenshot, setLiveScreenshot]     = useState<string | null>(null)
  const [prevScreenshot, setPrevScreenshot]     = useState<string | null>(null)
  const [beforeScreenshot, setBeforeScreenshot] = useState<string | null>(null)
  const [afterScreenshot, setAfterScreenshot]   = useState<string | null>(null)
  const [showComparison, setShowComparison]     = useState(false)
  const [sliderPos, setSliderPos]               = useState(50)
  const [screenshotFading, setScreenshotFading] = useState(false)
  const sliderDragging = useRef(false)

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
        content: 'ForjeAI is thinking...',
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMsg, statusMsg])

      // Guest mode: after N free messages, prompt sign-up
      if (!user && guestMessageCount >= GUEST_MESSAGE_LIMIT) {
        setMessages((prev) => {
          const without = prev.filter((m) => m.id !== statusMsg.id)
          return [
            ...without,
            {
              id: uid(),
              role: 'signup' as MessageRole,
              content: '',
              timestamp: new Date(),
            },
          ]
        })
        setLoading(false)
        return
      }
      if (!user) setGuestMessageCount((c) => c + 1)

      showToast({ variant: 'info', title: 'Building…', description: 'ForjeAI is generating your build.', duration: 4000, loading: true })

      try {
        let responseText: string | null = null
        let tokensUsed = estimateTokens(trimmed)

        // Detect build-mesh intent — run mesh generation in parallel with chat
        const lowerTrimmed = trimmed.toLowerCase()
        const isBuildMeshIntent = BUILD_MESH_KEYWORDS.some((kw) => lowerTrimmed.includes(kw))

        // Build headers — inject custom API key if user has one set
        const chatHeaders: Record<string, string> = { 'Content-Type': 'application/json' }
        if (selectedModel.startsWith('custom-')) {
          const providerMap: Record<string, { lsKey: string; provider: string }> = {
            'custom-anthropic': { lsKey: 'fg_anthropic_key', provider: 'anthropic' },
            'custom-openai':    { lsKey: 'fg_openai_key',    provider: 'openai'    },
            'custom-google':    { lsKey: 'fg_google_key',    provider: 'google'    },
          }
          const cfg = providerMap[selectedModel]
          if (cfg) {
            const storedKey = typeof window !== 'undefined' ? localStorage.getItem(cfg.lsKey) : null
            if (storedKey) {
              chatHeaders['x-custom-api-key']  = storedKey
              chatHeaders['x-custom-provider'] = cfg.provider
            }
          }
        }

        // Include Studio session ID so AI knows camera position
        if (studioStatus.sessionId) {
          chatHeaders['x-studio-session'] = studioStatus.sessionId
        }

        // Build conversation history — include ALL user/assistant messages so
        // the AI remembers every build, every discussion, the full context
        const history = messages
          .filter((m) => m.role === 'user' || m.role === 'assistant')
          .slice(-50)
          .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))

        // Fire both in parallel: chat + optional mesh generation
        const chatPromise = fetch('/api/ai/chat', {
          method: 'POST',
          headers: chatHeaders,
          body: JSON.stringify({
            message: trimmed,
            history,
            model: selectedModel,
            gameContext: activeGame
              ? { id: activeGame.id, name: activeGame.name, genre: activeGame.genre, sessionId: studioStatus.sessionId }
              : studioStatus.sessionId ? { sessionId: studioStatus.sessionId } : null,
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

        // Handle token exhaustion — show upgrade card inline rather than a generic error
        if (chatRes.status === 402) {
          const errData = await chatRes.json() as { error?: string }
          if (errData.error === 'insufficient_tokens') {
            setMessages((prev) => {
              const without = prev.filter((m) => m.id !== statusMsg.id)
              return [
                ...without,
                {
                  id: uid(),
                  role: 'upgrade' as MessageRole,
                  content: '',
                  timestamp: new Date(),
                },
              ]
            })
            setLoading(false)
            return
          }
        }

        if (!chatRes.ok) throw new Error(`API error ${chatRes.status}`)

        const data = await chatRes.json() as {
          message?: string
          tokensUsed?: number
          buildResult?: BuildResult
          buildPlan?: BuildPlan
          suggestions?: string[]
          executedInStudio?: boolean
        }
        responseText = data.message ?? getDemoResponse(trimmed)
        tokensUsed = data.tokensUsed ?? tokensUsed
        const buildResult = data.buildResult
        const buildPlan = data.buildPlan

        // Clean AI response — strip suggestions blocks, JSON metadata, code fences
        let inlineSuggestions: string[] = []
        if (responseText) {
          // 1. Strip [SUGGESTIONS]...[/SUGGESTIONS] (with closing tag)
          const suggMatch1 = responseText.match(/\[SUGGESTIONS\]([\s\S]*?)\[\/SUGGESTIONS\]/i)
          if (suggMatch1) {
            inlineSuggestions = suggMatch1[1].split('\n').map((s) => s.replace(/^[-•*]\s*/, '').trim()).filter((s) => s.length > 0 && s.length < 120)
            responseText = responseText.replace(/\[SUGGESTIONS\][\s\S]*?\[\/SUGGESTIONS\]/i, '').trim()
          }
          // 2. Strip [SUGGESTIONS]...(end of string) (no closing tag)
          const suggMatch2 = responseText.match(/\[SUGGESTIONS\]([\s\S]*)$/i)
          if (suggMatch2) {
            const parsed = suggMatch2[1].split('\n').map((s) => s.replace(/^[-•*]\s*/, '').trim()).filter((s) => s.length > 0 && s.length < 120 && !s.startsWith('{'))
            if (parsed.length > 0 && inlineSuggestions.length === 0) inlineSuggestions = parsed
            responseText = responseText.replace(/\[SUGGESTIONS\][\s\S]*$/i, '').trim()
          }
          // 3. Strip any trailing JSON metadata blob like ","tokensUsed":0,...}
          responseText = responseText.replace(/[,\s]*"?(?:tokensUsed|"tokensUsed")["\s]*:\s*\d[\s\S]*$/m, '').trim()
          // 4. Strip any full JSON object at end of message { "tokensUsed": ... }
          responseText = responseText.replace(/\s*\{[^{}]*"tokensUsed"[^{}]*\}\s*$/m, '').trim()
          // 5. Strip orphaned closing braces/brackets
          responseText = responseText.replace(/\s*[}\]]\s*$/, '').trim()
        }

        // Store suggestions — prefer API field, fall back to inline block
        const finalSuggestions = (data.suggestions && data.suggestions.length > 0)
          ? data.suggestions
          : inlineSuggestions

        // Generate professional enhancement suggestions for this build and merge with
        // any suggestions the API returned — enhancements appear after API suggestions.
        if (responseText) {
          const enhancements = getContextualEnhancements(trimmed, responseText, 4)
          if (enhancements.length > 0) {
            const enhancementPrompts = enhancements.map((e: Enhancement) => e.prompt)
            setSuggestedReplies([...finalSuggestions, ...enhancementPrompts].slice(0, 6))
          } else {
            setSuggestedReplies(finalSuggestions)
          }
        } else {
          setSuggestedReplies(finalSuggestions)
        }

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

        // Parse Luau code into 3D parts for the Three.js viewport
        {
          const luauSource =
            buildResult?.luauCode ??
            meshData?.luauCode ??
            (() => {
              if (!responseText) return null
              return extractLuauBlocks(responseText) || null
            })()
          if (luauSource) {
            const newParts = parseLuauCode(luauSource)
            if (newParts.length > 0) {
              setParsedParts((prev) => [...prev, ...newParts])
            }
          }
        }

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
            ...(buildPlan ? { buildPlan } : {}),
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

        // Multi-step auto-continue — schedule the next step after 2s
        if (buildPlan?.autoNext && buildPlan.nextStepPrompt) {
          setActiveBuildPlan(buildPlan)
          setPendingNextStep(buildPlan.nextStepPrompt)
        } else if (buildPlan && !buildPlan.autoNext) {
          // Final step completed — clear the active plan
          setActiveBuildPlan(null)
          setPendingNextStep(null)
        }

        showToast({
          variant: 'success',
          title: buildPlan
            ? `Step ${buildPlan.currentStep} of ${buildPlan.totalSteps} done!`
            : 'Build complete!',
          description: buildPlan?.autoNext
            ? `Building step ${buildPlan.currentStep + 1} next...`
            : buildResult
            ? 'Copy the Luau code to import into Roblox Studio.'
            : 'AI response ready.',
          duration: buildPlan?.autoNext ? 2500 : 5000,
          ...(buildResult && !buildPlan?.autoNext ? {
            action: { label: 'View code', onClick: () => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) },
          } : {}),
        })

        // Save to build history
        {
          const rawCode = buildResult?.luauCode ?? meshData?.luauCode ?? (() => {
            if (!responseText) return null
            const m = responseText.match(/```(?:lua|luau)?\s*\n([\s\S]*?)```/)
            return m?.[1]?.trim() ?? null
          })()
          if (rawCode) {
            addBuild({
              title: trimmed.slice(0, 40) + (trimmed.length > 40 ? '…' : ''),
              description: trimmed,
              intent: 'other',
              luauCode: rawCode,
              tokensUsed,
              model: selectedModel,
            })
          }
        }

        // If Studio is actually connected (not demo), send Luau code to Studio for execution
        if (studioStatus.connected || connectFlow === 'connected') {
          // Extract Luau from buildResult, mesh data, OR from code blocks in the AI response
          let luauToExecute = buildResult?.luauCode ?? meshData?.luauCode ?? null
          if (!luauToExecute && responseText) {
            // Extract ```lua ... ``` code blocks from the AI response
            const codeMatch = responseText.match(/```(?:lua|luau)?\s*\n([\s\S]*?)```/)
            if (codeMatch?.[1]?.trim()) {
              luauToExecute = codeMatch[1].trim()
            }
          }
          if (luauToExecute) {
            setExecuteStatus('sending')
            setStudioActivity((prev) => [
              { id: uid(), message: `Sending build commands to Studio...`, timestamp: new Date() },
              ...prev.slice(0, 19),
            ])
            fetch('/api/studio/execute', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', ...(studioStatus.jwt ? { 'Authorization': `Bearer ${studioStatus.jwt}` } : {}) },
              body: JSON.stringify({ code: luauToExecute, prompt: trimmed, sessionId: studioStatus.sessionId }),
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
                // Auto-scan workspace 2s after execution so viewport + AI context update
                setTimeout(() => {
                  if (studioStatus.sessionId) {
                    fetch('/api/studio/scan', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ sessionId: studioStatus.sessionId }),
                    }).catch(() => {})
                  }
                }, 2000)
              })
          }
        }
      } catch (err) {
        // Show actual error in dev, graceful message in prod
        const errMsg = err instanceof Error ? err.message : 'Unknown error'
        console.error('[ForjeAI] Chat error:', errMsg)
        setMessages((prev) => {
          const without = prev.filter((m) => m.id !== statusMsg.id)
          return [
            ...without,
            {
              id: uid(),
              role: 'assistant',
              content: `I hit a snag — ${errMsg.includes('API error') ? 'the server returned an error' : 'couldn\'t reach the server'}. Try sending your message again.`,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loading, selectedModel, activeGame, studioStatus, setExecuteStatus, setStudioActivity, showToast, user, guestMessageCount, messages, addBuild],
  )

  // ── Multi-step auto-continue effect ──────────────────────────────────────
  // When a step finishes and pendingNextStep is set, wait 2s then fire the
  // next step automatically as if the user typed it.
  useEffect(() => {
    if (!pendingNextStep) return
    const timer = setTimeout(() => {
      setPendingNextStep(null)
      if (submitRef.current) {
        submitRef.current(pendingNextStep)
      }
    }, 2000)
    return () => clearTimeout(timer)
  }, [pendingNextStep])

  // ── Helper: extract last code block from messages ────────────────────────
  const getLastCodeBlock = useCallback((): string | null => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i]
      if (msg.role === 'assistant' && msg.content) {
        const match = msg.content.match(/```(?:lua|luau)?\s*\n([\s\S]*?)```/)
        if (match?.[1]?.trim()) return match[1].trim()
      }
      if (msg.buildResult?.luauCode) return msg.buildResult.luauCode
    }
    return null
  }, [messages])

  // Keep submitRef in sync so voice auto-submit works
  useEffect(() => { submitRef.current = submit }, [submit])

  // ── Helper: clear conversation ────────────────────────────────────────────
  const clearConversation = useCallback(() => {
    setMessages([{
      id: uid(),
      role: 'assistant',
      content: "Hey! I'm Forje — your game dev partner. Hit the mic and say \"build me a castle\" or type what you want. I'll build it right into Studio with pro details — window depth, lighting, plants, the works. Let's make something insane.",
      timestamp: new Date(),
    }])
    setSuggestedReplies([])
    setInput('')
    setSceneBlocks([])
    setParsedParts([])
    setTimeout(() => textareaRef.current?.focus(), 50)
  }, [])

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

      // Ctrl/Cmd+K — focus chat input; if textarea already focused, toggle command palette
      if (mod && e.key === 'k') {
        e.preventDefault()
        if (document.activeElement === textareaRef.current) {
          setPaletteOpen((v) => !v)
        } else {
          textareaRef.current?.focus()
        }
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
        const active = document.activeElement
        if (!active || active.tagName !== 'TEXTAREA') {
          e.preventDefault()
          submit(input)
        }
        return
      }

      // Ctrl+Shift+C — copy last code block
      if (mod && e.shiftKey && e.key === 'C') {
        e.preventDefault()
        const code = getLastCodeBlock()
        if (code) {
          void navigator.clipboard.writeText(code).then(() => {
            showToast({ variant: 'success', title: 'Copied', description: 'Last code block copied to clipboard.', duration: 2000 })
          })
        } else {
          showToast({ variant: 'info', title: 'No code yet', description: 'Generate a build first.', duration: 2000 })
        }
        return
      }

      // Ctrl+Shift+R — run last code in Studio
      if (mod && e.shiftKey && e.key === 'R') {
        e.preventDefault()
        const code = getLastCodeBlock()
        if (!code) {
          showToast({ variant: 'info', title: 'No code yet', description: 'Generate a build first.', duration: 2000 })
          return
        }
        if (!studioStatus.sessionId) {
          showToast({ variant: 'info', title: 'Studio not connected', description: 'Connect Studio first.', duration: 2500 })
          return
        }
        setExecuteStatus('sending')
        fetch('/api/studio/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, sessionId: studioStatus.sessionId }),
        })
          .then((r) => {
            setExecuteStatus(r.ok ? 'done' : 'error')
            showToast({ variant: r.ok ? 'success' : 'error', title: r.ok ? 'Sent to Studio' : 'Execution failed', duration: 3000 })
          })
          .catch(() => {
            setExecuteStatus('error')
            showToast({ variant: 'error', title: 'Studio unreachable', duration: 3000 })
          })
          .finally(() => setTimeout(() => setExecuteStatus('idle'), 3000))
        return
      }

      // Ctrl+N — new conversation
      if (mod && e.key === 'n') {
        e.preventDefault()
        clearConversation()
        return
      }

      // Escape — close slash menu first, then panel / deselect
      if (e.key === 'Escape') {
        if (slashMenuOpen) { setSlashMenuOpen(false); return }
        if (!paletteOpen && !shortcutsOpen) {
          setActivePanel(null)
          setSelectedObjectId(null)
          setPropertiesPanelOpen(false)
        }
        return
      }

      // Tool shortcuts (V/G/R/S) — only when not in a text input
      const activeEl = document.activeElement
      const inInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || (activeEl as HTMLElement).isContentEditable)
      if (!inInput && !mod) {
        if (e.key === 'v') { setActiveTool('select'); return }
        if (e.key === 'g') { setActiveTool('move'); return }
        if (e.key === 'r') { setActiveTool('rotate'); return }
        if (e.key === 's') { setActiveTool('scale'); return }
        if (e.key === 'Delete' || e.key === 'Backspace') {
          if (selectedObjectId) { handleDeleteObject(selectedObjectId); return }
        }
      }

      // Undo / Redo
      if (mod && e.key === 'z' && !e.shiftKey) { e.preventDefault(); handleUndo(); return }
      if (mod && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); handleRedo(); return }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paletteOpen, shortcutsOpen, slashMenuOpen, input, submit, getLastCodeBlock, clearConversation, studioStatus, showToast, selectedObjectId])

  // ── Textarea keydown: Enter to send, slash to trigger command menu ────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Slash at start of empty input → open slash menu
    if (e.key === '/' && input === '') {
      setSlashMenuOpen(true)
      setSlashFilter('')
      return
    }
    if (slashMenuOpen && e.key === 'Escape') {
      e.preventDefault()
      setSlashMenuOpen(false)
      return
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (slashMenuOpen) { setSlashMenuOpen(false) }
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
      {/* Build history — clock icon with badge */}
      <div className="relative">
        <IconBtn id="history" label="Build History" active={activePanel === 'history'} onClick={togglePanel}>
          <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M10 6.5v4l2.5 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </IconBtn>
        {buildHistory.length > 0 && (
          <span
            className="absolute flex items-center justify-center rounded-full text-[8px] font-bold pointer-events-none"
            style={{ top: 4, right: 4, width: 13, height: 13, background: '#D4AF37', color: '#030712' }}
          >
            {buildHistory.length > 9 ? '9+' : buildHistory.length}
          </span>
        )}
      </div>
    </>
  )

  const [studioPolling, setStudioPolling] = useState(false)
  const studioIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Studio status polling — on serverless, sessions are in-memory per Lambda.
  // Polling /status hits random Lambdas that don't have the session, returning
  // connected:false which causes a disconnect/reconnect loop.
  // Fix: once connected, DON'T overwrite connected state from server responses.
  // Only update non-connection fields (placeName, queueDepth, etc).
  const pollStudioStatus = useCallback(async () => {
    try {
      const sid = studioStatus.sessionId
      if (!sid) return
      const res = await fetch(`/api/studio/status?sessionId=${sid}`)
      if (!res.ok) return
      const data = await res.json() as StudioStatus
      setStudioStatus((prev) => {
        // If we're already connected, KEEP connected status regardless of
        // what the server says (serverless can't reliably track sessions)
        if (prev.connected) {
          return {
            ...prev,
            // Only update informational fields, never overwrite connected
            placeName: data.placeName ?? prev.placeName,
            placeId: data.placeId ?? prev.placeId,
            screenshotUrl: data.screenshotUrl ?? prev.screenshotUrl,
          }
        }
        return { ...data, sessionId: data.sessionId ?? prev.sessionId }
      })
    } catch {
      // Network error — don't crash, don't disconnect
    }
  }, [studioStatus.sessionId])

  // Screenshot polling (only when connected)
  const pollScreenshot = useCallback(async () => {
    try {
      const sid = studioStatus.sessionId
      if (!sid) return
      const res = await fetch(`/api/studio/screenshot?sessionId=${sid}`)
      if (!res.ok) return
      const data = await res.json() as {
        image: string | null
        beforeImage: string | null
        beforeImageAt: number | null
        capturedAt?: number
      }
      if (data.image) {
        // Crossfade: save current as prev before swapping
        setLiveScreenshot((prev) => {
          if (prev !== data.image) {
            setPrevScreenshot(prev)
            setScreenshotFading(true)
            // Clear fade flag after transition completes
            setTimeout(() => setScreenshotFading(false), 600)
          }
          return data.image
        })
      }
      if (data.beforeImage) {
        setBeforeScreenshot(data.beforeImage)
      }
      // After screenshot: if we have a before and the latest screenshot is newer
      // than beforeImageAt by at least 3s, treat it as the "after"
      if (data.beforeImage && data.image && data.beforeImageAt) {
        const afterAge = (data.capturedAt ?? Date.now()) - data.beforeImageAt
        if (afterAge > 2000 && afterAge < 300_000) {
          setAfterScreenshot(data.image)
          setShowComparison(true)
        }
      }
    } catch {
      // silently ignore
    }
  }, [studioStatus.sessionId])

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

  // ── Real Studio connection flow ──────────────────────────────────────────────
  type ConnectFlowState = 'idle' | 'generating' | 'code' | 'connected'
  const [connectFlow, setConnectFlow] = useState<ConnectFlowState>('idle')
  const [connectCode, setConnectCode] = useState<string>('')
  const [connectTimer, setConnectTimer] = useState<number>(300) // 5 min countdown
  const connectCodePollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const connectTimerRef    = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopConnectPolling = useCallback(() => {
    if (connectCodePollRef.current) { clearInterval(connectCodePollRef.current); connectCodePollRef.current = null }
    if (connectTimerRef.current)    { clearInterval(connectTimerRef.current);    connectTimerRef.current = null }
  }, [])

  // Stores the code + signed token from the last generate call so confirmStudioConnected
  // can look up the real sessionId created by the plugin's claim.
  const pendingConnectRef = useRef<{ code: string; token: string } | null>(null)

  const handleConnectToStudio = useCallback(async () => {
    setConnectFlow('generating')
    try {
      const res = await fetch('/api/studio/auth?action=generate')
      if (!res.ok) throw new Error('Failed to generate code')
      const data = await res.json() as { code: string; token?: string }
      setConnectCode(data.code)
      setConnectTimer(300)
      // Stash the signed token so confirmStudioConnected can retrieve the real sessionId
      pendingConnectRef.current = { code: data.code, token: data.token ?? '' }
      setConnectFlow('code')

      // Countdown timer
      connectTimerRef.current = setInterval(() => {
        setConnectTimer((t) => {
          if (t <= 1) {
            stopConnectPolling()
            setTimeout(() => handleConnectToStudio(), 100)
            return 300
          }
          return t - 1
        })
      }, 1000)

      // Poll for the plugin claiming the code. On serverless, the status poll may
      // miss the claim (different Lambda). So we also include the JWT if available.
      connectCodePollRef.current = setInterval(async () => {
        try {
          const code = pendingConnectRef.current?.code
          if (!code) return
          const statusRes = await fetch(`/api/studio/auth?action=status&code=${code}`)
          if (!statusRes.ok) return
          const statusData = await statusRes.json() as { status: string; claimed: boolean; sessionId?: string; placeName?: string; placeId?: string; jwt?: string }
          if (statusData.claimed && statusData.sessionId) {
            stopConnectPolling()
            setStudioStatus({
              connected: true,
              sessionId: statusData.sessionId,
              placeName: statusData.placeName ?? 'Roblox Studio',
              jwt: statusData.jwt ?? undefined,
            })
            setConnectFlow('connected')
            pendingConnectRef.current = null
            // Start heartbeat + screenshot polling now that we're connected
            handleStartPolling()
          }
        } catch {
          // Network error during polling — ignore, keep trying
        }
      }, 2000)
    } catch {
      setConnectFlow('idle')
    }
  }, [stopConnectPolling, handleStartPolling])

  // User manually clicks "I'm connected" — create a session via POST claim
  // Since Vercel serverless Lambdas don't share memory, status polling across
  // Lambdas fails. Instead, we POST claim the code ourselves to get a JWT.
  const confirmStudioConnected = useCallback(async () => {
    stopConnectPolling()
    const pending = pendingConnectRef.current
    let realSessionId: string | null = null
    let realPlaceName: string | undefined
    let jwt: string | undefined

    // Try status first (works if same Lambda handled the plugin's claim)
    if (pending?.code) {
      try {
        const statusRes = await fetch(`/api/studio/auth?action=status&code=${pending.code}`)
        if (statusRes.ok) {
          const d = await statusRes.json() as { claimed: boolean; sessionId?: string; placeName?: string; jwt?: string }
          if (d.claimed && d.sessionId) {
            realSessionId = d.sessionId
            realPlaceName = d.placeName
            jwt = d.jwt ?? undefined
          }
        }
      } catch { /* ignore */ }
    }

    // If status poll missed (different Lambda), claim the code directly
    // to create our own session with a fresh JWT
    if (!realSessionId && pending?.code && pending?.token) {
      try {
        const claimRes = await fetch('/api/studio/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: pending.code,
            token: pending.token,
            placeId: 'web-connect',
            placeName: 'Roblox Studio',
            pluginVer: '4.1.0',
          }),
        })
        if (claimRes.ok) {
          const d = await claimRes.json() as { token?: string; sessionId?: string }
          if (d.sessionId) {
            realSessionId = d.sessionId
            jwt = d.token
          }
        }
      } catch { /* ignore */ }
    }

    if (!realSessionId) realSessionId = 'manual-' + Date.now()

    setStudioStatus({
      connected: true,
      sessionId: realSessionId,
      placeName: realPlaceName ?? 'Roblox Studio',
      jwt: jwt,
    })
    setConnectFlow('connected')
    pendingConnectRef.current = null
    handleStartPolling()
  }, [stopConnectPolling, handleStartPolling])

  // Clean up on unmount
  useEffect(() => () => stopConnectPolling(), [stopConnectPolling])

  // Clear any stale fake connection from localStorage
  useEffect(() => {
    try { localStorage.removeItem('fg_studio_connection') } catch { /* ignore */ }
  }, [])

  // Derived: show connected viewport if actually connected OR in demo mode
  const studioConnected = studioStatus.connected || (connectFlow === 'connected' && studioStatus.sessionId !== null)

  // Banner: show only after the user has received at least one AI response AND is not connected
  const [bannerAutoConnect, setBannerAutoConnect] = useState(0)
  const hasAssistantMessage = messages.some((m) => m.role === 'assistant')
  const showStudioBanner = hasAssistantMessage && !studioConnected && !bannerDismissed

  const dismissBanner = useCallback(() => {
    setBannerDismissed(true)
    try { localStorage.setItem('fg_studio_banner_dismissed', '1') } catch { /* ignore */ }
  }, [])

  // Called from empty state card — un-dismisses and auto-triggers code generation
  const triggerStudioConnect = useCallback(() => {
    setBannerDismissed(false)
    try { localStorage.removeItem('fg_studio_banner_dismissed') } catch { /* ignore */ }
    setBannerAutoConnect((n) => n + 1)
  }, [])

  // Derived: viewport animation state for ViewportPreview
  const viewportState: ViewportState = showBuildOverlay
    ? 'building'
    : (sceneBlocks.length > 0 || parsedParts.length > 0)
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

  // ─── Scene object helpers ────────────────────────────────────────────────────

  const pushUndo = useCallback((snapshot: SceneObject[]) => {
    setUndoStack((prev) => [...prev.slice(-49), snapshot])
    setRedoStack([])
  }, [])

  const handleObjectChange = useCallback((id: string, patch: Partial<SceneObject>) => {
    setSceneObjects((prev) => {
      const snapshot = prev
      pushUndo(snapshot)
      return prev.map((o) => (o.id === id ? { ...o, ...patch } : o))
    })
  }, [pushUndo])

  const handleSelectObject = useCallback((id: string) => {
    setSelectedObjectId(id)
    setPropertiesPanelOpen(true)
  }, [])

  const handleDeleteObject = useCallback((id: string) => {
    setSceneObjects((prev) => {
      pushUndo(prev)
      return prev.filter((o) => o.id !== id)
    })
    if (selectedObjectId === id) {
      setSelectedObjectId(null)
      setPropertiesPanelOpen(false)
    }
  }, [pushUndo, selectedObjectId])

  const handleDuplicateObject = useCallback((id: string) => {
    setSceneObjects((prev) => {
      const obj = prev.find((o) => o.id === id)
      if (!obj) return prev
      pushUndo(prev)
      const clone: SceneObject = {
        ...obj,
        id: uid(),
        name: `${obj.name}_copy`,
        position: { x: obj.position.x + 4, y: obj.position.y, z: obj.position.z + 4 },
      }
      return [...prev, clone]
    })
  }, [pushUndo])

  const handleRenameObject = useCallback((id: string, name: string) => {
    setSceneObjects((prev) => prev.map((o) => (o.id === id ? { ...o, name } : o)))
  }, [])

  const handleUndo = useCallback(() => {
    setUndoStack((prev) => {
      if (prev.length === 0) return prev
      const snapshot = prev[prev.length - 1]
      setRedoStack((r) => [...r, sceneObjects])
      setSceneObjects(snapshot)
      return prev.slice(0, -1)
    })
  }, [sceneObjects])

  const handleRedo = useCallback(() => {
    setRedoStack((prev) => {
      if (prev.length === 0) return prev
      const snapshot = prev[prev.length - 1]
      setUndoStack((u) => [...u, sceneObjects])
      setSceneObjects(snapshot)
      return prev.slice(0, -1)
    })
  }, [sceneObjects])

  const handleAddObject = useCallback((type: SceneObject['type']) => {
    const newObj: SceneObject = {
      id: uid(),
      type,
      name: `${type.charAt(0).toUpperCase()}${type.slice(1)}_${Date.now().toString(36)}`,
      position: { x: 0, y: 0, z: 0 },
      size: { x: 4, y: 4, z: 4 },
      rotation: { x: 0, y: 0, z: 0 },
      color: '#C0C0C0',
      material: 'SmoothPlastic',
      transparency: 0,
      anchored: true,
      canCollide: true,
      castShadow: true,
      reflectance: 0,
      properties: type === 'script'
        ? { source: '-- New script\n\nlocal Players = game:GetService("Players")\n\n', runContext: 'Server' }
        : type === 'npc'
          ? { health: 100, walkSpeed: 16, dialogueText: 'Hello!', patrolRadius: 20 }
          : type === 'terrain'
            ? { biome: 'Grass', sizeX: 512, sizeZ: 512, heightScale: 0.5, waterLevel: 0, terrainMaterial: 'Grass' }
            : {},
    }
    setSceneObjects((prev) => {
      pushUndo(prev)
      return [...prev, newObj]
    })
    setSelectedObjectId(newObj.id)
    setPropertiesPanelOpen(true)
  }, [pushUndo])

  const selectedObject = sceneObjects.find((o) => o.id === selectedObjectId) ?? null

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
          from { opacity: 0; transform: translateX(-12px); }
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

      <div
      className="flex h-screen overflow-hidden"
      style={{
        height: '100dvh',
        background: THEME_BG_MAP[editorSettings.theme],
        fontSize: FONT_SIZE_MAP[editorSettings.fontSize],
      }}
    >

        {/* ── Left icon bar (desktop) ─────────────────────────────────────── */}
        <div className="hidden md:flex flex-col items-center gap-0.5 py-3 px-1 w-11 flex-shrink-0" style={{ background: '#09090b', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
          <Link href="/" title="Home" className="w-9 h-9 rounded-lg flex items-center justify-center mb-1 transition-colors text-zinc-600 hover:text-zinc-300">
            <svg className="w-[16px] h-[16px]" viewBox="0 0 20 20" fill="none">
              <path d="M3 9.5L10 3l7 6.5V17a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M7 18v-6h6v6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
          </Link>
          <div className="w-4 h-px mb-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
          {iconBarButtons}
        </div>

        {/* ── Left slide-out panel ────────────────────────────────────────── */}
        {activePanel && (
          <div className="hidden md:flex w-56 flex-col flex-shrink-0 overflow-hidden" style={{ background: '#111113', borderRight: '1px solid rgba(255,255,255,0.06)', animation: 'panel-slide-in 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <div className="flex items-center justify-between px-4 py-2.5 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">{PANEL_TITLE[activePanel]}</span>
              <button onClick={() => setActivePanel(null)} className="text-zinc-600 hover:text-zinc-300 transition-colors" aria-label="Close panel">
                <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto forge-scroll min-h-0">
              {activePanel === 'projects' && <ProjectsPanel activeGameId={activeGame?.id ?? null} onSelectGame={(g) => { setActiveGame(g); setActivePanel(null) }} />}
              {activePanel === 'assets'   && <MarketplacePanel onInsertAsset={(luau, name) => { submit(`Insert asset "${name}" into the build:\n\`\`\`lua\n${luau}\n\`\`\``) }} />}
              {activePanel === 'dna'      && <DnaPanel />}
              {activePanel === 'tokens'   && <TokensPanel tokensUsed={totalTokens} />}
              {activePanel === 'settings' && (
                <SettingsPanel
                  studioStatus={studioStatus}
                  totalTokens={totalTokens}
                  onDisconnect={() => { stopConnectPolling(); setStudioStatus({ connected: false }); setConnectFlow('idle') }}
                  onRescanWorkspace={() => {
                    if (studioStatus.sessionId) {
                      fetch('/api/studio/status?sessionId=' + studioStatus.sessionId).catch(() => {})
                    }
                  }}
                />
              )}
              {activePanel === 'history' && <BuildHistory style={{ height: '100%' }} />}
            </div>
          </div>
        )}

        {/* ── Mobile panel overlay ────────────────────────────────────────── */}
        {activePanel && (
          <div className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setActivePanel(null)} onKeyDown={(e) => { if (e.key === 'Escape') setActivePanel(null) }} role="presentation">
            <div className="absolute left-0 right-0 bottom-0 rounded-t-xl max-h-[70dvh] flex flex-col" style={{ background: '#111113', borderTop: '1px solid rgba(255,255,255,0.06)' }} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-4 py-2.5 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">{PANEL_TITLE[activePanel]}</span>
                <button onClick={() => setActivePanel(null)} className="w-8 h-8 flex items-center justify-center text-zinc-600 hover:text-zinc-300 transition-colors" aria-label="Close panel">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
                    <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto forge-scroll min-h-0">
                {activePanel === 'projects' && <ProjectsPanel activeGameId={activeGame?.id ?? null} onSelectGame={(g) => { setActiveGame(g); setActivePanel(null) }} />}
                {activePanel === 'assets'   && <MarketplacePanel onInsertAsset={(luau, name) => { submit(`Insert asset "${name}" into the build:\n\`\`\`lua\n${luau}\n\`\`\``) }} />}
                {activePanel === 'dna'      && <DnaPanel />}
                {activePanel === 'tokens'   && <TokensPanel tokensUsed={totalTokens} />}
                {activePanel === 'settings' && (
                <SettingsPanel
                  studioStatus={studioStatus}
                  totalTokens={totalTokens}
                  onDisconnect={() => { stopConnectPolling(); setStudioStatus({ connected: false }); setConnectFlow('idle') }}
                  onRescanWorkspace={() => {
                    if (studioStatus.sessionId) {
                      fetch('/api/studio/status?sessionId=' + studioStatus.sessionId).catch(() => {})
                    }
                  }}
                />
              )}
                {activePanel === 'history' && <BuildHistory style={{ height: '100%' }} />}
              </div>
            </div>
          </div>
        )}

        {/* ── Main content area ───────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* ── Top bar ──────────────────────────────────────────────────── */}
          <div className="flex items-center gap-3 px-4 h-10 flex-shrink-0" style={{ background: '#09090b', borderBottom: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 1px 0 rgba(255,255,255,0.03)' }}>
            {/* Mobile home */}
            <Link href="/" className="md:hidden w-7 h-7 flex items-center justify-center text-zinc-600 hover:text-zinc-300 transition-colors" aria-label="Home">
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
                <path d="M3 9.5L10 3l7 6.5V17a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
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
                  className="text-sm font-medium text-zinc-100 bg-transparent border-b border-[#D4AF37]/50 focus:outline-none px-0 py-0 w-40"
                />
              ) : (
                <button onClick={() => setEditingProjectName(true)} className="text-sm font-medium text-zinc-200 hover:text-white transition-colors truncate">
                  {projectName}
                </button>
              )}
              {activeGame && (
                <span className="text-[10px] text-zinc-600 hidden sm:block">{activeGame.genre}</span>
              )}
              <span
                className="text-[10px] px-1.5 py-0.5 rounded font-medium hidden sm:block"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#71717a' }}
              >
                Demo
              </span>
            </div>

            {/* Right: status + tokens */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${studioConnected ? 'bg-emerald-500' : 'bg-zinc-600'}`} style={studioConnected ? { boxShadow: '0 0 4px #10B981' } : {}} />
                <span className="text-[11px] text-zinc-500 hidden sm:block">{studioConnected ? 'Connected' : 'Not connected'}</span>
              </div>
              <span className="text-[11px] font-medium" style={{ color: '#D4AF37' }}>{1000 - totalTokens} tokens</span>
            </div>
          </div>

          {/* ── Two-column content ───────────────────────────────────────── */}
          <div className="flex-1 flex min-h-0 overflow-hidden">

            {/* ── LEFT: Chat ─────────────────────────────────────────────── */}
            {/* On mobile: full width (viewport is too narrow for split view).
                On tablet: 50vw. On desktop: capped at 420px. */}
            <div className="flex flex-col min-h-0 overflow-hidden flex-shrink-0"
              style={{
                width: 'clamp(280px, min(420px, 100vw), 100vw)',
                maxWidth: '100vw',
                borderRight: '1px solid rgba(255,255,255,0.06)',
                boxShadow: 'inset -1px 0 0 rgba(255,255,255,0.03)',
              }}
            >

              {/* Studio connect banner — visible when not connected and not dismissed */}
              {showStudioBanner && (
                <StudioConnectBanner
                  onDismiss={dismissBanner}
                  autoConnectSignal={bannerAutoConnect}
                />
              )}

              {/* ── New feature integrations (Game Type Selector, Build Progress,
                       AI Suggestions, Usage Dashboard, Studio banner) ── */}
              <EditorIntegrations
                onSendMessage={(msg) => submit(msg)}
                studioSessionId={studioStatus.sessionId}
                hasMessages={messages.some((m) => m.role === 'user')}
              />

              {/* Messages */}
              <div className="flex-1 overflow-y-auto forge-scroll px-4 py-5 space-y-4 min-h-0">
                {!messages.some((m) => m.role === 'user') && (
                  <EditorEmptyState
                    firstName={editorFirstName}
                    onSelectPrompt={(prompt) => submit(prompt)}
                  />
                )}
                {messages.map((msg) => (
                  <Message key={msg.id} msg={msg} studioConnected={studioConnected} studioSessionId={studioStatus.sessionId} studioJwt={studioStatus.jwt} />
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* ── Suggested reply chips ───────────────────────────────── */}
              {suggestedReplies.length > 0 && !loading && (
                <div
                  className="flex-shrink-0 px-3 py-2.5 flex flex-wrap gap-2"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
                >
                  {suggestedReplies.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => { setSuggestedReplies([]); submit(s) }}
                      className="text-xs px-3 py-1.5 rounded-full transition-all duration-200 hover:scale-105 active:scale-95"
                      style={{
                        background: 'rgba(212,175,55,0.08)',
                        border: '1px solid rgba(212,175,55,0.3)',
                        color: 'rgba(212,175,55,0.95)',
                        boxShadow: '0 0 8px rgba(212,175,55,0.08)',
                        animation: `word-fade-in 0.25s ease-out forwards`,
                        animationDelay: `${i * 60}ms`,
                        opacity: 0,
                      }}
                      onMouseEnter={(e) => {
                        const el = e.currentTarget
                        el.style.background = 'rgba(212,175,55,0.16)'
                        el.style.boxShadow = '0 0 14px rgba(212,175,55,0.2)'
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget
                        el.style.background = 'rgba(212,175,55,0.08)'
                        el.style.boxShadow = '0 0 8px rgba(212,175,55,0.08)'
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* ── Multi-step build progress indicator ─────────────────── */}
              {activeBuildPlan && (
                <div
                  className="flex-shrink-0 px-4 py-2 flex items-center gap-3"
                  style={{ borderTop: '1px solid rgba(212,175,55,0.12)', background: 'rgba(212,175,55,0.04)' }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-semibold truncate" style={{ color: '#D4AF37' }}>
                        {pendingNextStep
                          ? `Next: building step ${activeBuildPlan.currentStep + 1} of ${activeBuildPlan.totalSteps}...`
                          : `Multi-step build — step ${activeBuildPlan.currentStep} of ${activeBuildPlan.totalSteps}`}
                      </span>
                      <span className="text-[10px] flex-shrink-0 ml-2" style={{ color: '#71717a' }}>
                        {Math.round((activeBuildPlan.currentStep / activeBuildPlan.totalSteps) * 100)}%
                      </span>
                    </div>
                    <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.round((activeBuildPlan.currentStep / activeBuildPlan.totalSteps) * 100)}%`,
                          background: 'linear-gradient(90deg, #D4AF37, #FFB81C)',
                        }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => { setActiveBuildPlan(null); setPendingNextStep(null) }}
                    className="flex-shrink-0 text-[10px] px-2 py-0.5 rounded transition-opacity hover:opacity-70"
                    style={{ color: '#71717a', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    stop
                  </button>
                </div>
              )}

              {/* ── Flat input bar ───────────────────────────────────────── */}
              <div className="flex-shrink-0 relative" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 -1px 0 rgba(255,255,255,0.03)' }}>

                {/* ── Slash commands dropdown ──────────────────────────── */}
                {slashMenuOpen && (
                  <div
                    className="absolute bottom-full left-0 right-0 mx-3 mb-1 rounded-xl overflow-hidden z-50"
                    style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 -8px 32px rgba(0,0,0,0.5)' }}
                  >
                    <div className="px-3 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">Commands</span>
                    </div>
                    <ul className="py-1 max-h-56 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(212,175,55,0.2) transparent' }}>
                      {SLASH_COMMANDS.filter((cmd) =>
                        slashFilter === '' || cmd.command.includes(slashFilter) || cmd.description.toLowerCase().includes(slashFilter.toLowerCase())
                      ).map((cmd) => (
                        <li key={cmd.command}>
                          <button
                            onMouseDown={(e) => {
                              e.preventDefault()
                              if (cmd.immediate) {
                                setSlashMenuOpen(false)
                                if (cmd.command === '/clear') {
                                  clearConversation()
                                } else if (cmd.command === '/help') {
                                  setShortcutsOpen(true)
                                  setInput('')
                                } else if (cmd.command === '/export') {
                                  const code = getLastCodeBlock()
                                  if (code) {
                                    void navigator.clipboard.writeText(code).then(() => {
                                      showToast({ variant: 'success', title: 'Exported', description: 'Code copied to clipboard.', duration: 2000 })
                                    })
                                  } else {
                                    showToast({ variant: 'info', title: 'No code yet', description: 'Generate a build first.', duration: 2000 })
                                  }
                                  setInput('')
                                } else {
                                  // /optimize, /undo — submit as-is
                                  setInput('')
                                  submit(cmd.command)
                                }
                              } else {
                                setInput(cmd.command + ' ')
                                setSlashMenuOpen(false)
                                setTimeout(() => textareaRef.current?.focus(), 0)
                              }
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-white/5"
                          >
                            <span className="text-xs font-mono font-semibold flex-shrink-0" style={{ color: '#D4AF37', minWidth: 80 }}>{cmd.command}</span>
                            <span className="text-xs text-zinc-400 flex-1 truncate">{cmd.description}</span>
                            {cmd.placeholder && (
                              <span className="text-[10px] text-zinc-600 flex-shrink-0 hidden sm:block">{cmd.placeholder}</span>
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                    <div className="px-3 py-1.5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <span className="text-[10px] text-zinc-600">Type to filter · Enter to select · Esc to dismiss</span>
                    </div>
                  </div>
                )}

                {imageFile && (
                  <div className="flex items-center gap-2 px-4 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <svg className="w-3 h-3 text-zinc-500 flex-shrink-0" viewBox="0 0 16 16" fill="none">
                      <rect x="1" y="3" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                    </svg>
                    <span className="text-xs text-zinc-400 flex-1 min-w-0 truncate">{imageFile.name}</span>
                    <button onClick={() => setImageFile(null)} className="text-zinc-600 hover:text-zinc-300 transition-colors">
                      <svg className="w-3 h-3" viewBox="0 0 14 14" fill="none">
                        <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                )}

                <div className="flex items-end gap-2 px-3 py-2.5">
                  {/* Left tools */}
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    {/* Voice input — uses the new VoiceInputButton via EditorVoiceButton */}
                    <EditorVoiceButton
                      onSubmit={(text) => {
                        setInput((prev) => (prev.trim() ? `${prev} ${text}` : text))
                      }}
                      disabled={loading}
                    />
                    <button onClick={() => fileInputRef.current?.click()} aria-label="Upload image" className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-600 hover:text-zinc-300 transition-colors">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
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
                    onChange={(e) => {
                      const val = e.target.value
                      setInput(val)
                      // Update slash filter as user types after /
                      if (val.startsWith('/')) {
                        setSlashMenuOpen(true)
                        setSlashFilter(val.slice(1))
                      } else if (slashMenuOpen && !val.startsWith('/')) {
                        setSlashMenuOpen(false)
                      }
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={listening ? 'Listening...' : 'Describe what to build... or type / for commands'}
                    disabled={loading}
                    rows={1}
                    maxLength={4000}
                    className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none resize-none py-1.5 disabled:opacity-50"
                    style={{ minHeight: '32px', maxHeight: '120px' }}
                  />

                  {/* Character counter */}
                  {input.length > 0 && (
                    <span className={`flex-shrink-0 text-[10px] tabular-nums ${input.length >= 3800 ? 'text-red-400' : 'text-zinc-700'}`}>
                      {input.length}/4000
                    </span>
                  )}

                  {/* Send */}
                  <button
                    onClick={() => submit(input)}
                    disabled={!input.trim() || loading}
                    aria-label="Send message"
                    className={`flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center transition-colors ${input.trim() && !loading ? 'text-black' : 'text-zinc-700'}`}
                    style={input.trim() && !loading ? { background: '#D4AF37', boxShadow: '0 0 16px rgba(212,175,55,0.3)' } : { background: 'rgba(255,255,255,0.04)' }}
                  >
                    {loading ? (
                      <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 14 14" fill="none">
                        <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="8 8"/>
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none">
                        <path d="M2 7h10M7 2l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                </div>

                {/* ── Quick actions bar ────────────────────────────────── */}
                <div className="flex items-center gap-1.5 px-3 pb-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                  {POWER_QUICK_ACTIONS.map((action) => (
                    <button
                      key={action.label}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        if (action.prefix.trim() === '/optimize') {
                          setInput('')
                          submit('/optimize')
                        } else {
                          setInput(action.prefix)
                          setSlashMenuOpen(false)
                          setTimeout(() => textareaRef.current?.focus(), 0)
                        }
                      }}
                      className="flex-shrink-0 text-[10px] font-medium px-2.5 py-1 rounded-full transition-all hover:scale-105"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: '#71717a',
                      }}
                      onMouseEnter={(e) => {
                        const t = e.currentTarget
                        t.style.background = 'rgba(212,175,55,0.08)'
                        t.style.borderColor = 'rgba(212,175,55,0.2)'
                        t.style.color = 'rgba(212,175,55,0.9)'
                      }}
                      onMouseLeave={(e) => {
                        const t = e.currentTarget
                        t.style.background = 'rgba(255,255,255,0.04)'
                        t.style.borderColor = 'rgba(255,255,255,0.08)'
                        t.style.color = '#71717a'
                      }}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>

                {/* Model + hint row */}
                <div className="flex items-center gap-2 px-3 pb-2">
                  <ModelSelector value={selectedModel} onChange={setSelectedModel} />
                  {/* Gear icon — opens API key modal */}
                  <button
                    onClick={() => setApiKeysOpen(true)}
                    aria-label="Configure API keys"
                    className="flex items-center justify-center w-6 h-6 rounded-md transition-colors text-zinc-600 hover:text-[#D4AF37] hover:bg-white/5"
                    title="Connect your own API key"
                  >
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <circle cx="6.5" cy="6.5" r="2" stroke="currentColor" strokeWidth="1.3"/>
                      <path d="M6.5 1v1.2M6.5 10.8V12M1 6.5h1.2M10.8 6.5H12M2.7 2.7l.85.85M9.45 9.45l.85.85M9.45 3.55l-.85.85M3.55 9.45l-.85.85" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                  </button>
                  <div className="flex-1" />
                  {/* Tutorial button */}
                  <button
                    onClick={triggerOnboarding}
                    aria-label="Open tutorial"
                    title="Tutorial"
                    className="flex items-center justify-center w-5 h-5 rounded text-zinc-700 hover:text-zinc-400 transition-colors"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.3"/>
                      <path d="M6 5.5v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                      <circle cx="6" cy="3.5" r="0.65" fill="currentColor"/>
                    </svg>
                  </button>
                  {/* ? button — shortcuts overlay */}
                  <button
                    onClick={() => setShortcutsOpen(true)}
                    aria-label="Keyboard shortcuts"
                    title="Keyboard shortcuts (?)"
                    className="flex items-center justify-center w-5 h-5 rounded text-zinc-700 hover:text-zinc-400 transition-colors text-[11px] font-bold"
                    style={{ fontFamily: 'monospace' }}
                  >
                    ?
                  </button>
                  <span className="text-[10px] text-zinc-700 hidden lg:block">Enter to send</span>
                </div>
              </div>
            </div>

            {/* ── RIGHT: Studio Viewport — hidden on narrow screens (< 640px) ── */}
            <div className="hidden sm:flex flex-1 flex-col min-w-0 min-h-0 overflow-hidden">

              {/* Viewport area */}
              <div className="flex-1 relative min-h-0 overflow-hidden" style={{ boxShadow: 'inset 0 0 40px rgba(0,0,0,0.3)' }}>
                {/* 3D viewport with live Studio screenshot overlay */}
                <>
                  {showBuildOverlay && (
                    <ViewportPreview state="building" builtBlockCount={sceneBlocks.length} className="absolute inset-0 z-0" />
                  )}
                  <StudioLiveViewport
                    liveScreenshot={studioConnected ? liveScreenshot : null}
                    prevScreenshot={prevScreenshot}
                    screenshotFading={screenshotFading}
                    beforeScreenshot={beforeScreenshot}
                    afterScreenshot={afterScreenshot}
                    showComparison={showComparison}
                    sliderPos={sliderPos}
                    onSliderChange={setSliderPos}
                    onDismissComparison={() => setShowComparison(false)}
                    sliderDraggingRef={sliderDragging}
                  >
                    {parsedParts.length > 0 ? (
                      <Viewport3D
                        parts={parsedParts}
                        showGrid
                        className="absolute inset-0"
                      />
                    ) : (
                      <Viewport sceneBlocks={sceneBlocks} />
                    )}
                  </StudioLiveViewport>

                  {/* Top-right: Connect Studio button — larger tap target on mobile */}
                  <div className="absolute top-2 right-2 md:top-3 md:right-3 z-20">
                    {studioConnected ? (
                      <div className="flex items-center gap-2 px-3 py-2 md:py-1.5 rounded-lg text-[11px]"
                        style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#10B981', boxShadow: '0 0 4px #10B981' }} />
                        <span className="text-emerald-400 font-medium">Studio Connected</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          handleConnectToStudio().then(() => {})
                        }}
                        className="flex items-center gap-2 px-3 py-2 md:py-1.5 rounded-lg text-[11px] font-medium transition-all hover:brightness-110 active:scale-95"
                        style={{ background: '#D4AF37', color: '#030712', minHeight: 36 }}
                      >
                        <svg className="w-3.5 h-3.5 md:w-3 md:h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                        </svg>
                        Connect Studio
                      </button>
                    )}
                  </div>

                  {/* Connection code overlay — shown when generating/code state */}
                  {(connectFlow === 'generating' || connectFlow === 'code') && (
                    <div className="absolute top-12 right-3 z-20 w-64">
                      <div className="rounded-xl p-4" style={{ background: 'rgba(9,9,11,0.95)', border: '1px solid rgba(212,175,55,0.2)', backdropFilter: 'blur(8px)' }}>
                        {connectFlow === 'generating' ? (
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-zinc-400 animate-spin" viewBox="0 0 24 24" fill="none">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="40 20" strokeLinecap="round"/>
                            </svg>
                            <span className="text-xs text-zinc-400">Generating code...</span>
                          </div>
                        ) : (
                          <>
                            <p className="text-[10px] text-zinc-500 mb-2">Enter this code in the Studio plugin:</p>
                            <div className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 mb-3"
                              style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.25)' }}>
                              <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 22, fontWeight: 700, letterSpacing: '0.15em', color: '#D4AF37' }}>
                                {connectCode}
                              </span>
                              <CodeCopyButton code={connectCode} />
                            </div>
                            <button
                              onClick={confirmStudioConnected}
                              className="w-full py-2 rounded-lg text-xs font-semibold transition-all hover:brightness-110"
                              style={{ background: '#10B981', color: '#fff' }}
                            >
                              I&apos;ve entered the code ✓
                            </button>
                            <div className="flex items-center justify-center gap-2 mt-2">
                              <span className="text-[10px] text-zinc-600">
                                {Math.floor(connectTimer / 60)}:{String(connectTimer % 60).padStart(2, '0')}
                              </span>
                              <button onClick={() => { stopConnectPolling(); setConnectFlow('idle') }} className="text-[10px] text-zinc-700 hover:text-zinc-400">Cancel</button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Build info overlay — bottom bar */}
                  <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
                    <div className="p-3 pointer-events-auto" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.8) 40%)' }}>
                      {/* Stats row */}
                      <div className="flex items-center gap-4 mb-1.5">
                        <span className="text-[10px] text-zinc-400">
                          <span className="text-zinc-200 font-semibold">
                            {parsedParts.length > 0 ? parsedParts.length : sceneBlocks.length}
                          </span> objects
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          <span className="text-zinc-200 font-semibold">{totalTokens}</span> tokens used
                        </span>
                        {studioConnected && (
                          <span className="flex items-center gap-1.5 text-[10px]">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#10B981', boxShadow: '0 0 4px #10B981' }} />
                            <span className="text-emerald-400">Studio connected</span>
                          </span>
                        )}
                      </div>
                      {/* Hint */}
                      <p className="text-[10px] text-zinc-600">
                        Ask AI to build → click &quot;Import to Studio&quot; on the code → paste in a Script in Studio
                      </p>
                    </div>
                  </div>
                </>

                {/* ── AI Context Panel ──────────────────────────────────────── */}
                <AIContextPanel
                  studioConnected={studioConnected}
                  studioContext={null}
                  onSendToChat={(msg) => submit(msg)}
                />

                {/* Legacy panels removed — viewport is always visible now */}
                {false && (
                    <div>

                      {/* Commands counter */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] text-zinc-500">Commands sent</span>
                        <span className="text-[11px] font-mono text-zinc-300">{studioActivity.length}</span>
                      </div>

                      {/* Recent activity */}
                      {studioActivity.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-2">Recent Activity</p>
                          {[...studioActivity].reverse().slice(0, 5).map((a) => (
                            <div key={a.id} className="flex items-start gap-2 px-2.5 py-2 rounded-md" style={{ background: 'rgba(255,255,255,0.02)' }}>
                              <span className="w-1 h-1 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                              <p className="text-[11px] text-zinc-400 leading-relaxed">{a.message}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
              </div>
            </div>

          </div>

          {/* ── Mobile bottom bar — Chat/Preview tabs + icon buttons */}
          <div
            className="md:hidden flex-shrink-0"
            style={{ background: '#09090b', borderTop: '1px solid rgba(255,255,255,0.06)', paddingBottom: 'env(safe-area-inset-bottom, 4px)' }}
          >
            {/* Tab switcher */}
            <div className="flex items-center px-2 pt-1.5 gap-1">
              <button
                onClick={() => setMobileTab('chat')}
                aria-label="Chat panel"
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  minHeight: 44,
                  background: mobileTab === 'chat' ? 'rgba(212,175,55,0.12)' : 'transparent',
                  color: mobileTab === 'chat' ? '#D4AF37' : '#71717a',
                  border: mobileTab === 'chat' ? '1px solid rgba(212,175,55,0.25)' : '1px solid transparent',
                }}
              >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="none">
                  <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v7a2 2 0 01-2 2H7l-4 3V5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                </svg>
                Chat
              </button>
              <button
                onClick={() => setMobileTab('preview')}
                aria-label="3D preview"
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  minHeight: 44,
                  background: mobileTab === 'preview' ? 'rgba(212,175,55,0.12)' : 'transparent',
                  color: mobileTab === 'preview' ? '#D4AF37' : '#71717a',
                  border: mobileTab === 'preview' ? '1px solid rgba(212,175,55,0.25)' : '1px solid transparent',
                }}
              >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="none">
                  <rect x="2" y="4" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M2 8h16" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                Preview
                {(parsedParts.length > 0 || sceneBlocks.length > 0) && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(212,175,55,0.2)', color: '#D4AF37' }}>
                    {parsedParts.length > 0 ? parsedParts.length : sceneBlocks.length}
                  </span>
                )}
              </button>
            </div>
            {/* Tool icon buttons row */}
            <div className="flex items-center justify-around px-2 py-1">
              {iconBarButtons}
            </div>
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

      {/* ── API Keys Modal ─────────────────────────────────────────────────── */}
      {apiKeysOpen && (
        <ApiKeysModal onClose={() => setApiKeysOpen(false)} />
      )}

      {/* ── Onboarding overlay ─────────────────────────────────────────────── */}
      {showOnboarding && (
        <OnboardingOverlay onComplete={dismissOnboarding} onSkip={dismissOnboarding} />
      )}

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
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm"
            style={{
              background: '#111113',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <span className="text-[12px] text-zinc-400">
              Press{' '}
              <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#a1a1aa' }}>
                Ctrl+K
              </kbd>
              {' '}for command palette, or{' '}
              <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#a1a1aa' }}>
                Ctrl+/
              </kbd>
              {' '}for shortcuts
            </span>
            <button
              onClick={() => { setTipToastVisible(false); setTimeout(() => setShowTipToast(false), 400) }}
              className="text-zinc-700 hover:text-zinc-400 transition-colors flex-shrink-0 ml-1"
              aria-label="Dismiss tip"
            >
              <svg className="w-3 h-3" viewBox="0 0 14 14" fill="none">
                <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  )
}
