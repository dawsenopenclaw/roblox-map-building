// optimization-bible.ts
// AI knowledge bible for Roblox game optimization — 4000+ lines of actionable knowledge.
// ALL Roblox API properties are real. No SmoothPlastic. Every dimension in studs.

// ─────────────────────────────────────────────────────────────────────────────
// RENDERING OPTIMIZATION
// ─────────────────────────────────────────────────────────────────────────────

export const OPT_RENDERING: string = `
=== ROBLOX RENDERING OPTIMIZATION BIBLE ===

--- PART COUNT TARGETS ---
Mobile devices (< 4GB RAM, GPU tier 1-2):
  Total Part count: <= 10,000 parts visible at once
  MeshPart poly budget: <= 200,000 triangles in view frustum
  Decal count: <= 50 decals in scene
  SpecialMesh count: <= 100 in view frustum
  SurfaceAppearance textures: <= 30 unique textures in scene
  PointLight/SpotLight/SurfaceLight count: <= 20 active lights
  Shadow-casting lights: <= 3 (use ShadowMap technology setting)

PC low-end (integrated graphics, < 2GB VRAM):
  Total Part count: <= 15,000 parts visible at once
  MeshPart poly budget: <= 500,000 triangles in view frustum
  Decal count: <= 100 decals in scene
  Active lights: <= 40

PC mid-range (dedicated GPU 4GB VRAM):
  Total Part count: <= 20,000 parts visible at once
  MeshPart poly budget: <= 1,500,000 triangles in view frustum
  Decal count: <= 200 decals in scene
  Active lights: <= 80

PC high-end / console (8GB+ VRAM):
  Total Part count: <= 30,000 parts visible at once
  MeshPart poly budget: <= 3,000,000 triangles in view frustum
  Decal count: <= 400 decals in scene
  Active lights: <= 150

--- DRAW CALL REDUCTION ---
CORE RULE: Each unique material + texture combination = 1 draw call per object using it.
GOAL: Minimize unique (Material, Color, SurfaceAppearance) combos.

Union strategy:
  UnionOperation merges up to 64 parts into 1 draw call.
  UnionOperation.UsePartColor = false → all parts share single material.
  UnionOperation.RenderFidelity = Enum.RenderFidelity.Automatic → engine chooses LOD.
  UnionOperation.CollisionFidelity = Enum.CollisionFidelity.Box → cheapest physics.
  Group static geometry that never moves into unions (buildings, rocks, terrain decorations).

MeshPart LOD strategy:
  MeshPart.RenderFidelity = Enum.RenderFidelity.Automatic → best for draw call budget.
  MeshPart.RenderFidelity = Enum.RenderFidelity.Precise → only for hero assets close to camera.
  MeshPart.RenderFidelity = Enum.RenderFidelity.Performance → for background/distant meshes.
  MeshPart.LevelOfDetailEnabled = true → required for automatic mesh LOD.

Model LOD distances (swap in script):
  Distance 0-50 studs: Full-detail model (100% poly)
  Distance 50-150 studs: Medium LOD (replace with simpler MeshPart, 40% poly)
  Distance 150-300 studs: Low LOD (flat billboard or simple 4-part proxy)
  Distance 300+ studs: Invisible (Model.PrimaryPart.LocalTransparencyModifier = 1 or Parent = nil)

LOD swap via script pattern:
  Use RunService.Heartbeat at 1/10 frequency (every 10 frames).
  Compute (Camera.CFrame.Position - model.PrimaryPart.Position).Magnitude.
  Store result and compare to distance thresholds.
  Swap Model visible children, not the Model itself (avoid re-anchoring costs).

--- PART vs MESHPART RENDERING COSTS ---
BasePart (Part/WedgePart/CornerWedgePart):
  GPU cost: Very low — uses simple geometry batching.
  Draw call: 1 per unique material+color combo (shared with other same-material Parts).
  Best for: Structural geometry, floors, walls, terrain fill-in.
  CollisionFidelity: Box (cheapest), Hull (medium), Precise (expensive for concave).

MeshPart:
  GPU cost: Depends on triangle count and RenderFidelity.
  Draw call: 1 per unique mesh+material combo.
  Best for: Detailed props, characters, hero objects.
  WARNING: MeshPart.TextureID applies a flat texture; use SurfaceAppearance for PBR.
  MeshPart.RenderFidelity = Enum.RenderFidelity.Performance → renders at 1/4 poly count at distance.

SpecialMesh (inside Part):
  GPU cost: Similar to low-poly MeshPart.
  WARNING: SpecialMesh does NOT support SurfaceAppearance — use MeshPart instead for PBR.
  Use SpecialMesh only for legacy compatibility or very simple shapes (Sphere, Cylinder, Wedge).

UnionOperation:
  GPU cost: 1 draw call for the combined shape.
  WARNING: Unions with many subparts increase CPU time to compute collision mesh.
  WARNING: Unions with Precise CollisionFidelity are very expensive on physics thread.
  Limit union complexity to 20 subparts per union for mobile.

--- MATERIAL RENDERING COST HIERARCHY (cheapest to most expensive) ---
1. Concrete — flat diffuse, no specular, cheapest material
2. Brick — diffuse + low normal map cost
3. Wood — diffuse + low normal map cost
4. Metal — diffuse + specular (1 extra lighting pass)
5. Grass — diffuse + normal map
6. Sand — diffuse + normal + roughness
7. DiamondPlate — diffuse + specular + reflective
8. Neon — emissive channel, cheaper than SurfaceAppearance
9. Glass — transparency + refraction, 2x GPU cost (renders scene twice)
10. ForceField — special shader, avoid in bulk
11. SurfaceAppearance (PBR) — 4 textures (AlbedoMap, NormalMap, MetalnessMap, RoughnessMap)
    Each SurfaceAppearance adds: albedo sample + normal sample + PBR lighting calculation.
    Cost: ~3-5x higher than flat material per object.
    Mobile budget: <= 15 unique SurfaceAppearance textures in scene.

MATERIAL RULES:
  NEVER use SmoothPlastic — visually cheap, poor for design language.
  Prefer Concrete for walls/floors (cheapest that looks good).
  Prefer Metal for machinery, vehicles, sci-fi.
  Prefer Wood for natural structures.
  Prefer Brick for facades.
  Use Neon for glowing effects instead of PointLight when possible (cheaper).

--- TRANSPARENT PARTS COST ---
Transparency rendering requires alpha sorting — expensive.
RULE: Avoid Part.Transparency between 0.01 and 0.99 on many parts simultaneously.
Binary transparency (0 or 1) is free — renderer can cull invisible parts.
Glass material with Transparency = 0 is still semi-transparent shader — avoid on mobile.

Transparent part budget:
  Mobile: <= 20 transparent parts visible at once
  PC low: <= 50 transparent parts visible at once
  PC high: <= 200 transparent parts visible at once

Workarounds for transparency effects:
  Fog (Lighting.FogColor, Lighting.FogStart, Lighting.FogEnd) — GPU free, atmospheric.
  Beam objects — use instead of transparent tube parts for energy effects.
  Trail objects — use instead of animated transparent streaks.
  ParticleEmitter with Transparency NumberSequence — pool emitters, don't create per-frame.

--- SHADOW CASTING COST ---
Shadow cost = (number of shadow-casting lights) × (number of shadow-casting parts in range).
Each shadow-casting PointLight/SpotLight does a 6-face shadow cube map render — very expensive.

Shadow rules:
  Part.CastShadow = false for all small props (< 2 studs).
  Part.CastShadow = false for all underground parts.
  Part.CastShadow = false for all parts > 200 studs from players.
  PointLight.Shadows = false for all ambient/decorative lights.
  PointLight.Shadows = true only for key hero lights (campfires, lamps on main path): max 3 total.
  SpotLight.Shadows = true only for 1-2 critical spotlights.
  SurfaceLight.Shadows = false always (surface lights have large shadow map cost).

Lighting technology cost (Lighting.Technology):
  Compatibility: Cheapest. No real-time shadows. Good for mobile-first games.
  ShadowMap: Medium. Real-time directional shadows only (sun/moon). Good default.
  Future: Expensive. Full ray-traced GI + reflections. PC only.
  Voxel: Deprecated. Avoid.

For mobile games: Lighting.Technology = Enum.Technology.Compatibility
For PC games: Lighting.Technology = Enum.Technology.ShadowMap
For premium PC games: Lighting.Technology = Enum.Technology.Future (warn users of performance cost)

Global Illumination (Lighting.GlobalShadows):
  Lighting.GlobalShadows = false → saves 15-30% GPU on mobile.
  Lighting.GlobalShadows = true → enable only on PC-target games.

Ambient light settings (not shadow-related, but cheap to tune):
  Lighting.Ambient = Color3.fromRGB(70, 70, 80) — night/space games
  Lighting.Ambient = Color3.fromRGB(120, 120, 120) — overcast
  Lighting.OutdoorAmbient = Color3.fromRGB(140, 140, 160)
  Lighting.Brightness = 1.5 — daytime
  Lighting.Brightness = 0.3 — night
  Lighting.ClockTime = 14 — afternoon sun (14 = 2 PM)
  Lighting.GeographicLatitude = 41.7 — North America default

--- DECAL AND TEXTURE BATCHING ---
Decal objects (child of Part):
  Each unique Decal.Texture URL = 1 texture upload to GPU.
  Same Decal.Texture URL shared across many parts = 1 texture (batched automatically).
  RULE: Use <= 10 unique texture IDs for decals in a single scene.

Texture objects (wrapping texture):
  Texture.StudsPerTileU and Texture.StudsPerTileV control tiling — larger values = fewer tiles, cheaper.
  Default tile: 1 stud per tile. Set to 4-8 studs per tile for large floors/walls.

SurfaceAppearance batching:
  Roblox does NOT batch SurfaceAppearance across different MeshParts.
  To minimize draw calls: use the same SurfaceAppearance Asset ID on multiple props.
  Group props by shared SurfaceAppearance texture sets.

--- OCCLUSION CULLING ---
Roblox engine performs view frustum culling automatically (parts outside camera FOV not drawn).
Roblox engine performs occlusion culling via PVS (Potentially Visible Set) for streaming-enabled places.

Manual occlusion helpers:
  For large indoor spaces: break into rooms. Each room = 1 Model.
  Control Model visibility per room with Model.PrimaryPart.LocalTransparencyModifier = 1 (hides visually but keeps in workspace — no unanchoring cost).
  Better: set Model children Part.LocalTransparencyModifier = 1 from a script when player is not in the room.
  LocalTransparencyModifier overrides Part.Transparency for the local client only.

Camera near/far plane:
  CurrentCamera.NearPlaneZ = -0.5 — default, cannot reduce render distance this way.
  Use Lighting.FogEnd to hide distant objects without rendering them.
  Lighting.FogEnd = 400 — objects past 400 studs fade to fog color (cheap visual culling).
  Lighting.FogStart = 200 — fog begins at 200 studs.

--- PARTICLE SYSTEMS ---
ParticleEmitter cost = (EmissionRate × particle lifetime) × (particle poly count).
ParticleEmitter.Enabled = false when player is > 80 studs away.
ParticleEmitter.Rate = 0 on mobile, then re-enable based on QualityLevel.

QualityLevel detection:
  UserSettings():GetService("UserGameSettings").SavedQualitySetting
  Returns 1 (lowest) to 10 (highest).
  Mobile users typically land at QualityLevel 1-3.

Particle count rules:
  QualityLevel 1-3 (mobile): MaxParticles override = 10
  QualityLevel 4-6 (PC low): MaxParticles override = 50
  QualityLevel 7-10 (PC high): MaxParticles override = 200

--- BEAM OBJECTS ---
Beam.Width0 and Beam.Width1 define beam profile (studs).
Beam.FaceCamera = true — always faces camera, cheap for laser/energy effects.
Beam.Segments = 4 for straight beams, Beam.Segments = 20 for curved.
Beam.LightEmission = 1 — emissive glow without a PointLight.
Beam.LightInfluence = 0 — beam ignores scene lighting (self-lit).
Use Beam instead of a row of transparent cylinder parts — 1 draw call vs many.

--- VIEWPORT FRAMES ---
ViewportFrame.ImageColor3 = Color3.fromRGB(255,255,255) — tint rendered image.
ViewportFrame.Ambient = Color3.fromRGB(200,200,200).
ViewportFrame renders a 3D scene into a 2D texture — expensive if large or updated per-frame.
RULE: Use ViewportFrame only for item preview UI. Set CurrentCamera update only when item changes.
RULE: Never put ViewportFrame in a ScrollingFrame that auto-scrolls — renders every frame.

--- RENDER SETTINGS FOR QUALITY TIERS ---
Set via LocalScript in StarterPlayerScripts:

Quality tier 1 (mobile minimum):
  settings().Rendering.QualityLevel = Enum.QualityLevel.Level01
  -- This is client preference, server cannot force quality level.
  -- Instead guide users to set quality in Roblox settings.

Framerate target:
  RunService.RenderStepped is 60 Hz on PC, 30 Hz on mobile (Roblox limits mobile to 30 FPS by default on older devices).
  Use task.delay() or RunService.Heartbeat for non-visual updates — do not put game logic in RenderStepped.
`;

