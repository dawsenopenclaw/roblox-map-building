/**
 * Reference game registry.
 * Returns production-quality Luau code for detected game types.
 * Used by the AI chat pipeline to inject high-quality examples
 * when users request specific game genres.
 */

import { getTycoonReference } from './tycoon-reference';

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
  if (lower === 'tycoon') {
    return getTycoonReference();
  }

  // Keyword scan for fuzzy matching against user prompts
  for (const keyword of TYCOON_KEYWORDS) {
    if (lower.includes(keyword)) {
      return getTycoonReference();
    }
  }

  // Future references will be added here:
  // if (matchesObby(lower)) return getObbyReference();
  // if (matchesRPG(lower)) return getRPGReference();
  // if (matchesHorror(lower)) return getHorrorReference();
  // if (matchesBattleRoyale(lower)) return getBattleRoyaleReference();

  return null;
}

/**
 * List all available reference game types.
 * Useful for the AI to suggest what's available.
 */
export function getAvailableReferenceTypes(): string[] {
  return ['tycoon'];
}

/**
 * Get a brief description of what each reference contains.
 */
export function getReferenceDescription(type: string): string | null {
  const descriptions: Record<string, string> = {
    tycoon:
      'Complete tycoon with server-side economy, plot system, droppers, conveyors, collectors, upgrades, rebirth, DataStore saving, shop GUI, rate limiting, and type validation.',
  };

  return descriptions[type.toLowerCase()] ?? null;
}
