/**
 * response-quality.ts
 * Score AI responses and track quality trends over time.
 *
 * Scoring axes:
 *   specificity   — contains numbers, measurements, stud values, counts
 *   actionability — contains Luau code blocks, step lists, concrete instructions
 *   relevance     — key intent terms appear in the response
 *   length        — penalise both too short and bloated padding
 *
 * All state is in-process. No external dependency.
 */

import type { Intent } from './intent-classifier'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface QualityScore {
  total: number          // 0.0 – 1.0
  specificity: number    // 0.0 – 1.0
  actionability: number  // 0.0 – 1.0
  relevance: number      // 0.0 – 1.0
  lengthScore: number    // 0.0 – 1.0
  flags: QualityFlag[]
}

export type QualityFlag =
  | 'has_code'
  | 'has_numbers'
  | 'has_steps'
  | 'has_tip'
  | 'too_short'
  | 'too_long'
  | 'low_specificity'
  | 'no_code_for_script'
  | 'vague_language'

export interface AgentQualityStats {
  intent: Intent
  sampleCount: number
  averageTotal: number
  averageSpecificity: number
  averageActionability: number
  trend: 'improving' | 'stable' | 'degrading'
  recentScores: number[]   // last 20 scores, oldest first
}

// ---------------------------------------------------------------------------
// Specificity signals
// ---------------------------------------------------------------------------

const NUMBER_PATTERNS: RegExp[] = [
  /\b\d+\s*(studs?|parts?|polygons?|ms|fps|tokens?|coins?|%|k\b)/i,
  /\b\d+x\d+(\s*studs?)?\b/i,
  /\b\d+\.\d+\b/,               // decimal values (Vector3, Color3, etc.)
  /\[\s*\d+\s*,\s*\d+\s*\]/,   // array/tuple literals
  /\b(0\.\d+)\b/,               // fractions like 0.5
  /\b\d{3,}\b/,                 // large numbers (asset IDs, timestamps)
]

const VAGUE_PHRASES: RegExp[] = [
  /\b(some|several|many|a lot of|various|certain|things|stuff|etc|and so on)\b/i,
  /\b(might|maybe|perhaps|possibly|probably|could be|sort of|kind of)\b/i,
  /\b(it depends|up to you|you can try|feel free|basically)\b/i,
]

// ---------------------------------------------------------------------------
// Actionability signals
// ---------------------------------------------------------------------------

const CODE_BLOCK_RX = /```[\s\S]*?```/g
const STEP_LIST_RX = /^(\d+\.|[-*])\s+\w/m
const TIP_RX = /\btip\s*:/i

// Intent-specific required signals (if intent is X, we expect these in a good response)
const INTENT_REQUIRED_SIGNALS: Partial<Record<Intent, RegExp[]>> = {
  script: [/```lua|```luau/i],
  ui: [/```lua|```luau|screengui|frame|button/i],
  terrain: [/```lua|```luau|fillblock|fillball|writevoxels/i],
  building: [/instance\.new|part\.|cframe|vector3/i],
  economy: [/\b\d+\b/, /price|cost|reward|rate/i],
  combat: [/damage|health|hitbox|remoteevent/i],
}

// ---------------------------------------------------------------------------
// In-process stats store
// ---------------------------------------------------------------------------

const _stats = new Map<Intent, AgentQualityStats>()

function getOrCreateStats(intent: Intent): AgentQualityStats {
  if (!_stats.has(intent)) {
    _stats.set(intent, {
      intent,
      sampleCount: 0,
      averageTotal: 0,
      averageSpecificity: 0,
      averageActionability: 0,
      trend: 'stable',
      recentScores: [],
    })
  }
  return _stats.get(intent)!
}

function updateStats(intent: Intent, score: QualityScore): void {
  const s = getOrCreateStats(intent)
  const n = s.sampleCount

  s.averageTotal = (s.averageTotal * n + score.total) / (n + 1)
  s.averageSpecificity = (s.averageSpecificity * n + score.specificity) / (n + 1)
  s.averageActionability = (s.averageActionability * n + score.actionability) / (n + 1)
  s.sampleCount = n + 1

  s.recentScores.push(score.total)
  if (s.recentScores.length > 20) s.recentScores.shift()

  // Trend: compare last 5 vs previous 5
  if (s.recentScores.length >= 10) {
    const last5 = s.recentScores.slice(-5).reduce((a, b) => a + b, 0) / 5
    const prev5 = s.recentScores.slice(-10, -5).reduce((a, b) => a + b, 0) / 5
    const delta = last5 - prev5
    s.trend = delta > 0.05 ? 'improving' : delta < -0.05 ? 'degrading' : 'stable'
  }
}

// ---------------------------------------------------------------------------
// Scorer
// ---------------------------------------------------------------------------

/**
 * Score an AI response given the intent that generated it.
 * Also updates running quality stats for that intent (side-effect).
 */
