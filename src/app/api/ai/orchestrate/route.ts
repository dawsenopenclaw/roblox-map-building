/**
 * POST /api/ai/orchestrate
 *
 * Runs the 9-agent auto-dispatch pipeline for a single user prompt.
 *
 * The caller sends:
 *   { prompt: string, sessionHint?: string, forceAgents?: AgentName[] }
 *
 * The endpoint returns an SSE stream with one event per agent step:
 *
 *   event: dispatch      data: { agents, reasoning, classifiedIntent, confidence }
 *   event: agent-start   data: { agent, position, total }
 *   event: agent-done    data: { agent, output, durationMs, position, total }
 *   ...
 *   event: complete      data: { final, all, totalDurationMs }
 *
 * On error:
 *   event: error         data: { message }
 *
 * Auth: Clerk, same as every other AI route. Rate limited via the general
 * AI limiter (20 req/min per user). Also gated behind `requireTier('FREE')`
 * so banned/suspended users can't burn tokens.
 */

import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { aiRateLimit, rateLimitHeaders } from '@/lib/rate-limit'
import { requireTier } from '@/lib/tier-guard'
import { orchestrate } from '@/lib/ai/orchestrator'
import type { AgentName } from '@/lib/ai/agents'

// The chain of up to 4 agents can each take 10-30s on free-tier providers,
// plus the classifier overhead. Cap at the Hobby-plan serverless maximum.
export const maxDuration = 300

const ALLOWED_AGENT_NAMES: ReadonlySet<string> = new Set([
  'think',
  'ideas',
  'plan',
  'build',
  'image',
  'script',
  'terrain',
  'threed',
  'debug',
])

function parseForceAgents(input: unknown): AgentName[] | undefined {
  if (!Array.isArray(input)) return undefined
  const filtered = input.filter((v): v is string => typeof v === 'string' && ALLOWED_AGENT_NAMES.has(v))
  return filtered.length > 0 ? (filtered as AgentName[]) : undefined
}

export async function POST(req: NextRequest) {
  const isDemo = process.env.DEMO_MODE === 'true'

  let clerkId: string | null = null
  if (!isDemo) {
    const session = await auth()
    clerkId = session.userId
    if (!clerkId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const tierDenied = await requireTier(clerkId, 'FREE')
    if (tierDenied) return tierDenied

    try {
      const rl = await aiRateLimit(clerkId)
      if (!rl.allowed) {
        return new Response(
          JSON.stringify({ error: 'Too many requests — slow down on the orchestrate pipeline' }),
          { status: 429, headers: { 'Content-Type': 'application/json', ...rateLimitHeaders(rl) } },
        )
      }
    } catch {
      // Redis unavailable — let the request through rather than hard-fail.
      // The in-memory fallback in rate-limit.ts still protects us.
    }
  }

  let body: { prompt?: string; sessionHint?: string; forceAgents?: unknown }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : ''
  if (!prompt) {
    return new Response(JSON.stringify({ error: 'prompt is required' }), {
      status: 422,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const sessionHint = typeof body.sessionHint === 'string' ? body.sessionHint.slice(0, 2000) : undefined
  const forceAgents = parseForceAgents(body.forceAgents)

  // ── SSE stream ─────────────────────────────────────────────────────────
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      function send(event: string, data: unknown) {
        const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
        controller.enqueue(encoder.encode(payload))
      }

      try {
        await orchestrate(prompt, {
          sessionHint,
          forceAgents,
          timeoutMs: 270_000,
          onEvent: (ev) => {
            send(ev.kind, ev)
          },
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Orchestrator crashed'
        send('error', { message })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}

// ---------------------------------------------------------------------------
// GET: cheap health check so the caller can verify the route exists without
// burning a full orchestration call.
// ---------------------------------------------------------------------------

export async function GET() {
  return new Response(
    JSON.stringify({
      ok: true,
      agents: Array.from(ALLOWED_AGENT_NAMES),
      note: 'POST { prompt, sessionHint?, forceAgents? } to run the 9-agent dispatch chain. Returns SSE.',
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  )
}
