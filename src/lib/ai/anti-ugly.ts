/**
 * anti-ugly.ts — Visual quality enforcer for ForjeGames builds.
 *
 * Runs 8 rules on every build BEFORE it reaches Studio.
 * Auto-fixes most issues. Scores 0-100. Minimum 60 to pass.
 *
 * Rules:
 * 1. No single-shape objects (1 ball → 3-5 balls)
 * 2. No floating parts (sink to ground)
 * 3. Color variation (inject ±8 RGB on repeated colors)
 * 4. Trim on buildings (baseboards + crown molding)
 * 5. Lighting required (PointLights)
 * 6. Ground required (floor plane)
 * 7. Shape variety (flag all-box builds)
 * 8. Scale bounds (clamp 0.1-200 studs)
 */

import 'server-only'
import type { BuildPart, BuildChild } from './mega-builder'

// ─── Types ──────────────────────────────────────────────────────────────────

export type AntiUglyRule =
  | 'no_single_shapes'
  | 'no_floating'
  | 'color_variation'
  | 'trim_required'
  | 'lighting_required'
  | 'ground_required'
  | 'shape_variety'
  | 'scale_bounds'

export interface RuleResult {
  rule: AntiUglyRule
  passed: boolean
  severity: 'critical' | 'major' | 'minor'
  message: string
  autoFixed: boolean
  partsAdded: number
  partsModified: number
}

export interface AntiUglyResult {
  passed: boolean
  score: number
  originalPartCount: number
  fixedPartCount: number
  rules: RuleResult[]
  fixedParts: BuildPart[]
  retryNeeded: boolean
  retryInstructions: string | null
}

// ─── Exempt patterns (intentionally floating/unusual) ─────────────────────

const FLOAT_EXEMPT = /chandelier|banner|flag|cloud|sky|floating|hanging|pendant|sign|lantern|bird|star|moon|sun/i
const GROUND_NAMES = /floor|ground|base|foundation|terrain|slab|platform|road|path/i

// ─── Helper: clamp number ────────────────────────────────���────────────────

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

// ─── Rule 1: No single-shape objects ──────────────────────────────────────
// A single Ball/Cylinder alone looks ugly. Trees need 3-5 leaf balls,
// bushes need 3+ balls, columns need a base ring.

function checkAndFixSingleShapes(parts: BuildPart[]): { parts: BuildPart[]; result: RuleResult } {
  const added: BuildPart[] = []
  let fixCount = 0

  // Find isolated balls (no other ball within 5 studs)
  const balls = parts.filter(p => p.shape === 'Ball')
  for (const ball of balls) {
    const nearby = balls.filter(b =>
      b !== ball &&
      Math.abs(b.position[0] - ball.position[0]) < 5 &&
      Math.abs(b.position[1] - ball.position[1]) < 5 &&
      Math.abs(b.position[2] - ball.position[2]) < 5
    )
    if (nearby.length === 0) {
      // Isolated ball — add 2-3 companion balls for organic look
      for (let i = 0; i < 3; i++) {
        const scale = 0.6 + Math.random() * 0.5
        const sz = ball.size[0] * scale
        added.push({
          name: `${ball.name}_cluster_${i}`,
          size: [sz, sz * 0.75, sz],
          position: [
            ball.position[0] + (Math.random() - 0.5) * ball.size[0] * 0.8,
            ball.position[1] + (Math.random() - 0.3) * ball.size[1] * 0.5,
            ball.position[2] + (Math.random() - 0.5) * ball.size[2] * 0.8,
          ],
          rotation: [0, Math.random() * 360, 0],
          material: ball.material,
          color: [
            clamp(ball.color[0] + Math.floor((Math.random() - 0.5) * 20), 0, 255),
            clamp(ball.color[1] + Math.floor((Math.random() - 0.5) * 20), 0, 255),
            clamp(ball.color[2] + Math.floor((Math.random() - 0.5) * 20), 0, 255),
          ],
          shape: 'Ball',
        })
      }
      fixCount++
    }
  }

  return {
    parts: [...parts, ...added],
    result: {
      rule: 'no_single_shapes',
      passed: fixCount === 0,
      severity: 'major',
      message: fixCount > 0 ? `Fixed ${fixCount} isolated shapes (added ${added.length} companion parts)` : 'All shapes properly clustered',
      autoFixed: fixCount > 0,
      partsAdded: added.length,
      partsModified: 0,
    },
  }
}

// ─── Rule 2: No floating parts ────────────────────────────────────────────

