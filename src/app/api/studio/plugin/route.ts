/**
 * GET /api/studio/plugin
 * Serves the pre-built ForjeGames.rbxmx plugin file.
 *
 * The plugin is built by `packages/studio-plugin/build-plugin.js` and lives
 * at `public/plugin/ForjeGames.rbxmx`. This route serves that file with:
 * - ETag-based caching (304 Not Modified support)
 * - Download counter in Redis
 * - CORS headers for cross-origin requests
 * - ?format=lua option for raw Lua source (debugging)
 */

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { getRedis } from '@/lib/redis'

const PLUGIN_VERSION = '4.6.0'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

// Read the pre-built .rbxmx once at startup (cached in module scope).
// ETag is derived from a content hash so a new build invalidates caches
// at the CDN edge automatically — the previous version used a static
// string which meant a new .rbxmx served with the same etag would never
// be re-fetched by Studio or by Vercel's edge cache.
let _rbxmxCache: string | null = null
let _etag: string | null = null

function getRbxmx(): string {
  if (_rbxmxCache) return _rbxmxCache

  const filePath = path.join(process.cwd(), 'public', 'plugin', 'ForjeGames.rbxmx')
  _rbxmxCache = fs.readFileSync(filePath, 'utf8')

  // Content-hash-based etag: any byte change in the file yields a new etag,
  // breaking the stale-while-revalidate loop that was serving old builds
  // to both Studio and the Vercel CDN.
  _etag = `"${crypto.createHash('sha256').update(_rbxmxCache).digest('hex').slice(0, 16)}"`

  return _rbxmxCache
}

function getEtag(): string {
  if (!_etag) getRbxmx()
  return _etag!
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

export async function GET(req: NextRequest) {
  const rbxmx = getRbxmx()
  const etag = getEtag()

  // Conditional GET: return 304 when client already has current version
  const ifNoneMatch = req.headers.get('if-none-match')
  if (ifNoneMatch === etag) {
    return new NextResponse(null, {
      status: 304,
      headers: {
        ...CORS,
        ETag: etag,
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    })
  }

  // Fire-and-forget download counter
  void (async () => {
    try {
      const r = getRedis()
      if (r) await r.incr('fj:studio:downloads')
    } catch {
      // Redis unavailable — tracking skipped
    }
  })()

  // ?format=lua — extract raw Lua source from first Script CDATA for debugging
  const format = req.nextUrl.searchParams.get('format')
  if (format === 'lua') {
    const cdataMatch = rbxmx.match(/<ProtectedString name="Source"><!\[CDATA\[([\s\S]*?)\]\]><\/ProtectedString>/)
    const luaSource = cdataMatch ? cdataMatch[1] : '-- Could not extract Lua source'
    return new NextResponse(luaSource, {
      status: 200,
      headers: {
        ...CORS,
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': 'attachment; filename="ForjeGames.lua"',
        'Cache-Control': 'no-store',
      },
    })
  }

  // Default: serve the .rbxmx file
  return new NextResponse(rbxmx, {
    status: 200,
    headers: {
      ...CORS,
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': 'attachment; filename="ForjeGames.rbxmx"',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      ETag: etag,
    },
  })
}
