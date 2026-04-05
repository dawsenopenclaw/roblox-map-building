/**
 * POST /api/mcp/asset-alchemist
 *
 * Serverless replacement for the asset-alchemist MCP server (packages/mcp/asset-alchemist).
 * Accepts { tool, args } and dispatches to the matching tool function in mcp-tools.ts.
 *
 * Auth: Clerk session OR Studio JWT (Authorization: Bearer <token>).
 * Both auth paths must be present — use DEMO_MODE=true to bypass for local dev.
 *
 * Tools:
 *   text-to-3d       → Meshy v2 text-to-3D, polls to completion
 *   generate-texture → Fal AI PBR texture set
 *   optimize-mesh    → Roblox-specific mesh optimisation recommendations (instant)
 *
 * Response shape: { success: boolean, result: unknown, error?: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import {
  toolTextTo3d,
  toolGenerateTexture,
  toolOptimizeMesh,
  ROBLOX_MATERIALS,
} from '@/lib/mcp-tools'

export const maxDuration = 300 // 5 min — Meshy polling can take ~2 min

// ── Request schema ─────────────────────────────────────────────────────────────

const requestSchema = z.object({
  tool: z.enum(['text-to-3d', 'generate-texture', 'optimize-mesh']),
  args: z.record(z.unknown()),
})

// ── Per-tool arg schemas ───────────────────────────────────────────────────────

const textTo3dArgsSchema = z.object({
  prompt: z.string().min(3).max(1000),
  style: z
    .enum(['realistic', 'stylized', 'lowpoly', 'roblox', 'cartoon', 'pbr', 'low_poly'])
    .default('roblox'),
  polyTarget: z.number().int().min(500).max(100_000).default(10_000),
  enrichPromptWithAI: z.boolean().default(false),
})

const generateTextureArgsSchema = z.object({
  prompt: z.string().min(3).max(1000),
})

const optimizeMeshArgsSchema = z.object({
  meshUrl: z.string().url(),
  polyCount: z.number().int().min(0),
})

// ── Auth helper ────────────────────────────────────────────────────────────────

async function resolveAuth(req: NextRequest): Promise<{ authorized: boolean }> {
  if (process.env.DEMO_MODE === 'true') return { authorized: true }

  // Clerk web session
  const { userId } = await auth()
  if (userId) return { authorized: true }

  // Studio JWT — the Studio plugin sends its session token as a Bearer token.
  // We validate by checking for its existence in the studio session store.
  const authHeader = req.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    if (token.length > 8) {
      // Dynamic import avoids pulling server-only Redis code into the module graph
      // when Clerk auth already resolved the user above.
      const { getSessionByToken } = await import('@/lib/studio-session')
      const session = await getSessionByToken(token)
      if (session?.connected) return { authorized: true }
    }
  }

  return { authorized: false }
}

// ── Handler ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { authorized } = await resolveAuth(req)
  if (!authorized) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { tool, args } = parsed.data

  try {
    switch (tool) {
      case 'text-to-3d': {
        const a = textTo3dArgsSchema.parse(args)
        const result = await toolTextTo3d(a)
        return NextResponse.json({ success: true, result })
      }

      case 'generate-texture': {
        const a = generateTextureArgsSchema.parse(args)
        const result = await toolGenerateTexture(a)
        return NextResponse.json({ success: true, result })
      }

      case 'optimize-mesh': {
        const a = optimizeMeshArgsSchema.parse(args)
        const result = toolOptimizeMesh(a)
        return NextResponse.json({ success: true, result })
      }

      default: {
        // Exhaustiveness guard — TypeScript narrows `tool` to `never` here
        const _: never = tool
        return NextResponse.json({ success: false, error: `Unknown tool: ${String(_)}` }, { status: 400 })
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const isValidationError = err instanceof z.ZodError
    return NextResponse.json(
      { success: false, error: message },
      { status: isValidationError ? 400 : 502 },
    )
  }
}

// ── GET — capability manifest ──────────────────────────────────────────────────

export async function GET() {
  return NextResponse.json({
    server: 'asset-alchemist',
    version: '1.0.0',
    tools: [
      {
        name: 'text-to-3d',
        description: 'Generate a Roblox-ready 3D mesh from a text prompt using Meshy AI.',
        args: { prompt: 'string', style: 'roblox|realistic|stylized|lowpoly|cartoon|pbr|low_poly', polyTarget: 'number (500-100000)', enrichPromptWithAI: 'boolean' },
      },
      {
        name: 'generate-texture',
        description: 'Generate a seamless PBR texture set (albedo, normal, roughness, metallic) via Fal AI.',
        args: { prompt: 'string' },
      },
      {
        name: 'optimize-mesh',
        description: 'Returns prioritised Roblox-specific mesh optimisation recommendations. Instant — no external API call.',
        args: { meshUrl: 'string (url)', polyCount: 'number' },
      },
    ],
  })
}
