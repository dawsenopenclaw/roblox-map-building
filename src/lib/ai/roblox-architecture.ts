// =============================================================================
// Roblox Game Architecture Knowledge Base
// Injected into AI prompts to teach comprehensive Roblox game development
// =============================================================================

// ---------------------------------------------------------------------------
// CORE ARCHITECTURE — Services, Replication, DataStores, Parts, Scale, Lighting
// ---------------------------------------------------------------------------
const CORE_ARCHITECTURE = `
## Roblox Core Architecture

### Service Hierarchy (Explorer Tree)
Every Roblox game has these services. Know what goes where — misplacement causes bugs, exploits, or broken replication.

**Workspace** — The 3D world. Every Part, Model, Terrain visible to players lives here.
- Organize into Folders: Map/, NPCs/, Effects/, Interactables/, SpawnLocations/
- NEVER put Scripts here in production — exploiters can read client-visible scripts
- Parts: Anchored=true for static builds. Unanchored ONLY for physics objects (dropped items, ragdolls, projectiles)
- Models: group related parts. ALWAYS set PrimaryPart to the base/root part. Use Model:PivotTo() for positioning, Model:GetBoundingBox() for size
- Terrain: voxel-based. workspace.Terrain:FillRegion(), WriteVoxels(), FillBall(), FillBlock(). Materials: Grass, Sand, Rock, Water, Snow, Mud, Ice, Slate, Limestone, Asphalt, Cobblestone, Brick, Concrete, Sandstone, WoodPlanks, LeafyGrass, Ground, Glacier, Salt, CrackedLava
- Camera: workspace.CurrentCamera. CameraType, CFrame, FieldOfView. In build mode, use cam.CFrame for placement reference
- Gravity: workspace.Gravity (default 196.2). Lower for moon/space (50-80), higher for heavy feel (250+)
- StreamingEnabled: workspace.StreamingEnabled for large maps. StreamingMinRadius, StreamingTargetRadius control load distance

**ServerScriptService** — Server-only scripts. Clients CANNOT see or access.
- ALL game logic goes here: damage, currency, data saving, spawning, anti-cheat, round management
- One Script per system: DataManager, CombatManager, EconomyManager, RoundManager, ShopManager, NPCManager
- ModuleScripts here for shared server utilities (database helpers, math utils, config tables)
- NEVER access client APIs here: no LocalPlayer, no UserInputService, no PlayerGui, no Mouse, no Camera

**ServerStorage** — Server-only storage. Invisible to clients.
- Store templates: enemy models, weapon models, item models, map chunks, furniture
- Clone pattern: local sword = ServerStorage.Templates.Sword:Clone(); sword.Parent = workspace
- Store secret data: admin lists, loot tables with drop weights, economy config, spawn tables
- NEVER put Scripts here — they won't execute. Only storage.

**ReplicatedStorage** — Shared between server AND client. Both can read.
- RemoteEvents/RemoteFunctions MUST go here (both sides need access)
- Folder structure: Remotes/, Modules/, Assets/, Configs/
- SharedModules (ModuleScripts both sides require()):
  - ItemData: {name, icon, price, rarity, stats, description} for every item
  - GameConfig: {maxPlayers, roundTime, spawnDelay, walkSpeed, jumpPower}
  - Enums: custom enum tables — Rarity = {Common=1, Uncommon=2, Rare=3, Epic=4, Legendary=5}
  - TypeDefs: type definitions for data structures
- Assets both sides need: particle emitter configs, sound IDs, animation IDs

**StarterGui** — Contents cloned to player.PlayerGui on join/respawn.
- Each child: ScreenGui with LocalScript child, or LocalScript that creates ScreenGui
- ResetOnSpawn = false for persistent GUIs (HUD, inventory, settings, chat)
- ResetOnSpawn = true for GUIs that reset (round timer, death screen, temporary prompts)
- ScreenGui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling (modern standard)
- ScreenGui.IgnoreGuiInset = true for fullscreen effects (loading screens, overlays)
- DisplayOrder controls layering: HUD=1, Menus=5, Modals=10, Loading=100

**StarterPlayer** — Player configuration and per-player scripts.
- StarterPlayerScripts/: LocalScripts that run once, persist across respawns
  - Camera controllers, input managers, sound managers, effect managers, UI controllers
- StarterCharacterScripts/: LocalScripts that run per character life, reset on death
  - Sprint system, dash, double jump, animation overrides, footstep sounds
- Properties: CameraMode, CameraMaxZoomDistance, CameraMinZoomDistance, HealthDisplayDistance, NameDisplayDistance, CharacterWalkSpeed, CharacterJumpPower

**Lighting** — Visual atmosphere. NO scripts.
- ClockTime (0-24), Brightness (0-10), Ambient Color3, OutdoorAmbient Color3
- FogEnd (distance), FogStart, FogColor
- Technology: ShadowMap (best visuals), Voxel (performance), Future (PBR)
- Child effects: Atmosphere, Sky, BloomEffect, ColorCorrectionEffect, DepthOfFieldEffect, SunRaysEffect
- Atmosphere: Density (0-1), Offset (0-1), Color, Haze (0-10), Glare (0-10), Decay Color3
- Presets:
  - Bright day: ClockTime=14, Brightness=2, Ambient=rgb(140,140,140)
  - Sunset: ClockTime=18, Brightness=1.5, Ambient=rgb(180,120,80), warm ColorCorrection
  - Night: ClockTime=0, Brightness=0.5, Ambient=rgb(30,30,50), FogEnd=300
  - Horror: ClockTime=0, Brightness=0.2, Ambient=rgb(10,10,20), FogEnd=100, heavy Bloom
  - Sci-fi: ClockTime=14, Brightness=3, Ambient=rgb(100,150,200), blue ColorCorrection
  - Underwater: ClockTime=12, Brightness=0.8, FogEnd=80, FogColor=rgb(0,80,120), Atmosphere Density=0.8

**SoundService** — Global audio config.
- AmbientReverb for environment type (Room, Hall, Cave, Arena, Forest)
- SoundGroups for volume categories: Music, SFX, Ambient, UI, Voice
- RespectFilteringEnabled = true (default, required)

**Teams** — Team-based games only.
- Each Team: Name, TeamColor (BrickColor), AutoAssignable
- SpawnLocations with matching TeamColor force team spawns
- player.Team, player.TeamColor for checking. Team.PlayerAdded/PlayerRemoved events

**ReplicatedFirst** — Loads BEFORE everything else.
- ONLY for loading screens. LocalScript shows ScreenGui, calls ContentProvider:PreloadAsync(assets), removes when done
- NEVER put game logic here

**TextChatService** — Modern chat system.
- Custom commands via OnIncomingMessage callback
- TextChannel instances for channels
- TextChatMessageProperties for styling

### Replication & Networking
- Server to one client: RemoteEvent:FireClient(player, data)
- Server to all clients: RemoteEvent:FireAllClients(data)
- Client to server: RemoteEvent:FireServer(data)
- Request-response: RemoteFunction:InvokeServer(args) returns value
- NEVER use RemoteFunction:InvokeClient() — hangs server if client disconnects
- VALIDATE EVERYTHING server-side: type checks, range checks, cooldowns, ownership checks
- Anti-exploit: server tracks lastActionTime per player, rejects if too fast
- Rate limiting: max N requests per second per player per remote
- Payload size: keep under 1KB per fire. Never send full tables when an ID suffices

### DataStore Patterns
- DataStoreService:GetDataStore("PlayerData_v1") — version in name for migrations
- Key: "player_" .. tostring(userId)
- ALWAYS pcall: local ok, data = pcall(function() return store:GetAsync(key) end)
- Save triggers: PlayerRemoving, auto-save every 60-120s, BindToClose for server shutdown
- UpdateAsync for atomic operations (currency changes, inventory adds)
- Session locking: store {data=..., sessionLock=jobId, lockTime=os.time()}
  - On join: check if locked by another server. If lock < 10 min old, reject or wait.
  - On leave: clear lock
- Data versioning: {version=2, coins=100, inventory={...}}
  - On load: if data.version < CURRENT_VERSION then migrateData(data) end
- Retry: if pcall fails, wait(6), retry up to 3 times
- Rate limits: 60 + numPlayers*10 requests/min. Cache aggressively in-memory.
- OrderedDataStore for leaderboards: SetAsync(key, score), GetSortedAsync(ascending, pageSize)
- MemoryStoreService for temporary cross-server data (lobbies, matchmaking, global events)

### Part Properties
- Position: Vector3 center in world space
- CFrame: position + rotation. CFrame.new(pos) * CFrame.Angles(rx,ry,rz)
- Size: Vector3 in studs. Min 0.05, Max 2048
- Anchored: true=static, false=physics
- CanCollide: true=solid, false=walkthrough
- CanQuery: true=raycasts hit it, false=raycasts pass through
- Transparency: 0=opaque, 1=invisible. 0.5=glass-like
- Material: Enum.Material — Wood, Brick, Metal, Glass, Concrete, SmoothPlastic, Neon, Foil, DiamondPlate, Marble, Granite, Slate, Sand, Fabric, Ice, Pebble, ForceField, CorrodedMetal, Cobblestone
- Color: Color3.fromRGB(r,g,b). NEVER BrickColor for new builds
- CastShadow: disable on small/unimportant parts for performance
- CollisionFidelity: Box (fastest), Hull, Default (accurate)
- Shape: Block, Ball, Cylinder, Wedge, CornerWedge
- Massless: true for parts welded to characters (accessories, tools)

### Scale Reference
- Character: 5.5 studs tall, 2 studs wide, 1 stud deep
- Door: 4w x 7.5h x 0.5d (character clearance with headroom)
- Ceiling: 11-12 studs (comfortable), 8-9 (cramped), 15+ (grand hall), 20+ (cathedral)
- Wall thickness: 0.5-1.0 studs. Below 0.3 looks paper-thin
- Street: 24-32 studs (two lanes), 40+ (boulevard), 16 (alley)
- Sidewalk: 6-8 studs wide
- Window: 3-5w x 4-6h, Glass material, Transparency 0.3-0.5
- Table: 4x3x3 studs (LxWxH at waist level ~3)
- Chair: 2x2x2.5 studs (seat ~2.5 above ground)
- Stair step: 2w x 1h x 1.5d per step (comfortable climb)
- Tree trunk: 1-2 diameter, 8-15 tall
- Tree canopy: 8-16 stud sphere of green parts (4-8 overlapping balls/wedges)
- Street lamp: 0.5 base, 10-12 pole, arm + housing + PointLight
- Fence: 0.5 thick posts x 4 tall, 0.3 thick rails x 3 tall
- Roof overhang: extend 1-2 studs beyond walls
- Foundation: extend 0.5-1 beyond walls, 1-2 studs tall
- Small room: 16x16 interior, Medium: 24x24, Large: 40x40
- Single floor height: 12-14 studs (wall + ceiling + floor thickness)

### Lighting Placement
- Every room needs 1+ light source (PointLight, SpotLight, or SurfaceLight)
- PointLight: omnidirectional, parent to lamp Part. Brightness 1-4, Range 15-40
- SpotLight: directional cone, Angle 30-90, Face=Bottom for downlights
- SurfaceLight: flat panel, Face=Front/Top. Screens, ceiling panels
- Warm indoor: Color rgb(255,220,180), Brightness 1.5, Range 20
- Cool outdoor: Color rgb(200,220,255), Brightness 1, Range 30
- Neon signs: Neon material + PointLight child (Brightness 2-3, matching color, Range 10-15)
- Torches: Part(Neon,orange) + Fire + PointLight(warm, Brightness 2, Range 15)
- NEVER Neon material without a real PointLight — Neon doesn't actually emit light

### Common Build Mistakes
- Single-part buildings (box = bad, minimum 30 parts for any structure)
- All SmoothPlastic material (use varied: Concrete, Wood, Brick, Metal, etc.)
- No lighting in interiors (always add PointLights)
- Floating builds (Raycast down or manually set Y to ground level)
- Paper-thin walls (< 0.3 studs, use 0.5-1.0)
- Empty interiors (add furniture, decor, detail)
- Monochrome builds (use 4+ colors with subtle variation)
- Parts at origin (0,0,0) — position relative to camera or existing content
- Unsealed roofs/floors (gaps visible from inside)
- No material variation (walls=Concrete, trim=Wood, floor=WoodPlanks, etc.)
- Ignoring collision (walkthrough walls, stuck in furniture)
- Z-fighting (two surfaces at exact same position — offset by 0.01)

### Enum Reference (all commonly used Enums)
Enum.Material: Plastic, SmoothPlastic, Neon, Wood, WoodPlanks, Marble, Basalt, Slate, CrackedLava, Concrete, Limestone, Granite, Pavement, Brick, Pebble, Cobblestone, Rock, Sandstone, CorrodedMetal, DiamondPlate, Foil, Metal, Grass, LeafyGrass, Sand, Fabric, Snow, Ice, Glass, ForceField, Air, Water, Ground, Salt, Asphalt, Cardboard, Carpet, CeramicTiles, ClayRoofTiles, Mud, Plaster, RoofShingles, Rubber

Enum.Font: Legacy, Arial, ArialBold, SourceSans, SourceSansBold, SourceSansLight, SourceSansSemibold, SourceSansItalic, Bodoni, Garamond, Cartoon, Code, Highway, SciFi, Arcade, Fantasy, Antique, Gotham, GothamMedium, GothamBold, GothamBlack, AmaticSC, Bangers, Creepster, DenkOne, Fondamento, FredokaOne, GrenzeGotisch, IndieFlower, JosefinSans, Jura, Kalam, LuckiestGuy, Merriweather, Michroma, Nunito, Oswald, PatrickHand, PermanentMarker, Roboto, RobotoCondensed, RobotoMono, RobotoSlab, SpecialElite, TitilliumWeb, Ubuntu

Enum.EasingStyle: Linear, Sine, Back, Quad, Quart, Quint, Bounce, Elastic, Exponential, Circular, Cubic
Enum.EasingDirection: In, Out, InOut

Enum.KeyCode (common): W, A, S, D, Q, E, R, F, G, Space, LeftShift, LeftControl, Tab, One, Two, Three, Four, Five, Six, Seven, Eight, Nine, Zero
Enum.UserInputType: MouseButton1, MouseButton2, MouseButton3, MouseMovement, Touch, Keyboard, Gamepad1
Enum.HumanoidStateType: Running, Jumping, Freefall, Landed, Climbing, Swimming, Dead, Physics, None
Enum.RaycastFilterType: Include, Exclude
Enum.SortOrder: LayoutOrder, Name
Enum.FillDirection: Horizontal, Vertical
Enum.AutomaticSize: None, X, Y, XY
Enum.ScrollingDirection: X, Y, XY
Enum.ScaleType: Stretch, Slice, Tile, Fit, Crop

### Common API Methods — Correct vs Hallucinated
**CORRECT Instance methods:**
- Instance.new(className) — create. NEVER pass parent as 2nd arg (set Parent LAST after all properties)
- instance:Clone() — deep copy including all descendants
- instance:Destroy() — remove permanently and disconnect all connections
- instance:FindFirstChild(name) — returns child or nil. SAFE, won't error
- instance:WaitForChild(name, timeout?) — yields until found. USE ON CLIENT for replicated instances
- instance:FindFirstChildOfClass(className) — match exact class name
- instance:FindFirstChildWhichIsA(className) — match class including inheritance
- instance:FindFirstAncestorOfClass(className) — search up the hierarchy
- instance:GetChildren() — array of direct children only
- instance:GetDescendants() — array of ALL descendants recursively
- instance:IsA(className) — type check including inheritance (Part:IsA("BasePart") = true)
- instance:SetAttribute(name, value) — store custom data without creating value objects
- instance:GetAttribute(name) — read custom data, returns nil if not set
- instance:GetAttributes() — returns table of all attribute key/value pairs

**CORRECT Model methods:**
- model:PivotTo(cframe) — move entire model (REPLACES deprecated SetPrimaryPartCFrame)
- model:GetPivot() — get model's current pivot CFrame
- model:GetBoundingBox() — returns CFrame, Size of the model's bounding box
- model:MoveTo(position) — move model's primary part to world position
- model:ScaleTo(scale) — scale entire model uniformly

**CORRECT Humanoid methods:**
- humanoid:TakeDamage(amount) — reduce health (respects ForceField, use for game damage)
- humanoid:MoveTo(position, part?) — walk NPC or character to world position
- humanoid:ChangeState(Enum.HumanoidStateType.Jumping) — force state change
- humanoid:EquipTool(tool) — force equip a tool
- humanoid:UnequipTools() — force unequip all tools

**CORRECT Animator (replaces deprecated Humanoid:LoadAnimation):**
- local animator = humanoid:FindFirstChildOfClass("Animator")
- local track = animator:LoadAnimation(animationObject)
- track:Play() / track:Stop() / track:AdjustSpeed(n) / track:AdjustWeight(n)
- track.Ended:Connect(fn) fires when animation finishes
- track.KeyframeReached:Connect(fn) fires on named keyframes

**CORRECT TweenService:**
- TweenService:Create(instance, tweenInfo, {property=targetValue}) — create tween
- TweenInfo.new(time, Enum.EasingStyle.Quad, Enum.EasingDirection.Out, repeatCount, reverses, delayTime)
- tween:Play() / tween:Pause() / tween:Cancel()
- tween.Completed:Connect(fn) fires when tween finishes

**CORRECT workspace Spatial Queries:**
- workspace:Raycast(origin, direction, raycastParams?) — single ray, returns RaycastResult or nil
- workspace:GetPartBoundsInRadius(position, radius, overlapParams?) — sphere overlap
- workspace:GetPartBoundsInBox(cframe, size, overlapParams?) — box overlap
- workspace:GetPartsInPart(part, overlapParams?) — part shape overlap

RaycastParams setup pattern:
  local params = RaycastParams.new()
  params.FilterType = Enum.RaycastFilterType.Exclude
  params.FilterDescendantsInstances = {character}
  local result = workspace:Raycast(origin, direction * 500, params)
  if result then local hit = result.Instance; local hitPos = result.Position end

### HALLUCINATED APIs — NEVER USE THESE
These do not exist or are deprecated. Reject every one:
- workspace:FindPartOnRay() — DEPRECATED. Use workspace:Raycast(origin, direction, params)
- Ray.new(origin, direction) — DEPRECATED. Use workspace:Raycast() directly
- instance:Remove() or instance:remove() — DEPRECATED. Use :Destroy()
- model:SetPrimaryPartCFrame(cframe) — DEPRECATED. Use model:PivotTo(cframe)
- game.Workspace — use the global workspace directly
- wait(n) — DEPRECATED global. Use task.wait(n)
- spawn(fn) — DEPRECATED global. Use task.spawn(fn)
- delay(t, fn) — DEPRECATED global. Use task.delay(t, fn)
- game:GetService("Workspace") — use global workspace
- game.Players.LocalPlayer inside a Script (server) — WILL ERROR, client-only API
- DataStoreService in a LocalScript — WILL ERROR, server-only service
- ServerStorage access from LocalScript — WILL ERROR, invisible to clients
- Instance.new("Part", parent) — avoid 2nd arg. Set Parent LAST after all properties
- BrickColor.new("Bright red") — use Color3.fromRGB(r,g,b)
- pairs(t) / ipairs(t) — use generalized Luau iteration: for k,v in t do

### Sound ID Quick Reference (royalty-free Roblox asset IDs)
Click UI:       rbxassetid://876939830
Pop:            rbxassetid://421058925
Woosh:          rbxassetid://320557563
Ding/bell:      rbxassetid://160715357
Error buzz:     rbxassetid://2865227271
Explosion:      rbxassetid://262562442
Footstep wood:  rbxassetid://507863457
Footstep metal: rbxassetid://507863493
Sword hit:      rbxassetid://517742100
Coin collect:   rbxassetid://138080679
Level up:       rbxassetid://2865227271
Door creak:     rbxassetid://1369158
Water splash:   rbxassetid://516740443
Wind ambient:   rbxassetid://6799601490
Thunder crack:  rbxassetid://130847073
Heartbeat:      rbxassetid://289556450

Sound setup pattern:
  local s = Instance.new("Sound")
  s.SoundId = "rbxassetid://876939830"
  s.Volume = 0.5
  s.RollOffMaxDistance = 40  -- positional 3D falloff
  s.Parent = part             -- or SoundService for global audio
  s:Play()

### CollisionGroup Reference (PhysicsService)
  local PhysicsService = game:GetService("PhysicsService")
  PhysicsService:RegisterCollisionGroup("Players")
  PhysicsService:RegisterCollisionGroup("Enemies")
  PhysicsService:RegisterCollisionGroup("Projectiles")
  PhysicsService:RegisterCollisionGroup("Interactables")
  PhysicsService:CollisionGroupSetCollidable("Players", "Players", false)        -- players pass through each other
  PhysicsService:CollisionGroupSetCollidable("Projectiles", "Players", false)    -- own projectile skips self
  PhysicsService:CollisionGroupSetCollidable("Projectiles", "Projectiles", false) -- projectiles don't hit each other
  part.CollisionGroup = "Players"  -- assign group to a part (Roblox 2023+ shorthand)

### Attribute System (modern data storage on instances)
Attributes replace IntValue/StringValue/BoolValue children for simple per-instance data.
  part:SetAttribute("Health", 100)
  part:SetAttribute("TeamColor", Color3.fromRGB(255,0,0))
  part:SetAttribute("IsActive", true)
  local hp = part:GetAttribute("Health")   -- nil if not set
  local all = part:GetAttributes()          -- {key=value} table
  part:GetAttributeChangedSignal("Health"):Connect(function()
      local newHp = part:GetAttribute("Health")
  end)
Supported types: number, string, boolean, Color3, Vector3, CFrame, UDim, UDim2, BrickColor, NumberRange, NumberSequence, ColorSequence, Rect, Font, EnumItem
Best for: enemy stats on NPC models, item properties on pickups, building ownership tags, door state (open/closed), seat occupancy — anything that doesn't need complex nested table data.
`;

