/**
 * Build Blueprint System — thinks before coding.
 *
 * Instead of jumping straight to 200 lines of Luau, the AI first outputs
 * a structured JSON blueprint listing every part/object. We validate the
 * blueprint against category requirements BEFORE generating code.
 *
 * Three tiers based on prompt difficulty:
 *   SIMPLE  ("build a box")          → skip planning, one-shot generate
 *   MEDIUM  ("build a house")        → quick plan → validate → generate
 *   COMPLEX ("pirate ship + cannons") → full plan → validate → phased generate → audit
 *
 * The complexity estimator predicts target part count and features so
 * the AI knows exactly what's expected.
 */

import { callAI, type AIMessage } from './provider'
import { detectCategory, getAggregatePatterns, type BuildType } from './experience-memory'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Difficulty = 'simple' | 'medium' | 'complex'

export interface BlueprintPart {
  name: string
  type: string  // Part, WedgePart, Model, etc.
  material: string
  color: string  // "R,G,B"
  size: string   // "X,Y,Z"
  position: string  // "X,Y,Z" relative
  children?: BlueprintChild[]
}

export interface BlueprintChild {
  type: string  // PointLight, SpotLight, Fire, ProximityPrompt, etc.
  properties?: Record<string, string | number | boolean>
}

export interface Blueprint {
  name: string
  description: string
  category: string | null
  difficulty: Difficulty
  targetPartCount: number
  parts: BlueprintPart[]
  interactiveElements: string[]
  lightingSources: string[]
  ambientEffects: string[]
}

export interface ComplexityEstimate {
  difficulty: Difficulty
  targetParts: number
  targetFeatures: string[]
  targetLights: number
  targetInteractive: number
  reasoning: string
}

// ---------------------------------------------------------------------------
// Difficulty classification
// ---------------------------------------------------------------------------

const SIMPLE_PATTERNS = [
  /^(?:build|make|create)\s+(?:a\s+)?(?:simple\s+)?(?:box|cube|sphere|ball|cylinder|wall|platform|block|slab|ramp|wedge)$/i,
  /^(?:build|make|create)\s+(?:a\s+)?(?:basic|simple|small)\s+\w+$/i,
  /^(?:test|try|demo)/i,
]

const COMPLEX_INDICATORS = [
  /detailed|elaborate|complete|full|huge|massive|large|big|epic|grand/i,
  /with\s+(?:working|functional|interactive|animated)/i,
  /and\s+\w+\s+and\s+\w+/i,
  /(?:game|map|world|town|village|city|kingdom)/i,
  /(?:tycoon|simulator|obby\s+course|tower\s+defense)/i,
  /(?:interior|furniture|decoration|lighting|ambient)/i,
  /(?:script|npc|ai|pathfind|system|mechanic)/i,
]

export function classifyDifficulty(prompt: string): Difficulty {
  const lower = prompt.toLowerCase().trim()
  for (const pat of SIMPLE_PATTERNS) {
    if (pat.test(lower)) return 'simple'
  }
  let complexCount = 0
  for (const pat of COMPLEX_INDICATORS) {
    if (pat.test(lower)) complexCount++
  }
  const wordCount = lower.split(/\s+/).length
  if (wordCount > 25) complexCount++
  if (wordCount > 40) complexCount++
  if (complexCount >= 3) return 'complex'
  if (complexCount >= 1 || wordCount > 15) return 'medium'
  return 'simple'
}

// ---------------------------------------------------------------------------
// Complexity estimator
// ---------------------------------------------------------------------------

