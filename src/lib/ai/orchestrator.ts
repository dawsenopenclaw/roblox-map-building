/**
 * ForjeGames Multi-Agent Orchestrator
 *
 * Runs a sequence of agents for a given user prompt, passing each agent's
 * output into the next as shared context. Emits progress events so the
 * transport layer (HTTP SSE or WebSocket) can stream them to the UI.
 *
 * The pattern is: selectAgentsForPrompt() → for each agent: emit 'start' →
 * run → emit 'done'. The final agent in the chain is marked terminal so the
 * UI knows which output to show as the primary answer.
 *
 * Designed to be short — the heavy lifting lives in src/lib/ai/agents.ts.
 */

import 'server-only'
import {
  AGENTS,
  selectAgentsForPrompt,
  type AgentContext,
  type AgentName,
  type AgentResult,
  type DispatchPlan,
} from './agents'

// ---------------------------------------------------------------------------
// Progress event shape — emitted to the caller for streaming / logging
// ---------------------------------------------------------------------------

export type OrchestratorEvent =
  | { kind: 'dispatch'; plan: DispatchPlan }
  | { kind: 'agent-start'; agent: AgentName; position: number; total: number }
  | { kind: 'agent-done'; agent: AgentName; output: string; durationMs: number; position: number; total: number }
  | { kind: 'complete'; final: AgentResult; all: AgentResult[]; totalDurationMs: number }
  | { kind: 'error'; message: string }

export interface OrchestrateOptions {
  /** Forced agent list — overrides auto-selection. Handy for testing. */
  forceAgents?: AgentName[]
  /** Editor/session context passed to every agent. */
  sessionHint?: string
  /** Maximum time the entire chain can take, in ms. Defaults to 180s. */
  timeoutMs?: number
  /** Emitted for every step; the SSE route subscribes to this. */
  onEvent?: (ev: OrchestratorEvent) => void
}

export interface OrchestratorResult {
  plan: DispatchPlan
  steps: AgentResult[]
  final: AgentResult
  totalDurationMs: number
}

// ---------------------------------------------------------------------------
// Main entrypoint
// ---------------------------------------------------------------------------

export async function orchestrate(
  userPrompt: string,
  opts: OrchestrateOptions = {},
): Promise<OrchestratorResult> {
  const started = Date.now()
  const deadline = started + (opts.timeoutMs ?? 180_000)

  const plan: DispatchPlan = opts.forceAgents
    ? {
        agents: opts.forceAgents,
        reasoning: `Forced: ${opts.forceAgents.join(' → ')}`,
        classifiedIntent: 'general',
        confidence: 1,
      }
    : selectAgentsForPrompt(userPrompt)

  opts.onEvent?.({ kind: 'dispatch', plan })

  const steps: AgentResult[] = []
  let priorOutput = ''

  for (let i = 0; i < plan.agents.length; i++) {
    const agentName = plan.agents[i]
    const agentDef = AGENTS[agentName]
    if (!agentDef) {
      opts.onEvent?.({ kind: 'error', message: `Unknown agent "${agentName}" in dispatch plan` })
      continue
    }

    // Respect the global deadline — stop if we're out of time.
    if (Date.now() > deadline) {
      opts.onEvent?.({
        kind: 'error',
        message: `Chain exceeded ${opts.timeoutMs ?? 180_000}ms deadline — stopping after ${steps.length} of ${plan.agents.length} agents`,
      })
      break
    }

    opts.onEvent?.({
      kind: 'agent-start',
      agent: agentName,
      position: i,
      total: plan.agents.length,
    })

    const ctx: AgentContext = {
      userPrompt,
      sessionHint: opts.sessionHint,
      priorOutput,
      history: steps.map((s) => ({ agent: s.agent, output: s.output })),
    }

    const result = await agentDef.run(ctx)
    steps.push(result)
    priorOutput = result.output

    opts.onEvent?.({
      kind: 'agent-done',
      agent: agentName,
      output: result.output,
      durationMs: result.durationMs,
      position: i,
      total: plan.agents.length,
    })
  }

  // The final agent is marked terminal so the UI knows which output is "the answer".
  const finalStep = steps[steps.length - 1]
  if (finalStep) {
    finalStep.isTerminal = true
  }

  const totalDurationMs = Date.now() - started

  // Safe fallback: if nothing ran (e.g. empty plan, deadline blew early), emit
  // a synthetic error-step so the caller never sees undefined.
  const effectiveFinal: AgentResult =
    finalStep ?? {
      agent: plan.agents[0] ?? 'think',
      output: 'Orchestrator produced no output — check logs.',
      durationMs: totalDurationMs,
      isTerminal: true,
    }

  opts.onEvent?.({
    kind: 'complete',
    final: effectiveFinal,
    all: steps,
    totalDurationMs,
  })

  return {
    plan,
    steps,
    final: effectiveFinal,
    totalDurationMs,
  }
}

// ---------------------------------------------------------------------------
// Convenience: one-shot call that just returns the final text
// ---------------------------------------------------------------------------

export async function orchestrateToText(prompt: string, opts: OrchestrateOptions = {}): Promise<string> {
  const result = await orchestrate(prompt, opts)
  return result.final.output
}
