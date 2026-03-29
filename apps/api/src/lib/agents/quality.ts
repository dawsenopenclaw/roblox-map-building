/**
 * Quality agent — checks performance budgets and visual quality.
 * check_performance: instance count, memory, render budget
 * check_visual: design consistency, style compliance
 * suggest_improvements: actionable recommendations
 */

import { claudeChat } from '../ai/providers/anthropic'
import { anthropicBreaker } from '../ai/circuit-breaker'
import type { AgentCommand, AgentResult, GameChange, GameContext } from './types'

// ---------------------------------------------------------------------------
// Performance thresholds (Roblox recommendations)
// ---------------------------------------------------------------------------

const PERF_THRESHOLDS = {
  instanceCount:  { warn: 15_000, critical: 20_000 },
  scriptCount:    { warn: 50,     critical: 100 },
  partCount:      { warn: 10_000, critical: 15_000 },
  textureMemMB:   { warn: 256,    critical: 512 },
}

export type PerformanceRating = 'excellent' | 'good' | 'warning' | 'critical'

export interface PerformanceReport {
  rating: PerformanceRating
  instanceCount: number
  estimatedRenderBudget: number
  warnings: string[]
  suggestions: string[]
  passedChecks: string[]
}

export interface VisualReport {
  rating: number // 1–10
  styleConsistent: boolean
  issues: string[]
  suggestions: string[]
}

// ---------------------------------------------------------------------------
// Performance check (no API key needed — uses thresholds)
// ---------------------------------------------------------------------------

export function checkPerformance(gameState: {
  instanceCount?: number
  scriptCount?: number
  textureMemMB?: number
  partCount?: number
}): PerformanceReport {
  const instanceCount = gameState.instanceCount ?? 0
  const scriptCount = gameState.scriptCount ?? 0
  const textureMemMB = gameState.textureMemMB ?? 0
  const partCount = gameState.partCount ?? instanceCount

  const warnings: string[] = []
  const suggestions: string[] = []
  const passedChecks: string[] = []

  // Instance count
  if (instanceCount >= PERF_THRESHOLDS.instanceCount.critical) {
    warnings.push(`Instance count (${instanceCount}) exceeds Roblox performance limit of 20,000`)
    suggestions.push('Use Unions, MeshParts, or LOD to reduce instance count')
  } else if (instanceCount >= PERF_THRESHOLDS.instanceCount.warn) {
    warnings.push(`Instance count (${instanceCount}) approaching limit — consider optimization`)
    suggestions.push('Group small decorative parts into unions')
  } else {
    passedChecks.push(`Instance count: ${instanceCount} (within budget)`)
  }

  // Script count
  if (scriptCount >= PERF_THRESHOLDS.scriptCount.critical) {
    warnings.push(`High script count (${scriptCount}) may impact performance`)
    suggestions.push('Consolidate scripts using ModuleScripts and a single manager')
  } else if (scriptCount > 0) {
    passedChecks.push(`Script count: ${scriptCount} (acceptable)`)
  }

  // Texture memory
  if (textureMemMB >= PERF_THRESHOLDS.textureMemMB.critical) {
    warnings.push(`Texture memory (${textureMemMB}MB) is very high — mobile devices may crash`)
    suggestions.push('Reduce texture resolution or use fewer unique textures')
  } else if (textureMemMB >= PERF_THRESHOLDS.textureMemMB.warn) {
    warnings.push(`Texture memory (${textureMemMB}MB) may cause issues on low-end devices`)
  }

  // Part count
  if (partCount >= PERF_THRESHOLDS.partCount.critical) {
    warnings.push(`Part count (${partCount}) is very high`)
    suggestions.push('Replace decorative parts with SurfaceAppearance textures')
  } else if (partCount > 0) {
    passedChecks.push(`Part count: ${partCount} (within budget)`)
  }

  // Overall rating
  let rating: PerformanceRating = 'excellent'
  if (instanceCount >= PERF_THRESHOLDS.instanceCount.critical || textureMemMB >= PERF_THRESHOLDS.textureMemMB.critical) {
    rating = 'critical'
  } else if (warnings.length >= 2) {
    rating = 'warning'
  } else if (warnings.length === 1) {
    rating = 'good'
  }

  const estimatedRenderBudget = Math.min(100, Math.round((instanceCount / PERF_THRESHOLDS.instanceCount.critical) * 100))

  return { rating, instanceCount, estimatedRenderBudget, warnings, suggestions, passedChecks }
}