// ---------------------------------------------------------------------------
// SCRIPTING PATTERNS — DataStore, Remotes, State Machines, Pooling, Debounce
// ---------------------------------------------------------------------------
const SCRIPTING_PATTERNS = `
## Roblox Scripting Patterns

### DataStore Save/Load with Retry & Session Locking
\`\`\`lua
-- ServerScriptService/DataManager
local DataStoreService = game:GetService("DataStoreService")
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")

local store = DataStoreService:GetDataStore("PlayerData_v3")
local sessionData = {} -- userId -> data
local AUTOSAVE_INTERVAL = 120
local DATA_TEMPLATE = {version=3, coins=0, gems=0, inventory={}, stats={kills=0,deaths=0,playtime=0}, settings={music=true,sfx=true}}

local function deepCopy(t)
    if type(t) ~= "table" then return t end
    local copy = {}
    for k, v in pairs(t) do copy[k] = deepCopy(v) end
    return copy
end

local function reconcile(data, template)
    for k, v in pairs(template) do
        if data[k] == nil then
            data[k] = deepCopy(v)
        elseif type(v) == "table" and type(data[k]) == "table" then
            reconcile(data[k], v)
        end
    end
end

local function loadData(player)
    local key = "player_" .. player.UserId
    local data
    for attempt = 1, 3 do
        local ok, result = pcall(function() return store:GetAsync(key) end)
        if ok then data = result; break end
        if attempt < 3 then task.wait(6) end
    end
    if not data then data = deepCopy(DATA_TEMPLATE) end
    reconcile(data, DATA_TEMPLATE)
    -- migrate old versions
    if data.version < 3 then
        -- migration logic here
        data.version = 3
    end
    sessionData[player.UserId] = data
end

local function saveData(player)
    local data = sessionData[player.UserId]
    if not data then return end
    local key = "player_" .. player.UserId
    for attempt = 1, 3 do
        local ok, err = pcall(function() store:SetAsync(key, data) end)
        if ok then return true end
        if attempt < 3 then task.wait(6) end
    end
    warn("Failed to save data for", player.Name)
    return false
end

Players.PlayerAdded:Connect(loadData)
Players.PlayerRemoving:Connect(function(player)
    saveData(player)
    sessionData[player.UserId] = nil
end)

-- Auto-save loop
task.spawn(function()
    while true do
        task.wait(AUTOSAVE_INTERVAL)
        for _, player in Players:GetPlayers() do
            task.spawn(saveData, player)
        end
    end
end)

-- Save all on shutdown
game:BindToClose(function()
    for _, player in Players:GetPlayers() do
        saveData(player)
    end
end)
\`\`\`

### RemoteEvent Validation Pattern
\`\`\`lua
-- Server: validate type, range, cooldown, ownership
local Remotes = ReplicatedStorage.Remotes
local cooldowns = {} -- player -> {remoteName -> lastTime}

local function validateArgs(player, remoteName, args, schema)
    -- Type checking
    for i, expected in ipairs(schema) do
        local val = args[i]
        if type(val) ~= expected.type then return false, "Bad type at arg " .. i end
        if expected.type == "number" then
            if expected.min and val < expected.min then return false end
            if expected.max and val > expected.max then return false end
            if expected.integer and val ~= math.floor(val) then return false end
        elseif expected.type == "string" then
            if expected.maxLen and #val > expected.maxLen then return false end
        end
    end
    -- Cooldown check
    local now = tick()
    cooldowns[player] = cooldowns[player] or {}
    local last = cooldowns[player][remoteName] or 0
    if now - last < (schema.cooldown or 0.1) then return false, "Too fast" end
    cooldowns[player][remoteName] = now
    return true
end

Remotes.BuyItem.OnServerEvent:Connect(function(player, itemId)
    local ok = validateArgs(player, "BuyItem", {itemId}, {
        {type="string", maxLen=50},
        cooldown = 0.5
    })
    if not ok then return end
    -- actual buy logic with server authority
    local itemData = require(ReplicatedStorage.Modules.ItemData)[itemId]
    if not itemData then return end
    local data = sessionData[player.UserId]
    if not data then return end
    if data.coins < itemData.price then return end
    data.coins = data.coins - itemData.price
    table.insert(data.inventory, itemId)
    Remotes.UpdateUI:FireClient(player, "coins", data.coins)
end)
\`\`\`

### State Machine Pattern
\`\`\`lua
-- Reusable state machine for rounds, AI, UI flows
local StateMachine = {}
StateMachine.__index = StateMachine

function StateMachine.new(states, initialState)
    local self = setmetatable({}, StateMachine)
    self.states = states      -- {stateName = {enter=fn, update=fn, exit=fn}}
    self.current = nil
    self:transition(initialState)
    return self
end

function StateMachine:transition(newState, ...)
    if self.current and self.states[self.current].exit then
        self.states[self.current].exit(...)
    end
    self.current = newState
    if self.states[newState].enter then
        self.states[newState].enter(...)
    end
end

function StateMachine:update(dt)
    if self.current and self.states[self.current].update then
        self.states[self.current].update(dt)
    end
end

-- Example: Round system
local roundMachine = StateMachine.new({
    Intermission = {
        enter = function()
            -- show lobby, countdown 30s
            task.delay(30, function() roundMachine:transition("Playing") end)
        end,
    },
    Playing = {
        enter = function()
            -- teleport players, start timer
            task.delay(180, function() roundMachine:transition("RoundEnd") end)
        end,
        update = function(dt)
            -- check win condition each frame
        end,
    },
    RoundEnd = {
        enter = function()
            -- show results, award prizes
            task.delay(10, function() roundMachine:transition("Intermission") end)
        end,
    },
}, "Intermission")
\`\`\`

### Object Pooling Pattern
\`\`\`lua
-- For bullets, drops, particles — avoid Create/Destroy overhead
local ObjectPool = {}
ObjectPool.__index = ObjectPool

function ObjectPool.new(template, initialSize)
    local self = setmetatable({}, ObjectPool)
    self.template = template
    self.available = {}
    self.active = {}
    self.folder = Instance.new("Folder")
    self.folder.Name = template.Name .. "_Pool"
    self.folder.Parent = workspace
    for i = 1, initialSize do
        local obj = template:Clone()
        obj.Parent = self.folder
        obj.Anchored = true
        obj.CanCollide = false
        obj.Transparency = 1
        obj.CFrame = CFrame.new(0, -500, 0) -- hide below map
        table.insert(self.available, obj)
    end
    return self
end

function ObjectPool:get()
    local obj = table.remove(self.available)
    if not obj then
        obj = self.template:Clone()
        obj.Parent = self.folder
    end
    obj.Transparency = 0
    self.active[obj] = true
    return obj
end

function ObjectPool:release(obj)
    self.active[obj] = nil
    obj.Transparency = 1
    obj.Anchored = true
    obj.CFrame = CFrame.new(0, -500, 0)
    table.insert(self.available, obj)
end
\`\`\`

### Debounce Pattern
\`\`\`lua
-- For Touched, ClickDetector, ProximityPrompt — prevent spam
local debounces = {}
local function debounce(key, cooldown, callback)
    return function(...)
        if debounces[key] then return end
        debounces[key] = true
        callback(...)
        task.delay(cooldown, function() debounces[key] = nil end)
    end
end

-- Usage with Touched
part.Touched:Connect(debounce("coinPickup_" .. part.Name, 1, function(hit)
    local player = game.Players:GetPlayerFromCharacter(hit.Parent)
    if not player then return end
    -- award coin
end))

-- Usage with ProximityPrompt
prompt.Triggered:Connect(debounce("door_" .. door.Name, 2, function(player)
    -- toggle door
end))
\`\`\`

### Module Communication Pattern
\`\`\`lua
-- Modules talk via shared event bus, not direct require() cycles
-- ReplicatedStorage/Modules/EventBus.lua
local EventBus = {}
local listeners = {}

function EventBus:on(event, callback)
    listeners[event] = listeners[event] or {}
    table.insert(listeners[event], callback)
end

function EventBus:fire(event, ...)
    for _, cb in ipairs(listeners[event] or {}) do
        task.spawn(cb, ...)
    end
end

return EventBus

-- Usage in CombatManager:
-- EventBus:fire("PlayerKilled", killer, victim)
-- Usage in LeaderboardManager:
-- EventBus:on("PlayerKilled", function(killer, victim) ... end)
\`\`\`

### Raycasting Patterns
\`\`\`lua
-- Ground detection
local params = RaycastParams.new()
params.FilterType = Enum.RaycastFilterType.Exclude
params.FilterDescendantsInstances = {character}
local result = workspace:Raycast(origin, Vector3.new(0, -500, 0), params)
local groundY = result and result.Position.Y or 0

-- Line of sight check
local function hasLineOfSight(from, to, ignore)
    local params = RaycastParams.new()
    params.FilterType = Enum.RaycastFilterType.Exclude
    params.FilterDescendantsInstances = ignore or {}
    local dir = (to - from)
    local result = workspace:Raycast(from, dir, params)
    return not result or (result.Position - to).Magnitude < 1
end

-- Bullet hit detection
local function castBullet(origin, direction, speed, maxDist)
    local params = RaycastParams.new()
    params.FilterType = Enum.RaycastFilterType.Exclude
    params.FilterDescendantsInstances = {shooter.Character}
    local result = workspace:Raycast(origin, direction.Unit * maxDist, params)
    if result then
        local hit = result.Instance
        local humanoid = hit.Parent:FindFirstChildOfClass("Humanoid") or hit.Parent.Parent:FindFirstChildOfClass("Humanoid")
        if humanoid then
            humanoid:TakeDamage(25)
        end
    end
end
\`\`\`

### Tween Patterns
\`\`\`lua
local TweenService = game:GetService("TweenService")

-- Door open/close
local function tweenDoor(door, open)
    local goal = open and {CFrame = door.CFrame * CFrame.Angles(0, math.rad(90), 0)} or {CFrame = door:GetAttribute("ClosedCFrame")}
    local tween = TweenService:Create(door, TweenInfo.new(0.5, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), goal)
    tween:Play()
end

-- UI fade in
local function fadeIn(guiObject, duration)
    guiObject.Visible = true
    guiObject.BackgroundTransparency = 1
    TweenService:Create(guiObject, TweenInfo.new(duration or 0.3), {BackgroundTransparency = 0}):Play()
end

-- Part color pulse
local function pulse(part, color, duration)
    local original = part.Color
    local t1 = TweenService:Create(part, TweenInfo.new(duration/2), {Color = color})
    local t2 = TweenService:Create(part, TweenInfo.new(duration/2), {Color = original})
    t1:Play()
    t1.Completed:Connect(function() t2:Play() end)
end
\`\`\`
`;

