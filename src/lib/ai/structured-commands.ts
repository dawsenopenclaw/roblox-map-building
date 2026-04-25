/**
 * Luau → Structured Commands translator
 *
 * The Creator Store plugin cannot use loadstring(), so AI-generated Luau
 * must be converted to a JSON array of typed commands the store plugin
 * executes natively.
 *
 * Coverage goal: 80% of simple AI builds (flat Part/Model creation).
 * Complex scripts (loops, functions, game systems) are NOT translated —
 * callers should fall back to the direct-download plugin for those.
 */

// ─── Command types (mirror the store plugin's executor) ──────────────────────

export interface CreatePartCommand {
  type: 'create_part'
  name: string
  position: { x: number; y: number; z: number }
  size: { x: number; y: number; z: number }
  color: { r: number; g: number; b: number }
  material: string
  anchored: boolean
  parentName: string
}

export interface CreateModelCommand {
  type: 'create_model'
  name: string
  parentName: string
}

export interface DeleteNamedCommand {
  type: 'delete_named'
  name: string
}

export interface SetPropertyCommand {
  type: 'set_property'
  path: string
  property: string
  value: unknown
}

export interface CloneInstanceCommand {
  type: 'clone_instance'
  sourcePath: string
  parentPath: string
  newName: string
}

export interface CreateFolderCommand {
  type: 'create_folder'
  name: string
  parentName: string
}

export interface CreateScriptCommand {
  type: 'create_script'
  name: string
  scriptType: 'Script' | 'LocalScript' | 'ModuleScript'
  source: string
  parent: string
}

export interface MoveInstanceCommand {
  type: 'move_instance'
  path: string
  newParent: string
}

export interface InsertAssetCommand {
  type: 'insert_asset'
  assetId: string | number
  name?: string
  position?: { x: number; y: number; z: number }
  parentName?: string
}

export interface ExecuteScriptCommand {
  type: 'execute_script'
  source: string
  name?: string
  runContext?: 'server' | 'workspace'
}

export interface ModifyScriptCommand {
  type: 'modify_script'
  path: string
  source: string
  waypoint?: string
}

export interface ReadScriptCommand {
  type: 'read_script'
  path: string
}

export interface GetGameTreeCommand {
  type: 'get_game_tree'
}

export interface SearchScriptsCommand {
  type: 'search_scripts'
  query: string
}

export interface DeleteInstanceCommand {
  type: 'delete_instance'
  path: string
}

export interface CreateInstanceCommand {
  type: 'create_instance'
  className: string
  name: string
  parentName?: string
  properties?: Record<string, unknown>
}

export interface CreateTweenCommand {
  type: 'create_tween'
  targetPath: string
  tweenInfo: {
    time: number
    easingStyle?: string
    easingDirection?: string
    repeatCount?: number
    reverses?: boolean
    delayTime?: number
  }
  properties: Record<string, unknown>
  autoPlay: boolean
}

export interface CreateSoundCommand {
  type: 'create_sound'
  name: string
  soundId: string
  parentName: string
  properties?: Record<string, unknown>
}

export interface CreateLightCommand {
  type: 'create_light'
  className: 'PointLight' | 'SpotLight' | 'SurfaceLight'
  name: string
  parentName: string
  properties?: Record<string, unknown>
}

export interface CreateUIModifierCommand {
  type: 'create_ui_modifier'
  className: 'UICorner' | 'UIStroke' | 'UIGradient' | 'UIPadding' | 'UIListLayout' | 'UIGridLayout' | 'UITableLayout' | 'UIPageLayout' | 'UIAspectRatioConstraint' | 'UISizeConstraint' | 'UITextSizeConstraint' | 'UIScale' | 'UIFlexItem'
  name: string
  parentName: string
  properties?: Record<string, unknown>
}

export interface CreateProximityPromptCommand {
  type: 'create_proximity_prompt'
  name: string
  parentName: string
  properties?: Record<string, unknown>
}

export interface CreateWeldCommand {
  type: 'create_weld'
  name: string
  parentName: string
  part0Path?: string
  part1Path?: string
  properties?: Record<string, unknown>
}

export interface CreateDecalCommand {
  type: 'create_decal'
  className: 'Decal' | 'Texture'
  name: string
  parentName: string
  properties?: Record<string, unknown>
}

export type StructuredCommand =
  | CreatePartCommand
  | CreateModelCommand
  | CreateFolderCommand
  | CreateScriptCommand
  | CreateInstanceCommand
  | DeleteNamedCommand
  | DeleteInstanceCommand
  | SetPropertyCommand
  | MoveInstanceCommand
  | CloneInstanceCommand
  | InsertAssetCommand
  | ExecuteScriptCommand
  | CreateTweenCommand
  | CreateSoundCommand
  | CreateLightCommand
  | CreateUIModifierCommand
  | CreateProximityPromptCommand
  | CreateWeldCommand
  | CreateDecalCommand
  | ModifyScriptCommand
  | ReadScriptCommand
  | GetGameTreeCommand
  | SearchScriptsCommand

