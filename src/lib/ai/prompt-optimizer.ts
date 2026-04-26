/**
 * prompt-optimizer.ts
 * Self-learning prompt optimization engine for ForjeGames AI.
 *
 * How it learns:
 *  1. Every successful exchange is stored as a PromptRecord with a quality score.
 *  2. Feedback (thumbs up/down, 1-5 rating) adjusts the stored score.
 *  3. getOptimizedPrompt() builds a richer prompt using the highest-rated
 *     examples and the best system-prompt variant for that intent.
 *  4. A/B testing randomly picks between the current best variant and a
 *     challenger. Winners are promoted after MIN_AB_SAMPLES exchanges.
 *
 * All state is in-process (Map). No DB required.
 * Serialize/restore via exportState() / importState() for persistence.
 */

import type { Intent } from './intent-classifier'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PromptRecord {
  id: string
  intent: Intent
  userPrompt: string
  systemPromptVariantId: string
  outputQuality: number     // 0.0 – 1.0 from scoreResponse
  userRating: number | null // null = no explicit feedback, 1-5
  thumbsUp: boolean | null
  createdAt: number         // Date.now()
  usageCount: number        // how often this pattern was picked as exemplar
}

export interface SystemPromptVariant {
  id: string
  intent: Intent
  prompt: string
  wins: number
  losses: number
  totalUses: number
  avgQuality: number
  isChallenger: boolean
}

export interface OptimizationContext {
  intent: Intent
  userPrompt: string
  exemplars: PromptRecord[]   // top-k similar high-quality records
  variant: SystemPromptVariant
  abGroup: 'control' | 'challenger'
}

// ---------------------------------------------------------------------------
// Base system prompt fragments per intent
// These are what the optimizer starts from and learns to improve.
// ---------------------------------------------------------------------------

const BASE_SYSTEM_PROMPTS: Partial<Record<Intent, string>> = {
  terrain: `You are a Roblox terrain expert. Always include:
- Exact Terrain:FillBlock / FillBall / WriteVoxels Luau code
- Stud dimensions (e.g. Vector3.new(256, 32, 256))
- Material enum values (Enum.Material.Grass, etc.)
- Part count estimate when applicable
- A Tip: with next terrain step`,

  building: `You are a Roblox architecture expert. Buildings must NEVER be flat boxes. Always include:
- Foundation base (concrete/stone, wider than walls)
- 4 walls per floor with recessed windows (Glass, Transparency 0.5) with frames and sills
- Door opening (4x7 studs) with door frame and WoodPlanks door panel
- Roof with either pitched WedgeParts or flat parapet — never a bare flat top
- Corner pilaster trim, floor ledge bands between stories
- PointLights inside windows for warm glow
- Interior floor Parts (WoodPlanks or Marble)
- Specific Color3.fromRGB values (wall, trim, roof, accent — 4 colors minimum)
- All parts in a named Model with Folders (Walls, Roof, Details, Lights)
- Estimated part count
- A Tip: with next build step`,

  script: `You are a senior Luau engineer. Always include:
- Complete, runnable Luau code in triple backtick blocks
- Server vs Client placement recommendation
- pcall wrapping for DataStore calls
- task.wait() not wait(), task.spawn() not spawn()
- A Tip: with a security or performance note`,

  npc: `You are a Roblox NPC and AI specialist. Always include:
- PathfindingService or SimplePath usage
- Humanoid and AnimationTrack setup code
- Server-side health and damage handling
- Exact stud detection radius values
- A Tip: with performance optimisation`,

  ui: `You are a Roblox UI/UX expert. Always include:
- Complete ScreenGui hierarchy in Luau
- AnchorPoint, Position, Size with exact Scale/Offset values
- TweenService animation with TweenInfo
- UIStroke / UICorner / UIGradient for polish
- A Tip: with mobile responsiveness advice`,

  economy: `You are a Roblox economy designer. Always include:
- Exact numerical values: prices, earn rates, multipliers
- DataStore save/load pattern with pcall
- Anti-exploit notes (server-authoritative, never trust client amounts)
- Inflation/balance consideration
- A Tip: with monetisation suggestion`,

  combat: `You are a Roblox combat systems engineer. Always include:
- RemoteEvent names and server-side validation
- Hitbox technique (Region3, GetTouchingParts, or Raycast) with code
- Exact damage numbers and cooldown values in seconds
- Health bar UI update pattern
- A Tip: with latency compensation note`,

  lighting: `You are a Roblox lighting and atmosphere specialist. Always include:
- game.Lighting property assignments with exact values
- Atmosphere and ColorCorrection settings
- Time of day number (0-24)
- FogStart / FogEnd in studs
- A Tip: with performance note (ShadowMap vs Voxel)`,
}

