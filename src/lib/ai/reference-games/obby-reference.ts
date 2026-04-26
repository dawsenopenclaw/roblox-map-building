import 'server-only';

/**
 * Production-quality reference obby (obstacle course) game.
 * Returns complete, working Luau code following real DevForum best practices.
 *
 * Systems included:
 *   1. Stage-based checkpoints (20 stages) with DataStore persistence
 *   2. Kill brick detection with Humanoid:TakeDamage()
 *   3. Moving/rotating obstacles via TweenService
 *   4. Difficulty scaling across 4 tiers (Easy/Medium/Hard/Extreme)
 *   5. Speedrun timer with OrderedDataStore leaderboard (top 10)
 *   6. Skip Stage dev product purchase
 *   7. Lobby system with "Play" button teleport
 *   8. Reward system (coins per stage, completion bonus)
 *   9. Seven obstacle types as constants
 *  10. Full DataStore save/load with pcall + BindToClose
 */
export function getObbyReference(): string {
  return `--[[
  ============================================================================
  COMPLETE OBBY GAME -- SERVER SCRIPT (ServerScriptService)
  ============================================================================
  Architecture:
    - 20 stages across 4 difficulty tiers (Easy 1-5, Medium 6-10, Hard 11-15, Extreme 16-20)
    - Server authoritative: all progression, coins, times tracked on server
    - 7 obstacle types: KillBrick, MovingPlatform, SpinningBeam,
      DisappearingBlock, ConveyorBelt, LaunchPad, WallJump
    - Stage checkpoints with transparent touch parts (not SpawnLocations)
    - Speedrun timer with OrderedDataStore top-10 leaderboard
    - Skip Stage via DevProduct purchase (server validated)
    - Lobby spawn area with "Play" button that teleports to last checkpoint
    - Coin rewards per stage (first-time only) + completion bonus
    - DataStore persistence: stage, best time, coins, stages completed set
    - pcall on every DataStore call, BindToClose for safe shutdown

  Folder Structure Expected:
    Workspace/
      Lobby/
        SpawnPoint (SpawnLocation -- initial spawn)
        PlayButton (Part with ClickDetector)
      Stages/
        Stage1/
          Checkpoint (Part -- transparent, CanCollide false)
          Obstacles/ (folder of obstacle parts)
          KillBricks/ (folder of red Neon parts)
        Stage2/ ... through Stage20/
      WinPlatform (Part -- final goal, gold Neon)
    ServerStorage/
      ObstacleTemplates/ (optional prefabs)
    ReplicatedStorage/
      Remotes/ (created by script if missing)
        UpdateObbyUI (RemoteEvent -- server to client)
        TimerUpdate (RemoteEvent -- server to client)
        RequestSkipStage (RemoteEvent -- client to server)
        LeaderboardUpdate (RemoteEvent -- server to client)
  ============================================================================
--]]

-- Services
-- All services grabbed at top level to avoid repeated GetService hash lookups.
local Players = game:GetService("Players")
local DataStoreService = game:GetService("DataStoreService")
local TweenService = game:GetService("TweenService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local MarketplaceService = game:GetService("MarketplaceService")
local RunService = game:GetService("RunService")

----------------------------------------------------------------------------
-- SECTION 1: CONSTANTS & OBSTACLE TYPE DEFINITIONS
-- Every tunable value is a constant at the top. No magic numbers in logic.
----------------------------------------------------------------------------

-- Stage layout
local TOTAL_STAGES = 20
local SAVE_INTERVAL = 60 -- auto-save every 60 seconds
local DATASTORE_KEY_PREFIX = "ObbyV2_"
local LEADERBOARD_KEY = "ObbySpeedrunV2"
local LEADERBOARD_SIZE = 10

-- DevProduct for Skip Stage (create this in the Creator Dashboard)
local SKIP_STAGE_PRODUCT_ID = 0 -- REPLACE with your actual DevProduct ID

-- Coin rewards per difficulty tier (first-time stage completion only)
local COIN_REWARDS = {
  Easy = 10,     -- stages 1-5
  Medium = 25,   -- stages 6-10
  Hard = 50,     -- stages 11-15
  Extreme = 100, -- stages 16-20
}
local COMPLETION_BONUS = 500 -- bonus for finishing all 20 stages

-- Checkpoint appearance
local CHECKPOINT_TRANSPARENCY = 0.6
local CHECKPOINT_COLOR = Color3.fromRGB(0, 255, 127) -- spring green

-- Kill brick appearance
local KILL_BRICK_COLOR = BrickColor.new("Bright red")
local KILL_BRICK_MATERIAL = Enum.Material.Neon -- glowing red = universal danger signal

--[[
  OBSTACLE TYPES
  Each type is a table with its visual properties and behavior parameters.
  The setup functions below read these to configure parts in the workspace.
  Level designers place Parts with a StringAttribute "ObstacleType" set to
  one of these keys. The script auto-configures behavior based on type.
--]]
local ObstacleTypes = {
  -- Static red neon kill brick. Instant death on touch.
  KillBrick = {
    material = Enum.Material.Neon,
    color = BrickColor.new("Bright red"),
    anchored = true,
  },

  -- Anchored platform that tweens back and forth between two points.
  -- Speed scales with difficulty tier.
  MovingPlatform = {
    material = Enum.Material.DiamondPlate,
    color = BrickColor.new("Sand blue"),
    anchored = true,
    baseMoveTime = 4, -- seconds per direction at Easy tier
  },

  -- Anchored cylinder that rotates continuously around its axis.
  -- Angular speed scales with difficulty tier.
  SpinningBeam = {
    material = Enum.Material.Metal,
    color = BrickColor.new("Dark stone grey"),
    anchored = true,
    baseRotationSpeed = 45, -- degrees per second at Easy tier
  },

  -- Platform that fades in and out on a timer. Players must time their jumps.
  -- Cycle time decreases with difficulty.
  DisappearingBlock = {
    material = Enum.Material.Concrete,
    color = BrickColor.new("Medium stone grey"),
    anchored = true,
    baseVisibleTime = 3,   -- seconds visible at Easy tier
    baseHiddenTime = 2,    -- seconds hidden at Easy tier
  },

  -- Belt surface that pushes the player in a direction via BodyVelocity on touch.
  -- Force scales with difficulty tier.
  ConveyorBelt = {
    material = Enum.Material.Fabric,
    color = BrickColor.new("Dark grey"),
    anchored = true,
    baseSpeed = 15, -- studs/sec at Easy tier
  },

  -- Pad that launches player upward via BodyVelocity impulse on touch.
  -- Launch force scales with difficulty tier.
  LaunchPad = {
    material = Enum.Material.Neon,
    color = BrickColor.new("Lime green"),
    anchored = true,
    baseLaunchForce = 80, -- upward velocity at Easy tier
  },

  -- Wall segment that detects proximity. Combined with jump input on client,
  -- allows wall-kick behavior. Server places invisible trigger zones.
  WallJump = {
    material = Enum.Material.Brick,
    color = BrickColor.new("Reddish brown"),
    anchored = true,
    wallKickForce = 40, -- lateral push on wall-kick
  },
}

--[[
  DIFFICULTY TIERS
  Each tier defines a speed multiplier that scales obstacle parameters.
  Higher multiplier = faster platforms, shorter disappear windows, etc.
  Gap distances between platforms also increase per tier (handled in level design,
  but the script logs expected ranges in comments for designers).
--]]
local DifficultyTiers = {
  { name = "Easy",    stageMin = 1,  stageMax = 5,  speedMultiplier = 1.0 },
  { name = "Medium",  stageMin = 6,  stageMax = 10, speedMultiplier = 1.4 },
  { name = "Hard",    stageMin = 11, stageMax = 15, speedMultiplier = 1.8 },
  { name = "Extreme", stageMin = 16, stageMax = 20, speedMultiplier = 2.5 },
}

-- Helper: get difficulty tier for a given stage number
local function getTierForStage(stageNum: number): { name: string, stageMin: number, stageMax: number, speedMultiplier: number }
  for _, tier in DifficultyTiers do
    if stageNum >= tier.stageMin and stageNum <= tier.stageMax then
      return tier
    end
  end
  return DifficultyTiers[4] -- fallback to Extreme
end

-- Helper: get coin reward for a given stage number
local function getCoinReward(stageNum: number): number
  local tier = getTierForStage(stageNum)
  return COIN_REWARDS[tier.name] or 10
end

----------------------------------------------------------------------------
-- SECTION 2: REMOTES SETUP
-- Create all RemoteEvents in a Remotes folder under ReplicatedStorage.
-- Using a folder keeps ReplicatedStorage organized and prevents name collisions.
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

local UpdateObbyUI = getOrCreateRemote("UpdateObbyUI", "RemoteEvent") :: RemoteEvent
local TimerUpdateRemote = getOrCreateRemote("TimerUpdate", "RemoteEvent") :: RemoteEvent
local RequestSkipStage = getOrCreateRemote("RequestSkipStage", "RemoteEvent") :: RemoteEvent
local LeaderboardUpdate = getOrCreateRemote("LeaderboardUpdate", "RemoteEvent") :: RemoteEvent

----------------------------------------------------------------------------
-- SECTION 3: DATASTORES
-- Two stores: one regular DataStore for player save data,
-- one OrderedDataStore for the speedrun leaderboard.
-- Both wrapped in pcall because DataStore can fail in Studio or under load.
----------------------------------------------------------------------------
local obbyStore: DataStore? = nil
local leaderboardStore: OrderedDataStore? = nil

do
  local ok1, store1 = pcall(function()
    return DataStoreService:GetDataStore("ObbySaveDataV2")
  end)
  if ok1 then
    obbyStore = store1
  else
    warn("[Obby] DataStore unavailable:", store1)
  end

  local ok2, store2 = pcall(function()
    return DataStoreService:GetOrderedDataStore(LEADERBOARD_KEY)
  end)
  if ok2 then
    leaderboardStore = store2
  else
    warn("[Obby] OrderedDataStore unavailable:", store2)
  end
end

-- Player save data schema
type PlayerData = {
  currentStage: number,
  bestTime: number,           -- 0 = never completed full run
  coins: number,
  totalDeaths: number,
  completions: number,
  stagesCompleted: { [string]: boolean }, -- tracks which stages gave coin reward
}

local DEFAULT_DATA: PlayerData = {
  currentStage = 1,
  bestTime = 0,
  coins = 0,
  totalDeaths = 0,
  completions = 0,
  stagesCompleted = {},
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
-- SECTION 4: PLAYER STATE
-- Server-side state for every connected player.
-- activeStage = where they are RIGHT NOW (for respawn).
-- playerData = persistent save data.
-- runStartTime = when current speedrun attempt began (nil = not running).
----------------------------------------------------------------------------
local playerData: { [number]: PlayerData } = {}
local activeStage: { [number]: number } = {}
local runStartTime: { [number]: number? } = {}

----------------------------------------------------------------------------
-- SECTION 5: DATA LOAD / SAVE
-- Every DataStore call is pcall-wrapped with one retry on failure.
-- We never trust raw DataStore output -- we validate against DEFAULT_DATA keys.
----------------------------------------------------------------------------
local function loadPlayerData(player: Player): PlayerData
  local data = deepCopy(DEFAULT_DATA)
  if not obbyStore then return data end

  local key = DATASTORE_KEY_PREFIX .. tostring(player.UserId)
  local success, result = pcall(function()
    return (obbyStore :: DataStore):GetAsync(key)
  end)

  if success and result then
    -- Merge saved fields into default structure (forward-compatible)
    for k, v in result :: any do
      if (data :: any)[k] ~= nil then
        (data :: any)[k] = v
      end
    end
  elseif not success then
    warn("[Obby] Load failed for", player.Name, ":", result)
    -- Single retry after short delay
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
    -- Single retry
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
-- SECTION 6: LEADERBOARD (OrderedDataStore)
-- Stores best times as integers (milliseconds) because OrderedDataStore
-- only accepts integers. We multiply by 1000 and floor.
-- Lower time = better, so we store as-is (ascending sort).
----------------------------------------------------------------------------
local function submitLeaderboardTime(player: Player, timeSeconds: number)
  if not leaderboardStore then return end

  local timeMs = math.floor(timeSeconds * 1000)
  if timeMs <= 0 then return end

  local success, err = pcall(function()
    -- UpdateAsync to only save if this time is better than existing
    (leaderboardStore :: OrderedDataStore):UpdateAsync(
      tostring(player.UserId),
      function(oldValue)
        if oldValue == nil or timeMs < oldValue then
          return timeMs
        end
        return nil -- don't update if existing time is better
      end
    )
  end)

  if not success then
    warn("[Obby] Leaderboard submit failed:", err)
  end
end

local function fetchLeaderboard(): { { userId: number, timeMs: number, displayName: string } }
  if not leaderboardStore then return {} end

  local entries = {}
  local success, result = pcall(function()
    -- GetSortedAsync(ascending, pageSize)
    -- ascending = true because lower time = better
    return (leaderboardStore :: OrderedDataStore):GetSortedAsync(true, LEADERBOARD_SIZE)
  end)

  if not success or not result then return entries end

  local page = result:GetCurrentPage()
  for rank, entry in page do
    local displayName = "Player"
    -- Try to get display name from connected players first (cheaper than API call)
    local connectedPlayer = Players:GetPlayerByUserId(entry.key and tonumber(entry.key) or 0)
    if connectedPlayer then
      displayName = connectedPlayer.DisplayName
    end

    table.insert(entries, {
      userId = tonumber(entry.key) or 0,
      timeMs = entry.value,
      displayName = displayName,
    })
  end

  return entries
end

-- Broadcast leaderboard to all players every 30 seconds
task.spawn(function()
  while true do
    task.wait(30)
    local lb = fetchLeaderboard()
    for _, player in Players:GetPlayers() do
      LeaderboardUpdate:FireClient(player, lb)
    end
  end
end)

----------------------------------------------------------------------------
-- SECTION 7: LEADERSTATS
-- Shows Stage and Coins on the built-in Roblox leaderboard tab.
----------------------------------------------------------------------------
local function setupLeaderstats(player: Player)
  local leaderstats = Instance.new("Folder")
  leaderstats.Name = "leaderstats"
  leaderstats.Parent = player

  local stageVal = Instance.new("IntValue")
  stageVal.Name = "Stage"
  stageVal.Value = 1
  stageVal.Parent = leaderstats

  local coinsVal = Instance.new("IntValue")
  coinsVal.Name = "Coins"
  coinsVal.Value = 0
  coinsVal.Parent = leaderstats
end

local function syncPlayerUI(player: Player)
  local data = playerData[player.UserId]
  if not data then return end
  local stage = activeStage[player.UserId] or 1
  local tier = getTierForStage(stage)

  -- Update leaderstats
  local leaderstats = player:FindFirstChild("leaderstats")
  if leaderstats then
    local stageVal = leaderstats:FindFirstChild("Stage")
    if stageVal and stageVal:IsA("IntValue") then
      stageVal.Value = stage
    end
    local coinsVal = leaderstats:FindFirstChild("Coins")
    if coinsVal and coinsVal:IsA("IntValue") then
      coinsVal.Value = data.coins
    end
  end

  -- Fire UI update to client with full state
  UpdateObbyUI:FireClient(player, {
    currentStage = stage,
    totalStages = TOTAL_STAGES,
    bestTime = data.bestTime,
    coins = data.coins,
    totalDeaths = data.totalDeaths,
    completions = data.completions,
    tierName = tier.name,
  })
end

----------------------------------------------------------------------------
-- SECTION 8: LOBBY SYSTEM
-- Players spawn in the Lobby area. A "Play" button (Part with ClickDetector)
-- teleports them to their last checkpoint. This prevents players from
-- being dumped mid-obby on join -- they always start in a safe area.
----------------------------------------------------------------------------
local lobbyFolder = workspace:FindFirstChild("Lobby")

local function teleportToCheckpoint(player: Player, stageNum: number)
  local character = player.Character
  if not character then return end

  local stagesFolder = workspace:FindFirstChild("Stages")
  if not stagesFolder then return end

  local stageFolder = stagesFolder:FindFirstChild("Stage" .. tostring(stageNum))
  if not stageFolder then return end

  local checkpoint = stageFolder:FindFirstChild("Checkpoint")
  if not checkpoint or not checkpoint:IsA("BasePart") then return end

  local hrp = character:FindFirstChild("HumanoidRootPart")
  if not hrp or not hrp:IsA("BasePart") then return end

  -- Teleport 5 studs above checkpoint to avoid clipping into the part
  hrp.CFrame = checkpoint.CFrame + Vector3.new(0, 5, 0)
end

local function setupLobby()
  if not lobbyFolder then
    warn("[Obby] Workspace/Lobby folder not found!")
    return
  end

  local playButton = lobbyFolder:FindFirstChild("PlayButton")
  if not playButton or not playButton:IsA("BasePart") then
    warn("[Obby] Lobby/PlayButton part not found!")
    return
  end

  -- Add ClickDetector if not already present
  local clickDetector = playButton:FindFirstChildOfClass("ClickDetector")
  if not clickDetector then
    clickDetector = Instance.new("ClickDetector")
    clickDetector.MaxActivationDistance = 16
    clickDetector.Parent = playButton
  end

  -- Visual: make the Play button stand out
  playButton.Material = Enum.Material.Neon
  playButton.BrickColor = BrickColor.new("Lime green")
  playButton.Anchored = true

  -- "PLAY" label above the button
  local billboard = Instance.new("BillboardGui")
  billboard.Size = UDim2.new(4, 0, 2, 0)
  billboard.StudsOffset = Vector3.new(0, 4, 0)
  billboard.Parent = playButton

  local label = Instance.new("TextLabel")
  label.Size = UDim2.new(1, 0, 1, 0)
  label.BackgroundTransparency = 1
  label.Text = "PLAY"
  label.TextColor3 = Color3.new(1, 1, 1)
  label.TextStrokeTransparency = 0
  label.TextScaled = true
  label.Font = Enum.Font.GothamBold
  label.Parent = billboard

  clickDetector.MouseClick:Connect(function(player: Player)
    local data = playerData[player.UserId]
    if not data then return end

    -- Teleport to their saved stage (or stage 1 if new)
    local targetStage = math.clamp(data.currentStage, 1, TOTAL_STAGES)
    activeStage[player.UserId] = targetStage
    teleportToCheckpoint(player, targetStage)

    -- Start speedrun timer
    runStartTime[player.UserId] = os.clock()
    syncPlayerUI(player)
  end)
end

setupLobby()

----------------------------------------------------------------------------
-- SECTION 9: CHECKPOINT SYSTEM
-- Each stage folder has a Checkpoint Part (transparent, CanCollide false).
-- On touch, server records stage progress. Checkpoints are NOT SpawnLocations
-- because we handle respawn teleportation manually for more control.
-- DataStore persistence means players resume where they left off.
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
    if not checkpoint or not checkpoint:IsA("BasePart") then
      warn("[Obby] Missing Checkpoint in", stageName)
      continue
    end

    -- Configure checkpoint as transparent touch trigger
    checkpoint.Transparency = CHECKPOINT_TRANSPARENCY
    checkpoint.CanCollide = false
    checkpoint.Anchored = true
    checkpoint.Color = CHECKPOINT_COLOR
    checkpoint.Material = Enum.Material.ForceField

    -- Stage number label
    local billboard = Instance.new("BillboardGui")
    billboard.Size = UDim2.new(3, 0, 1.5, 0)
    billboard.StudsOffset = Vector3.new(0, 4, 0)
    billboard.AlwaysOnTop = true
    billboard.Parent = checkpoint

    local tier = getTierForStage(stageNum)
    local label = Instance.new("TextLabel")
    label.Size = UDim2.new(1, 0, 1, 0)
    label.BackgroundTransparency = 1
    label.Text = "Stage " .. tostring(stageNum) .. " [" .. tier.name .. "]"
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

      local prevStage = activeStage[player.UserId] or 0

      -- Only advance if this is the next stage (sequential progression).
      -- Prevents skipping stages by running past multiple checkpoints.
      if stageNum == prevStage + 1 then
        activeStage[player.UserId] = stageNum

        -- Start speedrun timer when reaching stage 1
        if stageNum == 1 then
          runStartTime[player.UserId] = os.clock()
        end

        -- Update saved stage if this is further than ever before
        if stageNum > data.currentStage then
          data.currentStage = stageNum
        end

        -- REWARD SYSTEM: coins for first-time stage completion
        local stageKey = tostring(stageNum)
        if not data.stagesCompleted[stageKey] then
          data.stagesCompleted[stageKey] = true
          local reward = getCoinReward(stageNum)
          data.coins += reward
        end

        syncPlayerUI(player)
      end
    end)
  end
end

setupCheckpoints()

----------------------------------------------------------------------------
-- SECTION 10: KILL BRICK DETECTION
-- Red Neon parts that deal max damage via Humanoid:TakeDamage().
-- Using TakeDamage instead of setting Health = 0 respects ForceField
-- (e.g. from spawn protection). Debounce prevents multi-fire on ragdoll.
----------------------------------------------------------------------------
local killDebounce: { [number]: boolean } = {}

local function setupKillBricks()
  if not stagesFolder then return end

  for _, stageFolder in stagesFolder:GetChildren() do
    local killBricksFolder = stageFolder:FindFirstChild("KillBricks")
    if not killBricksFolder then continue end

    for _, killBrick in killBricksFolder:GetChildren() do
      if not killBrick:IsA("BasePart") then continue end

      -- Visual: bright red Neon = universal danger signal
      killBrick.BrickColor = KILL_BRICK_COLOR
      killBrick.Material = KILL_BRICK_MATERIAL
      killBrick.Anchored = true
      killBrick.CanCollide = true

      killBrick.Touched:Connect(function(hit: BasePart)
        local character = hit.Parent
        if not character then return end
        local humanoid = character:FindFirstChildOfClass("Humanoid")
        if not humanoid then return end
        if humanoid.Health <= 0 then return end -- already dead
        local player = Players:GetPlayerFromCharacter(character)
        if not player then return end

        -- Debounce: prevent multiple death events per contact
        if killDebounce[player.UserId] then return end
        killDebounce[player.UserId] = true

        -- TakeDamage respects ForceField, unlike setting Health directly
        humanoid:TakeDamage(humanoid.MaxHealth)

        -- Track deaths
        local data = playerData[player.UserId]
        if data then
          data.totalDeaths += 1
        end

        -- Reset debounce after respawn
        task.delay(2, function()
          killDebounce[player.UserId] = nil
        end)
      end)
    end
  end
end

setupKillBricks()

----------------------------------------------------------------------------
-- SECTION 11: MOVING / ROTATING OBSTACLES
-- TweenService-based platforms and beams. Each obstacle Part has a
-- StringAttribute "ObstacleType" that maps to the ObstacleTypes table.
-- Speed is scaled by the difficulty tier of the stage it belongs to.
--
-- Why TweenService (not BodyVelocity/BodyForce):
--   - Anchored parts cannot use BodyMovers
--   - TweenService gives deterministic, smooth, frame-independent movement
--   - Easing styles create natural acceleration/deceleration
--   - No physics jitter from collisions
----------------------------------------------------------------------------

local function getStageNumFromPart(part: BasePart): number
  -- Walk up the parent chain to find a StageN folder
  local current = part.Parent
  while current and current ~= workspace do
    local name = current.Name
    local num = tonumber(string.match(name, "^Stage(%d+)$"))
    if num then return num end
    current = current.Parent
  end
  return 1 -- default to Easy tier
end

local function setupMovingPlatforms()
  if not stagesFolder then return end

  for _, stageFolder in stagesFolder:GetChildren() do
    local obstaclesFolder = stageFolder:FindFirstChild("Obstacles")
    if not obstaclesFolder then continue end

    for _, obstacle in obstaclesFolder:GetChildren() do
      if not obstacle:IsA("BasePart") then continue end

      local obstacleType = obstacle:GetAttribute("ObstacleType") :: string?
      if not obstacleType then continue end

      local stageNum = getStageNumFromPart(obstacle)
      local tier = getTierForStage(stageNum)
      local speedMult = tier.speedMultiplier

      ----------------------------------------------------------------
      -- MOVING PLATFORM
      -- Tweens between PointA and PointB attributes.
      -- Speed increases with difficulty tier.
      ----------------------------------------------------------------
      if obstacleType == "MovingPlatform" then
        local config = ObstacleTypes.MovingPlatform
        obstacle.Material = config.material
        obstacle.BrickColor = config.color
        obstacle.Anchored = true

        local pointA = obstacle:GetAttribute("PointA") :: Vector3?
        local pointB = obstacle:GetAttribute("PointB") :: Vector3?

        if not pointA then
          pointA = obstacle.Position
          obstacle:SetAttribute("PointA", pointA)
        end
        if not pointB then
          pointB = obstacle.Position + Vector3.new(20, 0, 0)
          obstacle:SetAttribute("PointB", pointB)
        end

        obstacle.Position = pointA

        -- Faster tiers = shorter move time = faster platform
        local moveTime = config.baseMoveTime / speedMult
        local pauseTime = math.max(0.2, 0.5 / speedMult)

        task.spawn(function()
          local tweenInfo = TweenInfo.new(
            moveTime,
            Enum.EasingStyle.Sine,
            Enum.EasingDirection.InOut
          )

          while obstacle and obstacle.Parent do
            local tweenToB = TweenService:Create(obstacle, tweenInfo, { Position = pointB })
            tweenToB:Play()
            tweenToB.Completed:Wait()
            task.wait(pauseTime)

            local tweenToA = TweenService:Create(obstacle, tweenInfo, { Position = pointA })
            tweenToA:Play()
            tweenToA.Completed:Wait()
            task.wait(pauseTime)
          end
        end)

      ----------------------------------------------------------------
      -- SPINNING BEAM
      -- Rotates continuously around the Y axis.
      -- Angular speed scales with difficulty tier.
      ----------------------------------------------------------------
      elseif obstacleType == "SpinningBeam" then
        local config = ObstacleTypes.SpinningBeam
        obstacle.Material = config.material
        obstacle.BrickColor = config.color
        obstacle.Anchored = true

        local degreesPerSec = config.baseRotationSpeed * speedMult

        task.spawn(function()
          while obstacle and obstacle.Parent do
            -- Rotate by (degreesPerSec * dt) each frame for smooth rotation
            local dt = RunService.Heartbeat:Wait()
            obstacle.CFrame = obstacle.CFrame * CFrame.Angles(0, math.rad(degreesPerSec * dt), 0)
          end
        end)

      ----------------------------------------------------------------
      -- DISAPPEARING BLOCK
      -- Cycles between visible (CanCollide true) and hidden (CanCollide false).
      -- Visible/hidden durations shrink at harder tiers.
      ----------------------------------------------------------------
      elseif obstacleType == "DisappearingBlock" then
        local config = ObstacleTypes.DisappearingBlock
        obstacle.Material = config.material
        obstacle.BrickColor = config.color
        obstacle.Anchored = true

        local visibleTime = config.baseVisibleTime / speedMult
        local hiddenTime = config.baseHiddenTime / speedMult

        -- Stagger start so not all blocks disappear simultaneously
        local staggerOffset = obstacle:GetAttribute("StaggerOffset") :: number? or 0

        task.spawn(function()
          task.wait(staggerOffset)

          while obstacle and obstacle.Parent do
            -- Visible phase
            obstacle.Transparency = 0
            obstacle.CanCollide = true
            task.wait(visibleTime)

            -- Fade out warning (0.3 sec flash before disappearing)
            obstacle.Transparency = 0.5
            task.wait(0.3)

            -- Hidden phase
            obstacle.Transparency = 1
            obstacle.CanCollide = false
            task.wait(hiddenTime)
          end
        end)

      ----------------------------------------------------------------
      -- CONVEYOR BELT
      -- On touch, applies a BodyVelocity to the character's HumanoidRootPart
      -- that pushes them in the belt's LookVector direction.
      -- Removed on TouchEnded. Speed scales with tier.
      ----------------------------------------------------------------
      elseif obstacleType == "ConveyorBelt" then
        local config = ObstacleTypes.ConveyorBelt
        obstacle.Material = config.material
        obstacle.BrickColor = config.color
        obstacle.Anchored = true

        local beltSpeed = config.baseSpeed * speedMult
        local beltDirection = obstacle.CFrame.LookVector

        -- Visual: surface arrow decal to show direction
        local arrow = obstacle:FindFirstChild("ArrowTexture")
        if not arrow then
          arrow = Instance.new("Texture")
          arrow.Name = "ArrowTexture"
          arrow.Face = Enum.NormalId.Top
          arrow.StudsPerTileU = 4
          arrow.StudsPerTileV = 4
          arrow.Parent = obstacle
        end

        obstacle.Touched:Connect(function(hit: BasePart)
          local character = hit.Parent
          if not character then return end
          local hrp = character:FindFirstChild("HumanoidRootPart")
          if not hrp or not hrp:IsA("BasePart") then return end

          -- Don't add duplicate BodyVelocity
          if hrp:FindFirstChild("ConveyorForce") then return end

          local bv = Instance.new("BodyVelocity")
          bv.Name = "ConveyorForce"
          bv.MaxForce = Vector3.new(10000, 0, 10000) -- horizontal only
          bv.Velocity = beltDirection * beltSpeed
          bv.P = 1250
          bv.Parent = hrp
        end)

        obstacle.TouchEnded:Connect(function(hit: BasePart)
          local character = hit.Parent
          if not character then return end
          local hrp = character:FindFirstChild("HumanoidRootPart")
          if not hrp then return end

          local bv = hrp:FindFirstChild("ConveyorForce")
          if bv then bv:Destroy() end
        end)

      ----------------------------------------------------------------
      -- LAUNCH PAD
      -- On touch, applies a one-shot upward BodyVelocity impulse.
      -- Force scales with difficulty tier.
      ----------------------------------------------------------------
      elseif obstacleType == "LaunchPad" then
        local config = ObstacleTypes.LaunchPad
        obstacle.Material = config.material
        obstacle.BrickColor = config.color
        obstacle.Anchored = true

        local launchForce = config.baseLaunchForce * speedMult
        local launchDebounce: { [number]: boolean } = {}

        obstacle.Touched:Connect(function(hit: BasePart)
          local character = hit.Parent
          if not character then return end
          local humanoid = character:FindFirstChildOfClass("Humanoid")
          if not humanoid then return end
          local player = Players:GetPlayerFromCharacter(character)
          if not player then return end
          local hrp = character:FindFirstChild("HumanoidRootPart")
          if not hrp or not hrp:IsA("BasePart") then return end

          -- Per-player debounce to prevent double-launch
          if launchDebounce[player.UserId] then return end
          launchDebounce[player.UserId] = true

          -- Upward impulse via short-lived BodyVelocity
          local bv = Instance.new("BodyVelocity")
          bv.Name = "LaunchForce"
          bv.MaxForce = Vector3.new(0, math.huge, 0) -- vertical only
          bv.Velocity = Vector3.new(0, launchForce, 0)
          bv.Parent = hrp

          -- Remove after 0.2 seconds (impulse, not sustained force)
          task.delay(0.2, function()
            if bv and bv.Parent then bv:Destroy() end
          end)

          -- Reset debounce
          task.delay(0.5, function()
            launchDebounce[player.UserId] = nil
          end)
        end)

      ----------------------------------------------------------------
      -- WALL JUMP
      -- Places an invisible trigger zone next to the wall.
      -- When a player touches it while airborne, they get a lateral
      -- kick impulse (away from the wall). Combined with the natural
      -- jump input, this creates wall-kick platforming.
      ----------------------------------------------------------------
      elseif obstacleType == "WallJump" then
        local config = ObstacleTypes.WallJump
        obstacle.Material = config.material
        obstacle.BrickColor = config.color
        obstacle.Anchored = true

        local wallKickForce = config.wallKickForce
        local kickDebounce: { [number]: boolean } = {}

        -- The wall normal points away from the wall surface.
        -- We use the wall's RightVector as the kick direction.
        -- Level designers should orient the wall so RightVector points
        -- toward the intended landing area.
        local kickDirection = obstacle.CFrame.RightVector

        obstacle.Touched:Connect(function(hit: BasePart)
          local character = hit.Parent
          if not character then return end
          local humanoid = character:FindFirstChildOfClass("Humanoid")
          if not humanoid then return end
          local player = Players:GetPlayerFromCharacter(character)
          if not player then return end
          local hrp = character:FindFirstChild("HumanoidRootPart")
          if not hrp or not hrp:IsA("BasePart") then return end

          -- Only wall-kick if player is in the air (not grounded)
          if humanoid.FloorMaterial ~= Enum.Material.Air then return end

          if kickDebounce[player.UserId] then return end
          kickDebounce[player.UserId] = true

          -- Lateral + upward kick
          local bv = Instance.new("BodyVelocity")
          bv.Name = "WallKickForce"
          bv.MaxForce = Vector3.new(math.huge, math.huge, math.huge)
          bv.Velocity = (kickDirection * wallKickForce) + Vector3.new(0, wallKickForce * 0.7, 0)
          bv.Parent = hrp

          task.delay(0.15, function()
            if bv and bv.Parent then bv:Destroy() end
          end)

          task.delay(0.4, function()
            kickDebounce[player.UserId] = nil
          end)
        end)
      end
    end
  end
end

setupMovingPlatforms()

----------------------------------------------------------------------------
-- SECTION 12: WIN PLATFORM
-- Final goal after Stage 20. Records speedrun time, submits to leaderboard,
-- awards completion bonus coins, fires celebration particles.
----------------------------------------------------------------------------
local winPlatform = workspace:FindFirstChild("WinPlatform")
local winDebounce: { [number]: boolean } = {}

local function setupWinPlatform()
  if not winPlatform or not winPlatform:IsA("BasePart") then
    warn("[Obby] WinPlatform not found in Workspace!")
    return
  end

  -- Visual: gold Neon stands out as the final goal
  winPlatform.Material = Enum.Material.Neon
  winPlatform.BrickColor = BrickColor.new("Bright yellow")
  winPlatform.Anchored = true

  -- Celebration particles (disabled until someone wins)
  local particleEmitter = winPlatform:FindFirstChildOfClass("ParticleEmitter")
  if not particleEmitter then
    particleEmitter = Instance.new("ParticleEmitter")
    particleEmitter.Name = "CelebrationParticles"
    particleEmitter.Rate = 0
    particleEmitter.Lifetime = NumberRange.new(1, 2.5)
    particleEmitter.Speed = NumberRange.new(10, 25)
    particleEmitter.SpreadAngle = Vector2.new(360, 360)
    particleEmitter.Color = ColorSequence.new({
      ColorSequenceKeypoint.new(0, Color3.fromRGB(255, 215, 0)),
      ColorSequenceKeypoint.new(0.5, Color3.fromRGB(255, 100, 50)),
      ColorSequenceKeypoint.new(1, Color3.fromRGB(255, 50, 200)),
    })
    particleEmitter.Size = NumberSequence.new({
      NumberSequenceKeypoint.new(0, 1.5),
      NumberSequenceKeypoint.new(1, 0),
    })
    particleEmitter.Parent = winPlatform
  end

  -- "FINISH" label
  local billboard = Instance.new("BillboardGui")
  billboard.Size = UDim2.new(5, 0, 2, 0)
  billboard.StudsOffset = Vector3.new(0, 6, 0)
  billboard.AlwaysOnTop = true
  billboard.Parent = winPlatform

  local finishLabel = Instance.new("TextLabel")
  finishLabel.Size = UDim2.new(1, 0, 1, 0)
  finishLabel.BackgroundTransparency = 1
  finishLabel.Text = "FINISH!"
  finishLabel.TextColor3 = Color3.fromRGB(255, 215, 0)
  finishLabel.TextStrokeTransparency = 0
  finishLabel.TextScaled = true
  finishLabel.Font = Enum.Font.GothamBold
  finishLabel.Parent = billboard

  winPlatform.Touched:Connect(function(hit: BasePart)
    local character = hit.Parent
    if not character then return end
    local player = Players:GetPlayerFromCharacter(character)
    if not player then return end

    if winDebounce[player.UserId] then return end
    winDebounce[player.UserId] = true

    local data = playerData[player.UserId]
    if not data then
      winDebounce[player.UserId] = nil
      return
    end

    -- Must have reached stage 20 to win (prevents teleport exploits)
    local currentActive = activeStage[player.UserId] or 0
    if currentActive < TOTAL_STAGES then
      winDebounce[player.UserId] = nil
      return
    end

    -- Calculate and record run time
    local startTime = runStartTime[player.UserId]
    local runTime = 0
    if startTime then
      runTime = os.clock() - startTime
      runStartTime[player.UserId] = nil

      -- Update personal best
      if data.bestTime == 0 or runTime < data.bestTime then
        data.bestTime = math.floor(runTime * 100) / 100
      end

      -- Submit to global leaderboard
      submitLeaderboardTime(player, runTime)
    end

    -- Track completion
    data.completions += 1
    data.currentStage = TOTAL_STAGES

    -- Completion bonus coins (every completion, not just first)
    data.coins += COMPLETION_BONUS

    -- Celebration burst
    if particleEmitter then
      particleEmitter.Rate = 300
      task.delay(4, function()
        if particleEmitter and particleEmitter.Parent then
          particleEmitter.Rate = 0
        end
      end)
    end

    -- Notify client
    UpdateObbyUI:FireClient(player, {
      currentStage = TOTAL_STAGES,
      totalStages = TOTAL_STAGES,
      bestTime = data.bestTime,
      coins = data.coins,
      totalDeaths = data.totalDeaths,
      completions = data.completions,
      tierName = "Extreme",
      justFinished = true,
      runTime = math.floor(runTime * 100) / 100,
    })

    syncPlayerUI(player)

    -- Allow winning again after 4 seconds (new run)
    task.delay(4, function()
      winDebounce[player.UserId] = nil
    end)
  end)
end

setupWinPlatform()

----------------------------------------------------------------------------
-- SECTION 13: SPEEDRUN TIMER
-- Server sends elapsed time to each client every 0.5 seconds.
-- Time is tracked on server via os.clock (monotonic, sub-second precision,
-- immune to system clock changes). Client only displays -- never authoritative.
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
-- SECTION 14: SKIP STAGE (Dev Product)
-- Players can purchase a DevProduct to skip their current stage.
-- Server validates the purchase, advances them to the next checkpoint,
-- and teleports them there. No coins awarded for skipped stages.
--
-- To set up: create a DevProduct in the Creator Dashboard, paste its ID
-- into SKIP_STAGE_PRODUCT_ID at the top of this script.
----------------------------------------------------------------------------
local function handleSkipStage(player: Player)
  local data = playerData[player.UserId]
  if not data then return end

  local currentActive = activeStage[player.UserId] or 1
  if currentActive >= TOTAL_STAGES then return end -- already at last stage

  -- Advance to next stage
  local nextStage = currentActive + 1
  activeStage[player.UserId] = nextStage

  if nextStage > data.currentStage then
    data.currentStage = nextStage
  end

  -- Teleport to new checkpoint
  teleportToCheckpoint(player, nextStage)
  syncPlayerUI(player)
end

-- DevProduct purchase callback
MarketplaceService.ProcessReceipt = function(receiptInfo)
  -- Validate this is our skip-stage product
  if receiptInfo.ProductId ~= SKIP_STAGE_PRODUCT_ID then
    return Enum.ProductPurchaseDecision.NotProcessedYet
  end

  local player = Players:GetPlayerByUserId(receiptInfo.PlayerId)
  if not player then
    return Enum.ProductPurchaseDecision.NotProcessedYet
  end

  -- Execute the skip
  handleSkipStage(player)

  return Enum.ProductPurchaseDecision.PurchaseGranted
end

-- Client can also request skip via RemoteEvent (triggers purchase prompt)
RequestSkipStage.OnServerEvent:Connect(function(player: Player)
  if SKIP_STAGE_PRODUCT_ID == 0 then
    warn("[Obby] SKIP_STAGE_PRODUCT_ID not configured!")
    return
  end

  -- Prompt the purchase on the client
  MarketplaceService:PromptProductPurchase(player, SKIP_STAGE_PRODUCT_ID)
end)

----------------------------------------------------------------------------
-- SECTION 15: RESPAWN HANDLING
-- On death, player respawns at their current active checkpoint.
-- We teleport manually on CharacterAdded instead of using SpawnLocations
-- for precise control (SpawnLocations have team-color quirks).
----------------------------------------------------------------------------
local function onCharacterAdded(player: Player, character: Model)
  local humanoid = character:WaitForChild("Humanoid", 5)
  if not humanoid or not humanoid:IsA("Humanoid") then return end

  -- Teleport to current checkpoint (or lobby spawn if stage 0)
  local stage = activeStage[player.UserId]
  if stage and stage >= 1 then
    task.wait(0.1) -- small delay for character to fully load
    teleportToCheckpoint(player, stage)
  end
  -- If stage is nil/0, they stay in the lobby (default spawn)

  -- Track death for stats
  humanoid.Died:Connect(function()
    local data = playerData[player.UserId]
    if data then
      data.totalDeaths += 1
    end
  end)
end

----------------------------------------------------------------------------
-- SECTION 16: PLAYER JOIN / LEAVE
-- On join: load data, setup leaderstats, spawn in lobby.
-- On leave: save data, clean up all state tables.
----------------------------------------------------------------------------
Players.PlayerAdded:Connect(function(player: Player)
  local data = loadPlayerData(player)
  playerData[player.UserId] = data

  -- Player starts in lobby (activeStage nil means lobby).
  -- They must click the Play button to enter the obby.
  activeStage[player.UserId] = nil

  setupLeaderstats(player)

  -- Set initial leaderstats from loaded data
  local leaderstats = player:FindFirstChild("leaderstats")
  if leaderstats then
    local coinsVal = leaderstats:FindFirstChild("Coins")
    if coinsVal and coinsVal:IsA("IntValue") then
      coinsVal.Value = data.coins
    end
  end

  -- Handle spawning/respawning
  player.CharacterAdded:Connect(function(character: Model)
    onCharacterAdded(player, character)
  end)

  if player.Character then
    onCharacterAdded(player, player.Character)
  end

  -- Send initial leaderboard data
  task.delay(2, function()
    if player.Parent then
      local lb = fetchLeaderboard()
      LeaderboardUpdate:FireClient(player, lb)
    end
  end)
end)

Players.PlayerRemoving:Connect(function(player: Player)
  local userId = player.UserId
  savePlayerData(userId)

  -- Clean up all state tables to prevent memory leaks
  playerData[userId] = nil
  activeStage[userId] = nil
  runStartTime[userId] = nil
  killDebounce[userId] = nil
  winDebounce[userId] = nil
end)

----------------------------------------------------------------------------
-- SECTION 17: AUTO-SAVE
-- Periodic save for all connected players. Runs in its own coroutine.
-- Saves are staggered with task.spawn per player to avoid DataStore
-- throttling (6 + numPlayers * 60 requests/min budget).
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
-- SECTION 18: BIND TO CLOSE
-- On server shutdown, save all player data before the server closes.
-- BindToClose gives us up to 30 seconds in production (less in Studio).
-- We spawn all saves in parallel and wait up to 5 seconds.
----------------------------------------------------------------------------
game:BindToClose(function()
  local threads = {}
  for userId, _ in playerData do
    local thread = task.spawn(function()
      savePlayerData(userId)
    end)
    table.insert(threads, thread)
  end
  -- Give DataStore calls time to complete
  task.wait(5)
end)

print("[Obby] Server script loaded — " .. TOTAL_STAGES .. " stages, 4 difficulty tiers, 7 obstacle types")
`;
}
