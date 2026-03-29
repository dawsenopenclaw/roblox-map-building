/**
 * db-helpers.ts — Prisma query optimization utilities
 *
 * Provides:
 *   - paginateQuery()  — cursor-based pagination (O(1) vs OFFSET O(n))
 *   - selectMinimal()  — build minimal select objects to avoid over-fetching
 *   - withCache()      — Redis-backed cache wrapper for expensive reads
 *   - batchQuery()     — DataLoader-style deduplication for N+1 prevention
 */

import { redis } from './redis'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CursorPage<T> {
  items: T[]
  nextCursor: string | null
  hasMore: boolean
}

export interface PaginateOptions {
  /** Maximum items per page. Capped at 100. Default: 20 */
  limit?: number
  /** Opaque cursor returned from the previous page */
  cursor?: string | null
  /** Field used as the cursor. Must be unique and sortable. Default: 'id' */
  cursorField?: string
}

export interface CacheOptions {
  /** TTL in seconds. Default: 60 */
  ttl?: number
  /** Key prefix for namespacing. Default: 'cache' */
  prefix?: string
}

// ─── paginateQuery ─────────────────────────────────────────────────────────

/**
 * Cursor-based pagination helper.
 *
 * Unlike OFFSET pagination, this is O(1) regardless of page depth and
 * produces stable results when rows are inserted between pages.
 *
 * @example
 * const page = await paginateQuery(
 *   (args) => db.template.findMany(args),
 *   { where: { status: 'PUBLISHED' }, orderBy: { createdAt: 'desc' } },
 *   { limit: 24, cursor: req.query.cursor }
 * )
 * return { items: page.items, nextCursor: page.nextCursor }
 */
export async function paginateQuery<T extends { id: string }>(
  finder: (args: {
    take: number
    skip?: number
    cursor?: { id: string }
    orderBy?: unknown
    where?: unknown
    select?: unknown
    include?: unknown
  }) => Promise<T[]>,
  queryArgs: {
    where?: unknown
    orderBy?: unknown
    select?: unknown
    include?: unknown
  },
  options: PaginateOptions = {}
): Promise<CursorPage<T>> {
  const limit = Math.min(options.limit ?? 20, 100)
  const cursor = options.cursor ?? null

  // Fetch one extra to detect if there's a next page
  const items = await finder({
    ...queryArgs,
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  })

  const hasMore = items.length > limit
  const page = hasMore ? items.slice(0, limit) : items
  const nextCursor = hasMore ? page[page.length - 1].id : null

  return { items: page, nextCursor, hasMore }
}

// ─── selectMinimal ──────────────────────────────────────────────────────────

/**
 * Build a Prisma `select` object from an array of field names.
 *
 * Prevents over-fetching by making it easy to declare exactly which
 * columns you need without manual object construction.
 *
 * @example
 * const select = selectMinimal(['id', 'title', 'createdAt'])
 * // => { id: true, title: true, createdAt: true }
 *
 * db.template.findMany({ select })
 */
export function selectMinimal<T extends string>(
  fields: T[]
): Record<T, true> {
  return Object.fromEntries(fields.map((f) => [f, true])) as Record<T, true>
}

/**
 * Commonly-used minimal user select — avoids loading sensitive fields.
 */
export const USER_PUBLIC_SELECT = selectMinimal([
  'id',
  'displayName',
  'username',
  'avatarUrl',
])

/**
 * Commonly-used minimal template select for list views.
 */
export const TEMPLATE_LIST_SELECT = selectMinimal([
  'id',
  'title',
  'slug',
  'category',
  'status',
  'priceCents',
  'thumbnailUrl',
  'averageRating',
  'reviewCount',
  'downloads',
  'createdAt',
])

// ─── withCache ──────────────────────────────────────────────────────────────

/**
 * Redis cache wrapper for expensive Prisma queries.
 *
 * On cache miss: executes `fetcher`, stores result in Redis as JSON, returns result.
 * On cache hit: returns deserialized JSON directly — no DB hit.
 *
 * @example
 * const templates = await withCache(
 *   'marketplace:featured',
 *   () => db.template.findMany({ where: { status: 'PUBLISHED' }, take: 12 }),
 *   { ttl: 300 }
 * )
 */
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const ttl = options.ttl ?? 60
  const prefix = options.prefix ?? 'cache'
  const cacheKey = `${prefix}:${key}`

  const cached = await redis.get(cacheKey)
  if (cached !== null) {
    return JSON.parse(cached) as T
  }

  const result = await fetcher()
  await redis.set(cacheKey, JSON.stringify(result), 'EX', ttl)
  return result
}

