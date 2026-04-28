/**
 * Style consistency enforcement across build phases.
 *
 * Extracts style fingerprints from generated Luau code and formats
 * them as prompt constraints so subsequent builds maintain the same
 * material palette, color scheme, and aesthetic.
 */

export interface BuildStyle {
  materials: string[]
  colors: string[]
  theme: string
  lightingStyle: string
  partScale: string
}

// ── Material detection ──────────────────────────────────────────────────────

const ROBLOX_MATERIALS = [
  'Brick', 'Cobblestone', 'Concrete', 'CorrodedMetal', 'DiamondPlate',
  'Fabric', 'Foil', 'ForceField', 'Glass', 'Granite', 'Grass',
  'Ice', 'Marble', 'Metal', 'Neon', 'Pebble', 'Plastic', 'Sand',
  'Slate', 'SmoothPlastic', 'Wood', 'WoodPlanks', 'Basalt',
  'CrackedLava', 'Glacier', 'Ground', 'LeafyGrass', 'Limestone',
  'Mud', 'Pavement', 'Rock', 'Salt', 'Sandstone', 'Snow',
  'Asphalt', 'CardBoard', 'Carpet', 'CeramicTiles', 'ClayRoofTiles',
  'RoofShingles', 'Rubber', 'Plaster',
]

function extractMaterials(code: string): string[] {
  const found = new Set<string>()

  // Match Enum.Material.X
  const enumRegex = /Enum\.Material\.(\w+)/g
  let m: RegExpExecArray | null
  while ((m = enumRegex.exec(code)) !== null) {
    if (ROBLOX_MATERIALS.includes(m[1])) found.add(m[1])
  }

  // Match .Material = "X" or Material = "X"
  const strRegex = /\.Material\s*=\s*["'](\w+)["']/g
  while ((m = strRegex.exec(code)) !== null) {
    if (ROBLOX_MATERIALS.includes(m[1])) found.add(m[1])
  }

  return Array.from(found)
}

// ── Color detection ─────────────────────────────────────────────────────────

function extractColors(code: string): string[] {
  const found = new Set<string>()

  // Color3.fromRGB(r, g, b)
  const rgbRegex = /Color3\.fromRGB\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/g
  let m: RegExpExecArray | null
  while ((m = rgbRegex.exec(code)) !== null) {
    found.add(`rgb(${m[1]},${m[2]},${m[3]})`)
  }

  // Color3.new(r, g, b) where values are 0-1 floats
  const floatRegex = /Color3\.new\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/g
  while ((m = floatRegex.exec(code)) !== null) {
    const r = Math.round(parseFloat(m[1]) * 255)
    const g = Math.round(parseFloat(m[2]) * 255)
    const b = Math.round(parseFloat(m[3]) * 255)
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
      found.add(`rgb(${r},${g},${b})`)
    }
  }

  return Array.from(found)
}

// ── Theme detection ─────────────────────────────────────────────────────────

interface ThemeSignature {
  name: string
  materials: string[]
  colorRanges: Array<{ rMin: number; rMax: number; gMin: number; gMax: number; bMin: number; bMax: number }>
  keywords: string[]
}

