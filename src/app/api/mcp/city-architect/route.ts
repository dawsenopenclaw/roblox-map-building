/**
 * POST /api/mcp/city-architect
 *
 * Serverless replacement for the city-architect MCP server (packages/mcp/city-architect).
 * Accepts { tool, args } and dispatches to the matching tool function in mcp-tools.ts.
 *
 * Auth: Clerk session OR Studio JWT (Authorization: Bearer <token>).
 *
 * Tools:
 *   plan-city        → AI-generated full city layout (zones, roads, buildings)
 *   generate-building → Single building spec + optional Meshy mesh kick-off
 *   layout-district  → Deterministic building placement grid (instant, no AI)
 *
 * Response shape: { success: boolean, result: unknown, error?: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import {
  toolPlanCity,
  toolGenerateBuilding,
  toolLayoutDistrict,
} from '@/lib/mcp-tools'

export const maxDuration = 60 // plan-city can take ~15s on large AI calls

// ── Request schema ─────────────────────────────────────────────────────────────

const requestSchema = z.object({
  tool: z.enum(['plan-city', 'generate-building', 'layout-district']),
  args: z.record(z.unknown()),
})

// ── Per-tool arg schemas ───────────────────────────────────────────────────────

const planCityArgsSchema = z.object({
  cityType: z.string().min(2).max(200),
  size: z.enum(['small', 'medium', 'large']).default('medium'),
  style: z.string().default('modern'),
})

const generateBuildingArgsSchema = z.object({
  buildingType: z.string().min(2).max(200),
  style: z.string().default('modern'),
  kickOffMesh: z.boolean().default(false),
})

const layoutDistrictArgsSchema = z.object({
  districtType: z.enum(['commercial', 'residential', 'industrial', 'park', 'civic', 'mixed']),
  width: z.number().int().min(50).default(256),
  height: z.number().int().min(50).default(256),
  density: z.enum(['sparse', 'medium', 'dense']).default('medium'),
  style: z.string().default('modern'),
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
      case 'plan-city': {
        const a = planCityArgsSchema.parse(args)
        const result = await toolPlanCity(a)
        return NextResponse.json({ success: true, result })
      }

      case 'generate-building': {
        const a = generateBuildingArgsSchema.parse(args)
        const result = await toolGenerateBuilding(a)
        return NextResponse.json({ success: true, result })
      }

      case 'layout-district': {
        const a = layoutDistrictArgsSchema.parse(args)
        const result = toolLayoutDistrict(a)
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
    server: 'city-architect',
    version: '1.0.0',
    tools: [
      {
        name: 'plan-city',
        description: 'Use AI to generate a complete city layout plan with zones, roads, and building positions.',
        args: { cityType: 'string', size: 'small|medium|large', style: 'string' },
      },
      {
        name: 'generate-building',
        description: 'Design a single building spec using AI. Optionally kick off a Meshy 3D mesh generation task.',
        args: { buildingType: 'string', style: 'string', kickOffMesh: 'boolean' },
      },
      {
        name: 'layout-district',
        description: 'Generate building placements for a district. Instant deterministic result — no AI call.',
        args: { districtType: 'commercial|residential|industrial|park|civic|mixed', width: 'number', height: 'number', density: 'sparse|medium|dense', style: 'string' },
      },
    ],
  })
}