const DEFAULT_SYSTEM_PROMPT = `You are ForjeAI, an expert Roblox game development assistant.
Always provide specific numbers, stud dimensions, and Luau code blocks.
End with a Tip: for the next logical step.`

// ---------------------------------------------------------------------------
// In-process state
// ---------------------------------------------------------------------------

// Records indexed by id
const _records = new Map<string, PromptRecord>()

// Per-intent records list (for fast lookup without full map scan)
const _intentIndex = new Map<Intent, string[]>()

// System prompt variants per intent
const _variants = new Map<Intent, SystemPromptVariant[]>()

// Active A/B test: intent -> { challengerId, samplesSinceStart }
const _abTests = new Map<Intent, { challengerId: string; samples: number }>()

const MIN_QUALITY_TO_STORE = 0.45   // only store records worth learning from
const MAX_RECORDS_PER_INTENT = 200  // prevent unbounded memory growth
const TOP_K_EXEMPLARS = 3           // how many examples to inject into prompt
const MIN_AB_SAMPLES = 30           // exchanges before declaring A/B winner

let _idCounter = 0
function nextId(): string {
  return `pr_${Date.now()}_${++_idCounter}`
}

// ---------------------------------------------------------------------------
// Variant management
// ---------------------------------------------------------------------------

function getOrCreateVariants(intent: Intent): SystemPromptVariant[] {
  if (!_variants.has(intent)) {
    const base = BASE_SYSTEM_PROMPTS[intent] ?? DEFAULT_SYSTEM_PROMPT
    const v: SystemPromptVariant = {
      id: `v_${intent}_base`,
      intent,
      prompt: base,
      wins: 0,
      losses: 0,
      totalUses: 0,
      avgQuality: 0,
      isChallenger: false,
    }
    _variants.set(intent, [v])
  }
  return _variants.get(intent)!
}

function getBestVariant(intent: Intent): SystemPromptVariant {
  const variants = getOrCreateVariants(intent)
  return variants
    .filter(v => !v.isChallenger)
    .sort((a, b) => b.avgQuality - a.avgQuality)[0] ?? variants[0]
}

function pickVariantForRequest(intent: Intent): { variant: SystemPromptVariant; abGroup: 'control' | 'challenger' } {
  const variants = getOrCreateVariants(intent)
  const challengers = variants.filter(v => v.isChallenger)
  const ab = _abTests.get(intent)

  if (challengers.length > 0 && ab && Math.random() < 0.2) {
    // 20% traffic goes to challenger during A/B test
    const challenger = challengers.find(v => v.id === ab.challengerId)
    if (challenger) return { variant: challenger, abGroup: 'challenger' }
  }

  return { variant: getBestVariant(intent), abGroup: 'control' }
}

/**
 * Introduce a new challenger variant for A/B testing.
 * Call this when external feedback suggests the current prompt needs improvement.
 */
export function addChallengerVariant(intent: Intent, newPrompt: string): string {
  const variants = getOrCreateVariants(intent)
  const id = `v_${intent}_${Date.now()}`
  const v: SystemPromptVariant = {
    id,
    intent,
    prompt: newPrompt,
    wins: 0,
    losses: 0,
    totalUses: 0,
    avgQuality: 0,
    isChallenger: true,
  }
  variants.push(v)
  _abTests.set(intent, { challengerId: id, samples: 0 })
  return id
}

function resolveAbTest(intent: Intent): void {
  const ab = _abTests.get(intent)
  if (!ab) return
  const variants = getOrCreateVariants(intent)
  const challenger = variants.find(v => v.id === ab.challengerId)
  const control = getBestVariant(intent)
  if (!challenger) return

  if (challenger.avgQuality > control.avgQuality + 0.05) {
    // Challenger wins: promote it, demote old control
    challenger.isChallenger = false
    control.isChallenger = true  // keep for rollback but don't serve as default
  }
  // Either way, end A/B test
  _abTests.delete(intent)
}

// ---------------------------------------------------------------------------
// Record storage
// ---------------------------------------------------------------------------

