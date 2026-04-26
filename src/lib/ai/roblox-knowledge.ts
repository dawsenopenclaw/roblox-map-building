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
