/**
 * game-templates-marketplace.ts
 * Metadata and prompt mappings for the 11 brainrot game templates.
 *
 * The `code` field is not inlined — each entry stores a rich generation prompt
 * that the ForjeAI editor uses to produce the full Luau game on demand.
 * Actual .lua source files live at C:/Users/Dawse/Desktop/brainrot-games/.
 */

export type GameDifficulty = 'beginner' | 'intermediate' | 'advanced'

export type GameGenre =
  | 'Clicker'
  | 'Obby'
  | 'Simulator'
  | 'Horror'
  | 'Tycoon'
  | 'Social'
  | 'Tower Defense'
  | 'Strategy'

export interface GameTemplateMarketplace {
  id: string
  /** Maps to tpl_game_* in SEED_TEMPLATES */
  templateId: string
  name: string
  description: string
  genre: GameGenre
  /** Emoji identifier used as the card thumbnail */
  thumbnail: string
  /** Hex color for genre badge and card accent */
  accentColor: string
  features: string[]
  lineCount: number
  difficulty: GameDifficulty
  monetization: string[]
  /** Generation prompt sent to the editor when "Use Template" is clicked */
  generationPrompt: string
}

export const GAME_TEMPLATES_MARKETPLACE: GameTemplateMarketplace[] = [
  {
    id: 'sigma-clicker',
    templateId: 'tpl_game_sigma_clicker',
    name: 'Sigma Aura Clicker',
    description:
      'A polished clicking simulator with an aura progression system, 3 visually distinct themed zones, 5 rebirth tiers, and auto-clicker upgrades. Everything wired to DataStore with a leaderboard.',
    genre: 'Clicker',
    thumbnail: '✨',
    accentColor: '#D4AF37',
    features: [
      'Click-to-earn aura with multipliers',
      '3 themed zones: Glass Dome, Neon Arena, Volcano',
      '5 rebirth tiers with prestige bonuses',
      'Auto-clicker upgrade shop',
      'Zone gate unlock system',
      'Top-10 leaderboard',
      'DataStore v2 save/load',
    ],
    lineCount: 1420,
    difficulty: 'intermediate',
    monetization: ['2x Aura gamepass', 'Auto-clicker gamepass', 'VIP aura skin'],
    generationPrompt:
      'Create a complete Sigma Aura Clicker game with 3 themed zones (glass dome, neon arena, volcano), click-to-earn aura, 5 rebirth tiers, auto-clicker upgrades, zone gates, leaderboard, DataStore saving, polished GUI with UICorner',
  },
  {
    id: 'find-skibidi',
    templateId: 'tpl_game_find_skibidi',
    name: 'Find the Skibidi',
    description:
      'A scavenger hunt game spread across 5 themed zones. Players race to find 30 hidden items split across 5 rarity tiers. Includes a hint system, countdown timer, and leaderboard.',
    genre: 'Social',
    thumbnail: '🔍',
    accentColor: '#06B6D4',
    features: [
      '5 distinct themed zones',
      '30 hidden collectible items',
      '5 rarity tiers (Common → Mythic)',
      'Hint purchase system',
      'Countdown timer per round',
      'Fastest-completion leaderboard',
      'DataStore item tracking',
    ],
    lineCount: 1180,
    difficulty: 'beginner',
    monetization: ['Hint pack gamepass', 'Double XP gamepass', 'Extra timer gamepass'],
    generationPrompt:
      'Create a complete Find the Skibidi scavenger hunt game with 5 themed zones, 30 hidden collectible items in 5 rarity tiers, a hint system, countdown timer, leaderboard tracking fastest completions, and DataStore saving',
  },
  {
    id: 'only-up-obby',
    templateId: 'tpl_game_only_up_obby',
    name: 'Only Up! Parkour Tower',
    description:
      '50-stage vertical parkour obby inspired by Only Up. Six platform types with escalating difficulty, checkpoint saves every 5 stages, fall counter, and an OrderedDataStore speed leaderboard.',
    genre: 'Obby',
    thumbnail: '🧗',
    accentColor: '#F97316',
    features: [
      '50 progressively harder stages',
      '6 platform types: normal, moving, rotating, shrinking, ice, conveyor',
      'Checkpoint flags every 5 stages',
      'Fall counter HUD',
      'Stage counter GUI',
      'OrderedDataStore leaderboard',
      'Kill brick respawn logic',
    ],
    lineCount: 2100,
    difficulty: 'intermediate',
    monetization: ['Skip stage gamepass', 'Checkpoint anywhere gamepass', 'Speed boost trail'],
    generationPrompt:
      'Create a complete Only Up vertical parkour obby with 50 progressively harder stages, 6 platform types (normal, moving, rotating, shrinking, ice, conveyor), checkpoint flags every 5 stages, fall counter, stage GUI, and OrderedDataStore leaderboard',
  },
  {
    id: 'pet-hatch',
    templateId: 'tpl_game_pet_hatch',
    name: 'Hatch the Brainrot Pets',
    description:
      'A full pet simulator with 3 egg types, 15 unique brainrot pets across 5 rarities, animated hatching, following AI, 6-slot pet inventory, feeding mechanic, and DataStore v2 persistence.',
    genre: 'Simulator',
    thumbnail: '🥚',
    accentColor: '#EC4899',
    features: [
      '3 egg types with rarity weightings',
      '15 unique pets across 5 rarity tiers',
      'Animated egg hatching reveal',
      'Pet following behavior AI',
      '6-slot equipped pet inventory',
      'Feeding mechanic for bonuses',
      'DataStore v2 persistence',
    ],
    lineCount: 2480,
    difficulty: 'advanced',
    monetization: ['Lucky egg gamepass', '2x hatch speed', 'Inventory expansion'],
    generationPrompt:
      'Create a complete Brainrot pet hatching game with 3 egg types, 15 unique pets across 5 rarity tiers, hatching animation, pet following behavior, inventory GUI holding 6 equipped pets, feeding mechanic, and DataStore v2 saving',
  },
  {
    id: 'punch-sim',
    templateId: 'tpl_game_punch_sim',
    name: 'Strongest Punch Simulator',
    description:
      'A training-based punch power simulator with 4 zones, 6 unlockable abilities with cooldowns, a PvP arena, prestige rebirth system, leaderboard, and server-authoritative anti-exploit logic.',
    genre: 'Simulator',
    thumbnail: '👊',
    accentColor: '#EF4444',
    features: [
      '4 training zones: Sandbag, Boulder, Meteor, Void',
      'Click-to-train punch power',
      '6 unlockable abilities with cooldowns',
      'PvP arena with matchmaking',
      'Prestige/rebirth system',
      'Anti-cheat server authority',
      'Global leaderboard',
    ],
    lineCount: 1950,
    difficulty: 'advanced',
    monetization: ['2x Power gamepass', 'Ability unlock pack', 'Exclusive aura trail'],
    generationPrompt:
      'Create a complete Strongest Punch Simulator with 4 training zones (sandbag, boulder, meteor, void), click-to-train punch power, 6 unlockable abilities with cooldowns, PvP arena, prestige/rebirth system, leaderboard, and server-authoritative anti-cheat',
  },
  {
    id: 'speed-run',
    templateId: 'tpl_game_speed_run',
    name: 'Speed Run 50 Stages',
    description:
      '50-stage speed run split across 5 themed worlds (Candy, Space, Lava, Ice, Cyber) with 8 obstacle types, per-stage timer, ghost replay of the fastest run, and badge awards.',
    genre: 'Obby',
    thumbnail: '⚡',
    accentColor: '#A855F7',
    features: [
      '50 stages across 5 themed worlds',
      '8 obstacle types per world',
      'Per-stage millisecond timer',
      'Ghost replay of fastest run',
      'World leaderboards via OrderedDataStore',
      'Badge awards for world completion',
      'Checkpoint system',
    ],
    lineCount: 2200,
    difficulty: 'intermediate',
    monetization: ['Speed boost gamepass', 'Ghost trail cosmetic', 'Skip world pass'],
    generationPrompt:
      'Create a complete Speed Run game with 50 stages across 5 themed worlds (candy, space, lava, ice, cyber), 8 obstacle types, per-stage timer, ghost replay showing the fastest run, world leaderboards using OrderedDataStore, and badge awards for completion',
  },
  {
    id: 'merge-sim',
    templateId: 'tpl_game_merge_sim',
    name: 'Merge Brainrot Simulator',
    description:
      'A 5x5 drag-and-drop merge grid simulator with 7 item tiers, personal islands per player, offline coin earnings, auto-merge gamepass, animated merge VFX, and DataStore v2 saving.',
    genre: 'Simulator',
    thumbnail: '🔀',
    accentColor: '#22C55E',
    features: [
      '5x5 drag-and-drop merge grid',
      '7 item tiers with escalating coin value',
      'Personal island per player',
      'Offline coin earnings',
      'Animated merge particle VFX',
      'Auto-merge gamepass upgrade',
      'DataStore v2 persistence',
    ],
    lineCount: 1680,
    difficulty: 'intermediate',
    monetization: ['Auto-merge gamepass', 'Grid expansion gamepass', '2x offline earnings'],
    generationPrompt:
      'Create a complete Merge Brainrot Simulator with a 5x5 drag-and-drop merge grid, 7 item tiers with escalating value, personal island per player, auto-merge gamepass upgrade, offline coin earnings, animated merge VFX, and DataStore v2 saving',
  },
  {
    id: 'would-you-rather',
    templateId: 'tpl_game_would_you_rather',
    name: 'Would You Rather: Brainrot',
    description:
      'A stadium elimination party game with 50 brainrot questions, team splitting into two sides, minority elimination each round, spectator stands, vote percentage display, and round tracking.',
    genre: 'Social',
    thumbnail: '🏟️',
    accentColor: '#F59E0B',
    features: [
      'Stadium map split into two sides',
      '50 brainrot-themed questions',
      'Team splitting mechanic',
      'Minority-side elimination per round',
      'Spectator stands for eliminated players',
      'Live vote percentage display',
      'Round win tracking',
    ],
    lineCount: 1090,
    difficulty: 'beginner',
    monetization: ['VIP spectator seat', 'Question pack DLC', 'Exclusive emotes'],
    generationPrompt:
      'Create a complete Would You Rather Brainrot game with a stadium map split into two sides, 50 brainrot-themed questions, team splitting mechanic, elimination of the minority side each round, spectator stands for eliminated players, vote percentage display, and round win tracking',
  },
  {
    id: 'brainrot-tycoon',
    templateId: 'tpl_game_brainrot_tycoon',
    name: 'Brainrot Tycoon',
    description:
      'Classic dropper-conveyor tycoon with 4 claimable plots, 8 brainrot-themed machines, 10 purchasable upgrades, rebirth income multipliers, owner-locked doors, and full DataStore saving.',
    genre: 'Tycoon',
    thumbnail: '🏭',
    accentColor: '#16A34A',
    features: [
      '4 claimable player plots',
      '8 brainrot-themed dropper machines',
      'Conveyor belts and collector pad',
      '10 purchasable upgrade tiers',
      'Rebirth system with income multipliers',
      'Owner-locked plot doors',
      'DataStore cash/upgrade persistence',
    ],
    lineCount: 1860,
    difficulty: 'intermediate',
    monetization: ['2x Income gamepass', 'Plot VIP boost', 'Exclusive machine skin'],
    generationPrompt:
      'Create a complete Brainrot Tycoon with 4 claimable plots, 8 brainrot-themed dropper machines, conveyor belts feeding a collector, 10 purchasable upgrades, rebirth system with income multipliers, owner-locked doors, cash display GUI, and DataStore saving',
  },
  {
    id: 'escape-backrooms',
    templateId: 'tpl_game_escape_backrooms',
    name: 'Escape the Backrooms',
    description:
      '30-room procedural horror maze with a chasing monster, flashlight with battery drain, sanity meter with screen distortion, 5 scripted jump scares, flickering fluorescent lighting, and an exit win condition.',
    genre: 'Horror',
    thumbnail: '🚪',
    accentColor: '#7C3AED',
    features: [
      '30 procedurally-arranged rooms',
      'Monster NPC with PathfindingService chase',
      'Flashlight tool with battery drain',
      'Sanity meter causing screen distortion',
      '5 scripted jump scare events',
      'Flickering fluorescent lighting',
      'Exit door win condition',
    ],
    lineCount: 2050,
    difficulty: 'advanced',
    monetization: ['Sanity boost gamepass', 'Extra battery gamepass', 'Exclusive flashlight skin'],
    generationPrompt:
      'Create a complete Escape the Backrooms horror game with 30 procedurally-arranged rooms, a monster NPC with pathfinding that chases players, flashlight tool with battery drain, sanity meter causing screen distortion, 5 scripted jump scares, near-black ambient lighting with flickering fluorescents, and an exit door win condition',
  },
  {
    id: 'tower-defense-full',
    templateId: 'tpl_game_tower_defense_full',
    name: 'Tower Defense',
    description:
      'A complete tower defense game with 5 tower types on grid tiles, 7 enemy types plus a boss wave, 30 escalating waves, gold-for-kills currency, 3-tier upgrade tree per tower, and a 20-lives system.',
    genre: 'Tower Defense',
    thumbnail: '🗼',
    accentColor: '#3B82F6',
    features: [
      '5 tower types: Archer, Cannon, Ice, Poison, Nuke',
      '7 enemy types including a boss',
      '30 escalating waves',
      'Gold-for-kills currency system',
      '3-tier upgrade tree per tower',
      '20-lives system with wave countdown',
      'Victory / defeat screen',
    ],
    lineCount: 2380,
    difficulty: 'advanced',
    monetization: ['Starter tower pack', 'Extra lives gamepass', 'Premium tower skin'],
    generationPrompt:
      'Create a complete Tower Defense game with a winding enemy path, 5 tower types (Archer, Cannon, Ice, Poison, Nuke) placeable on grid tiles, 7 enemy types including a boss wave, 30 escalating waves, gold-for-kills currency, 3-tier upgrade tree per tower, 20-lives system, wave countdown, and victory/defeat screen',
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getMarketplaceTemplateById(id: string): GameTemplateMarketplace | undefined {
  return GAME_TEMPLATES_MARKETPLACE.find((t) => t.id === id)
}

export function getMarketplaceTemplatesByGenre(genre: GameGenre): GameTemplateMarketplace[] {
  return GAME_TEMPLATES_MARKETPLACE.filter((t) => t.genre === genre)
}

export const GAME_GENRES: GameGenre[] = [
  'Clicker',
  'Obby',
  'Simulator',
  'Horror',
  'Tycoon',
  'Social',
  'Tower Defense',
]

export const GENRE_COLORS: Record<GameGenre, string> = {
  'Clicker':       '#D4AF37',
  'Obby':          '#F97316',
  'Simulator':     '#EC4899',
  'Horror':        '#7C3AED',
  'Tycoon':        '#16A34A',
  'Social':        '#06B6D4',
  'Tower Defense': '#3B82F6',
  'Strategy':      '#6366F1',
}
