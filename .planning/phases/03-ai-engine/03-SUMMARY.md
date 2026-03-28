---
phase: "03"
plan: "03"
subsystem: "ai-engine"
tags: [ai, anthropic, deepgram, meshy, fal, pipeline, circuit-breaker, caching, voice, vision]
dependency_graph:
  requires: [redis, prisma, hono, clerk-auth, token-economy]
  provides: [voice-to-game, image-to-map, terrain-pipeline, city-pipeline, assets-pipeline, ai-health]
  affects: [token-balance, api-usage, rate-limiting]
tech_stack:
  added: ["@anthropic-ai/sdk", "ws (deepgram WebSocket)", "node crypto (SHA-256 cache keys)"]
  patterns: [circuit-breaker, fallback-chain, promise-allsettled, exponential-backoff, redis-caching, quality-gates]
key_files:
  created:
    - apps/api/src/lib/ai/providers/anthropic.ts
    - apps/api/src/lib/ai/providers/deepgram.ts
    - apps/api/src/lib/ai/providers/meshy.ts
    - apps/api/src/lib/ai/providers/fal.ts
    - apps/api/src/lib/ai/circuit-breaker.ts
    - apps/api/src/lib/ai/cache.ts
    - apps/api/src/lib/ai/cost-estimator.ts
    - apps/api/src/lib/ai/quality-gate.ts
    - apps/api/src/lib/ai/pipeline.ts
    - apps/api/src/routes/ai/voice.ts
    - apps/api/src/routes/ai/image.ts
    - apps/api/src/routes/ai/generate.ts
  modified:
    - apps/api/src/index.ts
decisions:
  - "Two-phase generate endpoint: first call returns estimate, second call (confirmed=true) executes — prevents surprise token spend"
  - "Circuit breakers are singletons per provider — shared across requests, state persists in-process"
  - "Cache keys use SHA-256 of provider:operation:input — deterministic, collision-resistant, 40-char prefix"
  - "spendTokens re-implemented inline in routes to avoid cross-package import complexity (apps/api → src/lib)"
  - "Quality gate failures return degraded response not error — partial success preferred over crash"
  - "Full-game pipeline uses Promise.allSettled across terrain+city+assets — resilient to partial failures"
metrics:
  duration: "~25 minutes"
  completed: "2026-03-28"
  tasks: 13
  files_created: 12
  files_modified: 1
  commits: 2
---

# Phase 3 Plan 03: AI Engine Summary

**One-liner:** Full AI pipeline with Deepgram voice transcription, Claude Vision image-to-map, Meshy/Fal 3D/texture generation, circuit breakers, Redis caching, cost estimation, and quality gates wired into Hono.

## What Was Built

### Provider Wrappers (4 providers)

**`providers/anthropic.ts`** — Claude 3.5 Sonnet wrapper with:
- `claudeChat()`: standard completion with token counting + cost calculation
- `claudeChatStream()`: async generator for streaming responses
- `claudeVision()`: base64 or URL image analysis
- `estimateChatCost()`: pre-execution cost estimate (1 token ≈ 4 chars heuristic)
- Pricing table for Sonnet/Haiku/Opus

**`providers/deepgram.ts`** — Deepgram Nova-2 with:
- `transcribeAudio()`: REST POST for buffer → transcript, confidence, word timings
- `transcribeStream()`: WebSocket async generator for real-time streaming
- `estimateTranscriptionCost()`: $0.0043/min calculation

**`providers/meshy.ts`** — Meshy 3D generation with:
- `textTo3DComplete()` / `imageTo3DComplete()`: full pipeline create → poll → result
- Job polling every 5s, 10-minute timeout
- `.fbx` and `.glb` output URL handling
- Polygon count in result for quality gate

**`providers/fal.ts`** — Fal image/texture generation with:
- `generateImages()`: Flux Pro / Flux Pro Ultra / SDXL
- `generateTextures()`: PBR texture set (albedo, normal, roughness, metallic, AO)
- `batchGenerateImages()`: parallel batch via Promise.allSettled
- `estimateFalCost()`: per-image cost lookup

### Infrastructure

**`circuit-breaker.ts`**
- `CircuitBreaker` class: CLOSED → OPEN → HALF_OPEN state machine
- 3 retries with 1s/2s/4s exponential backoff
- `withFallback()`: tries primary, then each fallback in sequence
- Pre-configured singleton breakers: `anthropicBreaker`, `deepgramBreaker`, `meshyBreaker`, `falBreaker`
- Non-retryable error detection (401/403/400/API key errors skip retries)

**`cache.ts`**
- `buildCacheKey()`: SHA-256 hash of `provider:operation:input`, 40-char truncation
- `withCache()`: transparent wrap — cache hit returns cached, miss executes + stores
- 24hr TTL via Redis `EX`
- Hit counter increment (KEEPTTL), miss/hit logging
- `invalidateCache()` + `invalidateProviderCache()` for manual invalidation

**`cost-estimator.ts`**
- Per-operation base cost table for all 10 generation types
- `estimateCost(type)`: returns `TotalCostEstimate` with per-provider breakdown
- `usdToTokens()` / `tokensToUsd()`: 10,000 tokens = $1.00 conversion
- `formatCostForUser()`: "This generation will cost ~50 tokens (≈ $0.0050)"

