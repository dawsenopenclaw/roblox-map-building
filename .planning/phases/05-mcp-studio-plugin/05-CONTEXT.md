# Phase 5: MCP Servers + Studio Plugin - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning
**Mode:** Auto-generated (Roblox integration phase)

<domain>
## Phase Boundary

Build 3 MCP servers (terrain-forge, city-architect, asset-alchemist) that expose AI generation as MCP tool calls, plus a Roblox Studio plugin with DockWidgetPluginGui, HTTP polling sync (2-5s), asset injection, and ChangeHistoryService undo/redo integration.

Requirements: MCP-01 through MCP-03, PLUG-01 through PLUG-04 (7 total)

</domain>

<decisions>
## Implementation Decisions

### MCP Servers (from research)
- Use @modelcontextprotocol/server SDK
- Each MCP server is an npm package (@forjegames/mcp-terrain, etc.)
- Stateless design for terrain/assets, stateful for city planning
- Token metering middleware for billing
- Docker sandboxing per MCP for security

### Studio Plugin (from research)
- DockWidgetPluginGui for persistent UI panel
- HTTP polling every 2-5 seconds (no WebSocket in Studio)
- ChangeHistoryService wrapping ALL operations for undo
- Browser-based OAuth for authentication (plugin opens URL)
- Store auth tokens in plugin:SetSetting() (encrypted persistence)
- Batch asset insertions with wait(0.05) between groups

### Claude's Discretion
All implementation details at Claude's discretion. Follow patterns from MCP production research and Studio plugin research.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- apps/api/src/lib/ai/providers/ — Claude, Meshy, Fal clients (Phase 3)
- apps/api/src/lib/ai/pipeline.ts — Multi-model orchestrator (Phase 3)
- apps/api/src/lib/ai/circuit-breaker.ts (Phase 3)
- apps/api/src/lib/ai/cache.ts (Phase 3)
- apps/api/src/lib/ai/cost-estimator.ts (Phase 3)
- apps/api/src/middleware/auth.ts — requireAuth (Phase 1)

### Integration Points
- MCP servers call the same AI provider wrappers as the API routes
- Studio plugin polls apps/api endpoints for state sync
- New API routes needed: POST /api/studio/sync, GET /api/studio/status

</code_context>

<specifics>
## Specific Ideas
- MCP servers should be installable via npm for other developers
- Studio plugin must feel responsive despite polling (optimistic UI)
- terrain-forge should accept natural language biome descriptions
- city-architect should use real urban planning grid algorithms

</specifics>

<deferred>
## Deferred Ideas
- Plugin marketplace distribution — deferred (direct install first)
- Real-time WebSocket sync — deferred (polling works for v1)
- Additional MCP servers (npc-director, economy-engine, etc.) — v2

</deferred>
