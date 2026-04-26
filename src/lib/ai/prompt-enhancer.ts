/**
 * prompt-enhancer.ts
 * FREE pre-processing step that uses a fast/cheap AI model (Groq + Llama)
 * to analyze a raw user prompt and produce a structured build plan.
 *
 * This runs BEFORE the expensive Anthropic generation and does NOT cost
 * any user credits. The structured plan dramatically improves the quality
 * of the main AI generation by giving it clear, detailed instructions.
 *
 * Usage:
 *   const plan = await enhancePrompt("make a simulator game")
 *   // plan.enhancedPrompt → detailed rewritten prompt
 *   // plan.steps → ordered build steps
 *   // plan.assets → list of assets to create
 */

import Groq from 'groq-sdk'
import { detectBuildScale, getPartTargets, type BuildScale } from './focused-prompt'

// ─── Types ───────────────────────────────────────────────────────────────────

export type PromptIntent =
  | 'build'
  | 'script'
  | 'terrain'
  | 'ui'
  | 'npc'
  | 'vehicle'
  | 'particle'
  | 'image'
  | 'mesh'
  | 'idea'

export type AssetType =
  | 'Part'
  | 'Model'
  | 'Script'
  | 'LocalScript'
  | 'ModuleScript'
  | 'Sound'
  | 'ParticleEmitter'
  | 'UI'

export type Complexity = 'simple' | 'medium' | 'complex' | 'epic'

export interface BuildSectionPlan {
  name: string           // e.g. "Foundation", "Front Wall", "Roof", "Landscaping"
  partCount: number      // how many parts this section should produce
  material: string       // Concrete, Wood, Brick, Metal, Glass, Fabric, Neon, etc.
  color: string          // RGB like "139, 90, 43" or named like "Dark stone grey"
  dimensions: string     // e.g. "24x1x20 studs" or "4x8x0.3 each"
  useLoop: boolean       // whether to use a FOR loop for repeated elements
  loopSpec?: string      // e.g. "8 fence posts, spaced 4 studs apart along Z axis"
  details: string        // specific build instructions for this section
}

export interface EnhancedPromptStep {
  stepNumber: number
  action: string
  service: string // ServerScriptService, Workspace, ReplicatedStorage, etc.
  scriptName?: string
  description: string
}

export interface EnhancedPromptAsset {
  name: string
  type: AssetType
  description: string
}

export interface EnhancedPrompt {
  originalPrompt: string
  intent: PromptIntent
  planSummary: string
  steps: EnhancedPromptStep[]
  assetCount: number
  assets: EnhancedPromptAsset[]
  styleDirective: string
  estimatedComplexity: Complexity
  estimatedCredits: number
  enhancedPrompt: string // The rewritten, more detailed prompt
  // v2 blueprint fields
  buildScale: BuildScale
  partTargets: { min: number; target: number; max: number }
  sections: BuildSectionPlan[]
  foundationType: string    // "layered", "basic", "circular", "none"
  lightingSetup: string     // detailed lighting instructions
  exteriorFocus: boolean    // true = facade-first, no interior unless asked
  forLoopSpecs: string[]    // list of things to build with FOR loops
}

// ─── Defaults & validation ──────────────────────────────────────────────────

const VALID_INTENTS: Set<string> = new Set([
  'build', 'script', 'terrain', 'ui', 'npc', 'vehicle',
  'particle', 'image', 'mesh', 'idea',
])

const VALID_ASSET_TYPES: Set<string> = new Set([
  'Part', 'Model', 'Script', 'LocalScript', 'ModuleScript',
  'Sound', 'ParticleEmitter', 'UI',
])

const VALID_COMPLEXITIES: Set<string> = new Set([
  'simple', 'medium', 'complex', 'epic',
])

const COMPLEXITY_CREDIT_MAP: Record<Complexity, number> = {
  simple: 1,
  medium: 2,
  complex: 5,
  epic: 10,
}

