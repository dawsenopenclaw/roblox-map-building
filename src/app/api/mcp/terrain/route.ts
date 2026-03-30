/**
 * POST /api/mcp/terrain
 *
 * Proxy route for terrain-forge MCP tools.
 * Tools: generate_terrain | smooth_terrain | paint_terrain
 *
 * Request:  { tool: string, args: Record<string, unknown> }
 * Response: { success, demo, tool, data } or { error }
 */

import { NextRequest, NextResponse } from 'next/server'
import { callTool } from '@/lib/mcp-client'

const VALID_TOOLS = new Set(['generate_terrain', 'smooth_terrain', 'paint_terrain'])

export async function POST(req: NextRequest) {
  let body: { tool?: string; args?: Record<string, unknown> }

  try {
    body = (await req.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { tool, args = {} } = body

  if (!tool) {
    return NextResponse.json({ error: 'Missing required field: tool' }, { status: 400 })
  }

  if (!VALID_TOOLS.has(tool)) {
    return NextResponse.json(
      {
        error: `Unknown tool "${tool}". Valid tools: ${[...VALID_TOOLS].join(', ')}`,
      },
      { status: 400 },
    )
  }

  const result = await callTool('terrain', tool, args)
  return NextResponse.json(result)
}

export async function GET() {
  return NextResponse.json({
    server: 'terrain-forge',
    tools: ['generate_terrain', 'smooth_terrain', 'paint_terrain'],
    description: 'Roblox terrain generation — heightmaps, smoothing, material painting',
  })
}
