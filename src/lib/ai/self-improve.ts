/**
 * AI Self-Improvement Engine
 *
 * Analyzes build history to extract hard rules, generate new templates,
 * and continuously improve the AI's output quality.
 *
 * Runs after every build AND on a cron schedule.
 * The AI literally teaches itself to be better.
 */

import 'server-only'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

// ─── Learned Rules ──────────────────────────────────────────────────────────
// Hard rules extracted from failure patterns. Injected into EVERY prompt.

interface LearnedRule {
  rule: string
  confidence: number    // 0-100 — how sure we are this rule matters
  source: 'failure-pattern' | 'user-feedback' | 'verification' | 'manual'
  occurrences: number   // how many times the violation was seen
  category?: string     // only applies to this category, or null = global
  createdAt: Date
}

// In-memory rule cache (loaded from DB on first use)
let rulesCache: LearnedRule[] = []
let rulesCacheTime = 0
const RULES_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Get all learned rules, formatted for prompt injection.
 * Returns a string block that goes into the system prompt.
 */
export async function getLearnedRules(category?: string): Promise<string> {
  await loadRulesIfStale()

  const applicable = rulesCache.filter(r =>
    r.confidence >= 60 &&
    (!r.category || r.category === category || !category)
  )

  if (applicable.length === 0) return ''

  // Sort by confidence descending, take top 15
  const top = applicable
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 15)

  const lines = top.map(r => `- ${r.rule}`)
  return `\n\n=== LEARNED RULES (from ${rulesCache.length} past builds — FOLLOW THESE) ===
${lines.join('\n')}
=== END LEARNED RULES ===`
}

/**
 * Analyze a failed build and extract new rules.
 * Called fire-and-forget after every build with score < 60.
 */
export async function learnFromFailure(
  prompt: string,
  code: string,
  score: number,
  errors: string[],
  category: string | null,
): Promise<void> {
  try {
    for (const error of errors.slice(0, 5)) {
      const rule = errorToRule(error)
      if (!rule) continue

      // Check if this rule already exists
      const existing = rulesCache.find(r => r.rule === rule)
      if (existing) {
        existing.occurrences++
        existing.confidence = Math.min(100, existing.confidence + 5)
        // Persist update
        await persistRule(existing)
      } else {
        const newRule: LearnedRule = {
          rule,
          confidence: Math.min(90, 40 + errors.length * 10),
          source: 'failure-pattern',
          occurrences: 1,
          category: category || undefined,
          createdAt: new Date(),
        }
        rulesCache.push(newRule)
        await persistRule(newRule)
      }
    }

    // Code-level pattern extraction
    const codeRules = extractCodePatternRules(code, score)
    for (const rule of codeRules) {
      if (!rulesCache.find(r => r.rule === rule)) {
        const newRule: LearnedRule = {
          rule,
          confidence: 50,
          source: 'verification',
          occurrences: 1,
          category: category || undefined,
          createdAt: new Date(),
        }
        rulesCache.push(newRule)
        await persistRule(newRule)
      }
    }
  } catch (err) {
    console.warn('[SelfImprove] learnFromFailure error:', err instanceof Error ? err.message : err)
  }
}

/**
 * Learn from user feedback (thumbs up/down).
 * Strengthens or weakens existing rules based on user signal.
 */
export async function learnFromFeedback(
  prompt: string,
  code: string,
  positive: boolean,
  category: string | null,
): Promise<void> {
  try {
    if (positive) {
      // Extract what made this build good — reinforce patterns
      const goodPatterns = extractGoodPatterns(code)
      for (const pattern of goodPatterns) {
        const existing = rulesCache.find(r => r.rule === pattern)
        if (existing) {
          existing.confidence = Math.min(100, existing.confidence + 10)
          existing.occurrences++
          await persistRule(existing)
        } else {
          const newRule: LearnedRule = {
            rule: pattern,
            confidence: 70,
            source: 'user-feedback',
            occurrences: 1,
            category: category || undefined,
            createdAt: new Date(),
          }
          rulesCache.push(newRule)
          await persistRule(newRule)
        }
      }
    } else {
      // User said it's bad — extract what went wrong
      const badPatterns = extractBadPatterns(code)
      for (const pattern of badPatterns) {
        const existing = rulesCache.find(r => r.rule === pattern)
        if (existing) {
          existing.confidence = Math.min(100, existing.confidence + 15)
          existing.occurrences++
          await persistRule(existing)
        }
      }
    }
  } catch (err) {
    console.warn('[SelfImprove] learnFromFeedback error:', err instanceof Error ? err.message : err)
  }
}

