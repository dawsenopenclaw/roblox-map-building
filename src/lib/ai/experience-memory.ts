/**
 * Experience Memory v2 — Semantic Learning System
 *
 * Every build (code, script, terrain, mesh) teaches the next one via:
 *
 * 1. SEMANTIC RETRIEVAL — pgvector embeddings (768-dim) find similar past builds
 *    even when wording differs ("castle" matches "medieval fortress").
 *    Falls back to keyword matching if embedding fails.
 *
 * 2. RECENCY WEIGHTING — recent builds matter more (exponential decay, 7-day half-life).
 *
 * 3. AGGREGATE PATTERNS — statistical rules extracted from all builds per category
 *    ("Castle builds: Granite+Slate avg 82/100, 60+ parts recommended").
 *
 * 4. TOKEN-EFFICIENT ANTI-PATTERNS — failures distilled into 1-2 line rules,
 *    not full code blocks (saves ~500 tokens per anti-pattern).
 *
 * 5. CONFIDENCE SCORING — predicts likely success rate for a prompt based on
 *    past outcomes. Low confidence auto-triggers preview mode.
 *
 * 6. MULTI-TYPE — works for builds, scripts, terrain, images, and meshes.
 *
 * Signals ranked: user vote (3x) > playtest result (2x) > verifier score (1x)
 */

import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

// Lazy import embedText to avoid circular dependency / cold-start overhead
let _embedText: ((text: string) => Promise<number[]>) | null = null
async function getEmbedText() {
  if (!_embedText) {
    const rag = await import('./rag')
    _embedText = rag.embedText
  }
  return _embedText
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BuildType = 'build' | 'script' | 'terrain' | 'image' | 'mesh'

export interface ExperienceEntry {
  id?: string
  prompt: string
  code: string
  score: number
  model: string
  keywords: Set<string>
  category: string | null
  buildType: BuildType
  partCount: number | null
  userVote: boolean | null
  playtestPass: boolean | null
  createdAt: Date
}

export interface MatchedExperience {
  prompt: string
  code: string
  score: number
  similarity: number  // 0-1 semantic similarity (or keyword overlap ratio)
  userVote: boolean | null
  category: string | null
  buildType: BuildType
  age: number  // days since creation
}

export type ExperienceRecord = MatchedExperience

export interface AggregatePattern {
  category: string
  buildType: BuildType
  avgScore: number
  totalBuilds: number
  successRate: number  // % of builds with score >= 65 or userVote=true
  topMaterials: string[]  // most common in high-scoring builds
  avgPartCount: number
  commonFailures: string[]  // distilled failure rules
}

export interface ConfidenceResult {
  confidence: number  // 0-1 predicted success probability
  sampleSize: number  // how many past builds informed this
  suggestion: 'proceed' | 'preview' | 'warn'
  reason?: string
}

// ---------------------------------------------------------------------------
// Genre/category detection
// ---------------------------------------------------------------------------

const CATEGORY_PATTERNS: [RegExp, string][] = [
  [/medieval|castle|knight|sword|kingdom|throne|dungeon|dragon/i, 'medieval'],
  [/sci-?fi|space|spaceship|futuristic|cyber|robot|mech|alien|galaxy/i, 'sci-fi'],
  [/horror|haunted|spooky|zombie|creepy|scary/i, 'horror'],
  [/modern|city|urban|apartment|office|shop|store|restaurant/i, 'modern'],
  [/nature|forest|mountain|lake|river|waterfall|cave|island/i, 'nature'],
  [/tycoon|factory|business|money/i, 'tycoon'],
  [/obby|parkour|obstacle|jump|platform/i, 'obby'],
  [/racing|race|track|car|vehicle|speed/i, 'racing'],
  [/rpg|adventure|quest|hero|village|tavern|inn/i, 'rpg'],
  [/military|army|war|tank|bunker|base|fort/i, 'military'],
  [/pirate|ship|boat|ocean|sea|harbor|dock/i, 'pirate'],
  [/farm|barn|ranch|garden|crop|animal/i, 'farm'],
  [/school|classroom|library|gym|playground/i, 'school'],
  [/house|home|cabin|cottage|mansion|villa/i, 'house'],
  [/tower|defense|td|turret|wave|enemy/i, 'tower-defense'],
  [/terrain|landscape|hill|valley|biome/i, 'terrain'],
  [/script|npc|ai|pathfind|gamepass|leaderboard|datastore|gui|menu/i, 'script'],
]

export function detectCategory(prompt: string): string | null {
  for (const [pattern, cat] of CATEGORY_PATTERNS) {
    if (pattern.test(prompt)) return cat
  }
  return null
}

export function detectBuildType(prompt: string, aiMode?: string): BuildType {
  if (aiMode === 'script') return 'script'
  if (aiMode === 'terrain') return 'terrain'
  if (aiMode === 'image') return 'image'
  if (aiMode === 'mesh') return 'mesh'
  if (/\bscript\b|npc|datastore|gamepass|leaderboard|gui\b|remote\s*event/i.test(prompt)) return 'script'
  if (/terrain|landscape|biome|heightmap/i.test(prompt)) return 'terrain'
  return 'build'
}

// ---------------------------------------------------------------------------
// Keyword extraction (fallback when embeddings unavailable)
// ---------------------------------------------------------------------------

const STOP_WORDS = new Set([
  'a','an','the','me','my','i','we','you','it','is','are','was','were','be',
  'been','being','have','has','had','do','does','did','will','would','shall',
  'should','may','might','must','can','could','build','make','create','add',
  'put','get','set','use','give','with','and','or','but','in','on','at','to',
  'for','of','by','from','up','out','if','about','into','through','during',
  'before','after','above','below','between','same','some','any','each',
  'every','all','both','few','more','most','other','no','not','only','own',
  'so','than','too','very','just','that','this','these','those','then',
  'there','here','when','where','why','how','what','which','who','whom',
  'its','his','her','their','our','also','as','like','want','need','please',
  'something','thing',
])
const ROBLOX_TERMS = new Set(['npc', 'gui', 'ui', 'hp', 'xp'])

export function extractKeywords(prompt: string): Set<string> {
  const words = prompt.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean)
  const keywords = new Set<string>()
  for (const word of words) {
    if (ROBLOX_TERMS.has(word)) { keywords.add(word); continue }
    if (word.length < 2 || STOP_WORDS.has(word)) continue
    keywords.add(word)
  }
  return keywords
}

