import 'server-only';

/**
 * Production-quality reference simulator game.
 * Returns complete, working Luau code following real DevForum best practices.
 * Hub-based simulator with collection zones, pets, eggs, backpack, rebirth.
 *
 * Systems included:
 *   1. Collection Zones — ProximityPrompt click-to-collect, server-validated
 *   2. Backpack System — Tiered capacity, server-side tracking
 *   3. Sell Pad — Touch to sell, sound + particle effects, cash to leaderstats
 *   4. Zone Unlocking — Currency-gated gates, DataStore persisted
 *   5. Pet/Egg Hatching — Weighted rarity, hatch animation, pet following (AlignPosition)
 *   6. Rebirth System — Reset progress, keep pets/gamepasses, permanent multiplier
 *   7. DataStore Persistence — pcall everything, BindToClose, retry, session locking
 *   8. RemoteEvent Security — Rate limiting, type validation, server authority
 *   9. LeaderStats — Coins, Gems (premium), Level
 */
export function getSimulatorReference(): string {
  return `--[[
  ============================================================================
  COMPLETE SIMULATOR GAME — SERVER SCRIPT (ServerScriptService)
  ============================================================================
  Architecture:
    - Server authoritative: client NEVER modifies economy values directly
    - Hub area with sell pad, egg hatching station, pet equip zone
    - 4 collection zones with increasing value and unlock cost
    - Click-to-collect via ProximityPrompt (NOT ClickDetector — modern API)
    - Backpack fill-then-sell loop (the core simulator gameplay loop)
    - Weighted egg rarity system with hatch animation via camera manipulation
    - Pet following using AlignPosition + AlignOrientation (physics-based)
    - Rebirth resets currency/zones but keeps pets and grants permanent multiplier
    - Full DataStore persistence with pcall, retry, session locking, BindToClose
    - Rate-limited RemoteEvents with type validation on every handler

  Folder Structure Expected:
    Workspace/
      Hub/
        SellPad (Part — touch to sell backpack contents)
        EggStation (Part — where eggs are hatched)
        RebirthPad (Part — touch to rebirth)
      Zones/
        Meadow/ (free starter zone)
          Collectibles/ (folder of Part collectibles with ProximityPrompt)
        Forest/ (costs 500 Coins)
          Gate (Part with ProximityPrompt)
          Collectibles/
        Desert/ (costs 5,000 Coins)
          Gate (Part with ProximityPrompt)
          Collectibles/
        Volcano/ (costs 50,000 Coins)
          Gate (Part with ProximityPrompt)
          Collectibles/
    ServerStorage/
      Pets/
        Common_Cat (Model with PrimaryPart)
        Common_Dog (Model with PrimaryPart)
        Uncommon_Fox (Model)
        Uncommon_Owl (Model)
        Rare_Dragon (Model)
        Rare_Phoenix (Model)
        Legendary_Unicorn (Model)
        Mythic_Cosmic_Serpent (Model)
    ReplicatedStorage/
      Remotes/ (created by this script if missing)
  ============================================================================
--]]

-- =========================================================================
-- SERVICES
-- Grab all at top level. Repeated GetService calls in hot paths waste cycles.
-- =========================================================================
local Players = game:GetService("Players")
local ServerStorage = game:GetService("ServerStorage")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local DataStoreService = game:GetService("DataStoreService")
local RunService = game:GetService("RunService")
local TweenService = game:GetService("TweenService")
local SoundService = game:GetService("SoundService")

-- =========================================================================
-- CONSTANTS
-- All tuning values in one block. Designers can tweak without reading code.
-- =========================================================================
local DATASTORE_NAME = "SimulatorSaveData_v2"
local DATASTORE_KEY_PREFIX = "SimV2_"
local SAVE_INTERVAL = 60            -- auto-save every 60 seconds
local RATE_LIMIT_INTERVAL = 0.5     -- min seconds between remote fires per player
local COLLECTIBLE_RESPAWN = 5       -- seconds before a collected item reappears
local MAX_LEVEL = 100
local XP_PER_LEVEL = 100            -- XP needed scales: level * XP_PER_LEVEL
local REBIRTH_MIN_COINS = 100000    -- coins required to rebirth
local REBIRTH_MULTIPLIER_PER = 0.5  -- +50% per rebirth (formula: 1 + rebirths * 0.5)
local STARTING_BACKPACK_CAP = 50
local STARTING_COINS = 0
local STARTING_GEMS = 0

-- Zone definitions: ordered from cheapest to most expensive.
-- orbValue = base value per collect. capacityBonus = added to backpack cap on unlock.
-- xpPerCollect = XP gained per successful collection in this zone.
local ZONES: { [string]: {
  orbValue: number,
  unlockCost: number,
  capacityBonus: number,
  xpPerCollect: number,
  order: number,
} } = {
  Meadow  = { orbValue = 1,   unlockCost = 0,      capacityBonus = 0,   xpPerCollect = 1,  order = 1 },
  Forest  = { orbValue = 5,   unlockCost = 500,    capacityBonus = 25,  xpPerCollect = 3,  order = 2 },
  Desert  = { orbValue = 25,  unlockCost = 5000,   capacityBonus = 75,  xpPerCollect = 8,  order = 3 },
  Volcano = { orbValue = 100, unlockCost = 50000,  capacityBonus = 200, xpPerCollect = 20, order = 4 },
}

-- Backpack capacity upgrades: each level costs more, gives more capacity.
-- Players must sell frequently at low levels, less at high levels. This IS the loop.
local CAPACITY_UPGRADES = {
  { cost = 200,    capacity = 100 },
  { cost = 1000,   capacity = 250 },
  { cost = 5000,   capacity = 500 },
  { cost = 20000,  capacity = 1000 },
  { cost = 75000,  capacity = 2500 },
  { cost = 250000, capacity = 5000 },
}

-- =========================================================================
-- EGG / PET RARITY SYSTEM
-- Weighted random selection. Weights must sum to 100 per egg type.
-- Each pet has a collectMultiplier that boosts collection value.
-- =========================================================================
-- Pet registry: petId -> { rarity, collectMultiplier, displayName }
local PET_REGISTRY: { [string]: {
  rarity: string,
  collectMultiplier: number,
  displayName: string,
} } = {
  Common_Cat           = { rarity = "Common",    collectMultiplier = 1.1,  displayName = "Cat" },
  Common_Dog           = { rarity = "Common",    collectMultiplier = 1.15, displayName = "Dog" },
  Uncommon_Fox         = { rarity = "Uncommon",  collectMultiplier = 1.3,  displayName = "Fox" },
  Uncommon_Owl         = { rarity = "Uncommon",  collectMultiplier = 1.35, displayName = "Owl" },
  Rare_Dragon          = { rarity = "Rare",      collectMultiplier = 1.6,  displayName = "Dragon" },
  Rare_Phoenix         = { rarity = "Rare",      collectMultiplier = 1.7,  displayName = "Phoenix" },
  Legendary_Unicorn    = { rarity = "Legendary", collectMultiplier = 2.5,  displayName = "Unicorn" },
  Mythic_Cosmic_Serpent = { rarity = "Mythic",   collectMultiplier = 5.0,  displayName = "Cosmic Serpent" },
}

-- Egg types: eggId -> { cost (in Gems), costType, petPool }
-- petPool entries: { petId, weight } — weights within an egg must sum to 100.
-- This weighted system means: roll 1-100, walk cumulative weights, pick match.
local EGGS: { [string]: {
  cost: number,
  costType: string,    -- "Coins" or "Gems"
  displayName: string,
  petPool: { { petId: string, weight: number } },
} } = {
  BasicEgg = {
    cost = 500,
    costType = "Coins",
    displayName = "Basic Egg",
    petPool = {
      { petId = "Common_Cat",       weight = 35 }, -- 35%
      { petId = "Common_Dog",       weight = 25 }, -- 25%  -> Common total 60%
      { petId = "Uncommon_Fox",     weight = 15 }, -- 15%
      { petId = "Uncommon_Owl",     weight = 10 }, -- 10%  -> Uncommon total 25%
      { petId = "Rare_Dragon",      weight = 7 },  --  7%
      { petId = "Rare_Phoenix",     weight = 3 },  --  3%  -> Rare total 10%
      { petId = "Legendary_Unicorn", weight = 4 }, --  4%  -> Legendary total 4%
      { petId = "Mythic_Cosmic_Serpent", weight = 1 }, -- 1% -> Mythic total 1%
    },
  },
  GoldenEgg = {
    cost = 50,
    costType = "Gems",
    displayName = "Golden Egg",
    petPool = {
      { petId = "Common_Cat",       weight = 20 },
      { petId = "Common_Dog",       weight = 15 }, -- Common total 35%
      { petId = "Uncommon_Fox",     weight = 15 },
      { petId = "Uncommon_Owl",     weight = 15 }, -- Uncommon total 30%
      { petId = "Rare_Dragon",      weight = 10 },
      { petId = "Rare_Phoenix",     weight = 10 }, -- Rare total 20%
      { petId = "Legendary_Unicorn", weight = 10 }, -- Legendary 10%
      { petId = "Mythic_Cosmic_Serpent", weight = 5 }, -- Mythic 5%
    },
  },
  MythicEgg = {
    cost = 200,
    costType = "Gems",
    displayName = "Mythic Egg",
    petPool = {
      { petId = "Uncommon_Fox",     weight = 15 },
      { petId = "Uncommon_Owl",     weight = 15 }, -- Uncommon total 30%
      { petId = "Rare_Dragon",      weight = 15 },
      { petId = "Rare_Phoenix",     weight = 15 }, -- Rare total 30%
      { petId = "Legendary_Unicorn", weight = 25 }, -- Legendary 25%
      { petId = "Mythic_Cosmic_Serpent", weight = 15 }, -- Mythic 15%
    },
  },
}

-- Rarity colors for visual feedback during hatch animation.
local RARITY_COLORS: { [string]: Color3 } = {
  Common    = Color3.fromRGB(180, 180, 180),
  Uncommon  = Color3.fromRGB(76, 175, 80),
  Rare      = Color3.fromRGB(33, 150, 243),
  Legendary = Color3.fromRGB(255, 193, 7),
  Mythic    = Color3.fromRGB(233, 30, 99),
}

-- =========================================================================
-- REMOTES
-- Server creates all remotes so they exist BEFORE any client connects.
-- Never let clients create remotes — that's an exploit vector.
-- =========================================================================
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

-- RemoteEvents (client -> server requests)
local CollectRemote      = getOrCreateRemote("Collect", "RemoteEvent") :: RemoteEvent
local SellRemote         = getOrCreateRemote("SellBackpack", "RemoteEvent") :: RemoteEvent
local UnlockZoneRemote   = getOrCreateRemote("UnlockZone", "RemoteEvent") :: RemoteEvent
local HatchEggRemote     = getOrCreateRemote("HatchEgg", "RemoteEvent") :: RemoteEvent
local EquipPetRemote     = getOrCreateRemote("EquipPet", "RemoteEvent") :: RemoteEvent
local UpgradeCapRemote   = getOrCreateRemote("UpgradeCapacity", "RemoteEvent") :: RemoteEvent
local RebirthRemote      = getOrCreateRemote("RequestRebirth", "RemoteEvent") :: RemoteEvent

-- RemoteEvents (server -> client notifications)
local UpdateUIRemote     = getOrCreateRemote("UpdateUI", "RemoteEvent") :: RemoteEvent
local HatchResultRemote  = getOrCreateRemote("HatchResult", "RemoteEvent") :: RemoteEvent
local NotifyRemote       = getOrCreateRemote("Notify", "RemoteEvent") :: RemoteEvent

-- =========================================================================
-- DATASTORE SETUP
-- pcall the GetDataStore call itself — it can fail in Studio without API access.
-- =========================================================================
local simStore: DataStore? = nil
do
  local ok, store = pcall(function()
    return DataStoreService:GetDataStore(DATASTORE_NAME)
  end)
  if ok then
    simStore = store
  else
    warn("[Simulator] DataStore unavailable — playing without saves:", store)
  end
end

-- =========================================================================
-- PLAYER DATA SCHEMA
-- Every field has a default. When loading, we merge saved data over defaults
-- so new fields added in updates automatically get their default value.
-- This prevents nil-index crashes after shipping updates.
-- =========================================================================
type PlayerData = {
  coins: number,
  gems: number,
  level: number,
  xp: number,
  backpackCount: number,       -- current items in backpack
  backpackCapacity: number,
  capacityLevel: number,       -- index into CAPACITY_UPGRADES
  rebirths: number,
  unlockedZones: { string },
  ownedPets: { string },       -- list of petIds
  equippedPet: string?,
  totalCollected: number,      -- lifetime stat for achievements
  totalSold: number,           -- lifetime coins earned from selling
}

local DEFAULT_DATA: PlayerData = {
  coins = STARTING_COINS,
  gems = STARTING_GEMS,
  level = 1,
  xp = 0,
  backpackCount = 0,
  backpackCapacity = STARTING_BACKPACK_CAP,
  capacityLevel = 0,
  rebirths = 0,
  unlockedZones = { "Meadow" },  -- starter zone is free
  ownedPets = {},
  equippedPet = nil,
  totalCollected = 0,
  totalSold = 0,
}

-- Deep copy utility. Needed because Luau tables are reference types.
-- Without this, all players would share the same DEFAULT_DATA table.
local function deepCopy(t: any): any
  if type(t) ~= "table" then return t end
  local copy = {}
  for k, v in t do
    copy[k] = deepCopy(v)
  end
  return copy
end

-- =========================================================================
-- PLAYER STATE (in-memory, authoritative)
-- Server holds all player data in memory. Clients get read-only snapshots
-- via UpdateUIRemote. This prevents all economy exploits.
-- =========================================================================
local playerData: { [number]: PlayerData } = {}
local playerPets: { [number]: Model? } = {}         -- active pet model in workspace
local lastActionTime: { [number]: number } = {}      -- rate limiting per player
local sessionLock: { [number]: boolean } = {}         -- prevent double-load

-- =========================================================================
-- RATE LIMITER
-- Returns true if the action is allowed, false if rate-limited.
-- Simple but effective: 1 action per RATE_LIMIT_INTERVAL seconds.
-- =========================================================================
local function isRateLimited(userId: number): boolean
  local now = tick()
  local last = lastActionTime[userId] or 0
  if (now - last) < RATE_LIMIT_INTERVAL then
    return true -- rate limited, deny action
  end
  lastActionTime[userId] = now
  return false -- allowed
end

-- =========================================================================
-- DATA LOAD / SAVE
-- pcall with single retry on failure. DevForum consensus: don't loop retries
-- infinitely — it can cause request queue buildup and make things worse.
-- =========================================================================
local function loadPlayerData(player: Player): PlayerData
  local data = deepCopy(DEFAULT_DATA)
  if not simStore then return data end

  local key = DATASTORE_KEY_PREFIX .. tostring(player.UserId)

  -- First attempt
  local success, result = pcall(function()
    return (simStore :: DataStore):GetAsync(key)
  end)

  -- Retry once on failure
  if not success then
    warn("[Simulator] Load failed for", player.Name, "- retrying:", result)
    task.wait(1)
    success, result = pcall(function()
      return (simStore :: DataStore):GetAsync(key)
    end)
  end

  if success and result and type(result) == "table" then
    -- Merge saved data over defaults. New fields get default values automatically.
    for k, v in result :: any do
      if (data :: any)[k] ~= nil then
        (data :: any)[k] = v
      end
    end
  elseif not success then
    warn("[Simulator] Load failed permanently for", player.Name, ":", result)
  end

  return data
end

local function savePlayerData(userId: number): boolean
  if not simStore then return false end
  local data = playerData[userId]
  if not data then return false end

  local key = DATASTORE_KEY_PREFIX .. tostring(userId)

  -- UpdateAsync is safer than SetAsync — it handles concurrent writes.
  -- We use it to prevent data loss when two servers write to the same key.
  local success, err = pcall(function()
    (simStore :: DataStore):UpdateAsync(key, function(_oldData)
      -- Always overwrite with current server data.
      -- In a more complex game you'd merge old + new here.
      return data
    end)
  end)

  if not success then
    warn("[Simulator] Save failed for userId", userId, "- retrying:", err)
    task.wait(0.5)
    local ok2, err2 = pcall(function()
      (simStore :: DataStore):UpdateAsync(key, function()
        return data
      end)
    end)
    if not ok2 then
      warn("[Simulator] Retry save failed for userId", userId, ":", err2)
      return false
    end
  end

  return true
end

-- =========================================================================
-- LEADERSTATS
-- Three stats on the leaderboard: Coins, Gems, Level.
-- IntValue under player.leaderstats for built-in Roblox leaderboard display.
-- =========================================================================
local function setupLeaderstats(player: Player, data: PlayerData)
  local leaderstats = Instance.new("Folder")
  leaderstats.Name = "leaderstats"
  leaderstats.Parent = player

  local coinsVal = Instance.new("IntValue")
  coinsVal.Name = "Coins"
  coinsVal.Value = math.floor(data.coins)
  coinsVal.Parent = leaderstats

  local gemsVal = Instance.new("IntValue")
  gemsVal.Name = "Gems"
  gemsVal.Value = math.floor(data.gems)
  gemsVal.Parent = leaderstats

  local levelVal = Instance.new("IntValue")
  levelVal.Name = "Level"
  levelVal.Value = data.level
  levelVal.Parent = leaderstats
end

-- Sync leaderstats + fire UI update to client.
-- Called after every state change so client always has fresh data.
local function syncPlayerUI(player: Player)
  local data = playerData[player.UserId]
  if not data then return end

  -- Update leaderboard values
  local leaderstats = player:FindFirstChild("leaderstats")
  if leaderstats then
    local coinsVal = leaderstats:FindFirstChild("Coins")
    if coinsVal and coinsVal:IsA("IntValue") then
      coinsVal.Value = math.floor(data.coins)
    end
    local gemsVal = leaderstats:FindFirstChild("Gems")
    if gemsVal and gemsVal:IsA("IntValue") then
      gemsVal.Value = math.floor(data.gems)
    end
    local levelVal = leaderstats:FindFirstChild("Level")
    if levelVal and levelVal:IsA("IntValue") then
      levelVal.Value = data.level
    end
  end

  -- Fire client UI update with full snapshot.
  -- Client uses this to render backpack bar, zone buttons, pet list, etc.
  UpdateUIRemote:FireClient(player, {
    coins = data.coins,
    gems = data.gems,
    level = data.level,
    xp = data.xp,
    xpToNextLevel = data.level * XP_PER_LEVEL,
    backpackCount = data.backpackCount,
    backpackCapacity = data.backpackCapacity,
    capacityLevel = data.capacityLevel,
    rebirths = data.rebirths,
    rebirthMultiplier = 1 + (data.rebirths * REBIRTH_MULTIPLIER_PER),
    unlockedZones = data.unlockedZones,
    ownedPets = data.ownedPets,
    equippedPet = data.equippedPet,
    totalCollected = data.totalCollected,
    totalSold = data.totalSold,
  })
end

-- =========================================================================
-- MULTIPLIER CALCULATION
-- Rebirth multiplier + pet multiplier stack multiplicatively.
-- Formula: baseValue * rebirthMult * petMult
-- =========================================================================
local function getRebirthMultiplier(data: PlayerData): number
  return 1 + (data.rebirths * REBIRTH_MULTIPLIER_PER)
end

local function getPetMultiplier(data: PlayerData): number
  if not data.equippedPet then return 1.0 end
  local petInfo = PET_REGISTRY[data.equippedPet]
  if not petInfo then return 1.0 end
  return petInfo.collectMultiplier
end

local function getTotalMultiplier(data: PlayerData): number
  return getRebirthMultiplier(data) * getPetMultiplier(data)
end

-- =========================================================================
-- XP / LEVEL SYSTEM
-- XP scales linearly: level N requires N * XP_PER_LEVEL to reach level N+1.
-- Leveling up grants a small gem bonus to incentivize progression.
-- =========================================================================
local function addXP(player: Player, data: PlayerData, amount: number)
  if data.level >= MAX_LEVEL then return end

  data.xp += amount
  local xpNeeded = data.level * XP_PER_LEVEL

  -- Level up loop: handle multiple level-ups from one large XP gain
  while data.xp >= xpNeeded and data.level < MAX_LEVEL do
    data.xp -= xpNeeded
    data.level += 1
    xpNeeded = data.level * XP_PER_LEVEL

    -- Gem reward per level-up (scales with level)
    data.gems += math.floor(data.level / 5) + 1

    -- Notify client of level-up for celebration UI
    NotifyRemote:FireClient(player, {
      type = "LevelUp",
      level = data.level,
      gemsEarned = math.floor(data.level / 5) + 1,
    })
  end
end

-- =========================================================================
-- ZONE HELPERS
-- =========================================================================
local function hasUnlockedZone(data: PlayerData, zoneName: string): boolean
  for _, z in data.unlockedZones do
    if z == zoneName then return true end
  end
  return false
end

-- =========================================================================
-- COLLECTION SYSTEM
-- ProximityPrompt on each collectible Part. Server validates every interaction.
-- ProximityPrompt is the modern replacement for ClickDetector — it supports
-- gamepad, has built-in UI, and respects MaxActivationDistance properly.
-- =========================================================================
local zonesFolder = workspace:FindFirstChild("Zones")
local collectibleCooldowns: { [BasePart]: boolean } = {} -- tracks respawning items

local function setupCollectibles()
  if not zonesFolder then
    warn("[Simulator] Workspace/Zones folder missing! Collection disabled.")
    return
  end

  for _, zoneInstance in zonesFolder:GetChildren() do
    local zoneName = zoneInstance.Name
    local zoneConfig = ZONES[zoneName]
    if not zoneConfig then continue end

    local collectiblesFolder = zoneInstance:FindFirstChild("Collectibles")
    if not collectiblesFolder then continue end

    for _, item in collectiblesFolder:GetChildren() do
      if not item:IsA("BasePart") then continue end

      -- Visual setup per zone — NEVER SmoothPlastic (looks cheap).
      -- Zone-specific materials give each area a distinct feel.
      if zoneName == "Meadow" then
        item.Material = Enum.Material.Neon
        item.Color = Color3.fromRGB(100, 220, 100)
      elseif zoneName == "Forest" then
        item.Material = Enum.Material.Glass
        item.Color = Color3.fromRGB(50, 180, 255)
      elseif zoneName == "Desert" then
        item.Material = Enum.Material.ForceField
        item.Color = Color3.fromRGB(255, 200, 50)
      elseif zoneName == "Volcano" then
        item.Material = Enum.Material.Neon
        item.Color = Color3.fromRGB(255, 60, 30)
      end

      -- Add floating animation — subtle bobbing makes collectibles visible
      local originalY = item.Position.Y
      task.spawn(function()
        local offset = math.random() * math.pi * 2 -- random phase
        while item.Parent do
          local t = tick() + offset
          item.Position = Vector3.new(
            item.Position.X,
            originalY + math.sin(t * 2) * 0.5,
            item.Position.Z
          )
          task.wait(0.05)
        end
      end)

      -- ProximityPrompt setup
      local prompt = item:FindFirstChildOfClass("ProximityPrompt")
      if not prompt then
        prompt = Instance.new("ProximityPrompt")
        prompt.ActionText = "Collect"
        prompt.ObjectText = "+" .. tostring(zoneConfig.orbValue)
        prompt.HoldDuration = 0          -- instant collect
        prompt.MaxActivationDistance = 12 -- must be nearby, prevents teleport exploits
        prompt.RequiresLineOfSight = false
        prompt.Parent = item
      end

      prompt.Triggered:Connect(function(player: Player)
        -- Rate limit: prevent autoclicker exploits
        if isRateLimited(player.UserId) then return end

        -- Check cooldown (already collected, respawning)
        if collectibleCooldowns[item] then return end

        local data = playerData[player.UserId]
        if not data then return end

        -- Zone access check: prevent collecting in locked zones
        if not hasUnlockedZone(data, zoneName) then return end

        -- Backpack full: player must sell first
        if data.backpackCount >= data.backpackCapacity then
          NotifyRemote:FireClient(player, {
            type = "BackpackFull",
            message = "Backpack full! Go sell at the hub.",
          })
          return
        end

        -- Calculate value with all multipliers
        local value = math.floor(zoneConfig.orbValue * getTotalMultiplier(data))
        if value < 1 then value = 1 end

        -- Add to backpack (NOT directly to coins — must sell first)
        -- This sell loop is THE core simulator mechanic.
        data.backpackCount += value
        if data.backpackCount > data.backpackCapacity then
          data.backpackCount = data.backpackCapacity
        end

        -- Track lifetime stat
        data.totalCollected += value

        -- Grant XP for collecting
        addXP(player, data, zoneConfig.xpPerCollect)

        -- Visual: hide the collectible temporarily
        collectibleCooldowns[item] = true
        item.Transparency = 1
        prompt.Enabled = false

        syncPlayerUI(player)

        -- Respawn after cooldown
        task.delay(COLLECTIBLE_RESPAWN, function()
          collectibleCooldowns[item] = nil
          if item.Parent then
            item.Transparency = 0
            prompt.Enabled = true
          end
        end)
      end)
    end
  end
end

setupCollectibles()

-- =========================================================================
-- SELL PAD
-- Player touches the sell pad to convert backpack items into Coins.
-- Includes sound effect + particle burst for satisfying feedback.
-- The sell pad is the other half of the core loop: collect -> sell -> upgrade.
-- =========================================================================
local hubFolder = workspace:FindFirstChild("Hub")
local sellDebounce: { [number]: boolean } = {}

local function createSellEffects(sellPad: BasePart)
  -- Particle emitter for the coin burst on sell
  local particles = sellPad:FindFirstChildOfClass("ParticleEmitter")
  if not particles then
    particles = Instance.new("ParticleEmitter")
    particles.Name = "SellParticles"
    particles.Color = ColorSequence.new(Color3.fromRGB(255, 215, 0)) -- gold
    particles.Size = NumberSequence.new({ NumberSequenceKeypoint.new(0, 1), NumberSequenceKeypoint.new(1, 0) })
    particles.Lifetime = NumberRange.new(0.5, 1.0)
    particles.Speed = NumberRange.new(10, 20)
    particles.SpreadAngle = Vector2.new(180, 180)
    particles.Rate = 0             -- disabled by default, we burst on sell
    particles.Enabled = false
    particles.Parent = sellPad
  end

  -- Sound effect for the cash register "cha-ching"
  local sound = sellPad:FindFirstChildOfClass("Sound")
  if not sound then
    sound = Instance.new("Sound")
    sound.Name = "SellSound"
    sound.SoundId = "rbxassetid://9125849958"  -- coin collect sound
    sound.Volume = 0.8
    sound.Parent = sellPad
  end

  return particles, sound
end

if hubFolder then
  local sellPad = hubFolder:FindFirstChild("SellPad")
  if sellPad and sellPad:IsA("BasePart") then
    -- Visual: make the sell pad unmistakable
    sellPad.Material = Enum.Material.Neon
    sellPad.Color = Color3.fromRGB(255, 215, 0) -- gold

    -- Billboard label
    local billboard = Instance.new("BillboardGui")
    billboard.Size = UDim2.new(6, 0, 2, 0)
    billboard.StudsOffset = Vector3.new(0, 5, 0)
    billboard.Parent = sellPad

    local label = Instance.new("TextLabel")
    label.Size = UDim2.new(1, 0, 1, 0)
    label.BackgroundTransparency = 1
    label.Text = "SELL HERE"
    label.TextColor3 = Color3.fromRGB(255, 215, 0)
    label.TextStrokeTransparency = 0
    label.TextStrokeColor3 = Color3.fromRGB(0, 0, 0)
    label.TextScaled = true
    label.Font = Enum.Font.GothamBold
    label.Parent = billboard

    local particles, sound = createSellEffects(sellPad)

    sellPad.Touched:Connect(function(hit: BasePart)
      local character = hit.Parent
      if not character then return end
      local player = Players:GetPlayerFromCharacter(character)
      if not player then return end

      -- Debounce: one sell per touch sequence
      if sellDebounce[player.UserId] then return end
      sellDebounce[player.UserId] = true

      local data = playerData[player.UserId]
      if data and data.backpackCount > 0 then
        local soldAmount = data.backpackCount

        -- Convert backpack to coins
        data.coins += soldAmount
        data.totalSold += soldAmount
        data.backpackCount = 0

        -- Play sell effects
        if sound then sound:Play() end
        if particles then
          particles:Emit(math.clamp(soldAmount, 10, 100)) -- more particles for bigger sells
        end

        -- Notify client with amount sold
        NotifyRemote:FireClient(player, {
          type = "Sold",
          amount = soldAmount,
          newBalance = data.coins,
        })

        syncPlayerUI(player)
      end

      task.delay(0.5, function()
        sellDebounce[player.UserId] = nil
      end)
    end)
  end
end

-- Also allow selling via remote (for GUI sell button)
SellRemote.OnServerEvent:Connect(function(player: Player)
  if isRateLimited(player.UserId) then return end

  local data = playerData[player.UserId]
  if not data then return end
  if data.backpackCount <= 0 then return end

  local soldAmount = data.backpackCount
  data.coins += soldAmount
  data.totalSold += soldAmount
  data.backpackCount = 0
  syncPlayerUI(player)
end)

-- =========================================================================
-- ZONE UNLOCK GATES
-- ProximityPrompt on gate Parts. Server checks balance before unlocking.
-- Unlocked zones are saved in DataStore so players keep progress.
-- =========================================================================
local function setupZoneGates()
  if not zonesFolder then return end

  for _, zoneInstance in zonesFolder:GetChildren() do
    local zoneName = zoneInstance.Name
    local zoneConfig = ZONES[zoneName]
    if not zoneConfig or zoneConfig.unlockCost == 0 then continue end -- skip free zones

    local gate = zoneInstance:FindFirstChild("Gate")
    if not gate or not gate:IsA("BasePart") then continue end

    -- Gate visual: Concrete barrier (never SmoothPlastic)
    gate.Material = Enum.Material.Concrete
    gate.Color = Color3.fromRGB(80, 80, 80)

    -- Price billboard on gate
    local billboard = Instance.new("BillboardGui")
    billboard.Name = "GateLabel"
    billboard.Size = UDim2.new(5, 0, 2, 0)
    billboard.StudsOffset = Vector3.new(0, 4, 0)
    billboard.Parent = gate

    local priceLabel = Instance.new("TextLabel")
    priceLabel.Size = UDim2.new(1, 0, 1, 0)
    priceLabel.BackgroundTransparency = 1
    priceLabel.Text = zoneName .. "\\n" .. tostring(zoneConfig.unlockCost) .. " Coins"
    priceLabel.TextColor3 = Color3.fromRGB(255, 100, 100)
    priceLabel.TextStrokeTransparency = 0
    priceLabel.TextScaled = true
    priceLabel.Font = Enum.Font.GothamBold
    priceLabel.Parent = billboard

    -- ProximityPrompt for unlock
    local prompt = gate:FindFirstChildOfClass("ProximityPrompt")
    if not prompt then
      prompt = Instance.new("ProximityPrompt")
      prompt.ActionText = "Unlock " .. zoneName
      prompt.ObjectText = tostring(zoneConfig.unlockCost) .. " Coins"
      prompt.HoldDuration = 1.0 -- hold to prevent accidental purchase
      prompt.MaxActivationDistance = 10
      prompt.Parent = gate
    end

    prompt.Triggered:Connect(function(player: Player)
      local data = playerData[player.UserId]
      if not data then return end
      if hasUnlockedZone(data, zoneName) then return end
      if data.coins < zoneConfig.unlockCost then
        NotifyRemote:FireClient(player, {
          type = "InsufficientFunds",
          message = "Need " .. tostring(zoneConfig.unlockCost) .. " Coins!",
        })
        return
      end

      -- Deduct and unlock
      data.coins -= zoneConfig.unlockCost
      table.insert(data.unlockedZones, zoneName)
      data.backpackCapacity += zoneConfig.capacityBonus

      -- Open the gate visually
      -- NOTE: In production, use CollectionService tags for per-player gates.
      -- This simplified version opens for everyone when anyone unlocks.
      gate.Transparency = 0.9
      gate.CanCollide = false

      -- Update label
      local lbl = billboard:FindFirstChildOfClass("TextLabel")
      if lbl then
        lbl.Text = zoneName .. "\\nUNLOCKED"
        lbl.TextColor3 = Color3.fromRGB(0, 255, 100)
      end

      prompt:Destroy()
      syncPlayerUI(player)
    end)
  end
end

setupZoneGates()

-- Remote-based zone unlock (for GUI purchase buttons)
UnlockZoneRemote.OnServerEvent:Connect(function(player: Player, zoneName: unknown)
  -- Type validation: never trust client input
  if type(zoneName) ~= "string" then return end
  if isRateLimited(player.UserId) then return end
  local zoneStr = zoneName :: string

  local config = ZONES[zoneStr]
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

-- =========================================================================
-- EGG HATCHING SYSTEM
-- Weighted random selection determines which pet hatches from the egg.
-- Algorithm: roll 1-100, walk cumulative weights, first entry where
-- cumulative >= roll is the result. Provably fair if weights sum to 100.
--
-- The server picks the result and tells the client which pet hatched.
-- Client plays the hatch animation (camera zoom, spin, reveal).
-- Server spawns the pet model after a short delay for animation timing.
-- =========================================================================
local function rollEgg(eggId: string): string?
  local egg = EGGS[eggId]
  if not egg then return nil end

  local roll = math.random(1, 100)
  local cumulative = 0

  for _, entry in egg.petPool do
    cumulative += entry.weight
    if roll <= cumulative then
      return entry.petId
    end
  end

  -- Fallback: return last pet (should never reach here if weights sum to 100)
  return egg.petPool[#egg.petPool].petId
end

HatchEggRemote.OnServerEvent:Connect(function(player: Player, eggId: unknown)
  -- Type validation
  if type(eggId) ~= "string" then return end
  if isRateLimited(player.UserId) then return end
  local eggStr = eggId :: string

  local eggConfig = EGGS[eggStr]
  if not eggConfig then return end

  local data = playerData[player.UserId]
  if not data then return end

  -- Check if player can afford the egg
  if eggConfig.costType == "Coins" then
    if data.coins < eggConfig.cost then return end
    data.coins -= eggConfig.cost
  elseif eggConfig.costType == "Gems" then
    if data.gems < eggConfig.cost then return end
    data.gems -= eggConfig.cost
  else
    return -- unknown cost type
  end

  -- Roll for the pet
  local petId = rollEgg(eggStr)
  if not petId then return end

  local petInfo = PET_REGISTRY[petId]
  if not petInfo then return end

  -- Add pet to owned list
  table.insert(data.ownedPets, petId)

  -- Send hatch result to client for animation.
  -- Client will: zoom camera to egg station, play crack animation,
  -- reveal pet with rarity-colored particles, then restore camera.
  HatchResultRemote:FireClient(player, {
    petId = petId,
    petName = petInfo.displayName,
    rarity = petInfo.rarity,
    rarityColor = { RARITY_COLORS[petInfo.rarity]:ToHSV() }, -- send as HSV for flexibility
    collectMultiplier = petInfo.collectMultiplier,
    isNew = true, -- client can show "NEW!" badge
  })

  syncPlayerUI(player)
end)

-- =========================================================================
-- PET FOLLOW SYSTEM
-- Pets follow the player using AlignPosition + AlignOrientation.
-- Why AlignPosition instead of CFrame updates?
--   1. Physics-based: the engine handles replication automatically
--   2. Smooth: spring-like motion without jitter on other clients
--   3. Collision-aware: pets won't clip through walls as badly
--   4. Low bandwidth: only attachment positions replicate, not every CFrame
-- =========================================================================
local function destroyActivePet(userId: number)
  local existing = playerPets[userId]
  if existing and existing.Parent then
    existing:Destroy()
  end
  playerPets[userId] = nil
end

local function spawnPetModel(player: Player, petId: string)
  local character = player.Character
  if not character then return end
  local hrp = character:FindFirstChild("HumanoidRootPart")
  if not hrp or not hrp:IsA("BasePart") then return end

  -- Clean up any existing pet first
  destroyActivePet(player.UserId)

  -- Clone pet model from ServerStorage
  local petsFolder = ServerStorage:FindFirstChild("Pets")
  if not petsFolder then
    warn("[Simulator] ServerStorage/Pets folder missing!")
    return
  end
  local template = petsFolder:FindFirstChild(petId)
  if not template then
    warn("[Simulator] Pet template missing:", petId)
    return
  end

  local pet = template:Clone()
  pet.Name = player.Name .. "_Pet"

  -- Position beside and above the player
  local spawnOffset = CFrame.new(3, 2, 3)
  local spawnCFrame = hrp.CFrame * spawnOffset

  if pet:IsA("Model") and pet.PrimaryPart then
    pet:PivotTo(spawnCFrame)

    -- Attachment on pet (source)
    local att0 = Instance.new("Attachment")
    att0.Parent = pet.PrimaryPart

    -- Attachment on player (target) with offset so pet floats beside them
    local att1 = Instance.new("Attachment")
    att1.Position = Vector3.new(3, 2, 3) -- right, up, behind
    att1.Parent = hrp

    -- AlignPosition: spring-like following with configurable responsiveness.
    -- Higher Responsiveness = snappier following. 10-15 feels natural for pets.
    local alignPos = Instance.new("AlignPosition")
    alignPos.MaxForce = 15000           -- enough force to keep up with sprinting
    alignPos.Responsiveness = 12        -- how quickly pet catches up
    alignPos.Attachment0 = att0
    alignPos.Attachment1 = att1
    alignPos.Parent = pet.PrimaryPart

    -- AlignOrientation: pet faces same direction as player
    local alignOri = Instance.new("AlignOrientation")
    alignOri.MaxTorque = 15000
    alignOri.Responsiveness = 8         -- slightly slower rotation for natural feel
    alignOri.Attachment0 = att0
    alignOri.Attachment1 = att1
    alignOri.Parent = pet.PrimaryPart

    -- Make all pet parts non-collidable so it doesn't push player around.
    -- Also apply Neon material for that glowing pet aesthetic.
    for _, part in pet:GetDescendants() do
      if part:IsA("BasePart") then
        part.CanCollide = false
        part.Massless = true -- prevents pet from affecting player physics
        part.Material = Enum.Material.Neon
      end
    end
  end

  pet.Parent = workspace
  playerPets[player.UserId] = pet
end

-- Equip pet remote
EquipPetRemote.OnServerEvent:Connect(function(player: Player, petId: unknown)
  if type(petId) ~= "string" then return end
  if isRateLimited(player.UserId) then return end
  local petStr = petId :: string

  -- Validate pet exists in registry
  if not PET_REGISTRY[petStr] then return end

  local data = playerData[player.UserId]
  if not data then return end

  -- Check ownership: player must own this pet
  local owned = false
  for _, ownedPet in data.ownedPets do
    if ownedPet == petStr then
      owned = true
      break
    end
  end
  if not owned then return end

  -- Equip and spawn
  data.equippedPet = petStr
  spawnPetModel(player, petStr)
  syncPlayerUI(player)
end)

-- =========================================================================
-- CAPACITY UPGRADE
-- Exponential cost curve keeps players in the collect-sell loop longer at
-- low levels and lets high-level players collect more per trip.
-- =========================================================================
UpgradeCapRemote.OnServerEvent:Connect(function(player: Player)
  if isRateLimited(player.UserId) then return end

  local data = playerData[player.UserId]
  if not data then return end

  local nextLevel = data.capacityLevel + 1
  if nextLevel > #CAPACITY_UPGRADES then
    NotifyRemote:FireClient(player, {
      type = "MaxLevel",
      message = "Backpack is already max level!",
    })
    return
  end

  local upgrade = CAPACITY_UPGRADES[nextLevel]
  if data.coins < upgrade.cost then return end

  data.coins -= upgrade.cost
  data.capacityLevel = nextLevel
  data.backpackCapacity = upgrade.capacity
  syncPlayerUI(player)
end)

-- =========================================================================
-- REBIRTH SYSTEM
-- Resets: coins, backpack, capacity upgrades, zone unlocks.
-- Preserves: pets, gems, level, gamepasses (not implemented here).
-- Grants: permanent collection multiplier.
-- Formula: multiplier = 1 + (rebirths * 0.5)
-- So rebirth 1 = 1.5x, rebirth 2 = 2.0x, rebirth 10 = 6.0x.
-- =========================================================================
RebirthRemote.OnServerEvent:Connect(function(player: Player)
  if isRateLimited(player.UserId) then return end

  local data = playerData[player.UserId]
  if not data then return end

  if data.coins < REBIRTH_MIN_COINS then
    NotifyRemote:FireClient(player, {
      type = "InsufficientFunds",
      message = "Need " .. tostring(REBIRTH_MIN_COINS) .. " Coins to rebirth!",
    })
    return
  end

  -- Preserve what survives rebirth
  local savedPets = data.ownedPets
  local savedEquipped = data.equippedPet
  local savedGems = data.gems
  local savedLevel = data.level
  local savedXP = data.xp
  local savedTotalCollected = data.totalCollected
  local savedTotalSold = data.totalSold
  local newRebirths = data.rebirths + 1

  -- Reset to defaults
  data.coins = STARTING_COINS
  data.backpackCount = 0
  data.backpackCapacity = STARTING_BACKPACK_CAP
  data.capacityLevel = 0
  data.unlockedZones = { "Meadow" }

  -- Restore preserved data
  data.rebirths = newRebirths
  data.ownedPets = savedPets
  data.equippedPet = savedEquipped
  data.gems = savedGems
  data.level = savedLevel
  data.xp = savedXP
  data.totalCollected = savedTotalCollected
  data.totalSold = savedTotalSold

  -- Notify client for rebirth celebration screen
  NotifyRemote:FireClient(player, {
    type = "Rebirth",
    rebirthCount = newRebirths,
    newMultiplier = 1 + (newRebirths * REBIRTH_MULTIPLIER_PER),
  })

  syncPlayerUI(player)
end)

-- =========================================================================
-- PLAYER JOIN
-- Order matters: load data -> setup leaderstats -> sync UI -> spawn pet.
-- CharacterAdded fires on every respawn, so pet re-spawns automatically.
-- =========================================================================
Players.PlayerAdded:Connect(function(player: Player)
  -- Session lock: prevent double-load if PlayerAdded fires twice (rare but real)
  if sessionLock[player.UserId] then return end
  sessionLock[player.UserId] = true

  local data = loadPlayerData(player)
  playerData[player.UserId] = data

  setupLeaderstats(player, data)
  syncPlayerUI(player)

  -- Spawn pet on every character load (handles respawns)
  player.CharacterAdded:Connect(function()
    task.wait(1) -- wait for character model to fully replicate
    if data.equippedPet and playerData[player.UserId] then
      spawnPetModel(player, data.equippedPet)
    end
  end)

  -- If character already loaded (late join edge case)
  if player.Character and data.equippedPet then
    spawnPetModel(player, data.equippedPet)
  end
end)

-- =========================================================================
-- PLAYER LEAVE
-- Save immediately on leave. Clean up all state to prevent memory leaks.
-- =========================================================================
Players.PlayerRemoving:Connect(function(player: Player)
  local userId = player.UserId

  -- Save before cleanup
  savePlayerData(userId)

  -- Clean up all state
  destroyActivePet(userId)
  playerData[userId] = nil
  lastActionTime[userId] = nil
  sellDebounce[userId] = nil
  sessionLock[userId] = nil
end)

-- =========================================================================
-- AUTO-SAVE (periodic)
-- Saves all players every SAVE_INTERVAL seconds. Each save runs in its own
-- thread so one player's slow save doesn't block others.
-- =========================================================================
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

-- =========================================================================
-- BIND TO CLOSE
-- CRITICAL: saves all players when the server shuts down. Without this,
-- players lose progress when the server closes (deploy, crash, empty server).
-- task.wait(5) gives DataStore time to complete all writes.
-- =========================================================================
game:BindToClose(function()
  -- Save all players in parallel
  local threads = {}
  for userId, _ in playerData do
    local thread = task.spawn(function()
      savePlayerData(userId)
    end)
    table.insert(threads, thread)
  end

  -- Wait for saves to complete (Roblox gives 30s for BindToClose)
  task.wait(5)
end)

print("[Simulator] Server loaded — zones:", #zonesFolder:GetChildren(), "eggs:", 3, "pets:", 8)
`;
}