const THEME_SIGNATURES: ThemeSignature[] = [
  {
    name: 'medieval',
    materials: ['Cobblestone', 'Wood', 'WoodPlanks', 'Brick', 'Slate', 'Granite'],
    colorRanges: [{ rMin: 60, rMax: 180, gMin: 40, gMax: 140, bMin: 20, bMax: 100 }],
    keywords: ['castle', 'stone', 'torch', 'medieval', 'knight', 'keep', 'dungeon'],
  },
  {
    name: 'modern',
    materials: ['Concrete', 'Glass', 'Metal', 'DiamondPlate', 'Marble'],
    colorRanges: [{ rMin: 150, rMax: 255, gMin: 150, gMax: 255, bMin: 150, bMax: 255 }],
    keywords: ['modern', 'office', 'apartment', 'glass', 'skyscraper', 'urban'],
  },
  {
    name: 'sci-fi',
    materials: ['Neon', 'Metal', 'DiamondPlate', 'ForceField', 'Glass'],
    colorRanges: [{ rMin: 0, rMax: 100, gMin: 100, gMax: 255, bMin: 150, bMax: 255 }],
    keywords: ['space', 'laser', 'neon', 'futuristic', 'cyber', 'tech', 'hologram'],
  },
  {
    name: 'nature',
    materials: ['Grass', 'LeafyGrass', 'Sand', 'Ground', 'Rock', 'Mud', 'Wood'],
    colorRanges: [{ rMin: 30, rMax: 140, gMin: 80, gMax: 200, bMin: 20, bMax: 100 }],
    keywords: ['forest', 'tree', 'garden', 'park', 'mountain', 'river', 'nature'],
  },
  {
    name: 'horror',
    materials: ['CorrodedMetal', 'Slate', 'Concrete', 'Brick', 'Cobblestone'],
    colorRanges: [{ rMin: 20, rMax: 80, gMin: 15, gMax: 60, bMin: 15, bMax: 60 }],
    keywords: ['horror', 'spooky', 'abandoned', 'dark', 'creepy', 'haunted', 'zombie'],
  },
  {
    name: 'industrial',
    materials: ['Metal', 'DiamondPlate', 'CorrodedMetal', 'Concrete', 'Brick'],
    colorRanges: [{ rMin: 80, rMax: 180, gMin: 70, gMax: 160, bMin: 60, bMax: 140 }],
    keywords: ['factory', 'warehouse', 'industrial', 'pipe', 'machine', 'metal'],
  },
]

function parseRgb(color: string): { r: number; g: number; b: number } | null {
  const m = color.match(/rgb\((\d+),(\d+),(\d+)\)/)
  if (!m) return null
  return { r: parseInt(m[1]), g: parseInt(m[2]), b: parseInt(m[3]) }
}

function detectTheme(materials: string[], colors: string[]): string {
  let bestTheme = 'mixed'
  let bestScore = 0

  for (const sig of THEME_SIGNATURES) {
    let score = 0
    // Material overlap
    for (const mat of materials) {
      if (sig.materials.includes(mat)) score += 2
    }
    // Color range matching
    for (const c of colors) {
      const parsed = parseRgb(c)
      if (!parsed) continue
      for (const range of sig.colorRanges) {
        if (
          parsed.r >= range.rMin && parsed.r <= range.rMax &&
          parsed.g >= range.gMin && parsed.g <= range.gMax &&
          parsed.b >= range.bMin && parsed.b <= range.bMax
        ) {
          score += 1
        }
      }
    }
    if (score > bestScore) {
      bestScore = score
      bestTheme = sig.name
    }
  }

  return bestScore >= 3 ? bestTheme : 'mixed'
}

// ── Lighting style detection ────────────────────────────────────────────────

function detectLightingStyle(colors: string[], code: string): string {
  // Check for explicit lighting in code
  if (/Atmosphere/i.test(code) && /Neon/i.test(code)) return 'neon'
  if (/ClockTime\s*=\s*(6|7|8|17|18|19)/i.test(code)) return 'warm'
  if (/ClockTime\s*=\s*(0|1|2|3|22|23|24)/i.test(code)) return 'dark'
  if (/ClockTime\s*=\s*(10|11|12|13|14)/i.test(code)) return 'bright'

  // Infer from dominant color warmth
  let warmCount = 0
  let coolCount = 0
  for (const c of colors) {
    const parsed = parseRgb(c)
    if (!parsed) continue
    if (parsed.r > parsed.b + 30) warmCount++
    else if (parsed.b > parsed.r + 30) coolCount++
  }

  if (warmCount > coolCount + 2) return 'warm'
  if (coolCount > warmCount + 2) return 'cool'
  return 'neutral'
}

// ── Part scale detection ────────────────────────────────────────────────────

