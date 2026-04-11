/**
 * theme-matcher.ts
 *
 * Given an asset description (from the asset-director or a Meshy prompt)
 * and a theme id (from theme-detector), return a confidence score that
 * the asset actually fits the theme.
 *
 * The asset-director currently emits anything the planner asks for, which
 * sometimes produces theme-breaking results ("medieval castle" with a neon
 * spaceship in the courtyard). This matcher gives the director a pre-flight
 * check so it can filter or rewrite bad asks before spending tokens on
 * Meshy / FAL / etc.
 *
 * The matcher uses a two-pass strategy:
 *
 *   1. FAST lexical check — keyword scoring via the theme-presets table.
 *      Returns a confidence in [0, 1] with no network hop. This is the
 *      default path and costs $0.
 *
 *   2. LLM fallback — only invoked when the lexical check is uncertain
 *      (0.3 - 0.7 confidence). Uses the cheap provider via `callAI` to
 *      return a strict JSON verdict. Costs ~$0.0001 per call.
 */

import 'server-only'
import { callAI } from './provider'
import { THEME_PRESETS } from '@/lib/theme/theme-presets'

// ───────────────────────────────────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────────────────────────────────

export interface ThemeMatchResult {
  /** Confidence 0-1 that the asset fits the theme. */
  confidence: number
  /** `match` = fits, `mismatch` = does not fit, `unclear` = need human review. */
  verdict: 'match' | 'mismatch' | 'unclear'
  /** Short reason. */
  reason: string
  /** If mismatch, a suggested rewording of the asset description. */
  suggestedRewording: string | null
  /** Source of the verdict. */
  source: 'lexical' | 'llm' | 'fallback'
}

export interface AssetDescriptor {
  /** Human-readable name, e.g. "neon spaceship". */
  name: string
  /** Longer description, e.g. "A sleek sci-fi ship with cyan neon accents". */
  description?: string
}

// ───────────────────────────────────────────────────────────────────────────
// Lexical matcher
// ───────────────────────────────────────────────────────────────────────────

/**
 * Shared "cross-theme forbidden" word list. These words NEVER belong in
 * certain themes regardless of context.
 */
const GLOBAL_FORBIDDEN: Record<string, string[]> = {
  'medieval-fantasy': ['neon', 'laser', 'spaceship', 'computer', 'robot', 'cyberpunk', 'chrome', 'hologram', 'satellite'],
  'dark-fantasy': ['neon', 'laser', 'spaceship', 'bubblegum', 'kawaii', 'sparkle emoji', 'chrome'],
  'high-fantasy': ['neon', 'laser', 'cyberpunk', 'chainsaw', 'automatic rifle'],
  'cyberpunk-noir': ['medieval castle', 'wooden wagon', 'crossbow', 'chainmail', 'knight'],
  'post-apocalyptic': ['pristine', 'glossy', 'chrome utopia', 'kawaii', 'bubblegum'],
  'sci-fi-utopia': ['rust', 'decay', 'medieval', 'chainmail', 'horse cart'],
  'space-station': ['grass', 'tree', 'medieval', 'horse', 'cobblestone'],
  'alien-jungle': ['concrete', 'skyscraper', 'taxi', 'subway'],
  'western-frontier': ['neon', 'laser', 'spaceship', 'computer', 'hologram'],
  'steampunk': ['neon', 'laser rifle', 'hologram', 'wifi'],
  'pirate-cove': ['spaceship', 'neon sign', 'computer', 'highway'],
  'victorian-horror': ['neon', 'laser', 'bubblegum', 'kawaii'],
  'modern-city': ['dragon', 'wizard', 'knight', 'spaceship hangar'],
  'modern-suburb': ['dragon', 'knight', 'spaceship', 'zombie horde'],
}

