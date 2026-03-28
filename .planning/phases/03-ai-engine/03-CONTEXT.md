# Phase 3: AI Engine - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning
**Mode:** Auto-generated (core AI phase)

<domain>
## Phase Boundary

Ship the core AI magic: voice-to-game (Deepgram → Claude intent → game commands <2s), image-to-map (upload → Claude Vision → terrain/building layout), multi-model pipeline orchestration (Claude + Meshy + Fal in parallel), circuit breakers + fallback chains for all AI providers, cost estimation before execution, result caching (Redis 24hr TTL), quality gates for generated output.

Requirements: AI-01 through AI-07 (7 total)

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion. Use extensive AI pipeline research from 46 agents.

Key technical decisions from research:
- Voice: Deepgram Nova-2 ($0.0043/min, 300-500ms latency, WebSocket streaming)
- Intent: Claude 3.5 Sonnet ($0.00195/intent, 300-600ms latency, 92-95% confidence)
- 3D: Meshy API (text-to-3D, image-to-3D, $0.10-0.80/model, .fbx/.glb export)
- Images: Fal Flux Pro ($0.055-0.22/image, PBR textures, batch via Promise.allSettled)
- Pipeline: Parallel execution — Claude thinking → (Meshy + Fal + Audio) in parallel
- Circuit breakers: 3 retries with exponential backoff (1s, 2s, 4s), degrade gracefully
- Caching: Redis with 24hr TTL, hash prompt → cached output
- Cost estimation: Calculate before execution, show user "~50 tokens"
- Quality gates: Reject >50k polygons, artifact score >0.3, auto-retry with enhanced prompt
- Total cost per full game: ~$8-11.65 (optimized)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- src/lib/redis.ts — Redis singleton (Phase 1)
- apps/api/src/lib/db.ts — Prisma client (Phase 1)
- apps/api/src/middleware/rateLimit.ts — Rate limiter (Phase 1)
- apps/api/src/lib/sandbox.ts — Deno code sandbox (Phase 1)
- src/lib/tokens-server.ts — earnTokens/spendTokens (Phase 1)
- src/lib/api-usage.ts — recordApiUsage cost tracking (Phase 1)

### Integration Points
- AI routes go in apps/api/src/routes/ai/
- Voice endpoint: POST /api/ai/voice-to-game
- Image endpoint: POST /api/ai/image-to-map
- Pipeline orchestrator: apps/api/src/lib/ai/pipeline.ts
- Token deduction happens on every AI call via spendTokens

</code_context>

<specifics>
## Specific Ideas
- Voice-to-game should feel like magic — <2 second response time
- Image-to-map should handle photos, sketches, and Pinterest-style references
- Cost estimation shown BEFORE execution so users can cancel
- Fallback to simpler generation if premium model fails (not a crash)

</specifics>

<deferred>
## Deferred Ideas
- ElevenLabs audio generation — deferred to Phase 5 or later
- Game DNA Scanner — Phase 7
- Economy simulation — v2
- Auto-playtest bot — v2

</deferred>
