/**
 * Luau Code Generation — converts web editor property changes into executable
 * Luau snippets that are queued as `execute_luau` commands and run by the
 * Studio plugin via loadstring().
 *
 * All generated code:
 *  - Wraps mutations in ChangeHistoryService waypoints (Studio undo support)
 *  - Includes pcall error handling so a bad property never crashes the plugin
 *  - Sanitises all user-supplied names/paths (no arbitrary code injection)
 *  - Uses only stable Roblox APIs (no deprecated calls)
 */

import { hexToLuauColor3 } from './roblox-colors'

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface Vector3Value {
  x: number
  y: number
  z: number
}

export interface ColorValue {
  /** Hex string, e.g. "#D4AF37", or an RGB object */
  hex?: string
  r?: number
  g?: number
  b?: number
}

/** A single object in a scene build manifest */
export interface SceneObject {
  /** Roblox ClassName, e.g. "Part", "Model", "MeshPart", "SpecialMesh" */
  type: string
  /** Instance Name property */
  name: string
  /**
   * Parent path.  Use "workspace" for the root workspace, or a dot-separated
   * path like "workspace.CastleGroup".
   */
  parent: string
  /** Freeform property bag — values are typed by property name rules below */
  properties?: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Sanitisation helpers
// ---------------------------------------------------------------------------

/**
 * Strip characters that could break a Luau identifier or string literal.
 * Allows letters, digits, underscore, dot, space.
 * Dot is kept so callers can pass paths like "workspace.Castle".
 */
function sanitiseName(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_. ]/g, '').slice(0, 256)
}

/**
 * Escape a string for safe use inside a Luau double-quoted string literal.
 * Prevents injection via names that contain quotes or backslashes.
 */
function escapeLuauString(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\0/g, '\\0')
}

// ---------------------------------------------------------------------------
// Value → Luau serialisers
// ---------------------------------------------------------------------------

function luauNumber(n: number): string {
  // Avoid -0, NaN, Infinity in generated code
  if (!Number.isFinite(n)) return '0'
  // Round to 4 decimal places to avoid floating-point noise
  return parseFloat(n.toFixed(4)).toString()
}

function luauVector3(v: Vector3Value): string {
  return `Vector3.new(${luauNumber(v.x)}, ${luauNumber(v.y)}, ${luauNumber(v.z)})`
}

function luauColor3(value: ColorValue | string): string {
  if (typeof value === 'string') {
    return hexToLuauColor3(value)
  }
  if (value.hex) {
    return hexToLuauColor3(value.hex)
  }
  if (value.r !== undefined && value.g !== undefined && value.b !== undefined) {
    // Accept either 0-1 or 0-255 — detect by range
    const isNorm = value.r <= 1 && value.g <= 1 && value.b <= 1
    const r = isNorm ? Math.round(value.r * 255) : Math.round(value.r)
    const g = isNorm ? Math.round(value.g * 255) : Math.round(value.g)
    const b = isNorm ? Math.round(value.b * 255) : Math.round(value.b)
    return `Color3.fromRGB(${r}, ${g}, ${b})`
  }
  return 'Color3.new(1, 1, 1)'
}

/**
 * Serialise an arbitrary property value to its Luau representation.
 * Handles the most common Roblox property types.
 */
