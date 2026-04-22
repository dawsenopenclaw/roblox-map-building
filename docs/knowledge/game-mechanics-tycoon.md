# Tycoon Game Mechanics for Roblox

Complete reference for building tycoon-style games — the most popular genre on Roblox.

## Core Tycoon Systems

A tycoon game has five fundamental systems that work together:

### 1. Dropper System

The dropper is the engine of income. It spawns parts on a timer, which travel along a conveyor to a collector.

**How it works:**
- A spawner part creates a new Part every N seconds
- The spawned part falls onto a conveyor belt
- The conveyor moves parts toward the collector using `BodyVelocity` or `AssemblyLinearVelocity`
- When parts reach the collector, they're destroyed and cash is added

**Key parameters:**
- Drop interval: 1-3 seconds (faster = more income)
- Part value: Base income per part (e.g., $5)
- Conveyor speed: 10-20 studs/second
- Part lifetime: 15 seconds (auto-destroy if stuck)

### 2. Conveyor Belt System

Conveyors move dropped items from dropper to collector.

**Implementation approaches:**
- **BodyVelocity method:** Parent a BodyVelocity to each dropped part. Simple and reliable.
- **AssemblyLinearVelocity:** Set directly on the part. Modern approach, less overhead.
- **Surface velocity:** Set the conveyor part's `CustomPhysicalProperties` and use a script to push touching parts.
- **Touched event:** When a part touches the conveyor, apply force in the conveyor's direction.

### 3. Upgrade System

Players spend cash to unlock upgrades that multiply income.

**Upgrade types:**
- **Dropper speed** — reduces interval between drops
- **Part value multiplier** — each dropped part is worth more
- **Auto-collector** — automatically sells items without manual collection
- **New droppers** — unlock additional dropper machines
- **Conveyor speed** — parts move faster
- **Lucky drops** — random chance of 10x value parts

**Pricing curve (exponential):**
- Upgrade 1: $100
- Upgrade 2: $500
- Upgrade 3: $2,000
- Upgrade 4: $10,000
- Upgrade 5: $50,000

### 4. Rebirth System

When players have progressed far enough, they can "rebirth" — reset all progress in exchange for a permanent multiplier.

**How it works:**
- Player reaches a threshold (e.g., $100,000 total earned)
- Rebirth resets: cash, upgrades, unlocked areas
- Rebirth gives: permanent income multiplier (e.g., 2x, 3x, 5x)
- Each rebirth costs more but gives a higher multiplier
- Rebirth count is displayed as prestige

### 5. Base Building / Plot System

Each player gets a personal plot where their tycoon operates.

**Plot features:**
- Fixed-size area (60x60 to 100x100 studs)
- Buy buttons on the ground that unlock machines/areas
- Progressive unlocking: starter area -> factory -> advanced machines
- Boundary walls with locked gates that open on purchase
- Personal spawn point within the plot

## Part Counts and Dimensions

### Dropper Machine (15-20 parts)
- Machine frame: 4 walls (Metal, 6x15x0.5 each)
- Roof: 1 part (Metal, 7x0.5x7)
- Ore spawner indicator: 1 part (Neon, 2x2x2 at top)
- Chute: 2 angled parts directing drops onto conveyor
- Support beams: 4 parts (Metal, 0.5x15x0.5)
- Smoke stack: cylinder (Metal, 2x8x2)
- Smoke effect parented to stack
- PointLight inside (warm glow)
- BillboardGui showing drop rate

### Conveyor Belt (6-8 parts per section)
- Belt surface: 1 part (Metal, 4x0.3x20)
- Side rails: 2 parts (Metal, 0.3x1x20)
- Support legs: 4 parts (Metal, 0.5x3x0.5)
- Arrow markings: 3 thin parts (Neon, indicating direction)

### Collector/Sell Pad (8-10 parts)
- Collection platform: 1 part (8x0.5x8)
- Neon border: 4 thin parts around edge (Neon, green/gold)
- Display stand: 1 part (Metal, 2x4x0.5)
- SurfaceGui showing cash earned
- ParticleEmitter for coin effects on collection
- PointLight (green glow)

