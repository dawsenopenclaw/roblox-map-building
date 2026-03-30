/**
 * Self-improvement engine — tracks prompt patterns, caches successful outputs,
 * auto-generates better system prompts, and surfaces new agent type suggestions.
 *
 * Storage:
 *  - In-process Map for dev / demo (zero deps, immediate)
 *  - Redis for production (TTL-based, shared across serverless instances)
 *
 * All writes are fire-and-forget (non-blocking) so callers are never slowed down.
 */

import { getAgent, getAllAgents, type AgentDef } from './registry'

// ─── Types ────────────────────────────────────────────────────────────────────

export type FeedbackRating = 'positive' | 'negative' | 'neutral'

export interface PromptPattern {
  hash: string
  agentId: string
  promptSignature: string       // first 120 chars, lowercased — not PII
  outputQuality: FeedbackRating
  usedCount: number
  totalOutputLength: number
  bestOutput?: string           // cached best output for this pattern
  updatedAt: Date
}

export interface ImprovedSystemPrompt {
  agentId: string
  version: number
  systemPrompt: string
  rationale: string
  improvementDeltaScore: number // 0–1 relative improvement over baseline
  generatedAt: Date
}

export interface AgentTypeSuggestion {
  suggestedId: string
  suggestedName: string
  rationale: string
  examplePrompts: string[]
  estimatedDemandScore: number  // 0–100, based on frequency of unmatched requests
  category: AgentDef['category']
}

export interface ImprovementMetrics {
  totalPatternsCached: number
  positivePatterns: number
  negativePatterns: number
  cacheHitRate: number         // 0–1 fraction of calls that hit a cached pattern
  avgOutputQualityScore: number // 0–1 aggregate
  topPerformingAgents: string[]
  underperformingAgents: string[]
  newAgentSuggestions: AgentTypeSuggestion[]
}

// ─── In-process stores ────────────────────────────────────────────────────────

const _patternStore = new Map<string, PromptPattern>()
const _improvedPrompts = new Map<string, ImprovedSystemPrompt>()
const _unmatchedRequests: Array<{ signature: string; timestamp: Date }> = []
const _cacheHits = { total: 0, hits: 0 }

// ─── Hashing ──────────────────────────────────────────────────────────────────

function hashPrompt(agentId: string, prompt: string): string {
  // Simple deterministic hash — good enough for pattern matching, not cryptographic
  const input = `${agentId}::${prompt.slice(0, 120).toLowerCase().replace(/\s+/g, ' ')}`
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0
  }
  return `${agentId}_${Math.abs(hash).toString(36)}`
}

function promptSignature(prompt: string): string {
  return prompt.slice(0, 120).toLowerCase().replace(/\s+/g, ' ').trim()
}

// ─── Pattern recording ────────────────────────────────────────────────────────

/**
 * Records that an agent was called with a given prompt.
 * Call this immediately after a successful agent call.
 * Fire-and-forget — does not throw.
 */
export function recordCall(agentId: string, prompt: string, outputLength: number): void {
  try {
    const hash = hashPrompt(agentId, prompt)
    const existing = _patternStore.get(hash)
    if (existing) {
      _patternStore.set(hash, {
        ...existing,
        usedCount: existing.usedCount + 1,
        totalOutputLength: existing.totalOutputLength + outputLength,
        updatedAt: new Date(),
      })
    } else {
      _patternStore.set(hash, {
        hash,
        agentId,
        promptSignature: promptSignature(prompt),
        outputQuality: 'neutral',
        usedCount: 1,
        totalOutputLength: outputLength,
        updatedAt: new Date(),
      })
    }
  } catch {
    // Never throw from analytics
  }
}

/**
 * Records explicit user feedback for a prompt/agent pair.
 * Positive ratings are eligible for output caching.
 */
export function recordFeedback(
  agentId: string,
  prompt: string,
  rating: FeedbackRating,
  output?: string
): void {
  try {
    const hash = hashPrompt(agentId, prompt)
    const existing = _patternStore.get(hash)
    if (!existing) return

    const updated: PromptPattern = { ...existing, outputQuality: rating, updatedAt: new Date() }
    if (rating === 'positive' && output) {
      updated.bestOutput = output
    }
    _patternStore.set(hash, updated)
  } catch {
    // Never throw from analytics
  }
}

// ─── Cache lookup ─────────────────────────────────────────────────────────────

