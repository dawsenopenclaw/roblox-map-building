/**
 * focused-prompt.ts — Smart prompt injection
 *
 * Instead of dumping 955 lines of build instructions into EVERY request,
 * this module detects what the user wants and injects ONLY the relevant
 * sections. A "build a traffic cone" gets 50 lines. A "build a full
 * game world" gets 300 lines. The AI's attention stays focused.
 *
 * Also provides category-specific few-shot examples so the AI copies
 * the RIGHT pattern for what's being built.
 */

import 'server-only'

// ─── Request type detection ─────────────────────────────────────────────────

export type BuildScale = 'prop' | 'furniture' | 'vehicle' | 'building' | 'scene' | 'map' | 'world'

export function detectBuildScale(message: string): BuildScale {
  const lower = message.toLowerCase()
  if (/\b(world|full map|town|city|village|neighborhood|district|open world)\b/.test(lower)) return 'world'
  if (/\b(game map|map|lobby|hub|spawn area|plaza|arena|zone)\b/.test(lower)) return 'map'
  if (/\b(scene|environment|landscape|park|garden|yard|courtyard)\b/.test(lower)) return 'scene'
  if (/\b(house|building|castle|shop|store|barn|school|hospital|tower|mansion|cottage|cabin|temple|church|warehouse|factory|office)\b/.test(lower)) return 'building'
  if (/\b(car|truck|boat|ship|airplane|helicopter|vehicle|motorcycle|bike|kart|train)\b/.test(lower)) return 'vehicle'
  if (/\b(table|chair|bed|desk|couch|shelf|lamp|bench|throne|counter|cabinet|wardrobe)\b/.test(lower)) return 'furniture'
  return 'prop' // default for small items
}

// ─── Part count targets per scale ───────────────────────────────────────────

export function getPartTargets(scale: BuildScale): { min: number; target: number; max: number } {
  switch (scale) {
    case 'prop': return { min: 8, target: 15, max: 40 }
    case 'furniture': return { min: 10, target: 20, max: 50 }
    case 'vehicle': return { min: 20, target: 40, max: 80 }
    case 'building': return { min: 60, target: 150, max: 400 }
    case 'scene': return { min: 80, target: 200, max: 500 }
    case 'map': return { min: 150, target: 400, max: 2000 }
    case 'world': return { min: 300, target: 1000, max: 10000 }
  }
}

// ─── Category-specific few-shot examples ────────────────────────────────────
// These are SHORT, focused examples that show the AI exactly what to produce.
// Much more effective than one giant generic example.