/**
 * Self-improvement analysis — run periodically to discover patterns.
 * Analyzes the last N builds and generates new rules from aggregate data.
 */
export async function runSelfImprovement(): Promise<{ rulesAdded: number; rulesStrengthened: number }> {
  let added = 0
  let strengthened = 0

  try {
    // Get recent builds from DB
    const recentBuilds = await db.buildFeedback.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        prompt: true,
        code: true,
        score: true,
        worked: true,
        category: true,
        partCount: true,
        userVote: true,
        model: true,
        buildType: true,
        errorMessage: true,
      },
    })

    if (recentBuilds.length < 5) return { rulesAdded: 0, rulesStrengthened: 0 }

    // Analyze failure patterns
    const failures = recentBuilds.filter(b => b.score < 50 || b.userVote === false)
    const successes = recentBuilds.filter(b => b.score >= 75 || b.userVote === true)

    // Material analysis — what materials appear in failures vs successes?
    const failMaterials = new Map<string, number>()
    const successMaterials = new Map<string, number>()
    for (const b of failures) {
      const mats = (b.code.match(/Enum\.Material\.(\w+)/g) || []).map(m => m.replace('Enum.Material.', ''))
      for (const m of mats) failMaterials.set(m, (failMaterials.get(m) || 0) + 1)
    }
    for (const b of successes) {
      const mats = (b.code.match(/Enum\.Material\.(\w+)/g) || []).map(m => m.replace('Enum.Material.', ''))
      for (const m of mats) successMaterials.set(m, (successMaterials.get(m) || 0) + 1)
    }

    // Materials that appear mostly in failures = bad
    for (const [mat, failCount] of failMaterials) {
      const successCount = successMaterials.get(mat) || 0
      if (failCount >= 3 && failCount > successCount * 2) {
        const rule = `AVOID Enum.Material.${mat} — it appears in ${failCount} failed builds vs ${successCount} successes`
        if (!rulesCache.find(r => r.rule === rule)) {
          rulesCache.push({ rule, confidence: 70, source: 'failure-pattern', occurrences: failCount, createdAt: new Date() })
          added++
        }
      }
    }

    // Part count analysis — what's the sweet spot?
    const successParts = successes.filter(b => b.partCount).map(b => b.partCount!)
    if (successParts.length >= 5) {
      const avg = successParts.reduce((a, b) => a + b, 0) / successParts.length
      const rule = `High-scoring builds average ${Math.round(avg)} parts. Aim for at least ${Math.round(avg * 0.7)} parts for quality builds.`
      const existing = rulesCache.find(r => r.rule.includes('High-scoring builds average'))
      if (existing) {
        existing.rule = rule
        existing.confidence = Math.min(100, existing.confidence + 5)
        strengthened++
      } else {
        rulesCache.push({ rule, confidence: 75, source: 'verification', occurrences: successParts.length, createdAt: new Date() })
        added++
      }
    }

    // Model performance analysis — which models produce best results?
    const modelScores = new Map<string, number[]>()
    for (const b of recentBuilds) {
      if (!modelScores.has(b.model)) modelScores.set(b.model, [])
      modelScores.get(b.model)!.push(b.score)
    }
    for (const [model, scores] of modelScores) {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length
      if (scores.length >= 5 && avg < 45) {
        const rule = `Model "${model}" averages ${Math.round(avg)}/100 — consider deprioritizing for complex builds`
        if (!rulesCache.find(r => r.rule.includes(model))) {
          rulesCache.push({ rule, confidence: 65, source: 'failure-pattern', occurrences: scores.length, createdAt: new Date() })
          added++
        }
      }
    }

    // Script vs build analysis
    const scriptBuilds = recentBuilds.filter(b => b.buildType === 'script')
    const regularBuilds = recentBuilds.filter(b => b.buildType === 'build')
    if (scriptBuilds.length >= 3) {
      const scriptAvg = scriptBuilds.reduce((a, b) => a + b.score, 0) / scriptBuilds.length
      const buildAvg = regularBuilds.length > 0 ? regularBuilds.reduce((a, b) => a + b.score, 0) / regularBuilds.length : 0
      if (scriptAvg < buildAvg - 15) {
        const rule = `Script generation (avg ${Math.round(scriptAvg)}/100) scores lower than builds (avg ${Math.round(buildAvg)}/100) — script prompts need more examples and stricter validation`
        const existing = rulesCache.find(r => r.rule.includes('Script generation'))
        if (existing) {
          existing.rule = rule
          strengthened++
        } else {
          rulesCache.push({ rule, confidence: 70, source: 'verification', occurrences: scriptBuilds.length, createdAt: new Date() })
          added++
        }
      }
    }

    console.log(`[SelfImprove] Analysis complete: ${added} rules added, ${strengthened} strengthened, ${rulesCache.length} total rules`)
  } catch (err) {
    console.warn('[SelfImprove] runSelfImprovement error:', err instanceof Error ? err.message : err)
  }

  return { rulesAdded: added, rulesStrengthened: strengthened }
}