// ---------------------------------------------------------------------------
// Visual quality check (uses Claude if available)
// ---------------------------------------------------------------------------

async function checkVisualWithClaude(
  sessionHistory: GameContext['sessionHistory'],
  gameDescription: string | undefined
): Promise<VisualReport> {
  const historyText = sessionHistory.slice(-10).map((e) => `- ${e.intent}: ${e.description}`).join('\n')

  const prompt = `Review this Roblox game build session for visual quality and design consistency.

Game: ${gameDescription ?? 'Unknown game'}
Recent build actions:
${historyText || 'No history'}

Evaluate:
1. Style consistency (are all elements cohesive?)
2. Color palette harmony
3. Scale appropriateness (do parts look right relative to each other?)
4. Common visual issues (floating objects, clipping, z-fighting)
5. Mobile readability

Return ONLY valid JSON:
{
  "rating": <1-10>,
  "styleConsistent": <bool>,
  "issues": [<string>],
  "suggestions": [<string>]
}`

  const result = await anthropicBreaker.execute(() =>
    claudeChat(
      [{ role: 'user', content: prompt }],
      { maxTokens: 800, temperature: 0 }
    )
  )

  try {
    const raw = result.content.replace(/```(?:json)?\s*/g, '').replace(/```/g, '').trim()
    return JSON.parse(raw) as VisualReport
  } catch {
    return {
      rating: 7,
      styleConsistent: true,
      issues: [],
      suggestions: ['Could not parse visual analysis — consider manual review'],
    }
  }
}

// ---------------------------------------------------------------------------
// Agent implementation
// ---------------------------------------------------------------------------

export async function runQualityAgent(command: AgentCommand): Promise<AgentResult> {
  const start = Date.now()
  const { parameters, context } = command

  const checkType = (parameters.checkType as string | undefined) ?? 'all'

  const perfReport = checkPerformance({
    instanceCount: context.instanceCount ?? 0,
  })

  let visualReport: VisualReport | null = null
  let tokensUsed = 0

  if ((checkType === 'visual' || checkType === 'all') && process.env.ANTHROPIC_API_KEY) {
    try {
      visualReport = await checkVisualWithClaude(context.sessionHistory, context.gameDescription)
    } catch {
      visualReport = {
        rating: 7,
        styleConsistent: true,
        issues: ['Visual check unavailable'],
        suggestions: [],
      }
    }
  }

  const allSuggestions = [
    ...perfReport.suggestions,
    ...(visualReport?.suggestions ?? []),
  ]

  const changes: GameChange[] = []
  if (perfReport.warnings.length > 0 || (visualReport?.issues?.length ?? 0) > 0) {
    changes.push({
      type: 'other',
      description: `Quality check: ${perfReport.rating} performance, ${visualReport ? `${visualReport.rating}/10 visual` : 'no visual check'}`,
      metadata: { perfReport, visualReport },
    })
  }

  const summaryParts: string[] = [
    `Performance: ${perfReport.rating} (${perfReport.instanceCount} instances, ${perfReport.estimatedRenderBudget}% render budget)`,
  ]
  if (visualReport) {
    summaryParts.push(`Visual: ${visualReport.rating}/10 — ${visualReport.styleConsistent ? 'consistent style' : 'style inconsistencies found'}`)
  }
  if (allSuggestions.length > 0) {
    summaryParts.push(`Top suggestion: ${allSuggestions[0]}`)
  }

  return {
    success: true,
    message: summaryParts.join('. '),
    tokensUsed,
    changes,
    duration: Date.now() - start,
    agent: 'quality',
    data: { perfReport, visualReport, suggestions: allSuggestions },
  }
}

/**
 * check_performance(gameState) — public API
 */
export async function runPerformanceCheck(
  gameState: Parameters<typeof checkPerformance>[0],
  context: AgentCommand['context']
): Promise<AgentResult> {
  return runQualityAgent({
    intent: 'check_quality',
    parameters: { checkType: 'performance', gameState },
    context: { ...context, instanceCount: gameState.instanceCount },
  })
}

/**
 * suggest_improvements() — public API
 */
export async function suggestImprovements(context: AgentCommand['context']): Promise<AgentResult> {
  return runQualityAgent({
    intent: 'check_quality',
    parameters: { checkType: 'all' },
    context,
  })
}