export async function estimateComplexity(
  prompt: string,
  buildType: BuildType = 'build',
): Promise<ComplexityEstimate> {
  const difficulty = classifyDifficulty(prompt)
  const category = detectCategory(prompt)

  // Base targets — scale aggressively for complex builds
  const lower = prompt.toLowerCase()
  const isMassive = /\b(town|village|city|castle|kingdom|fortress|mansion|estate|campus|district|complex|arena|stadium|cathedral|temple|palace|neighborhood)\b/.test(lower)
  const isLarge = /\b(house|building|shop|restaurant|cafe|school|hospital|factory|warehouse|church|station|hotel|apartment|barn|hangar|bridge|park)\b/.test(lower)

  let targetParts = difficulty === 'simple' ? 20 : difficulty === 'medium' ? 50 : 120
  let targetLights = difficulty === 'simple' ? 1 : difficulty === 'medium' ? 4 : 10
  let targetInteractive = difficulty === 'simple' ? 0 : difficulty === 'medium' ? 2 : 5

  // Scale up for massive builds
  if (isMassive) {
    targetParts = Math.max(targetParts, 200)
    targetLights = Math.max(targetLights, 15)
    targetInteractive = Math.max(targetInteractive, 8)
  } else if (isLarge) {
    targetParts = Math.max(targetParts, 80)
    targetLights = Math.max(targetLights, 6)
    targetInteractive = Math.max(targetInteractive, 3)
  }

  // Multi-object scenes get even more
  const objectCount = (lower.match(/\band\b/g) || []).length + 1
  if (objectCount >= 3) {
    targetParts = Math.max(targetParts, targetParts * objectCount * 0.6)
    targetLights = Math.max(targetLights, targetLights * Math.ceil(objectCount * 0.5))
  }

  // Override with aggregate data if available
  try {
    const patterns = await getAggregatePatterns(category || undefined, buildType)
    if (patterns.length > 0 && patterns[0].avgPartCount > 0) {
      const scale = difficulty === 'simple' ? 0.5 : difficulty === 'medium' ? 1.0 : 1.5
      targetParts = Math.round(patterns[0].avgPartCount * scale)
    }
  } catch { /* use defaults */ }

  if (buildType === 'script') {
    targetParts = 0
    targetLights = 0
    targetInteractive = 0
  }

  const targetFeatures: string[] = []
  if (buildType === 'build' || buildType === 'terrain') {
    if (difficulty !== 'simple') {
      targetFeatures.push('multiple materials for visual variety')
      targetFeatures.push('color variation across similar parts')
    }
    if (difficulty === 'medium' || difficulty === 'complex') {
      targetFeatures.push('light sources (PointLight/SpotLight)')
      targetFeatures.push('interactive element (ProximityPrompt or ClickDetector)')
    }
    if (difficulty === 'complex') {
      targetFeatures.push('scripted animations (TweenService)')
      targetFeatures.push('ambient effects (Fire, ParticleEmitter, Sound)')
      targetFeatures.push('UI elements (SurfaceGui, BillboardGui)')
      targetFeatures.push('multiple distinct areas')
    }
  }

  return {
    difficulty, targetParts, targetFeatures, targetLights, targetInteractive,
    reasoning: `${difficulty} ${category || 'general'} — target ${targetParts} parts, ${targetLights} lights, ${targetInteractive} interactive`,
  }
}

// ---------------------------------------------------------------------------
// Blueprint generation
// ---------------------------------------------------------------------------

const BLUEPRINT_PROMPT = `You are a Roblox build architect. Create a structured JSON blueprint.

Return ONLY valid JSON (no markdown). Format:
{
  "name": "Build name",
  "parts": [
    {
      "name": "unique_part_name",
      "type": "Part",
      "material": "Concrete",
      "color": "180,150,100",
      "size": "20,12,1.5",
      "position": "0,6,0",
      "children": [
        { "type": "PointLight", "properties": { "Brightness": 2, "Range": 30, "Color": "255,200,130" } }
      ]
    }
  ],
  "interactiveElements": ["door opens via ProximityPrompt + TweenService"],
  "lightingSources": ["warm PointLight in each lamp"],
  "ambientEffects": ["fire particles on torches"]
}

RULES:
- Every part: name, type, material, color(R,G,B), size(X,Y,Z studs), position(relative to center)
- REAL materials only: Concrete, Wood, WoodPlanks, Brick, Slate, Granite, Metal, Glass, Grass, Rock, etc.
- NEVER SmoothPlastic or Neon (except literal neon signs)
- Lighting: Glass/Metal fixture + PointLight/SpotLight child. NOT Neon.
- Add children for lights, effects (Fire, Smoke), interactivity (ProximityPrompt, ClickDetector)
- Scale: door=3.5x7.5, wall=11 high, character=6 studs
- List EVERY part individually — no "repeat x10" shortcuts`