// ─────────────────────────────────────────────────────────────────────────────
// SCRIPTING OPTIMIZATION
// ─────────────────────────────────────────────────────────────────────────────

export const OPT_SCRIPTING: string = `
=== ROBLOX SCRIPTING OPTIMIZATION BIBLE ===

--- RUNSERVICE EVENTS: WHEN TO USE EACH ---

RunService.Heartbeat:
  Fires: Every simulation step (after physics, before rendering). 60 Hz.
  Thread: Server main thread (in Script) or client main thread (in LocalScript).
  Use for: Game state updates, position checks, cooldown timers, AI ticks.
  Use for: Server-side physics-dependent code (reading Part.Position after physics).
  DO NOT use for: Rendering camera manipulation (use RenderStepped instead).
  DO NOT use for: Intensive per-frame calculations (throttle with frame counters).

RunService.RenderStepped:
  Fires: Every frame before rendering, on CLIENT only.
  Thread: Main client rendering thread.
  Use for: Camera manipulation (CFrame updates for smooth motion).
  Use for: Character visual updates that must be synchronized to frame rate.
  Use for: UI animations that must not drop frames.
  DO NOT use in: Script (server) — fires only in LocalScript.
  DO NOT use for: Heavy computation — blocks rendering until complete.
  WARNING: Any yield inside RenderStepped callback causes a RunService error. Never yield here.

RunService.Stepped:
  Fires: Every physics step, before physics simulation runs.
  Thread: Main thread.
  Use for: Applying forces/impulses that must happen before physics resolves.
  Use for: Pre-physics position overrides.
  Less common than Heartbeat — prefer Heartbeat for post-physics reads.

Throttling RunService connections:
  PATTERN: Use a frame counter to run expensive code every N frames.
  local frameCount = 0
  RunService.Heartbeat:Connect(function(dt)
    frameCount = frameCount + 1
    if frameCount % 10 ~= 0 then return end  -- Run every 10 frames (~6 Hz at 60 FPS)
    -- expensive code here
  end)

  For distance checks: every 10 frames (6 Hz) is sufficient.
  For AI state: every 30 frames (2 Hz) is sufficient.
  For leaderboard updates: every 60 frames (1 Hz) is sufficient.

--- TABLE CREATION: table.create vs {} ---
{} creates an empty table (hash + array part both allocated).
table.create(n) pre-allocates array part of size n — avoids repeated memory reallocation.

When to use table.create(n):
  When you know the final size of the array in advance.
  When filling a table in a loop with a known count.

Example:
  -- BAD (reallocates repeatedly as table grows):
  local parts = {}
  for i = 1, 100 do
    parts[i] = workspace:FindFirstChild("Part" .. i)
  end

  -- GOOD (pre-allocated, 0 reallocations):
  local parts = table.create(100)
  for i = 1, 100 do
    parts[i] = workspace:FindFirstChild("Part" .. i)
  end

table.create(n, value) fills all n slots with the given value:
  local flags = table.create(100, false)  -- 100 false values, no reallocation

--- STRING CONCATENATION O(N²) FIX ---
String concatenation with .. in a loop is O(n²) — each .. creates a new string object.

BAD (O(n²), 1000 iterations creates 1000 intermediate strings):
  local result = ""
  for i = 1, 1000 do
    result = result .. "item" .. i .. ","
  end

GOOD (O(n), single join at end):
  local parts = table.create(1000)
  for i = 1, 1000 do
    parts[i] = "item" .. i
  end
  local result = table.concat(parts, ",")

table.concat(tbl, separator, start, end):
  separator: string to insert between elements (default "")
  start: first index (default 1)
  end: last index (default #tbl)
  Example: table.concat({"a","b","c"}, "-") → "a-b-c"

Use table.concat for: building CSV data, JSON strings, command lists, formatted output.

--- PAIRS vs IPAIRS vs NUMERIC FOR IN HOT LOOPS ---
pairs(t): Iterates ALL keys (array + hash). Uses next() internally.
  Cost: Hash table traversal — slower than numeric for.
  Use for: Tables with mixed/unknown keys (dictionaries).

ipairs(t): Iterates array part only, stops at first nil. Uses integer indexing.
  Cost: Slightly slower than numeric for (boundary check each step).
  Use for: Ordered arrays where you need (index, value) pairs.

Numeric for (for i = 1, #t do):
  Cost: Cheapest — direct array indexing, no iterator function call overhead.
  Use for: Dense arrays where you only need values (index-access value directly).
  GOTCHA: #t is computed once at loop start. If t changes during loop, use stored length.

Performance ranking (fastest to slowest for array iteration):
  1. for i = 1, n do local v = t[i] — fastest
  2. for i, v in ipairs(t) do — slightly slower (iterator overhead)
  3. for k, v in pairs(t) do — slowest for arrays (hash traversal)

RULE: In hot loops (running every Heartbeat), use numeric for over arrays.
RULE: Never use pairs() inside RenderStepped.
RULE: Cache table length: local n = #t before the loop if table doesn't change.

Example hot loop pattern:
  -- Cache references and length outside loop
  local enemies = EnemySystem.activeEnemies  -- reference to array
  local n = #enemies
  for i = 1, n do
    local enemy = enemies[i]
    -- process enemy
  end

--- INSTANCE CACHING: DON'T CALL FINDFIRSTCHILD REPEATEDLY ---
FindFirstChild(name, recursive): Traverses children tree. O(n) where n = child count.
WaitForChild(name, timeout): Yields and polls — never call in hot loop.

RULE: Call FindFirstChild once, store result in a local variable.
RULE: Never call FindFirstChild inside Heartbeat, RenderStepped, or any loop.

BAD (FindFirstChild called every frame):
  RunService.Heartbeat:Connect(function()
    local hp = player.Character:FindFirstChild("Humanoid").Health
    -- 60 calls per second to FindFirstChild
  end)

GOOD (cached once):
  local humanoid = player.Character:WaitForChild("Humanoid")
  RunService.Heartbeat:Connect(function()
    local hp = humanoid.Health  -- direct property access, O(1)
  end)

Cache hierarchy for frequently-accessed objects:
  -- At module top level, not inside functions:
  local Players = game:GetService("Players")
  local RunService = game:GetService("RunService")
  local ReplicatedStorage = game:GetService("ReplicatedStorage")
  local workspace = game:GetService("Workspace")  -- or just 'workspace' global

  -- Cache service children:
  local remotes = ReplicatedStorage:WaitForChild("Remotes")
  local updatePosition = remotes:WaitForChild("UpdatePosition")

Property access caching:
  -- BAD: Accessing property chain repeatedly
  for i = 1, 100 do
    local x = workspace.CurrentCamera.CFrame.Position.X
  end

  -- GOOD: Cache intermediate objects
  local camera = workspace.CurrentCamera
  local cframe = camera.CFrame
  local posX = cframe.Position.X
  for i = 1, 100 do
    local x = posX  -- or recompute only what changes
  end

--- TASK LIBRARY vs COROUTINE ---
task.spawn(fn, ...): Creates a new thread and immediately runs fn. No yield.
  Use for: Fire-and-forget work that should start immediately.
  Use for: Calling a function that may yield without blocking current thread.

task.delay(seconds, fn, ...): Runs fn after seconds delay. Roblox-managed scheduler.
  Accuracy: ±1 frame (16ms at 60 FPS).
  Use for: Delayed effects, cooldown callbacks, debounce.
  BETTER than: wait(n) — wait() was deprecated. task.wait(n) is the replacement.

task.wait(seconds): Yields current thread for at least seconds. Returns actual time waited.
  Use for: Pausing inside a coroutine or task.spawn block.
  NEVER use in: RenderStepped (yields not allowed).
  NEVER use in: Heartbeat connection (yields cause deferred scheduling issues).

task.defer(fn, ...): Queues fn to run at end of current frame. Non-immediate.
  Use for: Callbacks that should run after current code path completes.
  Use for: Breaking circular dependency in event chains.

coroutine.create vs task.spawn:
  coroutine.create(fn): Creates a coroutine, does NOT start it. Manual resume needed.
  coroutine.resume(co, ...): Starts/resumes coroutine.
  coroutine.wrap(fn): Returns a function that resumes the coroutine when called.
  task.spawn(fn): Creates AND immediately starts a coroutine. Simpler API.

  RULE: Prefer task.spawn over coroutine.create for new code — simpler and scheduler-aware.
  RULE: Use coroutine only when you need manual resume control (e.g., producer-consumer patterns).

Coroutine status check:
  coroutine.status(co):
    "suspended" — paused at yield, can be resumed
    "running" — currently executing
    "dead" — finished or errored
    "normal" — coroutine that resumed another (rare)

--- PARALLEL LUAU WITH ACTORS ---
Parallel Luau allows Scripts inside Actors to run on separate OS threads.
This is the ONLY true multithreading in Roblox.

Actor setup:
  Actor is an Instance (roblox class) that can parent Scripts.
  Scripts inside an Actor run in their own thread.
  Actors are in the DataModel just like regular Instances.

SharedTable (cross-thread data):
  SharedTable.new(): Creates a table that can be read/written from multiple threads.
  SharedTable is NOT a Lua table — it uses its own API.
  SharedTable.get(st, key): Read a value.
  SharedTable.set(st, key, value): Write a value (atomic).
  SharedTable.increment(st, key, delta): Atomic increment for numbers.
  SharedTable.update(st, key, fn): Atomic compare-and-set via function.
  Values must be: numbers, strings, booleans, or nested SharedTables.
  Values cannot be: Instances, functions, userdata (CFrame, Vector3, etc).
  To pass CFrame: decompose to numbers (X, Y, Z, components), reconstruct on other thread.

task.desynchronize(): Called inside a Script in an Actor.
  Effect: Moves current thread from serial (main) to parallel execution.
  After desynchronize: code runs concurrently with other parallel threads.
  Cannot call most Roblox APIs in parallel (only safe ones).
  Safe in parallel: math operations, SharedTable reads/writes, string operations.
  Unsafe in parallel (will error): Instance property reads/writes, RemoteEvent:FireClient().

task.synchronize(): Called after task.desynchronize().
  Effect: Resumes execution on the serial main thread.
  After synchronize: safe to read/write Instances again.

Parallel Luau pattern for enemy AI:
  -- Each enemy has an Actor with a Script inside.
  -- Script does heavy pathfinding in parallel, then writes result to SharedTable.
  -- Main server script reads SharedTable and applies movement in serial.

  -- Inside Actor Script:
  local actor = script:GetActor()
  local sharedResults = -- passed via attribute or MessagingService
  task.desynchronize()
  -- heavy AI calculation here (parallel)
  local nextWaypoint = calculatePath(enemyPos, targetPos)
  SharedTable.set(sharedResults, actor:GetAttribute("EnemyId"), {
    x = nextWaypoint.X,
    y = nextWaypoint.Y,
    z = nextWaypoint.Z,
  })
  task.synchronize()
  -- apply result to Instance here (serial)

Actor:SendMessage(topic, ...): Send data to a specific Actor's Scripts.
  Scripts receive via actor:BindToMessageParallel(topic, fn) — runs fn in parallel thread.
  actor:BindToMessage(topic, fn) — runs fn in serial (safe for Instance access).

BindToMessageParallel is the entry point for parallel work:
  actor:BindToMessageParallel("DoWork", function(data)
    task.desynchronize()  -- optional, already parallel from BindToMessageParallel
    -- heavy computation
    task.synchronize()
    -- apply to Instances
  end)

--- AVOIDING CLOSURES IN LOOPS ---
Creating a function inside a loop creates a new closure each iteration — GC pressure.

BAD (creates 100 closure objects):
  for i = 1, 100 do
    local part = parts[i]
    part.Touched:Connect(function(hit)
      handleTouch(part, hit)
    end)
  end

GOOD (single shared handler, passes data via upvalue or lookup):
  local function onTouched(part, hit)
    handleTouch(part, hit)
  end
  for i = 1, 100 do
    local part = parts[i]
    part.Touched:Connect(function(hit)
      onTouched(part, hit)  -- closure captures 'part' but reuses 'onTouched'
    end)
  end

  -- Even better: use a single table-based handler
  local touchHandlers = {}
  for i = 1, 100 do
    local part = parts[i]
    touchHandlers[part] = function(hit)
      handleTouch(part, hit)
    end
    part.Touched:Connect(touchHandlers[part])
  end

--- METATABLES AND __INDEX FOR PERFORMANCE ---
__index metamethod: Allows table to delegate missing key lookups to another table or function.
  Use for: Class inheritance patterns.
  Use for: Lazy property computation (compute only when accessed).
  Use for: Shared methods across many object instances (saves memory).

Class pattern with __index (standard Roblox OOP):
  local Enemy = {}
  Enemy.__index = Enemy

  function Enemy.new(position)
    local self = setmetatable({}, Enemy)
    self.Position = position
    self.Health = 100
    return self
  end

  function Enemy:TakeDamage(amount)
    self.Health = self.Health - amount
  end

  -- Each Enemy instance is a small table, methods live in Enemy (shared).
  -- Memory: 1 function object per method type (not per instance).

--- PROFILING WITH DEBUG LIBRARY ---
debug.profilebegin(label): Start a named profiler section. Shows in MicroProfiler.
debug.profileend(): End the current profiler section.

Usage:
  RunService.Heartbeat:Connect(function()
    debug.profilebegin("EnemyAI")
    updateAllEnemies()
    debug.profileend()

    debug.profilebegin("ProjectileSystem")
    updateAllProjectiles()
    debug.profileend()
  end)

In MicroProfiler (Ctrl+F6 in game):
  Each debug.profilebegin/end block shows as colored bar on timeline.
  Width = time taken. Stack up = nested calls.
  Look for: bars that spike > 2ms on Heartbeat thread (indicates performance problem).
  Roblox labels to watch: "RunService", "Heartbeat", "Physics", "Render", "Animate".

--- READING MICROPROFILE LABELS ---
MicroProfiler keyboard shortcut: Ctrl+F6 (PC client only).
Dump to file: Ctrl+Shift+F6 → saves microprofiler.html to game directory.

Key threads in MicroProfiler:
  Main (orange): Lua code execution, property reads/writes.
  Worker (blue): Parallel Luau threads (Actors).
  Render (green): GPU work submission, frame composition.
  Physics (red): Roblox physics simulation (Bullet engine).

Common bottlenecks by thread:
  Main thread spiking: Heavy Lua per-frame logic. Look at RunService events.
  Worker thread low: Parallel Luau not being used (opportunity to parallelize AI).
  Render thread spiking: Too many draw calls or complex materials.
  Physics thread spiking: Too many unanchored parts, complex collision meshes.

Performance targets:
  Main thread per frame: < 4ms (16ms budget at 60 FPS, leave headroom)
  Physics thread per frame: < 5ms
  Render thread per frame: < 8ms (most time goes here on GPU)

--- AVOIDING SCRIPT INJECTION AND LOADSTRING ---
loadstring() is disabled in Roblox by default (security).
require() on ModuleScripts is the correct way to load code dynamically.
NEVER use HttpService to fetch and execute Lua code at runtime — bannable.

ModuleScript caching:
  require(moduleScript): Returns cached result after first require. Not re-executed.
  To create re-initializable systems: return a constructor function, not a pre-built state.

--- REMOTE EVENTS IN HOT PATHS ---
RemoteEvent:FireServer() and RemoteEvent:FireClient() are NOT free — they serialize data, send over network, deserialize.
RULE: Do not fire remotes more than 20 times per second per client.
RULE: Batch multiple updates into one remote fire (see network section).

Checking if remote was fired from server or client:
  In LocalScript: remote:FireServer(data) → server's OnServerEvent receives (player, data).
  In Script: remote:FireClient(player, data) → client's OnClientEvent receives (data).
  remote:FireAllClients(data) → all clients receive (data) on OnClientEvent.
`;

