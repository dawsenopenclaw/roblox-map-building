/**
 * Game DNA Scanner — analyzes a Roblox game and produces a GameGenome.
 *
 * Pipeline:
 *   1. Parse placeId from URL or raw ID
 *   2. Fetch game metadata from Roblox Open Cloud (Games API)
 *   3. Send description + stats to Claude for structured genome classification
 *   4. Persist GameScan + GameGenome to DB
 *   5. Return the GameGenome
 *
 * Env vars:
 *   ROBLOX_OPEN_CLOUD_API_KEY  — needs universe:read scope
 *   ANTHROPIC_API_KEY          — Claude claude-3-5-haiku for classification
 */

import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import { db } from '@/lib/db'
import { trackCost } from '@/lib/cost-tracker'

// ── Anthropic client (lazy) ──────────────────────────────────────────────────

let _claude: Anthropic | null = null
function getClaude(): Anthropic {
  if (_claude) return _claude
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) throw new Error('ANTHROPIC_API_KEY is not configured')
  _claude = new Anthropic({ apiKey: key })
  return _claude
}

// ── Roblox API helpers ────────────────────────────────────────────────────────

interface RobloxUniverseInfo {
  id:          number
  rootPlaceId: number
  name:        string
  description: string
  genre:       string
  visits:      number
  favoritedCount: number
  playing:     number
  maxPlayers:  number
  created:     string
  updated:     string
}

async function fetchUniverseFromPlaceId(placeId: string): Promise<{ universeId: string; info: RobloxUniverseInfo }> {
  // Step 1: resolve universeId from placeId
  const universeRes = await fetch(
    `https://apis.roblox.com/universes/v1/places?placeIds=${placeId}`,
    {
      headers: { 'x-api-key': process.env.ROBLOX_OPEN_CLOUD_API_KEY ?? '' },
      signal: AbortSignal.timeout(10_000),
    },
  )

  if (!universeRes.ok) {
    // Fall back to public API (no auth needed)
    const pubRes = await fetch(
      `https://games.roblox.com/v1/games/multiget-place-details?placeIds=${placeId}`,
      { signal: AbortSignal.timeout(10_000) },
    )
    if (!pubRes.ok) throw new Error(`Could not resolve universeId for placeId ${placeId}`)
    const pubData = await pubRes.json() as Array<{ placeId: number; universeId: number }>
    const match = pubData.find((p) => String(p.placeId) === placeId)
    if (!match) throw new Error(`PlaceId ${placeId} not found`)
    return fetchUniverseInfo(String(match.universeId))
  }

  const data = await universeRes.json() as { data?: Array<{ universeId: number }> }
  const universeId = data.data?.[0]?.universeId
  if (!universeId) throw new Error(`No universe found for placeId ${placeId}`)
  return fetchUniverseInfo(String(universeId))
}

async function fetchUniverseInfo(universeId: string): Promise<{ universeId: string; info: RobloxUniverseInfo }> {
  const res = await fetch(
    `https://games.roblox.com/v1/games?universeIds=${universeId}`,
    { signal: AbortSignal.timeout(10_000) },
  )
  if (!res.ok) throw new Error(`Roblox Games API returned ${res.status}`)
  const body = await res.json() as { data?: RobloxUniverseInfo[] }
  const info = body.data?.[0]
  if (!info) throw new Error(`No game data for universeId ${universeId}`)
  return { universeId, info }
}

// ── URL parser ────────────────────────────────────────────────────────────────

export function parsePlaceIdFromUrl(input: string): string {
  // Accept numeric string directly
  if (/^\d+$/.test(input.trim())) return input.trim()

  // https://www.roblox.com/games/123456789/Game-Name
  const match = input.match(/roblox\.com\/games\/(\d+)/)
  if (match?.[1]) return match[1]

  throw new Error(`Cannot parse a placeId from: ${input}`)
}

// ── Claude genome classifier ───────────────────────────────────────────────────

interface GenomeScores {
  monetization:   number
  progression:    number
  social:         number
  combat:         number
  exploration:    number
  creativity:     number
  competition:    number
  cooperation:    number
  customization:  number
  narrative:      number
  difficulty:     number
  replayability:  number
}

interface ClassifiedGenome {
  gameType:          string
  targetAge:         string
  sessionLength:     string
  monetizationModel: string
  progressionPace:   string
  zoneDensity:       string
  artStyle:          string
  retentionDriver:   string
  estimatedDau:      string
  engagementLoop:    string
  updateCadence:     string
  communitySize:     string
  scores:            GenomeScores
  recommendations:   string[]
  inputTokens:       number
  outputTokens:      number
}

