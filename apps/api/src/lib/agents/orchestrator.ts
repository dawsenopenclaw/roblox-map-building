/**
 * Agent orchestrator — the brain of the chat system.
 *
 * Flow:
 *   userInput → parseIntent → estimateCost → route agents → execute (parallel where possible) → AgentResult
 *
 * Every agent call is isolated: one failing agent never breaks the others.
 */

import { parseIntent } from './intent-parser'
import { estimateIntentCost } from './cost-calculator'
import { getContext, recordAction, updateContext } from './context-manager'
import { runTerrainAgent } from './terrain'
import { runBuildingAgent } from './building'
import { runNpcAgent } from './npc'
import { runScriptAgent } from './script'
import { runQualityAgent } from './quality'
import type {
  AgentCommand,
  AgentResult,
  AgentType,
  GameChange,
  GameContext,
  ParsedIntent,
  StreamEvent,
  StreamEventType,
} from './types'

// ---------------------------------------------------------------------------
// Orchestration result
// ---------------------------------------------------------------------------

export interface OrchestrationResult {
  success: boolean
  message: string
  tokensUsed: number
  changes: GameChange[]
  duration: number
  intent: ParsedIntent
  agentResults: AgentResult[]
  costEstimate: { tokens: number; usd: number }
}

// ---------------------------------------------------------------------------
// Agent dispatch table
// ---------------------------------------------------------------------------

const AGENT_RUNNERS: Record<AgentType, (cmd: AgentCommand) => Promise<AgentResult>> = {
  terrain:  runTerrainAgent,
  building: runBuildingAgent,
  npc:      runNpcAgent,
  script:   runScriptAgent,
  quality:  runQualityAgent,
  cost:     async (cmd) => ({
    success: true,
    message: 'Cost check complete.',
    tokensUsed: 0,
    changes: [],
    duration: 0,
    agent: 'cost' as AgentType,
    data: { estimated: estimateIntentCost('unknown') },
  }),
}

// ---------------------------------------------------------------------------
// SSE helper
// ---------------------------------------------------------------------------

function makeEvent(type: StreamEventType, data: Record<string, unknown>): StreamEvent {
  return { type, data, timestamp: new Date().toISOString() }
}

// ---------------------------------------------------------------------------
// Main orchestrate function
// ---------------------------------------------------------------------------

/**
 * Orchestrate a user message end-to-end.
 *
 * @param userInput  — raw text from the chat UI
 * @param contextArg — pre-built GameContext (use getContext() from context-manager)
 * @param onEvent    — optional streaming callback, called for each step
 */
