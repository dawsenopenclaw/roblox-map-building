/**
 * Specialist Router — picks the best specialist agent for a user's request.
 *
 * Strategy: keyword matching with scoring. Each specialist has keywords;
 * we score each specialist against the user's message and pick the top match.
 * If no specialist scores above the threshold, falls back to a general builder.
 *
 * The registry is lazy-loaded on first use to avoid bloating serverless
 * function bundles (the 200 specialist prompts are ~155KB of data).
 */

import 'server-only'
import type { Specialist } from './types'

export type { Specialist }

// Lazy-loaded specialist index — initialized on first findSpecialist() call
let specialistIndex: Array<{
  specialist: Specialist
  keywordSet: Set<string>
  wordSet: Set<string>
}> | null = null

async function getIndex() {
  if (specialistIndex) return specialistIndex

  // Dynamic import keeps the 155KB of specialist data out of the initial bundle
  const { SPECIALISTS } = await import('./registry')

  specialistIndex = SPECIALISTS.map(s => ({
    specialist: s,
    keywordSet: new Set(s.keywords.map(k => k.toLowerCase())),
    wordSet: new Set(s.keywords.flatMap(k => k.toLowerCase().split(/[\s-]+/))),
  }))
  return specialistIndex
}

/**
 * Find the best specialist for a given user message.
 * Returns null if no specialist matches above threshold.
 */
export async function findSpecialist(userMessage: string): Promise<Specialist | null> {
  // Don't activate specialists for very short messages (greetings, questions)
  if (userMessage.trim().split(/\s+/).length < 3) return null

  const index = await getIndex()
  const words = userMessage.toLowerCase().replace(/[^a-z0-9\s-]/g, '').split(/\s+/)
  const messageText = userMessage.toLowerCase()

  let bestScore = 0
  let bestMatch: Specialist | null = null

  for (const { specialist, keywordSet, wordSet } of index) {
    let score = 0

    for (const keyword of keywordSet) {
      if (messageText.includes(keyword)) {
        score += keyword.split(/\s+/).length * 3
      }
    }

    for (const word of words) {
      if (word.length < 3) continue
      if (wordSet.has(word)) {
        score += 1
      }
    }

    if (score > bestScore) {
      bestScore = score
      bestMatch = specialist
    }
  }

  return bestScore >= 2 ? bestMatch : null
}

/**
 * Build the specialist-enhanced system prompt.
 */
export function applySpecialist(basePrompt: string, specialist: Specialist): string {
  return `[SPECIALIST MODE: ${specialist.name}]
${specialist.prompt}

${basePrompt}`
}

/**
 * Get RAG categories to use based on the specialist's domain.
 */
export function getSpecialistRAGCategories(specialist: Specialist | null): string[] {
  const defaults = ['pattern', 'api', 'luau', 'service', 'building', 'dev']
  if (!specialist) return defaults
  return [...new Set([...specialist.ragCategories, ...defaults])]
}