// ---------------------------------------------------------------------------
// BUILD PATTERNS — Construction, Materials, Colors, Terrain
// ---------------------------------------------------------------------------
const BUILD_PATTERNS = `
## Roblox Build Patterns

### Multi-Part Construction Order
Build structures in this order for best results:

1. **Foundation** — Concrete/Brick slab, extends 0.5-1 stud beyond walls, 1-2 studs tall
2. **Walls** — Concrete/Brick, 0.5-1 stud thick, floor-to-ceiling height. Leave gaps for doors/windows
3. **Windows** — Glass material, Transparency 0.3-0.5, inset 0.1 studs from wall face. Add window frames (thin Wood parts)
4. **Doors** — Opening = 4w x 7.5h. Door part can be Anchored with hinge script or just an open doorway
5. **Floor** — WoodPlanks, Marble, or Concrete. Thickness 0.5-1 stud. Different material from walls
6. **Ceiling/Roof** — Flat: slab on top. Pitched: two Wedge parts angled. Extend 1-2 studs for overhang
7. **Interior** — Furniture, lights, decor. Every room needs at least a light source and 2-3 furniture pieces
8. **Exterior details** — Trim (thin Wood/Metal strips along edges), gutters, signs, planters, steps
9. **Lighting** — PointLight in every room parented to a lamp/fixture Part. SpotLights for accents
10. **Surroundings** — Path/sidewalk to entrance, landscaping (bushes, trees, rocks)

### Material Palettes by Theme

**Medieval** — Cobblestone (walls, paths), Wood (beams, doors, floors), Brick (chimneys, arches), Slate (roofs), Metal (hinges, gates), Granite (castle walls)
Colors: rgb(120,100,80) stone, rgb(80,60,40) wood, rgb(60,60,60) metal, rgb(140,80,40) leather

**Modern/Urban** — Concrete (walls, sidewalks), Glass (windows, facades), Metal (railings, frames), SmoothPlastic (appliances, fixtures), Marble (floors, counters)
Colors: rgb(220,220,220) white, rgb(60,60,60) dark gray, rgb(180,180,180) light gray, rgb(40,40,40) black, accents of rgb(0,120,200) blue or rgb(200,50,50) red

**Sci-Fi** — Metal (hull, walls), DiamondPlate (floors), Glass (viewports), Neon (accents, strips), ForceField (shields, barriers), Foil (panels)
Colors: rgb(100,120,140) steel, rgb(0,200,255) cyan neon, rgb(200,0,255) purple neon, rgb(40,40,50) dark hull, rgb(255,100,0) warning orange

**Nature/Forest** — Wood (cabins, bridges), Brick (paths), Grass terrain, LeafyGrass terrain, Sand (paths), Slate (rocks), Pebble (river beds)
Colors: rgb(80,120,40) green, rgb(100,70,30) bark brown, rgb(160,140,100) sand, rgb(80,80,80) stone, rgb(140,180,60) light leaf

**Horror** — Concrete (cracked walls), CorrodedMetal (pipes, doors), Wood (old floors, boards), Slate (roofs), Brick (exposed walls)
Colors: rgb(60,50,40) dark brown, rgb(40,40,40) near black, rgb(100,30,30) dried blood, rgb(80,80,70) dingy gray, rgb(50,60,50) mold green

**Beach/Tropical** — Sand terrain, Wood (planks, docks), Brick (paths), Glass (windows), Fabric (awnings, umbrellas)
Colors: rgb(240,220,170) sand, rgb(120,80,40) wood, rgb(0,150,200) ocean, rgb(255,100,50) coral, rgb(100,200,100) palm green

**Winter/Snow** — Ice (frozen surfaces), Concrete (buildings), Brick (chimneys), Wood (cabins), Snow terrain, Glacier terrain
Colors: rgb(220,230,240) ice white, rgb(180,200,220) frost blue, rgb(100,70,40) cabin brown, rgb(200,50,40) warm red accents

### Color Palettes by Mood

**Warm/Cozy** — rgb(255,200,150), rgb(200,150,100), rgb(180,120,80), rgb(240,180,140), rgb(160,100,60)
**Cold/Icy** — rgb(180,200,230), rgb(140,170,210), rgb(100,140,200), rgb(200,220,240), rgb(80,120,180)
**Neon/Cyberpunk** — rgb(255,0,100), rgb(0,255,200), rgb(200,0,255), rgb(255,200,0), rgb(0,150,255)
**Earthy/Natural** — rgb(120,100,70), rgb(80,120,50), rgb(160,140,100), rgb(100,80,50), rgb(140,160,100)
**Pastel/Soft** — rgb(255,200,200), rgb(200,220,255), rgb(200,255,200), rgb(255,240,200), rgb(230,200,255)
**Dark/Moody** — rgb(30,30,40), rgb(50,40,50), rgb(40,50,40), rgb(60,50,40), rgb(50,50,60)

### Color Variation Technique
Never use flat colors. For every surface, add subtle HSV variation:
- Take base color, shift Hue by random(-5,5), Saturation by random(-0.05,0.05), Value by random(-0.03,0.03)
- Apply per-part for natural look (bricks, stones, wood planks)
- Use 3-5 variants of each base color across a structure

### Terrain + Build Integration
- Use workspace:Raycast(pos, Vector3.new(0,-500,0)) to find ground level
- Set foundation Y to ground level (result.Position.Y)
- For slopes: use Terrain:FillBlock() to flatten area under building, then place
- Blend edges: add rocks, bushes (green Ball parts), dirt path (thin Brown parts) around base
- Terrain painting: Terrain:ReplaceMaterial(region, resolution, oldMat, newMat) to paint paths
- Water features: Terrain:FillBall(center, radius, Enum.Material.Water) for ponds
- Roads: flat Concrete parts on terrain surface, or paint Asphalt terrain material

### LOD Considerations
- Under 50 studs: full detail, multiple parts per feature (multi-brick walls, window frames, trim)
- 50-150 studs: medium detail, simplified geometry (walls as single parts, windows as decals)
- 150+ studs: low detail, just silhouette shapes (building as 3-5 large parts)
- Use MeshParts for complex organic shapes (statues, vehicles, trees)
- Use Unions (CSG) sparingly — they don't perform well with many operations
- For large maps with StreamingEnabled: put detail in ModelStreamingMode = Eager for important builds

### Attachment & Constraint Patterns
- WeldConstraint: rigidly connects two parts. Part0 + Part1, no offset needed
- HingeConstraint: rotating joint (doors, wheels). Set Axis, LimitsEnabled, LowerAngle, UpperAngle
- SpringConstraint: bouncy connection (suspension, trampolines). Set Stiffness, Damping, FreeLength
- RopeConstraint: flexible rope. Set Length, Restitution
- AlignPosition/AlignOrientation: smooth following (floating platforms, camera targets)
- For animated doors: HingeConstraint + ActuatorType=Motor, AngularVelocity, MotorMaxTorque
- For elevators: PrismaticConstraint + ActuatorType=Motor, Velocity, MotorMaxForce

### Decal & Texture Usage
- Decal: flat image on one face. Set Face property (Front, Back, Top, etc.)
- Texture: repeating tiled image. StudsPerTileU/V controls repeat scale
- SurfaceGui: interactive UI on a 3D surface. Adornee = part. Add Frames, TextLabels
- BillboardGui: always-faces-camera UI. Good for NPC names, health bars, item labels
- For signs: SurfaceGui on Part, TextLabel inside, no background for clean look
- For posters/art: Decal with custom ImageId on a thin Part
`;