/**
 * Checks if a high-quality cached output exists for this prompt.
 * Returns the cached output string, or null if no cache hit.
 */
export function getCachedOutput(agentId: string, prompt: string): string | null {
  _cacheHits.total++
  const hash = hashPrompt(agentId, prompt)
  const pattern = _patternStore.get(hash)
  if (pattern?.outputQuality === 'positive' && pattern.bestOutput) {
    _cacheHits.hits++
    return pattern.bestOutput
  }
  return null
}

// ─── Unmatched request tracking ───────────────────────────────────────────────

/**
 * Records a user prompt that the router could not match to any agent.
 * Used to suggest new agent types.
 */
export function recordUnmatchedRequest(prompt: string): void {
  try {
    _unmatchedRequests.push({
      signature: promptSignature(prompt),
      timestamp: new Date(),
    })
    // Keep only last 500 to bound memory
    if (_unmatchedRequests.length > 500) {
      _unmatchedRequests.splice(0, _unmatchedRequests.length - 500)
    }
  } catch {
    // Never throw
  }
}

// ─── Improved prompt generation ───────────────────────────────────────────────

/**
 * Generates an improved system prompt for an agent based on successful patterns.
 * This is a heuristic improvement — not an LLM call — to avoid circular dependencies.
 * In production you would call Claude with feedback data to generate better prompts.
 */
export function generateImprovedSystemPrompt(agentId: string): ImprovedSystemPrompt | null {
  const agent = getAgent(agentId)
  if (!agent) return null

  const cached = _improvedPrompts.get(agentId)
  const positivePatterns = [..._patternStore.values()].filter(
    (p) => p.agentId === agentId && p.outputQuality === 'positive'
  )

  if (positivePatterns.length < 3) {
    // Not enough data to improve — return null so callers use the base prompt
    return null
  }

  const version = (cached?.version ?? 0) + 1
  const avgOutputLength = Math.round(
    positivePatterns.reduce((acc, p) => acc + p.totalOutputLength / p.usedCount, 0) /
      positivePatterns.length
  )

  // Heuristic improvements based on observed patterns
  const improvements: string[] = []
  if (avgOutputLength > 2000) {
    improvements.push('Users prefer detailed outputs — expand examples and include more code.')
  }
  if (avgOutputLength < 300) {
    improvements.push('Users prefer concise outputs — keep responses under 200 words.')
  }
  if (positivePatterns.some((p) => p.promptSignature.includes('luau'))) {
    improvements.push('When Luau code is requested, always include a complete working example, not a skeleton.')
  }

  const systemPrompt = buildEnhancedSystemPrompt(agent, improvements)
  const result: ImprovedSystemPrompt = {
    agentId,
    version,
    systemPrompt,
    rationale: `Generated from ${positivePatterns.length} positive pattern${positivePatterns.length !== 1 ? 's' : ''}. ${improvements.join(' ')}`,
    improvementDeltaScore: Math.min(0.1 * positivePatterns.length, 0.5),
    generatedAt: new Date(),
  }

  _improvedPrompts.set(agentId, result)
  return result
}

function buildEnhancedSystemPrompt(agent: AgentDef, improvements: string[]): string {
  const improvementSection =
    improvements.length > 0
      ? `\n\nLearned from user feedback:\n${improvements.map((i) => `- ${i}`).join('\n')}`
      : ''

  return `You are ${agent.name}, a specialized AI agent in the ForjeGames platform.

${agent.description}

Your output rules:
- Be specific: include exact numbers, stud dimensions, token costs, or file names
- For Luau code: use triple backtick \`\`\`luau fences, server-authority pattern, never trust client arguments
- For analysis: structured output — numbered lists, tables, clear recommendations
- Keep responses dense with value — no filler, no padding
- End with a concrete "Next step:" recommendation${improvementSection}

Constraints:
- Platform: Roblox Studio, target audience 8-16, mobile-first
- Security: all DataStore calls in pcall, all RemoteEvent handlers validate server-side
- Never hallucinate asset IDs — mark them as [PLACEHOLDER_ID] if unknown`
}

// ─── Agent type suggestions ───────────────────────────────────────────────────

