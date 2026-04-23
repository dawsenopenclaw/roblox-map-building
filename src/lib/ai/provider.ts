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
import { findSpecialist, applySpecialist, getSpecialistRAGCategories } from './specialists/router'
import { callOpenRouter, selectBestModel, estimateBuildComplexity } from './openrouter'
import { isPaidModelsEnabled } from '@/lib/spending-guard'

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
  const key = process.env.GEMINI_API_KEY
  if (!key) return null

  const { maxTokens = 8192, temperature = opts.codeMode ? 0.2 : 0.7, jsonMode = false } = opts

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

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(60_000),
        },
      )
      if (res.status === 429 && attempt < MAX_RETRIES) {
        const delay = RETRY_DELAYS[attempt] ?? 10000
        console.warn(`[ai-provider/gemini] 429 rate limited — retrying in ${delay / 1000}s (attempt ${attempt + 1}/${MAX_RETRIES})`)
        await sleep(delay)
        continue
      }
      if (!res.ok) {
        console.error('[ai-provider/gemini] HTTP', res.status, await res.text().catch(() => ''))
        return null
      }
      type GeminiRes = { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }
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
  const key = process.env.GROQ_API_KEY
  if (!key) return null

  const { maxTokens = 8192, temperature = opts.codeMode ? 0.2 : 0.7 } = opts

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
      if (res.status === 429 && attempt < MAX_RETRIES) {
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
    // Auto-select specialist based on user message
    const specialist = await findSpecialist(userMessage)
    if (specialist) {
      enrichedPrompt = applySpecialist(enrichedPrompt, specialist)
      // Merge specialist's preferred RAG categories with any provided ones
      const specialistCategories = getSpecialistRAGCategories(specialist)
      opts = { ...opts, ragCategories: [...new Set([...(opts.ragCategories ?? []), ...specialistCategories])] }
      console.log(`[ai-provider] Specialist selected: ${specialist.name}`)
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
    const orResult = await callOpenRouter(bestModel, enrichedPrompt, userMessage, [], opts.maxTokens ?? 8192, opts.temperature ?? (opts.codeMode ? 0.2 : 0.7))
    if (orResult) return orResult
  }

  // Try Groq last (free, fast, but less capable)
  const groqResult = await callGroq(enrichedPrompt, messages, opts)
  if (groqResult) return groqResult

  throw new Error('[ai-provider] All AI providers failed. Check GEMINI_API_KEY, OPENROUTER_API_KEY, and GROQ_API_KEY env vars.')
}
