/**
 * world-planner.ts — Zone-based world builder for 10K-50K part games.
 *
 * Breaks a full game into 10-25 zones. Each zone builds procedurally
 * using mega-builder primitives (zero AI token cost for geometry).
 * Anti-ugly pass reviews each zone. Parts sent in 500-part batches.
 *
 * Zone types: spawn_hub, shop_district, battle_arena, housing,
 * nature, industrial, underground, sky, beach, castle
 */

import 'server-only'
import type { BuildPart } from './mega-builder'
import {
  generateFloor, generateTree, generateBush, generateRock,
  generateLampPost, generateFountain, generateMarketStall,
  generatePath, generateShop, generateHouse, generatePointLight,
  generateBox, generateRoof, generateWindow, generateDoor,
  generateStairs, generateChair, generateTable, generateBed,
  generateBookshelf, generateFireplace, partsToLuau,
} from './mega-builder'
import { antiUglyCheck } from './anti-ugly'

// ─── Types ──────────────────────────────────────────────────────────────────

export type ZoneType =
  | 'spawn_hub' | 'shop_district' | 'battle_arena' | 'housing'
  | 'nature' | 'industrial' | 'castle' | 'beach'

export interface ZoneDef {
  id: string
  type: ZoneType
  name: string
  position: [number, number, number]
  size: [number, number, number]
  estimatedParts: number
}

export interface ZonePlan {
  id: string
  title: string
  gameType: string
  zones: ZoneDef[]
  totalEstimatedParts: number
}

export interface ZoneBuildResult {
  zoneId: string
  parts: BuildPart[]
  luauCode: string
  partCount: number
  antiUglyScore: number
}

export interface WorldBuildProgress {
  worldId: string
  status: 'planning' | 'building' | 'connecting' | 'complete' | 'failed'
  currentZone: string | null
  completedZones: number
  totalZones: number
  totalParts: number
  progress: number
  zoneResults: ZoneBuildResult[]
  errors: string[]
}

// ─── Zone Layout ────────────────────────────────────────────────────────────

const ZONE_TEMPLATES: Record<string, { zones: Array<{ type: ZoneType; name: string; size: [number, number, number]; parts: number }> }> = {
  tycoon: {
    zones: [
      { type: 'spawn_hub', name: 'Spawn Lobby', size: [120, 50, 120], parts: 600 },
      { type: 'shop_district', name: 'Shop Row', size: [150, 40, 80], parts: 800 },
      { type: 'industrial', name: 'Factory Floor', size: [180, 60, 120], parts: 900 },
      { type: 'housing', name: 'Player Plots', size: [200, 40, 200], parts: 700 },
      { type: 'nature', name: 'Central Park', size: [120, 50, 120], parts: 500 },
    ],
  },
  rpg: {
    zones: [
      { type: 'spawn_hub', name: 'Starting Village', size: [150, 50, 150], parts: 800 },
      { type: 'nature', name: 'Enchanted Forest', size: [200, 80, 200], parts: 700 },
      { type: 'castle', name: 'Dark Castle', size: [150, 100, 150], parts: 1000 },
      { type: 'shop_district', name: 'Market Square', size: [120, 40, 120], parts: 600 },
      { type: 'battle_arena', name: 'Arena of Champions', size: [100, 40, 100], parts: 500 },
      { type: 'housing', name: 'Player Houses', size: [160, 40, 160], parts: 600 },
    ],
  },
  simulator: {
    zones: [
      { type: 'spawn_hub', name: 'Hub World', size: [120, 50, 120], parts: 600 },
      { type: 'nature', name: 'Collection Zone 1', size: [150, 50, 150], parts: 500 },
      { type: 'shop_district', name: 'Pet Shop', size: [100, 40, 80], parts: 500 },
      { type: 'battle_arena', name: 'Boss Arena', size: [100, 50, 100], parts: 400 },
      { type: 'nature', name: 'Collection Zone 2', size: [150, 50, 150], parts: 500 },
    ],
  },
  obby: {
    zones: [
      { type: 'spawn_hub', name: 'Checkpoint Lobby', size: [80, 40, 80], parts: 400 },
      { type: 'battle_arena', name: 'Easy Stage', size: [60, 80, 200], parts: 500 },
      { type: 'battle_arena', name: 'Medium Stage', size: [60, 100, 200], parts: 600 },
      { type: 'battle_arena', name: 'Hard Stage', size: [60, 120, 200], parts: 700 },
      { type: 'castle', name: 'Final Boss', size: [100, 80, 100], parts: 500 },
    ],
  },
  default: {
    zones: [
      { type: 'spawn_hub', name: 'Spawn Area', size: [120, 50, 120], parts: 600 },
      { type: 'shop_district', name: 'Town Center', size: [150, 40, 100], parts: 700 },
      { type: 'nature', name: 'Wilderness', size: [200, 60, 200], parts: 600 },
      { type: 'housing', name: 'Neighborhood', size: [160, 40, 160], parts: 600 },
      { type: 'battle_arena', name: 'PvP Zone', size: [100, 40, 100], parts: 400 },
    ],
  },
}

