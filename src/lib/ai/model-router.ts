/**
 * Model Router — intelligently selects the best AI model based on
 * prompt complexity, user intent, and subscription tier.
 *
 * Routing logic:
 *   - Simple builds → gemini-flash (cheapest, fastest)
 *   - Script/UI mode → claude-sonnet (best code quality, lowest error rate)
 *   - Complex builds → gemini-flash with more tokens
 *   - Free tier → gemini-flash only (cost control)
 */

import 'server-only'

export type ModelProvider = 'gemini' | 'groq' | 'openrouter'
export type UserTier = 'free' | 'starter' | 'creator' | 'pro' | 'studio'
export type BuildComplexity = 'simple' | 'medium' | 'complex' | 'extreme'

export interface ModelSelection {
  provider: ModelProvider
  model: string
}

// ─── OpenRouter model IDs ───────────────────────────────────────────────

const OR_GEMINI_FLASH = 'google/gemini-2.5-flash-preview'
const OR_CLAUDE_SONNET = 'anthropic/claude-sonnet-4'
const OR_LLAMA = 'meta-llama/llama-3.3-70b-instruct'
const OR_GEMINI_PRO = 'google/gemini-2.5-pro-preview'

// ─── Public API ─────────────────────────────────────────────────────────

/**
 * Select the best model for the given request context.
 *
 * @param prompt   - The user's request text (used for complexity estimation)
 * @param intent   - Detected intent (e.g. 'build', 'script', 'conversation')
 * @param complexity - Pre-computed complexity, or auto-estimated from prompt
 * @param userTier - The user's subscription tier
 */
export function selectBestModel(
  prompt: string,
  intent: string,
  complexity: BuildComplexity | null,
  userTier: UserTier,
): ModelSelection {
  const effectiveComplexity = complexity ?? estimateComplexity(prompt)

  // Free tier: always use direct Gemini (no OpenRouter cost)
  if (userTier === 'free') {
    return { provider: 'gemini', model: 'gemini-2.5-flash' }
  }

  // Script/UI intents: Claude Sonnet has lowest error rate for code
  const isScript = ['script', 'ui', 'gui', 'localscript', 'modulescript'].includes(intent)
  if (isScript && effectiveComplexity !== 'simple') {
    return { provider: 'openrouter', model: OR_CLAUDE_SONNET }
  }

  // Extreme complexity: Gemini Pro (best Roblox benchmark score)
  if (effectiveComplexity === 'extreme') {
    return { provider: 'openrouter', model: OR_GEMINI_PRO }
  }

  // Complex builds: Gemini Flash with more tokens (cost-effective)
  if (effectiveComplexity === 'complex') {
    return { provider: 'openrouter', model: OR_GEMINI_FLASH }
  }

  // Medium builds: direct Gemini (free, fast)
  if (effectiveComplexity === 'medium') {
    return { provider: 'gemini', model: 'gemini-2.5-flash' }
  }

  // Simple / conversation: direct Gemini (free tier)
  return { provider: 'gemini', model: 'gemini-2.5-flash' }
}

/**
 * Check if a model ID is an OpenRouter model (contains a slash like "google/gemini-2.5-flash").
 */
export function isOpenRouterModel(modelId: string): boolean {
  return modelId.includes('/')
}

/**
 * Estimate build complexity from the user prompt.
 */
export function estimateComplexity(prompt: string): BuildComplexity {
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
