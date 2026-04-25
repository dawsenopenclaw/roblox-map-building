/**
 * MegaBuilder — Multi-pass layered build system for complex structures
 *
 * Instead of generating 500 lines of code in one shot (which fails),
 * builds are constructed in 6 sequential passes:
 *
 *   Pass 1: BLUEPRINT  — Room layout, dimensions, floor plan
 *   Pass 2: STRUCTURE  — Walls, floors, roofs, foundations
 *   Pass 3: OPENINGS   — Doors, windows, arches, gates
 *   Pass 4: FURNITURE  — Room-appropriate furniture placement
 *   Pass 5: LIGHTING   — PointLights, lanterns, ambient effects
 *   Pass 6: DETAILS    — Props, decorations, landscaping, final polish
 *
 * Each pass gets the output of all previous passes as context.
 * Parts accumulate across passes → 200-500+ part builds.
 */

import 'server-only'

// ─── Types ───────────────────────────────────────────────────────────────────
export interface BuildPart {
  name: string
  size: [number, number, number]
  position: [number, number, number]
  rotation: [number, number, number]
  material: string
  color: [number, number, number]
  transparency?: number
  shape?: 'Block' | 'Wedge' | 'Cylinder' | 'Ball' | 'CornerWedge'
  children?: BuildChild[]
}

export interface BuildChild {
  className: string
  name?: string
  properties?: Record<string, unknown>
}

export interface BuildBlueprint {
  name: string
  category: string
  style: string
  totalSize: [number, number, number] // overall bounding box
  rooms: RoomDef[]
  exteriorFeatures: string[]
  mood: string
  colorPalette: Record<string, [number, number, number]>
  materialPalette: Record<string, string>
}

export interface RoomDef {
  name: string
  type: string // living, kitchen, bedroom, hallway, tower, courtyard, etc.
  position: [number, number, number] // corner position
  size: [number, number, number] // room dimensions
  floor: number // floor level (0 = ground)
  features: string[] // what goes in this room
  wallMaterial: string
  floorMaterial: string
}

export interface MegaBuildResult {
  parts: BuildPart[]
  luauCode: string
  partCount: number
  passResults: PassResult[]
  blueprint: BuildBlueprint
}

interface PassResult {
  pass: string
  partsAdded: number
  totalParts: number
  duration: number
}

// ─── Procedural Generators ───────────────────────────────────────────────────
// These generate parts mathematically — no AI needed, perfect every time

export function generateWall(
  startX: number, startZ: number,
  endX: number, endZ: number,
  baseY: number, height: number,
  thickness: number,
  material: string, color: [number, number, number],
  namePrefix: string,
): BuildPart[] {
  const parts: BuildPart[] = []
  const dx = endX - startX
  const dz = endZ - startZ
  const length = Math.sqrt(dx * dx + dz * dz)
  const angle = Math.atan2(dx, dz) * (180 / Math.PI)
  const midX = (startX + endX) / 2
  const midZ = (startZ + endZ) / 2

  parts.push({
    name: `${namePrefix}_main`,
    size: [length, height, thickness],
    position: [midX, baseY + height / 2, midZ],
    rotation: [0, angle, 0],
    material, color,
  })

  return parts
}

export function generateFloor(
  x: number, z: number,
  width: number, depth: number,
  y: number, thickness: number,
  material: string, color: [number, number, number],
  name: string,
): BuildPart {
  return {
    name,
    size: [width, thickness, depth],
    position: [x, y + thickness / 2, z],
    rotation: [0, 0, 0],
    material, color,
  }
}

export function generateBox(
  x: number, y: number, z: number,
  width: number, height: number, depth: number,
  wallThickness: number,
  wallMaterial: string, wallColor: [number, number, number],
  floorMaterial: string, floorColor: [number, number, number],
  namePrefix: string,
): BuildPart[] {
  const parts: BuildPart[] = []
  const hw = width / 2
  const hd = depth / 2
  const baseY = y

  // Floor
  parts.push(generateFloor(x, z, width, depth, baseY, 1, floorMaterial, floorColor, `${namePrefix}_floor`))

  // 4 walls
  // Front wall (positive Z)
  parts.push({
    name: `${namePrefix}_wall_front`,
    size: [width, height, wallThickness],
    position: [x, baseY + 1 + height / 2, z + hd],
    rotation: [0, 0, 0],
    material: wallMaterial, color: wallColor,
  })
  // Back wall
  parts.push({
    name: `${namePrefix}_wall_back`,
    size: [width, height, wallThickness],
    position: [x, baseY + 1 + height / 2, z - hd],
    rotation: [0, 0, 0],
    material: wallMaterial, color: wallColor,
  })
  // Left wall
  parts.push({
    name: `${namePrefix}_wall_left`,
    size: [wallThickness, height, depth],
    position: [x - hw, baseY + 1 + height / 2, z],
    rotation: [0, 0, 0],
    material: wallMaterial, color: wallColor,
  })
  // Right wall
  parts.push({
    name: `${namePrefix}_wall_right`,
    size: [wallThickness, height, depth],
    position: [x + hw, baseY + 1 + height / 2, z],
    rotation: [0, 0, 0],
    material: wallMaterial, color: wallColor,
  })

  return parts
}

