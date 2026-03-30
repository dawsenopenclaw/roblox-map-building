/**
 * Agent Orchestrator — routes user requests to the right agents, chains
 * outputs between agents, tracks costs, and supports a discovery mode.
 *
 * Design rules:
 *  - Lazy Anthropic client: created only when ANTHROPIC_API_KEY is present
 *  - Demo mode: all calls return mock data when no API key is set
 *  - All costs are charged via the existing spendTokens system
 *  - Chain depth is capped at 5 to prevent infinite loops
 */

import Anthropic from '@anthropic-ai/sdk'
import {
  getAgent,
  getAllAgents,
  estimateCallCost,
  resolveModelId,
  type AgentDef,
  type AgentCategory,
} from './registry'
import { spendTokens } from '@/lib/tokens-server'
import { recordApiUsage } from '@/lib/api-usage'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AgentCallOptions {
  userId: string
  agentId: string
  prompt: string
  /** Optional context from a previous agent in a chain */
  chainContext?: string
  /** If true, skip token deduction (used for cost-estimate previews) */
  dryRun?: boolean
}

export interface AgentCallResult {
  agentId: string
  agentName: string
  output: string
  tokensUsed: number
  costCharged: number
  durationMs: number
  isDemo: boolean
  chainedTo?: string[]
}

export interface ChainResult {
  steps: AgentCallResult[]
  totalCost: number
  totalTokens: number
  finalOutput: string
  durationMs: number
}

export interface AgentRecommendation {
  agentId: string
  agentName: string
  reason: string
  estimatedCost: number
  category: AgentCategory
}

export interface DiscoveryResult {
  recommendedAgents: AgentRecommendation[]
  suggestedChains: Array<{
    name: string
    agents: string[]
    estimatedCost: number
    description: string
  }>
  unusedCapabilities: string[]
  estimatedTimeMs: number
}

export interface AgentMetrics {
  agentId: string
  totalCalls: number
  totalCostCharged: number
  avgDurationMs: number
  successRate: number
  lastCalledAt: Date | null
}

// ─── In-process metrics store (resets on server restart) ─────────────────────
// Production would back this with Redis but this is zero-dep and safe to ship.

const _metricsStore = new Map<
  string,
  { calls: number; cost: number; durationSum: number; failures: number; lastCalledAt: Date | null }
>()

function bumpMetrics(agentId: string, cost: number, durationMs: number, success: boolean) {
  const existing = _metricsStore.get(agentId) ?? {
    calls: 0,
    cost: 0,
    durationSum: 0,
    failures: 0,
    lastCalledAt: null,
  }
  _metricsStore.set(agentId, {
    calls: existing.calls + 1,
    cost: existing.cost + cost,
    durationSum: existing.durationSum + durationMs,
    failures: existing.failures + (success ? 0 : 1),
    lastCalledAt: new Date(),
  })
}

export function getAgentMetrics(agentId?: string): AgentMetrics[] {
  const entries = agentId
    ? ([[agentId, _metricsStore.get(agentId)]] as [string, ReturnType<typeof _metricsStore.get>][])
    : [..._metricsStore.entries()]

  return entries
    .filter(([, v]) => v !== undefined)
    .map(([id, v]) => ({
      agentId: id,
      totalCalls: v!.calls,
      totalCostCharged: v!.cost,
      avgDurationMs: v!.calls > 0 ? Math.round(v!.durationSum / v!.calls) : 0,
      successRate: v!.calls > 0 ? 1 - v!.failures / v!.calls : 1,
      lastCalledAt: v!.lastCalledAt,
    }))
}

// ─── Lazy Anthropic client ────────────────────────────────────────────────────

let _anthropic: Anthropic | null = null

function getAnthropicClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null
  if (!_anthropic) {
    _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  return _anthropic
}

function isDemoMode(): boolean {
  return !process.env.ANTHROPIC_API_KEY || process.env.DEMO_MODE === 'true'
}

// ─── Demo output generator ────────────────────────────────────────────────────

