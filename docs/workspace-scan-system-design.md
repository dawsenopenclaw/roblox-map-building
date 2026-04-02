# Workspace Scan System Design

## Architecture Overview

```
Studio Plugin                   ForjeGames Server              AI Chat
     |                               |                          |
     |-- scan_workspace cmd --------->|                          |
     |   (plugin polls /sync,        |                          |
     |    gets scan command)         |                          |
     |                               |                          |
     |-- POST /api/studio/update --->|                          |
     |   (snapshot JSON payload)     |-- store on session -->   |
     |                               |   session.worldSnapshot  |
     |                               |                          |
     |                               |<-- /api/ai/chat ---------|
     |                               |   (includes snapshot     |
     |                               |    in system prompt)     |
     |                               |                          |
     |<-- /sync (luau code) ---------|<-- AI response ---------|
     |   (code references exact      |   (code uses real        |
     |    positions from snapshot)   |    coordinates)          |
```

## 1. Plugin-Side Lua Scanning Code

### New command type: `scan_workspace`

When the plugin receives this command via `/api/studio/sync`, it runs the
scanner and POSTs the result back to `/api/studio/update` with
`event: "workspace_snapshot"`.

### Size Budget

Target: under 50KB JSON. Strategy:
- Round all numbers to 1 decimal
- Abbreviate keys (p=position, s=size, m=material, c=color)
- Skip UI objects, scripts, internal Roblox services
- Cap at 500 top-level objects (models count as 1)
- Terrain: sample grid, not full voxel data
- Truncate names to 40 chars

---

## 2. Files to Create/Modify

### Plugin (ForjeGames.lua)
- Add `scan_workspace` to `executeCommand()`
- Add `scanWorkspace()` function
- Add `sendSnapshot()` function

### Server
- `src/lib/studio-session.ts` -- add `worldSnapshot` field to StudioSession
- `src/app/api/studio/update/route.ts` -- handle `workspace_snapshot` event
- `src/app/api/ai/chat/route.ts` -- inject snapshot into system prompt
- New: `src/app/api/studio/scan/route.ts` -- trigger scan on demand

### Client
- `src/app/(app)/editor/hooks/useChat.ts` -- auto-trigger scan before first build
- `src/app/(app)/editor/hooks/useStudioConnection.ts` -- expose triggerScan()

---

## 3. Data Structures

### WorldSnapshot (what the plugin sends)

```typescript
interface WorldSnapshot {
  v: 1                          // schema version
  ts: number                    // Unix timestamp
  placeId: string

  // Workspace bounds
  bounds: {
    min: [number, number, number]  // [x, y, z]
    max: [number, number, number]
  }

  // Instance counts
  stats: {
    parts: number
    models: number
    meshes: number
    lights: number
    spawns: number
    scripts: number
    total: number
  }

  // Spawn locations
  spawns: Array<{
    n: string                    // name
    p: [number, number, number]  // position
  }>

  // Lighting
  lighting: {
    ambient: string              // hex color
    brightness: number
    time: number                 // ClockTime
    fog: string                  // hex color
    fogEnd: number
    tech: string                 // Technology (Future, ShadowMap, etc)
  }

  // Terrain summary (sampled grid)
  terrain: {
    bounds: {
      min: [number, number, number]
      max: [number, number, number]
    }
    waterY: number | null         // detected water level
    hasWater: boolean
    materials: string[]           // unique terrain materials found
  }

  // Objects (parts + models, max 500)
  objects: Array<{
    id: string                   // short unique id for reference
    n: string                    // name
    cls: string                  // ClassName (Part, Model, MeshPart, etc)
    p: [number, number, number]  // position (center)
    s: [number, number, number]  // size (bounding box)
    m?: string                   // material (parts only)
    c?: string                   // color hex (parts only)
    a?: boolean                  // anchored
    t?: boolean                  // transparent (>0.5)
    ch?: Array<{                 // children summary (models only)
      n: string
      cls: string
      p: [number, number, number]
    }>
    path: string                 // full instance path e.g. "Workspace.CityBlock.Building1"
  }>

  // Camera position at scan time
  camera?: {
    p: [number, number, number]  // position
    l: [number, number, number]  // lookVector
  }
}
```

---

## 4. Lua Scanner Code

