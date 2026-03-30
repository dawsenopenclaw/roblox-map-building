import { Prisma, TemplateCategory, TemplateStatus } from '@prisma/client'
import { db } from './db'

// ─── Types ──────────────────────────────────────────────────────────────────

export type SortOption = 'trending' | 'newest' | 'top-rated' | 'price-asc' | 'price-desc'

export interface SearchParams {
  query?: string
  category?: TemplateCategory | TemplateCategory[]
  minPrice?: number
  maxPrice?: number
  minRating?: number
  sort?: SortOption
  after?: string
  limit?: number
}

export interface SearchResult {
  templates: TemplateSearchItem[]
  total: number
  nextCursor: string | null
  facets: CategoryFacet[]
}

export interface TemplateSearchItem {
  id: string
  title: string
  slug: string
  description: string
  category: TemplateCategory
  priceCents: number
  thumbnailUrl: string | null
  averageRating: number
  reviewCount: number
  downloads: number
  tags: string[]
  createdAt: Date
  creator: {
    id: string
    displayName: string | null
    username: string | null
    avatarUrl: string | null
  }
}

export interface CategoryFacet {
  category: TemplateCategory
  count: number
}

// ─── buildSearchQuery ────────────────────────────────────────────────────────

/**
 * Converts search params to a Prisma where clause.
 * Full-text search uses PostgreSQL tsvector via queryRaw for ranking,
 * but the where clause handles filtering so Prisma can still paginate.
 */
export function buildSearchQuery(params: SearchParams): Prisma.TemplateWhereInput {
  const where: Prisma.TemplateWhereInput = {
    status: TemplateStatus.PUBLISHED,
    deletedAt: null,
  }

  // Category filter — supports single or multiple
  if (params.category) {
    const cats = Array.isArray(params.category) ? params.category : [params.category]
    if (cats.length === 1) {
      where.category = cats[0]
    } else if (cats.length > 1) {
      where.category = { in: cats }
    }
  }

  // Price range (stored as cents)
  if (params.minPrice !== undefined || params.maxPrice !== undefined) {
    where.priceCents = {}
    if (params.minPrice !== undefined) {
      where.priceCents = { ...where.priceCents as object, gte: Math.round(params.minPrice * 100) }
    }
    if (params.maxPrice !== undefined) {
      where.priceCents = { ...where.priceCents as object, lte: Math.round(params.maxPrice * 100) }
    }
  }

  // Minimum rating
  if (params.minRating !== undefined) {
    where.averageRating = { gte: params.minRating }
  }

  // Full-text search: filter by tsvector match if query provided.
  // We can't use Prisma's native full-text search for PostgreSQL arrays + text columns easily,
  // so we fall back to a case-insensitive OR across title + description + tags.
  // The raw ranking for "trending" sort is handled separately in buildSortOrder.
  if (params.query && params.query.trim().length > 0) {
    const q = params.query.trim()
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      { tags: { has: q } },
    ]
  }

  return where
}

// ─── buildSortOrder ──────────────────────────────────────────────────────────

/**
 * Converts sort param to a Prisma orderBy array.
 * "trending" uses a proxy sort (downloads desc + rating desc) since
 * the true trending score requires raw SQL — use getRankedTemplateIds for that.
 */
export function buildSortOrder(sort: SortOption = 'trending'): Prisma.TemplateOrderByWithRelationInput[] {
  switch (sort) {
    case 'newest':
      return [{ createdAt: 'desc' }]
    case 'top-rated':
      return [{ averageRating: 'desc' }, { reviewCount: 'desc' }]
    case 'price-asc':
      return [{ priceCents: 'asc' }, { createdAt: 'desc' }]
    case 'price-desc':
      return [{ priceCents: 'desc' }, { createdAt: 'desc' }]
    case 'trending':
    default:
      // Approximation via Prisma — see calculateTrending for exact formula
      return [{ downloads: 'desc' }, { averageRating: 'desc' }, { createdAt: 'desc' }]
  }
}

// ─── calculateTrending ───────────────────────────────────────────────────────

/**
 * Trending score formula:
 *   (sales_this_week * 2) + (views_this_week) + (rating * 10) + recency_bonus
 *
 * Since the schema doesn't track weekly sales/views separately we derive:
 *   - sales_this_week  = purchases in the last 7 days
 *   - views_this_week  = downloads delta proxy (downloads / age_weeks, capped)
 *   - recency_bonus    = max(0, 50 - days_since_published)
 *
 * This returns raw SQL fragment strings for use in ORDER BY via $queryRaw.
 */