export function generateRoof(
  x: number, z: number,
  width: number, depth: number,
  baseY: number,
  roofHeight: number,
  material: string, color: [number, number, number],
  namePrefix: string,
  overhang: number = 2,
): BuildPart[] {
  const parts: BuildPart[] = []

  // Two sloped sides using WedgeParts
  parts.push({
    name: `${namePrefix}_roof_left`,
    size: [width + overhang * 2, roofHeight, depth / 2 + overhang],
    position: [x, baseY + roofHeight / 2, z - depth / 4],
    rotation: [0, 0, 0],
    material, color,
    shape: 'Wedge',
  })
  parts.push({
    name: `${namePrefix}_roof_right`,
    size: [width + overhang * 2, roofHeight, depth / 2 + overhang],
    position: [x, baseY + roofHeight / 2, z + depth / 4],
    rotation: [0, 180, 0],
    material, color,
    shape: 'Wedge',
  })

  // Ridge beam
  parts.push({
    name: `${namePrefix}_ridge`,
    size: [width + overhang * 2, 0.5, 0.5],
    position: [x, baseY + roofHeight, z],
    rotation: [0, 0, 0],
    material: 'Wood',
    color: [100, 70, 40],
  })

  return parts
}

export function generateWindow(
  wallX: number, wallZ: number,
  windowY: number,
  windowWidth: number, windowHeight: number,
  facing: 'north' | 'south' | 'east' | 'west',
  namePrefix: string,
): BuildPart[] {
  const parts: BuildPart[] = []
  const rotY = facing === 'north' ? 0 : facing === 'south' ? 180 : facing === 'east' ? 90 : 270
  const offset = 0.3

  // Glass pane
  parts.push({
    name: `${namePrefix}_glass`,
    size: [windowWidth, windowHeight, 0.15],
    position: [wallX, windowY, wallZ],
    rotation: [0, rotY, 0],
    material: 'Glass',
    color: [200, 220, 255],
    transparency: 0.4,
  })

  // Frame — top
  parts.push({
    name: `${namePrefix}_frame_top`,
    size: [windowWidth + 0.4, 0.3, 0.3],
    position: [wallX, windowY + windowHeight / 2 + 0.15, wallZ],
    rotation: [0, rotY, 0],
    material: 'Wood',
    color: [120, 80, 40],
  })

  // Frame — bottom (sill)
  parts.push({
    name: `${namePrefix}_frame_sill`,
    size: [windowWidth + 0.6, 0.25, 0.5],
    position: [wallX, windowY - windowHeight / 2 - 0.12, wallZ],
    rotation: [0, rotY, 0],
    material: 'Wood',
    color: [120, 80, 40],
  })

  // Frame — left
  parts.push({
    name: `${namePrefix}_frame_left`,
    size: [0.25, windowHeight + 0.3, 0.25],
    position: [
      wallX + (facing === 'north' || facing === 'south' ? -windowWidth / 2 - 0.12 : 0),
      windowY,
      wallZ + (facing === 'east' || facing === 'west' ? -windowWidth / 2 - 0.12 : 0),
    ],
    rotation: [0, rotY, 0],
    material: 'Wood',
    color: [120, 80, 40],
  })

  // Frame — right
  parts.push({
    name: `${namePrefix}_frame_right`,
    size: [0.25, windowHeight + 0.3, 0.25],
    position: [
      wallX + (facing === 'north' || facing === 'south' ? windowWidth / 2 + 0.12 : 0),
      windowY,
      wallZ + (facing === 'east' || facing === 'west' ? windowWidth / 2 + 0.12 : 0),
    ],
    rotation: [0, rotY, 0],
    material: 'Wood',
    color: [120, 80, 40],
  })

  return parts
}

export function generateDoor(
  x: number, z: number, baseY: number,
  width: number, height: number,
  facing: 'north' | 'south' | 'east' | 'west',
  namePrefix: string,
  doorColor: [number, number, number] = [139, 90, 43],
): BuildPart[] {
  const parts: BuildPart[] = []
  const rotY = facing === 'north' ? 0 : facing === 'south' ? 180 : facing === 'east' ? 90 : 270

  // Door panel
  parts.push({
    name: `${namePrefix}_panel`,
    size: [width, height, 0.3],
    position: [x, baseY + height / 2, z],
    rotation: [0, rotY, 0],
    material: 'Wood',
    color: doorColor,
  })

  // Frame
  parts.push({
    name: `${namePrefix}_frame_top`,
    size: [width + 0.5, 0.4, 0.4],
    position: [x, baseY + height + 0.2, z],
    rotation: [0, rotY, 0],
    material: 'Wood',
    color: [90, 60, 30],
  })

  // Doorknob
  parts.push({
    name: `${namePrefix}_knob`,
    size: [0.3, 0.3, 0.3],
    position: [
      x + (facing === 'north' || facing === 'south' ? width / 2 - 0.5 : 0.15),
      baseY + height * 0.45,
      z + (facing === 'east' || facing === 'west' ? width / 2 - 0.5 : 0.15),
    ],
    rotation: [0, 0, 0],
    material: 'Metal',
    color: [212, 175, 55],
    shape: 'Ball',
  })

  return parts
}

export function generateStairs(
  startX: number, startY: number, startZ: number,
  width: number, stepCount: number,
  direction: 'north' | 'south' | 'east' | 'west',
  material: string, color: [number, number, number],
  namePrefix: string,
): BuildPart[] {
  const parts: BuildPart[] = []
  const stepHeight = 0.8
  const stepDepth = 1.2

  for (let i = 0; i < stepCount; i++) {
    const dz = direction === 'north' ? -i * stepDepth : direction === 'south' ? i * stepDepth : 0
    const dx = direction === 'east' ? i * stepDepth : direction === 'west' ? -i * stepDepth : 0

    parts.push({
      name: `${namePrefix}_step_${i}`,
      size: [width, stepHeight, stepDepth],
      position: [startX + dx, startY + i * stepHeight + stepHeight / 2, startZ + dz],
      rotation: [0, 0, 0],
      material, color,
    })
  }

  return parts
}

// ─── Furniture Templates ─────────────────────────────────────────────────────
// Pre-built furniture with correct relative coordinates