function serialiseValue(property: string, value: unknown): string {
  const prop = property.toLowerCase()

  // --- Vector3 properties ---
  if (
    prop === 'position' ||
    prop === 'size' ||
    prop === 'velocity' ||
    prop === 'rotvelocity'
  ) {
    if (typeof value === 'object' && value !== null && 'x' in value) {
      return luauVector3(value as Vector3Value)
    }
  }

  // --- CFrame (rotation supplied as {x,y,z} Euler degrees, or raw {position, rotation}) ---
  if (prop === 'cframe') {
    if (typeof value === 'object' && value !== null) {
      const v = value as Record<string, unknown>
      const px = luauNumber((v.x as number) ?? 0)
      const py = luauNumber((v.y as number) ?? 0)
      const pz = luauNumber((v.z as number) ?? 0)
      const rx = luauNumber((v.rx as number) ?? 0)
      const ry = luauNumber((v.ry as number) ?? 0)
      const rz = luauNumber((v.rz as number) ?? 0)
      if (rx === '0' && ry === '0' && rz === '0') {
        return `CFrame.new(${px}, ${py}, ${pz})`
      }
      return (
        `CFrame.new(${px}, ${py}, ${pz}) * ` +
        `CFrame.Angles(math.rad(${rx}), math.rad(${ry}), math.rad(${rz}))`
      )
    }
  }

  // --- Color3 ---
  if (prop === 'color' || prop === 'color3' || prop === 'brickcolor') {
    if (typeof value === 'string' || (typeof value === 'object' && value !== null)) {
      return luauColor3(value as ColorValue | string)
    }
  }

  // --- Material enum ---
  if (prop === 'material') {
    const mat = String(value).replace(/^Enum\.Material\./, '')
    const safe = mat.replace(/[^a-zA-Z]/g, '')
    return `Enum.Material.${safe}`
  }

  // --- SurfaceType enums ---
  if (prop.includes('surface')) {
    const surf = String(value).replace(/^Enum\.SurfaceType\./, '')
    const safe = surf.replace(/[^a-zA-Z]/g, '')
    return `Enum.SurfaceType.${safe}`
  }

  // --- Boolean ---
  if (typeof value === 'boolean') return value ? 'true' : 'false'

  // --- Number ---
  if (typeof value === 'number') return luauNumber(value)

  // --- String (escaped) ---
  if (typeof value === 'string') return `"${escapeLuauString(value)}"`

  // Fallback — stringify and wrap
  return `"${escapeLuauString(String(value))}"`
}

// ---------------------------------------------------------------------------
// ChangeHistoryService waypoint wrapper
// ---------------------------------------------------------------------------

function withWaypoint(waypointName: string, body: string): string {
  const safe = escapeLuauString(waypointName)
  return [
    `local ChangeHistoryService = game:GetService("ChangeHistoryService")`,
    `ChangeHistoryService:SetWaypoint("${safe} (before)")`,
    `local ok, err = pcall(function()`,
    ...body.split('\n').map(l => `  ${l}`),
    `end)`,
    `if not ok then`,
    `  warn("[ForjeGames] Luau exec error: " .. tostring(err))`,
    `end`,
    `ChangeHistoryService:SetWaypoint("${safe} (after)")`,
  ].join('\n')
}

// ---------------------------------------------------------------------------
// Path resolver — converts "workspace.Castle.Tower" to a navigable chain
// ---------------------------------------------------------------------------

/**
 * Converts a dot-separated path string to a Luau expression that resolves
 * the instance.  "workspace" maps to the global `workspace`; all other
 * segments are accessed via WaitForChild with a short timeout so the
 * generated code never hangs indefinitely.
 *
 * Examples:
 *   "workspace"              → workspace
 *   "workspace.Castle"       → workspace:WaitForChild("Castle", 5)
 *   "workspace.Castle.Tower" → workspace:WaitForChild("Castle", 5):WaitForChild("Tower", 5)
 */
