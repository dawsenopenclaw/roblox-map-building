# ForjeGames Editor — Complete Technical Specification

**Status:** Design
**Written:** 2026-03-28
**Author:** Architect Agent
**Depends on:** Phase 04 (web-platform), Phase 05 (mcp-studio-plugin)

---

## 1. North Star

One URL, one screen. User speaks or types. AI executes. 3D view updates. Nothing else visible unless explicitly requested through chat.

The existing platform (dashboard, marketplace, settings, billing) does not disappear — it becomes accessible only via chat commands. The editor IS the product.

---

## 2. URL Structure

```
forgegames.com/              → landing (logo + one-line + "Open Editor" CTA)
forgegames.com/editor        → full-screen editor (auth-gated)
forgegames.com/editor/[id]   → editor with a specific project loaded
```

No other routes are user-facing from the editor flow.

---

## 3. Component Hierarchy

```
EditorPage (src/app/(app)/editor/[[...id]]/page.tsx)
  └── EditorShell (client, full viewport)
        ├── ViewportPanel (top 80vh)
        │     ├── ViewportFrame
        │     │     ├── StudioEmbedBridge  ← iframe or WebSocket feed
        │     │     └── ViewportOverlay
        │     │           ├── ConnectionStatus
        │     │           ├── AgentActivityFeed
        │     │           ├── ContextMenu (right-click)
        │     │           └── CoordinateDisplay
        │     └── ViewportToolbar (floating, top-left)
        │           ├── ProjectTitle (editable)
        │           ├── UndoRedoButtons
        │           └── PublishButton
        │
        ├── ChatPanel (bottom 20vh)
        │     ├── ConversationHistory (scrollable, newest at bottom)
        │     │     ├── UserMessage
        │     │     ├── AgentMessage (with tier badges)
        │     │     └── AgentActivitySummary (collapsed after completion)
        │     ├── InputRow
        │     │     ├── ChatInput (textarea, auto-expand, max 3 lines)
        │     │     ├── MicButton (Web Speech API)
        │     │     └── SendButton
        │     └── TokenCostPreview (shown during typing, estimates cost)
        │
        └── CollapsibleSidebar (icon rail, right edge, 48px wide collapsed)
              ├── ProjectsIcon → "/projects" chat shortcut
              ├── MarketplaceIcon → triggers "show me marketplace" command
              ├── SettingsIcon → triggers "open settings" command
              └── HelpIcon → triggers "help" command
```

---

## 4. Landing Page

Path: `src/app/(marketing)/editor-landing/page.tsx` (or override `(marketing)/page.tsx` to add editor CTA)

Structure:
- Full-viewport dark hero
- Logo (top-center or top-left)
- Tagline: "Build Roblox games with a single sentence."
- Primary CTA: "Open Editor" → `/editor` (auth-gated, redirects to sign-in if not authed)
- Secondary: small text "No setup. No tutorials. Just build."
- Zero other nav links on the page itself

The existing marketing landing page at `/` is NOT replaced — the editor landing is a separate, minimal entrypoint. Consider making `/editor` the new primary CTA destination from the marketing hero.

---

## 5. Editor Page Layout

```
+------------------------------------------------------------------+
|  [ProjectTitle]  [Undo] [Redo]           [Publish]  [•] Online  |  ← ViewportToolbar (48px)
+------------------------------------------------------------------+
|                                                              [>] |
|                                                                  |
|                    3D VIEWPORT                              [S]  |
|                (Roblox Studio iframe /                      [M]  |
|                 WebSocket pixel feed /                      [?]  |
|                 preview renderer)                                |
|                                                                  |
|  Agent activity feed (bottom-left, stacked badges)              |
+------------------------------------------------------------------+
|  [Agent: Terrain ●] [Agent: Building ●] [Agent: NPC ●]          |  ← active agent strip
+------------------------------------------------------------------+
|  ConversationHistory                                            ^|
|  ...                                                            ||
|  You: "add a castle here"                                      v|
|  System: Running 4 agents... Castle placed at (120, 0, 340)     |
+------------------------------------------------------------------+
|  [mic]  Type a command or press Space to speak...    [Send ▶]   |  ← InputRow
+------------------------------------------------------------------+
```

