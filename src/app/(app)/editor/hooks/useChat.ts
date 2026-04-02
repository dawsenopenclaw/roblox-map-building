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
  const [selectedModel, setSelectedModel] = useState<ModelId>('claude-4')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [totalTokens, setTotalTokens] = useState(0)
  const [guestMessageCount, setGuestMessageCount] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const retryListenerRef = useRef(false)

  const sendMessage = useCallback(
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

      // Guest limit
      if (!user && guestMessageCount >= GUEST_MESSAGE_LIMIT) {
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== statusMsg.id),
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
        const chatBody: Record<string, unknown> = { message: trimmed, model: selectedModel }
        if (studioConnected && studioContext) {
          chatBody.studioContext = studioContext
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
            setMessages((prev) => [
              ...prev.filter((m) => m.id !== statusMsg.id),
              { id: uid(), role: 'upgrade', content: '', timestamp: new Date() },
            ])
            setLoading(false)
            return
          }
        }

        if (!chatRes.ok) throw new Error(`API error ${chatRes.status}`)

        const data = await chatRes.json() as { message?: string; tokensUsed?: number; buildResult?: { luauCode?: string } }
        const responseText = data.message ?? getDemoResponse(trimmed)
        const tokensUsed = data.tokensUsed ?? estimateTokens(trimmed)

        setTotalTokens((prev) => prev + tokensUsed)

        const msgs: ChatMessage[] = [
          ...messages.filter((m) => m.id !== statusMsg.id),
        ]

        setMessages((prev) => {
          const without = prev.filter((m) => m.id !== statusMsg.id)
          const assistantMsg: ChatMessage = {
            id: uid(),
            role: 'assistant',
            content: responseText,
            tokensUsed,
            timestamp: new Date(),
            model: selectedModel,
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

        // Forward Luau to Studio if connected
        let luauCode = data.buildResult?.luauCode ?? meshData?.luauCode ?? null

        // If no explicit buildResult, extract Lua code blocks from the AI's text response
        if (!luauCode && responseText) {
          const codeBlockMatch = responseText.match(/```(?:lua|luau)?\s*\n([\s\S]*?)```/)
          if (codeBlockMatch?.[1]?.trim()) {
            luauCode = codeBlockMatch[1].trim()
          }
        }

        if (studioConnected && luauCode && onBuildComplete) {
          onBuildComplete(luauCode, trimmed, studioSessionId ?? null)

          // Error recovery: listen for command_result errors and auto-retry
          if (typeof window !== 'undefined' && !retryListenerRef.current) {
            retryListenerRef.current = true
            const checkResult = async () => {
              // Wait for plugin to execute (up to 5s)
              await new Promise(r => setTimeout(r, 3000))
              try {
                const statusRes = await fetch(`/api/studio/status?sessionId=${studioSessionId}`)
                if (!statusRes.ok) return
                const statusData = await statusRes.json() as Record<string, unknown>
                // Check if last command failed via session's latest state
                const latestState = statusData as { lastCommandError?: string }
                if (latestState.lastCommandError && latestState.lastCommandError.includes('ERROR')) {
                  // Auto-send error back to AI for fix (one retry only)
                  const fixPrompt = `The code you just generated had an error:\n${latestState.lastCommandError}\n\nPlease fix the code and try again. Generate corrected Lua code.`
                  // Trigger a follow-up message
                  setMessages(prev => [...prev, {
                    id: uid(),
                    role: 'system',
                    content: `Build error detected — auto-fixing: ${latestState.lastCommandError}`,
                    timestamp: new Date(),
                  }])
                }
              } catch { /* silent */ }
              retryListenerRef.current = false
            }
            void checkResult()
          }
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Unknown error'
        console.error('[ForjeAI] Chat error:', errMsg)
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== statusMsg.id),
          {
            id: uid(),
            role: 'assistant',
            content: `Hit a snag — ${errMsg.includes('API error') ? 'server returned an error' : 'could not reach the server'}. Please try again.`,
            timestamp: new Date(),
            model: selectedModel,
          },
        ])
      } finally {
        setLoading(false)
        setTimeout(() => textareaRef.current?.focus(), 50)
      }
    },
    [loading, selectedModel, user, guestMessageCount, studioConnected, studioSessionId, onBuildComplete, messages],
  )

  return {
    messages,
    input,
    setInput,
    loading,
    sendMessage,
    selectedModel,
    setSelectedModel,
    imageFile,
    setImageFile,
    totalTokens,
    textareaRef,
  }
}