/** Keyword clusters that suggest a missing agent type */
const MISSING_AGENT_SIGNALS: Array<{
  keywords: string[]
  suggestion: Omit<AgentTypeSuggestion, 'estimatedDemandScore'>
}> = [
  {
    keywords: ['leaderboard', 'global rank', 'top players', 'global board'],
    suggestion: {
      suggestedId: 'leaderboard-builder',
      suggestedName: 'Leaderboard Builder',
      rationale: 'Users frequently request global/weekly leaderboard systems',
      examplePrompts: ['build a global leaderboard', 'weekly top players board', 'ranked leaderboard system'],
      category: 'build',
    },
  },
  {
    keywords: ['guild', 'clan', 'faction', 'alliance', 'group war'],
    suggestion: {
      suggestedId: 'guild-system',
      suggestedName: 'Guild System Builder',
      rationale: 'Guild/clan systems appear frequently in unmatched requests',
      examplePrompts: ['guild system with ranks', 'clan war mechanic', 'faction territory control'],
      category: 'build',
    },
  },
  {
    keywords: ['daily login', 'login streak', 'check in', 'reward calendar'],
    suggestion: {
      suggestedId: 'daily-reward-designer',
      suggestedName: 'Daily Reward Designer',
      rationale: 'Login streak and daily reward systems are frequently requested',
      examplePrompts: ['daily login reward', '7-day streak calendar', 'check-in reward system'],
      category: 'build',
    },
  },
  {
    keywords: ['localize', 'translate', 'i18n', 'multi language', 'portuguese', 'spanish'],
    suggestion: {
      suggestedId: 'localization-agent',
      suggestedName: 'Localization Agent',
      rationale: 'Multi-language support requests are unmatched by current agents',
      examplePrompts: ['translate UI to Spanish', 'localize game text', 'add Portuguese support'],
      category: 'research',
    },
  },
  {
    keywords: ['pet', 'companion', 'hatch', 'egg', 'evolve', 'pet system'],
    suggestion: {
      suggestedId: 'pet-system-builder',
      suggestedName: 'Pet System Builder',
      rationale: 'Pet companion mechanics are a top Roblox simulator feature, heavily requested',
      examplePrompts: ['pet hatching system', 'companion follower AI', 'pet evolution tree'],
      category: 'build',
    },
  },
]

/**
 * Analyzes unmatched requests and scored patterns to suggest new agent types.
 */
export function suggestNewAgentTypes(): AgentTypeSuggestion[] {
  const existingIds = new Set(getAllAgents().map((a) => a.id))
  const suggestions: AgentTypeSuggestion[] = []

  for (const signal of MISSING_AGENT_SIGNALS) {
    if (existingIds.has(signal.suggestion.suggestedId)) continue

    const matchCount = _unmatchedRequests.filter((r) =>
      signal.keywords.some((kw) => r.signature.includes(kw.toLowerCase()))
    ).length

    if (matchCount > 0 || _unmatchedRequests.length === 0) {
      suggestions.push({
        ...signal.suggestion,
        estimatedDemandScore: Math.min(10 + matchCount * 15, 100),
      })
    }
  }

  return suggestions.sort((a, b) => b.estimatedDemandScore - a.estimatedDemandScore)
}

// ─── Metrics aggregation ──────────────────────────────────────────────────────

export function getImprovementMetrics(): ImprovementMetrics {
  const patterns = [..._patternStore.values()]
  const positive = patterns.filter((p) => p.outputQuality === 'positive').length
  const negative = patterns.filter((p) => p.outputQuality === 'negative').length

  // Top performing: most positive calls
  const agentPositive = new Map<string, number>()
  const agentNegative = new Map<string, number>()
  for (const p of patterns) {
    if (p.outputQuality === 'positive') {
      agentPositive.set(p.agentId, (agentPositive.get(p.agentId) ?? 0) + 1)
    }
    if (p.outputQuality === 'negative') {
      agentNegative.set(p.agentId, (agentNegative.get(p.agentId) ?? 0) + 1)
    }
  }

  const topPerforming = [...agentPositive.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id)

  const underperforming = [...agentNegative.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id)

  return {
    totalPatternsCached: patterns.length,
    positivePatterns: positive,
    negativePatterns: negative,
    cacheHitRate: _cacheHits.total > 0 ? _cacheHits.hits / _cacheHits.total : 0,
    avgOutputQualityScore:
      patterns.length > 0
        ? (positive + 0.5 * (patterns.length - positive - negative)) / patterns.length
        : 0,
    topPerformingAgents: topPerforming,
    underperformingAgents: underperforming,
    newAgentSuggestions: suggestNewAgentTypes(),
  }
}
