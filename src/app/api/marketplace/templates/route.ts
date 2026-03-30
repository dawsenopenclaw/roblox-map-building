import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { TemplateCategory, TemplateStatus } from '@prisma/client'

const VALID_CATEGORIES = Object.values(TemplateCategory)

// Demo templates shown when the database is unavailable
const DEMO_TEMPLATES = [
  {
    id: 'demo-1',
    title: 'Medieval Castle Game Template',
    slug: 'medieval-castle-game-template',
    category: 'GAME_TEMPLATE',
    status: 'PUBLISHED',
    priceCents: 999,
    thumbnailUrl: null,
    averageRating: 4.8,
    reviewCount: 24,
    downloads: 1420,
    tags: ['medieval', 'rpg', 'castle'],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    screenshots: [],
    creator: { id: 'demo-creator-1', displayName: 'ForjeGames', username: 'ForjeGames', avatarUrl: null },
    _count: { reviews: 24 },
  },
  {
    id: 'demo-2',
    title: 'Modern City Map Pack',
    slug: 'modern-city-map-pack',
    category: 'MAP_TEMPLATE',
    status: 'PUBLISHED',
    priceCents: 0,
    thumbnailUrl: null,
    averageRating: 4.5,
    reviewCount: 11,
    downloads: 3801,
    tags: ['city', 'modern', 'map'],
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    screenshots: [],
    creator: { id: 'demo-creator-2', displayName: 'MapMaster', username: 'mapmaster', avatarUrl: null },
    _count: { reviews: 11 },
  },
  {
    id: 'demo-3',
    title: 'Anime UI Kit',
    slug: 'anime-ui-kit',
    category: 'UI_KIT',
    status: 'PUBLISHED',
    priceCents: 499,
    thumbnailUrl: null,
    averageRating: 4.9,
    reviewCount: 37,
    downloads: 2150,
    tags: ['anime', 'ui', 'kit'],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    screenshots: [],
    creator: { id: 'demo-creator-3', displayName: 'UIWizard', username: 'uiwizard', avatarUrl: null },
    _count: { reviews: 37 },
  },
  {
    id: 'demo-4',
    title: 'Battle Royale Starter Script',
    slug: 'battle-royale-starter-script',
    category: 'SCRIPT',
    status: 'PUBLISHED',
    priceCents: 1499,
    thumbnailUrl: null,
    averageRating: 4.6,
    reviewCount: 18,
    downloads: 980,
    tags: ['battle-royale', 'script', 'shooter'],
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    screenshots: [],
    creator: { id: 'demo-creator-1', displayName: 'ForjeGames', username: 'ForjeGames', avatarUrl: null },
    _count: { reviews: 18 },
  },
  {
    id: 'demo-5',
    title: 'Combat System v2',
    slug: 'combat-system-v2',
    category: 'SCRIPT',
    status: 'PUBLISHED',
    priceCents: 1999,
    thumbnailUrl: null,
    averageRating: 5.0,
    reviewCount: 201,
    downloads: 7800,
    tags: ['combat', 'pvp', 'hitbox', 'action'],
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    screenshots: [],
    creator: { id: 'demo-creator-5', displayName: 'LuauLegend', username: 'luau_legend', avatarUrl: null },
    _count: { reviews: 201 },
  },
  {
    id: 'demo-6',
    title: 'Fantasy Map Bundle',
    slug: 'fantasy-map-bundle',
    category: 'MAP_TEMPLATE',
    status: 'PUBLISHED',
    priceCents: 3499,
    thumbnailUrl: null,
    averageRating: 4.0,
    reviewCount: 55,
    downloads: 2100,
    tags: ['fantasy', 'map', 'world', 'rpg'],
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    screenshots: [],
    creator: { id: 'demo-creator-6', displayName: 'WorldForge', username: 'world_forge', avatarUrl: null },
    _count: { reviews: 55 },
  },
  {
    id: 'demo-7',
    title: 'Admin Panel Script',
    slug: 'admin-panel-script',
    category: 'SCRIPT',
    status: 'PUBLISHED',
    priceCents: 0,
    thumbnailUrl: null,
    averageRating: 4.5,
    reviewCount: 310,
    downloads: 14200,
    tags: ['admin', 'moderation', 'free', 'tools'],
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    screenshots: [],
    creator: { id: 'demo-creator-7', displayName: 'DevTools', username: 'dev_tools', avatarUrl: null },
    _count: { reviews: 310 },
  },
  {
    id: 'demo-8',
    title: 'Inventory UI Pack',
    slug: 'inventory-ui-pack',
    category: 'UI_KIT',
    status: 'PUBLISHED',
    priceCents: 799,
    thumbnailUrl: null,
    averageRating: 4.0,
    reviewCount: 44,
    downloads: 1950,
    tags: ['inventory', 'ui', 'items', 'gui'],
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    screenshots: [],
    creator: { id: 'demo-creator-8', displayName: 'UIQueen', username: 'ui_queen', avatarUrl: null },
    _count: { reviews: 44 },
  },
  {
    id: 'demo-9',
    title: 'Tropical Island Asset Pack',
    slug: 'tropical-island-asset-pack',
    category: 'ASSET',
    status: 'PUBLISHED',
    priceCents: 1299,
    thumbnailUrl: null,
    averageRating: 5.0,
    reviewCount: 73,
    downloads: 4100,
    tags: ['tropical', 'island', 'beach', 'props'],
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    screenshots: [],
    creator: { id: 'demo-creator-9', displayName: 'IslandArtist', username: 'island_artist', avatarUrl: null },
    _count: { reviews: 73 },
  },
  {
    id: 'demo-10',
    title: 'Dungeon Crawler Starter',
    slug: 'dungeon-crawler-starter',
    category: 'GAME_TEMPLATE',
    status: 'PUBLISHED',
    priceCents: 1999,
    thumbnailUrl: null,
    averageRating: 4.5,
    reviewCount: 96,
    downloads: 3580,
    tags: ['dungeon', 'rpg', 'procedural', 'roguelike'],
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    screenshots: [],
    creator: { id: 'demo-creator-10', displayName: 'DungeonCraft', username: 'dungeon_craft', avatarUrl: null },
    _count: { reviews: 96 },
  },
  {
    id: 'demo-11',
    title: 'Ambient Soundscape Pack',
    slug: 'ambient-soundscape-pack',
    category: 'SOUND',
    status: 'PUBLISHED',
    priceCents: 499,
    thumbnailUrl: null,
    averageRating: 4.7,
    reviewCount: 29,
    downloads: 1100,
    tags: ['audio', 'ambient', 'sound', 'music'],
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    screenshots: [],
    creator: { id: 'demo-creator-11', displayName: 'AudioForge', username: 'audio_forge', avatarUrl: null },
    _count: { reviews: 29 },
  },
  {
    id: 'demo-12',
    title: 'Tycoon Framework',
    slug: 'tycoon-framework',
    category: 'GAME_TEMPLATE',
    status: 'PUBLISHED',
    priceCents: 2499,
    thumbnailUrl: null,
    averageRating: 4.0,
    reviewCount: 67,
    downloads: 3210,
    tags: ['tycoon', 'simulator', 'economy'],
    createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    screenshots: [],
    creator: { id: 'demo-creator-3', displayName: 'Sarah', username: 'sarah_scripts', avatarUrl: null },
    _count: { reviews: 67 },
  },
]

