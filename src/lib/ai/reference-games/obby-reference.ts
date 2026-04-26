/**
 * Production-quality reference obby (obstacle course) game.
 * Returns complete, working Luau code following real DevForum best practices.
 * Checkpoints, kill bricks, moving platforms, speedrun timer, DataStore.
 */
export function obbyReferenceCode(): string {
  return `--[[
  ============================================================================
  COMPLETE OBBY GAME — SERVER SCRIPT (ServerScriptService)
  ============================================================================
  Architecture:
    - 10 checkpoint stages using SpawnLocation (Roblox native respawn system)
    - Kill bricks (Touched -> Humanoid.Health = 0)
    - 2 moving platforms using TweenService ping-pong
    - Speedrun timer using os.clock (monotonic, not affected by clock changes)
    - Win platform with particle celebration
    - DataStore for best time + furthest stage reached
    - leaderstats showing current Stage number

  Folder Structure Expected:
    Workspace/
      Stages/
        Stage1/
          Checkpoint (SpawnLocation)
          Platforms/ (folder of Part obstacles)
          KillBricks/ (folder of red Parts)
        Stage2/ ... through Stage10/
      MovingPlatforms/
        Platform1 (Part with Attachment "PointA" and "PointB" as attributes)
        Platform2 (Part)
      WinPlatform (Part — final goal)
  ============================================================================
--]]

-- Services
local Players = game:GetService("Players")
local DataStoreService = game:GetService("DataStoreService")
local TweenService = game:GetService("TweenService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

----------------------------------------------------------------------------
-- CONSTANTS
----------------------------------------------------------------------------
local TOTAL_STAGES = 10
local SAVE_INTERVAL = 60
local DATASTORE_KEY_PREFIX = "ObbyV1_"
local KILL_BRICK_COLOR = BrickColor.new("Bright red")
local KILL_BRICK_MATERIAL = Enum.Material.Neon -- glowing red = danger signal
local PLATFORM_MOVE_TIME = 3 -- seconds per tween direction
local PLATFORM_PAUSE_TIME = 0.5 -- pause at each end before reversing

----------------------------------------------------------------------------
-- REMOTES
----------------------------------------------------------------------------
local remotesFolder = ReplicatedStorage:FindFirstChild("Remotes")
if not remotesFolder then
  remotesFolder = Instance.new("Folder")
  remotesFolder.Name = "Remotes"
  remotesFolder.Parent = ReplicatedStorage
end

local function getOrCreateRemote(name: string, className: string): Instance
  local existing = remotesFolder:FindFirstChild(name)
  if existing then return existing end
  local remote = Instance.new(className)
  remote.Name = name
  remote.Parent = remotesFolder
  return remote
end

local UpdateUIRemote = getOrCreateRemote("UpdateUI", "RemoteEvent") :: RemoteEvent
local TimerUpdateRemote = getOrCreateRemote("TimerUpdate", "RemoteEvent") :: RemoteEvent

----------------------------------------------------------------------------
-- DATASTORE
----------------------------------------------------------------------------
local obbyStore: DataStore? = nil
do
  local ok, store = pcall(function()
    return DataStoreService:GetDataStore("ObbySaveData")
  end)
  if ok then
    obbyStore = store
  else
    warn("[Obby] DataStore unavailable:", store)
  end
end

type PlayerData = {
  furthestStage: number,
  bestTime: number, -- 0 means never completed
  totalDeaths: number,
  completions: number,
}

local DEFAULT_DATA: PlayerData = {
  furthestStage = 1,
  bestTime = 0,
  totalDeaths = 0,
  completions = 0,
}

local function deepCopy(t: any): any
  if type(t) ~= "table" then return t end
  local copy = {}
  for k, v in t do
    copy[k] = deepCopy(v)
  end
  return copy
end

----------------------------------------------------------------------------
-- PLAYER STATE
-- currentStage tracks where the player is NOW (for respawning).
-- furthestStage tracks their all-time best (for DataStore).
-- runStartTime is when they started the current speedrun attempt.
----------------------------------------------------------------------------
local playerData: { [number]: PlayerData } = {}
local currentStage: { [number]: number } = {}
local runStartTime: { [number]: number? } = {}

----------------------------------------------------------------------------
-- DATA LOAD / SAVE
----------------------------------------------------------------------------
local function loadPlayerData(player: Player): PlayerData
  local data = deepCopy(DEFAULT_DATA)
  if not obbyStore then return data end

  local key = DATASTORE_KEY_PREFIX .. tostring(player.UserId)
  local success, result = pcall(function()
    return (obbyStore :: DataStore):GetAsync(key)
  end)

  if success and result then
    for k, v in result :: any do
      if (data :: any)[k] ~= nil then
        (data :: any)[k] = v
      end
    end
  elseif not success then
    warn("[Obby] Load failed for", player.Name, ":", result)
    task.wait(1)
    local ok2, res2 = pcall(function()
      return (obbyStore :: DataStore):GetAsync(key)
    end)
    if ok2 and res2 then
      for k, v in res2 :: any do
        if (data :: any)[k] ~= nil then
          (data :: any)[k] = v
        end
      end
    end
  end

  return data
end

local function savePlayerData(userId: number): boolean
  if not obbyStore then return false end
  local data = playerData[userId]
  if not data then return false end

  local key = DATASTORE_KEY_PREFIX .. tostring(userId)
  local success, err = pcall(function()
    (obbyStore :: DataStore):SetAsync(key, data)
  end)

  if not success then
    warn("[Obby] Save failed for userId", userId, ":", err)
    task.wait(0.5)
    local ok2, err2 = pcall(function()
      (obbyStore :: DataStore):SetAsync(key, data)
    end)
    if not ok2 then
      warn("[Obby] Retry save failed:", err2)
      return false
    end
  end

  return true
end

----------------------------------------------------------------------------
-- LEADERSTATS
-- Shows Stage number on the built-in leaderboard.
-- Players can see each other's progress at a glance.
----------------------------------------------------------------------------
local function setupLeaderstats(player: Player)
  local leaderstats = Instance.new("Folder")
  leaderstats.Name = "leaderstats"
  leaderstats.Parent = player

  local stageVal = Instance.new("IntValue")
  stageVal.Name = "Stage"
  stageVal.Value = 1
  stageVal.Parent = leaderstats
end

local function syncPlayerUI(player: Player)
  local data = playerData[player.UserId]
  if not data then return end
  local stage = currentStage[player.UserId] or 1

  local leaderstats = player:FindFirstChild("leaderstats")
  if leaderstats then
    local stageVal = leaderstats:FindFirstChild("Stage")
    if stageVal and stageVal:IsA("IntValue") then
      stageVal.Value = stage
    end
  end

  UpdateUIRemote:FireClient(player, {
    currentStage = stage,
    furthestStage = data.furthestStage,
    bestTime = data.bestTime,
    totalDeaths = data.totalDeaths,
    completions = data.completions,
  })
end

----------------------------------------------------------------------------
-- CHECKPOINT SYSTEM
-- Each stage has a SpawnLocation named "Checkpoint".
-- SpawnLocations are the native Roblox respawn system — when a player
-- touches one, Roblox sets it as their respawn point automatically
-- IF AllowTeamChangeTo is true and TeamColor matches (or neutral).
-- We use Touched event to track stage progress server-side.
----------------------------------------------------------------------------
local stagesFolder = workspace:FindFirstChild("Stages")

local function setupCheckpoints()
  if not stagesFolder then
    warn("[Obby] Workspace/Stages folder not found!")
    return
  end

  for stageNum = 1, TOTAL_STAGES do
    local stageName = "Stage" .. tostring(stageNum)
    local stageFolder = stagesFolder:FindFirstChild(stageName)
    if not stageFolder then
      warn("[Obby] Missing stage folder:", stageName)
      continue
    end

    local checkpoint = stageFolder:FindFirstChild("Checkpoint")
    if not checkpoint then
      warn("[Obby] Missing Checkpoint in", stageName)
      continue
    end

    -- Configure SpawnLocation properties
    if checkpoint:IsA("SpawnLocation") then
      checkpoint.AllowTeamChangeTo = true
      checkpoint.Neutral = true -- any team can use it
      checkpoint.Duration = 0 -- no forced spawn delay
    end

    -- Material: Concrete for checkpoints (solid, reliable feeling)
    if checkpoint:IsA("BasePart") then
      checkpoint.Material = Enum.Material.Concrete
      checkpoint.BrickColor = BrickColor.new("Bright green")
    end

    -- Stage number label
    local billboard = Instance.new("BillboardGui")
    billboard.Size = UDim2.new(3, 0, 1.5, 0)
    billboard.StudsOffset = Vector3.new(0, 4, 0)
    billboard.Parent = checkpoint

    local label = Instance.new("TextLabel")
    label.Size = UDim2.new(1, 0, 1, 0)
    label.BackgroundTransparency = 1
    label.Text = "Stage " .. tostring(stageNum)
    label.TextColor3 = Color3.new(1, 1, 1)
    label.TextStrokeTransparency = 0
    label.TextScaled = true
    label.Font = Enum.Font.GothamBold
    label.Parent = billboard

    -- Track when player reaches this checkpoint
    checkpoint.Touched:Connect(function(hit: BasePart)
      local character = hit.Parent
      if not character then return end
      local player = Players:GetPlayerFromCharacter(character)
      if not player then return end

      local data = playerData[player.UserId]
      if not data then return end

      local prevStage = currentStage[player.UserId] or 1

      -- Only advance if this is the next stage or higher
      -- Prevents going backwards from counting as progress
      if stageNum > prevStage then
        currentStage[player.UserId] = stageNum

        -- Start speedrun timer on Stage 1
        if stageNum == 1 then
          runStartTime[player.UserId] = os.clock()
        end

        -- Update furthest stage ever reached
        if stageNum > data.furthestStage then
          data.furthestStage = stageNum
        end

        syncPlayerUI(player)
      elseif stageNum == 1 and prevStage ~= 1 then
        -- Player went back to start — reset for new run
        currentStage[player.UserId] = 1
        runStartTime[player.UserId] = os.clock()
        syncPlayerUI(player)
      end
    end)
  end
end

setupCheckpoints()

----------------------------------------------------------------------------
-- KILL BRICKS
-- Red Neon parts that instantly kill on touch.
-- Debounce prevents the death event from firing multiple times
-- (Touched can fire rapidly as the character ragdolls through the part).
----------------------------------------------------------------------------
local killDebounce: { [number]: boolean } = {}

local function setupKillBricks()
  if not stagesFolder then return end

  for _, stageFolder in stagesFolder:GetChildren() do
    local killBricksFolder = stageFolder:FindFirstChild("KillBricks")
    if not killBricksFolder then continue end

    for _, killBrick in killBricksFolder:GetChildren() do
      if not killBrick:IsA("BasePart") then continue end

      -- Visual: bright red Neon screams "DANGER"
      killBrick.BrickColor = KILL_BRICK_COLOR
      killBrick.Material = KILL_BRICK_MATERIAL
      killBrick.Anchored = true

      killBrick.Touched:Connect(function(hit: BasePart)
        local character = hit.Parent
        if not character then return end
        local humanoid = character:FindFirstChildOfClass("Humanoid")
        if not humanoid then return end
        local player = Players:GetPlayerFromCharacter(character)
        if not player then return end

        -- Debounce: prevent multiple death events per touch
        if killDebounce[player.UserId] then return end
        killDebounce[player.UserId] = true

        -- Kill the player
        humanoid.Health = 0

        -- Track deaths for stats
        local data = playerData[player.UserId]
        if data then
          data.totalDeaths += 1
        end

        -- Reset debounce after respawn time
        task.delay(2, function()
          killDebounce[player.UserId] = nil
        end)
      end)
    end
  end
end

setupKillBricks()

----------------------------------------------------------------------------
-- MOVING PLATFORMS
-- TweenService ping-pong between two positions.
-- We use TweenService here (not BodyVelocity) because these are anchored
-- platforms that move on a fixed path. BodyVelocity is for unanchored
-- physics objects. Anchored + TweenService = deterministic, smooth movement.
--
-- Each platform stores PointA and PointB as Vector3 attributes.
-- This lets level designers set endpoints without code changes.
----------------------------------------------------------------------------
local movingPlatformsFolder = workspace:FindFirstChild("MovingPlatforms")

local function setupMovingPlatforms()
  if not movingPlatformsFolder then return end

  for _, platform in movingPlatformsFolder:GetChildren() do
    if not platform:IsA("BasePart") then continue end

    -- Material: Metal for mechanical feel (never SmoothPlastic)
    platform.Material = Enum.Material.DiamondPlate
    platform.BrickColor = BrickColor.new("Sand blue")
    platform.Anchored = true

    -- Get endpoints from attributes (set by level designer)
    -- If no attributes, use default offset
    local pointA = platform:GetAttribute("PointA") :: Vector3?
    local pointB = platform:GetAttribute("PointB") :: Vector3?

    if not pointA then
      pointA = platform.Position
      platform:SetAttribute("PointA", pointA)
    end
    if not pointB then
      -- Default: move 20 studs in the X direction
      pointB = platform.Position + Vector3.new(20, 0, 0)
      platform:SetAttribute("PointB", pointB)
    end

    -- Start at point A
    platform.Position = pointA

    -- Ping-pong tween loop
    -- We use task.spawn so each platform runs its own independent loop.
    -- The loop alternates between tweening to B and tweening to A.
    task.spawn(function()
      local tweenInfoAtoB = TweenInfo.new(
        PLATFORM_MOVE_TIME,
        Enum.EasingStyle.Sine, -- smooth acceleration/deceleration
        Enum.EasingDirection.InOut
      )
      local tweenInfoBtoA = TweenInfo.new(
        PLATFORM_MOVE_TIME,
        Enum.EasingStyle.Sine,
        Enum.EasingDirection.InOut
      )

      while platform and platform.Parent do
        -- Tween to point B
        local tweenToB = TweenService:Create(
          platform,
          tweenInfoAtoB,
          { Position = pointB }
        )
        tweenToB:Play()
        tweenToB.Completed:Wait()
        task.wait(PLATFORM_PAUSE_TIME)

        -- Tween back to point A
        local tweenToA = TweenService:Create(
          platform,
          tweenInfoBtoA,
          { Position = pointA }
        )
        tweenToA:Play()
        tweenToA.Completed:Wait()
        task.wait(PLATFORM_PAUSE_TIME)
      end
    end)
  end
end

setupMovingPlatforms()

----------------------------------------------------------------------------
-- WIN PLATFORM
-- Final goal. Touching it completes the run, records time, shows particles.
----------------------------------------------------------------------------
local winPlatform = workspace:FindFirstChild("WinPlatform")
local winDebounce: { [number]: boolean } = {}

local function setupWinPlatform()
  if not winPlatform or not winPlatform:IsA("BasePart") then
    warn("[Obby] WinPlatform not found in Workspace!")
    return
  end

  -- Visual: gold Neon so it stands out as the goal
  winPlatform.Material = Enum.Material.Neon
  winPlatform.BrickColor = BrickColor.new("Bright yellow")
  winPlatform.Anchored = true

  -- Celebration particles (pre-placed, disabled until win)
  local particleEmitter = winPlatform:FindFirstChildOfClass("ParticleEmitter")
  if not particleEmitter then
    particleEmitter = Instance.new("ParticleEmitter")
    particleEmitter.Name = "CelebrationParticles"
    particleEmitter.Rate = 0 -- disabled until someone wins
    particleEmitter.Lifetime = NumberRange.new(1, 2)
    particleEmitter.Speed = NumberRange.new(10, 20)
    particleEmitter.SpreadAngle = Vector2.new(360, 360)
    particleEmitter.Color = ColorSequence.new({
      ColorSequenceKeypoint.new(0, Color3.fromRGB(255, 215, 0)),
      ColorSequenceKeypoint.new(0.5, Color3.fromRGB(255, 100, 50)),
      ColorSequenceKeypoint.new(1, Color3.fromRGB(255, 50, 200)),
    })
    particleEmitter.Size = NumberSequence.new({
      NumberSequenceKeypoint.new(0, 1),
      NumberSequenceKeypoint.new(1, 0),
    })
    particleEmitter.Parent = winPlatform
  end

  -- "FINISH" label
  local billboard = Instance.new("BillboardGui")
  billboard.Size = UDim2.new(5, 0, 2, 0)
  billboard.StudsOffset = Vector3.new(0, 5, 0)
  billboard.Parent = winPlatform

  local label = Instance.new("TextLabel")
  label.Size = UDim2.new(1, 0, 1, 0)
  label.BackgroundTransparency = 1
  label.Text = "FINISH!"
  label.TextColor3 = Color3.fromRGB(255, 215, 0)
  label.TextStrokeTransparency = 0
  label.TextScaled = true
  label.Font = Enum.Font.GothamBold
  label.Parent = billboard

  winPlatform.Touched:Connect(function(hit: BasePart)
    local character = hit.Parent
    if not character then return end
    local player = Players:GetPlayerFromCharacter(character)
    if not player then return end

    -- Debounce prevents multiple win triggers
    if winDebounce[player.UserId] then return end
    winDebounce[player.UserId] = true

    local data = playerData[player.UserId]
    if not data then
      winDebounce[player.UserId] = nil
      return
    end

    -- Calculate run time using os.clock (monotonic clock).
    -- os.clock is preferred over os.time/tick for timing because:
    -- 1. It's monotonic (never goes backwards)
    -- 2. It has sub-second precision
    -- 3. It's not affected by system clock changes
    local startTime = runStartTime[player.UserId]
    local runTime = 0
    if startTime then
      runTime = os.clock() - startTime
      runStartTime[player.UserId] = nil

      -- Update best time
      if data.bestTime == 0 or runTime < data.bestTime then
        data.bestTime = math.floor(runTime * 100) / 100 -- round to 2 decimal places
      end
    end

    -- Track completion
    data.completions += 1
    data.furthestStage = TOTAL_STAGES

    -- Celebration: burst of particles for 3 seconds
    if particleEmitter then
      particleEmitter.Rate = 200
      task.delay(3, function()
        if particleEmitter and particleEmitter.Parent then
          particleEmitter.Rate = 0
        end
      end)
    end

    -- Notify the player of their time
    UpdateUIRemote:FireClient(player, {
      currentStage = TOTAL_STAGES,
      furthestStage = data.furthestStage,
      bestTime = data.bestTime,
      totalDeaths = data.totalDeaths,
      completions = data.completions,
      justFinished = true,
      runTime = math.floor(runTime * 100) / 100,
    })

    syncPlayerUI(player)

    -- Reset debounce after 3 seconds (so they can win again for a new run)
    task.delay(3, function()
      winDebounce[player.UserId] = nil
    end)
  end)
end

setupWinPlatform()

----------------------------------------------------------------------------
-- SPEEDRUN TIMER
-- Server sends elapsed time to client every 0.5 seconds for display.
-- We track time on server (os.clock) to prevent client-side manipulation.
-- Client only DISPLAYS the time — server is the authority on actual time.
----------------------------------------------------------------------------
task.spawn(function()
  while true do
    task.wait(0.5)
    for _, player in Players:GetPlayers() do
      local startTime = runStartTime[player.UserId]
      if startTime then
        local elapsed = os.clock() - startTime
        TimerUpdateRemote:FireClient(player, math.floor(elapsed * 100) / 100)
      end
    end
  end
end)

----------------------------------------------------------------------------
-- RESPAWN HANDLING
-- When a player dies and respawns, set their spawn to their current stage.
-- Roblox SpawnLocations handle this natively IF we set TeamColor correctly,
-- but for a teamless obby we manually teleport to the checkpoint.
----------------------------------------------------------------------------
local function onCharacterAdded(player: Player, character: Model)
  local humanoid = character:WaitForChild("Humanoid", 5)
  if not humanoid or not humanoid:IsA("Humanoid") then return end

  -- On death, teleport to current checkpoint on respawn
  humanoid.Died:Connect(function()
    -- The CharacterAdded event will fire again when they respawn.
    -- We handle teleportation in the next CharacterAdded call.
  end)

  -- Teleport to current stage checkpoint
  local stage = currentStage[player.UserId] or 1
  if stagesFolder then
    local stageName = "Stage" .. tostring(stage)
    local stageFolder = stagesFolder:FindFirstChild(stageName)
    if stageFolder then
      local checkpoint = stageFolder:FindFirstChild("Checkpoint")
      if checkpoint and checkpoint:IsA("BasePart") then
        local hrp = character:WaitForChild("HumanoidRootPart", 5)
        if hrp and hrp:IsA("BasePart") then
          -- Small delay to ensure character is fully loaded
          task.wait(0.1)
          hrp.CFrame = checkpoint.CFrame + Vector3.new(0, 5, 0)
        end
      end
    end
  end
end

----------------------------------------------------------------------------
-- PLAYER JOIN / LEAVE
----------------------------------------------------------------------------
Players.PlayerAdded:Connect(function(player: Player)
  local data = loadPlayerData(player)
  playerData[player.UserId] = data

  -- Start at their furthest stage (or 1 if first time)
  currentStage[player.UserId] = math.min(data.furthestStage, TOTAL_STAGES)

  setupLeaderstats(player)
  syncPlayerUI(player)

  -- Start speedrun timer from first join
  runStartTime[player.UserId] = os.clock()

  -- Handle spawning/respawning
  player.CharacterAdded:Connect(function(character: Model)
    onCharacterAdded(player, character)
  end)

  -- Handle current character if already loaded
  if player.Character then
    onCharacterAdded(player, player.Character)
  end
end)

Players.PlayerRemoving:Connect(function(player: Player)
  local userId = player.UserId
  savePlayerData(userId)

  playerData[userId] = nil
  currentStage[userId] = nil
  runStartTime[userId] = nil
  killDebounce[userId] = nil
  winDebounce[userId] = nil
end)

----------------------------------------------------------------------------
-- AUTO-SAVE
----------------------------------------------------------------------------
task.spawn(function()
  while true do
    task.wait(SAVE_INTERVAL)
    for userId, _ in playerData do
      task.spawn(function()
        savePlayerData(userId)
      end)
    end
  end
end)

----------------------------------------------------------------------------
-- BIND TO CLOSE
----------------------------------------------------------------------------
game:BindToClose(function()
  for userId, _ in playerData do
    task.spawn(function()
      savePlayerData(userId)
    end)
  end
  task.wait(5)
end)

print("[Obby] Server script loaded successfully!")
`;
}
