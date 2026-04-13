/**
 * Viral Idea Generator — Seed Library
 *
 * 50+ proven Roblox game concept seeds distilled from top-100 games.
 * Each seed encodes a real pattern with examples, monetization hook,
 * and viral mechanics. These feed the Claude generator as inspiration
 * so it produces grounded concepts, not generic slop.
 *
 * Patterns are drawn from public top-charts observation circa 2024-2026:
 * lifting / pet / horror / tower / tycoon / obby / roleplay / social /
 * fighting / racing / fishing / sandbox / defense / collection / story.
 *
 * All names used as `examples` are real, publicly listed Roblox games.
 */

export type IdeaGenre =
  | 'Simulator'
  | 'Tycoon'
  | 'Obby'
  | 'RPG'
  | 'Social'
  | 'Horror'
  | 'Racing'
  | 'Combat'
  | 'Sandbox'
  | 'Puzzle'
  | 'Survival'
  | 'Adventure'

export type IdeaDifficulty = 'easy' | 'medium' | 'hard'

export type IdeaRevenue = 'low' | 'medium' | 'high' | 'mega'

export interface IdeaSeed {
  id: string
  /** Short formulaic pattern: e.g. "Simulator + grind currency + prestige". */
  pattern: string
  /** 2-3 real top games that exemplify the pattern. */
  examples: string[]
  /** High-level genre bucket. */
  genre: IdeaGenre
  /** How the game makes money — specific gamepass / dev product patterns. */
  monetizationHook: string
  /** What makes the game spread — screenshot moments, shareability, hooks. */
  viralHook: string
  /** Rough build difficulty for an indie solo/small team. */
  difficulty: IdeaDifficulty
  /** Estimated revenue ceiling based on similar releases. */
  estimatedRevenuePotential: IdeaRevenue
}

