/**
 * Viral Idea Generator — Pipeline
 *
 * Server-side functions that turn the seed library into fresh, structured
 * game concepts. Uses the shared AI provider (`callAI`) so this inherits
 * Gemini → Groq fallback rather than binding to a single vendor.
 *
 * Exports:
 *   - generateIdeas(...)   — brainstorm fresh ideas from seeds
 *   - getTrendingIdeas()   — week-trending ideas pulled from real usage
 *   - remixIdea(...)       — twist an existing idea into a hybrid
 */

import 'server-only'
import { callAI } from '@/lib/ai/provider'
import { db } from '@/lib/db'
import {
  IDEA_SEEDS,
  randomSeeds,
  type IdeaSeed,
  type IdeaGenre,
} from './idea-presets'

// ── Types ────────────────────────────────────────────────────────────────────

export interface GameIdea {
  id: string
  name: string
  tagline: string
  pitch: string
  genre: IdeaGenre | string
  mechanics: string[]
  monetization: string[]
  viralHooks: string[]
  targetAudience: string
  buildComplexity: 'easy' | 'medium' | 'hard'
  estimatedRevenuePotential: 'low' | 'medium' | 'high' | 'mega'
  inspiredBy: string[]
  /** Free-form notes from the model. */
  notes?: string
}

export interface TrendingIdea {
  id: string
  label: string
  genre: string
  thisWeekCount: number
  examplePrompt: string
}

export interface GenerateIdeasParams {
  userPrompt?: string
  genre?: IdeaGenre
  count: number
  userId: string
}

// ── Prompt builder ───────────────────────────────────────────────────────────

function buildSystemPrompt(seeds: IdeaSeed[]): string {
  const seedBlock = seeds
    .map((s, i) => {
      return [
        `## Inspiration Seed ${i + 1}: ${s.id}`,
        `- Pattern: ${s.pattern}`,
        `- Genre: ${s.genre}`,
        `- Examples: ${s.examples.join(', ')}`,
        `- Monetization: ${s.monetizationHook}`,
        `- Viral hook: ${s.viralHook}`,
        `- Build difficulty: ${s.difficulty}`,
        `- Revenue ceiling: ${s.estimatedRevenuePotential}`,
      ].join('\n')
    })
    .join('\n\n')

  return `You are a senior Roblox game-design consultant who has shipped multiple top-100 experiences.
Your job is to generate fresh, specific, grounded viral game concepts — NOT generic slop.

Rules:
1. Each idea must be SPECIFIC: concrete mechanics, not "fun combat".
2. Each idea must be ORIGINAL: a novel mix of patterns, never a pure clone.
3. Each idea must be MONETIZABLE: realistic gamepasses + dev products.
4. Each idea must have VIRAL potential: screenshotability, streamability, or social drama.
5. Be honest about build complexity. Simulator reskins are easy. Open-world RPGs are hard.
6. Use the inspiration seeds below as a reference for proven patterns, but do NOT copy them.
7. Return a JSON array of ideas. No markdown. No prose. No code fences.

Each idea object MUST match this TypeScript shape exactly:
{
  "name": string,                      // punchy game title
  "tagline": string,                   // one-line hook (< 80 chars)
  "pitch": string,                     // 2-3 sentence elevator pitch
  "genre": string,                     // Simulator|Tycoon|Obby|RPG|Social|Horror|Racing|Combat|Sandbox
  "mechanics": string[],               // 4-6 concrete gameplay mechanics
  "monetization": string[],            // 3-5 gamepasses/products
  "viralHooks": string[],              // 3-5 shareable moments
  "targetAudience": string,            // "9-13 mobile", "teen PC sweats", etc.
  "buildComplexity": "easy"|"medium"|"hard",
  "estimatedRevenuePotential": "low"|"medium"|"high"|"mega",
  "inspiredBy": string[],              // 1-3 real games that share DNA
  "notes"?: string                     // optional dev notes
}

${seedBlock}`
}

function buildUserPrompt(params: { userPrompt?: string; genre?: IdeaGenre; count: number }): string {
  const parts: string[] = []
  parts.push(`Generate ${params.count} viral Roblox game concept${params.count === 1 ? '' : 's'}.`)
  if (params.genre) parts.push(`Target genre: ${params.genre}.`)
  if (params.userPrompt && params.userPrompt.trim().length > 0) {
    parts.push(`The user's creative direction: "${params.userPrompt.trim()}"`)
  }
  parts.push('Return ONLY a JSON array. No markdown. No explanations.')
  return parts.join(' ')
}