function detectGameType(prompt: string): string {
  const lower = prompt.toLowerCase()
  if (/tycoon|factory|idle|millionaire|money/i.test(lower)) return 'tycoon'
  if (/rpg|quest|adventure|dungeon|dragon|knight|fantasy/i.test(lower)) return 'rpg'
  if (/simulator|sim|collect|pet|mining|clicking/i.test(lower)) return 'simulator'
  if (/obby|obstacle|parkour|platformer/i.test(lower)) return 'obby'
  return 'default'
}

/**
 * Generate a zone plan from a user prompt. Returns zones with positions.
 */
export function generateZonePlan(prompt: string): ZonePlan {
  const gameType = detectGameType(prompt)
  const template = ZONE_TEMPLATES[gameType] || ZONE_TEMPLATES.default
  const id = `world_${Date.now()}`

  // Layout zones in a grid, spawn at center
  const zones: ZoneDef[] = []
  const spacing = 30 // gap between zones
  const cols = Math.ceil(Math.sqrt(template.zones.length))

  for (let i = 0; i < template.zones.length; i++) {
    const t = template.zones[i]
    const col = i % cols
    const row = Math.floor(i / cols)
    // Offset from center
    const totalWidth = cols * (200 + spacing)
    const totalDepth = Math.ceil(template.zones.length / cols) * (200 + spacing)
    const x = col * (200 + spacing) - totalWidth / 2 + 100
    const z = row * (200 + spacing) - totalDepth / 2 + 100

    zones.push({
      id: `zone_${i}_${t.type}`,
      type: t.type,
      name: t.name,
      position: [x, 0, z],
      size: t.size,
      estimatedParts: t.parts,
    })
  }

  return {
    id,
    title: `${gameType.charAt(0).toUpperCase() + gameType.slice(1)} World`,
    gameType,
    zones,
    totalEstimatedParts: zones.reduce((sum, z) => sum + z.estimatedParts, 0),
  }
}

// ─── Zone Builders (procedural, zero AI cost) ───────────────────────────────

