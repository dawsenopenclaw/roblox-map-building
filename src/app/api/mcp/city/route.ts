/**
 * POST /api/mcp/city
 *
 * Proxy route for city-architect MCP tools.
 * Tools: generate_city_layout | generate_road_network | place_buildings
 *
 * Request:  { tool: string, args: Record<string, unknown> }
 * Response: { success, demo, tool, data } or { error }
 */

import { NextRequest, NextResponse } from 'next/server'
import { callTool } from '@/lib/mcp-client'

const VALID_TOOLS = new Set(['generate_city_layout', 'generate_road_network', 'place_buildings'])

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

  const result = await callTool('city', tool, args)
  return NextResponse.json(result)
}

export async function GET() {
  return NextResponse.json({
    server: 'city-architect',
    tools: ['generate_city_layout', 'generate_road_network', 'place_buildings'],
    description: 'Roblox city planning — zones, road networks, building placement',
  })
}