export function generateChair(x: number, y: number, z: number, rotY: number = 0): BuildPart[] {
  return [
    { name: 'chair_seat', size: [2, 0.3, 2], position: [x, y + 2.2, z], rotation: [0, rotY, 0], material: 'Wood', color: [139, 90, 43] },
    { name: 'chair_back', size: [2, 2.5, 0.3], position: [x, y + 3.5, z - 0.85], rotation: [0, rotY, 0], material: 'Wood', color: [139, 90, 43] },
    { name: 'chair_leg_fl', size: [0.25, 2, 0.25], position: [x - 0.75, y + 1, z + 0.75], rotation: [0, rotY, 0], material: 'Wood', color: [120, 75, 35] },
    { name: 'chair_leg_fr', size: [0.25, 2, 0.25], position: [x + 0.75, y + 1, z + 0.75], rotation: [0, rotY, 0], material: 'Wood', color: [120, 75, 35] },
    { name: 'chair_leg_bl', size: [0.25, 2, 0.25], position: [x - 0.75, y + 1, z - 0.75], rotation: [0, rotY, 0], material: 'Wood', color: [120, 75, 35] },
    { name: 'chair_leg_br', size: [0.25, 2, 0.25], position: [x + 0.75, y + 1, z - 0.75], rotation: [0, rotY, 0], material: 'Wood', color: [120, 75, 35] },
  ]
}

export function generateTable(x: number, y: number, z: number, w: number = 5, d: number = 3): BuildPart[] {
  return [
    { name: 'table_top', size: [w, 0.3, d], position: [x, y + 3.3, z], rotation: [0, 0, 0], material: 'WoodPlanks', color: [170, 130, 80] },
    { name: 'table_leg_1', size: [0.3, 3, 0.3], position: [x - w / 2 + 0.4, y + 1.5, z - d / 2 + 0.4], rotation: [0, 0, 0], material: 'Wood', color: [140, 100, 60] },
    { name: 'table_leg_2', size: [0.3, 3, 0.3], position: [x + w / 2 - 0.4, y + 1.5, z - d / 2 + 0.4], rotation: [0, 0, 0], material: 'Wood', color: [140, 100, 60] },
    { name: 'table_leg_3', size: [0.3, 3, 0.3], position: [x - w / 2 + 0.4, y + 1.5, z + d / 2 - 0.4], rotation: [0, 0, 0], material: 'Wood', color: [140, 100, 60] },
    { name: 'table_leg_4', size: [0.3, 3, 0.3], position: [x + w / 2 - 0.4, y + 1.5, z + d / 2 - 0.4], rotation: [0, 0, 0], material: 'Wood', color: [140, 100, 60] },
  ]
}

export function generateBed(x: number, y: number, z: number): BuildPart[] {
  return [
    { name: 'bed_frame', size: [5, 0.5, 7], position: [x, y + 1.25, z], rotation: [0, 0, 0], material: 'Wood', color: [100, 65, 30] },
    { name: 'bed_mattress', size: [4.6, 1, 6.5], position: [x, y + 2, z], rotation: [0, 0, 0], material: 'Fabric', color: [240, 235, 220] },
    { name: 'bed_pillow_l', size: [2, 0.5, 1.2], position: [x - 1, y + 2.75, z - 2.5], rotation: [0, 0, 0], material: 'Fabric', color: [255, 250, 240] },
    { name: 'bed_pillow_r', size: [2, 0.5, 1.2], position: [x + 1, y + 2.75, z - 2.5], rotation: [0, 0, 0], material: 'Fabric', color: [255, 250, 240] },
    { name: 'bed_headboard', size: [5, 3, 0.5], position: [x, y + 3, z - 3.25], rotation: [0, 0, 0], material: 'Wood', color: [80, 50, 25] },
    { name: 'bed_blanket', size: [4.4, 0.3, 4], position: [x, y + 2.65, z + 0.5], rotation: [0, 0, 0], material: 'Fabric', color: [70, 90, 130] },
  ]
}

export function generateBookshelf(x: number, y: number, z: number, rotY: number = 0): BuildPart[] {
  const parts: BuildPart[] = [
    { name: 'shelf_frame', size: [4, 6, 1.2], position: [x, y + 3.5, z], rotation: [0, rotY, 0], material: 'Wood', color: [120, 80, 40] },
  ]
  // Add 4 shelves
  for (let i = 0; i < 4; i++) {
    parts.push({
      name: `shelf_${i}`, size: [3.8, 0.2, 1.1],
      position: [x, y + 1.5 + i * 1.4, z], rotation: [0, rotY, 0],
      material: 'WoodPlanks', color: [140, 95, 50],
    })
    // Books on each shelf
    const bookColors: [number, number, number][] = [[180, 40, 40], [40, 80, 160], [40, 140, 60], [180, 140, 40], [120, 40, 120]]
    for (let b = 0; b < 5; b++) {
      parts.push({
        name: `book_${i}_${b}`, size: [0.5, 1, 0.8],
        position: [x - 1.5 + b * 0.7, y + 2.1 + i * 1.4, z],
        rotation: [0, rotY, 0],
        material: 'SmoothPlastic', color: bookColors[b % bookColors.length],
      })
    }
  }
  return parts
}

