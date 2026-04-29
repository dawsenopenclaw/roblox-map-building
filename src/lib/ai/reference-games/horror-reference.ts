/**
 * Production-quality reference horror game systems.
 * Returns complete, working Luau code modeled after top Roblox horror games:
 * Doors, The Mimic, Apeirophobia, Blair.
 * Monster AI, fear/sanity, puzzles, level progression, multiplayer, lighting, sound.
 */
export function getHorrorReference(): string {
  return `--[[
  ============================================================================
  COMPLETE HORROR GAME SYSTEMS — PRODUCTION REFERENCE
  ============================================================================
  Modeled after: Doors, The Mimic, Apeirophobia, Blair
  Architecture:
    - Server-authoritative monster AI with full state machine
    - Client-side visual fear effects driven by server events
    - Procedural room/floor progression with difficulty scaling
    - DataStore chapter save points
    - Multiplayer roles, revive system, proximity chat sim
    - Dynamic lighting, flashlight battery, atmosphere transitions
    - Layered audio: ambient drone + proximity monster + dynamic music

  Folder Structure Expected:
    Workspace/
      Rooms/          (RoomTemplate models with Door, SpawnPoints, Puzzles)
      ActiveRooms/    (cloned rooms during play)
    ServerStorage/
      MonsterModels/  (Chaser, Ambusher, Teleporter)
      RoomTemplates/  (Room1..Room20)
    ReplicatedStorage/
      Remotes/
        MonsterAlert    (RemoteEvent — server->client, monster spotted)
        SanityUpdate    (RemoteEvent — server->client, sanity value)
        JumpscareEvent  (RemoteEvent — server->client)
        PlayerDowned    (RemoteEvent — server->client/server)
        ReviveRequest   (RemoteEvent — client->server)
        PuzzleSolved    (RemoteEvent — server->client)
        FlashlightSync  (RemoteEvent — client->server, battery drain)
        ChapterSaved    (RemoteEvent — server->client)
        ProximityChatMsg (RemoteEvent — client->server/server->client)
      Shared/
        SanityModule    (ModuleScript)
        RoomModule      (ModuleScript)
  ============================================================================
--]]

-- ============================================================
-- SECTION 1: MONSTER AI — FULL STATE MACHINE
-- Place in: ServerScriptService/MonsterAI.server.lua
-- ============================================================

local Players          = game:GetService("Players")
local PathfindingService = game:GetService("PathfindingService")
local RunService       = game:GetService("RunService")
local TweenService     = game:GetService("TweenService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local ServerStorage    = game:GetService("ServerStorage")

-- Monster tuning constants
local PATROL_SPEED        = 12
local CHASE_SPEED         = 22
local SEARCH_SPEED        = 16
local DETECT_RADIUS       = 28       -- studs before alert triggers
local CHASE_RADIUS        = 55       -- studs before monster gives up chase
local KILL_RADIUS         = 3.5      -- studs to kill player
local RAYCAST_CHECK_INTERVAL = 0.15  -- seconds between LOS checks
local SEARCH_DURATION     = 8        -- seconds in search state
local PATROL_WAIT         = 2        -- seconds at each waypoint
local TELEPORT_THRESHOLD  = 60       -- if player this far ahead, teleport
local AMBUSH_TRIGGER_DIST = 10       -- studs to spring ambush

-- State enum (use string constants so errors are readable)
local STATE = {
  IDLE    = "Idle",
  PATROL  = "Patrol",
  ALERT   = "Alert",
  CHASE   = "Chase",
  SEARCH  = "Search",
  AMBUSH  = "Ambush",
  RETURN  = "Return",
}

-- RemoteEvent handles (created by init script)
local Remotes        = ReplicatedStorage:WaitForChild("Remotes")
local MonsterAlert   = Remotes:WaitForChild("MonsterAlert")
local JumpscareEvent = Remotes:WaitForChild("JumpscareEvent")
local SanityUpdate   = Remotes:WaitForChild("SanityUpdate")

-- ────────────────────────────────────────────────────────────
-- Monster class constructor
-- ────────────────────────────────────────────────────────────
local Monster = {}
Monster.__index = Monster

function Monster.new(monsterModel: Model, waypointsFolder: Folder)
  local self = setmetatable({}, Monster)
  self.Model        = monsterModel
  self.Humanoid     = monsterModel:WaitForChild("Humanoid")
  self.RootPart     = monsterModel:WaitForChild("HumanoidRootPart")
  self.Waypoints    = waypointsFolder:GetChildren()  -- array of Part
  self.State        = STATE.IDLE
  self.TargetPlayer = nil        -- Player object when chasing
  self.LastKnownPos = Vector3.new(0, 0, 0)
  self.HomePosition = self.RootPart.Position
  self.SearchTimer  = 0
  self.PatrolIndex  = 1
  self.JumpscareCooldown = 0
  self.Path         = PathfindingService:CreatePath({
    AgentHeight     = 5,
    AgentRadius     = 2,
    AgentCanJump    = false,
    AgentCanClimb   = false,
  })
  -- Sort waypoints by name for predictable patrol order
  table.sort(self.Waypoints, function(a, b) return a.Name < b.Name end)
  return self
end

-- ────────────────────────────────────────────────────────────
-- Pathfinding helper: move to position
-- ────────────────────────────────────────────────────────────
function Monster:MoveTo(targetPos: Vector3)
  local success, err = pcall(function()
    self.Path:ComputeAsync(self.RootPart.Position, targetPos)
  end)
  if not success or self.Path.Status ~= Enum.PathStatus.Success then
    -- Fallback: direct move (no path found)
    self.Humanoid:MoveTo(targetPos)
    return
  end
  local waypoints = self.Path:GetWaypoints()
  for _, wp in ipairs(waypoints) do
    if self.State == STATE.CHASE or self.State == STATE.PATROL
      or self.State == STATE.SEARCH or self.State == STATE.RETURN then
      self.Humanoid:MoveTo(wp.Position)
      local moved = self.Humanoid.MoveToFinished:Wait()
      if not moved then break end  -- timeout / blocked
    else
      break
    end
  end
end

-- ────────────────────────────────────────────────────────────
-- Line-of-sight check using Raycast
-- ────────────────────────────────────────────────────────────
function Monster:CanSeePlayer(player: Player): boolean
  local character = player.Character
  if not character then return false end
  local head = character:FindFirstChild("Head")
  if not head then return false end

  local origin    = self.RootPart.Position + Vector3.new(0, 2, 0)
  local direction = (head.Position - origin)
  local dist      = direction.Magnitude

  if dist > DETECT_RADIUS then return false end

  local rayParams = RaycastParams.new()
  rayParams.FilterDescendantsInstances = { self.Model, character }
  rayParams.FilterType = Enum.RaycastFilterType.Exclude

  local result = workspace:Raycast(origin, direction.Unit * dist, rayParams)
  -- If result is nil, nothing blocked the ray → clear LOS
  return result == nil
end

-- ────────────────────────────────────────────────────────────
-- Scan all players — return nearest player in LOS
-- ────────────────────────────────────────────────────────────
function Monster:ScanForPlayers(): Player?
  local nearest: Player? = nil
  local nearestDist = math.huge
  for _, player in ipairs(Players:GetPlayers()) do
    local character = player.Character
    if character then
      local root = character:FindFirstChild("HumanoidRootPart")
      if root then
        local dist = (root.Position - self.RootPart.Position).Magnitude
        if dist < nearestDist and self:CanSeePlayer(player) then
          nearestDist = dist
          nearest = player
        end
      end
    end
  end
  return nearest
end

-- ────────────────────────────────────────────────────────────
-- Kill player (server-side)
-- ────────────────────────────────────────────────────────────
function Monster:AttemptKill(player: Player)
  local character = player.Character
  if not character then return end
  local humanoid = character:FindFirstChildOfClass("Humanoid")
  if humanoid and humanoid.Health > 0 then
    -- Fire jumpscare before kill so client can play the effect
    if tick() - self.JumpscareCooldown > 3 then
      self.JumpscareCooldown = tick()
      JumpscareEvent:FireClient(player, self.Model.Name)
      task.wait(0.4)  -- brief delay for scare effect
    end
    humanoid.Health = 0
  end
end

-- ────────────────────────────────────────────────────────────
-- Teleport mechanic: if player escaped too far, warp to nearby room
-- ────────────────────────────────────────────────────────────
function Monster:TeleportNearPlayer(player: Player)
  local character = player.Character
  if not character then return end
  local root = character:FindFirstChild("HumanoidRootPart")
  if not root then return end

  -- Find a point 15 studs behind the player's travel direction
  local behindPos = root.Position - (root.CFrame.LookVector * 15)
  behindPos = behindPos + Vector3.new(0, 3, 0)

  -- Raycast down to find floor
  local floorResult = workspace:Raycast(
    behindPos,
    Vector3.new(0, -20, 0),
    RaycastParams.new()
  )
  if floorResult then
    behindPos = floorResult.Position + Vector3.new(0, 3, 0)
  end

  self.RootPart.CFrame = CFrame.new(behindPos)
  -- Alert the target player that monster reappeared
  MonsterAlert:FireClient(player, "Reappeared", behindPos)
end

-- ────────────────────────────────────────────────────────────
-- STATE: IDLE — stand still, transition to Patrol after delay
-- ────────────────────────────────────────────────────────────
function Monster:StateIdle()
  self.Humanoid.WalkSpeed = 0
  task.wait(3)
  self:ChangeState(STATE.PATROL)
end

-- ────────────────────────────────────────────────────────────
-- STATE: PATROL — walk waypoints in order
-- ────────────────────────────────────────────────────────────
function Monster:StatePatrol()
  self.Humanoid.WalkSpeed = PATROL_SPEED
  if #self.Waypoints == 0 then
    task.wait(1)
    return
  end
  local wp = self.Waypoints[self.PatrolIndex]
  self:MoveTo(wp.Position)
  task.wait(PATROL_WAIT)
  self.PatrolIndex = (self.PatrolIndex % #self.Waypoints) + 1
end

-- ────────────────────────────────────────────────────────────
-- STATE: ALERT — heard/spotted player, increase speed briefly
-- ────────────────────────────────────────────────────────────
function Monster:StateAlert()
  self.Humanoid.WalkSpeed = PATROL_SPEED
  -- Play alert sound on the monster model
  local alertSound = self.Model:FindFirstChild("AlertSound")
  if alertSound then alertSound:Play() end
  task.wait(1.2)
  self:ChangeState(STATE.CHASE)
end

-- ────────────────────────────────────────────────────────────
-- STATE: CHASE — pursue target player
-- ────────────────────────────────────────────────────────────
function Monster:StateChase()
  self.Humanoid.WalkSpeed = CHASE_SPEED
  local player = self.TargetPlayer
  if not player or not player.Character then
    self:ChangeState(STATE.SEARCH)
    return
  end

  local root = player.Character:FindFirstChild("HumanoidRootPart")
  if not root then
    self:ChangeState(STATE.SEARCH)
    return
  end

  local dist = (root.Position - self.RootPart.Position).Magnitude

  -- Player escaped too far → teleport
  if dist > TELEPORT_THRESHOLD then
    self:TeleportNearPlayer(player)
    return
  end

  -- Lost player at moderate range → search
  if dist > CHASE_RADIUS then
    self.LastKnownPos = root.Position
    self:ChangeState(STATE.SEARCH)
    return
  end

  -- In kill range
  if dist <= KILL_RADIUS then
    self:AttemptKill(player)
    return
  end

  -- Move toward player
  self.LastKnownPos = root.Position
  self:MoveTo(root.Position)

  -- Alert nearby clients about monster proximity (for sanity drain)
  MonsterAlert:FireAllClients("Proximity", self.RootPart.Position, dist)
end

-- ────────────────────────────────────────────────────────────
-- STATE: SEARCH — investigate last known position, look around
-- ────────────────────────────────────────────────────────────
function Monster:StateSearch()
  self.Humanoid.WalkSpeed = SEARCH_SPEED
  self:MoveTo(self.LastKnownPos)

  -- Look around (rotate humanoid root)
  local startTime = tick()
  while tick() - startTime < SEARCH_DURATION do
    -- Sweep rotation left and right
    local angle = math.sin(tick() * 1.5) * 60
    self.RootPart.CFrame = self.RootPart.CFrame
      * CFrame.Angles(0, math.rad(angle * RunService.Heartbeat:Wait()), 0)

    -- Passive scan during search
    local spotted = self:ScanForPlayers()
    if spotted then
      self.TargetPlayer = spotted
      self:ChangeState(STATE.CHASE)
      return
    end
    task.wait(0.3)
  end
  self:ChangeState(STATE.RETURN)
end

-- ────────────────────────────────────────────────────────────
-- STATE: AMBUSH — hide near door, lunge when player close
-- ────────────────────────────────────────────────────────────
function Monster:StateAmbush(hidePosition: Vector3)
  -- Move silently to hide spot
  self.Humanoid.WalkSpeed = PATROL_SPEED
  self:MoveTo(hidePosition)
  self.Humanoid.WalkSpeed = 0

  -- Wait for player to step close
  local waitStart = tick()
  while tick() - waitStart < 20 do  -- give up after 20s
    for _, player in ipairs(Players:GetPlayers()) do
      local character = player.Character
      if character then
        local root = character:FindFirstChild("HumanoidRootPart")
        if root then
          local dist = (root.Position - self.RootPart.Position).Magnitude
          if dist < AMBUSH_TRIGGER_DIST then
            -- Spring the ambush
            self.TargetPlayer = player
            JumpscareEvent:FireClient(player, "AmbushSpring")
            task.wait(0.2)
            self:ChangeState(STATE.CHASE)
            return
          end
        end
      end
    end
    task.wait(0.2)
  end
  self:ChangeState(STATE.PATROL)
end

-- ────────────────────────────────────────────────────────────
-- STATE: RETURN — walk back to home spawn position
-- ────────────────────────────────────────────────────────────
function Monster:StateReturn()
  self.Humanoid.WalkSpeed = PATROL_SPEED
  self:MoveTo(self.HomePosition)
  self.TargetPlayer = nil
  self:ChangeState(STATE.IDLE)
end

-- ────────────────────────────────────────────────────────────
-- State machine driver
-- ────────────────────────────────────────────────────────────
function Monster:ChangeState(newState: string)
  self.State = newState
end

function Monster:Update()
  local state = self.State
  if state == STATE.IDLE    then self:StateIdle()
  elseif state == STATE.PATROL  then self:StatePatrol()
  elseif state == STATE.ALERT   then self:StateAlert()
  elseif state == STATE.CHASE   then self:StateChase()
  elseif state == STATE.SEARCH  then self:StateSearch()
  elseif state == STATE.RETURN  then self:StateReturn()
  end
end

-- ────────────────────────────────────────────────────────────
-- Detection loop: runs on Heartbeat, transitions Patrol→Alert
-- ────────────────────────────────────────────────────────────
function Monster:StartDetectionLoop()
  local lastCheck = 0
  RunService.Heartbeat:Connect(function()
    if tick() - lastCheck < RAYCAST_CHECK_INTERVAL then return end
    lastCheck = tick()
    if self.State == STATE.PATROL or self.State == STATE.IDLE
      or self.State == STATE.SEARCH then
      local spotted = self:ScanForPlayers()
      if spotted then
        self.TargetPlayer = spotted
        MonsterAlert:FireAllClients("Spotted", self.RootPart.Position)
        self:ChangeState(STATE.ALERT)
      end
    end
  end)
end

-- ────────────────────────────────────────────────────────────
-- Main loop: spawn monster and run state machine
-- ────────────────────────────────────────────────────────────
local function SpawnMonster(modelName: string, waypointsFolderName: string)
  local template = ServerStorage.MonsterModels:FindFirstChild(modelName)
  if not template then
    warn("Monster model not found: " .. modelName)
    return
  end
  local waypointsFolder = workspace:FindFirstChild(waypointsFolderName)
  if not waypointsFolder then
    warn("Waypoints folder not found: " .. waypointsFolderName)
    return
  end

  local monsterClone = template:Clone()
  monsterClone.Parent = workspace

  local monster = Monster.new(monsterClone, waypointsFolder)
  monster:StartDetectionLoop()

  task.spawn(function()
    while monsterClone.Parent do
      local ok, err = pcall(function()
        monster:Update()
      end)
      if not ok then
        warn("Monster update error: " .. tostring(err))
        task.wait(1)
      end
    end
  end)

  return monster
end

-- Spawn the main monster when the game starts
SpawnMonster("Chaser", "ChaserWaypoints")


-- ============================================================
-- SECTION 2: FEAR / SANITY SYSTEM
-- Server: ServerScriptService/SanityServer.server.lua
-- Client: StarterPlayerScripts/SanityClient.client.lua
-- ============================================================

-- ── SERVER SIDE ──────────────────────────────────────────────

local Players_S         = game:GetService("Players")
local RunService_S      = game:GetService("RunService")
local Lighting_S        = game:GetService("Lighting")
local ReplicatedStorage_S = game:GetService("ReplicatedStorage")

local Remotes_S     = ReplicatedStorage_S:WaitForChild("Remotes")
local SanityUpdate_S = Remotes_S:WaitForChild("SanityUpdate")
local MonsterAlert_S = Remotes_S:WaitForChild("MonsterAlert")

-- Sanity constants
local SANITY_MAX          = 100
local DARK_DRAIN_RATE     = 0.8   -- per second in darkness
local MONSTER_DRAIN_RATE  = 2.5   -- per second near monster
local ALONE_DRAIN_RATE    = 0.3   -- per second when solo
local CALM_RESTORE_RATE   = 0.4   -- per second in safe lit area
local MONSTER_WARN_RADIUS = 35    -- studs for sanity drain
local DARK_THRESHOLD      = 0.15  -- Lighting.Brightness below this = dark
local LIGHT_SCAN_RADIUS   = 6     -- check for nearby PointLights

-- Per-player sanity storage
local playerSanity: { [string]: number } = {}
-- Track known monster positions (updated by MonsterAlert RemoteEvent)
local monsterPositions: { [string]: Vector3 } = {}

MonsterAlert_S.OnServerEvent:Connect(function() end)  -- placeholder; server fires this

Players_S.PlayerAdded:Connect(function(player)
  playerSanity[player.UserId] = SANITY_MAX
end)

Players_S.PlayerRemoving:Connect(function(player)
  playerSanity[player.UserId] = nil
end)

local function IsPlayerInDarkness(character: Model): boolean
  local root = character:FindFirstChild("HumanoidRootPart")
  if not root then return false end

  -- Check ambient lighting level
  if Lighting_S.Brightness > DARK_THRESHOLD then return false end

  -- Check for nearby PointLights (carried flashlight or room light)
  for _, obj in ipairs(workspace:GetDescendants()) do
    if obj:IsA("PointLight") or obj:IsA("SpotLight") then
      local lightPart = obj.Parent
      if lightPart and lightPart:IsA("BasePart") then
        local dist = (lightPart.Position - root.Position).Magnitude
        if dist < LIGHT_SCAN_RADIUS * obj.Range / 16 then
          return false  -- player is near a light source
        end
      end
    end
  end
  return true
end

local function GetNearestMonsterDist(rootPos: Vector3): number
  local nearest = math.huge
  for _, pos in pairs(monsterPositions) do
    local d = (pos - rootPos).Magnitude
    if d < nearest then nearest = d end
  end
  return nearest
end

-- Sanity update loop (every 0.5s)
local sanityTick = 0
RunService_S.Heartbeat:Connect(function(dt)
  sanityTick = sanityTick + dt
  if sanityTick < 0.5 then return end
  sanityTick = 0

  local playerCount = #Players_S:GetPlayers()

  for _, player in ipairs(Players_S:GetPlayers()) do
    local character = player.Character
    if not character then continue end
    local root = character:FindFirstChild("HumanoidRootPart")
    if not root then continue end

    local sanity = playerSanity[player.UserId] or SANITY_MAX
    local drain  = 0
    local restore = 0

    -- Darkness penalty
    if IsPlayerInDarkness(character) then
      drain = drain + DARK_DRAIN_RATE
    else
      restore = restore + CALM_RESTORE_RATE
    end

    -- Monster proximity penalty
    local monsterDist = GetNearestMonsterDist(root.Position)
    if monsterDist < MONSTER_WARN_RADIUS then
      local proximityFactor = 1 - (monsterDist / MONSTER_WARN_RADIUS)
      drain = drain + MONSTER_DRAIN_RATE * proximityFactor
    end

    -- Alone penalty (solo or only 1 player)
    if playerCount <= 1 then
      drain = drain + ALONE_DRAIN_RATE
    end

    -- Apply changes (0.5s tick so multiply by 0.5)
    sanity = math.clamp(sanity - drain * 0.5 + restore * 0.5, 0, SANITY_MAX)
    playerSanity[player.UserId] = sanity

    -- Send to client
    SanityUpdate_S:FireClient(player, sanity)
  end
end)

-- Expose monster positions for sanity calculation (called by MonsterAI)
-- In practice MonsterAI module would call this directly
local SanityModule = {}
function SanityModule.UpdateMonsterPosition(monsterId: string, pos: Vector3)
  monsterPositions[monsterId] = pos
end
function SanityModule.ClearMonster(monsterId: string)
  monsterPositions[monsterId] = nil
end


-- ── CLIENT SIDE (StarterPlayerScripts/SanityClient.client.lua) ──

local Players_C         = game:GetService("Players")
local TweenService_C    = game:GetService("TweenService")
local SoundService_C    = game:GetService("SoundService")
local ReplicatedStorage_C = game:GetService("ReplicatedStorage")
local RunService_C      = game:GetService("RunService")

local LocalPlayer    = Players_C.LocalPlayer
local PlayerGui      = LocalPlayer:WaitForChild("PlayerGui")
local Camera         = workspace.CurrentCamera

local Remotes_C       = ReplicatedStorage_C:WaitForChild("Remotes")
local SanityUpdate_C  = Remotes_C:WaitForChild("SanityUpdate")
local JumpscareEvent_C = Remotes_C:WaitForChild("JumpscareEvent")

-- Build the sanity UI (vignette + overlay)
local screenGui = Instance.new("ScreenGui")
screenGui.Name = "SanityGui"
screenGui.ResetOnSpawn = false
screenGui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
screenGui.Parent = PlayerGui

local vignette = Instance.new("ImageLabel")
vignette.Name = "Vignette"
vignette.Size = UDim2.fromScale(1, 1)
vignette.Position = UDim2.fromScale(0, 0)
vignette.BackgroundTransparency = 1
vignette.Image = "rbxassetid://1072888446"  -- radial gradient
vignette.ImageColor3 = Color3.fromRGB(0, 0, 0)
vignette.ImageTransparency = 1
vignette.ZIndex = 10
vignette.Parent = screenGui

local colorOverlay = Instance.new("Frame")
colorOverlay.Name = "ColorOverlay"
colorOverlay.Size = UDim2.fromScale(1, 1)
colorOverlay.Position = UDim2.fromScale(0, 0)
colorOverlay.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
colorOverlay.BackgroundTransparency = 1
colorOverlay.ZIndex = 9
colorOverlay.Parent = screenGui

-- Sanity bar (optional HUD element)
local sanityBar = Instance.new("Frame")
sanityBar.Name = "SanityBar"
sanityBar.Size = UDim2.new(0, 200, 0, 8)
sanityBar.Position = UDim2.new(0, 16, 1, -30)
sanityBar.BackgroundColor3 = Color3.fromRGB(20, 20, 20)
sanityBar.BorderSizePixel = 0
sanityBar.Parent = screenGui

local sanityFill = Instance.new("Frame")
sanityFill.Name = "Fill"
sanityFill.Size = UDim2.fromScale(1, 1)
sanityFill.BackgroundColor3 = Color3.fromRGB(120, 220, 180)
sanityFill.BorderSizePixel = 0
sanityFill.Parent = sanityBar

-- Heartbeat sound (plays louder at low sanity)
local heartbeatSound = Instance.new("Sound")
heartbeatSound.SoundId = "rbxassetid://3003552064"
heartbeatSound.Volume = 0
heartbeatSound.Looped = true
heartbeatSound.Parent = SoundService_C
heartbeatSound:Play()

-- Current sanity (client mirror)
local currentSanity = 100
local shakeOffset   = Vector3.new(0, 0, 0)

-- Apply visual effects based on sanity value (0-100)
local function ApplySanityEffects(sanity: number)
  local t = 1 - (sanity / 100)  -- 0 = sane, 1 = insane

  -- Vignette: starts fading in below 70
  local vignetteTarget = math.max(0, (t - 0.3) / 0.7)
  vignette.ImageTransparency = 1 - vignetteTarget * 0.85

  -- Color desaturation: full black-and-white below 20
  local satTarget = math.max(0, sanity / 100)
  local colorEffect = Camera:FindFirstChildOfClass("ColorCorrectionEffect")
  if not colorEffect then
    colorEffect = Instance.new("ColorCorrectionEffect")
    colorEffect.Parent = Camera
  end
  colorEffect.Saturation = -1 + satTarget  -- -1 = grayscale

  -- Brightness darkens slightly at low sanity
  colorEffect.Brightness = -t * 0.15

  -- Heartbeat volume increases at low sanity
  heartbeatSound.Volume = math.max(0, t - 0.4) * 1.5
  heartbeatSound.PlaybackSpeed = 0.8 + t * 0.6

  -- Sanity bar color shifts red at low sanity
  sanityFill.Size = UDim2.fromScale(sanity / 100, 1)
  sanityFill.BackgroundColor3 = Color3.fromRGB(
    math.round(120 + t * 135),
    math.round(220 - t * 200),
    math.round(180 - t * 180)
  )
end

-- Camera shake at very low sanity (below 30)
RunService_C.RenderStepped:Connect(function(dt)
  if currentSanity < 30 then
    local intensity = (30 - currentSanity) / 30 * 0.3
    shakeOffset = Vector3.new(
      math.sin(tick() * 13) * intensity,
      math.cos(tick() * 17) * intensity * 0.5,
      0
    )
    Camera.CFrame = Camera.CFrame * CFrame.new(shakeOffset)
  end
end)

-- Receive sanity from server
SanityUpdate_C.OnClientEvent:Connect(function(sanity: number)
  currentSanity = sanity
  ApplySanityEffects(sanity)

  -- Hallucination: flash fake monster silhouette below 20 sanity (rare)
  if sanity < 20 and math.random() < 0.03 then
    local halluc = Instance.new("ImageLabel")
    halluc.Size = UDim2.new(0, 80, 0, 200)
    halluc.Position = UDim2.new(math.random() * 0.8, 0, math.random() * 0.6, 0)
    halluc.Image = "rbxassetid://6022668955"  -- dark humanoid silhouette
    halluc.ImageColor3 = Color3.fromRGB(0, 0, 0)
    halluc.ImageTransparency = 0.3
    halluc.BackgroundTransparency = 1
    halluc.ZIndex = 20
    halluc.Parent = screenGui
    task.delay(0.2, function()
      TweenService_C:Create(halluc, TweenInfo.new(0.3), {ImageTransparency = 1}):Play()
      task.delay(0.35, function() halluc:Destroy() end)
    end)
  end
end)

-- Jumpscare handler
JumpscareEvent_C.OnClientEvent:Connect(function(monsterName: string)
  -- Lock camera briefly and flash white
  local jumpscareFrame = Instance.new("Frame")
  jumpscareFrame.Size = UDim2.fromScale(1, 1)
  jumpscareFrame.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
  jumpscareFrame.BackgroundTransparency = 0
  jumpscareFrame.ZIndex = 50
  jumpscareFrame.Parent = screenGui

  -- Play jumpscare audio
  local scareSound = Instance.new("Sound")
  scareSound.SoundId = "rbxassetid://9127411489"
  scareSound.Volume = 1
  scareSound.Parent = SoundService_C
  scareSound:Play()
  game:GetService("Debris"):AddItem(scareSound, 3)

  -- Fade out white flash
  TweenService_C:Create(
    jumpscareFrame,
    TweenInfo.new(0.6, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
    { BackgroundTransparency = 1 }
  ):Play()
  task.delay(0.7, function() jumpscareFrame:Destroy() end)
end)


-- ============================================================
-- SECTION 3: PUZZLE SYSTEMS
-- Place in: ServerScriptService/PuzzleManager.server.lua
-- ============================================================

local Players_P   = game:GetService("Players")
local TweenService_P = game:GetService("TweenService")
local ReplicatedStorage_P = game:GetService("ReplicatedStorage")

local Remotes_P      = ReplicatedStorage_P:WaitForChild("Remotes")
local PuzzleSolved_P = Remotes_P:WaitForChild("PuzzleSolved")

-- ── PUZZLE 1: KEY HUNT ────────────────────────────────────────
-- Keys spawn in random room containers, colored to match doors
local KEY_COLORS = {
  Color3.fromRGB(220, 60, 60),   -- Red
  Color3.fromRGB(60, 140, 220),  -- Blue
  Color3.fromRGB(60, 200, 80),   -- Green
  Color3.fromRGB(230, 200, 50),  -- Yellow
}

local function SetupKeyHuntPuzzle(roomModel: Model, doorModel: Model)
  local colorIndex = math.random(1, #KEY_COLORS)
  local keyColor = KEY_COLORS[colorIndex]

  -- Create key object
  local key = Instance.new("Part")
  key.Name = "Key_" .. colorIndex
  key.Size = Vector3.new(0.4, 0.8, 0.1)
  key.Color = keyColor
  key.Material = Enum.Material.SmoothPlastic
  key.CastShadow = false
  key.CanCollide = false

  -- Spawn in random spot in room
  local spawnPoints = roomModel:FindFirstChild("KeySpawns")
  if spawnPoints then
    local spots = spawnPoints:GetChildren()
    local spot = spots[math.random(1, #spots)]
    key.CFrame = spot.CFrame + Vector3.new(0, 0.5, 0)
  end
  key.Parent = roomModel

  -- Spin animation
  task.spawn(function()
    while key.Parent do
      key.CFrame = key.CFrame * CFrame.Angles(0, math.rad(2), 0)
      task.wait()
    end
  end)

  -- Color the door to match
  for _, part in ipairs(doorModel:GetDescendants()) do
    if part:IsA("BasePart") then
      part.Color = keyColor
    end
  end

  -- Touch detection: player picks up key
  local playerInventory: { [string]: number } = {}
  key.Touched:Connect(function(hit)
    local character = hit.Parent
    local player = Players_P:GetPlayerFromCharacter(character)
    if not player then return end
    playerInventory[player.UserId] = colorIndex
    key:Destroy()

    -- Show pickup UI on client
    PuzzleSolved_P:FireClient(player, "KeyPickup", colorIndex)
  end)

  -- Door proximity check: player with key can open door
  local doorCheck = doorModel:FindFirstChild("HumanoidRootPart")
    or doorModel.PrimaryPart
  if not doorCheck then return end

  local doorConn
  doorConn = game:GetService("RunService").Heartbeat:Connect(function()
    for _, player in ipairs(Players_P:GetPlayers()) do
      if playerInventory[player.UserId] == colorIndex then
        local character = player.Character
        if character then
          local root = character:FindFirstChild("HumanoidRootPart")
          if root then
            local dist = (root.Position - doorCheck.Position).Magnitude
            if dist < 6 then
              -- Open door via tween
              local openTween = TweenService_P:Create(
                doorModel.PrimaryPart or doorCheck,
                TweenInfo.new(1.2, Enum.EasingStyle.Quad),
                { CFrame = (doorModel.PrimaryPart or doorCheck).CFrame
                  * CFrame.Angles(0, math.rad(100), 0) }
              )
              openTween:Play()
              PuzzleSolved_P:FireAllClients("DoorOpened", doorModel.Name)
              playerInventory[player.UserId] = nil
              doorConn:Disconnect()
              return
            end
          end
        end
      end
    end
  end)
end

-- ── PUZZLE 2: SEQUENCE PUZZLE (buttons in order) ─────────────
local function SetupSequencePuzzle(puzzleModel: Model, onSolve: () -> ())
  local buttons = {}
  for _, obj in ipairs(puzzleModel:GetChildren()) do
    if obj:IsA("BasePart") and obj.Name:match("^Button%d+$") then
      table.insert(buttons, obj)
    end
  end
  table.sort(buttons, function(a, b)
    return tonumber(a.Name:match("%d+")) < tonumber(b.Name:match("%d+"))
  end)

  -- Randomize sequence
  local sequence = {}
  local shuffled = { table.unpack(buttons) }
  for i = #shuffled, 2, -1 do
    local j = math.random(1, i)
    shuffled[i], shuffled[j] = shuffled[j], shuffled[i]
  end
  for i, btn in ipairs(shuffled) do
    sequence[i] = btn
  end

  -- Show the sequence via flicker (only once on puzzle start)
  task.spawn(function()
    task.wait(2)
    for _, btn in ipairs(sequence) do
      local origColor = btn.Color
      btn.Color = Color3.fromRGB(255, 255, 100)
      task.wait(0.5)
      btn.Color = origColor
      task.wait(0.3)
    end
  end)

  -- Track player input
  local currentStep = 1
  local lastPresser: Player? = nil

  for i, btn in ipairs(shuffled) do
    local capturedIndex = i
    btn.Touched:Connect(function(hit)
      local character = hit.Parent
      local player = Players_P:GetPlayerFromCharacter(character)
      if not player then return end

      if sequence[currentStep] == btn then
        -- Correct button
        btn.Color = Color3.fromRGB(100, 255, 100)
        currentStep = currentStep + 1
        lastPresser = player

        if currentStep > #sequence then
          -- Puzzle solved
          PuzzleSolved_P:FireAllClients("SequenceSolved", puzzleModel.Name)
          onSolve()
        end
      else
        -- Wrong button: reset
        currentStep = 1
        for _, b in ipairs(shuffled) do
          b.Color = Color3.fromRGB(80, 80, 80)
        end
        if player then
          PuzzleSolved_P:FireClient(player, "SequenceFail")
        end
      end
    end)
  end
end

-- ── PUZZLE 3: CODE LOCK (4-digit keypad) ────────────────────
-- Client handles UI, server validates code
local CODE_LOCK_VALID: { [string]: string } = {}  -- puzzleId -> code

local function SetupCodeLockPuzzle(puzzleId: string, doorModel: Model)
  -- Generate random 4-digit code
  local code = string.format("%04d", math.random(0, 9999))
  CODE_LOCK_VALID[puzzleId] = code

  -- Spawn notes around the room with code digits
  -- (Actual note placement is handled by room gen; this stores the code)
  local noteValue = Instance.new("StringValue")
  noteValue.Name = "CodeLockCode_" .. puzzleId
  noteValue.Value = code
  noteValue.Parent = game.ServerStorage  -- only server can read

  return code  -- room generator places notes with this code
end

-- Called by client via RemoteFunction (create a RemoteFunction for this in init)
local function ValidateCodeLock(player: Player, puzzleId: string, enteredCode: string): boolean
  local correct = CODE_LOCK_VALID[puzzleId]
  if correct and enteredCode == correct then
    PuzzleSolved_P:FireAllClients("CodeLockSolved", puzzleId)
    CODE_LOCK_VALID[puzzleId] = nil
    return true
  end
  return false
end

-- ── PUZZLE 4: PRESSURE PLATES (push blocks) ──────────────────
local function SetupPressurePlatePuzzle(puzzleModel: Model, onSolve: () -> ())
  local plates = {}
  local blocks = {}

  for _, obj in ipairs(puzzleModel:GetChildren()) do
    if obj.Name:match("^PressurePlate") then
      table.insert(plates, obj)
    elseif obj.Name:match("^PushBlock") then
      table.insert(blocks, obj)
    end
  end

  local function CheckAllActivated(): boolean
    for _, plate in ipairs(plates) do
      local activated = plate:FindFirstChild("Activated")
      if not activated or activated.Value ~= true then
        return false
      end
    end
    return true
  end

  for _, plate in ipairs(plates) do
    local activatedValue = Instance.new("BoolValue")
    activatedValue.Name = "Activated"
    activatedValue.Value = false
    activatedValue.Parent = plate

    local originalColor = plate.Color

    plate.Touched:Connect(function(hit)
      -- Accept both blocks and players standing on plate
      if hit:IsA("BasePart") then
        activatedValue.Value = true
        plate.Color = Color3.fromRGB(100, 255, 100)
        if CheckAllActivated() then
          PuzzleSolved_P:FireAllClients("PlatesSolved", puzzleModel.Name)
          onSolve()
        end
      end
    end)

    plate.TouchEnded:Connect(function(hit)
      if hit:IsA("BasePart") then
        -- Check if anything still touching
        local touching = plate:GetTouchingParts()
        if #touching == 0 then
          activatedValue.Value = false
          plate.Color = originalColor
        end
      end
    end)
  end
end

-- ── PUZZLE 5: CIRCUIT BREAKER (restore power) ────────────────
local function SetupCircuitBreakerPuzzle(puzzleModel: Model, onSolve: () -> ())
  local breakers = {}
  for _, obj in ipairs(puzzleModel:GetChildren()) do
    if obj.Name:match("^Breaker%d+$") then
      table.insert(breakers, obj)
    end
  end
  table.sort(breakers, function(a, b)
    return tonumber(a.Name:match("%d+")) < tonumber(b.Name:match("%d+"))
  end)

  -- Generate random correct order
  local correctOrder = {}
  local available = { table.unpack(breakers) }
  while #available > 0 do
    local i = math.random(1, #available)
    table.insert(correctOrder, available[i])
    table.remove(available, i)
  end

  local nextRequired = 1

  for _, breaker in ipairs(breakers) do
    -- Visual: off = dark red, on = bright green
    breaker.Color = Color3.fromRGB(120, 20, 20)

    local clickDetector = Instance.new("ClickDetector")
    clickDetector.MaxActivationDistance = 8
    clickDetector.Parent = breaker

    clickDetector.MouseClick:Connect(function(player)
      if correctOrder[nextRequired] == breaker then
        -- Correct breaker flipped
        breaker.Color = Color3.fromRGB(40, 200, 40)
        nextRequired = nextRequired + 1

        if nextRequired > #correctOrder then
          -- Power restored
          PuzzleSolved_P:FireAllClients("PowerRestored", puzzleModel.Name)
          onSolve()
        end
      else
        -- Wrong breaker: reset all
        nextRequired = 1
        for _, b in ipairs(breakers) do
          b.Color = Color3.fromRGB(120, 20, 20)
        end
        PuzzleSolved_P:FireClient(player, "BreakerFail")
      end
    end)
  end
end


-- ============================================================
-- SECTION 4: LEVEL PROGRESSION SYSTEM
-- Place in: ServerScriptService/LevelManager.server.lua
-- ============================================================

local Players_L         = game:GetService("Players")
local DataStoreService_L = game:GetService("DataStoreService")
local ReplicatedStorage_L = game:GetService("ReplicatedStorage")
local ServerStorage_L   = game:GetService("ServerStorage")
local TweenService_L    = game:GetService("TweenService")
local Lighting_L        = game:GetService("Lighting")

local Remotes_L       = ReplicatedStorage_L:WaitForChild("Remotes")
local PuzzleSolved_L  = Remotes_L:WaitForChild("PuzzleSolved")
local ChapterSaved_L  = Remotes_L:WaitForChild("ChapterSaved")

local ProgressStore = DataStoreService_L:GetDataStore("HorrorProgress_V1")

-- Floor config: each entry increases difficulty
local FLOOR_CONFIG = {
  { rooms = 5,  monsters = 1, lightLevel = 0.4, puzzleCount = 2, chapter = 1 },
  { rooms = 7,  monsters = 1, lightLevel = 0.25, puzzleCount = 3, chapter = 1 },
  { rooms = 8,  monsters = 2, lightLevel = 0.15, puzzleCount = 3, chapter = 2 },
  { rooms = 10, monsters = 2, lightLevel = 0.08, puzzleCount = 4, chapter = 2 },
  { rooms = 12, monsters = 3, lightLevel = 0.05, puzzleCount = 5, chapter = 3 },
}

local gameState = {
  currentFloor = 1,
  currentRoom  = 1,
  activeRooms  = {},  -- list of spawned room models
  playerProgress = {},  -- userId -> { floor, chapter }
}

-- ── DATASTORE: Save chapter progress ─────────────────────────
local function SaveProgress(player: Player, chapter: number, floor: number)
  local key = "player_" .. player.UserId
  local success, err = pcall(function()
    ProgressStore:SetAsync(key, {
      chapter = chapter,
      floor   = floor,
      savedAt = os.time(),
    })
  end)
  if not success then
    warn("Failed to save progress for " .. player.Name .. ": " .. tostring(err))
  else
    ChapterSaved_L:FireClient(player, chapter, floor)
  end
end

local function LoadProgress(player: Player): { chapter: number, floor: number }
  local key = "player_" .. player.UserId
  local data
  local success, err = pcall(function()
    data = ProgressStore:GetAsync(key)
  end)
  if success and data then
    return data
  end
  return { chapter = 1, floor = 1 }
end

Players_L.PlayerAdded:Connect(function(player)
  local progress = LoadProgress(player)
  gameState.playerProgress[player.UserId] = progress
end)

Players_L.PlayerRemoving:Connect(function(player)
  gameState.playerProgress[player.UserId] = nil
end)

-- ── ROOM SPAWNING ─────────────────────────────────────────────
local function SpawnRoom(floorIndex: number, roomIndex: number): Model?
  local templates = ServerStorage_L.RoomTemplates:GetChildren()
  if #templates == 0 then return nil end

  -- Pick a template (cycle through, randomize for variety)
  local templateIndex = ((roomIndex - 1) % #templates) + 1
  -- Add some randomness for non-first rooms
  if roomIndex > 1 then
    templateIndex = math.random(1, #templates)
  end

  local template = templates[templateIndex]
  local roomClone = template:Clone()
  roomClone.Name = string.format("Room_F%d_R%d", floorIndex, roomIndex)

  -- Position rooms in a line (simple layout)
  -- Real procedural gen would chain doors; this is the core pattern
  local offset = Vector3.new((roomIndex - 1) * 60, 0, 0)
  if roomClone.PrimaryPart then
    roomClone:SetPrimaryPartCFrame(CFrame.new(offset))
  end

  roomClone.Parent = workspace.ActiveRooms
  table.insert(gameState.activeRooms, roomClone)
  return roomClone
end

local function SetupFloor(floorIndex: number)
  local config = FLOOR_CONFIG[math.min(floorIndex, #FLOOR_CONFIG)]

  -- Clear previous floor
  for _, room in ipairs(gameState.activeRooms) do
    if room and room.Parent then
      room:Destroy()
    end
  end
  gameState.activeRooms = {}
  gameState.currentRoom = 1

  -- Adjust lighting for difficulty
  TweenService_L:Create(
    Lighting_L,
    TweenInfo.new(3, Enum.EasingStyle.Linear),
    { Brightness = config.lightLevel }
  ):Play()

  -- Spawn rooms
  for i = 1, config.rooms do
    local room = SpawnRoom(floorIndex, i)
    if room then
      -- Mark last room as exit
      if i == config.rooms then
        local exitSign = Instance.new("Part")
        exitSign.Name = "FloorExit"
        exitSign.Size = Vector3.new(4, 6, 0.5)
        exitSign.Anchored = true
        exitSign.Color = Color3.fromRGB(40, 200, 40)
        exitSign.CFrame = room.PrimaryPart
          and room.PrimaryPart.CFrame * CFrame.new(0, 0, -25)
          or CFrame.new((i - 1) * 60, 3, -25)
        exitSign.Parent = room

        local exitDetector = Instance.new("ClickDetector")
        exitDetector.MaxActivationDistance = 10
        exitDetector.Parent = exitSign

        exitDetector.MouseClick:Connect(function(player)
          -- Save progress at chapter boundaries
          if config.chapter > (gameState.playerProgress[player.UserId] and
            gameState.playerProgress[player.UserId].chapter or 0) then
            SaveProgress(player, config.chapter, floorIndex)
          end
          -- Advance floor
          gameState.currentFloor = gameState.currentFloor + 1
          SetupFloor(gameState.currentFloor)
        end)
      end
    end
  end
end

-- ── TIMER-BASED EVENTS ────────────────────────────────────────
-- Lights flicker at 3 minutes, new monster at 5 minutes
local function StartFloorTimers(floorIndex: number)
  task.spawn(function()
    -- 3 minutes: lights flicker
    task.wait(180)
    local flickerCount = 8
    for i = 1, flickerCount do
      Lighting_L.Brightness = 0
      task.wait(0.1 + math.random() * 0.15)
      local config = FLOOR_CONFIG[math.min(floorIndex, #FLOOR_CONFIG)]
      Lighting_L.Brightness = config.lightLevel
      task.wait(0.1 + math.random() * 0.2)
    end
  end)

  task.spawn(function()
    -- 5 minutes: extra monster spawns
    task.wait(300)
    SpawnMonster("Chaser", "ChaserWaypoints")
  end)
end

-- ── SECRET ROOMS ──────────────────────────────────────────────
local function SpawnSecretRoom(attachToRoom: Model)
  local secretTemplate = ServerStorage_L.RoomTemplates:FindFirstChild("SecretRoom")
  if not secretTemplate then return end

  local secret = secretTemplate:Clone()
  secret.Name = "SecretRoom"

  -- Position behind a false wall
  if attachToRoom.PrimaryPart then
    secret:SetPrimaryPartCFrame(
      attachToRoom.PrimaryPart.CFrame * CFrame.new(0, 0, 30)
    )
  end
  secret.Parent = workspace.ActiveRooms

  -- Lore note inside secret room
  local loreNote = Instance.new("Part")
  loreNote.Name = "LoreNote"
  loreNote.Size = Vector3.new(0.5, 0.7, 0.05)
  loreNote.Color = Color3.fromRGB(240, 230, 200)
  loreNote.Material = Enum.Material.Paper
  loreNote.Anchored = true
  if secret.PrimaryPart then
    loreNote.CFrame = secret.PrimaryPart.CFrame * CFrame.new(2, 1, 0)
  end
  loreNote.Parent = secret

  local gui = Instance.new("BillboardGui")
  gui.Size = UDim2.new(0, 150, 0, 60)
  gui.StudsOffset = Vector3.new(0, 1, 0)
  gui.AlwaysOnTop = false
  gui.Parent = loreNote

  local label = Instance.new("TextLabel")
  label.Size = UDim2.fromScale(1, 1)
  label.BackgroundTransparency = 1
  label.TextColor3 = Color3.fromRGB(20, 10, 0)
  label.Font = Enum.Font.Antique
  label.TextScaled = true
  label.Text = '"It was here before the lights went out..."'
  label.Parent = gui
end

-- Initialize the game
SetupFloor(1)
StartFloorTimers(1)


-- ============================================================
-- SECTION 5: MULTIPLAYER HORROR SYSTEMS
-- Place in: ServerScriptService/MultiplayerHorror.server.lua
-- ============================================================

local Players_M         = game:GetService("Players")
local ReplicatedStorage_M = game:GetService("ReplicatedStorage")
local RunService_M      = game:GetService("RunService")

local Remotes_M        = ReplicatedStorage_M:WaitForChild("Remotes")
local PlayerDowned_M   = Remotes_M:WaitForChild("PlayerDowned")
local ReviveRequest_M  = Remotes_M:WaitForChild("ReviveRequest")
local ProximityChatMsg_M = Remotes_M:WaitForChild("ProximityChatMsg")

local REVIVE_TIME     = 8    -- seconds to complete revive
local REVIVE_RADIUS   = 6    -- studs to start reviving
local PROXIMITY_CHAT_RANGE = 25  -- studs for chat to reach

-- Track downed players
local downedPlayers: { [string]: { downedAt: number, revivedBy: Player? } } = {}

-- ── ROLE ASSIGNMENT ──────────────────────────────────────────
-- "Primary Target" role: monster focuses this player first
local primaryTarget: Player? = nil

local function AssignPrimaryTarget()
  local players = Players_M:GetPlayers()
  if #players == 0 then return end
  primaryTarget = players[math.random(1, #players)]
  -- Tell the monster AI (in a real build, use a ModuleScript reference)
  -- MonsterAI.SetPrimaryTarget(primaryTarget)
  -- Notify the chosen player
  local gui = Instance.new("Message")
  gui.Text = "You are the Primary Target. The creature hunts you first."
  gui.Parent = Players_M:FindFirstChild("LocalPlayer") -- for server use: fire remote
  game:GetService("Debris"):AddItem(gui, 4)
end

Players_M.PlayerAdded:Connect(function(player)
  task.wait(3)  -- wait for game to start
  if not primaryTarget then
    AssignPrimaryTarget()
  end
end)

-- ── DOWNED PLAYER SYSTEM ─────────────────────────────────────
local function DownPlayer(player: Player)
  if downedPlayers[player.UserId] then return end  -- already downed

  local character = player.Character
  if not character then return end
  local humanoid = character:FindFirstChildOfClass("Humanoid")
  if not humanoid then return end

  -- Don't kill immediately: crawl animation + wait for revive
  downedPlayers[player.UserId] = {
    downedAt  = tick(),
    revivedBy = nil,
  }

  humanoid.WalkSpeed = 4  -- can still crawl slowly
  humanoid.JumpPower = 0

  PlayerDowned_M:FireAllClients("PlayerDowned", player.Name)

  -- Bleed out timer: 30 seconds to be revived
  task.spawn(function()
    task.wait(30)
    if downedPlayers[player.UserId] then
      -- Not revived in time: actually die
      downedPlayers[player.UserId] = nil
      if humanoid then humanoid.Health = 0 end
    end
  end)
end

-- ── REVIVE SYSTEM ────────────────────────────────────────────
ReviveRequest_M.OnServerEvent:Connect(function(reviverPlayer: Player, downedPlayerName: string)
  -- Find downed player
  local downedPlayer = Players_M:FindFirstChild(downedPlayerName)
  if not downedPlayer then return end
  if not downedPlayers[downedPlayer.UserId] then return end

  local reviverCharacter = reviverPlayer.Character
  local downedCharacter  = downedPlayer.Character
  if not reviverCharacter or not downedCharacter then return end

  local reviverRoot = reviverCharacter:FindFirstChild("HumanoidRootPart")
  local downedRoot  = downedCharacter:FindFirstChild("HumanoidRootPart")
  if not reviverRoot or not downedRoot then return end

  -- Check distance
  if (reviverRoot.Position - downedRoot.Position).Magnitude > REVIVE_RADIUS then
    return  -- too far
  end

  -- Revive progress (must stand still for REVIVE_TIME)
  local startRevive = tick()
  local reviving = true

  PlayerDowned_M:FireAllClients("ReviveStarted", reviverPlayer.Name, downedPlayerName)

  task.spawn(function()
    while reviving do
      task.wait(0.5)
      -- Check reviver is still in range
      local dist = (reviverRoot.Position - downedRoot.Position).Magnitude
      if dist > REVIVE_RADIUS * 1.5 then
        reviving = false
        PlayerDowned_M:FireAllClients("ReviveCancelled", reviverPlayer.Name)
        return
      end
      if tick() - startRevive >= REVIVE_TIME then
        -- Revive complete
        reviving = false
        downedPlayers[downedPlayer.UserId] = nil
        local humanoid = downedCharacter:FindFirstChildOfClass("Humanoid")
        if humanoid then
          humanoid.Health = humanoid.MaxHealth * 0.3
          humanoid.WalkSpeed = 16
          humanoid.JumpPower = 50
        end
        PlayerDowned_M:FireAllClients("ReviveComplete", downedPlayerName)
      end
    end
  end)
end)

-- ── SPLIT-UP DOORS ───────────────────────────────────────────
-- Some doors only let 1 player through (forces separation)
local function SetupSplitDoor(doorPart: BasePart)
  local passedPlayers: { [string]: boolean } = {}
  local maxPassers = 1

  doorPart.Touched:Connect(function(hit)
    local character = hit.Parent
    local player = Players_M:GetPlayerFromCharacter(character)
    if not player then return end
    if passedPlayers[player.UserId] then return end

    local count = 0
    for _ in pairs(passedPlayers) do count = count + 1 end

    if count < maxPassers then
      passedPlayers[player.UserId] = true
      -- Let them through (door becomes solid for others)
      if count + 1 >= maxPassers then
        -- Make door solid for remaining players
        doorPart.CanCollide = true
        doorPart.Color = Color3.fromRGB(200, 50, 50)  -- red = locked
      end
    end
  end)
end

-- ── DEATH SPECTATING ─────────────────────────────────────────
-- When a player dies fully, send them to spectate living players
Players_M.PlayerAdded:Connect(function(player)
  local character = player.Character or player.CharacterAdded:Wait()
  local humanoid = character:WaitForChild("Humanoid")

  humanoid.Died:Connect(function()
    -- Wait a moment then set up spectate camera (client handles actual camera)
    task.wait(1)
    PlayerDowned_M:FireClient(player, "Spectate", "")
  end)
end)

-- ── PROXIMITY CHAT (SIMULATED) ───────────────────────────────
-- Chat only reaches players within PROXIMITY_CHAT_RANGE studs
ProximityChatMsg_M.OnServerEvent:Connect(function(sender: Player, message: string)
  local senderChar = sender.Character
  if not senderChar then return end
  local senderRoot = senderChar:FindFirstChild("HumanoidRootPart")
  if not senderRoot then return end

  -- Clean message
  message = message:sub(1, 150)

  for _, player in ipairs(Players_M:GetPlayers()) do
    if player ~= sender then
      local char = player.Character
      if char then
        local root = char:FindFirstChild("HumanoidRootPart")
        if root then
          local dist = (root.Position - senderRoot.Position).Magnitude
          if dist <= PROXIMITY_CHAT_RANGE then
            -- Volume attenuates with distance
            local volume = 1 - (dist / PROXIMITY_CHAT_RANGE)
            ProximityChatMsg_M:FireClient(player, sender.Name, message, volume)
          end
        end
      end
    end
  end
end)


-- ============================================================
-- SECTION 6: LIGHTING AND ATMOSPHERE
-- Place in: ServerScriptService/AtmosphereManager.server.lua
-- ============================================================

local Lighting_A   = game:GetService("Lighting")
local TweenService_A = game:GetService("TweenService")
local RunService_A = game:GetService("RunService")
local Players_A    = game:GetService("Players")

-- ── HORROR LIGHTING SETUP ────────────────────────────────────
-- Run this ONCE at game start to configure the horror atmosphere
local function SetupHorrorLighting()
  -- Core lighting: very dark, future technology for best shadows
  Lighting_A.Technology = Enum.Technology.Future
  Lighting_A.Brightness = 0.15
  Lighting_A.GlobalShadows = true
  Lighting_A.ShadowSoftness = 0.5

  -- Dark ambient: near-black so only player lights matter
  Lighting_A.Ambient = Color3.fromRGB(8, 6, 10)
  Lighting_A.OutdoorAmbient = Color3.fromRGB(12, 10, 15)
  Lighting_A.ColorShift_Bottom = Color3.fromRGB(5, 5, 15)
  Lighting_A.ColorShift_Top = Color3.fromRGB(10, 8, 12)

  -- Time of night
  Lighting_A.ClockTime = 0.5  -- 12:30 AM

  -- Atmosphere: heavy fog, desaturated
  local atmosphere = Lighting_A:FindFirstChildOfClass("Atmosphere")
    or Instance.new("Atmosphere")
  atmosphere.Density = 0.55
  atmosphere.Offset  = 0.1
  atmosphere.Color   = Color3.fromRGB(15, 12, 20)
  atmosphere.Decay   = Color3.fromRGB(10, 8, 14)
  atmosphere.Glare   = 0
  atmosphere.Haze    = 2.5
  atmosphere.Parent  = Lighting_A

  -- Color correction: desaturated, slightly blue-shifted for horror
  local colorCorrection = Lighting_A:FindFirstChildOfClass("ColorCorrectionEffect")
    or Instance.new("ColorCorrectionEffect")
  colorCorrection.Brightness = -0.05
  colorCorrection.Contrast   = 0.15
  colorCorrection.Saturation = -0.3
  colorCorrection.TintColor  = Color3.fromRGB(200, 210, 230)
  colorCorrection.Parent     = Lighting_A

  -- Bloom: subtle, only picks up lit areas
  local bloom = Lighting_A:FindFirstChildOfClass("BloomEffect")
    or Instance.new("BloomEffect")
  bloom.Intensity = 0.4
  bloom.Size      = 24
  bloom.Threshold = 2.0
  bloom.Parent    = Lighting_A

  -- Depth of field: very light, keeps scene readable
  local dof = Lighting_A:FindFirstChildOfClass("DepthOfFieldEffect")
    or Instance.new("DepthOfFieldEffect")
  dof.FarIntensity  = 0.05
  dof.NearIntensity = 0
  dof.FocusDistance = 50
  dof.InFocusRadius = 40
  dof.Parent        = Lighting_A
end

SetupHorrorLighting()

-- ── DYNAMIC LIGHT FLICKER ────────────────────────────────────
-- Attach to any PointLight to make it flicker realistically
local function StartFlicker(pointLight: PointLight, baseRange: number, flickerSpeed: number)
  local phase = math.random() * math.pi * 2  -- random phase offset
  task.spawn(function()
    while pointLight.Parent do
      local t = tick() * flickerSpeed + phase
      -- Perlin-style noise using sin sum
      local noise = math.sin(t) * 0.4
        + math.sin(t * 2.7) * 0.2
        + math.sin(t * 5.3) * 0.15
        + math.sin(t * 11.1) * 0.05
      local normalizedNoise = (noise + 0.8) / 1.6  -- 0.0 - 1.0 range
      pointLight.Brightness = math.max(0, normalizedNoise) * 1.5
      pointLight.Range = baseRange * (0.85 + normalizedNoise * 0.3)
      RunService_A.Heartbeat:Wait()
    end
  end)
end

-- Apply flicker to all corridor lights in workspace
local function SetupFlickerLights()
  for _, obj in ipairs(workspace:GetDescendants()) do
    if obj:IsA("PointLight") and obj.Parent.Name:match("CorridorLight") then
      local speed = 1.5 + math.random() * 2.5
      StartFlicker(obj, obj.Range, speed)
    end
  end
end
SetupFlickerLights()

-- ── FLASHLIGHT TOOL ─────────────────────────────────────────
-- StarterPack/Flashlight tool (client handles battery drain locally)
local function CreateFlashlight(): Tool
  local tool = Instance.new("Tool")
  tool.Name = "Flashlight"
  tool.RequiresHandle = true
  tool.ToolTip = "Battery powered flashlight"

  local handle = Instance.new("Part")
  handle.Name = "Handle"
  handle.Size = Vector3.new(0.3, 0.3, 1.2)
  handle.Color = Color3.fromRGB(30, 30, 30)
  handle.Material = Enum.Material.Metal
  handle.Parent = tool

  local spotlight = Instance.new("SpotLight")
  spotlight.Enabled = false
  spotlight.Brightness = 5
  spotlight.Range = 55
  spotlight.Angle = 35
  spotlight.Color = Color3.fromRGB(240, 235, 220)
  spotlight.Face = Enum.NormalId.Front
  spotlight.Shadows = true
  spotlight.Parent = handle

  -- Battery value (client-side drain)
  local battery = Instance.new("NumberValue")
  battery.Name = "Battery"
  battery.Value = 100
  battery.Parent = tool

  local equipped = false

  tool.Equipped:Connect(function()
    equipped = true
    spotlight.Enabled = true
  end)

  tool.Unequipped:Connect(function()
    equipped = false
    spotlight.Enabled = false
  end)

  -- Client-side battery drain (in StarterCharacterScripts/FlashlightBattery.client.lua)
  -- Included here as a LocalScript inside the tool for completeness:
  local drainScript = Instance.new("LocalScript")
  drainScript.Name = "BatteryDrain"
  drainScript.Source = [[
    local tool = script.Parent
    local spotlight = tool.Handle:WaitForChild("SpotLight")
    local battery = tool:WaitForChild("Battery")
    local DRAIN_RATE = 1.5  -- percent per second

    game:GetService("RunService").Heartbeat:Connect(function(dt)
      if spotlight.Enabled then
        battery.Value = math.max(0, battery.Value - DRAIN_RATE * dt)
        -- Dim as battery dies
        spotlight.Brightness = 5 * (battery.Value / 100)
        spotlight.Range = 55 * (0.5 + battery.Value / 200)
        if battery.Value <= 0 then
          spotlight.Enabled = false
        end
      end
    end)

    -- Double-click to shake and restore 5% (if battery > 0)
    local lastClick = 0
    tool.Activated:Connect(function()
      local now = tick()
      if now - lastClick < 0.4 and battery.Value > 0 then
        battery.Value = math.min(100, battery.Value + 5)
        spotlight.Enabled = true
      end
      lastClick = now
    end)
  ]]
  drainScript.Parent = tool

  return tool
end

-- ── EMERGENCY RED LIGHTING ───────────────────────────────────
local function TriggerEmergencyLighting(duration: number)
  -- Store original values
  local origAmbient = Lighting_A.Ambient
  local origBrightness = Lighting_A.Brightness

  -- Flash to red emergency lighting
  TweenService_A:Create(Lighting_A, TweenInfo.new(0.3), {
    Ambient = Color3.fromRGB(60, 5, 5),
    Brightness = 0.1,
  }):Play()

  -- All active point lights go red
  for _, obj in ipairs(workspace:GetDescendants()) do
    if obj:IsA("PointLight") then
      task.spawn(function()
        local origColor = obj.Color
        obj.Color = Color3.fromRGB(200, 10, 10)
        task.wait(duration)
        obj.Color = origColor
      end)
    end
  end

  task.wait(duration)
  TweenService_A:Create(Lighting_A, TweenInfo.new(1.5), {
    Ambient = origAmbient,
    Brightness = origBrightness,
  }):Play()
end

-- ── FOG TRANSITION BETWEEN ROOMS ────────────────────────────
local function TransitionFogToRoom(newDensity: number, newDecay: Color3)
  local atmosphere = Lighting_A:FindFirstChildOfClass("Atmosphere")
  if not atmosphere then return end
  TweenService_A:Create(atmosphere, TweenInfo.new(2.5, Enum.EasingStyle.Sine), {
    Density = newDensity,
    Decay   = newDecay,
  }):Play()
end


-- ============================================================
-- SECTION 7: SOUND DESIGN SYSTEM
-- Place in: ServerScriptService/SoundManager.server.lua
-- AND: StarterPlayerScripts/SoundClient.client.lua
-- ============================================================

-- ── SERVER SIDE: ambient audio events ────────────────────────

local ReplicatedStorage_SND = game:GetService("ReplicatedStorage")
local Players_SND = game:GetService("Players")
local RunService_SND = game:GetService("RunService")

-- ── CLIENT SIDE (StarterPlayerScripts/SoundClient.client.lua) ──

local SoundService_SND = game:GetService("SoundService")
local TweenService_SND = game:GetService("TweenService")
local Players_SND_C    = game:GetService("Players")
local ReplicatedStorage_SND_C = game:GetService("ReplicatedStorage")

local LocalPlayer_SND = Players_SND_C.LocalPlayer

-- Sound IDs (replace with real Roblox audio asset IDs)
local SOUND_IDS = {
  ambientDrone    = "rbxassetid://5869777681",
  randomCreak     = "rbxassetid://9117976980",
  distantFootstep = "rbxassetid://7145893534",
  monsterGrowl    = "rbxassetid://9068627030",
  monsterChase    = "rbxassetid://9071503494",
  calmExploration = "rbxassetid://5869395159",
  waterDrip       = "rbxassetid://6196543273",
  electricBuzz    = "rbxassetid://5861052536",
  windHowl        = "rbxassetid://6196543400",
  jumpscareStinger = "rbxassetid://9127411489",
  heartbeat       = "rbxassetid://3003552064",
}

-- ── AMBIENT LAYER SETUP ───────────────────────────────────────
local function BuildAmbientAudio()
  local ambientFolder = Instance.new("Folder")
  ambientFolder.Name = "HorrorAmbient"
  ambientFolder.Parent = SoundService_SND

  -- Base drone: constant low rumble
  local drone = Instance.new("Sound")
  drone.Name = "Drone"
  drone.SoundId = SOUND_IDS.ambientDrone
  drone.Volume = 0.4
  drone.Looped = true
  drone.RollOffMode = Enum.RollOffMode.InverseTapered
  drone.Parent = ambientFolder
  drone:Play()

  -- Random creaks: fire at random intervals
  local creak = Instance.new("Sound")
  creak.Name = "Creak"
  creak.SoundId = SOUND_IDS.randomCreak
  creak.Volume = 0
  creak.Looped = false
  creak.Parent = ambientFolder

  task.spawn(function()
    while ambientFolder.Parent do
      task.wait(8 + math.random() * 20)  -- every 8-28 seconds
      creak.Volume = 0.2 + math.random() * 0.3
      creak.PlaybackSpeed = 0.8 + math.random() * 0.4
      creak:Play()
    end
  end)

  -- Distant footsteps
  local footstep = Instance.new("Sound")
  footstep.Name = "DistantFootstep"
  footstep.SoundId = SOUND_IDS.distantFootstep
  footstep.Volume = 0
  footstep.Looped = false
  footstep.Parent = ambientFolder

  task.spawn(function()
    while ambientFolder.Parent do
      task.wait(15 + math.random() * 30)
      footstep.Volume = 0.1 + math.random() * 0.15
      footstep:Play()
    end
  end)

  -- Environmental: water drip
  local drip = Instance.new("Sound")
  drip.Name = "WaterDrip"
  drip.SoundId = SOUND_IDS.waterDrip
  drip.Volume = 0.25
  drip.Looped = false
  drip.Parent = ambientFolder

  task.spawn(function()
    while ambientFolder.Parent do
      task.wait(3 + math.random() * 7)
      drip.PlaybackSpeed = 0.7 + math.random() * 0.6
      drip:Play()
    end
  end)

  return ambientFolder
end

-- ── DYNAMIC MUSIC SYSTEM ─────────────────────────────────────
local musicState = "calm"  -- "calm" | "tense" | "chase"
local currentTrack: Sound? = nil

local MusicTracks = {
  calm  = SOUND_IDS.calmExploration,
  chase = SOUND_IDS.monsterChase,
}

local function CrossfadeMusic(newState: string)
  if newState == musicState and currentTrack then return end
  musicState = newState

  local newSoundId = MusicTracks[newState] or MusicTracks["calm"]

  local newTrack = Instance.new("Sound")
  newTrack.SoundId = newSoundId
  newTrack.Volume = 0
  newTrack.Looped = true
  newTrack.Parent = SoundService_SND
  newTrack:Play()

  -- Fade in new, fade out old
  TweenService_SND:Create(newTrack, TweenInfo.new(2), { Volume = 0.45 }):Play()

  if currentTrack then
    local oldTrack = currentTrack
    TweenService_SND:Create(oldTrack, TweenInfo.new(2), { Volume = 0 }):Play()
    task.delay(2.5, function()
      oldTrack:Stop()
      oldTrack:Destroy()
    end)
  end
  currentTrack = newTrack
end

-- ── MONSTER PROXIMITY AUDIO ───────────────────────────────────
-- Growl gets louder as monster approaches (called from MonsterAI events)
local growlSound: Sound

local function SetupProximityGrowl()
  growlSound = Instance.new("Sound")
  growlSound.Name = "MonsterGrowl"
  growlSound.SoundId = SOUND_IDS.monsterGrowl
  growlSound.Volume = 0
  growlSound.Looped = true
  growlSound.Parent = SoundService_SND
  growlSound:Play()
end

local Remotes_SND  = ReplicatedStorage_SND_C:WaitForChild("Remotes")
local MonsterAlert_SND = Remotes_SND:WaitForChild("MonsterAlert")

MonsterAlert_SND.OnClientEvent:Connect(function(alertType: string, position: Vector3?, dist: number?)
  if alertType == "Proximity" and dist then
    -- Volume ramps from 0 at 55 studs to 0.9 at 0 studs
    local volume = math.max(0, 1 - (dist / 55)) * 0.9
    if growlSound then
      growlSound.Volume = volume
      growlSound.PlaybackSpeed = 0.8 + volume * 0.4
    end
    -- Switch to chase music when monster close
    if dist < 30 then
      CrossfadeMusic("chase")
    elseif dist < 50 then
      -- tense: keep music state for a beat
    else
      CrossfadeMusic("calm")
    end
  elseif alertType == "Spotted" then
    CrossfadeMusic("chase")
  elseif alertType == "Reappeared" then
    -- Jumpscare stinger
    local stinger = Instance.new("Sound")
    stinger.SoundId = SOUND_IDS.jumpscareStinger
    stinger.Volume = 0.9
    stinger.Parent = SoundService_SND
    stinger:Play()
    game:GetService("Debris"):AddItem(stinger, 3)
    CrossfadeMusic("chase")
  end
end)

-- ── ELECTRIC BUZZ & WIND ─────────────────────────────────────
local function AttachElectricBuzz(part: BasePart)
  local buzz = Instance.new("Sound")
  buzz.SoundId = SOUND_IDS.electricBuzz
  buzz.Volume = 0.3
  buzz.Looped = true
  buzz.RollOffMode = Enum.RollOffMode.Linear
  buzz.RollOffMinDistance = 2
  buzz.RollOffMaxDistance = 12
  buzz.Parent = part
  buzz:Play()
  return buzz
end

local function AttachWindHowl(part: BasePart)
  local wind = Instance.new("Sound")
  wind.SoundId = SOUND_IDS.windHowl
  wind.Volume = 0.5
  wind.Looped = true
  wind.RollOffMode = Enum.RollOffMode.Linear
  wind.RollOffMinDistance = 5
  wind.RollOffMaxDistance = 40
  wind.Parent = part
  wind:Play()
  return wind
end

-- Initialize audio systems on client
SetupProximityGrowl()
BuildAmbientAudio()
CrossfadeMusic("calm")
`
}