function buildSpawnHub(zone: ZoneDef): BuildPart[] {
  const [cx, cy, cz] = zone.position
  const parts: BuildPart[] = []

  // Ground
  parts.push(...generateFloor(cx, cy, cz, zone.size[0], zone.size[2], 'Concrete', [160, 155, 150]))

  // Central fountain
  parts.push(...generateFountain(cx, cy, cz))

  // 4 paths leading outward
  parts.push(...generatePath(cx, cz - 10, cx, cz - zone.size[2] / 2, cy, 6))
  parts.push(...generatePath(cx, cz + 10, cx, cz + zone.size[2] / 2, cy, 6))
  parts.push(...generatePath(cx - 10, cz, cx - zone.size[0] / 2, cz, cy, 6))
  parts.push(...generatePath(cx + 10, cz, cx + zone.size[0] / 2, cz, cy, 6))

  // Lamp posts around fountain
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2
    parts.push(...generateLampPost(cx + Math.cos(angle) * 20, cy, cz + Math.sin(angle) * 20))
  }

  // Welcome sign area
  parts.push({
    name: 'welcome_sign', size: [8, 4, 0.5], position: [cx, cy + 8, cz - 25],
    rotation: [0, 0, 0], material: 'Wood', color: [120, 80, 40],
  })

  // Benches
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2
    const bx = cx + Math.cos(angle) * 15
    const bz = cz + Math.sin(angle) * 15
    parts.push(
      { name: `bench_seat_${i}`, size: [4, 0.3, 1.5], position: [bx, cy + 1.5, bz], rotation: [0, angle * (180 / Math.PI), 0], material: 'WoodPlanks', color: [130, 90, 50] },
      { name: `bench_back_${i}`, size: [4, 1.5, 0.3], position: [bx, cy + 2.25, bz + 0.6], rotation: [0, angle * (180 / Math.PI), 0], material: 'WoodPlanks', color: [120, 80, 45] },
    )
  }

  // Decorative trees
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2
    parts.push(...generateTree(cx + Math.cos(angle) * 35, cy, cz + Math.sin(angle) * 35, 0.8 + Math.random() * 0.4))
  }

  // Bushes
  for (let i = 0; i < 12; i++) {
    const angle = Math.random() * Math.PI * 2
    const dist = 20 + Math.random() * 25
    parts.push(...generateBush(cx + Math.cos(angle) * dist, cy, cz + Math.sin(angle) * dist, 0.6 + Math.random() * 0.6))
  }

  return parts
}

function buildShopDistrict(zone: ZoneDef): BuildPart[] {
  const [cx, cy, cz] = zone.position
  const parts: BuildPart[] = []

  // Road down the center
  parts.push(...generateFloor(cx, cy, cz, 12, zone.size[2] - 20, 'Asphalt', [50, 50, 50]))

  // Sidewalks
  parts.push(...generateFloor(cx - 20, cy + 0.1, cz, 20, zone.size[2] - 20, 'Concrete', [180, 175, 165]))
  parts.push(...generateFloor(cx + 20, cy + 0.1, cz, 20, zone.size[2] - 20, 'Concrete', [180, 175, 165]))

  // Shops on both sides
  const shopCount = Math.floor(zone.size[2] / 30)
  for (let i = 0; i < shopCount; i++) {
    const shopZ = cz - zone.size[2] / 2 + 20 + i * 28
    parts.push(...generateShop(cx - 28, cy, shopZ, 14, 10, `Shop_L${i + 1}`))
    parts.push(...generateShop(cx + 28, cy, shopZ, 14, 10, `Shop_R${i + 1}`))
  }

  // Lamp posts along road
  for (let i = 0; i < shopCount + 1; i++) {
    const lz = cz - zone.size[2] / 2 + 15 + i * 28
    parts.push(...generateLampPost(cx - 8, cy, lz))
    parts.push(...generateLampPost(cx + 8, cy, lz))
  }

  // Market stalls
  parts.push(...generateMarketStall(cx - 15, cy, cz))
  parts.push(...generateMarketStall(cx + 15, cy, cz, 180))

  return parts
}