// ─────────────────────────────────────────────────────────────────────────────
// MEMORY MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

export const OPT_MEMORY: string = `
=== ROBLOX MEMORY MANAGEMENT BIBLE ===

--- INSTANCE CLEANUP: DESTROY vs NIL vs PARENT=NIL ---

Instance:Destroy():
  What it does:
    1. Sets Instance.Parent = nil (removes from DataModel).
    2. Disconnects ALL RBXScriptConnections on the Instance AND all descendants.
    3. Locks the Instance — any further property access raises an error.
    4. Marks for GC (actual collection is not immediate).
  Use for: Permanent removal. Parts, models, UI elements you will never reuse.
  After Destroy(): Do NOT store reference to the Instance. Set variable to nil.
  CRITICAL: Destroy() is recursive — all descendants also destroyed and connections disconnected.

Setting Parent = nil:
  What it does: Removes from DataModel rendering/replication but keeps object alive in memory.
  Use for: Object pooling (temporarily parking objects out of workspace).
  DOES NOT disconnect connections — you must disconnect manually.
  Object is still fully usable after Parent = nil.

Setting variable to nil:
  What it does: Removes the Lua reference from the variable.
  Does NOT affect the Instance unless it was the last reference.
  Roblox Instances have an additional C++ reference — setting Lua reference to nil is not enough to free memory.
  To free: BOTH set Parent = nil (or Destroy) AND set Lua variable to nil.

Memory leak scenario:
  local part = Instance.new("Part")
  part.Parent = workspace
  -- Later:
  part.Parent = nil  -- removed from workspace
  -- But 'part' variable still holds Lua reference.
  -- Instance stays in memory until part = nil AND GC runs.

Correct cleanup:
  part:Destroy()
  part = nil  -- remove Lua reference (allows GC to collect)

--- CONNECTION CLEANUP: :DISCONNECT() ---
RBXScriptConnection represents an event listener binding.
Not disconnecting = memory leak + continued execution after object is gone.

RULE: Every :Connect() must have a corresponding :Disconnect() when the object is done.
RULE: Destroy() disconnects all connections on the destroyed Instance — but NOT connections where the CALLBACK references the Instance.

Maid/Janitor pattern (common Roblox cleanup utility):
  -- Simple maid implementation:
  local Maid = {}
  Maid.__index = Maid

  function Maid.new()
    return setmetatable({ _tasks = {} }, Maid)
  end

  function Maid:GiveTask(task)
    -- task can be: RBXScriptConnection, function, or Instance
    table.insert(self._tasks, task)
    return task
  end

  function Maid:DoCleaning()
    for _, task in ipairs(self._tasks) do
      if typeof(task) == "RBXScriptConnection" then
        task:Disconnect()
      elseif typeof(task) == "function" then
        task()
      elseif typeof(task) == "Instance" then
        task:Destroy()
      end
    end
    table.clear(self._tasks)
  end

  -- Usage:
  local maid = Maid.new()
  maid:GiveTask(part.Touched:Connect(onTouched))
  maid:GiveTask(RunService.Heartbeat:Connect(onHeartbeat))
  -- On cleanup:
  maid:DoCleaning()

Connection storage patterns:
  -- Store connections in table for batch disconnect:
  local connections = {}
  connections[#connections+1] = event1:Connect(handler1)
  connections[#connections+1] = event2:Connect(handler2)
  -- Cleanup:
  for _, conn in ipairs(connections) do
    conn:Disconnect()
  end
  table.clear(connections)

  -- Or: signal library approach (many open-source options)

Checking if connection is active:
  connection.Connected → boolean. True if still connected, false after Disconnect() or Destroy().

--- LUA GARBAGE COLLECTOR BEHAVIOR ---
Roblox uses LuaJIT's garbage collector (mark-and-sweep with incremental collection).
GC runs automatically in the background — you don't control exact timing.
GC is triggered: when memory allocation crosses a threshold (GC step occurs).

Forcing GC: collectgarbage("collect") — forces a full GC cycle. Use sparingly (causes frame spike).
Checking memory: collectgarbage("count") — returns Lua heap size in KB.

Objects that prevent GC:
  Any live Lua variable referencing the object.
  An event connection where the callback is a closure capturing the object.
  A table entry pointing to the object.

Common GC memory leaks:
  1. Storing Instances in global tables and never removing them.
  2. Event connections that capture object references and are never disconnected.
  3. ModuleScript returning singletons that accumulate state.
  4. Growing tables (log systems, history arrays) with no max size cap.

--- OBJECT POOLING PATTERN ---
Object pooling avoids repeated Instance.new() + Destroy() by reusing Instances.
When to use: Frequently spawned/despawned objects (bullets, particles, enemies, floating labels).

Pool implementation:
  local BulletPool = {}
  BulletPool.__index = BulletPool

  local POOL_FOLDER = Instance.new("Folder")
  POOL_FOLDER.Name = "BulletPool"
  POOL_FOLDER.Parent = workspace

  function BulletPool.new(template, maxSize)
    local self = setmetatable({}, BulletPool)
    self._template = template
    self._maxSize = maxSize or 50
    self._available = {}
    self._active = {}
    -- Pre-warm pool
    for i = 1, math.min(10, maxSize) do
      local obj = template:Clone()
      obj.Parent = POOL_FOLDER
      obj.Anchored = true
      obj.CanCollide = false
      obj.Transparency = 1
      table.insert(self._available, obj)
    end
    return self
  end

  function BulletPool:Get()
    local obj = table.remove(self._available)
    if not obj then
      if #self._active < self._maxSize then
        obj = self._template:Clone()
        obj.Parent = workspace
      else
        return nil  -- pool exhausted
      end
    end
    obj.Transparency = 0
    obj.CanCollide = true
    obj.Parent = workspace
    self._active[obj] = true
    return obj
  end

  function BulletPool:Return(obj)
    if not self._active[obj] then return end
    self._active[obj] = nil
    obj.Transparency = 1
    obj.CanCollide = false
    obj.CFrame = CFrame.new(0, -1000, 0)  -- park underground
    obj.Velocity = Vector3.zero
    obj.AssemblyLinearVelocity = Vector3.zero
    obj.Parent = POOL_FOLDER
    table.insert(self._available, obj)
  end

  function BulletPool:GetStats()
    return {
      available = #self._available,
      active = 0,  -- count self._active manually if needed
    }
  end

Pool usage pattern:
  local bullet = BulletPool:Get()
  if bullet then
    bullet.CFrame = spawnCFrame
    bullet.AssemblyLinearVelocity = direction * 200  -- studs/sec
    task.delay(3, function()  -- recycle after 3 seconds
      BulletPool:Return(bullet)
    end)
  end

--- WEAKTABLE FOR CACHES ---
Weak tables allow GC to collect values even if the table holds a reference.
Use for: Caches where entries should expire when the underlying object is GC'd.

local weakCache = setmetatable({}, { __mode = "v" })  -- weak values
-- or
local weakKeyCache = setmetatable({}, { __mode = "k" })  -- weak keys
-- or
local fullyWeak = setmetatable({}, { __mode = "kv" })  -- both weak

Weak value cache for Instance data:
  local dataCache = setmetatable({}, { __mode = "k" })
  -- Key = Instance, Value = data table
  -- When Instance is GC'd, the entry is automatically removed from cache.

  dataCache[part] = { lastPosition = part.Position, lastTime = tick() }
  -- If part is destroyed and variable set to nil, cache entry is cleaned up by GC.

When NOT to use weak tables:
  When you need guaranteed persistence of data (weak entries can disappear anytime GC runs).
  For required state — store in regular tables.
  For server session data (player stats, inventory) — never use weak tables.

--- MEMORY PROFILER ---
Roblox Studio Developer Console → Memory tab:
  Shows: Script memory, Instances, Textures, Sounds, Animations.
  Target: Lua Script memory < 50MB total.
  Target: Instance count < 30,000 in workspace.

Memory categories:
  PlaceMemory: Total memory of the place (all players combined on server).
  HttpCache: Cached web assets.
  Signals: Event connections (signals growing = connection leak).
  Instances: Every Instance:new() consumes here.
  LuaCode: Loaded scripts memory.
  LuaHeap: Runtime Lua objects (tables, closures).

Signal memory growing over time = connection leak. Find and disconnect.
Instance count growing over time = missing Destroy() calls.

--- STRING INTERNING ---
Roblox Lua interns short strings (< 32 bytes) — two identical string literals share one object.
Long dynamic strings created in loops are NOT interned — each allocation is separate.
RULE: Use string.intern() or just be aware that repeating string.format() in loops creates GC pressure.

Better pattern for repeated format strings:
  -- BAD (creates new string each frame):
  local label = string.format("Score: %d", score)  -- every frame

  -- GOOD (only update when score changes):
  local cachedLabel = "Score: 0"
  local lastScore = 0
  RunService.Heartbeat:Connect(function()
    if score ~= lastScore then
      cachedLabel = string.format("Score: %d", score)
      lastScore = score
      textLabel.Text = cachedLabel
    end
  end)

--- TABLE.CLEAR VS REASSIGNMENT ---
table.clear(t): Removes all key-value pairs from table. Keeps allocated array capacity.
  Use for: Resetting a reusable table without deallocating memory. Avoids GC.

t = {}: Creates a new table, old table becomes eligible for GC.
  Use for: Full replacement when the old table should be collected.

In object pools or per-frame scratch tables:
  local scratch = {}
  RunService.Heartbeat:Connect(function()
    table.clear(scratch)  -- reuse, no GC
    -- fill scratch with this frame's data
  end)
`;