// ---------------------------------------------------------------------------
// GAME TYPE ARCHITECTURES — Full Explorer trees, schemas, loops, remotes
// ---------------------------------------------------------------------------
const GAME_TYPE_ARCHITECTURE: Record<string, string> = {
  tycoon: `
## Tycoon Game Architecture

### Explorer Tree
ServerScriptService/
  TycoonManager.lua — assigns plots, handles purchases, saves progress
  DataManager.lua — DataStore load/save with session locking
  DropperManager.lua — spawns and moves dropper items
ReplicatedStorage/
  Remotes/ — BuyButton, CollectCash, UpgradeDropper, UnlockArea, Rebirth
  Modules/
    TycoonConfig.lua — prices, unlock order, upgrade multipliers
    ItemData.lua — all tycoon items {name, price, model, category}
ServerStorage/
  TycoonTemplates/ — full tycoon base model per plot
  Droppers/ — dropper models
  Upgraders/ — upgrader models
StarterGui/
  TycoonHUD/ — cash display, income/sec, rebirth button
  ShopGUI/ — grid of purchasable items with prices
  MilestoneUI/ — unlock progress, next milestone
Workspace/
  TycoonPlots/ — Plot1/, Plot2/, Plot3/, Plot4/ (each has BasePlate, Buttons, Conveyor)

### Data Schema
{version=1, cash=0, totalEarned=0, rebirths=0, purchased={"Button1","Dropper1"}, upgrades={dropSpeed=1,dropValue=1}, unlockedAreas={"Starter"}, settings={music=true}}

### Core Loop (minute by minute)
0:00 — Player joins, gets assigned empty plot, tycoon template cloned
0:01 — Steps on starter button, buys first dropper (free). Dropper spawns blocks on conveyor
0:02 — Blocks roll down conveyor to collector. Cash increments. Buy next button
0:05 — Multiple droppers running. Buying upgraders (value multiplier). Cash display updates live
0:10 — Unlocking new area of tycoon (wall disappears). Bigger droppers, higher values
0:30 — Near max items. Consider rebirth (reset progress for permanent multiplier)

### Required RemoteEvents
BuyButton: Client→Server {buttonId:string} — purchases tycoon item
CollectCash: Client→Server {} — manual cash collection from collector
UpgradeDropper: Client→Server {dropperId:string, upgradeType:string} — upgrade speed/value
UnlockArea: Client→Server {areaName:string} — unlock new section
Rebirth: Client→Server {} — reset tycoon for multiplier
UpdateCash: Server→Client {cash:number, income:number} — sync cash display

### Required GUIs
CashDisplay — top of screen: current cash, income per second, rebirth count
ShopPanel — grid of items: icon, name, price, owned checkmark. ScrollingFrame
TycoonMap — minimap showing unlocked/locked areas
RebirthConfirm — modal: "Reset for 2x multiplier? You have $X"

### Pitfalls
- Not cleaning up tycoon when player leaves (leaked models eat memory)
- Cash calculated client-side (exploiters give themselves infinite money)
- No cap on dropper speed (100 droppers = lag explosion)
- Buttons not debounced (double-buy on fast clicks)
- Conveyor physics breaking with too many parts (use CFrame movement, not BodyVelocity)
`,

  obby: `
## Obby Game Architecture

### Explorer Tree
ServerScriptService/
  CheckpointManager.lua — tracks player progress, handles respawn at checkpoint
  DataManager.lua — saves checkpoint, coins, skins
  StageGenerator.lua — (optional) procedural stage generation
ReplicatedStorage/
  Remotes/ — ReachCheckpoint, BuySkip, BuySkin, ToggleTrail
  Modules/
    StageData.lua — {stageNum, difficulty, theme, timeLimit}
    ShopData.lua — {trails, skins, skips, prices}
ServerStorage/
  Stages/ — Stage1/, Stage2/, ..., Stage100/ (pre-built models)
StarterGui/
  StageCounter/ — "Stage 14 / 100" display
  TimerUI/ — speedrun timer
  ShopGUI/ — trails, skins, stage skips
  DeathCounter/ — deaths this run
StarterPlayer/
  StarterCharacterScripts/
    DoubleJump.lua — double jump ability
    SpeedBoost.lua — temporary speed pads
Workspace/
  Stages/ — all stage models placed in sequence
  Checkpoints/ — SpawnLocation parts at each stage start
  KillBricks/ — parts that kill on touch (lava, spikes)

### Data Schema
{version=1, currentStage=1, bestStage=1, coins=0, deaths=0, ownedTrails={}, ownedSkins={}, equippedTrail="", equippedSkin="", bestTime=nil, totalPlaytime=0}

### Core Loop
0:00 — Player spawns at Stage 1 (or saved checkpoint). Timer starts
0:01 — Jump across platforms, avoid kill bricks, navigate moving parts
0:02 — Reach checkpoint. Progress saved. New obstacles ahead
0:05 — Die. Respawn at last checkpoint. Death counter increments
0:10 — Reach coin collectibles. Optional shop for trails/skins
0:30 — Approaching final stages. Difficulty ramps. Bragging rights for completion

### Required RemoteEvents
ReachCheckpoint: Client→Server {stageNum:number} — player touched checkpoint
CollectCoin: Client→Server {coinId:string} — collect floating coin
BuySkip: Client→Server {stageNum:number} — skip difficult stage (costs coins)
BuySkin: Client→Server {skinId:string} — cosmetic purchase
EquipTrail: Client→Server {trailId:string} — equip trail effect
UpdateStage: Server→Client {stage:number, deaths:number, time:number}

### Required GUIs
StageDisplay — always visible: "Stage 14/100", death count
Timer — speedrun timer (opt-in), millisecond precision
Leaderboard — fastest completions (OrderedDataStore)
Shop — trails (color effects behind character), skins (character accessories)

### Pitfalls
- Checkpoint not validating player actually reached it (exploiters teleport)
- Kill bricks using Touched without checking Humanoid (triggers on random parts)
- Moving platforms desync between server/client (anchor to server, tween on both)
- No kill plane below map (players fall forever instead of respawning)
- Stages too close together (player sees next stage, spoils surprise)
`,

  simulator: `
## Simulator Game Architecture

### Explorer Tree
ServerScriptService/
  DataManager.lua — save/load player progress
  GameManager.lua — handles clicking/collecting/rebirthing
  PetManager.lua — pet hatching, equipping, fusion
  ZoneManager.lua — zone unlocking, zone-specific multipliers
  AutoSaveLoop.lua — periodic auto-save
ReplicatedStorage/
  Remotes/ — Click, Sell, Hatch, EquipPet, Rebirth, UnlockZone, BuyUpgrade, BuyGamepass
  Modules/
    PetData.lua — {name, rarity, multiplier, icon, model} for every pet
    ZoneData.lua — {name, requiredPower, multiplier, theme}
    UpgradeData.lua — {name, baseCost, costMultiplier, maxLevel, effect}
    EggData.lua — {name, cost, pets={id,weight}[], zone}
ServerStorage/
  PetModels/ — 3D models for every pet
  ZoneTemplates/ — (optional) zone map chunks
StarterGui/
  MainHUD/ — power display, coins, gems, multiplier
  PetInventory/ — grid of owned pets, equip/delete/fuse
  EggHatchUI/ — egg cracking animation, pet reveal
  ShopUI/ — upgrades, gamepasses, eggs
  ZoneSelect/ — world map with locked/unlocked zones
  RebirthUI/ — rebirth confirmation with rewards preview
Workspace/
  Zones/ — Zone1_Starter/, Zone2_Desert/, Zone3_Snow/, etc.
  Eggs/ — egg models with ProximityPrompt or ClickDetector
  SellPad/ — part that sells collected items for coins

### Data Schema
{version=1, power=0, coins=0, gems=0, rebirths=0, pets=[{id,rarity,equipped,level}], upgrades={clickPower=1,autoPower=0,storage=100,luck=1}, unlockedZones={"Starter"}, gamepasses={autoCollect=false,x2Coins=false}, totalClicks=0, playtime=0}

### Core Loop
0:00 — Spawn in starter zone. Click/tap objects to gain power
0:01 — Power fills backpack. Go to sell pad to convert to coins
0:02 — Buy upgrades: click power, storage size, auto-click
0:05 — Save up for first egg. Hatch a pet (multiplier boost). Equip it
0:10 — Unlock Zone 2 (higher power per click). Better eggs here
0:30 — Multiple pets equipped. Rebirth available (reset for permanent boost)
Ongoing — Chase rare pets, unlock all zones, compete on leaderboard

### Required RemoteEvents
Click: Client→Server {zoneId:string} — player clicked/tapped (rate-limited to 20/sec)
Sell: Client→Server {} — sell collected power for coins
HatchEgg: Client→Server {eggId:string} — attempt to hatch egg
EquipPet: Client→Server {petUniqueId:string} — equip/unequip pet
DeletePet: Client→Server {petUniqueId:string} — delete pet for coins
FusePets: Client→Server {petId1:string, petId2:string, petId3:string} — fuse 3 into 1 better
BuyUpgrade: Client→Server {upgradeId:string} — purchase upgrade level
UnlockZone: Client→Server {zoneId:string} — unlock new zone
Rebirth: Client→Server {} — reset for multiplier
UpdateStats: Server→Client {power,coins,gems,multiplier} — sync display

### Required GUIs
StatsBar — always visible: power (with backpack capacity), coins, gems, rebirth count
PetInventory — scrolling grid: pet icon, name, rarity color, multiplier, equip button, level
EggHatch — fullscreen animation: egg cracks open, pet appears with rarity text + confetti
UpgradeShop — list of upgrades: name, current level, cost, buy button. Costs scale per level
ZoneMap — visual map showing zones, required power to unlock each
RebirthPanel — shows reset warning, what you keep (pets, gamepasses), bonus multiplier

### Pitfalls
- Click rate not limited server-side (autoclickers send 1000/sec)
- Pet duplication exploits (validate pet ownership before operations)
- No backpack cap (infinite power accumulation breaks economy)
- Upgrade costs not scaling (players max everything in 10 minutes)
- Egg weights not tested (too many legendaries or zero legendaries)
- Not batching UpdateStats (firing per-click floods network)
`,

  rpg: `
## RPG Game Architecture

### Explorer Tree
ServerScriptService/
  DataManager.lua — player save/load (stats, inventory, quests, position)
  CombatManager.lua — damage calc, abilities, cooldowns, targeting
  NPCManager.lua — spawns NPCs, AI behavior, dialogue triggers
  QuestManager.lua — quest tracking, conditions, rewards
  LootManager.lua — drop tables, item generation, rarity rolls
  InventoryManager.lua — add/remove items, equipment slots, weight
  PartyManager.lua — party invites, shared XP, instance grouping
ReplicatedStorage/
  Remotes/ — Attack, UseAbility, TalkToNPC, AcceptQuest, EquipItem, DropItem, UseItem, JoinParty
  Modules/
    ItemDatabase.lua — all items: {id, name, type, rarity, stats, icon, description, sellPrice, level}
    EnemyDatabase.lua — all enemies: {id, name, hp, damage, defense, xpReward, lootTable, abilities}
    AbilityDatabase.lua — all abilities: {id, name, damage, cooldown, manaCost, range, effect, animation}
    QuestDatabase.lua — all quests: {id, title, description, objectives[], rewards{}, prerequisites[]}
    ClassData.lua — classes: {Warrior, Mage, Archer, Healer} with base stats, ability trees
    LevelCurve.lua — XP required per level: function(level) return math.floor(100 * level^1.5) end
ServerStorage/
  EnemyModels/ — enemy models with Humanoid
  WeaponModels/ — sword, staff, bow, shield models
  MapChunks/ — dungeon rooms, overworld sections
StarterGui/
  HUD/ — HP bar, mana bar, XP bar, level, hotbar (abilities 1-6)
  InventoryUI/ — grid inventory, equipment slots (head, chest, legs, weapon, shield, accessory)
  QuestLog/ — active quests, objectives, progress bars
  DialogueUI/ — NPC dialogue box with choices
  MinimapUI/ — top-right minimap with player dot, enemy dots, quest markers
  PartyUI/ — party member HP bars, invite panel

### Data Schema
{version=1, class="Warrior", level=1, xp=0, hp=100, maxHp=100, mana=50, maxMana=50, stats={str=10,dex=8,int=5,vit=10,luk=5}, statPoints=0, inventory=[{itemId,count,slot}], equipment={weapon="",chest="",head="",legs="",shield="",accessory1="",accessory2=""}, quests={active=[{id,progress={}}],completed=[]}, position={x=0,y=5,z=0}, skills={}, gold=0, playtime=0}

### Core Loop
0:00 — Character creation: choose class, customize appearance
0:02 — Starter town. Talk to NPC, get first quest ("Kill 5 Slimes")
0:05 — Enter field. Combat: click to attack, abilities on cooldown, dodge enemy attacks
0:10 — Quest complete. Return to NPC. Gain XP, gold, item reward. Level up! Allocate stat points
0:15 — New quest: explore dungeon. Party up with other players
0:30 — Dungeon: stronger enemies, traps, mini-boss, loot chests. Boss fight at end
1:00 — New zone unlocked. Higher level enemies. Better gear. Ongoing progression

### Required RemoteEvents
Attack: Client→Server {targetId:string} — basic attack on enemy
UseAbility: Client→Server {abilityId:string, targetId:string?} — cast ability
TalkToNPC: Client→Server {npcId:string} — initiate dialogue
DialogueChoice: Client→Server {npcId:string, choiceIndex:number} — select dialogue option
AcceptQuest: Client→Server {questId:string}
CompleteQuest: Client→Server {questId:string}
EquipItem: Client→Server {itemId:string, slot:string}
UseItem: Client→Server {itemId:string} — consume potion, etc.
DropItem: Client→Server {itemId:string, count:number}
AllocateStat: Client→Server {stat:string} — spend stat point
UpdateHUD: Server→Client {hp, mana, xp, level, gold, buffs[]}
DamageNumber: Server→Client {position, amount, isCrit, damageType}
EnemyUpdate: Server→Client {enemyId, hp, maxHp, position, state}

### Pitfalls
- Damage calculated client-side (hackers one-shot everything)
- No line-of-sight check for attacks (hit through walls)
- Quest progress not validated server-side (instant completion exploit)
- Item duplication via rapid equip/unequip (use transaction locks)
- Enemy respawn too fast or too slow (tuning is critical)
- No level scaling in parties (high-level friend trivializes content)
`,

  horror: `
## Horror Game Architecture

### Explorer Tree
ServerScriptService/
  GameManager.lua — round management, win/lose conditions, monster spawning
  MonsterAI.lua — pathfinding, chase logic, detection, kill sequences
  ObjectiveManager.lua — key items, generators, doors, escape conditions
  AudioManager.lua — ambient sounds, jump scare triggers, heartbeat intensity
  EventManager.lua — scripted scares, door slams, light flickers
ReplicatedStorage/
  Remotes/ — PickupItem, UseItem, HideInLocker, OpenDoor, StartRound, Jumpscare
  Modules/
    MonsterData.lua — {speed, detectionRange, stunDuration, killAnimation, soundId}
    ObjectiveData.lua — {type, location, required, description}
ServerStorage/
  MonsterModels/ — monster variants
  KeyItems/ — flashlight, key, fuse, battery models
  MapVariants/ — randomized room layouts
StarterGui/
  CrosshairUI/ — subtle dot crosshair
  ObjectiveUI/ — "Find 5 fuses" with progress
  InventoryBar/ — items: flashlight, key, battery (max 3 slots)
  JumpscareOverlay/ — fullscreen flash + image + sound
  HeartbeatUI/ — screen vignette that pulses with proximity to monster
StarterPlayer/
  StarterPlayerScripts/
    CameraEffects.lua — head bob, screen shake, narrow FOV when scared
    FlashlightController.lua — toggle flashlight, battery drain, flicker
    AmbientController.lua — proximity-based audio, heartbeat
Lighting/
  ClockTime=0, Brightness=0.2, Ambient=rgb(10,10,20), FogEnd=100, FogColor=rgb(0,0,0)
  ColorCorrectionEffect: Saturation=-0.3, Contrast=0.1, TintColor=rgb(200,200,220)
  BloomEffect: Intensity=0.3, Size=24, Threshold=0.9

### Data Schema
{version=1, gamesPlayed=0, escapes=0, deaths=0, fastestEscape=nil, unlockedSkins={}, achievements={}}

### Core Loop
0:00 — Lobby. 4-8 players ready up. Map selected/randomized
0:01 — Cutscene: players wake up in dark building. Objective revealed: "Find 5 fuses to power the exit"
0:02 — Explore dark halls with flashlight. Find items. Ambient creaks, whispers
0:05 — Monster spawns. Heartbeat increases when near. Must hide (lockers, under beds) or run
0:08 — Found 3/5 fuses. A player gets caught (kill animation). They spectate
0:12 — Last fuse found. Race to generator. Power it up. Run to exit before monster catches you
0:15 — Escape or death. Results screen. XP awarded. Back to lobby

### Pitfalls
- Monster too fast (unfun, no counterplay) or too slow (no tension)
- Jump scares without buildup (cheap, not scary). Build tension first: sounds, shadows, flickering lights
- Too bright — horror needs darkness. FogEnd 80-150, minimal ambient lighting
- Not enough hiding spots (players feel helpless with no counterplay)
- Sound mix wrong — ambient should be quiet, jump scares LOUD contrast
- Map too small (no exploration) or too big (boring walking simulator)
`,

  racing: `
## Racing Game Architecture

### Explorer Tree
ServerScriptService/
  RaceManager.lua — lobby→countdown→race→finish, position tracking, lap counting
  VehicleManager.lua — spawn vehicles, stats per car, boost/nitro, damage
  LeaderboardManager.lua — best times, win counts
  DataManager.lua — save unlocked cars, coins, records
ReplicatedStorage/
  Remotes/ — ReadyUp, UseBoost, SelectCar, FinishLap, RaceResult
  Modules/
    CarData.lua — {name, speed, acceleration, handling, braking, model, price, rarity}
    TrackData.lua — {name, laps, checkpoints[], bestTime, difficulty}
ServerStorage/
  CarModels/ — vehicle models with VehicleSeat, wheels, body
  TrackParts/ — track segments, barriers, decorations
StarterGui/
  RaceHUD/ — speed, position (1st/2nd/3rd), lap counter, minimap
  GarageUI/ — car selection, stats comparison, purchase
  CountdownUI/ — 3...2...1...GO! overlay
  ResultsUI/ — finishing positions, times, rewards
  BoostUI/ — boost meter, activation indicator
Workspace/
  Track/ — the racing track (Parts with checkpoints)
  Checkpoints/ — invisible trigger parts for lap/position tracking
  Spawns/ — grid start positions
  Decorations/ — grandstands, trees, signs

### Data Schema
{version=1, coins=0, wins=0, races=0, ownedCars={"Starter"}, equippedCar="Starter", bestTimes={["Track1"]=nil}, upgrades={}, totalDistance=0}

### Core Loop
0:00 — Lobby. Select car from garage. Ready up. Need 2+ players
0:01 — Countdown: 3...2...1...GO! Vehicles activate
0:02 — Racing: navigate track, use boost (limited charges), avoid obstacles
0:05 — Lap completed. Position updates. Draft behind other cars for speed boost
0:08 — Final lap. Close races = exciting. Finish line triggers result
0:09 — Results: positions, times, coin rewards. Option to race again or return to lobby

### Pitfalls
- Vehicle physics inconsistent between clients (use server-authoritative position + client prediction)
- Checkpoint skipping (validate player passed ALL checkpoints in order)
- Boost too powerful (makes skill irrelevant, just save boost for end)
- No rubber-banding (last place player quits because they can never catch up)
- VehicleSeat bugs (player gets stuck, vehicle flips, respawn system needed)
`,

  roleplay: `
## Roleplay Game Architecture

### Explorer Tree
ServerScriptService/
  DataManager.lua — save character, house, inventory, currency
  JobManager.lua — job assignments, paychecks, work tasks
  HousingManager.lua — house purchasing, furniture placement, visiting
  VehicleManager.lua — vehicle spawning, ownership, gas system
  EconomyManager.lua — shops, ATM, trading between players
  WeatherManager.lua — day/night cycle, rain, snow (visual + gameplay)
ReplicatedStorage/
  Remotes/ — BuyItem, SellItem, StartJob, QuitJob, PayDay, PlaceFurniture, TradeRequest, DriveCar, InteractNPC
  Modules/
    JobData.lua — {name, payRate, location, tasks, uniform, level}
    HouseData.lua — {name, price, rooms, maxFurniture, location}
    VehicleData.lua — {name, price, speed, seats, model}
    FurnitureData.lua — {name, price, category, model, canSit}
    ShopInventory.lua — {shopName, items[{id, price, category}]}
ServerStorage/
  Houses/ — house templates
  Vehicles/ — vehicle models
  Furniture/ — furniture models
  Uniforms/ — job uniform accessories
StarterGui/
  PhoneUI/ — smartphone menu: map, jobs, messages, settings, money
  InteractionUI/ — radial menu when near objects/players
  MoneyUI/ — cash display
  JobUI/ — current job tasks, timer, paycheck
  BuildModeUI/ — furniture placement grid, rotation, confirm

### Data Schema
{version=1, cash=1000, bank=0, job="None", jobLevel=1, house="None", furniture=[{id,position,rotation}], vehicles=["Starter"], inventory=[{id,count}], appearance={shirt,pants,face,hair,color}, playtime=0, reputation=0}

### Core Loop
0:00 — Spawn in town. Walk around, explore. See other players roleplaying
0:02 — Get a job (pizza delivery, police, doctor, teacher). Start work tasks
0:05 — Earn paycheck. Visit shop, buy items/food. Customize character
0:10 — Save up for house. Purchase, enter build mode, place furniture
0:20 — Buy a vehicle. Drive around town. Visit friends' houses
Ongoing — Social interaction, job progression, house decoration, vehicle collection

### Pitfalls
- Economy too easy (everyone has everything in 30 min — need money sinks)
- No content after buying house + car (need ongoing goals: job levels, rare items, events)
- Furniture placement not saving correctly (serialize CFrame to {x,y,z,rx,ry,rz})
- Vehicle despawn issues (limit per player, despawn when player leaves)
- Griefing (need moderation tools, report system, safe zones)
`,

  fighting: `
## Fighting Game Architecture

### Explorer Tree
ServerScriptService/
  CombatManager.lua — damage, hit detection, combos, blocking, cooldowns
  MatchManager.lua — 1v1 matchmaking, arenas, round management
  AbilityManager.lua — ability usage, cooldowns, resource costs
  DataManager.lua — save stats, unlocked characters/abilities, rank
  RankManager.lua — ELO/MMR calculation, rank tiers, matchmaking
ReplicatedStorage/
  Remotes/ — Attack, Block, UseAbility, Dodge, QueueMatch, Emote
  Modules/
    CharacterData.lua — {name, hp, speed, abilities[], combos[], hitboxes}
    AbilityData.lua — {name, damage, cooldown, startup, active, recovery, range, effect}
    ComboData.lua — {inputs[], damage, hitStun, knockback}
    RankData.lua — {tier, minElo, name, icon, color}
ServerStorage/
  Arenas/ — arena map models
  CharacterModels/ — fighter models/skins
StarterGui/
  FightHUD/ — HP bars (both players), ability cooldowns, combo counter, timer
  CharacterSelect/ — grid of fighters with stats preview
  RankDisplay/ — current rank, ELO, win/loss
  QueueUI/ — matchmaking status, estimated wait
  MoveList/ — all moves and combos for selected character
StarterPlayer/
  StarterCharacterScripts/
    CombatInput.lua — keybind handling, combo input buffer
    HitEffects.lua — screen shake, hit flash, particles

### Data Schema
{version=1, rank=1000, wins=0, losses=0, mainCharacter="Fighter1", unlockedChars={"Fighter1"}, unlockedSkins={}, stats={totalDamage=0, maxCombo=0, perfectWins=0}, settings={keybinds={}}}

### Core Loop
0:00 — Queue for match. Select character. Wait for opponent
0:01 — Match found. Arena loads. 3-2-1 countdown
0:02 — Fight! Light attacks, heavy attacks, abilities, blocking, dodging
0:03 — Combo system: chain attacks for higher damage. Opponent can break out with dodge
0:05 — Round over. Best of 3. Winner gets ELO, loser drops
0:06 — Rematch or back to queue. Check rank progression

### Pitfalls
- Hit detection client-side (exploiters always hit, never get hit)
- No input buffering (attacks feel unresponsive, combos impossible)
- Infinite combos (need hitstun decay, burst mechanic, combo limit)
- No lag compensation (high-ping players can't play)
- Balance: one character dominates (need win rate tracking and tuning)
- Hitboxes too big or too small (test extensively)
`,

  tower_defense: `
## Tower Defense Game Architecture

### Explorer Tree
ServerScriptService/
  WaveManager.lua — spawns waves, scales difficulty, boss waves
  TowerManager.lua — placement validation, targeting, damage, upgrades
  EnemyManager.lua — pathfinding, health, death rewards, abilities
  DataManager.lua — save progress, towers, currency
  MapManager.lua — map selection, path definition
ReplicatedStorage/
  Remotes/ — PlaceTower, UpgradeTower, SellTower, StartWave, SelectTower, UseAbility
  Modules/
    TowerData.lua — {name, cost, damage, range, fireRate, targetPriority, upgradePath[], model, type}
    EnemyData.lua — {name, hp, speed, reward, armor, abilities, model, immunities}
    WaveData.lua — {waveNum, enemies[{type, count, delay, path}], bossWave, reward}
    MapData.lua — {name, paths[Vector3[]], towerSpots[], difficulty}
ServerStorage/
  TowerModels/ — tower models per level
  EnemyModels/ — enemy models
  Maps/ — map models with paths
StarterGui/
  GameHUD/ — wave counter, lives, gold, enemy count
  TowerShop/ — sidebar: tower icons, costs, stats preview, drag to place
  TowerInfo/ — selected tower: stats, upgrade button, sell button, target priority
  WavePreview/ — upcoming wave enemy types
  ResultsUI/ — wave survived / game over, rewards
Workspace/
  Map/ — current map terrain + decorations
  Path/ — invisible parts defining enemy path (or Attachments)
  Towers/ — placed tower models
  Enemies/ — spawned enemy models (pooled)

### Data Schema
{version=1, coins=0, gems=0, highestWave={["Map1"]=0}, unlockedTowers={"Basic","Sniper"}, towerSkins={}, totalKills=0, achievements={}}

### Core Loop
0:00 — Select map. Place initial towers on valid spots using gold budget
0:01 — Start Wave 1. Enemies follow path. Towers auto-target and shoot
0:02 — Enemies die, drop gold. More gold → more towers or upgrades
0:03 — Wave 2: more enemies, faster. Upgrade existing towers (damage, range, speed)
0:05 — Boss wave: high HP enemy. Need focused fire, special towers
0:10 — Later waves: armored enemies, flying enemies, split enemies. Strategy matters
0:20 — Wave 30+: endgame difficulty. Tower synergies critical. One leak = game over

### Pitfalls
- Towers placed inside path (validate placement position vs path)
- Enemy pathfinding breaking (use waypoint system, not NavigationMesh)
- One tower type dominates (balance damage/cost ratio across all towers)
- No enemy variety (each enemy type should counter a tower type)
- Late-game lag from too many projectiles (use hitscan for fast towers, pool projectiles)
- Gold economy too generous (players max everything by wave 10)
`,

  survival: `
## Survival Game Architecture

### Explorer Tree
ServerScriptService/
  DataManager.lua — save inventory, base, stats, map progress
  CraftingManager.lua — recipe validation, resource consumption, item creation
  ResourceManager.lua — resource spawning, respawn timers, node depletion
  HungerManager.lua — hunger/thirst/temperature ticking, effects, death
  BuildManager.lua — base building placement, snapping, structural integrity
  EnemyManager.lua — hostile mob spawning, day/night aggression
  WorldManager.lua — day/night cycle, weather, biomes
ReplicatedStorage/
  Remotes/ — Harvest, Craft, PlaceBlock, BreakBlock, EquipTool, DropItem, Eat, Drink, Attack
  Modules/
    RecipeData.lua — {output, inputs[{id,count}], craftTime, station, level}
    ResourceData.lua — {name, tool, drops[{id,count,chance}], hp, respawnTime}
    ItemData.lua — {name, type, stackSize, durability, damage, armor, hunger, thirst, description}
    BiomeData.lua — {name, resources[], enemies[], temperature, weather}
    BuildData.lua — {name, cost[{id,count}], hp, material, size, snapPoints}
ServerStorage/
  ResourceNodes/ — tree, rock, ore, bush models
  Structures/ — wall, floor, door, chest, furnace models
  Tools/ — pickaxe, axe, sword, bow models
  Enemies/ — wolf, zombie, spider models
StarterGui/
  SurvivalHUD/ — health, hunger, thirst, temperature bars
  Hotbar/ — 8-slot quick access bar
  InventoryUI/ — grid inventory + crafting panel side by side
  CraftingUI/ — recipe list, required materials (green=have, red=need), craft button
  BuildUI/ — structure selection, placement ghost, rotate, confirm
  MapUI/ — discovered areas, base markers, resource markers

### Data Schema
{version=1, inventory=[{id,count,durability}], hotbar=[nil x8], equipment={head,chest,legs,weapon,tool}, baseBlocks=[{id,position,rotation,hp}], stats={health=100,hunger=100,thirst=100,temperature=37}, discoveries=[], craftingLevel=1, daysSurvived=0, kills=0}

### Core Loop
0:00 — Spawn with nothing. Punch trees for wood. Pick up stones
0:02 — Craft wooden pickaxe. Mine stone. Craft stone tools
0:05 — Hunger dropping. Find berries, hunt animals. Cook at campfire
0:10 — Night falls. Enemies spawn. Build basic shelter (walls, door, floor, roof)
0:15 — Morning. Explore further. Find iron ore. Smelt at furnace. Better tools
0:30 — Established base. Farm resources. Craft armor. Explore dangerous biomes
Ongoing — Base expansion, better gear, boss encounters, multiplayer raids

### Pitfalls
- Hunger drains too fast (players spend all time eating, not exploring)
- Resources too scarce or abundant (tuning is everything)
- Base grief (other players destroy bases — need claim system or PvE option)
- Inventory too small (players drop important items — 30+ slots standard)
- Night too dangerous for new players (safe starter area needed)
- Crafting recipes hidden (show all recipes, gray out what you can't make yet)
`,

  battle_royale: `
## Battle Royale Game Architecture

### Explorer Tree
ServerScriptService/
  BRManager.lua — lobby→bus drop→play→storm→winner→lobby round loop
  StormManager.lua — shrinking safe zone, damage outside zone, zone timer display
  LootManager.lua — randomized loot spawns across map, respawn after round
  DataManager.lua — save wins, kills, top10s, xp, level, skins, emotes
  SpectateManager.lua — spectate players after death, follow cam, kill feed
ReplicatedStorage/
  Remotes/ — PickupLoot, DropItem, DealDamage, StormUpdate, PlayerEliminated, VictoryRoyale, ReadyUp, RequestSpectate
  Modules/
    LootData.lua — {id, rarity, damage, ammo, healAmount, weight}
    StormData.lua — {phase, shrinkDuration, pauseDuration, damagePerSecond, innerRadius, outerRadius}
    ZoneData.lua — {safePositions[], allowedLootZones[], terrainFeatures[]}
ServerStorage/
  LootModels/ — weapon, ammo, armor, healing item models
  VehicleModels/ — optional vehicle models for traversal
  MapVariants/ — optional randomized map sections
StarterGui/
  MinimapUI/ — overhead minimap with storm circle overlay, player dots, loot zones
  KillFeedUI/ — scrolling log of eliminations with weapon icons
  InventoryUI/ — weapon slots (2), consumables (4), armor display
  HUDOverlay/ — health bar, shield bar, alive counter, storm timer
  VictoryUI/ — VICTORY ROYALE fullscreen overlay with stats
  SpectateUI/ — who you're watching, kill count, exit to lobby button
Workspace/
  Map/ — full map terrain, buildings, cover objects
  LootSpawns/ — invisible spawn points (Parts with attributes: lootTable, weight)
  SafeZone/ — visible circle part (transparency 0.8, Neon, blue) showing current safe zone

### Data Schema
{version=1, wins=0, kills=0, top10s=0, xp=0, level=1, gamesPlayed=0, unlockedSkins={}, unlockedEmotes={}, stats={headshots=0,longestKill=0,damageDealt=0}}

### Core Loop
0:00  — Lobby. Players join, see map, equip cosmetics. 60s countdown or 10/10 players ready
1:00  — Bus phase. Players ride flying bus across map. Jump out manually (30s window)
1:30  — Freefall + glide to chosen landing zone. Rush to nearest building for loot
2:00  — Loot phase. Find weapons, armor, healing. Zone 1 begins shrinking after 2 min
4:00  — Zone 1 closes. Players inside take 5 HP/s damage. Survivors pushed toward center
6:00  — Zone 2 forms. 20+ players remain. Engagements increase. Use cover.
8:00  — Zone 3. ~10 players. Every engagement is final circle territory.
10:00 — Final circle. Last 2-3 players. Very small zone forces confrontation.
11:00 — Winner. VICTORY ROYALE screen. Stats shown (kills, damage, survival time).
11:30 — Back to lobby. XP awarded based on placement + kills.

### Pitfalls
- Storm must shrink smoothly not teleport (lerp the visual circle each frame)
- Loot spawns need seeded randomization per round so map doesn't feel the same
- Dead players must spectate immediately (grief prevention: no ghost walking)
- Alive counter must be server-authoritative (client can't trust other clients)
- Inventory weight or slot limits prevent hoarding meta
- Zone damage must tick server-side not client-side (exploit prevention)
- First-circle players who land far away need enough time to reach zone (tune shrink speed)
`,

  sandbox: `
## Sandbox / Creative Build Game Architecture

### Explorer Tree
ServerScriptService/
  PlotManager.lua — claim plots, save/load builds per plot, plot ownership, visitor permissions
  BuildManager.lua — place/remove/paint parts server-side, validate within plot bounds
  DataManager.lua — save plotId, buildings list, coins, inventory, friend list
  EconomyManager.lua — earn coins from visitors, sell creations, trade items
  VisitManager.lua — teleport to friend plots, public plot browsing, ratings
ReplicatedStorage/
  Remotes/ — PlaceBlock, RemoveBlock, PaintBlock, ResizeBlock, SaveBuild, LoadBuild, VisitPlot, RatePlot, ClaimPlot
  Modules/
    BlockData.lua — {id, name, material, defaultColor, cost, category, maxStack}
    PlotData.lua — {id, size, location, maxBlocks, price}
    BuildSerializer.lua — serialize/deserialize builds as compact table
ServerStorage/
  PlotTemplates/ — empty plot base models
  StarterBlocks/ — free blocks given to new players
  SpecialBlocks/ — premium or unlockable block types
StarterGui/
  BuildToolbar/ — bottom row: selected block type, paint bucket, eraser, move, resize
  MaterialPicker/ — grid of materials/colors with search
  InventoryUI/ — owned blocks count per type
  PlotUI/ — plot name, visitor count, rating stars, save/publish buttons
  FriendPlotUI/ — list of friends and their plot thumbnails, visit button
  ShopUI/ — buy block packs, cosmetics, plot expansions

### Data Schema
{version=1, plotId=nil, coins=100, inventory={["Brick"]=100,["Wood"]=50}, buildings=[{blockId,position={x,y,z},rotation={rx,ry,rz},color={r,g,b},material="Brick"}], friends=[], plotName="My Plot", totalVisitors=0, rating=0}

### Core Loop
0:00  — Join world. Assigned a free plot. Tutorial: place first block.
0:02  — Browse block shop. Earn starter coins. Place blocks in grid with snapping.
0:05  — Build a structure. Paint it. Add detail with different materials.
0:10  — Publish plot. Friends can visit. Earn coins per visitor. Rate friends' plots.
0:20  — Buy plot expansion. Unlock premium blocks. Customize plot theme.
Ongoing — Compete for highest-rated plot. Enter build contests. Trade rare blocks.

### Pitfalls
- Grid snapping must be precise: snap position to nearest grid unit before saving
- Save/load serialization must capture ALL relevant part properties (color, material, size, rotation, not just position)
- Plot boundary enforcement server-side (client sends position, server validates within plot AABB)
- Block limit per plot (prevent lag from millions of parts: cap at 500-2000 depending on part complexity)
- Undo/redo system essential: keep action history stack (max 50 actions) on client, sync to server on confirm
- Visitors should be read-only (cannot modify another player's plot)
- Auto-save every 2 minutes to prevent loss on crash
`,

  sports: `
## Sports Game Architecture

### Explorer Tree
ServerScriptService/
  MatchManager.lua — queue→team assign→kickoff→play→halftime→play→final whistle→results
  BallPhysics.lua — ball ownership, kick force calculations, goal detection, out-of-bounds
  TeamManager.lua — balanced team assignment, score tracking, substitutions
  DataManager.lua — save wins, losses, goals, assists, MVPs, rating, career stats
  ReplayManager.lua — (optional) record last 10s, replay on goal scored
ReplicatedStorage/
  Remotes/ — KickBall, PassBall, Tackle, Shoot, ScoreGoal, StartMatch, EndMatch, RequestSubstitution
  Modules/
    MatchData.lua — {duration, halfTime, maxPlayers, teamsSize, overtimeRules}
    StadiumData.lua — {name, fieldSize, goalPositions, spawnPoints}
    PlayerStats.lua — {goals, assists, tackles, shotAccuracy, distanceCovered}
ServerStorage/
  BallModels/ — ball variants per sport (soccer, basketball, football)
  StadiumModels/ — different arena/field models
StarterGui/
  ScoreboardUI/ — team names, score, match timer (counts down), half indicator
  MinimapUI/ — bird's-eye minimap showing ball position and players
  StaminaBarUI/ — player stamina bar (sprinting drains, recovers over time)
  TeamDisplayUI/ — show team color, teammates list, formation
  GoalCelebrationUI/ — fullscreen goal scored overlay with scorer name, +1 score animation
  ResultsUI/ — final score, MVP award, personal stats, rewards
StarterPlayer/
  StarterCharacterScripts/
    StaminaController.lua — sprint stamina, slow when empty
    BallInteraction.lua — proximity check, ball control radius, dribbling feel

### Data Schema
{version=1, wins=0, losses=0, draws=0, goals=0, assists=0, mvps=0, rating=1000, gamesPlayed=0, careerGoals=0, favoritePosition="Forward"}

### Core Loop
0:00  — Queue solo or with friends. Auto-team balance. Select position preference.
0:01  — Match found. Load stadium. Teams shown. Kickoff from center.
0:02  — Play first half (5 min). Sprint to ball, tackle opponents, shoot on goal.
0:07  — Halftime. Score shown. Teams swap sides.
0:08  — Second half (5 min). Losing team presses harder. Close matches = tension.
0:13  — Full time whistle. Final score. MVP chosen (most goals + assists).
0:14  — Results screen. Rating change (+/- based on win/loss/performance). XP awarded.

### Pitfalls
- Ball physics inconsistent between clients: use server-authoritative ball position, replicate to clients
- Goal detection via workspace:GetPartsInPart() on goal volume (not Touched which has gaps)
- Offsides rule optional but adds depth for older audience
- Stamina prevents speed-hacking: validate sprint on server by checking velocity vs stamina
- Team imbalance ruins fun: auto-balance when new player joins, never allow >1 player difference
- Celebrating own goal (ball deflects off own player into own net) needs special handling
- Ball gets stuck in geometry: add small upward force if ball velocity < 0.1 for 2+ seconds
`,

  mystery_detective: `
## Mystery / Detective Game Architecture

### Explorer Tree
ServerScriptService/
  MysteryManager.lua — case selection, clue state, suspect tracking, reveal sequence, replay
  ClueTracker.lua — which clues found per player, unlock new areas on discovery, clue linking
  NPCManager.lua — dialogue trees, NPC schedule/location, reaction to accusations
  DataManager.lua — save solved cases, reputation, notebook, inventory, achievements
  AccusationManager.lua — validate accusation against solution, handle correct/wrong outcome
ReplicatedStorage/
  Remotes/ — ExamineClue, TalkToNPC, MakeAccusation, UnlockArea, OpenNotebook, LinkClues, RequestHint
  Modules/
    CaseData.lua — {id, title, victim, suspects[], clues[], solution, difficulty, timeLimit}
    ClueData.lua — {id, type, location, description, linkedClues[], revealsOnFind}
    SuspectData.lua — {name, alibi, motive, opportunity, dialogue{}, isGuilty}
    DialogueData.lua — {npcId, topic, response, unlockedBy, revealsClue}
ServerStorage/
  CrimeSceneModels/ — scene dressing per case
  ClueObjects/ — physical clue props (murder weapon, note, footprint decal)
  NPCModels/ — suspect character models
StarterGui/
  EvidenceBoardUI/ — cork board with photos, strings connecting clues (bezier curves between frames)
  NotebookUI/ — scrollable notes, discovered clues list, suspect profiles with rating sliders
  DialogueUI/ — NPC portrait, text box, choice buttons (Ask about alibi / motive / other suspect)
  CluePopupUI/ — appears when examining: clue image, description, "Add to board" button
  AccusationUI/ — pick suspect from grid, confirm accusation with dramatic reveal
  HintUI/ — pay reputation points for a hint arrow pointing to next undiscovered clue

### Data Schema
{version=1, solvedCases={}, currentCase=nil, reputation=100, notebook={clues=[],notes="",suspects={}}, inventory=[], achievements={}, stats={casesAttempted=0,hintsUsed=0,wrongAccusations=0}}

### Core Loop
0:00  — Case selection screen. Choose difficulty. Read crime summary. Enter scene.
0:02  — Explore crime scene. Examine objects. Clue popup appears. Added to evidence board.
0:05  — Find first physical clue. Unlocks NPC dialogue option. Talk to suspect #1.
0:08  — Suspect gives alibi. Dialogue choice: press them or accept. Links to new clue.
0:12  — Evidence board fills. Draw connections between clues (string lines). Pattern emerges.
0:18  — All main clues found. Accusation button unlocks. Red herrings may mislead.
0:20  — Make accusation. Dramatic reveal cutscene. Correct = reward + reputation up. Wrong = -reputation.
0:22  — Case solved. Stats shown. Next case unlocked.

### Pitfalls
- Branching narratives need careful state machine: track exactly which clues/dialogue are found
- Red herrings must feel fair in hindsight (don't make them lead nowhere, make them point to wrong suspect plausibly)
- Evidence board string connections can clip through UI elements: use ScreenGui Canvas with ZIndex layering
- NPC dialogue must gate properly: don't reveal solution clue before player has context clues
- Accusation with insufficient evidence should give a "you need more clues" message, not silently fail
- Multiple playthroughs need case rotation or randomized guilty suspect to prevent solution sharing
- Time limit (if used) should be optional/difficulty-based — never mandatory for casual players
`,
};

