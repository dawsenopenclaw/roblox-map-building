/**
 * POST /api/mcp/terrain-forge
 *
 * Serverless replacement for the terrain-forge MCP server (packages/mcp/terrain-forge).
 * Accepts { tool, args } and dispatches to the matching tool function in mcp-tools.ts.
 *
 * Auth: Clerk session OR Studio JWT (Authorization: Bearer <token>).
 *
 * Tools:
 *   generate-terrain → Biome + noise → executable Roblox Luau terrain script
 *   paint-terrain    → Material + region → Luau terrain painting script
 *   create-water     → Water type + position → Luau water creation script
 *
 * Response shape: { success: boolean, result: unknown, error?: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import {
  toolGenerateTerrain,
  toolPaintTerrain,
  toolCreateWater,
  ROBLOX_MATERIALS,
} from '@/lib/mcp-tools'

export const maxDuration = 30 // terrain generation is compute-only + optional AI call

// ── Request schema ─────────────────────────────────────────────────────────────

const requestSchema = z.object({
  tool: z.enum(['generate-terrain', 'paint-terrain', 'create-water']),
  args: z.record(z.unknown()),
})

// ── Per-tool arg schemas ───────────────────────────────────────────────────────

const generateTerrainArgsSchema = z.object({
  biome: z.string().min(2).max(500),
  size: z
    .object({ width: z.number().default(512), depth: z.number().default(512) })
    .default({ width: 512, depth: 512 }),
  features: z.array(z.string()).default([]),
  originX: z.number().default(0),
  originY: z.number().default(0),
  originZ: z.number().default(0),
  voxelSize: z.number().int().default(4),
  seed: z.number().optional(),
})

const paintTerrainArgsSchema = z.object({
  material: z.string(),
  region: z.object({
    x: z.number(),
    z: z.number(),
    width: z.number().positive(),
    height: z.number().positive(),
  }),
  originX: z.number().default(0),
  originY: z.number().default(0),
  originZ: z.number().default(0),
  voxelSize: z.number().int().default(4),
  terrainHeight: z.number().default(20),
})

const createWaterArgsSchema = z.object({
  waterType: z.enum(['ocean', 'river', 'lake']),
  x: z.number().default(0),
  y: z.number().default(0),
  z: z.number().default(0),
  width: z.number().default(256),
  depth: z.number().default(20),
  length: z.number().default(256),
})

// ── Auth helper ────────────────────────────────────────────────────────────────

async function resolveAuth(req: NextRequest): Promise<{ authorized: boolean }> {
  if (process.env.DEMO_MODE === 'true') return { authorized: true }

  const { userId } = await auth()
  if (userId) return { authorized: true }

  const authHeader = req.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    if (token.length > 8) {
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
      case 'generate-terrain': {
        const a = generateTerrainArgsSchema.parse(args)
        const result = await toolGenerateTerrain(a)
        return NextResponse.json({ success: true, result })
      }

      case 'paint-terrain': {
        const a = paintTerrainArgsSchema.parse(args)
        // Validate material before calling tool (provides a clearer 400 message)
        const validMaterials = new Set<string>(ROBLOX_MATERIALS)
        if (!validMaterials.has(a.material)) {
          return NextResponse.json(
            { success: false, error: `Invalid material "${a.material}". Valid: ${ROBLOX_MATERIALS.join(', ')}` },
            { status: 400 },
          )
        }
        const result = toolPaintTerrain(a)
        return NextResponse.json({ success: true, result })
      }

      case 'create-water': {
        const a = createWaterArgsSchema.parse(args)
        const result = toolCreateWater(a)
        return NextResponse.json({ success: true, result })
      }

      default: {
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
    server: 'terrain-forge',
    version: '1.0.0',
    tools: [
      {
        name: 'generate-terrain',
        description: 'Generate a Roblox Luau script that creates terrain. Pass the returned luauScript to the Studio plugin.',
        args: { biome: 'string', size: '{ width: number, depth: number }', features: 'string[]', originX: 'number', originY: 'number', originZ: 'number', voxelSize: 'number', seed: 'number?' },
      },
      {
        name: 'paint-terrain',
        description: 'Generate a Roblox Luau script that paints a region with a material.',
        args: { material: `one of: ${ROBLOX_MATERIALS.join(', ')}`, region: '{ x, z, width, height }', originX: 'number', originY: 'number', originZ: 'number', voxelSize: 'number', terrainHeight: 'number' },
      },
      {
        name: 'create-water',
        description: 'Generate a Roblox Luau script that creates water terrain (FillBlock or FillBall).',
        args: { waterType: 'ocean|river|lake', x: 'number', y: 'number', z: 'number', width: 'number', depth: 'number', length: 'number' },
      },
    ],
  })
}
