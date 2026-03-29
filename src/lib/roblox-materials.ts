/**
 * Roblox Material System — comprehensive palette with realistic Color3 values.
 * Color3.fromRGB values are tuned for visual quality matching top Roblox titles.
 */

// ---------------------------------------------------------------------------
// Material enum (all 25+ Roblox Enum.Material values)
// ---------------------------------------------------------------------------

export enum RobloxMaterial {
  // Structural
  SmoothPlastic   = 'SmoothPlastic',
  Plastic         = 'Plastic',
  Metal           = 'Metal',
  DiamondPlate    = 'DiamondPlate',
  Foil            = 'Foil',
  // Stone / masonry
  Cobblestone     = 'Cobblestone',
  Brick           = 'Brick',
  Granite         = 'Granite',
  Marble          = 'Marble',
  Limestone       = 'Limestone',
  Slate           = 'Slate',
  Concrete        = 'Concrete',
  Pebble          = 'Pebble',
  Basalt          = 'Basalt',
  Sandstone       = 'Sandstone',
  Rock            = 'Rock',
  Pavement        = 'Pavement',
  CrackedLava     = 'CrackedLava',
  // Wood
  Wood            = 'Wood',
  WoodPlanks      = 'WoodPlanks',
  // Organic
  Grass           = 'Grass',
  LeafyGrass      = 'LeafyGrass',
  Ground          = 'Ground',
  Mud             = 'Mud',
  Sand            = 'Sand',
  Snow            = 'Snow',
  Ice             = 'Ice',
  Glacier         = 'Glacier',
  Salt            = 'Salt',
  // Special
  Glass           = 'Glass',
  Neon            = 'Neon',
  ForceField      = 'ForceField',
  Air             = 'Air',
  Water           = 'Water',
}

// ---------------------------------------------------------------------------
// Color3 RGB helper — matches Luau Color3.fromRGB()
// ---------------------------------------------------------------------------

export interface RGB { r: number; g: number; b: number }

/** Returns normalised 0-1 Color3 values (Roblox JSON format) */
function rgb(r: number, g: number, b: number): RGB {
  return { r: r / 255, g: g / 255, b: b / 255 }
}

/** Full RGB tuple for direct use in Luau script generation */
export type MaterialColor = { rgb: RGB; hex: string; luau: string }

function color(r: number, g: number, b: number): MaterialColor {
  const hex = `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`
  return {
    rgb: rgb(r, g, b),
    hex,
    luau: `Color3.fromRGB(${r}, ${g}, ${b})`,
  }
}

// ---------------------------------------------------------------------------
// Per-material recommended colors
// ---------------------------------------------------------------------------

export const MATERIAL_COLORS: Record<RobloxMaterial, MaterialColor> = {
  // Structural
  [RobloxMaterial.SmoothPlastic]:  color(245, 240, 235),  // clean off-white
  [RobloxMaterial.Plastic]:        color(200, 200, 200),  // neutral light grey
  [RobloxMaterial.Metal]:          color(130, 130, 130),  // industrial grey
  [RobloxMaterial.DiamondPlate]:   color(160, 160, 165),  // brushed steel
  [RobloxMaterial.Foil]:           color(200, 195, 180),  // warm metallic

  // Stone / masonry
  [RobloxMaterial.Cobblestone]:    color(140, 135, 130),  // weathered cobble
  [RobloxMaterial.Brick]:          color(138,  96,  68),  // warm brick red-brown
  [RobloxMaterial.Granite]:        color(100,  95,  98),  // dark speckled granite
  [RobloxMaterial.Marble]:         color(230, 225, 220),  // warm white marble
  [RobloxMaterial.Limestone]:      color(210, 200, 185),  // warm cream limestone
  [RobloxMaterial.Slate]:          color( 80,  78,  82),  // dark charcoal slate
  [RobloxMaterial.Concrete]:       color(175, 175, 175),  // neutral grey concrete
  [RobloxMaterial.Pebble]:         color(148, 143, 136),  // sandy pebble
  [RobloxMaterial.Basalt]:         color( 55,  52,  55),  // volcanic dark basalt
  [RobloxMaterial.Sandstone]:      color(210, 175, 120),  // warm desert sandstone
  [RobloxMaterial.Rock]:           color(120, 115, 112),  // natural rock
  [RobloxMaterial.Pavement]:       color(160, 158, 155),  // urban pavement
  [RobloxMaterial.CrackedLava]:    color( 90,  20,   5),  // cooled dark lava

  // Wood
  [RobloxMaterial.Wood]:           color(139,  90,  43),  // natural wood brown
  [RobloxMaterial.WoodPlanks]:     color(168, 122,  70),  // lighter sawn planks

  // Organic / terrain
  [RobloxMaterial.Grass]:          color( 80, 150,  50),  // vibrant natural green
  [RobloxMaterial.LeafyGrass]:     color( 88, 155,  55),  // slightly warmer leaf green
  [RobloxMaterial.Ground]:         color(115,  90,  60),  // earthy brown ground
  [RobloxMaterial.Mud]:            color( 85,  65,  45),  // dark wet mud
  [RobloxMaterial.Sand]:           color(220, 195, 140),  // warm desert sand
  [RobloxMaterial.Snow]:           color(235, 240, 245),  // cold bright white snow
  [RobloxMaterial.Ice]:            color(180, 220, 240),  // cool ice blue
  [RobloxMaterial.Glacier]:        color(160, 210, 235),  // deep glacier blue
  [RobloxMaterial.Salt]:           color(240, 238, 230),  // off-white salt flat

  // Special
  [RobloxMaterial.Glass]:          color(180, 215, 245),  // sky blue glass
  [RobloxMaterial.Neon]:           color(255, 184,  28),  // ForjeGames gold glow
  [RobloxMaterial.ForceField]:     color( 80, 160, 255),  // electric blue forcefield
  [RobloxMaterial.Air]:            color(200, 220, 240),  // near-transparent sky
  [RobloxMaterial.Water]:          color( 50, 120, 180),  // deep ocean blue
}

