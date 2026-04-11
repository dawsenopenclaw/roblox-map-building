/**
 * Full Game Orchestrator — stub implementation.
 *
 * TODO(orchestrator): full implementation pending. This file exists so the
 * import graph resolves while the real pipeline is still being assembled in
 * parallel. The stub takes a high-level GamePlan + the 7 mechanic generators
 * and will eventually orchestrate them end-to-end (plan -> amplify -> theme
 * -> spatial layout -> mechanics -> UI -> build -> asset queue -> progress).
 *
 * For now: it returns an empty GameOrchestrationResult so callers that only
 * need a compile-time reference (e.g. feature-flag-gated code paths) don't
 * explode. Real callers should check the result shape and fall back to the
 * legacy single-mechanic path until this is finished.
 *
 * This module is intentionally runtime-light: it does NOT pull in
 * `server-only` or `@/lib/db`, so it is safe to import from shared modules.
 */

import type {
  GameOrchestrationResult,
  GamePlan,
  GameMechanic,
  OrchestratorTheme,
  ProgressCallback,
} from './types'
import { DEFAULT_THEME } from './types'

import { generateCurrencyMechanic } from '../mechanics/generators/currency'
import { generateInventoryMechanic } from '../mechanics/generators/inventory'
import { generateShopMechanic } from '../mechanics/generators/shop'
import { generateLeaderboardMechanic } from '../mechanics/generators/leaderboard'
import { generateDataStoreMechanic } from '../mechanics/generators/datastore'
import { generateCombatMechanic } from '../mechanics/generators/combat'
import { generateCollectionMechanic } from '../mechanics/generators/collection'

/**
 * Input spec for a full orchestrated game build. Today this is just a thin
 * wrapper around a GamePlan, but it will grow to include user / project /
 * quota context once the real implementation lands.
 */
export interface GameSpec {
  plan: GamePlan
  theme?: OrchestratorTheme
  projectId?: string
  userId?: string
  onProgress?: ProgressCallback
}

/**
 * Result of an orchestrated build. Alias of the canonical result shape for
 * call-site clarity.
 */
export type BuildResult = GameOrchestrationResult

/**
 * Map of mechanic-type -> generator factory. Exposed so callers (and tests)
 * can introspect which mechanic types the orchestrator currently knows how
 * to generate without having to import every generator individually.
 *
 * TODO(orchestrator): add matchmaking, crafting, progression, quest,
 * minigame, tycoon-pad, teleport, devproduct, gamepass generators here.
 */
export const MECHANIC_GENERATORS = {
  currency: generateCurrencyMechanic,
  inventory: generateInventoryMechanic,
  shop: generateShopMechanic,
  leaderboard: generateLeaderboardMechanic,
  datastore: generateDataStoreMechanic,
  combat: generateCombatMechanic,
  collection: generateCollectionMechanic,
} as const

/**
 * Orchestrate a full game build from a high-level spec.
 *
 * TODO(orchestrator): full implementation pending. For now this returns an
 * empty, well-typed result so that code referencing the orchestrator will
 * type-check and link, but will not produce a meaningful game.
 */
export async function orchestrateGameBuild(spec: GameSpec): Promise<BuildResult> {
  const started = Date.now()
  const theme = spec.theme ?? DEFAULT_THEME

  spec.onProgress?.({
    stage: 'planning',
    message: 'Orchestrator stub invoked — full pipeline not yet implemented.',
    progress: 0,
  })

  // TODO(orchestrator): run amplify -> theme -> spatial -> mechanics -> UI
  // -> build -> asset queue stages. For now, short-circuit with an empty
  // result so downstream callers see a valid shape.
  const mechanics: GameMechanic[] = []

  spec.onProgress?.({
    stage: 'done',
    message: 'Orchestrator stub returned empty build.',
    progress: 100,
  })

  const result: BuildResult = {
    amplifiedPrompt: spec.plan.concept ?? '',
    themeId: theme.id,
    spatialPlanSummary: '',
    structuredCommands: [],
    mechanics,
    uiScreens: [],
    npcs: [],
    monetization: {
      devProducts: [],
      gamePasses: [],
    },
    meshIntents: [],
    audioIntents: [],
    estimatedPlaytime: spec.plan.estimatedPlaytime ?? '',
    totalPartCount: 0,
    totalScriptLines: 0,
    durationMs: Date.now() - started,
    creditsUsed: 0,
    plan: spec.plan,
  }

  return result
}

export type { GameOrchestrationResult, GamePlan, OrchestratorTheme } from './types'