Proportions:
- Viewport: `calc(80vh - 48px)` (minus toolbar)
- Active agent strip: `32px` (hidden when no agents running)
- Chat history: flex-grow, min `4rem`
- Input row: `56px`
- Total chat panel: `20vh`

---

## 6. 3D Viewport Integration

### Option A — Studio Plugin iframe Bridge (PRIMARY, Phase 5 exists)

The existing Studio plugin polls `/api/studio/sync` every 2s. For the editor viewport to show a live 3D feed, we need a reverse channel: Studio renders and streams screenshots back.

Implementation path:
1. Studio plugin adds a `ScreenshotCapture.lua` module that calls `game:GetService("RunService").Heartbeat` and captures a screenshot via `game:GetService("Stats"):GetPing()`... (Studio does not expose a real screenshot API from plugin context — see constraint below)
2. **Realistic path:** Studio plugin injects a `ScreenshotSurface` Part in Workspace that the plugin periodically uses `plugin:GetMouse()` viewport data to generate a position map — not a real video feed.

**Practical Constraint:** Roblox Studio plugin API does not provide a video capture or screen share mechanism. The viewport must be one of:

### Option B — Viewport Preview Renderer (RECOMMENDED for MVP)

A custom 3D preview rendered in-browser using Three.js or Babylon.js, synchronized with the game state via the Studio sync API.

- Studio plugin sends change events to `/api/studio/update` (already built)
- Web app reads those changes and applies them to a Three.js scene
- Not a pixel-perfect Roblox render, but shows spatial layout correctly
- Sufficient for "add a castle here" → see castle appear in roughly the right location

Viewport state model:
```typescript
interface ViewportState {
  instances: ViewportInstance[]
  terrain: TerrainChunk[]
  camera: CameraState
  selection: string[]  // instance IDs
}

interface ViewportInstance {
  id: string
  assetId?: string
  position: Vector3
  rotation: Vector3
  size: Vector3
  color: string
  name: string
  type: 'Part' | 'Model' | 'NPC' | 'Vehicle'
}

interface TerrainChunk {
  x: number
  z: number
  resolution: 16  // 16x16 grid per chunk
  heights: number[]  // 256 values
  materials: string[]  // 256 material names
}
```

### Option C — Roblox Game Embed (PHASE 2)

Use Roblox's `experiences.roblox.com/embed` URL to embed a running server instance. Requires the game to be published and the embed endpoint to be authorized. Valid for finished-game previewing, not for real-time editing.

### Recommended Phasing

| Phase | Viewport Mode |
|-------|--------------|
| MVP | Three.js preview renderer synced to Studio state |
| V2 | Split view: Three.js left, Studio screenshot right |
| V3 | Full Roblox embed with published experience |

---

## 7. Chat Command Routing Logic

### 7.1 Input Processing Pipeline

```
User input (text or voice transcription)
    ↓
InputSanitizer (strip injection, length cap 2000 chars)
    ↓
IntentParser Agent (Tier 1)
    ↓  returns: { intent, entities, confidence, estimatedCost, tier[] }
CostEstimator Agent (Tier 1, parallel with context)
    ↓
ContextAgent (Tier 1, parallel)
    ↓  returns: { currentGame, recentBuilds, selectedInstances, cameraPosition }
    ↓
[User sees: "Estimated cost: ~12 tokens. Running 4 agents..."]
    ↓
OrchestratorDispatch (routes to Tier 2 agents)
    ↓
[Tier 2 agents execute in parallel where possible]
    ↓
[Tier 3 QA agents run post-execution]
    ↓
StudioPushChange (sends commands to Roblox Studio via existing /api/studio/push-change)
    ↓
ViewportUpdate (Three.js scene updated)
    ↓
ChatResponse (summary message in conversation history)
```

### 7.2 Intent Taxonomy