export function calculateTrending(): string {
  return `
    (
      (
        SELECT COUNT(*) FROM "TemplatePurchase" tp
        WHERE tp."templateId" = t.id
          AND tp."createdAt" > NOW() - INTERVAL '7 days'
      ) * 2
    )
    +
    (
      LEAST(
        COALESCE(t.downloads, 0) / GREATEST(
          EXTRACT(EPOCH FROM (NOW() - t."createdAt")) / 604800,
          1
        ),
        500
      )
    )
    +
    (t."averageRating" * 10)
    +
    GREATEST(0, 50 - EXTRACT(DAY FROM (NOW() - t."createdAt")))
  `
}

// ─── getFacets ───────────────────────────────────────────────────────────────

/**
 * Returns template counts per category for the filter sidebar.
 * Respects all active filters except category so the sidebar shows
 * how many results exist in each category given other filters.
 */
export async function getFacets(
  baseWhere: Prisma.TemplateWhereInput
): Promise<CategoryFacet[]> {
  // Remove category filter so all categories are represented
  const { category: _cat, ...whereWithoutCategory } = baseWhere as Prisma.TemplateWhereInput & { category?: unknown }

  const groups = await db.template.groupBy({
    by: ['category'],
    where: whereWithoutCategory,
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
  })

  return groups.map((g) => ({
    category: g.category,
    count: g._count.id,
  }))
}

// ─── getRankedTemplateIds ────────────────────────────────────────────────────

/**
 * Returns template IDs sorted by exact trending score via raw SQL.
 * Used when sort=trending to get the true ordering before fetching full records.
 */
export async function getRankedTemplateIds(
  where: Prisma.TemplateWhereInput,
  limit: number,
  offset: number
): Promise<string[]> {
  const trendingFormula = calculateTrending()

  // Build safe category filter using $queryRaw tagged template + dynamic fragment.
  // Because the trendingFormula and per-filter fragments are all developer-authored
  // SQL (no user input), only user-supplied VALUES go into Prisma.sql bindings.

  let categoryClause = Prisma.sql``
  if (where.category) {
    if (typeof where.category === 'string') {
      // Validate against known enum values before embedding
      const validCategories = Object.values(TemplateCategory) as string[]
      if (validCategories.includes(where.category)) {
        categoryClause = Prisma.sql`AND t.category = ${where.category}::text::"TemplateCategory"`
      }
    } else if ((where.category as { in?: string[] }).in) {
      const cats = (where.category as { in: string[] }).in.filter(
        (c) => (Object.values(TemplateCategory) as string[]).includes(c)
      )
      if (cats.length > 0) {
        // Prisma.join produces a safe comma-separated list
        categoryClause = Prisma.sql`AND t.category = ANY(ARRAY[${Prisma.join(cats)}]::"TemplateCategory"[])`
      }
    }
  }

  let priceGteClause = Prisma.sql``
  let priceLteClause = Prisma.sql``
  if (where.priceCents) {
    const pc = where.priceCents as { gte?: number; lte?: number }
    if (pc.gte !== undefined) priceGteClause = Prisma.sql`AND t."priceCents" >= ${pc.gte}`
    if (pc.lte !== undefined) priceLteClause = Prisma.sql`AND t."priceCents" <= ${pc.lte}`
  }

  let ratingClause = Prisma.sql``
  if (where.averageRating) {
    const ar = where.averageRating as { gte?: number }
    if (ar.gte !== undefined) ratingClause = Prisma.sql`AND t."averageRating" >= ${ar.gte}`
  }

  let searchClause = Prisma.sql``
  if (where.OR) {
    const orClauses = where.OR as Array<{ title?: { contains: string }; description?: { contains: string }; tags?: { has: string } }>
    // Extract the search term from whichever OR clause shape is present.
    // Previously only checked title.contains — silently dropping description/tags
    // search terms if no title clause existed in the OR array.
    const searchTerm =
      orClauses.find((c) => c.title?.contains)?.title?.contains ??
      orClauses.find((c) => c.description?.contains)?.description?.contains ??
      orClauses.find((c) => c.tags?.has)?.tags?.has
    if (searchTerm) {
      const pattern = `%${searchTerm}%`
      searchClause = Prisma.sql`AND (t.title ILIKE ${pattern} OR t.description ILIKE ${pattern} OR ${searchTerm} = ANY(t.tags))`
    }
  }

  // trendingFormula is a developer-authored string with no user input — safe to embed
  const trendingRaw = Prisma.raw(trendingFormula)
  // Clamp and floor to integers before binding so the DB receives clean numerics
  const limitVal = Math.max(1, Math.floor(limit))
  const offsetVal = Math.max(0, Math.floor(offset))

  const rows = await db.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    SELECT t.id FROM "Template" t
    WHERE t.status = 'PUBLISHED'::"TemplateStatus"
      AND t."deletedAt" IS NULL
      ${categoryClause}
      ${priceGteClause}
      ${priceLteClause}
      ${ratingClause}
      ${searchClause}
    ORDER BY (${trendingRaw}) DESC
    LIMIT ${limitVal} OFFSET ${offsetVal}
  `)

  return rows.map((r) => r.id)
}