```lua
-- Workspace Scanner for ForjeGames Plugin
-- Generates a compact JSON snapshot of the game world

local HttpService = game:GetService("HttpService")
local Lighting = game:GetService("Lighting")
local Terrain = workspace.Terrain

local MAX_OBJECTS = 500
local MAX_NAME_LEN = 40
local MAX_CHILDREN = 20

-- Round to 1 decimal place
local function r(n)
    return math.floor(n * 10 + 0.5) / 10
end

-- Color3 to hex string
local function colorHex(c)
    return string.format("#%02X%02X%02X",
        math.floor(c.R * 255 + 0.5),
        math.floor(c.G * 255 + 0.5),
        math.floor(c.B * 255 + 0.5))
end

-- Truncate name
local function truncName(s)
    if #s > MAX_NAME_LEN then
        return string.sub(s, 1, MAX_NAME_LEN)
    end
    return s
end

-- Get full path relative to workspace
local function getPath(inst)
    local parts = {}
    local current = inst
    while current and current ~= game do
        table.insert(parts, 1, current.Name)
        current = current.Parent
    end
    return table.concat(parts, ".")
end

-- Check if an instance is a 3D object we care about
local function is3D(inst)
    return inst:IsA("BasePart") or inst:IsA("Model")
end

-- Skip these classes
local SKIP_CLASSES = {
    Script = true, LocalScript = true, ModuleScript = true,
    ScreenGui = true, BillboardGui = true, SurfaceGui = true,
    Camera = true, Folder = true, Configuration = true,
    BindableEvent = true, BindableFunction = true,
    RemoteEvent = true, RemoteFunction = true,
    UIListLayout = true, UIGridLayout = true, UIPadding = true,
    UICorner = true, UIStroke = true, UIScale = true,
    Humanoid = true, HumanoidRootPart = true,
    Animator = true, Animation = true, AnimationController = true,
    Sound = true, SoundGroup = true,
    ParticleEmitter = true, Beam = true, Trail = true,
    Weld = true, WeldConstraint = true, Motor6D = true,
    Attachment = true, AlignPosition = true, AlignOrientation = true,
}

-- Get bounding box for a model
local function getModelBounds(model)
    if model:IsA("Model") and model.PrimaryPart then
        local cf, size = model:GetBoundingBox()
        return cf.Position, size
    elseif model:IsA("Model") then
        -- Try GetBoundingBox without PrimaryPart
        local ok, cf, size = pcall(function()
            return model:GetBoundingBox()
        end)
        if ok and cf then
            return cf.Position, size
        end
    end
    return nil, nil
end

local function scanWorkspace()
    local snapshot = {
        v = 1,
        ts = os.time(),
        placeId = tostring(game.PlaceId),
        bounds = { min = {0, 0, 0}, max = {0, 0, 0} },
        stats = { parts = 0, models = 0, meshes = 0, lights = 0, spawns = 0, scripts = 0, total = 0 },
        spawns = {},
        lighting = {},
        terrain = { bounds = { min = {0,0,0}, max = {0,0,0} }, waterY = nil, hasWater = false, materials = {} },
        objects = {},
    }

    -- ======== LIGHTING ========
    local lighting = Lighting
    snapshot.lighting = {
        ambient = colorHex(lighting.Ambient),
        brightness = r(lighting.Brightness),
        time = r(lighting.ClockTime),
        fog = colorHex(lighting.FogColor),
        fogEnd = r(lighting.FogEnd),
        tech = tostring(lighting.Technology),
    }

    -- ======== TERRAIN ========
    pcall(function()
        local region = Terrain:GetTerrainRegionClampedY()
        if region then
            local size = region.Size
            snapshot.terrain.bounds = {
                min = {r(-size.X/2), r(0), r(-size.Z/2)},
                max = {r(size.X/2), r(size.Y), r(size.Z/2)},
            }
        end
    end)

    -- Check for water by sampling terrain at Y=0
    pcall(function()
        local region = Region3.new(
            Vector3.new(-512, -20, -512),
            Vector3.new(512, 20, 512)
        )
        region = region:ExpandToGrid(4)
        local mats, occs = Terrain:ReadVoxels(region, 4)
        local matSet = {}
        for x = 1, #mats do
            for y = 1, #mats[x] do
                for z = 1, #mats[x][y] do
                    local mat = mats[x][y][z]
                    if mat ~= Enum.Material.Air then
                        matSet[mat.Name] = true
                        if mat == Enum.Material.Water then
                            snapshot.terrain.hasWater = true
                            snapshot.terrain.waterY = r((y - 1) * 4 - 20)
                        end
                    end
                end
            end
        end
        local matList = {}
        for name in pairs(matSet) do
            table.insert(matList, name)
        end
        snapshot.terrain.materials = matList
    end)

    -- ======== SPAWNS ========
    for _, desc in ipairs(workspace:GetDescendants()) do
        if desc:IsA("SpawnLocation") then
            local pos = desc.Position
            table.insert(snapshot.spawns, {
                n = truncName(desc.Name),
                p = {r(pos.X), r(pos.Y), r(pos.Z)},
            })
            snapshot.stats.spawns = snapshot.stats.spawns + 1
        end
    end

    -- ======== COUNT ALL INSTANCES ========
    local allDesc = workspace:GetDescendants()
    snapshot.stats.total = #allDesc
    for _, desc in ipairs(allDesc) do
        if desc:IsA("BasePart") then
            snapshot.stats.parts = snapshot.stats.parts + 1
            if desc:IsA("MeshPart") then
                snapshot.stats.meshes = snapshot.stats.meshes + 1
            end
        elseif desc:IsA("Model") then
            snapshot.stats.models = snapshot.stats.models + 1
        elseif desc:IsA("Light") then
            snapshot.stats.lights = snapshot.stats.lights + 1
        elseif desc:IsA("BaseScript") then
            snapshot.stats.scripts = snapshot.stats.scripts + 1
        end
    end

    -- ======== OBJECTS (top-level workspace children, max 500) ========
    local minX, minY, minZ = math.huge, math.huge, math.huge
    local maxX, maxY, maxZ = -math.huge, -math.huge, -math.huge
    local objCount = 0
    local idCounter = 0

    local function nextId()
        idCounter = idCounter + 1
        return "o" .. idCounter
    end

    local function addObject(inst)
        if objCount >= MAX_OBJECTS then return end
        if SKIP_CLASSES[inst.ClassName] then return end

        if inst:IsA("BasePart") then
            local pos = inst.Position
            local size = inst.Size

            -- Update bounds
            minX = math.min(minX, pos.X - size.X/2)
            minY = math.min(minY, pos.Y - size.Y/2)
            minZ = math.min(minZ, pos.Z - size.Z/2)
            maxX = math.max(maxX, pos.X + size.X/2)
            maxY = math.max(maxY, pos.Y + size.Y/2)
            maxZ = math.max(maxZ, pos.Z + size.Z/2)

            local obj = {
                id = nextId(),
                n = truncName(inst.Name),
                cls = inst.ClassName,
                p = {r(pos.X), r(pos.Y), r(pos.Z)},
                s = {r(size.X), r(size.Y), r(size.Z)},
                m = inst.Material.Name,
                c = colorHex(inst.Color),
                a = inst.Anchored or nil,
                path = getPath(inst),
            }
            if inst.Transparency > 0.5 then
                obj.t = true
            end

            table.insert(snapshot.objects, obj)
            objCount = objCount + 1

        elseif inst:IsA("Model") then
            local pos, size = getModelBounds(inst)
            if pos and size then
                -- Update bounds
                minX = math.min(minX, pos.X - size.X/2)
                minY = math.min(minY, pos.Y - size.Y/2)
                minZ = math.min(minZ, pos.Z - size.Z/2)
                maxX = math.max(maxX, pos.X + size.X/2)
                maxY = math.max(maxY, pos.Y + size.Y/2)
                maxZ = math.max(maxZ, pos.Z + size.Z/2)

                local obj = {
                    id = nextId(),
                    n = truncName(inst.Name),
                    cls = "Model",
                    p = {r(pos.X), r(pos.Y), r(pos.Z)},
                    s = {r(size.X), r(size.Y), r(size.Z)},
                    path = getPath(inst),
                }

                -- Add child summary (top-level children only, max 20)
                local children = {}
                local childCount = 0
                for _, child in ipairs(inst:GetChildren()) do
                    if childCount >= MAX_CHILDREN then break end
                    if child:IsA("BasePart") then
                        local cp = child.Position
                        table.insert(children, {
                            n = truncName(child.Name),
                            cls = child.ClassName,
                            p = {r(cp.X), r(cp.Y), r(cp.Z)},
                        })
                        childCount = childCount + 1
                    elseif child:IsA("Model") then
                        local cp, cs = getModelBounds(child)
                        if cp then
                            table.insert(children, {
                                n = truncName(child.Name),
                                cls = "Model",
                                p = {r(cp.X), r(cp.Y), r(cp.Z)},
                            })
                            childCount = childCount + 1
                        end
                    end
                end
                if #children > 0 then
                    obj.ch = children
                end

                table.insert(snapshot.objects, obj)
                objCount = objCount + 1
            else
                -- Model without bounding box — scan children individually
                for _, child in ipairs(inst:GetChildren()) do
                    addObject(child)
                end
            end
        end
    end

    -- Scan direct children of workspace (top-level)
    for _, child in ipairs(workspace:GetChildren()) do
        if child ~= Terrain and child.ClassName ~= "Camera" then
            addObject(child)
        end
    end

    -- Finalize bounds
    if minX ~= math.huge then
        snapshot.bounds = {
            min = {r(minX), r(minY), r(minZ)},
            max = {r(maxX), r(maxY), r(maxZ)},
        }
    end

    -- Camera
    pcall(function()
        local cam = workspace.CurrentCamera
        if cam then
            local cp = cam.CFrame.Position
            local lv = cam.CFrame.LookVector
            snapshot.camera = {
                p = {r(cp.X), r(cp.Y), r(cp.Z)},
                l = {r(lv.X), r(lv.Y), r(lv.Z)},
            }
        end
    end)

    return snapshot
end
```