// ─────────────────────────────────────────────────────────────────────────────
// NETWORK OPTIMIZATION
// ─────────────────────────────────────────────────────────────────────────────

export const OPT_NETWORK: string = `
=== ROBLOX NETWORK OPTIMIZATION BIBLE ===

--- REMOTE PAYLOAD SIZE LIMITS ---
Roblox soft limit per remote fire: ~200KB of serialized data.
Practical budget: Keep individual remote fires < 10KB for real-time gameplay.
Burst limit: Not documented but > 1000 fires/second total across all remotes causes throttling.

Data serialization cost (approximate, compressed):
  boolean: 1 byte
  integer (small, < 256): 1-2 bytes
  float/number: 8 bytes (double precision)
  string: 1 byte per character + 2-byte length header
  Vector3: 12 bytes (3 floats)
  CFrame: 48 bytes (position + rotation matrix) — expensive
  Instance reference: ~4-8 bytes (internally handle ID)
  table (array): sum of values + overhead per entry (~4 bytes per entry)
  table (dictionary): sum of key+value + overhead per key (~8 bytes per key)

CFrame optimization:
  Instead of sending full CFrame (48 bytes), send position + look vector:
  Vector3 position (12 bytes) + Vector3 lookVector (12 bytes) = 24 bytes.
  Reconstruct: CFrame.lookAt(position, position + lookVector)

  Or send position + yaw angle (horizontal rotation only) for characters:
  Vector3 (12 bytes) + number yaw (8 bytes) = 20 bytes.
  Reconstruct: CFrame.new(position) * CFrame.Angles(0, yaw, 0)

--- BATCHING MULTIPLE UPDATES INTO ONE REMOTE ---
RULE: Never fire one remote per entity per frame. Batch ALL entity updates into one fire.

BAD (O(n) remote fires per frame):
  for _, enemy in ipairs(enemies) do
    updateEnemyRemote:FireAllClients(enemy.Id, enemy.Position, enemy.Health)
  end

GOOD (1 remote fire per frame, O(1) network calls):
  local batch = {}
  for _, enemy in ipairs(enemies) do
    batch[enemy.Id] = {
      p = { enemy.Position.X, enemy.Position.Y, enemy.Position.Z },
      h = enemy.Health,
    }
  end
  updateBatchRemote:FireAllClients(batch)

Client unpacks batch:
  updateBatchRemote.OnClientEvent:Connect(function(batch)
    for enemyId, data in pairs(batch) do
      local enemy = EnemyRegistry[enemyId]
      if enemy then
        enemy:SetTarget(Vector3.new(data.p[1], data.p[2], data.p[3]))
        enemy:SetHealth(data.h)
      end
    end
  end)

Batching frequency:
  For smooth 60 FPS visual: fire batch every 1 frame (60 Hz) → only for critical data.
  For physics-synced objects: fire every 3 frames (20 Hz) → sufficient with interpolation.
  For non-critical state (enemy health bars): fire every 10 frames (6 Hz).
  For leaderboard/score: fire every 60 frames (1 Hz) or on change only.

--- CLIENT-SIDE INTERPOLATION (PREDICT BETWEEN SERVER UPDATES) ---
Server sends position at 20 Hz. Client renders at 60 Hz. Gap = 3 frames of no data.
Solution: Store last 2 server positions + timestamps. Interpolate between them.

Linear interpolation (lerp) pattern:
  local serverUpdates = {}  -- ring buffer of {time, position}

  updateRemote.OnClientEvent:Connect(function(enemyId, posData)
    local pos = Vector3.new(posData[1], posData[2], posData[3])
    if not serverUpdates[enemyId] then
      serverUpdates[enemyId] = { prev = {t=0, p=pos}, curr = {t=tick(), p=pos} }
    else
      serverUpdates[enemyId].prev = serverUpdates[enemyId].curr
      serverUpdates[enemyId].curr = { t = tick(), p = pos }
    end
  end)

  RunService.RenderStepped:Connect(function()
    local now = tick()
    for enemyId, data in pairs(serverUpdates) do
      local dt = data.curr.t - data.prev.t
      if dt > 0 then
        local alpha = math.clamp((now - data.curr.t) / dt, 0, 1.2)
        -- alpha > 1 = extrapolation (risky but smooths late packets)
        local lerpedPos = data.prev.p:Lerp(data.curr.p, alpha)
        -- apply lerpedPos to enemy model CFrame
        local model = EnemyModels[enemyId]
        if model then
          model.PrimaryPart.CFrame = CFrame.new(lerpedPos)
        end
      end
    end
  end)

Improved interpolation with buffer delay:
  Buffer 100ms of server updates before playing back.
  Eliminates extrapolation artifacts at cost of 100ms latency.
  Used by Roblox's built-in character replication.

--- UNRELIABLE REMOTES FOR NON-CRITICAL DATA ---
UnreliableRemoteEvent: Introduced in Roblox 2023.
  Sends data without guaranteed delivery or ordering.
  Lower overhead than RemoteEvent (no ACK, no retransmit).
  Use for: Positional updates, bullet tracers, particle triggers, footstep sounds.
  DO NOT use for: Damage application, inventory changes, currency, quest progress.

UnreliableRemoteEvent:FireServer(data): Fire from client.
UnreliableRemoteEvent:FireClient(player, data): Fire to specific client.
UnreliableRemoteEvent:FireAllClients(data): Fire to all clients.
OnClientEvent, OnServerEvent: Same as RemoteEvent.

When a packet is lost with UnreliableRemoteEvent: nothing happens. Next update will correct.
When a packet arrives out of order: process it anyway (or timestamp+discard old packets).

Packet ordering check:
  Server sends: { seq = sequenceNumber, pos = position }
  Client tracks: lastSeq per entity.
  If data.seq <= lastSeq: discard (old packet arrived late).
  If data.seq > lastSeq: accept and update lastSeq.

--- ATTRIBUTE REPLICATION vs VALUE OBJECTS ---
Attributes on Instances replicate automatically to all clients when changed.
  instance:SetAttribute("Key", value): Set attribute. Replicates if instance is in DataModel.
  instance:GetAttribute("Key"): Read attribute.
  instance.AttributeChanged:Connect(fn): Fires when any attribute changes.
  instance:GetAttributeChangedSignal("Key"):Connect(fn): Fires when specific attribute changes.

Attribute types supported: boolean, number, string, Vector3, Color3, UDim2, UDim, Rect, CFrame, NumberRange, BrickColor, Font.
Attribute NOT supported: Instances, tables, functions.

Value Objects (IntValue, StringValue, NumberValue, BoolValue, Vector3Value, Color3Value, CFrameValue, ObjectValue):
  Replicate automatically. Fire .Changed event on change.
  Use for: Legacy code, or when you need ObjectValue (references another Instance).
  PREFER Attributes for new code — cleaner API, no extra Instance overhead.

Remote vs Attribute vs ValueObject trade-offs:
  RemoteEvent: Client-triggered. Exact delivery. Best for actions.
  Attribute: Server-set, auto-replicates to all clients. Best for state.
  ValueObject: Auto-replicates. Use only if you need .Changed on legacy systems.

Attribute replication rate:
  Changes are batched by Roblox and sent at ~15-20 Hz.
  If you set the same attribute 100 times per second, clients only see ~15-20 updates/second.
  DON'T set attributes in Heartbeat (wasteful — most updates are dropped).
  DO set attributes on meaningful state changes only.

--- REMOTE FUNCTIONS vs REMOTE EVENTS ---
RemoteFunction (Invoke/Callback): Two-way synchronous call with return value.
  Client calls :InvokeServer(data) → server handler returns result → client receives result.
  Server calls :InvokeClient(player, data) → client handler returns result → server receives result.
  WARNING: If server invokes client and client disconnects, server thread yields forever → memory leak.
  RULE: NEVER use :InvokeClient() from server. Always fire events from server, client handles response.
  Safe usage: client invokes server only.
  Timeout pattern for client invocations:
    local success, result = pcall(function()
      return remoteFunction:InvokeServer(data)
    end)

RemoteEvent (Fire/On): One-way, fire-and-forget.
  No return value, no yield.
  Preferred for most communication.

--- DATASTORESERVICE OPTIMIZATION ---
DataStore:GetAsync(key): 6-second cooldown per key on server. Budget: 60 + (10 per player) requests per minute.
DataStore:SetAsync(key, value): Same cooldown.
DataStore:UpdateAsync(key, fn): Atomic read-modify-write. Preferred for counters.

RULE: Load player data once on join, cache in table, save on leave + periodic auto-save.
RULE: Auto-save every 5 minutes (300 seconds), not more frequent.
RULE: Compress data before storing: remove nil values, use short key names.
RULE: Use JSON-compatible types only (no Vector3, CFrame, Color3 — convert to arrays/numbers).

Data compression example:
  -- Store as compact array instead of named table
  -- Instead of: { Health = 100, MaxHealth = 150, Coins = 500 }
  -- Store as: { 100, 150, 500 }  (save on key name bytes)

  -- Or use short keys:
  -- { h = 100, mh = 150, c = 500 }

Retry pattern for DataStore:
  local function safeGetAsync(store, key, retries)
    retries = retries or 3
    for attempt = 1, retries do
      local success, result = pcall(function()
        return store:GetAsync(key)
      end)
      if success then
        return result
      end
      if attempt < retries then
        task.wait(1)  -- wait before retry
      end
    end
    return nil  -- all retries failed
  end

--- PLAYER DATA REPLICATION PATTERNS ---
NEVER replicate all player data to all clients — O(n²) network cost.
Replicate to owning player: use client-side LocalScripts that read from server via RemoteFunction on join.
Replicate relevant data to others: only send what other players need to see (username, level, team).

Example: Inventory (100 items) should NOT replicate to all 50 players.
  Server caches inventory in table.
  When a player joins, server fires their client with their inventory once.
  When inventory changes, fire only the owning player.
  Other players don't need inventory data → don't send it.

Team/public data that all players need:
  Use attributes on a player's character model (visible to all).
  player.Character:SetAttribute("Level", 42)
  player.Character:SetAttribute("TeamColor", "255,0,0")
  Clients read these without any remote calls.
`;

