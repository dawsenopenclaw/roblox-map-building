// ─── Types ─────────────────────────────────────────────────────────────────────

export type SuggestionCategory = 'lighting' | 'audio' | 'ui' | 'gameplay' | 'polish' | 'monetization' | 'performance'

export interface AISuggestion {
  id: string
  category: SuggestionCategory
  icon: string
  title: string
  description: string
  prompt: string
  priority: number // 1-10, higher = more important
}

export interface BuildContext {
  gameType?: string
  assetsPlaced?: string[]
  hasLighting?: boolean
  hasAudio?: boolean
  hasUI?: boolean
  hasLeaderboard?: boolean
  hasNPCs?: boolean
  hasMobileSupport?: boolean
  hasRebirthSystem?: boolean
  hasTutorial?: boolean
  hasAnalytics?: boolean
  hasTradingSystem?: boolean
  hasPartySystem?: boolean
  buildSummary?: string
}

// ─── Suggestion catalog ─────────────────────────────────────────────────────────

const SUGGESTION_CATALOG: Array<{
  id: string
  category: SuggestionCategory
  icon: string
  title: string
  description: string
  prompt: string
  priority: number
  condition?: (ctx: BuildContext) => boolean
}> = [
  // Lighting
  {
    id: 'add-lighting',
    category: 'lighting',
    icon: '💡',
    title: 'Add atmospheric lighting',
    description: 'Good lighting increases immersion and makes screenshots look 10x better.',
    prompt: 'Add atmospheric lighting to the scene — use Atmosphere, Bloom, and ColorCorrection effects to create a moody look matching the current theme.',
    priority: 9,
    condition: (ctx) => !ctx.hasLighting,
  },
  {
    id: 'day-night-cycle',
    category: 'lighting',
    icon: '🌅',
    title: 'Add a day/night cycle',
    description: 'Players love watching the world change. Boosts session length.',
    prompt: 'Add a smooth day/night cycle with a 10-minute cycle. Adjust lighting colors and sky for sunrise, midday, sunset, and night.',
    priority: 6,
    condition: (ctx) => ctx.hasLighting === true,
  },
  // Audio
  {
    id: 'add-background-music',
    category: 'audio',
    icon: '🎵',
    title: 'Add background music',
    description: 'Music keeps players engaged. Roblox audio library has thousands of free tracks.',
    prompt: 'Add background music to the game. Use a looping ambient track from the Roblox audio library that matches the theme. Fade in on spawn.',
    priority: 8,
    condition: (ctx) => !ctx.hasAudio,
  },
  {
    id: 'add-sound-effects',
    category: 'audio',
    icon: '🔊',
    title: 'Add sound effects',
    description: 'Footsteps, interactions, and ambient sounds make the world feel alive.',
    prompt: 'Add sound effects: footsteps on different surfaces, ambient environmental sounds, and interaction feedback sounds.',
    priority: 7,
    condition: (ctx) => !ctx.hasAudio,
  },
  // UI
  {
    id: 'add-ui',
    category: 'ui',
    icon: '🖥️',
    title: 'Add a HUD / UI',
    description: 'Players need feedback. Add health bars, currency display, or objectives.',
    prompt: 'Create a clean in-game HUD with a health bar, currency display, and a mini-map in the corner. Use a dark theme with gold accents.',
    priority: 8,
    condition: (ctx) => !ctx.hasUI,
  },
  {
    id: 'add-leaderboard',
    category: 'ui',
    icon: '🏆',
    title: 'Add a leaderboard',
    description: 'Competition drives engagement. Top 10% of Roblox games have leaderboards.',
    prompt: 'Add a leaderboard showing the top 10 players by score. Update in real-time and highlight the current player\'s position.',
    priority: 7,
    condition: (ctx) => !ctx.hasLeaderboard,
  },
  {
    id: 'add-loading-screen',
    category: 'ui',
    icon: '⏳',
    title: 'Add a loading screen',
    description: 'First impressions matter. A branded loading screen sets the tone.',
    prompt: 'Create a custom loading screen with the game title, a progress bar, and 3 loading tips. Add a subtle particle effect background.',
    priority: 5,
  },
  // Gameplay
  {
    id: 'add-npcs',
    category: 'gameplay',
    icon: '🧑',
    title: 'Add NPCs',
    description: 'NPCs make the world feel lived in. Add vendors, quest givers, or wanderers.',
    prompt: 'Add 3-5 NPCs that wander around the map. Give them idle animations, patrol routes, and a simple dialogue system when clicked.',
    priority: 7,
    condition: (ctx) => !ctx.hasNPCs,
  },
  {
    id: 'add-rebirth',
    category: 'gameplay',
    icon: '♻️',
    title: 'Add a rebirth system',
    description: 'Rebirths are the #1 retention mechanic in simulator games.',
    prompt: 'Add a rebirth system: when players reach a certain threshold, they can rebirth to reset stats and gain a permanent multiplier.',
    priority: 8,
    condition: (ctx) => ctx.gameType === 'simulator' && !ctx.hasRebirthSystem,
  },
  {
    id: 'add-daily-rewards',
    category: 'gameplay',
    icon: '🎁',
    title: 'Add daily rewards',
    description: 'Daily login bonuses increase Day-7 retention by up to 40%.',
    prompt: 'Add a daily login reward system with 7-day streak bonuses. Increasing rewards each day, with a special reward on day 7.',
    priority: 7,
  },
  {
    id: 'add-shop',
    category: 'gameplay',
    icon: '🛒',
    title: 'Add an in-game shop',
    description: 'A shop gives players goals and a way to spend earned currency.',
    prompt: 'Create an in-game shop where players can spend earned currency on upgrades, cosmetics, and power-ups. Include a "Featured" section.',
    priority: 6,
  },
  // Polish
  {
    id: 'add-particles',
    category: 'polish',
    icon: '✨',
    title: 'Add particle effects',
    description: 'Particles for coins, footsteps, and abilities make the game feel premium.',
    prompt: 'Add particle effects: coin collection sparkles, footstep dust clouds on ground, and a glow effect on interactive objects.',
    priority: 5,
  },
  {
    id: 'mobile-support',
    category: 'polish',
    icon: '📱',
    title: 'Optimize for mobile',
    description: '60%+ of Roblox players are on mobile. Don\'t leave them behind.',
    prompt: 'Add mobile touch controls with virtual joystick, action buttons, and optimize UI scale for small screens. Test landscape and portrait.',
    priority: 9,
    condition: (ctx) => !ctx.hasMobileSupport,
  },
  // Monetization
  {
    id: 'add-gamepass',
    category: 'monetization',
    icon: '💎',
    title: 'Add a VIP gamepass',
    description: 'Even a simple 2x speed gamepass can generate significant revenue.',
    prompt: 'Create a VIP gamepass that gives players 2x currency, a special badge, and exclusive cosmetic items. Add a "VIP ONLY" area on the map.',
    priority: 6,
  },
  {
    id: 'add-developer-products',
    category: 'monetization',
    icon: '💰',
    title: 'Add currency purchases',
    description: 'Developer Products for currency top-ups are the #1 Roblox revenue source.',
    prompt: 'Add Robux-purchasable currency bundles: 100, 500, 1000, and 5000 coins. Show value comparison and a "Best Value" badge on the 1000 pack.',
    priority: 5,
  },
  // Performance
  {
    id: 'streaming',
    category: 'performance',
    icon: '⚡',
    title: 'Enable streaming',
    description: 'StreamingEnabled dramatically reduces load times for large maps.',
    prompt: 'Enable StreamingEnabled on the Workspace and configure streaming radius for optimal performance. Add loading distance indicators.',
    priority: 7,
    condition: (ctx) => (ctx.assetsPlaced?.length ?? 0) > 50,
  },
]

