/**
 * Roblox API Knowledge Base — Contextual code generation intelligence
 *
 * This is our version of what Lemonade calls "selectively passing our own
 * contextual Roblox data in each prompt." When a user asks for a script,
 * we match their intent to relevant API snippets and inject them into the
 * AI's context. This dramatically improves code quality and reduces
 * hallucinations.
 */

import 'server-only'

export interface RobloxAPISnippet {
  /** API or service name */
  name: string
  /** Keywords that trigger this snippet */
  keywords: string[]
  /** Code snippet showing correct usage */
  snippet: string
  /** Common mistakes the AI should avoid */
  pitfalls: string[]
}

// ── Knowledge entries ────────────────────────────────────────────────────────

const ROBLOX_KNOWLEDGE: RobloxAPISnippet[] = [
  {
    name: 'DataStoreService',
    keywords: ['save', 'load', 'data', 'persist', 'store', 'database', 'datastore', 'player data', 'leaderboard'],
    snippet: `-- DataStoreService (ALWAYS wrap in pcall)
local DataStoreService = game:GetService("DataStoreService")
local playerStore = DataStoreService:GetDataStore("PlayerData")

local function loadData(player: Player)
  local success, data = pcall(function()
    return playerStore:GetAsync("Player_" .. player.UserId)
  end)
  if success and data then
    -- Apply loaded data
  else
    -- Use defaults
  end
end

local function saveData(player: Player, data: {[string]: any})
  local success, err = pcall(function()
    playerStore:UpdateAsync("Player_" .. player.UserId, function(old)
      return data -- Return new value to save
    end)
  end)
  if not success then warn("Save failed:", err) end
end

game.Players.PlayerAdded:Connect(loadData)
game.Players.PlayerRemoving:Connect(function(player)
  saveData(player, collectPlayerData(player))
end)`,
    pitfalls: [
      'NEVER call DataStore methods without pcall — they throw on failure',
      'Use UpdateAsync instead of SetAsync to avoid data loss from race conditions',
      'DataStore has rate limits: 60 + numPlayers * 10 requests/min',
      'Keys must be ≤ 50 chars, values ≤ 4MB',
      'Always save on PlayerRemoving AND game:BindToClose',
    ],
  },
  {
    name: 'RemoteEvent / RemoteFunction',
    keywords: ['remote', 'server', 'client', 'fire', 'invoke', 'network', 'replicate', 'communicate', 'event'],
    snippet: `-- Server→Client and Client→Server communication
-- RemoteEvent: fire-and-forget (preferred for most cases)
-- RemoteFunction: request-response (use sparingly — client can hang server)

-- SERVER SCRIPT:
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local remoteEvent = Instance.new("RemoteEvent")
remoteEvent.Name = "GameEvent"
remoteEvent.Parent = ReplicatedStorage

-- Listen for client→server
remoteEvent.OnServerEvent:Connect(function(player: Player, action: string, data: any)
  -- ALWAYS validate input from clients (never trust the client)
  if typeof(action) ~= "string" then return end
  if action == "Purchase" then
    -- Validate on server, never client
  end
end)

-- Fire to one client
remoteEvent:FireClient(player, "Update", data)
-- Fire to all clients
remoteEvent:FireAllClients("Broadcast", data)

-- LOCAL SCRIPT:
local remoteEvent = ReplicatedStorage:WaitForChild("GameEvent")
remoteEvent.OnClientEvent:Connect(function(action, data)
  -- Handle server→client messages
end)
remoteEvent:FireServer("Purchase", itemId)`,
    pitfalls: [
      'NEVER trust data from FireServer — clients can send anything. Always validate on server.',
      'RemoteFunction:InvokeClient can hang the server if client disconnects — prefer RemoteEvent',
      'Put RemoteEvents in ReplicatedStorage, not ServerStorage',
      'Rate-limit client→server events to prevent spam',
    ],
  },
  {
    name: 'TweenService',
    keywords: ['tween', 'animate', 'smooth', 'move', 'interpolate', 'transition', 'ease', 'lerp', 'slide', 'fade'],
    snippet: `local TweenService = game:GetService("TweenService")

local part = workspace.MyPart
local info = TweenInfo.new(
  1,                           -- Duration (seconds)
  Enum.EasingStyle.Quad,       -- Easing style
  Enum.EasingDirection.Out,    -- Easing direction
  0,                           -- Repeat count (0 = no repeat, -1 = infinite)
  false,                       -- Reverses
  0                            -- Delay before start
)

local tween = TweenService:Create(part, info, {
  Position = Vector3.new(0, 10, 0),
  Transparency = 0.5,
})
tween:Play()
tween.Completed:Wait() -- Yields until done`,
    pitfalls: [
      'Only tweenable properties work (Position, Size, Color, Transparency, CFrame, etc.)',
      'Cannot tween BrickColor — use Color3 instead',
      'Destroy tweens when done if creating many: tween:Destroy()',
    ],
  },
  {
    name: 'UserInputService',
    keywords: ['input', 'keyboard', 'mouse', 'key', 'press', 'click', 'touch', 'gamepad', 'mobile', 'controls'],
    snippet: `-- LOCAL SCRIPT ONLY (UserInputService is client-side)
local UserInputService = game:GetService("UserInputService")

UserInputService.InputBegan:Connect(function(input, gameProcessed)
  if gameProcessed then return end -- Ignore when typing in chat/textbox

  if input.KeyCode == Enum.KeyCode.E then
    -- E key pressed
  end

  if input.UserInputType == Enum.UserInputType.MouseButton1 then
    -- Left click
  end
end)

-- Check if key is currently held
if UserInputService:IsKeyDown(Enum.KeyCode.LeftShift) then
  -- Shift is held
end

-- Mobile detection
local isMobile = UserInputService.TouchEnabled and not UserInputService.KeyboardEnabled`,
    pitfalls: [
      'UserInputService is CLIENT ONLY — never use in ServerScript',
      'Always check gameProcessed to avoid stealing input from chat/GUI',
      'Use ContextActionService for actions that can be rebound',
      'For mobile, add touch buttons (ImageButton in ScreenGui)',
    ],
  },
  {
    name: 'Humanoid / Character',
    keywords: ['character', 'player', 'humanoid', 'health', 'walk', 'jump', 'speed', 'death', 'respawn', 'sprint', 'dash'],
    snippet: `local Players = game:GetService("Players")

Players.PlayerAdded:Connect(function(player)
  player.CharacterAdded:Connect(function(character)
    local humanoid = character:WaitForChild("Humanoid") :: Humanoid

    -- Set properties
    humanoid.WalkSpeed = 16       -- Default: 16
    humanoid.JumpHeight = 7.2     -- Default: 7.2 (or JumpPower = 50)
    humanoid.MaxHealth = 100
    humanoid.Health = 100

    -- Detect death
    humanoid.Died:Connect(function()
      print(player.Name .. " died")
      -- Custom respawn logic
      task.wait(3)
      player:LoadCharacter()
    end)
  end)
end)

-- Access existing player's character
local player = Players.LocalPlayer -- LocalScript only
local character = player.Character or player.CharacterAdded:Wait()
local humanoid = character:WaitForChild("Humanoid") :: Humanoid`,
    pitfalls: [
      'Always use CharacterAdded — character may not exist when PlayerAdded fires',
      'Use WaitForChild for Humanoid — it loads async',
      'Clean up connections on death/respawn to prevent memory leaks',
      'JumpPower is deprecated — use JumpHeight instead',
      'HumanoidRootPart is the root CFrame — use it for teleporting',
    ],
  },
  {
    name: 'CollectionService',
    keywords: ['tag', 'collection', 'group', 'category', 'tagged', 'npc', 'enemy', 'collectible', 'pickup'],
    snippet: `local CollectionService = game:GetService("CollectionService")

-- Tag objects in Studio or via script
CollectionService:AddTag(part, "Collectible")

-- Get all tagged objects
for _, item in CollectionService:GetTagged("Collectible") do
  -- Setup each collectible
  setupCollectible(item)
end

-- React to new tagged objects (streaming/replication)
CollectionService:GetInstanceAddedSignal("Collectible"):Connect(setupCollectible)
CollectionService:GetInstanceRemovedSignal("Collectible"):Connect(cleanupCollectible)`,
    pitfalls: [
      'Always handle GetInstanceAddedSignal for streaming — tagged objects may load later',
      'Tags persist across save/load — no need to re-tag on startup',
    ],
  },
  {
    name: 'ProximityPrompt',
    keywords: ['interact', 'proximity', 'prompt', 'press', 'action', 'pickup', 'talk', 'npc', 'door', 'open'],
    snippet: `-- ProximityPrompt: built-in interaction system (no custom UI needed)
local prompt = Instance.new("ProximityPrompt")
prompt.ActionText = "Open"           -- Text shown on prompt
prompt.ObjectText = "Chest"          -- Object name shown
prompt.MaxActivationDistance = 10     -- Studs
prompt.HoldDuration = 0              -- 0 = instant, >0 = hold to activate
prompt.RequiresLineOfSight = true
prompt.Parent = workspace.Chest      -- Attach to the interactable object

-- SERVER SCRIPT (handles the action)
prompt.Triggered:Connect(function(player: Player)
  -- Player interacted with this prompt
  print(player.Name .. " opened the chest")
end)`,
    pitfalls: [
      'ProximityPrompt.Triggered fires on SERVER — use for game logic',
      'ProximityPrompt.PromptShown/Hidden fire on CLIENT — use for UI effects',
      'Set Exclusivity to OnePerButton to prevent multiple prompts activating',
    ],
  },
  {
    name: 'RunService',
    keywords: ['loop', 'update', 'frame', 'heartbeat', 'renderstepped', 'stepped', 'physics', 'every frame', 'continuous'],
    snippet: `local RunService = game:GetService("RunService")

-- Server: use Heartbeat (runs after physics, 60Hz)
RunService.Heartbeat:Connect(function(deltaTime: number)
  -- deltaTime = seconds since last frame
  -- Use for server-side continuous logic
end)

-- Client: use RenderStepped (runs before rendering, 60Hz)
-- WARNING: RenderStepped is CLIENT ONLY
RunService.RenderStepped:Connect(function(deltaTime: number)
  -- Use for camera, UI, visual effects
end)

-- Check environment
if RunService:IsServer() then
  -- Server code
elseif RunService:IsClient() then
  -- Client code
end`,
    pitfalls: [
      'RenderStepped is CLIENT ONLY — use Heartbeat on server',
      'Always multiply movement by deltaTime for frame-rate independence',
      'Disconnect RunService connections when not needed — they are expensive',
      'Use task.spawn or task.defer for one-off async work, not RunService loops',
    ],
  },
  {
    name: 'UI / ScreenGui',
    keywords: ['gui', 'ui', 'screen', 'button', 'label', 'frame', 'text', 'image', 'hud', 'menu', 'shop', 'inventory'],
    snippet: `-- LOCAL SCRIPT (UI is client-side)
local Players = game:GetService("Players")
local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

-- Create a ScreenGui
local screenGui = Instance.new("ScreenGui")
screenGui.Name = "GameHUD"
screenGui.ResetOnSpawn = false  -- Keep UI across respawns
screenGui.Parent = playerGui

-- Create a frame
local frame = Instance.new("Frame")
frame.Size = UDim2.new(0, 300, 0, 200)       -- 300x200 pixels
frame.Position = UDim2.new(0.5, -150, 0.5, -100) -- Centered
frame.BackgroundColor3 = Color3.fromRGB(30, 30, 30)
frame.BorderSizePixel = 0
frame.Parent = screenGui

-- Add corner rounding
local corner = Instance.new("UICorner")
corner.CornerRadius = UDim.new(0, 12)
corner.Parent = frame

-- Add a button
local button = Instance.new("TextButton")
button.Size = UDim2.new(0.8, 0, 0, 40)
button.Position = UDim2.new(0.1, 0, 1, -50)
button.Text = "Close"
button.TextColor3 = Color3.new(1, 1, 1)
button.BackgroundColor3 = Color3.fromRGB(212, 175, 55)
button.Parent = frame

button.Activated:Connect(function()
  screenGui.Enabled = false
end)`,
    pitfalls: [
      'UI must be in LocalScript — ServerScripts cannot create/modify GUI',
      'Use UDim2 for responsive sizing, not absolute pixels',
      'Set ResetOnSpawn = false for persistent UI',
      'Use Activated instead of MouseButton1Click for cross-platform (touch + mouse)',
      'Add UIListLayout/UIGridLayout for auto-arranging children',
    ],
  },
  {
    name: 'task library',
    keywords: ['wait', 'delay', 'spawn', 'defer', 'async', 'coroutine', 'thread', 'timer', 'cooldown', 'debounce'],
    snippet: `-- Modern Luau task library (replaces deprecated wait/spawn/delay)
task.wait(1)                    -- Yields for 1 second (replaces wait())
task.spawn(function()           -- Runs immediately in new thread (replaces spawn())
  -- Non-blocking work
end)
task.defer(function()           -- Runs at end of current resumption cycle
  -- Cleanup work
end)
task.delay(2, function()        -- Runs after 2 seconds (replaces delay())
  -- Delayed work
end)

-- Debounce pattern (prevent double-activation)
local debounce: {[Player]: boolean} = {}
remote.OnServerEvent:Connect(function(player, ...)
  if debounce[player] then return end
  debounce[player] = true
  -- Do work
  task.delay(1, function()
    debounce[player] = nil
  end)
end)`,
    pitfalls: [
      'NEVER use wait() — it is deprecated. Use task.wait()',
      'NEVER use spawn() — it is deprecated. Use task.spawn()',
      'NEVER use delay() — it is deprecated. Use task.delay()',
      'task.wait() minimum is ~0.03s (one frame), not exactly 0',
    ],
  },
  {
    name: 'Debris',
    keywords: ['destroy', 'cleanup', 'remove', 'temporary', 'lifetime', 'garbage', 'debris', 'expire'],
    snippet: `local Debris = game:GetService("Debris")

-- Auto-destroy after N seconds (prevents memory leaks)
local effect = Instance.new("Part")
effect.Parent = workspace
Debris:AddItem(effect, 5)  -- Destroyed after 5 seconds

-- For connections, manually disconnect
local connection = event:Connect(handler)
task.delay(5, function()
  connection:Disconnect()
end)`,
    pitfalls: [
      'Always clean up temporary parts/effects — memory leaks kill performance',
      'Debris:AddItem is more reliable than task.delay + :Destroy()',
      'Disconnect event connections when objects are destroyed',
    ],
  },
  {
    name: 'Lighting / Atmosphere',
    keywords: ['light', 'lighting', 'atmosphere', 'fog', 'sky', 'sun', 'moon', 'time', 'day', 'night', 'bloom', 'color correction', 'ambient'],
    snippet: `local Lighting = game:GetService("Lighting")

-- Time of day
Lighting.ClockTime = 14          -- 2:00 PM (0-24 range)
Lighting.GeographicLatitude = 40 -- Affects sun angle

-- Ambient light
Lighting.Ambient = Color3.fromRGB(40, 40, 50)
Lighting.OutdoorAmbient = Color3.fromRGB(80, 80, 90)
Lighting.Brightness = 2

-- Atmosphere effect
local atmosphere = Instance.new("Atmosphere")
atmosphere.Density = 0.3
atmosphere.Offset = 0.25
atmosphere.Color = Color3.fromRGB(199, 199, 199)
atmosphere.Decay = Color3.fromRGB(92, 92, 92)
atmosphere.Glare = 0
atmosphere.Haze = 1
atmosphere.Parent = Lighting

-- Post-processing
local bloom = Instance.new("BloomEffect")
bloom.Intensity = 0.5
bloom.Size = 24
bloom.Threshold = 0.8
bloom.Parent = Lighting

local colorCorrection = Instance.new("ColorCorrectionEffect")
colorCorrection.Brightness = 0.05
colorCorrection.Contrast = 0.1
colorCorrection.Saturation = 0.15
colorCorrection.Parent = Lighting`,
    pitfalls: [
      'ClockTime is 0-24, NOT 0-12',
      'Atmosphere affects all outdoor areas — use Fog for localized effects',
      'Too many post-processing effects tanks mobile performance',
    ],
  },
  {
    name: 'MarketplaceService',
    keywords: ['purchase', 'buy', 'shop', 'gamepass', 'game pass', 'dev product', 'developer product', 'monetize', 'robux', 'receipt', 'premium'],
    snippet: `-- SERVER SCRIPT (MarketplaceService must be handled on server)
local MarketplaceService = game:GetService("MarketplaceService")
local Players = game:GetService("Players")

local SPEED_BOOST_PRODUCT_ID = 123456789 -- Replace with real ID
local VIP_GAMEPASS_ID = 987654321        -- Replace with real ID

-- ProcessReceipt: MUST return Enum.ProductPurchaseDecision
-- This fires for every dev product purchase (consumables)
MarketplaceService.ProcessReceipt = function(receiptInfo): Enum.ProductPurchaseDecision
  local player = Players:GetPlayerByUserId(receiptInfo.PlayerId)
  if not player then
    return Enum.ProductPurchaseDecision.NotProcessedYet
  end

  local success, err = pcall(function()
    if receiptInfo.ProductId == SPEED_BOOST_PRODUCT_ID then
      local character = player.Character
      if character then
        local humanoid = character:FindFirstChildOfClass("Humanoid")
        if humanoid then
          humanoid.WalkSpeed = 32
          task.delay(60, function()
            if humanoid and humanoid.Parent then
              humanoid.WalkSpeed = 16
            end
          end)
        end
      end
    end
  end)

  if success then
    return Enum.ProductPurchaseDecision.PurchaseGranted
  else
    warn("ProcessReceipt failed:", err)
    return Enum.ProductPurchaseDecision.NotProcessedYet
  end
end

-- Check if player owns a game pass
local function hasGamePass(player: Player, gamePassId: number): boolean
  local success, owns = pcall(function()
    return MarketplaceService:UserOwnsGamePassAsync(player.UserId, gamePassId)
  end)
  return success and owns
end

-- Prompt a purchase from client via remote
-- CLIENT: MarketplaceService:PromptGamePassPurchase(player, VIP_GAMEPASS_ID)
-- CLIENT: MarketplaceService:PromptProductPurchase(player, SPEED_BOOST_PRODUCT_ID)`,
    pitfalls: [
      'ProcessReceipt MUST return Enum.ProductPurchaseDecision — if it errors, the purchase retries forever',
      'Only ONE ProcessReceipt callback can exist — handle ALL products in a single function',
      'UserOwnsGamePassAsync can throw — always wrap in pcall',
      'Dev products are consumable (repeatable), game passes are one-time — use the right one',
    ],
  },
  {
    name: 'SoundService / Sound',
    keywords: ['sound', 'audio', 'music', 'sfx', 'play sound', 'spatial', 'volume', 'soundtrack', 'ambience', 'sound group', 'soundgroup'],
    snippet: `local SoundService = game:GetService("SoundService")

-- Background music (non-positional, plays everywhere)
local music = Instance.new("Sound")
music.SoundId = "rbxassetid://1234567890" -- Replace with real asset ID
music.Looped = true
music.Volume = 0.5
music.Parent = SoundService -- Parent to SoundService for global audio
music:Play()

-- Spatial sound (3D positioned, attached to a part)
local doorSound = Instance.new("Sound")
doorSound.SoundId = "rbxassetid://9876543210"
doorSound.RollOffMaxDistance = 50  -- Max hearing distance (studs)
doorSound.RollOffMinDistance = 10  -- Full volume distance
doorSound.RollOffMode = Enum.RollOffMode.InverseTapered
doorSound.Volume = 1
doorSound.Parent = workspace.Door  -- Parent to part for 3D positioning

-- SoundGroups for volume control (e.g., separate music/SFX sliders)
local sfxGroup = Instance.new("SoundGroup")
sfxGroup.Name = "SFX"
sfxGroup.Volume = 0.8
sfxGroup.Parent = SoundService

local musicGroup = Instance.new("SoundGroup")
musicGroup.Name = "Music"
musicGroup.Volume = 0.5
musicGroup.Parent = SoundService

-- Assign sounds to groups
music.SoundGroup = musicGroup
doorSound.SoundGroup = sfxGroup

-- Fade music in/out with TweenService
local TweenService = game:GetService("TweenService")
local fadeOut = TweenService:Create(music, TweenInfo.new(2), {Volume = 0})
fadeOut:Play()
fadeOut.Completed:Wait()
music:Stop()`,
    pitfalls: [
      'Parent Sound to SoundService for global audio, to a Part for 3D spatial audio',
      'SoundId must be a valid rbxassetid — uploading audio requires verification for sounds > 6 seconds',
      'Use SoundGroups for volume categories (Music, SFX, Ambience) so players can adjust independently',
      'Always preload sounds with ContentProvider:PreloadAsync() for instant playback',
    ],
  },
  {
    name: 'Workspace.Terrain',
    keywords: ['terrain', 'landscape', 'generate', 'voxel', 'biome', 'water', 'grass', 'sand', 'mountain', 'fill', 'heightmap', 'ground'],
    snippet: `-- Terrain manipulation (SERVER SCRIPT)
local terrain = workspace.Terrain

-- Fill a region with material
local cframe = CFrame.new(0, -10, 0)   -- Center position
local size = Vector3.new(200, 20, 200)  -- Size in studs
terrain:FillBlock(cframe, size, Enum.Material.Grass)

-- Fill a sphere (great for caves, craters)
terrain:FillBall(Vector3.new(50, 0, 50), 15, Enum.Material.Air) -- Dig a hole
terrain:FillBall(Vector3.new(-50, 5, -50), 20, Enum.Material.Rock) -- Add rock hill

-- Fill a cylinder (tunnels, pillars)
local tunnelCFrame = CFrame.new(0, 0, 0) * CFrame.Angles(0, 0, math.rad(90))
terrain:FillCylinder(tunnelCFrame, 50, 5, Enum.Material.Air) -- Horizontal tunnel

-- Water
terrain:FillBlock(CFrame.new(0, -2, 0), Vector3.new(100, 4, 100), Enum.Material.Water)

-- Read voxels in a region (for analysis/modification)
local region = Region3.new(Vector3.new(-10, -10, -10), Vector3.new(10, 10, 10))
region = region:ExpandToGrid(4) -- Terrain resolution is 4 studs
local materials, occupancies = terrain:ReadVoxels(region, 4)

-- Write voxels back (advanced terrain editing)
terrain:WriteVoxels(region, 4, materials, occupancies)

-- Terrain colors (customize biome palette)
terrain:SetMaterialColor(Enum.Material.Grass, Color3.fromRGB(60, 120, 30))
terrain:SetMaterialColor(Enum.Material.Sand, Color3.fromRGB(220, 200, 150))

-- Clear all terrain
-- terrain:Clear() -- USE WITH CAUTION`,
    pitfalls: [
      'Terrain resolution is 4 studs — smaller details are impossible with voxels',
      'ReadVoxels/WriteVoxels regions must be aligned to 4-stud grid (use ExpandToGrid)',
      'FillBlock/FillBall with Enum.Material.Air removes terrain (good for caves/tunnels)',
      'Large terrain operations can cause lag — break into chunks with task.wait() between',
    ],
  },
  {
    name: 'PathfindingService',
    keywords: ['pathfinding', 'navigate', 'npc', 'ai', 'walk to', 'follow', 'waypoint', 'enemy ai', 'patrol', 'chase', 'move to'],
    snippet: `-- NPC pathfinding (SERVER SCRIPT)
local PathfindingService = game:GetService("PathfindingService")

local npc = workspace.NPC
local humanoid = npc:WaitForChild("Humanoid") :: Humanoid
local rootPart = npc:WaitForChild("HumanoidRootPart") :: BasePart

local function moveTo(targetPosition: Vector3)
  local path = PathfindingService:CreatePath({
    AgentRadius = 2,          -- NPC collision radius
    AgentHeight = 5,          -- NPC height
    AgentCanJump = true,      -- Allow jumping
    AgentCanClimb = false,    -- Allow climbing TrussParts
    WaypointSpacing = 4,      -- Distance between waypoints
    Costs = {                 -- Material costs (higher = avoid)
      Water = 20,
      Mud = 5,
    },
  })

  local success, err = pcall(function()
    path:ComputeAsync(rootPart.Position, targetPosition)
  end)

  if not success then
    warn("Path computation failed:", err)
    return
  end

  if path.Status ~= Enum.PathStatus.Success then
    warn("No path found")
    return
  end

  local waypoints = path:GetWaypoints()

  -- Handle path blocked mid-traversal
  local blockedConnection: RBXScriptConnection?
  blockedConnection = path.Blocked:Connect(function(blockedWaypointIdx)
    blockedConnection:Disconnect()
    moveTo(targetPosition) -- Recalculate
  end)

  for i, waypoint in waypoints do
    if waypoint.Action == Enum.PathWaypointAction.Jump then
      humanoid.Jump = true
    end
    humanoid:MoveTo(waypoint.Position)
    local reached = humanoid.MoveToFinished:Wait()
    if not reached then
      blockedConnection:Disconnect()
      moveTo(targetPosition) -- Retry if stuck
      return
    end
  end

  if blockedConnection then
    blockedConnection:Disconnect()
  end
end

-- Example: chase closest player
task.spawn(function()
  while task.wait(1) do
    local closestPlayer, closestDist = nil, math.huge
    for _, player in game.Players:GetPlayers() do
      local char = player.Character
      if char and char:FindFirstChild("HumanoidRootPart") then
        local dist = (char.HumanoidRootPart.Position - rootPart.Position).Magnitude
        if dist < closestDist then
          closestDist = dist
          closestPlayer = char
        end
      end
    end
    if closestPlayer and closestDist < 100 then
      moveTo(closestPlayer.HumanoidRootPart.Position)
    end
  end
end)`,
    pitfalls: [
      'ComputeAsync can throw — always wrap in pcall',
      'Always handle path.Blocked to recalculate when obstacles appear',
      'MoveToFinished can return false if NPC gets stuck — implement retry logic',
      'Recalculate paths periodically when chasing moving targets',
    ],
  },
  {
    name: 'PhysicsService',
    keywords: ['collision', 'collision group', 'physics', 'no collide', 'pass through', 'trigger', 'overlap', 'collision filter', 'phantom'],
    snippet: `-- Collision groups (SERVER SCRIPT)
local PhysicsService = game:GetService("PhysicsService")

-- Register collision groups
PhysicsService:RegisterCollisionGroup("Players")
PhysicsService:RegisterCollisionGroup("Enemies")
PhysicsService:RegisterCollisionGroup("Projectiles")
PhysicsService:RegisterCollisionGroup("Triggers") -- Walk-through zones

-- Configure which groups collide with each other
PhysicsService:CollisionGroupSetCollidable("Players", "Players", false)       -- Players pass through each other
PhysicsService:CollisionGroupSetCollidable("Players", "Triggers", false)      -- Players pass through triggers
PhysicsService:CollisionGroupSetCollidable("Projectiles", "Projectiles", false) -- Bullets pass through bullets
PhysicsService:CollisionGroupSetCollidable("Projectiles", "Players", false)   -- Own projectiles pass through players (use raycasting for hits)

-- Assign parts to groups
local function setCollisionGroup(instance: Instance, groupName: string)
  if instance:IsA("BasePart") then
    instance.CollisionGroup = groupName
  end
  for _, child in instance:GetChildren() do
    setCollisionGroup(child, groupName)
  end
end

-- Set player collision group on spawn
game.Players.PlayerAdded:Connect(function(player)
  player.CharacterAdded:Connect(function(character)
    setCollisionGroup(character, "Players")
  end)
end)`,
    pitfalls: [
      'Collision groups must be registered before use — call RegisterCollisionGroup first',
      'CollisionGroup is a property on BasePart (string name), not a separate API',
      'Maximum 32 collision groups per game',
      'Collision groups are server-authoritative — set them in ServerScripts',
    ],
  },
  {
    name: 'ReplicatedFirst',
    keywords: ['loading', 'loading screen', 'preload', 'splash', 'startup', 'first', 'replicated first', 'content provider', 'asset loading'],
    snippet: `-- LocalScript in ReplicatedFirst (runs BEFORE anything else loads)
local ReplicatedFirst = game:GetService("ReplicatedFirst")
local ContentProvider = game:GetService("ContentProvider")
local Players = game:GetService("Players")
local TweenService = game:GetService("TweenService")

-- Remove default Roblox loading screen
ReplicatedFirst:RemoveDefaultLoadingScreen()

local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

-- Create custom loading screen
local loadingGui = Instance.new("ScreenGui")
loadingGui.Name = "LoadingScreen"
loadingGui.IgnoreGuiInset = true
loadingGui.DisplayOrder = 999
loadingGui.Parent = playerGui

local background = Instance.new("Frame")
background.Size = UDim2.new(1, 0, 1, 0)
background.BackgroundColor3 = Color3.fromRGB(10, 10, 15)
background.Parent = loadingGui

local statusLabel = Instance.new("TextLabel")
statusLabel.Size = UDim2.new(0.6, 0, 0, 30)
statusLabel.Position = UDim2.new(0.2, 0, 0.6, 0)
statusLabel.BackgroundTransparency = 1
statusLabel.TextColor3 = Color3.fromRGB(212, 175, 55)
statusLabel.TextSize = 18
statusLabel.Font = Enum.Font.GothamBold
statusLabel.Text = "Loading..."
statusLabel.Parent = background

-- Preload critical assets
local assetsToLoad = {
  game:GetService("ReplicatedStorage"):WaitForChild("GameAssets"),
  -- Add specific assets, models, images, sounds
}

local totalAssets = #assetsToLoad
for i, asset in assetsToLoad do
  statusLabel.Text = string.format("Loading assets... %d/%d", i, totalAssets)
  ContentProvider:PreloadAsync({asset})
end

-- Wait for character
statusLabel.Text = "Waiting for character..."
if not player.Character then
  player.CharacterAdded:Wait()
end

-- Fade out loading screen
statusLabel.Text = "Ready!"
task.wait(0.5)
local fadeOut = TweenService:Create(background, TweenInfo.new(1), {BackgroundTransparency = 1})
fadeOut:Play()
TweenService:Create(statusLabel, TweenInfo.new(0.5), {TextTransparency = 1}):Play()
fadeOut.Completed:Wait()
loadingGui:Destroy()`,
    pitfalls: [
      'ReplicatedFirst scripts run BEFORE ReplicatedStorage is loaded — use WaitForChild',
      'Call RemoveDefaultLoadingScreen() to replace the Roblox loading screen',
      'ContentProvider:PreloadAsync blocks the thread — show progress to the player',
      'Set IgnoreGuiInset = true on loading ScreenGui to cover the entire screen',
    ],
  },
  {
    name: 'BadgeService',
    keywords: ['badge', 'award', 'achievement', 'unlock', 'medal', 'trophy', 'earn badge', 'badge service'],
    snippet: `-- SERVER SCRIPT (BadgeService is server-only)
local BadgeService = game:GetService("BadgeService")
local Players = game:GetService("Players")

local BADGES = {
  Welcome = 123456789,       -- Replace with real badge IDs
  FirstKill = 234567890,
  Speedrunner = 345678901,
  Explorer = 456789012,
}

local function awardBadge(player: Player, badgeName: string)
  local badgeId = BADGES[badgeName]
  if not badgeId then
    warn("Unknown badge:", badgeName)
    return false
  end

  -- Check if player already owns the badge (avoids unnecessary API calls)
  local hasSuccess, hasBadge = pcall(function()
    return BadgeService:UserHasBadgeAsync(player.UserId, badgeId)
  end)

  if not hasSuccess then
    warn("Failed to check badge ownership:", hasBadge)
    return false
  end

  if hasBadge then
    return false -- Already has it
  end

  -- Award the badge
  local awardSuccess, err = pcall(function()
    BadgeService:AwardBadge(player.UserId, badgeId)
  end)

  if awardSuccess then
    print(player.Name .. " earned badge: " .. badgeName)
    return true
  else
    warn("Failed to award badge:", err)
    return false
  end
end

-- Example: award on first join
Players.PlayerAdded:Connect(function(player)
  awardBadge(player, "Welcome")
end)`,
    pitfalls: [
      'BadgeService is SERVER ONLY — cannot call from LocalScripts',
      'AwardBadge and UserHasBadgeAsync can throw — always wrap in pcall',
      'Check UserHasBadgeAsync before awarding to reduce unnecessary API calls',
      'Badges must be created in the Game Settings on roblox.com first',
    ],
  },
  {
    name: 'TeleportService',
    keywords: ['teleport', 'place', 'universe', 'server', 'reserved', 'travel', 'warp', 'lobby', 'matchmaking', 'private server'],
    snippet: `-- SERVER SCRIPT
local TeleportService = game:GetService("TeleportService")
local Players = game:GetService("Players")

local LOBBY_PLACE_ID = 123456789   -- Replace with real place ID
local GAME_PLACE_ID = 987654321    -- Replace with real place ID

-- Teleport a single player to another place
local function teleportPlayer(player: Player, placeId: number)
  local success, err = pcall(function()
    TeleportService:TeleportAsync(placeId, {player})
  end)
  if not success then
    warn("Teleport failed:", err)
    -- Retry once after delay
    task.delay(2, function()
      pcall(function()
        TeleportService:TeleportAsync(placeId, {player})
      end)
    end)
  end
end

-- Teleport a group to a reserved server (private match / party)
local function teleportParty(players: {Player}, placeId: number)
  local success, privateServerId = pcall(function()
    return TeleportService:ReserveServer(placeId)
  end)
  if not success then
    warn("Failed to reserve server:", privateServerId)
    return
  end

  local tpSuccess, err = pcall(function()
    TeleportService:TeleportToPrivateServer(placeId, privateServerId, players)
  end)
  if not tpSuccess then
    warn("Party teleport failed:", err)
  end
end

-- Handle teleport failures on the receiving end
TeleportService.TeleportInitFailed:Connect(function(player, result, errorMessage)
  warn(player.Name .. " teleport failed:", result.Name, errorMessage)
  -- Could retry or send back to lobby
end)

-- Retrieve data sent with teleport
local teleportData = TeleportService:GetLocalPlayerTeleportData() -- Client only`,
    pitfalls: [
      'TeleportAsync can fail — always wrap in pcall and implement retry logic',
      'Use ReserveServer for private matches — regular teleports go to public servers',
      'Handle TeleportInitFailed to catch failures on the destination place',
      'Teleport data must be JSON-serializable (no Instances, CFrames, etc.)',
    ],
  },
  {
    name: 'TextService',
    keywords: ['filter', 'chat', 'text', 'censor', 'moderation', 'user input', 'profanity', 'filter string', 'safe text', 'text input'],
    snippet: `-- SERVER SCRIPT (text filtering MUST happen on server)
local TextService = game:GetService("TextService")

-- Filter user-generated text (REQUIRED by Roblox ToS for ALL user text input)
local function filterText(text: string, fromPlayerId: number, toPlayerId: number?): string
  local success, result = pcall(function()
    local textObject = TextService:FilterStringAsync(text, fromPlayerId)
    if toPlayerId then
      -- For private messages (player-to-player)
      return textObject:GetChatForUserAsync(toPlayerId)
    else
      -- For public broadcast (signs, billboards, names)
      return textObject:GetNonChatStringForBroadcastAsync()
    end
  end)

  if success then
    return result
  else
    warn("Text filter failed:", result)
    return "###" -- Return censored placeholder on failure
  end
end

-- Example: player-named pet
local remoteEvent = game:GetService("ReplicatedStorage"):WaitForChild("NamePet")
remoteEvent.OnServerEvent:Connect(function(player: Player, petName: string)
  -- Validate input type
  if typeof(petName) ~= "string" then return end
  if #petName > 20 then return end -- Length limit

  -- MUST filter before displaying
  local filtered = filterText(petName, player.UserId)
  -- Apply filtered name to the pet
  local pet = player:FindFirstChild("Pet")
  if pet then
    pet:SetAttribute("DisplayName", filtered)
  end
end)`,
    pitfalls: [
      'ALL user-generated text MUST be filtered — this is a Roblox ToS requirement, not optional',
      'FilterStringAsync MUST be called on the SERVER — never trust client-side filtering',
      'Use GetNonChatStringForBroadcastAsync for public text, GetChatForUserAsync for private messages',
      'If filtering fails, default to censored text ("###") — NEVER show unfiltered text',
    ],
  },
  {
    name: 'ContextActionService',
    keywords: ['action', 'bind', 'rebind', 'mobile button', 'context action', 'custom controls', 'keybind', 'controller', 'input action', 'touch button'],
    snippet: `-- LOCAL SCRIPT (ContextActionService is client-side)
local ContextActionService = game:GetService("ContextActionService")

-- Bind an action to keys (rebindable, with mobile button)
local function onAttack(actionName: string, inputState: Enum.UserInputState, inputObject: InputObject)
  if inputState ~= Enum.UserInputState.Begin then return end
  -- Perform attack
  print("Attack!")
end

ContextActionService:BindAction(
  "Attack",                          -- Action name (unique)
  onAttack,                          -- Callback function
  true,                              -- Create touch button on mobile
  Enum.KeyCode.F,                    -- Key binding 1
  Enum.KeyCode.ButtonR1              -- Gamepad binding
)

-- Customize the mobile button
local attackButton = ContextActionService:GetButton("Attack")
if attackButton then
  attackButton.Image = "rbxassetid://1234567890"
  attackButton.Size = UDim2.new(0, 70, 0, 70)
  attackButton.Position = UDim2.new(1, -80, 1, -160)
end

-- Bind action with priority (higher priority gets input first)
ContextActionService:BindActionAtPriority(
  "Sprint",
  function(_, inputState)
    if inputState == Enum.UserInputState.Begin then
      -- Start sprinting
    elseif inputState == Enum.UserInputState.End then
      -- Stop sprinting
    end
  end,
  true,                              -- Create touch button
  2000,                              -- Priority (higher = first)
  Enum.KeyCode.LeftShift,
  Enum.KeyCode.ButtonL3              -- Gamepad left stick click
)

-- Unbind when no longer needed
ContextActionService:UnbindAction("Attack")`,
    pitfalls: [
      'Use ContextActionService over UserInputService when actions can be rebound',
      'Set createTouchButton = true for mobile support — it auto-creates a screen button',
      'Always check inputState — callbacks fire for Begin, Change, and End',
      'UnbindAction when leaving a state (e.g., exiting a vehicle) to free the key',
    ],
  },
  {
    name: 'Workspace Raycasting',
    keywords: ['raycast', 'ray', 'shoot', 'hit detection', 'line of sight', 'los', 'bullet', 'aim', 'whitelist', 'blacklist', 'gun', 'weapon'],
    snippet: `-- Raycasting: cast a ray and detect what it hits
local workspace = game:GetService("Workspace")

-- Basic raycast
local origin = Vector3.new(0, 10, 0)
local direction = Vector3.new(0, -100, 0) -- Downward 100 studs

local raycastParams = RaycastParams.new()
raycastParams.FilterType = Enum.RaycastFilterType.Exclude
raycastParams.FilterDescendantsInstances = {game.Players.LocalPlayer.Character} -- Ignore self
raycastParams.IgnoreWater = true

local result = workspace:Raycast(origin, direction, raycastParams)

if result then
  local hitPart = result.Instance       -- Part that was hit
  local hitPosition = result.Position   -- Exact hit point
  local hitNormal = result.Normal       -- Surface normal at hit
  local hitMaterial = result.Material   -- Terrain material (if terrain)
  print("Hit:", hitPart.Name, "at", hitPosition)
end

-- Weapon raycast (from camera through mouse)
local function fireWeapon(player: Player)
  local camera = workspace.CurrentCamera
  local mouse = player:GetMouse()

  local origin = camera.CFrame.Position
  local direction = (mouse.Hit.Position - origin).Unit * 300 -- 300 stud range

  local params = RaycastParams.new()
  params.FilterType = Enum.RaycastFilterType.Exclude
  params.FilterDescendantsInstances = {player.Character}

  local result = workspace:Raycast(origin, direction, params)
  if result then
    local hitPart = result.Instance
    local character = hitPart:FindFirstAncestorOfClass("Model")
    if character then
      local humanoid = character:FindFirstChildOfClass("Humanoid")
      if humanoid then
        -- Send hit to server for validation (NEVER apply damage on client)
        -- remoteEvent:FireServer("Hit", character, result.Position)
      end
    end

    -- Visual: bullet impact
    local attachment = Instance.new("Attachment")
    attachment.WorldPosition = result.Position
    attachment.Parent = workspace.Terrain
    game:GetService("Debris"):AddItem(attachment, 1)
  end
end`,
    pitfalls: [
      'NEVER use deprecated Ray class — use workspace:Raycast() with RaycastParams',
      'Always exclude the shooting player\'s character from the raycast filter',
      'Validate hits on the SERVER — clients can fake raycast results',
      'Direction vector length IS the max range — a 100-stud vector only checks 100 studs',
    ],
  },
  {
    name: 'Constraints',
    keywords: ['weld', 'hinge', 'spring', 'rope', 'constraint', 'attach', 'joint', 'motor', 'connect parts', 'door hinge', 'swing', 'physics joint'],
    snippet: `-- Constraints connect parts with physical joints
-- All constraints need Attachment0 and Attachment1

-- WeldConstraint: rigidly lock two parts together
local weld = Instance.new("WeldConstraint")
weld.Part0 = workspace.Base
weld.Part1 = workspace.Top
weld.Parent = workspace.Base  -- Parent to either part

-- HingeConstraint: rotating joint (doors, flaps, wheels)
local hinge = Instance.new("HingeConstraint")
local att0 = Instance.new("Attachment")
att0.Position = Vector3.new(2, 0, 0) -- Hinge point on Part0
att0.Parent = workspace.DoorFrame
local att1 = Instance.new("Attachment")
att1.Position = Vector3.new(-0.5, 0, 0) -- Hinge point on Part1
att1.Parent = workspace.Door

hinge.Attachment0 = att0
hinge.Attachment1 = att1
hinge.ActuatorType = Enum.ActuatorType.Motor -- Motor = auto-rotate
hinge.AngularVelocity = 2                   -- Radians/sec
hinge.MotorMaxTorque = 1000
hinge.Parent = workspace.DoorFrame

-- SpringConstraint: bouncy connection
local spring = Instance.new("SpringConstraint")
spring.Attachment0 = att0
spring.Attachment1 = att1
spring.Stiffness = 100        -- Spring force
spring.Damping = 10           -- Resistance
spring.FreeLength = 5         -- Rest length (studs)
spring.Parent = workspace.Base

-- RopeConstraint: flexible max-length connection
local rope = Instance.new("RopeConstraint")
rope.Attachment0 = att0
rope.Attachment1 = att1
rope.Length = 15              -- Max rope length
rope.Visible = true           -- Render the rope
rope.Thickness = 0.2
rope.Parent = workspace.Anchor

-- RodConstraint: rigid fixed-length bar
local rod = Instance.new("RodConstraint")
rod.Attachment0 = att0
rod.Attachment1 = att1
rod.Length = 10
rod.Visible = true
rod.Parent = workspace.Base`,
    pitfalls: [
      'WeldConstraint does NOT need Attachments — just set Part0 and Part1',
      'All other constraints REQUIRE Attachments — create and position them correctly',
      'Anchor one part in the constraint pair to prevent both from flying away',
      'HingeConstraint ActuatorType must be Motor or Servo for powered rotation — None = free spin',
    ],
  },
  {
    name: 'Particles',
    keywords: ['particle', 'emitter', 'beam', 'trail', 'fire', 'smoke', 'sparkle', 'effect', 'vfx', 'visual effect', 'explosion', 'magic'],
    snippet: `-- ParticleEmitter: spawns particles from a part
local emitter = Instance.new("ParticleEmitter")
emitter.Texture = "rbxassetid://1234567890"  -- Particle texture
emitter.Rate = 50                            -- Particles per second
emitter.Lifetime = NumberRange.new(1, 2)     -- Particle lifespan
emitter.Speed = NumberRange.new(5, 10)       -- Emission speed
emitter.SpreadAngle = Vector2.new(30, 30)    -- Cone spread
emitter.RotSpeed = NumberRange.new(-90, 90)  -- Spin
emitter.Drag = 2                             -- Air resistance

-- Size over lifetime (start big, shrink)
emitter.Size = NumberSequence.new({
  NumberSequenceKeypoint.new(0, 2),     -- Start size
  NumberSequenceKeypoint.new(0.5, 1.5), -- Mid size
  NumberSequenceKeypoint.new(1, 0),     -- End size (disappear)
})

-- Color over lifetime (orange → red → gray)
emitter.Color = ColorSequence.new({
  ColorSequenceKeypoint.new(0, Color3.fromRGB(255, 170, 0)),
  ColorSequenceKeypoint.new(0.5, Color3.fromRGB(255, 50, 0)),
  ColorSequenceKeypoint.new(1, Color3.fromRGB(80, 80, 80)),
})

emitter.Transparency = NumberSequence.new({
  NumberSequenceKeypoint.new(0, 0),   -- Fully visible
  NumberSequenceKeypoint.new(0.8, 0), -- Visible
  NumberSequenceKeypoint.new(1, 1),   -- Fade out at end
})

emitter.LightEmission = 0.8  -- Glow (0 = none, 1 = full additive)
emitter.Parent = workspace.TorchPart

-- Emit a burst (one-shot effect)
emitter.Enabled = false       -- Disable continuous emission
emitter:Emit(30)              -- Emit 30 particles at once

-- Beam: connects two attachments with a textured beam
local beam = Instance.new("Beam")
beam.Attachment0 = workspace.PartA:FindFirstChildOfClass("Attachment")
beam.Attachment1 = workspace.PartB:FindFirstChildOfClass("Attachment")
beam.Width0 = 2
beam.Width1 = 0.5
beam.Color = ColorSequence.new(Color3.fromRGB(0, 150, 255))
beam.LightEmission = 1
beam.FaceCamera = true        -- Always face the camera
beam.Parent = workspace.PartA

-- Trail: follows a moving attachment
local trail = Instance.new("Trail")
trail.Attachment0 = workspace.Sword.TrailTop
trail.Attachment1 = workspace.Sword.TrailBottom
trail.Lifetime = 0.3
trail.MinLength = 0.1
trail.Color = ColorSequence.new(Color3.fromRGB(255, 255, 255))
trail.Transparency = NumberSequence.new({
  NumberSequenceKeypoint.new(0, 0),
  NumberSequenceKeypoint.new(1, 1),
})
trail.Parent = workspace.Sword`,
    pitfalls: [
      'ParticleEmitter must be parented to a BasePart or Attachment — not a Model',
      'Use Emit() for burst effects, Enabled for continuous — do not set high Rate for one-shots',
      'Beam requires TWO Attachments on parts — will error without them',
      'Too many particles tanks performance — keep Rate under 100 and use LevelOfDetail',
    ],
  },

  // ── World Building: Terrain Generation ──────────────────────────
  {
    name: 'Terrain Generation',
    keywords: ['terrain', 'world', 'landscape', 'hills', 'mountains', 'island', 'map', 'ground', 'biome', 'perlin', 'noise', 'valley', 'cliff'],
    snippet: `-- Smooth terrain with Perlin noise hills
local terrain = workspace.Terrain
local seed = tick()
local freq = 0.02
local amp = 40
local mapSize = 150
local res = 4
for x = -mapSize, mapSize, res do
  for z = -mapSize, mapSize, res do
    local h = math.noise(x*freq, z*freq, seed)*amp + amp*0.6
    local mat = h > amp*1.2 and Enum.Material.Snow
      or h > amp*0.9 and Enum.Material.Rock
      or h > amp*0.3 and Enum.Material.Grass
      or h > amp*0.1 and Enum.Material.Sand
      or Enum.Material.Water
    terrain:FillBlock(CFrame.new(x, h/2, z), Vector3.new(res, math.max(h,1), res), mat)
  end
  task.wait()
end
-- Add water at sea level
terrain:FillBlock(CFrame.new(0, amp*0.05, 0), Vector3.new(mapSize*2, amp*0.1, mapSize*2), Enum.Material.Water)`,
    pitfalls: [
      'math.noise returns -0.5 to 0.5 NOT 0 to 1 — always normalize with +0.5 or *amp+offset',
      'Must use task.wait() in generation loops or Studio freezes',
      'Frequency 0.01-0.04 for natural hills — higher = chaos, lower = flat',
      'FillBlock Y position = height/2 (center of block, not top)',
    ],
  },

  // ── World Building: Trees ──────────────────────────────────────
  {
    name: 'Tree Generation',
    keywords: ['tree', 'forest', 'trees', 'pine', 'oak', 'palm', 'foliage', 'vegetation', 'nature', 'garden', 'park'],
    snippet: `-- Stylized tree with Ball canopy (looks 10X better than box leaves)
local function makeTree(pos, parent)
  local m = Instance.new("Model") m.Name = "Tree"
  -- Trunk (cylinder)
  local trunk = Instance.new("Part") trunk.Shape = Enum.PartType.Cylinder
  trunk.Anchored = true trunk.Size = Vector3.new(8, 1.5, 1.5)
  trunk.CFrame = CFrame.new(pos + Vector3.new(0,4,0)) * CFrame.Angles(0,0,math.rad(90))
  trunk.Material = Enum.Material.Wood trunk.Color = Color3.fromRGB(90,60,30) trunk.Parent = m
  -- Canopy layers (overlapping balls for organic shape)
  for i = 1, 4 do
    local leaf = Instance.new("Part") leaf.Shape = Enum.PartType.Ball leaf.Anchored = true
    local s = 5 - i*0.8 + math.random()*1
    leaf.Size = Vector3.new(s, s*0.7, s)
    leaf.CFrame = CFrame.new(pos + Vector3.new(math.random(-1,1), 7+i*1.2, math.random(-1,1)))
    leaf.Material = Enum.Material.Grass
    leaf.Color = Color3.fromRGB(40+i*12, 100+i*15, 30+i*8) leaf.Parent = m
  end
  m.Parent = parent or workspace return m
end
-- Pine tree variant: cylinder layers decreasing in size
local function makePine(pos, parent)
  local m = Instance.new("Model") m.Name = "PineTree"
  local trunk = Instance.new("Part") trunk.Shape = Enum.PartType.Cylinder
  trunk.Anchored = true trunk.Size = Vector3.new(10, 1, 1)
  trunk.CFrame = CFrame.new(pos + Vector3.new(0,5,0)) * CFrame.Angles(0,0,math.rad(90))
  trunk.Material = Enum.Material.Wood trunk.Color = Color3.fromRGB(80,50,25) trunk.Parent = m
  for i = 1, 5 do
    local r = 4 * (1 - i*0.15)
    local cone = Instance.new("Part") cone.Shape = Enum.PartType.Cylinder cone.Anchored = true
    cone.Size = Vector3.new(1.5, r*2, r*2)
    cone.CFrame = CFrame.new(pos + Vector3.new(0, 4+i*1.8, 0)) * CFrame.Angles(0,0,math.rad(90))
    cone.Material = Enum.Material.Grass cone.Color = Color3.fromRGB(25+i*5, 80+i*10, 20) cone.Parent = m
  end
  m.Parent = parent or workspace return m
end`,
    pitfalls: [
      'Cylinder Size.X = height (not Y!) — cylinders are rotated 90 degrees',
      'Ball Size must be equal on all 3 axes or it becomes an ellipsoid',
      'Use Grass material for leaves — looks natural. Never use SmoothPlastic for foliage',
      'Vary green shades per layer (darker bottom, lighter top) for depth',
    ],
  },

  // ── World Building: Water Features ─────────────────────────────
  {
    name: 'Water Features',
    keywords: ['water', 'pool', 'fountain', 'river', 'lake', 'ocean', 'waterfall', 'swimming', 'pond', 'stream'],
    snippet: `-- Fountain with particle spray
local function makeFountain(pos, parent)
  local m = Instance.new("Model") m.Name = "Fountain"
  -- Basin (cylinder)
  local basin = Instance.new("Part") basin.Shape = Enum.PartType.Cylinder basin.Anchored = true
  basin.Size = Vector3.new(2, 14, 14) basin.CFrame = CFrame.new(pos) * CFrame.Angles(0,0,math.rad(90))
  basin.Material = Enum.Material.Concrete basin.Color = Color3.fromRGB(170,165,155) basin.Parent = m
  -- Center column
  local col = Instance.new("Part") col.Shape = Enum.PartType.Cylinder col.Anchored = true
  col.Size = Vector3.new(5, 1.5, 1.5) col.CFrame = CFrame.new(pos+Vector3.new(0,3.5,0))*CFrame.Angles(0,0,math.rad(90))
  col.Material = Enum.Material.Marble col.Color = Color3.fromRGB(200,195,185) col.Parent = m
  -- Water surface (transparent blue)
  local water = Instance.new("Part") water.Shape = Enum.PartType.Cylinder water.Anchored = true
  water.Size = Vector3.new(0.5, 12, 12) water.CFrame = CFrame.new(pos+Vector3.new(0,0.8,0))*CFrame.Angles(0,0,math.rad(90))
  water.Material = Enum.Material.Glass water.Color = Color3.fromRGB(80,160,220) water.Transparency = 0.4
  water.CanCollide = false water.Parent = m
  -- Spray particles
  local spray = Instance.new("Part") spray.Anchored=true spray.CanCollide=false spray.Transparency=1
  spray.Size=Vector3.new(0.5,0.5,0.5) spray.CFrame=CFrame.new(pos+Vector3.new(0,6.5,0)) spray.Parent=m
  local pe = Instance.new("ParticleEmitter") pe.Rate=80 pe.Lifetime=NumberRange.new(1,2)
  pe.Speed=NumberRange.new(5,10) pe.SpreadAngle=Vector2.new(15,15)
  pe.Color=ColorSequence.new(Color3.fromRGB(180,215,255))
  pe.Size=NumberSequence.new({NumberSequenceKeypoint.new(0,0.3),NumberSequenceKeypoint.new(1,0.1)})
  pe.Transparency=NumberSequence.new({NumberSequenceKeypoint.new(0,0.2),NumberSequenceKeypoint.new(1,0.8)})
  pe.Acceleration=Vector3.new(0,-30,0) pe.Parent=spray
  m.Parent = parent or workspace return m
end`,
    pitfalls: [
      'Water parts should use Glass material + Transparency 0.3-0.5 + CanCollide=false',
      'Fountains need ParticleEmitter on a separate invisible Part (not on the water surface)',
      'Particle Acceleration should include gravity (-30 to -50 Y) for realistic water arcs',
      'For pools: build walls separately (4 parts), not a union — unions are slower',
    ],
  },

  // ── World Building: Roads ──────────────────────────────────────
  {
    name: 'Roads and Paths',
    keywords: ['road', 'path', 'street', 'sidewalk', 'highway', 'driveway', 'crosswalk', 'bridge'],
    snippet: `-- Road with center line and curbs
local function makeRoad(startPos, endPos, width, parent)
  local m = Instance.new("Model") m.Name = "Road"
  local mid = (startPos + endPos) / 2
  local length = (endPos - startPos).Magnitude
  -- Road surface
  local road = Instance.new("Part") road.Anchored = true
  road.Size = Vector3.new(width, 0.3, length)
  road.CFrame = CFrame.lookAt(mid, endPos)
  road.Material = Enum.Material.Asphalt road.Color = Color3.fromRGB(50,50,50) road.Parent = m
  -- Center line (yellow dashed)
  for i = 0, math.floor(length/4)-1 do
    local dash = Instance.new("Part") dash.Anchored = true
    dash.Size = Vector3.new(0.3, 0.31, 2)
    dash.CFrame = road.CFrame * CFrame.new(0, 0, -length/2 + 2 + i*4)
    dash.Material = Enum.Material.Neon dash.Color = Color3.fromRGB(255,200,0) dash.Parent = m
  end
  -- Curbs
  for _, side in ipairs({-1, 1}) do
    local curb = Instance.new("Part") curb.Anchored = true
    curb.Size = Vector3.new(0.5, 0.4, length)
    curb.CFrame = road.CFrame * CFrame.new(side*(width/2+0.25), 0.2, 0)
    curb.Material = Enum.Material.Concrete curb.Color = Color3.fromRGB(180,175,165) curb.Parent = m
  end
  m.Parent = parent or workspace return m
end`,
    pitfalls: [
      'Use CFrame.lookAt for road orientation between two points — NOT manual rotation',
      'Neon material for road lines (self-illuminating, visible at night)',
      'Curb height should be 0.3-0.5 studs above road surface',
      'For curved roads: generate multiple short segments along a Bezier curve',
    ],
  },

  // ── World Building: Weather/Ambient ─────────────────────────────
  {
    name: 'Weather and Ambient Effects',
    keywords: ['rain', 'snow', 'weather', 'fog', 'firefly', 'fireflies', 'ambient', 'atmosphere', 'storm', 'wind', 'night', 'day'],
    snippet: `-- Rain system
local function makeRain(parent)
  local p = Instance.new("Part") p.Anchored=true p.CanCollide=false p.Transparency=1
  p.Size=Vector3.new(200,1,200) p.Position=Vector3.new(0,100,0) p.Name="Rain" p.Parent=parent or workspace
  local e = Instance.new("ParticleEmitter") e.Rate=400 e.Lifetime=NumberRange.new(1.5,2.5)
  e.Speed=NumberRange.new(40,60) e.SpreadAngle=Vector2.new(3,3)
  e.EmissionDirection=Enum.NormalId.Bottom e.Acceleration=Vector3.new(0,-50,0)
  e.Color=ColorSequence.new(Color3.fromRGB(180,200,220))
  e.Size=NumberSequence.new({NumberSequenceKeypoint.new(0,0.05),NumberSequenceKeypoint.new(1,0.02)})
  e.Transparency=NumberSequence.new({NumberSequenceKeypoint.new(0,0.3),NumberSequenceKeypoint.new(1,0.7)})
  e.Parent=p return p
end
-- Fireflies
local function makeFireflies(center, radius, count, parent)
  local m = Instance.new("Model") m.Name = "Fireflies"
  for i = 1, count do
    local a = math.random()*math.pi*2
    local d = math.random()*radius
    local p = Instance.new("Part") p.Anchored=true p.CanCollide=false p.Transparency=1
    p.Size=Vector3.new(0.5,0.5,0.5)
    p.Position=center+Vector3.new(math.cos(a)*d, 2+math.random()*6, math.sin(a)*d) p.Parent=m
    local e = Instance.new("ParticleEmitter") e.Rate=2 e.Lifetime=NumberRange.new(1,3)
    e.Speed=NumberRange.new(0.2,0.8) e.SpreadAngle=Vector2.new(180,180)
    e.Color=ColorSequence.new(Color3.fromRGB(200,255,100))
    e.Size=NumberSequence.new({NumberSequenceKeypoint.new(0,0),NumberSequenceKeypoint.new(0.3,0.15),NumberSequenceKeypoint.new(0.7,0.15),NumberSequenceKeypoint.new(1,0)})
    e.LightEmission=1 e.Brightness=3 e.Parent=p
    local l = Instance.new("PointLight") l.Color=Color3.fromRGB(200,255,100) l.Brightness=0.4 l.Range=4 l.Parent=p
  end
  m.Parent = parent or workspace return m
end`,
    pitfalls: [
      'Rain emitter must be at Y=80-100, size 200x200, EmissionDirection=Bottom',
      'ParticleEmitter MUST be parented to a BasePart — not Model or workspace',
      'Firefly PointLights should have very low Brightness (0.3-0.5) and Range (3-5)',
      'Performance: max 3 weather emitters active at once, keep Rate under 500 total',
    ],
  },

  // ── World Building: Signs/GUI in 3D ────────────────────────────
  {
    name: '3D Signs and GUI',
    keywords: ['sign', 'billboard', 'nametag', 'label', 'screen', 'monitor', 'tv', 'display', 'surface gui', 'poster'],
    snippet: `-- SurfaceGui sign on a Part
local function makeSign(part, text, face)
  local sg = Instance.new("SurfaceGui") sg.Face = face or Enum.NormalId.Front
  sg.SizingMode = Enum.SurfaceGuiSizingMode.PixelsPerStud sg.PixelsPerStud = 50
  local bg = Instance.new("Frame") bg.Size = UDim2.new(1,0,1,0)
  bg.BackgroundColor3 = Color3.fromRGB(20,20,25) bg.BorderSizePixel = 0 bg.Parent = sg
  local corner = Instance.new("UICorner") corner.CornerRadius = UDim.new(0.05,0) corner.Parent = bg
  local label = Instance.new("TextLabel") label.Size = UDim2.new(0.9,0,0.8,0)
  label.Position = UDim2.new(0.05,0,0.1,0) label.BackgroundTransparency = 1
  label.TextColor3 = Color3.fromRGB(255,220,60) label.Text = text label.TextScaled = true
  label.Font = Enum.Font.GothamBold label.Parent = bg
  sg.Parent = part return sg
end
-- BillboardGui floating label
local function makeFloatingLabel(adornee, text)
  local bb = Instance.new("BillboardGui") bb.Adornee = adornee
  bb.Size = UDim2.new(6,0,1.5,0) bb.StudsOffset = Vector3.new(0,3,0)
  local label = Instance.new("TextLabel") label.Size = UDim2.new(1,0,1,0)
  label.BackgroundTransparency = 0.3 label.BackgroundColor3 = Color3.fromRGB(0,0,0)
  label.TextColor3 = Color3.fromRGB(255,255,255) label.Text = text label.TextScaled = true
  label.Font = Enum.Font.GothamBold label.Parent = bb
  bb.Parent = adornee return bb
end`,
    pitfalls: [
      'SurfaceGui renders ON the part surface — BillboardGui floats and faces camera',
      'SurfaceGui.PixelsPerStud controls text sharpness — 50 is good, higher = sharper but more memory',
      'BillboardGui.StudsOffset controls float distance above the part',
      'AlwaysOnTop=true makes GUI render above everything — use sparingly',
    ],
  },

  // ── World Building: Curved Surfaces ─────────────────────────────
  {
    name: 'Curved Surfaces and Arches',
    keywords: ['curve', 'arch', 'dome', 'rounded', 'circular', 'spiral', 'ring', 'tunnel', 'bridge arch'],
    snippet: `-- Create an arch from parts (approximated curve)
local function makeArch(center, radius, thickness, width, segments, parent)
  local m = Instance.new("Model") m.Name = "Arch"
  for i = 0, segments-1 do
    local a1 = math.rad((i/segments)*180)
    local a2 = math.rad(((i+1)/segments)*180)
    local mid = (a1+a2)/2
    local pos = center + Vector3.new(math.cos(mid)*radius, math.sin(mid)*radius, 0)
    local len = 2*radius*math.sin((a2-a1)/2)
    local p = Instance.new("Part") p.Anchored = true
    p.Size = Vector3.new(width, thickness, len)
    p.CFrame = CFrame.new(pos) * CFrame.Angles(0, 0, mid+math.pi/2)
    p.Material = Enum.Material.Brick p.Color = Color3.fromRGB(170,140,110) p.Parent = m
  end
  m.Parent = parent or workspace return m
end
-- Usage: makeArch(Vector3.new(0,0,0), 8, 1, 4, 16)
-- Dome (half-sphere from stacked cylinders)
local function makeDome(center, radius, layers, parent)
  local m = Instance.new("Model") m.Name = "Dome"
  for i = 0, layers do
    local t = i/layers
    local y = math.sin(t*math.pi/2)*radius
    local r = math.cos(t*math.pi/2)*radius
    local ring = Instance.new("Part") ring.Shape = Enum.PartType.Cylinder ring.Anchored = true
    ring.Size = Vector3.new(radius/layers, r*2, r*2)
    ring.CFrame = CFrame.new(center+Vector3.new(0,y,0))*CFrame.Angles(0,0,math.rad(90))
    ring.Material = Enum.Material.Marble ring.Color = Color3.fromRGB(220,215,205) ring.Parent = m
  end
  m.Parent = parent or workspace return m
end`,
    pitfalls: [
      'More segments = smoother curve but more parts. 12-16 segments is good for arches',
      'Dome layers should be 8-12 for smooth look without excessive parts',
      'For spirals: add incremental Y offset per segment',
      'Use math.cos/math.sin for circular placement — never hardcode positions',
    ],
  },

  // ── Pro Game Visual Techniques (from top Roblox games) ──────────────
  {
    name: 'Pro Game Visuals',
    keywords: ['game', 'tycoon', 'simulator', 'sim', 'pet', 'adopt', 'obby', 'world', 'map', 'professional', 'vibrant', 'colorful', 'stylized'],
    snippet: `-- TOP ROBLOX GAME VISUAL TECHNIQUES (Pet Simulator, Adopt Me, etc.)

-- 1. VIBRANT SATURATED COLORS (not muted/realistic)
-- Games like Pet Sim use bright, happy colors:
local PALETTE = {
  ground = Color3.fromRGB(100, 200, 80),  -- bright green
  accent = Color3.fromRGB(255, 130, 80),  -- warm orange
  sky    = Color3.fromRGB(80, 180, 255),  -- bright blue
  glow   = Color3.fromRGB(255, 220, 100), -- gold
}

-- 2. STYLIZED LOW-POLY TREES (Ball shapes, NOT realistic)
-- Multiple overlapping balls with bright greens
for i = 1, 4 do
  local s = 5 - i * 0.7
  local leaf = Instance.new("Part") leaf.Shape = Enum.PartType.Ball
  leaf.Size = Vector3.new(s, s*0.8, s) leaf.Anchored = true
  leaf.Material = Enum.Material.Grass
  leaf.Color = Color3.fromRGB(40+i*20, 160+i*15, 40+i*10)
  leaf.CFrame = CFrame.new(x, y + 6 + i*1.5, z) * CFrame.Angles(0, math.rad(i*60), 0)
  leaf.Parent = model
end

-- 3. NEON GLOW ACCENTS (portals, collectibles, paths)
local glow = Instance.new("Part") glow.Material = Enum.Material.Neon
glow.Color = Color3.fromRGB(255, 200, 100)
-- Add PointLight for actual glow effect:
local light = Instance.new("PointLight") light.Brightness = 3 light.Range = 15
light.Color = glow.Color light.Parent = glow

-- 4. THEMED GROUND (terrain + colored parts)
-- Top games use terrain for base + colored parts for paths
terrain:FillBlock(CFrame.new(0, -1, 0), Vector3.new(200, 2, 200), Enum.Material.Grass)
-- Pink path (candy world):
P("path", 6, 0.3, 40, 0, 0.15, 0, "Concrete", 255, 180, 220)

-- 5. FLOATING PARTICLES + SPARKLES
local sparkle = Instance.new("ParticleEmitter")
sparkle.Rate = 5 sparkle.Lifetime = NumberRange.new(2, 4)
sparkle.Size = NumberSequence.new({NumberSequenceKeypoint.new(0,0), NumberSequenceKeypoint.new(0.5,0.3), NumberSequenceKeypoint.new(1,0)})
sparkle.Color = ColorSequence.new(Color3.fromRGB(255, 255, 200))
sparkle.LightEmission = 1 sparkle.Brightness = 2

-- 6. LARGE 3D TEXT SIGNS (use BillboardGui or thick Parts)
-- "SHOP" signs use thick Neon parts arranged as letters
-- Or use SurfaceGui on a Part for clean text

-- 7. TELEPORT PORTALS (glowing rings)
for i = 0, 23 do
  local angle = (i/24) * math.pi * 2
  local px = math.cos(angle) * 5
  local py = math.sin(angle) * 5
  P("portal_segment_"..i, 1, 0.8, 0.8, px, py + 5, 0, "Neon", 100, 200, 255)
end`,
    pitfalls: [
      'Top games use VIBRANT colors, not muted realistic — Color3.fromRGB(255,130,80) not Color3.fromRGB(160,140,120)',
      'Trees should be Ball shapes with bright greens, not flat box foliage',
      'Every collectible/interactive object needs Neon material + PointLight for glow',
      'Ground should use terrain for base, colored Parts for paths/zones — not all Parts',
      'Use ParticleEmitter sparkles on important objects (shops, portals, rewards)',
      'Roblox games use 3-5 distinct bright colors per zone, not gradual shading',
    ],
  },
  {
    name: 'ScreenGui Best Practices',
    keywords: ['gui', 'ui', 'screen', 'menu', 'shop', 'inventory', 'hud', 'interface', 'panel'],
    snippet: `-- ScreenGui setup (LocalScript in StarterGui)
local sg = Instance.new("ScreenGui")
sg.Name = "MyGui"
sg.ResetOnSpawn = false  -- CRITICAL: keeps GUI after respawn
sg.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
sg.Parent = player:WaitForChild("PlayerGui")

-- Dark theme frame with polish
local frame = Instance.new("Frame")
frame.Size = UDim2.new(0.5, 0, 0.6, 0)
frame.Position = UDim2.new(0.25, 0, 0.2, 0)
frame.BackgroundColor3 = Color3.fromRGB(15, 18, 30)
frame.Parent = sg
-- ALWAYS add: UICorner, UIStroke, UIPadding
Instance.new("UICorner", frame).CornerRadius = UDim.new(0, 12)
local stroke = Instance.new("UIStroke", frame) stroke.Color = Color3.fromRGB(50, 50, 70) stroke.Thickness = 1
-- Use UDim2 SCALE (not offset) for responsive sizing`,
    pitfalls: [
      'Forgetting ResetOnSpawn=false — GUI disappears on death',
      'Using UDim2.fromOffset for layout — breaks on different screen sizes',
      'Not adding UICorner — looks like a dev placeholder, not a real game',
      'Parenting to StarterGui instead of PlayerGui in LocalScript context',
    ],
  },
  {
    name: 'TweenService UI Animations',
    keywords: ['tween', 'animate', 'animation', 'slide', 'fade', 'transition', 'open', 'close', 'hover'],
    snippet: `-- UI animation patterns (LocalScript)
local TweenService = game:GetService("TweenService")

-- Open animation: scale up from center
frame.Size = UDim2.new(0, 0, 0, 0)
frame.Position = UDim2.new(0.5, 0, 0.5, 0)
TweenService:Create(frame, TweenInfo.new(0.35, Enum.EasingStyle.Back, Enum.EasingDirection.Out), {
  Size = UDim2.new(0.5, 0, 0.6, 0),
  Position = UDim2.new(0.25, 0, 0.2, 0)
}):Play()

-- Close animation: scale down + destroy
TweenService:Create(frame, TweenInfo.new(0.25, Enum.EasingStyle.Back, Enum.EasingDirection.In), {
  Size = UDim2.new(0, 0, 0, 0)
}):Play()
task.wait(0.25) screenGui:Destroy()

-- Button hover effect
btn.MouseEnter:Connect(function()
  TweenService:Create(btn, TweenInfo.new(0.15), {BackgroundColor3 = hoverColor}):Play()
end)
btn.MouseLeave:Connect(function()
  TweenService:Create(btn, TweenInfo.new(0.15), {BackgroundColor3 = normalColor}):Play()
end)`,
    pitfalls: [
      'Using task.wait without tweening — creates jarring instant transitions',
      'Not using Back easing for open/close — feels flat',
      'Animating Size without also animating Position — frame slides off-center',
      'Forgetting to destroy GUI after close animation completes',
    ],
  },
  {
    name: 'ScrollingFrame Setup',
    keywords: ['scroll', 'scrolling', 'list', 'grid', 'long content', 'scrollbar', 'canvas'],
    snippet: `-- ScrollingFrame with auto-sizing canvas
local scroll = Instance.new("ScrollingFrame")
scroll.Size = UDim2.new(1, 0, 1, -50) -- leave room for header
scroll.Position = UDim2.new(0, 0, 0, 48)
scroll.BackgroundTransparency = 1
scroll.ScrollBarThickness = 4
scroll.ScrollBarImageColor3 = Color3.fromRGB(160, 130, 40)
scroll.CanvasSize = UDim2.new(0, 0, 0, 0)
scroll.AutomaticCanvasSize = Enum.AutomaticSize.Y  -- auto-expand vertically
scroll.Parent = parentFrame

-- For list layout (vertical stack)
local list = Instance.new("UIListLayout")
list.Padding = UDim.new(0, 8)
list.SortOrder = Enum.SortOrder.LayoutOrder
list.Parent = scroll

-- For grid layout (item cards)
local grid = Instance.new("UIGridLayout")
grid.CellSize = UDim2.new(0.25, -6, 0, 100)  -- 4 columns
grid.CellPadding = UDim2.new(0, 6, 0, 6)
grid.SortOrder = Enum.SortOrder.LayoutOrder
grid.Parent = scroll`,
    pitfalls: [
      'Setting CanvasSize manually instead of using AutomaticCanvasSize',
      'Forgetting SortOrder on layout — children appear in creation order which may be random',
      'Using UIGridLayout CellSize with pixels instead of scale — breaks on resize',
      'Not setting ScrollBarImageColor3 — default white scrollbar looks out of place in dark themes',
    ],
  },

]

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Find relevant Roblox API snippets based on user's prompt.
 * Returns snippets sorted by relevance (most keyword matches first).
 */
export function findRelevantSnippets(userPrompt: string, maxSnippets: number = 4): RobloxAPISnippet[] {
  const lower = userPrompt.toLowerCase()
  const scored = ROBLOX_KNOWLEDGE.map(snippet => {
    let score = 0
    for (const kw of snippet.keywords) {
      if (lower.includes(kw.toLowerCase())) score += 1
    }
    // Boost if the API name itself is mentioned
    if (lower.includes(snippet.name.toLowerCase())) score += 3
    return { snippet, score }
  })
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSnippets)

  return scored.map(s => s.snippet)
}

// ═══════════════════════════════════════════════════════════════════════════
// DEVFORUM KNOWLEDGE — appended to ROBLOX_KNOWLEDGE array at runtime
// ═══════════════════════════════════════════════════════════════════════════
const DEVFORUM_KNOWLEDGE: RobloxAPISnippet[] = [

  {
    name: 'UI Design Best Practices (DevForum)',
    keywords: ['ui', 'gui', 'screen', 'interface', 'button', 'frame', 'screengui', 'design', 'menu', 'hud', 'shop ui', 'inventory ui'],
    snippet: `-- UI DESIGN BEST PRACTICES (from Roblox DevForum + official Roblox Staff post)
--
-- SCALE VS OFFSET:
-- Use Scale (percentage) for responsive UI, NOT Offset (pixels).
-- Scale adapts to ALL screen sizes. Offset breaks on mobile.
-- Example: UDim2.new(0.3, 0, 0.5, 0) instead of UDim2.new(0, 200, 0, 300)
-- EXCEPTION: Use Offset for pixel-perfect icons, UIStroke thickness, small fixed elements
--
-- ANCHORING:
-- Always set AnchorPoint BEFORE Position for predictable placement.
-- Center: AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.new(0.5, 0, 0.5, 0)
--
-- UIAspectRatioConstraint:
-- Add to any element that must stay square/proportional across screens.
-- local aspect = Instance.new("UIAspectRatioConstraint")
-- aspect.AspectRatio = 1 -- 1:1 square
-- aspect.Parent = frame
--
-- MOBILE SAFE AREA:
-- screenGui.ScreenInsets = Enum.ScreenInsets.DeviceSafeInsets
-- This prevents UI from being hidden behind notches/Dynamic Island
-- Top bar is 58px on modern Roblox (updated from old 36px)
--
-- UICORNER WITH SCALE (responsive corners):
-- addCorner.CornerRadius = UDim.new(0.1, 0) -- 10% of smallest axis = responsive
-- NOT UDim.new(0, 12) which stays 12px on all screens
--
-- ONE SCREENGUI VS MANY:
-- Use ONE ScreenGui with multiple Frames (toggled via Visible).
-- This is simpler, better for performance, and easier to manage ZIndex.
-- Each Frame = one panel (shop, inventory, settings, etc.)
-- Toggle with: frame.Visible = not frame.Visible
--
-- DESIGN MOBILE-FIRST:
-- Design for smallest screen first. If it works on phone, it works everywhere.
-- Minimum touch target: 44x44 pixels (Apple HIG) / 48x48 (Material Design)
-- Test in Studio: View > Device Emulator`,
    pitfalls: [
      'Using Offset for main containers (breaks on different screen sizes)',
      'Forgetting ScreenInsets — UI hidden behind phone notches/Dynamic Island',
      'Using multiple ScreenGuis when one with toggled Frames is better',
      'UICorner with Offset instead of Scale (corners don\'t scale)',
      'Not testing on mobile device emulator',
      'Top bar is 58px now, not 36px — old tutorials are wrong',
    ],
  },
  {
    name: 'RemoteEvent Security (DevForum)',
    keywords: ['remote', 'event', 'security', 'exploit', 'hack', 'cheat', 'server', 'client', 'validate', 'sanity', 'anti-exploit'],
    snippet: `-- REMOTEEVENT SECURITY (from DevForum security tutorials)
-- NEVER trust the client. ALL game logic on SERVER.
--
-- 1. RATE LIMITING (prevent spam):
local cooldowns = {}
Players.PlayerAdded:Connect(function(p) cooldowns[p.UserId] = 0 end)
Players.PlayerRemoving:Connect(function(p) cooldowns[p.UserId] = nil end)

remote.OnServerEvent:Connect(function(player, ...)
  if tick() - (cooldowns[player.UserId] or 0) < 0.2 then return end -- 200ms cooldown
  cooldowns[player.UserId] = tick()
  -- process safely
end)

-- 2. TYPE VALIDATION (prevent wrong types):
remote.OnServerEvent:Connect(function(player, action, data)
  if typeof(action) ~= "string" then return end
  if typeof(data) ~= "table" then return end
  if action == "BuyItem" then
    if typeof(data.itemId) ~= "string" then return end
    if typeof(data.quantity) ~= "number" then return end
    if data.quantity ~= data.quantity then return end -- NaN check!
    if data.quantity < 1 or data.quantity > 99 then return end -- sanity
    -- safe to process purchase
  end
end)

-- 3. STRING LENGTH LIMITS (prevent DoS):
if typeof(chatMessage) ~= "string" then return end
if #chatMessage > 200 then return end -- cap length

-- 4. THREADING (prevent queue exhaustion):
remote.OnServerEvent:Connect(function(player, ...)
  task.spawn(function() -- offload to new thread
    -- heavy processing here
  end)
end)`,
    pitfalls: [
      'NEVER let client set their own health/currency/stats',
      'NEVER trust client-sent numeric IDs (exploiters change them)',
      'ALWAYS check for NaN: if value ~= value then return end',
      'ALWAYS limit string length to prevent memory attacks',
      'ALWAYS use server-side cooldowns (client cooldowns are bypassable)',
      'Use task.spawn() for heavy remote handlers to prevent queue exhaustion',
      'Tables from clients can be ANY structure — validate every key',
    ],
  },
  {
    name: 'Build Optimization (DevForum)',
    keywords: ['optimize', 'performance', 'lag', 'fps', 'frame rate', 'slow', 'mobile', 'part count', 'triangle', 'drawcall', 'streaming'],
    snippet: `-- BUILD OPTIMIZATION (from DevForum real-world optimization guides)
--
-- PERFORMANCE BUDGETS (2024-2025 standards):
-- Triangle budget: 500,000 in-scene
-- Drawcall budget: 500 in-scene
-- Client memory: <1.3GB (for 2GB phones)
-- Network receive: <50KB/s
-- Moving physics objects: 40-60 max
--
-- KITBASHING (how pro studios build):
-- Reuse the SAME meshes with different Color/Rotation/Scale.
-- Engine batches identical meshId+material into ONE drawcall.
-- 100 trees using 4 mesh types = ~8 drawcalls (not 400!)
--
-- PART OPTIMIZATION:
-- Disable on small/decorative parts:
--   part.CanCollide = false  -- if player can't walk on it
--   part.CanTouch = false    -- unless using Touched events
--   part.CanQuery = false    -- unless using raycasts on it
--   part.CastShadow = false  -- for small details
--
-- STREAMING ENABLED:
-- Essential for large maps. Reduces load time + memory.
-- game.Workspace.StreamingEnabled = true
-- StreamingMinRadius = 256 (studs around player to keep loaded)
-- StreamOutBehavior = Enum.StreamOutBehavior.LowMemory
--
-- DISTANCE CULLING (for details):
-- Tag small objects, hide when far from camera:
-- CollectionService:AddTag(part, "SmallDetail")
-- In a loop: if distance > 300 then part.Parent = nil else part.Parent = workspace end
--
-- LIGHTING PERFORMANCE:
-- ShadowMap = better mobile performance (outdoor maps)
-- Future = better quality but more expensive (indoor/complex lighting)
-- Disable CastShadow on non-essential parts
-- Non-shadow-casting PointLights are nearly free
-- Each shadow-casting SpotLight/SurfaceLight adds drawcalls`,
    pitfalls: [
      'Having >500K triangles in view (causes FPS drops on mobile)',
      'Using Precise collision on small objects (use Box instead)',
      'Forgetting to disable CastShadow on decorative parts',
      'Too many unique mesh IDs (each unique mesh = separate memory)',
      'Semi-transparent parts with decals do NOT batch (avoid)',
      'Each ParticleEmitter = 1 drawcall regardless of particle count',
      'SurfaceGuis and BillboardGuis consume drawcalls quickly',
    ],
  },
  {
    name: 'Modern Data Storage (DevForum 2025)',
    keywords: ['save', 'data', 'datastore', 'profile', 'profileservice', 'profilestore', 'persist', 'session', 'database'],
    snippet: `-- MODERN DATA STORAGE (DevForum 2025 recommendations)
--
-- OPTIONS (ranked by community preference):
-- 1. ProfileStore (newest, recommended for new projects)
-- 2. Suphi's DataStore Module (simple, well-documented)
-- 3. ProfileService (mature but partially outdated)
-- 4. Raw DataStoreService (full control, more work)
--
-- STANDARD PATTERN (works with any approach):
local DataStoreService = game:GetService("DataStoreService")
local store = DataStoreService:GetDataStore("GameData_v1")

-- Default data template (new players get this)
local DEFAULT_DATA = {
  coins = 100,
  level = 1,
  xp = 0,
  inventory = {},
  settings = { music = true, sfx = true },
  lastLogin = 0,
}

-- SESSION LOCKING (prevent data duplication):
-- Track active sessions per player
-- On PlayerRemoving: save + release lock
-- On BindToClose: save ALL active players (30 second window)

game:BindToClose(function()
  for _, player in Players:GetPlayers() do
    task.spawn(function()
      pcall(function() store:SetAsync("Player_"..player.UserId, playerData[player.UserId]) end)
    end)
  end
  task.wait(2) -- give saves time to complete
end)

-- VERSION KEY IN STORE NAME:
-- Use "GameData_v1", "GameData_v2" etc.
-- When schema changes, migrate: load v1, transform, save as v2
-- NEVER delete old stores (players may have old data)`,
    pitfalls: [
      'Not wrapping DataStore calls in pcall (will crash on failure)',
      'Not saving on BindToClose (data lost on server shutdown)',
      'Not using session locking (data duplication from multiple servers)',
      'Saving too frequently (DataStore has rate limits: 60 + numPlayers*10 per minute)',
      'Storing Instance references in data (not serializable)',
      'Not versioning the store name (impossible to migrate schema later)',
      'Using UpdateAsync without understanding its retry behavior',
    ],
  },
  {
    name: 'TweenService UI Animations (DevForum)',
    keywords: ['tween', 'animation', 'animate', 'transition', 'smooth', 'ease', 'slide', 'fade', 'bounce', 'ui animation'],
    snippet: `-- TWEENSERVICE UI PATTERNS (from DevForum community best practices)
local TweenService = game:GetService("TweenService")

-- OPEN PANEL (scale from 0 at center, Back easing for overshoot):
local function openPanel(frame)
  frame.Visible = true
  frame.Size = UDim2.new(0, 0, 0, 0)
  frame.Position = UDim2.new(0.5, 0, 0.5, 0)
  frame.AnchorPoint = Vector2.new(0.5, 0.5)
  TweenService:Create(frame, TweenInfo.new(0.35, Enum.EasingStyle.Back, Enum.EasingDirection.Out), {
    Size = UDim2.new(0.6, 0, 0.7, 0)
  }):Play()
end

-- CLOSE PANEL (shrink to center):
local function closePanel(frame)
  local tween = TweenService:Create(frame, TweenInfo.new(0.2, Enum.EasingStyle.Quad, Enum.EasingDirection.In), {
    Size = UDim2.new(0, 0, 0, 0)
  })
  tween.Completed:Connect(function() frame.Visible = false end)
  tween:Play()
end

-- BUTTON HOVER (brighten + slight scale):
button.MouseEnter:Connect(function()
  TweenService:Create(button, TweenInfo.new(0.12, Enum.EasingStyle.Quad), {
    BackgroundColor3 = hoverColor
  }):Play()
end)
button.MouseLeave:Connect(function()
  TweenService:Create(button, TweenInfo.new(0.12, Enum.EasingStyle.Quad), {
    BackgroundColor3 = normalColor
  }):Play()
end)

-- BUTTON PRESS (squish effect via UIScale):
local scale = Instance.new("UIScale") scale.Parent = button
button.MouseButton1Down:Connect(function()
  TweenService:Create(scale, TweenInfo.new(0.08), {Scale = 0.92}):Play()
end)
button.MouseButton1Up:Connect(function()
  TweenService:Create(scale, TweenInfo.new(0.15, Enum.EasingStyle.Back), {Scale = 1}):Play()
end)

-- SMOOTH NUMBER COUNTER (coins going up):
local numberValue = Instance.new("NumberValue")
numberValue.Changed:Connect(function(val)
  label.Text = tostring(math.floor(val))
end)
-- To animate: tween numberValue.Value from old to new amount

-- TOAST NOTIFICATION (slide in from right):
local function showToast(text)
  local toast = createToastFrame(text) -- your frame creation
  toast.Position = UDim2.new(1.5, 0, 0.9, 0) -- off-screen right
  TweenService:Create(toast, TweenInfo.new(0.4, Enum.EasingStyle.Bounce), {
    Position = UDim2.new(0.7, 0, 0.9, 0)
  }):Play()
  task.delay(3, function()
    TweenService:Create(toast, TweenInfo.new(0.3, Enum.EasingStyle.Quad, Enum.EasingDirection.In), {
      Position = UDim2.new(1.5, 0, 0.9, 0)
    }):Play()
    task.delay(0.3, function() toast:Destroy() end)
  end)
end`,
    pitfalls: [
      'Using Visible toggle without animation (feels jarring)',
      'Not canceling previous tweens before starting new ones (overlapping animations)',
      'Using linear easing (feels robotic — use Quad/Back/Bounce instead)',
      'Destroying frames during tween (causes errors — wait for completion)',
      'Snapping number displays instead of tweening (breaks immersion)',
      'Not adding UIScale for button press feedback (feels unresponsive)',
    ],
  },
  {
    name: 'Mobile Performance (DevForum)',
    keywords: ['mobile', 'phone', 'tablet', 'performance', 'optimization', 'lag', 'fps', 'low end', 'android', 'ios'],
    snippet: `-- MOBILE PERFORMANCE (from DevForum real-world optimization)
--
-- CPU IS THE BOTTLENECK ON MOBILE (not GPU):
-- Old phones are nowhere near as quick as PCs.
-- Optimize scripts first, then rendering.
--
-- MEMORY TARGET: <1.3GB for 2GB phones
-- Test on actual devices, not just Studio emulator.
--
-- QUALITY AUTO-DEGRADES when performance is bad:
-- Roblox drops from Quality 10 to lower settings automatically.
-- This removes shadows, reduces draw distance, simplifies particles.
-- If your game runs well, it STAYS at high quality.
--
-- MOBILE UI RULES:
-- Minimum touch target: 48x48 pixels (Material Design)
-- Use Scale sizing (UDim2.new(0.3, 0, ...)) not fixed pixels
-- Add safe area insets for notch phones:
--   screenGui.ScreenInsets = Enum.ScreenInsets.DeviceSafeInsets
-- Virtual controls take screen space — don't put UI where joystick goes
-- Test landscape AND portrait if your game supports both
--
-- PARTICLE OPTIMIZATION:
-- Each ParticleEmitter = 1 drawcall (regardless of particle count)
-- Reduce Rate, increase Lifetime for similar visual at lower cost
-- Disable particles on mobile: if UserInputService.TouchEnabled then emitter.Rate = 0 end
--
-- STREAMING ENABLED = ESSENTIAL for mobile:
-- Reduces memory usage dramatically
-- Set StreamingMinRadius based on gameplay needs (256 default)`,
    pitfalls: [
      'Not testing on real mobile devices (emulator hides real performance)',
      'Too many ParticleEmitters (each one = 1 drawcall)',
      'Using Future lighting on mobile-first games (ShadowMap is cheaper)',
      'Fixed-pixel UI that clips on small screens',
      'Forgetting virtual controls take screen space on mobile',
    ],
  },
  {
    name: 'Game Architecture Patterns (DevForum)',
    keywords: ['architecture', 'structure', 'organize', 'framework', 'pattern', 'module', 'system', 'game loop', 'state'],
    snippet: `-- GAME ARCHITECTURE (DevForum best practices)
--
-- FOLDER STRUCTURE (standard Roblox game organization):
-- ServerScriptService/ — server-only scripts (economy, combat, data)
-- ServerStorage/ — server-only assets (tools, models, configs)
-- ReplicatedStorage/ — shared modules, RemoteEvents, configs
-- StarterGui/ — UI templates (ScreenGuis)
-- StarterPlayerScripts/ — client scripts (camera, input, effects)
-- StarterCharacterScripts/ — per-character scripts
--
-- MODULE PATTERN (how every system should be structured):
-- ReplicatedStorage/Modules/ShopModule.lua:
local ShopModule = {}

function ShopModule.GetItems()
  return { {id="sword", name="Iron Sword", price=100}, ... }
end

function ShopModule.CanAfford(player, itemId)
  -- Server-side check
  return playerData[player.UserId].coins >= ShopModule.GetItems()[itemId].price
end

return ShopModule

-- REMOTEEVENTS ORGANIZATION:
-- Put ALL remotes in one folder for easy management:
-- ReplicatedStorage/Remotes/
--   ShopPurchase (RemoteEvent)
--   DataUpdate (RemoteEvent)
--   GetInventory (RemoteFunction)
--
-- EVENT-DRIVEN ARCHITECTURE:
-- Use BindableEvents for server-server communication:
-- ServerScriptService/Events/PlayerLevelUp (BindableEvent)
-- Multiple systems can listen: QuestSystem, AchievementSystem, UISystem`,
    pitfalls: [
      'Putting server logic in LocalScripts (exploitable)',
      'Scattering RemoteEvents everywhere instead of one organized folder',
      'Not using ModuleScripts for shared logic (code duplication)',
      'Using _G or shared for global state (use ModuleScripts instead)',
      'Not separating server and client code clearly',
    ],
  },

  {
    name: 'Detailed Building Techniques (DevForum)',
    keywords: ['build', 'house', 'building', 'detail', 'architecture', 'wall', 'roof', 'window', 'door', 'interior', 'exterior'],
    snippet: `-- BUILDING DETAIL TECHNIQUES (from DevForum pro builders)
--
-- PART COUNT TARGETS (real DevForum standards):
-- House without interior: 100-600 parts
-- Interior room: 30-80 parts per room
-- Max in render distance (300 studs): 5,000 parts
-- Real trick: 10-story building with 200 windows = 68 parts (not 800)
--   → Use #-shaped walls (frame only) instead of filled blocks
--   → Windows are HOLES in the wall, not separate glass parts on top
--
-- WALL CONSTRUCTION (DevForum pro technique):
-- DON'T: Single thick slab for each wall
-- DO: Frame construction — thin outer wall + inner wall + air gap
-- This creates natural window recesses and door frames
-- Wall thickness: 0.8-1.0 studs, NOT 2-4 studs
--
-- DETAIL HIERARCHY (what separates amateur from pro):
-- Level 1: Walls + floor + roof (amateur — "box house")
-- Level 2: + windows + door + foundation (beginner)
-- Level 3: + trim + baseboard + crown molding + window frames (intermediate)
-- Level 4: + shutters + flower boxes + porch railings + chimney detail (advanced)
-- Level 5: + weathering + color variation + landscaping + interior (pro)
-- Our AI should target Level 4-5 for every building.
--
-- MATERIAL LAG RANKINGS (DevForum tested):
-- Neon: 3/5 lag (highest — use sparingly, only for actual glowing things)
-- Glass: 3/5 lag (use but minimize — windows only)
-- Most materials: 1-2/5 lag (safe to use freely)
-- Concrete, Brick, Wood, WoodPlanks, Slate: all performant
--
-- ROOF TECHNIQUES:
-- Gable: 2 WedgeParts meeting at ridge, overhang 1.5-2 studs past walls
-- Hip: 4 WedgeParts meeting at center point
-- Flat: Part with slight parapet wall around edge (0.3-0.5 height rim)
-- Mansard: lower steep wedge + upper shallow wedge on each side
-- ALWAYS add fascia board (thin strip under roof edge) — single biggest detail improvement
--
-- COLOR VARIATION (DevForum #1 tip for realism):
-- NEVER use one flat color for large surfaces
-- Use vc() helper or manually vary RGB by ±10-15 per part
-- Brick walls: alternate 2-3 slightly different brick colors
-- Wood: vary brown tones per plank
-- Stone: each stone slightly different shade`,
    pitfalls: [
      'Single-color large surfaces (looks flat and fake)',
      'Walls thicker than 1 stud (wastes parts, looks chunky)',
      'No roof overhang (amateur tell — always extend 1.5+ past walls)',
      'Missing baseboard/crown trim (biggest quality gap)',
      'Using Neon for non-glowing surfaces (performance + looks wrong)',
      'Box houses with no foundation (floating buildings look terrible)',
      'Symmetrical everything (real buildings have asymmetric details)',
    ],
  },
  {
    name: 'Tycoon Game Architecture (DevForum)',
    keywords: ['tycoon', 'factory', 'dropper', 'conveyor', 'collector', 'upgrade', 'rebirth', 'plot', 'idle'],
    snippet: `-- TYCOON ARCHITECTURE (from DevForum production tycoon developers)
--
-- PLOT SYSTEM:
-- Each player gets a plot (Model in Workspace with PrimaryPart)
-- Plot contains: baseplate, plot boundary, purchase buttons
-- Buildings CLONE from ServerStorage into the plot on purchase
-- Server tracks ownership: plotOwners[player.UserId] = plotModel
--
-- DROPPER PATTERN (server-side, performant):
-- Spawn parts at dropper position every N seconds
-- Use BodyVelocity (NOT TweenService) for conveyor movement:
--   local bv = Instance.new("BodyVelocity")
--   bv.MaxForce = Vector3.new(math.huge, 0, math.huge)
--   bv.Velocity = Vector3.new(0, 0, -10) -- conveyor direction
--   bv.Parent = droppedPart
--
-- COLLECTOR PATTERN:
-- Touched event on collector bin detects resource parts
-- Server validates: is this part from THIS player's plot?
-- Calculate value: baseCost * totalBoost (from upgrades)
-- Credit currency, destroy the part
--
-- ECONOMY BALANCING (DevForum tested method):
-- Set a 1-minute timer — every purchase should take ~1 min to afford
-- This creates consistent progression pacing
-- Upgrade costs: use exponential scaling (cost * 1.5^level)
--
-- CASH DISTRIBUTION (two approaches):
-- SECURE: All server-side, ChildAdded on client destroys other players' parts
-- PERFORMANT: Client spawns visual parts, fires remote, server validates rate
-- Most production games use the performant approach with rate limiting
--
-- REBIRTH FORMULA:
-- rebirthMultiplier = 1 + (rebirthCount * 0.5)
-- Cost to rebirth = baseCost * (2 ^ rebirthCount)
-- On rebirth: reset currency + buildings, keep multiplier
-- DataStore saves: currency, buildings purchased (table), rebirth count
--
-- PURCHASE BUTTONS:
-- Physical Part in workspace with SurfaceGui showing price
-- ProximityPrompt or Touched to trigger purchase
-- Server validates: does player have enough? Is this the right plot?
-- On purchase: clone building from ServerStorage, parent to plot`,
    pitfalls: [
      'Client-side currency (exploitable — ALWAYS server-side)',
      'TweenService for conveyor (use BodyVelocity — physics based)',
      'No rate limiting on purchase remotes (exploit: spam buy)',
      'Storing physical parts in ReplicatedStorage (use ServerStorage)',
      'Not validating plot ownership on purchases (player can buy on others plots)',
      'Linear upgrade costs (exponential feels better: cost * 1.5^level)',
      'Not saving on BindToClose (data lost on server shutdown)',
    ],
  },
  {
    name: 'Simulator Game Architecture (DevForum)',
    keywords: ['simulator', 'collect', 'backpack', 'sell', 'zone', 'rebirth', 'pet sim', 'clicking', 'grinding'],
    snippet: `-- SIMULATOR ARCHITECTURE (from DevForum + Pet Sim/Bee Swarm analysis)
--
-- CORE LOOP: Collect → Store in Backpack → Sell at Pad → Buy Upgrades → Unlock Zones
--
-- COLLECTION SYSTEM:
-- Click/touch collectibles in a zone → add to backpack
-- Each collectible has: value, rarity, respawn time
-- Backpack has capacity limit → forces selling
-- Server validates every collection (anti-exploit)
--
-- SELL PAD:
-- Touched event on sell pad part
-- Calculate total: sum of all backpack items * multiplier
-- Credit currency, clear backpack
-- Play cha-ching sound + coin particle effect
--
-- ZONE UNLOCKING:
-- Each zone has a gate with price
-- ProximityPrompt "Unlock Zone ($X)"
-- Server validates payment, removes gate, saves unlock
-- Higher zones = better collectibles + harder enemies
--
-- PET SYSTEM (Pet Sim pattern):
-- Eggs: buy egg → roll rarity (weighted random)
-- Rarity weights: Common 60%, Uncommon 25%, Rare 10%, Legendary 4%, Mythic 1%
-- local function rollRarity()
--   local roll = math.random(1, 1000)
--   if roll <= 10 then return "Mythic"
--   elseif roll <= 50 then return "Legendary"
--   elseif roll <= 150 then return "Rare"
--   elseif roll <= 400 then return "Uncommon"
--   else return "Common" end
-- end
--
-- Pet follow: use Heartbeat to move pet toward owner
-- Pet stats: multiply collection value/speed
-- Pet fusion: combine 3 same pets → next tier
--
-- BACKPACK EXPANSION:
-- Start with 20 slots, upgrade with currency
-- Costs scale exponentially: 100, 500, 2500, 12500...
-- Each upgrade adds 10-20 slots
--
-- REBIRTH/PRESTIGE:
-- Resets: currency, zones, backpack contents
-- Keeps: pets, gamepasses, rebirth multiplier
-- Formula: multiplier = 1 + (rebirths * 0.25)
-- Makes early game faster on each rebirth`,
    pitfalls: [
      'Client-side backpack (exploitable — track on server)',
      'No backpack capacity limit (infinite grinding = no sell pressure)',
      'Linear zone pricing (exponential creates better progression curve)',
      'Not rate-limiting collection clicks (macro/autoclicker exploit)',
      'Uniform rarity distribution (should be heavily weighted toward common)',
      'Rebirth that resets too much (keep pets/passes or players quit)',
    ],
  },

  // ── NEW KNOWLEDGE ENTRIES (System 11 — DevForum Research) ──────────────

  {
    name: 'Terrain Generation (Procedural)',
    keywords: ['terrain', 'generate', 'biome', 'perlin', 'noise', 'landscape', 'mountain', 'island', 'world', 'procedural', 'heightmap'],
    snippet: `-- PROCEDURAL TERRAIN GENERATION (DevForum best practices)
-- Uses Perlin noise layers for height + biome selection
local Terrain = workspace.Terrain
local RESOLUTION = 4 -- voxel size in studs
local SEED = math.random(1, 999999)

-- Biome materials mapped by moisture + temperature
local BIOMES = {
  {material = Enum.Material.Grass, minHeight = 0, maxHeight = 40, moisture = 0.5},
  {material = Enum.Material.Sand, minHeight = -2, maxHeight = 5, moisture = 0.1},
  {material = Enum.Material.Snow, minHeight = 60, maxHeight = 120, moisture = 0.7},
  {material = Enum.Material.Rock, minHeight = 40, maxHeight = 80, moisture = 0.3},
  {material = Enum.Material.Mud, minHeight = 0, maxHeight = 15, moisture = 0.8},
}

local function getNoise(x: number, z: number, scale: number, offset: number): number
  return math.noise(x / scale + offset, z / scale + offset, SEED) * 0.5 + 0.5
end

local function getHeight(x: number, z: number): number
  -- Layer multiple octaves for natural-looking terrain
  local h = getNoise(x, z, 100, 0) * 60    -- Base terrain
  h += getNoise(x, z, 50, 100) * 20         -- Medium detail
  h += getNoise(x, z, 25, 200) * 8          -- Fine detail
  return h
end

local function getBiomeMaterial(height: number, x: number, z: number): Enum.Material
  local moisture = getNoise(x, z, 80, 500)
  if height > 60 then return Enum.Material.Snow end
  if height > 40 then return Enum.Material.Rock end
  if moisture < 0.3 then return Enum.Material.Sand end
  if moisture > 0.7 then return Enum.Material.Mud end
  return Enum.Material.Grass
end

-- Generate chunk (call per region, NOT all at once)
local function generateChunk(chunkX: number, chunkZ: number, size: number)
  for x = chunkX, chunkX + size, RESOLUTION do
    for z = chunkZ, chunkZ + size, RESOLUTION do
      local height = getHeight(x, z)
      local material = getBiomeMaterial(height, x, z)
      local region = Region3.new(
        Vector3.new(x, 0, z),
        Vector3.new(x + RESOLUTION, height, z + RESOLUTION)
      ):ExpandToGrid(RESOLUTION)
      Terrain:FillRegion(region, RESOLUTION, material)
    end
    task.wait() -- Yield per column to prevent lag spikes
  end
end

-- Water plane
Terrain:FillRegion(
  Region3.new(Vector3.new(-500, -5, -500), Vector3.new(500, 3, 500)):ExpandToGrid(4),
  4, Enum.Material.Water
)`,
    pitfalls: [
      'Not yielding during generation — freezes the server for seconds',
      'Using FillBlock instead of FillRegion — FillRegion is faster for large areas',
      'Resolution below 4 studs — Roblox terrain minimum voxel size is 4',
      'Generating all terrain at once — chunk it and yield between columns',
      'Not using ExpandToGrid — region must align to terrain voxel grid',
    ],
  },

  {
    name: 'Advanced Lighting Setup',
    keywords: ['lighting', 'atmosphere', 'future', 'shadowmap', 'bloom', 'colorcorrection', 'sun', 'fog', 'sky', 'day night', 'mood'],
    snippet: `-- ADVANCED LIGHTING SETUP (DevForum + official Roblox guidance)
-- Future vs ShadowMap: Future = PBR + realistic light sources, ShadowMap = cheaper shadows
-- Use Future for showcases/horror. Use ShadowMap for mobile-first games.

local Lighting = game:GetService("Lighting")

-- PRESET: Warm Daytime (good default for most games)
local function setupWarmDay()
  Lighting.Technology = Enum.Technology.Future
  Lighting.ClockTime = 14.5
  Lighting.GeographicLatitude = 35
  Lighting.Brightness = 2
  Lighting.Ambient = Color3.fromRGB(40, 40, 50)
  Lighting.OutdoorAmbient = Color3.fromRGB(130, 130, 140)
  Lighting.EnvironmentDiffuseScale = 0.6
  Lighting.EnvironmentSpecularScale = 0.4
  Lighting.GlobalShadows = true
  -- Atmosphere (adds depth + distance fog)
  local atm = Instance.new("Atmosphere")
  atm.Density = 0.3
  atm.Offset = 0.25
  atm.Color = Color3.fromRGB(199, 199, 210)
  atm.Decay = Color3.fromRGB(106, 112, 125)
  atm.Glare = 0.2
  atm.Haze = 2
  atm.Parent = Lighting
  -- Color correction for vibrancy
  local cc = Instance.new("ColorCorrectionEffect")
  cc.Brightness = 0.02
  cc.Contrast = 0.08
  cc.Saturation = 0.15
  cc.TintColor = Color3.fromRGB(255, 248, 240)
  cc.Parent = Lighting
end

-- PRESET: Horror/Night
local function setupHorror()
  Lighting.Technology = Enum.Technology.Future
  Lighting.ClockTime = 0.5
  Lighting.Brightness = 0
  Lighting.Ambient = Color3.fromRGB(10, 10, 15)
  Lighting.OutdoorAmbient = Color3.fromRGB(15, 15, 25)
  Lighting.EnvironmentDiffuseScale = 0
  Lighting.EnvironmentSpecularScale = 0
  local atm = Instance.new("Atmosphere")
  atm.Density = 0.5
  atm.Offset = 0
  atm.Color = Color3.fromRGB(20, 20, 30)
  atm.Decay = Color3.fromRGB(10, 10, 15)
  atm.Glare = 0
  atm.Haze = 8
  atm.Parent = Lighting
  -- Bloom for flashlight glow
  local bloom = Instance.new("BloomEffect")
  bloom.Intensity = 0.8
  bloom.Size = 24
  bloom.Threshold = 1.5
  bloom.Parent = Lighting
end

-- PRESET: Sunset/Golden Hour
local function setupSunset()
  Lighting.Technology = Enum.Technology.Future
  Lighting.ClockTime = 17.8
  Lighting.Brightness = 2.5
  Lighting.Ambient = Color3.fromRGB(60, 40, 30)
  Lighting.OutdoorAmbient = Color3.fromRGB(180, 140, 100)
  local atm = Instance.new("Atmosphere")
  atm.Density = 0.35
  atm.Offset = 0.5
  atm.Color = Color3.fromRGB(255, 200, 140)
  atm.Decay = Color3.fromRGB(255, 140, 60)
  atm.Glare = 0.6
  atm.Haze = 3
  atm.Parent = Lighting
end`,
    pitfalls: [
      'Setting EnvironmentDiffuseScale and EnvironmentSpecularScale to 0 kills all environment reflections',
      'Future lighting on mobile = poor FPS. Use ShadowMap for mobile-first games.',
      'Too much Bloom (Intensity > 1.5) makes everything look washed out',
      'Forgetting Atmosphere — without it Future lighting looks flat and unrealistic',
      'Using Fog properties (FogStart/FogEnd) with Atmosphere — they conflict. Pick one.',
    ],
  },

  {
    name: 'Tycoon Architecture',
    keywords: ['tycoon', 'factory', 'dropper', 'conveyor', 'collector', 'plot', 'rebirth', 'upgrade', 'income', 'button', 'unlock'],
    snippet: `-- TYCOON ARCHITECTURE (DevForum patterns from top games)
-- Structure: Plots in Workspace, Scripts in SSS, Remotes in RS
-- Each player gets a CLONED plot. Never share workspace objects.

-- SERVER: Plot assignment
local PlotTemplate = game.ServerStorage:WaitForChild("PlotTemplate")
local Plots = workspace:WaitForChild("Plots")
local playerPlots = {}

game.Players.PlayerAdded:Connect(function(player)
  local plot = PlotTemplate:Clone()
  plot.Name = "Plot_" .. player.UserId
  plot.Parent = Plots
  playerPlots[player.UserId] = plot
  -- Teleport player to their plot
  local spawn = plot:FindFirstChild("SpawnPad")
  if spawn then
    player.CharacterAdded:Connect(function(char)
      task.wait(0.1)
      char:PivotTo(spawn.CFrame + Vector3.new(0, 5, 0))
    end)
  end
end)

game.Players.PlayerRemoving:Connect(function(player)
  local plot = playerPlots[player.UserId]
  if plot then plot:Destroy() end
  playerPlots[player.UserId] = nil
end)

-- DROPPER: Spawns items on interval (server-side)
local function setupDropper(dropper: Model, plot: Model)
  local spawnPart = dropper:FindFirstChild("SpawnPoint")
  local valuePerDrop = dropper:GetAttribute("Value") or 1
  local interval = dropper:GetAttribute("Interval") or 2
  task.spawn(function()
    while plot.Parent do
      local drop = Instance.new("Part")
      drop.Size = Vector3.new(1, 1, 1)
      drop.Material = Enum.Material.Metal
      drop.BrickColor = BrickColor.new("Bright yellow")
      drop.CFrame = spawnPart.CFrame
      drop.Parent = plot:FindFirstChild("Drops")
      drop:SetAttribute("Value", valuePerDrop)
      game.Debris:AddItem(drop, 15) -- Auto-cleanup after 15s
      task.wait(interval)
    end
  end)
end

-- COLLECTOR: Detects drops, adds money (server-side)
local function setupCollector(collector: BasePart, player: Player)
  collector.Touched:Connect(function(hit)
    local value = hit:GetAttribute("Value")
    if value then
      -- Add to player's money (use leaderstats or DataStore)
      local ls = player:FindFirstChild("leaderstats")
      if ls and ls:FindFirstChild("Money") then
        ls.Money.Value += value
      end
      hit:Destroy()
    end
  end)
end

-- UPGRADE BUTTONS: Increasing cost per level
-- Cost formula: baseCost * multiplier ^ level
local function getUpgradeCost(baseCost: number, level: number): number
  return math.floor(baseCost * 1.5 ^ level)
end`,
    pitfalls: [
      'Not cloning plots — all players editing same workspace objects',
      'Client-side money tracking (exploitable — always server-side)',
      'Not using Debris:AddItem on drops — they accumulate and lag the server',
      'Linear upgrade costs (1.5^ or 2^ exponential feels much better)',
      'Forgetting BindToClose to save tycoon progress on shutdown',
    ],
  },

  {
    name: 'Simulator Architecture',
    keywords: ['simulator', 'collect', 'sell pad', 'backpack', 'zone', 'rebirth', 'prestige', 'grinding', 'gems', 'coins', 'mining'],
    snippet: `-- SIMULATOR ARCHITECTURE (DevForum patterns)
-- Core loop: Collect → Fill Backpack → Sell → Upgrade → Unlock Zone → Repeat

-- SERVER: Player data module
local PlayerData = {}
local function getPlayerData(player: Player)
  if not PlayerData[player.UserId] then
    PlayerData[player.UserId] = {
      backpack = 0,
      backpackMax = 10,
      coins = 0,
      gems = 0,
      rebirths = 0,
      zone = 1,
      multiplier = 1,
    }
  end
  return PlayerData[player.UserId]
end

-- COLLECTION ZONE: Click/touch to collect
local function setupCollectionZone(zone: Model, zoneLevel: number)
  local collectParts = zone:FindFirstChild("Collectibles")
  if not collectParts then return end
  for _, part in collectParts:GetChildren() do
    local cd = Instance.new("ClickDetector")
    cd.MaxActivationDistance = 15
    cd.Parent = part
    cd.MouseClick:Connect(function(player)
      local data = getPlayerData(player)
      if data.backpack >= data.backpackMax then return end -- Full!
      if data.zone < zoneLevel then return end -- Not unlocked
      local value = zoneLevel * data.multiplier
      data.backpack += value
      -- Visual feedback: shrink and respawn
      part.Transparency = 1
      task.delay(3, function()
        part.Transparency = 0
      end)
    end)
  end
end

-- SELL PAD: Step on to sell backpack contents
local function setupSellPad(pad: BasePart)
  pad.Touched:Connect(function(hit)
    local player = game.Players:GetPlayerFromCharacter(hit.Parent)
    if not player then return end
    local data = getPlayerData(player)
    if data.backpack <= 0 then return end
    local earned = data.backpack -- 1:1 conversion
    data.coins += earned
    data.backpack = 0
    -- Fire client for sell animation
    game.ReplicatedStorage.Remotes.SellEffect:FireClient(player, earned)
  end)
end

-- ZONE UNLOCKING: Gate by coin cost
local ZONE_PRICES = {0, 100, 500, 2500, 15000, 100000}

-- REBIRTH: Reset coins/zones, keep pets, gain multiplier
local function rebirth(player: Player)
  local data = getPlayerData(player)
  local rebirthCost = 100000 * (2 ^ data.rebirths) -- Exponential
  if data.coins < rebirthCost then return end
  data.rebirths += 1
  data.multiplier = 1 + (data.rebirths * 0.5) -- +50% per rebirth
  data.coins = 0
  data.backpack = 0
  data.zone = 1
  -- Keep: pets, gamepasses, gems
end`,
    pitfalls: [
      'Client-side backpack (exploitable — track on server)',
      'No backpack capacity limit (infinite grinding = no sell pressure)',
      'Linear zone pricing (exponential creates better progression curve)',
      'Not rate-limiting collection clicks (macro/autoclicker exploit)',
      'Rebirth that resets too much (keep pets/passes or players quit)',
    ],
  },

  {
    name: 'Pet System (Egg Hatching + Following)',
    keywords: ['pet', 'egg', 'hatch', 'rarity', 'legendary', 'mythic', 'follow', 'equip', 'pet system', 'gacha', 'luck'],
    snippet: `-- PET SYSTEM (DevForum patterns from Pet Simulator-style games)
-- Weighted rarity roll + egg configuration + pet following

-- CONFIG: Egg definitions (chances MUST sum to TotalChance)
local EGG_CONFIG = {
  StarterEgg = {
    Price = 100,
    Pets = {
      {Name = "Dog", Rarity = "Common", Chance = 50},
      {Name = "Cat", Rarity = "Common", Chance = 30},
      {Name = "Fox", Rarity = "Rare", Chance = 15},
      {Name = "Dragon", Rarity = "Legendary", Chance = 4},
      {Name = "Phoenix", Rarity = "Mythic", Chance = 1},
    },
    TotalChance = 100,
  },
}

-- WEIGHTED RANDOM: Rolls a pet from an egg
local function rollPet(eggName: string, luckMultiplier: number?): (string, string)
  local egg = EGG_CONFIG[eggName]
  if not egg then return "Dog", "Common" end
  local luck = luckMultiplier or 1
  -- Luck boosts rare chances: multiply rare pet weights
  local adjusted = {}
  local total = 0
  for _, pet in ipairs(egg.Pets) do
    local weight = pet.Chance
    if pet.Rarity ~= "Common" then
      weight = weight * luck -- Luck boosts non-common
    end
    total += weight
    table.insert(adjusted, {Name = pet.Name, Rarity = pet.Rarity, Weight = weight})
  end
  local roll = math.random() * total
  for _, pet in ipairs(adjusted) do
    roll -= pet.Weight
    if roll <= 0 then
      return pet.Name, pet.Rarity
    end
  end
  return adjusted[1].Name, adjusted[1].Rarity -- Fallback
end

-- PET FOLLOWING: Attach pet model behind player
local function equipPet(player: Player, petName: string)
  local character = player.Character
  if not character then return end
  local hrp = character:FindFirstChild("HumanoidRootPart")
  if not hrp then return end
  -- Clone pet model
  local petModel = game.ReplicatedStorage.Pets:FindFirstChild(petName)
  if not petModel then return end
  local pet = petModel:Clone()
  pet.Name = "EquippedPet"
  -- Remove old pet
  local old = character:FindFirstChild("EquippedPet")
  if old then old:Destroy() end
  -- AlignPosition: follows player smoothly
  local att0 = Instance.new("Attachment", pet.PrimaryPart)
  local att1 = Instance.new("Attachment", hrp)
  att1.Position = Vector3.new(2, 0, 3) -- Offset: right + behind
  local align = Instance.new("AlignPosition")
  align.Attachment0 = att0
  align.Attachment1 = att1
  align.MaxForce = 25000
  align.Responsiveness = 15
  align.Parent = pet.PrimaryPart
  -- AlignOrientation: faces same direction as player
  local ori = Instance.new("AlignOrientation")
  ori.Attachment0 = att0
  ori.Attachment1 = att1
  ori.Responsiveness = 10
  ori.Parent = pet.PrimaryPart
  pet.Parent = character
end`,
    pitfalls: [
      'Client-side rarity rolls (exploitable — ALWAYS roll on server)',
      'Not using weighted random correctly — uniform random ignores rarity weights',
      'Pet following with CFrame loop instead of AlignPosition (laggy, not physics-based)',
      'No fallback in rarity roll — floating point precision can skip all pets',
      'Luck multiplier on Common pets makes them MORE common (only boost rares)',
    ],
  },

  {
    name: 'Anti-Exploit (Server Validation)',
    keywords: ['exploit', 'cheat', 'hack', 'validate', 'security', 'anti-cheat', 'rate limit', 'sanity', 'trust', 'fireserver'],
    snippet: `-- ANTI-EXPLOIT PATTERNS (DevForum security best practices)
-- Rule #1: NEVER trust the client. Validate EVERYTHING on server.

-- RATE LIMITER: Prevent remote event spam
local rateLimits = {} -- [userId] = {[remoteName] = lastFireTime}
local RATE_LIMIT = 0.2 -- Minimum seconds between fires

local function isRateLimited(player: Player, remoteName: string): boolean
  local userId = player.UserId
  if not rateLimits[userId] then
    rateLimits[userId] = {}
  end
  local lastFire = rateLimits[userId][remoteName] or 0
  if tick() - lastFire < RATE_LIMIT then
    return true -- Too fast! Block it.
  end
  rateLimits[userId][remoteName] = tick()
  return false
end

-- TYPE VALIDATOR: Check argument types before processing
local function validateArgs(args: {any}, expected: {string}): boolean
  if #args ~= #expected then return false end
  for i, arg in ipairs(args) do
    if typeof(arg) ~= expected[i] then return false end
  end
  return true
end

-- USAGE: Secure remote event handler
local ShopRemote = game.ReplicatedStorage.Remotes.Purchase

ShopRemote.OnServerEvent:Connect(function(player, itemId, quantity)
  -- 1. Rate limit
  if isRateLimited(player, "Purchase") then return end
  -- 2. Type check
  if typeof(itemId) ~= "string" then return end
  if typeof(quantity) ~= "number" then return end
  -- 3. Sanity check values
  if quantity < 1 or quantity > 100 then return end
  if not math.floor(quantity) == quantity then return end -- Must be integer
  -- 4. Validate item exists
  local item = ItemDatabase[itemId]
  if not item then return end
  -- 5. Server-side balance check (NEVER trust client balance)
  local playerMoney = getServerMoney(player)
  local totalCost = item.Price * quantity
  if playerMoney < totalCost then return end
  -- 6. Process purchase on server
  deductMoney(player, totalCost)
  addToInventory(player, itemId, quantity)
end)

-- CLEANUP on leave
game.Players.PlayerRemoving:Connect(function(player)
  rateLimits[player.UserId] = nil
end)`,
    pitfalls: [
      'Trusting client-sent currency values (exploiter sends 999999 coins)',
      'No rate limiting — exploiters can fire remotes 1000+ times/second',
      'typeof() check only — also validate RANGES and CONTENTS',
      'Forgetting to clean up rate limit tables on PlayerRemoving (memory leak)',
      'Using RemoteFunction for purchases (client can hang the server — use RemoteEvent)',
    ],
  },

  {
    name: 'Camera Manipulation',
    keywords: ['camera', 'orbit', 'cinematic', 'first person', 'cutscene', 'spectate', 'zoom', 'follow cam', 'top down', 'isometric'],
    snippet: `-- CAMERA MANIPULATION (DevForum techniques)
-- LOCAL SCRIPT ONLY — camera is client-side

local RunService = game:GetService("RunService")
local camera = workspace.CurrentCamera

-- ORBIT CAMERA: Smooth rotation around a target
local function orbitCamera(target: Vector3, radius: number, speed: number)
  camera.CameraType = Enum.CameraType.Scriptable
  local angle = 0
  local conn
  conn = RunService.RenderStepped:Connect(function(dt)
    angle += speed * dt
    local offset = Vector3.new(
      math.cos(angle) * radius,
      radius * 0.5,
      math.sin(angle) * radius
    )
    camera.CFrame = CFrame.lookAt(target + offset, target)
  end)
  return conn -- Store to disconnect later
end

-- CINEMATIC: Smooth tween between points
local TweenService = game:GetService("TweenService")
local function cinematicMove(from: CFrame, to: CFrame, duration: number)
  camera.CameraType = Enum.CameraType.Scriptable
  camera.CFrame = from
  local tween = TweenService:Create(camera, TweenInfo.new(
    duration, Enum.EasingStyle.Quad, Enum.EasingDirection.InOut
  ), {CFrame = to})
  tween:Play()
  tween.Completed:Wait()
end

-- FIRST PERSON LOCK: Force camera into head
local function lockFirstPerson()
  local player = game.Players.LocalPlayer
  player.CameraMode = Enum.CameraMode.LockFirstPerson
  player.CameraMinZoomDistance = 0.5
  player.CameraMaxZoomDistance = 0.5
end

-- RESTORE DEFAULT CAMERA
local function restoreCamera()
  camera.CameraType = Enum.CameraType.Custom
  local player = game.Players.LocalPlayer
  player.CameraMode = Enum.CameraMode.Classic
  player.CameraMinZoomDistance = 0.5
  player.CameraMaxZoomDistance = 128
end

-- TOP-DOWN / ISOMETRIC CAMERA
local function topDownCamera(target: Vector3, height: number)
  camera.CameraType = Enum.CameraType.Scriptable
  local conn
  conn = RunService.RenderStepped:Connect(function()
    camera.CFrame = CFrame.lookAt(
      target + Vector3.new(0, height, 0),
      target
    )
  end)
  return conn
end`,
    pitfalls: [
      'Forgetting to set CameraType = Scriptable before manipulating (camera fights you)',
      'Not restoring CameraType = Custom when done (player stuck in scriptable mode)',
      'Using wait() instead of RenderStepped for camera updates (jittery)',
      'Not disconnecting RenderStepped connections (memory leak + multiple cameras fighting)',
      'Setting CFrame every frame without lerp (snaps instead of smooth movement)',
    ],
  },

  {
    name: 'Player Retention Design',
    keywords: ['retention', 'onboarding', 'first time', 'tutorial', 'daily', 'reward', 'streak', 'hook', 'engagement', 'session'],
    snippet: `-- PLAYER RETENTION (DevForum + 2025 Roblox Benchmark data)
-- Median D1 retention on Roblox: ~4%. Top games: 25-40%.
-- The first 30 seconds decide if a player stays or leaves.

-- RULE 1: Instant reward within 10 seconds of joining
game.Players.PlayerAdded:Connect(function(player)
  player.CharacterAdded:Connect(function(char)
    task.wait(1) -- Let them load in
    -- Give immediate free item or power
    local tool = game.ServerStorage.StarterSword:Clone()
    tool.Parent = player.Backpack
    -- Show welcome GUI with clear objective
    game.ReplicatedStorage.Remotes.ShowObjective:FireClient(
      player, "Defeat 3 slimes to earn your first reward!"
    )
  end)
end)

-- RULE 2: Mini-goal completable in 60 seconds
-- Don't dump players into an empty world. Give them a TASK.
-- Examples: "Collect 5 coins", "Reach the checkpoint", "Open your first egg"

-- RULE 3: Daily login rewards (escalating)
local DAILY_REWARDS = {
  {day = 1, reward = "100 Coins"},
  {day = 2, reward = "200 Coins"},
  {day = 3, reward = "1 Free Egg"},
  {day = 4, reward = "500 Coins"},
  {day = 5, reward = "1 Rare Pet"},
  {day = 6, reward = "1000 Coins"},
  {day = 7, reward = "1 Legendary Egg"},
}

-- RULE 4: Session length hooks
-- At 5 min: "You unlocked a bonus area!"
-- At 15 min: "Streak bonus: 2x coins for 5 minutes"
-- At 30 min: "Daily challenge complete — claim reward"

-- RULE 5: Loss aversion (they LOSE something by leaving)
-- Timed events: "Double XP ends in 10:00"
-- Growing resources: "Your farm produces while you play"
-- Social: "Your friend just beat your high score!"

-- ANTI-PATTERNS (what kills retention):
-- Long loading screens (>5 seconds = 30% bounce)
-- No clear objective (player wanders, gets bored, leaves)
-- Difficulty spike too early (die 3 times in first minute = quit)
-- Pay-to-progress gates in first 10 minutes (feels unfair)`,
    pitfalls: [
      'No objective shown in first 10 seconds (players leave confused)',
      'Tutorial that takes longer than 2 minutes (players skip or quit)',
      'Punishing death too harshly early on (lose all progress = rage quit)',
      'Loading screen longer than 5 seconds without progress indicator',
      'Daily rewards that reset on miss (streaks should be forgiving — 1 day grace)',
    ],
  },

  {
    name: 'Module Organization (Service Pattern)',
    keywords: ['module', 'service', 'organize', 'require', 'structure', 'controller', 'manager', 'singleton', 'clean code'],
    snippet: `-- MODULE ORGANIZATION (DevForum best practices)
-- Pattern: Each system is a ModuleScript returning a table of functions.
-- Put shared modules in ReplicatedStorage/Modules/
-- Put server-only modules in ServerStorage/Modules/

-- ReplicatedStorage/Modules/CurrencyModule.lua (shared types + constants)
local CurrencyModule = {}

CurrencyModule.CURRENCIES = {
  Coins = {icon = "rbxassetid://123", color = Color3.fromRGB(255, 215, 0)},
  Gems = {icon = "rbxassetid://456", color = Color3.fromRGB(0, 200, 255)},
}

function CurrencyModule.Format(amount: number): string
  if amount >= 1e9 then return string.format("%.1fB", amount / 1e9)
  elseif amount >= 1e6 then return string.format("%.1fM", amount / 1e6)
  elseif amount >= 1e3 then return string.format("%.1fK", amount / 1e3)
  end
  return tostring(math.floor(amount))
end

return CurrencyModule

-- ServerStorage/Modules/DataService.lua (server-only)
-- Pattern: Init once, expose functions, never expose raw DataStore
local DataService = {}
local cache = {} -- In-memory cache per player

function DataService.Init()
  -- Called once from main server script
  game.Players.PlayerAdded:Connect(function(p)
    DataService.Load(p)
  end)
  game.Players.PlayerRemoving:Connect(function(p)
    DataService.Save(p)
    cache[p.UserId] = nil
  end)
  game:BindToClose(function()
    for _, player in game.Players:GetPlayers() do
      DataService.Save(player)
    end
  end)
end

function DataService.Get(player: Player, key: string): any
  return cache[player.UserId] and cache[player.UserId][key]
end

function DataService.Set(player: Player, key: string, value: any)
  if cache[player.UserId] then
    cache[player.UserId][key] = value
  end
end

return DataService`,
    pitfalls: [
      'Using _G or shared for globals (breaks when load order changes — use require())',
      'Circular dependencies between modules (A requires B which requires A — use events)',
      'Not caching require() results (Roblox caches automatically but pattern matters)',
      'Giant monolith scripts instead of modules (1000+ line scripts are unmaintainable)',
      'Putting server logic in ReplicatedStorage (clients can read it — use ServerStorage)',
    ],
  },

  {
    name: 'Vehicle Physics (Constraint-Based)',
    keywords: ['vehicle', 'car', 'drive', 'seat', 'vehicleseat', 'suspension', 'wheel', 'steering', 'race', 'speed', 'boost'],
    snippet: `-- VEHICLE PHYSICS (DevForum raycast + constraint approach)
-- Modern approach: CylindricalConstraint for wheels, Spring for suspension
-- VehicleSeat for input, raycasts for ground detection

local RunService = game:GetService("RunService")

-- SIMPLE VEHICLE SETUP (VehicleSeat + constraints)
local function setupVehicle(carModel: Model)
  local body = carModel:FindFirstChild("Body")
  local seat = carModel:FindFirstChild("VehicleSeat") :: VehicleSeat
  if not body or not seat then return end

  seat.MaxSpeed = 80
  seat.Torque = 20
  seat.TurnSpeed = 4

  -- Boost pad detection
  local boosted = false
  body.Touched:Connect(function(hit)
    if hit.Name == "BoostPad" and not boosted then
      boosted = true
      seat.MaxSpeed = 160
      task.delay(3, function()
        seat.MaxSpeed = 80
        boosted = false
      end)
    end
  end)
end

-- RAYCAST SUSPENSION (advanced — better than SpringConstraint for realism)
local STIFFNESS = 2500
local DAMPING = 250
local REST_LENGTH = 2
local WHEEL_RADIUS = 1.5

local function getVelocityAtPoint(part: BasePart, worldPoint: Vector3): Vector3
  return part.AssemblyLinearVelocity +
    part.AssemblyAngularVelocity:Cross(worldPoint - part.Position)
end

local function updateSuspension(body: BasePart, wheelAttachment: Attachment, springForce: VectorForce)
  local down = -wheelAttachment.WorldCFrame.UpVector
  local start = wheelAttachment.WorldPosition
  local params = RaycastParams.new()
  params.FilterDescendantsInstances = {body.Parent}
  params.RespectCanCollide = true

  local result = workspace:Raycast(start, down * (REST_LENGTH + WHEEL_RADIUS), params)
  if result then
    local distance = result.Distance - WHEEL_RADIUS
    local displacement = REST_LENGTH - distance
    local velocity = getVelocityAtPoint(body, wheelAttachment.WorldPosition)
    local vertSpeed = body.CFrame.UpVector:Dot(velocity)
    local force = (STIFFNESS * displacement) - (DAMPING * vertSpeed)
    springForce.Force = Vector3.new(0, math.max(force, 0), 0)
  else
    springForce.Force = Vector3.zero
  end
end

-- CHECKPOINT SYSTEM (for racing)
local function setupCheckpoints(checkpoints: Folder)
  local playerProgress = {} -- [userId] = lastCheckpoint
  for i, cp in ipairs(checkpoints:GetChildren()) do
    cp.Touched:Connect(function(hit)
      local player = game.Players:GetPlayerFromCharacter(hit.Parent)
      if not player then return end
      local last = playerProgress[player.UserId] or 0
      if i == last + 1 then -- Must hit in order
        playerProgress[player.UserId] = i
        if i == #checkpoints:GetChildren() then
          -- Lap complete!
        end
      end
    end)
  end
end`,
    pitfalls: [
      'Using BodyVelocity for vehicles (deprecated — use VectorForce or LinearVelocity)',
      'VehicleSeat MaxSpeed too high without suspension (car flips on bumps)',
      'Not filtering the car model from raycasts (suspension detects own parts)',
      'Checkpoints that can be skipped (always validate sequential order)',
      'Client-side speed boosts (exploitable — validate on server)',
    ],
  },

  {
    name: 'DataStore with Session Locking (ProfileStore Pattern)',
    keywords: ['profileservice', 'profilestore', 'session lock', 'save data', 'load data', 'data loss', 'autosave', 'bindtoclose'],
    snippet: `-- SESSION-LOCKED DATASTORE (ProfileStore/ProfileService pattern)
-- Prevents data duplication when player hops between servers fast.
-- Use ProfileStore module for production. This shows the PATTERN.

local DataStoreService = game:GetService("DataStoreService")
local store = DataStoreService:GetDataStore("PlayerData_v2")
local JOB_ID = game.JobId
local AUTOSAVE_INTERVAL = 300 -- 5 minutes (ProfileStore default)
local sessions = {} -- [userId] = {data, lastSave}

local DEFAULT_DATA = {
  Coins = 0, Gems = 0, Level = 1, XP = 0,
  Inventory = {}, Pets = {}, Settings = {},
}

local function deepCopy(t)
  if type(t) ~= "table" then return t end
  local copy = {}
  for k, v in pairs(t) do copy[k] = deepCopy(v) end
  return copy
end

-- LOAD with session lock claim
local function loadPlayer(player: Player)
  local key = "Player_" .. player.UserId
  local data
  local success, err = pcall(function()
    data = store:UpdateAsync(key, function(old)
      if old == nil then
        local new = deepCopy(DEFAULT_DATA)
        new._sessionLock = JOB_ID
        new._lockTime = os.time()
        return new
      end
      -- Check if another server holds the lock
      if old._sessionLock and old._sessionLock ~= JOB_ID then
        local elapsed = os.time() - (old._lockTime or 0)
        if elapsed < 1800 then -- 30 min lease
          return nil -- Abort! Other server owns this data
        end
      end
      old._sessionLock = JOB_ID
      old._lockTime = os.time()
      return old
    end)
  end)
  if success and data then
    sessions[player.UserId] = {data = data, lastSave = tick()}
  else
    warn("Failed to load data for", player.Name, err)
    player:Kick("Data failed to load. Please rejoin.")
  end
end

-- SAVE with session lock release
local function savePlayer(player: Player, releasing: boolean)
  local session = sessions[player.UserId]
  if not session then return end
  local key = "Player_" .. player.UserId
  pcall(function()
    store:UpdateAsync(key, function(old)
      if old and old._sessionLock ~= JOB_ID then
        return nil -- Another server claimed it — don't overwrite
      end
      local toSave = session.data
      if releasing then
        toSave._sessionLock = nil
        toSave._lockTime = nil
      else
        toSave._lockTime = os.time()
      end
      return toSave
    end)
  end)
  session.lastSave = tick()
end

-- AUTOSAVE loop
task.spawn(function()
  while true do
    task.wait(AUTOSAVE_INTERVAL)
    for _, player in game.Players:GetPlayers() do
      savePlayer(player, false)
    end
  end
end)

game.Players.PlayerAdded:Connect(loadPlayer)
game.Players.PlayerRemoving:Connect(function(p)
  savePlayer(p, true)
  sessions[p.UserId] = nil
end)
game:BindToClose(function()
  for _, p in game.Players:GetPlayers() do
    savePlayer(p, true)
  end
end)`,
    pitfalls: [
      'Using GetAsync + SetAsync (race condition — ALWAYS use UpdateAsync for locks)',
      'No BindToClose (data lost when server shuts down)',
      'Autosave interval too short (DataStore rate limits: 60+n*10 req/min)',
      'Not kicking player when data fails to load (they play with default data and overwrite)',
      'Forgetting to release session lock on PlayerRemoving (data stuck for 30 min)',
    ],
  },

  {
    name: 'Obby Architecture',
    keywords: ['obby', 'obstacle', 'checkpoint', 'stage', 'kill brick', 'spawn', 'parkour', 'jump', 'difficulty'],
    snippet: `-- OBBY ARCHITECTURE (DevForum patterns)
-- Checkpoints save per-player. Kill bricks respawn at last checkpoint.

local DataStoreService = game:GetService("DataStoreService")
local stageStore = DataStoreService:GetDataStore("ObbyStages")
local playerStages = {} -- [userId] = currentStage

-- CHECKPOINT SYSTEM
local Stages = workspace:WaitForChild("Stages") -- Folder of numbered stages

game.Players.PlayerAdded:Connect(function(player)
  -- Load saved stage
  local success, stage = pcall(function()
    return stageStore:GetAsync("Stage_" .. player.UserId)
  end)
  playerStages[player.UserId] = (success and stage) or 1

  -- Create leaderstats
  local ls = Instance.new("Folder")
  ls.Name = "leaderstats"
  ls.Parent = player
  local stageVal = Instance.new("IntValue")
  stageVal.Name = "Stage"
  stageVal.Value = playerStages[player.UserId]
  stageVal.Parent = ls

  -- Spawn at saved stage
  player.CharacterAdded:Connect(function(char)
    task.wait(0.2)
    local stagePart = Stages:FindFirstChild(tostring(playerStages[player.UserId]))
    if stagePart then
      char:PivotTo(stagePart.CFrame + Vector3.new(0, 5, 0))
    end
  end)
end)

-- CHECKPOINT TOUCHED
for _, stage in Stages:GetChildren() do
  local stageNum = tonumber(stage.Name)
  if not stageNum then continue end
  stage.Touched:Connect(function(hit)
    local player = game.Players:GetPlayerFromCharacter(hit.Parent)
    if not player then return end
    local current = playerStages[player.UserId] or 1
    if stageNum == current + 1 then -- Must be NEXT stage
      playerStages[player.UserId] = stageNum
      local ls = player:FindFirstChild("leaderstats")
      if ls then ls.Stage.Value = stageNum end
      -- Save periodically (not every checkpoint — batch saves)
    end
  end)
end

-- KILL BRICKS: Respawn at checkpoint
local function setupKillBrick(part: BasePart)
  part.Touched:Connect(function(hit)
    local humanoid = hit.Parent:FindFirstChild("Humanoid") :: Humanoid?
    if humanoid and humanoid.Health > 0 then
      humanoid.Health = 0 -- Character respawns at checkpoint
    end
  end)
end

-- SPEEDRUN TIMER (client-side display, server-side validation)
-- Start timer when player passes stage 1, stop at final stage
-- Validate time server-side: if completionTime < minimumPossibleTime then reject`,
    pitfalls: [
      'Saving every single checkpoint touch (DataStore rate limited — batch saves)',
      'Kill bricks that detect non-character parts (check for Humanoid first)',
      'No sequential checkpoint validation (players can skip to end)',
      'Client-side speedrun timer (exploitable — validate on server)',
      'Difficulty that spikes too fast (ramp up gradually or players quit at stage 5)',
    ],
  },

  {
    name: 'RPG Combat & Quest System',
    keywords: ['rpg', 'combat', 'quest', 'stats', 'damage', 'health', 'xp', 'level up', 'inventory', 'npc', 'boss', 'skill'],
    snippet: `-- RPG ARCHITECTURE (DevForum patterns)
-- Stats, damage formula, quest state machine, inventory

-- STAT SYSTEM (server-side)
local function createStats(player: Player)
  return {
    Level = 1, XP = 0, XPToLevel = 100,
    HP = 100, MaxHP = 100,
    ATK = 10, DEF = 5, SPD = 10,
  }
end

-- DAMAGE FORMULA (balanced, accounts for DEF)
local function calculateDamage(attackerATK: number, defenderDEF: number): number
  local baseDamage = attackerATK - (defenderDEF * 0.4)
  local variance = baseDamage * 0.15 -- +/- 15% random
  local finalDamage = baseDamage + (math.random() * 2 - 1) * variance
  return math.max(math.floor(finalDamage), 1) -- Minimum 1 damage
end

-- XP & LEVEL UP
local function awardXP(playerData, amount: number)
  playerData.XP += amount
  while playerData.XP >= playerData.XPToLevel do
    playerData.XP -= playerData.XPToLevel
    playerData.Level += 1
    playerData.XPToLevel = math.floor(100 * 1.3 ^ playerData.Level)
    -- Stat gains per level
    playerData.MaxHP += 10
    playerData.HP = playerData.MaxHP
    playerData.ATK += 2
    playerData.DEF += 1
  end
end

-- QUEST STATE MACHINE
export type QuestState = "NotStarted" | "Active" | "TurnIn" | "Completed"
local function createQuest(id: string, name: string, goal: number)
  return {
    Id = id, Name = name,
    State = "NotStarted" :: QuestState,
    Progress = 0, Goal = goal,
    Rewards = {XP = 50, Coins = 100},
  }
end

local function updateQuest(quest, progress: number)
  if quest.State ~= "Active" then return end
  quest.Progress = math.min(quest.Progress + progress, quest.Goal)
  if quest.Progress >= quest.Goal then
    quest.State = "TurnIn" -- Player must talk to NPC to complete
  end
end

-- NPC DIALOGUE (simple branching)
local DIALOGUES = {
  QuestGiver1 = {
    NotStarted = {
      text = "The forest is overrun with slimes! Can you defeat 5?",
      options = {
        {label = "Accept", action = "StartQuest", questId = "slime_hunt"},
        {label = "Not now", action = "Close"},
      },
    },
    TurnIn = {
      text = "You did it! Here is your reward.",
      options = {{label = "Claim", action = "CompleteQuest", questId = "slime_hunt"}},
    },
  },
}`,
    pitfalls: [
      'Client-side damage calculation (exploiter one-shots everything)',
      'No damage variance (combat feels robotic without randomness)',
      'XP formula that makes leveling take same time every level (should be exponential)',
      'Quest progress tracked on client (exploiter completes instantly)',
      'NPC dialogue without state check (player can turn in quest they never started)',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DEVFORUM PRO BUILDER KNOWLEDGE — Extracted from 20+ top DevForum threads
  // ═══════════════════════════════════════════════════════════════════════════

  {
    name: 'Pro Building — Dimensions & Scale (DevForum)',
    keywords: ['build', 'house', 'building', 'wall', 'door', 'window', 'room', 'scale', 'size', 'stud', 'dimension', 'architecture', 'structure', 'cabin', 'castle', 'shop', 'store', 'apartment', 'office'],
    snippet: `-- PRO BUILDER DIMENSIONS (from DevForum showcase builders)
-- R15 character height: ~5 studs (1 stud = 0.28 meters)
-- GOLDEN RULE: Scale to Roblox character, NOT real-world measurements

-- ROOM & STRUCTURE SIZES:
-- Standard room height: 10-12 studs (comfortable for R15)
-- Standard door: 4.6W x 6.7H studs (with 0.05 thick door part)
-- Standard window: 3W x 3H studs (centered at ~6 studs up)
-- Hallway width: 6-8 studs minimum
-- Staircase: 2 stud treads, 1 stud risers, 6-8 studs wide

-- WALL CONSTRUCTION:
-- Wall thickness: 0.8-1.0 studs (NEVER 2-4, looks chunky)
-- Walls thinner than 0.4 studs = exploiters clip through
-- ALWAYS: wall panel + baseboard(0.3h) + crown molding(0.2h) + corner posts(0.4x0.4)

-- ROOF RULES:
-- Overhang: 1.5-2.0 studs past walls (NEVER flush — looks amateur)
-- Roof pitch: 30-45 degrees using WedgeParts
-- Chimney: 1.5x1.5 studs, extends 3-4 studs above ridge

-- FOUNDATION:
-- Every building sits on a visible foundation
-- 0.5-1.0 stud thick, extends 0.5-1.0 past walls
-- Material: Concrete or Cobblestone, slightly darker than walls

-- GRID SNAPPING (pro workflow):
-- Structure: 1 stud grid | Detail: 0.2 stud | Fine: 0.125 stud
-- Rotation: 15 degrees for main, free rotation for organic detail
-- For modular builds: use multiples of 4, 8, 16, 32 studs`,
    pitfalls: [
      'Walls thicker than 1 stud look chunky and waste interior space',
      'No roof overhang = instant amateur tell (always 1.5-2 stud overhang)',
      'Forgetting foundation makes buildings float (always add 0.5-1 stud base)',
      'Real-world scale looks wrong in Roblox — scale to character (5 studs tall)',
      'Flat roofs on residential buildings look lazy — use WedgeParts for pitch',
      'Uniform grid alignment everywhere looks robotic — vary rotation on details',
    ],
  },

  {
    name: 'Pro Building — Color & Material Variation (DevForum)',
    keywords: ['color', 'material', 'palette', 'paint', 'variation', 'texture', 'build', 'house', 'building', 'stone', 'brick', 'wood', 'design', 'aesthetic'],
    snippet: `-- COLOR VARIATION TECHNIQUE (from top DevForum showcase builders)
-- THE #1 TECHNIQUE that separates pro from amateur:
-- NEVER use one flat color on large surfaces.

-- HOW TO VARY COLOR:
-- 1. Pick a base color (e.g., RGB 180, 140, 100 for warm brick)
-- 2. For each section of wall/floor, vary by ±10-15 RGB per channel
-- 3. Randomly darken some parts (shader-like depth)
-- 4. Max 3 color variations per material type (performance)

-- EXAMPLE — Stone Wall with Variation:
-- Base: Color3.fromRGB(140, 135, 130) — Concrete
-- Darker: Color3.fromRGB(125, 120, 115) — Concrete
-- Lighter: Color3.fromRGB(155, 150, 145) — Concrete
-- Accent: Color3.fromRGB(110, 105, 100) — Slate

-- PROVEN COLOR PALETTES BY GENRE:
-- Medieval: Brown(139,90,43) + Stone(158,148,136) + Dark Wood(80,50,20)
-- Modern: White(240,240,240) + Gray(180,180,180) + Accent Blue(65,145,220)
-- Fantasy: Purple(130,80,180) + Gold(212,175,55) + Teal(0,180,170)
-- Horror: Dark Gray(50,50,55) + Rust Red(139,0,0) + Sickly Green(80,120,50)
-- Tropical: Sand(237,221,175) + Ocean(0,150,200) + Palm(60,140,60)
-- Cottage: Cream(255,245,225) + Sage(140,170,130) + Wood(160,110,60)

-- ROTATION VARIATION (breaks the grid look):
-- Set rotation snap to 0 (free rotation)
-- Rotate individual detail elements randomly on X,Y,Z
-- Creates worn/aged/organic aesthetic
-- Especially effective on: stones, bricks, planks, shingles, debris`,
    pitfalls: [
      'Using exact same color on every part of a wall (looks flat and artificial)',
      'More than 3 color variations per material (hurts performance, looks noisy)',
      'All SmoothPlastic materials (use Concrete, Wood, Brick, Cobblestone, Slate)',
      'Neon material overuse (looks cheap — reserve for actual lights and accents)',
      'Ignoring color theory — clashing colors kill the aesthetic',
    ],
  },

  {
    name: 'Pro Lighting — Future Technology Setup (DevForum)',
    keywords: ['lighting', 'atmosphere', 'light', 'future', 'shadow', 'glow', 'ambient', 'sun', 'fog', 'bloom', 'post process', 'color correction', 'sky', 'time of day'],
    snippet: `-- PRO LIGHTING SETUP (from DevForum lighting guides)
-- Use Future lighting technology for best quality

-- LIGHTING SERVICE PROPERTIES:
-- Technology = Enum.Technology.Future
-- Brightness = 1.5 (range 1-3, use 2.3 for bright midday)
-- ClockTime = 14 (warm afternoon — range 12-16 for daytime)
-- ShadowSoftness = 0.1 (crisp shadows — 0 = hard, 1 = blurry)
-- ExposureCompensation = 0.5 (0.5-0.8 range)
-- EnvironmentSpecularScale = 1 (full metal/glass reflections)
-- Ambient = Color3.fromRGB(80, 80, 90) (cool-toned gray)
-- OutdoorAmbient = Color3.fromRGB(120, 115, 100) (warm outdoor)

-- POST-PROCESSING (children of Lighting):
-- ColorCorrectionEffect:
--   Saturation = 0.1 (subtle — don't over-saturate)
--   Contrast = 0.1
--   Brightness = 0 (leave at default)
--
-- BloomEffect:
--   Intensity = 0.1 (SUBTLE — never above 0.3)
--   Size = 0.4
--   Threshold = 0.8 (only bright things bloom)
--
-- SunRaysEffect:
--   Intensity = 0.2 (SUBTLE — excessive sun rays = #1 amateur tell)
--   Spread = 0.7
--
-- DepthOfFieldEffect (OPTIONAL, use sparingly):
--   FarIntensity = 0.1 (high values cause nausea)
--   FocusDistance = 50
--   InFocusRadius = 30
--
-- Atmosphere (child of Lighting):
--   Density = 0.3
--   Offset = 0
--   Color = Color3.fromRGB(200, 210, 230) (blue-tinted for outdoor)
--   Decay = Color3.fromRGB(100, 80, 60) (warm sunset decay)
--   Glare = 10
--   Haze = 1.55

-- GENRE-SPECIFIC SETTINGS:
-- Horror: ClockTime=0, Brightness=0.5, FogEnd=200, no Bloom, no SunRays
-- Tropical: ClockTime=14, Brightness=2.5, Atmosphere.Color=cyan-tinted
-- Medieval: ClockTime=16, Brightness=1.5, warm Ambient, heavy Atmosphere
-- Space: ClockTime=0, Brightness=0, only PointLights on structures

-- INTERIOR LIGHTING (NEVER skip):
-- Every enclosed room: PointLight (Brightness=1.5, Range=16)
-- Warm indoor: Color3.fromRGB(255, 220, 180)
-- Cold fluorescent: Color3.fromRGB(200, 220, 255)
-- Fireplace: Fire + PointLight(255,150,50) + Brightness=2, Range=12`,
    pitfalls: [
      'Excessive SunRays intensity (>0.3) — the #1 amateur lighting mistake',
      'Stacking ALL post-processing effects at once (washed out, laggy)',
      'DepthOfField with high FarIntensity (causes motion sickness)',
      'No interior lights (rooms are pitch black with Future lighting)',
      'Bloom > 0.3 makes everything look like a fever dream',
      'Using ShadowMap technology when Future is available (worse quality)',
    ],
  },

  {
    name: 'Furniture & Interior Placement (DevForum)',
    keywords: ['furniture', 'interior', 'room', 'house', 'bed', 'chair', 'table', 'kitchen', 'bathroom', 'living room', 'bedroom', 'decoration', 'decor', 'inside', 'indoor'],
    snippet: `-- FURNITURE PLACEMENT RULES (DevForum pro builders)
-- Character is ~5 studs tall — all furniture scales from this

-- STANDARD FURNITURE DIMENSIONS (in studs):
-- Dining table: 5W x 3D x 3H (top at 3 studs = waist height)
-- Chair: 2W x 2D x 4.5H (seat at 2.5 studs)
-- Desk: 4W x 2D x 3H
-- Bed single: 4W x 7D x 2.5H (frame) + 0.8H mattress
-- Bed double: 6W x 7D x 2.5H (frame) + 0.8H mattress
-- Sofa: 6W x 3D x 3H (cushions 0.5 studs above frame)
-- Bookshelf: 4W x 1.2D x 6H (4 shelves + colored book parts)
-- Kitchen counter: 3H x 2D (continuous along walls)
-- Sink: 2W x 2D, recessed 0.3 into counter
-- Toilet: 1.5W x 2.5D x 3H
-- Bathtub: 3W x 6D x 2.5H

-- ROOM LAYOUT RULES:
-- Leave 3+ stud walkways between furniture
-- Push furniture against walls (not floating in center)
-- Rug under dining set (extends 2 studs past chairs)
-- Nightstands flanking beds
-- Lamps on nightstands and end tables
-- Pictures on walls (0.2 thick, hung at 6-7 studs up)
-- Curtains flanking windows (0.15 thick, floor to ceiling)

-- KITCHEN LAYOUT:
-- L-shape or U-shape counter along 2-3 walls
-- Stove: counter section with 4 cylinder burners on top
-- Fridge: 3W x 2D x 6H box with handle part
-- Sink in counter with faucet (cylinder parts)

-- DETAIL PARTS (what separates good from great):
-- Door handles: 0.15 diameter cylinder, offset from door face
-- Cabinet handles: thin cylinder or rectangular pull
-- Flower pots: cylinder with green sphere-ish plant on top
-- Ceiling fan: 4 blade parts + motor housing + PointLight
-- Clock on wall: thin cylinder with frame ring`,
    pitfalls: [
      'Empty rooms (EVERY room needs furniture appropriate to its function)',
      'Furniture floating in center of room (push against walls)',
      'All furniture same height/size (vary it — small tables, tall shelves)',
      'Forgetting rugs, wall decorations, and small props (feels sterile)',
      'No lights in rooms (every room needs at least 1 PointLight)',
    ],
  },

  {
    name: 'Landscaping & Exterior Detail (DevForum)',
    keywords: ['tree', 'landscape', 'garden', 'path', 'rock', 'bush', 'flower', 'grass', 'outdoor', 'yard', 'park', 'street', 'sidewalk', 'fence', 'nature', 'terrain'],
    snippet: `-- LANDSCAPING RULES (DevForum pro builders)

-- TREE CONSTRUCTION (multi-part, NOT one block):
-- Trunk: Brown cylinder, 1-1.5W x 6-10H studs
-- Canopy: 2-4 green sphere/ellipsoid parts, overlapping
-- Low-poly style: single WedgePart pyramid canopy
-- Branch: thin cylinders angled from trunk
-- Root detail: 2-3 thin parts at base

-- PLACEMENT PATTERNS:
-- Trees: clusters of 3-5, not uniform grid
-- Rocks: groups of 2-3, varying sizes (large + 2 small)
-- Bushes: line along building foundations and paths
-- Flowers: small color pops near entrances and paths

-- PATH CONSTRUCTION:
-- Width: 4-6 studs (2 characters side by side)
-- Material: Cobblestone or Slate
-- Color: slightly darker than surrounding ground
-- Edge stones: 0.3-stud-tall border parts on each side

-- FENCING:
-- Post: 0.4x0.4 square, 4 studs tall, every 4-6 studs
-- Rail: 0.2x0.2, connects post to post at 1.5 and 3 studs height
-- Picket fence: vertical 0.2x3x0.1 planks every 0.6 studs

-- STREET INFRASTRUCTURE:
-- Lamp post: base(1.5x1.5x0.3) + pole(0.3x10x0.3) + arm(2x0.3x0.3) + housing(1x0.8x1) + PointLight
-- Bench: 2 stone ends + 3 wood slats for seat + 2 slats for back = 7 parts
-- Fire hydrant: cylinder base + cylinder body + 2 nozzles = 4 parts
-- Trash can: cylinder + flat cylinder lid = 2 parts
-- Mailbox: box(1.5x1.5x1) on pole(0.3x3x0.3) + flag = 3 parts

-- GROUND DETAIL:
-- Vary ground color (±5-10 RGB from base)
-- Add small debris near buildings (tiny Parts)
-- Puddles: flat cylinders with Glass material + 0.5 transparency
-- Moss on old buildings: green-tinted parts at base of walls`,
    pitfalls: [
      'Trees as single block (always multi-part: trunk + canopy + branches)',
      'Grid-aligned trees (cluster organically in groups of 3-5)',
      'No path edge detail (always add border stones or pavement edges)',
      'Empty yards (add bushes, rocks, flowers near buildings)',
      'Ignoring scale — trees should be 10-20 studs tall minimum',
    ],
  },

  {
    name: 'Horror Entity AI (DevForum)',
    keywords: ['horror', 'entity', 'monster', 'chase', 'jumpscare', 'scare', 'ai', 'pathfinding', 'doors', 'fnaf', 'backrooms', 'creepy', 'haunted'],
    snippet: `-- HORROR ENTITY AI SYSTEM (from DevForum Doors-style breakdowns)

-- ENTITY STATE MACHINE:
local EntityState = {
  Dormant = "Dormant",   -- Hidden, waiting for trigger
  Stalking = "Stalking", -- Following at distance, peeking
  Chasing = "Chasing",   -- Full speed pursuit
  Attacking = "Attacking",-- Kill animation
  Retreating = "Retreating", -- Returns to dormant
}

-- PATHFINDING SETUP:
local PathfindingService = game:GetService("PathfindingService")
local agentParams = {
  AgentRadius = 2,
  AgentHeight = 6,
  AgentCanJump = false,
  AgentCanClimb = false,
  WaypointSpacing = 4,
  -- Use pathfinding modifiers for doors:
  Costs = { DoorOpen = 1, DoorClosed = 5 },
}

-- CHASE MECHANICS:
-- Speed: Walk=8, Stalk=12, Chase=24-28 (faster than player sprint of 16)
-- Detection: Raycast from entity eyes to player head
-- Line of sight check: if blocked by wall, lose aggro after 3 seconds
-- Sound cues: heartbeat gets louder as entity approaches
-- Footstep sounds with increasing tempo during chase

-- JUMPSCARE TRIGGER:
-- When entity reaches player (distance < 4 studs):
-- 1. Anchor player's HumanoidRootPart
-- 2. Fire RemoteEvent to show fullscreen jumpscare GUI
-- 3. Camera CFrame to entity face
-- 4. Play scream sound (not too loud — 0.5 volume)
-- 5. Wait 1.5 seconds
-- 6. Kill player via Humanoid:TakeDamage(math.huge)

-- HIDING MECHANIC (Doors-style):
-- Closet/locker with ProximityPrompt "Hide"
-- Player teleported inside, camera switched to peek-through-crack view
-- Entity checks hiding spots: 30% chance to check each one
-- If found: jumpscare from inside. If not: entity passes.

-- DOOR INTERACTION:
-- Entity approaches locked door → plays bang animation
-- After 3 bangs (2s each), door breaks open
-- Player can barricade doors (adds 2 extra bangs required)
-- PathfindingModifier on door Parts to make entity prefer open routes

-- SPAWN LOGIC:
-- Never spawn entity in player's line of sight
-- Spawn at furthest valid point from all players
-- Minimum 60 stud distance from nearest player
-- Audio cue 5-8 seconds before entity appears (warning)`,
    pitfalls: [
      'Entity spawning in view (breaks immersion — always spawn out of sight)',
      'Jumpscare volume too loud (0.5 max, players have headphones)',
      'Entity faster than humanly reactable (cap at 28 speed, player sprint is 16)',
      'No audio cues before chase (players need 3-5 second warning)',
      'Client-side entity logic (exploiters disable the entity)',
      'Constant chasing with no downtime (tension needs release cycles)',
    ],
  },

  {
    name: 'Racing Vehicle Physics (DevForum)',
    keywords: ['racing', 'race', 'vehicle', 'car', 'kart', 'drift', 'speed', 'track', 'lap', 'vehicleseat', 'drive'],
    snippet: `-- RACING VEHICLE SYSTEM (DevForum best practices)

-- VEHICLE SETUP (VehicleSeat-based):
-- VehicleSeat is the ONLY seat type that provides Steer/Throttle inputs
-- Properties: MaxSpeed=80, Torque=50000, TurnSpeed=2
-- For kart racing: MaxSpeed=60, TurnSpeed=3 (tighter turns)
-- For street racing: MaxSpeed=120, TurnSpeed=1.5

-- CHASSIS CONSTRUCTION:
-- Body: Main Part (8x2x14 studs for standard car)
-- VehicleSeat: centered, slightly below body top
-- Wheels: 4 Cylinder parts, connected via HingeConstraints
-- Wheel size: 1.5 radius for kart, 2 radius for car
-- Suspension: SpringConstraints between body and wheel axles

-- DRIFT MECHANIC:
-- Detect: VehicleSeat.Steer ~= 0 AND speed > 40
-- Apply: Reduce wheel friction via CustomPhysicalProperties
-- Normal friction: 0.7  |  Drift friction: 0.2
-- Visual: tire smoke particles when drifting
-- Boost: accumulate drift time → release for speed burst

-- LAP TRACKING (server-side):
-- Checkpoint Parts (CanCollide=false, Transparency=1)
-- Player must hit checkpoints IN ORDER (prevents shortcutting)
-- Lap complete only when ALL checkpoints touched + crossing finish line
-- Store best lap time in OrderedDataStore

-- CHECKPOINT SYSTEM:
local checkpoints = {} -- folder of Parts named "CP_1", "CP_2", etc.
local playerProgress = {} -- [userId] = { currentCP = 1, lapCount = 0, startTime = 0 }

-- On checkpoint touch:
-- if checkpoint.Name == "CP_" .. (playerProgress[userId].currentCP) then
--   playerProgress[userId].currentCP += 1
--   if currentCP > totalCheckpoints then
--     playerProgress[userId].currentCP = 1
--     playerProgress[userId].lapCount += 1
--   end
-- end

-- NITRO/BOOST:
-- BodyVelocity applied in look direction for 2 seconds
-- MaxForce = Vector3.new(50000, 0, 50000)
-- Velocity = rootPart.CFrame.LookVector * boostSpeed
-- Cooldown: 10 seconds between uses
-- Pickup pads on track restore boost charge`,
    pitfalls: [
      'Using Seat instead of VehicleSeat (no steering/throttle input)',
      'Client-side speed (exploiters go 9999 speed — validate on server)',
      'No anti-shortcut (checkpoint system prevents cutting track)',
      'Wheels without SpringConstraints (car bounces uncontrollably)',
      'MaxSpeed too high (>150 causes physics instability in Roblox)',
    ],
  },

  {
    name: 'Round-Based Game Loop (DevForum)',
    keywords: ['round', 'lobby', 'match', 'countdown', 'intermission', 'game loop', 'round based', 'matchmaking', 'waiting', 'arena'],
    snippet: `-- ROUND-BASED GAME LOOP (DevForum pattern)

-- STATE MACHINE:
-- Waiting → Countdown → Playing → Results → Waiting
local GameState = { Waiting = 1, Countdown = 2, Playing = 3, Results = 4 }
local currentState = GameState.Waiting

-- CONFIGURATION:
local MIN_PLAYERS = 2
local COUNTDOWN_TIME = 10 -- seconds
local ROUND_DURATION = 120 -- seconds
local RESULTS_TIME = 8 -- seconds
local INTERMISSION_TIME = 15 -- seconds

-- MAIN LOOP (runs forever on server):
while true do
  -- WAITING: Need minimum players
  currentState = GameState.Waiting
  repeat
    updateStatus("Waiting for players... (" .. #activePlayers .. "/" .. MIN_PLAYERS .. ")")
    task.wait(1)
  until #getAlivePlayers() >= MIN_PLAYERS

  -- COUNTDOWN: Players confirmed, start countdown
  currentState = GameState.Countdown
  for i = COUNTDOWN_TIME, 1, -1 do
    updateStatus("Starting in " .. i .. "...")
    task.wait(1)
    if #getAlivePlayers() < MIN_PLAYERS then break end -- Abort if players leave
  end
  if #getAlivePlayers() < MIN_PLAYERS then continue end -- Restart loop

  -- PLAYING: Teleport to arena, start round
  currentState = GameState.Playing
  local arenaSpawns = workspace.Arena.Spawns:GetChildren()
  for i, player in getAlivePlayers() do
    local spawn = arenaSpawns[((i - 1) % #arenaSpawns) + 1]
    teleportPlayer(player, spawn.CFrame + Vector3.new(0, 3, 0))
    giveWeapons(player)
  end

  -- Round timer
  local roundStart = os.clock()
  repeat
    local elapsed = os.clock() - roundStart
    local remaining = math.max(0, ROUND_DURATION - elapsed)
    updateStatus("Round: " .. math.ceil(remaining) .. "s left | Alive: " .. #getAlivePlayers())
    task.wait(0.5)
  until #getAlivePlayers() <= 1 or (os.clock() - roundStart) >= ROUND_DURATION

  -- RESULTS: Show winner, award prizes
  currentState = GameState.Results
  local winner = getAlivePlayers()[1]
  if winner then
    awardPrize(winner, 100) -- coins
    updateStatus(winner.Name .. " wins! +100 coins")
  else
    updateStatus("Draw! No winner.")
  end
  task.wait(RESULTS_TIME)

  -- Cleanup: teleport all back to lobby, remove weapons
  teleportAllToLobby()
  task.wait(INTERMISSION_TIME)
end`,
    pitfalls: [
      'No minimum player check (round starts with 1 player)',
      'Client-side round timer (exploiter extends their round time)',
      'Not handling player disconnect mid-round (nil checks everywhere)',
      'Teleporting without adding 3 studs Y offset (player falls through floor)',
      'No abort on player leave during countdown (round starts with 1 player)',
    ],
  },

  {
    name: 'Trading System — Secure (DevForum)',
    keywords: ['trade', 'trading', 'exchange', 'swap', 'give', 'offer', 'accept', 'trade system'],
    snippet: `-- SECURE TRADING SYSTEM (DevForum anti-dupe patterns)

-- CRITICAL: All trades validated SERVER-SIDE
-- Client only shows UI and sends trade requests

-- TRADE SESSION (server-side):
local activeTrades = {} -- [tradeId] = { player1, player2, offers1, offers2, confirmed1, confirmed2 }

-- ANTI-DUPLICATION RULES:
-- 1. Lock items when placed in trade window (can't be used/traded elsewhere)
-- 2. Verify item ownership AGAIN at confirmation time (not just at offer time)
-- 3. Use a trade lock: player can only be in 1 trade at a time
-- 4. Double-confirm: both players must confirm, then 3-second countdown, then re-verify

-- TRADE FLOW:
-- 1. Player A sends trade request to Player B (ProximityPrompt or GUI)
-- 2. Player B accepts → trade window opens for both
-- 3. Both drag items into offer slots (server validates ownership)
-- 4. Both click "Ready" → items lock
-- 5. Both click "Confirm" → 3s countdown (can cancel during)
-- 6. Server RE-VERIFIES both players still own offered items
-- 7. Atomic swap: remove items from both, give items to both
-- 8. If any step fails → return all items, cancel trade

-- ITEM LOCKING:
local lockedItems = {} -- [itemId] = tradeId
local function lockItem(itemId: string, tradeId: string): boolean
  if lockedItems[itemId] then return false end -- Already in another trade
  lockedItems[itemId] = tradeId
  return true
end

-- ATOMIC SWAP (the critical section):
local function executeTrade(trade)
  -- RE-VERIFY ownership of all items
  for _, item in trade.offers1 do
    if not playerOwnsItem(trade.player1, item) then return false, "Items changed" end
  end
  for _, item in trade.offers2 do
    if not playerOwnsItem(trade.player2, item) then return false, "Items changed" end
  end

  -- ATOMIC: remove then add (if add fails, restore)
  removeItems(trade.player1, trade.offers1)
  removeItems(trade.player2, trade.offers2)
  addItems(trade.player1, trade.offers2)
  addItems(trade.player2, trade.offers1)

  -- Unlock all items
  for _, item in trade.offers1 do lockedItems[item.id] = nil end
  for _, item in trade.offers2 do lockedItems[item.id] = nil end

  return true, "Trade complete"
end`,
    pitfalls: [
      'Client-side item validation (exploiter duplicates items)',
      'Not re-verifying ownership at confirmation time (item could be sold/traded meanwhile)',
      'No item locking (same item offered in 2 simultaneous trades → duplication)',
      'Non-atomic swap (if game crashes mid-trade, items vanish — need rollback)',
      'No trade cooldown (spamming trade requests to grief other players)',
    ],
  },

  {
    name: 'CollectionService Tag Patterns (DevForum)',
    keywords: ['collectionservice', 'tag', 'collection', 'behavior', 'component', 'system', 'pattern', 'instance'],
    snippet: `-- COLLECTIONSERVICE PATTERNS (DevForum best practice)
-- Use tags instead of per-instance scripts for performance
-- One script handles ALL instances with a tag

local CollectionService = game:GetService("CollectionService")

-- PATTERN: Tag-based behavior system
-- Instead of putting a script inside every coin:
-- Tag all coins "Collectible", handle them from ONE script

local function onCollectibleAdded(instance: BasePart)
  if not instance:IsA("BasePart") then return end

  -- Setup behavior for this tagged instance
  local connection = instance.Touched:Connect(function(hit)
    local humanoid = hit.Parent:FindFirstChild("Humanoid")
    if not humanoid then return end
    local player = game.Players:GetPlayerFromCharacter(hit.Parent)
    if not player then return end

    -- Award and cleanup
    awardCoins(player, instance:GetAttribute("Value") or 1)
    instance:Destroy()
  end)

  -- Cleanup when tag removed or instance destroyed
  instance.Destroying:Connect(function()
    connection:Disconnect()
  end)
end

-- Connect to ALL current and future tagged instances
for _, instance in CollectionService:GetTagged("Collectible") do
  onCollectibleAdded(instance)
end
CollectionService:GetInstanceAddedSignal("Collectible"):Connect(onCollectibleAdded)

-- COMMON TAG PATTERNS:
-- "KillBrick" — one script handles ALL kill bricks
-- "SpinningPart" — one script rotates ALL tagged parts
-- "Interactable" — ProximityPrompt setup for all tagged parts
-- "DamageZone" — periodic damage to all players inside
-- "Checkpoint" — save progress on touch

-- ATTRIBUTES ON TAGGED INSTANCES:
-- Use instance:SetAttribute("Speed", 5) for per-instance config
-- Read with instance:GetAttribute("Speed") or 5 (default)
-- Avoids needing Value objects inside each part`,
    pitfalls: [
      'Script inside every instance (CollectionService is 10-100x more efficient)',
      'Not handling GetInstanceAddedSignal (misses instances added after script runs)',
      'Not cleaning up connections on instance destroy (memory leak)',
      'Using Value objects when Attributes work (Attributes are faster and cleaner)',
    ],
  },

  {
    name: 'GamePass vs DevProduct — Monetization (DevForum)',
    keywords: ['gamepass', 'devproduct', 'monetization', 'purchase', 'robux', 'revenue', 'money', 'shop', 'premium', 'vip'],
    snippet: `-- GAMEPASS vs DEVPRODUCT (when to use which)

-- GAMEPASS: One-time permanent purchase (buy once, own forever)
-- Use for: VIP access, 2x multipliers, exclusive areas, cosmetics
-- Pricing: 100-5000 Robux (higher = more commitment)
--
-- DEVPRODUCT: Repeatable purchase (can buy multiple times)
-- Use for: Currency packs, extra lives, skip stage, speed boosts
-- Pricing: 25-500 Robux (lower barrier, impulse buys)

local MarketplaceService = game:GetService("MarketplaceService")

-- CHECK GAMEPASS OWNERSHIP:
local function hasGamepass(player: Player, gamepassId: number): boolean
  local success, owns = pcall(function()
    return MarketplaceService:UserOwnsGamePassAsync(player.UserId, gamepassId)
  end)
  return success and owns
end

-- PROCESS DEV PRODUCT PURCHASE:
MarketplaceService.ProcessReceipt = function(receiptInfo)
  local player = game.Players:GetPlayerFromCharacter(
    game.Players:GetNameFromUserIdAsync(receiptInfo.PlayerId)
  ) or game.Players:GetPlayerByUserId(receiptInfo.PlayerId)

  if not player then return Enum.ProductPurchaseDecision.NotProcessedYet end

  local productId = receiptInfo.ProductId

  if productId == COIN_PACK_ID then
    addCoins(player, 1000)
  elseif productId == SKIP_STAGE_ID then
    skipStage(player)
  end

  -- CRITICAL: Return PurchaseGranted ONLY after granting the item
  return Enum.ProductPurchaseDecision.PurchaseGranted
end

-- OPTIMAL PRICE TIERS (from DevForum revenue data):
-- Entry tier: 100-300 Robux (small boosts, cosmetics, starter packs)
-- Mid tier: 400-1000 Robux (VIP, 2x multiplier, QoL features)
-- Premium tier: 1500-3000 Robux (exclusive items, major advantages)
-- Whale tier: 5000+ Robux (ultimate bundles, max everything)

-- REVENUE MATH:
-- Roblox takes ~30% platform fee
-- DevEx rate: 350 Robux = $1 USD
-- Effective: ~24-27% of player purchase price reaches developer
-- 1000 Robux gamepass ≈ $2 real money to developer
-- Premium Payouts = 20-40% of total revenue for games with 15+ min sessions

-- PROMPT FIRST PURCHASE:
-- After tutorial, show limited-time "Starter Pack" (discounted)
-- Show gamepass benefits in death screen ("2x coins would have given you 200!")
-- Never block progress — just slow it for free players`,
    pitfalls: [
      'Not using pcall on MarketplaceService calls (they can fail)',
      'Returning PurchaseGranted before actually giving the item (player loses purchase)',
      'GamePass for consumables (use DevProduct — GamePass is permanent)',
      'No receipt validation (ProcessReceipt must handle edge cases)',
      'Pay-to-win that blocks free players entirely (kills retention)',
      'Price too high for first purchase (keep entry tier under 300 Robux)',
    ],
  },

  {
    name: 'Player Retention — First 30 Seconds (DevForum)',
    keywords: ['retention', 'onboarding', 'tutorial', 'new player', 'first time', 'ftue', 'engage', 'session', 'hook'],
    snippet: `-- PLAYER RETENTION (from DevForum + official Roblox design docs)
-- 50% of players leave in first 30 seconds if confused
-- Target: 3-4 minute minimum session time (triggers algorithm pickup)

-- FIRST 30 SECONDS CHECKLIST:
-- 1. Camera shows something exciting immediately (not a blank lobby)
-- 2. Clear visual cue: bouncing arrow, particle trail, glowing object
-- 3. First action succeeds GUARANTEED (impossible to fail)
-- 4. Reward within 10 seconds (coins, XP, item)
-- 5. Show progression: XP bar filling, level counter, collection percentage

-- ONBOARDING TECHNIQUES:
-- Visual cues: bouncing arrows over interactables, particle trails
-- Contextual hints: show instruction only when player reaches a feature
-- Timed hints: if most players complete task in 10s, show hint at 11s
-- Hide non-essential UI during tutorial (less overwhelming)
-- Lead player through buy→use→sell cycle explicitly

-- WHAT KILLS RETENTION:
-- Camera starting outside playable world
-- No clear UI indicator showing where to go
-- Tutorial dumping all info at once (contextual > frontloaded)
-- Punishing early (first death should feel like learning, not failure)
-- Dark/unsaturated visuals (pump up saturation and brightness)
-- Forcing players to read text walls
-- No visible goals or progression

-- REWARD SCHEDULING (keep them coming back):
-- 0-30s: first reward (immediate gratification)
-- 1-3m: first unlock (new area, new ability)
-- 5m: daily reward system shown
-- 10m: social features introduced (trading, guilds)
-- 15m: premium features teased (not pushed)

-- D1 RETENTION TARGETS:
-- 2% = failing badly (game has fundamental issues)
-- 10% = average for new games
-- 20%+ = good (game is working)
-- 40%+ = excellent (potential featured game)

-- SESSION TIME:
-- Under 2 minutes average = something is broken
-- 3-4 minutes = baseline acceptable
-- 10+ minutes = healthy game
-- 30+ minutes = engaged community`,
    pitfalls: [
      'Forcing long tutorials before fun (get to gameplay in under 20 seconds)',
      'Text-only instructions (use visual arrows, highlights, effects)',
      'Punishing new players (first attempt should be impossible to fail)',
      'No early rewards (players need dopamine hit within 10 seconds)',
      'Same reward amount every time (escalate rewards to build excitement)',
      'Dark depressing visuals for a kids game (bright colors retain better)',
    ],
  },

  {
    name: 'Parallel Luau — Actors (DevForum)',
    keywords: ['parallel', 'actor', 'multithread', 'performance', 'heavy', 'computation', 'npc ai', 'terrain gen', 'optimize'],
    snippet: `-- PARALLEL LUAU WITH ACTORS (DevForum 2024-2025 patterns)
-- Use for heavy computation: NPC AI, terrain gen, pathfinding, physics

-- SETUP: Actor model wraps a script for parallel execution
-- Each Actor runs on its own thread (true parallelism)

-- Structure:
-- ServerScriptService/
--   NPCManager (Script — orchestrator)
--   NPCActor (Actor)
--     NPCBrain (Script inside Actor — runs in parallel)

-- ORCHESTRATOR (regular serial script):
local actors = {}
for _, npc in workspace.NPCs:GetChildren() do
  local actor = ServerStorage.NPCActor:Clone()
  actor.Parent = npc
  actor:SetAttribute("TargetNPC", npc.Name)
  actors[npc.Name] = actor
end

-- Send work to actors via BindableEvent inside each Actor:
for _, actor in actors do
  actor.ProcessAI:Fire() -- Each actor processes in parallel
end

-- ACTOR SCRIPT (runs in parallel):
local actor = script:GetActor()
local npc = actor.Parent

actor.ProcessAI.Event:ConnectParallel(function()
  -- This runs on a SEPARATE THREAD
  -- CAN: math, table operations, read Instance properties
  -- CANNOT: create/destroy instances, modify properties, fire RemoteEvents

  local target = findNearestPlayer(npc) -- Pure computation
  local path = computePath(npc.Position, target.Position)

  -- Switch back to serial for Instance modification:
  task.synchronize()
  npc.Humanoid:MoveTo(path[1])
  task.desynchronize() -- Back to parallel
end)

-- WHEN TO USE PARALLEL:
-- 50+ NPCs with pathfinding → Actor per NPC
-- Procedural terrain generation → chunk processing
-- Raycast-heavy systems → batch raycasts in parallel
-- Physics simulation → per-body computation

-- WHEN NOT TO USE:
-- Simple scripts (overhead > benefit for < 20 entities)
-- Anything that mostly modifies Instances (can't in parallel)
-- UI updates (must be serial/client-side)`,
    pitfalls: [
      'Modifying instances in parallel (crashes — must task.synchronize() first)',
      'Using Parallel for simple scripts (overhead is only worth it for 20+ entities)',
      'Not calling task.desynchronize() after synchronize (stays serial forever)',
      'Shared state between actors without proper synchronization (race conditions)',
    ],
  },

  {
    name: 'Leaderboard — OrderedDataStore (DevForum)',
    keywords: ['leaderboard', 'top', 'ranking', 'ordered', 'global leaderboard', 'high score', 'best time'],
    snippet: `-- GLOBAL LEADERBOARD WITH ORDEREDDATASTORE (production pattern)

local DataStoreService = game:GetService("DataStoreService")
local leaderboardStore = DataStoreService:GetOrderedDataStore("GlobalLeaderboard_v1")

-- SAVE SCORE (call when player earns points):
local function saveScore(userId: number, score: number)
  pcall(function()
    leaderboardStore:UpdateAsync(tostring(userId), function(old)
      -- Only update if new score is higher
      return math.max(old or 0, score)
    end)
  end)
end

-- FETCH TOP PLAYERS:
local function getTopPlayers(count: number): {{userId: number, score: number}}
  local success, pages = pcall(function()
    return leaderboardStore:GetSortedAsync(false, count) -- false = descending
  end)
  if not success then return {} end

  local results = {}
  local page = pages:GetCurrentPage()
  for _, entry in page do
    table.insert(results, {
      userId = tonumber(entry.key),
      score = entry.value,
    })
  end
  return results
end

-- UPDATE LEADERBOARD GUI (every 60 seconds):
local REFRESH_INTERVAL = 60
while true do
  local top10 = getTopPlayers(10)
  for i, entry in top10 do
    -- Get username (cache this!)
    local success, name = pcall(function()
      return game.Players:GetNameFromUserIdAsync(entry.userId)
    end)
    if success then
      updateLeaderboardGui(i, name, entry.score)
    end
  end
  task.wait(REFRESH_INTERVAL)
end

-- IMPORTANT: OrderedDataStore only stores integers
-- For times: store as milliseconds (3.456s → 3456)
-- For floats: multiply by 1000, store as int`,
    pitfalls: [
      'Using regular DataStore for leaderboards (OrderedDataStore has GetSortedAsync)',
      'Not caching usernames (GetNameFromUserIdAsync is rate-limited)',
      'Refreshing too often (60s minimum — DataStore has request limits)',
      'Storing floats in OrderedDataStore (integers only — multiply by 1000)',
      'Not versioning the DataStore key (add _v1 so you can reset if needed)',
    ],
  },

  {
    name: 'Mobile Optimization & StreamingEnabled (DevForum)',
    keywords: ['mobile', 'optimize', 'performance', 'streaming', 'lag', 'fps', 'low end', 'phone', 'touch', 'tablet'],
    snippet: `-- MOBILE OPTIMIZATION (DevForum + official Roblox docs)
-- Part count: 15-20K safe for low-end mobile, 500K triangle budget
-- Memory: keep under 1.3GB client (2GB phones exist)
-- Each ParticleEmitter = 1 draw call regardless of particle count
-- Per-zone: 40K triangles, 40 draw calls max

-- STREAMING ENABLED (critical for large maps):
-- Workspace.StreamingEnabled = true
-- StreamingMinRadius = 64-128 (parts never removed even under pressure)
-- StreamingTargetRadius = 128-192 for mobile (default 256)
-- Lower values = less memory usage

-- KEY TECHNIQUES:
-- 1. Mesh Instancing: reuse same MeshId + material = engine batches
-- 2. Distance Culling via CollectionService tags (remove beyond 300 studs)
-- 3. Object Pooling: pre-create, hide at Y=-1000, reuse (never Destroy)
-- 4. Client-side VFX: coins/effects via RemoteEvent (zero replication)
-- 5. CollisionFidelity: Box for small, Hull for medium, Precise only large

-- UI SAFE AREAS:
-- ScreenGui.ScreenInsets = Enum.ScreenInsets.CoreUISafeInsets (default)
-- Excludes notch + Roblox top bar for interactive elements
-- Use None for full-screen backgrounds only`,
    pitfalls: [
      'Transparent parts still consume full performance (transparency does NOT help)',
      'CollisionFidelity Precise on small objects = memory hog (use Box)',
      'Never preload entire Workspace with ContentProvider:PreloadAsync()',
      'SurfaceGuis/BillboardGuis eat draw calls fast',
      'Future lighting multiplies draw call costs vs ShadowMap on mobile',
    ],
  },

  {
    name: 'CFrame Math Patterns (DevForum)',
    keywords: ['cframe', 'rotation', 'position', 'lookat', 'circular', 'spiral', 'angle', 'transform', 'orientation'],
    snippet: `-- CFRAME MATH PATTERNS (DevForum comprehensive guides)

-- CONSTRUCTORS:
-- CFrame.new(x, y, z) — position only, default orientation
-- CFrame.lookAt(position, target) — position + face target (PREFERRED)
-- CFrame.Angles(rx, ry, rz) — rotation in RADIANS (use math.rad())
-- CFrame.fromAxisAngle(axis, angle) — rotation around specific axis

-- CRITICAL: CFrame.new(pos, lookAt) is DEPRECATED → use CFrame.lookAt()
-- CRITICAL: CFrame.Angles() uses RADIANS not degrees

-- KEY OPERATIONS:
-- cf + Vector3 — shift position without changing orientation
-- parent * child — combine CFrames (ORDER MATTERS: parent first)
-- cf:Lerp(cf2, alpha) — interpolate (0-1)
-- cf:Inverse() — invert transformation
-- cf:PointToWorldSpace(v) — local → world
-- cf:PointToObjectSpace(v) — world → local

-- CIRCULAR PLACEMENT (most common pattern):
local center, radius, count = Vector3.new(0,0,0), 20, 12
for i = 0, count - 1 do
  local angle = (i / count) * math.pi * 2
  local x = center.X + radius * math.cos(angle)
  local z = center.Z + radius * math.sin(angle)
  part.CFrame = CFrame.lookAt(Vector3.new(x, center.Y, z), center)
end

-- SPIRAL: increment radius and Y per step
-- ARC: use angle range (0 to math.pi) instead of full 2*pi`,
    pitfalls: [
      'CFrame.Angles uses RADIANS — math.rad(90) for 90 degrees, not just 90',
      'CFrame multiply order: parent * child (NOT child * parent)',
      'CFrame.new(pos, lookAt) is DEPRECATED — use CFrame.lookAt(pos, target)',
      '180-degree rotation edge case (dot product near -1) needs special handling',
    ],
  },

  {
    name: 'Performance Optimization Checklist (DevForum)',
    keywords: ['performance', 'optimize', 'lag', 'slow', 'fps', 'memory', 'microprofiler', 'heartbeat', 'pool'],
    snippet: `-- PERFORMANCE OPTIMIZATION (DevForum + official docs)

-- FRAME BUDGET: 16.67ms per frame for 60 FPS
-- Debug: Ctrl+F2 (scene stats), Ctrl+F6 (MicroProfiler), Shift+F2 (draw calls)

-- PRIORITY ORDER:
-- 1. Enable StreamingEnabled for large worlds
-- 2. Reduce draw calls via mesh instancing (same MeshId+material = 1 draw)
-- 3. Anchor static parts, simplify CollisionFidelity
-- 4. Throttle RunService callbacks, split expensive work across frames
-- 5. Clean up connections (.Disconnect on remove)
-- 6. NPC animations client-side only (distance culled)
-- 7. Reduce shadows and light complexity
-- 8. Minimize RemoteEvent firing (never every frame)

-- OBJECT POOLING:
local pool = {}
for i = 1, 100 do
  local p = template:Clone()
  p.CFrame = CFrame.new(0, -1000, 0) -- hide below world
  p.Anchored = true; p.Parent = workspace
  table.insert(pool, p)
end
function getFromPool() return table.remove(pool) or template:Clone() end
function returnToPool(p) p.CFrame = CFrame.new(0,-1000,0); table.insert(pool, p) end

-- SERVER: 30 Hz tick. 10 NPCs pathfinding = 20% degradation.
-- Sleep AI when no player within range. Pathfind every 0.5-1.5s NOT every frame.
-- Network: 30 TPS, ~50kbps/player. Send only state changes.

-- HUMANOID: disable unused states, use AnimationController for static NPCs
-- TEXTURES: memory = pixel count not disk size. 512x512 max.`,
    pitfalls: [
      'Destroying pooled objects instead of repositioning (defeats the purpose)',
      'Firing RemoteEvents every frame (network budget is 30 TPS)',
      'Pathfinding every frame for NPCs (0.5-1.5s interval is sufficient)',
      'Using Humanoid for NPCs that dont need to walk (AnimationController is lighter)',
      'CollisionFidelity Precise on decorative objects (use Box or disable collision)',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MASSIVE EXPANSION — 120+ NEW ENTRIES
  // Services, Building Patterns, Game Mechanics, UI, Security, Advanced
  // ═══════════════════════════════════════════════════════════════════════════

  // ── SERVICES ──────────────────────────────────────────────────────────────

  {
    name: 'Workspace Advanced (Raycast, Bounds, Gravity)',
    keywords: ['workspace', 'raycast', 'getpartboundsinbox', 'gravity', 'currentcamera', 'bounds', 'overlap', 'region', 'spatial query'],
    snippet: `-- WORKSPACE ADVANCED (spatial queries, gravity, camera)
local workspace = game:GetService("Workspace")

-- Spatial queries: find parts in a box region
local overlapParams = OverlapParams.new()
overlapParams.FilterType = Enum.RaycastFilterType.Exclude
overlapParams.FilterDescendantsInstances = {player.Character}

-- Get all parts in a box
local partsInBox = workspace:GetPartBoundsInBox(
  CFrame.new(0, 5, 0),     -- center CFrame
  Vector3.new(20, 10, 20),  -- size
  overlapParams
)
for _, part in partsInBox do
  print("Found:", part.Name)
end

-- Get parts in a sphere
local partsInRadius = workspace:GetPartBoundsInRadius(
  Vector3.new(0, 5, 0), -- center
  15,                     -- radius
  overlapParams
)

-- Gravity manipulation
workspace.Gravity = 196.2   -- Default (Earth-like)
workspace.Gravity = 50       -- Moon-like (floaty jumps)
workspace.Gravity = 0        -- Zero-G (space)

-- Current camera access
local camera = workspace.CurrentCamera
camera.FieldOfView = 70       -- Default FOV
camera.CFrame = CFrame.lookAt(Vector3.new(0, 50, 50), Vector3.zero)`,
    pitfalls: [
      'GetPartBoundsInBox/InRadius return BasePart[] — check IsA before casting',
      'OverlapParams replaces deprecated FindPartsInRegion3 — never use Region3 methods',
      'Setting Gravity to 0 makes characters unable to land — they float forever',
      'workspace.CurrentCamera is nil on server — camera is client-only',
    ],
  },

  {
    name: 'Players Service (GetPlayers, Events, LocalPlayer)',
    keywords: ['players', 'getplayers', 'playeradded', 'playerremoving', 'localplayer', 'userid', 'character', 'player list'],
    snippet: `-- PLAYERS SERVICE (core player management)
local Players = game:GetService("Players")

-- Iterate all current players
for _, player in Players:GetPlayers() do
  print(player.Name, player.UserId)
end

-- CRITICAL: Handle both existing AND future players
-- PlayerAdded does NOT fire for players already in game when script starts
local function onPlayerAdded(player: Player)
  print(player.Name .. " joined")
  -- Create leaderstats
  local ls = Instance.new("Folder")
  ls.Name = "leaderstats"
  ls.Parent = player
  local coins = Instance.new("IntValue")
  coins.Name = "Coins"
  coins.Value = 0
  coins.Parent = ls
end

-- Connect for future players
Players.PlayerAdded:Connect(onPlayerAdded)
-- Handle players already in game (if script loads late)
for _, player in Players:GetPlayers() do
  task.spawn(onPlayerAdded, player)
end

-- Cleanup on leave
Players.PlayerRemoving:Connect(function(player)
  print(player.Name .. " left")
  -- Save data, cleanup tables
end)

-- CLIENT: LocalPlayer (available only in LocalScripts)
local localPlayer = Players.LocalPlayer
local character = localPlayer.Character or localPlayer.CharacterAdded:Wait()`,
    pitfalls: [
      'Not handling players already in game — PlayerAdded misses early joiners',
      'Players.LocalPlayer is NIL on server — only available in LocalScripts',
      'CharacterAdded can fire multiple times (respawns) — handle each',
      'GetPlayers returns snapshot — do NOT modify table during iteration',
    ],
  },

  {
    name: 'Teams Service',
    keywords: ['team', 'teams', 'teamcolor', 'autoassignable', 'team based', 'red team', 'blue team', 'team balancing'],
    snippet: `-- TEAMS SERVICE (team assignment and balancing)
local Teams = game:GetService("Teams")
local Players = game:GetService("Players")

-- Create teams
local redTeam = Instance.new("Team")
redTeam.Name = "Red"
redTeam.TeamColor = BrickColor.new("Bright red")
redTeam.AutoAssignable = true -- Auto-assign new players
redTeam.Parent = Teams

local blueTeam = Instance.new("Team")
blueTeam.Name = "Blue"
blueTeam.TeamColor = BrickColor.new("Bright blue")
blueTeam.AutoAssignable = true
blueTeam.Parent = Teams

-- Manual team assignment (server-side)
local function assignToSmallestTeam(player: Player)
  local redCount = #redTeam:GetPlayers()
  local blueCount = #blueTeam:GetPlayers()
  player.Team = redCount <= blueCount and redTeam or blueTeam
end

-- Get team members
local redPlayers = redTeam:GetPlayers()

-- Check if players are on same team
local function sameTeam(p1: Player, p2: Player): boolean
  return p1.Team == p2.Team
end

-- Team change detection
Players.PlayerAdded:Connect(function(player)
  player:GetPropertyChangedSignal("Team"):Connect(function()
    print(player.Name .. " switched to " .. (player.Team and player.Team.Name or "none"))
  end)
end)`,
    pitfalls: [
      'AutoAssignable = true on all teams causes random assignment (set false for manual)',
      'Team is set via Player.Team property — not a method call',
      'TeamColor must match a BrickColor — not Color3',
      'GetPlayers() on Team returns current snapshot — may be stale next frame',
    ],
  },

  {
    name: 'SoundService Advanced',
    keywords: ['soundservice', 'setlistener', 'distancefactor', 'rolloffscale', '3d audio', 'positional audio', 'sound group'],
    snippet: `-- SOUNDSERVICE ADVANCED (listener, 3D audio tuning)
local SoundService = game:GetService("SoundService")

-- Set audio listener (where sounds are "heard" from)
-- Default: Camera. Change for spectate mode or cutscenes.
SoundService:SetListener(Enum.ListenerType.Camera)
-- Or set to specific part:
-- SoundService:SetListener(Enum.ListenerType.ObjectPosition, part)
-- Or CFrame:
-- SoundService:SetListener(Enum.ListenerType.CFrame, camera.CFrame)

-- Global 3D audio tuning
SoundService.DistanceFactor = 1     -- Scale factor for distances (1 = realistic)
SoundService.RolloffScale = 1        -- How quickly sounds fade with distance
SoundService.DopplerScale = 0        -- 0 = disable Doppler (recommended for most games)
SoundService.RespectFilteringEnabled = true -- Sounds obey client/server boundary

-- Sound equalizer (applies to all audio)
local eq = Instance.new("EqualizerSoundEffect")
eq.LowGain = 0
eq.MidGain = 0
eq.HighGain = -5  -- Reduce highs slightly for warmth
eq.Parent = SoundService

-- Reverb for indoor environments
local reverb = Instance.new("ReverbSoundEffect")
reverb.DecayTime = 1.5
reverb.Density = 1
reverb.Diffusion = 1
reverb.DryLevel = 0
reverb.WetLevel = -6
reverb.Parent = SoundService -- Or parent to specific SoundGroup`,
    pitfalls: [
      'DopplerScale > 0 causes pitch shifting on fast objects — disable for most games',
      'SetListener must be called from LocalScript — it is client-side',
      'RolloffScale affects ALL 3D sounds — tune per-sound via RollOffMaxDistance instead',
      'Sound effects (Equalizer, Reverb) on SoundService affect ALL audio globally',
    ],
  },

  {
    name: 'TweenService Complete (All EasingStyles)',
    keywords: ['tweenservice', 'tweeninfo', 'easingstyle', 'linear', 'quad', 'cubic', 'bounce', 'elastic', 'back', 'sine', 'exponential'],
    snippet: `-- TWEENSERVICE COMPLETE REFERENCE
local TweenService = game:GetService("TweenService")

-- TweenInfo parameters:
-- TweenInfo.new(duration, easingStyle, easingDirection, repeatCount, reverses, delay)
-- duration: seconds (0.1-5 typical)
-- repeatCount: 0 = once, -1 = infinite
-- reverses: true = plays backward after forward

-- ALL EASING STYLES (pick based on feel):
-- Linear    — constant speed (robotic, rarely good)
-- Sine      — gentle ease (subtle, default choice)
-- Quad      — smooth ease (UI transitions)
-- Cubic     — moderate ease (camera movements)
-- Quart     — strong ease (dramatic reveals)
-- Quint     — very strong ease (heavy objects)
-- Exponential — extreme ease (explosions, impacts)
-- Circular  — circular motion feel
-- Back      — overshoots target then settles (menus opening)
-- Elastic   — springy bounce (playful/cartoon)
-- Bounce    — bounces at end (notifications, drops)

-- EASING DIRECTIONS:
-- In    — starts slow, ends fast
-- Out   — starts fast, ends slow (most natural for UI)
-- InOut  — slow start, fast middle, slow end

-- COMMON COMBOS:
-- UI open:  Back + Out (0.3s) — overshoots then settles
-- UI close: Quad + In (0.2s) — quick shrink
-- Button press: Back + Out (0.1s, scale 0.95 → 1.0)
-- Notification: Bounce + Out (0.4s) — bouncy entrance
-- Camera pan: Cubic + InOut (1.5s) — smooth start and end
-- Damage flash: Linear (0.05s) — instant

-- TWEENING MULTIPLE PROPERTIES AT ONCE:
local tween = TweenService:Create(part, TweenInfo.new(1, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), {
  Position = Vector3.new(0, 20, 0),
  Transparency = 0.5,
  Color = Color3.fromRGB(255, 0, 0),
  Size = Vector3.new(4, 4, 4),
})
tween:Play()

-- CANCEL/PAUSE:
tween:Cancel() -- Stops and resets to start
tween:Pause()  -- Stops at current position
tween:Play()   -- Resumes from pause position`,
    pitfalls: [
      'Linear easing almost always looks robotic — use Quad or Sine as default',
      'Elastic/Bounce on position tweens can move parts through walls',
      'Cancel() resets to start position — use Pause() to freeze in place',
      'Cannot tween BrickColor — use Color property (Color3) instead',
      'Creating tweens in loops without destroying old ones = memory leak',
    ],
  },

  {
    name: 'TextChatService (Modern Chat)',
    keywords: ['textchatservice', 'chat', 'custom command', 'channel', 'bubble chat', 'chat decoration', 'text chat'],
    snippet: `-- TEXTCHATSERVICE (modern chat system, replaces legacy Chat)
-- TextChatService is the NEW chat system (2023+). Legacy Chat is deprecated.

local TextChatService = game:GetService("TextChatService")

-- CUSTOM CHAT COMMAND (e.g., /trade, /help):
local command = Instance.new("TextChatCommand")
command.Name = "TradeCommand"
command.PrimaryAlias = "/trade"
command.SecondaryAlias = "/t"
command.Parent = TextChatService

command.Triggered:Connect(function(textSource, unfilteredText)
  local player = game.Players:GetPlayerByUserId(textSource.UserId)
  if not player then return end
  -- Parse: /trade PlayerName
  local targetName = string.match(unfilteredText, "/trade%s+(%w+)")
  if targetName then
    -- Initiate trade with target player
    print(player.Name .. " wants to trade with " .. targetName)
  end
end)

-- BUBBLE CHAT CONFIGURATION:
local bubbleConfig = TextChatService.BubbleChatConfiguration
bubbleConfig.Enabled = true
bubbleConfig.TailVisible = true
bubbleConfig.TextSize = 16
bubbleConfig.FontFace = Font.fromEnum(Enum.Font.GothamMedium)
bubbleConfig.BackgroundColor3 = Color3.fromRGB(20, 20, 30)
bubbleConfig.TextColor3 = Color3.fromRGB(255, 255, 255)

-- CUSTOM CHANNELS:
local channel = Instance.new("TextChannel")
channel.Name = "TeamChat"
channel.Parent = TextChatService

-- Add player to channel:
-- channel:AddUserAsync(player.UserId)

-- SEND SYSTEM MESSAGE:
local defaultChannel = TextChatService.TextChannels:FindFirstChild("RBXGeneral")
if defaultChannel then
  defaultChannel:DisplaySystemMessage("Welcome to the game!")
end`,
    pitfalls: [
      'Using legacy Chat service instead of TextChatService (deprecated since 2023)',
      'Custom commands must be parented to TextChatService to work',
      'DisplaySystemMessage is client-side only — cannot send from server',
      'Chat filtering is automatic with TextChatService — do NOT manually filter',
      'BubbleChatConfiguration must exist under TextChatService',
    ],
  },

  {
    name: 'PolicyService (Age Gates, Paid Items)',
    keywords: ['policyservice', 'policy', 'age gate', 'paid items', 'china', 'coppa', 'age restriction', 'compliance'],
    snippet: `-- POLICYSERVICE (compliance with regional laws)
local PolicyService = game:GetService("PolicyService")

-- Get policy info for a player (server-side)
local function getPlayerPolicy(player: Player)
  local success, policyInfo = pcall(function()
    return PolicyService:GetPolicyInfoForPlayerAsync(player)
  end)
  if not success then
    warn("Policy check failed:", policyInfo)
    return nil
  end
  return policyInfo
end

-- USAGE: Check what the player is allowed to see/do
game.Players.PlayerAdded:Connect(function(player)
  local policy = getPlayerPolicy(player)
  if not policy then return end

  -- Check if player can see paid items (some regions restrict this)
  if policy.ArePaidRandomItemsRestricted then
    -- Hide gacha/lootbox UI for this player
    -- Required for: Belgium, Netherlands, some age groups
  end

  -- Check if player has social features enabled
  if not policy.AllowedExternalLinkReferences then
    -- Hide Discord/YouTube links
  end

  -- Check if player can trade
  if policy.IsPaidItemTradingAllowed then
    -- Enable trading UI
  end
end)`,
    pitfalls: [
      'GetPolicyInfoForPlayerAsync can fail — always wrap in pcall',
      'Policy varies by region AND age — never assume same policy for all players',
      'ArePaidRandomItemsRestricted = true means NO lootboxes/gacha for that player',
      'Must be called on server — PolicyService is not available on client',
    ],
  },

  {
    name: 'GroupService (Group Info, Rank Checking)',
    keywords: ['groupservice', 'group', 'rank', 'role', 'clan', 'getgroupinfo', 'getgroupsasync', 'getrankingroupasync'],
    snippet: `-- GROUPSERVICE (group membership and rank checking)
local GroupService = game:GetService("GroupService")
local Players = game:GetService("Players")

local VIP_GROUP_ID = 12345678 -- Replace with real group ID
local STAFF_RANK = 200        -- Rank number in group

-- Check if player is in a group
local function isInGroup(player: Player, groupId: number): boolean
  local success, result = pcall(function()
    return player:IsInGroup(groupId)
  end)
  return success and result
end

-- Get player's rank in group (0 = not in group, 1-255 = rank)
local function getGroupRank(player: Player, groupId: number): number
  local success, rank = pcall(function()
    return player:GetRankInGroup(groupId)
  end)
  return success and rank or 0
end

-- Get full group info
local function getGroupInfo(groupId: number)
  local success, info = pcall(function()
    return GroupService:GetGroupInfoAsync(groupId)
  end)
  if success then
    print("Group:", info.Name)
    print("Owner:", info.Owner.Name)
    print("Members:", info.MemberCount)
  end
  return success and info or nil
end

-- Get all groups a player is in
local function getPlayerGroups(player: Player)
  local success, groups = pcall(function()
    return GroupService:GetGroupsAsync(player.UserId)
  end)
  return success and groups or {}
end

-- USAGE: VIP/Staff detection
Players.PlayerAdded:Connect(function(player)
  local rank = getGroupRank(player, VIP_GROUP_ID)
  if rank >= STAFF_RANK then
    -- Grant staff permissions
  elseif rank > 0 then
    -- Grant group member perks
  end
end)`,
    pitfalls: [
      'All GroupService methods can fail — always wrap in pcall',
      'IsInGroup / GetRankInGroup are Player methods, not GroupService methods',
      'Group rank 0 = not in group, 1 = lowest rank, 255 = owner rank',
      'GetGroupsAsync returns all groups (can be large) — cache results',
      'Rate limited: ~10 requests per minute per player for group APIs',
    ],
  },

  {
    name: 'SocialService (Game Invites)',
    keywords: ['socialservice', 'invite', 'friend', 'prompt', 'social', 'game invite', 'multiplayer'],
    snippet: `-- SOCIALSERVICE (game invites and social features)
local SocialService = game:GetService("SocialService")

-- Check if player can send game invites
local function canInvite(player: Player): boolean
  local success, canSend = pcall(function()
    return SocialService:CanSendGameInviteAsync(player)
  end)
  return success and canSend
end

-- Prompt game invite dialog
local function inviteFriends(player: Player)
  if not canInvite(player) then return end
  local success, err = pcall(function()
    SocialService:PromptGameInvite(player)
  end)
  if not success then
    warn("Invite failed:", err)
  end
end

-- Listen for invite prompt closure
SocialService.GameInvitePromptClosed:Connect(function(player, recipientIds)
  if #recipientIds > 0 then
    print(player.Name .. " invited " .. #recipientIds .. " friends")
    -- Award bonus for inviting (retention mechanic)
  end
end)

-- Prompt phone book (phone contacts to invite)
-- SocialService:PromptPhoneBook(player, "GameInvite")`,
    pitfalls: [
      'CanSendGameInviteAsync can return false — always check before prompting',
      'PromptGameInvite fires a native Roblox UI — cannot customize it',
      'GameInvitePromptClosed recipientIds may be empty (user cancelled)',
      'Some platforms/regions restrict social features — always check CanSend first',
    ],
  },

  {
    name: 'ContentProvider (Preload Assets)',
    keywords: ['contentprovider', 'preload', 'preloadasync', 'loading', 'asset', 'load time', 'cache'],
    snippet: `-- CONTENTPROVIDER (preload assets for instant access)
local ContentProvider = game:GetService("ContentProvider")

-- Preload specific assets (sounds, images, meshes)
local assetsToPreload = {
  game.ReplicatedStorage.GameAssets,
  game.ReplicatedStorage.Sounds,
  -- Or specific asset IDs:
  -- "rbxassetid://1234567890",
}

-- Preload with progress callback
local totalAssets = #assetsToPreload
local loaded = 0

ContentProvider:PreloadAsync(assetsToPreload, function(assetId, status)
  loaded += 1
  if status == Enum.AssetFetchStatus.Success then
    -- Asset loaded
  elseif status == Enum.AssetFetchStatus.Failure then
    warn("Failed to preload:", assetId)
  end
  -- Update loading bar
  local progress = loaded / totalAssets
  print(string.format("Loading: %.0f%%", progress * 100))
end)

print("All assets preloaded!")

-- Check current request queue
print("Assets in queue:", ContentProvider.RequestQueueSize)`,
    pitfalls: [
      'PreloadAsync blocks the current thread — run in task.spawn or loading screen',
      'Do NOT preload entire workspace — only preload critical assets',
      'Assets that fail to load will NOT retry — handle Failure status',
      'RequestQueueSize > 100 means too many assets queuing — prioritize',
    ],
  },

  {
    name: 'InsertService (Load Toolbox Assets)',
    keywords: ['insertservice', 'loadasset', 'toolbox', 'insert', 'model', 'free model', 'asset'],
    snippet: `-- INSERTSERVICE (load assets from Roblox library at runtime)
local InsertService = game:GetService("InsertService")

-- Load a model/tool from asset ID
local function loadAsset(assetId: number): Instance?
  local success, model = pcall(function()
    return InsertService:LoadAsset(assetId)
  end)
  if success and model then
    -- LoadAsset returns a Model containing the asset
    local asset = model:GetChildren()[1]
    if asset then
      asset.Parent = workspace
      model:Destroy() -- Cleanup wrapper
      return asset
    end
  end
  warn("Failed to load asset:", assetId)
  return nil
end

-- Example: load a hat/accessory
local hat = loadAsset(1234567890)
if hat then
  hat.Parent = character
end

-- Get free models from search (limited use)
local function searchModels(query: string)
  local success, results = pcall(function()
    return InsertService:GetFreeModels(query)
  end)
  return success and results or {}
end`,
    pitfalls: [
      'LoadAsset only works on assets you OWN or that are free/public',
      'Returns a wrapper Model — the actual asset is inside as first child',
      'Can fail due to moderation or network — always pcall',
      'GetFreeModels is heavily rate-limited and returns limited results',
      'Do NOT use for user-uploaded assets without moderation check',
    ],
  },

  {
    name: 'MemoryStoreService (Matchmaking, Live Data)',
    keywords: ['memorystore', 'memorystoreservice', 'sortedmap', 'queue', 'matchmaking', 'live', 'temporary', 'ephemeral'],
    snippet: `-- MEMORYSTORESERVICE (fast, temporary, cross-server storage)
-- Use for: matchmaking queues, live leaderboards, session data
-- NOT for persistent data — data expires after max 45 days

local MemoryStoreService = game:GetService("MemoryStoreService")

-- SORTED MAP (key-value with automatic sorting — great for leaderboards)
local liveLeaderboard = MemoryStoreService:GetSortedMap("LiveLeaderboard")

-- Add/update a score
local function updateLiveScore(userId: number, score: number)
  pcall(function()
    liveLeaderboard:SetAsync(
      tostring(userId), -- key
      score,             -- value
      86400              -- expiration in seconds (24 hours)
    )
  end)
end

-- Get top scores
local function getTopScores(count: number)
  local success, items = pcall(function()
    return liveLeaderboard:GetRangeAsync(
      Enum.SortDirection.Descending,
      count
    )
  end)
  return success and items or {}
end

-- QUEUE (FIFO — great for matchmaking)
local matchQueue = MemoryStoreService:GetQueue("Matchmaking")

-- Add player to queue
local function queueForMatch(player: Player, data: {})
  pcall(function()
    matchQueue:AddAsync(data, 300) -- 5 min expiration
  end)
end

-- Read from queue (non-destructive peek)
local function checkQueue(count: number)
  local success, items, id = pcall(function()
    return matchQueue:ReadAsync(count, false, 5) -- 5 second wait
  end)
  return success and items or {}
end

-- Remove processed items from queue
-- matchQueue:RemoveAsync(id)`,
    pitfalls: [
      'Data is TEMPORARY — expires after set duration (max 45 days)',
      'NOT a replacement for DataStore — use DataStore for persistent saves',
      'Rate limits are generous but exist — 1000+ req/min per partition',
      'GetRangeAsync returns max 200 items per call',
      'Queue items must be under 1KB, map values under 32KB',
    ],
  },

  {
    name: 'MessagingService (Cross-Server Communication)',
    keywords: ['messagingservice', 'crossserver', 'publish', 'subscribe', 'global', 'all servers', 'broadcast', 'cross server'],
    snippet: `-- MESSAGINGSERVICE (broadcast messages across all servers)
local MessagingService = game:GetService("MessagingService")
local HttpService = game:GetService("HttpService")

-- SUBSCRIBE: Listen for messages on a topic
local TOPIC = "GlobalAnnouncements"

local success, connection = pcall(function()
  return MessagingService:SubscribeAsync(TOPIC, function(message)
    local data = HttpService:JSONDecode(message.Data)
    print("Received:", data.text)
    -- Broadcast to all players in this server
    for _, player in game.Players:GetPlayers() do
      -- Show notification to player
    end
  end)
end)

-- PUBLISH: Send message to ALL servers
local function broadcastMessage(text: string, sender: string)
  pcall(function()
    MessagingService:PublishAsync(TOPIC, HttpService:JSONEncode({
      text = text,
      sender = sender,
      timestamp = os.time(),
    }))
  end)
end

-- USE CASES:
-- Global announcements from admin panel
-- Server shutdown warnings
-- Cross-server trading (notify other server of trade request)
-- Global events (double XP across all servers)
-- Ban propagation (kick banned player from all servers instantly)`,
    pitfalls: [
      'Message data must be under 1KB (use JSON encoding)',
      'Rate limit: 150 + 60*numPlayers publishes per minute per server',
      'SubscribeAsync can fail — always wrap in pcall',
      'Messages are NOT guaranteed delivery — use for non-critical broadcasts',
      'Each topic: max 5 subscriptions per server',
    ],
  },

  {
    name: 'AssetService (Place Management)',
    keywords: ['assetservice', 'createplaceasync', 'saveplaceasync', 'place', 'universe', 'subplace'],
    snippet: `-- ASSETSERVICE (create and manage places in a universe)
local AssetService = game:GetService("AssetService")

-- Create a new place in the universe (for dynamic game instances)
local function createSubPlace(): number?
  local success, placeId = pcall(function()
    return AssetService:CreatePlaceAsync(
      "DynamicArena_" .. os.time(), -- Place name
      game.GameId                    -- Template place ID (current game)
    )
  end)
  if success then
    print("Created place:", placeId)
    return placeId
  end
  return nil
end

-- Save current place state (for map editors, UGC)
local function savePlace()
  pcall(function()
    AssetService:SavePlaceAsync()
  end)
end

-- Get pages of assets
local function getGameAssets()
  local success, pages = pcall(function()
    return AssetService:GetGamePlacesAsync()
  end)
  if success then
    local page = pages:GetCurrentPage()
    for _, place in page do
      print("Place:", place.Name, "ID:", place.PlaceId)
    end
  end
end`,
    pitfalls: [
      'CreatePlaceAsync requires the game to be published and you must own it',
      'SavePlaceAsync only works in Roblox Studio or Team Create — not live servers',
      'Place creation is rate-limited — do not create places in a loop',
      'Created places inherit from template — they are NOT empty',
    ],
  },

  {
    name: 'LocalizationService (Multi-Language)',
    keywords: ['localization', 'localize', 'translate', 'language', 'i18n', 'internationalization', 'locale', 'multi language'],
    snippet: `-- LOCALIZATIONSERVICE (multi-language support)
local LocalizationService = game:GetService("LocalizationService")
local Players = game:GetService("Players")

-- Get player's locale
local player = Players.LocalPlayer
local locale = LocalizationService.RobloxLocaleId -- e.g., "en-us", "pt-br", "ja-jp"

-- Get translator for automatic translation
local function getTranslator(player: Player)
  local success, translator = pcall(function()
    return LocalizationService:GetTranslatorForPlayerAsync(player)
  end)
  return success and translator or nil
end

-- Translate a string
local translator = getTranslator(player)
if translator then
  local success, translated = pcall(function()
    return translator:Translate(game, "Hello, welcome to the game!")
  end)
  if success then
    print("Translated:", translated)
  end
end

-- Manual localization table approach:
local STRINGS = {
  ["en-us"] = {
    welcome = "Welcome!",
    shop = "Shop",
    coins = "Coins",
  },
  ["es-es"] = {
    welcome = "Bienvenido!",
    shop = "Tienda",
    coins = "Monedas",
  },
  ["pt-br"] = {
    welcome = "Bem-vindo!",
    shop = "Loja",
    coins = "Moedas",
  },
}

local function getString(key: string): string
  local lang = LocalizationService.RobloxLocaleId
  local strings = STRINGS[lang] or STRINGS["en-us"]
  return strings[key] or key
end`,
    pitfalls: [
      'GetTranslatorForPlayerAsync can fail — always pcall',
      'Automatic translation requires localization table uploaded in Game Settings',
      'RobloxLocaleId is client-side only — read on client, send to server if needed',
      'Not all strings translate well automatically — test with native speakers',
      'Brazilian Portuguese is pt-br, NOT pt-pt (different audiences)',
    ],
  },

  // ── BUILDING PATTERNS ─────────────────────────────────────────────────────

  {
    name: 'Castle Construction',
    keywords: ['castle', 'medieval', 'tower', 'battlement', 'gatehouse', 'portcullis', 'moat', 'drawbridge', 'fortress', 'keep'],
    snippet: `-- CASTLE CONSTRUCTION (multi-part detailed build)
local function buildCastle(pos, parent)
  local m = Instance.new("Model") m.Name = "Castle"
  local stoneColor = Color3.fromRGB(140, 135, 125)
  local darkStone = Color3.fromRGB(110, 105, 95)

  -- Main keep (central tower)
  local keep = Instance.new("Part") keep.Anchored = true
  keep.Size = Vector3.new(30, 25, 30)
  keep.CFrame = CFrame.new(pos + Vector3.new(0, 12.5, 0))
  keep.Material = Enum.Material.Cobblestone keep.Color = stoneColor keep.Parent = m

  -- Corner towers (4x)
  for _, offset in ipairs({
    Vector3.new(18, 0, 18), Vector3.new(-18, 0, 18),
    Vector3.new(18, 0, -18), Vector3.new(-18, 0, -18),
  }) do
    local tower = Instance.new("Part") tower.Shape = Enum.PartType.Cylinder
    tower.Anchored = true tower.Size = Vector3.new(30, 8, 8)
    tower.CFrame = CFrame.new(pos + offset + Vector3.new(0, 15, 0)) * CFrame.Angles(0, 0, math.rad(90))
    tower.Material = Enum.Material.Cobblestone tower.Color = darkStone tower.Parent = m
    -- Cone roof on tower
    local roof = Instance.new("Part") roof.Shape = Enum.PartType.Cylinder
    roof.Anchored = true roof.Size = Vector3.new(6, 10, 10)
    roof.CFrame = CFrame.new(pos + offset + Vector3.new(0, 33, 0)) * CFrame.Angles(0, 0, math.rad(90))
    roof.Material = Enum.Material.Slate roof.Color = Color3.fromRGB(60, 60, 70) roof.Parent = m
  end

  -- Walls connecting towers (4 sides)
  for _, data in ipairs({
    {Vector3.new(18, 0, 0), 0}, {Vector3.new(-18, 0, 0), 0},
    {Vector3.new(0, 0, 18), math.rad(90)}, {Vector3.new(0, 0, -18), math.rad(90)},
  }) do
    local wall = Instance.new("Part") wall.Anchored = true
    wall.Size = Vector3.new(28, 18, 3)
    wall.CFrame = CFrame.new(pos + data[1] + Vector3.new(0, 9, 0)) * CFrame.Angles(0, data[2], 0)
    wall.Material = Enum.Material.Cobblestone wall.Color = stoneColor wall.Parent = m
  end

  -- Battlements (merlons on top of walls)
  for i = -12, 12, 4 do
    local merlon = Instance.new("Part") merlon.Anchored = true
    merlon.Size = Vector3.new(2, 3, 3.2)
    merlon.CFrame = CFrame.new(pos + Vector3.new(i, 19.5, 18))
    merlon.Material = Enum.Material.Cobblestone merlon.Color = darkStone merlon.Parent = m
  end

  -- Gatehouse entrance
  local gate = Instance.new("Part") gate.Anchored = true
  gate.Size = Vector3.new(6, 8, 4) gate.Transparency = 0.3
  gate.CFrame = CFrame.new(pos + Vector3.new(0, 4, 18))
  gate.Material = Enum.Material.WoodPlanks gate.Color = Color3.fromRGB(80, 50, 20) gate.Parent = m

  m.Parent = parent or workspace return m
end`,
    pitfalls: [
      'Castle without corner towers looks like a box — always add 4 towers',
      'Flat-topped towers look incomplete — add cone/pyramid roofs',
      'Missing battlements on walls (the crenellations are what make it a castle)',
      'Gatehouse should be recessed or have arch, not just a hole in the wall',
      'Use Cobblestone material, NOT SmoothPlastic for stone walls',
    ],
  },

  {
    name: 'Spaceship Interior',
    keywords: ['spaceship', 'space', 'sci-fi', 'corridor', 'bridge', 'engine room', 'airlock', 'futuristic', 'starship', 'cockpit'],
    snippet: `-- SPACESHIP INTERIOR (corridors, bridge, engine room)
local function buildSpaceship(pos, parent)
  local m = Instance.new("Model") m.Name = "Spaceship"
  local hullColor = Color3.fromRGB(80, 85, 95)
  local accentColor = Color3.fromRGB(40, 160, 220)
  local floorColor = Color3.fromRGB(50, 55, 60)

  -- Main corridor (central spine)
  local corridor = Instance.new("Part") corridor.Anchored = true
  corridor.Size = Vector3.new(8, 8, 60) corridor.CFrame = CFrame.new(pos)
  corridor.Material = Enum.Material.Metal corridor.Color = hullColor corridor.Parent = m

  -- Floor with grating texture
  local floor = Instance.new("Part") floor.Anchored = true
  floor.Size = Vector3.new(7, 0.5, 58) floor.CFrame = CFrame.new(pos - Vector3.new(0, 3.5, 0))
  floor.Material = Enum.Material.DiamondPlate floor.Color = floorColor floor.Parent = m

  -- Neon strip lights along corridor walls
  for _, sideX in ipairs({-3.8, 3.8}) do
    local strip = Instance.new("Part") strip.Anchored = true
    strip.Size = Vector3.new(0.2, 0.3, 58) strip.CFrame = CFrame.new(pos + Vector3.new(sideX, 2, 0))
    strip.Material = Enum.Material.Neon strip.Color = accentColor strip.Parent = m
    local light = Instance.new("PointLight") light.Color = accentColor
    light.Brightness = 1.5 light.Range = 8 light.Parent = strip
  end

  -- Bridge (front section with windows)
  local bridge = Instance.new("Part") bridge.Anchored = true
  bridge.Size = Vector3.new(16, 8, 12) bridge.CFrame = CFrame.new(pos + Vector3.new(0, 0, -36))
  bridge.Material = Enum.Material.Metal bridge.Color = hullColor bridge.Parent = m

  -- Viewport window (glass)
  local window = Instance.new("Part") window.Anchored = true
  window.Size = Vector3.new(14, 4, 0.5) window.CFrame = CFrame.new(pos + Vector3.new(0, 1, -42))
  window.Material = Enum.Material.Glass window.Color = Color3.fromRGB(30, 40, 60)
  window.Transparency = 0.3 window.Parent = m

  -- Control console
  local console = Instance.new("Part") console.Anchored = true
  console.Size = Vector3.new(8, 3, 2) console.CFrame = CFrame.new(pos + Vector3.new(0, -1.5, -40))
  console.Material = Enum.Material.Metal console.Color = Color3.fromRGB(30, 35, 40) console.Parent = m
  -- Console screen (neon surface)
  local screen = Instance.new("Part") screen.Anchored = true
  screen.Size = Vector3.new(6, 2, 0.1) screen.CFrame = CFrame.new(pos + Vector3.new(0, -0.5, -40.5))
  screen.Material = Enum.Material.Neon screen.Color = Color3.fromRGB(0, 200, 100) screen.Parent = m

  -- Engine room (rear section)
  local engine = Instance.new("Part") engine.Shape = Enum.PartType.Cylinder engine.Anchored = true
  engine.Size = Vector3.new(12, 6, 6) engine.CFrame = CFrame.new(pos + Vector3.new(0, 0, 36)) * CFrame.Angles(0, 0, math.rad(90))
  engine.Material = Enum.Material.Metal engine.Color = Color3.fromRGB(60, 65, 75) engine.Parent = m
  -- Engine glow
  local glow = Instance.new("Part") glow.Shape = Enum.PartType.Cylinder glow.Anchored = true
  glow.Size = Vector3.new(1, 5, 5) glow.CFrame = CFrame.new(pos + Vector3.new(0, 0, 42)) * CFrame.Angles(0, 0, math.rad(90))
  glow.Material = Enum.Material.Neon glow.Color = Color3.fromRGB(100, 150, 255) glow.Parent = m
  Instance.new("PointLight", glow).Color = glow.Color

  m.Parent = parent or workspace return m
end`,
    pitfalls: [
      'Spaceship without neon accent lights looks like a warehouse — add strip lighting',
      'Use Metal and DiamondPlate materials — never Concrete for sci-fi',
      'Engine room needs a visible glow (Neon cylinder + PointLight)',
      'Corridors need floor grating (DiamondPlate) not flat smooth surfaces',
      'Bridge needs a viewport window — the #1 feature players look for',
    ],
  },

  {
    name: 'Tree House Construction',
    keywords: ['treehouse', 'tree house', 'platform', 'rope bridge', 'rope ladder', 'forest', 'canopy', 'elevated'],
    snippet: `-- TREE HOUSE (trunk, platforms, rope bridge, ladder)
local function buildTreeHouse(pos, parent)
  local m = Instance.new("Model") m.Name = "TreeHouse"
  local woodColor = Color3.fromRGB(100, 65, 30)
  local plankColor = Color3.fromRGB(140, 100, 50)

  -- Main tree trunk
  local trunk = Instance.new("Part") trunk.Shape = Enum.PartType.Cylinder
  trunk.Anchored = true trunk.Size = Vector3.new(30, 4, 4)
  trunk.CFrame = CFrame.new(pos + Vector3.new(0, 15, 0)) * CFrame.Angles(0, 0, math.rad(90))
  trunk.Material = Enum.Material.Wood trunk.Color = woodColor trunk.Parent = m

  -- Canopy (3 overlapping balls)
  for i = 1, 3 do
    local leaf = Instance.new("Part") leaf.Shape = Enum.PartType.Ball leaf.Anchored = true
    local s = 14 - i * 2
    leaf.Size = Vector3.new(s, s * 0.7, s)
    leaf.CFrame = CFrame.new(pos + Vector3.new(math.random(-2, 2), 28 + i * 3, math.random(-2, 2)))
    leaf.Material = Enum.Material.Grass leaf.Color = Color3.fromRGB(40 + i * 15, 110 + i * 15, 30)
    leaf.Parent = m
  end

  -- Main platform
  local platform = Instance.new("Part") platform.Anchored = true
  platform.Size = Vector3.new(14, 0.8, 14)
  platform.CFrame = CFrame.new(pos + Vector3.new(0, 18, 0))
  platform.Material = Enum.Material.WoodPlanks platform.Color = plankColor platform.Parent = m

  -- Railing posts (8 around edge)
  for angle = 0, 315, 45 do
    local rad = math.rad(angle)
    local px = math.cos(rad) * 6.5
    local pz = math.sin(rad) * 6.5
    local post = Instance.new("Part") post.Anchored = true
    post.Size = Vector3.new(0.4, 3, 0.4)
    post.CFrame = CFrame.new(pos + Vector3.new(px, 19.9, pz))
    post.Material = Enum.Material.Wood post.Color = woodColor post.Parent = m
  end

  -- Rope ladder (series of rungs)
  for i = 0, 7 do
    local rung = Instance.new("Part") rung.Anchored = true
    rung.Size = Vector3.new(2, 0.3, 0.3)
    rung.CFrame = CFrame.new(pos + Vector3.new(7, 2 + i * 2, 0))
    rung.Material = Enum.Material.Wood rung.Color = plankColor rung.Parent = m
    -- Rope sides
    for _, sx in ipairs({-1, 1}) do
      local rope = Instance.new("Part") rope.Anchored = true
      rope.Size = Vector3.new(0.15, 2.3, 0.15)
      rope.CFrame = CFrame.new(pos + Vector3.new(7 + sx, 2.5 + i * 2, 0))
      rope.Material = Enum.Material.Fabric rope.Color = Color3.fromRGB(160, 140, 90) rope.Parent = m
    end
  end

  m.Parent = parent or workspace return m
end`,
    pitfalls: [
      'Platform without railing — players fall off and it looks unfinished',
      'Trunk too thin for the platform size — scale trunk width with platform',
      'Rope ladder rungs too far apart — 2 stud spacing is good for climbing',
      'Missing canopy makes it just a platform on a pole, not a tree house',
      'Use WoodPlanks for platform, Wood for structural — different textures add depth',
    ],
  },

  {
    name: 'Cave System',
    keywords: ['cave', 'cavern', 'underground', 'stalactite', 'stalagmite', 'crystal', 'mine', 'tunnel', 'glowing'],
    snippet: `-- CAVE SYSTEM (stalactites, pools, glowing crystals)
local function buildCave(pos, parent)
  local m = Instance.new("Model") m.Name = "Cave"
  local rockColor = Color3.fromRGB(70, 65, 60)
  local darkRock = Color3.fromRGB(45, 42, 38)

  -- Cave shell (hollow sphere made of rock parts)
  local caveRadius = 30
  for i = 1, 20 do
    local angle1 = math.random() * math.pi * 2
    local angle2 = math.random() * math.pi
    local r = caveRadius + math.random(-3, 3)
    local cx = math.cos(angle1) * math.sin(angle2) * r
    local cy = math.cos(angle2) * r * 0.5
    local cz = math.sin(angle1) * math.sin(angle2) * r
    local rock = Instance.new("Part") rock.Anchored = true
    local s = math.random(8, 16)
    rock.Size = Vector3.new(s, s * 0.6, s)
    rock.CFrame = CFrame.new(pos + Vector3.new(cx, cy, cz)) * CFrame.Angles(math.random()*2, math.random()*2, math.random()*2)
    rock.Material = Enum.Material.Slate rock.Color = rockColor rock.Parent = m
  end

  -- Floor (uneven rock surface)
  local floor = Instance.new("Part") floor.Anchored = true
  floor.Size = Vector3.new(50, 3, 50)
  floor.CFrame = CFrame.new(pos - Vector3.new(0, caveRadius * 0.4, 0))
  floor.Material = Enum.Material.Slate floor.Color = darkRock floor.Parent = m

  -- Stalactites (hanging from ceiling)
  for i = 1, 8 do
    local st = Instance.new("Part") st.Anchored = true
    st.Shape = Enum.PartType.Cylinder
    local len = math.random(4, 10)
    st.Size = Vector3.new(len, math.random() + 0.5, math.random() + 0.5)
    st.CFrame = CFrame.new(pos + Vector3.new(math.random(-15, 15), caveRadius * 0.3 - len / 2, math.random(-15, 15))) * CFrame.Angles(0, 0, math.rad(90))
    st.Material = Enum.Material.Slate st.Color = Color3.fromRGB(90, 85, 80) st.Parent = m
  end

  -- Glowing crystals
  for i = 1, 5 do
    local crystal = Instance.new("Part") crystal.Anchored = true
    crystal.Size = Vector3.new(0.8, math.random(2, 5), 0.8)
    crystal.CFrame = CFrame.new(pos + Vector3.new(math.random(-12, 12), -caveRadius * 0.4 + 2, math.random(-12, 12)))
      * CFrame.Angles(math.rad(math.random(-20, 20)), math.rad(math.random(0, 360)), math.rad(math.random(-20, 20)))
    crystal.Material = Enum.Material.Neon
    crystal.Color = Color3.fromRGB(
      math.random(50, 100), math.random(150, 255), math.random(200, 255)
    )
    crystal.Parent = m
    local light = Instance.new("PointLight") light.Color = crystal.Color
    light.Brightness = 2 light.Range = 12 light.Parent = crystal
  end

  -- Underground pool
  local pool = Instance.new("Part") pool.Shape = Enum.PartType.Cylinder pool.Anchored = true
  pool.Size = Vector3.new(1, 12, 12)
  pool.CFrame = CFrame.new(pos + Vector3.new(8, -caveRadius * 0.4 + 0.5, -5)) * CFrame.Angles(0, 0, math.rad(90))
  pool.Material = Enum.Material.Glass pool.Color = Color3.fromRGB(30, 80, 120)
  pool.Transparency = 0.4 pool.CanCollide = false pool.Parent = m

  m.Parent = parent or workspace return m
end`,
    pitfalls: [
      'Cave without any light source is pitch black — always add glowing crystals or torches',
      'Perfectly smooth cave walls look artificial — vary rock sizes and rotations',
      'Stalactites hanging from FLOOR is wrong — they hang from ceiling (stalagmites go up)',
      'Crystal colors should be cool tones (cyan, purple, blue) not warm',
      'Underground pools need Glass material + Transparency + CanCollide false',
    ],
  },

  {
    name: 'Japanese Temple / Torii Gate',
    keywords: ['japanese', 'temple', 'torii', 'pagoda', 'shrine', 'zen', 'garden', 'stone garden', 'oriental', 'asian'],
    snippet: `-- JAPANESE TEMPLE (torii gate, pagoda roof, stone garden)
local function buildTemple(pos, parent)
  local m = Instance.new("Model") m.Name = "JapaneseTemple"
  local redColor = Color3.fromRGB(180, 30, 30)
  local woodColor = Color3.fromRGB(100, 60, 30)
  local stoneColor = Color3.fromRGB(160, 155, 145)

  -- Torii gate
  for _, sx in ipairs({-4, 4}) do
    local pillar = Instance.new("Part") pillar.Anchored = true
    pillar.Size = Vector3.new(1.2, 12, 1.2)
    pillar.CFrame = CFrame.new(pos + Vector3.new(sx, 6, -15))
    pillar.Material = Enum.Material.Wood pillar.Color = redColor pillar.Parent = m
  end
  -- Top beam (kasagi)
  local topBeam = Instance.new("Part") topBeam.Anchored = true
  topBeam.Size = Vector3.new(12, 0.8, 1.5)
  topBeam.CFrame = CFrame.new(pos + Vector3.new(0, 12, -15))
  topBeam.Material = Enum.Material.Wood topBeam.Color = redColor topBeam.Parent = m
  -- Lower beam (nuki)
  local lowerBeam = Instance.new("Part") lowerBeam.Anchored = true
  lowerBeam.Size = Vector3.new(9, 0.5, 0.8)
  lowerBeam.CFrame = CFrame.new(pos + Vector3.new(0, 9, -15))
  lowerBeam.Material = Enum.Material.Wood lowerBeam.Color = redColor lowerBeam.Parent = m

  -- Temple building (raised platform)
  local platform = Instance.new("Part") platform.Anchored = true
  platform.Size = Vector3.new(20, 2, 16)
  platform.CFrame = CFrame.new(pos + Vector3.new(0, 1, 0))
  platform.Material = Enum.Material.Concrete platform.Color = stoneColor platform.Parent = m

  -- Temple walls
  local wallH = 8
  local wallMat = Enum.Material.WoodPlanks
  for _, d in ipairs({{10,0,0,0},{-10,0,0,0},{0,0,8,90},{0,0,-8,90}}) do
    local w = Instance.new("Part") w.Anchored = true
    w.Size = Vector3.new(d[4] == 90 and 16 or 20, wallH, 0.5)
    w.CFrame = CFrame.new(pos + Vector3.new(d[1], wallH/2 + 2, d[3])) * CFrame.Angles(0, math.rad(d[4]), 0)
    w.Material = wallMat w.Color = Color3.fromRGB(220, 210, 190) w.Parent = m
  end

  -- Pagoda roof (curved using wedges)
  local roofW = Instance.new("WedgePart") roofW.Anchored = true
  roofW.Size = Vector3.new(24, 4, 12)
  roofW.CFrame = CFrame.new(pos + Vector3.new(0, wallH + 4, -4))
  roofW.Material = Enum.Material.Slate roofW.Color = Color3.fromRGB(40, 40, 50) roofW.Parent = m
  local roofW2 = roofW:Clone()
  roofW2.CFrame = CFrame.new(pos + Vector3.new(0, wallH + 4, 4)) * CFrame.Angles(0, math.rad(180), 0)
  roofW2.Parent = m

  -- Stone garden (raked sand area with rocks)
  local sand = Instance.new("Part") sand.Anchored = true
  sand.Size = Vector3.new(15, 0.3, 15)
  sand.CFrame = CFrame.new(pos + Vector3.new(20, 0, 0))
  sand.Material = Enum.Material.Sand sand.Color = Color3.fromRGB(220, 210, 180) sand.Parent = m
  -- Garden rocks
  for i = 1, 3 do
    local rock = Instance.new("Part") rock.Anchored = true rock.Shape = Enum.PartType.Ball
    local s = 1 + math.random() * 2
    rock.Size = Vector3.new(s, s * 0.7, s)
    rock.CFrame = CFrame.new(pos + Vector3.new(17 + i * 3, 0.5, math.random(-3, 3)))
    rock.Material = Enum.Material.Slate rock.Color = Color3.fromRGB(100, 95, 88) rock.Parent = m
  end

  m.Parent = parent or workspace return m
end`,
    pitfalls: [
      'Torii gate must be RED (traditional vermillion) — not brown or gray',
      'Pagoda roof needs overhang and upward curve at edges — flat roof is wrong',
      'Stone garden rocks should be odd-numbered groups (3 or 5) — Japanese tradition',
      'Temple should be elevated on a platform — never sitting directly on ground',
      'Use Slate for roof tiles, NOT SmoothPlastic',
    ],
  },

  {
    name: 'Pirate Ship',
    keywords: ['pirate', 'ship', 'boat', 'hull', 'mast', 'sail', 'cannon', 'deck', 'plank', 'ocean', 'nautical'],
    snippet: `-- PIRATE SHIP (hull, masts, sails, cannons, cabin)
local function buildPirateShip(pos, parent)
  local m = Instance.new("Model") m.Name = "PirateShip"
  local hullColor = Color3.fromRGB(90, 55, 25)
  local deckColor = Color3.fromRGB(130, 90, 45)

  -- Hull (wedge + box + wedge for ship shape)
  local hullMain = Instance.new("Part") hullMain.Anchored = true
  hullMain.Size = Vector3.new(14, 8, 40) hullMain.CFrame = CFrame.new(pos)
  hullMain.Material = Enum.Material.WoodPlanks hullMain.Color = hullColor hullMain.Parent = m

  -- Bow (front wedge)
  local bow = Instance.new("WedgePart") bow.Anchored = true
  bow.Size = Vector3.new(14, 8, 12)
  bow.CFrame = CFrame.new(pos + Vector3.new(0, 0, -26))
  bow.Material = Enum.Material.WoodPlanks bow.Color = hullColor bow.Parent = m

  -- Stern (back wedge, inverted)
  local stern = Instance.new("WedgePart") stern.Anchored = true
  stern.Size = Vector3.new(14, 8, 8)
  stern.CFrame = CFrame.new(pos + Vector3.new(0, 0, 24)) * CFrame.Angles(0, math.rad(180), 0)
  stern.Material = Enum.Material.WoodPlanks stern.Color = hullColor stern.Parent = m

  -- Deck
  local deck = Instance.new("Part") deck.Anchored = true
  deck.Size = Vector3.new(13, 0.5, 38) deck.CFrame = CFrame.new(pos + Vector3.new(0, 4, -1))
  deck.Material = Enum.Material.WoodPlanks deck.Color = deckColor deck.Parent = m

  -- Masts (3 vertical poles)
  for i, zOff in ipairs({-15, 0, 12}) do
    local mast = Instance.new("Part") mast.Shape = Enum.PartType.Cylinder mast.Anchored = true
    local h = 30 - i * 4
    mast.Size = Vector3.new(h, 1, 1)
    mast.CFrame = CFrame.new(pos + Vector3.new(0, 4 + h / 2, zOff)) * CFrame.Angles(0, 0, math.rad(90))
    mast.Material = Enum.Material.Wood mast.Color = Color3.fromRGB(110, 75, 35) mast.Parent = m
    -- Crossbar
    local bar = Instance.new("Part") bar.Anchored = true
    bar.Size = Vector3.new(10, 0.5, 0.5) bar.CFrame = CFrame.new(pos + Vector3.new(0, 4 + h * 0.7, zOff))
    bar.Material = Enum.Material.Wood bar.Color = Color3.fromRGB(110, 75, 35) bar.Parent = m
    -- Sail
    local sail = Instance.new("Part") sail.Anchored = true
    sail.Size = Vector3.new(9, h * 0.4, 0.2)
    sail.CFrame = CFrame.new(pos + Vector3.new(0, 4 + h * 0.5, zOff))
    sail.Material = Enum.Material.Fabric sail.Color = Color3.fromRGB(230, 220, 200) sail.Parent = m
  end

  -- Cannons (3 per side)
  for side = -1, 1, 2 do
    for i = 0, 2 do
      local cannon = Instance.new("Part") cannon.Shape = Enum.PartType.Cylinder cannon.Anchored = true
      cannon.Size = Vector3.new(4, 1.5, 1.5)
      cannon.CFrame = CFrame.new(pos + Vector3.new(side * 7.5, 3, -10 + i * 8)) * CFrame.Angles(0, math.rad(90 * side), 0)
      cannon.Material = Enum.Material.Metal cannon.Color = Color3.fromRGB(40, 40, 45) cannon.Parent = m
    end
  end

  -- Captain's cabin (raised stern section)
  local cabin = Instance.new("Part") cabin.Anchored = true
  cabin.Size = Vector3.new(12, 6, 10) cabin.CFrame = CFrame.new(pos + Vector3.new(0, 7, 17))
  cabin.Material = Enum.Material.WoodPlanks cabin.Color = hullColor cabin.Parent = m
  -- Cabin windows
  for i = -1, 1 do
    local win = Instance.new("Part") win.Anchored = true
    win.Size = Vector3.new(1.5, 1.5, 0.3) win.CFrame = CFrame.new(pos + Vector3.new(i * 3, 7, 22.1))
    win.Material = Enum.Material.Glass win.Color = Color3.fromRGB(180, 200, 220) win.Transparency = 0.3 win.Parent = m
  end

  m.Parent = parent or workspace return m
end`,
    pitfalls: [
      'Ship hull needs a tapered bow (WedgePart) — a flat box is not a ship',
      'Masts should vary in height (tallest in center, shortest fore and aft)',
      'Sails use Fabric material — NOT SmoothPlastic or Glass',
      'Cannons need to poke through the hull sides — not sit on deck',
      'Missing captain cabin on stern makes it look like a barge, not a pirate ship',
    ],
  },

  {
    name: 'Train Station',
    keywords: ['train', 'station', 'platform', 'tracks', 'railway', 'railroad', 'bench', 'clock tower', 'transit'],
    snippet: `-- TRAIN STATION (platform, tracks, building, benches, clock)
local function buildTrainStation(pos, parent)
  local m = Instance.new("Model") m.Name = "TrainStation"

  -- Platform (long raised surface)
  local platform = Instance.new("Part") platform.Anchored = true
  platform.Size = Vector3.new(12, 3, 60)
  platform.CFrame = CFrame.new(pos + Vector3.new(0, 1.5, 0))
  platform.Material = Enum.Material.Concrete platform.Color = Color3.fromRGB(170, 165, 155) platform.Parent = m

  -- Platform edge (yellow safety line)
  local edgeLine = Instance.new("Part") edgeLine.Anchored = true
  edgeLine.Size = Vector3.new(0.5, 3.1, 60)
  edgeLine.CFrame = CFrame.new(pos + Vector3.new(-6, 1.5, 0))
  edgeLine.Material = Enum.Material.Neon edgeLine.Color = Color3.fromRGB(255, 200, 0) edgeLine.Parent = m

  -- Tracks (2 rails + sleepers)
  for _, railX in ipairs({-10, -8}) do
    local rail = Instance.new("Part") rail.Anchored = true
    rail.Size = Vector3.new(0.3, 0.3, 60)
    rail.CFrame = CFrame.new(pos + Vector3.new(railX, 0.15, 0))
    rail.Material = Enum.Material.Metal rail.Color = Color3.fromRGB(120, 115, 110) rail.Parent = m
  end
  -- Sleepers (wooden ties)
  for z = -28, 28, 3 do
    local sleeper = Instance.new("Part") sleeper.Anchored = true
    sleeper.Size = Vector3.new(4, 0.3, 1)
    sleeper.CFrame = CFrame.new(pos + Vector3.new(-9, 0, z))
    sleeper.Material = Enum.Material.WoodPlanks sleeper.Color = Color3.fromRGB(80, 55, 30) sleeper.Parent = m
  end

  -- Station building (small structure with roof)
  local building = Instance.new("Part") building.Anchored = true
  building.Size = Vector3.new(10, 10, 15)
  building.CFrame = CFrame.new(pos + Vector3.new(5, 5, 0))
  building.Material = Enum.Material.Brick building.Color = Color3.fromRGB(160, 80, 60) building.Parent = m
  -- Roof
  local roof = Instance.new("WedgePart") roof.Anchored = true
  roof.Size = Vector3.new(12, 4, 9)
  roof.CFrame = CFrame.new(pos + Vector3.new(5, 12, -3.5))
  roof.Material = Enum.Material.Slate roof.Color = Color3.fromRGB(50, 50, 55) roof.Parent = m
  local roof2 = roof:Clone()
  roof2.CFrame = CFrame.new(pos + Vector3.new(5, 12, 3.5)) * CFrame.Angles(0, math.rad(180), 0)
  roof2.Parent = m

  -- Benches (3 along platform)
  for _, z in ipairs({-15, 0, 15}) do
    local seat = Instance.new("Part") seat.Anchored = true
    seat.Size = Vector3.new(3, 0.3, 1.5) seat.CFrame = CFrame.new(pos + Vector3.new(3, 3.15, z))
    seat.Material = Enum.Material.Wood seat.Color = Color3.fromRGB(110, 75, 40) seat.Parent = m
    for _, sx in ipairs({-1.2, 1.2}) do
      local leg = Instance.new("Part") leg.Anchored = true
      leg.Size = Vector3.new(0.3, 1, 0.3) leg.CFrame = CFrame.new(pos + Vector3.new(3 + sx, 2.5, z))
      leg.Material = Enum.Material.Metal leg.Color = Color3.fromRGB(50, 50, 55) leg.Parent = m
    end
  end

  -- Clock tower
  local clockPole = Instance.new("Part") clockPole.Anchored = true
  clockPole.Size = Vector3.new(0.5, 8, 0.5) clockPole.CFrame = CFrame.new(pos + Vector3.new(-2, 7, -20))
  clockPole.Material = Enum.Material.Metal clockPole.Color = Color3.fromRGB(40, 40, 45) clockPole.Parent = m
  local clockFace = Instance.new("Part") clockFace.Shape = Enum.PartType.Cylinder clockFace.Anchored = true
  clockFace.Size = Vector3.new(0.3, 3, 3) clockFace.CFrame = CFrame.new(pos + Vector3.new(-2, 11, -20))
  clockFace.Material = Enum.Material.Metal clockFace.Color = Color3.fromRGB(230, 225, 215) clockFace.Parent = m

  m.Parent = parent or workspace return m
end`,
    pitfalls: [
      'Tracks without sleepers (wooden ties) look incomplete',
      'Platform edge needs yellow safety line (Neon material)',
      'Station building should face the platform — door on platform side',
      'Rails are thin (0.3 studs) metal bars — not thick blocks',
      'Clock is a cylinder face — use SurfaceGui for actual time display',
    ],
  },

  {
    name: 'Campsite Build',
    keywords: ['campsite', 'tent', 'campfire', 'camping', 'outdoor', 'log', 'lantern', 'cooler', 'wilderness'],
    snippet: `-- CAMPSITE (tent, campfire, logs, lanterns, cooler)
local function buildCampsite(pos, parent)
  local m = Instance.new("Model") m.Name = "Campsite"

  -- Tent (2 wedges forming A-frame)
  local tentW1 = Instance.new("WedgePart") tentW1.Anchored = true
  tentW1.Size = Vector3.new(6, 4, 5) tentW1.CFrame = CFrame.new(pos + Vector3.new(5, 2, -2.5))
  tentW1.Material = Enum.Material.Fabric tentW1.Color = Color3.fromRGB(50, 120, 80) tentW1.Parent = m
  local tentW2 = tentW1:Clone()
  tentW2.CFrame = CFrame.new(pos + Vector3.new(5, 2, 2.5)) * CFrame.Angles(0, math.rad(180), 0)
  tentW2.Parent = m
  -- Tent floor
  local tentFloor = Instance.new("Part") tentFloor.Anchored = true
  tentFloor.Size = Vector3.new(6, 0.2, 5) tentFloor.CFrame = CFrame.new(pos + Vector3.new(5, 0.1, 0))
  tentFloor.Material = Enum.Material.Fabric tentFloor.Color = Color3.fromRGB(80, 70, 60) tentFloor.Parent = m

  -- Campfire (ring of rocks + fire)
  for i = 0, 7 do
    local angle = (i / 8) * math.pi * 2
    local rock = Instance.new("Part") rock.Shape = Enum.PartType.Ball rock.Anchored = true
    rock.Size = Vector3.new(1.2, 0.8, 1.2)
    rock.CFrame = CFrame.new(pos + Vector3.new(math.cos(angle) * 2, 0.4, math.sin(angle) * 2))
    rock.Material = Enum.Material.Slate
    rock.Color = Color3.fromRGB(80 + math.random(-10, 10), 75 + math.random(-10, 10), 70)
    rock.Parent = m
  end
  -- Fire (invisible part with Fire effect)
  local firePart = Instance.new("Part") firePart.Anchored = true firePart.CanCollide = false
  firePart.Size = Vector3.new(1, 1, 1) firePart.Transparency = 1
  firePart.CFrame = CFrame.new(pos + Vector3.new(0, 0.5, 0)) firePart.Parent = m
  local fire = Instance.new("Fire") fire.Size = 4 fire.Heat = 8
  fire.Color = Color3.fromRGB(255, 150, 50)
  fire.SecondaryColor = Color3.fromRGB(255, 80, 0) fire.Parent = firePart
  local fireLight = Instance.new("PointLight") fireLight.Color = Color3.fromRGB(255, 150, 50)
  fireLight.Brightness = 2 fireLight.Range = 20 fireLight.Parent = firePart

  -- Log seating (2 logs near fire)
  for _, data in ipairs({{-3, 0, 0.3}, {0, -4, -0.2}}) do
    local log = Instance.new("Part") log.Shape = Enum.PartType.Cylinder log.Anchored = true
    log.Size = Vector3.new(5, 1.2, 1.2)
    log.CFrame = CFrame.new(pos + Vector3.new(data[1], 0.6, data[2])) * CFrame.Angles(0, math.rad(data[3] * 100), 0)
    log.Material = Enum.Material.Wood log.Color = Color3.fromRGB(90, 60, 30) log.Parent = m
  end

  -- Lantern
  local lanternBase = Instance.new("Part") lanternBase.Anchored = true
  lanternBase.Size = Vector3.new(0.8, 0.3, 0.8) lanternBase.CFrame = CFrame.new(pos + Vector3.new(3, 0.15, -4))
  lanternBase.Material = Enum.Material.Metal lanternBase.Color = Color3.fromRGB(60, 55, 50) lanternBase.Parent = m
  local lanternGlass = Instance.new("Part") lanternGlass.Anchored = true
  lanternGlass.Size = Vector3.new(0.6, 1, 0.6) lanternGlass.CFrame = CFrame.new(pos + Vector3.new(3, 0.8, -4))
  lanternGlass.Material = Enum.Material.Neon lanternGlass.Color = Color3.fromRGB(255, 200, 100)
  lanternGlass.Parent = m
  Instance.new("PointLight", lanternGlass).Color = lanternGlass.Color

  -- Cooler
  local cooler = Instance.new("Part") cooler.Anchored = true
  cooler.Size = Vector3.new(2, 1.5, 1.5) cooler.CFrame = CFrame.new(pos + Vector3.new(-5, 0.75, 2))
  cooler.Material = Enum.Material.Plastic cooler.Color = Color3.fromRGB(50, 100, 180) cooler.Parent = m

  m.Parent = parent or workspace return m
end`,
    pitfalls: [
      'Campfire without Fire effect and PointLight looks dead',
      'Rock ring should have varied colors (±10 RGB per rock)',
      'Tent without floor mat looks unfinished',
      'Logs too far from fire — seating should be 3-4 studs from center',
      'Lantern needs Neon material + PointLight for glow effect',
    ],
  },

  {
    name: 'Graveyard Build',
    keywords: ['graveyard', 'cemetery', 'headstone', 'grave', 'tombstone', 'mausoleum', 'horror', 'spooky', 'dead tree', 'fog'],
    snippet: `-- GRAVEYARD (headstones, mausoleum, dead trees, iron fence, fog)
local function buildGraveyard(pos, parent)
  local m = Instance.new("Model") m.Name = "Graveyard"
  local stoneColor = Color3.fromRGB(120, 115, 108)
  local darkStone = Color3.fromRGB(80, 76, 70)

  -- Ground (dark dirt)
  local ground = Instance.new("Part") ground.Anchored = true
  ground.Size = Vector3.new(50, 0.5, 50) ground.CFrame = CFrame.new(pos)
  ground.Material = Enum.Material.Ground ground.Color = Color3.fromRGB(50, 42, 35) ground.Parent = m

  -- Headstones (varying sizes, slightly tilted)
  for i = 1, 12 do
    local row = math.floor((i - 1) / 4)
    local col = (i - 1) % 4
    local stone = Instance.new("Part") stone.Anchored = true
    local h = math.random(3, 5)
    stone.Size = Vector3.new(2, h, 0.5)
    stone.CFrame = CFrame.new(pos + Vector3.new(-9 + col * 6 + math.random() * 2, h / 2 + 0.25, -8 + row * 8))
      * CFrame.Angles(math.rad(math.random(-5, 5)), math.rad(math.random(-10, 10)), 0)
    stone.Material = Enum.Material.Concrete stone.Color = stoneColor stone.Parent = m
    -- Rounded top
    local top = Instance.new("Part") top.Shape = Enum.PartType.Cylinder top.Anchored = true
    top.Size = Vector3.new(0.5, 2, 2)
    top.CFrame = stone.CFrame * CFrame.new(0, h / 2, 0) * CFrame.Angles(0, 0, math.rad(90))
    top.Material = Enum.Material.Concrete top.Color = stoneColor top.Parent = m
  end

  -- Mausoleum (small stone building)
  local maus = Instance.new("Part") maus.Anchored = true
  maus.Size = Vector3.new(8, 8, 8) maus.CFrame = CFrame.new(pos + Vector3.new(15, 4, 10))
  maus.Material = Enum.Material.Marble maus.Color = Color3.fromRGB(180, 175, 165) maus.Parent = m
  -- Columns
  for _, sx in ipairs({-3, 3}) do
    local col = Instance.new("Part") col.Shape = Enum.PartType.Cylinder col.Anchored = true
    col.Size = Vector3.new(7, 1, 1)
    col.CFrame = CFrame.new(pos + Vector3.new(15 + sx, 3.5, 5.5)) * CFrame.Angles(0, 0, math.rad(90))
    col.Material = Enum.Material.Marble col.Color = Color3.fromRGB(190, 185, 175) col.Parent = m
  end

  -- Dead trees (bare branches)
  for _, treePos in ipairs({Vector3.new(-18, 0, 15), Vector3.new(20, 0, -12)}) do
    local trunk = Instance.new("Part") trunk.Shape = Enum.PartType.Cylinder trunk.Anchored = true
    trunk.Size = Vector3.new(12, 1.5, 1.5)
    trunk.CFrame = CFrame.new(pos + treePos + Vector3.new(0, 6, 0))
      * CFrame.Angles(0, 0, math.rad(90)) * CFrame.Angles(math.rad(math.random(-5, 5)), 0, 0)
    trunk.Material = Enum.Material.Wood trunk.Color = Color3.fromRGB(50, 35, 20) trunk.Parent = m
    -- Bare branches
    for b = 1, 3 do
      local branch = Instance.new("Part") branch.Anchored = true
      branch.Size = Vector3.new(0.4, 4, 0.4)
      branch.CFrame = CFrame.new(pos + treePos + Vector3.new(math.random(-2, 2), 8 + b, math.random(-2, 2)))
        * CFrame.Angles(math.rad(math.random(-40, 40)), 0, math.rad(math.random(-40, 40)))
      branch.Material = Enum.Material.Wood branch.Color = Color3.fromRGB(45, 30, 18) branch.Parent = m
    end
  end

  -- Iron fence (perimeter)
  for x = -24, 24, 3 do
    local post = Instance.new("Part") post.Anchored = true
    post.Size = Vector3.new(0.3, 5, 0.3) post.CFrame = CFrame.new(pos + Vector3.new(x, 2.75, -24))
    post.Material = Enum.Material.Metal post.Color = Color3.fromRGB(30, 30, 35) post.Parent = m
    -- Pointed top
    local point = Instance.new("WedgePart") point.Anchored = true
    point.Size = Vector3.new(0.3, 0.8, 0.3) point.CFrame = CFrame.new(pos + Vector3.new(x, 5.65, -24))
    point.Material = Enum.Material.Metal point.Color = Color3.fromRGB(30, 30, 35) point.Parent = m
  end

  m.Parent = parent or workspace return m
end`,
    pitfalls: [
      'Headstones perfectly aligned looks wrong — add slight rotation variation',
      'Dead trees should have NO leaves — just bare wood branches',
      'Iron fence needs pointed tops (WedgePart) — flat-topped fence is not spooky',
      'Ground should be dark (Ground material with brown tones) not green grass',
      'Add fog via Atmosphere (high Density, low visibility) for horror feel',
    ],
  },

  // ── GAME MECHANIC PATTERNS ────────────────────────────────────────────────

  {
    name: 'Dialogue System (Typewriter + Choices)',
    keywords: ['dialogue', 'dialog', 'npc talk', 'typewriter', 'conversation', 'choices', 'branching', 'text', 'quest giver'],
    snippet: `-- DIALOGUE SYSTEM (typewriter effect + player choices)
-- CLIENT-SIDE (LocalScript in StarterPlayerScripts)

local TweenService = game:GetService("TweenService")
local Players = game:GetService("Players")
local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

-- Create dialogue UI
local function createDialogueUI()
  local sg = Instance.new("ScreenGui") sg.Name = "DialogueUI" sg.Parent = playerGui
  local bg = Instance.new("Frame") bg.Size = UDim2.new(0.6, 0, 0.25, 0)
  bg.Position = UDim2.new(0.2, 0, 0.7, 0) bg.BackgroundColor3 = Color3.fromRGB(15, 18, 25)
  bg.Parent = sg Instance.new("UICorner", bg).CornerRadius = UDim.new(0, 12)
  local nameLabel = Instance.new("TextLabel") nameLabel.Name = "NameLabel"
  nameLabel.Size = UDim2.new(0.3, 0, 0.2, 0) nameLabel.Position = UDim2.new(0.05, 0, 0.05, 0)
  nameLabel.BackgroundTransparency = 1 nameLabel.TextColor3 = Color3.fromRGB(212, 175, 55)
  nameLabel.Font = Enum.Font.GothamBold nameLabel.TextSize = 18 nameLabel.TextXAlignment = Enum.TextXAlignment.Left
  nameLabel.Parent = bg
  local textLabel = Instance.new("TextLabel") textLabel.Name = "TextLabel"
  textLabel.Size = UDim2.new(0.9, 0, 0.5, 0) textLabel.Position = UDim2.new(0.05, 0, 0.3, 0)
  textLabel.BackgroundTransparency = 1 textLabel.TextColor3 = Color3.fromRGB(220, 220, 225)
  textLabel.Font = Enum.Font.GothamMedium textLabel.TextSize = 16
  textLabel.TextWrapped = true textLabel.TextXAlignment = Enum.TextXAlignment.Left
  textLabel.TextYAlignment = Enum.TextYAlignment.Top textLabel.Parent = bg
  return sg, bg
end

-- Typewriter effect
local function typewrite(label: TextLabel, text: string, speed: number?)
  label.Text = ""
  local rate = speed or 0.03
  for i = 1, #text do
    label.Text = string.sub(text, 1, i)
    task.wait(rate)
  end
end

-- Show dialogue with choices
local function showDialogue(npcName: string, text: string, choices: {{label: string, callback: () -> ()}}?)
  local sg, bg = createDialogueUI()
  bg.NameLabel.Text = npcName
  typewrite(bg.TextLabel, text)

  if choices then
    local choiceFrame = Instance.new("Frame") choiceFrame.Size = UDim2.new(0.9, 0, 0.2, 0)
    choiceFrame.Position = UDim2.new(0.05, 0, 0.8, 0) choiceFrame.BackgroundTransparency = 1
    choiceFrame.Parent = bg
    local layout = Instance.new("UIListLayout") layout.FillDirection = Enum.FillDirection.Horizontal
    layout.Padding = UDim.new(0, 8) layout.Parent = choiceFrame
    for _, choice in choices do
      local btn = Instance.new("TextButton")
      btn.Size = UDim2.new(0, 120, 1, 0) btn.Text = choice.label
      btn.BackgroundColor3 = Color3.fromRGB(40, 45, 55)
      btn.TextColor3 = Color3.fromRGB(212, 175, 55)
      btn.Font = Enum.Font.GothamBold btn.TextSize = 14 btn.Parent = choiceFrame
      Instance.new("UICorner", btn).CornerRadius = UDim.new(0, 8)
      btn.Activated:Connect(function()
        sg:Destroy()
        choice.callback()
      end)
    end
  end

  return sg
end`,
    pitfalls: [
      'Typewriter without variable speed feels robotic — speed up for common words',
      'Not destroying old dialogue UI before showing new one (stacking GUIs)',
      'Choices should be buttons with Activated, not TextLabels (not clickable)',
      'NPC name label helps players track who they are talking to — never skip it',
      'Quest choices should fire RemoteEvent to server — never handle rewards on client',
    ],
  },

  {
    name: 'Crafting System',
    keywords: ['crafting', 'craft', 'recipe', 'ingredient', 'workbench', 'forge', 'combine', 'create item'],
    snippet: `-- CRAFTING SYSTEM (recipes, ingredients, server validation)
-- SERVER SCRIPT

-- Recipe definitions
local RECIPES = {
  IronSword = {
    ingredients = { IronOre = 3, WoodPlank = 1 },
    result = "IronSword",
    quantity = 1,
    craftTime = 2, -- seconds
  },
  HealthPotion = {
    ingredients = { RedHerb = 2, Water = 1 },
    result = "HealthPotion",
    quantity = 3,
    craftTime = 1,
  },
  DiamondPickaxe = {
    ingredients = { Diamond = 3, IronBar = 2, WoodPlank = 2 },
    result = "DiamondPickaxe",
    quantity = 1,
    craftTime = 5,
  },
}

-- Check if player has all ingredients (server-side)
local function canCraft(playerInventory: {[string]: number}, recipeId: string): boolean
  local recipe = RECIPES[recipeId]
  if not recipe then return false end
  for ingredient, needed in pairs(recipe.ingredients) do
    if (playerInventory[ingredient] or 0) < needed then
      return false
    end
  end
  return true
end

-- Execute craft (server-side)
local function craft(player: Player, recipeId: string)
  local recipe = RECIPES[recipeId]
  if not recipe then return false, "Invalid recipe" end
  local inv = getInventory(player) -- Your inventory getter
  if not canCraft(inv, recipeId) then return false, "Missing ingredients" end

  -- Remove ingredients
  for ingredient, needed in pairs(recipe.ingredients) do
    inv[ingredient] -= needed
  end

  -- Craft delay (optional — show progress bar on client)
  task.wait(recipe.craftTime)

  -- Add result
  inv[recipe.result] = (inv[recipe.result] or 0) + recipe.quantity
  return true, recipe.result
end

-- Remote handler
local CraftRemote = game.ReplicatedStorage.Remotes.Craft
CraftRemote.OnServerEvent:Connect(function(player, recipeId)
  if typeof(recipeId) ~= "string" then return end
  local success, result = craft(player, recipeId)
  CraftRemote:FireClient(player, success, result)
end)`,
    pitfalls: [
      'Client-side ingredient checking (exploiter crafts without materials)',
      'Not validating recipe ID type (string check before table lookup)',
      'Removing ingredients before checking ALL are available (partial removal)',
      'No cooldown on craft requests (spam crafting)',
      'Craft results should be defined server-side — never let client specify output',
    ],
  },

  {
    name: 'Fishing Mechanic',
    keywords: ['fishing', 'fish', 'cast', 'reel', 'rod', 'fishing rod', 'catch', 'bait', 'water', 'pond'],
    snippet: `-- FISHING MECHANIC (cast, wait, reel, rarity table)
-- SERVER SCRIPT

local FISH_TABLE = {
  {name = "Sardine", rarity = "Common", weight = 50, value = 5},
  {name = "Bass", rarity = "Common", weight = 30, value = 10},
  {name = "Salmon", rarity = "Uncommon", weight = 12, value = 25},
  {name = "Swordfish", rarity = "Rare", weight = 5, value = 100},
  {name = "Golden Koi", rarity = "Legendary", weight = 2.5, value = 500},
  {name = "Ancient Leviathan", rarity = "Mythic", weight = 0.5, value = 5000},
}

local function rollFish(luckBonus: number?): typeof(FISH_TABLE[1])
  local totalWeight = 0
  for _, fish in FISH_TABLE do
    local w = fish.weight
    if fish.rarity ~= "Common" then w *= (1 + (luckBonus or 0)) end
    totalWeight += w
  end
  local roll = math.random() * totalWeight
  for _, fish in FISH_TABLE do
    local w = fish.weight
    if fish.rarity ~= "Common" then w *= (1 + (luckBonus or 0)) end
    roll -= w
    if roll <= 0 then return fish end
  end
  return FISH_TABLE[1] -- Fallback
end

-- Fishing state machine (per player)
local fishingPlayers = {} -- [userId] = {state, startTime, ...}

local function startFishing(player: Player)
  if fishingPlayers[player.UserId] then return end
  fishingPlayers[player.UserId] = {
    state = "casting",
    startTime = tick(),
  }
  -- Casting animation (client-side via remote)
  -- After cast, wait random time for bite
  local waitTime = math.random(3, 8) -- 3-8 seconds
  task.delay(waitTime, function()
    local session = fishingPlayers[player.UserId]
    if not session or session.state ~= "casting" then return end
    session.state = "bite"
    -- Notify client: fish is biting! Show reel prompt
    game.ReplicatedStorage.Remotes.FishBite:FireClient(player)
    -- Player has 3 seconds to reel
    task.delay(3, function()
      if fishingPlayers[player.UserId] and fishingPlayers[player.UserId].state == "bite" then
        fishingPlayers[player.UserId] = nil -- Fish got away
        game.ReplicatedStorage.Remotes.FishEscaped:FireClient(player)
      end
    end)
  end)
end

local function reelIn(player: Player)
  local session = fishingPlayers[player.UserId]
  if not session or session.state ~= "bite" then return end
  fishingPlayers[player.UserId] = nil
  local fish = rollFish(0)
  -- Add to inventory, notify client
  game.ReplicatedStorage.Remotes.FishCaught:FireClient(player, fish.name, fish.rarity, fish.value)
end`,
    pitfalls: [
      'Fish rarity rolls on client (exploiter gets Mythic every time)',
      'No state machine — player can reel without casting first',
      'Missing timeout on bite (fish should escape if player is AFK)',
      'Wait time too short (< 3s) makes fishing feel like clicking, not relaxing',
      'Luck multiplier applied to Common fish makes them MORE common (only boost rares)',
    ],
  },

  {
    name: 'Mining Mechanic',
    keywords: ['mining', 'mine', 'ore', 'pickaxe', 'break', 'rock', 'resource', 'gather', 'hit', 'mine rock'],
    snippet: `-- MINING MECHANIC (breakable rocks, ore tiers, pickaxe upgrades)
-- SERVER SCRIPT

-- Ore configuration
local ORE_TYPES = {
  Stone = {health = 5, drops = "Stone", value = 1, color = Color3.fromRGB(130, 125, 120)},
  Iron = {health = 10, drops = "IronOre", value = 5, color = Color3.fromRGB(180, 160, 140)},
  Gold = {health = 15, drops = "GoldOre", value = 25, color = Color3.fromRGB(220, 190, 50)},
  Diamond = {health = 25, drops = "Diamond", value = 100, color = Color3.fromRGB(100, 200, 255)},
  Mythril = {health = 50, drops = "Mythril", value = 500, color = Color3.fromRGB(180, 100, 255)},
}

-- Pickaxe tiers (damage per hit)
local PICKAXES = {
  Wooden = {damage = 1, canMine = {"Stone"}},
  Iron = {damage = 2, canMine = {"Stone", "Iron"}},
  Gold = {damage = 3, canMine = {"Stone", "Iron", "Gold"}},
  Diamond = {damage = 5, canMine = {"Stone", "Iron", "Gold", "Diamond"}},
  Mythril = {damage = 10, canMine = {"Stone", "Iron", "Gold", "Diamond", "Mythril"}},
}

-- Rock health tracking
local rockHealth = {} -- [rock instance] = remaining health

local function mineRock(player: Player, rock: BasePart)
  local oreType = rock:GetAttribute("OreType") or "Stone"
  local ore = ORE_TYPES[oreType]
  if not ore then return end

  -- Check pickaxe can mine this type
  local pickaxe = getPlayerPickaxe(player) -- Your function
  local pickData = PICKAXES[pickaxe]
  if not table.find(pickData.canMine, oreType) then
    -- Pickaxe too weak! Notify client
    return
  end

  -- Initialize health
  if not rockHealth[rock] then
    rockHealth[rock] = ore.health
  end

  -- Apply damage
  rockHealth[rock] -= pickData.damage

  -- Visual feedback: shake + shrink
  game.ReplicatedStorage.Remotes.MineHit:FireClient(player, rock)

  if rockHealth[rock] <= 0 then
    -- Drop ore
    addToInventory(player, ore.drops, 1)
    -- Respawn rock after delay
    rock.Transparency = 1
    rock.CanCollide = false
    rockHealth[rock] = nil
    task.delay(math.random(15, 30), function()
      if rock.Parent then
        rock.Transparency = 0
        rock.CanCollide = true
      end
    end)
  end
end`,
    pitfalls: [
      'Client-side health tracking (exploiter one-hits everything)',
      'No pickaxe tier check (player mines Diamond with Wooden pickaxe)',
      'Rocks that never respawn (always add respawn timer)',
      'No visual feedback on hit (players think click is not registering)',
      'Mining speed not affected by pickaxe tier feels unrewarding to upgrade',
    ],
  },

  {
    name: 'Building / Placement System',
    keywords: ['building', 'placement', 'place', 'grid snap', 'build system', 'ghost preview', 'construction', 'basebuilding'],
    snippet: `-- BUILDING / PLACEMENT SYSTEM (grid snap, ghost preview, validation)
-- CLIENT: Preview + placement request
-- SERVER: Validation + actual placement

-- CLIENT SCRIPT:
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local UserInputService = game:GetService("UserInputService")
local player = Players.LocalPlayer
local mouse = player:GetMouse()

local GRID_SIZE = 4 -- Snap to 4-stud grid
local ghostModel = nil -- Preview model (transparent)

local function snapToGrid(position: Vector3): Vector3
  return Vector3.new(
    math.round(position.X / GRID_SIZE) * GRID_SIZE,
    math.round(position.Y / GRID_SIZE) * GRID_SIZE,
    math.round(position.Z / GRID_SIZE) * GRID_SIZE
  )
end

-- Create ghost preview
local function startPlacement(templateName: string)
  local template = game.ReplicatedStorage.Buildings:FindFirstChild(templateName)
  if not template then return end
  ghostModel = template:Clone()
  -- Make transparent
  for _, part in ghostModel:GetDescendants() do
    if part:IsA("BasePart") then
      part.Transparency = 0.5
      part.CanCollide = false
      part.Anchored = true
    end
  end
  ghostModel.Parent = workspace

  -- Update position every frame
  local conn
  conn = RunService.RenderStepped:Connect(function()
    if not ghostModel then conn:Disconnect() return end
    local target = mouse.Hit.Position
    local snapped = snapToGrid(target)
    ghostModel:PivotTo(CFrame.new(snapped))
    -- Color: green if valid, red if blocked
    local canPlace = checkPlacement(snapped, ghostModel)
    for _, part in ghostModel:GetDescendants() do
      if part:IsA("BasePart") then
        part.Color = canPlace and Color3.fromRGB(0, 200, 0) or Color3.fromRGB(200, 0, 0)
      end
    end
  end)
end

-- Place on click
local function confirmPlacement()
  if not ghostModel then return end
  local position = ghostModel:GetPivot().Position
  -- Send to server for validation
  game.ReplicatedStorage.Remotes.PlaceBuilding:FireServer(ghostModel.Name, position)
  ghostModel:Destroy()
  ghostModel = nil
end

-- SERVER: Validate and place
local PlaceRemote = game.ReplicatedStorage.Remotes.PlaceBuilding
PlaceRemote.OnServerEvent:Connect(function(player, buildingName, position)
  if typeof(buildingName) ~= "string" then return end
  if typeof(position) ~= "Vector3" then return end
  -- Validate: within build zone, not overlapping, player owns plot
  local snapped = snapToGrid(position)
  -- Check collision with existing buildings
  local template = game.ServerStorage.Buildings:FindFirstChild(buildingName)
  if not template then return end
  local building = template:Clone()
  building:PivotTo(CFrame.new(snapped))
  building.Parent = workspace
end)`,
    pitfalls: [
      'Client-side placement without server validation (exploiter places anywhere)',
      'No grid snapping makes buildings misaligned and messy',
      'Ghost preview without color feedback (green/red) leaves player guessing',
      'Not checking collision with existing buildings (overlapping structures)',
      'Server must validate position is within player build zone',
    ],
  },

  {
    name: 'Daily Login Reward System',
    keywords: ['daily', 'login', 'reward', 'streak', 'calendar', 'claim', 'daily reward', 'consecutive', 'bonus'],
    snippet: `-- DAILY LOGIN REWARD (streak tracking, escalating rewards)
-- SERVER SCRIPT

local DataStoreService = game:GetService("DataStoreService")
local store = DataStoreService:GetDataStore("DailyRewards_v1")

local REWARDS = {
  {day = 1, type = "Coins", amount = 100},
  {day = 2, type = "Coins", amount = 200},
  {day = 3, type = "Gems", amount = 5},
  {day = 4, type = "Coins", amount = 500},
  {day = 5, type = "Item", item = "RareEgg"},
  {day = 6, type = "Coins", amount = 1000},
  {day = 7, type = "Item", item = "LegendaryEgg"}, -- Big reward at end of week
}

local function checkDailyReward(player: Player)
  local key = "Daily_" .. player.UserId
  local success, data = pcall(function()
    return store:GetAsync(key)
  end)
  if not success then return nil end

  data = data or {lastClaim = 0, streak = 0}
  local now = os.time()
  local lastClaim = data.lastClaim
  local hoursSince = (now - lastClaim) / 3600

  if hoursSince < 20 then
    -- Already claimed today (20h cooldown prevents timezone abuse)
    return nil
  end

  -- Check streak
  if hoursSince > 48 then
    -- Missed a day — reset streak (with 1 day grace period)
    data.streak = 0
  end

  data.streak += 1
  if data.streak > 7 then data.streak = 1 end -- Loop back
  data.lastClaim = now

  -- Save
  pcall(function()
    store:SetAsync(key, data)
  end)

  -- Return today's reward
  return REWARDS[data.streak]
end

-- On player join, check if reward is available
game.Players.PlayerAdded:Connect(function(player)
  task.wait(2) -- Let player load in
  local reward = checkDailyReward(player)
  if reward then
    -- Grant reward
    if reward.type == "Coins" then
      addCoins(player, reward.amount)
    elseif reward.type == "Gems" then
      addGems(player, reward.amount)
    elseif reward.type == "Item" then
      addItem(player, reward.item)
    end
    -- Show reward UI to client
    game.ReplicatedStorage.Remotes.DailyReward:FireClient(player, reward)
  end
end)`,
    pitfalls: [
      'Using 24h exactly for cooldown — timezone differences cause missed days (use 20h)',
      'Streak resets on ANY miss — add 48h grace period or players get frustrated',
      'Not saving immediately after claiming (data loss if server crashes)',
      'Client-side reward granting (exploiter claims infinite rewards)',
      'Day 7 reward not significantly better than Day 1 (no incentive to maintain streak)',
    ],
  },

  {
    name: 'Achievement / Progress Tracker',
    keywords: ['achievement', 'progress', 'tracker', 'milestone', 'unlock', 'notification', 'badge', 'challenge'],
    snippet: `-- ACHIEVEMENT SYSTEM (progress-based, server-tracked, with notifications)
-- SERVER SCRIPT

-- Achievement definitions
local ACHIEVEMENTS = {
  first_kill = {
    name = "First Blood",
    description = "Defeat your first enemy",
    goal = 1,
    reward = {coins = 50},
  },
  kill_100 = {
    name = "Warrior",
    description = "Defeat 100 enemies",
    goal = 100,
    reward = {coins = 500, title = "Warrior"},
  },
  collect_1000 = {
    name = "Hoarder",
    description = "Collect 1000 items",
    goal = 1000,
    reward = {coins = 1000, item = "GoldenBadge"},
  },
  play_1_hour = {
    name = "Dedicated",
    description = "Play for 1 hour total",
    goal = 3600, -- seconds
    reward = {coins = 200},
  },
}

-- Update achievement progress (server-side)
local function updateProgress(player: Player, achievementId: string, increment: number)
  local achievement = ACHIEVEMENTS[achievementId]
  if not achievement then return end

  local data = getPlayerData(player)
  data.achievements = data.achievements or {}
  local progress = data.achievements[achievementId] or {current = 0, completed = false}

  if progress.completed then return end -- Already done

  progress.current = math.min(progress.current + increment, achievement.goal)
  data.achievements[achievementId] = progress

  if progress.current >= achievement.goal then
    progress.completed = true
    -- Grant rewards
    if achievement.reward.coins then addCoins(player, achievement.reward.coins) end
    if achievement.reward.item then addItem(player, achievement.reward.item) end
    -- Notify client (popup notification)
    game.ReplicatedStorage.Remotes.AchievementUnlocked:FireClient(player, achievement)
    -- Also award Roblox badge if configured
    -- BadgeService:AwardBadge(player.UserId, badgeId)
  else
    -- Send progress update to client (for UI bar)
    game.ReplicatedStorage.Remotes.AchievementProgress:FireClient(
      player, achievementId, progress.current, achievement.goal
    )
  end
end

-- Usage examples:
-- updateProgress(player, "first_kill", 1)  -- On enemy defeat
-- updateProgress(player, "collect_1000", 1) -- On item pickup`,
    pitfalls: [
      'Client-side progress tracking (exploiter completes all achievements)',
      'Not checking if already completed before incrementing (double rewards)',
      'No notification on unlock (player does not know they earned something)',
      'Progress not saved to DataStore (lost on rejoin)',
      'Goals that are too high for casual players (1M kills) — keep achievable',
    ],
  },

  {
    name: 'Minimap System (ViewportFrame)',
    keywords: ['minimap', 'map', 'overhead', 'viewportframe', 'radar', 'navigation', 'compass', 'topdown view'],
    snippet: `-- MINIMAP SYSTEM (overhead camera into ViewportFrame)
-- CLIENT SCRIPT

local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local player = Players.LocalPlayer

-- Create minimap UI
local screenGui = Instance.new("ScreenGui")
screenGui.Name = "Minimap"
screenGui.ResetOnSpawn = false
screenGui.Parent = player:WaitForChild("PlayerGui")

-- Circular minimap frame
local frame = Instance.new("Frame")
frame.Size = UDim2.new(0, 180, 0, 180)
frame.Position = UDim2.new(1, -200, 0, 20)
frame.BackgroundColor3 = Color3.fromRGB(20, 25, 30)
frame.Parent = screenGui
Instance.new("UICorner", frame).CornerRadius = UDim.new(0.5, 0)
local stroke = Instance.new("UIStroke", frame)
stroke.Color = Color3.fromRGB(60, 65, 75) stroke.Thickness = 2

-- ViewportFrame (renders 3D scene)
local viewport = Instance.new("ViewportFrame")
viewport.Size = UDim2.new(1, 0, 1, 0)
viewport.BackgroundTransparency = 1
viewport.Parent = frame
Instance.new("UICorner", viewport).CornerRadius = UDim.new(0.5, 0)

-- Minimap camera (top-down, orthographic-like)
local minimapCamera = Instance.new("Camera")
minimapCamera.CameraType = Enum.CameraType.Scriptable
minimapCamera.FieldOfView = 10 -- Narrow FOV simulates orthographic
minimapCamera.Parent = viewport
viewport.CurrentCamera = minimapCamera

-- Clone static terrain/buildings into viewport
-- Only clone ONCE at startup, update positions of moving objects
local mapClone = workspace:FindFirstChild("StaticMap")
if mapClone then
  mapClone:Clone().Parent = viewport
end

-- Player dot indicator (center of minimap)
local dot = Instance.new("Frame")
dot.Size = UDim2.new(0, 8, 0, 8)
dot.Position = UDim2.new(0.5, -4, 0.5, -4)
dot.BackgroundColor3 = Color3.fromRGB(0, 200, 100)
dot.Parent = frame
Instance.new("UICorner", dot).CornerRadius = UDim.new(0.5, 0)

-- Update camera position to follow player
local MAP_HEIGHT = 200
local MAP_SCALE = 100 -- How many studs to show

RunService.RenderStepped:Connect(function()
  local character = player.Character
  if not character then return end
  local rootPart = character:FindFirstChild("HumanoidRootPart")
  if not rootPart then return end
  minimapCamera.CFrame = CFrame.lookAt(
    rootPart.Position + Vector3.new(0, MAP_HEIGHT, 0),
    rootPart.Position
  )
end)`,
    pitfalls: [
      'Cloning entire workspace into ViewportFrame destroys performance — clone only static map',
      'ViewportFrame does NOT render terrain — use colored parts for terrain representation',
      'Camera FOV too wide makes minimap useless — use narrow FOV (10-20) for zoom',
      'Not updating camera position every frame — minimap lags behind player',
      'Too many objects in ViewportFrame = frame rate drop — simplify cloned geometry',
    ],
  },

  {
    name: 'Respawn / Death System',
    keywords: ['respawn', 'death', 'die', 'spectate', 'respawn timer', 'death screen', 'revive', 'knockout'],
    snippet: `-- RESPAWN / DEATH SYSTEM (effects, spectate, timer)
-- SERVER SCRIPT

local Players = game:GetService("Players")

local RESPAWN_TIME = 5 -- seconds
local SPECTATE_ENABLED = true

Players.PlayerAdded:Connect(function(player)
  -- Disable automatic respawn (we handle it manually)
  player.CharacterAutoLoads = false

  player.CharacterAdded:Connect(function(character)
    local humanoid = character:WaitForChild("Humanoid") :: Humanoid

    humanoid.Died:Connect(function()
      -- Notify client to show death screen
      game.ReplicatedStorage.Remotes.PlayerDied:FireClient(player, RESPAWN_TIME)

      -- Find killer (if applicable)
      local tag = humanoid:FindFirstChild("creator") -- Standard Roblox damage tag
      if tag and tag.Value then
        local killerPlayer = tag.Value
        -- Award kill to killer
        updateKills(killerPlayer)
        game.ReplicatedStorage.Remotes.KillFeed:FireAllClients(
          killerPlayer.Name, player.Name
        )
      end

      -- Respawn after delay
      task.wait(RESPAWN_TIME)
      if player.Parent then -- Still in game
        player:LoadCharacter()
      end
    end)
  end)

  -- Initial spawn
  player:LoadCharacter()
end)

-- Standard damage tag (set this when dealing damage):
local function tagHumanoid(humanoid: Humanoid, attacker: Player)
  local tag = humanoid:FindFirstChild("creator")
  if not tag then
    tag = Instance.new("ObjectValue")
    tag.Name = "creator"
    tag.Parent = humanoid
  end
  tag.Value = attacker
  -- Auto-cleanup after 3 seconds (prevent false attribution)
  game.Debris:AddItem(tag, 3)
end`,
    pitfalls: [
      'Not disabling CharacterAutoLoads when using custom respawn logic (double spawn)',
      'Forgetting to call LoadCharacter — player stays dead forever',
      'No "creator" tag means kill attribution is impossible',
      'Debris auto-cleanup on creator tag should be 2-3 seconds (not too long)',
      'Not checking player.Parent before LoadCharacter (player may have left)',
    ],
  },

  {
    name: 'Stamina / Energy System',
    keywords: ['stamina', 'energy', 'sprint', 'drain', 'regen', 'exhaust', 'fatigue', 'run', 'ability cost'],
    snippet: `-- STAMINA / ENERGY SYSTEM (drain on sprint/ability, regen over time)
-- SERVER SCRIPT (authoritative) + CLIENT for UI

-- Config
local MAX_STAMINA = 100
local SPRINT_DRAIN = 15  -- per second while sprinting
local ABILITY_COST = 25  -- per ability use
local REGEN_RATE = 8     -- per second while not draining
local REGEN_DELAY = 1.5  -- seconds after last drain before regen starts

-- Per-player stamina state
local staminaData = {} -- [userId] = {current, lastDrain}

game.Players.PlayerAdded:Connect(function(player)
  staminaData[player.UserId] = {
    current = MAX_STAMINA,
    lastDrain = 0,
  }
end)
game.Players.PlayerRemoving:Connect(function(player)
  staminaData[player.UserId] = nil
end)

-- Update stamina (called from Heartbeat or on action)
local RunService = game:GetService("RunService")
RunService.Heartbeat:Connect(function(dt)
  for _, player in game.Players:GetPlayers() do
    local data = staminaData[player.UserId]
    if not data then continue end

    local now = tick()
    local isSprinting = isPlayerSprinting(player) -- Your sprint check

    if isSprinting and data.current > 0 then
      data.current = math.max(0, data.current - SPRINT_DRAIN * dt)
      data.lastDrain = now
      if data.current <= 0 then
        -- Force stop sprint
        game.ReplicatedStorage.Remotes.StopSprint:FireClient(player)
      end
    elseif now - data.lastDrain >= REGEN_DELAY then
      -- Regenerate
      data.current = math.min(MAX_STAMINA, data.current + REGEN_RATE * dt)
    end

    -- Send to client for UI (throttle to 5 updates/sec)
    game.ReplicatedStorage.Remotes.StaminaUpdate:FireClient(player, data.current, MAX_STAMINA)
  end
end)

-- Ability use
local function useAbility(player: Player): boolean
  local data = staminaData[player.UserId]
  if not data or data.current < ABILITY_COST then return false end
  data.current -= ABILITY_COST
  data.lastDrain = tick()
  return true
end`,
    pitfalls: [
      'Client-side stamina (exploiter has infinite sprint)',
      'No regen delay — stamina refills instantly when you stop sprinting (too easy)',
      'Sending stamina updates every frame wastes network — throttle to 5-10/sec',
      'Not stopping sprint when stamina hits 0 (player runs on empty)',
      'Regen rate too fast makes stamina meaningless — balance with drain rate',
    ],
  },

  {
    name: 'Grappling Hook Mechanic',
    keywords: ['grapple', 'grappling hook', 'hook', 'swing', 'rope', 'pull', 'spider', 'zipline'],
    snippet: `-- GRAPPLING HOOK (raycast target, rope constraint, pull player)
-- LOCAL SCRIPT (visual + input) + SERVER (validation)

local Players = game:GetService("Players")
local UserInputService = game:GetService("UserInputService")
local player = Players.LocalPlayer

local MAX_RANGE = 100
local PULL_SPEED = 80
local COOLDOWN = 2

local lastUse = 0

-- CLIENT: Aim and fire grapple
UserInputService.InputBegan:Connect(function(input, processed)
  if processed then return end
  if input.KeyCode ~= Enum.KeyCode.Q then return end
  if tick() - lastUse < COOLDOWN then return end

  local character = player.Character
  if not character then return end
  local rootPart = character:FindFirstChild("HumanoidRootPart")
  if not rootPart then return end

  -- Raycast from camera through mouse
  local camera = workspace.CurrentCamera
  local mousePos = UserInputService:GetMouseLocation()
  local ray = camera:ViewportPointToRay(mousePos.X, mousePos.Y)
  local params = RaycastParams.new()
  params.FilterDescendantsInstances = {character}

  local result = workspace:Raycast(ray.Origin, ray.Direction * MAX_RANGE, params)
  if not result then return end

  lastUse = tick()

  -- Send grapple request to server
  game.ReplicatedStorage.Remotes.Grapple:FireServer(result.Position)

  -- CLIENT VISUAL: Create rope beam
  local startAtt = Instance.new("Attachment", rootPart)
  local endAtt = Instance.new("Attachment", workspace.Terrain)
  endAtt.WorldPosition = result.Position

  local beam = Instance.new("Beam")
  beam.Attachment0 = startAtt
  beam.Attachment1 = endAtt
  beam.Width0 = 0.15 beam.Width1 = 0.15
  beam.Color = ColorSequence.new(Color3.fromRGB(120, 100, 70))
  beam.FaceCamera = true beam.Parent = rootPart

  -- Auto-cleanup
  game.Debris:AddItem(startAtt, 1.5)
  game.Debris:AddItem(endAtt, 1.5)
  game.Debris:AddItem(beam, 1.5)
end)

-- SERVER: Apply grapple force
local GrappleRemote = game.ReplicatedStorage.Remotes.Grapple
GrappleRemote.OnServerEvent:Connect(function(player, targetPos)
  if typeof(targetPos) ~= "Vector3" then return end
  local character = player.Character
  if not character then return end
  local rootPart = character:FindFirstChild("HumanoidRootPart")
  if not rootPart then return end

  -- Validate distance
  local distance = (targetPos - rootPart.Position).Magnitude
  if distance > MAX_RANGE + 10 then return end -- +10 tolerance

  -- Apply pull force
  local direction = (targetPos - rootPart.Position).Unit
  local velocity = Instance.new("LinearVelocity")
  velocity.Attachment0 = rootPart:FindFirstChildOfClass("Attachment") or Instance.new("Attachment", rootPart)
  velocity.VectorVelocity = direction * PULL_SPEED
  velocity.MaxForce = 50000
  velocity.Parent = rootPart
  game.Debris:AddItem(velocity, 1)
end)`,
    pitfalls: [
      'Client-only grapple force (exploiter flies anywhere — validate on server)',
      'No range validation on server (exploiter sends grapple to distant position)',
      'LinearVelocity without Debris cleanup = player flies forever',
      'Missing visual rope/beam makes grapple feel disconnected',
      'Cooldown only on client (exploiter bypasses — add server cooldown too)',
    ],
  },

  // ── UI / VISUAL PATTERNS ──────────────────────────────────────────────────

  {
    name: 'Damage Numbers (Floating Text)',
    keywords: ['damage', 'damage number', 'floating text', 'hit marker', 'combat text', 'critical', 'heal number'],
    snippet: `-- DAMAGE NUMBERS (floating, colored by type, fade out)
-- CLIENT SCRIPT

local TweenService = game:GetService("TweenService")

local COLORS = {
  Normal = Color3.fromRGB(255, 255, 255),
  Critical = Color3.fromRGB(255, 50, 50),
  Heal = Color3.fromRGB(50, 255, 50),
  Shield = Color3.fromRGB(50, 150, 255),
}

local function showDamageNumber(position: Vector3, amount: number, damageType: string?)
  local color = COLORS[damageType or "Normal"] or COLORS.Normal
  local isCrit = damageType == "Critical"

  -- BillboardGui attached to a temp part
  local part = Instance.new("Part")
  part.Anchored = true part.CanCollide = false part.Transparency = 1
  part.Size = Vector3.new(0.1, 0.1, 0.1)
  part.Position = position + Vector3.new(math.random(-2, 2), 2, math.random(-2, 2))
  part.Parent = workspace

  local billboard = Instance.new("BillboardGui")
  billboard.Size = UDim2.new(0, isCrit and 120 or 80, 0, isCrit and 60 or 40)
  billboard.StudsOffset = Vector3.new(0, 0, 0)
  billboard.AlwaysOnTop = true
  billboard.Parent = part

  local label = Instance.new("TextLabel")
  label.Size = UDim2.new(1, 0, 1, 0)
  label.BackgroundTransparency = 1
  label.Text = (isCrit and "CRIT! " or "") .. tostring(math.floor(amount))
  label.TextColor3 = color
  label.TextStrokeColor3 = Color3.new(0, 0, 0)
  label.TextStrokeTransparency = 0.3
  label.Font = isCrit and Enum.Font.GothamBlack or Enum.Font.GothamBold
  label.TextSize = isCrit and 28 or 20
  label.TextScaled = false
  label.Parent = billboard

  -- Animate: float up + scale + fade
  local startScale = isCrit and 1.5 or 1
  local uiScale = Instance.new("UIScale") uiScale.Scale = startScale uiScale.Parent = label

  -- Pop effect for crits
  if isCrit then
    TweenService:Create(uiScale, TweenInfo.new(0.15, Enum.EasingStyle.Back), {Scale = 1}):Play()
  end

  -- Float up
  TweenService:Create(part, TweenInfo.new(1, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), {
    Position = part.Position + Vector3.new(0, 4, 0)
  }):Play()

  -- Fade out
  task.delay(0.5, function()
    TweenService:Create(label, TweenInfo.new(0.5), {TextTransparency = 1, TextStrokeTransparency = 1}):Play()
  end)

  -- Cleanup
  game.Debris:AddItem(part, 1.5)
end`,
    pitfalls: [
      'Not using AlwaysOnTop — damage numbers hidden behind objects',
      'Missing TextStroke — numbers unreadable against bright backgrounds',
      'All same color — critical hits should be RED and BIGGER',
      'Not offsetting X position randomly — numbers stack on top of each other',
      'Billboard Size too small on high-resolution screens — test on multiple devices',
    ],
  },

  {
    name: 'Screen Shake Effect',
    keywords: ['screen shake', 'camera shake', 'impact', 'explosion effect', 'rumble', 'earthquake', 'shake'],
    snippet: `-- SCREEN SHAKE (camera offset + rotation, intensity decay)
-- CLIENT SCRIPT

local RunService = game:GetService("RunService")
local camera = workspace.CurrentCamera

local shakeIntensity = 0
local shakeDuration = 0
local shakeStartTime = 0

local function startShake(intensity: number, duration: number)
  shakeIntensity = intensity
  shakeDuration = duration
  shakeStartTime = tick()
end

-- Apply shake every frame
local shakeConnection
shakeConnection = RunService.RenderStepped:Connect(function()
  if shakeIntensity <= 0 then return end

  local elapsed = tick() - shakeStartTime
  if elapsed >= shakeDuration then
    shakeIntensity = 0
    return
  end

  -- Decay intensity over time
  local progress = elapsed / shakeDuration
  local currentIntensity = shakeIntensity * (1 - progress)

  -- Random offset + rotation
  local offsetX = (math.random() - 0.5) * 2 * currentIntensity
  local offsetY = (math.random() - 0.5) * 2 * currentIntensity
  local rotZ = (math.random() - 0.5) * math.rad(currentIntensity * 2)

  camera.CFrame = camera.CFrame
    * CFrame.new(offsetX, offsetY, 0)
    * CFrame.Angles(0, 0, rotZ)
end)

-- Usage:
-- startShake(2, 0.5)   -- Weapon fire (subtle)
-- startShake(5, 1.0)   -- Explosion (medium)
-- startShake(10, 1.5)  -- Earthquake (intense)`,
    pitfalls: [
      'Not decaying intensity — shake goes on forever at full strength',
      'Shake too intense causes nausea — cap at 10 intensity maximum',
      'Modifying camera.CFrame fights with default Roblox camera — apply as offset',
      'No way to cancel shake mid-play (add a stopShake function)',
      'Using wait() instead of RenderStepped — shake is jittery and slow',
    ],
  },

  {
    name: 'Cinematic Bars Effect',
    keywords: ['cinematic', 'letterbox', 'black bars', 'cutscene', 'widescreen', 'bars', 'movie', 'film'],
    snippet: `-- CINEMATIC BARS (top/bottom black bars tween in/out)
-- CLIENT SCRIPT

local TweenService = game:GetService("TweenService")
local Players = game:GetService("Players")
local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

local BAR_HEIGHT = 0.12 -- 12% of screen height

local function createCinematicBars()
  local sg = Instance.new("ScreenGui") sg.Name = "CinematicBars"
  sg.IgnoreGuiInset = true sg.DisplayOrder = 100
  sg.ResetOnSpawn = false sg.Parent = playerGui

  local topBar = Instance.new("Frame")
  topBar.Size = UDim2.new(1, 0, BAR_HEIGHT, 0)
  topBar.Position = UDim2.new(0, 0, -BAR_HEIGHT, 0) -- Start off-screen
  topBar.BackgroundColor3 = Color3.new(0, 0, 0)
  topBar.BorderSizePixel = 0 topBar.Parent = sg

  local bottomBar = Instance.new("Frame")
  bottomBar.Size = UDim2.new(1, 0, BAR_HEIGHT, 0)
  bottomBar.Position = UDim2.new(0, 0, 1, 0) -- Start off-screen
  bottomBar.BackgroundColor3 = Color3.new(0, 0, 0)
  bottomBar.BorderSizePixel = 0 bottomBar.Parent = sg

  return sg, topBar, bottomBar
end

-- Show cinematic bars (slide in)
local function showBars(duration: number?)
  local sg, topBar, bottomBar = createCinematicBars()
  local d = duration or 0.5
  TweenService:Create(topBar, TweenInfo.new(d, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), {
    Position = UDim2.new(0, 0, 0, 0)
  }):Play()
  TweenService:Create(bottomBar, TweenInfo.new(d, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), {
    Position = UDim2.new(0, 0, 1 - BAR_HEIGHT, 0)
  }):Play()
  return sg
end

-- Hide cinematic bars (slide out)
local function hideBars(sg: ScreenGui, duration: number?)
  local d = duration or 0.5
  local topBar = sg:FindFirstChild("Frame")
  for _, bar in sg:GetChildren() do
    if not bar:IsA("Frame") then continue end
    local targetY = bar.Position.Y.Scale < 0.5 and -BAR_HEIGHT or 1
    TweenService:Create(bar, TweenInfo.new(d, Enum.EasingStyle.Quad, Enum.EasingDirection.In), {
      Position = UDim2.new(0, 0, targetY, 0)
    }):Play()
  end
  task.delay(d, function() sg:Destroy() end)
end`,
    pitfalls: [
      'IgnoreGuiInset must be true — otherwise bars do not reach screen edges',
      'DisplayOrder too low — other GUIs render on top of bars',
      'Bars too thick (>15%) block important UI elements',
      'Not destroying after hide — orphaned ScreenGuis accumulate',
      'Missing ResetOnSpawn = false — bars vanish on death during cutscene',
    ],
  },

  {
    name: 'Nameplate / Health Bar Above Head',
    keywords: ['nameplate', 'nametag', 'health bar', 'overhead', 'head', 'billboard', 'display name', 'boss health'],
    snippet: `-- NAMEPLATE WITH HEALTH BAR (BillboardGui above character head)
-- SERVER or CLIENT SCRIPT

local function createNameplate(character: Model, displayName: string, maxHealth: number)
  local head = character:WaitForChild("Head")

  local billboard = Instance.new("BillboardGui")
  billboard.Name = "Nameplate"
  billboard.Size = UDim2.new(0, 200, 0, 50)
  billboard.StudsOffset = Vector3.new(0, 2.5, 0) -- Above head
  billboard.AlwaysOnTop = false
  billboard.MaxDistance = 50 -- Hide beyond 50 studs
  billboard.Parent = head

  -- Name label
  local nameLabel = Instance.new("TextLabel")
  nameLabel.Size = UDim2.new(1, 0, 0.5, 0)
  nameLabel.BackgroundTransparency = 1
  nameLabel.Text = displayName
  nameLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
  nameLabel.TextStrokeTransparency = 0.5
  nameLabel.Font = Enum.Font.GothamBold
  nameLabel.TextSize = 14
  nameLabel.Parent = billboard

  -- Health bar background
  local barBg = Instance.new("Frame")
  barBg.Size = UDim2.new(0.8, 0, 0.15, 0)
  barBg.Position = UDim2.new(0.1, 0, 0.55, 0)
  barBg.BackgroundColor3 = Color3.fromRGB(40, 40, 40)
  barBg.Parent = billboard
  Instance.new("UICorner", barBg).CornerRadius = UDim.new(0.5, 0)

  -- Health bar fill
  local barFill = Instance.new("Frame")
  barFill.Name = "Fill"
  barFill.Size = UDim2.new(1, 0, 1, 0)
  barFill.BackgroundColor3 = Color3.fromRGB(50, 200, 50)
  barFill.Parent = barBg
  Instance.new("UICorner", barFill).CornerRadius = UDim.new(0.5, 0)

  -- Update health bar when Humanoid health changes
  local humanoid = character:WaitForChild("Humanoid") :: Humanoid
  humanoid:GetPropertyChangedSignal("Health"):Connect(function()
    local ratio = humanoid.Health / humanoid.MaxHealth
    barFill.Size = UDim2.new(math.clamp(ratio, 0, 1), 0, 1, 0)
    -- Color: green → yellow → red
    if ratio > 0.5 then
      barFill.BackgroundColor3 = Color3.fromRGB(50, 200, 50)
    elseif ratio > 0.25 then
      barFill.BackgroundColor3 = Color3.fromRGB(255, 200, 0)
    else
      barFill.BackgroundColor3 = Color3.fromRGB(255, 50, 50)
    end
  end)

  return billboard
end`,
    pitfalls: [
      'AlwaysOnTop = true makes nameplates visible through walls (usually bad)',
      'No MaxDistance — nameplates render across entire map (performance waste)',
      'Health bar not clamped to 0-1 range (can overshoot or underflow)',
      'Fixed color health bar (green→yellow→red transition is more readable)',
      'StudsOffset too low — nameplate clips into character head',
    ],
  },

  {
    name: 'Cooldown Indicator (Ability Icon)',
    keywords: ['cooldown', 'ability', 'icon', 'timer', 'wipe', 'fill', 'skill cooldown', 'action bar'],
    snippet: `-- COOLDOWN INDICATOR (circular wipe on ability icon)
-- CLIENT SCRIPT

local TweenService = game:GetService("TweenService")

local function createAbilityIcon(parent: Frame, iconId: string, cooldownTime: number)
  local container = Instance.new("Frame")
  container.Size = UDim2.new(0, 64, 0, 64)
  container.BackgroundTransparency = 1
  container.Parent = parent

  -- Icon image
  local icon = Instance.new("ImageLabel")
  icon.Size = UDim2.new(1, 0, 1, 0)
  icon.Image = iconId
  icon.BackgroundColor3 = Color3.fromRGB(30, 35, 40)
  icon.Parent = container
  Instance.new("UICorner", icon).CornerRadius = UDim.new(0.15, 0)

  -- Cooldown overlay (dark semi-transparent)
  local overlay = Instance.new("Frame")
  overlay.Name = "CooldownOverlay"
  overlay.Size = UDim2.new(1, 0, 0, 0) -- 0 height = ready
  overlay.Position = UDim2.new(0, 0, 0, 0)
  overlay.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
  overlay.BackgroundTransparency = 0.5
  overlay.ZIndex = 2
  overlay.Parent = container
  Instance.new("UICorner", overlay).CornerRadius = UDim.new(0.15, 0)

  -- Cooldown text
  local cdText = Instance.new("TextLabel")
  cdText.Name = "CooldownText"
  cdText.Size = UDim2.new(1, 0, 1, 0)
  cdText.BackgroundTransparency = 1
  cdText.TextColor3 = Color3.fromRGB(255, 255, 255)
  cdText.TextStrokeTransparency = 0.3
  cdText.Font = Enum.Font.GothamBold cdText.TextSize = 20
  cdText.Text = "" cdText.ZIndex = 3
  cdText.Parent = container

  -- Start cooldown function
  local function startCooldown()
    overlay.Size = UDim2.new(1, 0, 1, 0) -- Full overlay = on cooldown
    icon.ImageTransparency = 0.5

    -- Animate overlay shrinking from bottom to top
    TweenService:Create(overlay, TweenInfo.new(cooldownTime, Enum.EasingStyle.Linear), {
      Size = UDim2.new(1, 0, 0, 0)
    }):Play()

    -- Update countdown text
    task.spawn(function()
      local remaining = cooldownTime
      while remaining > 0 do
        cdText.Text = tostring(math.ceil(remaining))
        task.wait(0.1)
        remaining -= 0.1
      end
      cdText.Text = ""
      icon.ImageTransparency = 0
    end)
  end

  return container, startCooldown
end`,
    pitfalls: [
      'Using circular wipe without proper UIGradient is complex — simple top-down fill works',
      'Not showing remaining time text (player cannot judge if 1s or 10s left)',
      'Cooldown only visual on client — server must enforce actual cooldown',
      'Icon not dimmed during cooldown (player thinks ability is ready)',
      'Multiple concurrent cooldowns overwriting same overlay (use per-ability state)',
    ],
  },

  {
    name: 'XP Bar with Level Up Effect',
    keywords: ['xp', 'experience', 'xp bar', 'level up', 'progress bar', 'exp', 'level', 'level indicator'],
    snippet: `-- XP BAR WITH LEVEL UP EFFECT (fill bar, flash, particles on level)
-- CLIENT SCRIPT

local TweenService = game:GetService("TweenService")

local function createXPBar(parent: ScreenGui)
  local container = Instance.new("Frame")
  container.Size = UDim2.new(0.4, 0, 0, 24)
  container.Position = UDim2.new(0.3, 0, 0.95, 0)
  container.AnchorPoint = Vector2.new(0, 0.5)
  container.BackgroundColor3 = Color3.fromRGB(20, 25, 30)
  container.Parent = parent
  Instance.new("UICorner", container).CornerRadius = UDim.new(0.5, 0)
  Instance.new("UIStroke", container).Color = Color3.fromRGB(50, 55, 65)

  -- Fill bar
  local fill = Instance.new("Frame")
  fill.Name = "Fill"
  fill.Size = UDim2.new(0, 0, 1, 0)
  fill.BackgroundColor3 = Color3.fromRGB(100, 200, 255)
  fill.Parent = container
  Instance.new("UICorner", fill).CornerRadius = UDim.new(0.5, 0)

  -- Level label
  local levelLabel = Instance.new("TextLabel")
  levelLabel.Size = UDim2.new(0, 60, 0, 24)
  levelLabel.Position = UDim2.new(0, -65, 0, 0)
  levelLabel.BackgroundTransparency = 1
  levelLabel.Text = "Lv. 1"
  levelLabel.TextColor3 = Color3.fromRGB(255, 220, 100)
  levelLabel.Font = Enum.Font.GothamBold levelLabel.TextSize = 16
  levelLabel.Parent = container

  -- XP text
  local xpText = Instance.new("TextLabel")
  xpText.Size = UDim2.new(1, 0, 1, 0)
  xpText.BackgroundTransparency = 1
  xpText.Text = "0 / 100"
  xpText.TextColor3 = Color3.fromRGB(255, 255, 255)
  xpText.TextStrokeTransparency = 0.5
  xpText.Font = Enum.Font.GothamMedium xpText.TextSize = 12
  xpText.ZIndex = 2 xpText.Parent = container

  -- Update function
  local function updateXP(currentXP: number, maxXP: number, level: number)
    local ratio = currentXP / maxXP
    TweenService:Create(fill, TweenInfo.new(0.4, Enum.EasingStyle.Quad), {
      Size = UDim2.new(math.clamp(ratio, 0, 1), 0, 1, 0)
    }):Play()
    xpText.Text = currentXP .. " / " .. maxXP
    levelLabel.Text = "Lv. " .. level
  end

  -- Level up effect
  local function playLevelUp()
    -- Flash white
    fill.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
    TweenService:Create(fill, TweenInfo.new(0.5), {
      BackgroundColor3 = Color3.fromRGB(100, 200, 255)
    }):Play()
    -- Scale pop
    local scale = Instance.new("UIScale") scale.Scale = 1 scale.Parent = container
    TweenService:Create(scale, TweenInfo.new(0.2, Enum.EasingStyle.Back), {Scale = 1.2}):Play()
    task.delay(0.2, function()
      TweenService:Create(scale, TweenInfo.new(0.3, Enum.EasingStyle.Back), {Scale = 1}):Play()
      task.delay(0.3, function() scale:Destroy() end)
    end)
  end

  return container, updateXP, playLevelUp
end`,
    pitfalls: [
      'Snapping bar width instead of tweening (feels abrupt)',
      'No text overlay showing actual XP numbers (player cannot see progress)',
      'Level up with no visual feedback (player misses the moment)',
      'Bar width not clamped to 0-1 (can overflow or underflow)',
      'Updating XP bar from server every frame instead of on change (wastes network)',
    ],
  },

  // ── SECURITY PATTERNS ─────────────────────────────────────────────────────

  {
    name: 'Server-Side Cooldown Tracking',
    keywords: ['cooldown', 'rate limit', 'throttle', 'spam', 'anti spam', 'server cooldown', 'per player'],
    snippet: `-- SERVER-SIDE COOLDOWN TRACKING (per-player, per-action)
-- Put this in a shared module for all your remote handlers

local CooldownManager = {}
local cooldowns = {} -- [userId][actionName] = lastTime

function CooldownManager.Init()
  game.Players.PlayerRemoving:Connect(function(player)
    cooldowns[player.UserId] = nil -- Cleanup on leave
  end)
end

function CooldownManager.Check(player: Player, action: string, duration: number): boolean
  local userId = player.UserId
  if not cooldowns[userId] then cooldowns[userId] = {} end

  local lastTime = cooldowns[userId][action] or 0
  local now = tick()

  if now - lastTime < duration then
    return false -- On cooldown
  end

  cooldowns[userId][action] = now
  return true -- Allowed
end

function CooldownManager.GetRemaining(player: Player, action: string, duration: number): number
  local userId = player.UserId
  if not cooldowns[userId] then return 0 end
  local lastTime = cooldowns[userId][action] or 0
  local remaining = duration - (tick() - lastTime)
  return math.max(0, remaining)
end

return CooldownManager

-- USAGE in remote handler:
-- local CooldownManager = require(ServerStorage.Modules.CooldownManager)
-- remote.OnServerEvent:Connect(function(player, ...)
--   if not CooldownManager.Check(player, "Attack", 0.5) then return end
--   -- Process attack
-- end)`,
    pitfalls: [
      'Client-side cooldowns only (exploiter bypasses them completely)',
      'Not cleaning up on PlayerRemoving (memory leak)',
      'Using os.time() instead of tick() (os.time has 1-second resolution, tick is precise)',
      'Same cooldown for all actions (attack vs chat vs purchase need different durations)',
      'Cooldown too strict for legitimate rapid actions (mouse clicks at 0.1s intervals)',
    ],
  },

  {
    name: 'Distance Validation',
    keywords: ['distance', 'validate', 'range check', 'reach', 'proximity', 'anti teleport', 'speed check'],
    snippet: `-- DISTANCE VALIDATION (player must be near target)
-- SERVER SCRIPT — use on ALL remotes that involve interaction

local MAX_INTERACTION_DISTANCE = 15 -- studs
local MAX_ALLOWED_SPEED = 100 -- studs/second (with generous margin)

-- Validate player is near a position
local function isNearPosition(player: Player, targetPos: Vector3, maxDist: number): boolean
  local character = player.Character
  if not character then return false end
  local rootPart = character:FindFirstChild("HumanoidRootPart")
  if not rootPart then return false end
  local distance = (rootPart.Position - targetPos).Magnitude
  return distance <= (maxDist or MAX_INTERACTION_DISTANCE)
end

-- Validate player is near a part/model
local function isNearObject(player: Player, object: Instance, maxDist: number): boolean
  local position
  if object:IsA("BasePart") then
    position = object.Position
  elseif object:IsA("Model") then
    local primary = object.PrimaryPart or object:FindFirstChildWhichIsA("BasePart")
    if primary then position = primary.Position end
  end
  if not position then return false end
  return isNearPosition(player, position, maxDist)
end

-- Speed check (detect teleport hacks)
local lastPositions = {} -- [userId] = {position, time}

local function checkMovementSpeed(player: Player): boolean
  local character = player.Character
  if not character then return true end
  local rootPart = character:FindFirstChild("HumanoidRootPart")
  if not rootPart then return true end

  local userId = player.UserId
  local now = tick()
  local currentPos = rootPart.Position

  if lastPositions[userId] then
    local lastPos = lastPositions[userId].position
    local lastTime = lastPositions[userId].time
    local dt = now - lastTime
    if dt > 0.1 then -- Only check if enough time passed
      local speed = (currentPos - lastPos).Magnitude / dt
      if speed > MAX_ALLOWED_SPEED then
        warn(player.Name .. " moving at " .. math.floor(speed) .. " studs/s (suspicious)")
        return false -- Suspicious movement
      end
    end
  end

  lastPositions[userId] = {position = currentPos, time = now}
  return true
end

game.Players.PlayerRemoving:Connect(function(p) lastPositions[p.UserId] = nil end)`,
    pitfalls: [
      'No distance check on interaction remotes (player buys from shop across map)',
      'MAX distance too tight — legitimate lag can cause false positives (add 20% margin)',
      'Speed check without lag tolerance (network jitter can cause position jumps)',
      'Not cleaning up lastPositions on PlayerRemoving (memory leak)',
      'Checking distance against client-sent position (exploiter lies — use server character)',
    ],
  },

  // ── ADVANCED PATTERNS ─────────────────────────────────────────────────────

  {
    name: 'Object Pooling Pattern',
    keywords: ['pool', 'object pool', 'reuse', 'performance', 'recycle', 'spawn', 'despawn', 'projectile pool'],
    snippet: `-- OBJECT POOLING (pre-create, reuse, return to pool)
-- Used for: projectiles, coins, effects, NPCs — anything spawned frequently

local ObjectPool = {}
ObjectPool.__index = ObjectPool

function ObjectPool.new(template: Instance, initialSize: number, parent: Instance?)
  local self = setmetatable({}, ObjectPool)
  self._template = template
  self._available = {} -- Stack of available objects
  self._active = {}    -- Set of objects currently in use
  self._parent = parent or workspace

  -- Pre-create objects
  for i = 1, initialSize do
    local obj = template:Clone()
    if obj:IsA("BasePart") then
      obj.Anchored = true
      obj.CFrame = CFrame.new(0, -500, 0) -- Hidden below world
    end
    obj.Parent = self._parent
    table.insert(self._available, obj)
  end

  return self
end

-- Get an object from the pool
function ObjectPool:Get(): Instance?
  local obj = table.remove(self._available)
  if not obj then
    -- Pool exhausted — create new (with warning)
    warn("Pool exhausted, creating new object")
    obj = self._template:Clone()
    obj.Parent = self._parent
  end
  self._active[obj] = true
  return obj
end

-- Return an object to the pool
function ObjectPool:Return(obj: Instance)
  if not self._active[obj] then return end
  self._active[obj] = nil
  -- Reset position (hide)
  if obj:IsA("BasePart") then
    obj.CFrame = CFrame.new(0, -500, 0)
    obj.Anchored = true
  elseif obj:IsA("Model") then
    obj:PivotTo(CFrame.new(0, -500, 0))
  end
  table.insert(self._available, obj)
end

-- Get pool stats
function ObjectPool:GetStats()
  return {
    available = #self._available,
    active = 0, -- count self._active
    total = #self._available, -- + active
  }
end

return ObjectPool

-- USAGE:
-- local pool = ObjectPool.new(bulletTemplate, 50)
-- local bullet = pool:Get()
-- bullet.CFrame = firePosition
-- bullet.Anchored = false
-- task.delay(3, function() pool:Return(bullet) end)`,
    pitfalls: [
      'Destroying objects instead of returning to pool (defeats the purpose)',
      'Not resetting object state when returning (old velocity, color, etc. persists)',
      'Pool too small — frequent exhaustion causes normal Instance.new overhead',
      'Pool too large — wastes memory on objects never used',
      'Not anchoring returned objects (they fall through the world at Y=-500)',
    ],
  },

  {
    name: 'Custom Signal / Event Pattern',
    keywords: ['signal', 'event', 'observer', 'pub sub', 'publish', 'subscribe', 'callback', 'custom event', 'bindable'],
    snippet: `-- CUSTOM SIGNAL (lightweight pub/sub, replaces BindableEvent)
-- Pure Luau — no instances needed, faster than BindableEvents

local Signal = {}
Signal.__index = Signal

function Signal.new()
  return setmetatable({
    _connections = {},
    _once = {},
  }, Signal)
end

function Signal:Connect(callback: (...any) -> ()): {Disconnect: () -> ()}
  local id = #self._connections + 1
  self._connections[id] = callback
  return {
    Disconnect = function()
      self._connections[id] = nil
    end,
  }
end

function Signal:Once(callback: (...any) -> ())
  local connection
  connection = self:Connect(function(...)
    connection.Disconnect()
    callback(...)
  end)
  return connection
end

function Signal:Fire(...)
  for _, callback in self._connections do
    task.spawn(callback, ...)
  end
end

function Signal:Wait()
  local thread = coroutine.running()
  self:Once(function(...)
    task.spawn(thread, ...)
  end)
  return coroutine.yield()
end

function Signal:Destroy()
  self._connections = {}
end

return Signal

-- USAGE:
-- local Signal = require(path.to.Signal)
-- local onDamaged = Signal.new()
-- onDamaged:Connect(function(amount, source)
--   print("Took " .. amount .. " damage from " .. source)
-- end)
-- onDamaged:Fire(25, "Sword")
-- local damage = onDamaged:Wait() -- Yields until next fire`,
    pitfalls: [
      'Using BindableEvent for everything (creates Instance overhead — Signals are lighter)',
      'Not spawning callbacks in separate threads (one error blocks all listeners)',
      'Forgetting to Disconnect when object is destroyed (memory leak)',
      'Signal:Wait() yields forever if never fired (add timeout if needed)',
      'Firing with wrong argument types (no type safety — document your signals)',
    ],
  },

  {
    name: 'Component System (CollectionService + Attributes)',
    keywords: ['component', 'ecs', 'entity', 'system', 'collectionservice', 'attribute', 'behavior', 'tag system'],
    snippet: `-- COMPONENT SYSTEM (CollectionService tags + Attributes as lightweight ECS)
-- Each "component" is a tag + attributes on an Instance
-- Each "system" is a script that processes all instances with a tag

local CollectionService = game:GetService("CollectionService")
local RunService = game:GetService("RunService")

-- COMPONENT DEFINITION:
-- Tag: "Rotator" — any part with this tag spins
-- Attributes: Speed (number), Axis (string: "X"|"Y"|"Z")

-- SYSTEM: Rotator (processes all "Rotator" tagged parts)
local function setupRotator(part: BasePart)
  local speed = part:GetAttribute("Speed") or 1
  local axis = part:GetAttribute("Axis") or "Y"
  local conn
  conn = RunService.Heartbeat:Connect(function(dt)
    if not part.Parent then conn:Disconnect() return end
    local rotation = speed * dt
    if axis == "X" then
      part.CFrame *= CFrame.Angles(rotation, 0, 0)
    elseif axis == "Y" then
      part.CFrame *= CFrame.Angles(0, rotation, 0)
    elseif axis == "Z" then
      part.CFrame *= CFrame.Angles(0, 0, rotation)
    end
  end)
end

-- Auto-setup for current and future tagged instances
for _, part in CollectionService:GetTagged("Rotator") do
  if part:IsA("BasePart") then setupRotator(part) end
end
CollectionService:GetInstanceAddedSignal("Rotator"):Connect(function(part)
  if part:IsA("BasePart") then setupRotator(part) end
end)

-- MORE COMPONENT EXAMPLES:
-- Tag: "DamageZone" + Attribute: DPS (number)
-- Tag: "Bouncy" + Attribute: Force (number)
-- Tag: "Destructible" + Attribute: Health (number)
-- Tag: "Lava" — applies damage on touch
-- Tag: "Checkpoint" + Attribute: StageNumber (number)
-- Tag: "NPC" + Attribute: DialogueId (string)

-- BENEFITS vs per-instance scripts:
-- 1. ONE script manages ALL tagged instances (way fewer scripts)
-- 2. Attributes editable in Properties panel (no script editing needed)
-- 3. Easy to add/remove behaviors (add/remove tag)
-- 4. Works with streaming (GetInstanceAddedSignal handles late arrivals)`,
    pitfalls: [
      'Per-instance scripts instead of tag system (100 scripts vs 1 = massive difference)',
      'Not handling GetInstanceAddedSignal (misses streamed-in instances)',
      'Not disconnecting Heartbeat when part is destroyed (memory leak)',
      'Attributes not set (always provide defaults: GetAttribute("Speed") or 1)',
      'Complex state in Attributes (keep it simple — numbers, strings, booleans only)',
    ],
  },

  {
    name: 'Instance Streaming Helper',
    keywords: ['streaming', 'streamingenabled', 'persistentloaded', 'streamingpriority', 'model streaming', 'load'],
    snippet: `-- INSTANCE STREAMING (StreamingEnabled best practices)
-- StreamingEnabled = true reduces memory and load time for large maps

-- WORKSPACE PROPERTIES:
-- StreamingEnabled = true
-- StreamingMinRadius = 64     -- Minimum guaranteed loaded radius (studs)
-- StreamingTargetRadius = 256 -- Target loaded radius (may be less under memory pressure)
-- StreamOutBehavior = Enum.StreamOutBehavior.LowMemory -- More aggressive on low-end

-- STREAMING PRIORITIES (set on Models):
-- ModelStreamingMode = Enum.ModelStreamingMode.Default   -- Normal streaming
-- ModelStreamingMode = Enum.ModelStreamingMode.Atomic    -- Load all children at once
-- ModelStreamingMode = Enum.ModelStreamingMode.Persistent -- NEVER stream out (use sparingly)

-- PersistentLoaded: tag parts that MUST always exist
-- Use for: spawn points, teleport pads, important NPCs
-- model.ModelStreamingMode = Enum.ModelStreamingMode.Persistent

-- HANDLING STREAMED-IN/OUT INSTANCES (client-side):
local Players = game:GetService("Players")
local player = Players.LocalPlayer

-- Wait for a specific model to stream in
local function waitForModel(parent: Instance, modelName: string, timeout: number?): Model?
  local model = parent:FindFirstChild(modelName)
  if model then return model end
  local t = timeout or 30
  local startTime = tick()
  repeat
    model = parent:FindFirstChild(modelName)
    if model then return model end
    task.wait(0.5)
  until tick() - startTime > t
  warn("Timed out waiting for:", modelName)
  return nil
end

-- Request server to stream in a specific area
-- player:RequestStreamAroundAsync(targetCFrame.Position, timeout)

-- SAFE INSTANCE ACCESS:
-- With streaming, instances may not exist yet
-- ALWAYS use WaitForChild or FindFirstChild with nil checks
-- NEVER assume workspace.SomeModel exists immediately`,
    pitfalls: [
      'Assuming all workspace children exist on client (they may not be streamed in)',
      'Using Persistent on too many models (defeats the purpose of streaming)',
      'Not using Atomic on multi-part models (partial model loads look broken)',
      'StreamingMinRadius too large (negates memory savings)',
      'Scripts that reference workspace children without WaitForChild (nil errors)',
    ],
  },

  {
    name: 'Chunk Loading System',
    keywords: ['chunk', 'loading', 'zone', 'activate', 'deactivate', 'world zone', 'level streaming', 'open world'],
    snippet: `-- CHUNK LOADING (activate/deactivate world zones based on player position)
-- SERVER SCRIPT for small-scale, CLIENT SCRIPT for visual-only

local Players = game:GetService("Players")
local RunService = game:GetService("RunService")

local CHUNK_SIZE = 128 -- studs
local LOAD_RADIUS = 2  -- chunks around player to keep loaded
local UPDATE_INTERVAL = 2 -- seconds between checks

-- Chunks stored in ServerStorage, moved to Workspace when active
local ChunkStorage = game.ServerStorage:WaitForChild("Chunks")
local activeChunks = {} -- ["x_z"] = chunk Model

local function getChunkKey(x: number, z: number): string
  return tostring(x) .. "_" .. tostring(z)
end

local function getPlayerChunk(player: Player): (number, number)?
  local char = player.Character
  if not char then return nil end
  local rootPart = char:FindFirstChild("HumanoidRootPart")
  if not rootPart then return nil end
  local pos = rootPart.Position
  return math.floor(pos.X / CHUNK_SIZE), math.floor(pos.Z / CHUNK_SIZE)
end

local function loadChunk(cx: number, cz: number)
  local key = getChunkKey(cx, cz)
  if activeChunks[key] then return end -- Already loaded
  local chunkModel = ChunkStorage:FindFirstChild("Chunk_" .. key)
  if not chunkModel then return end -- Chunk doesn't exist
  local clone = chunkModel:Clone()
  clone.Parent = workspace
  activeChunks[key] = clone
end

local function unloadChunk(key: string)
  local chunk = activeChunks[key]
  if chunk then
    chunk:Destroy()
    activeChunks[key] = nil
  end
end

-- Update loop
task.spawn(function()
  while true do
    -- Determine which chunks should be loaded
    local neededChunks = {}
    for _, player in Players:GetPlayers() do
      local cx, cz = getPlayerChunk(player)
      if cx and cz then
        for dx = -LOAD_RADIUS, LOAD_RADIUS do
          for dz = -LOAD_RADIUS, LOAD_RADIUS do
            neededChunks[getChunkKey(cx + dx, cz + dz)] = true
          end
        end
      end
    end

    -- Load needed chunks
    for key in neededChunks do
      local parts = string.split(key, "_")
      loadChunk(tonumber(parts[1]), tonumber(parts[2]))
    end

    -- Unload unneeded chunks
    for key in activeChunks do
      if not neededChunks[key] then
        unloadChunk(key)
      end
    end

    task.wait(UPDATE_INTERVAL)
  end
end)`,
    pitfalls: [
      'Loading ALL chunks at once (defeats the purpose — only load near players)',
      'Update interval too short (checking every frame wastes CPU)',
      'Not unloading chunks when players leave the area (memory leak)',
      'Chunk boundaries visible to players (offset chunks or use overlapping edges)',
      'Consider using StreamingEnabled instead for most cases (simpler, built-in)',
    ],
  },

  {
    name: 'Input Buffering Pattern',
    keywords: ['input buffer', 'queue', 'combo', 'input queue', 'fighting game', 'action queue', 'sequence'],
    snippet: `-- INPUT BUFFERING (queue inputs, execute in order — for combo systems)
-- CLIENT SCRIPT

local UserInputService = game:GetService("UserInputService")

local InputBuffer = {}
InputBuffer.__index = InputBuffer

function InputBuffer.new(bufferWindowSeconds: number)
  return setmetatable({
    _buffer = {},
    _window = bufferWindowSeconds or 0.3, -- 300ms default
    _maxSize = 10,
  }, InputBuffer)
end

-- Add input to buffer
function InputBuffer:Push(inputName: string)
  table.insert(self._buffer, {
    name = inputName,
    time = tick(),
  })
  -- Trim old inputs
  while #self._buffer > self._maxSize do
    table.remove(self._buffer, 1)
  end
end

-- Check if a sequence was performed within the buffer window
function InputBuffer:MatchSequence(sequence: {string}): boolean
  local now = tick()
  -- Clean expired inputs
  local valid = {}
  for _, input in self._buffer do
    if now - input.time <= self._window * #sequence then
      table.insert(valid, input)
    end
  end

  -- Match sequence from end of buffer
  if #valid < #sequence then return false end
  local startIdx = #valid - #sequence + 1
  for i, expected in ipairs(sequence) do
    if valid[startIdx + i - 1].name ~= expected then
      return false
    end
  end
  return true
end

-- Consume (clear) the buffer after a match
function InputBuffer:Clear()
  self._buffer = {}
end

return InputBuffer

-- USAGE (fighting game combos):
-- local buffer = InputBuffer.new(0.5) -- 500ms window
-- UserInputService.InputBegan:Connect(function(input, processed)
--   if processed then return end
--   if input.KeyCode == Enum.KeyCode.J then buffer:Push("Light") end
--   if input.KeyCode == Enum.KeyCode.K then buffer:Push("Heavy") end
--   if input.KeyCode == Enum.KeyCode.L then buffer:Push("Special") end
--   -- Check combos
--   if buffer:MatchSequence({"Light", "Light", "Heavy"}) then
--     performCombo("UpperSlash") buffer:Clear()
--   end
-- end)`,
    pitfalls: [
      'Buffer window too tight (< 0.2s) — hard to execute combos consistently',
      'Not clearing buffer after successful match (same combo triggers twice)',
      'No max buffer size — infinite buffer wastes memory',
      'Expired inputs not cleaned — stale inputs trigger false matches',
      'Server validation needed — client detects combo, server validates and executes',
    ],
  },

  {
    name: 'Obby Moving Platforms',
    keywords: ['moving platform', 'obby platform', 'conveyor', 'elevator', 'moving part', 'oscillate', 'pendulum'],
    snippet: `-- MOVING PLATFORMS (obby patterns — oscillate, rotate, conveyor)
-- SERVER SCRIPT (or shared with CollectionService tags)

local TweenService = game:GetService("TweenService")
local RunService = game:GetService("RunService")

-- OSCILLATING PLATFORM (moves between two points)
local function oscillatePlatform(part: BasePart, offset: Vector3, duration: number)
  local startCF = part.CFrame
  local endCF = startCF + offset
  local tween1 = TweenService:Create(part, TweenInfo.new(duration, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut), {
    CFrame = endCF
  })
  local tween2 = TweenService:Create(part, TweenInfo.new(duration, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut), {
    CFrame = startCF
  })
  tween1.Completed:Connect(function() tween2:Play() end)
  tween2.Completed:Connect(function() tween1:Play() end)
  tween1:Play()
end
-- Usage: oscillatePlatform(part, Vector3.new(0, 20, 0), 3) -- Up/down 20 studs, 3s each way

-- ROTATING PLATFORM (continuous spin)
local function rotatePlatform(part: BasePart, axis: string, speed: number)
  RunService.Heartbeat:Connect(function(dt)
    if not part.Parent then return end
    local r = speed * dt
    if axis == "Y" then
      part.CFrame *= CFrame.Angles(0, r, 0)
    elseif axis == "X" then
      part.CFrame *= CFrame.Angles(r, 0, 0)
    end
  end)
end

-- CONVEYOR (moves player standing on it)
local function makeConveyor(part: BasePart, direction: Vector3, speed: number)
  -- Set AssemblyLinearVelocity for physics-based conveyor
  RunService.Heartbeat:Connect(function()
    if not part.Parent then return end
    part.AssemblyLinearVelocity = direction.Unit * speed
  end)
end

-- DISAPPEARING PLATFORM (appears/disappears on timer)
local function disappearingPlatform(part: BasePart, visibleTime: number, hiddenTime: number)
  task.spawn(function()
    while part.Parent do
      part.Transparency = 0
      part.CanCollide = true
      task.wait(visibleTime)
      -- Warning flash
      for i = 1, 3 do
        part.Transparency = 0.5
        task.wait(0.15)
        part.Transparency = 0
        task.wait(0.15)
      end
      part.Transparency = 1
      part.CanCollide = false
      task.wait(hiddenTime)
    end
  end)
end`,
    pitfalls: [
      'Moving platforms without Anchored = true (they fall due to gravity)',
      'TweenService on unanchored parts fights with physics (use CFrame tweens on anchored)',
      'Conveyor without AssemblyLinearVelocity — old BodyVelocity is deprecated',
      'Disappearing platform without warning flash (unfair — player needs visual cue)',
      'Sine easing on oscillating platforms makes them pause at endpoints (realistic)',
    ],
  },

  {
    name: 'Inventory UI Pattern',
    keywords: ['inventory', 'item grid', 'backpack', 'slot', 'equipment', 'drag drop', 'inventory ui', 'items'],
    snippet: `-- INVENTORY UI (grid of items with selection and info panel)
-- CLIENT SCRIPT

local Players = game:GetService("Players")
local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

local function createInventoryUI()
  local sg = Instance.new("ScreenGui") sg.Name = "InventoryUI"
  sg.ResetOnSpawn = false sg.Parent = playerGui

  -- Main panel
  local panel = Instance.new("Frame")
  panel.Size = UDim2.new(0.6, 0, 0.7, 0)
  panel.Position = UDim2.new(0.2, 0, 0.15, 0)
  panel.AnchorPoint = Vector2.new(0, 0)
  panel.BackgroundColor3 = Color3.fromRGB(15, 18, 28)
  panel.Visible = false panel.Parent = sg
  Instance.new("UICorner", panel).CornerRadius = UDim.new(0, 12)
  Instance.new("UIStroke", panel).Color = Color3.fromRGB(50, 55, 70)

  -- Title
  local title = Instance.new("TextLabel")
  title.Size = UDim2.new(1, 0, 0, 40)
  title.BackgroundTransparency = 1 title.Text = "Inventory"
  title.TextColor3 = Color3.fromRGB(212, 175, 55)
  title.Font = Enum.Font.GothamBold title.TextSize = 22 title.Parent = panel

  -- Item grid (scrolling)
  local scroll = Instance.new("ScrollingFrame")
  scroll.Size = UDim2.new(0.65, 0, 0.85, 0)
  scroll.Position = UDim2.new(0.02, 0, 0.12, 0)
  scroll.BackgroundTransparency = 1
  scroll.ScrollBarThickness = 4
  scroll.AutomaticCanvasSize = Enum.AutomaticSize.Y
  scroll.Parent = panel

  local grid = Instance.new("UIGridLayout")
  grid.CellSize = UDim2.new(0, 64, 0, 64)
  grid.CellPadding = UDim2.new(0, 6, 0, 6)
  grid.SortOrder = Enum.SortOrder.LayoutOrder
  grid.Parent = scroll

  -- Item info panel (right side)
  local infoPanel = Instance.new("Frame")
  infoPanel.Name = "InfoPanel"
  infoPanel.Size = UDim2.new(0.3, 0, 0.85, 0)
  infoPanel.Position = UDim2.new(0.68, 0, 0.12, 0)
  infoPanel.BackgroundColor3 = Color3.fromRGB(20, 24, 35)
  infoPanel.Parent = panel
  Instance.new("UICorner", infoPanel).CornerRadius = UDim.new(0, 8)

  -- Populate items
  local function addItem(itemData: {name: string, icon: string, rarity: string, count: number})
    local slot = Instance.new("ImageButton")
    slot.BackgroundColor3 = Color3.fromRGB(30, 35, 50)
    slot.Image = itemData.icon
    slot.Parent = scroll
    Instance.new("UICorner", slot).CornerRadius = UDim.new(0, 8)

    -- Rarity border
    local rarityColors = {
      Common = Color3.fromRGB(150, 150, 150),
      Uncommon = Color3.fromRGB(50, 200, 50),
      Rare = Color3.fromRGB(50, 100, 255),
      Legendary = Color3.fromRGB(255, 170, 0),
      Mythic = Color3.fromRGB(200, 50, 255),
    }
    local stroke = Instance.new("UIStroke", slot)
    stroke.Color = rarityColors[itemData.rarity] or rarityColors.Common
    stroke.Thickness = 2

    -- Count badge
    if itemData.count > 1 then
      local badge = Instance.new("TextLabel")
      badge.Size = UDim2.new(0, 24, 0, 18)
      badge.Position = UDim2.new(1, -26, 1, -20)
      badge.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
      badge.Text = tostring(itemData.count)
      badge.TextColor3 = Color3.new(1, 1, 1)
      badge.Font = Enum.Font.GothamBold badge.TextSize = 12 badge.Parent = slot
      Instance.new("UICorner", badge).CornerRadius = UDim.new(0.3, 0)
    end

    -- Click to show details
    slot.Activated:Connect(function()
      -- Update info panel with item details
    end)
  end

  return sg, panel, addItem
end`,
    pitfalls: [
      'Not using AutomaticCanvasSize on ScrollingFrame (manual sizing is fragile)',
      'Missing rarity color borders (all items look the same)',
      'No item count badge (player cannot tell stacks apart)',
      'Inventory data from client only (server must be source of truth)',
      'Grid cells too small on mobile (48x48 minimum for touch targets)',
    ],
  },

  {
    name: 'Kill Feed System',
    keywords: ['kill feed', 'kill log', 'death log', 'elimination', 'frag', 'kill notification', 'combat log'],
    snippet: `-- KILL FEED (scrolling text list, color-coded by team)
-- CLIENT SCRIPT

local TweenService = game:GetService("TweenService")
local Players = game:GetService("Players")
local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

-- Create kill feed UI
local sg = Instance.new("ScreenGui") sg.Name = "KillFeed"
sg.ResetOnSpawn = false sg.Parent = playerGui

local feedFrame = Instance.new("Frame")
feedFrame.Size = UDim2.new(0.3, 0, 0.25, 0)
feedFrame.Position = UDim2.new(0.68, 0, 0.02, 0)
feedFrame.BackgroundTransparency = 1
feedFrame.Parent = sg

local layout = Instance.new("UIListLayout")
layout.Padding = UDim.new(0, 4)
layout.SortOrder = Enum.SortOrder.LayoutOrder
layout.VerticalAlignment = Enum.VerticalAlignment.Bottom
layout.Parent = feedFrame

local MAX_ENTRIES = 5
local entryCount = 0

local function addKillEntry(killerName: string, victimName: string, weaponIcon: string?)
  entryCount += 1

  local entry = Instance.new("Frame")
  entry.Size = UDim2.new(1, 0, 0, 22)
  entry.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
  entry.BackgroundTransparency = 0.5
  entry.LayoutOrder = entryCount
  entry.Parent = feedFrame
  Instance.new("UICorner", entry).CornerRadius = UDim.new(0, 4)

  -- Killer name (colored by team)
  local killerPlayer = Players:FindFirstChild(killerName)
  local killerColor = killerPlayer and killerPlayer.Team and killerPlayer.TeamColor.Color or Color3.fromRGB(255, 255, 255)

  local killerLabel = Instance.new("TextLabel")
  killerLabel.Size = UDim2.new(0.4, 0, 1, 0) killerLabel.Position = UDim2.new(0, 5, 0, 0)
  killerLabel.BackgroundTransparency = 1 killerLabel.Text = killerName
  killerLabel.TextColor3 = killerColor
  killerLabel.Font = Enum.Font.GothamBold killerLabel.TextSize = 13
  killerLabel.TextXAlignment = Enum.TextXAlignment.Left killerLabel.Parent = entry

  -- Weapon icon or "killed" text
  local actionLabel = Instance.new("TextLabel")
  actionLabel.Size = UDim2.new(0.15, 0, 1, 0) actionLabel.Position = UDim2.new(0.4, 0, 0, 0)
  actionLabel.BackgroundTransparency = 1 actionLabel.Text = "killed"
  actionLabel.TextColor3 = Color3.fromRGB(180, 180, 180)
  actionLabel.Font = Enum.Font.Gotham actionLabel.TextSize = 11 actionLabel.Parent = entry

  -- Victim name
  local victimPlayer = Players:FindFirstChild(victimName)
  local victimColor = victimPlayer and victimPlayer.Team and victimPlayer.TeamColor.Color or Color3.fromRGB(255, 255, 255)

  local victimLabel = Instance.new("TextLabel")
  victimLabel.Size = UDim2.new(0.4, 0, 1, 0) victimLabel.Position = UDim2.new(0.58, 0, 0, 0)
  victimLabel.BackgroundTransparency = 1 victimLabel.Text = victimName
  victimLabel.TextColor3 = victimColor
  victimLabel.Font = Enum.Font.GothamBold victimLabel.TextSize = 13
  victimLabel.TextXAlignment = Enum.TextXAlignment.Left victimLabel.Parent = entry

  -- Fade out after 5 seconds
  task.delay(4, function()
    TweenService:Create(entry, TweenInfo.new(1), {BackgroundTransparency = 1}):Play()
    TweenService:Create(killerLabel, TweenInfo.new(1), {TextTransparency = 1}):Play()
    TweenService:Create(actionLabel, TweenInfo.new(1), {TextTransparency = 1}):Play()
    TweenService:Create(victimLabel, TweenInfo.new(1), {TextTransparency = 1}):Play()
    task.delay(1, function() entry:Destroy() end)
  end)

  -- Trim old entries
  local children = feedFrame:GetChildren()
  local entries = {}
  for _, child in children do
    if child:IsA("Frame") then table.insert(entries, child) end
  end
  while #entries > MAX_ENTRIES do
    entries[1]:Destroy()
    table.remove(entries, 1)
  end
end

-- Listen for kill events from server
game.ReplicatedStorage.Remotes.KillFeed.OnClientEvent:Connect(addKillEntry)`,
    pitfalls: [
      'Not limiting max entries (feed grows infinitely)',
      'No fade-out animation (entries pop in and out abruptly)',
      'Team colors not applied (all names look the same)',
      'Feed positioned over gameplay area (put in top-right corner)',
      'Not destroying faded entries (invisible frames accumulate)',
    ],
  },

  // ── MORE BUILDING PATTERNS ────────────────────────────────────────────────

  {
    name: 'Modern City Block',
    keywords: ['city', 'skyscraper', 'modern', 'urban', 'road', 'traffic light', 'crosswalk', 'building', 'downtown'],
    snippet: `-- MODERN CITY BLOCK (skyscrapers, roads, traffic lights, crosswalks)
local function buildCityBlock(pos, parent)
  local m = Instance.new("Model") m.Name = "CityBlock"

  -- Road (asphalt with markings)
  local road = Instance.new("Part") road.Anchored = true
  road.Size = Vector3.new(60, 0.3, 16) road.CFrame = CFrame.new(pos - Vector3.new(0, 0.15, 0))
  road.Material = Enum.Material.Asphalt road.Color = Color3.fromRGB(50, 50, 50) road.Parent = m

  -- White lane markings
  for z = -25, 25, 6 do
    local dash = Instance.new("Part") dash.Anchored = true
    dash.Size = Vector3.new(0.3, 0.31, 3) dash.CFrame = CFrame.new(pos + Vector3.new(0, 0, z))
    dash.Material = Enum.Material.Neon dash.Color = Color3.new(1, 1, 1) dash.Parent = m
  end

  -- Sidewalk (both sides)
  for _, side in ipairs({-1, 1}) do
    local sidewalk = Instance.new("Part") sidewalk.Anchored = true
    sidewalk.Size = Vector3.new(60, 0.6, 4)
    sidewalk.CFrame = CFrame.new(pos + Vector3.new(0, 0.15, side * 10))
    sidewalk.Material = Enum.Material.Concrete sidewalk.Color = Color3.fromRGB(170, 165, 155)
    sidewalk.Parent = m
  end

  -- Skyscraper (glass + steel)
  local function makeSkyscraper(offset, floors, width)
    local height = floors * 4
    local building = Instance.new("Part") building.Anchored = true
    building.Size = Vector3.new(width, height, width)
    building.CFrame = CFrame.new(pos + offset + Vector3.new(0, height / 2 + 0.6, 0))
    building.Material = Enum.Material.Glass
    building.Color = Color3.fromRGB(60 + math.random(-15, 15), 80 + math.random(-15, 15), 120 + math.random(-15, 15))
    building.Transparency = 0.1 building.Parent = m
    -- Steel frame
    local frame = Instance.new("Part") frame.Anchored = true
    frame.Size = Vector3.new(width + 0.5, height + 0.5, width + 0.5)
    frame.CFrame = building.CFrame frame.Transparency = 0.8
    frame.Material = Enum.Material.Metal frame.Color = Color3.fromRGB(80, 85, 90) frame.Parent = m
  end

  makeSkyscraper(Vector3.new(-20, 0, 20), 15, 12)
  makeSkyscraper(Vector3.new(10, 0, 22), 20, 14)
  makeSkyscraper(Vector3.new(-8, 0, -20), 10, 10)

  -- Traffic light
  local function makeTrafficLight(offset)
    local pole = Instance.new("Part") pole.Anchored = true
    pole.Size = Vector3.new(0.5, 10, 0.5) pole.CFrame = CFrame.new(pos + offset + Vector3.new(0, 5, 0))
    pole.Material = Enum.Material.Metal pole.Color = Color3.fromRGB(50, 55, 60) pole.Parent = m
    local box = Instance.new("Part") box.Anchored = true
    box.Size = Vector3.new(1.5, 4, 1.5) box.CFrame = CFrame.new(pos + offset + Vector3.new(0, 10.5, 0))
    box.Material = Enum.Material.Metal box.Color = Color3.fromRGB(30, 30, 35) box.Parent = m
    -- Lights
    for i, color in ipairs({Color3.fromRGB(255, 0, 0), Color3.fromRGB(255, 200, 0), Color3.fromRGB(0, 255, 0)}) do
      local light = Instance.new("Part") light.Shape = Enum.PartType.Cylinder light.Anchored = true
      light.Size = Vector3.new(0.2, 0.8, 0.8)
      light.CFrame = CFrame.new(pos + offset + Vector3.new(0, 12 - i * 1.2, 0.8))
      light.Material = Enum.Material.Neon light.Color = color light.Parent = m
    end
  end

  makeTrafficLight(Vector3.new(28, 0, -8))
  makeTrafficLight(Vector3.new(-28, 0, 8))

  -- Crosswalk
  for i = -3, 3 do
    local stripe = Instance.new("Part") stripe.Anchored = true
    stripe.Size = Vector3.new(2, 0.31, 5) stripe.CFrame = CFrame.new(pos + Vector3.new(28 + i * 3, 0, 0))
    stripe.Material = Enum.Material.Neon stripe.Color = Color3.new(1, 1, 1) stripe.Parent = m
  end

  m.Parent = parent or workspace return m
end`,
    pitfalls: [
      'All buildings same height and width (vary them for realistic skyline)',
      'Missing sidewalks (roads without walkways feel incomplete)',
      'Traffic light without colored Neon circles (just a pole looks bare)',
      'Glass buildings need slight transparency (0.1-0.15) and blue-ish tint',
      'Crosswalk stripes should use Neon material for visibility at night',
    ],
  },

  {
    name: 'Restaurant Interior',
    keywords: ['restaurant', 'kitchen', 'dining', 'bar', 'booth', 'cafe', 'food', 'counter', 'table'],
    snippet: `-- RESTAURANT INTERIOR (kitchen, dining, bar, booths)
local function buildRestaurant(pos, parent)
  local m = Instance.new("Model") m.Name = "Restaurant"

  -- Floor
  local floor = Instance.new("Part") floor.Anchored = true
  floor.Size = Vector3.new(30, 0.5, 20) floor.CFrame = CFrame.new(pos)
  floor.Material = Enum.Material.WoodPlanks floor.Color = Color3.fromRGB(120, 80, 45) floor.Parent = m

  -- Walls
  for _, d in ipairs({
    {15, 0, 0, 20, 0}, {-15, 0, 0, 20, 0}, {0, 0, 10, 30, 90}, {0, 0, -10, 30, 90}
  }) do
    local wall = Instance.new("Part") wall.Anchored = true
    wall.Size = Vector3.new(d[4], 10, 0.5)
    wall.CFrame = CFrame.new(pos + Vector3.new(d[1], 5, d[3])) * CFrame.Angles(0, math.rad(d[5]), 0)
    wall.Material = Enum.Material.Brick wall.Color = Color3.fromRGB(140, 80, 60) wall.Parent = m
  end

  -- Dining tables (4 tables with chairs)
  for row = 0, 1 do
    for col = 0, 1 do
      local tPos = pos + Vector3.new(-7 + col * 8, 0, -4 + row * 6)
      -- Table
      local table_part = Instance.new("Part") table_part.Anchored = true
      table_part.Size = Vector3.new(4, 0.3, 3) table_part.CFrame = CFrame.new(tPos + Vector3.new(0, 3, 0))
      table_part.Material = Enum.Material.Wood table_part.Color = Color3.fromRGB(140, 95, 50) table_part.Parent = m
      -- Table leg
      local leg = Instance.new("Part") leg.Anchored = true
      leg.Size = Vector3.new(0.5, 2.7, 0.5) leg.CFrame = CFrame.new(tPos + Vector3.new(0, 1.35, 0))
      leg.Material = Enum.Material.Metal leg.Color = Color3.fromRGB(50, 50, 55) leg.Parent = m
      -- 4 chairs around table
      for _, cOff in ipairs({Vector3.new(2.5, 0, 0), Vector3.new(-2.5, 0, 0), Vector3.new(0, 0, 2), Vector3.new(0, 0, -2)}) do
        local seat = Instance.new("Part") seat.Anchored = true
        seat.Size = Vector3.new(1.5, 0.3, 1.5) seat.CFrame = CFrame.new(tPos + cOff + Vector3.new(0, 2, 0))
        seat.Material = Enum.Material.Fabric seat.Color = Color3.fromRGB(150, 40, 40) seat.Parent = m
        local back = Instance.new("Part") back.Anchored = true
        back.Size = Vector3.new(1.5, 2, 0.2)
        local backOff = cOff.Unit * 0.7
        back.CFrame = CFrame.new(tPos + cOff + Vector3.new(backOff.X, 3, backOff.Z))
        back.Material = Enum.Material.Wood back.Color = Color3.fromRGB(120, 80, 40) back.Parent = m
      end
    end
  end

  -- Bar counter
  local counter = Instance.new("Part") counter.Anchored = true
  counter.Size = Vector3.new(10, 3.5, 2) counter.CFrame = CFrame.new(pos + Vector3.new(8, 1.75, 0))
  counter.Material = Enum.Material.Marble counter.Color = Color3.fromRGB(30, 30, 35) counter.Parent = m

  -- Bar stools (3)
  for i = -1, 1 do
    local stool = Instance.new("Part") stool.Shape = Enum.PartType.Cylinder stool.Anchored = true
    stool.Size = Vector3.new(0.3, 1.5, 1.5)
    stool.CFrame = CFrame.new(pos + Vector3.new(6.5, 2.5, i * 2.5)) * CFrame.Angles(0, 0, math.rad(90))
    stool.Material = Enum.Material.Fabric stool.Color = Color3.fromRGB(40, 40, 45) stool.Parent = m
    local stoolLeg = Instance.new("Part") stoolLeg.Shape = Enum.PartType.Cylinder stoolLeg.Anchored = true
    stoolLeg.Size = Vector3.new(2.3, 0.4, 0.4)
    stoolLeg.CFrame = CFrame.new(pos + Vector3.new(6.5, 1.15, i * 2.5)) * CFrame.Angles(0, 0, math.rad(90))
    stoolLeg.Material = Enum.Material.Metal stoolLeg.Color = Color3.fromRGB(50, 50, 55) stoolLeg.Parent = m
  end

  -- Kitchen area (back section)
  local kitchenCounter = Instance.new("Part") kitchenCounter.Anchored = true
  kitchenCounter.Size = Vector3.new(12, 3, 2)
  kitchenCounter.CFrame = CFrame.new(pos + Vector3.new(0, 1.5, 8.5))
  kitchenCounter.Material = Enum.Material.Metal kitchenCounter.Color = Color3.fromRGB(180, 175, 170)
  kitchenCounter.Parent = m

  -- Warm interior lighting
  for _, lPos in ipairs({Vector3.new(-5, 9, 0), Vector3.new(5, 9, 0)}) do
    local light = Instance.new("Part") light.Anchored = true light.CanCollide = false
    light.Size = Vector3.new(0.5, 0.2, 0.5) light.CFrame = CFrame.new(pos + lPos)
    light.Material = Enum.Material.Neon light.Color = Color3.fromRGB(255, 200, 130) light.Parent = m
    local pl = Instance.new("PointLight") pl.Color = Color3.fromRGB(255, 200, 130)
    pl.Brightness = 1.5 pl.Range = 15 pl.Parent = light
  end

  m.Parent = parent or workspace return m
end`,
    pitfalls: [
      'Restaurant without tables and chairs is an empty room',
      'Kitchen counter should be Metal/stainless steel — not Wood',
      'Bar stools are cylinders — not box parts',
      'Interior needs warm PointLights (Color3.fromRGB(255, 200, 130))',
      'Chairs too far from table (1.5-2.5 studs from table edge)',
    ],
  },

  {
    name: 'Playground Build',
    keywords: ['playground', 'swing', 'slide', 'climbing frame', 'sandbox', 'park', 'kids', 'play area', 'monkey bars'],
    snippet: `-- PLAYGROUND (swings, slide, climbing frame, sandbox)
local function buildPlayground(pos, parent)
  local m = Instance.new("Model") m.Name = "Playground"
  local metalColor = Color3.fromRGB(200, 60, 60)
  local pipeColor = Color3.fromRGB(50, 120, 200)

  -- Ground (rubber safety surface)
  local ground = Instance.new("Part") ground.Anchored = true
  ground.Size = Vector3.new(40, 0.3, 30) ground.CFrame = CFrame.new(pos)
  ground.Material = Enum.Material.Rubber ground.Color = Color3.fromRGB(60, 100, 60) ground.Parent = m

  -- SWING SET (A-frame + chains + seats)
  local swingPos = pos + Vector3.new(-12, 0, 0)
  -- A-frame legs
  for _, sx in ipairs({-4, 4}) do
    for _, sz in ipairs({-0.8, 0.8}) do
      local leg = Instance.new("Part") leg.Anchored = true
      leg.Size = Vector3.new(0.4, 8, 0.4)
      leg.CFrame = CFrame.new(swingPos + Vector3.new(sx, 4, 0))
        * CFrame.Angles(0, 0, math.rad(sz * 8))
      leg.Material = Enum.Material.Metal leg.Color = metalColor leg.Parent = m
    end
  end
  -- Top bar
  local topBar = Instance.new("Part") topBar.Anchored = true
  topBar.Size = Vector3.new(8, 0.4, 0.4) topBar.CFrame = CFrame.new(swingPos + Vector3.new(0, 8, 0))
  topBar.Material = Enum.Material.Metal topBar.Color = metalColor topBar.Parent = m
  -- Swing seats (2)
  for _, offset in ipairs({-2, 2}) do
    -- Chain (thin part)
    local chain = Instance.new("Part") chain.Anchored = true
    chain.Size = Vector3.new(0.1, 5, 0.1) chain.CFrame = CFrame.new(swingPos + Vector3.new(offset, 5.5, 0))
    chain.Material = Enum.Material.Metal chain.Color = Color3.fromRGB(150, 150, 155) chain.Parent = m
    -- Seat
    local seat = Instance.new("Part") seat.Anchored = true
    seat.Size = Vector3.new(1.5, 0.2, 0.6) seat.CFrame = CFrame.new(swingPos + Vector3.new(offset, 3, 0))
    seat.Material = Enum.Material.Rubber seat.Color = Color3.fromRGB(30, 30, 35) seat.Parent = m
  end

  -- SLIDE
  local slidePos = pos + Vector3.new(5, 0, 5)
  -- Platform
  local slidePlat = Instance.new("Part") slidePlat.Anchored = true
  slidePlat.Size = Vector3.new(4, 0.3, 4) slidePlat.CFrame = CFrame.new(slidePos + Vector3.new(0, 6, 0))
  slidePlat.Material = Enum.Material.Metal slidePlat.Color = pipeColor slidePlat.Parent = m
  -- Slide surface (wedge)
  local slideWedge = Instance.new("WedgePart") slideWedge.Anchored = true
  slideWedge.Size = Vector3.new(2, 6, 10)
  slideWedge.CFrame = CFrame.new(slidePos + Vector3.new(0, 3, 7)) * CFrame.Angles(0, math.rad(180), 0)
  slideWedge.Material = Enum.Material.Metal slideWedge.Color = Color3.fromRGB(255, 200, 0) slideWedge.Parent = m
  -- Ladder
  for i = 0, 4 do
    local rung = Instance.new("Part") rung.Anchored = true
    rung.Size = Vector3.new(2, 0.3, 0.3) rung.CFrame = CFrame.new(slidePos + Vector3.new(0, 1 + i * 1.2, -2))
    rung.Material = Enum.Material.Metal rung.Color = metalColor rung.Parent = m
  end

  -- SANDBOX
  local sandboxPos = pos + Vector3.new(10, 0, -8)
  local sandbox = Instance.new("Part") sandbox.Anchored = true
  sandbox.Size = Vector3.new(6, 1, 6) sandbox.CFrame = CFrame.new(sandboxPos + Vector3.new(0, 0.5, 0))
  sandbox.Material = Enum.Material.Sand sandbox.Color = Color3.fromRGB(220, 200, 150) sandbox.Parent = m
  -- Border
  for _, d in ipairs({{3,0,0,6},{-3,0,0,6},{0,0,3,6},{0,0,-3,6}}) do
    local border = Instance.new("Part") border.Anchored = true
    border.Size = Vector3.new(d[4] == 6 and 0.4 or 6.8, 1.2, d[4] == 6 and 6.8 or 0.4)
    border.CFrame = CFrame.new(sandboxPos + Vector3.new(d[1], 0.6, d[3]))
    border.Material = Enum.Material.Wood border.Color = Color3.fromRGB(130, 85, 40) border.Parent = m
  end

  m.Parent = parent or workspace return m
end`,
    pitfalls: [
      'Swing chains should be thin (0.1 stud) metal — not thick ropes',
      'Slide without a ladder to climb up is unusable',
      'Safety surface should be Rubber material — not Grass (its a playground)',
      'Sandbox needs wooden border (Sand material alone blends into ground)',
      'Bright primary colors (red, blue, yellow) match playground aesthetic',
    ],
  },

  {
    name: 'Swimming Pool Area',
    keywords: ['pool', 'swimming', 'diving board', 'lounger', 'sun bed', 'changing room', 'water slide'],
    snippet: `-- SWIMMING POOL AREA (pool, diving board, loungers, changing rooms)
local function buildPool(pos, parent)
  local m = Instance.new("Model") m.Name = "SwimmingPool"

  -- Pool deck (concrete surround)
  local deck = Instance.new("Part") deck.Anchored = true
  deck.Size = Vector3.new(30, 0.5, 20) deck.CFrame = CFrame.new(pos)
  deck.Material = Enum.Material.Concrete deck.Color = Color3.fromRGB(200, 195, 185) deck.Parent = m

  -- Pool basin (cutout — build walls and floor)
  local poolDepth = 4
  local poolW, poolL = 16, 10
  -- Pool floor
  local poolFloor = Instance.new("Part") poolFloor.Anchored = true
  poolFloor.Size = Vector3.new(poolW, 0.5, poolL)
  poolFloor.CFrame = CFrame.new(pos + Vector3.new(0, -poolDepth, 0))
  poolFloor.Material = Enum.Material.Concrete poolFloor.Color = Color3.fromRGB(100, 160, 200) poolFloor.Parent = m
  -- Pool walls (4 sides)
  for _, d in ipairs({
    {poolW/2+0.25, poolL, 0, 0}, {-poolW/2-0.25, poolL, 0, 0},
    {0, poolW, poolL/2+0.25, 90}, {0, poolW, -poolL/2-0.25, 90},
  }) do
    local wall = Instance.new("Part") wall.Anchored = true
    wall.Size = Vector3.new(0.5, poolDepth, d[2])
    wall.CFrame = CFrame.new(pos + Vector3.new(d[1], -poolDepth/2, d[3])) * CFrame.Angles(0, math.rad(d[4]), 0)
    wall.Material = Enum.Material.Concrete wall.Color = Color3.fromRGB(100, 160, 200) wall.Parent = m
  end
  -- Water surface
  local water = Instance.new("Part") water.Anchored = true water.CanCollide = false
  water.Size = Vector3.new(poolW, 0.5, poolL)
  water.CFrame = CFrame.new(pos + Vector3.new(0, -0.5, 0))
  water.Material = Enum.Material.Glass water.Color = Color3.fromRGB(60, 140, 210)
  water.Transparency = 0.35 water.Parent = m

  -- Diving board
  local board = Instance.new("Part") board.Anchored = true
  board.Size = Vector3.new(2, 0.2, 6)
  board.CFrame = CFrame.new(pos + Vector3.new(0, 2, -poolL/2 - 3))
  board.Material = Enum.Material.Concrete board.Color = Color3.fromRGB(230, 225, 215) board.Parent = m
  local boardSupport = Instance.new("Part") boardSupport.Anchored = true
  boardSupport.Size = Vector3.new(2.5, 2, 1.5)
  boardSupport.CFrame = CFrame.new(pos + Vector3.new(0, 1, -poolL/2 - 5.5))
  boardSupport.Material = Enum.Material.Concrete boardSupport.Color = Color3.fromRGB(180, 175, 165) boardSupport.Parent = m

  -- Pool ladder
  for i = 0, 3 do
    local rung = Instance.new("Part") rung.Anchored = true
    rung.Size = Vector3.new(1.5, 0.2, 0.2)
    rung.CFrame = CFrame.new(pos + Vector3.new(poolW/2 - 2, -i * 0.8, poolL/2))
    rung.Material = Enum.Material.Metal rung.Color = Color3.fromRGB(180, 180, 185) rung.Parent = m
  end

  -- Loungers (3 sun beds)
  for i = -1, 1 do
    local lounger = Instance.new("Part") lounger.Anchored = true
    lounger.Size = Vector3.new(2.5, 0.5, 5)
    lounger.CFrame = CFrame.new(pos + Vector3.new(-12, 0.5, i * 4))
    lounger.Material = Enum.Material.Fabric lounger.Color = Color3.fromRGB(220, 220, 220) lounger.Parent = m
    -- Angled headrest
    local headrest = Instance.new("WedgePart") headrest.Anchored = true
    headrest.Size = Vector3.new(2.5, 1.5, 1.5)
    headrest.CFrame = CFrame.new(pos + Vector3.new(-12, 1, i * 4 - 2))
    headrest.Material = Enum.Material.Fabric headrest.Color = Color3.fromRGB(220, 220, 220) headrest.Parent = m
  end

  m.Parent = parent or workspace return m
end`,
    pitfalls: [
      'Pool water must be Glass material + Transparency + CanCollide false',
      'Pool without walls (just a blue floor) looks like a puddle, not a pool',
      'Diving board needs support structure — cannot just float',
      'Pool tiles should be light blue (100, 160, 200) not dark',
      'Lounger headrest should be angled (WedgePart) not flat',
    ],
  },

  {
    name: 'Farm / Barn Build',
    keywords: ['farm', 'barn', 'silo', 'fence', 'crop', 'field', 'tractor', 'hay', 'agriculture', 'ranch'],
    snippet: `-- FARM BUILD (barn, silo, fence, crop rows)
local function buildFarm(pos, parent)
  local m = Instance.new("Model") m.Name = "Farm"

  -- Barn (main structure)
  local barnW, barnH, barnD = 16, 10, 20
  local barnBase = Instance.new("Part") barnBase.Anchored = true
  barnBase.Size = Vector3.new(barnW, barnH, barnD) barnBase.CFrame = CFrame.new(pos + Vector3.new(0, barnH/2, 0))
  barnBase.Material = Enum.Material.WoodPlanks barnBase.Color = Color3.fromRGB(160, 40, 30) barnBase.Parent = m
  -- Barn roof (gambrel style — 2 wedges)
  local roofW = Instance.new("WedgePart") roofW.Anchored = true
  roofW.Size = Vector3.new(barnD, 5, barnW/2 + 1)
  roofW.CFrame = CFrame.new(pos + Vector3.new(barnW/4 + 0.5, barnH + 2.5, 0)) * CFrame.Angles(0, math.rad(90), 0)
  roofW.Material = Enum.Material.Slate roofW.Color = Color3.fromRGB(50, 50, 55) roofW.Parent = m
  local roofW2 = roofW:Clone()
  roofW2.CFrame = CFrame.new(pos + Vector3.new(-barnW/4 - 0.5, barnH + 2.5, 0)) * CFrame.Angles(0, math.rad(-90), 0)
  roofW2.Parent = m
  -- Barn door (large opening)
  local door = Instance.new("Part") door.Anchored = true
  door.Size = Vector3.new(6, 8, 0.5) door.CFrame = CFrame.new(pos + Vector3.new(0, 4, barnD/2 + 0.25))
  door.Material = Enum.Material.WoodPlanks door.Color = Color3.fromRGB(100, 60, 25) door.Parent = m

  -- Silo (cylinder)
  local silo = Instance.new("Part") silo.Shape = Enum.PartType.Cylinder silo.Anchored = true
  silo.Size = Vector3.new(20, 6, 6)
  silo.CFrame = CFrame.new(pos + Vector3.new(15, 10, -5)) * CFrame.Angles(0, 0, math.rad(90))
  silo.Material = Enum.Material.Metal silo.Color = Color3.fromRGB(180, 175, 170) silo.Parent = m
  -- Silo dome
  local siloDome = Instance.new("Part") siloDome.Shape = Enum.PartType.Ball siloDome.Anchored = true
  siloDome.Size = Vector3.new(6, 4, 6) siloDome.CFrame = CFrame.new(pos + Vector3.new(15, 20.5, -5))
  siloDome.Material = Enum.Material.Metal siloDome.Color = Color3.fromRGB(170, 165, 160) siloDome.Parent = m

  -- Crop rows (green rectangles in rows)
  for row = 0, 4 do
    for col = 0, 8 do
      local crop = Instance.new("Part") crop.Anchored = true
      crop.Size = Vector3.new(1.5, 1 + math.random() * 0.5, 1.5)
      crop.CFrame = CFrame.new(pos + Vector3.new(-20 + col * 3, 0.5, 20 + row * 3))
      crop.Material = Enum.Material.Grass
      crop.Color = Color3.fromRGB(50 + math.random(0, 30), 120 + math.random(0, 40), 30 + math.random(0, 20))
      crop.Parent = m
    end
  end

  -- Fence (perimeter around crops)
  for i = -1, 25, 3 do
    local post = Instance.new("Part") post.Anchored = true
    post.Size = Vector3.new(0.4, 3, 0.4) post.CFrame = CFrame.new(pos + Vector3.new(-22, 1.5, 18 + i * 0.6))
    post.Material = Enum.Material.Wood post.Color = Color3.fromRGB(130, 90, 45) post.Parent = m
  end

  m.Parent = parent or workspace return m
end`,
    pitfalls: [
      'Barn should be RED (classic farm color) — not brown or gray',
      'Silo is a cylinder with dome top — not a box',
      'Crop rows should vary height slightly (not uniform)',
      'Wooden fence posts every 3-4 studs with horizontal rails between',
      'Barn door should be oversized (6+ studs wide for tractor access)',
    ],
  },

  // ── MORE GAME MECHANICS ───────────────────────────────────────────────────

  {
    name: 'Gacha / Lootbox System',
    keywords: ['gacha', 'lootbox', 'loot box', 'random', 'pity', 'pull', 'banner', 'egg hatch', 'crate'],
    snippet: `-- GACHA / LOOTBOX (weighted random with pity system)
-- SERVER SCRIPT — NEVER roll on client

local PITY_THRESHOLD = 50 -- Guaranteed legendary after 50 pulls without one
local GUARANTEED_AT = 100  -- Guaranteed MYTHIC at 100 pulls without one

-- Pity tracking per player
local pityCounters = {} -- [userId] = {legendary = 0, mythic = 0}

local function rollWithPity(player: Player, pool: {{name: string, rarity: string, weight: number}})
  local userId = player.UserId
  if not pityCounters[userId] then
    pityCounters[userId] = {legendary = 0, mythic = 0}
  end
  local pity = pityCounters[userId]
  pity.legendary += 1
  pity.mythic += 1

  -- Pity check: force rare outcome
  if pity.mythic >= GUARANTEED_AT then
    pity.mythic = 0
    pity.legendary = 0
    for _, item in pool do
      if item.rarity == "Mythic" then return item end
    end
  end
  if pity.legendary >= PITY_THRESHOLD then
    pity.legendary = 0
    for _, item in pool do
      if item.rarity == "Legendary" then return item end
    end
  end

  -- Normal weighted roll
  local totalWeight = 0
  for _, item in pool do totalWeight += item.weight end
  local roll = math.random() * totalWeight
  for _, item in pool do
    roll -= item.weight
    if roll <= 0 then
      if item.rarity == "Legendary" then pity.legendary = 0 end
      if item.rarity == "Mythic" then pity.mythic = 0 end
      return item
    end
  end
  return pool[1] -- Fallback
end

-- ANIMATION SEQUENCE (server tells client to play):
-- 1. Egg/crate appears, shakes 3 times (0.5s each)
-- 2. Crack/open effect (particles)
-- 3. Item reveal with rarity-colored glow
-- 4. Hold for 2 seconds showing item name + rarity
-- Mythic: extended animation (5s), screen shake, special particles
-- Common: quick animation (2s), minimal effects`,
    pitfalls: [
      'No pity system — player goes 500 pulls without rare (frustration → quit)',
      'Client-side rolls (exploiter gets Mythic every time)',
      'Pity counter not saved to DataStore (resets on rejoin)',
      'Same animation for all rarities (Mythic should feel SPECIAL)',
      'ArePaidRandomItemsRestricted policy not checked (violates Roblox TOS in some regions)',
    ],
  },

  {
    name: 'Prestige / Rebirth System',
    keywords: ['prestige', 'rebirth', 'ascend', 'new game plus', 'reset', 'permanent boost', 'multiplier'],
    snippet: `-- PRESTIGE / REBIRTH SYSTEM (reset progress, gain permanent boost)
-- SERVER SCRIPT

local REBIRTH_REQUIREMENTS = {
  {level = 1, cost = 100000, multiplier = 1.5},
  {level = 2, cost = 500000, multiplier = 2.0},
  {level = 3, cost = 2000000, multiplier = 3.0},
  {level = 4, cost = 10000000, multiplier = 4.5},
  {level = 5, cost = 50000000, multiplier = 7.0}, -- Max prestige
}

local function canPrestige(playerData): (boolean, number?)
  local nextLevel = (playerData.prestigeLevel or 0) + 1
  local req = REBIRTH_REQUIREMENTS[nextLevel]
  if not req then return false, nil end -- Max prestige reached
  if playerData.totalCoins < req.cost then return false, req.cost end
  return true, req.cost
end

local function performPrestige(player: Player)
  local data = getPlayerData(player)
  local canDo, cost = canPrestige(data)
  if not canDo then return false end

  local nextLevel = (data.prestigeLevel or 0) + 1
  local req = REBIRTH_REQUIREMENTS[nextLevel]

  -- WHAT RESETS:
  data.coins = 0
  data.level = 1
  data.xp = 0
  data.unlockedZones = {1}
  data.upgradeLevels = {}
  -- data.backpackContents = {} -- Optional reset

  -- WHAT STAYS:
  -- data.pets (keep all pets)
  -- data.gamepasses (keep all purchases)
  -- data.titles (keep earned titles)
  -- data.totalPlaytime (keep stats)

  -- WHAT IMPROVES:
  data.prestigeLevel = nextLevel
  data.multiplier = req.multiplier
  data.totalCoins = 0 -- Reset for next prestige tracking

  -- PRESTIGE REWARDS:
  data.prestigeTitle = "Prestige " .. nextLevel
  -- Exclusive cosmetic per prestige level
  table.insert(data.unlockedCosmetics, "PrestigeAura_" .. nextLevel)

  -- Notify client
  game.ReplicatedStorage.Remotes.PrestigeComplete:FireClient(player, nextLevel, req.multiplier)
  return true
end`,
    pitfalls: [
      'Resetting too much (keep pets/gamepasses/cosmetics or players feel punished)',
      'Multiplier not impactful enough (1.1x is not worth resetting for — use 1.5x+)',
      'No exclusive prestige rewards (cosmetic auras/titles motivate prestige)',
      'Linear prestige costs (exponential creates proper endgame grind)',
      'Not saving immediately after prestige (data loss = double reset disaster)',
    ],
  },

  {
    name: 'Waypoint / Objective Marker',
    keywords: ['waypoint', 'marker', 'objective', 'arrow', 'quest marker', 'compass', 'direction', 'guide', 'pointer'],
    snippet: `-- WAYPOINT / OBJECTIVE MARKER (BillboardGui arrows pointing to objectives)
-- CLIENT SCRIPT

local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")
local camera = workspace.CurrentCamera

-- Create screen-space marker that points to world position
local function createWaypoint(targetPosition: Vector3, label: string, color: Color3?)
  local sg = Instance.new("ScreenGui") sg.Name = "Waypoint_" .. label
  sg.ResetOnSpawn = false sg.Parent = playerGui

  local markerFrame = Instance.new("Frame")
  markerFrame.Size = UDim2.new(0, 40, 0, 50)
  markerFrame.BackgroundTransparency = 1
  markerFrame.Parent = sg

  -- Arrow indicator
  local arrow = Instance.new("ImageLabel")
  arrow.Size = UDim2.new(0, 30, 0, 30)
  arrow.Position = UDim2.new(0.5, -15, 0, 0)
  arrow.BackgroundTransparency = 1
  arrow.Image = "rbxassetid://6031075938" -- Standard arrow image
  arrow.ImageColor3 = color or Color3.fromRGB(255, 200, 50)
  arrow.Parent = markerFrame

  -- Distance text
  local distLabel = Instance.new("TextLabel")
  distLabel.Size = UDim2.new(1, 0, 0, 16)
  distLabel.Position = UDim2.new(0, 0, 1, -16)
  distLabel.BackgroundTransparency = 1
  distLabel.TextColor3 = Color3.new(1, 1, 1)
  distLabel.TextStrokeTransparency = 0.3
  distLabel.Font = Enum.Font.GothamBold distLabel.TextSize = 11
  distLabel.Parent = markerFrame

  -- Label text
  local nameLabel = Instance.new("TextLabel")
  nameLabel.Size = UDim2.new(0, 120, 0, 16)
  nameLabel.Position = UDim2.new(0.5, -60, 0, 32)
  nameLabel.BackgroundTransparency = 1
  nameLabel.Text = label
  nameLabel.TextColor3 = color or Color3.fromRGB(255, 200, 50)
  nameLabel.TextStrokeTransparency = 0.3
  nameLabel.Font = Enum.Font.GothamMedium nameLabel.TextSize = 12
  nameLabel.Parent = markerFrame

  -- Update position every frame
  local conn
  conn = RunService.RenderStepped:Connect(function()
    local character = player.Character
    if not character or not character:FindFirstChild("HumanoidRootPart") then return end
    local rootPart = character.HumanoidRootPart

    -- Project world position to screen
    local screenPos, onScreen = camera:WorldToScreenPoint(targetPosition)
    local distance = (targetPosition - rootPart.Position).Magnitude

    distLabel.Text = string.format("%.0fm", distance * 0.28) -- Studs to meters

    if onScreen then
      markerFrame.Position = UDim2.new(0, screenPos.X - 20, 0, screenPos.Y - 25)
      markerFrame.Visible = true
    else
      -- Off-screen: clamp to edge of screen
      local viewportSize = camera.ViewportSize
      local dir = (Vector2.new(screenPos.X, screenPos.Y) - viewportSize / 2).Unit
      local edgeX = math.clamp(viewportSize.X / 2 + dir.X * (viewportSize.X / 2 - 40), 20, viewportSize.X - 60)
      local edgeY = math.clamp(viewportSize.Y / 2 + dir.Y * (viewportSize.Y / 2 - 40), 20, viewportSize.Y - 60)
      markerFrame.Position = UDim2.new(0, edgeX, 0, edgeY)
      markerFrame.Visible = true
    end
  end)

  -- Return handle for cleanup
  return {
    destroy = function()
      conn:Disconnect()
      sg:Destroy()
    end,
    updateTarget = function(newPos: Vector3)
      targetPosition = newPos
    end,
  }
end`,
    pitfalls: [
      'Not handling off-screen targets (marker disappears when looking away)',
      'WorldToScreenPoint Z < 0 means behind camera — flip the indicator',
      'Distance text in studs is confusing — convert to meters (× 0.28)',
      'Too many waypoints at once clutters the screen (max 3 active)',
      'Not providing a destroy function (waypoints accumulate on repeated quests)',
    ],
  },

  {
    name: 'Stealth / Detection Mechanic',
    keywords: ['stealth', 'detect', 'detection', 'sneak', 'crouch', 'visibility', 'alert', 'guard', 'patrol', 'hide'],
    snippet: `-- STEALTH / DETECTION MECHANIC (detection meter, crouch, visibility)
-- SERVER SCRIPT

local RunService = game:GetService("RunService")

-- Detection states per guard NPC
local GuardState = { Idle = "Idle", Suspicious = "Suspicious", Alert = "Alert" }

-- Player visibility factors
local function getPlayerVisibility(player: Player): number
  local character = player.Character
  if not character then return 0 end
  local humanoid = character:FindFirstChild("Humanoid") :: Humanoid?
  if not humanoid then return 0 end

  local visibility = 0.5 -- Base visibility

  -- Movement increases visibility
  if humanoid.MoveDirection.Magnitude > 0 then
    visibility += 0.3
  end
  -- Sprinting = very visible
  if humanoid.WalkSpeed > 16 then
    visibility += 0.2
  end
  -- Crouching decreases visibility (detected by custom attribute)
  if character:GetAttribute("Crouching") then
    visibility -= 0.4
  end
  -- In shadow/dark area decreases visibility
  -- (check if player is under a roof or in shadow zone)
  if character:GetAttribute("InShadow") then
    visibility -= 0.3
  end

  return math.clamp(visibility, 0, 1)
end

-- Guard detection logic
local function updateGuard(guard: Model, dt: number)
  local guardRoot = guard:FindFirstChild("HumanoidRootPart")
  if not guardRoot then return end

  local detectionRange = guard:GetAttribute("DetectionRange") or 40
  local fov = guard:GetAttribute("FOV") or 120 -- degrees
  local state = guard:GetAttribute("State") or GuardState.Idle
  local suspicion = guard:GetAttribute("Suspicion") or 0

  for _, player in game.Players:GetPlayers() do
    local character = player.Character
    if not character then continue end
    local playerRoot = character:FindFirstChild("HumanoidRootPart")
    if not playerRoot then continue end

    local distance = (playerRoot.Position - guardRoot.Position).Magnitude
    if distance > detectionRange then continue end

    -- FOV check
    local dirToPlayer = (playerRoot.Position - guardRoot.Position).Unit
    local guardForward = guardRoot.CFrame.LookVector
    local angle = math.deg(math.acos(math.clamp(guardForward:Dot(dirToPlayer), -1, 1)))
    if angle > fov / 2 then continue end

    -- Line of sight check (raycast)
    local params = RaycastParams.new()
    params.FilterDescendantsInstances = {guard}
    local result = workspace:Raycast(guardRoot.Position + Vector3.new(0, 2, 0),
      dirToPlayer * distance, params)
    if result and not result.Instance:IsDescendantOf(character) then continue end

    -- Player is visible! Increase suspicion
    local visibility = getPlayerVisibility(player)
    local distanceFactor = 1 - (distance / detectionRange) -- Closer = more detection
    suspicion += visibility * distanceFactor * dt * 50

    if suspicion >= 100 then
      guard:SetAttribute("State", GuardState.Alert)
      -- Chase player!
    elseif suspicion >= 50 then
      guard:SetAttribute("State", GuardState.Suspicious)
      -- Investigate
    end
  end

  -- Decay suspicion when no player visible
  suspicion = math.max(0, suspicion - dt * 10)
  guard:SetAttribute("Suspicion", suspicion)
end`,
    pitfalls: [
      'No FOV check — guard detects player behind them (unrealistic)',
      'No line-of-sight raycast — guard detects through walls',
      'Detection instant (no suspicion buildup → no tension)',
      'Crouching has no effect on detection (no stealth depth)',
      'Suspicion never decays — once suspicious, always suspicious',
    ],
  },

  {
    name: 'Combo Counter UI',
    keywords: ['combo', 'counter', 'streak', 'multiplier', 'hit counter', 'chain', 'combo system'],
    snippet: `-- COMBO COUNTER (incrementing number with scale animation)
-- CLIENT SCRIPT

local TweenService = game:GetService("TweenService")
local Players = game:GetService("Players")
local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

local sg = Instance.new("ScreenGui") sg.Name = "ComboUI"
sg.ResetOnSpawn = false sg.Parent = playerGui

local comboFrame = Instance.new("Frame")
comboFrame.Size = UDim2.new(0, 200, 0, 80)
comboFrame.Position = UDim2.new(0.5, -100, 0.3, 0)
comboFrame.BackgroundTransparency = 1
comboFrame.Visible = false comboFrame.Parent = sg

local comboNumber = Instance.new("TextLabel")
comboNumber.Size = UDim2.new(1, 0, 0.6, 0)
comboNumber.BackgroundTransparency = 1
comboNumber.TextColor3 = Color3.fromRGB(255, 200, 50)
comboNumber.TextStrokeColor3 = Color3.new(0, 0, 0) comboNumber.TextStrokeTransparency = 0
comboNumber.Font = Enum.Font.GothamBlack comboNumber.TextSize = 48
comboNumber.Parent = comboFrame

local comboLabel = Instance.new("TextLabel")
comboLabel.Size = UDim2.new(1, 0, 0.3, 0) comboLabel.Position = UDim2.new(0, 0, 0.65, 0)
comboLabel.BackgroundTransparency = 1 comboLabel.Text = "COMBO"
comboLabel.TextColor3 = Color3.fromRGB(255, 150, 50)
comboLabel.Font = Enum.Font.GothamBold comboLabel.TextSize = 18
comboLabel.Parent = comboFrame

local scale = Instance.new("UIScale") scale.Parent = comboFrame

local currentCombo = 0
local comboTimer = 0
local COMBO_TIMEOUT = 3 -- Seconds before combo resets

local function incrementCombo()
  currentCombo += 1
  comboTimer = COMBO_TIMEOUT
  comboFrame.Visible = true

  comboNumber.Text = tostring(currentCombo)

  -- Color escalation
  if currentCombo >= 20 then
    comboNumber.TextColor3 = Color3.fromRGB(255, 50, 50) -- Red
  elseif currentCombo >= 10 then
    comboNumber.TextColor3 = Color3.fromRGB(255, 100, 50) -- Orange
  else
    comboNumber.TextColor3 = Color3.fromRGB(255, 200, 50) -- Gold
  end

  -- Pop animation
  scale.Scale = 1.5
  TweenService:Create(scale, TweenInfo.new(0.2, Enum.EasingStyle.Back, Enum.EasingDirection.Out), {
    Scale = 1
  }):Play()
end

local function resetCombo()
  currentCombo = 0
  comboFrame.Visible = false
end

-- Timer to reset combo
game:GetService("RunService").Heartbeat:Connect(function(dt)
  if currentCombo > 0 then
    comboTimer -= dt
    if comboTimer <= 0 then
      resetCombo()
    end
  end
end)`,
    pitfalls: [
      'No timeout — combo never resets once started',
      'No pop animation — counter just changes number (boring)',
      'Same color at all combo levels (escalating colors build excitement)',
      'Combo text too small to notice during combat',
      'Timer not visible (player does not know how long until combo drops)',
    ],
  },

  // ── ADDITIONAL SERVICE ENTRIES ─────────────────────────────────────────────

  {
    name: 'Leaderstats (Standard Roblox Leaderboard)',
    keywords: ['leaderstats', 'leaderboard', 'score', 'stats', 'player list', 'tab', 'kills', 'deaths', 'wins'],
    snippet: `-- LEADERSTATS (built-in Roblox leaderboard that shows in Tab/Player List)
-- SERVER SCRIPT — leaderstats is a SPECIAL folder name Roblox recognizes

game.Players.PlayerAdded:Connect(function(player)
  -- Create leaderstats folder (MUST be named exactly "leaderstats")
  local ls = Instance.new("Folder")
  ls.Name = "leaderstats" -- Case-sensitive! Must be lowercase
  ls.Parent = player

  -- Add stats (appear as columns in Tab leaderboard)
  local kills = Instance.new("IntValue")
  kills.Name = "Kills"
  kills.Value = 0
  kills.Parent = ls

  local deaths = Instance.new("IntValue")
  deaths.Name = "Deaths"
  deaths.Value = 0
  deaths.Parent = ls

  local wins = Instance.new("IntValue")
  wins.Name = "Wins"
  wins.Value = 0
  wins.Parent = ls

  -- StringValue also works (displays text instead of number)
  local rank = Instance.new("StringValue")
  rank.Name = "Rank"
  rank.Value = "Rookie"
  rank.Parent = ls
end)

-- UPDATE STATS (from any server script):
local function addKill(player: Player)
  local ls = player:FindFirstChild("leaderstats")
  if ls and ls:FindFirstChild("Kills") then
    ls.Kills.Value += 1
  end
end

-- HIDE DEFAULT LEADERBOARD (if using custom UI):
-- game.StarterGui:SetCoreGuiEnabled(Enum.CoreGuiType.PlayerList, false)`,
    pitfalls: [
      'Folder must be named EXACTLY "leaderstats" (lowercase, no spaces)',
      'Parent to Player, NOT PlayerGui or Backpack',
      'Use IntValue for numbers, StringValue for text — not NumberValue',
      'Stats are replicated to ALL clients — do not put sensitive data here',
      'Creating leaderstats in LocalScript does NOT show in Tab menu (must be server)',
    ],
  },

  {
    name: 'Touched Events (Safe Pattern)',
    keywords: ['touched', 'touch', 'collision', 'detect', 'trigger zone', 'overlap', 'enter', 'touching'],
    snippet: `-- TOUCHED EVENTS (safe patterns with debounce)
-- Touched fires for EVERY part that collides — including accessories, tools, etc.

-- PATTERN 1: Detect player touching (with debounce)
local debounce = {}
local function onPlayerTouch(part: BasePart)
  part.Touched:Connect(function(hit)
    -- Find the character model
    local character = hit.Parent
    local humanoid = character and character:FindFirstChildOfClass("Humanoid")
    if not humanoid then return end

    -- Find the player
    local player = game.Players:GetPlayerFromCharacter(character)
    if not player then return end

    -- Debounce per player
    if debounce[player.UserId] then return end
    debounce[player.UserId] = true

    -- YOUR LOGIC HERE
    print(player.Name .. " touched " .. part.Name)

    task.delay(1, function()
      debounce[player.UserId] = nil
    end)
  end)
end

-- PATTERN 2: Touch zone (CanCollide = false trigger area)
local function createTriggerZone(position: Vector3, size: Vector3, callback: (Player) -> ())
  local zone = Instance.new("Part")
  zone.Anchored = true
  zone.CanCollide = false
  zone.Transparency = 1 -- Invisible
  zone.Size = size
  zone.Position = position
  zone.Parent = workspace

  local touchedPlayers = {}
  zone.Touched:Connect(function(hit)
    local player = game.Players:GetPlayerFromCharacter(hit.Parent)
    if player and not touchedPlayers[player] then
      touchedPlayers[player] = true
      callback(player)
    end
  end)
  zone.TouchEnded:Connect(function(hit)
    local player = game.Players:GetPlayerFromCharacter(hit.Parent)
    if player then
      touchedPlayers[player] = nil
    end
  end)

  return zone
end

-- PATTERN 3: Use GetPartsInPart instead of Touched (more reliable)
local function checkOverlap(zone: BasePart): {Player}
  local params = OverlapParams.new()
  params.FilterType = Enum.RaycastFilterType.Exclude
  params.FilterDescendantsInstances = {zone}
  local parts = workspace:GetPartsInPart(zone, params)
  local players = {}
  for _, part in parts do
    local player = game.Players:GetPlayerFromCharacter(part.Parent)
    if player and not table.find(players, player) then
      table.insert(players, player)
    end
  end
  return players
end`,
    pitfalls: [
      'Touched fires for accessories/tools — ALWAYS check for Humanoid first',
      'No debounce — Touched fires MANY times per collision (1 touch = 5-20 events)',
      'Touched requires CanCollide=true OR CanTouch=true on at least one part',
      'TouchEnded is unreliable — prefer GetPartsInPart polling for zones',
      'Touched fires on BOTH client and server — put logic on correct side',
    ],
  },

  {
    name: 'Attribute System',
    keywords: ['attribute', 'setattribute', 'getattribute', 'custom property', 'metadata', 'instance data', 'config'],
    snippet: `-- ATTRIBUTES (custom properties on any Instance)
-- Replaced Value objects (IntValue, StringValue, etc.) for most cases

-- SET attributes (works on any Instance)
local part = workspace.MyPart
part:SetAttribute("Health", 100)
part:SetAttribute("Team", "Red")
part:SetAttribute("IsActive", true)
part:SetAttribute("Speed", 16.5)
part:SetAttribute("Color", Color3.fromRGB(255, 0, 0))

-- GET attributes (with defaults)
local health = part:GetAttribute("Health") or 100
local team = part:GetAttribute("Team") or "None"
local isActive = part:GetAttribute("IsActive") ~= false

-- GET ALL attributes
local allAttrs = part:GetAttributes() -- Returns dictionary
for name, value in allAttrs do
  print(name, "=", value)
end

-- LISTEN for attribute changes
part:GetAttributeChangedSignal("Health"):Connect(function()
  local newHealth = part:GetAttribute("Health")
  print("Health changed to:", newHealth)
end)

-- SUPPORTED TYPES:
-- string, number, boolean
-- BrickColor, Color3, Vector2, Vector3
-- CFrame, NumberRange, NumberSequence, ColorSequence
-- Rect, Font, UDim, UDim2
-- NOT supported: Instance references, tables, functions

-- USE CASES:
-- NPC config: part:SetAttribute("DialogueId", "quest_1")
-- Item data: part:SetAttribute("Value", 50)
-- Game state: workspace:SetAttribute("RoundActive", true)
-- Player flags: player:SetAttribute("IsVIP", true)`,
    pitfalls: [
      'Attributes do NOT support tables or Instance references',
      'Attribute names are case-sensitive ("Health" != "health")',
      'Setting attribute to nil removes it (use explicit false for booleans)',
      'Attributes replicate to clients — do not store sensitive server data',
      'GetAttribute returns nil if not set — always provide a default with "or"',
    ],
  },

  {
    name: 'Bezier Curve Path',
    keywords: ['bezier', 'curve', 'path', 'smooth path', 'curved road', 'rail', 'track', 'spline'],
    snippet: `-- BEZIER CURVE PATH (smooth curved roads, rails, tracks)
-- Quadratic bezier: 3 control points
-- Cubic bezier: 4 control points

-- Quadratic bezier point at t (0 to 1)
local function quadBezier(t: number, p0: Vector3, p1: Vector3, p2: Vector3): Vector3
  local u = 1 - t
  return u * u * p0 + 2 * u * t * p1 + t * t * p2
end

-- Cubic bezier point at t (0 to 1)
local function cubicBezier(t: number, p0: Vector3, p1: Vector3, p2: Vector3, p3: Vector3): Vector3
  local u = 1 - t
  return u^3 * p0 + 3 * u^2 * t * p1 + 3 * u * t^2 * p2 + t^3 * p3
end

-- Generate parts along a bezier curve
local function buildCurvePath(points: {Vector3}, segments: number, width: number, parent: Instance?)
  local m = Instance.new("Model") m.Name = "CurvedPath"
  for i = 0, segments - 1 do
    local t1 = i / segments
    local t2 = (i + 1) / segments
    local pos1, pos2
    if #points == 3 then
      pos1 = quadBezier(t1, points[1], points[2], points[3])
      pos2 = quadBezier(t2, points[1], points[2], points[3])
    elseif #points == 4 then
      pos1 = cubicBezier(t1, points[1], points[2], points[3], points[4])
      pos2 = cubicBezier(t2, points[1], points[2], points[3], points[4])
    end
    local mid = (pos1 + pos2) / 2
    local length = (pos2 - pos1).Magnitude
    local part = Instance.new("Part") part.Anchored = true
    part.Size = Vector3.new(width, 0.3, length)
    part.CFrame = CFrame.lookAt(mid, pos2)
    part.Material = Enum.Material.Asphalt part.Color = Color3.fromRGB(60, 60, 60)
    part.Parent = m
  end
  m.Parent = parent or workspace return m
end

-- USAGE:
-- Curved road:
-- buildCurvePath({
--   Vector3.new(0, 0, 0),      -- Start
--   Vector3.new(20, 0, 10),    -- Control point
--   Vector3.new(40, 0, 0),     -- End
-- }, 20, 8)
--
-- S-curve:
-- buildCurvePath({
--   Vector3.new(0, 0, 0),
--   Vector3.new(10, 0, 20),
--   Vector3.new(30, 0, -20),
--   Vector3.new(40, 0, 0),
-- }, 30, 6)`,
    pitfalls: [
      'Too few segments makes curve look angular (20-30 is good for smooth curves)',
      'CFrame.lookAt with parallel vectors (straight up/down) causes errors',
      'Control points too far from line create extreme bends',
      'Not matching segment length (short segments near sharp curves, longer on gentle)',
      'Y position of control points must match terrain or curve floats/clips',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // EXPANSION BATCH 2 — 60+ MORE ENTRIES
  // ═══════════════════════════════════════════════════════════════════════════

  {
    name: 'Underwater Base Construction',
    keywords: ['underwater', 'submarine', 'glass dome', 'ocean base', 'aquatic', 'deep sea', 'bubble', 'water base'],
    snippet: `-- UNDERWATER BASE (glass domes, pipe corridors, sub dock)
local function buildUnderwaterBase(pos, parent)
  local m = Instance.new("Model") m.Name = "UnderwaterBase"
  local metalColor = Color3.fromRGB(70, 80, 95)
  local glassColor = Color3.fromRGB(100, 180, 220)
  -- Main dome (glass hemisphere)
  local dome = Instance.new("Part") dome.Shape = Enum.PartType.Ball dome.Anchored = true
  dome.Size = Vector3.new(30, 30, 30)
  dome.CFrame = CFrame.new(pos) dome.Material = Enum.Material.Glass
  dome.Color = glassColor dome.Transparency = 0.4 dome.Parent = m
  -- Floor inside dome
  local floor = Instance.new("Part") floor.Anchored = true
  floor.Size = Vector3.new(28, 1, 28) floor.CFrame = CFrame.new(pos - Vector3.new(0, 10, 0))
  floor.Material = Enum.Material.DiamondPlate floor.Color = Color3.fromRGB(60, 65, 70) floor.Parent = m
  -- Connecting pipe corridor
  local pipe = Instance.new("Part") pipe.Shape = Enum.PartType.Cylinder pipe.Anchored = true
  pipe.Size = Vector3.new(20, 5, 5) pipe.CFrame = CFrame.new(pos + Vector3.new(25, -5, 0)) * CFrame.Angles(0, math.rad(90), 0)
  pipe.Material = Enum.Material.Metal pipe.Color = metalColor pipe.Parent = m
  -- Glass windows in pipe
  for i = -2, 2 do
    local win = Instance.new("Part") win.Anchored = true
    win.Size = Vector3.new(3, 2, 0.2) win.CFrame = CFrame.new(pos + Vector3.new(20 + i * 4, -3, 2.6))
    win.Material = Enum.Material.Glass win.Color = glassColor win.Transparency = 0.3 win.Parent = m
  end
  -- Interior lights
  for _, lp in ipairs({Vector3.new(0, -5, 0), Vector3.new(25, -5, 0)}) do
    local light = Instance.new("Part") light.Anchored = true light.CanCollide = false
    light.Size = Vector3.new(0.5, 0.2, 0.5) light.CFrame = CFrame.new(pos + lp)
    light.Material = Enum.Material.Neon light.Color = Color3.fromRGB(150, 220, 255) light.Parent = m
    local pl = Instance.new("PointLight") pl.Color = light.Color pl.Brightness = 2 pl.Range = 20 pl.Parent = light
  end
  m.Parent = parent or workspace return m
end`,
    pitfalls: [
      'Glass dome must have Transparency 0.3-0.5 to see through',
      'Interior needs PointLights — underwater is dark without them',
      'Pipe corridors need glass windows or they feel claustrophobic',
      'Use DiamondPlate for floors (industrial/sci-fi feel)',
      'Cool blue tones for lights (150, 220, 255) match underwater theme',
    ],
  },

  {
    name: 'Medieval Village',
    keywords: ['medieval', 'village', 'market', 'well', 'cottage', 'tavern', 'blacksmith', 'stall', 'town'],
    snippet: `-- MEDIEVAL VILLAGE (cottages, market stalls, well, paths)
local function buildVillage(pos, parent)
  local m = Instance.new("Model") m.Name = "MedievalVillage"
  -- Cobblestone path (center road)
  local path = Instance.new("Part") path.Anchored = true
  path.Size = Vector3.new(6, 0.3, 50) path.CFrame = CFrame.new(pos)
  path.Material = Enum.Material.Cobblestone path.Color = Color3.fromRGB(130, 125, 115) path.Parent = m
  -- Cottage function
  local function makeCottage(offset, rot)
    local cm = Instance.new("Model") cm.Name = "Cottage" cm.Parent = m
    local base = Instance.new("Part") base.Anchored = true
    base.Size = Vector3.new(8, 6, 8) base.CFrame = CFrame.new(pos + offset + Vector3.new(0, 3, 0)) * CFrame.Angles(0, rot, 0)
    base.Material = Enum.Material.WoodPlanks base.Color = Color3.fromRGB(180, 160, 120) base.Parent = cm
    -- Timber frame accents (cross beams)
    for _, bOff in ipairs({Vector3.new(0, 0, 4.1), Vector3.new(0, 0, -4.1)}) do
      local beam = Instance.new("Part") beam.Anchored = true
      beam.Size = Vector3.new(7, 0.4, 0.4) beam.CFrame = base.CFrame * CFrame.new(bOff)
      beam.Material = Enum.Material.Wood beam.Color = Color3.fromRGB(80, 50, 25) beam.Parent = cm
    end
    local roof1 = Instance.new("WedgePart") roof1.Anchored = true
    roof1.Size = Vector3.new(10, 4, 6) roof1.CFrame = CFrame.new(pos + offset + Vector3.new(0, 8, -3)) * CFrame.Angles(0, rot, 0)
    roof1.Material = Enum.Material.Slate roof1.Color = Color3.fromRGB(90, 60, 40) roof1.Parent = cm
    local roof2 = roof1:Clone()
    roof2.CFrame = CFrame.new(pos + offset + Vector3.new(0, 8, 3)) * CFrame.Angles(0, rot + math.rad(180), 0)
    roof2.Parent = cm
  end
  makeCottage(Vector3.new(10, 0, -10), 0)
  makeCottage(Vector3.new(-10, 0, 5), math.rad(15))
  makeCottage(Vector3.new(12, 0, 15), math.rad(-10))
  -- Village well
  local wellBase = Instance.new("Part") wellBase.Shape = Enum.PartType.Cylinder wellBase.Anchored = true
  wellBase.Size = Vector3.new(3, 4, 4) wellBase.CFrame = CFrame.new(pos + Vector3.new(-5, 1.5, -5)) * CFrame.Angles(0, 0, math.rad(90))
  wellBase.Material = Enum.Material.Cobblestone wellBase.Color = Color3.fromRGB(140, 135, 125) wellBase.Parent = m
  -- Market stall
  local stall = Instance.new("Part") stall.Anchored = true
  stall.Size = Vector3.new(5, 0.3, 3) stall.CFrame = CFrame.new(pos + Vector3.new(5, 3, 5))
  stall.Material = Enum.Material.WoodPlanks stall.Color = Color3.fromRGB(140, 95, 50) stall.Parent = m
  -- Stall roof (fabric awning)
  local awning = Instance.new("Part") awning.Anchored = true
  awning.Size = Vector3.new(6, 0.2, 4) awning.CFrame = CFrame.new(pos + Vector3.new(5, 5.5, 5)) * CFrame.Angles(math.rad(10), 0, 0)
  awning.Material = Enum.Material.Fabric awning.Color = Color3.fromRGB(180, 40, 40) awning.Parent = m
  m.Parent = parent or workspace return m
end`,
    pitfalls: [
      'Cottages all identical and grid-aligned looks artificial — vary rotation and size',
      'Tudor-style timber frame beams on walls are the #1 medieval detail',
      'Market stalls need a fabric awning (not wood roof — Fabric material)',
      'Village well is a cylinder — not a box',
      'Cobblestone material for paths — not Asphalt (too modern)',
    ],
  },

  {
    name: 'Library / Bookshelf Interior',
    keywords: ['library', 'bookshelf', 'book', 'reading', 'study', 'fireplace', 'spiral staircase', 'knowledge'],
    snippet: `-- LIBRARY INTERIOR (bookshelves, reading area, fireplace)
local function buildLibrary(pos, parent)
  local m = Instance.new("Model") m.Name = "Library"
  -- Floor
  local floor = Instance.new("Part") floor.Anchored = true
  floor.Size = Vector3.new(24, 0.5, 20) floor.CFrame = CFrame.new(pos)
  floor.Material = Enum.Material.WoodPlanks floor.Color = Color3.fromRGB(100, 65, 30) floor.Parent = m
  -- Bookshelves along walls (6 tall shelves)
  for i = 0, 5 do
    local shelf = Instance.new("Part") shelf.Anchored = true
    shelf.Size = Vector3.new(3.5, 8, 1.2)
    shelf.CFrame = CFrame.new(pos + Vector3.new(-10, 4.25, -7 + i * 3))
    shelf.Material = Enum.Material.Wood shelf.Color = Color3.fromRGB(90, 55, 25) shelf.Parent = m
    -- Book rows (colored stripes on shelf face)
    for row = 0, 3 do
      local books = Instance.new("Part") books.Anchored = true
      books.Size = Vector3.new(3, 1.2, 0.8)
      books.CFrame = CFrame.new(pos + Vector3.new(-10, 1.5 + row * 2, -7 + i * 3))
      books.Material = Enum.Material.Fabric
      books.Color = Color3.fromRGB(
        math.random(60, 180), math.random(30, 120), math.random(20, 80)
      )
      books.Parent = m
    end
  end
  -- Reading area (table + chairs)
  local table_p = Instance.new("Part") table_p.Anchored = true
  table_p.Size = Vector3.new(6, 0.3, 4) table_p.CFrame = CFrame.new(pos + Vector3.new(4, 3, 0))
  table_p.Material = Enum.Material.Wood table_p.Color = Color3.fromRGB(110, 70, 35) table_p.Parent = m
  -- Fireplace (back wall)
  local hearth = Instance.new("Part") hearth.Anchored = true
  hearth.Size = Vector3.new(5, 6, 1) hearth.CFrame = CFrame.new(pos + Vector3.new(0, 3, 9.5))
  hearth.Material = Enum.Material.Brick hearth.Color = Color3.fromRGB(120, 60, 40) hearth.Parent = m
  local firePart = Instance.new("Part") firePart.Anchored = true firePart.CanCollide = false
  firePart.Size = Vector3.new(1, 1, 1) firePart.Transparency = 1
  firePart.CFrame = CFrame.new(pos + Vector3.new(0, 1, 9)) firePart.Parent = m
  Instance.new("Fire", firePart).Size = 3
  local fl = Instance.new("PointLight") fl.Color = Color3.fromRGB(255, 160, 60)
  fl.Brightness = 1.5 fl.Range = 15 fl.Parent = firePart
  -- Chandelier light
  local chandelier = Instance.new("Part") chandelier.Anchored = true
  chandelier.Size = Vector3.new(2, 0.3, 2) chandelier.CFrame = CFrame.new(pos + Vector3.new(0, 9.5, 0))
  chandelier.Material = Enum.Material.Metal chandelier.Color = Color3.fromRGB(180, 150, 80) chandelier.Parent = m
  local cl = Instance.new("PointLight") cl.Color = Color3.fromRGB(255, 220, 150)
  cl.Brightness = 2 cl.Range = 25 cl.Parent = chandelier
  m.Parent = parent or workspace return m
end`,
    pitfalls: [
      'Bookshelves without colored book parts look like plain walls',
      'Vary book colors per shelf (randomize RGB in earthy/leather tones)',
      'Fireplace needs Fire instance + PointLight for warm glow',
      'Warm lighting (orange/amber tones) is essential for library atmosphere',
      'WoodPlanks floor with Wood shelves — different brown shades for depth',
    ],
  },

  {
    name: 'Garage / Workshop Build',
    keywords: ['garage', 'workshop', 'workbench', 'tools', 'vehicle lift', 'mechanic', 'tire', 'repair'],
    snippet: `-- GARAGE / WORKSHOP (workbench, tool wall, vehicle lift, tire rack)
local function buildGarage(pos, parent)
  local m = Instance.new("Model") m.Name = "Garage"
  -- Floor (concrete with oil stains)
  local floor = Instance.new("Part") floor.Anchored = true
  floor.Size = Vector3.new(20, 0.5, 16) floor.CFrame = CFrame.new(pos)
  floor.Material = Enum.Material.Concrete floor.Color = Color3.fromRGB(130, 125, 120) floor.Parent = m
  -- Walls
  for _, d in ipairs({{10, 16, 0}, {-10, 16, 0}, {0, 20, 8}}) do
    local wall = Instance.new("Part") wall.Anchored = true
    wall.Size = Vector3.new(d[2], 10, 0.5)
    wall.CFrame = CFrame.new(pos + Vector3.new(d[1], 5, d[3])) * CFrame.Angles(0, d[1] == 0 and math.rad(90) or 0, 0)
    wall.Material = Enum.Material.Concrete wall.Color = Color3.fromRGB(160, 155, 145) wall.Parent = m
  end
  -- Workbench
  local bench = Instance.new("Part") bench.Anchored = true
  bench.Size = Vector3.new(6, 3, 2) bench.CFrame = CFrame.new(pos + Vector3.new(-7, 1.5, 6))
  bench.Material = Enum.Material.Wood bench.Color = Color3.fromRGB(120, 80, 40) bench.Parent = m
  -- Tool pegboard (back of workbench)
  local pegboard = Instance.new("Part") pegboard.Anchored = true
  pegboard.Size = Vector3.new(6, 4, 0.2) pegboard.CFrame = CFrame.new(pos + Vector3.new(-7, 5, 7.5))
  pegboard.Material = Enum.Material.WoodPlanks pegboard.Color = Color3.fromRGB(160, 140, 100) pegboard.Parent = m
  -- Vehicle lift (hydraulic platform)
  local liftBase = Instance.new("Part") liftBase.Anchored = true
  liftBase.Size = Vector3.new(8, 0.5, 12) liftBase.CFrame = CFrame.new(pos + Vector3.new(3, 1.5, 0))
  liftBase.Material = Enum.Material.DiamondPlate liftBase.Color = Color3.fromRGB(80, 80, 85) liftBase.Parent = m
  -- Lift columns
  for _, sx in ipairs({-3, 3}) do
    local col = Instance.new("Part") col.Anchored = true
    col.Size = Vector3.new(0.5, 6, 0.5) col.CFrame = CFrame.new(pos + Vector3.new(3 + sx, 4.5, 0))
    col.Material = Enum.Material.Metal col.Color = Color3.fromRGB(200, 60, 60) col.Parent = m
  end
  -- Tire rack
  for i = 0, 3 do
    local tire = Instance.new("Part") tire.Shape = Enum.PartType.Cylinder tire.Anchored = true
    tire.Size = Vector3.new(0.8, 2, 2) tire.CFrame = CFrame.new(pos + Vector3.new(8, 1 + i * 2.2, -5))
    tire.Material = Enum.Material.Rubber tire.Color = Color3.fromRGB(30, 30, 35) tire.Parent = m
  end
  -- Garage door (large opening, front)
  local garageDoor = Instance.new("Part") garageDoor.Anchored = true
  garageDoor.Size = Vector3.new(14, 8, 0.3) garageDoor.CFrame = CFrame.new(pos + Vector3.new(0, 4, -8))
  garageDoor.Material = Enum.Material.Metal garageDoor.Color = Color3.fromRGB(180, 175, 170) garageDoor.Parent = m
  -- Fluorescent light strip
  local light = Instance.new("Part") light.Anchored = true
  light.Size = Vector3.new(1, 0.2, 12) light.CFrame = CFrame.new(pos + Vector3.new(0, 9.8, 0))
  light.Material = Enum.Material.Neon light.Color = Color3.fromRGB(220, 230, 255) light.Parent = m
  Instance.new("PointLight", light).Color = light.Color
  m.Parent = parent or workspace return m
end`,
    pitfalls: [
      'Garage without vehicle lift or workbench is just an empty room',
      'Tires are cylinders with Rubber material — not boxes',
      'Fluorescent lighting (cool white/blue-white Neon) matches workshop aesthetic',
      'DiamondPlate for lift platform — not smooth concrete',
      'Tool pegboard on wall behind workbench adds workshop character',
    ],
  },

  {
    name: 'Weapon / Tool System',
    keywords: ['weapon', 'tool', 'sword', 'gun', 'equip', 'backpack', 'damage', 'attack', 'melee', 'ranged'],
    snippet: `-- WEAPON / TOOL SYSTEM (equip, attack, damage)
-- SERVER SCRIPT — Tools go in Player.Backpack

-- TOOL SETUP:
-- Tool (Instance) must have Handle (Part) child to work
-- Tool.CanBeDropped = false (prevent dropping)
-- Tool.RequiresHandle = true (default)

-- MELEE WEAPON (sword):
local function createSword()
  local tool = Instance.new("Tool")
  tool.Name = "IronSword"
  tool.CanBeDropped = false
  tool.RequiresHandle = true

  local handle = Instance.new("Part")
  handle.Name = "Handle" -- MUST be named "Handle"
  handle.Size = Vector3.new(0.4, 0.4, 4)
  handle.Material = Enum.Material.Metal
  handle.Color = Color3.fromRGB(180, 180, 190)
  handle.Parent = tool

  -- Blade
  local blade = Instance.new("Part")
  blade.Size = Vector3.new(0.15, 0.8, 3)
  blade.Material = Enum.Material.Metal
  blade.Color = Color3.fromRGB(200, 200, 210)
  blade.CanCollide = false
  blade.Parent = tool
  local weld = Instance.new("WeldConstraint")
  weld.Part0 = handle weld.Part1 = blade weld.Parent = blade
  blade.CFrame = handle.CFrame * CFrame.new(0, 0, -1.5)

  return tool
end

-- ATTACK HANDLING (server-side damage):
local SWORD_DAMAGE = 25
local SWORD_COOLDOWN = 0.5
local attackCooldowns = {}

-- In tool's Activated event:
local function onSwordActivated(player: Player, tool: Tool)
  if attackCooldowns[player.UserId] and tick() - attackCooldowns[player.UserId] < SWORD_COOLDOWN then
    return
  end
  attackCooldowns[player.UserId] = tick()

  local character = player.Character
  if not character then return end
  local rootPart = character:FindFirstChild("HumanoidRootPart")
  if not rootPart then return end

  -- Hitbox check (sphere in front of player)
  local hitboxCenter = rootPart.Position + rootPart.CFrame.LookVector * 5
  local params = OverlapParams.new()
  params.FilterDescendantsInstances = {character}

  local hits = workspace:GetPartBoundsInRadius(hitboxCenter, 5, params)
  local hitPlayers = {}
  for _, part in hits do
    local hitChar = part:FindFirstAncestorOfClass("Model")
    if hitChar and not hitPlayers[hitChar] then
      local humanoid = hitChar:FindFirstChildOfClass("Humanoid")
      if humanoid and humanoid.Health > 0 then
        hitPlayers[hitChar] = true
        humanoid:TakeDamage(SWORD_DAMAGE)
        -- Set damage tag for kill attribution
        local tag = Instance.new("ObjectValue")
        tag.Name = "creator" tag.Value = player
        tag.Parent = humanoid
        game.Debris:AddItem(tag, 3)
      end
    end
  end
end`,
    pitfalls: [
      'Tool without a child named "Handle" (exact name) will not work',
      'Client-side damage (exploiter one-shots everyone — damage MUST be server-side)',
      'No attack cooldown (player swings infinitely fast)',
      'Using Touched for melee hits (unreliable — use GetPartBoundsInRadius)',
      'Hitbox too large (hits through walls — keep radius under 6 studs)',
    ],
  },

  {
    name: 'Tower Defense Pattern',
    keywords: ['tower defense', 'td', 'tower', 'enemy wave', 'path', 'placement', 'upgrade tower', 'spawn wave'],
    snippet: `-- TOWER DEFENSE ARCHITECTURE (waves, paths, tower placement)
-- SERVER SCRIPT

-- ENEMY PATH: Series of waypoints enemies follow
local waypoints = workspace.Path:GetChildren()
table.sort(waypoints, function(a, b) return tonumber(a.Name) < tonumber(b.Name) end)

-- ENEMY SPAWNING:
local WAVES = {
  {enemies = {{type = "Zombie", count = 5, delay = 1}}},
  {enemies = {{type = "Zombie", count = 8, delay = 0.8}, {type = "FastZombie", count = 3, delay = 1.5}}},
  {enemies = {{type = "Tank", count = 2, delay = 2}, {type = "Zombie", count = 10, delay = 0.5}}},
}

local ENEMY_STATS = {
  Zombie = {health = 100, speed = 10, reward = 5},
  FastZombie = {health = 50, speed = 20, reward = 8},
  Tank = {health = 500, speed = 6, reward = 25},
}

local function spawnEnemy(enemyType: string)
  local stats = ENEMY_STATS[enemyType]
  local npc = game.ServerStorage.Enemies[enemyType]:Clone()
  npc.Parent = workspace.Enemies
  local humanoid = npc:FindFirstChildOfClass("Humanoid")
  humanoid.MaxHealth = stats.health
  humanoid.Health = stats.health
  humanoid.WalkSpeed = stats.speed
  -- Follow waypoints
  task.spawn(function()
    for _, wp in ipairs(waypoints) do
      humanoid:MoveTo(wp.Position)
      humanoid.MoveToFinished:Wait()
    end
    -- Reached end = player takes damage
    humanoid:TakeDamage(math.huge)
    -- Reduce player lives
  end)
  humanoid.Died:Connect(function()
    -- Award money to player who killed it
  end)
end

-- TOWER SYSTEM:
local TOWER_STATS = {
  Archer = {damage = 10, range = 30, fireRate = 1, cost = 100},
  Mage = {damage = 25, range = 20, fireRate = 0.5, cost = 250},
  Cannon = {damage = 50, range = 15, fireRate = 0.3, cost = 500, splash = 5},
}

local function towerAttackLoop(tower: Model, stats)
  while tower.Parent do
    -- Find nearest enemy in range
    local nearest, nearestDist = nil, stats.range
    for _, enemy in workspace.Enemies:GetChildren() do
      local dist = (enemy:GetPivot().Position - tower:GetPivot().Position).Magnitude
      if dist < nearestDist then
        nearest = enemy nearestDist = dist
      end
    end
    if nearest then
      local humanoid = nearest:FindFirstChildOfClass("Humanoid")
      if humanoid and humanoid.Health > 0 then
        humanoid:TakeDamage(stats.damage)
        -- Fire visual (client-side via remote)
      end
    end
    task.wait(1 / stats.fireRate)
  end
end`,
    pitfalls: [
      'Enemies not following waypoints in order (sort by name/number)',
      'Tower targeting closest to tower instead of closest to end (strategic difference)',
      'No splash damage calculation for AOE towers',
      'Client-side tower placement without server validation',
      'Waves spawning all at once instead of staggered (use delay between enemies)',
    ],
  },

  {
    name: 'Battle Royale Mechanics',
    keywords: ['battle royale', 'br', 'shrinking zone', 'storm', 'loot', 'last man standing', 'safe zone', 'circle'],
    snippet: `-- BATTLE ROYALE CORE MECHANICS (shrinking zone, loot, elimination)
-- SERVER SCRIPT

-- SHRINKING SAFE ZONE:
local ZONE_PHASES = {
  {radius = 200, shrinkTime = 60, waitTime = 30, damagePerSecond = 5},
  {radius = 120, shrinkTime = 45, waitTime = 25, damagePerSecond = 10},
  {radius = 60, shrinkTime = 30, waitTime = 20, damagePerSecond = 20},
  {radius = 20, shrinkTime = 20, waitTime = 15, damagePerSecond = 50},
  {radius = 5, shrinkTime = 10, waitTime = 10, damagePerSecond = 100},
}

local zoneCenter = Vector3.new(0, 0, 0)
local currentRadius = 300 -- Starting radius
local currentPhase = 0

local function startZoneShrink()
  for _, phase in ipairs(ZONE_PHASES) do
    currentPhase += 1
    -- Wait period (safe zone stays)
    task.wait(phase.waitTime)
    -- Shrink period
    local startRadius = currentRadius
    local startTime = tick()
    while tick() - startTime < phase.shrinkTime do
      local progress = (tick() - startTime) / phase.shrinkTime
      currentRadius = startRadius + (phase.radius - startRadius) * progress
      -- Update zone visual on all clients
      game.ReplicatedStorage.Remotes.ZoneUpdate:FireAllClients(zoneCenter, currentRadius)
      task.wait(0.5)
    end
    currentRadius = phase.radius
  end
end

-- STORM DAMAGE (check players outside zone):
game:GetService("RunService").Heartbeat:Connect(function()
  if currentPhase == 0 then return end
  local phase = ZONE_PHASES[math.min(currentPhase, #ZONE_PHASES)]
  for _, player in game.Players:GetPlayers() do
    local char = player.Character
    if not char then continue end
    local rootPart = char:FindFirstChild("HumanoidRootPart")
    if not rootPart then continue end
    local humanoid = char:FindFirstChildOfClass("Humanoid")
    if not humanoid or humanoid.Health <= 0 then continue end
    local distance = (rootPart.Position - zoneCenter).Magnitude
    if distance > currentRadius then
      humanoid:TakeDamage(phase.damagePerSecond / 30) -- Per frame at 30Hz
    end
  end
end)

-- LOOT SPAWNING:
local LOOT_TABLE = {
  {item = "Pistol", weight = 30},
  {item = "Shotgun", weight = 20},
  {item = "Rifle", weight = 15},
  {item = "Medkit", weight = 25},
  {item = "Shield", weight = 10},
}`,
    pitfalls: [
      'Zone damage calculated on client (exploiter ignores storm)',
      'Shrinking too fast — players cannot outrun zone',
      'No visual zone indicator (players cannot see where safe area is)',
      'Loot all in same spot (spread randomly across map)',
      'Not handling player disconnect during match (counts as elimination)',
    ],
  },

  {
    name: 'Cutscene / Cinematic System',
    keywords: ['cutscene', 'cinematic', 'camera path', 'intro', 'outro', 'movie', 'scripted sequence', 'animation'],
    snippet: `-- CUTSCENE SYSTEM (waypoint-based camera path with events)
-- CLIENT SCRIPT

local TweenService = game:GetService("TweenService")
local camera = workspace.CurrentCamera

-- Define cutscene as sequence of camera positions + events
local function playCutscene(keyframes: {{cframe: CFrame, duration: number, event: string?}})
  camera.CameraType = Enum.CameraType.Scriptable

  for i, kf in ipairs(keyframes) do
    -- Tween camera to keyframe position
    local tween = TweenService:Create(camera, TweenInfo.new(
      kf.duration,
      Enum.EasingStyle.Cubic,
      Enum.EasingDirection.InOut
    ), {CFrame = kf.cframe})
    tween:Play()
    tween.Completed:Wait()

    -- Fire event if defined
    if kf.event then
      if kf.event == "ShowTitle" then
        -- Show title card GUI
      elseif kf.event == "PlaySound" then
        -- Play dramatic music sting
      elseif kf.event == "FadeOut" then
        -- Fade screen to black
      end
    end
  end

  -- Restore camera
  camera.CameraType = Enum.CameraType.Custom
end

-- EXAMPLE: Intro flyover
-- playCutscene({
--   {cframe = CFrame.lookAt(Vector3.new(0, 100, 200), Vector3.zero), duration = 3},
--   {cframe = CFrame.lookAt(Vector3.new(50, 30, 50), Vector3.zero), duration = 2, event = "ShowTitle"},
--   {cframe = CFrame.lookAt(Vector3.new(0, 10, 10), Vector3.new(0, 5, 0)), duration = 2},
-- })

-- SKIP FUNCTIONALITY:
-- Let player press any key to skip
-- UserInputService.InputBegan:Connect(function(input, processed)
--   if not processed and cutscenePlaying then
--     skipCutscene = true
--   end
-- end)`,
    pitfalls: [
      'No skip option (players hate unskippable cutscenes)',
      'CameraType not set to Scriptable first (camera fights tweens)',
      'Not restoring CameraType after cutscene (player stuck in scriptable mode)',
      'Cutscene blocks gameplay without warning',
      'Using Linear easing (Cubic InOut looks much more cinematic)',
    ],
  },

  {
    name: 'Day/Night Cycle',
    keywords: ['day night', 'cycle', 'time', 'clock', 'daytime', 'nighttime', 'sunrise', 'sunset', 'day cycle'],
    snippet: `-- DAY/NIGHT CYCLE (smooth time progression with lighting changes)
-- SERVER SCRIPT

local Lighting = game:GetService("Lighting")
local RunService = game:GetService("RunService")

-- Config
local CYCLE_DURATION = 720 -- seconds for full day (12 minutes)
local START_TIME = 8 -- 8 AM

-- Lighting presets by time of day
local function updateLighting(hour: number)
  -- Dawn (5-7)
  if hour >= 5 and hour < 7 then
    Lighting.Ambient = Color3.fromRGB(60, 50, 70)
    Lighting.OutdoorAmbient = Color3.fromRGB(100, 80, 90)
    Lighting.Brightness = 1 + (hour - 5) / 2
  -- Day (7-17)
  elseif hour >= 7 and hour < 17 then
    Lighting.Ambient = Color3.fromRGB(80, 80, 90)
    Lighting.OutdoorAmbient = Color3.fromRGB(130, 130, 140)
    Lighting.Brightness = 2.5
  -- Sunset (17-19)
  elseif hour >= 17 and hour < 19 then
    Lighting.Ambient = Color3.fromRGB(80, 50, 30)
    Lighting.OutdoorAmbient = Color3.fromRGB(160, 100, 60)
    Lighting.Brightness = 2 - (hour - 17) / 2
  -- Night (19-5)
  else
    Lighting.Ambient = Color3.fromRGB(15, 15, 25)
    Lighting.OutdoorAmbient = Color3.fromRGB(20, 20, 35)
    Lighting.Brightness = 0.5
  end
end

-- Main cycle loop
local startTime = tick()
Lighting.ClockTime = START_TIME

RunService.Heartbeat:Connect(function(dt)
  local elapsed = tick() - startTime
  local progress = (elapsed % CYCLE_DURATION) / CYCLE_DURATION
  local hour = (progress * 24) % 24
  Lighting.ClockTime = hour
  updateLighting(hour)
end)

-- OPTIONAL: Let players vote for time skip
-- OPTIONAL: Different cycle speeds for different game modes`,
    pitfalls: [
      'Cycle too fast (< 5 minutes) is disorienting — 8-15 minutes is standard',
      'Not updating Ambient/Brightness with time (sun moves but lighting stays same)',
      'Night too dark without streetlights/torches (players cannot see anything)',
      'Not syncing time across all clients (use server-side clock)',
      'Sudden lighting jumps between presets (interpolate smoothly)',
    ],
  },

  {
    name: 'NPC Shop System',
    keywords: ['shop', 'npc shop', 'buy', 'sell', 'merchant', 'vendor', 'store', 'purchase', 'coins'],
    snippet: `-- NPC SHOP (ProximityPrompt + server validation + client UI)
-- SERVER SCRIPT

local SHOP_ITEMS = {
  {id = "health_potion", name = "Health Potion", price = 50, icon = "rbxassetid://123"},
  {id = "speed_boost", name = "Speed Boost", price = 100, icon = "rbxassetid://456"},
  {id = "iron_sword", name = "Iron Sword", price = 250, icon = "rbxassetid://789"},
  {id = "shield", name = "Shield", price = 200, icon = "rbxassetid://012"},
}

-- Setup shop NPC
local shopNPC = workspace.ShopNPC
local prompt = Instance.new("ProximityPrompt")
prompt.ActionText = "Shop"
prompt.ObjectText = "Merchant"
prompt.MaxActivationDistance = 10
prompt.HoldDuration = 0
prompt.Parent = shopNPC:FindFirstChild("HumanoidRootPart") or shopNPC:FindFirstChildWhichIsA("BasePart")

-- Open shop UI on client
prompt.Triggered:Connect(function(player)
  game.ReplicatedStorage.Remotes.OpenShop:FireClient(player, SHOP_ITEMS)
end)

-- Handle purchase (server validates everything)
local BuyRemote = game.ReplicatedStorage.Remotes.BuyItem
BuyRemote.OnServerEvent:Connect(function(player, itemId)
  -- Validate input
  if typeof(itemId) ~= "string" then return end

  -- Find item
  local item = nil
  for _, shopItem in SHOP_ITEMS do
    if shopItem.id == itemId then item = shopItem break end
  end
  if not item then return end

  -- Check player can afford
  local playerCoins = getCoins(player)
  if playerCoins < item.price then
    BuyRemote:FireClient(player, false, "Not enough coins!")
    return
  end

  -- Check player is near NPC (anti-exploit)
  local character = player.Character
  if not character then return end
  local rootPart = character:FindFirstChild("HumanoidRootPart")
  if not rootPart then return end
  local npcPos = shopNPC:GetPivot().Position
  if (rootPart.Position - npcPos).Magnitude > 20 then return end

  -- Process purchase
  deductCoins(player, item.price)
  addToInventory(player, item.id)
  BuyRemote:FireClient(player, true, item.name .. " purchased!")
end)`,
    pitfalls: [
      'Purchase processed without distance check (player buys from across map)',
      'Client-side coin deduction (exploiter gets items for free)',
      'Item ID from client not validated against shop catalog',
      'No purchase confirmation feedback to client',
      'Shop items defined only on client (server cannot validate prices)',
    ],
  },

  {
    name: 'Elevator System',
    keywords: ['elevator', 'lift', 'floor', 'button', 'door', 'vertical', 'transport', 'level'],
    snippet: `-- ELEVATOR SYSTEM (multi-floor, door open/close, platform movement)
-- SERVER SCRIPT

local TweenService = game:GetService("TweenService")

local function setupElevator(elevatorModel: Model)
  local platform = elevatorModel:FindFirstChild("Platform") :: BasePart
  local doors = elevatorModel:FindFirstChild("Doors") -- Model with Left/Right door parts
  if not platform then return end

  local floors = {} -- {height, button}
  for _, child in elevatorModel:GetChildren() do
    if child.Name:match("Floor%d+") then
      local num = tonumber(child.Name:match("%d+"))
      floors[num] = child:GetPivot().Position.Y
    end
  end

  local currentFloor = 1
  local isMoving = false

  local function openDoors()
    if not doors then return end
    local left = doors:FindFirstChild("Left")
    local right = doors:FindFirstChild("Right")
    if left then
      TweenService:Create(left, TweenInfo.new(0.8, Enum.EasingStyle.Quad), {
        CFrame = left.CFrame * CFrame.new(-2, 0, 0)
      }):Play()
    end
    if right then
      TweenService:Create(right, TweenInfo.new(0.8, Enum.EasingStyle.Quad), {
        CFrame = right.CFrame * CFrame.new(2, 0, 0)
      }):Play()
    end
    task.wait(0.8)
  end

  local function closeDoors()
    if not doors then return end
    local left = doors:FindFirstChild("Left")
    local right = doors:FindFirstChild("Right")
    if left then
      TweenService:Create(left, TweenInfo.new(0.8, Enum.EasingStyle.Quad), {
        CFrame = left.CFrame * CFrame.new(2, 0, 0)
      }):Play()
    end
    if right then
      TweenService:Create(right, TweenInfo.new(0.8, Enum.EasingStyle.Quad), {
        CFrame = right.CFrame * CFrame.new(-2, 0, 0)
      }):Play()
    end
    task.wait(0.8)
  end

  local function goToFloor(floorNum: number)
    if isMoving or floorNum == currentFloor then return end
    if not floors[floorNum] then return end
    isMoving = true

    closeDoors()

    -- Move platform
    local targetY = floors[floorNum]
    local travelTime = math.abs(targetY - platform.Position.Y) / 10 -- 10 studs/sec
    TweenService:Create(platform, TweenInfo.new(travelTime, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut), {
      CFrame = CFrame.new(platform.Position.X, targetY, platform.Position.Z)
    }):Play()
    task.wait(travelTime)

    currentFloor = floorNum
    openDoors()
    isMoving = false
  end

  -- Buttons (ProximityPrompts)
  for floorNum, _ in pairs(floors) do
    local button = elevatorModel:FindFirstChild("Button" .. floorNum)
    if button then
      local pp = Instance.new("ProximityPrompt")
      pp.ActionText = "Floor " .. floorNum
      pp.MaxActivationDistance = 6
      pp.Parent = button
      pp.Triggered:Connect(function() goToFloor(floorNum) end)
    end
  end
end`,
    pitfalls: [
      'Elevator moving while doors are open (close doors first, then move)',
      'Platform not carrying players (must be Anchored and player stands on it)',
      'No isMoving check (pressing button mid-travel causes glitches)',
      'Doors tweening in wrong direction on repeated open/close',
      'Sine InOut easing on platform makes smooth start/stop (not Linear)',
    ],
  },

  {
    name: 'Inventory Save/Load (DataStore)',
    keywords: ['inventory save', 'save items', 'load items', 'serialize', 'deserialize', 'item data', 'persist inventory'],
    snippet: `-- INVENTORY SAVE/LOAD (serialize items to DataStore-compatible format)
-- SERVER SCRIPT

local DataStoreService = game:GetService("DataStoreService")
local inventoryStore = DataStoreService:GetDataStore("Inventories_v1")

-- Item structure (what gets saved)
-- Items stored as: {[slotIndex] = {id = "iron_sword", count = 1, data = {}}}

local function serializeInventory(inventory: {[number]: {id: string, count: number, data: {}?}}): string
  local HttpService = game:GetService("HttpService")
  return HttpService:JSONEncode(inventory)
end

local function deserializeInventory(json: string): {[number]: {id: string, count: number, data: {}?}}
  local HttpService = game:GetService("HttpService")
  local success, result = pcall(function()
    return HttpService:JSONDecode(json)
  end)
  return success and result or {}
end

local function saveInventory(player: Player, inventory)
  local key = "Inv_" .. player.UserId
  local serialized = serializeInventory(inventory)
  -- Check size limit (DataStore max 4MB per key)
  if #serialized > 4000000 then
    warn("Inventory too large for", player.Name)
    return false
  end
  local success, err = pcall(function()
    inventoryStore:SetAsync(key, serialized)
  end)
  if not success then warn("Save failed:", err) end
  return success
end

local function loadInventory(player: Player)
  local key = "Inv_" .. player.UserId
  local success, data = pcall(function()
    return inventoryStore:GetAsync(key)
  end)
  if success and data then
    return deserializeInventory(data)
  end
  return {} -- Empty inventory for new players
end

-- INVENTORY SIZE LIMITS:
-- Free: 20 slots
-- VIP: 50 slots
-- Premium: 100 slots
local function getMaxSlots(player: Player): number
  if hasGamepass(player, VIP_GAMEPASS_ID) then return 50 end
  return 20
end

-- ADD ITEM (with stacking):
local function addItem(player: Player, itemId: string, count: number): boolean
  local inv = playerInventories[player.UserId]
  local maxSlots = getMaxSlots(player)

  -- Try to stack with existing
  for slot, item in pairs(inv) do
    if item.id == itemId then
      item.count += count
      return true
    end
  end

  -- Find empty slot
  for i = 1, maxSlots do
    if not inv[i] then
      inv[i] = {id = itemId, count = count}
      return true
    end
  end

  return false -- Inventory full
end`,
    pitfalls: [
      'Not using JSON serialization (tables with non-string keys break DataStore)',
      'Inventory size exceeding 4MB DataStore limit (cap slot count)',
      'Not handling inventory full state (silently dropping items)',
      'Loading inventory on client instead of server (exploitable)',
      'No version in DataStore key (impossible to migrate schema later)',
    ],
  },

  {
    name: 'Knockback / Force Application',
    keywords: ['knockback', 'force', 'push', 'repel', 'explosion', 'blast', 'launch', 'velocity', 'impulse'],
    snippet: `-- KNOCKBACK / FORCE APPLICATION (physics-based, server-side)
-- Used for: explosions, melee attacks, abilities, traps

-- PATTERN 1: LinearVelocity impulse (modern, preferred)
local function applyKnockback(character: Model, direction: Vector3, force: number, duration: number?)
  local rootPart = character:FindFirstChild("HumanoidRootPart")
  if not rootPart then return end

  -- Create attachment if needed
  local attachment = rootPart:FindFirstChild("KnockbackAttachment")
  if not attachment then
    attachment = Instance.new("Attachment")
    attachment.Name = "KnockbackAttachment"
    attachment.Parent = rootPart
  end

  -- Apply impulse via LinearVelocity
  local lv = Instance.new("LinearVelocity")
  lv.Attachment0 = attachment
  lv.VectorVelocity = direction.Unit * force
  lv.MaxForce = 50000
  lv.RelativeTo = Enum.ActuatorRelativeTo.World
  lv.Parent = rootPart

  -- Remove after duration
  game.Debris:AddItem(lv, duration or 0.2)
end

-- PATTERN 2: Explosion-style radial knockback
local function explosionKnockback(center: Vector3, radius: number, force: number)
  local params = OverlapParams.new()
  local parts = workspace:GetPartBoundsInRadius(center, radius, params)
  local affected = {}
  for _, part in parts do
    local character = part:FindFirstAncestorOfClass("Model")
    if character and not affected[character] then
      local humanoid = character:FindFirstChildOfClass("Humanoid")
      if humanoid then
        affected[character] = true
        local rootPart = character:FindFirstChild("HumanoidRootPart")
        if rootPart then
          local dir = (rootPart.Position - center)
          local distance = dir.Magnitude
          local falloff = 1 - math.clamp(distance / radius, 0, 1)
          applyKnockback(character, dir.Unit + Vector3.new(0, 0.5, 0), force * falloff, 0.3)
        end
      end
    end
  end
end

-- PATTERN 3: Directional slam (forward + up)
local function slamKnockback(attacker: Model, target: Model, force: number)
  local attackerRoot = attacker:FindFirstChild("HumanoidRootPart")
  local targetRoot = target:FindFirstChild("HumanoidRootPart")
  if not attackerRoot or not targetRoot then return end
  local direction = (targetRoot.Position - attackerRoot.Position).Unit
  direction = direction + Vector3.new(0, 0.8, 0) -- Add upward arc
  applyKnockback(target, direction, force, 0.25)
end`,
    pitfalls: [
      'Using deprecated BodyVelocity (use LinearVelocity instead)',
      'Force too high launches players out of map (cap at 100-150)',
      'Not adding upward component (knockback slides along ground, not dramatic)',
      'No Debris cleanup on LinearVelocity (player stuck moving forever)',
      'Client-side knockback (desyncs with server — apply on server)',
    ],
  },

  {
    name: 'Notification / Toast System',
    keywords: ['notification', 'toast', 'popup', 'alert', 'message', 'announce', 'banner', 'info popup'],
    snippet: `-- NOTIFICATION / TOAST SYSTEM (slide-in messages)
-- CLIENT SCRIPT

local TweenService = game:GetService("TweenService")
local Players = game:GetService("Players")
local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

local sg = Instance.new("ScreenGui") sg.Name = "Notifications"
sg.ResetOnSpawn = false sg.Parent = playerGui

local container = Instance.new("Frame")
container.Size = UDim2.new(0.3, 0, 0.4, 0)
container.Position = UDim2.new(0.69, 0, 0.55, 0)
container.BackgroundTransparency = 1 container.Parent = sg
local layout = Instance.new("UIListLayout") layout.Padding = UDim.new(0, 6)
layout.VerticalAlignment = Enum.VerticalAlignment.Bottom layout.Parent = container

local ICON_COLORS = {
  info = Color3.fromRGB(50, 150, 255),
  success = Color3.fromRGB(50, 200, 80),
  warning = Color3.fromRGB(255, 180, 50),
  error = Color3.fromRGB(255, 60, 60),
  reward = Color3.fromRGB(212, 175, 55),
}

local function showNotification(text: string, notifType: string?, duration: number?)
  local color = ICON_COLORS[notifType or "info"]
  local dur = duration or 4

  local toast = Instance.new("Frame")
  toast.Size = UDim2.new(1, 0, 0, 50)
  toast.BackgroundColor3 = Color3.fromRGB(20, 24, 32)
  toast.Parent = container
  Instance.new("UICorner", toast).CornerRadius = UDim.new(0, 8)
  local stroke = Instance.new("UIStroke", toast) stroke.Color = color stroke.Thickness = 1

  -- Accent bar (left side color indicator)
  local accent = Instance.new("Frame")
  accent.Size = UDim2.new(0, 4, 1, 0) accent.BackgroundColor3 = color accent.Parent = toast
  Instance.new("UICorner", accent).CornerRadius = UDim.new(0, 8)

  -- Text
  local label = Instance.new("TextLabel")
  label.Size = UDim2.new(1, -16, 1, 0) label.Position = UDim2.new(0, 12, 0, 0)
  label.BackgroundTransparency = 1 label.Text = text
  label.TextColor3 = Color3.fromRGB(220, 220, 225)
  label.Font = Enum.Font.GothamMedium label.TextSize = 14
  label.TextWrapped = true label.TextXAlignment = Enum.TextXAlignment.Left
  label.Parent = toast

  -- Slide in from right
  toast.Position = UDim2.new(1.2, 0, 0, 0)
  TweenService:Create(toast, TweenInfo.new(0.3, Enum.EasingStyle.Back, Enum.EasingDirection.Out), {
    Position = UDim2.new(0, 0, 0, 0)
  }):Play()

  -- Fade out after duration
  task.delay(dur, function()
    TweenService:Create(toast, TweenInfo.new(0.3, Enum.EasingStyle.Quad, Enum.EasingDirection.In), {
      Position = UDim2.new(1.2, 0, 0, 0)
    }):Play()
    task.delay(0.3, function() toast:Destroy() end)
  end)
end

-- Listen for server notifications
game.ReplicatedStorage.Remotes.Notification.OnClientEvent:Connect(showNotification)`,
    pitfalls: [
      'Notifications stacking infinitely (use UIListLayout + max 5 visible)',
      'No slide animation (instant pop is jarring — use Back easing slide-in)',
      'All same color (type-based colors help player distinguish info/error/reward)',
      'Toast not destroyed after fade-out (invisible frames accumulate)',
      'Duration too short (< 2s) — player misses the notification',
    ],
  },

  {
    name: 'Particle Presets (Fire, Smoke, Magic, Sparks)',
    keywords: ['particle preset', 'fire effect', 'smoke effect', 'magic effect', 'spark', 'flame', 'ember', 'dust'],
    snippet: `-- PARTICLE PRESETS (ready-to-use effects)

-- FIRE PRESET (attach to any Part)
local function addFire(parent: BasePart)
  local e = Instance.new("ParticleEmitter") e.Name = "FireEffect"
  e.Rate = 80 e.Lifetime = NumberRange.new(0.5, 1.2)
  e.Speed = NumberRange.new(3, 6) e.SpreadAngle = Vector2.new(10, 10)
  e.EmissionDirection = Enum.NormalId.Top
  e.Acceleration = Vector3.new(0, 5, 0)
  e.Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0, 1.5), NumberSequenceKeypoint.new(0.5, 1),
    NumberSequenceKeypoint.new(1, 0)
  })
  e.Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0, Color3.fromRGB(255, 200, 50)),
    ColorSequenceKeypoint.new(0.4, Color3.fromRGB(255, 100, 0)),
    ColorSequenceKeypoint.new(1, Color3.fromRGB(100, 30, 0))
  })
  e.Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0, 0), NumberSequenceKeypoint.new(0.8, 0.3),
    NumberSequenceKeypoint.new(1, 1)
  })
  e.LightEmission = 0.8 e.Parent = parent
  local pl = Instance.new("PointLight") pl.Color = Color3.fromRGB(255, 150, 50)
  pl.Brightness = 2 pl.Range = 15 pl.Parent = parent
  return e
end

-- SMOKE PRESET
local function addSmoke(parent: BasePart)
  local e = Instance.new("ParticleEmitter") e.Name = "SmokeEffect"
  e.Rate = 30 e.Lifetime = NumberRange.new(2, 4)
  e.Speed = NumberRange.new(1, 3) e.SpreadAngle = Vector2.new(20, 20)
  e.EmissionDirection = Enum.NormalId.Top
  e.Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0, 0.5), NumberSequenceKeypoint.new(1, 4)
  })
  e.Color = ColorSequence.new(Color3.fromRGB(80, 80, 90))
  e.Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0, 0.3), NumberSequenceKeypoint.new(1, 1)
  })
  e.LightEmission = 0 e.Drag = 3 e.Parent = parent
  return e
end

-- MAGIC SPARKLE PRESET
local function addMagicSparkle(parent: BasePart, color: Color3?)
  local c = color or Color3.fromRGB(150, 100, 255)
  local e = Instance.new("ParticleEmitter") e.Name = "MagicEffect"
  e.Rate = 15 e.Lifetime = NumberRange.new(1, 2)
  e.Speed = NumberRange.new(0.5, 2) e.SpreadAngle = Vector2.new(180, 180)
  e.Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0, 0), NumberSequenceKeypoint.new(0.3, 0.3),
    NumberSequenceKeypoint.new(0.7, 0.3), NumberSequenceKeypoint.new(1, 0)
  })
  e.Color = ColorSequence.new(c) e.LightEmission = 1 e.Brightness = 3
  e.Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0, 0.5), NumberSequenceKeypoint.new(1, 1)
  })
  e.RotSpeed = NumberRange.new(-90, 90) e.Parent = parent
  return e
end

-- SPARKS PRESET (welding, impact)
local function addSparks(parent: BasePart)
  local e = Instance.new("ParticleEmitter") e.Name = "SparksEffect"
  e.Rate = 0 e.Lifetime = NumberRange.new(0.3, 0.8)
  e.Speed = NumberRange.new(10, 25) e.SpreadAngle = Vector2.new(60, 60)
  e.Acceleration = Vector3.new(0, -40, 0) -- Gravity
  e.Size = NumberSequence.new(0.1)
  e.Color = ColorSequence.new(Color3.fromRGB(255, 200, 50))
  e.LightEmission = 1 e.Brightness = 5
  e.Enabled = false e.Parent = parent
  -- Burst: e:Emit(20) to fire 20 sparks
  return e
end`,
    pitfalls: [
      'Fire without PointLight looks flat (always pair with warm PointLight)',
      'Smoke Rate too high on mobile (30 is reasonable, not 100+)',
      'Magic particles need LightEmission = 1 for glow effect',
      'Sparks should use Enabled = false + Emit() for burst, not continuous Rate',
      'ParticleEmitter must be child of BasePart — not Model or Folder',
    ],
  },

  {
    name: 'Leaderboard UI (Custom)',
    keywords: ['leaderboard ui', 'rankings', 'top players', 'scoreboard', 'custom leaderboard', 'ranking display'],
    snippet: `-- CUSTOM LEADERBOARD UI (replace default Tab list with styled version)
-- CLIENT SCRIPT

local Players = game:GetService("Players")
local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

-- Hide default leaderboard
game.StarterGui:SetCoreGuiEnabled(Enum.CoreGuiType.PlayerList, false)

local sg = Instance.new("ScreenGui") sg.Name = "CustomLeaderboard"
sg.ResetOnSpawn = false sg.Parent = playerGui

local panel = Instance.new("Frame")
panel.Size = UDim2.new(0, 250, 0, 300)
panel.Position = UDim2.new(1, -260, 0, 10)
panel.BackgroundColor3 = Color3.fromRGB(15, 18, 28)
panel.Visible = false panel.Parent = sg
Instance.new("UICorner", panel).CornerRadius = UDim.new(0, 10)
Instance.new("UIStroke", panel).Color = Color3.fromRGB(50, 55, 70)

-- Header
local header = Instance.new("TextLabel")
header.Size = UDim2.new(1, 0, 0, 35)
header.BackgroundColor3 = Color3.fromRGB(20, 24, 38)
header.Text = "LEADERBOARD" header.TextColor3 = Color3.fromRGB(212, 175, 55)
header.Font = Enum.Font.GothamBold header.TextSize = 16 header.Parent = panel
Instance.new("UICorner", header).CornerRadius = UDim.new(0, 10)

-- Scroll frame for player entries
local scroll = Instance.new("ScrollingFrame")
scroll.Size = UDim2.new(1, -8, 1, -40) scroll.Position = UDim2.new(0, 4, 0, 38)
scroll.BackgroundTransparency = 1 scroll.ScrollBarThickness = 3
scroll.AutomaticCanvasSize = Enum.AutomaticSize.Y scroll.Parent = panel
local list = Instance.new("UIListLayout") list.Padding = UDim.new(0, 3)
list.SortOrder = Enum.SortOrder.LayoutOrder list.Parent = scroll

local function refreshLeaderboard()
  -- Clear old entries
  for _, child in scroll:GetChildren() do
    if child:IsA("Frame") then child:Destroy() end
  end
  -- Sort players by score
  local sorted = {}
  for _, p in Players:GetPlayers() do
    local ls = p:FindFirstChild("leaderstats")
    local score = ls and ls:FindFirstChild("Kills") and ls.Kills.Value or 0
    table.insert(sorted, {player = p, score = score})
  end
  table.sort(sorted, function(a, b) return a.score > b.score end)
  -- Create entries
  for i, data in ipairs(sorted) do
    local entry = Instance.new("Frame")
    entry.Size = UDim2.new(1, 0, 0, 30)
    entry.BackgroundColor3 = data.player == player and Color3.fromRGB(30, 35, 55) or Color3.fromRGB(22, 26, 38)
    entry.LayoutOrder = i entry.Parent = scroll
    Instance.new("UICorner", entry).CornerRadius = UDim.new(0, 6)
    -- Rank number
    local rank = Instance.new("TextLabel")
    rank.Size = UDim2.new(0, 30, 1, 0) rank.BackgroundTransparency = 1
    rank.Text = "#" .. i rank.TextSize = 13 rank.Font = Enum.Font.GothamBold
    rank.TextColor3 = i <= 3 and Color3.fromRGB(212, 175, 55) or Color3.fromRGB(150, 150, 160)
    rank.Parent = entry
    -- Name
    local name = Instance.new("TextLabel")
    name.Size = UDim2.new(0.5, 0, 1, 0) name.Position = UDim2.new(0, 32, 0, 0)
    name.BackgroundTransparency = 1 name.Text = data.player.DisplayName
    name.TextColor3 = Color3.fromRGB(220, 220, 225) name.TextSize = 13
    name.Font = Enum.Font.GothamMedium name.TextXAlignment = Enum.TextXAlignment.Left
    name.Parent = entry
    -- Score
    local scoreLabel = Instance.new("TextLabel")
    scoreLabel.Size = UDim2.new(0.3, 0, 1, 0) scoreLabel.Position = UDim2.new(0.7, 0, 0, 0)
    scoreLabel.BackgroundTransparency = 1 scoreLabel.Text = tostring(data.score)
    scoreLabel.TextColor3 = Color3.fromRGB(180, 180, 190) scoreLabel.TextSize = 13
    scoreLabel.Font = Enum.Font.GothamBold scoreLabel.Parent = entry
  end
end

-- Toggle with Tab key
game:GetService("UserInputService").InputBegan:Connect(function(input, processed)
  if processed then return end
  if input.KeyCode == Enum.KeyCode.Tab then
    panel.Visible = not panel.Visible
    if panel.Visible then refreshLeaderboard() end
  end
end)`,
    pitfalls: [
      'Not hiding default leaderboard first (two leaderboards showing)',
      'Not refreshing when scores change (stale data)',
      'Current player row not highlighted (hard to find yourself)',
      'Top 3 should have gold accent color (visual reward for leading)',
      'Tab toggle should match default Roblox behavior (hold to show)',
    ],
  },

  {
    name: 'Proximity-Based Music Zones',
    keywords: ['music zone', 'ambient', 'area music', 'region', 'zone sound', 'biome music', 'spatial audio'],
    snippet: `-- PROXIMITY-BASED MUSIC ZONES (different music per area)
-- CLIENT SCRIPT

local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local TweenService = game:GetService("TweenService")
local SoundService = game:GetService("SoundService")
local player = Players.LocalPlayer

-- Music zone definitions
local MUSIC_ZONES = {
  {name = "Village", position = Vector3.new(0, 0, 0), radius = 100, soundId = "rbxassetid://111"},
  {name = "Forest", position = Vector3.new(200, 0, 0), radius = 150, soundId = "rbxassetid://222"},
  {name = "Dungeon", position = Vector3.new(0, -50, 200), radius = 80, soundId = "rbxassetid://333"},
  {name = "Boss", position = Vector3.new(300, 0, 300), radius = 50, soundId = "rbxassetid://444"},
}

-- Create sound objects
local sounds = {}
for _, zone in MUSIC_ZONES do
  local sound = Instance.new("Sound")
  sound.SoundId = zone.soundId
  sound.Looped = true sound.Volume = 0
  sound.Parent = SoundService
  sounds[zone.name] = sound
  sound:Play() -- Start all (volume 0)
end

local currentZone = nil
local FADE_TIME = 2

RunService.RenderStepped:Connect(function()
  local character = player.Character
  if not character then return end
  local rootPart = character:FindFirstChild("HumanoidRootPart")
  if not rootPart then return end

  -- Find closest zone
  local closest = nil
  local closestDist = math.huge
  for _, zone in MUSIC_ZONES do
    local dist = (rootPart.Position - zone.position).Magnitude
    if dist < zone.radius and dist < closestDist then
      closest = zone closestDist = dist
    end
  end

  local newZone = closest and closest.name or nil
  if newZone ~= currentZone then
    -- Fade out old
    if currentZone and sounds[currentZone] then
      TweenService:Create(sounds[currentZone], TweenInfo.new(FADE_TIME), {Volume = 0}):Play()
    end
    -- Fade in new
    if newZone and sounds[newZone] then
      TweenService:Create(sounds[newZone], TweenInfo.new(FADE_TIME), {Volume = 0.5}):Play()
    end
    currentZone = newZone
  end
end)`,
    pitfalls: [
      'Abrupt music transitions (always crossfade with 1-3 second tween)',
      'All sounds Playing simultaneously even at Volume 0 (wasteful — only Play active ones)',
      'Zone radius too small — player constantly switching between zones',
      'No default/ambient music for areas outside all zones',
      'Boss music not louder/more dramatic than ambient (should be Volume 0.7+)',
    ],
  },

  {
    name: 'Admin Commands System',
    keywords: ['admin', 'command', 'chat command', 'kick', 'ban', 'teleport', 'god mode', 'fly', 'admin panel'],
    snippet: `-- ADMIN COMMANDS (chat-based, server-validated)
-- SERVER SCRIPT

local Players = game:GetService("Players")
local TextChatService = game:GetService("TextChatService")

-- Admin list (UserIds for security — names can change)
local ADMINS = {
  [123456789] = true, -- Your UserId
  [987654321] = true, -- Co-owner
}

local function isAdmin(player: Player): boolean
  return ADMINS[player.UserId] == true
end

-- Command definitions
local COMMANDS = {}

COMMANDS["kick"] = function(admin, args)
  local targetName = args[1]
  local reason = table.concat(args, " ", 2) or "No reason"
  local target = findPlayerByName(targetName)
  if target then
    target:Kick("Kicked by admin: " .. reason)
    return true, "Kicked " .. target.Name
  end
  return false, "Player not found"
end

COMMANDS["tp"] = function(admin, args)
  local targetName = args[1]
  local target = findPlayerByName(targetName)
  if target and target.Character and admin.Character then
    admin.Character:PivotTo(target.Character:GetPivot())
    return true, "Teleported to " .. target.Name
  end
  return false, "Cannot teleport"
end

COMMANDS["speed"] = function(admin, args)
  local speed = tonumber(args[1]) or 16
  if admin.Character then
    local humanoid = admin.Character:FindFirstChildOfClass("Humanoid")
    if humanoid then
      humanoid.WalkSpeed = math.clamp(speed, 0, 200)
      return true, "Speed set to " .. speed
    end
  end
  return false, "Failed"
end

COMMANDS["god"] = function(admin, args)
  if admin.Character then
    local humanoid = admin.Character:FindFirstChildOfClass("Humanoid")
    if humanoid then
      humanoid.MaxHealth = math.huge
      humanoid.Health = math.huge
      return true, "God mode enabled"
    end
  end
  return false, "Failed"
end

-- Helper: find player by partial name
local function findPlayerByName(name: string): Player?
  for _, p in Players:GetPlayers() do
    if p.Name:lower():sub(1, #name) == name:lower() then return p end
  end
  return nil
end

-- Parse chat messages for commands
local function onChat(player: Player, message: string)
  if not isAdmin(player) then return end
  if not message:sub(1, 1) == "!" then return end -- Prefix: !

  local parts = message:sub(2):split(" ")
  local cmdName = parts[1]:lower()
  local args = {table.unpack(parts, 2)}

  local cmd = COMMANDS[cmdName]
  if cmd then
    local success, result = cmd(player, args)
    -- Send feedback to admin
  end
end`,
    pitfalls: [
      'Admin check by name instead of UserId (names can change — use UserId)',
      'Admin commands on client (exploiter runs admin commands — server-only)',
      'No partial name matching (typing full exact name is tedious)',
      'Speed/health not clamped (setting to infinity can break things)',
      'No logging (admin actions should be recorded for accountability)',
    ],
  },

  {
    name: 'Lava / Kill Zone',
    keywords: ['lava', 'kill zone', 'damage zone', 'death', 'hazard', 'fire zone', 'acid', 'poison'],
    snippet: `-- LAVA / KILL ZONE (damage over time, visual effects)
-- SERVER SCRIPT with CollectionService pattern

local CollectionService = game:GetService("CollectionService")

-- TAG-BASED: One script handles ALL lava parts
-- Tag parts as "Lava" in Studio or via script
-- Set Attribute "DPS" (damage per second) on each part

local function setupLavaPart(part: BasePart)
  local dps = part:GetAttribute("DPS") or 50
  local touchingPlayers = {}

  part.Touched:Connect(function(hit)
    local character = hit.Parent
    local humanoid = character and character:FindFirstChildOfClass("Humanoid")
    local player = humanoid and game.Players:GetPlayerFromCharacter(character)
    if player and not touchingPlayers[player] then
      touchingPlayers[player] = true
      -- Damage loop while touching
      task.spawn(function()
        while touchingPlayers[player] and humanoid and humanoid.Health > 0 do
          humanoid:TakeDamage(dps / 10) -- 10 ticks per second
          task.wait(0.1)
        end
      end)
    end
  end)

  part.TouchEnded:Connect(function(hit)
    local player = game.Players:GetPlayerFromCharacter(hit.Parent)
    if player then
      touchingPlayers[player] = nil
    end
  end)
end

-- Setup all current and future lava parts
for _, part in CollectionService:GetTagged("Lava") do
  setupLavaPart(part)
end
CollectionService:GetInstanceAddedSignal("Lava"):Connect(setupLavaPart)

-- VISUAL LAVA SETUP (do this in Studio or script):
-- Material: Neon
-- Color: Color3.fromRGB(255, 80, 0)
-- Add ParticleEmitter: Rate=10, orange/red colors, rising slowly
-- Add PointLight: Color=orange, Brightness=2, Range=15
-- CanCollide = true (players walk ON lava, taking damage)

-- INSTANT KILL variant (for obbys):
-- local function setupKillBrick(part)
--   part.Touched:Connect(function(hit)
--     local humanoid = hit.Parent:FindFirstChildOfClass("Humanoid")
--     if humanoid and humanoid.Health > 0 then
--       humanoid.Health = 0
--     end
--   end)
-- end`,
    pitfalls: [
      'Lava without visual cue (MUST use Neon material with orange/red color)',
      'Instant kill in non-obby games is frustrating (use DPS instead)',
      'TouchEnded unreliable for tracking — polling with GetPartsInPart is safer',
      'CanCollide false on lava = player falls through (usually should be true)',
      'No PointLight on lava (looks flat — add warm orange light)',
    ],
  },

  {
    name: 'Weather System (Rain, Snow, Storm)',
    keywords: ['weather', 'rain system', 'snow system', 'storm', 'dynamic weather', 'weather change', 'wind'],
    snippet: `-- DYNAMIC WEATHER SYSTEM (transitions between weather states)
-- CLIENT SCRIPT (visual only) + SERVER (state management)

-- SERVER: Weather state management
local currentWeather = "Clear"
local WEATHER_CYCLE = {"Clear", "Cloudy", "Rain", "Storm", "Clear", "Snow"}
local WEATHER_DURATION = {60, 30, 45, 20, 60, 40} -- seconds per state

-- Cycle through weather
task.spawn(function()
  local idx = 1
  while true do
    currentWeather = WEATHER_CYCLE[idx]
    game.ReplicatedStorage.Remotes.WeatherChange:FireAllClients(currentWeather)
    task.wait(WEATHER_DURATION[idx])
    idx = idx % #WEATHER_CYCLE + 1
  end
end)

-- CLIENT: Weather visual effects
local Lighting = game:GetService("Lighting")
local TweenService = game:GetService("TweenService")

local rainEmitter = nil -- ParticleEmitter reference
local snowEmitter = nil

local WEATHER_SETTINGS = {
  Clear = {brightness = 2.5, ambient = Color3.fromRGB(80, 80, 90), fog = 1000},
  Cloudy = {brightness = 1.5, ambient = Color3.fromRGB(60, 60, 70), fog = 500},
  Rain = {brightness = 1, ambient = Color3.fromRGB(40, 45, 55), fog = 300},
  Storm = {brightness = 0.5, ambient = Color3.fromRGB(20, 25, 35), fog = 150},
  Snow = {brightness = 2, ambient = Color3.fromRGB(100, 100, 110), fog = 200},
}

local function applyWeather(weatherName: string)
  local settings = WEATHER_SETTINGS[weatherName]
  if not settings then return end

  -- Transition lighting
  TweenService:Create(Lighting, TweenInfo.new(5, Enum.EasingStyle.Sine), {
    Brightness = settings.brightness,
    Ambient = settings.ambient,
    FogEnd = settings.fog,
  }):Play()

  -- Toggle particles
  if rainEmitter then rainEmitter.Enabled = (weatherName == "Rain" or weatherName == "Storm") end
  if snowEmitter then snowEmitter.Enabled = (weatherName == "Snow") end

  -- Storm: add screen shake + thunder sounds
  if weatherName == "Storm" then
    -- Periodic lightning flash + thunder
    task.spawn(function()
      while currentWeather == "Storm" do
        task.wait(math.random(5, 15))
        -- Flash (white screen for 0.1s)
        -- Thunder sound
      end
    end)
  end
end

game.ReplicatedStorage.Remotes.WeatherChange.OnClientEvent:Connect(applyWeather)`,
    pitfalls: [
      'Instant weather transitions (always tween over 3-5 seconds)',
      'Rain particles without darker lighting (disconnect between visual and ambiance)',
      'Storm without any sound effects (thunder, wind are essential)',
      'Snow with warm lighting (should be bright but cool-toned)',
      'Weather changes too frequently (minimum 30 seconds per state)',
    ],
  },

  {
    name: 'Loot Drop System',
    keywords: ['loot', 'drop', 'item drop', 'enemy drop', 'pickup', 'collectible', 'loot table', 'random drop'],
    snippet: `-- LOOT DROP SYSTEM (weighted drops, physical pickup)
-- SERVER SCRIPT

local Debris = game:GetService("Debris")

-- Loot table per enemy type
local LOOT_TABLES = {
  Zombie = {
    {item = "Coins", amount = {5, 15}, chance = 80},
    {item = "HealthPotion", amount = {1, 1}, chance = 30},
    {item = "IronOre", amount = {1, 3}, chance = 20},
    {item = "RareSword", amount = {1, 1}, chance = 2},
  },
  Boss = {
    {item = "Coins", amount = {100, 500}, chance = 100},
    {item = "LegendaryWeapon", amount = {1, 1}, chance = 15},
    {item = "DiamondOre", amount = {3, 8}, chance = 50},
    {item = "MythicEgg", amount = {1, 1}, chance = 3},
  },
}

-- Roll loot from a table
local function rollLoot(enemyType: string): {{item: string, amount: number}}
  local table = LOOT_TABLES[enemyType]
  if not table then return {} end
  local drops = {}
  for _, entry in ipairs(table) do
    if math.random(100) <= entry.chance then
      local amount = math.random(entry.amount[1], entry.amount[2])
      table.insert(drops, {item = entry.item, amount = amount})
    end
  end
  return drops
end

-- Spawn physical loot drop
local function spawnLootDrop(position: Vector3, item: string, amount: number)
  local lootPart = Instance.new("Part")
  lootPart.Size = Vector3.new(1.5, 1.5, 1.5)
  lootPart.Shape = Enum.PartType.Ball
  lootPart.Material = Enum.Material.Neon
  lootPart.Color = Color3.fromRGB(255, 200, 50)
  lootPart.Anchored = false
  lootPart.Position = position + Vector3.new(0, 3, 0)
  lootPart:SetAttribute("Item", item)
  lootPart:SetAttribute("Amount", amount)
  lootPart.Parent = workspace

  -- Add bobbing animation after landing
  task.delay(1, function()
    if lootPart.Parent then
      lootPart.Anchored = true
      -- Bob up and down
    end
  end)

  -- Pickup on touch
  lootPart.Touched:Connect(function(hit)
    local player = game.Players:GetPlayerFromCharacter(hit.Parent)
    if not player then return end
    local itemName = lootPart:GetAttribute("Item")
    local itemAmount = lootPart:GetAttribute("Amount")
    if not itemName then return end
    -- Add to inventory
    addToInventory(player, itemName, itemAmount)
    -- Pickup effect (client-side)
    game.ReplicatedStorage.Remotes.LootPickup:FireClient(player, itemName, itemAmount)
    lootPart:Destroy()
  end)

  -- Auto-despawn after 30 seconds
  Debris:AddItem(lootPart, 30)
end

-- On enemy death:
-- local drops = rollLoot("Zombie")
-- for _, drop in drops do
--   spawnLootDrop(enemyPosition, drop.item, drop.amount)
-- end`,
    pitfalls: [
      'Chance per item is independent — player can get 0 drops or ALL drops',
      'Loot parts without auto-despawn accumulate and lag server',
      'Physical loot rolling away (anchor after 1 second of physics)',
      'No visual distinction between common and rare drops (rare should glow more)',
      'Client-side loot rolls (server must roll and spawn — client only sees result)',
    ],
  },

  {
    name: 'Door System (Open/Close/Lock)',
    keywords: ['door', 'open door', 'close door', 'lock', 'key', 'hinge', 'slide door', 'automatic door'],
    snippet: `-- DOOR SYSTEM (swing open/close, lock/unlock, keycards)
-- SERVER SCRIPT

local TweenService = game:GetService("TweenService")

local function setupDoor(doorModel: Model)
  local door = doorModel:FindFirstChild("Door") :: BasePart
  local hinge = doorModel:FindFirstChild("Hinge") :: BasePart
  if not door then return end

  local isOpen = false
  local isLocked = doorModel:GetAttribute("Locked") or false
  local requiredKey = doorModel:GetAttribute("RequiredKey") -- nil = no key needed

  local closedCFrame = door.CFrame
  local openCFrame = closedCFrame * CFrame.Angles(0, math.rad(90), 0)

  -- ProximityPrompt
  local prompt = Instance.new("ProximityPrompt")
  prompt.ActionText = isLocked and "Locked" or "Open"
  prompt.MaxActivationDistance = 8
  prompt.Parent = door

  prompt.Triggered:Connect(function(player)
    -- Check lock
    if isLocked then
      if requiredKey then
        -- Check if player has key
        if playerHasItem(player, requiredKey) then
          isLocked = false
          prompt.ActionText = "Open"
          -- Remove key from inventory
          removeItem(player, requiredKey, 1)
        else
          -- Play locked sound, show "Requires: Red Keycard"
          return
        end
      else
        return -- Locked with no key = cannot open
      end
    end

    -- Toggle door
    isOpen = not isOpen
    prompt.ActionText = isOpen and "Close" or "Open"

    -- Animate
    local targetCF = isOpen and openCFrame or closedCFrame
    TweenService:Create(door, TweenInfo.new(0.5, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), {
      CFrame = targetCF
    }):Play()
  end)
end

-- Auto-close doors after 5 seconds
-- task.delay(5, function()
--   if isOpen then
--     isOpen = false
--     TweenService:Create(door, ..., {CFrame = closedCFrame}):Play()
--   end
-- end)

-- SLIDING DOOR variant (sci-fi):
-- openCFrame = closedCFrame * CFrame.new(doorWidth, 0, 0) -- Slide to side
-- For double sliding: left half slides left, right half slides right`,
    pitfalls: [
      'Tweening unanchored door (physics fights tween — door must be Anchored)',
      'Door rotation around wrong point (pivot should be at hinge edge, not center)',
      'Locked door with no visual indicator (change color or add lock icon)',
      'ProximityPrompt on wrong part (put on the door itself, not the frame)',
      'No sound effects on open/close (doors should make sounds)',
    ],
  },

  {
    name: 'Teleporter Pad System',
    keywords: ['teleporter', 'teleport pad', 'portal', 'warp', 'fast travel', 'waypoint teleport', 'zone travel'],
    snippet: `-- TELEPORTER PAD SYSTEM (step on pad A → teleport to pad B)
-- SERVER SCRIPT

local function setupTeleportPads(padA: BasePart, padB: BasePart, cooldown: number?)
  local cd = cooldown or 3
  local debounce = {}

  padA.Touched:Connect(function(hit)
    local player = game.Players:GetPlayerFromCharacter(hit.Parent)
    if not player then return end
    if debounce[player.UserId] then return end
    debounce[player.UserId] = true

    local character = player.Character
    if character then
      -- Teleport to pad B (with offset so player doesn't immediately re-trigger)
      character:PivotTo(padB.CFrame + Vector3.new(0, 5, 3))
    end

    -- Visual effect on client
    game.ReplicatedStorage.Remotes.TeleportEffect:FireClient(player)

    task.delay(cd, function()
      debounce[player.UserId] = nil
    end)
  end)

  -- Reverse direction
  padB.Touched:Connect(function(hit)
    local player = game.Players:GetPlayerFromCharacter(hit.Parent)
    if not player then return end
    if debounce[player.UserId] then return end
    debounce[player.UserId] = true

    local character = player.Character
    if character then
      character:PivotTo(padA.CFrame + Vector3.new(0, 5, 3))
    end

    game.ReplicatedStorage.Remotes.TeleportEffect:FireClient(player)

    task.delay(cd, function()
      debounce[player.UserId] = nil
    end)
  end)
end

-- PAD VISUAL (make it obvious it's a teleporter):
-- Neon material, bright color (cyan, purple, or gold)
-- Ring of particles around edge
-- PointLight underneath
-- SurfaceGui with destination label`,
    pitfalls: [
      'No cooldown — player bounces between pads infinitely',
      'Teleport offset too small — player immediately triggers other pad',
      'No visual indicator that a pad is a teleporter (Neon + particles)',
      'Touched fires for NPC and accessories — always check for Player',
      'Not offsetting Y position on teleport — player clips into ground',
    ],
  },

  {
    name: 'Projectile System',
    keywords: ['projectile', 'bullet', 'fireball', 'arrow', 'throw', 'launch', 'shoot projectile', 'ranged'],
    snippet: `-- PROJECTILE SYSTEM (spawn, move, hit detection)
-- SERVER SCRIPT (authoritative hit detection)

local Debris = game:GetService("Debris")
local RunService = game:GetService("RunService")

local function fireProjectile(origin: Vector3, direction: Vector3, speed: number, damage: number, owner: Player)
  -- Create projectile part
  local projectile = Instance.new("Part")
  projectile.Size = Vector3.new(0.5, 0.5, 2)
  projectile.Material = Enum.Material.Neon
  projectile.Color = Color3.fromRGB(255, 200, 50)
  projectile.Anchored = true
  projectile.CanCollide = false
  projectile.CFrame = CFrame.lookAt(origin, origin + direction)
  projectile.Parent = workspace

  -- Trail effect
  local att0 = Instance.new("Attachment", projectile)
  att0.Position = Vector3.new(0, 0, 1)
  local att1 = Instance.new("Attachment", projectile)
  att1.Position = Vector3.new(0, 0, -1)
  local trail = Instance.new("Trail")
  trail.Attachment0 = att0 trail.Attachment1 = att1
  trail.Lifetime = 0.2
  trail.Color = ColorSequence.new(Color3.fromRGB(255, 200, 50))
  trail.Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0, 0), NumberSequenceKeypoint.new(1, 1)
  })
  trail.Parent = projectile

  -- Movement + hit detection loop
  local maxDistance = 200
  local traveled = 0
  local rayParams = RaycastParams.new()
  rayParams.FilterDescendantsInstances = {owner.Character, projectile}

  local conn
  conn = RunService.Heartbeat:Connect(function(dt)
    local moveAmount = speed * dt
    local moveDir = projectile.CFrame.LookVector * moveAmount

    -- Raycast forward for hit detection
    local result = workspace:Raycast(projectile.Position, moveDir, rayParams)

    if result then
      -- Hit something!
      local hitChar = result.Instance:FindFirstAncestorOfClass("Model")
      if hitChar then
        local humanoid = hitChar:FindFirstChildOfClass("Humanoid")
        if humanoid then
          humanoid:TakeDamage(damage)
          -- Set damage attribution
          local tag = Instance.new("ObjectValue")
          tag.Name = "creator" tag.Value = owner tag.Parent = humanoid
          Debris:AddItem(tag, 3)
        end
      end
      -- Impact effect
      conn:Disconnect()
      projectile:Destroy()
      return
    end

    -- Move forward
    projectile.CFrame = projectile.CFrame + moveDir
    traveled += moveAmount

    if traveled >= maxDistance then
      conn:Disconnect()
      projectile:Destroy()
    end
  end)

  -- Safety cleanup
  Debris:AddItem(projectile, maxDistance / speed + 1)
end`,
    pitfalls: [
      'Using Touched for hit detection (unreliable at high speeds — use Raycast)',
      'Not filtering owner character from raycast (projectile hits shooter)',
      'No max distance (projectile flies forever consuming resources)',
      'Client-side projectiles without server validation (exploiter auto-aims)',
      'Missing Trail effect (projectile is nearly invisible at high speed)',
    ],
  },

  {
    name: 'Grid-Based Map System',
    keywords: ['grid', 'tile', 'map grid', 'tile map', 'board game', 'chess board', 'grid system', 'isometric'],
    snippet: `-- GRID-BASED MAP SYSTEM (tile creation, pathfinding, selection)
-- SERVER SCRIPT

local TILE_SIZE = 4 -- studs per tile
local MAP_WIDTH = 20 -- tiles
local MAP_HEIGHT = 20 -- tiles

-- Tile types
local TILES = {
  Grass = {material = Enum.Material.Grass, color = Color3.fromRGB(80, 160, 60), walkable = true},
  Water = {material = Enum.Material.Glass, color = Color3.fromRGB(60, 120, 200), walkable = false, transparent = 0.3},
  Stone = {material = Enum.Material.Cobblestone, color = Color3.fromRGB(140, 135, 125), walkable = true},
  Sand = {material = Enum.Material.Sand, color = Color3.fromRGB(220, 200, 150), walkable = true},
  Wall = {material = Enum.Material.Brick, color = Color3.fromRGB(120, 70, 50), walkable = false, height = 4},
}

-- Generate grid
local gridParts = {} -- [x][y] = Part

local function createGrid(mapData: {{string}})
  local gridModel = Instance.new("Model") gridModel.Name = "Grid"
  gridParts = {}

  for x = 1, MAP_WIDTH do
    gridParts[x] = {}
    for y = 1, MAP_HEIGHT do
      local tileType = mapData[x] and mapData[x][y] or "Grass"
      local tileConfig = TILES[tileType] or TILES.Grass

      local part = Instance.new("Part") part.Anchored = true
      part.Size = Vector3.new(TILE_SIZE, tileConfig.height or 0.5, TILE_SIZE)
      part.Position = Vector3.new(x * TILE_SIZE, (tileConfig.height or 0.5) / 2, y * TILE_SIZE)
      part.Material = tileConfig.material
      part.Color = tileConfig.color
      if tileConfig.transparent then part.Transparency = tileConfig.transparent end
      part:SetAttribute("TileX", x)
      part:SetAttribute("TileY", y)
      part:SetAttribute("TileType", tileType)
      part:SetAttribute("Walkable", tileConfig.walkable)
      part.Parent = gridModel

      gridParts[x][y] = part
    end
  end

  gridModel.Parent = workspace
  return gridModel
end

-- GRID UTILITIES:
local function worldToGrid(worldPos: Vector3): (number, number)
  return math.round(worldPos.X / TILE_SIZE), math.round(worldPos.Z / TILE_SIZE)
end

local function gridToWorld(gx: number, gy: number): Vector3
  return Vector3.new(gx * TILE_SIZE, 0.25, gy * TILE_SIZE)
end

local function isWalkable(gx: number, gy: number): boolean
  if gx < 1 or gx > MAP_WIDTH or gy < 1 or gy > MAP_HEIGHT then return false end
  local part = gridParts[gx] and gridParts[gx][gy]
  return part and part:GetAttribute("Walkable") == true
end

local function getNeighbors(gx: number, gy: number): {{number}}
  local neighbors = {}
  for _, d in ipairs({{0,1},{0,-1},{1,0},{-1,0}}) do
    local nx, ny = gx + d[1], gy + d[2]
    if isWalkable(nx, ny) then
      table.insert(neighbors, {nx, ny})
    end
  end
  return neighbors
end`,
    pitfalls: [
      'Tile positions off by half (center vs corner — multiply by TILE_SIZE consistently)',
      'Not storing walkability on parts (makes pathfinding impossible without lookup table)',
      'Grid too large without streaming (400+ tiles = performance concern)',
      'No worldToGrid / gridToWorld conversion functions (everything breaks)',
      'Water tiles should be non-walkable by default',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // EXPANSION BATCH 3 — FINAL 35+ ENTRIES to reach 200+
  // ═══════════════════════════════════════════════════════════════════════════

  {
    name: 'Cooking / Recipe System',
    keywords: ['cooking', 'cook', 'recipe', 'food', 'ingredient', 'kitchen', 'meal', 'combine'],
    snippet: `-- COOKING / RECIPE SYSTEM (ingredients → combine → result)
-- SERVER SCRIPT
local RECIPES = {
  Burger = {ingredients = {Bread = 2, Meat = 1, Lettuce = 1}, cookTime = 3, value = 20},
  Soup = {ingredients = {Water = 1, Carrot = 2, Potato = 1}, cookTime = 5, value = 15},
  Cake = {ingredients = {Flour = 2, Egg = 2, Sugar = 1, Milk = 1}, cookTime = 8, value = 50},
  Sushi = {ingredients = {Rice = 1, Fish = 1, Seaweed = 1}, cookTime = 4, value = 35},
}
local function tryCook(player: Player, recipeName: string): (boolean, string?)
  local recipe = RECIPES[recipeName]
  if not recipe then return false, "Unknown recipe" end
  local inv = getInventory(player)
  for item, needed in pairs(recipe.ingredients) do
    if (inv[item] or 0) < needed then return false, "Need more " .. item end
  end
  for item, needed in pairs(recipe.ingredients) do inv[item] -= needed end
  task.wait(recipe.cookTime) -- Cooking time
  inv[recipeName] = (inv[recipeName] or 0) + 1
  return true, recipeName
end`,
    pitfalls: [
      'Ingredients removed before verifying ALL are available (partial removal bug)',
      'No cooking time — feels instant and unrewarding',
      'Client-side recipe validation (exploiter cooks without ingredients)',
      'Recipe results not saved to DataStore on PlayerRemoving',
      'No visual cooking progress indicator sent to client',
    ],
  },

  {
    name: 'Farming / Crop System',
    keywords: ['farming', 'crop', 'plant', 'grow', 'harvest', 'seed', 'farm plot', 'agriculture', 'grow stage'],
    snippet: `-- FARMING / CROP SYSTEM (plant, grow stages, harvest, sell)
-- SERVER SCRIPT
local CROP_DATA = {
  Wheat = {stages = 4, growTime = 10, harvestAmount = 3, sellValue = 5},
  Carrot = {stages = 3, growTime = 15, harvestAmount = 2, sellValue = 10},
  Pumpkin = {stages = 5, growTime = 30, harvestAmount = 1, sellValue = 50},
}
local activeCrops = {} -- [cropModel] = {type, stage, plantedAt, plot}
local function plantCrop(player: Player, plotPart: BasePart, cropType: string)
  local data = CROP_DATA[cropType]
  if not data then return false end
  if plotPart:GetAttribute("HasCrop") then return false end
  -- Remove seed from inventory
  if not removeItem(player, cropType .. "Seed", 1) then return false end
  plotPart:SetAttribute("HasCrop", true)
  -- Create crop visual (starts small)
  local crop = Instance.new("Part") crop.Anchored = true
  crop.Size = Vector3.new(1, 0.5, 1) crop.CFrame = plotPart.CFrame + Vector3.new(0, 0.5, 0)
  crop.Material = Enum.Material.Grass crop.Color = Color3.fromRGB(60, 140, 40)
  crop.Parent = workspace
  activeCrops[crop] = {type = cropType, stage = 1, plantedAt = tick(), plot = plotPart}
  return true
end
-- Growth loop (check all crops periodically)
task.spawn(function()
  while true do
    for crop, info in pairs(activeCrops) do
      if not crop.Parent then activeCrops[crop] = nil continue end
      local data = CROP_DATA[info.type]
      local elapsed = tick() - info.plantedAt
      local newStage = math.min(data.stages, math.floor(elapsed / (data.growTime / data.stages)) + 1)
      if newStage > info.stage then
        info.stage = newStage
        crop.Size = Vector3.new(1, 0.5 + newStage * 0.5, 1) -- Grow taller
        crop.Color = Color3.fromRGB(40 + newStage * 15, 120 + newStage * 10, 30)
      end
    end
    task.wait(2) -- Check every 2 seconds
  end
end)
local function harvestCrop(player: Player, crop: Instance)
  local info = activeCrops[crop]
  if not info then return false end
  local data = CROP_DATA[info.type]
  if info.stage < data.stages then return false end -- Not ready
  addItem(player, info.type, data.harvestAmount)
  info.plot:SetAttribute("HasCrop", false)
  crop:Destroy()
  activeCrops[crop] = nil
  return true
end`,
    pitfalls: [
      'Growth not time-based (should progress even when player is away if using os.time)',
      'No visual growth stages (crop should get taller/change color per stage)',
      'Harvesting before fully grown (always check stage >= maxStages)',
      'Plot not marked as occupied (two crops planted on same plot)',
      'Growth check too frequent (every frame) wastes CPU — 2-5 second interval is fine',
    ],
  },

  {
    name: 'Guild / Clan System',
    keywords: ['guild', 'clan', 'group', 'create guild', 'rank', 'member', 'guild bank', 'alliance'],
    snippet: `-- GUILD / CLAN SYSTEM (create, join, ranks, bank)
-- SERVER SCRIPT — store in DataStore
local DataStoreService = game:GetService("DataStoreService")
local guildStore = DataStoreService:GetDataStore("Guilds_v1")
local GUILD_RANKS = {Owner = 100, Officer = 50, Member = 10, Recruit = 1}
local MAX_MEMBERS = 50
local function createGuild(player: Player, guildName: string): (boolean, string?)
  if #guildName < 3 or #guildName > 20 then return false, "Name must be 3-20 chars" end
  -- Check name availability
  local success, existing = pcall(function() return guildStore:GetAsync("guild_" .. guildName:lower()) end)
  if success and existing then return false, "Name taken" end
  local guild = {
    name = guildName, ownerId = player.UserId,
    members = {[tostring(player.UserId)] = {rank = "Owner", joined = os.time()}},
    bank = 0, createdAt = os.time(), level = 1,
  }
  pcall(function() guildStore:SetAsync("guild_" .. guildName:lower(), guild) end)
  return true, guildName
end
local function inviteToGuild(inviter: Player, targetPlayer: Player, guildName: string)
  -- Verify inviter is Officer+ rank
  -- Send invite via RemoteEvent to target
  -- Target accepts → add to members table → save
end
local function promoteInGuild(promoter: Player, targetUserId: number, guildName: string, newRank: string)
  -- Verify promoter outranks target
  -- Cannot promote above own rank
  -- Update member rank in DataStore
end`,
    pitfalls: [
      'Guild data not versioned in DataStore key (impossible to migrate later)',
      'No rank hierarchy check on promote (member promotes themselves to owner)',
      'Guild name not filtered through TextService (inappropriate names)',
      'Owner leaves = guild orphaned (transfer ownership or disband)',
      'Too many DataStore writes per guild action (batch updates)',
    ],
  },

  {
    name: 'Auction House / Trading Post',
    keywords: ['auction', 'auction house', 'marketplace', 'buy order', 'sell order', 'bid', 'listing', 'trade post'],
    snippet: `-- AUCTION HOUSE (list items, bid, buyout, expiration)
-- SERVER SCRIPT — use OrderedDataStore for price sorting
local listings = {} -- In-memory cache, backed by DataStore
local LISTING_FEE = 0.05 -- 5% listing fee
local EXPIRATION_HOURS = 24
local function listItem(player: Player, itemId: string, startPrice: number, buyoutPrice: number?)
  if not removeItem(player, itemId, 1) then return false, "Item not in inventory" end
  local fee = math.floor(startPrice * LISTING_FEE)
  if not deductCoins(player, fee) then
    addItem(player, itemId, 1) return false, "Cannot afford listing fee" end
  local listing = {
    id = tostring(os.time()) .. "_" .. player.UserId,
    seller = player.UserId, itemId = itemId,
    currentBid = startPrice, buyout = buyoutPrice,
    highBidder = nil, expiresAt = os.time() + EXPIRATION_HOURS * 3600,
  }
  table.insert(listings, listing)
  return true, listing.id
end
local function placeBid(player: Player, listingId: string, amount: number)
  local listing = findListing(listingId)
  if not listing then return false, "Listing not found" end
  if listing.seller == player.UserId then return false, "Cannot bid on own item" end
  if os.time() > listing.expiresAt then return false, "Listing expired" end
  if amount <= listing.currentBid then return false, "Bid too low" end
  if not deductCoins(player, amount) then return false, "Not enough coins" end
  -- Refund previous bidder
  if listing.highBidder then
    addCoins(listing.highBidder, listing.currentBid)
  end
  listing.currentBid = amount
  listing.highBidder = player.UserId
  return true
end`,
    pitfalls: [
      'Previous bidder not refunded when outbid (coins vanish)',
      'No expiration check (listings last forever, cluttering marketplace)',
      'Seller bidding on own item to inflate price',
      'Listing fee not deducted (free spam listings)',
      'In-memory listings lost on server restart (backup to DataStore)',
    ],
  },

  {
    name: 'Status Effect System',
    keywords: ['status effect', 'buff', 'debuff', 'poison', 'burn', 'freeze', 'slow', 'speed boost', 'effect'],
    snippet: `-- STATUS EFFECT SYSTEM (buffs, debuffs, stacking, duration)
-- SERVER SCRIPT
local activeEffects = {} -- [userId] = {[effectName] = {endTime, stacks, data}}
local EFFECTS = {
  SpeedBoost = {
    apply = function(character, stacks)
      local humanoid = character:FindFirstChildOfClass("Humanoid")
      if humanoid then humanoid.WalkSpeed = 16 + (8 * stacks) end
    end,
    remove = function(character)
      local humanoid = character:FindFirstChildOfClass("Humanoid")
      if humanoid then humanoid.WalkSpeed = 16 end
    end,
    maxStacks = 3, duration = 10,
  },
  Poison = {
    apply = function(character, stacks)
      character:SetAttribute("PoisonDPS", 5 * stacks)
    end,
    remove = function(character)
      character:SetAttribute("PoisonDPS", nil)
    end,
    maxStacks = 5, duration = 8,
  },
  Freeze = {
    apply = function(character, stacks)
      local humanoid = character:FindFirstChildOfClass("Humanoid")
      if humanoid then humanoid.WalkSpeed = 0 humanoid.JumpHeight = 0 end
    end,
    remove = function(character)
      local humanoid = character:FindFirstChildOfClass("Humanoid")
      if humanoid then humanoid.WalkSpeed = 16 humanoid.JumpHeight = 7.2 end
    end,
    maxStacks = 1, duration = 3,
  },
}
local function applyEffect(player: Player, effectName: string)
  local effect = EFFECTS[effectName]
  if not effect then return end
  local userId = player.UserId
  if not activeEffects[userId] then activeEffects[userId] = {} end
  local current = activeEffects[userId][effectName]
  if current then
    current.stacks = math.min(current.stacks + 1, effect.maxStacks)
    current.endTime = tick() + effect.duration
  else
    activeEffects[userId][effectName] = {endTime = tick() + effect.duration, stacks = 1}
  end
  if player.Character then effect.apply(player.Character, activeEffects[userId][effectName].stacks) end
end
-- Tick loop: remove expired effects
game:GetService("RunService").Heartbeat:Connect(function()
  local now = tick()
  for userId, effects in pairs(activeEffects) do
    for name, data in pairs(effects) do
      if now >= data.endTime then
        local player = game.Players:GetPlayerByUserId(userId)
        if player and player.Character then EFFECTS[name].remove(player.Character) end
        effects[name] = nil
      end
    end
  end
end)`,
    pitfalls: [
      'Effects not removed when duration expires (permanent debuff)',
      'Stacking beyond max (poison doing 1000 DPS with 200 stacks)',
      'Effects not cleaned on death/respawn (zombie speed boost)',
      'Not showing effect icons to player (they dont know whats active)',
      'Freeze setting WalkSpeed to 0 but not restoring correct speed after',
    ],
  },

  {
    name: 'Conveyor Belt Pattern',
    keywords: ['conveyor', 'belt', 'factory', 'move parts', 'assembly line', 'production', 'automation'],
    snippet: `-- CONVEYOR BELT (moves parts along a direction)
-- SERVER SCRIPT
-- Modern approach: AssemblyLinearVelocity on conveyor surface
local function setupConveyor(part: BasePart, direction: Vector3, speed: number)
  -- Set the surface velocity so objects slide along
  part.CustomPhysicalProperties = PhysicalProperties.new(
    0.7,  -- Density
    0.3,  -- Friction (lower = slides more)
    0.5,  -- Elasticity
    1,    -- FrictionWeight
    1     -- ElasticityWeight
  )
  -- Apply constant velocity to the conveyor part
  game:GetService("RunService").Heartbeat:Connect(function()
    part.AssemblyLinearVelocity = direction.Unit * speed
  end)
end
-- Alternative: Use VelocityConstraint for items ON the belt
local function setupConveyorWithConstraint(beltPart: BasePart, direction: Vector3, speed: number)
  beltPart.Touched:Connect(function(hit)
    if hit.Anchored then return end
    if hit:FindFirstChildOfClass("LinearVelocity") then return end
    local att = Instance.new("Attachment") att.Parent = hit
    local lv = Instance.new("LinearVelocity")
    lv.Attachment0 = att
    lv.VectorVelocity = direction.Unit * speed
    lv.MaxForce = 5000
    lv.RelativeTo = Enum.ActuatorRelativeTo.World
    lv.Parent = hit
  end)
  beltPart.TouchEnded:Connect(function(hit)
    local lv = hit:FindFirstChildOfClass("LinearVelocity")
    if lv then lv:Destroy() end
    local att = hit:FindFirstChildOfClass("Attachment")
    if att then att:Destroy() end
  end)
end`,
    pitfalls: [
      'Using deprecated BodyVelocity (use LinearVelocity or AssemblyLinearVelocity)',
      'Conveyor fights with Anchored parts (conveyors only move unanchored objects)',
      'LinearVelocity not cleaned on TouchEnded (items fly forever)',
      'MaxForce too high launches items off belt (5000-10000 is reasonable)',
      'Friction too high on belt surface (items stick instead of sliding)',
    ],
  },

  {
    name: 'Morphing / Character Customization',
    keywords: ['morph', 'character', 'customize', 'avatar', 'outfit', 'costume', 'skin', 'appearance', 'r6 r15'],
    snippet: `-- MORPHING / CHARACTER CUSTOMIZATION
-- SERVER SCRIPT — apply character modifications
local Players = game:GetService("Players")
-- Apply a morph (replace character appearance)
local function applyMorph(player: Player, morphModel: Model)
  local character = player.Character
  if not character then return end
  local humanoid = character:FindFirstChildOfClass("Humanoid")
  if not humanoid then return end
  -- Apply HumanoidDescription for simple changes
  local desc = humanoid:GetAppliedDescription()
  -- Change body colors
  desc.HeadColor = Color3.fromRGB(255, 200, 150)
  desc.TorsoColor = Color3.fromRGB(255, 200, 150)
  -- Change clothing
  desc.Shirt = 12345678 -- Shirt asset ID
  desc.Pants = 87654321 -- Pants asset ID
  -- Apply
  humanoid:ApplyDescription(desc)
end
-- Quick body color change
local function setBodyColor(character: Model, color: Color3)
  for _, part in character:GetChildren() do
    if part:IsA("BasePart") and part.Name ~= "HumanoidRootPart" then
      part.Color = color
    end
  end
end
-- Add accessory
local function addAccessory(character: Model, accessoryId: number)
  local success, model = pcall(function()
    return game:GetService("InsertService"):LoadAsset(accessoryId)
  end)
  if success then
    local accessory = model:FindFirstChildOfClass("Accessory")
    if accessory then
      local humanoid = character:FindFirstChildOfClass("Humanoid")
      if humanoid then humanoid:AddAccessory(accessory) end
    end
    model:Destroy()
  end
end
-- Scale character
local function scaleCharacter(character: Model, scaleFactor: number)
  local humanoid = character:FindFirstChildOfClass("Humanoid")
  if not humanoid then return end
  local bodyScale = humanoid:FindFirstChild("BodyHeightScale")
  if bodyScale then bodyScale.Value = scaleFactor end
  local bodyWidth = humanoid:FindFirstChild("BodyWidthScale")
  if bodyWidth then bodyWidth.Value = scaleFactor end
  local headScale = humanoid:FindFirstChild("HeadScale")
  if headScale then headScale.Value = scaleFactor end
end`,
    pitfalls: [
      'ApplyDescription errors if character is dead or loading — wrap in pcall',
      'Scaling too large (>3x) causes physics issues and clipping',
      'Accessories from InsertService must be owned/public assets',
      'Body color change reverts on respawn (re-apply in CharacterAdded)',
      'HumanoidDescription changes are server-authoritative — apply on server',
    ],
  },

  {
    name: 'Boss Fight Architecture',
    keywords: ['boss', 'boss fight', 'boss battle', 'phase', 'health bar', 'boss attack', 'raid boss', 'dungeon boss'],
    snippet: `-- BOSS FIGHT ARCHITECTURE (phases, attacks, health bar)
-- SERVER SCRIPT
local BOSS_PHASES = {
  {healthPercent = 1.0, attacks = {"Slash", "Stomp"}, speed = 10},
  {healthPercent = 0.6, attacks = {"Slash", "Stomp", "FireBreath"}, speed = 14},
  {healthPercent = 0.3, attacks = {"Slash", "Stomp", "FireBreath", "Enrage"}, speed = 20},
}
local function createBoss(bossModel: Model, maxHealth: number)
  local humanoid = bossModel:FindFirstChildOfClass("Humanoid")
  humanoid.MaxHealth = maxHealth
  humanoid.Health = maxHealth
  local currentPhase = 1
  -- Phase transition
  humanoid:GetPropertyChangedSignal("Health"):Connect(function()
    local healthPercent = humanoid.Health / humanoid.MaxHealth
    for i, phase in ipairs(BOSS_PHASES) do
      if healthPercent <= phase.healthPercent and i > currentPhase then
        currentPhase = i
        onPhaseChange(bossModel, i)
        break
      end
    end
    -- Update boss health bar for all clients
    game.ReplicatedStorage.Remotes.BossHealth:FireAllClients(humanoid.Health, humanoid.MaxHealth, currentPhase)
  end)
  -- Attack loop
  task.spawn(function()
    while humanoid.Health > 0 do
      local phase = BOSS_PHASES[currentPhase]
      local attackName = phase.attacks[math.random(#phase.attacks)]
      performBossAttack(bossModel, attackName)
      task.wait(2 / (currentPhase * 0.5)) -- Faster in later phases
    end
    -- Boss defeated!
    game.ReplicatedStorage.Remotes.BossDefeated:FireAllClients()
    dropBossLoot(bossModel:GetPivot().Position)
  end)
end
-- Example attack implementations:
local function performBossAttack(boss: Model, attackName: string)
  if attackName == "Slash" then
    -- Melee AOE in front, 180 degree arc
  elseif attackName == "Stomp" then
    -- Ground pound AOE, knocks back nearby players
  elseif attackName == "FireBreath" then
    -- Cone damage in facing direction, 3 second channel
  elseif attackName == "Enrage" then
    -- Buff self: +50% damage, +30% speed for 10 seconds
  end
end`,
    pitfalls: [
      'No phase transitions (same attacks at 100% and 1% HP is boring)',
      'Boss health bar only visible to nearby players (should be global UI)',
      'Attack patterns too predictable (randomize within phase attack pool)',
      'No telegraph/warning before attacks (players need 1-2s reaction window)',
      'Boss stuck on geometry (use pathfinding or teleport to reset position)',
    ],
  },

  {
    name: 'Currency Display (Animated Counter)',
    keywords: ['currency', 'money', 'coins display', 'counter', 'animated number', 'gold', 'cash hud'],
    snippet: `-- ANIMATED CURRENCY DISPLAY (smooth counting up/down)
-- CLIENT SCRIPT
local TweenService = game:GetService("TweenService")
local Players = game:GetService("Players")
local player = Players.LocalPlayer
local function createCurrencyDisplay(parent: ScreenGui, name: string, icon: string, color: Color3)
  local frame = Instance.new("Frame")
  frame.Size = UDim2.new(0, 160, 0, 36) frame.BackgroundColor3 = Color3.fromRGB(15, 18, 28)
  frame.Parent = parent Instance.new("UICorner", frame).CornerRadius = UDim.new(0.5, 0)
  Instance.new("UIStroke", frame).Color = Color3.fromRGB(40, 45, 55)
  -- Icon
  local iconLabel = Instance.new("TextLabel")
  iconLabel.Size = UDim2.new(0, 30, 0, 30) iconLabel.Position = UDim2.new(0, 4, 0.5, -15)
  iconLabel.BackgroundTransparency = 1 iconLabel.Text = icon iconLabel.TextSize = 20
  iconLabel.Parent = frame
  -- Amount (animated)
  local amountLabel = Instance.new("TextLabel")
  amountLabel.Name = "Amount"
  amountLabel.Size = UDim2.new(1, -40, 1, 0) amountLabel.Position = UDim2.new(0, 36, 0, 0)
  amountLabel.BackgroundTransparency = 1 amountLabel.TextColor3 = color
  amountLabel.Font = Enum.Font.GothamBold amountLabel.TextSize = 18
  amountLabel.TextXAlignment = Enum.TextXAlignment.Left amountLabel.Text = "0"
  amountLabel.Parent = frame
  -- Smooth counter animation
  local displayValue = Instance.new("NumberValue") displayValue.Value = 0
  displayValue.Changed:Connect(function(val)
    amountLabel.Text = formatNumber(math.floor(val))
  end)
  local function updateAmount(newAmount: number)
    TweenService:Create(displayValue, TweenInfo.new(0.5, Enum.EasingStyle.Quad), {
      Value = newAmount
    }):Play()
  end
  return frame, updateAmount
end
-- Format large numbers: 1500 → "1.5K", 1500000 → "1.5M"
local function formatNumber(n: number): string
  if n >= 1e9 then return string.format("%.1fB", n / 1e9)
  elseif n >= 1e6 then return string.format("%.1fM", n / 1e6)
  elseif n >= 1e3 then return string.format("%.1fK", n / 1e3)
  end
  return tostring(n)
end`,
    pitfalls: [
      'Instant number change (tween the display value for smooth counting)',
      'Not formatting large numbers (1000000 is unreadable — use 1.0M)',
      'NumberValue.Changed fires every frame during tween (fine for display, not logic)',
      'Currency icon should be emoji or ImageLabel — not just text',
      'Display updates from server every frame wastes bandwidth — only on change',
    ],
  },

  {
    name: 'Rope Swing / Zipline',
    keywords: ['rope', 'swing', 'zipline', 'rope swing', 'vine', 'grapple rope', 'tarzan'],
    snippet: `-- ROPE SWING / ZIPLINE (constraint-based, physics-driven)
-- SERVER or CLIENT depending on use
local function createZipline(startPos: Vector3, endPos: Vector3)
  local m = Instance.new("Model") m.Name = "Zipline"
  -- Cable (visual beam between two points)
  local startPart = Instance.new("Part") startPart.Anchored = true startPart.CanCollide = false
  startPart.Size = Vector3.new(0.5, 0.5, 0.5) startPart.Transparency = 0.5
  startPart.Position = startPos startPart.Parent = m
  local endPart = Instance.new("Part") endPart.Anchored = true endPart.CanCollide = false
  endPart.Size = Vector3.new(0.5, 0.5, 0.5) endPart.Transparency = 0.5
  endPart.Position = endPos endPart.Parent = m
  local att0 = Instance.new("Attachment", startPart)
  local att1 = Instance.new("Attachment", endPart)
  local beam = Instance.new("Beam") beam.Attachment0 = att0 beam.Attachment1 = att1
  beam.Width0 = 0.15 beam.Width1 = 0.15 beam.FaceCamera = true
  beam.Color = ColorSequence.new(Color3.fromRGB(100, 100, 110)) beam.Parent = m
  -- Trigger to start zipline ride
  local trigger = Instance.new("Part") trigger.Anchored = true trigger.CanCollide = false
  trigger.Size = Vector3.new(4, 4, 4) trigger.Transparency = 1
  trigger.Position = startPos trigger.Parent = m
  local prompt = Instance.new("ProximityPrompt")
  prompt.ActionText = "Ride Zipline" prompt.MaxActivationDistance = 6 prompt.Parent = trigger
  prompt.Triggered:Connect(function(player)
    local character = player.Character
    if not character then return end
    local rootPart = character:FindFirstChild("HumanoidRootPart")
    if not rootPart then return end
    local humanoid = character:FindFirstChildOfClass("Humanoid")
    if not humanoid then return end
    -- Disable movement during ride
    humanoid.WalkSpeed = 0 humanoid.JumpHeight = 0
    -- Attach player to cable and slide
    local direction = (endPos - startPos).Unit
    local distance = (endPos - startPos).Magnitude
    local speed = 40 -- studs per second
    local duration = distance / speed
    rootPart.Anchored = true
    local tween = game:GetService("TweenService"):Create(rootPart, game:GetService("TweenService"):Create(
      rootPart, TweenInfo.new(duration, Enum.EasingStyle.Quad, Enum.EasingDirection.InOut),
      {CFrame = CFrame.new(endPos + Vector3.new(0, -2, 0))}
    ))
    -- Simple approach: CFrame tween along cable
    local startTime = tick()
    local conn
    conn = game:GetService("RunService").Heartbeat:Connect(function(dt)
      local t = (tick() - startTime) / duration
      if t >= 1 then
        rootPart.Anchored = false
        humanoid.WalkSpeed = 16 humanoid.JumpHeight = 7.2
        conn:Disconnect()
        return
      end
      local pos = startPos:Lerp(endPos, t) + Vector3.new(0, -2 - math.sin(t * math.pi) * 3, 0)
      rootPart.CFrame = CFrame.lookAt(pos, pos + direction)
    end)
  end)
  m.Parent = workspace return m
end`,
    pitfalls: [
      'Not disabling player movement during ride (player walks off mid-zipline)',
      'Not re-enabling movement after ride (player stuck unable to move)',
      'RootPart anchored but not unanchored at end (player frozen)',
      'No sag in cable (real ziplines dip in the middle — use sine curve)',
      'Beam needs FaceCamera = true or it becomes invisible at certain angles',
    ],
  },

  {
    name: 'Trading Card / Gacha Collection',
    keywords: ['card', 'collection', 'collector', 'album', 'complete set', 'rare card', 'trading card', 'gacha collect'],
    snippet: `-- TRADING CARD / COLLECTION SYSTEM
-- SERVER SCRIPT
-- Tracks which items a player has collected
local COLLECTION = {
  {id = "card_001", name = "Fire Dragon", rarity = "Legendary", set = "Dragons"},
  {id = "card_002", name = "Water Serpent", rarity = "Rare", set = "Dragons"},
  {id = "card_003", name = "Earth Golem", rarity = "Common", set = "Elementals"},
  -- ... hundreds more
}
local SETS = {
  Dragons = {cards = {"card_001", "card_002", "card_010", "card_015"}, reward = "DragonMount"},
  Elementals = {cards = {"card_003", "card_004", "card_005"}, reward = "ElementalAura"},
}
-- Player collection data: {collectedCards = {[cardId] = count}}
local function addCard(player: Player, cardId: string)
  local data = getPlayerData(player)
  data.collectedCards = data.collectedCards or {}
  data.collectedCards[cardId] = (data.collectedCards[cardId] or 0) + 1
  -- Check for set completion
  for setName, setData in pairs(SETS) do
    local hasAll = true
    for _, requiredId in ipairs(setData.cards) do
      if not data.collectedCards[requiredId] or data.collectedCards[requiredId] < 1 then
        hasAll = false break
      end
    end
    if hasAll and not data.completedSets[setName] then
      data.completedSets[setName] = true
      grantReward(player, setData.reward)
      game.ReplicatedStorage.Remotes.SetComplete:FireClient(player, setName)
    end
  end
end
-- Collection progress
local function getCollectionProgress(player: Player): (number, number)
  local data = getPlayerData(player)
  local collected = 0
  for _, card in COLLECTION do
    if data.collectedCards[card.id] and data.collectedCards[card.id] > 0 then
      collected += 1
    end
  end
  return collected, #COLLECTION
end`,
    pitfalls: [
      'Not tracking duplicates (players want to know how many of each card they have)',
      'Set completion checked every card add (cache completion state)',
      'No reward for completing sets (no incentive to collect)',
      'Collection progress not shown in UI (players cannot see what they are missing)',
      'Duplicate cards with no use (add fusion/trading/selling for duplicates)',
    ],
  },

  {
    name: 'Explosion Effect (Visual + Damage)',
    keywords: ['explosion', 'explode', 'blast', 'detonate', 'bomb', 'grenade', 'aoe damage', 'area effect'],
    snippet: `-- EXPLOSION EFFECT (visual particles + AOE damage + knockback)
-- SERVER SCRIPT
local function createExplosion(position: Vector3, radius: number, damage: number, owner: Player?)
  -- VISUAL (replicate to all clients)
  game.ReplicatedStorage.Remotes.ExplosionVFX:FireAllClients(position, radius)
  -- DAMAGE (server-authoritative)
  local params = OverlapParams.new()
  if owner and owner.Character then
    params.FilterDescendantsInstances = {owner.Character}
  end
  local parts = workspace:GetPartBoundsInRadius(position, radius, params)
  local damaged = {}
  for _, part in parts do
    local character = part:FindFirstAncestorOfClass("Model")
    if character and not damaged[character] then
      local humanoid = character:FindFirstChildOfClass("Humanoid")
      if humanoid and humanoid.Health > 0 then
        damaged[character] = true
        -- Distance falloff
        local rootPart = character:FindFirstChild("HumanoidRootPart")
        if rootPart then
          local dist = (rootPart.Position - position).Magnitude
          local falloff = 1 - math.clamp(dist / radius, 0, 1)
          local finalDamage = math.floor(damage * falloff)
          humanoid:TakeDamage(finalDamage)
          -- Knockback
          local dir = (rootPart.Position - position).Unit + Vector3.new(0, 0.5, 0)
          local att = rootPart:FindFirstChildOfClass("Attachment") or Instance.new("Attachment", rootPart)
          local lv = Instance.new("LinearVelocity")
          lv.Attachment0 = att lv.VectorVelocity = dir * 60 * falloff
          lv.MaxForce = 30000 lv.Parent = rootPart
          game.Debris:AddItem(lv, 0.3)
        end
      end
    end
  end
end
-- CLIENT: Visual explosion (called via RemoteEvent)
-- local function showExplosionVFX(position, radius)
--   local part = Instance.new("Part") part.Anchored = true part.CanCollide = false
--   part.Shape = Enum.PartType.Ball part.Size = Vector3.new(1,1,1)
--   part.Position = position part.Material = Enum.Material.Neon
--   part.Color = Color3.fromRGB(255,150,0) part.Transparency = 0.3 part.Parent = workspace
--   -- Expand + fade
--   TweenService:Create(part, TweenInfo.new(0.3), {Size = Vector3.new(radius*2,radius*2,radius*2), Transparency = 1}):Play()
--   Debris:AddItem(part, 0.5)
--   -- Screen shake for nearby players
--   startShake(5, 0.5)
-- end`,
    pitfalls: [
      'Using Roblox built-in Explosion instance (less control — create custom)',
      'No damage falloff (full damage at edge of radius is unrealistic)',
      'Explosion damages owner (filter owner character from overlap params)',
      'No screen shake (explosions without shake feel weak)',
      'Visual effect too small or too large for actual damage radius',
    ],
  },

  {
    name: 'A* Pathfinding (Custom Grid)',
    keywords: ['astar', 'a star', 'pathfinding', 'grid pathfinding', 'custom path', 'algorithm', 'shortest path'],
    snippet: `-- A* PATHFINDING on custom grid (when PathfindingService is not enough)
-- Use for: tower defense paths, strategy games, puzzle navigation
local function aStar(grid, startX: number, startY: number, endX: number, endY: number): {{number}}?
  local openSet = {} -- {node, ...}
  local closedSet = {} -- {["x_y"] = true}
  local cameFrom = {} -- {["x_y"] = "px_py"}
  local gScore = {} -- {["x_y"] = cost}
  local fScore = {} -- {["x_y"] = estimated total}
  local function key(x, y) return x .. "_" .. y end
  local function heuristic(x1, y1, x2, y2)
    return math.abs(x1 - x2) + math.abs(y1 - y2) -- Manhattan distance
  end
  gScore[key(startX, startY)] = 0
  fScore[key(startX, startY)] = heuristic(startX, startY, endX, endY)
  table.insert(openSet, {x = startX, y = startY})
  while #openSet > 0 do
    -- Find node with lowest fScore
    table.sort(openSet, function(a, b)
      return (fScore[key(a.x, a.y)] or math.huge) < (fScore[key(b.x, b.y)] or math.huge)
    end)
    local current = table.remove(openSet, 1)
    local ck = key(current.x, current.y)
    if current.x == endX and current.y == endY then
      -- Reconstruct path
      local path = {{endX, endY}}
      local k = key(endX, endY)
      while cameFrom[k] do
        k = cameFrom[k]
        local parts = k:split("_")
        table.insert(path, 1, {tonumber(parts[1]), tonumber(parts[2])})
      end
      return path
    end
    closedSet[ck] = true
    -- Check neighbors (4-directional)
    for _, d in ipairs({{0,1},{0,-1},{1,0},{-1,0}}) do
      local nx, ny = current.x + d[1], current.y + d[2]
      local nk = key(nx, ny)
      if closedSet[nk] then continue end
      if not grid[nx] or not grid[nx][ny] or not grid[nx][ny].walkable then continue end
      local tentativeG = (gScore[ck] or math.huge) + 1
      if tentativeG < (gScore[nk] or math.huge) then
        cameFrom[nk] = ck
        gScore[nk] = tentativeG
        fScore[nk] = tentativeG + heuristic(nx, ny, endX, endY)
        local found = false
        for _, node in openSet do
          if node.x == nx and node.y == ny then found = true break end
        end
        if not found then table.insert(openSet, {x = nx, y = ny}) end
      end
    end
  end
  return nil -- No path found
end`,
    pitfalls: [
      'Not sorting openSet by fScore (visits wrong nodes first — slow)',
      'No nil path handling (grid may have no valid path)',
      'Using Euclidean distance for grid movement (Manhattan is correct for 4-dir)',
      'Grid coordinates must match your world grid (off-by-one errors)',
      'Large grids (100x100+) need optimized priority queue, not table.sort',
    ],
  },

  {
    name: 'Voice Chat Proximity (AudioService)',
    keywords: ['voice', 'audio', 'proximity voice', 'spatial voice', 'voice chat', 'audioservice'],
    snippet: `-- SPATIAL VOICE / AUDIO PROXIMITY (Roblox AudioService 2024+)
-- Voice chat is enabled per-experience in Game Settings > Communication
-- No script needed for basic spatial voice — Roblox handles it automatically
-- This shows how to CONTROL audio properties programmatically

-- Check if voice chat is available for a player
local function isVoiceEnabled(player: Player): boolean
  -- Voice requires: age verified, setting enabled, not muted
  local success, result = pcall(function()
    return player:GetPropertyChangedSignal("HasVerifiedBadge") -- Proxy check
  end)
  return success
end

-- Audio device input (microphone) — client-side only
-- local mic = Instance.new("AudioDeviceInput")
-- mic.Player = Players.LocalPlayer
-- mic.Parent = Players.LocalPlayer.Character

-- Control audio output distance
-- AudioEmitter controls how far 3D sounds travel
-- Higher FalloffDistance = heard from farther away

-- Mute/unmute a player's voice (server-side moderation)
local function mutePlayer(player: Player, mute: boolean)
  -- Use AudioDeviceInput.Enabled on the player's character
  -- This requires the new AudioService API
  local character = player.Character
  if character then
    local audioInput = character:FindFirstChildOfClass("AudioDeviceInput")
    if audioInput then
      audioInput.Enabled = not mute
    end
  end
end

-- ZONE-BASED VOICE:
-- Some games mute voice in certain areas (exam rooms, cutscenes)
-- Set AudioDeviceInput.Enabled = false when player enters quiet zone`,
    pitfalls: [
      'Voice chat requires age verification — not all players will have it',
      'Cannot force-enable voice for players (their setting, not yours)',
      'Spatial voice range is automatic — do not try to manually replicate position',
      'AudioDeviceInput only exists if voice is active — check for nil',
      'Voice moderation is handled by Roblox — do not build custom voice filters',
    ],
  },

  {
    name: 'Lobby / Waiting Area Pattern',
    keywords: ['lobby', 'waiting room', 'queue', 'ready up', 'countdown', 'pre-game', 'hub', 'spawn area'],
    snippet: `-- LOBBY / WAITING AREA (spawn, ready up, countdown to game)
-- SERVER SCRIPT
local Players = game:GetService("Players")
local MIN_PLAYERS = 2
local MAX_PLAYERS = 12
local COUNTDOWN = 15
local readyPlayers = {} -- [userId] = true
local gameRunning = false
-- Spawn players in lobby
local lobbySpawns = workspace.Lobby.Spawns:GetChildren()
Players.PlayerAdded:Connect(function(player)
  player.RespawnLocation = lobbySpawns[math.random(#lobbySpawns)]
  player.CharacterAdded:Connect(function(character)
    if not gameRunning then
      task.wait(0.2)
      character:PivotTo(lobbySpawns[math.random(#lobbySpawns)].CFrame + Vector3.new(0, 3, 0))
    end
  end)
end)
-- Ready up system
local ReadyRemote = game.ReplicatedStorage.Remotes.Ready
ReadyRemote.OnServerEvent:Connect(function(player)
  readyPlayers[player.UserId] = not readyPlayers[player.UserId]
  -- Broadcast ready state to all
  local readyCount = 0
  for _ in pairs(readyPlayers) do readyCount += 1 end
  game.ReplicatedStorage.Remotes.ReadyUpdate:FireAllClients(readyCount, #Players:GetPlayers())
  -- Start countdown if enough ready
  if readyCount >= MIN_PLAYERS then
    startCountdown()
  end
end)
local countdownActive = false
local function startCountdown()
  if countdownActive then return end
  countdownActive = true
  for i = COUNTDOWN, 1, -1 do
    -- Check if still enough players
    local readyCount = 0
    for _ in pairs(readyPlayers) do readyCount += 1 end
    if readyCount < MIN_PLAYERS then
      countdownActive = false
      game.ReplicatedStorage.Remotes.CountdownCancel:FireAllClients()
      return
    end
    game.ReplicatedStorage.Remotes.Countdown:FireAllClients(i)
    task.wait(1)
  end
  countdownActive = false
  startGame()
end`,
    pitfalls: [
      'No minimum player check (game starts with 1 player)',
      'Players leaving during countdown not handled (abort if below minimum)',
      'Ready state not cleared when player leaves (ghost ready players)',
      'No visual ready indicator (other players cannot see who is ready)',
      'Lobby too small or boring (add minigames, practice targets, cosmetic previews)',
    ],
  },

  {
    name: 'Particle Trail On Character',
    keywords: ['trail', 'character trail', 'footstep', 'aura', 'glowing trail', 'speed trail', 'cosmetic trail'],
    snippet: `-- PARTICLE TRAIL ON CHARACTER (cosmetic aura/speed trail)
-- SERVER SCRIPT (applied to character)
local function addCharacterTrail(character: Model, trailType: string)
  local rootPart = character:FindFirstChild("HumanoidRootPart")
  if not rootPart then return end
  -- Remove old trail
  local oldTrail = rootPart:FindFirstChild("CosmeticTrail")
  if oldTrail then oldTrail:Destroy() end
  local trailFolder = Instance.new("Folder") trailFolder.Name = "CosmeticTrail" trailFolder.Parent = rootPart
  if trailType == "Fire" then
    local att0 = Instance.new("Attachment") att0.Position = Vector3.new(0, -2, -1) att0.Parent = rootPart
    local att1 = Instance.new("Attachment") att1.Position = Vector3.new(0, -2, 1) att1.Parent = rootPart
    local trail = Instance.new("Trail")
    trail.Attachment0 = att0 trail.Attachment1 = att1 trail.Lifetime = 0.5 trail.MinLength = 0.2
    trail.Color = ColorSequence.new({
      ColorSequenceKeypoint.new(0, Color3.fromRGB(255, 200, 50)),
      ColorSequenceKeypoint.new(1, Color3.fromRGB(255, 50, 0)),
    })
    trail.Transparency = NumberSequence.new({
      NumberSequenceKeypoint.new(0, 0), NumberSequenceKeypoint.new(1, 1),
    })
    trail.LightEmission = 0.8 trail.Parent = trailFolder
    att0.Parent = trailFolder att1.Parent = trailFolder
  elseif trailType == "Stars" then
    local emitter = Instance.new("ParticleEmitter")
    emitter.Rate = 10 emitter.Lifetime = NumberRange.new(1, 2)
    emitter.Speed = NumberRange.new(0.5, 1.5) emitter.SpreadAngle = Vector2.new(180, 180)
    emitter.Size = NumberSequence.new({
      NumberSequenceKeypoint.new(0, 0), NumberSequenceKeypoint.new(0.3, 0.4),
      NumberSequenceKeypoint.new(0.7, 0.4), NumberSequenceKeypoint.new(1, 0),
    })
    emitter.Color = ColorSequence.new(Color3.fromRGB(255, 220, 100))
    emitter.LightEmission = 1 emitter.Brightness = 3
    emitter.Parent = trailFolder
    trailFolder.Parent = rootPart
  elseif trailType == "Rainbow" then
    local att0 = Instance.new("Attachment") att0.Position = Vector3.new(0, -1, -0.5) att0.Parent = trailFolder
    local att1 = Instance.new("Attachment") att1.Position = Vector3.new(0, -1, 0.5) att1.Parent = trailFolder
    local trail = Instance.new("Trail")
    trail.Attachment0 = att0 trail.Attachment1 = att1 trail.Lifetime = 0.8
    trail.Color = ColorSequence.new({
      ColorSequenceKeypoint.new(0, Color3.fromRGB(255, 0, 0)),
      ColorSequenceKeypoint.new(0.17, Color3.fromRGB(255, 165, 0)),
      ColorSequenceKeypoint.new(0.33, Color3.fromRGB(255, 255, 0)),
      ColorSequenceKeypoint.new(0.5, Color3.fromRGB(0, 255, 0)),
      ColorSequenceKeypoint.new(0.67, Color3.fromRGB(0, 100, 255)),
      ColorSequenceKeypoint.new(0.83, Color3.fromRGB(75, 0, 130)),
      ColorSequenceKeypoint.new(1, Color3.fromRGB(200, 50, 255)),
    })
    trail.Transparency = NumberSequence.new({
      NumberSequenceKeypoint.new(0, 0), NumberSequenceKeypoint.new(1, 0.8),
    })
    trail.LightEmission = 0.5 trail.Parent = trailFolder
  end
end`,
    pitfalls: [
      'Trail attachments on wrong part (must be on HumanoidRootPart for movement trail)',
      'Attachment positions too close together (trail is invisible — separate by 1-2 studs)',
      'Not removing old trail before adding new (multiple trails overlap)',
      'Trail Lifetime too long (character leaves long smear across map)',
      'ParticleEmitter Rate too high on mobile (10-15 is reasonable for cosmetics)',
    ],
  },

  {
    name: 'Viewport Frame (3D Preview in UI)',
    keywords: ['viewportframe', 'viewport', '3d preview', 'item preview', 'model viewer', 'rotate preview'],
    snippet: `-- VIEWPORTFRAME (3D model preview inside UI)
-- CLIENT SCRIPT — shows 3D models in 2D GUI
local function create3DPreview(parent: Frame, model: Model)
  local viewport = Instance.new("ViewportFrame")
  viewport.Size = UDim2.new(1, 0, 1, 0)
  viewport.BackgroundTransparency = 1
  viewport.Parent = parent
  -- Clone model into viewport
  local previewModel = model:Clone()
  previewModel.Parent = viewport
  -- Camera for viewport
  local cam = Instance.new("Camera")
  cam.CameraType = Enum.CameraType.Scriptable
  cam.Parent = viewport
  viewport.CurrentCamera = cam
  -- Position camera to frame the model
  local cf, size = previewModel:GetBoundingBox()
  local maxDim = math.max(size.X, size.Y, size.Z)
  cam.CFrame = CFrame.lookAt(
    cf.Position + Vector3.new(maxDim * 1.2, maxDim * 0.8, maxDim * 1.2),
    cf.Position
  )
  -- OPTIONAL: Rotate model on hover
  local angle = 0
  local rotating = false
  parent.MouseEnter:Connect(function() rotating = true end)
  parent.MouseLeave:Connect(function() rotating = false end)
  game:GetService("RunService").RenderStepped:Connect(function(dt)
    if rotating then
      angle += dt * 1.5
      cam.CFrame = CFrame.lookAt(
        cf.Position + Vector3.new(math.cos(angle) * maxDim * 1.5, maxDim * 0.8, math.sin(angle) * maxDim * 1.5),
        cf.Position
      )
    end
  end)
  return viewport
end`,
    pitfalls: [
      'No camera in ViewportFrame = shows nothing (must set CurrentCamera)',
      'Camera too close or too far (auto-calculate from model bounding box)',
      'Model not cloned (original disappears from workspace when parented to viewport)',
      'ViewportFrame does NOT render terrain — use parts only',
      'Too many ViewportFrames (each one is a separate render pass — max 3-4 on screen)',
    ],
  },

  {
    name: 'Surface GUI Interactive (Buttons on Parts)',
    keywords: ['surfacegui', 'surface gui', 'interactive', 'button on part', 'in-world ui', 'screen on part'],
    snippet: `-- SURFACE GUI INTERACTIVE (clickable buttons on world parts)
-- Must use LocalScript for client interaction OR Adornee from server
local function createInteractiveSurface(part: BasePart, face: Enum.NormalId)
  local sg = Instance.new("SurfaceGui")
  sg.Face = face or Enum.NormalId.Front
  sg.SizingMode = Enum.SurfaceGuiSizingMode.PixelsPerStud
  sg.PixelsPerStud = 50
  sg.Parent = part
  -- Background
  local bg = Instance.new("Frame") bg.Size = UDim2.new(1, 0, 1, 0)
  bg.BackgroundColor3 = Color3.fromRGB(10, 12, 20) bg.Parent = sg
  Instance.new("UICorner", bg).CornerRadius = UDim.new(0.05, 0)
  Instance.new("UIPadding", bg).PaddingAll = UDim.new(0.05, 0)
  -- Title
  local title = Instance.new("TextLabel")
  title.Size = UDim2.new(1, 0, 0.2, 0) title.BackgroundTransparency = 1
  title.Text = "TERMINAL" title.TextColor3 = Color3.fromRGB(0, 200, 100)
  title.Font = Enum.Font.Code title.TextScaled = true title.Parent = bg
  -- Button
  local btn = Instance.new("TextButton")
  btn.Size = UDim2.new(0.6, 0, 0.2, 0) btn.Position = UDim2.new(0.2, 0, 0.5, 0)
  btn.Text = "ACTIVATE" btn.TextColor3 = Color3.fromRGB(0, 255, 100)
  btn.BackgroundColor3 = Color3.fromRGB(20, 60, 30)
  btn.Font = Enum.Font.Code btn.TextScaled = true btn.Parent = bg
  Instance.new("UICorner", btn).CornerRadius = UDim.new(0.2, 0)
  -- Interaction (CLIENT-SIDE — SurfaceGui buttons only work in LocalScripts)
  btn.Activated:Connect(function()
    -- Fire remote to server
    game.ReplicatedStorage.Remotes.TerminalActivate:FireServer(part)
  end)
  return sg
end
-- IMPORTANT: For SurfaceGui buttons to be clickable:
-- 1. SurfaceGui must be in PlayerGui with Adornee set to the part
-- 2. OR SurfaceGui is child of part but interaction is handled by client proximity`,
    pitfalls: [
      'SurfaceGui buttons in ServerScript are NOT clickable (client-side only)',
      'PixelsPerStud too low = blurry text (50+ for sharp text)',
      'SurfaceGui on back face = invisible from front (check Face property)',
      'TextScaled without UITextSizeConstraint can make text tiny on large surfaces',
      'Players must be close to interact — add MaxDistance check or ProximityPrompt',
    ],
  },

  {
    name: 'Object Rotation Showcase (Spinning Items)',
    keywords: ['spin', 'rotate', 'showcase', 'display', 'rotating', 'turntable', 'pedestal', 'item showcase'],
    snippet: `-- SPINNING SHOWCASE (items rotating on pedestals)
-- SERVER or CLIENT SCRIPT — use CollectionService for efficiency
local RunService = game:GetService("RunService")
local CollectionService = game:GetService("CollectionService")
-- Tag parts as "Spinning" and set Attribute "SpinSpeed" (radians/sec)
local function setupSpinner(part: BasePart)
  local speed = part:GetAttribute("SpinSpeed") or 1
  local axis = part:GetAttribute("SpinAxis") or "Y"
  local conn
  conn = RunService.Heartbeat:Connect(function(dt)
    if not part.Parent then conn:Disconnect() return end
    local r = speed * dt
    if axis == "Y" then part.CFrame *= CFrame.Angles(0, r, 0)
    elseif axis == "X" then part.CFrame *= CFrame.Angles(r, 0, 0)
    elseif axis == "Z" then part.CFrame *= CFrame.Angles(0, 0, r) end
  end)
end
for _, part in CollectionService:GetTagged("Spinning") do setupSpinner(part) end
CollectionService:GetInstanceAddedSignal("Spinning"):Connect(setupSpinner)
-- SHOWCASE PEDESTAL (base + floating item + particles)
local function createShowcase(pos, item: Instance, parent)
  local m = Instance.new("Model") m.Name = "Showcase"
  -- Pedestal base
  local base = Instance.new("Part") base.Shape = Enum.PartType.Cylinder base.Anchored = true
  base.Size = Vector3.new(1.5, 4, 4)
  base.CFrame = CFrame.new(pos + Vector3.new(0, 0.75, 0)) * CFrame.Angles(0, 0, math.rad(90))
  base.Material = Enum.Material.Marble base.Color = Color3.fromRGB(30, 35, 45) base.Parent = m
  -- Floating item (tagged as Spinning)
  local display = item:Clone()
  if display:IsA("Model") then
    display:PivotTo(CFrame.new(pos + Vector3.new(0, 4, 0)))
  elseif display:IsA("BasePart") then
    display.CFrame = CFrame.new(pos + Vector3.new(0, 4, 0))
    display.Anchored = true
  end
  CollectionService:AddTag(display, "Spinning")
  display:SetAttribute("SpinSpeed", 1.5) display.Parent = m
  -- Glow ring
  local ring = Instance.new("Part") ring.Shape = Enum.PartType.Cylinder ring.Anchored = true
  ring.Size = Vector3.new(0.2, 3.5, 3.5)
  ring.CFrame = CFrame.new(pos + Vector3.new(0, 2, 0)) * CFrame.Angles(0, 0, math.rad(90))
  ring.Material = Enum.Material.Neon ring.Color = Color3.fromRGB(212, 175, 55)
  ring.Parent = m
  Instance.new("PointLight", ring).Color = ring.Color
  m.Parent = parent or workspace return m
end`,
    pitfalls: [
      'Per-instance script for rotation (use CollectionService — one script for all)',
      'Not disconnecting Heartbeat when part is destroyed (memory leak)',
      'Rotation speed not configurable per part (use Attributes)',
      'Showcase item not Anchored (falls off pedestal)',
      'Missing glow effect on pedestal (Neon ring + PointLight makes items pop)',
    ],
  },

  {
    name: 'HTTP Request (External APIs)',
    keywords: ['http', 'httpservice', 'api', 'rest', 'json', 'fetch', 'external', 'webhook', 'request'],
    snippet: `-- HTTPSERVICE (external API calls from server)
-- SERVER SCRIPT ONLY — HttpService is disabled by default!
-- Enable in Game Settings > Security > Allow HTTP Requests

local HttpService = game:GetService("HttpService")

-- GET request
local function httpGet(url: string): (boolean, any)
  local success, response = pcall(function()
    return HttpService:GetAsync(url)
  end)
  if success then
    local data = HttpService:JSONDecode(response)
    return true, data
  end
  return false, response
end

-- POST request (e.g., Discord webhook, analytics)
local function httpPost(url: string, data: {})
  local json = HttpService:JSONEncode(data)
  local success, response = pcall(function()
    return HttpService:PostAsync(url, json, Enum.HttpContentType.ApplicationJson)
  end)
  return success, response
end

-- DISCORD WEBHOOK example:
local WEBHOOK_URL = "https://discord.com/api/webhooks/..." -- Your webhook
local function sendDiscordMessage(content: string)
  httpPost(WEBHOOK_URL, {
    content = content,
    username = "Game Bot",
  })
end

-- RATE LIMITS:
-- 500 requests per minute per server
-- Requests to roblox.com/robloxapis.com are BLOCKED
-- HttpService is SERVER ONLY — never available on client`,
    pitfalls: [
      'HttpService disabled by default (must enable in Game Settings > Security)',
      'Cannot call roblox.com APIs via HttpService (blocked)',
      'Rate limited to 500 req/min (queue requests if needed)',
      'SERVER ONLY — HttpService does not exist on client',
      'Always wrap in pcall (network requests fail frequently)',
    ],
  },

  {
    name: 'Tween Color Cycle (Rainbow/Pulse)',
    keywords: ['rainbow', 'color cycle', 'pulse', 'glow pulse', 'color change', 'animated color', 'cycle'],
    snippet: `-- COLOR CYCLE / RAINBOW / PULSE EFFECTS
-- CLIENT or SERVER SCRIPT
local TweenService = game:GetService("TweenService")
-- RAINBOW CYCLE (continuous color rotation)
local function rainbowCycle(part: BasePart, duration: number)
  local colors = {
    Color3.fromRGB(255, 0, 0),
    Color3.fromRGB(255, 165, 0),
    Color3.fromRGB(255, 255, 0),
    Color3.fromRGB(0, 255, 0),
    Color3.fromRGB(0, 100, 255),
    Color3.fromRGB(75, 0, 130),
    Color3.fromRGB(200, 50, 255),
  }
  task.spawn(function()
    local idx = 1
    while part.Parent do
      local nextIdx = idx % #colors + 1
      TweenService:Create(part, TweenInfo.new(duration / #colors), {
        Color = colors[nextIdx]
      }):Play()
      task.wait(duration / #colors)
      idx = nextIdx
    end
  end)
end
-- GLOW PULSE (fade brightness in and out)
local function glowPulse(part: BasePart, minTransparency: number, maxTransparency: number, duration: number)
  local tween1 = TweenService:Create(part, TweenInfo.new(
    duration / 2, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut
  ), {Transparency = maxTransparency})
  local tween2 = TweenService:Create(part, TweenInfo.new(
    duration / 2, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut
  ), {Transparency = minTransparency})
  tween1.Completed:Connect(function() tween2:Play() end)
  tween2.Completed:Connect(function() tween1:Play() end)
  tween1:Play()
end
-- NEON PULSE (for lights and accents):
-- glowPulse(neonPart, 0, 0.5, 2) -- Fades between full and half transparent
-- COLLECTIBLE GLOW:
-- glowPulse(coinPart, 0, 0.3, 1.5) -- Subtle pulse draws attention`,
    pitfalls: [
      'Rainbow loop without checking part.Parent (continues after part destroyed)',
      'Color tweens on many parts simultaneously is expensive (use sparingly)',
      'Glow pulse with Transparency going to 1.0 makes part invisible (stop at 0.5)',
      'Sine easing on pulse creates natural breathing effect (never use Linear)',
      'Per-frame color calculation is expensive — tweens are more efficient',
    ],
  },

  {
    name: 'Model Pivot and Manipulation',
    keywords: ['pivot', 'pivotto', 'model', 'getpivot', 'setprimarypartcframe', 'move model', 'transform model'],
    snippet: `-- MODEL PIVOT AND MANIPULATION (modern Roblox API)
-- PivotTo replaces deprecated SetPrimaryPartCFrame

-- MOVE A MODEL:
local model = workspace.MyBuilding
model:PivotTo(CFrame.new(0, 10, 0)) -- Moves entire model

-- GET MODEL POSITION:
local position = model:GetPivot() -- Returns CFrame

-- SET PIVOT OFFSET (where the "center" is):
-- model.WorldPivot = CFrame.new(0, 0, 0) -- Default: center of bounding box

-- ROTATE A MODEL:
local currentCF = model:GetPivot()
model:PivotTo(currentCF * CFrame.Angles(0, math.rad(45), 0))

-- SCALE A MODEL:
local function scaleModel(model: Model, factor: number)
  local pivot = model:GetPivot()
  for _, part in model:GetDescendants() do
    if part:IsA("BasePart") then
      -- Scale size
      part.Size = part.Size * factor
      -- Scale position relative to pivot
      local offset = pivot:PointToObjectSpace(part.Position)
      part.Position = pivot:PointToWorldSpace(offset * factor)
    end
  end
end

-- GET BOUNDING BOX:
local cf, size = model:GetBoundingBox()
-- cf = CFrame of center, size = Vector3 dimensions
print("Model center:", cf.Position)
print("Model size:", size)

-- CLONE AND PLACE:
local clone = model:Clone()
clone:PivotTo(CFrame.new(50, 0, 0))
clone.Parent = workspace`,
    pitfalls: [
      'SetPrimaryPartCFrame is DEPRECATED — use PivotTo() instead',
      'PivotTo requires PrimaryPart set on Model (or uses WorldPivot)',
      'GetBoundingBox returns CENTER CFrame not corner positions',
      'Scaling with CFrame math must account for part orientations',
      'Clone does NOT clone scripts by default in some contexts — verify',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FINAL BATCH — 12 entries to reach 200+
  // ═══════════════════════════════════════════════════════════════════════════

  {
    name: 'Debounce Pattern (Advanced)',
    keywords: ['debounce', 'throttle', 'rate limit client', 'prevent double', 'click spam', 'once per'],
    snippet: `-- DEBOUNCE PATTERNS (prevent double-fire, click spam, rapid actions)
-- Universal debounce module
local Debounce = {}
local active = {} -- [key] = true
function Debounce.start(key: string): boolean
  if active[key] then return false end -- Already running
  active[key] = true
  return true
end
function Debounce.finish(key: string)
  active[key] = nil
end
function Debounce.wrap(key: string, duration: number, fn: () -> ())
  if not Debounce.start(key) then return end
  fn()
  task.delay(duration, function() Debounce.finish(key) end)
end
-- USAGE PATTERNS:
-- Per-player debounce on Touched:
-- if not Debounce.start("touch_" .. player.UserId) then return end
-- ... do work ...
-- task.delay(1, function() Debounce.finish("touch_" .. player.UserId) end)
-- Per-action debounce on button click:
-- Debounce.wrap("buy_item", 0.5, function() buyItem(player, itemId) end)`,
    pitfalls: [
      'Boolean debounce without cleanup (stays true forever if function errors)',
      'Same debounce key for different actions (use unique keys like "action_userId")',
      'Not cleaning up debounce state on PlayerRemoving (memory leak)',
      'Debounce too long frustrates legitimate fast actions (0.2-0.5s for clicks)',
      'Client-only debounce is bypassable — server must also validate',
    ],
  },

  {
    name: 'Footstep Sounds',
    keywords: ['footstep', 'walk sound', 'step', 'material sound', 'ground sound', 'terrain sound'],
    snippet: `-- FOOTSTEP SOUNDS (different sounds per material/terrain)
-- CLIENT SCRIPT
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local player = Players.LocalPlayer
local STEP_INTERVAL = 0.35 -- seconds between steps
local lastStep = 0
local STEP_SOUNDS = {
  [Enum.Material.Grass] = "rbxassetid://grass_step",
  [Enum.Material.Concrete] = "rbxassetid://concrete_step",
  [Enum.Material.Wood] = "rbxassetid://wood_step",
  [Enum.Material.Metal] = "rbxassetid://metal_step",
  [Enum.Material.Sand] = "rbxassetid://sand_step",
  [Enum.Material.Water] = "rbxassetid://splash_step",
}
RunService.Heartbeat:Connect(function()
  local character = player.Character
  if not character then return end
  local humanoid = character:FindFirstChildOfClass("Humanoid")
  if not humanoid or humanoid.MoveDirection.Magnitude < 0.1 then return end
  local now = tick()
  local interval = STEP_INTERVAL * (16 / humanoid.WalkSpeed) -- Faster = shorter interval
  if now - lastStep < interval then return end
  lastStep = now
  -- Raycast down to detect floor material
  local rootPart = character:FindFirstChild("HumanoidRootPart")
  if not rootPart then return end
  local result = workspace:Raycast(rootPart.Position, Vector3.new(0, -5, 0))
  if not result then return end
  local material = result.Material
  local soundId = STEP_SOUNDS[material] or STEP_SOUNDS[Enum.Material.Concrete]
  -- Play sound at foot position
  local sound = Instance.new("Sound")
  sound.SoundId = soundId sound.Volume = 0.3
  sound.PlaybackSpeed = 0.9 + math.random() * 0.2 -- Slight variation
  sound.Parent = rootPart
  sound:Play()
  sound.Ended:Connect(function() sound:Destroy() end)
end)`,
    pitfalls: [
      'Same sound every step (vary PlaybackSpeed by ±10% for natural feel)',
      'Step interval not scaled with WalkSpeed (sprinting sounds same as walking)',
      'Creating Sound instances without destroying them (memory leak — destroy on Ended)',
      'Volume too loud (footsteps should be subtle: 0.2-0.4)',
      'No raycast to detect material (all surfaces sound the same)',
    ],
  },

  {
    name: 'Billboard Distance Fade',
    keywords: ['billboard fade', 'distance fade', 'nametag distance', 'label visibility', 'far hide'],
    snippet: `-- BILLBOARD DISTANCE FADE (fade out BillboardGui based on camera distance)
-- CLIENT SCRIPT
local RunService = game:GetService("RunService")
local camera = workspace.CurrentCamera
local function setupDistanceFade(billboard: BillboardGui, maxDist: number, fadeStart: number?)
  local start = fadeStart or (maxDist * 0.7)
  RunService.RenderStepped:Connect(function()
    local adornee = billboard.Adornee
    if not adornee then return end
    local dist = (camera.CFrame.Position - adornee.Position).Magnitude
    if dist > maxDist then
      billboard.Enabled = false
    else
      billboard.Enabled = true
      if dist > start then
        local alpha = (dist - start) / (maxDist - start)
        -- Fade all text/frames
        for _, child in billboard:GetDescendants() do
          if child:IsA("TextLabel") then
            child.TextTransparency = alpha
          elseif child:IsA("Frame") then
            child.BackgroundTransparency = math.max(child:GetAttribute("BaseTransparency") or 0, alpha)
          end
        end
      end
    end
  end)
end`,
    pitfalls: [
      'BillboardGui.MaxDistance is simpler for just hiding (use that for basic cases)',
      'Fading every frame on many billboards is expensive — limit to nearby ones',
      'Not storing base transparency (fade overrides intentionally transparent elements)',
      'fadeStart too close to maxDist (abrupt pop instead of gradual fade)',
      'Checking distance from adornee Position, not world position (may be offset)',
    ],
  },

  {
    name: 'Hitbox / Hurt Box Pattern',
    keywords: ['hitbox', 'hurt box', 'melee hitbox', 'attack hitbox', 'combat hitbox', 'swing hitbox'],
    snippet: `-- HITBOX / HURT BOX (time-limited damage zone for melee attacks)
-- SERVER SCRIPT
local function createHitbox(character: Model, offset: Vector3, size: Vector3, damage: number, duration: number)
  local rootPart = character:FindFirstChild("HumanoidRootPart")
  if not rootPart then return end
  local player = game.Players:GetPlayerFromCharacter(character)
  local alreadyHit = {}
  local startTime = tick()
  local conn
  conn = game:GetService("RunService").Heartbeat:Connect(function()
    if tick() - startTime > duration then conn:Disconnect() return end
    -- Hitbox position in front of character
    local hitboxCF = rootPart.CFrame * CFrame.new(offset)
    local params = OverlapParams.new()
    params.FilterDescendantsInstances = {character}
    local hits = workspace:GetPartBoundsInBox(hitboxCF, size, params)
    for _, part in hits do
      local hitChar = part:FindFirstAncestorOfClass("Model")
      if hitChar and not alreadyHit[hitChar] then
        local humanoid = hitChar:FindFirstChildOfClass("Humanoid")
        if humanoid and humanoid.Health > 0 then
          alreadyHit[hitChar] = true
          humanoid:TakeDamage(damage)
          -- Damage attribution
          if player then
            local tag = Instance.new("ObjectValue")
            tag.Name = "creator" tag.Value = player tag.Parent = humanoid
            game.Debris:AddItem(tag, 3)
          end
        end
      end
    end
  end)
end
-- USAGE (on attack animation):
-- createHitbox(character, Vector3.new(0, 0, -4), Vector3.new(6, 4, 6), 25, 0.3)
-- offset: (0, 0, -4) = 4 studs in front
-- size: 6x4x6 hitbox
-- 25 damage, active for 0.3 seconds`,
    pitfalls: [
      'Hitbox active too long (> 0.5s) hits same enemy multiple times',
      'alreadyHit table prevents multi-hit (intentional for most melee)',
      'Hitbox not following character (recalculate CFrame each frame from rootPart)',
      'Using Touched instead of GetPartBoundsInBox (unreliable at high speeds)',
      'Hitbox size too large = hitting through walls (keep reasonable)',
    ],
  },

  {
    name: 'Number Formatting Utilities',
    keywords: ['format', 'number format', 'abbreviate', 'comma', 'K M B', 'currency format', 'time format'],
    snippet: `-- NUMBER FORMATTING UTILITIES (shared module)
local Format = {}
-- Abbreviate: 1500 → "1.5K", 1500000 → "1.5M"
function Format.abbreviate(n: number): string
  if n >= 1e12 then return string.format("%.1fT", n / 1e12)
  elseif n >= 1e9 then return string.format("%.1fB", n / 1e9)
  elseif n >= 1e6 then return string.format("%.1fM", n / 1e6)
  elseif n >= 1e3 then return string.format("%.1fK", n / 1e3)
  end
  return tostring(math.floor(n))
end
-- Commas: 1500000 → "1,500,000"
function Format.commas(n: number): string
  local s = tostring(math.floor(n))
  local result = ""
  for i = #s, 1, -1 do
    result = s:sub(i, i) .. result
    if (#s - i + 1) % 3 == 0 and i > 1 then result = "," .. result end
  end
  return result
end
-- Time: 125 seconds → "2:05"
function Format.time(seconds: number): string
  local mins = math.floor(seconds / 60)
  local secs = math.floor(seconds % 60)
  return string.format("%d:%02d", mins, secs)
end
-- Time long: 3725 → "1h 2m 5s"
function Format.timeLong(seconds: number): string
  local h = math.floor(seconds / 3600)
  local m = math.floor((seconds % 3600) / 60)
  local s = math.floor(seconds % 60)
  if h > 0 then return string.format("%dh %dm %ds", h, m, s) end
  if m > 0 then return string.format("%dm %ds", m, s) end
  return string.format("%ds", s)
end
-- Percentage: 0.756 → "75.6%"
function Format.percent(ratio: number): string
  return string.format("%.1f%%", ratio * 100)
end
return Format`,
    pitfalls: [
      'Not handling negative numbers (abbreviate(-1500) should show "-1.5K")',
      'Using tostring on floats shows excessive decimals (always math.floor or format)',
      'Time format not zero-padded seconds (2:5 should be 2:05 — use %02d)',
      'Comma formatting breaks on decimal numbers (only use on integers)',
      'Not using this module everywhere (inconsistent number display across UI)',
    ],
  },

  {
    name: 'Safe Zone / PvP Toggle',
    keywords: ['safe zone', 'pvp', 'no pvp', 'peace zone', 'pvp toggle', 'combat zone', 'protection'],
    snippet: `-- SAFE ZONE / PVP TOGGLE (disable damage in certain areas)
-- SERVER SCRIPT
local CollectionService = game:GetService("CollectionService")
local safePlayers = {} -- [userId] = true (player is in safe zone)
-- Tag safe zone parts as "SafeZone"
local function setupSafeZone(zonePart: BasePart)
  zonePart.Touched:Connect(function(hit)
    local player = game.Players:GetPlayerFromCharacter(hit.Parent)
    if player then safePlayers[player.UserId] = true end
  end)
  zonePart.TouchEnded:Connect(function(hit)
    local player = game.Players:GetPlayerFromCharacter(hit.Parent)
    if player then safePlayers[player.UserId] = nil end
  end)
end
for _, zone in CollectionService:GetTagged("SafeZone") do setupSafeZone(zone) end
CollectionService:GetInstanceAddedSignal("SafeZone"):Connect(setupSafeZone)
-- Override damage: wrap TakeDamage or use Humanoid.HealthChanged
local function canDamage(attacker: Player?, target: Player): boolean
  if safePlayers[target.UserId] then return false end -- Target in safe zone
  if attacker and safePlayers[attacker.UserId] then return false end -- Attacker in safe zone
  return true
end
-- Apply to your damage function:
-- if not canDamage(attackerPlayer, targetPlayer) then return end
-- humanoid:TakeDamage(damage)
-- VISUAL INDICATOR (client-side):
-- When player enters safe zone, show green shield icon
-- When in PvP zone, show crossed swords icon`,
    pitfalls: [
      'TouchEnded unreliable for zone detection (polling with GetPartsInPart is safer)',
      'Only protecting target — attacker in safe zone should also be unable to deal damage',
      'No visual indicator (players do not know they are in/out of safe zone)',
      'Safe zone parts must have CanCollide = false and be transparent',
      'Not cleaning safePlayers on PlayerRemoving (memory leak)',
    ],
  },

  {
    name: 'Camera Zoom Lock',
    keywords: ['camera zoom', 'zoom lock', 'fixed zoom', 'zoom distance', 'camera distance', 'zoom limit'],
    snippet: `-- CAMERA ZOOM LOCK (control zoom distance per game context)
-- CLIENT SCRIPT
local Players = game:GetService("Players")
local player = Players.LocalPlayer
-- Lock to specific zoom range
local function setZoomRange(minDist: number, maxDist: number)
  player.CameraMinZoomDistance = minDist
  player.CameraMaxZoomDistance = maxDist
end
-- PRESETS:
-- First person: setZoomRange(0.5, 0.5)
-- Third person locked: setZoomRange(10, 10)
-- Close combat: setZoomRange(5, 15)
-- Open world: setZoomRange(0.5, 128) -- Default
-- Isometric: setZoomRange(50, 50) + top-down camera
-- Restore default:
local function restoreZoom()
  player.CameraMinZoomDistance = 0.5
  player.CameraMaxZoomDistance = 128
  player.CameraMode = Enum.CameraMode.Classic
end
-- Lock first person (no zoom out):
local function lockFirstPerson()
  player.CameraMode = Enum.CameraMode.LockFirstPerson
end`,
    pitfalls: [
      'CameraMinZoomDistance > CameraMaxZoomDistance causes errors',
      'Locking first person in a third-person game without toggle frustrates players',
      'Not restoring defaults when exiting locked mode (player stuck zoomed)',
      'CameraMode changes only work on LocalPlayer — server cannot set camera mode',
      'Mobile players may need different zoom ranges than PC players',
    ],
  },

  {
    name: 'Region / Zone Detection',
    keywords: ['region', 'zone', 'area', 'detect', 'inside', 'boundary', 'enter zone', 'leave zone', 'zone system'],
    snippet: `-- REGION / ZONE DETECTION (detect when player enters/leaves areas)
-- SERVER SCRIPT — polling-based (more reliable than Touched)
local RunService = game:GetService("RunService")
local Players = game:GetService("Players")
local playerZones = {} -- [userId] = currentZoneName
-- Define zones as parts (CanCollide=false, Transparency=1)
local zones = workspace:WaitForChild("Zones"):GetChildren()
local function getZoneAtPosition(position: Vector3): string?
  for _, zone in zones do
    if not zone:IsA("BasePart") then continue end
    -- Check if position is inside zone bounding box
    local relPos = zone.CFrame:PointToObjectSpace(position)
    local halfSize = zone.Size / 2
    if math.abs(relPos.X) <= halfSize.X and
       math.abs(relPos.Y) <= halfSize.Y and
       math.abs(relPos.Z) <= halfSize.Z then
      return zone.Name
    end
  end
  return nil
end
-- Poll player positions
RunService.Heartbeat:Connect(function()
  for _, player in Players:GetPlayers() do
    local character = player.Character
    if not character then continue end
    local rootPart = character:FindFirstChild("HumanoidRootPart")
    if not rootPart then continue end
    local newZone = getZoneAtPosition(rootPart.Position)
    local oldZone = playerZones[player.UserId]
    if newZone ~= oldZone then
      playerZones[player.UserId] = newZone
      if oldZone then
        -- Left zone
        game.ReplicatedStorage.Remotes.ZoneChanged:FireClient(player, "left", oldZone)
      end
      if newZone then
        -- Entered zone
        game.ReplicatedStorage.Remotes.ZoneChanged:FireClient(player, "entered", newZone)
      end
    end
  end
end)
Players.PlayerRemoving:Connect(function(p) playerZones[p.UserId] = nil end)`,
    pitfalls: [
      'Touched/TouchEnded unreliable for zone detection — polling is better',
      'Polling every frame for many zones is expensive — optimize with spatial hash or reduce frequency',
      'Zone parts must have CanCollide = false (players walk through)',
      'PointToObjectSpace check only works for axis-aligned boxes (rotated zones need different math)',
      'Not notifying client of zone changes (no UI update for current area name)',
    ],
  },

  {
    name: 'Vaulting / Climbing Mechanic',
    keywords: ['vault', 'climb', 'parkour', 'wall climb', 'ledge grab', 'mantle', 'wall jump', 'obstacle'],
    snippet: `-- VAULTING / CLIMBING MECHANIC (detect ledge, pull player up)
-- CLIENT SCRIPT (with server validation for competitive games)
local Players = game:GetService("Players")
local UserInputService = game:GetService("UserInputService")
local RunService = game:GetService("RunService")
local player = Players.LocalPlayer
local VAULT_HEIGHT = 7 -- Max obstacle height to vault (studs)
local VAULT_REACH = 3 -- How far in front to check
local COOLDOWN = 0.5
local lastVault = 0
local function tryVault()
  if tick() - lastVault < COOLDOWN then return end
  local character = player.Character
  if not character then return end
  local rootPart = character:FindFirstChild("HumanoidRootPart")
  local humanoid = character:FindFirstChildOfClass("Humanoid")
  if not rootPart or not humanoid then return end
  if humanoid:GetState() == Enum.HumanoidStateType.Freefall then return end -- No air vaulting
  -- Raycast forward to detect wall
  local forward = rootPart.CFrame.LookVector
  local params = RaycastParams.new()
  params.FilterDescendantsInstances = {character}
  local wallCheck = workspace:Raycast(rootPart.Position, forward * VAULT_REACH, params)
  if not wallCheck then return end -- No wall ahead
  -- Raycast down from above the wall to find ledge height
  local aboveWall = wallCheck.Position + Vector3.new(0, VAULT_HEIGHT, 0) + forward * 0.5
  local ledgeCheck = workspace:Raycast(aboveWall, Vector3.new(0, -VAULT_HEIGHT - 1, 0), params)
  if not ledgeCheck then return end -- No ledge found
  local ledgeHeight = ledgeCheck.Position.Y - rootPart.Position.Y
  if ledgeHeight < 2 or ledgeHeight > VAULT_HEIGHT then return end -- Too short or too tall
  lastVault = tick()
  -- Vault animation: move player up and over
  rootPart.Anchored = true
  local targetPos = ledgeCheck.Position + Vector3.new(0, 3, 0) + forward * 2
  local tween = game:GetService("TweenService"):Create(rootPart, TweenInfo.new(0.4, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), {
    CFrame = CFrame.new(targetPos) * CFrame.Angles(0, math.atan2(-forward.X, -forward.Z), 0)
  })
  tween:Play()
  tween.Completed:Wait()
  rootPart.Anchored = false
end
-- Bind to spacebar (near wall) or separate key
UserInputService.InputBegan:Connect(function(input, processed)
  if processed then return end
  if input.KeyCode == Enum.KeyCode.Space then tryVault() end
end)`,
    pitfalls: [
      'Vault while in freefall (should only work when grounded)',
      'Not unanchoring rootPart after vault (player frozen)',
      'Ledge detection raycast too short (misses thin walls)',
      'No animation/visual (player teleports up — add smooth tween)',
      'Server validation needed for competitive (client can fake vault position)',
    ],
  },

  {
    name: 'Emote / Animation System',
    keywords: ['emote', 'animation', 'dance', 'pose', 'custom animation', 'play animation', 'animator'],
    snippet: `-- EMOTE / ANIMATION SYSTEM (play custom animations)
-- SERVER SCRIPT for loading, CLIENT for playback control
-- LOAD AND PLAY ANIMATION:
local function playAnimation(character: Model, animationId: string, looped: boolean?): AnimationTrack?
  local humanoid = character:FindFirstChildOfClass("Humanoid")
  if not humanoid then return nil end
  local animator = humanoid:FindFirstChildOfClass("Animator")
  if not animator then
    animator = Instance.new("Animator") animator.Parent = humanoid
  end
  local anim = Instance.new("Animation")
  anim.AnimationId = "rbxassetid://" .. animationId
  local track = animator:LoadAnimation(anim)
  track.Looped = looped or false
  track.Priority = Enum.AnimationPriority.Action -- Override idle/walk
  track:Play()
  return track
end
-- STOP ALL ANIMATIONS:
local function stopAllAnimations(character: Model)
  local humanoid = character:FindFirstChildOfClass("Humanoid")
  if not humanoid then return end
  local animator = humanoid:FindFirstChildOfClass("Animator")
  if not animator then return end
  for _, track in animator:GetPlayingAnimationTracks() do
    track:Stop()
  end
end
-- EMOTE COMMAND (via chat or button):
-- /e dance → play dance animation
-- /e wave → play wave animation
local EMOTES = {
  dance = "507771019",   -- Replace with your animation IDs
  wave = "507770239",
  sit = "507768133",
  laugh = "507770818",
}
local EmoteRemote = game.ReplicatedStorage.Remotes.PlayEmote
EmoteRemote.OnServerEvent:Connect(function(player, emoteName)
  if typeof(emoteName) ~= "string" then return end
  local animId = EMOTES[emoteName:lower()]
  if not animId then return end
  if not player.Character then return end
  playAnimation(player.Character, animId, false)
end)`,
    pitfalls: [
      'AnimationId must include "rbxassetid://" prefix',
      'Animation must be owned by the game creator or be public',
      'Priority too low — emote hidden by walk/idle animation (use Action priority)',
      'Not stopping emote when player moves (cancel on MoveDirection change)',
      'Animator may not exist on NPC Humanoids — create one if needed',
    ],
  },

  {
    name: 'Screen Fade (Black Transition)',
    keywords: ['fade', 'black screen', 'transition', 'fade in', 'fade out', 'screen wipe', 'loading transition'],
    snippet: `-- SCREEN FADE (smooth black transition for teleports, cutscenes, deaths)
-- CLIENT SCRIPT
local TweenService = game:GetService("TweenService")
local Players = game:GetService("Players")
local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")
local fadeGui = nil
local function ensureFadeGui()
  if fadeGui and fadeGui.Parent then return fadeGui end
  fadeGui = Instance.new("ScreenGui") fadeGui.Name = "FadeScreen"
  fadeGui.IgnoreGuiInset = true fadeGui.DisplayOrder = 999
  fadeGui.ResetOnSpawn = false fadeGui.Parent = playerGui
  local frame = Instance.new("Frame") frame.Name = "FadeFrame"
  frame.Size = UDim2.new(1, 0, 1, 0) frame.BackgroundColor3 = Color3.new(0, 0, 0)
  frame.BackgroundTransparency = 1 frame.BorderSizePixel = 0 frame.Parent = fadeGui
  return fadeGui
end
-- Fade to black
local function fadeOut(duration: number?)
  local gui = ensureFadeGui()
  local frame = gui:FindFirstChild("FadeFrame")
  frame.BackgroundTransparency = 1
  TweenService:Create(frame, TweenInfo.new(duration or 0.5), {BackgroundTransparency = 0}):Play()
  task.wait(duration or 0.5)
end
-- Fade from black
local function fadeIn(duration: number?)
  local gui = ensureFadeGui()
  local frame = gui:FindFirstChild("FadeFrame")
  frame.BackgroundTransparency = 0
  TweenService:Create(frame, TweenInfo.new(duration or 0.5), {BackgroundTransparency = 1}):Play()
  task.wait(duration or 0.5)
end
-- Full transition (fade out → do something → fade in)
local function fadeTransition(callback: () -> (), duration: number?)
  fadeOut(duration)
  callback()
  task.wait(0.2)
  fadeIn(duration)
end
-- USAGE:
-- fadeTransition(function() character:PivotTo(newCFrame) end, 0.5)`,
    pitfalls: [
      'IgnoreGuiInset must be true or fade does not cover full screen',
      'DisplayOrder too low — other GUIs render on top of fade',
      'Not yielding after tween (code continues before fade completes)',
      'ResetOnSpawn = false or fade screen vanishes on death',
      'Fade in without fade out first (screen starts black for no reason)',
    ],
  },
]

// Merge DevForum knowledge into main array
ROBLOX_KNOWLEDGE.push(...DEVFORUM_KNOWLEDGE)

/**
 * Build a context block from relevant snippets to inject into AI prompts.
 */
export function buildRobloxContext(userPrompt: string): string {
  const snippets = findRelevantSnippets(userPrompt)
  if (snippets.length === 0) return ''

  const sections = snippets.map(s =>
    `### ${s.name}\n${s.snippet}\n\nPITFALLS TO AVOID:\n${s.pitfalls.map(p => `- ${p}`).join('\n')}`
  )

  return `\n\n--- ROBLOX API REFERENCE (use these patterns) ---\n\n${sections.join('\n\n')}\n\n--- END REFERENCE ---\n`
}