// ---------------------------------------------------------------------------
// Theme palettes — ordered: primary → secondary → accent → ground
// ---------------------------------------------------------------------------

export type ThemeName = 'medieval' | 'modern' | 'fantasy' | 'nature' | 'scifi' | 'horror' | 'tropical' | 'arctic'

export interface ThemePalette {
  name: ThemeName
  displayName: string
  /** Ordered from most to least used */
  materials: RobloxMaterial[]
  /** Primary structural color override (optional — falls back to MATERIAL_COLORS) */
  primaryColor?: MaterialColor
  /** Ambient light tint for this theme */
  ambientTint: RGB
  keywords: string[]
}

export const THEME_PALETTES: Record<ThemeName, ThemePalette> = {
  medieval: {
    name: 'medieval',
    displayName: 'Medieval',
    materials: [
      RobloxMaterial.Cobblestone,
      RobloxMaterial.Brick,
      RobloxMaterial.Wood,
      RobloxMaterial.WoodPlanks,
      RobloxMaterial.Slate,
      RobloxMaterial.Metal,
      RobloxMaterial.Ground,
    ],
    ambientTint: rgb(210, 195, 170),
    keywords: ['medieval', 'castle', 'knight', 'dungeon', 'village', 'tavern', 'fortress', 'tower', 'kingdom', 'blacksmith', 'chapel', 'moat'],
  },

  modern: {
    name: 'modern',
    displayName: 'Modern',
    materials: [
      RobloxMaterial.Concrete,
      RobloxMaterial.SmoothPlastic,
      RobloxMaterial.Metal,
      RobloxMaterial.Glass,
      RobloxMaterial.Pavement,
      RobloxMaterial.DiamondPlate,
    ],
    primaryColor: color(200, 205, 210),
    ambientTint: rgb(220, 225, 235),
    keywords: ['modern', 'city', 'urban', 'office', 'apartment', 'skyscraper', 'mall', 'downtown', 'contemporary', 'industrial'],
  },

  fantasy: {
    name: 'fantasy',
    displayName: 'Fantasy',
    materials: [
      RobloxMaterial.Marble,
      RobloxMaterial.Neon,
      RobloxMaterial.SmoothPlastic,
      RobloxMaterial.Limestone,
      RobloxMaterial.Granite,
      RobloxMaterial.ForceField,
      RobloxMaterial.Glass,
    ],
    primaryColor: color(200, 180, 230),
    ambientTint: rgb(180, 160, 220),
    keywords: ['fantasy', 'magic', 'wizard', 'enchanted', 'crystal', 'mystical', 'fairy', 'arcane', 'spellcaster', 'elven', 'magical'],
  },

  nature: {
    name: 'nature',
    displayName: 'Nature',
    materials: [
      RobloxMaterial.Grass,
      RobloxMaterial.LeafyGrass,
      RobloxMaterial.Ground,
      RobloxMaterial.Sand,
      RobloxMaterial.Rock,
      RobloxMaterial.Mud,
      RobloxMaterial.Wood,
      RobloxMaterial.Water,
    ],
    ambientTint: rgb(185, 215, 175),
    keywords: ['nature', 'forest', 'jungle', 'park', 'garden', 'wilderness', 'outdoor', 'cave', 'river', 'beach', 'meadow', 'swamp'],
  },

  scifi: {
    name: 'scifi',
    displayName: 'Sci-Fi',
    materials: [
      RobloxMaterial.Metal,
      RobloxMaterial.Neon,
      RobloxMaterial.SmoothPlastic,
      RobloxMaterial.ForceField,
      RobloxMaterial.DiamondPlate,
      RobloxMaterial.Glass,
    ],
    primaryColor: color(60, 70, 90),
    ambientTint: rgb(140, 170, 220),
    keywords: ['scifi', 'sci-fi', 'space', 'futuristic', 'alien', 'robot', 'spaceship', 'station', 'cyber', 'technology', 'laser', 'hologram'],
  },

  horror: {
    name: 'horror',
    displayName: 'Horror',
    materials: [
      RobloxMaterial.Slate,
      RobloxMaterial.Basalt,
      RobloxMaterial.WoodPlanks,
      RobloxMaterial.Cobblestone,
      RobloxMaterial.CrackedLava,
      RobloxMaterial.Concrete,
    ],
    primaryColor: color(45, 40, 42),
    ambientTint: rgb(90, 80, 100),
    keywords: ['horror', 'haunted', 'scary', 'dark', 'creepy', 'zombie', 'undead', 'graveyard', 'cemetery', 'mansion', 'cursed'],
  },

  tropical: {
    name: 'tropical',
    displayName: 'Tropical',
    materials: [
      RobloxMaterial.Sand,
      RobloxMaterial.Grass,
      RobloxMaterial.WoodPlanks,
      RobloxMaterial.Water,
      RobloxMaterial.Rock,
      RobloxMaterial.LeafyGrass,
    ],
    primaryColor: color(240, 210, 150),
    ambientTint: rgb(240, 220, 185),
    keywords: ['tropical', 'beach', 'island', 'resort', 'tiki', 'paradise', 'lagoon', 'coast', 'palm', 'pier', 'harbor'],
  },

  arctic: {
    name: 'arctic',
    displayName: 'Arctic',
    materials: [
      RobloxMaterial.Snow,
      RobloxMaterial.Ice,
      RobloxMaterial.Glacier,
      RobloxMaterial.Rock,
      RobloxMaterial.Slate,
      RobloxMaterial.SmoothPlastic,
    ],
    primaryColor: color(220, 235, 245),
    ambientTint: rgb(195, 220, 245),
    keywords: ['arctic', 'ice', 'snow', 'frozen', 'tundra', 'winter', 'glacier', 'polar', 'blizzard', 'cold', 'frost'],
  },
}

