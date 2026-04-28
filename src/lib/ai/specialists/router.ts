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
 * @deprecated Use findSpecialists() for multi-specialist activation.
 */
export async function findSpecialist(userMessage: string): Promise<Specialist | null> {
  const matches = await findSpecialists(userMessage)
  return matches.length > 0 ? matches[0] : null
}

/**
 * Find the TOP 3 specialists that match a user message above threshold.
 * Multiple specialists combine their expertise — e.g. a "tycoon game with
 * combat" request gets both the tycoon specialist AND the combat specialist.
 */
export async function findSpecialists(userMessage: string, maxCount: number = 3): Promise<Specialist[]> {
  // Don't activate specialists for very short messages (greetings, questions)
  if (userMessage.trim().split(/\s+/).length < 3) return []

  const index = await getIndex()
  const words = userMessage.toLowerCase().replace(/[^a-z0-9\s-]/g, '').split(/\s+/)
  const messageText = userMessage.toLowerCase()

  const scored: Array<{ specialist: Specialist; score: number }> = []

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

    if (score >= 2) {
      scored.push({ specialist, score })
    }
  }

  // Sort by score descending, take top N
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, maxCount).map(s => s.specialist)
}

/**
 * Build the specialist-enhanced system prompt.
 * Supports single specialist (legacy) or array of specialists.
 */
export function applySpecialist(basePrompt: string, specialist: Specialist | Specialist[]): string {
  const specialists = Array.isArray(specialist) ? specialist : [specialist]
  if (specialists.length === 0) return basePrompt

  const specialistBlocks = specialists.map((s, i) =>
    `[SPECIALIST ${i + 1}: ${s.name}]\n${s.prompt}`
  ).join('\n\n---\n\n')

  return `${specialistBlocks}

${basePrompt}`
}

/**
 * Get RAG categories to use based on the specialists' domains.
 * Accepts single specialist, array, or null.
 */
export function getSpecialistRAGCategories(specialist: Specialist | Specialist[] | null): string[] {
  const defaults = ['pattern', 'api', 'luau', 'service', 'building', 'dev']
  if (!specialist) return defaults
  const specialists = Array.isArray(specialist) ? specialist : [specialist]
  const allCategories = specialists.flatMap(s => s.ragCategories)
  return [...new Set([...allCategories, ...defaults])]
}
