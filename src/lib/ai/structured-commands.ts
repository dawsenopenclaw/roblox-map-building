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

/** Patterns that indicate code we cannot translate */
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

function resolveParent(raw: string): string {
  const t = raw.trim()
  // workspace / game:GetService("Workspace") → "Workspace"
  if (t === 'workspace' || t === 'game.Workspace' || /GetService\(["']Workspace["']\)/.test(t))
    return 'Workspace'
  // local variable reference — use as-is (the plugin resolves by name)
  return t
}

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

  // Flag lines we can't handle
  for (const line of lines) {
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
        material: 'SmoothPlastic',
        anchored: true,
        parentName: 'Workspace',
        instanceClass: className,
      })
    } else if (className === 'Model') {
      modelStates.set(varName, { name: varName, parentName: 'Workspace' })
    } else {
      warnings.push(`Skipped unsupported Instance.new class: ${className}`)
    }
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

  return {
    commands: [...modelCommands, ...commands],
    hasUntranslatableCode,
    warnings,
  }
}