function checkAndFixFloating(parts: BuildPart[]): { parts: BuildPart[]; result: RuleResult } {
  let fixCount = 0
  const minY = Math.min(...parts.map(p => p.position[1] - p.size[1] / 2))
  const groundLevel = Math.max(minY, 0)

  const fixed = parts.map(p => {
    if (FLOAT_EXEMPT.test(p.name)) return p
    const bottomY = p.position[1] - p.size[1] / 2
    // If part is more than 2 studs above ground and nothing supports it below
    if (bottomY > groundLevel + 2) {
      const hasSupport = parts.some(other =>
        other !== p &&
        Math.abs(other.position[0] - p.position[0]) < Math.max(other.size[0], p.size[0]) / 2 + 1 &&
        Math.abs(other.position[2] - p.position[2]) < Math.max(other.size[2], p.size[2]) / 2 + 1 &&
        other.position[1] + other.size[1] / 2 >= p.position[1] - p.size[1] / 2 - 1 &&
        other.position[1] < p.position[1]
      )
      if (!hasSupport) {
        fixCount++
        return { ...p, position: [p.position[0], groundLevel + p.size[1] / 2, p.position[2]] as [number, number, number] }
      }
    }
    return p
  })

  return {
    parts: fixed,
    result: {
      rule: 'no_floating',
      passed: fixCount === 0,
      severity: 'major',
      message: fixCount > 0 ? `Grounded ${fixCount} floating parts` : 'All parts properly supported',
      autoFixed: fixCount > 0,
      partsAdded: 0,
      partsModified: fixCount,
    },
  }
}

// ─── Rule 3: Color variation ──────────────────────────────────────────────

function checkAndFixColors(parts: BuildPart[]): { parts: BuildPart[]; result: RuleResult } {
  if (parts.length < 5) return { parts, result: { rule: 'color_variation', passed: true, severity: 'minor', message: 'Too few parts to check', autoFixed: false, partsAdded: 0, partsModified: 0 } }

  const colorKey = (c: [number, number, number]) => `${c[0]},${c[1]},${c[2]}`
  const uniqueColors = new Set(parts.map(p => colorKey(p.color)))
  const ratio = uniqueColors.size / parts.length

  if (ratio >= 0.15) {
    return { parts, result: { rule: 'color_variation', passed: true, severity: 'minor', message: `${uniqueColors.size} unique colors (${(ratio * 100).toFixed(0)}%)`, autoFixed: false, partsAdded: 0, partsModified: 0 } }
  }

  // Inject variation: ±8 RGB on each part
  let modCount = 0
  const fixed = parts.map(p => {
    const v = 8
    modCount++
    return {
      ...p,
      color: [
        clamp(p.color[0] + Math.floor((Math.random() - 0.5) * v * 2), 0, 255),
        clamp(p.color[1] + Math.floor((Math.random() - 0.5) * v * 2), 0, 255),
        clamp(p.color[2] + Math.floor((Math.random() - 0.5) * v * 2), 0, 255),
      ] as [number, number, number],
    }
  })

  return {
    parts: fixed,
    result: {
      rule: 'color_variation',
      passed: false,
      severity: 'minor',
      message: `Only ${uniqueColors.size} unique colors — injected variation on ${modCount} parts`,
      autoFixed: true,
      partsAdded: 0,
      partsModified: modCount,
    },
  }
}

// ─── Rule 4: Trim on buildings ────────────────────────────────────────────

function checkAndFixTrim(parts: BuildPart[], category: string): { parts: BuildPart[]; result: RuleResult } {
  if (!/(build|house|shop|castle|mansion|cabin|store|office|hotel)/i.test(category)) {
    return { parts, result: { rule: 'trim_required', passed: true, severity: 'minor', message: 'Non-building category — skipped', autoFixed: false, partsAdded: 0, partsModified: 0 } }
  }

  const walls = parts.filter(p => /wall/i.test(p.name) && p.size[1] > 3)
  const hasBaseboards = parts.some(p => /baseboard|base_trim|trim_bot/i.test(p.name))

  if (hasBaseboards || walls.length === 0) {
    return { parts, result: { rule: 'trim_required', passed: true, severity: 'minor', message: 'Trim present or no walls', autoFixed: false, partsAdded: 0, partsModified: 0 } }
  }

  // Add baseboards along each wall
  const added: BuildPart[] = []
  for (const wall of walls.slice(0, 8)) {
    const wallBottom = wall.position[1] - wall.size[1] / 2
    added.push({
      name: `baseboard_${wall.name}`,
      size: [wall.size[0] + 0.1, 0.15, wall.size[2] + 0.1],
      position: [wall.position[0], wallBottom + 0.075, wall.position[2]],
      rotation: wall.rotation,
      material: 'Wood',
      color: [80, 55, 25],
    })
  }

  return {
    parts: [...parts, ...added],
    result: {
      rule: 'trim_required',
      passed: false,
      severity: 'minor',
      message: `Added ${added.length} baseboards to ${walls.length} walls`,
      autoFixed: true,
      partsAdded: added.length,
      partsModified: 0,
    },
  }
}

