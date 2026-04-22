/**
 * ELI Insights API — Self-improvement dashboard endpoint
 *
 * Returns ELI's learned patterns, build quality trends, recurring failures,
 * and auto-generated improvement suggestions.
 *
 * GET /api/admin/eli/insights
 */

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getMemories } from '@/lib/eli/memory'
import { getBuildIntelligence } from '@/lib/eli/build-intelligence'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Gather ELI's learned patterns
  const highScorePatterns = getMemories({ tags: ['high-score'], limit: 10 })
  const lowScorePatterns = getMemories({ tags: ['low-score'], limit: 10 })
  const recurringFailures = getMemories({ tags: ['recurring-failure'], limit: 10 })
  const metrics = getMemories({ type: 'metric', tags: ['builds'], limit: 20 })
  const allPatterns = getMemories({ type: 'pattern', limit: 20 })

  // Get intelligence for common build types
  const categories = ['medieval', 'modern', 'sci-fi', 'horror', 'nature', 'tycoon', 'obby', 'house']
  const categoryInsights = categories.map(cat => ({
    category: cat,
    ...getBuildIntelligence(`build a ${cat}`),
  }))

  // Auto-generate improvement suggestions
  const suggestions: string[] = []

  // Check for consistently low-scoring categories
  for (const m of metrics) {
    const avgMatch = m.content.match(/avg score (\d+)/)
    if (avgMatch && parseInt(avgMatch[1]) < 60) {
      const catMatch = m.content.match(/for "(\w+)"/)
      if (catMatch) {
        suggestions.push(`Category "${catMatch[1]}" averaging ${avgMatch[1]}/100 — needs prompt tuning or more examples`)
      }
    }
  }

  // Check for recurring failures
  for (const f of recurringFailures) {
    suggestions.push(`Recurring build failure: ${f.content.slice(0, 100)}`)
  }

  // Check if any category has no data
  for (const ci of categoryInsights) {
    if (ci.avgScore === null) {
      suggestions.push(`No build data for "${ci.category}" — consider adding test builds`)
    }
  }

  return NextResponse.json({
    summary: {
      totalPatterns: allPatterns.length,
      highScoreBuilds: highScorePatterns.length,
      lowScoreBuilds: lowScorePatterns.length,
      recurringFailures: recurringFailures.length,
      metricsTracked: metrics.length,
    },
    highScorePatterns: highScorePatterns.map(p => ({
      content: p.content,
      confidence: p.confidence,
      tags: p.tags,
      timestamp: p.timestamp,
    })),
    lowScorePatterns: lowScorePatterns.map(p => ({
      content: p.content,
      confidence: p.confidence,
      tags: p.tags,
      timestamp: p.timestamp,
    })),
    recurringFailures: recurringFailures.map(f => ({
      content: f.content,
      confidence: f.confidence,
      timestamp: f.timestamp,
    })),
    categoryInsights,
    metrics: metrics.map(m => ({
      content: m.content,
      tags: m.tags,
      timestamp: m.timestamp,
    })),
    suggestions,
  })
}