function buildBattleArena(zone: ZoneDef): BuildPart[] {
  const [cx, cy, cz] = zone.position
  const parts: BuildPart[] = []

  // Arena floor (circular-ish using large part)
  parts.push(...generateFloor(cx, cy, cz, zone.size[0] - 20, zone.size[2] - 20, 'Cobblestone', [140, 130, 115]))

  // Arena walls (4 sides)
  const w = zone.size[0] / 2 - 10, d = zone.size[2] / 2 - 10
  parts.push({ name: 'arena_wall_n', size: [w * 2, 8, 2], position: [cx, cy + 4, cz - d], rotation: [0, 0, 0], material: 'Brick', color: [150, 100, 70] })
  parts.push({ name: 'arena_wall_s', size: [w * 2, 8, 2], position: [cx, cy + 4, cz + d], rotation: [0, 0, 0], material: 'Brick', color: [150, 100, 70] })
  parts.push({ name: 'arena_wall_e', size: [2, 8, d * 2], position: [cx + w, cy + 4, cz], rotation: [0, 0, 0], material: 'Brick', color: [145, 95, 65] })
  parts.push({ name: 'arena_wall_w', size: [2, 8, d * 2], position: [cx - w, cy + 4, cz], rotation: [0, 0, 0], material: 'Brick', color: [155, 105, 75] })

  // Cover objects
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2
    const dist = 15 + Math.random() * 10
    parts.push(...generateRock(cx + Math.cos(angle) * dist, cy, cz + Math.sin(angle) * dist, 1.5 + Math.random()))
  }

  // Center platform
  parts.push({ name: 'center_platform', size: [8, 1, 8], position: [cx, cy + 0.5, cz], rotation: [0, 45, 0], material: 'Granite', color: [100, 95, 90] })

  // Torch pillars at corners
  for (const [tx, tz] of [[w - 2, d - 2], [-w + 2, d - 2], [w - 2, -d + 2], [-w + 2, -d + 2]]) {
    parts.push({ name: `pillar_${tx}_${tz}`, size: [6, 2, 2], position: [cx + tx, cy + 3, cz + tz], rotation: [0, 0, 0], material: 'Concrete', color: [120, 115, 110], shape: 'Cylinder' })
    parts.push({
      name: `torch_${tx}_${tz}`, size: [0.8, 0.8, 0.8], position: [cx + tx, cy + 6.5, cz + tz], rotation: [0, 0, 0], material: 'Neon', color: [255, 150, 50], shape: 'Ball',
      children: [{ className: 'PointLight', properties: { Brightness: 3, Range: 30, Color: [255, 180, 80] } }],
    })
  }

  return parts
}

function buildHousingArea(zone: ZoneDef): BuildPart[] {
  const [cx, cy, cz] = zone.position
  const parts: BuildPart[] = []

  // Grass ground
  parts.push(...generateFloor(cx, cy - 0.1, cz, zone.size[0], zone.size[2], 'Grass', [80, 130, 60]))

  // Grid of houses
  const cols = 3, rows = 3, spacing = 40
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const hx = cx + (c - 1) * spacing
      const hz = cz + (r - 1) * spacing
      const floors = 1 + Math.floor(Math.random() * 2)
      parts.push(...generateHouse(hx, cy, hz, 16 + Math.random() * 4, 12, floors, `House_${r}_${c}`))
      // Front yard tree
      parts.push(...generateTree(hx + 10, cy, hz - 10, 0.7 + Math.random() * 0.3))
      // Mailbox
      parts.push(
        { name: `mailbox_post_${r}_${c}`, size: [3, 0.3, 0.3], position: [hx - 8, cy + 1.5, hz - 8], rotation: [0, 0, 0], material: 'Wood', color: [100, 70, 35], shape: 'Cylinder' },
        { name: `mailbox_box_${r}_${c}`, size: [1.5, 1, 1], position: [hx - 8, cy + 3.2, hz - 8], rotation: [0, 0, 0], material: 'Metal', color: [60, 60, 65] },
      )
    }
  }

  // Sidewalks between houses
  parts.push(...generatePath(cx - spacing, cz - spacing * 1.5, cx - spacing, cz + spacing * 1.5, cy, 3, 'Concrete', [175, 170, 160]))
  parts.push(...generatePath(cx + spacing, cz - spacing * 1.5, cx + spacing, cz + spacing * 1.5, cy, 3, 'Concrete', [175, 170, 160]))

  return parts
}

