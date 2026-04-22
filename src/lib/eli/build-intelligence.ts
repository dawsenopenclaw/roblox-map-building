/**
 * ELI Build Intelligence Bridge
 *
 * Connects the AI build pipeline to ELI's memory system.
 * Every build outcome (success or failure) teaches ELI what works,
 * which prompts produce high scores, and what patterns to avoid.
 *
 * This runs fire-and-forget after each build — never blocks user response.
 */

import 'server-only'
import { addMemory, getMemories } from './memory'
import { detectCategory, type BuildType } from '../ai/experience-memory'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface BuildOutcomeForEli {
  prompt: string
  score: number
  model: string
  buildType: BuildType
  category: string | null
  partCount: number | null
  passed: boolean
  retryCount: number
  verificationErrors?: string[]
  auditMissing?: string[]
}

// ─── Score thresholds ───────────────────────────────────────────────────────

const HIGH_SCORE = 75
const LOW_SCORE = 50
const PATTERN_MIN_OCCURRENCES = 3

// In-memory counters for pattern detection (reset on cold start)
const categoryScores: Map<string, number[]> = new Map()
const failureReasons: Map<string, number> = new Map()

// ─── Main: Record build outcome to ELI memory ──────────────────────────────

export async function recordToEli(outcome: BuildOutcomeForEli): Promise<void> {
  try {
    const cat = outcome.category || detectCategory(outcome.prompt) || 'unknown'

    // Track scores per category for pattern detection
    if (!categoryScores.has(cat)) categoryScores.set(cat, [])
    categoryScores.get(cat)!.push(outcome.score)

    // Track failure reasons
    if (outcome.verificationErrors?.length) {
      for (const err of outcome.verificationErrors.slice(0, 3)) {
        const key = normalizeError(err)
        failureReasons.set(key, (failureReasons.get(key) || 0) + 1)
      }
    }

    // Save HIGH-SCORING builds as positive patterns
    if (outcome.score >= HIGH_SCORE && outcome.partCount && outcome.partCount >= 15) {
      addMemory(
        'pattern',
        `HIGH-SCORE BUILD (${outcome.score}/100): "${truncate(outcome.prompt, 80)}" — ${cat} category, ${outcome.partCount} parts, model=${outcome.model}. This prompt+model combo produces quality output.`,
        ['ai', 'builds', cat, 'high-score'],
        Math.min(95, 70 + Math.floor(outcome.score / 5)),
        'build-intelligence'
      )
    }

    // Save LOW-SCORING builds as anti-patterns
    if (outcome.score < LOW_SCORE) {
      const reasons = [
        ...(outcome.verificationErrors?.slice(0, 2) || []),
        ...(outcome.auditMissing?.slice(0, 2) || []),
      ].join('; ')

      addMemory(
        'bug-insight',
        `LOW-SCORE BUILD (${outcome.score}/100): "${truncate(outcome.prompt, 80)}" — ${cat} category, ${outcome.partCount ?? '?'} parts, model=${outcome.model}. Issues: ${reasons || 'general quality'}. Retry count: ${outcome.retryCount}.`,
        ['ai', 'builds', cat, 'low-score', 'quality'],
        60,
        'build-intelligence'
      )
    }

    // Detect recurring patterns (every N builds per category)
    const catScores = categoryScores.get(cat)!
    if (catScores.length >= PATTERN_MIN_OCCURRENCES && catScores.length % PATTERN_MIN_OCCURRENCES === 0) {
      const avg = catScores.reduce((a, b) => a + b, 0) / catScores.length
      const successRate = catScores.filter(s => s >= 65).length / catScores.length

      addMemory(
        'metric',
        `BUILD STATS for "${cat}": ${catScores.length} builds, avg score ${avg.toFixed(0)}/100, ${(successRate * 100).toFixed(0)}% success rate. ${avg < 60 ? 'NEEDS PROMPT TUNING.' : avg > 80 ? 'Working well.' : 'Room for improvement.'}`,
        ['ai', 'builds', cat, 'metrics'],
        75,
        'build-intelligence'
      )
    }

    // Detect recurring failure patterns
    for (const [reason, count] of Array.from(failureReasons.entries())) {
      if (count === PATTERN_MIN_OCCURRENCES) {
        addMemory(
          'pattern',
          `RECURRING FAILURE (${count}x): "${reason}" — this error keeps appearing in builds. Needs system prompt fix or model-specific handling.`,
          ['ai', 'builds', 'recurring-failure', 'quality'],
          85,
          'build-intelligence'
        )
      }
    }
  } catch (err) {
    // Never throw — this is fire-and-forget
    console.warn('[ELI-BuildIntel] Failed to record:', err instanceof Error ? err.message : err)
  }
}

// ─── Query: Get ELI's build intelligence for a prompt ──────────────────────

export function getBuildIntelligence(prompt: string): {
  tips: string[]
  confidence: 'high' | 'medium' | 'low'
  avgScore: number | null
} {
  const cat = detectCategory(prompt) || 'unknown'
  const tips: string[] = []

  // Get relevant memories
  const patterns = getMemories({ tags: [cat, 'builds'], minConfidence: 60, limit: 5 })
  const failures = getMemories({ tags: ['recurring-failure'], minConfidence: 70, limit: 3 })

  for (const p of patterns) {
    if (p.type === 'pattern' && p.content.includes('HIGH-SCORE')) {
      tips.push(`Previous ${cat} builds scored well — follow similar approach`)
      break
    }
  }

  for (const f of failures) {
    tips.push(`Watch out: ${f.content.split('"')[1] || 'recurring quality issue'}`)
  }

  // Category stats
  const catScores = categoryScores.get(cat)
  const avgScore = catScores?.length
    ? catScores.reduce((a, b) => a + b, 0) / catScores.length
    : null

  const confidence = avgScore === null
    ? 'medium'
    : avgScore >= 70 ? 'high' : avgScore >= 50 ? 'medium' : 'low'

  return { tips, confidence, avgScore }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) + '...' : s
}

function normalizeError(err: string): string {
  // Collapse specific values to generic pattern
  return err
    .replace(/["'][^"']+["']/g, '"X"')
    .replace(/\d+/g, 'N')
    .trim()
    .slice(0, 100)
}