/** Words that strongly signal each theme — aka "theme anchors". */
const THEME_ANCHORS: Record<string, string[]> = {
  'medieval-fantasy': ['castle', 'knight', 'sword', 'shield', 'banner', 'tavern', 'wagon', 'horse', 'torch', 'dragon', 'blacksmith', 'medieval', 'kingdom'],
  'dark-fantasy': ['gothic', 'cursed', 'blood', 'gargoyle', 'tarnished', 'eldritch', 'cathedral', 'grimdark', 'bone'],
  'high-fantasy': ['elven', 'elf', 'dwarven', 'mithril', 'crystal', 'wizard', 'spell', 'rune', 'enchanted'],
  'cyberpunk-noir': ['neon', 'chrome', 'hologram', 'cybernetic', 'implant', 'megacorp', 'hacker', 'synthwave', 'dystopia'],
  'post-apocalyptic': ['wasteland', 'rust', 'scavenger', 'ruins', 'fallout', 'radiation', 'scrap', 'tattered'],
  'sci-fi-utopia': ['utopia', 'hover', 'solarpunk', 'clean energy', 'advanced', 'futuristic'],
  'space-station': ['airlock', 'station', 'cryo', 'orbital', 'starship', 'zero-g', 'hangar'],
  'alien-jungle': ['alien', 'xeno', 'bioluminescent', 'exotic', 'jungle planet'],
  'western-frontier': ['saloon', 'cowboy', 'sheriff', 'frontier', 'gunslinger', 'wagon', 'tumbleweed'],
  'steampunk': ['steampunk', 'airship', 'clockwork', 'brass', 'cog', 'gear', 'automaton'],
  'pirate-cove': ['pirate', 'galleon', 'treasure', 'ship', 'rum', 'plunder', 'cove', 'cannon'],
  'victorian-horror': ['mansion', 'ghost', 'seance', 'gaslight', 'spooky', 'seance', 'haunted'],
  'modern-city': ['skyscraper', 'taxi', 'downtown', 'subway', 'urban', 'cafe', 'streetlight'],
  'modern-suburb': ['suburban', 'lawn', 'picket', 'driveway', 'garage', 'mailbox'],
}

function extractThemeAnchors(themeId: string): string[] {
  const anchors = THEME_ANCHORS[themeId] ?? []
  const preset = THEME_PRESETS.find((p) => p.id === themeId)
  if (!preset) return anchors
  // Merge in the preset's signature props and atmosphere keywords as anchors.
  const propWords = preset.signatureProps.flatMap((p) => p.toLowerCase().split(/\s+/))
  const atmoWords = preset.atmosphereKeywords.map((k) => k.toLowerCase())
  return Array.from(new Set([...anchors, ...propWords, ...atmoWords]))
}

function lexicalMatch(asset: AssetDescriptor, themeId: string): ThemeMatchResult {
  const text = `${asset.name} ${asset.description ?? ''}`.toLowerCase()
  const anchors = extractThemeAnchors(themeId)
  const forbidden = GLOBAL_FORBIDDEN[themeId] ?? []

  const anchorHits = anchors.filter((a) => a.length > 2 && text.includes(a)).length
  const forbiddenHits = forbidden.filter((f) => text.includes(f))

  // Start neutral, add points for anchors, subtract hard for forbidden.
  let confidence = 0.5
  confidence += Math.min(0.4, anchorHits * 0.1)
  confidence -= forbiddenHits.length * 0.3
  confidence = Math.max(0, Math.min(1, confidence))

  let verdict: ThemeMatchResult['verdict']
  if (forbiddenHits.length > 0) verdict = 'mismatch'
  else if (confidence >= 0.7) verdict = 'match'
  else if (confidence <= 0.3) verdict = 'mismatch'
  else verdict = 'unclear'

  const reason =
    forbiddenHits.length > 0
      ? `Contains forbidden words for ${themeId}: ${forbiddenHits.join(', ')}`
      : anchorHits > 0
        ? `Matched ${anchorHits} theme anchors for ${themeId}`
        : `No strong signal for ${themeId}`

  return {
    confidence: parseFloat(confidence.toFixed(2)),
    verdict,
    reason,
    suggestedRewording: null,
    source: 'lexical',
  }
}

// ───────────────────────────────────────────────────────────────────────────
// LLM fallback
// ───────────────────────────────────────────────────────────────────────────

interface LlmVerdict {
  confidence?: unknown
  verdict?: unknown
  reason?: unknown
  suggestedRewording?: unknown
}

function parseVerdict(raw: string): LlmVerdict | null {
  try {
    let s = raw.trim()
    if (s.startsWith('```')) s = s.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '')
    const first = s.indexOf('{')
    const last = s.lastIndexOf('}')
    if (first >= 0 && last > first) s = s.slice(first, last + 1)
    const parsed = JSON.parse(s) as unknown
    if (parsed && typeof parsed === 'object') return parsed as LlmVerdict
    return null
  } catch {
    return null
  }
}

