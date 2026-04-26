/**
 * Blueprint-to-Build — The engine that creates massive builds
 *
 * The AI generates a small JSON blueprint (what rooms, what style, what features).
 * This engine converts that blueprint into hundreds/thousands of parts automatically.
 *
 * AI token budget: ~500 tokens (blueprint JSON)
 * Output: 200-2000+ parts with correct coordinates
 *
 * Every wall auto-gets: panel + baseboard + crown molding + corner trim
 * Every window auto-gets: glass + 4-piece frame + sill + flower box
 * Every door auto-gets: panel + frame + knob + welcome mat
 * Every room auto-gets: furniture appropriate to room type
 * Every building auto-gets: foundation, porch, chimney, landscaping
 * Every scene auto-gets: paths, trees, street lights, benches
 */

import 'server-only'
import {
  type BuildPart,
  generateFloor, generateRoof, generateWindow, generateDoor,
  generateStairs, generateChair, generateTable, generateBed,
  generateBookshelf, generateFireplace, generatePointLight, generateTree,
  partsToLuau,
} from './mega-builder'

// ─── Blueprint Schema (what the AI outputs) ──────────────────────────────────
export interface Blueprint {
  name: string
  style: 'medieval' | 'modern' | 'rustic' | 'fantasy' | 'scifi' | 'japanese' | 'horror' | 'pirate' | 'western' | 'underwater' | 'space' | 'tropical'
  mood: string // "cozy", "epic", "eerie", "playful"
  buildings: BuildingDef[]
  outdoor?: OutdoorDef
  extras?: string[] // additional features like "fountain", "market stalls"
}

interface BuildingDef {
  name: string
  type: 'house' | 'castle' | 'tower' | 'shop' | 'tavern' | 'church' | 'barn' | 'warehouse' | 'mansion' | 'cabin' | 'fortress' | 'palace'
  position: [number, number, number] // center X, ground Y, center Z
  width: number
  depth: number
  floors: number
  roofStyle: 'pitched' | 'flat' | 'dome' | 'tower' | 'none'
  rooms: RoomDef[]
  features?: string[] // "porch", "balcony", "chimney", "tower", "garage", "garden"
}

interface RoomDef {
  name: string
  type: 'living' | 'kitchen' | 'bedroom' | 'bathroom' | 'dining' | 'library' | 'throne' | 'storage' | 'workshop' | 'tavern' | 'shop' | 'hallway' | 'office' | 'lab' | 'armory'
  floor: number // which floor (0 = ground)
  windowCount: number
  hasDoor: boolean
  features?: string[]
}

interface OutdoorDef {
  trees: number
  paths: boolean
  fence: boolean
  streetLights: number
  benches: number
  garden: boolean
}

// ─── Style Palettes ──────────────────────────────────────────────────────────
interface StylePalette {
  wallMaterial: string
  wallColor: [number, number, number]
  wallTrimColor: [number, number, number]
  floorMaterial: string
  floorColor: [number, number, number]
  roofMaterial: string
  roofColor: [number, number, number]
  doorColor: [number, number, number]
  accentColor: [number, number, number]
  windowFrameColor: [number, number, number]
}

const PALETTES: Record<string, StylePalette> = {
  medieval: {
    wallMaterial: 'Cobblestone', wallColor: [140, 135, 120], wallTrimColor: [90, 60, 30],
    floorMaterial: 'Cobblestone', floorColor: [110, 105, 95],
    roofMaterial: 'Slate', roofColor: [55, 60, 70],
    doorColor: [100, 65, 25], accentColor: [180, 30, 30], windowFrameColor: [80, 55, 25],
  },
  modern: {
    wallMaterial: 'Concrete', wallColor: [220, 215, 210], wallTrimColor: [60, 60, 65],
    floorMaterial: 'WoodPlanks', floorColor: [180, 150, 110],
    roofMaterial: 'Concrete', roofColor: [70, 70, 75],
    doorColor: [50, 50, 55], accentColor: [212, 175, 55], windowFrameColor: [40, 40, 45],
  },
  rustic: {
    wallMaterial: 'WoodPlanks', wallColor: [160, 110, 60], wallTrimColor: [100, 65, 30],
    floorMaterial: 'WoodPlanks', floorColor: [140, 95, 50],
    roofMaterial: 'Slate', roofColor: [80, 50, 30],
    doorColor: [120, 75, 35], accentColor: [180, 140, 50], windowFrameColor: [110, 70, 30],
  },
  fantasy: {
    wallMaterial: 'Marble', wallColor: [200, 190, 220], wallTrimColor: [120, 80, 180],
    floorMaterial: 'Marble', floorColor: [180, 175, 200],
    roofMaterial: 'Slate', roofColor: [80, 50, 120],
    doorColor: [100, 60, 150], accentColor: [180, 120, 255], windowFrameColor: [140, 100, 180],
  },
  scifi: {
    wallMaterial: 'DiamondPlate', wallColor: [80, 85, 95], wallTrimColor: [40, 180, 220],
    floorMaterial: 'Metal', floorColor: [60, 65, 70],
    roofMaterial: 'Metal', roofColor: [50, 55, 60],
    doorColor: [40, 160, 200], accentColor: [0, 200, 255], windowFrameColor: [50, 55, 65],
  },
  japanese: {
    wallMaterial: 'Wood', wallColor: [200, 180, 150], wallTrimColor: [60, 40, 20],
    floorMaterial: 'WoodPlanks', floorColor: [180, 155, 120],
    roofMaterial: 'Slate', roofColor: [50, 45, 40],
    doorColor: [180, 160, 130], accentColor: [200, 50, 50], windowFrameColor: [70, 45, 20],
  },
  horror: {
    wallMaterial: 'Brick', wallColor: [80, 70, 65], wallTrimColor: [40, 35, 30],
    floorMaterial: 'WoodPlanks', floorColor: [60, 50, 40],
    roofMaterial: 'Slate', roofColor: [30, 28, 25],
    doorColor: [50, 35, 25], accentColor: [150, 20, 20], windowFrameColor: [45, 35, 28],
  },
  pirate: {
    wallMaterial: 'WoodPlanks', wallColor: [140, 100, 55], wallTrimColor: [80, 50, 25],
    floorMaterial: 'WoodPlanks', floorColor: [120, 85, 45],
    roofMaterial: 'WoodPlanks', roofColor: [100, 70, 35],
    doorColor: [110, 75, 35], accentColor: [200, 170, 50], windowFrameColor: [90, 60, 30],
  },
  western: {
    wallMaterial: 'WoodPlanks', wallColor: [170, 140, 90], wallTrimColor: [110, 80, 40],
    floorMaterial: 'WoodPlanks', floorColor: [150, 120, 75],
    roofMaterial: 'Wood', roofColor: [120, 85, 45],
    doorColor: [140, 100, 50], accentColor: [180, 50, 30], windowFrameColor: [100, 70, 35],
  },
  tropical: {
    wallMaterial: 'Wood', wallColor: [200, 180, 140], wallTrimColor: [100, 180, 130],
    floorMaterial: 'WoodPlanks', floorColor: [180, 155, 110],
    roofMaterial: 'Grass', roofColor: [80, 140, 60],
    doorColor: [50, 160, 130], accentColor: [255, 120, 60], windowFrameColor: [90, 160, 120],
  },
  underwater: {
    wallMaterial: 'Glass', wallColor: [100, 160, 200], wallTrimColor: [40, 100, 140],
    floorMaterial: 'Sand', floorColor: [200, 180, 140],
    roofMaterial: 'Glass', roofColor: [80, 140, 180],
    doorColor: [60, 120, 160], accentColor: [0, 200, 180], windowFrameColor: [50, 110, 150],
  },
  space: {
    wallMaterial: 'Metal', wallColor: [90, 95, 105], wallTrimColor: [0, 180, 255],
    floorMaterial: 'DiamondPlate', floorColor: [70, 75, 80],
    roofMaterial: 'Metal', roofColor: [60, 65, 70],
    doorColor: [0, 160, 220], accentColor: [0, 255, 200], windowFrameColor: [60, 65, 75],
  },
}