---

## 5. Plugin Integration (executeCommand addition)

Add this case to `executeCommand()` in ForjeGames.lua:

```lua
elseif cmdType == "scan_workspace" then
    task.spawn(function()
        local ok, snapshot = pcall(scanWorkspace)
        if not ok then
            reportResult(cmdId, cmdType, false, tostring(snapshot))
            return
        end

        local jsonStr = HttpService:JSONEncode(snapshot)

        -- Check size — if over 48KB, trim objects
        if #jsonStr > 49152 then
            -- Remove children summaries first
            for _, obj in ipairs(snapshot.objects) do
                obj.ch = nil
            end
            jsonStr = HttpService:JSONEncode(snapshot)
        end

        -- If still too big, trim object count
        if #jsonStr > 49152 then
            local trimmed = {}
            for i = 1, math.min(#snapshot.objects, 200) do
                trimmed[i] = snapshot.objects[i]
            end
            snapshot.objects = trimmed
            jsonStr = HttpService:JSONEncode(snapshot)
        end

        -- Send snapshot to server
        local sendOk, _ = jsonRequest("POST", "/api/studio/update", {
            sessionId    = sessionId,
            sessionToken = authToken,
            placeId      = placeId,
            placeName    = placeName,
            event        = "workspace_snapshot",
            changes      = {{ type = "workspace_snapshot", data = snapshot }},
        })

        if sendOk then
            reportResult(cmdId, cmdType, true, nil)
        else
            reportResult(cmdId, cmdType, false, "failed to send snapshot")
        end
    end)
```

