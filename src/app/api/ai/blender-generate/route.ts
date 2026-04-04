/**
 * POST /api/ai/blender-generate
 *
 * Returns a Blender agent chain recommendation for the given prompt.
 * When Blender MCP is available (BLENDER_MCP_URL env var), the first step
 * of the chain is executed and the result is returned.
 * Otherwise the full chain spec is returned as a plan the user can run locally.
 *
 * Body:
 *   { prompt: string; type?: string; style?: string }
 *
 * Returns:
 *   {
 *     chain: BlenderChain          -- recommended chain from blender-chains.ts
 *     executionResult?: unknown    -- present when MCP executed step 1
 *     status: "executed" | "plan"  -- "plan" when MCP is unavailable
 *     message: string
 *   }
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { parseBody } from '@/lib/validations'
import { requireTier } from '@/lib/tier-guard'
import {
  getAllChains,
  getChain,
  type BlenderChain,
} from '@/lib/agents/blender-chains'

export const maxDuration = 60

// ── Request schema ─────────────────────────────────────────────────────────────

const blenderGenerateSchema = z.object({
  prompt: z.string().min(1, 'prompt is required').max(2000),
  type: z.string().optional(),   // 'character' | 'building' | 'vehicle' | 'prop' | etc.
  style: z.string().optional(),  // 'stylized' | 'realistic' | 'lowpoly' | etc.
})

// ── Chain selector ─────────────────────────────────────────────────────────────

/**
 * Picks the most relevant BlenderChain for a given prompt + type hint.
 * Scoring: exact type match > tag overlap > description keyword match.
 * Falls back to 'quick-prop' (lowest cost, FREE tier) if nothing scores.
 */
function selectChain(prompt: string, type?: string, style?: string): BlenderChain {
  const chains = getAllChains()
  const words = prompt.toLowerCase().split(/\W+/).filter((w) => w.length > 2)

  const scored = chains.map((chain) => {
    let score = 0

    // Type hint match (high weight)
    if (type) {
      const typeNorm = type.toLowerCase()
      if (chain.id === typeNorm) score += 20
      if (chain.outputCategory === typeNorm) score += 15
      if (chain.tags.includes(typeNorm)) score += 10
    }

    // Style hint match
    if (style) {
      const styleNorm = style.toLowerCase()
      if (chain.tags.includes(styleNorm)) score += 5
    }

    // Keyword overlap against name + tags + description
    const haystack = [
      chain.name,
      chain.description,
      chain.id,
      ...chain.tags,
      ...chain.targetGenres,
      chain.qualityNote,
    ].join(' ').toLowerCase()

    for (const word of words) {
      if (haystack.includes(word)) {
        score += word.length > 5 ? 3 : 1
      }
    }

    return { chain, score }
  })

  scored.sort((a, b) => b.score - a.score)

  // Use best match only if it scored; otherwise fall back to quick-prop
  const best = scored[0]
  if (best && best.score > 0) return best.chain
  return getChain('quick-prop') ?? chains[0]
}

// ── Blender MCP executor (optional) ───────────────────────────────────────────

/**
 * Attempts to execute step 0 of the chain via the Blender MCP server.
 * Returns the raw MCP response, or null if MCP is unavailable / errors.
 *
 * The MCP server URL is read from BLENDER_MCP_URL (e.g. http://localhost:9876).
 * If not set, this function returns null immediately.
 */
async function tryExecuteViaMcp(
  chain: BlenderChain,
  prompt: string,
): Promise<unknown | null> {
  const mcpUrl = process.env.BLENDER_MCP_URL
  if (!mcpUrl) return null

  const step = chain.steps[0]
  if (!step) return null

  try {
    const res = await fetch(`${mcpUrl}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentId: step.agentId,
        prompt,
        params: step.paramOverrides,
      }),
      signal: AbortSignal.timeout(30_000),
    })
    if (!res.ok) return null
    return (await res.json()) as unknown
  } catch {
    return null
  }
}

// ── POST handler ───────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (process.env.DEMO_MODE !== 'true') {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const tierDenied = await requireTier(userId, 'FREE')
    if (tierDenied) return tierDenied
  }

  const parsed = await parseBody(req, blenderGenerateSchema)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status })
  }

  const { prompt, type, style } = parsed.data

  const chain = selectChain(prompt, type, style)

  // Attempt MCP execution (non-blocking — failure returns plan mode)
  const executionResult = await tryExecuteViaMcp(chain, prompt)
  const status = executionResult !== null ? 'executed' : 'plan'

  const message =
    status === 'executed'
      ? `Started Blender chain "${chain.name}" — step 1 executing via MCP. Estimated time: ${chain.estimatedTotalTime}.`
      : `Blender MCP not connected. Here is the "${chain.name}" chain spec (${chain.steps.length} steps, ${chain.estimatedTotalTime}, ${chain.costPerRun} tokens). Run it locally with the ForjeGames Blender addon or set BLENDER_MCP_URL to auto-execute.`

  return NextResponse.json({
    chain,
    status,
    message,
    ...(executionResult !== null ? { executionResult } : {}),
  })
}