async function llmMatch(asset: AssetDescriptor, themeId: string): Promise<ThemeMatchResult> {
  const preset = THEME_PRESETS.find((p) => p.id === themeId)
  const themeLine = preset
    ? `Theme: ${preset.name} — ${preset.description}. Forbidden: ${preset.forbiddenElements.join(', ')}.`
    : `Theme: ${themeId}`

  const system = [
    `You are a strict art director judging whether an asset fits a game theme.`,
    themeLine,
    `Return ONLY a strict JSON object (no prose, no fences):`,
    `{"confidence": 0.0-1.0, "verdict": "match"|"mismatch"|"unclear", "reason": "short reason", "suggestedRewording": "only if mismatch, else null"}`,
  ].join('\n')

  const user = `Asset: ${asset.name}\nDescription: ${asset.description ?? '(none)'}`

  try {
    const raw = await callAI(system, [{ role: 'user', content: user }], {
      jsonMode: true,
      maxTokens: 256,
      temperature: 0.2,
    })
    const parsed = parseVerdict(raw)
    if (!parsed) return lexicalMatch(asset, themeId)

    const confidence =
      typeof parsed.confidence === 'number'
        ? Math.max(0, Math.min(1, parsed.confidence))
        : 0.5

    const verdict: ThemeMatchResult['verdict'] =
      parsed.verdict === 'match' || parsed.verdict === 'mismatch' || parsed.verdict === 'unclear'
        ? parsed.verdict
        : confidence >= 0.7
          ? 'match'
          : confidence <= 0.3
            ? 'mismatch'
            : 'unclear'

    const reason =
      typeof parsed.reason === 'string' && parsed.reason.length > 0 ? parsed.reason : 'LLM verdict'
    const suggestedRewording =
      typeof parsed.suggestedRewording === 'string' && parsed.suggestedRewording.length > 0
        ? parsed.suggestedRewording
        : null

    return {
      confidence: parseFloat(confidence.toFixed(2)),
      verdict,
      reason,
      suggestedRewording,
      source: 'llm',
    }
  } catch (e) {
    console.error('[theme-matcher] LLM fallback failed:', (e as Error).message)
    const lex = lexicalMatch(asset, themeId)
    return { ...lex, source: 'fallback' }
  }
}

// ───────────────────────────────────────────────────────────────────────────
// Public API
// ───────────────────────────────────────────────────────────────────────────

/**
 * Match an asset to a theme. Fast by default; escalates to an LLM check
 * only when the lexical matcher is uncertain.
 *
 * @param asset  Name + optional description
 * @param themeId  Theme id from the theme-presets table
 * @param opts.allowLlmEscalation  If false, always returns the lexical verdict
 */
export async function matchAssetToTheme(
  asset: AssetDescriptor,
  themeId: string,
  opts: { allowLlmEscalation?: boolean } = {},
): Promise<ThemeMatchResult> {
  const { allowLlmEscalation = true } = opts
  const lex = lexicalMatch(asset, themeId)
  if (lex.verdict !== 'unclear' || !allowLlmEscalation) return lex
  return llmMatch(asset, themeId)
}

/**
 * Synchronous lexical-only variant — no network hop. Useful inside hot
 * loops or pre-flight filtering where latency budget is tight.
 */
export function matchAssetToThemeLexical(
  asset: AssetDescriptor,
  themeId: string,
): ThemeMatchResult {
  return lexicalMatch(asset, themeId)
}

/**
 * Filter a list of candidate assets down to those that pass the theme
 * check. Returns both the survivors and the rejected items (with their
 * match result) for logging.
 */
export async function filterAssetsByTheme<T extends AssetDescriptor>(
  assets: T[],
  themeId: string,
): Promise<{ accepted: T[]; rejected: Array<{ asset: T; match: ThemeMatchResult }> }> {
  const accepted: T[] = []
  const rejected: Array<{ asset: T; match: ThemeMatchResult }> = []

  // Do the fast lexical pass first; only escalate the uncertain ones.
  for (const asset of assets) {
    const lex = lexicalMatch(asset, themeId)
    if (lex.verdict === 'match') {
      accepted.push(asset)
      continue
    }
    if (lex.verdict === 'mismatch') {
      rejected.push({ asset, match: lex })
      continue
    }
    // Unclear — escalate.
    const llm = await llmMatch(asset, themeId)
    if (llm.verdict === 'match') accepted.push(asset)
    else rejected.push({ asset, match: llm })
  }

  return { accepted, rejected }
}
