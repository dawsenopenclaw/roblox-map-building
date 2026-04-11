/**
 * Helpers to build correct Cache-Control headers for Next.js route handlers.
 *
 * We split routes into four classes so callers don't have to think about
 * Cache-Control, s-maxage, or stale-while-revalidate individually:
 *
 *   - public        Anonymous content that can live on any CDN forever
 *                   (with SWR). Example: /api/showcase/list
 *   - personal      Authenticated per-user content. Cached on the user's
 *                   browser but never on shared CDNs. Example: /api/me
 *   - private       Sensitive — never cached. Example: /api/stripe/session
 *   - dynamic       Server-rendered but safe to CDN-cache briefly with SWR.
 *                   Example: /api/feed
 *
 * Each helper returns a `Headers` instance and also exposes a raw value
 * via `buildCacheControl(class)` so callers using `NextResponse.json(...)` can
 * spread the object.
 */

export type CacheClass = 'public' | 'personal' | 'private' | 'dynamic'

export interface CacheClassOptions {
  /** For "public"/"dynamic": max-age served to shared caches. */
  sMaxAgeSeconds?: number
  /** For "public"/"dynamic": stale-while-revalidate window. */
  swrSeconds?: number
  /** For "personal": max-age on the browser. Default: 0 (revalidate). */
  browserMaxAgeSeconds?: number
  /** Optional additional directive (e.g. "immutable"). */
  extra?: string
}

const DEFAULTS: Record<CacheClass, Required<Omit<CacheClassOptions, 'extra'>>> = {
  public: { sMaxAgeSeconds: 300, swrSeconds: 3_600, browserMaxAgeSeconds: 60 },
  personal: { sMaxAgeSeconds: 0, swrSeconds: 0, browserMaxAgeSeconds: 0 },
  private: { sMaxAgeSeconds: 0, swrSeconds: 0, browserMaxAgeSeconds: 0 },
  dynamic: { sMaxAgeSeconds: 30, swrSeconds: 300, browserMaxAgeSeconds: 0 },
}

/**
 * Build a Cache-Control header string for the given class.
 * For `public` and `dynamic`, we emit a browser max-age + s-maxage + SWR.
 * For `personal`, we emit "private, no-store" (strict) with optional browser max-age.
 * For `private`, we emit "no-store" and related no-cache flags.
 */
export function buildCacheControl(
  klass: CacheClass,
  opts: CacheClassOptions = {},
): string {
  const merged = { ...DEFAULTS[klass], ...opts }
  const extra = opts.extra ? `, ${opts.extra}` : ''

  switch (klass) {
    case 'public': {
      return (
        `public, max-age=${merged.browserMaxAgeSeconds}, ` +
        `s-maxage=${merged.sMaxAgeSeconds}, ` +
        `stale-while-revalidate=${merged.swrSeconds}${extra}`
      )
    }
    case 'dynamic': {
      return (
        `public, max-age=${merged.browserMaxAgeSeconds}, ` +
        `s-maxage=${merged.sMaxAgeSeconds}, ` +
        `stale-while-revalidate=${merged.swrSeconds}${extra}`
      )
    }
    case 'personal': {
      const base =
        merged.browserMaxAgeSeconds > 0
          ? `private, max-age=${merged.browserMaxAgeSeconds}`
          : 'private, no-store, no-cache, must-revalidate'
      return `${base}${extra}`
    }
    case 'private': {
      return `no-store, no-cache, must-revalidate, max-age=0${extra}`
    }
  }
}

/** Construct a plain object usable as `NextResponse.json(data, { headers })`. */
export function cacheHeaders(
  klass: CacheClass,
  opts?: CacheClassOptions,
): Record<string, string> {
  const cacheControl = buildCacheControl(klass, opts)
  const headers: Record<string, string> = {
    'Cache-Control': cacheControl,
  }
  if (klass === 'public' || klass === 'dynamic') {
    // CDN-Cache-Control lets Vercel's CDN accept a different policy than
    // downstream browsers, which is useful for surrogate-only caching.
    headers['CDN-Cache-Control'] = cacheControl
    headers['Vercel-CDN-Cache-Control'] = cacheControl
  }
  if (klass === 'private' || klass === 'personal') {
    headers['Pragma'] = 'no-cache'
    headers['Vary'] = 'Cookie, Authorization'
  }
  return headers
}

/** Construct a real `Headers` instance ready to pass to `new Response`. */
export function cacheHeaderObject(klass: CacheClass, opts?: CacheClassOptions): Headers {
  const h = new Headers()
  for (const [k, v] of Object.entries(cacheHeaders(klass, opts))) {
    h.set(k, v)
  }
  return h
}

/**
 * Apply cache headers to an existing Response (mutates its headers).
 * Returns the same Response for chaining.
 */
export function applyCacheHeaders<R extends Response>(
  response: R,
  klass: CacheClass,
  opts?: CacheClassOptions,
): R {
  const headers = cacheHeaders(klass, opts)
  for (const [k, v] of Object.entries(headers)) {
    response.headers.set(k, v)
  }
  return response
}