export function generateFireplace(x: number, y: number, z: number): BuildPart[] {
  return [
    // Back wall
    { name: 'fp_back', size: [5, 5, 1], position: [x, y + 3, z - 0.5], rotation: [0, 0, 0], material: 'Brick', color: [120, 60, 40] },
    // Sides
    { name: 'fp_left', size: [1, 5, 2], position: [x - 2.5, y + 3, z + 0.5], rotation: [0, 0, 0], material: 'Brick', color: [130, 65, 42] },
    { name: 'fp_right', size: [1, 5, 2], position: [x + 2.5, y + 3, z + 0.5], rotation: [0, 0, 0], material: 'Brick', color: [130, 65, 42] },
    // Mantle
    { name: 'fp_mantle', size: [6, 0.5, 2.5], position: [x, y + 5.5, z + 0.25], rotation: [0, 0, 0], material: 'Marble', color: [220, 210, 200] },
    // Hearth
    { name: 'fp_hearth', size: [5.5, 0.3, 3], position: [x, y + 0.65, z + 1], rotation: [0, 0, 0], material: 'Cobblestone', color: [100, 95, 85] },
    // Fire (Neon glow)
    { name: 'fp_fire', size: [2, 1.5, 0.5], position: [x, y + 1.5, z], rotation: [0, 0, 0], material: 'Neon', color: [255, 120, 20], children: [
      { className: 'PointLight', properties: { Brightness: 1.5, Range: 16, Color: [255, 180, 80] } },
      { className: 'Fire', properties: { Size: 5, Heat: 10 } },
    ]},
    // Logs
    { name: 'fp_log1', size: [0.4, 0.4, 2.5], position: [x - 0.3, y + 1.1, z], rotation: [0, 15, 0], material: 'Wood', color: [80, 45, 20], shape: 'Cylinder' },
    { name: 'fp_log2', size: [0.35, 0.35, 2.2], position: [x + 0.3, y + 1.1, z], rotation: [0, -10, 0], material: 'Wood', color: [70, 40, 18], shape: 'Cylinder' },
  ]
}

export function generatePointLight(
  x: number, y: number, z: number,
  brightness: number = 1, range: number = 12,
  color: [number, number, number] = [255, 220, 180],
  name: string = 'light',
): BuildPart {
  return {
    name,
    size: [0.5, 0.5, 0.5],
    position: [x, y, z],
    rotation: [0, 0, 0],
    material: 'Neon',
    color,
    transparency: 0.8,
    shape: 'Ball',
    children: [
      { className: 'PointLight', properties: { Brightness: brightness, Range: range, Color: color } },
    ],
  }
}

export function generateTree(x: number, y: number, z: number, scale: number = 1): BuildPart[] {
  const s = scale
  return [
    { name: 'tree_trunk', size: [1.5 * s, 8 * s, 1.5 * s], position: [x, y + 4 * s, z], rotation: [0, 0, 0], material: 'Wood', color: [100, 70, 35], shape: 'Cylinder' },
    { name: 'tree_canopy', size: [8 * s, 6 * s, 8 * s], position: [x, y + 9 * s, z], rotation: [0, 0, 0], material: 'Grass', color: [40, 120, 40], shape: 'Ball' },
    { name: 'tree_canopy2', size: [5 * s, 4 * s, 5 * s], position: [x + 2 * s, y + 8 * s, z + 1 * s], rotation: [0, 0, 0], material: 'Grass', color: [50, 130, 45], shape: 'Ball' },
    { name: 'tree_canopy3', size: [4 * s, 3 * s, 4 * s], position: [x - 1.5 * s, y + 10 * s, z - 1 * s], rotation: [0, 0, 0], material: 'Grass', color: [35, 110, 35], shape: 'Ball' },
  ]
}

// ─── Zone Generators (for world planner) ──────────────────────────────────────

export function generateBush(x: number, y: number, z: number, scale: number = 1): BuildPart[] {
  const s = scale
  // Anti-ugly compliant: 3 overlapping balls, not a single ugly sphere
  return [
    { name: 'bush_base', size: [3*s, 2*s, 3*s], position: [x, y+1*s, z], rotation: [0,0,0], material: 'Grass', color: [50,120,40], shape: 'Ball' },
    { name: 'bush_top', size: [2.5*s, 1.8*s, 2.5*s], position: [x+0.5*s, y+1.5*s, z+0.3*s], rotation: [0,20,0], material: 'Grass', color: [60,135,45], shape: 'Ball' },
    { name: 'bush_side', size: [2*s, 1.5*s, 2*s], position: [x-0.5*s, y+0.8*s, z-0.4*s], rotation: [0,40,0], material: 'Grass', color: [45,115,38], shape: 'Ball' },
  ]
}

export function generateRock(x: number, y: number, z: number, scale: number = 1): BuildPart[] {
  const s = scale
  return [
    { name: 'rock_main', size: [3*s, 2*s, 2.5*s], position: [x, y+0.8*s, z], rotation: [0, Math.random()*360, 5], material: 'Rock', color: [120,115,105], shape: 'Ball' },
    { name: 'rock_detail', size: [1.5*s, 1*s, 1.2*s], position: [x+1*s, y+0.4*s, z+0.5*s], rotation: [0, Math.random()*360, -3], material: 'Rock', color: [130,125,115] },
  ]
}

export function generateLampPost(x: number, y: number, z: number, height: number = 12): BuildPart[] {
  return [
    { name: 'lamp_base', size: [1.5, 0.4, 1.5], position: [x, y+0.2, z], rotation: [0,0,0], material: 'Metal', color: [50,50,55] },
    { name: 'lamp_pole', size: [height, 0.6, 0.6], position: [x, y+height/2, z], rotation: [0,0,0], material: 'Metal', color: [55,55,60], shape: 'Cylinder' },
    { name: 'lamp_arm', size: [2, 0.3, 0.3], position: [x+1, y+height-0.5, z], rotation: [0,0,0], material: 'Metal', color: [55,55,60] },
    { name: 'lamp_bulb', size: [1.2, 1.2, 1.2], position: [x+2, y+height-0.5, z], rotation: [0,0,0], material: 'Neon', color: [255,230,180], shape: 'Ball',
      children: [{ className: 'PointLight', properties: { Brightness: 2, Range: 25, Color: [255,220,160] } }] },
  ]
}

