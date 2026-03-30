/**
 * POST /api/mcp/assets
 *
 * Proxy route for asset-alchemist MCP tools.
 * Tools: generate_3d_model | generate_texture | generate_asset_pack
 *
 * Request:  { tool: string, args: Record<string, unknown> }
 * Response: { success, demo, tool, data } or { error }
 */

import { NextRequest, NextResponse } from 'next/server'
import { callTool } from '@/lib/mcp-client'

const VALID_TOOLS = new Set(['generate_3d_model', 'generate_texture', 'generate_asset_pack'])

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

  const result = await callTool('assets', tool, args)
  return NextResponse.json(result)
}

export async function GET() {
  return NextResponse.json({
    server: 'asset-alchemist',
    tools: ['generate_3d_model', 'generate_texture', 'generate_asset_pack'],
    description: 'Roblox asset generation — 3D models via Meshy, textures via Fal AI, themed packs',
  })
}
