import { Hono } from 'hono'
import { TemplateCategory } from '@prisma/client'
import { db } from '../../lib/db'
import {
  buildSearchQuery,
  buildSortOrder,
  getFacets,
  getRankedTemplateIds,
  type SearchParams,
  type SortOption,
  type TemplateSearchItem,
} from '../../lib/search'

export const marketplaceSearchRoutes = new Hono()

const VALID_CATEGORIES = Object.values(TemplateCategory)
const VALID_SORTS: SortOption[] = ['trending', 'newest', 'top-rated', 'price-asc', 'price-desc']
const DEFAULT_LIMIT = 24
const MAX_LIMIT = 100

/**
 * GET /api/marketplace/search
 *
 * Query params:
 *   q          — full-text search query
 *   category   — TemplateCategory value (repeatable: ?category=MAP_TEMPLATE&category=SCRIPT)
 *   minPrice   — minimum price in dollars (e.g. 0, 4.99)
 *   maxPrice   — maximum price in dollars
 *   minRating  — minimum average rating (1-5)
 *   sort       — trending | newest | top-rated | price-asc | price-desc
 *   after      — cursor (template ID) for pagination
 *   limit      — number of results (default 24, max 100)
 */
marketplaceSearchRoutes.get('/', async (c) => {
  try {
    const raw = c.req.query()

    // ── Parse & validate params ──────────────────────────────────────────────

    const query = raw.q?.trim() || undefined

    // Category: supports ?category=MAP_TEMPLATE&category=SCRIPT
    const rawCategories = c.req.queries('category') ?? (raw.category ? [raw.category] : [])
    const categories = rawCategories.filter((cat): cat is TemplateCategory =>
      VALID_CATEGORIES.includes(cat as TemplateCategory)
    )

    const minPrice = raw.minPrice !== undefined ? parseFloat(raw.minPrice) : undefined
    const maxPrice = raw.maxPrice !== undefined ? parseFloat(raw.maxPrice) : undefined

    if (minPrice !== undefined && (isNaN(minPrice) || minPrice < 0)) {
      return c.json({ error: 'minPrice must be a non-negative number' }, 400)
    }
    if (maxPrice !== undefined && (isNaN(maxPrice) || maxPrice < 0)) {
      return c.json({ error: 'maxPrice must be a non-negative number' }, 400)
    }
    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
      return c.json({ error: 'minPrice cannot exceed maxPrice' }, 400)
    }

    const minRating = raw.minRating !== undefined ? parseFloat(raw.minRating) : undefined
    if (minRating !== undefined && (isNaN(minRating) || minRating < 1 || minRating > 5)) {
      return c.json({ error: 'minRating must be between 1 and 5' }, 400)
    }

    const sort: SortOption = VALID_SORTS.includes(raw.sort as SortOption)
      ? (raw.sort as SortOption)
      : 'trending'

    const afterCursor = raw.after || undefined

    const rawLimit = raw.limit !== undefined ? parseInt(raw.limit, 10) : DEFAULT_LIMIT
    const limit = isNaN(rawLimit) || rawLimit < 1 ? DEFAULT_LIMIT : Math.min(rawLimit, MAX_LIMIT)

    // ── Build search params ──────────────────────────────────────────────────

    const searchParams: SearchParams = {
      query,
      category: categories.length === 1 ? categories[0] : categories.length > 1 ? categories : undefined,
      minPrice,
      maxPrice,
      minRating,
      sort,
      after: afterCursor,
      limit,
    }

    const where = buildSearchQuery(searchParams)

    // ── Resolve cursor offset ────────────────────────────────────────────────
    // Cursor is encoded as base64("offset:id")
    let pageOffset = 0
    if (afterCursor) {
      try {
        const decoded = Buffer.from(afterCursor, 'base64').toString('utf-8')
        const [offsetStr] = decoded.split(':')
        pageOffset = parseInt(offsetStr, 10) || 0
      } catch {
        return c.json({ error: 'Invalid pagination cursor' }, 400)
      }
    }

    // ── Fetch total count (before pagination) ────────────────────────────────

    const total = await db.template.count({ where })

    // ── Fetch templates ──────────────────────────────────────────────────────

    let templateIds: string[] | null = null

    if (sort === 'trending') {
      // Use raw SQL for exact trending score ordering
      templateIds = await getRankedTemplateIds(where, limit, pageOffset)
    }

    const orderBy = buildSortOrder(sort)

    const templates = templateIds
      ? await db.template.findMany({
          where: { id: { in: templateIds }, ...where },
          include: {
            creator: {
              select: { id: true, displayName: true, username: true, avatarUrl: true },
            },
          },
          // Re-sort in JS to match the trending score order from raw query
        })
      : await db.template.findMany({
          where,
          orderBy,
          skip: pageOffset,
          take: limit,
          include: {
            creator: {
              select: { id: true, displayName: true, username: true, avatarUrl: true },
            },
          },
        })

    // If trending, re-order to match raw SQL ordering
    const orderedTemplates =
      templateIds
        ? templateIds.map((id) => templates.find((t) => t.id === id)).filter(Boolean)
        : templates

    // ── Build response items ─────────────────────────────────────────────────

    const items: TemplateSearchItem[] = (orderedTemplates as typeof templates).map((t) => ({
      id: t.id,
      title: t.title,
      slug: t.slug,
      description: t.description,
      category: t.category,
      priceCents: t.priceCents,
      thumbnailUrl: t.thumbnailUrl,
      averageRating: t.averageRating,
      reviewCount: t.reviewCount,
      downloads: t.downloads,
      tags: t.tags,
      createdAt: t.createdAt,
      creator: t.creator,
    }))

    // ── Compute next cursor ──────────────────────────────────────────────────

    const nextOffset = pageOffset + items.length
    const hasMore = nextOffset < total
    const nextCursor = hasMore
      ? Buffer.from(`${nextOffset}:${items[items.length - 1]?.id ?? ''}`).toString('base64')
      : null

    // ── Get facets ───────────────────────────────────────────────────────────

    const facets = await getFacets(where)

    // ── Return ───────────────────────────────────────────────────────────────

    return c.json({
      templates: items,
      total,
      nextCursor,
      facets,
    })
  } catch (err) {
    console.error('[marketplace/search]', err)
    return c.json({ error: 'Search failed' }, 500)
  }
})
