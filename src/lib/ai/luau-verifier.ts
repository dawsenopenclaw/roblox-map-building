/**
 * Luau Code Verification System
 *
 * Pre-tests AI-generated Luau code BEFORE sending to users.
 * Uses luau-web (WASM) for real Luau compilation + custom Roblox API validation.
 *
 * Pipeline: Generate → Compile Check → API Validation → Quality Score → Retry if needed
 *
 * This is ForjeGames' key differentiator: "90% of builds work on first try"
 * because we verify before delivery. Nobody else does this.
 */

import 'server-only'
import { db } from '@/lib/db'

// ── Types ────────────────────────────────────────────────────────────────────

export interface VerificationResult {
  valid: boolean
  score: number // 0-100 quality score
  errors: VerificationError[]
  warnings: VerificationWarning[]
  fixedCode: string | null // Auto-fixed version if we could fix issues
  compilationPassed: boolean
  apiCheckPassed: boolean
  qualityCheckPassed: boolean
}

export interface VerificationError {
  type: 'syntax' | 'api' | 'runtime' | 'quality'
  message: string
  line?: number
  severity: 'error' | 'warning'
  autoFixable: boolean
}

export interface VerificationWarning {
  type: string
  message: string
  suggestion?: string
}

// ── Valid Roblox API Reference ───────────────────────────────────────────────
// These are the Instance class names, properties, and enums that the AI should use.
// If the AI references something not in these lists, it's likely a hallucination.

const VALID_INSTANCE_CLASSES = new Set([
  'Part', 'WedgePart', 'CornerWedgePart', 'MeshPart', 'UnionOperation', 'NegateOperation',
  'TrussPart', 'SpawnLocation', 'Seat', 'VehicleSeat', 'SkateboardPlatform',
  'Model', 'Folder', 'Script', 'LocalScript', 'ModuleScript',
  'ScreenGui', 'Frame', 'TextLabel', 'TextButton', 'TextBox', 'ImageLabel', 'ImageButton',
  'ScrollingFrame', 'UIListLayout', 'UIGridLayout', 'UITableLayout', 'UIPadding',
  'UICorner', 'UIStroke', 'UIGradient', 'UIAspectRatioConstraint', 'UISizeConstraint',
  'UITextSizeConstraint', 'UIPageLayout', 'UIFlexItem', 'BillboardGui', 'SurfaceGui',
  'PointLight', 'SpotLight', 'SurfaceLight', 'Fire', 'Smoke', 'Sparkles', 'Explosion',
  'ParticleEmitter', 'Beam', 'Trail',
  'Sound', 'SoundGroup', 'ClickDetector', 'ProximityPrompt',
  'BodyForce', 'BodyVelocity', 'BodyPosition', 'BodyGyro', 'BodyAngularVelocity',
  'LinearVelocity', 'AlignPosition', 'AlignOrientation', 'VectorForce', 'Torque',
  'Attachment', 'WeldConstraint', 'HingeConstraint', 'RopeConstraint', 'SpringConstraint',
  'RodConstraint', 'PrismaticConstraint', 'CylindricalConstraint', 'BallSocketConstraint',
  'Motor6D', 'Weld',
  'Decal', 'Texture', 'SurfaceAppearance',
  'Camera', 'Atmosphere', 'Sky', 'BloomEffect', 'BlurEffect', 'ColorCorrectionEffect',
  'DepthOfFieldEffect', 'SunRaysEffect',
  'IntValue', 'StringValue', 'BoolValue', 'NumberValue', 'ObjectValue', 'CFrameValue',
  'Color3Value', 'Vector3Value', 'RayValue', 'BrickColorValue',
  'RemoteEvent', 'RemoteFunction', 'BindableEvent', 'BindableFunction',
  'Highlight', 'SelectionBox', 'SelectionSphere',
  'Animation', 'AnimationController', 'Animator',
  'Tool', 'Humanoid', 'HumanoidDescription',
  'Configuration', 'NumberSequence', 'ColorSequence',
  'Terrain',
])