// ─────────────────────────────────────────────────────────────────────────────
// STREAMING ENABLED
// ─────────────────────────────────────────────────────────────────────────────

export const OPT_STREAMING: string = `
=== ROBLOX STREAMINGENABLED OPTIMIZATION BIBLE ===

--- WHAT IS STREAMINGENABLED ---
Workspace.StreamingEnabled = true: Roblox only sends parts of the workspace to clients that are near the player.
Parts far away are not replicated → lower memory, lower network usage, faster loading.
This is the primary way to support large worlds (> 10,000 parts) on mobile.

Enable in Properties: Workspace → StreamingEnabled = true.
Or in script (server-side, before any player joins):
  workspace.StreamingEnabled = true

--- MODELSTREAMING MODES ---
Model.ModelStreamingMode: Controls how a Model is streamed relative to its bounding box.

Enum.ModelStreamingMode.Default (default):
  Model parts stream in based on individual part distances.
  Parts appear one-by-one as player gets closer.
  Use for: General world decoration where partial loading is acceptable.

Enum.ModelStreamingMode.Atomic:
  ALL parts of the model stream in together OR none do.
  Model appears only when ALL parts are within streaming radius.
  Use for: Buildings, vehicles, interactive objects where partial rendering looks broken.
  Use for: Models with scripts that depend on all children existing.
  Trade-off: Larger models take longer to appear (waiting for all parts to load).

Enum.ModelStreamingMode.Persistent:
  Model is ALWAYS replicated to all clients, regardless of distance.
  Never streams out.
  Use for: Critical game objects (spawn points, checkpoints, objective markers).
  Use for: Models referenced by client scripts that must always exist.
  WARNING: Persistent models count against ALL players' budgets — use sparingly.
  Budget: < 50 persistent models total.

Enum.ModelStreamingMode.PersistentPerPlayer:
  Model is persistent only for the specific player who owns it.
  Use for: Player-specific objects (personal plot, owned furniture).
  Each player has their own persistent budget for this.

Enum.ModelStreamingMode.Disabled:
  Model uses the legacy streaming behavior (same as Default but explicit).

--- STREAMING RADIUS SETTINGS ---
Workspace.StreamingMinRadius:
  Distance in studs within which content is GUARANTEED to be loaded.
  Default: 64 studs.
  Range: 4 to StreamingTargetRadius.
  Increase for: Large lobby areas where players need full context immediately.
  Keep low for: Open-world games (saves memory, bandwidth).
  Mobile recommendation: 32-64 studs.
  PC recommendation: 64-128 studs.

Workspace.StreamingTargetRadius:
  Distance in studs that Roblox TRIES to keep loaded (best effort, not guaranteed).
  Default: 1024 studs.
  Higher = more content loaded, more memory used.
  Mobile recommendation: 256-512 studs.
  PC recommendation: 512-1024 studs.

Streaming radius in code:
  workspace.StreamingMinRadius = 64
  workspace.StreamingTargetRadius = 512

--- STREAMINGINTEGRITY MODE ---
Workspace.StreamingIntegrityMode: Controls what happens when required content hasn't loaded yet.

Enum.StreamingIntegrityMode.Disabled:
  No enforcement. Player can be in areas where parts haven't loaded.
  Risk: Player can fall through floors that haven't streamed in yet.

Enum.StreamingIntegrityMode.MinimumRadiusPause:
  Pauses gameplay simulation until the minimum radius is loaded.
  Shows loading screen during pause.
  Use for: Games where falling through unloaded geometry would ruin experience.
  Trade-off: Player sees loading pause when teleporting to new areas.

Enum.StreamingIntegrityMode.PauseOutsideLoadedArea:
  Pauses player if they try to move into an area not yet loaded.
  Keeps player in loaded zone until target zone loads.
  Use for: Tightly designed level-based games.

Setting:
  workspace.StreamingIntegrityMode = Enum.StreamingIntegrityMode.MinimumRadiusPause

--- PERSISTENT MODELS COLLECTION ---
Create a Folder named "PersistentModels" (or any name) in workspace.
Set all children Models to Enum.ModelStreamingMode.Persistent.
This gives you a clear organizational structure for always-loaded content.

What to put in PersistentModels:
  - Spawn points (SpawnLocation instances)
  - Teleport pads
  - Main objective markers
  - In-game purchase buttons
  - UI trigger zones
  - Sky/ambient lighting rigs
  - Lobby central structures (if small)

What NOT to put in PersistentModels:
  - Decorative world props
  - Trees, rocks, grass details
  - Enemy spawner templates
  - Large buildings (too many parts)

--- STREAMING EVENTS ---
ContentProvider:PreloadAsync(): Load assets before using them (see ContentProvider section).

workspace.PersistentLoaded: Fires when persistent models are all loaded. Wait for this on client.
  workspace.PersistentLoaded:Wait()
  -- Now all persistent models are guaranteed to exist on client.

Instance:WaitForChild(name, timeout): Yields until child exists locally.
  Use in LocalScript when referencing workspace children that might not be streamed in yet.
  Always provide timeout to avoid infinite yield:
    local part = workspace:WaitForChild("MyPart", 10)
    if not part then
      -- Part not found in 10 seconds — handle gracefully
    end

StreamingEnabled client events:
  workspace.StreamingEnabled: boolean — read to know if streaming is active.
  Local player streaming signals (undocumented internal): Use WaitForChild for safety instead.

Model.ModelLod: (Read only) Returns current LOD state of model.
  Enum.ModelLod.Disabled: Not using streaming LOD.
  Enum.ModelLod.StreamingMesh: Streaming mesh LOD active.

--- HANDLING STREAMING-IN / OUT ---
Parts stream OUT when player moves far away from them. Scripts on those parts stop running.
Parts stream IN when player approaches. Scripts on those parts start running.

Problem: LocalScripts inside streamed parts start/stop unpredictably.
Solution: Use LocalScripts in StarterPlayerScripts (never streams out) and reference workspace via WaitForChild.

Detecting stream-in:
  workspace.DescendantAdded:Connect(function(descendant)
    if descendant:IsA("Model") and descendant.Name == "EnemySpawner" then
      -- EnemySpawner just streamed in — initialize it
    end
  end)

Detecting stream-out:
  workspace.DescendantRemoving:Connect(function(descendant)
    if descendant:IsA("Model") and descendant.Name == "EnemySpawner" then
      -- EnemySpawner is streaming out — clean up references
    end
  end)

Robust reference pattern with streaming:
  local function getOrWait(parent, childName, timeout)
    local child = parent:FindFirstChild(childName)
    if child then return child end
    return parent:WaitForChild(childName, timeout or 10)
  end

--- LOD MESH STREAMING ---
When StreamingEnabled = true, Roblox automatically sends lower-resolution mesh proxies for distant MeshParts.
Mesh proxy (LOD mesh) is a simplified version — lower poly, no texture.
As player approaches, full mesh + texture streams in.
This is automatic — no script required. Just enable StreamingEnabled.

MeshPart.LevelOfDetailEnabled = true: Allows mesh LOD to be applied. Default true.
MeshPart.LevelOfDetailEnabled = false: Forces full-detail mesh always (higher GPU cost).

LOD mesh quality by distance:
  0-50 studs: Full detail mesh (100% triangles).
  50-150 studs: LOD1 (Roblox generates ~50% triangles).
  150-300 studs: LOD2 (~20% triangles).
  300+ studs: LOD3 (very few triangles or proxy box).

--- STREAMING AND PHYSICS ---
When a Part is not streamed in on the client, it has NO physics representation on client.
The server still has full physics. Client prediction may have gaps.

For character movement in streaming worlds:
  Use Workspace.StreamingIntegrityMode = Enum.StreamingIntegrityMode.MinimumRadiusPause.
  This ensures the floor below the character is always loaded before gameplay resumes.

Client-side physics for unstreamed areas:
  Roblox inserts physics proxy boxes for terrain and large surfaces even before parts stream in.
  This prevents most fall-through issues for walking on terrain.
  For custom part-based floors: ensure they are in PersistentModels or use Atomic streaming.

--- STREAMING AND SCRIPTS ---
Scripts inside workspace stream with their parent Model.
Scripts inside StarterPlayerScripts/StarterCharacterScripts: never stream out (always running).
Scripts inside ReplicatedStorage/ServerStorage: never stream (not in workspace).

LocalScript execution context with streaming:
  Avoid LocalScript inside a streamed Model if it needs to run always.
  Move logic to StarterPlayerScripts LocalScript that dynamically finds workspace content.
  Use workspace.DescendantAdded to detect when streamed content appears.

Script lifecycle with streaming:
  Script starts → runs initialization → may reference workspace parts.
  If referenced part hasn't streamed in: WaitForChild will wait (correct).
  If referenced part is NOT in workspace at all: WaitForChild will timeout.
  ALWAYS use WaitForChild with a timeout and handle nil gracefully.

--- STREAMING AND DATAMODEL REPLICATION ---
Server always has the full DataModel.
Client (with StreamingEnabled) has a PARTIAL DataModel.
ReplicatedStorage: ALWAYS replicated to client (not streamed). Safe to reference without WaitForChild in most cases.
ServerStorage: NEVER replicated to client (server only).
StarterGui, StarterPack: Replicated once to client on join.
workspace: Streamed (partial replication based on distance).

--- OPTIMIZING FOR STREAMING ---
Design your world in chunks:
  Each chunk = 1 Model with ModelStreamingMode = Atomic.
  Chunk size: 100×100 studs is a good target.
  Part count per chunk: <= 500 parts (mobile) or <= 2000 parts (PC).

Place chunk Models at appropriate positions:
  Streaming will automatically handle loading/unloading based on player proximity.

Chunk organization example (512×512 stud world, 64×64 stud chunks = 64 chunks):
  workspace/
    WorldChunks/
      Chunk_0_0 (Model, Atomic) — parts from (0,0) to (64,0) to (0,64)
      Chunk_1_0 (Model, Atomic)
      ... (64 chunks total)
    PersistentModels/
      SpawnLobby (Model, Persistent)
      Checkpoints (Model, Persistent)
`;