function buildNatureZone(zone: ZoneDef): BuildPart[] {
  const [cx, cy, cz] = zone.position
  const parts: BuildPart[] = []

  // Grass ground
  parts.push(...generateFloor(cx, cy - 0.1, cz, zone.size[0], zone.size[2], 'Grass', [75, 125, 55]))

  // Dense forest
  for (let i = 0; i < 25; i++) {
    const tx = cx + (Math.random() - 0.5) * (zone.size[0] - 20)
    const tz = cz + (Math.random() - 0.5) * (zone.size[2] - 20)
    parts.push(...generateTree(tx, cy, tz, 0.6 + Math.random() * 0.8))
  }

  // Scattered bushes
  for (let i = 0; i < 20; i++) {
    const bx = cx + (Math.random() - 0.5) * (zone.size[0] - 10)
    const bz = cz + (Math.random() - 0.5) * (zone.size[2] - 10)
    parts.push(...generateBush(bx, cy, bz, 0.5 + Math.random() * 0.8))
  }

  // Rocks
  for (let i = 0; i < 10; i++) {
    const rx = cx + (Math.random() - 0.5) * (zone.size[0] - 15)
    const rz = cz + (Math.random() - 0.5) * (zone.size[2] - 15)
    parts.push(...generateRock(rx, cy, rz, 0.8 + Math.random() * 1.5))
  }

  // Winding path through forest
  parts.push(...generatePath(cx - zone.size[0] / 2 + 10, cz, cx + zone.size[0] / 2 - 10, cz, cy, 4, 'Ground', [130, 110, 80]))

  // Pond in clearing
  parts.push({
    name: 'pond', size: [1, 20, 20], position: [cx + 30, cy - 0.3, cz + 20], rotation: [0, 0, 0],
    material: 'Glass', color: [60, 140, 200], transparency: 0.4, shape: 'Cylinder',
  })

  return parts
}

function buildIndustrialZone(zone: ZoneDef): BuildPart[] {
  const [cx, cy, cz] = zone.position
  const parts: BuildPart[] = []

  // Concrete floor
  parts.push(...generateFloor(cx, cy, cz, zone.size[0], zone.size[2], 'Concrete', [140, 140, 140]))

  // Factory buildings
  for (let i = 0; i < 3; i++) {
    const fx = cx - 50 + i * 50
    parts.push(...generateBox(fx, cy, cz, 30, 15, 20, 'Concrete', [120, 120, 125]))
    parts.push(...generateRoof(fx, cy + 15, cz, 32, 5, 22, 'Metal', [80, 80, 85]))
    parts.push(...generateDoor(fx, cy, cz - 10, 5, 8))
    parts.push(...generateWindow(fx - 10, cy + 8, cz - 10, 4, 3))
    parts.push(...generateWindow(fx + 10, cy + 8, cz - 10, 4, 3))
    // Smokestacks
    parts.push({ name: `stack_${i}`, size: [12, 2, 2], position: [fx + 8, cy + 21, cz + 5], rotation: [0, 0, 0], material: 'Metal', color: [70, 70, 75], shape: 'Cylinder' })
  }

  // Loading dock
  parts.push({ name: 'dock_platform', size: [40, 3, 8], position: [cx, cy + 1.5, cz + zone.size[2] / 2 - 10], rotation: [0, 0, 0], material: 'Concrete', color: [150, 145, 140] })

  // Cargo containers
  for (let i = 0; i < 4; i++) {
    const colors: [number, number, number][] = [[180, 50, 50], [50, 100, 180], [50, 150, 50], [200, 150, 50]]
    parts.push({ name: `container_${i}`, size: [12, 6, 5], position: [cx - 20 + i * 14, cy + 3, cz + zone.size[2] / 2 - 25], rotation: [0, 0, 0], material: 'Metal', color: colors[i] })
  }

  return parts
}

