import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { TemplateCategory, TemplateStatus } from '@prisma/client'

const VALID_CATEGORIES = Object.values(TemplateCategory)

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
      include: {
        screenshots: { orderBy: { sortOrder: 'asc' }, take: 1 },
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
}

// POST /api/marketplace/templates — create listing
export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.user.findUnique({ where: { clerkId } })
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
  if (typeof priceCents !== 'number' || priceCents < 0) {
    return NextResponse.json({ error: 'Invalid price' }, { status: 400 })
  }
  if (screenshots && screenshots.length > 5) {
    return NextResponse.json({ error: 'Maximum 5 screenshots allowed' }, { status: 400 })
  }

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
}
