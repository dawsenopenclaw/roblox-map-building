import { NextResponse } from 'next/server'
import { getQueueStats } from '@/lib/ai/request-queue'

export async function GET() {
  const stats = getQueueStats()
  return NextResponse.json({
    ...stats,
    // User-friendly fields
    userMessage: stats.queueLength > 0
      ? `${stats.queueLength} build${stats.queueLength > 1 ? 's' : ''} ahead of you — estimated wait: ${Math.max(1, Math.round(stats.estimatedWaitMs / 1000))}s`
      : 'No queue — your build will start immediately',
    busy: stats.activeRequests >= stats.maxConcurrent,
  })
}
