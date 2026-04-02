/**
 * GET /api/studio/camera?sessionId=<id>
 * Returns live camera position and map stats from the connected Studio plugin.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSession, getSessionByToken } from '@/lib/studio-session'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const sessionId = searchParams.get('sessionId')
  const token = searchParams.get('token')

  let session = sessionId ? await getSession(sessionId) : undefined
  if (!session && token) {
    session = getSessionByToken(token)
  }

  if (!session) {
    return NextResponse.json(
      { camera: null, partCount: 0, connected: false },
      { status: 200, headers: CORS },
    )
  }

  return NextResponse.json(
    {
      camera: session.camera,
      partCount: session.partCount ?? 0,
      connected: session.connected,
      placeName: session.placeName,
      placeId: session.placeId,
      serverTime: Date.now(),
    },
    { status: 200, headers: CORS },
  )
}
