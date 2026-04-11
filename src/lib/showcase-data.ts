/**
 * Showcase games — curated examples of games built with ForjeGames AI.
 *
 * Each entry represents a real build produced from a single prompt. Used by
 * the marketing landing page showcase section and the dedicated /showcase
 * gallery page.
 *
 * Thumbnails are generated dynamically at the edge by
 * `src/app/(marketing)/showcase/[slug]/opengraph-image.tsx` (full 1200x630)
 * and `.../thumbnail.tsx` (400x300 card). No static files required — just
 * point `thumbnail` at the route and Next.js handles the rest.
 */

export type ShowcaseGenre =
  | 'RPG'
  | 'Tycoon'
  | 'Obby'
  | 'Simulator'
  | 'Racing'
  | 'Horror'
  | 'Sci-Fi'
  | 'Adventure'

export type ShowcaseDifficulty = 'Easy' | 'Medium' | 'Advanced'

export interface ShowcaseStats {
  parts: number
  scripts: number
  buildTimeSec: number
}

export interface ShowcaseGame {
  id: string
  title: string
  genre: ShowcaseGenre
  /** Short one-liner shown under the title on cards. */
  description: string
  /** The exact prompt used to build it — passed to the editor via `?prompt=`. */
  prompt: string
  stats: ShowcaseStats
  /**
   * Route that serves the dynamic OG image for this game, e.g.
   * `/showcase/medieval-kingdom/opengraph-image`. Rendered by
   * `src/app/(marketing)/showcase/[slug]/opengraph-image.tsx`.
   */
  thumbnail: string
  /** Short bullet-point highlights rendered on detail cards. */
  features: string[]
  difficulty: ShowcaseDifficulty
  /** Hex accent color used for card glows and badges. */
  accentColor: string
}

/**
 * The list is ordered to give a visually balanced grid on the landing page
 * (first 8 items are featured on the home showcase section).
 */