// ─── Room Furniture Auto-Population ──────────────────────────────────────────
function furnishRoom(
  roomType: RoomDef['type'],
  cx: number, baseY: number, cz: number,
  roomW: number, roomD: number,
  prefix: string,
): BuildPart[] {
  const parts: BuildPart[] = []
  const fy = baseY // floor Y

  switch (roomType) {
    case 'living': {
      // Couch
      parts.push({ name: `${prefix}_couch_seat`, size: [6, 1, 2.5], position: [cx, fy + 1.5, cz + roomD / 2 - 2], rotation: [0, 0, 0], material: 'Fabric', color: [80, 60, 45] })
      parts.push({ name: `${prefix}_couch_back`, size: [6, 2, 0.5], position: [cx, fy + 2.5, cz + roomD / 2 - 0.75], rotation: [0, 0, 0], material: 'Fabric', color: [75, 55, 40] })
      parts.push({ name: `${prefix}_couch_arm_l`, size: [0.5, 1.5, 2.5], position: [cx - 3, fy + 1.75, cz + roomD / 2 - 2], rotation: [0, 0, 0], material: 'Fabric', color: [75, 55, 40] })
      parts.push({ name: `${prefix}_couch_arm_r`, size: [0.5, 1.5, 2.5], position: [cx + 3, fy + 1.75, cz + roomD / 2 - 2], rotation: [0, 0, 0], material: 'Fabric', color: [75, 55, 40] })
      // Coffee table
      parts.push(...generateTable(cx, fy, cz, 3, 2))
      // Rug
      parts.push({ name: `${prefix}_rug`, size: [5, 0.05, 4], position: [cx, fy + 0.53, cz], rotation: [0, 0, 0], material: 'Fabric', color: [140, 40, 40] })
      // Floor lamp
      parts.push({ name: `${prefix}_lamp_pole`, size: [0.3, 5, 0.3], position: [cx - roomW / 2 + 1.5, fy + 3, cz + roomD / 2 - 1], rotation: [0, 0, 0], material: 'Metal', color: [60, 60, 65], shape: 'Cylinder' })
      parts.push({ name: `${prefix}_lamp_shade`, size: [1.5, 1, 1.5], position: [cx - roomW / 2 + 1.5, fy + 5.5, cz + roomD / 2 - 1], rotation: [0, 0, 0], material: 'Fabric', color: [240, 220, 180] })
      parts.push(generatePointLight(cx - roomW / 2 + 1.5, fy + 5, cz + roomD / 2 - 1, 1, 14, [255, 220, 180], `${prefix}_lamp_light`))
      // Bookshelf on wall
      parts.push(...generateBookshelf(cx + roomW / 2 - 1, fy, cz))
      break
    }
    case 'kitchen': {
      // Counter along back wall
      parts.push({ name: `${prefix}_counter`, size: [roomW - 2, 3.5, 2], position: [cx, fy + 1.75, cz - roomD / 2 + 1.5], rotation: [0, 0, 0], material: 'Granite', color: [60, 60, 65] })
      parts.push({ name: `${prefix}_counter_top`, size: [roomW - 1.8, 0.3, 2.2], position: [cx, fy + 3.65, cz - roomD / 2 + 1.5], rotation: [0, 0, 0], material: 'Marble', color: [220, 215, 210] })
      // Stove
      parts.push({ name: `${prefix}_stove`, size: [2.5, 3.5, 2], position: [cx - roomW / 4, fy + 1.75, cz - roomD / 2 + 1.5], rotation: [0, 0, 0], material: 'Metal', color: [200, 200, 205] })
      // Fridge
      parts.push({ name: `${prefix}_fridge`, size: [2.5, 6, 2], position: [cx + roomW / 2 - 2, fy + 3, cz - roomD / 2 + 1.5], rotation: [0, 0, 0], material: 'Metal', color: [210, 210, 215] })
      parts.push({ name: `${prefix}_fridge_handle`, size: [0.15, 2, 0.15], position: [cx + roomW / 2 - 1, fy + 4, cz - roomD / 2 + 0.4], rotation: [0, 0, 0], material: 'Metal', color: [180, 180, 185] })
      // Sink
      parts.push({ name: `${prefix}_sink`, size: [2, 0.5, 1.5], position: [cx + roomW / 4, fy + 3.5, cz - roomD / 2 + 1], rotation: [0, 0, 0], material: 'Metal', color: [190, 190, 195] })
      parts.push({ name: `${prefix}_faucet`, size: [0.2, 1.2, 0.2], position: [cx + roomW / 4, fy + 4.3, cz - roomD / 2 + 0.5], rotation: [0, 0, 0], material: 'Metal', color: [180, 180, 185], shape: 'Cylinder' })
      // Island with stools
      parts.push({ name: `${prefix}_island`, size: [4, 3.5, 2.5], position: [cx, fy + 1.75, cz + 1], rotation: [0, 0, 0], material: 'Wood', color: [140, 100, 55] })
      parts.push({ name: `${prefix}_island_top`, size: [4.2, 0.3, 2.7], position: [cx, fy + 3.65, cz + 1], rotation: [0, 0, 0], material: 'Marble', color: [225, 220, 215] })
      // 3 bar stools
      for (let i = 0; i < 3; i++) {
        const sx = cx - 1.5 + i * 1.5
        parts.push({ name: `${prefix}_stool_${i}_seat`, size: [1, 0.2, 1], position: [sx, fy + 2.8, cz + 2.5], rotation: [0, 0, 0], material: 'Fabric', color: [60, 60, 65], shape: 'Cylinder' })
        parts.push({ name: `${prefix}_stool_${i}_leg`, size: [0.3, 2.6, 0.3], position: [sx, fy + 1.3, cz + 2.5], rotation: [0, 0, 0], material: 'Metal', color: [50, 50, 55], shape: 'Cylinder' })
        parts.push({ name: `${prefix}_stool_${i}_foot`, size: [0.8, 0.1, 0.8], position: [sx, fy + 0.55, cz + 2.5], rotation: [0, 0, 0], material: 'Metal', color: [50, 50, 55], shape: 'Cylinder' })
      }
      // Ceiling light
      parts.push(generatePointLight(cx, fy + 10, cz, 1.5, 18, [255, 240, 220], `${prefix}_ceiling_light`))
      break
    }
    case 'bedroom': {
      parts.push(...generateBed(cx, fy, cz - 1))
      // Nightstand left
      parts.push({ name: `${prefix}_nightstand_l`, size: [1.5, 2, 1.5], position: [cx - 3.5, fy + 1, cz - 1], rotation: [0, 0, 0], material: 'Wood', color: [120, 80, 40] })
      parts.push(generatePointLight(cx - 3.5, fy + 3, cz - 1, 0.6, 8, [255, 200, 150], `${prefix}_nightlamp_l`))
      // Nightstand right
      parts.push({ name: `${prefix}_nightstand_r`, size: [1.5, 2, 1.5], position: [cx + 3.5, fy + 1, cz - 1], rotation: [0, 0, 0], material: 'Wood', color: [120, 80, 40] })
      parts.push(generatePointLight(cx + 3.5, fy + 3, cz - 1, 0.6, 8, [255, 200, 150], `${prefix}_nightlamp_r`))
      // Dresser
      parts.push({ name: `${prefix}_dresser`, size: [3, 3, 1.5], position: [cx + roomW / 2 - 1.5, fy + 1.5, cz + roomD / 2 - 1.5], rotation: [0, 0, 0], material: 'Wood', color: [130, 85, 45] })
      // Mirror above dresser
      parts.push({ name: `${prefix}_mirror`, size: [2, 2.5, 0.1], position: [cx + roomW / 2 - 0.8, fy + 5, cz + roomD / 2 - 1.5], rotation: [0, 0, 0], material: 'Glass', color: [200, 220, 240], transparency: 0.3 })
      // Rug
      parts.push({ name: `${prefix}_rug`, size: [4, 0.05, 5], position: [cx, fy + 0.53, cz - 1], rotation: [0, 0, 0], material: 'Fabric', color: [100, 70, 50] })
      // Ceiling light
      parts.push(generatePointLight(cx, fy + 10, cz, 1, 14, [255, 220, 190], `${prefix}_ceiling_light`))
      break
    }
    case 'dining': {
      // Large dining table
      parts.push(...generateTable(cx, fy, cz, 8, 4))
      // 6 chairs around it
      parts.push(...generateChair(cx - 3, fy, cz - 2.5, 0))
      parts.push(...generateChair(cx, fy, cz - 2.5, 0))
      parts.push(...generateChair(cx + 3, fy, cz - 2.5, 0))
      parts.push(...generateChair(cx - 3, fy, cz + 2.5, 180))
      parts.push(...generateChair(cx, fy, cz + 2.5, 180))
      parts.push(...generateChair(cx + 3, fy, cz + 2.5, 180))
      // Chandelier
      parts.push({ name: `${prefix}_chandelier_ring`, size: [4, 0.3, 4], position: [cx, fy + 9, cz], rotation: [0, 0, 0], material: 'Metal', color: [160, 140, 80], shape: 'Cylinder' })
      parts.push({ name: `${prefix}_chandelier_chain`, size: [0.15, 2, 0.15], position: [cx, fy + 10.5, cz], rotation: [0, 0, 0], material: 'Metal', color: [140, 120, 70], shape: 'Cylinder' })
      for (let c = 0; c < 6; c++) {
        const a = (c / 6) * Math.PI * 2
        parts.push(generatePointLight(cx + Math.cos(a) * 1.8, fy + 9.3, cz + Math.sin(a) * 1.8, 0.7, 10, [255, 200, 130], `${prefix}_chand_light_${c}`))
      }
      // Decorative plate/vase on table
      parts.push({ name: `${prefix}_centerpiece`, size: [0.8, 1, 0.8], position: [cx, fy + 3.8, cz], rotation: [0, 0, 0], material: 'Marble', color: [200, 180, 160], shape: 'Cylinder' })
      break
    }
    case 'library': {
      // 3 bookshelves along walls
      parts.push(...generateBookshelf(cx - roomW / 2 + 1, fy, cz - roomD / 2 + 1))
      parts.push(...generateBookshelf(cx, fy, cz - roomD / 2 + 1))
      parts.push(...generateBookshelf(cx + roomW / 2 - 1, fy, cz - roomD / 2 + 1))
      // Reading desk
      parts.push(...generateTable(cx, fy, cz + 2, 4, 2.5))
      parts.push(...generateChair(cx, fy, cz + 4))
      // Desk lamp
      parts.push(generatePointLight(cx + 1, fy + 4, cz + 2, 0.8, 8, [255, 230, 180], `${prefix}_desk_lamp`))
      // Globe
      parts.push({ name: `${prefix}_globe`, size: [1.2, 1.2, 1.2], position: [cx - roomW / 2 + 2, fy + 4, cz + roomD / 2 - 2], rotation: [0, 0, 0], material: 'SmoothPlastic', color: [50, 100, 150], shape: 'Ball' })
      parts.push({ name: `${prefix}_globe_stand`, size: [0.6, 3, 0.6], position: [cx - roomW / 2 + 2, fy + 1.5, cz + roomD / 2 - 2], rotation: [0, 0, 0], material: 'Wood', color: [100, 65, 30] })
      // Ceiling light
      parts.push(generatePointLight(cx, fy + 10, cz, 1.2, 16, [255, 220, 180], `${prefix}_ceiling_light`))
      break
    }
    case 'throne': {
      // Throne
      parts.push({ name: `${prefix}_throne_platform`, size: [10, 1.5, 8], position: [cx, fy + 0.75, cz - roomD / 2 + 5], rotation: [0, 0, 0], material: 'Marble', color: [180, 170, 160] })
      parts.push({ name: `${prefix}_throne_seat`, size: [3.5, 0.5, 3], position: [cx, fy + 3, cz - roomD / 2 + 5], rotation: [0, 0, 0], material: 'Marble', color: [200, 190, 180] })
      parts.push({ name: `${prefix}_throne_back`, size: [4, 6, 0.6], position: [cx, fy + 6.5, cz - roomD / 2 + 3.5], rotation: [0, 0, 0], material: 'Marble', color: [200, 190, 180] })
      parts.push({ name: `${prefix}_throne_arm_l`, size: [0.5, 1.5, 2.5], position: [cx - 2, fy + 4, cz - roomD / 2 + 5], rotation: [0, 0, 0], material: 'Marble', color: [190, 180, 170] })
      parts.push({ name: `${prefix}_throne_arm_r`, size: [0.5, 1.5, 2.5], position: [cx + 2, fy + 4, cz - roomD / 2 + 5], rotation: [0, 0, 0], material: 'Marble', color: [190, 180, 170] })
      // Red carpet
      parts.push({ name: `${prefix}_carpet`, size: [4, 0.05, roomD - 4], position: [cx, fy + 0.53, cz + 2], rotation: [0, 0, 0], material: 'Fabric', color: [160, 20, 20] })
      // Banners
      parts.push({ name: `${prefix}_banner_l`, size: [3, 6, 0.1], position: [cx - 5, fy + 8, cz - roomD / 2 + 1], rotation: [0, 0, 0], material: 'Fabric', color: [180, 30, 30] })
      parts.push({ name: `${prefix}_banner_r`, size: [3, 6, 0.1], position: [cx + 5, fy + 8, cz - roomD / 2 + 1], rotation: [0, 0, 0], material: 'Fabric', color: [180, 30, 30] })
      // 6 torches
      for (let t = 0; t < 6; t++) {
        const side = t % 2 === 0 ? -1 : 1
        const tz = cz - roomD / 2 + 4 + Math.floor(t / 2) * (roomD / 3)
        parts.push({ name: `${prefix}_torch_${t}_handle`, size: [0.3, 2, 0.3], position: [cx + side * (roomW / 2 - 1), fy + 7, tz], rotation: [0, 0, 0], material: 'Wood', color: [80, 50, 25], shape: 'Cylinder' })
        parts.push({ name: `${prefix}_torch_${t}_flame`, size: [0.4, 0.6, 0.4], position: [cx + side * (roomW / 2 - 1), fy + 8.3, tz], rotation: [0, 0, 0], material: 'Neon', color: [255, 140, 30],
          children: [
            { className: 'PointLight', properties: { Brightness: 1, Range: 14, Color: [255, 180, 80] } },
            { className: 'Fire', properties: { Size: 3, Heat: 8 } },
          ],
        })
      }
      break
    }
    case 'tavern':
    case 'shop': {
      // Counter/bar
      parts.push({ name: `${prefix}_counter`, size: [roomW - 4, 3.5, 1.5], position: [cx, fy + 1.75, cz - roomD / 2 + 2], rotation: [0, 0, 0], material: 'Wood', color: [120, 80, 40] })
      parts.push({ name: `${prefix}_counter_top`, size: [roomW - 3.8, 0.3, 1.7], position: [cx, fy + 3.65, cz - roomD / 2 + 2], rotation: [0, 0, 0], material: 'WoodPlanks', color: [140, 100, 55] })
      // Shelves behind counter
      for (let s = 0; s < 3; s++) {
        parts.push({ name: `${prefix}_shelf_${s}`, size: [roomW - 6, 0.3, 1], position: [cx, fy + 3 + s * 1.5, cz - roomD / 2 + 0.8], rotation: [0, 0, 0], material: 'Wood', color: [110, 75, 35] })
      }
      // Tables and chairs
      parts.push(...generateTable(cx - 3, fy, cz + 3, 3, 3))
      parts.push(...generateChair(cx - 4.5, fy, cz + 3, 90))
      parts.push(...generateChair(cx - 1.5, fy, cz + 3, 270))
      parts.push(...generateTable(cx + 3, fy, cz + 3, 3, 3))
      parts.push(...generateChair(cx + 1.5, fy, cz + 3, 90))
      parts.push(...generateChair(cx + 4.5, fy, cz + 3, 270))
      // Hanging light
      parts.push(generatePointLight(cx, fy + 10, cz, 1.2, 16, [255, 200, 130], `${prefix}_hanging_light`))
      break
    }
    case 'bathroom': {
      // ── Toilet (3 parts) ──
      parts.push({ name: `${prefix}_toilet_base`, size: [1.5, 1.2, 2], position: [cx - roomW / 2 + 2, fy + 0.6, cz - roomD / 2 + 1.5], rotation: [0, 0, 0], material: 'Marble', color: [240, 238, 235] })
      parts.push({ name: `${prefix}_toilet_tank`, size: [1.3, 1.5, 0.8], position: [cx - roomW / 2 + 2, fy + 1.65, cz - roomD / 2 + 0.6], rotation: [0, 0, 0], material: 'Marble', color: [235, 233, 230] })
      parts.push({ name: `${prefix}_toilet_seat`, size: [1.3, 0.1, 1.4], position: [cx - roomW / 2 + 2, fy + 1.25, cz - roomD / 2 + 1.5], rotation: [0, 0, 0], material: 'Marble', color: [230, 228, 225] })
      // ── Bathtub (4 parts) ──
      parts.push({ name: `${prefix}_tub_body`, size: [2.5, 1.8, 5], position: [cx + roomW / 2 - 2, fy + 0.9, cz], rotation: [0, 0, 0], material: 'Marble', color: [235, 235, 240] })
      parts.push({ name: `${prefix}_tub_interior`, size: [2, 1.4, 4.5], position: [cx + roomW / 2 - 2, fy + 1.1, cz], rotation: [0, 0, 0], material: 'Marble', color: [220, 225, 235], transparency: 0.1 })
      parts.push({ name: `${prefix}_tub_faucet`, size: [0.3, 0.8, 0.3], position: [cx + roomW / 2 - 2, fy + 2.2, cz - 2.2], rotation: [0, 0, 0], material: 'Metal', color: [190, 190, 195], shape: 'Cylinder' })
      parts.push({ name: `${prefix}_tub_faucet_handle`, size: [0.6, 0.15, 0.15], position: [cx + roomW / 2 - 2, fy + 2.5, cz - 2.2], rotation: [0, 0, 0], material: 'Metal', color: [180, 180, 185] })
      // ── Sink (3 parts) ──
      parts.push({ name: `${prefix}_sink_basin`, size: [2, 0.5, 1.5], position: [cx, fy + 3, cz - roomD / 2 + 1], rotation: [0, 0, 0], material: 'Marble', color: [235, 235, 240] })
      parts.push({ name: `${prefix}_sink_pedestal`, size: [0.6, 2.5, 0.6], position: [cx, fy + 1.25, cz - roomD / 2 + 1], rotation: [0, 0, 0], material: 'Marble', color: [230, 230, 235], shape: 'Cylinder' })
      parts.push({ name: `${prefix}_sink_faucet`, size: [0.2, 0.8, 0.2], position: [cx, fy + 3.7, cz - roomD / 2 + 0.5], rotation: [0, 0, 0], material: 'Metal', color: [190, 190, 195], shape: 'Cylinder' })
      // ── Mirror ──
      parts.push({ name: `${prefix}_mirror`, size: [2.5, 3, 0.1], position: [cx, fy + 5.5, cz - roomD / 2 + 0.55], rotation: [0, 0, 0], material: 'Glass', color: [200, 220, 240], transparency: 0.3 })
      parts.push({ name: `${prefix}_mirror_frame`, size: [2.7, 3.2, 0.15], position: [cx, fy + 5.5, cz - roomD / 2 + 0.5], rotation: [0, 0, 0], material: 'Metal', color: [170, 170, 175] })
      // ── Towel rack ──
      parts.push({ name: `${prefix}_towelrack_bar`, size: [2, 0.12, 0.12], position: [cx + roomW / 2 - 1, fy + 4, cz + roomD / 2 - 1.5], rotation: [0, 0, 0], material: 'Metal', color: [185, 185, 190], shape: 'Cylinder' })
      parts.push({ name: `${prefix}_towelrack_mount_l`, size: [0.15, 0.15, 0.4], position: [cx + roomW / 2 - 0.9, fy + 4, cz + roomD / 2 - 1.3], rotation: [0, 0, 0], material: 'Metal', color: [180, 180, 185] })
      parts.push({ name: `${prefix}_towelrack_mount_r`, size: [0.15, 0.15, 0.4], position: [cx + roomW / 2 - 0.9, fy + 4, cz + roomD / 2 - 1.7], rotation: [0, 0, 0], material: 'Metal', color: [180, 180, 185] })
      parts.push({ name: `${prefix}_towel`, size: [1.6, 0.05, 0.8], position: [cx + roomW / 2 - 1, fy + 3.5, cz + roomD / 2 - 1.5], rotation: [10, 0, 0], material: 'Fabric', color: [240, 240, 245] })
      // ── Bath mat ──
      parts.push({ name: `${prefix}_bathmat`, size: [2, 0.05, 1.5], position: [cx + roomW / 2 - 2, fy + 0.53, cz + 2.5], rotation: [0, 0, 0], material: 'Fabric', color: [100, 140, 180] })
      // ── Shower curtain ──
      parts.push({ name: `${prefix}_curtain_rod`, size: [0.1, 0.1, 5], position: [cx + roomW / 2 - 0.5, fy + 7, cz], rotation: [0, 0, 0], material: 'Metal', color: [185, 185, 190], shape: 'Cylinder' })
      parts.push({ name: `${prefix}_curtain`, size: [0.05, 5, 4.8], position: [cx + roomW / 2 - 0.5, fy + 4.5, cz], rotation: [0, 0, 0], material: 'Fabric', color: [220, 220, 230], transparency: 0.15 })
      // ── Medicine cabinet ──
      parts.push({ name: `${prefix}_medcab_body`, size: [1.8, 2.2, 0.6], position: [cx - 2.5, fy + 5.5, cz - roomD / 2 + 0.7], rotation: [0, 0, 0], material: 'Metal', color: [210, 210, 215] })
      parts.push({ name: `${prefix}_medcab_door`, size: [1.7, 2.1, 0.05], position: [cx - 2.5, fy + 5.5, cz - roomD / 2 + 0.4], rotation: [0, 0, 0], material: 'Glass', color: [200, 220, 240], transparency: 0.4 })
      parts.push({ name: `${prefix}_medcab_handle`, size: [0.1, 0.5, 0.1], position: [cx - 1.7, fy + 5.5, cz - roomD / 2 + 0.35], rotation: [0, 0, 0], material: 'Metal', color: [180, 180, 185] })
      // Light
      parts.push(generatePointLight(cx, fy + 9, cz, 1.2, 14, [255, 245, 240], `${prefix}_ceiling_light`))
      break
    }
    case 'workshop': {
      // ── Workbench (5 parts) ──
      parts.push({ name: `${prefix}_bench_top`, size: [6, 0.4, 2.5], position: [cx, fy + 3.2, cz - roomD / 2 + 2], rotation: [0, 0, 0], material: 'WoodPlanks', color: [140, 100, 55] })
      parts.push({ name: `${prefix}_bench_leg_fl`, size: [0.4, 2.8, 0.4], position: [cx - 2.7, fy + 1.4, cz - roomD / 2 + 3], rotation: [0, 0, 0], material: 'Wood', color: [120, 80, 40] })
      parts.push({ name: `${prefix}_bench_leg_fr`, size: [0.4, 2.8, 0.4], position: [cx + 2.7, fy + 1.4, cz - roomD / 2 + 3], rotation: [0, 0, 0], material: 'Wood', color: [120, 80, 40] })
      parts.push({ name: `${prefix}_bench_leg_bl`, size: [0.4, 2.8, 0.4], position: [cx - 2.7, fy + 1.4, cz - roomD / 2 + 1], rotation: [0, 0, 0], material: 'Wood', color: [120, 80, 40] })
      parts.push({ name: `${prefix}_bench_leg_br`, size: [0.4, 2.8, 0.4], position: [cx + 2.7, fy + 1.4, cz - roomD / 2 + 1], rotation: [0, 0, 0], material: 'Wood', color: [120, 80, 40] })
      // ── Tools on wall (pegboard + 6 tools) ──
      parts.push({ name: `${prefix}_pegboard`, size: [5, 4, 0.2], position: [cx, fy + 6, cz - roomD / 2 + 0.6], rotation: [0, 0, 0], material: 'WoodPlanks', color: [160, 130, 80] })
      parts.push({ name: `${prefix}_tool_hammer`, size: [0.2, 1.2, 0.2], position: [cx - 2, fy + 6.5, cz - roomD / 2 + 0.4], rotation: [0, 0, 0], material: 'Metal', color: [150, 150, 155] })
      parts.push({ name: `${prefix}_tool_hammer_head`, size: [0.5, 0.3, 0.2], position: [cx - 2, fy + 7.2, cz - roomD / 2 + 0.4], rotation: [0, 0, 0], material: 'Metal', color: [120, 120, 125] })
      parts.push({ name: `${prefix}_tool_saw`, size: [0.1, 1.5, 0.6], position: [cx - 1, fy + 6.3, cz - roomD / 2 + 0.4], rotation: [0, 0, 10], material: 'Metal', color: [170, 170, 175] })
      parts.push({ name: `${prefix}_tool_wrench`, size: [0.15, 1, 0.15], position: [cx, fy + 6.5, cz - roomD / 2 + 0.4], rotation: [0, 0, 5], material: 'Metal', color: [160, 160, 165] })
      parts.push({ name: `${prefix}_tool_pliers`, size: [0.15, 1.1, 0.3], position: [cx + 1, fy + 6.4, cz - roomD / 2 + 0.4], rotation: [0, 0, -5], material: 'Metal', color: [145, 145, 150] })
      parts.push({ name: `${prefix}_tool_chisel`, size: [0.1, 1.3, 0.1], position: [cx + 2, fy + 6.5, cz - roomD / 2 + 0.4], rotation: [0, 0, 0], material: 'Metal', color: [155, 155, 160] })
      // ── Vice ──
      parts.push({ name: `${prefix}_vice_base`, size: [0.8, 0.4, 0.6], position: [cx + 2, fy + 3.6, cz - roomD / 2 + 2], rotation: [0, 0, 0], material: 'Metal', color: [80, 80, 85] })
      parts.push({ name: `${prefix}_vice_jaw_fixed`, size: [0.1, 0.8, 0.5], position: [cx + 1.7, fy + 4.2, cz - roomD / 2 + 2], rotation: [0, 0, 0], material: 'Metal', color: [75, 75, 80] })
      parts.push({ name: `${prefix}_vice_jaw_move`, size: [0.1, 0.8, 0.5], position: [cx + 2.3, fy + 4.2, cz - roomD / 2 + 2], rotation: [0, 0, 0], material: 'Metal', color: [75, 75, 80] })
      parts.push({ name: `${prefix}_vice_screw`, size: [0.6, 0.12, 0.12], position: [cx + 2.6, fy + 4.2, cz - roomD / 2 + 2], rotation: [0, 0, 0], material: 'Metal', color: [90, 90, 95], shape: 'Cylinder' })
      // ── Stool ──
      parts.push({ name: `${prefix}_stool_seat`, size: [1.2, 0.15, 1.2], position: [cx, fy + 2.3, cz + 1], rotation: [0, 0, 0], material: 'Wood', color: [130, 90, 45], shape: 'Cylinder' })
      parts.push({ name: `${prefix}_stool_leg1`, size: [0.15, 2.1, 0.15], position: [cx - 0.4, fy + 1.1, cz + 0.6], rotation: [0, 0, 0], material: 'Wood', color: [120, 80, 40] })
      parts.push({ name: `${prefix}_stool_leg2`, size: [0.15, 2.1, 0.15], position: [cx + 0.4, fy + 1.1, cz + 0.6], rotation: [0, 0, 0], material: 'Wood', color: [120, 80, 40] })
      parts.push({ name: `${prefix}_stool_leg3`, size: [0.15, 2.1, 0.15], position: [cx - 0.4, fy + 1.1, cz + 1.4], rotation: [0, 0, 0], material: 'Wood', color: [120, 80, 40] })
      parts.push({ name: `${prefix}_stool_leg4`, size: [0.15, 2.1, 0.15], position: [cx + 0.4, fy + 1.1, cz + 1.4], rotation: [0, 0, 0], material: 'Wood', color: [120, 80, 40] })
      // ── Shelving ──
      parts.push({ name: `${prefix}_shelf_frame_l`, size: [0.3, 6, 0.3], position: [cx - roomW / 2 + 1, fy + 3, cz + roomD / 2 - 1], rotation: [0, 0, 0], material: 'Wood', color: [110, 75, 35] })
      parts.push({ name: `${prefix}_shelf_frame_r`, size: [0.3, 6, 0.3], position: [cx - roomW / 2 + 4, fy + 3, cz + roomD / 2 - 1], rotation: [0, 0, 0], material: 'Wood', color: [110, 75, 35] })
      for (let s = 0; s < 3; s++) {
        parts.push({ name: `${prefix}_shelf_plank_${s}`, size: [3, 0.2, 1], position: [cx - roomW / 2 + 2.5, fy + 1.5 + s * 2, cz + roomD / 2 - 1], rotation: [0, 0, 0], material: 'WoodPlanks', color: [130, 95, 50] })
      }
      // ── Desk lamp ──
      parts.push({ name: `${prefix}_lamp_base`, size: [0.6, 0.15, 0.6], position: [cx - 2, fy + 3.55, cz - roomD / 2 + 2], rotation: [0, 0, 0], material: 'Metal', color: [50, 50, 55], shape: 'Cylinder' })
      parts.push({ name: `${prefix}_lamp_arm`, size: [0.1, 2, 0.1], position: [cx - 2, fy + 4.55, cz - roomD / 2 + 2], rotation: [0, 0, 15], material: 'Metal', color: [55, 55, 60] })
      parts.push({ name: `${prefix}_lamp_shade`, size: [0.8, 0.5, 0.8], position: [cx - 2.3, fy + 5.7, cz - roomD / 2 + 2], rotation: [0, 0, 0], material: 'Metal', color: [40, 80, 40] })
      parts.push(generatePointLight(cx - 2.3, fy + 5.5, cz - roomD / 2 + 2, 0.8, 10, [255, 230, 180], `${prefix}_lamp_light`))
      // ── Sawdust pile ──
      parts.push({ name: `${prefix}_sawdust_pile`, size: [2, 0.15, 1.5], position: [cx + 1, fy + 0.58, cz - roomD / 2 + 3.5], rotation: [0, 20, 0], material: 'Sand', color: [210, 185, 140] })
      parts.push({ name: `${prefix}_sawdust_scatter`, size: [1.2, 0.08, 1], position: [cx + 2.5, fy + 0.54, cz - roomD / 2 + 3], rotation: [0, -10, 0], material: 'Sand', color: [200, 175, 130] })
      // ── Project piece (half-built birdhouse) ──
      parts.push({ name: `${prefix}_project_base`, size: [1, 0.15, 1], position: [cx - 0.5, fy + 3.5, cz - roomD / 2 + 2], rotation: [0, 30, 0], material: 'WoodPlanks', color: [170, 130, 70] })
      parts.push({ name: `${prefix}_project_wall1`, size: [0.1, 0.8, 1], position: [cx - 1, fy + 3.9, cz - roomD / 2 + 2], rotation: [0, 30, 0], material: 'WoodPlanks', color: [170, 130, 70] })
      parts.push({ name: `${prefix}_project_wall2`, size: [1, 0.8, 0.1], position: [cx - 0.5, fy + 3.9, cz - roomD / 2 + 1.5], rotation: [0, 30, 0], material: 'WoodPlanks', color: [165, 125, 65] })
      // Ceiling light
      parts.push(generatePointLight(cx, fy + 10, cz, 1, 14, [255, 230, 190], `${prefix}_ceiling_light`))
      break
    }
    case 'armory': {
      // ── Weapon rack (8 parts: frame + 5 weapons + 2 pegs) ──
      parts.push({ name: `${prefix}_weaprack_back`, size: [5, 6, 0.3], position: [cx, fy + 4, cz - roomD / 2 + 0.65], rotation: [0, 0, 0], material: 'WoodPlanks', color: [100, 65, 30] })
      parts.push({ name: `${prefix}_weaprack_peg_top`, size: [4.5, 0.2, 0.5], position: [cx, fy + 6, cz - roomD / 2 + 0.85], rotation: [0, 0, 0], material: 'Wood', color: [90, 55, 25] })
      parts.push({ name: `${prefix}_weaprack_peg_bot`, size: [4.5, 0.2, 0.5], position: [cx, fy + 3, cz - roomD / 2 + 0.85], rotation: [0, 0, 0], material: 'Wood', color: [90, 55, 25] })
      parts.push({ name: `${prefix}_sword_1`, size: [0.15, 3.5, 0.05], position: [cx - 1.5, fy + 5, cz - roomD / 2 + 0.85], rotation: [0, 0, 5], material: 'Metal', color: [190, 195, 200] })
      parts.push({ name: `${prefix}_sword_1_hilt`, size: [0.5, 0.4, 0.1], position: [cx - 1.5, fy + 3.2, cz - roomD / 2 + 0.85], rotation: [0, 0, 5], material: 'Wood', color: [80, 50, 25] })
      parts.push({ name: `${prefix}_sword_2`, size: [0.2, 4, 0.05], position: [cx, fy + 5.2, cz - roomD / 2 + 0.85], rotation: [0, 0, -3], material: 'Metal', color: [185, 190, 195] })
      parts.push({ name: `${prefix}_sword_2_hilt`, size: [0.6, 0.4, 0.1], position: [cx, fy + 3.1, cz - roomD / 2 + 0.85], rotation: [0, 0, -3], material: 'Wood', color: [70, 45, 20] })
      parts.push({ name: `${prefix}_axe_head`, size: [0.8, 0.6, 0.1], position: [cx + 1.5, fy + 6.3, cz - roomD / 2 + 0.85], rotation: [0, 0, 0], material: 'Metal', color: [160, 160, 165] })
      parts.push({ name: `${prefix}_axe_handle`, size: [0.15, 3, 0.15], position: [cx + 1.5, fy + 4.5, cz - roomD / 2 + 0.85], rotation: [0, 0, 0], material: 'Wood', color: [110, 75, 35], shape: 'Cylinder' })
      // ── Armor stand (6 parts) ──
      parts.push({ name: `${prefix}_armor_base`, size: [1.5, 0.3, 1.5], position: [cx - roomW / 2 + 2, fy + 0.65, cz + 1], rotation: [0, 0, 0], material: 'Wood', color: [90, 60, 30], shape: 'Cylinder' })
      parts.push({ name: `${prefix}_armor_pole`, size: [0.2, 5, 0.2], position: [cx - roomW / 2 + 2, fy + 3.3, cz + 1], rotation: [0, 0, 0], material: 'Wood', color: [85, 55, 25], shape: 'Cylinder' })
      parts.push({ name: `${prefix}_armor_chest`, size: [1.8, 2, 1], position: [cx - roomW / 2 + 2, fy + 4.5, cz + 1], rotation: [0, 0, 0], material: 'Metal', color: [140, 140, 145] })
      parts.push({ name: `${prefix}_armor_shoulder_l`, size: [0.6, 0.4, 0.8], position: [cx - roomW / 2 + 1, fy + 5.7, cz + 1], rotation: [0, 0, 10], material: 'Metal', color: [135, 135, 140] })
      parts.push({ name: `${prefix}_armor_shoulder_r`, size: [0.6, 0.4, 0.8], position: [cx - roomW / 2 + 3, fy + 5.7, cz + 1], rotation: [0, 0, -10], material: 'Metal', color: [135, 135, 140] })
      parts.push({ name: `${prefix}_armor_helmet`, size: [0.8, 0.8, 0.8], position: [cx - roomW / 2 + 2, fy + 6.2, cz + 1], rotation: [0, 0, 0], material: 'Metal', color: [145, 145, 150], shape: 'Ball' })
      // ── Shield display ──
      parts.push({ name: `${prefix}_shield`, size: [2, 2.5, 0.3], position: [cx + roomW / 2 - 1, fy + 5, cz - 1], rotation: [0, 0, 0], material: 'Wood', color: [130, 30, 30] })
      parts.push({ name: `${prefix}_shield_boss`, size: [0.6, 0.6, 0.15], position: [cx + roomW / 2 - 0.85, fy + 5, cz - 1], rotation: [0, 0, 0], material: 'Metal', color: [180, 170, 50], shape: 'Cylinder' })
      parts.push({ name: `${prefix}_shield_rim`, size: [2.2, 2.7, 0.1], position: [cx + roomW / 2 - 1.05, fy + 5, cz - 1], rotation: [0, 0, 0], material: 'Metal', color: [160, 150, 40] })
      // ── Chest ──
      parts.push({ name: `${prefix}_chest_body`, size: [2.5, 1.5, 1.5], position: [cx + roomW / 2 - 2, fy + 0.75, cz + roomD / 2 - 1.5], rotation: [0, 0, 0], material: 'WoodPlanks', color: [100, 65, 30] })
      parts.push({ name: `${prefix}_chest_lid`, size: [2.5, 0.4, 1.5], position: [cx + roomW / 2 - 2, fy + 1.7, cz + roomD / 2 - 1.5], rotation: [0, 0, 0], material: 'WoodPlanks', color: [110, 70, 35] })
      parts.push({ name: `${prefix}_chest_clasp`, size: [0.3, 0.3, 0.1], position: [cx + roomW / 2 - 2, fy + 1.5, cz + roomD / 2 - 0.7], rotation: [0, 0, 0], material: 'Metal', color: [180, 170, 50] })
      parts.push({ name: `${prefix}_chest_band_1`, size: [2.5, 0.15, 0.1], position: [cx + roomW / 2 - 2, fy + 0.5, cz + roomD / 2 - 0.7], rotation: [0, 0, 0], material: 'Metal', color: [100, 95, 50] })
      parts.push({ name: `${prefix}_chest_band_2`, size: [2.5, 0.15, 0.1], position: [cx + roomW / 2 - 2, fy + 1, cz + roomD / 2 - 0.7], rotation: [0, 0, 0], material: 'Metal', color: [100, 95, 50] })
      // ── Lantern ──
      parts.push({ name: `${prefix}_lantern_body`, size: [0.5, 0.7, 0.5], position: [cx + roomW / 2 - 2, fy + 2.2, cz + roomD / 2 - 1.5], rotation: [0, 0, 0], material: 'Metal', color: [60, 55, 40] })
      parts.push({ name: `${prefix}_lantern_glass`, size: [0.35, 0.5, 0.35], position: [cx + roomW / 2 - 2, fy + 2.2, cz + roomD / 2 - 1.5], rotation: [0, 0, 0], material: 'Glass', color: [255, 200, 100], transparency: 0.4 })
      parts.push(generatePointLight(cx + roomW / 2 - 2, fy + 2.2, cz + roomD / 2 - 1.5, 0.8, 10, [255, 180, 80], `${prefix}_lantern_light`))
      // ── Training dummy (5 parts) ──
      parts.push({ name: `${prefix}_dummy_base`, size: [1.2, 0.3, 1.2], position: [cx + 2, fy + 0.65, cz + roomD / 2 - 2], rotation: [0, 0, 0], material: 'Wood', color: [100, 65, 30], shape: 'Cylinder' })
      parts.push({ name: `${prefix}_dummy_pole`, size: [0.25, 4, 0.25], position: [cx + 2, fy + 2.8, cz + roomD / 2 - 2], rotation: [0, 0, 0], material: 'Wood', color: [90, 60, 28], shape: 'Cylinder' })
      parts.push({ name: `${prefix}_dummy_torso`, size: [1.5, 2, 0.8], position: [cx + 2, fy + 4.5, cz + roomD / 2 - 2], rotation: [0, 0, 0], material: 'Fabric', color: [180, 160, 120] })
      parts.push({ name: `${prefix}_dummy_arm_l`, size: [0.3, 1.5, 0.3], position: [cx + 1, fy + 4.5, cz + roomD / 2 - 2], rotation: [0, 0, 45], material: 'Wood', color: [95, 62, 30], shape: 'Cylinder' })
      parts.push({ name: `${prefix}_dummy_arm_r`, size: [0.3, 1.5, 0.3], position: [cx + 3, fy + 4.5, cz + roomD / 2 - 2], rotation: [0, 0, -45], material: 'Wood', color: [95, 62, 30], shape: 'Cylinder' })
      // Wall torches for ambiance
      parts.push({ name: `${prefix}_torch_l_handle`, size: [0.2, 1.5, 0.2], position: [cx - roomW / 2 + 0.6, fy + 6, cz], rotation: [0, 0, 0], material: 'Wood', color: [80, 50, 25], shape: 'Cylinder' })
      parts.push({ name: `${prefix}_torch_l_flame`, size: [0.3, 0.5, 0.3], position: [cx - roomW / 2 + 0.6, fy + 7, cz], rotation: [0, 0, 0], material: 'Neon', color: [255, 140, 30],
        children: [
          { className: 'PointLight', properties: { Brightness: 1, Range: 12, Color: [255, 180, 80] } },
          { className: 'Fire', properties: { Size: 2, Heat: 6 } },
        ],
      })
      parts.push({ name: `${prefix}_torch_r_handle`, size: [0.2, 1.5, 0.2], position: [cx + roomW / 2 - 0.6, fy + 6, cz], rotation: [0, 0, 0], material: 'Wood', color: [80, 50, 25], shape: 'Cylinder' })
      parts.push({ name: `${prefix}_torch_r_flame`, size: [0.3, 0.5, 0.3], position: [cx + roomW / 2 - 0.6, fy + 7, cz], rotation: [0, 0, 0], material: 'Neon', color: [255, 140, 30],
        children: [
          { className: 'PointLight', properties: { Brightness: 1, Range: 12, Color: [255, 180, 80] } },
          { className: 'Fire', properties: { Size: 2, Heat: 6 } },
        ],
      })
      break
    }
    case 'lab': {
      // ── Lab bench (5 parts) ──
      parts.push({ name: `${prefix}_bench_top`, size: [7, 0.3, 2.5], position: [cx, fy + 3.35, cz - roomD / 2 + 2], rotation: [0, 0, 0], material: 'Marble', color: [200, 200, 205] })
      parts.push({ name: `${prefix}_bench_leg_fl`, size: [0.3, 2.8, 0.3], position: [cx - 3.2, fy + 1.4, cz - roomD / 2 + 3], rotation: [0, 0, 0], material: 'Metal', color: [80, 80, 85] })
      parts.push({ name: `${prefix}_bench_leg_fr`, size: [0.3, 2.8, 0.3], position: [cx + 3.2, fy + 1.4, cz - roomD / 2 + 3], rotation: [0, 0, 0], material: 'Metal', color: [80, 80, 85] })
      parts.push({ name: `${prefix}_bench_leg_bl`, size: [0.3, 2.8, 0.3], position: [cx - 3.2, fy + 1.4, cz - roomD / 2 + 1], rotation: [0, 0, 0], material: 'Metal', color: [80, 80, 85] })
      parts.push({ name: `${prefix}_bench_leg_br`, size: [0.3, 2.8, 0.3], position: [cx + 3.2, fy + 1.4, cz - roomD / 2 + 1], rotation: [0, 0, 0], material: 'Metal', color: [80, 80, 85] })
      // ── Beakers (3 beakers on bench) ──
      parts.push({ name: `${prefix}_beaker_1`, size: [0.4, 0.6, 0.4], position: [cx - 2, fy + 3.8, cz - roomD / 2 + 2], rotation: [0, 0, 0], material: 'Glass', color: [200, 230, 255], transparency: 0.5, shape: 'Cylinder' })
      parts.push({ name: `${prefix}_beaker_1_liquid`, size: [0.35, 0.3, 0.35], position: [cx - 2, fy + 3.65, cz - roomD / 2 + 2], rotation: [0, 0, 0], material: 'Neon', color: [50, 200, 50], transparency: 0.3, shape: 'Cylinder' })
      parts.push({ name: `${prefix}_beaker_2`, size: [0.3, 0.8, 0.3], position: [cx - 1, fy + 3.9, cz - roomD / 2 + 2], rotation: [0, 0, 0], material: 'Glass', color: [200, 230, 255], transparency: 0.5, shape: 'Cylinder' })
      parts.push({ name: `${prefix}_beaker_2_liquid`, size: [0.25, 0.5, 0.25], position: [cx - 1, fy + 3.75, cz - roomD / 2 + 2], rotation: [0, 0, 0], material: 'Neon', color: [180, 50, 200], transparency: 0.3, shape: 'Cylinder' })
      parts.push({ name: `${prefix}_beaker_3`, size: [0.5, 0.5, 0.5], position: [cx, fy + 3.75, cz - roomD / 2 + 2.3], rotation: [0, 0, 0], material: 'Glass', color: [200, 230, 255], transparency: 0.5, shape: 'Cylinder' })
      parts.push({ name: `${prefix}_beaker_3_liquid`, size: [0.45, 0.25, 0.45], position: [cx, fy + 3.63, cz - roomD / 2 + 2.3], rotation: [0, 0, 0], material: 'Neon', color: [50, 100, 255], transparency: 0.3, shape: 'Cylinder' })
      // ── Microscope ──
      parts.push({ name: `${prefix}_microscope_base`, size: [0.6, 0.15, 0.8], position: [cx + 1.5, fy + 3.58, cz - roomD / 2 + 2], rotation: [0, 0, 0], material: 'Metal', color: [40, 40, 45] })
      parts.push({ name: `${prefix}_microscope_arm`, size: [0.15, 1.5, 0.15], position: [cx + 1.5, fy + 4.3, cz - roomD / 2 + 1.7], rotation: [10, 0, 0], material: 'Metal', color: [50, 50, 55] })
      parts.push({ name: `${prefix}_microscope_eyepiece`, size: [0.2, 0.4, 0.2], position: [cx + 1.5, fy + 5.2, cz - roomD / 2 + 1.6], rotation: [30, 0, 0], material: 'Metal', color: [35, 35, 40], shape: 'Cylinder' })
      parts.push({ name: `${prefix}_microscope_lens`, size: [0.15, 0.2, 0.15], position: [cx + 1.5, fy + 3.85, cz - roomD / 2 + 2.1], rotation: [0, 0, 0], material: 'Glass', color: [180, 200, 230], shape: 'Cylinder' })
      // ── Bubbling cauldron ──
      parts.push({ name: `${prefix}_cauldron_body`, size: [2, 1.8, 2], position: [cx + roomW / 2 - 2.5, fy + 1.4, cz + 2], rotation: [0, 0, 0], material: 'Metal', color: [40, 40, 42], shape: 'Cylinder' })
      parts.push({ name: `${prefix}_cauldron_liquid`, size: [1.7, 0.3, 1.7], position: [cx + roomW / 2 - 2.5, fy + 2.2, cz + 2], rotation: [0, 0, 0], material: 'Neon', color: [80, 255, 80], transparency: 0.2, shape: 'Cylinder' })
      parts.push({ name: `${prefix}_cauldron_rim`, size: [2.2, 0.15, 2.2], position: [cx + roomW / 2 - 2.5, fy + 2.35, cz + 2], rotation: [0, 0, 0], material: 'Metal', color: [50, 50, 52], shape: 'Cylinder' })
      parts.push({ name: `${prefix}_cauldron_leg_1`, size: [0.2, 0.5, 0.2], position: [cx + roomW / 2 - 3.2, fy + 0.75, cz + 1.3], rotation: [0, 0, 0], material: 'Metal', color: [35, 35, 38] })
      parts.push({ name: `${prefix}_cauldron_leg_2`, size: [0.2, 0.5, 0.2], position: [cx + roomW / 2 - 1.8, fy + 0.75, cz + 1.3], rotation: [0, 0, 0], material: 'Metal', color: [35, 35, 38] })
      parts.push({ name: `${prefix}_cauldron_leg_3`, size: [0.2, 0.5, 0.2], position: [cx + roomW / 2 - 2.5, fy + 0.75, cz + 2.7], rotation: [0, 0, 0], material: 'Metal', color: [35, 35, 38] })
      // ── Shelves with bottles (15+ parts) ──
      parts.push({ name: `${prefix}_shelf_frame_l`, size: [0.3, 7, 0.3], position: [cx - roomW / 2 + 1, fy + 4, cz + roomD / 2 - 0.8], rotation: [0, 0, 0], material: 'Wood', color: [100, 65, 30] })
      parts.push({ name: `${prefix}_shelf_frame_r`, size: [0.3, 7, 0.3], position: [cx - roomW / 2 + 5.5, fy + 4, cz + roomD / 2 - 0.8], rotation: [0, 0, 0], material: 'Wood', color: [100, 65, 30] })
      for (let s = 0; s < 4; s++) {
        parts.push({ name: `${prefix}_shelf_plank_${s}`, size: [4.5, 0.2, 1], position: [cx - roomW / 2 + 3.25, fy + 1.5 + s * 1.8, cz + roomD / 2 - 0.8], rotation: [0, 0, 0], material: 'WoodPlanks', color: [120, 80, 40] })
      }
      // Bottles on shelves (various colors)
      const bottleColors: [number, number, number][] = [[200, 50, 50], [50, 180, 50], [50, 80, 200], [200, 180, 50], [180, 50, 180], [50, 200, 200], [255, 120, 30], [120, 50, 150]]
      for (let b = 0; b < 12; b++) {
        const shelfRow = Math.floor(b / 3)
        const col = b % 3
        parts.push({ name: `${prefix}_bottle_${b}`, size: [0.25, 0.6, 0.25], position: [cx - roomW / 2 + 1.5 + col * 1.5, fy + 2 + shelfRow * 1.8, cz + roomD / 2 - 0.8], rotation: [0, 0, 0], material: 'Glass', color: bottleColors[b % bottleColors.length], transparency: 0.3, shape: 'Cylinder' })
      }
      // ── Desk lamp ──
      parts.push({ name: `${prefix}_desklamp_base`, size: [0.5, 0.1, 0.5], position: [cx + 2.5, fy + 3.55, cz - roomD / 2 + 2], rotation: [0, 0, 0], material: 'Metal', color: [50, 50, 55], shape: 'Cylinder' })
      parts.push({ name: `${prefix}_desklamp_arm`, size: [0.08, 1.5, 0.08], position: [cx + 2.5, fy + 4.3, cz - roomD / 2 + 2], rotation: [0, 0, 10], material: 'Metal', color: [55, 55, 60] })
      parts.push({ name: `${prefix}_desklamp_shade`, size: [0.7, 0.4, 0.7], position: [cx + 2.6, fy + 5.2, cz - roomD / 2 + 2], rotation: [0, 0, 0], material: 'Metal', color: [40, 60, 40] })
      parts.push(generatePointLight(cx + 2.6, fy + 5, cz - roomD / 2 + 2, 0.7, 8, [255, 230, 180], `${prefix}_desklamp_light`))
      // ── Stool ──
      parts.push({ name: `${prefix}_stool_seat`, size: [1, 0.12, 1], position: [cx, fy + 2.6, cz + 0.5], rotation: [0, 0, 0], material: 'Wood', color: [130, 90, 45], shape: 'Cylinder' })
      parts.push({ name: `${prefix}_stool_leg1`, size: [0.12, 2.3, 0.12], position: [cx - 0.35, fy + 1.3, cz + 0.15], rotation: [0, 0, 0], material: 'Metal', color: [70, 70, 75] })
      parts.push({ name: `${prefix}_stool_leg2`, size: [0.12, 2.3, 0.12], position: [cx + 0.35, fy + 1.3, cz + 0.15], rotation: [0, 0, 0], material: 'Metal', color: [70, 70, 75] })
      parts.push({ name: `${prefix}_stool_leg3`, size: [0.12, 2.3, 0.12], position: [cx - 0.35, fy + 1.3, cz + 0.85], rotation: [0, 0, 0], material: 'Metal', color: [70, 70, 75] })
      parts.push({ name: `${prefix}_stool_leg4`, size: [0.12, 2.3, 0.12], position: [cx + 0.35, fy + 1.3, cz + 0.85], rotation: [0, 0, 0], material: 'Metal', color: [70, 70, 75] })
      // ── Chalkboard ──
      parts.push({ name: `${prefix}_chalkboard_frame`, size: [5.2, 3.7, 0.2], position: [cx + roomW / 2 - 0.6, fy + 5.5, cz], rotation: [0, 0, 0], material: 'Wood', color: [80, 50, 25] })
      parts.push({ name: `${prefix}_chalkboard_surface`, size: [5, 3.5, 0.1], position: [cx + roomW / 2 - 0.5, fy + 5.5, cz], rotation: [0, 0, 0], material: 'Slate', color: [35, 50, 40] })
      parts.push({ name: `${prefix}_chalk_tray`, size: [5, 0.15, 0.4], position: [cx + roomW / 2 - 0.5, fy + 3.6, cz], rotation: [0, 0, 0], material: 'Wood', color: [85, 55, 28] })
      // Overhead fluorescent
      parts.push({ name: `${prefix}_fluorescent_housing`, size: [6, 0.2, 0.5], position: [cx, fy + 10.5, cz], rotation: [0, 0, 0], material: 'Metal', color: [210, 210, 215] })
      parts.push(generatePointLight(cx, fy + 10, cz, 1.5, 18, [240, 245, 255], `${prefix}_fluorescent_light`))
      break
    }
    case 'storage': {
      // ── Crates (8 crates, various sizes) ──
      const cratePositions: [number, number, number][] = [
        [cx - 3, fy + 0.75, cz - 2], [cx - 1, fy + 0.6, cz - 3], [cx + 2, fy + 0.9, cz - 1],
        [cx + 3, fy + 0.75, cz - 3], [cx - 2, fy + 0.75, cz + 2], [cx + 1, fy + 0.6, cz + 3],
        [cx - 3, fy + 2.1, cz - 2], [cx + 2, fy + 2.4, cz - 1],
      ]
      const crateSizes: [number, number, number][] = [
        [1.5, 1.5, 1.5], [1.2, 1.2, 1.2], [1.8, 1.8, 1.8], [1.5, 1.5, 1.5],
        [1.5, 1.5, 1.5], [1.2, 1.2, 1.2], [1.5, 1.5, 1.5], [1.8, 1.8, 1.8],
      ]
      for (let c = 0; c < 8; c++) {
        parts.push({ name: `${prefix}_crate_${c}`, size: crateSizes[c], position: cratePositions[c], rotation: [0, Math.random() * 15, 0], material: 'WoodPlanks', color: [140, 100, 55] })
        // Cross planks on crate face
        parts.push({ name: `${prefix}_crate_${c}_plank`, size: [crateSizes[c][0] * 0.8, 0.1, 0.15], position: [cratePositions[c][0], cratePositions[c][1], cratePositions[c][2] - crateSizes[c][2] / 2], rotation: [0, 0, 45], material: 'Wood', color: [120, 85, 40] })
      }
      // ── Barrels (6) ──
      for (let b = 0; b < 6; b++) {
        const bAngle = (b / 6) * Math.PI * 1.5 + 0.5
        const bx = cx + Math.cos(bAngle) * (roomW / 3)
        const bz = cz + Math.sin(bAngle) * (roomD / 3)
        parts.push({ name: `${prefix}_barrel_${b}_body`, size: [1.2, 1.8, 1.2], position: [bx, fy + 0.9, bz], rotation: [0, b * 30, 0], material: 'WoodPlanks', color: [110, 70, 35], shape: 'Cylinder' })
        parts.push({ name: `${prefix}_barrel_${b}_band_top`, size: [1.3, 0.1, 1.3], position: [bx, fy + 1.6, bz], rotation: [0, 0, 0], material: 'Metal', color: [80, 75, 60], shape: 'Cylinder' })
        parts.push({ name: `${prefix}_barrel_${b}_band_bot`, size: [1.3, 0.1, 1.3], position: [bx, fy + 0.2, bz], rotation: [0, 0, 0], material: 'Metal', color: [80, 75, 60], shape: 'Cylinder' })
      }
      // ── Shelving ──
      parts.push({ name: `${prefix}_shelf_frame_l`, size: [0.3, 7, 0.3], position: [cx - roomW / 2 + 1, fy + 3.5, cz - roomD / 2 + 1], rotation: [0, 0, 0], material: 'Wood', color: [100, 65, 30] })
      parts.push({ name: `${prefix}_shelf_frame_r`, size: [0.3, 7, 0.3], position: [cx - roomW / 2 + 5, fy + 3.5, cz - roomD / 2 + 1], rotation: [0, 0, 0], material: 'Wood', color: [100, 65, 30] })
      for (let s = 0; s < 4; s++) {
        parts.push({ name: `${prefix}_shelf_plank_${s}`, size: [4, 0.2, 1.2], position: [cx - roomW / 2 + 3, fy + 1 + s * 1.8, cz - roomD / 2 + 1], rotation: [0, 0, 0], material: 'WoodPlanks', color: [120, 80, 40] })
      }
      // ── Cobwebs ──
      parts.push({ name: `${prefix}_cobweb_1`, size: [2, 0.02, 2], position: [cx - roomW / 2 + 1, fy + 9, cz - roomD / 2 + 1], rotation: [0, 0, 0], material: 'Fabric', color: [220, 220, 220], transparency: 0.6 })
      parts.push({ name: `${prefix}_cobweb_2`, size: [1.5, 0.02, 1.5], position: [cx + roomW / 2 - 1, fy + 8.5, cz + roomD / 2 - 1], rotation: [0, 45, 0], material: 'Fabric', color: [215, 215, 215], transparency: 0.6 })
      parts.push({ name: `${prefix}_cobweb_3`, size: [1.8, 0.02, 1.8], position: [cx + roomW / 2 - 1, fy + 9.2, cz - roomD / 2 + 1], rotation: [0, 20, 0], material: 'Fabric', color: [210, 210, 210], transparency: 0.65 })
      // ── Lantern ──
      parts.push({ name: `${prefix}_lantern_body`, size: [0.5, 0.7, 0.5], position: [cx, fy + 1.5, cz], rotation: [0, 0, 0], material: 'Metal', color: [70, 60, 40] })
      parts.push({ name: `${prefix}_lantern_glass`, size: [0.35, 0.5, 0.35], position: [cx, fy + 1.5, cz], rotation: [0, 0, 0], material: 'Glass', color: [255, 200, 100], transparency: 0.4 })
      parts.push({ name: `${prefix}_lantern_handle`, size: [0.4, 0.3, 0.05], position: [cx, fy + 2, cz], rotation: [0, 0, 0], material: 'Metal', color: [65, 55, 35] })
      parts.push(generatePointLight(cx, fy + 1.5, cz, 0.6, 12, [255, 180, 80], `${prefix}_lantern_light`))
      // ── Sacks ──
      parts.push({ name: `${prefix}_sack_1`, size: [1, 0.8, 0.8], position: [cx + 3, fy + 0.9, cz + 2], rotation: [0, 15, 5], material: 'Fabric', color: [160, 140, 100] })
      parts.push({ name: `${prefix}_sack_2`, size: [0.9, 0.7, 0.7], position: [cx + 3.8, fy + 0.85, cz + 2.3], rotation: [0, -20, -5], material: 'Fabric', color: [150, 130, 90] })
      parts.push({ name: `${prefix}_sack_3`, size: [1.1, 0.9, 0.9], position: [cx + 3.3, fy + 1.7, cz + 2.1], rotation: [0, 5, 3], material: 'Fabric', color: [155, 135, 95] })
      break
    }
    case 'office': {
      // ── Desk (5 parts) ──
      parts.push({ name: `${prefix}_desk_top`, size: [5, 0.3, 2.5], position: [cx, fy + 3, cz - roomD / 2 + 2.5], rotation: [0, 0, 0], material: 'WoodPlanks', color: [140, 90, 40] })
      parts.push({ name: `${prefix}_desk_leg_fl`, size: [0.3, 2.5, 0.3], position: [cx - 2.2, fy + 1.25, cz - roomD / 2 + 3.5], rotation: [0, 0, 0], material: 'Wood', color: [130, 85, 38] })
      parts.push({ name: `${prefix}_desk_leg_fr`, size: [0.3, 2.5, 0.3], position: [cx + 2.2, fy + 1.25, cz - roomD / 2 + 3.5], rotation: [0, 0, 0], material: 'Wood', color: [130, 85, 38] })
      parts.push({ name: `${prefix}_desk_panel_back`, size: [4.7, 2.5, 0.15], position: [cx, fy + 1.75, cz - roomD / 2 + 1.3], rotation: [0, 0, 0], material: 'WoodPlanks', color: [135, 88, 38] })
      parts.push({ name: `${prefix}_desk_drawer`, size: [1.5, 0.8, 2], position: [cx + 1.5, fy + 2, cz - roomD / 2 + 2.5], rotation: [0, 0, 0], material: 'WoodPlanks', color: [130, 85, 38] })
      parts.push({ name: `${prefix}_desk_drawer_handle`, size: [0.5, 0.1, 0.1], position: [cx + 1.5, fy + 2.2, cz - roomD / 2 + 3.55], rotation: [0, 0, 0], material: 'Metal', color: [170, 170, 175] })
      // ── Office chair (6 parts) ──
      parts.push({ name: `${prefix}_chair_seat`, size: [1.5, 0.15, 1.5], position: [cx, fy + 2.2, cz - roomD / 2 + 4], rotation: [0, 0, 0], material: 'Fabric', color: [40, 40, 45] })
      parts.push({ name: `${prefix}_chair_back`, size: [1.5, 2, 0.15], position: [cx, fy + 3.5, cz - roomD / 2 + 4.7], rotation: [5, 0, 0], material: 'Fabric', color: [40, 40, 45] })
      parts.push({ name: `${prefix}_chair_pole`, size: [0.2, 1.5, 0.2], position: [cx, fy + 1.2, cz - roomD / 2 + 4], rotation: [0, 0, 0], material: 'Metal', color: [70, 70, 75], shape: 'Cylinder' })
      parts.push({ name: `${prefix}_chair_base_star`, size: [1.8, 0.1, 1.8], position: [cx, fy + 0.55, cz - roomD / 2 + 4], rotation: [0, 0, 0], material: 'Metal', color: [60, 60, 65] })
      parts.push({ name: `${prefix}_chair_armrest_l`, size: [0.15, 0.15, 1], position: [cx - 0.7, fy + 2.8, cz - roomD / 2 + 4], rotation: [0, 0, 0], material: 'Fabric', color: [45, 45, 50] })
      parts.push({ name: `${prefix}_chair_armrest_r`, size: [0.15, 0.15, 1], position: [cx + 0.7, fy + 2.8, cz - roomD / 2 + 4], rotation: [0, 0, 0], material: 'Fabric', color: [45, 45, 50] })
      // ── Filing cabinet ──
      parts.push({ name: `${prefix}_filecab_body`, size: [1.5, 4, 1.5], position: [cx + roomW / 2 - 1.5, fy + 2, cz - roomD / 2 + 1.5], rotation: [0, 0, 0], material: 'Metal', color: [160, 160, 165] })
      parts.push({ name: `${prefix}_filecab_drawer_1`, size: [1.4, 0.8, 0.05], position: [cx + roomW / 2 - 1.5, fy + 3.5, cz - roomD / 2 + 2.3], rotation: [0, 0, 0], material: 'Metal', color: [155, 155, 160] })
      parts.push({ name: `${prefix}_filecab_drawer_2`, size: [1.4, 0.8, 0.05], position: [cx + roomW / 2 - 1.5, fy + 2.3, cz - roomD / 2 + 2.3], rotation: [0, 0, 0], material: 'Metal', color: [155, 155, 160] })
      parts.push({ name: `${prefix}_filecab_drawer_3`, size: [1.4, 0.8, 0.05], position: [cx + roomW / 2 - 1.5, fy + 1.1, cz - roomD / 2 + 2.3], rotation: [0, 0, 0], material: 'Metal', color: [155, 155, 160] })
      parts.push({ name: `${prefix}_filecab_handle_1`, size: [0.4, 0.1, 0.1], position: [cx + roomW / 2 - 1.5, fy + 3.5, cz - roomD / 2 + 2.35], rotation: [0, 0, 0], material: 'Metal', color: [140, 140, 145] })
      parts.push({ name: `${prefix}_filecab_handle_2`, size: [0.4, 0.1, 0.1], position: [cx + roomW / 2 - 1.5, fy + 2.3, cz - roomD / 2 + 2.35], rotation: [0, 0, 0], material: 'Metal', color: [140, 140, 145] })
      parts.push({ name: `${prefix}_filecab_handle_3`, size: [0.4, 0.1, 0.1], position: [cx + roomW / 2 - 1.5, fy + 1.1, cz - roomD / 2 + 2.35], rotation: [0, 0, 0], material: 'Metal', color: [140, 140, 145] })
      // ── Bookshelf (reuse helper) ──
      parts.push(...generateBookshelf(cx - roomW / 2 + 1, fy, cz + roomD / 2 - 1.5))
      // ── Desk lamp ──
      parts.push({ name: `${prefix}_desklamp_base`, size: [0.5, 0.1, 0.5], position: [cx - 1.5, fy + 3.35, cz - roomD / 2 + 2.5], rotation: [0, 0, 0], material: 'Metal', color: [50, 50, 55], shape: 'Cylinder' })
      parts.push({ name: `${prefix}_desklamp_arm`, size: [0.08, 1.5, 0.08], position: [cx - 1.5, fy + 4.1, cz - roomD / 2 + 2.5], rotation: [0, 0, 12], material: 'Metal', color: [55, 55, 60] })
      parts.push({ name: `${prefix}_desklamp_shade`, size: [0.7, 0.4, 0.7], position: [cx - 1.6, fy + 5, cz - roomD / 2 + 2.5], rotation: [0, 0, 0], material: 'Metal', color: [40, 80, 40] })
      parts.push(generatePointLight(cx - 1.6, fy + 4.8, cz - roomD / 2 + 2.5, 0.8, 8, [255, 230, 180], `${prefix}_desklamp_light`))
      // ── Potted plant ──
      parts.push({ name: `${prefix}_plant_pot`, size: [0.8, 0.8, 0.8], position: [cx - roomW / 2 + 1.5, fy + 0.9, cz + 2], rotation: [0, 0, 0], material: 'Concrete', color: [160, 100, 60], shape: 'Cylinder' })
      parts.push({ name: `${prefix}_plant_soil`, size: [0.7, 0.1, 0.7], position: [cx - roomW / 2 + 1.5, fy + 1.35, cz + 2], rotation: [0, 0, 0], material: 'Grass', color: [60, 40, 20], shape: 'Cylinder' })
      parts.push({ name: `${prefix}_plant_leaves`, size: [1.2, 1.5, 1.2], position: [cx - roomW / 2 + 1.5, fy + 2.5, cz + 2], rotation: [0, 0, 0], material: 'Grass', color: [50, 130, 50], shape: 'Ball' })
      // ── Wall clock ──
      parts.push({ name: `${prefix}_clock_face`, size: [1, 1, 0.1], position: [cx + roomW / 2 - 0.55, fy + 7, cz], rotation: [0, 0, 0], material: 'Marble', color: [240, 235, 225], shape: 'Cylinder' })
      parts.push({ name: `${prefix}_clock_rim`, size: [1.1, 1.1, 0.12], position: [cx + roomW / 2 - 0.56, fy + 7, cz], rotation: [0, 0, 0], material: 'Wood', color: [100, 60, 25], shape: 'Cylinder' })
      parts.push({ name: `${prefix}_clock_hand_hr`, size: [0.04, 0.35, 0.04], position: [cx + roomW / 2 - 0.5, fy + 7.1, cz], rotation: [0, 0, 30], material: 'Metal', color: [30, 30, 35] })
      parts.push({ name: `${prefix}_clock_hand_min`, size: [0.03, 0.45, 0.03], position: [cx + roomW / 2 - 0.5, fy + 7, cz + 0.05], rotation: [0, 0, -60], material: 'Metal', color: [30, 30, 35] })
      // ── Trash can ──
      parts.push({ name: `${prefix}_trashcan`, size: [0.6, 1, 0.6], position: [cx + 2, fy + 0.5, cz - roomD / 2 + 4.5], rotation: [0, 0, 0], material: 'Metal', color: [80, 80, 85], shape: 'Cylinder' })
      // Ceiling light
      parts.push(generatePointLight(cx, fy + 10, cz, 1.2, 16, [255, 240, 220], `${prefix}_ceiling_light`))
      break
    }
    case 'hallway': {
      // ── Runner rug ──
      parts.push({ name: `${prefix}_runner_rug`, size: [3, 0.05, roomD - 2], position: [cx, fy + 0.53, cz], rotation: [0, 0, 0], material: 'Fabric', color: [120, 30, 30] })
      parts.push({ name: `${prefix}_runner_border`, size: [3.3, 0.04, roomD - 1.7], position: [cx, fy + 0.52, cz], rotation: [0, 0, 0], material: 'Fabric', color: [160, 130, 50] })
      // ── Wall sconces (4) ──
      for (let s = 0; s < 4; s++) {
        const side = s < 2 ? -1 : 1
        const sz = cz - roomD / 3 + (s % 2) * (roomD * 2 / 3)
        parts.push({ name: `${prefix}_sconce_${s}_plate`, size: [0.3, 0.5, 0.15], position: [cx + side * (roomW / 2 - 0.55), fy + 6, sz], rotation: [0, 0, 0], material: 'Metal', color: [160, 140, 80] })
        parts.push({ name: `${prefix}_sconce_${s}_arm`, size: [0.1, 0.1, 0.5], position: [cx + side * (roomW / 2 - 0.8), fy + 6.2, sz], rotation: [0, 0, 0], material: 'Metal', color: [150, 130, 70] })
        parts.push({ name: `${prefix}_sconce_${s}_bulb`, size: [0.2, 0.3, 0.2], position: [cx + side * (roomW / 2 - 1.1), fy + 6.3, sz], rotation: [0, 0, 0], material: 'Neon', color: [255, 220, 160], shape: 'Ball' })
        parts.push(generatePointLight(cx + side * (roomW / 2 - 1.1), fy + 6.3, sz, 0.7, 10, [255, 220, 160], `${prefix}_sconce_${s}_light`))
      }
      // ── Paintings (3) ──
      const paintingColors: [number, number, number][] = [[40, 80, 120], [100, 60, 30], [60, 100, 60]]
      for (let p = 0; p < 3; p++) {
        const pz = cz - roomD / 3 + p * (roomD / 3)
        parts.push({ name: `${prefix}_painting_${p}_frame`, size: [0.15, 2.5, 2], position: [cx - roomW / 2 + 0.58, fy + 6, pz], rotation: [0, 0, 0], material: 'Wood', color: [130, 90, 40] })
        parts.push({ name: `${prefix}_painting_${p}_canvas`, size: [0.1, 2.2, 1.7], position: [cx - roomW / 2 + 0.55, fy + 6, pz], rotation: [0, 0, 0], material: 'Fabric', color: paintingColors[p] })
      }
      // ── Side table ──
      parts.push({ name: `${prefix}_sidetable_top`, size: [1.5, 0.15, 1], position: [cx + roomW / 2 - 1.5, fy + 2.8, cz], rotation: [0, 0, 0], material: 'WoodPlanks', color: [140, 95, 45] })
      parts.push({ name: `${prefix}_sidetable_leg1`, size: [0.15, 2.3, 0.15], position: [cx + roomW / 2 - 2.1, fy + 1.4, cz - 0.35], rotation: [0, 0, 0], material: 'Wood', color: [130, 88, 40] })
      parts.push({ name: `${prefix}_sidetable_leg2`, size: [0.15, 2.3, 0.15], position: [cx + roomW / 2 - 0.9, fy + 1.4, cz - 0.35], rotation: [0, 0, 0], material: 'Wood', color: [130, 88, 40] })
      parts.push({ name: `${prefix}_sidetable_leg3`, size: [0.15, 2.3, 0.15], position: [cx + roomW / 2 - 2.1, fy + 1.4, cz + 0.35], rotation: [0, 0, 0], material: 'Wood', color: [130, 88, 40] })
      parts.push({ name: `${prefix}_sidetable_leg4`, size: [0.15, 2.3, 0.15], position: [cx + roomW / 2 - 0.9, fy + 1.4, cz + 0.35], rotation: [0, 0, 0], material: 'Wood', color: [130, 88, 40] })
      // ── Vase on side table ──
      parts.push({ name: `${prefix}_vase_body`, size: [0.5, 1, 0.5], position: [cx + roomW / 2 - 1.5, fy + 3.5, cz], rotation: [0, 0, 0], material: 'Marble', color: [180, 160, 140], shape: 'Cylinder' })
      parts.push({ name: `${prefix}_vase_neck`, size: [0.3, 0.4, 0.3], position: [cx + roomW / 2 - 1.5, fy + 4.2, cz], rotation: [0, 0, 0], material: 'Marble', color: [175, 155, 135], shape: 'Cylinder' })
      parts.push({ name: `${prefix}_vase_flowers`, size: [0.8, 0.6, 0.8], position: [cx + roomW / 2 - 1.5, fy + 4.7, cz], rotation: [0, 0, 0], material: 'Grass', color: [200, 50, 80], shape: 'Ball' })
      // ── Mirror ──
      parts.push({ name: `${prefix}_mirror_frame`, size: [0.15, 3.2, 1.8], position: [cx + roomW / 2 - 0.58, fy + 6, cz + roomD / 3], rotation: [0, 0, 0], material: 'Wood', color: [160, 120, 60] })
      parts.push({ name: `${prefix}_mirror_glass`, size: [0.1, 3, 1.6], position: [cx + roomW / 2 - 0.55, fy + 6, cz + roomD / 3], rotation: [0, 0, 0], material: 'Glass', color: [200, 220, 240], transparency: 0.3 })
      break
    }
    default: {
      // Generic room — table + chair + light
      parts.push(...generateTable(cx, fy, cz, 4, 3))
      parts.push(...generateChair(cx - 2, fy, cz - 2))
      parts.push(generatePointLight(cx, fy + 10, cz, 1, 12, [255, 220, 180], `${prefix}_light`))
    }
  }

  return parts
}

