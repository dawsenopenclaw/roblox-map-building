/**
 * LuauParser — extracts 3D object data from Roblox Luau code strings.
 *
 * Handles patterns like:
 *   local p = Instance.new("Part")
 *   p.Size   = Vector3.new(10, 1, 10)
 *   p.CFrame = CFrame.new(sp + Vector3.new(0, 4, 0))
 *   p.Color  = Color3.fromRGB(120, 100, 80)
 *   p.Material = Enum.Material.Slate
 *   p.Name = "Floor"
 *
 * Returns an array of ParsedPart that can be fed directly to Three.js.
 */

export type RobloxPartType = 'Part' | 'WedgePart' | 'CylinderPart' | 'SpherePart' | 'UnionOperation'

export type RobloxMaterial =
  | 'Slate'
  | 'Marble'
  | 'WoodPlanks'
  | 'Wood'
  | 'Metal'
  | 'Glass'
  | 'Neon'
  | 'SmoothPlastic'
  | 'Brick'
  | 'Cobblestone'
  | 'Granite'
  | 'DiamondPlate'
  | 'Fabric'
  | 'Ice'
  | 'Sand'
  | 'Sandstone'
  | 'Rock'
  | 'Concrete'
  | 'CorrodedMetal'
  | 'Grass'
  | 'Ground'
  | 'LeafyGrass'
  | 'Pebble'
  | 'Asphalt'
  | 'Foil'
  | 'ForceField'
  | string

export interface ThreeMaterialProps {
  color: string
  roughness: number
  metalness: number
  opacity: number
  transparent: boolean
  emissive: string | null
  emissiveIntensity: number
  wireframe: boolean
}

export interface ParsedPart {
  id: string
  name: string
  partType: RobloxPartType
  position: [number, number, number]
  size: [number, number, number]
  rotation: [number, number, number]   // Euler XYZ in radians
  color: [number, number, number]       // RGB 0-1
  material: RobloxMaterial
  materialProps: ThreeMaterialProps
  anchored: boolean
  transparency: number
}

// ---------------------------------------------------------------------------
// Material → Three.js property table
// ---------------------------------------------------------------------------
const MATERIAL_MAP: Record<string, Partial<ThreeMaterialProps>> = {
  Slate:         { roughness: 0.90, metalness: 0.00 },
  Marble:        { roughness: 0.20, metalness: 0.05 },
  WoodPlanks:    { roughness: 0.70, metalness: 0.00 },
  Wood:          { roughness: 0.75, metalness: 0.00 },
  Metal:         { roughness: 0.30, metalness: 0.80 },
  Glass:         { roughness: 0.10, metalness: 0.00, opacity: 0.30, transparent: true },
  Neon:          { roughness: 0.10, metalness: 0.00, emissiveIntensity: 1.8 },
  SmoothPlastic: { roughness: 0.50, metalness: 0.00 },
  Brick:         { roughness: 0.80, metalness: 0.00 },
  Cobblestone:   { roughness: 0.95, metalness: 0.00 },
  Granite:       { roughness: 0.85, metalness: 0.00 },
  DiamondPlate:  { roughness: 0.20, metalness: 0.90 },
  Fabric:        { roughness: 0.95, metalness: 0.00 },
  Ice:           { roughness: 0.05, metalness: 0.00, opacity: 0.70, transparent: true },
  Sand:          { roughness: 1.00, metalness: 0.00 },
  Sandstone:     { roughness: 0.90, metalness: 0.00 },
  Rock:          { roughness: 0.90, metalness: 0.00 },
  Concrete:      { roughness: 0.95, metalness: 0.00 },
  CorrodedMetal: { roughness: 0.80, metalness: 0.60 },
  Grass:         { roughness: 0.95, metalness: 0.00 },
  Ground:        { roughness: 1.00, metalness: 0.00 },
  LeafyGrass:    { roughness: 0.90, metalness: 0.00 },
  Pebble:        { roughness: 0.90, metalness: 0.00 },
  Asphalt:       { roughness: 0.95, metalness: 0.00 },
  Foil:          { roughness: 0.10, metalness: 1.00 },
  ForceField:    { roughness: 0.00, metalness: 0.10, opacity: 0.40, transparent: true, emissiveIntensity: 0.8 },
}