export const SHOWCASE_GAMES: ShowcaseGame[] = [
  {
    id: 'medieval-kingdom',
    title: 'Medieval Kingdom',
    genre: 'RPG',
    description:
      'Full castle with towers, throne room, village market, and dungeon — plus patrolling guard NPCs.',
    prompt:
      'Build a medieval kingdom with a stone castle, four corner towers, a throne room, a drawbridge over a moat, a village market with stalls, and a dungeon. Add patrolling guard NPCs and torches for night lighting.',
    stats: { parts: 4200, scripts: 18, buildTimeSec: 184 },
    thumbnail: '/showcase/medieval-kingdom/opengraph-image',
    features: [
      'Procedural castle walls and towers',
      'Guard NPC patrol AI',
      'Torch-based dynamic lighting',
      'Interactive drawbridge',
    ],
    difficulty: 'Medium',
    accentColor: '#A855F7',
  },
  {
    id: 'neon-city-tycoon',
    title: 'Neon City Tycoon',
    genre: 'Tycoon',
    description:
      'Cyberpunk city block with neon storefronts, income droppers, and a rebirth system.',
    prompt:
      'Create a neon cyberpunk city tycoon with plot-based buildings, holographic signs, cash droppers that spawn glowing cubes, conveyors, upgraders, a shop UI, and a rebirth system that multiplies income.',
    stats: { parts: 6800, scripts: 42, buildTimeSec: 276 },
    thumbnail: '/showcase/neon-city-tycoon/opengraph-image',
    features: [
      'Full tycoon droppers + upgraders',
      'Animated holographic signage',
      'Day/night neon cycle',
      'Rebirth progression system',
    ],
    difficulty: 'Advanced',
    accentColor: '#D4AF37',
  },
  {
    id: 'tropical-paradise',
    title: 'Tropical Paradise',
    genre: 'Adventure',
    description:
      'Island chain with beaches, waterfalls, underwater caves, and a simple crafting system.',
    prompt:
      'Generate a tropical island chain with sandy beaches, palm trees, waterfalls, underwater coral caves, and a crafting system where players gather wood and stone to build a raft.',
    stats: { parts: 2400, scripts: 11, buildTimeSec: 142 },
    thumbnail: '/showcase/tropical-paradise/opengraph-image',
    features: [
      'Multi-island terrain',
      'Swimmable underwater caves',
      'Resource gathering loop',
      'Raft crafting recipe',
    ],
    difficulty: 'Easy',
    accentColor: '#60A5FA',
  },
  {
    id: 'lava-obby',
    title: 'Lava Escape Obby',
    genre: 'Obby',
    description:
      '60-stage parkour tower with rising lava, moving platforms, and checkpoint saves.',
    prompt:
      'Build a 60-stage lava escape obby tower with moving platforms, spinning kill blocks, disappearing tiles, checkpoint saves at every 10 stages, and lava that slowly rises to force players upward.',
    stats: { parts: 1850, scripts: 9, buildTimeSec: 98 },
    thumbnail: '/showcase/lava-obby/opengraph-image',
    features: [
      '60 procedurally varied stages',
      'Rising lava timer',
      'Auto-save checkpoints',
      'Leaderboard of fastest runs',
    ],
    difficulty: 'Easy',
    accentColor: '#F97316',
  },
  {
    id: 'haunted-manor',
    title: 'Haunted Manor',
    genre: 'Horror',
    description:
      'Victorian mansion with flickering lights, creaking doors, and a stalker monster AI.',
    prompt:
      'Create a Victorian haunted manor with two floors, flickering chandelier lights, creaking doors, jump-scare triggers, hidden passageways, and a slow-moving monster AI that hunts the player by sound.',
    stats: { parts: 3100, scripts: 15, buildTimeSec: 168 },
    thumbnail: '/showcase/haunted-manor/opengraph-image',
    features: [
      'Sound-based monster AI',
      'Dynamic fear lighting',
      'Hidden passage puzzles',
      'Scripted jump scares',
    ],
    difficulty: 'Medium',
    accentColor: '#F43F5E',
  },
  {
    id: 'racing-circuit',
    title: 'Grand Racing Circuit',
    genre: 'Racing',
    description:
      'Multi-lap track with checkpoints, vehicle spawners, boost pads, and leaderboards.',
    prompt:
      'Build a Formula-style racing circuit with 8 checkpoints, 3 laps, a starting grid, vehicle spawners for 4 different cars, boost pads on straights, tire-wall barriers, and a real-time lap leaderboard.',
    stats: { parts: 2900, scripts: 19, buildTimeSec: 156 },
    thumbnail: '/showcase/racing-circuit/opengraph-image',
    features: [
      '4 spawnable vehicles',
      'Checkpoint + lap tracker',
      'Boost pad physics',
      'Live leaderboard UI',
    ],
    difficulty: 'Medium',
    accentColor: '#F59E0B',
  },
  {
    id: 'forest-realm',
    title: 'Enchanted Forest Realm',
    genre: 'RPG',
    description:
      'Dense enchanted forest with winding paths, hidden clearings, and ambient wildlife.',
    prompt:
      'Generate a dense enchanted forest with tall oak trees, winding dirt paths, a flowing river with a bridge, hidden glowing-mushroom clearings, fireflies, and ambient wildlife sounds.',
    stats: { parts: 3600, scripts: 14, buildTimeSec: 172 },
    thumbnail: '/showcase/forest-realm/opengraph-image',
    features: [
      'Procedural foliage placement',
      'Flowing river physics',
      'Firefly particle effects',
      'Ambient soundscape',
    ],
    difficulty: 'Medium',
    accentColor: '#22C55E',
  },
  {
    id: 'space-station',
    title: 'Orbital Space Station',
    genre: 'Sci-Fi',
    description:
      'Modular station with airlocks, zero-G zones, reactor core, and hull-breach events.',
    prompt:
      'Build an orbital sci-fi space station with modular corridors, pressurized airlocks, a zero-gravity cargo bay, a glowing reactor core, emergency hull-breach events that vent players, and a planetary skybox.',
    stats: { parts: 4500, scripts: 31, buildTimeSec: 228 },
    thumbnail: '/showcase/space-station/opengraph-image',
    features: [
      'Zero-G physics zone',
      'Hull breach event system',
      'Modular corridor generator',
      'Reactive reactor core',
    ],
    difficulty: 'Advanced',
    accentColor: '#818CF8',
  },
  {
    id: 'pet-simulator',
    title: 'Pet Collector Simulator',
    genre: 'Simulator',
    description:
      'Egg-hatching pet sim with rarities, auto-farm trails, and a trading hub.',
    prompt:
      'Create a pet collector simulator with 30 pets across 5 rarities, egg-hatching stations, auto-farm following trails, a coin shop, a pet index UI, and a trading hub where players can swap pets.',
    stats: { parts: 2200, scripts: 24, buildTimeSec: 164 },
    thumbnail: '/showcase/pet-simulator/opengraph-image',
    features: [
      '30 pets across 5 rarities',
      'Egg hatching animations',
      'Auto-follow trail AI',
      'Player-to-player trading',
    ],
    difficulty: 'Medium',
    accentColor: '#EC4899',
  },
  {
    id: 'crystal-mines',
    title: 'Crystal Mines Tycoon',
    genre: 'Tycoon',
    description:
      'Underground mining tycoon with drills, ore conveyors, and upgradeable smelters.',
    prompt:
      'Build an underground crystal-mining tycoon with a cavern, automated drills on plot slots, ore-carrying conveyors, a smelter that converts ore to ingots, upgradeable drill tiers, and a cash-out elevator.',
    stats: { parts: 3400, scripts: 27, buildTimeSec: 198 },
    thumbnail: '/showcase/crystal-mines/opengraph-image',
    features: [
      'Tiered drill upgrades',
      'Conveyor ore physics',
      'Smelter processing',
      'Cave-in event hazard',
    ],
    difficulty: 'Advanced',
    accentColor: '#06B6D4',
  },
  {
    id: 'zombie-survival',
    title: 'Zombie Survival Night',
    genre: 'Horror',
    description:
      'Wave-based zombie survival with weapon drops, barricades, and a safehouse.',
    prompt:
      'Create a wave-based zombie survival game at night with 10 waves of increasing difficulty, weapon crate drops, placeable wooden barricades, a safehouse with healing, and a points economy for upgrades.',
    stats: { parts: 2700, scripts: 22, buildTimeSec: 152 },
    thumbnail: '/showcase/zombie-survival/opengraph-image',
    features: [
      '10-wave progression',
      'Placeable barricades',
      'Weapon pickup crates',
      'Healing safehouse',
    ],
    difficulty: 'Medium',
    accentColor: '#DC2626',
  },
  {
    id: 'sky-islands-obby',
    title: 'Sky Islands Obby',
    genre: 'Obby',
    description:
      'Floating island hop with wind gusts, zip-lines, and parachute jumps.',
    prompt:
      'Build a sky islands obby with 40 floating islands connected by zip-lines and bouncy clouds, wind gusts that push players, parachute jump pads, and a final boss island with a trophy.',
    stats: { parts: 2100, scripts: 12, buildTimeSec: 118 },
    thumbnail: '/showcase/sky-islands-obby/opengraph-image',
    features: [
      '40 floating island stages',
      'Zip-line traversal',
      'Wind-gust hazards',
      'Parachute jump mechanic',
    ],
    difficulty: 'Easy',
    accentColor: '#38BDF8',
  },
]

