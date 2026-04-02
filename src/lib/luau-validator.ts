/**
 * Luau code validator and auto-fixer.
 * Catches and fixes common mistakes made by AI models when generating
 * Roblox Luau code for Edit Mode execution.
 *
 * Used by the chat route before sending code to Studio.
 */

import 'server-only'

// ── Common BrickColor → Color3 mapping ─────────────────────────────────────

const BRICK_COLOR_MAP: Record<string, string> = {
  'Really red':        'Color3.fromRGB(255,0,0)',
  'Really blue':       'Color3.fromRGB(0,0,255)',
  'White':             'Color3.fromRGB(255,255,255)',
  'Black':             'Color3.fromRGB(0,0,0)',
  'Bright green':      'Color3.fromRGB(75,151,75)',
  'Bright yellow':     'Color3.fromRGB(245,205,48)',
  'Bright orange':     'Color3.fromRGB(218,134,59)',
  'Dark stone grey':   'Color3.fromRGB(99,95,98)',
  'Medium stone grey': 'Color3.fromRGB(163,162,165)',
  'Slate':             'Color3.fromRGB(91,93,105)',
  'Lime green':        'Color3.fromRGB(0,255,0)',
  'Cobalt blue':       'Color3.fromRGB(0,80,160)',
  'Flesh':             'Color3.fromRGB(204,142,105)',
  'Brown':             'Color3.fromRGB(106,57,9)',
  'Sand red':          'Color3.fromRGB(149,103,76)',
  'Sand blue':         'Color3.fromRGB(116,134,156)',
  'Reddish brown':     'Color3.fromRGB(105,64,40)',
  'Teal':              'Color3.fromRGB(0,128,128)',
  'Royal purple':      'Color3.fromRGB(98,37,209)',
  'Hot pink':          'Color3.fromRGB(255,105,180)',
  'Deep orange':       'Color3.fromRGB(255,87,51)',
  'Fossil':            'Color3.fromRGB(160,155,145)',
  'Parsley green':     'Color3.fromRGB(76,117,62)',
  'Institutional white': 'Color3.fromRGB(248,248,248)',
}

// ── Dangerous patterns that should never appear in Edit Mode code ──────────

const DANGEROUS_PATTERNS = [
  { pattern: /game:GetService\("Players"\)/g, reason: 'Players service not available in Edit Mode' },
  { pattern: /game\.Players/g, reason: 'Players service not available in Edit Mode' },
  { pattern: /\.LocalPlayer/g, reason: 'LocalPlayer not available in Edit Mode' },
  { pattern: /\.Character\b/g, reason: 'Character not available in Edit Mode' },
  { pattern: /\.PlayerAdded/g, reason: 'PlayerAdded not available in Edit Mode' },
  { pattern: /\.PlayerRemoving/g, reason: 'PlayerRemoving not available in Edit Mode' },
  { pattern: /\.Humanoid/g, reason: 'Humanoid not available in Edit Mode' },
] as const

// ── Validation result ──────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean
  fixedCode: string
  warnings: string[]
  fixes: string[]
}

/**
 * Validate and auto-fix common AI mistakes in Luau code.
 * Returns the fixed code and a list of changes made.
 */
export function validateAndFixLuau(code: string): ValidationResult {
  const warnings: string[] = []
  const fixes: string[] = []
  let fixed = code

  // 1. Fix BrickColor.new("X") → Color3.fromRGB(...)
  fixed = fixed.replace(/BrickColor\.new\("([^"]+)"\)/g, (match, name: string) => {
    const replacement = BRICK_COLOR_MAP[name]
    if (replacement) {
      fixes.push(`Fixed: BrickColor.new("${name}") → ${replacement}`)
      return replacement
    }
    fixes.push(`Fixed: BrickColor.new("${name}") → Color3.fromRGB(160,160,160) (unknown color)`)
    return 'Color3.fromRGB(160,160,160)'
  })

  // 2. Fix wait() → task.wait()
  const waitCount = (fixed.match(/\bwait\s*\(/g) || []).length
  if (waitCount > 0) {
    fixed = fixed.replace(/\bwait\s*\(/g, 'task.wait(')
    fixes.push(`Fixed: ${waitCount} wait() → task.wait()`)
  }

  // 3. Fix Instance.new("Part", parent) → set parent separately
  fixed = fixed.replace(
    /Instance\.new\("(\w+)",\s*(\w+[\w.]*)\)/g,
    (_, className: string, parent: string) => {
      fixes.push(`Fixed: Instance.new("${className}", ${parent}) → parent set separately`)
      return `Instance.new("${className}") --[[ parent: ${parent} ]]`
    }
  )

  // 4. Ensure _forje_state initialization
  if (fixed.includes('_forje_state') && !fixed.includes('_forje_state=_forje_state or') && !fixed.includes('_forje_state =')) {
    fixed = '_forje_state=_forje_state or {}\n' + fixed
    fixes.push('Added: _forje_state initialization')
  }

  // 5. Ensure ChangeHistoryService wrapping for undo support
  if (!fixed.includes('ChangeHistoryService') && !fixed.includes('TryBeginRecording')) {
    fixed = [
      'local CH=game:GetService("ChangeHistoryService")',
      'local rid=CH:TryBeginRecording("ForjeAI")',
      '',
      fixed,
      '',
      'if rid then CH:FinishRecording(rid,Enum.FinishRecordingOperation.Commit) end',
    ].join('\n')
    fixes.push('Added: ChangeHistoryService wrapping for undo support')
  }

  // 6. Check for dangerous patterns (warn but don't remove — might break code)
  for (const { pattern, reason } of DANGEROUS_PATTERNS) {
    if (pattern.test(fixed)) {
      warnings.push(`Warning: Code contains ${reason}`)
    }
    // Reset lastIndex since we're using global regexes
    pattern.lastIndex = 0
  }

  // 7. Fix .BrickColor = ... → .Color = ...
  fixed = fixed.replace(/\.BrickColor\s*=/g, (match) => {
    fixes.push('Fixed: .BrickColor = → .Color =')
    return '.Color ='
  })

  // 8. Ensure all parts are Anchored in Edit Mode
  // Check if there are Instance.new("Part") without Anchored = true
  const partCreations = fixed.match(/Instance\.new\("(?:Part|WedgePart|CylinderPart|SpherePart)"\)/g)
  if (partCreations && partCreations.length > 0 && !fixed.includes('Anchored')) {
    warnings.push('Warning: Parts created without Anchored=true — they will fall in Play mode')
  }

  return {
    valid: warnings.length === 0,
    fixedCode: fixed,
    warnings,
    fixes,
  }
}

/**
 * Quick check if code looks like valid Luau (basic syntax check).
 * Does NOT execute the code — just checks for obvious syntax issues.
 */
export function isLikelyValidLuau(code: string): boolean {
  if (!code || code.trim().length < 10) return false

  // Check for balanced parentheses/brackets
  let parens = 0, brackets = 0
  for (const ch of code) {
    if (ch === '(') parens++
    else if (ch === ')') parens--
    else if (ch === '[') brackets++
    else if (ch === ']') brackets--
    if (parens < 0 || brackets < 0) return false
  }

  // Check for at least one Roblox API call
  const hasRobloxAPI = /(?:Instance\.new|workspace|game:GetService|CFrame|Vector3|Color3|Enum\.)/.test(code)

  return parens === 0 && brackets === 0 && hasRobloxAPI
}