// ── JSON extraction helper ───────────────────────────────────────────────────

function extractJsonArray(raw: string): unknown {
  const trimmed = raw.trim()
  // Try to strip code fences first
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)
  const candidate = fenced ? fenced[1].trim() : trimmed

  // Best-effort: slice from first '[' to last ']'
  const start = candidate.indexOf('[')
  const end = candidate.lastIndexOf(']')
  if (start === -1 || end === -1 || end < start) {
    throw new Error('Model did not return a JSON array')
  }
  const sliced = candidate.slice(start, end + 1)
  return JSON.parse(sliced)
}

// ── Public: generateIdeas ────────────────────────────────────────────────────

/**
 * Generate N fully-fleshed game concepts. Uses 5-10 random seeds as
 * inspiration. The caller is responsible for spending credits BEFORE calling.
 */
export async function generateIdeas(
  params: GenerateIdeasParams,
): Promise<GameIdea[]> {
  const count = Math.max(1, Math.min(5, params.count))
  const seedCount = 5 + Math.floor(Math.random() * 6) // 5-10
  const seeds = randomSeeds(seedCount, params.genre)

  const system = buildSystemPrompt(seeds)
  const user = buildUserPrompt({
    userPrompt: params.userPrompt,
    genre: params.genre,
    count,
  })

  const raw = await callAI(
    system,
    [{ role: 'user', content: user }],
    { jsonMode: true, temperature: 0.85, maxTokens: 3500 },
  )

  let parsed: unknown
  try {
    parsed = extractJsonArray(raw)
  } catch (err) {
    console.error('[idea-pipeline] JSON parse failed:', err, 'raw:', raw.slice(0, 500))
    throw new Error('AI returned malformed output. Please try again.')
  }

  if (!Array.isArray(parsed)) {
    throw new Error('AI did not return an array of ideas')
  }

  const ideas: GameIdea[] = parsed
    .filter((x): x is Record<string, unknown> => typeof x === 'object' && x !== null)
    .map((obj, i) => normalizeIdea(obj, i))

  if (ideas.length === 0) {
    throw new Error('AI returned no valid ideas')
  }

  return ideas
}

function normalizeIdea(raw: Record<string, unknown>, index: number): GameIdea {
  const stringArr = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
  const str = (v: unknown, fallback = ''): string =>
    typeof v === 'string' ? v : fallback
  const complexity = (v: unknown): GameIdea['buildComplexity'] => {
    const s = typeof v === 'string' ? v.toLowerCase() : ''
    if (s === 'easy' || s === 'medium' || s === 'hard') return s
    return 'medium'
  }
  const revenue = (v: unknown): GameIdea['estimatedRevenuePotential'] => {
    const s = typeof v === 'string' ? v.toLowerCase() : ''
    if (s === 'low' || s === 'medium' || s === 'high' || s === 'mega') return s
    return 'medium'
  }

  return {
    id: `idea_${Date.now().toString(36)}_${index}`,
    name: str(raw.name, `Untitled Idea ${index + 1}`),
    tagline: str(raw.tagline),
    pitch: str(raw.pitch),
    genre: str(raw.genre, 'Simulator'),
    mechanics: stringArr(raw.mechanics),
    monetization: stringArr(raw.monetization),
    viralHooks: stringArr(raw.viralHooks),
    targetAudience: str(raw.targetAudience, '9-13 mobile Roblox players'),
    buildComplexity: complexity(raw.buildComplexity),
    estimatedRevenuePotential: revenue(raw.estimatedRevenuePotential),
    inspiredBy: stringArr(raw.inspiredBy),
    notes: typeof raw.notes === 'string' ? raw.notes : undefined,
  }
}

// ── Public: getTrendingIdeas ─────────────────────────────────────────────────

interface TrendingCacheEntry {
  data: TrendingIdea[]
  expiresAt: number
}

let trendingCache: TrendingCacheEntry | null = null
const TRENDING_TTL_MS = 60 * 60 * 1000 // 1 hour

/**
 * Returns the top 10 trending "idea buckets" based on what users are
 * actually building this week. Pulls from GeneratedAsset + Build rows.
 * Cached for 1 hour in-process.
 */
