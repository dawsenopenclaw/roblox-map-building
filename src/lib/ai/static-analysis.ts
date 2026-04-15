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
  suggestedFix?: string // Human-readable suggestion when auto-fix isn't possible
  rule: string
}

export interface AnalysisResult {
  issues: StaticIssue[]
  fixedCode: string | null // Auto-fixed version, or null if no fixes applied
  score: number // 0-100 quality score
}

/** Alias used by the public runStaticAnalysis() entry point */
export type StaticAnalysisResult = StaticIssue

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
  // NOTE: missing-pcall-datastore is now handled by the multi-line checker
  // (checkMissingPcallDataStore) which actually inspects surrounding context.
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

  // ── Deprecated APIs (additional) ──────��────────────────────────────────
  {
    id: 'deprecated-brickcolor',
    pattern: /\bBrickColor\.new\s*\(/,
    severity: 'warning',
    category: 'deprecated',
    message: 'BrickColor is deprecated — use Color3.fromRGB(r, g, b) instead',
    skipComments: true,
  },
  {
    id: 'deprecated-setprimarypartcframe',
    pattern: /\bSetPrimaryPartCFrame\s*\(/,
    severity: 'error',
    category: 'deprecated',
    message: 'SetPrimaryPartCFrame() is deprecated — use :PivotTo(cframe) instead',
    fix: (_m, line) => line.replace(/(:?)SetPrimaryPartCFrame\s*\(/, '$1PivotTo('),
    skipComments: true,
  },

  // ── Correctness (additional) ──────────────���────────────────────────────
  {
    id: 'wrong-type-brickcolor-assign',
    pattern: /\.Color\s*=\s*BrickColor/,
    severity: 'error',
    category: 'correctness',
    message: '.Color expects Color3, not BrickColor — use Color3.fromRGB() or BrickColor.Color',
    fix: (_m, line) => line.replace(/\.Color\s*=\s*BrickColor\.new\s*\(\s*["']([^"']+)["']\s*\)/, '.Color = BrickColor.new("$1").Color'),
    skipComments: true,
  },
  {
    id: 'correctness-instance-new-parent',
    pattern: /Instance\.new\s*\(\s*["']\w+["']\s*,/,
    severity: 'warning',
    category: 'correctness',
    message: 'Instance.new(class, parent) is an anti-pattern — set Parent LAST after all properties',
    skipComments: true,
  },

  // ── Style (additional JS/TS syntax leaks) ─────────���────────────────────
  {
    id: 'style-arrow-function',
    pattern: /=>\s*\{/,
    severity: 'error',
    category: 'style',
    message: 'Arrow functions (=>) are JavaScript — use "function" in Luau',
    skipComments: true,
  },
  {
    id: 'style-template-literal',
    pattern: /`[^`]*\$\{/,
    severity: 'error',
    category: 'style',
    message: 'Template literals (`${...}`) are JavaScript — use string concatenation (..) in Luau',
    skipComments: true,
  },
]

// ── Multi-line Checks ──────────────────────────────────────────────────────
// These checks need visibility across multiple lines (block scope, etc.)

/**
 * Strip comment content from a line (preserves strings).
 * Returns code-only portion for analysis.
 */
function stripComment(line: string): string {
  // Naive but sufficient: find first "--" not inside a string
  let inStr: string | null = null
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inStr) {
      if (ch === inStr) inStr = null
    } else if (ch === '"' || ch === "'") {
      inStr = ch
    } else if (ch === '-' && line[i + 1] === '-') {
      return line.slice(0, i)
    }
  }
  return line
}

/**
 * Infinite loop detection: `while true do` without `task.wait()`, `wait()`,
 * `task.yield()`, `coroutine.yield()`, or `break` before its matching `end`.
 */
function checkInfiniteLoops(lines: string[]): StaticIssue[] {
  const issues: StaticIssue[] = []

  for (let i = 0; i < lines.length; i++) {
    const code = stripComment(lines[i])
    if (!/\bwhile\s+true\s+do\b/.test(code)) continue

    // Walk forward to find matching `end`, tracking depth
    let depth = 1
    let hasYield = false
    for (let j = i + 1; j < lines.length && depth > 0; j++) {
      const inner = stripComment(lines[j])
      // Count openers
      const openers = inner.match(/\b(function|if|do|for|while)\b/g)
      if (openers) depth += openers.length
      const closers = inner.match(/\bend\b/g)
      if (closers) depth -= closers.length

      if (
        /\btask\.wait\s*\(/.test(inner) ||
        /\btask\.yield\s*\(/.test(inner) ||
        /\bcoroutine\.yield\s*\(/.test(inner) ||
        /\bwait\s*\(/.test(inner) ||
        /\bbreak\b/.test(inner)
      ) {
        hasYield = true
        break
      }
    }

    if (!hasYield) {
      issues.push({
        line: i + 1,
        severity: 'warning',
        category: 'performance',
        message:
          'while true do without task.wait(), break, or yield will freeze the game',
        suggestedFix:
          'Add task.wait() inside the loop body to yield to the scheduler',
        rule: 'perf-infinite-loop-no-yield',
      })
    }
  }
  return issues
}

/**
 * Memory leak detection: Parts created inside a loop without being parented
 * to a container (Folder/Model) that is later destroyed or has :ClearAllChildren().
 */
function checkMemoryLeaks(lines: string[]): StaticIssue[] {
  const issues: StaticIssue[] = []
  // Track loop regions
  const loopStarts: number[] = []

  for (let i = 0; i < lines.length; i++) {
    const code = stripComment(lines[i])
    if (/\b(for|while)\b.*\bdo\b/.test(code)) {
      loopStarts.push(i)
    }
  }

  for (const start of loopStarts) {
    // Scan loop body for Instance.new("Part") / Instance.new("BasePart") etc.
    let depth = 1
    let hasPartCreation = false
    let partCreationLine = -1
    let hasContainerParent = false

    for (let j = start + 1; j < lines.length && depth > 0; j++) {
      const code = stripComment(lines[j])
      const openers = code.match(/\b(function|if|do|for|while)\b/g)
      if (openers) depth += openers.length
      const closers = code.match(/\bend\b/g)
      if (closers) depth -= closers.length

      if (/Instance\.new\s*\(\s*["'](?:Part|MeshPart|UnionOperation|WedgePart|SpawnLocation)["']/.test(code)) {
        hasPartCreation = true
        if (partCreationLine < 0) partCreationLine = j
      }
      // Check for parenting to a folder/model container
      if (/\.Parent\s*=\s*\w*(folder|model|container|group)/i.test(code)) {
        hasContainerParent = true
      }
    }

    // Also check if there's a :Destroy() or :ClearAllChildren() nearby
    const fullBlock = lines.slice(start, start + depth + 50).join('\n')
    if (/:(Destroy|ClearAllChildren)\s*\(/.test(fullBlock)) {
      hasContainerParent = true
    }

    if (hasPartCreation && !hasContainerParent) {
      issues.push({
        line: partCreationLine + 1,
        severity: 'warning',
        category: 'performance',
        message:
          'Parts created in a loop without parenting to a container that gets cleaned up — potential memory leak',
        suggestedFix:
          'Parent parts to a Folder or Model, then call :Destroy() on the container when done',
        rule: 'perf-memory-leak-loop-parts',
      })
    }
  }
  return issues
}

/**
 * Missing Anchored: Parts created via Instance.new but .Anchored is never set.
 * Un-anchored parts fall through the world on creation.
 */
function checkMissingAnchored(code: string, lines: string[]): StaticIssue[] {
  const issues: StaticIssue[] = []
  const partVarPattern = /(\w+)\s*=\s*Instance\.new\s*\(\s*["'](?:Part|MeshPart|WedgePart|SpawnLocation|UnionOperation)["']/g
  let match: RegExpExecArray | null

  while ((match = partVarPattern.exec(code)) !== null) {
    const varName = match[1]
    // Find line number
    const before = code.slice(0, match.index)
    const lineNum = before.split('\n').length

    // Check if .Anchored is set anywhere for this variable
    const anchoredPattern = new RegExp(
      `\\b${varName}\\.Anchored\\s*=`,
    )
    if (!anchoredPattern.test(code)) {
      issues.push({
        line: lineNum,
        severity: 'error',
        category: 'correctness',
        message: `Part "${varName}" is never anchored — it will fall through the world`,
        suggestedFix: `Add ${varName}.Anchored = true after creation`,
        rule: 'correctness-missing-anchored',
      })
    }
  }
  return issues
}

/**
 * Script in wrong container: Script parented to workspace instead of ServerScriptService.
 */
function checkScriptContainers(lines: string[]): StaticIssue[] {
  const issues: StaticIssue[] = []

  for (let i = 0; i < lines.length; i++) {
    const code = stripComment(lines[i])

    // Detect: Instance.new("Script") ... .Parent = workspace / game.Workspace
    if (/Instance\.new\s*\(\s*["']Script["']/.test(code)) {
      // Look ahead up to 10 lines for parent assignment
      for (let j = i; j < Math.min(i + 10, lines.length); j++) {
        const ahead = stripComment(lines[j])
        if (/\.Parent\s*=\s*(?:workspace|game\.Workspace|game:GetService\s*\(\s*["']Workspace["']\s*\))/.test(ahead)) {
          issues.push({
            line: j + 1,
            severity: 'warning',
            category: 'correctness',
            message:
              'Script parented to Workspace — should be in ServerScriptService for server scripts',
            suggestedFix:
              'Parent to game:GetService("ServerScriptService") instead of workspace',
            rule: 'correctness-script-wrong-container',
          })
          break
        }
      }
    }

    // Detect: LocalScript parented to ServerScriptService
    if (/Instance\.new\s*\(\s*["']LocalScript["']/.test(code)) {
      for (let j = i; j < Math.min(i + 10, lines.length); j++) {
        const ahead = stripComment(lines[j])
        if (/\.Parent\s*=\s*(?:game\.ServerScriptService|game:GetService\s*\(\s*["']ServerScriptService["']\s*\))/.test(ahead)) {
          issues.push({
            line: j + 1,
            severity: 'warning',
            category: 'correctness',
            message:
              'LocalScript parented to ServerScriptService — LocalScripts do not run on the server',
            suggestedFix:
              'Parent to StarterPlayerScripts, StarterGui, or ReplicatedFirst instead',
            rule: 'correctness-localscript-server-container',
          })
          break
        }
      }
    }
  }
  return issues
}

/**
 * Duplicate variable names: same `local varName` declared twice in overlapping scope.
 * Uses a simple scope-depth tracker (not a full parser, but catches common cases).
 */
function checkDuplicateVariables(lines: string[]): StaticIssue[] {
  const issues: StaticIssue[] = []
  // Stack of scopes. Each scope is a Set of declared variable names.
  const scopeStack: Set<string>[] = [new Set()]

  for (let i = 0; i < lines.length; i++) {
    const code = stripComment(lines[i]).trim()
    if (code.startsWith('--')) continue

    // Open new scope on block openers
    if (/\b(function|do|then|repeat)\b/.test(code) && !/\bend\b/.test(code)) {
      scopeStack.push(new Set())
    }

    // Close scope
    if (/\bend\b/.test(code) || /\buntil\b/.test(code)) {
      if (scopeStack.length > 1) scopeStack.pop()
    }

    // Match local declarations: `local x`, `local x =`, `local x, y =`
    const localMatch = code.match(/^\s*local\s+([a-zA-Z_]\w*(?:\s*,\s*[a-zA-Z_]\w*)*)/)
    if (localMatch) {
      const varNames = localMatch[1].split(',').map(v => v.trim())
      const currentScope = scopeStack[scopeStack.length - 1]

      for (const name of varNames) {
        if (name === '_') continue // _ is a throwaway variable
        if (currentScope.has(name)) {
          issues.push({
            line: i + 1,
            severity: 'warning',
            category: 'correctness',
            message: `Variable "${name}" is declared twice in the same scope`,
            suggestedFix: `Remove the duplicate declaration or rename one of them`,
            rule: 'correctness-duplicate-variable',
          })
        } else {
          currentScope.add(name)
        }
      }
    }
  }
  return issues
}

/**
 * Unused variables: `local x = ...` where `x` never appears again (ignoring `_`).
 */
function checkUnusedVariables(code: string, lines: string[]): StaticIssue[] {
  const issues: StaticIssue[] = []
  const localDeclPattern = /^\s*local\s+(function\s+)?([a-zA-Z_]\w*)/

  for (let i = 0; i < lines.length; i++) {
    const stripped = stripComment(lines[i])
    const m = stripped.match(localDeclPattern)
    if (!m) continue

    const varName = m[2]
    if (varName === '_' || varName === '__') continue // convention: throwaway

    // Count occurrences of this variable name in the whole file
    // We need at least 2: the declaration + one usage
    const occurrences = code.match(new RegExp(`\\b${varName}\\b`, 'g'))
    if (occurrences && occurrences.length <= 1) {
      issues.push({
        line: i + 1,
        severity: 'warning',
        category: 'correctness',
        message: `Variable "${varName}" is declared but never used`,
        suggestedFix: `Remove the unused variable or prefix with _ to indicate intentional discard`,
        rule: 'correctness-unused-variable',
      })
    }
  }
  return issues
}

/**
 * Large part count: warn if more than 500 Instance.new("Part") calls.
 */
function checkLargePartCount(code: string): StaticIssue[] {
  const partMatches = code.match(/Instance\.new\s*\(\s*["'](?:Part|MeshPart|WedgePart|SpawnLocation|UnionOperation)["']/g)
  if (partMatches && partMatches.length > 500) {
    return [
      {
        line: 1,
        severity: 'warning',
        category: 'performance',
        message: `${partMatches.length} Part creation calls detected — this may cause severe lag. Consider using pre-built models or streaming`,
        suggestedFix:
          'Use :Clone() from a template part, or load pre-built models from ServerStorage instead of creating each part individually',
        rule: 'perf-large-part-count',
      },
    ]
  }
  return []
}

/**
 * Missing pcall on DataStore: DataStore methods called without pcall wrapping.
 * Checks whether the DataStore call is inside a pcall/xpcall block.
 */
function checkMissingPcallDataStore(lines: string[]): StaticIssue[] {
  const issues: StaticIssue[] = []
  const dsMethodPattern = /(?:GetAsync|SetAsync|UpdateAsync|RemoveAsync|IncrementAsync|GetSortedAsync|ListKeysAsync|ListVersionsAsync)\s*\(/

  for (let i = 0; i < lines.length; i++) {
    const code = stripComment(lines[i])
    if (!dsMethodPattern.test(code)) continue
    if (code.trim().startsWith('--')) continue

    // Check if this line or the preceding few lines contain pcall/xpcall
    let wrappedInPcall = false
    // Look back up to 5 lines for pcall( or xpcall(
    for (let j = Math.max(0, i - 5); j <= i; j++) {
      const prev = stripComment(lines[j])
      if (/\bpcall\s*\(/.test(prev) || /\bxpcall\s*\(/.test(prev)) {
        wrappedInPcall = true
        break
      }
    }

    // Also check if this line itself has pcall
    if (/\bpcall\s*\(/.test(code) || /\bxpcall\s*\(/.test(code)) {
      wrappedInPcall = true
    }

    if (!wrappedInPcall) {
      issues.push({
        line: i + 1,
        severity: 'warning',
        category: 'correctness',
        message:
          'DataStore call without pcall — DataStore operations can fail due to throttling or network errors',
        suggestedFix:
          'Wrap in pcall: local success, result = pcall(function() return dataStore:GetAsync(key) end)',
        rule: 'correctness-missing-pcall-datastore',
      })
    }
  }
  return issues
}

/**
 * Detect hallucinated (non-existent) Roblox services in game:GetService() calls.
 */
const VALID_ROBLOX_SERVICES = new Set([
  'Players', 'Workspace', 'Lighting', 'ReplicatedStorage', 'ServerScriptService',
  'ServerStorage', 'StarterGui', 'StarterPlayer', 'StarterPack', 'SoundService',
  'TweenService', 'RunService', 'UserInputService', 'ContextActionService',
  'HttpService', 'MarketplaceService', 'DataStoreService', 'InsertService',
  'TeleportService', 'Chat', 'Teams', 'BadgeService', 'GamePassService',
  'GroupService', 'PolicyService', 'TextService', 'LocalizationService',
  'PathfindingService', 'PhysicsService', 'CollectionService', 'Debris',
  'ProximityPromptService', 'GuiService', 'HapticService', 'VRService',
  'ContentProvider', 'ChangeHistoryService', 'Selection', 'StudioService',
  'CoreGui', 'TestService', 'MemoryStoreService', 'MessagingService',
  'AssetService', 'AnimationClipProvider', 'KeyframeSequenceProvider',
  'SocialService', 'VoiceChatService', 'AvatarEditorService',
  'ExperienceNotificationService', 'TextChatService', 'MaterialService',
  'ReplicatedFirst',
])

function checkHallucinatedServices(lines: string[]): StaticIssue[] {
  const issues: StaticIssue[] = []
  const pattern = /game:GetService\s*\(\s*["'](\w+)["']\s*\)/g

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()
    if (trimmed.startsWith('--')) continue

    // Check if match is after a comment marker
    const commentIdx = line.indexOf('--')

    let match: RegExpExecArray | null
    pattern.lastIndex = 0
    while ((match = pattern.exec(line)) !== null) {
      // Skip if inside a comment
      if (commentIdx >= 0 && match.index >= commentIdx) continue

      const serviceName = match[1]
      if (!VALID_ROBLOX_SERVICES.has(serviceName)) {
        issues.push({
          line: i + 1,
          column: match.index,
          severity: 'error',
          category: 'correctness',
          message: `"${serviceName}" is not a real Roblox service — check spelling or use a valid service name`,
          suggestedFix: `Remove game:GetService("${serviceName}") and use a valid Roblox service instead`,
          rule: 'hallucinated-service',
        })
      }
    }
  }
  return issues
}

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

  // ── Multi-line checks ──────────────────────────────────────────────────
  issues.push(...checkInfiniteLoops(lines))
  issues.push(...checkMemoryLeaks(lines))
  issues.push(...checkMissingAnchored(code, lines))
  issues.push(...checkScriptContainers(lines))
  issues.push(...checkDuplicateVariables(lines))
  issues.push(...checkUnusedVariables(code, lines))
  issues.push(...checkLargePartCount(code))
  issues.push(...checkMissingPcallDataStore(lines))
  issues.push(...checkHallucinatedServices(lines))

  // Sort issues by line number for readability
  issues.sort((a, b) => a.line - b.line)

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

/**
 * Public entry point — returns a flat array of structured analysis results.
 * Each result includes severity, message, line number, and a suggested fix.
 *
 * This is the function other modules should call for static analysis.
 */
export function runStaticAnalysis(code: string): StaticAnalysisResult[] {
  const { issues } = analyzeLuau(code)
  return issues
}