```typescript
type Intent =
  // Terrain
  | 'terrain.generate'      // "make the terrain mountainous"
  | 'terrain.modify'        // "flatten this area"
  | 'terrain.paint'         // "add snow to the peaks"
  // Building
  | 'building.add'          // "add a castle here"
  | 'building.remove'       // "delete those trees"
  | 'building.modify'       // "make the tower taller"
  // NPC
  | 'npc.create'            // "add NPCs that patrol the village"
  | 'npc.configure'         // "make the guard hostile"
  | 'npc.dialogue'          // "give the merchant a shop dialogue"
  // Script
  | 'script.create'         // "add a leaderboard"
  | 'script.modify'         // "change the walk speed to 24"
  // UI
  | 'ui.create'             // "add a health bar"
  | 'ui.modify'             // "change the shop UI colors"
  // Audio
  | 'audio.add'             // "add ambient forest sounds"
  | 'audio.modify'          // "make the music more intense"
  // Lighting
  | 'lighting.set'          // "set it to sunset"
  | 'lighting.atmosphere'   // "add fog"
  // Economy
  | 'economy.design'        // "add a coin system"
  | 'economy.balance'       // "double the drop rates"
  // Meta
  | 'platform.marketplace'  // "show me marketplace"
  | 'platform.settings'     // "open settings"
  | 'platform.dna'          // "scan this game's DNA"
  | 'platform.publish'      // "publish my game"
  | 'platform.undo'         // "undo that"
  | 'platform.help'         // "help"
  | 'unknown'
```

### 7.3 Routing Table

```typescript
const INTENT_ROUTING: Record<Intent, AgentTier2[]> = {
  'terrain.generate':   ['TerrainAgent', 'LightingAgent'],
  'terrain.modify':     ['TerrainAgent'],
  'building.add':       ['BuildingAgent', 'VisualInspector'],
  'building.remove':    ['BuildingAgent'],
  'npc.create':         ['NPCAgent', 'ScriptAgent', 'AnimationAgent'],
  'script.create':      ['ScriptAgent', 'UIAgent'],
  'economy.design':     ['EconomyAgent', 'ScriptAgent', 'MonetizationAgent'],
  'platform.publish':   ['PublishAgent'],
  // ... etc
}
```

### 7.4 Chat Commands That Trigger Platform Navigation

These bypass agents entirely and navigate or open UI panels:

| Command | Action |
|---------|--------|
| "show me marketplace" | Opens marketplace panel in sidebar |
| "open settings" | Opens settings sheet overlay |
| "scan this game's DNA" | Triggers DNA Agent inline |
| "publish my game" | Opens publish flow |
| "how much have I spent" | Shows token cost summary inline |
| "undo that" | Calls `/api/studio/push-change` with undo signal |
| "help" | Shows contextual help in chat |

---

## 8. Agent Architecture

### 8.1 Tier 1 — Command Understanding (always runs, parallel)

| Agent | Responsibility | Model | Latency Target |
|-------|---------------|-------|---------------|
| IntentParser | Parse natural language → Intent + entities | Claude Haiku | <500ms |
| ContextAgent | Load game state, recent history, selection | DB lookup | <200ms |
| CostEstimator | Estimate token cost before execution | Haiku + lookup table | <300ms |

IntentParser prompt contract:
```typescript
// Input
{ command: string, context: GameContext }

// Output
{
  intent: Intent
  entities: {
    targetPosition?: Vector3       // "here", "over there", selected area
    targetInstances?: string[]     // selected/named instances
    style?: string                 // "medieval", "sci-fi"
    scale?: 'small' | 'medium' | 'large'
    count?: number
    biome?: string
    npcType?: string
    scriptType?: string
  }
  confidence: number               // 0-1
  ambiguities: string[]            // ["unclear where 'here' is"]
  requiresConfirmation: boolean    // true if cost > 50 tokens
}
```

### 8.2 Tier 2 — Execution Agents

Each agent is a backend service function (not a separate process) in `apps/api/src/agents/`.

```
apps/api/src/agents/
  tier1/
    intent-parser.ts
    context-agent.ts
    cost-estimator.ts
  tier2/
    terrain-agent.ts        ← wraps terrain-forge MCP
    building-agent.ts       ← wraps city-architect MCP + asset-alchemist MCP
    npc-agent.ts
    script-agent.ts
    ui-agent.ts
    audio-agent.ts
    lighting-agent.ts
    physics-agent.ts
    economy-agent.ts
    animation-agent.ts
    particle-agent.ts
    vehicle-agent.ts
    combat-agent.ts
    quest-agent.ts
    inventory-agent.ts
    monetization-agent.ts
  tier3/
    visual-inspector.ts
    performance-agent.ts
    playtester-agent.ts
    bug-detector.ts
  tier4/
    marketplace-agent.ts
    dna-agent.ts
    publish-agent.ts
  orchestrator.ts           ← dispatches all tiers
```