function sanitizeIntent(raw: unknown): PromptIntent {
  if (typeof raw === 'string' && VALID_INTENTS.has(raw)) return raw as PromptIntent
  return 'build'
}

function sanitizeAssetType(raw: unknown): AssetType {
  if (typeof raw === 'string' && VALID_ASSET_TYPES.has(raw)) return raw as AssetType
  return 'Part'
}

function sanitizeComplexity(raw: unknown): Complexity {
  if (typeof raw === 'string' && VALID_COMPLEXITIES.has(raw)) return raw as Complexity
  return 'medium'
}

function sanitizeStep(raw: Record<string, unknown>, index: number): EnhancedPromptStep {
  return {
    stepNumber: typeof raw.stepNumber === 'number' ? raw.stepNumber : index + 1,
    action: typeof raw.action === 'string' ? raw.action : 'Build component',
    service: typeof raw.service === 'string' ? raw.service : 'Workspace',
    scriptName: typeof raw.scriptName === 'string' ? raw.scriptName : undefined,
    description: typeof raw.description === 'string' ? raw.description : '',
  }
}

function sanitizeAsset(raw: Record<string, unknown>): EnhancedPromptAsset {
  return {
    name: typeof raw.name === 'string' ? raw.name : 'Unnamed',
    type: sanitizeAssetType(raw.type),
    description: typeof raw.description === 'string' ? raw.description : '',
  }
}

// ─── System prompt for the planner ──────────────────────────────────────────

