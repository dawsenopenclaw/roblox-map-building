/**
 * Specialist Agent Registry — 200 domain-expert AI personas.
 *
 * Split across two files for manageability:
 *   registry-part1.ts: Architecture, Interior, Vehicles, Nature, Game Mechanics (100)
 *   registry-part2.ts: Props, Styles, Themed Worlds, Lighting, Gameplay (100)
 *
 * The router in router.ts uses this combined list to pick the best specialist.
 */

export type { Specialist } from './types'

import { SPECIALISTS_PART1 } from './registry-part1'
import { SPECIALISTS_PART2 } from './registry-part2'

export const SPECIALISTS = [...SPECIALISTS_PART1, ...SPECIALISTS_PART2]