export function countPartsInCode(code: string): number {
  // Count all physical parts (Part, WedgePart, MeshPart, SpawnLocation, Seat, etc.)
  return (code.match(/Instance\.new\s*\(\s*["'](?:Part|WedgePart|MeshPart|SpawnLocation|Seat|VehicleSeat|TrussPart|CornerWedgePart)["']\s*\)/g) || []).length
}

/** Count scripted/interactive instances — lights, effects, interactors, UI */
export function countInteractiveInstances(code: string): {
  lights: number; effects: number; interactors: number; ui: number; scripts: number
} {
  return {
    lights: (code.match(/Instance\.new\s*\(\s*["'](?:PointLight|SpotLight|SurfaceLight)["']/g) || []).length,
    effects: (code.match(/Instance\.new\s*\(\s*["'](?:Fire|Smoke|Sparkles|ParticleEmitter|Beam|Trail)["']/g) || []).length,
    interactors: (code.match(/Instance\.new\s*\(\s*["'](?:ProximityPrompt|ClickDetector|Sound)["']/g) || []).length,
    ui: (code.match(/Instance\.new\s*\(\s*["'](?:SurfaceGui|BillboardGui|TextLabel|Frame|ScreenGui)["']/g) || []).length,
    scripts: (code.match(/Instance\.new\s*\(\s*["'](?:Script|LocalScript|ModuleScript)["']/g) || []).length,
  }
}

// ---------------------------------------------------------------------------
// Recency weight — exponential decay with 7-day half-life
// ---------------------------------------------------------------------------

function recencyWeight(createdAt: Date): number {
  const daysOld = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
  return Math.pow(0.5, daysOld / 7) // Half-life of 7 days
}

// ---------------------------------------------------------------------------
// Simple hash for dedup
// ---------------------------------------------------------------------------

function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }
  return Math.abs(hash).toString(36)
}

// ---------------------------------------------------------------------------
// LRU Cache
// ---------------------------------------------------------------------------

class LRUCache<V> {
  private map = new Map<string, V>()
  constructor(private maxSize: number) {}
  get(key: string): V | undefined {
    const val = this.map.get(key)
    if (val !== undefined) { this.map.delete(key); this.map.set(key, val) }
    return val
  }
  set(key: string, value: V): void {
    if (this.map.has(key)) this.map.delete(key)
    else if (this.map.size >= this.maxSize) {
      const first = this.map.keys().next().value as string | undefined
      if (first) this.map.delete(first)
    }
    this.map.set(key, value)
  }
  allValues(): V[] { return Array.from(this.map.values()) }
  get size(): number { return this.map.size }
}

// ---------------------------------------------------------------------------
// Material extraction from code
// ---------------------------------------------------------------------------

function extractMaterials(code: string): string[] {
  const matches = code.match(/Enum\.Material\.(\w+)/g) || []
  const mats = new Set(matches.map(m => m.replace('Enum.Material.', '')))
  mats.delete('SmoothPlastic')
  return Array.from(mats)
}

// ---------------------------------------------------------------------------
// ExperienceMemory class
// ---------------------------------------------------------------------------

const MAX_CACHE = 300
const MIN_SCORE_POSITIVE = 65
const MAX_SCORE_NEGATIVE = 45
const SEMANTIC_THRESHOLD = 0.35  // Minimum cosine similarity for a match

export class ExperienceMemory {
  private positiveCache = new LRUCache<ExperienceEntry>(MAX_CACHE)
  private negativeCache = new LRUCache<ExperienceEntry>(100)
  private patternCache = new Map<string, AggregatePattern>() // category → pattern
  private patternCacheTime = 0
  private dbLoaded = false

  // ── Record a build outcome ────────────────────────────────────────────

  async recordOutcome(
    prompt: string,
    code: string,
    score: number,
    model: string,
    opts?: {
      category?: string | null
      partCount?: number | null
      userVote?: boolean | null
      playtestPass?: boolean | null
      buildType?: BuildType
    }
  ): Promise<void> {
    const keywords = extractKeywords(prompt)
    const category = opts?.category ?? detectCategory(prompt)
    const buildType = opts?.buildType ?? 'build'
    const key = simpleHash(prompt)
    const entry: ExperienceEntry = {
      prompt, code, score, model, keywords, category, buildType,
      partCount: opts?.partCount ?? countPartsInCode(code),
      userVote: opts?.userVote ?? null,
      playtestPass: opts?.playtestPass ?? null,
      createdAt: new Date(),
    }

    const isPositive = opts?.userVote === true || (opts?.userVote !== false && score >= MIN_SCORE_POSITIVE)
    const isNegative = opts?.userVote === false || (opts?.userVote !== true && score < MAX_SCORE_NEGATIVE)

    if (isPositive) this.positiveCache.set(key, entry)
    else if (isNegative) this.negativeCache.set(key, entry)

    // Persist to DB with embedding (fire-and-forget)
    this.persistToDb(prompt, code, score, model, category, entry.partCount, buildType, opts?.userVote, opts?.playtestPass).catch(() => {})
  }

  // Backward-compat alias
  async recordExperience(prompt: string, code: string, score: number, model: string): Promise<void> {
    return this.recordOutcome(prompt, code, score, model)
  }

  // ── Semantic retrieval — pgvector first, keyword fallback ─────────────

  async findSimilarSuccesses(prompt: string, limit = 3, buildType?: BuildType): Promise<MatchedExperience[]> {
    // Try semantic search first
    try {
      const results = await this.semanticSearch(prompt, true, limit, buildType)
      if (results.length > 0) return results
    } catch {
      // Embedding failed — fall through to keyword search
    }

    // Keyword fallback
    return this.keywordSearch(prompt, true, limit, buildType)
  }

  async findAntiPatterns(prompt: string, limit = 2, buildType?: BuildType): Promise<MatchedExperience[]> {
    try {
      const results = await this.semanticSearch(prompt, false, limit, buildType)
      if (results.length > 0) return results
    } catch { /* fall through */ }
    return this.keywordSearch(prompt, false, limit, buildType)
  }

  // ── Semantic search via pgvector ──────────────────────────────────────

  private async semanticSearch(prompt: string, positive: boolean, limit: number, buildType?: BuildType): Promise<MatchedExperience[]> {
    const embedText = await getEmbedText()
    const embedding = await embedText(prompt)
    const vectorStr = `[${embedding.join(',')}]`

    const scoreCondition = positive
      ? Prisma.sql`(bf."score" >= ${MIN_SCORE_POSITIVE} OR bf."userVote" = true)`
      : Prisma.sql`(bf."score" <= ${MAX_SCORE_NEGATIVE} OR bf."userVote" = false)`

    const typeCondition = buildType
      ? Prisma.sql`AND (bf."buildType" = ${buildType} OR bf."buildType" IS NULL)`
      : Prisma.sql``

    const rows = await db.$queryRaw<Array<{
      prompt: string | null
      code: string
      score: number
      similarity: number
      userVote: boolean | null
      category: string | null
      buildType: string | null
      createdAt: Date
    }>>(Prisma.sql`
      SELECT
        bf."prompt",
        bf."code",
        bf."score",
        1 - (bf."embedding" <=> ${vectorStr}::vector) as similarity,
        bf."userVote",
        bf."category",
        bf."buildType",
        bf."createdAt"
      FROM "BuildFeedback" bf
      WHERE bf."embedding" IS NOT NULL
        AND ${scoreCondition}
        ${typeCondition}
        AND 1 - (bf."embedding" <=> ${vectorStr}::vector) > ${SEMANTIC_THRESHOLD}
      ORDER BY bf."embedding" <=> ${vectorStr}::vector ASC
      LIMIT ${limit * 2}
    `)

    if (rows.length === 0) return []

    // Apply recency weighting and signal boosting
    const weighted = rows.map(r => {
      let weight = r.similarity * recencyWeight(r.createdAt)
      if (r.userVote === (positive ? true : false)) weight *= 3
      return { ...r, weight }
    })

    weighted.sort((a, b) => b.weight - a.weight)

    return weighted.slice(0, limit).map(r => ({
      prompt: r.prompt || '',
      code: r.code,
      score: r.score,
      similarity: r.similarity,
      userVote: r.userVote,
      category: r.category,
      buildType: (r.buildType as BuildType) || 'build',
      age: (Date.now() - r.createdAt.getTime()) / (1000 * 60 * 60 * 24),
    }))
  }

  // ── Keyword fallback search ──────────────────────────────────────────

  private async keywordSearch(prompt: string, positive: boolean, limit: number, buildType?: BuildType): Promise<MatchedExperience[]> {
    if (!this.dbLoaded) {
      await this.loadFromDb().catch(() => {})
      this.dbLoaded = true
    }

    const queryKeywords = extractKeywords(prompt)
    const queryCategory = detectCategory(prompt)
    if (queryKeywords.size === 0) return []

    const cache = positive ? this.positiveCache : this.negativeCache
    const scored: (MatchedExperience & { weight: number })[] = []

    for (const entry of cache.allValues()) {
      if (buildType && entry.buildType !== buildType) continue

      let overlapCount = 0
      for (const kw of Array.from(queryKeywords)) {
        if (entry.keywords.has(kw)) overlapCount++
      }
      if (overlapCount === 0) continue

      const similarity = overlapCount / Math.max(queryKeywords.size, 1)
      let weight = similarity * recencyWeight(entry.createdAt)
      if (queryCategory && entry.category === queryCategory) weight *= 2
      if (entry.userVote === (positive ? true : false)) weight *= 3
      if (entry.playtestPass === positive) weight *= 1.5

      scored.push({
        prompt: entry.prompt,
        code: entry.code,
        score: entry.score,
        similarity,
        userVote: entry.userVote,
        category: entry.category,
        buildType: entry.buildType,
        age: (Date.now() - entry.createdAt.getTime()) / (1000 * 60 * 60 * 24),
        weight,
      })
    }

    scored.sort((a, b) => b.weight - a.weight)
    return scored.slice(0, limit)
  }

  // ── Aggregate Patterns — statistical rules from all builds ────────────

  async getAggregatePatterns(category?: string, buildType: BuildType = 'build'): Promise<AggregatePattern[]> {
    // Cache for 5 minutes
    if (Date.now() - this.patternCacheTime < 5 * 60 * 1000 && this.patternCache.size > 0) {
      if (category) {
        const cached = this.patternCache.get(`${category}:${buildType}`)
        return cached ? [cached] : []
      }
      return Array.from(this.patternCache.values()).filter(p => p.buildType === buildType)
    }

    try {
      // Get aggregate stats per category
      const stats = await db.$queryRaw<Array<{
        category: string
        buildType: string
        avgScore: number
        totalBuilds: number
        successCount: number
        avgPartCount: number
      }>>(Prisma.sql`
        SELECT
          COALESCE(bf."category", 'general') as category,
          COALESCE(bf."buildType", 'build') as "buildType",
          AVG(bf."score")::int as "avgScore",
          COUNT(*)::int as "totalBuilds",
          COUNT(*) FILTER (WHERE bf."score" >= 65 OR bf."userVote" = true)::int as "successCount",
          AVG(bf."partCount")::int as "avgPartCount"
        FROM "BuildFeedback" bf
        WHERE bf."createdAt" > NOW() - INTERVAL '30 days'
        GROUP BY COALESCE(bf."category", 'general'), COALESCE(bf."buildType", 'build')
        HAVING COUNT(*) >= 3
        ORDER BY "avgScore" DESC
      `)

      // Get top materials from high-scoring builds per category
      const matRows = await db.$queryRaw<Array<{
        category: string
        code: string
      }>>(Prisma.sql`
        SELECT COALESCE(bf."category", 'general') as category, bf."code"
        FROM "BuildFeedback" bf
        WHERE bf."score" >= 70 AND bf."createdAt" > NOW() - INTERVAL '30 days'
        ORDER BY bf."score" DESC
        LIMIT 100
      `)

      // Get failure patterns
      const failRows = await db.$queryRaw<Array<{
        category: string
        errorMessage: string | null
      }>>(Prisma.sql`
        SELECT COALESCE(bf."category", 'general') as category, bf."errorMessage"
        FROM "BuildFeedback" bf
        WHERE bf."score" < 40 AND bf."errorMessage" IS NOT NULL
          AND bf."createdAt" > NOW() - INTERVAL '30 days'
        LIMIT 50
      `)

      // Aggregate materials by category
      const matsByCategory = new Map<string, Map<string, number>>()
      for (const row of matRows) {
        const mats = extractMaterials(row.code)
        if (!matsByCategory.has(row.category)) matsByCategory.set(row.category, new Map())
        const catMats = matsByCategory.get(row.category)!
        for (const m of mats) catMats.set(m, (catMats.get(m) || 0) + 1)
      }

      // Aggregate failure reasons by category
      const failsByCategory = new Map<string, string[]>()
      for (const row of failRows) {
        if (!row.errorMessage) continue
        if (!failsByCategory.has(row.category)) failsByCategory.set(row.category, [])
        // Distill to short rule
        const short = row.errorMessage.slice(0, 100)
        failsByCategory.get(row.category)!.push(short)
      }

      // Build patterns
      this.patternCache.clear()
      for (const stat of stats) {
        const catMats = matsByCategory.get(stat.category)
        const topMaterials = catMats
          ? Array.from(catMats.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([m]) => m)
          : []

        const failures = failsByCategory.get(stat.category) || []
        // Deduplicate and take top 3 most common
        const failCounts = new Map<string, number>()
        for (const f of failures) failCounts.set(f, (failCounts.get(f) || 0) + 1)
        const commonFailures = Array.from(failCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([msg]) => msg)

        const pattern: AggregatePattern = {
          category: stat.category,
          buildType: stat.buildType as BuildType,
          avgScore: stat.avgScore,
          totalBuilds: stat.totalBuilds,
          successRate: stat.totalBuilds > 0 ? stat.successCount / stat.totalBuilds : 0,
          topMaterials,
          avgPartCount: stat.avgPartCount || 0,
          commonFailures,
        }
        this.patternCache.set(`${stat.category}:${stat.buildType}`, pattern)
      }
      this.patternCacheTime = Date.now()

      if (category) {
        const cached = this.patternCache.get(`${category}:${buildType}`)
        return cached ? [cached] : []
      }
      return Array.from(this.patternCache.values()).filter(p => p.buildType === buildType)
    } catch (err) {
      console.warn('[ExperienceMemory] Aggregate pattern query failed:', err instanceof Error ? err.message : err)
      return []
    }
  }

  // ── Confidence scoring — predict success for a prompt ────────────────

  async getConfidence(prompt: string, buildType: BuildType = 'build'): Promise<ConfidenceResult> {
    const category = detectCategory(prompt)

    // Check aggregate patterns for this category
    const patterns = await this.getAggregatePatterns(category || undefined, buildType)
    if (patterns.length === 0) {
      return { confidence: 0.5, sampleSize: 0, suggestion: 'proceed' }
    }

    const pattern = patterns[0]
    const confidence = pattern.successRate
    const sampleSize = pattern.totalBuilds

    if (sampleSize < 5) {
      return { confidence: 0.5, sampleSize, suggestion: 'proceed', reason: 'Not enough data yet' }
    }

    if (confidence < 0.4) {
      return {
        confidence,
        sampleSize,
        suggestion: 'preview',
        reason: `Similar ${category || buildType} builds succeed ${Math.round(confidence * 100)}% of the time. Showing options first.`,
      }
    }

    if (confidence < 0.6) {
      return {
        confidence,
        sampleSize,
        suggestion: 'warn',
        reason: `Similar builds have a ${Math.round(confidence * 100)}% success rate — results may vary.`,
      }
    }

    return { confidence, sampleSize, suggestion: 'proceed' }
  }

  // ── Format for prompt injection ──────────────────────────────────────

  formatAsExamples(successes: MatchedExperience[]): string {
    if (successes.length === 0) return ''

    const lines: string[] = ['', '[PROVEN_EXAMPLES]']
    lines.push('Verified working builds similar to the current request. Learn from their patterns:')
    lines.push('')

    for (let i = 0; i < successes.length; i++) {
      const s = successes[i]
      const codeLines = s.code.split('\n')
      const truncated = codeLines.length > 50
        ? codeLines.slice(0, 50).join('\n') + '\n-- (truncated) --'
        : s.code

      const badges: string[] = [`score: ${s.score}`]
      if (s.userVote === true) badges.push('USER VERIFIED')
      if (s.category) badges.push(s.category)
      if (s.age < 1) badges.push('RECENT')

      lines.push(`Example ${i + 1} (${badges.join(', ')}):`)
      if (s.prompt) lines.push(`User asked: "${s.prompt}"`)
      lines.push('Working code:')
      lines.push('```lua')
      lines.push(truncated)
      lines.push('```')
      lines.push('')
    }
    lines.push('[/PROVEN_EXAMPLES]')
    return lines.join('\n')
  }

  /**
   * Token-efficient anti-patterns — distilled into short rules, NOT full code blocks.
   * Saves ~500 tokens per anti-pattern vs the old approach.
   */
  formatAntiPatterns(failures: MatchedExperience[]): string {
    if (failures.length === 0) return ''

    const lines: string[] = ['', '[AVOID_PATTERNS]']
    lines.push('These approaches FAILED for similar requests:')

    for (const f of failures) {
      const reason = f.userVote === false ? 'User reported broken' : `Score ${f.score}/100`
      // Extract what went wrong — look for common failure indicators
      const issues: string[] = []
      const partCount = countPartsInCode(f.code)
      const interactive = countInteractiveInstances(f.code)
      if (partCount < 10 && f.buildType === 'build') issues.push(`only ${partCount} parts (too few)`)
      if (f.code.includes('SmoothPlastic')) issues.push('used SmoothPlastic')
      if (f.code.length < 500) issues.push('code too short/simple')
      if (!f.code.includes('Color3')) issues.push('no colors set')
      if (!f.code.includes('Anchored') && f.buildType === 'build') issues.push('parts not anchored')
      const neonCount = (f.code.match(/Enum\.Material\.Neon/g) || []).length
      if (neonCount > 3) issues.push(`${neonCount}x Neon material instead of PointLight/SpotLight`)
      if (interactive.lights === 0 && partCount > 10) issues.push('no light sources (add PointLight/SpotLight)')
      if (interactive.interactors === 0 && partCount > 15) issues.push('no interactive elements (add ProximityPrompt/ClickDetector)')

      const prompt = f.prompt ? `"${f.prompt.slice(0, 60)}"` : 'similar prompt'
      lines.push(`- ${prompt}: ${reason}. ${issues.length > 0 ? 'Issues: ' + issues.join(', ') : 'Approach did not work.'}`)
    }

    lines.push('[/AVOID_PATTERNS]')
    return lines.join('\n')
  }

  /**
   * Format aggregate patterns as prompt context — data-driven rules.
   */
  formatAggregatePatterns(patterns: AggregatePattern[]): string {
    if (patterns.length === 0) return ''

    const lines: string[] = ['', '[BUILD_INTELLIGENCE]']
    lines.push('Statistical insights from past builds (data-driven, follow these):')

    for (const p of patterns) {
      const successPct = Math.round(p.successRate * 100)
      lines.push(`- ${p.category} ${p.buildType}s: ${successPct}% success rate across ${p.totalBuilds} builds.`)
      if (p.avgPartCount > 0) lines.push(`  Target ${p.avgPartCount}+ parts (avg of successful builds).`)
      if (p.topMaterials.length > 0) lines.push(`  Best materials: ${p.topMaterials.join(', ')}`)
      if (p.commonFailures.length > 0) {
        lines.push(`  Common failures to avoid: ${p.commonFailures.join('; ')}`)
      }
    }

    lines.push('[/BUILD_INTELLIGENCE]')
    return lines.join('\n')
  }

  getStats() {
    return {
      positiveCount: this.positiveCache.size,
      negativeCount: this.negativeCache.size,
      categories: (() => {
        const cats: Record<string, number> = {}
        for (const e of this.positiveCache.allValues()) {
          const c = e.category || 'uncategorized'
          cats[c] = (cats[c] || 0) + 1
        }
        return cats
      })(),
    }
  }

  // ── Private: DB persistence ───────────────────────────────────────────

  private async persistToDb(
    prompt: string, code: string, score: number, model: string,
    category: string | null, partCount: number | null, buildType: BuildType,
    userVote?: boolean | null, playtestPass?: boolean | null,
  ): Promise<void> {
    try {
      const record = await db.buildFeedback.create({
        data: {
          promptHash: simpleHash(prompt),
          prompt,
          code,
          worked: score >= MIN_SCORE_POSITIVE || userVote === true,
          score,
          model,
          category,
          partCount,
          buildType,
          userVote: userVote ?? null,
          playtestPass: playtestPass ?? null,
        },
      })

      // Embed and store vector (fire-and-forget, don't block on this)
      this.embedAndStore(record.id, prompt).catch(() => {})
    } catch { /* DB may not be available */ }
  }

  private async embedAndStore(recordId: string, prompt: string): Promise<void> {
    try {
      const embedText = await getEmbedText()
      const embedding = await embedText(prompt)
      const vectorStr = `[${embedding.join(',')}]`
      await db.$executeRaw`
        UPDATE "BuildFeedback"
        SET "embedding" = ${vectorStr}::vector
        WHERE "id" = ${recordId}
      `
    } catch {
      // Embedding failed — record still exists without vector, keyword search will find it
    }
  }

  private async loadFromDb(): Promise<void> {
    try {
      const positives = await db.buildFeedback.findMany({
        where: {
          OR: [
            { worked: true, score: { gte: MIN_SCORE_POSITIVE } },
            { userVote: true },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: MAX_CACHE,
      })

      for (const row of positives) {
        this.positiveCache.set(row.promptHash, {
          prompt: row.prompt || '',
          code: row.code,
          score: row.score,
          model: row.model,
          keywords: extractKeywords(row.prompt || ''),
          category: row.category,
          buildType: (row.buildType as BuildType) || 'build',
          partCount: row.partCount,
          userVote: row.userVote,
          playtestPass: row.playtestPass,
          createdAt: row.createdAt,
        })
      }

      const negatives = await db.buildFeedback.findMany({
        where: {
          OR: [
            { worked: false, score: { lte: MAX_SCORE_NEGATIVE } },
            { userVote: false },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      })

      for (const row of negatives) {
        this.negativeCache.set(row.promptHash + '_neg', {
          prompt: row.prompt || '',
          code: row.code,
          score: row.score,
          model: row.model,
          keywords: extractKeywords(row.prompt || ''),
          category: row.category,
          buildType: (row.buildType as BuildType) || 'build',
          partCount: row.partCount,
          userVote: row.userVote,
          playtestPass: row.playtestPass,
          createdAt: row.createdAt,
        })
      }
    } catch { /* DB not available */ }
  }
}

// ---------------------------------------------------------------------------
// Singleton + convenience exports
// ---------------------------------------------------------------------------

export const experienceMemory = new ExperienceMemory()

export async function recordExperience(prompt: string, code: string, score: number, model: string): Promise<void> {
  return experienceMemory.recordOutcome(prompt, code, score, model)
}

export async function recordBuildOutcome(
  prompt: string, code: string, score: number, model: string,
  opts?: { category?: string | null; partCount?: number | null; userVote?: boolean | null; playtestPass?: boolean | null; buildType?: BuildType }
): Promise<void> {
  return experienceMemory.recordOutcome(prompt, code, score, model, opts)
}

export async function findSimilarSuccesses(prompt: string, limit?: number, buildType?: BuildType): Promise<MatchedExperience[]> {
  return experienceMemory.findSimilarSuccesses(prompt, limit, buildType)
}

export async function findAntiPatterns(prompt: string, limit?: number, buildType?: BuildType): Promise<MatchedExperience[]> {
  return experienceMemory.findAntiPatterns(prompt, limit, buildType)
}

export function formatAsExamples(successes: MatchedExperience[]): string {
  return experienceMemory.formatAsExamples(successes)
}

export function formatAntiPatterns(failures: MatchedExperience[]): string {
  return experienceMemory.formatAntiPatterns(failures)
}

export async function getAggregatePatterns(category?: string, buildType?: BuildType): Promise<AggregatePattern[]> {
  return experienceMemory.getAggregatePatterns(category, buildType)
}

export async function getConfidence(prompt: string, buildType?: BuildType): Promise<ConfidenceResult> {
  return experienceMemory.getConfidence(prompt, buildType)
}