/**
 * Invalidate one or more cache keys.
 */
export async function invalidateCache(...keys: string[]): Promise<void> {
  if (keys.length === 0) return
  await redis.del(...keys)
}

/**
 * Invalidate all keys matching a glob pattern.
 * Use sparingly — SCAN is O(N) over keyspace size.
 *
 * @example
 * await invalidateCachePattern('cache:marketplace:*')
 */
export async function invalidateCachePattern(pattern: string): Promise<void> {
  const keys: string[] = []
  let cursor = '0'

  do {
    const [nextCursor, batch] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100)
    cursor = nextCursor
    keys.push(...batch)
  } while (cursor !== '0')

  if (keys.length > 0) {
    await redis.del(...keys)
  }
}

// ─── batchQuery ─────────────────────────────────────────────────────────────

/**
 * DataLoader-style batching to prevent N+1 queries.
 *
 * Groups multiple calls within the same event loop tick into a single
 * `findMany` with `id: { in: [...ids] }`, then distributes results
 * back to each individual caller.
 *
 * @example
 * // Instead of calling db.user.findUnique for each item in a list:
 * const userLoader = createBatchLoader(
 *   (ids) => db.user.findMany({ where: { id: { in: ids } } })
 * )
 * // Inside a map — all lookups are batched into one query per tick:
 * const users = await Promise.all(items.map(i => userLoader.load(i.userId)))
 */
export function createBatchLoader<TKey extends string, TResult extends { id: string }>(
  batchFn: (ids: TKey[]) => Promise<TResult[]>
) {
  let pending: TKey[] = []
  let resolvers: Map<TKey, Array<{ resolve: (value: TResult | null) => void; reject: (err: unknown) => void }>> = new Map()
  let scheduled = false

  function schedule() {
    if (scheduled) return
    scheduled = true

    // Defer to next microtask so same-tick callers can accumulate
    Promise.resolve().then(async () => {
      const keys = [...new Set(pending)]
      const currentResolvers = resolvers

      pending = []
      resolvers = new Map()
      scheduled = false

      let results: TResult[] = []
      try {
        results = await batchFn(keys as TKey[])
      } catch (err) {
        // Reject all waiting callers so errors propagate instead of silently returning null
        for (const [, cbs] of currentResolvers) {
          cbs.forEach(({ reject }) => reject(err))
        }
        return
      }

      const resultMap = new Map(results.map((r) => [r.id as TKey, r]))

      for (const [key, cbs] of currentResolvers) {
        const value = resultMap.get(key) ?? null
        cbs.forEach(({ resolve }) => resolve(value))
      }
    })
  }

  return {
    /**
     * Load a single item by ID. Multiple calls in the same tick
     * are batched into one DB round-trip.
     */
    load(id: TKey): Promise<TResult | null> {
      return new Promise((resolve, reject) => {
        pending.push(id)
        const existing = resolvers.get(id)
        if (existing) {
          existing.push({ resolve, reject })
        } else {
          resolvers.set(id, [{ resolve, reject }])
        }
        schedule()
      })
    },

    /**
     * Load multiple items at once. Same batching semantics as load().
     */
    loadMany(ids: TKey[]): Promise<(TResult | null)[]> {
      return Promise.all(ids.map((id) => this.load(id)))
    },
  }
}

/**
 * Convenience wrapper: batch a Prisma findMany by ids and return a Map
 * for O(1) lookups after a single DB query.
 *
 * @example
 * const userMap = await batchQuery(
 *   ids,
 *   (ids) => db.user.findMany({ where: { id: { in: ids } }, select: USER_PUBLIC_SELECT })
 * )
 * const user = userMap.get(someId)
 */
export async function batchQuery<T extends { id: string }>(
  ids: string[],
  fetcher: (ids: string[]) => Promise<T[]>
): Promise<Map<string, T>> {
  const unique = [...new Set(ids)]
  if (unique.length === 0) return new Map()

  const results = await fetcher(unique)
  return new Map(results.map((r) => [r.id, r]))
}
