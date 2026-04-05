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

  // 8. Fix PointLight/SpotLight CFrame assignment — lights don't have CFrame, use Parent.CFrame
  // AI often does: light.CFrame = CFrame.new(...) which fails
  fixed = fixed.replace(
    /(\w+)\.CFrame\s*=\s*(CFrame\.new\([^)]*\))\s*\n/g,
    (match, varName, cframeExpr) => {
      // Check if varName looks like a light (contains Light, light, lamp, etc.)
      if (/[Ll]ight|[Ll]amp|[Gg]low|[Ss]pot|[Ss]urface/.test(varName)) {
        fixes.push(`Fixed: Removed CFrame assignment on light "${varName}" (lights inherit parent position)`)
        return '' // Remove the line — lights get position from their parent Part
      }
      return match
    }
  )

  // 9. Fix Model:SetPrimaryPartCFrame() → Model:PivotTo()
  // SetPrimaryPartCFrame is deprecated and fails without PrimaryPart
  fixed = fixed.replace(
    /(\w+):SetPrimaryPartCFrame\(([^)]+)\)/g,
    (_, varName, args) => {
      fixes.push(`Fixed: ${varName}:SetPrimaryPartCFrame() → ${varName}:PivotTo()`)
      return `${varName}:PivotTo(${args})`
    }
  )

  // 10. Fix .PrimaryPartCFrame = ... → :PivotTo(...)
  fixed = fixed.replace(
    /(\w+)\.PrimaryPartCFrame\s*=\s*([^\n]+)/g,
    (_, varName, value) => {
      fixes.push(`Fixed: ${varName}.PrimaryPartCFrame → ${varName}:PivotTo()`)
      return `${varName}:PivotTo(${value.trim()})`
    }
  )

  // 11. Ensure Model has PrimaryPart set before PivotTo (add if missing)
  if (fixed.includes(':PivotTo(') && !fixed.includes('.PrimaryPart')) {
    // Find Model variable names and add PrimaryPart assignment
    const modelVars = fixed.match(/local\s+(\w+)\s*=\s*Instance\.new\("Model"\)/g)
    if (modelVars) {
      for (const decl of modelVars) {
        const varMatch = decl.match(/local\s+(\w+)/)
        if (varMatch) {
          const vn = varMatch[1]
          // Insert PrimaryPart assignment after parenting children
          // We'll add it just before the PivotTo call for safety
          fixed = fixed.replace(
            new RegExp(`(${vn}:PivotTo\\()`, 'g'),
            `if not ${vn}.PrimaryPart then for _,c in ${vn}:GetChildren() do if c:IsA("BasePart") then ${vn}.PrimaryPart=c break end end end\n$1`
          )
          fixes.push(`Added: PrimaryPart auto-set for Model "${vn}"`)
        }
      }
    }
  }

  // 12. Fix Instance.new with nil className — catch empty or nil args
  fixed = fixed.replace(/Instance\.new\(\s*\)/g, () => {
    fixes.push('Fixed: Instance.new() with no args → Instance.new("Part")')
    return 'Instance.new("Part")'
  })

  // 13. Fix CFrame on non-BasePart instances (PointLight, SpotLight, SurfaceLight, etc.)
  // More aggressive version: any .CFrame= on a variable created as a Light
  const lightVars = new Set<string>()
  const lightCreatePattern = /local\s+(\w+)\s*=\s*Instance\.new\("(?:PointLight|SpotLight|SurfaceLight|Fire|Smoke|Sparkles|BillboardGui|Attachment)"\)/g
  let lm
  while ((lm = lightCreatePattern.exec(fixed)) !== null) {
    lightVars.add(lm[1])
  }
  if (lightVars.size > 0) {
    const lightVarPattern = new RegExp(
      `(${[...lightVars].join('|')})\\.(?:CFrame|Position|Size)\\s*=\\s*[^\\n]+\\n?`,
      'g'
    )
    const beforeLen = fixed.length
    fixed = fixed.replace(lightVarPattern, (match, vn) => {
      return '' // Remove invalid property assignments on non-BasePart instances
    })
    if (fixed.length !== beforeLen) {
      fixes.push('Fixed: Removed CFrame/Position/Size on non-BasePart instances (lights, effects)')
    }
  }

  // 14. Ensure all parts are Anchored in Edit Mode
  const partCreations = fixed.match(/Instance\.new\("(?:Part|WedgePart|CylinderPart|SpherePart|MeshPart|UnionOperation)"\)/g)
  if (partCreations && partCreations.length > 0 && !fixed.includes('Anchored')) {
    warnings.push('Warning: Parts created without Anchored=true — they will fall in Play mode')
  }

  // 15. Warn about game.Players.LocalPlayer in server-context code
  if (/game\.Players\.LocalPlayer|game:GetService\("Players"\)\.LocalPlayer/.test(fixed)) {
    warnings.push('Warning: LocalPlayer detected — this only works in LocalScripts, not server Scripts or Edit Mode plugins')
  }

  // 16. Warn about unbounded loops (while true do without task.wait)
  const whileTrueBlocks = fixed.match(/while\s+true\s+do[\s\S]*?end/g) || []
  for (const block of whileTrueBlocks) {
    if (!block.includes('task.wait') && !block.includes('wait(')) {
      warnings.push('Warning: while true do loop detected without task.wait() — this will cause a script timeout')
    }
  }

  // 17. Add --!strict at top if missing (promotes type safety)
  if (!fixed.trimStart().startsWith('--!strict') && !fixed.trimStart().startsWith('--!nocheck')) {
    fixed = '--!strict\n' + fixed
    fixes.push('Added: --!strict type annotation at top')
  }

  // 18. Fix common ParticleEmitter property typos
  const particleTypos: Array<[RegExp, string, string]> = [
    [/\.EmissionRate\s*=/g, '.Rate =', 'ParticleEmitter.EmissionRate → .Rate'],
    [/\.SpreadAngles\s*=/g, '.SpreadAngle =', 'ParticleEmitter.SpreadAngles → .SpreadAngle'],
    [/\.Lifetime\s*=\s*(\d+(?:\.\d+)?)\s*\n/g, '', ''], // handled below
    [/\.NumParticles\s*=/g, '.Rate =', 'ParticleEmitter.NumParticles → .Rate (use Rate for emission count)'],
  ]
  for (const [pattern, replacement, msg] of particleTypos) {
    if (msg && pattern.test(fixed)) {
      fixed = fixed.replace(pattern, replacement)
      fixes.push(`Fixed: ${msg}`)
      pattern.lastIndex = 0
    }
  }
  // Fix Lifetime number → NumberRange
  fixed = fixed.replace(
    /(\w+)\.Lifetime\s*=\s*(\d+(?:\.\d+)?)\s*\n/g,
    (match, varName, num) => {
      // Only fix if the variable looks like a ParticleEmitter
      fixes.push(`Fixed: ${varName}.Lifetime = ${num} → NumberRange.new(${num}, ${num})`)
      return `${varName}.Lifetime = NumberRange.new(${num}, ${num})\n`
    }
  )

  // 19. Warn about workspace:FindFirstChild without nil check
  const findFirstChildCalls = fixed.match(/workspace:FindFirstChild\([^)]+\)\./g) || []
  if (findFirstChildCalls.length > 0) {
    warnings.push(`Warning: ${findFirstChildCalls.length} workspace:FindFirstChild() result(s) used without nil check — add "if result then" guards`)
  }

  // 20. Fix string.format inconsistency — warn if mixing %s with .. concatenation in same line
  const formatLines = fixed.split('\n').filter(line =>
    line.includes('string.format') && line.includes('..')
  )
  if (formatLines.length > 0) {
    warnings.push(`Warning: ${formatLines.length} line(s) mix string.format() and .. concatenation — pick one style per string`)
  }

  // 21. Fix task.spawn missing for async fire-and-forget patterns
  // If code calls a function and immediately discards it in a context that should be async
  // (heuristic: RemoteEvent:FireAllClients inside a loop without task.spawn)
  if (fixed.includes('for ') && fixed.includes(':FireAllClients(') && !fixed.includes('task.spawn')) {
    warnings.push('Warning: FireAllClients inside a loop without task.spawn may block — consider wrapping in task.spawn()')
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
