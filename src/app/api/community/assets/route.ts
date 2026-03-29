import { NextRequest, NextResponse } from 'next/server'

export interface CommunityAsset {
  id: string
  name: string
  creator: string
  creatorAvatar: string
  thumbnailUrl: string
  downloads: number
  rating: number
  reviewCount: number
  price: number | 'free'
  category: 'renders' | 'models' | 'scripts' | 'ui-kits' | 'sound-packs'
  tags: string[]
  createdAt: string
}

const COMMUNITY_ASSETS: CommunityAsset[] = [
  {
    id: 'render-001',
    name: 'Epic Castle Render',
    creator: 'alexbuilds',
    creatorAvatar: '',
    thumbnailUrl: '',
    downloads: 1200,
    rating: 4.8,
    reviewCount: 142,
    price: 'free',
    category: 'renders',
    tags: ['castle', 'medieval', 'fantasy'],
    createdAt: '2026-02-14T00:00:00Z',
  },
  {
    id: 'model-001',
    name: 'Neon City Pack',
    creator: 'neonmaker',
    creatorAvatar: '',
    thumbnailUrl: '',
    downloads: 890,
    rating: 4.6,
    reviewCount: 98,
    price: 4.99,
    category: 'models',
    tags: ['city', 'neon', 'cyberpunk', 'urban'],
    createdAt: '2026-02-20T00:00:00Z',
  },
  {
    id: 'model-002',
    name: 'Low-Poly Trees',
    creator: 'polyart',
    creatorAvatar: '',
    thumbnailUrl: '',
    downloads: 3400,
    rating: 4.9,
    reviewCount: 312,
    price: 'free',
    category: 'models',
    tags: ['trees', 'nature', 'low-poly', 'forest'],
    createdAt: '2026-01-08T00:00:00Z',
  },
  {
    id: 'model-003',
    name: 'Anime Character Pack',
    creator: 'anime_dev',
    creatorAvatar: '',
    thumbnailUrl: '',
    downloads: 567,
    rating: 4.7,
    reviewCount: 74,
    price: 9.99,
    category: 'models',
    tags: ['anime', 'characters', 'rigs'],
    createdAt: '2026-02-28T00:00:00Z',
  },
  {
    id: 'model-004',
    name: 'Modern House Kit',
    creator: 'arch_studio',
    creatorAvatar: '',
    thumbnailUrl: '',
    downloads: 2100,
    rating: 4.5,
    reviewCount: 189,
    price: 2.99,
    category: 'models',
    tags: ['house', 'modern', 'architecture', 'residential'],
    createdAt: '2025-12-10T00:00:00Z',
  },
  {
    id: 'render-002',
    name: 'Fantasy Forest Render',
    creator: 'dreamscapes',
    creatorAvatar: '',
    thumbnailUrl: '',
    downloads: 780,
    rating: 4.7,
    reviewCount: 56,
    price: 'free',
    category: 'renders',
    tags: ['forest', 'fantasy', 'magic'],
    createdAt: '2026-03-01T00:00:00Z',
  },
  {
    id: 'ui-001',
    name: 'RPG HUD Kit',
    creator: 'ui_wizard',
    creatorAvatar: '',
    thumbnailUrl: '',
    downloads: 1450,
    rating: 4.8,
    reviewCount: 203,
    price: 7.99,
    category: 'ui-kits',
    tags: ['rpg', 'hud', 'health-bar', 'inventory'],
    createdAt: '2026-01-22T00:00:00Z',
  },
  {
    id: 'script-001',
    name: 'Advanced NPC AI',
    creator: 'scriptmaster',
    creatorAvatar: '',
    thumbnailUrl: '',
    downloads: 620,
    rating: 4.6,
    reviewCount: 88,
    price: 14.99,
    category: 'scripts',
    tags: ['npc', 'ai', 'pathfinding', 'combat'],
    createdAt: '2026-02-05T00:00:00Z',
  },
  {
    id: 'sound-001',
    name: 'Fantasy Ambience Pack',
    creator: 'soundforge',
    creatorAvatar: '',
    thumbnailUrl: '',
    downloads: 2800,
    rating: 4.9,
    reviewCount: 267,
    price: 'free',
    category: 'sound-packs',
    tags: ['ambient', 'fantasy', 'music', 'atmosphere'],
    createdAt: '2026-01-15T00:00:00Z',
  },
  {
    id: 'model-005',
    name: 'Sci-Fi Corridor Set',
    creator: 'space_studio',
    creatorAvatar: '',
    thumbnailUrl: '',
    downloads: 940,
    rating: 4.5,
    reviewCount: 112,
    price: 5.99,
    category: 'models',
    tags: ['sci-fi', 'corridor', 'space', 'futuristic'],
    createdAt: '2026-02-12T00:00:00Z',
  },
  {
    id: 'render-003',
    name: 'Sunset Beach Scene',
    creator: 'coastal_art',
    creatorAvatar: '',
    thumbnailUrl: '',
    downloads: 1560,
    rating: 4.8,
    reviewCount: 134,
    price: 'free',
    category: 'renders',
    tags: ['beach', 'sunset', 'tropical', 'ocean'],
    createdAt: '2026-03-05T00:00:00Z',
  },
  {
    id: 'ui-002',
    name: 'Minimal Tycoon UI',
    creator: 'cleandesign',
    creatorAvatar: '',
    thumbnailUrl: '',
    downloads: 3200,
    rating: 4.7,
    reviewCount: 298,
    price: 3.99,
    category: 'ui-kits',
    tags: ['tycoon', 'minimal', 'clean', 'shop'],
    createdAt: '2025-11-30T00:00:00Z',
  },
  {
    id: 'script-002',
    name: 'Tween Animation Suite',
    creator: 'tweenking',
    creatorAvatar: '',
    thumbnailUrl: '',
    downloads: 4100,
    rating: 4.9,
    reviewCount: 421,
    price: 'free',
    category: 'scripts',
    tags: ['animation', 'tween', 'effects', 'utility'],
    createdAt: '2025-10-14T00:00:00Z',
  },
  {
    id: 'model-006',
    name: 'Medieval Weapon Pack',
    creator: 'armory_dev',
    creatorAvatar: '',
    thumbnailUrl: '',
    downloads: 1870,
    rating: 4.6,
    reviewCount: 175,
    price: 6.99,
    category: 'models',
    tags: ['weapons', 'medieval', 'swords', 'combat'],
    createdAt: '2026-01-30T00:00:00Z',
  },
  {
    id: 'sound-002',
    name: 'Retro Arcade SFX',
    creator: 'chiptune_fx',
    creatorAvatar: '',
    thumbnailUrl: '',
    downloads: 2300,
    rating: 4.8,
    reviewCount: 211,
    price: 2.99,
    category: 'sound-packs',
    tags: ['retro', 'arcade', 'sfx', '8-bit'],
    createdAt: '2026-02-08T00:00:00Z',
  },
  {
    id: 'render-004',
    name: 'Dark Forest Atmosphere',
    creator: 'moody_renders',
    creatorAvatar: '',
    thumbnailUrl: '',
    downloads: 690,
    rating: 4.5,
    reviewCount: 62,
    price: 1.99,
    category: 'renders',
    tags: ['forest', 'dark', 'horror', 'foggy'],
    createdAt: '2026-03-10T00:00:00Z',
  },
  {
    id: 'ui-003',
    name: 'Chat Bubble System',
    creator: 'ui_wizard',
    creatorAvatar: '',
    thumbnailUrl: '',
    downloads: 1100,
    rating: 4.7,
    reviewCount: 97,
    price: 'free',
    category: 'ui-kits',
    tags: ['chat', 'dialogue', 'npc', 'speech'],
    createdAt: '2026-02-25T00:00:00Z',
  },
  {
    id: 'model-007',
    name: 'Tropical Island Biome',
    creator: 'island_studio',
    creatorAvatar: '',
    thumbnailUrl: '',
    downloads: 1680,
    rating: 4.8,
    reviewCount: 158,
    price: 8.99,
    category: 'models',
    tags: ['tropical', 'island', 'beach', 'palm-trees'],
    createdAt: '2026-01-05T00:00:00Z',
  },
  {
    id: 'script-003',
    name: 'Leaderboard & DataStore',
    creator: 'data_guru',
    creatorAvatar: '',
    thumbnailUrl: '',
    downloads: 5200,
    rating: 4.9,
    reviewCount: 502,
    price: 'free',
    category: 'scripts',
    tags: ['leaderboard', 'datastore', 'saving', 'persistence'],
    createdAt: '2025-09-20T00:00:00Z',
  },
  {
    id: 'sound-003',
    name: 'Epic Battle Soundtrack',
    creator: 'orchestra_dev',
    creatorAvatar: '',
    thumbnailUrl: '',
    downloads: 1320,
    rating: 4.7,
    reviewCount: 143,
    price: 12.99,
    category: 'sound-packs',
    tags: ['battle', 'epic', 'orchestral', 'combat-music'],
    createdAt: '2026-02-17T00:00:00Z',
  },
]

type SortOption = 'popular' | 'new' | 'top-rated'
type CategoryFilter = 'renders' | 'models' | 'scripts' | 'ui-kits' | 'sound-packs' | 'all'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const category = (searchParams.get('category') ?? 'all') as CategoryFilter
  const sort = (searchParams.get('sort') ?? 'popular') as SortOption
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 50)
  const query = searchParams.get('q')?.toLowerCase() ?? ''

  let assets = [...COMMUNITY_ASSETS]

  if (category !== 'all') {
    assets = assets.filter((a) => a.category === category)
  }

  if (query) {
    assets = assets.filter(
      (a) =>
        a.name.toLowerCase().includes(query) ||
        a.creator.toLowerCase().includes(query) ||
        a.tags.some((t) => t.includes(query)),
    )
  }

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

  return NextResponse.json({
    assets: assets.slice(0, limit),
    total: assets.length,
    category,
    sort,
  })
}