// GET /api/marketplace/templates — browse with filters
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const category = searchParams.get('category') as TemplateCategory | null
  const sort = searchParams.get('sort') || 'trending'
  const search = searchParams.get('search') || ''
  const minPrice = parseInt(searchParams.get('minPrice') || '0', 10)
  const maxPrice = parseInt(searchParams.get('maxPrice') || '999999', 10)
  const minRating = parseFloat(searchParams.get('minRating') || '0')
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '24', 10)))
  const skip = (page - 1) * limit

  try {
    const where: Record<string, unknown> = {
      status: TemplateStatus.PUBLISHED,
      priceCents: { gte: minPrice, lte: maxPrice },
      averageRating: { gte: minRating },
    }

    if (category && VALID_CATEGORIES.includes(category)) {
      where.category = category
    }

    if (search.trim()) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { has: search.toLowerCase() } },
      ]
    }

    const orderBy: Record<string, string> =
      sort === 'new' || sort === 'newest'
        ? { createdAt: 'desc' }
        : sort === 'top-rated'
        ? { averageRating: 'desc' }
        : sort === 'price-asc'
        ? { priceCents: 'asc' }
        : sort === 'price-desc'
        ? { priceCents: 'desc' }
        : { downloads: 'desc' } // trending

    const [templates, total] = await Promise.all([
      db.template.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          slug: true,
          category: true,
          status: true,
          priceCents: true,
          thumbnailUrl: true,
          averageRating: true,
          reviewCount: true,
          downloads: true,
          tags: true,
          createdAt: true,
          screenshots: {
            orderBy: { sortOrder: 'asc' },
            take: 1,
            select: { id: true, url: true, altText: true },
          },
          creator: { select: { id: true, displayName: true, username: true, avatarUrl: true } },
          _count: { select: { reviews: true } },
        },
      }),
      db.template.count({ where }),
    ])

    return NextResponse.json({
      templates,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (err) {
    // Return demo data so the page renders instead of crashing
    let filtered = DEMO_TEMPLATES.filter((t) => {
      if (category && t.category !== category) return false
      if (search && !t.title.toLowerCase().includes(search.toLowerCase()) && !t.tags.some(tag => tag.includes(search.toLowerCase()))) return false
      if (t.priceCents < minPrice || t.priceCents > maxPrice) return false
      if (t.averageRating < minRating) return false
      return true
    })
    // Apply sort to demo data
    if (sort === 'newest' || sort === 'new') {
      filtered = filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    } else if (sort === 'top-rated') {
      filtered = filtered.sort((a, b) => b.averageRating - a.averageRating)
    } else if (sort === 'price-asc') {
      filtered = filtered.sort((a, b) => a.priceCents - b.priceCents)
    } else if (sort === 'price-desc') {
      filtered = filtered.sort((a, b) => b.priceCents - a.priceCents)
    } else {
      filtered = filtered.sort((a, b) => b.downloads - a.downloads)
    }
    const demoTotal = filtered.length
    const demoPaged = filtered.slice(skip, skip + limit)
    return NextResponse.json({
      templates: demoPaged,
      pagination: { page, limit, total: demoTotal, totalPages: Math.ceil(demoTotal / limit) },
      demo: true,
    })
  }
}

// POST /api/marketplace/templates — create listing
export async function POST(req: NextRequest) {
  let clerkId: string | null = null
  try {
    const session = await auth()
    clerkId = session?.userId ?? null
  } catch { /* demo mode — Clerk not configured */ }
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let user: { id: string } | null = null
  try {
    user = await db.user.findUnique({ where: { clerkId }, select: { id: true } })
  } catch (err) {
    return NextResponse.json({ error: 'Service temporarily unavailable — please try again later' }, { status: 503 })
  }
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { title, description, category, priceCents, rbxmFileUrl, thumbnailUrl, tags, screenshots } =
    body as {
      title?: string
      description?: string
      category?: string
      priceCents?: number
      rbxmFileUrl?: string
      thumbnailUrl?: string
      tags?: string[]
      screenshots?: Array<{ url: string; altText?: string; sortOrder?: number }>
    }

  if (!title?.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  if (!description?.trim()) return NextResponse.json({ error: 'Description is required' }, { status: 400 })
  if (!category || !VALID_CATEGORIES.includes(category as TemplateCategory)) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
  }
  if (typeof priceCents !== 'number' || !Number.isInteger(priceCents) || priceCents < 0) {
    return NextResponse.json({ error: 'Invalid price — must be a non-negative integer (cents)' }, { status: 400 })
  }
  if (screenshots && screenshots.length > 5) {
    return NextResponse.json({ error: 'Maximum 5 screenshots allowed' }, { status: 400 })
  }

  try {
    const slug = title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now()

    const template = await db.template.create({
      data: {
        creatorId: user.id,
        slug,
        title: title.trim(),
        description: description.trim(),
        category: category as TemplateCategory,
        priceCents,
        rbxmFileUrl: rbxmFileUrl || null,
        thumbnailUrl: thumbnailUrl || null,
        tags: tags || [],
        status: TemplateStatus.PENDING_REVIEW,
        screenshots: screenshots?.length
          ? {
              createMany: {
                data: screenshots.map((s, i) => ({
                  url: s.url,
                  altText: s.altText || null,
                  sortOrder: s.sortOrder ?? i,
                })),
              },
            }
          : undefined,
      },
      include: {
        screenshots: true,
      },
    })

    return NextResponse.json({ template }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: 'Service temporarily unavailable — please try again later' }, { status: 503 })
  }
}
