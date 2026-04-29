/**
 * Reference game registry.
 * Returns production-quality Luau code for detected game types.
 * Used by the AI chat pipeline to inject high-quality examples
 * when users request specific game genres.
 */

import { getTycoonReference } from './tycoon-reference';
import { getSimulatorReference } from './simulator-reference';
import { getObbyReference } from './obby-reference';
import { getRPGReference } from './rpg-reference';
import { getFightingReference } from './fighting-reference';
import { getSurvivalReference } from './survival-reference';
import { getSocialRoleplayReference } from './social-roleplay-reference';
import { getHorrorReference } from './horror-reference';

// Re-export all reference functions for direct access
export { getTycoonReference } from './tycoon-reference';
export { getSimulatorReference } from './simulator-reference';
export { getObbyReference } from './obby-reference';
export { getRPGReference } from './rpg-reference';
export { getFightingReference } from './fighting-reference';
export { getSurvivalReference } from './survival-reference';
export { getSocialRoleplayReference } from './social-roleplay-reference';
export { getHorrorReference } from './horror-reference';

// Keywords that map to each game type.
// Checked against the user's prompt (lowercased) to detect intent.
const TYCOON_KEYWORDS = [
  'tycoon',
  'factory',
  'dropper',
  'conveyor',
  'idle',
  'money maker',
  'cash grab',
  'business sim',
  'entrepreneur',
  'mining tycoon',
  'restaurant tycoon',
  'rebirth',
];

const SIMULATOR_KEYWORDS = [
  'simulator',
  'sim game',
  'pet sim',
  'clicking sim',
  'collection sim',
  'backpack',
  'collect and sell',
  'pet following',
  'magnet',
  'zone unlock',
  'clicking game',
  'clicker',
];

const OBBY_KEYWORDS = [
  'obby',
  'obstacle course',
  'parkour',
  'checkpoint',
  'speedrun',
  'kill brick',
  'moving platform',
  'jump course',
  'platformer',
];

const RPG_KEYWORDS = [
  'rpg',
  'role playing',
  'roleplay',
  'quest',
  'dungeon',
  'enemy',
  'boss fight',
  'stat system',
  'level up',
  'loot',
  'adventure',
  'xp system',
];

const SURVIVAL_KEYWORDS = [
  'survival',
  'survive',
  'crafting',
  'base building',
  'gather',
  'gathering',
  'hunger system',
  'thirst system',
  'resource node',
  'day night cycle',
  'day/night',
  'wood stone',
  'booga booga',
  'islands game',
  'build base',
  'raid',
  'raiding',
  'inventory weight',
  'tool durability',
  'smelt',
  'furnace',
  'camp fire',
  'campfire',
  'territory claim',
];

const SOCIAL_ROLEPLAY_KEYWORDS = [
  'roleplay',
  'rp',
  'brookhaven',
  'bloxburg',
  'town',
  'city life',
  'social',
  'house builder',
  'job',
  'career',
  'neighborhood',
  'driving',
  'vehicle',
  'hangout',
  'life sim',
  'berry avenue',
  'greenville',
  'city rp',
  'life roleplay',
  'housing',
  'buy a house',
  'pizza delivery',
  'police rp',
  'doctor',
  'mechanic',
  'farmer',
  'emote',
  'social game',
  'date',
];

const HORROR_KEYWORDS = [
  'horror',
  'scary',
  'creepy',
  'haunted',
  'monster',
  'escape room',
  'jumpscare',
  'survival horror',
  'fear',
  'dark atmosphere',
  'doors game',
  'mimic',
  'apeirophobia',
  'blair',
  'sanity',
  'flee the facility',
  'the mimic',
  'liminal',
  'backrooms',
  'killer',
  'entity',
  'anomaly',
];

const FIGHTING_KEYWORDS = [
  'fighting game',
  'pvp combat',
  'battlegrounds',
  'battle game',
  'combat game',
  'boxing',
  'sword fight',
  'martial arts',
  'arena pvp',
  'beat em up',
  '1v1',
  'combo system',
  'fighting',
  'brawl',
  'strongest battlegrounds',
  'blade ball',
  'combat warriors',
  'boxing game',
  'ranked pvp',
  'elo',
  'parry',
  'dodge roll',
  'm1 combo',
];