// ---------------------------------------------------------------------------
// INTENT DETECTION HELPERS
// ---------------------------------------------------------------------------
const INTENT_KEYWORDS: Record<string, string[]> = {
  tycoon: ['tycoon', 'dropper', 'conveyor', 'cash register', 'factory', 'business', 'money printer'],
  obby: ['obby', 'obstacle', 'parkour', 'checkpoint', 'kill brick', 'lava floor', 'jumping'],
  simulator: ['simulator', 'clicking', 'rebirth', 'pet', 'egg', 'hatching', 'power', 'auto-click'],
  rpg: ['rpg', 'quest', 'dungeon', 'level up', 'stats', 'inventory', 'boss fight', 'npc dialogue', 'experience points', 'mana'],
  horror: ['horror', 'scary', 'monster', 'jump scare', 'flashlight', 'hide', 'escape room', 'creepy', 'dark'],
  racing: ['racing', 'race track', 'vehicle', 'car', 'lap', 'speed', 'drift', 'nitro', 'boost'],
  roleplay: ['roleplay', 'rp', 'town', 'city life', 'job', 'house', 'drive around', 'school', 'hospital'],
  fighting: ['fighting', 'pvp', 'combat', 'arena', 'combo', 'martial arts', '1v1', 'ranked', 'elo'],
  tower_defense: ['tower defense', 'td', 'waves', 'tower placement', 'enemy path', 'turret', 'defend'],
  survival: ['survival', 'crafting', 'hunger', 'gather', 'base building', 'resources', 'craft', 'mine', 'harvest'],
  battle_royale: ['battle royale', 'br game', 'last player standing', 'shrinking zone', 'storm', 'loot drop', 'drop zone', 'parachute', 'bus', 'victory royale', 'pubg', 'fortnite style'],
  sandbox: ['sandbox', 'creative mode', 'build freely', 'plot', 'my plot', 'freeform build', 'place blocks', 'creative game', 'builder game', 'place anything'],
  sports: ['soccer', 'football', 'basketball', 'baseball', 'sports game', 'score goals', 'kick ball', 'dribble', 'stadium', 'team sport', 'match', 'referee'],
  mystery_detective: ['mystery', 'detective', 'solve crime', 'clue', 'whodunit', 'murder mystery', 'investigation', 'suspect', 'evidence board', 'accusation', 'crime scene'],
};