const DEFAULT_MATERIAL_PROPS: ThreeMaterialProps = {
  color: '#a0a0a0',
  roughness: 0.6,
  metalness: 0.0,
  opacity: 1.0,
  transparent: false,
  emissive: null,
  emissiveIntensity: 0.0,
  wireframe: false,
}

function resolveMaterialProps(material: RobloxMaterial, color: [number, number, number], transparency: number): ThreeMaterialProps {
  const override = MATERIAL_MAP[material] ?? {}
  const hexColor = rgbToHex(color)

  const isNeon = material === 'Neon'
  const isSemiTransparent = transparency > 0

  const opacity = override.transparent
    ? (override.opacity ?? 1.0) * (1 - transparency)
    : isSemiTransparent
      ? 1 - transparency
      : 1.0

  return {
    ...DEFAULT_MATERIAL_PROPS,
    ...override,
    color: hexColor,
    opacity,
    transparent: (override.transparent === true) || isSemiTransparent,
    emissive: isNeon ? hexColor : null,
    emissiveIntensity: isNeon ? (override.emissiveIntensity ?? 1.8) : (override.emissiveIntensity ?? 0),
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function rgbToHex([r, g, b]: [number, number, number]): string {
  const toHex = (v: number) => Math.round(v * 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/** Parse "Vector3.new(x, y, z)" → [x, y, z] floats */
function parseVector3(str: string): [number, number, number] | null {
  const m = str.match(/Vector3\.new\s*\(\s*([^,)]+)\s*,\s*([^,)]+)\s*,\s*([^)]+)\s*\)/)
  if (!m) return null
  return [parseFloat(m[1]) || 0, parseFloat(m[2]) || 0, parseFloat(m[3]) || 0]
}

/**
 * Parse "CFrame.new(...)" position — extracts only the translation component.
 * Supports:
 *   CFrame.new(x, y, z)
 *   CFrame.new(sp + Vector3.new(x, y, z))    → falls back to inner Vector3
 *   CFrame.new(Vector3.new(x, y, z))
 */
function parseCFramePosition(str: string): [number, number, number] | null {
  // Full 12-arg CFrame.new(x,y,z,r00...) — take first 3
  const full = str.match(/CFrame\.new\s*\(\s*([-\d.e]+)\s*,\s*([-\d.e]+)\s*,\s*([-\d.e]+)/)
  if (full) return [parseFloat(full[1]) || 0, parseFloat(full[2]) || 0, parseFloat(full[3]) || 0]

  // CFrame.new(someVar + Vector3.new(...))  — use the Vector3 offset
  const vec = parseVector3(str)
  if (vec) return vec

  return null
}

/** Parse "Color3.fromRGB(r, g, b)" → [0-1, 0-1, 0-1] */
function parseColor3RGB(str: string): [number, number, number] | null {
  const m = str.match(/Color3\.fromRGB\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/)
  if (!m) return null
  return [parseFloat(m[1]) / 255, parseFloat(m[2]) / 255, parseFloat(m[3]) / 255]
}

/** Parse "Color3.fromHSV(h, s, v)" → rgb 0-1 */
function parseColor3HSV(str: string): [number, number, number] | null {
  const m = str.match(/Color3\.fromHSV\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/)
  if (!m) return null
  const [h, s, v] = [parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3])]
  return hsvToRgb(h, s, v)
}

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const i = Math.floor(h * 6)
  const f = h * 6 - i
  const p = v * (1 - s)
  const q = v * (1 - f * s)
  const t = v * (1 - (1 - f) * s)
  switch (i % 6) {
    case 0: return [v, t, p]
    case 1: return [q, v, p]
    case 2: return [p, v, t]
    case 3: return [p, q, v]
    case 4: return [t, p, v]
    default: return [v, p, q]
  }
}

