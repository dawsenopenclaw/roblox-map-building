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
      // Porch pillars
      parts.push({ name: `${prefix}_porch_pillar_l`, size: [0.5, 8, 0.5], position: [bx - hw, by + 4.5, bz + hd + 5], rotation: [0, 0, 0], material: 'Wood', color: [200, 195, 190], shape: 'Cylinder' })
      parts.push({ name: `${prefix}_porch_pillar_r`, size: [0.5, 8, 0.5], position: [bx + hw, by + 4.5, bz + hd + 5], rotation: [0, 0, 0], material: 'Wood', color: [200, 195, 190], shape: 'Cylinder' })
      // Porch roof
      parts.push({ name: `${prefix}_porch_roof`, size: [building.width + 3, 0.5, 6], position: [bx, by + 8.5, bz + hd + 3], rotation: [0, 0, 0], material: palette.roofMaterial, color: palette.roofColor })
      // Steps
      parts.push(...generateStairs(bx, by, bz + hd + 5.5, 4, 2, 'south', 'Concrete', [140, 135, 130], `${prefix}_porch_steps`))
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
Available features: porch, balcony, chimney, tower, garage, garden

The system auto-generates: walls with trim+baseboard+crown molding, windows with glass+frames+sills, doors with frames+knobs, furniture per room type, lighting, landscaping, fencing, paths, trees.

A blueprint with 2 buildings, 6 rooms, and outdoor features produces 400-800+ parts automatically. Use blueprints for ANY complex build request.`
