/**
 * Game Template type definitions.
 *
 * A GameTemplate is a pre-authored, production-quality game recipe composed of
 * structured commands (that the Creator Store plugin executes natively), server
 * scripts, UI template references, and monetization data. The ForjeGames AI
 * plugin loads one of these when the user prompts something like "tycoon game"
 * and drops a complete, playable experience into the place in seconds.
 */

import type { StructuredCommand } from '@/lib/ai/structured-commands'

export type GameTemplateGenre =
  | 'tycoon'
  | 'obby'
  | 'simulator'
  | 'tower-defense'
  | 'combat-arena'
  | 'racing'
  | 'survival'
  | 'roleplay'

export interface DevProduct {
  id: string
  name: string
  description: string
  priceRobux: number
}

export interface GamePass {
  id: string
  name: string
  description: string
  priceRobux: number
}

export interface ServerScript {
  name: string
  /** Where to parent the script inside the DataModel */
  parent: 'ServerScriptService' | 'Workspace' | 'ReplicatedStorage'
  source: string
}

export interface GameTemplate {
  id: string
  name: string
  description: string
  genre: GameTemplateGenre
  estimatedBuildTime: string
  thumbnailPrompt: string
  partCount: number
  scriptCount: number
  /** Commands the plugin will execute to spawn geometry / folders / instances. */
  structuredCommands: StructuredCommand[]
  /** Server scripts the plugin will create alongside the geometry. */
  serverScripts: ServerScript[]
  /** UI templates (ids) from @/lib/ui-kit that this template auto-installs. */
  uiTemplates: string[]
  /** Game-systems/mechanics generator references. */
  mechanics: string[]
  monetization: { devProducts: DevProduct[]; gamePasses: GamePass[] }
}

/** Total source-line count of all embedded Luau for telemetry / docs. */
export function countLuauLines(template: GameTemplate): number {
  return template.serverScripts.reduce(
    (acc, s) => acc + s.source.split('\n').length,
    0,
  )
}