// ─── Wall Detail Generator ───────────────────────────────────────────────────
function generateDetailedWall(
  cx: number, baseY: number, cz: number,
  width: number, height: number, thickness: number,
  facing: 'north' | 'south' | 'east' | 'west',
  palette: StylePalette,
  prefix: string,
  windowCount: number = 0,
  hasDoor: boolean = false,
): BuildPart[] {
  const parts: BuildPart[] = []
  const isNS = facing === 'north' || facing === 'south'

  // Main wall panel
  parts.push({
    name: `${prefix}_panel`,
    size: isNS ? [width, height, thickness] : [thickness, height, width],
    position: [cx, baseY + height / 2, cz],
    rotation: [0, 0, 0],
    material: palette.wallMaterial,
    color: palette.wallColor,
  })

  // Baseboard
  const baseboardOffset = isNS ? [0, 0, (facing === 'south' ? 0.15 : -0.15)] : [(facing === 'east' ? 0.15 : -0.15), 0, 0]
  parts.push({
    name: `${prefix}_baseboard`,
    size: isNS ? [width + 0.2, 0.5, 0.3] : [0.3, 0.5, width + 0.2],
    position: [cx + baseboardOffset[0], baseY + 0.25, cz + baseboardOffset[2]],
    rotation: [0, 0, 0],
    material: 'Wood',
    color: palette.wallTrimColor,
  })

  // Crown molding
  parts.push({
    name: `${prefix}_crown`,
    size: isNS ? [width + 0.3, 0.3, 0.4] : [0.4, 0.3, width + 0.3],
    position: [cx + baseboardOffset[0], baseY + height + 0.15, cz + baseboardOffset[2]],
    rotation: [0, 0, 0],
    material: 'Wood',
    color: palette.wallTrimColor,
  })

  // Windows
  if (windowCount > 0 && !hasDoor) {
    const spacing = width / (windowCount + 1)
    for (let w = 0; w < windowCount; w++) {
      const offset = -width / 2 + spacing * (w + 1)
      const wx = isNS ? cx + offset : cx
      const wz = isNS ? cz : cz + offset
      parts.push(...generateWindow(wx, wz, baseY + height * 0.5, 3, 3.5, facing, `${prefix}_win${w}`))
    }
  }

  // Door
  if (hasDoor) {
    parts.push(...generateDoor(cx, cz, baseY, 4, 7.5, facing, `${prefix}_door`, palette.doorColor))
  }

  return parts
}

