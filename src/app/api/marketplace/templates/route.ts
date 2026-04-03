import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { TemplateCategory, TemplateStatus } from '@prisma/client'
import { templateSubmitSchema, parseBody } from '@/lib/validations'

const VALID_CATEGORIES = Object.values(TemplateCategory)

const ALLOWED_URL_HOSTS = [/\.rbxcdn\.com$/, /\.amazonaws\.com$/, /\.cloudflare\.com$/, /\.r2\.dev$/]

function isAllowedUrl(raw: string | null | undefined): boolean {
  if (!raw) return true
  try {
    const host = new URL(raw).hostname.toLowerCase()
    return ALLOWED_URL_HOSTS.some((re) => re.test(host))
  } catch {
    return false
  }
}

// Demo templates shown when the database is unavailable
const DEMO_TEMPLATES = [
  {
    id: 'demo-1',
    title: 'Pet Simulator Starter Kit',
    slug: 'pet-simulator-starter-kit',
    description: 'Complete pet sim foundation — egg hatching with rarity rolls, pet inventory, stat scaling, world zones with portals, coin farming loops, and a global leaderboard. Launch-ready in hours.',
    category: 'GAME_TEMPLATE',
    status: 'PUBLISHED',
    priceCents: 999,
    thumbnailUrl: null,
    averageRating: 4.9,
    reviewCount: 312,
    downloads: 4820,
    tags: ['pet-sim', 'simulator', 'eggs', 'tycoon'],
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    screenshots: [],
    creator: { id: 'demo-creator-1', displayName: 'ForjeGames', username: 'forgegames', avatarUrl: null },
    _count: { reviews: 312 },
  },
  {
    id: 'demo-2',
    title: 'Merchant NPC Bundle',
    slug: 'merchant-npc-bundle',
    description: 'Six fully-scripted NPC archetypes — shopkeeper, quest giver, blacksmith, innkeeper, wandering trader, and guard captain. Each has contextual dialogue trees, proximity detection, and a configurable shop UI.',
    category: 'ASSET',
    status: 'PUBLISHED',
    priceCents: 499,
    thumbnailUrl: null,
    averageRating: 4.6,
    reviewCount: 148,
    downloads: 3210,
    tags: ['npc', 'dialogue', 'shop', 'characters'],
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    screenshots: [],
    creator: { id: 'demo-creator-2', displayName: 'BuildPro', username: 'buildpro', avatarUrl: null },
    _count: { reviews: 148 },
  },
  {
    id: 'demo-3',
    title: 'Tropical Island Terrain Pack',
    slug: 'tropical-island-terrain-pack',
    description: 'Hand-sculpted tropical archipelago with 6 biomes — coral reef shallows, dense jungle, volcanic highlands, white sand beaches, mangrove swamps, and a hidden sea cave. 120+ custom props, free forever.',
    category: 'MAP_TEMPLATE',
    status: 'PUBLISHED',
    priceCents: 0,
    thumbnailUrl: null,
    averageRating: 4.7,
    reviewCount: 189,
    downloads: 8940,
    tags: ['tropical', 'terrain', 'free', 'island'],
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    screenshots: [],
    creator: { id: 'demo-creator-3', displayName: 'MapMaster', username: 'map_master', avatarUrl: null },
    _count: { reviews: 189 },
  },
  {
    id: 'demo-4',
    title: 'Dark Mode HUD Kit',
    slug: 'dark-mode-hud-kit',
    description: 'Sleek dark UI system with 30+ pre-built screens — health/stamina bars, minimap frame, inventory slots, quest tracker, settings panel, and notification toasts. Fully responsive and mobile-tested.',
    category: 'UI_KIT',
    status: 'PUBLISHED',
    priceCents: 799,
    thumbnailUrl: null,
    averageRating: 4.8,
    reviewCount: 203,
    downloads: 5670,
    tags: ['ui', 'hud', 'dark', 'mobile'],
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    screenshots: [],
    creator: { id: 'demo-creator-4', displayName: 'DesignPro', username: 'designpro', avatarUrl: null },
    _count: { reviews: 203 },
  },
  {
    id: 'demo-5',
    title: 'Advanced Combat Engine',
    slug: 'advanced-combat-engine',
    description: 'Server-authoritative combat system with hitbox detection, combo chains, blocking, dodge rolls, skill cooldowns, and status effects. Built-in anti-exploit guards and configurable damage curves.',
    category: 'SCRIPT',
    status: 'PUBLISHED',
    priceCents: 1999,
    thumbnailUrl: null,
    averageRating: 4.8,
    reviewCount: 241,
    downloads: 6130,
    tags: ['combat', 'pvp', 'hitbox', 'skills'],
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    screenshots: [],
    creator: { id: 'demo-creator-5', displayName: 'LuauLegend', username: 'luau_legend', avatarUrl: null },
    _count: { reviews: 241 },
  },
  {
    id: 'demo-6',
    title: 'Modern City Vehicle Pack',
    slug: 'modern-city-vehicle-pack',
    description: 'Eight driveable vehicles — sedan, SUV, sports car, delivery truck, police cruiser, taxi, motorbike, and bicycle. Realistic physics tuning, functioning headlights, seat animations, and horn SFX.',
    category: 'ASSET',
    status: 'PUBLISHED',
    priceCents: 1299,
    thumbnailUrl: null,
    averageRating: 4.5,
    reviewCount: 97,
    downloads: 2870,
    tags: ['vehicles', 'cars', 'driving', 'city'],
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    screenshots: [],
    creator: { id: 'demo-creator-6', displayName: 'WorldForge', username: 'world_forge', avatarUrl: null },
    _count: { reviews: 97 },
  },
  {
    id: 'demo-7',
    title: 'Tycoon Framework Pro',
    slug: 'tycoon-framework-pro',
    description: 'Battle-tested tycoon foundation used in 500+ published games. Conveyor systems, upgrade trees, droppers with configurable rates, auto-collectors, and a rebirth system. Fully modular — swap any component independently.',
    category: 'GAME_TEMPLATE',
    status: 'PUBLISHED',
    priceCents: 2499,
    thumbnailUrl: null,
    averageRating: 4.6,
    reviewCount: 178,
    downloads: 4380,
    tags: ['tycoon', 'simulator', 'conveyor', 'economy'],
    createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    screenshots: [],
    creator: { id: 'demo-creator-7', displayName: 'DevTools', username: 'dev_tools', avatarUrl: null },
    _count: { reviews: 178 },
  },
  {
    id: 'demo-8',
    title: 'Fantasy Castle Building Kit',
    slug: 'fantasy-castle-building-kit',
    description: '200+ modular castle pieces — towers, walls, gates, battlements, interior rooms, dungeon corridors, and throne halls. Snap-fit design with matching textures and a pre-assembled showcase castle to clone and edit.',
    category: 'UI_KIT',
    status: 'PUBLISHED',
    priceCents: 0,
    thumbnailUrl: null,
    averageRating: 4.4,
    reviewCount: 134,
    downloads: 7650,
    tags: ['castle', 'building', 'medieval', 'free'],
    createdAt: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString(),
    screenshots: [],
    creator: { id: 'demo-creator-1', displayName: 'ForjeGames', username: 'forgegames', avatarUrl: null },
    _count: { reviews: 134 },
  },
  {
    id: 'demo-9',
    title: 'Mountain Highlands Terrain',
    slug: 'mountain-highlands-terrain',
    description: 'Epic mountain range spanning three elevation zones — alpine meadows, pine forests, and snow-capped peaks with a glacial lake valley at the center. Optimized for streaming, includes SkyBox and atmospheric fog preset.',
    category: 'MAP_TEMPLATE',
    status: 'PUBLISHED',
    priceCents: 499,
    thumbnailUrl: null,
    averageRating: 4.5,
    reviewCount: 86,
    downloads: 2190,
    tags: ['mountain', 'terrain', 'snow', 'nature'],
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    screenshots: [],
    creator: { id: 'demo-creator-3', displayName: 'MapMaster', username: 'map_master', avatarUrl: null },
    _count: { reviews: 86 },
  },
  {
    id: 'demo-10',
    title: 'DataStore Manager',
    slug: 'datastore-manager',
    description: 'Production-grade save system with automatic retry logic, queue batching, session-lock anti-duplication, and migration support. Handles player joins/leaves, server shutdown saves, and exposes a clean API for other systems.',
    category: 'SCRIPT',
    status: 'PUBLISHED',
    priceCents: 0,
    thumbnailUrl: null,
    averageRating: 4.9,
    reviewCount: 427,
    downloads: 12800,
    tags: ['datastore', 'save', 'free', 'essential'],
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    screenshots: [],
    creator: { id: 'demo-creator-5', displayName: 'LuauLegend', username: 'luau_legend', avatarUrl: null },
    _count: { reviews: 427 },
  },
  {
    id: 'demo-11',
    title: 'Ambient World Audio Pack',
    slug: 'ambient-world-audio-pack',
    description: '80+ layered ambient audio tracks — jungle dawn, ocean waves, mountain wind, dungeon drips, city traffic, and tavern chatter. Includes a smart AudioZone script that crossfades tracks as players move through regions.',
    category: 'SOUND',
    status: 'PUBLISHED',
    priceCents: 499,
    thumbnailUrl: null,
    averageRating: 4.6,
    reviewCount: 72,
    downloads: 3100,
    tags: ['audio', 'ambient', 'sfx', 'atmosphere'],
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    screenshots: [],
    creator: { id: 'demo-creator-11', displayName: 'SoundForge', username: 'sound_forge', avatarUrl: null },
    _count: { reviews: 72 },
  },
  {
    id: 'demo-12',
    title: 'Obby Challenge Pack',
    slug: 'obby-challenge-pack',
    description: 'Thirty hand-designed obstacle courses ranging from beginner to expert. Moving platforms, spinning blades, lava floors, ice slides, and conveyor belts — all modular so you can rearrange and remix stages freely.',
    category: 'GAME_TEMPLATE',
    status: 'PUBLISHED',
    priceCents: 299,
    thumbnailUrl: null,
    averageRating: 4.3,
    reviewCount: 105,
    downloads: 5420,
    tags: ['obby', 'obstacle', 'platformer', 'stages'],
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    screenshots: [],
    creator: { id: 'demo-creator-12', displayName: 'BuildPro', username: 'buildpro', avatarUrl: null },
    _count: { reviews: 105 },
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
      deletedAt: null,
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

function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const list = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  return list.includes(email.toLowerCase())
}

// POST /api/marketplace/templates — create listing
export async function POST(req: NextRequest) {
  let clerkId: string | null = null
  try {
    const session = await auth()
    clerkId = session?.userId ?? null
  } catch { /* demo mode — Clerk not configured */ }
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let user: { id: string; email: string; role: string } | null = null
  try {
    user = await db.user.findUnique({ where: { clerkId }, select: { id: true, email: true, role: true } })
  } catch (err) {
    return NextResponse.json({ error: 'Service temporarily unavailable — please try again later' }, { status: 503 })
  }
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Auto-publish for admins: skip the review queue
  const submitterIsAdmin = user.role === 'ADMIN' || isAdminEmail(user.email)

  const parsed = await parseBody(req, templateSubmitSchema)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status })
  }

  const { title, description, category, priceCents, rbxmFileUrl, thumbnailUrl, tags, screenshots } = parsed.data

  if (!VALID_CATEGORIES.includes(category as TemplateCategory)) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
  }
  if (rbxmFileUrl && !isAllowedUrl(rbxmFileUrl)) {
    return NextResponse.json({ error: 'File URL must be from an allowed domain (rbxcdn.com, amazonaws.com, cloudflare.com, r2.dev)' }, { status: 400 })
  }
  if (thumbnailUrl && !isAllowedUrl(thumbnailUrl)) {
    return NextResponse.json({ error: 'Thumbnail URL must be from an allowed domain (rbxcdn.com, amazonaws.com, cloudflare.com, r2.dev)' }, { status: 400 })
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
        status: submitterIsAdmin ? TemplateStatus.PUBLISHED : TemplateStatus.PENDING_REVIEW,
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
