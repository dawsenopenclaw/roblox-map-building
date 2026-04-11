/**
 * Theme Detector — classifies a raw user prompt into one of the available
 * ThemePreset ids.
 *
 * Uses the cheap provider (Gemini Flash / Groq llama) because classification
 * does not need Sonnet-tier reasoning. If no AI provider is available or the
 * response cannot be parsed, falls back to a lightweight keyword match and
 * ultimately to 'modern-city' as the neutral default.
 */

import 'server-only'
import { callAI } from '@/lib/ai/provider'
import { THEME_IDS, THEME_PRESETS, themeCatalogSummary } from './theme-presets'

export interface ThemeDetectionResult {
  themeId: string
  confidence: number
  reasoning: string
}

// ────────────────────────────────────────────────────────────────────────────
// Keyword fallback — used when the AI provider fails. Not perfect, but gives
// a reasonable best-guess for the common prompts without a network call.
// ────────────────────────────────────────────────────────────────────────────

const KEYWORD_MAP: Array<{ id: string; keywords: string[] }> = [
  {
    id: 'medieval-fantasy',
    keywords: ['castle', 'knight', 'medieval', 'kingdom', 'dungeon', 'keep', 'tavern', 'blacksmith', 'drawbridge', 'moat', 'torch'],
  },
  {
    id: 'dark-fantasy',
    keywords: ['dark souls', 'elden ring', 'bloodborne', 'grimdark', 'cursed', 'blood', 'gothic cathedral', 'eldritch', 'undead'],
  },
  {
    id: 'high-fantasy',
    keywords: ['elf', 'elven', 'dwarven', 'lord of the rings', 'rivendell', 'dragon', 'wizard tower', 'mithril', 'crystal spire'],
  },
  {
    id: 'cyberpunk-noir',
    keywords: ['cyberpunk', 'neon', 'hacker', 'implant', 'megacorp', 'holographic', 'chrome', 'matrix', 'synthwave', 'dystopia'],
  },
  {
    id: 'post-apocalyptic',
    keywords: ['apocalypse', 'wasteland', 'fallout', 'post-apocalyptic', 'rusted', 'scavenger', 'nuclear', 'radiation'],
  },
  {
    id: 'sci-fi-utopia',
    keywords: ['utopia', 'future city', 'solarpunk', 'clean energy', 'flying car', 'hover', 'advanced civilization'],
  },
  {
    id: 'space-station',
    keywords: ['space station', 'orbital', 'starship', 'airlock', 'cryo pod', 'zero-g', 'iss', 'derelict ship'],
  },
  {
    id: 'alien-jungle',
    keywords: ['alien', 'xenoworld', 'bioluminescent', 'pandora', 'alien planet', 'glowing forest', 'exotic fauna'],
  },
  {
    id: 'western-frontier',
    keywords: ['western', 'cowboy', 'saloon', 'sheriff', 'wild west', 'frontier', 'gunslinger', 'tumbleweed'],
  },
  {
    id: 'steampunk',
    keywords: ['steampunk', 'airship', 'cog', 'brass', 'victorian machine', 'clockwork', 'automaton'],
  },
  {
    id: 'pirate-cove',
    keywords: ['pirate', 'galleon', 'treasure', 'ship', 'caribbean', 'rum', 'plunder', 'cove'],
  },
  {
    id: 'victorian-horror',
    keywords: ['victorian horror', 'haunted mansion', 'ghost', 'seance', 'sherlock', 'gaslight', 'spooky manor'],
  },
  {
    id: 'modern-city',
    keywords: ['city', 'downtown', 'skyscraper', 'taxi', 'urban', 'metro', 'subway', 'nyc', 'tokyo street'],
  },
  {
    id: 'modern-suburb',
    keywords: ['suburb', 'brookhaven', 'neighborhood', 'house', 'home', 'backyard', 'cul-de-sac'],
  },
  {
    id: 'school-anime',
    keywords: ['school', 'anime', 'high school', 'classroom', 'uniform', 'cherry blossom', 'rooftop'],
  },
  {
    id: 'kawaii-pastel',
    keywords: ['kawaii', 'pastel', 'cute', 'adorable', 'candy', 'sweet world', 'fairy'],
  },
  {
    id: 'minecraft-blocky',
    keywords: ['minecraft', 'voxel', 'blocky', 'cube world', 'pixelated'],
  },
  {
    id: 'low-poly-cartoon',
    keywords: ['low poly', 'low-poly', 'cartoon', 'stylized', 'flat shaded'],
  },
  {
    id: 'racing-arcade',
    keywords: ['race', 'racing', 'car track', 'grand prix', 'drift', 'motorsport', 'f1'],
  },
  {
    id: 'sports-stadium',
    keywords: ['stadium', 'soccer', 'football', 'arena', 'sports', 'basketball court'],
  },
  {
    id: 'beach-tropical',
    keywords: ['beach', 'tropical', 'resort', 'island', 'hawaii', 'palm tree', 'surf'],
  },
  {
    id: 'arctic-tundra',
    keywords: ['arctic', 'tundra', 'frozen', 'snow', 'glacier', 'igloo', 'antarctica'],
  },
  {
    id: 'desert-oasis',
    keywords: ['desert', 'oasis', 'pyramid', 'sahara', 'arabian', 'dune', 'bedouin'],
  },
  {
    id: 'volcanic-hellscape',
    keywords: ['volcano', 'lava', 'magma', 'hellscape', 'mordor', 'obsidian', 'erupting'],
  },
]

