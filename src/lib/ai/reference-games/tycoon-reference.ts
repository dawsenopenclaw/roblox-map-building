/**
 * Production-quality reference tycoon game.
 * Returns complete, working Luau code following real DevForum best practices.
 * Server-side economy, DataStore persistence, proper RemoteEvent security.
 */
export function getTycoonReference(): string {
  return `--[[
  ============================================================================
  COMPLETE TYCOON GAME — SERVER SCRIPT (ServerScriptService)
  ============================================================================
  Architecture:
    - Server authoritative economy (client NEVER touches currency values)
    - Plot claim system with per-player ownership
    - Droppers, conveyors, collectors all server-side
    - DataStore with pcall + BindToClose for safe saving
    - Rate-limited RemoteEvents with type validation
    - Rebirth system with persistent multiplier

  Folder Structure Expected:
    Workspace/
      Plots/
        Plot1/ (template plot with Pad, Conveyor, Collector, DropperPad)
        Plot2/
        Plot3/
        Plot4/
    ServerStorage/
      TycoonItems/
        BasicDropper (Model with DropPoint attachment)
        SpeedDropper (Model)
        ValueDropper (Model)
        AutoCollector (Model)
    ReplicatedStorage/
      Remotes/ (Folder — created by this script if missing)
        PurchaseItem (RemoteEvent)
        RequestRebirth (RemoteEvent)
        UpdateUI (RemoteEvent — server -> client)
        ClaimPlot (RemoteEvent)
  ============================================================================
--]]

-- Services
-- Grab all services at top level so we never call GetService mid-loop.
-- This is a DevForum best practice to avoid repeated hash lookups.
local Players = game:GetService("Players")
local ServerStorage = game:GetService("ServerStorage")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local DataStoreService = game:GetService("DataStoreService")
local RunService = game:GetService("RunService")

----------------------------------------------------------------------------
-- CONSTANTS
-- All tuning values in one place so designers can tweak without hunting.
----------------------------------------------------------------------------
local CURRENCY_NAME = "Cash"
local STARTING_CASH = 0
local SAVE_INTERVAL = 60 -- auto-save every 60 seconds
local MAX_PLOTS = 4
local DROPPER_INTERVAL = 2 -- seconds between drops
local DROPPER_VALUE = 5 -- base cash per resource part
local CONVEYOR_SPEED = 20 -- studs/sec for BodyVelocity
local RESOURCE_LIFETIME = 15 -- destroy uncollected parts after this
local RATE_LIMIT_COOLDOWN = 0.5 -- min seconds between purchase requests
local DATASTORE_KEY_PREFIX = "TycoonV1_"

-- Upgrade costs & effects (level -> cost)
-- Using tables so we can add more levels without code changes.
local SPEED_UPGRADE_COSTS = { 500, 1500, 5000, 15000, 50000 }
local SPEED_UPGRADE_INTERVALS = { 1.5, 1.0, 0.7, 0.5, 0.3 } -- dropper interval per level
local VALUE_UPGRADE_COSTS = { 750, 2500, 8000, 25000, 75000 }
local VALUE_UPGRADE_MULTIPLIERS = { 2, 3, 5, 8, 12 } -- multiplier per level
local AUTOCOLLECT_COST = 10000
local REBIRTH_MIN_CASH = 100000 -- minimum cash to rebirth
local REBIRTH_MULTIPLIER_BONUS = 0.5 -- +50% per rebirth

-- Item shop: itemId -> { cost, serverStorageName, description }
local SHOP_ITEMS: { [string]: { cost: number, modelName: string, desc: string } } = {
  BasicDropper = { cost = 0, modelName = "BasicDropper", desc = "Drops basic resources" },
  SpeedDropper = { cost = 5000, modelName = "SpeedDropper", desc = "Drops faster resources" },
  ValueDropper = { cost = 20000, modelName = "ValueDropper", desc = "Drops high-value resources" },
  AutoCollector = { cost = AUTOCOLLECT_COST, modelName = "AutoCollector", desc = "Auto-collects nearby parts" },
}

----------------------------------------------------------------------------
-- REMOTES SETUP
-- We create the Remotes folder and events from server so they exist
-- before any client script tries to reference them.
-- DevForum pattern: server always owns remote creation.
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

local PurchaseItemRemote = getOrCreateRemote("PurchaseItem", "RemoteEvent") :: RemoteEvent
local RequestRebirthRemote = getOrCreateRemote("RequestRebirth", "RemoteEvent") :: RemoteEvent
local UpdateUIRemote = getOrCreateRemote("UpdateUI", "RemoteEvent") :: RemoteEvent
local ClaimPlotRemote = getOrCreateRemote("ClaimPlot", "RemoteEvent") :: RemoteEvent

----------------------------------------------------------------------------
-- DATASTORE
-- Always pcall DataStore operations. GetDataStore can fail in Studio
-- if API access isn't enabled — we handle that gracefully.
----------------------------------------------------------------------------
local tycoonStore: DataStore? = nil
do
  local ok, store = pcall(function()
    return DataStoreService:GetDataStore("TycoonSaveData")
  end)
  if ok then
    tycoonStore = store
  else
    warn("[Tycoon] DataStore unavailable — saves disabled:", store)
  end
end

-- Default player data structure.
-- Every field has a default so we never index nil.
type PlayerData = {
  cash: number,
  rebirths: number,
  speedLevel: number,
  valueLevel: number,
  hasAutoCollect: boolean,
  ownedItems: { string },
}

local DEFAULT_DATA: PlayerData = {
  cash = STARTING_CASH,
  rebirths = 0,
  speedLevel = 0,
  valueLevel = 0,
  hasAutoCollect = false,
  ownedItems = { "BasicDropper" },
}

-- Deep copy so each player gets independent data.
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
-- In-memory state keyed by UserId. Saved to DataStore periodically.
-- NEVER let the client read or write this directly.
----------------------------------------------------------------------------
local playerData: { [number]: PlayerData } = {}
local playerPlots: { [number]: Model? } = {} -- userId -> plot model
local plotOwners: { [Model]: number } = {} -- plot model -> userId
local playerDroppers: { [number]: { thread } } = {} -- active dropper coroutines
local lastPurchaseTime: { [number]: number } = {} -- rate limiting

-- Available plots (unclaimed)
local plotsFolder = workspace:FindFirstChild("Plots")
local availablePlots: { Model } = {}
if plotsFolder then
  for _, plot in plotsFolder:GetChildren() do
    if plot:IsA("Model") then
      table.insert(availablePlots, plot)
    end
  end
end

----------------------------------------------------------------------------
-- DATA LOAD / SAVE
-- pcall on every DataStore call. Retry once on failure.
-- DevForum consensus: retry once, then warn. Don't infinite loop.
----------------------------------------------------------------------------
local function loadPlayerData(player: Player): PlayerData
  local data = deepCopy(DEFAULT_DATA)
  if not tycoonStore then return data end

  local key = DATASTORE_KEY_PREFIX .. tostring(player.UserId)
  local success, result = pcall(function()
    return (tycoonStore :: DataStore):GetAsync(key)
  end)

  if success and result then
    -- Merge saved data with defaults so new fields get defaults.
    -- This prevents errors when we add new fields in updates.
    for k, v in result :: any do
      if (data :: any)[k] ~= nil then
        (data :: any)[k] = v
      end
    end
  elseif not success then
    warn("[Tycoon] Failed to load data for", player.Name, ":", result)
    -- Retry once
    task.wait(1)
    local ok2, res2 = pcall(function()
      return (tycoonStore :: DataStore):GetAsync(key)
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
  if not tycoonStore then return false end
  local data = playerData[userId]
  if not data then return false end

  local key = DATASTORE_KEY_PREFIX .. tostring(userId)
  local success, err = pcall(function()
    (tycoonStore :: DataStore):SetAsync(key, data)
  end)

  if not success then
    warn("[Tycoon] Failed to save data for userId", userId, ":", err)
    -- Retry once
    task.wait(0.5)
    local ok2, err2 = pcall(function()
      (tycoonStore :: DataStore):SetAsync(key, data)
    end)
    if not ok2 then
      warn("[Tycoon] Retry save failed for userId", userId, ":", err2)
      return false
    end
  end

  return true
end

----------------------------------------------------------------------------
-- LEADERSTATS
-- The classic Roblox pattern: IntValue/NumberValue under player.leaderstats
-- so the built-in leaderboard displays currency automatically.
----------------------------------------------------------------------------
local function setupLeaderstats(player: Player)
  local leaderstats = Instance.new("Folder")
  leaderstats.Name = "leaderstats"
  leaderstats.Parent = player

  local cashValue = Instance.new("IntValue")
  cashValue.Name = CURRENCY_NAME
  cashValue.Value = 0
  cashValue.Parent = leaderstats

  local rebirthsValue = Instance.new("IntValue")
  rebirthsValue.Name = "Rebirths"
  rebirthsValue.Value = 0
  rebirthsValue.Parent = leaderstats
end

-- Sync in-memory cash to leaderstats and fire UI update to client.
local function syncPlayerUI(player: Player)
  local data = playerData[player.UserId]
  if not data then return end

  local leaderstats = player:FindFirstChild("leaderstats")
  if leaderstats then
    local cashVal = leaderstats:FindFirstChild(CURRENCY_NAME)
    if cashVal and cashVal:IsA("IntValue") then
      cashVal.Value = math.floor(data.cash)
    end
    local rebirthVal = leaderstats:FindFirstChild("Rebirths")
    if rebirthVal and rebirthVal:IsA("IntValue") then
      rebirthVal.Value = data.rebirths
    end
  end

  -- Fire client UI update with full state
  -- Client uses this to update shop button enabled/disabled states
  UpdateUIRemote:FireClient(player, {
    cash = data.cash,
    rebirths = data.rebirths,
    speedLevel = data.speedLevel,
    valueLevel = data.valueLevel,
    hasAutoCollect = data.hasAutoCollect,
    ownedItems = data.ownedItems,
    rebirthMultiplier = 1 + (data.rebirths * REBIRTH_MULTIPLIER_BONUS),
  })
end

----------------------------------------------------------------------------
-- PLOT SYSTEM
-- Each plot is a Model in Workspace/Plots with named children:
--   Pad: the claim pad (touch to claim)
--   Conveyor: a part with top surface for belt
--   Collector: a part at the end that detects resource parts
--   DropperPad: where droppers are placed
--   UpgradeButtons: folder of pads for purchasing upgrades
----------------------------------------------------------------------------
local function getDropperInterval(data: PlayerData): number
  if data.speedLevel > 0 and data.speedLevel <= #SPEED_UPGRADE_INTERVALS then
    return SPEED_UPGRADE_INTERVALS[data.speedLevel]
  end
  return DROPPER_INTERVAL
end

local function getValueMultiplier(data: PlayerData): number
  local base = 1
  if data.valueLevel > 0 and data.valueLevel <= #VALUE_UPGRADE_MULTIPLIERS then
    base = VALUE_UPGRADE_MULTIPLIERS[data.valueLevel]
  end
  -- Rebirth multiplier stacks
  local rebirthMult = 1 + (data.rebirths * REBIRTH_MULTIPLIER_BONUS)
  return base * rebirthMult
end

-- Create a resource part that the dropper spawns.
-- These are server-created parts — client never creates economy-relevant objects.
local function createResourcePart(position: Vector3, value: number): Part
  local part = Instance.new("Part")
  part.Name = "Resource"
  part.Size = Vector3.new(1, 1, 1)
  part.Material = Enum.Material.Neon
  part.BrickColor = BrickColor.new("Bright green")
  part.Shape = Enum.PartType.Ball
  part.Anchored = false
  part.CanCollide = true
  part.Position = position

  -- Store the cash value as an attribute.
  -- Attributes are the modern replacement for IntValue children.
  -- DevForum recommends attributes over ValueObjects for custom data.
  part:SetAttribute("CashValue", value)

  -- Auto-destroy after RESOURCE_LIFETIME to prevent part accumulation.
  -- Memory leaks from uncollected parts is a common tycoon bug.
  game:GetService("Debris"):AddItem(part, RESOURCE_LIFETIME)

  part.Parent = workspace

  return part
end

-- Apply conveyor belt velocity to a part using BodyVelocity.
-- DevForum best practice: BodyVelocity on server for moving parts on belts.
-- TweenService on parts causes desync because tweens run independently on
-- server and client. BodyVelocity uses the physics engine which replicates.
local function applyConveyorForce(part: Part, direction: Vector3)
  -- Remove any existing BodyVelocity first
  local existing = part:FindFirstChildOfClass("BodyVelocity")
  if existing then existing:Destroy() end

  local bv = Instance.new("BodyVelocity")
  bv.MaxForce = Vector3.new(math.huge, 0, math.huge) -- no vertical force
  bv.Velocity = direction.Unit * CONVEYOR_SPEED
  -- P controls how aggressively it reaches target velocity.
  -- Higher P = snappier but can cause jitter. 1250 is a good default.
  bv.P = 1250
  bv.Parent = part
end

-- Set up the collector bin at the end of the conveyor.
-- When a resource part touches it, credit the plot owner and destroy the part.
local function setupCollector(collector: BasePart, plotOwnerUserId: number)
  collector.Touched:Connect(function(hit: BasePart)
    if hit.Name ~= "Resource" then return end

    local cashValue = hit:GetAttribute("CashValue")
    if not cashValue or type(cashValue) ~= "number" then return end

    -- Prevent double-collection.
    -- We use an attribute flag because Touched can fire multiple times
    -- before Destroy() propagates.
    if hit:GetAttribute("Collected") then return end
    hit:SetAttribute("Collected", true)

    -- Credit the owner
    local data = playerData[plotOwnerUserId]
    if data then
      data.cash += cashValue
      local player = Players:GetPlayerByUserId(plotOwnerUserId)
      if player then
        syncPlayerUI(player)
      end
    end

    hit:Destroy()
  end)
end

-- Set up conveyor belt surface.
-- Any part that lands on the conveyor gets pushed toward the collector.
local function setupConveyor(conveyor: BasePart, directionToCollector: Vector3)
  conveyor.Touched:Connect(function(hit: BasePart)
    if hit.Name ~= "Resource" then return end
    -- Only apply if not already on conveyor (check for existing BodyVelocity)
    if not hit:FindFirstChildOfClass("BodyVelocity") then
      applyConveyorForce(hit, directionToCollector)
    end
  end)
end

-- Auto-collector: periodically finds nearby resource parts and collects them.
-- This runs as a server coroutine, not a client script.
local function startAutoCollector(plot: Model, userId: number)
  local collector = plot:FindFirstChild("Collector")
  if not collector or not collector:IsA("BasePart") then return end

  task.spawn(function()
    while playerData[userId] and playerPlots[userId] == plot do
      local data = playerData[userId]
      if not data or not data.hasAutoCollect then
        task.wait(1)
        continue
      end

      -- Find all resource parts within 30 studs of the collector
      for _, obj in workspace:GetChildren() do
        if obj.Name == "Resource" and obj:IsA("BasePart") then
          local dist = (obj.Position - collector.Position).Magnitude
          if dist < 30 and not obj:GetAttribute("Collected") then
            obj:SetAttribute("Collected", true)
            local val = obj:GetAttribute("CashValue")
            if val and type(val) == "number" then
              data.cash += val
            end
            obj:Destroy()
          end
        end
      end

      local player = Players:GetPlayerByUserId(userId)
      if player then
        syncPlayerUI(player)
      end

      task.wait(1) -- collect every second
    end
  end)
end

-- Start dropper loop for a player's plot.
-- Spawns resource parts at the dropper location at an interval
-- determined by their speed upgrade level.
local function startDroppers(plot: Model, userId: number)
  local dropperPad = plot:FindFirstChild("DropperPad")
  if not dropperPad or not dropperPad:IsA("BasePart") then
    warn("[Tycoon] Plot missing DropperPad:", plot.Name)
    return
  end

  -- Also find conveyor to determine belt direction
  local conveyor = plot:FindFirstChild("Conveyor")
  local collectorPart = plot:FindFirstChild("Collector")

  -- Calculate conveyor direction (from dropper toward collector)
  local conveyorDir = Vector3.new(1, 0, 0) -- default
  if conveyor and conveyor:IsA("BasePart") and collectorPart and collectorPart:IsA("BasePart") then
    conveyorDir = (collectorPart.Position - conveyor.Position)
    conveyorDir = Vector3.new(conveyorDir.X, 0, conveyorDir.Z) -- flatten
    if conveyorDir.Magnitude > 0.1 then
      conveyorDir = conveyorDir.Unit
    end
  end

  -- Set up the conveyor and collector
  if conveyor and conveyor:IsA("BasePart") then
    setupConveyor(conveyor, conveyorDir)
  end
  if collectorPart and collectorPart:IsA("BasePart") then
    setupCollector(collectorPart, userId)
  end

  -- Dropper coroutine
  local thread = task.spawn(function()
    while playerData[userId] and playerPlots[userId] == plot do
      local data = playerData[userId]
      if not data then break end

      local interval = getDropperInterval(data)
      local value = DROPPER_VALUE * getValueMultiplier(data)

      -- Spawn resource above the dropper pad
      local spawnPos = dropperPad.Position + Vector3.new(0, 3, 0)
      local part = createResourcePart(spawnPos, value)

      -- Slight delay then apply conveyor force so the part drops onto belt first
      task.delay(0.3, function()
        if part and part.Parent then
          applyConveyorForce(part, conveyorDir)
        end
      end)

      task.wait(interval)
    end
  end)

  -- Track the thread so we can clean it up on leave
  if not playerDroppers[userId] then
    playerDroppers[userId] = {}
  end
  table.insert(playerDroppers[userId], thread)
end

-- Place a purchased item model onto the player's plot.
-- Clones from ServerStorage so exploiters can't inject custom models.
local function placeItemOnPlot(plot: Model, itemModelName: string): boolean
  local tycoonItems = ServerStorage:FindFirstChild("TycoonItems")
  if not tycoonItems then
    warn("[Tycoon] ServerStorage/TycoonItems folder missing!")
    return false
  end

  local template = tycoonItems:FindFirstChild(itemModelName)
  if not template then
    warn("[Tycoon] Item template not found:", itemModelName)
    return false
  end

  local dropperPad = plot:FindFirstChild("DropperPad")
  if not dropperPad or not dropperPad:IsA("BasePart") then return false end

  -- Clone and position relative to the plot's dropper pad.
  -- We parent to the plot so cleanup is automatic when plot resets.
  local clone = template:Clone()
  clone.Parent = plot

  -- Position the model near the dropper pad
  if clone:IsA("Model") and clone.PrimaryPart then
    clone:PivotTo(dropperPad.CFrame * CFrame.new(0, 2, 0))
  elseif clone:IsA("BasePart") then
    clone.Position = dropperPad.Position + Vector3.new(0, 2, 0)
  end

  return true
end

----------------------------------------------------------------------------
-- PLOT CLAIMING
-- Player touches a plot's Pad to claim it. Server validates ownership.
-- Only one plot per player. Plots are released when the player leaves.
----------------------------------------------------------------------------
local function claimPlot(player: Player, plotIndex: number)
  -- Validate: player doesn't already own a plot
  if playerPlots[player.UserId] then
    warn("[Tycoon]", player.Name, "already owns a plot")
    return
  end

  -- Validate: plot index is in range
  if plotIndex < 1 or plotIndex > #availablePlots then
    warn("[Tycoon] Invalid plot index:", plotIndex)
    return
  end

  local plot = availablePlots[plotIndex]
  if not plot then return end

  -- Validate: plot isn't already claimed
  if plotOwners[plot] then
    warn("[Tycoon] Plot already claimed:", plot.Name)
    return
  end

  -- Claim it
  playerPlots[player.UserId] = plot
  plotOwners[plot] = player.UserId

  -- Visual indicator: change pad color to show claimed
  local pad = plot:FindFirstChild("Pad")
  if pad and pad:IsA("BasePart") then
    pad.BrickColor = BrickColor.new("Bright green")
    -- Add player name label
    local billboard = Instance.new("BillboardGui")
    billboard.Name = "OwnerLabel"
    billboard.Size = UDim2.new(4, 0, 1, 0)
    billboard.StudsOffset = Vector3.new(0, 3, 0)
    billboard.Parent = pad

    local label = Instance.new("TextLabel")
    label.Size = UDim2.new(1, 0, 1, 0)
    label.BackgroundTransparency = 1
    label.Text = player.Name .. "'s Tycoon"
    label.TextColor3 = Color3.new(1, 1, 1)
    label.TextStrokeTransparency = 0
    label.TextScaled = true
    label.Font = Enum.Font.GothamBold
    label.Parent = billboard
  end

  -- Place the starter dropper (free)
  placeItemOnPlot(plot, "BasicDropper")

  -- Start the dropper and auto-collector systems
  startDroppers(plot, player.UserId)
  startAutoCollector(plot, player.UserId)

  syncPlayerUI(player)
end

-- Touch-based plot claiming (alternative to remote)
if plotsFolder then
  for i, plot in availablePlots do
    local pad = plot:FindFirstChild("Pad")
    if pad and pad:IsA("BasePart") then
      pad.Touched:Connect(function(hit: BasePart)
        local character = hit.Parent
        if not character then return end
        local player = Players:GetPlayerFromCharacter(character)
        if not player then return end
        if playerPlots[player.UserId] then return end -- already has plot
        if plotOwners[plot] then return end -- plot taken
        claimPlot(player, i)
      end)
    end
  end
end

-- Also allow claiming via RemoteEvent (for GUI-based claiming)
ClaimPlotRemote.OnServerEvent:Connect(function(player: Player, plotIndex: unknown)
  -- Type validation: reject anything that isn't a number
  if type(plotIndex) ~= "number" then
    warn("[Tycoon] Invalid plotIndex type from", player.Name)
    return
  end

  -- Sanitize: must be integer in valid range
  local idx = math.floor(plotIndex :: number)
  if idx < 1 or idx > MAX_PLOTS then return end

  claimPlot(player, idx)
end)

----------------------------------------------------------------------------
-- PURCHASE SYSTEM
-- All purchases go through server. Client sends an item ID string,
-- server validates type, checks cost, deducts currency.
-- Rate limited to prevent spam exploits.
----------------------------------------------------------------------------
local function handlePurchase(player: Player, itemId: unknown)
  -- TYPE VALIDATION: reject non-string immediately.
  -- DevForum pattern: always validate remote args on server.
  -- Exploiters can send ANY type through remotes.
  if type(itemId) ~= "string" then
    warn("[Tycoon] Invalid purchase arg type from", player.Name, ":", type(itemId))
    return
  end

  local itemIdStr = itemId :: string

  -- RATE LIMITING: prevent purchase spam.
  -- Without this, exploiters can fire the remote hundreds of times per second.
  local now = tick()
  local lastTime = lastPurchaseTime[player.UserId] or 0
  if (now - lastTime) < RATE_LIMIT_COOLDOWN then
    return -- silently reject, don't warn (would spam logs)
  end
  lastPurchaseTime[player.UserId] = now

  local data = playerData[player.UserId]
  if not data then return end

  local plot = playerPlots[player.UserId]
  if not plot then
    warn("[Tycoon]", player.Name, "tried to purchase without a plot")
    return
  end

  -- Handle upgrade purchases (special item IDs)
  if itemIdStr == "SpeedUpgrade" then
    local nextLevel = data.speedLevel + 1
    if nextLevel > #SPEED_UPGRADE_COSTS then
      -- Max level reached
      return
    end
    local cost = SPEED_UPGRADE_COSTS[nextLevel]
    if data.cash < cost then return end
    data.cash -= cost
    data.speedLevel = nextLevel
    syncPlayerUI(player)
    return
  end

  if itemIdStr == "ValueUpgrade" then
    local nextLevel = data.valueLevel + 1
    if nextLevel > #VALUE_UPGRADE_COSTS then return end
    local cost = VALUE_UPGRADE_COSTS[nextLevel]
    if data.cash < cost then return end
    data.cash -= cost
    data.valueLevel = nextLevel
    syncPlayerUI(player)
    return
  end

  if itemIdStr == "AutoCollect" then
    if data.hasAutoCollect then return end -- already owns it
    if data.cash < AUTOCOLLECT_COST then return end
    data.cash -= AUTOCOLLECT_COST
    data.hasAutoCollect = true
    syncPlayerUI(player)
    return
  end

  -- Regular item purchase from shop
  local shopEntry = SHOP_ITEMS[itemIdStr]
  if not shopEntry then
    warn("[Tycoon] Unknown item:", itemIdStr)
    return
  end

  -- Check if already owned (prevent duplicate purchases)
  for _, ownedId in data.ownedItems do
    if ownedId == itemIdStr then
      return -- already owned
    end
  end

  -- Check cost
  if data.cash < shopEntry.cost then return end

  -- Deduct and record
  data.cash -= shopEntry.cost
  table.insert(data.ownedItems, itemIdStr)

  -- Place the item on their plot
  placeItemOnPlot(plot, shopEntry.modelName)

  syncPlayerUI(player)
end

PurchaseItemRemote.OnServerEvent:Connect(handlePurchase)

----------------------------------------------------------------------------
-- REBIRTH SYSTEM
-- Resets cash, upgrades, and items. Grants a permanent multiplier.
-- Server-side only — client just sends a request.
-- DevForum pattern: rebirth is a prestige loop that extends retention.
----------------------------------------------------------------------------
local function handleRebirth(player: Player)
  -- Rate limit
  local now = tick()
  local lastTime = lastPurchaseTime[player.UserId] or 0
  if (now - lastTime) < RATE_LIMIT_COOLDOWN then return end
  lastPurchaseTime[player.UserId] = now

  local data = playerData[player.UserId]
  if not data then return end

  -- Must have minimum cash to rebirth
  if data.cash < REBIRTH_MIN_CASH then return end

  -- Reset progress
  data.cash = STARTING_CASH
  data.speedLevel = 0
  data.valueLevel = 0
  data.hasAutoCollect = false
  data.ownedItems = { "BasicDropper" }

  -- Grant rebirth bonus
  data.rebirths += 1

  -- Clean up existing plot items (except base structure)
  local plot = playerPlots[player.UserId]
  if plot then
    for _, child in plot:GetChildren() do
      -- Keep the base plot parts, remove placed items
      if child.Name ~= "Pad" and child.Name ~= "Conveyor"
        and child.Name ~= "Collector" and child.Name ~= "DropperPad"
        and child.Name ~= "UpgradeButtons" then
        child:Destroy()
      end
    end

    -- Re-place starter dropper
    placeItemOnPlot(plot, "BasicDropper")
  end

  syncPlayerUI(player)
end

RequestRebirthRemote.OnServerEvent:Connect(handleRebirth)

----------------------------------------------------------------------------
-- PLAYER JOIN / LEAVE
-- Join: load data, setup leaderstats, send initial UI state.
-- Leave: save data, clean up plot, release resources.
----------------------------------------------------------------------------
Players.PlayerAdded:Connect(function(player: Player)
  -- Load data first (may yield for DataStore)
  local data = loadPlayerData(player)
  playerData[player.UserId] = data

  -- Setup leaderstats (shows on built-in leaderboard)
  setupLeaderstats(player)
  syncPlayerUI(player)
end)

Players.PlayerRemoving:Connect(function(player: Player)
  local userId = player.UserId

  -- Save data
  savePlayerData(userId)

  -- Release plot
  local plot = playerPlots[userId]
  if plot then
    plotOwners[plot] = nil
    playerPlots[userId] = nil

    -- Reset plot visual
    local pad = plot:FindFirstChild("Pad")
    if pad and pad:IsA("BasePart") then
      pad.BrickColor = BrickColor.new("Medium stone grey")
      local label = pad:FindFirstChild("OwnerLabel")
      if label then label:Destroy() end
    end

    -- Clean up placed items
    for _, child in plot:GetChildren() do
      if child.Name ~= "Pad" and child.Name ~= "Conveyor"
        and child.Name ~= "Collector" and child.Name ~= "DropperPad"
        and child.Name ~= "UpgradeButtons" then
        child:Destroy()
      end
    end
  end

  -- Cancel dropper threads (they check playerData[userId] so they'll
  -- exit naturally, but we also clear references)
  playerDroppers[userId] = nil

  -- Clean up all state
  playerData[userId] = nil
  lastPurchaseTime[userId] = nil
end)

----------------------------------------------------------------------------
-- AUTO-SAVE
-- Periodic save for all online players.
-- DevForum best practice: save on interval AND on leave AND on BindToClose.
-- Belt and suspenders — if one fails, another catches it.
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
-- Critical: when the server shuts down, we get ~30 seconds to save.
-- DevForum: ALWAYS use BindToClose for DataStore games.
-- Without this, players lose progress on server shutdown/crash.
----------------------------------------------------------------------------
game:BindToClose(function()
  -- Save all players in parallel using task.spawn
  local saveThreads: { thread } = {}
  for userId, _ in playerData do
    local t = task.spawn(function()
      savePlayerData(userId)
    end)
    table.insert(saveThreads, t)
  end
  -- Wait a bit for saves to complete
  -- BindToClose gives us 30 seconds, but we don't need all of it
  task.wait(5)
end)

print("[Tycoon] Server script loaded successfully!")


--[[
  ============================================================================
  TYCOON GUI — LOCAL SCRIPT (StarterPlayerScripts or StarterGui)
  ============================================================================
  This script creates the tycoon shop UI and handles client-side display.
  ALL purchases go through RemoteEvents — client NEVER modifies currency.
  The server sends UpdateUI events with current state so the client
  can enable/disable buttons and show prices.
  ============================================================================
  NOTE: In production, place this as a LocalScript in StarterPlayerScripts
  or inside a ScreenGui in StarterGui.
  ============================================================================
--]]

--[[ LOCAL SCRIPT START — Place in StarterPlayerScripts ]]--

local Players_Client = game:GetService("Players")
local ReplicatedStorage_Client = game:GetService("ReplicatedStorage")

local player = Players_Client.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

-- Wait for remotes (server creates them)
local remotes = ReplicatedStorage_Client:WaitForChild("Remotes", 10)
if not remotes then
  warn("[TycoonUI] Remotes folder not found!")
  return
end

local PurchaseRemote = remotes:WaitForChild("PurchaseItem") :: RemoteEvent
local RebirthRemote = remotes:WaitForChild("RequestRebirth") :: RemoteEvent
local UpdateRemote = remotes:WaitForChild("UpdateUI") :: RemoteEvent
local ClaimRemote = remotes:WaitForChild("ClaimPlot") :: RemoteEvent

-- Current state from server
local currentState = {
  cash = 0,
  rebirths = 0,
  speedLevel = 0,
  valueLevel = 0,
  hasAutoCollect = false,
  ownedItems = {},
  rebirthMultiplier = 1,
}

----------------------------------------------------------------------------
-- GUI CREATION
-- Build the shop GUI entirely in code so there's no dependency on
-- pre-made GUI assets. In production you'd use a ScreenGui in StarterGui.
----------------------------------------------------------------------------
local screenGui = Instance.new("ScreenGui")
screenGui.Name = "TycoonShopGui"
screenGui.ResetOnSpawn = false -- persist across respawns
screenGui.Parent = playerGui

-- Shop toggle button (bottom right)
local toggleBtn = Instance.new("TextButton")
toggleBtn.Name = "ShopToggle"
toggleBtn.Size = UDim2.new(0, 120, 0, 40)
toggleBtn.Position = UDim2.new(1, -130, 1, -50)
toggleBtn.BackgroundColor3 = Color3.fromRGB(45, 45, 55)
toggleBtn.TextColor3 = Color3.fromRGB(255, 215, 0) -- gold
toggleBtn.Text = "Shop"
toggleBtn.Font = Enum.Font.GothamBold
toggleBtn.TextSize = 18
toggleBtn.Parent = screenGui

local uiCornerToggle = Instance.new("UICorner")
uiCornerToggle.CornerRadius = UDim.new(0, 8)
uiCornerToggle.Parent = toggleBtn

-- Shop frame (hidden by default)
local shopFrame = Instance.new("Frame")
shopFrame.Name = "ShopFrame"
shopFrame.Size = UDim2.new(0, 320, 0, 450)
shopFrame.Position = UDim2.new(0.5, -160, 0.5, -225)
shopFrame.BackgroundColor3 = Color3.fromRGB(30, 30, 40)
shopFrame.BorderSizePixel = 0
shopFrame.Visible = false
shopFrame.Parent = screenGui

local uiCornerShop = Instance.new("UICorner")
uiCornerShop.CornerRadius = UDim.new(0, 12)
uiCornerShop.Parent = shopFrame

-- Title bar
local titleBar = Instance.new("Frame")
titleBar.Name = "TitleBar"
titleBar.Size = UDim2.new(1, 0, 0, 40)
titleBar.BackgroundColor3 = Color3.fromRGB(40, 40, 55)
titleBar.BorderSizePixel = 0
titleBar.Parent = shopFrame

local titleCorner = Instance.new("UICorner")
titleCorner.CornerRadius = UDim.new(0, 12)
titleCorner.Parent = titleBar

local titleText = Instance.new("TextLabel")
titleText.Size = UDim2.new(0.7, 0, 1, 0)
titleText.Position = UDim2.new(0.05, 0, 0, 0)
titleText.BackgroundTransparency = 1
titleText.Text = "Tycoon Shop"
titleText.TextColor3 = Color3.fromRGB(255, 215, 0)
titleText.Font = Enum.Font.GothamBold
titleText.TextSize = 20
titleText.TextXAlignment = Enum.TextXAlignment.Left
titleText.Parent = titleBar

-- Cash display in title
local cashLabel = Instance.new("TextLabel")
cashLabel.Name = "CashLabel"
cashLabel.Size = UDim2.new(0.4, 0, 1, 0)
cashLabel.Position = UDim2.new(0.55, 0, 0, 0)
cashLabel.BackgroundTransparency = 1
cashLabel.Text = "$0"
cashLabel.TextColor3 = Color3.fromRGB(0, 255, 100)
cashLabel.Font = Enum.Font.GothamBold
cashLabel.TextSize = 18
cashLabel.TextXAlignment = Enum.TextXAlignment.Right
cashLabel.Parent = titleBar

-- Close button
local closeBtn = Instance.new("TextButton")
closeBtn.Size = UDim2.new(0, 30, 0, 30)
closeBtn.Position = UDim2.new(1, -35, 0, 5)
closeBtn.BackgroundColor3 = Color3.fromRGB(200, 50, 50)
closeBtn.Text = "X"
closeBtn.TextColor3 = Color3.new(1, 1, 1)
closeBtn.Font = Enum.Font.GothamBold
closeBtn.TextSize = 16
closeBtn.Parent = shopFrame

local closeCorner = Instance.new("UICorner")
closeCorner.CornerRadius = UDim.new(0, 6)
closeCorner.Parent = closeBtn

-- Scrolling frame for shop items
local scrollFrame = Instance.new("ScrollingFrame")
scrollFrame.Name = "ItemList"
scrollFrame.Size = UDim2.new(1, -20, 1, -50)
scrollFrame.Position = UDim2.new(0, 10, 0, 45)
scrollFrame.BackgroundTransparency = 1
scrollFrame.ScrollBarThickness = 4
scrollFrame.ScrollBarImageColor3 = Color3.fromRGB(255, 215, 0)
scrollFrame.CanvasSize = UDim2.new(0, 0, 0, 0) -- auto-sized
scrollFrame.Parent = shopFrame

local listLayout = Instance.new("UIListLayout")
listLayout.Padding = UDim.new(0, 6)
listLayout.SortOrder = Enum.SortOrder.LayoutOrder
listLayout.Parent = scrollFrame

-- Auto-resize canvas
listLayout:GetPropertyChangedSignal("AbsoluteContentSize"):Connect(function()
  scrollFrame.CanvasSize = UDim2.new(0, 0, 0, listLayout.AbsoluteContentSize.Y + 10)
end)

-- Helper: create a shop button row
local function createShopButton(
  name: string,
  displayText: string,
  price: string,
  order: number,
  callback: () -> ()
): TextButton
  local btn = Instance.new("TextButton")
  btn.Name = name
  btn.Size = UDim2.new(1, 0, 0, 50)
  btn.LayoutOrder = order
  btn.BackgroundColor3 = Color3.fromRGB(50, 50, 65)
  btn.Text = ""
  btn.AutoButtonColor = true
  btn.Parent = scrollFrame

  local btnCorner = Instance.new("UICorner")
  btnCorner.CornerRadius = UDim.new(0, 8)
  btnCorner.Parent = btn

  local nameLabel = Instance.new("TextLabel")
  nameLabel.Name = "ItemName"
  nameLabel.Size = UDim2.new(0.6, 0, 0.5, 0)
  nameLabel.Position = UDim2.new(0.03, 0, 0.05, 0)
  nameLabel.BackgroundTransparency = 1
  nameLabel.Text = displayText
  nameLabel.TextColor3 = Color3.new(1, 1, 1)
  nameLabel.Font = Enum.Font.GothamBold
  nameLabel.TextSize = 14
  nameLabel.TextXAlignment = Enum.TextXAlignment.Left
  nameLabel.Parent = btn

  local priceLabel = Instance.new("TextLabel")
  priceLabel.Name = "Price"
  priceLabel.Size = UDim2.new(0.35, 0, 0.5, 0)
  priceLabel.Position = UDim2.new(0.62, 0, 0.05, 0)
  priceLabel.BackgroundTransparency = 1
  priceLabel.Text = price
  priceLabel.TextColor3 = Color3.fromRGB(0, 255, 100)
  priceLabel.Font = Enum.Font.GothamBold
  priceLabel.TextSize = 14
  priceLabel.TextXAlignment = Enum.TextXAlignment.Right
  priceLabel.Parent = btn

  local statusLabel = Instance.new("TextLabel")
  statusLabel.Name = "Status"
  statusLabel.Size = UDim2.new(0.94, 0, 0.4, 0)
  statusLabel.Position = UDim2.new(0.03, 0, 0.55, 0)
  statusLabel.BackgroundTransparency = 1
  statusLabel.Text = ""
  statusLabel.TextColor3 = Color3.fromRGB(180, 180, 180)
  statusLabel.Font = Enum.Font.Gotham
  statusLabel.TextSize = 12
  statusLabel.TextXAlignment = Enum.TextXAlignment.Left
  statusLabel.Parent = btn

  btn.MouseButton1Click:Connect(callback)

  return btn
end

-- Create shop buttons
-- Items
createShopButton("BuySpeedDropper", "Speed Dropper", "$5,000", 1, function()
  PurchaseRemote:FireServer("SpeedDropper")
end)

createShopButton("BuyValueDropper", "Value Dropper", "$20,000", 2, function()
  PurchaseRemote:FireServer("ValueDropper")
end)

-- Upgrades
createShopButton("BuySpeedUpgrade", "Speed Upgrade", "See level", 3, function()
  PurchaseRemote:FireServer("SpeedUpgrade")
end)

createShopButton("BuyValueUpgrade", "Value Upgrade", "See level", 4, function()
  PurchaseRemote:FireServer("ValueUpgrade")
end)

createShopButton("BuyAutoCollect", "Auto Collector", "$10,000", 5, function()
  PurchaseRemote:FireServer("AutoCollect")
end)

-- Rebirth button (special styling)
local rebirthBtn = createShopButton("Rebirth", "REBIRTH", "$100,000 min", 10, function()
  RebirthRemote:FireServer()
end)
rebirthBtn.BackgroundColor3 = Color3.fromRGB(80, 40, 80)

-- Rebirth info
local rebirthInfo = Instance.new("TextLabel")
rebirthInfo.Name = "RebirthInfo"
rebirthInfo.Size = UDim2.new(1, 0, 0, 30)
rebirthInfo.LayoutOrder = 11
rebirthInfo.BackgroundTransparency = 1
rebirthInfo.Text = "Rebirth resets progress for +50% multiplier"
rebirthInfo.TextColor3 = Color3.fromRGB(200, 150, 255)
rebirthInfo.Font = Enum.Font.GothamBold
rebirthInfo.TextSize = 11
rebirthInfo.TextWrapped = true
rebirthInfo.Parent = scrollFrame

----------------------------------------------------------------------------
-- UI UPDATE HANDLER
-- Server fires UpdateUI with the player's current state.
-- We use this to refresh prices, enable/disable buttons, show owned status.
----------------------------------------------------------------------------
local speedCosts = { 500, 1500, 5000, 15000, 50000 }
local valueCosts = { 750, 2500, 8000, 25000, 75000 }

local function updateShopUI(state: { [string]: any })
  currentState = state

  -- Update cash display
  cashLabel.Text = "$" .. tostring(math.floor(state.cash or 0))

  -- Update speed upgrade button
  local speedBtn = scrollFrame:FindFirstChild("BuySpeedUpgrade")
  if speedBtn then
    local lvl = state.speedLevel or 0
    local statusLbl = speedBtn:FindFirstChild("Status") :: TextLabel
    local priceLbl = speedBtn:FindFirstChild("Price") :: TextLabel
    if lvl >= #speedCosts then
      if statusLbl then statusLbl.Text = "MAX LEVEL" end
      if priceLbl then priceLbl.Text = "MAXED" end
      speedBtn.BackgroundColor3 = Color3.fromRGB(30, 60, 30)
    else
      local nextCost = speedCosts[lvl + 1]
      if statusLbl then statusLbl.Text = "Level " .. tostring(lvl) .. " / " .. tostring(#speedCosts) end
      if priceLbl then priceLbl.Text = "$" .. tostring(nextCost) end
      if state.cash >= nextCost then
        speedBtn.BackgroundColor3 = Color3.fromRGB(50, 70, 50)
      else
        speedBtn.BackgroundColor3 = Color3.fromRGB(50, 50, 65)
      end
    end
  end

  -- Update value upgrade button
  local valueBtn = scrollFrame:FindFirstChild("BuyValueUpgrade")
  if valueBtn then
    local lvl = state.valueLevel or 0
    local statusLbl = valueBtn:FindFirstChild("Status") :: TextLabel
    local priceLbl = valueBtn:FindFirstChild("Price") :: TextLabel
    if lvl >= #valueCosts then
      if statusLbl then statusLbl.Text = "MAX LEVEL" end
      if priceLbl then priceLbl.Text = "MAXED" end
      valueBtn.BackgroundColor3 = Color3.fromRGB(30, 60, 30)
    else
      local nextCost = valueCosts[lvl + 1]
      if statusLbl then statusLbl.Text = "Level " .. tostring(lvl) .. " / " .. tostring(#valueCosts) end
      if priceLbl then priceLbl.Text = "$" .. tostring(nextCost) end
      if state.cash >= nextCost then
        valueBtn.BackgroundColor3 = Color3.fromRGB(50, 70, 50)
      else
        valueBtn.BackgroundColor3 = Color3.fromRGB(50, 50, 65)
      end
    end
  end

  -- Update auto-collect button
  local autoBtn = scrollFrame:FindFirstChild("BuyAutoCollect")
  if autoBtn then
    local statusLbl = autoBtn:FindFirstChild("Status") :: TextLabel
    if state.hasAutoCollect then
      if statusLbl then statusLbl.Text = "OWNED" end
      autoBtn.BackgroundColor3 = Color3.fromRGB(30, 60, 30)
    else
      if statusLbl then statusLbl.Text = "Automatically collects resources" end
      if state.cash >= 10000 then
        autoBtn.BackgroundColor3 = Color3.fromRGB(50, 70, 50)
      else
        autoBtn.BackgroundColor3 = Color3.fromRGB(50, 50, 65)
      end
    end
  end

  -- Update item buttons (owned status)
  local ownedSet = {}
  for _, id in (state.ownedItems or {}) do
    ownedSet[id] = true
  end

  for _, btnName in { "BuySpeedDropper", "BuyValueDropper" } do
    local btn = scrollFrame:FindFirstChild(btnName)
    if btn then
      local itemId = btnName:gsub("Buy", "")
      local statusLbl = btn:FindFirstChild("Status") :: TextLabel
      if ownedSet[itemId] then
        if statusLbl then statusLbl.Text = "OWNED" end
        btn.BackgroundColor3 = Color3.fromRGB(30, 60, 30)
      end
    end
  end

  -- Update rebirth button
  local rbBtn = scrollFrame:FindFirstChild("Rebirth")
  if rbBtn then
    local statusLbl = rbBtn:FindFirstChild("Status") :: TextLabel
    if statusLbl then
      statusLbl.Text = "Rebirths: " .. tostring(state.rebirths or 0) .. " | Mult: " .. string.format("%.1fx", state.rebirthMultiplier or 1)
    end
    if state.cash >= 100000 then
      rbBtn.BackgroundColor3 = Color3.fromRGB(100, 50, 100)
    else
      rbBtn.BackgroundColor3 = Color3.fromRGB(80, 40, 80)
    end
  end
end

UpdateRemote.OnClientEvent:Connect(function(state: any)
  if type(state) ~= "table" then return end
  updateShopUI(state)
end)

-- Toggle shop visibility
local shopOpen = false
toggleBtn.MouseButton1Click:Connect(function()
  shopOpen = not shopOpen
  shopFrame.Visible = shopOpen
end)

closeBtn.MouseButton1Click:Connect(function()
  shopOpen = false
  shopFrame.Visible = false
end)

print("[TycoonUI] Client GUI loaded!")
--[[ LOCAL SCRIPT END ]]--
`;
}
