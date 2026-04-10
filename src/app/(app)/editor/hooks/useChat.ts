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

export type MessageRole = 'user' | 'assistant' | 'system' | 'status' | 'upgrade' | 'signup' | 'build-error'

export type ModelId =
  | 'claude-4'
  | 'claude-3-5'
  | 'gemini-2'
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | 'o1-preview'
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
}

export const MODELS: ModelOption[] = [
  { id: 'gemini-2',         label: 'Forje AI',          provider: 'Free',      color: '#D4AF37', badge: 'FREE' },
  { id: 'gpt-4o',           label: 'GPT-4o',            provider: 'OpenAI',    color: '#10A37F' },
  { id: 'gpt-4o-mini',      label: 'GPT-4o Mini',       provider: 'OpenAI',    color: '#10A37F', badge: 'FAST' },
  { id: 'o1-preview',       label: 'o1-preview',        provider: 'OpenAI',    color: '#10A37F', badge: 'THINK' },
  { id: 'custom-anthropic', label: 'Claude 4',          provider: 'Your Key',  color: '#CC785C', badge: 'PRO' },
  { id: 'custom-openai',    label: 'GPT (Your Key)',    provider: 'Your Key',  color: '#10A37F', badge: 'PRO' },
  { id: 'custom-google',    label: 'Gemini Pro',        provider: 'Your Key',  color: '#4285F4', badge: 'PRO' },
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
  const { connected: wsConnected, send: wsSend, on: wsOn } = useWebSocket()

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [lastMcpResult, setLastMcpResult] = useState<McpAgentResult | null>(null)
  const [selectedModel, setSelectedModel] = useState<ModelId>('gemini-2')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [totalTokens, setTotalTokens] = useState(0)
  const [guestMessageCount, setGuestMessageCount] = useState(0)
  // AI Mode state — determines how prompts are processed
  const [aiMode, setAIMode] = useState<AIMode>('build')
  // Auto-playtest: when true, agentic playtest runs automatically after code is sent to Studio
  const [autoPlaytest, setAutoPlaytest] = useState(true)
  const autoPlaytestAbortRef = useRef<AbortController | null>(null)
  // Thinking/reasoning display state
  const [isThinking, setIsThinking] = useState(false)
  const [thinkingText, setThinkingText] = useState('')
  // Plan mode state
  const [planText, setPlanText] = useState<string | null>(null)
  // Prompt enhancement toggle — when true, prompts are enhanced via Groq before main AI
  const [enhancePrompts, setEnhancePrompts] = useState(true)
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
        }),
      })
      // Refresh cloud sessions list after successful sync
      await fetchCloudSessions()
    } catch {
      // Cloud sync failed — localStorage is still the source of truth
    }
  }, [fetchCloudSessions])

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
    const rehydrated = latest.messages.map((m) => ({
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
      .filter((m) => !m.streaming)
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

  // ─── Agentic Auto-Playtest ─────────────────────────────────────────────────
  // Triggers the autonomous build-test-fix loop after code is sent to Studio.
  // Reads the SSE stream from /api/ai/playtest and adds status messages to chat.
  const triggerAutoPlaytest = useCallback(
    async (code: string, sessionId: string, assistantMsgId: string) => {
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
          body: JSON.stringify({ code, sessionId, maxIterations: 3 }),
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
              // Route to /api/ai/image with mode detection from prompt
              const promptLower = trimmed.toLowerCase()
              const imageMode = promptLower.includes('icon') ? 'icon'
                : promptLower.includes('thumbnail') || promptLower.includes('cover') ? 'thumbnail'
                : promptLower.includes('gfx') || promptLower.includes('character') ? 'gfx'
                : promptLower.includes('clothing') || promptLower.includes('shirt') || promptLower.includes('pants') ? 'clothing'
                : 'asset'
              apiUrl = '/api/ai/image'
              apiBody = { prompt: trimmed, mode: imageMode, count: 1 }
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

            const specialRes = await fetch(apiUrl, {
              method: 'POST',
              headers,
              body: JSON.stringify(apiBody),
            })

            const specialData = await specialRes.json()
            const resultContent = aiMode === 'image'
              ? `**Generated Image${specialData.images?.length > 1 ? 's' : ''}** (${apiBody.mode || 'asset'} mode)\n\n${
                  (specialData.images || []).map((img: { url: string }, i: number) =>
                    `![Generated ${i + 1}](${img.url})`
                  ).join('\n\n')
                }${enhancedPrompt !== trimmed ? `\n\n*Enhanced prompt: "${enhancedPrompt}"*` : ''}`
              : `**3D Model Generated**\n\n${specialData.meshUrl ? `[Download Model](${specialData.meshUrl})` : 'Generation in progress...'}\n\n${specialData.luauCode || ''}`

            setMessagesSync((prev) => [
              ...prev.filter((m) => m.id !== statusMsgId),
              {
                id: uid(),
                role: 'assistant',
                content: specialRes.ok ? resultContent : `Error: ${specialData.error || 'Generation failed'}`,
                timestamp: new Date(),
                model: selectedModel,
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
            message: trimmed,
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
              }
              void finish()
            }))

            // Handle errors
            cleanup.push(wsOn('chat_error', (msg) => {
              const data = msg as { error?: string }
              meta = { error: data.error || 'WebSocket streaming error' }
              void finish()
            }))

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
            if (meta.executedInStudio) {
              result.push({
                id: uid(),
                role: 'status',
                content: 'Sent to Roblox Studio — check your viewport!',
                timestamp: new Date(),
              })
            }
            messagesRef.current = result
            return result
          })

          // Extract code from raw stream buffer for preview + execution
          let luauCode: string | null = null
          if (meta.hasCode) {
            const codeBlockMatch = rawStreamBuffer.match(/```(?:lua|luau)?\s*\n([\s\S]*?)```/)
            if (codeBlockMatch?.[1]?.trim()) {
              luauCode = codeBlockMatch[1].trim()
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
            void triggerAutoPlaytest(luauCode, studioSessionId, assistantMsgId)
          }

          setLoading(false)
          playCompletionSoundIfEnabled()
          saveCheckpoint()
          setTimeout(() => textareaRef.current?.focus(), 50)
          return // WebSocket path complete — skip HTTP fallback below
        }

        // ── HTTP fetch streaming path (fallback when WebSocket is not connected) ──

        const chatPromise = fetch('/api/ai/chat', {
          method: 'POST',
          headers,
          body: JSON.stringify(chatBody),
        })

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

        // Token exhaustion — any 402 means tokens are depleted
        if (chatRes.status === 402) {
          setMessagesSync((prev) => [
            ...prev.filter((m) => m.id !== statusMsgId),
            { id: uid(), role: 'upgrade', content: '', timestamp: new Date() },
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
            // Show execution status to user
            if (meta.executedInStudio) {
              result.push({
                id: uid(),
                role: 'status',
                content: 'Sent to Roblox Studio — check your viewport!',
                timestamp: new Date(),
              })
            }
            messagesRef.current = result
            return result
          })

          // Extract code from raw stream buffer for preview + execution
          let luauCode: string | null = null
          if (meta.hasCode) {
            const codeBlockMatch = rawStreamBuffer.match(/```(?:lua|luau)?\s*\n([\s\S]*?)```/)
            if (codeBlockMatch?.[1]?.trim()) {
              luauCode = codeBlockMatch[1].trim()
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
            void triggerAutoPlaytest(luauCode, studioSessionId, assistantMsgId)
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
        if (errMsg.includes('401') || errMsg.includes('403') || errMsg.toLowerCase().includes('unauthorized') || errMsg.toLowerCase().includes('forbidden')) {
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
    [loading, selectedModel, user, guestMessageCount, studioConnected, studioSessionId, studioContext, onBuildComplete, setMessagesSync, wsConnected, wsSend, wsOn, playCompletionSoundIfEnabled, enhancePrompts, debouncedCloudSave, autoPlaytest, triggerAutoPlaytest, aiMode, saveCheckpoint],
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

  /** Return metadata for all saved sessions (no message payloads). */
  const listSessions = useCallback((): ChatSessionMeta[] => {
    return loadSessions().map(({ id, title, createdAt, updatedAt, messages }) => {
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
      }
    })
  }, [])

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
      }
      sendMessage(text)
    },
    [sendMessage],
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
  }
}