// ─── Translation result ───────────────────────────────────────────────────────

export interface TranslationResult {
  /** Structured commands derived from the Luau source */
  commands: StructuredCommand[]
  /**
   * True when the Luau contained constructs the translator cannot handle
   * (loops, functions, complex control flow). Caller should fall back to
   * the direct-download plugin.
   */
  hasUntranslatableCode: boolean
  /** Human-readable log of what was and wasn't translated */
  warnings: string[]
}

// ─── Internal parser state ────────────────────────────────────────────────────

interface PartState {
  name: string
  position: { x: number; y: number; z: number }
  size: { x: number; y: number; z: number }
  color: { r: number; g: number; b: number }
  material: string
  anchored: boolean
  parentName: string
  instanceClass: string
}

// ─── Regex helpers ────────────────────────────────────────────────────────────

/** Match:  local varName = Instance.new("ClassName") */
const RE_INSTANCE_NEW = /local\s+(\w+)\s*=\s*Instance\.new\(\s*["'](\w+)["']\s*\)/

/** Match the P() helper used by the CODE_GENERATION_PROMPT template:
 *    P("name", CFrame.new(sp+Vector3.new(x,y,z)), Vector3.new(sx,sy,sz), Enum.Material.X, Color3.fromRGB(r,g,b))
 *    P("name", CFrame.new(sp+Vector3.new(x,y,z)), Vector3.new(sx,sy,sz), Enum.Material.X, Color3.fromRGB(r,g,b), parent)
 *  Also matches:
 *    local varName = P(...)
 *  This is the most critical pattern to support because the AI's code
 *  generation template instructs it to use P() for every part. Without
 *  this, the translator produces 0 commands for most AI-generated builds
 *  and the plugin falls back to loadstring (which may not work for all users).
 */
const RE_P_HELPER = /(?:local\s+\w+\s*=\s*)?P\(\s*["']([^"']+)["']\s*,\s*(.*?)\s*,\s*(Vector3\.new\([^)]+\))\s*,\s*(Enum\.Material\.\w+)\s*,\s*(Color3\.(?:fromRGB|new)\([^)]+\))(?:\s*,\s*([^)]+))?\s*\)/

/** Match:  varName.PropertyName = <value> */
const RE_PROPERTY_SET = /(\w+)\.(\w+)\s*=\s*(.+)/

/** Match:  Vector3.new(x, y, z)  — captures three number groups */
const RE_VECTOR3 = /Vector3\.new\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\)/

/** Match:  BrickColor.new("Name") */
const RE_BRICKCOLOR_NAME = /BrickColor\.new\(\s*["']([^"']+)["']\s*\)/

/** Match:  Color3.fromRGB(r, g, b) */
const RE_COLOR3_RGB = /Color3\.fromRGB\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/

/** Match:  Color3.new(r, g, b)  — 0-1 floats */
const RE_COLOR3_NEW = /Color3\.new\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\)/

/** Match:  Enum.Material.MaterialName */
const RE_ENUM_MATERIAL = /Enum\.Material\.(\w+)/

/** Match:  TweenService:Create(target, TweenInfo.new(...), {prop = val, ...})
 *  or:  local tween = TweenService:Create(...)
 *  Captures: (1) target var, (2) TweenInfo args, (3) property table */
const RE_TWEEN_CREATE = /(?:local\s+(\w+)\s*=\s*)?(?:\w+):Create\(\s*(\w+)\s*,\s*TweenInfo\.new\(([^)]*)\)\s*,\s*\{([^}]*)\}\s*\)/

/** Match:  tween:Play()  — captures the tween variable name */
const RE_TWEEN_PLAY = /(\w+):Play\(\)/

/** Match:  Enum.EasingStyle.X */
const RE_ENUM_EASING_STYLE = /Enum\.EasingStyle\.(\w+)/

/** Match:  Enum.EasingDirection.X */
const RE_ENUM_EASING_DIRECTION = /Enum\.EasingDirection\.(\w+)/

/** Match:  Enum.NormalId.X or Enum.SurfaceType.X (for decals) */
const RE_ENUM_FACE = /Enum\.NormalId\.(\w+)/

/** Match:  UDim2.new(sx, ox, sy, oy)  or  UDim2.fromScale(sx, sy)  or  UDim2.fromOffset(ox, oy) */
const RE_UDIM2_NEW = /UDim2\.new\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\)/
const RE_UDIM2_SCALE = /UDim2\.fromScale\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\)/
const RE_UDIM2_OFFSET = /UDim2\.fromOffset\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\)/

/** Match:  Enum.EnumType.Value  — generic enum parser */
const RE_ENUM_GENERIC = /Enum\.(\w+)\.(\w+)/

/** Match: placeAsset(assetId, position, scale, folder)
 *  The AI's MARKETPLACE_ASSET_RULES prompt template uses this helper for trees,
 *  lamps, furniture, etc. Without this, marketplace assets are untranslatable
 *  on store builds (no loadstring). Captures: (1) assetId, (2) position expr,
 *  (3) scale number, (4) folder expr */
