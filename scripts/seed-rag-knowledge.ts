/**
 * RAG Knowledge Base Seeder
 *
 * Seeds the RobloxDocChunk table with Roblox API documentation, Luau language
 * reference, common game patterns, and best practices.
 *
 * Run: npx tsx scripts/seed-rag-knowledge.ts
 *
 * This populates the vector database that powers context-aware code generation.
 * Each chunk is embedded via Gemini and stored with pgvector for similarity search.
 */

// Load env vars
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

// ── Types ───────────────────────────────────────────────────────────────────

interface DocChunk {
  category: string
  title: string
  content: string
  source?: string
  tags?: string[]
}

// ── Embedding via Gemini ────────────────────────────────────────────────────

async function embedText(text: string): Promise<number[]> {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('GEMINI_API_KEY required')

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/text-embedding-004',
        content: { parts: [{ text: text.slice(0, 2048) }] },
        outputDimensionality: 768,
      }),
    },
  )

  if (!res.ok) throw new Error(`Embedding failed: ${res.status}`)
  const data = (await res.json()) as { embedding?: { values?: number[] } }
  return data.embedding?.values ?? []
}

async function ingestChunk(chunk: DocChunk): Promise<boolean> {
  try {
    const embedding = await embedText(`${chunk.category} ${chunk.title} ${chunk.content}`)
    if (embedding.length === 0) return false

    const vectorStr = `[${embedding.join(',')}]`

    await db.$executeRawUnsafe(
      `INSERT INTO "RobloxDocChunk" (id, category, title, content, source, tags, embedding, "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6::vector, NOW(), NOW())
       ON CONFLICT (category, title) DO UPDATE SET
         content = EXCLUDED.content,
         embedding = EXCLUDED.embedding,
         "updatedAt" = NOW()`,
      chunk.category,
      chunk.title,
      chunk.content,
      chunk.source ?? '',
      chunk.tags ?? [],
      vectorStr,
    )
    return true
  } catch (e) {
    console.error(`  ✗ Failed: ${chunk.title} — ${(e as Error).message}`)
    return false
  }
}

// ── Knowledge Base ──────────────────────────────────────────────────────────

