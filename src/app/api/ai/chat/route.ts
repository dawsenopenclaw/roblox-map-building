import { NextRequest, NextResponse } from 'next/server'

// ─── Intent detection ─────────────────────────────────────────────────────────

type IntentKey =
  | 'terrain'
  | 'building'
  | 'npc'
  | 'script'
  | 'ui'
  | 'audio'
  | 'lighting'
  | 'economy'
  | 'quest'
  | 'combat'
  | 'vehicle'
  | 'particle'
  | 'default'

const KEYWORD_INTENT_MAP: Array<{ patterns: RegExp[]; intent: IntentKey }> = [
  {
    patterns: [/\b(terrain|land|mountain|hill|valley|biome|grass|water|lake|river|flatten|raise|lower|forest|city|racing|track)\b/i],
    intent: 'terrain',
  },
  {
    patterns: [/\b(build|place|castle|house|tower|wall|bridge|shop|structure|building)\b/i],
    intent: 'building',
  },
  {
    patterns: [/\b(npc|character|enemy|mob|guard|villager|merchant|shopkeeper|quest.?giver)\b/i],
    intent: 'npc',
  },
  {
    patterns: [/\b(script|code|luau|function|event|module|server|client|system)\b/i],
    intent: 'script',
  },
  {
    patterns: [/\b(ui|gui|menu|button|screen|hud|leaderboard)\b/i],
    intent: 'ui',
  },
  {
    patterns: [/\b(sound|music|audio|sfx|ambience)\b/i],
    intent: 'audio',
  },
  {
    patterns: [/\b(light|fog|sky|ambient|sunrise|sunset|atmosphere)\b/i],
    intent: 'lighting',
  },
  {
    patterns: [/\b(economy|shop|currency|coin|token|price|buy|sell|store)\b/i],
    intent: 'economy',
  },
  {
    patterns: [/\b(quest|mission|objective|task|reward|story)\b/i],
    intent: 'quest',
  },
  {
    patterns: [/\b(combat|fight|attack|weapon|sword|gun|health|damage|pvp)\b/i],
    intent: 'combat',
  },
  {
    patterns: [/\b(vehicle|car|truck|boat|plane|bike|drive)\b/i],
    intent: 'vehicle',
  },
  {
    patterns: [/\b(particle|fire|smoke|spark|glow|trail|effect)\b/i],
    intent: 'particle',
  },
]

function detectIntent(message: string): IntentKey {
  for (const entry of KEYWORD_INTENT_MAP) {
    if (entry.patterns.some((p) => p.test(message))) {
      return entry.intent
    }
  }
  return 'default'
}

// ─── Demo responses ───────────────────────────────────────────────────────────

const DEMO_RESPONSES: Record<IntentKey, string> = {
  terrain:
    'Terrain generated! Created a mountainous biome with rivers and forests. Used 25 tokens.',
  building:
    'Building placed! Medieval castle with 4 towers and a drawbridge. Used 32 tokens.',
  npc:
    "NPC created! Shopkeeper named 'Old Man Jenkins' with buy/sell dialogue. Used 18 tokens.",
  script:
    'Script generated! Server script for coin collection system. Used 15 tokens.',
  ui:
    'UI built! Leaderboard screen with player stats and animations. Used 22 tokens.',
  audio:
    'Audio configured! Ambient forest sounds with positional SFX. Used 12 tokens.',
  lighting:
    'Lighting adjusted! Golden-hour atmosphere with volumetric fog. Used 10 tokens.',
  economy:
    'Economy configured! Shop with 5 items, coin rewards, and purchase confirmation. Used 28 tokens.',
  quest:
    'Quest created! Collect 10 mushrooms, deliver to the merchant, earn 50 coins reward. Used 24 tokens.',
  combat:
    'Combat system added! Sword with hitbox detection, health bars, and death animations. Used 35 tokens.',
  vehicle:
    'Vehicle placed! Drivable car with 4-wheel steering, engine sounds, and seat animations. Used 30 tokens.',
  particle:
    'Particle effect added! Sparkle trail that follows the player with golden glow. Used 14 tokens.',
  default:
    "Got it! I've processed your request. Here's what I did: generated and placed the requested assets in your Roblox Studio scene. Used 20 tokens.",
}

// ─── Token estimation ─────────────────────────────────────────────────────────

function estimateTokens(text: string): number {
  return Math.max(8, Math.ceil(text.split(/\s+/).length * 1.3))
}

// ─── POST /api/ai/chat ────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: { message?: unknown; conversationId?: unknown }

  try {
    body = (await req.json()) as { message?: unknown; conversationId?: unknown }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const message = typeof body.message === 'string' ? body.message.trim() : ''

  if (!message || message.length > 4000) {
    return NextResponse.json({ error: 'message is required (max 4000 chars)' }, { status: 400 })
  }

  const intent = detectIntent(message)
  const tokensUsed = estimateTokens(message)
  const responseMessage = DEMO_RESPONSES[intent]

  return NextResponse.json({
    message: responseMessage,
    tokensUsed,
    intent,
  })
}
