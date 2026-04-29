/**
 * Style consistency enforcement across build phases.
 *
 * Extracts style fingerprints from generated Luau code and formats
 * them as prompt constraints so subsequent builds maintain the same
 * material palette, color scheme, and aesthetic.
 *
 * Also provides enforceStyle(), detectStyle(), and validateStyle()
 * for active correction and scoring of generated code.
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

// Materials that should NEVER be used in any style (always replace these)
const ALWAYS_BANNED_MATERIALS = ['SmoothPlastic', 'Plastic']

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
  bannedMaterials: string[]
  colorRanges: Array<{ rMin: number; rMax: number; gMin: number; gMax: number; bMin: number; bMax: number }>
  // Representative RGB palette entries for color shifting
  representativeColors: Array<{ r: number; g: number; b: number }>
  keywords: string[]
}

const THEME_SIGNATURES: ThemeSignature[] = [
  // ── Original 6 themes ──────────────────────────────────────────────────────
  {
    name: 'medieval',
    materials: ['Cobblestone', 'Wood', 'WoodPlanks', 'Brick', 'Slate', 'Granite'],
    bannedMaterials: ['Neon', 'DiamondPlate', 'ForceField', 'SmoothPlastic', 'Plastic'],
    colorRanges: [{ rMin: 60, rMax: 180, gMin: 40, gMax: 140, bMin: 20, bMax: 100 }],
    representativeColors: [
      { r: 120, g: 90, b: 60 },
      { r: 90, g: 70, b: 45 },
      { r: 160, g: 120, b: 80 },
    ],
    keywords: ['castle', 'stone', 'torch', 'medieval', 'knight', 'keep', 'dungeon'],
  },
  {
    name: 'modern',
    materials: ['Concrete', 'Glass', 'Metal', 'DiamondPlate', 'Marble'],
    bannedMaterials: ['SmoothPlastic', 'Plastic', 'Mud', 'CrackedLava'],
    colorRanges: [{ rMin: 150, rMax: 255, gMin: 150, gMax: 255, bMin: 150, bMax: 255 }],
    representativeColors: [
      { r: 200, g: 200, b: 200 },
      { r: 240, g: 240, b: 240 },
      { r: 170, g: 170, b: 180 },
    ],
    keywords: ['modern', 'office', 'apartment', 'glass', 'skyscraper', 'urban'],
  },
  {
    name: 'sci-fi',
    materials: ['Neon', 'Metal', 'DiamondPlate', 'ForceField', 'Glass'],
    bannedMaterials: ['SmoothPlastic', 'Plastic', 'Mud', 'Wood', 'Cobblestone'],
    colorRanges: [{ rMin: 0, rMax: 100, gMin: 100, gMax: 255, bMin: 150, bMax: 255 }],
    representativeColors: [
      { r: 0, g: 200, b: 255 },
      { r: 50, g: 255, b: 200 },
      { r: 30, g: 150, b: 220 },
    ],
    keywords: ['space', 'laser', 'neon', 'futuristic', 'cyber', 'tech', 'hologram'],
  },
  {
    name: 'nature',
    materials: ['Grass', 'LeafyGrass', 'Sand', 'Ground', 'Rock', 'Mud', 'Wood'],
    bannedMaterials: ['Metal', 'DiamondPlate', 'Neon', 'SmoothPlastic', 'Plastic', 'ForceField'],
    colorRanges: [{ rMin: 30, rMax: 140, gMin: 80, gMax: 200, bMin: 20, bMax: 100 }],
    representativeColors: [
      { r: 60, g: 140, b: 40 },
      { r: 90, g: 160, b: 60 },
      { r: 110, g: 180, b: 50 },
    ],
    keywords: ['forest', 'tree', 'garden', 'park', 'mountain', 'river', 'nature'],
  },
  {
    name: 'horror',
    materials: ['CorrodedMetal', 'Slate', 'Concrete', 'Brick', 'Cobblestone'],
    bannedMaterials: ['SmoothPlastic', 'Plastic', 'DiamondPlate', 'ForceField'],
    colorRanges: [{ rMin: 20, rMax: 80, gMin: 15, gMax: 60, bMin: 15, bMax: 60 }],
    representativeColors: [
      { r: 50, g: 30, b: 30 },
      { r: 40, g: 40, b: 40 },
      { r: 70, g: 20, b: 20 },
    ],
    keywords: ['horror', 'spooky', 'abandoned', 'dark', 'creepy', 'haunted', 'zombie'],
  },
  {
    name: 'industrial',
    materials: ['Metal', 'DiamondPlate', 'CorrodedMetal', 'Concrete', 'Brick'],
    bannedMaterials: ['SmoothPlastic', 'Plastic', 'Neon', 'Fabric', 'LeafyGrass'],
    colorRanges: [{ rMin: 80, rMax: 180, gMin: 70, gMax: 160, bMin: 60, bMax: 140 }],
    representativeColors: [
      { r: 130, g: 120, b: 110 },
      { r: 100, g: 90, b: 80 },
      { r: 160, g: 150, b: 130 },
    ],
    keywords: ['factory', 'warehouse', 'industrial', 'pipe', 'machine', 'metal'],
  },

  // ── 14 new themes ──────────────────────────────────────────────────────────
  {
    name: 'victorian',
    materials: ['Brick', 'Wood', 'WoodPlanks', 'Marble', 'Glass'],
    bannedMaterials: ['Neon', 'DiamondPlate', 'ForceField', 'SmoothPlastic', 'Plastic', 'CorrodedMetal'],
    colorRanges: [
      { rMin: 100, rMax: 200, gMin: 50, gMax: 130, bMin: 30, bMax: 90 },
      { rMin: 140, rMax: 220, gMin: 90, gMax: 160, bMin: 60, bMax: 120 },
    ],
    representativeColors: [
      { r: 160, g: 90, b: 60 },
      { r: 130, g: 70, b: 40 },
      { r: 180, g: 120, b: 80 },
    ],
    keywords: ['victorian', 'ornate', 'mansion', 'parlor', 'gaslight', 'gothic', 'chandelier', 'victoriana'],
  },
  {
    name: 'japanese',
    materials: ['Wood', 'WoodPlanks', 'Fabric', 'Slate', 'Pebble'],
    bannedMaterials: ['Neon', 'DiamondPlate', 'CorrodedMetal', 'SmoothPlastic', 'Plastic', 'ForceField'],
    colorRanges: [
      { rMin: 150, rMax: 220, gMin: 130, gMax: 190, bMin: 100, bMax: 160 },
      { rMin: 60, rMax: 140, gMin: 50, gMax: 120, bMin: 40, bMax: 100 },
    ],
    representativeColors: [
      { r: 180, g: 150, b: 120 },
      { r: 90, g: 70, b: 55 },
      { r: 210, g: 190, b: 160 },
    ],
    keywords: ['japanese', 'zen', 'shrine', 'dojo', 'pagoda', 'torii', 'tatami', 'samurai', 'sakura', 'bonsai'],
  },
  {
    name: 'tropical',
    materials: ['Wood', 'WoodPlanks', 'LeafyGrass', 'Sand', 'Fabric'],
    bannedMaterials: ['Metal', 'DiamondPlate', 'CorrodedMetal', 'SmoothPlastic', 'Plastic', 'Concrete'],
    colorRanges: [
      { rMin: 0, rMax: 100, gMin: 130, gMax: 255, bMin: 80, bMax: 200 },
      { rMin: 200, rMax: 255, gMin: 180, gMax: 255, bMin: 50, bMax: 150 },
    ],
    representativeColors: [
      { r: 50, g: 180, b: 100 },
      { r: 30, g: 160, b: 200 },
      { r: 240, g: 210, b: 80 },
    ],
    keywords: ['tropical', 'beach', 'island', 'tiki', 'resort', 'palm', 'ocean', 'surfing', 'hula'],
  },
  {
    name: 'arctic',
    materials: ['Ice', 'Glass', 'Snow', 'Concrete', 'Metal'],
    bannedMaterials: ['Neon', 'SmoothPlastic', 'Plastic', 'Mud', 'Ground', 'Grass'],
    colorRanges: [
      { rMin: 180, rMax: 255, gMin: 200, gMax: 255, bMin: 220, bMax: 255 },
      { rMin: 100, rMax: 180, gMin: 150, gMax: 220, bMin: 200, bMax: 255 },
    ],
    representativeColors: [
      { r: 220, g: 235, b: 255 },
      { r: 180, g: 210, b: 250 },
      { r: 240, g: 248, b: 255 },
    ],
    keywords: ['arctic', 'frozen', 'ice', 'snow', 'tundra', 'glacier', 'polar', 'blizzard', 'frost', 'winter'],
  },
  {
    name: 'steampunk',
    materials: ['Metal', 'CorrodedMetal', 'Brick', 'Wood', 'Glass'],
    bannedMaterials: ['Neon', 'ForceField', 'SmoothPlastic', 'Plastic', 'LeafyGrass'],
    colorRanges: [
      { rMin: 150, rMax: 220, gMin: 100, gMax: 160, bMin: 30, bMax: 80 },
      { rMin: 180, rMax: 240, gMin: 130, gMax: 180, bMin: 50, bMax: 100 },
    ],
    representativeColors: [
      { r: 190, g: 140, b: 60 },
      { r: 160, g: 110, b: 45 },
      { r: 210, g: 160, b: 70 },
    ],
    keywords: ['steampunk', 'clockwork', 'gear', 'brass', 'steam', 'pipe', 'airship', 'goggles', 'cog', 'boiler'],
  },
  {
    name: 'underwater',
    materials: ['Glass', 'Neon', 'Marble', 'Pebble', 'Sand'],
    bannedMaterials: ['SmoothPlastic', 'Plastic', 'Wood', 'CorrodedMetal', 'Brick'],
    colorRanges: [
      { rMin: 0, rMax: 80, gMin: 80, gMax: 200, bMin: 150, bMax: 255 },
      { rMin: 0, rMax: 60, gMin: 100, gMax: 180, bMin: 130, bMax: 230 },
    ],
    representativeColors: [
      { r: 20, g: 120, b: 200 },
      { r: 10, g: 90, b: 160 },
      { r: 40, g: 160, b: 180 },
    ],
    keywords: ['underwater', 'ocean', 'aquatic', 'submarine', 'coral', 'deep sea', 'mermaid', 'kelp', 'abyss'],
  },
  {
    name: 'western',
    materials: ['Wood', 'WoodPlanks', 'Sand', 'Brick', 'Cobblestone'],
    bannedMaterials: ['Neon', 'DiamondPlate', 'ForceField', 'SmoothPlastic', 'Plastic', 'Ice'],
    colorRanges: [
      { rMin: 160, rMax: 230, gMin: 120, gMax: 180, bMin: 70, bMax: 130 },
      { rMin: 200, rMax: 255, gMin: 160, gMax: 210, bMin: 100, bMax: 160 },
    ],
    representativeColors: [
      { r: 195, g: 155, b: 100 },
      { r: 220, g: 180, b: 120 },
      { r: 170, g: 130, b: 85 },
    ],
    keywords: ['western', 'saloon', 'cowboy', 'desert', 'frontier', 'ranch', 'outlaw', 'sheriff', 'wild west'],
  },
  {
    name: 'cyberpunk',
    materials: ['Neon', 'Metal', 'Glass', 'Concrete', 'DiamondPlate'],
    bannedMaterials: ['SmoothPlastic', 'Plastic', 'Wood', 'Cobblestone', 'Mud', 'LeafyGrass'],
    colorRanges: [
      { rMin: 180, rMax: 255, gMin: 0, gMax: 80, bMin: 150, bMax: 255 },
      { rMin: 0, rMax: 100, gMin: 200, gMax: 255, bMin: 200, bMax: 255 },
    ],
    representativeColors: [
      { r: 240, g: 0, b: 200 },
      { r: 0, g: 240, b: 240 },
      { r: 200, g: 0, b: 255 },
    ],
    keywords: ['cyberpunk', 'neon', 'night city', 'dystopian', 'cyber', 'megacity', 'hacker', 'neonlit', 'hologram'],
  },
  {
    name: 'fantasy',
    materials: ['Cobblestone', 'Marble', 'Wood', 'Fabric', 'Neon'],
    bannedMaterials: ['SmoothPlastic', 'Plastic', 'DiamondPlate', 'CorrodedMetal', 'Asphalt'],
    colorRanges: [
      { rMin: 100, rMax: 200, gMin: 50, gMax: 150, bMin: 150, bMax: 255 },
      { rMin: 180, rMax: 255, gMin: 150, gMax: 220, bMin: 0, bMax: 80 },
    ],
    representativeColors: [
      { r: 150, g: 80, b: 220 },
      { r: 220, g: 190, b: 50 },
      { r: 120, g: 60, b: 200 },
    ],
    keywords: ['fantasy', 'enchanted', 'magical', 'fairy', 'wizard', 'elven', 'mythical', 'spellbook', 'dragon', 'potion'],
  },
  {
    name: 'post_apocalyptic',
    materials: ['CorrodedMetal', 'Concrete', 'Brick', 'Slate', 'Ground'],
    bannedMaterials: ['Neon', 'DiamondPlate', 'ForceField', 'SmoothPlastic', 'Plastic', 'Fabric'],
    colorRanges: [
      { rMin: 60, rMax: 150, gMin: 50, gMax: 130, bMin: 40, bMax: 110 },
      { rMin: 100, rMax: 180, gMin: 90, gMax: 160, bMin: 80, bMax: 140 },
    ],
    representativeColors: [
      { r: 110, g: 100, b: 90 },
      { r: 130, g: 115, b: 100 },
      { r: 90, g: 80, b: 70 },
    ],
    keywords: ['post-apocalyptic', 'wasteland', 'ruins', 'apocalypse', 'abandoned', 'fallout', 'decay', 'desolate'],
  },
  {
    name: 'candy',
    materials: ['Neon', 'Fabric', 'Concrete', 'Glass', 'Marble'],
    bannedMaterials: ['CorrodedMetal', 'SmoothPlastic', 'Plastic', 'Slate', 'Mud', 'Ground'],
    colorRanges: [
      { rMin: 200, rMax: 255, gMin: 100, gMax: 200, bMin: 150, bMax: 255 },
      { rMin: 240, rMax: 255, gMin: 180, gMax: 255, bMin: 50, bMax: 180 },
    ],
    representativeColors: [
      { r: 255, g: 150, b: 200 },
      { r: 255, g: 220, b: 80 },
      { r: 150, g: 255, b: 180 },
    ],
    keywords: ['candy', 'sweet', 'dessert', 'cake', 'ice cream', 'bubblegum', 'lollipop', 'cotton candy', 'sugary'],
  },
  {
    name: 'military',
    materials: ['Metal', 'Concrete', 'DiamondPlate', 'Fabric', 'Brick'],
    bannedMaterials: ['Neon', 'ForceField', 'SmoothPlastic', 'Plastic', 'Marble', 'Fabric'],
    colorRanges: [
      { rMin: 60, rMax: 130, gMin: 70, gMax: 140, bMin: 40, bMax: 100 },
      { rMin: 100, rMax: 170, gMin: 100, gMax: 160, bMin: 80, bMax: 130 },
    ],
    representativeColors: [
      { r: 90, g: 100, b: 65 },
      { r: 120, g: 130, b: 90 },
      { r: 80, g: 90, b: 60 },
    ],
    keywords: ['military', 'army', 'base', 'bunker', 'barracks', 'camo', 'soldier', 'fortification', 'combat'],
  },
  {
    name: 'space',
    materials: ['Metal', 'Glass', 'Neon', 'DiamondPlate', 'ForceField'],
    bannedMaterials: ['SmoothPlastic', 'Plastic', 'Mud', 'Wood', 'Cobblestone', 'LeafyGrass'],
    colorRanges: [
      { rMin: 0, rMax: 60, gMin: 0, gMax: 60, bMin: 0, bMax: 60 },
      { rMin: 150, rMax: 255, gMin: 150, gMax: 255, bMin: 200, bMax: 255 },
    ],
    representativeColors: [
      { r: 20, g: 20, b: 40 },
      { r: 200, g: 210, b: 255 },
      { r: 50, g: 50, b: 100 },
    ],
    keywords: ['space', 'spaceship', 'station', 'lunar', 'mars', 'asteroid', 'galaxy', 'orbit', 'cosmos', 'astronaut'],
  },
  {
    name: 'pirate',
    materials: ['Wood', 'WoodPlanks', 'Fabric', 'CorrodedMetal', 'Cobblestone'],
    bannedMaterials: ['Neon', 'DiamondPlate', 'ForceField', 'SmoothPlastic', 'Plastic', 'Glass'],
    colorRanges: [
      { rMin: 100, rMax: 190, gMin: 70, gMax: 140, bMin: 40, bMax: 100 },
      { rMin: 160, rMax: 230, gMin: 50, gMax: 120, bMin: 40, bMax: 90 },
    ],
    representativeColors: [
      { r: 140, g: 95, b: 60 },
      { r: 180, g: 70, b: 50 },
      { r: 110, g: 80, b: 50 },
    ],
    keywords: ['pirate', 'ship', 'treasure', 'dock', 'harbor', 'cannon', 'galleon', 'plunder', 'sail', 'buccaneer'],
  },
]

// ── Lookup helpers ──────────────────────────────────────────────────────────

function getThemeSignature(styleName: string): ThemeSignature | null {
  return THEME_SIGNATURES.find(s => s.name === styleName) ?? null
}

function parseRgb(color: string): { r: number; g: number; b: number } | null {
  const m = color.match(/rgb\((\d+),(\d+),(\d+)\)/)
  if (!m) return null
  return { r: parseInt(m[1]), g: parseInt(m[2]), b: parseInt(m[3]) }
}

function colorDistance(
  a: { r: number; g: number; b: number },
  b: { r: number; g: number; b: number },
): number {
  return Math.sqrt(
    Math.pow(a.r - b.r, 2) +
    Math.pow(a.g - b.g, 2) +
    Math.pow(a.b - b.b, 2),
  )
}

/**
 * Find the closest representative color in a palette to the given color.
 */