async function classifyGenome(info: RobloxUniverseInfo): Promise<ClassifiedGenome> {
  const claude = getClaude()

  const prompt = `You are a Roblox game analyst. Analyze this game and return a strict JSON response.

Game: ${info.name}
Genre: ${info.genre}
Description: ${info.description.slice(0, 800) || '(no description)'}
Visits: ${info.visits.toLocaleString()}
Favorited: ${info.favoritedCount.toLocaleString()}
Currently Playing: ${info.playing.toLocaleString()}
Max Players: ${info.maxPlayers}
Created: ${info.created.slice(0, 10)}
Last Updated: ${info.updated.slice(0, 10)}

Return ONLY valid JSON matching this exact schema (no markdown, no extra text):
{
  "gameType": "one of: simulator, obby, roleplay, tycoon, fps, rpg, puzzle, social, horror, racing, tower_defense, other",
  "targetAge": "one of: kids_6_9, kids_10_12, teens_13_17, all_ages",
  "sessionLength": "one of: under_5min, 5_to_20min, 20_to_60min, 60min_plus",
  "monetizationModel": "one of: cosmetics, gamepass, subscriptions, pay_to_win, free, mixed",
  "progressionPace": "one of: fast, medium, slow, endless",
  "zoneDensity": "one of: single_area, few_zones, many_zones, open_world",
  "artStyle": "one of: realistic, stylized, anime, blocky, minimalist, mixed",
  "retentionDriver": "one of: social, collection, competition, story, exploration, daily_rewards",
  "estimatedDau": "one of: under_1k, 1k_to_10k, 10k_to_100k, over_100k",
  "engagementLoop": "string (1 sentence describing the core loop)",
  "updateCadence": "one of: daily, weekly, monthly, irregular, abandoned",
  "communitySize": "one of: niche, growing, established, massive",
  "scores": {
    "monetization":  0-100,
    "progression":   0-100,
    "social":        0-100,
    "combat":        0-100,
    "exploration":   0-100,
    "creativity":    0-100,
    "competition":   0-100,
    "cooperation":   0-100,
    "customization": 0-100,
    "narrative":     0-100,
    "difficulty":    0-100,
    "replayability": 0-100
  },
  "recommendations": ["3 to 5 actionable tips to improve or learn from this game"]
}`

  const response = await claude.messages.create({
    model:      'claude-haiku-4-5',
    max_tokens: 1024,
    messages:   [{ role: 'user', content: prompt }],
  })

  const raw = response.content.find((b) => b.type === 'text')?.text ?? ''
  const parsed = JSON.parse(raw) as ClassifiedGenome

  return {
    ...parsed,
    inputTokens:  response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  }
}

// ── Main exported function ────────────────────────────────────────────────────

export async function scanGame(
  placeIdOrUrl: string,
  userId:       string,
): Promise<{ scan: { id: string; gameName: string | null }; genome: object }> {
  const placeId = parsePlaceIdFromUrl(placeIdOrUrl)

  // Create scan record (PENDING)
  const scan = await db.gameScan.create({
    data: {
      userId,
      robloxUrl:     placeIdOrUrl,
      robloxPlaceId: placeId,
      status:        'PROCESSING',
    },
  })

  try {
    // 1. Fetch game metadata from Roblox
    const { info } = await fetchUniverseFromPlaceId(placeId)

    // Update scan with game name
    await db.gameScan.update({
      where: { id: scan.id },
      data:  { gameName: info.name },
    })

    // 2. Classify with Claude
    const genome = await classifyGenome(info)

    // 3. Track cost (haiku pricing: $0.001 / 1K tokens)
    const totalTokens = genome.inputTokens + genome.outputTokens
    const costUsd     = (totalTokens / 1000) * 0.001
    await trackCost({
      userId,
      operation:  'claude_haiku',
      costUsd,
      tokensCost: totalTokens,
      metadata:   { scanId: scan.id, placeId },
    })

    // 4. Persist genome
    const savedGenome = await db.gameGenome.create({
      data: {
        scanId:            scan.id,
        gameType:          genome.gameType,
        targetAge:         genome.targetAge,
        sessionLength:     genome.sessionLength,
        monetizationModel: genome.monetizationModel,
        progressionPace:   genome.progressionPace,
        zoneDensity:       genome.zoneDensity,
        artStyle:          genome.artStyle,
        retentionDriver:   genome.retentionDriver,
        estimatedDau:      genome.estimatedDau,
        engagementLoop:    genome.engagementLoop,
        updateCadence:     genome.updateCadence,
        communitySize:     genome.communitySize,
        scores:            genome.scores as unknown as Record<string, number>,
        genreAverages:     undefined,
        rawRobloxData:     {
          name:           info.name,
          genre:          info.genre,
          visits:         info.visits,
          favoritedCount: info.favoritedCount,
          playing:        info.playing,
          maxPlayers:     info.maxPlayers,
        },
        visionAnalysis:    undefined,
        recommendations:   genome.recommendations,
      },
    })

    // 5. Mark scan complete
    await db.gameScan.update({
      where: { id: scan.id },
      data:  { status: 'COMPLETE' },
    })

    return {
      scan: { id: scan.id, gameName: info.name },
      genome: savedGenome,
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
    await db.gameScan.update({
      where: { id: scan.id },
      data:  { status: 'FAILED', errorMsg },
    })
    throw err
  }
}