### 8.3 Agent Contract (all Tier 2)

```typescript
interface AgentInput {
  intent: Intent
  entities: ParsedEntities
  context: GameContext
  projectId: string
  userId: string
}

interface AgentOutput {
  success: boolean
  studioChanges: StudioChange[]   // pushed to /api/studio/push-change
  viewportUpdates: ViewportPatch[]
  chatMessage: string             // shown to user in conversation
  tokensUsed: number
  errors?: string[]
}

interface StudioChange {
  type: 'insert' | 'modify' | 'delete' | 'script' | 'terrain' | 'property'
  target?: string                 // instance path or id
  data: Record<string, unknown>
}
```

### 8.4 Orchestrator Dispatch Logic

```typescript
async function orchestrate(input: OrchestratorInput): Promise<void> {
  // Step 1: Parallel Tier 1
  const [parsed, context, estimate] = await Promise.all([
    intentParser(input.command, input.projectId),
    contextAgent(input.projectId, input.userId),
    costEstimator(input.command)
  ])

  // Step 2: If cost > 50 tokens, ask confirmation (stream message back)
  if (estimate.tokens > 50 && !input.confirmed) {
    yield { type: 'confirm_required', estimate }
    return
  }

  // Step 3: Resolve agents for this intent
  const agents = INTENT_ROUTING[parsed.intent] ?? []

  // Step 4: Identify parallelizable vs sequential agents
  // Build dependency graph: some agents need outputs from others
  // e.g., ScriptAgent may need NPCAgent output to wire behavior scripts
  const { parallel, sequential } = resolveDependencies(agents, parsed)

  // Step 5: Run parallel batch
  const parallelResults = await Promise.allSettled(
    parallel.map(agent => agent.run({ ...parsed, context }))
  )

  // Step 6: Run sequential agents with prior results
  let sequentialResults = []
  for (const agent of sequential) {
    const result = await agent.run({ ...parsed, context, priorResults: [...parallelResults, ...sequentialResults] })
    sequentialResults.push(result)
  }

  // Step 7: Tier 3 QA (parallel, non-blocking on UI but waits before final message)
  const all = [...parallelResults, ...sequentialResults]
  const qaResults = await Promise.allSettled([
    visualInspector.run(all),
    performanceAgent.run(all)
  ])

  // Step 8: Push all studio changes
  const changes = all.flatMap(r => r.studioChanges)
  await pushChangesToStudio(changes, input.projectId)

  // Step 9: Update viewport
  const patches = all.flatMap(r => r.viewportUpdates)
  await broadcastViewportPatches(patches, input.projectId)

  // Step 10: Compose and stream final chat message
  yield { type: 'complete', summary: composeMessage(all, qaResults) }
}
```

### 8.5 Agent Parallelism Rules

Agents that can ALWAYS run in parallel:
- TerrainAgent + LightingAgent (no shared mutation)
- AudioAgent + ParticleAgent
- UIAgent + ScriptAgent (UI scripts are separate)
- VisualInspector + PerformanceAgent (Tier 3)

Agents that MUST run sequentially:
- NPCAgent → ScriptAgent (NPC behavior scripts need NPC IDs)
- BuildingAgent → PhysicsAgent (constraints need instances to exist)
- EconomyAgent → MonetizationAgent (gamepass design needs economy schema)
- AnimationAgent after NPCAgent (needs character rig)

---

## 9. API Endpoints

All new endpoints under `apps/api/src/routes/editor.ts`.

### 9.1 Command Endpoint (primary)

