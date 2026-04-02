/**
 * Tips Engine — contextual + random tips surfaced during the building process.
 *
 * Tips are short (1-2 sentences), immediately actionable, and categorised by
 * skill level so beginners aren't overwhelmed and veterans aren't bored.
 */

import type { BuildContext } from './suggestion-engine'

// ─── Types ───────────────────────────────────────────────────────────────────

export type TipLevel = 'beginner' | 'intermediate' | 'advanced'

export type TipCategory =
  | 'performance'
  | 'design'
  | 'monetization'
  | 'ux'
  | 'retention'
  | 'audio'
  | 'lighting'
  | 'mobile'
  | 'social'
  | 'scripting'
  | 'tutorial'
  | 'analytics'

export interface Tip {
  id: string
  level: TipLevel
  category: TipCategory
  text: string
  /** Optional tag used for context matching — e.g. 'simulator', 'large-map' */
  tags?: string[]
}

// ─── Tip catalog (30+ tips) ───────────────────────────────────────────────────

export const TIPS: Tip[] = [
  // ── Mobile ────────────────────────────────────────────────────────────────
  {
    id: 'mobile-majority',
    level: 'beginner',
    category: 'mobile',
    text: '60% of Roblox players are on mobile. Test your UI on small screens before publishing.',
  },
  {
    id: 'mobile-button-size',
    level: 'beginner',
    category: 'mobile',
    text: 'Mobile buttons should be at least 44x44 pixels. Anything smaller causes missed taps and frustration.',
    tags: ['ui', 'mobile'],
  },
  {
    id: 'mobile-joystick',
    level: 'intermediate',
    category: 'mobile',
    text: 'Add a virtual joystick for mobile players — the default Roblox movement on touchscreens is awkward for custom games.',
    tags: ['mobile', 'controls'],
  },
  // ── UX / Onboarding ───────────────────────────────────────────────────────
  {
    id: 'spawn-first-impression',
    level: 'beginner',
    category: 'ux',
    text: 'Players decide if they\'ll stay in the first 10 seconds. Make your spawn area jaw-dropping.',
  },
  {
    id: 'ftue-milestone',
    level: 'beginner',
    category: 'tutorial',
    text: 'Get new players to their first win or reward within 90 seconds. Players who reach a milestone early retain at 3x the rate.',
    tags: ['tutorial', 'retention'],
  },
  {
    id: 'skip-button',
    level: 'intermediate',
    category: 'ux',
    text: 'Always offer a "Skip" option for cutscenes and tutorials. Returning players hate sitting through them again.',
    tags: ['tutorial'],
  },
  {
    id: 'clear-objectives',
    level: 'beginner',
    category: 'ux',
    text: 'Players should always know what to do next. A persistent objective label reduces confusion and early drop-off.',
  },
  // ── Performance ───────────────────────────────────────────────────────────
  {
    id: 'streaming-enabled',
    level: 'intermediate',
    category: 'performance',
    text: 'StreamingEnabled can cut load times by 70% on large maps. Enable it early — retrofitting is painful.',
    tags: ['large-map'],
  },
  {
    id: 'draw-calls',
    level: 'advanced',
    category: 'performance',
    text: 'Every unique texture = a separate draw call. Use a texture atlas to batch multiple surfaces into one draw call and boost frame rate.',
  },
  {
    id: 'instance-pooling',
    level: 'advanced',
    category: 'performance',
    text: 'Destroying and re-creating parts is expensive. Pool your frequently-spawned objects (projectiles, coins, effects) instead.',
    tags: ['scripting'],
  },
  {
    id: 'cast-shadow-cost',
    level: 'intermediate',
    category: 'performance',
    text: 'CastShadow = true on hundreds of small parts tanks performance. Disable it on props smaller than 4 studs.',
  },
  {
    id: 'union-vs-meshpart',
    level: 'intermediate',
    category: 'performance',
    text: 'Unions are CPU-expensive to render. Convert complex unions to MeshParts via export/import for a significant performance gain.',
  },
  {
    id: 'local-scripts-client',
    level: 'beginner',
    category: 'scripting',
    text: 'Put visual-only code (tweens, particles, camera) in LocalScripts. Never run cosmetic logic server-side — it wastes bandwidth.',
  },
  // ── Design ────────────────────────────────────────────────────────────────
  {
    id: 'rule-of-thirds',
    level: 'beginner',
    category: 'design',
    text: 'Apply the rule of thirds to your map layout. Key areas at 1/3 and 2/3 positions feel more natural than dead center.',
  },
  {
    id: 'color-palette',
    level: 'beginner',
    category: 'design',
    text: 'Pick 3 colours for your game: base, accent, highlight. Consistent colours make your game look professional.',
  },
  {
    id: 'negative-space',
    level: 'intermediate',
    category: 'design',
    text: 'Leave breathing room. Over-cluttered maps confuse players and kill performance. Every empty space is intentional.',
  },
  {
    id: 'silhouette-readability',
    level: 'intermediate',
    category: 'design',
    text: 'Interactive objects should be readable as a silhouette. If a player can\'t recognise it at a glance, they\'ll miss it.',
  },
  {
    id: 'height-variation',
    level: 'beginner',
    category: 'design',
    text: 'Flat maps are boring. Vary terrain height by at least 10-20 studs to create natural sightlines and interesting exploration.',
    tags: ['large-map'],
  },
  // ── Lighting & Audio ──────────────────────────────────────────────────────
  {
    id: 'atmosphere-cheap',
    level: 'beginner',
    category: 'lighting',
    text: 'The Atmosphere object costs almost nothing and makes any map look dramatically better. Add it first.',
  },
  {
    id: 'bloom-subtlety',
    level: 'intermediate',
    category: 'lighting',
    text: 'Bloom Intensity above 0.3 looks blown out. Keep it subtle — 0.1 to 0.2 adds glow without washing out your colours.',
  },
  {
    id: 'audio-fade-in',
    level: 'beginner',
    category: 'audio',
    text: 'Fade music in over 2-3 seconds on spawn. Music that starts instantly feels jarring and causes players to mute.',
  },
  {
    id: 'spatial-audio',
    level: 'intermediate',
    category: 'audio',
    text: 'Use RollOffMaxDistance on ambient Sound objects to make audio feel spatial. Waterfalls, crowds, and machines should fade as you walk away.',
  },
  // ── Monetization ─────────────────────────────────────────────────────────
  {
    id: 'gamepass-placement',
    level: 'intermediate',
    category: 'monetization',
    text: 'Show your gamepass offer at the moment of desire — right after a player earns their first reward, not on spawn.',
  },
  {
    id: 'value-anchor',
    level: 'intermediate',
    category: 'monetization',
    text: 'Show a "crossed-out" higher price next to your currency bundle. The anchor makes the real price feel like a deal.',
    tags: ['monetization'],
  },
  {
    id: 'free-taste',
    level: 'beginner',
    category: 'monetization',
    text: 'Give free players a taste of premium content. Players who experience the feature are 4x more likely to purchase it.',
  },
  {
    id: 'vip-visibility',
    level: 'intermediate',
    category: 'monetization',
    text: 'Make VIP players visually distinct (aura, badge, chat tag). Social proof from visible perks is your best advertisement.',
    tags: ['monetization', 'social'],
  },
  // ── Retention & Social ────────────────────────────────────────────────────
  {
    id: 'daily-streak-psychology',
    level: 'intermediate',
    category: 'retention',
    text: 'The most powerful day of a streak is day 6 — players hate losing a near-complete streak. Make day 7 the biggest reward.',
    tags: ['retention'],
  },
  {
    id: 'social-proof',
    level: 'beginner',
    category: 'social',
    text: 'Show player count and recent activity ("5 players just found a rare item!"). Social proof makes your world feel alive.',
  },
  {
    id: 'server-events',
    level: 'intermediate',
    category: 'retention',
    text: 'Timed server-wide events (2x XP for 30 minutes, boss spawns) create urgency and get players to invite friends.',
    tags: ['retention', 'social'],
  },
  // ── Scripting & Architecture ──────────────────────────────────────────────
  {
    id: 'server-authority',
    level: 'beginner',
    category: 'scripting',
    text: 'Never trust the client. All economy logic (currency, purchases, inventory) must run on the server.',
  },
  {
    id: 'datastore-pcall',
    level: 'beginner',
    category: 'scripting',
    text: 'Always wrap DataStore calls in pcall. DataStore can fail — players should never lose progress because of an unhandled error.',
  },
  {
    id: 'module-scripts',
    level: 'intermediate',
    category: 'scripting',
    text: 'Keep game constants (prices, speeds, names) in a shared ModuleScript. Changing one value in one place beats hunting across 20 scripts.',
  },
  {
    id: 'remote-rate-limit',
    level: 'advanced',
    category: 'scripting',
    text: 'Rate-limit all RemoteEvents on the server. Without limits, exploiters can flood your server with thousands of calls per second.',
  },
  // ── Analytics ────────────────────────────────────────────────────────────
  {
    id: 'track-drop-off',
    level: 'intermediate',
    category: 'analytics',
    text: 'Track where players are standing when they leave. The area with the most drop-offs is usually where your game breaks.',
    tags: ['analytics'],
  },
  {
    id: 'session-length-goal',
    level: 'beginner',
    category: 'analytics',
    text: 'Aim for an average session length of 15+ minutes. Below 10 minutes usually signals the core loop isn\'t satisfying enough.',
    tags: ['analytics', 'retention'],
  },
]