// ─── Main: Blueprint → Parts ─────────────────────────────────────────────────
export function blueprintToBuild(blueprint: Blueprint): { parts: BuildPart[]; luauCode: string; partCount: number } {
  const parts: BuildPart[] = []
  const palette = PALETTES[blueprint.style] || PALETTES.medieval
  const floorHeight = 12
  const wallThickness = 1

  for (const building of blueprint.buildings) {
    const bx = building.position[0]
    const by = building.position[1]
    const bz = building.position[2]
    const hw = building.width / 2
    const hd = building.depth / 2
    const prefix = building.name.replace(/\s+/g, '_').toLowerCase()

    // Foundation
    parts.push(generateFloor(bx, bz, building.width + 2, building.depth + 2, by - 0.5, 1, 'Concrete', [100, 95, 85], `${prefix}_foundation`))

    for (let floor = 0; floor < building.floors; floor++) {
      const fy = by + floor * floorHeight
      const floorPrefix = `${prefix}_f${floor}`

      // Floor surface
      parts.push(generateFloor(bx, bz, building.width, building.depth, fy, 0.5, palette.floorMaterial, palette.floorColor, `${floorPrefix}_floor`))

      // Get rooms on this floor
      const floorRooms = building.rooms.filter(r => r.floor === floor)

      // 4 walls with detail
      const doorRoom = floorRooms.find(r => r.hasDoor) || (floor === 0 ? floorRooms[0] : undefined)
      const winRooms = floorRooms.filter(r => r.windowCount > 0)
      const totalWindows = winRooms.reduce((s, r) => s + r.windowCount, 0)

      parts.push(...generateDetailedWall(bx, fy + 0.5, bz + hd, building.width, floorHeight - 0.5, wallThickness, 'south', palette, `${floorPrefix}_wall_s`, Math.ceil(totalWindows / 4), floor === 0 && !!doorRoom))
      parts.push(...generateDetailedWall(bx, fy + 0.5, bz - hd, building.width, floorHeight - 0.5, wallThickness, 'north', palette, `${floorPrefix}_wall_n`, Math.ceil(totalWindows / 4)))
      parts.push(...generateDetailedWall(bx - hw, fy + 0.5, bz, building.depth, floorHeight - 0.5, wallThickness, 'west', palette, `${floorPrefix}_wall_w`, Math.ceil(totalWindows / 4)))
      parts.push(...generateDetailedWall(bx + hw, fy + 0.5, bz, building.depth, floorHeight - 0.5, wallThickness, 'east', palette, `${floorPrefix}_wall_e`, Math.ceil(totalWindows / 4)))

      // Furnish each room
      for (const room of floorRooms) {
        parts.push(...furnishRoom(room.type, bx, fy + 0.5, bz, building.width - 2, building.depth - 2, `${floorPrefix}_${room.name.replace(/\s+/g, '_')}`))
      }

      // Stairs between floors
      if (floor < building.floors - 1) {
        parts.push(...generateStairs(bx + hw - 3, fy + 0.5, bz - hd + 2, 3, Math.ceil(floorHeight / 0.8), 'east', palette.wallMaterial, palette.wallColor, `${floorPrefix}_stairs`))
      }
    }

    // Roof
    if (building.roofStyle === 'pitched') {
      const roofY = by + building.floors * floorHeight + 0.5
      parts.push(...generateRoof(bx, bz, building.width, building.depth, roofY, 6, palette.roofMaterial, palette.roofColor, prefix))
    }

    // Features
    if (building.features?.includes('chimney')) {
      parts.push({ name: `${prefix}_chimney`, size: [2, 8, 2], position: [bx + hw - 2, by + building.floors * floorHeight + 4, bz - hd + 2], rotation: [0, 0, 0], material: 'Brick', color: [140, 70, 45] })
      parts.push({ name: `${prefix}_chimney_cap`, size: [2.5, 0.3, 2.5], position: [bx + hw - 2, by + building.floors * floorHeight + 8.15, bz - hd + 2], rotation: [0, 0, 0], material: 'Concrete', color: [120, 115, 110] })
    }
    if (building.features?.includes('porch')) {
      parts.push(generateFloor(bx, bz + hd + 3, building.width + 2, 5, by, 0.5, 'WoodPlanks', [150, 110, 65], `${prefix}_porch_floor`))
      // Porch pillars (4 for a wrap-around feel)
      parts.push({ name: `${prefix}_porch_pillar_fl`, size: [0.5, 8, 0.5], position: [bx - hw, by + 4.5, bz + hd + 5], rotation: [0, 0, 0], material: 'Wood', color: [200, 195, 190], shape: 'Cylinder' })
      parts.push({ name: `${prefix}_porch_pillar_fr`, size: [0.5, 8, 0.5], position: [bx + hw, by + 4.5, bz + hd + 5], rotation: [0, 0, 0], material: 'Wood', color: [200, 195, 190], shape: 'Cylinder' })
      parts.push({ name: `${prefix}_porch_pillar_ml`, size: [0.5, 8, 0.5], position: [bx - hw / 2, by + 4.5, bz + hd + 5], rotation: [0, 0, 0], material: 'Wood', color: [200, 195, 190], shape: 'Cylinder' })
      parts.push({ name: `${prefix}_porch_pillar_mr`, size: [0.5, 8, 0.5], position: [bx + hw / 2, by + 4.5, bz + hd + 5], rotation: [0, 0, 0], material: 'Wood', color: [200, 195, 190], shape: 'Cylinder' })
      // Porch roof
      parts.push({ name: `${prefix}_porch_roof`, size: [building.width + 3, 0.5, 6], position: [bx, by + 8.5, bz + hd + 3], rotation: [0, 0, 0], material: palette.roofMaterial, color: palette.roofColor })
      // Porch railing (top rail + bottom rail + balusters)
      parts.push({ name: `${prefix}_porch_rail_top`, size: [building.width + 1, 0.15, 0.15], position: [bx, by + 3, bz + hd + 5.2], rotation: [0, 0, 0], material: 'Wood', color: [190, 185, 175] })
      parts.push({ name: `${prefix}_porch_rail_bot`, size: [building.width + 1, 0.15, 0.15], position: [bx, by + 1.2, bz + hd + 5.2], rotation: [0, 0, 0], material: 'Wood', color: [190, 185, 175] })
      for (let b = 0; b < 8; b++) {
        parts.push({ name: `${prefix}_porch_baluster_${b}`, size: [0.12, 1.6, 0.12], position: [bx - hw + 1 + b * (building.width / 8), by + 2.1, bz + hd + 5.2], rotation: [0, 0, 0], material: 'Wood', color: [185, 180, 170] })
      }
      // Steps
      parts.push(...generateStairs(bx, by, bz + hd + 5.5, 4, 2, 'south', 'Concrete', [140, 135, 130], `${prefix}_porch_steps`))
    }
    if (building.features?.includes('balcony') && building.floors > 1) {
      const balcY = by + floorHeight + 0.5
      // Balcony platform
      parts.push({ name: `${prefix}_balcony_floor`, size: [building.width * 0.5, 0.4, 4], position: [bx, balcY, bz + hd + 2], rotation: [0, 0, 0], material: 'Concrete', color: [170, 165, 158] })
      // Railing
      parts.push({ name: `${prefix}_balcony_rail_front`, size: [building.width * 0.5, 3, 0.15], position: [bx, balcY + 1.5, bz + hd + 4], rotation: [0, 0, 0], material: 'Metal', color: [50, 50, 55] })
      parts.push({ name: `${prefix}_balcony_rail_left`, size: [0.15, 3, 4], position: [bx - building.width * 0.25, balcY + 1.5, bz + hd + 2], rotation: [0, 0, 0], material: 'Metal', color: [50, 50, 55] })
      parts.push({ name: `${prefix}_balcony_rail_right`, size: [0.15, 3, 4], position: [bx + building.width * 0.25, balcY + 1.5, bz + hd + 2], rotation: [0, 0, 0], material: 'Metal', color: [50, 50, 55] })
      // Support brackets
      parts.push({ name: `${prefix}_balcony_bracket_l`, size: [0.5, 1.5, 2], position: [bx - building.width * 0.2, balcY - 0.8, bz + hd + 1], rotation: [0, 0, 0], material: 'Concrete', color: [155, 150, 143] })
      parts.push({ name: `${prefix}_balcony_bracket_r`, size: [0.5, 1.5, 2], position: [bx + building.width * 0.2, balcY - 0.8, bz + hd + 1], rotation: [0, 0, 0], material: 'Concrete', color: [155, 150, 143] })
    }
    if (building.features?.includes('garage')) {
      const gx = bx + hw + 6
      const gz = bz
      // Garage structure
      parts.push({ name: `${prefix}_garage_floor`, size: [10, 0.4, 10], position: [gx, by + 0.2, gz], rotation: [0, 0, 0], material: 'Concrete', color: [150, 148, 142] })
      parts.push({ name: `${prefix}_garage_wall_back`, size: [10, 8, 0.8], position: [gx, by + 4.5, gz - 5], rotation: [0, 0, 0], material: palette.wallMaterial, color: palette.wallColor })
      parts.push({ name: `${prefix}_garage_wall_left`, size: [0.8, 8, 10], position: [gx - 5, by + 4.5, gz], rotation: [0, 0, 0], material: palette.wallMaterial, color: palette.wallColor })
      parts.push({ name: `${prefix}_garage_wall_right`, size: [0.8, 8, 10], position: [gx + 5, by + 4.5, gz], rotation: [0, 0, 0], material: palette.wallMaterial, color: palette.wallColor })
      // Garage door (wide opening)
      parts.push({ name: `${prefix}_garage_door`, size: [8, 7, 0.3], position: [gx, by + 4, gz + 5], rotation: [0, 0, 0], material: 'Metal', color: [180, 178, 172] })
      parts.push({ name: `${prefix}_garage_door_handle`, size: [1, 0.15, 0.15], position: [gx, by + 2, gz + 5.2], rotation: [0, 0, 0], material: 'Metal', color: [80, 80, 85] })
      // Roof
      parts.push({ name: `${prefix}_garage_roof`, size: [11, 0.5, 11], position: [gx, by + 8.75, gz], rotation: [0, 0, 0], material: palette.roofMaterial, color: palette.roofColor })
      // Car inside (simplified)
      parts.push({ name: `${prefix}_car_body`, size: [4, 1.8, 8], position: [gx, by + 1.5, gz - 0.5], rotation: [0, 0, 0], material: 'Metal', color: [40, 80, 160] })
      parts.push({ name: `${prefix}_car_roof`, size: [3.5, 1.2, 4], position: [gx, by + 3, gz - 1], rotation: [0, 0, 0], material: 'Metal', color: [40, 80, 160] })
      parts.push({ name: `${prefix}_car_windshield`, size: [3.3, 1.1, 0.1], position: [gx, by + 3, gz + 1], rotation: [15, 0, 0], material: 'Glass', color: [200, 220, 240], transparency: 0.4 })
      // Driveway connecting to building
      parts.push({ name: `${prefix}_driveway`, size: [6, 0.15, 15], position: [gx, by + 0.08, gz + 10], rotation: [0, 0, 0], material: 'Concrete', color: [140, 138, 132] })
    }
    if (building.features?.includes('tower')) {
      const tx = bx - hw - 4
      const towerH = building.floors * floorHeight + 8
      // Tower cylinder body
      parts.push({ name: `${prefix}_tower_base`, size: [6, towerH, 6], position: [tx, by + towerH / 2, bz - hd + 3], rotation: [0, 0, 0], material: palette.wallMaterial, color: palette.wallColor, shape: 'Cylinder' })
      // Battlement rim at top
      for (let c = 0; c < 8; c++) {
        const cAngle = (c / 8) * Math.PI * 2
        parts.push({ name: `${prefix}_tower_merlon_${c}`, size: [1, 1.5, 1], position: [tx + Math.cos(cAngle) * 3, by + towerH + 0.75, bz - hd + 3 + Math.sin(cAngle) * 3], rotation: [0, cAngle * (180 / Math.PI), 0], material: palette.wallMaterial, color: palette.wallColor })
      }
      // Cone roof
      parts.push({ name: `${prefix}_tower_roof`, size: [7, 5, 7], position: [tx, by + towerH + 4, bz - hd + 3], rotation: [0, 0, 0], material: palette.roofMaterial, color: palette.roofColor, shape: 'Ball' })
      // Window slits
      for (let ws = 0; ws < 3; ws++) {
        parts.push({ name: `${prefix}_tower_slit_${ws}`, size: [0.5, 2, 0.2], position: [tx + 3.1, by + 5 + ws * 6, bz - hd + 3], rotation: [0, 0, 0], material: 'Glass', color: [200, 220, 240], transparency: 0.4 })
      }
    }
    if (building.features?.includes('garden')) {
      const gx = bx - hw - 8
      // Garden bed frame
      parts.push({ name: `${prefix}_garden_bed`, size: [6, 0.3, 4], position: [gx, by + 0.15, bz + hd - 2], rotation: [0, 0, 0], material: 'Wood', color: [100, 65, 30] })
      parts.push({ name: `${prefix}_garden_soil`, size: [5.6, 0.2, 3.6], position: [gx, by + 0.4, bz + hd - 2], rotation: [0, 0, 0], material: 'Grass', color: [60, 40, 20] })
      // Flowers in garden
      const flowerColors: [number, number, number][] = [[220, 50, 70], [255, 180, 40], [180, 50, 200], [255, 120, 60], [50, 180, 220]]
      for (let f = 0; f < 10; f++) {
        const fx = gx - 2.2 + (f % 5) * 1.1
        const fz = bz + hd - 3 + Math.floor(f / 5) * 1.5
        parts.push({ name: `${prefix}_flower_${f}`, size: [0.4, 0.4, 0.4], position: [fx, by + 0.8, fz], rotation: [0, f * 36, 0], material: 'Grass', color: flowerColors[f % 5], shape: 'Ball' })
        parts.push({ name: `${prefix}_stem_${f}`, size: [0.08, 0.5, 0.08], position: [fx, by + 0.55, fz], rotation: [0, 0, 0], material: 'Grass', color: [40, 120, 40], shape: 'Cylinder' })
      }
      // Watering can prop
      parts.push({ name: `${prefix}_watercan_body`, size: [0.6, 0.5, 0.4], position: [gx + 2, by + 0.55, bz + hd - 0.5], rotation: [0, 30, 0], material: 'Metal', color: [60, 120, 60] })
      parts.push({ name: `${prefix}_watercan_spout`, size: [0.1, 0.1, 0.5], position: [gx + 2.3, by + 0.7, bz + hd - 0.2], rotation: [20, 30, 0], material: 'Metal', color: [55, 115, 55] })
    }
  }

  // Outdoor features
  if (blueprint.outdoor) {
    const od = blueprint.outdoor
    // Trees
    for (let t = 0; t < od.trees; t++) {
      const angle = (t / od.trees) * Math.PI * 2
      const dist = 30 + Math.random() * 20
      parts.push(...generateTree(Math.cos(angle) * dist, 0, Math.sin(angle) * dist, 0.7 + Math.random() * 0.6))
    }
    // Street lights
    for (let l = 0; l < od.streetLights; l++) {
      const angle = (l / od.streetLights) * Math.PI * 2
      const dist = 25
      const lx = Math.cos(angle) * dist
      const lz = Math.sin(angle) * dist
      parts.push({ name: `streetlight_${l}_base`, size: [1.5, 0.3, 1.5], position: [lx, 0.15, lz], rotation: [0, 0, 0], material: 'Concrete', color: [120, 115, 110] })
      parts.push({ name: `streetlight_${l}_pole`, size: [0.3, 10, 0.3], position: [lx, 5.15, lz], rotation: [0, 0, 0], material: 'Metal', color: [60, 60, 65], shape: 'Cylinder' })
      parts.push({ name: `streetlight_${l}_arm`, size: [0.2, 0.2, 2], position: [lx + 1, 10, lz], rotation: [0, 0, 0], material: 'Metal', color: [60, 60, 65] })
      parts.push({ name: `streetlight_${l}_housing`, size: [1.2, 0.8, 1.2], position: [lx + 2, 10, lz], rotation: [0, 0, 0], material: 'Metal', color: [70, 70, 75] })
      parts.push(generatePointLight(lx + 2, 9.5, lz, 1.5, 25, [255, 230, 180], `streetlight_${l}_light`))
    }
    // Benches
    for (let b = 0; b < od.benches; b++) {
      const angle = (b / od.benches) * Math.PI * 2 + 0.3
      const dist = 22
      const bx = Math.cos(angle) * dist
      const bz = Math.sin(angle) * dist
      parts.push({ name: `bench_${b}_seat`, size: [4, 0.3, 1.5], position: [bx, 1.8, bz], rotation: [0, angle * (180 / Math.PI), 0], material: 'WoodPlanks', color: [130, 90, 45] })
      parts.push({ name: `bench_${b}_back`, size: [4, 1.5, 0.3], position: [bx, 2.8, bz - 0.6], rotation: [0, angle * (180 / Math.PI), 0], material: 'WoodPlanks', color: [120, 80, 40] })
      parts.push({ name: `bench_${b}_leg_l`, size: [0.3, 1.6, 1.5], position: [bx - 1.7, 0.8, bz], rotation: [0, angle * (180 / Math.PI), 0], material: 'Metal', color: [50, 50, 55] })
      parts.push({ name: `bench_${b}_leg_r`, size: [0.3, 1.6, 1.5], position: [bx + 1.7, 0.8, bz], rotation: [0, angle * (180 / Math.PI), 0], material: 'Metal', color: [50, 50, 55] })
    }
    // Paths
    if (od.paths) {
      for (let p = 0; p < 8; p++) {
        parts.push({ name: `path_${p}`, size: [4, 0.1, 6], position: [0, 0.05, -20 + p * 6], rotation: [0, 0, 0], material: 'Cobblestone', color: [130, 125, 115] })
      }
    }
    // Garden
    if (od.garden) {
      for (let g = 0; g < 12; g++) {
        const gx = -15 + Math.random() * 10
        const gz = 15 + Math.random() * 10
        const colors: [number, number, number][] = [[220, 50, 50], [220, 180, 50], [200, 50, 180], [255, 150, 50], [50, 180, 220]]
        parts.push({ name: `flower_${g}`, size: [0.5, 0.5, 0.5], position: [gx, 0.75, gz], rotation: [0, Math.random() * 360, 0], material: 'Grass', color: colors[g % colors.length], shape: 'Ball' })
        parts.push({ name: `stem_${g}`, size: [0.1, 0.7, 0.1], position: [gx, 0.35, gz], rotation: [0, 0, 0], material: 'Grass', color: [40, 120, 40], shape: 'Cylinder' })
      }
    }
    // Fence
    if (od.fence) {
      const fenceRadius = 35
      for (let f = 0; f < 24; f++) {
        const angle = (f / 24) * Math.PI * 2
        const fx = Math.cos(angle) * fenceRadius
        const fz = Math.sin(angle) * fenceRadius
        parts.push({ name: `fence_post_${f}`, size: [0.3, 3.5, 0.3], position: [fx, 1.75, fz], rotation: [0, 0, 0], material: 'Wood', color: [180, 170, 150] })
        // Horizontal rail between posts
        const nextAngle = ((f + 1) / 24) * Math.PI * 2
        const nx = Math.cos(nextAngle) * fenceRadius
        const nz = Math.sin(nextAngle) * fenceRadius
        const mx = (fx + nx) / 2
        const mz = (fz + nz) / 2
        const length = Math.sqrt((nx - fx) ** 2 + (nz - fz) ** 2)
        const railAngle = Math.atan2(nx - fx, nz - fz) * (180 / Math.PI)
        parts.push({ name: `fence_rail_${f}`, size: [length, 0.2, 0.15], position: [mx, 2.5, mz], rotation: [0, railAngle, 0], material: 'Wood', color: [170, 160, 140] })
        parts.push({ name: `fence_rail_low_${f}`, size: [length, 0.2, 0.15], position: [mx, 1, mz], rotation: [0, railAngle, 0], material: 'Wood', color: [170, 160, 140] })
      }
    }
    // ── Fountain (8+ parts) ──
    if (blueprint.extras?.includes('fountain') || blueprint.style === 'fantasy' || blueprint.style === 'medieval') {
      const fx = 0, fz = -15
      // Basin (bottom pool)
      parts.push({ name: 'fountain_basin', size: [6, 1, 6], position: [fx, 0.5, fz], rotation: [0, 0, 0], material: 'Marble', color: [190, 185, 175], shape: 'Cylinder' })
      parts.push({ name: 'fountain_basin_water', size: [5.5, 0.3, 5.5], position: [fx, 0.85, fz], rotation: [0, 0, 0], material: 'Glass', color: [80, 140, 200], transparency: 0.4, shape: 'Cylinder' })
      // Tier 1 (middle bowl)
      parts.push({ name: 'fountain_pillar_1', size: [1.2, 2.5, 1.2], position: [fx, 2.25, fz], rotation: [0, 0, 0], material: 'Marble', color: [195, 190, 180], shape: 'Cylinder' })
      parts.push({ name: 'fountain_bowl_1', size: [3.5, 0.6, 3.5], position: [fx, 3.3, fz], rotation: [0, 0, 0], material: 'Marble', color: [200, 195, 185], shape: 'Cylinder' })
      parts.push({ name: 'fountain_bowl_1_water', size: [3, 0.2, 3], position: [fx, 3.5, fz], rotation: [0, 0, 0], material: 'Glass', color: [80, 140, 200], transparency: 0.4, shape: 'Cylinder' })
      // Tier 2 (top)
      parts.push({ name: 'fountain_pillar_2', size: [0.8, 1.8, 0.8], position: [fx, 4.5, fz], rotation: [0, 0, 0], material: 'Marble', color: [200, 195, 185], shape: 'Cylinder' })
      parts.push({ name: 'fountain_top_bowl', size: [2, 0.4, 2], position: [fx, 5.5, fz], rotation: [0, 0, 0], material: 'Marble', color: [205, 200, 190], shape: 'Cylinder' })
      // Spray effect (neon orb on top to simulate water spray)
      parts.push({ name: 'fountain_spray', size: [0.5, 1.2, 0.5], position: [fx, 6.3, fz], rotation: [0, 0, 0], material: 'Glass', color: [120, 180, 240], transparency: 0.5, shape: 'Ball',
        children: [
          { className: 'PointLight', properties: { Brightness: 0.4, Range: 8, Color: [150, 200, 255] } },
        ],
      })
      // Decorative rim details
      parts.push({ name: 'fountain_rim_accent_1', size: [0.4, 0.4, 0.4], position: [fx + 3, 1, fz], rotation: [0, 0, 0], material: 'Marble', color: [180, 175, 165], shape: 'Ball' })
      parts.push({ name: 'fountain_rim_accent_2', size: [0.4, 0.4, 0.4], position: [fx - 3, 1, fz], rotation: [0, 0, 0], material: 'Marble', color: [180, 175, 165], shape: 'Ball' })
      parts.push({ name: 'fountain_rim_accent_3', size: [0.4, 0.4, 0.4], position: [fx, 1, fz + 3], rotation: [0, 0, 0], material: 'Marble', color: [180, 175, 165], shape: 'Ball' })
      parts.push({ name: 'fountain_rim_accent_4', size: [0.4, 0.4, 0.4], position: [fx, 1, fz - 3], rotation: [0, 0, 0], material: 'Marble', color: [180, 175, 165], shape: 'Ball' })
    }
    // ── Market stalls for medieval/fantasy (6+ parts each, 3 stalls) ──
    if (blueprint.extras?.includes('market stalls') || blueprint.style === 'medieval' || blueprint.style === 'fantasy') {
      for (let ms = 0; ms < 3; ms++) {
        const mx = -20 + ms * 12
        const mz = 20
        const stallPrefix = `market_stall_${ms}`
        // Frame (4 posts)
        parts.push({ name: `${stallPrefix}_post_fl`, size: [0.3, 7, 0.3], position: [mx - 2.5, 3.5, mz + 2], rotation: [0, 0, 0], material: 'Wood', color: [110, 75, 35] })
        parts.push({ name: `${stallPrefix}_post_fr`, size: [0.3, 7, 0.3], position: [mx + 2.5, 3.5, mz + 2], rotation: [0, 0, 0], material: 'Wood', color: [110, 75, 35] })
        parts.push({ name: `${stallPrefix}_post_bl`, size: [0.3, 8, 0.3], position: [mx - 2.5, 4, mz - 1], rotation: [0, 0, 0], material: 'Wood', color: [110, 75, 35] })
        parts.push({ name: `${stallPrefix}_post_br`, size: [0.3, 8, 0.3], position: [mx + 2.5, 4, mz - 1], rotation: [0, 0, 0], material: 'Wood', color: [110, 75, 35] })
        // Canvas awning
        const canvasColors: [number, number, number][] = [[180, 40, 40], [40, 80, 160], [160, 140, 40]]
        parts.push({ name: `${stallPrefix}_canvas`, size: [5.5, 0.1, 3.5], position: [mx, 7.5, mz + 0.5], rotation: [8, 0, 0], material: 'Fabric', color: canvasColors[ms % canvasColors.length] })
        // Counter
        parts.push({ name: `${stallPrefix}_counter`, size: [5, 3, 1.5], position: [mx, 1.5, mz + 1.5], rotation: [0, 0, 0], material: 'WoodPlanks', color: [130, 90, 45] })
        parts.push({ name: `${stallPrefix}_counter_top`, size: [5.2, 0.2, 1.7], position: [mx, 3.1, mz + 1.5], rotation: [0, 0, 0], material: 'WoodPlanks', color: [145, 105, 55] })
        // Goods on counter (small crates, sacks, items)
        parts.push({ name: `${stallPrefix}_goods_crate`, size: [0.8, 0.6, 0.8], position: [mx - 1.5, 3.6, mz + 1.5], rotation: [0, 15, 0], material: 'WoodPlanks', color: [120, 80, 38] })
        parts.push({ name: `${stallPrefix}_goods_sack`, size: [0.6, 0.5, 0.6], position: [mx, 3.5, mz + 1.5], rotation: [0, -10, 0], material: 'Fabric', color: [160, 140, 100] })
        parts.push({ name: `${stallPrefix}_goods_basket`, size: [0.7, 0.4, 0.7], position: [mx + 1.5, 3.4, mz + 1.5], rotation: [0, 5, 0], material: 'Wood', color: [170, 130, 70], shape: 'Cylinder' })
        // Sign
        parts.push({ name: `${stallPrefix}_sign`, size: [2, 0.8, 0.1], position: [mx, 8.5, mz + 2], rotation: [0, 0, 0], material: 'WoodPlanks', color: [100, 65, 30] })
      }
    }
    // ── Gravestones for horror style (3 parts each, 6 gravestones) ──
    if (blueprint.extras?.includes('gravestones') || blueprint.style === 'horror') {
      for (let g = 0; g < 6; g++) {
        const gAngle = (g / 6) * Math.PI * 1.2 + 2.5
        const gDist = 18 + (g % 2) * 5
        const gx = Math.cos(gAngle) * gDist
        const gz = Math.sin(gAngle) * gDist
        const tilt = (g % 3 - 1) * 5
        parts.push({ name: `grave_${g}_stone`, size: [1.2, 2, 0.3], position: [gx, 1, gz], rotation: [tilt, g * 25, 0], material: 'Concrete', color: [100, 100, 95] })
        parts.push({ name: `grave_${g}_base`, size: [1.5, 0.3, 0.8], position: [gx, 0.15, gz], rotation: [0, g * 25, 0], material: 'Concrete', color: [90, 88, 82] })
        parts.push({ name: `grave_${g}_mound`, size: [1.5, 0.25, 3], position: [gx + Math.sin(g * 25 * Math.PI / 180) * 1.2, 0.13, gz + Math.cos(g * 25 * Math.PI / 180) * 1.2], rotation: [0, g * 25, 0], material: 'Grass', color: [45, 60, 35] })
      }
    }
    // ── Coral formations for underwater style (4 parts each, 5 formations) ──
    if (blueprint.extras?.includes('coral') || blueprint.style === 'underwater') {
      const coralColors: [number, number, number][] = [[220, 80, 120], [255, 140, 60], [80, 180, 220], [200, 60, 200], [60, 200, 140]]
      for (let c = 0; c < 5; c++) {
        const cAngle = (c / 5) * Math.PI * 2
        const cDist = 15 + c * 4
        const ccx = Math.cos(cAngle) * cDist
        const ccz = Math.sin(cAngle) * cDist
        const scale = 0.8 + Math.random() * 0.5
        // Main coral trunk
        parts.push({ name: `coral_${c}_trunk`, size: [0.8 * scale, 3 * scale, 0.8 * scale], position: [ccx, 1.5 * scale, ccz], rotation: [0, c * 72, 0], material: 'Concrete', color: coralColors[c], shape: 'Cylinder' })
        // Branch 1
        parts.push({ name: `coral_${c}_branch_1`, size: [0.5 * scale, 2 * scale, 0.5 * scale], position: [ccx + 0.6 * scale, 2.5 * scale, ccz + 0.3 * scale], rotation: [20, c * 72, -15], material: 'Concrete', color: coralColors[(c + 1) % 5], shape: 'Cylinder' })
        // Branch 2
        parts.push({ name: `coral_${c}_branch_2`, size: [0.4 * scale, 1.5 * scale, 0.4 * scale], position: [ccx - 0.4 * scale, 2.8 * scale, ccz - 0.5 * scale], rotation: [-15, c * 72, 20], material: 'Concrete', color: coralColors[(c + 2) % 5], shape: 'Cylinder' })
        // Tip (ball shape for rounded coral top)
        parts.push({ name: `coral_${c}_tip`, size: [1 * scale, 0.8 * scale, 1 * scale], position: [ccx, 3.2 * scale, ccz], rotation: [0, 0, 0], material: 'Concrete', color: coralColors[c], shape: 'Ball' })
      }
    }
  }

  const luauCode = partsToLuau(parts, blueprint.name)
  return { parts, luauCode, partCount: parts.length }
}

