/**
 * /api/agents
 *
 * GET  — list available agents (filtered by category, tier)
 * POST — call a specific agent or run auto-routing
 * GET  ?action=recommend&prompt= — get agent recommendations for a prompt
 * GET  ?action=metrics — get per-agent performance metrics
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import {
  getAllAgents,
  getAgent,
  estimateCallCost,
  type AgentCategory,
} from '@/lib/agents/registry'
import {
  callAgent,
  runChain,
  autoRoute,
  recommendAgents,
  getAgentMetrics,
  type AgentCallOptions,
} from '@/lib/agents/orchestrator'
import {
  recordCall,
  recordFeedback,
  recordUnmatchedRequest,
  getCachedOutput,
  type FeedbackRating,
} from '@/lib/agents/self-improve'

// ─── Demo fallback data ───────────────────────────────────────────────────────

const DEMO_AGENTS_RESPONSE = {
  demo: true,
  agents: getAllAgents().map((a) => ({ ...a, available: a.minTier === 'FREE' })),
  total: getAllAgents().length,
  categories: ['build', 'analyze', 'optimize', 'research', 'business', 'growth'],
}

// ─── Auth helper ──────────────────────────────────────────────────────────────

async function requireUser(): Promise<{ userId: string; dbUser: { id: string; subscriptionTier: string } } | NextResponse> {
  let clerkId: string | null = null
  try {
    const { userId } = await auth()
    clerkId = userId ?? null
  } catch { /* demo mode */ }

  if (!clerkId) {
    return NextResponse.json(DEMO_AGENTS_RESPONSE)
  }

  try {
    const dbUser = await db.user.findUnique({
      where: { clerkId },
      select: { id: true, subscription: { select: { tier: true } } },
    })
    if (!dbUser) {
      return NextResponse.json(DEMO_AGENTS_RESPONSE)
    }
    return {
      userId: clerkId,
      dbUser: { id: dbUser.id, subscriptionTier: dbUser.subscription?.tier ?? 'FREE' },
    }
  } catch {
    return NextResponse.json(DEMO_AGENTS_RESPONSE)
  }
}

function isNextResponse(v: unknown): v is NextResponse {
  return v instanceof NextResponse
}

// ─── GET /api/agents ──────────────────────────────────────────────────────────

export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = await requireUser()
  if (isNextResponse(auth)) return auth
  const { dbUser } = auth

  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')

  // ── GET ?action=recommend&prompt=... ─────────────────────────────────────
  if (action === 'recommend') {
    const prompt = searchParams.get('prompt')?.trim()
    if (!prompt) {
      return NextResponse.json({ error: 'prompt query param required' }, { status: 400 })
    }
    const recommendations = recommendAgents(prompt)
    if (recommendations.length === 0) {
      recordUnmatchedRequest(prompt)
    }
    return NextResponse.json({ recommendations })
  }

  // ── GET ?action=metrics ───────────────────────────────────────────────────
  if (action === 'metrics') {
    const agentId = searchParams.get('agentId') ?? undefined
    const metrics = getAgentMetrics(agentId)
    return NextResponse.json({ metrics })
  }

  // ── GET ?action=estimate&agentId=...&promptLength=... ─────────────────────
  if (action === 'estimate') {
    const agentId = searchParams.get('agentId')
    const promptLength = parseInt(searchParams.get('promptLength') ?? '200', 10)
    if (!agentId) {
      return NextResponse.json({ error: 'agentId query param required' }, { status: 400 })
    }
    const agentDef = getAgent(agentId)
    if (!agentDef) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }
    const estimatedCost = estimateCallCost(agentDef, promptLength)
    return NextResponse.json({ agentId, estimatedCost, model: agentDef.model })
  }

  // ── GET — list all agents (with optional category filter) ─────────────────
  const category = searchParams.get('category') as AgentCategory | null
  const tier = dbUser.subscriptionTier as string

  const TIER_ORDER: Record<string, number> = { FREE: 0, HOBBY: 1, CREATOR: 2, STUDIO: 3 }
  const userTierLevel = TIER_ORDER[tier] ?? 0

  let agents = getAllAgents()

  if (category) {
    agents = agents.filter((a) => a.category === category)
  }

  // Mark agents as available/locked based on subscription tier
  const annotated = agents.map((a) => ({
    ...a,
    available: (TIER_ORDER[a.minTier] ?? 0) <= userTierLevel,
  }))

  return NextResponse.json({
    agents: annotated,
    total: annotated.length,
    categories: ['build', 'analyze', 'optimize', 'research', 'business', 'growth'],
  })
}

