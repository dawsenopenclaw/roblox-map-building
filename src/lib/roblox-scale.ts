/**
 * Roblox Scale System — canonical stud measurements for realistic builds.
 * 1 stud ≈ 0.28 m (Roblox standard).
 * Character height: ~5 studs (HumanoidRootPart to head top).
 */

// ---------------------------------------------------------------------------
// Base constants
// ---------------------------------------------------------------------------

/** Character reference heights (studs) */
export const CHARACTER = {
  HEIGHT:        5,    // head top to floor
  EYE_LEVEL:     4.2,  // camera eye height
  SHOULDER:      3.8,  // shoulder height
  HIP:           2.5,  // hip height
  FOOT_RADIUS:   0.6,  // half-width of character
} as const

/** Structural thickness / clearance */
export const WALL = {
  THIN:          0.5,  // partition wall
  STANDARD:      1,    // interior wall
  THICK:         2,    // exterior wall
  CASTLE:        4,    // castle curtain wall
  TOWER:         5,    // castle tower wall
} as const

/** Door dimensions */
export const DOOR = {
  WIDTH:         4,    // stud width (fits 2 characters side-by-side)
  HEIGHT:        7,    // stud height (1.4× character)
  DOUBLE_WIDTH:  8,    // grand double door
  ARCH_HEIGHT:   9,    // arched doorway
} as const

/** Window dimensions */
export const WINDOW = {
  SMALL:         2,    // small residential
  STANDARD:      3,    // standard window (width & height)
  TALL:          5,    // tall gothic window
  WIDE:          6,    // wide picture window
  SILL_HEIGHT:   3,    // height from floor to window sill
  HEADER_GAP:    1,    // gap from window top to ceiling
} as const

/** Floor / ceiling / stair dimensions */
export const FLOOR = {
  SLAB_THICKNESS:   1,   // floor slab
  CEILING_THICKNESS: 1,  // ceiling slab
  STORY_HEIGHT:     12,  // floor-to-floor height (2.4× character)
  GROUND_FLOOR:     12,
  STAIR_RISE:       1,   // each step rise
  STAIR_RUN:        2,   // each step run depth
  STAIR_WIDTH:      4,   // standard staircase width
} as const

/** Roof dimensions */
export const ROOF = {
  PITCH_HEIGHT:     6,   // apex above wall top for standard house
  OVERHANG:         2,   // eave overhang past wall face
  THICKNESS:        1,   // roof slab
  PARAPET:          2,   // parapet / battlement height
  BATTLEMENT_GAP:   2,   // merlon gap width
  BATTLEMENT_WIDTH: 2,   // merlon width
} as const

/** Structural elements */
export const COLUMN = {
  SMALL_DIAMETER:   2,
  STANDARD_DIAMETER: 4,
  LARGE_DIAMETER:   6,
  SMALL_HEIGHT:    12,
  STANDARD_HEIGHT: 20,
  GRAND_HEIGHT:    30,
} as const

/** Exterior spaces */
export const EXTERIOR = {
  PATH_WIDTH:       6,   // pedestrian path
  ROAD_WIDTH:      16,   // two-lane road
  SIDEWALK_WIDTH:   4,
  PLAZA_TILE_SIZE:  8,
  MOAT_WIDTH:       8,
  MOAT_DEPTH:       4,
  BRIDGE_WIDTH:     8,
  DRAWBRIDGE_WIDTH: 8,
} as const

/** Furniture / interactive objects (approximate) */
export const FURNITURE = {
  TABLE_HEIGHT:     3,
  TABLE_WIDTH:      6,
  CHAIR_HEIGHT:     3,
  CHEST_SIZE:       3,   // cube side
  BED_LENGTH:       9,
  BED_WIDTH:        5,
  COUNTER_HEIGHT:   3.5,
  COUNTER_DEPTH:    3,
} as const

// ---------------------------------------------------------------------------
// Building templates — complete proportions for each structure type
// ---------------------------------------------------------------------------

