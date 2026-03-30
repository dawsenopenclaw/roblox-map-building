/**
 * MCP Client stub — returns demo data until MCP servers are configured.
 * TODO: Connect to real terrain-forge, city-architect, asset-alchemist MCP servers.
 */

export interface McpCallResult {
  server: string
  tool: string
  success: boolean
  data: Record<string, unknown>
  demo: boolean
}

export function detectMcpIntent(
  userMessage: string,
  aiResponse: string
): { server: string; tool: string; args: Record<string, unknown> } | null {
  const lower = (userMessage + ' ' + aiResponse).toLowerCase()

  if (lower.includes('terrain') || lower.includes('landscape') || lower.includes('biome')) {
    return { server: 'terrain-forge', tool: 'generate-terrain', args: { biome: 'forest', seed: Date.now() } }
  }
  if (lower.includes('city') || lower.includes('road') || lower.includes('urban')) {
    return { server: 'city-architect', tool: 'plan-city', args: { density: 0.5 } }
  }
  if (lower.includes('3d') || lower.includes('mesh') || lower.includes('model')) {
    return { server: 'asset-alchemist', tool: 'text-to-3d', args: { prompt: userMessage } }
  }
  return null
}

export async function callTool(
  server: string,
  tool: string,
  args: Record<string, unknown>
): Promise<McpCallResult> {
  // Demo mode — return mock results
  return {
    server,
    tool,
    success: true,
    demo: true,
    data: {
      message: `[Demo] ${server}/${tool} would generate real output when MCP servers are connected`,
      preview: 'https://forjegames.com/demo/mesh-preview.svg',
    },
  }
}