---

## 6. Example JSON Output

A small game with a few buildings would produce:

```json
{
  "v": 1,
  "ts": 1743523200,
  "placeId": "123456789",
  "bounds": {
    "min": [-120.5, -2.0, -80.3],
    "max": [150.0, 65.0, 200.0]
  },
  "stats": {
    "parts": 847,
    "models": 23,
    "meshes": 12,
    "lights": 45,
    "spawns": 2,
    "scripts": 8,
    "total": 1423
  },
  "spawns": [
    { "n": "SpawnLocation", "p": [0.0, 1.0, 0.0] },
    { "n": "SpawnLocation2", "p": [50.0, 1.0, 20.0] }
  ],
  "lighting": {
    "ambient": "#4B5563",
    "brightness": 2.0,
    "time": 14.5,
    "fog": "#C8D0D8",
    "fogEnd": 1000.0,
    "tech": "Future"
  },
  "terrain": {
    "bounds": { "min": [-512.0, 0.0, -512.0], "max": [512.0, 64.0, 512.0] },
    "waterY": 0.0,
    "hasWater": true,
    "materials": ["Grass", "Water", "Sand", "Rock"]
  },
  "objects": [
    {
      "id": "o1",
      "n": "Baseplate",
      "cls": "Part",
      "p": [0.0, -10.0, 0.0],
      "s": [512.0, 20.0, 512.0],
      "m": "Grass",
      "c": "#4A7A3D",
      "a": true,
      "path": "Workspace.Baseplate"
    },
    {
      "id": "o2",
      "n": "TownHall",
      "cls": "Model",
      "p": [30.0, 15.0, -20.0],
      "s": [40.0, 30.0, 35.0],
      "path": "Workspace.TownHall",
      "ch": [
        { "n": "Floor1", "cls": "Part", "p": [30.0, 5.0, -20.0] },
        { "n": "Floor2", "cls": "Part", "p": [30.0, 17.0, -20.0] },
        { "n": "Roof", "cls": "WedgePart", "p": [30.0, 28.0, -20.0] }
      ]
    },
    {
      "id": "o3",
      "n": "StreetLamp",
      "cls": "Model",
      "p": [10.0, 7.0, 5.0],
      "s": [2.0, 14.0, 2.0],
      "path": "Workspace.StreetLamp"
    }
  ],
  "camera": {
    "p": [80.0, 40.0, 60.0],
    "l": [-0.5, -0.3, -0.8]
  }
}
```

