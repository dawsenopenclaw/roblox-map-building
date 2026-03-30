/**
 * GET /api/agents/discover
 *
 * Analyzes usage patterns and returns:
 *  - Recommended agents for the current session context
 *  - Suggested agent chains to accomplish common workflows
 *  - Unused capabilities the user hasn't tried yet
 *  - New agent type suggestions based on unmatched requests
 *  - Growth opportunities (usage gaps vs peers on same tier)
 *
 * No body required. All data is derived from in-process metrics and
 * the static registry — no external API calls.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { getAllAgents, getAgent } from '@/lib/agents/registry'
import { discoverOpportunities, getAgentMetrics } from '@/lib/agents/orchestrator'
import {
  getImprovementMetrics,
  suggestNewAgentTypes,
  generateImprovedSystemPrompt,
} from '@/lib/agents/self-improve'

// ─── Auth helper ──────────────────────────────────────────────────────────────

async function requireUser() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return null

  const raw = await db.user.findUnique({
    where: { clerkId },
    select: { id: true, subscription: { select: { tier: true } } },
  })
  if (!raw) return null

  return {
    clerkId,
    dbUser: { id: raw.id, subscriptionTier: raw.subscription?.tier ?? 'FREE' },
  }
}

// ─── GET /api/agents/discover ─────────────────────────────────────────────────

export async function GET(req: NextRequest): Promise<NextResponse> {
  const user = await requireUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const prompt = searchParams.get('prompt')?.trim() ?? undefined

  // ── Core discovery ────────────────────────────────────────────────────────
  const discovery = discoverOpportunities(prompt)

  // ── Self-improvement metrics ──────────────────────────────────────────────
  const improvementMetrics = getImprovementMetrics()

  // ── New agent type suggestions ────────────────────────────────────────────
  const newAgentSuggestions = suggestNewAgentTypes()

  // ── Usage pattern analysis ────────────────────────────────────────────────
  const allMetrics = getAgentMetrics()
  const calledAgentIds = new Set(allMetrics.map((m) => m.agentId))

  const TIER_ORDER: Record<string, number> = { FREE: 0, HOBBY: 1, CREATOR: 2, STUDIO: 3 }
  const userTierLevel = TIER_ORDER[user.dbUser.subscriptionTier] ?? 0

  // Find agents the user can access but hasn't tried
  const untappedAgents = getAllAgents()
    .filter((a) => {
      const tierOk = (TIER_ORDER[a.minTier] ?? 0) <= userTierLevel
      return tierOk && !calledAgentIds.has(a.id)
    })
    .slice(0, 10)
    .map((a) => ({
      id: a.id,
      name: a.name,
      category: a.category,
      description: a.description,
      costPerCall: a.costPerCall,
    }))

  // ── Improved prompts for called agents ────────────────────────────────────
  const improvedPrompts = allMetrics
    .filter((m) => m.totalCalls >= 3)
    .map((m) => generateImprovedSystemPrompt(m.agentId))
    .filter(Boolean)

  // ── Growth opportunities ──────────────────────────────────────────────────
  const growthOpportunities = buildGrowthOpportunities(user.dbUser.subscriptionTier, calledAgentIds)

  return NextResponse.json({
    // Prompt-specific recommendations (or generic if no prompt)
    recommendations: discovery.recommendedAgents,

    // Pre-built workflow chains
    suggestedChains: discovery.suggestedChains,

    // Agents available but never called
    untappedAgents,

    // New agent types that would serve observed demand
    newAgentSuggestions,

    // Self-improvement summary
    improvementMetrics: {
      totalPatternsCached: improvementMetrics.totalPatternsCached,
      cacheHitRate: parseFloat(improvementMetrics.cacheHitRate.toFixed(3)),
      avgQualityScore: parseFloat(improvementMetrics.avgOutputQualityScore.toFixed(3)),
      topAgents: improvementMetrics.topPerformingAgents,
      underperformingAgents: improvementMetrics.underperformingAgents,
    },

    // System-prompt improvements generated from feedback
    improvedPrompts: improvedPrompts.map((p) => ({
      agentId: p!.agentId,
      version: p!.version,
      improvementDelta: p!.improvementDeltaScore,
      rationale: p!.rationale,
    })),

    // Tier-specific growth actions
    growthOpportunities,

    // Session meta
    meta: {
      totalAgentsAvailable: getAllAgents().filter(
        (a) => (TIER_ORDER[a.minTier] ?? 0) <= userTierLevel
      ).length,
      totalAgentsCalled: calledAgentIds.size,
      explorationRate: calledAgentIds.size > 0
        ? parseFloat((calledAgentIds.size / getAllAgents().length).toFixed(3))
        : 0,
    },
  })
}

// ─── Growth opportunity builder ───────────────────────────────────────────────

interface GrowthOpportunity {
  type: 'unlock' | 'workflow' | 'chain' | 'improvement'
  title: string
  description: string
  actionLabel: string
  estimatedImpact: string
}

function buildGrowthOpportunities(
  tier: string,
  calledAgentIds: Set<string>
): GrowthOpportunity[] {
  const opportunities: GrowthOpportunity[] = []

  // Tier upgrade nudge
  if (tier === 'FREE' || tier === 'HOBBY') {
    const lockedHighValue = getAllAgents()
      .filter((a) => {
        const tierReq = { FREE: 0, HOBBY: 1, CREATOR: 2, STUDIO: 3 }[a.minTier] ?? 0
        const userLevel = { FREE: 0, HOBBY: 1, CREATOR: 2, STUDIO: 3 }[tier] ?? 0
        return tierReq > userLevel && tierReq === userLevel + 1
      })
      .slice(0, 3)
      .map((a) => a.name)
      .join(', ')

    if (lockedHighValue) {
      const nextTier = tier === 'FREE' ? 'Hobby' : 'Creator'
      opportunities.push({
        type: 'unlock',
        title: `Unlock ${nextTier} agents`,
        description: `Upgrade to ${nextTier} to access: ${lockedHighValue}`,
        actionLabel: 'Upgrade Plan',
        estimatedImpact: 'Access 10-15 additional specialized agents',
      })
    }
  }

  // Chain suggestion for solo callers
  if (calledAgentIds.size === 1) {
    const soloId = [...calledAgentIds][0]
    const def = getAgent(soloId)
    if (def?.defaultChain?.length) {
      const chainNames = def.defaultChain
        .map((id) => getAgent(id)?.name)
        .filter(Boolean)
        .join(' → ')
      opportunities.push({
        type: 'chain',
        title: 'Try agent chaining',
        description: `${def.name} chains naturally into ${chainNames} for a complete workflow`,
        actionLabel: 'Run Chain',
        estimatedImpact: 'Produce end-to-end outputs in one request',
      })
    }
  }

  // Analysis gap
  const hasBuilt = [...calledAgentIds].some((id) => getAgent(id)?.category === 'build')
  const hasAnalyzed = [...calledAgentIds].some((id) => getAgent(id)?.category === 'analyze')
  if (hasBuilt && !hasAnalyzed) {
    opportunities.push({
      type: 'workflow',
      title: 'Audit what you built',
      description: 'Run the Code Reviewer or Performance Auditor on your generated scripts',
      actionLabel: 'Run Audit',
      estimatedImpact: 'Catch security issues and performance bottlenecks before shipping',
    })
  }

  // Optimization gap
  const hasOptimized = [...calledAgentIds].some((id) => getAgent(id)?.category === 'optimize')
  if (calledAgentIds.size >= 5 && !hasOptimized) {
    opportunities.push({
      type: 'improvement',
      title: 'Reduce your token spend',
      description: 'The Cost Reducer agent has analyzed your usage and found savings',
      actionLabel: 'Optimize Costs',
      estimatedImpact: 'Typically saves 15–30% on token spend per session',
    })
  }

  return opportunities
}