export function scoreResponse(intent: Intent, response: string): QualityScore {
  const flags: QualityFlag[] = []

  // ── Specificity ───────────────────────────────────────────────────────────
  const numberHits = NUMBER_PATTERNS.filter(rx => rx.test(response)).length
  const vagueHits = VAGUE_PHRASES.filter(rx => rx.test(response)).length
  const hasNumbers = numberHits >= 2
  if (hasNumbers) flags.push('has_numbers')
  const vaguepenalty = Math.min(0.4, vagueHits * 0.1)
  const specificityRaw = Math.min(1, numberHits * 0.15) - vaguepenalty
  const specificity = parseFloat(Math.max(0, specificityRaw).toFixed(2))
  if (specificity < 0.3) flags.push('low_specificity')
  if (vagueHits > 2) flags.push('vague_language')

  // ── Actionability ─────────────────────────────────────────────────────────
  const codeBlocks = (response.match(CODE_BLOCK_RX) ?? []).length
  const hasCode = codeBlocks > 0
  const hasSteps = STEP_LIST_RX.test(response)
  const hasTip = TIP_RX.test(response)
  if (hasCode) flags.push('has_code')
  if (hasSteps) flags.push('has_steps')
  if (hasTip) flags.push('has_tip')

  let actionabilityRaw = 0
  if (hasCode) actionabilityRaw += 0.5
  if (hasSteps) actionabilityRaw += 0.25
  if (hasTip) actionabilityRaw += 0.15
  if (codeBlocks >= 2) actionabilityRaw += 0.1  // bonus: multiple snippets

  // Check intent-specific required signals
  const required = INTENT_REQUIRED_SIGNALS[intent] ?? []
  const missingRequired = required.filter(rx => !rx.test(response))
  if (intent === 'script' && !hasCode) {
    flags.push('no_code_for_script')
    actionabilityRaw = Math.max(0, actionabilityRaw - 0.3)
  }
  const actionability = parseFloat(Math.min(1, Math.max(0, actionabilityRaw - missingRequired.length * 0.1)).toFixed(2))

  // ── Relevance: does the response contain intent keywords? ─────────────────
  const RELEVANCE_TERMS: Partial<Record<Intent, string[]>> = {
    terrain: ['terrain', 'fillblock', 'fillball', 'voxel', 'stud'],
    building: ['instance.new', 'part', 'cframe', 'vector3', 'stud'],
    script: ['function', 'local', 'end', 'game.', 'players.'],
    ui: ['screengui', 'frame', 'textlabel', 'button', 'gui'],
    audio: ['sound', 'volume', 'play', 'loop'],
    lighting: ['lighting', 'atmosphere', 'ambient', 'fog'],
    economy: ['price', 'cost', 'reward', 'currency', 'shop'],
    combat: ['damage', 'health', 'attack', 'hitbox', 'remote'],
    npc: ['npc', 'humanoid', 'pathfinding', 'enemy'],
    mesh: ['mesh', '3d', 'polygon', 'vertices'],
    texture: ['texture', 'material', 'albedo', 'uv'],
    particle: ['particle', 'emitter', 'rate', 'size'],
    animation: ['animation', 'keyframe', 'track', 'humanoid'],
  }
  const relevanceTerms = RELEVANCE_TERMS[intent] ?? []
  const lower = response.toLowerCase()
  const relevanceHits = relevanceTerms.filter(t => lower.includes(t)).length
  const relevance = relevanceTerms.length > 0
    ? parseFloat(Math.min(1, relevanceHits / Math.max(1, relevanceTerms.length * 0.5)).toFixed(2))
    : 0.7  // no terms defined = assume neutral

  // ── Length score ──────────────────────────────────────────────────────────
  const charLen = response.length
  const tooShort = charLen < 120
  const tooLong = charLen > 4000
  if (tooShort) flags.push('too_short')
  if (tooLong) flags.push('too_long')
  // Ideal range: 200-2000 chars
  const lengthScore = tooShort
    ? parseFloat((charLen / 120 * 0.6).toFixed(2))
    : tooLong
      ? parseFloat(Math.max(0.5, 1 - (charLen - 2000) / 4000).toFixed(2))
      : 1.0

  // ── Weighted total ─────────────────────────────────────────────────────────
  const total = parseFloat(
    (specificity * 0.25 + actionability * 0.35 + relevance * 0.25 + lengthScore * 0.15).toFixed(2)
  )

  const result: QualityScore = { total, specificity, actionability, relevance, lengthScore, flags }

  // Update in-process stats (non-blocking)
  updateStats(intent, result)

  return result
}

/**
 * Get accumulated quality stats for one or all intents.
 */
export function getQualityStats(intent?: Intent): AgentQualityStats[] {
  if (intent) {
    return [getOrCreateStats(intent)]
  }
  return Array.from(_stats.values())
}

/**
 * Get intents with a degrading trend (for alerting/logging).
 */
export function getDegradingIntents(): Intent[] {
  return Array.from(_stats.values())
    .filter(s => s.trend === 'degrading' && s.sampleCount >= 10)
    .map(s => s.intent)
}
