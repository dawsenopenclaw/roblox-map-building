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
  // ── Free / Ultra-Cheap (conversation, simple builds) ──
  { id: 'google/gemini-2.5-flash-exp:free', name: 'Gemini 2.0 Flash', tier: 'free',
    strengths: ['fast', 'simple builds', 'conversation'], inputCostPer1M: 0, outputCostPer1M: 0 },
  { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B', tier: 'free',
    strengths: ['fallback', 'general', 'code'], inputCostPer1M: 0, outputCostPer1M: 0 },
  { id: 'qwen/qwen-2.5-72b-instruct:free', name: 'Qwen 2.5 72B', tier: 'free',
    strengths: ['code', 'multilingual', 'reasoning'], inputCostPer1M: 0, outputCostPer1M: 0 },
  { id: 'mistralai/mistral-small-3.1-24b-instruct:free', name: 'Mistral Small 3.1', tier: 'free',
    strengths: ['fast', 'code', 'instruction following'], inputCostPer1M: 0, outputCostPer1M: 0 },

  // ── Cheap (< $1/M tokens — primary build models) ──
  { id: 'google/gemini-2.5-flash-preview', name: 'Gemini 2.5 Flash', tier: 'cheap',
    strengths: ['builds', 'speed', 'best value', 'Roblox benchmark 54.7%'], inputCostPer1M: 0.15, outputCostPer1M: 0.60 },
  { id: 'deepseek/deepseek-chat-v3-0324', name: 'DeepSeek V3', tier: 'cheap',
    strengths: ['code generation', 'reasoning', 'large context'], inputCostPer1M: 0.14, outputCostPer1M: 0.28 },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', tier: 'cheap',
    strengths: ['fast', 'reliable', 'good at instructions'], inputCostPer1M: 0.15, outputCostPer1M: 0.60 },
  { id: 'meta-llama/llama-4-maverick', name: 'Llama 4 Maverick', tier: 'cheap',
    strengths: ['newest Llama', 'code', 'creative'], inputCostPer1M: 0.20, outputCostPer1M: 0.60 },

  // ── Mid-range ($1-5/M tokens — quality builds + scripts) ──
  { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4', tier: 'mid',
    strengths: ['balanced', 'scripting', 'planning', 'lowest error rate for code'], inputCostPer1M: 3, outputCostPer1M: 15 },
  { id: 'openai/gpt-4o', name: 'GPT-4o', tier: 'mid',
    strengths: ['general', 'UI design', 'reliable'], inputCostPer1M: 2.5, outputCostPer1M: 10 },
  { id: 'google/gemini-2.5-pro-preview', name: 'Gemini 2.5 Pro', tier: 'mid',
    strengths: ['complex builds', 'best Roblox benchmark 55.3%', 'long output'], inputCostPer1M: 1.25, outputCostPer1M: 10 },
  { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1', tier: 'mid',
    strengths: ['reasoning', 'complex logic', 'game systems'], inputCostPer1M: 0.55, outputCostPer1M: 2.19 },

  // ── Premium ($5+/M tokens — complex game systems) ──
  { id: 'anthropic/claude-opus-4', name: 'Claude Opus 4', tier: 'premium',
    strengths: ['lowest error rate 1.4%', 'complex systems', 'architecture'], inputCostPer1M: 15, outputCostPer1M: 75 },
  { id: 'openai/gpt-4.1', name: 'GPT-4.1', tier: 'premium',
    strengths: ['long context', 'complex code', '1M tokens'], inputCostPer1M: 2, outputCostPer1M: 8 },
  { id: 'anthropic/claude-sonnet-4:thinking', name: 'Claude Sonnet 4 (Thinking)', tier: 'premium',
    strengths: ['extended thinking', 'complex reasoning', 'architecture'], inputCostPer1M: 3, outputCostPer1M: 15 },
]

/** Get all model names for display */
export function getModelNames(): string[] {
  return OPENROUTER_MODELS.map(m => m.name)
}

/** Get models available for a user tier */
export function getModelsForTier(userTier: string): OpenRouterModel[] {
  if (userTier === 'free') return OPENROUTER_MODELS.filter(m => m.tier === 'free')
  if (userTier === 'starter') return OPENROUTER_MODELS.filter(m => m.tier !== 'premium')
  return OPENROUTER_MODELS // paid users get all models
}

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

