import { NextRequest, NextResponse } from 'next/server'

interface AssetFile {
  name: string
  type: string
  size: string
}

interface AssetDetail {
  id: string
  name: string
  description: string
  creator: string
  creatorAvatar: string
  previewUrl: string
  files: AssetFile[]
  license: 'free' | 'personal' | 'commercial'
  downloads: number
  rating: number
  reviewCount: number
  price: number | 'free'
  category: string
  tags: string[]
  createdAt: string
  version: string
  compatibility: string[]
}

const ASSET_DETAILS: Record<string, AssetDetail> = {
  'render-001': {
    id: 'render-001',
    name: 'Epic Castle Render',
    description:
      'A high-quality render pack featuring a fully detailed medieval castle with four towers, a main great hall, surrounding walls, and a working drawbridge. Includes 8 render angles and a day/night variant.',
    creator: 'alexbuilds',
    creatorAvatar: '',
    previewUrl: '',
    files: [
      { name: 'castle_front.png', type: 'image/png', size: '4.2 MB' },
      { name: 'castle_aerial.png', type: 'image/png', size: '3.8 MB' },
      { name: 'castle_night.png', type: 'image/png', size: '4.1 MB' },
      { name: 'castle_interior.png', type: 'image/png', size: '3.5 MB' },
      { name: 'readme.txt', type: 'text/plain', size: '2 KB' },
    ],
    license: 'free',
    downloads: 1200,
    rating: 4.8,
    reviewCount: 142,
    price: 'free',
    category: 'renders',
    tags: ['castle', 'medieval', 'fantasy'],
    createdAt: '2026-02-14T00:00:00Z',
    version: '1.2.0',
    compatibility: ['Roblox Studio', 'Blender 4.x'],
  },
  'model-001': {
    id: 'model-001',
    name: 'Neon City Pack',
    description:
      'A complete cyberpunk cityscape asset pack featuring 24 unique building prefabs, neon sign variants, road segments, sidewalk pieces, and decorative props. Optimized for Roblox Studio with LOD variants.',
    creator: 'neonmaker',
    creatorAvatar: '',
    previewUrl: '',
    files: [
      { name: 'NeonCityPack.rbxm', type: 'application/rbxm', size: '18.7 MB' },
      { name: 'preview.png', type: 'image/png', size: '2.1 MB' },
      { name: 'setup_guide.pdf', type: 'application/pdf', size: '380 KB' },
    ],
    license: 'personal',
    downloads: 890,
    rating: 4.6,
    reviewCount: 98,
    price: 4.99,
    category: 'models',
    tags: ['city', 'neon', 'cyberpunk', 'urban'],
    createdAt: '2026-02-20T00:00:00Z',
    version: '2.0.1',
    compatibility: ['Roblox Studio'],
  },
  'model-002': {
    id: 'model-002',
    name: 'Low-Poly Trees',
    description:
      'A versatile collection of 30 low-polygon tree variants including oaks, pines, birches, and tropical palms. Each tree comes in 3 size variants and 4 seasonal color schemes. Perfect for large open-world games.',
    creator: 'polyart',
    creatorAvatar: '',
    previewUrl: '',
    files: [
      { name: 'LowPolyTrees.rbxm', type: 'application/rbxm', size: '6.3 MB' },
      { name: 'preview_sheet.png', type: 'image/png', size: '1.8 MB' },
    ],
    license: 'free',
    downloads: 3400,
    rating: 4.9,
    reviewCount: 312,
    price: 'free',
    category: 'models',
    tags: ['trees', 'nature', 'low-poly', 'forest'],
    createdAt: '2026-01-08T00:00:00Z',
    version: '3.1.0',
    compatibility: ['Roblox Studio'],
  },
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const detail = ASSET_DETAILS[id]

  if (!detail) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
  }

  return NextResponse.json(detail)
}
