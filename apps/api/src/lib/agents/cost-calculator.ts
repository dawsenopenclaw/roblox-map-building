/**
 * Cost calculator for agent operations.
 * Estimates token cost before execution and deducts after completion.
 *
 * Platform token rate: 1 token = $0.0001 (same as lib/ai/cost-estimator.ts)
 */

import type { IntentType } from './types'

// ---------------------------------------------------------------------------
// Per-operation cost table
// ---------------------------------------------------------------------------

/** Costs in platform tokens (1 token = $0.0001 USD) */
const OPERATION_COSTS: Record<IntentType, number> = {
  build_structure: 150,       // Claude structure plan + marketplace search
  modify_terrain: 200,        // Claude terrain layout + optional texture
  add_npc: 120,               // Claude behavior tree + dialogue generation
  generate_script: 100,       // Claude Luau code generation
  update_ui: 80,              // Claude UI layout plan
  add_audio: 50,              // Asset search, minimal Claude
  adjust_lighting: 60,        // Claude lighting suggestion
  configure_economy: 90,      // Claude economy balance
  create_quest: 110,          // Claude quest design + script
  add_combat: 130,            // Claude combat system design
  manage_inventory: 100,      // Claude inventory system
  add_vehicle: 120,           // Asset search + Claude config
  add_particle: 70,           // Claude particle effect
  add_animation: 80,          // Claude animation config
  configure_monetization: 90, // Claude monetization advice
  publish_game: 40,           // Validation only
  scan_dna: 60,               // Scan existing game
  search_marketplace: 30,     // Marketplace search only
  check_quality: 80,          // Performance + visual check
  unknown: 120,               // Default for unknown intents
}

export interface CostEstimate {
  intent: IntentType
  tokens: number
  usd: number
  breakdown: string
}

export interface OperationCostRecord {
  intent: IntentType
  estimated: number
  actual: number
  timestamp: string
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Estimate the token cost for an intent before execution.
 */
export function estimateIntentCost(intent: IntentType): CostEstimate {
  const tokens = OPERATION_COSTS[intent] ?? OPERATION_COSTS.unknown
  const usd = tokens * 0.0001

  return {
    intent,
    tokens,
    usd,
    breakdown: `${intent}: ~${tokens} tokens (≈ $${usd.toFixed(4)})`,
  }
}

/**
 * Calculate the actual cost from real token counts returned by Claude.
 * Claude token counts are in AI tokens (different from platform tokens).
 * Conversion: $3/million input + $15/million output for Sonnet.
 */
export function calculateActualCost(
  inputTokens: number,
  outputTokens: number,
  model: 'sonnet' | 'haiku' | 'opus' = 'sonnet'
): { usd: number; platformTokens: number } {
  const pricing = {
    sonnet: { inputPerM: 3.0, outputPerM: 15.0 },
    haiku: { inputPerM: 0.8, outputPerM: 4.0 },
    opus: { inputPerM: 15.0, outputPerM: 75.0 },
  }[model]

  const usd =
    (inputTokens / 1_000_000) * pricing.inputPerM +
    (outputTokens / 1_000_000) * pricing.outputPerM

  return {
    usd,
    platformTokens: Math.ceil(usd * 10_000),
  }
}

/**
 * Format a cost estimate for display in the chat UI.
 */
export function formatCostForDisplay(estimate: CostEstimate): string {
  return `This will cost approximately ${estimate.tokens} tokens (≈ $${estimate.usd.toFixed(4)})`
}

/**
 * Check whether a balance covers the estimated cost.
 */
export function hasEnoughBalance(balance: number, estimate: CostEstimate): boolean {
  return balance >= estimate.tokens
}

/**
 * Get the full cost table for display in settings/docs.
 */
export function getAllOperationCosts(): Array<{ intent: IntentType; tokens: number; usd: number }> {
  return (Object.entries(OPERATION_COSTS) as [IntentType, number][]).map(([intent, tokens]) => ({
    intent,
    tokens,
    usd: tokens * 0.0001,
  }))
}
