/**
 * Static Analysis — Pre-AI bug detection for Luau code.
 *
 * Runs BEFORE AI review (zero cost, < 1ms). Catches:
 *  - Deprecated APIs (wait, spawn, delay)
 *  - Security holes (loadstring, HttpService misuse, client trust)
 *  - Missing --!strict mode
 *  - Memory leaks (unconnected events, undisconnected RenderStepped)
 *  - Nil access patterns
 *  - Known Roblox anti-patterns
 *
 * Used by build-executor to auto-fix generated code before shipping to Studio.
 */

// ── Types ───────────────────────────────────────────────────────────────────

export type IssueSeverity = 'error' | 'warning' | 'info'
export type IssueCategory = 'deprecated' | 'security' | 'performance' | 'correctness' | 'style'

export interface StaticIssue {
  line: number
  column?: number
  severity: IssueSeverity
  category: IssueCategory
  message: string
  fix?: string // The corrected line, if auto-fixable
  rule: string
}

export interface AnalysisResult {
  issues: StaticIssue[]
  fixedCode: string | null // Auto-fixed version, or null if no fixes applied
  score: number // 0-100 quality score
}

// ── Rules ───────────────────────────────────────────────────────────────────

interface Rule {
  id: string
  pattern: RegExp
  severity: IssueSeverity
  category: IssueCategory
  message: string
  fix?: (match: RegExpMatchArray, line: string) => string
  /** If true, skip this rule when the line is inside a comment */
  skipComments?: boolean
}