export function generateFountain(x: number, y: number, z: number, radius: number = 6): BuildPart[] {
  const r = radius
  return [
    { name: 'fountain_basin', size: [1.5, r*2, r*2], position: [x, y+0.75, z], rotation: [0,0,0], material: 'Concrete', color: [170,165,155], shape: 'Cylinder' },
    { name: 'fountain_rim', size: [0.4, r*2+1, r*2+1], position: [x, y+1.3, z], rotation: [0,0,0], material: 'Marble', color: [210,205,195], shape: 'Cylinder' },
    { name: 'fountain_column', size: [4, 1.2, 1.2], position: [x, y+3.5, z], rotation: [0,0,0], material: 'Marble', color: [220,215,205], shape: 'Cylinder' },
    { name: 'fountain_top', size: [2, 2, 2], position: [x, y+5.5, z], rotation: [0,0,0], material: 'Marble', color: [225,220,210], shape: 'Ball' },
    { name: 'fountain_water', size: [0.3, r*1.8, r*1.8], position: [x, y+1, z], rotation: [0,0,0], material: 'Glass', color: [80,160,220], transparency: 0.4, shape: 'Cylinder' },
  ]
}

export function generateMarketStall(x: number, y: number, z: number, rotY: number = 0): BuildPart[] {
  return [
    { name: 'stall_counter', size: [5, 0.3, 2.5], position: [x, y+3, z], rotation: [0,rotY,0], material: 'WoodPlanks', color: [140,100,60] },
    { name: 'stall_leg_fl', size: [0.4, 3, 0.4], position: [x-2.2, y+1.5, z-1], rotation: [0,rotY,0], material: 'Wood', color: [120,80,40] },
    { name: 'stall_leg_fr', size: [0.4, 3, 0.4], position: [x+2.2, y+1.5, z-1], rotation: [0,rotY,0], material: 'Wood', color: [120,80,40] },
    { name: 'stall_leg_bl', size: [0.4, 5, 0.4], position: [x-2.2, y+2.5, z+1], rotation: [0,rotY,0], material: 'Wood', color: [120,80,40] },
    { name: 'stall_leg_br', size: [0.4, 5, 0.4], position: [x+2.2, y+2.5, z+1], rotation: [0,rotY,0], material: 'Wood', color: [120,80,40] },
    { name: 'stall_roof', size: [6, 0.2, 3.5], position: [x, y+5.1, z], rotation: [8,rotY,0], material: 'Fabric', color: [180,50,50] },
    { name: 'stall_sign', size: [4, 1, 0.15], position: [x, y+5.5, z-1.3], rotation: [0,rotY,0], material: 'Wood', color: [160,120,70] },
  ]
}

export function generatePath(
  fromX: number, fromZ: number, toX: number, toZ: number,
  y: number = 0, width: number = 4, material: string = 'Cobblestone', color: [number, number, number] = [160,150,135]
): BuildPart[] {
  const dx = toX - fromX, dz = toZ - fromZ
  const length = Math.sqrt(dx*dx + dz*dz)
  const angle = Math.atan2(dx, dz) * (180/Math.PI)
  const midX = (fromX + toX) / 2, midZ = (fromZ + toZ) / 2
  return [
    { name: 'path_surface', size: [width, 0.2, length], position: [midX, y+0.1, midZ], rotation: [0, angle, 0], material, color },
    { name: 'path_edge_l', size: [0.3, 0.3, length], position: [midX - width/2 - 0.15, y+0.15, midZ], rotation: [0, angle, 0], material: 'Concrete', color: [140,135,125] },
    { name: 'path_edge_r', size: [0.3, 0.3, length], position: [midX + width/2 + 0.15, y+0.15, midZ], rotation: [0, angle, 0], material: 'Concrete', color: [140,135,125] },
  ]
}

