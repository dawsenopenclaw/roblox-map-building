/**
 * low-context-amplifier.ts
 *
 * Turn a vague prompt like "make a castle" or "tycoon game" into an expert
 * build brief so the downstream planner has enough signal to produce a
 * world-class output on the first shot.
 *
 * This is the "rate-limited prompt agent" that never shipped in the
 * mega-build session. It runs BEFORE the build planner. It is cheap
 * (single Gemini call with a ~400 token budget), bounded (hard 3-second
 * timeout), and resilient (falls back to a heuristic amplification if
 * the AI provider fails).
 *
 * Flow:
 *
 *   user prompt ──► detectVagueness ──► amplify ──► AmplifiedSpec
 *                        │                │
 *                        ▼                └─ Gemini Flash call
 *                    heuristic
 *
 * Consumers: build-planner, asset-director, prompt-enhancer (as an
 * optional pre-step).
 */

import 'server-only'
import { callAI } from './provider'
import { resolveBuildTemplate, type Genre } from './prompt-templates/build-templates'

// ───────────────────────────────────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────────────────────────────────

export interface AmplifiedSpec {
  /** The original prompt the user typed. */
  originalPrompt: string
  /** The amplified expert brief. 3-5 sentences. */
  expertBrief: string
  /** Detected / inferred genre. */
  genre: Genre
  /** Mood keywords the brief implies (short phrases). */
  mood: string[]
  /** Narrative hook — one-sentence story context. */
  narrative: string
  /** Estimated part count for the build planner budget. */
  estimatedParts: number
  /** Technical constraints the planner must respect. */
  technicalConstraints: string[]
  /** How "vague" the input was, 0 (rich) to 1 (very vague). */
  vagueness: number
  /** Whether amplification actually happened or we returned the original. */
  amplified: boolean
  /** Source of the amplification. */
  source: 'llm' | 'heuristic' | 'passthrough'
  /** Total time spent amplifying, ms. */
  latencyMs: number
}

// ───────────────────────────────────────────────────────────────────────────
// Vagueness detection — purely local
// ───────────────────────────────────────────────────────────────────────────

/**
 * Compute a "vagueness" score 0..1 for a raw prompt.
 *
 * Signals of vagueness:
 *   - very short length (< 6 words)
 *   - no concrete nouns / numbers
 *   - contains generic fillers ("game", "cool", "stuff", "something")
 *
 * Signals of richness:
 *   - specific numbers ("50 studs", "3 floors")
 *   - specific materials ("stone wall", "wooden plank")
 *   - descriptive adjectives
 */
export function detectVagueness(prompt: string): number {
  const trimmed = prompt.trim()
  if (trimmed.length === 0) return 1

  const words = trimmed.split(/\s+/).filter(Boolean)
  const wordCount = words.length

  let score = 0

  // Length signal
  if (wordCount <= 3) score += 0.6
  else if (wordCount <= 6) score += 0.35
  else if (wordCount <= 10) score += 0.15

  // Generic filler words
  const FILLERS = [
    'game',
    'cool',
    'stuff',
    'thing',
    'something',
    'anything',
    'nice',
    'good',
    'awesome',
    'just',
    'basic',
    'simple',
    'please',
    'make',
    'build',
    'create',
  ]
  const fillerHits = words.filter((w) => FILLERS.includes(w.toLowerCase())).length
  score += Math.min(0.25, fillerHits * 0.08)

  // Specificity: concrete numbers, materials, sizes
  const SPECIFIC_RX = /\b(\d+)\s*(studs?|parts?|floors?|stories|m|ft)\b|\b(stone|wood|metal|glass|brick|grass|concrete)\b/i
  if (SPECIFIC_RX.test(trimmed)) score -= 0.3

  // Rich descriptors reduce vagueness
  const RICH_RX = /\b(gothic|medieval|cyberpunk|steampunk|post-apocalyptic|tropical|victorian|frontier|futuristic|haunted)\b/i
  if (RICH_RX.test(trimmed)) score -= 0.15

  return Math.max(0, Math.min(1, parseFloat(score.toFixed(2))))
}

// ───────────────────────────────────────────────────────────────────────────
// Genre inference (heuristic)
// ───────────────────────────────────────────────────────────────────────────

