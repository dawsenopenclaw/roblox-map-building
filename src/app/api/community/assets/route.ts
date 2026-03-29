import { NextRequest, NextResponse } from 'next/server'

// ─── Types ─────────────────────────────────────────────────────────────────────

export type AssetCategory =
  | 'Buildings'
  | 'Vehicles'
  | 'Nature'
  | 'Props'
  | 'Characters'
  | 'Furniture'
  | 'Weapons'

export interface CommunityAsset {
  id: string
  name: string
  description: string
  creator: string
  thumbnailUrl: string
  mesh_url: string
  category: AssetCategory
  polyCount: number
  style: 'realistic' | 'low-poly' | 'stylized' | 'cartoon'
  downloads: number
  rating: number
  reviewCount: number
  tags: string[]
  createdAt: string
  fileSize: string
  format: 'GLB' | 'FBX' | 'OBJ'
  license: 'free' | 'commercial'
}

// ─── Demo Asset Library (25 entries) ──────────────────────────────────────────

const COMMUNITY_ASSETS: CommunityAsset[] = [
  // ── Buildings ──────────────────────────────────────────────────────────────
  {
    id: 'bld-001',
    name: 'Medieval Castle Tower',
    description: 'Tall stone castle tower with crenellations, arrow slits, and a conical roof. Perfect for medieval fortifications. Includes interior staircase geometry.',
    creator: 'StoneForge3D',
    thumbnailUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/BrainStem/screenshot/screenshot.jpg',
    mesh_url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Box/glTF-Binary/Box.glb',
    category: 'Buildings',
    polyCount: 2100,
    style: 'realistic',
    downloads: 4820,
    rating: 4.9,
    reviewCount: 312,
    tags: ['castle', 'medieval', 'tower', 'stone', 'fantasy'],
    createdAt: '2026-01-15T00:00:00Z',
    fileSize: '1.8 MB',
    format: 'GLB',
    license: 'free',
  },
  {
    id: 'bld-002',
    name: 'Modern House',
    description: 'Clean contemporary single-story house with flat roof, large windows, and attached garage. Low-poly optimized for game scenes.',
    creator: 'ArchViz3D',
    thumbnailUrl: 'https://market-assets.fra1.cdn.digitaloceanspaces.com/market-assets/models/house-type-01/thumbnail.jpeg',
    mesh_url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Box/glTF-Binary/Box.glb',
    category: 'Buildings',
    polyCount: 820,
    style: 'low-poly',
    downloads: 6340,
    rating: 4.7,
    reviewCount: 445,
    tags: ['house', 'modern', 'residential', 'suburban', 'architecture'],
    createdAt: '2025-11-08T00:00:00Z',
    fileSize: '680 KB',
    format: 'GLB',
    license: 'free',
  },
  {
    id: 'bld-003',
    name: 'Street Lamp (Iron)',
    description: 'Classic Victorian iron street lamp post with warm glowing bulb. Simple geometry, great for city streets and park paths.',
    creator: 'PropFactory',
    thumbnailUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/CesiumMilkTruck/screenshot/screenshot.gif',
    mesh_url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Box/glTF-Binary/Box.glb',
    category: 'Props',
    polyCount: 210,
    style: 'realistic',
    downloads: 8900,
    rating: 4.8,
    reviewCount: 621,
    tags: ['lamp', 'street', 'light', 'urban', 'victorian'],
    createdAt: '2025-09-20T00:00:00Z',
    fileSize: '120 KB',
    format: 'GLB',
    license: 'free',
  },
  {
    id: 'bld-004',
    name: 'Ruined Stone Wall',
    description: 'Crumbled ancient stone wall segment with moss and weathering. Great for ruins, dungeons, and post-apocalyptic scenes.',
    creator: 'RuinsWorkshop',
    thumbnailUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/DamagedHelmet/screenshot/screenshot.jpg',
    mesh_url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Box/glTF-Binary/Box.glb',
    category: 'Buildings',
    polyCount: 940,
    style: 'realistic',
    downloads: 3210,
    rating: 4.6,
    reviewCount: 187,
    tags: ['ruins', 'wall', 'stone', 'medieval', 'dungeon'],
    createdAt: '2026-02-01T00:00:00Z',
    fileSize: '920 KB',
    format: 'GLB',
    license: 'free',
  },
  {
    id: 'bld-005',
    name: 'Fantasy Tavern',
    description: 'Cozy medieval tavern building with thatched roof, hanging sign, and warm window glow. Two floors with visible interior beams.',
    creator: 'TavernCraft',
    thumbnailUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/BrainStem/screenshot/screenshot.jpg',
    mesh_url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Box/glTF-Binary/Box.glb',
    category: 'Buildings',
    polyCount: 1650,
    style: 'stylized',
    downloads: 5570,
    rating: 4.9,
    reviewCount: 398,
    tags: ['tavern', 'inn', 'medieval', 'fantasy', 'building'],
    createdAt: '2026-01-28T00:00:00Z',
    fileSize: '1.4 MB',
    format: 'GLB',
    license: 'free',
  },

  // ── Vehicles ───────────────────────────────────────────────────────────────
  {
    id: 'veh-001',
    name: 'Sports Car (Red)',
    description: 'Sleek low-profile sports car with detailed exterior. Separate wheel meshes for rotation. Realistic paint and chrome materials.',
    creator: 'AutoMesh3D',
    thumbnailUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/CesiumMilkTruck/screenshot/screenshot.gif',
    mesh_url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Box/glTF-Binary/Box.glb',
    category: 'Vehicles',
    polyCount: 3200,
    style: 'realistic',
    downloads: 7120,
    rating: 4.8,
    reviewCount: 512,
    tags: ['car', 'sports', 'vehicle', 'racing', 'automobile'],
    createdAt: '2025-12-10T00:00:00Z',
    fileSize: '2.4 MB',
    format: 'GLB',
    license: 'free',
  },
  {
    id: 'veh-002',
    name: 'Off-Road Truck',
    description: 'Heavy-duty 4x4 truck with chunky tires, lift kit, and roll cage. Optimized for open-world driving games.',
    creator: 'TruckMesh',
    thumbnailUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/CesiumMilkTruck/screenshot/screenshot.gif',
    mesh_url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Box/glTF-Binary/Box.glb',
    category: 'Vehicles',
    polyCount: 2800,
    style: 'realistic',
    downloads: 4450,
    rating: 4.7,
    reviewCount: 286,
    tags: ['truck', '4x4', 'offroad', 'vehicle', 'jeep'],
    createdAt: '2026-01-05T00:00:00Z',
    fileSize: '2.1 MB',
    format: 'GLB',
    license: 'free',
  },
  {
    id: 'veh-003',
    name: 'Wooden Sailing Ship',
    description: 'Classic tall ship with three masts, furled sails, and ornate stern. Ideal for pirate and naval adventure games.',
    creator: 'NavalForge',
    thumbnailUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/BrainStem/screenshot/screenshot.jpg',
    mesh_url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Box/glTF-Binary/Box.glb',
    category: 'Vehicles',
    polyCount: 4100,
    style: 'stylized',
    downloads: 3890,
    rating: 4.9,
    reviewCount: 341,
    tags: ['ship', 'boat', 'pirate', 'naval', 'sailing'],
    createdAt: '2026-02-14T00:00:00Z',
    fileSize: '3.2 MB',
    format: 'GLB',
    license: 'free',
  },

  // ── Nature ─────────────────────────────────────────────────────────────────
  {
    id: 'nat-001',
    name: 'Oak Tree (Stylized)',
    description: 'Beautiful stylized oak tree with lush canopy and textured bark. Available in summer and autumn color variants.',
    creator: 'PolyForest',
    thumbnailUrl: 'https://market-assets.fra1.cdn.digitaloceanspaces.com/market-assets/models/tree-oak/thumbnail.jpeg',
    mesh_url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Box/glTF-Binary/Box.glb',
    category: 'Nature',
    polyCount: 520,
    style: 'stylized',
    downloads: 12400,
    rating: 4.9,
    reviewCount: 872,
    tags: ['tree', 'oak', 'nature', 'forest', 'foliage'],
    createdAt: '2025-08-10T00:00:00Z',
    fileSize: '480 KB',
    format: 'GLB',
    license: 'free',
  },
  {
    id: 'nat-002',
    name: 'Boulder Pack (3 sizes)',
    description: 'Set of three natural rock boulders — small, medium, large — with realistic stone textures. Great for terrain dressing.',
    creator: 'TerrainKit',
    thumbnailUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/DamagedHelmet/screenshot/screenshot.jpg',
    mesh_url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Box/glTF-Binary/Box.glb',
    category: 'Nature',
    polyCount: 380,
    style: 'realistic',
    downloads: 9210,
    rating: 4.7,
    reviewCount: 634,
    tags: ['rock', 'boulder', 'stone', 'nature', 'terrain'],
    createdAt: '2025-10-01T00:00:00Z',
    fileSize: '340 KB',
    format: 'GLB',
    license: 'free',
  },
  {
    id: 'nat-003',
    name: 'Pine Tree (Winter)',
    description: 'Snow-dusted pine tree with detailed needle clusters. Three size variants included. Perfect for winter biomes.',
    creator: 'PolyForest',
    thumbnailUrl: 'https://market-assets.fra1.cdn.digitaloceanspaces.com/market-assets/models/tree-oak/thumbnail.jpeg',
    mesh_url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Box/glTF-Binary/Box.glb',
    category: 'Nature',
    polyCount: 440,
    style: 'stylized',
    downloads: 7650,
    rating: 4.8,
    reviewCount: 498,
    tags: ['pine', 'tree', 'winter', 'snow', 'conifer'],
    createdAt: '2025-11-15T00:00:00Z',
    fileSize: '420 KB',
    format: 'GLB',
    license: 'free',
  },
  {
    id: 'nat-004',
    name: 'Mushroom Cluster',
    description: 'Colorful cluster of fantasy mushrooms in varying heights. Glowing caps option included. Great for magical forest floors.',
    creator: 'FairyForge',
    thumbnailUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/BrainStem/screenshot/screenshot.jpg',
    mesh_url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Box/glTF-Binary/Box.glb',
    category: 'Nature',
    polyCount: 290,
    style: 'cartoon',
    downloads: 5430,
    rating: 4.6,
    reviewCount: 312,
    tags: ['mushroom', 'fantasy', 'forest', 'magic', 'nature'],
    createdAt: '2026-01-20T00:00:00Z',
    fileSize: '260 KB',
    format: 'GLB',
    license: 'free',
  },

  // ── Props ──────────────────────────────────────────────────────────────────
  {
    id: 'prp-001',
    name: 'Treasure Chest',
    description: 'Ornate wooden treasure chest with iron bands and a padlock. Separate lid mesh for open/close animation. Cartoon style.',
    creator: 'PropFactory',
    thumbnailUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/CesiumMilkTruck/screenshot/screenshot.gif',
    mesh_url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Box/glTF-Binary/Box.glb',
    category: 'Props',
    polyCount: 420,
    style: 'cartoon',
    downloads: 15200,
    rating: 5.0,
    reviewCount: 1041,
    tags: ['chest', 'treasure', 'loot', 'rpg', 'prop'],
    createdAt: '2025-07-01T00:00:00Z',
    fileSize: '380 KB',
    format: 'GLB',
    license: 'free',
  },
  {
    id: 'prp-002',
    name: 'Market Stall',
    description: 'Colorful wooden market stall with canopy, counter, and hanging goods. Perfect for town squares and bazaars.',
    creator: 'TavernCraft',
    thumbnailUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/BrainStem/screenshot/screenshot.jpg',
    mesh_url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Box/glTF-Binary/Box.glb',
    category: 'Props',
    polyCount: 560,
    style: 'stylized',
    downloads: 4780,
    rating: 4.7,
    reviewCount: 271,
    tags: ['market', 'stall', 'shop', 'medieval', 'town'],
    createdAt: '2026-02-08T00:00:00Z',
    fileSize: '490 KB',
    format: 'GLB',
    license: 'free',
  },
  {
    id: 'prp-003',
    name: 'Wooden Barrel',
    description: 'Classic wooden barrel with metal hoops. Four size variants and a stack configuration included.',
    creator: 'PropFactory',
    thumbnailUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/DamagedHelmet/screenshot/screenshot.jpg',
    mesh_url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Box/glTF-Binary/Box.glb',
    category: 'Props',
    polyCount: 160,
    style: 'realistic',
    downloads: 11300,
    rating: 4.8,
    reviewCount: 784,
    tags: ['barrel', 'container', 'wood', 'tavern', 'prop'],
    createdAt: '2025-06-15T00:00:00Z',
    fileSize: '140 KB',
    format: 'GLB',
    license: 'free',
  },
  {
    id: 'prp-004',
    name: 'Campfire',
    description: 'Campfire with log arrangement and stone ring. Particle-ready pivot points included for fire and smoke effects.',
    creator: 'OutdoorKit',
    thumbnailUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/CesiumMilkTruck/screenshot/screenshot.gif',
    mesh_url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Box/glTF-Binary/Box.glb',
    category: 'Props',
    polyCount: 240,
    style: 'stylized',
    downloads: 8850,
    rating: 4.9,
    reviewCount: 562,
    tags: ['campfire', 'fire', 'camp', 'outdoor', 'night'],
    createdAt: '2025-09-05T00:00:00Z',
    fileSize: '210 KB',
    format: 'GLB',
    license: 'free',
  },

  // ── Characters ─────────────────────────────────────────────────────────────
  {
    id: 'chr-001',
    name: 'Knight Warrior',
    description: 'Full-plate armored knight with sword and shield. Rigged for humanoid animations. Compatible with R15 skeleton.',
    creator: 'CharacterForge',
    thumbnailUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/BrainStem/screenshot/screenshot.jpg',
    mesh_url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Box/glTF-Binary/Box.glb',
    category: 'Characters',
    polyCount: 2800,
    style: 'stylized',
    downloads: 6720,
    rating: 4.8,
    reviewCount: 441,
    tags: ['knight', 'warrior', 'armor', 'medieval', 'character'],
    createdAt: '2026-01-12T00:00:00Z',
    fileSize: '2.2 MB',
    format: 'GLB',
    license: 'free',
  },
  {
    id: 'chr-002',
    name: 'Village Merchant',
    description: 'Friendly NPC merchant with apron, cap, and coin purse. Rigged with idle and talking animations included.',
    creator: 'NPCStudio',
    thumbnailUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/DamagedHelmet/screenshot/screenshot.jpg',
    mesh_url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Box/glTF-Binary/Box.glb',
    category: 'Characters',
    polyCount: 1900,
    style: 'cartoon',
    downloads: 4120,
    rating: 4.6,
    reviewCount: 223,
    tags: ['npc', 'merchant', 'villager', 'shop', 'character'],
    createdAt: '2026-02-18T00:00:00Z',
    fileSize: '1.6 MB',
    format: 'GLB',
    license: 'free',
  },

  // ── Furniture ──────────────────────────────────────────────────────────────
  {
    id: 'fur-001',
    name: 'Wooden Chair',
    description: 'Simple handcrafted wooden chair. Versatile prop for interiors, taverns, and houses. Includes variations with cushions.',
    creator: 'InteriorKit',
    thumbnailUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/CesiumMilkTruck/screenshot/screenshot.gif',
    mesh_url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Box/glTF-Binary/Box.glb',
    category: 'Furniture',
    polyCount: 180,
    style: 'realistic',
    downloads: 9340,
    rating: 4.7,
    reviewCount: 645,
    tags: ['chair', 'seat', 'furniture', 'wood', 'interior'],
    createdAt: '2025-08-22T00:00:00Z',
    fileSize: '150 KB',
    format: 'GLB',
    license: 'free',
  },
  {
    id: 'fur-002',
    name: 'King Throne',
    description: 'Ornate royal throne with carved armrests, velvet cushioning, and gold crown motif. Perfect for throne rooms and boss areas.',
    creator: 'RoyalProps',
    thumbnailUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/BrainStem/screenshot/screenshot.jpg',
    mesh_url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Box/glTF-Binary/Box.glb',
    category: 'Furniture',
    polyCount: 780,
    style: 'stylized',
    downloads: 5640,
    rating: 4.9,
    reviewCount: 389,
    tags: ['throne', 'king', 'royal', 'furniture', 'medieval'],
    createdAt: '2026-01-08T00:00:00Z',
    fileSize: '720 KB',
    format: 'GLB',
    license: 'free',
  },

  // ── Weapons ────────────────────────────────────────────────────────────────
  {
    id: 'wpn-001',
    name: 'Broad Sword',
    description: 'Classic one-handed broadsword with cross-guard and pommel. Clean geometry optimized for hand attachment and animation.',
    creator: 'ArmoryForge',
    thumbnailUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/DamagedHelmet/screenshot/screenshot.jpg',
    mesh_url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Box/glTF-Binary/Box.glb',
    category: 'Weapons',
    polyCount: 340,
    style: 'realistic',
    downloads: 13800,
    rating: 4.8,
    reviewCount: 934,
    tags: ['sword', 'weapon', 'medieval', 'blade', 'combat'],
    createdAt: '2025-07-20T00:00:00Z',
    fileSize: '280 KB',
    format: 'GLB',
    license: 'free',
  },
  {
    id: 'wpn-002',
    name: 'Magic Staff',
    description: 'Gnarled wooden wizard staff with a glowing crystal orb at the top. Separate crystal mesh for glow animation.',
    creator: 'MagicProps',
    thumbnailUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/CesiumMilkTruck/screenshot/screenshot.gif',
    mesh_url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Box/glTF-Binary/Box.glb',
    category: 'Weapons',
    polyCount: 460,
    style: 'stylized',
    downloads: 8230,
    rating: 4.9,
    reviewCount: 567,
    tags: ['staff', 'magic', 'wizard', 'weapon', 'fantasy'],
    createdAt: '2025-10-12T00:00:00Z',
    fileSize: '400 KB',
    format: 'GLB',
    license: 'free',
  },
  {
    id: 'wpn-003',
    name: 'Crossbow',
    description: 'Medieval wooden crossbow with carved stock and iron prod. Separate bolt/arrow mesh included for projectile use.',
    creator: 'ArmoryForge',
    thumbnailUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/DamagedHelmet/screenshot/screenshot.jpg',
    mesh_url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Box/glTF-Binary/Box.glb',
    category: 'Weapons',
    polyCount: 580,
    style: 'realistic',
    downloads: 5910,
    rating: 4.7,
    reviewCount: 348,
    tags: ['crossbow', 'bow', 'ranged', 'medieval', 'weapon'],
    createdAt: '2025-12-01T00:00:00Z',
    fileSize: '510 KB',
    format: 'GLB',
    license: 'free',
  },
  {
    id: 'wpn-004',
    name: 'Battle Axe',
    description: 'Double-headed battle axe with runic engravings and wrapped leather handle. Ideal for barbarian or dwarf characters.',
    creator: 'ArmoryForge',
    thumbnailUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/BrainStem/screenshot/screenshot.jpg',
    mesh_url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Box/glTF-Binary/Box.glb',
    category: 'Weapons',
    polyCount: 490,
    style: 'stylized',
    downloads: 7460,
    rating: 4.8,
    reviewCount: 492,
    tags: ['axe', 'battle-axe', 'weapon', 'fantasy', 'warrior'],
    createdAt: '2025-11-22T00:00:00Z',
    fileSize: '430 KB',
    format: 'GLB',
    license: 'free',
  },
]

