/**
 * Luau output scoring system — evaluates agent-generated code against
 * Roblox best practices, Luau syntax patterns, and completeness heuristics.
 *
 * Design rules:
 *  - Pure functions only: no side effects, no API calls
 *  - All checks are string-pattern based (fast, zero deps)
 *  - Weighted scoring matches registry.ts ScoringRubric weightings
 *  - Used by training.ts recordPracticeResult to auto-score outputs
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LuauScoreResult {
  syntaxScore: number           // 0-100 — valid Luau patterns present
  completeness: number          // 0-100 — does it fulfill the intent?
  performance: number           // 0-100 — efficient, non-blocking code
  robloxBestPractices: number   // 0-100 — modern Roblox API usage
  overall: number               // weighted average
  grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F'
  issues: LuauIssue[]
  bonuses: string[]
  passedChecks: string[]
}

export interface LuauIssue {
  severity: 'error' | 'warning' | 'info'
  code: string      // e.g. "DEPRECATED_WAIT"
  message: string
  penaltyPoints: number
}

// ─── Scoring weights ──────────────────────────────────────────────────────────

const WEIGHTS = {
  syntax: 0.25,
  completeness: 0.30,
  performance: 0.25,
  bestPractices: 0.20,
}

// ─── Check definitions ────────────────────────────────────────────────────────

interface Check {
  code: string
  description: string
  category: 'syntax' | 'completeness' | 'performance' | 'bestPractices'
  severity: LuauIssue['severity']
  penaltyPoints: number
  /** Returns true if the issue is PRESENT (i.e., the code has the problem) */
  detect: (code: string) => boolean
}

interface BonusCheck {
  code: string
  description: string
  bonusPoints: number
  category: 'syntax' | 'completeness' | 'performance' | 'bestPractices'
  detect: (code: string) => boolean
}