const DEMO_OUTPUTS: Record<string, string> = {
  'terrain-gen': '-- [DEMO] Terrain script generated\nworkspace.Terrain:FillBlock(CFrame.new(0,0,0), Vector3.new(512,32,512), Enum.Material.Grass)',
  'city-builder': '-- [DEMO] City district placed: 12 buildings, road grid, 3 parks across 400x400 studs',
  'npc-creator': '-- [DEMO] NPC "Merchant" spawned with patrol AI, 3 dialogue lines, and shop integration',
  'script-writer': '-- [DEMO] Luau module generated with server/client split and RemoteEvent wiring',
  'ui-designer': '-- [DEMO] ScreenGui created: HUD with health bar, currency display, and minimap',
  'lighting-expert': '-- [DEMO] Lighting configured: Atmosphere density 0.3, Bloom enabled, SunRays active',
  'audio-placer': '-- [DEMO] 4 ambient zones placed with spatial Sound objects and volume falloff',
  'particle-fx': '-- [DEMO] ParticleEmitter "MagicTrail" added with 50 particles, 2s lifetime, cyan color',
  'vehicle-builder': '-- [DEMO] VehicleSeat-based kart built with BodyVelocity controller and drift mechanic',
  'weapon-smith': '-- [DEMO] Sword tool script: 1.5s cooldown, 20 damage, server-authoritative hitbox',
  'economy-designer': '-- [DEMO] Economy blueprint: 3 currencies, daily reward table, 5-item shop rotation',
  'quest-writer': '-- [DEMO] Quest chain "The Lost Artifact": 3 objectives, branching dialogue, reward table',
  'combat-system': '-- [DEMO] Combat module: server hitbox, combo chain, stun/knockback, anti-cheat guard',
  'mesh-generator': '[DEMO] Meshy prompt: "low-poly oak tree, 800 triangles, green canopy, brown bark, game asset"',
  'texture-artist': '[DEMO] Fal.ai prompt: "seamless stone brick texture, PBR, tileable 512px, medieval castle"',
  'game-dna-scanner': '[DEMO] Game DNA Report: Idle simulator loop, 3-currency economy, weekly event cadence, tycoon spawn mechanic',
  'performance-auditor': '[DEMO] Audit: 3 RunService.Heartbeat loops without task.wait(), part count 18,400 (safe), 1 memory leak in NPC cleanup',
  'code-reviewer': '[DEMO] Review: 2 unvalidated RemoteEvent handlers, 1 deprecated wait() call, 3 missing pcall wrappers',
  'security-checker': '[DEMO] Security: 1 exploitable remote handler (client supplies damage amount), 2 DataStore keys without sanitization',
  'accessibility-auditor': '[DEMO] A11y: 2 text labels below 14px minimum, 1 button without TextScaled, color contrast OK',
  'seo-optimizer': '[DEMO] SEO: Title optimized to 40 chars, added 5 trending genre tags, description rewritten for discovery keywords',
  'ux-analyzer': '[DEMO] UX: Tutorial drop-off at step 3 (too complex), first-session reward delayed 4 minutes (should be <60s)',
  'monetization-advisor': '[DEMO] Monetization: Add speed gamepass at spawn (impulse buy), bundle VIP + 2 gamepasses at 30% discount',
  'player-behavior': '[DEMO] Behavior: avg session 18min, 40% quit before first upgrade, power users play 3x/week',
  'competitor-scanner': '[DEMO] Competitors: Top 5 simulators all use pet-companion mechanic, none have base-building — gap identified',
  'prompt-optimizer': '[DEMO] Optimized prompt with domain-specific constraints and output format specification added',
  'cache-manager': '[DEMO] Cache analysis: 34% of agent calls are repeat prompts — recommended TTL 5 minutes saves ~120 tokens/day',
  'cost-reducer': '[DEMO] Cost reduction: 3 sonnet calls could downgrade to haiku, saving ~60 tokens per session',
  'bundle-optimizer': '[DEMO] Bundle: editor chunk 340KB (over 200KB target), suggest dynamic import for Monaco editor',
  'query-optimizer': '[DEMO] Queries: 2 N+1 patterns in marketplace listings, missing index on tokenTransaction.createdAt',
  'asset-compressor': '[DEMO] Assets: 4 textures at 1024px (should be 512px max for UI), audio at 320kbps (128kbps sufficient)',
  'load-balancer': '[DEMO] Server routing: TeleportService used correctly, MessagingService within 150-player cap',
  'cdn-optimizer': '[DEMO] CDN: 12 API routes missing Cache-Control headers, Vercel ISR not used on 3 static-ish pages',
  'trend-finder': '[DEMO] Trends: Fantasy RPG climbing 23% MoM, anime-themed simulators up 40%, horror genre seasonal peak in October',
  'marketplace-scout': '[DEMO] Marketplace results: 5 matching assets found — top: "Fantasy Castle Pack" (ID: 1234567) by Creator123 ★4.8',
  'tutorial-creator': '[DEMO] Tutorial written: "Building Your First NPC" — 8 steps, 3 code snippets, beginner-friendly',
  'doc-writer': '[DEMO] Documentation generated: JSDoc for 12 functions, README with install, API reference table',
  'changelog-generator': '[DEMO] Changelog v1.3.0: Added terrain generation, Fixed NPC patrol edge case, Improved token cost estimation',
  'feedback-analyzer': '[DEMO] Feedback summary: 68% positive, top request: "mobile controls", top complaint: "tutorial too long"',
  'feature-predictor': '[DEMO] Roadmap: 1) Mobile controls (90% ROI), 2) Pet companion system (85% ROI), 3) Guild system (70% ROI)',
  'llc-connector': '[DEMO] LLC sync: 12 virtual properties mapped, 3 business simulations linked, economy data synced',
  'stripe-manager': '[DEMO] Stripe: subscription upgrade processed, proration calculated, webhook verified',
  'team-provisioner': '[DEMO] Team workspace provisioned: 3 members invited, roles assigned, 5000 shared tokens allocated',
  'white-label-builder': '[DEMO] White-label build: custom branding applied, isolated environment created, API keys scoped',
  'partner-api': '[DEMO] Partner API designed: 8 endpoints, OpenAPI spec generated, webhook events documented',
  'referral-engine': '[DEMO] Referral program: 500-token reward both sides, 20% viral coefficient, fraud rate 0.3%',
  'email-campaigner': '[DEMO] Email sequence: 5-step onboarding drip, open rate target 45%, unsubscribe link included',
  'social-poster': '[DEMO] Social copy written for Twitter, Discord, and TikTok with platform-specific hooks',
  'community-manager': '[DEMO] Community update drafted: patch notes v1.2, weekend event announcement, tone 8-16 appropriate',
  'onboarding-optimizer': '[DEMO] Onboarding redesign: reduced steps 8→5, moved first reward to step 2, expected completion +35%',
}