function buildCastleZone(zone: ZoneDef): BuildPart[] {
  const [cx, cy, cz] = zone.position
  const parts: BuildPart[] = []

  // Castle ground
  parts.push(...generateFloor(cx, cy, cz, zone.size[0], zone.size[2], 'Cobblestone', [130, 125, 115]))

  // Main keep
  parts.push(...generateBox(cx, cy, cz, 30, 20, 25, 'Brick', [140, 130, 110]))
  parts.push(...generateRoof(cx, cy + 20, cz, 32, 6, 27, 'Slate', [70, 60, 50]))
  parts.push(...generateDoor(cx, cy, cz - 12.5, 5, 10))
  for (let i = -1; i <= 1; i += 2) {
    parts.push(...generateWindow(cx + i * 8, cy + 12, cz - 12.5, 3, 4))
  }

  // Corner towers (4)
  for (const [tx, tz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    const towerX = cx + tx * 20, towerZ = cz + tz * 18
    parts.push({ name: `tower_${tx}_${tz}`, size: [25, 6, 6], position: [towerX, cy + 12.5, towerZ], rotation: [0, 0, 0], material: 'Brick', color: [135, 125, 105], shape: 'Cylinder' })
    // Battlements on top
    for (let b = 0; b < 8; b++) {
      const a = (b / 8) * Math.PI * 2
      parts.push({ name: `battlement_${tx}_${tz}_${b}`, size: [1.5, 2, 1.5], position: [towerX + Math.cos(a) * 3.5, cy + 26, towerZ + Math.sin(a) * 3.5], rotation: [0, 0, 0], material: 'Brick', color: [145, 135, 115] })
    }
    // Torch
    parts.push({
      name: `tower_torch_${tx}_${tz}`, size: [0.6, 0.6, 0.6], position: [towerX, cy + 26, towerZ], rotation: [0, 0, 0], material: 'Neon', color: [255, 160, 50], shape: 'Ball',
      children: [{ className: 'PointLight', properties: { Brightness: 2, Range: 30, Color: [255, 180, 80] } }],
    })
  }

  // Courtyard trees
  parts.push(...generateTree(cx + 10, cy, cz + 5, 0.7))
  parts.push(...generateTree(cx - 10, cy, cz + 5, 0.8))
  parts.push(...generateFountain(cx, cy, cz + 8, 4))

  return parts
}

function buildBeachZone(zone: ZoneDef): BuildPart[] {
  const [cx, cy, cz] = zone.position
  const parts: BuildPart[] = []

  // Sand ground
  parts.push(...generateFloor(cx, cy - 0.1, cz, zone.size[0], zone.size[2] / 2, 'Sand', [210, 190, 140]))
  // Water
  parts.push({
    name: 'ocean', size: [zone.size[0], 1, zone.size[2] / 2],
    position: [cx, cy - 1, cz + zone.size[2] / 4], rotation: [0, 0, 0],
    material: 'Glass', color: [40, 130, 200], transparency: 0.35,
  })

  // Palm trees (cylinders with ball tops)
  for (let i = 0; i < 6; i++) {
    const px = cx + (Math.random() - 0.5) * (zone.size[0] - 30)
    const pz = cz - zone.size[2] / 4 + Math.random() * 20
    parts.push(
      { name: `palm_trunk_${i}`, size: [10, 1, 1], position: [px, cy + 5, pz], rotation: [0, 0, Math.random() * 8 - 4], material: 'Wood', color: [110, 80, 40], shape: 'Cylinder' },
      { name: `palm_top_${i}`, size: [5, 3, 5], position: [px, cy + 10.5, pz], rotation: [0, Math.random() * 360, 0], material: 'Grass', color: [50, 140, 40], shape: 'Ball' },
      { name: `palm_top2_${i}`, size: [4, 2, 4], position: [px + 1, cy + 11, pz - 1], rotation: [0, Math.random() * 360, 0], material: 'Grass', color: [60, 150, 45], shape: 'Ball' },
    )
  }

  // Beach umbrellas
  for (let i = 0; i < 4; i++) {
    const ux = cx - 30 + i * 20
    const uz = cz - zone.size[2] / 4 + 5
    parts.push(
      { name: `umbrella_pole_${i}`, size: [6, 0.3, 0.3], position: [ux, cy + 3, uz], rotation: [0, 0, 0], material: 'Wood', color: [180, 160, 120], shape: 'Cylinder' },
      { name: `umbrella_top_${i}`, size: [0.5, 5, 5], position: [ux, cy + 6.2, uz], rotation: [0, 0, 0], material: 'Fabric', color: i % 2 === 0 ? [200, 60, 60] : [60, 60, 200], shape: 'Cylinder' },
    )
  }

  // Dock
  parts.push({ name: 'dock', size: [4, 0.5, 25], position: [cx + 30, cy + 0.5, cz + zone.size[2] / 4 - 5], rotation: [0, 0, 0], material: 'WoodPlanks', color: [120, 85, 45] })
  for (let i = 0; i < 5; i++) {
    parts.push({ name: `dock_post_${i}`, size: [3, 0.5, 0.5], position: [cx + 30, cy - 0.5, cz + zone.size[2] / 4 - 15 + i * 6], rotation: [0, 0, 0], material: 'Wood', color: [100, 70, 35], shape: 'Cylinder' })
  }

  return parts
}

const ZONE_BUILDERS: Record<ZoneType, (zone: ZoneDef) => BuildPart[]> = {
  spawn_hub: buildSpawnHub,
  shop_district: buildShopDistrict,
  battle_arena: buildBattleArena,
  housing: buildHousingArea,
  nature: buildNatureZone,
  industrial: buildIndustrialZone,
  castle: buildCastleZone,
  beach: buildBeachZone,
}

// ─── World Builder Orchestrator ─────────────────────────────────────────────

/**
 * Build an entire world zone by zone. Returns progress updates via callback.
 * Each zone is built procedurally, run through anti-ugly, converted to Luau,
 * and queued for Studio in 500-part batches.
 */
export async function buildWorld(
  plan: ZonePlan,
  sessionId: string,
  onProgress: (progress: WorldBuildProgress) => void,
): Promise<WorldBuildProgress> {
  const progress: WorldBuildProgress = {
    worldId: plan.id,
    status: 'building',
    currentZone: null,
    completedZones: 0,
    totalZones: plan.zones.length,
    totalParts: 0,
    progress: 0,
    zoneResults: [],
    errors: [],
  }

  onProgress(progress)

  for (let i = 0; i < plan.zones.length; i++) {
    const zone = plan.zones[i]
    progress.currentZone = zone.name
    progress.progress = Math.round((i / plan.zones.length) * 100)
    onProgress(progress)

    try {
      // Build zone procedurally
      const builder = ZONE_BUILDERS[zone.type]
      if (!builder) {
        progress.errors.push(`No builder for zone type: ${zone.type}`)
        continue
      }

      let parts = builder(zone)
      console.log(`[WorldPlanner] Zone "${zone.name}" (${zone.type}): ${parts.length} parts`)

      // Anti-ugly pass
      const uglyCheck = antiUglyCheck(parts, zone.type)
      parts = uglyCheck.fixedParts
      console.log(`[WorldPlanner] Anti-ugly score: ${uglyCheck.score}/100, parts: ${uglyCheck.originalPartCount}→${uglyCheck.fixedPartCount}`)

      // Convert to Luau
      const luau = partsToLuau(parts, `${plan.title}_${zone.name}`.replace(/\s+/g, '_'))

      // Queue for Studio in batches
      try {
        const { queueCommand } = await import('@/lib/studio-session')
        const BATCH_SIZE = 500
        const batches = Math.ceil(parts.length / BATCH_SIZE)

        for (let b = 0; b < batches; b++) {
          // Each batch gets its own Luau code with a subset of parts
          const batchParts = parts.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE)
          const batchLuau = partsToLuau(batchParts, `${zone.name}_batch${b}`.replace(/\s+/g, '_'))
          await queueCommand(sessionId, { type: 'execute_luau', data: { code: batchLuau, commands: [] } })
          // Brief delay between batches
          if (b < batches - 1) {
            await new Promise(r => setTimeout(r, 1500))
          }
        }
      } catch (studioErr) {
        console.warn(`[WorldPlanner] Studio push failed for ${zone.name}:`, studioErr)
        progress.errors.push(`Studio push failed: ${zone.name}`)
      }

      progress.zoneResults.push({
        zoneId: zone.id,
        parts,
        luauCode: luau,
        partCount: parts.length,
        antiUglyScore: uglyCheck.score,
      })
      progress.totalParts += parts.length
      progress.completedZones = i + 1
    } catch (err) {
      console.error(`[WorldPlanner] Zone "${zone.name}" failed:`, err)
      progress.errors.push(`Zone failed: ${zone.name} — ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  progress.status = progress.errors.length > plan.zones.length / 2 ? 'failed' : 'complete'
  progress.progress = 100
  progress.currentZone = null
  onProgress(progress)

  console.log(`[WorldPlanner] World complete: ${progress.totalParts} parts across ${progress.completedZones}/${progress.totalZones} zones`)
  return progress
}