// ─── Rule Persistence ──────────────────────────────────────────────────────

async function persistRule(rule: LearnedRule): Promise<void> {
  try {
    // Store in BuildFeedback as a special "rule" entry
    // Using promptHash as the rule identifier
    const ruleHash = simpleHash(rule.rule)
    await db.$executeRaw(Prisma.sql`
      INSERT INTO "BuildFeedback" (id, "promptHash", prompt, code, worked, score, model, category, "buildType", "createdAt")
      VALUES (${`rule_${ruleHash}`}, ${ruleHash}, ${rule.rule}, ${'LEARNED_RULE'}, ${rule.confidence >= 70}, ${rule.confidence}, ${'self-improve'}, ${rule.category || 'global'}, ${'rule'}, NOW())
      ON CONFLICT (id) DO UPDATE SET score = ${rule.confidence}, prompt = ${rule.rule}
    `)
  } catch {
    // Non-blocking — rules are also in memory cache
  }
}

async function loadRulesIfStale(): Promise<void> {
  if (Date.now() - rulesCacheTime < RULES_CACHE_TTL && rulesCache.length > 0) return
  try {
    const rows = await db.buildFeedback.findMany({
      where: { buildType: 'rule', model: 'self-improve' },
      orderBy: { score: 'desc' },
      take: 50,
      select: { prompt: true, score: true, category: true, createdAt: true },
    })
    rulesCache = rows.map(r => ({
      rule: r.prompt || '',
      confidence: r.score,
      source: 'failure-pattern' as const,
      occurrences: 1,
      category: r.category || undefined,
      createdAt: r.createdAt,
    }))
    rulesCacheTime = Date.now()
    console.log(`[SelfImprove] Loaded ${rulesCache.length} learned rules from DB`)
  } catch {
    rulesCacheTime = Date.now() // Don't retry immediately on failure
  }
}

// ─── Pattern Extraction Helpers ────────────────────────────────────────────