/**
 * Detect game type from a user prompt and return reference Luau code.
 * Returns null if no matching reference exists yet.
 *
 * @param type - Either an explicit game type string (e.g. "tycoon")
 *               or a user prompt to scan for keywords.
 */
export function getReferenceGame(type: string): string | null {
  const lower = type.toLowerCase().trim();

  // Direct type match first
  if (lower === 'tycoon') return getTycoonReference();
  if (lower === 'simulator') return getSimulatorReference();
  if (lower === 'obby') return getObbyReference();
  if (lower === 'rpg') return getRPGReference();
  if (lower === 'fighting') return getFightingReference();
  if (lower === 'survival') return getSurvivalReference();
  if (lower === 'social-roleplay' || lower === 'roleplay' || lower === 'rp') return getSocialRoleplayReference();
  if (lower === 'horror') return getHorrorReference();

  // Keyword scan for fuzzy matching against user prompts
  for (const keyword of TYCOON_KEYWORDS) {
    if (lower.includes(keyword)) return getTycoonReference();
  }

  for (const keyword of SIMULATOR_KEYWORDS) {
    if (lower.includes(keyword)) return getSimulatorReference();
  }

  for (const keyword of OBBY_KEYWORDS) {
    if (lower.includes(keyword)) return getObbyReference();
  }

  for (const keyword of RPG_KEYWORDS) {
    if (lower.includes(keyword)) return getRPGReference();
  }

  for (const keyword of FIGHTING_KEYWORDS) {
    if (lower.includes(keyword)) return getFightingReference();
  }

  for (const keyword of SURVIVAL_KEYWORDS) {
    if (lower.includes(keyword)) return getSurvivalReference();
  }

  for (const keyword of SOCIAL_ROLEPLAY_KEYWORDS) {
    if (lower.includes(keyword)) return getSocialRoleplayReference();
  }

  for (const keyword of HORROR_KEYWORDS) {
    if (lower.includes(keyword)) return getHorrorReference();
  }

  return null;
}

/**
 * List all available reference game types.
 * Useful for the AI to suggest what's available.
 */
export function getAvailableReferenceTypes(): string[] {
  return ['tycoon', 'simulator', 'obby', 'rpg', 'fighting', 'survival', 'social-roleplay', 'horror'];
}

/**
 * Get a brief description of what each reference contains.
 */
