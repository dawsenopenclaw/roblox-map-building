/**
 * ForjeGames Game Template catalog.
 *
 * Exports every pre-authored game template plus a `loadTemplate(genre)` helper
 * that resolves a genre string (or template id) to a full GameTemplate object
 * ready for the plugin to execute.
 */

import type { GameTemplate, GameTemplateGenre } from './types'
import { tycoonTemplate } from './tycoon-template'
import { obbyTemplate } from './obby-template'
import { simulatorTemplate } from './simulator-template'
import { towerDefenseTemplate } from './tower-defense-template'
import { combatArenaTemplate } from './combat-arena-template'
import { racingTemplate } from './racing-template'
import { survivalTemplate } from './survival-template'
import { roleplayTemplate } from './roleplay-template'

export * from './types'
export {
  tycoonTemplate,
  obbyTemplate,
  simulatorTemplate,
  towerDefenseTemplate,
  combatArenaTemplate,
  racingTemplate,
  survivalTemplate,
  roleplayTemplate,
}

/** Full catalog of built-in game templates, in recommended display order. */
export const GAME_TEMPLATES: GameTemplate[] = [
  tycoonTemplate,
  obbyTemplate,
  simulatorTemplate,
  towerDefenseTemplate,
  combatArenaTemplate,
  racingTemplate,
  survivalTemplate,
  roleplayTemplate,
]

/** Map a genre or template id to a concrete template. */
export function loadTemplate(
  idOrGenre: GameTemplateGenre | string,
): GameTemplate | null {
  const hit = GAME_TEMPLATES.find(
    (t) => t.id === idOrGenre || t.genre === idOrGenre,
  )
  return hit ?? null
}

/** Lightweight catalog entry used by the marketplace list endpoint. */
export interface GameTemplateCatalogEntry {
  id: string
  name: string
  description: string
  genre: GameTemplateGenre
  estimatedBuildTime: string
  thumbnailPrompt: string
  partCount: number
  scriptCount: number
  uiTemplates: string[]
  mechanics: string[]
  priceCredits: number
}

export const TEMPLATE_LOAD_COST_CREDITS = 100

export function listTemplateCatalog(): GameTemplateCatalogEntry[] {
  return GAME_TEMPLATES.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    genre: t.genre,
    estimatedBuildTime: t.estimatedBuildTime,
    thumbnailPrompt: t.thumbnailPrompt,
    partCount: t.partCount,
    scriptCount: t.scriptCount,
    uiTemplates: t.uiTemplates,
    mechanics: t.mechanics,
    priceCredits: TEMPLATE_LOAD_COST_CREDITS,
  }))
}
