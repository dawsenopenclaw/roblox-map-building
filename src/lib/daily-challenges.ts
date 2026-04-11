/**
 * Daily challenge library — curated prompt challenges used by the daily
 * challenge API and homepage widget.
 *
 * Each challenge is a complete brief: what to build, the prompt template to
 * feed the AI generator, concrete success criteria a reviewer or automated
 * scorer can check, and an XP reward scaled to difficulty.
 *
 * Difficulty budgets (XP):
 *   beginner:     60–100
 *   intermediate: 120–200
 *   expert:       220–350
 */

export type ChallengeDifficulty = 'beginner' | 'intermediate' | 'expert'

export type ChallengeTheme =
  | 'obby'
  | 'tycoon'
  | 'simulator'
  | 'pvp'
  | 'horror'
  | 'racing'
  | 'rpg'
  | 'parkour'
  | 'puzzle'
  | 'sandbox'
  | 'story'
  | 'social'

export interface DailyChallenge {
  /** Stable id — do NOT renumber existing entries. Append only. */
  id: string
  title: string
  description: string
  /** Prompt template fed to the AI generator. Use {name} for user interpolation. */
  promptTemplate: string
  difficulty: ChallengeDifficulty
  theme: ChallengeTheme
  /** Concrete, checkable success criteria. Short bullet-like statements. */
  successCriteria: string[]
  xpReward: number
  /** Soft time budget (minutes) shown to the user as a hint. */
  estimatedMinutes: number
  /** Optional tags for filtering / analytics. */
  tags: string[]
}