/**
 * Detects the game type from a user prompt.
 */
export function detectGameType(prompt: string): string | undefined {
  const lower = prompt.toLowerCase();
  let bestMatch: string | undefined;
  let bestScore = 0;

  for (const [gameType, keywords] of Object.entries(INTENT_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = gameType;
    }
  }

  return bestScore > 0 ? bestMatch : undefined;
}

/**
 * Returns relevant Roblox architecture context based on what the user is building.
 * Smart about token budget — returns only what's needed, max ~3000 chars per section.
 *
 * @param intent - The detected build intent: 'script', 'ui', 'building', 'terrain', 'game', 'general'
 * @param gameType - Optional game type: 'tycoon', 'obby', 'simulator', 'rpg', etc.
 * @returns Architecture knowledge string to inject into AI prompt
 */
export function getArchitectureKnowledge(intent: string, gameType?: string): string {
  const sections: string[] = [];

  // Always include a trimmed version of core architecture (service overview + scale + mistakes)
  // Full core is too long — select relevant subsections
  if (intent === 'script' || intent === 'ui' || intent === 'game') {
    // For scripting/UI/game intents, include service layout + networking + datastore summary
    sections.push(trimSection(CORE_ARCHITECTURE, [
      'Service Hierarchy',
      'Replication & Networking',
      'DataStore Patterns',
      'Scale Reference',
    ]));
  } else if (intent === 'building' || intent === 'terrain') {
    // For building intents, include part properties + scale + lighting + mistakes
    sections.push(trimSection(CORE_ARCHITECTURE, [
      'Part Properties',
      'Scale Reference',
      'Lighting Placement',
      'Common Build Mistakes',
    ]));
  } else {
    // General: compact summary of services + scale
    sections.push(trimSection(CORE_ARCHITECTURE, [
      'Service Hierarchy',
      'Scale Reference',
      'Common Build Mistakes',
    ]));
  }

  // Add game-type-specific architecture if detected
  if (gameType) {
    const specific = GAME_TYPE_ARCHITECTURE[gameType];
    if (specific) {
      // Trim to essential sections for token budget
      sections.push(specific.substring(0, 3000));
    }
  }

  // Add intent-specific deep patterns
  if (intent === 'script' || intent === 'ui' || intent === 'game') {
    sections.push(SCRIPTING_PATTERNS.substring(0, 3000));
  }
  if (intent === 'building' || intent === 'terrain') {
    sections.push(BUILD_PATTERNS.substring(0, 3000));
  }

  // Hard cap: never exceed 4000 chars total to leave room for other knowledge
  const combined = sections.join('\n\n');
  if (combined.length > 4000) {
    return combined.substring(0, 4000);
  }
  return combined;
}

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