function buildPlannerSystemPrompt(scale: BuildScale, targets: { min: number; target: number; max: number }): string {
  const scaleRules: Record<BuildScale, string> = {
    prop: `This is a PROP (small object). Target ${targets.target} parts. Use 2+ materials, add detail parts (handles, knobs, labels). Scale relative to Roblox character (5.5 studs tall).`,
    furniture: `This is FURNITURE. Target ${targets.target} parts. Include legs/supports, cushions (Fabric), hardware (small Cyl knobs). Seat height at Y=2.5 for sitting.`,
    vehicle: `This is a VEHICLE. Target ${targets.target} parts. Chassis + hood + trunk + roof. 4 Cyl wheels. Glass windshield (transparency 0.3). Neon headlights + SpotLight. VehicleSeat with MaxSpeed/TurnSpeed/Torque.`,
    building: `This is a BUILDING. Target ${targets.target} parts. EXTERIOR-FIRST (facade, no interior unless user asks). Layered foundation (2-3 stepped layers). Corner posts + crown trim. Glowing windows (SpotLight behind Glass). Interaction zone (Neon circle + SurfaceGui + ProximityPrompt) at entrance. USE FOR LOOPS for repeated windows, fence posts, trim pieces.`,
    scene: `This is a SCENE/ENVIRONMENT. Target ${targets.target} parts. Central focal point. Terrain ground (FillBlock, never part-based ground). Trees (Cyl trunk + Ball canopy via loop). Paths with alternating tile colors. Street lamps via loop. Atmosphere + Bloom + ColorCorrection.`,
    map: `This is a GAME MAP. Target ${targets.target} parts. Central hub at (0,0,0), zones radiate outward. Terrain FillBlock 300x300 base. Paths connect zones (alternating tiles via loop). Street lamps every 20-30 studs (loop). Multiple facade buildings with interaction zones. Perimeter fence (loop). HEAVY use of position tables + loops.`,
    world: `This is a FULL WORLD. Target ${targets.target} parts. Multiple distinct zones/biomes. Terrain FillBlock for ground + FillBall for hills + FillBlock for water. Central spawn plaza. Road network. 5+ building facades. Heavy loop usage for vegetation, lamps, fences, decorations. AAA lighting stack mandatory.`,
  }

  return `You are an EXPERT Roblox build architect. You produce DETAILED blueprints that a code-generating AI translates directly to Luau code. Your plans are so precise that the AI barely needs to think — just follow your blueprint.

${scaleRules[scale]}

PART COUNT: minimum ${targets.min}, target ${targets.target}, maximum ${targets.max}.

CRITICAL RULES:
- NEVER use SmoothPlastic material. Use: Concrete, Wood, Brick, Metal, Glass, Fabric, Neon, Cobblestone, Slate, Marble, Granite, DiamondPlate, Foil, Sand, Ice, WoodPlanks, Pebble, CorrodedMetal, ForceField.
- The code uses helper functions: P(parent, name, size, pos, color, material) for Parts, W(parent, name, size, pos, color, angle) for WedgeParts, Cyl(parent, name, size, pos, color, material) for Cylinders, Ball(parent, name, size, pos, color, material) for Balls.
- FOR LOOPS are essential for repeated elements. One loop creating 12 fence posts = 36 parts from 6 lines of code. Always specify what to loop, how many iterations, and spacing.
- Colors are specified as Color3.fromRGB(r, g, b). Plan SPECIFIC RGB values, not vague descriptions.
- Every outdoor build needs: workspace.Terrain:FillBlock for ground, Atmosphere, Bloom, ColorCorrection. Buildings need SunRays too.
- Buildings are FACADES. 90% exterior detail. Glowing windows = SpotLight behind Glass pointing outward.
- Interaction zones: Neon circle pad (6 stud diameter, transparency 0.3) + SurfaceGui label + ProximityPrompt.

Respond ONLY with valid JSON matching this schema:
{
  "intent": "build|script|terrain|ui|npc|vehicle|particle|image|mesh|idea",
  "planSummary": "1-2 sentence summary",
  "sections": [
    {
      "name": "Foundation",
      "partCount": 4,
      "material": "Concrete",
      "color": "140, 140, 140",
      "dimensions": "26x1x22 studs base layer, 24x1x20 second layer",
      "useLoop": false,
      "loopSpec": "",
      "details": "3-layer stepped foundation. Bottom layer widest (26x1x22), middle (24x1x20), top (22x0.5x18). Dark grey concrete. Each layer centered, creating visible stepped edges."
    },
    {
      "name": "Windows (Front Wall)",
      "partCount": 24,
      "material": "Glass",
      "color": "200, 220, 255",
      "dimensions": "2x3x0.1 glass, 0.3x3x0.3 frame pieces",
      "useLoop": true,
      "loopSpec": "FOR i=1,4: create window at X offset i*5. Each window = glass pane + 4 frame pieces + mullion + sill. Place SpotLight behind each glass (Range 15, Brightness 0.8, warm color) for inhabited glow.",
      "details": "4 identical windows across front wall, evenly spaced. Each: Glass pane (transparency 0.3, SurfaceLight behind), 4-piece Wood frame (dark brown 80,50,30), horizontal mullion dividing glass in half, protruding sill (0.5 stud out)."
    }
  ],
  "steps": [
    {
      "stepNumber": 1,
      "action": "Create foundation and floor",
      "service": "Workspace",
      "description": "Layered concrete foundation: 3 stepped layers each narrower than below. Floor on top."
    }
  ],
  "assetCount": 5,
  "assets": [
    {
      "name": "HouseModel",
      "type": "Part|Model|Script|LocalScript|ModuleScript|Sound|ParticleEmitter|UI",
      "description": "Main building model containing all structural parts"
    }
  ],
  "foundationType": "layered|basic|circular|none",
  "lightingSetup": "Future technology, Atmosphere (Density 0.3, Color 180,195,220), Bloom (Intensity 0.4, Size 30), ColorCorrection (Brightness 0.05, Contrast 0.1, Saturation 0.15), SunRays (Intensity 0.1, Spread 0.3). SpotLights behind all windows (Range 15, Brightness 0.8, Color 255,240,200).",
  "forLoopSpecs": [
    "4 front windows: loop i=1,4, each at X = startX + i*5, 6 parts per window",
    "12 fence posts: loop i=1,12, each at Z = i*4, Cyl post + horizontal rail",
    "6 trees: loop with positions table, each = Cyl trunk (random height 8-12) + Ball canopy (random size 4-6)"
  ],
  "styleDirective": "Rustic cottage style. Walls: Brick (180,160,140). Roof: Wood (120,70,40). Trim: Wood (200,180,160). Foundation: Concrete (100,100,100). Door: Wood (90,55,25). Windows: Glass with warm SpotLight glow. Neon accents on interaction zone only.",
  "estimatedComplexity": "simple|medium|complex|epic",
  "estimatedCredits": 2,
  "enhancedPrompt": "A richly detailed rewrite of the user's request with EVERY section, material, color, dimension, and loop specified. This should read like an architect's blueprint — the AI just translates it to P()/W()/Cyl()/Ball() calls and FOR loops."
}

SECTION PLANNING RULES:
- Every building needs: Foundation, Walls (split per side: Front/Back/Left/Right), Roof, Door+Frame, Windows, Exterior Detail (trim/cornices), Landscaping, Lighting, Interaction Zone
- For each section: specify EXACT part count, material, RGB color, dimensions in studs
- If a section has repeated elements (windows, fence posts, tiles, lamps, trees), set useLoop=true and write a specific loopSpec
- Foundation types: "layered" (2-3 stepped layers, each narrower) for buildings, "circular" (concentric Cyl layers) for fountains/plazas, "basic" (single slab) for simple, "none" for vehicles/props
- Lighting ALWAYS includes the full AAA stack for outdoor builds. ALWAYS include SpotLights behind Glass windows.
- The enhancedPrompt should be SO detailed that a code AI just translates it line by line. Include specific RGB values, exact dimensions, loop counts, material names.
- Total parts across all sections should hit the target of ${targets.target} (minimum ${targets.min}).
- Keep the JSON clean, no markdown, no extra text outside the JSON.`
}

