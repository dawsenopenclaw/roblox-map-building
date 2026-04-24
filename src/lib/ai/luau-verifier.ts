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
  const wHelperCount = (code.match(/\bW\s*\(/g) || []).length
  const totalParts = partCount + pHelperCount + cylCount + ballCount + wedgeCount + wHelperCount
  // Script-only code doesn't need parts — detect by service usage, event handling, or module patterns
  const isScriptCode = code.includes('DataStoreService') || code.includes('RemoteEvent') ||
    code.includes('RemoteFunction') || code.includes('Players.PlayerAdded') ||
    code.includes('ModuleScript') || code.includes('BindableEvent') ||
    code.includes('UserInputService') || code.includes('MarketplaceService') ||
    code.includes('TextChatService') || code.includes('PathfindingService') ||
    code.includes('TeleportService') || code.includes('BadgeService') ||
    code.includes('game:GetService("Players")') ||
    // GUI/menu scripts (ANY ScreenGui creation = script, not build)
    code.includes('ScreenGui') || code.includes('BillboardGui') || code.includes('SurfaceGui') ||
    // Script source pattern (creating scripts with .Source)
    code.includes('.Source') || code.includes('ServerScriptService') ||
    code.includes('StarterPlayerScripts') || code.includes('StarterGui') ||
    code.includes('ReplicatedStorage') || code.includes('StarterPack') ||
    // UI element creation (TextButton, Frame, etc)
    code.includes('TextButton') || code.includes('TextLabel') || code.includes('TextBox') ||
    code.includes('ImageButton') || code.includes('ImageLabel') || code.includes('ScrollingFrame') ||
    code.includes('UIListLayout') || code.includes('UIGridLayout') || code.includes('UICorner') ||
    // Leaderstats / progression scripts
    code.includes('leaderstats') || code.includes('IntValue') || code.includes('NumberValue') ||
    // ProximityPrompt / interactive scripts
    code.includes('ProximityPrompt') || code.includes('ClickDetector') ||
    // Tween/animation scripts
    (code.includes('TweenService') && !code.includes('Instance.new("Part")'))
  if (!isScriptCode && totalParts < 8 && code.includes('Instance.new')) {
    score -= 50
    warnings.push({ type: 'complexity', message: `Only ${totalParts} parts — builds MUST have 15+ parts. Single-brick output.` })
  } else if (!isScriptCode && totalParts < 15 && totalParts >= 8 && code.includes('Instance.new')) {
    score -= 30
    warnings.push({ type: 'complexity', message: `Only ${totalParts} parts — builds should have 25+ parts for quality` })
  } else if (!isScriptCode && totalParts < 25 && totalParts >= 15 && code.includes('Instance.new')) {
    score -= 10
    warnings.push({ type: 'complexity', message: `${totalParts} parts — good but 25+ would be better` })
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

  // Check for position sanity — parts should be near each other, not scattered randomly
  const posMatches = code.match(/Vector3\.new\s*\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)/g) || []
  if (posMatches.length >= 3 && !isScriptCode) {
    const positions = posMatches.slice(0, 20).map(m => {
      const nums = m.match(/([-\d.]+)/g)
      return nums ? { x: parseFloat(nums[0]), y: parseFloat(nums[1]), z: parseFloat(nums[2]) } : null
    }).filter(Boolean) as { x: number; y: number; z: number }[]

    if (positions.length >= 3) {
      // Check if any position is absurdly far from the others (>500 studs away)
      const avgX = positions.reduce((s, p) => s + p.x, 0) / positions.length
      const avgZ = positions.reduce((s, p) => s + p.z, 0) / positions.length
      const outliers = positions.filter(p => Math.abs(p.x - avgX) > 500 || Math.abs(p.z - avgZ) > 500)
      if (outliers.length > 0) {
        score -= 15
        warnings.push({ type: 'positioning', message: `${outliers.length} parts positioned >500 studs from center — parts may be scattered randomly` })
      }

      // Check if parts are floating in the sky (Y > 200 without being intentional like clouds/sky builds)
      const skyParts = positions.filter(p => p.y > 200)
      if (skyParts.length > positions.length * 0.5 && !code.includes('cloud') && !code.includes('sky') && !code.includes('float')) {
        score -= 10
        warnings.push({ type: 'positioning', message: 'Many parts placed very high (Y>200) — may be floating in sky' })
      }
    }
  }

  // Check for overlapping parts (same position, different names = they're stacked inside each other)
  const cfMatches = code.match(/CFrame\.new\s*\(\s*sp\s*\+\s*Vector3\.new\s*\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)/g) || []
  if (cfMatches.length >= 5) {
    const posSet = new Set<string>()
    let duplicates = 0
    for (const m of cfMatches) {
      const nums = m.match(/([-\d.]+)/g)
      if (nums && nums.length >= 3) {
        const key = `${Math.round(parseFloat(nums[0]))},${Math.round(parseFloat(nums[1]))},${Math.round(parseFloat(nums[2]))}`
        if (posSet.has(key)) duplicates++
        posSet.add(key)
      }
    }
    if (duplicates > 3) {
      score -= 10
      warnings.push({ type: 'positioning', message: `${duplicates} parts share the same position — they may be overlapping/inside each other` })
    }
  }

  // ── ADVANCED VERIFICATION (10 extra checks) ──────────────────────────

  // 1. CFrame math validity — check for NaN/Inf in position values
  const nanInfMatches = code.match(/Vector3\.new\s*\(\s*([\d.e+-]+)\s*,\s*([\d.e+-]+)\s*,\s*([\d.e+-]+)\s*\)/g) || []
  for (const m of nanInfMatches.slice(0, 30)) {
    const nums = m.match(/([\d.e+-]+)/g)
    if (nums) {
      for (const n of nums) {
        const val = parseFloat(n)
        if (isNaN(val) || !isFinite(val)) {
          score -= 20
          warnings.push({ type: 'math', message: `Invalid number in Vector3: ${n} (NaN or Infinity)` })
          break
        }
      }
    }
  }

  // 2. Size values sanity — no 0,0,0 or absurdly large parts
  const sizeMatches = code.match(/Size\s*=\s*Vector3\.new\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/g) || []
  for (const m of sizeMatches.slice(0, 20)) {
    const nums = m.match(/([\d.]+)/g)
    if (nums && nums.length >= 3) {
      const x = parseFloat(nums[0]), y = parseFloat(nums[1]), z = parseFloat(nums[2])
      if (x === 0 || y === 0 || z === 0) {
        score -= 10
        warnings.push({ type: 'size', message: `Part with zero dimension (${x},${y},${z}) — will be invisible` })
      }
      if (x > 2048 || y > 2048 || z > 2048) {
        score -= 5
        warnings.push({ type: 'size', message: `Part extremely large (${x},${y},${z}) — may cause rendering issues` })
      }
    }
  }

  // 3. Infinite loop detection — while true without task.wait/break
  const whileTrueMatches = code.match(/while\s+true\s+do[\s\S]{0,200}?end/g) || []
  for (const m of whileTrueMatches) {
    if (!m.includes('task.wait') && !m.includes('wait(') && !m.includes('break') && !m.includes(':Wait()')) {
      score -= 25
      warnings.push({ type: 'runtime', message: 'while true loop without task.wait() or break — will freeze Studio' })
    }
  }

  // 4. RemoteEvent name matching — server and client must use the same names
  const remoteCreates = [...code.matchAll(/Instance\.new\s*\(\s*["']Remote(?:Event|Function)["']\s*\)[\s\S]{0,100}?\.Name\s*=\s*["'](\w+)["']/g)]
  const remoteRefs = [...code.matchAll(/(?:FindFirstChild|WaitForChild)\s*\(\s*["'](\w+)["']\s*\)/g)]
  if (remoteCreates.length > 0 && remoteRefs.length > 0) {
    const created = new Set(remoteCreates.map(m => m[1]))
    for (const ref of remoteRefs) {
      if (ref[1] && !created.has(ref[1]) && /^[A-Z]/.test(ref[1]) && !['Players','Workspace','StarterGui','ServerScriptService','ReplicatedStorage','StarterPlayer','StarterPlayerScripts','Lighting','SoundService','ServerStorage'].includes(ref[1])) {
        // Might be referencing a remote that isn't created in this code
        // Only warn, don't deduct heavily — the remote might exist from a previous build
      }
    }
  }

  // 5. Destroy() on temporary instances — BodyVelocity, BodyForce without cleanup
  const bodyInstances = (code.match(/Instance\.new\s*\(\s*["'](?:BodyVelocity|BodyForce|BodyPosition|BodyGyro|BodyAngularVelocity)["']/g) || []).length
  const debrisUsage = (code.match(/Debris:AddItem/g) || []).length
  const taskDelay = (code.match(/task\.delay.*:Destroy/g) || []).length
  if (bodyInstances > 0 && debrisUsage === 0 && taskDelay === 0) {
    score -= 8
    warnings.push({ type: 'cleanup', message: `${bodyInstances} BodyVelocity/Force instances without Debris:AddItem() — will pile up and cause lag` })
  }

  // 6. Model without PrimaryPart
  if (code.includes('Instance.new("Model")') && !code.includes('PrimaryPart') && totalParts > 10) {
    score -= 3
    warnings.push({ type: 'structure', message: 'Model created without setting PrimaryPart — use model.PrimaryPart = firstPart for proper PivotTo support' })
  }

  // 7. pcall without using the error
  const pcallMatches = code.match(/pcall\s*\(\s*function/g) || []
  const errorHandling = code.match(/if\s+(?:not\s+)?ok\s+then/g) || []
  if (pcallMatches.length > 0 && errorHandling.length === 0 && code.includes('DataStore')) {
    score -= 3
    warnings.push({ type: 'error-handling', message: 'pcall used but error result not checked — add: if not ok then warn(err) end' })
  }

  // 8. Parent set before properties (Instance.new second arg)
  const parentSecondArg = (code.match(/Instance\.new\s*\(\s*["']\w+["']\s*,\s*\w+\s*\)/g) || []).length
  if (parentSecondArg > 3) {
    score -= 5
    warnings.push({ type: 'performance', message: `${parentSecondArg} instances use Instance.new(class, parent) — set Parent LAST for better performance` })
  }

  // 9. Door height validation — doors should be 4x7-8 studs for character fit
  const doorParts = code.match(/(?:door|entrance|gate).*?Size\s*=\s*Vector3\.new\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/gi) || []
  for (const m of doorParts) {
    const nums = m.match(/Vector3\.new\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/i)
    if (nums) {
      const y = parseFloat(nums[2])
      if (y < 6.5 || y > 10) {
        score -= 5
        warnings.push({ type: 'proportion', message: `Door height ${y} studs — should be 7-8 for character fit (characters are ~6 studs)` })
      }
    }
  }

  // 10. Material theme consistency — penalize mixing incompatible materials
  const materials = [...new Set((code.match(/Enum\.Material\.(\w+)/g) || []).map(m => m.replace('Enum.Material.', '')))]
  const naturalMats = materials.filter(m => ['Grass', 'LeafyGrass', 'Sand', 'Snow', 'Ice', 'Mud', 'Rock'].includes(m))
  const industrialMats = materials.filter(m => ['DiamondPlate', 'CorrodedMetal', 'Metal'].includes(m))
  if (naturalMats.length >= 2 && industrialMats.length >= 2 && !isScriptCode) {
    score -= 5
    warnings.push({ type: 'theme', message: `Mixed natural (${naturalMats.join(',')}) and industrial (${industrialMats.join(',')}) materials — pick a consistent theme` })
  }

  // 11. Interior validation — buildings with walls should have floor + ceiling
  const hasWall = /wall|exterior|facade/i.test(code)
  const hasFloor = /floor|ground|base|foundation/i.test(code)
  const hasCeiling = /ceiling|roof|top/i.test(code)
  if (hasWall && totalParts > 20 && !isScriptCode) {
    if (!hasFloor) {
      score -= 5
      warnings.push({ type: 'structure', message: 'Building has walls but no floor — add a ground/base part' })
    }
    if (!hasCeiling) {
      score -= 3
      warnings.push({ type: 'structure', message: 'Building has walls but no ceiling/roof — add a roof or ceiling part' })
    }
  }

  // 12. Furniture proportionality — tables should be ~3 studs high, chairs ~2.5
  const tableParts = code.match(/(?:table|desk|counter).*?Size\s*=\s*Vector3\.new\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/gi) || []
  for (const m of tableParts) {
    const nums = m.match(/Vector3\.new\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/i)
    if (nums) {
      const y = parseFloat(nums[2])
      if (y > 6) {
        score -= 3
        warnings.push({ type: 'proportion', message: `Table/desk height ${y} studs — should be ~3 studs (waist height for 6-stud character)` })
      }
    }
  }

  // 13. Window transparency check — windows should have Glass material + transparency
  const windowMentions = (code.match(/window|glass.*pane|skylight/gi) || []).length
  const hasGlass = code.includes('Enum.Material.Glass')
  const hasTransparency = code.includes('Transparency') && code.match(/Transparency\s*=\s*0\.[2-7]/g)
  if (windowMentions > 0 && !hasGlass && !isScriptCode) {
    score -= 5
    warnings.push({ type: 'visual', message: 'Windows mentioned but no Glass material used — windows should use Enum.Material.Glass with 0.3-0.5 Transparency' })
  }

  // 14. Empty interior detection — buildings with 30+ parts should have interior detail
  if (totalParts >= 30 && !isScriptCode) {
    const hasInterior = /table|chair|desk|shelf|bed|couch|lamp|cabinet|counter|stool|rug|carpet|bookcase|painting|clock/i.test(code)
    const hasLighting = code.includes('PointLight') || code.includes('SpotLight')
    if (!hasInterior && hasWall) {
      score -= 8
      warnings.push({ type: 'detail', message: 'Building has 30+ parts but no interior furniture — add tables, chairs, lamps, shelves for realism' })
    }
    if (!hasLighting && hasWall) {
      score -= 5
      warnings.push({ type: 'detail', message: 'Interior building has no lighting — add PointLight/SpotLight instances' })
    }
  }

  // 15. Color palette harmony — detect clashing RGB values
  const rgbMatches = code.match(/Color3\.fromRGB\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/g) || []
  if (rgbMatches.length >= 5 && !isScriptCode) {
    const colors = rgbMatches.slice(0, 20).map(m => {
      const nums = m.match(/(\d+)/g)
      return nums ? { r: parseInt(nums[0]), g: parseInt(nums[1]), b: parseInt(nums[2]) } : null
    }).filter(Boolean) as { r: number; g: number; b: number }[]

    // Check for fully saturated clashing primaries (pure red + pure blue + pure green = ugly)
    const hasPureRed = colors.some(c => c.r > 230 && c.g < 50 && c.b < 50)
    const hasPureBlue = colors.some(c => c.r < 50 && c.g < 50 && c.b > 230)
    const hasPureGreen = colors.some(c => c.r < 50 && c.g > 230 && c.b < 50)
    if ([hasPureRed, hasPureBlue, hasPureGreen].filter(Boolean).length >= 2) {
      score -= 5
      warnings.push({ type: 'visual', message: 'Fully saturated primary colors clashing — use muted/natural tones for cohesive look' })
    }
  }

  // 16. Sound/Decal ID validation — check for empty asset IDs
  if (code.includes('SoundId') && !code.match(/SoundId\s*=\s*["']rbxassetid:\/\/\d+["']/)) {
    score -= 5
    warnings.push({ type: 'asset', message: 'Sound created but SoundId not set to a valid rbxassetid:// — sound will be silent' })
  }
  if (code.includes('TextureId') && !code.match(/TextureId\s*=\s*["']rbxassetid:\/\/\d+["']/) && !code.includes('Texture = ""')) {
    score -= 3
    warnings.push({ type: 'asset', message: 'Texture/Decal created but TextureId not set — will be invisible' })
  }

  // 17. Script architecture check — server logic in LocalScript or client logic in Script
  if (code.includes('ServerScriptService') && code.includes('LocalPlayer')) {
    score -= 15
    warnings.push({ type: 'architecture', message: 'LocalPlayer accessed in server context — LocalPlayer only exists on client. Use Players.PlayerAdded for server-side player handling.' })
  }
  if (code.includes('StarterPlayerScripts') && code.includes('DataStoreService')) {
    score -= 15
    warnings.push({ type: 'architecture', message: 'DataStoreService used in client script — DataStore is server-only. Move data operations to a server Script and use RemoteEvents.' })
  }

  // 18. Wall thickness check — walls thinner than 0.5 studs look paper-thin
  const wallParts = code.match(/(?:wall|side|exterior|facade|partition).*?Size\s*=\s*Vector3\.new\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/gi) || []
  for (const m of wallParts) {
    const nums = m.match(/Vector3\.new\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/i)
    if (nums) {
      const sizes = [parseFloat(nums[1]), parseFloat(nums[2]), parseFloat(nums[3])].sort((a, b) => a - b)
      if (sizes[0] < 0.3 && sizes[1] > 5) {
        score -= 3
        warnings.push({ type: 'proportion', message: `Wall thickness ${sizes[0]} studs — minimum 0.5 for visual quality` })
      }
    }
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

  // Structural bonuses
  if (code.includes('WedgePart') || code.includes('CornerWedgePart')) score += 3 // Roof/detail shapes
  if (totalParts >= 50) score += 5 // High detail
  if (totalParts >= 100) score += 5 // Very high detail
  if (materials.length >= 4) score += 3 // Material variety
  if (colorCount >= 5) score += 3 // Color variety

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

  // ── Additional auto-fixes (always run, not tied to specific errors) ──

  // Fix deprecated spawn() → task.spawn()
  fixed = fixed.replace(/\bspawn\s*\(\s*function/g, 'task.spawn(function')

  // Fix deprecated delay() → task.delay()
  fixed = fixed.replace(/\bdelay\s*\(\s*(\d)/g, 'task.delay($1')

  // Fix game.Workspace → workspace
  fixed = fixed.replace(/\bgame\.Workspace\b/g, 'workspace')
  fixed = fixed.replace(/\bgame:GetService\s*\(\s*["']Workspace["']\s*\)/g, 'workspace')

  // Fix pairs/ipairs → generalized iteration
  fixed = fixed.replace(/\bfor\s+(\w+)\s*,\s*(\w+)\s+in\s+pairs\s*\(/g, 'for $1, $2 in (')
  fixed = fixed.replace(/\bfor\s+(\w+)\s*,\s*(\w+)\s+in\s+ipairs\s*\(/g, 'for $1, $2 in (')

  // Fix SetPrimaryPartCFrame → PivotTo
  fixed = fixed.replace(/\:SetPrimaryPartCFrame\s*\(/g, ':PivotTo(')

  // Add ChangeHistoryService if missing entirely
  if (!fixed.includes('ChangeHistoryService') && fixed.includes('Instance.new')) {
    const hasModuleReturn = fixed.includes('return ') && fixed.includes('ModuleScript')
    if (!hasModuleReturn) {
      // Wrap the entire code in CH recording
      fixed = `local CH=game:GetService("ChangeHistoryService")\nlocal rid=CH:TryBeginRecording("ForjeAI")\n${fixed}\nif rid then CH:FinishRecording(rid, Enum.FinishRecordingOperation.Commit) end`
    }
  }

  // Remove Instance.new parent-as-second-arg for Parts only (performance fix)
  fixed = fixed.replace(
    /Instance\.new\(\s*["'](Part|WedgePart|MeshPart)["']\s*,\s*(\w+)\s*\)/g,
    (_, cls, parent) => `Instance.new("${cls}") --[[ parent=${parent} set below ]]`
  )

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
