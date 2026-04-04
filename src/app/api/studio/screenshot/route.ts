/**
 * POST /api/studio/screenshot  — Plugin pushes a viewport screenshot
 * GET  /api/studio/screenshot?sessionId=<id>  — Web editor fetches latest
 *
 * The plugin periodically captures its viewport and sends the image as a
 * base64-encoded PNG string. The web editor polls this endpoint to display
 * a live preview of the Studio viewport.
 *
 * POST body: { sessionId: string, image: string, width?: number, height?: number }
 * GET response: { sessionId, image: string, capturedAt: number } | { image: null }
 *
 * Screenshots are stored in-memory on the session object — no disk I/O.
 * Maximum image size accepted: 2 MB (base64 encoded, ~1.5 MB raw PNG).
 */

import { NextRequest, NextResponse } from 'next/server'
import { storeScreenshot, storeBeforeScreenshot, getSession } from '@/lib/studio-session'
import { studioScreenshotSchema, parseBody } from '@/lib/validations'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// 2 MB limit for the full request body (base64 PNG is ~33% larger than raw)
const MAX_BODY_BYTES = 2 * 1024 * 1024

interface ScreenshotPostBody {
  sessionId: string
  /** Base64-encoded PNG — data URI prefix is optional and will be stripped */
  image: string
  width?: number
  height?: number
  /** When true, stores as the "before" screenshot instead of the live screenshot */
  isBefore?: boolean
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

// ---------------------------------------------------------------------------
// POST — plugin uploads screenshot
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  // Reject oversized payloads early
  const contentLength = req.headers.get('content-length')
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: 'payload_too_large', maxBytes: MAX_BODY_BYTES },
      { status: 413, headers: CORS_HEADERS },
    )
  }

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400, headers: CORS_HEADERS })
  }

  const sessionId = body.sessionId as string
  if (!sessionId) {
    return NextResponse.json({ error: 'sessionId is required' }, { status: 400, headers: CORS_HEADERS })
  }

  // ── NEW: Context-based update (plugin sends camera + scene data instead of image) ──
  if (body.viewport_active === true || body.camera) {
    // Store context on the session for the frontend to display
    const { updateSessionState } = await import('@/lib/studio-session')
    const updated = await updateSessionState(sessionId, {
      camera: body.camera as Record<string, number> | undefined,
      partCount: body.partCount as number | undefined,
      modelCount: body.modelCount as number | undefined,
      lightCount: body.lightCount as number | undefined,
      groundY: body.groundY as number | undefined,
      nearbyParts: body.nearby as unknown[] | undefined,
      selection: body.selected as unknown[] | undefined,
    })

    return NextResponse.json(
      { stored: true, type: body.type ?? 'context', serverTime: Date.now() },
      { status: updated ? 200 : 404, headers: CORS_HEADERS },
    )
  }

  // ── Legacy: Base64 image upload (for future real screenshot support) ──
  const image = body.image as string | undefined
  if (!image) {
    return NextResponse.json({ error: 'image or viewport_active required' }, { status: 400, headers: CORS_HEADERS })
  }

  // Strip data URI prefix if the plugin sends one
  const base64 = image.replace(/^data:image\/\w+;base64,/, '')

  // Basic sanity check — base64 chars only
  if (!/^[A-Za-z0-9+/=]+$/.test(base64)) {
    return NextResponse.json(
      { error: 'image must be a valid base64 string' },
      { status: 400, headers: CORS_HEADERS },
    )
  }

  const isBefore = body.isBefore === true

  const ok = isBefore
    ? await storeBeforeScreenshot(sessionId, base64)
    : await storeScreenshot(sessionId, base64)

  if (!ok) {
    return NextResponse.json(
      { error: 'session_not_found', reconnect: true },
      { status: 404, headers: CORS_HEADERS },
    )
  }

  return NextResponse.json(
    { stored: true, type: isBefore ? 'before' : 'live', serverTime: Date.now() },
    { status: 200, headers: CORS_HEADERS },
  )
}

// ---------------------------------------------------------------------------
// GET — web editor fetches latest screenshot
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const sessionId = searchParams.get('sessionId')

  if (!sessionId) {
    return NextResponse.json(
      { error: 'sessionId query param is required' },
      { status: 400, headers: CORS_HEADERS },
    )
  }

  const session = await getSession(sessionId)
  if (!session) {
    return NextResponse.json(
      { image: null, error: 'session_not_found' },
      { status: 404, headers: CORS_HEADERS },
    )
  }

  if (!session.latestScreenshot) {
    return NextResponse.json(
      {
        image: null,
        beforeImage: session.beforeScreenshot ?? null,
        beforeImageAt: session.beforeScreenshotAt ?? null,
        sessionId,
      },
      { status: 200, headers: CORS_HEADERS },
    )
  }

  return NextResponse.json(
    {
      sessionId,
      /** Base64 PNG without data URI prefix — caller adds it for <img> src */
      image: session.latestScreenshot,
      capturedAt: session.latestScreenshotAt ?? session.lastHeartbeat,
      beforeImage: session.beforeScreenshot ?? null,
      beforeImageAt: session.beforeScreenshotAt ?? null,
      serverTime: Date.now(),
    },
    { status: 200, headers: CORS_HEADERS },
  )
}
