'use client'

import { useState, useCallback, useRef } from 'react'
import { useUser } from '@clerk/nextjs'

// ─── Types ────────────────────────────────────────────────────────────────────

export type MessageRole = 'user' | 'assistant' | 'system' | 'status' | 'upgrade' | 'signup'

export type ModelId =
  | 'claude-4'
  | 'claude-3-5'
  | 'gemini-2'
  | 'gpt-4o'
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
}

export const MODELS: ModelOption[] = [
  { id: 'claude-4',         label: 'Claude 4',         provider: 'Anthropic', color: '#CC785C', badge: 'BEST' },
  { id: 'claude-3-5',       label: 'Claude 3.5',       provider: 'Anthropic', color: '#CC785C' },
  { id: 'gemini-2',         label: 'Gemini 2.0',       provider: 'Google',    color: '#4285F4' },
  { id: 'gpt-4o',           label: 'GPT-4o',           provider: 'OpenAI',    color: '#10A37F' },
  { id: 'grok-3',           label: 'Grok 3',           provider: 'xAI',       color: '#8B5CF6' },
  { id: 'custom-anthropic', label: 'My Anthropic Key', provider: 'Custom',    color: '#D4AF37', badge: 'BYO' },
  { id: 'custom-openai',    label: 'My OpenAI Key',    provider: 'Custom',    color: '#D4AF37', badge: 'BYO' },
  { id: 'custom-google',    label: 'My Google Key',    provider: 'Custom',    color: '#D4AF37', badge: 'BYO' },
]

const GUEST_MESSAGE_LIMIT = 3

const BUILD_KEYWORDS = ['build', 'generate 3d', 'create mesh', 'make a 3d', 'generate mesh', '3d model', 'mesh:']

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

interface StreamMeta {
  suggestions?: string[]
  intent?: string
  hasCode?: boolean
  tokensUsed?: number
  executedInStudio?: boolean
  model?: string
  error?: string
}