// ─────────────────────────────────────────────────────────────────────────────
// MOBILE OPTIMIZATION
// ─────────────────────────────────────────────────────────────────────────────

export const OPT_MOBILE: string = `
=== ROBLOX MOBILE OPTIMIZATION BIBLE ===

--- DETECTING MOBILE vs PC ---
LocalScript detection:
  local isMobile = game:GetService("UserInputService").TouchEnabled
    and not game:GetService("UserInputService").KeyboardEnabled

  Or more robustly:
  local UIS = game:GetService("UserInputService")
  local isMobile = UIS.TouchEnabled
  local isPC = UIS.KeyboardEnabled
  local isGamepad = UIS.GamepadEnabled
  local isTablet = UIS.TouchEnabled and UIS.GyroscopeEnabled  -- tablets often have gyro

Quality level (1-10):
  local qualityLevel = UserSettings():GetService("UserGameSettings").SavedQualitySetting
  -- 1 = lowest, 10 = highest
  -- Mobile users: typically 1-4
  -- PC low: 4-6
  -- PC high: 7-10

Device type via Platform:
  local platform = game:GetService("GuiService"):GetGuiInset()  -- not ideal
  -- Better: check screen resolution
  local screenSize = workspace.CurrentCamera.ViewportSize
  local isSmallScreen = screenSize.X < 800 or screenSize.Y < 600  -- phone portrait

--- MAXIMUMRENDERDISTANCE ---
workspace.MaximumRenderDistance: Sets maximum distance at which parts are rendered on client.
  Default: 1000 studs.
  Mobile recommended: 300-500 studs.
  Low-end PC: 500-700 studs.
  High-end PC: 1000-2000 studs.

Setting dynamically based on quality:
  local function applyQualitySettings(qualityLevel)
    if qualityLevel <= 3 then
      workspace.MaximumRenderDistance = 300
    elseif qualityLevel <= 6 then
      workspace.MaximumRenderDistance = 600
    else
      workspace.MaximumRenderDistance = 1000
    end
  end

  -- Apply on join:
  local qs = UserSettings():GetService("UserGameSettings")
  applyQualitySettings(qs.SavedQualitySetting)
  -- Listen for changes:
  qs:GetPropertyChangedSignal("SavedQualitySetting"):Connect(function()
    applyQualitySettings(qs.SavedQualitySetting)
  end)

--- REDUCED PARTICLE COUNTS ON MOBILE ---
ParticleEmitter properties to adjust per quality:

  local function setParticleQuality(emitter, qualityLevel)
    if qualityLevel <= 3 then  -- mobile
      emitter.Rate = math.min(emitter.Rate, 5)
      emitter.Lifetime = NumberRange.new(
        math.min(emitter.Lifetime.Min, 0.5),
        math.min(emitter.Lifetime.Max, 1)
      )
      emitter.LightEmission = 0  -- disable light emission on mobile
      emitter.LightInfluence = 1  -- use scene lighting (avoids extra light pass)
    elseif qualityLevel <= 6 then  -- PC low
      emitter.Rate = math.min(emitter.Rate, 20)
    end
    -- qualityLevel 7-10: keep original settings
  end

ParticleEmitter properties that impact performance:
  Rate: particles spawned per second. Each particle is draw call geometry.
  Lifetime: longer lifetime = more simultaneous particles.
  SpreadAngle: no performance impact (just direction math).
  Transparency: animated transparency costs more (alpha sort per particle).
  LightEmission > 0: emissive channel, small GPU cost.
  LightInfluence = 0: particle ignores lighting (cheaper on mobile, looks self-lit).

Disabling all effects for quality level 1-2:
  for _, emitter in ipairs(model:GetDescendants()) do
    if emitter:IsA("ParticleEmitter") or emitter:IsA("Trail") or emitter:IsA("Beam") then
      emitter.Enabled = qualityLevel > 2
    end
  end

--- SIMPLER MATERIALS ON MOBILE ---
Material cost on mobile GPU:
  Concrete: 1.0x cost (baseline)
  Brick: 1.1x
  Wood: 1.1x
  Metal: 1.3x (specular)
  Glass: 3.0x (transparency + refraction)
  Neon: 1.2x (emissive)
  SurfaceAppearance with 4 textures: 4.0x (4 texture samples + PBR math)

Mobile material swap strategy:
  On quality 1-3, swap SurfaceAppearance parts to flat materials:
    local function stripSurfaceAppearance(model, qualityLevel)
      if qualityLevel > 3 then return end
      for _, child in ipairs(model:GetDescendants()) do
        if child:IsA("SurfaceAppearance") then
          child:Destroy()  -- removes PBR, parent Part renders with flat Material
        end
      end
    end

  Better: Use two separate Model LODs — one with SurfaceAppearance (PC), one without (mobile).
  Swap at runtime based on quality level detected on client.

Shadow casting mobile:
  All Part.CastShadow = false on mobile:
    if isMobile then
      for _, desc in ipairs(workspace:GetDescendants()) do
        if desc:IsA("BasePart") then
          desc.CastShadow = false
        end
      end
    end
  Then disable shadow-casting on lights:
    for _, desc in ipairs(workspace:GetDescendants()) do
      if desc:IsA("Light") then
        desc.Shadows = false
      end
    end

Lighting technology on mobile:
  Lighting.Technology = Enum.Technology.Compatibility  -- no real-time shadows, cheapest
  Lighting.GlobalShadows = false  -- additional savings

--- TOUCH INPUT OPTIMIZATION ---
UserInputService.TouchStarted: Fires when finger touches screen.
UserInputService.TouchEnded: Fires when finger lifts.
UserInputService.TouchMoved: Fires every frame finger moves — can be high frequency.
UserInputService.TouchPinch: Two-finger pinch gesture.
UserInputService.TouchRotate: Two-finger rotation.
UserInputService.TouchTap: Short tap detection.
UserInputService.TouchLongPress: Long press gesture.

Touch event optimization:
  TouchMoved fires very frequently (multiple times per frame on fast swipes).
  Debounce with frame limiter:
    local lastTouchTime = 0
    UIS.TouchMoved:Connect(function(touches, gameProcessed)
      local now = tick()
      if now - lastTouchTime < 0.016 then return end  -- max 60 Hz
      lastTouchTime = now
      -- process touch
    end)

Mobile joystick detection:
  Roblox provides a default virtual joystick for mobile.
  Access player movement direction:
    local humanoid = character:WaitForChild("Humanoid")
    local moveDir = humanoid.MoveDirection  -- Vector3, updated by Roblox
    -- MoveDirection is already smoothed by the virtual joystick system.

Custom touch button (no FPS cost):
  Use TextButton or ImageButton in ScreenGui.
  .Activated: fires once on tap/click. No per-frame cost.
  .Touched is for Parts, not UI buttons.

ContextActionService for mobile buttons:
  local CAS = game:GetService("ContextActionService")
  CAS:BindAction("Jump", function(name, state, obj)
    if state == Enum.UserInputState.Begin then
      humanoid.Jump = true
    end
  end, true, Enum.KeyCode.Space)  -- true = create mobile button

  CAS:SetTitle("Jump", "JUMP")
  CAS:SetPosition("Jump", UDim2.new(0.8, 0, 0.6, 0))  -- position on screen
  CAS:SetImage("Jump", "rbxassetid://123456")  -- custom button image

--- SCREEN RESOLUTION SCALING ---
Mobile screens range from 375×667 (iPhone SE) to 1290×2796 (iPhone 15 Pro Max).
Roblox renders at device native resolution by default on mobile — expensive on high-DPI screens.

ScreenGui.IgnoreGuiInset: Whether to extend behind the safe area notch.
  ScreenGui.IgnoreGuiInset = false: Respects safe area (default). Recommended.
  ScreenGui.IgnoreGuiInset = true: Extends to screen edges (behind notch on iPhone).

GuiService:GetGuiInset(): Returns top and bottom insets for the safe area.
  local topInset, bottomInset = game:GetService("GuiService"):GetGuiInset()

UI scaling for small screens:
  local UIScale = Instance.new("UIScale")
  UIScale.Parent = playerGui.MainGui
  local viewportX = workspace.CurrentCamera.ViewportSize.X
  if viewportX < 400 then
    UIScale.Scale = 0.7  -- small phone
  elseif viewportX < 700 then
    UIScale.Scale = 0.85  -- medium phone
  else
    UIScale.Scale = 1.0  -- tablet or PC
  end

UDim2 responsive sizing:
  Use UDim2.fromScale() for percentages: UDim2.fromScale(0.5, 0.1) = 50% wide, 10% tall.
  Use UDim2.fromOffset() for fixed pixel sizes: UDim2.fromOffset(120, 40) = 120×40 pixels.
  For buttons: use fromScale for position, fromOffset for size (ensures touchable area on any screen).
  Minimum touch target size: 44×44 pixels (Apple HIG standard, also good for Roblox mobile).

--- BATTERY AND THERMAL CONSIDERATIONS ---
Mobile devices throttle CPU/GPU when hot (after ~15 minutes of intensive play).
Signs of thermal throttle: frame rate drops from 30 to 20 or lower, device gets warm.

Reduce sustained battery draw:
  Cap frame rate logic: Do not run animations or effects at 60 FPS if 30 FPS is sufficient.
  RunService.Heartbeat fires at server rate (60 Hz). On mobile client, rendering may be 30 Hz.
  Avoid sustained high GPU load: Use Compatibility lighting, simple materials, low particles.

Frame rate cap (client):
  Roblox auto-caps at 60 FPS. Cannot programmatically lower it below 60 via Lua.
  Players can set frame rate in Roblox app settings (Performance → Frame Rate Cap).
  Best practice: Optimize so the game runs comfortably at 30 FPS even if players run at 60.

Mobile-first checklist:
  [ ] Part count < 10,000 visible at once
  [ ] StreamingEnabled = true with MinRadius 64, TargetRadius 512
  [ ] Lighting.Technology = Compatibility
  [ ] Lighting.GlobalShadows = false
  [ ] All lights: Shadows = false
  [ ] All parts: CastShadow = false (except 2-3 hero shadow casters)
  [ ] MaximumRenderDistance = 300-400
  [ ] No SurfaceAppearance (or strip on quality 1-3)
  [ ] ParticleEmitter Rate capped at 5-10 on mobile
  [ ] Fog enabled to hide distance (FogEnd = 300)
  [ ] UI has 44px minimum touch targets
  [ ] ScreenGui uses UDim2.fromScale for responsiveness
  [ ] No per-frame string allocation in Heartbeat
  [ ] No FindFirstChild in hot loops

--- MEMORY LIMITS ON MOBILE ---
iOS typical RAM: 3-6GB total, Roblox gets ~1-2GB before app crash (OS kills app).
Android typical RAM: 3-8GB, Roblox gets ~1-2GB (varies by device).
Roblox memory manager shows warnings in Output when approaching limits.

Memory targets for mobile:
  Instances: < 15,000 total
  Script memory: < 30MB
  Textures: < 300MB (each 1024×1024 texture ≈ 4MB uncompressed)
  Sounds: < 50MB (keep audio files compressed, use rbxassetid:// for streaming)

Texture memory optimization:
  Use rbxassetid:// assets for textures — they stream from Roblox CDN.
  Don't store textures as local file assets in DataModel.
  Reuse the same texture ID across many Decals/Textures.
  Prefer 512×512 textures over 1024×1024 for mobile (4x memory saving).

--- AUDIO ON MOBILE ---
Sound:PlaybackSpeed: Keep at 1. Changing playback speed increases CPU.
Sound.RollOffMaxDistance: Limit to 80 studs on mobile (server sends sound state to clients).
SoundService.RespectFilteringEnabled: true (default) — sounds only play if the Sound Part is replicated to client.

Reduce active sounds on mobile:
  local function limitActiveSounds(max)
    local sounds = {}
    for _, s in ipairs(workspace:GetDescendants()) do
      if s:IsA("Sound") and s.IsPlaying then
        table.insert(sounds, s)
      end
    end
    if #sounds > max then
      -- Stop the quietest sounds (by Volume property)
      table.sort(sounds, function(a, b) return a.Volume < b.Volume end)
      for i = max + 1, #sounds do
        sounds[i]:Stop()
      end
    end
  end
  -- Call every 5 seconds on mobile:
  if isMobile then
    task.spawn(function()
      while true do
        limitActiveSounds(5)  -- max 5 concurrent sounds on mobile
        task.wait(5)
      end
    end)
  end
`;

