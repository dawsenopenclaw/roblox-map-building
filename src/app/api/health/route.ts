/**
 * GET /api/health
 * Simple health check endpoint used by the Studio plugin to detect
 * whether a local dev server is running.
 */
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(
    { status: 'ok', timestamp: Date.now() },
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    },
  )
}