function errorToRule(error: string): string | null {
  const lower = error.toLowerCase()
  if (lower.includes('smoothplastic')) return 'NEVER use Enum.Material.SmoothPlastic — use Concrete, Brick, Wood, or Metal instead'
  if (lower.includes('brickcolor')) return 'NEVER use BrickColor.new() — use Color3.fromRGB() instead'
  if (lower.includes('wait()')) return 'NEVER use wait() — use task.wait() instead'
  if (lower.includes('spawn()')) return 'NEVER use spawn() — use task.spawn() instead'
  if (lower.includes('setprimarypartcframe')) return 'NEVER use SetPrimaryPartCFrame — use PivotTo() instead'
  if (lower.includes('instance.new') && lower.includes('parent')) return 'Set Instance.new() parent AFTER setting all properties, not as second argument'
  if (lower.includes('part count') && lower.includes('low')) return 'Minimum 30 parts for any building. Props need 10+, buildings need 60+, complex scenes need 150+'
  if (lower.includes('unanchored')) return 'ALWAYS set Anchored = true on placed Parts'
  if (lower.includes('hallucinated')) return 'Only use real Roblox Instance classes — never invent new ones'
  if (lower.includes('screengui') && lower.includes('part')) return 'For UI requests, create ScreenGui + Frame hierarchy, NOT Parts with SurfaceGui'
  if (lower.includes('no lighting')) return 'Every indoor space needs at least 1 PointLight with warm color'
  if (lower.includes('no changehistory')) return 'ALWAYS wrap builds in ChangeHistoryService recording for undo support'
  if (lower.includes('color variety') || lower.includes('few colors')) return 'Use at least 4 different colors in a build — monochrome builds score poorly'
  return null
}

function extractCodePatternRules(code: string, score: number): string[] {
  const rules: string[] = []
  if (score >= 70) return rules // Only extract from bad code

  // Check for common problems
  const partCount = (code.match(/Instance\.new\s*\(\s*["']Part["']\s*\)/g) || []).length
  const hasLighting = code.includes('PointLight') || code.includes('SpotLight')
  const hasCH = code.includes('ChangeHistoryService')
  const colorCount = new Set(code.match(/Color3\.fromRGB\s*\(\s*\d+/g) || []).size
  const hasAnchor = code.includes('Anchored = true') || code.includes('.Anchored = true')

  if (partCount > 0 && partCount < 15 && !code.includes('ScreenGui'))
    rules.push(`Build had only ${partCount} parts — minimum 30 for buildings, 10 for props`)
  if (!hasLighting && partCount > 10)
    rules.push('Build had no lighting — always add PointLight to interior spaces')
  if (!hasCH)
    rules.push('Build missing ChangeHistoryService — always wrap in recording for undo')
  if (colorCount < 3 && partCount > 5)
    rules.push(`Build used only ${colorCount} colors — use 4+ for visual variety`)
  if (!hasAnchor && partCount > 0)
    rules.push('Parts not explicitly anchored — always set Anchored = true')

  return rules
}

function extractGoodPatterns(code: string): string[] {
  const patterns: string[] = []
  if (code.includes('ChangeHistoryService')) patterns.push('Always use ChangeHistoryService — user-approved builds use it')
  if (code.includes('PointLight') && code.includes('SpotLight')) patterns.push('Use both PointLight and SpotLight for rich lighting')
  if ((code.match(/Enum\.Material\.\w+/g) || []).length >= 4) patterns.push('Use 4+ different materials for visual variety')
  if (code.includes('UICorner') && code.includes('UIStroke')) patterns.push('Use UICorner + UIStroke on all GUI elements for polished look')
  if (code.includes('TweenService') && code.includes('ScreenGui')) patterns.push('Animate all GUI transitions with TweenService')
  return patterns
}

function extractBadPatterns(code: string): string[] {
  const patterns: string[] = []
  if (code.includes('SmoothPlastic')) patterns.push('NEVER use SmoothPlastic — user rejected a build using it')
  if (code.includes('BrickColor')) patterns.push('NEVER use BrickColor — user rejected a build using it')
  if (!code.includes('ScreenGui') && code.includes('shop') || code.includes('ui') || code.includes('menu'))
    patterns.push('For UI/shop/menu requests, MUST use ScreenGui not Parts')
  return patterns
}

function simpleHash(s: string): string {
  let hash = 0
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0
  }
  return Math.abs(hash).toString(36)
}
