/**
 * Shared marketplace types used by both API and frontend components.
 * These mirror the types in apps/api/src/lib/search.ts.
 */

export type SortOption = 'trending' | 'newest' | 'top-rated' | 'price-asc' | 'price-desc'

export interface CategoryFacet {
  category: string
  count: number
}

export interface TemplateSearchItem {
  id: string
  title: string
  slug: string
  description: string
  category: string
  priceCents: number
  thumbnailUrl: string | null
  averageRating: number
  reviewCount: number
  downloads: number
  tags: string[]
  createdAt: string | Date
  creator: {
    id: string
    displayName: string | null
    username: string | null
    avatarUrl: string | null
  }
}

export interface SearchResponse {
  templates: TemplateSearchItem[]
  total: number
  nextCursor: string | null
  facets: CategoryFacet[]
}