const EXAMPLES: Record<string, string> = {
  building_house: `-- EXAMPLE PATTERN: Detailed house (exterior-first, 80+ parts)
-- Foundation (layered) + 4 walls with corner posts + crown trim
-- Front wall split for door gap + door frame + door panel + knob + overhang + steps
-- Windows: glass + 4-piece frame + mullion + sill (use loop for identical windows)
-- Gable roof: W() + W(..., 180) + ridge beam + fascia boards
-- Chimney with cap + pot
-- Exterior: pathway, fence (loop), trees (Cyl+Ball), lamp post, bushes
-- Interaction zone: Neon circle pad + SurfaceGui label + ProximityPrompt in front
-- AAA lighting: Future technology + Atmosphere + Bloom + ColorCorrection
-- GLOW WINDOWS: SpotLight behind Glass pointing outward = looks inhabited
-- USE FOR LOOPS for: fence posts, identical windows, floor tiles`,

  building_castle: `-- EXAMPLE PATTERN: Castle (150+ parts with loops)
-- Layered circular foundation (3 concentric layers, each narrower)
-- 4 corner towers: each = Cyl base + crenellation top (loop for 8 merlons per tower)
-- Curtain walls between towers (use loop: 4 walls with arrow slits every 6 studs)
-- Main gate: arch (2 pillars + beam) + portcullis (grid of vertical bars via loop)
-- Keep/main building: layered walls + buttresses + windows with frames
-- Courtyard: Cobblestone floor tiles (loop), well (Cyl+Cyl+crossbar), training dummy
-- Watchtower with spiral stair (steps via loop, incrementing Y and rotating angle)
-- Torches on walls (Fire VFX + PointLight, placed via loop every 8 studs)
-- Banners/flags: thin colored Parts on poles
-- Terrain: FillBlock for moat (Water material) + FillBall for surrounding hills`,

  building_shop: `-- EXAMPLE PATTERN: Shop/Store (exterior-first, 40-80 parts)
-- Facade-only (no interior needed) — interaction zone opens shop UI
-- Foundation + floor + 3 walls (back + sides) + front wall with door gap
-- Large display window: floor-to-ceiling Glass + frame + window display shelf inside
-- Colored awning: Fabric material, extends 3 studs, 2 support brackets
-- Hanging sign: bracket (L-shape Parts) + sign Part + SurfaceGui with shop name
-- Door with frame + handle + ProximityPrompt "Open Shop"
-- Roof with slight overhang + fascia
-- Exterior: A-frame sidewalk sign, potted plants, lamp, bench nearby
-- Interaction zone: Neon circle (6 stud diam) in front of door
-- Window glow: SpotLight behind glass pointing outward (warm, inhabited look)`,

  map: `-- EXAMPLE PATTERN: Game map (300+ parts using loops)
-- Terrain: FillBlock grass base (300x300) + FillBall hills + FillBlock water/sand
-- Central plaza: layered Cyl foundation (3 layers) + rim stones (loop, 16 stones)
-- Fountain at center: basin + inner + water (Glass) + pillar + top ball
-- 4 paths radiating outward: alternating tile colors via loop (12 tiles per path)
-- Path edge trim: gold Neon strips along path sides
-- Street lamps: positions table + loop (12 lamps x 3 parts each + PointLight)
-- Benches: positions table + loop (6 benches x 4 parts each)
-- Trees: positions table + loop (10 trees, randomized height/canopy size)
-- Bushes: loop (15 scattered green Balls with size variation)
-- Flowers: loop (24 along path edges, 6 color variants cycling)
-- 2-3 buildings as facade shells (each 15-25 parts + interaction zone)
-- Perimeter fence: loop (40 posts + rails)
-- AAA lighting stack: Future + Atmosphere + Bloom + CC + SunRays`,

  vehicle: `-- EXAMPLE PATTERN: Vehicle (25-50 parts)
-- Body: main chassis Part + hood + trunk + roof
-- Wheels: 4 Cyl parts, dark rubber color, positioned at corners
-- Windshield: angled Glass Part (transparency 0.3) + frame
-- Windows: side Glass Parts with frames
-- Headlights: 2 small Parts (Neon material, white/yellow) + SpotLight
-- Taillights: 2 small Parts (Neon, red)
-- Bumpers: front + rear, slightly protruding Metal Parts
-- Door lines: thin dark strips on body sides indicating doors
-- Mirrors: 2 small Parts on stalks
-- Interior visible through windows: seats (2 Parts each), steering wheel (Cyl)
-- VehicleSeat for driving (set MaxSpeed, TurnSpeed, Torque)`,

  tree: `-- EXACT TREE PATTERN (DevForum technique — copy this EXACTLY):
-- Step 1: TRUNK = Cylinder, brown, Wood material
Cyl("Trunk", 7, 1.2, 0,4,0, "Wood", 90,62,32)
-- Step 2: CANOPY = 3-5 overlapping Balls at different sizes/positions for full natural shape
Ball("Canopy_Main", 8, 0,9,0, "Grass", 55,120,40)
Ball("Canopy_Left", 6, -2.5,8,1, "Grass", 50,115,38)
Ball("Canopy_Right", 5.5, 2,8.5,-1, "Grass", 60,125,42)
Ball("Canopy_Top", 4, 0.5,11,0.5, "Grass", 52,118,36)
-- Step 3: OPTIONAL BRANCHES = smaller Cylinders angled outward
Cyl("Branch1", 3, 0.4, -2,6,0, "Wood", 85,58,28)
Cyl("Branch2", 2.5, 0.35, 1.5,5.5,1, "Wood", 88,60,30)
-- RESULT: Full, round, natural-looking tree. NEVER use flat Part blocks.
-- For forest: use a loop with randomized heights, canopy sizes, and vc() color variation`,

  prop: `-- EXAMPLE PATTERN: Prop/small object (8-25 parts)
-- Base/stand if applicable
-- Main form using multiple parts (NOT one single Part)
-- Detail parts: handle, knob, label, texture strips
-- Material variety: at least 2 different materials
-- Color variation: vc() on repeated elements
-- Scale relative to character (5.5 studs tall)
-- Anchored = true for static props
-- Trees use Cyl trunk + multiple Ball canopies (see tree pattern)
-- NEVER use flat rectangular Parts for organic shapes`,

  furniture: `-- EXAMPLE PATTERN: Furniture piece (10-30 parts)
-- Main structure (seat/surface/frame)
-- Legs/support (Cyl or thin Parts, 4+ for tables/chairs)
-- Cushions/padding (Fabric material, slightly different color)
-- Hardware: handles, knobs (small Cyl parts)
-- Surface details: drawers (recessed panels), shelves, backing
-- Proportional to character sitting height (seat at Y=2.5)`,
}