function detectPartScale(code: string): string {
  // Count size values to determine scale
  const sizeRegex = /Vector3\.new\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/g
  const sizes: number[] = []
  let m: RegExpExecArray | null
  while ((m = sizeRegex.exec(code)) !== null) {
    const avg = (parseFloat(m[1]) + parseFloat(m[2]) + parseFloat(m[3])) / 3
    if (!isNaN(avg) && avg > 0 && avg < 1000) sizes.push(avg)
  }

  if (sizes.length === 0) return 'realistic'

  const avgSize = sizes.reduce((a, b) => a + b, 0) / sizes.length
  if (avgSize < 2) return 'low-poly'
  if (avgSize > 20) return 'stylized'
  return 'realistic'
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Extract a BuildStyle fingerprint from generated Luau code.
 */
export function extractStyleFromCode(code: string): BuildStyle {
  const materials = extractMaterials(code)
  const colors = extractColors(code)
  const theme = detectTheme(materials, colors)
  const lightingStyle = detectLightingStyle(colors, code)
  const partScale = detectPartScale(code)

  return { materials, colors, theme, lightingStyle, partScale }
}

/**
 * Format a BuildStyle as a prompt constraint string for the AI.
 */
export function formatStyleConstraint(style: BuildStyle): string {
  if (style.materials.length === 0 && style.colors.length === 0) return ''

  const parts: string[] = []
  parts.push('\n=== STYLE CONSISTENCY ===')

  if (style.materials.length > 0) {
    parts.push(`Your previous builds used [${style.materials.join(', ')}] materials.`)
  }

  if (style.colors.length > 0) {
    // Show up to 8 colors to keep prompt short
    const colorSample = style.colors.slice(0, 8)
    parts.push(`Color palette: ${colorSample.join(', ')}`)
  }

  if (style.theme !== 'mixed') {
    parts.push(`Theme: ${style.theme}`)
  }

  if (style.lightingStyle !== 'neutral') {
    parts.push(`Lighting mood: ${style.lightingStyle}`)
  }

  parts.push(`Part scale: ${style.partScale}`)
  parts.push('MAINTAIN this style. Do NOT switch to a different aesthetic unless the user explicitly asks for a change.')
  parts.push('=== END STYLE CONSISTENCY ===')

  return parts.join('\n')
}

/**
 * Compare two styles and return a list of inconsistency warnings.
 * Empty array = styles are consistent.
 */
export function checkStyleConsistency(
  previous: BuildStyle,
  current: BuildStyle,
): string[] {
  const warnings: string[] = []

  // Check material drift
  if (previous.materials.length > 0 && current.materials.length > 0) {
    const prevSet = new Set(previous.materials)
    const newMats = current.materials.filter(m => !prevSet.has(m))
    const overlap = current.materials.filter(m => prevSet.has(m))

    if (newMats.length > overlap.length && overlap.length < 2) {
      warnings.push(
        `Material drift: switched from [${previous.materials.join(', ')}] to [${current.materials.join(', ')}]. ` +
        `New materials: ${newMats.join(', ')}`
      )
    }
  }

  // Check theme change
  if (previous.theme !== 'mixed' && current.theme !== 'mixed' && previous.theme !== current.theme) {
    warnings.push(`Theme changed from "${previous.theme}" to "${current.theme}"`)
  }

  // Check lighting mood shift
  if (
    previous.lightingStyle !== 'neutral' &&
    current.lightingStyle !== 'neutral' &&
    previous.lightingStyle !== current.lightingStyle
  ) {
    warnings.push(`Lighting mood shifted from "${previous.lightingStyle}" to "${current.lightingStyle}"`)
  }

  // Check color temperature drift
  if (previous.colors.length >= 3 && current.colors.length >= 3) {
    const prevWarmth = averageWarmth(previous.colors)
    const curWarmth = averageWarmth(current.colors)
    if (Math.abs(prevWarmth - curWarmth) > 40) {
      warnings.push(`Color temperature shifted significantly (warmth delta: ${Math.abs(prevWarmth - curWarmth).toFixed(0)})`)
    }
  }

  return warnings
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function averageWarmth(colors: string[]): number {
  let total = 0
  let count = 0
  for (const c of colors) {
    const parsed = parseRgb(c)
    if (!parsed) continue
    total += parsed.r - parsed.b
    count++
  }
  return count > 0 ? total / count : 0
}