// ─── Main enhancer function ─────────────────────────────────────────────────

export async function enhancePrompt(
  rawPrompt: string,
  context?: string,
): Promise<EnhancedPrompt> {
  // Detect build scale and targets BEFORE calling the AI
  const scale = detectBuildScale(rawPrompt)
  const targets = getPartTargets(scale)

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    // Graceful fallback when Groq is not configured — return a minimal plan
    // so the rest of the pipeline still works.
    return buildFallbackPlan(rawPrompt, scale, targets)
  }

  const groq = new Groq({ apiKey })

  const userContent = context
    ? `Context: ${context}\n\nUser request: ${rawPrompt}\n\nBuild scale: ${scale} (target ${targets.target} parts, min ${targets.min}, max ${targets.max})`
    : `${rawPrompt}\n\nBuild scale: ${scale} (target ${targets.target} parts, min ${targets.min}, max ${targets.max})`

  const systemPrompt = buildPlannerSystemPrompt(scale, targets)

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      temperature: 0.3,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    })

    const raw = response.choices[0]?.message?.content
    if (!raw) {
      console.warn('[prompt-enhancer] Empty response from Groq, using fallback')
      return buildFallbackPlan(rawPrompt, scale, targets)
    }

    const parsed = JSON.parse(raw) as Record<string, unknown>
    return buildEnhancedPromptResult(rawPrompt, parsed, scale, targets)
  } catch (err) {
    console.error('[prompt-enhancer] Groq API error, using fallback:', err instanceof Error ? err.message : err)
    return buildFallbackPlan(rawPrompt, scale, targets)
  }
}

// ─── Parse & sanitize the Groq response ─────────────────────────────────────

function sanitizeSection(raw: Record<string, unknown>): BuildSectionPlan {
  return {
    name: typeof raw.name === 'string' ? raw.name : 'Section',
    partCount: typeof raw.partCount === 'number' ? raw.partCount : 5,
    material: typeof raw.material === 'string' ? raw.material : 'Concrete',
    color: typeof raw.color === 'string' ? raw.color : '140, 140, 140',
    dimensions: typeof raw.dimensions === 'string' ? raw.dimensions : '',
    useLoop: typeof raw.useLoop === 'boolean' ? raw.useLoop : false,
    loopSpec: typeof raw.loopSpec === 'string' ? raw.loopSpec : undefined,
    details: typeof raw.details === 'string' ? raw.details : '',
  }
}