export function generateShop(x: number, y: number, z: number, w: number = 16, d: number = 12, name: string = 'Shop'): BuildPart[] {
  const parts: BuildPart[] = []
  const wallH = 10, floorH = 1, roofH = 3
  // Floor
  parts.push({ name: `${name}_floor`, size: [w, floorH, d], position: [x, y+floorH/2, z], rotation: [0,0,0], material: 'WoodPlanks', color: [140,100,60] })
  // Walls
  parts.push({ name: `${name}_wall_back`, size: [w, wallH, 0.8], position: [x, y+floorH+wallH/2, z+d/2], rotation: [0,0,0], material: 'Brick', color: [180,150,110] })
  parts.push({ name: `${name}_wall_left`, size: [0.8, wallH, d], position: [x-w/2, y+floorH+wallH/2, z], rotation: [0,0,0], material: 'Brick', color: [175,145,105] })
  parts.push({ name: `${name}_wall_right`, size: [0.8, wallH, d], position: [x+w/2, y+floorH+wallH/2, z], rotation: [0,0,0], material: 'Brick', color: [185,155,115] })
  // Front wall with door gap
  parts.push({ name: `${name}_wall_front_l`, size: [w/2-2.5, wallH, 0.8], position: [x-w/4-1.25, y+floorH+wallH/2, z-d/2], rotation: [0,0,0], material: 'Brick', color: [180,150,110] })
  parts.push({ name: `${name}_wall_front_r`, size: [w/2-2.5, wallH, 0.8], position: [x+w/4+1.25, y+floorH+wallH/2, z-d/2], rotation: [0,0,0], material: 'Brick', color: [180,150,110] })
  parts.push({ name: `${name}_wall_front_top`, size: [5, wallH-7.5, 0.8], position: [x, y+floorH+wallH-1.25, z-d/2], rotation: [0,0,0], material: 'Brick', color: [180,150,110] })
  // Door
  parts.push({ name: `${name}_door`, size: [4, 7, 0.4], position: [x, y+floorH+3.5, z-d/2+0.2], rotation: [0,0,0], material: 'Wood', color: [90,55,25] })
  // Windows
  parts.push({ name: `${name}_window_l`, size: [3, 3, 0.2], position: [x-w/4, y+floorH+5.5, z-d/2+0.1], rotation: [0,0,0], material: 'Glass', color: [180,215,240], transparency: 0.4 })
  parts.push({ name: `${name}_window_r`, size: [3, 3, 0.2], position: [x+w/4, y+floorH+5.5, z-d/2+0.1], rotation: [0,0,0], material: 'Glass', color: [180,215,240], transparency: 0.4 })
  // Roof
  parts.push({ name: `${name}_roof_l`, size: [w/2+1, roofH, d+2], position: [x-w/4, y+floorH+wallH+roofH/2, z], rotation: [0,0,0], material: 'Slate', color: [75,65,55], shape: 'Wedge' })
  parts.push({ name: `${name}_roof_r`, size: [w/2+1, roofH, d+2], position: [x+w/4, y+floorH+wallH+roofH/2, z], rotation: [0,180,0], material: 'Slate', color: [75,65,55], shape: 'Wedge' })
  // Ceiling with light
  parts.push({ name: `${name}_ceiling`, size: [w, 0.3, d], position: [x, y+floorH+wallH, z], rotation: [0,0,0], material: 'Concrete', color: [230,225,220],
    children: [{ className: 'PointLight', properties: { Brightness: 2, Range: 25, Color: [255,210,160] } }] })
  // Counter
  parts.push({ name: `${name}_counter`, size: [w*0.6, 0.3, 2], position: [x, y+floorH+3, z+d/4], rotation: [0,0,0], material: 'Granite', color: [60,60,65] })
  // Sign
  parts.push({ name: `${name}_sign`, size: [6, 1.5, 0.2], position: [x, y+floorH+wallH+1, z-d/2-0.5], rotation: [0,0,0], material: 'Wood', color: [130,90,45] })
  return parts
}

export function generateHouse(x: number, y: number, z: number, w: number = 20, d: number = 14, floors: number = 1, name: string = 'House'): BuildPart[] {
  const parts: BuildPart[] = []
  const wallH = 10, floorH = 1

  for (let f = 0; f < floors; f++) {
    const fy = y + f * (wallH + floorH)
    const prefix = floors > 1 ? `${name}_F${f+1}` : name

    // Floor
    parts.push({ name: `${prefix}_floor`, size: [w, floorH, d], position: [x, fy+floorH/2, z], rotation: [0,0,0], material: f === 0 ? 'Concrete' : 'WoodPlanks', color: f === 0 ? [160,155,150] : [140,100,60] })
    // Walls
    parts.push({ name: `${prefix}_wall_back`, size: [w, wallH, 0.8], position: [x, fy+floorH+wallH/2, z+d/2], rotation: [0,0,0], material: 'Brick', color: [180,150,110] })
    parts.push({ name: `${prefix}_wall_left`, size: [0.8, wallH, d], position: [x-w/2, fy+floorH+wallH/2, z], rotation: [0,0,0], material: 'Brick', color: [175,145,105] })
    parts.push({ name: `${prefix}_wall_right`, size: [0.8, wallH, d], position: [x+w/2, fy+floorH+wallH/2, z], rotation: [0,0,0], material: 'Brick', color: [185,155,115] })
    // Front wall with door (ground floor only)
    if (f === 0) {
      parts.push({ name: `${prefix}_wall_front_l`, size: [w/2-2.5, wallH, 0.8], position: [x-w/4-1.25, fy+floorH+wallH/2, z-d/2], rotation: [0,0,0], material: 'Brick', color: [180,150,110] })
      parts.push({ name: `${prefix}_wall_front_r`, size: [w/2-2.5, wallH, 0.8], position: [x+w/4+1.25, fy+floorH+wallH/2, z-d/2], rotation: [0,0,0], material: 'Brick', color: [180,150,110] })
      parts.push({ name: `${prefix}_door`, size: [4, 7.5, 0.4], position: [x, fy+floorH+3.75, z-d/2+0.2], rotation: [0,0,0], material: 'Wood', color: [90,55,25] })
    } else {
      parts.push({ name: `${prefix}_wall_front`, size: [w, wallH, 0.8], position: [x, fy+floorH+wallH/2, z-d/2], rotation: [0,0,0], material: 'Brick', color: [180,150,110] })
    }
    // Windows
    parts.push({ name: `${prefix}_win_l`, size: [3,3,0.2], position: [x-w/3, fy+floorH+5.5, z-d/2+0.1], rotation: [0,0,0], material: 'Glass', color: [180,215,240], transparency: 0.4 })
    parts.push({ name: `${prefix}_win_r`, size: [3,3,0.2], position: [x+w/3, fy+floorH+5.5, z-d/2+0.1], rotation: [0,0,0], material: 'Glass', color: [180,215,240], transparency: 0.4 })
    // Ceiling + light
    parts.push({ name: `${prefix}_ceiling`, size: [w, 0.3, d], position: [x, fy+floorH+wallH, z], rotation: [0,0,0], material: 'Concrete', color: [230,225,220],
      children: [{ className: 'PointLight', properties: { Brightness: 1.5, Range: 25, Color: [255,210,160] } }] })
  }

  // Roof (top floor only)
  const topY = y + floors * (wallH + floorH)
  parts.push({ name: `${name}_roof_l`, size: [w/2+1, 3, d+2], position: [x-w/4, topY+1.5, z], rotation: [0,0,0], material: 'Slate', color: [75,65,55], shape: 'Wedge' })
  parts.push({ name: `${name}_roof_r`, size: [w/2+1, 3, d+2], position: [x+w/4, topY+1.5, z], rotation: [0,180,0], material: 'Slate', color: [75,65,55], shape: 'Wedge' })
  // Chimney
  parts.push({ name: `${name}_chimney`, size: [2, 5, 2], position: [x+w/3, topY+4, z+d/4], rotation: [0,0,0], material: 'Brick', color: [160,100,70] })
  parts.push({ name: `${name}_chimney_cap`, size: [2.5, 0.3, 2.5], position: [x+w/3, topY+6.5, z+d/4], rotation: [0,0,0], material: 'Concrete', color: [140,135,130] })

  return parts
}