// ─── Engine ───────────────────────────────────────────────────────────────────

/**
 * Pick a relevant tip based on what the user is currently building.
 * Falls back to a random tip if no strong match is found.
 */
export function getContextualTip(context: BuildContext): Tip {
  const candidates: Array<{ tip: Tip; score: number }> = []

  for (const tip of TIPS) {
    let score = 0

    // Missing mobile support → push mobile tips
    if (!context.hasMobileSupport && tip.category === 'mobile') score += 4

    // No tutorial → push onboarding tips
    if (!context.hasTutorial && tip.category === 'tutorial') score += 3

    // Large map → push performance/streaming tips
    const isLargeMap = (context.assetsPlaced?.length ?? 0) > 50
    if (isLargeMap && tip.category === 'performance') score += 3
    if (isLargeMap && tip.tags?.includes('large-map')) score += 2

    // No audio → push audio tips
    if (!context.hasAudio && tip.category === 'audio') score += 3

    // No lighting → push lighting tips
    if (!context.hasLighting && tip.category === 'lighting') score += 3

    // Simulator game → push retention tips
    if (context.gameType === 'simulator' && tip.category === 'retention') score += 2

    // No analytics → push analytics tips
    if (!context.hasAnalytics && tip.category === 'analytics') score += 2

    // No social features → social tips
    if (!context.hasTradingSystem && !context.hasPartySystem && tip.category === 'social') score += 1

    if (score > 0) candidates.push({ tip, score })
  }

  if (candidates.length === 0) return getRandomTip()

  // Sort by score, break ties with a stable shuffle to avoid always returning the same tip
  candidates.sort((a, b) => b.score - a.score)

  // Pick randomly from the top-3 candidates so repeated calls rotate through options
  const pool = candidates.slice(0, 3)
  return pool[Math.floor(Math.random() * pool.length)].tip
}

/**
 * Return a random tip from the full catalog.
 * Used in idle states, tooltips, and loading screens.
 */
export function getRandomTip(): Tip {
  if (TIPS.length === 0) {
    // Defensive fallback — catalog should never be empty
    return {
      id: 'fallback',
      level: 'beginner',
      category: 'design',
      text: 'Keep iterating — every great Roblox game started with a simple idea.',
    }
  }
  return TIPS[Math.floor(Math.random() * TIPS.length)]
}

/**
 * Return all tips for a given level.
 */
export function getTipsByLevel(level: TipLevel): Tip[] {
  return TIPS.filter((t) => t.level === level)
}

/**
 * Return all tips for a given category.
 */
export function getTipsByCategory(category: TipCategory): Tip[] {
  return TIPS.filter((t) => t.category === category)
}