function buildEnhancedPromptResult(
  originalPrompt: string,
  parsed: Record<string, unknown>,
  scale: BuildScale,
  targets: { min: number; target: number; max: number },
): EnhancedPrompt {
  const intent = sanitizeIntent(parsed.intent)
  const complexity = sanitizeComplexity(parsed.estimatedComplexity)

  const rawSteps = Array.isArray(parsed.steps) ? parsed.steps : []
  const steps = rawSteps.map((s: unknown, i: number) =>
    sanitizeStep((s && typeof s === 'object' ? s : {}) as Record<string, unknown>, i),
  )

  const rawAssets = Array.isArray(parsed.assets) ? parsed.assets : []
  const assets = rawAssets.map((a: unknown) =>
    sanitizeAsset((a && typeof a === 'object' ? a : {}) as Record<string, unknown>),
  )

  const rawSections = Array.isArray(parsed.sections) ? parsed.sections : []
  const sections = rawSections.map((s: unknown) =>
    sanitizeSection((s && typeof s === 'object' ? s : {}) as Record<string, unknown>),
  )

  const rawForLoops = Array.isArray(parsed.forLoopSpecs) ? parsed.forLoopSpecs : []
  const forLoopSpecs = rawForLoops.filter((s: unknown): s is string => typeof s === 'string')

  return {
    originalPrompt,
    intent,
    planSummary: typeof parsed.planSummary === 'string' ? parsed.planSummary : `Build: ${originalPrompt}`,
    steps,
    assetCount: typeof parsed.assetCount === 'number' ? parsed.assetCount : assets.length,
    assets,
    styleDirective: typeof parsed.styleDirective === 'string'
      ? parsed.styleDirective
      : 'Use Concrete, Wood, Brick, Metal materials with realistic colors.',
    estimatedComplexity: complexity,
    estimatedCredits: typeof parsed.estimatedCredits === 'number'
      ? parsed.estimatedCredits
      : COMPLEXITY_CREDIT_MAP[complexity],
    enhancedPrompt: typeof parsed.enhancedPrompt === 'string'
      ? parsed.enhancedPrompt
      : originalPrompt,
    // v2 blueprint fields
    buildScale: scale,
    partTargets: targets,
    sections,
    foundationType: typeof parsed.foundationType === 'string' ? parsed.foundationType : 'basic',
    lightingSetup: typeof parsed.lightingSetup === 'string' ? parsed.lightingSetup : 'Future technology + Atmosphere + Bloom + ColorCorrection',
    exteriorFocus: ['building', 'scene', 'map', 'world'].includes(scale),
    forLoopSpecs,
  }
}

// ─── Fallback when Groq is unavailable ──────────────────────────────────────

function buildFallbackPlan(
  rawPrompt: string,
  scale?: BuildScale,
  targets?: { min: number; target: number; max: number },
): EnhancedPrompt {
  const s = scale || detectBuildScale(rawPrompt)
  const t = targets || getPartTargets(s)
  return {
    originalPrompt: rawPrompt,
    intent: 'build',
    planSummary: rawPrompt,
    steps: [
      {
        stepNumber: 1,
        action: 'Build the requested content',
        service: 'Workspace',
        description: rawPrompt,
      },
    ],
    assetCount: 1,
    assets: [],
    styleDirective: 'Use Concrete, Wood, Brick, Metal materials. No SmoothPlastic.',
    estimatedComplexity: 'medium',
    estimatedCredits: 2,
    enhancedPrompt: rawPrompt,
    buildScale: s,
    partTargets: t,
    sections: [],
    foundationType: ['building', 'scene', 'map', 'world'].includes(s) ? 'layered' : 'basic',
    lightingSetup: 'Future technology + Atmosphere + Bloom + ColorCorrection',
    exteriorFocus: ['building', 'scene', 'map', 'world'].includes(s),
    forLoopSpecs: [],
  }
}

