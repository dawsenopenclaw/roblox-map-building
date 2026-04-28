/**
 * AI Provider abstraction — Gemini (primary) + Groq (fallback).
 *
 * Used by build-planner, build-executor, and game-scanner so they all share
 * the same provider fallback chain without touching the Anthropic SDK.
 *
 * Env vars:
 *   GEMINI_API_KEY  — Google Gemini free tier (15 RPM, 1M tokens/day)
 *   GROQ_API_KEY    — Groq free tier (30 RPM, llama-3.3-70b-versatile)
 *   ANTHROPIC_DISABLED=true — set this in Vercel to skip Anthropic entirely
 */

import 'server-only'
import { buildRAGSystemPrompt } from './rag'
import { findSpecialist, findSpecialists, applySpecialist, getSpecialistRAGCategories } from './specialists/router'
import { callOpenRouter, selectBestModel, estimateBuildComplexity } from './openrouter'
import { isPaidModelsEnabled } from '@/lib/spending-guard'
import { getNextKey, reportRateLimit } from './key-rotator'

export interface AIMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface AICallOptions {
  /** When true, ask Gemini to return application/json MIME type */
  jsonMode?: boolean
  maxTokens?: number
  temperature?: number
  /** When true, use lower temperature (0.2) for deterministic code output */
  codeMode?: boolean
  /** When true, enrich the system prompt with relevant Roblox docs from vector DB */
  useRAG?: boolean
  /** Filter RAG retrieval to specific doc categories */
  ragCategories?: string[]
  /** When true, return a ReadableStream of text chunks instead of waiting for full response */
  stream?: boolean
  /** Callback for each streamed chunk (only used when stream: true) */
  onChunk?: (chunk: string) => void
}

// ── Retry helper for 429 rate limits ─────────────────────────────────────────

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

const MAX_RETRIES = 3
const RETRY_DELAYS = [2000, 5000, 10000] // 2s, 5s, 10s backoff

// ── Gemini REST call ──────────────────────────────────────────────────────────

