/**
 * anti-ugly.ts — Visual quality enforcer for ForjeGames builds.
 *
 * Runs 16 rules on every build BEFORE it reaches Studio.
 * Auto-fixes most issues. Scores 0-100. Minimum 60 to pass.
 *
 * Rules:
 *  1. No single-shape objects (1 ball → 3-5 balls)
 *  2. No floating parts (sink to ground)
 *  3. Color variation (inject ±8 RGB on repeated colors)
 *  4. Trim on buildings (baseboards + crown molding)
 *  5. Lighting required (PointLights)
 *  6. Ground required (floor plane)
 *  7. Shape variety (flag all-box builds)
 *  8. Scale bounds (clamp 0.1-200 studs)
 *  9. No Z-fighting (coplanar overlapping faces → nudge 0.05)
 * 10. No gaps (adjacent parts with > 0.1 stud gap → extend)
 * 11. Minimum colors (buildings need 3+ distinct colors)
 * 12. No giant parts (> 100 studs → split into 2-4 smaller parts)
 * 13. Proper proportions (doors/windows/ceilings in expected ranges)
 * 14. Has roof (building-category builds need a roof)
 * 15. No default grey (rgb~163,162,165 → contextual color by material)
 * 16. Symmetry check (if symmetric build, verify both sides match)
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
  | 'no_z_fighting'
  | 'no_gaps'
  | 'minimum_colors'
  | 'no_giant_parts'
  | 'proper_proportions'
  | 'has_roof'
  | 'no_default_grey'
  | 'symmetry'

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

// ─── Rule 9: No Z-Fighting ────────────────────────────────────────────────
// Detect pairs of parts whose faces are nearly coplanar and overlap in area.
// Nudge one part 0.05 studs away along the axis of conflict to resolve it.

function checkAndFixZFighting(parts: BuildPart[]): { parts: BuildPart[]; result: RuleResult } {
  // Track which parts need nudging (by index) and on which axis/direction
  const nudges: Map<number, [number, number, number]> = new Map()

  for (let i = 0; i < parts.length; i++) {
    for (let j = i + 1; j < parts.length; j++) {
      const a = parts[i]
      const b = parts[j]

      // Check each axis for coplanar face overlap
      for (let axis = 0; axis < 3; axis++) {
        const aMin = a.position[axis] - a.size[axis] / 2
        const aMax = a.position[axis] + a.size[axis] / 2
        const bMin = b.position[axis] - b.size[axis] / 2
        const bMax = b.position[axis] + b.size[axis] / 2

        // Faces are coplanar if aMax ≈ bMin or bMax ≈ aMin (within 0.02 studs)
        const faceOverlapAB = Math.abs(aMax - bMin) < 0.02
        const faceOverlapBA = Math.abs(bMax - aMin) < 0.02
        if (!faceOverlapAB && !faceOverlapBA) continue

        // Check if they actually overlap in the other two axes (i.e. faces share area)
        const ax1 = (axis + 1) % 3
        const ax2 = (axis + 2) % 3
        const overlapAx1 =
          a.position[ax1] - a.size[ax1] / 2 < b.position[ax1] + b.size[ax1] / 2 &&
          b.position[ax1] - b.size[ax1] / 2 < a.position[ax1] + a.size[ax1] / 2
        const overlapAx2 =
          a.position[ax2] - a.size[ax2] / 2 < b.position[ax2] + b.size[ax2] / 2 &&
          b.position[ax2] - b.size[ax2] / 2 < a.position[ax2] + a.size[ax2] / 2

        if (overlapAx1 && overlapAx2) {
          // Z-fighting detected — nudge part j by +0.05 on this axis
          if (!nudges.has(j)) {
            const nudge: [number, number, number] = [0, 0, 0]
            nudge[axis] = faceOverlapAB ? 0.05 : -0.05
            nudges.set(j, nudge)
          }
        }
      }
    }
  }

  if (nudges.size === 0) {
    return {
      parts,
      result: {
        rule: 'no_z_fighting',
        passed: true,
        severity: 'minor',
        message: 'No Z-fighting detected',
        autoFixed: false,
        partsAdded: 0,
        partsModified: 0,
      },
    }
  }

  const fixed = parts.map((p, i) => {
    const nudge = nudges.get(i)
    if (!nudge) return p
    return {
      ...p,
      position: [
        p.position[0] + nudge[0],
        p.position[1] + nudge[1],
        p.position[2] + nudge[2],
      ] as [number, number, number],
    }
  })

  return {
    parts: fixed,
    result: {
      rule: 'no_z_fighting',
      passed: false,
      severity: 'minor',
      message: `Fixed Z-fighting on ${nudges.size} parts (nudged 0.05 studs)`,
      autoFixed: true,
      partsAdded: 0,
      partsModified: nudges.size,
    },
  }
}

// ─── Rule 10: No Gaps ────────────────────────────────────────────────────────
// Detect gaps > 0.1 studs between adjacent parts that should touch.
// Only checks parts at roughly the same Y level (same floor tier).
// Auto-fix: extend the smaller part to close the gap.

function checkAndFixGaps(parts: BuildPart[]): { parts: BuildPart[]; result: RuleResult } {
  // Group parts by floor tier (Y within 1 stud of each other)
  const FLOOR_TOLERANCE = 1
  const GAP_THRESHOLD = 0.1
  const MAX_GAP_TO_FIX = 2.0 // Only fix gaps up to 2 studs — larger = intentional

  let fixCount = 0
  const fixed = [...parts]

  for (let i = 0; i < fixed.length; i++) {
    for (let j = i + 1; j < fixed.length; j++) {
      const a = fixed[i]
      const b = fixed[j]

      // Must be on same floor tier
      if (Math.abs(a.position[1] - b.position[1]) > FLOOR_TOLERANCE) continue

      // Check X-axis gap
      const aMaxX = a.position[0] + a.size[0] / 2
      const bMinX = b.position[0] - b.size[0] / 2
      const aMinX = a.position[0] - a.size[0] / 2
      const bMaxX = b.position[0] + b.size[0] / 2

      // Parts are adjacent along X if Z ranges overlap
      const zOverlap =
        a.position[2] - a.size[2] / 2 < b.position[2] + b.size[2] / 2 &&
        b.position[2] - b.size[2] / 2 < a.position[2] + a.size[2] / 2

      if (zOverlap) {
        // Gap from A→B on X axis
        const gapAB_X = bMinX - aMaxX
        if (gapAB_X > GAP_THRESHOLD && gapAB_X < MAX_GAP_TO_FIX) {
          // Extend the smaller part (a) to close the gap
          if (a.size[0] <= b.size[0]) {
            const newSizeX = a.size[0] + gapAB_X
            fixed[i] = { ...a, size: [newSizeX, a.size[1], a.size[2]], position: [a.position[0] + gapAB_X / 2, a.position[1], a.position[2]] }
            fixCount++
          } else {
            const newSizeX = b.size[0] + gapAB_X
            fixed[j] = { ...b, size: [newSizeX, b.size[1], b.size[2]], position: [b.position[0] - gapAB_X / 2, b.position[1], b.position[2]] }
            fixCount++
          }
          continue
        }
        // Gap from B→A on X axis
        const gapBA_X = aMinX - bMaxX
        if (gapBA_X > GAP_THRESHOLD && gapBA_X < MAX_GAP_TO_FIX) {
          if (b.size[0] <= a.size[0]) {
            const newSizeX = b.size[0] + gapBA_X
            fixed[j] = { ...b, size: [newSizeX, b.size[1], b.size[2]], position: [b.position[0] + gapBA_X / 2, b.position[1], b.position[2]] }
            fixCount++
          } else {
            const newSizeX = a.size[0] + gapBA_X
            fixed[i] = { ...a, size: [newSizeX, a.size[1], a.size[2]], position: [a.position[0] - gapBA_X / 2, a.position[1], a.position[2]] }
            fixCount++
          }
          continue
        }
      }

      // Check Z-axis gap
      const aMaxZ = a.position[2] + a.size[2] / 2
      const bMinZ = b.position[2] - b.size[2] / 2
      const aMinZ = a.position[2] - a.size[2] / 2
      const bMaxZ = b.position[2] + b.size[2] / 2

      const xOverlap =
        a.position[0] - a.size[0] / 2 < b.position[0] + b.size[0] / 2 &&
        b.position[0] - b.size[0] / 2 < a.position[0] + a.size[0] / 2

      if (xOverlap) {
        const gapAB_Z = bMinZ - aMaxZ
        if (gapAB_Z > GAP_THRESHOLD && gapAB_Z < MAX_GAP_TO_FIX) {
          if (a.size[2] <= b.size[2]) {
            const newSizeZ = a.size[2] + gapAB_Z
            fixed[i] = { ...a, size: [a.size[0], a.size[1], newSizeZ], position: [a.position[0], a.position[1], a.position[2] + gapAB_Z / 2] }
            fixCount++
          } else {
            const newSizeZ = b.size[2] + gapAB_Z
            fixed[j] = { ...b, size: [b.size[0], b.size[1], newSizeZ], position: [b.position[0], b.position[1], b.position[2] - gapAB_Z / 2] }
            fixCount++
          }
          continue
        }
        const gapBA_Z = aMinZ - bMaxZ
        if (gapBA_Z > GAP_THRESHOLD && gapBA_Z < MAX_GAP_TO_FIX) {
          if (b.size[2] <= a.size[2]) {
            const newSizeZ = b.size[2] + gapBA_Z
            fixed[j] = { ...b, size: [b.size[0], b.size[1], newSizeZ], position: [b.position[0], b.position[1], b.position[2] + gapBA_Z / 2] }
            fixCount++
          } else {
            const newSizeZ = a.size[2] + gapBA_Z
            fixed[i] = { ...a, size: [a.size[0], a.size[1], newSizeZ], position: [a.position[0], a.position[1], a.position[2] - gapBA_Z / 2] }
            fixCount++
          }
        }
      }
    }
  }

  return {
    parts: fixed,
    result: {
      rule: 'no_gaps',
      passed: fixCount === 0,
      severity: 'major',
      message: fixCount > 0 ? `Closed ${fixCount} gaps between adjacent parts` : 'No structural gaps detected',
      autoFixed: fixCount > 0,
      partsAdded: 0,
      partsModified: fixCount,
    },
  }
}

// ─── Rule 11: Minimum Colors ──────────────────────────────────────────────
// Buildings with 20+ parts need at least 3 distinct colors.
// Check only — no auto-fix (color choice is semantic, AI should retry).

function checkMinimumColors(parts: BuildPart[]): RuleResult {
  if (parts.length < 20) {
    return { rule: 'minimum_colors', passed: true, severity: 'major', message: 'Build too small for color check', autoFixed: false, partsAdded: 0, partsModified: 0 }
  }

  // Two colors are "distinct" if they differ by more than 20 in any channel
  const DISTINCT_THRESHOLD = 20
  const palette: [number, number, number][] = []

  for (const p of parts) {
    const isNew = palette.every(c =>
      Math.abs(c[0] - p.color[0]) > DISTINCT_THRESHOLD ||
      Math.abs(c[1] - p.color[1]) > DISTINCT_THRESHOLD ||
      Math.abs(c[2] - p.color[2]) > DISTINCT_THRESHOLD
    )
    if (isNew) palette.push(p.color)
  }

  const MIN_COLORS = 3
  if (palette.length >= MIN_COLORS) {
    return {
      rule: 'minimum_colors',
      passed: true,
      severity: 'major',
      message: `${palette.length} distinct colors found (minimum ${MIN_COLORS})`,
      autoFixed: false,
      partsAdded: 0,
      partsModified: 0,
    }
  }

  return {
    rule: 'minimum_colors',
    passed: false,
    severity: 'major',
    message: `Only ${palette.length} distinct color(s) across ${parts.length} parts — needs at least ${MIN_COLORS}. Consider retry with varied palette.`,
    autoFixed: false,
    partsAdded: 0,
    partsModified: 0,
  }
}

// ─── Rule 12: No Giant Parts ──────────────────────────────────────────────
// Any single part > 100 studs in any dimension looks bad and lacks detail.
// Auto-fix: split along the longest axis into 2-4 smaller parts.

function checkAndFixGiantParts(parts: BuildPart[]): { parts: BuildPart[]; result: RuleResult } {
  const GIANT_THRESHOLD = 100
  const result: BuildPart[] = []
  let splitCount = 0
  let addedCount = 0

  for (const p of parts) {
    const maxDim = Math.max(p.size[0], p.size[1], p.size[2])
    if (maxDim <= GIANT_THRESHOLD) {
      result.push(p)
      continue
    }

    // Find longest axis and split into 3 parts along it
    const axis = p.size[0] >= p.size[1] && p.size[0] >= p.size[2] ? 0 : p.size[1] >= p.size[2] ? 1 : 2
    const segments = maxDim > 200 ? 4 : maxDim > 150 ? 3 : 2
    const segSize = p.size[axis] / segments

    for (let s = 0; s < segments; s++) {
      const offset = -p.size[axis] / 2 + segSize * s + segSize / 2
      const pos: [number, number, number] = [...p.position] as [number, number, number]
      pos[axis] = p.position[axis] + offset

      const size: [number, number, number] = [...p.size] as [number, number, number]
      size[axis] = segSize

      // Slight color variation between segments for visual interest
      const colorVariant: [number, number, number] = [
        clamp(p.color[0] + Math.floor((Math.random() - 0.5) * 10), 0, 255),
        clamp(p.color[1] + Math.floor((Math.random() - 0.5) * 10), 0, 255),
        clamp(p.color[2] + Math.floor((Math.random() - 0.5) * 10), 0, 255),
      ]

      result.push({
        ...p,
        name: `${p.name}_seg${s + 1}`,
        size,
        position: pos,
        color: colorVariant,
      })
    }

    splitCount++
    addedCount += segments - 1 // net new parts (original replaced by segments)
  }

  return {
    parts: result,
    result: {
      rule: 'no_giant_parts',
      passed: splitCount === 0,
      severity: 'major',
      message: splitCount > 0 ? `Split ${splitCount} giant parts (>${GIANT_THRESHOLD} studs) into smaller segments (+${addedCount} parts)` : 'No oversized parts found',
      autoFixed: splitCount > 0,
      partsAdded: addedCount,
      partsModified: splitCount,
    },
  }
}

// ─── Rule 13: Proper Proportions ─────────────────────────────────────────
// Doors: ~3-4 wide x 6-7 tall. Windows: height 3-6. Ceilings: 10-12 high.
// Check only — these are semantic, AI should fix on retry.

function checkProperProportions(parts: BuildPart[]): RuleResult {
  const issues: string[] = []

  for (const p of parts) {
    const name = p.name.toLowerCase()

    // Door checks: width 2-6, height 5-9
    if (/\bdoor\b/.test(name)) {
      const w = Math.min(p.size[0], p.size[2]) // smaller horizontal = width
      const h = p.size[1]
      if (w < 1.5 || w > 8) issues.push(`${p.name}: door width ${w.toFixed(1)} (expected 2-6)`)
      if (h < 4 || h > 10) issues.push(`${p.name}: door height ${h.toFixed(1)} (expected 5-9)`)
    }

    // Window checks: Y position 3-8 above floor
    if (/\bwindow\b/.test(name)) {
      const yBottom = p.position[1] - p.size[1] / 2
      if (yBottom < 1.5 || yBottom > 9) {
        issues.push(`${p.name}: window bottom at Y=${yBottom.toFixed(1)} (expected eye-level 2-8)`)
      }
    }

    // Ceiling checks: large flat horizontal part, Y position reasonable
    if (/\bceil(ing)?\b/.test(name)) {
      const h = p.position[1]
      if (h < 6 || h > 18) {
        issues.push(`${p.name}: ceiling at Y=${h.toFixed(1)} (expected 8-16 for standard rooms)`)
      }
    }
  }

  if (issues.length === 0) {
    return { rule: 'proper_proportions', passed: true, severity: 'minor', message: 'All proportions within expected ranges', autoFixed: false, partsAdded: 0, partsModified: 0 }
  }

  return {
    rule: 'proper_proportions',
    passed: false,
    severity: 'minor',
    message: `${issues.length} proportion issue(s): ${issues.slice(0, 3).join(' | ')}${issues.length > 3 ? ` (+${issues.length - 3} more)` : ''}`,
    autoFixed: false,
    partsAdded: 0,
    partsModified: 0,
  }
}

// ─── Rule 14: Has Roof ────────────────────────────────────────────────────
// Building-category builds need a roof: parts near the top, roughly horizontal.
// Check only — adding a generic roof shape would look worse than retrying.

function checkHasRoof(parts: BuildPart[], category: string): RuleResult {
  if (!/(build|house|shop|castle|mansion|cabin|store|office|hotel|home|barn|tower)/i.test(category)) {
    return { rule: 'has_roof', passed: true, severity: 'major', message: 'Non-building category — roof check skipped', autoFixed: false, partsAdded: 0, partsModified: 0 }
  }

  if (parts.length < 8) {
    return { rule: 'has_roof', passed: true, severity: 'major', message: 'Build too small for roof check', autoFixed: false, partsAdded: 0, partsModified: 0 }
  }

  // Find the vertical extent of the build
  const maxY = Math.max(...parts.map(p => p.position[1] + p.size[1] / 2))
  const minY = Math.min(...parts.map(p => p.position[1] - p.size[1] / 2))
  const buildHeight = maxY - minY

  // Check if any part name explicitly says roof or matches wedge shape near the top
  const hasExplicitRoof = parts.some(p =>
    /\broof\b|\brooftop\b|\bgable\b|\btile_top\b/i.test(p.name)
  )

  // Structural heuristic: look for wide flat parts in the upper 25% of the build
  const topZone = minY + buildHeight * 0.72
  const roofCandidate = parts.some(p => {
    const isNearTop = p.position[1] > topZone
    const isHorizontal = p.size[0] > p.size[1] * 2 || p.size[2] > p.size[1] * 2
    const isWide = p.size[0] > 4 || p.size[2] > 4
    return isNearTop && isHorizontal && isWide
  })

  if (hasExplicitRoof || roofCandidate) {
    return { rule: 'has_roof', passed: true, severity: 'major', message: 'Roof structure detected', autoFixed: false, partsAdded: 0, partsModified: 0 }
  }

  return {
    rule: 'has_roof',
    passed: false,
    severity: 'major',
    message: `Building (${buildHeight.toFixed(0)} studs tall) appears to have no roof — consider WedgeParts or flat cap. Retry recommended.`,
    autoFixed: false,
    partsAdded: 0,
    partsModified: 0,
  }
}

// ─── Rule 15: No Default Grey ─────────────────────────────────────────────
// Default Roblox grey is rgb(163,162,165) — flags and replaces it.
// Replacement color is contextual based on material.

const DEFAULT_GREY: [number, number, number] = [163, 162, 165]
const GREY_TOLERANCE = 5

const MATERIAL_COLORS: Record<string, [number, number, number]> = {
  Wood:     [130,  85,  40],
  Metal:    [120, 120, 125],
  Brick:    [160,  90,  70],
  Concrete: [155, 155, 155],
  Grass:    [ 80, 130,  60],
  Sand:     [210, 185, 140],
  Marble:   [235, 230, 225],
  Slate:    [ 80,  80,  85],
  Cobblestone: [130, 120, 110],
  SmoothPlastic: [140, 130, 120], // fallback for anything else
}

function isDefaultGrey(color: [number, number, number]): boolean {
  return (
    Math.abs(color[0] - DEFAULT_GREY[0]) <= GREY_TOLERANCE &&
    Math.abs(color[1] - DEFAULT_GREY[1]) <= GREY_TOLERANCE &&
    Math.abs(color[2] - DEFAULT_GREY[2]) <= GREY_TOLERANCE
  )
}

function checkAndFixDefaultGrey(parts: BuildPart[]): { parts: BuildPart[]; result: RuleResult } {
  let fixCount = 0

  const fixed = parts.map(p => {
    if (!isDefaultGrey(p.color)) return p
    const mat = p.material ?? 'SmoothPlastic'
    const replacement = MATERIAL_COLORS[mat] ?? MATERIAL_COLORS['SmoothPlastic']
    // Add subtle random variation so parts don't all look identical
    const varied: [number, number, number] = [
      clamp(replacement[0] + Math.floor((Math.random() - 0.5) * 12), 0, 255),
      clamp(replacement[1] + Math.floor((Math.random() - 0.5) * 12), 0, 255),
      clamp(replacement[2] + Math.floor((Math.random() - 0.5) * 12), 0, 255),
    ]
    fixCount++
    return { ...p, color: varied }
  })

  return {
    parts: fixed,
    result: {
      rule: 'no_default_grey',
      passed: fixCount === 0,
      severity: 'minor',
      message: fixCount > 0 ? `Replaced default Roblox grey on ${fixCount} part(s) with material-contextual colors` : 'No default grey parts found',
      autoFixed: fixCount > 0,
      partsAdded: 0,
      partsModified: fixCount,
    },
  }
}

// ─── Rule 16: Symmetry Check ─────────────────────────────────────────────
// If a build appears to be symmetric (many parts on both sides of center),
// verify that both sides actually match. Flag if there's a clear imbalance.
// Check only — auto-fixing symmetry would require semantic reasoning.

function checkSymmetry(parts: BuildPart[]): RuleResult {
  if (parts.length < 12) {
    return { rule: 'symmetry', passed: true, severity: 'minor', message: 'Build too small for symmetry check', autoFixed: false, partsAdded: 0, partsModified: 0 }
  }

  // Calculate center of mass
  const comX = parts.reduce((sum, p) => sum + p.position[0], 0) / parts.length
  const comZ = parts.reduce((sum, p) => sum + p.position[2], 0) / parts.length

  // Count parts in each quadrant relative to center of mass
  let leftX = 0, rightX = 0, frontZ = 0, backZ = 0
  for (const p of parts) {
    if (p.position[0] < comX - 0.5) leftX++
    else if (p.position[0] > comX + 0.5) rightX++
    if (p.position[2] < comZ - 0.5) frontZ++
    else if (p.position[2] > comZ + 0.5) backZ++
  }

  // If the build has very few parts on one side vs the other, it may be unintentionally asymmetric
  const SYMMETRY_THRESHOLD = 0.35 // sides should be within 35% of each other to consider symmetric intent

  const xImbalance = Math.abs(leftX - rightX) / Math.max(leftX + rightX, 1)
  const zImbalance = Math.abs(frontZ - backZ) / Math.max(frontZ + backZ, 1)

  // Only flag if build is mostly on one side (clearly intended symmetric but isn't)
  const looksSymmetricX = leftX > 3 && rightX > 3
  const looksSymmetricZ = frontZ > 3 && backZ > 3

  const issues: string[] = []
  if (looksSymmetricX && xImbalance > SYMMETRY_THRESHOLD) {
    issues.push(`X-axis: ${leftX} parts left vs ${rightX} parts right (${(xImbalance * 100).toFixed(0)}% imbalance)`)
  }
  if (looksSymmetricZ && zImbalance > SYMMETRY_THRESHOLD) {
    issues.push(`Z-axis: ${frontZ} parts front vs ${backZ} parts back (${(zImbalance * 100).toFixed(0)}% imbalance)`)
  }

  if (issues.length === 0) {
    return { rule: 'symmetry', passed: true, severity: 'minor', message: `Symmetry acceptable (X: ${leftX}L/${rightX}R, Z: ${frontZ}F/${backZ}B)`, autoFixed: false, partsAdded: 0, partsModified: 0 }
  }

  return {
    rule: 'symmetry',
    passed: false,
    severity: 'minor',
    message: `Possible unintentional asymmetry — ${issues.join(' | ')}. Verify this is intentional.`,
    autoFixed: false,
    partsAdded: 0,
    partsModified: 0,
  }
}

// ─── Main Entry Point ─────────────────────────────────────────────────────

/**
 * Run all 16 anti-ugly rules on a BuildPart[] array.
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

  // ── Rules 9-16 (new) ────────────────────────────────────────────────────

  // Rule 9: Z-fighting
  const r9 = checkAndFixZFighting(current); current = r9.parts; rules.push(r9.result)

  // Rule 10: gaps
  const r10 = checkAndFixGaps(current); current = r10.parts; rules.push(r10.result)

  // Rule 11: minimum colors (check only)
  rules.push(checkMinimumColors(current))

  // Rule 12: giant parts
  const r12 = checkAndFixGiantParts(current); current = r12.parts; rules.push(r12.result)

  // Rule 13: proper proportions (check only)
  rules.push(checkProperProportions(current))

  // Rule 14: has roof (check only)
  rules.push(checkHasRoof(current, category))

  // Rule 15: no default grey
  const r15 = checkAndFixDefaultGrey(current); current = r15.parts; rules.push(r15.result)

  // Rule 16: symmetry (check only)
  rules.push(checkSymmetry(current))

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

  console.log(`[AntiUgly] Score: ${score}/100 | ${originalCount}→${current.length} parts | ${rules.filter(r => r.autoFixed).length}/${rules.length} rules auto-fixed`)

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