export async function generateBlueprint(
  prompt: string,
  estimate: ComplexityEstimate,
): Promise<Blueprint | null> {
  const category = detectCategory(prompt)

  const userMsg = `Build: "${prompt}"
Complexity: ${estimate.difficulty} | Target: ${estimate.targetParts} parts, ${estimate.targetLights} lights, ${estimate.targetInteractive} interactive
Features: ${estimate.targetFeatures.join(', ') || 'basic structure'}
Category: ${category || 'general'}

List ALL parts individually.`

  try {
    const raw = await callAI(BLUEPRINT_PROMPT, [{ role: 'user', content: userMsg }], {
      maxTokens: 8192,
      codeMode: false,
    })

    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    const parsed = JSON.parse(jsonMatch[0])
    return {
      name: String(parsed.name || prompt.slice(0, 50)),
      description: String(parsed.description || ''),
      category,
      difficulty: estimate.difficulty,
      targetPartCount: estimate.targetParts,
      parts: Array.isArray(parsed.parts) ? parsed.parts : [],
      interactiveElements: Array.isArray(parsed.interactiveElements) ? parsed.interactiveElements : [],
      lightingSources: Array.isArray(parsed.lightingSources) ? parsed.lightingSources : [],
      ambientEffects: Array.isArray(parsed.ambientEffects) ? parsed.ambientEffects : [],
    }
  } catch (err) {
    console.warn('[Blueprint] Generation failed:', err instanceof Error ? err.message : err)
    return null
  }
}

// ---------------------------------------------------------------------------
// Blueprint validation
// ---------------------------------------------------------------------------

export interface BlueprintValidation {
  valid: boolean
  issues: string[]
  partCount: number
  lightCount: number
  interactiveCount: number
}

export function validateBlueprint(blueprint: Blueprint, estimate: ComplexityEstimate): BlueprintValidation {
  const issues: string[] = []
  let lightCount = 0
  let interactiveCount = 0

  for (const part of blueprint.parts) {
    if (part.material === 'SmoothPlastic' || part.material === 'Plastic') {
      issues.push(`"${part.name}" uses banned material ${part.material}`)
    }
    if (part.children) {
      for (const child of part.children) {
        if (['PointLight', 'SpotLight', 'SurfaceLight'].includes(child.type)) lightCount++
        if (['ProximityPrompt', 'ClickDetector'].includes(child.type)) interactiveCount++
      }
    }
  }

  if (blueprint.parts.length < estimate.targetParts * 0.6) {
    issues.push(`Only ${blueprint.parts.length} parts planned, need ${Math.round(estimate.targetParts * 0.7)}+`)
  }
  if (lightCount < estimate.targetLights) {
    issues.push(`${lightCount} lights planned, need ${estimate.targetLights}+`)
  }
  if (interactiveCount < estimate.targetInteractive) {
    issues.push(`${interactiveCount} interactive elements, need ${estimate.targetInteractive}+`)
  }

  return { valid: issues.length === 0, issues, partCount: blueprint.parts.length, lightCount, interactiveCount }
}

// ---------------------------------------------------------------------------
// Blueprint → code prompt
// ---------------------------------------------------------------------------