const RE_PLACE_ASSET = /placeAsset\(\s*(\d+)\s*,\s*((?:[^,()]|\([^)]*\))+)\s*,\s*(-?[\d.]+)\s*,\s*((?:[^,()]|\([^)]*\))+)\s*\)/

/** Patterns that indicate code we cannot translate.
 *  IMPORTANT: the CODE_GENERATION_PROMPT template uses helper functions
 *  (P, getFolder, vc) and pcall wrappers that LOOK untranslatable but
 *  are actually handled by the P() regex above. We exclude lines that
 *  match known template patterns so `hasUntranslatableCode` only fires
 *  for genuinely novel constructs the translator can't handle. */
const TEMPLATE_HELPER_PATTERNS = [
  /\bfunction\s+P\b/,           // function P(name, cf, size, mat, col, parent)
  /\bfunction\s+getFolder\b/,   // function getFolder(name)
  /\bfunction\s+vc\b/,          // function vc(base, variance)
  /\bpcall\s*\(\s*function\b/,  // pcall(function() -- MAIN LOGIC wrapper
  /\bCH:TryBeginRecording\b/,   // ChangeHistoryService bookkeeping
  /\bCH:FinishRecording\b/,
  /\bCS:AddTag\b/,              // CollectionService tagging
  /\b_forje_state\b/,           // cross-run state (intentional global)
  /\btable\.freeze\b/,          // CONFIG table
  /\bSelection:Set\b/,          // auto-select built objects
  /\bTweenService:Create\b/,    // TweenService:Create() — handled by tween translator
  /\b\w+:Play\(\)/,             // tween:Play() — handled by tween translator
  /\b\w+:Destroy\(\)/,          // instance:Destroy() — cleanup, safe to skip
  /\bfunction\s+placeAsset\b/,  // placeAsset() helper definition
  /\bIS:LoadAsset\b/,           // InsertService:LoadAsset — handled by placeAsset translator
  /\bInsertService:LoadAsset\b/, // same, long form
  /\bplaceAsset\(\s*\d+/,       // placeAsset() call — translated to insert_asset
  /\blocal\s+IS\s*=/,           // local IS = game:GetService("InsertService")
  /\b\w+:FindFirstChildWhichIsA\b/, // common in placeAsset helper body
  /\b\w+:GetChildren\b/,        // common in placeAsset helper body
  /\b\w+:PivotTo\b/,            // model:PivotTo() — common in placeAsset
  /\b\w+:ScaleTo\b/,            // model:ScaleTo() — common in placeAsset
  /\b\w+:IsA\b/,                // type checking in helpers
  /\b\w+:Raycast\b/,            // workspace:Raycast — used in ground detection
  /\b\w+\.Position\.Y\b/,       // reading position — not a translatable line
]

const UNTRANSLATABLE_PATTERNS = [
  /\bfor\b/,
  /\bwhile\b/,
  /\brepeat\b/,
  /\bfunction\b/,
  /\bif\b.*\bthen\b/,
  /pcall\s*\(/,
  /require\s*\(/,
  /loadstring\s*\(/,
  /coroutine\./,
  /task\.(spawn|delay|wait)/,
  /:\w+\(/,        // method calls like part:Destroy()
  /\[\s*["']/,     // table indexing with string keys
]

/** Returns true if the line is a known template boilerplate pattern
 *  that the translator should NOT flag as untranslatable. */
function isTemplateBoilerplate(line: string): boolean {
  return TEMPLATE_HELPER_PATTERNS.some(p => p.test(line))
}

// ─── BrickColor name → approximate RGB (common colors only) ──────────────────

const BRICKCOLOR_MAP: Record<string, { r: number; g: number; b: number }> = {
  'White':                { r: 242, g: 243, b: 243 },
  'Light grey':           { r: 161, g: 165, b: 162 },
  'Medium stone grey':    { r: 163, g: 162, b: 165 },
  'Dark grey':            { r: 99,  g: 95,  b: 98  },
  'Black':                { r: 27,  g: 42,  b: 53  },
  'Dark red':             { r: 106, g: 29,  b: 20  },
  'Red':                  { r: 196, g: 40,  b: 28  },
  'Bright red':           { r: 196, g: 40,  b: 28  },
  'Bright orange':        { r: 218, g: 133, b: 65  },
  'Bright yellow':        { r: 245, g: 205, b: 48  },
  'Yellow':               { r: 245, g: 205, b: 48  },
  'Bright green':         { r: 75,  g: 151, b: 75  },
  'Dark green':           { r: 25,  g: 91,  b: 56  },
  'Bright blue':          { r: 13,  g: 105, b: 172 },
  'Medium blue':          { r: 110, g: 153, b: 202 },
  'Bright bluish green':  { r: 0,   g: 143, b: 156 },
  'Sand green':           { r: 116, g: 134, b: 95  },
  'Sand blue':            { r: 116, g: 134, b: 157 },
  'Brown':                { r: 124, g: 92,  b: 70  },
  'Reddish brown':        { r: 105, g: 64,  b: 40  },
  'Tan':                  { r: 232, g: 207, b: 161 },
  'Warm yellowish orange':{ r: 255, g: 214, b: 127 },
  'Nougat':               { r: 204, g: 142, b: 105 },
  'Light orange':         { r: 255, g: 176, b: 103 },
  'Magenta':              { r: 149, g: 0,   b: 86  },
  'Pink':                 { r: 255, g: 148, b: 203 },
  'Lavender':             { r: 186, g: 184, b: 254 },
  'Cyan':                 { r: 1,   g: 172, b: 228 },
}

function brickColorToRgb(name: string): { r: number; g: number; b: number } {
  return BRICKCOLOR_MAP[name] ?? { r: 163, g: 162, b: 165 } // fallback: medium stone grey
}

// ─── Value parsers ────────────────────────────────────────────────────────────

function parseVector3(raw: string): { x: number; y: number; z: number } | null {
  const m = RE_VECTOR3.exec(raw)
  if (!m) return null
  return { x: parseFloat(m[1]), y: parseFloat(m[2]), z: parseFloat(m[3]) }
}

function parseColor(raw: string): { r: number; g: number; b: number } | null {
  const rgb = RE_COLOR3_RGB.exec(raw)
  if (rgb) return { r: parseInt(rgb[1], 10), g: parseInt(rgb[2], 10), b: parseInt(rgb[3], 10) }

  const c3 = RE_COLOR3_NEW.exec(raw)
  if (c3) return {
    r: Math.round(parseFloat(c3[1]) * 255),
    g: Math.round(parseFloat(c3[2]) * 255),
    b: Math.round(parseFloat(c3[3]) * 255),
  }

  const bc = RE_BRICKCOLOR_NAME.exec(raw)
  if (bc) return brickColorToRgb(bc[1])

  return null
}

function parseMaterial(raw: string): string | null {
  const m = RE_ENUM_MATERIAL.exec(raw)
  return m ? m[1] : null
}

function parseBoolean(raw: string): boolean | null {
  const t = raw.trim().toLowerCase()
  if (t === 'true') return true
  if (t === 'false') return false
  return null
}

/** Parse UDim2.new / UDim2.fromScale / UDim2.fromOffset → typed object for plugin */
function parseUDim2(raw: string): { type: 'UDim2'; sx: number; ox: number; sy: number; oy: number } | null {
  const full = RE_UDIM2_NEW.exec(raw)
  if (full) return { type: 'UDim2', sx: parseFloat(full[1]), ox: parseFloat(full[2]), sy: parseFloat(full[3]), oy: parseFloat(full[4]) }

  const scale = RE_UDIM2_SCALE.exec(raw)
  if (scale) return { type: 'UDim2', sx: parseFloat(scale[1]), ox: 0, sy: parseFloat(scale[2]), oy: 0 }

  const offset = RE_UDIM2_OFFSET.exec(raw)
  if (offset) return { type: 'UDim2', sx: 0, ox: parseFloat(offset[1]), sy: 0, oy: parseFloat(offset[2]) }

  return null
}

/** Parse generic Enum.X.Y → typed object for plugin */
function parseEnum(raw: string): { type: 'Enum'; enum: string; value: string } | null {
  const m = RE_ENUM_GENERIC.exec(raw)
  if (!m) return null
  return { type: 'Enum', enum: m[1], value: m[2] }
}

/** Parse any Roblox value type from a raw Luau string.
 *  Returns a typed object the plugin's parseStructuredValue() can handle,
 *  or a primitive (number/boolean/string) for simple values. */
function parseAnyValue(raw: string): unknown {
  // Try typed values in order of specificity
  const udim2 = parseUDim2(raw)
  if (udim2) return udim2

  const color = parseColor(raw)
  if (color) return color

  const vec = parseVector3(raw)
  if (vec) return vec

  const enumVal = parseEnum(raw)
  if (enumVal) return enumVal

  const boolVal = parseBoolean(raw)
  if (boolVal !== null) return boolVal

  const cleaned = raw.replace(/^["']|["']$/g, '').trim()
  const numVal = parseFloat(cleaned)
  if (!isNaN(numVal) && /^-?[\d.]+$/.test(cleaned)) return numVal

  return cleaned
}

function resolveParent(raw: string): string {
  const t = raw.trim()
  // workspace / game:GetService("Workspace") → "Workspace"
  if (t === 'workspace' || t === 'game.Workspace' || /GetService\(["']Workspace["']\)/.test(t))
    return 'Workspace'
  // Service references for GUI, environment, scripts
  const serviceMatch = /GetService\(["'](\w+)["']\)/.exec(t)
  if (serviceMatch) return `game:GetService("${serviceMatch[1]}")`
  if (t === 'game.StarterGui') return 'game:GetService("StarterGui")'
  if (t === 'game.Lighting') return 'game:GetService("Lighting")'
  if (t === 'game.ReplicatedStorage') return 'game:GetService("ReplicatedStorage")'
  if (t === 'game.ServerScriptService') return 'game:GetService("ServerScriptService")'
  if (t === 'game.StarterPlayer') return 'game:GetService("StarterPlayer")'
  // local variable reference — use as-is (the plugin resolves by name)
  return t
}

// ─── Known class names handled as generic instances ──────────────────────────
// Everything in this set goes through Pass 1 → generic accumulator → Pass 2
// property collection → flush as specialized or create_instance commands.

const KNOWN_GENERIC_CLASSES = new Set([
  // Lights
  'PointLight', 'SpotLight', 'SurfaceLight',
  // Audio
  'Sound',
  // Organization
  'Folder',
  // Decals / textures
  'Decal', 'Texture',
  // GUI containers
  'ScreenGui', 'Frame', 'ScrollingFrame', 'ViewportFrame', 'CanvasGroup',
  // GUI elements
  'TextLabel', 'TextButton', 'TextBox', 'ImageLabel', 'ImageButton',
  // GUI 3D
  'SurfaceGui', 'BillboardGui',
  // UI modifiers (also handled as specialized create_ui_modifier)
  'UICorner', 'UIStroke', 'UIGradient', 'UIPadding',
  'UIListLayout', 'UIGridLayout', 'UITableLayout', 'UIPageLayout',
  'UIAspectRatioConstraint', 'UISizeConstraint', 'UITextSizeConstraint', 'UIScale', 'UIFlexItem',
  // VFX
  'ParticleEmitter', 'Fire', 'Smoke', 'Sparkles', 'Highlight',
  // Constraints / welds
  'ProximityPrompt', 'WeldConstraint',
  'Beam', 'Trail', 'Attachment',
  // Environment
  'Atmosphere', 'Sky', 'Clouds', 'BloomEffect', 'BlurEffect',
  'ColorCorrectionEffect', 'DepthOfFieldEffect', 'SunRaysEffect',
  // Gameplay
  'SpawnLocation', 'Seat', 'VehicleSeat', 'ClickDetector',
  'BodyVelocity', 'BodyGyro', 'BodyPosition', 'BodyForce',
  'RopeConstraint', 'SpringConstraint', 'HingeConstraint', 'AlignPosition', 'AlignOrientation',
  // Mesh
  'SpecialMesh', 'BlockMesh', 'CylinderMesh',
  // Values
  'IntValue', 'StringValue', 'BoolValue', 'NumberValue', 'ObjectValue', 'Color3Value',
  // Communication
  'RemoteEvent', 'RemoteFunction', 'BindableEvent', 'BindableFunction',
  // Other
  'Tool', 'Humanoid', 'Animation', 'AnimationController',
  'SelectionBox', 'SelectionSphere',
  'SurfaceAppearance',
])

// ─── Main translator ──────────────────────────────────────────────────────────

/**
 * Parse AI-generated Luau and convert it to an array of structured commands
 * that the Creator Store plugin can execute without loadstring().
 *
 * The translation covers Instance.new() + property assignments only.
 * Any control-flow or method calls set `hasUntranslatableCode = true`.
 */
export function luauToStructuredCommands(luauCode: string): TranslationResult {
  const commands: StructuredCommand[] = []
  const warnings: string[] = []
  let hasUntranslatableCode = false

  // Strip single-line comments so they don't confuse the patterns
  const lines = luauCode
    .split('\n')
    .map(l => l.replace(/--.*$/, '').trimEnd())
    .filter(l => l.trim().length > 0)

  // Track variable name → PartState for accumulating property assignments
  const partStates = new Map<string, PartState>()
  // Track variable name → class for models
  const modelStates = new Map<string, { name: string; parentName: string }>()
  // Track generic instances (lights, sounds, effects, folders) for create_instance commands
  const genericInstances = new Map<string, { className: string; name: string; parentName: string; properties: Record<string, unknown> }>()

  // Flag lines we can't handle — but skip known template boilerplate
  // from the CODE_GENERATION_PROMPT (P/getFolder/vc/pcall wrapper, etc.)
  for (const line of lines) {
    if (isTemplateBoilerplate(line)) continue
    for (const pattern of UNTRANSLATABLE_PATTERNS) {
      if (pattern.test(line)) {
        hasUntranslatableCode = true
        warnings.push(`Untranslatable pattern on line: ${line.trim().slice(0, 80)}`)
        break
      }
    }
  }

  // Pass 1: collect all Instance.new declarations
  for (const line of lines) {
    const m = RE_INSTANCE_NEW.exec(line)
    if (!m) continue

    const varName = m[1]
    const className = m[2]

    if (className === 'Part' || className === 'WedgePart' || className === 'TrussPart') {
      partStates.set(varName, {
        name: varName,
        position: { x: 0, y: 0, z: 0 },
        size: { x: 4, y: 1.2, z: 2 },
        color: { r: 163, g: 162, b: 165 },
        material: 'Concrete',
        anchored: true,
        parentName: 'Workspace',
        instanceClass: className,
      })
    } else if (className === 'Model') {
      modelStates.set(varName, { name: varName, parentName: 'Workspace' })
    } else if (KNOWN_GENERIC_CLASSES.has(className)) {
      // Generic instance — emitted as a specialized command type (create_sound,
      // create_light, create_ui_modifier, create_proximity_prompt, create_weld,
      // create_decal) or as create_instance for other classes. Properties are
      // collected in Pass 2.
      genericInstances.set(varName, { className, name: varName, parentName: 'Workspace', properties: {} })
    } else {
      // Unknown class — still create it as a generic instance rather than dropping it.
      // The plugin's create_instance handler can instantiate any valid Roblox class.
      warnings.push(`Unknown class "${className}" — emitting as create_instance`)
      genericInstances.set(varName, { className, name: varName, parentName: 'Workspace', properties: {} })
    }
  }

  // Pass 1b: detect P() helper calls from the CODE_GENERATION_PROMPT template.
  // The AI's standard template uses P("name", CFrame, Size, Material, Color)
  // for every part instead of Instance.new("Part") + property assignments.
  // Without this pass, the translator produces 0 commands for most AI builds.
  for (const line of lines) {
    const m = RE_P_HELPER.exec(line)
    if (!m) continue

    const name = m[1]
    const cfRaw = m[2]    // CFrame.new(sp+Vector3.new(x,y,z)) or CFrame.new(x,y,z,...)
    const sizeRaw = m[3]  // Vector3.new(sx,sy,sz)
    const matRaw = m[4]   // Enum.Material.X
    const colRaw = m[5]   // Color3.fromRGB(r,g,b)
    // m[6] is optional parent argument

    // Extract position from CFrame — look for Vector3.new inside the CFrame argument
    // Common patterns:
    //   CFrame.new(sp+Vector3.new(5,0,10))   → extract the offset vector
    //   CFrame.new(Vector3.new(5,0,10))       → same
    //   CFrame.new(5,0,10)                    → direct numbers
    let position = { x: 0, y: 0, z: 0 }
    const v3InCf = RE_VECTOR3.exec(cfRaw)
    if (v3InCf) {
      position = { x: parseFloat(v3InCf[1]), y: parseFloat(v3InCf[2]), z: parseFloat(v3InCf[3]) }
    } else {
      // Try direct CFrame.new(x,y,z) pattern
      const cfDirect = /CFrame\.new\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)/.exec(cfRaw)
      if (cfDirect) {
        position = { x: parseFloat(cfDirect[1]), y: parseFloat(cfDirect[2]), z: parseFloat(cfDirect[3]) }
      }
    }

    const size = parseVector3(sizeRaw) ?? { x: 4, y: 1.2, z: 2 }
    const color = parseColor(colRaw) ?? { r: 163, g: 162, b: 165 }
    const material = parseMaterial(matRaw) ?? 'Concrete'

    // Don't duplicate if Instance.new already picked up a part with the same var name
    // (unlikely since P() is a different pattern, but safety)
    if (!partStates.has(name)) {
      commands.push({
        type: 'create_part',
        name,
        position,
        size,
        color,
        material,
        anchored: true,
        parentName: 'Workspace',
      })
    }
  }

  // Pass 1c: detect TweenService:Create() calls.
  // Pattern: local tween = TweenService:Create(target, TweenInfo.new(time, style, dir, repeat, reverses, delay), {Prop = val})
  // Also detects tween:Play() to set autoPlay.
  const tweenVars = new Map<string, CreateTweenCommand>()
  for (const line of lines) {
    const m = RE_TWEEN_CREATE.exec(line)
    if (!m) continue

    const tweenVar = m[1] // may be undefined if no local assignment
    const targetVar = m[2]
    const tweenInfoArgs = m[3]
    const propsRaw = m[4]

    // Parse TweenInfo arguments: time, easingStyle, easingDirection, repeatCount, reverses, delayTime
    const tiParts = tweenInfoArgs.split(',').map(s => s.trim())
    const time = parseFloat(tiParts[0]) || 1
    const easingStyle = tiParts[1] ? (RE_ENUM_EASING_STYLE.exec(tiParts[1])?.[1] ?? 'Quad') : 'Quad'
    const easingDirection = tiParts[2] ? (RE_ENUM_EASING_DIRECTION.exec(tiParts[2])?.[1] ?? 'Out') : 'Out'
    const repeatCount = tiParts[3] ? (parseInt(tiParts[3], 10) || 0) : 0
    const reverses = tiParts[4] ? tiParts[4] === 'true' : false
    const delayTime = tiParts[5] ? (parseFloat(tiParts[5]) || 0) : 0

    // Parse property table: {Position = Vector3.new(x,y,z), Transparency = 0.5}
    const properties: Record<string, unknown> = {}
    // Split on commas that are NOT inside parentheses (to handle Vector3.new(x,y,z))
    const propEntries = propsRaw.split(/,(?![^(]*\))/).map(s => s.trim()).filter(s => s.length > 0)
    for (const entry of propEntries) {
      const eqIdx = entry.indexOf('=')
      if (eqIdx === -1) continue
      const key = entry.slice(0, eqIdx).trim()
      const val = entry.slice(eqIdx + 1).trim()
      const colorVal = parseColor(val)
      const vecVal = parseVector3(val)
      const numVal = parseFloat(val)
      if (colorVal) properties[key] = colorVal
      else if (vecVal) properties[key] = vecVal
      else if (!isNaN(numVal) && /^-?[\d.]+$/.test(val)) properties[key] = numVal
      else if (val === 'true' || val === 'false') properties[key] = val === 'true'
      else properties[key] = val.replace(/^["']|["']$/g, '')
    }

    // Resolve target path — use the variable name, the plugin resolves by name
    const targetPath = targetVar

    const cmd: CreateTweenCommand = {
      type: 'create_tween',
      targetPath,
      tweenInfo: { time, easingStyle, easingDirection, repeatCount, reverses, delayTime },
      properties,
      autoPlay: false,
    }

    if (tweenVar) {
      tweenVars.set(tweenVar, cmd)
    } else {
      // No variable assignment — assume auto-play
      cmd.autoPlay = true
      commands.push(cmd)
    }
  }

  // Detect tween:Play() calls to set autoPlay on tracked tween variables
  for (const line of lines) {
    const m = RE_TWEEN_PLAY.exec(line)
    if (!m) continue
    const tweenCmd = tweenVars.get(m[1])
    if (tweenCmd) tweenCmd.autoPlay = true
  }

  // Flush tween commands
  for (const cmd of tweenVars.values()) {
    commands.push(cmd)
  }

  // Pass 1d: detect placeAsset() calls from the MARKETPLACE_ASSET_RULES template.
  // Pattern: placeAsset(assetId, sp+Vector3.new(x,y,z), scale, getFolder("Name"))
  // Emits insert_asset commands so marketplace assets work on store builds.
  for (const line of lines) {
    const m = RE_PLACE_ASSET.exec(line)
    if (!m) continue

    const assetId = parseInt(m[1], 10)
    const posExpr = m[2].trim()
    // const scale = parseFloat(m[3]) // scale handled by plugin's insert_asset
    const folderExpr = m[4].trim()

    // Extract position from the position expression (usually sp+Vector3.new(x,y,z))
    let position: { x: number; y: number; z: number } | undefined
    const v3 = RE_VECTOR3.exec(posExpr)
    if (v3) {
      position = { x: parseFloat(v3[1]), y: parseFloat(v3[2]), z: parseFloat(v3[3]) }
    }

    // Extract folder name from getFolder("Name") pattern
    let parentName = 'Workspace'
    const folderMatch = /getFolder\(\s*["']([^"']+)["']\s*\)/.exec(folderExpr)
    if (folderMatch) parentName = folderMatch[1]

    // Extract name from comment at end of line (-- Oak Tree)
    const commentMatch = /--\s*(.+)/.exec(line)
    const name = commentMatch ? commentMatch[1].trim() : `Asset_${assetId}`

    commands.push({
      type: 'insert_asset',
      assetId,
      name,
      position,
      parentName,
    })
  }

  // Pass 2: resolve property assignments
  for (const line of lines) {
    const m = RE_PROPERTY_SET.exec(line)
    if (!m) continue

    const varName = m[1]
    const prop = m[2]
    const rawVal = m[3].trim()

    // ── Part property assignments ──
    const ps = partStates.get(varName)
    if (ps) {
      switch (prop) {
        case 'Name':
          ps.name = rawVal.replace(/^["']|["']$/g, '')
          break
        case 'Position': {
          const v = parseVector3(rawVal)
          if (v) ps.position = v
          break
        }
        case 'Size': {
          const v = parseVector3(rawVal)
          if (v) ps.size = v
          break
        }
        case 'Color':
        case 'BrickColor': {
          const c = parseColor(rawVal)
          if (c) ps.color = c
          break
        }
        case 'Material': {
          const mat = parseMaterial(rawVal)
          if (mat) ps.material = mat
          break
        }
        case 'Anchored': {
          const b = parseBoolean(rawVal)
          if (b !== null) ps.anchored = b
          break
        }
        case 'Parent':
          ps.parentName = resolveParent(rawVal)
          break
        default:
          // Unknown property — emit a set_property for it
          warnings.push(`Property "${prop}" on Part "${varName}" emitted as set_property`)
          commands.push({
            type: 'set_property',
            path: `${ps.parentName}/${ps.name}`,
            property: prop,
            value: rawVal,
          })
      }
      continue
    }

    // ── Model property assignments ──
    const ms = modelStates.get(varName)
    if (ms) {
      if (prop === 'Name') ms.name = rawVal.replace(/^["']|["']$/g, '')
      else if (prop === 'Parent') ms.parentName = resolveParent(rawVal)
      continue
    }

    // ── Generic instance property assignments (lights, sounds, effects) ──
    const gi = genericInstances.get(varName)
    if (gi) {
      if (prop === 'Name') gi.name = rawVal.replace(/^["']|["']$/g, '')
      else if (prop === 'Parent') gi.parentName = resolveParent(rawVal)
      else {
        // Parse all Roblox value types — UDim2, Color3, Vector3, Enum, etc.
        gi.properties[prop] = parseAnyValue(rawVal)
      }
      continue
    }
  }

  // Flush accumulated part states → create_part commands
  for (const ps of partStates.values()) {
    commands.push({
      type: 'create_part',
      name: ps.name,
      position: ps.position,
      size: ps.size,
      color: ps.color,
      material: ps.material,
      anchored: ps.anchored,
      parentName: ps.parentName,
    })
  }

  // Flush model states → create_model commands
  // Models must come before parts that parent to them, so prepend
  const modelCommands: CreateModelCommand[] = []
  for (const ms of modelStates.values()) {
    modelCommands.push({
      type: 'create_model',
      name: ms.name,
      parentName: ms.parentName,
    })
  }

  // Flush generic instances → specialized command types where applicable,
  // otherwise fall back to create_instance.
  const LIGHT_CLASSES = new Set(['PointLight', 'SpotLight', 'SurfaceLight'])
  const UI_MODIFIER_CLASSES = new Set([
    'UICorner', 'UIStroke', 'UIGradient', 'UIPadding',
    'UIListLayout', 'UIGridLayout', 'UITableLayout', 'UIPageLayout',
    'UIAspectRatioConstraint', 'UISizeConstraint', 'UITextSizeConstraint',
    'UIScale', 'UIFlexItem',
  ])
  const DECAL_CLASSES = new Set(['Decal', 'Texture'])
  // Classes that should auto-parent to Lighting if no explicit parent set
  const LIGHTING_CLASSES = new Set([
    'Atmosphere', 'Sky', 'Clouds', 'BloomEffect', 'BlurEffect',
    'ColorCorrectionEffect', 'DepthOfFieldEffect', 'SunRaysEffect',
  ])

  const genericCommands: StructuredCommand[] = []
  for (const gi of genericInstances.values()) {
    const props = Object.keys(gi.properties).length > 0 ? gi.properties : undefined

    if (gi.className === 'Sound') {
      // Emit specialized create_sound command
      const soundId = (gi.properties.SoundId as string) ?? ''
      const soundProps = { ...gi.properties }
      delete soundProps.SoundId // SoundId is a top-level field
      genericCommands.push({
        type: 'create_sound',
        name: gi.name,
        soundId,
        parentName: gi.parentName,
        properties: Object.keys(soundProps).length > 0 ? soundProps : undefined,
      })
    } else if (LIGHT_CLASSES.has(gi.className)) {
      // Emit specialized create_light command
      genericCommands.push({
        type: 'create_light',
        className: gi.className as CreateLightCommand['className'],
        name: gi.name,
        parentName: gi.parentName,
        properties: props,
      })
    } else if (UI_MODIFIER_CLASSES.has(gi.className)) {
      // Emit specialized create_ui_modifier command
      genericCommands.push({
        type: 'create_ui_modifier',
        className: gi.className as CreateUIModifierCommand['className'],
        name: gi.name,
        parentName: gi.parentName,
        properties: props,
      })
    } else if (gi.className === 'ProximityPrompt') {
      // Emit specialized create_proximity_prompt command
      genericCommands.push({
        type: 'create_proximity_prompt',
        name: gi.name,
        parentName: gi.parentName,
        properties: props,
      })
    } else if (gi.className === 'WeldConstraint') {
      // Emit specialized create_weld command
      const part0 = (gi.properties.Part0 as string) ?? undefined
      const part1 = (gi.properties.Part1 as string) ?? undefined
      const weldProps = { ...gi.properties }
      delete weldProps.Part0 // Part0/Part1 are top-level fields
      delete weldProps.Part1
      genericCommands.push({
        type: 'create_weld',
        name: gi.name,
        parentName: gi.parentName,
        part0Path: part0,
        part1Path: part1,
        properties: Object.keys(weldProps).length > 0 ? weldProps : undefined,
      })
    } else if (DECAL_CLASSES.has(gi.className)) {
      // Emit specialized create_decal command
      genericCommands.push({
        type: 'create_decal',
        className: gi.className as CreateDecalCommand['className'],
        name: gi.name,
        parentName: gi.parentName,
        properties: props,
      })
    } else {
      // Smart parent defaults — if no explicit parent was set (still "Workspace"),
      // route to the correct Roblox service based on class type
      let parentName = gi.parentName
      if (parentName === 'Workspace') {
        if (LIGHTING_CLASSES.has(gi.className)) {
          parentName = 'game:GetService("Lighting")'
        } else if (gi.className === 'ScreenGui') {
          parentName = 'game:GetService("StarterGui")'
        }
      }
      // Fallback: generic create_instance
      genericCommands.push({
        type: 'create_instance',
        className: gi.className,
        name: gi.name,
        parentName,
        properties: props,
      })
    }
  }

  return {
    commands: [...modelCommands, ...commands, ...genericCommands],
    hasUntranslatableCode,
    warnings,
  }
}