// ─── Parts → Luau Code ───────────────────────────────────────────────────────
export function partsToLuau(parts: BuildPart[], modelName: string): string {
  const lines: string[] = [
    `-- ${modelName} (${parts.length} parts) — Generated by ForjeGames MegaBuilder`,
    `local model = Instance.new("Model")`,
    `model.Name = "${modelName}"`,
    '',
    `local function P(name, sx,sy,sz, px,py,pz, mat, r,g,b, parent, shape, transp)`,
    `  local p = Instance.new(shape or "Part")`,
    `  p.Name = name; p.Anchored = true`,
    `  p.Size = Vector3.new(sx,sy,sz)`,
    `  p.CFrame = CFrame.new(px,py,pz)`,
    `  p.Material = Enum.Material[mat]`,
    `  p.Color = Color3.fromRGB(r,g,b)`,
    `  if transp then p.Transparency = transp end`,
    `  p.Parent = parent`,
    `  return p`,
    `end`,
    '',
  ]

  for (const part of parts) {
    const shape = part.shape === 'Wedge' ? '"WedgePart"'
      : part.shape === 'Cylinder' ? '"Part"' // cylinders use Part with special shape
      : part.shape === 'Ball' ? '"Part"'
      : 'nil'
    const transp = part.transparency != null ? String(part.transparency) : 'nil'
    const [sx, sy, sz] = part.size
    const [px, py, pz] = part.position
    const [r, g, b] = part.color

    lines.push(`P("${part.name}", ${sx},${sy},${sz}, ${px},${py},${pz}, "${part.material}", ${r},${g},${b}, model, ${shape}, ${transp})`)

    // Add children (lights, effects)
    if (part.children) {
      for (const child of part.children) {
        const props = child.properties || {}
        lines.push(`do local c = Instance.new("${child.className}"); c.Name = "${child.name || child.className}"`)
        for (const [key, val] of Object.entries(props)) {
          if (Array.isArray(val)) {
            lines.push(`  c.${key} = Color3.fromRGB(${val[0]},${val[1]},${val[2]})`)
          } else {
            lines.push(`  c.${key} = ${val}`)
          }
        }
        lines.push(`  c.Parent = model:FindFirstChild("${part.name}") end`)
      }
    }
  }

  // Handle rotations
  for (const part of parts) {
    if (part.rotation[0] !== 0 || part.rotation[1] !== 0 || part.rotation[2] !== 0) {
      const [rx, ry, rz] = part.rotation
      lines.push(`model:FindFirstChild("${part.name}").CFrame = model:FindFirstChild("${part.name}").CFrame * CFrame.Angles(math.rad(${rx}),math.rad(${ry}),math.rad(${rz}))`)
    }

    // Set Shape for cylinders and balls
    if (part.shape === 'Cylinder') {
      lines.push(`model:FindFirstChild("${part.name}").Shape = Enum.PartType.Cylinder`)
    } else if (part.shape === 'Ball') {
      lines.push(`model:FindFirstChild("${part.name}").Shape = Enum.PartType.Ball`)
    }
  }

  lines.push('')
  lines.push('model.Parent = workspace')
  lines.push(`print("[ForjeGames] ${modelName} placed — ${parts.length} parts")`)

  return lines.join('\n')
}

// ─── Pre-built Complex Structures ────────────────────────────────────────────
// These are verified, coordinate-perfect building templates