// ─── Query helpers ─────────────────────────────────────────────────────────────

type SortOption = 'popular' | 'new' | 'top-rated'
type CategoryFilter = AssetCategory | 'all'

// ─── GET /api/community/assets ────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const category = (searchParams.get('category') ?? 'all') as CategoryFilter
  const sort = (searchParams.get('sort') ?? 'popular') as SortOption
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 100)
  const offset = parseInt(searchParams.get('offset') ?? '0', 10)
  const query = searchParams.get('q')?.toLowerCase().trim() ?? ''
  const style = searchParams.get('style')?.toLowerCase() ?? ''
  const maxPoly = searchParams.get('maxPoly') ? parseInt(searchParams.get('maxPoly')!, 10) : null

  let assets = [...COMMUNITY_ASSETS]

  // Category filter
  if (category !== 'all') {
    assets = assets.filter((a) => a.category === category)
  }

  // Text search (name, description, tags, creator)
  if (query) {
    assets = assets.filter(
      (a) =>
        a.name.toLowerCase().includes(query) ||
        a.description.toLowerCase().includes(query) ||
        a.creator.toLowerCase().includes(query) ||
        a.tags.some((t) => t.includes(query)),
    )
  }

  // Style filter
  if (style && style !== 'all') {
    assets = assets.filter((a) => a.style === style)
  }

  // Poly count ceiling
  if (maxPoly !== null && !isNaN(maxPoly)) {
    assets = assets.filter((a) => a.polyCount <= maxPoly)
  }

  // Sort
  switch (sort) {
    case 'popular':
      assets.sort((a, b) => b.downloads - a.downloads)
      break
    case 'new':
      assets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      break
    case 'top-rated':
      assets.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount)
      break
  }

  const total = assets.length
  const page = assets.slice(offset, offset + limit)

  return NextResponse.json({
    assets: page,
    total,
    offset,
    limit,
    category,
    sort,
  })
}
