/**
 * Public stats endpoint — returns non-sensitive aggregate counts
 * for the landing page social proof counter.
 *
 * Cached for 5 minutes to avoid DB load from marketing traffic.
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

let cache: { data: Record<string, number>; ts: number } | null = null
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export async function GET() {
  // Return cached data if fresh
  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    return NextResponse.json(cache.data, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    })
  }

  try {
    const [totalUsers, totalBuilds] = await Promise.all([
      db.user.count().catch(() => 0),
      db.build.count().catch(() => 0),
    ])

    const data = { totalUsers, totalBuilds }
    cache = { data, ts: Date.now() }

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    })
  } catch {
    return NextResponse.json({ totalUsers: 0, totalBuilds: 0 })
  }
}