export function generateMedievalCastle(): { parts: BuildPart[]; name: string } {
  const parts: BuildPart[] = []

  // Main keep
  parts.push(...generateBox(0, 0, 0, 40, 20, 40, 2, 'Cobblestone', [130, 125, 115], 'Cobblestone', [100, 95, 85], 'keep'))

  // 4 Corner towers
  const towerPositions: [number, number][] = [[-20, -20], [20, -20], [-20, 20], [20, 20]]
  for (let i = 0; i < towerPositions.length; i++) {
    const [tx, tz] = towerPositions[i]
    // Tower cylinder body
    parts.push({
      name: `tower_${i}_body`, size: [6, 30, 6], position: [tx, 15, tz],
      rotation: [0, 0, 0], material: 'Cobblestone', color: [140, 135, 125], shape: 'Cylinder',
    })
    // Tower cap (cone-like)
    parts.push({
      name: `tower_${i}_cap`, size: [8, 6, 8], position: [tx, 33, tz],
      rotation: [0, 0, 0], material: 'Slate', color: [60, 70, 85], shape: 'Wedge',
    })
    // Tower battlements
    for (let b = 0; b < 4; b++) {
      const angle = (b / 4) * Math.PI * 2
      parts.push({
        name: `tower_${i}_battlement_${b}`,
        size: [1.5, 2, 1.5],
        position: [tx + Math.cos(angle) * 3.5, 31, tz + Math.sin(angle) * 3.5],
        rotation: [0, 0, 0], material: 'Cobblestone', color: [130, 125, 115],
      })
    }
    // Tower light
    parts.push(generatePointLight(tx, 28, tz, 1.2, 20, [255, 200, 120], `tower_${i}_light`))
  }

  // Gatehouse
  parts.push({
    name: 'gatehouse_arch', size: [8, 12, 6], position: [0, 6, -22],
    rotation: [0, 0, 0], material: 'Cobblestone', color: [120, 115, 105],
  })
  parts.push(...generateDoor(0, -22, 0.5, 5, 9, 'south', 'gate', [80, 55, 25]))

  // Courtyard ground
  parts.push(generateFloor(0, 0, 36, 36, 0, 0.5, 'Cobblestone', [110, 105, 95], 'courtyard'))

  // Wall battlements (top of walls)
  for (let i = -18; i <= 18; i += 4) {
    // Front
    parts.push({ name: `battlement_f_${i}`, size: [2, 2, 1], position: [i, 22, -20], rotation: [0, 0, 0], material: 'Cobblestone', color: [135, 130, 120] })
    // Back
    parts.push({ name: `battlement_b_${i}`, size: [2, 2, 1], position: [i, 22, 20], rotation: [0, 0, 0], material: 'Cobblestone', color: [135, 130, 120] })
    // Left
    parts.push({ name: `battlement_l_${i}`, size: [1, 2, 2], position: [-20, 22, i], rotation: [0, 0, 0], material: 'Cobblestone', color: [135, 130, 120] })
    // Right
    parts.push({ name: `battlement_r_${i}`, size: [1, 2, 2], position: [20, 22, i], rotation: [0, 0, 0], material: 'Cobblestone', color: [135, 130, 120] })
  }

  // Interior — throne room
  parts.push(...generateChair(0, 1, 8))
  parts.push(...generateTable(-8, 1, 0, 6, 4))
  parts.push(...generateTable(8, 1, 0, 6, 4))
  parts.push(...generateChair(-10, 1, 0))
  parts.push(...generateChair(-6, 1, 0))
  parts.push(...generateChair(6, 1, 0))
  parts.push(...generateChair(10, 1, 0))

  // Throne
  parts.push({
    name: 'throne_seat', size: [3, 0.5, 3], position: [0, 2.5, 14],
    rotation: [0, 0, 0], material: 'Marble', color: [200, 190, 180],
  })
  parts.push({
    name: 'throne_back', size: [3.5, 5, 0.5], position: [0, 5, 15.5],
    rotation: [0, 0, 0], material: 'Marble', color: [200, 190, 180],
  })
  parts.push({
    name: 'throne_platform', size: [8, 1, 6], position: [0, 0.5, 14],
    rotation: [0, 0, 0], material: 'Marble', color: [180, 170, 160],
  })

  // Torches along walls
  const torchPositions: [number, number, number][] = [
    [-18, 8, -18], [18, 8, -18], [-18, 8, 18], [18, 8, 18],
    [-18, 8, 0], [18, 8, 0], [0, 8, 18],
  ]
  for (let i = 0; i < torchPositions.length; i++) {
    const [tx, ty, tz] = torchPositions[i]
    parts.push({
      name: `torch_${i}_handle`, size: [0.3, 2, 0.3], position: [tx, ty, tz],
      rotation: [0, 0, 0], material: 'Wood', color: [80, 50, 25], shape: 'Cylinder',
    })
    parts.push({
      name: `torch_${i}_flame`, size: [0.5, 0.8, 0.5], position: [tx, ty + 1.5, tz],
      rotation: [0, 0, 0], material: 'Neon', color: [255, 140, 30],
      children: [
        { className: 'PointLight', properties: { Brightness: 1, Range: 14, Color: [255, 180, 80] } },
        { className: 'Fire', properties: { Size: 3, Heat: 8 } },
      ],
    })
  }

  // Banner flags
  parts.push({
    name: 'banner_1', size: [3, 5, 0.1], position: [-10, 14, -19.5],
    rotation: [0, 0, 0], material: 'Fabric', color: [180, 30, 30],
  })
  parts.push({
    name: 'banner_2', size: [3, 5, 0.1], position: [10, 14, -19.5],
    rotation: [0, 0, 0], material: 'Fabric', color: [180, 30, 30],
  })

  // Chandelier in throne room
  parts.push({
    name: 'chandelier_ring', size: [6, 0.3, 6], position: [0, 18, 8],
    rotation: [0, 0, 0], material: 'Metal', color: [160, 140, 80], shape: 'Cylinder',
  })
  parts.push({
    name: 'chandelier_chain', size: [0.2, 3, 0.2], position: [0, 19.5, 8],
    rotation: [0, 0, 0], material: 'Metal', color: [140, 120, 70], shape: 'Cylinder',
  })
  for (let c = 0; c < 6; c++) {
    const angle = (c / 6) * Math.PI * 2
    parts.push(generatePointLight(
      Math.cos(angle) * 2.5, 18.5, 8 + Math.sin(angle) * 2.5,
      0.8, 10, [255, 200, 120], `chandelier_light_${c}`
    ))
  }

  // Trees outside
  parts.push(...generateTree(-30, 0, -30, 1.2))
  parts.push(...generateTree(30, 0, -30, 1))
  parts.push(...generateTree(-30, 0, 30, 0.8))
  parts.push(...generateTree(30, 0, 30, 1.1))
  parts.push(...generateTree(-35, 0, 0, 0.9))
  parts.push(...generateTree(35, 0, 0, 1))

  return { parts, name: 'Medieval Castle' }
}

// ─── Export ──────────────────────────────────────────────────────────────────
export type { BuildBlueprint as MegaBlueprint }