export const DAILY_CHALLENGES: ReadonlyArray<DailyChallenge> = [
  // ── BEGINNER ───────────────────────────────────────────────────────────
  {
    id: 'dc_001_obby_neon',
    title: 'Neon Obby Sprint',
    description: 'Build a 20-stage neon-themed obby where each stage gets progressively harder.',
    promptTemplate:
      'Create a 20-stage obby called "{name}" with a glowing neon aesthetic. Each stage introduces one new mechanic — jumps, rotating platforms, disappearing tiles, and a final boss jump. Include checkpoints every 5 stages.',
    difficulty: 'beginner',
    theme: 'obby',
    successCriteria: [
      'Exactly 20 playable stages',
      'Checkpoints at stages 5, 10, 15',
      'At least 5 distinct obstacle types',
      'Neon color palette with emissive materials',
    ],
    xpReward: 80,
    estimatedMinutes: 15,
    tags: ['obby', 'neon', 'sprint'],
  },
  {
    id: 'dc_002_tycoon_bakery',
    title: 'Bakery Tycoon',
    description: 'Run a bakery: buy ovens, hire workers, sell pastries, and expand.',
    promptTemplate:
      'Build a bakery tycoon called "{name}". Start with one oven and unlock croissants, cakes, and donuts. Customers walk up, buy, and your cash goes to a display board. Include 3 worker upgrades and 5 product tiers.',
    difficulty: 'beginner',
    theme: 'tycoon',
    successCriteria: [
      'Working dropper/buyer economy',
      '5 product tiers',
      'Cash display with leaderboard',
      'At least 3 purchasable upgrades',
    ],
    xpReward: 90,
    estimatedMinutes: 18,
    tags: ['tycoon', 'economy', 'casual'],
  },
  {
    id: 'dc_003_sim_pet',
    title: 'Pet Trainer Simulator',
    description: 'Collect pets, train them, and battle friends.',
    promptTemplate:
      'Create a pet simulator called "{name}" where players hatch eggs to collect 10 different pets, feed them to level up, and use them to break blocks for coins. Include a rebirth system.',
    difficulty: 'beginner',
    theme: 'simulator',
    successCriteria: [
      '10 unique pet types',
      'Egg hatching system',
      'Pet XP + leveling',
      'Rebirth mechanic',
    ],
    xpReward: 95,
    estimatedMinutes: 20,
    tags: ['simulator', 'pets', 'grind'],
  },
  {
    id: 'dc_004_parkour_rooftops',
    title: 'Rooftop Parkour',
    description: 'Free-run across a neon city skyline.',
    promptTemplate:
      'Build a rooftop parkour map called "{name}" across a cyberpunk city. Include wall runs, zip lines, and 3 collectible artifacts. Add a timer for speedrunners.',
    difficulty: 'beginner',
    theme: 'parkour',
    successCriteria: [
      'At least 10 rooftops to cross',
      'Zip line mechanic',
      '3 collectibles',
      'Speedrun timer',
    ],
    xpReward: 85,
    estimatedMinutes: 16,
    tags: ['parkour', 'cyberpunk', 'speedrun'],
  },
  {
    id: 'dc_005_puzzle_lighthouse',
    title: 'Lighthouse Riddles',
    description: 'Solve 5 riddles to escape a haunted lighthouse.',
    promptTemplate:
      'Build a single-player puzzle map called "{name}" inside a 3-story lighthouse. Each floor has a riddle tied to a physical puzzle: rotate mirrors, weigh boxes, wire circuits. Final floor reveals the lighthouse keeper\'s secret.',
    difficulty: 'beginner',
    theme: 'puzzle',
    successCriteria: [
      '3 distinct puzzles, one per floor',
      'Inventory system for clue items',
      'Story beat at the top of the lighthouse',
    ],
    xpReward: 100,
    estimatedMinutes: 22,
    tags: ['puzzle', 'mystery', 'story'],
  },
  {
    id: 'dc_006_social_hangout_cafe',
    title: 'Cozy Cafe Hangout',
    description: 'Build a chill social cafe with emotes and mini games.',
    promptTemplate:
      'Build a cozy cafe hangout called "{name}" with seating for 20 players, an order counter with 6 drinks, background music, and a dart game mini activity.',
    difficulty: 'beginner',
    theme: 'social',
    successCriteria: [
      'Seating for 20 players',
      'Interactive order counter with 6 items',
      'At least one mini activity',
    ],
    xpReward: 75,
    estimatedMinutes: 14,
    tags: ['social', 'cozy', 'hangout'],
  },
  {
    id: 'dc_007_sandbox_snow',
    title: 'Snowball Sandbox',
    description: 'Tiny winter sandbox where players build snow forts and fight.',
    promptTemplate:
      'Build a snowy sandbox called "{name}" with infinite snow blocks, a snowball throwing tool, buildable forts, and two spawn zones.',
    difficulty: 'beginner',
    theme: 'sandbox',
    successCriteria: [
      'Block placing tool',
      'Snowball ranged weapon',
      'Two team spawn zones',
    ],
    xpReward: 70,
    estimatedMinutes: 12,
    tags: ['sandbox', 'winter', 'pvp-lite'],
  },
  {
    id: 'dc_008_horror_hallway',
    title: 'One Long Hallway',
    description: 'A horror experience in a single hallway. Only lights and sound change.',
    promptTemplate:
      'Build a horror experience called "{name}" set in a single 200-stud hallway. As the player walks, lights flicker, whispers play, and the hallway subtly extends. End with a single jumpscare.',
    difficulty: 'beginner',
    theme: 'horror',
    successCriteria: [
      'Single hallway, no branching',
      'Dynamic lighting triggered by distance',
      'Ambient audio cues',
      'One scripted jumpscare at the end',
    ],
    xpReward: 90,
    estimatedMinutes: 18,
    tags: ['horror', 'atmospheric', 'short'],
  },

  // ── INTERMEDIATE ──────────────────────────────────────────────────────
  {
    id: 'dc_009_rpg_village',
    title: 'Starter Village RPG',
    description: 'A fetch-quest RPG village with 3 NPCs and combat.',
    promptTemplate:
      'Build a medieval village hub called "{name}" with 3 quest-giver NPCs. Each quest sends the player to a nearby forest to kill enemies, gather herbs, or find a lost child. Include a gold system, an inventory, and a shop.',
    difficulty: 'intermediate',
    theme: 'rpg',
    successCriteria: [
      '3 NPCs with distinct quests',
      'Combat system with health bar',
      'Gold + inventory persistence in-session',
      'Working shop',
    ],
    xpReward: 150,
    estimatedMinutes: 35,
    tags: ['rpg', 'quest', 'combat'],
  },
  {
    id: 'dc_010_pvp_capture_flag',
    title: 'Capture the Flag Arena',
    description: 'Team PvP with flags, respawns, and round timer.',
    promptTemplate:
      'Build a capture-the-flag arena called "{name}" with two symmetric bases, a 5-minute round timer, 3 weapon pickups, respawns, and a scoreboard that announces the winning team.',
    difficulty: 'intermediate',
    theme: 'pvp',
    successCriteria: [
      'Symmetric bases',
      'Working flag carry/drop mechanic',
      'Round timer + winner announcement',
      'At least 3 weapon pickups',
    ],
    xpReward: 170,
    estimatedMinutes: 40,
    tags: ['pvp', 'team', 'arena'],
  },
  {
    id: 'dc_011_racing_drift',
    title: 'Drift Race Circuit',
    description: 'A drift-focused racing circuit with 3 laps and ghost replay.',
    promptTemplate:
      'Create a drift racing game called "{name}" with a winding mountain circuit, 3 laps, a drift score multiplier, and a ghost of the player\'s best run.',
    difficulty: 'intermediate',
    theme: 'racing',
    successCriteria: [
      'Drivable car with drift physics',
      '3-lap race with start/finish line',
      'Drift scoring system',
      'Best-run ghost replay',
    ],
    xpReward: 180,
    estimatedMinutes: 45,
    tags: ['racing', 'drift', 'physics'],
  },
  {
    id: 'dc_012_horror_backrooms',
    title: 'Backrooms Level 0',
    description: 'Procedural endless yellow hallway with an entity hunter.',
    promptTemplate:
      'Build a backrooms-inspired experience called "{name}". Use procedurally instanced yellow hallways stretching infinitely, a stamina system, and a single entity that slowly chases the player from behind.',
    difficulty: 'intermediate',
    theme: 'horror',
    successCriteria: [
      'Procedurally generated or looping halls',
      'Stamina + sprint mechanic',
      'AI entity that pursues the player',
      'Save beacons every X rooms',
    ],
    xpReward: 200,
    estimatedMinutes: 50,
    tags: ['horror', 'liminal', 'chase'],
  },
  {
    id: 'dc_013_sim_mining',
    title: 'Deep Mine Simulator',
    description: 'Dig deeper, collect rarer ores, upgrade pickaxe.',
    promptTemplate:
      'Build a mining simulator called "{name}" with 10 depth layers of increasing rarity, 8 pickaxe tiers, and a sell trader at the surface. Include rare gems that grant XP.',
    difficulty: 'intermediate',
    theme: 'simulator',
    successCriteria: [
      '10 ore tiers by depth',
      '8 pickaxe tiers',
      'Sell trader with working economy',
      'Rare gem drop table',
    ],
    xpReward: 140,
    estimatedMinutes: 30,
    tags: ['simulator', 'mining', 'grind'],
  },
  {
    id: 'dc_014_tycoon_theme_park',
    title: 'Theme Park Tycoon',
    description: 'Build a theme park with 3 ride types and visitors.',
    promptTemplate:
      'Build a theme park tycoon called "{name}" with a roller coaster, a Ferris wheel, and a carousel. Visitors path-find from the entrance, pay for rides, and contribute to park cash.',
    difficulty: 'intermediate',
    theme: 'tycoon',
    successCriteria: [
      '3 functional rides',
      'Visitor path-finding',
      'Cash accumulation system',
      'Upgrade tree with at least 5 nodes',
    ],
    xpReward: 190,
    estimatedMinutes: 48,
    tags: ['tycoon', 'themepark', 'pathfinding'],
  },
  {
    id: 'dc_015_story_train',
    title: 'The Last Train',
    description: 'A 15-minute narrative on a moving train with branching dialogue.',
    promptTemplate:
      'Build a short narrative experience called "{name}" set aboard a train with 4 carriages. Talk to 3 passengers, each with branching dialogue. Player choices affect which of 3 endings plays.',
    difficulty: 'intermediate',
    theme: 'story',
    successCriteria: [
      'Moving train with 4 carriages',
      '3 NPCs with branching dialogue',
      '3 distinct endings',
      'Complete in under 15 minutes',
    ],
    xpReward: 160,
    estimatedMinutes: 45,
    tags: ['story', 'narrative', 'branching'],
  },
  {
    id: 'dc_016_puzzle_portal_mini',
    title: 'Portal-Style Test Chambers',
    description: '5 chambers where the only mechanic is placing blue/orange portals.',
    promptTemplate:
      'Create a portal-inspired puzzle game called "{name}" with 5 test chambers. The player has a tool that places blue and orange portals on any flat surface. Each chamber is a self-contained physics puzzle.',
    difficulty: 'intermediate',
    theme: 'puzzle',
    successCriteria: [
      'Working portal placement tool',
      'Momentum preservation through portals',
      '5 solvable chambers',
      'Increasing difficulty curve',
    ],
    xpReward: 195,
    estimatedMinutes: 55,
    tags: ['puzzle', 'portal', 'physics'],
  },
  {
    id: 'dc_017_social_wedding',
    title: 'Wedding Planner',
    description: 'Customizable wedding venue with role assignment.',
    promptTemplate:
      'Build a wedding hangout called "{name}" where one player is bride, one is groom, and others are guests. Include a customizable aisle, dance floor, and a scripted vow sequence.',
    difficulty: 'intermediate',
    theme: 'social',
    successCriteria: [
      'Role assignment system',
      'Customizable ceremony assets',
      'Scripted vow/dance sequence',
    ],
    xpReward: 130,
    estimatedMinutes: 30,
    tags: ['social', 'roleplay', 'wedding'],
  },
  {
    id: 'dc_018_pvp_battle_royale_mini',
    title: 'Mini Battle Royale',
    description: '16-player shrinking-circle BR on a tiny island.',
    promptTemplate:
      'Build a mini battle royale called "{name}" on a tropical island sized for 16 players. Include a shrinking safe zone, 5 weapon tiers, random loot crates, and a winner-take-all mode.',
    difficulty: 'intermediate',
    theme: 'pvp',
    successCriteria: [
      'Shrinking safe zone with damage outside',
      '5 weapon tiers with loot drops',
      'Winner announcement',
      'Scales up to 16 players',
    ],
    xpReward: 200,
    estimatedMinutes: 50,
    tags: ['pvp', 'br', 'shooter'],
  },

  // ── EXPERT ────────────────────────────────────────────────────────────
  {
    id: 'dc_019_rpg_dungeon_crawler',
    title: 'Procedural Dungeon Crawler',
    description: 'Roguelike dungeon with procgen rooms, loot, and a boss.',
    promptTemplate:
      'Build a roguelike dungeon crawler called "{name}" with procedurally generated rooms, 4 enemy types, weapon rarities, a skill tree, and a boss fight at floor 5.',
    difficulty: 'expert',
    theme: 'rpg',
    successCriteria: [
      'Procedurally generated dungeon layout',
      '4 enemy AI types',
      'Loot rarity system',
      'Working boss fight with phases',
    ],
    xpReward: 300,
    estimatedMinutes: 90,
    tags: ['rpg', 'roguelike', 'procgen', 'boss'],
  },
  {
    id: 'dc_020_sim_city',
    title: 'Mini City Builder',
    description: 'Zone-based city builder with traffic simulation.',
    promptTemplate:
      'Build a city builder called "{name}" with residential, commercial, and industrial zones on a grid, simulated traffic, and a day/night cycle. Population grows based on zone balance.',
    difficulty: 'expert',
    theme: 'simulator',
    successCriteria: [
      'Grid-based zoning',
      'Traffic simulation',
      'Day/night cycle',
      'Population growth driven by balance',
    ],
    xpReward: 330,
    estimatedMinutes: 100,
    tags: ['simulator', 'city', 'grid', 'economy'],
  },
  {
    id: 'dc_021_horror_sanatorium',
    title: 'Sanatorium Survival',
    description: '4-player co-op horror in an abandoned asylum.',
    promptTemplate:
      'Build a 4-player co-op horror game called "{name}" set in an abandoned sanatorium. Players must find 8 keys, repair the exit generator, and escape while a pursuing entity teleports between floors.',
    difficulty: 'expert',
    theme: 'horror',
    successCriteria: [
      '4-player coop',
      '8 key collectibles',
      'AI entity with teleport behavior',
      'Generator repair puzzle',
      'Multi-floor level design',
    ],
    xpReward: 350,
    estimatedMinutes: 110,
    tags: ['horror', 'coop', 'ai'],
  },
  {
    id: 'dc_022_racing_pro_kart',
    title: 'Kart Racer Championship',
    description: 'Kart racing with items, 3 tracks, and local tournament.',
    promptTemplate:
      'Build a kart racer called "{name}" with 3 themed tracks (beach, desert, sky), item boxes that drop 6 different power-ups, AI opponents, and a championship progression.',
    difficulty: 'expert',
    theme: 'racing',
    successCriteria: [
      '3 distinct tracks',
      '6 working power-ups',
      'AI driver opponents',
      'Championship mode with standings',
    ],
    xpReward: 280,
    estimatedMinutes: 85,
    tags: ['racing', 'kart', 'items', 'ai'],
  },
  {
    id: 'dc_023_pvp_moba_lane',
    title: 'Single-Lane MOBA',
    description: 'Stripped-down MOBA: one lane, 3 heroes, minions, towers.',
    promptTemplate:
      'Build a simplified MOBA called "{name}" with one lane, 3 playable heroes with distinct kits, periodic minion waves, and 2 towers per side. Matches end when one nexus falls.',
    difficulty: 'expert',
    theme: 'pvp',
    successCriteria: [
      '3 hero classes with different abilities',
      'Minion wave spawning',
      '2 towers per team that can die',
      'Nexus victory condition',
    ],
    xpReward: 340,
    estimatedMinutes: 120,
    tags: ['pvp', 'moba', 'strategy'],
  },
  {
    id: 'dc_024_sandbox_physics_playground',
    title: 'Physics Playground',
    description: 'Open sandbox with spawnable props, ropes, and explosions.',
    promptTemplate:
      'Build a physics sandbox called "{name}" with a prop spawner (20 objects), rope/constraint tools, explosives, a cannon, and a "freeze time" toggle. Everything interacts with Roblox physics.',
    difficulty: 'expert',
    theme: 'sandbox',
    successCriteria: [
      'Prop spawner with 20+ props',
      'Rope/constraint tool',
      'Working explosives',
      'Time-freeze feature',
    ],
    xpReward: 260,
    estimatedMinutes: 80,
    tags: ['sandbox', 'physics', 'tools'],
  },
  {
    id: 'dc_025_story_detective',
    title: 'Noir Detective Case',
    description: 'Whodunit mystery with 4 suspects, an interrogation mechanic, and a final accusation.',
    promptTemplate:
      'Build a noir mystery called "{name}". The player is a detective investigating a murder. Interview 4 suspects, collect 6 clues from 3 locations, and make a final accusation. Wrong accusations trigger a bad ending.',
    difficulty: 'expert',
    theme: 'story',
    successCriteria: [
      '4 suspect NPCs with alibis',
      'Clue collection across 3 locations',
      'Interrogation dialogue trees',
      'Multiple endings based on accusation',
    ],
    xpReward: 290,
    estimatedMinutes: 90,
    tags: ['story', 'mystery', 'detective', 'dialogue'],
  },
  {
    id: 'dc_026_tycoon_spaceport',
    title: 'Spaceport Tycoon',
    description: 'Run a spaceport: dock ships, refuel, launch missions.',
    promptTemplate:
      'Build a spaceport tycoon called "{name}". Players construct docking bays, refuel arriving ships for cash, upgrade to larger classes, and launch 3 mission types. Include an orbital view.',
    difficulty: 'expert',
    theme: 'tycoon',
    successCriteria: [
      'Ship docking sequence',
      'Refuel minigame',
      '3 mission types',
      'Orbital view / launch animation',
    ],
    xpReward: 310,
    estimatedMinutes: 95,
    tags: ['tycoon', 'space', 'advanced'],
  },
  {
    id: 'dc_027_puzzle_time_loop',
    title: 'Time Loop Puzzle Room',
    description: 'Puzzles solved by recording past selves.',
    promptTemplate:
      'Build a single-player puzzle game called "{name}" where the player can record a 30-second action loop. Previous recordings play back as "ghosts" that can press switches and hold doors for the current run. 5 rooms, each needing 2-3 ghosts.',
    difficulty: 'expert',
    theme: 'puzzle',
    successCriteria: [
      'Working record/playback system',
      '5 rooms of increasing complexity',
      'Ghosts can interact with switches',
      'Reset loop button',
    ],
    xpReward: 350,
    estimatedMinutes: 120,
    tags: ['puzzle', 'time', 'recording'],
  },
  {
    id: 'dc_028_social_talent_show',
    title: 'Live Talent Show Stage',
    description: 'Stage with roles (MC, performer, audience), scoring, emotes.',
    promptTemplate:
      'Build a talent show venue called "{name}" with a stage, spotlights, mic pickups, audience seating for 30, a scoring panel for 3 judges, and emotes. Include a queue system for performers.',
    difficulty: 'expert',
    theme: 'social',
    successCriteria: [
      'Role system (MC/performer/judge/audience)',
      'Queue for performers',
      'Judge scoring UI',
      'Spotlight & mic pickups',
    ],
    xpReward: 240,
    estimatedMinutes: 70,
    tags: ['social', 'stage', 'roleplay'],
  },
  {
    id: 'dc_029_parkour_wall_run',
    title: 'Wall Run Gauntlet',
    description: 'Advanced parkour gauntlet using wall runs and double jumps.',
    promptTemplate:
      'Build an advanced parkour gauntlet called "{name}" with a wall-run mechanic, double-jump, grapple hook, and 8 themed sections (neon, jungle, ruins, rooftops…). Include a speedrun leaderboard.',
    difficulty: 'expert',
    theme: 'parkour',
    successCriteria: [
      'Wall-run + double-jump mechanics',
      'Grapple hook',
      '8 themed sections',
      'Speedrun leaderboard',
    ],
    xpReward: 270,
    estimatedMinutes: 85,
    tags: ['parkour', 'gauntlet', 'movement'],
  },
  {
    id: 'dc_030_rpg_fishing_village',
    title: 'Fishing Village RPG',
    description: 'Relaxed RPG with fishing, cooking, and a festival.',
    promptTemplate:
      'Build a relaxed RPG called "{name}" set in a seaside fishing village. Include a fishing minigame with 15 fish species, a cooking station with 6 recipes, shopkeepers, and a scripted festival event.',
    difficulty: 'expert',
    theme: 'rpg',
    successCriteria: [
      'Fishing minigame with 15 species',
      'Cooking station with 6 recipes',
      '3 shopkeeper NPCs',
      'Scripted festival sequence',
    ],
    xpReward: 300,
    estimatedMinutes: 100,
    tags: ['rpg', 'relaxing', 'fishing', 'cooking'],
  },
]

