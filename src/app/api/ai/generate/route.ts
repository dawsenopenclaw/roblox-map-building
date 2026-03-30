/**
 * POST /api/ai/generate
 *
 * Next.js proxy route — forwards requests to the Hono API server (port 3001).
 * Falls back to demo responses when the Hono server is unreachable or when
 * no ANTHROPIC_API_KEY is configured.
 *
 * Editor sends:  { prompt: string }
 * Returns:       { result: string, tokensUsed: number }
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { spendTokens } from '@/lib/tokens-server'
import { requireTier } from '@/lib/tier-guard'
import { dispatchWebhookEvent } from '@/lib/webhook-dispatch'
import { z } from 'zod'

const bodySchema = z.object({
  prompt: z.string().min(1, 'prompt is required').max(4000),
})


// ── Demo responses (mirrors EditorClient.tsx) ────────────────────────────────

const DEMO_RESPONSES: Record<string, string> = {
  castle: 'Castle placed at map center. Added 4 towers, a main hall, and a drawbridge over the moat.',
  forest: 'Forest biome generated. 847 trees and 23 rocks placed across the eastern half of the map.',
  npc: 'NPC spawned with patrol AI, idle animations, and a dialogue system. Appears near the town square.',
  terrain: 'Terrain generated: rolling hills with a river valley running north-south. Baseplate is 2048x2048 studs.',
  city: 'City district built: 12 buildings, road grid, street lights, and 3 parks. Covers a 400x400 stud area.',
  racing: 'Racing track placed with banked corners, pit lane, and grandstand seating for 500 players.',
  default: 'Command received. Configure an API key in Settings to enable live AI execution.',
}

function getDemoResponse(prompt: string): string {
  const lower = prompt.toLowerCase()
  for (const [key, response] of Object.entries(DEMO_RESPONSES)) {
    if (key !== 'default' && lower.includes(key)) return response
  }
  return DEMO_RESPONSES.default
}

function estimateTokens(text: string): number {
  return Math.max(8, Math.ceil(text.split(/\s+/).length * 1.3))
}

// ── Hono proxy ───────────────────────────────────────────────────────────────

const HONO_URL = process.env.INTERNAL_API_URL ?? 'https://api.forjegames.com'

/**
 * Tries to call the Hono generate endpoint.
 * Returns null if the server is unavailable or returns a non-2xx response.
 */
async function tryHonoGenerate(
  prompt: string,
  authHeader: string | null,
): Promise<{ result: string; tokensUsed: number } | null> {
  try {
    const res = await fetch(`${HONO_URL}/api/ai/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      // Two-phase API: send confirmed=true to skip the estimate phase.
      // mode defaults to 'assets' for freeform chat prompts.
      body: JSON.stringify({
        prompt,
        mode: 'assets',
        confirmed: true,
      }),
      // Short timeout so demo fallback is snappy when Hono isn't running
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) return null

    const data = (await res.json()) as {
      phase?: string
      success?: boolean
      data?: { assets?: { name?: string; description?: string }[] }
      steps?: { name: string }[]
      tokens_spent?: number
      errors?: string[]
    }

    if (data.phase !== 'result' || !data.success) return null

    // Shape the Hono response into a human-readable string for the chat UI
    const assetNames =
      data.data?.assets?.map((a) => a.name ?? a.description ?? 'asset').join(', ') ?? ''
    const stepNames = data.steps?.map((s) => s.name).join(' → ') ?? ''
    const result = assetNames
      ? `Generated: ${assetNames}. Steps: ${stepNames}.`
      : stepNames
        ? `Completed: ${stepNames}.`
        : 'Generation complete.'

    return { result, tokensUsed: data.tokens_spent ?? estimateTokens(prompt) }
  } catch {
    // Network error or timeout — fall through to demo mode
    return null
  }
}

// ── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const isDemo = process.env.DEMO_MODE === 'true'
  let authedUserId: string | null = null

  if (!isDemo) {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // Generate requires at minimum a FREE tier account with a token balance.
    // The spendTokens call below will enforce the actual balance limit, but we
    // do a tier check here to keep the guard pattern consistent and to block
    // users whose subscriptions are in a terminal state (CANCELED, etc.).
    const tierDenied = await requireTier(userId, 'FREE')
    if (tierDenied) return tierDenied
    authedUserId = userId
  }

  let prompt: string

  try {
    const raw = await req.json()
    const parsed = bodySchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
    }
    prompt = parsed.data.prompt.trim()
    if (!prompt) {
      return NextResponse.json({ error: 'prompt must not be empty' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Forward the caller's auth header so Hono's requireAuth middleware passes
  const authHeader = req.headers.get('Authorization')

  // Only attempt Hono proxy when an API key is configured — avoids slow
  // connection-refused timeouts in pure demo environments.
  const hasApiKey = Boolean(process.env.ANTHROPIC_API_KEY)

  if (hasApiKey) {
    // Deduct tokens before calling the AI — prevents free-riding when billing fails.
    // Cost: 50 tokens per generate request. Skipped in demo mode (no real user).
    if (!isDemo && authedUserId) {
      try {
        await spendTokens(authedUserId, 50, 'AI generate request', { prompt: prompt.slice(0, 100) })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Token error'
        return NextResponse.json({ error: message }, { status: 402 })
      }
    }

    const honoResult = await tryHonoGenerate(prompt, authHeader)
    if (honoResult) {
      // Fire build.completed webhook (best-effort) — only for authenticated users
      if (authedUserId) {
        dispatchWebhookEvent(authedUserId, 'build.completed', {
          prompt: prompt.slice(0, 200),
          tokensUsed: honoResult.tokensUsed,
          completedAt: new Date().toISOString(),
        }).catch(() => {})
      }
      return NextResponse.json(honoResult)
    }
  }

  // Demo mode — instant response, no external calls
  const result = getDemoResponse(prompt)
  const tokensUsed = estimateTokens(prompt)
  return NextResponse.json({ result, tokensUsed })
}
