import { RobloxForge } from './client'

export interface MarketplaceSearchOptions {
  query?: string
  category?: 'GAME_TEMPLATE' | 'MAP_TEMPLATE' | 'UI_KIT' | 'SCRIPT' | 'ASSET' | 'SOUND'
  minPrice?: number
  maxPrice?: number
  sortBy?: 'newest' | 'popular' | 'rating' | 'price_asc' | 'price_desc'
  page?: number
  limit?: number
}

export interface Template {
  id: string
  title: string
  description: string
  category: string
  priceCents: number
  thumbnailUrl: string | null
  downloads: number
  averageRating: number
  creator: { username: string; displayName: string | null }
}

export interface MarketplaceSearchResult {
  templates: Template[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export class MarketplaceClient {
  constructor(private rf: RobloxForge) {}

  /**
   * Search templates on the marketplace.
   */
  async search(opts: MarketplaceSearchOptions = {}): Promise<MarketplaceSearchResult> {
    const params = new URLSearchParams()
    if (opts.query) params.set('q', opts.query)
    if (opts.category) params.set('category', opts.category)
    if (opts.minPrice !== undefined) params.set('minPrice', String(opts.minPrice))
    if (opts.maxPrice !== undefined) params.set('maxPrice', String(opts.maxPrice))
    if (opts.sortBy) params.set('sort', opts.sortBy)
    if (opts.page !== undefined) params.set('page', String(opts.page))
    if (opts.limit !== undefined) params.set('limit', String(opts.limit))

    const qs = params.toString()
    const res = await this.rf.request<MarketplaceSearchResult>(
      'GET',
      `/api/marketplace/search${qs ? `?${qs}` : ''}`
    )
    if (res.error) throw new Error(res.error)
    return res.data!
  }

  /**
   * Get a single template by ID.
   */
  async get(templateId: string): Promise<Template> {
    const res = await this.rf.request<Template>('GET', `/api/marketplace/templates/${templateId}`)
    if (res.error) throw new Error(res.error)
    return res.data!
  }

  /**
   * Purchase a template (requires full or assets-only scope).
   */
  async purchase(templateId: string): Promise<{ purchaseId: string; downloadUrl: string }> {
    const res = await this.rf.request<{ purchaseId: string; downloadUrl: string }>(
      'POST',
      `/api/marketplace/templates/${templateId}/purchase`
    )
    if (res.error) throw new Error(res.error)
    return res.data!
  }
}

export function marketplacePlugin(rf: RobloxForge) {
  return new MarketplaceClient(rf)
}