function addRecord(record: PromptRecord): void {
  const ids = _intentIndex.get(record.intent) ?? []

  // Evict lowest-quality record if at capacity
  if (ids.length >= MAX_RECORDS_PER_INTENT) {
    const lowestId = ids
      .map(id => _records.get(id)!)
      .sort((a, b) => a.outputQuality - b.outputQuality)[0]?.id
    if (lowestId) {
      _records.delete(lowestId)
      const idx = ids.indexOf(lowestId)
      if (idx !== -1) ids.splice(idx, 1)
    }
  }

  _records.set(record.id, record)
  ids.push(record.id)
  _intentIndex.set(record.intent, ids)
}

// ---------------------------------------------------------------------------
// Exemplar selection
// ---------------------------------------------------------------------------

/**
 * Simple keyword overlap between two strings (Jaccard-like).
 */
function similarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\W+/).filter(w => w.length > 3))
  const wordsB = new Set(b.toLowerCase().split(/\W+/).filter(w => w.length > 3))
  const intersection = [...wordsA].filter(w => wordsB.has(w)).length
  const union = new Set([...wordsA, ...wordsB]).size
  return union === 0 ? 0 : intersection / union
}

function getTopExemplars(intent: Intent, userPrompt: string, k: number): PromptRecord[] {
  const ids = _intentIndex.get(intent) ?? []
  if (ids.length === 0) return []

  return ids
    .map(id => _records.get(id)!)
    .filter(r => r.outputQuality >= 0.6)
    .map(r => ({ record: r, sim: similarity(userPrompt, r.userPrompt) }))
    .sort((a, b) => {
      // Combined: 60% quality + 40% similarity
      const scoreA = a.record.outputQuality * 0.6 + a.sim * 0.4
      const scoreB = b.record.outputQuality * 0.6 + b.sim * 0.4
      return scoreB - scoreA
    })
    .slice(0, k)
    .map(x => x.record)
}

// ---------------------------------------------------------------------------
// Core export: getOptimizedPrompt
// ---------------------------------------------------------------------------

/**
 * Build an optimized system prompt for the given intent and user message.
 *
 * The returned string is ready to pass directly to the AI as system prompt.
 * Also returns `context` with A/B group and exemplars used, for later
 * feedback recording via `recordExchange`.
 */
export function getOptimizedPrompt(
  intent: Intent,
  userPrompt: string
): { systemPrompt: string; context: OptimizationContext } {
  const { variant, abGroup } = pickVariantForRequest(intent)
  const exemplars = getTopExemplars(intent, userPrompt, TOP_K_EXEMPLARS)

  // Increment usage on chosen variant
  variant.totalUses++

  let systemPrompt = variant.prompt

  // Inject few-shot exemplar context if we have good ones
  if (exemplars.length > 0) {
    const exSection = exemplars
      .map((e, i) => `Example ${i + 1} (quality ${(e.outputQuality * 100).toFixed(0)}%):\nUser: ${e.userPrompt}`)
      .join('\n\n')
    systemPrompt = `${systemPrompt}\n\n--- SIMILAR HIGH-QUALITY REQUESTS (for style reference) ---\n${exSection}\n---`
  }

  // Increment exemplar usage counts
  for (const e of exemplars) {
    e.usageCount++
  }

  return {
    systemPrompt,
    context: { intent, userPrompt, exemplars, variant, abGroup },
  }
}

// ---------------------------------------------------------------------------
// Record a completed exchange
// ---------------------------------------------------------------------------

/**
 * Store a completed exchange for future learning.
 * Call this after receiving the AI response and scoring it.
 *
 * @param context    The context returned by getOptimizedPrompt
 * @param quality    QualityScore.total from scoreResponse()
 * @returns          The stored record's ID (pass to applyFeedback later)
 */
export function recordExchange(
  context: OptimizationContext,
  quality: number
): string {
  if (quality < MIN_QUALITY_TO_STORE) return ''  // not worth learning from

  const record: PromptRecord = {
    id: nextId(),
    intent: context.intent,
    userPrompt: context.userPrompt,
    systemPromptVariantId: context.variant.id,
    outputQuality: quality,
    userRating: null,
    thumbsUp: null,
    createdAt: Date.now(),
    usageCount: 0,
  }

  addRecord(record)

  // Update variant stats
  const v = context.variant
  const n = v.totalUses || 1
  v.avgQuality = (v.avgQuality * (n - 1) + quality) / n

  // Check if A/B test is ready to resolve
  const ab = _abTests.get(context.intent)
  if (ab) {
    ab.samples++
    if (ab.samples >= MIN_AB_SAMPLES) resolveAbTest(context.intent)
  }

  return record.id
}