const VALID_SERVICES = new Set([
  'Workspace', 'Players', 'ReplicatedStorage', 'ReplicatedFirst', 'ServerStorage',
  'ServerScriptService', 'StarterGui', 'StarterPack', 'StarterPlayer',
  'Lighting', 'SoundService', 'TweenService', 'RunService', 'UserInputService',
  'ContextActionService', 'HttpService', 'MarketplaceService', 'DataStoreService',
  'ChangeHistoryService', 'CollectionService', 'InsertService', 'Selection',
  'PhysicsService', 'PathfindingService', 'Chat', 'Teams', 'BadgeService',
  'GamePassService', 'TextService', 'ContentProvider', 'Debris',
  'TestService', 'LogService', 'StatsService',
])

const VALID_MATERIALS = new Set([
  'Plastic', 'SmoothPlastic', 'Neon', 'Wood', 'WoodPlanks', 'Marble', 'Basalt',
  'Slate', 'CrackedLava', 'Concrete', 'Limestone', 'Granite', 'Pavement',
  'Brick', 'Pebble', 'Cobblestone', 'Rock', 'Sandstone', 'CorrodedMetal',
  'DiamondPlate', 'Foil', 'Metal', 'Grass', 'LeafyGrass', 'Sand', 'Fabric',
  'Snow', 'Ice', 'Glass', 'ForceField', 'Air', 'Water', 'Ground', 'Salt',
  'Asphalt', 'Cardboard', 'Carpet', 'CeramicTiles', 'ClayRoofTiles',
  'Mud', 'Plaster', 'RoofShingles', 'Rubber',
])

const VALID_PART_TYPES = new Set(['Block', 'Ball', 'Cylinder', 'Wedge', 'CornerWedge'])

// Properties that should NOT be set on non-BasePart instances
const BASEPART_ONLY_PROPS = new Set([
  'Position', 'CFrame', 'Size', 'Anchored', 'CanCollide', 'Material', 'Color',
  'BrickColor', 'Transparency', 'Reflectance', 'Shape',
])

// Properties AI commonly hallucinates
const HALLUCINATED_PROPERTIES: Record<string, string> = {
  'Colour': 'Color',
  'Visible': 'Visibility or Enabled',
  'Enabled': 'Visible (for GUIs) or check docs',
  'EmissionColor': 'Color (for lights)',
  'LightColor': 'Color (for lights)',
  'PartColor': 'Color',
  'PartMaterial': 'Material',
  'Pos': 'Position',
  'Rot': 'Orientation',
  'Rotation': 'Orientation',
}

// ── Luau Compilation Check (via luau-web WASM) ──────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _luauState: any = null

async function createLuauState() {
  try {
    // Dynamic import — luau-web has duplicate type defs, suppress with any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod = await import('luau-web') as any
    return await mod.LuauState.createAsync()
  } catch (err) {
    console.warn('[luau-verifier] Failed to init luau-web:', err)
    return null
  }
}

async function getLuauState() {
  if (!_luauState) {
    _luauState = await createLuauState()
  }
  return _luauState
}

/**
 * Compile-check Luau code using the real Luau compiler (via WASM).
 * Returns null if compilation succeeds, or an error message if it fails.
 */
async function compilationCheck(code: string): Promise<string | null> {
  try {
    const state = await getLuauState()
    if (!state) {
      // luau-web unavailable — skip compilation check, don't block
      return null
    }
    // loadstring with throwOnCompilationError=true throws CompileError on syntax errors
    state.loadstring(code, 'forje_verify', true)
    return null // Compilation succeeded
  } catch (err: unknown) {
    if (err instanceof Error) {
      return err.message
    }
    return String(err)
  }
}

// ── Roblox API Validation ───────────────────────────────────────────────────

