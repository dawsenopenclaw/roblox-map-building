---
phase: "05"
plan: "05"
subsystem: "mcp-studio-plugin"
tags: ["mcp", "studio-plugin", "lua", "terrain", "city", "assets", "sync"]
dependency_graph:
  requires: ["04-web-platform", "03-ai-pipeline"]
  provides: ["terrain-forge-mcp", "city-architect-mcp", "asset-alchemist-mcp", "studio-plugin", "studio-sync-api"]
  affects: ["apps/api", "packages/mcp", "packages/studio-plugin"]
tech_stack:
  added:
    - "@modelcontextprotocol/sdk ^1.0.0"
    - "@anthropic-ai/sdk ^0.32.0 (in MCP packages)"
  patterns:
    - "MCP stdio transport pattern"
    - "Roblox DockWidgetPluginGui dark theme"
    - "Redis change queue with TTL"
    - "Heartbeat-based HTTP polling with exponential backoff"
    - "ChangeHistoryService waypoint wrapping"
key_files:
  created:
    - "packages/mcp/terrain-forge/package.json"
    - "packages/mcp/terrain-forge/src/index.ts"
    - "packages/mcp/terrain-forge/tsconfig.json"
    - "packages/mcp/city-architect/package.json"
    - "packages/mcp/city-architect/src/index.ts"
    - "packages/mcp/city-architect/tsconfig.json"
    - "packages/mcp/asset-alchemist/package.json"
    - "packages/mcp/asset-alchemist/src/index.ts"
    - "packages/mcp/asset-alchemist/tsconfig.json"
    - "packages/studio-plugin/Plugin.lua"
    - "packages/studio-plugin/Auth.lua"
    - "packages/studio-plugin/UI.lua"
    - "packages/studio-plugin/Sync.lua"
    - "packages/studio-plugin/AssetManager.lua"
    - "packages/studio-plugin/History.lua"
    - "apps/api/src/routes/studio.ts"
  modified:
    - "apps/api/src/index.ts"
decisions:
  - "MCP servers use stdio transport (standard for local tooling), not HTTP"
  - "City layout uses concentric zone rings (commercial core → mixed → residential → industrial) matching real urban planning"
  - "Asset-alchemist circuit breakers per provider (Meshy, Fal) with 3-failure threshold and 30s reset"
  - "Studio plugin polls GET /api/studio/sync every 2-5s via RunService.Heartbeat (no WebSocket in Studio)"
  - "Redis change queue capped at 500 entries with 1h TTL to prevent unbounded growth"
  - "All Studio operations wrapped in ChangeHistoryService waypoints named RF_OperationName for identifiable undo stack"
metrics:
  duration: "~35 minutes"
  completed: "2026-03-28"
  tasks: 3
  files: 18
---

# Phase 5: MCP Servers + Studio Plugin Summary

**One-liner:** Three MCP servers (terrain-forge, city-architect, asset-alchemist) exposing AI generation as MCP tools, plus a full Roblox Studio plugin with OAuth, HTTP polling sync, asset injection, and ChangeHistoryService undo/redo.

## What Was Built

### MCP-01: terrain-forge (`packages/mcp/terrain-forge/`)

MCP server exposing three terrain generation tools over stdio:

- **generate_terrain** — accepts natural language biome description (e.g. "snowy mountain range with frozen lake"), calls Claude to parse biome intent, then generates a 32x32 heightmap grid with Roblox material assignments. Supports optional seed for reproducible output.
- **smooth_terrain** — multi-pass neighbor-averaging smoothing over any heightmap, with configurable passes (1-10) and strength (0-1). Optional region subselection.
- **paint_terrain** — assigns a Roblox material to a region with optional edge blending. Can merge material changes back into an existing heightmap.

Token metering on every Claude call. Deterministic noise generation (no external dep) for heightmap values.

### MCP-02: city-architect (`packages/mcp/city-architect/`)

MCP server with grid-based urban planning algorithms + Claude style interpretation:

