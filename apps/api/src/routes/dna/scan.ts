/**
 * Game DNA Scanner API
 * POST /api/dna/scan   — start a scan
 * GET  /api/dna/scans  — list recent scans for user
 * GET  /api/dna/:id    — get scan result
 */

import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { requireAuth } from '../../middleware/auth'
import { db } from '../../lib/db'
import { claudeChat } from '../../lib/ai/providers/anthropic'

export const dnaRoutes = new Hono()

dnaRoutes.use('*', requireAuth)

// ---------------------------------------------------------------------------
// Roblox API helpers
// ---------------------------------------------------------------------------

function extractPlaceId(url: string): string | null {
  // Handles formats:
  // https://www.roblox.com/games/123456789/Game-Name
  // https://www.roblox.com/games/123456789
  const match = url.match(/roblox\.com\/games\/(\d+)/i)
  return match ? match[1] : null
}

interface RobloxGameData {
  id: number
  name: string
  description: string
  creator: { name: string; type: string }
  playing: number
  visits: number
  maxPlayers: number
  created: string
  updated: string
  genre: string
  favoritedCount: number
}

async function fetchRobloxGameData(placeId: string): Promise<RobloxGameData | null> {
  try {
    // Get universe ID from place ID
    const universeRes = await fetch(
      `https://apis.roblox.com/universes/v1/places/${placeId}/universe`,
      { signal: AbortSignal.timeout(8000) }
    )
    if (!universeRes.ok) return null
    const universeData = await universeRes.json() as { universeId: number }
    const universeId = universeData.universeId

    // Get game details
    const gameRes = await fetch(
      `https://games.roblox.com/v1/games?universeIds=${universeId}`,
      { signal: AbortSignal.timeout(8000) }
    )
    if (!gameRes.ok) return null
    const gameData = await gameRes.json() as { data: RobloxGameData[] }
    return gameData.data?.[0] ?? null
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Genome analysis via Claude
// ---------------------------------------------------------------------------

interface GenomeScores {
  game_type: number
  target_age: number
  session_length: number
  monetization_model: number
  progression_pace: number
  zone_density: number
  art_style: number
  retention_driver: number
  estimated_dau: number
  engagement_loop: number
  update_cadence: number
  community_size: number
}

interface GenomeResult {
  labels: {
    gameType: string
    targetAge: string
    sessionLength: string
    monetizationModel: string
    progressionPace: string
    zoneDensity: string
    artStyle: string
    retentionDriver: string
    estimatedDau: string
    engagementLoop: string
    updateCadence: string
    communitySize: string
  }
  scores: GenomeScores
  genreAverages: GenomeScores
  recommendations: string[]
}

async function analyzeGenome(gameData: RobloxGameData): Promise<GenomeResult> {
  const prompt = `You are a Roblox game analysis expert. Analyze this game and extract a 12-variable genome.

Game Data:
- Name: ${gameData.name}
- Genre: ${gameData.genre}
- Description: ${gameData.description?.slice(0, 500) || 'No description'}
- Active players: ${gameData.playing}
- Total visits: ${gameData.visits}
- Max players: ${gameData.maxPlayers}
- Created: ${gameData.created}
- Last updated: ${gameData.updated}
- Favorites: ${gameData.favoritedCount}
- Creator: ${gameData.creator.name} (${gameData.creator.type})

Return a JSON object with EXACTLY this structure (no markdown, raw JSON):
{
  "labels": {
    "gameType": "string describing the game type (e.g. Simulator, Tycoon, Roleplay, Obby, etc.)",
    "targetAge": "string (e.g. 6-9, 10-13, 13-16, All Ages)",
    "sessionLength": "string (e.g. Short 5-15min, Medium 15-45min, Long 45min+)",
    "monetizationModel": "string (e.g. Cosmetics-heavy, Pay-to-win, Battle pass, Minimal)",
    "progressionPace": "string (e.g. Fast, Medium, Slow, Prestige-based)",
    "zoneDensity": "string (e.g. Open world, Dense urban, Linear, Hub-based)",
    "artStyle": "string (e.g. Cartoony, Realistic, Low-poly, Stylized)",
    "retentionDriver": "string (e.g. Daily quests, Social bonds, Collection, Competition)",
    "estimatedDau": "string (e.g. <1K, 1K-10K, 10K-100K, 100K+)",
    "engagementLoop": "string (e.g. Grind → Upgrade → Flex, Explore → Collect → Trade)",
    "updateCadence": "string (e.g. Weekly, Monthly, Irregular, Abandoned)",
    "communitySize": "string (e.g. Niche, Growing, Established, Massive)"
  },
  "scores": {
    "game_type": 0-100,
    "target_age": 0-100,
    "session_length": 0-100,
    "monetization_model": 0-100,
    "progression_pace": 0-100,
    "zone_density": 0-100,
    "art_style": 0-100,
    "retention_driver": 0-100,
    "estimated_dau": 0-100,
    "engagement_loop": 0-100,
    "update_cadence": 0-100,
    "community_size": 0-100
  },
  "genreAverages": {
    "game_type": 0-100,
    "target_age": 0-100,
    "session_length": 0-100,
    "monetization_model": 0-100,
    "progression_pace": 0-100,
    "zone_density": 0-100,
    "art_style": 0-100,
    "retention_driver": 0-100,
    "estimated_dau": 0-100,
    "engagement_loop": 0-100,
    "update_cadence": 0-100,
    "community_size": 0-100
  },
  "recommendations": [
    "Specific actionable recommendation 1",
    "Specific actionable recommendation 2",
    "Specific actionable recommendation 3",
    "Specific actionable recommendation 4",
    "Specific actionable recommendation 5"
  ]
}

For scores: higher = better/more. For genre averages, use your knowledge of similar ${gameData.genre} games.`

  const result = await claudeChat(
    [{ role: 'user', content: prompt }],
    { maxTokens: 2048, systemPrompt: 'You are a precise Roblox game analysis AI. Return only valid JSON, no markdown or prose.' }
  )

  try {
    return JSON.parse(result.content) as GenomeResult
  } catch {
    // Fallback genome if parsing fails
    const defaultScore = 50
    const defaultScores: GenomeScores = {
      game_type: defaultScore, target_age: defaultScore, session_length: defaultScore,
      monetization_model: defaultScore, progression_pace: defaultScore, zone_density: defaultScore,
      art_style: defaultScore, retention_driver: defaultScore, estimated_dau: defaultScore,
      engagement_loop: defaultScore, update_cadence: defaultScore, community_size: defaultScore,
    }
    return {
      labels: {
        gameType: 'Unknown', targetAge: 'All Ages', sessionLength: 'Medium',
        monetizationModel: 'Standard', progressionPace: 'Medium', zoneDensity: 'Mixed',
        artStyle: 'Roblox Default', retentionDriver: 'Progression', estimatedDau: 'Unknown',
        engagementLoop: 'Play → Earn → Spend', updateCadence: 'Unknown', communitySize: 'Unknown',
      },
      scores: defaultScores,
      genreAverages: defaultScores,
      recommendations: ['Could not fully analyze game. Try again or provide more context.'],
    }
  }
}

// ---------------------------------------------------------------------------
// POST /api/dna/scan
// ---------------------------------------------------------------------------

const scanBodySchema = z.object({
  url: z.string().url().refine(
    (val) => /roblox\.com\/games\/\d+/i.test(val),
    { message: 'Must be a valid Roblox game URL (e.g. https://www.roblox.com/games/123456789/...)' }
  ),
})

dnaRoutes.post('/scan', zValidator('json', scanBodySchema), async (c) => {
  const clerkId = c.get('clerkId') as string
  const { url } = c.req.valid('json')

  // Look up internal user
  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) return c.json({ error: 'User not found' }, 404)

  const placeId = extractPlaceId(url)
  if (!placeId) {
    return c.json({ error: 'Invalid Roblox game URL. Expected format: https://www.roblox.com/games/123456789/...' }, 400)
  }

  // Create pending scan record
  const scan = await db.gameScan.create({
    data: {
      userId: user.id,
      robloxUrl: url,
      robloxPlaceId: placeId,
      status: 'PROCESSING',
    },
  })

  // Run analysis async (fire-and-forget with status updates)
  runAnalysis(scan.id, placeId, url).catch((err) => {
    console.error('[dna/scan] Analysis failed:', err)
  })

  return c.json({ scanId: scan.id, status: 'PROCESSING' }, 202)
})

async function runAnalysis(scanId: string, placeId: string, url: string): Promise<void> {
  try {
    const gameData = await fetchRobloxGameData(placeId)

    if (!gameData) {
      await db.gameScan.update({
        where: { id: scanId },
        data: { status: 'FAILED', errorMsg: 'Could not fetch game data from Roblox API. The game may be private or the URL invalid.' },
      })
      return
    }

    // Update scan with game name
    await db.gameScan.update({
      where: { id: scanId },
      data: { gameName: gameData.name },
    })

    // Run Claude genome analysis
    const genome = await analyzeGenome(gameData)

    // Persist genome
    await db.gameGenome.create({
      data: {
        scanId,
        gameType: genome.labels.gameType,
        targetAge: genome.labels.targetAge,
        sessionLength: genome.labels.sessionLength,
        monetizationModel: genome.labels.monetizationModel,
        progressionPace: genome.labels.progressionPace,
        zoneDensity: genome.labels.zoneDensity,
        artStyle: genome.labels.artStyle,
        retentionDriver: genome.labels.retentionDriver,
        estimatedDau: genome.labels.estimatedDau,
        engagementLoop: genome.labels.engagementLoop,
        updateCadence: genome.labels.updateCadence,
        communitySize: genome.labels.communitySize,
        scores: genome.scores,
        genreAverages: genome.genreAverages,
        rawRobloxData: gameData as unknown as Record<string, unknown>,
        recommendations: genome.recommendations,
      },
    })

    await db.gameScan.update({
      where: { id: scanId },
      data: { status: 'COMPLETE' },
    })
  } catch (err) {
    await db.gameScan.update({
      where: { id: scanId },
      data: {
        status: 'FAILED',
        errorMsg: err instanceof Error ? err.message : 'Analysis failed',
      },
    })
  }
}

// ---------------------------------------------------------------------------
// GET /api/dna/scans — list recent scans
// ---------------------------------------------------------------------------

dnaRoutes.get('/scans', async (c) => {
  const clerkId = c.get('clerkId') as string
  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) return c.json({ error: 'User not found' }, 404)

  const scans = await db.gameScan.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      id: true,
      robloxUrl: true,
      gameName: true,
      status: true,
      errorMsg: true,
      createdAt: true,
    },
  })

  return c.json({ scans })
})

// ---------------------------------------------------------------------------
// GET /api/dna/:id — get single scan with genome
// ---------------------------------------------------------------------------

dnaRoutes.get('/:id', async (c) => {
  const clerkId = c.get('clerkId') as string
  const scanId = c.req.param('id')

  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) return c.json({ error: 'User not found' }, 404)

  const scan = await db.gameScan.findFirst({
    where: { id: scanId, userId: user.id },
    include: { genome: true },
  })

  if (!scan) return c.json({ error: 'Scan not found' }, 404)

  return c.json({ scan })
})
