// ─── Game Template Definitions ─────────────────────────────────────────────────
// Each template seeds the AI with a rich initialPrompt so users start
// from a structured foundation rather than a blank canvas.

export type TemplateCategory =
  | 'Popular'
  | 'Action'
  | 'Simulation'
  | 'Adventure'
  | 'Social'
  | 'Creative'

export interface GameTemplate {
  id: string
  name: string
  description: string
  icon: string
  category: TemplateCategory
  /** Hex color used for the card gradient / glow */
  previewColor: string
  /** Sent as the first user message when this template is selected */
  initialPrompt: string
}

export const GAME_TEMPLATES: GameTemplate[] = [
  // ── Popular ──────────────────────────────────────────────────────────────────
  {
    id: 'obby',
    name: 'Obby',
    description: 'Classic obstacle course with checkpoints, kill bricks & a finish line.',
    icon: '🏃',
    category: 'Popular',
    previewColor: '#F97316',
    initialPrompt:
      'Build a complete Obby (obstacle course) game. Include: a spawn area with a welcome sign, 15 progressively harder obstacle sections (jump pads, rotating platforms, kill bricks, narrow beams, lava floors), numbered checkpoint flags every 3 stages that save progress, a finish line with a winner platform and confetti effect, a stage counter GUI in the top-left, a leaderboard tracking fastest completions, and kill brick respawn logic. Use bright colourful neon materials for obstacles and a clean baseplate. Write all Luau scripts needed.',
  },
  {
    id: 'tycoon',
    name: 'Tycoon',
    description: 'Classic dropper-conveyor tycoon with upgrades & rebirth system.',
    icon: '🏭',
    category: 'Popular',
    previewColor: '#22C55E',
    initialPrompt:
      'Build a factory tycoon game. Include: a player plot claim system (up to 4 plots), a dropper that spawns money parts every second, a conveyor belt feeding parts into a collector pad, a cash register that converts parts to cash, 10 purchasable upgrades (faster dropper, bigger parts, double conveyor, auto-sell, etc.), a rebirth system that multiplies income and resets buildings, a GUI with cash display, upgrade shop, and rebirth button, and owner doors that only the plot owner can open. Write all Luau scripts with DataStore saving.',
  },
  {
    id: 'simulator',
    name: 'Simulator',
    description: 'Click-based simulator with pets, rebirths & a shop.',
    icon: '🖱️',
    category: 'Popular',
    previewColor: '#A855F7',
    initialPrompt:
      'Build a simulator game in the style of Pet Simulator. Include: a click target object in the center of the map that gives coins on click, a pet system with 5 tiers (Common, Uncommon, Rare, Epic, Legendary) that boost click power, an egg hatching mechanic with 3 egg types and randomised rarity outcomes, a rebirth system that resets coins but multiplies future earnings, a shop GUI selling egg rolls and upgrades, a leaderboard for total coins collected, and a pet equip/unequip system. Persist all data with DataStore v2. Write all Luau scripts.',
  },
  {
    id: 'battle-royale',
    name: 'Battle Royale',
    description: 'Shrinking safe zone, weapon loot & last-player-standing win condition.',
    icon: '🪂',
    category: 'Action',
    previewColor: '#EF4444',
    initialPrompt:
      'Build a Battle Royale game. Include: a large 2000×2000 stud island map with varied terrain (forest, beach, hills, town centre), a lobby waiting room with a countdown timer, a plane flyover with parachute drop mechanic, loot crates scattered across the map containing pistols, shotguns, rifles, and health kits, a safe zone circle that shrinks every 60 seconds dealing damage to players outside it, a kill feed GUI, a top-right mini-map, a winner screen that shows the last player standing, and respawn-disabled combat. Write all server-authoritative Luau scripts with anti-cheat distance checks.',
  },
  {
    id: 'horror',
    name: 'Horror',
    description: 'Dark atmosphere, jump scares, flashlight mechanic & tension pacing.',
    icon: '👻',
    category: 'Action',
    previewColor: '#6B21A8',
    initialPrompt:
      'Build a horror game. Include: an abandoned house map with dark ambient lighting (FogEnd 80, FogColor near-black, ambient 10,10,10), a flashlight tool players start with that casts a spotlight and drains battery, 5 triggered jump-scare events (scripted NPC appearances with loud sound and screen shake), locked doors that require finding a key item, a sanity meter that decreases in darkness and causes screen distortion effects, a monster NPC with pathfinding that chases the player, and a win condition of escaping through the exit door. Use SoundService for creaking, breathing, and heartbeat audio. Write all Luau scripts.',
  },
  {
    id: 'racing',
    name: 'Racing',
    description: 'Lap-based circuit with vehicles, boost pads & a lap timer.',
    icon: '🏎️',
    category: 'Action',
    previewColor: '#F59E0B',
    initialPrompt:
      'Build a racing game. Include: a 1.2 km figure-8 race track with banked corners, barriers, and painted lane markings, a vehicle spawner at the start line that seats 1 player, 6 boost pads on straight sections that temporarily increase speed, a lap counter (3 laps to finish), a real-time HUD showing current lap time, best lap, and position out of all racers, a starting traffic-light sequence (red-red-red-go), finish line confetti and results screen showing final standings, and a simple drift mechanic. Write all Luau VehicleController and race-management scripts.',
  },
  // ── Adventure ────────────────────────────────────────────────────────────────
  {
    id: 'tower-defense',
    name: 'Tower Defense',
    description: 'Waypoint enemy path, placeable towers, wave manager & lives system.',
    icon: '🗼',
    category: 'Adventure',
    previewColor: '#3B82F6',
    initialPrompt:
      'Build a tower defense game. Include: a winding enemy path with 12 waypoints through a grassy map, 5 enemy types (Walker, Runner, Tank, Flying, Boss) spawning in escalating waves, 6 tower types (Archer, Cannon, Ice, Poison, Lightning, Nuke) that players can place on designated grid tiles, a currency system that awards gold for kills and is spent on tower placement and upgrades, a 3-level upgrade tree per tower type, a lives counter (start with 20), a wave counter with countdown between waves (wave 1–30), and a game-over / victory screen. Write all server-side Luau scripts with tower targeting logic and pathfinding.',
  },
  {
    id: 'rpg',
    name: 'RPG',
    description: 'Quest system, NPCs, inventory, levelling & turn-less combat.',
    icon: '⚔️',
    category: 'Adventure',
    previewColor: '#B45309',
    initialPrompt:
      'Build an RPG game. Include: an open-world town map with 8 NPC characters that have dialogue trees, 5 main quests and 10 side quests with objectives tracked in a quest log GUI, a player stats system (HP, Attack, Defence, Speed, Level 1–50), an inventory GUI supporting up to 30 item slots with weapons, armour, and consumables, melee combat with sword swings and hitbox detection, 3 enemy types (Goblin, Orc, Dragon) with health bars, loot drops on death, experience gain and level-up notifications, and a DataStore save system for all player progress. Write all Luau scripts.',
  },
  {
    id: 'murder-mystery',
    name: 'Murder Mystery',
    description: 'Murderer, sheriff & innocents — hidden roles, knife & revolver.',
    icon: '🔪',
    category: 'Action',
    previewColor: '#DC2626',
    initialPrompt:
      'Build a Murder Mystery game in the style of MM2. Include: a lobby countdown and role assignment (1 Murderer, 1 Sheriff, rest Innocents), a map with multiple rooms and hiding spots, a knife tool for the Murderer with a throw mechanic, a revolver for the Sheriff that fires once (misses = gun drops), innocents who collect gold coins scattered around the map, a hero mechanic where an innocent who picks up a dropped gun becomes a temporary hero, round timer (3 minutes), a kill feed, win/lose screen with role reveals, and a lobby leaderboard showing wins by role. Write all server-authoritative Luau scripts.',
  },
  // ── Simulation ───────────────────────────────────────────────────────────────
  {
    id: 'cafe',
    name: 'Cafe / Restaurant',
    description: 'Order taking, cooking stations, serving & a tipping system.',
    icon: '☕',
    category: 'Simulation',
    previewColor: '#D97706',
    initialPrompt:
      'Build a cafe/restaurant roleplay game. Include: a front-of-house with 10 tables and chairs, a customer NPC system that spawns customers, seats them, and displays a speech-bubble order (from a menu of 8 items), a counter where staff players take orders, a back-of-house with 4 cooking stations (grill, fryer, espresso machine, blender) that require a timed interaction to prepare each item, a serving tray tool to carry up to 3 items, a tips system that awards coins on correct delivery, a manager role that can hire/fire players, and a cash-register total-earnings GUI. Write all Luau scripts.',
  },
  {
    id: 'pet-simulator',
    name: 'Pet Simulator',
    description: 'Egg hatching, rarity tiers, pet stats & a trading plaza.',
    icon: '🥚',
    category: 'Simulation',
    previewColor: '#EC4899',
    initialPrompt:
      'Build a pet simulator game. Include: a world with 5 zones (Starter Meadow, Forest, Desert, Ice Tundra, Volcano) each with a clickable resource object, 5 egg types per zone with different rarity weightings (Common 60%, Uncommon 25%, Rare 10%, Epic 4%, Legendary 1%), a hatching animation with spinning egg and rarity reveal, a pet stats system (power, speed, luck), a pet backpack holding up to 6 equipped pets that passively boost earnings, a trading plaza where players can exchange pets, a rebirth system to unlock new zones, and a hatch-counter leaderboard. Use DataStore v2 for persistence. Write all Luau scripts.',
  },
  {
    id: 'city-rp',
    name: 'City RP',
    description: 'Jobs, vehicles, money system, properties & police/criminal roles.',
    icon: '🏙️',
    category: 'Social',
    previewColor: '#0EA5E9',
    initialPrompt:
      'Build a city roleplay game. Include: a city map with residential, commercial, and industrial districts, 8 job roles (Police, Paramedic, Firefighter, Taxi Driver, Mechanic, Chef, Criminal, Mayor), a vehicle spawner at each job HQ with role-appropriate vehicles, a money system that pays players for completing job tasks, a property purchase system for owning houses and businesses, a crime system where Criminals can rob NPCs and Police can arrest them, handcuffs and a jail mechanic, a city hall where the Mayor can set tax rates, and a per-player DataStore saving money, job, and property ownership. Write all Luau scripts.',
  },
  // ── Creative ─────────────────────────────────────────────────────────────────
  {
    id: 'parkour',
    name: 'Parkour',
    description: 'Wall jumps, speed boosts, a timed leaderboard & custom movement.',
    icon: '🧗',
    category: 'Action',
    previewColor: '#10B981',
    initialPrompt:
      'Build a parkour game. Include: a rooftop city map with buildings of varied heights connected by gaps, ledges, and narrow paths, a custom movement system adding wall-running (max 1.5 seconds), double jump, and slide (Ctrl/Shift), 8 speed boost pads that grant +50% WalkSpeed for 3 seconds, a course timer that starts on first movement and stops at the finish flag, an all-time top-10 leaderboard using OrderedDataStore, a ghost replay system that shows the fastest run as a semi-transparent character, and a practice mode that disables the timer. Write all Luau scripts.',
  },
  {
    id: 'sandbox',
    name: 'Sandbox',
    description: 'Free-build tools, admin commands, a part palette & save/load.',
    icon: '🧱',
    category: 'Creative',
    previewColor: '#64748B',
    initialPrompt:
      'Build a sandbox free-build game. Include: a flat 1000×1000 stud baseplate, a build GUI with a part palette (Block, Sphere, Cylinder, Wedge, Union), material and colour pickers, a resize handle tool, an undo/redo stack (last 20 actions), a save-slot system that persists up to 5 builds per player via DataStore, a load screen to restore a saved build, admin commands typed in chat (/clear, /reset, /give [player] [tool], /kick, /ban), a grid-snap toggle (1/4/1 stud), and a build-share feature that outputs a build code string. Write all Luau scripts.',
  },
  {
    id: 'showcase',
    name: 'Showcase',
    description: 'Cinematic lighting, camera paths, animated effects & atmospheric mood.',
    icon: '✨',
    category: 'Creative',
    previewColor: '#8B5CF6',
    initialPrompt:
      'Build a cinematic showcase / art gallery game. Include: a sleek modern gallery building with large windows and polished marble floors, Future lighting mode with ShadowMap quality High and a warm golden sunlight angle, 8 exhibit pedestals with spotlights and animated floating objects (slow rotation), a camera path system that auto-moves the player camera along a 60-second tour using TweenService, particle effect emitters (sparkles, embers, ambient dust) in the main hall, atmospheric fog and a dynamic time-of-day cycle cycling over 5 minutes, a guest book GUI where players can leave a text comment, and background ambient music from Roblox\'s free audio library. Write all Luau scripts.',
  },
]

// ─── Helpers ───────────────────────────────────────────────────────────────────

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  'Popular',
  'Action',
  'Simulation',
  'Adventure',
  'Social',
  'Creative',
]

export function getTemplatesByCategory(category: TemplateCategory): GameTemplate[] {
  return GAME_TEMPLATES.filter((t) => t.category === category)
}

export function getPopularTemplates(): GameTemplate[] {
  return GAME_TEMPLATES.filter((t) => t.category === 'Popular')
}
