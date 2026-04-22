/**
 * quality-scorer.ts
 *
 * LLM-based quality scoring for any AI-generated output in ForjeGames.
 *
 * Complements the heuristic `response-quality.ts` scorer by asking a cheap
 * LLM (Gemini Flash as the "Haiku-tier" cheap model in our stack) to act as
 * a rubric judge and return a structured score (0-100) across five axes:
 *
 *   1. relevance           — does the output address the prompt?
 *   2. completeness        — is anything obviously missing?
 *   3. themeCoherence      — does the output respect the active theme?
 *   4. technicalCorrectness — for code, does it look correct? for assets,
 *                             does it describe something that could exist?
 *   5. polish              — craft, specificity, world-class feel
 *
 * The scorer is designed to be cheap (<1¢ per call) and fast (<2s). It uses
 * `callAI` with `jsonMode: true` so the cheap provider returns strict JSON.
 * If the provider fails or returns malformed JSON, the scorer degrades to
 * the existing heuristic scorer so callers always get *some* signal.
 *
 * Used by `retry-strategy.ts` to decide whether to retry an AI call with a
 * different model / prompt / template.
 */

import 'server-only'
import { callAI } from './provider'
import { scoreResponse } from './response-quality'
import type { Intent } from './intent-classifier'

// ───────────────────────────────────────────────────────────────────────────
// Public types
// ───────────────────────────────────────────────────────────────────────────

export type QualityMode =
  | 'build'
  | 'script'
  | 'ui'
  | 'mesh'
  | 'image'
  | 'audio'
  | 'chat'
  | 'plan'

export interface QualityRubricAxes {
  relevance: number           // 0-100
  completeness: number        // 0-100
  themeCoherence: number      // 0-100
  technicalCorrectness: number // 0-100
  polish: number              // 0-100
}

export interface QualityScore {
  /** Overall 0-100 score, weighted average of the rubric axes. */
  total: number
  /** The individual rubric axes the LLM returned. */
  axes: QualityRubricAxes
  /** Short reasoning (one paragraph max) written by the judge. */
  reasoning: string
  /** Specific improvement suggestions (0-5 items). */
  suggestions: string[]
  /** If `total < 60`, caller should retry with a better model. */
  shouldRetry: boolean
  /** Where the score came from. */
  source: 'llm' | 'heuristic-fallback'
  /** Wall-clock time the scorer took, ms. */
  latencyMs: number
}

export interface ScoreOutputInput {
  prompt: string
  response: string
  mode: QualityMode
  /** Optional theme id from theme-detector (e.g. `medieval-fantasy`). */
  theme?: string
  /** Optional intent id so we can fall back to the heuristic scorer. */
  intent?: Intent
}

// ───────────────────────────────────────────────────────────────────────────
// Rubric weights — tuned so `technicalCorrectness` dominates for code modes
// and `polish` dominates for chat / plan modes.
// ───────────────────────────────────────────────────────────────────────────

const RUBRIC_WEIGHTS: Record<QualityMode, QualityRubricAxes> = {
  build:  { relevance: 0.20, completeness: 0.25, themeCoherence: 0.20, technicalCorrectness: 0.25, polish: 0.10 },
  script: { relevance: 0.20, completeness: 0.20, themeCoherence: 0.05, technicalCorrectness: 0.45, polish: 0.10 },
  ui:     { relevance: 0.20, completeness: 0.20, themeCoherence: 0.20, technicalCorrectness: 0.25, polish: 0.15 },
  mesh:   { relevance: 0.25, completeness: 0.15, themeCoherence: 0.30, technicalCorrectness: 0.15, polish: 0.15 },
  image:  { relevance: 0.25, completeness: 0.10, themeCoherence: 0.35, technicalCorrectness: 0.10, polish: 0.20 },
  audio:  { relevance: 0.25, completeness: 0.15, themeCoherence: 0.35, technicalCorrectness: 0.10, polish: 0.15 },
  chat:   { relevance: 0.35, completeness: 0.20, themeCoherence: 0.05, technicalCorrectness: 0.20, polish: 0.20 },
  plan:   { relevance: 0.25, completeness: 0.30, themeCoherence: 0.10, technicalCorrectness: 0.20, polish: 0.15 },
}

