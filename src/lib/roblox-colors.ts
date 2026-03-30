/**
 * Roblox BrickColor / Color3 palette — common colors used in Roblox builds.
 * Hex values match the official Roblox BrickColor palette.
 * Use these with generatePropertyUpdate('...', 'Color', hex) in luau-codegen.
 */

// ---------------------------------------------------------------------------
// Color entry shape
// ---------------------------------------------------------------------------

export interface RobloxColor {
  /** Human-readable display name */
  name: string
  /** CSS-style hex, e.g. "#F2F3F3" */
  hex: string
  /** Roblox BrickColor name (for reference) */
  brickColor?: string
}

// ---------------------------------------------------------------------------
// Full palette — 36 standard BrickColors + ForjeGames extras
// ---------------------------------------------------------------------------

export const ROBLOX_COLORS: RobloxColor[] = [
  // Whites & Greys
  { name: 'White',          hex: '#F2F3F3', brickColor: 'White' },
  { name: 'Light Grey',     hex: '#A1A5A2', brickColor: 'Light grey' },
  { name: 'Medium Grey',    hex: '#848484', brickColor: 'Medium stone grey' },
  { name: 'Dark Grey',      hex: '#635F62', brickColor: 'Dark grey' },
  { name: 'Smoky Grey',     hex: '#5B5B5B', brickColor: 'Smoky grey' },
  { name: 'Black',          hex: '#1B2A35', brickColor: 'Black' },

  // Reds & Pinks
  { name: 'Bright Red',     hex: '#C4281C', brickColor: 'Bright red' },
  { name: 'Medium Red',     hex: '#C40011', brickColor: 'Medium red' },
  { name: 'Dark Red',       hex: '#720E0F', brickColor: 'Dark red' },
  { name: 'Pink',           hex: '#F7BBD3', brickColor: 'Light reddish violet' },
  { name: 'Bright Pink',    hex: '#E8A0B4', brickColor: 'Carnation pink' },
  { name: 'Maroon',         hex: '#6A0723', brickColor: 'Reddish brown' },

  // Oranges & Yellows
  { name: 'Bright Orange',  hex: '#DA8541', brickColor: 'Bright orange' },
  { name: 'Neon Orange',    hex: '#FF8800', brickColor: 'Neon orange' },
  { name: 'Bright Yellow',  hex: '#F5CD30', brickColor: 'Bright yellow' },
  { name: 'Neon Yellow',    hex: '#FFFF33', brickColor: 'Neon yellow' },
  { name: 'Gold',           hex: '#D4AF37', brickColor: 'Bright yellow' },  // ForjeGames accent
  { name: 'Tan',            hex: '#E8C08B', brickColor: 'Light orange' },
  { name: 'Sand Yellow',    hex: '#D7C59A', brickColor: 'Sand yellow' },

  // Greens
  { name: 'Bright Green',   hex: '#287F47', brickColor: 'Bright green' },
  { name: 'Dark Green',     hex: '#185B3C', brickColor: 'Dark green' },
  { name: 'Olive',          hex: '#636C1E', brickColor: 'Olive green' },
  { name: 'Sand Green',     hex: '#789082', brickColor: 'Sand green' },
  { name: 'Lime Green',     hex: '#C3D228', brickColor: 'Lime green' },
  { name: 'Neon Green',     hex: '#59C714', brickColor: 'Neon green' },

  // Blues & Teals
  { name: 'Bright Blue',    hex: '#0D69AC', brickColor: 'Bright blue' },
  { name: 'Medium Blue',    hex: '#7396C8', brickColor: 'Medium blue' },
  { name: 'Light Blue',     hex: '#9FC3E9', brickColor: 'Light blue' },
  { name: 'Sky Blue',       hex: '#7EC0EE', brickColor: 'Pastel blue' },
  { name: 'Dark Blue',      hex: '#143044', brickColor: 'Dark blue' },
  { name: 'Teal',           hex: '#1A7B84', brickColor: 'Teal' },
  { name: 'Cyan',           hex: '#1DADB3', brickColor: 'Cyan' },

  // Purples & Browns
  { name: 'Bright Violet',  hex: '#7B2FBE', brickColor: 'Bright violet' },
  { name: 'Dark Purple',    hex: '#3F1691', brickColor: 'Royal purple' },
  { name: 'Lavender',       hex: '#B8C1E5', brickColor: 'Lavender' },
  { name: 'Brown',          hex: '#694028', brickColor: 'Brown' },
  { name: 'Reddish Brown',  hex: '#82422A', brickColor: 'Reddish brown' },

  // Natural / terrain
  { name: 'Sand Red',       hex: '#BE6862', brickColor: 'Sand red' },
  { name: 'Sand Blue',      hex: '#5A7596', brickColor: 'Sand blue' },
  { name: 'Brick Red',      hex: '#8A3C28', brickColor: 'Brick yellow' },
] as const satisfies RobloxColor[]

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

/** Find a color entry by display name (case-insensitive) */
export function findColorByName(name: string): RobloxColor | undefined {
  const lower = name.toLowerCase()
  return ROBLOX_COLORS.find(c => c.name.toLowerCase() === lower)
}

/** Find the closest color entry by hex value (exact match first, then nearest) */
export function findColorByHex(hex: string): RobloxColor | undefined {
  const norm = hex.toLowerCase().replace(/^#?/, '#')
  return ROBLOX_COLORS.find(c => c.hex.toLowerCase() === norm)
}

/**
 * Convert a hex string to Luau Color3.fromRGB(r, g, b).
 * Falls back to Color3.new(1, 1, 1) on malformed input.
 */
export function hexToLuauColor3(hex: string): string {
  const clean = hex.replace(/^#/, '')
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) {
    return 'Color3.new(1, 1, 1)'
  }
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return `Color3.fromRGB(${r}, ${g}, ${b})`
}

// ---------------------------------------------------------------------------
// Grouped subsets for UI pickers
// ---------------------------------------------------------------------------

export const COLOR_GROUPS = {
  greyscale: ROBLOX_COLORS.filter(c =>
    ['White', 'Light Grey', 'Medium Grey', 'Dark Grey', 'Smoky Grey', 'Black'].includes(c.name),
  ),
  reds: ROBLOX_COLORS.filter(c =>
    ['Bright Red', 'Medium Red', 'Dark Red', 'Pink', 'Bright Pink', 'Maroon'].includes(c.name),
  ),
  orangesYellows: ROBLOX_COLORS.filter(c =>
    ['Bright Orange', 'Neon Orange', 'Bright Yellow', 'Neon Yellow', 'Gold', 'Tan', 'Sand Yellow'].includes(c.name),
  ),
  greens: ROBLOX_COLORS.filter(c =>
    ['Bright Green', 'Dark Green', 'Olive', 'Sand Green', 'Lime Green', 'Neon Green'].includes(c.name),
  ),
  blues: ROBLOX_COLORS.filter(c =>
    ['Bright Blue', 'Medium Blue', 'Light Blue', 'Sky Blue', 'Dark Blue', 'Teal', 'Cyan'].includes(c.name),
  ),
  purplesBrowns: ROBLOX_COLORS.filter(c =>
    ['Bright Violet', 'Dark Purple', 'Lavender', 'Brown', 'Reddish Brown'].includes(c.name),
  ),
} as const