### Buy Button (5-6 parts each)
- Pad: 1 part (6x0.3x6, green Neon when affordable, red when not)
- Stand: 1 cylinder (Metal, 1x3x1)
- BillboardGui: price display ("$500 — Speed Boost")
- ProximityPrompt for purchase
- Sparkles effect (when affordable)

### Rebirth Portal (10-12 parts)
- Arch frame: 3 parts (Marble or Neon, forming U-shape)
- Inner glow: 1 part (Neon, Transparency 0.3, fills arch)
- Base platform: 1 part (Marble, 8x0.5x8)
- Decorative pillars: 2 cylinders (Marble, 2x10x2)
- ParticleEmitter (sparkles/stars)
- PointLight (bright, colorful)
- BillboardGui (rebirth cost + multiplier display)
- ProximityPrompt to initiate rebirth

## Complete Working Tycoon Code

```lua
--!strict
-- [ServerScriptService/TycoonServer]
-- Complete Tycoon System — Server Script
local Players = game:GetService("Players")
local RS = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local DataStoreService = game:GetService("DataStoreService")

local tycoonStore = DataStoreService:GetDataStore("TycoonData_v2")

-- ── CONFIG ────────────────────────────────────────────────────────────────
local CONFIG = table.freeze({
  BASE_DROP_INTERVAL = 2.0,
  BASE_DROP_VALUE = 5,
  CONVEYOR_SPEED = 15,
  DROP_LIFETIME = 15,
  REBIRTH_BASE_COST = 100000,
  REBIRTH_MULTIPLIER_STEP = 0.5,
  MAX_REBIRTHS = 50,
  PLOT_SIZE = 60,
})

type TycoonData = {
  cash: number,
  totalEarned: number,
  rebirths: number,
  upgrades: { [string]: number },
}

type Upgrade = {
  name: string,
  baseCost: number,
  costMultiplier: number,
  maxLevel: number,
  effect: string,
}

local UPGRADES: { Upgrade } = {
  { name = "DropSpeed",   baseCost = 100,   costMultiplier = 2.5, maxLevel = 10, effect = "dropInterval" },
  { name = "DropValue",   baseCost = 200,   costMultiplier = 3.0, maxLevel = 10, effect = "dropValue" },
  { name = "ConveyorSpeed", baseCost = 500, costMultiplier = 2.0, maxLevel = 5,  effect = "conveyorSpeed" },
  { name = "LuckyDrop",   baseCost = 5000,  costMultiplier = 4.0, maxLevel = 5,  effect = "luckyChance" },
}

-- ── PLAYER DATA ──────────────────────────────────────────────────────────
local playerData: { [number]: TycoonData } = {}

local DEFAULT_DATA: TycoonData = {
  cash = 0,
  totalEarned = 0,
  rebirths = 0,
  upgrades = {},
}

local function loadPlayerData(player: Player): TycoonData
  local success, data = pcall(function()
    return tycoonStore:GetAsync("tycoon_" .. player.UserId)
  end)
  if success and type(data) == "table" then
    local result = table.clone(DEFAULT_DATA)
    result.cash = data.cash or 0
    result.totalEarned = data.totalEarned or 0
    result.rebirths = data.rebirths or 0
    result.upgrades = data.upgrades or {}
    return result
  end
  return table.clone(DEFAULT_DATA)
end

local function savePlayerData(player: Player)
  local data = playerData[player.UserId]
  if not data then return end
  pcall(function()
    tycoonStore:SetAsync("tycoon_" .. player.UserId, data)
  end)
end

-- ── TYCOON MECHANICS ─────────────────────────────────────────────────────
local function getUpgradeCost(upgrade: Upgrade, currentLevel: number): number
  return math.floor(upgrade.baseCost * (upgrade.costMultiplier ^ currentLevel))
end

local function getRebirthMultiplier(rebirths: number): number
  return 1 + (rebirths * CONFIG.REBIRTH_MULTIPLIER_STEP)
end

local function getDropInterval(data: TycoonData): number
  local level = data.upgrades["DropSpeed"] or 0
  return CONFIG.BASE_DROP_INTERVAL * (0.85 ^ level)
end

local function getDropValue(data: TycoonData): number
  local level = data.upgrades["DropValue"] or 0
  local rebirthMult = getRebirthMultiplier(data.rebirths)
  local baseValue = CONFIG.BASE_DROP_VALUE * (1.5 ^ level) * rebirthMult
  -- Lucky drop check
  local luckyLevel = data.upgrades["LuckyDrop"] or 0
  local luckyChance = luckyLevel * 0.05
  if math.random() < luckyChance then
    baseValue *= 10
  end
  return math.floor(baseValue)
end

-- ── REMOTES ──────────────────────────────────────────────────────────────
local buyUpgradeRemote = Instance.new("RemoteEvent")
buyUpgradeRemote.Name = "BuyUpgrade"
buyUpgradeRemote.Parent = RS

local rebirthRemote = Instance.new("RemoteEvent")
rebirthRemote.Name = "Rebirth"
rebirthRemote.Parent = RS

local updateCashRemote = Instance.new("RemoteEvent")
updateCashRemote.Name = "UpdateCash"
updateCashRemote.Parent = RS

local collectRemote = Instance.new("RemoteEvent")
collectRemote.Name = "CollectDrop"
collectRemote.Parent = RS

-- ── BUY UPGRADE ──────────────────────────────────────────────────────────
buyUpgradeRemote.OnServerEvent:Connect(function(player: Player, upgradeName: string)
  if type(upgradeName) ~= "string" then return end
  local data = playerData[player.UserId]
  if not data then return end

  local upgrade: Upgrade? = nil
  for _, u in UPGRADES do
    if u.name == upgradeName then
      upgrade = u
      break
    end
  end
  if not upgrade then return end

  local currentLevel = data.upgrades[upgradeName] or 0
  if currentLevel >= upgrade.maxLevel then return end

  local cost = getUpgradeCost(upgrade, currentLevel)
  if data.cash < cost then return end

  data.cash -= cost
  data.upgrades[upgradeName] = currentLevel + 1

  updateCashRemote:FireClient(player, data.cash)
  savePlayerData(player)
end)

-- ── REBIRTH ──────────────────────────────────────────────────────────────
rebirthRemote.OnServerEvent:Connect(function(player: Player)
  local data = playerData[player.UserId]
  if not data then return end

  local cost = CONFIG.REBIRTH_BASE_COST * (2 ^ data.rebirths)
  if data.totalEarned < cost then return end
  if data.rebirths >= CONFIG.MAX_REBIRTHS then return end

  data.rebirths += 1
  data.cash = 0
  data.totalEarned = 0
  data.upgrades = {}

  updateCashRemote:FireClient(player, data.cash)
  savePlayerData(player)
end)

-- ── DROPPER LOOP ─────────────────────────────────────────────────────────
local function startDropperLoop(player: Player, dropperPart: Part, conveyorPart: Part, collectorPart: Part)
  task.spawn(function()
    while player.Parent and playerData[player.UserId] do
      local data = playerData[player.UserId]
      if not data then break end

      local interval = getDropInterval(data)
      task.wait(interval)

      -- Spawn drop
      local drop = Instance.new("Part")
      drop.Name = "TycoonDrop"
      drop.Size = Vector3.new(1.5, 1.5, 1.5)
      drop.Material = Enum.Material.Neon
      drop.Color = Color3.fromRGB(255, 200, 50)
      drop.Shape = Enum.PartType.Ball
      drop.CFrame = dropperPart.CFrame - Vector3.new(0, 3, 0)
      drop.Anchored = false
      drop.Parent = workspace

      -- Set value attribute
      local value = getDropValue(data)
      drop:SetAttribute("Value", value)
      drop:SetAttribute("Owner", player.UserId)

      -- Push toward collector
      local direction = (collectorPart.Position - dropperPart.Position).Unit
      local bv = Instance.new("BodyVelocity")
      bv.Velocity = direction * CONFIG.CONVEYOR_SPEED + Vector3.new(0, 0, 0)
      bv.MaxForce = Vector3.new(1e4, 0, 1e4)
      bv.Parent = drop

      -- Auto-cleanup after lifetime
      task.delay(CONFIG.DROP_LIFETIME, function()
        if drop and drop.Parent then
          drop:Destroy()
        end
      end)
    end
  end)
end

-- ── COLLECTOR ────────────────────────────────────────────────────────────
local function setupCollector(collectorPart: Part)
  collectorPart.Touched:Connect(function(hit: BasePart)
    if hit.Name ~= "TycoonDrop" then return end
    local value: number = hit:GetAttribute("Value") or 0
    local ownerId: number = hit:GetAttribute("Owner") or 0

    local player = Players:GetPlayerByUserId(ownerId)
    if not player then
      hit:Destroy()
      return
    end

    local data = playerData[ownerId]
    if data then
      data.cash += value
      data.totalEarned += value
      updateCashRemote:FireClient(player, data.cash)
    end

    hit:Destroy()
  end)
end

-- ── PLAYER SETUP ─────────────────────────────────────────────────────────
Players.PlayerAdded:Connect(function(player: Player)
  local data = loadPlayerData(player)
  playerData[player.UserId] = data

  -- Create leaderstats
  local leaderstats = Instance.new("Folder")
  leaderstats.Name = "leaderstats"
  leaderstats.Parent = player

  local cashStat = Instance.new("IntValue")
  cashStat.Name = "Cash"
  cashStat.Value = data.cash
  cashStat.Parent = leaderstats

  local rebirthStat = Instance.new("IntValue")
  rebirthStat.Name = "Rebirths"
  rebirthStat.Value = data.rebirths
  rebirthStat.Parent = leaderstats

  updateCashRemote:FireClient(player, data.cash)
end)

Players.PlayerRemoving:Connect(function(player: Player)
  savePlayerData(player)
  playerData[player.UserId] = nil
end)

-- Auto-save every 120 seconds
task.spawn(function()
  while true do
    task.wait(120)
    for _, player in Players:GetPlayers() do
      savePlayerData(player)
    end
  end
end)

-- ── SHUTDOWN SAVE ────────────────────────────────────────────────────────
game:BindToClose(function()
  for _, player in Players:GetPlayers() do
    savePlayerData(player)
  end
end)
```