---

## 7. AI System Prompt Integration

When a world snapshot is available, inject it into the system prompt for the
`/api/ai/chat` endpoint. The snapshot gets compressed into a spatial context
block.

### Prompt Injection Format

```
=== WORLD CONTEXT (live from Roblox Studio) ===

World bounds: (-120.5, -2.0, -80.3) to (150.0, 65.0, 200.0)
Total parts: 847 | Models: 23 | Lights: 45

Spawn points:
  - SpawnLocation at (0, 1, 0)
  - SpawnLocation2 at (50, 1, 20)

Lighting: Future rendering, brightness 2.0, time 14:30, fog ends at 1000

Terrain: has water at Y=0, materials: Grass, Water, Sand, Rock

Existing objects (by area):
  [GROUND] Baseplate (512x20x512) at center, Grass material
  [BUILDING] TownHall (40x30x35) at (30, 15, -20) — 3 floors + roof
  [PROP] StreetLamp (2x14x2) at (10, 7, 5)

=== PLACEMENT RULES ===
When placing new objects relative to existing ones:
1. ALWAYS check the existing objects list above before choosing coordinates
2. Place buildings ADJACENT to existing ones (use their position + size/2 + gap)
3. Place NPCs/characters at ground level (find the Y of nearby ground parts)
4. Place interior items INSIDE existing buildings (within their bounding box)
5. Place lights at appropriate heights (street level: Y=7-10, room ceiling: parent Y + 10-12)
6. Roads connect between existing structures — use their X/Z coordinates
7. Leave 4-8 stud gaps between buildings for walkways
8. Never overlap with existing objects — check bounding boxes

Scale reference (studs):
  - Character height: 5.5 (R15)
  - Door: 4 wide x 7 tall
  - Room height: 12
  - Road width: 24 (4 lanes)
  - Sidewalk: 6
  - Street lamp spacing: 24

To reference existing objects in code: workspace:FindFirstChild("NAME", true)
```

### How the AI Should Use This

The system prompt transforms the AI from blind code generation to spatially-aware placement:

**Before (blind):**
```
User: "Add a shop next to the town hall"
AI: local shop = Instance.new("Part")
    shop.Position = Vector3.new(0, 10, 0)  -- RANDOM GUESS
```

**After (with snapshot):**
```
User: "Add a shop next to the town hall"
AI: -- TownHall is at (30, 15, -20) with size (40, 30, 35)
    -- Place shop to the right: X = 30 + 40/2 + 20/2 + 4 = 54
    local shop = Instance.new("Part")
    shop.Position = Vector3.new(54, 10, -20)  -- CALCULATED from real data
```

---

## 8. API Endpoint Design