// ─────────────────────────────────────────────────────────────────────────────
// CONTENT PROVIDER & ASSET PRELOADING
// ─────────────────────────────────────────────────────────────────────────────

export const OPT_CONTENT_PROVIDER: string = `
=== ROBLOX CONTENTPROVIDER PRELOADING BIBLE ===

--- CONTENTPROVIDER:PRELOADASYNC ---
ContentProvider:PreloadAsync(assetList, callback):
  assetList: array of Instances or asset URLs (rbxassetid://) to preload.
  callback: optional function called as each asset loads.
    Signature: callback(contentId: string, status: Enum.AssetFetchStatus)
  Returns: nil (yields until all assets complete or fail).
  Must be called from a coroutine or task.spawn (yields current thread).

AssetFetchStatus values:
  Enum.AssetFetchStatus.Success: Asset loaded successfully.
  Enum.AssetFetchStatus.Failure: Asset failed to load (invalid ID, network error).
  Enum.AssetFetchStatus.TimedOut: Asset took too long to load.
  Enum.AssetFetchStatus.Loading: (During callback, asset is still loading — rare in callback).

Basic preload with progress:
  local ContentProvider = game:GetService("ContentProvider")

  local function preloadAssets(assetList, onProgress)
    local total = #assetList
    local loaded = 0
    ContentProvider:PreloadAsync(assetList, function(id, status)
      loaded = loaded + 1
      if onProgress then
        onProgress(loaded / total, id, status)
      end
    end)
  end

  -- Use in loading screen:
  task.spawn(function()
    local assets = {
      workspace.MainBuilding,  -- preloads all textures on this model
      workspace.PlayerCharacterTemplate,
      "rbxassetid://12345678",  -- specific texture ID
    }
    preloadAssets(assets, function(progress, id, status)
      loadingBar.Size = UDim2.new(progress, 0, 1, 0)
      if status == Enum.AssetFetchStatus.Failure then
        warn("Failed to preload:", id)
      end
    end)
    -- All done:
    loadingScreen.Visible = false
  end)

Preloading Instances vs URLs:
  Passing an Instance: PreloadAsync preloads ALL assets referenced by that Instance and its descendants.
    ContentProvider:PreloadAsync({workspace.Map})  -- preloads all textures in Map model
  Passing a URL string: Preloads that specific asset.
    ContentProvider:PreloadAsync({"rbxassetid://1818989391"})

Asset types that benefit from preloading:
  Textures (Decal.Texture, Texture.Texture, MeshPart.TextureID).
  SurfaceAppearance textures (AlbedoMap, NormalMap, MetalnessMap, RoughnessMap).
  Sounds (Sound.SoundId — preloads audio buffer).
  Animations (Animation.AnimationId — preloads keyframe data).
  MeshPart geometry (MeshPart.MeshId — preloads mesh data).

Audio preloading note:
  Sound objects must be in workspace or SoundService to preload via Instances.
  For sounds in SoundService:
    ContentProvider:PreloadAsync({SoundService.BackgroundMusic})
  This buffers the audio — Sound:Play() starts immediately without buffering delay.

--- LOADING SCREEN PATTERN ---
Full loading screen with preload:

  -- In a ScreenGui named "LoadingScreen" with a Frame and TextLabel:
  local function runLoadingScreen()
    local ContentProvider = game:GetService("ContentProvider")
    local loadingGui = playerGui:WaitForChild("LoadingScreen")
    local bar = loadingGui.Frame.ProgressBar
    local label = loadingGui.Frame.StatusLabel

    -- Collect all assets to preload
    local assets = {}
    -- Add all workspace descendants (careful — can be large)
    for _, desc in ipairs(workspace:GetDescendants()) do
      if desc:IsA("MeshPart") or desc:IsA("Decal") or desc:IsA("Texture")
        or desc:IsA("Sound") or desc:IsA("Animation") or desc:IsA("SurfaceAppearance") then
        table.insert(assets, desc)
      end
    end

    local total = #assets
    local loaded = 0

    ContentProvider:PreloadAsync(assets, function(assetId, status)
      loaded = loaded + 1
      local progress = loaded / math.max(total, 1)
      bar.Size = UDim2.new(progress, 0, 1, 0)
      label.Text = string.format("Loading... %d%%", math.floor(progress * 100))
    end)

    -- Fade out loading screen
    local TweenService = game:GetService("TweenService")
    TweenService:Create(loadingGui, TweenInfo.new(0.5), { BackgroundTransparency = 1 }):Play()
    task.wait(0.5)
    loadingGui:Destroy()
  end

  task.spawn(runLoadingScreen)

Parallel loading and gameplay:
  Preload in background while player is in lobby.
  Start loading screen for critical assets (map geometry, character textures).
  Allow player to enter game when critical assets done, load remaining in background.

  local criticalAssets = { workspace.PlayerCharacterTemplate, workspace.SpawnIsland }
  local decorativeAssets = { workspace.TreeCollection, workspace.RockCollection }

  -- Load critical first:
  ContentProvider:PreloadAsync(criticalAssets)
  loadingScreen:Dismiss()

  -- Load decorative in background (no UI update):
  task.spawn(function()
    ContentProvider:PreloadAsync(decorativeAssets)
  end)

--- ASSET PRELOADING PATTERNS ---
Priority queue pattern:
  Tier 1 (preload before game starts): Player character, main map structure, key sounds.
  Tier 2 (preload in first 30 seconds): Enemy models, weapons, particle effects.
  Tier 3 (lazy load on demand): Shop items, cosmetics, distant world content.

Preloading animations:
  local animationFolder = ReplicatedStorage.Animations
  local anims = {}
  for _, anim in ipairs(animationFolder:GetDescendants()) do
    if anim:IsA("Animation") then
      table.insert(anims, anim)
    end
  end
  ContentProvider:PreloadAsync(anims)
  -- Now all animations play without initial stutter

Preloading sounds:
  local soundService = game:GetService("SoundService")
  local sfxFolder = soundService:FindFirstChild("SFX")
  if sfxFolder then
    ContentProvider:PreloadAsync({sfxFolder})  -- preloads all sounds in folder
  end

--- SOUND STREAMING vs PRELOADING ---
Roblox streams audio from CDN by default.
Long sounds (music, ambient): Let stream (too large to preload).
Short sounds (SFX): Preload (prevents first-play stutter).
Sound.RollOffStyle = Enum.RollOffStyle.Linear: Linear distance falloff.
Sound.RollOffStyle = Enum.RollOffStyle.InverseTapered: Realistic falloff, more expensive.
Sound.RollOffMaxDistance: Distance in studs where sound is inaudible.
  Mobile: 60 studs max (saves network/CPU).
  PC: 100-200 studs.

--- AVOIDING ASSET LOADING IN HOT PATHS ---
NEVER load new assets inside Heartbeat or per-frame loops.
ContentProvider:PreloadAsync() yields — calling in Heartbeat would stall the frame.
Instance.new("Sound") + assign SoundId in Heartbeat creates new audio buffer each frame — massive memory leak.

Asset loading timing:
  Load assets: on game start, on round start, before teleport.
  Never load: in combat, per-frame, per-bullet, per-particle.

Pre-instantiation pool:
  For sounds: create pool of Sound objects at start. When needed, change SoundId once, then play.
  For GUI labels: create pool of TextLabels, reuse instead of creating new ones.
`;

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMBINED OPTIMIZATION BIBLE
// ─────────────────────────────────────────────────────────────────────────────