const GENRE_KEYWORDS: Array<{ genre: Genre; words: string[] }> = [
  { genre: 'medieval-fantasy', words: ['castle', 'knight', 'medieval', 'kingdom', 'dragon', 'wizard', 'tavern'] },
  { genre: 'dark-fantasy', words: ['gothic', 'dark souls', 'bloodborne', 'grimdark', 'cursed', 'necromancer'] },
  { genre: 'sci-fi', words: ['space', 'station', 'starship', 'hangar', 'alien', 'planet', 'spaceship'] },
  { genre: 'cyberpunk', words: ['cyberpunk', 'neon', 'hacker', 'megacorp', 'implant', 'chrome'] },
  { genre: 'post-apocalyptic', words: ['apocalypse', 'wasteland', 'fallout', 'ruins', 'zombie', 'nuclear'] },
  { genre: 'modern-city', words: ['city', 'downtown', 'skyscraper', 'urban', 'street', 'cafe'] },
  { genre: 'tropical-island', words: ['island', 'beach', 'tropical', 'palm', 'ocean', 'sand'] },
  { genre: 'western-frontier', words: ['western', 'cowboy', 'saloon', 'frontier', 'wild west'] },
  { genre: 'pirate-cove', words: ['pirate', 'galleon', 'treasure', 'cove', 'caribbean'] },
  { genre: 'horror-mansion', words: ['haunted', 'horror', 'mansion', 'ghost', 'creepy', 'scary'] },
  { genre: 'tycoon-simulator', words: ['tycoon', 'factory', 'dropper', 'conveyor', 'simulator'] },
  { genre: 'obby-parkour', words: ['obby', 'parkour', 'obstacle', 'jumps', 'platformer'] },
  { genre: 'racing-track', words: ['race', 'racing', 'track', 'circuit', 'kart'] },
  { genre: 'tower-defense', words: ['tower defense', 'td', 'waves', 'lane', 'defense'] },
  { genre: 'rpg-adventure', words: ['rpg', 'adventure', 'quest', 'village', 'dungeon'] },
]

function inferGenre(prompt: string): Genre {
  const lower = prompt.toLowerCase()
  for (const { genre, words } of GENRE_KEYWORDS) {
    if (words.some((w) => lower.includes(w))) return genre
  }
  return 'generic'
}

// ───────────────────────────────────────────────────────────────────────────
// Heuristic amplification fallback
// ───────────────────────────────────────────────────────────────────────────

function heuristicAmplify(prompt: string): AmplifiedSpec {
  const genre = inferGenre(prompt)
  const template = resolveBuildTemplate(genre)
  const brief = [
    `${prompt.trim()}.`,
    `Execute this in the ${genre} style with world-class craft.`,
    `Prioritise a strong focal silhouette, coherent material palette, and at least 6 supporting props.`,
  ].join(' ')

  return {
    originalPrompt: prompt,
    expertBrief: brief,
    genre,
    mood: [genre],
    narrative: `A coherent ${genre} scene.`,
    estimatedParts: 80,
    technicalConstraints: [
      'Keep the total part count under 250',
      'Use Color3.fromRGB() for all colors',
      'Prefer stud values that are multiples of 2',
    ],
    vagueness: detectVagueness(prompt),
    amplified: true,
    source: 'heuristic',
    latencyMs: 0,
  }
}

// ───────────────────────────────────────────────────────────────────────────
// LLM amplification
// ───────────────────────────────────────────────────────────────────────────

interface RawSpec {
  expertBrief?: unknown
  genre?: unknown
  mood?: unknown
  narrative?: unknown
  estimatedParts?: unknown
  technicalConstraints?: unknown
}

function parseRawSpec(raw: string): RawSpec | null {
  try {
    let s = raw.trim()
    if (s.startsWith('```')) s = s.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '')
    const first = s.indexOf('{')
    const last = s.lastIndexOf('}')
    if (first >= 0 && last > first) s = s.slice(first, last + 1)
    const parsed = JSON.parse(s) as unknown
    if (parsed && typeof parsed === 'object') return parsed as RawSpec
    return null
  } catch {
    return null
  }
}

function asString(v: unknown, fallback: string): string {
  return typeof v === 'string' && v.length > 0 ? v : fallback
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.map((x) => (typeof x === 'string' ? x : '')).filter((x) => x.length > 0).slice(0, 8)
}

function asPositiveInt(v: unknown, fallback: number): number {
  if (typeof v === 'number' && Number.isFinite(v) && v > 0) return Math.round(v)
  if (typeof v === 'string') {
    const n = Number.parseInt(v, 10)
    if (Number.isFinite(n) && n > 0) return n
  }
  return fallback
}

