/**
 * Build Completeness Auditor
 *
 * Catches the #1 user complaint: AI says "Built your detailed castle with
 * towers, drawbridge, and throne room" but the code has 12 parts and no towers.
 *
 * Three checks:
 * 1. CLAIM vs REALITY — extract features the AI described, verify they exist in code
 * 2. CATEGORY MINIMUMS — each build type has required features (castle needs walls+towers+gate)
 * 3. DETAIL SCORE — raw measurement of how much is actually in the code
 *
 * Returns a pass/fail + specific list of what's missing so the AI can retry.
 */

import { detectCategory } from './experience-memory'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AuditResult {
  passed: boolean
  detailScore: number  // 0-100, raw measurement of build completeness
  claimedFeatures: string[]  // What the AI said it built
  foundFeatures: string[]  // What's actually in the code
  missingFeatures: string[]  // Claimed but not found
  missingRequirements: string[]  // Category minimums not met
  partCount: number
  uniqueNames: number
  uniqueMaterials: number
  uniqueColors: number
  lightCount: number
  interactiveCount: number
  suggestions: string[]  // Specific things to add
}

// ---------------------------------------------------------------------------
// Feature extraction from code
// ---------------------------------------------------------------------------

interface CodeFeatures {
  partNames: string[]
  materials: Set<string>
  colors: number
  parts: number
  lights: number
  effects: number
  interactive: number
  ui: number
  sounds: number
  models: number
  hasAnchoring: boolean
  hasChangeHistory: boolean
  hasCameraPlacement: boolean
  uniqueYLevels: number
  codeLength: number
}