export async function getTrendingIdeas(): Promise<TrendingIdea[]> {
  if (trendingCache && trendingCache.expiresAt > Date.now()) {
    return trendingCache.data
  }

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  let rows: TrendingIdea[] = []
  try {
    // Group recent asset generations by coarse-grained `type` bucket.
    const assetGroups = await db.generatedAsset.groupBy({
      by: ['type'],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
      orderBy: { _count: { type: 'desc' } },
      take: 10,
    })

    rows = assetGroups.map((g, i) => ({
      id: `trend_asset_${g.type}`,
      label: prettifyType(g.type),
      genre: genreForType(g.type),
      thisWeekCount: g._count._all,
      examplePrompt: buildExamplePromptFor(g.type, i),
    }))

    // Augment with Build-table activity if available.
    try {
      const buildCount = await db.build.count({ where: { createdAt: { gte: since } } })
      if (buildCount > 0) {
        rows.unshift({
          id: 'trend_all_builds',
          label: 'Active builds this week',
          genre: 'Sandbox',
          thisWeekCount: buildCount,
          examplePrompt: 'A new hybrid combining this week\'s hottest mechanics.',
        })
      }
    } catch {
      // Build table not present — silently ignore.
    }
  } catch (err) {
    console.warn('[idea-pipeline] trending query failed, using seed fallback:', err)
  }

  if (rows.length === 0) {
    // Graceful fallback: synthesize from seed library.
    rows = IDEA_SEEDS.slice(0, 10).map((s, i) => ({
      id: `trend_seed_${s.id}`,
      label: s.pattern,
      genre: s.genre,
      thisWeekCount: 50 - i * 3,
      examplePrompt: `Make a fresh take on ${s.pattern.toLowerCase()}.`,
    }))
  }

  trendingCache = { data: rows.slice(0, 10), expiresAt: Date.now() + TRENDING_TTL_MS }
  return trendingCache.data
}

function prettifyType(type: string): string {
  const map: Record<string, string> = {
    mesh: '3D meshes',
    building: 'Building assets',
    character: 'Character assets',
    vehicle: 'Vehicle assets',
    music: 'Background music',
    sfx: 'Sound effects',
    voice: 'Voice lines',
    texture: 'PBR textures',
    animation: 'Animations',
    gfx: 'GFX / marketing art',
  }
  return map[type] ?? `${type.charAt(0).toUpperCase()}${type.slice(1)} assets`
}

function genreForType(type: string): string {
  const map: Record<string, IdeaGenre> = {
    building: 'Sandbox',
    character: 'RPG',
    vehicle: 'Racing',
    mesh: 'Sandbox',
    music: 'Social',
    sfx: 'Combat',
    voice: 'Social',
    texture: 'Sandbox',
    animation: 'Combat',
    gfx: 'Social',
  }
  return map[type] ?? 'Simulator'
}

function buildExamplePromptFor(type: string, i: number): string {
  const fallback = IDEA_SEEDS[i % IDEA_SEEDS.length]
  return `Combine ${prettifyType(type).toLowerCase()} with ${fallback.pattern.toLowerCase()}.`
}

// ── Public: remixIdea ────────────────────────────────────────────────────────

/**
 * Remix an existing idea by layering a twist. Produces exactly one hybrid.
 */
export async function remixIdea(
  ideaId: string,
  twist: string,
  baseIdea?: Partial<GameIdea>,
): Promise<GameIdea> {
  if (!twist || twist.trim().length < 3) {
    throw new Error('Twist prompt is too short')
  }

  const base = baseIdea
    ? JSON.stringify(baseIdea)
    : `{"id":"${ideaId}"}`

  const system = `You are a Roblox game-design consultant specializing in hybrid/remix concepts.
Given a base idea and a twist, produce ONE new concept that keeps what is strong about the base
and adds the twist naturally. Return a SINGLE JSON object (no array, no markdown) matching the
same shape as the standard idea object: name, tagline, pitch, genre, mechanics, monetization,
viralHooks, targetAudience, buildComplexity, estimatedRevenuePotential, inspiredBy, notes.`

  const user = `Base idea:\n${base}\n\nTwist: "${twist.trim()}"\n\nReturn ONLY a single JSON object.`

  const raw = await callAI(
    system,
    [{ role: 'user', content: user }],
    { jsonMode: true, temperature: 0.9, maxTokens: 1500 },
  )

  const trimmed = raw.trim().replace(/^```(?:json)?/, '').replace(/```$/, '').trim()
  const start = trimmed.indexOf('{')
  const end = trimmed.lastIndexOf('}')
  if (start === -1 || end === -1) {
    throw new Error('Remix AI did not return a JSON object')
  }

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(trimmed.slice(start, end + 1))
  } catch (err) {
    console.error('[idea-pipeline/remix] parse error:', err)
    throw new Error('AI returned malformed remix output')
  }

  return normalizeIdea(parsed, 0)
}
