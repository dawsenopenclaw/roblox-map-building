/**
 * GET /api/studio/version
 *
 * Returns the current plugin version manifest. Polled by the Studio plugin
 * (or the admin panel) to determine whether an update is available.
 *
 * Response shape:
 * {
 *   version:     string,   // latest available plugin version e.g. "4.5.0"
 *   minVersion:  string,   // oldest version still supported e.g. "4.0.0"
 *   downloadUrl: string,   // absolute URL to download the .rbxmx
 *   changelog:   string,   // brief human-readable changelog
 *   forceUpdate: boolean,  // true when the requested pluginVer < minVersion
 * }
 *
 * Cached in Redis at key `fj:studio:plugin:version` for 5 minutes.
 * Fallback to DEFAULTS when Redis is unavailable.
 *
 * The admin panel writes to the same Redis key via POST /api/admin/plugin-version.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getRedis } from '@/lib/redis'

// ── Defaults (used when Redis has no stored version yet) ─────────────────────
const DEFAULTS = {
  version:     '4.5.0',
  minVersion:  '4.0.0',
  downloadUrl: '/api/studio/plugin',
  changelog:   'Auto-update pipeline, version manifest endpoint, force-update support for deprecated versions.',
  forceUpdate: false,
}

const REDIS_KEY    = 'fj:studio:plugin:version'
const CACHE_TTL_S  = 300  // 5 minutes

// ── In-memory fallback cache (one per Lambda cold-start) ─────────────────────
let _memCache: { data: typeof DEFAULTS; expiresAt: number } | null = null

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Plugin-Version',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

// ── Semver comparison ─────────────────────────────────────────────────────────
function semverLt(a: string, b: string): boolean {
  try {
    const [aMaj, aMin, aPat] = a.split('.').map(Number)
    const [bMaj, bMin, bPat] = b.split('.').map(Number)
    if (aMaj !== bMaj) return aMaj < bMaj
    if (aMin !== bMin) return aMin < bMin
    return aPat < bPat
  } catch {
    return false
  }
}

async function getManifest(): Promise<typeof DEFAULTS> {
  // L1: in-memory cache
  if (_memCache && _memCache.expiresAt > Date.now()) {
    return _memCache.data
  }

  // L2: Redis
  try {
    const r = getRedis()
    if (r) {
      const raw = await r.get(REDIS_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as typeof DEFAULTS
        _memCache = { data: parsed, expiresAt: Date.now() + CACHE_TTL_S * 1000 }
        return parsed
      }
    }
  } catch {
    // Redis unavailable — fall through to defaults
  }

  // L3: hardcoded defaults
  _memCache = { data: DEFAULTS, expiresAt: Date.now() + CACHE_TTL_S * 1000 }
  return DEFAULTS
}

export async function GET(req: NextRequest) {
  try {
    const manifest = await getManifest()

    // If the caller passes their current plugin version we can compute forceUpdate inline
    const pluginVer =
      req.nextUrl.searchParams.get('pluginVer') ??
      req.headers.get('x-plugin-version') ??
      null

    const forceUpdate = pluginVer
      ? semverLt(pluginVer, manifest.minVersion)
      : manifest.forceUpdate

    const body = {
      ...manifest,
      forceUpdate,
      // Resolve relative downloadUrl to an absolute URL so the plugin can open it in browser
      downloadUrl: manifest.downloadUrl.startsWith('http')
        ? manifest.downloadUrl
        : `${req.nextUrl.origin}${manifest.downloadUrl}`,
    }

    return NextResponse.json(body, {
      status: 200,
      headers: {
        ...CORS,
        'Cache-Control': `public, max-age=${CACHE_TTL_S}, stale-while-revalidate=60`,
      },
    })
  } catch (err) {
    return NextResponse.json(
      { error: 'internal', message: String(err) },
      { status: 500, headers: CORS },
    )
  }
}