// ---------------------------------------------------------------------------
// Theme detector — parse prompt text into a ThemeName
// ---------------------------------------------------------------------------

/** Returns the best-matching theme for a given prompt string, defaulting to 'medieval' */
export function detectTheme(prompt: string): ThemeName {
  const lower = prompt.toLowerCase()
  let best: ThemeName = 'medieval'
  let bestScore = 0

  for (const palette of Object.values(THEME_PALETTES)) {
    const score = palette.keywords.filter(kw => lower.includes(kw)).length
    if (score > bestScore) {
      bestScore = score
      best = palette.name
    }
  }
  return best
}

// ---------------------------------------------------------------------------
// Material color lookup helpers
// ---------------------------------------------------------------------------

/** Get Color3 (normalised 0-1) for a material, with optional per-theme override */
export function getMaterialColor(material: RobloxMaterial, theme?: ThemeName): MaterialColor {
  if (theme) {
    const palette = THEME_PALETTES[theme]
    // Return theme primary color for first material in palette
    if (palette.primaryColor && palette.materials[0] === material) {
      return palette.primaryColor
    }
  }
  return MATERIAL_COLORS[material] ?? MATERIAL_COLORS[RobloxMaterial.Concrete]
}

/** Build a Luau Color3.fromRGB() string for a material */
export function materialColorLuau(material: RobloxMaterial, theme?: ThemeName): string {
  return getMaterialColor(material, theme).luau
}

/** Get the primary material for a theme */
export function getThemePrimaryMaterial(theme: ThemeName): RobloxMaterial {
  return THEME_PALETTES[theme].materials[0]
}

/** Get ordered material list for a theme */
export function getThemeMaterials(theme: ThemeName): RobloxMaterial[] {
  return THEME_PALETTES[theme].materials
}

// ---------------------------------------------------------------------------
// Luau snippet generator — generates the Color3/Material block for a part
// ---------------------------------------------------------------------------

export interface PartColorSpec {
  material: RobloxMaterial
  theme?: ThemeName
  transparencyOverride?: number
}

export function buildPartColorLuau(varName: string, spec: PartColorSpec): string {
  const col = getMaterialColor(spec.material, spec.theme)
  const lines: string[] = [
    `${varName}.Material = Enum.Material.${spec.material}`,
    `${varName}.Color = ${col.luau}`,
  ]
  if (spec.transparencyOverride !== undefined) {
    lines.push(`${varName}.Transparency = ${spec.transparencyOverride}`)
  }
  return lines.join('\n')
}