/** Map BrickColor names to approximate RGB */
const BRICK_COLOR_MAP: Record<string, [number, number, number]> = {
  'Medium stone grey':  [0.639, 0.635, 0.647],
  'Dark stone grey':    [0.388, 0.373, 0.384],
  'Light stone grey':   [0.898, 0.894, 0.875],
  'Bright red':         [0.769, 0.157, 0.110],
  'Bright blue':        [0.051, 0.404, 0.675],
  'Bright yellow':      [0.961, 0.804, 0.188],
  'Bright green':       [0.294, 0.592, 0.294],
  'Dark orange':        [0.627, 0.373, 0.208],
  'Reddish brown':      [0.482, 0.251, 0.200],
  'White':              [0.941, 0.953, 0.953],
  'Black':              [0.106, 0.165, 0.208],
  'Brown':              [0.486, 0.361, 0.275],
  'Medium blue':        [0.431, 0.600, 0.792],
  'Sand green':         [0.471, 0.565, 0.510],
  'Sand yellow':        [0.698, 0.675, 0.529],
  'Institutional white':[0.973, 0.973, 0.973],
  'New Yeller':         [1.000, 0.847, 0.000],
  'Cyan':               [0.016, 0.686, 0.922],
  'Lime green':         [0.000, 0.561, 0.000],
  'Magenta':            [0.667, 0.000, 0.667],
  'Orange':             [1.000, 0.502, 0.000],
  'Pink':               [1.000, 0.400, 0.800],
  'Purple':             [0.400, 0.000, 0.800],
  'Teal':               [0.000, 0.502, 0.502],
}

function parseBrickColor(str: string): [number, number, number] | null {
  const m = str.match(/BrickColor\.new\s*\(\s*["']([^"']+)["']\s*\)/)
  if (!m) return null
  return BRICK_COLOR_MAP[m[1]] ?? null
}

/** Parse Enum.Material.Slate → "Slate" */
function parseMaterial(str: string): RobloxMaterial | null {
  const m = str.match(/Enum\.Material\.(\w+)/)
  return m ? (m[1] as RobloxMaterial) : null
}

