import { NextRequest, NextResponse } from 'next/server'

// ─── Shared intent detection (duplicated to keep routes self-contained) ───────

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

function estimateTokens(text: string): number {
  return Math.max(8, Math.ceil(text.split(/\s+/).length * 1.3))
}

// ─── GET /api/ai/chat/estimate?message= ──────────────────────────────────────

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url)
  const message = searchParams.get('message')?.trim() ?? ''

  if (!message) {
    return NextResponse.json({ error: 'message query param is required' }, { status: 400 })
  }

  const intent = detectIntent(message)
  const estimatedTokens = estimateTokens(message)

  return NextResponse.json({ estimatedTokens, intent })
}
