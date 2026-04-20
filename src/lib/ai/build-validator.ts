/**
 * Build Validator — catches bad materials, floating parts, and quality issues
 * in AI-generated Luau code BEFORE it reaches Studio.
 *
 * Parses P() calls, checks geometry and materials, and auto-fixes what it can.
 * If it can't fix something, it returns fix instructions for a retry prompt.
 */

import 'server-only'

// ── Types ────────────────────────────────────────────────────────────────────

interface ParsedPart {
  name: string
  x: number
  y: number
  z: number
  sizeX: number
  sizeY: number
  sizeZ: number
  material: string
  r: number
  g: number
  b: number
  line: number
  rawLine: string
}

export interface ValidationResult {
  valid: boolean
  score: number          // 0-100 quality score
  parts: ParsedPart[]
  issues: ValidationIssue[]
  fixedCode: string | null  // Auto-fixed code if fixable, null if unfixable
  retryPrompt: string | null // Instructions for AI retry if auto-fix not possible
}

interface ValidationIssue {
  severity: 'error' | 'warning'
  type: string
  message: string
  autoFixed: boolean
}

// ── Banned / problematic materials ──────────────────────────────────────────

const BANNED_MATERIALS = ['SmoothPlastic']
const VALID_MATERIALS = new Set([
  'Brick', 'Cobblestone', 'Concrete', 'CorrodedMetal', 'DiamondPlate',
  'Fabric', 'Foil', 'Glass', 'Granite', 'Grass', 'Ice', 'Marble',
  'Metal', 'Neon', 'Pebble', 'Plastic', 'Sand', 'Slate', 'Wood',
  'WoodPlanks', 'CrackedLava',
])

// ── Parse P() calls from Luau code ──────────────────────────────────────────

const RE_P_CALL = /P\(\s*"([^"]+)"\s*,\s*CFrame\.new\(\s*(?:sp\s*\+\s*Vector3\.new\(\s*)?([^)]+)\)?\s*\)(?:\s*\*\s*CFrame\.Angles[^)]*\))?\s*,\s*Vector3\.new\(\s*([^)]+)\)\s*,\s*Enum\.Material\.(\w+)\s*,\s*Color3\.fromRGB\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/g

function parseParts(code: string): ParsedPart[] {
  const parts: ParsedPart[] = []
  const lines = code.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    // Reset regex state
    RE_P_CALL.lastIndex = 0
    const m = RE_P_CALL.exec(line)
    if (!m) continue

    const name = m[1]
    const posNums = m[2].split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n))
    const sizeNums = m[3].split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n))

    if (posNums.length < 3 || sizeNums.length < 3) continue

    parts.push({
      name,
      x: posNums[posNums.length - 3],
      y: posNums[posNums.length - 2],
      z: posNums[posNums.length - 1],
      sizeX: sizeNums[0],
      sizeY: sizeNums[1],
      sizeZ: sizeNums[2],
      material: m[4],
      r: parseInt(m[5]),
      g: parseInt(m[6]),
      b: parseInt(m[7]),
      line: i + 1,
      rawLine: line,
    })
  }
  return parts
}

// ── Validators ──────────────────────────────────────────────────────────────

function checkMaterials(parts: ParsedPart[]): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  for (const p of parts) {
    if (BANNED_MATERIALS.includes(p.material)) {
      issues.push({
        severity: 'error',
        type: 'banned_material',
        message: `"${p.name}" uses SmoothPlastic — replaced with Concrete`,
        autoFixed: true,
      })
    }
    if (!VALID_MATERIALS.has(p.material) && !BANNED_MATERIALS.includes(p.material)) {
      issues.push({
        severity: 'warning',
        type: 'unknown_material',
        message: `"${p.name}" uses unknown material "${p.material}"`,
        autoFixed: false,
      })
    }
  }
  return issues
}

