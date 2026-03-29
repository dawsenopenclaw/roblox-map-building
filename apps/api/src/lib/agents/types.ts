/**
 * Shared types for the AI agent orchestration system
 */

// ---------------------------------------------------------------------------
// Game context — current state passed into every agent call
// ---------------------------------------------------------------------------

export interface GameContext {
  /** Roblox game/place ID, if a game is loaded */
  gameId?: string
  /** Conversation / session identifier */
  conversationId: string
  /** Authenticated user */
  userId: string
  /** Objects built so far this session */
  sessionHistory: SessionEntry[]
  /** High-level description of the game (set by user or inferred) */
  gameDescription?: string
  /** Tags describing current game (genre, style, etc.) */
  gameTags?: string[]
  /** Approximate instance count (performance budget check) */
  instanceCount?: number
}

export interface SessionEntry {
  timestamp: string
  intent: string
  description: string
  commitHash?: string
}

// ---------------------------------------------------------------------------
// Intent — parsed from natural language
// ---------------------------------------------------------------------------

export type IntentType =
  | 'build_structure'
  | 'modify_terrain'
  | 'add_npc'
  | 'generate_script'
  | 'update_ui'
  | 'add_audio'
  | 'adjust_lighting'
  | 'configure_economy'
  | 'create_quest'
  | 'add_combat'
  | 'manage_inventory'
  | 'add_vehicle'
  | 'add_particle'
  | 'add_animation'
  | 'configure_monetization'
  | 'publish_game'
  | 'scan_dna'
  | 'search_marketplace'
  | 'check_quality'
  | 'unknown'

export interface ParsedIntent {
  intent: IntentType
  parameters: Record<string, unknown>
  /** 0–1 confidence score */
  confidence: number
  /** Human-readable label for the UI */
  label: string
  /** Suggested agents to invoke */
  agents: AgentType[]
  /** Whether parallel execution is safe */
  canParallelize: boolean
  /**
   * Expanded version of the user prompt with specific Roblox details filled in.
   * E.g. "build a castle" → detailed component list with materials, sizes, lighting.
   * Downstream agents should prefer this over the raw user input.
   */
  expandedPrompt?: string
}

// ---------------------------------------------------------------------------
// Agent commands and results
// ---------------------------------------------------------------------------

export type AgentType =
  | 'terrain'
  | 'building'
  | 'npc'
  | 'script'
  | 'quality'
  | 'cost'

export interface AgentCommand {
  /** Parsed intent string */
  intent: string
  /** Agent-specific parameters */
  parameters: Record<string, unknown>
  /** Full game context */
  context: GameContext
}

export interface GameChange {
  /** Type of object modified */
  type: 'terrain' | 'building' | 'npc' | 'script' | 'lighting' | 'audio' | 'ui' | 'other'
  /** Unique ID for the changed object */
  objectId?: string
  description: string
  /** Roblox position, if applicable */
  position?: { x: number; y: number; z: number }
  metadata?: Record<string, unknown>
}

export interface AgentResult {
  success: boolean
  /** Human-readable result shown in chat */
  message: string
  tokensUsed: number
  changes: GameChange[]
  /** Wall-clock ms */
  duration: number
  /** Agent that produced this result */
  agent: AgentType
  /** Additional data the UI can render */
  data?: Record<string, unknown>
  error?: string
}

// ---------------------------------------------------------------------------
// SSE streaming event types
// ---------------------------------------------------------------------------

export type StreamEventType =
  | 'intent_parsed'
  | 'cost_estimate'
  | 'agent_start'
  | 'agent_progress'
  | 'agent_complete'
  | 'agent_error'
  | 'orchestrator_complete'
  | 'error'

export interface StreamEvent {
  type: StreamEventType
  data: Record<string, unknown>
  timestamp: string
}