```
POST /api/editor/command
Authorization: Bearer <clerk_jwt>

Request:
{
  projectId: string
  command: string
  confirmed?: boolean        // true = skip cost confirmation gate
  context?: {
    cameraPosition?: Vector3
    selectedInstances?: string[]
    cursorWorldPosition?: Vector3
  }
}

Response: text/event-stream (SSE)
Events:
  { type: 'intent', data: ParsedIntent }
  { type: 'cost_estimate', data: { tokens: number, usdCents: number } }
  { type: 'confirm_required', data: { message: string } }
  { type: 'agent_start', data: { agent: string, tier: number } }
  { type: 'agent_complete', data: { agent: string, message: string } }
  { type: 'viewport_patch', data: ViewportPatch[] }
  { type: 'studio_push', data: StudioChange[] }
  { type: 'qa_result', data: { passed: boolean, issues: string[] } }
  { type: 'complete', data: { summary: string, tokensUsed: number } }
  { type: 'error', data: { message: string, recovery: string } }
```

Why SSE not WebSocket: SSE is unidirectional server→client, simpler for streaming agent progress. The client POSTs commands; the server streams back events. This matches the existing Hono patterns in the project.

### 9.2 Project State Endpoints

```
GET  /api/editor/project/:id/state        → full viewport state
GET  /api/editor/project/:id/history      → last 50 commands
POST /api/editor/project/:id/undo         → undo last command
POST /api/editor/project/:id/redo
```

### 9.3 Viewport Sync Endpoint

```
GET  /api/editor/viewport/:projectId/stream   → SSE stream of ViewportPatch events
     (long-lived connection, client connects on editor load)
     (server pushes patches whenever studio changes arrive)
```

This creates a real-time loop:
- Studio plugin → `/api/studio/update` → Redis queue → viewport stream SSE → Three.js scene

### 9.4 Agent Activity Feed

```
GET  /api/editor/project/:id/agents/active    → SSE stream of active agent events
     Events: { agentName, tier, status: 'running' | 'done' | 'failed', progress: 0-1 }
```

### 9.5 Cost Estimate (pre-flight)

```
POST /api/editor/estimate
{ command: string }
→ { tokens: number, usdCents: number, agents: string[], estimatedSeconds: number }
```

---

## 10. Data Flow Diagrams

### 10.1 Command Execution Flow

```
Browser (Chat Input)
    │  POST /api/editor/command (SSE)
    ↓
API: OrchestratorRoute
    │
    ├── IntentParser ──────────────────────────┐
    ├── ContextAgent ──────────────────────────┤ (parallel, ~500ms)
    └── CostEstimator ─────────────────────────┘
    │
    │  SSE: { type: 'intent' }
    │  SSE: { type: 'cost_estimate' }
    │
    ├── [if cost > 50 tokens] → SSE: { type: 'confirm_required' }
    │   [client shows confirm dialog in chat]
    │   [user replies "yes" → new POST with confirmed: true]
    │
    ├── Tier 2 Parallel Agents ─────────────────┐
    │       TerrainAgent (wraps terrain-forge MCP)
    │       BuildingAgent (wraps city-architect + asset-alchemist)
    │       ...                                 │ (parallel, 2-15s)
    │   SSE: { type: 'agent_start' } × N        │
    │   SSE: { type: 'agent_complete' } × N ────┘
    │
    ├── Tier 2 Sequential Agents (dependency-ordered)
    │       NPCAgent → ScriptAgent
    │
    ├── Tier 3 QA Agents ─────────────────────┐
    │       VisualInspector                   │ (parallel, ~1s)
    │       PerformanceAgent                  │
    │   SSE: { type: 'qa_result' } ───────────┘
    │
    ├── Push to Studio
    │       POST /api/studio/push-change (existing endpoint)
    │   SSE: { type: 'studio_push' }
    │
    ├── Broadcast Viewport Patches
    │       ViewportSync SSE stream → Three.js scene update
    │   SSE: { type: 'viewport_patch' }
    │
    └── SSE: { type: 'complete', summary: "..." }
```

### 10.2 Viewport State Sync Loop

```
Roblox Studio (plugin)
    │  Studio plugin: Sync.lua polls every 2s
    │  Also: AssetManager.lua tags all insertions
    ↓
POST /api/studio/update
    │  Writes to Redis: studio:changes:{userId} list
    ↓
Redis Change Queue
    ↑  GET /api/editor/viewport/:projectId/stream (SSE, long-lived)
    │  ViewportSyncService polls Redis every 500ms
    │  Converts StudioChange → ViewportPatch
    ↓
SSE: ViewportPatch stream
    ↓
Three.js Viewport (browser)
    │  Applies patches to scene graph
    │  Animates new/modified instances
    ↓
User sees 3D view update in real-time (~500-2500ms latency)
```