function getDemoOutput(agentId: string, prompt: string): string {
  const base = DEMO_OUTPUTS[agentId] ?? `[DEMO] ${agentId} processed: "${prompt.slice(0, 60)}..."`
  return base
}

// ─── Router ───────────────────────────────────────────────────────────────────

/**
 * Scores each agent against a user prompt by counting keyword matches.
 * Returns agents sorted by descending score (only those with score > 0).
 */
export function scoreAgentsForPrompt(prompt: string, limit = 5): Array<AgentDef & { score: number }> {
  const lower = prompt.toLowerCase()
  const scored = getAllAgents()
    .map((agent) => {
      const score = agent.capabilities.reduce(
        (acc, kw) => acc + (lower.includes(kw.toLowerCase()) ? 1 : 0),
        0
      )
      return { ...agent, score }
    })
    .filter((a) => a.score > 0)
    .sort((a, b) => b.score - a.score)

  return scored.slice(0, limit)
}

/**
 * Returns recommendations for a given user prompt without making any API calls.
 * Safe to call from the estimate endpoints.
 */
export function recommendAgents(prompt: string): AgentRecommendation[] {
  return scoreAgentsForPrompt(prompt, 5).map((a) => ({
    agentId: a.id,
    agentName: a.name,
    reason: `Matched ${a.score} capability keyword${a.score !== 1 ? 's' : ''} in your prompt`,
    estimatedCost: estimateCallCost(a, prompt.length),
    category: a.category,
  }))
}

// ─── Core call ────────────────────────────────────────────────────────────────

/**
 * Calls a single agent. Handles demo mode, token deduction, and metrics.
 */
