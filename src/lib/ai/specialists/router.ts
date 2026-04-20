/**
 * Specialist Router — picks the best specialist agent for a user's request.
 *
 * Strategy: keyword matching with scoring. Each specialist has keywords;
 * we score each specialist against the user's message and pick the top match.
 * If no specialist scores above the threshold, falls back to a general builder.
 *
 * This runs BEFORE the AI call, so it needs to be fast (no API calls).
 */

import 'server-only'
import { SPECIALISTS, type Specialist } from './registry'

// Precompute lowercase keyword sets for fast matching
const specialistIndex = SPECIALISTS.map(s => ({
  specialist: s,
  keywordSet: new Set(s.keywords.map(k => k.toLowerCase())),
  // Also split multi-word keywords into individual words for partial matching
  wordSet: new Set(s.keywords.flatMap(k => k.toLowerCase().split(/[\s-]+/))),
}))

/**
 * Find the best specialist for a given user message.
 * Returns null if no specialist matches above threshold.
 */
export function findSpecialist(userMessage: string): Specialist | null {
  // Don't activate specialists for very short messages (greetings, questions)
  if (userMessage.trim().split(/\s+/).length < 3) return null

  const words = userMessage.toLowerCase().replace(/[^a-z0-9\s-]/g, '').split(/\s+/)
  const messageText = userMessage.toLowerCase()

  let bestScore = 0
  let bestMatch: Specialist | null = null

  for (const { specialist, keywordSet, wordSet } of specialistIndex) {
    let score = 0

    // Exact keyword phrase match (highest weight)
    for (const keyword of keywordSet) {
      if (messageText.includes(keyword)) {
        score += keyword.split(/\s+/).length * 3 // Multi-word phrases score higher
      }
    }

    // Individual word match against keyword word set
    for (const word of words) {
      if (word.length < 3) continue // Skip tiny words
      if (wordSet.has(word)) {
        score += 1
      }
    }

    if (score > bestScore) {
      bestScore = score
      bestMatch = specialist
    }
  }

  // Minimum score threshold — at least one exact keyword match (score >= 3)
  // or two word matches (score >= 2)
  return bestScore >= 2 ? bestMatch : null
}

/**
 * Build the specialist-enhanced system prompt.
 * Prepends the specialist's domain expertise to the base prompt.
 */
export function applySpecialist(basePrompt: string, specialist: Specialist): string {
  return `[SPECIALIST MODE: ${specialist.name}]
${specialist.prompt}

${basePrompt}`
}

/**
 * Get RAG categories to use based on the specialist's domain.
 * Merges specialist-specific categories with defaults.
 */
export function getSpecialistRAGCategories(specialist: Specialist | null): string[] {
  const defaults = ['pattern', 'api', 'luau', 'service', 'building', 'dev']
  if (!specialist) return defaults
  // Merge specialist categories with defaults, deduplicated
  return [...new Set([...specialist.ragCategories, ...defaults])]
}