export function getReferenceDescription(type: string): string | null {
  const descriptions: Record<string, string> = {
    tycoon:
      'Complete tycoon with server-side economy, plot system, droppers, conveyors, collectors, upgrades, rebirth, DataStore saving, shop GUI, rate limiting, and type validation.',
    simulator:
      'Hub-based simulator with 3 collection zones, click-to-collect orbs, backpack capacity, sell pad, zone unlock gates, pet following system (AlignPosition), rebirth, DataStore saving.',
    obby:
      '20-stage obstacle course across 4 difficulty tiers (Easy/Medium/Hard/Extreme), 7 obstacle types (KillBrick, MovingPlatform, SpinningBeam, DisappearingBlock, ConveyorBelt, LaunchPad, WallJump), transparent checkpoints with DataStore persistence, speedrun timer with OrderedDataStore top-10 leaderboard, skip-stage DevProduct purchase, lobby with Play button, coin rewards per stage + completion bonus, full save/load with pcall + BindToClose.',
    rpg:
      'RPG with stat system (HP/ATK/DEF/XP/Level/Gold), combat with raycast melee + crits + damage numbers, 5-state quest FSM (kill/collect/talk/reach), branching NPC dialogue trees, equipment slots (Weapon/Armor/Accessory), shop buy/sell, enemy AI with PathfindingService (Idle/Chase/Attack/Return), boss fight with phase transitions + AoE + minion spawns, full DataStore persistence.',
    fighting:
      'Fighting/PvP game with M1 4-hit combo chain (startup/active/endlag frames), GetPartBoundsInBox hitboxes, knockback via LinearVelocity, hitstun system, heavy attack, grab/throw. Dash with i-frames, dodge, block (stamina drain), frame-perfect parry (stuns attacker), aerial combat + slam. 4 skill slots per class, energy bar, ultimate (100 energy), passive auto-heal. ELO K-factor ranking across Bronze→Grandmaster 7 tiers, matchmaking queue with range expansion, OrderedDataStore leaderboard, season resets. 3 classes (Brawler/Swordsman/Mage) with unique movesets unlocked by level. 3 arenas (flat/hazard/ring-out) with player voting. Server-authoritative network: rate limiting 10 req/s, speed anti-exploit, position history reconciliation.',
    survival:
      'Survival game modeled after Islands/Booga Booga with 6 full systems: (1) Resource gathering — 5-tier tool progression (Wooden→Diamond pickaxe/axe/sword), 6 node types (Tree/Rock/IronVein/GoldVein/DiamondVein/Bush) with HP bars, weight-based inventory, tool durability, damage numbers; (2) Crafting — 30+ recipes, station requirements (CraftingTable/Furnace/Sawmill/Campfire), recipe discovery by finding materials, server-side validation, crafting queue; (3) Base building — grid-snap placement, collision check, 8 structure types (WoodenWall→StoneWall→MetalWall, floors, doors, stairs, roof), structural HP, raiding damage, clan permission sharing, DataStore layout save/load; (4) Survival mechanics — hunger/thirst drain, temperature (campfire warmth radius, cold night/hot desert), day/night 10-min cycle with Lighting.ClockTime, health regen when fed, starvation/dehydration damage, 4 status effects (Poisoned/Burning/Freezing/Bleeding); (5) Enemy AI — 3 roaming enemies (Wolf/Zombie/Skeleton) + 3 bosses (SkeletonLord/ForestGolem/CaveKing) with PathfindingService 5-state FSM, aggro, phase transitions, minion spawns, loot drops, XP rewards, difficulty scaling by day count, night wave system; (6) Multiplayer — clan create/invite/leave, shared storage with deposit/withdraw, atomic item trading with confirmation, territory claiming with flag model + BillboardGui, PvP/safe zones, chat commands (/team /clancreate /invite /trade).',
    'social-roleplay':
      'Social/roleplay game modeled after Brookhaven RP, Welcome to Bloxburg, Berry Avenue, and Greenville with 6 full systems: (1) Job system — 7 jobs (Police/Firefighter/Doctor/Pizza Delivery/Teacher/Mechanic/Farmer) each with task loops, per-task pay, base pay timer, uniform equip, job giver NPCs, and max-player caps; (2) Housing system — 20 plots with claim system, grid-snapped furniture placement with ghost preview and rotation, DataStore serialize/load, house visiting, 4 upgrade styles (starter/suburban/mansion/apartment); (3) Vehicle system — 6 vehicle types including 3 emergency vehicles, VehicleSeat driving, fuel drain loop, car customization (color/spoiler/wheels), dealership purchase, garage; (4) Economy — EconomyModule (cash/bank/premium), per-task income, ATM deposit/withdraw/transfer, daily login bonus, DevProduct Robux purchases, item shop; (5) Social features — 12-emote wheel with proximity broadcast, friend interactions (wave/high-five/handshake/hug) with range validation, party system (create/invite/join/leave), phone messaging, job-title BillboardGui name tags; (6) Town infrastructure — day/night cycle (600s day), weather system (clear/rain/snow/fog) with Lighting tweens, ProximityPrompt doors with hinge tween, elevator system with TweenService floor movement, vending machines with speed boost, NPC civilians with PathfindingService patrol, traffic light cycle with Neon material states.',
    horror:
      'Horror game modeled after Doors, The Mimic, and Apeirophobia with monster AI, fear/sanity system, puzzle rooms, level progression, multiplayer, dynamic lighting, and spatial audio.',
  };

  return descriptions[type.toLowerCase()] ?? null;
}