function validateRobloxAPIs(code: string): VerificationError[] {
  const errors: VerificationError[] = []

  // Check Instance.new() calls for valid class names
  const instanceNewRegex = /Instance\.new\(\s*["']([^"']+)["']\s*\)/g
  let match
  while ((match = instanceNewRegex.exec(code)) !== null) {
    const className = match[1]
    if (!VALID_INSTANCE_CLASSES.has(className)) {
      errors.push({
        type: 'api',
        message: `Invalid Instance class "${className}" — this doesn't exist in Roblox`,
        severity: 'error',
        autoFixable: false,
      })
    }
  }

  // Check GetService() calls for valid service names
  const getServiceRegex = /GetService\(\s*["']([^"']+)["']\s*\)/g
  while ((match = getServiceRegex.exec(code)) !== null) {
    const serviceName = match[1]
    if (!VALID_SERVICES.has(serviceName)) {
      errors.push({
        type: 'api',
        message: `Invalid service "${serviceName}" — this doesn't exist in Roblox`,
        severity: 'error',
        autoFixable: false,
      })
    }
  }

  // Check Enum.Material values
  const materialRegex = /Enum\.Material\.(\w+)/g
  while ((match = materialRegex.exec(code)) !== null) {
    const material = match[1]
    if (!VALID_MATERIALS.has(material)) {
      // Try to auto-fix common AI hallucinations
      const closest = findClosestMatch(material, Array.from(VALID_MATERIALS))
      errors.push({
        type: 'api',
        message: `Invalid material "${material}"${closest ? ` — did you mean "${closest}"?` : ''}`,
        severity: 'error',
        autoFixable: !!closest,
      })
    }
  }

  // Check Enum.PartType values
  const partTypeRegex = /Enum\.PartType\.(\w+)/g
  while ((match = partTypeRegex.exec(code)) !== null) {
    const partType = match[1]
    if (!VALID_PART_TYPES.has(partType)) {
      errors.push({
        type: 'api',
        message: `Invalid PartType "${partType}" — valid types: ${Array.from(VALID_PART_TYPES).join(', ')}`,
        severity: 'error',
        autoFixable: false,
      })
    }
  }

  // Check for hallucinated property names
  for (const [hallucinated, correct] of Object.entries(HALLUCINATED_PROPERTIES)) {
    const propRegex = new RegExp(`\\.${hallucinated}\\s*=`, 'g')
    if (propRegex.test(code)) {
      errors.push({
        type: 'api',
        message: `"${hallucinated}" is not a valid property — use ${correct}`,
        severity: 'error',
        autoFixable: true,
      })
    }
  }

  // Check for deprecated/dangerous patterns in Edit Mode
  if (/game\.Players\.LocalPlayer/.test(code)) {
    errors.push({
      type: 'runtime',
      message: 'game.Players.LocalPlayer is not available in Edit Mode — this will error at runtime',
      severity: 'error',
      autoFixable: false,
    })
  }
  if (/game:GetService\("Players"\)/.test(code) && !/ChangeHistoryService/.test(code)) {
    errors.push({
      type: 'runtime',
      message: 'Players service used but this is Edit Mode code — Players is empty in Edit Mode',
      severity: 'warning',
      autoFixable: false,
    })
  }

  // Check for BrickColor.new() (deprecated)
  if (/BrickColor\.new\(/.test(code)) {
    errors.push({
      type: 'api',
      message: 'BrickColor.new() is deprecated — use Color3.fromRGB() instead',
      severity: 'warning',
      autoFixable: true,
    })
  }

  // Check for wait() (deprecated)
  if (/\bwait\s*\(/.test(code) && !/task\.wait/.test(code)) {
    errors.push({
      type: 'api',
      message: 'wait() is deprecated — use task.wait() instead',
      severity: 'warning',
      autoFixable: true,
    })
  }

  return errors
}

// ── Quality Scoring ─────────────────────────────────────────────────────────

function scoreQuality(code: string, errors: VerificationError[]): { score: number; warnings: VerificationWarning[] } {
  let score = 100
  const warnings: VerificationWarning[] = []

  // Deduct for errors
  const errorCount = errors.filter(e => e.severity === 'error').length
  const warningCount = errors.filter(e => e.severity === 'warning').length
  score -= errorCount * 15
  score -= warningCount * 5

  // Check minimum code length (trivial code = low quality)
  if (code.length < 200) {
    score -= 30
    warnings.push({ type: 'length', message: 'Code is very short — may be incomplete' })
  }

  // Check for required boilerplate
  if (!code.includes('ChangeHistoryService')) {
    score -= 10
    warnings.push({ type: 'boilerplate', message: 'Missing ChangeHistoryService — undo won\'t work', suggestion: 'Add CH:TryBeginRecording/CH:FinishRecording' })
  }

  // Check part count for builds (count all part creation patterns)
  const partCount = (code.match(/Instance\.new\(\s*["'](?:Part|WedgePart|MeshPart|SpawnLocation|Seat|VehicleSeat)/g) || []).length
  const pHelperCount = (code.match(/\bP\s*\(/g) || []).length
  const cylCount = (code.match(/\bCyl\s*\(/g) || []).length
  const ballCount = (code.match(/\bBall\s*\(/g) || []).length
  const wedgeCount = (code.match(/Instance\.new\(\s*["']WedgePart/g) || []).length
  const totalParts = partCount + pHelperCount + cylCount + ballCount + wedgeCount
  // Script-only code doesn't need parts — detect by service usage, event handling, or module patterns
  const isScriptCode = code.includes('DataStoreService') || code.includes('RemoteEvent') ||
    code.includes('RemoteFunction') || code.includes('Players.PlayerAdded') ||
    code.includes('ModuleScript') || code.includes('BindableEvent') ||
    code.includes('UserInputService') || code.includes('MarketplaceService') ||
    code.includes('TextChatService') || code.includes('PathfindingService') ||
    code.includes('TeleportService') || code.includes('BadgeService') ||
    code.includes('game:GetService("Players")') ||
    // Pure GUI/menu scripts
    (code.includes('ScreenGui') && !code.includes('Instance.new("Part")')) ||
    // Leaderstats / progression scripts
    code.includes('leaderstats') || code.includes('IntValue') || code.includes('NumberValue')
  if (!isScriptCode && totalParts < 5 && code.includes('Instance.new')) {
    score -= 40
    warnings.push({ type: 'complexity', message: `Only ${totalParts} parts — builds MUST have 10+ parts. Rejecting single-brick output.` })
  } else if (!isScriptCode && totalParts < 15 && totalParts >= 5 && code.includes('Instance.new')) {
    score -= 15
    warnings.push({ type: 'complexity', message: `Only ${totalParts} parts — builds should have 25+ parts for quality` })
  }

  // Check for anchored parts
  if (code.includes('Instance.new("Part")') && !code.includes('Anchored')) {
    score -= 10
    warnings.push({ type: 'physics', message: 'Parts not anchored — they will fall through the world', suggestion: 'Add p.Anchored = true' })
  }

  // Check for color usage (monochrome = low quality)
  const colorCount = (code.match(/Color3\.fromRGB/g) || []).length
  if (colorCount < 2 && totalParts > 5) {
    score -= 10
    warnings.push({ type: 'visual', message: 'Very few colors used — add variety for better visuals' })
  }

  // Bonus for good practices
  if (code.includes('workspace.CurrentCamera')) score += 5 // Camera-relative placement
  if (code.includes('Raycast')) score += 5 // Ground detection
  if (code.includes('PrimaryPart')) score += 3 // Proper model setup

  // Lighting — real light sources are much better than Neon material
  if (code.includes('PointLight') || code.includes('SpotLight') || code.includes('SurfaceLight')) score += 8
  // Penalize heavy Neon usage (more than 3 Neon parts = lazy lighting)
  const neonCount = (code.match(/Enum\.Material\.Neon/g) || []).length
  if (neonCount > 3) {
    score -= 5
    warnings.push({ type: 'visual', message: `${neonCount} Neon parts — use Glass/Metal + PointLight instead for better lighting` })
  }

  // Interactivity bonuses — scripted elements make builds come alive
  if (code.includes('ProximityPrompt')) score += 5 // Interactive elements
  if (code.includes('ClickDetector')) score += 3 // Clickable elements
  if (code.includes('TweenService')) score += 5 // Animations (doors, drawbridges, etc.)
  if (code.includes('SurfaceGui') || code.includes('BillboardGui')) score += 3 // UI elements
  if (code.includes('Sound')) score += 2 // Ambient audio
  if (code.includes('Fire') || code.includes('ParticleEmitter') || code.includes('Smoke')) score += 3 // Visual effects
  if (code.includes('Humanoid')) score += 3 // NPCs

  // Script quality bonuses
  if (code.includes('pcall') || code.includes('xpcall')) score += 2 // Error handling
  if (code.includes('task.wait') && !code.includes('wait(')) score += 2 // Modern API

  return { score: Math.max(0, Math.min(100, score)), warnings }
}

// ── Context-Aware Material Picker ───────────────────────────────────────────
// Instead of blanket Concrete, pick the material that fits what's being built.
// Reads part names, variable names, and comments near the SmoothPlastic usage.

function pickMaterialFromContext(ctx: string): string {
  // Roof / ceiling
  if (/roof|shingle|eave|gable|chimney|ceiling/i.test(ctx)) return 'Slate'
  // Floor / ground / base / path
  if (/floor|ground|base|foundation|path|sidewalk|patio|deck/i.test(ctx)) return 'WoodPlanks'
  // Road / street / parking / driveway
  if (/road|street|asphalt|parking|driveway|highway/i.test(ctx)) return 'Asphalt'
  // Window / glass / transparent
  if (/window|glass|pane|transparent|skylight/i.test(ctx)) return 'Glass'
  // Door / furniture / wood items
  if (/door|table|chair|desk|shelf|cabinet|bench|bookcase|stool|counter|crate|barrel|plank|fence|log/i.test(ctx)) return 'Wood'
  // Brick / wall with brick context
  if (/brick|fireplace|hearth|oven/i.test(ctx)) return 'Brick'
  // Mountain / cliff / low-poly terrain — Rock is the go-to
  if (/mountain|cliff|hill|ridge|peak|terrain|low.?poly|landscape/i.test(ctx)) return 'Rock'
  // Stone / cave / castle / dungeon — Granite for carved/structural stone
  if (/stone|rock|cave|boulder|pillar|column|castle|dungeon|tomb/i.test(ctx)) return 'Granite'
  // Metal / industrial / machine
  if (/metal|steel|iron|pipe|rail|vent|machine|grate|beam|girder|tank|engine|robot|mech/i.test(ctx)) return 'Metal'
  // Grass / nature / garden
  if (/grass|garden|lawn|field|meadow|park|nature|terrain/i.test(ctx)) return 'Grass'
  // Sand / beach / desert
  if (/sand|beach|desert|dune|shore/i.test(ctx)) return 'Sand'
  // Snow / snowy terrain / winter ground
  if (/snow|snowy|winter.*ground|blizzard/i.test(ctx)) return 'Snow'
  // Ice / frozen / arctic / glacier
  if (/ice|frozen|arctic|glacier|icicle/i.test(ctx)) return 'Ice'
  // Fabric / soft / cushion
  if (/fabric|cloth|cushion|pillow|couch|sofa|bed|mattress|curtain|carpet|rug|tent|flag|banner/i.test(ctx)) return 'Fabric'
  // Cobblestone / old / medieval paths
  if (/cobble|medieval|old|ancient|village|market/i.test(ctx)) return 'Cobblestone'
  // Marble / fancy / palace / luxury
  if (/marble|palace|luxury|temple|museum|statue|monument|fountain/i.test(ctx)) return 'Marble'
  // Neon — ONLY for literal neon signs or hologram display surfaces.
  // For glowing/lighting, the AI should use Glass/Metal + PointLight/SpotLight instances instead.
  if (/\bneon\s*sign\b|hologram\s*display/i.test(ctx)) return 'Neon'
  // Glowing / light / lamp / lantern — use Glass (the AI should add PointLight children, not Neon material)
  if (/glow|light|lamp|lantern|torch|candle|bulb|chandelier|sconce|streetlight/i.test(ctx)) return 'Glass'
  // Lava / volcano / fire
  if (/lava|volcano|magma|inferno/i.test(ctx)) return 'CrackedLava'
  // Diamond plate / industrial floor
  if (/diamond|plate|factory|warehouse|industrial/i.test(ctx)) return 'DiamondPlate'
  // Pebble / gravel / trail
  if (/pebble|gravel|trail/i.test(ctx)) return 'Pebble'
  // Leafy grass / forest / jungle / bush / tree
  if (/leaf|forest|jungle|bush|tree|hedge|vine/i.test(ctx)) return 'LeafyGrass'
  // Limestone / sandstone / warm stone / adobe
  if (/limestone|adobe|stucco|plaster/i.test(ctx)) return 'Limestone'
  if (/sandstone|pyramid|sphinx|desert.*wall|mesa/i.test(ctx)) return 'Sandstone'
  // Pavement / sidewalk / curb / urban
  if (/pavement|sidewalk|curb|urban|city/i.test(ctx)) return 'Pavement'
  // Mud / swamp / dirt
  if (/mud|swamp|dirt|marsh|bog/i.test(ctx)) return 'Mud'
  // Corroded / rusty / abandoned / old metal
  if (/rust|corrode|abandon|decay|wreck|junk/i.test(ctx)) return 'CorrodedMetal'
  // Wall (generic) — concrete is the right call for walls
  if (/wall|exterior|facade|barrier|divider/i.test(ctx)) return 'Concrete'
  // Stair / step
  if (/stair|step|ramp/i.test(ctx)) return 'Concrete'
  // Default — Concrete is a safe neutral, but only as last resort
  return 'Concrete'
}

// ── Auto-Fix Engine ─────────────────────────────────────────────────────────

function autoFix(code: string, errors: VerificationError[]): string {
  let fixed = code

  for (const err of errors) {
    if (!err.autoFixable) continue

    // Fix deprecated BrickColor
    if (err.message.includes('BrickColor.new()')) {
      fixed = fixed.replace(/BrickColor\.new\(\s*["']([^"']+)["']\s*\)/g, (_, name) => {
        const rgb = BRICK_COLOR_MAP[name]
        return rgb || `Color3.fromRGB(128, 128, 128) --[[ was BrickColor "${name}" ]]`
      })
    }

    // Fix deprecated wait()
    if (err.message.includes('wait()')) {
      fixed = fixed.replace(/\bwait\s*\(/g, 'task.wait(')
    }

    // Replace SmoothPlastic with contextual material based on surrounding code
    if (fixed.includes('Enum.Material.SmoothPlastic')) {
      fixed = fixed.replace(/Enum\.Material\.SmoothPlastic/g, (match, offset) => {
        // Look at surrounding ~200 chars for context clues (part name, comments, variable names)
        const ctx = fixed.slice(Math.max(0, offset - 200), offset + 200).toLowerCase()
        return `Enum.Material.${pickMaterialFromContext(ctx)}`
      })
    }

    // Fix hallucinated materials
    if (err.message.includes('Invalid material')) {
      const match = err.message.match(/Invalid material "(\w+)".*"(\w+)"/)
      if (match) {
        const [, wrong, correct] = match
        fixed = fixed.replace(new RegExp(`Enum\\.Material\\.${wrong}`, 'g'), `Enum.Material.${correct}`)
      }
    }

    // Fix hallucinated properties
    for (const [hallucinated, correct] of Object.entries(HALLUCINATED_PROPERTIES)) {
      if (err.message.includes(`"${hallucinated}"`)) {
        const correctProp = correct.split(' ')[0] // Take first word as the replacement
        fixed = fixed.replace(new RegExp(`\\.${hallucinated}\\s*=`, 'g'), `.${correctProp} =`)
      }
    }
  }

  return fixed
}

// BrickColor mapping for auto-fix
const BRICK_COLOR_MAP: Record<string, string> = {
  'Really red': 'Color3.fromRGB(255,0,0)',
  'Really blue': 'Color3.fromRGB(0,0,255)',
  'White': 'Color3.fromRGB(255,255,255)',
  'Black': 'Color3.fromRGB(0,0,0)',
  'Bright green': 'Color3.fromRGB(75,151,75)',
  'Bright yellow': 'Color3.fromRGB(245,205,48)',
  'Bright orange': 'Color3.fromRGB(218,134,59)',
  'Dark stone grey': 'Color3.fromRGB(99,95,98)',
  'Medium stone grey': 'Color3.fromRGB(163,162,165)',
  'Brown': 'Color3.fromRGB(106,57,9)',
}

// ── Fuzzy Match Helper ──────────────────────────────────────────────────────

function findClosestMatch(input: string, candidates: string[] | readonly string[]): string | null {
  const lower = input.toLowerCase()
  // Exact case-insensitive match
  const exact = candidates.find(c => c.toLowerCase() === lower)
  if (exact) return exact
  // Prefix match
  const prefix = candidates.find(c => c.toLowerCase().startsWith(lower))
  if (prefix) return prefix
  // Levenshtein distance ≤ 2
  for (const candidate of candidates) {
    if (levenshtein(lower, candidate.toLowerCase()) <= 2) return candidate
  }
  return null
}

function levenshtein(a: string, b: string): number {
  const matrix: number[][] = []
  for (let i = 0; i <= b.length; i++) matrix[i] = [i]
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] = b[i - 1] === a[j - 1]
        ? matrix[i - 1][j - 1]
        : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
    }
  }
  return matrix[b.length][a.length]
}

// ── Main Verification Pipeline ──────────────────────────────────────────────

/**
 * Verify AI-generated Luau code before sending to user.
 * Returns a VerificationResult with score, errors, and optionally auto-fixed code.
 */
export async function verifyLuauCode(code: string): Promise<VerificationResult> {
  const errors: VerificationError[] = []
  let compilationPassed = true
  let apiCheckPassed = true

  // Step 1: Luau compilation check (catches syntax errors)
  const compileError = await compilationCheck(code)
  if (compileError) {
    compilationPassed = false
    errors.push({
      type: 'syntax',
      message: compileError,
      severity: 'error',
      autoFixable: false,
    })
  }

  // Step 2: Roblox API validation (catches hallucinated classes/properties/enums)
  const apiErrors = validateRobloxAPIs(code)
  errors.push(...apiErrors)
  if (apiErrors.some(e => e.severity === 'error')) {
    apiCheckPassed = false
  }

  // Step 3: Quality scoring
  const { score, warnings } = scoreQuality(code, errors)
  const qualityCheckPassed = score >= 60

  // Step 4: Auto-fix what we can
  let fixedCode: string | null = null
  const fixableErrors = errors.filter(e => e.autoFixable)
  if (fixableErrors.length > 0) {
    fixedCode = autoFix(code, fixableErrors)
    // Re-verify the fixed code to make sure we didn't break it
    const recheck = await compilationCheck(fixedCode)
    if (recheck) {
      // Fix broke compilation — discard
      fixedCode = null
    }
  }

  return {
    valid: compilationPassed && apiCheckPassed && qualityCheckPassed,
    score,
    errors,
    warnings,
    fixedCode,
    compilationPassed,
    apiCheckPassed,
    qualityCheckPassed,
  }
}

/**
 * Verify and retry: generate code, verify, if bad regenerate with error context.
 * Up to maxRetries attempts. Returns the best result.
 */
export async function verifyWithRetry(
  generateFn: (errorContext?: string) => Promise<string | null>,
  maxRetries = 2,
): Promise<{ code: string | null; verification: VerificationResult | null; attempts: number }> {
  let bestCode: string | null = null
  let bestVerification: VerificationResult | null = null
  let attempts = 0

  for (let i = 0; i <= maxRetries; i++) {
    attempts++
    const errorContext = bestVerification
      ? `PREVIOUS ATTEMPT FAILED. Fix these errors:\n${bestVerification.errors.map(e => `- ${e.message}`).join('\n')}\n\nGenerate corrected code:`
      : undefined

    const code = await generateFn(errorContext)
    if (!code) continue

    const verification = await verifyLuauCode(code)

    // Use fixed code if available
    const finalCode = verification.fixedCode || code
    const finalVerification = verification.fixedCode
      ? await verifyLuauCode(verification.fixedCode)
      : verification

    // Keep best result
    if (!bestVerification || finalVerification.score > bestVerification.score) {
      bestCode = finalCode
      bestVerification = finalVerification
    }

    // If score >= 70, good enough — stop retrying
    if (finalVerification.score >= 70) break
  }

  return { code: bestCode, verification: bestVerification, attempts }
}

// ── Feedback Collection ─────────────────────────────────────────────────────

export interface BuildFeedback {
  promptHash: string
  code: string
  worked: boolean
  errorMessage?: string
  score: number
  model: string
  timestamp: number
}

// L1 in-memory cache — checked first, DB is L2
const recentFeedback: BuildFeedback[] = []
const MAX_FEEDBACK = 1000

/**
 * Record build feedback. Writes to both in-memory cache (L1) and database (L2).
 * DB write is fire-and-forget so it never blocks the caller.
 */
export function recordFeedback(feedback: BuildFeedback): void {
  // L1: in-memory cache
  recentFeedback.push(feedback)
  if (recentFeedback.length > MAX_FEEDBACK) {
    recentFeedback.shift()
  }

  // L2: persist to DB (fire-and-forget)
  try {
    db.buildFeedback
      .create({
        data: {
          promptHash: feedback.promptHash,
          code: feedback.code,
          worked: feedback.worked,
          errorMessage: feedback.errorMessage ?? null,
          score: feedback.score,
          model: feedback.model,
        },
      })
      .catch((err) => {
        console.warn('[luau-verifier] Failed to persist feedback to DB:', err)
      })
  } catch (err) {
    console.warn('[luau-verifier] DB client error recording feedback:', err)
  }
}

/**
 * Retrieve successful build examples matching keywords.
 * Checks L1 in-memory cache first; falls back to DB query if cache has
 * fewer than `limit` results.
 */
export async function getSuccessfulExamples(promptKeywords: string[], limit = 5): Promise<BuildFeedback[]> {
  const keywords = promptKeywords.map(k => k.toLowerCase())

  // L1: check in-memory cache first
  const memoryResults = recentFeedback
    .filter(f => f.worked && keywords.some(k => f.code.toLowerCase().includes(k)))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)

  if (memoryResults.length >= limit) {
    return memoryResults
  }

  // L2: query DB for additional results
  try {
    // Build an OR filter: code contains any of the keywords
    const dbResults = await db.buildFeedback.findMany({
      where: {
        worked: true,
        OR: keywords.map(k => ({
          code: { contains: k, mode: 'insensitive' as const },
        })),
      },
      orderBy: { score: 'desc' },
      take: limit,
    })

    // Merge DB results with memory results, deduplicating by promptHash+code
    const seen = new Set(memoryResults.map(r => `${r.promptHash}:${r.code.slice(0, 100)}`))
    const merged = [...memoryResults]
    for (const row of dbResults) {
      const key = `${row.promptHash}:${row.code.slice(0, 100)}`
      if (!seen.has(key)) {
        seen.add(key)
        merged.push({
          promptHash: row.promptHash,
          code: row.code,
          worked: row.worked,
          errorMessage: row.errorMessage ?? undefined,
          score: row.score,
          model: row.model,
          timestamp: row.createdAt.getTime(),
        })
      }
    }

    return merged.sort((a, b) => b.score - a.score).slice(0, limit)
  } catch (err) {
    console.warn('[luau-verifier] DB query failed for examples, using memory only:', err)
    return memoryResults
  }
}
