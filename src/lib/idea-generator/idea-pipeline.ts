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

export interface GamePassSuggestion {
  name: string
  /** Price in Robux */
  price: number
  description: string
}

export interface DevProductSuggestion {
  name: string
  /** Price in Robux */
  price: number
  description: string
}

export interface GameIdea {
  id: string
  name: string
  tagline: string
  pitch: string
  genre: IdeaGenre | string
  /** The unique selling point — what makes this game stand out from the crowd. */
  uniqueSellingPoint: string
  /** Detailed description of the core gameplay loop players will repeat. */
  coreGameplayLoop: string
  mechanics: string[]
  monetization: string[]
  /** Structured GamePass suggestions with prices and descriptions. */
  gamePasses: GamePassSuggestion[]
  /** Structured DevProduct suggestions with prices and descriptions. */
  devProducts: DevProductSuggestion[]
  viralHooks: string[]
  targetAudience: string
  /** Age range of the target demographic. */
  targetAgeRange: string
  /** Platform focus: mobile, PC, console, or cross-platform. */
  targetPlatform: string
  buildComplexity: 'easy' | 'medium' | 'hard'
  estimatedRevenuePotential: 'low' | 'medium' | 'high' | 'mega'
  /** 1-100 score: how likely is this concept to go viral based on current trends. */
  trendingScore: number
  /** What current Roblox or gaming trends this concept capitalizes on. */
  trendAlignment: string[]
  /** Real Roblox games that share DNA or prove the market. */
  similarSuccessfulGames: string[]
  inspiredBy: string[]
  /** Retention mechanics: daily rewards, streaks, FOMO, social hooks. */
  retentionMechanics: string[]
  /** Social/multiplayer features that drive engagement. */
  socialFeatures: string[]
  /** Key milestones for a development roadmap. */
  developmentMilestones: string[]
  /** Free-form notes from the model. */
  notes?: string
}

export interface TrendingIdea {
  id: string
  label: string
  genre: string
  thisWeekCount: number
  examplePrompt: string
  /** Why this trend is hot right now. */
  whyTrending: string
  /** Trending intensity: rising, stable, or cooling. */
  momentum: 'rising' | 'stable' | 'cooling'
  /** Suggested genre combinations that amplify the trend. */
  suggestedCombos: string[]
  /** Estimated competition level for this trend. */
  competition: 'low' | 'medium' | 'high' | 'saturated'
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