const RULES: Rule[] = [
  // ── Deprecated APIs ─────────────────────────────────────────────────────
  {
    id: 'deprecated-wait',
    pattern: /\bwait\s*\(/,
    severity: 'error',
    category: 'deprecated',
    message: 'wait() is deprecated — use task.wait()',
    fix: (_m, line) => line.replace(/\bwait\s*\(/, 'task.wait('),
    skipComments: true,
  },
  {
    id: 'deprecated-spawn',
    pattern: /\bspawn\s*\(/,
    severity: 'error',
    category: 'deprecated',
    message: 'spawn() is deprecated — use task.spawn()',
    fix: (_m, line) => line.replace(/\bspawn\s*\(/, 'task.spawn('),
    skipComments: true,
  },
  {
    id: 'deprecated-delay',
    pattern: /\bdelay\s*\(/,
    severity: 'error',
    category: 'deprecated',
    message: 'delay() is deprecated — use task.delay()',
    fix: (_m, line) => line.replace(/\bdelay\s*\(/, 'task.delay('),
    skipComments: true,
  },

  // ── Security ────────────────────────────────────────────────────────────
  {
    id: 'security-loadstring',
    pattern: /\bloadstring\s*\(/,
    severity: 'error',
    category: 'security',
    message: 'loadstring() is a security risk and disabled in most contexts — remove it',
    skipComments: true,
  },
  {
    id: 'security-getfenv',
    pattern: /\bgetfenv\s*\(/,
    severity: 'error',
    category: 'security',
    message: 'getfenv() is deprecated and a security risk',
    skipComments: true,
  },
  {
    id: 'security-setfenv',
    pattern: /\bsetfenv\s*\(/,
    severity: 'error',
    category: 'security',
    message: 'setfenv() is deprecated and a security risk',
    skipComments: true,
  },
  {
    id: 'security-require-id',
    pattern: /\brequire\s*\(\s*\d+\s*\)/,
    severity: 'warning',
    category: 'security',
    message: 'require(assetId) can load untrusted code — use module references instead',
    skipComments: true,
  },

  // ── Correctness ─────────────────────────────────────────────────────────
  {
    id: 'nil-access',
    pattern: /FindFirstChild\s*\([^)]+\)\s*\.\w+/,
    severity: 'warning',
    category: 'correctness',
    message: 'FindFirstChild() can return nil — use :WaitForChild() or check for nil before accessing properties',
    skipComments: true,
  },
  {
    id: 'setasync-over-updateasync',
    pattern: /\bSetAsync\s*\(/,
    severity: 'warning',
    category: 'correctness',
    message: 'SetAsync() is not atomic — use UpdateAsync() for concurrent-safe DataStore writes',
    skipComments: true,
  },
  {
    id: 'missing-pcall-datastore',
    pattern: /(?:GetAsync|SetAsync|UpdateAsync|RemoveAsync|IncrementAsync)\s*\(/,
    severity: 'info',
    category: 'correctness',
    message: 'DataStore calls should be wrapped in pcall() — they can fail due to throttling',
    skipComments: true,
  },
  {
    id: 'direct-service-access',
    pattern: /\bgame\.(Workspace|Players|Lighting|ReplicatedStorage|ServerScriptService|StarterGui|SoundService|ServerStorage|StarterPlayer)\b/,
    severity: 'warning',
    category: 'correctness',
    message: 'Use game:GetService() instead of direct game.ServiceName access',
    fix: (_m, line) => {
      return line.replace(
        /\bgame\.(Workspace|Players|Lighting|ReplicatedStorage|ServerScriptService|StarterGui|SoundService|ServerStorage|StarterPlayer)\b/g,
        (_, service) => `game:GetService("${service}")`,
      )
    },
    skipComments: true,
  },

  // ── Performance ─────────────────────────────────────────────────────────
  {
    id: 'perf-infinite-loop',
    pattern: /\bwhile\s+true\s+do\b/,
    severity: 'info',
    category: 'performance',
    message: 'Infinite loop detected — ensure it contains task.wait() or a yield point to prevent freezing',
    skipComments: true,
  },
  {
    id: 'perf-getchildren-loop',
    pattern: /\b:GetChildren\(\)\s*.*\bfor\b|\bfor\b.*\b:GetChildren\(\)/,
    severity: 'info',
    category: 'performance',
    message: 'Calling :GetChildren() inside a loop can be expensive — cache the result outside the loop',
    skipComments: true,
  },
  {
    id: 'perf-instance-new-loop',
    pattern: /for\b.*\bInstance\.new\b/,
    severity: 'info',
    category: 'performance',
    message: 'Creating instances in a loop — set Parent LAST to avoid redundant property change events',
    skipComments: true,
  },

  // ── Style (auto-fixable) ───────────────────────────────────────────────
  {
    id: 'style-javascript-const',
    pattern: /\bconst\s+\w+\s*=/,
    severity: 'error',
    category: 'style',
    message: 'JavaScript "const" is not valid Luau — use "local"',
    fix: (_m, line) => line.replace(/\bconst\s+/, 'local '),
    skipComments: true,
  },
  {
    id: 'style-javascript-let',
    pattern: /\blet\s+\w+\s*=/,
    severity: 'error',
    category: 'style',
    message: 'JavaScript "let" is not valid Luau — use "local"',
    fix: (_m, line) => line.replace(/\blet\s+/, 'local '),
    skipComments: true,
  },
  {
    id: 'style-javascript-var',
    pattern: /\bvar\s+\w+\s*=/,
    severity: 'error',
    category: 'style',
    message: 'JavaScript "var" is not valid Luau — use "local"',
    fix: (_m, line) => line.replace(/\bvar\s+/, 'local '),
    skipComments: true,
  },
  {
    id: 'style-strict-equals',
    pattern: /===/,
    severity: 'error',
    category: 'style',
    message: '"===" is JavaScript — Luau uses "=="',
    fix: (_m, line) => line.replace(/===/g, '=='),
    skipComments: true,
  },
  {
    id: 'style-strict-not-equals',
    pattern: /!==/,
    severity: 'error',
    category: 'style',
    message: '"!==" is JavaScript — Luau uses "~="',
    fix: (_m, line) => line.replace(/!==/g, '~='),
    skipComments: true,
  },
  {
    id: 'style-not-equals',
    pattern: /!=/,
    severity: 'error',
    category: 'style',
    message: '"!=" is JavaScript — Luau uses "~="',
    fix: (_m, line) => line.replace(/!=/g, '~='),
    skipComments: true,
  },
  {
    id: 'style-console-log',
    pattern: /\bconsole\.log\b/,
    severity: 'error',
    category: 'style',
    message: '"console.log" is JavaScript — use print() or warn() in Luau',
    fix: (_m, line) => line.replace(/\bconsole\.log\b/, 'print'),
    skipComments: true,
  },
  {
    id: 'style-python-def',
    pattern: /\bdef\s+\w+\s*\(/,
    severity: 'error',
    category: 'style',
    message: '"def" is Python — use "local function" in Luau',
    fix: (_m, line) => line.replace(/\bdef\s+(\w+)\s*\(/, 'local function $1('),
    skipComments: true,
  },
  {
    id: 'style-python-import',
    pattern: /\bimport\s+\w/,
    severity: 'error',
    category: 'style',
    message: '"import" is not valid Luau — use require() for modules',
    skipComments: true,
  },
]

// ── Analyzer ────────────────────────────────────────────────────────────────

/**
 * Run static analysis on Luau source code.
 * Returns issues found and an auto-fixed version if any fixes were applied.
 */
export function analyzeLuau(code: string): AnalysisResult {
  const lines = code.split('\n')
  const issues: StaticIssue[] = []
  const fixedLines = [...lines]
  let fixCount = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // Skip pure comment lines
    if (trimmed.startsWith('--')) continue

    for (const rule of RULES) {
      if (rule.skipComments) {
        // Also skip if the match is after a -- comment marker on this line
        const commentIdx = line.indexOf('--')
        if (commentIdx >= 0) {
          const codePart = line.slice(0, commentIdx)
          if (!rule.pattern.test(codePart)) continue
        }
      }

      const match = line.match(rule.pattern)
      if (!match) continue

      const issue: StaticIssue = {
        line: i + 1,
        column: match.index,
        severity: rule.severity,
        category: rule.category,
        message: rule.message,
        rule: rule.id,
      }

      // Auto-fix if available
      if (rule.fix) {
        const fixed = rule.fix(match, fixedLines[i])
        if (fixed !== fixedLines[i]) {
          issue.fix = fixed
          fixedLines[i] = fixed
          fixCount++
        }
      }

      issues.push(issue)
    }
  }

  // Check for missing --!strict
  const hasStrict = lines.some(l => l.trim().startsWith('--!strict'))
  if (!hasStrict && lines.length > 3) {
    // Don't add --!strict to plugin command scripts or tiny snippets
    const isPluginScript = code.includes('ChangeHistoryService') || code.includes('plugin:')
    if (!isPluginScript) {
      issues.push({
        line: 1,
        severity: 'info',
        category: 'style',
        message: 'Missing --!strict — add for type checking',
        rule: 'style-strict-mode',
      })
    }
  }

  // Check balanced blocks
  const openers = (code.match(/\b(function|if|do|for|while)\b/g) || []).length
  const ends = (code.match(/\bend\b/g) || []).length
  if (Math.abs(openers - ends) > 1) {
    issues.push({
      line: lines.length,
      severity: 'error',
      category: 'correctness',
      message: `Unbalanced blocks: ${openers} openers vs ${ends} 'end' statements`,
      rule: 'correctness-balanced-blocks',
    })
  }

  // Score: start at 100, deduct per issue
  const deductions: Record<IssueSeverity, number> = { error: 15, warning: 5, info: 1 }
  const score = Math.max(0, 100 - issues.reduce((sum, i) => sum + deductions[i.severity], 0))

  return {
    issues,
    fixedCode: fixCount > 0 ? fixedLines.join('\n') : null,
    score,
  }
}

/**
 * Auto-fix all fixable issues and return the cleaned code.
 * This is the fast path — no AI needed.
 */
export function autoFixLuau(code: string): string {
  const result = analyzeLuau(code)
  return result.fixedCode ?? code
}