- **generate_city_layout** — Claude interprets style (modern-downtown, medieval-village, etc.), then `createUrbanGrid()` generates main roads (every 2 blocks), secondary roads (every block), and optional alleys. Zone assignment uses concentric rings: commercial core → mixed → residential → industrial/park.
- **generate_road_network** — standalone road generation with four patterns: grid, radial (8 spokes + concentric rings), organic (golden-ratio-spaced irregular roads), highway (perimeter). Optional perimeter highway.
- **place_buildings** — places buildings within zones using zone-type → building-type mapping, with sparse/medium/dense density control.

### MCP-03: asset-alchemist (`packages/mcp/asset-alchemist/`)

Multi-model pipeline with per-provider circuit breakers:

- **generate_3d_model** — Claude enriches the prompt (adds specificity, low-poly focus), then calls Meshy text-to-3D API. Returns job ID for async polling.
- **generate_texture** — Claude enriches for PBR/tileable output, then calls Fal flux/schnell. Returns texture URL.
- **generate_asset_pack** — Claude generates an asset list from the theme, then runs Meshy (N models) + Fal (2 textures) in parallel via Promise.all. Full circuit breaker state reported.

Circuit breakers: 3-failure threshold, 30s reset, per-provider (meshyBreaker, falBreaker). Token metering with separate tracking for Claude vs external providers.

### PLUG-01: Plugin Shell (`packages/studio-plugin/Plugin.lua` + `UI.lua`)

- `Plugin.lua`: Creates toolbar button + `DockWidgetPluginGuiInfo` docked right (380px wide). Module-safe loading via `pcall(require, ...)`. Persists auth token via `plugin:SetSetting`. Builds fallback inline UI if UI.lua not loaded. Wires quick action buttons.
- `UI.lua`: Full panel — header with gold "ForjeGames" branding + status dot, scrollable content area, auth card (connected state/email/button), sync status card (connected/last sync/ping), quick actions card (gold buttons), recent builds card with dynamic entries.

Dark theme: `#1a1a1a` background, `#c9a227` gold, `#2e2e2e` cards, `#f0f0f0` text.

### PLUG-01: Auth (`packages/studio-plugin/Auth.lua`)

- Browser-based OAuth: generates 32-char hex state token, builds auth URL with callback port 7842, logs URL to output (Studio cannot open URLs programmatically without a ScreenGui link button — documented limitation).
- Polls `localhost:7842/auth/poll?state=<token>` every 1.5s up to 120s via `RunService.Heartbeat`.
- `validateToken()` checks `GET /api/auth/validate` with bearer token.
- `plugin:SetSetting("rf_auth_token", token)` for cross-session persistence.

### PLUG-02: HTTP Polling Sync (`packages/studio-plugin/Sync.lua`)

- `RunService.Heartbeat`-based polling, not coroutines (Studio best practice).
- Default interval: 2s. Exponential backoff on failure: 2 → 4 → 8 → max 30s. Resets on success.
- Polls `GET /api/studio/sync?lastSync=<timestamp>`. Posts batched changes to `POST /api/studio/update`.
- Change queue: `Sync.queueChange(type, data)` accumulates changes locally, pushed on next tick.
- Auth headers on every request. `X-Plugin-Version: 1.0.0` for server-side tracking.
- `Sync.stop()` disconnects heartbeat safely for plugin unload.

### PLUG-03: Asset Injection (`packages/studio-plugin/AssetManager.lua`)

- `loadMarketplaceAsset(assetId, opts)` — `InsertService:LoadAsset()`, finds first Model/BasePart, sets CFrame if provided, tags with `rf_generated`, `rf_asset_id`, `rf_timestamp` attributes.
- `loadCustomModel(url, opts)` — `game:GetObjects(url)` for .rbxm files.
- `batchInsert(assetDefs)` — processes in groups of 5 with `task.wait(0.05)` between groups. Reports progress via callback.
- `insertFromChange(change)` — handles marketplace, custom model, and script insertion from sync changes.
- `removeAllGenerated()` / `getGeneratedInstances()` — utility for cleanup and inventory.

### PLUG-04: ChangeHistoryService (`packages/studio-plugin/History.lua`)