// ─── POST /api/agents ─────────────────────────────────────────────────────────

interface CallRequestBody {
  action: 'call' | 'chain' | 'auto'
  agentId?: string
  agentIds?: string[]
  prompt: string
  chainContext?: string
  dryRun?: boolean
  followChain?: boolean
  /** Feedback on a previous output: agentId + rating + output */
  feedback?: {
    agentId: string
    rating: FeedbackRating
    output?: string
    prompt: string
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const authResult = await requireUser()
  if (isNextResponse(authResult)) return authResult
  const { userId, dbUser } = authResult

  let body: CallRequestBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { action, prompt, dryRun = false } = body

  if (!prompt?.trim()) {
    return NextResponse.json({ error: 'prompt is required' }, { status: 400 })
  }

  // ── Feedback recording (fire-and-forget) ─────────────────────────────────
  if (body.feedback) {
    const { agentId, rating, output, prompt: fbPrompt } = body.feedback
    if (agentId && rating && fbPrompt) {
      recordFeedback(agentId, fbPrompt, rating, output)
    }
    return NextResponse.json({ ok: true })
  }

  // ── Tier check for paid agents ────────────────────────────────────────────
  const TIER_ORDER: Record<string, number> = { FREE: 0, HOBBY: 1, CREATOR: 2, STUDIO: 3 }
  const userTierLevel = TIER_ORDER[dbUser.subscriptionTier] ?? 0

  const checkTier = (agentId: string): NextResponse | null => {
    const def = getAgent(agentId)
    if (!def) return NextResponse.json({ error: `Agent not found: ${agentId}` }, { status: 404 })
    if ((TIER_ORDER[def.minTier] ?? 0) > userTierLevel) {
      return NextResponse.json(
        { error: `Agent "${def.name}" requires ${def.minTier} plan or higher` },
        { status: 403 }
      )
    }
    return null
  }

  // ── action: call (single agent) ───────────────────────────────────────────
  if (action === 'call') {
    const { agentId, chainContext } = body
    if (!agentId) {
      return NextResponse.json({ error: 'agentId is required for action:call' }, { status: 400 })
    }

    const tierError = checkTier(agentId)
    if (tierError) return tierError

    // Check cache before calling
    const cached = getCachedOutput(agentId, prompt)
    if (cached && !dryRun) {
      return NextResponse.json({
        agentId,
        agentName: getAgent(agentId)?.name ?? agentId,
        output: cached,
        fromCache: true,
        costCharged: 0,
        tokensUsed: 0,
        durationMs: 0,
        isDemo: false,
      })
    }

    const callOptions: AgentCallOptions = {
      userId,
      agentId,
      prompt,
      chainContext,
      dryRun,
    }

    const result = await callAgent(callOptions)

    if (!dryRun) {
      recordCall(agentId, prompt, result.output.length)
    }

    return NextResponse.json(result)
  }

  // ── action: chain (explicit sequence) ────────────────────────────────────
  if (action === 'chain') {
    const { agentIds } = body
    if (!agentIds?.length) {
      return NextResponse.json({ error: 'agentIds array required for action:chain' }, { status: 400 })
    }
    if (agentIds.length > 5) {
      return NextResponse.json({ error: 'Maximum chain length is 5' }, { status: 400 })
    }

    for (const id of agentIds) {
      const tierError = checkTier(id)
      if (tierError) return tierError
    }

    const result = await runChain(userId, agentIds, prompt, dryRun)

    if (!dryRun) {
      for (const step of result.steps) {
        recordCall(step.agentId, prompt, step.output.length)
      }
    }

    return NextResponse.json(result)
  }

  // ── action: auto (router picks best agents) ───────────────────────────────
  if (action === 'auto') {
    const { followChain = false } = body
    const result = await autoRoute(userId, prompt, { followChain, dryRun })

    if (!dryRun) {
      for (const step of result.steps) {
        recordCall(step.agentId, prompt, step.output.length)
      }
    }

    return NextResponse.json(result)
  }

  return NextResponse.json(
    { error: 'action must be one of: call, chain, auto' },
    { status: 400 }
  )
}
