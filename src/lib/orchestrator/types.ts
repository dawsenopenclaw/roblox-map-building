/**
 * Full Game Orchestrator — shared types.
 *
 * These types are exported by `game-orchestrator.ts` and re-exported here so
 * that generator modules and the API route can import them without pulling
 * in the orchestrator's runtime dependencies.
 */

export type MechanicType =
  | 'currency'
  | 'inventory'
  | 'shop'
  | 'leaderboard'
  | 'datastore'
  | 'matchmaking'
  | 'combat'
  | 'collection'
  | 'crafting'
  | 'progression'
  | 'quest'
  | 'minigame'
  | 'tycoon-pad'
  | 'teleport'
  | 'devproduct'
  | 'gamepass'

export interface GameMechanic {
  id: string
  type: MechanicType
  name: string
  /** e.g. "ServerScriptService/Combat/CombatHandler.server.lua" */
  scriptPath: string
  /** The actual Luau code — must compile and run as-is. */
  luauCode: string
  /** Other mechanic ids this depends on (e.g. shop depends on currency). */
  dependencies: string[]
}

export interface GameUIScreen {
  id: string
  name: string
  /** Usually "PlayerGui" */
  parent: string
  luauCode: string
}

export interface GameDevProduct {
  name: string
  description: string
  price: number
  serverScript: string
}

export interface GameGamePass {
  name: string
  description: string
  price: number
  serverScript: string
}

export interface GameNPC {
  name: string
  position: number[]
  dialogue: string[]
}

export interface MeshIntent {
  description: string
  placement: string
}

export interface AudioIntent {
  type: 'music' | 'sfx' | 'voice'
  description: string
}

/**
 * Minimal theme shape the orchestrator + generators rely on. If the parallel
 * theme-detector agent ships a richer type later, this stays structurally
 * compatible (only the listed fields are required).
 */
export interface OrchestratorTheme {
  id: string
  name: string
  palette: {
    /** Hex, e.g. "#4169E1" */
    primary: string
    secondary: string
    accent: string
    background: string
    text: string
  }
  font: string
}

export const DEFAULT_THEME: OrchestratorTheme = {
  id: 'forge-gold',
  name: 'Forge Gold',
  palette: {
    primary: '#4169E1',
    secondary: '#7C3AED',
    accent: '#D4AF37',
    background: '#050810',
    text: '#FFFFFF',
  },
  font: 'GothamBold',
}

export interface GamePlan {
  concept: string
  genre: string
  coreLoop: string
  progression: string
  mechanics: Array<{ type: MechanicType; name: string; params?: Record<string, unknown> }>
  monetization: {
    devProducts: Array<{ name: string; price: number; description?: string }>
    gamePasses: Array<{ name: string; price: number; description?: string }>
  }
  ui: string[]
  npcs: Array<{ name: string; role: string; dialogue: string[]; position?: number[] }>
  playerFlow: string
  estimatedPlaytime: string
}

export interface GameOrchestrationResult {
  amplifiedPrompt: string
  themeId: string
  spatialPlanSummary: string
  structuredCommands: Array<Record<string, unknown>>
  mechanics: GameMechanic[]
  uiScreens: GameUIScreen[]
  npcs: GameNPC[]
  monetization: {
    devProducts: GameDevProduct[]
    gamePasses: GameGamePass[]
  }
  meshIntents: MeshIntent[]
  audioIntents: AudioIntent[]
  estimatedPlaytime: string
  totalPartCount: number
  totalScriptLines: number
  durationMs: number
  creditsUsed: number
  /** Full plan returned by the game architect stage — useful for debugging. */
  plan: GamePlan
}

export interface OrchestratorProgressEvent {
  stage:
    | 'planning'
    | 'amplifying'
    | 'theming'
    | 'spatial'
    | 'mechanics'
    | 'ui'
    | 'build'
    | 'assets'
    | 'queueing'
    | 'done'
    | 'error'
  message: string
  /** 0–100 */
  progress: number
  detail?: Record<string, unknown>
}

export type ProgressCallback = (event: OrchestratorProgressEvent) => void