**`quality-gate.ts`**
- `validate3DModel()`: polygon count check (<50k fail, <30k warn), output URL presence
- `validateImageResult()`: resolution check (>256px), URL presence
- `validateTranscript()`: confidence threshold (>0.75), word count
- `validateAIResponse()`: JSON validity, code block extraction, length
- `withQualityGate()`: generic retry wrapper — auto-retries with `enhanceInput` callback

**`pipeline.ts`** — Three pipeline functions:
- `terrainPipeline()`: Claude terrain plan → Fal texture (parallel), cache-aware, progress callbacks
- `cityPipeline()`: Claude city plan → Meshy buildings × N + Fal textures (all parallel)
- `assetsPipeline()`: Meshy models × N via Promise.allSettled
- All pipelines: `PipelineStep[]` tracking, error aggregation, cache hit counting

### Route Handlers (3 endpoints)

**`POST /api/ai/voice-to-game`** (`routes/ai/voice.ts`)
- Accepts: `multipart/form-data` with `audio` file OR `application/json` with `{ text }`
- Flow: Deepgram transcription → quality gate → Claude intent parsing → game commands JSON
- Cache: intent parsing results cached by normalized transcript
- Response: `{ transcript, transcriptConfidence, commands, tokens_spent, duration_ms, cached }`
- Target: <2s with cached intent (Deepgram ~300ms + Claude ~300ms typical)

**`POST /api/ai/image-to-map`** (`routes/ai/image.ts`)
- Accepts: `multipart/form-data` with `image` file (JPEG/PNG/WebP/GIF, max 5MB) OR JSON `{ imageUrl }`
- Flow: Claude Vision analysis → structured terrain + building layout JSON
- Cache: keyed by SHA-256 of image buffer + optional prompt
- Response: `{ layout, tokens_spent, duration_ms, cached }`
- Validates: file type, file size, response JSON quality

**`POST /api/ai/generate`** (`routes/ai/generate.ts`)
- Accepts: `{ mode, prompt, confirmed?, options? }`
- Two-phase: `confirmed: false` → returns estimate, `confirmed: true` → executes
- Modes: `terrain`, `city`, `assets`, `full-game`
- Full-game: runs all three pipelines in parallel via Promise.allSettled
- Response includes: step-by-step breakdown, progress history, cache hits, errors
- `GET /estimate`: cost estimates for all modes or single mode
- `GET /health`: circuit breaker states for all 4 providers

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Auth Guard] spendTokens imported inline in routes**
- **Found during:** Task 10
- **Issue:** `src/lib/tokens-server.ts` cannot be directly imported in `apps/api` without cross-package resolution complexity. Importing it would cause TS path errors.
- **Fix:** Re-implemented `spendTokens` inline in each route file using the same `db` transaction logic as the source. Functionally identical.
- **Files modified:** voice.ts, image.ts, generate.ts

**2. [Rule 2 - Missing Validation] File size + type validation on image upload**
- **Found during:** Task 11
- **Issue:** Plan didn't specify input validation for image uploads. Without it, users could upload arbitrarily large files or invalid formats.
- **Fix:** Added MIME type whitelist (JPEG/PNG/WebP/GIF) and 5MB file size limit with appropriate HTTP status codes (413, 400).
- **Files modified:** routes/ai/image.ts

**3. [Rule 2 - Missing Balance Check] Token balance pre-check before all AI calls**
- **Found during:** Tasks 10-12
- **Issue:** Plan specified "deduct tokens" but didn't explicitly note to check balance BEFORE making expensive API calls.
- **Fix:** All three routes check `tokenBalance` before any external AI call. Returns 402 with `required` and `available` counts.
- **Files modified:** voice.ts, image.ts, generate.ts

## Known Stubs

None. All pipelines execute real API calls. Fallbacks return template job IDs (e.g., `template-building-0`) when Meshy circuit is OPEN — this is intentional degraded behavior, not a stub. Fal texture fallback returns empty array, clearly marked in response.

## Self-Check

**Files exist:**
- `apps/api/src/lib/ai/providers/anthropic.ts` - FOUND
- `apps/api/src/lib/ai/providers/deepgram.ts` - FOUND
- `apps/api/src/lib/ai/providers/meshy.ts` - FOUND
- `apps/api/src/lib/ai/providers/fal.ts` - FOUND
- `apps/api/src/lib/ai/circuit-breaker.ts` - FOUND
- `apps/api/src/lib/ai/cache.ts` - FOUND
- `apps/api/src/lib/ai/cost-estimator.ts` - FOUND
- `apps/api/src/lib/ai/quality-gate.ts` - FOUND
- `apps/api/src/lib/ai/pipeline.ts` - FOUND
- `apps/api/src/routes/ai/voice.ts` - FOUND
- `apps/api/src/routes/ai/image.ts` - FOUND
- `apps/api/src/routes/ai/generate.ts` - FOUND

**Commits exist:**
- `71db71a` - feat(03-A): AI provider wrappers + pipeline infrastructure
- `2b18d7e` - feat(03-B): AI route handlers + wire into Hono app

## Self-Check: PASSED