export async function orchestrate(
  userInput: string,
  contextArg: GameContext,
  onEvent?: (event: StreamEvent) => void
): Promise<OrchestrationResult> {
  const start = Date.now()

  // -------------------------------------------------------------------------
  // 1. Parse intent
  // -------------------------------------------------------------------------
  const contextSummary = contextArg.gameDescription
    ?? contextArg.gameTags?.join(', ')
    ?? undefined

  const intent = await parseIntent(userInput, contextSummary)

  onEvent?.(makeEvent('intent_parsed', {
    intent: intent.intent,
    label: intent.label,
    confidence: intent.confidence,
    agents: intent.agents,
  }))

  // -------------------------------------------------------------------------
  // 2. Cost estimate
  // -------------------------------------------------------------------------
  const costEstimate = estimateIntentCost(intent.intent)

  onEvent?.(makeEvent('cost_estimate', {
    tokens: costEstimate.tokens,
    usd: costEstimate.usd,
    breakdown: costEstimate.breakdown,
  }))

  // -------------------------------------------------------------------------
  // 3. Build commands for each required agent
  // -------------------------------------------------------------------------
  const command: AgentCommand = {
    intent: intent.intent,
    parameters: intent.parameters,
    context: contextArg,
  }

  // -------------------------------------------------------------------------
  // 4. Execute agents — parallel or sequential based on intent flag
  // -------------------------------------------------------------------------
  let agentResults: AgentResult[]

  if (intent.canParallelize && intent.agents.length > 1) {
    // Fire all agents in parallel, collect results with allSettled so one
    // failure doesn't abort the others
    onEvent?.(makeEvent('agent_start', { agents: intent.agents, mode: 'parallel' }))

    const settled = await Promise.allSettled(
      intent.agents.map(async (agentType) => {
        const runner = AGENT_RUNNERS[agentType]
        if (!runner) {
          return {
            success: false,
            message: `Unknown agent: ${agentType}`,
            tokensUsed: 0,
            changes: [],
            duration: 0,
            agent: agentType,
          } satisfies AgentResult
        }
        const result = await runner(command)
        onEvent?.(makeEvent('agent_complete', {
          agent: agentType,
          success: result.success,
          tokensUsed: result.tokensUsed,
          duration: result.duration,
          message: result.message,
        }))
        return result
      })
    )

    agentResults = settled.map((s, i) => {
      if (s.status === 'fulfilled') return s.value
      const agentType = intent.agents[i]
      onEvent?.(makeEvent('agent_error', { agent: agentType, error: String(s.reason) }))
      return {
        success: false,
        message: `Agent ${agentType} failed: ${String(s.reason)}`,
        tokensUsed: 0,
        changes: [],
        duration: 0,
        agent: agentType,
        error: String(s.reason),
      } satisfies AgentResult
    })
  } else {
    // Sequential execution
    agentResults = []
    for (const agentType of intent.agents) {
      onEvent?.(makeEvent('agent_start', { agent: agentType, mode: 'sequential' }))
      const runner = AGENT_RUNNERS[agentType]
      if (!runner) {
        const errorResult: AgentResult = {
          success: false,
          message: `Unknown agent: ${agentType}`,
          tokensUsed: 0,
          changes: [],
          duration: 0,
          agent: agentType,
        }
        agentResults.push(errorResult)
        onEvent?.(makeEvent('agent_error', { agent: agentType, error: 'unknown agent' }))
        continue
      }

      try {
        const result = await runner(command)
        agentResults.push(result)
        onEvent?.(makeEvent('agent_complete', {
          agent: agentType,
          success: result.success,
          tokensUsed: result.tokensUsed,
          duration: result.duration,
          message: result.message,
        }))
      } catch (err) {
        const errorResult: AgentResult = {
          success: false,
          message: `Agent ${agentType} threw: ${err instanceof Error ? err.message : String(err)}`,
          tokensUsed: 0,
          changes: [],
          duration: 0,
          agent: agentType,
          error: err instanceof Error ? err.message : String(err),
        }
        agentResults.push(errorResult)
        onEvent?.(makeEvent('agent_error', { agent: agentType, error: errorResult.error }))
      }
    }
  }

  // -------------------------------------------------------------------------
  // 5. Aggregate results
  // -------------------------------------------------------------------------
  const totalTokens = agentResults.reduce((sum, r) => sum + r.tokensUsed, 0)
  const allChanges = agentResults.flatMap((r) => r.changes)
  const successCount = agentResults.filter((r) => r.success).length
  const overallSuccess = successCount > 0

  // Build a composite message
  const messages = agentResults
    .filter((r) => r.message)
    .map((r) => r.message)

  const compositeMessage = messages.length === 1
    ? messages[0]
    : messages.map((m, i) => `[${intent.agents[i] ?? 'agent'}] ${m}`).join('\n')

  const duration = Date.now() - start

  // -------------------------------------------------------------------------
  // 6. Update context
  // -------------------------------------------------------------------------
  recordAction(contextArg.conversationId, {
    intent: intent.intent,
    description: compositeMessage.slice(0, 200),
  })

  if (allChanges.some((c) => c.type === 'building' || c.type === 'terrain' || c.type === 'npc')) {
    updateContext(contextArg.conversationId, {
      instanceCount: (contextArg.instanceCount ?? 0) + allChanges.length * 10,
    })
  }

  const result: OrchestrationResult = {
    success: overallSuccess,
    message: compositeMessage,
    tokensUsed: totalTokens,
    changes: allChanges,
    duration,
    intent,
    agentResults,
    costEstimate,
  }

  onEvent?.(makeEvent('orchestrator_complete', {
    success: overallSuccess,
    tokensUsed: totalTokens,
    changesCount: allChanges.length,
    duration,
    agentCount: agentResults.length,
    successCount,
  }))

  return result
}

/**
 * Convenience wrapper: build a GameContext from raw inputs and orchestrate.
 */
export async function orchestrateFromRaw(
  userInput: string,
  userId: string,
  conversationId: string,
  gameId?: string,
  onEvent?: (event: StreamEvent) => void
): Promise<OrchestrationResult> {
  const ctx = getContext(conversationId, userId, gameId)
  return orchestrate(userInput, ctx, onEvent)
}
