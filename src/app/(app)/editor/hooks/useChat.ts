'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useWebSocket } from '@/hooks/useWebSocket'
import { playCompletionSound } from '@/lib/sounds'
import {
  createCheckpoint as createCp,
  restoreCheckpoint as restoreCp,
  getCheckpoints as getCps,
  deleteCheckpoint as deleteCp,
  type Checkpoint,
} from '@/lib/checkpoints'

// ─── Chat Session Persistence ─────────────────────────────────────────────────

const LS_SESSIONS_KEY = 'fg_chat_sessions'
const MAX_SESSIONS = 20
/** Active-conversation key: always holds the last 50 non-streaming messages */
const LS_ACTIVE_KEY = 'fg_chat_messages_v1'
const MAX_ACTIVE_MESSAGES = 50

export interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: string
  updatedAt: string
}

export interface ChatSessionMeta {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  messageCount: number
  firstAiPreview: string | null
}

/** Metadata returned by the cloud GET /api/sessions endpoint. */
export interface CloudSessionMeta {
  id: string
  title: string
  aiMode: string
  model: string
  createdAt: string
  updatedAt: string
  _count: { messages: number }
}

export function loadSessions(): ChatSession[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(LS_SESSIONS_KEY)
    return raw ? (JSON.parse(raw) as ChatSession[]) : []
  } catch {
    return []
  }
}

function saveSessions(sessions: ChatSession[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(LS_SESSIONS_KEY, JSON.stringify(sessions))
  } catch { /* quota exceeded — silently ignore */ }
}

// Strip filler prefixes so the title reads as the subject, not the command
const TITLE_STRIP_PREFIXES = /^(build\s+me\s+(a\s+)?|create\s+(a\s+)?|make\s+(a\s+)?|generate\s+(a\s+)?|add\s+(a\s+)?|design\s+(a\s+)?|can\s+you\s+(build|create|make|generate)\s+(a\s+)?)/i

function makeSessionTitle(messages: ChatMessage[]): string {
  const first = messages.find((m) => m.role === 'user')
  if (!first) return 'New Chat'
  const cleaned = first.content.replace(/^\[AUTO-RETRY[^\]]*\]\s*/, '').trim()
  const stripped = cleaned.replace(TITLE_STRIP_PREFIXES, '').trim()
  const title = stripped || cleaned
  // Capitalise first letter
  return (title.charAt(0).toUpperCase() + title.slice(1)).slice(0, 45) || 'New Chat'
}

/** Persist a set of messages as a session. Creates or updates by id. */
function persistSession(sessionId: string, messages: ChatMessage[]): void {
  if (messages.filter((m) => m.role === 'user').length === 0) return
  const sessions = loadSessions()
  const existingIdx = sessions.findIndex((s) => s.id === sessionId)
  const now = new Date().toISOString()
  const title = makeSessionTitle(messages)
  const session: ChatSession = {
    id: sessionId,
    title,
    messages,
    createdAt: existingIdx >= 0 ? sessions[existingIdx].createdAt : now,
    updatedAt: now,
  }
  if (existingIdx >= 0) {
    sessions[existingIdx] = session
  } else {
    sessions.unshift(session)
    // Keep only last MAX_SESSIONS — oldest (end of array) are removed
    while (sessions.length > MAX_SESSIONS) sessions.pop()
  }
  saveSessions(sessions)
  // Cloud persistence is now handled by debouncedCloudSave() in the hook,
  // called after each AI response with a 2-second debounce delay.
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type MessageRole = 'user' | 'assistant' | 'system' | 'status' | 'upgrade' | 'signup' | 'build-error' | 'build-preview'

export type ModelId =
  | 'auto'
  | 'claude-sonnet-4'
  | 'gpt-4o'
  | 'gemini-flash'
  | 'groq-llama'
  // Legacy IDs kept for backward compat with persisted sessions
  | 'claude-4'
  | 'claude-3-5'
  | 'gemini-2'
  | 'gpt-4o-mini'
  | 'o1-preview'
  | 'gpt-4o-codex'
  | 'grok-3'
  | 'custom-anthropic'
  | 'custom-openai'
  | 'custom-google'

export interface ModelOption {
  id: ModelId
  label: string
  provider: string
  color: string
  badge?: string
  /** Whether this model is available on the free tier */
  free?: boolean
  /** Whether this model requires a paid subscription */
  premium?: boolean
  /** Short description shown in the selector */
  description?: string
}

export interface MeshResult {
  meshUrl: string | null
  glbUrl: string | null
  fbxUrl: string | null
  thumbnailUrl: string | null
  polygonCount: number | null
  status: string
  taskId?: string
  luauCode: string | null
}

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  tokensUsed?: number
  timestamp: Date
  model?: string
  suggestions?: string[]
  intent?: string
  hasCode?: boolean
  streaming?: boolean
  /** Raw Luau code extracted from AI response — used for build preview rendering */
  luauCode?: string
  /** Set on 'build-error' messages — the raw Studio error text */
  buildError?: string
  /** Set on 'build-error' messages — which attempt number this was (1-based) */
  retryAttempt?: number
  /** 3D mesh generated alongside this response */
  meshResult?: MeshResult
  /** Set on 'upgrade' messages — current token balance (for "X left") display */
  tokenBalance?: number
  /** Set on 'upgrade' messages — tokens the failed request required (for "needed Y" display) */
  tokenRequired?: number
  /** Whether this message's code was successfully sent to and executed in Roblox Studio */
  executedInStudio?: boolean
  /** Pre-build preview options — 3 concepts for the user to pick from */
  buildOptions?: BuildPreviewOption[]
  /** Quality score from verification pipeline (0-100) — shown as post-build feedback */
  qualityScore?: number
  /** Number of parts in the generated build code */
  buildPartCount?: number
}

export interface BuildPreviewOption {
  name: string
  description: string
  features: string[]
  materials: string[]
  estimatedParts: number
  style: string  // e.g. "detailed", "low-poly", "realistic"
}

/** Primary user-facing model options shown in the model selector dropdown. */
export const MODELS: ModelOption[] = [
  {
    id: 'auto',
    label: 'Auto',
    provider: 'Forje',
    color: '#D4AF37',
    badge: 'DEFAULT',
    free: true,
    description: 'Smart routing — picks the best available model',
  },
  {
    id: 'claude-sonnet-4',
    label: 'Claude Sonnet 4',
    provider: 'Anthropic',
    color: '#CC785C',
    badge: 'PRO',
    premium: true,
    description: 'Best quality — complex builds & reasoning',
  },
  {
    id: 'gpt-4o',
    label: 'GPT-4o',
    provider: 'OpenAI',
    color: '#10A37F',
    badge: 'PRO',
    premium: true,
    description: 'Fast & capable — great for code generation',
  },
  {
    id: 'gemini-flash',
    label: 'Gemini Flash',
    provider: 'Google',
    color: '#4285F4',
    badge: 'FREE',
    free: true,
    description: 'Free tier — good for simple builds',
  },
  {
    id: 'groq-llama',
    label: 'Groq Llama',
    provider: 'Groq',
    color: '#F55036',
    badge: 'FREE',
    free: true,
    description: 'Free tier — ultra-fast responses',
  },
]

const GUEST_TOKEN_LIMIT = 100 // guests get 100 free tokens before signup required

const BUILD_KEYWORDS = [
  'build', 'create', 'make', 'generate', 'design', 'place', 'add', 'put',
  'spawn', 'set up', 'construct', 'craft', 'model', 'terrain', 'map',
  'house', 'castle', 'city', 'town', 'village', 'forest', 'mountain',
  'island', 'cave', 'bridge', 'tower', 'shop', 'cafe', 'lab', 'hub',
  'arena', 'dungeon', 'temple', 'park', 'garden', 'road', 'street',
  'tree', 'rock', 'lamp', 'bench', 'fence', 'wall', 'door', 'window',
  'console', 'machine', 'vehicle', 'boat', 'car', 'sword', 'weapon',
  'furniture', 'table', 'chair', 'bed', 'shelf', 'counter',
]

function uid() {
  return Math.random().toString(36).slice(2, 9)
}

function estimateTokens(text: string): number {
  return Math.max(8, Math.ceil(text.split(/\s+/).length * 1.3))
}

const DEMO_RESPONSES: Record<string, string> = {
  castle:  'Castle placed at map center. Added 4 towers (32 studs tall), a main great hall, iron portcullis, and a water moat with drawbridge mechanics.',
  forest:  'Forest biome generated. 847 trees, 23 boulders, and 12 fallen logs placed across the eastern quadrant. Fog density set to 0.35.',
  npc:     'NPC spawned near town square. Patrol radius: 40 studs. Equipped with idle, walk, and interact animations. Dialogue system with 3 greeting variants.',
  terrain: 'Terrain sculpted: rolling hills with a river valley cutting north-south. Baseplate 2048×2048 studs. Water plane at Y=0 with foam shader.',
  city:    'City district built: 12 buildings (3-8 floors), road grid with crosswalks, 24 street lights, 3 pocket parks. 400×400 stud footprint.',
  dungeon: 'Dungeon generated: 14-room procedural layout, spike traps on 3 tiles, pressure plates, 2 locked doors with key items, torch lighting.',
  default: 'Command received. Connect ForjeGames plugin to enable live execution in Roblox Studio.',
}

function getDemoResponse(prompt: string): string {
  const lower = prompt.toLowerCase()
  for (const [key, response] of Object.entries(DEMO_RESPONSES)) {
    if (key !== 'default' && lower.includes(key)) return response
  }
  return DEMO_RESPONSES.default
}

// ─── Stream reader ─────────────────────────────────────────────────────────────
//
// The /api/ai/chat route (when stream:true) sends raw UTF-8 text chunks, then
// a final sentinel chunk prefixed with \x00 that contains JSON metadata:
//   { __meta: true, suggestions, intent, hasCode, tokensUsed, ... }
//
// This function reads the stream and calls onChunk for each text piece, then
// returns the parsed metadata when the stream ends.

export interface McpAgentResult {
  server: string
  tool: string
  success: boolean
  demo: boolean
  warning?: string
}

interface StreamMeta {
  suggestions?: string[]
  intent?: string
  hasCode?: boolean
  tokensUsed?: number
  executedInStudio?: boolean
  model?: string
  error?: string
  mcpResult?: McpAgentResult
  meshResult?: MeshResult
  qualityScore?: number
  buildPartCount?: number
}