export interface BuildingTemplate {
  name: string
  footprint: { width: number; depth: number }
  height: number
  stories: number
  wallThickness: number
  floorThickness: number
  doorWidth: number
  doorHeight: number
  windowWidth: number
  windowHeight: number
  windowSillHeight: number
  roofPitch: number
  notes: string
}

export const BUILDING_TEMPLATES: Record<string, BuildingTemplate> = {
  cottage: {
    name: 'Cottage',
    footprint: { width: 20, depth: 16 },
    height: 16,
    stories: 1,
    wallThickness: WALL.STANDARD,
    floorThickness: FLOOR.SLAB_THICKNESS,
    doorWidth: DOOR.WIDTH,
    doorHeight: DOOR.HEIGHT,
    windowWidth: WINDOW.STANDARD,
    windowHeight: WINDOW.STANDARD,
    windowSillHeight: WINDOW.SILL_HEIGHT,
    roofPitch: ROOF.PITCH_HEIGHT,
    notes: 'Small single-storey dwelling, cosy and compact',
  },

  house: {
    name: 'House',
    footprint: { width: 30, depth: 25 },
    height: 24,
    stories: 2,
    wallThickness: WALL.THICK,
    floorThickness: FLOOR.SLAB_THICKNESS,
    doorWidth: DOOR.WIDTH,
    doorHeight: DOOR.HEIGHT,
    windowWidth: WINDOW.STANDARD,
    windowHeight: WINDOW.STANDARD,
    windowSillHeight: WINDOW.SILL_HEIGHT,
    roofPitch: ROOF.PITCH_HEIGHT,
    notes: 'Standard two-storey residential house',
  },

  mansion: {
    name: 'Mansion',
    footprint: { width: 80, depth: 60 },
    height: 36,
    stories: 3,
    wallThickness: WALL.THICK,
    floorThickness: FLOOR.SLAB_THICKNESS,
    doorWidth: DOOR.DOUBLE_WIDTH,
    doorHeight: DOOR.ARCH_HEIGHT,
    windowWidth: WINDOW.WIDE,
    windowHeight: WINDOW.TALL,
    windowSillHeight: WINDOW.SILL_HEIGHT,
    roofPitch: ROOF.PITCH_HEIGHT + 4,
    notes: 'Grand three-storey mansion with wide double doors',
  },

  shop: {
    name: 'Shop',
    footprint: { width: 25, depth: 20 },
    height: 14,
    stories: 1,
    wallThickness: WALL.STANDARD,
    floorThickness: FLOOR.SLAB_THICKNESS,
    doorWidth: DOOR.WIDTH,
    doorHeight: DOOR.HEIGHT,
    windowWidth: WINDOW.WIDE,
    windowHeight: WINDOW.TALL,
    windowSillHeight: 1,
    roofPitch: 2,
    notes: 'Retail shop with wide display windows',
  },

  tower: {
    name: 'Tower',
    footprint: { width: 12, depth: 12 },
    height: 60,
    stories: 5,
    wallThickness: WALL.TOWER,
    floorThickness: FLOOR.SLAB_THICKNESS,
    doorWidth: DOOR.WIDTH,
    doorHeight: DOOR.HEIGHT,
    windowWidth: WINDOW.SMALL,
    windowHeight: WINDOW.TALL,
    windowSillHeight: 2,
    roofPitch: 8,
    notes: 'Tall narrow tower, circular or square base',
  },

  castle: {
    name: 'Castle',
    footprint: { width: 120, depth: 120 },
    height: 80,
    stories: 4,
    wallThickness: WALL.CASTLE,
    floorThickness: FLOOR.SLAB_THICKNESS,
    doorWidth: DOOR.DOUBLE_WIDTH,
    doorHeight: DOOR.ARCH_HEIGHT,
    windowWidth: WINDOW.SMALL,
    windowHeight: WINDOW.TALL,
    windowSillHeight: 4,
    roofPitch: 0,  // flat battlemented roof
    notes: 'Grand fortified castle with 4 corner towers and gatehouse',
  },

  tavern: {
    name: 'Tavern',
    footprint: { width: 35, depth: 28 },
    height: 24,
    stories: 2,
    wallThickness: WALL.STANDARD,
    floorThickness: FLOOR.SLAB_THICKNESS,
    doorWidth: DOOR.WIDTH,
    doorHeight: DOOR.HEIGHT,
    windowWidth: WINDOW.STANDARD,
    windowHeight: WINDOW.STANDARD,
    windowSillHeight: WINDOW.SILL_HEIGHT,
    roofPitch: ROOF.PITCH_HEIGHT,
    notes: 'Medieval tavern with inn rooms above the ground-floor bar',
  },

  temple: {
    name: 'Temple',
    footprint: { width: 60, depth: 40 },
    height: 40,
    stories: 1,
    wallThickness: WALL.THICK,
    floorThickness: 2,
    doorWidth: DOOR.DOUBLE_WIDTH,
    doorHeight: DOOR.ARCH_HEIGHT,
    windowWidth: WINDOW.STANDARD,
    windowHeight: WINDOW.TALL,
    windowSillHeight: 5,
    roofPitch: 6,
    notes: 'Ancient temple with grand columns across the facade',
  },

  skyscraper: {
    name: 'Skyscraper',
    footprint: { width: 30, depth: 30 },
    height: 200,
    stories: 16,
    wallThickness: WALL.STANDARD,
    floorThickness: FLOOR.SLAB_THICKNESS,
    doorWidth: DOOR.DOUBLE_WIDTH,
    doorHeight: DOOR.HEIGHT + 2,
    windowWidth: WINDOW.STANDARD,
    windowHeight: FLOOR.STORY_HEIGHT - 2,
    windowSillHeight: 1,
    roofPitch: 0,
    notes: 'Modern glass-and-steel high-rise with grid windows',
  },

  arena: {
    name: 'Arena',
    footprint: { width: 200, depth: 200 },
    height: 50,
    stories: 4,
    wallThickness: WALL.CASTLE,
    floorThickness: 2,
    doorWidth: DOOR.DOUBLE_WIDTH,
    doorHeight: DOOR.ARCH_HEIGHT,
    windowWidth: 0,
    windowHeight: 0,
    windowSillHeight: 0,
    roofPitch: 0,
    notes: 'Circular gladiatorial arena with tiered seating',
  },
}