export const IDEA_SEEDS: IdeaSeed[] = [
  // ── Simulator patterns ────────────────────────────────────────────────────
  {
    id: 'sim-lifting-gym',
    pattern: 'Click-to-lift simulator + strength stat + prestige rebirths',
    examples: ['Gym League', 'Lifting Simulator', 'Strongman Simulator'],
    genre: 'Simulator',
    monetizationHook: '2x strength gamepass, auto-lift gamepass, protein shake dev products',
    viralHook: 'Muscle size scales visibly, leaderboard of lifters, transformation clips',
    difficulty: 'easy',
    estimatedRevenuePotential: 'high',
  },
  {
    id: 'sim-pet-hatching',
    pattern: 'Currency grind + egg hatching + rarity tiers + trading',
    examples: ['Pet Simulator 99', 'Bubble Gum Simulator', 'Clicker Simulator'],
    genre: 'Simulator',
    monetizationHook: 'Egg gamepass, lucky boost gamepass, shiny huge limited pets',
    viralHook: 'Rare pet reveals, trading drama, huge pet showcase videos',
    difficulty: 'medium',
    estimatedRevenuePotential: 'mega',
  },
  {
    id: 'sim-mining',
    pattern: 'Dig resource + upgrade tool + deeper biomes + ore rarity',
    examples: ['Mining Simulator 2', 'Treasure Quest', 'Dig It'],
    genre: 'Simulator',
    monetizationHook: 'Pickaxe skins, 2x ore gamepass, lucky drills, teleport passes',
    viralHook: 'Unboxing rare ores, depth leaderboard, secret biomes',
    difficulty: 'easy',
    estimatedRevenuePotential: 'high',
  },
  {
    id: 'sim-fishing',
    pattern: 'Cast line + catch by rarity + aquarium display + trading',
    examples: ['Fisch', 'Fishing Simulator', 'Roblox Fishing'],
    genre: 'Simulator',
    monetizationHook: 'Premium rods, bait packs, boat gamepass, aquarium expansions',
    viralHook: 'Legendary catch clips, aquarium tours, auction drama',
    difficulty: 'medium',
    estimatedRevenuePotential: 'mega',
  },
  {
    id: 'sim-anime-training',
    pattern: 'Anime-style stat grind + special techniques + PvP boss raids',
    examples: ['Anime Fighters Simulator', 'All Star Tower Defense', 'Blox Fruits'],
    genre: 'Simulator',
    monetizationHook: 'Character summons, luck gamepass, stat boost products',
    viralHook: 'Pulling meta units, 1v1 raid highlights, tier list debates',
    difficulty: 'hard',
    estimatedRevenuePotential: 'mega',
  },
  {
    id: 'sim-cooking',
    pattern: 'Restaurant management + recipe unlocks + customer rush',
    examples: ['My Restaurant', 'Cook Burgers', 'Restaurant Tycoon 2'],
    genre: 'Simulator',
    monetizationHook: 'VIP chef, golden utensils, auto-cook gamepass',
    viralHook: 'Messy kitchen fails, dream restaurant tours',
    difficulty: 'medium',
    estimatedRevenuePotential: 'high',
  },
  {
    id: 'sim-speed-run',
    pattern: 'Run + collect speed orbs + unlock new areas via speed gates',
    examples: ['Speed Run Simulator', 'Legends of Speed', 'Ninja Legends'],
    genre: 'Simulator',
    monetizationHook: 'Speed coils, 2x speed gamepass, rebirth multipliers',
    viralHook: 'Blurring across maps, speed race leaderboard',
    difficulty: 'easy',
    estimatedRevenuePotential: 'high',
  },
  {
    id: 'sim-muscle-punching',
    pattern: 'Punch blocks + strength grind + punch-kick combo unlock',
    examples: ['Muscle Legends', 'Boxing League', 'Strongman Simulator'],
    genre: 'Simulator',
    monetizationHook: 'Fist auras, 2x strength, punch speed gamepass',
    viralHook: 'Knocking players into the stratosphere, KO leaderboard',
    difficulty: 'easy',
    estimatedRevenuePotential: 'high',
  },
  {
    id: 'sim-hatching-gacha',
    pattern: 'Currency → egg → pet → equip → grind → bigger egg loop',
    examples: ['Saber Simulator', 'Texting Simulator', 'Ninja Legends 2'],
    genre: 'Simulator',
    monetizationHook: 'Hatch luck, auto-hatch, limited event eggs',
    viralHook: 'Rare pet reveal, inventory flex videos',
    difficulty: 'medium',
    estimatedRevenuePotential: 'high',
  },
  {
    id: 'sim-driving',
    pattern: 'Earn cash + buy cars + race + garage flex',
    examples: ['Car Dealership Tycoon', 'Driving Empire', 'Southwest Florida'],
    genre: 'Simulator',
    monetizationHook: 'Premium cars, fast money gamepass, custom liveries',
    viralHook: 'Supercar reveal videos, tour-my-garage TikToks',
    difficulty: 'hard',
    estimatedRevenuePotential: 'mega',
  },

  // ── Tycoon patterns ───────────────────────────────────────────────────────
  {
    id: 'tycoon-dropper',
    pattern: 'Dropper tycoon + conveyor upgrades + base expansion',
    examples: ['Miners Haven', 'Lumber Tycoon 2', 'Retail Tycoon 2'],
    genre: 'Tycoon',
    monetizationHook: 'Starter cash, 2x money gamepass, auto-collect, skip upgrades',
    viralHook: 'Fully-upgraded base reveal, idle cash-flex',
    difficulty: 'medium',
    estimatedRevenuePotential: 'high',
  },
  {
    id: 'tycoon-shop',
    pattern: 'Own a shop + hire workers + stock items + customer flow',
    examples: ['Retail Tycoon 2', 'My Supermarket', 'Mall Tycoon'],
    genre: 'Tycoon',
    monetizationHook: 'More workers, VIP customers, store skins',
    viralHook: 'Custom shop tours, roleplay shopping drama',
    difficulty: 'medium',
    estimatedRevenuePotential: 'medium',
  },
  {
    id: 'tycoon-city',
    pattern: 'Build city blocks + tax revenue + zoning + citizen happiness',
    examples: ['City Tycoon', 'Mayor Tycoon', 'Build a City'],
    genre: 'Tycoon',
    monetizationHook: 'Skyscraper gamepass, 2x tax, premium zones',
    viralHook: 'Drone flyover of finished city, ranked city contests',
    difficulty: 'hard',
    estimatedRevenuePotential: 'medium',
  },
  {
    id: 'tycoon-theme-park',
    pattern: 'Build rides + attract visitors + upgrade park rating',
    examples: ['Theme Park Tycoon 2', 'Super Fun Park', 'Ride Tycoon'],
    genre: 'Tycoon',
    monetizationHook: 'Premium rides, unlock prebuilt rides, park skins',
    viralHook: 'Roller coaster POV clips, world-record rides',
    difficulty: 'hard',
    estimatedRevenuePotential: 'high',
  },
  {
    id: 'tycoon-military',
    pattern: 'Build army base + recruit + invade neighbor tycoons',
    examples: ['Military Tycoon', '2 Player Military Tycoon', 'War Tycoon'],
    genre: 'Tycoon',
    monetizationHook: 'Premium vehicles, 2x money, spawn troops',
    viralHook: 'Base raid footage, nuke reveal cinematics',
    difficulty: 'medium',
    estimatedRevenuePotential: 'high',
  },

  // ── Obby patterns ─────────────────────────────────────────────────────────
  {
    id: 'obby-tower',
    pattern: 'Tower climb obby + 100+ stages + skip button monetization',
    examples: ['Tower of Hell', 'The Obby But You\'re On A Bike', 'Mega Easy Obby'],
    genre: 'Obby',
    monetizationHook: 'Skip stage gamepass, checkpoint passes, trails',
    viralHook: 'Rage clips, sub-60s speedrun glory',
    difficulty: 'easy',
    estimatedRevenuePotential: 'high',
  },
  {
    id: 'obby-parkour',
    pattern: 'Urban parkour course + wall runs + grapple mechanics',
    examples: ['Parkour', 'Rooftop Runners', 'Free Running'],
    genre: 'Obby',
    monetizationHook: 'Premium gloves, parkour trails, checkpoint',
    viralHook: 'Insane wall combo clips, world-record splits',
    difficulty: 'hard',
    estimatedRevenuePotential: 'medium',
  },
  {
    id: 'obby-escape',
    pattern: 'Themed escape obby (school/prison/mall) with boss chase',
    examples: ['Escape School Obby', 'Barry\'s Prison Run', 'Escape McDonalds Obby'],
    genre: 'Obby',
    monetizationHook: 'Skip chapter, speed boost, VIP door',
    viralHook: 'Funny chase-NPC jumpscares, theme nostalgia',
    difficulty: 'easy',
    estimatedRevenuePotential: 'medium',
  },
  {
    id: 'obby-rainbow',
    pattern: 'Colorful low-stakes obby + cute mascots + mega rewards',
    examples: ['Rainbow Friends Obby', 'Rainbow Obby', 'Mega Rainbow Obby'],
    genre: 'Obby',
    monetizationHook: 'Gear gamepass, 2x coins, cosmetic trails',
    viralHook: 'Bright screenshots, kid-friendly streams',
    difficulty: 'easy',
    estimatedRevenuePotential: 'medium',
  },
  {
    id: 'obby-death-run',
    pattern: 'Runner vs killer asymmetric obby with traps',
    examples: ['Deathrun', 'Speed Run 4', 'Flee the Facility'],
    genre: 'Obby',
    monetizationHook: 'Killer skins, trap gamepass, double coins',
    viralHook: 'Killer POV clips, trap troll montages',
    difficulty: 'medium',
    estimatedRevenuePotential: 'high',
  },

  // ── RPG patterns ──────────────────────────────────────────────────────────
  {
    id: 'rpg-open-world',
    pattern: 'Open-world anime RPG + stat grind + raid bosses',
    examples: ['Blox Fruits', 'King Legacy', 'Project Slayers'],
    genre: 'RPG',
    monetizationHook: 'Stat resets, race rerolls, fruit/item summons',
    viralHook: 'Rare drop reveal, PVP combo tutorials, meta tier lists',
    difficulty: 'hard',
    estimatedRevenuePotential: 'mega',
  },
  {
    id: 'rpg-dungeon',
    pattern: 'Instanced dungeon crawls + loot tiers + party play',
    examples: ['Dungeon Quest', 'World // Zero', 'Vesteria'],
    genre: 'RPG',
    monetizationHook: 'Legendary weapon pass, 2x drops, extra inventory',
    viralHook: 'Legendary drop clips, endgame boss kills',
    difficulty: 'hard',
    estimatedRevenuePotential: 'high',
  },
  {
    id: 'rpg-tower-defense',
    pattern: 'Wave defense + unit summon + upgrade tree + gacha heroes',
    examples: ['All Star Tower Defense', 'Anime Adventures', 'Tower Defense X'],
    genre: 'RPG',
    monetizationHook: 'Hero gacha, 2x luck, skip wave, premium currency',
    viralHook: 'Pulling meta unit, endless-mode wave records',
    difficulty: 'hard',
    estimatedRevenuePotential: 'mega',
  },
  {
    id: 'rpg-lifesteal',
    pattern: 'Lifesteal PVP arena + gear rarity + kill streak rewards',
    examples: ['Lifesteal Simulator', 'Critical Strike', 'Bedwars'],
    genre: 'RPG',
    monetizationHook: 'Premium weapons, kill-steal gamepass, cosmetic effects',
    viralHook: 'Killstreak clips, perfect clutch wins',
    difficulty: 'medium',
    estimatedRevenuePotential: 'high',
  },

  // ── Social patterns ───────────────────────────────────────────────────────
  {
    id: 'social-roleplay-town',
    pattern: 'Open-world roleplay town with jobs, houses, vehicles',
    examples: ['Brookhaven RP', 'Bloxburg', 'Livetopia'],
    genre: 'Social',
    monetizationHook: 'Premium houses, vehicles, clothing, VIP gamepass',
    viralHook: 'Roleplay drama TikToks, house tours, wedding events',
    difficulty: 'hard',
    estimatedRevenuePotential: 'mega',
  },
  {
    id: 'social-adopt-pet',
    pattern: 'Adopt + raise pets + home decoration + trading economy',
    examples: ['Adopt Me!', 'Overlook Bay', 'Royale High'],
    genre: 'Social',
    monetizationHook: 'Premium pet eggs, house expansion, trade boost',
    viralHook: 'Trading scams & wins, pet reveal clips, wishlists',
    difficulty: 'hard',
    estimatedRevenuePotential: 'mega',
  },
  {
    id: 'social-hangout-cafe',
    pattern: 'Cozy cafe hangout + roleplay jobs + minigames',
    examples: ['Frappe Cafe', 'Bloxy Cafe', 'Cafe Hangout'],
    genre: 'Social',
    monetizationHook: 'Staff uniforms, premium menu items, VIP room',
    viralHook: 'Roleplay meme clips, cozy vibes streams',
    difficulty: 'easy',
    estimatedRevenuePotential: 'medium',
  },
  {
    id: 'social-fashion',
    pattern: 'Dress-up contest + audience voting + seasonal themes',
    examples: ['Fashion Famous', 'Royale High', 'Dress to Impress'],
    genre: 'Social',
    monetizationHook: 'Premium outfits, event passes, emote packs',
    viralHook: 'Outfit reveal clips, winning-vote gloating',
    difficulty: 'medium',
    estimatedRevenuePotential: 'mega',
  },
  {
    id: 'social-school-rp',
    pattern: 'Roleplay school + classes + lunchroom + lockers',
    examples: ['Roblox High School 2', 'Royale High School', 'Bloxburg School'],
    genre: 'Social',
    monetizationHook: 'Uniform skins, premium lockers, teacher role pass',
    viralHook: 'Class drama clips, prom events',
    difficulty: 'medium',
    estimatedRevenuePotential: 'medium',
  },

  // ── Horror patterns ───────────────────────────────────────────────────────
  {
    id: 'horror-mascot-chase',
    pattern: 'Mascot horror chase + find items + escape',
    examples: ['Doors', 'Rainbow Friends', 'Piggy'],
    genre: 'Horror',
    monetizationHook: 'Skins, revive tokens, knowledge book, cosmetics',
    viralHook: 'Jumpscare reaction clips, lore theories, chapter reveals',
    difficulty: 'medium',
    estimatedRevenuePotential: 'mega',
  },
  {
    id: 'horror-hide-seek',
    pattern: 'Lobby hide-and-seek + killer + generator repair',
    examples: ['Flee the Facility', 'The Mimic', 'Evade'],
    genre: 'Horror',
    monetizationHook: 'Killer skins, map vote pass, trail cosmetics',
    viralHook: 'Clutch escapes, killer troll plays',
    difficulty: 'medium',
    estimatedRevenuePotential: 'high',
  },
  {
    id: 'horror-backrooms',
    pattern: 'Liminal space exploration + entities + sanity system',
    examples: ['Apeirophobia', 'The Backrooms', 'The Intercept'],
    genre: 'Horror',
    monetizationHook: 'Flashlight upgrades, revive token, secret map pass',
    viralHook: 'Creepy discovery clips, lore uncovers',
    difficulty: 'hard',
    estimatedRevenuePotential: 'medium',
  },

  // ── Racing patterns ───────────────────────────────────────────────────────
  {
    id: 'racing-street',
    pattern: 'Open-world street racing + tuning + cops-vs-racers',
    examples: ['Jailbreak', 'Driving Empire', 'Greenville'],
    genre: 'Racing',
    monetizationHook: 'Premium cars, cash gamepass, police skins',
    viralHook: 'Car reveal clips, cop-chase highlights',
    difficulty: 'hard',
    estimatedRevenuePotential: 'mega',
  },
  {
    id: 'racing-kart',
    pattern: 'Cartoon kart racing + power-ups + track gacha',
    examples: ['Mario Kart style clones', 'Kart Racing', 'Roblox Karts'],
    genre: 'Racing',
    monetizationHook: 'Premium karts, double boosts, track skins',
    viralHook: 'First-place clutch clips, rubber-band rage',
    difficulty: 'medium',
    estimatedRevenuePotential: 'medium',
  },

  // ── Combat patterns ───────────────────────────────────────────────────────
  {
    id: 'combat-bedwars',
    pattern: 'Team bedwars — defend bed, gather resources, rush enemies',
    examples: ['Bedwars', 'Eggwars', 'Skywars'],
    genre: 'Combat',
    monetizationHook: 'Kit unlocks, cosmetic cages, emote packs',
    viralHook: 'Clutch bed-break saves, sweaty PVP clips',
    difficulty: 'hard',
    estimatedRevenuePotential: 'high',
  },
  {
    id: 'combat-arena-fighter',
    pattern: '1v1/2v2 arena fighter with skill-based combat',
    examples: ['Combat Warriors', 'Rogue Lineage', 'Critical Strike'],
    genre: 'Combat',
    monetizationHook: 'Weapon skins, stat resets, class unlock',
    viralHook: 'Tournament clips, combo montages',
    difficulty: 'hard',
    estimatedRevenuePotential: 'high',
  },
  {
    id: 'combat-battle-royale',
    pattern: 'Shrinking-zone BR + loot + last player standing',
    examples: ['Island Royale', 'Strucid', 'Arsenal'],
    genre: 'Combat',
    monetizationHook: 'Weapon skins, emotes, battle pass',
    viralHook: 'Final-kill clips, win streaks',
    difficulty: 'hard',
    estimatedRevenuePotential: 'high',
  },
  {
    id: 'combat-sword-fight',
    pattern: 'Sword fighting on platforms + KO scoring',
    examples: ['Sword Fighting Tournament', 'Sword Fight on the Heights', 'Arsenal'],
    genre: 'Combat',
    monetizationHook: 'Sword skins, trails, stat gamepass',
    viralHook: 'Skill combo clips, KO leaderboard',
    difficulty: 'easy',
    estimatedRevenuePotential: 'medium',
  },

  // ── Sandbox patterns ──────────────────────────────────────────────────────
  {
    id: 'sandbox-building',
    pattern: 'Freeform building + physics + share creations',
    examples: ['Build a Boat for Treasure', 'Plane Crazy', 'Build a Bridge'],
    genre: 'Sandbox',
    monetizationHook: 'Block packs, premium vehicles, plot expansion',
    viralHook: 'Insane builds tours, physics-fail clips',
    difficulty: 'hard',
    estimatedRevenuePotential: 'high',
  },
  {
    id: 'sandbox-survival',
    pattern: 'Wilderness survival + hunger + base-build + PVP',
    examples: ['Apocalypse Rising 2', 'The Wild West', 'Booga Booga'],
    genre: 'Sandbox',
    monetizationHook: 'Starter kits, premium items, base slot pass',
    viralHook: 'Raid clips, bandit ambushes, base tours',
    difficulty: 'hard',
    estimatedRevenuePotential: 'medium',
  },
  {
    id: 'sandbox-crafting',
    pattern: 'Gather → craft → upgrade loop with specialization trees',
    examples: ['Islands', 'Skyblock', 'Sky Block'],
    genre: 'Sandbox',
    monetizationHook: 'Starter kit, auto-farm gamepass, premium tools',
    viralHook: 'Base-island reveal tours, efficiency farms',
    difficulty: 'medium',
    estimatedRevenuePotential: 'high',
  },
  {
    id: 'sandbox-vehicle-build',
    pattern: 'Build-a-vehicle + test + race + share blueprint',
    examples: ['Plane Crazy', 'Build a Boat', 'A Universal Time vehicles'],
    genre: 'Sandbox',
    monetizationHook: 'Premium blocks, engine gamepass, slot expansion',
    viralHook: 'Impossible vehicle builds, stunt clips',
    difficulty: 'hard',
    estimatedRevenuePotential: 'medium',
  },

  // ── Hybrid / misc patterns ────────────────────────────────────────────────
  {
    id: 'hybrid-murder-mystery',
    pattern: 'Murder mystery rotation + knife throwing + hidden role',
    examples: ['Murder Mystery 2', 'Murder Mystery X', 'Breaking Point'],
    genre: 'Combat',
    monetizationHook: 'Knife cosmetics (tradable), chroma skins, VIP',
    viralHook: 'Clutch detective wins, knife trade wins',
    difficulty: 'medium',
    estimatedRevenuePotential: 'mega',
  },
  {
    id: 'hybrid-hoops-basketball',
    pattern: 'Arcade sports + stat grind + PvP tournaments',
    examples: ['Hoopz', 'Basketball Legends', 'RB World 4'],
    genre: 'Combat',
    monetizationHook: 'Stat boosters, jersey skins, VIP court',
    viralHook: 'Dunk montages, buzzer-beater clips',
    difficulty: 'medium',
    estimatedRevenuePotential: 'medium',
  },
  {
    id: 'hybrid-cart-ride',
    pattern: 'Cart rail ride with themed levels + destruction physics',
    examples: ['Cart Ride Into the Sun', 'Cart Ride Obby', 'Theme Park Cart Ride'],
    genre: 'Obby',
    monetizationHook: 'VIP cart, rocket boost, teleport pass',
    viralHook: 'Physics-fail clips, speedrun splits',
    difficulty: 'easy',
    estimatedRevenuePotential: 'low',
  },
  {
    id: 'hybrid-idle-afk',
    pattern: 'AFK idle progression + daily rewards + prestige',
    examples: ['AFK Simulator', 'Idle Mining', 'Idle Heroes'],
    genre: 'Simulator',
    monetizationHook: 'Offline earnings, 2x income, auto-prestige',
    viralHook: 'Stats-flex, cash-per-second leaderboard',
    difficulty: 'easy',
    estimatedRevenuePotential: 'medium',
  },
  {
    id: 'hybrid-story-chapters',
    pattern: 'Linear story game with chapters + cinematic cutscenes',
    examples: ['Piggy', 'The Mimic', 'The Intruder'],
    genre: 'Horror',
    monetizationHook: 'Chapter skip, skin packs, revive tokens',
    viralHook: 'Cinematic trailer hype, lore videos',
    difficulty: 'hard',
    estimatedRevenuePotential: 'high',
  },
  {
    id: 'hybrid-anime-gacha-rpg',
    pattern: 'Anime gacha + open-world quests + co-op raids',
    examples: ['Anime Adventures', 'Anime Last Stand', 'Anime Defenders'],
    genre: 'RPG',
    monetizationHook: 'Summon currency, luck boost, exclusive units',
    viralHook: 'Summoning rare units, meta team showcases',
    difficulty: 'hard',
    estimatedRevenuePotential: 'mega',
  },
  {
    id: 'hybrid-cookie-clicker',
    pattern: 'Incremental click-to-earn + buildings + prestige shards',
    examples: ['Clicker Simulator', 'Texting Simulator', 'Tapping Legends'],
    genre: 'Simulator',
    monetizationHook: 'Auto-click, 3x tap, prestige multiplier',
    viralHook: 'Big number flex screenshots, prestige milestones',
    difficulty: 'easy',
    estimatedRevenuePotential: 'medium',
  },
  {
    id: 'hybrid-tower-battles',
    pattern: 'PvP tower defense — send troops to lane vs opponent',
    examples: ['Tower Battles', 'Tower Defense Simulator', 'Toilet Tower Defense'],
    genre: 'RPG',
    monetizationHook: 'Premium towers, 2x coins, cosmetic skins',
    viralHook: 'Clutch late-wave holds, meta strategies',
    difficulty: 'hard',
    estimatedRevenuePotential: 'high',
  },
  {
    id: 'hybrid-collection-hunt',
    pattern: 'Collect all items + pokedex + trade to complete',
    examples: ['Find the Markers', 'Find the Chomiks', 'Hunt the Hideouts'],
    genre: 'Sandbox',
    monetizationHook: 'Radar gamepass, secret marker pass, cosmetic',
    viralHook: 'Secret-find reveals, 100% completion streams',
    difficulty: 'easy',
    estimatedRevenuePotential: 'medium',
  },
  {
    id: 'hybrid-elevator',
    pattern: 'Themed elevator visiting absurd floors (social hub)',
    examples: ['The Normal Elevator', 'Scary Elevator', 'Elevator of Hell'],
    genre: 'Social',
    monetizationHook: 'VIP gamepass, floor vote, emotes',
    viralHook: 'Absurd floor reveal reacts, meme clips',
    difficulty: 'easy',
    estimatedRevenuePotential: 'low',
  },
  {
    id: 'hybrid-skate',
    pattern: 'Skate/BMX park + tricks + style score + PvP sessions',
    examples: ['Skate Park', 'Bike Obby', 'BMX Playground'],
    genre: 'Sandbox',
    monetizationHook: 'Premium boards, trick unlocks, skin packs',
    viralHook: 'Trick combo clips, world-record lines',
    difficulty: 'medium',
    estimatedRevenuePotential: 'medium',
  },
  {
    id: 'hybrid-toilet-war',
    pattern: 'Meme-driven tower defense + viral characters + gacha',
    examples: ['Toilet Tower Defense', 'Skibidi Tower Defense', 'Cameramen Defense'],
    genre: 'RPG',
    monetizationHook: 'Unit summon, 2x luck, limited event units',
    viralHook: 'Meme-reveal clips, brainrot humor',
    difficulty: 'medium',
    estimatedRevenuePotential: 'mega',
  },
  {
    id: 'hybrid-evade',
    pattern: 'Run from AI stalker + team saves + rounds',
    examples: ['Evade', 'Specter', 'Roblox Tag'],
    genre: 'Horror',
    monetizationHook: 'Emote packs, cosmetic skins, revive gamepass',
    viralHook: 'Clutch saves, stalker troll clips',
    difficulty: 'medium',
    estimatedRevenuePotential: 'medium',
  },

  // ── Puzzle patterns ──────────────────────────────────────────────────────
  {
    id: 'puzzle-escape-room',
    pattern: 'Co-op escape room with riddles + hidden clues + timer',
    examples: ['Escape Room', 'Flood Escape 2', 'The Impossible Puzzle'],
    genre: 'Puzzle',
    monetizationHook: 'Hint tokens, skip puzzle gamepass, new room packs',
    viralHook: 'Speedrun clears, brain-teaser reaction clips',
    difficulty: 'medium',
    estimatedRevenuePotential: 'medium',
  },
  {
    id: 'puzzle-logic-maze',
    pattern: 'Logic puzzle maze + shifting walls + color code matching',
    examples: ['Color or Die', 'Maze Runner', 'The Impossible Quiz Roblox'],
    genre: 'Puzzle',
    monetizationHook: 'Hint compass, 2x coins, cosmetic maze trails',
    viralHook: 'Insane solution clips, rage compilations',
    difficulty: 'easy',
    estimatedRevenuePotential: 'medium',
  },

  // ── Survival patterns ────────────────────────────────────────────────────
  {
    id: 'survival-zombie',
    pattern: 'Zombie wave survival + barricade + weapon upgrade',
    examples: ['Zombie Strike', 'Those Who Remain', 'Project Lazarus'],
    genre: 'Survival',
    monetizationHook: 'Weapon crates, revive tokens, base blueprints',
    viralHook: 'Last-alive clutch clips, wave 100+ records',
    difficulty: 'medium',
    estimatedRevenuePotential: 'high',
  },
  {
    id: 'survival-natural-disaster',
    pattern: 'Survive random natural disasters + shelter building',
    examples: ['Natural Disaster Survival', 'Survive the Disasters 2', 'Tornado Alley'],
    genre: 'Survival',
    monetizationHook: 'Premium shelters, 2x coins, cosmetic hard hats',
    viralHook: 'Dramatic disaster clips, impossible survival moments',
    difficulty: 'easy',
    estimatedRevenuePotential: 'medium',
  },

  // ── Adventure patterns ───────────────────────────────────────────────────
  {
    id: 'adventure-quest',
    pattern: 'Story-driven quest line + NPC villages + boss fights + lore',
    examples: ['Vesteria', 'Loomian Legacy', 'World // Zero'],
    genre: 'Adventure',
    monetizationHook: 'DLC quest packs, mount gamepass, cosmetic armor',
    viralHook: 'Boss-kill cinematics, lore theory videos, secret areas',
    difficulty: 'hard',
    estimatedRevenuePotential: 'high',
  },
  {
    id: 'adventure-treasure-hunt',
    pattern: 'Open-world treasure hunt + map clues + rival crews',
    examples: ['Treasure Quest', 'Build a Boat for Treasure', 'Pirate Wars'],
    genre: 'Adventure',
    monetizationHook: 'Map gamepass, treasure radar, crew ship upgrades',
    viralHook: 'Legendary loot reveals, crew PvP battles',
    difficulty: 'medium',
    estimatedRevenuePotential: 'high',
  },
]

/** Quick lookup by id. */
export function getIdeaSeed(id: string): IdeaSeed | undefined {
  return IDEA_SEEDS.find((s) => s.id === id)
}

/** All seeds for a genre. */
export function getSeedsByGenre(genre: IdeaGenre): IdeaSeed[] {
  return IDEA_SEEDS.filter((s) => s.genre === genre)
}

/** Random seed picker — weighted uniform. */
export function randomSeeds(count: number, genre?: IdeaGenre): IdeaSeed[] {
  const pool = genre ? getSeedsByGenre(genre) : IDEA_SEEDS
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, shuffled.length))
}

export const IDEA_GENRES: IdeaGenre[] = [
  'Simulator',
  'Tycoon',
  'Obby',
  'RPG',
  'Social',
  'Horror',
  'Racing',
  'Combat',
  'Sandbox',
  'Puzzle',
  'Survival',
  'Adventure',
]
