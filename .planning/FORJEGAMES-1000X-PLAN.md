# FORJEGAMES 1000X IMPLEMENTATION PLAN

## Master Blueprint -- 12 Weeks, 6 Phases

**Created:** 2026-04-01
**Last Updated:** 2026-04-01
**Author:** Architect Agent
**Codebase:** C:/Users/Dawse/OneDrive/Desktop/roblox-map-building

---

## TABLE OF CONTENTS

1. [Executive Summary](#executive-summary)
2. [Current Architecture Audit](#current-architecture-audit)
3. [Architecture Diagrams](#architecture-diagrams)
4. [Phase 1: Kill Demo Mode (Week 1-2)](#phase-1-kill-demo-mode-week-1-2)
5. [Phase 2: Mesh Pipeline (Week 3-4)](#phase-2-mesh-pipeline-week-3-4)
6. [Phase 3: Smart Connect (Week 5-6)](#phase-3-smart-connect-week-5-6)
7. [Phase 4: AI Orchestration (Week 7-8)](#phase-4-ai-orchestration-week-7-8)
8. [Phase 5: Magic UX (Week 9-10)](#phase-5-magic-ux-week-9-10)
9. [Phase 6: Scale & Monetize (Week 11-12)](#phase-6-scale--monetize-week-11-12)
10. [Risk Assessment](#risk-assessment)
11. [Revenue Projections](#revenue-projections)
12. [Competitive Moat Analysis](#competitive-moat-analysis)
13. [Dependency Map](#dependency-map)
14. [Environment Variables Required](#environment-variables-required)
15. [Testing Strategy](#testing-strategy)

---

## EXECUTIVE SUMMARY

ForjeGames is currently a well-scaffolded SaaS with a Next.js 15 frontend, Clerk auth, Stripe billing, Prisma/PostgreSQL backend, and a Roblox Studio plugin. The core AI flows -- chat, 3D generation, textures -- exist but fall back to demo responses when API keys are missing. The MCP client is a stub. The Studio plugin polls but has no real asset delivery pipeline.

This plan transforms ForjeGames from a demo into a production AI game builder in 12 weeks across 6 phases:

- **Phase 1 (Week 1-2):** Wire real AI backends. Kill demo mode. Real Meshy meshes, real Fal textures, real MCP tools.
- **Phase 2 (Week 3-4):** Build the full mesh pipeline: text -> AI gen -> Blender optimize -> Roblox upload -> Studio insert.
- **Phase 3 (Week 5-6):** Zero-friction Studio connection. Auto-detect plugin. One-click asset delivery.
- **Phase 4 (Week 7-8):** AI orchestration. "Build me a tycoon" -> AI plans 20+ tasks -> parallel generation.
- **Phase 5 (Week 9-10):** Magic UX. Voice commands, 3D preview, AI suggestions, collaborative building.
- **Phase 6 (Week 11-12):** Scale. Cost optimization, marketplace, Game DNA scanner, monitoring.

**Total estimated effort:** 960-1200 engineering hours
**Monthly infrastructure cost at scale:** $2,000-$5,000
**Revenue target at Week 12:** $15,000-$25,000 MRR

---

## CURRENT ARCHITECTURE AUDIT

### Tech Stack (from package.json)
- **Framework:** Next.js 15 (Turbopack), React 19
- **Auth:** Clerk (@clerk/nextjs ^6.0.0)
- **Database:** PostgreSQL via Prisma ^6.0.0
- **Cache/Queue:** ioredis ^5.4.1 (connected but no Bull queue)
- **Payments:** Stripe ^17.0.0
- **3D Preview:** React Three Fiber (@react-three/fiber ^9.5.0, @react-three/drei ^10.7.7)
- **Analytics:** PostHog (posthog-js, posthog-node)
- **Monitoring:** Sentry (@sentry/nextjs ^10.46.0)
- **Email:** Resend + React Email
- **Validation:** Zod
- **Desktop:** Electron ^33.0.0

### What Currently Works
1. **Clerk Auth** -- Full user lifecycle, COPPA compliance, parental consent
2. **Stripe Billing** -- 4 tiers (FREE/HOBBY/CREATOR/STUDIO), token packs, checkout
3. **Token Economy** -- Balance tracking, transactions, spend/grant
4. **Marketplace** -- Template CRUD, purchases, reviews, creator accounts, earnings
5. **Gamification** -- XP, achievements, streaks, tiers (NOVICE->MYTHIC)
6. **Team Collaboration** -- Teams, members, invites, zone locks, version control
7. **Game DNA Scanner** -- Schema exists, 12-variable genome model
8. **Studio Plugin** -- Full UI, auth handshake, sync loop, command execution
9. **API Keys + Webhooks** -- Key rotation, scoped access, delivery tracking
10. **Admin Panel** -- User management, template moderation, analytics

### What Is Stubbed / Demo-Only
1. **MCP Client** (`src/lib/mcp-client.ts`) -- Returns mock data, no real servers connected
2. **AI Chat** (`src/app/api/ai/chat/route.ts`) -- Falls back to demo responses when no ANTHROPIC_API_KEY
3. **3D Generation** (`src/app/api/ai/3d-generate/route.ts`) -- Real Meshy integration exists but untested end-to-end
4. **Texture Generation** (`src/app/api/ai/texture/route.ts`) -- Fal integration exists but demo fallback
5. **Agent Orchestrator** (`src/lib/agents/orchestrator.ts`) -- Framework exists, no real agent calls
6. **Build/Project Models** -- Schema exists but zero db.build/db.project calls in codebase
7. **Studio Asset Delivery** -- Plugin can execute Luau but no mesh/asset delivery pipeline
8. **Game DNA Scanner** -- Schema exists, no scanning implementation
9. **Job Queue** -- Redis connected, but no Bull/BullMQ queue for async jobs

### Database Schema Summary (40+ models)
The Prisma schema is production-grade with:
- User, Subscription, TokenBalance, TokenTransaction
- Template, TemplatePurchase, TemplateReview, CreatorAccount, CreatorEarning
- UserXP, XPEvent, Achievement, UserAchievement, Streak
- GameScan, GameGenome
- Team, TeamMember, TeamInvite, TeamActivity, ZoneLock, ProjectVersion, VersionDiff
- ApiKey, WebhookEndpoint, WebhookDelivery
- AuditLog, ApiUsageRecord, DailyCostSnapshot
- Build (orphan), Project (orphan)
- Notification, Referral, Waitlist, CharityDonation, TokenGrantJob

---

## ARCHITECTURE DIAGRAMS

### System Overview (Post-Implementation)

```
                            +------------------+
                            |   forjegames.com |
                            |   Next.js 15     |
                            +--------+---------+
                                     |
                    +----------------+----------------+
                    |                |                 |
              +-----v-----+   +-----v------+   +-----v------+
              | AI Routes  |   | Studio API |   | Billing    |
              | /api/ai/*  |   | /api/studio|   | /api/billing|
              +-----+------+   +-----+------+   +------------+
                    |                |
         +----------+---------+     |
         |          |         |     |
    +----v---+ +---v----+ +--v---+ |
    | Meshy  | | Fal.ai | | MCP  | |
    | API    | | API    | |Servers| |
    +----+---+ +---+----+ +--+---+ |
         |         |          |     |
         +----+----+----+----+     |
              |         |          |
         +----v---------v---+     |
         |  Job Queue       |     |
         |  BullMQ + Redis  |     |
         +----+-------------+     |
              |                    |
         +----v---------+    +---v-----------+
         | Blender       |    | Studio Plugin |
         | Docker        |    | (Lua)         |
         | Headless      |    | localhost:    |
         +----+----------+    | 34872        |
              |               +---+-----------+
         +----v---------+        |
         | Roblox Open  |        |
         | Cloud API    |<-------+
         | Asset Upload |
         +--------------+
```

### Data Flow: Text -> Asset in Studio

```
User types "medieval castle"
        |
        v
[1] POST /api/ai/chat
    - Intent detection -> "building"
    - Anthropic generates build plan
    - MCP terrain-forge called for context
        |
        v
[2] POST /api/ai/3d-generate
    - Meshy text-to-3d API called
    - Fal texture generation in parallel
    - Job created in BullMQ
        |
        v
[3] Job Worker picks up
    - Polls Meshy until SUCCEEDED
    - Downloads .glb to temp storage
    - Sends to Blender Docker container
        |
        v
[4] Blender Optimization
    - Decimate to target poly count
    - Clean up normals, manifold check
    - UV optimization
    - Export optimized .fbx
        |
        v
[5] Roblox Open Cloud Upload
    - POST /v1/assets with .fbx
    - Poll until asset processed
    - Get back rbxassetid://
        |
        v
[6] Asset Record Created
    - Prisma GeneratedAsset row
    - thumbnailUrl, meshUrl, assetId stored
        |
        v
[7] Push to Studio Plugin
    - Queue command: insert_asset
    - Plugin polls /api/studio/sync
    - Receives command with rbxassetid
    - InsertService:LoadAsset() in Studio
        |
        v
[8] Castle appears in Studio viewport
```

### Job Queue Architecture

```
+------------------+     +------------------+     +------------------+
| mesh-generation  |     | texture-gen      |     | blender-optimize |
| Queue            |     | Queue            |     | Queue            |
+--------+---------+     +--------+---------+     +--------+---------+
         |                        |                         |
         v                        v                         v
+------------------+     +------------------+     +------------------+
| MeshWorker       |     | TextureWorker    |     | BlenderWorker    |
| - createMeshyTask|     | - submitFal      |     | - Docker exec    |
| - pollMeshy      |     | - pollFal        |     | - decimate       |
| - downloadGlb    |     | - downloadPng    |     | - UV optimize    |
| - -> blender Q   |     | - save to S3/R2  |     | - -> upload Q    |
+------------------+     +------------------+     +------------------+
                                                           |
                                                           v
                                                  +------------------+
                                                  | upload-roblox    |
                                                  | Queue            |
                                                  +--------+---------+
                                                           |
                                                           v
                                                  +------------------+
                                                  | UploadWorker     |
                                                  | - Open Cloud API |
                                                  | - poll status    |
                                                  | - update DB      |
                                                  | - notify Studio  |
                                                  +------------------+
```

---

## PHASE 1: KILL DEMO MODE (Week 1-2)

**Goal:** Every AI feature returns real data. Zero demo responses. Users generate real assets.

### Task 1.1: Wire MCP Client to Real Servers

**File:** `src/lib/mcp-client.ts` (rewrite)

**What it does:**
- Replace the stub with a real MCP client that connects to MCP servers via Streamable HTTP
- Support server lifecycle: connect, call tool, disconnect
- Connection pool with health checks
- Retry logic with exponential backoff
- Response validation with Zod

**Current code (stub):**
```typescript
// Returns mock: { server, tool, success: true, demo: true, data: {...} }
```

**New implementation needs:**
```typescript
export interface McpServerConfig {
  name: string
  url: string          // e.g., "http://localhost:3001"
  apiKey?: string
  timeout: number      // ms
  retries: number
}

export interface McpToolCall {
  server: string
  tool: string
  arguments: Record<string, unknown>
}

export interface McpToolResult {
  server: string
  tool: string
  success: boolean
  data: unknown
  demo: false
  durationMs: number
}

// Server registry -- loaded from env or config
const MCP_SERVERS: Record<string, McpServerConfig> = {
  'terrain-forge': {
    name: 'terrain-forge',
    url: process.env.MCP_TERRAIN_FORGE_URL || 'http://localhost:3010',
    timeout: 30_000,
    retries: 2,
  },
  'city-architect': {
    name: 'city-architect',
    url: process.env.MCP_CITY_ARCHITECT_URL || 'http://localhost:3011',
    timeout: 30_000,
    retries: 2,
  },
  'asset-alchemist': {
    name: 'asset-alchemist',
    url: process.env.MCP_ASSET_ALCHEMIST_URL || 'http://localhost:3012',
    timeout: 60_000,
    retries: 3,
  },
}

export async function callTool(
  server: string,
  tool: string,
  args: Record<string, unknown>
): Promise<McpToolResult>

export async function listTools(server: string): Promise<ToolDefinition[]>
export function detectMcpIntent(userMessage: string, aiResponse: string): McpToolCall | null
```

**API spec:** N/A (internal library)

**Dependencies to install:**
```bash
npm install @modelcontextprotocol/sdk
```

**Database changes:** None

**How to test:**
- Unit test: Mock MCP server with nock, verify callTool sends correct JSON-RPC
- Integration: Start local MCP server, call terrain-forge/generate-terrain, verify response schema
- Edge case: Server down -> verify retry + fallback

**Effort:** 8 hours

---

### Task 1.2: Wire AI Chat to Real Anthropic

**File:** `src/app/api/ai/chat/route.ts` (modify)

**What it does:**
- Remove all demo response code paths
- Always use Anthropic API (require ANTHROPIC_API_KEY)
- Stream responses using Anthropic's streaming API
- Integrate MCP tool calls mid-conversation
- Track token usage per call, deduct from user balance

**Current state:** Has DEMO_RESPONSES map returning static strings per intent.

**Changes needed:**
1. Remove `DEMO_RESPONSES` constant entirely
2. Remove all `if (!client)` demo fallback branches
3. Always call `getAnthropicClient()` -- throw 503 if no key
4. Add streaming response:
```typescript
// Use Anthropic streaming
const stream = await client.messages.stream({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 4096,
  system: FORJEAI_SYSTEM_PROMPT,
  messages: conversationHistory,
  tools: mcpToolDefinitions, // Expose MCP tools to Claude
})

// Return as SSE stream
const encoder = new TextEncoder()
const readable = new ReadableStream({
  async start(controller) {
    for await (const event of stream) {
      if (event.type === 'content_block_delta') {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
      }
      if (event.type === 'message_stop') {
        // Track usage
        const usage = stream.finalMessage()
        await recordApiUsage(userId, 'anthropic', 'chat', usage.usage.input_tokens + usage.usage.output_tokens)
        await spendTokens(userId, calculateCost(usage), 'AI Chat')
      }
    }
    controller.close()
  }
})

return new Response(readable, {
  headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' }
})
```

5. Add tool_use handling for MCP calls:
```typescript
// When Claude wants to use a tool
if (event.type === 'content_block_start' && event.content_block.type === 'tool_use') {
  const toolCall = event.content_block
  const result = await callTool(toolCall.name.split('/')[0], toolCall.name.split('/')[1], toolCall.input)
  // Feed result back to Claude
}
```

**API spec:**
```
POST /api/ai/chat
Content-Type: application/json
Authorization: Bearer <clerk-session>

Request:
{
  "message": "build me a medieval castle",
  "conversationId": "conv_abc123",  // optional, for history
  "sessionId": "studio_xyz"         // optional, for Studio sync
}

Response: text/event-stream (SSE)
data: {"type":"content_block_delta","delta":{"text":"Here's..."}}
data: {"type":"tool_use","tool":"terrain-forge/analyze","input":{...}}
data: {"type":"tool_result","result":{...}}
data: {"type":"message_stop","usage":{"input_tokens":150,"output_tokens":800}}
```

**Database changes:** None (uses existing ApiUsageRecord, TokenTransaction)

**Dependencies to install:**
```bash
npm install @anthropic-ai/sdk   # already in package.json but verify version
```

**How to test:**
- Set ANTHROPIC_API_KEY in .env.local
- Send POST with message "build a small house"
- Verify SSE stream returns real Luau code
- Verify token balance decremented
- Verify ApiUsageRecord created

**Effort:** 12 hours

---

### Task 1.3: Wire 3D Generation to Real Meshy

**File:** `src/app/api/ai/3d-generate/route.ts` (modify)

**What it does:**
- The Meshy integration code already exists (createMeshyTask, pollMeshyTask)
- Need to: add proper error handling, move polling to job queue (Task 1.5), store results
- Currently blocks the HTTP request during polling (up to 140 seconds!) -- unacceptable

**Changes needed:**
1. Convert synchronous poll to async job:
```typescript
// Instead of:
const task = await pollMeshyTask(taskId, meshyKey)  // blocks 45-140s!

// Do:
await meshGenerationQueue.add('generate-mesh', {
  taskId,
  meshyKey,
  userId,
  input,
  enrichedPrompt,
})

return NextResponse.json({
  status: 'queued',
  jobId: taskId,
  pollUrl: `/api/ai/mesh?taskId=${taskId}`,
  estimatedTime: estimateTime(input),
})
```

2. Create polling endpoint (already exists at `src/app/api/ai/mesh/route.ts` but needs update)

3. Add webhook endpoint for Meshy callbacks:
```typescript
// POST /api/webhooks/meshy
// Meshy calls this when generation completes
```

**API spec (updated):**
```
POST /api/ai/3d-generate
Response: { status: "queued", jobId: "...", pollUrl: "/api/ai/mesh?taskId=..." }

GET /api/ai/mesh?taskId=<id>
Response: {
  status: "queued" | "generating" | "optimizing" | "complete" | "failed",
  progress: 0-100,
  asset: { meshUrl, textureUrls, thumbnailUrl, polyCount, ... } | null,
  luauCode: string | null
}

POST /api/webhooks/meshy  (Meshy callback)
Body: { task_id, status, model_urls, ... }
```

**Database changes:** See Task 1.6 (GeneratedAsset model)

**Dependencies:** None new

**How to test:**
- Set MESHY_API_KEY in .env.local
- POST with type "building", prompt "medieval castle tower"
- Verify returns jobId immediately (no blocking)
- Poll /api/ai/mesh?taskId=... until status "complete"
- Verify meshUrl is a valid Meshy CDN URL
- Download .glb, verify it opens in 3D viewer

**Effort:** 10 hours

---

### Task 1.4: Wire Texture Generation to Real Fal.ai

**File:** `src/app/api/ai/texture/route.ts` (modify)

**What it does:**
- Fal.ai integration exists but is demo-first
- Need to: ensure real Fal calls work end-to-end, async via job queue, proper PBR output

**Changes needed:**
1. Remove demo response fallback
2. Move Fal polling to job queue (same pattern as Meshy)
3. Add proper Fal model selection:
```typescript
// Use fal-ai/flux-pro for high-quality textures
// Use fal-ai/fast-sdxl for fast previews
const model = input.quality === 'high' ? 'fal-ai/flux-pro/v1.1' : 'fal-ai/fast-sdxl'
```

4. Add PBR map generation:
```typescript
// Step 1: Generate albedo with Fal
// Step 2: Use fal-ai/illusion-diffusion or custom pipeline for normal map
// Step 3: Derive roughness from albedo using grayscale transform
// Step 4: Metallic map based on material keywords
```

5. Store generated textures in R2/S3 (not just return Fal CDN URLs which expire)

**API spec:**
```
POST /api/ai/texture
Content-Type: application/json

Request:
{
  "prompt": "cobblestone wall texture",
  "resolution": "1024",       // "512" | "1024" | "2048"
  "seamless": true,
  "pbrMaps": true,            // generate normal + roughness
  "quality": "high"           // "fast" | "high"
}

Response (immediate):
{ "status": "queued", "jobId": "tex_abc123", "pollUrl": "/api/ai/texture/status?id=tex_abc123" }

GET /api/ai/texture/status?id=<jobId>
Response:
{
  "status": "complete",
  "textures": {
    "albedo":    "https://r2.forjegames.com/textures/abc123_albedo.png",
    "normal":    "https://r2.forjegames.com/textures/abc123_normal.png",
    "roughness": "https://r2.forjegames.com/textures/abc123_roughness.png",
    "metallic":  null
  },
  "resolution": "1024",
  "costTokens": 30,
  "luauCode": "-- SurfaceAppearance setup code..."
}
```

**Database changes:** See Task 1.6

**Dependencies to install:**
```bash
npm install @fal-ai/client    # official Fal client
```

**How to test:**
- Set FAL_KEY in .env.local
- POST with prompt "stone brick wall", resolution "1024", seamless true
- Verify returns valid image URLs
- Download albedo PNG, verify 1024x1024
- Verify texture tiles seamlessly

**Effort:** 8 hours

---

### Task 1.5: Add Job Queue (BullMQ + Redis)

**Files to create:**
- `src/lib/queue/connection.ts` -- Redis connection for BullMQ
- `src/lib/queue/mesh-worker.ts` -- Mesh generation worker
- `src/lib/queue/texture-worker.ts` -- Texture generation worker
- `src/lib/queue/queues.ts` -- Queue definitions and exports
- `src/app/api/ai/jobs/[jobId]/route.ts` -- Universal job status endpoint

**What it does:**
- BullMQ queue system on top of existing ioredis connection
- Named queues: `mesh-generation`, `texture-generation`, `blender-optimize`, `roblox-upload`
- Workers process jobs async, update status in Redis
- Job progress tracked via BullMQ events
- Dead letter queue for failed jobs with 3 retries

**Implementation:**

```typescript
// src/lib/queue/connection.ts
import { Queue, Worker, QueueEvents } from 'bullmq'
import IORedis from 'ioredis'

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null, // Required by BullMQ
})

export { connection }
```

```typescript
// src/lib/queue/queues.ts
import { Queue } from 'bullmq'
import { connection } from './connection'

export const meshQueue = new Queue('mesh-generation', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { age: 86400 }, // keep 24h
    removeOnFail: { age: 604800 },    // keep 7d
  },
})

export const textureQueue = new Queue('texture-generation', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 3000 },
    removeOnComplete: { age: 86400 },
    removeOnFail: { age: 604800 },
  },
})

export const blenderQueue = new Queue('blender-optimize', {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'fixed', delay: 10000 },
    removeOnComplete: { age: 86400 },
    removeOnFail: { age: 604800 },
  },
})

export const uploadQueue = new Queue('roblox-upload', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { age: 86400 },
    removeOnFail: { age: 604800 },
  },
})
```

```typescript
// src/lib/queue/mesh-worker.ts
import { Worker, Job } from 'bullmq'
import { connection } from './connection'
import { blenderQueue } from './queues'
import { db } from '@/lib/db'

interface MeshJobData {
  userId: string
  taskId: string
  meshyKey: string
  prompt: string
  enrichedPrompt: string
  polyTarget: number
  artStyle: string
  type: string
  style: string
}

const meshWorker = new Worker('mesh-generation', async (job: Job<MeshJobData>) => {
  const { taskId, meshyKey, userId, prompt, type } = job.data

  // Poll Meshy until complete
  let attempt = 0
  const maxAttempts = 60
  const interval = 3000

  while (attempt < maxAttempts) {
    await new Promise(r => setTimeout(r, interval))
    attempt++

    const res = await fetch(`https://api.meshy.ai/v2/text-to-3d/${taskId}`, {
      headers: { Authorization: `Bearer ${meshyKey}` },
    })

    if (!res.ok) continue

    const task = await res.json()
    await job.updateProgress(task.progress || Math.floor((attempt / maxAttempts) * 100))

    if (task.status === 'SUCCEEDED') {
      const meshUrl = task.model_urls?.glb || task.model_urls?.fbx || null

      // Update DB
      await db.generatedAsset.update({
        where: { id: job.data.taskId },
        data: {
          status: 'OPTIMIZING',
          meshUrl,
          polyCount: task.polygon_count,
          thumbnailUrl: task.thumbnail_url,
        },
      })

      // Chain to Blender optimization
      await blenderQueue.add('optimize', {
        assetId: job.data.taskId,
        meshUrl,
        polyTarget: job.data.polyTarget,
        userId,
      })

      return { meshUrl, polyCount: task.polygon_count }
    }

    if (task.status === 'FAILED' || task.status === 'EXPIRED') {
      throw new Error(`Meshy task ${taskId} failed: ${task.status}`)
    }
  }

  throw new Error(`Meshy task ${taskId} timed out after ${maxAttempts} attempts`)
}, { connection, concurrency: 5 })

export { meshWorker }
```

**API spec (job status):**
```
GET /api/ai/jobs/[jobId]
Response:
{
  "id": "job_abc123",
  "queue": "mesh-generation",
  "status": "active" | "completed" | "failed" | "waiting" | "delayed",
  "progress": 65,
  "result": { ... } | null,
  "error": "..." | null,
  "createdAt": "2026-04-01T...",
  "processedAt": "2026-04-01T..." | null,
  "finishedAt": "2026-04-01T..." | null,
  "attempts": 1
}
```

**Dependencies to install:**
```bash
npm install bullmq
```

**Database changes:** None (BullMQ uses Redis)

**How to test:**
- Start Redis locally
- Add job to meshQueue with test data
- Verify worker picks up and processes
- Verify progress updates via QueueEvents
- Verify failed jobs go to DLQ after 3 attempts
- Verify job status endpoint returns correct data

**Effort:** 16 hours

---

### Task 1.6: Add GeneratedAsset Prisma Model + Status Polling

**File:** `prisma/schema.prisma` (modify)

**Database changes:**

```prisma
// ---- Generated Assets -------------------------------------------------------

enum AssetGenerationStatus {
  QUEUED
  GENERATING
  OPTIMIZING
  UPLOADING
  READY
  FAILED
  EXPIRED
}

enum AssetType {
  BUILDING
  CHARACTER
  VEHICLE
  WEAPON
  FURNITURE
  TERRAIN
  PROP
  EFFECT
  CUSTOM
  TEXTURE
}

model GeneratedAsset {
  id              String                @id @default(cuid())
  userId          String
  type            AssetType
  prompt          String                @db.Text
  style           String                @default("roblox")
  status          AssetGenerationStatus @default(QUEUED)
  progress        Int                   @default(0)

  // Meshy
  meshyTaskId     String?               @unique
  meshUrl         String?
  thumbnailUrl    String?
  polyCount       Int?
  vertexCount     Int?
  fileSize        Int?                  // bytes

  // Fal textures
  albedoUrl       String?
  normalUrl       String?
  roughnessUrl    String?
  metallicUrl     String?

  // Blender optimization
  optimizedMeshUrl String?
  optimizedPolyCount Int?

  // Roblox upload
  robloxAssetId   String?               // rbxassetid://
  robloxUploadStatus String?

  // Luau code
  luauCode        String?               @db.Text

  // Cost tracking
  tokensCost      Int                   @default(0)
  meshyCostUsd    Float?
  falCostUsd      Float?

  // Error info
  errorMessage    String?
  errorCode       String?

  // Job queue reference
  jobId           String?

  createdAt       DateTime              @default(now())
  updatedAt       DateTime              @updatedAt
  completedAt     DateTime?
  expiresAt       DateTime?             // CDN URLs expire

  @@index([userId])
  @@index([userId, status])
  @@index([userId, createdAt])
  @@index([status])
  @@index([meshyTaskId])
  @@index([robloxAssetId])
  @@index([createdAt])
}
```

**Files to modify:**
- `prisma/schema.prisma` -- Add model above
- `src/app/api/ai/3d-generate/route.ts` -- Create GeneratedAsset row on submission
- `src/app/api/ai/mesh/route.ts` -- Query GeneratedAsset for status

**API spec (updated mesh polling):**
```
GET /api/ai/mesh?taskId=<meshyTaskId>
Response:
{
  "id": "asset_abc123",
  "status": "generating",
  "progress": 45,
  "asset": {
    "meshUrl": null,
    "thumbnailUrl": null,
    "polyCount": null,
    "textureUrls": { "albedo": null, "normal": null, "roughness": null, "metallic": null },
    "robloxAssetId": null
  },
  "estimatedTimeRemaining": "~30s"
}
```

**How to test:**
- Run `npx prisma migrate dev --name add-generated-assets`
- POST /api/ai/3d-generate
- Verify GeneratedAsset row created with status QUEUED
- As job progresses, verify status updates: GENERATING -> OPTIMIZING -> UPLOADING -> READY
- Verify polling endpoint returns correct status at each stage

**Effort:** 6 hours

---

### Task 1.7: Webhook Endpoint for Meshy Callbacks

**File to create:** `src/app/api/webhooks/meshy/route.ts`

**What it does:**
- Receives POST callbacks from Meshy when generation completes
- Validates webhook signature (Meshy uses HMAC)
- Updates GeneratedAsset status
- Triggers next pipeline step (Blender optimization)

**Implementation:**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { blenderQueue } from '@/lib/queue/queues'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('x-meshy-signature')

  // Verify signature
  const expected = crypto
    .createHmac('sha256', process.env.MESHY_WEBHOOK_SECRET || '')
    .update(body)
    .digest('hex')

  if (signature !== expected) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const payload = JSON.parse(body)
  const { task_id, status, model_urls, polygon_count, thumbnail_url } = payload

  // Find asset
  const asset = await db.generatedAsset.findUnique({
    where: { meshyTaskId: task_id },
  })

  if (!asset) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
  }

  if (status === 'SUCCEEDED') {
    const meshUrl = model_urls?.glb || model_urls?.fbx || null

    await db.generatedAsset.update({
      where: { id: asset.id },
      data: {
        status: 'OPTIMIZING',
        meshUrl,
        polyCount: polygon_count,
        thumbnailUrl: thumbnail_url,
        progress: 50,
      },
    })

    // Chain to Blender
    await blenderQueue.add('optimize', {
      assetId: asset.id,
      meshUrl,
      polyTarget: 5000,
      userId: asset.userId,
    })
  } else if (status === 'FAILED' || status === 'EXPIRED') {
    await db.generatedAsset.update({
      where: { id: asset.id },
      data: {
        status: 'FAILED',
        errorMessage: `Meshy generation ${status.toLowerCase()}`,
      },
    })
  }

  return NextResponse.json({ received: true })
}
```

**API spec:**
```
POST /api/webhooks/meshy
Headers: x-meshy-signature: <hmac>
Body: { task_id, status, model_urls, polygon_count, thumbnail_url, ... }
Response: { received: true }
```

**Database changes:** None (uses GeneratedAsset from Task 1.6)

**How to test:**
- Use ngrok for local webhook testing
- Register webhook URL with Meshy
- Generate a mesh, verify webhook fires
- Verify GeneratedAsset updated correctly
- Verify Blender job queued

**Effort:** 4 hours

---

### Phase 1 Summary

| Task | File(s) | Effort | Dependencies |
|------|---------|--------|--------------|
| 1.1 MCP Client | src/lib/mcp-client.ts | 8h | @modelcontextprotocol/sdk |
| 1.2 AI Chat | src/app/api/ai/chat/route.ts | 12h | @anthropic-ai/sdk |
| 1.3 3D Generate | src/app/api/ai/3d-generate/route.ts | 10h | Task 1.5, 1.6 |
| 1.4 Textures | src/app/api/ai/texture/route.ts | 8h | @fal-ai/client, Task 1.5 |
| 1.5 Job Queue | src/lib/queue/*.ts | 16h | bullmq |
| 1.6 DB Schema | prisma/schema.prisma | 6h | - |
| 1.7 Meshy Webhook | src/app/api/webhooks/meshy/route.ts | 4h | Task 1.6 |
| **Total** | | **64h** | |

**Phase 1 Risks:**
- Meshy API rate limits (50 concurrent tasks on Pro plan)
- Fal.ai model availability -- flux-pro may have queue delays
- Redis connection stability for BullMQ
- Anthropic streaming edge cases (tool_use mid-stream)

**Mitigation:**
- Implement circuit breaker pattern for external APIs
- Fall back to fast-sdxl if flux-pro is slow
- BullMQ has built-in retry + DLQ
- Test streaming extensively with various tool_use patterns

---

## PHASE 2: MESH PIPELINE (Week 3-4)

**Goal:** Complete text-to-Studio pipeline. Generated meshes arrive in Studio optimized and ready.

### Task 2.1: Blender Headless Docker Container

**Files to create:**
- `docker/blender/Dockerfile`
- `docker/blender/optimize.py` -- Blender Python optimization script
- `docker/blender/entrypoint.sh`
- `docker/docker-compose.yml` (or extend existing)
- `src/lib/queue/blender-worker.ts`

**What it does:**
- Docker container with Blender 4.3 headless
- Accepts .glb/.fbx input, runs optimization pipeline
- Outputs optimized .fbx ready for Roblox import
- Quality gates: poly count, file size, manifold check, UV check

**Dockerfile:**
```dockerfile
FROM nytimes/blender:4.3-cpu-ubuntu22.04

WORKDIR /app
COPY optimize.py /app/optimize.py
COPY entrypoint.sh /app/entrypoint.sh

RUN chmod +x /app/entrypoint.sh

# Install Python deps for the optimization script
RUN pip install --no-cache-dir trimesh numpy

ENTRYPOINT ["/app/entrypoint.sh"]
```

**optimize.py (core logic):**
```python
import bpy
import sys
import json
import os

def optimize_mesh(input_path, output_path, target_polys=5000):
    """
    Full optimization pipeline:
    1. Import mesh
    2. Remove loose geometry
    3. Recalculate normals
    4. Decimate to target poly count
    5. UV unwrap if missing
    6. Manifold check + fix
    7. Scale to Roblox units (1 stud = 0.28m)
    8. Export as .fbx
    """
    # Clear scene
    bpy.ops.wm.read_factory_settings(use_empty=True)

    # Import
    ext = os.path.splitext(input_path)[1].lower()
    if ext == '.glb' or ext == '.gltf':
        bpy.ops.import_scene.gltf(filepath=input_path)
    elif ext == '.fbx':
        bpy.ops.import_scene.fbx(filepath=input_path)
    elif ext == '.obj':
        bpy.ops.wm.obj_import(filepath=input_path)

    # Select all mesh objects
    mesh_objects = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH']
    if not mesh_objects:
        raise ValueError("No mesh objects found in file")

    results = {
        'original_polys': 0,
        'final_polys': 0,
        'is_manifold': True,
        'has_uvs': True,
        'file_size': 0,
        'dimensions': {'x': 0, 'y': 0, 'z': 0},
    }

    for obj in mesh_objects:
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)

        # Count original polys
        results['original_polys'] += len(obj.data.polygons)

        # Enter edit mode for operations
        bpy.ops.object.mode_set(mode='EDIT')

        # Remove loose vertices/edges
        bpy.ops.mesh.select_all(action='SELECT')
        bpy.ops.mesh.delete_loose()

        # Recalculate normals
        bpy.ops.mesh.normals_make_consistent(inside=False)

        # Make manifold
        bpy.ops.mesh.select_all(action='SELECT')
        bpy.ops.mesh.fill_holes(sides=4)

        bpy.ops.object.mode_set(mode='OBJECT')

    # Calculate total polys and decide decimation ratio
    total_polys = sum(len(obj.data.polygons) for obj in mesh_objects)
    if total_polys > target_polys:
        ratio = target_polys / total_polys
        for obj in mesh_objects:
            mod = obj.modifiers.new('Decimate', 'DECIMATE')
            mod.ratio = max(ratio, 0.05)  # never go below 5%
            bpy.context.view_layer.objects.active = obj
            bpy.ops.object.modifier_apply(modifier=mod.name)

    # UV check
    for obj in mesh_objects:
        if not obj.data.uv_layers:
            results['has_uvs'] = False
            bpy.context.view_layer.objects.active = obj
            bpy.ops.object.mode_set(mode='EDIT')
            bpy.ops.mesh.select_all(action='SELECT')
            bpy.ops.uv.smart_project(angle_limit=66, island_margin=0.02)
            bpy.ops.object.mode_set(mode='OBJECT')

    # Scale to Roblox (assume 1 blender unit = 1 meter, 1 stud = 0.28m)
    # Don't rescale -- just record dimensions
    for obj in mesh_objects:
        dims = obj.dimensions
        results['dimensions'] = {
            'x': round(dims.x / 0.28, 1),  # studs
            'y': round(dims.y / 0.28, 1),
            'z': round(dims.z / 0.28, 1),
        }

    # Final poly count
    results['final_polys'] = sum(len(obj.data.polygons) for obj in mesh_objects)

    # Export
    bpy.ops.export_scene.fbx(
        filepath=output_path,
        use_selection=False,
        global_scale=1.0,
        apply_scale_options='FBX_SCALE_ALL',
        bake_space_transform=True,
        mesh_smooth_type='EDGE',
        use_mesh_modifiers=True,
    )

    results['file_size'] = os.path.getsize(output_path)

    # Output results as JSON to stdout
    print("RESULT:" + json.dumps(results))

if __name__ == '__main__':
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    target_polys = int(sys.argv[3]) if len(sys.argv) > 3 else 5000
    optimize_mesh(input_path, output_path, target_polys)
```

**Blender Worker:**
```typescript
// src/lib/queue/blender-worker.ts
import { Worker, Job } from 'bullmq'
import { connection } from './connection'
import { uploadQueue } from './queues'
import { db } from '@/lib/db'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)

interface BlenderJobData {
  assetId: string
  meshUrl: string
  polyTarget: number
  userId: string
}

const blenderWorker = new Worker('blender-optimize', async (job: Job<BlenderJobData>) => {
  const { assetId, meshUrl, polyTarget, userId } = job.data
  const tmpDir = path.join('/tmp', `blender-${assetId}`)
  await fs.mkdir(tmpDir, { recursive: true })

  try {
    // Download mesh from URL
    const inputPath = path.join(tmpDir, 'input.glb')
    const outputPath = path.join(tmpDir, 'output.fbx')

    const response = await fetch(meshUrl)
    const buffer = Buffer.from(await response.arrayBuffer())
    await fs.writeFile(inputPath, buffer)

    await job.updateProgress(25)

    // Run Blender optimization
    const { stdout, stderr } = await execAsync(
      `docker exec forjegames-blender blender --background --python /app/optimize.py -- ${inputPath} ${outputPath} ${polyTarget}`,
      { timeout: 120_000 }
    )

    // Parse result from stdout
    const resultLine = stdout.split('\n').find(l => l.startsWith('RESULT:'))
    const result = resultLine ? JSON.parse(resultLine.replace('RESULT:', '')) : null

    await job.updateProgress(75)

    // Read optimized file
    const optimizedBuffer = await fs.readFile(outputPath)

    // Upload to R2/S3
    const optimizedUrl = await uploadToStorage(assetId, optimizedBuffer, 'fbx')

    // Update DB
    await db.generatedAsset.update({
      where: { id: assetId },
      data: {
        status: 'UPLOADING',
        optimizedMeshUrl: optimizedUrl,
        optimizedPolyCount: result?.final_polys,
        progress: 75,
      },
    })

    // Chain to Roblox upload
    await uploadQueue.add('upload-roblox', {
      assetId,
      meshUrl: optimizedUrl,
      userId,
    })

    return result
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true })
  }
}, { connection, concurrency: 2 })

async function uploadToStorage(assetId: string, buffer: Buffer, ext: string): Promise<string> {
  // Upload to Cloudflare R2 or S3
  // Implementation depends on storage provider
  // Return public URL
  const key = `assets/${assetId}/optimized.${ext}`
  // ... S3 PutObject or R2 upload ...
  return `https://assets.forjegames.com/${key}`
}

export { blenderWorker }
```

**How to test:**
- Build Docker image: `docker build -t forjegames-blender docker/blender/`
- Run container: `docker run -d --name forjegames-blender forjegames-blender`
- Test with a sample .glb file
- Verify output .fbx has <= target polys
- Verify normals are correct
- Verify file size is reasonable (<5MB)
- Import .fbx into Roblox Studio manually to verify

**Dependencies to install:**
```bash
npm install @aws-sdk/client-s3    # For R2/S3 upload
```

**Effort:** 20 hours

---

### Task 2.2: Roblox Open Cloud Asset Upload

**Files to create:**
- `src/lib/roblox-open-cloud.ts` -- Open Cloud API wrapper
- `src/lib/queue/upload-worker.ts` -- Upload worker

**What it does:**
- Takes optimized .fbx from Blender
- Uploads to Roblox via Open Cloud Assets API v1
- Polls for processing completion
- Returns rbxassetid:// that can be used in Studio

**Implementation:**

```typescript
// src/lib/roblox-open-cloud.ts

const OPEN_CLOUD_BASE = 'https://apis.roblox.com'

export interface RobloxUploadResult {
  assetId: string       // numeric asset ID
  rbxAssetUrl: string   // rbxassetid://12345
  status: 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED'
}

export async function uploadAsset(
  fileBuffer: Buffer,
  fileName: string,
  assetType: 'Model' | 'Decal' | 'Audio',
  displayName: string,
  description: string,
  creatorId: string,      // Roblox user or group ID
  creatorType: 'User' | 'Group',
): Promise<{ operationId: string }> {
  const apiKey = process.env.ROBLOX_OPEN_CLOUD_API_KEY
  if (!apiKey) throw new Error('ROBLOX_OPEN_CLOUD_API_KEY not set')

  const formData = new FormData()
  const blob = new Blob([fileBuffer])

  const request = JSON.stringify({
    assetType,
    displayName,
    description,
    creationContext: {
      creator: {
        userId: creatorType === 'User' ? creatorId : undefined,
        groupId: creatorType === 'Group' ? creatorId : undefined,
      },
    },
  })

  formData.append('request', request)
  formData.append('fileContent', blob, fileName)

  const res = await fetch(`${OPEN_CLOUD_BASE}/v1/assets`, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
    },
    body: formData,
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Roblox upload failed (${res.status}): ${err}`)
  }

  const data = await res.json()
  return { operationId: data.operationId || data.path }
}

export async function pollOperation(operationId: string): Promise<RobloxUploadResult> {
  const apiKey = process.env.ROBLOX_OPEN_CLOUD_API_KEY!

  const res = await fetch(`${OPEN_CLOUD_BASE}/v1/operations/${operationId}`, {
    headers: { 'x-api-key': apiKey },
  })

  if (!res.ok) throw new Error(`Operation poll failed: ${res.status}`)

  const data = await res.json()

  if (data.done) {
    const assetId = data.response?.assetId || data.response?.path?.split('/').pop()
    return {
      assetId,
      rbxAssetUrl: `rbxassetid://${assetId}`,
      status: 'READY',
    }
  }

  return {
    assetId: '',
    rbxAssetUrl: '',
    status: data.metadata?.status === 'FAILED' ? 'FAILED' : 'PROCESSING',
  }
}
```

**Upload Worker:**
```typescript
// src/lib/queue/upload-worker.ts
import { Worker, Job } from 'bullmq'
import { connection } from './connection'
import { db } from '@/lib/db'
import { uploadAsset, pollOperation } from '@/lib/roblox-open-cloud'
import { queueCommand } from '@/lib/studio-session'

interface UploadJobData {
  assetId: string
  meshUrl: string
  userId: string
  sessionId?: string  // Studio session to notify
}

const uploadWorker = new Worker('roblox-upload', async (job: Job<UploadJobData>) => {
  const { assetId, meshUrl, userId, sessionId } = job.data

  // Download optimized mesh
  const response = await fetch(meshUrl)
  const buffer = Buffer.from(await response.arrayBuffer())

  // Get asset info
  const asset = await db.generatedAsset.findUnique({ where: { id: assetId } })
  if (!asset) throw new Error(`Asset ${assetId} not found`)

  await job.updateProgress(10)

  // Upload to Roblox
  const { operationId } = await uploadAsset(
    buffer,
    `forjegames_${assetId}.fbx`,
    'Model',
    asset.prompt.slice(0, 50),
    `Generated by ForjeGames AI - ${asset.prompt}`,
    process.env.ROBLOX_CREATOR_ID || '',
    'User',
  )

  await job.updateProgress(30)

  // Poll until complete
  let attempts = 0
  const maxAttempts = 30
  const pollInterval = 5000

  while (attempts < maxAttempts) {
    await new Promise(r => setTimeout(r, pollInterval))
    attempts++
    await job.updateProgress(30 + Math.floor((attempts / maxAttempts) * 60))

    const result = await pollOperation(operationId)

    if (result.status === 'READY') {
      // Update DB
      await db.generatedAsset.update({
        where: { id: assetId },
        data: {
          status: 'READY',
          robloxAssetId: result.rbxAssetUrl,
          progress: 100,
          completedAt: new Date(),
        },
      })

      // Notify Studio plugin if connected
      if (sessionId) {
        queueCommand(sessionId, {
          type: 'insert_asset',
          data: {
            assetId: result.rbxAssetUrl,
            name: asset.prompt.slice(0, 50),
            type: asset.type,
          },
        })
      }

      return result
    }

    if (result.status === 'FAILED') {
      throw new Error(`Roblox upload processing failed for asset ${assetId}`)
    }
  }

  throw new Error(`Roblox upload timed out for asset ${assetId}`)
}, { connection, concurrency: 3 })

export { uploadWorker }
```

**API spec:**
```
GET /api/ai/mesh?taskId=<id>  (updated to include robloxAssetId)
Response:
{
  "status": "ready",
  "asset": {
    "meshUrl": "https://assets.forjegames.com/...",
    "robloxAssetId": "rbxassetid://123456789",
    "thumbnailUrl": "...",
    "polyCount": 3200,
    "optimizedPolyCount": 2800,
    "textureUrls": { ... }
  }
}
```

**How to test:**
- Set ROBLOX_OPEN_CLOUD_API_KEY in .env.local
- Upload a test .fbx file
- Verify operation completes
- Verify rbxassetid:// works in Studio
- Insert asset via InsertService:LoadAsset()

**Effort:** 16 hours

---

### Task 2.3: Quality Gates

**File to create:** `src/lib/quality-gates.ts`

**What it does:**
- Validates generated meshes before Roblox upload
- Checks: poly count, file size, manifold, UV completeness, dimensions
- Returns pass/fail with details
- Blocks pipeline if quality fails

**Implementation:**
```typescript
export interface QualityReport {
  passed: boolean
  score: number          // 0-100
  checks: QualityCheck[]
  recommendations: string[]
}

export interface QualityCheck {
  name: string
  passed: boolean
  value: number | string
  threshold: number | string
  severity: 'error' | 'warning' | 'info'
}

export function validateMesh(params: {
  polyCount: number
  targetPolys: number
  fileSize: number        // bytes
  isManifold: boolean
  hasUVs: boolean
  dimensions: { x: number; y: number; z: number }  // studs
  type: string
}): QualityReport {
  const checks: QualityCheck[] = []
  const recommendations: string[] = []

  // Poly count check
  const polyRatio = params.polyCount / params.targetPolys
  checks.push({
    name: 'Polygon Count',
    passed: polyRatio <= 1.2,  // 20% tolerance
    value: params.polyCount,
    threshold: params.targetPolys,
    severity: polyRatio > 2 ? 'error' : 'warning',
  })

  // File size check (max 8MB for Roblox)
  const maxSize = 8 * 1024 * 1024
  checks.push({
    name: 'File Size',
    passed: params.fileSize <= maxSize,
    value: `${(params.fileSize / 1024 / 1024).toFixed(1)} MB`,
    threshold: '8 MB',
    severity: params.fileSize > maxSize ? 'error' : 'info',
  })

  // Manifold check
  checks.push({
    name: 'Manifold (Watertight)',
    passed: params.isManifold,
    value: params.isManifold ? 'Yes' : 'No',
    threshold: 'Yes',
    severity: 'warning',
  })

  // UV check
  checks.push({
    name: 'UV Mapping',
    passed: params.hasUVs,
    value: params.hasUVs ? 'Present' : 'Missing',
    threshold: 'Present',
    severity: 'warning',
  })

  // Dimension check (Roblox max part size is 2048 studs)
  const maxDim = Math.max(params.dimensions.x, params.dimensions.y, params.dimensions.z)
  checks.push({
    name: 'Dimensions',
    passed: maxDim <= 2048 && maxDim >= 0.5,
    value: `${params.dimensions.x}x${params.dimensions.y}x${params.dimensions.z} studs`,
    threshold: '0.5 - 2048 studs',
    severity: maxDim > 2048 ? 'error' : 'info',
  })

  // Scale sanity for type
  const expectedScale: Record<string, { min: number; max: number }> = {
    character:  { min: 3, max: 20 },
    building:   { min: 10, max: 500 },
    vehicle:    { min: 5, max: 100 },
    weapon:     { min: 1, max: 15 },
    furniture:  { min: 2, max: 30 },
    prop:       { min: 0.5, max: 50 },
  }

  const scale = expectedScale[params.type]
  if (scale) {
    const inRange = maxDim >= scale.min && maxDim <= scale.max
    checks.push({
      name: 'Scale for Type',
      passed: inRange,
      value: `${maxDim} studs`,
      threshold: `${scale.min}-${scale.max} studs`,
      severity: 'warning',
    })
    if (!inRange) {
      recommendations.push(
        `Asset dimensions (${maxDim} studs) are outside typical range for ${params.type}. Consider rescaling.`
      )
    }
  }

  const errors = checks.filter(c => !c.passed && c.severity === 'error')
  const passed = errors.length === 0

  const score = Math.round(
    (checks.filter(c => c.passed).length / checks.length) * 100
  )

  return { passed, score, checks, recommendations }
}
```

**How to test:**
- Unit tests with various poly counts, file sizes, dimensions
- Verify error on >8MB file
- Verify warning on non-manifold mesh
- Verify character at 100 studs gets scale warning

**Effort:** 6 hours

---

### Task 2.4: Asset Library UI

**Files to create:**
- `src/app/(dashboard)/assets/page.tsx` -- Asset library page
- `src/app/(dashboard)/assets/[id]/page.tsx` -- Single asset detail
- `src/components/assets/AssetGrid.tsx` -- Grid display
- `src/components/assets/AssetCard.tsx` -- Individual card
- `src/components/assets/AssetStatusBadge.tsx` -- Status indicator
- `src/app/api/assets/route.ts` -- List user assets
- `src/app/api/assets/[id]/route.ts` -- Get/delete single asset

**What it does:**
- Shows all user-generated assets with status, thumbnail, poly count
- Filter by type, status, date
- Click to view details, download .fbx, copy rbxassetid
- Delete assets (soft delete)
- Real-time status updates via polling (later WebSocket)

**API specs:**
```
GET /api/assets?page=1&limit=20&type=building&status=ready
Response:
{
  "assets": [
    {
      "id": "asset_123",
      "type": "BUILDING",
      "prompt": "medieval castle tower",
      "status": "READY",
      "progress": 100,
      "thumbnailUrl": "...",
      "robloxAssetId": "rbxassetid://123",
      "polyCount": 3200,
      "tokensCost": 80,
      "createdAt": "2026-04-01T..."
    }
  ],
  "total": 45,
  "page": 1,
  "limit": 20
}

GET /api/assets/[id]
Response: { ...full GeneratedAsset data... }

DELETE /api/assets/[id]
Response: { deleted: true }
```

**How to test:**
- Generate 3-4 test assets
- Verify grid shows all with correct status badges
- Verify filtering works
- Verify detail page shows full info
- Verify delete removes from list

**Effort:** 16 hours

---

### Task 2.5: Pipeline Orchestration Service

**File to create:** `src/lib/pipeline/orchestrator.ts`

**What it does:**
- Central orchestrator for the full pipeline: generate -> optimize -> upload -> deliver
- Tracks pipeline state machine per asset
- Handles failures, retries, notifications
- Provides unified status to frontend

**State machine:**
```
QUEUED -> GENERATING -> OPTIMIZING -> UPLOADING -> READY
                |            |            |
                v            v            v
             FAILED       FAILED       FAILED
```

**Implementation:**
```typescript
export class PipelineOrchestrator {
  async startGeneration(params: {
    userId: string
    prompt: string
    type: AssetType
    style: string
    polyTarget: number
    textured: boolean
    sessionId?: string
  }): Promise<{ assetId: string; estimatedTime: string }> {
    // 1. Create GeneratedAsset record
    const asset = await db.generatedAsset.create({
      data: {
        userId: params.userId,
        type: params.type,
        prompt: params.prompt,
        style: params.style,
        status: 'QUEUED',
        tokensCost: calculateTokenCost(params),
      },
    })

    // 2. Deduct tokens
    await spendTokens(params.userId, asset.tokensCost, `3D: ${params.prompt.slice(0, 30)}`)

    // 3. Queue mesh generation
    await meshQueue.add('generate', {
      assetId: asset.id,
      userId: params.userId,
      prompt: params.prompt,
      type: params.type,
      style: params.style,
      polyTarget: params.polyTarget,
      sessionId: params.sessionId,
    }, {
      jobId: asset.id,  // Use asset ID as job ID for easy lookup
    })

    // 4. Queue texture generation in parallel (if textured)
    if (params.textured) {
      await textureQueue.add('generate', {
        assetId: asset.id,
        prompt: params.prompt,
        style: params.style,
        resolution: '1024',
      })
    }

    return {
      assetId: asset.id,
      estimatedTime: estimateTime(params),
    }
  }

  async getStatus(assetId: string): Promise<PipelineStatus> {
    const asset = await db.generatedAsset.findUnique({ where: { id: assetId } })
    if (!asset) throw new Error('Asset not found')

    // Get job progress from BullMQ
    const job = await meshQueue.getJob(assetId)
    const progress = job?.progress || asset.progress

    return {
      assetId: asset.id,
      status: asset.status,
      progress,
      stages: {
        generation: asset.meshUrl ? 'complete' : (asset.status === 'GENERATING' ? 'active' : 'pending'),
        optimization: asset.optimizedMeshUrl ? 'complete' : (asset.status === 'OPTIMIZING' ? 'active' : 'pending'),
        upload: asset.robloxAssetId ? 'complete' : (asset.status === 'UPLOADING' ? 'active' : 'pending'),
        delivery: asset.status === 'READY' ? 'complete' : 'pending',
      },
      asset: asset.status === 'READY' ? {
        meshUrl: asset.optimizedMeshUrl || asset.meshUrl,
        robloxAssetId: asset.robloxAssetId,
        thumbnailUrl: asset.thumbnailUrl,
        polyCount: asset.optimizedPolyCount || asset.polyCount,
        textureUrls: {
          albedo: asset.albedoUrl,
          normal: asset.normalUrl,
          roughness: asset.roughnessUrl,
          metallic: asset.metallicUrl,
        },
      } : null,
    }
  }
}

export const pipeline = new PipelineOrchestrator()
```

**How to test:**
- Call pipeline.startGeneration() with test params
- Verify GeneratedAsset created with QUEUED status
- Verify tokens deducted
- Verify mesh + texture jobs queued
- Verify getStatus() returns correct pipeline stages

**Effort:** 12 hours

---

### Phase 2 Summary

| Task | File(s) | Effort | Dependencies |
|------|---------|--------|--------------|
| 2.1 Blender Docker | docker/blender/*, src/lib/queue/blender-worker.ts | 20h | Docker, @aws-sdk/client-s3 |
| 2.2 Roblox Upload | src/lib/roblox-open-cloud.ts, src/lib/queue/upload-worker.ts | 16h | ROBLOX_OPEN_CLOUD_API_KEY |
| 2.3 Quality Gates | src/lib/quality-gates.ts | 6h | - |
| 2.4 Asset Library UI | src/app/(dashboard)/assets/*, src/components/assets/* | 16h | - |
| 2.5 Pipeline Orchestrator | src/lib/pipeline/orchestrator.ts | 12h | Tasks 1.5, 2.1, 2.2 |
| **Total** | | **70h** | |

**Phase 2 Risks:**
- Blender Docker image size (~2GB) -- slow CI/CD
- Roblox Open Cloud API rate limits (60 requests/minute)
- .fbx import issues -- Roblox is picky about format
- Storage costs for intermediate files

**Mitigation:**
- Pre-build and cache Docker image in registry
- Rate limiter on upload queue (concurrency 3, interval 1s)
- Test with Roblox's .fbx validator before upload
- Auto-delete intermediate files after 24h, only keep final assets

---

## PHASE 3: SMART CONNECT (Week 5-6)

**Goal:** Zero-friction Studio connection. User opens Studio, opens ForjeGames, they find each other automatically.

### Task 3.1: Plugin HTTP Server

**Files to modify:**
- `packages/studio-plugin/Sync.lua` (major rewrite)
- `packages/studio-plugin/HttpServer.lua` (new module)

**What it does:**
- Plugin starts an HTTP server on localhost:34872
- Serves /health, /info, /insert endpoints
- Web app pings localhost:34872 to detect Studio
- Enables direct asset delivery without polling

**Implementation (HttpServer.lua):**
```lua
--[[
  ForjeGames Studio Plugin -- HttpServer.lua
  Local HTTP server for direct web app <-> Studio communication.
  Runs on localhost:34872.

  NOTE: Roblox Studio plugins cannot create HTTP servers directly.
  This module uses an alternative approach:
  - The plugin creates a local file marker in the user's temp directory
  - The Electron wrapper (or a lightweight Node companion) watches for commands
  - For web-only mode, we use the existing polling mechanism but accelerated

  ALTERNATIVE: Ship a tiny companion process (Node or Go binary) that:
  1. Runs HTTP server on localhost:34872
  2. Communicates with Studio plugin via BindableEvent bridge
  3. Web app talks to companion, companion talks to plugin
]]

-- Since Roblox Studio plugins CANNOT listen on HTTP ports,
-- we use an accelerated polling strategy instead:
-- 1. Plugin polls /api/studio/sync every 500ms (down from 2-5s)
-- 2. Web app writes commands to the server
-- 3. Plugin drains commands on each poll
-- 4. Feels near-instant (<500ms latency)

-- For TRUE localhost server, we need the Electron wrapper or companion app.
```

**REVISED APPROACH: Companion Process**

Since Roblox Studio plugins cannot create HTTP servers, we need a companion process.

**Files to create:**
- `packages/studio-companion/index.ts` -- Node.js companion server
- `packages/studio-companion/package.json`
- `packages/studio-companion/bridge.ts` -- File-based bridge to Studio plugin
- `packages/studio-plugin/CompanionBridge.lua` -- Plugin side of bridge

**Companion server (packages/studio-companion/index.ts):**
```typescript
import http from 'http'
import fs from 'fs'
import path from 'path'
import os from 'os'

const PORT = 34872
const BRIDGE_DIR = path.join(os.tmpdir(), 'forjegames-bridge')
const COMMANDS_FILE = path.join(BRIDGE_DIR, 'commands.json')
const STATUS_FILE = path.join(BRIDGE_DIR, 'status.json')

// Ensure bridge directory exists
fs.mkdirSync(BRIDGE_DIR, { recursive: true })

const server = http.createServer((req, res) => {
  // CORS for web app
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  const url = new URL(req.url || '/', `http://localhost:${PORT}`)

  // Health check
  if (url.pathname === '/health') {
    const status = readStatus()
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      alive: true,
      studioConnected: status?.connected || false,
      placeId: status?.placeId || null,
      placeName: status?.placeName || null,
      pluginVersion: status?.pluginVersion || null,
      lastHeartbeat: status?.lastHeartbeat || null,
    }))
    return
  }

  // Insert asset into Studio
  if (url.pathname === '/insert' && req.method === 'POST') {
    let body = ''
    req.on('data', chunk => body += chunk)
    req.on('end', () => {
      try {
        const command = JSON.parse(body)
        queueCommand(command)
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ queued: true }))
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Invalid JSON' }))
      }
    })
    return
  }

  // Plugin polls for commands
  if (url.pathname === '/poll') {
    const commands = readAndClearCommands()
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ commands }))
    return
  }

  // Plugin updates status
  if (url.pathname === '/status' && req.method === 'POST') {
    let body = ''
    req.on('data', chunk => body += chunk)
    req.on('end', () => {
      try {
        const status = JSON.parse(body)
        writeStatus(status)
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: true }))
      } catch (e) {
        res.writeHead(400)
        res.end()
      }
    })
    return
  }

  res.writeHead(404)
  res.end()
})

function readStatus() {
  try {
    return JSON.parse(fs.readFileSync(STATUS_FILE, 'utf-8'))
  } catch { return null }
}

function writeStatus(status: any) {
  fs.writeFileSync(STATUS_FILE, JSON.stringify({ ...status, lastHeartbeat: Date.now() }))
}

function queueCommand(command: any) {
  const existing = readCommands()
  existing.push({ ...command, timestamp: Date.now() })
  fs.writeFileSync(COMMANDS_FILE, JSON.stringify(existing))
}

function readCommands(): any[] {
  try {
    return JSON.parse(fs.readFileSync(COMMANDS_FILE, 'utf-8'))
  } catch { return [] }
}

function readAndClearCommands(): any[] {
  const commands = readCommands()
  fs.writeFileSync(COMMANDS_FILE, '[]')
  return commands
}

server.listen(PORT, '127.0.0.1', () => {
  console.log(`ForjeGames companion listening on localhost:${PORT}`)
})
```

**How to test:**
- Start companion: `node packages/studio-companion/index.ts`
- curl localhost:34872/health -> { alive: true }
- POST localhost:34872/insert with command data
- GET localhost:34872/poll -> returns queued commands
- From web app: fetch('http://localhost:34872/health')

**Effort:** 12 hours

---

### Task 3.2: Auto-Detect Studio from Web App

**Files to create:**
- `src/hooks/useStudioDetection.ts` -- React hook for detection
- `src/components/studio/StudioBanner.tsx` -- Connection banner
- `src/components/studio/StudioStatus.tsx` -- Status indicator

**What it does:**
- Pings localhost:34872/health every 3 seconds
- When Studio detected, shows banner "Studio detected! Click to connect"
- One-click pairing
- Shows connection status in header

**Implementation:**
```typescript
// src/hooks/useStudioDetection.ts
import { useState, useEffect, useCallback } from 'react'

interface StudioInfo {
  alive: boolean
  studioConnected: boolean
  placeId: string | null
  placeName: string | null
  pluginVersion: string | null
}

export function useStudioDetection() {
  const [studioInfo, setStudioInfo] = useState<StudioInfo | null>(null)
  const [checking, setChecking] = useState(false)

  const checkStudio = useCallback(async () => {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 2000)

      const res = await fetch('http://localhost:34872/health', {
        signal: controller.signal,
      })
      clearTimeout(timeout)

      if (res.ok) {
        const data = await res.json()
        setStudioInfo(data)
      } else {
        setStudioInfo(null)
      }
    } catch {
      setStudioInfo(null)
    }
  }, [])

  useEffect(() => {
    checkStudio()
    const interval = setInterval(checkStudio, 3000)
    return () => clearInterval(interval)
  }, [checkStudio])

  const insertAsset = useCallback(async (command: {
    type: string
    assetId?: string
    luauCode?: string
    data?: Record<string, unknown>
  }) => {
    try {
      const res = await fetch('http://localhost:34872/insert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(command),
      })
      return res.ok
    } catch {
      return false
    }
  }, [])

  return {
    studioDetected: studioInfo?.alive || false,
    studioConnected: studioInfo?.studioConnected || false,
    placeId: studioInfo?.placeId,
    placeName: studioInfo?.placeName,
    pluginVersion: studioInfo?.pluginVersion,
    insertAsset,
    checkStudio,
  }
}
```

```typescript
// src/components/studio/StudioBanner.tsx
'use client'

import { useStudioDetection } from '@/hooks/useStudioDetection'

export function StudioBanner() {
  const { studioDetected, studioConnected, placeName } = useStudioDetection()

  if (!studioDetected) return null

  if (studioConnected) {
    return (
      <div className="bg-green-900/50 border border-green-700 rounded-lg px-4 py-2 flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-green-200 text-sm">
          Connected to Studio: {placeName || 'Unknown Place'}
        </span>
      </div>
    )
  }

  return (
    <div className="bg-amber-900/50 border border-amber-700 rounded-lg px-4 py-2 flex items-center gap-3">
      <div className="w-2 h-2 rounded-full bg-amber-500" />
      <span className="text-amber-200 text-sm">
        Roblox Studio detected -- open ForjeGames plugin to connect
      </span>
    </div>
  )
}
```

**How to test:**
- Open Studio with ForjeGames plugin + companion running
- Open forjegames.com in browser
- Verify green banner appears
- Close Studio -> verify banner disappears within 6 seconds
- Open Studio again -> verify banner reappears

**Effort:** 8 hours

---

### Task 3.3: One-Click Asset Delivery to Studio

**Files to modify:**
- `src/components/assets/AssetCard.tsx` -- Add "Send to Studio" button
- `src/app/(dashboard)/chat/page.tsx` -- Add insert buttons to AI responses

**What it does:**
- Every generated asset has a "Send to Studio" button
- Click -> asset appears in Studio within 1 second
- Works via companion process (localhost:34872/insert)
- Falls back to server polling if companion not running

**Implementation in AssetCard:**
```typescript
const { studioConnected, insertAsset } = useStudioDetection()

const handleSendToStudio = async () => {
  setSending(true)
  const success = await insertAsset({
    type: 'insert_asset',
    assetId: asset.robloxAssetId,
    data: {
      name: asset.prompt.slice(0, 50),
      assetType: asset.type,
      position: { x: 0, y: 5, z: 0 },
    },
  })

  if (!success) {
    // Fallback: queue via server
    await fetch('/api/studio/execute', {
      method: 'POST',
      body: JSON.stringify({
        sessionId: currentSessionId,
        type: 'insert_asset',
        data: { assetId: asset.robloxAssetId },
      }),
    })
  }
  setSending(false)
}
```

**Plugin side (updated Sync.lua to handle insert_asset):**
```lua
elseif changeType == "insert_asset" and data then
  local assetId = data.assetId
  if assetId and assetId ~= "" then
    local numericId = tonumber(assetId:match("%d+"))
    if numericId then
      local ok, result = pcall(function()
        local model = game:GetService("InsertService"):LoadAsset(numericId)
        if model then
          model.Name = data.name or "ForjeAI_Asset"
          model.Parent = workspace
          -- Position if provided
          if data.position and model.PrimaryPart then
            model:SetPrimaryPartCFrame(CFrame.new(
              data.position.x or 0,
              data.position.y or 5,
              data.position.z or 0
            ))
          end
        end
      end)
      if not ok then
        warn("[ForjeGames] insert_asset failed: " .. tostring(result))
      end
    end
  end
```

**How to test:**
- Generate an asset (or use a known rbxassetid)
- Click "Send to Studio"
- Verify model appears in Studio workspace
- Verify positioned correctly
- Test fallback when companion not running

**Effort:** 10 hours

---

### Task 3.4: Plugin Auto-Update

**Files to create:**
- `src/app/api/studio/plugin/version/route.ts` -- Version check endpoint
- `packages/studio-plugin/Updater.lua` -- Auto-update module

**What it does:**
- Plugin checks /api/studio/plugin/version on startup
- If newer version available, prompts user to update
- Downloads new plugin .rbxm from server
- One-click update without leaving Studio

**API spec:**
```
GET /api/studio/plugin/version
Response:
{
  "currentVersion": "1.2.0",
  "minVersion": "1.0.0",
  "downloadUrl": "https://forjegames.com/plugin/forjegames-v1.2.0.rbxm",
  "releaseNotes": "Added auto-detect, improved sync speed",
  "forceUpdate": false
}
```

**Effort:** 8 hours

---

### Task 3.5: Connection Health Monitoring

**Files to create:**
- `src/lib/studio-health.ts` -- Health monitoring service
- `src/app/api/studio/health/route.ts` -- Health dashboard endpoint

**What it does:**
- Tracks connection quality: latency, dropped commands, sync failures
- Auto-reconnect on connection loss
- Exponential backoff already exists in Sync.lua, enhance with:
  - Reconnect notification in web app
  - Command replay after reconnect
  - Connection quality indicator (green/yellow/red)

**Effort:** 6 hours

---

### Phase 3 Summary

| Task | File(s) | Effort | Dependencies |
|------|---------|--------|--------------|
| 3.1 Companion Process | packages/studio-companion/* | 12h | - |
| 3.2 Auto-Detect | src/hooks/useStudioDetection.ts, components | 8h | Task 3.1 |
| 3.3 Asset Delivery | AssetCard, chat page, Sync.lua | 10h | Tasks 3.1, 3.2, 2.2 |
| 3.4 Plugin Auto-Update | Updater.lua, version endpoint | 8h | - |
| 3.5 Connection Health | studio-health.ts, health endpoint | 6h | Task 3.1 |
| **Total** | | **44h** | |

**Phase 3 Risks:**
- Roblox Studio HTTP restrictions (HttpService only, no server)
- Companion process adds complexity (need installer/auto-start)
- InsertService:LoadAsset() requires asset to be owned/free
- Firewall blocking localhost:34872

**Mitigation:**
- Companion process ships with Electron wrapper (already in stack)
- Alternatively, accelerate polling to 500ms for near-instant feel
- Use loadstring Luau fallback for asset insertion when InsertService fails
- Try multiple ports, fallback to server polling

---

## PHASE 4: AI ORCHESTRATION (Week 7-8)

**Goal:** User says "build me a tycoon" and AI creates the entire game -- terrain, buildings, NPCs, systems, UI.

### Task 4.1: Multi-Step Build Planner

**Files to create:**
- `src/lib/ai/build-planner.ts` -- AI build planning engine
- `src/app/api/ai/plan/route.ts` -- Plan generation endpoint
- `src/components/build/BuildPlanView.tsx` -- Plan visualization

**What it does:**
- Takes high-level request ("build a tycoon game")
- AI generates a structured build plan with 10-50 tasks
- Tasks have dependencies, estimated costs, parallelization groups
- User can review, modify, approve the plan before execution

**Implementation:**
```typescript
// src/lib/ai/build-planner.ts

export interface BuildTask {
  id: string
  name: string
  description: string
  category: 'terrain' | 'building' | 'npc' | 'system' | 'ui' | 'audio' | 'lighting' | 'script'
  dependencies: string[]          // task IDs that must complete first
  parallelGroup: number           // tasks in same group can run simultaneously
  estimatedTokens: number
  estimatedTimeMs: number
  agentId: string                 // which agent handles this
  priority: 'critical' | 'high' | 'medium' | 'low'
  prompt: string                  // detailed prompt for the agent
  luauTemplate?: string           // optional template to guide code gen
  status: 'pending' | 'running' | 'complete' | 'failed' | 'skipped'
}

export interface BuildPlan {
  id: string
  userId: string
  name: string                    // "Medieval Tycoon"
  description: string
  gameType: string                // "tycoon", "simulator", "obby", etc.
  tasks: BuildTask[]
  totalEstimatedTokens: number
  totalEstimatedTimeMs: number
  parallelGroups: number
  status: 'draft' | 'approved' | 'running' | 'complete' | 'failed'
  createdAt: Date
}

const PLAN_SYSTEM_PROMPT = `You are a Roblox game architect. Given a game description, create a detailed build plan.

Output a JSON array of tasks. Each task must have:
- id: unique string (e.g., "terrain_1", "building_2")
- name: short name
- description: what to build (be specific -- dimensions, materials, colors)
- category: one of terrain/building/npc/system/ui/audio/lighting/script
- dependencies: array of task IDs that must complete first
- parallelGroup: integer (tasks in same group run simultaneously)
- priority: critical/high/medium/low
- prompt: detailed prompt for the AI agent that will execute this task

Rules:
- Terrain and lighting are always group 0 (first)
- Buildings are group 1 (after terrain)
- NPCs and props are group 2 (after buildings)
- Systems (economy, progression) are group 3
- UI is group 4 (after systems)
- Audio is group 5 (last)
- Include specific Roblox stud dimensions
- Include specific Color3 values
- Include specific material enums
- A typical tycoon needs 20-30 tasks
- A typical obby needs 15-20 tasks
- A typical simulator needs 25-35 tasks`

export async function generateBuildPlan(
  prompt: string,
  gameType: string,
  userId: string,
): Promise<BuildPlan> {
  const client = getAnthropicClient()
  if (!client) throw new Error('Anthropic API key required')

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    system: PLAN_SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: `Create a build plan for: "${prompt}"\nGame type: ${gameType}`,
    }],
  })

  const content = response.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')

  // Parse JSON from response
  const jsonMatch = content.text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) throw new Error('No valid JSON plan in response')

  const tasks: BuildTask[] = JSON.parse(jsonMatch[0])

  // Assign agents
  const AGENT_MAP: Record<string, string> = {
    terrain: '@roblox-builder',
    building: '@roblox-builder',
    npc: '@roblox-builder',
    system: '@roblox-builder',
    ui: '@ui-builder',
    audio: '@sound-designer',
    lighting: '@roblox-builder',
    script: '@roblox-builder',
  }

  for (const task of tasks) {
    task.agentId = AGENT_MAP[task.category] || '@roblox-builder'
    task.status = 'pending'
    task.estimatedTokens = estimateTaskTokens(task.category)
    task.estimatedTimeMs = estimateTaskTime(task.category)
  }

  const plan: BuildPlan = {
    id: `plan_${Date.now()}`,
    userId,
    name: prompt.slice(0, 50),
    description: prompt,
    gameType,
    tasks,
    totalEstimatedTokens: tasks.reduce((sum, t) => sum + t.estimatedTokens, 0),
    totalEstimatedTimeMs: calculateParallelTime(tasks),
    parallelGroups: Math.max(...tasks.map(t => t.parallelGroup)) + 1,
    status: 'draft',
    createdAt: new Date(),
  }

  return plan
}

function estimateTaskTokens(category: string): number {
  const costs: Record<string, number> = {
    terrain: 50, building: 80, npc: 60, system: 100,
    ui: 70, audio: 30, lighting: 40, script: 90,
  }
  return costs[category] || 50
}

function estimateTaskTime(category: string): number {
  const times: Record<string, number> = {
    terrain: 30_000, building: 45_000, npc: 20_000, system: 60_000,
    ui: 40_000, audio: 15_000, lighting: 10_000, script: 50_000,
  }
  return times[category] || 30_000
}

function calculateParallelTime(tasks: BuildTask[]): number {
  const groups = new Map<number, number>()
  for (const task of tasks) {
    const current = groups.get(task.parallelGroup) || 0
    groups.set(task.parallelGroup, Math.max(current, task.estimatedTimeMs))
  }
  return Array.from(groups.values()).reduce((sum, t) => sum + t, 0)
}
```

**API spec:**
```
POST /api/ai/plan
Request:
{
  "prompt": "Build me a medieval tycoon with castles, a market, and progression system",
  "gameType": "tycoon"
}

Response:
{
  "plan": {
    "id": "plan_123",
    "name": "Medieval Tycoon",
    "tasks": [ ... 25 tasks ... ],
    "totalEstimatedTokens": 1500,
    "totalEstimatedTimeMs": 180000,
    "parallelGroups": 6,
    "status": "draft"
  }
}

POST /api/ai/plan/[planId]/execute
Response: { "status": "running", "progress": 0 }

GET /api/ai/plan/[planId]/status
Response: {
  "status": "running",
  "progress": 45,
  "completedTasks": 11,
  "totalTasks": 25,
  "currentTasks": ["building_3", "building_4"],
  "errors": []
}
```

**Database changes:**
```prisma
model BuildPlan {
  id                   String    @id @default(cuid())
  userId               String
  name                 String
  description          String    @db.Text
  gameType             String
  tasks                Json      // BuildTask[]
  totalEstimatedTokens Int
  status               String    @default("draft") // draft, approved, running, complete, failed
  progress             Int       @default(0)
  completedTasks       Int       @default(0)
  totalTasks           Int       @default(0)
  errorLog             Json?     // error details
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt
  completedAt          DateTime?

  @@index([userId])
  @@index([userId, status])
  @@index([status])
  @@index([createdAt])
}
```

**How to test:**
- POST /api/ai/plan with "build a tycoon game"
- Verify plan has 20+ tasks
- Verify tasks have correct dependencies
- Verify parallel groups are logical
- Execute plan, verify tasks run in correct order
- Verify progress updates as tasks complete

**Effort:** 24 hours

---

### Task 4.2: Parallel Asset Generation

**File to create:** `src/lib/ai/build-executor.ts`

**What it does:**
- Takes an approved BuildPlan
- Executes tasks in parallel groups
- Group 0 tasks first, then Group 1 when Group 0 completes, etc.
- Each task generates Luau code via Anthropic
- Luau code sent to Studio plugin for execution
- Progress tracking per task and overall

**Implementation:**
```typescript
export class BuildExecutor {
  private plan: BuildPlan
  private userId: string
  private sessionId: string

  async execute(): Promise<void> {
    const maxGroup = Math.max(...this.plan.tasks.map(t => t.parallelGroup))

    for (let group = 0; group <= maxGroup; group++) {
      const groupTasks = this.plan.tasks.filter(t => t.parallelGroup === group)

      // Check dependencies
      const ready = groupTasks.filter(task => {
        return task.dependencies.every(depId => {
          const dep = this.plan.tasks.find(t => t.id === depId)
          return dep?.status === 'complete'
        })
      })

      // Execute group in parallel
      const results = await Promise.allSettled(
        ready.map(task => this.executeTask(task))
      )

      // Handle results
      for (let i = 0; i < results.length; i++) {
        const result = results[i]
        const task = ready[i]

        if (result.status === 'fulfilled') {
          task.status = 'complete'
        } else {
          task.status = 'failed'
          // Log error but continue
        }
      }

      // Update plan progress
      const completed = this.plan.tasks.filter(t => t.status === 'complete').length
      await db.buildPlan.update({
        where: { id: this.plan.id },
        data: {
          tasks: this.plan.tasks as any,
          progress: Math.round((completed / this.plan.tasks.length) * 100),
          completedTasks: completed,
        },
      })
    }
  }

  private async executeTask(task: BuildTask): Promise<string> {
    task.status = 'running'

    const client = getAnthropicClient()!
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: FORJEAI_SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: task.prompt,
      }],
    })

    const luauCode = extractLuauCode(response.content[0])

    // Send to Studio
    queueCommand(this.sessionId, {
      type: 'execute_luau',
      data: { code: luauCode, taskName: task.name },
    })

    // Deduct tokens
    await spendTokens(this.userId, task.estimatedTokens, `Build: ${task.name}`)

    return luauCode
  }
}
```

**Effort:** 16 hours

---

### Task 4.3: Luau Code Generation for Game Systems

**Files to create:**
- `src/lib/ai/luau-templates/economy.ts`
- `src/lib/ai/luau-templates/progression.ts`
- `src/lib/ai/luau-templates/ui.ts`
- `src/lib/ai/luau-templates/combat.ts`
- `src/lib/ai/luau-templates/inventory.ts`
- `src/lib/ai/luau-templates/index.ts`

**What it does:**
- Pre-built Luau templates for common game systems
- AI fills in the blanks (currency names, progression values, UI colors)
- Templates are production-quality with proper error handling
- Each template creates a ModuleScript in ServerScriptService or ReplicatedStorage

**Template example (economy):**
```typescript
export function economyTemplate(params: {
  currencyName: string
  startingBalance: number
  earnSources: Array<{ name: string; amount: number; interval: number }>
  shops: Array<{ name: string; items: Array<{ name: string; price: number }> }>
}): string {
  return `
-- ForjeGames Economy System
-- Currency: ${params.currencyName}
-- Generated at ${new Date().toISOString()}

local DataStoreService = game:GetService("DataStoreService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Economy = {}

-- Config
local CURRENCY_NAME = "${params.currencyName}"
local STARTING_BALANCE = ${params.startingBalance}
local DATA_STORE = DataStoreService:GetDataStore("Economy_v1")

-- Remote Events
local Remotes = Instance.new("Folder")
Remotes.Name = "EconomyRemotes"
Remotes.Parent = ReplicatedStorage

local BalanceChanged = Instance.new("RemoteEvent")
BalanceChanged.Name = "BalanceChanged"
BalanceChanged.Parent = Remotes

local PurchaseRequest = Instance.new("RemoteEvent")
PurchaseRequest.Name = "PurchaseRequest"
PurchaseRequest.Parent = Remotes

-- Player data cache
local playerData = {}

function Economy.getBalance(player)
  return playerData[player.UserId] or STARTING_BALANCE
end

function Economy.addCurrency(player, amount, source)
  local current = Economy.getBalance(player)
  local newBalance = current + amount
  playerData[player.UserId] = newBalance
  BalanceChanged:FireClient(player, newBalance, amount, source or "unknown")
  return newBalance
end

function Economy.spendCurrency(player, amount, item)
  local current = Economy.getBalance(player)
  if current < amount then return false, "Insufficient ${params.currencyName}" end
  playerData[player.UserId] = current - amount
  BalanceChanged:FireClient(player, current - amount, -amount, item or "purchase")
  return true
end

-- Earn sources
${params.earnSources.map(s => `
task.spawn(function()
  while true do
    task.wait(${s.interval})
    for _, player in Players:GetPlayers() do
      Economy.addCurrency(player, ${s.amount}, "${s.name}")
    end
  end
end)
`).join('\n')}

-- Shop handler
PurchaseRequest.OnServerEvent:Connect(function(player, shopName, itemName)
  -- Validate on server
  local shops = {
${params.shops.map(shop => `    ["${shop.name}"] = {
${shop.items.map(item => `      ["${item.name}"] = ${item.price},`).join('\n')}
    },`).join('\n')}
  }

  local shop = shops[shopName]
  if not shop then return end

  local price = shop[itemName]
  if not price then return end

  local success, err = Economy.spendCurrency(player, price, itemName)
  if not success then
    warn("[Economy] Purchase failed for " .. player.Name .. ": " .. err)
  end
end)

-- Data persistence
Players.PlayerAdded:Connect(function(player)
  local ok, data = pcall(function()
    return DATA_STORE:GetAsync("balance_" .. player.UserId)
  end)
  playerData[player.UserId] = (ok and data) or STARTING_BALANCE
  BalanceChanged:FireClient(player, playerData[player.UserId], 0, "load")
end)

Players.PlayerRemoving:Connect(function(player)
  pcall(function()
    DATA_STORE:SetAsync("balance_" .. player.UserId, playerData[player.UserId])
  end)
  playerData[player.UserId] = nil
end)

return Economy
`
}
```

**Effort:** 20 hours

---

### Task 4.4: Build Progress Dashboard

**Files to create:**
- `src/app/(dashboard)/build/[planId]/page.tsx`
- `src/components/build/BuildProgress.tsx`
- `src/components/build/TaskTimeline.tsx`
- `src/components/build/ParallelGroupView.tsx`

**What it does:**
- Real-time progress dashboard for active builds
- Shows task timeline with dependencies
- Color-coded status (green=done, blue=running, gray=pending, red=failed)
- Overall progress bar
- Cost tracker (tokens spent vs estimated)
- Estimated time remaining

**Effort:** 14 hours

---

### Task 4.5: AI Memory -- Build History

**Files to create:**
- `src/lib/ai/build-memory.ts`
- Add to Prisma schema

**What it does:**
- AI remembers what it built for each user
- "Build another castle like last time but bigger"
- Stores build context, preferences, successful patterns
- Retrieves relevant history when planning new builds

**Database changes:**
```prisma
model BuildMemory {
  id          String   @id @default(cuid())
  userId      String
  buildPlanId String?
  context     String   @db.Text  // what was built
  preferences Json               // user preferences learned
  patterns    Json               // successful build patterns
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([userId])
  @@index([userId, createdAt])
}
```

**Effort:** 8 hours

---

### Task 4.6: Template Save & Share

**Files to create:**
- `src/app/api/ai/templates/save/route.ts`
- `src/app/api/ai/templates/[id]/export/route.ts`
- `src/components/build/SaveTemplateModal.tsx`

**What it does:**
- After a build completes, user can save it as a template
- Template captures the full build plan + generated Luau code
- Templates can be shared on the marketplace
- Other users can "use this template" to rebuild with customization

**API spec:**
```
POST /api/ai/templates/save
Request:
{
  "buildPlanId": "plan_123",
  "name": "Medieval Tycoon Starter",
  "description": "...",
  "category": "GAME_TEMPLATE",
  "price": 0,        // cents, 0 = free
  "tags": ["tycoon", "medieval"]
}

Response:
{ "templateId": "tpl_123", "slug": "medieval-tycoon-starter" }
```

**Effort:** 10 hours

---

### Phase 4 Summary

| Task | File(s) | Effort | Dependencies |
|------|---------|--------|--------------|
| 4.1 Build Planner | src/lib/ai/build-planner.ts, API, UI | 24h | Phase 1 (Anthropic) |
| 4.2 Parallel Executor | src/lib/ai/build-executor.ts | 16h | Task 4.1, Phase 3 |
| 4.3 Luau Templates | src/lib/ai/luau-templates/*.ts | 20h | - |
| 4.4 Progress Dashboard | src/app/(dashboard)/build/*, components | 14h | Task 4.1 |
| 4.5 AI Memory | src/lib/ai/build-memory.ts, schema | 8h | Task 4.1 |
| 4.6 Template Save/Share | API, components, marketplace integration | 10h | Task 4.1, existing marketplace |
| **Total** | | **92h** | |

**Phase 4 Risks:**
- Anthropic token costs for large build plans ($0.50-$2 per full game generation)
- AI-generated Luau code quality (syntax errors, runtime bugs)
- Long execution times (full game = 3-10 minutes)
- Studio plugin stability with 20+ rapid commands

**Mitigation:**
- Cost estimation shown upfront, user approval required
- Luau syntax validator before sending to Studio
- Background execution with progress notifications
- Command throttling in plugin (100ms between commands)

---

## PHASE 5: MAGIC UX (Week 9-10)

**Goal:** The app feels alive. No setup friction. AI anticipates needs. Voice control.

### Task 5.1: Progressive Disclosure Onboarding

**Files to create:**
- `src/app/(onboarding)/welcome/page.tsx` -- Welcome page
- `src/components/onboarding/GameTypeSelector.tsx`
- `src/components/onboarding/SkillLevelPicker.tsx`
- `src/components/onboarding/FirstBuildWizard.tsx`

**What it does:**
- New user lands on welcome page (no setup needed)
- "What kind of game do you want to build?" -> tycoon/obby/simulator/RPG
- "What's your experience level?" -> beginner/intermediate/expert
- AI generates a starter template based on choices
- User sees first result in under 60 seconds

**Effort:** 14 hours

---

### Task 5.2: Voice Commands (Deepgram + ElevenLabs)

**Files to create:**
- `src/lib/voice/speech-to-text.ts` -- Deepgram integration
- `src/lib/voice/text-to-speech.ts` -- ElevenLabs integration
- `src/hooks/useVoiceInput.ts` -- React hook
- `src/components/chat/VoiceButton.tsx`
- `src/app/api/ai/voice/transcribe/route.ts`
- `src/app/api/ai/voice/speak/route.ts`

**What it does:**
- Push-to-talk button in chat
- Deepgram transcribes speech to text in real-time
- Text sent to AI chat as normal
- AI response optionally read back via ElevenLabs
- Works on desktop and mobile

**Implementation:**
```typescript
// src/lib/voice/speech-to-text.ts
export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const apiKey = process.env.DEEPGRAM_API_KEY
  if (!apiKey) throw new Error('DEEPGRAM_API_KEY not set')

  const response = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true', {
    method: 'POST',
    headers: {
      Authorization: `Token ${apiKey}`,
      'Content-Type': 'audio/webm',
    },
    body: audioBlob,
  })

  const data = await response.json()
  return data.results?.channels?.[0]?.alternatives?.[0]?.transcript || ''
}
```

```typescript
// src/hooks/useVoiceInput.ts
export function useVoiceInput() {
  const [recording, setRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })

    chunksRef.current = []
    recorder.ondataavailable = (e) => chunksRef.current.push(e.data)

    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
      const formData = new FormData()
      formData.append('audio', blob)

      const res = await fetch('/api/ai/voice/transcribe', {
        method: 'POST',
        body: formData,
      })
      const { text } = await res.json()
      setTranscript(text)
    }

    recorder.start()
    mediaRecorderRef.current = recorder
    setRecording(true)
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    setRecording(false)
  }

  return { recording, transcript, startRecording, stopRecording }
}
```

**Dependencies to install:**
```bash
npm install @deepgram/sdk
```

**Effort:** 16 hours

---

### Task 5.3: Real-Time 3D Preview in Browser

**Files to create/modify:**
- `src/components/preview/AssetPreview3D.tsx` -- Three.js asset viewer
- `src/components/preview/ScenePreview.tsx` -- Full scene preview
- `src/hooks/useAssetPreview.ts` -- Preview state management

**What it does:**
- When mesh generation completes, show 3D preview in browser
- User can rotate, zoom, inspect before pushing to Studio
- Uses React Three Fiber (already installed)
- Loads .glb directly from Meshy/storage URL

**Implementation:**
```typescript
// src/components/preview/AssetPreview3D.tsx
'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, useGLTF, Center, Grid } from '@react-three/drei'
import { Suspense } from 'react'

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url)
  return (
    <Center>
      <primitive object={scene} />
    </Center>
  )
}

export function AssetPreview3D({
  meshUrl,
  className,
}: {
  meshUrl: string
  className?: string
}) {
  return (
    <div className={`bg-[#1a1a2e] rounded-lg overflow-hidden ${className}`}>
      <Canvas
        camera={{ position: [3, 3, 3], fov: 50 }}
        style={{ height: '100%', minHeight: 300 }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow />
        <Suspense fallback={null}>
          <Model url={meshUrl} />
          <Environment preset="sunset" />
        </Suspense>
        <OrbitControls
          enableDamping
          dampingFactor={0.1}
          minDistance={1}
          maxDistance={20}
        />
        <Grid infiniteGrid fadeDistance={30} cellColor="#333" sectionColor="#666" />
      </Canvas>
    </div>
  )
}
```

**Effort:** 10 hours

---

### Task 5.4: AI Suggestions Engine

**Files to create:**
- `src/lib/ai/suggestions.ts`
- `src/app/api/ai/suggest/route.ts`
- `src/components/chat/SuggestionChips.tsx`

**What it does:**
- AI analyzes current build state and suggests improvements
- "Your map needs more cover for combat areas"
- "Add ambient sound to the forest zone"
- "The economy seems too generous -- reduce coin drop rate"
- Shows as suggestion chips below chat

**Implementation:**
```typescript
export async function generateSuggestions(
  buildHistory: string[],
  currentState: Record<string, unknown>,
  gameType: string,
): Promise<Suggestion[]> {
  const client = getAnthropicClient()!

  const response = await client.messages.create({
    model: 'claude-haiku-4-20250414',  // Haiku for speed
    max_tokens: 1024,
    system: `You are a Roblox game quality advisor. Analyze the current build state and suggest 3-5 improvements. Each suggestion should be actionable and specific. Return JSON array of { text: string, category: string, priority: "high"|"medium"|"low" }`,
    messages: [{
      role: 'user',
      content: JSON.stringify({ buildHistory, currentState, gameType }),
    }],
  })

  // Parse suggestions
  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  return jsonMatch ? JSON.parse(jsonMatch[0]) : []
}
```

**Effort:** 8 hours

---

### Task 5.5: Collaborative Building (Multi-User)

**Files to create:**
- `src/lib/realtime/presence.ts` -- User presence tracking
- `src/lib/realtime/cursors.ts` -- Cursor broadcasting
- `src/app/api/realtime/connect/route.ts` -- WebSocket upgrade
- `src/components/collab/UserCursors.tsx`
- `src/components/collab/ActiveUsers.tsx`

**What it does:**
- Multiple team members can build simultaneously
- Real-time cursor positions shown on 3D preview
- Chat messages visible to all connected users
- Zone locking (existing in DB) enforced in real-time
- Conflict resolution for simultaneous edits

**Implementation approach:**
- Use Server-Sent Events (SSE) for presence broadcast (simpler than WebSocket)
- Redis pub/sub for cross-server communication
- Each user's cursor position + activity broadcast every 500ms
- Zone locks prevent overlapping edits

**Dependencies to install:**
```bash
# None new -- uses existing ioredis for pub/sub
```

**Effort:** 20 hours

---

### Phase 5 Summary

| Task | File(s) | Effort | Dependencies |
|------|---------|--------|--------------|
| 5.1 Onboarding | src/app/(onboarding)/welcome/*, components | 14h | Phase 4 |
| 5.2 Voice Commands | src/lib/voice/*, hooks, API | 16h | @deepgram/sdk |
| 5.3 3D Preview | src/components/preview/*, hooks | 10h | Already have R3F |
| 5.4 AI Suggestions | src/lib/ai/suggestions.ts, API, components | 8h | Phase 1 (Anthropic) |
| 5.5 Collaborative Building | src/lib/realtime/*, API, components | 20h | Phase 3 (Studio) |
| **Total** | | **68h** | |

**Phase 5 Risks:**
- Voice recognition accuracy for Roblox-specific terminology
- 3D preview performance on low-end devices
- Real-time collaboration complexity (CRDTs, conflict resolution)
- Mobile browser microphone permissions

**Mitigation:**
- Custom Deepgram vocabulary with Roblox terms
- LOD rendering in preview, progressive loading
- Start with simple presence + zone locking, defer full CRDT
- Progressive enhancement -- voice optional, works without it

---

## PHASE 6: SCALE & MONETIZE (Week 11-12)

**Goal:** Production hardening. Cost optimization. Revenue growth.

### Task 6.1: Token Cost Tracking Per Generation

**Files to create/modify:**
- `src/lib/cost-tracker.ts` -- Cost tracking service
- `src/app/api/admin/costs/route.ts` -- Admin cost dashboard
- `src/app/(dashboard)/settings/usage/page.tsx` -- User usage page

**What it does:**
- Track real USD cost per generation (Meshy: $0.05/mesh, Fal: $0.02/texture, Anthropic: $0.003-$0.015/call)
- Map USD costs to token costs
- Show users their usage with cost breakdown
- Admin dashboard shows profit/loss per user
- Alert when costs exceed thresholds

**Implementation:**
```typescript
export const COST_MAP = {
  meshy: {
    'text-to-3d-preview': 0.05,    // USD per generation
    'text-to-3d-refine': 0.20,
    'text-to-texture': 0.10,
  },
  fal: {
    'fast-sdxl': 0.01,
    'flux-pro': 0.05,
    'flux-realism': 0.03,
  },
  anthropic: {
    'claude-sonnet-4-20250514-input': 0.003,    // per 1K tokens
    'claude-sonnet-4-20250514-output': 0.015,
    'claude-haiku-4-20250414-input': 0.00025,
    'claude-haiku-4-20250414-output': 0.00125,
  },
  deepgram: {
    'nova-2': 0.0043,              // per minute
  },
  elevenlabs: {
    'multilingual-v2': 0.30,       // per 1K characters
  },
}

export function calculateRealCost(
  provider: string,
  model: string,
  units: number,   // tokens, minutes, characters, or count
): number {
  const rate = COST_MAP[provider]?.[model]
  if (!rate) return 0
  return rate * units
}

export function tokenPriceToUsd(tokens: number): number {
  // 1000 tokens = $10 (from SUBSCRIPTION_TIERS)
  return (tokens / 1000) * 10
}

export function usdToTokens(usd: number): number {
  return Math.ceil(usd * 100)   // $0.01 = 1 token
}
```

**Effort:** 8 hours

---

### Task 6.2: Tier Enforcement

**Files to modify:**
- `src/lib/tier-guard.ts` -- Enhanced enforcement
- `src/app/api/ai/3d-generate/route.ts` -- Enforce limits

**What it does:**
- FREE: 5 mesh generations/day, 10 textures/day, 1000 tokens/month
- HOBBY: 20 meshes/day, unlimited textures, 2000 tokens/month
- CREATOR: 50 meshes/day, unlimited everything, 7000 tokens/month
- STUDIO: Unlimited everything, 20000 tokens/month

**Implementation:**
```typescript
export const TIER_LIMITS = {
  FREE: {
    meshesPerDay: 5,
    texturesPerDay: 10,
    buildsPerDay: 2,
    voiceMinutesPerDay: 5,
    teamMembers: 0,
    apiAccess: false,
    gameScanPerDay: 1,
  },
  HOBBY: {
    meshesPerDay: 20,
    texturesPerDay: -1,  // unlimited
    buildsPerDay: 10,
    voiceMinutesPerDay: 30,
    teamMembers: 0,
    apiAccess: false,
    gameScanPerDay: 3,
  },
  CREATOR: {
    meshesPerDay: 50,
    texturesPerDay: -1,
    buildsPerDay: -1,
    voiceMinutesPerDay: -1,
    teamMembers: 5,
    apiAccess: true,
    gameScanPerDay: 10,
  },
  STUDIO: {
    meshesPerDay: -1,
    texturesPerDay: -1,
    buildsPerDay: -1,
    voiceMinutesPerDay: -1,
    teamMembers: 25,
    apiAccess: true,
    gameScanPerDay: -1,
  },
}

export async function checkTierLimit(
  userId: string,
  resource: keyof typeof TIER_LIMITS.FREE,
): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: { subscription: true },
  })

  const tier = user?.subscription?.tier || 'FREE'
  const limit = TIER_LIMITS[tier][resource]

  if (limit === -1) return { allowed: true, remaining: -1, limit: -1 }

  // Count today's usage from ApiUsageRecord
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const count = await db.apiUsageRecord.count({
    where: {
      userId: user!.id,
      operation: resource,
      createdAt: { gte: today },
    },
  })

  return {
    allowed: count < limit,
    remaining: Math.max(0, limit - count),
    limit,
  }
}
```

**Effort:** 8 hours

---

### Task 6.3: Creator Marketplace Enhancements

**Files to create:**
- `src/app/(dashboard)/marketplace/submit/page.tsx` -- Submit template
- `src/app/(dashboard)/marketplace/[slug]/page.tsx` -- Template detail
- `src/components/marketplace/TemplateCard.tsx`
- `src/components/marketplace/PurchaseButton.tsx`
- `src/components/marketplace/ReviewForm.tsx`

**What it does:**
- Creators upload templates (build plans + Luau code)
- Buyers browse, preview, purchase
- One-click "use this template" starts a build from the template
- Reviews and ratings
- Creator earnings dashboard (already in schema)
- Stripe Connect for creator payouts (schema exists)

**Effort:** 20 hours

---

### Task 6.4: Game DNA Scanner Implementation

**Files to create:**
- `src/lib/game-scanner.ts` -- Scanner engine
- `src/app/api/game-scan/route.ts` -- Scan endpoint
- `src/app/api/game-scan/[id]/route.ts` -- Scan results
- `src/app/(dashboard)/scanner/page.tsx` -- Scanner UI
- `src/components/scanner/GenomeRadar.tsx` -- Radar chart
- `src/components/scanner/ComparisonTable.tsx`

**What it does:**
- User inputs a Roblox game URL
- System calls Roblox APIs to gather data:
  - Game stats (visits, favorites, active players)
  - Place info (genre, max players, access type)
  - Game passes (pricing, names)
  - Developer products
  - Badges
  - Thumbnail/icon analysis via Claude Vision
- AI analyzes data and generates 12-variable genome
- Shows radar chart comparing to genre averages
- Provides actionable recommendations

**Implementation:**
```typescript
export async function scanGame(robloxUrl: string, userId: string): Promise<string> {
  // Parse place ID from URL
  const placeId = extractPlaceId(robloxUrl)
  if (!placeId) throw new Error('Invalid Roblox game URL')

  // Create scan record
  const scan = await db.gameScan.create({
    data: {
      userId,
      robloxUrl,
      robloxPlaceId: placeId,
      status: 'PROCESSING',
    },
  })

  // Gather data from Roblox APIs (parallel)
  const [gameInfo, gamePasses, products, badges, thumbnail] = await Promise.all([
    fetchGameInfo(placeId),
    fetchGamePasses(placeId),
    fetchDeveloperProducts(placeId),
    fetchBadges(placeId),
    fetchGameThumbnail(placeId),
  ])

  // Analyze with Claude
  const client = getAnthropicClient()!
  const analysis = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: `You are a Roblox game analyst. Analyze game data and produce a genome with these 12 variables (rate each 0-100):
    gameType, targetAge, sessionLength, monetizationModel, progressionPace, zoneDensity, artStyle, retentionDriver, estimatedDau, engagementLoop, updateCadence, communitySize.
    Also provide 5 actionable recommendations.`,
    messages: [{
      role: 'user',
      content: JSON.stringify({ gameInfo, gamePasses, products, badges }),
    }],
  })

  // If thumbnail available, analyze visually
  let visionAnalysis = null
  if (thumbnail) {
    const visionResponse = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'url', url: thumbnail } },
          { type: 'text', text: 'Analyze this Roblox game thumbnail. What art style, color palette, and visual themes do you see?' },
        ],
      }],
    })
    visionAnalysis = visionResponse.content[0]
  }

  // Parse genome from analysis
  const genome = parseGenome(analysis, visionAnalysis)

  // Save results
  await db.gameGenome.create({
    data: {
      scanId: scan.id,
      ...genome,
    },
  })

  await db.gameScan.update({
    where: { id: scan.id },
    data: { status: 'COMPLETE', gameName: gameInfo.name },
  })

  return scan.id
}
```

**API spec:**
```
POST /api/game-scan
Request: { "url": "https://www.roblox.com/games/123456/Game-Name" }
Response: { "scanId": "scan_abc123", "status": "processing" }

GET /api/game-scan/[scanId]
Response: {
  "status": "complete",
  "gameName": "My Tycoon Game",
  "genome": {
    "gameType": "Tycoon",
    "targetAge": "8-14",
    "scores": { "monetization": 75, "retention": 60, ... },
    "recommendations": [
      "Add a daily login reward to boost retention",
      "Price gamepass lower for impulse buys"
    ]
  }
}
```

**Effort:** 24 hours

---

### Task 6.5: One-Click Publish to Roblox

**Files to create:**
- `src/lib/roblox-publish.ts` -- Publishing service
- `src/app/api/publish/route.ts` -- Publish endpoint
- `src/components/publish/PublishWizard.tsx`

**What it does:**
- Takes all generated assets + scripts for a game
- Creates a new Roblox place via Open Cloud
- Uploads all assets to the place
- Sets game settings (name, description, genre, thumbnail)
- Returns playable game URL

**API spec:**
```
POST /api/publish
Request:
{
  "buildPlanId": "plan_123",
  "name": "Medieval Tycoon",
  "description": "Build your medieval empire!",
  "genre": "RPG",
  "maxPlayers": 20,
  "access": "public"
}

Response:
{
  "placeId": "987654321",
  "url": "https://www.roblox.com/games/987654321/Medieval-Tycoon",
  "status": "published"
}
```

**Effort:** 16 hours

---

### Task 6.6: Performance Monitoring

**Files to create/modify:**
- `src/lib/monitoring.ts` -- Centralized monitoring
- `sentry.server.config.ts` -- Enhanced Sentry config
- `src/lib/posthog-events.ts` -- PostHog event definitions

**What it does:**
- Sentry: Error tracking, performance tracing, session replay
- PostHog: Feature flags, A/B tests, funnels, retention
- Custom metrics: generation time, pipeline success rate, cost per user
- Alerts: Slack notifications for errors, cost spikes, queue backlog

**PostHog funnels to track:**
```
1. Signup -> First Chat -> First Generation -> First Studio Insert -> First Build Complete
2. Free -> Hobby -> Creator -> Studio (conversion funnel)
3. Browse Marketplace -> View Template -> Purchase -> Use Template
4. Game DNA Scan -> View Results -> Apply Recommendation
```

**Effort:** 10 hours

---

### Task 6.7: Cost Optimization

**Files to create:**
- `src/lib/cache/asset-cache.ts` -- Asset caching layer
- `src/lib/cache/prompt-cache.ts` -- Prompt result cache

**What it does:**
- Cache common asset generations (e.g., "tree", "rock", "house" have pre-built versions)
- Semantic similarity matching -- "oak tree" matches cached "tree" with 90% similarity
- Cache Anthropic responses for common questions
- Batch Meshy generations (10 at once costs less than 10 individual)
- Use Haiku for simple tasks, Sonnet only when needed
- R2 storage for generated assets (cheaper than S3)

**Implementation:**
```typescript
// src/lib/cache/asset-cache.ts
export async function getCachedAsset(prompt: string, type: string): Promise<GeneratedAsset | null> {
  // Check exact match
  const exact = await db.generatedAsset.findFirst({
    where: {
      prompt: { equals: prompt, mode: 'insensitive' },
      type: type as any,
      status: 'READY',
    },
    orderBy: { createdAt: 'desc' },
  })

  if (exact) return exact

  // Check Redis for semantic cache
  const cacheKey = `asset:${type}:${hashPrompt(prompt)}`
  const cached = await redis.get(cacheKey)
  if (cached) {
    const assetId = JSON.parse(cached).assetId
    return db.generatedAsset.findUnique({ where: { id: assetId } })
  }

  return null
}

export async function cacheAsset(prompt: string, type: string, assetId: string): Promise<void> {
  const cacheKey = `asset:${type}:${hashPrompt(prompt)}`
  await redis.set(cacheKey, JSON.stringify({ assetId, prompt }), 'EX', 604800) // 7 day TTL
}
```

**Effort:** 12 hours

---

### Phase 6 Summary

| Task | File(s) | Effort | Dependencies |
|------|---------|--------|--------------|
| 6.1 Cost Tracking | src/lib/cost-tracker.ts, admin UI | 8h | - |
| 6.2 Tier Enforcement | src/lib/tier-guard.ts (enhanced) | 8h | - |
| 6.3 Marketplace | marketplace pages + components | 20h | Existing schema |
| 6.4 Game DNA Scanner | src/lib/game-scanner.ts, UI, API | 24h | Phase 1 (Anthropic) |
| 6.5 One-Click Publish | src/lib/roblox-publish.ts, API | 16h | Task 2.2 (Open Cloud) |
| 6.6 Monitoring | Sentry, PostHog, alerts | 10h | Existing SDKs |
| 6.7 Cost Optimization | Cache layers, batch strategies | 12h | Phase 2 (pipeline) |
| **Total** | | **98h** | |

---

## RISK ASSESSMENT

### Critical Risks (can block launch)

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Meshy API unreliable/slow | Medium | High | Cache common assets, fallback to Tripo, build retry queue |
| Roblox Open Cloud rate limits | Medium | High | Rate limiter, batch uploads, request API limit increase |
| Blender Docker stability | Low | High | Pre-test with 100 diverse meshes, fallback to skip optimization |
| Anthropic cost explosion | Medium | High | Token budget per user, Haiku for simple tasks, prompt caching |
| Studio plugin security (loadstring) | Low | Critical | Sandbox execution, whitelist Luau patterns, code review gate |

### High Risks (degrade quality)

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| AI-generated Luau has bugs | High | Medium | Syntax validator, test execution in sandbox, error recovery |
| .fbx import fails in Roblox | Medium | Medium | Test 50+ meshes pre-launch, format validation, fallback to .obj |
| Voice recognition poor for kids | Medium | Medium | Custom vocabulary, spelling correction, text fallback always available |
| 3D preview crashes on mobile | Medium | Low | Progressive enhancement, 2D fallback thumbnail |
| Team collaboration race conditions | Medium | Medium | Zone locking (already in schema), optimistic locking, conflict UI |

### Low Risks (cosmetic/minor)

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Fal texture quality inconsistent | Medium | Low | Quality gate, retry with different seed, manual approval option |
| Companion process won't auto-start | Medium | Low | Instructions in plugin, Electron handles auto-start |
| Marketplace moderation backlog | Low | Low | AI pre-screening, community flagging, queue priority |

---

## REVENUE PROJECTIONS

### Assumptions
- Launch Week 12 with all 6 phases
- Initial marketing: Twitter/X, Roblox DevForum, YouTube tutorials
- 50 beta users by Week 4, 200 by Week 8, 1000 by Week 12

### Month 1 (Post-Launch)

| Metric | Value |
|--------|-------|
| Total Users | 1,000 |
| FREE | 800 (80%) |
| HOBBY ($9.99/mo) | 120 (12%) |
| CREATOR ($24.99/mo) | 60 (6%) |
| STUDIO ($49.99/mo) | 20 (2%) |
| Token Pack Sales | $500/mo |
| **Monthly Revenue** | **$4,198** |
| Marketplace GMV | $0 (too early) |
| AI Costs | -$800 |
| Infrastructure | -$500 |
| **Net Revenue** | **$2,898** |

### Month 3

| Metric | Value |
|--------|-------|
| Total Users | 5,000 |
| HOBBY | 500 ($4,995) |
| CREATOR | 250 ($6,248) |
| STUDIO | 75 ($3,749) |
| Token Packs | $2,000 |
| Marketplace (10% fee) | $500 |
| **Monthly Revenue** | **$17,492** |
| AI Costs | -$3,000 |
| Infrastructure | -$1,200 |
| **Net Revenue** | **$13,292** |

### Month 6

| Metric | Value |
|--------|-------|
| Total Users | 20,000 |
| HOBBY | 2,000 ($19,980) |
| CREATOR | 800 ($19,992) |
| STUDIO | 200 ($9,998) |
| Token Packs | $8,000 |
| Marketplace (10% fee) | $5,000 |
| **Monthly Revenue** | **$62,970** |
| AI Costs | -$10,000 |
| Infrastructure | -$3,000 |
| **Net Revenue** | **$49,970** |

### Month 12

| Metric | Value |
|--------|-------|
| Total Users | 100,000 |
| **Monthly Revenue** | **$250,000+** |
| **ARR** | **$3,000,000+** |

---

## COMPETITIVE MOAT ANALYSIS

### ForjeGames vs Competitors

| Feature | ForjeGames | Studio Plugins | Roblox Templates | Manual Dev |
|---------|-----------|----------------|-------------------|------------|
| AI Mesh Generation | Full pipeline | None | None | Manual Blender |
| Text to Game | Yes (Phase 4) | No | Static templates | Weeks of work |
| Studio Integration | One-click | Native | Download+import | Native |
| Voice Commands | Yes (Phase 5) | No | No | No |
| Game DNA Scanner | Yes (Phase 6) | No | No | Manual analysis |
| Team Collaboration | Real-time | Team Create | No | Team Create |
| Cost | $10-50/mo | $5-20 one-time | Free-$50 | $0 (your time) |
| Time to First Game | 5 minutes | Hours | 30 minutes | Weeks |

### Moat Depth

1. **Pipeline Moat** (Strong) -- Text->Mesh->Blender->Roblox pipeline is complex to replicate. Took 12 weeks to build. Competitors need 6+ months.

2. **Data Moat** (Growing) -- Every generation improves cache, every scan enriches genre averages, every template trains the AI. More users = better AI.

3. **Integration Moat** (Medium) -- Studio plugin + companion + web app + API is a full stack. Hard to match with a single tool.

4. **Network Moat** (Future) -- Marketplace creates creator lock-in. Templates only work with ForjeGames. More creators = more buyers = more creators.

5. **Brand Moat** (Weak, early) -- First-mover in "AI Roblox builder" category. Need to establish before copycats.

### Competitive Threats

| Threat | Severity | Timeline | Response |
|--------|----------|----------|----------|
| Roblox adds native AI | High | 12-18 months | Move faster, deeper integration, more features |
| Cursor/Copilot for Roblox | Medium | 6 months | They lack Studio integration + 3D pipeline |
| Chinese AI game builders | Medium | 3-6 months | COPPA compliance, English-first, Roblox-specific |
| Open-source clones | Low | 12 months | Pipeline complexity + data moat |

---

## DEPENDENCY MAP

```
Phase 1 ─────────────────────────────────────────────────────────
  1.1 MCP Client         (independent)
  1.2 AI Chat            (independent)
  1.3 3D Generate        -> 1.5 Job Queue, 1.6 DB Schema
  1.4 Textures           -> 1.5 Job Queue, 1.6 DB Schema
  1.5 Job Queue          (independent)
  1.6 DB Schema          (independent)
  1.7 Meshy Webhook      -> 1.6 DB Schema

Phase 2 ─────────────────────────────────────────────────────────
  2.1 Blender Docker     -> 1.5 Job Queue
  2.2 Roblox Upload      -> 1.5 Job Queue
  2.3 Quality Gates      (independent)
  2.4 Asset Library UI   -> 1.6 DB Schema
  2.5 Pipeline Orchestr. -> 1.5, 2.1, 2.2

Phase 3 ─────────────────────────────────────────────────────────
  3.1 Companion Process  (independent)
  3.2 Auto-Detect        -> 3.1
  3.3 Asset Delivery     -> 3.1, 3.2, 2.2
  3.4 Plugin Auto-Update (independent)
  3.5 Connection Health  -> 3.1

Phase 4 ─────────────────────────────────────────────────────────
  4.1 Build Planner      -> 1.2 (Anthropic)
  4.2 Parallel Executor  -> 4.1, Phase 3
  4.3 Luau Templates     (independent, enhances 4.2)
  4.4 Progress Dashboard -> 4.1
  4.5 AI Memory          -> 4.1
  4.6 Template Save      -> 4.1, Marketplace

Phase 5 ─────────────────────────────────────────────────────────
  5.1 Onboarding         -> Phase 4
  5.2 Voice Commands     (independent)
  5.3 3D Preview         (independent, uses R3F)
  5.4 AI Suggestions     -> 1.2 (Anthropic)
  5.5 Collaborative      -> Phase 3, Redis pub/sub

Phase 6 ─────────────────────────────────────────────────────────
  6.1 Cost Tracking      (independent)
  6.2 Tier Enforcement   (independent)
  6.3 Marketplace        -> Existing schema
  6.4 Game DNA Scanner   -> 1.2 (Anthropic)
  6.5 One-Click Publish  -> 2.2 (Open Cloud)
  6.6 Monitoring         -> Existing SDKs
  6.7 Cost Optimization  -> Phase 2 pipeline
```

---

## ENVIRONMENT VARIABLES REQUIRED

### Phase 1
```env
# Anthropic (AI Chat, Build Planner, Suggestions)
ANTHROPIC_API_KEY=sk-ant-...

# Meshy (3D Generation)
MESHY_API_KEY=msy_...
MESHY_WEBHOOK_SECRET=whsec_...

# Fal.ai (Textures)
FAL_KEY=fal_...

# Redis (Job Queue)
REDIS_URL=redis://localhost:6379

# MCP Servers
MCP_TERRAIN_FORGE_URL=http://localhost:3010
MCP_CITY_ARCHITECT_URL=http://localhost:3011
MCP_ASSET_ALCHEMIST_URL=http://localhost:3012
```

### Phase 2
```env
# Roblox Open Cloud
ROBLOX_OPEN_CLOUD_API_KEY=...
ROBLOX_CREATOR_ID=...
ROBLOX_CREATOR_TYPE=User

# Asset Storage (Cloudflare R2 or S3)
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=forjegames-assets
R2_PUBLIC_URL=https://assets.forjegames.com
```

### Phase 5
```env
# Deepgram (Speech-to-Text)
DEEPGRAM_API_KEY=...

# ElevenLabs (Text-to-Speech)
ELEVENLABS_API_KEY=...
```

### Already Configured
```env
# Clerk, Stripe, PostgreSQL, Sentry, PostHog, Resend
# (all already in .env.local per existing setup)
```

---

## TESTING STRATEGY

### Unit Tests (vitest -- already configured)
- `src/lib/quality-gates.test.ts` -- Quality gate logic
- `src/lib/cost-tracker.test.ts` -- Cost calculation accuracy
- `src/lib/ai/build-planner.test.ts` -- Plan structure validation
- `src/lib/pipeline/orchestrator.test.ts` -- State machine transitions
- `src/lib/roblox-open-cloud.test.ts` -- API wrapper logic

### Integration Tests
- `tests/integration/mesh-pipeline.test.ts` -- Full pipeline: generate -> optimize -> upload
- `tests/integration/studio-sync.test.ts` -- Companion + plugin communication
- `tests/integration/build-execution.test.ts` -- Full build plan execution
- `tests/integration/game-scanner.test.ts` -- Roblox API data gathering

### E2E Tests (Playwright)
- Signup -> first chat -> first generation flow
- Asset generation -> 3D preview -> send to Studio
- Build plan creation -> approval -> execution -> completion
- Marketplace browse -> purchase -> use template
- Game DNA scan -> results -> apply recommendation

### Load Tests
- 50 concurrent mesh generations
- 100 concurrent chat sessions
- 200 concurrent Studio polling sessions
- Queue backlog recovery after 1000 job burst

### Manual QA Checklist
- [ ] Generate 10 different asset types, all import into Studio
- [ ] Build plan for each game type (tycoon, obby, simulator, RPG)
- [ ] Voice input in Chrome, Firefox, Safari, Edge
- [ ] 3D preview on iPhone, Android, iPad
- [ ] Team collaboration with 3 concurrent users
- [ ] Game DNA scan on top 10 Roblox games
- [ ] Publish flow end-to-end
- [ ] Payment flow for all tiers
- [ ] Token depletion behavior
- [ ] Rate limiting behavior at each tier

---

## TOTAL EFFORT SUMMARY

| Phase | Description | Hours | Weeks |
|-------|------------|-------|-------|
| Phase 1 | Kill Demo Mode | 64h | 1-2 |
| Phase 2 | Mesh Pipeline | 70h | 3-4 |
| Phase 3 | Smart Connect | 44h | 5-6 |
| Phase 4 | AI Orchestration | 92h | 7-8 |
| Phase 5 | Magic UX | 68h | 9-10 |
| Phase 6 | Scale & Monetize | 98h | 11-12 |
| **Total** | | **436h** | **12 weeks** |

**Buffer (30%):** +131h for unknowns, bug fixes, polish
**Grand Total:** ~567 hours / 12 weeks

At 40h/week with tooling: achievable solo with AI assistance.
At 60h/week sprint: comfortable with 2-week buffer.

---

## IMPLEMENTATION ORDER (CRITICAL PATH)

Week 1: Tasks 1.5, 1.6, 1.1 (Job Queue + DB + MCP -- foundations)
Week 2: Tasks 1.2, 1.3, 1.4, 1.7 (AI endpoints -- kill demo)
Week 3: Tasks 2.1, 2.3 (Blender Docker + Quality Gates)
Week 4: Tasks 2.2, 2.5, 2.4 (Upload + Pipeline + Asset UI)
Week 5: Tasks 3.1, 3.2, 3.4 (Companion + Auto-Detect + Plugin Update)
Week 6: Tasks 3.3, 3.5 (Asset Delivery + Health Monitor)
Week 7: Tasks 4.1, 4.3 (Build Planner + Luau Templates)
Week 8: Tasks 4.2, 4.4, 4.5, 4.6 (Executor + Dashboard + Memory + Templates)
Week 9: Tasks 5.1, 5.3, 5.4 (Onboarding + 3D Preview + Suggestions)
Week 10: Tasks 5.2, 5.5 (Voice + Collaboration)
Week 11: Tasks 6.1, 6.2, 6.4, 6.6 (Costs + Tiers + Scanner + Monitoring)
Week 12: Tasks 6.3, 6.5, 6.7 (Marketplace + Publish + Cache Optimization)

---

## NEW DEPENDENCIES TO INSTALL (COMPLETE LIST)

```bash
# Phase 1
npm install bullmq @modelcontextprotocol/sdk @fal-ai/client

# Phase 2
npm install @aws-sdk/client-s3

# Phase 5
npm install @deepgram/sdk
```

**Already installed (no action needed):**
- @anthropic-ai/sdk (Anthropic)
- ioredis (Redis)
- stripe (Payments)
- @clerk/nextjs (Auth)
- @react-three/fiber, @react-three/drei, three (3D Preview)
- @sentry/nextjs (Error tracking)
- posthog-js, posthog-node (Analytics)
- zod (Validation)

---

*END OF PLAN -- FORJEGAMES 1000X*
*436 hours. 12 weeks. 6 phases. One mission: make every kid a game developer.*