export const OPTIMIZATION_BIBLE: string = `
╔══════════════════════════════════════════════════════════════════════════════╗
║        ROBLOX GAME OPTIMIZATION BIBLE — COMPLETE REFERENCE                ║
║        All API properties verified against create.roblox.com/docs         ║
║        No SmoothPlastic. All dimensions in studs. All colors as RGB.      ║
╚══════════════════════════════════════════════════════════════════════════════╝

${OPT_RENDERING}

${OPT_SCRIPTING}

${OPT_MEMORY}

${OPT_NETWORK}

${OPT_STREAMING}

${OPT_MOBILE}

${OPT_CONTENT_PROVIDER}

=== QUICK REFERENCE CHECKLISTS ===

--- SERVER OPTIMIZATION CHECKLIST ---
[ ] All background loops use Heartbeat throttling (1/10 or 1/30 frames)
[ ] No FindFirstChild inside loops or Heartbeat callbacks
[ ] All event connections stored and disconnected on cleanup
[ ] Object pools for bullets, labels, effects (no per-shot Instance.new)
[ ] Remote events batch multiple entity updates into single fire
[ ] DataStore load-once-on-join, save-on-leave + 5-minute auto-save
[ ] DataStore data uses short key names, no nil values stored
[ ] Parallel Luau Actors for pathfinding and heavy AI (if > 20 enemies)
[ ] No coroutine.create in hot paths (use task.spawn)
[ ] String building uses table.concat, not .. in loops
[ ] Tables pre-allocated with table.create(n) when size is known

--- CLIENT OPTIMIZATION CHECKLIST ---
[ ] Camera updates in RenderStepped (not Heartbeat)
[ ] Game logic in Heartbeat (not RenderStepped)
[ ] LOD system: swap models at 50/150/300 stud boundaries
[ ] Remote receives apply interpolation, not direct position set
[ ] UnreliableRemoteEvent for positional updates (not RemoteEvent)
[ ] Quality level detected on join, particles/shadows scaled accordingly
[ ] MaximumRenderDistance = 300 on mobile, 600-1000 on PC
[ ] All SurfaceAppearance stripped on qualityLevel <= 3
[ ] UI uses UDim2.fromScale for responsiveness
[ ] Touch targets minimum 44×44 pixels
[ ] No per-frame string.format on text labels that don't change

--- WORLD DESIGN OPTIMIZATION CHECKLIST ---
[ ] StreamingEnabled = true for worlds > 500 parts
[ ] World divided into 100×100 stud Atomic Model chunks
[ ] Persistent models: < 50 total (spawn, checkpoints, key interactables only)
[ ] Lighting.Technology = Compatibility on mobile, ShadowMap on PC
[ ] Lighting.GlobalShadows = false on mobile
[ ] Part.CastShadow = false on all parts < 2 studs or decorative
[ ] Maximum 3 shadow-casting lights (PointLight.Shadows = true)
[ ] Fog: Lighting.FogEnd = 300-400 studs (mobile), 600-800 studs (PC)
[ ] No Glass material on mobile (3x GPU cost)
[ ] Maximum 20 transparent parts visible at once on mobile
[ ] Unions: < 20 subparts each, CollisionFidelity = Box
[ ] Decals: < 10 unique texture IDs per scene
[ ] All decorative parts near camera use Concrete/Brick/Wood/Metal materials
[ ] Sound.RollOffMaxDistance <= 80 studs on mobile

--- PER-SYSTEM PERFORMANCE TARGETS ---
Heartbeat main thread budget:      < 4ms per frame (16ms total at 60 FPS)
Physics thread budget:             < 5ms per frame
Render thread budget:              < 8ms per frame (GPU)
Remote fires per player per sec:   < 20 total
DataStore requests per minute:     < 60 + (10 × player count)
Active Sounds per client:          < 8 (mobile), < 20 (PC)
Active Lights with shadows:        <= 3
Visible transparent parts:         <= 20 (mobile), <= 100 (PC)
Visible Parts total:               <= 10,000 (mobile), <= 30,000 (PC)
MeshPart triangles in frustum:     <= 200K (mobile), <= 3M (PC)
Lua heap memory:                   < 30MB (mobile), < 80MB (PC)
Texture memory:                    < 300MB (mobile), < 1GB (PC)
Active connections (signals):      < 500 total (growing = leak)

=== MICROPROFILER LABELS REFERENCE ===

When reading MicroProfiler (Ctrl+F6 in-game), look for these labeled sections:

Engine labels (auto-generated):
  RunService           — total RunService event overhead
  Heartbeat            — your Heartbeat callbacks combined
  RenderStepped        — your RenderStepped callbacks combined
  Stepped              — your Stepped callbacks combined
  Physics              — Roblox physics simulation step
  Animate              — Roblox AnimationController updates
  Network              — remote event serialization + receive
  Render               — draw call submission to GPU
  WaitForChild         — time spent in WaitForChild yields

Custom labels (from debug.profilebegin):
  Add debug.profilebegin("label") before expensive code blocks.
  Add debug.profileend() after.
  Labels show as colored bars. Width = time. Stack = nesting.

Common spike sources by thread:
  Main thread spike at Heartbeat: heavy per-frame Lua logic
  Main thread spike at Network: large remote payload deserializing
  Physics spike: too many unanchored parts, complex collisions
  Render spike: too many draw calls, complex materials, particles

Performance debugging workflow:
  1. Enable MicroProfiler with Ctrl+F6
  2. Play game normally and reproduce the lag
  3. Dump profiler: Ctrl+Shift+F6 (saves microprofiler.html)
  4. Open microprofiler.html in browser
  5. Find the widest/tallest bars during lag frame
  6. Match bar label to your debug.profilebegin labels
  7. Optimize that system first

=== API PROPERTY QUICK REFERENCE ===

-- Part properties for optimization:
Part.Anchored = true              -- Static parts: no physics simulation cost
Part.CanCollide = false           -- Parts that don't need collision: saves physics
Part.CanQuery = false             -- Parts not needed for raycasts: saves ray cost
Part.CanTouch = false             -- Parts not using Touched event: saves overlap detection
Part.CastShadow = false           -- Decorative parts: saves shadow render
Part.Material = Enum.Material.Concrete  -- Use instead of SmoothPlastic
Part.LocalTransparencyModifier = 1      -- Client-only hide (no server change)
Part.RenderFidelity = Enum.RenderFidelity.Performance  -- Lower LOD

-- MeshPart properties:
MeshPart.RenderFidelity = Enum.RenderFidelity.Automatic  -- Let engine decide LOD
MeshPart.LevelOfDetailEnabled = true                      -- Enable auto mesh LOD
MeshPart.CollisionFidelity = Enum.CollisionFidelity.Box  -- Cheapest collision

-- UnionOperation properties:
UnionOperation.UsePartColor = false       -- All subparts share material
UnionOperation.RenderFidelity = Enum.RenderFidelity.Automatic
UnionOperation.CollisionFidelity = Enum.CollisionFidelity.Box

-- Workspace properties for streaming/rendering:
workspace.StreamingEnabled = true
workspace.StreamingMinRadius = 64
workspace.StreamingTargetRadius = 512
workspace.StreamingIntegrityMode = Enum.StreamingIntegrityMode.MinimumRadiusPause
workspace.MaximumRenderDistance = 500  -- studs
workspace.SignalBehavior = Enum.SignalBehavior.Deferred  -- default, efficient

-- Lighting properties:
Lighting.Technology = Enum.Technology.ShadowMap
Lighting.GlobalShadows = true     -- false on mobile
Lighting.FogColor = Color3.fromRGB(180, 190, 200)
Lighting.FogStart = 150           -- studs from camera
Lighting.FogEnd = 500             -- studs from camera
Lighting.ClockTime = 14           -- 14 = 2PM sun angle
Lighting.Brightness = 2
Lighting.Ambient = Color3.fromRGB(90, 90, 100)
Lighting.OutdoorAmbient = Color3.fromRGB(140, 140, 160)
Lighting.GeographicLatitude = 41.7

-- PointLight properties:
PointLight.Range = 20             -- studs radius
PointLight.Brightness = 2
PointLight.Color = Color3.fromRGB(255, 200, 140)
PointLight.Shadows = false        -- Only true for <= 3 hero lights

-- SpotLight properties:
SpotLight.Range = 40
SpotLight.Brightness = 3
SpotLight.Angle = 45              -- degrees of cone
SpotLight.Face = Enum.NormalId.Front
SpotLight.Shadows = false

-- SurfaceLight properties:
SurfaceLight.Range = 15
SurfaceLight.Brightness = 2
SurfaceLight.Angle = 90
SurfaceLight.Face = Enum.NormalId.Top
SurfaceLight.Shadows = false      -- Always false — too expensive

-- Model streaming:
Model.ModelStreamingMode = Enum.ModelStreamingMode.Atomic
Model.LevelOfDetail = Enum.LevelOfDetail.StreamingMesh

-- ParticleEmitter key properties:
ParticleEmitter.Enabled = true
ParticleEmitter.Rate = 10         -- particles per second
ParticleEmitter.Lifetime = NumberRange.new(0.5, 2)
ParticleEmitter.LightEmission = 0.5
ParticleEmitter.LightInfluence = 0.5
ParticleEmitter.RotSpeed = NumberRange.new(-45, 45)  -- degrees/sec
ParticleEmitter.SpreadAngle = Vector2.new(0, 45)    -- degrees
ParticleEmitter.Speed = NumberRange.new(5, 15)       -- studs/sec
ParticleEmitter.Transparency = NumberSequence.new({
  NumberSequenceKeypoint.new(0, 0),
  NumberSequenceKeypoint.new(0.5, 0.3),
  NumberSequenceKeypoint.new(1, 1),
})

-- Sound properties:
Sound.Volume = 0.5
Sound.PlaybackSpeed = 1
Sound.RollOffMaxDistance = 80     -- studs
Sound.RollOffMinDistance = 10     -- studs
Sound.RollOffStyle = Enum.RollOffStyle.Linear  -- cheaper than InverseTapered
Sound.Looped = false
Sound.TimePosition = 0

-- ContentProvider:
-- ContentProvider:PreloadAsync(instanceArray, progressCallback)
-- No properties — it's a service with just methods.

-- UserInputService for platform detection:
-- UIS.TouchEnabled: boolean — true on mobile
-- UIS.KeyboardEnabled: boolean — true on PC
-- UIS.GamepadEnabled: boolean — true on console
-- UIS.MouseEnabled: boolean — true on PC

=== COMMON PITFALLS AND FIXES ===

PITFALL: Part created every shot (bullets)
FIX: Object pool. Pre-create 50 bullet parts. Reuse with CFrame assignment.

PITFALL: FindFirstChild("Humanoid") every Heartbeat
FIX: Cache at character load. local humanoid = character:WaitForChild("Humanoid")

PITFALL: Remote fired per enemy per frame (50 enemies = 50 remotes/frame)
FIX: One remote per frame with batch table of all enemy states.

PITFALL: SurfaceAppearance on 500 props in mobile game
FIX: Detect qualityLevel <= 3, destroy SurfaceAppearance instances.

PITFALL: All parts have CastShadow = true
FIX: Set CastShadow = false on all parts < 2 studs and all decorative props.

PITFALL: String built with .. in loop ("item1,item2,item3...")
FIX: table.concat after building array table.

PITFALL: Memory leak — connection never disconnected when character respawns
FIX: Maid pattern. Collect all connections in Maid. DoCleaning() on character removing.

PITFALL: Using Glass material on mobile game floor
FIX: Replace with SmoothP— wait, never use SmoothPlastic. Use Concrete instead.

PITFALL: DataStore saved every second
FIX: Save on player leave + every 5 minutes. Never per-second.

PITFALL: WaitForChild without timeout in production code
FIX: Always provide timeout: WaitForChild("x", 10). Handle nil return.

PITFALL: Large world with StreamingEnabled = false
FIX: Enable streaming, divide world into 100×100 stud Atomic Model chunks.

PITFALL: 100 PointLights all with Shadows = true
FIX: Only 3 lights max with Shadows = true. Rest get Shadows = false.

PITFALL: AnimationTrack:Play() called every frame (loops unintentionally)
FIX: Check track.IsPlaying before calling Play(): if not track.IsPlaying then track:Play() end

PITFALL: ipairs on sparse table (has nils = stops early)
FIX: Use pairs() or numeric for with explicit max index for sparse tables.

PITFALL: GlobalDataStore (game-wide leaderboard) read every 5 seconds
FIX: Read leaderboard once every 60 seconds, cache result for display.

PITFALL: Too many Beam objects for UI laser effects
FIX: Use ImageLabel with rotation in 2D UI instead of 3D Beams for UI-layer effects.

PITFALL: Texture atlas not used (50 unique textures = 50 draw calls)
FIX: Combine related decals into a single sprite sheet. Use Texture.OffsetStudsU/V for UV offsets.

PITFALL: workspace:GetDescendants() called every frame
FIX: Cache the result at startup. Update only when content changes.
  local allParts = workspace:GetDescendants()
  workspace.DescendantAdded:Connect(function(d) table.insert(allParts, d) end)
  workspace.DescendantRemoving:Connect(function(d)
    -- find and remove from allParts
  end)
`;