async function readStream(
  body: ReadableStream<Uint8Array>,
  onChunk: (text: string) => void,
): Promise<StreamMeta> {
  const reader = body.getReader()
  const dec = new TextDecoder()
  let metaResult: StreamMeta = {}
  let leftover = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const raw = leftover + dec.decode(value, { stream: true })
      leftover = ''

      // The sentinel is a \x00-prefixed JSON blob. It may arrive mid-buffer or
      // at the end, so split on \x00 once and handle both halves.
      const sentinelIdx = raw.indexOf('\x00')
      if (sentinelIdx !== -1) {
        const textPart = raw.slice(0, sentinelIdx)
        const jsonPart = raw.slice(sentinelIdx + 1)
        if (textPart) onChunk(textPart)
        try {
          metaResult = JSON.parse(jsonPart) as StreamMeta
        } catch {
          // malformed meta — ignore, keep defaults
        }
        break
      }

      onChunk(raw)
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

export function useChat(options: UseChatOptions = {}) {
  const { user } = useUser()
  const { onBuildComplete, studioSessionId, studioConnected, studioContext } = options

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [selectedModel, setSelectedModel] = useState<ModelId>('claude-4')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [totalTokens, setTotalTokens] = useState(0)
  const [guestMessageCount, setGuestMessageCount] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const retryListenerRef = useRef(false)
  // Ref used to read current messages inside async callbacks without stale closure
  const messagesRef = useRef<ChatMessage[]>([])

  // Keep ref in sync with state
  const setMessagesSync = useCallback((updater: (prev: ChatMessage[]) => ChatMessage[]) => {
    setMessages((prev) => {
      const next = updater(prev)
      messagesRef.current = next
      return next
    })
  }, [])

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || loading) return

      setInput('')
      setImageFile(null)
      setLoading(true)
      setSuggestions([])

      const userMsg: ChatMessage = {
        id: uid(),
        role: 'user',
        content: trimmed,
        timestamp: new Date(),
      }
      const statusMsgId = uid()
      const statusMsg: ChatMessage = {
        id: statusMsgId,
        role: 'status',
        content: 'ForjeAI is thinking...',
        timestamp: new Date(),
      }

      setMessagesSync((prev) => [...prev, userMsg, statusMsg])

      // Guest limit
      if (!user && guestMessageCount >= GUEST_MESSAGE_LIMIT) {
        setMessagesSync((prev) => [
          ...prev.filter((m) => m.id !== statusMsgId),
          { id: uid(), role: 'signup', content: '', timestamp: new Date() },
        ])
        setLoading(false)
        return
      }
      if (!user) setGuestMessageCount((c) => c + 1)

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

        // Detect mesh intent for parallel generation
        const lowerTrimmed = trimmed.toLowerCase()
        const isBuildMeshIntent = BUILD_KEYWORDS.some((kw) => lowerTrimmed.includes(kw))

        // Include Studio context so AI knows camera position + nearby objects
        const chatBody: Record<string, unknown> = {
          message: trimmed,
          model: selectedModel,
          stream: true,
        }
        if (studioConnected && studioContext) {
          chatBody.studioContext = studioContext
        }

        // Send sessionId in header so the API can auto-execute code in Studio
        if (studioConnected && studioSessionId) {
          headers['x-studio-session'] = studioSessionId
        }

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

        const meshPromise: Promise<MeshAPIResponse | null> = isBuildMeshIntent
          ? fetch('/api/ai/mesh', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                prompt: trimmed.replace(/^(build|generate|create|make)\s+(a\s+)?(3d\s+)?(mesh\s*[:：]?\s*)?/i, '').trim().slice(0, 200),
                quality: 'standard',
                withTextures: true,
              }),
            })
              .then((r) => (r.ok ? (r.json() as Promise<MeshAPIResponse>) : null))
              .catch(() => null)
          : Promise.resolve(null)

        const [chatRes, meshData] = await Promise.all([chatPromise, meshPromise])

        // Token exhaustion
        if (chatRes.status === 402) {
          const errData = await chatRes.json() as { error?: string }
          if (errData.error === 'insufficient_tokens') {
            setMessagesSync((prev) => [
              ...prev.filter((m) => m.id !== statusMsgId),
              { id: uid(), role: 'upgrade', content: '', timestamp: new Date() },
            ])
            setLoading(false)
            return
          }
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

          if (meta.suggestions && meta.suggestions.length > 0) {
            setSuggestions(meta.suggestions)
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

          // Forward Luau to Studio if connected (via client-side fallback)
          // The server already auto-executes when x-studio-session header is set,
          // but this is a backup path if the server couldn't reach the session.
          let luauCode: string | null = null

          if (meta.hasCode && !meta.executedInStudio) {
            // Use rawStreamBuffer which still contains the original code blocks —
            // the displayed content was already stripped during streaming.
            const codeBlockMatch = rawStreamBuffer.match(/```(?:lua|luau)?\s*\n([\s\S]*?)```/)
            if (codeBlockMatch?.[1]?.trim()) {
              luauCode = codeBlockMatch[1].trim()
            }
          }

          luauCode = luauCode ?? meshData?.luauCode ?? null

          if (studioConnected && luauCode && onBuildComplete) {
            onBuildComplete(luauCode, trimmed, studioSessionId ?? null)

            if (typeof window !== 'undefined' && !retryListenerRef.current) {
              retryListenerRef.current = true
              const checkResult = async () => {
                await new Promise<void>((r) => setTimeout(r, 3000))
                try {
                  const statusRes = await fetch(`/api/studio/status?sessionId=${studioSessionId}`)
                  if (!statusRes.ok) return
                  const statusData = await statusRes.json() as { lastCommandError?: string }
                  if (statusData.lastCommandError && statusData.lastCommandError.includes('ERROR')) {
                    setMessagesSync((prev) => [
                      ...prev,
                      {
                        id: uid(),
                        role: 'system',
                        content: `Build error detected — auto-fixing: ${statusData.lastCommandError}`,
                        timestamp: new Date(),
                      },
                    ])
                  }
                } catch { /* silent */ } finally {
                  retryListenerRef.current = false
                }
              }
              void checkResult()
            }
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

            return result
          })

          let luauCode = data.buildResult?.luauCode ?? meshData?.luauCode ?? null

          if (!luauCode && responseText) {
            const codeBlockMatch = responseText.match(/```(?:lua|luau)?\s*\n([\s\S]*?)```/)
            if (codeBlockMatch?.[1]?.trim()) {
              luauCode = codeBlockMatch[1].trim()
            }
          }

          if (studioConnected && luauCode && onBuildComplete) {
            onBuildComplete(luauCode, trimmed, studioSessionId ?? null)

            if (typeof window !== 'undefined' && !retryListenerRef.current) {
              retryListenerRef.current = true
              const checkResult = async () => {
                await new Promise<void>((r) => setTimeout(r, 3000))
                try {
                  const statusRes = await fetch(`/api/studio/status?sessionId=${studioSessionId}`)
                  if (!statusRes.ok) return
                  const statusData = await statusRes.json() as { lastCommandError?: string }
                  if (statusData.lastCommandError && statusData.lastCommandError.includes('ERROR')) {
                    setMessagesSync((prev) => [
                      ...prev,
                      {
                        id: uid(),
                        role: 'system',
                        content: `Build error detected — auto-fixing: ${statusData.lastCommandError}`,
                        timestamp: new Date(),
                      },
                    ])
                  }
                } catch { /* silent */ } finally {
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
    [loading, selectedModel, user, guestMessageCount, studioConnected, studioSessionId, studioContext, onBuildComplete, setMessagesSync],
  )

  return {
    messages,
    input,
    setInput,
    loading,
    streaming,
    suggestions,
    sendMessage,
    selectedModel,
    setSelectedModel,
    imageFile,
    setImageFile,
    totalTokens,
    textareaRef,
  }
}
