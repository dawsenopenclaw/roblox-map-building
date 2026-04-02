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
import { storeScreenshot, getSession } from '@/lib/studio-session'
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

  const parsedBody = await parseBody(req, studioScreenshotSchema)
  if (!parsedBody.ok) {
    return NextResponse.json({ error: parsedBody.error }, { status: parsedBody.status, headers: CORS_HEADERS })
  }
  const body = parsedBody.data

  // Strip data URI prefix if the plugin sends one
  const base64 = body.image.replace(/^data:image\/\w+;base64,/, '')

  // Basic sanity check — base64 chars only
  if (!/^[A-Za-z0-9+/=]+$/.test(base64)) {
    return NextResponse.json(
      { error: 'image must be a valid base64 string' },
      { status: 400, headers: CORS_HEADERS },
    )
  }

  const ok = await storeScreenshot(body.sessionId, base64)
  if (!ok) {
    return NextResponse.json(
      { error: 'session_not_found', reconnect: true },
      { status: 404, headers: CORS_HEADERS },
    )
  }

  return NextResponse.json(
    { stored: true, serverTime: Date.now() },
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
      { image: null, sessionId },
      { status: 200, headers: CORS_HEADERS },
    )
  }

  return NextResponse.json(
    {
      sessionId,
      /** Base64 PNG without data URI prefix — caller adds it for <img> src */
      image: session.latestScreenshot,
      capturedAt: session.lastHeartbeat,
      serverTime: Date.now(),
    },
    { status: 200, headers: CORS_HEADERS },
  )
}