// ─── Rule 5: Lighting required ────────────────────────────────────────────

function checkAndFixLighting(parts: BuildPart[]): { parts: BuildPart[]; result: RuleResult } {
  if (parts.length < 10) return { parts, result: { rule: 'lighting_required', passed: true, severity: 'minor', message: 'Small build — skipped', autoFixed: false, partsAdded: 0, partsModified: 0 } }

  const hasLights = parts.some(p => p.children?.some(c => c.className === 'PointLight' || c.className === 'SpotLight'))
  if (hasLights) return { parts, result: { rule: 'lighting_required', passed: true, severity: 'major', message: 'Lighting present', autoFixed: false, partsAdded: 0, partsModified: 0 } }

  // Find ceiling/roof parts and add lights
  const ceilings = parts.filter(p => /ceil|roof|top/i.test(p.name)).slice(0, 4)
  let modCount = 0

  if (ceilings.length > 0) {
    const fixed = parts.map(p => {
      if (ceilings.includes(p) && !p.children?.length) {
        modCount++
        const light: BuildChild = {
          className: 'PointLight',
          properties: { Brightness: 1.5, Range: 30, Color: [255, 210, 160] },
        }
        return { ...p, children: [...(p.children || []), light] }
      }
      return p
    })
    return { parts: fixed, result: { rule: 'lighting_required', passed: false, severity: 'major', message: `Added PointLights to ${modCount} ceiling parts`, autoFixed: true, partsAdded: 0, partsModified: modCount } }
  }

  // No ceilings found — add light to largest part
  const sorted = [...parts].sort((a, b) => (b.size[0] * b.size[1] * b.size[2]) - (a.size[0] * a.size[1] * a.size[2]))
  const biggest = sorted[0]
  if (biggest) {
    const fixed = parts.map(p => {
      if (p === biggest) {
        const light: BuildChild = { className: 'PointLight', properties: { Brightness: 1, Range: 50, Color: [255, 240, 220] } }
        return { ...p, children: [...(p.children || []), light] }
      }
      return p
    })
    return { parts: fixed, result: { rule: 'lighting_required', passed: false, severity: 'major', message: 'Added ambient light to largest part', autoFixed: true, partsAdded: 0, partsModified: 1 } }
  }

  return { parts, result: { rule: 'lighting_required', passed: false, severity: 'major', message: 'No suitable part for lighting', autoFixed: false, partsAdded: 0, partsModified: 0 } }
}

// ─── Rule 6: Ground required ──────────────────────────────────────────────

function checkAndFixGround(parts: BuildPart[]): { parts: BuildPart[]; result: RuleResult } {
  const hasGround = parts.some(p =>
    GROUND_NAMES.test(p.name) && p.size[0] * p.size[2] > 50
  )

  if (hasGround) return { parts, result: { rule: 'ground_required', passed: true, severity: 'major', message: 'Ground plane present', autoFixed: false, partsAdded: 0, partsModified: 0 } }

  // Compute bounding box and add grass floor
  const minX = Math.min(...parts.map(p => p.position[0] - p.size[0] / 2))
  const maxX = Math.max(...parts.map(p => p.position[0] + p.size[0] / 2))
  const minZ = Math.min(...parts.map(p => p.position[2] - p.size[2] / 2))
  const maxZ = Math.max(...parts.map(p => p.position[2] + p.size[2] / 2))
  const centerX = (minX + maxX) / 2
  const centerZ = (minZ + maxZ) / 2
  const sizeX = Math.max(maxX - minX + 20, 40)
  const sizeZ = Math.max(maxZ - minZ + 20, 40)

  const ground: BuildPart = {
    name: 'ground_plane',
    size: [sizeX, 0.5, sizeZ],
    position: [centerX, -0.25, centerZ],
    rotation: [0, 0, 0],
    material: 'Grass',
    color: [80, 130, 60],
  }

  return {
    parts: [ground, ...parts],
    result: {
      rule: 'ground_required',
      passed: false,
      severity: 'major',
      message: `Added ${sizeX.toFixed(0)}x${sizeZ.toFixed(0)} grass ground plane`,
      autoFixed: true,
      partsAdded: 1,
      partsModified: 0,
    },
  }
}

// ─── Rule 7: Shape variety ────────────────────────────────────────────────

