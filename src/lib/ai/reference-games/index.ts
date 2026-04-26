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

// Re-export all reference functions for direct access
export { getTycoonReference } from './tycoon-reference';
export { getSimulatorReference } from './simulator-reference';
export { getObbyReference } from './obby-reference';
export { getRPGReference } from './rpg-reference';

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
  'combat',
  'enemy',
  'boss fight',
  'stat system',
  'level up',
  'loot',
  'sword fight',
  'adventure',
  'xp system',
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

  return null;
}

/**
 * List all available reference game types.
 * Useful for the AI to suggest what's available.
 */
export function getAvailableReferenceTypes(): string[] {
  return ['tycoon', 'simulator', 'obby', 'rpg'];
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
  };

  return descriptions[type.toLowerCase()] ?? null;
}
