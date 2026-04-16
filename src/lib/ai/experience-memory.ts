/**
 * Experience Memory — stores successful prompt->code pairs and retrieves
 * similar past successes as few-shot examples for future generations.
 *
 * Uses an in-memory LRU cache (max 200 entries) with async fire-and-forget
 * persistence to the BuildFeedback table when available.
 */

import { db } from '@/lib/db'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ExperienceEntry {
  prompt: string
  code: string
  score: number
  model: string
  keywords: Set<string>
  createdAt: Date
}

export interface MatchedExperience {
  prompt: string
  code: string
  score: number
  overlapCount: number
}

// Re-export for backward compat with any stub consumers
export type ExperienceRecord = MatchedExperience

// ---------------------------------------------------------------------------
// Keyword extraction
// ---------------------------------------------------------------------------

const STOP_WORDS = new Set([
  'a',
  'an',
  'the',
  'me',
  'my',
  'i',
  'we',
  'you',
  'it',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'being',
  'have',
  'has',
  'had',
  'do',
  'does',
  'did',
  'will',
  'would',
  'shall',
  'should',
  'may',
  'might',
  'must',
  'can',
  'could',
  'build',
  'make',
  'create',
  'add',
  'put',
  'get',
  'set',
  'use',
  'give',
  'with',
  'and',
  'or',
  'but',
  'in',
  'on',
  'at',
  'to',
  'for',
  'of',
  'by',
  'from',
  'up',
  'out',
  'if',
  'about',
  'into',
  'through',
  'during',
  'before',
  'after',
  'above',
  'below',
  'between',
  'same',
  'some',
  'any',
  'each',
  'every',
  'all',
  'both',
  'few',
  'more',
  'most',
  'other',
  'no',
  'not',
  'only',
  'own',
  'so',
  'than',
  'too',
  'very',
  'just',
  'that',
  'this',
  'these',
  'those',
  'then',
  'there',
  'here',
  'when',
  'where',
  'why',
  'how',
  'what',
  'which',
  'who',
  'whom',
  'its',
  'his',
  'her',
  'their',
  'our',
  'also',
  'as',
  'like',
  'want',
  'need',
  'please',
  'something',
  'thing',
])

/** Roblox-specific terms kept even if short. */
const ROBLOX_TERMS = new Set(['npc', 'gui', 'ui', 'hp', 'xp'])

export function extractKeywords(prompt: string): Set<string> {
  const words = prompt
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)

  const keywords = new Set<string>()
  for (const word of words) {
    if (ROBLOX_TERMS.has(word)) {
      keywords.add(word)
      continue
    }
    if (word.length < 2) continue
    if (STOP_WORDS.has(word)) continue
    keywords.add(word)
  }
  return keywords
}

// ---------------------------------------------------------------------------
// LRU Cache
// ---------------------------------------------------------------------------

class LRUCache<V> {
  private map = new Map<string, V>()
  constructor(private maxSize: number) {}

  get(key: string): V | undefined {
    const val = this.map.get(key)
    if (val !== undefined) {
      // Move to end (most recently used)
      this.map.delete(key)
      this.map.set(key, val)
    }
    return val
  }

  set(key: string, value: V): void {
    if (this.map.has(key)) {
      this.map.delete(key)
    } else if (this.map.size >= this.maxSize) {
      // Evict least recently used (first entry)
      const firstKey = this.map.keys().next().value as string | undefined
      if (firstKey !== undefined) {
        this.map.delete(firstKey)
      }
    }
    this.map.set(key, value)
  }

  /** Iterate all values (most-recently-used last). */
  allValues(): V[] {
    return Array.from(this.map.values())
  }

  get size(): number {
    return this.map.size
  }
}

// ---------------------------------------------------------------------------
// Simple prompt hash (for dedup / DB key)
// ---------------------------------------------------------------------------

function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i)
    hash = ((hash << 5) - hash + ch) | 0
  }
  return Math.abs(hash).toString(36)
}

// ---------------------------------------------------------------------------
// ExperienceMemory class
// ---------------------------------------------------------------------------

const MAX_CACHE_ENTRIES = 200
const MIN_SCORE = 70

export class ExperienceMemory {
  private cache = new LRUCache<ExperienceEntry>(MAX_CACHE_ENTRIES)
  private dbLoaded = false