export async function callAgent(options: AgentCallOptions): Promise<AgentCallResult> {
  const { userId, agentId, prompt, chainContext, dryRun = false } = options
  const start = Date.now()

  const agentDef = getAgent(agentId)
  if (!agentDef) {
    throw new Error(`Unknown agent: ${agentId}`)
  }

  const fullPrompt = chainContext
    ? `Context from previous step:\n${chainContext}\n\nUser request:\n${prompt}`
    : prompt

  const estimatedCost = estimateCallCost(agentDef, fullPrompt.length)

  // ── Demo mode path ────────────────────────────────────────────────────────
  if (isDemoMode()) {
    const durationMs = Date.now() - start + 50 // simulate minimal latency
    const output = getDemoOutput(agentId, prompt)
    if (!dryRun) {
      bumpMetrics(agentId, estimatedCost, durationMs, true)
    }
    return {
      agentId,
      agentName: agentDef.name,
      output,
      tokensUsed: estimatedCost,
      costCharged: dryRun ? 0 : estimatedCost,
      durationMs,
      isDemo: true,
      chainedTo: agentDef.defaultChain,
    }
  }

  // ── Real path ─────────────────────────────────────────────────────────────
  const client = getAnthropicClient()
  if (!client) {
    throw new Error('Anthropic API key not configured')
  }

  // Deduct tokens before the call to prevent overdraft races
  if (!dryRun) {
    await spendTokens(userId, estimatedCost, `agent:${agentId}`, {
      agentId,
      promptChars: fullPrompt.length,
    })
  }

  let output = ''
  let actualInputTokens = 0
  let actualOutputTokens = 0
  let success = true

  try {
    const systemPrompt = buildSystemPrompt(agentDef)
    const modelId = resolveModelId(agentDef.model)

    const message = await client.messages.create({
      model: modelId,
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: fullPrompt }],
    })

    output =
      message.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map((b) => b.text)
        .join('\n') || ''

    actualInputTokens = message.usage.input_tokens
    actualOutputTokens = message.usage.output_tokens
  } catch (err) {
    success = false
    output = `Error: ${err instanceof Error ? err.message : 'Unknown error calling agent'}`
    // Refund tokens on failure — best-effort, non-blocking
    if (!dryRun) {
      try {
        const { earnTokens } = await import('@/lib/tokens-server')
        await earnTokens(userId, estimatedCost, 'REFUND', `agent:${agentId} failure refund`)
      } catch {
        // Swallow — metrics will capture the failure
      }
    }
  }

  const durationMs = Date.now() - start
  const totalTokens = actualInputTokens + actualOutputTokens

  // Record usage
  if (!dryRun) {
    bumpMetrics(agentId, estimatedCost, durationMs, success)
    recordApiUsage({
      userId,
      provider: 'claude',
      operation: `agent:${agentId}`,
      tokensUsed: totalTokens,
      costUsd: (totalTokens / 1_000_000) * 3.0, // sonnet pricing approx
      durationMs,
      success,
      metadata: { agentId, model: agentDef.model },
    }).catch(() => undefined) // non-blocking
  }

  return {
    agentId,
    agentName: agentDef.name,
    output,
    tokensUsed: totalTokens || estimatedCost,
    costCharged: dryRun ? 0 : estimatedCost,
    durationMs,
    isDemo: false,
    chainedTo: success ? agentDef.defaultChain : [],
  }
}

// ─── Chain runner ─────────────────────────────────────────────────────────────

/**
 * Runs a sequence of agents where each agent receives the output of the previous
 * as its chain context. Caps depth at 5 to prevent runaway chains.
 */
export async function runChain(
  userId: string,
  agentIds: string[],
  initialPrompt: string,
  dryRun = false
): Promise<ChainResult> {
  const MAX_DEPTH = 5
  const ids = agentIds.slice(0, MAX_DEPTH)
  const steps: AgentCallResult[] = []
  const chainStart = Date.now()

  let carryContext: string | undefined
  let lastOutput = ''

  for (const agentId of ids) {
    const result = await callAgent({
      userId,
      agentId,
      prompt: initialPrompt,
      chainContext: carryContext,
      dryRun,
    })
    steps.push(result)
    lastOutput = result.output
    carryContext = result.output
  }

  const totalCost = steps.reduce((acc, s) => acc + s.costCharged, 0)
  const totalTokens = steps.reduce((acc, s) => acc + s.tokensUsed, 0)

  return {
    steps,
    totalCost,
    totalTokens,
    finalOutput: lastOutput,
    durationMs: Date.now() - chainStart,
  }
}

/**
 * Auto-routes a prompt to the best matching agent(s) and optionally chains
 * into their defaultChain agents.
 *
 * @param followChain - If true, automatically runs the winning agent's defaultChain
 */