// ─── Build the focused prompt ───────────────────────────────────────────────

export function buildFocusedPrompt(message: string): string {
  const scale = detectBuildScale(message)
  const targets = getPartTargets(scale)
  const lower = message.toLowerCase()

  // Pick the best example — match specific objects FIRST
  let exampleKey = scale.toString()
  if (/\b(tree|trees|forest|woods|grove|orchard)\b/i.test(lower)) {
    exampleKey = 'tree' // ALWAYS use the tree pattern for tree requests
  } else if (scale === 'building') {
    if (/castle|fortress|keep|citadel/i.test(lower)) exampleKey = 'building_castle'
    else if (/shop|store|boutique|market|restaurant|cafe/i.test(lower)) exampleKey = 'building_shop'
    else exampleKey = 'building_house'
  } else if (/\b(bush|plant|flower|garden|shrub)\b/i.test(lower)) {
    exampleKey = 'tree' // plants also use Ball shapes
  }
  const example = EXAMPLES[exampleKey] || EXAMPLES.prop

  // Build sections based on scale
  const sections: string[] = []

  // ALWAYS include: part targets and core rules
  sections.push(`
PART TARGETS FOR THIS BUILD: minimum ${targets.min}, target ${targets.target}, up to ${targets.max} parts.
${targets.min >= 60 ? 'USE FOR LOOPS for repeated elements (windows, fence posts, tiles, lamps, trees, flowers).' : ''}
${targets.min >= 150 ? 'USE POSITION TABLES + LOOPS. One loop creating 12 lamps = 36 parts from 6 lines.' : ''}

${example}`)

  // Building-scale+ gets exterior-first rules
  if (['building', 'scene', 'map', 'world'].includes(scale)) {
    sections.push(`
EXTERIOR-FIRST: Buildings are FACADES. Players interact via circle pads, not interiors.
- 90% of parts on exterior detail. Interior ONLY if user explicitly asks.
- Glowing windows (SpotLight behind Glass outward) = looks inhabited without interior
- Interaction zone: Neon circle + SurfaceGui label + ProximityPrompt in front of door
- Facade depth: corner posts, pilasters, cornices, window frames protrude 0.3+
- Layered foundation: 2-3 stepped layers, each narrower than the one below`)
  }

  // Map/world scale gets world-building rules
  if (['map', 'world'].includes(scale)) {
    sections.push(`
MAP COMPOSITION:
- Central hub/focal point at (0,0,0), everything radiates outward
- Cobblestone paths connect zones (alternating tile colors via loop)
- Street lamps every 20-30 studs (positions table + loop)
- Trees every 15-25 studs, bushes between, flowers at path edges
- Terrain ground (FillBlock Grass) — NEVER part-based ground
- AAA lighting ALWAYS (Future + Atmosphere + Bloom + CC + SunRays)
- Boundary fence/hedge via loop at perimeter
- Multiple buildings as facade shells + interaction zones`)
  }

  // Always include terrain + lighting for outdoor builds
  if (['building', 'scene', 'map', 'world'].includes(scale)) {
    sections.push(`
ALWAYS ADD for outdoor builds:
- workspace.Terrain:FillBlock for grass ground
- Atmosphere + Bloom + ColorCorrection + SunRays
- At least 1 tree (Cyl trunk + Ball canopy), bushes nearby
- Pathway leading to main entrance (Cobblestone)`)
  }

  return sections.join('\n')
}
