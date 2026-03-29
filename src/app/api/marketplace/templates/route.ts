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
    createdAt: new Date().toISOString(),
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
    createdAt: new Date().toISOString(),
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
    createdAt: new Date().toISOString(),
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
    createdAt: new Date().toISOString(),
    screenshots: [],
    creator: { id: 'demo-creator-1', displayName: 'ForjeGames', username: 'ForjeGames', avatarUrl: null },
    _count: { reviews: 18 },
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
      sort === 'new'
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
    console.error('[marketplace/templates GET] DB error:', err)
    // Return demo data so the page renders instead of crashing
    const filtered = DEMO_TEMPLATES.filter((t) => {
      if (category && t.category !== category) return false
      if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false
      if (t.priceCents < minPrice || t.priceCents > maxPrice) return false
      if (t.averageRating < minRating) return false
      return true
    })
    return NextResponse.json({
      templates: filtered,
      pagination: { page: 1, limit: filtered.length, total: filtered.length, totalPages: 1 },
      demo: true,
    })
  }
}

// POST /api/marketplace/templates — create listing
export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let user: { id: string } | null = null
  try {
    user = await db.user.findUnique({ where: { clerkId }, select: { id: true } })
  } catch (err) {
    console.error('[marketplace/templates POST] DB error looking up user:', err)
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
    const template = await db.template.create({
      data: {
        creatorId: user.id,
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
    console.error('[marketplace/templates POST] DB error creating template:', err)
    return NextResponse.json({ error: 'Service temporarily unavailable — please try again later' }, { status: 503 })
  }
}