### POST /api/studio/scan (new endpoint)

Triggers a workspace scan by queuing a `scan_workspace` command.

**Request:**
```json
{
  "sessionId": "abc123"
}
```

**Response:**
```json
{
  "ok": true,
  "commandId": "cmd_xyz",
  "message": "Scan command queued. Snapshot will arrive in 1-3 seconds."
}
```

### GET /api/studio/snapshot?sessionId=abc123 (new endpoint)

Returns the most recent world snapshot for a session.

**Response:**
```json
{
  "ok": true,
  "snapshot": { /* WorldSnapshot */ },
  "age": 15000,
  "stale": false
}
```

- `age`: milliseconds since snapshot was captured
- `stale`: true if snapshot is older than 60 seconds

### POST /api/studio/update (modified)

Now handles `event: "workspace_snapshot"`:

```typescript
// In the update handler:
if (body.event === 'workspace_snapshot' && body.changes?.[0]?.data) {
  session.worldSnapshot = body.changes[0].data
  session.snapshotAt = Date.now()
}
```

---

## 9. Data Flow: Auto-Scan Before AI Chat

The ideal UX: user sends a build message, the system automatically scans
first if the snapshot is stale (>30s old or missing).

```
User types: "Add a fountain in front of the town hall"
     |
     v
useChat hook checks: is snapshot fresh? (<30s old)
     |
     NO --> trigger scan via POST /api/studio/scan
     |      wait up to 3 seconds for snapshot to arrive
     |      (poll GET /api/studio/snapshot every 500ms)
     |
     v
POST /api/ai/chat with { message, snapshot }
     |
     v
AI generates code using real coordinates from snapshot
     |
     v
POST /api/studio/execute with { code }
     |
     v
Plugin executes code, fountain appears next to town hall
```

---

## 10. Session Store Changes

Add to `StudioSession` interface:

```typescript
interface StudioSession {
  // ... existing fields ...

  /** Latest workspace scan data */
  worldSnapshot: WorldSnapshot | null
  /** Unix ms when snapshot was captured */
  snapshotAt: number
}
```

The snapshot is stored in memory only (like screenshots) -- too large for Redis.
The Redis serializer already strips `latestScreenshot`; add `worldSnapshot` to
the same exclusion list.

---

## 11. Edge Cases

1. **Empty workspace** -- Scanner returns stats.total=0, objects=[]. AI should
   offer to create a starter environment.

2. **Huge workspace (>10K parts)** -- Scanner caps at 500 objects. Priority:
   Models first, then top-level parts, sorted by size (largest first).

3. **Snapshot too large** -- Progressive trimming: remove children summaries,
   then reduce object count to 200.

4. **Stale snapshot** -- If snapshot is >60s old, auto-scan before build.
   If scan fails after 3s timeout, use stale data with a warning.

5. **No Studio connection** -- AI works without snapshot (current behavior).
   Message: "Connect Studio for smarter placement."

6. **Terrain-only map** -- Scanner detects terrain bounds and materials even
   with no parts. AI knows ground level from terrain data.

7. **Streaming Enabled** -- Parts may not exist on server. Scanner runs in
   Studio (plugin context) so it sees everything loaded in the editor viewport.

8. **Model without PrimaryPart** -- `GetBoundingBox()` still works in Studio
   for models without a PrimaryPart. Wrapped in pcall for safety.

9. **Concurrent scans** -- Only one scan at a time per session. If a scan is
   already in progress, skip the new request.

10. **Plugin version mismatch** -- Old plugins that don't understand
    `scan_workspace` will report "unknown command". Server should handle
    gracefully and not block chat.

---

## 12. Implementation Order

1. **Lua scanner function** -- standalone, testable in Studio command bar
2. **Plugin executeCommand addition** -- wire scanner to command dispatch
3. **StudioSession.worldSnapshot** -- add field, exclude from Redis
4. **POST /api/studio/update** -- handle workspace_snapshot event
5. **GET /api/studio/snapshot** -- new endpoint
6. **POST /api/studio/scan** -- new endpoint to trigger scan
7. **AI system prompt injection** -- modify /api/ai/chat
8. **useChat auto-scan** -- trigger scan before build if stale
9. **UI indicator** -- show "World scanned" badge in editor
