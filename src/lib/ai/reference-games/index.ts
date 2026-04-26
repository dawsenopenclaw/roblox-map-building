/**
 * Reference game registry.
 * Returns production-quality Luau code for detected game types.
 * Used by the AI chat pipeline to inject high-quality examples
 * when users request specific game genres.
 */

import { getTycoonReference } from './tycoon-reference';
import { simulatorReferenceCode } from './simulator-reference';
import { obbyReferenceCode } from './obby-reference';
import { rpgReferenceCode } from './rpg-reference';

// Re-export all reference functions for direct access
export { getTycoonReference } from './tycoon-reference';
export { simulatorReferenceCode } from './simulator-reference';
export { obbyReferenceCode } from './obby-reference';
export { rpgReferenceCode } from './rpg-reference';

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
  if (lower === 'simulator') return simulatorReferenceCode();
  if (lower === 'obby') return obbyReferenceCode();
  if (lower === 'rpg') return rpgReferenceCode();

  // Keyword scan for fuzzy matching against user prompts
  for (const keyword of TYCOON_KEYWORDS) {
    if (lower.includes(keyword)) return getTycoonReference();
  }

  for (const keyword of SIMULATOR_KEYWORDS) {
    if (lower.includes(keyword)) return simulatorReferenceCode();
  }

  for (const keyword of OBBY_KEYWORDS) {
    if (lower.includes(keyword)) return obbyReferenceCode();
  }

  for (const keyword of RPG_KEYWORDS) {
    if (lower.includes(keyword)) return rpgReferenceCode();
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
      'Obstacle course with 10 checkpoint stages (SpawnLocation), kill bricks, 2 TweenService moving platforms, speedrun timer (os.clock), win celebration particles, DataStore for best time + stage.',
    rpg:
      'RPG with stat system (HP/ATK/DEF/XP/Level), damage formula with variance, 3 enemy spawns with AI + health bars, 3-quest state machine, NPC dialogue, loot drops, DataStore saving.',
  };

  return descriptions[type.toLowerCase()] ?? null;
}