export async function autoRoute(
  userId: string,
  prompt: string,
  options: { followChain?: boolean; dryRun?: boolean; maxAgents?: number } = {}
): Promise<ChainResult> {
  const { followChain = false, dryRun = false, maxAgents = 1 } = options

  const candidates = scoreAgentsForPrompt(prompt, maxAgents)
  if (candidates.length === 0) {
    // Fallback to script-writer for anything unrecognised
    candidates.push({ ...getAgent('script-writer')!, score: 0 })
  }

  const primaryIds = candidates.map((c) => c.id).slice(0, maxAgents)

  let chainIds = primaryIds
  if (followChain && candidates[0]?.defaultChain?.length) {
    chainIds = [...primaryIds, ...candidates[0].defaultChain].slice(0, 5)
  }

  return runChain(userId, chainIds, prompt, dryRun)
}

// ─── Discovery mode ───────────────────────────────────────────────────────────

/**
 * Analyzes the current metrics store to suggest improvements.
 * Returns unused agents, suggested chains, and growth opportunities.
 */
export function discoverOpportunities(prompt?: string): DiscoveryResult {
  const allAgents = getAllAgents()
  const calledIds = new Set([..._metricsStore.keys()])

  const unusedAgents = allAgents
    .filter((a) => !calledIds.has(a.id))
    .map((a) => a.id)

  // Build chain suggestions from registry defaultChains
  const suggestedChains = [
    {
      name: 'Full World Build',
      agents: ['terrain-gen', 'city-builder', 'npc-creator', 'lighting-expert', 'audio-placer'],
      estimatedCost: 0,
      description: 'Complete world from scratch: terrain to populated city with ambience',
    },
    {
      name: 'Game System',
      agents: ['economy-designer', 'quest-writer', 'script-writer', 'code-reviewer'],
      estimatedCost: 0,
      description: 'Full gameplay loop: economy balanced, quests written, scripts reviewed',
    },
    {
      name: 'Competitor Analysis to Build',
      agents: ['competitor-scanner', 'game-dna-scanner', 'feature-predictor'],
      estimatedCost: 0,
      description: 'Scan competitors, extract DNA, predict highest-ROI features',
    },
    {
      name: 'Security Hardening',
      agents: ['code-reviewer', 'security-checker', 'performance-auditor'],
      estimatedCost: 0,
      description: 'Full audit: code quality, security, and performance',
    },
    {
      name: 'Growth Sprint',
      agents: ['feedback-analyzer', 'ux-analyzer', 'onboarding-optimizer', 'email-campaigner'],
      estimatedCost: 0,
      description: 'Analyze feedback, improve UX, optimize onboarding, launch re-engagement',
    },
  ].map((chain) => ({
    ...chain,
    estimatedCost: chain.agents.reduce((acc, id) => {
      const def = getAgent(id)
      return acc + (def ? estimateCallCost(def, 200) : 0)
    }, 0),
  }))

  // Prompt-specific recommendations
  const recommendedAgents: AgentRecommendation[] = prompt
    ? recommendAgents(prompt)
    : allAgents.slice(0, 5).map((a) => ({
        agentId: a.id,
        agentName: a.name,
        reason: 'Suggested based on typical workflow patterns',
        estimatedCost: estimateCallCost(a, 200),
        category: a.category,
      }))

  return {
    recommendedAgents,
    suggestedChains,
    unusedCapabilities: unusedAgents,
    estimatedTimeMs: recommendedAgents.reduce((acc) => acc + 2500, 0),
  }
}

// ─── System prompt builder ────────────────────────────────────────────────────

function buildSystemPrompt(agent: AgentDef): string {
  return `You are ${agent.name}, a specialized AI agent in the ForjeGames platform.

${agent.description}

Your output rules:
- Be specific: include exact numbers, stud dimensions, token costs, or file names where relevant
- For Luau code: use triple backtick \`\`\`luau fences, follow server-authority pattern, never trust client arguments
- For analysis: use structured output — numbered lists, tables, clear recommendations
- Keep responses dense with value — no filler, no padding
- End with a concrete "Next step:" recommendation when applicable

Constraints:
- Only output what the user asked for — do not pad with explanations of what you're about to do
- Platform: Roblox Studio, target audience 8-16, mobile-first
- Security: all DataStore calls wrapped in pcall, all RemoteEvent handlers validate server-side`
}