/** Genres available as filter tabs on the showcase page. */
export const SHOWCASE_GENRES: readonly ShowcaseGenre[] = [
  'RPG',
  'Tycoon',
  'Obby',
  'Simulator',
  'Racing',
  'Horror',
  'Sci-Fi',
  'Adventure',
] as const

/**
 * Build a deep link to the editor that recreates a showcase game by passing
 * its prompt as a query parameter. Keeps the encoding in one place so both
 * the landing page and the showcase page stay in sync.
 */
export function buildShowcaseEditorHref(game: ShowcaseGame): string {
  return `/editor?prompt=${encodeURIComponent(game.prompt)}`
}

/**
 * URL for the compact 400x300 dynamic thumbnail rendered by
 * `src/app/(marketing)/showcase/[slug]/thumbnail.tsx`. Use this for card
 * grids; use `game.thumbnail` for the full 1200x630 OG image.
 */
export function buildShowcaseThumbnailSrc(game: ShowcaseGame): string {
  return `/showcase/${game.id}/thumbnail`
}

/** Format seconds into a human-friendly "1m 24s" style string. */
export function formatBuildTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s === 0 ? `${m}m` : `${m}m ${s}s`
}

/** Format large part counts with a "+" suffix for display. */
export function formatPartCount(parts: number): string {
  if (parts >= 1000) {
    const k = (parts / 1000).toFixed(1).replace(/\.0$/, '')
    return `${k}k+`
  }
  return `${parts}+`
}