export function formatBlueprintAsCodePrompt(blueprint: Blueprint, originalPrompt: string): string {
  return [
    `ORIGINAL REQUEST: "${originalPrompt}"`,
    '',
    `VALIDATED BLUEPRINT (${blueprint.parts.length} parts). Translate to Luau:`,
    '```json',
    JSON.stringify({
      name: blueprint.name,
      parts: blueprint.parts.slice(0, 200), // Allow up to 200 parts in blueprint prompt
      interactiveElements: blueprint.interactiveElements,
      lightingSources: blueprint.lightingSources,
      ambientEffects: blueprint.ambientEffects,
    }, null, 1),
    '```',
    '',
    'Translate EVERY part. Set Name, Size, Position, Material, Color, Anchored.',
    'Create all children (PointLight, Fire, ProximityPrompt, etc.).',
    'Implement interactive elements with scripts (TweenService for doors, etc.).',
    'Use ChangeHistoryService. Place relative to camera. Group into a Model.',
    'Do NOT skip parts. Do NOT add parts not in the blueprint.',
  ].join('\n')
}

// ---------------------------------------------------------------------------
// Additive retry — build on existing code
// ---------------------------------------------------------------------------

export function formatAdditiveRetryPrompt(
  existingCode: string,
  missingFeatures: string[],
  suggestions: string[],
  originalPrompt: string,
): string {
  const lines = [
    `ORIGINAL REQUEST: "${originalPrompt}"`,
    '',
    'EXISTING CODE (keep this, add to it):',
    '```lua',
    existingCode.length > 3000 ? existingCode.slice(0, 3000) + '\n-- (truncated)' : existingCode,
    '```',
    '',
    'ADD these missing features to the existing code:',
  ]

  if (missingFeatures.length > 0) {
    lines.push('', 'MISSING (you described but did not build):')
    for (const f of missingFeatures) lines.push(`  - ${f}`)
  }
  if (suggestions.length > 0) {
    lines.push('', 'ADDITIONS NEEDED:')
    for (const s of suggestions) lines.push(`  - ${s}`)
  }

  lines.push('', 'Return COMPLETE code with new parts ADDED. Keep all existing parts. Insert before ChangeHistoryService:FinishRecording.')
  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Main orchestrator
// ---------------------------------------------------------------------------

export interface PlanResult {
  difficulty: Difficulty
  estimate: ComplexityEstimate
  blueprint: Blueprint | null
  blueprintValidation: BlueprintValidation | null
  codePrompt: string
}

export async function planBuild(prompt: string, buildType: BuildType = 'build'): Promise<PlanResult> {
  const estimate = await estimateComplexity(prompt, buildType)
  console.log(`[Planner] ${estimate.reasoning}`)

  // Simple → skip planning
  if (estimate.difficulty === 'simple' || buildType === 'script') {
    return {
      difficulty: estimate.difficulty, estimate,
      blueprint: null, blueprintValidation: null,
      codePrompt: `Build "${prompt}". Target: ${estimate.targetParts} parts.${estimate.targetFeatures.length > 0 ? ' Include: ' + estimate.targetFeatures.join(', ') : ''}`,
    }
  }

  // Medium/Complex → generate + validate blueprint
  const blueprint = await generateBlueprint(prompt, estimate)
  if (!blueprint || blueprint.parts.length === 0) {
    console.warn('[Planner] Blueprint failed, falling back')
    return {
      difficulty: estimate.difficulty, estimate,
      blueprint: null, blueprintValidation: null,
      codePrompt: `Build "${prompt}". ${estimate.difficulty} build. Target: ${estimate.targetParts} parts, ${estimate.targetLights} lights, ${estimate.targetInteractive} interactive. Required: ${estimate.targetFeatures.join(', ')}.`,
    }
  }

  const validation = validateBlueprint(blueprint, estimate)
  console.log(`[Planner] Blueprint: ${validation.partCount} parts, ${validation.lightCount} lights, ${validation.interactiveCount} interactive. Valid: ${validation.valid}`)

  return {
    difficulty: estimate.difficulty, estimate,
    blueprint, blueprintValidation: validation,
    codePrompt: formatBlueprintAsCodePrompt(blueprint, prompt),
  }
}
