# Studio Building Architecture

> **Core mission**: Studio building is the heart of ForjeGames. It MUST work for every user, regardless of whether they have the plugin installed, whether they can install the plugin, or what edition of the plugin they have. This document describes exactly how that works.

---

## 1. How it works (the happy path)

ForjeGames uses a **one-way cloud relay with plugin-side polling**. There is no persistent socket connection between our servers and Roblox Studio — the plugin polls.

```
┌──────────┐   AI output   ┌─────────────┐   queueCommand   ┌──────────┐
│   User   │ ─────────────▶│  Next.js    │ ────────────────▶│  Redis   │
│  (web)   │               │  /api/ai/*  │                  │  queue   │
└──────────┘               └─────────────┘                  └──────────┘
                                                                   ▲
                                                                   │ drainCommands
                                                                   │ (poll ~1–2 s)
                                                                   │
                                                            ┌──────┴──────┐
                                                            │  Studio     │
                                                            │  Plugin     │
                                                            │  Sync.lua   │
                                                            └─────────────┘
```

### End-to-end flow

1. **User prompt → AI**
   `ChatPanel` calls `useChat.sendMessage` → `POST /api/ai/chat` (or streams via the editor WebSocket).
2. **AI generates Luau**
   The server extracts `luauCode` from the AI response and — when the user has a live Studio session — auto-queues the build via `queueCommand(sessionId, { type: 'execute_luau', data: { code, prompt } })`.
3. **Queue → Redis**
   `queueCommand` (`src/lib/studio-session.ts`) writes the command to the session's in-memory ring buffer, mirrored to Redis so any Next.js lambda can drain it.
4. **Plugin poll → drain**
   The plugin's `Sync.lua` loop (`packages/studio-plugin/Sync.lua`) hits `GET /api/studio/sync?sessionId=&token=&lastSync=` every 1–2 seconds. `drainCommands` returns everything newer than `lastSync`.
5. **Plugin executes via structured commands**
   `applyChanges` dispatches each change type:
   - `execute_luau` → regex-parses `Instance.new(...)` patterns into a local structured-commands array, then calls `executeStructuredCommands`.
   - `structured_commands` → already typed, runs directly.
   - `insert_asset`, `set_property`, `delete_instance`, etc. → typed handlers that touch the Roblox API.
6. **Result → server**
   Plugin pushes status via `POST /api/studio/update` / `/api/studio/connect`. Errors surface via `/api/studio/status` which `useChat` polls for the auto-retry loop.
7. **Web UI updates**
   `useStudioSSE` streams activity/screenshots back to the web via `/api/studio/stream` (SSE).

**Observed average latency**: 1–2 seconds from "AI finishes generating" to "parts appear in Studio". This is dominated by the plugin poll interval.

### Key files

| Concern              | Path                                                          |
| -------------------- | ------------------------------------------------------------- |
| Plugin sync loop     | `packages/studio-plugin/Sync.lua`                             |
| Poll endpoint        | `src/app/api/studio/sync/route.ts`                            |
| Queue endpoint       | `src/app/api/studio/execute/route.ts`                         |
| Session/Redis layer  | `src/lib/studio-session.ts`                                   |
| Command translator   | `src/lib/ai/structured-commands.ts`                           |
| Web chat hook        | `src/app/(app)/editor/hooks/useChat.ts`                       |
| Studio connection UI | `src/app/(app)/editor/hooks/useStudioConnection.ts`           |
| Manual fallback UI   | `src/components/editor/ManualBuildPanel.tsx`                  |
| .rbxmx export        | `src/app/api/studio/export-rbxm/route.ts`                     |

---

## 2. Why polling, not a direct connection

**Roblox Studio plugins cannot accept inbound HTTP connections.** There is no API to open a listening socket, no way to receive an HTTP request, no WebSocket-server primitive. The `HttpService` can only *initiate* requests.

Consequently any "Studio controller" design that binds a local HTTP server and expects Studio to dial it is **architecturally impossible**. The only workable transport is:

- Plugin → our cloud (outbound HTTP, polling)
- Our cloud → plugin (via the plugin's next poll)

That is what `Sync.lua` and `/api/studio/sync` implement. The trade-off is latency (1–2 s) in exchange for a design that actually works inside Roblox's sandbox.

Any MCP server that claims to control Studio **must** use the same cloud relay. `packages/mcp/studio-bridge/` and `packages/mcp/studio-controller/` both now do so — they POST commands to `/api/studio/execute` and (for round-trip reads) poll `/api/studio/bridge-result?requestId=…`.

> **Known gap**: `/api/studio/bridge-result` is not yet implemented in `src/app/api/studio/`. Fire-and-forget MCP commands (`set_property`, `create_instance`, `start_playtest`, …) work because they only queue. MCP tools that need a round-trip result (`read_hierarchy`, `get_scripts`, `capture_screenshot`, `get_output_log`) will time out until the bridge-result route lands. This does **not** affect the web build path — `useChat` uses a different observability channel (`/api/studio/status` + SSE).

---

## 3. Two execution modes in the plugin

The plugin ships in two editions and the execution mode is gated by a plugin setting:

### a) Direct-download plugin ("developer mode")

- Downloaded from `/api/studio/plugin` or the dev side-load path
- `ForjeGames_AllowLoadstring` setting can be enabled
- When enabled, complex Luau containing loops/functions/closures falls through to `loadstring(code)()` so any AI-generated script runs as-is
- Not Creator Store compliant — Roblox forbids published plugins from running arbitrary user code via `loadstring`

### b) Creator Store plugin (the one end-users install)

- `ForjeGames_AllowLoadstring` is **off** and not exposed in the UI
- Only structured commands execute: `create_part`, `create_model`, `create_folder`, `create_instance`, `create_script`, `set_property`, `delete_*`, `move_*`, `clone_*`, `insert_asset`
- `execute_script` is disabled (same policy surface as `loadstring`)
- AI-generated Luau is translated to structured commands on the web side (`luauToStructuredCommands` in `src/lib/ai/structured-commands.ts`), or locally by the plugin's best-effort regex parser
- This is what Roblox will approve for the Creator Store

Both editions share the same `Sync.lua` polling loop. The difference is only which commands the executor accepts.

---

## 4. Three user paths (the safety net)

Studio building MUST work for every user. We support three paths, tried in this order:

### Path A — Plugin connected (real-time)

- The user has the plugin installed and has connected it via the 6-digit code flow
- `studio.isConnected === true` in `useStudioConnection`
- Builds flow through the cloud relay, appear in Studio within 1–2 s
- The TopBar shows a green pill: `[● place-name | 42 ms]`

### Path B — Plugin not installed (manual copy/paste)

- `studio.isConnected === false`
- The TopBar shows a yellow pill: `[● No Studio — manual mode]`
- Every AI build response renders `ManualBuildPanel` inline in the chat feed:
  - Syntax-highlighted Luau code block
  - "Copy code" button
  - Step-by-step "1. Copy  2. Open Studio  3. Open Command Bar (View → Command Bar)  4. Paste and run"
  - "Install plugin →" link-out for users who want to upgrade to Path A
- Users can send builds immediately without ever touching the plugin

### Path C — .rbxmx download (drag-and-drop)

- Also rendered by `ManualBuildPanel`
- "Download .rbxmx" button calls `POST /api/studio/export-rbxm { luauCode | commands }`
- The server translates to structured commands (if given raw Luau) and serializes them as a Roblox XML model file
- Users drag the file into the Studio viewport → everything appears as a grouped model
- Only creation commands (parts, models, folders, scripts) serialize; runtime-only commands (`insert_asset`, `execute_script`, `set_property` on non-existent targets) are skipped

---

## 5. What the plugin CAN do (Roblox APIs that work)

Through the structured-command executor in `Sync.lua`:

- **Create instances** — `Part`, `Model`, `Folder`, `Script`, `LocalScript`, `ModuleScript`, and any other `Instance.new(className)`
- **Set properties** — Anchored, CanCollide, Transparency, Reflectance, Material, BrickColor, Color, Size, CFrame, Position, Name, Parent, Value, Text, and any primitive or typed property via `parseStructuredValue`
- **Typed values** — `Vector3`, `CFrame`, `Color3`, `BrickColor`, `UDim2`, `Enum`
- **Insert marketplace assets** — via `InsertService:LoadAsset(robloxAssetId)` behind the `insert_asset` command (subject to Roblox's asset gating rules)
- **Read scene state** — `getInstance`, `getProperties`, `get_hierarchy`, `get_selection` (used by the MCP bridge tools)
- **Delete / clone / move instances**
- **Write scripts** — create a `Script`/`LocalScript`/`ModuleScript` and assign `.Source`
- **Push screenshots** — `pushScreenshot` captures the viewport and POSTs to `/api/studio/screenshot`
- **Push camera state** — every heartbeat includes the current camera CFrame so the AI has 3D context

---

## 6. What the plugin CANNOT do (Roblox API limitations)

These are hard limits imposed by Roblox, not us. Each is called out so users never see silent failure.

| Capability                        | Why it can't work                                                                                                              | Fallback                                                                                       |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| Programmatically start a playtest | There is no public API to invoke `RunService:Run()` from a plugin. Play/Stop are reserved for user clicks on the Studio chrome | We show a toast: **"Click Play in Studio to test your build"**                                 |
| Capture the viewport as an image  | `UserInputService:GetScreenshot()` exists only at runtime, and plugin code has no equivalent at edit time                      | The plugin can capture the character's view during a playtest only; otherwise no screenshot    |
| Simulate keyboard / mouse input   | `VirtualInputManager` is a runtime-only service — it does nothing at edit time and only fires within an active playtest        | Input simulation is available inside a running playtest; edit-time input is explicitly blocked |
| Read Output logs historically     | `LogService:GetLogHistory()` works, but only for this Studio session — logs from a previous session or from a crashed plugin are unreachable | We cache recent logs in Redis via `/api/studio/metrics`                                        |
| Read a place's source control state | Studio plugins have no knowledge of Team Create / version-control history                                                     | We maintain our own checkpoint system in `src/lib/checkpoints.ts`                              |

When any of these "impossible" features is requested by the AI, the tool definition returns a clear **"user action required"** message instead of pretending it worked.

---

## 7. Architectural decisions worth remembering

- **Never delete the polling path.** Any "we should just use WebSockets" proposal has to explain how Roblox Studio accepts an inbound WebSocket. It doesn't. The polling design is the only one that works.
- **Never trust the plugin with `loadstring` by default.** The Creator Store edition must ship with `ForjeGames_AllowLoadstring = false` and the setting hidden. Structured commands are the canonical path.
- **Never make Studio a hard requirement.** The `ManualBuildPanel` + `/api/studio/export-rbxm` safety net exists because a significant fraction of users will reach ForjeGames before they install the plugin. Those users must still be able to build.
- **Never silently route commands to the wrong session.** `/api/studio/execute` requires a signed JWT whose `sid` matches the target session. The old "most-recently-active live session" fallback was removed because it was a cross-user exploit.
- **Never block the chat on the Studio round-trip.** The chat UI renders the AI response as soon as it arrives. Plugin execution happens in parallel. Errors from Studio surface via the auto-retry loop in `useChat`.

---

## 8. MCP integration status

| MCP Server                                | Uses cloud relay? | Notes                                                                                                                       |
| ----------------------------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `packages/mcp/studio-bridge`              | Yes               | POSTs to `/api/studio/execute`, polls `/api/studio/bridge-result` for round-trip results                                    |
| `packages/mcp/studio-controller`          | Yes               | Identical transport to `studio-bridge`. The earlier "localhost HTTP listener" design was abandoned (architecturally broken) |
| `packages/mcp/asset-alchemist`            | No                | Generates assets via fal.ai, no Studio interaction                                                                          |
| `packages/mcp/city-architect`             | No                | City-scale blueprints; no Studio interaction                                                                                |
| `packages/mcp/terrain-forge`              | No                | Terrain generation; no Studio interaction                                                                                   |

Both Studio-facing MCPs are functionally equivalent from the plugin's perspective — the plugin doesn't know or care which server queued a command. They just appear as items in the same Redis queue.