async function callGemini(
  systemPrompt: string,
  messages: AIMessage[],
  opts: AICallOptions = {},
): Promise<string | null> {
  // Use key rotator for multi-key support (15 RPM per key, 10 keys = 150 RPM)
  const key = getNextKey('GEMINI') || process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_MAIN
  if (!key) return null

  const { maxTokens = 65536, temperature = opts.codeMode ? 0.2 : 0.7, jsonMode = false } = opts

  // Gemini uses a separate system_instruction + contents format
  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

  const body: Record<string, unknown> = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents,
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature,
      ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
    },
  }

  type GeminiRes = { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(60_000),
        },
      )
      if (res.status === 429) {
        reportRateLimit('GEMINI', key, 60000) // Cool this key for 60s
        if (attempt < MAX_RETRIES) {
          // Try a different key on retry
          const nextKey = getNextKey('GEMINI')
          if (nextKey && nextKey !== key) {
            console.warn(`[ai-provider/gemini] 429 — rotating to next key (attempt ${attempt + 1}/${MAX_RETRIES})`)
            // Rebuild the URL with the new key and retry immediately
            const retryRes = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${nextKey}`,
              { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(60_000) },
            )
            if (retryRes.ok) {
              const retryData = (await retryRes.json()) as GeminiRes
              return retryData.candidates?.[0]?.content?.parts?.[0]?.text ?? null
            }
            if (retryRes.status === 429) reportRateLimit('GEMINI', nextKey, 60000)
          }
          const delay = RETRY_DELAYS[attempt] ?? 10000
          console.warn(`[ai-provider/gemini] 429 — waiting ${delay / 1000}s (attempt ${attempt + 1}/${MAX_RETRIES})`)
          await sleep(delay)
          continue
        }
      }
      if (!res.ok) {
        console.error('[ai-provider/gemini] HTTP', res.status, await res.text().catch(() => ''))
        return null
      }
      const data = await res.json() as GeminiRes
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? null
      if (!text) {
        console.error('[ai-provider/gemini] Empty response')
        return null
      }
      return text
    } catch (e) {
      console.error('[ai-provider/gemini] Error:', (e as Error).message)
      return null
    }
  }
  console.error('[ai-provider/gemini] Exhausted retries on 429')
  return null
}

// ── Groq REST call (OpenAI-compatible) ───────────────────────────────────────

async function callGroq(
  systemPrompt: string,
  messages: AIMessage[],
  opts: AICallOptions = {},
): Promise<string | null> {
  const key = getNextKey('GROQ') || process.env.GROQ_API_KEY || process.env.GROQ_API_KEY_MAIN
  if (!key) return null

  const { maxTokens: requestedTokens = 65536, temperature = opts.codeMode ? 0.2 : 0.7 } = opts
  // Groq's llama-3.3-70b max output is 32768 tokens
  const maxTokens = Math.min(requestedTokens, 32768)

  const groqMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.filter((m) => m.role !== 'system').map((m) => ({
      role: m.role,
      content: m.content,
    })),
  ]

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: groqMessages,
          max_tokens: maxTokens,
          temperature,
        }),
        signal: AbortSignal.timeout(60_000),
      })
      if (res.status === 429) {
        reportRateLimit('GROQ', key, 60000)
        if (attempt >= MAX_RETRIES) break
        const delay = RETRY_DELAYS[attempt] ?? 10000
        console.warn(`[ai-provider/groq] 429 rate limited — retrying in ${delay / 1000}s (attempt ${attempt + 1}/${MAX_RETRIES})`)
        await sleep(delay)
        continue
      }
      if (!res.ok) {
        console.error('[ai-provider/groq] HTTP', res.status, await res.text().catch(() => ''))
        return null
      }
      type GroqRes = { choices?: Array<{ message?: { content?: string } }> }
      const data = await res.json() as GroqRes
      const text = data.choices?.[0]?.message?.content ?? null
      if (!text) {
        console.error('[ai-provider/groq] Empty response')
        return null
      }
      return text
    } catch (e) {
      console.error('[ai-provider/groq] Error:', (e as Error).message)
      return null
    }
  }
  console.error('[ai-provider/groq] Exhausted retries on 429')
  return null
}

// ── Streaming: Gemini stream endpoint ────────────────────────────────────────

async function* streamGemini(
  systemPrompt: string,
  messages: AIMessage[],
  opts: AICallOptions = {},
): AsyncGenerator<string, void, unknown> {
  const key = process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_MAIN
  if (!key) return

  const { maxTokens = 65536, temperature = opts.codeMode ? 0.2 : 0.7 } = opts

  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents,
    generationConfig: { maxOutputTokens: maxTokens, temperature },
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120_000),
    },
  )

  if (!res.ok || !res.body) {
    console.error('[ai-provider/gemini-stream] HTTP', res.status)
    return
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const json = line.slice(6).trim()
      if (json === '[DONE]') return
      try {
        const parsed = JSON.parse(json)
        const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text
        if (text) yield text
      } catch { /* skip malformed SSE lines */ }
    }
  }
}

// ── Streaming: Groq stream (OpenAI-compatible) ──────────────────────────────

async function* streamGroq(
  systemPrompt: string,
  messages: AIMessage[],
  opts: AICallOptions = {},
): AsyncGenerator<string, void, unknown> {
  const key = process.env.GROQ_API_KEY || process.env.GROQ_API_KEY_MAIN
  if (!key) return

  const { maxTokens: requestedStreamTokens = 65536, temperature = opts.codeMode ? 0.2 : 0.7 } = opts
  // Groq's llama-3.3-70b max output is 32768 tokens
  const maxTokens = Math.min(requestedStreamTokens, 32768)

  const groqMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content })),
  ]

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: groqMessages,
      max_tokens: maxTokens,
      temperature,
      stream: true,
    }),
    signal: AbortSignal.timeout(120_000),
  })

  if (!res.ok || !res.body) {
    console.error('[ai-provider/groq-stream] HTTP', res.status)
    return
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const json = line.slice(6).trim()
      if (json === '[DONE]') return
      try {
        const parsed = JSON.parse(json)
        const text = parsed?.choices?.[0]?.delta?.content
        if (text) yield text
      } catch { /* skip malformed SSE lines */ }
    }
  }
}

// ── Public: callAIStream — streaming version ────────────────────────────────

/**
 * Stream AI response token-by-token. Tries Gemini streaming first, then Groq.
 * Returns the full accumulated text after streaming completes.
 * Use onChunk callback to process chunks in real-time.
 */
export async function callAIStream(
  systemPrompt: string,
  messages: AIMessage[],
  opts: AICallOptions = {},
): Promise<string> {
  let enrichedPrompt = systemPrompt
  const userMessage = messages.filter(m => m.role === 'user').pop()?.content ?? ''

  if (opts.useRAG) {
    const specialists = await findSpecialists(userMessage)
    if (specialists.length > 0) {
      enrichedPrompt = applySpecialist(enrichedPrompt, specialists)
      const specialistCategories = getSpecialistRAGCategories(specialists)
      opts = { ...opts, ragCategories: [...new Set([...(opts.ragCategories ?? []), ...specialistCategories])] }
    }
    try {
      enrichedPrompt = await buildRAGSystemPrompt(enrichedPrompt, userMessage, opts.ragCategories)
    } catch (e) {
      console.error('[ai-provider] RAG enrichment failed:', (e as Error).message)
    }
  }

  // Try Gemini streaming
  let accumulated = ''
  try {
    for await (const chunk of streamGemini(enrichedPrompt, messages, opts)) {
      accumulated += chunk
      opts.onChunk?.(chunk)
    }
    if (accumulated) return accumulated
  } catch (e) {
    console.error('[ai-provider/stream] Gemini stream failed:', (e as Error).message)
  }

  // Fallback to Groq streaming
  accumulated = ''
  try {
    for await (const chunk of streamGroq(enrichedPrompt, messages, opts)) {
      accumulated += chunk
      opts.onChunk?.(chunk)
    }
    if (accumulated) return accumulated
  } catch (e) {
    console.error('[ai-provider/stream] Groq stream failed:', (e as Error).message)
  }

  // Final fallback: non-streaming callAI
  return callAI(systemPrompt, messages, { ...opts, stream: false })
}

// ── Smart Model Routing ─────────────────────────────────────────────────────

export type ModelTier = 'fast' | 'primary' | 'premium'

interface ModelTierConfig {
  tier: ModelTier
  reason: string
}

/**
 * Select the optimal model tier based on request characteristics.
 * FAST (Groq/Flash): classification, planning, simple fixes, explanations
 * PRIMARY (Gemini 2.0 Flash): standard generation, single-file scripts
 * PREMIUM (OpenRouter best): multi-file systems, error recovery escalation, full game gen
 */
export function selectModelTier(
  prompt: string,
  opts: {
    isErrorRecovery?: boolean
    retryCount?: number
    estimatedOutputLines?: number
    isMultiFile?: boolean
  } = {},
): ModelTierConfig {
  const lower = prompt.toLowerCase()

  // Error recovery escalation: after 2 failed attempts, use premium
  if (opts.isErrorRecovery && (opts.retryCount ?? 0) >= 2) {
    return { tier: 'premium', reason: 'Error recovery escalation after 2 failed attempts' }
  }

  // Multi-file generation always uses primary or premium
  if (opts.isMultiFile) {
    return {
      tier: (opts.estimatedOutputLines ?? 0) > 200 ? 'premium' : 'primary',
      reason: 'Multi-file script generation',
    }
  }

  // Classification, planning, prompt enhancement → FAST
  const fastPatterns = [
    /classify|categorize|identify|detect/,
    /plan|outline|list|enumerate/,
    /explain|describe|what is|how does/,
    /enhance.*prompt|improve.*prompt|rewrite.*prompt/,
    /fix.*simple|quick.*fix|typo|rename/,
  ]
  if (fastPatterns.some(p => p.test(lower))) {
    return { tier: 'fast', reason: 'Classification/planning/explanation task' }
  }

  // Full game or complex system → PREMIUM
  const premiumPatterns = [
    /full game|complete game|entire game/,
    /inventory.*shop|shop.*inventory/,
    /combat.*system|system.*combat/,
    /multiplayer.*game|game.*multiplayer/,
  ]
  if (premiumPatterns.some(p => p.test(lower))) {
    return { tier: 'premium', reason: 'Complex multi-system generation' }
  }

  // Large estimated output → PRIMARY or PREMIUM
  if ((opts.estimatedOutputLines ?? 0) > 300) {
    return { tier: 'premium', reason: 'Large output expected' }
  }

  // Default: PRIMARY
  return { tier: 'primary', reason: 'Standard script generation' }
}

// ── Public: callAI — Gemini primary, Groq fallback ───────────────────────────

/**
 * Call the AI provider chain: Gemini → Groq.
 * Throws if both providers fail so callers can surface the error.
 *
 * @param systemPrompt  System/persona instructions
 * @param messages      Conversation messages (role: user | assistant)
 * @param opts          maxTokens, temperature, jsonMode
 */
export async function callAI(
  systemPrompt: string,
  messages: AIMessage[],
  opts: AICallOptions = {},
): Promise<string> {
  // Specialist selection: find the best domain expert for this request
  let enrichedPrompt = systemPrompt
  const userMessage = messages.filter(m => m.role === 'user').pop()?.content ?? ''

  if (opts.useRAG) {
    // Auto-select top specialists based on user message (up to 3)
    const specialists = await findSpecialists(userMessage)
    if (specialists.length > 0) {
      enrichedPrompt = applySpecialist(enrichedPrompt, specialists)
      // Merge all specialists' preferred RAG categories with any provided ones
      const specialistCategories = getSpecialistRAGCategories(specialists)
      opts = { ...opts, ragCategories: [...new Set([...(opts.ragCategories ?? []), ...specialistCategories])] }
      console.log(`[ai-provider] Specialists selected: ${specialists.map(s => s.name).join(', ')}`)
    }

    // RAG enrichment: retrieve relevant docs and inject into system prompt
    try {
      enrichedPrompt = await buildRAGSystemPrompt(enrichedPrompt, userMessage, opts.ragCategories)
    } catch (e) {
      console.error('[ai-provider] RAG enrichment failed, using base prompt:', (e as Error).message)
    }
  }

  // Try Gemini direct first (fastest, free tier)
  const geminiResult = await callGemini(enrichedPrompt, messages, opts)
  if (geminiResult) return geminiResult

  // Try OpenRouter (9+ models, cost-optimized routing)
  // Only active when ENABLE_PAID_MODELS=true AND OPENROUTER_API_KEY is set
  if (process.env.OPENROUTER_API_KEY && isPaidModelsEnabled()) {
    const complexity = estimateBuildComplexity(userMessage)
    const bestModel = selectBestModel('build', complexity, opts.codeMode ?? false, 'creator')
    console.log(`[ai-provider] OpenRouter fallback: ${bestModel} (complexity: ${complexity})`)
    const orResult = await callOpenRouter(bestModel, enrichedPrompt, userMessage, [], opts.maxTokens ?? 65536, opts.temperature ?? (opts.codeMode ? 0.2 : 0.7))
    if (orResult) return orResult
  }

  // Try Groq last (free, fast, but less capable)
  const groqResult = await callGroq(enrichedPrompt, messages, opts)
  if (groqResult) return groqResult

  throw new Error('[ai-provider] All AI providers failed. Check GEMINI_API_KEY, OPENROUTER_API_KEY, and GROQ_API_KEY env vars.')
}
