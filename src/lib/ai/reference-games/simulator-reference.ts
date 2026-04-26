/**
 * Production-quality reference simulator game.
 * Returns complete, working Luau code following real DevForum best practices.
 * Hub-based simulator with collection zones, pets, backpack, rebirth.
 */
export function simulatorReferenceCode(): string {
  return `--[[
  ============================================================================
  COMPLETE SIMULATOR GAME — SERVER SCRIPT (ServerScriptService)
  ============================================================================
  Architecture:
    - Hub area with paths branching to 3 collection zones
    - Click-to-collect orbs in each zone (ClickDetector, server-validated)
    - Backpack capacity system (fill up, must sell at hub)
    - Zone unlock gates with ProximityPrompt + price check
    - Pet following system using AlignPosition (physics-based, replicates)
    - Rebirth for permanent multiplier
    - DataStore with pcall + retry + BindToClose

  Folder Structure Expected:
    Workspace/
      Hub/
        SellPad (Part — touch to sell backpack contents)
        PetSpawner (Part — where pets appear)
      Zones/
        Zone1/ (free zone)
          Orbs/ (folder of clickable Part orbs)
        Zone2/ (costs 1000 to unlock)
          Gate (Part with ProximityPrompt)
          Orbs/
        Zone3/ (costs 10000 to unlock)
          Gate (Part with ProximityPrompt)
          Orbs/
    ServerStorage/
      Pets/
        BasicPet (Model with PrimaryPart)
        SpeedPet (Model)
        MagnetPet (Model)
    ReplicatedStorage/
      Remotes/ (created by this script if missing)
  ============================================================================
--]]

-- Services
-- Grab all at top level to avoid repeated GetService calls in hot paths.
local Players = game:GetService("Players")
local ServerStorage = game:GetService("ServerStorage")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local DataStoreService = game:GetService("DataStoreService")
local Debris = game:GetService("Debris")

----------------------------------------------------------------------------
-- CONSTANTS
-- All tuning in one place for easy designer iteration.
----------------------------------------------------------------------------
local CURRENCY_NAME = "Coins"
local BACKPACK_NAME = "Backpack"
local STARTING_COINS = 0
local STARTING_CAPACITY = 50
local SAVE_INTERVAL = 60
local DATASTORE_KEY_PREFIX = "SimV1_"
local ORB_RESPAWN_TIME = 5 -- seconds before a collected orb reappears
local RATE_LIMIT = 0.15 -- min seconds between click events

-- Zone definitions: name -> { orbValue, unlockCost, capacityBonus }
-- orbValue is base value per click. Higher zones = more valuable orbs.
local ZONE_CONFIG: { [string]: { orbValue: number, unlockCost: number, capacityBonus: number } } = {
  Zone1 = { orbValue = 1, unlockCost = 0, capacityBonus = 0 },
  Zone2 = { orbValue = 5, unlockCost = 1000, capacityBonus = 25 },
  Zone3 = { orbValue = 25, unlockCost = 10000, capacityBonus = 75 },
}

-- Backpack capacity upgrades: level -> { cost, newCapacity }
local CAPACITY_UPGRADES = {
  { cost = 500, capacity = 100 },
  { cost = 2000, capacity = 200 },
  { cost = 8000, capacity = 500 },
  { cost = 25000, capacity = 1000 },
  { cost = 100000, capacity = 2500 },
}

-- Pet config: petId -> { cost, collectRadius, collectRate, speedBoost }
local PET_CONFIG: { [string]: { cost: number, collectRadius: number, collectRate: number, speedBoost: number } } = {
  BasicPet = { cost = 500, collectRadius = 0, collectRate = 0, speedBoost = 0 },
  SpeedPet = { cost = 5000, collectRadius = 0, collectRate = 0, speedBoost = 8 },
  MagnetPet = { cost = 20000, collectRadius = 15, collectRate = 1, speedBoost = 0 },
}

-- Rebirth config
local REBIRTH_MIN_COINS = 50000
local REBIRTH_MULTIPLIER_BONUS = 0.25 -- +25% per rebirth

----------------------------------------------------------------------------
-- REMOTES
-- Server creates all remotes so they exist before clients connect.
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

local CollectOrbRemote = getOrCreateRemote("CollectOrb", "RemoteEvent") :: RemoteEvent
local SellRemote = getOrCreateRemote("SellBackpack", "RemoteEvent") :: RemoteEvent
local UnlockZoneRemote = getOrCreateRemote("UnlockZone", "RemoteEvent") :: RemoteEvent
local BuyPetRemote = getOrCreateRemote("BuyPet", "RemoteEvent") :: RemoteEvent
local UpgradeCapacityRemote = getOrCreateRemote("UpgradeCapacity", "RemoteEvent") :: RemoteEvent
local RequestRebirthRemote = getOrCreateRemote("RequestRebirth", "RemoteEvent") :: RemoteEvent
local UpdateUIRemote = getOrCreateRemote("UpdateUI", "RemoteEvent") :: RemoteEvent

----------------------------------------------------------------------------
-- DATASTORE
-- pcall every DataStore call. Retry once on failure.
----------------------------------------------------------------------------
local simStore: DataStore? = nil
do
  local ok, store = pcall(function()
    return DataStoreService:GetDataStore("SimulatorSaveData")
  end)
  if ok then
    simStore = store
  else
    warn("[Simulator] DataStore unavailable:", store)
  end
end

-- Player data shape. Every field has a default to prevent nil indexing.
type PlayerData = {
  coins: number,
  backpack: number, -- current items in backpack
  backpackCapacity: number,
  capacityLevel: number,
  rebirths: number,
  unlockedZones: { string },
  equippedPet: string?,
  ownedPets: { string },
}

local DEFAULT_DATA: PlayerData = {
  coins = STARTING_COINS,
  backpack = 0,
  backpackCapacity = STARTING_CAPACITY,
  capacityLevel = 0,
  rebirths = 0,
  unlockedZones = { "Zone1" }, -- Zone1 is free
  equippedPet = nil,
  ownedPets = {},
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
----------------------------------------------------------------------------
local playerData: { [number]: PlayerData } = {}
local playerPets: { [number]: Model? } = {} -- active pet model in workspace
local lastClickTime: { [number]: number } = {} -- rate limiting per player

----------------------------------------------------------------------------
-- DATA LOAD / SAVE
-- pcall with single retry. DevForum consensus: don't infinite-loop retries.
----------------------------------------------------------------------------
local function loadPlayerData(player: Player): PlayerData
  local data = deepCopy(DEFAULT_DATA)
  if not simStore then return data end

  local key = DATASTORE_KEY_PREFIX .. tostring(player.UserId)
  local success, result = pcall(function()
    return (simStore :: DataStore):GetAsync(key)
  end)

  if success and result then
    -- Merge with defaults so new fields added in updates get default values.
    for k, v in result :: any do
      if (data :: any)[k] ~= nil then
        (data :: any)[k] = v
      end
    end
  elseif not success then
    warn("[Simulator] Load failed for", player.Name, ":", result)
    task.wait(1)
    local ok2, res2 = pcall(function()
      return (simStore :: DataStore):GetAsync(key)
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
  if not simStore then return false end
  local data = playerData[userId]
  if not data then return false end

  local key = DATASTORE_KEY_PREFIX .. tostring(userId)
  local success, err = pcall(function()
    (simStore :: DataStore):SetAsync(key, data)
  end)

  if not success then
    warn("[Simulator] Save failed for userId", userId, ":", err)
    task.wait(0.5)
    local ok2, err2 = pcall(function()
      (simStore :: DataStore):SetAsync(key, data)
    end)
    if not ok2 then
      warn("[Simulator] Retry save failed:", err2)
      return false
    end
  end

  return true
end

----------------------------------------------------------------------------
-- LEADERSTATS
-- IntValue under player.leaderstats for built-in leaderboard display.
----------------------------------------------------------------------------
local function setupLeaderstats(player: Player)
  local leaderstats = Instance.new("Folder")
  leaderstats.Name = "leaderstats"
  leaderstats.Parent = player

  local coinsVal = Instance.new("IntValue")
  coinsVal.Name = CURRENCY_NAME
  coinsVal.Value = 0
  coinsVal.Parent = leaderstats

  local bpVal = Instance.new("IntValue")
  bpVal.Name = BACKPACK_NAME
  bpVal.Value = 0
  bpVal.Parent = leaderstats
end

local function syncPlayerUI(player: Player)
  local data = playerData[player.UserId]
  if not data then return end

  local leaderstats = player:FindFirstChild("leaderstats")
  if leaderstats then
    local coinsVal = leaderstats:FindFirstChild(CURRENCY_NAME)
    if coinsVal and coinsVal:IsA("IntValue") then
      coinsVal.Value = math.floor(data.coins)
    end
    local bpVal = leaderstats:FindFirstChild(BACKPACK_NAME)
    if bpVal and bpVal:IsA("IntValue") then
      bpVal.Value = data.backpack
    end
  end

  UpdateUIRemote:FireClient(player, {
    coins = data.coins,
    backpack = data.backpack,
    backpackCapacity = data.backpackCapacity,
    capacityLevel = data.capacityLevel,
    rebirths = data.rebirths,
    unlockedZones = data.unlockedZones,
    equippedPet = data.equippedPet,
    ownedPets = data.ownedPets,
    rebirthMultiplier = 1 + (data.rebirths * REBIRTH_MULTIPLIER_BONUS),
  })
end

----------------------------------------------------------------------------
-- MULTIPLIER HELPER
-- Rebirth multiplier applies to all collection.
----------------------------------------------------------------------------
local function getMultiplier(data: PlayerData): number
  return 1 + (data.rebirths * REBIRTH_MULTIPLIER_BONUS)
end

----------------------------------------------------------------------------
-- ZONE HELPERS
-- Check if a player has unlocked a specific zone.
----------------------------------------------------------------------------
local function hasUnlockedZone(data: PlayerData, zoneName: string): boolean
  for _, z in data.unlockedZones do
    if z == zoneName then return true end
  end
  return false
end

----------------------------------------------------------------------------
-- ORB COLLECTION SYSTEM
-- Server validates every click. Client sends the orb instance reference.
-- ClickDetector fires OnServerEvent so we know which orb was clicked.
-- We disable the orb briefly then re-enable after respawn timer.
----------------------------------------------------------------------------
local zonesFolder = workspace:FindFirstChild("Zones")

-- Track which orbs are currently "collected" (cooling down)
local orbCooldowns: { [BasePart]: boolean } = {}

local function setupOrbs()
  if not zonesFolder then
    warn("[Simulator] Workspace/Zones folder not found!")
    return
  end

  for _, zone in zonesFolder:GetChildren() do
    if not zone:IsA("Model") and not zone:IsA("Folder") then continue end

    local zoneName = zone.Name
    local config = ZONE_CONFIG[zoneName]
    if not config then continue end

    local orbsFolder = zone:FindFirstChild("Orbs")
    if not orbsFolder then continue end

    for _, orb in orbsFolder:GetChildren() do
      if not orb:IsA("BasePart") then continue end

      -- Material variety per zone — never SmoothPlastic.
      -- Zone1 = Neon (glowing collectibles), Zone2 = Glass, Zone3 = ForceField
      if zoneName == "Zone1" then
        orb.Material = Enum.Material.Neon
        orb.BrickColor = BrickColor.new("Bright green")
      elseif zoneName == "Zone2" then
        orb.Material = Enum.Material.Glass
        orb.BrickColor = BrickColor.new("Bright blue")
      else
        orb.Material = Enum.Material.ForceField
        orb.BrickColor = BrickColor.new("Bright violet")
      end

      -- ClickDetector with MaxActivationDistance so players must be nearby.
      -- This prevents teleport-exploit collection from across the map.
      local clickDetector = orb:FindFirstChildOfClass("ClickDetector")
      if not clickDetector then
        clickDetector = Instance.new("ClickDetector")
        clickDetector.MaxActivationDistance = 15
        clickDetector.Parent = orb
      end

      clickDetector.MouseClick:Connect(function(player: Player)
        -- Rate limit: prevent autoclicker exploits
        local now = tick()
        local last = lastClickTime[player.UserId] or 0
        if (now - last) < RATE_LIMIT then return end
        lastClickTime[player.UserId] = now

        -- Check orb cooldown (already collected, respawning)
        if orbCooldowns[orb] then return end

        local data = playerData[player.UserId]
        if not data then return end

        -- Zone unlock check: prevent collecting in locked zones
        if not hasUnlockedZone(data, zoneName) then return end

        -- Backpack full check
        if data.backpack >= data.backpackCapacity then return end

        -- Collect: add to backpack (NOT directly to coins — must sell first)
        -- This is the core simulator loop: collect -> sell -> upgrade -> repeat.
        local value = config.orbValue * getMultiplier(data)
        data.backpack += math.floor(value)

        -- Clamp to capacity
        if data.backpack > data.backpackCapacity then
          data.backpack = data.backpackCapacity
        end

        -- Visual feedback: hide the orb temporarily
        orbCooldowns[orb] = true
        orb.Transparency = 1
        if clickDetector then
          clickDetector.MaxActivationDistance = 0
        end

        syncPlayerUI(player)

        -- Respawn orb after cooldown
        task.delay(ORB_RESPAWN_TIME, function()
          orbCooldowns[orb] = nil
          orb.Transparency = 0
          if clickDetector then
            clickDetector.MaxActivationDistance = 15
          end
        end)
      end)
    end
  end
end

setupOrbs()

----------------------------------------------------------------------------
-- SELL PAD
-- Player touches the sell pad in Hub to convert backpack items into coins.
-- Touched event with debounce to prevent multiple sells per touch.
----------------------------------------------------------------------------
local hubFolder = workspace:FindFirstChild("Hub")
local sellDebounce: { [number]: boolean } = {}

if hubFolder then
  local sellPad = hubFolder:FindFirstChild("SellPad")
  if sellPad and sellPad:IsA("BasePart") then
    -- Visual: make the sell pad stand out
    sellPad.Material = Enum.Material.Neon
    sellPad.BrickColor = BrickColor.new("Bright yellow")

    -- BillboardGui label so players know what this pad does
    local billboard = Instance.new("BillboardGui")
    billboard.Size = UDim2.new(5, 0, 1.5, 0)
    billboard.StudsOffset = Vector3.new(0, 4, 0)
    billboard.Parent = sellPad

    local label = Instance.new("TextLabel")
    label.Size = UDim2.new(1, 0, 1, 0)
    label.BackgroundTransparency = 1
    label.Text = "SELL HERE"
    label.TextColor3 = Color3.fromRGB(255, 215, 0)
    label.TextStrokeTransparency = 0
    label.TextScaled = true
    label.Font = Enum.Font.GothamBold
    label.Parent = billboard

    sellPad.Touched:Connect(function(hit: BasePart)
      local character = hit.Parent
      if not character then return end
      local player = Players:GetPlayerFromCharacter(character)
      if not player then return end

      -- Debounce: one sell per touch event
      if sellDebounce[player.UserId] then return end
      sellDebounce[player.UserId] = true

      local data = playerData[player.UserId]
      if data and data.backpack > 0 then
        -- Convert backpack to coins
        data.coins += data.backpack
        data.backpack = 0
        syncPlayerUI(player)
      end

      task.delay(0.5, function()
        sellDebounce[player.UserId] = nil
      end)
    end)
  end
end

-- Also allow selling via remote (for GUI button)
SellRemote.OnServerEvent:Connect(function(player: Player)
  local data = playerData[player.UserId]
  if not data then return end
  if data.backpack <= 0 then return end

  data.coins += data.backpack
  data.backpack = 0
  syncPlayerUI(player)
end)

----------------------------------------------------------------------------
-- ZONE UNLOCK GATES
-- ProximityPrompt on gate parts. Server checks if player has enough coins.
-- Once unlocked, the gate becomes transparent and non-collidable.
----------------------------------------------------------------------------
local function setupZoneGates()
  if not zonesFolder then return end

  for _, zone in zonesFolder:GetChildren() do
    local zoneName = zone.Name
    local config = ZONE_CONFIG[zoneName]
    if not config or config.unlockCost == 0 then continue end -- skip free zones

    local gate = zone:FindFirstChild("Gate")
    if not gate or not gate:IsA("BasePart") then continue end

    -- Material for gate: Concrete barrier look (never SmoothPlastic)
    gate.Material = Enum.Material.Concrete
    gate.BrickColor = BrickColor.new("Dark stone grey")

    -- Price tag billboard on the gate
    local billboard = Instance.new("BillboardGui")
    billboard.Name = "PriceTag"
    billboard.Size = UDim2.new(4, 0, 1.5, 0)
    billboard.StudsOffset = Vector3.new(0, 3, 0)
    billboard.Parent = gate

    local priceLabel = Instance.new("TextLabel")
    priceLabel.Size = UDim2.new(1, 0, 1, 0)
    priceLabel.BackgroundTransparency = 1
    priceLabel.Text = zoneName .. " — " .. tostring(config.unlockCost) .. " Coins"
    priceLabel.TextColor3 = Color3.fromRGB(255, 100, 100)
    priceLabel.TextStrokeTransparency = 0
    priceLabel.TextScaled = true
    priceLabel.Font = Enum.Font.GothamBold
    priceLabel.Parent = billboard

    -- ProximityPrompt for purchasing unlock
    local prompt = gate:FindFirstChildOfClass("ProximityPrompt")
    if not prompt then
      prompt = Instance.new("ProximityPrompt")
      prompt.ActionText = "Unlock " .. zoneName
      prompt.ObjectText = tostring(config.unlockCost) .. " Coins"
      prompt.HoldDuration = 0.5
      prompt.MaxActivationDistance = 10
      prompt.Parent = gate
    end

    prompt.Triggered:Connect(function(player: Player)
      local data = playerData[player.UserId]
      if not data then return end

      -- Already unlocked?
      if hasUnlockedZone(data, zoneName) then return end

      -- Enough coins?
      if data.coins < config.unlockCost then return end

      -- Deduct and unlock
      data.coins -= config.unlockCost
      table.insert(data.unlockedZones, zoneName)

      -- Capacity bonus for unlocking higher zones
      data.backpackCapacity += config.capacityBonus

      -- Visual: open the gate for this player (make transparent + no collide)
      -- In production you'd use CollectionService tags for per-player visibility.
      -- For simplicity, we open the gate for everyone once anyone buys it.
      gate.Transparency = 0.8
      gate.CanCollide = false

      -- Update price tag to show "UNLOCKED"
      local tag = gate:FindFirstChild("PriceTag")
      if tag then
        local lbl = tag:FindFirstChildOfClass("TextLabel")
        if lbl then
          lbl.Text = zoneName .. " — UNLOCKED"
          lbl.TextColor3 = Color3.fromRGB(0, 255, 100)
        end
      end

      -- Remove the prompt since it's now open
      prompt:Destroy()

      syncPlayerUI(player)
    end)
  end
end

setupZoneGates()

-- Remote-based zone unlock (for GUI purchase)
UnlockZoneRemote.OnServerEvent:Connect(function(player: Player, zoneName: unknown)
  if type(zoneName) ~= "string" then return end
  local zoneStr = zoneName :: string

  local config = ZONE_CONFIG[zoneStr]
  if not config then return end

  local data = playerData[player.UserId]
  if not data then return end
  if hasUnlockedZone(data, zoneStr) then return end
  if data.coins < config.unlockCost then return end

  data.coins -= config.unlockCost
  table.insert(data.unlockedZones, zoneStr)
  data.backpackCapacity += config.capacityBonus
  syncPlayerUI(player)
end)

----------------------------------------------------------------------------
-- PET SYSTEM
-- Pets follow the player using AlignPosition (physics-based, replicates).
-- AlignPosition is better than CFrame updates because it uses the physics
-- engine which handles replication automatically. CFrame updates would need
-- manual network sync and look jittery on other clients.
----------------------------------------------------------------------------
local function destroyActivePet(userId: number)
  local existing = playerPets[userId]
  if existing and existing.Parent then
    existing:Destroy()
  end
  playerPets[userId] = nil
end

local function spawnPet(player: Player, petId: string)
  local character = player.Character
  if not character then return end
  local humanoidRootPart = character:FindFirstChild("HumanoidRootPart")
  if not humanoidRootPart or not humanoidRootPart:IsA("BasePart") then return end

  -- Destroy any existing pet first
  destroyActivePet(player.UserId)

  -- Clone from ServerStorage
  local petsFolder = ServerStorage:FindFirstChild("Pets")
  if not petsFolder then return end
  local template = petsFolder:FindFirstChild(petId)
  if not template then return end

  local pet = template:Clone()
  pet.Name = player.Name .. "_Pet"

  -- Position behind and above the player
  local spawnCFrame = humanoidRootPart.CFrame * CFrame.new(3, 2, 3)

  if pet:IsA("Model") and pet.PrimaryPart then
    pet:PivotTo(spawnCFrame)

    -- Make the pet float using AlignPosition.
    -- AlignPosition continuously moves the part toward a target position
    -- with spring-like physics. This creates smooth, natural following.
    local attachment0 = Instance.new("Attachment")
    attachment0.Parent = pet.PrimaryPart

    local attachment1 = Instance.new("Attachment")
    attachment1.Parent = humanoidRootPart

    -- Offset the target so pet floats beside/behind the player
    attachment1.Position = Vector3.new(3, 2, 3)

    local alignPos = Instance.new("AlignPosition")
    alignPos.MaxForce = 10000
    alignPos.Responsiveness = 10 -- how quickly it follows (higher = snappier)
    alignPos.Attachment0 = attachment0
    alignPos.Attachment1 = attachment1
    alignPos.Parent = pet.PrimaryPart

    -- AlignOrientation so pet faces the same direction as player
    local alignOri = Instance.new("AlignOrientation")
    alignOri.MaxTorque = 10000
    alignOri.Responsiveness = 8
    alignOri.Attachment0 = attachment0
    alignOri.Attachment1 = attachment1
    alignOri.Parent = pet.PrimaryPart

    -- Make pet parts non-collidable so it doesn't push the player around
    for _, part in pet:GetDescendants() do
      if part:IsA("BasePart") then
        part.CanCollide = false
        -- Never SmoothPlastic — use Neon for pets so they glow
        part.Material = Enum.Material.Neon
      end
    end
  end

  pet.Parent = workspace
  playerPets[player.UserId] = pet

  -- Magnet pet: auto-collect nearby orbs on a timer
  local petConfig = PET_CONFIG[petId]
  if petConfig and petConfig.collectRadius > 0 then
    task.spawn(function()
      while playerPets[player.UserId] == pet and pet.Parent do
        local data = playerData[player.UserId]
        if not data then break end
        if data.backpack >= data.backpackCapacity then
          task.wait(1)
          continue
        end

        -- Find nearby orbs and auto-collect them
        if zonesFolder then
          for _, zone in zonesFolder:GetChildren() do
            local zoneName = zone.Name
            if not hasUnlockedZone(data, zoneName) then continue end
            local config = ZONE_CONFIG[zoneName]
            if not config then continue end

            local orbsFolder = zone:FindFirstChild("Orbs")
            if not orbsFolder then continue end

            for _, orb in orbsFolder:GetChildren() do
              if not orb:IsA("BasePart") then continue end
              if orbCooldowns[orb] then continue end

              local petPart = pet.PrimaryPart
              if not petPart then continue end

              local dist = (orb.Position - petPart.Position).Magnitude
              if dist <= petConfig.collectRadius then
                -- Auto-collect this orb
                local value = config.orbValue * getMultiplier(data)
                data.backpack += math.floor(value)
                if data.backpack > data.backpackCapacity then
                  data.backpack = data.backpackCapacity
                end

                orbCooldowns[orb] = true
                orb.Transparency = 1
                local cd = orb:FindFirstChildOfClass("ClickDetector")
                if cd then cd.MaxActivationDistance = 0 end

                task.delay(ORB_RESPAWN_TIME, function()
                  orbCooldowns[orb] = nil
                  orb.Transparency = 0
                  if cd then cd.MaxActivationDistance = 15 end
                end)
              end
            end
          end
        end

        syncPlayerUI(player)
        task.wait(petConfig.collectRate)
      end
    end)
  end

  -- Speed pet: boost walkspeed
  if petConfig and petConfig.speedBoost > 0 then
    local humanoid = character:FindFirstChildOfClass("Humanoid")
    if humanoid then
      humanoid.WalkSpeed = 16 + petConfig.speedBoost
    end
  end
end

-- Buy pet remote
BuyPetRemote.OnServerEvent:Connect(function(player: Player, petId: unknown)
  if type(petId) ~= "string" then return end
  local petStr = petId :: string

  local config = PET_CONFIG[petStr]
  if not config then return end

  local data = playerData[player.UserId]
  if not data then return end

  -- Check if already owned
  for _, owned in data.ownedPets do
    if owned == petStr then
      -- Already owned — just equip it
      data.equippedPet = petStr
      spawnPet(player, petStr)
      syncPlayerUI(player)
      return
    end
  end

  -- Purchase
  if data.coins < config.cost then return end
  data.coins -= config.cost
  table.insert(data.ownedPets, petStr)
  data.equippedPet = petStr
  spawnPet(player, petStr)
  syncPlayerUI(player)
end)

----------------------------------------------------------------------------
-- CAPACITY UPGRADE
-- Exponential cost curve keeps players grinding. Each level increases
-- max backpack size so they can collect more before selling.
----------------------------------------------------------------------------
UpgradeCapacityRemote.OnServerEvent:Connect(function(player: Player)
  local data = playerData[player.UserId]
  if not data then return end

  local nextLevel = data.capacityLevel + 1
  if nextLevel > #CAPACITY_UPGRADES then return end -- max level

  local upgrade = CAPACITY_UPGRADES[nextLevel]
  if data.coins < upgrade.cost then return end

  data.coins -= upgrade.cost
  data.capacityLevel = nextLevel
  data.backpackCapacity = upgrade.capacity
  syncPlayerUI(player)
end)

----------------------------------------------------------------------------
-- REBIRTH SYSTEM
-- Resets coins, backpack, upgrades, zone unlocks. Keeps pets.
-- Grants permanent collection multiplier.
----------------------------------------------------------------------------
RequestRebirthRemote.OnServerEvent:Connect(function(player: Player)
  local data = playerData[player.UserId]
  if not data then return end
  if data.coins < REBIRTH_MIN_COINS then return end

  -- Reset progress (keep pets and rebirths)
  local savedPets = data.ownedPets
  local savedEquipped = data.equippedPet
  local newRebirths = data.rebirths + 1

  -- Reset to defaults
  data.coins = STARTING_COINS
  data.backpack = 0
  data.backpackCapacity = STARTING_CAPACITY
  data.capacityLevel = 0
  data.unlockedZones = { "Zone1" }
  data.rebirths = newRebirths
  data.ownedPets = savedPets
  data.equippedPet = savedEquipped

  syncPlayerUI(player)
end)

----------------------------------------------------------------------------
-- PLAYER JOIN / LEAVE
----------------------------------------------------------------------------
Players.PlayerAdded:Connect(function(player: Player)
  local data = loadPlayerData(player)
  playerData[player.UserId] = data

  setupLeaderstats(player)
  syncPlayerUI(player)

  -- Spawn equipped pet when character loads
  player.CharacterAdded:Connect(function()
    task.wait(1) -- wait for character to fully load
    if data.equippedPet then
      spawnPet(player, data.equippedPet)
    end
  end)

  -- If character already exists (late join), spawn pet now
  if player.Character and data.equippedPet then
    spawnPet(player, data.equippedPet)
  end
end)

Players.PlayerRemoving:Connect(function(player: Player)
  local userId = player.UserId

  savePlayerData(userId)
  destroyActivePet(userId)

  playerData[userId] = nil
  lastClickTime[userId] = nil
  sellDebounce[userId] = nil
end)

----------------------------------------------------------------------------
-- AUTO-SAVE (periodic)
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
-- Save all players when server shuts down. Critical for data persistence.
----------------------------------------------------------------------------
game:BindToClose(function()
  for userId, _ in playerData do
    task.spawn(function()
      savePlayerData(userId)
    end)
  end
  task.wait(5)
end)

print("[Simulator] Server script loaded successfully!")
`;
}