// ---------------------------------------------------------------------------
// Helper utilities
// ---------------------------------------------------------------------------

/** Calculate number of stairs needed to climb a height */
export function stairCount(heightStuds: number): number {
  return Math.ceil(heightStuds / FLOOR.STAIR_RISE)
}

/** Calculate total stair run length for a given height */
export function stairLength(heightStuds: number): number {
  return stairCount(heightStuds) * FLOOR.STAIR_RUN
}

/** Returns the Y position of the floor at a given story (0-indexed) */
export function storyFloorY(story: number, baseY = 0): number {
  return baseY + story * FLOOR.STORY_HEIGHT
}

/** Returns the Y center of a door on a given story */
export function doorCenterY(story: number, baseY = 0): number {
  return storyFloorY(story, baseY) + DOOR.HEIGHT / 2
}

/** Returns the Y center of a window on a given story */
export function windowCenterY(story: number, windowHeight = WINDOW.STANDARD, baseY = 0): number {
  return storyFloorY(story, baseY) + WINDOW.SILL_HEIGHT + windowHeight / 2
}

/** Clamp a stud value to a minimum character-readable size */
export function clampToHumanScale(studs: number, min = CHARACTER.HEIGHT): number {
  return Math.max(studs, min)
}

/** Get a template by name, falling back to 'house' */
export function getBuildingTemplate(typeName: string): BuildingTemplate {
  const key = typeName.toLowerCase()
  return BUILDING_TEMPLATES[key] ?? BUILDING_TEMPLATES.house
}