/**
 * Amplify a vague prompt into an AmplifiedSpec. Low-context input gets
 * expanded into a 3-5 sentence expert brief with mood, narrative, and
 * technical constraints. Rich prompts are returned essentially unchanged.
 *
 * Costs ~$0.0002 per call on Gemini Flash. Bounded at 3s — if the provider
 * is slow or fails, we return a heuristic brief instead.
 */
export async function amplifyLowContext(prompt: string): Promise<AmplifiedSpec> {
  const start = Date.now()
  const trimmed = prompt.trim()
  const vagueness = detectVagueness(trimmed)

  // If the prompt is already rich, skip amplification entirely.
  if (vagueness < 0.3) {
    const genre = inferGenre(trimmed)
    return {
      originalPrompt: prompt,
      expertBrief: trimmed,
      genre,
      mood: [],
      narrative: '',
      estimatedParts: 100,
      technicalConstraints: [],
      vagueness,
      amplified: false,
      source: 'passthrough',
      latencyMs: Date.now() - start,
    }
  }

  const system = [
    `You are a world-class Roblox game designer.`,
    `Given a short user prompt, expand it into an expert build brief (3-5 sentences)`,
    `that a build-planner AI can execute with zero ambiguity.`,
    ``,
    `Return a STRICT JSON object — no markdown fences, no prose — with this shape:`,
    `{`,
    `  "expertBrief": "3-5 sentences of concrete, sensory, specific build instructions",`,
    `  "genre": "one of: medieval-fantasy|dark-fantasy|sci-fi|cyberpunk|post-apocalyptic|modern-city|tropical-island|western-frontier|pirate-cove|horror-mansion|tycoon-simulator|obby-parkour|racing-track|tower-defense|rpg-adventure|generic",`,
    `  "mood": ["2-4 short mood descriptors"],`,
    `  "narrative": "one-sentence story hook the scene implies",`,
    `  "estimatedParts": 60-400,`,
    `  "technicalConstraints": ["3-5 hard constraints the planner must respect"]`,
    `}`,
  ].join('\n')

  const user = `User prompt: "${trimmed}"\n\nAmplify it.`

  let raw: string
  try {
    raw = await Promise.race([
      callAI(system, [{ role: 'user', content: user }], {
        jsonMode: true,
        maxTokens: 512,
        temperature: 0.4,
      }),
      new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error('amplifier timeout')), 3_000),
      ),
    ])
  } catch (e) {
    console.error('[low-context-amplifier] provider error:', (e as Error).message)
    const fallback = heuristicAmplify(prompt)
    return { ...fallback, vagueness, latencyMs: Date.now() - start }
  }

  const parsed = parseRawSpec(raw)
  if (!parsed) {
    const fallback = heuristicAmplify(prompt)
    return { ...fallback, vagueness, latencyMs: Date.now() - start }
  }

  const inferredGenre = inferGenre(trimmed)
  const genreCandidate = typeof parsed.genre === 'string' ? parsed.genre : inferredGenre
  const genre: Genre = (KNOWN_GENRES as readonly string[]).includes(genreCandidate)
    ? (genreCandidate as Genre)
    : inferredGenre

  return {
    originalPrompt: prompt,
    expertBrief: asString(parsed.expertBrief, heuristicAmplify(prompt).expertBrief),
    genre,
    mood: asStringArray(parsed.mood),
    narrative: asString(parsed.narrative, ''),
    estimatedParts: asPositiveInt(parsed.estimatedParts, 80),
    technicalConstraints: asStringArray(parsed.technicalConstraints),
    vagueness,
    amplified: true,
    source: 'llm',
    latencyMs: Date.now() - start,
  }
}

const KNOWN_GENRES: readonly Genre[] = [
  'medieval-fantasy',
  'dark-fantasy',
  'sci-fi',
  'cyberpunk',
  'post-apocalyptic',
  'modern-city',
  'tropical-island',
  'western-frontier',
  'pirate-cove',
  'horror-mansion',
  'tycoon-simulator',
  'obby-parkour',
  'racing-track',
  'tower-defense',
  'rpg-adventure',
  'generic',
] as const

/**
 * Exposed for tests — purely synchronous heuristic amplifier.
 */
export function _heuristicAmplifyForTest(prompt: string): AmplifiedSpec {
  return heuristicAmplify(prompt)
}
