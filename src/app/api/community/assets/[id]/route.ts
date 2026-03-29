import { NextRequest, NextResponse } from 'next/server'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface AssetFile {
  name: string
  type: string
  size: string
}

interface CommunityAssetDetail {
  id: string
  name: string
  description: string
  creator: string
  thumbnailUrl: string
  mesh_url: string
  category: string
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
  files: AssetFile[]
  technicalNotes: string
  luauInsertSnippet: string
}

// ─── Demo Details ──────────────────────────────────────────────────────────────

const ASSET_DETAILS: Record<string, CommunityAssetDetail> = {
  'bld-001': {
    id: 'bld-001',
    name: 'Medieval Castle Tower',
    description:
      'Tall stone castle tower with crenellations, arrow slits, and a conical roof. Perfect for medieval fortifications. Includes interior staircase geometry. UV-unwrapped with 2K PBR textures (albedo, normal, roughness).',
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
    files: [
      { name: 'castle_tower.glb', type: 'model/gltf-binary', size: '1.8 MB' },
      { name: 'tower_albedo_2k.png', type: 'image/png', size: '3.2 MB' },
      { name: 'tower_normal_2k.png', type: 'image/png', size: '2.8 MB' },
      { name: 'tower_roughness_2k.png', type: 'image/png', size: '1.4 MB' },
    ],
    technicalNotes:
      'Triangulated mesh. All faces forward-facing. Origin set at base center for easy placement. Conical roof is a separate submesh for LOD purposes. Optimized for Roblox Studio import via MeshPart.',
    luauInsertSnippet: `-- Insert Medieval Castle Tower
local id = "rbxassetid://REPLACE_WITH_ASSET_ID"
local part = Instance.new("MeshPart")
part.MeshId = id
part.Size = Vector3.new(12, 28, 12)
part.CFrame = CFrame.new(0, 14, 0) -- base sits on Y=0
part.Anchored = true
part.Material = Enum.Material.SmoothPlastic
part.Parent = workspace`,
  },

  'bld-002': {
    id: 'bld-002',
    name: 'Modern House',
    description:
      'Clean contemporary single-story house with flat roof, large windows, and attached garage. Low-poly optimized for game scenes. Exterior-only mesh, ideal for populating city blocks.',
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
    files: [
      { name: 'modern_house.glb', type: 'model/gltf-binary', size: '680 KB' },
      { name: 'house_texture_1k.png', type: 'image/png', size: '1.1 MB' },
    ],
    technicalNotes:
      'Low-poly exterior mesh. Flat-shaded walls for clean look. Windows are planar faces — add transparency material in Studio for glass effect. Footprint: 24×18 studs.',
    luauInsertSnippet: `-- Insert Modern House
local id = "rbxassetid://REPLACE_WITH_ASSET_ID"
local part = Instance.new("MeshPart")
part.MeshId = id
part.Size = Vector3.new(24, 9, 18)
part.CFrame = CFrame.new(0, 4.5, 0)
part.Anchored = true
part.Material = Enum.Material.SmoothPlastic
part.Parent = workspace`,
  },

  'prp-001': {
    id: 'prp-001',
    name: 'Treasure Chest',
    description:
      'Ornate wooden treasure chest with iron bands and a padlock. Separate lid mesh for open/close animation. Cartoon style with saturated wood and metal textures. Hinge pivot points marked.',
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
    files: [
      { name: 'treasure_chest.glb', type: 'model/gltf-binary', size: '380 KB' },
      { name: 'chest_texture_1k.png', type: 'image/png', size: '820 KB' },
      { name: 'chest_lid_separate.glb', type: 'model/gltf-binary', size: '120 KB' },
    ],
    technicalNotes:
      'Base and lid are separate meshes for animation. Hinge pivot is at the back top edge. Size: 4×3×2.5 studs. Add a TweenService rotation script to animate the lid opening.',
    luauInsertSnippet: `-- Insert Treasure Chest (with open animation)
local id = "rbxassetid://REPLACE_WITH_ASSET_ID"
local chest = Instance.new("MeshPart")
chest.MeshId = id
chest.Size = Vector3.new(4, 2.5, 3)
chest.CFrame = CFrame.new(0, 1.25, 0)
chest.Anchored = true
chest.Parent = workspace

-- ProximityPrompt to open
local prompt = Instance.new("ProximityPrompt")
prompt.ActionText = "Open"
prompt.ObjectText = "Treasure Chest"
prompt.MaxActivationDistance = 8
prompt.Parent = chest`,
  },

  'nat-001': {
    id: 'nat-001',
    name: 'Oak Tree (Stylized)',
    description:
      'Beautiful stylized oak tree with lush canopy and textured bark. Summer and autumn color variants included in the same file via material slots. Optimized for mass placement.',
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
    files: [
      { name: 'oak_tree.glb', type: 'model/gltf-binary', size: '480 KB' },
      { name: 'foliage_summer.png', type: 'image/png', size: '620 KB' },
      { name: 'foliage_autumn.png', type: 'image/png', size: '610 KB' },
      { name: 'bark_texture.png', type: 'image/png', size: '540 KB' },
    ],
    technicalNotes:
      'Canopy is single mesh with billboard-style leaf planes for efficiency. Two-sided faces on leaf geometry. Origin at trunk base. Height: 18 studs. Use random Y rotation for natural variation.',
    luauInsertSnippet: `-- Mass-place Oak Trees
local id = "rbxassetid://REPLACE_WITH_ASSET_ID"
for i = 1, 20 do
  local tree = Instance.new("MeshPart")
  tree.MeshId = id
  tree.Size = Vector3.new(10, 18, 10)
  tree.CFrame = CFrame.new(
    math.random(-200, 200), 9, math.random(-200, 200)
  ) * CFrame.Angles(0, math.random() * math.pi * 2, 0)
  tree.Anchored = true
  tree.Material = Enum.Material.SmoothPlastic
  tree.Parent = workspace.Trees
end`,
  },

  'veh-001': {
    id: 'veh-001',
    name: 'Sports Car (Red)',
    description:
      'Sleek low-profile sports car with detailed exterior. Wheels are separate child meshes for rotation scripting. Realistic paint and chrome materials baked. Optimized collision hull included.',
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
    files: [
      { name: 'sports_car.glb', type: 'model/gltf-binary', size: '2.4 MB' },
      { name: 'car_body_2k.png', type: 'image/png', size: '3.8 MB' },
      { name: 'car_interior_1k.png', type: 'image/png', size: '1.2 MB' },
      { name: 'wheel_texture_1k.png', type: 'image/png', size: '640 KB' },
    ],
    technicalNotes:
      'Body, 4 wheels, and windshield are separate meshes. Wheel origin at hub center for clean rotation. Car dimensions: 14L × 6W × 4H studs. Use VehicleSeat with SpringConstraints for full driving physics.',
    luauInsertSnippet: `-- Insert Sports Car chassis
local id = "rbxassetid://REPLACE_WITH_ASSET_ID"
local car = Instance.new("MeshPart")
car.MeshId = id
car.Size = Vector3.new(14, 4, 6)
car.CFrame = CFrame.new(0, 2, 0)
car.Anchored = false -- needs physics
car.Parent = workspace

local seat = Instance.new("VehicleSeat")
seat.Size = Vector3.new(2, 1, 2)
seat.CFrame = car.CFrame * CFrame.new(0, 1, -1)
seat.Parent = car`,
  },

  'wpn-001': {
    id: 'wpn-001',
    name: 'Broad Sword',
    description:
      'Classic one-handed broadsword with cross-guard and pommel. Clean low-poly geometry optimized for hand attachment. Handle grip point clearly marked. Includes scabbard mesh.',
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
    files: [
      { name: 'broad_sword.glb', type: 'model/gltf-binary', size: '280 KB' },
      { name: 'scabbard.glb', type: 'model/gltf-binary', size: '95 KB' },
      { name: 'sword_texture_1k.png', type: 'image/png', size: '720 KB' },
    ],
    technicalNotes:
      'Blade length: 6 studs. Handle grip attachment point at pommel bottom. Oriented along Z-axis for standard Roblox tool hold. Pair with a Tool instance and weld to RightHand.',
    luauInsertSnippet: `-- Create sword Tool
local id = "rbxassetid://REPLACE_WITH_ASSET_ID"
local tool = Instance.new("Tool")
tool.Name = "BroadSword"
tool.GripForward = Vector3.new(0, 0, -1)
tool.GripRight = Vector3.new(1, 0, 0)
tool.GripUp = Vector3.new(0, 1, 0)

local handle = Instance.new("MeshPart")
handle.MeshId = id
handle.Size = Vector3.new(1, 6, 1)
handle.Name = "Handle"
handle.Parent = tool
tool.Parent = game.StarterPack`,
  },
}

// ─── GET /api/community/assets/[id] ───────────────────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const detail = ASSET_DETAILS[id]

  if (!detail) {
    return NextResponse.json({ error: `Asset '${id}' not found` }, { status: 404 })
  }

  return NextResponse.json(detail)
}