  return `You are a senior Roblox game-design consultant and market analyst who has shipped multiple top-100 experiences and analyzed the economics of hundreds of successful Roblox games.

Your job is to generate fresh, specific, grounded viral game concepts — NOT generic slop. You think like both a game designer AND a growth hacker. Every concept must be something a solo dev or small team could realistically build with the ForjeGames AI-assisted editor.

Rules:
1. Each idea must be SPECIFIC: concrete mechanics, not "fun combat". Name exact systems.
2. Each idea must be ORIGINAL: a novel mix of 2-3 proven patterns, never a pure clone.
3. Each idea must be MONETIZABLE: realistic GamePasses with Robux prices + DevProducts with prices.
4. Each idea must have VIRAL potential: screenshotability, streamability, TikTok/YouTube moments, or social drama.
5. Be honest about build complexity. Simulator reskins are easy. Open-world RPGs are hard.
6. Provide a trending score (1-100) reflecting how aligned the concept is with current Roblox/gaming trends in 2026.
7. List 2-4 similar successful Roblox games that prove the market for this concept.
8. Describe the core gameplay loop in detail — what does the player do every 30 seconds, every 5 minutes, every session?
9. Include retention mechanics (daily rewards, streaks, seasonal events, FOMO).
10. Include social features that drive organic growth (trading, guilds, leaderboards, co-op).
11. Suggest 3-5 development milestones from MVP to full release.
12. Use the inspiration seeds below as reference for proven patterns, but do NOT copy them.
13. Return a JSON array of ideas. No markdown. No prose. No code fences.

Each idea object MUST match this TypeScript shape exactly:
{
  "name": string,                      // punchy game title (2-5 words, memorable)
  "tagline": string,                   // one-line hook (< 80 chars) — this is the YouTube thumbnail text
  "pitch": string,                     // 2-3 sentence elevator pitch a 10-year-old would understand
  "genre": string,                     // Simulator|Tycoon|Obby|RPG|Social|Horror|Racing|Combat|Sandbox|Puzzle|Survival|Adventure
  "uniqueSellingPoint": string,        // the ONE thing that makes this different from every other game
  "coreGameplayLoop": string,          // detailed description: micro-loop (30s), session loop (5-15min), meta-loop (days/weeks)
  "mechanics": string[],               // 4-6 concrete gameplay mechanics with specifics
  "monetization": string[],            // 3-5 high-level monetization strategies
  "gamePasses": [                      // 3-5 specific GamePass products
    { "name": string, "price": number, "description": string }
  ],
  "devProducts": [                     // 2-4 specific DevProduct (consumable) items
    { "name": string, "price": number, "description": string }
  ],
  "viralHooks": string[],              // 3-5 specific shareable/streamable moments
  "targetAudience": string,            // detailed: "9-13 mobile players who love pet collection and trading"
  "targetAgeRange": string,            // "8-12" | "10-14" | "13-17" | "16+" etc.
  "targetPlatform": string,            // "mobile-first" | "PC" | "cross-platform"
  "buildComplexity": "easy"|"medium"|"hard",
  "estimatedRevenuePotential": "low"|"medium"|"high"|"mega",
  "trendingScore": number,             // 1-100, how aligned with current 2026 Roblox trends
  "trendAlignment": string[],          // 2-4 specific trends this capitalizes on
  "similarSuccessfulGames": string[],  // 2-4 real Roblox games that prove this market
  "inspiredBy": string[],              // 1-3 real games (Roblox or not) that share DNA
  "retentionMechanics": string[],      // 3-5 specific retention hooks
  "socialFeatures": string[],          // 2-4 social/multiplayer features
  "developmentMilestones": string[],   // 3-5 milestones from MVP to full launch
  "notes"?: string                     // optional strategic dev notes
}

Current Roblox trend context (2026):
- Pet/creature collection systems remain evergreen. Merge mechanics are resurging.
- Anime-inspired games dominate the RPG space. Tower defense + gacha is a proven combo.
- "Brainrot" meme games (Skibidi, toilet-themed) still draw massive U13 traffic but have short shelf life.
- Dress-to-Impress style social games are growing rapidly, especially among 10-16 female players.
- UGC (user-generated content) integration games are trending up — games that let players create and sell.
- Horror chapter games continue to perform, especially with ARG/lore elements.
- Idle/AFK mechanics layered onto active games drive session length and DAU.
- Cross-platform mobile-first design is critical — 70%+ of Roblox players are on mobile.
- Social trading economies create their own content (trade drama, scam awareness, value guides).
- Seasonal events and limited-time content create FOMO that spikes concurrent players.

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
    { jsonMode: true, temperature: 0.85, maxTokens: 6000 },
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
  const num = (v: unknown, fallback: number): number =>
    typeof v === 'number' ? v : fallback
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

  const normalizeGamePass = (v: unknown): GamePassSuggestion[] => {
    if (!Array.isArray(v)) return []
    return v
      .filter((x): x is Record<string, unknown> => typeof x === 'object' && x !== null)
      .map((gp) => ({
        name: str(gp.name, 'Unnamed Pass'),
        price: num(gp.price, 99),
        description: str(gp.description, ''),
      }))
  }

  const normalizeDevProduct = (v: unknown): DevProductSuggestion[] => {
    if (!Array.isArray(v)) return []
    return v
      .filter((x): x is Record<string, unknown> => typeof x === 'object' && x !== null)
      .map((dp) => ({
        name: str(dp.name, 'Unnamed Product'),
        price: num(dp.price, 49),
        description: str(dp.description, ''),
      }))
  }

  // Clamp trending score to 1-100
  const rawTrending = num(raw.trendingScore, 50)
  const trendingScore = Math.max(1, Math.min(100, Math.round(rawTrending)))

  return {
    id: `idea_${Date.now().toString(36)}_${index}`,
    name: str(raw.name, `Untitled Idea ${index + 1}`),
    tagline: str(raw.tagline),
    pitch: str(raw.pitch),
    genre: str(raw.genre, 'Simulator'),
    uniqueSellingPoint: str(raw.uniqueSellingPoint, ''),
    coreGameplayLoop: str(raw.coreGameplayLoop, ''),
    mechanics: stringArr(raw.mechanics),
    monetization: stringArr(raw.monetization),
    gamePasses: normalizeGamePass(raw.gamePasses),
    devProducts: normalizeDevProduct(raw.devProducts),
    viralHooks: stringArr(raw.viralHooks),
    targetAudience: str(raw.targetAudience, '9-13 mobile Roblox players'),
    targetAgeRange: str(raw.targetAgeRange, '9-14'),
    targetPlatform: str(raw.targetPlatform, 'cross-platform'),
    buildComplexity: complexity(raw.buildComplexity),
    estimatedRevenuePotential: revenue(raw.estimatedRevenuePotential),
    trendingScore,
    trendAlignment: stringArr(raw.trendAlignment),
    similarSuccessfulGames: stringArr(raw.similarSuccessfulGames),
    inspiredBy: stringArr(raw.inspiredBy),
    retentionMechanics: stringArr(raw.retentionMechanics),
    socialFeatures: stringArr(raw.socialFeatures),
    developmentMilestones: stringArr(raw.developmentMilestones),
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
 * Curated Roblox trend signals that supplement real usage data. Updated
 * based on observed top-chart patterns. These ensure the trending endpoint
 * always returns useful, actionable data even when the DB has no activity.
 */
const CURATED_TRENDS: TrendingIdea[] = [
  {
    id: 'trend_curated_pet_merge',
    label: 'Pet Collection + Merge Mechanics',
    genre: 'Simulator',
    thisWeekCount: 0,
    examplePrompt: 'A pet collector where you merge pets to create legendary hybrids.',
    whyTrending: 'Pet Simulator 99 and merge-style mobile games continue to dominate. The merge mechanic adds a puzzle layer that increases session length.',
    momentum: 'rising',
    suggestedCombos: ['Simulator + Puzzle merge', 'Pet collection + Trading economy', 'Merge + Tycoon base building'],
    competition: 'high',
  },
  {
    id: 'trend_curated_dress_social',
    label: 'Fashion / Dress-Up Social Games',
    genre: 'Social',
    thisWeekCount: 0,
    examplePrompt: 'A fashion runway game where players dress up and audience votes decide the winner.',
    whyTrending: 'Dress to Impress exploded in popularity. Social fashion games attract underserved female 10-16 demographic with high engagement and spending.',
    momentum: 'rising',
    suggestedCombos: ['Fashion + Roleplay town', 'Dress-up + Dance battles', 'Runway + UGC clothing creation'],
    competition: 'medium',
  },
  {
    id: 'trend_curated_horror_chapters',
    label: 'Chapter-Based Horror with ARG Lore',
    genre: 'Horror',
    thisWeekCount: 0,
    examplePrompt: 'A horror game with chapters that release monthly, where clues hidden in-game connect to a real ARG.',
    whyTrending: 'Doors and The Mimic proved chapter-release horror drives recurring visits. ARG elements create off-platform content (theory videos, Discord communities).',
    momentum: 'stable',
    suggestedCombos: ['Horror + Puzzle rooms', 'Chapter horror + Co-op survival', 'Horror + Collection (find all lore pages)'],
    competition: 'medium',
  },
  {
    id: 'trend_curated_anime_td',
    label: 'Anime Tower Defense + Gacha',
    genre: 'RPG',
    thisWeekCount: 0,
    examplePrompt: 'An anime tower defense game where you summon heroes from different anime universes to defend waves.',
    whyTrending: 'Anime Adventures, Toilet Tower Defense, and Anime Last Stand dominate the RPG charts. Gacha monetization + content updates keep players spending.',
    momentum: 'stable',
    suggestedCombos: ['Tower defense + PvP lanes', 'Anime gacha + Open-world quests', 'TD + Base building'],
    competition: 'saturated',
  },
  {
    id: 'trend_curated_ugc_creator',
    label: 'UGC Creation / Player-Made Content',
    genre: 'Sandbox',
    thisWeekCount: 0,
    examplePrompt: 'A game where players create and sell their own obstacle courses, and earn Robux from plays.',
    whyTrending: 'Roblox is pushing UGC tools. Games that let players create content have infinite replay value and lower dev maintenance costs.',
    momentum: 'rising',
    suggestedCombos: ['Sandbox + Marketplace', 'Creator tools + Social showcase', 'UGC + Competition/voting'],
    competition: 'low',
  },
  {
    id: 'trend_curated_idle_hybrid',
    label: 'Idle/AFK Progression + Active Gameplay',
    genre: 'Simulator',
    thisWeekCount: 0,
    examplePrompt: 'A mining game with active digging gameplay AND idle offline earnings that compound.',
    whyTrending: 'Layering AFK progression onto active games dramatically increases DAU — players check in even when they do not have time to play actively.',
    momentum: 'rising',
    suggestedCombos: ['Idle earnings + Simulator grind', 'AFK + Tycoon base', 'Offline progress + Daily challenges'],
    competition: 'medium',
  },
  {
    id: 'trend_curated_survival_crafting',
    label: 'Survival Crafting with PvP Raids',
    genre: 'Survival',
    thisWeekCount: 0,
    examplePrompt: 'A survival game where you build a base, craft weapons, and raid other players for resources.',
    whyTrending: 'Rust-style survival remains popular among teen players. Base raiding creates natural content and rivalries.',
    momentum: 'stable',
    suggestedCombos: ['Survival + Base building', 'Crafting + Clan wars', 'PvP raids + Trading economy'],
    competition: 'medium',
  },
  {
    id: 'trend_curated_speedrun_obby',
    label: 'Competitive Speedrun Obbies',
    genre: 'Obby',
    thisWeekCount: 0,
    examplePrompt: 'A procedurally generated obby where the course changes every day and players compete for the fastest time.',
    whyTrending: 'Tower of Hell proved the market. Adding competitive elements (daily courses, ghost replays, ranked seasons) differentiates from the sea of generic obbies.',
    momentum: 'stable',
    suggestedCombos: ['Obby + Daily challenges', 'Speedrun + Leaderboard seasons', 'Parkour + Cosmetic rewards'],
    competition: 'high',
  },
  {
    id: 'trend_curated_trading_economy',
    label: 'Trading Economy / Marketplace Games',
    genre: 'Social',
    thisWeekCount: 0,
    examplePrompt: 'A game centered around trading rare items, with a live marketplace, price history, and scam protection.',
    whyTrending: 'Trading is its own content ecosystem. Murder Mystery 2, Adopt Me, and Pet Sim all have massive trading communities that generate YouTube/TikTok content.',
    momentum: 'rising',
    suggestedCombos: ['Trading + Pet collection', 'Marketplace + Crafting', 'Economy sim + Social hangout'],
    competition: 'medium',
  },
  {
    id: 'trend_curated_party_minigame',
    label: 'Party / Minigame Collections',
    genre: 'Social',
    thisWeekCount: 0,
    examplePrompt: 'A party game hub with 30+ rotating minigames, seasonal events, and team modes.',
    whyTrending: 'Epic Minigames model works because low barrier to entry + variety keeps sessions fresh. Great for friend groups and streams.',
    momentum: 'stable',
    suggestedCombos: ['Minigames + Seasonal themes', 'Party + Custom game creator', 'Minigames + Progression/unlocks'],
    competition: 'medium',
  },
]

/**
 * Returns the top 10 trending "idea buckets" based on real user activity
 * (GeneratedAsset + Build rows) merged with curated Roblox trend signals.
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
      whyTrending: `${prettifyType(g.type)} saw ${g._count._all} generations this week from ForjeGames users, indicating active demand.`,
      momentum: g._count._all > 20 ? 'rising' as const : 'stable' as const,
      suggestedCombos: [`${prettifyType(g.type)} + Trending genre twist`],
      competition: 'medium' as const,
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
          whyTrending: `${buildCount} active builds this week show strong creator activity on the platform.`,
          momentum: 'rising',
          suggestedCombos: ['Combine top asset types into one game'],
          competition: 'low',
        })
      }
    } catch {
      // Build table not present — silently ignore.
    }
  } catch (err) {
    console.warn('[idea-pipeline] trending query failed, using curated fallback:', err)
  }

  // Merge curated trends. If we have real data, interleave curated trends
  // that aren't already represented. If no real data, use curated directly.
  const existingLabels = new Set(rows.map((r) => r.label.toLowerCase()))
  const curatedToAdd = CURATED_TRENDS.filter(
    (ct) => !existingLabels.has(ct.label.toLowerCase()),
  )

  if (rows.length === 0) {
    // No real data — use curated trends as the primary source
    rows = curatedToAdd.map((ct, i) => ({
      ...ct,
      thisWeekCount: 80 - i * 5, // Synthetic popularity for ordering
    }))
  } else {
    // Interleave curated trends to fill up to 10 entries
    const slotsAvailable = 10 - rows.length
    rows.push(...curatedToAdd.slice(0, slotsAvailable))
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
    puzzle: 'Puzzle',
    survival: 'Survival',
    adventure: 'Adventure',
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
full idea shape: name, tagline, pitch, genre, uniqueSellingPoint, coreGameplayLoop, mechanics,
monetization, gamePasses (array of {name, price, description}), devProducts (array of {name, price, description}),
viralHooks, targetAudience, targetAgeRange, targetPlatform, buildComplexity,
estimatedRevenuePotential, trendingScore (1-100), trendAlignment, similarSuccessfulGames,
inspiredBy, retentionMechanics, socialFeatures, developmentMilestones, notes.`

  const user = `Base idea:\n${base}\n\nTwist: "${twist.trim()}"\n\nReturn ONLY a single JSON object.`

  const raw = await callAI(
    system,
    [{ role: 'user', content: user }],
    { jsonMode: true, temperature: 0.9, maxTokens: 3000 },
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