function checkPlacement(parts: ParsedPart[]): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  if (parts.length === 0) return issues

  // Check for parts below ground (Y center - half height < -1)
  for (const p of parts) {
    const bottomY = p.y - p.sizeY / 2
    if (bottomY < -5 && !p.name.toLowerCase().includes('underground') &&
        !p.name.toLowerCase().includes('pool') && !p.name.toLowerCase().includes('water') &&
        !p.name.toLowerCase().includes('foundation') && !p.name.toLowerCase().includes('hull') &&
        !p.name.toLowerCase().includes('keel') && !p.name.toLowerCase().includes('bunker') &&
        !p.name.toLowerCase().includes('cave') && !p.name.toLowerCase().includes('mine')) {
      issues.push({
        severity: 'warning',
        type: 'below_ground',
        message: `"${p.name}" bottom is ${bottomY.toFixed(1)} studs below ground — may be buried`,
        autoFixed: false,
      })
    }
  }

  // Check for all parts at the same Y (flat build — no vertical variety)
  const uniqueY = new Set(parts.map(p => Math.round(p.y * 2) / 2))
  if (parts.length > 5 && uniqueY.size < 3) {
    issues.push({
      severity: 'error',
      type: 'flat_build',
      message: `Only ${uniqueY.size} unique Y levels across ${parts.length} parts — build is flat/broken. Parts need vertical variety.`,
      autoFixed: false,
    })
  }

  // Check for parts at exactly 0,0,0 (AI defaulted, didn't calculate positions)
  const zeroCount = parts.filter(p => p.x === 0 && p.y === 0 && p.z === 0).length
  if (zeroCount > 2) {
    issues.push({
      severity: 'error',
      type: 'zero_positions',
      message: `${zeroCount} parts at position (0,0,0) — AI didn't calculate positions, just dumped everything at origin`,
      autoFixed: false,
    })
  }

  // Check for overlapping parts (same position, similar size)
  for (let i = 0; i < parts.length; i++) {
    for (let j = i + 1; j < parts.length; j++) {
      const a = parts[i], b = parts[j]
      const dist = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2)
      const minSize = Math.min(a.sizeX, a.sizeY, a.sizeZ, b.sizeX, b.sizeY, b.sizeZ)
      if (dist < 0.1 && minSize > 0.5 && a.name !== b.name) {
        issues.push({
          severity: 'warning',
          type: 'overlap',
          message: `"${a.name}" and "${b.name}" are at nearly the same position (${dist.toFixed(2)} studs apart)`,
          autoFixed: false,
        })
      }
    }
  }

  // Check for absurd part sizes
  for (const p of parts) {
    if (p.sizeX > 200 || p.sizeY > 200 || p.sizeZ > 200) {
      issues.push({
        severity: 'warning',
        type: 'oversized',
        message: `"${p.name}" is ${p.sizeX}x${p.sizeY}x${p.sizeZ} studs — unusually large`,
        autoFixed: false,
      })
    }
    if (p.sizeX < 0.01 || p.sizeY < 0.01 || p.sizeZ < 0.01) {
      issues.push({
        severity: 'warning',
        type: 'undersized',
        message: `"${p.name}" has a near-zero dimension — may be invisible`,
        autoFixed: false,
      })
    }
  }

  return issues
}

function checkQuality(parts: ParsedPart[]): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  // Minimum part count
  if (parts.length < 3) {
    issues.push({
      severity: 'error',
      type: 'too_few_parts',
      message: `Only ${parts.length} parts detected — builds need at least 5 parts to look good`,
      autoFixed: false,
    })
  }

  // Color variety — all parts same color?
  if (parts.length > 5) {
    const uniqueColors = new Set(parts.map(p => `${p.r},${p.g},${p.b}`))
    if (uniqueColors.size < 3) {
      issues.push({
        severity: 'warning',
        type: 'no_color_variety',
        message: `Only ${uniqueColors.size} unique colors across ${parts.length} parts — needs more variety`,
        autoFixed: false,
      })
    }
  }

  // Material variety
  if (parts.length > 5) {
    const uniqueMaterials = new Set(parts.map(p => p.material))
    if (uniqueMaterials.size < 2) {
      issues.push({
        severity: 'warning',
        type: 'no_material_variety',
        message: `All ${parts.length} parts use ${[...uniqueMaterials][0]} — mix materials for realism`,
        autoFixed: false,
      })
    }
  }

  // Check descriptive naming (not Part1, Part2, etc.)
  const genericNames = parts.filter(p => /^Part\d*$|^part\d*$/i.test(p.name))
  if (genericNames.length > 2) {
    issues.push({
      severity: 'warning',
      type: 'generic_names',
      message: `${genericNames.length} parts have generic names like "Part1" — use descriptive names`,
      autoFixed: false,
    })
  }

  return issues
}

// ── Auto-fix — fix what we can automatically ────────────────────────────────

function autoFix(code: string, issues: ValidationIssue[]): string {
  let fixed = code

  // Replace SmoothPlastic with Concrete
  fixed = fixed.replace(/Enum\.Material\.SmoothPlastic/g, 'Enum.Material.Concrete')

  return fixed
}

// ── Build retry prompt from unfixed issues ──────────────────────────────────

function buildRetryPrompt(issues: ValidationIssue[]): string | null {
  const unfixed = issues.filter(i => !i.autoFixed && i.severity === 'error')
  if (unfixed.length === 0) return null

  const lines = unfixed.map(i => `- ${i.message}`)
  return `The previous build had these critical issues that MUST be fixed:\n${lines.join('\n')}\n\nRegenerate the COMPLETE build with these issues fixed. Do NOT just patch — regenerate from scratch with correct geometry.`
}

// ── Main validator ──────────────────────────────────────────────────────────

export function validateBuild(code: string): ValidationResult {
  const parts = parseParts(code)
  const issues: ValidationIssue[] = [
    ...checkMaterials(parts),
    ...checkPlacement(parts),
    ...checkQuality(parts),
  ]

  // Auto-fix what we can
  const hasAutoFixes = issues.some(i => i.autoFixed)
  const fixedCode = hasAutoFixes ? autoFix(code, issues) : null

  // Build retry prompt for unfixed errors
  const retryPrompt = buildRetryPrompt(issues)

  // Score: start at 100, deduct for issues
  let score = 100
  for (const i of issues) {
    if (i.severity === 'error' && !i.autoFixed) score -= 20
    if (i.severity === 'error' && i.autoFixed) score -= 5
    if (i.severity === 'warning') score -= 3
  }
  score = Math.max(0, Math.min(100, score))

  const errorCount = issues.filter(i => i.severity === 'error' && !i.autoFixed).length
  const valid = errorCount === 0 && parts.length >= 3

  return { valid, score, parts, issues, fixedCode, retryPrompt }
}
