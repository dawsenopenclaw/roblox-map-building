/**
 * GET /api/ai/ideas/trending
 *
 * Returns the top 10 trending "idea buckets" this week, based on real
 * user activity (GeneratedAsset + Build rows). Public, no auth, cached
 * for 1 hour by the pipeline layer and additionally via Cache-Control.
 */

import { NextResponse } from 'next/server'
import { getTrendingIdeas } from '@/lib/idea-generator/idea-pipeline'

export const runtime = 'nodejs'
export const revalidate = 3600 // 1 hour

export async function GET(): Promise<NextResponse> {
  try {
    const ideas = await getTrendingIdeas()
    return NextResponse.json(
      { ideas, cachedAt: new Date().toISOString() },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=300',
        },
      },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Trending query failed'
    console.error('[ideas/trending] failed:', message)
    return NextResponse.json(
      { error: 'Failed to load trending ideas', detail: message },
      { status: 500 },
    )
  }
}