### 10.3 Voice Input Flow

```
User presses Mic button
    │
    ↓
Web Speech Recognition API (browser-native, no cost)
    │  Interim transcription shown live in chat input
    │  On silence/pause: finalizes transcript
    ↓
ChatInput.value = transcript
    │
    ↓  (same as typed command from here)
POST /api/editor/command
```

---

## 11. Frontend State Management

The editor uses a dedicated Zustand store (`src/stores/editorStore.ts`):

```typescript
interface EditorStore {
  // Project
  projectId: string | null
  projectName: string

  // Viewport
  viewportState: ViewportState
  applyViewportPatch: (patch: ViewportPatch) => void

  // Chat
  messages: ChatMessage[]
  addMessage: (msg: ChatMessage) => void
  isProcessing: boolean

  // Agents
  activeAgents: AgentStatus[]
  updateAgentStatus: (agent: string, status: AgentStatus) => void

  // SSE connections
  commandStream: EventSource | null
  viewportStream: EventSource | null
  connect: (projectId: string) => void
  disconnect: () => void

  // Selection (for context passing)
  selectedInstances: string[]
  cursorWorldPosition: Vector3 | null

  // Token cost preview
  pendingEstimate: CostEstimate | null
  setPendingEstimate: (e: CostEstimate | null) => void
}
```

---

## 12. Chat Message Types

```typescript
type ChatMessage =
  | { type: 'user'; id: string; text: string; ts: number }
  | { type: 'system'; id: string; text: string; ts: number; level: 'info' | 'success' | 'error' }
  | { type: 'agent_activity'; id: string; agents: AgentStatus[]; ts: number; collapsed: boolean }
  | { type: 'confirm_request'; id: string; estimate: CostEstimate; ts: number }
  | { type: 'qa_result'; id: string; passed: boolean; issues: string[]; ts: number }
```

Agent activity messages auto-collapse after completion. The conversation history stays clean — each command leaves a single user message + single system result message. Agent activity is shown in real-time but collapses to a badge row after ~3s.

---

## 13. Collapsible Sidebar

48px icon rail on the right edge. Expands to 280px on click.

Icons (top to bottom):
- Folder — Projects panel (recent projects, new project)
- Storefront — Marketplace shortcut (posts "show me marketplace" to chat)
- Gear — Settings sheet
- DNA helix — Game DNA scanner
- Question mark — Help

The sidebar never contains heavy UI. It is a quick-access strip. Complex actions always happen through chat.

---

## 14. New Files to Create

```
src/app/(app)/editor/[[...id]]/
  page.tsx                      ← EditorPage (server component, auth guard)
  loading.tsx                   ← Viewport skeleton

src/components/editor/
  EditorShell.tsx               ← client, full-screen layout manager
  ViewportPanel.tsx             ← Three.js canvas + overlay
  ViewportOverlay.tsx           ← connection status, agent badges, coordinates
  ViewportToolbar.tsx           ← project title, undo/redo, publish
  ChatPanel.tsx                 ← conversation history + input row
  ChatMessage.tsx               ← message variants
  ChatInput.tsx                 ← textarea + mic + send
  AgentActivityRow.tsx          ← live/collapsed agent status strip
  TokenCostPreview.tsx          ← inline cost estimate during typing
  CollapsibleSidebar.tsx        ← icon rail + panels
  ThreeViewport.tsx             ← Three.js scene, patching logic

src/stores/
  editorStore.ts                ← Zustand store

src/lib/editor/
  viewport-patch.ts             ← StudioChange → ViewportPatch converter
  intent-router.ts              ← INTENT_ROUTING table
  agent-deps.ts                 ← dependency graph for parallel/sequential

apps/api/src/routes/
  editor.ts                     ← /api/editor/* routes

apps/api/src/agents/
  orchestrator.ts
  tier1/intent-parser.ts
  tier1/context-agent.ts
  tier1/cost-estimator.ts
  tier2/terrain-agent.ts
  tier2/building-agent.ts
  tier2/npc-agent.ts
  tier2/script-agent.ts
  tier2/ui-agent.ts
  tier2/audio-agent.ts
  tier2/lighting-agent.ts
  tier2/physics-agent.ts
  tier2/economy-agent.ts
  tier2/animation-agent.ts
  tier2/particle-agent.ts
  tier2/vehicle-agent.ts
  tier2/combat-agent.ts
  tier2/quest-agent.ts
  tier2/inventory-agent.ts
  tier2/monetization-agent.ts
  tier3/visual-inspector.ts
  tier3/performance-agent.ts
  tier3/playtester-agent.ts
  tier3/bug-detector.ts
  tier4/marketplace-agent.ts
  tier4/dna-agent.ts
  tier4/publish-agent.ts
```