/** Parse Instance.new("Part") → "Part" */
function parseInstanceType(str: string): RobloxPartType | null {
  const m = str.match(/Instance\.new\s*\(\s*["'](\w+)["']\s*\)/)
  if (!m) return null
  const t = m[1]
  if (t === 'Part' || t === 'WedgePart' || t === 'CylinderPart' || t === 'SpherePart' || t === 'UnionOperation') {
    return t as RobloxPartType
  }
  return null
}

// ---------------------------------------------------------------------------
// Counter for stable IDs
// ---------------------------------------------------------------------------
let _partCounter = 0
function nextId() {
  return `lp_${++_partCounter}`
}

// ---------------------------------------------------------------------------
// Main parser
// ---------------------------------------------------------------------------

/**
 * Roblox Luau uses a coordinate system where Y is up and 1 stud ≈ 0.28m.
 * Three.js uses Y-up as well. We scale studs → Three units at 1:1 for now
 * (the scene camera will auto-fit anyway). Positions are divided by 10 so
 * that a 100-stud map fits comfortably in the viewport.
 */
const SCALE = 0.1  // studs → Three.js world units

export function parseLuauCode(code: string): ParsedPart[] {
  // Split into logical "variable blocks" — each variable name that has
  // Instance.new() defines a new part. We group lines by variable.
  const lines = code.split('\n')

  // Map: varName → accumulated assignment lines
  const varLines = new Map<string, string[]>()
  // Preserve insertion order
  const varOrder: string[] = []

  // Regex to detect variable assignment: local foo = Instance.new("Part")
  // or foo = Instance.new("Part")
  const instanceNewRe = /(?:local\s+)?(\w+)\s*=\s*Instance\.new\s*\(\s*["'](\w+)["']\s*\)/

  // Property assignment: foo.Bar = ...
  const propAssignRe = /^[ \t]*(\w+)\.(\w+)\s*=\s*(.+?)(?:\s*--.*)?$/

  for (const raw of lines) {
    const line = raw.trim()
    if (!line || line.startsWith('--')) continue

    const instMatch = line.match(instanceNewRe)
    if (instMatch) {
      const varName = instMatch[1]
      if (!varLines.has(varName)) {
        varLines.set(varName, [raw])
        varOrder.push(varName)
      } else {
        varLines.get(varName)!.push(raw)
      }
      continue
    }

    const propMatch = line.match(propAssignRe)
    if (propMatch) {
      const varName = propMatch[1]
      if (varLines.has(varName)) {
        varLines.get(varName)!.push(raw)
      }
    }
  }

  const parts: ParsedPart[] = []

  for (const varName of varOrder) {
    const block = varLines.get(varName)!
    const blockText = block.join('\n')

    // Determine part type
    const typeMatch = blockText.match(instanceNewRe)
    const rawType = typeMatch?.[2] ?? 'Part'
    let partType: RobloxPartType = 'Part'
    if (rawType === 'WedgePart') partType = 'WedgePart'
    else if (rawType === 'CylinderPart') partType = 'CylinderPart'
    else if (rawType === 'SpherePart') partType = 'SpherePart'
    else if (rawType !== 'Part') continue   // skip non-Part instances (Model, Script, etc.)

    // Name
    const nameMatch = blockText.match(/\.Name\s*=\s*["']([^"']+)["']/)
    const name = nameMatch?.[1] ?? varName

    // Size
    const sizeMatch = blockText.match(/\.Size\s*=\s*(Vector3\.new\([^)]+\))/)
    const rawSize = sizeMatch ? parseVector3(sizeMatch[1]) : null
    const size: [number, number, number] = rawSize
      ? [rawSize[0] * SCALE, rawSize[1] * SCALE, rawSize[2] * SCALE]
      : [1, 1, 1]

    // Position — try CFrame first, then Position
    const cframeMatch = blockText.match(/\.CFrame\s*=\s*(CFrame\.new\([^)]*(?:\([^)]*\)[^)]*)*\))/)
    const positionMatch = blockText.match(/\.Position\s*=\s*(Vector3\.new\([^)]+\))/)
    let rawPos: [number, number, number] | null = null
    if (cframeMatch) rawPos = parseCFramePosition(cframeMatch[1])
    if (!rawPos && positionMatch) rawPos = parseVector3(positionMatch[1])
    const position: [number, number, number] = rawPos
      ? [rawPos[0] * SCALE, rawPos[1] * SCALE, rawPos[2] * SCALE]
      : [0, 0, 0]

    // Color
    const colorRGBMatch = blockText.match(/\.Color\s*=\s*(Color3\.fromRGB\([^)]+\))/)
    const colorHSVMatch = blockText.match(/\.Color\s*=\s*(Color3\.fromHSV\([^)]+\))/)
    const brickColorMatch = blockText.match(/\.BrickColor\s*=\s*(BrickColor\.new\([^)]+\))/)
    let color: [number, number, number] = [0.627, 0.627, 0.627]
    if (colorRGBMatch) color = parseColor3RGB(colorRGBMatch[1]) ?? color
    else if (colorHSVMatch) color = parseColor3HSV(colorHSVMatch[1]) ?? color
    else if (brickColorMatch) color = parseBrickColor(brickColorMatch[1]) ?? color

    // Material
    const matMatch = blockText.match(/\.Material\s*=\s*(Enum\.Material\.\w+)/)
    const material: RobloxMaterial = (matMatch ? parseMaterial(matMatch[1]) : null) ?? 'SmoothPlastic'

    // Transparency
    const transMatch = blockText.match(/\.Transparency\s*=\s*([\d.]+)/)
    const transparency = transMatch ? parseFloat(transMatch[1]) : 0

    // Anchored
    const anchoredMatch = blockText.match(/\.Anchored\s*=\s*(true|false)/)
    const anchored = anchoredMatch?.[1] !== 'false'

    parts.push({
      id: nextId(),
      name,
      partType,
      position,
      size,
      rotation: [0, 0, 0],
      color,
      material,
      materialProps: resolveMaterialProps(material, color, transparency),
      anchored,
      transparency,
    })
  }

  return parts
}

/** Extract all Lua/Luau code blocks from a markdown string */
export function extractLuauBlocks(markdown: string): string {
  const blocks: string[] = []
  const re = /```(?:lua|luau)?\s*\n([\s\S]*?)```/g
  let m: RegExpExecArray | null
  while ((m = re.exec(markdown)) !== null) {
    blocks.push(m[1].trim())
  }
  return blocks.join('\n\n')
}