// ───────────────────────────────────────────────────────────────────────────
// Judge prompt
// ───────────────────────────────────────────────────────────────────────────

function buildRubricPrompt(input: ScoreOutputInput): string {
  const themeLine = input.theme
    ? `The active ForjeGames theme is "${input.theme}". Output that ignores this theme must score low on themeCoherence.`
    : `No specific theme is active. Score themeCoherence at 75 unless the output is wildly off-genre.`

  return [
    `You are a world-class Roblox developer grading an AI assistant's output.`,
    `Your job: return a strict JSON object scoring the output 0-100 on each rubric axis.`,
    ``,
    `Mode: ${input.mode}`,
    themeLine,
    ``,
    `Rubric axes (all integers 0-100):`,
    `  - relevance: how directly does the response address the prompt?`,
    `  - completeness: is anything obviously missing that a master builder would include?`,
    `  - themeCoherence: does the response fit the active theme / genre?`,
    `  - technicalCorrectness: for code, does it run? for assets, is it plausible? no hallucinated APIs.`,
    `  - polish: craft, specificity, numbers, studs, clear structure. World-class vs generic.`,
    ``,
    `Return ONLY a JSON object with this exact shape, no markdown fences, no prose:`,
    `{`,
    `  "relevance": number,`,
    `  "completeness": number,`,
    `  "themeCoherence": number,`,
    `  "technicalCorrectness": number,`,
    `  "polish": number,`,
    `  "reasoning": "one short paragraph (max 60 words)",`,
    `  "suggestions": ["concrete fix 1", "concrete fix 2"]`,
    `}`,
  ].join('\n')
}

function buildJudgeUserMessage(input: ScoreOutputInput): string {
  // Truncate very long responses so we stay in the cheap model's context.
  const truncated = input.response.length > 8000
    ? input.response.slice(0, 8000) + `\n… [truncated ${input.response.length - 8000} chars]`
    : input.response

  return [
    `=== USER PROMPT ===`,
    input.prompt,
    ``,
    `=== AI RESPONSE ===`,
    truncated,
  ].join('\n')
}

// ───────────────────────────────────────────────────────────────────────────
// JSON parsing helpers — cheap providers sometimes wrap JSON in fences or
// add trailing prose, so we sanitise before JSON.parse.
// ───────────────────────────────────────────────────────────────────────────

function stripFences(raw: string): string {
  let s = raw.trim()
  if (s.startsWith('```')) {
    s = s.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '')
  }
  // Find the first { and last } to snap to a JSON object.
  const first = s.indexOf('{')
  const last = s.lastIndexOf('}')
  if (first >= 0 && last > first) {
    s = s.slice(first, last + 1)
  }
  return s.trim()
}

interface RawJudgeResponse {
  relevance?: unknown
  completeness?: unknown
  themeCoherence?: unknown
  technicalCorrectness?: unknown
  polish?: unknown
  reasoning?: unknown
  suggestions?: unknown
}

function clamp(n: number, lo: number, hi: number): number {
  if (!Number.isFinite(n)) return lo
  return Math.max(lo, Math.min(hi, Math.round(n)))
}

function toAxis(v: unknown): number {
  if (typeof v === 'number') return clamp(v, 0, 100)
  if (typeof v === 'string') {
    const n = Number.parseFloat(v)
    return Number.isFinite(n) ? clamp(n, 0, 100) : 50
  }
  return 50
}

function toSuggestions(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v
    .map((x) => (typeof x === 'string' ? x.trim() : ''))
    .filter((x) => x.length > 0)
    .slice(0, 5)
}

function parseJudgeResponse(raw: string): RawJudgeResponse | null {
  try {
    const cleaned = stripFences(raw)
    const parsed = JSON.parse(cleaned) as unknown
    if (parsed && typeof parsed === 'object') {
      return parsed as RawJudgeResponse
    }
    return null
  } catch {
    return null
  }
}

function weightedTotal(axes: QualityRubricAxes, mode: QualityMode): number {
  const w = RUBRIC_WEIGHTS[mode]
  const raw =
    axes.relevance * w.relevance +
    axes.completeness * w.completeness +
    axes.themeCoherence * w.themeCoherence +
    axes.technicalCorrectness * w.technicalCorrectness +
    axes.polish * w.polish
  return Math.round(raw)
}