function checkShapeVariety(parts: BuildPart[]): RuleResult {
  if (parts.length < 10) return { rule: 'shape_variety', passed: true, severity: 'minor', message: 'Small build — skipped', autoFixed: false, partsAdded: 0, partsModified: 0 }

  const shapes = new Set(parts.map(p => p.shape || 'Block'))
  if (shapes.size >= 2) {
    return { rule: 'shape_variety', passed: true, severity: 'minor', message: `${shapes.size} shape types: ${[...shapes].join(', ')}`, autoFixed: false, partsAdded: 0, partsModified: 0 }
  }

  return {
    rule: 'shape_variety',
    passed: false,
    severity: 'major',
    message: 'Only Box shapes — needs Wedge/Cylinder/Ball for visual interest. Consider retry.',
    autoFixed: false,
    partsAdded: 0,
    partsModified: 0,
  }
}

// ─── Rule 8: Scale bounds ─────────────────────────────────────────────────

function checkAndFixScale(parts: BuildPart[]): { parts: BuildPart[]; result: RuleResult } {
  let fixCount = 0
  const fixed = parts.map(p => {
    let changed = false
    const size = [...p.size] as [number, number, number]
    for (let i = 0; i < 3; i++) {
      if (size[i] > 200) { size[i] = 200; changed = true }
      if (size[i] < 0.1) { size[i] = 0.1; changed = true }
    }
    if (changed) { fixCount++; return { ...p, size } }
    return p
  })

  return {
    parts: fixed,
    result: {
      rule: 'scale_bounds',
      passed: fixCount === 0,
      severity: 'critical',
      message: fixCount > 0 ? `Clamped ${fixCount} parts to 0.1-200 stud range` : 'All parts within scale bounds',
      autoFixed: fixCount > 0,
      partsAdded: 0,
      partsModified: fixCount,
    },
  }
}

// ─── Main Entry Point ─────────────────────────────────────────────────────

/**
 * Run all 8 anti-ugly rules on a BuildPart[] array.
 * Returns fixed parts + quality score + rule results.
 */
export function antiUglyCheck(parts: BuildPart[], category: string = 'building'): AntiUglyResult {
  const originalCount = parts.length
  const rules: RuleResult[] = []
  let current = [...parts]

  // Rule 8 first (scale) — prevents downstream math issues
  const r8 = checkAndFixScale(current); current = r8.parts; rules.push(r8.result)

  // Rule 2: floating parts
  const r2 = checkAndFixFloating(current); current = r2.parts; rules.push(r2.result)

  // Rule 6: ground
  const r6 = checkAndFixGround(current); current = r6.parts; rules.push(r6.result)

  // Rule 1: single shapes
  const r1 = checkAndFixSingleShapes(current); current = r1.parts; rules.push(r1.result)

  // Rule 3: color variation
  const r3 = checkAndFixColors(current); current = r3.parts; rules.push(r3.result)

  // Rule 4: trim
  const r4 = checkAndFixTrim(current, category); current = r4.parts; rules.push(r4.result)

  // Rule 5: lighting
  const r5 = checkAndFixLighting(current); current = r5.parts; rules.push(r5.result)

  // Rule 7: shape variety (check only, no auto-fix)
  rules.push(checkShapeVariety(current))

  // Score calculation
  let score = 100
  for (const r of rules) {
    if (!r.passed && !r.autoFixed) {
      if (r.severity === 'critical') score -= 25
      else if (r.severity === 'major') score -= 15
      else score -= 5
    } else if (!r.passed && r.autoFixed) {
      // Reduced penalty for auto-fixed issues
      if (r.severity === 'critical') score -= 5
      else if (r.severity === 'major') score -= 3
    }
  }
  score = Math.max(0, Math.min(100, score))

  const needsRetry = score < 40 && rules.some(r => !r.passed && !r.autoFixed && r.severity !== 'minor')
  const retryInstructions = needsRetry
    ? `The build failed visual quality checks:\n${rules.filter(r => !r.passed && !r.autoFixed).map(r => `- ${r.message}`).join('\n')}\nPlease regenerate with: more shape variety (use WedgeParts for roofs, Cylinders for columns, Balls for foliage), proper grounding, and color variation.`
    : null

  console.log(`[AntiUgly] Score: ${score}/100 | ${originalCount}→${current.length} parts | ${rules.filter(r => r.autoFixed).length} auto-fixes`)

  return {
    passed: score >= 60,
    score,
    originalPartCount: originalCount,
    fixedPartCount: current.length,
    rules,
    fixedParts: current,
    retryNeeded: needsRetry,
    retryInstructions,
  }
}