function keywordDetect(prompt: string): ThemeDetectionResult {
  const lower = prompt.toLowerCase()
  let best: { id: string; score: number } = { id: 'modern-city', score: 0 }

  for (const { id, keywords } of KEYWORD_MAP) {
    let score = 0
    for (const kw of keywords) {
      if (lower.includes(kw)) score += 1
    }
    if (score > best.score) best = { id, score }
  }

  if (best.score === 0) {
    return {
      themeId: 'modern-city',
      confidence: 0.3,
      reasoning: 'No strong keyword match — defaulting to modern-city.',
    }
  }

  return {
    themeId: best.id,
    confidence: Math.min(0.5 + best.score * 0.15, 0.9),
    reasoning: `Keyword match (${best.score} hits).`,
  }
}

// ────────────────────────────────────────────────────────────────────────────
// AI-based detection (cheap model, JSON mode)
// ────────────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a theme classifier for a Roblox game builder.

Given a user's build prompt, pick the single best-matching theme id from the
list below. Respond ONLY with JSON in this exact shape:

{"themeId": "...", "confidence": 0.92, "reasoning": "short sentence"}

Rules:
- themeId MUST be exactly one of the listed ids.
- confidence is a number between 0 and 1.
- reasoning should be one concise sentence explaining your pick.
- If the prompt is ambiguous, still pick the closest match and lower confidence.
- NEVER invent new theme ids.

Available themes:
${themeCatalogSummary()}`

function parseDetectionJson(raw: string): ThemeDetectionResult | null {
  try {
    // Strip code fences if the model wrapped it
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/```$/i, '')
      .trim()

    const parsed = JSON.parse(cleaned) as Record<string, unknown>

    const themeId = typeof parsed.themeId === 'string' ? parsed.themeId : ''
    const confidenceRaw = typeof parsed.confidence === 'number' ? parsed.confidence : 0.5
    const reasoning = typeof parsed.reasoning === 'string' ? parsed.reasoning : ''

    if (!THEME_IDS.includes(themeId)) return null

    return {
      themeId,
      confidence: Math.max(0, Math.min(1, confidenceRaw)),
      reasoning: reasoning || 'AI classification.',
    }
  } catch {
    return null
  }
}

/**
 * Classify a raw user prompt into a themeId. Returns a confidence score and a
 * one-line reasoning string. If confidence is below 0.5 the caller may choose
 * to display the detected theme to the user for confirmation; however, the
 * returned themeId is always a valid preset id.
 */
export async function detectTheme(prompt: string): Promise<ThemeDetectionResult> {
  const trimmed = prompt.trim()
  if (!trimmed) {
    return {
      themeId: 'modern-city',
      confidence: 0.0,
      reasoning: 'Empty prompt — defaulting to modern-city.',
    }
  }

  // Try AI classification first
  try {
    const raw = await callAI(
      SYSTEM_PROMPT,
      [{ role: 'user', content: `Prompt: "${trimmed}"` }],
      { jsonMode: true, temperature: 0.2, maxTokens: 200 },
    )

    const parsed = parseDetectionJson(raw)
    if (parsed) {
      // Guard against low confidence — fall back to keyword check to see if
      // we can do better.
      if (parsed.confidence < 0.5) {
        const kw = keywordDetect(trimmed)
        if (kw.confidence > parsed.confidence) return kw
      }
      return parsed
    }
  } catch (err) {
    console.warn('[theme-detector] AI call failed, falling back to keywords:', (err as Error).message)
  }

  // Fallback
  return keywordDetect(trimmed)
}

/**
 * Synchronous keyword-only detect — exposed for tests and for code paths that
 * cannot make a network call. Returns the same shape as `detectTheme`.
 */
export function detectThemeSync(prompt: string): ThemeDetectionResult {
  return keywordDetect(prompt)
}

/** Convenience wrapper — returns the full ThemePreset after detection. */
export async function detectAndGetTheme(prompt: string): Promise<{
  result: ThemeDetectionResult
  preset: (typeof THEME_PRESETS)[string]
}> {
  const result = await detectTheme(prompt)
  return { result, preset: THEME_PRESETS[result.themeId] }
}