  /**
   * Record a successful prompt->code pair. Only stores if score >= 70.
   * DB write is fire-and-forget.
   */
  async recordExperience(
    prompt: string,
    code: string,
    score: number,
    model: string,
  ): Promise<void> {
    if (score < MIN_SCORE) return

    const keywords = extractKeywords(prompt)
    const key = simpleHash(prompt)
    const entry: ExperienceEntry = {
      prompt,
      code,
      score,
      model,
      keywords,
      createdAt: new Date(),
    }

    this.cache.set(key, entry)

    // Fire-and-forget DB persistence
    this.persistToDb(prompt, code, score, model).catch(() => {
      // Silently ignore DB errors — in-memory cache is the primary store
    })
  }

  /**
   * Find past successes with similar prompts, ranked by keyword overlap.
   */
  async findSimilarSuccesses(
    prompt: string,
    limit = 3,
  ): Promise<MatchedExperience[]> {
    // Hydrate cache from DB on first query
    if (!this.dbLoaded) {
      await this.loadFromDb().catch(() => {})
      this.dbLoaded = true
    }

    const queryKeywords = extractKeywords(prompt)
    if (queryKeywords.size === 0) return []

    const scored: MatchedExperience[] = []

    for (const entry of this.cache.allValues()) {
      let overlapCount = 0
      for (const kw of Array.from(queryKeywords)) {
        if (entry.keywords.has(kw)) overlapCount++
      }
      if (overlapCount > 0) {
        scored.push({
          prompt: entry.prompt,
          code: entry.code,
          score: entry.score,
          overlapCount,
        })
      }
    }

    // Sort by overlap count desc, then by score desc
    scored.sort((a, b) => b.overlapCount - a.overlapCount || b.score - a.score)

    return scored.slice(0, limit)
  }

  /**
   * Format matched experiences as a context block for the AI system prompt.
   */
  formatAsExamples(successes: MatchedExperience[]): string {
    if (successes.length === 0) return ''

    const lines: string[] = ['[PROVEN_EXAMPLES]']
    lines.push(
      'These are verified working examples similar to the current request:',
    )
    lines.push('')

    for (let i = 0; i < successes.length; i++) {
      const s = successes[i]
      const codeLines = s.code.split('\n')
      const truncated =
        codeLines.length > 50
          ? codeLines.slice(0, 50).join('\n') + '\n-- (truncated) --'
          : s.code

      lines.push(`Example ${i + 1} (score: ${s.score}):`)
      lines.push(`User asked: "${s.prompt}"`)
      lines.push('Working code:')
      lines.push('```lua')
      lines.push(truncated)
      lines.push('```')
      lines.push('')
    }

    lines.push('[/PROVEN_EXAMPLES]')
    return lines.join('\n')
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private async persistToDb(
    prompt: string,
    code: string,
    score: number,
    model: string,
  ): Promise<void> {
    try {
      await db.buildFeedback.create({
        data: {
          promptHash: simpleHash(prompt),
          code,
          worked: true,
          score,
          model,
        },
      })
    } catch {
      // DB may not be available
    }
  }

  private async loadFromDb(): Promise<void> {
    try {
      const rows = await db.buildFeedback.findMany({
        where: { worked: true, score: { gte: MIN_SCORE } },
        orderBy: { score: 'desc' },
        take: MAX_CACHE_ENTRIES,
      })

      for (const row of rows) {
        const key = row.promptHash
        if (!this.cache.get(key)) {
          this.cache.set(key, {
            prompt: '',
            code: row.code,
            score: row.score,
            model: row.model,
            keywords: new Set<string>(),
            createdAt: row.createdAt,
          })
        }
      }
    } catch {
      // DB not available
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton export
// ---------------------------------------------------------------------------

export const experienceMemory = new ExperienceMemory()

// ---------------------------------------------------------------------------
// Convenience re-exports matching the function-level API
// ---------------------------------------------------------------------------

export async function recordExperience(
  prompt: string,
  code: string,
  score: number,
  model: string,
): Promise<void> {
  return experienceMemory.recordExperience(prompt, code, score, model)
}

export async function findSimilarSuccesses(
  prompt: string,
  limit = 3,
): Promise<MatchedExperience[]> {
  return experienceMemory.findSimilarSuccesses(prompt, limit)
}

export function formatAsExamples(successes: MatchedExperience[]): string {
  return experienceMemory.formatAsExamples(successes)
}