async function readStream(
  body: ReadableStream<Uint8Array>,
  onChunk: (text: string) => void,
): Promise<StreamMeta> {
  const reader = body.getReader()
  const dec = new TextDecoder()
  let metaResult: StreamMeta = {}
  // Accumulates bytes that have not yet been emitted as text or parsed as meta.
  // Critical: the \x00{json} sentinel can be split across two read() calls —
  // e.g. chunk N ends with \x00 and chunk N+1 carries the JSON body. Without
  // this buffer the JSON would be lost and meta would silently fall back to {}.
  let leftover = ''

  try {
    while (true) {
      const { done, value } = await reader.read()

      // On stream end, flush any remaining bytes the TextDecoder was holding
      // for multi-byte UTF-8 sequences (emoji, CJK, etc.) and append to leftover.
      if (done) {
        const flushed = dec.decode() // no args = flush buffered bytes
        if (flushed) leftover += flushed
        // If the sentinel arrived in a prior chunk and leftover now holds the
        // JSON tail, try to parse it.
        const sentinelIdx = leftover.indexOf('\x00')
        if (sentinelIdx !== -1) {
          const textPart = leftover.slice(0, sentinelIdx)
          const jsonPart = leftover.slice(sentinelIdx + 1)
          if (textPart) onChunk(textPart)
          try { metaResult = JSON.parse(jsonPart) as StreamMeta } catch { /* malformed */ }
        } else if (leftover) {
          onChunk(leftover)
        }
        break
      }

      // Decode with stream:true so multi-byte chars spanning chunks aren't broken.
      const raw = leftover + dec.decode(value, { stream: true })
      leftover = ''

      // The sentinel is a \x00-prefixed JSON blob. It may arrive mid-buffer.
      // Split on the FIRST \x00 only.
      const sentinelIdx = raw.indexOf('\x00')
      if (sentinelIdx !== -1) {
        const textPart = raw.slice(0, sentinelIdx)
        const jsonPart = raw.slice(sentinelIdx + 1)
        if (textPart) onChunk(textPart)
        // jsonPart may be incomplete if the JSON spans into the next chunk.
        // Attempt a parse; if it fails, buffer it and keep reading.
        try {
          metaResult = JSON.parse(jsonPart) as StreamMeta
          break // sentinel fully consumed — stop reading
        } catch {
          // JSON was split across chunks — keep the partial in leftover and
          // continue reading until stream ends or another parse succeeds.
          leftover = '\x00' + jsonPart
          continue
        }
      }

      onChunk(raw)
    }
  } catch {
    // Stream was aborted (e.g. Vercel function timeout, network error).
    // Flush whatever text we accumulated so the user sees partial content
    // instead of a crash. metaResult stays {} which is safe.
    if (leftover) {
      const sentinelIdx = leftover.indexOf('\x00')
      if (sentinelIdx !== -1) {
        const textPart = leftover.slice(0, sentinelIdx)
        if (textPart) onChunk(textPart)
      } else {
        onChunk(leftover)
      }
    }
  } finally {
    try { reader.cancel() } catch { /* ignore */ }
  }

  return metaResult
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface StudioContextForChat {
  camera?: { posX: number; posY: number; posZ: number; lookX: number; lookY: number; lookZ: number } | null
  partCount?: number
  modelCount?: number
  lightCount?: number
  nearbyParts?: { name: string; className: string; position: string; size: string; material: string; color?: string; parent?: string }[]
  selection?: { name: string; className: string; path: string; position?: string; size?: string; material?: string; color?: string }[]
  sceneTree?: { name: string; className: string; position?: string; childCount?: number }[]
  groundY?: number
}

interface UseChatOptions {
  /** Called after each AI response with the Luau code, if any */
  onBuildComplete?: (luauCode: string, prompt: string, sessionId: string | null) => void
  studioSessionId?: string | null
  studioConnected?: boolean
  studioContext?: StudioContextForChat
}

export type { AIMode } from '@/components/editor/AIModeSelector'
import type { AIMode } from '@/components/editor/AIModeSelector'
export type { Checkpoint } from '@/lib/checkpoints'

export function useChat(options: UseChatOptions = {}) {
  const { user } = useUser()
  const { onBuildComplete, studioSessionId, studioConnected, studioContext } = options
  const { connected: wsConnected, send: wsSend, on: wsOn, ws: wsInstance } = useWebSocket()

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState(false)

  // Global abort controller for stopping generation
  const activeAbortRef = useRef<AbortController | null>(null)
  useEffect(() => {
    const handler = () => {
      if (activeAbortRef.current) {
        activeAbortRef.current.abort()
        activeAbortRef.current = null
      }
      setLoading(false)
      setStreaming(false)
      // Remove the status message
      setMessages(prev => prev.filter(m => m.role !== 'status'))
    }
    window.addEventListener('forje-stop-generating', handler)
    return () => window.removeEventListener('forje-stop-generating', handler)
  }, [])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [lastMcpResult, setLastMcpResult] = useState<McpAgentResult | null>(null)
  const [selectedModel, setSelectedModelRaw] = useState<ModelId>(() => {
    if (typeof window === 'undefined') return 'auto'
    const stored = localStorage.getItem('forje_preferred_model')
    // Validate that stored value is a known model ID
    if (stored && MODELS.some((m) => m.id === stored)) return stored as ModelId
    return 'auto'
  })
  const setSelectedModel = useCallback((id: ModelId) => {
    setSelectedModelRaw(id)
    try { localStorage.setItem('forje_preferred_model', id) } catch { /* quota exceeded */ }
  }, [])
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [totalTokens, setTotalTokens] = useState(0)
  const [guestMessageCount, setGuestMessageCount] = useState(0)
  // AI Mode state — determines how prompts are processed
  const [aiMode, setAIMode] = useState<AIMode>('build')
  // Auto-playtest: when true, agentic playtest runs automatically after code is sent to Studio
  const [autoPlaytest, setAutoPlaytest] = useState(true)
  // Pre-build preview: when true, shows 3 concept options before generating code
  const [previewMode, setPreviewMode] = useState(false)
  const autoPlaytestAbortRef = useRef<AbortController | null>(null)
  // Thinking/reasoning display state
  const [isThinking, setIsThinking] = useState(false)
  const [thinkingText, setThinkingText] = useState('')
  // Plan mode state
  const [planText, setPlanText] = useState<string | null>(null)
  // Prompt enhancement toggle — when true, prompts are enhanced via Groq before main AI
  const [enhancePrompts, setEnhancePrompts] = useState(true)
  /**
   * Image-mode options (BUG 9). Surfaced in ChatPanel via a toggle row when
   * aiMode === 'image'. `style` = 'auto' lets the keyword detector choose a
   * preset; any other value is passed straight to /api/ai/image.
   */
  const [imageOptions, setImageOptions] = useState<{
    style: string
    removeBackground: boolean
    upscale: boolean
  }>({ style: 'auto', removeBackground: false, upscale: false })
  /** Epoch-ms timestamp bumped each time messages are written to localStorage. Used by ChatPanel to flash the "Saved" indicator. */
  const [savedAt, setSavedAt] = useState(0)
  /** Cloud sessions fetched from GET /api/sessions — populated on mount and after sync. */
  const [cloudSessions, setCloudSessions] = useState<CloudSessionMeta[]>([])
  /** Debounce timer ref for cloud persistence — 2 second delay after last AI response. */
  const cloudSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // ─── Checkpoint state ─────────────────────────────────────────────────────
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([])
  // Completion sound toggle — when true, a chime plays after each successful AI response
  const [soundEnabled, setSoundEnabled] = useState(true)
  const soundEnabledRef = useRef(true)
  useEffect(() => { soundEnabledRef.current = soundEnabled }, [soundEnabled])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const retryListenerRef = useRef(false)

  // Completion sound — delegates to the shared sounds utility (src/lib/sounds.ts)
  // Respects the per-session sound toggle via soundEnabledRef.
  const playCompletionSoundIfEnabled = useCallback(() => {
    if (!soundEnabledRef.current) return
    playCompletionSound()
  }, [])
  // Stable ID for the current chat session — new id on each "new chat"
  const _initialSessionId = uid()
  const currentSessionIdRef = useRef<string>(_initialSessionId)
  const [currentSessionId, setCurrentSessionId] = useState<string>(_initialSessionId)
  /** Update both the ref (for synchronous access inside callbacks) and the state (to trigger re-renders). */
  const setSessionId = useCallback((id: string) => {
    currentSessionIdRef.current = id
    setCurrentSessionId(id)
  }, [])
  // Tracks whether the hook is still mounted; guards async callbacks that call setState.
  const mountedRef = useRef(true)
  // Ref used to read current messages inside async callbacks without stale closure
  const messagesRef = useRef<ChatMessage[]>([])
  // Auto-retry cap: tracks how many consecutive Studio execution errors have been
  // auto-fixed for the CURRENT build. Reset to 0 when the user sends a new message.
  const retryCountRef = useRef(0)
  // The last Luau code sent to Studio — passed back on retry so the AI has full context
  const lastLuauRef = useRef<string | null>(null)
  // The original user prompt that triggered the current build
  const lastBuildPromptRef = useRef<string>('')
  // When true, the next sendMessage call is an internal auto-retry — skip the retry counter reset
  const isAutoRetryRef = useRef(false)
  // Pending error context to inject into the next request body (set before calling sendMessage on retry)
  const pendingLastErrorRef = useRef<string | null>(null)
  const pendingRetryAttemptRef = useRef<number>(0)
  const pendingPreviousCodeRef = useRef<string | null>(null)

  // Mark unmounted so in-flight async callbacks don't call setState after cleanup.
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      // Clear any pending cloud save timer on unmount
      if (cloudSaveTimerRef.current) clearTimeout(cloudSaveTimerRef.current)
    }
  }, [])

  // ─── Cloud session helpers ──────────────────────────────────────────────────────

  /** Fetch cloud sessions from GET /api/sessions and update state. */
  const fetchCloudSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/sessions')
      if (!res.ok) return
      const data = await res.json()
      if (mountedRef.current && Array.isArray(data.sessions)) {
        setCloudSessions(data.sessions as CloudSessionMeta[])
      }
    } catch {
      // Cloud fetch failed — cloudSessions stays empty / stale
    }
  }, [])

  /** Force-sync current session to cloud immediately (non-debounced). */
  const syncToCloud = useCallback(async () => {
    const msgs = messagesRef.current
    if (msgs.filter((m) => m.role === 'user').length === 0) return
    const cloudMessages = msgs
      .filter((m) => m.role === 'user' || m.role === 'assistant' || m.role === 'system')
      .map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        metadata: {
          ...(m.tokensUsed ? { tokensUsed: m.tokensUsed } : {}),
          ...(m.model ? { model: m.model } : {}),
        },
        timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp,
      }))
    if (cloudMessages.length === 0) return
    try {
      await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentSessionIdRef.current,
          title: makeSessionTitle(msgs),
          messages: cloudMessages,
          // Persist the current AI mode so switching devices restores it
          aiMode,
          model: selectedModel,
        }),
      })
      // Refresh cloud sessions list after successful sync
      await fetchCloudSessions()
    } catch {
      // Cloud sync failed — localStorage is still the source of truth
    }
  }, [fetchCloudSessions, aiMode, selectedModel])

  /** Debounced cloud save — schedules a cloud sync 2 seconds after the last call. */
  const debouncedCloudSave = useCallback(() => {
    if (cloudSaveTimerRef.current) clearTimeout(cloudSaveTimerRef.current)
    cloudSaveTimerRef.current = setTimeout(() => {
      void syncToCloud()
    }, 2000)
  }, [syncToCloud])

  // Fetch cloud sessions on mount (signed-in users only)
  useEffect(() => {
    if (user) {
      void fetchCloudSessions()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  // ─── Restore active conversation on mount ─────────────────────────────────────
  // Load the most-recently-updated session from fg_chat_sessions and hydrate
  // messages state so a page refresh doesn't wipe the conversation.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const sessions = loadSessions()
    if (sessions.length === 0) return
    // Sessions are stored newest-first (unshift on create, sorted by updatedAt on load)
    const latest = sessions[0]
    if (!latest || latest.messages.length === 0) return
    // Rehydrate timestamps from ISO strings back to Date objects
    // Also remove stale status messages ("Forje is building...") that got
    // persisted when the user closed the tab during generation
    const rehydrated = latest.messages
      .filter((m) => m.role !== 'status') // Remove stale loading spinners
      .map((m) => ({
        ...m,
        timestamp: m.timestamp instanceof Date ? m.timestamp : new Date(m.timestamp as unknown as string),
      }))
    setMessagesSync(() => rehydrated)
    setSessionId(latest.id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally run once on mount only

  // ─── Persist active messages to fg_chat_messages_v1 on every change ──────────
  // Filters out still-streaming messages and caps at MAX_ACTIVE_MESSAGES.
  // Also bumps savedAt so ChatPanel can flash the "Saved" indicator.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const persistable = messages
      .filter((m) => !m.streaming && m.role !== 'status')
      .slice(-MAX_ACTIVE_MESSAGES)
    if (persistable.length === 0) return
    try {
      localStorage.setItem(LS_ACTIVE_KEY, JSON.stringify(persistable))
      setSavedAt(Date.now())
    } catch { /* quota exceeded — silently ignore */ }
  }, [messages])

  // Keep ref in sync with state
  const setMessagesSync = useCallback((updater: (prev: ChatMessage[]) => ChatMessage[]) => {
    setMessages((prev) => {
      const next = updater(prev)
      messagesRef.current = next
      return next
    })
  }, [])

  // ─── Step-by-Step Game Builder ──────────────────────────────────────────────
  // Breaks a full game prompt into 5 discrete steps and executes each
  // independently in Studio, streaming progress to the chat as status messages.
  // Triggered when the user picks a game preset or types "build me a full game."
  const triggerStepByStepBuild = useCallback(
    async (prompt: string, sessionId: string) => {
      const buildStatusId = uid()
      setMessagesSync((prev) => [
        ...prev,
        {
          id: buildStatusId,
          role: 'status' as MessageRole,
          content: 'Building your game step by step...',
          timestamp: new Date(),
        },
      ])

      try {
        const res = await fetch('/api/ai/build-game', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, sessionId }),
        })

        if (!res.ok || !res.body) {
          setMessagesSync((prev) =>
            prev.map((m) =>
              m.id === buildStatusId
                ? { ...m, content: 'Step-by-step build failed to start.' }
                : m,
            ),
          )
          return
        }

        const reader = res.body.getReader()
        const dec = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += dec.decode(value, { stream: true })

          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            try {
              const event = JSON.parse(line.slice(6))

              if (event.action === 'complete' || event.action === 'failed') {
                const finalText = event.success
                  ? `Game built in ${event.steps?.length ?? '?'} steps! Check your Studio viewport.`
                  : `Build finished with some issues: ${(event.errors ?? []).slice(0, 2).join('; ')}`
                setMessagesSync((prev) =>
                  prev.map((m) =>
                    m.id === buildStatusId
                      ? { ...m, content: finalText }
                      : m,
                  ),
                )
              } else if (event.index && event.title) {
                const icon = event.status === 'done' ? '✅' : event.status === 'failed' ? '❌' : '⏳'
                setMessagesSync((prev) =>
                  prev.map((m) =>
                    m.id === buildStatusId
                      ? { ...m, content: `${icon} Step ${event.index}/${event.total}: ${event.title}` }
                      : m,
                  ),
                )
              }
            } catch {
              /* malformed SSE line — skip */
            }
          }
        }
      } catch {
        setMessagesSync((prev) =>
          prev.map((m) =>
            m.id === buildStatusId
              ? { ...m, content: 'Step-by-step build encountered an error.' }
              : m,
          ),
        )
      }

      setLoading(false)
      playCompletionSoundIfEnabled()
      saveCheckpoint()
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setMessagesSync, setLoading, playCompletionSoundIfEnabled],
  )

  // ─── Agentic Auto-Playtest ─────────────────────────────────────────────────
  // Triggers the autonomous build-test-fix loop after code is sent to Studio.
  // Reads the SSE stream from /api/ai/playtest and adds status messages to chat.
  const triggerAutoPlaytest = useCallback(
    async (code: string, sessionId: string, assistantMsgId: string, userPrompt?: string) => {
      // Abort any prior in-flight playtest
      autoPlaytestAbortRef.current?.abort()
      const abort = new AbortController()
      autoPlaytestAbortRef.current = abort

      // Show initial status
      const playtestStatusId = uid()
      setMessagesSync((prev) => [
        ...prev,
        {
          id: playtestStatusId,
          role: 'status' as MessageRole,
          content: 'Auto-playtest starting...',
          timestamp: new Date(),
        },
      ])

      try {
        const res = await fetch('/api/ai/playtest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // Pass userPrompt through so the scene-manifest vision check can
          // judge whether the built workspace matches what the user asked
          // for (not just detect empty scenes).
          body: JSON.stringify({ code, sessionId, maxIterations: 3, userPrompt }),
          signal: abort.signal,
        })

        if (!res.ok || !res.body) {
          setMessagesSync((prev) =>
            prev.map((m) =>
              m.id === playtestStatusId
                ? { ...m, content: 'Auto-playtest failed to start.' }
                : m,
            ),
          )
          return
        }

        const reader = res.body.getReader()
        const dec = new TextDecoder()
        let buffer = ''
        let finalResult: {
          success?: boolean
          finalCode?: string
          errors?: string[]
          iterations?: number
          action?: string
        } | null = null

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += dec.decode(value, { stream: true })

          // Parse SSE events from buffer
          const lines = buffer.split('\n')
          buffer = lines.pop() || '' // keep incomplete line in buffer

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            try {
              const event = JSON.parse(line.slice(6))

              if (event.action === 'complete' || event.action === 'failed') {
                finalResult = event
              }

              // Update the running status message
              const statusText =
                event.action === 'execute'
                  ? `Testing code (iteration ${event.details?.match(/Iteration (\d+)/)?.[1] || '?'})...`
                  : event.action === 'playtest'
                  ? 'Running playtest in Studio...'
                  : event.action === 'screenshot'
                  ? 'Capturing screenshot...'
                  : event.action === 'analyze'
                  ? 'Analyzing output log...'
                  : event.action === 'fix'
                  ? event.details || 'Fixing errors...'
                  : event.action === 'complete'
                  ? 'Playtest passed!'
                  : event.action === 'failed'
                  ? `Playtest failed: ${event.details || 'unknown error'}`
                  : event.details || 'Testing...'

              if (mountedRef.current) {
                setMessagesSync((prev) =>
                  prev.map((m) =>
                    m.id === playtestStatusId
                      ? { ...m, content: statusText }
                      : m,
                  ),
                )
              }
            } catch {
              // malformed SSE line — skip
            }
          }
        }

        if (!mountedRef.current) return

        // If playtest produced fixed code, update the assistant message
        if (finalResult?.finalCode && finalResult.finalCode !== code) {
          setMessagesSync((prev) => {
            const idx = prev.findIndex((m) => m.id === assistantMsgId)
            if (idx === -1) return prev
            const updated = [...prev]
            updated[idx] = { ...updated[idx], luauCode: finalResult!.finalCode! }
            messagesRef.current = updated
            return updated
          })
          lastLuauRef.current = finalResult.finalCode
          // Persist updated session
          persistSession(currentSessionIdRef.current, messagesRef.current)
          debouncedCloudSave()
        }

        // Final status message
        if (mountedRef.current) {
          const finalStatus = finalResult?.success
            ? `Playtest passed after ${finalResult.iterations || 1} iteration(s).`
            : `Playtest completed with errors after ${finalResult?.iterations || '?'} iteration(s).${
                finalResult?.errors?.length ? ` Errors: ${finalResult.errors.join('; ')}` : ''
              }`
          setMessagesSync((prev) =>
            prev.map((m) =>
              m.id === playtestStatusId
                ? { ...m, content: finalStatus }
                : m,
            ),
          )
        }
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return
        if (mountedRef.current) {
          setMessagesSync((prev) =>
            prev.map((m) =>
              m.id === playtestStatusId
                ? { ...m, content: 'Auto-playtest error: ' + ((err as Error)?.message || 'unknown') }
                : m,
            ),
          )
        }
      }
    },
    [setMessagesSync, debouncedCloudSave],
  )

  // ─── Checkpoint helpers ────────────────────────────────────────────────────

  const reloadCheckpoints = useCallback(() => {
    setCheckpoints(getCps(currentSessionIdRef.current))
  }, [])

  // Load checkpoints on mount and when session changes
  useEffect(() => {
    reloadCheckpoints()
  }, [currentSessionId, reloadCheckpoints])

  /** Create a checkpoint of the current conversation state. */
  const saveCheckpoint = useCallback((label?: string) => {
    const msgs = messagesRef.current
    if (msgs.length === 0) return
    createCp(currentSessionIdRef.current, msgs, aiMode, label)
    reloadCheckpoints()
  }, [aiMode, reloadCheckpoints])

  /** Restore conversation to a checkpoint's saved state. */
  const restoreToCheckpoint = useCallback((checkpointId: string) => {
    const cps = getCps(currentSessionIdRef.current)
    const cp = cps.find((c) => c.id === checkpointId)
    if (!cp) return
    const restored = restoreCp(cp)
    setMessagesSync(() => restored)
    setSuggestions([])
    if (cp.aiMode) {
      setAIMode(cp.aiMode as AIMode)
    }
  }, [setMessagesSync])

  /** Delete a single checkpoint. */
  const removeCheckpoint = useCallback((checkpointId: string) => {
    deleteCp(checkpointId, currentSessionIdRef.current)
    reloadCheckpoints()
  }, [reloadCheckpoints])

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || loading) return

      setInput('')
      setImageFile(null)
      setLoading(true)
      setSuggestions([])
      // Reset retry counter only for genuine user messages, not internal auto-retries
      if (!isAutoRetryRef.current) {
        retryCountRef.current = 0
        lastBuildPromptRef.current = trimmed
      }
      isAutoRetryRef.current = false

      const userMsg: ChatMessage = {
        id: uid(),
        role: 'user',
        content: trimmed,
        timestamp: new Date(),
      }
      const statusMsgId = uid()
      const modeLabels: Record<AIMode, string> = {
        build: 'Forje is building...',
        think: 'Forje is thinking deeply...',
        plan: 'Forje is creating a build plan...',
        image: 'Forje is generating your image...',
        script: 'Forje is writing Luau code...',
        terrain: 'Forje is sculpting terrain...',
        mesh: 'Forje is creating a 3D model...',
        debug: 'Forje is analyzing for bugs...',
        idea: 'Forje is brainstorming ideas...',
      }
      const statusMsg: ChatMessage = {
        id: statusMsgId,
        role: 'status',
        content: modeLabels[aiMode] || 'Forje is working...',
        timestamp: new Date(),
      }
      // Set thinking state for modes that show reasoning
      if (aiMode === 'think' || aiMode === 'debug') {
        setIsThinking(true)
        setThinkingText('')
      }

      setMessagesSync((prev) => [...prev, userMsg, statusMsg])

      // ── Pre-Build Preview: show 3 concept options before full generation ──
      // Triggers when: user enabled preview mode OR confidence scoring says to
      // Only for build/script/terrain modes, not for selected blueprints
      const isBuildMode = aiMode === 'build' || aiMode === 'script' || aiMode === 'terrain'
      const isBlueprint = trimmed.startsWith('Build "')
      let shouldPreview = previewMode && isBuildMode && !isBlueprint

      // Confidence-based auto-preview: check if similar builds historically fail
      if (!shouldPreview && isBuildMode && !isBlueprint) {
        try {
          const confRes = await fetch('/api/ai/build-confidence', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: trimmed, buildType: aiMode }),
          })
          if (confRes.ok) {
            const conf = await confRes.json()
            if (conf.suggestion === 'preview') {
              shouldPreview = true
            }
          }
        } catch { /* non-blocking */ }
      }

      if (shouldPreview) {
        try {
          const previewRes = await fetch('/api/ai/build-preview', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: trimmed }),
          })
          if (previewRes.ok) {
            const { options } = await previewRes.json()
            if (options && options.length > 0) {
              const previewMsg: ChatMessage = {
                id: uid(),
                role: 'build-preview' as MessageRole,
                content: previewMode
                  ? `Pick a direction for "${trimmed}":`
                  : `Similar builds can be tricky — pick a direction to get the best result:`,
                timestamp: new Date(),
                buildOptions: options,
              }
              setMessagesSync((prev) => [
                ...prev.filter((m) => m.id !== statusMsgId),
                previewMsg,
              ])
              setLoading(false)
              return
            }
          }
        } catch {
          // Preview failed — fall through to normal generation
        }
      }

      // Guest token limit — 100 free tokens before signup required
      if (!user) {
        const usedTokens = Number(typeof window !== 'undefined' ? localStorage.getItem('fg_guest_tokens') ?? '0' : '0')
        if (usedTokens >= GUEST_TOKEN_LIMIT) {
          setMessagesSync((prev) => [
            ...prev.filter((m) => m.id !== statusMsgId),
            { id: uid(), role: 'signup', content: '', timestamp: new Date() },
          ])
          setLoading(false)
          return
        }
      }

      try {
        // Build headers (custom API key support)
        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        if (selectedModel.startsWith('custom-')) {
          const providerMap: Record<string, { lsKey: string; provider: string }> = {
            'custom-anthropic': { lsKey: 'fg_anthropic_key', provider: 'anthropic' },
            'custom-openai':    { lsKey: 'fg_openai_key',    provider: 'openai' },
            'custom-google':    { lsKey: 'fg_google_key',    provider: 'google' },
          }
          const cfg = providerMap[selectedModel]
          if (cfg) {
            const storedKey = typeof window !== 'undefined' ? localStorage.getItem(cfg.lsKey) : null
            if (storedKey) {
              headers['x-custom-api-key'] = storedKey
              headers['x-custom-provider'] = cfg.provider
            }
          }
        }

        // ── Specialized mode routing ─────────────────────────────────────────
        // Image/Mesh/Clothing modes call dedicated APIs instead of chat
        const SPECIALIZED_MODES = ['image', 'mesh'] as const
        type SpecializedMode = (typeof SPECIALIZED_MODES)[number]
        if (SPECIALIZED_MODES.includes(aiMode as SpecializedMode)) {
          try {
            let apiUrl = ''
            let apiBody: Record<string, unknown> = {}

            if (aiMode === 'image') {
              // Detect style from imageOptions or keywords
              let style = imageOptions.style
              if (!style || style === 'auto') {
                const promptLower = trimmed.toLowerCase()
                const imageMode = promptLower.includes('icon') ? 'icon'
                  : promptLower.includes('thumbnail') || promptLower.includes('cover') ? 'thumbnail'
                  : promptLower.includes('gfx') || promptLower.includes('character') ? 'gfx'
                  : promptLower.includes('clothing') || promptLower.includes('shirt') || promptLower.includes('pants') ? 'clothing'
                  : promptLower.includes('texture') ? 'texture'
                  : promptLower.includes('pixel') ? 'pixel-art'
                  : promptLower.includes('anime') ? 'anime'
                  : promptLower.includes('3d') || promptLower.includes('render') ? '3d-render'
                  : promptLower.includes('concept') ? 'concept-art'
                  : promptLower.includes('ui') || promptLower.includes('button') || promptLower.includes('menu') ? 'ui-element'
                  : promptLower.includes('nano') || promptLower.includes('figurine') ? 'nano-banana'
                  : 'asset'
                const styleMap: Record<string, string> = {
                  'icon': 'roblox-icon',
                  'thumbnail': 'game-thumbnail',
                  'gfx': 'roblox-icon',
                  'clothing': 'roblox-icon',
                  'texture': 'texture',
                  'pixel-art': 'pixel-art',
                  'anime': 'anime',
                  '3d-render': '3d-render',
                  'concept-art': 'concept-art',
                  'ui-element': 'ui-element',
                  'nano-banana': 'nano-banana',
                  'asset': 'roblox-icon',
                }
                style = styleMap[imageMode] || 'roblox-icon'
              }
              // Unified image engine: auto-picks GPT/Nano/FAL based on style
              apiUrl = '/api/ai/generate-image'
              apiBody = {
                prompt: trimmed,
                style,
                provider: 'auto',
                size: 'auto',
              }
            } else if (aiMode === 'mesh') {
              apiUrl = '/api/ai/mesh'
              apiBody = { prompt: trimmed.slice(0, 200), quality: 'draft', withTextures: true }
            }

            // First, call the free enhance-prompt endpoint to improve the prompt
            let enhancedPrompt = trimmed
            if (enhancePrompts) {
              try {
                const enhRes = await fetch('/api/ai/enhance-prompt', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ prompt: trimmed, mode: aiMode }),
                })
                if (enhRes.ok) {
                  const enhanced = await enhRes.json()
                  if (enhanced?.enhancedPrompt) {
                    enhancedPrompt = enhanced.enhancedPrompt
                    apiBody.prompt = enhancedPrompt
                  }
                }
              } catch {
                // Enhancement failed — use original prompt
              }
            }

            // The client has already enhanced the prompt above (when
            // enhancePrompts is on), so tell /api/ai/image to skip its own
            // server-side enhancement to avoid a duplicate Groq call (BUG 12).
            if (aiMode === 'image' && enhancePrompts) {
              apiBody.skipEnhance = true
            }

            let specialRes = await fetch(apiUrl, {
              method: 'POST',
              headers,
              body: JSON.stringify(apiBody),
            })

            let specialData = await specialRes.json()

            // If Nano Banana failed, fall back to FAL
            if (aiMode === 'image' && !specialRes.ok && apiUrl === '/api/ai/image-nano') {
              console.log('[useChat] Nano Banana failed, falling back to FAL')
              const falRes = await fetch('/api/ai/image', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                  prompt: enhancedPrompt,
                  style: (apiBody.style as string) || 'roblox-icon',
                  count: 1,
                  removeBackground: imageOptions.removeBackground,
                  upscale: imageOptions.upscale,
                  skipEnhance: true,
                }),
              })
              if (falRes.ok) {
                specialData = await falRes.json()
                specialRes = falRes
              }
            }

            // Handle both Nano Banana format ({image:{url}}) and FAL format ({images:[{url}]})
            const imageUrls: string[] = specialData.images
              ? (specialData.images as Array<{ url: string }>).map((img) => img.url)
              : specialData.image?.url
                ? [specialData.image.url]
                : []

            // Check if this is a UI/GUI style that should also generate Roblox code
            const isUIStyle = ['ui-mockup', 'game-menu', 'hud-design', 'shop-ui', 'inventory-ui'].includes(
              (apiBody.style as string) || ''
            )

            let guiCode = ''
            if (aiMode === 'image' && isUIStyle && imageUrls.length > 0) {
              // Generate Roblox ScreenGui code that recreates this UI design
              try {
                const guiRes = await fetch('/api/ai/chat', {
                  method: 'POST',
                  headers,
                  body: JSON.stringify({
                    message: `Convert this UI design into working Roblox ScreenGui Luau code. The design is: "${trimmed}". Style: ${apiBody.style}.

Generate COMPLETE Luau code that creates a ScreenGui with all the UI elements shown in this design. Use these Roblox UI classes:
- ScreenGui (parent to PlayerGui)
- Frame (containers with UICorner, UIStroke, UIGradient)
- TextLabel (text display)
- TextButton (clickable buttons with hover effects)
- ImageLabel (icons/images)
- UIListLayout / UIGridLayout (auto-layout)
- UICorner (rounded corners, CornerRadius = UDim.new(0, 8-12))
- UIStroke (borders, Thickness = 1-2)
- UIGradient (gradient backgrounds)
- UIPadding (internal padding)
- ScrollingFrame (scrollable lists)

DESIGN RULES:
- Dark theme: BackgroundColor3 = Color3.fromRGB(15, 18, 30) for main bg
- Gold accents: Color3.fromRGB(212, 175, 55) for highlights, buttons, borders
- White text on dark: TextColor3 = Color3.fromRGB(250, 250, 250)
- Muted text: Color3.fromRGB(113, 113, 122)
- Card backgrounds: Color3.fromRGB(25, 28, 40) with UICorner 12px
- Buttons: gold bg with dark text, UICorner 8px, hover effect via MouseEnter
- Font: GothamBold for headings, GothamMedium for body, size 14-24
- Use UDim2.new(0, px, 0, px) for fixed sizes, UDim2.new(scale, 0, scale, 0) for responsive
- Add UIListLayout with Padding = UDim.new(0, 8) for vertical/horizontal lists
- Include close button (X) in top-right with TextButton
- Make it responsive: parent Frame uses UDim2.new(0.9, 0, 0.85, 0) centered

Output ONLY the Luau code in a \`\`\`lua block. Make it complete and paste-ready for Studio command bar.`,
                    aiMode: 'script',
                  }),
                })
                if (guiRes.ok) {
                  const guiData = await guiRes.json()
                  const guiResponse = guiData?.response || guiData?.text || ''
                  // Extract code block
                  const codeMatch = guiResponse.match(/```(?:lua|luau)?\s*\n?([\s\S]*?)```/)
                  if (codeMatch) {
                    guiCode = codeMatch[1].trim()
                  }
                }
              } catch {
                // GUI generation failed — still show the image
              }
            }

            const resultContent = aiMode === 'image'
              ? `**Generated Image${imageUrls.length > 1 ? 's' : ''}** (${apiBody.style || 'roblox-icon'}${specialData.model ? ` · ${specialData.model}` : ''})\n\n${
                  imageUrls.map((url, i) => `![Generated ${i + 1}](${url})`).join('\n\n')
                }${imageUrls.length === 0 ? '⚠️ No image was generated. Try rephrasing your prompt.' : ''}${enhancedPrompt !== trimmed ? `\n\n*Enhanced prompt: "${enhancedPrompt}"*` : ''}${
                  guiCode ? `\n\n---\n\n**Roblox GUI Code** — paste this in Studio command bar:\n\n\`\`\`lua\n${guiCode}\n\`\`\`` : ''
                }${isUIStyle && !guiCode ? '\n\n*Tip: the AI also tried to generate Roblox GUI code for this design but it didn\'t complete. Try asking "convert this to Roblox GUI" in Build mode.*' : ''}`
              : `**3D Model Generated**\n\n${specialData.meshUrl ? `[Download Model](${specialData.meshUrl})` : 'Generation in progress...'}\n\n${specialData.luauCode || ''}`

            setMessagesSync((prev) => [
              ...prev.filter((m) => m.id !== statusMsgId),
              {
                id: uid(),
                role: 'assistant',
                content: specialRes.ok ? resultContent : `Error: ${specialData.error || 'Generation failed'}`,
                timestamp: new Date(),
                model: selectedModel,
                luauCode: guiCode || undefined,
              },
            ])
            setLoading(false)
            setIsThinking(false)
            return
          } catch (err) {
            // Fall through to chat API on error
            console.error(`[useChat] Specialized ${aiMode} mode failed, falling back to chat:`, err)
          }
        }

        // Detect mesh intent for parallel generation
        const lowerTrimmed = trimmed.toLowerCase()
        const isBuildMeshIntent = BUILD_KEYWORDS.some((kw) => lowerTrimmed.includes(kw))

        // ── FREE prompt enhancement (enhance-prompt endpoint) ──────────────
        // When enhancePrompts is enabled, call the cheap Groq endpoint to rewrite
        // the user's prompt with structured detail before sending to the main AI.
        // This is free (Groq/Llama) and dramatically improves output quality.
        let enhancedMessage = trimmed
        if (enhancePrompts && !pendingLastErrorRef.current) {
          try {
            const enhRes = await fetch('/api/ai/enhance-prompt', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prompt: trimmed, mode: aiMode }),
            })
            if (enhRes.ok) {
              const enhData = await enhRes.json()
              if (enhData?.enhancedPrompt && enhData.enhancedPrompt !== trimmed) {
                enhancedMessage = enhData.enhancedPrompt
              }
            }
          } catch {
            // Enhancement failed — use original prompt, non-fatal
          }
        }

        // Include Studio context so AI knows camera position + nearby objects
        const chatBody: Record<string, unknown> = {
          message: enhancedMessage,
          model: selectedModel,
          stream: true,
          aiMode: aiMode,
        }
        if (studioConnected && studioContext) {
          chatBody.studioContext = studioContext
        }

        // Include image data if user attached an image (Image-to-Map / vision)
        const pendingImageFile = imageFile
        if (pendingImageFile) {
          try {
            const arrayBuffer = await pendingImageFile.arrayBuffer()
            const base64 = Buffer.from(arrayBuffer).toString('base64')
            chatBody.imageBase64 = base64
            chatBody.imageMimeType = pendingImageFile.type || 'image/jpeg'
            chatBody.imageName = pendingImageFile.name
          } catch {
            // If we can't read the file, proceed without image — don't block the send
          }
        }
        // Inject pending retry context (set by checkResult before calling sendMessage)
        if (pendingLastErrorRef.current) {
          chatBody.lastError = pendingLastErrorRef.current
          chatBody.retryAttempt = pendingRetryAttemptRef.current
          if (pendingPreviousCodeRef.current) {
            chatBody.previousCode = pendingPreviousCodeRef.current
          }
          // Consume — clear after injecting so normal messages aren't affected
          pendingLastErrorRef.current = null
          pendingRetryAttemptRef.current = 0
          pendingPreviousCodeRef.current = null
        }

        // Send sessionId in header so the API can auto-execute code in Studio
        if (studioConnected && studioSessionId) {
          headers['x-studio-session'] = studioSessionId
        }

        // ── WebSocket streaming path (primary) ─────────────────────────────────
        // When WS is connected, send via WebSocket for lower-latency streaming.
        // Falls through to the HTTP fetch path below if WS is not available.
        if (wsConnected) {
          const assistantMsgId = uid()
          let rawStreamBuffer = ''

          // Insert the streaming assistant message (empty content to start)
          setMessagesSync((prev) => [
            ...prev.filter((m) => m.id !== statusMsgId),
            {
              id: assistantMsgId,
              role: 'assistant',
              content: '',
              timestamp: new Date(),
              model: selectedModel,
              streaming: true,
            },
          ])

          setStreaming(true)

          // Detect mesh intent for parallel generation (same logic as HTTP path)
          const wsLowerTrimmed = trimmed.toLowerCase()
          const wsIsBuildMeshIntent = BUILD_KEYWORDS.some((kw) => wsLowerTrimmed.includes(kw))

          type MeshAPIResponse = {
            meshUrl?: string | null
            luauCode?: string | null
            taskId?: string | null
            status: string
          }

          const wsMeshPromise: Promise<MeshAPIResponse | null> = wsIsBuildMeshIntent
            ? fetch('/api/ai/mesh', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  prompt: trimmed.slice(0, 200),
                  quality: 'draft',
                  withTextures: true,
                }),
              })
                .then((r) => (r.ok ? (r.json() as Promise<MeshAPIResponse>) : null))
                .catch(() => null)
            : Promise.resolve(null)

          // Send chat message over WebSocket
          wsSend({
            type: 'chat',
            message: enhancedMessage,
            model: selectedModel,
            aiMode: aiMode,
            studioContext: studioConnected && studioContext ? studioContext : undefined,
            studioSessionId: studioConnected && studioSessionId ? studioSessionId : undefined,
            ...(pendingLastErrorRef.current ? {
              lastError: pendingLastErrorRef.current,
              retryAttempt: pendingRetryAttemptRef.current,
              previousCode: pendingPreviousCodeRef.current,
            } : {}),
          })

          // Consume pending retry context
          pendingLastErrorRef.current = null
          pendingRetryAttemptRef.current = 0
          pendingPreviousCodeRef.current = null

          // Listen for WebSocket response events
          const wsResult = await new Promise<{
            meta: StreamMeta
            meshData: MeshAPIResponse | null
          }>((resolve) => {
            let meta: StreamMeta = {}
            let resolved = false

            const cleanup: (() => void)[] = []

            const finish = async () => {
              if (resolved) return
              resolved = true
              cleanup.forEach((fn) => fn())
              const meshData = await wsMeshPromise
              resolve({ meta, meshData })
            }

            // Handle streaming text chunks
            cleanup.push(wsOn('chat_chunk', (msg) => {
              const data = msg as { content?: string }
              if (!data.content) return
              rawStreamBuffer += data.content
              const displayChunk = data.content
                .replace(/```(?:lua|luau|[a-z]*)?\s*[\s\S]*?```/g, '')
                .replace(/```[\s\S]*$/g, '')
              if (!displayChunk) return
              setMessages((prev) => {
                const idx = prev.findIndex((m) => m.id === assistantMsgId)
                if (idx === -1) return prev
                const updated = [...prev]
                updated[idx] = {
                  ...updated[idx],
                  content: updated[idx].content + displayChunk,
                }
                messagesRef.current = updated
                return updated
              })
            }))

            // Handle stream completion
            cleanup.push(wsOn('chat_done', (msg) => {
              const data = msg as {
                fullContent?: string
                suggestions?: string[]
                intent?: string
                hasCode?: boolean
                tokensUsed?: number
                executedInStudio?: boolean
                model?: string
                mcpResult?: McpAgentResult
                meshResult?: MeshResult
                qualityScore?: number
                buildPartCount?: number
              }
              meta = {
                suggestions: data.suggestions,
                intent: data.intent,
                hasCode: data.hasCode,
                tokensUsed: data.tokensUsed,
                executedInStudio: data.executedInStudio,
                model: data.model,
                mcpResult: data.mcpResult,
                meshResult: data.meshResult,
                qualityScore: data.qualityScore,
                buildPartCount: data.buildPartCount,
              }
              void finish()
            }))

            // Handle errors
            cleanup.push(wsOn('chat_error', (msg) => {
              const data = msg as { error?: string }
              meta = { error: data.error || 'WebSocket streaming error' }
              void finish()
            }))

            // Mid-stream disconnect guard — if the WebSocket drops while we
            // are waiting for chat_chunk / chat_done, bail out immediately
            // with a connection_lost error instead of sitting through the
            // full 120s timeout. Without this, a transient network blip
            // freezes the chat UI for two minutes.
            if (wsInstance) {
              const unsubState = wsInstance.onStateChange((state) => {
                if (resolved) return
                if (state === 'disconnected' || state === 'reconnecting') {
                  meta = { error: 'Connection lost while receiving the AI response. Retrying when back online…' }
                  void finish()
                }
              })
              cleanup.push(unsubState)
            }

            // Safety timeout — fall through after 120s in case no done/error arrives
            const timeout = setTimeout(() => {
              if (!resolved) void finish()
            }, 120000)
            cleanup.push(() => clearTimeout(timeout))
          })

          const { meta, meshData } = wsResult

          setStreaming(false)

          const tokensUsed = meta.tokensUsed ?? estimateTokens(trimmed)
          setTotalTokens((prev) => prev + tokensUsed)

          // Track guest token usage in localStorage
          if (!user && typeof window !== 'undefined') {
            const prev = Number(localStorage.getItem('fg_guest_tokens') ?? '0')
            localStorage.setItem('fg_guest_tokens', String(prev + tokensUsed))
          }

          // Handle API error in meta
          if ((meta as Record<string, unknown>).error) {
            const apiError = (meta as Record<string, unknown>).error as string
            console.warn('[ForjeAI] WS API error:', apiError)
            setMessagesSync((prev) => {
              const filtered = prev.filter((m) => m.id !== assistantMsgId && m.id !== statusMsgId)
              return [
                ...filtered,
                {
                  id: uid(),
                  role: 'assistant' as const,
                  content: apiError,
                  timestamp: new Date(),
                  model: selectedModel,
                },
              ]
            })
            setLoading(false)
            return
          }

          if (meta.suggestions && meta.suggestions.length > 0) {
            setSuggestions(meta.suggestions)
          }

          if (meta.mcpResult) {
            setLastMcpResult(meta.mcpResult)
            setTimeout(() => setLastMcpResult(null), 5000)
          }

          // Finalize the assistant message with metadata
          setMessages((prev) => {
            const idx = prev.findIndex((m) => m.id === assistantMsgId)
            if (idx === -1) return prev
            const updated = [...prev]
            const displayedContent = updated[idx].content || getDemoResponse(trimmed)
            const finalContent = displayedContent
              .replace(/\n{3,}/g, '\n\n')
              .trim() || displayedContent
            updated[idx] = {
              ...updated[idx],
              content: finalContent,
              streaming: false,
              tokensUsed,
              suggestions: meta.suggestions,
              intent: meta.intent,
              hasCode: meta.hasCode,
              ...(meta.meshResult ? { meshResult: meta.meshResult } : {}),
              ...(meta.qualityScore ? { qualityScore: meta.qualityScore } : {}),
              ...(meta.buildPartCount ? { buildPartCount: meta.buildPartCount } : {}),
            }
            // Plan mode: if AI returned a plan (no code), show plan approval UI
            if (aiMode === 'plan' && !meta.hasCode && finalContent.length > 50) {
              setPlanText(finalContent)
            }
            const result: ChatMessage[] = [...updated]
            if (meshData) {
              result.push({
                id: uid(),
                role: 'system',
                content: meshData.status === 'complete'
                  ? '3D mesh generated. MeshPart Luau ready — check Assets to copy it.'
                  : meshData.status === 'pending'
                  ? `3D mesh generating (task ${meshData.taskId ?? 'unknown'}). Check back shortly.`
                  : '3D mesh: demo mode — add MESHY_API_KEY to generate real meshes.',
                timestamp: new Date(),
              })
            }
            // BUG 7: show an accurate Studio-status message based on actual
            // connection state. Prior to this fix the same "Sent to Roblox
            // Studio" text was shown on every build, including when Studio
            // wasn't connected — which looked like an error to users.
            if (meta.hasCode || meta.executedInStudio) {
              let statusContent: string
              if (meta.executedInStudio) {
                statusContent = 'Built in Studio ✓ — Try: "add more detail" / "change the colors" / "make it bigger"'
              } else {
                statusContent = 'Code ready — use "Send to Studio" or copy the code below.'
              }
              result.push({
                id: uid(),
                role: 'status',
                content: statusContent,
                timestamp: new Date(),
              })
            }
            messagesRef.current = result
            return result
          })

          // Extract code: prefer luauCode from meta (server generates separately),
          // fall back to extracting from code blocks in stream text
          let luauCode: string | null = null
          if (meta.hasCode) {
            if ((meta as Record<string, unknown>).luauCode) {
              luauCode = (meta as Record<string, unknown>).luauCode as string
            }
            if (!luauCode) {
              const codeBlockMatch = rawStreamBuffer.match(/```(?:lua|luau)?\s*\n([\s\S]*?)```/)
              if (codeBlockMatch?.[1]?.trim()) {
                luauCode = codeBlockMatch[1].trim()
              }
            }
          }
          luauCode = luauCode ?? meshData?.luauCode ?? null

          // Store luauCode on the message for build preview rendering
          if (luauCode) {
            setMessages((prev) => {
              const idx = prev.findIndex((m) => m.id === assistantMsgId)
              if (idx === -1) return prev
              const updated = [...prev]
              updated[idx] = { ...updated[idx], luauCode }
              messagesRef.current = updated
              return updated
            })
          }

          // Persist session after AI response is fully finalized
          persistSession(currentSessionIdRef.current, messagesRef.current)
          debouncedCloudSave()

          // Client-side fallback execution (only if server didn't already execute)
          if (studioConnected && luauCode && !meta.executedInStudio && onBuildComplete) {
            lastLuauRef.current = luauCode
            onBuildComplete(luauCode, trimmed, studioSessionId ?? null)

            if (typeof window !== 'undefined' && !retryListenerRef.current) {
              retryListenerRef.current = true
              const retryAbort = new AbortController()
              const checkResult = async () => {
                await new Promise<void>((r) => setTimeout(r, 3000))
                if (!mountedRef.current || retryAbort.signal.aborted) {
                  retryListenerRef.current = false
                  return
                }
                try {
                  const statusRes = await fetch(`/api/studio/status?sessionId=${studioSessionId}`, { signal: retryAbort.signal })
                  if (!statusRes.ok) return
                  const statusData = await statusRes.json() as { lastCommandError?: string }
                  if (!mountedRef.current || !statusData.lastCommandError || !statusData.lastCommandError.includes('ERROR')) return

                  const MAX_RETRIES = 3
                  retryCountRef.current += 1
                  const attempt = retryCountRef.current

                  if (attempt > MAX_RETRIES) {
                    setMessagesSync((prev) => [
                      ...prev,
                      {
                        id: uid(),
                        role: 'build-error' as MessageRole,
                        content: `Build failed after ${MAX_RETRIES} attempts.`,
                        buildError: statusData.lastCommandError,
                        retryAttempt: attempt,
                        timestamp: new Date(),
                      },
                    ])
                    retryCountRef.current = 0
                    return
                  }

                  setMessagesSync((prev) => [
                    ...prev,
                    {
                      id: uid(),
                      role: 'status',
                      content: `Auto-fixing (attempt ${attempt}/${MAX_RETRIES})...`,
                      timestamp: new Date(),
                    },
                  ])

                  const fixPrompt = lastBuildPromptRef.current || trimmed
                  pendingLastErrorRef.current = statusData.lastCommandError
                  pendingRetryAttemptRef.current = attempt
                  pendingPreviousCodeRef.current = lastLuauRef.current

                  retryListenerRef.current = false
                  isAutoRetryRef.current = true
                  void sendMessage(`[AUTO-RETRY attempt ${attempt}/${MAX_RETRIES}] ${fixPrompt}`)
                } catch { /* silent — includes AbortError */ } finally {
                  retryListenerRef.current = false
                }
              }
              void checkResult()
            }
          }

          // ── Auto-playtest: kick off the agentic test loop if code was executed ──
          if (
            autoPlaytest &&
            luauCode &&
            studioSessionId &&
            studioConnected &&
            (meta.executedInStudio || (onBuildComplete && lastLuauRef.current)) &&
            (aiMode === 'build' || aiMode === 'debug' || aiMode === 'script')
          ) {
            void triggerAutoPlaytest(luauCode, studioSessionId, assistantMsgId, trimmed)
          }

          setLoading(false)
          playCompletionSoundIfEnabled()
          saveCheckpoint()
          setTimeout(() => textareaRef.current?.focus(), 50)
          return // WebSocket path complete — skip HTTP fallback below
        }

        // ── HTTP fetch streaming path (fallback when WebSocket is not connected) ──

        // Client-side timeout: abort if the server doesn't respond within 90s.
        // Vercel can hang for up to 300s — we'd rather show an error and let
        // the user retry than freeze the UI for 5 minutes.
        // Also wired to the stop button via activeAbortRef.
        const fetchAbort = new AbortController()
        activeAbortRef.current = fetchAbort
        const fetchTimeout = setTimeout(() => fetchAbort.abort(), 90000)

        const chatPromise = fetch('/api/ai/chat', {
          method: 'POST',
          headers,
          body: JSON.stringify(chatBody),
          signal: fetchAbort.signal,
        }).finally(() => clearTimeout(fetchTimeout))

        type MeshAPIResponse = {
          meshUrl?: string | null
          luauCode?: string | null
          taskId?: string | null
          status: string
        }

        // Auto-generate 3D mesh in parallel for ANY build request
        // Meshy gets the full prompt (trimmed to 200 chars) for best results
        const meshPromise: Promise<MeshAPIResponse | null> = isBuildMeshIntent
          ? fetch('/api/ai/mesh', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                prompt: trimmed.slice(0, 200),
                quality: 'draft',
                withTextures: true,
              }),
            })
              .then((r) => (r.ok ? (r.json() as Promise<MeshAPIResponse>) : null))
              .catch(() => null)
          : Promise.resolve(null)

        const [chatRes, meshData] = await Promise.all([chatPromise, meshPromise])

        // Token exhaustion — any 402 means tokens are depleted. Try to
        // parse the response body for the exact balance/required numbers so
        // the upgrade card can tell the user "Need 500 more" instead of a
        // generic "Upgrade your plan" message. The route returns JSON with
        // { error, balance, required } on 402.
        if (chatRes.status === 402) {
          let balance: number | undefined
          let required: number | undefined
          try {
            const errBody = await chatRes.clone().json() as { balance?: number; required?: number }
            if (typeof errBody.balance === 'number') balance = errBody.balance
            if (typeof errBody.required === 'number') required = errBody.required
          } catch {
            /* body not JSON or already consumed — fall back to generic card */
          }
          setMessagesSync((prev) => [
            ...prev.filter((m) => m.id !== statusMsgId),
            {
              id: uid(),
              role: 'upgrade',
              content: '',
              timestamp: new Date(),
              tokenBalance: balance,
              tokenRequired: required,
            },
          ])
          setLoading(false)
          setStreaming(false)
          return
        }

        if (!chatRes.ok) throw new Error(`API error ${chatRes.status}`)

        // ── Streaming response path ───────────────────────────────────────────
        // The API sends text chunks then a \x00{meta} sentinel.
        // We create the assistant message immediately (empty) then append chunks.

        if (chatRes.body) {
          const assistantMsgId = uid()

          // Accumulate raw stream content (including code blocks) in a ref so
          // we can extract Luau after streaming ends, without relying on the
          // displayed content field which gets code-stripped at finalization.
          let rawStreamBuffer = ''

          // Insert the streaming assistant message (empty content to start)
          setMessagesSync((prev) => [
            ...prev.filter((m) => m.id !== statusMsgId),
            {
              id: assistantMsgId,
              role: 'assistant',
              content: '',
              timestamp: new Date(),
              model: selectedModel,
              streaming: true,
            },
          ])

          setStreaming(true)

          const meta = await readStream(chatRes.body, (chunk) => {
            rawStreamBuffer += chunk
            // Strip code blocks from what we display during streaming so raw
            // Lua never flashes on screen. We keep rawStreamBuffer intact for
            // code extraction after the stream ends.
            const displayChunk = chunk.replace(/```(?:lua|luau|[a-z]*)?\s*[\s\S]*?```/g, '').replace(/```[\s\S]*$/g, '')
            if (!displayChunk) return
            setMessages((prev) => {
              const idx = prev.findIndex((m) => m.id === assistantMsgId)
              if (idx === -1) return prev
              const updated = [...prev]
              updated[idx] = {
                ...updated[idx],
                content: updated[idx].content + displayChunk,
              }
              messagesRef.current = updated
              return updated
            })
          })

          setStreaming(false)

          const tokensUsed = meta.tokensUsed ?? estimateTokens(trimmed)
          setTotalTokens((prev) => prev + tokensUsed)

          // Track guest token usage in localStorage
          if (!user && typeof window !== 'undefined') {
            const prev = Number(localStorage.getItem('fg_guest_tokens') ?? '0')
            localStorage.setItem('fg_guest_tokens', String(prev + tokensUsed))
          }

          // Handle API error in meta (e.g. rate limit, AI failure)
          if ((meta as Record<string, unknown>).error) {
            const apiError = (meta as Record<string, unknown>).error as string
            console.warn('[ForjeAI] API error in stream meta:', apiError)
            setMessagesSync((prev) => {
              const filtered = prev.filter((m) => m.id !== assistantMsgId && m.id !== statusMsgId)
              return [
                ...filtered,
                {
                  id: uid(),
                  role: 'assistant' as const,
                  content: apiError,
                  timestamp: new Date(),
                  model: selectedModel,
                },
              ]
            })
            setLoading(false)
            return
          }

          if (meta.suggestions && meta.suggestions.length > 0) {
            setSuggestions(meta.suggestions)
          }

          if (meta.mcpResult) {
            setLastMcpResult(meta.mcpResult)
            // Clear after 5 seconds
            setTimeout(() => setLastMcpResult(null), 5000)
          }

          // Finalize the assistant message with metadata
          setMessages((prev) => {
            const idx = prev.findIndex((m) => m.id === assistantMsgId)
            if (idx === -1) return prev
            const updated = [...prev]
            // Content in state was already code-stripped during streaming.
            // Fall back to demo response only if we got nothing at all.
            const displayedContent = updated[idx].content || getDemoResponse(trimmed)
            const finalContent = displayedContent
              .replace(/\n{3,}/g, '\n\n')
              .trim() || displayedContent
            updated[idx] = {
              ...updated[idx],
              content: finalContent,
              streaming: false,
              tokensUsed,
              suggestions: meta.suggestions,
              intent: meta.intent,
              hasCode: meta.hasCode,
              ...(meta.meshResult ? { meshResult: meta.meshResult } : {}),
              ...(meta.qualityScore ? { qualityScore: meta.qualityScore } : {}),
              ...(meta.buildPartCount ? { buildPartCount: meta.buildPartCount } : {}),
            }
            // Plan mode: if AI returned a plan (no code), show plan approval UI
            if (aiMode === 'plan' && !meta.hasCode && finalContent.length > 50) {
              setPlanText(finalContent)
            }
            // Append mesh result message if present
            const result: ChatMessage[] = [...updated]
            if (meshData) {
              result.push({
                id: uid(),
                role: 'system',
                content: meshData.status === 'complete'
                  ? '3D mesh generated. MeshPart Luau ready — check Assets to copy it.'
                  : meshData.status === 'pending'
                  ? `3D mesh generating (task ${meshData.taskId ?? 'unknown'}). Check back shortly.`
                  : '3D mesh: demo mode — add MESHY_API_KEY to generate real meshes.',
                timestamp: new Date(),
              })
            }
            // BUG 7: accurate Studio-status message based on real connection
            // state — see the WebSocket path above for the full rationale.
            if (meta.hasCode || meta.executedInStudio) {
              let statusContent: string
              if (meta.executedInStudio) {
                statusContent = 'Built in Studio ✓ — Try: "add more detail" / "change the colors" / "make it bigger"'
              } else {
                statusContent = 'Code ready — use "Send to Studio" or copy the code below.'
              }
              result.push({
                id: uid(),
                role: 'status',
                content: statusContent,
                timestamp: new Date(),
              })
            }
            messagesRef.current = result
            return result
          })

          // Extract code: prefer luauCode from meta (server generates separately),
          // fall back to extracting from code blocks in stream text
          let luauCode: string | null = null
          if (meta.hasCode) {
            if ((meta as Record<string, unknown>).luauCode) {
              luauCode = (meta as Record<string, unknown>).luauCode as string
            }
            if (!luauCode) {
              const codeBlockMatch = rawStreamBuffer.match(/```(?:lua|luau)?\s*\n([\s\S]*?)```/)
              if (codeBlockMatch?.[1]?.trim()) {
                luauCode = codeBlockMatch[1].trim()
              }
            }
          }
          luauCode = luauCode ?? meshData?.luauCode ?? null

          // Store luauCode on the message for build preview rendering
          if (luauCode) {
            setMessages((prev) => {
              const idx = prev.findIndex((m) => m.id === assistantMsgId)
              if (idx === -1) return prev
              const updated = [...prev]
              updated[idx] = { ...updated[idx], luauCode }
              messagesRef.current = updated
              return updated
            })
          }

          // Persist session after AI response is fully finalized
          persistSession(currentSessionIdRef.current, messagesRef.current)
          debouncedCloudSave()
          playCompletionSoundIfEnabled()
          saveCheckpoint()

          // Client-side fallback execution (only if server didn't already execute)
          if (studioConnected && luauCode && !meta.executedInStudio && onBuildComplete) {
            lastLuauRef.current = luauCode
            onBuildComplete(luauCode, trimmed, studioSessionId ?? null)

            if (typeof window !== 'undefined' && !retryListenerRef.current) {
              retryListenerRef.current = true
              const retryAbort = new AbortController()
              const checkResult = async () => {
                await new Promise<void>((r) => setTimeout(r, 3000))
                if (!mountedRef.current || retryAbort.signal.aborted) {
                  retryListenerRef.current = false
                  return
                }
                try {
                  const statusRes = await fetch(`/api/studio/status?sessionId=${studioSessionId}`, { signal: retryAbort.signal })
                  if (!statusRes.ok) return
                  const statusData = await statusRes.json() as { lastCommandError?: string }
                  if (!mountedRef.current || !statusData.lastCommandError || !statusData.lastCommandError.includes('ERROR')) return

                  const MAX_RETRIES = 3
                  retryCountRef.current += 1
                  const attempt = retryCountRef.current

                  if (attempt > MAX_RETRIES) {
                    // Hard stop — show actionable error card
                    setMessagesSync((prev) => [
                      ...prev,
                      {
                        id: uid(),
                        role: 'build-error' as MessageRole,
                        content: `Build failed after ${MAX_RETRIES} attempts.`,
                        buildError: statusData.lastCommandError,
                        retryAttempt: attempt,
                        timestamp: new Date(),
                      },
                    ])
                    retryCountRef.current = 0
                    return
                  }

                  // Show progress indicator
                  setMessagesSync((prev) => [
                    ...prev,
                    {
                      id: uid(),
                      role: 'status',
                      content: `Auto-fixing (attempt ${attempt}/${MAX_RETRIES})...`,
                      timestamp: new Date(),
                    },
                  ])

                  // Set pending retry context — sendMessage reads and injects these into the request body
                  const fixPrompt = lastBuildPromptRef.current || trimmed
                  pendingLastErrorRef.current = statusData.lastCommandError
                  pendingRetryAttemptRef.current = attempt
                  pendingPreviousCodeRef.current = lastLuauRef.current

                  retryListenerRef.current = false
                  // Fire via sendMessage so all state (loading, messages, etc.) flows correctly.
                  // Set isAutoRetryRef so the reset-on-new-message guard is skipped.
                  isAutoRetryRef.current = true
                  void sendMessage(`[AUTO-RETRY attempt ${attempt}/${MAX_RETRIES}] ${fixPrompt}`)
                } catch { /* silent — includes AbortError */ } finally {
                  retryListenerRef.current = false
                }
              }
              void checkResult()
            }
          }

          // ── Auto-playtest: kick off the agentic test loop if code was executed ──
          if (
            autoPlaytest &&
            luauCode &&
            studioSessionId &&
            studioConnected &&
            (meta.executedInStudio || (onBuildComplete && lastLuauRef.current)) &&
            (aiMode === 'build' || aiMode === 'debug' || aiMode === 'script')
          ) {
            void triggerAutoPlaytest(luauCode, studioSessionId, assistantMsgId, trimmed)
          }
        } else {
          // ── Non-streaming fallback (body is null / custom key) ────────────────
          const data = await chatRes.json() as {
            message?: string
            tokensUsed?: number
            buildResult?: { luauCode?: string }
            suggestions?: string[]
            intent?: string
            hasCode?: boolean
            qualityScore?: number
            buildPartCount?: number
          }
          const responseText = data.message ?? getDemoResponse(trimmed)
          const tokensUsed = data.tokensUsed ?? estimateTokens(trimmed)

          setTotalTokens((prev) => prev + tokensUsed)

          // Track guest token usage in localStorage
          if (!user && typeof window !== 'undefined') {
            const prev = Number(localStorage.getItem('fg_guest_tokens') ?? '0')
            localStorage.setItem('fg_guest_tokens', String(prev + tokensUsed))
          }

          if (data.suggestions && data.suggestions.length > 0) {
            setSuggestions(data.suggestions)
          }

          setMessagesSync((prev) => {
            const without = prev.filter((m) => m.id !== statusMsgId)
            const assistantMsg: ChatMessage = {
              id: uid(),
              role: 'assistant',
              content: responseText,
              tokensUsed,
              timestamp: new Date(),
              model: selectedModel,
              suggestions: data.suggestions,
              intent: data.intent,
              hasCode: data.hasCode,
              streaming: false,
              ...(data.qualityScore ? { qualityScore: data.qualityScore } : {}),
              ...(data.buildPartCount ? { buildPartCount: data.buildPartCount } : {}),
            }
            const result: ChatMessage[] = [...without, assistantMsg]

            if (meshData) {
              result.push({
                id: uid(),
                role: 'system',
                content: meshData.status === 'complete'
                  ? '3D mesh generated. MeshPart Luau ready — check Assets to copy it.'
                  : meshData.status === 'pending'
                  ? `3D mesh generating (task ${meshData.taskId ?? 'unknown'}). Check back shortly.`
                  : '3D mesh: demo mode — add MESHY_API_KEY to generate real meshes.',
                timestamp: new Date(),
              })
            }

            messagesRef.current = result
            return result
          })

          // Persist session after non-streaming AI response
          persistSession(currentSessionIdRef.current, messagesRef.current)
          debouncedCloudSave()
          playCompletionSoundIfEnabled()
          saveCheckpoint()

          let luauCode = data.buildResult?.luauCode ?? meshData?.luauCode ?? null

          if (!luauCode && responseText) {
            const codeBlockMatch = responseText.match(/```(?:lua|luau)?\s*\n([\s\S]*?)```/)
            if (codeBlockMatch?.[1]?.trim()) {
              luauCode = codeBlockMatch[1].trim()
            }
          }

          if (studioConnected && luauCode && onBuildComplete) {
            lastLuauRef.current = luauCode
            onBuildComplete(luauCode, trimmed, studioSessionId ?? null)

            if (typeof window !== 'undefined' && !retryListenerRef.current) {
              retryListenerRef.current = true
              const retryAbort = new AbortController()
              const checkResult = async () => {
                await new Promise<void>((r) => setTimeout(r, 3000))
                if (!mountedRef.current || retryAbort.signal.aborted) {
                  retryListenerRef.current = false
                  return
                }
                try {
                  const statusRes = await fetch(`/api/studio/status?sessionId=${studioSessionId}`, { signal: retryAbort.signal })
                  if (!statusRes.ok) return
                  const statusData = await statusRes.json() as { lastCommandError?: string }
                  if (!mountedRef.current || !statusData.lastCommandError || !statusData.lastCommandError.includes('ERROR')) return

                  const MAX_RETRIES = 3
                  retryCountRef.current += 1
                  const attempt = retryCountRef.current

                  if (attempt > MAX_RETRIES) {
                    setMessagesSync((prev) => [
                      ...prev,
                      {
                        id: uid(),
                        role: 'build-error' as MessageRole,
                        content: `Build failed after ${MAX_RETRIES} attempts.`,
                        buildError: statusData.lastCommandError,
                        retryAttempt: attempt,
                        timestamp: new Date(),
                      },
                    ])
                    retryCountRef.current = 0
                    return
                  }

                  setMessagesSync((prev) => [
                    ...prev,
                    {
                      id: uid(),
                      role: 'status',
                      content: `Auto-fixing (attempt ${attempt}/${MAX_RETRIES})...`,
                      timestamp: new Date(),
                    },
                  ])

                  // Set pending retry context — sendMessage reads and injects these into the request body
                  pendingLastErrorRef.current = statusData.lastCommandError
                  pendingRetryAttemptRef.current = attempt
                  pendingPreviousCodeRef.current = lastLuauRef.current

                  retryListenerRef.current = false
                  isAutoRetryRef.current = true
                  void sendMessage(`[AUTO-RETRY attempt ${attempt}/${MAX_RETRIES}] ${lastBuildPromptRef.current || trimmed}`)
                } catch { /* silent — includes AbortError */ } finally {
                  retryListenerRef.current = false
                }
              }
              void checkResult()
            }
          }
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Unknown error'
        console.error('[ForjeAI] Chat error:', errMsg)
        setStreaming(false)

        let friendlyError: string
        if (errMsg.includes('abort') || errMsg.includes('AbortError') || err instanceof DOMException) {
          friendlyError = 'Request timed out — the AI is under heavy load. Try again or try a simpler prompt.'
        } else if (errMsg.includes('401') || errMsg.includes('403') || errMsg.toLowerCase().includes('unauthorized') || errMsg.toLowerCase().includes('forbidden')) {
          friendlyError = 'Please sign in to continue.'
        } else if (errMsg.includes('402') || errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('token limit') || errMsg.toLowerCase().includes('insufficient_tokens')) {
          friendlyError = 'Token limit reached — upgrade your plan to continue.'
        } else if (errMsg.includes('API error 5') || errMsg.includes('500') || errMsg.includes('502') || errMsg.includes('503') || errMsg.includes('504')) {
          friendlyError = 'Server error — try again in a moment.'
        } else if (errMsg.toLowerCase().includes('fetch') || errMsg.toLowerCase().includes('network') || errMsg.toLowerCase().includes('failed to fetch') || errMsg.toLowerCase().includes('load')) {
          friendlyError = 'Network error — check your connection.'
        } else {
          friendlyError = 'Server error — try again.'
        }

        setMessagesSync((prev) => [
          ...prev.filter((m) => m.id !== statusMsgId),
          {
            id: uid(),
            role: 'assistant',
            content: friendlyError,
            timestamp: new Date(),
            model: selectedModel,
          },
        ])
      } finally {
        setLoading(false)
        setTimeout(() => textareaRef.current?.focus(), 50)
      }
    },
    // retryCountRef / isAutoRetryRef / lastLuauRef / lastBuildPromptRef are refs — intentionally omitted
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loading, selectedModel, user, guestMessageCount, studioConnected, studioSessionId, studioContext, onBuildComplete, setMessagesSync, wsConnected, wsSend, wsOn, playCompletionSoundIfEnabled, enhancePrompts, debouncedCloudSave, autoPlaytest, triggerAutoPlaytest, aiMode, saveCheckpoint, imageOptions],
  )

  /** Exposed so UI error actions ("Try again") can reset the retry counter */
  const resetRetryCount = useCallback(() => {
    retryCountRef.current = 0
    isAutoRetryRef.current = false
  }, [])

  /** Remove a message by id — used to dismiss build-error cards */
  const dismissMessage = useCallback((id: string) => {
    setMessagesSync((prev) => prev.filter((m) => m.id !== id))
  }, [setMessagesSync])

  /**
   * Edit a user message and re-send it.
   * Removes the target message and every message after it, then calls sendMessage
   * with the updated content so the AI responds fresh.
   */
  const editAndResend = useCallback(
    (messageId: string, newContent: string) => {
      const current = messagesRef.current
      const idx = current.findIndex((m) => m.id === messageId)
      if (idx === -1) return
      // Keep only messages before the edited one
      const trimmed = current.slice(0, idx)
      setMessagesSync(() => trimmed)
      void sendMessage(newContent)
    },
    [setMessagesSync, sendMessage],
  )

  // ─── Session management ───────────────────────────────────────────────────────

  /** Save current chat (if non-empty) then clear messages and start a new session. */
  const newChat = useCallback(() => {
    const current = messagesRef.current
    if (current.filter((m) => m.role === 'user').length > 0) {
      persistSession(currentSessionIdRef.current, current)
      void syncToCloud()
    }
    // Clear the active-conversation key so refresh starts fresh
    if (typeof window !== 'undefined') {
      try { localStorage.removeItem(LS_ACTIVE_KEY) } catch { /* ignore */ }
    }
    setSessionId(uid())
    setMessagesSync(() => [])
    setSuggestions([])
    setTotalTokens(0)
    setInput('')
  }, [setMessagesSync, setSessionId, syncToCloud])

  /** Load a saved session by id — tries cloud first, falls back to localStorage. */
  const loadSession = useCallback(async (id: string) => {
    // Save current chat before switching, if it has content
    const current = messagesRef.current
    if (current.filter((m) => m.role === 'user').length > 0) {
      persistSession(currentSessionIdRef.current, current)
      void syncToCloud()
    }

    // Try cloud first
    try {
      const res = await fetch(`/api/sessions/${id}`)
      if (res.ok) {
        const data = await res.json()
        if (data.session && Array.isArray(data.session.messages)) {
          setSessionId(id)
          const rehydrated = data.session.messages.map((m: { id: string; role: string; content: string; metadata?: Record<string, unknown> | null; timestamp: string }) => ({
            id: m.id,
            role: m.role as MessageRole,
            content: m.content,
            ...(m.metadata?.tokensUsed ? { tokensUsed: m.metadata.tokensUsed as number } : {}),
            ...(m.metadata?.model ? { model: m.metadata.model as string } : {}),
            timestamp: new Date(m.timestamp),
          }))
          setMessagesSync(() => rehydrated)
          setSuggestions([])
          // Restore persisted AI mode (BUG 1) — falls back to 'build' when absent
          const restoredMode = (data.session.aiMode as string | undefined) || 'build'
          setAIMode(restoredMode as AIMode)
          return
        }
      }
    } catch {
      // Cloud load failed — fall through to localStorage
    }

    // Fall back to localStorage
    const sessions = loadSessions()
    const session = sessions.find((s) => s.id === id)
    if (!session) return
    setSessionId(id)
    const rehydrated = session.messages.map((m) => ({
      ...m,
      timestamp: new Date(m.timestamp),
    }))
    setMessagesSync(() => rehydrated)
    setSuggestions([])
  }, [setMessagesSync, setSessionId, syncToCloud])

  /**
   * Return metadata for all saved sessions (no message payloads).
   * Merges localStorage (fast, offline) and cloud sessions (cross-device).
   * Cloud entries win when ids collide. Result is sorted by updatedAt desc
   * so the mobile history panel shows recent activity from both sources
   * (BUG 8).
   */
  const listSessions = useCallback((): ChatSessionMeta[] => {
    const local = loadSessions().map(({ id, title, createdAt, updatedAt, messages }) => {
      const firstAi = messages.find((m) => m.role === 'assistant')
      const firstAiPreview = firstAi
        ? firstAi.content.replace(/```[\s\S]*?```/g, '[code]').replace(/\s+/g, ' ').trim().slice(0, 60) || null
        : null
      return {
        id,
        title,
        createdAt,
        updatedAt,
        messageCount: messages.length,
        firstAiPreview,
      } as ChatSessionMeta
    })

    const cloudIds = new Set(cloudSessions.map((s) => s.id))
    const cloudMeta: ChatSessionMeta[] = cloudSessions.map((c) => ({
      id: c.id,
      title: c.title,
      createdAt: typeof c.createdAt === 'string' ? c.createdAt : new Date(c.createdAt as unknown as string).toISOString(),
      updatedAt: typeof c.updatedAt === 'string' ? c.updatedAt : new Date(c.updatedAt as unknown as string).toISOString(),
      messageCount: c._count?.messages ?? 0,
      // Cloud list response omits message bodies, so preview is unavailable
      // until the session is opened; null is fine — the panel handles it.
      firstAiPreview: null,
    }))

    const merged: ChatSessionMeta[] = [
      ...cloudMeta,
      ...local.filter((l) => !cloudIds.has(l.id)),
    ]
    merged.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    return merged
  }, [cloudSessions])

  /** Delete a saved session by id (localStorage + cloud). */
  const deleteSession = useCallback((id: string) => {
    const sessions = loadSessions().filter((s) => s.id !== id)
    saveSessions(sessions)
    // Delete from cloud too (fire-and-forget)
    fetch(`/api/sessions/${id}`, { method: 'DELETE' })
      .then(() => fetchCloudSessions())
      .catch(() => { /* cloud delete failed — localStorage already updated */ })
    // If we deleted the active session, reset to a fresh one
    if (id === currentSessionIdRef.current) {
      setSessionId(uid())
      setMessagesSync(() => [])
      setSuggestions([])
      setTotalTokens(0)
    }
  }, [setMessagesSync, setSessionId, fetchCloudSessions])

  /** Clear all saved sessions and reset to a fresh chat. */
  const clearAllSessions = useCallback(() => {
    saveSessions([])
    setSessionId(uid())
    setMessagesSync(() => [])
    setSuggestions([])
    setTotalTokens(0)
  }, [setMessagesSync, setSessionId])

  /** Restore messages to a specific index — used by checkpoint restore. */
  const restoreToMessageIndex = useCallback((messageIndex: number) => {
    setMessagesSync((prev) => prev.slice(0, messageIndex))
    setSuggestions([])
  }, [setMessagesSync])

  /** Inject externally-provided messages (e.g. from a saved project). */
  const injectMessages = useCallback((msgs: ChatMessage[]) => {
    setMessagesSync(() => msgs)
    setSuggestions([])
  }, [setMessagesSync])

  // BUG 2: "Build direction" — lets the user explicitly tell the AI how to
  // treat the next prompt relative to prior context. Stored as a ref so
  // setting it doesn't trigger a re-render of the whole hook consumer.
  const [buildDirection, setBuildDirection] = useState<'continue' | 'pivot' | 'start-over'>('continue')

  // Slash command mode switching: /think, /plan, /build, etc.
  const wrappedSendMessage = useCallback(
    (text: string) => {
      const slashMatch = text.trim().match(/^\/(\w+)\s*(.*)/)
      if (slashMatch) {
        const cmd = slashMatch[1].toLowerCase()
        const rest = slashMatch[2]
        const modeMap: Record<string, AIMode> = {
          build: 'build', think: 'think', plan: 'plan', image: 'image',
          script: 'script', terrain: 'terrain', mesh: 'mesh', debug: 'debug',
          idea: 'idea', ideas: 'idea', fix: 'debug', code: 'script',
        }
        if (cmd in modeMap) {
          setAIMode(modeMap[cmd])
          if (rest.trim()) {
            sendMessage(rest.trim())
          }
          return
        }

        // /place <description> — place an object at camera position
        if (cmd === 'place' && rest.trim()) {
          const placePrompt = `Place the following at my current camera position in Studio, anchored, tagged fj_generated: ${rest.trim()}`
          setAIMode('build')
          sendMessage(placePrompt)
          return
        }

        // /game <prompt> — triggers the step-by-step game builder
        if (cmd === 'game' && rest.trim()) {
          if (studioConnected && studioSessionId) {
            void triggerStepByStepBuild(rest.trim(), studioSessionId)
          } else {
            // No Studio connected — fall back to normal chat with a
            // build-mode system prompt so the AI still tries its best
            setAIMode('build')
            sendMessage(`Build a complete playable Roblox game: ${rest.trim()}`)
          }
          return
        }
      }

      // BUG 2: apply build-direction semantics before sending.
      // - continue: default, just send as-is
      // - pivot: prepend "Change direction:" so the AI knows to take the
      //   conversation in a new direction instead of refining the last build
      // - start-over: clear the chat history first, then send as a fresh build
      let finalText = text
      if (buildDirection === 'pivot') {
        finalText = `Change direction: ${text}`
      } else if (buildDirection === 'start-over') {
        // Clear history synchronously so the next sendMessage sees empty state
        if (typeof window !== 'undefined') {
          try { localStorage.removeItem(LS_ACTIVE_KEY) } catch { /* ignore */ }
        }
        setSessionId(uid())
        setMessagesSync(() => [])
        setSuggestions([])
        setTotalTokens(0)
      }
      // Reset to continue after each send so direction is one-shot
      if (buildDirection !== 'continue') {
        setBuildDirection('continue')
      }
      sendMessage(finalText)
    },
    [sendMessage, buildDirection, setMessagesSync, setSessionId],
  )

  // Plan mode approval
  const approvePlan = useCallback(() => {
    if (planText) {
      setPlanText(null)
      setAIMode('build')
      sendMessage(`[APPROVED_PLAN] Execute this build plan:\n${planText}`)
    }
  }, [planText, sendMessage])

  const editPlan = useCallback(() => {
    if (planText) {
      setInput(planText)
      setPlanText(null)
    }
  }, [planText])

  const cancelPlan = useCallback(() => {
    setPlanText(null)
  }, [])

  return {
    messages,
    input,
    setInput,
    loading,
    streaming,
    suggestions,
    sendMessage: wrappedSendMessage,
    resetRetryCount,
    dismissMessage,
    editAndResend,
    selectedModel,
    setSelectedModel,
    imageFile,
    setImageFile,
    totalTokens,
    textareaRef,
    lastMcpResult,
    // AI Mode
    aiMode,
    setAIMode,
    // Auto-playtest
    autoPlaytest,
    setAutoPlaytest,
    // Prompt enhancement toggle
    enhancePrompts,
    setEnhancePrompts,
    isThinking,
    thinkingText,
    planText,
    approvePlan,
    editPlan,
    cancelPlan,
    // BUG 2: Build direction
    buildDirection,
    setBuildDirection,
    // Session persistence
    newChat,
    loadSession,
    listSessions,
    deleteSession,
    clearAllSessions,
    injectMessages,
    restoreToMessageIndex,
    currentSessionId,
    savedAt,
    // Checkpoints
    checkpoints,
    saveCheckpoint,
    restoreToCheckpoint,
    removeCheckpoint,
    // Completion sound toggle
    soundEnabled,
    setSoundEnabled,
    // Cloud session persistence
    cloudSessions,
    syncToCloud,
    // Image mode options (BUG 9)
    imageOptions,
    setImageOptions,
    // Step-by-step game builder
    triggerStepByStepBuild,
    // Pre-build preview mode
    previewMode,
    setPreviewMode,
  }
}