const KNOWLEDGE_BASE: DocChunk[] = [

  // ═══════════════════════════════════════════════════════════════════════════
  // ROBLOX SERVICES API
  // ═══════════════════════════════════════════════════════════════════════════

  {
    category: 'service',
    title: 'Terrain API — FillBlock, FillBall, FillWedge, WriteVoxels',
    content: `workspace.Terrain is the global Terrain object.

Terrain:FillBlock(cframe: CFrame, size: Vector3, material: Enum.Material)
  Fills a block-shaped region. CFrame is the center. Size is full extents.
  Example: workspace.Terrain:FillBlock(CFrame.new(0, -5, 0), Vector3.new(512, 10, 512), Enum.Material.Grass)

Terrain:FillBall(center: Vector3, radius: number, material: Enum.Material)
  Fills a sphere. Great for hills, boulders, organic shapes.
  Example: workspace.Terrain:FillBall(Vector3.new(50, 10, 30), 20, Enum.Material.Rock)

Terrain:FillWedge(cframe: CFrame, size: Vector3, material: Enum.Material)
  Fills a wedge shape. CFrame orients the wedge. Used for ramps and slopes.

Terrain:FillCylinder(cframe: CFrame, height: number, radius: number, material: Enum.Material)
  Fills a cylinder. Great for tunnels, pillars.

Terrain materials: Grass, Sand, Rock, Slate, Snow, Mud, Ground, LeafyGrass, Sandstone, Limestone, Asphalt, Concrete, Cobblestone, Ice, Salt, Water, CrackedLava, Glacier, Basalt

Terrain voxel resolution is 4 studs. Sizes smaller than 4 studs may not render.`,
    tags: ['terrain', 'building', 'world'],
  },

  {
    category: 'service',
    title: 'DataStoreService — GetDataStore, GetAsync, SetAsync, UpdateAsync',
    content: `local DataStoreService = game:GetService("DataStoreService")
local store = DataStoreService:GetDataStore("StoreName")

store:GetAsync(key: string) -> any
  Retrieves data. ALWAYS wrap in pcall:
  local success, data = pcall(function() return store:GetAsync("player_" .. player.UserId) end)

store:SetAsync(key: string, value: any)
  Writes data. ALWAYS wrap in pcall. Maximum value size: 4MB.

store:UpdateAsync(key: string, callback: (oldValue) -> newValue)
  Atomic read-modify-write. Preferred over GetAsync+SetAsync for concurrent access.
  pcall(function() store:UpdateAsync("key", function(old) return (old or 0) + 1 end) end)

store:RemoveAsync(key: string) — Deletes a key.

Rate limits: 60 + numPlayers * 10 requests per minute per DataStore.
Budget: GetAsync costs 1 unit, SetAsync costs 1 unit. 60 base budget per minute.

Best practices:
- Save on PlayerRemoving AND on interval (every 30-60 seconds)
- Use UpdateAsync for concurrent-safe operations
- Always pcall — DataStore can fail due to throttling
- Use versioning: "PlayerData_v2" prefix for schema changes
- Don't save on every change — batch saves`,
    tags: ['datastore', 'persistence', 'save'],
  },

  {
    category: 'service',
    title: 'Players Service — PlayerAdded, PlayerRemoving, CharacterAdded',
    content: `local Players = game:GetService("Players")

Players.PlayerAdded:Connect(function(player: Player)
  -- Fires when a player joins. Set up leaderstats, load data here.
  local leaderstats = Instance.new("Folder")
  leaderstats.Name = "leaderstats"
  leaderstats.Parent = player

  local cash = Instance.new("IntValue")
  cash.Name = "Cash"
  cash.Value = 100
  cash.Parent = leaderstats
end)

Players.PlayerRemoving:Connect(function(player: Player)
  -- Fires when a player leaves. Save data here.
end)

player.CharacterAdded:Connect(function(character: Model)
  -- Fires when character spawns/respawns
  local humanoid = character:WaitForChild("Humanoid")
  humanoid.Health = humanoid.MaxHealth
end)

Key properties:
  player.UserId: number — Unique, persistent across sessions
  player.DisplayName: string — User's display name
  player.Team: Team? — Current team
  player.Character: Model? — Current character model (nil before spawn)
  player:GetMouse() — Returns Mouse object (LocalScript only)
  player:Kick(message?) — Removes player from game`,
    tags: ['players', 'join', 'leave', 'character'],
  },

  {
    category: 'service',
    title: 'TweenService — Create, TweenInfo, Animate properties',
    content: `local TweenService = game:GetService("TweenService")

local tweenInfo = TweenInfo.new(
  duration,          -- number (seconds)
  easingStyle,       -- Enum.EasingStyle (Quad, Sine, Back, Bounce, Elastic, Exponential, Quint, Linear)
  easingDirection,   -- Enum.EasingDirection (In, Out, InOut)
  repeatCount,       -- number (0 = play once, -1 = infinite)
  reverses,          -- boolean
  delayTime          -- number (seconds before start)
)

local tween = TweenService:Create(instance, tweenInfo, {PropertyName = targetValue})
tween:Play()
tween.Completed:Connect(function() print("Done") end)

Tweeable properties: Position, Size, CFrame, Color, BackgroundColor3, Transparency, TextTransparency, ImageTransparency, Rotation, AnchorPoint, BackgroundTransparency

Common patterns:
  -- Fade in a GUI
  local fade = TweenService:Create(frame, TweenInfo.new(0.3, Enum.EasingStyle.Quint, Enum.EasingDirection.Out), {BackgroundTransparency = 0})

  -- Slide a frame from off-screen
  frame.Position = UDim2.new(1.5, 0, 0.5, 0) -- start off-screen right
  TweenService:Create(frame, TweenInfo.new(0.4, Enum.EasingStyle.Quint), {Position = UDim2.new(0.5, 0, 0.5, 0)}):Play()

  -- Bounce a part
  TweenService:Create(part, TweenInfo.new(1, Enum.EasingStyle.Bounce, Enum.EasingDirection.Out), {Position = part.Position + Vector3.new(0, 10, 0)}):Play()`,
    tags: ['tween', 'animation', 'ui', 'gui'],
  },

  {
    category: 'service',
    title: 'RemoteEvent and RemoteFunction — Client-Server Communication',
    content: `RemoteEvents fire one-way. RemoteFunctions request+response.

-- SERVER: Create in ReplicatedStorage
local remote = Instance.new("RemoteEvent")
remote.Name = "DamageEvent"
remote.Parent = game:GetService("ReplicatedStorage")

-- SERVER: Listen
remote.OnServerEvent:Connect(function(player: Player, targetId: number, damage: number)
  -- ALWAYS validate on server. Never trust client values.
  if damage > MAX_DAMAGE then return end  -- prevent exploits
  if not canAttack(player) then return end
  -- Apply damage server-side
end)

-- CLIENT: Fire (LocalScript)
local remote = game:GetService("ReplicatedStorage"):WaitForChild("DamageEvent")
remote:FireServer(targetId, 25)

-- SERVER → CLIENT
remote:FireClient(player, data)
remote:FireAllClients(data)

RemoteFunction (request/response):
  -- Server
  remoteFunc.OnServerInvoke = function(player, ...)
    return result
  end
  -- Client
  local result = remoteFunc:InvokeServer(args)

SECURITY RULES:
1. NEVER trust client data. Always validate on server.
2. Rate-limit remote calls (track last fire time per player)
3. Sanity-check all values (damage ranges, position proximity)
4. Use RemoteEvent over RemoteFunction when possible (no yield)`,
    tags: ['remote', 'networking', 'client', 'server', 'security'],
  },

  {
    category: 'service',
    title: 'PathfindingService — NPC movement and navigation',
    content: `local PathfindingService = game:GetService("PathfindingService")

local path = PathfindingService:CreatePath({
  AgentRadius = 2,        -- character width
  AgentHeight = 5,        -- character height
  AgentCanJump = true,
  AgentCanClimb = false,
  WaypointSpacing = 4,    -- distance between waypoints
  Costs = {
    Water = 20,           -- avoid water
    DangerZone = math.huge -- impassable
  }
})

path:ComputeAsync(startPosition: Vector3, endPosition: Vector3)

if path.Status == Enum.PathStatus.Success then
  local waypoints = path:GetWaypoints()
  for _, waypoint in ipairs(waypoints) do
    humanoid:MoveTo(waypoint.Position)
    if waypoint.Action == Enum.PathWaypointAction.Jump then
      humanoid.Jump = true
    end
    humanoid.MoveToFinished:Wait()
  end
end

-- Handle path blocked
path.Blocked:Connect(function(blockedWaypointIndex)
  -- Recompute path
end)

NPC patrol pattern:
  local waypoints = {Vector3.new(0,0,0), Vector3.new(50,0,0), Vector3.new(50,0,50)}
  local currentWP = 1
  while true do
    path:ComputeAsync(npc.PrimaryPart.Position, waypoints[currentWP])
    -- walk waypoints...
    currentWP = currentWP % #waypoints + 1
    task.wait(2) -- pause at each point
  end`,
    tags: ['pathfinding', 'npc', 'ai', 'navigation'],
  },

  {
    category: 'service',
    title: 'Lighting — Atmosphere, Bloom, ColorCorrection, Time of Day',
    content: `local Lighting = game:GetService("Lighting")

-- Core properties
Lighting.Ambient = Color3.fromRGB(40, 40, 50)
Lighting.OutdoorAmbient = Color3.fromRGB(130, 130, 140)
Lighting.Brightness = 2
Lighting.ClockTime = 14.5  -- 0-24 (14.5 = 2:30 PM)
Lighting.GeographicLatitude = 30
Lighting.ShadowSoftness = 0.3  -- 0-1
Lighting.Technology = Enum.Technology.ShadowMap  -- or Voxel, Future
Lighting.FogEnd = 1000
Lighting.FogColor = Color3.fromRGB(180, 190, 200)
Lighting.EnvironmentDiffuseScale = 1
Lighting.EnvironmentSpecularScale = 1

-- Atmosphere (child of Lighting)
local atmo = Instance.new("Atmosphere")
atmo.Density = 0.35      -- 0-1 (fog density)
atmo.Offset = 0.25       -- vertical fog offset
atmo.Color = Color3.fromRGB(200, 210, 230)
atmo.Decay = Color3.fromRGB(100, 110, 130)
atmo.Glare = 0.1
atmo.Haze = 2
atmo.Parent = Lighting

-- Bloom (glow effect)
local bloom = Instance.new("BloomEffect")
bloom.Intensity = 0.5
bloom.Size = 30
bloom.Threshold = 0.9
bloom.Parent = Lighting

-- Color correction
local cc = Instance.new("ColorCorrectionEffect")
cc.Brightness = 0.02
cc.Contrast = 0.1
cc.Saturation = 0.15
cc.TintColor = Color3.fromRGB(255, 250, 245)
cc.Parent = Lighting

-- Sun rays
local rays = Instance.new("SunRaysEffect")
rays.Intensity = 0.08
rays.Spread = 0.7
rays.Parent = Lighting

PRESETS:
  Sunset: ClockTime=18, Ambient=RGB(60,40,30), warm orange Atmosphere
  Night: ClockTime=0, Ambient=RGB(10,10,20), low Brightness=0.5, dense fog
  Horror: ClockTime=2, FogEnd=100, dark Atmosphere, no Bloom
  Cartoon: High Brightness=3, saturated ColorCorrection, low ShadowSoftness`,
    tags: ['lighting', 'atmosphere', 'visual', 'mood'],
  },

  {
    category: 'service',
    title: 'SoundService — Music, SFX, Spatial Audio',
    content: `local SoundService = game:GetService("SoundService")

-- Background music (non-spatial, plays everywhere)
local music = Instance.new("Sound")
music.SoundId = "rbxassetid://ASSET_ID"
music.Volume = 0.3
music.Looped = true
music.Parent = SoundService  -- or workspace for spatial
music:Play()

-- Spatial sound (3D positional audio)
local sfx = Instance.new("Sound")
sfx.SoundId = "rbxassetid://ASSET_ID"
sfx.RollOffMinDistance = 10   -- full volume within this range
sfx.RollOffMaxDistance = 100  -- inaudible past this
sfx.Volume = 0.8
sfx.Parent = somePart  -- attaches to a Part's position
sfx:Play()

-- Sound groups (volume control categories)
local musicGroup = Instance.new("SoundGroup")
musicGroup.Name = "Music"
musicGroup.Volume = 0.5
musicGroup.Parent = SoundService

-- Common Roblox sound asset IDs:
-- 9125402735: ambient wind
-- 9125408835: footstep grass
-- 6677463885: UI click
-- 5765823065: coin collect
-- 4612373896: explosion
-- 1837849285: jump
-- 9125399555: water splash

PlaybackSpeed: 1 = normal, 0.5 = half speed, 2 = double
TimePosition: seek to specific point in seconds`,
    tags: ['sound', 'audio', 'music', 'sfx'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LUAU LANGUAGE REFERENCE
  // ═══════════════════════════════════════════════════════════════════════════

  {
    category: 'luau',
    title: 'Luau Type System — type annotations, generics, unions',
    content: `Luau has optional gradual typing.

-- Type annotations
local name: string = "hello"
local count: number = 42
local active: boolean = true
local data: {[string]: number} = {}
local list: {number} = {1, 2, 3}

-- Function signatures
local function greet(name: string, age: number?): string
  return "Hello " .. name
end

-- Type aliases
type Weapon = {
  name: string,
  damage: number,
  cooldown: number,
  rarity: "common" | "rare" | "legendary",
}

-- Union types
type Result = string | number
type MaybePlayer = Player?  -- shorthand for Player | nil

-- Generics (Luau uses angle brackets too, but no explicit syntax — use type functions)
-- Luau does NOT have TypeScript-style generics syntax.

-- Luau differences from Lua 5.1:
  - String interpolation: \`Hello {name}, you are {age}\`
  - Continue keyword: continue (skips to next loop iteration)
  - Compound assignments: += -= *= /= ..=
  - Type annotations: : type
  - if-then expressions: local x = if condition then a else b
  - Generalized iteration: for k, v in dict do (no pairs() needed)
  - table.freeze() — makes a table immutable
  - table.clone() — shallow copy
  - typeof() — returns type as string ("Instance", "Vector3", etc.)
  - buffer type for binary data`,
    tags: ['luau', 'types', 'language'],
  },

  {
    category: 'luau',
    title: 'Luau String Operations — interpolation, patterns, methods',
    content: `-- String interpolation (backticks)
local msg = \`Hello {player.Name}, you have {coins} coins\`

-- String methods (Luau uses string library, not methods on strings)
string.len(s), string.sub(s, i, j), string.find(s, pattern)
string.match(s, pattern), string.gmatch(s, pattern)
string.gsub(s, pattern, replacement)
string.format(fmt, ...) — like printf
string.lower(s), string.upper(s), string.rep(s, n)
string.split(s, separator) — returns {string}
string.byte(s), string.char(n)

-- Pattern matching (NOT regex — Lua patterns):
  %d = digit, %a = letter, %w = alphanumeric, %s = whitespace
  %u = uppercase, %l = lowercase, %p = punctuation
  . = any character, * = 0+, + = 1+, - = 0+ (lazy), ? = 0 or 1
  ^ = start, $ = end
  [] = character class, [^] = negated class
  () = capture group

-- Examples:
  string.match("player_123", "player_(%d+)")  -- "123"
  string.gsub("Hello World", "%u", string.lower)  -- "hello world"
  for word in string.gmatch("a,b,c", "[^,]+") do print(word) end`,
    tags: ['luau', 'string', 'text'],
  },

  {
    category: 'luau',
    title: 'Luau Table Operations — arrays, dictionaries, methods',
    content: `-- Arrays (integer-indexed)
local items = {"Sword", "Shield", "Potion"}
table.insert(items, "Bow")         -- append
table.insert(items, 2, "Helmet")   -- insert at index 2
table.remove(items, 1)             -- remove index 1
table.sort(items)                  -- sort in-place
table.find(items, "Sword")         -- returns index or nil
#items                             -- length

-- Dictionaries
local stats = {health = 100, speed = 16, damage = 25}
stats.armor = 50                   -- add key
stats.health = nil                 -- remove key

-- Generalized iteration (Luau — no pairs/ipairs needed)
for key, value in stats do
  print(key, value)
end

-- Table utilities
table.clone(t)    -- shallow copy
table.freeze(t)   -- make immutable (errors on write)
table.isfrozen(t) -- check if frozen
table.move(src, a, b, targetIndex, dst) -- bulk copy elements
table.create(n, value) -- pre-allocate array of n elements
table.clear(t)    -- remove all keys
table.concat(t, separator) -- join array to string
table.pack(...)   -- varargs to table
table.unpack(t)   -- table to varargs

-- Metatables
setmetatable(t, {
  __index = function(self, key) return defaults[key] end,
  __newindex = function(self, key, value) rawset(self, key, value) end,
  __tostring = function(self) return "MyObject" end,
})`,
    tags: ['luau', 'table', 'array', 'dictionary'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ROBLOX INSTANCE API
  // ═══════════════════════════════════════════════════════════════════════════

  {
    category: 'api',
    title: 'Instance.new — Creating objects, Parts, Models, GUIs',
    content: `Instance.new(className: string) -> Instance
  Creates a new Roblox object. Set Parent LAST (triggers Changed events).

-- Part
local part = Instance.new("Part")
part.Name = "Wall"
part.Size = Vector3.new(10, 8, 1)
part.CFrame = CFrame.new(0, 4, 0)
part.Anchored = true
part.Color = Color3.fromRGB(180, 150, 120)
part.Material = Enum.Material.Brick
part.TopSurface = Enum.SurfaceType.Smooth
part.BottomSurface = Enum.SurfaceType.Smooth
part.Parent = workspace

Part types: Part, WedgePart, CornerWedgePart, MeshPart, TrussPart, SpawnLocation
Part shapes: Enum.PartType.Block, Ball, Cylinder

-- Model (group of parts)
local model = Instance.new("Model")
model.Name = "House"
model.Parent = workspace
-- Set PrimaryPart for model:SetPrimaryPartCFrame()
model.PrimaryPart = somepart

-- SpecialMesh (modify Part shape without MeshPart)
local mesh = Instance.new("SpecialMesh")
mesh.MeshType = Enum.MeshType.Sphere  -- Sphere, Cylinder, Wedge, Head, FileMesh
mesh.Scale = Vector3.new(2, 2, 2)
mesh.Parent = part

-- WeldConstraint (connect two parts rigidly)
local weld = Instance.new("WeldConstraint")
weld.Part0 = basePart
weld.Part1 = attachedPart
weld.Parent = basePart

-- Decal (image on a surface)
local decal = Instance.new("Decal")
decal.Texture = "rbxassetid://TEXTURE_ID"
decal.Face = Enum.NormalId.Front
decal.Parent = part

-- SurfaceGui (GUI on a part's surface)
local gui = Instance.new("SurfaceGui")
gui.Face = Enum.NormalId.Front
gui.Parent = part
local label = Instance.new("TextLabel")
label.Size = UDim2.new(1, 0, 1, 0)
label.Text = "Hello"
label.Parent = gui`,
    tags: ['instance', 'part', 'model', 'create', 'building'],
  },

  {
    category: 'api',
    title: 'CFrame — Position, Rotation, Angles, LookAt',
    content: `CFrame represents position + orientation in 3D space.

-- Constructors
CFrame.new(x, y, z)                    -- position only
CFrame.new(pos: Vector3)               -- position from vector
CFrame.new(pos, lookAt: Vector3)       -- position looking at target
CFrame.Angles(rx, ry, rz)              -- rotation only (radians)
CFrame.fromEulerAnglesYXZ(y, x, z)     -- rotation (radians, YXZ order)
CFrame.lookAt(from, to, up?)           -- modern LookAt constructor

-- Combining position + rotation
CFrame.new(10, 5, 0) * CFrame.Angles(0, math.rad(45), 0)

-- Properties
cf.Position: Vector3
cf.LookVector: Vector3  -- forward direction
cf.RightVector: Vector3
cf.UpVector: Vector3
cf.X, cf.Y, cf.Z: number

-- Operations
cf1 * cf2          -- combine (apply cf2 relative to cf1)
cf * Vector3       -- transform a point
cf:Inverse()       -- invert
cf:Lerp(cf2, 0.5)  -- interpolate (0-1)
cf:ToWorldSpace(localCF)   -- local → world
cf:ToObjectSpace(worldCF)  -- world → local

-- Common patterns
-- Rotate part 45 degrees around Y axis:
part.CFrame = part.CFrame * CFrame.Angles(0, math.rad(45), 0)

-- Move part 10 studs forward (along its look direction):
part.CFrame = part.CFrame + part.CFrame.LookVector * 10

-- Place part on ground at position:
part.CFrame = CFrame.new(x, groundY + part.Size.Y/2, z)

math.rad(degrees) converts degrees → radians for CFrame.Angles`,
    tags: ['cframe', 'position', 'rotation', 'transform', 'building'],
  },

  {
    category: 'api',
    title: 'Color3 and Materials — Every Roblox Material with usage',
    content: `Color3.fromRGB(r, g, b)  -- 0-255 each
Color3.fromHSV(h, s, v)  -- 0-1 each
Color3.new(r, g, b)      -- 0-1 each (less intuitive)

BrickColor.new("Really red"), BrickColor.new("Institutional white")

-- All Roblox Materials and when to use them:
Enum.Material.SmoothPlastic   -- Default. Clean, modern surfaces. Furniture.
Enum.Material.Brick           -- Victorian/residential walls. Red-brown tones.
Enum.Material.Cobblestone     -- Medieval/castle walls. Gray tones.
Enum.Material.Concrete        -- Sidewalks, foundations, modern structures.
Enum.Material.WoodPlanks      -- Floors, doors, rustic walls, furniture.
Enum.Material.Wood            -- Smoother wood. Trim, panels.
Enum.Material.Metal           -- Industrial, gates, fences, machines.
Enum.Material.DiamondPlate    -- Factory floors, heavy-duty surfaces.
Enum.Material.CorrodedMetal   -- Rusted/decayed metal. Horror/industrial.
Enum.Material.Foil            -- Shiny, reflective metal surfaces.
Enum.Material.Granite         -- Paths, countertops, stone features.
Enum.Material.Marble          -- Elegant floors, countertops, pillars.
Enum.Material.Slate           -- Dark stone. Roofs, cliffs, dungeon walls.
Enum.Material.Glass           -- Windows, display cases. Use Transparency 0.3-0.6.
Enum.Material.Neon            -- Glowing signs, buttons, effects. Emits light.
Enum.Material.ForceField      -- Energy barriers, shields. Sci-fi.
Enum.Material.Ice             -- Slippery surfaces, winter themes.
Enum.Material.Fabric          -- Tents, awnings, curtains, cushions.
Enum.Material.Sand            -- Beach, desert terrain parts.
Enum.Material.Grass           -- Natural ground cover (not terrain).
Enum.Material.LeafyGrass      -- Dense vegetation, hedges.

-- Common color palettes:
Medieval: Walls RGB(140,130,120), Trim RGB(90,85,80), Roof RGB(80,70,60)
Modern: Walls RGB(230,230,230), Trim RGB(50,50,50), Accent RGB(41,128,185)
Victorian: Walls RGB(180,150,110), Trim RGB(100,75,50), Roof RGB(60,40,30)
Industrial: Walls RGB(90,85,80), Metal RGB(60,55,50), Rust RGB(120,70,40)
Fantasy: Stone RGB(160,155,145), Gold RGB(212,175,55), Purple RGB(100,50,150)`,
    tags: ['color', 'material', 'visual', 'building', 'style'],
  },

  {
    category: 'api',
    title: 'ScreenGui and UI Elements — Frames, Labels, Buttons, Layout',
    content: `-- GUI hierarchy: StarterGui > ScreenGui > Frame > Elements
local gui = Instance.new("ScreenGui")
gui.Name = "ShopGui"
gui.ResetOnSpawn = false  -- persist through death
gui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
gui.Parent = game:GetService("StarterGui")

-- Frame (container)
local frame = Instance.new("Frame")
frame.Size = UDim2.new(0.4, 0, 0.6, 0)     -- 40% width, 60% height
frame.Position = UDim2.new(0.3, 0, 0.2, 0)  -- centered
frame.AnchorPoint = Vector2.new(0.5, 0.5)   -- anchor at center
frame.BackgroundColor3 = Color3.fromRGB(25, 25, 35)
frame.BorderSizePixel = 0
frame.Parent = gui

-- Rounded corners
local corner = Instance.new("UICorner")
corner.CornerRadius = UDim.new(0, 12)
corner.Parent = frame

-- Stroke (border)
local stroke = Instance.new("UIStroke")
stroke.Color = Color3.fromRGB(60, 60, 80)
stroke.Thickness = 2
stroke.Parent = frame

-- TextLabel
local title = Instance.new("TextLabel")
title.Size = UDim2.new(1, 0, 0, 40)
title.BackgroundTransparency = 1
title.Text = "Shop"
title.TextColor3 = Color3.fromRGB(255, 255, 255)
title.TextSize = 24
title.Font = Enum.Font.GothamBold
title.Parent = frame

-- TextButton
local btn = Instance.new("TextButton")
btn.Size = UDim2.new(0, 200, 0, 50)
btn.Text = "Buy Sword — 100 Coins"
btn.TextColor3 = Color3.fromRGB(255, 255, 255)
btn.BackgroundColor3 = Color3.fromRGB(40, 120, 200)
btn.Font = Enum.Font.GothamBold
btn.TextSize = 18
btn.Parent = frame

-- Auto layout
local layout = Instance.new("UIListLayout")
layout.Padding = UDim.new(0, 8)
layout.HorizontalAlignment = Enum.HorizontalAlignment.Center
layout.SortOrder = Enum.SortOrder.LayoutOrder
layout.Parent = frame

-- UDim2 explained:
UDim2.new(scaleX, offsetX, scaleY, offsetY)
  Scale: 0-1 (% of parent). Offset: pixels.
  UDim2.new(0.5, 0, 0.5, 0) = center of parent
  UDim2.new(1, -20, 0, 40) = full width minus 20px, 40px tall`,
    tags: ['gui', 'ui', 'screen', 'button', 'frame'],
  },

  {
    category: 'api',
    title: 'ProximityPrompt — Player interaction triggers',
    content: `local prompt = Instance.new("ProximityPrompt")
prompt.ActionText = "Open Chest"
prompt.ObjectText = "Treasure Chest"
prompt.MaxActivationDistance = 10  -- studs
prompt.HoldDuration = 0           -- 0 = instant, >0 = hold to activate
prompt.RequiresLineOfSight = true
prompt.KeyboardKeyCode = Enum.KeyCode.E
prompt.Parent = somePart

prompt.Triggered:Connect(function(player: Player)
  -- Player activated the prompt
  print(player.Name .. " opened the chest")
end)

prompt.PromptShown:Connect(function(player) end)   -- player in range
prompt.PromptHidden:Connect(function(player) end)  -- player left range

-- Style
prompt.Style = Enum.ProximityPromptStyle.Default  -- or Custom
-- For custom: set Enabled=true and handle rendering yourself

Best practices:
- Parent to the Part players should interact with
- Set ObjectText to describe what they're interacting with
- Use HoldDuration > 0 for important/destructive actions
- Disable with prompt.Enabled = false when interaction is not available`,
    tags: ['proximity', 'interact', 'prompt', 'npc', 'chest'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // GAME PATTERNS
  // ═══════════════════════════════════════════════════════════════════════════

  {
    category: 'pattern',
    title: 'Server-Authoritative Architecture — Anti-Exploit Pattern',
    content: `RULE: The server is the source of truth. The client only displays and sends requests.

WRONG (exploitable):
  -- Client calculates damage and sends result
  remote:FireServer("dealDamage", targetId, 9999)  -- hacker changes damage

RIGHT (server validates):
  -- Client sends intent only
  remote:FireServer("attack", targetId)
  -- Server calculates damage based on weapon, distance, cooldown
  remote.OnServerEvent:Connect(function(player, targetId)
    local weapon = getPlayerWeapon(player)
    local target = findTarget(targetId)
    if not target then return end
    if (player.Character.PrimaryPart.Position - target.PrimaryPart.Position).Magnitude > weapon.range then return end
    if isOnCooldown(player) then return end
    target.Humanoid:TakeDamage(weapon.damage)
    setCooldown(player, weapon.cooldown)
  end)

SECURITY CHECKLIST:
1. Currency changes: server only (never let client set wallet)
2. Movement validation: check teleport distance per frame
3. Rate limiting: track remote fire timestamps per player
4. Inventory: server stores items, client displays them
5. Shop purchases: server checks balance AND deducts
6. Leaderboard stats: server-managed IntValues in leaderstats
7. DataStore writes: server only, pcall wrapped
8. Spawn items: server creates, client requests via remote`,
    tags: ['security', 'anti-exploit', 'server', 'architecture'],
  },

  {
    category: 'pattern',
    title: 'Tycoon Game Pattern — Dropper, Collector, Upgrader, Rebirth',
    content: `TYCOON ARCHITECTURE:

1. DROPPER: Spawns resource parts on a timer
  - Server Script in ServerScriptService
  - while true do task.wait(interval) ... spawnDrop() end
  - Drop = small Part with value attribute
  - Falls via gravity onto conveyor

2. CONVEYOR: Moves drops toward collector
  - Part with VelocityConstraint or BodyVelocity
  - Or: BasePart.AssemblyLinearVelocity = Vector3.new(5, 0, 0)

3. COLLECTOR: Touched event adds drop value to player currency
  - collector.Touched:Connect(function(hit)
      local drop = hit:FindFirstAncestor("Drop")
      if drop then addCurrency(player, drop:GetAttribute("Value")) drop:Destroy() end
    end)

4. UPGRADER: Multiplies drop value when it passes through
  - upgrader.Touched → drop:SetAttribute("Value", current * multiplier)

5. REBIRTH: Reset progress for permanent multiplier
  - Requires minimum currency threshold
  - Resets currency, keeps rebirth count
  - Each rebirth = higher earnings multiplier

6. PURCHASE BUTTONS: Buy upgrades, new droppers, decorations
  - ProximityPrompt or ClickDetector
  - Server validates balance → deducts → unlocks item

DATA STRUCTURE:
  {currency = 0, rebirths = 0, unlockedItems = {}, multiplier = 1}`,
    tags: ['tycoon', 'dropper', 'collector', 'game'],
  },

  {
    category: 'pattern',
    title: 'Simulator Game Pattern — Pets, Rebirths, Zones, Multipliers',
    content: `SIMULATOR ARCHITECTURE:

1. CLICK/TAP MECHANIC:
  - Player clicks/taps to earn primary stat (strength, coins, etc.)
  - ClickDetector or UserInputService
  - Each click: stat += basePower * multiplier * petBonus * rebirthBonus

2. ZONES (progressive areas):
  - Zone1 (free), Zone2 (requires 1000 strength), Zone3 (requires 10000)
  - Each zone has higher-value collectibles
  - Gate: Touched event checks stat, teleports if qualified

3. PET SYSTEM:
  - Eggs: Purchase for currency, random pet with rarity
  - Rarity: Common (60%), Uncommon (25%), Rare (10%), Legendary (4%), Mythic (1%)
  - Pets follow player, provide passive bonuses
  - Pet inventory stored in DataStore

4. REBIRTH:
  - Reset all stats for permanent multiplier
  - Rebirth 1 = 2x, Rebirth 2 = 3x, etc.
  - Requires reaching a stat threshold

5. DAILY REWARDS:
  - Track last login date in DataStore
  - Consecutive days = better rewards
  - Reset streak if gap > 1 day

6. SHOP:
  - Multipliers (2x clicks for 10 min)
  - Auto-clicker (passive income)
  - Pet storage expansion

SCALING FORMULA:
  earnings = base * (1 + rebirths * 0.5) * petMultiplier * gamepasses`,
    tags: ['simulator', 'pets', 'rebirth', 'clicking', 'game'],
  },

  {
    category: 'pattern',
    title: 'Obby Pattern — Checkpoints, Kill Bricks, Moving Platforms',
    content: `OBBY ARCHITECTURE:

1. CHECKPOINTS:
  - SpawnLocation parts numbered Stage1, Stage2, etc.
  - On touch: save stage number to player DataStore
  - On respawn: teleport to last checkpoint

  checkpoint.Touched:Connect(function(hit)
    local player = game:GetService("Players"):GetPlayerFromCharacter(hit.Parent)
    if player then
      local current = player:GetAttribute("Stage") or 0
      if stageNum > current then
        player:SetAttribute("Stage", stageNum)
        player.RespawnLocation = checkpoint
      end
    end
  end)

2. KILL BRICKS:
  - Neon red parts that kill on touch
  killBrick.Touched:Connect(function(hit)
    local hum = hit.Parent:FindFirstChild("Humanoid")
    if hum then hum.Health = 0 end
  end)

3. MOVING PLATFORMS:
  - TweenService loop between two positions
  - Set Network ownership to nil (server controls)
  platform:SetNetworkOwner(nil)

4. SPINNING OBSTACLES:
  - RunService.Heartbeat rotation
  - part.CFrame = part.CFrame * CFrame.Angles(0, math.rad(2), 0)

5. TIMER:
  - Start on Stage 1 touch, stop on final stage
  - Display via BillboardGui or ScreenGui
  - Save best time to DataStore`,
    tags: ['obby', 'obstacle', 'checkpoint', 'platformer'],
  },

  {
    category: 'pattern',
    title: 'Combat System Pattern — Hitboxes, Cooldowns, Health Bars',
    content: `COMBAT ARCHITECTURE:

1. HITBOX METHODS:
  a) Raycast (best for ranged/melee):
    local params = RaycastParams.new()
    params.FilterType = Enum.RaycastFilterType.Exclude
    params.FilterDescendantsInstances = {player.Character}
    local result = workspace:Raycast(origin, direction * range, params)
    if result and result.Instance then
      local target = result.Instance.Parent:FindFirstChild("Humanoid")
    end

  b) GetPartBoundsInBox (area attacks):
    local parts = workspace:GetPartBoundsInBox(cframe, size, overlapParams)

  c) Touched event (simple, less precise)

2. COOLDOWN SYSTEM:
  local lastAttack: {[number]: number} = {}
  function canAttack(player: Player): boolean
    local now = tick()
    local last = lastAttack[player.UserId] or 0
    if now - last < COOLDOWN then return false end
    lastAttack[player.UserId] = now
    return true
  end

3. DAMAGE APPLICATION (server-side only):
  humanoid:TakeDamage(amount)
  -- Or for custom: humanoid.Health = math.max(0, humanoid.Health - amount)

4. HEALTH BAR:
  - BillboardGui above head with Frame (background) + Frame (fill)
  - Update fill size: fill.Size = UDim2.new(health/maxHealth, 0, 1, 0)

5. KNOCKBACK:
  local bv = Instance.new("BodyVelocity")
  bv.Velocity = knockbackDirection * 50
  bv.MaxForce = Vector3.new(1e5, 1e5, 1e5)
  bv.Parent = targetRoot
  task.delay(0.3, function() bv:Destroy() end)`,
    tags: ['combat', 'fighting', 'damage', 'hitbox', 'pvp'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BUILDING BEST PRACTICES
  // ═══════════════════════════════════════════════════════════════════════════

  {
    category: 'building',
    title: 'Roblox Scale Reference — Character, Doors, Buildings, Furniture',
    content: `CHARACTER SCALE (R15):
  Total height: 5 studs (head to feet)
  Head: ~1.2 studs diameter
  Torso: 2 studs wide, 2 studs tall
  Arms: 1 stud wide each
  Shoulder width: 4 studs
  Eye level: ~4.5 studs from ground

ARCHITECTURAL SCALE:
  Door: 4 wide × 7 tall studs (standard walkthrough)
  Double door: 8 wide × 7 tall
  Ceiling height: 12 studs (comfortable, allows jumping)
  Wall thickness: 0.5-1 stud
  Stair step: 1.5 high × 2 deep studs
  Staircase width: 4-6 studs
  Hallway width: 6-8 studs
  Window: 2-3 wide × 2-3 tall studs
  Window sill height: 3 studs from floor

FURNITURE SCALE:
  Table: 4 wide × 3 deep × 3 tall studs
  Chair: 2 wide × 2 deep × 2 tall (seat) + 2 tall (back)
  Bed: 4 wide × 7 long × 2 tall studs
  Desk: 5 wide × 2.5 deep × 3 tall
  Shelf: 4 wide × 1 deep × 6 tall
  Sofa: 6 wide × 3 deep × 3 tall
  Counter: 4+ wide × 2 deep × 3.5 tall

EXTERIOR SCALE:
  Road: 12-16 studs wide
  Sidewalk: 4-6 studs wide
  Streetlight: 12-15 studs tall
  Tree: trunk 2×2, canopy 8-12 radius, total height 15-25 studs
  Fence: 3 studs tall
  Small building: 20×16 studs footprint
  Large building: 40×30+ studs footprint`,
    tags: ['scale', 'size', 'building', 'furniture', 'architecture'],
  },

  {
    category: 'building',
    title: 'Low-Poly Detail Techniques — Making builds look professional',
    content: `PRINCIPLE: Use many small Parts with varied materials/colors instead of few large flat ones.

WALL TEXTURE (brick coursing):
  - Add thin Parts (0.05 thick) on wall surfaces as mortar lines
  - Horizontal lines every 1 stud = brick rows
  - Vertical lines every 2 studs, staggered on alternating rows = brick pattern
  - Use trim color (darker shade of wall)

WAINSCOTING (lower wall panel):
  - Cover bottom 1/3 of wall with slightly raised panel (0.08 thick)
  - Use WoodPlanks material for traditional, SmoothPlastic for modern
  - Add chair rail (thin horizontal strip, 0.12 studs) at top of panel

CROWN MOLDING:
  - Thin strip (0.2 × 0.12) where wall meets ceiling
  - Same material as trim, darker color

WINDOW DETAIL:
  - Recess glass 0.3-0.5 studs into wall (depth creates shadow)
  - Add header bar (0.25 high) above window
  - Add sill (0.2 high, extends 0.3 studs outward) below
  - Add thin frame Parts around glass

DOOR DETAIL:
  - Recess door 0.2 studs into wall
  - Add header/lintel above
  - Add threshold strip below
  - Use WoodPlanks for traditional, SmoothPlastic for modern

CORNER DETAIL:
  - Pilaster strips (0.5-0.8 wide) at building corners
  - Slightly different color from main wall
  - Extends full height of each floor

ROOF DETAIL:
  - Overhang 1-1.5 studs past walls
  - Fascia board (0.4 high strip) along overhang edge
  - Pitched roofs: use WedgeParts, not rotated Parts

FLOOR TRANSITIONS:
  - Horizontal ledge strip between each floor (0.35 high, 0.3 proud of wall)
  - Darker trim color

SIGN/PLAQUE:
  - Thin Part (2.5 × 0.8 × 0.1) above door
  - SurfaceGui with TextLabel for building name`,
    tags: ['detail', 'lowpoly', 'building', 'architecture', 'polish'],
  },

  {
    category: 'building',
    title: 'Interior Design — Rooms, Furniture Placement, Lighting',
    content: `ROOM LAYOUT RULES:
  - Dividing walls: 0.3 studs thick, slightly shorter than ceiling (-0.4 studs gap)
  - Always leave doorway gaps: 3.5-4 studs wide
  - Each room needs its own floor material if types differ:
    Kitchen: Marble or Concrete, Living room: WoodPlanks, Bathroom: SmoothPlastic

FURNITURE CONSTRUCTION (multi-Part):
  BED:
    - Headboard: WoodPlanks, Color dark brown, 4 × 0.3 × 3 studs
    - Mattress: Fabric, Color white/light, 4 × 7 × 0.8 studs
    - Pillow: SmoothPlastic, Color white, 1.5 × 1 × 0.5 (Ball shape)
    - Blanket: Fabric, Color accent, 3.8 × 5 × 0.15, slightly draped

  TABLE:
    - Top: WoodPlanks, 4 × 3 × 0.3 studs
    - 4 legs: WoodPlanks, 0.3 × 2.7 × 0.3 studs at each corner

  BOOKSHELF:
    - Back: WoodPlanks, 4 × 0.2 × 6 studs
    - 2 sides: 0.2 × 1 × 6 studs
    - 3-4 shelves: 3.6 × 1 × 0.15 studs at even intervals
    - Books: small colored Parts on shelves (0.3 × 0.8 × 0.5)

  KITCHEN COUNTER:
    - Base cabinet: SmoothPlastic, 4 × 2 × 3 studs
    - Countertop: Marble, 4.2 × 2.2 × 0.2 studs (slightly overhangs)
    - Cabinet door lines: thin Parts (0.05 thick) on front face
    - Handles: small cylinders (0.1 × 0.3)

LIGHTING:
  - Ceiling light per room: Neon Part (0.6 × 0.2 × 0.6) + PointLight
  - Table lamps: cylinder base + cone shade (SpecialMesh) + PointLight
  - Under-cabinet: thin Neon strip + SpotLight facing down
  - Window glow: PointLight inside window glass (Brightness 1, Range 12-16)

DECORATION:
  - Picture frames: thin Part on wall with Decal
  - Rugs: thin Part (0.05 high) on floor, Fabric material, accent color
  - Plants: small ball Part (LeafyGrass) in cylinder pot`,
    tags: ['interior', 'furniture', 'room', 'house', 'design'],
  },

  {
    category: 'pattern',
    title: 'ChangeHistoryService — Undo Support for Studio Plugins',
    content: `local CHS = game:GetService("ChangeHistoryService")

-- ALWAYS wrap Studio modifications for undo support:
CHS:SetWaypoint("Before_MyBuild")

-- ... create parts, modify properties ...

CHS:SetWaypoint("After_MyBuild")

-- This lets users Ctrl+Z to undo the entire build at once.
-- Without this, undo would step through each individual property change.

-- Recording API (alternative, more precise):
local recording = CHS:TryBeginRecording("Build House")
if recording then
  -- ... do all modifications ...
  CHS:FinishRecording(recording, Enum.FinishRecordingOperation.Commit)
end

RULES:
1. Call SetWaypoint BEFORE and AFTER every batch of changes
2. Use descriptive waypoint names for the undo history
3. For plugins: always wrap in recording for clean undo
4. One waypoint per logical operation (not per part)`,
    tags: ['undo', 'history', 'plugin', 'studio'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ADDITIONAL SERVICES (from LemonadeClone research)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    category: 'service',
    title: 'CollectionService — Tags for Entity-Component Pattern',
    content: `local CollectionService = game:GetService("CollectionService")

-- Tag an instance
CollectionService:AddTag(part, "Lava")
CollectionService:AddTag(npc, "Enemy")

-- Get all tagged instances
local lavaBlocks = CollectionService:GetTagged("Lava")
for _, block in lavaBlocks do
  block.Touched:Connect(function(hit)
    local hum = hit.Parent:FindFirstChild("Humanoid")
    if hum then hum:TakeDamage(10) end
  end)
end

-- Listen for new tagged instances (spawned later)
CollectionService:GetInstanceAddedSignal("Enemy"):Connect(function(enemy)
  setupEnemyAI(enemy)
end)
CollectionService:GetInstanceRemovedSignal("Enemy"):Connect(function(enemy)
  cleanupEnemy(enemy)
end)

-- Remove tag
CollectionService:RemoveTag(part, "Lava")
CollectionService:HasTag(part, "Lava") -- returns boolean

USE CASES:
- Tag all "Lava" parts → single script handles damage
- Tag all "Interactable" objects → single interaction system
- Tag "Enemy" NPCs → one AI controller manages all
- Tag "Checkpoint" spawns → one checkpoint system
- Entity-Component pattern: Tags = Components, Scripts = Systems`,
    tags: ['collection', 'tag', 'component', 'entity', 'pattern'],
  },

  {
    category: 'service',
    title: 'RunService — Heartbeat, RenderStepped, game loops',
    content: `local RunService = game:GetService("RunService")

-- Server-side game loop (60 FPS physics step)
RunService.Heartbeat:Connect(function(deltaTime: number)
  -- deltaTime = seconds since last frame (~0.016 at 60fps)
  -- Use for physics, NPC updates, timers
  position += velocity * deltaTime
end)

-- Client-side render loop (before each frame renders)
-- LocalScript ONLY — errors on server
RunService.RenderStepped:Connect(function(deltaTime)
  -- Use for camera, UI updates, visual effects
  -- WARNING: Must disconnect when done or causes memory leak
end)

-- Stepped (before physics simulation)
RunService.Stepped:Connect(function(time, deltaTime)
  -- Use for input processing before physics
end)

-- Detect environment
RunService:IsServer()   -- true on server
RunService:IsClient()   -- true on client
RunService:IsStudio()   -- true in Roblox Studio

-- IMPORTANT: Always disconnect when no longer needed
local connection = RunService.Heartbeat:Connect(fn)
-- later:
connection:Disconnect()

-- Common pattern: frame-independent movement
local speed = 50 -- studs per second
RunService.Heartbeat:Connect(function(dt)
  part.CFrame = part.CFrame + part.CFrame.LookVector * speed * dt
end)`,
    tags: ['runservice', 'heartbeat', 'render', 'gameloop', 'performance'],
  },

  {
    category: 'service',
    title: 'UserInputService — Keyboard, Mouse, Touch, Gamepad',
    content: `local UserInputService = game:GetService("UserInputService")
-- LocalScript ONLY

-- Key press detection
UserInputService.InputBegan:Connect(function(input, gameProcessed)
  if gameProcessed then return end -- ignore if typing in chat/GUI

  if input.KeyCode == Enum.KeyCode.E then
    print("E pressed — interact")
  elseif input.KeyCode == Enum.KeyCode.Space then
    print("Space — jump")
  elseif input.KeyCode == Enum.KeyCode.One then
    equipSlot(1)
  end
end)

UserInputService.InputEnded:Connect(function(input, gameProcessed)
  -- Key/button released
end)

-- Mouse
UserInputService:GetMouseLocation() -- Vector2
UserInputService.MouseBehavior = Enum.MouseBehavior.LockCenter -- FPS style

-- Touch (mobile)
UserInputService.TouchStarted:Connect(function(touch, gameProcessed) end)
UserInputService.TouchMoved:Connect(function(touch, gameProcessed) end)
UserInputService.TouchEnded:Connect(function(touch, gameProcessed) end)

-- Check device type
UserInputService.TouchEnabled     -- mobile/tablet
UserInputService.KeyboardEnabled  -- PC
UserInputService.GamepadEnabled   -- console/controller
UserInputService.MouseEnabled     -- has mouse

-- Gamepad
UserInputService.GamepadConnected:Connect(function(gamepadNum) end)
UserInputService:GetGamepadState(Enum.UserInputType.Gamepad1)`,
    tags: ['input', 'keyboard', 'mouse', 'touch', 'controls'],
  },

  {
    category: 'service',
    title: 'MarketplaceService — Game Passes, Developer Products, Purchases',
    content: `local MPS = game:GetService("MarketplaceService")

-- Check if player owns a game pass
local owns = MPS:UserOwnsGamePassAsync(player.UserId, GAMEPASS_ID)
if owns then
  -- Grant VIP perks, 2x cash, etc.
end

-- Prompt purchase
MPS:PromptGamePassPurchase(player, GAMEPASS_ID)
MPS:PromptProductPurchase(player, PRODUCT_ID) -- developer products (consumable)

-- Handle purchases (SERVER SCRIPT — this is REQUIRED for dev products)
MPS.ProcessReceipt = function(receiptInfo)
  local player = game:GetService("Players"):GetPlayerByUserId(receiptInfo.PlayerId)
  if not player then return Enum.ProductPurchaseDecision.NotProcessedYet end

  local productId = receiptInfo.ProductId
  if productId == COINS_PRODUCT_ID then
    addCoins(player, 100)
  elseif productId == SPEED_BOOST_ID then
    boostSpeed(player, 60) -- 60 seconds
  end

  return Enum.ProductPurchaseDecision.PurchaseGranted
end

-- Handle game pass purchase callback
MPS.PromptGamePassPurchaseFinished:Connect(function(player, passId, purchased)
  if purchased then
    grantGamePassPerks(player, passId)
  end
end)

-- Get product info
local info = MPS:GetProductInfo(assetId, Enum.InfoType.Asset)
print(info.Name, info.PriceInRobux)`,
    tags: ['marketplace', 'gamepass', 'purchase', 'robux', 'monetization'],
  },

  {
    category: 'service',
    title: 'ReplicatedStorage — Shared modules, RemoteEvents, assets',
    content: `local ReplicatedStorage = game:GetService("ReplicatedStorage")

-- ReplicatedStorage is visible to BOTH server and client
-- Use for: shared modules, RemoteEvents/Functions, shared assets

-- Store RemoteEvents here
local remotes = Instance.new("Folder")
remotes.Name = "Remotes"
remotes.Parent = ReplicatedStorage

local damageRemote = Instance.new("RemoteEvent")
damageRemote.Name = "DamageEvent"
damageRemote.Parent = remotes

-- Store shared ModuleScripts here
-- Client requires: local Utils = require(ReplicatedStorage.Modules.Utils)
-- Server requires: local Utils = require(ReplicatedStorage.Modules.Utils)

-- Store shared assets (Models, Sounds, Particles)
-- Clone from here to workspace:
local template = ReplicatedStorage.Assets.SwordModel:Clone()
template.Parent = workspace

-- DO NOT put here:
-- Server-only code (use ServerScriptService or ServerStorage)
-- Sensitive data (clients can read everything in ReplicatedStorage)
-- Large assets that clients don't need (wastes bandwidth)

-- ServerStorage: Server-only storage (invisible to clients)
local ServerStorage = game:GetService("ServerStorage")
-- Put server-only modules, secret data, admin tools here`,
    tags: ['replicated', 'storage', 'shared', 'remote', 'module'],
  },

  {
    category: 'pattern',
    title: 'Roblox Anti-Patterns — Top 20 Mistakes to Avoid',
    content: `1. TRUSTING CLIENT DATA: Never let client set health, currency, damage values
2. USING wait(): Always use task.wait() — wait() is deprecated and less precise
3. USING spawn(): Always use task.spawn() — spawn() has inconsistent timing
4. SetAsync FOR SAVES: Use UpdateAsync() — it's atomic, SetAsync can lose data
5. MISSING pcall: ALL DataStore/HTTP calls can fail — always pcall
6. ANCHORED = false ON STATIC PARTS: Static parts MUST be Anchored = true
7. PARENT FIRST: Set Part.Parent LAST after all properties — avoids extra events
8. CLIENT-SIDE DATASTORES: DataStoreService only works on server
9. GLOBAL VARIABLES: Always use "local" — globals leak between scripts
10. INFINITE LOOPS WITHOUT YIELD: while true do without task.wait() freezes the thread
11. FINDFIRSTCHILD().PROPERTY: Can be nil — use WaitForChild or nil check
12. UNDISCONNECTED EVENTS: Store connection, call :Disconnect() when done
13. RENDERSTEPPED ON SERVER: RenderStepped is client-only — use Heartbeat on server
14. STRING KEYS IN DATASTORE: Use "player_" .. UserId, not player.Name (names change)
15. MODIFYING OTHER PLAYERS: Server should modify, not client reaching across
16. TOO MANY REMOTES: Batch updates, don't fire per-frame
17. PAIRS/IPAIRS: Luau supports generalized iteration — "for k,v in t do" works
18. GAME.WORKSPACE: Use game:GetService("Workspace") or just workspace global
19. NOT USING ATTRIBUTES: Use instance:SetAttribute() instead of creating ValueObjects
20. HARDCODED ASSET IDS: Store in ModuleScript config, not scattered through code`,
    tags: ['antipattern', 'mistakes', 'bugs', 'best-practices'],
  },

]

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🧠 ForjeGames RAG Knowledge Seeder`)
  console.log(`   Seeding ${KNOWLEDGE_BASE.length} documentation chunks...\n`)

  let success = 0
  let failed = 0

  for (let i = 0; i < KNOWLEDGE_BASE.length; i++) {
    const chunk = KNOWLEDGE_BASE[i]
    process.stdout.write(`  [${i + 1}/${KNOWLEDGE_BASE.length}] ${chunk.category}/${chunk.title}...`)

    const ok = await ingestChunk(chunk)
    if (ok) {
      success++
      console.log(' ✓')
    } else {
      failed++
      console.log(' ✗')
    }

    // Gentle rate limiting for Gemini embedding API
    if ((i + 1) % 10 === 0) {
      await new Promise((r) => setTimeout(r, 500))
    }
  }

  console.log(`\n   Done: ${success} ingested, ${failed} failed`)
  console.log(`   Total chunks in DB: ${await db.robloxDocChunk.count()}\n`)

  await db.$disconnect()
}

main().catch((e) => {
  console.error('Seeder failed:', e)
  process.exit(1)
})
