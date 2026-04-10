import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { TemplateCategory, Prisma } from '@prisma/client'

const VALID_CATEGORIES = Object.values(TemplateCategory)
const PAGE_SIZE = 24

type SortOption = 'trending' | 'newest' | 'most-liked' | 'most-forked'

const SORT_MAP: Record<SortOption, Prisma.TemplateOrderByWithRelationInput> = {
  trending: { trending: 'desc' },
  newest: { createdAt: 'desc' },
  'most-liked': { likeCount: 'desc' },
  'most-forked': { forkCount: 'desc' },
}

// ── GET /api/marketplace/search — search with filters ───────────────────────

export async function GET(req: NextRequest) {
  const url = new URL(req.url)

  const q = url.searchParams.get('q')?.trim() || ''
  const categoryParam = url.searchParams.get('category')
  const sortParam = (url.searchParams.get('sort') || 'trending') as SortOption
  const priceFilter = url.searchParams.get('price') // 'free' | 'paid' | null (all)
  const cursor = url.searchParams.get('cursor')
  const limitParam = url.searchParams.get('limit')
  const limit = Math.min(Math.max(parseInt(limitParam || String(PAGE_SIZE), 10) || PAGE_SIZE, 1), 50)

  // Build where clause
  const where: Prisma.TemplateWhereInput = {
    status: 'PUBLISHED',
    deletedAt: null,
  }

  // Text search — match title, description, or tags
  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      { tags: { has: q.toLowerCase() } },
    ]
  }

  // Category filter
  if (categoryParam) {
    const categories = categoryParam.split(',').filter((c) =>
      VALID_CATEGORIES.includes(c as TemplateCategory)
    ) as TemplateCategory[]
    if (categories.length > 0) {
      where.category = { in: categories }
    }
  }

  // Price filter
  if (priceFilter === 'free') {
    where.priceCents = 0
  } else if (priceFilter === 'paid') {
    where.priceCents = { gt: 0 }
  }

  // Sort
  const orderBy = SORT_MAP[sortParam] || SORT_MAP.trending

  try {
    const [templates, total] = await Promise.all([
      db.template.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          category: true,
          priceCents: true,
          thumbnailUrl: true,
          tags: true,
          likeCount: true,
          forkCount: true,
          viewCount: true,
          downloads: true,
          averageRating: true,
          reviewCount: true,
          featured: true,
          createdAt: true,
          creator: {
            select: {
              id: true,
              displayName: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
        orderBy,
        take: limit + 1, // +1 to determine if there's a next page
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      }),
      db.template.count({ where }),
    ])

    const hasMore = templates.length > limit
    const results = hasMore ? templates.slice(0, limit) : templates
    const nextCursor = hasMore ? results[results.length - 1]?.id : null

    // Build category facets
    const facets = await db.template.groupBy({
      by: ['category'],
      where: { status: 'PUBLISHED', deletedAt: null },
      _count: { category: true },
    })

    return NextResponse.json({
      templates: results,
      total,
      nextCursor,
      facets: facets.map((f) => ({
        category: f.category,
        count: f._count.category,
      })),
    })
  } catch {
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    )
  }
}