/**
 * Extracts only the subsections matching the given headings from a large text block.
 * Keeps token count reasonable by returning only relevant content.
 */
function trimSection(fullText: string, headings: string[]): string {
  const lines = fullText.split('\n');
  const result: string[] = [];
  let capturing = false;
  let depth = 0;

  for (const line of lines) {
    // Check if this line is a heading we want
    const isTargetHeading = headings.some(h => line.includes(h));
    const headingMatch = line.match(/^(#{2,4})\s/);

    if (headingMatch) {
      const currentDepth = headingMatch[1].length;
      if (isTargetHeading) {
        capturing = true;
        depth = currentDepth;
        result.push(line);
        continue;
      } else if (capturing && currentDepth <= depth) {
        // Hit a same-level or higher heading — stop capturing
        capturing = false;
      }
    }

    if (capturing) {
      result.push(line);
    }
  }

  // If we got very little, return a compact version of the full text
  if (result.length < 10) {
    return fullText.substring(0, 2500);
  }

  return result.join('\n').substring(0, 3000);
}

// ---------------------------------------------------------------------------
// QUICK-ACCESS CONSTANTS (for direct import by other modules)
// ---------------------------------------------------------------------------

/** Minimal scale reference for injection into any build prompt */
export const SCALE_QUICK_REF = `Character=5.5tall/2wide, Door=4x7.5x0.5, Ceiling=11-12, Wall=0.5-1thick, Street=24-32wide, Window=3-5x4-6, Table=4x3x3, Chair=2x2x2.5, Stair=2x1x1.5, TreeTrunk=1-2dia/8-15tall, Lamp=0.5base/10-12tall, Fence=0.5thick/4tall`;

/** Material quick reference */
export const MATERIAL_QUICK_REF = `Walls:Concrete/Brick, Floors:WoodPlanks/Marble, Roofs:Slate/Concrete, Trim:Wood, Metal:Metal/DiamondPlate, Glass:Glass(trans0.3-0.5), Glow:Neon+PointLight, Nature:Grass/LeafyGrass/Sand, Stone:Granite/Cobblestone, Rustic:CorrodedMetal/Wood`;

/** Lighting quick reference */
export const LIGHTING_QUICK_REF = `PointLight:omni,Brightness1-4,Range15-40. SpotLight:cone,Angle30-90. SurfaceLight:panel. Warm=rgb(255,220,180). Cool=rgb(200,220,255). ALWAYS add PointLight to Neon parts. Every room needs 1+ light.`;