function nearestPaletteColor(
  color: { r: number; g: number; b: number },
  palette: Array<{ r: number; g: number; b: number }>,
): { r: number; g: number; b: number } | null {
  if (palette.length === 0) return null
  let nearest = palette[0]
  let minDist = colorDistance(color, palette[0])
  for (let i = 1; i < palette.length; i++) {
    const d = colorDistance(color, palette[i])
    if (d < minDist) {
      minDist = d
      nearest = palette[i]
    }
  }
  return nearest
}

/**
 * Check whether a color falls inside any of the theme's color ranges.
 */
function colorInRange(
  color: { r: number; g: number; b: number },
  ranges: ThemeSignature['colorRanges'],
): boolean {
  for (const range of ranges) {
    if (
      color.r >= range.rMin && color.r <= range.rMax &&
      color.g >= range.gMin && color.g <= range.gMax &&
      color.b >= range.bMin && color.b <= range.bMax
    ) {
      return true
    }
  }
  return false
}

// ── Theme detection ─────────────────────────────────────────────────────────

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
      if (colorInRange(parsed, sig.colorRanges)) {
        score += 1
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

// ── Public API: existing exports ────────────────────────────────────────────

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

// ── New Public API ───────────────────────────────────────────────────────────

/**
 * Scan a prompt for style keywords and return the best matching theme name.
 * Returns 'mixed' when no single theme strongly matches.
 *
 * Scoring: +3 per keyword match (whole word, case-insensitive).
 * Requires a score of at least 3 for a definitive result.
 */
export function detectStyle(prompt: string): string {
  const lower = prompt.toLowerCase()
  let bestStyle = 'mixed'
  let bestScore = 0
  const scores: Record<string, number> = {}

  for (const sig of THEME_SIGNATURES) {
    let score = 0
    for (const keyword of sig.keywords) {
      // Use word-boundary style match — keyword must be surrounded by
      // non-alphanumeric characters or be at the string edges
      const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`, 'i')
      if (regex.test(lower)) score += 3
    }
    scores[sig.name] = score
    if (score > bestScore) {
      bestScore = score
      bestStyle = sig.name
    }
  }

  // Check for ties — if two styles are within 1 point of each other
  // and both are above the threshold, call it 'mixed'
  if (bestScore >= 3) {
    const topCount = Object.values(scores).filter(s => s >= bestScore - 1 && s >= 3).length
    if (topCount > 1) return 'mixed'
    return bestStyle
  }

  return 'mixed'
}

/**
 * Validate how well the generated Luau code matches a requested style.
 *
 * Score breakdown:
 *   +5 per material that belongs to the style palette
 *   -10 per material that is banned for the style
 *   +2 per Color3 value that falls inside the style's color ranges
 *   -5 per Color3 value that is >80 RGB distance from every representative color
 *
 * Score is clamped to 0–100.
 * Also returns a human-readable violations list.
 */
export function validateStyle(
  luauCode: string,
  style: string,
): { score: number; violations: string[] } {
  const sig = getThemeSignature(style)
  if (!sig) {
    return { score: 50, violations: [`Unknown style: "${style}"`] }
  }

  const violations: string[] = []
  let rawScore = 50 // Start at 50 (neutral)

  // ── Material scoring ────────────────────────────────────────────────────
  const foundMaterials = extractMaterials(luauCode)

  for (const mat of foundMaterials) {
    if (sig.materials.includes(mat)) {
      rawScore += 5
    }
    if (sig.bannedMaterials.includes(mat)) {
      rawScore -= 10
      violations.push(
        `Material violation: "${mat}" is not appropriate for ${style} builds`
      )
    }
    if (ALWAYS_BANNED_MATERIALS.includes(mat)) {
      rawScore -= 15
      violations.push(
        `Banned material: "${mat}" must never be used (replace with a textured material)`
      )
    }
  }

  // Bonus: if most materials are on-style
  if (foundMaterials.length > 0) {
    const onStyleCount = foundMaterials.filter(m => sig.materials.includes(m)).length
    const ratio = onStyleCount / foundMaterials.length
    if (ratio >= 0.7) rawScore += 10
    else if (ratio < 0.3 && foundMaterials.length >= 3) {
      rawScore -= 10
      violations.push(
        `Only ${Math.round(ratio * 100)}% of materials match the ${style} palette (found: ${foundMaterials.join(', ')})`
      )
    }
  }

  // ── Color scoring ───────────────────────────────────────────────────────
  const foundColors = extractColors(luauCode)
  const COLOR_DISTANCE_THRESHOLD = 80

  for (const colorStr of foundColors) {
    const parsed = parseRgb(colorStr)
    if (!parsed) continue

    if (colorInRange(parsed, sig.colorRanges)) {
      rawScore += 2
    } else {
      // Check distance to nearest representative color
      const nearest = nearestPaletteColor(parsed, sig.representativeColors)
      if (nearest) {
        const dist = colorDistance(parsed, nearest)
        if (dist > COLOR_DISTANCE_THRESHOLD) {
          rawScore -= 5
          violations.push(
            `Color (${parsed.r},${parsed.g},${parsed.b}) is far from the ${style} palette ` +
            `(nearest palette color: ${nearest.r},${nearest.g},${nearest.b}, distance: ${Math.round(dist)})`
          )
        }
      }
    }
  }

  const score = Math.max(0, Math.min(100, rawScore))
  return { score, violations }
}

/**
 * Enforce a style by rewriting banned materials and shifting off-palette colors
 * in the provided Luau code string.
 *
 * Rules:
 *  - All SmoothPlastic / Plastic references are always replaced.
 *  - Materials banned by the target style are replaced with the first
 *    style-appropriate material that isn't itself banned.
 *  - Color3.fromRGB values that are >80 RGB distance from every
 *    representative palette color are shifted 50% toward the nearest
 *    palette color.
 *  - Color3.new (float) values receive the same treatment.
 *
 * Returns the modified code.
 */
export function enforceStyle(luauCode: string, style: string): string {
  const sig = getThemeSignature(style)
  // If we don't recognise the style, still strip always-banned materials
  const bannedSet = new Set<string>([
    ...ALWAYS_BANNED_MATERIALS,
    ...(sig ? sig.bannedMaterials : []),
  ])

  // Build a fallback replacement material for this style (never SmoothPlastic)
  const fallbackMaterial = sig
    ? sig.materials.find(m => !bannedSet.has(m)) ?? 'Concrete'
    : 'Concrete'

  // Per-banned-material replacement priorities
  // (maps banned → best style-appropriate replacement)
  const materialReplacementMap = buildMaterialReplacementMap(sig, bannedSet, fallbackMaterial)

  let result = luauCode

  // ── Step 1: Replace banned Enum.Material.X ───────────────────────────────
  result = result.replace(/Enum\.Material\.(\w+)/g, (_match, matName) => {
    if (bannedSet.has(matName)) {
      const replacement = materialReplacementMap[matName] ?? fallbackMaterial
      return `Enum.Material.${replacement}`
    }
    return _match
  })

  // ── Step 2: Replace .Material = "X" string assignments ──────────────────
  result = result.replace(/\.Material\s*=\s*["'](\w+)["']/g, (match, matName) => {
    if (bannedSet.has(matName)) {
      const replacement = materialReplacementMap[matName] ?? fallbackMaterial
      // Preserve quote style
      const quote = match.includes('"') ? '"' : "'"
      return `.Material = ${quote}${replacement}${quote}`
    }
    return match
  })

  // ── Step 3: Shift off-palette Color3.fromRGB values ─────────────────────
  if (sig) {
    const COLOR_SHIFT_THRESHOLD = 80
    const SHIFT_AMOUNT = 0.5

    result = result.replace(
      /Color3\.fromRGB\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/g,
      (_match, rs, gs, bs) => {
        const r = parseInt(rs)
        const g = parseInt(gs)
        const b = parseInt(bs)
        const color = { r, g, b }

        // Check if already on-palette
        if (colorInRange(color, sig.colorRanges)) return _match

        const nearest = nearestPaletteColor(color, sig.representativeColors)
        if (!nearest) return _match

        const dist = colorDistance(color, nearest)
        if (dist <= COLOR_SHIFT_THRESHOLD) return _match

        // Shift toward nearest palette color by SHIFT_AMOUNT
        const newR = Math.round(r + (nearest.r - r) * SHIFT_AMOUNT)
        const newG = Math.round(g + (nearest.g - g) * SHIFT_AMOUNT)
        const newB = Math.round(b + (nearest.b - b) * SHIFT_AMOUNT)
        return `Color3.fromRGB(${newR}, ${newG}, ${newB})`
      }
    )

    // ── Step 4: Shift off-palette Color3.new (float) values ───────────────
    result = result.replace(
      /Color3\.new\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/g,
      (_match, rf, gf, bf) => {
        const r = Math.round(parseFloat(rf) * 255)
        const g = Math.round(parseFloat(gf) * 255)
        const b = Math.round(parseFloat(bf) * 255)

        if (isNaN(r) || isNaN(g) || isNaN(b)) return _match

        const color = { r, g, b }
        if (colorInRange(color, sig.colorRanges)) return _match

        const nearest = nearestPaletteColor(color, sig.representativeColors)
        if (!nearest) return _match

        const dist = colorDistance(color, nearest)
        if (dist <= COLOR_SHIFT_THRESHOLD) return _match

        // Shift and convert back to 0-1 floats
        const newR = Math.round(r + (nearest.r - r) * SHIFT_AMOUNT)
        const newG = Math.round(g + (nearest.g - g) * SHIFT_AMOUNT)
        const newB = Math.round(b + (nearest.b - b) * SHIFT_AMOUNT)
        const fr = (newR / 255).toFixed(3)
        const fg = (newG / 255).toFixed(3)
        const fb = (newB / 255).toFixed(3)
        return `Color3.new(${fr}, ${fg}, ${fb})`
      }
    )
  }

  return result
}

// ── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Build a lookup table that maps each banned material name to its best
 * style-appropriate replacement.
 *
 * Priority:
 *   1. If the banned material has a semantic equivalent in the style palette, use it.
 *   2. Otherwise fall back to the first available palette material.
 */
function buildMaterialReplacementMap(
  sig: ThemeSignature | null,
  bannedSet: Set<string>,
  fallback: string,
): Record<string, string> {
  const map: Record<string, string> = {}
  if (!sig) return map

  // Semantic replacement hints — banned → preferred replacement candidates
  const SEMANTIC_HINTS: Record<string, string[]> = {
    SmoothPlastic: ['Concrete', 'Marble', 'Plaster', 'Brick'],
    Plastic: ['Concrete', 'Marble', 'Plaster', 'Fabric'],
    Neon: ['Glass', 'Metal', 'DiamondPlate', 'ForceField', 'Concrete'],
    DiamondPlate: ['Metal', 'Concrete', 'Brick', 'Cobblestone'],
    ForceField: ['Glass', 'Neon', 'Metal', 'Concrete'],
    CorrodedMetal: ['Metal', 'Cobblestone', 'Brick', 'Concrete'],
    Foil: ['Metal', 'DiamondPlate', 'Glass'],
    CrackedLava: ['Basalt', 'Rock', 'Slate', 'Brick'],
    CardBoard: ['Wood', 'WoodPlanks', 'Fabric'],
    Mud: ['Ground', 'Sand', 'Pebble', 'Grass'],
    Asphalt: ['Concrete', 'Cobblestone', 'Pavement', 'Ground'],
    Pavement: ['Concrete', 'Cobblestone', 'Brick'],
  }

  for (const banned of bannedSet) {
    const hints = SEMANTIC_HINTS[banned] ?? []
    const candidate = hints.find(h => sig.materials.includes(h) && !bannedSet.has(h))
    map[banned] = candidate ?? fallback
  }

  return map
}

/**
 * Return all 20 theme names supported by the style enforcer.
 * Useful for validation / dropdowns in the editor.
 */
export function getAllThemeNames(): string[] {
  return THEME_SIGNATURES.map(s => s.name)
}

/**
 * Return the palette materials for a given style name.
 * Returns empty array for unknown styles.
 */
export function getStyleMaterials(styleName: string): string[] {
  return getThemeSignature(styleName)?.materials ?? []
}

/**
 * Return the banned materials for a given style name.
 * Always includes SmoothPlastic and Plastic.
 */
export function getStyleBannedMaterials(styleName: string): string[] {
  const sig = getThemeSignature(styleName)
  const banned = sig ? [...sig.bannedMaterials] : []
  for (const m of ALWAYS_BANNED_MATERIALS) {
    if (!banned.includes(m)) banned.push(m)
  }
  return banned
}