// ─── Engine ─────────────────────────────────────────────────────────────────────

/**
 * Generate ranked suggestions based on build context.
 * Returns up to `maxSuggestions` suggestions sorted by priority.
 */
export function generateSuggestions(
  context: BuildContext,
  maxSuggestions = 5
): AISuggestion[] {
  const applicable = SUGGESTION_CATALOG.filter((s) => {
    // If suggestion has a condition, evaluate it
    if (s.condition) return s.condition(context)
    return true
  })

  // Score each suggestion
  const scored = applicable.map((s) => {
    let score = s.priority

    // Boost audio/lighting if both are missing — they have the biggest impact
    if (s.category === 'lighting' && !context.hasLighting) score += 2
    if (s.category === 'audio' && !context.hasAudio) score += 1

    // Boost mobile if it's missing
    if (s.id === 'mobile-support' && !context.hasMobileSupport) score += 3

    return { ...s, score }
  })

  // Sort by score descending, deduplicate by category (max 2 per category)
  scored.sort((a, b) => b.score - a.score)

  const categoryCount: Record<string, number> = {}
  const result: AISuggestion[] = []

  for (const s of scored) {
    const count = categoryCount[s.category] ?? 0
    if (count >= 2) continue
    categoryCount[s.category] = count + 1
    result.push({
      id: s.id,
      category: s.category,
      icon: s.icon,
      title: s.title,
      description: s.description,
      prompt: s.prompt,
      priority: s.priority,
    })
    if (result.length >= maxSuggestions) break
  }

  return result
}

/**
 * Infer build context from a build summary string.
 * Used when we don't have structured metadata.
 */
export function inferBuildContext(summary: string, gameType?: string): BuildContext {
  const lower = summary.toLowerCase()
  return {
    gameType,
    hasLighting: lower.includes('light') || lower.includes('atmosphere') || lower.includes('bloom'),
    hasAudio: lower.includes('audio') || lower.includes('music') || lower.includes('sound'),
    hasUI: lower.includes('ui') || lower.includes('hud') || lower.includes('screen') || lower.includes('gui'),
    hasLeaderboard: lower.includes('leaderboard') || lower.includes('leaderstats'),
    hasNPCs: lower.includes('npc') || lower.includes('character') || lower.includes('vendor'),
    hasMobileSupport: lower.includes('mobile') || lower.includes('touch') || lower.includes('joystick'),
    hasRebirthSystem: lower.includes('rebirth') || lower.includes('prestige'),
    buildSummary: summary,
  }
}
