import 'server-only'

import { PROFANITY_LIST, BYPASS_PATTERNS, PII_PATTERNS } from './content-moderation-words'

// ─── Content Moderation System ──────────────────────────────────────────────
// Multi-layer filter for COPPA compliance. Kids age 8-16 use this platform.
//
// Layer 1: Profanity word list (fast, <1ms, no API call)
// Layer 2: PII / pattern detection (fast, <1ms, no API call)
// Layer 3: OpenAI Moderation API (async, ~200ms, graceful fallback)
//
// Design principles:
//  - Moderation failure must NEVER block the user (log + allow)
//  - Never reveal which words were flagged (don't teach bypass)
//  - Word-boundary matching to avoid false positives
//  - Strip zero-width / invisible chars before matching

// ── Pre-computed structures for O(1) word lookups ───────────────────────────

// Build a Set for fast exact-match lookups. Multi-word phrases stay as-is;
// single words use word-boundary regex matching in containsProfanity.
const PROFANITY_SET = new Set(PROFANITY_LIST.map(w => w.toLowerCase()))

// Separate single words from multi-word phrases for different matching strategies
const SINGLE_WORD_PROFANITY: string[] = []
const MULTI_WORD_PROFANITY: string[] = []

for (const word of PROFANITY_LIST) {
  if (word.includes(' ')) {
    MULTI_WORD_PROFANITY.push(word.toLowerCase())
  } else {
    SINGLE_WORD_PROFANITY.push(word.toLowerCase())
  }
}

// Pre-compile word-boundary regexes for single words (avoids "assassin" matching "ass")
const SINGLE_WORD_REGEXES: { word: string; regex: RegExp }[] = SINGLE_WORD_PROFANITY.map(w => ({
  word: w,
  regex: new RegExp(`\\b${escapeRegex(w)}\\b`, 'i'),
}))

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// ── Zero-width character stripping ──────────────────────────────────────────
// Kids try inserting invisible chars to bypass filters

const INVISIBLE_CHARS = /[\u200B\u200C\u200D\u200E\u200F\uFEFF\u00AD\u034F\u2028\u2029\u180E]/g

function stripInvisible(text: string): string {
  return text.replace(INVISIBLE_CHARS, '')
}

// ── Layer 1: Profanity Detection ────────────────────────────────────────────

export function containsProfanity(text: string): { flagged: boolean; matches: string[] } {
  const cleaned = stripInvisible(text)
  const matches: string[] = []

  // Check single words with word boundaries
  for (const { word, regex } of SINGLE_WORD_REGEXES) {
    if (regex.test(cleaned)) {
      matches.push(word)
    }
  }

  // Check multi-word phrases (substring match, case-insensitive)
  const lowerCleaned = cleaned.toLowerCase()
  for (const phrase of MULTI_WORD_PROFANITY) {
    if (lowerCleaned.includes(phrase)) {
      matches.push(phrase)
    }
  }

  // Check l33tspeak bypass patterns
  for (const [label, regex] of BYPASS_PATTERNS) {
    if (regex.test(cleaned)) {
      // Don't double-count if the canonical form was already matched
      if (!matches.includes(label)) {
        matches.push(label)
      }
    }
  }

  return { flagged: matches.length > 0, matches }
}

// ── Layer 2: PII / Pattern Detection ────────────────────────────────────────

export function detectPII(text: string): { flagged: boolean; type: string | null } {
  const cleaned = stripInvisible(text)

  for (const { type, pattern } of PII_PATTERNS) {
    if (pattern.test(cleaned)) {
      return { flagged: true, type }
    }
  }

  return { flagged: false, type: null }
}

// ── Layer 3: AI Moderation (OpenAI Moderation API — free tier) ──────────────

interface AIModResult {
  flagged: boolean
  categories: string[]
}

export async function checkAIModeration(text: string): Promise<AIModResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    // No key configured — can't check, don't block
    return { flagged: false, categories: [] }
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000) // 3s hard timeout

    const res = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ input: text }),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!res.ok) {
      console.warn(`[content-moderation] OpenAI moderation API returned ${res.status}`)
      return { flagged: false, categories: [] }
    }

    const data = (await res.json()) as {
      results: Array<{
        flagged: boolean
        categories: Record<string, boolean>
      }>
    }

    const result = data.results?.[0]
    if (!result) return { flagged: false, categories: [] }

    const flaggedCategories = Object.entries(result.categories)
      .filter(([, v]) => v === true)
      .map(([k]) => k)

    return {
      flagged: result.flagged,
      categories: flaggedCategories,
    }
  } catch (err) {
    // Network error, timeout, etc. — don't block the user
    console.warn('[content-moderation] AI moderation check failed:', (err as Error).message)
    return { flagged: false, categories: [] }
  }
}

// ── Combined Moderation Entry Point ─────────────────────────────────────────

export interface ModerationResult {
  allowed: boolean
  reason: string | null
  flaggedWords: string[]
  piiDetected: string | null
  aiCategories: string[]
}

export async function moderateContent(
  text: string,
  options?: { skipAI?: boolean },
): Promise<ModerationResult> {
  try {
    // Layer 1: Profanity (fast, synchronous)
    const profanity = containsProfanity(text)
    if (profanity.flagged) {
      return {
        allowed: false,
        reason: 'inappropriate_language',
        flaggedWords: profanity.matches,
        piiDetected: null,
        aiCategories: [],
      }
    }

    // Layer 2: PII detection (fast, synchronous)
    const pii = detectPII(text)
    if (pii.flagged) {
      return {
        allowed: false,
        reason: 'personal_information',
        flaggedWords: [],
        piiDetected: pii.type,
        aiCategories: [],
      }
    }

    // Layer 3: AI moderation (async, optional)
    if (!options?.skipAI) {
      const ai = await checkAIModeration(text)
      if (ai.flagged) {
        return {
          allowed: false,
          reason: 'ai_safety',
          flaggedWords: [],
          piiDetected: null,
          aiCategories: ai.categories,
        }
      }
    }

    return {
      allowed: true,
      reason: null,
      flaggedWords: [],
      piiDetected: null,
      aiCategories: [],
    }
  } catch (err) {
    // Moderation failure must NEVER block the user
    console.error('[content-moderation] Unexpected error:', (err as Error).message)
    return {
      allowed: true,
      reason: null,
      flaggedWords: [],
      piiDetected: null,
      aiCategories: [],
    }
  }
}

// ── User-friendly rejection messages ────────────────────────────────────────
// Different messages based on rejection reason, but NEVER reveal what was flagged.

export function getModerationMessage(result: ModerationResult): string {
  switch (result.reason) {
    case 'inappropriate_language':
      return "I can't help with that request. Let's keep things fun and appropriate! What would you like to build?"
    case 'personal_information':
      return "For your safety, please don't share personal information here. Let's focus on building something cool instead!"
    case 'ai_safety':
      return "That request isn't something I can help with. How about we build something awesome together?"
    default:
      return "I can't process that request. What would you like to build?"
  }
}

export const MODERATION_SUGGESTIONS = [
  'Build me a house',
  'Make a tycoon game',
  'Create a cool UI',
]