---

## 15. Files to Modify

```
src/app/(app)/layout.tsx         ← add editor route to auth group
src/components/AppSidebar.tsx    ← add "Editor" nav item pointing to /editor
apps/api/src/index.ts            ← mount editorRoutes
```

The existing AppShell and AppSidebar from Phase 4 are NOT used inside the editor. The editor is its own full-screen layout. The editor page renders without the AppShell wrapper — it gets only the Clerk auth guard from the server layout.

---

## 16. Dependencies to Add

```json
{
  "three": "^0.163.0",
  "@types/three": "^0.163.0",
  "zustand": "^4.5.0"        // if not already installed
}
```

Three.js for the viewport. Zustand for editor state. Both are lightweight and already aligned with the Next.js 15 architecture in the project.

---

## 17. Token Cost Model

The CostEstimator uses a lookup table before running agents:

| Action Type | Estimated Tokens | USD (at $0.01/token) |
|-------------|-----------------|----------------------|
| Simple terrain modify | 8-15 | $0.08-0.15 |
| Add single building | 12-20 | $0.12-0.20 |
| Generate full terrain biome | 30-50 | $0.30-0.50 |
| Add NPC with behavior | 25-40 | $0.25-0.40 |
| Write Luau script | 20-35 | $0.20-0.35 |
| Design economy system | 40-70 | $0.40-0.70 |
| Full game generation | 800-1200 | $8.00-12.00 |

Confirmation gate triggers at >50 tokens. This matches the two-phase estimate→confirm pattern established in Phase 3.

---

## 18. Performance Requirements

- Chat input to first SSE event: <500ms
- Intent parsed and shown to user: <800ms
- Simple command (add single asset) total: <5s
- Complex command (terrain + buildings + NPCs): <20s
- Viewport patch applied after Studio update: <2.5s
- Three.js scene patch application: <100ms (requestAnimationFrame)
- Mobile viewport: renders at 30fps minimum

---

## 19. Error Handling

| Failure Mode | Recovery |
|-------------|---------|
| Studio not connected | Chat shows "Studio not connected — install plugin" with link |
| Agent returns error | Show error in chat, offer "try a simpler version?" suggestion |
| Cost confirm timeout (user ignores) | Command auto-cancels after 60s, tokens not charged |
| SSE connection drops | Client auto-reconnects with exponential backoff (1s, 2s, 4s, max 30s) |
| Three.js render error | Viewport falls back to "top-down 2D map view" |
| Ambiguous intent | IntentParser returns `ambiguities[]`, chat asks clarifying question |
| Over token budget | CostEstimator blocks, shows upgrade prompt inline in chat |

---

## 20. Build Order

1. `apps/api/src/agents/tier1/` — intent parser, context agent, cost estimator
2. `apps/api/src/agents/orchestrator.ts` — dispatch logic
3. `apps/api/src/routes/editor.ts` — SSE command endpoint
4. `src/stores/editorStore.ts` — Zustand store
5. `src/lib/editor/viewport-patch.ts` — patch converter
6. `src/components/editor/ThreeViewport.tsx` — Three.js scene
7. `src/components/editor/ChatPanel.tsx` + `ChatInput.tsx`
8. `src/components/editor/EditorShell.tsx` — assembles panels
9. `src/app/(app)/editor/[[...id]]/page.tsx` — route
10. Tier 2 agents (in parallel sprints: terrain/building first, then NPC/script, then rest)
11. Tier 3 QA agents
12. Tier 4 platform agents

---

*Last updated: 2026-03-28*