- `beginWaypoint(op)` → sets `RF_OpName_Begin` waypoint.
- `endWaypoint(op)` → sets `RF_OpName` waypoint (Studio undo shows "Undo: RF_GenerateTerrain").
- `wrap(op, fn)` — convenience wrapper for begin + fn + end.
- `History.Operations` — named constants for all 12 defined operations.
- `undoLast()` / `redoLast()` — wraps `ChangeHistoryService:Undo/Redo()` with pcall.
- `cleanup()` — closes any open waypoints on plugin unload.
- In-memory log of last 100 operations with timing.

### API Routes (`apps/api/src/routes/studio.ts`)

- `GET /api/studio/sync?lastSync=N` — reads `studio:changes:{userId}` list from Redis, filters to entries newer than lastSync, removes consumed entries, returns `SyncResponse` with `nextPollIn` hint (2s when changes exist, 5s when idle).
- `POST /api/studio/update` — validates up to 100 changes per batch, pushes to Redis list, caps at 500 entries, sets 1h TTL, updates session key.
- `GET /api/studio/status` — connected = last seen < 30s ago, returns queueDepth, lastSeenAgo, pluginVersion from header.
- `POST /api/studio/push-change` — internal route for web app → Studio push. Enqueues change directly.

All routes protected by `requireAuth` (Clerk JWT middleware from Phase 1).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing functionality] Added internal push-change endpoint**
- **Found during:** Task 3 (API routes)
- **Issue:** Plan specified only the poll + update direction. Without a server-side push mechanism, AI generations triggered from the web app cannot reach Studio.
- **Fix:** Added `POST /api/studio/push-change` internal route so generation routes can enqueue changes directly.
- **Files modified:** `apps/api/src/routes/studio.ts`
- **Commit:** b394307

**2. [Rule 2 - Missing functionality] Added Auth.validateToken() helper**
- **Found during:** Task 2 (Plugin)
- **Issue:** Plugin needs to validate persisted tokens on startup without doing a full OAuth flow.
- **Fix:** Added `Auth.validateToken(token)` that checks `GET /api/auth/validate`.
- **Files modified:** `packages/studio-plugin/Auth.lua`
- **Commit:** d18fcbb

**3. [Rule 2 - Missing functionality] Added city layout organic road type**
- **Found during:** Task 1 (city-architect MCP)
- **Issue:** The road generator only handled grid; organic layouts are common in Roblox town maps.
- **Fix:** Added `organic` style using golden-ratio-spaced roads in `generate_road_network`.
- **Files modified:** `packages/mcp/city-architect/src/index.ts`
- **Commit:** cc939f8

## Known Stubs

- `BUTTON_ICON = "rbxassetid://0"` in Plugin.lua — placeholder asset ID. Requires uploading the ForjeGames icon to Roblox and replacing with real ID.
- Studio OAuth browser opening: Plugin.lua logs the URL to output but cannot programmatically open a browser without a ScreenGui link button. Functional but requires developer to copy-paste URL.
- `Auth.openDashboard()` logs URL to output only — same limitation.

These stubs do not prevent the plugin from functioning; they are display/UX polish items.

## Self-Check: PASSED

Files created:
- packages/mcp/terrain-forge/src/index.ts — FOUND
- packages/mcp/city-architect/src/index.ts — FOUND
- packages/mcp/asset-alchemist/src/index.ts — FOUND
- packages/studio-plugin/Plugin.lua — FOUND
- packages/studio-plugin/Auth.lua — FOUND
- packages/studio-plugin/UI.lua — FOUND
- packages/studio-plugin/Sync.lua — FOUND
- packages/studio-plugin/AssetManager.lua — FOUND
- packages/studio-plugin/History.lua — FOUND
- apps/api/src/routes/studio.ts — FOUND

Commits:
- cc939f8 feat(05-mcp): add terrain-forge, city-architect, asset-alchemist MCP servers — FOUND
- d18fcbb feat(05-plug): add Roblox Studio plugin (PLUG-01 through PLUG-04) — FOUND
- b394307 feat(05-api): add studio sync API endpoints — FOUND