export function getChallengeById(id: string): DailyChallenge | undefined {
  return DAILY_CHALLENGES.find((c) => c.id === id)
}

export function getChallengesByDifficulty(
  difficulty: ChallengeDifficulty,
): DailyChallenge[] {
  return DAILY_CHALLENGES.filter((c) => c.difficulty === difficulty)
}

export function getChallengesByTheme(theme: ChallengeTheme): DailyChallenge[] {
  return DAILY_CHALLENGES.filter((c) => c.theme === theme)
}

/**
 * Deterministically pick today's challenge based on the date. Same date
 * returns the same challenge for every user, rotating through the pool.
 */
export function getTodaysChallenge(now: Date = new Date()): DailyChallenge {
  const epochDays = Math.floor(now.getTime() / 86_400_000)
  const idx = epochDays % DAILY_CHALLENGES.length
  return DAILY_CHALLENGES[idx]
}

/**
 * Get the next N days of upcoming challenges (for admin previews).
 */
export function getUpcomingChallenges(days: number, now: Date = new Date()): DailyChallenge[] {
  const out: DailyChallenge[] = []
  for (let i = 0; i < days; i++) {
    const d = new Date(now.getTime() + i * 86_400_000)
    out.push(getTodaysChallenge(d))
  }
  return out
}