function pathToLuau(path: string): string {
  const safePath = sanitiseName(path)
  const parts = safePath.split('.').filter(Boolean)

  if (parts.length === 0) return 'workspace'

  const root = parts[0].toLowerCase() === 'workspace' ? 'workspace' : `game:GetService("${parts[0]}")`
  if (parts.length === 1) return root

  const chain = parts
    .slice(1)
    .map(seg => `:WaitForChild("${escapeLuauString(seg)}", 5)`)
    .join('')

  return `${root}${chain}`
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate Luau code to update a single property on an existing instance.
 *
 * @param instancePath  Dot-separated path, e.g. "workspace.Castle"
 * @param property      Property name, e.g. "Position", "Color", "Material"
 * @param value         New value — typed based on the property (see serialiseValue)
 *
 * @example
 *   generatePropertyUpdate('workspace.Castle', 'Position', { x: 150, y: 0, z: 200 })
 *   // → workspace:WaitForChild("Castle", 5).Position = Vector3.new(150, 0, 200)
 */
export function generatePropertyUpdate(
  instancePath: string,
  property: string,
  value: unknown,
): string {
  const safeProp = property.replace(/[^a-zA-Z0-9_]/g, '')
  const resolvedPath = pathToLuau(instancePath)
  const luauValue = serialiseValue(property, value)

  const body = `${resolvedPath}.${safeProp} = ${luauValue}`
  return withWaypoint(`Set ${safeProp}`, body)
}

/**
 * Generate Luau code to create a new instance and set its properties.
 *
 * @param type        Roblox ClassName, e.g. "Part", "Model", "MeshPart"
 * @param name        Instance name
 * @param parent      Dot-separated parent path, e.g. "workspace"
 * @param properties  Additional properties to set after creation
 *
 * @example
 *   generateInstanceCreate('Part', 'Castle', 'workspace', {
 *     Size: { x: 20, y: 40, z: 20 },
 *     Color: '#D4AF37',
 *     Material: 'Brick',
 *     Anchored: true,
 *   })
 */
export function generateInstanceCreate(
  type: string,
  name: string,
  parent: string,
  properties: Record<string, unknown> = {},
): string {
  const safeType = type.replace(/[^a-zA-Z]/g, '')
  const safeName = sanitiseName(name)
  const parentPath = pathToLuau(parent)

  const propLines = Object.entries(properties)
    .filter(([key]) => key !== 'Parent' && key !== 'Name')
    .map(([key, val]) => {
      const safeProp = key.replace(/[^a-zA-Z0-9_]/g, '')
      return `  part.${safeProp} = ${serialiseValue(key, val)}`
    })
    .join('\n')

  const body = [
    `local part = Instance.new("${safeType}")`,
    `part.Name = "${escapeLuauString(safeName)}"`,
    propLines,
    `part.Parent = ${parentPath}`,
  ]
    .filter(Boolean)
    .join('\n')

  return withWaypoint(`Create ${safeType}`, body)
}

/**
 * Generate Luau code to destroy (delete) an instance by path.
 *
 * @param instancePath  Dot-separated path, e.g. "workspace.Castle"
 *
 * @example
 *   generateInstanceDelete('workspace.Castle')
 *   // → workspace:WaitForChild("Castle", 5):Destroy()
 */
export function generateInstanceDelete(instancePath: string): string {
  const resolvedPath = pathToLuau(instancePath)
  // Extract friendly name for the waypoint label
  const parts = sanitiseName(instancePath).split('.').filter(Boolean)
  const label = parts[parts.length - 1] ?? 'Instance'

  const body = `${resolvedPath}:Destroy()`
  return withWaypoint(`Delete ${label}`, body)
}

/**
 * Generate Luau code to clone (duplicate) an instance.
 * The clone is placed next to the original (+20 studs on X axis for Parts).
 *
 * @param instancePath  Dot-separated path to the source, e.g. "workspace.Castle"
 * @param newName       Name to assign to the clone
 *
 * @example
 *   generateInstanceDuplicate('workspace.Castle', 'Castle_Copy')
 */
export function generateInstanceDuplicate(
  instancePath: string,
  newName: string,
): string {
  const resolvedPath = pathToLuau(instancePath)
  const safeName = escapeLuauString(sanitiseName(newName))

  // Extract parent path (everything before the last segment)
  const parts = sanitiseName(instancePath).split('.').filter(Boolean)
  const parentSegments = parts.slice(0, -1)
  const parentPath = parentSegments.length
    ? pathToLuau(parentSegments.join('.'))
    : 'workspace'

  const body = [
    `local source = ${resolvedPath}`,
    `local clone = source:Clone()`,
    `clone.Name = "${safeName}"`,
    // Offset position for Parts so the clone doesn't overlap the source
    `if clone:IsA("BasePart") then`,
    `  clone.Position = source.Position + Vector3.new(20, 0, 0)`,
    `end`,
    `clone.Parent = ${parentPath}`,
  ].join('\n')

  return withWaypoint(`Duplicate ${parts[parts.length - 1] ?? 'Instance'}`, body)
}

/**
 * Generate Luau code that creates an entire scene from a SceneObject array.
 * Intended for full AI-generated builds sent as a single execute_luau command.
 *
 * Objects are emitted in the order provided — callers should topologically sort
 * parents before children.
 *
 * @param objects  Array of SceneObject descriptors
 *
 * @example
 *   generateBuild([
 *     { type: 'Model', name: 'CastleGroup', parent: 'workspace' },
 *     { type: 'Part',  name: 'Keep', parent: 'workspace.CastleGroup',
 *       properties: { Size: { x: 20, y: 40, z: 20 }, Anchored: true } },
 *   ])
 */
export function generateBuild(objects: SceneObject[]): string {
  if (objects.length === 0) return ''

  const ChangeHistoryPreamble = [
    `local ChangeHistoryService = game:GetService("ChangeHistoryService")`,
    `ChangeHistoryService:SetWaypoint("ForjeGames Build (before)")`,
  ]

  /**
   * Track created variable names so child objects can reference parent vars
   * instead of using WaitForChild chains (faster & avoids race conditions).
   */
  const varMap = new Map<string, string>()

  // Build a unique variable name from object name + index
  function makeVar(name: string, index: number): string {
    const base = name.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^[0-9]/, '_$&')
    return `obj_${base}_${index}`
  }

  const objectLines: string[] = []

  objects.forEach((obj, i) => {
    const safeType = obj.type.replace(/[^a-zA-Z]/g, '')
    const safeName = sanitiseName(obj.name)
    const varName = makeVar(safeName, i)

    // Resolve parent — prefer a previously created variable for speed
    const safeParent = sanitiseName(obj.parent)
    const parentVar = varMap.get(safeParent)
    const parentLuau = parentVar ?? pathToLuau(safeParent)

    const block: string[] = []
    block.push(`-- [${i + 1}] ${safeType}: ${safeName}`)
    block.push(`local ${varName} = Instance.new("${safeType}")`)
    block.push(`${varName}.Name = "${escapeLuauString(safeName)}"`)

    if (obj.properties) {
      for (const [key, val] of Object.entries(obj.properties)) {
        if (key === 'Parent' || key === 'Name') continue
        const safeProp = key.replace(/[^a-zA-Z0-9_]/g, '')
        block.push(`${varName}.${safeProp} = ${serialiseValue(key, val)}`)
      }
    }

    block.push(`${varName}.Parent = ${parentLuau}`)

    // Register this path so children can reference it
    const fullPath = `${safeParent}.${safeName}`
    varMap.set(fullPath, varName)

    objectLines.push(block.join('\n'))
  })

  const epilogue = [
    `ChangeHistoryService:SetWaypoint("ForjeGames Build (after)")`,
  ]

  const wrapBody = [
    ...ChangeHistoryPreamble,
    `local ok, err = pcall(function()`,
    ...objectLines.map(block =>
      block
        .split('\n')
        .map(l => `  ${l}`)
        .join('\n'),
    ),
    `end)`,
    `if not ok then`,
    `  warn("[ForjeGames] Build error: " .. tostring(err))`,
    `end`,
    ...epilogue,
  ].join('\n')

  return wrapBody
}

// ---------------------------------------------------------------------------
// Convenience: generate an execute_luau command data payload
// ---------------------------------------------------------------------------

/**
 * Wraps generated Luau code into the PendingCommand data shape expected
 * by /api/studio/sync → Studio plugin.
 *
 * @example
 *   const data = asExecutePayload(generatePropertyUpdate(...))
 *   queueCommand(sessionId, { type: 'execute_luau', data })
 */
export function asExecutePayload(code: string): Record<string, unknown> {
  return { code }
}