// ─── Blueprint Prompt for AI ─────────────────────────────────────────────────
export const BLUEPRINT_INSTRUCTION = `You can create MASSIVE detailed builds by outputting a JSON blueprint instead of Luau code.

When the user asks for something complex (building, castle, town, scene), output a blueprint in this format:

\`\`\`blueprint
{
  "name": "Medieval Castle",
  "style": "medieval",
  "mood": "epic and imposing",
  "buildings": [
    {
      "name": "Main Keep",
      "type": "castle",
      "position": [0, 0, 0],
      "width": 40,
      "depth": 40,
      "floors": 2,
      "roofStyle": "pitched",
      "rooms": [
        { "name": "Throne Room", "type": "throne", "floor": 0, "windowCount": 4, "hasDoor": true },
        { "name": "Great Hall", "type": "dining", "floor": 0, "windowCount": 6, "hasDoor": false },
        { "name": "Royal Bedroom", "type": "bedroom", "floor": 1, "windowCount": 3, "hasDoor": false },
        { "name": "Library", "type": "library", "floor": 1, "windowCount": 2, "hasDoor": false }
      ],
      "features": ["chimney", "porch"]
    }
  ],
  "outdoor": {
    "trees": 8,
    "paths": true,
    "fence": true,
    "streetLights": 6,
    "benches": 4,
    "garden": true
  }
}
\`\`\`

Available styles: medieval, modern, rustic, fantasy, scifi, japanese, horror, pirate, western, tropical, underwater, space
Available room types: living, kitchen, bedroom, bathroom, dining, library, throne, storage, workshop, tavern, shop, hallway, office, lab, armory
Available building types: house, castle, tower, shop, tavern, church, barn, warehouse, mansion, cabin, fortress, palace
Available features: porch (with railing+columns+steps), balcony (with railing+brackets, requires 2+ floors), chimney (with cap), tower (with battlements+cone roof+arrow slits), garage (with car+driveway), garden (with flowers+soil bed+watering can)

The system auto-generates: walls with trim+baseboard+crown molding, windows with glass+frames+sills, doors with frames+knobs, furniture per room type, lighting, landscaping, fencing, paths, trees, fountains, market stalls (medieval/fantasy), gravestones (horror), coral (underwater).

A blueprint with 2 buildings, 6 rooms, and outdoor features produces 400-1000+ parts automatically. Use blueprints for ANY complex build request. ALWAYS prefer blueprints over raw Luau for buildings, castles, towns, maps, and scenes.`