/**
 * Select the best model AND fallback chain for a given request.
 * Returns an array: first model to try, then fallbacks in order.
 * If the first model fails (rate limit, error), the caller tries the next.
 */
export function selectModelChain(
  intent: string,
  complexity: BuildComplexity,
  isScript: boolean,
  userTier: 'free' | 'starter' | 'creator' | 'pro' | 'studio',
): string[] {
  // Free users: 4 free models in rotation
  if (userTier === 'free') {
    return [
      'google/gemini-2.5-flash-exp:free',
      'meta-llama/llama-3.3-70b-instruct:free',
      'qwen/qwen-2.5-72b-instruct:free',
      'mistralai/mistral-small-3.1-24b-instruct:free',
    ]
  }

  // Script mode: Claude for accuracy, DeepSeek for reasoning, Gemini for speed
  if (isScript && complexity !== 'simple') {
    if (userTier === 'studio' || userTier === 'pro') {
      return [
        'anthropic/claude-sonnet-4',       // best code accuracy
        'deepseek/deepseek-r1',            // great reasoning
        'google/gemini-2.5-pro-preview',   // good + fast
        'openai/gpt-4o',                   // reliable fallback
        'deepseek/deepseek-chat-v3-0324',  // cheap last resort
      ]
    }
    return [
      'deepseek/deepseek-chat-v3-0324',   // cheap + good at code
      'google/gemini-2.5-flash-preview',   // fast + decent
      'openai/gpt-4o-mini',               // reliable
      'meta-llama/llama-4-maverick',       // newest
    ]
  }

  // Complex builds: Gemini Pro (best Roblox benchmark), Claude for accuracy
  if (complexity === 'extreme' || complexity === 'complex') {
    return [
      'google/gemini-2.5-pro-preview',     // #1 on Roblox benchmark
      'anthropic/claude-sonnet-4',          // lowest error rate
      'openai/gpt-4o',                      // reliable
      'deepseek/deepseek-chat-v3-0324',     // cheap fallback
      'google/gemini-2.5-flash-preview',    // fast fallback
    ]
  }

  // Medium builds: fast + good quality
  if (complexity === 'medium') {
    return [
      'google/gemini-2.5-flash-preview',   // best value for builds
      'deepseek/deepseek-chat-v3-0324',    // cheap + capable
      'openai/gpt-4o-mini',                // reliable
      'meta-llama/llama-4-maverick',       // newest Llama
    ]
  }

  // Simple / conversation: cheapest first
  return [
    'google/gemini-2.5-flash-exp:free',
    'openai/gpt-4o-mini',
    'meta-llama/llama-3.3-70b-instruct:free',
    'qwen/qwen-2.5-72b-instruct:free',
  ]
}

/** Legacy single-model selector (wraps selectModelChain) */
export function selectBestModel(
  intent: string,
  complexity: BuildComplexity,
  isScript: boolean,
  userTier: 'free' | 'starter' | 'creator' | 'pro' | 'studio',
): string {
  return selectModelChain(intent, complexity, isScript, userTier)[0]
}

/**
 * Race multiple OpenRouter models — first to return valid content wins.
 * Tries models in the chain order, launching them in parallel batches.
 */
export async function raceOpenRouterModels(
  modelChain: string[],
  systemPrompt: string,
  userMessage: string,
  history: Array<{ role: string; content: string }> = [],
  maxTokens = 16384,
): Promise<{ result: string; model: string } | null> {
  if (!process.env.OPENROUTER_API_KEY) return null

  // Launch first 3 models in parallel (balance speed vs cost)
  const batch = modelChain.slice(0, 3)
  const promises = batch.map(async (modelId) => {
    const result = await callOpenRouter(modelId, systemPrompt, userMessage, history, maxTokens)
    if (result && result.length > 50) return { result, model: modelId }
    return null
  })

  // Return first non-null result
  const results = await Promise.all(promises)
  const winner = results.find(r => r !== null)
  if (winner) return winner

  // If first batch all failed, try remaining models sequentially
  for (const modelId of modelChain.slice(3)) {
    const result = await callOpenRouter(modelId, systemPrompt, userMessage, history, maxTokens)
    if (result && result.length > 50) return { result, model: modelId }
  }

  return null
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