// ─── Helper: format enhanced plan as context for the main AI ────────────────

/**
 * Formats an EnhancedPrompt into a system-prompt-injectable context block.
 * Include this in the main AI's system prompt to give it a structured plan
 * to follow, resulting in higher quality output.
 */
export function formatEnhancedPlanContext(plan: EnhancedPrompt): string {
  const lines: string[] = []

  lines.push('[ARCHITECT_BLUEPRINT]')
  lines.push(`Summary: ${plan.planSummary}`)
  lines.push(`Scale: ${plan.buildScale} | Parts: target ${plan.partTargets.target} (min ${plan.partTargets.min}, max ${plan.partTargets.max})`)
  lines.push(`Intent: ${plan.intent} | Complexity: ${plan.estimatedComplexity}`)
  lines.push(`Foundation: ${plan.foundationType}`)
  lines.push(`Exterior-first: ${plan.exteriorFocus ? 'YES — facade only, no interior unless user asked' : 'no'}`)
  lines.push(`Style: ${plan.styleDirective}`)
  lines.push('')

  // Detailed section blueprints — the core upgrade
  if (plan.sections.length > 0) {
    lines.push('=== SECTION-BY-SECTION BLUEPRINT ===')
    lines.push('Follow these sections IN ORDER. Use P()/W()/Cyl()/Ball() helpers. Use FOR loops where specified.')
    lines.push('')
    let totalPlannedParts = 0
    for (const sec of plan.sections) {
      totalPlannedParts += sec.partCount
      lines.push(`--- ${sec.name} (${sec.partCount} parts) ---`)
      lines.push(`  Material: ${sec.material} | Color: Color3.fromRGB(${sec.color})`)
      lines.push(`  Dimensions: ${sec.dimensions}`)
      if (sec.useLoop && sec.loopSpec) {
        lines.push(`  FOR LOOP: ${sec.loopSpec}`)
      }
      lines.push(`  Details: ${sec.details}`)
      lines.push('')
    }
    lines.push(`Total planned parts across sections: ${totalPlannedParts}`)
    lines.push('')
  }

  // FOR loop specifications
  if (plan.forLoopSpecs.length > 0) {
    lines.push('=== FOR LOOP SPECIFICATIONS ===')
    lines.push('These MUST be implemented as for loops, not individual P() calls:')
    for (const spec of plan.forLoopSpecs) {
      lines.push(`  - ${spec}`)
    }
    lines.push('')
  }

  // Lighting setup
  if (plan.lightingSetup) {
    lines.push('=== LIGHTING SETUP ===')
    lines.push(plan.lightingSetup)
    lines.push('')
  }

  // Build steps (execution order)
  if (plan.steps.length > 0) {
    lines.push('=== EXECUTION ORDER ===')
    for (const s of plan.steps) {
      lines.push(`  ${s.stepNumber}. [${s.service}] ${s.action} — ${s.description}${s.scriptName ? ` (${s.scriptName})` : ''}`)
    }
    lines.push('')
  }

  // Assets
  if (plan.assets.length > 0) {
    lines.push(`=== ASSETS (${plan.assetCount}) ===`)
    for (const a of plan.assets) {
      lines.push(`  - ${a.name} (${a.type}): ${a.description}`)
    }
    lines.push('')
  }

  lines.push('=== ENHANCED PROMPT ===')
  lines.push(plan.enhancedPrompt)
  lines.push('')
  lines.push('REMEMBER: Use P()/W()/Cyl()/Ball() helpers. Use FOR loops for repeated elements. NEVER use SmoothPlastic. Hit the part target.')
  lines.push('[/ARCHITECT_BLUEPRINT]')

  return lines.join('\n')
}