function extractCodeFeatures(code: string): CodeFeatures {
  // Extract part names from .Name = "..." assignments AND P()/W()/Cyl()/Ball() helpers
  const nameMatches = code.match(/\.Name\s*=\s*["']([^"']+)["']/g) || []
  const helperNameMatches = code.match(/(?:^|\n)\s*(?:local\s+\w+\s*=\s*)?(?:P|W|Cyl|Ball)\(\s*["']([^"']+)["']/g) || []
  const partNames = [
    ...nameMatches.map(m => {
      const match = m.match(/["']([^"']+)["']/)
      return match ? match[1].toLowerCase() : ''
    }),
    ...helperNameMatches.map(m => {
      const match = m.match(/["']([^"']+)["']/)
      return match ? match[1].toLowerCase() : ''
    }),
  ].filter(Boolean)

  // Materials
  const matMatches = code.match(/Enum\.Material\.(\w+)/g) || []
  const materials = new Set(matMatches.map(m => m.replace('Enum.Material.', '')))

  // Colors
  const colors = (code.match(/Color3\.fromRGB/g) || []).length

  // Parts (all physical parts)
  const parts = (code.match(/Instance\.new\s*\(\s*["'](?:Part|WedgePart|MeshPart|SpawnLocation|Seat|VehicleSeat|TrussPart|CornerWedgePart)["']/g) || []).length
    + (code.match(/\bP\s*\(/g) || []).length  // P() helper
    + (code.match(/\bW\s*\(/g) || []).length   // W() WedgePart helper
    + (code.match(/\bCyl\s*\(/g) || []).length
    + (code.match(/\bBall\s*\(/g) || []).length

  // Lights
  const lights = (code.match(/Instance\.new\s*\(\s*["'](?:PointLight|SpotLight|SurfaceLight)["']/g) || []).length

  // Effects
  const effects = (code.match(/Instance\.new\s*\(\s*["'](?:Fire|Smoke|Sparkles|ParticleEmitter|Beam|Trail)["']/g) || []).length

  // Interactive
  const interactive = (code.match(/Instance\.new\s*\(\s*["'](?:ProximityPrompt|ClickDetector)["']/g) || []).length
    + (code.includes('TweenService') ? 1 : 0)

  // UI
  const ui = (code.match(/Instance\.new\s*\(\s*["'](?:SurfaceGui|BillboardGui|ScreenGui)["']/g) || []).length

  // Sounds
  const sounds = (code.match(/Instance\.new\s*\(\s*["']Sound["']/g) || []).length

  // Models
  const models = (code.match(/Instance\.new\s*\(\s*["']Model["']/g) || []).length

  // Y-level diversity (flat builds = bad)
  const posYMatches = code.match(/Position\s*=\s*Vector3\.new\s*\([^)]*,\s*([\d.]+)/g) || []
  const yLevels = new Set(posYMatches.map(m => {
    const match = m.match(/,\s*([\d.]+)/)
    return match ? Math.round(parseFloat(match[1]) * 2) / 2 : 0
  }))

  return {
    partNames,
    materials,
    colors,
    parts,
    lights,
    effects,
    interactive,
    ui,
    sounds,
    models,
    hasAnchoring: code.includes('Anchored'),
    hasChangeHistory: code.includes('ChangeHistoryService'),
    hasCameraPlacement: code.includes('CurrentCamera') || code.includes('Raycast'),
    uniqueYLevels: yLevels.size,
    codeLength: code.length,
  }
}

// ---------------------------------------------------------------------------
// Claim extraction from AI response text
// ---------------------------------------------------------------------------

/** Extract specific features the AI claims to have built from its description */
function extractClaims(responseText: string): string[] {
  const claims: string[] = []
  const lower = responseText.toLowerCase()

  // Structural claims
  const structureWords = [
    'tower', 'wall', 'gate', 'door', 'window', 'roof', 'floor', 'stair',
    'bridge', 'drawbridge', 'balcony', 'chimney', 'pillar', 'column', 'arch',
    'room', 'hallway', 'corridor', 'basement', 'attic',
    'throne', 'fountain', 'garden', 'courtyard', 'moat',
    'garage', 'kitchen', 'bedroom', 'bathroom', 'living room',
    'pool', 'patio', 'deck', 'porch', 'fence',
    'tree', 'bush', 'flower', 'path', 'road',
    'sign', 'lamp', 'lantern', 'torch', 'light',
    'table', 'chair', 'desk', 'shelf', 'bed', 'couch',
    'chest', 'barrel', 'crate', 'shop', 'counter',
    'npc', 'guard', 'villager', 'merchant',
    'turret', 'cannon', 'flag', 'banner',
  ]

  for (const word of structureWords) {
    // Check if the word appears in context that suggests it was built
    // e.g., "with towers" or "added a fountain" or "includes a garden"
    const patterns = [
      new RegExp(`\\b${word}s?\\b`, 'i'),
    ]
    for (const pat of patterns) {
      if (pat.test(lower)) {
        claims.push(word)
        break
      }
    }
  }

  return [...new Set(claims)]
}

/** Check if a claimed feature is actually present in the code */
function isFeatureInCode(feature: string, partNames: string[], code: string): boolean {
  const lower = code.toLowerCase()
  const featureLower = feature.toLowerCase()

  // Direct name match in part names
  if (partNames.some(n => n.includes(featureLower))) return true

  // Check in code comments and string literals
  if (lower.includes(featureLower)) return true

  // Synonyms and related patterns
  const synonymMap: Record<string, string[]> = {
    'tower': ['tower', 'turret', 'spire', 'lookout'],
    'wall': ['wall', 'exterior', 'barrier', 'facade'],
    'gate': ['gate', 'entrance', 'portcullis', 'archway'],
    'door': ['door', 'entrance', 'entry', 'doorway', 'proximityprompt'],
    'window': ['window', 'glass', 'pane', 'skylight'],
    'roof': ['roof', 'shingle', 'eave', 'overhang'],
    'stair': ['stair', 'step', 'ramp', 'ladder'],
    'light': ['pointlight', 'spotlight', 'surfacelight', 'lamp', 'lantern', 'torch'],
    'lamp': ['pointlight', 'spotlight', 'lamp', 'lantern', 'streetlight'],
    'lantern': ['pointlight', 'lantern', 'lamp'],
    'torch': ['fire', 'torch', 'pointlight'],
    'fountain': ['fountain', 'water', 'spray'],
    'garden': ['garden', 'flower', 'bush', 'plant', 'grass'],
    'tree': ['tree', 'trunk', 'branch', 'leaves', 'canopy'],
    'sign': ['surfacegui', 'textlabel', 'billboardgui', 'sign'],
    'npc': ['humanoid', 'npc', 'character', 'guard', 'villager'],
    'chest': ['chest', 'proximityprompt', 'loot', 'treasure'],
    'flag': ['flag', 'banner', 'cloth'],
    'table': ['table', 'desk', 'surface'],
    'chair': ['chair', 'seat', 'stool', 'bench'],
    'bed': ['bed', 'mattress', 'pillow'],
  }

  const synonyms = synonymMap[featureLower] || [featureLower]
  return synonyms.some(s => lower.includes(s))
}

// ---------------------------------------------------------------------------
// Category-specific minimum requirements
// ---------------------------------------------------------------------------

interface CategoryRequirements {
  minParts: number
  minYLevels: number
  minMaterials: number
  minColors: number
  requiredFeatures: string[]  // At least one of these must be present
  recommendedFeatures: string[]  // Suggestions if missing
  minLights: number
}

const CATEGORY_REQUIREMENTS: Record<string, CategoryRequirements> = {
  medieval: {
    minParts: 40, minYLevels: 4, minMaterials: 3, minColors: 4, minLights: 2,
    requiredFeatures: ['wall', 'gate or door', 'roof or tower'],
    recommendedFeatures: ['torch or lantern', 'flag or banner', 'cobblestone path', 'guard npc'],
  },
  'sci-fi': {
    minParts: 38, minYLevels: 3, minMaterials: 3, minColors: 4, minLights: 3,
    requiredFeatures: ['wall or panel', 'door', 'light'],
    recommendedFeatures: ['control panel', 'screen or display', 'sliding door', 'ambient sound'],
  },
  modern: {
    minParts: 40, minYLevels: 3, minMaterials: 3, minColors: 5, minLights: 2,
    requiredFeatures: ['wall', 'door or entrance', 'window', 'floor'],
    recommendedFeatures: ['furniture', 'light fixture', 'sign', 'path or sidewalk'],
  },
  house: {
    minParts: 40, minYLevels: 3, minMaterials: 4, minColors: 5, minLights: 2,
    requiredFeatures: ['wall', 'door', 'window', 'roof', 'floor', 'foundation', 'baseboard or trim'],
    recommendedFeatures: ['furniture', 'light', 'kitchen or bedroom', 'porch or garden'],
  },
  nature: {
    minParts: 25, minYLevels: 3, minMaterials: 3, minColors: 4, minLights: 0,
    requiredFeatures: ['tree or rock or terrain'],
    recommendedFeatures: ['water feature', 'path', 'flowers or bush', 'ambient sound'],
  },
  tycoon: {
    minParts: 30, minYLevels: 2, minMaterials: 3, minColors: 4, minLights: 1,
    requiredFeatures: ['button or prompt', 'machine or conveyor'],
    recommendedFeatures: ['display board', 'upgrade zone', 'currency display'],
  },
  obby: {
    minParts: 20, minYLevels: 5, minMaterials: 3, minColors: 5, minLights: 0,
    requiredFeatures: ['platform or part'],
    recommendedFeatures: ['checkpoint', 'kill brick', 'moving platform', 'finish line'],
  },
  pirate: {
    minParts: 40, minYLevels: 4, minMaterials: 4, minColors: 4, minLights: 2,
    requiredFeatures: ['hull or deck', 'mast or sail'],
    recommendedFeatures: ['cannon', 'wheel', 'flag', 'lantern', 'rope or rigging'],
  },
  military: {
    minParts: 35, minYLevels: 3, minMaterials: 3, minColors: 3, minLights: 1,
    requiredFeatures: ['wall or barrier', 'entrance or gate'],
    recommendedFeatures: ['watchtower', 'sandbag', 'vehicle', 'flag'],
  },
  farm: {
    minParts: 35, minYLevels: 3, minMaterials: 4, minColors: 5, minLights: 1,
    requiredFeatures: ['barn or building', 'fence'],
    recommendedFeatures: ['crop row', 'animal pen', 'windmill', 'tractor or cart', 'well'],
  },
  school: {
    minParts: 38, minYLevels: 3, minMaterials: 3, minColors: 4, minLights: 2,
    requiredFeatures: ['wall', 'door', 'window'],
    recommendedFeatures: ['desk or chair', 'blackboard or whiteboard', 'clock', 'hallway'],
  },
  terrain: {
    minParts: 15, minYLevels: 4, minMaterials: 3, minColors: 3, minLights: 0,
    requiredFeatures: ['terrain or landscape'],
    recommendedFeatures: ['variation in height', 'water', 'vegetation', 'path'],
  },
}

// Default for unknown categories
const DEFAULT_REQUIREMENTS: CategoryRequirements = {
  minParts: 30, minYLevels: 3, minMaterials: 3, minColors: 4, minLights: 1,
  requiredFeatures: ['structure or object'],
  recommendedFeatures: ['light source', 'interactive element', 'detail or decoration', 'trim or baseboard'],
}

function checkRequiredFeature(requirement: string, partNames: string[], code: string): boolean {
  // Requirements use "or" to allow alternatives: "wall or panel"
  const alternatives = requirement.split(' or ').map(s => s.trim())
  return alternatives.some(alt => isFeatureInCode(alt, partNames, code))
}

// ---------------------------------------------------------------------------
// Main audit function
// ---------------------------------------------------------------------------

export function auditBuild(
  code: string,
  aiResponse: string,
  userPrompt: string,
): AuditResult {
  const features = extractCodeFeatures(code)
  const claims = extractClaims(aiResponse)
  const category = detectCategory(userPrompt)
  const requirements = category ? (CATEGORY_REQUIREMENTS[category] || DEFAULT_REQUIREMENTS) : DEFAULT_REQUIREMENTS

  // Check which claimed features are actually in the code
  const foundFeatures: string[] = []
  const missingFeatures: string[] = []
  for (const claim of claims) {
    if (isFeatureInCode(claim, features.partNames, code)) {
      foundFeatures.push(claim)
    } else {
      missingFeatures.push(claim)
    }
  }

  // Check category requirements
  const missingRequirements: string[] = []
  for (const req of requirements.requiredFeatures) {
    if (!checkRequiredFeature(req, features.partNames, code)) {
      missingRequirements.push(req)
    }
  }

  // Build suggestions
  const suggestions: string[] = []

  if (features.parts < requirements.minParts) {
    suggestions.push(`Need ${requirements.minParts}+ parts, only have ${features.parts}. Add more structural detail.`)
  }
  if (features.uniqueYLevels < requirements.minYLevels) {
    suggestions.push(`Build is too flat — only ${features.uniqueYLevels} height levels. Add vertical variation (floors, roofs, raised elements).`)
  }
  if (features.materials.size < requirements.minMaterials) {
    suggestions.push(`Only ${features.materials.size} material(s) used. Add material variety (${requirements.minMaterials}+ needed).`)
  }
  if (features.colors < requirements.minColors) {
    suggestions.push(`Only ${features.colors} colors. Add color variety (${requirements.minColors}+ needed).`)
  }
  if (features.lights < requirements.minLights) {
    suggestions.push(`Need ${requirements.minLights}+ light sources (PointLight/SpotLight), have ${features.lights}. Add lighting to lamps, torches, windows.`)
  }
  if (missingFeatures.length > 0) {
    suggestions.push(`AI described: ${missingFeatures.join(', ')} — but code doesn't include them. Add these features.`)
  }
  if (missingRequirements.length > 0) {
    suggestions.push(`${category || 'This'} build requires: ${missingRequirements.join(', ')}. Add them.`)
  }
  if (!features.hasAnchoring) {
    suggestions.push('Parts are not anchored — add .Anchored = true')
  }
  if (features.interactive === 0 && features.parts > 15) {
    suggestions.push('No interactive elements. Add ProximityPrompt on doors, ClickDetector on buttons, TweenService for animations.')
  }

  // Add recommended features as suggestions
  for (const rec of requirements.recommendedFeatures) {
    if (!isFeatureInCode(rec.split(' or ')[0], features.partNames, code)) {
      suggestions.push(`Consider adding: ${rec}`)
    }
  }

  // Calculate detail score (0-100)
  let detailScore = 0
  detailScore += Math.min(30, (features.parts / requirements.minParts) * 30) // Parts: up to 30
  detailScore += Math.min(15, (features.uniqueYLevels / requirements.minYLevels) * 15) // Height: up to 15
  detailScore += Math.min(10, (features.materials.size / requirements.minMaterials) * 10) // Materials: up to 10
  detailScore += Math.min(10, (features.colors / Math.max(requirements.minColors, 1)) * 10) // Colors: up to 10
  detailScore += Math.min(10, (features.lights / Math.max(requirements.minLights, 1)) * 10) // Lights: up to 10
  detailScore += Math.min(10, features.interactive * 5) // Interactive: up to 10
  detailScore += Math.min(5, features.effects * 2.5) // Effects: up to 5
  detailScore += Math.min(5, features.ui * 2.5) // UI: up to 5
  detailScore += Math.min(5, features.sounds * 5) // Sound: up to 5
  // Penalty for claiming things that aren't there
  if (claims.length > 0) {
    const claimAccuracy = foundFeatures.length / claims.length
    detailScore *= (0.5 + 0.5 * claimAccuracy) // Up to 50% penalty for lies
  }
  detailScore = Math.round(Math.max(0, Math.min(100, detailScore)))

  // Pass/fail decision
  const passed =
    features.parts >= requirements.minParts * 0.7 && // Allow 30% grace on parts
    missingRequirements.length === 0 &&
    missingFeatures.length <= claims.length * 0.3 && // Allow 30% unmatched claims
    detailScore >= 40

  return {
    passed,
    detailScore,
    claimedFeatures: claims,
    foundFeatures,
    missingFeatures,
    missingRequirements,
    partCount: features.parts,
    uniqueNames: new Set(features.partNames).size,
    uniqueMaterials: features.materials.size,
    uniqueColors: features.colors,
    lightCount: features.lights,
    interactiveCount: features.interactive,
    suggestions: suggestions.slice(0, 6), // Cap at 6 most important
  }
}

/**
 * Format audit failure into a retry prompt that tells the AI exactly what to fix.
 */
export function formatAuditRetryPrompt(audit: AuditResult, originalPrompt: string): string {
  const lines: string[] = [
    `ORIGINAL REQUEST: "${originalPrompt}"`,
    '',
    'YOUR PREVIOUS BUILD WAS INCOMPLETE. Here is exactly what is wrong:',
    '',
    `Parts: ${audit.partCount} (need more detail and sub-objects)`,
    `Materials: ${audit.uniqueMaterials} unique`,
    `Colors: ${audit.uniqueColors} unique`,
    `Lights: ${audit.lightCount} (add PointLight/SpotLight to light fixtures)`,
    `Interactive elements: ${audit.interactiveCount} (add ProximityPrompt, ClickDetector, TweenService)`,
    '',
  ]

  if (audit.missingFeatures.length > 0) {
    lines.push(`YOU DESCRIBED but DID NOT BUILD: ${audit.missingFeatures.join(', ')}`)
    lines.push('Do NOT describe features you did not code. Build EVERYTHING you mention.')
    lines.push('')
  }

  if (audit.missingRequirements.length > 0) {
    lines.push(`REQUIRED but MISSING: ${audit.missingRequirements.join(', ')}`)
    lines.push('')
  }

  if (audit.suggestions.length > 0) {
    lines.push('SPECIFIC FIXES NEEDED:')
    for (const s of audit.suggestions) {
      lines.push(`- ${s}`)
    }
    lines.push('')
  }

  lines.push('Generate the COMPLETE build again from scratch. Include ALL features. Every object you mention in your description MUST exist in the code. Add lights, interactive elements, and detail.')

  return lines.join('\n')
}
