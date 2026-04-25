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