## Tycoon World Builder (Visual Parts)

For building the physical tycoon environment, generate 50-70 parts:

**Spawn Area (10 parts):**
- Spawn platform (20x1x20, Grass)
- SpawnLocation on top
- Welcome sign (SurfaceGui with game name)
- Path from spawn to plot (4 wide, Concrete)
- Decorative trees (2-3)
- Lamp posts (2)

**Dropper Machine (15 parts):**
- Factory walls (4 walls, Metal/Concrete)
- Roof with smokestack
- Ore chute (angled parts)
- Indicator lights (Glass + PointLight)
- Base platform

**Conveyor Run (8 parts):**
- Belt surface (Metal, long)
- Side rails
- Support legs every 10 studs
- Direction arrows (Neon thin parts)

**Collector Area (8 parts):**
- Collection pad (Neon, gold/green)
- Border trim
- Cash counter display (SurfaceGui)
- Coin particle effects

**Shop/Upgrade Area (15 parts):**
- Shop building (walls, roof, door)
- Upgrade pedestals (3-5, each with BillboardGui)
- ProximityPrompts on each pedestal
- Interior lighting

**Rebirth Portal (8 parts):**
- Ornate arch (Marble)
- Glowing center (Neon, Transparency 0.3)
- Particle effects
- Cost display (BillboardGui)

## Design Tips

1. **Immediate feedback** — players should see cash increasing within 5 seconds of spawning
2. **Visual progression** — upgrades should change the environment (bigger machines, glowing effects)
3. **Clear pathing** — obvious routes between dropper, conveyor, collector, and shop
4. **Price visibility** — BillboardGuis on everything showing costs
5. **Satisfying collection** — coin particle effects, cash-register sounds on collection
6. **Rebirth reward clarity** — show exactly what multiplier they'll get before rebirthing