// ---------------------------------------------------------------------------
// Apply user feedback
// ---------------------------------------------------------------------------

export type FeedbackInput =
  | { type: 'thumbs'; value: boolean }
  | { type: 'rating'; value: 1 | 2 | 3 | 4 | 5 }

/**
 * Apply explicit user feedback to a stored record.
 * Adjusts the record's quality score and variant win/loss counters.
 */
/** Retrieve a stored prompt record by ID (used by feedback route to get context) */
export function getRecord(recordId: string): PromptRecord | undefined {
  return _records.get(recordId)
}

export function applyFeedback(recordId: string, feedback: FeedbackInput): boolean {
  const record = _records.get(recordId)
  if (!record) return false

  const variants = getOrCreateVariants(record.intent)
  const variant = variants.find(v => v.id === record.systemPromptVariantId)

  let adjustedQuality = record.outputQuality

  if (feedback.type === 'thumbs') {
    record.thumbsUp = feedback.value
    adjustedQuality = feedback.value
      ? Math.min(1, record.outputQuality + 0.15)
      : Math.max(0, record.outputQuality - 0.25)
    if (variant) {
      feedback.value ? variant.wins++ : variant.losses++
    }
  } else {
    // rating 1-5 → normalize to 0-1, then blend with existing quality
    record.userRating = feedback.value
    const normalized = (feedback.value - 1) / 4
    adjustedQuality = record.outputQuality * 0.4 + normalized * 0.6
    if (variant) {
      normalized >= 0.6 ? variant.wins++ : variant.losses++
    }
  }

  record.outputQuality = parseFloat(adjustedQuality.toFixed(3))

  // Recompute variant avgQuality
  if (variant) {
    const allRecordsForVariant = Array.from(_records.values())
      .filter(r => r.systemPromptVariantId === variant.id)
    if (allRecordsForVariant.length > 0) {
      variant.avgQuality = allRecordsForVariant.reduce((s, r) => s + r.outputQuality, 0) / allRecordsForVariant.length
    }
  }

  return true
}

// ---------------------------------------------------------------------------
// State serialization (for persistence / Redis / DB)
// ---------------------------------------------------------------------------

export interface OptimizerState {
  records: PromptRecord[]
  variants: [Intent, SystemPromptVariant[]][]
  abTests: [Intent, { challengerId: string; samples: number }][]
  exportedAt: number
}

export function exportState(): OptimizerState {
  return {
    records: Array.from(_records.values()),
    variants: Array.from(_variants.entries()),
    abTests: Array.from(_abTests.entries()),
    exportedAt: Date.now(),
  }
}

export function importState(state: OptimizerState): void {
  _records.clear()
  _intentIndex.clear()
  _variants.clear()
  _abTests.clear()

  for (const r of state.records) {
    _records.set(r.id, r)
    const ids = _intentIndex.get(r.intent) ?? []
    ids.push(r.id)
    _intentIndex.set(r.intent, ids)
  }
  for (const [intent, variants] of state.variants) {
    _variants.set(intent, variants)
  }
  for (const [intent, ab] of state.abTests) {
    _abTests.set(intent, ab)
  }
}

// ---------------------------------------------------------------------------
// Diagnostic helpers
// ---------------------------------------------------------------------------

export function getOptimizerStats(): Record<string, unknown> {
  const intentCounts: Record<string, number> = {}
  for (const [intent, ids] of _intentIndex.entries()) {
    intentCounts[intent] = ids.length
  }
  const variantStats: Record<string, { variants: number; bestQuality: number }> = {}
  for (const [intent, vs] of _variants.entries()) {
    const best = vs.filter(v => !v.isChallenger).sort((a, b) => b.avgQuality - a.avgQuality)[0]
    variantStats[intent] = { variants: vs.length, bestQuality: parseFloat((best?.avgQuality ?? 0).toFixed(3)) }
  }
  return {
    totalRecords: _records.size,
    intentCounts,
    variantStats,
    activeAbTests: Array.from(_abTests.keys()),
  }
}
