/**
 * Recommendation Tracker — learns from user follow-up messages.
 *
 * When a user says "add more detail", "it's missing a door", "needs lighting",
 * "can you add windows" — that's a signal that the AI under-delivered.
 *
 * This module:
 * 1. Detects recommendation patterns in user messages
 * 2. Records them per category (so "castles need towers" benefits all castle builds)
 * 3. Injects top recommendations into future prompts for that category
 */

import { db } from '@/lib/db'
import { detectCategory } from './experience-memory'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Recommendation {
  feature: string      // What the user wants ("towers", "more detail", "lighting")
  category: string     // What kind of build this was for
  count: number        // How many users asked for this
  lastSeen: Date
}

// ---------------------------------------------------------------------------
// Detect if a user message is a recommendation/complaint
// ---------------------------------------------------------------------------

const RECOMMENDATION_PATTERNS = [
  // Direct requests: "add X", "needs X", "missing X"
  /(?:add|include|put|place|give\s+(?:it|me))\s+(?:a\s+|an\s+|some\s+|more\s+)?(.+?)(?:\s+please|\s*$|,)/i,
  /(?:it'?s?\s+)?missing\s+(?:a\s+|an\s+|the\s+)?(.+?)(?:\s*$|,|\.|!)/i,
  /(?:needs?|should\s+have|want)\s+(?:a\s+|an\s+|some\s+|more\s+)?(.+?)(?:\s*$|,|\.|!)/i,
  /(?:where'?s?\s+the|no\s+|there'?s?\s+no)\s+(.+?)(?:\s*$|\?|,|\.|!)/i,
  /(?:can\s+you|could\s+you)\s+(?:add|include|put|make)\s+(?:a\s+|an\s+|some\s+)?(.+?)(?:\s*$|\?|,)/i,
  // Quality complaints: "more detail", "too simple", "not enough"
  /more\s+(detail|parts|objects|furniture|decoration|lighting|color|variety)/i,
  /too\s+(simple|basic|plain|empty|bare|flat|boring)/i,
  /not\s+enough\s+(.+?)(?:\s*$|,|\.|!)/i,
]

export interface DetectedRecommendation {
  feature: string
  type: 'add_feature' | 'more_detail' | 'quality_complaint'
}

export function detectRecommendations(message: string): DetectedRecommendation[] {
  const results: DetectedRecommendation[] = []
  const lower = message.toLowerCase().trim()

  // Skip if message is a new build request (not feedback on existing)
  if (/^(?:build|make|create|generate)\s/i.test(lower)) return results
  // Skip very long messages (likely a new prompt, not feedback)
  if (lower.length > 200) return results

  for (const pattern of RECOMMENDATION_PATTERNS) {
    const match = lower.match(pattern)
    if (match && match[1]) {
      const feature = match[1].trim()
        .replace(/^(?:a|an|the|some|more)\s+/i, '') // strip articles
        .replace(/\s+/g, ' ')
        .slice(0, 50) // cap length

      if (feature.length < 2) continue

      // Classify the recommendation
      let type: DetectedRecommendation['type'] = 'add_feature'
      if (/detail|simple|basic|plain|empty|bare|flat|boring/i.test(lower)) {
        type = 'quality_complaint'
      } else if (/more\s/i.test(lower)) {
        type = 'more_detail'
      }

      results.push({ feature, type })
    }
  }

  return results
}

// ---------------------------------------------------------------------------
// In-memory recommendation cache (seeded from DB)
// ---------------------------------------------------------------------------

// category → feature → count
const recommendationCache = new Map<string, Map<string, { count: number; lastSeen: Date }>>()
let cacheLoaded = false

async function loadCache(): Promise<void> {
  if (cacheLoaded) return
  cacheLoaded = true
  try {
    // Use BuildFeedback errorMessage field to store recommendations
    // (when model = 'user-recommendation')
    const rows = await db.buildFeedback.findMany({
      where: { model: 'user-recommendation' },
      orderBy: { createdAt: 'desc' },
      take: 500,
    })
    for (const row of rows) {
      const cat = row.category || 'general'
      const feature = row.errorMessage || ''
      if (!feature) continue
      if (!recommendationCache.has(cat)) recommendationCache.set(cat, new Map())
      const catMap = recommendationCache.get(cat)!
      const existing = catMap.get(feature)
      catMap.set(feature, {
        count: (existing?.count || 0) + 1,
        lastSeen: row.createdAt,
      })
    }
  } catch { /* DB not available */ }
}

// ---------------------------------------------------------------------------
// Record a recommendation
// ---------------------------------------------------------------------------

export async function recordRecommendation(
  feature: string,
  userPrompt: string,
): Promise<void> {
  const category = detectCategory(userPrompt) || 'general'

  // Update in-memory cache
  if (!recommendationCache.has(category)) recommendationCache.set(category, new Map())
  const catMap = recommendationCache.get(category)!
  const existing = catMap.get(feature)
  catMap.set(feature, {
    count: (existing?.count || 0) + 1,
    lastSeen: new Date(),
  })

  // Persist to DB (fire-and-forget)
  try {
    await db.buildFeedback.create({
      data: {
        promptHash: `rec-${category}-${feature.slice(0, 20)}`,
        prompt: userPrompt,
        code: '', // No code for recommendations
        worked: false,
        errorMessage: feature, // Store the recommended feature
        score: 0,
        model: 'user-recommendation',
        category,
      },
    })
  } catch { /* best effort */ }
}

// ---------------------------------------------------------------------------
// Get top recommendations for a category
// ---------------------------------------------------------------------------

export async function getTopRecommendations(
  category: string | null,
  limit = 5,
): Promise<Recommendation[]> {
  await loadCache()

  const cat = category || 'general'
  const catMap = recommendationCache.get(cat)
  if (!catMap || catMap.size === 0) {
    // Also check the 'general' bucket
    const generalMap = recommendationCache.get('general')
    if (!generalMap || generalMap.size === 0) return []
    return Array.from(generalMap.entries())
      .map(([feature, data]) => ({
        feature,
        category: 'general',
        count: data.count,
        lastSeen: data.lastSeen,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
  }

  return Array.from(catMap.entries())
    .map(([feature, data]) => ({
      feature,
      category: cat,
      count: data.count,
      lastSeen: data.lastSeen,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

/**
 * Format recommendations as a prompt injection block.
 * Tells the AI: "Users frequently ask for these features in this category — include them."
 */
export function formatRecommendations(recommendations: Recommendation[]): string {
  if (recommendations.length === 0) return ''

  const lines = ['', '[USER_FEEDBACK]']
  lines.push('Real users have frequently requested these features for this type of build:')
  for (const rec of recommendations) {
    lines.push(`- "${rec.feature}" (requested ${rec.count}x)`)
  }
  lines.push('Include these features proactively — users will ask for them if you don\'t.')
  lines.push('[/USER_FEEDBACK]')
  return lines.join('\n')
}