const ISSUE_CHECKS: Check[] = [
  // ── Deprecated APIs ────────────────────────────────────────────────────────
  {
    code: 'DEPRECATED_WAIT',
    description: 'Uses deprecated wait() — replace with task.wait()',
    category: 'bestPractices',
    severity: 'error',
    penaltyPoints: 15,
    detect: (c) => /\bwait\s*\(/.test(c) && !/task\.wait\s*\(/.test(c),
  },
  {
    code: 'DEPRECATED_SPAWN',
    description: 'Uses deprecated spawn() — replace with task.spawn()',
    category: 'bestPractices',
    severity: 'error',
    penaltyPoints: 15,
    detect: (c) => /\bspawn\s*\(/.test(c) && !/task\.spawn\s*\(/.test(c),
  },
  {
    code: 'DEPRECATED_DELAY',
    description: 'Uses deprecated delay() — replace with task.delay()',
    category: 'bestPractices',
    severity: 'warning',
    penaltyPoints: 10,
    detect: (c) => /\bdelay\s*\(/.test(c) && !/task\.delay\s*\(/.test(c),
  },
  {
    code: 'DEPRECATED_GAME_WORKSPACE',
    description: 'Uses game.Workspace — use workspace (global) instead',
    category: 'bestPractices',
    severity: 'warning',
    penaltyPoints: 5,
    detect: (c) => /game\.Workspace\b/.test(c),
  },
  {
    code: 'DEPRECATED_BODY_MOVER',
    description: 'Uses BodyVelocity/BodyPosition without a constraint alternative note',
    category: 'bestPractices',
    severity: 'info',
    penaltyPoints: 3,
    detect: (c) => /Instance\.new\("BodyPosition"\)|Instance\.new\("BodyForce"\)/.test(c),
  },

  // ── Security issues ────────────────────────────────────────────────────────
  {
    code: 'CLIENT_TRUST_DAMAGE',
    description: 'Client directly modifies Humanoid.Health — must be server-side',
    category: 'bestPractices',
    severity: 'error',
    penaltyPoints: 25,
    detect: (c) => /LocalPlayer.*Humanoid.*Health\s*=|Humanoid\.Health\s*=/.test(c) && /LocalScript|local script/i.test(c),
  },
  {
    code: 'UNVALIDATED_REMOTE',
    description: 'RemoteEvent handler receives player-supplied damage/currency values without server validation',
    category: 'bestPractices',
    severity: 'error',
    penaltyPoints: 20,
    detect: (c) => /OnServerEvent:Connect\(function\(player,\s*\w*[Dd]amage|OnServerEvent:Connect\(function\(player,\s*\w*[Cc]urrency/.test(c),
  },
  {
    code: 'FIRE_ALL_CLIENTS_SECRET',
    description: 'FireAllClients used to broadcast sensitive player data',
    category: 'bestPractices',
    severity: 'warning',
    penaltyPoints: 8,
    detect: (c) => /FireAllClients\(.*[Pp]assword|FireAllClients\(.*[Tt]oken|FireAllClients\(.*[Kk]ey/.test(c),
  },

  // ── Missing error handling ─────────────────────────────────────────────────
  {
    code: 'DATASTORE_NO_PCALL',
    description: 'DataStore call without pcall — will crash on network errors',
    category: 'bestPractices',
    severity: 'error',
    penaltyPoints: 20,
    detect: (c) => {
      // Check if DataStore methods appear without pcall wrapping nearby
      const hasDataStore = /GetAsync\(|SetAsync\(|UpdateAsync\(|IncrementAsync\(|RemoveAsync\(/.test(c)
      const hasPcall = /pcall\s*\(/.test(c)
      return hasDataStore && !hasPcall
    },
  },
  {
    code: 'MARKETPLACE_NO_PCALL',
    description: 'MarketplaceService call without pcall',
    category: 'bestPractices',
    severity: 'warning',
    penaltyPoints: 12,
    detect: (c) => /MarketplaceService:GetProductInfo\(|MarketplaceService:UserOwnsGamePassAsync\(/.test(c) && !/pcall/.test(c),
  },
  {
    code: 'TELEPORT_NO_PCALL',
    description: 'TeleportService:TeleportAsync without pcall',
    category: 'bestPractices',
    severity: 'warning',
    penaltyPoints: 8,
    detect: (c) => /TeleportAsync\(/.test(c) && !/pcall/.test(c),
  },

  // ── Performance issues ─────────────────────────────────────────────────────
  {
    code: 'INFINITE_LOOP_NO_WAIT',
    description: 'while true do loop without task.wait() — will freeze the server',
    category: 'performance',
    severity: 'error',
    penaltyPoints: 30,
    detect: (c) => {
      // Look for while true do blocks without any wait inside
      const whileBlocks = c.match(/while\s+true\s+do([\s\S]*?)end/g) || []
      return whileBlocks.some((block) => !/task\.wait|wait\(/.test(block))
    },
  },
  {
    code: 'RENDERSTEP_HEAVY_WORK',
    description: 'Heavy computation (loops, pathfinding) inside RenderStepped — use Heartbeat instead',
    category: 'performance',
    severity: 'warning',
    penaltyPoints: 10,
    detect: (c) => /RenderStepped:Connect[\s\S]{0,200}for\s+\w+\s*=|RenderStepped:Connect[\s\S]{0,200}PathfindingService/.test(c),
  },
  {
    code: 'MASS_INSTANCE_NO_POOL',
    description: 'Creating >50 instances in a loop without Debris or pooling',
    category: 'performance',
    severity: 'warning',
    penaltyPoints: 10,
    detect: (c) => {
      const loopInstanceCreations = c.match(/for\s+\w+\s*=\s*\d+\s*,\s*(\d+)[\s\S]{0,400}Instance\.new/g) || []
      return loopInstanceCreations.some((block) => {
        const countMatch = block.match(/for\s+\w+\s*=\s*\d+\s*,\s*(\d+)/)
        const count = countMatch ? parseInt(countMatch[1]) : 0
        const hasDebris = /Debris:AddItem/.test(block)
        return count > 50 && !hasDebris
      })
    },
  },
  {
    code: 'UNANCHORED_STATIC_PART',
    description: 'Static decorative Part created without Anchored = true',
    category: 'performance',
    severity: 'warning',
    penaltyPoints: 8,
    detect: (c) => {
      // Check if Instance.new("Part") blocks are missing Anchored = true nearby
      const partBlocks = c.match(/Instance\.new\("Part"\)[\s\S]{0,300}/g) || []
      return partBlocks.some((block) => !/Anchored\s*=\s*true/.test(block) && !/CanCollide\s*=/.test(block))
    },
  },
  {
    code: 'GETSERVICE_IN_LOOP',
    description: 'game:GetService() called inside a loop — cache the service reference outside',
    category: 'performance',
    severity: 'warning',
    penaltyPoints: 6,
    detect: (c) => /for\s[\s\S]{0,50}game:GetService|while\s[\s\S]{0,50}game:GetService/.test(c),
  },
  {
    code: 'FINDPART_ONRAY_DEPRECATED',
    description: 'Uses FindPartOnRay — deprecated, use workspace:Raycast() instead',
    category: 'bestPractices',
    severity: 'warning',
    penaltyPoints: 8,
    detect: (c) => /FindPartOnRay\b/.test(c),
  },
  {
    code: 'WAIT_IN_RENDERSTEP',
    description: 'task.wait() inside RenderStepped — causes frame skips, use dt parameter instead',
    category: 'performance',
    severity: 'warning',
    penaltyPoints: 8,
    detect: (c) => /RenderStepped:Connect[\s\S]{0,400}task\.wait/.test(c),
  },

  // ── Syntax / structure issues ──────────────────────────────────────────────
  {
    code: 'MISSING_PARENT_ASSIGNMENT',
    description: 'Instance.new() called but .Parent never set — orphaned instance causes memory leak',
    category: 'syntax',
    severity: 'warning',
    penaltyPoints: 10,
    detect: (c) => {
      const newCalls = (c.match(/=\s*Instance\.new\(/g) || []).length
      const parentSets = (c.match(/\.Parent\s*=/g) || []).length
      // Heuristic: if significantly more news than parent sets, flag it
      return newCalls > 3 && parentSets < newCalls * 0.4
    },
  },
  {
    code: 'GLOBAL_VARIABLE_LEAK',
    description: 'Top-level variable assignment without local keyword — pollutes global scope',
    category: 'syntax',
    severity: 'warning',
    penaltyPoints: 8,
    detect: (c) => {
      const lines = c.split('\n')
      return lines.some((line) => {
        const trimmed = line.trim()
        return (
          /^\w+\s*=\s*.+/.test(trimmed) &&
          !trimmed.startsWith('--') &&
          !trimmed.startsWith('local') &&
          !trimmed.startsWith('return') &&
          !trimmed.startsWith('if') &&
          !trimmed.startsWith('for') &&
          !trimmed.startsWith('while') &&
          !trimmed.startsWith('end') &&
          !trimmed.startsWith('else') &&
          !/^\s*\w+\.\w+\s*=/.test(trimmed) &&   // property assignment OK
          !/^\s*\w+\[\w+\]\s*=/.test(trimmed)    // table index OK
        )
      })
    },
  },
  {
    code: 'WAITFORCHILD_IN_SERVER',
    description: 'WaitForChild with no timeout used in a ServerScript — can hang indefinitely',
    category: 'syntax',
    severity: 'info',
    penaltyPoints: 3,
    detect: (c) => /WaitForChild\("[^"]+"\)(?!\s*,\s*\d)/.test(c),
  },

  // ── Completeness checks ────────────────────────────────────────────────────
  {
    code: 'EMPTY_FUNCTION_BODY',
    description: 'Function defined with empty body — likely incomplete implementation',
    category: 'completeness',
    severity: 'warning',
    penaltyPoints: 10,
    detect: (c) => /function\s+\w+\s*\([^)]*\)\s*\n\s*end/.test(c),
  },
  {
    code: 'PLACEHOLDER_ID',
    description: 'Contains placeholder asset ID — replace with real Roblox asset ID before shipping',
    category: 'completeness',
    severity: 'info',
    penaltyPoints: 5,
    detect: (c) => /\[PLACEHOLDER_ID\]|rbxassetid:\/\/0\b|rbxassetid:\/\/1234567\b/.test(c),
  },
  {
    code: 'TODO_COMMENT',
    description: 'TODO comment indicates unfinished implementation',
    category: 'completeness',
    severity: 'info',
    penaltyPoints: 4,
    detect: (c) => /--\s*TODO|--\s*FIXME|--\s*HACK/.test(c),
  },
]

const BONUS_CHECKS: BonusCheck[] = [
  {
    code: 'USES_TASK_SPAWN',
    description: 'Uses task.spawn() for concurrent work',
    bonusPoints: 4,
    category: 'bestPractices',
    detect: (c) => /task\.spawn\s*\(/.test(c),
  },
  {
    code: 'USES_TASK_WAIT',
    description: 'Uses task.wait() instead of deprecated wait()',
    bonusPoints: 5,
    category: 'bestPractices',
    detect: (c) => /task\.wait\s*\(/.test(c),
  },
  {
    code: 'USES_PCALL',
    description: 'Uses pcall for error handling',
    bonusPoints: 6,
    category: 'bestPractices',
    detect: (c) => /\bpcall\s*\(/.test(c),
  },
  {
    code: 'USES_ANCHORED_TRUE',
    description: 'Sets Anchored = true on static parts',
    bonusPoints: 3,
    category: 'performance',
    detect: (c) => /Anchored\s*=\s*true/.test(c),
  },
  {
    code: 'USES_TYPE_ANNOTATIONS',
    description: 'Uses Luau type annotations (: Type)',
    bonusPoints: 5,
    category: 'syntax',
    detect: (c) => /:\s*(string|number|boolean|Player|BasePart|Model|Humanoid|Vector3|CFrame)/.test(c),
  },
  {
    code: 'USES_TABLE_CLONE',
    description: 'Uses table.clone() for safe data copying',
    bonusPoints: 3,
    category: 'bestPractices',
    detect: (c) => /table\.clone\s*\(/.test(c),
  },
  {
    code: 'USES_GETSERVICE',
    description: 'Uses game:GetService() rather than direct game.ServiceName access',
    bonusPoints: 3,
    category: 'bestPractices',
    detect: (c) => /game:GetService\s*\(/.test(c),
  },
  {
    code: 'USES_WORKSPACE_RAYCAST',
    description: 'Uses modern workspace:Raycast() instead of FindPartOnRay',
    bonusPoints: 5,
    category: 'bestPractices',
    detect: (c) => /workspace:Raycast\s*\(/.test(c),
  },
  {
    code: 'USES_DEBRIS_ADDITEM',
    description: 'Uses Debris:AddItem for automatic instance cleanup',
    bonusPoints: 4,
    category: 'performance',
    detect: (c) => /Debris:AddItem\s*\(/.test(c),
  },
  {
    code: 'USES_OVERLAP_PARAMS',
    description: 'Uses OverlapParams for hitbox filtering',
    bonusPoints: 5,
    category: 'bestPractices',
    detect: (c) => /OverlapParams\.new\s*\(/.test(c),
  },
  {
    code: 'USES_GETPARTSBOUNDINBOX',
    description: 'Uses modern GetPartBoundsInBox for hitbox detection',
    bonusPoints: 5,
    category: 'bestPractices',
    detect: (c) => /GetPartBoundsInBox\s*\(|GetPartBoundsInRadius\s*\(/.test(c),
  },
  {
    code: 'USES_TWEEN_SERVICE',
    description: 'Uses TweenService for smooth animations',
    bonusPoints: 3,
    category: 'completeness',
    detect: (c) => /TweenService/.test(c),
  },
  {
    code: 'HAS_CLEANUP_DISCONNECT',
    description: 'Cleans up event connections with :Disconnect()',
    bonusPoints: 4,
    category: 'performance',
    detect: (c) => /:Disconnect\s*\(/.test(c),
  },
  {
    code: 'USES_ASSERT',
    description: 'Uses assert() for input validation',
    bonusPoints: 3,
    category: 'bestPractices',
    detect: (c) => /\bassert\s*\(/.test(c),
  },
  {
    code: 'HAS_MODULE_RETURN',
    description: 'ModuleScript has a return statement with exported functions',
    bonusPoints: 4,
    category: 'completeness',
    detect: (c) => /^return\s*\{/m.test(c),
  },
]

// ─── Core scoring function ────────────────────────────────────────────────────

/**
 * Scores a Luau code string against Roblox best practices and intent.
 *
 * @param code   - The Luau source code to score
 * @param intent - A short description of what the code should do (e.g. "datastore save/load")
 *                 Used for completeness heuristics.
 */
export function scoreLuauOutput(
  code: string,
  intent: string
): LuauScoreResult {
  if (!code || code.trim().length === 0) {
    return {
      syntaxScore: 0,
      completeness: 0,
      performance: 0,
      robloxBestPractices: 0,
      overall: 0,
      grade: 'F',
      issues: [{ severity: 'error', code: 'EMPTY_OUTPUT', message: 'No code provided', penaltyPoints: 100 }],
      bonuses: [],
      passedChecks: [],
    }
  }

  const issues: LuauIssue[] = []
  const bonuses: string[] = []
  const passedChecks: string[] = []

  // ── Apply issue checks ──────────────────────────────────────────────────
  for (const check of ISSUE_CHECKS) {
    if (check.detect(code)) {
      issues.push({
        severity: check.severity,
        code: check.code,
        message: check.description,
        penaltyPoints: check.penaltyPoints,
      })
    } else {
      passedChecks.push(check.code)
    }
  }

  // ── Apply bonus checks ──────────────────────────────────────────────────
  for (const bonus of BONUS_CHECKS) {
    if (bonus.detect(code)) {
      bonuses.push(bonus.description)
    }
  }

  // ── Category penalty totals ─────────────────────────────────────────────
  const penaltiesByCategory: Record<string, number> = {
    syntax: 0,
    completeness: 0,
    performance: 0,
    bestPractices: 0,
  }
  const bonusesByCategory: Record<string, number> = {
    syntax: 0,
    completeness: 0,
    performance: 0,
    bestPractices: 0,
  }

  for (const issue of issues) {
    penaltiesByCategory[issue.code in CATEGORY_MAP ? CATEGORY_MAP[issue.code] : 'bestPractices'] += issue.penaltyPoints
  }
  for (const bonus of BONUS_CHECKS) {
    if (bonus.detect(code)) {
      bonusesByCategory[bonus.category] += bonus.bonusPoints
    }
  }

  // ── Completeness: check intent keywords ────────────────────────────────
  const intentKeywords = intent.toLowerCase().split(/\s+/)
  let intentMatches = 0
  for (const kw of intentKeywords) {
    if (kw.length > 3 && code.toLowerCase().includes(kw)) intentMatches++
  }
  const intentCompleteness = intentKeywords.length > 0
    ? Math.min(100, (intentMatches / intentKeywords.length) * 100 + 20)
    : 80

  // ── Code length completeness ───────────────────────────────────────────
  const lineCount = code.split('\n').filter((l) => l.trim().length > 0).length
  const lengthScore = Math.min(100, lineCount * 2.5)  // 40 lines = 100

  const completenessBase = (intentCompleteness * 0.5 + lengthScore * 0.5)

  // ── Compute final category scores ──────────────────────────────────────
  const clamp = (v: number) => Math.max(0, Math.min(100, v))

  const syntaxScore = clamp(
    100 - penaltiesByCategory.syntax + bonusesByCategory.syntax
  )
  const completeness = clamp(
    completenessBase - penaltiesByCategory.completeness + bonusesByCategory.completeness
  )
  const performance = clamp(
    100 - penaltiesByCategory.performance + bonusesByCategory.performance
  )
  const robloxBestPractices = clamp(
    100 - penaltiesByCategory.bestPractices + bonusesByCategory.bestPractices
  )

  const overall = clamp(
    syntaxScore * WEIGHTS.syntax +
    completeness * WEIGHTS.completeness +
    performance * WEIGHTS.performance +
    robloxBestPractices * WEIGHTS.bestPractices
  )

  return {
    syntaxScore: Math.round(syntaxScore),
    completeness: Math.round(completeness),
    performance: Math.round(performance),
    robloxBestPractices: Math.round(robloxBestPractices),
    overall: Math.round(overall),
    grade: scoreToGrade(overall),
    issues,
    bonuses,
    passedChecks,
  }
}

// ─── Category map for issue codes ────────────────────────────────────────────

const CATEGORY_MAP: Record<string, string> = Object.fromEntries(
  ISSUE_CHECKS.map((c) => [c.code, c.category])
)

// ─── Grade helper ─────────────────────────────────────────────────────────────

function scoreToGrade(score: number): LuauScoreResult['grade'] {
  if (score >= 95) return 'S'
  if (score >= 85) return 'A'
  if (score >= 75) return 'B'
  if (score >= 60) return 'C'
  if (score >= 45) return 'D'
  return 'F'
}

// ─── Batch scoring ────────────────────────────────────────────────────────────

/**
 * Scores multiple outputs and returns them sorted by overall score descending.
 */
export function batchScore(
  outputs: Array<{ code: string; intent: string; label?: string }>
): Array<LuauScoreResult & { label: string }> {
  return outputs
    .map((o, i) => ({
      ...scoreLuauOutput(o.code, o.intent),
      label: o.label ?? `output_${i}`,
    }))
    .sort((a, b) => b.overall - a.overall)
}

// ─── Rubric-aware scoring ─────────────────────────────────────────────────────

/**
 * Scores output against a specific PracticeScenario rubric from training.ts.
 * Adds rubric-specific bonuses/penalties on top of the base scoreLuauOutput.
 */
export function scoreAgainstRubric(
  code: string,
  intent: string,
  rubric: {
    mustContain: string[]
    mustNotContain: string[]
    bonusPatterns: string[]
    weightings: { syntax: number; completeness: number; performance: number; bestPractices: number }
  }
): LuauScoreResult {
  const base = scoreLuauOutput(code, intent)

  let rubricPenalty = 0
  let rubricBonus = 0
  const extraIssues: LuauIssue[] = []
  const extraBonuses: string[] = []

  // mustContain checks
  for (const pattern of rubric.mustContain) {
    if (!code.includes(pattern)) {
      rubricPenalty += 8
      extraIssues.push({
        severity: 'warning',
        code: 'MISSING_REQUIRED_PATTERN',
        message: `Required pattern missing: "${pattern}"`,
        penaltyPoints: 8,
      })
    }
  }

  // mustNotContain checks
  for (const pattern of rubric.mustNotContain) {
    if (code.includes(pattern)) {
      rubricPenalty += 12
      extraIssues.push({
        severity: 'error',
        code: 'FORBIDDEN_PATTERN',
        message: `Forbidden pattern found: "${pattern}"`,
        penaltyPoints: 12,
      })
    }
  }

  // bonus patterns
  for (const pattern of rubric.bonusPatterns) {
    if (code.includes(pattern)) {
      rubricBonus += 5
      extraBonuses.push(`Bonus pattern found: "${pattern}"`)
    }
  }

  // Apply rubric weightings to re-compute overall
  const clamp = (v: number) => Math.max(0, Math.min(100, v))
  const adjustedOverall = clamp(
    base.syntaxScore * rubric.weightings.syntax +
    base.completeness * rubric.weightings.completeness +
    base.performance * rubric.weightings.performance +
    base.robloxBestPractices * rubric.weightings.bestPractices +
    rubricBonus - rubricPenalty
  )

  return {
    ...base,
    overall: Math.round(adjustedOverall),
    grade: scoreToGrade(adjustedOverall),
    issues: [...base.issues, ...extraIssues],
    bonuses: [...base.bonuses, ...extraBonuses],
  }
}

// ─── Quick score helpers ──────────────────────────────────────────────────────

/** Returns true if the code passes a minimum quality threshold. */
export function passesQualityGate(code: string, intent: string, minScore = 70): boolean {
  return scoreLuauOutput(code, intent).overall >= minScore
}

/** Returns a short human-readable summary of the most critical issues. */
export function getTopIssues(result: LuauScoreResult, maxCount = 3): string[] {
  return result.issues
    .filter((i) => i.severity === 'error')
    .slice(0, maxCount)
    .map((i) => i.message)
}

/** Returns the score delta between two outputs — positive means `b` improved. */
export function scoreDelta(a: LuauScoreResult, b: LuauScoreResult): number {
  return b.overall - a.overall
}
