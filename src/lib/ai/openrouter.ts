/**
 * OpenRouter Provider — access 15+ AI models through a single API.
 *
 * Lemonade.gg uses OpenRouter with 374B tokens consumed. Their primary
 * model is Gemini 3 Flash. We match and exceed their model roster.
 *
 * Cost optimization: cheap models for simple builds, premium for complex.
 * All models use the OpenAI-compatible API via api.openrouter.ai.
 */

import 'server-only'

// ─── Available Models ────────────────────────────────────────────────────

export interface OpenRouterModel {
  id: string
  name: string
  tier: 'free' | 'cheap' | 'mid' | 'premium'
  /** Best for these use cases */
  strengths: string[]
  /** Cost per 1M input tokens (approximate) */
  inputCostPer1M: number
  /** Cost per 1M output tokens (approximate) */
  outputCostPer1M: number
}

export const OPENROUTER_MODELS: OpenRouterModel[] = [
  // ── Free / Ultra-Cheap ──
  { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash', tier: 'free',
    strengths: ['fast', 'simple builds', 'conversation'], inputCostPer1M: 0, outputCostPer1M: 0 },
  { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', tier: 'free',
    strengths: ['fallback', 'general'], inputCostPer1M: 0, outputCostPer1M: 0 },

  // ── Cheap (< $1/M tokens) ──
  { id: 'google/gemini-2.5-flash-preview', name: 'Gemini 2.5 Flash', tier: 'cheap',
    strengths: ['builds', 'speed', 'Roblox benchmark 54.7%'], inputCostPer1M: 0.15, outputCostPer1M: 0.60 },
  { id: 'deepseek/deepseek-chat-v3-0324', name: 'DeepSeek V3', tier: 'cheap',
    strengths: ['code generation', 'reasoning'], inputCostPer1M: 0.14, outputCostPer1M: 0.28 },

  // ── Mid-range ($1-5/M tokens) ──
  { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4', tier: 'mid',
    strengths: ['balanced', 'scripting', 'planning'], inputCostPer1M: 3, outputCostPer1M: 15 },
  { id: 'openai/gpt-4o', name: 'GPT-4o', tier: 'mid',
    strengths: ['general', 'UI design', 'conversation'], inputCostPer1M: 2.5, outputCostPer1M: 10 },
  { id: 'google/gemini-2.5-pro-preview', name: 'Gemini 2.5 Pro', tier: 'mid',
    strengths: ['complex builds', 'Roblox benchmark 55.3%'], inputCostPer1M: 1.25, outputCostPer1M: 10 },

  // ── Premium ($5+/M tokens) ──
  { id: 'anthropic/claude-opus-4', name: 'Claude Opus 4', tier: 'premium',
    strengths: ['lowest error rate 1.4%', 'complex systems', 'architecture'], inputCostPer1M: 15, outputCostPer1M: 75 },
  { id: 'openai/gpt-4.1', name: 'GPT-4.1', tier: 'premium',
    strengths: ['long context', 'complex code'], inputCostPer1M: 2, outputCostPer1M: 8 },
]

// ─── Call OpenRouter ─────────────────────────────────────────────────────

export async function callOpenRouter(
  modelId: string,
  systemPrompt: string,
  userMessage: string,
  history: Array<{ role: string; content: string }> = [],
  maxTokens = 8192,
  temperature = 0.3,
): Promise<string | null> {
  const key = process.env.OPENROUTER_API_KEY
  if (!key) return null

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map(h => ({ role: h.role, content: h.content })),
    { role: 'user', content: userMessage },
  ]

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
        'HTTP-Referer': 'https://forjegames.com',
        'X-Title': 'ForjeGames AI Builder',
      },
      body: JSON.stringify({
        model: modelId,
        messages,
        max_tokens: maxTokens,
        temperature,
      }),
      signal: AbortSignal.timeout(90_000),
    })

    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      console.error(`[openrouter] ${modelId} HTTP ${res.status}: ${errText.slice(0, 200)}`)
      return null
    }

    const data = await res.json() as {
      choices?: Array<{ message?: { content?: string } }>
      usage?: { prompt_tokens?: number; completion_tokens?: number; total_cost?: number }
    }

    // Log cost for tracking
    if (data.usage) {
      console.log(`[openrouter] ${modelId}: ${data.usage.prompt_tokens}in/${data.usage.completion_tokens}out, cost: $${data.usage.total_cost?.toFixed(4) ?? '?'}`)
    }

    return data.choices?.[0]?.message?.content ?? null
  } catch (e) {
    console.error(`[openrouter] ${modelId} error:`, (e as Error).message)
    return null
  }
}

// ─── Smart Model Router ─────────────────────────────────────────────────

export type BuildComplexity = 'simple' | 'medium' | 'complex' | 'extreme'

export function selectBestModel(
  intent: string,
  complexity: BuildComplexity,
  isScript: boolean,
  userTier: 'free' | 'starter' | 'creator' | 'pro' | 'studio',
): string {
  // Free users: only free models
  if (userTier === 'free') {
    return 'google/gemini-2.0-flash-exp:free'
  }

  // Script mode: Claude has lowest error rate for code
  if (isScript && complexity !== 'simple') {
    return userTier === 'studio' || userTier === 'pro'
      ? 'anthropic/claude-opus-4'
      : 'anthropic/claude-sonnet-4'
  }

  // Complex builds: Gemini Pro (best Roblox benchmark)
  if (complexity === 'extreme' || complexity === 'complex') {
    return 'google/gemini-2.5-pro-preview'
  }

  // Medium builds: Gemini Flash (fast + good)
  if (complexity === 'medium') {
    return 'google/gemini-2.5-flash-preview'
  }

  // Simple / conversation: cheapest
  return 'google/gemini-2.0-flash-exp:free'
}

/** Estimate build complexity from the prompt */
export function estimateBuildComplexity(prompt: string): BuildComplexity {
  const lower = prompt.toLowerCase()
  const wordCount = prompt.split(/\s+/).length

  // Extreme: full games, complex multi-system requests
  if (/\b(full game|complete game|entire|tycoon.*with.*shop|simulator.*with.*pet|rpg.*with.*quest)\b/i.test(lower)) {
    return 'extreme'
  }

  // Complex: buildings with interiors, multi-part systems
  if (wordCount > 40 || /\b(interior|multiple|system|mechanic|with.*and.*and)\b/i.test(lower)) {
    return 'complex'
  }

  // Medium: standard builds, single systems
  if (wordCount > 15 || /\b(castle|house|ship|vehicle|terrain|shop|leaderboard)\b/i.test(lower)) {
    return 'medium'
  }

  return 'simple'
}