// ───────────────────────────────────────────────────────────────────────────
// Heuristic fallback — reuse the existing scorer, rescale to 0-100.
// ───────────────────────────────────────────────────────────────────────────

function heuristicFallback(input: ScoreOutputInput, latencyMs: number): QualityScore {
  const intent: Intent = input.intent ?? 'building'
  const h = scoreResponse(intent, input.response)
  const axes: QualityRubricAxes = {
    relevance: Math.round(h.relevance * 100),
    completeness: Math.round(h.actionability * 100),
    themeCoherence: input.theme ? 60 : 75,
    technicalCorrectness: Math.round(h.specificity * 100),
    polish: Math.round(h.lengthScore * 100),
  }
  const total = weightedTotal(axes, input.mode)
  return {
    total,
    axes,
    reasoning: `Heuristic fallback: flags=${h.flags.join(',') || 'none'}.`,
    suggestions: h.flags.includes('low_specificity')
      ? ['Add concrete numbers (studs, counts, rates).']
      : [],
    shouldRetry: total < 65,
    source: 'heuristic-fallback',
    latencyMs,
  }
}

// ───────────────────────────────────────────────────────────────────────────
// Public API
// ───────────────────────────────────────────────────────────────────────────

/**
 * Score an AI output using a cheap LLM as a rubric judge.
 *
 * Always returns a score — never throws. On provider failure or malformed
 * JSON, falls back to the in-process heuristic scorer so callers can still
 * make retry decisions.
 */
export async function scoreOutput(input: ScoreOutputInput): Promise<QualityScore> {
  const start = Date.now()

  // Trivial case: empty response is always the lowest possible score.
  if (!input.response || input.response.trim().length === 0) {
    return {
      total: 0,
      axes: { relevance: 0, completeness: 0, themeCoherence: 0, technicalCorrectness: 0, polish: 0 },
      reasoning: 'Empty response.',
      suggestions: ['Retry with a different model or a more concrete prompt.'],
      shouldRetry: true,
      source: 'heuristic-fallback',
      latencyMs: Date.now() - start,
    }
  }

  let raw: string
  try {
    raw = await callAI(
      buildRubricPrompt(input),
      [{ role: 'user', content: buildJudgeUserMessage(input) }],
      {
        jsonMode: true,
        maxTokens: 512,
        temperature: 0.2,
      },
    )
  } catch (e) {
    console.error('[quality-scorer] provider error, using heuristic:', (e as Error).message)
    return heuristicFallback(input, Date.now() - start)
  }

  const parsed = parseJudgeResponse(raw)
  if (!parsed) {
    console.error('[quality-scorer] malformed judge JSON, using heuristic')
    return heuristicFallback(input, Date.now() - start)
  }

  const axes: QualityRubricAxes = {
    relevance: toAxis(parsed.relevance),
    completeness: toAxis(parsed.completeness),
    themeCoherence: toAxis(parsed.themeCoherence),
    technicalCorrectness: toAxis(parsed.technicalCorrectness),
    polish: toAxis(parsed.polish),
  }
  const total = weightedTotal(axes, input.mode)
  const reasoning =
    typeof parsed.reasoning === 'string' && parsed.reasoning.trim().length > 0
      ? parsed.reasoning.trim().slice(0, 400)
      : 'No reasoning provided.'
  const suggestions = toSuggestions(parsed.suggestions)

  return {
    total,
    axes,
    reasoning,
    suggestions,
    shouldRetry: total < 65,
    source: 'llm',
    latencyMs: Date.now() - start,
  }
}

/**
 * Cheap synchronous pre-check: returns true if the output is so obviously
 * bad that we should retry without even calling the LLM judge.
 */
export function isObviouslyBroken(response: string): boolean {
  if (!response || response.trim().length === 0) return true
  if (response.trim().length < 20) return true
  // Common provider error strings.
  if (/^(error|sorry|i cannot|i can't|as an ai)/i.test(response.trim())) return true
  return false
}

/**
 * Exposed for tests — compute the weighted total from arbitrary axes.
 */
export function _weightedTotalForTest(axes: QualityRubricAxes, mode: QualityMode): number {
  return weightedTotal(axes, mode)
}
