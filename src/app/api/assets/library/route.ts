/**
 * Curated Asset Library API
 *
 * GET /api/assets/library?q=tree&category=tree&limit=10
 * Returns matches from our hand-picked asset library (instant, no external API).
 * No auth required — read-only catalog.
 */

import { NextRequest, NextResponse } from 'next/server'
import { findMatchingAssets, getAssetCategories, ASSET_LIBRARY, type AssetCategory } from '@/lib/ai/asset-library'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q') || ''
  const category = searchParams.get('category') as AssetCategory | null
  const style = searchParams.get('style') || undefined
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50)

  if (!query && !category) {
    const grouped: Record<string, typeof ASSET_LIBRARY> = {}
    for (const asset of ASSET_LIBRARY) {
      if (!grouped[asset.category]) grouped[asset.category] = []
      grouped[asset.category].push(asset)
    }
    return NextResponse.json({
      assets: grouped,
      categories: getAssetCategories(),
      total: ASSET_LIBRARY.length,
    })
  }

  const results = findMatchingAssets(query, category || undefined, style, limit)
  return NextResponse.json({ assets: results, total: results.length, query, category })
}
