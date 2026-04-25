/**
 * Error Heatmap API — Shows which Roblox APIs cause the most errors.
 * Used in admin dashboard to identify knowledge base gaps.
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Common Roblox API names to track
const TRACKED_APIS = [
  'DataStoreService', 'RemoteEvent', 'RemoteFunction', 'TweenService',
  'UserInputService', 'RunService', 'CollectionService', 'ProximityPrompt',
  'PathfindingService', 'MarketplaceService', 'TeleportService', 'TextService',
  'PhysicsService', 'SoundService', 'Workspace', 'Players', 'Lighting',
  'ReplicatedStorage', 'ServerScriptService', 'StarterGui',
  'Humanoid', 'CharacterAdded', 'Instance.new', 'CFrame', 'Vector3',
]

export async function GET() {
  try {
    // Get all error logs from last 7 days
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const errors = await db.scriptErrorLog.findMany({
      where: { createdAt: { gte: weekAgo } },
      select: {
        errorMessage: true,
        errorType: true,
        originalCode: true,
        fixSucceeded: true,
      },
    })

    // Count API mentions in error-causing code
    const apiErrorCounts: Record<string, { total: number; fixed: number; unfixed: number }> = {}

    for (const error of errors) {
      const combined = `${error.errorMessage} ${error.originalCode}`.toLowerCase()
      for (const api of TRACKED_APIS) {
        if (combined.includes(api.toLowerCase())) {
          if (!apiErrorCounts[api]) apiErrorCounts[api] = { total: 0, fixed: 0, unfixed: 0 }
          apiErrorCounts[api].total++
          if (error.fixSucceeded) apiErrorCounts[api].fixed++
          else apiErrorCounts[api].unfixed++
        }
      }
    }

    // Sort by total errors descending
    const heatmap = Object.entries(apiErrorCounts)
      .map(([api, counts]) => ({
        api,
        ...counts,
        fixRate: counts.total > 0 ? Math.round((counts.fixed / counts.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 15) // Top 15

    // Error type breakdown
    const byType = await db.scriptErrorLog.groupBy({
      by: ['errorType'],
      where: { createdAt: { gte: weekAgo } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    })

    return NextResponse.json({
      heatmap,
      byType: byType.map(t => ({ type: t.errorType, count: t._count.id })),
      totalErrors: errors.length,
      totalFixed: errors.filter(e => e.fixSucceeded).length,
      period: '7d',
    })
  } catch (err) {
    console.error('[ErrorHeatmap] Failed:', err)
    return NextResponse.json({ heatmap: [], byType: [], totalErrors: 0, totalFixed: 0 })
  }
}
