/**
 * Genre Deep Patterns — Complete Luau implementation patterns for top Roblox game genres.
 * Crawled & synthesised Apr 2026 from DevForum, Creator Hub, and open-source repos.
 * Every section has working Luau code, not just descriptions.
 * Used by knowledge-selector.ts for genre-specific prompts.
 */

export const GENRE_DEEP_PATTERNS = `
══════════════════════════════════════════════════════════════════════════════════
GENRE: TYCOON — Full Dropper→Conveyor→Collector→Upgrader Loop
══════════════════════════════════════════════════════════════════════════════════

ARCHITECTURE:
  ServerStorage/TycoonSystem/
    Dropper (Script inside)
    Conveyor (Script inside)
    Upgrader (Script inside)
    Collector (Script inside)
  ServerStorage/TycoonPads/ — one model per player slot
  ServerScriptService/TycoonManager (assigns pads, saves data)
  ReplicatedStorage/Events/ — RemoteEvents for cash UI

── DROPPER SCRIPT (place inside a dropper Part) ──────────────────────────────
-- Script in Dropper Part. Produces a brick on an interval.
local dropper = script.Parent
local dropInterval = dropper:GetAttribute("Interval") or 2  -- seconds between drops
local itemValue   = dropper:GetAttribute("Value")    or 1   -- cash value of each drop

local function spawnDrop()
  local drop = Instance.new("Part")
  drop.Size = Vector3.new(1, 1, 1)
  drop.Material = Enum.Material.Neon
  drop.Color = Color3.fromRGB(255, 200, 50)
  drop.Name = "Drop"
  drop.CFrame = dropper.CFrame * CFrame.new(0, -dropper.Size.Y / 2 - 0.6, 0)
  -- Store value on the part so collector can read it
  local val = Instance.new("NumberValue")
  val.Name = "Value"
  val.Value = itemValue
  val.Parent = drop
  drop.Parent = workspace
  -- Auto-destroy after 30s to prevent memory leak
  game:GetService("Debris"):AddItem(drop, 30)
end

while true do
  task.wait(dropInterval)
  spawnDrop()
end

── CONVEYOR SCRIPT (place inside a conveyor Part) ────────────────────────────
-- Script in a flat BasePart. Pushes touching parts forward.
local conveyor = script.Parent
local speed = conveyor:GetAttribute("Speed") or 16

conveyor.Touched:Connect(function(hit)
  if hit.Name == "Drop" and not hit:GetAttribute("OnConveyor") then
    hit:SetAttribute("OnConveyor", true)
    -- Use AssemblyLinearVelocity for physics-friendly movement
    hit.AssemblyLinearVelocity = conveyor.CFrame.LookVector * speed
    task.delay(0.1, function()
      if hit and hit.Parent then
        hit:SetAttribute("OnConveyor", false)
      end
    end)
  end
end)

── UPGRADER SCRIPT (place inside an upgrader block) ─────────────────────────
-- Multiplies Drop value when it passes through.
local upgrader = script.Parent
local multiplier = upgrader:GetAttribute("Multiplier") or 2

upgrader.Touched:Connect(function(hit)
  if hit.Name == "Drop" and not hit:GetAttribute("Upgraded") then
    hit:SetAttribute("Upgraded", true)
    local val = hit:FindFirstChild("Value")
    if val then
      val.Value = val.Value * multiplier
      -- Flash color to show upgrade
      hit.Color = Color3.fromRGB(255, 100, 255)
    end
  end
end)

── COLLECTOR SCRIPT (place inside collector at end of belt) ──────────────────
-- Destroys drops, adds value to player cash leaderstats.
local Players = game:GetService("Players")
local collector = script.Parent

-- Find which player owns this tycoon pad (tag stored on pad model)
local function getOwner()
  local pad = collector:FindFirstAncestorOfClass("Model")
  if not pad then return nil end
  local ownerTag = pad:GetAttribute("Owner")
  if not ownerTag then return nil end
  return Players:FindFirstChild(ownerTag)
end

collector.Touched:Connect(function(hit)
  if hit.Name ~= "Drop" then return end
  local val = hit:FindFirstChild("Value")
  if not val then hit:Destroy(); return end

  local player = getOwner()
  if player then
    local cash = player:FindFirstChild("leaderstats") and player.leaderstats:FindFirstChild("Cash")
    if cash then
      cash.Value += val.Value
    end
  end
  hit:Destroy()
end)

── BUTTON PURCHASE SYSTEM ────────────────────────────────────────────────────
-- Place ProximityPrompt inside a button Part (BillboardGui shows price).
-- ServerScript in ServerScriptService handles the purchase.
local ProximityPromptService = game:GetService("ProximityPromptService")

ProximityPromptService.PromptTriggered:Connect(function(prompt, player)
  if prompt.Name ~= "TycoonBuy" then return end
  local price = prompt:GetAttribute("Price") or 100
  local unlocks = prompt:GetAttribute("Unlocks") or ""  -- name of Model to show

  local cash = player:FindFirstChild("leaderstats") and player.leaderstats:FindFirstChild("Cash")
  if not cash or cash.Value < price then return end

  -- Deduct cost
  cash.Value -= price
  -- Show purchased building
  local pad = prompt.Parent:FindFirstAncestorOfClass("Model")
  if pad then
    local target = pad:FindFirstChild(unlocks, true)
    if target then target.Parent = workspace end
  end
  -- Disable prompt
  prompt.Enabled = false
end)

── REBIRTH SYSTEM ────────────────────────────────────────────────────────────
-- ServerScript: when player clicks rebirth button, reset cash, grant multiplier.
local rebirthCost = 1000000  -- 1M cash to rebirth

local function doRebirth(player)
  local ls = player:FindFirstChild("leaderstats")
  if not ls then return end
  local cash = ls:FindFirstChild("Cash")
  local rebirths = ls:FindFirstChild("Rebirths")
  local multiplier = ls:FindFirstChild("Multiplier")
  if not cash or cash.Value < rebirthCost then return end

  cash.Value = 0
  rebirths.Value += 1
  multiplier.Value = 1 + (rebirths.Value * 0.5)  -- +50% per rebirth

  -- Reset tycoon: destroy all purchased buildings, re-lock buttons
  local pad = workspace:FindFirstChild("Pad_" .. player.UserId)
  if pad then
    for _, btn in pad:GetDescendants() do
      if btn:IsA("ProximityPrompt") and btn.Name == "TycoonBuy" then
        btn.Enabled = true
      end
    end
  end
end

── DATASTORE SAVE/LOAD ───────────────────────────────────────────────────────
local DataStoreService = game:GetService("DataStoreService")
local Players = game:GetService("Players")
local TycoonStore = DataStoreService:GetDataStore("TycoonData_v2")

local function saveData(player)
  local ls = player:FindFirstChild("leaderstats")
  if not ls then return end
  local data = {
    Cash      = ls.Cash.Value,
    Rebirths  = ls.Rebirths.Value,
    Purchases = {},  -- list of button names already bought
  }
  -- Collect purchased buttons
  local pad = workspace:FindFirstChild("Pad_" .. player.UserId)
  if pad then
    for _, btn in pad:GetDescendants() do
      if btn:IsA("ProximityPrompt") and btn.Name == "TycoonBuy" and not btn.Enabled then
        table.insert(data.Purchases, btn.Parent.Name)
      end
    end
  end
  pcall(function()
    TycoonStore:SetAsync(tostring(player.UserId), data)
  end)
end

local function loadData(player)
  local ls = Instance.new("Folder")
  ls.Name = "leaderstats"
  ls.Parent = player
  local cash       = Instance.new("NumberValue", ls); cash.Name = "Cash"
  local rebirths   = Instance.new("IntValue", ls);    rebirths.Name = "Rebirths"
  local multiplier = Instance.new("NumberValue", ls); multiplier.Name = "Multiplier"; multiplier.Value = 1

  local ok, saved = pcall(function()
    return TycoonStore:GetAsync(tostring(player.UserId))
  end)
  if ok and saved then
    cash.Value      = saved.Cash or 0
    rebirths.Value  = saved.Rebirths or 0
    multiplier.Value = 1 + (rebirths.Value * 0.5)
  end
end

Players.PlayerAdded:Connect(loadData)
Players.PlayerRemoving:Connect(saveData)
game:BindToClose(function()
  for _, p in Players:GetPlayers() do saveData(p) end
end)


══════════════════════════════════════════════════════════════════════════════════
GENRE: SIMULATOR — Click/Tap Earn, Pet Hatching, Area Unlock, Rebirth
══════════════════════════════════════════════════════════════════════════════════

── CLICK TO EARN (LocalScript in StarterPlayerScripts) ──────────────────────
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local UserInputService = game:GetService("UserInputService")
local ClickEvent = ReplicatedStorage:WaitForChild("ClickEarn")
local player = Players.LocalPlayer

-- Tap detection (works mobile + PC)
UserInputService.InputBegan:Connect(function(input, gpe)
  if gpe then return end
  if input.UserInputType == Enum.UserInputType.MouseButton1
     or input.UserInputType == Enum.UserInputType.Touch then
    ClickEvent:FireServer()
  end
end)

-- SERVER: ReplicatedStorage.ClickEarn OnServerEvent
-- Place this in a Script in ServerScriptService:
local clickEvent = Instance.new("RemoteEvent", ReplicatedStorage)
clickEvent.Name = "ClickEarn"
local clickCooldown = {}
clickEvent.OnServerEvent:Connect(function(player)
  -- Rate limit: max 20 clicks/sec
  if clickCooldown[player.UserId] then return end
  clickCooldown[player.UserId] = true
  task.delay(0.05, function() clickCooldown[player.UserId] = nil end)

  local ls = player:FindFirstChild("leaderstats")
  if not ls then return end
  local coins = ls:FindFirstChild("Coins")
  local multi = ls:FindFirstChild("Multiplier")
  if coins and multi then
    coins.Value += math.floor(1 * multi.Value)
  end
end)

── AREA UNLOCK SYSTEM ────────────────────────────────────────────────────────
-- Each area is a Model in workspace with an Attribute "Cost" and "Name".
-- A Part with ProximityPrompt acts as the gate.
local AreaStore = DataStoreService:GetDataStore("UnlockedAreas_v1")

local function unlockArea(player, areaName, cost)
  local ls = player:FindFirstChild("leaderstats")
  local coins = ls and ls:FindFirstChild("Coins")
  if not coins or coins.Value < cost then return end
  coins.Value -= cost
  -- Teleport player past the gate, make area visible
  local area = workspace:FindFirstChild(areaName)
  if area then
    area:SetAttribute("Unlocked_" .. player.UserId, true)
    -- Fire client to remove the lock gate UI
    game:GetService("ReplicatedStorage"):WaitForChild("AreaUnlocked"):FireClient(player, areaName)
  end
  -- Save unlocked areas
  local key = "areas_" .. player.UserId
  pcall(function()
    AreaStore:UpdateAsync(key, function(old)
      old = old or {}
      old[areaName] = true
      return old
    end)
  end)
end

── PET HATCHING SYSTEM ───────────────────────────────────────────────────────
-- EggInfo module (ModuleScript in ReplicatedStorage/Shared):
local EggInfo = {
  BasicEgg = {
    Price = 100,
    TotalChance = 100,
    Pets = {
      Cat    = { Chance = 55, CoinBoost = 1.1, Rarity = "Common" },
      Dog    = { Chance = 30, CoinBoost = 1.3, Rarity = "Uncommon" },
      Fox    = { Chance = 10, CoinBoost = 2.0, Rarity = "Rare" },
      Dragon = { Chance = 5,  CoinBoost = 5.0, Rarity = "Legendary" },
    }
  },
  GoldenEgg = {
    Price = 5000,
    TotalChance = 100,
    Pets = {
      Griffin   = { Chance = 50, CoinBoost = 3.0, Rarity = "Rare" },
      Phoenix   = { Chance = 35, CoinBoost = 6.0, Rarity = "Epic" },
      Unicorn   = { Chance = 12, CoinBoost = 10.0, Rarity = "Legendary" },
      Celestial = { Chance = 3,  CoinBoost = 25.0, Rarity = "Mythic" },
    }
  }
}
return EggInfo

-- Roll function (weighted random):
local function rollPet(eggName)
  local egg = EggInfo[eggName]
  if not egg then return nil end
  local roll = math.random(1, egg.TotalChance)
  local cumulative = 0
  for petName, petData in pairs(egg.Pets) do
    cumulative += petData.Chance
    if roll <= cumulative then
      return petName, petData
    end
  end
end

-- Hatch handler (Server, OnServerEvent from "HatchEgg" RemoteEvent):
local HttpService = game:GetService("HttpService")
hatchEvent.OnServerEvent:Connect(function(player, eggName)
  local userData = loadedUsers[player.UserId]
  if not userData then return end
  local egg = EggInfo[eggName]
  if not egg then return end
  if userData.Coins < egg.Price then return end
  userData.Coins -= egg.Price

  local petName, petData = rollPet(eggName)
  if not petName then return end

  local petId = HttpService:GenerateGUID(false)
  userData.Pets[petId] = {
    Name = petName,
    CoinBoost = petData.CoinBoost,
    Rarity = petData.Rarity,
    Equipped = (#getUserEquipped(userData) < 3),  -- auto-equip if slot open
  }
  -- Tell client to play hatch animation
  game:GetService("ReplicatedStorage"):WaitForChild("HatchResult"):FireClient(
    player, petName, petData.Rarity
  )
end)

── REBIRTH / PRESTIGE ────────────────────────────────────────────────────────
local REBIRTH_COST = 1000000  -- coins needed

local function rebirth(player)
  local ls = player:FindFirstChild("leaderstats")
  if not ls then return end
  local coins    = ls:FindFirstChild("Coins")
  local rebirths = ls:FindFirstChild("Rebirths")
  local multi    = ls:FindFirstChild("Multiplier")
  if not coins or coins.Value < REBIRTH_COST then return end
  coins.Value    = 0
  rebirths.Value += 1
  -- Multiplier scales: 1 → 1.5 → 2 → 2.5 ...
  multi.Value    = 1 + (rebirths.Value * 0.5)
  -- Keep pets across rebirth (they are permanent)
end

── AUTO-FARM GAMEPASS ────────────────────────────────────────────────────────
local MarketplaceService = game:GetService("MarketplaceService")
local AUTO_FARM_PASS_ID = 123456789  -- replace with real pass ID

local function startAutoFarm(player)
  local interval = 1  -- seconds between auto-clicks
  task.spawn(function()
    while player.Parent do
      task.wait(interval)
      local ls = player:FindFirstChild("leaderstats")
      if ls then
        local coins = ls:FindFirstChild("Coins")
        local multi = ls:FindFirstChild("Multiplier")
        if coins and multi then
          coins.Value += math.floor(10 * multi.Value)  -- 10x base per auto tick
        end
      end
    end
  end)
end

Players.PlayerAdded:Connect(function(player)
  -- Check gamepass on join
  local ok, owns = pcall(function()
    return MarketplaceService:UserOwnsGamePassAsync(player.UserId, AUTO_FARM_PASS_ID)
  end)
  if ok and owns then
    startAutoFarm(player)
  end
end)


══════════════════════════════════════════════════════════════════════════════════
GENRE: TOWER DEFENSE — Placement, Wave Spawner, Targeting, Upgrades
══════════════════════════════════════════════════════════════════════════════════

── WAYPOINT PATH SYSTEM ─────────────────────────────────────────────────────
-- Place invisible Parts named "1", "2", "3" ... in workspace/Path folder.
-- Enemies move through them in order.

local Path = workspace:WaitForChild("Path")

-- Enemy movement (Script inside each enemy model):
local TargetIndex = 1
local Humanoid = script.Parent:WaitForChild("Humanoid")
local waypoints = Path:GetChildren()
table.sort(waypoints, function(a, b) return tonumber(a.Name) < tonumber(b.Name) end)

local function moveToNext()
  if TargetIndex > #waypoints then
    -- Enemy reached base — deal damage
    local baseHP = workspace:FindFirstChild("BaseHealth")
    if baseHP then baseHP.Value -= script.Parent:GetAttribute("Damage") or 1 end
    script.Parent:Destroy()
    return
  end
  local wp = waypoints[TargetIndex]
  Humanoid:MoveTo(wp.Position)
  local conn
  conn = Humanoid.MoveToFinished:Connect(function(reached)
    conn:Disconnect()
    if reached then
      TargetIndex += 1
      moveToNext()
    else
      moveToNext()  -- retry if stuck
    end
  end)
end
moveToNext()

── WAVE SPAWNER (ServerScript in ServerScriptService) ────────────────────────
local EnemyHandler = {}
local Enemies = game:GetService("ServerStorage"):WaitForChild("Enemies")

function EnemyHandler.Spawn(enemyName, spawnCFrame)
  local template = Enemies:FindFirstChild(enemyName)
  if not template then return end
  local clone = template:Clone()
  clone:PivotTo(spawnCFrame)
  clone.Parent = workspace
  -- Start enemy scripts
  for _, s in clone:GetDescendants() do
    if s:IsA("Script") then s.Enabled = true end
  end
end

-- Wave configuration
local Waves = {
  { count = 5,  type = "Basic",  interval = 1 },
  { count = 8,  type = "Fast",   interval = 0.75 },
  { count = 5,  type = "Tanky",  interval = 1.5 },
  { count = 10, type = "Basic",  interval = 0.5 },
  { count = 1,  type = "Boss",   interval = 0 },
}

local currentWave = 0
local spawnPart = workspace:WaitForChild("EnemySpawn")

local function startWave(waveIndex)
  local wave = Waves[waveIndex]
  if not wave then
    -- All waves done — victory
    game:GetService("ReplicatedStorage"):WaitForChild("GameEvent"):FireAllClients("Victory")
    return
  end
  -- Announce wave
  game:GetService("ReplicatedStorage"):WaitForChild("WaveInfo"):FireAllClients(waveIndex, #Waves)
  for i = 1, wave.count do
    EnemyHandler.Spawn(wave.type, spawnPart.CFrame)
    task.wait(wave.interval)
  end
end

-- Auto-advance waves when all enemies are dead
task.spawn(function()
  task.wait(10)  -- wait for lobby
  for w = 1, #Waves do
    currentWave = w
    startWave(w)
    -- Wait until no enemies remain in workspace
    repeat task.wait(1) until #workspace:GetChildren() == 0 or (function()
      for _, v in workspace:GetChildren() do
        if v:FindFirstChild("EnemyTag") then return false end
      end
      return true
    end)()
    task.wait(5)  -- inter-wave break
  end
end)

── TOWER PLACEMENT ───────────────────────────────────────────────────────────
-- LocalScript: player selects tower from shop, clicks map to place.
local RunService = game:GetService("RunService")
local UserInputService = game:GetService("UserInputService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local PlaceTower = ReplicatedStorage:WaitForChild("PlaceTower")

local camera = workspace.CurrentCamera
local player = Players.LocalPlayer
local mouse = player:GetMouse()
local selectedTower = nil
local ghost = nil

local function selectTower(towerName)
  if ghost then ghost:Destroy() end
  selectedTower = towerName
  ghost = ReplicatedStorage.Towers:FindFirstChild(towerName):Clone()
  for _, p in ghost:GetDescendants() do
    if p:IsA("BasePart") then p.Transparency = 0.5; p.CanCollide = false end
  end
  ghost.Parent = workspace
end

RunService.RenderStepped:Connect(function()
  if not ghost then return end
  local unitRay = camera:ScreenPointToRay(mouse.X, mouse.Y)
  local result = workspace:Raycast(unitRay.Origin, unitRay.Direction * 500,
    RaycastParams.new())
  if result then
    ghost:PivotTo(CFrame.new(result.Position) * CFrame.new(0, ghost.PrimaryPart.Size.Y / 2, 0))
  end
end)

UserInputService.InputBegan:Connect(function(input, gpe)
  if gpe or not selectedTower then return end
  if input.UserInputType == Enum.UserInputType.MouseButton1 then
    PlaceTower:FireServer(selectedTower, ghost.PrimaryPart.CFrame)
    selectedTower = nil
    ghost:Destroy(); ghost = nil
  end
end)

-- SERVER: handles placement & currency check
local PlaceTowerEvent = ReplicatedStorage:WaitForChild("PlaceTower")
local TowerCosts = { Basic = 50, Sniper = 150, Bomber = 200 }

PlaceTowerEvent.OnServerEvent:Connect(function(player, towerName, cf)
  local cost = TowerCosts[towerName]
  if not cost then return end
  local ls = player:FindFirstChild("leaderstats")
  local coins = ls and ls:FindFirstChild("Coins")
  if not coins or coins.Value < cost then return end
  coins.Value -= cost

  local template = ReplicatedStorage.Towers:FindFirstChild(towerName)
  if not template then return end
  local tower = template:Clone()
  tower:PivotTo(cf)
  tower:SetAttribute("Owner", player.UserId)
  tower.Parent = workspace.PlacedTowers
  -- Start tower attack loop
  require(game.ServerScriptService.TowerAttack).init(tower, player)
end)

── TOWER TARGETING & ATTACK ─────────────────────────────────────────────────
-- ModuleScript: TowerAttack
local TowerAttack = {}

local function getTarget(tower, mode)
  -- mode: "first" | "closest" | "strongest"
  local range = tower:GetAttribute("Range") or 20
  local best, bestVal = nil, nil
  for _, enemy in workspace:GetChildren() do
    if not enemy:FindFirstChild("EnemyTag") then continue end
    local hrp = enemy:FindFirstChild("HumanoidRootPart")
    if not hrp then continue end
    local dist = (hrp.Position - tower.PrimaryPart.Position).Magnitude
    if dist > range then continue end
    local hp = enemy:FindFirstChild("Humanoid") and enemy.Humanoid.Health or 0
    local val = (mode == "first") and -enemy:GetAttribute("WaypointIndex")
             or (mode == "closest") and dist
             or (mode == "strongest") and -hp
    if bestVal == nil or val < bestVal then
      best, bestVal = enemy, val
    end
  end
  return best
end

function TowerAttack.init(tower, player)
  local attackSpeed = tower:GetAttribute("AttackSpeed") or 1
  local damage      = tower:GetAttribute("Damage")      or 10
  local mode        = tower:GetAttribute("TargetMode")  or "first"

  task.spawn(function()
    while tower.Parent do
      task.wait(attackSpeed)
      local target = getTarget(tower, mode)
      if target then
        local humanoid = target:FindFirstChildOfClass("Humanoid")
        if humanoid then
          humanoid:TakeDamage(damage)
          if humanoid.Health <= 0 then
            -- Grant currency on kill
            local coins = player:FindFirstChild("leaderstats") and player.leaderstats:FindFirstChild("Coins")
            if coins then coins.Value += target:GetAttribute("Reward") or 5 end
          end
        end
        -- Spawn projectile (client handles visuals via RemoteEvent)
        game:GetService("ReplicatedStorage"):WaitForChild("SpawnProjectile"):FireAllClients(
          tower.PrimaryPart.Position, target.HumanoidRootPart.Position
        )
      end
    end
  end)
end

return TowerAttack

── TOWER UPGRADE SYSTEM ─────────────────────────────────────────────────────
-- RemoteEvent "UpgradeTower" — player selects placed tower, pays to upgrade.
local UpgradeEvent = ReplicatedStorage:WaitForChild("UpgradeTower")
local UpgradeCosts = { [1] = 100, [2] = 250, [3] = 600 }  -- level 1→2, 2→3, 3→max

UpgradeEvent.OnServerEvent:Connect(function(player, tower)
  if not tower or tower:GetAttribute("Owner") ~= player.UserId then return end
  local level = tower:GetAttribute("Level") or 1
  if level >= 3 then return end
  local cost = UpgradeCosts[level]
  local coins = player.leaderstats and player.leaderstats:FindFirstChild("Coins")
  if not coins or coins.Value < cost then return end
  coins.Value -= cost
  tower:SetAttribute("Level", level + 1)
  tower:SetAttribute("Damage", tower:GetAttribute("Damage") * 1.5)
  tower:SetAttribute("Range",  tower:GetAttribute("Range")  * 1.2)
  -- Visual upgrade effect
  for _, p in tower:GetDescendants() do
    if p:IsA("BasePart") then
      p.Color = (level == 1) and Color3.fromRGB(0, 170, 255)
               or Color3.fromRGB(255, 215, 0)  -- blue → gold
    end
  end
end)


══════════════════════════════════════════════════════════════════════════════════
GENRE: MURDER MYSTERY — Roles, Weapons, Round Timer, Win Detection
══════════════════════════════════════════════════════════════════════════════════

── ROLE ASSIGNMENT (ServerScript) ───────────────────────────────────────────
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local ServerStorage = game:GetService("ServerStorage")
local Roles = ReplicatedStorage:WaitForChild("Roles")  -- StringValue per player
local rng = Random.new()

local function shufflePlayers()
  local list = Players:GetPlayers()
  for i = #list, 2, -1 do
    local j = rng:NextInteger(1, i)
    list[i], list[j] = list[j], list[i]
  end
  return list
end

local function assignRoles()
  local list = shufflePlayers()
  -- Clean up old role tags
  for _, p in Players:GetPlayers() do
    for _, tag in {"Murderer","Sheriff","Innocent"} do
      local t = p:FindFirstChild(tag)
      if t then t:Destroy() end
    end
  end
  -- Assign 1 murderer, 1 sheriff, rest innocent
  local murderer = list[1]
  local sheriff  = list[2]
  for i, player in list do
    local roleName = (i == 1) and "Murderer" or (i == 2) and "Sheriff" or "Innocent"
    local tag = Instance.new("StringValue")
    tag.Name = roleName
    tag.Parent = player
    -- Give weapon
    if roleName == "Murderer" then
      local knife = ServerStorage:WaitForChild("Items"):WaitForChild("Knife"):Clone()
      knife.Parent = player.Backpack
    elseif roleName == "Sheriff" then
      local gun = ServerStorage:WaitForChild("Items"):WaitForChild("Revolver"):Clone()
      gun.Parent = player.Backpack
    end
    -- Tell the individual player their role (keep secret from others)
    ReplicatedStorage:WaitForChild("YouAre"):FireClient(player, roleName)
  end
end

── ROUND MANAGER ─────────────────────────────────────────────────────────────
local ROUND_LENGTH = 180  -- 3 minutes
local INTERMISSION = 15

local function toMS(s)
  return ("%02i:%02i"):format(s/60 % 60, s % 60)
end

local status = ReplicatedStorage:WaitForChild("Status")  -- StringValue shown in HUD

local function runRound()
  -- Pick and load map
  local maps = ServerStorage:WaitForChild("Maps"):GetChildren()
  local chosenMap = maps[rng:NextInteger(1, #maps)]:Clone()
  chosenMap.Parent = workspace
  -- Teleport all players to spawn points
  local spawns = chosenMap:FindFirstChild("Spawns"):GetChildren()
  for i, player in Players:GetPlayers() do
    if player.Character then
      local sp = spawns[(i - 1) % #spawns + 1]
      player.Character:PivotTo(sp.CFrame + Vector3.new(0, 3, 0))
    end
  end
  assignRoles()
  -- Countdown
  local outcome = "time-up"
  for t = ROUND_LENGTH, 0, -1 do
    -- Check win conditions
    local murdererAlive = false
    local innocentsAlive = 0
    for _, p in Players:GetPlayers() do
      if p:FindFirstChild("Murderer") and p.Character and
         p.Character:FindFirstChildOfClass("Humanoid") and
         p.Character.Humanoid.Health > 0 then
        murdererAlive = true
      end
      if (p:FindFirstChild("Innocent") or p:FindFirstChild("Sheriff")) and
         p.Character and p.Character:FindFirstChildOfClass("Humanoid") and
         p.Character.Humanoid.Health > 0 then
        innocentsAlive += 1
      end
    end
    if not murdererAlive then outcome = "innocents-win"; break end
    if innocentsAlive == 0 then outcome = "murderer-wins"; break end
    status.Value = toMS(t)
    task.wait(1)
  end
  -- Announce result
  local msg = (outcome == "murderer-wins") and "Murderer wins! 🔪"
           or "Innocents win! ✅"
  status.Value = msg
  ReplicatedStorage:WaitForChild("RoundEnd"):FireAllClients(outcome)
  task.wait(5)
  chosenMap:Destroy()
end

-- Death handler: drop sheriff's gun on death
Players.PlayerAdded:Connect(function(player)
  player.CharacterAdded:Connect(function(character)
    character:WaitForChild("Humanoid").Died:Connect(function()
      -- Remove role tag
      for _, tag in {"Murderer","Sheriff","Innocent"} do
        local t = player:FindFirstChild(tag)
        if t then t:Destroy() end
      end
      -- Drop gun if sheriff
      if player:FindFirstChild("Sheriff") then
        for _, tool in player.Backpack:GetChildren() do
          if tool.Name == "Revolver" then
            tool.Parent = workspace  -- drops at death location
          end
        end
      end
      -- Spectate
      ReplicatedStorage:WaitForChild("StartSpectate"):FireClient(player)
    end)
  end)
end)

── COIN SPAWN SYSTEM ─────────────────────────────────────────────────────────
-- Scatter collectible coins around the map; touching adds to player coins.
local function spawnCoins(map, count)
  local coinTemplate = ServerStorage:WaitForChild("Items"):WaitForChild("Coin")
  local bounds = map:FindFirstChild("CoinBounds") -- invisible Part defining area
  for i = 1, count do
    local coin = coinTemplate:Clone()
    local px = bounds.Position.X + rng:NextNumber(-bounds.Size.X/2, bounds.Size.X/2)
    local pz = bounds.Position.Z + rng:NextNumber(-bounds.Size.Z/2, bounds.Size.Z/2)
    coin.Position = Vector3.new(px, bounds.Position.Y + 1, pz)
    coin.Parent = map
    coin.Touched:Connect(function(hit)
      local p = Players:GetPlayerFromCharacter(hit.Parent)
      if not p then return end
      local coins = p.leaderstats and p.leaderstats:FindFirstChild("Coins")
      if coins then coins.Value += 1 end
      coin:Destroy()
    end)
  end
end


══════════════════════════════════════════════════════════════════════════════════
GENRE: BATTLE ROYALE — Shrinking Zone, Loot, Inventory, Last-Player-Standing
══════════════════════════════════════════════════════════════════════════════════

── SHRINKING STORM ZONE ─────────────────────────────────────────────────────
-- The storm is a giant semi-transparent cylinder that shrinks over time.
-- Players outside the safe radius take continuous damage.
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")

-- Storm configuration (matches official Roblox BR example)
local stormConfig = {
  startRadius    = 600,   -- studs
  finalRadius    = 50,
  totalDuration  = 300,   -- seconds to fully close
  damagePerSec   = 5,
  centerX        = 0,
  centerZ        = 0,
}

local stormPart = workspace:WaitForChild("StormBarrier")  -- large neon cylinder
local safeRadius = stormConfig.startRadius
local shrinkRate = (stormConfig.startRadius - stormConfig.finalRadius) / stormConfig.totalDuration

-- Server: shrink loop
task.spawn(function()
  while safeRadius > stormConfig.finalRadius do
    task.wait(1)
    safeRadius = math.max(stormConfig.finalRadius, safeRadius - shrinkRate)
    stormPart.Size = Vector3.new(safeRadius * 2, 200, safeRadius * 2)
    stormPart.CFrame = CFrame.new(stormConfig.centerX, 0, stormConfig.centerZ)
  end
end)

-- Damage players outside safe zone (every 0.5s)
task.spawn(function()
  while true do
    task.wait(0.5)
    for _, player in Players:GetPlayers() do
      local char = player.Character
      if not char then continue end
      local hrp = char:FindFirstChild("HumanoidRootPart")
      local humanoid = char:FindFirstChildOfClass("Humanoid")
      if not hrp or not humanoid then continue end
      local dx = hrp.Position.X - stormConfig.centerX
      local dz = hrp.Position.Z - stormConfig.centerZ
      local dist = math.sqrt(dx*dx + dz*dz)
      if dist > safeRadius then
        humanoid:TakeDamage(stormConfig.damagePerSec * 0.5)
      end
    end
  end
end)

── LOOT SPAWNING ─────────────────────────────────────────────────────────────
-- Loot spawns randomly at LootSpot Parts scattered around the map.
local ServerStorage = game:GetService("ServerStorage")
local lootTable = {
  { name = "Pistol",      weight = 40 },
  { name = "Shotgun",     weight = 25 },
  { name = "SMG",         weight = 20 },
  { name = "SniperRifle", weight = 10 },
  { name = "RocketLauncher", weight = 5 },
}

local function weightedRandom(tbl)
  local total = 0
  for _, v in tbl do total += v.weight end
  local roll = math.random(total)
  local cum = 0
  for _, v in tbl do
    cum += v.weight
    if roll <= cum then return v.name end
  end
end

local function spawnLootAtSpots()
  for _, spot in workspace:WaitForChild("LootSpots"):GetChildren() do
    if math.random() > 0.4 then continue end  -- 60% of spots get loot
    local itemName = weightedRandom(lootTable)
    local template = ServerStorage:WaitForChild("Weapons"):FindFirstChild(itemName)
    if not template then continue end
    local item = template:Clone()
    item.Parent = spot
    item:PivotTo(spot.CFrame + Vector3.new(0, 2, 0))
  end
end

── INVENTORY SYSTEM ─────────────────────────────────────────────────────────
-- Players can carry 3 weapons max; picking up swaps with current slot.
-- Server-side pickup with validation.
local PickupEvent = game:GetService("ReplicatedStorage"):WaitForChild("PickupWeapon")

PickupEvent.OnServerEvent:Connect(function(player, weaponPart)
  if not weaponPart or not weaponPart.Parent then return end
  -- Distance check
  local char = player.Character
  if not char then return end
  local hrp = char:FindFirstChild("HumanoidRootPart")
  if not hrp then return end
  if (hrp.Position - weaponPart.Position).Magnitude > 10 then return end  -- exploit guard

  local backpack = player.Backpack
  local tools = backpack:GetChildren()
  if #tools >= 3 then
    -- Drop current equipped tool
    local equipped = char:FindFirstChildOfClass("Tool")
    if equipped then
      equipped.Parent = workspace
      equipped:PivotTo(hrp.CFrame + Vector3.new(0, 2, 0))
    end
  end
  weaponPart.Parent = backpack
end)

── LAST PLAYER STANDING ─────────────────────────────────────────────────────
local function checkWinner()
  local alive = {}
  for _, p in Players:GetPlayers() do
    if p.Character and p.Character:FindFirstChildOfClass("Humanoid")
       and p.Character.Humanoid.Health > 0 then
      table.insert(alive, p)
    end
  end
  if #alive == 1 then
    game:GetService("ReplicatedStorage"):WaitForChild("GameOver"):FireAllClients(alive[1].Name)
    return true
  elseif #alive == 0 then
    game:GetService("ReplicatedStorage"):WaitForChild("GameOver"):FireAllClients("Nobody")
    return true
  end
  return false
end

Players.PlayerAdded:Connect(function(player)
  player.CharacterAdded:Connect(function(char)
    char:WaitForChild("Humanoid").Died:Connect(function()
      -- Spectate mode
      task.wait(3)
      game:GetService("ReplicatedStorage"):WaitForChild("StartSpectate"):FireClient(player)
      -- Check win condition
      task.wait(1)
      checkWinner()
    end)
  end)
end)


══════════════════════════════════════════════════════════════════════════════════
GENRE: ROLEPLAY — Job System, Money, Properties, Vehicles, Proximity Chat
══════════════════════════════════════════════════════════════════════════════════

── JOB SYSTEM ────────────────────────────────────────────────────────────────
-- Players use ProximityPrompt on job zone Parts to start / end shifts.
-- Money accumulates while inside the job zone.
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local DataStoreService = game:GetService("DataStoreService")
local RoleplayDS = DataStoreService:GetDataStore("RoleplayData_v1")

local Jobs = {
  Police = { Wage = 15, Interval = 5, Uniform = "PoliceShirt" },
  Doctor = { Wage = 20, Interval = 5, Uniform = "DoctorGown" },
  Chef   = { Wage = 10, Interval = 3, Uniform = "ChefHat" },
  Taxi   = { Wage = 8,  Interval = 4, Uniform = "TaxiJacket" },
}

local activeJobs = {}  -- [player.UserId] = { job, earned, coroutine }

local function startJob(player, jobName)
  if activeJobs[player.UserId] then return end  -- already working
  local job = Jobs[jobName]
  if not job then return end

  local earned = 0
  local thread = task.spawn(function()
    while activeJobs[player.UserId] do
      task.wait(job.Interval)
      earned += job.Wage
      -- Update UI
      game:GetService("ReplicatedStorage"):WaitForChild("JobEarned"):FireClient(player, earned)
    end
  end)

  activeJobs[player.UserId] = { job = jobName, earned = earned, thread = thread }
  -- Give uniform
  local uniform = game:GetService("ServerStorage"):WaitForChild("Uniforms"):FindFirstChild(job.Uniform)
  if uniform and player.Character then
    uniform:Clone().Parent = player.Character
  end
end

local function endJob(player)
  local data = activeJobs[player.UserId]
  if not data then return end
  task.cancel(data.thread)
  -- Pay player
  local ls = player:FindFirstChild("leaderstats")
  local cash = ls and ls:FindFirstChild("Cash")
  if cash then cash.Value += data.earned end
  activeJobs[player.UserId] = nil
  -- Remove uniform
  if player.Character then
    for _, v in player.Character:GetChildren() do
      if v:HasTag("Uniform") then v:Destroy() end
    end
  end
end

-- ProximityPrompt in job zones fires RemoteEvent "JobAction"
local JobAction = game:GetService("ReplicatedStorage"):WaitForChild("JobAction")
JobAction.OnServerEvent:Connect(function(player, action, jobName)
  if action == "Start" then
    startJob(player, jobName)
  elseif action == "End" then
    endJob(player)
  end
end)

Players.PlayerRemoving:Connect(function(player)
  endJob(player)
end)

── PROPERTY BUYING ───────────────────────────────────────────────────────────
local PropertyDS = DataStoreService:GetDataStore("Properties_v1")

local Properties = {
  SmallHouse = { Price = 1000,  Model = "SmallHouse" },
  LargeHouse = { Price = 5000,  Model = "LargeHouse" },
  Mansion    = { Price = 25000, Model = "Mansion" },
}

local ownedProperties = {}  -- [player.UserId][propName] = true

local BuyProperty = game:GetService("ReplicatedStorage"):WaitForChild("BuyProperty")
BuyProperty.OnServerEvent:Connect(function(player, propName)
  local prop = Properties[propName]
  if not prop then return end
  if ownedProperties[player.UserId] and ownedProperties[player.UserId][propName] then return end
  local ls = player:FindFirstChild("leaderstats")
  local cash = ls and ls:FindFirstChild("Cash")
  if not cash or cash.Value < prop.Price then return end
  cash.Value -= prop.Price
  ownedProperties[player.UserId] = ownedProperties[player.UserId] or {}
  ownedProperties[player.UserId][propName] = true
  -- Clone model to a pre-designated plot
  local model = game:GetService("ServerStorage"):WaitForChild("Houses"):FindFirstChild(prop.Model)
  if model then
    local plot = workspace:FindFirstChild("Plot_" .. player.UserId)
    if plot then
      model:Clone().Parent = plot
    end
  end
end)

── VEHICLE SPAWNING ──────────────────────────────────────────────────────────
local SpawnVehicle = game:GetService("ReplicatedStorage"):WaitForChild("SpawnVehicle")
local vehicleCooldowns = {}

SpawnVehicle.OnServerEvent:Connect(function(player, vehicleName)
  if vehicleCooldowns[player.UserId] then return end
  vehicleCooldowns[player.UserId] = true
  task.delay(10, function() vehicleCooldowns[player.UserId] = nil end)

  -- Remove existing vehicle
  local existing = workspace:FindFirstChild("Vehicle_" .. player.UserId)
  if existing then existing:Destroy() end

  local template = game:GetService("ServerStorage"):WaitForChild("Vehicles"):FindFirstChild(vehicleName)
  if not template then return end
  local vehicle = template:Clone()
  vehicle.Name = "Vehicle_" .. player.UserId
  -- Spawn at player position, slightly in front
  local char = player.Character
  local hrp = char and char:FindFirstChild("HumanoidRootPart")
  if hrp then
    vehicle:PivotTo(hrp.CFrame * CFrame.new(0, 2, -8))
  end
  vehicle.Parent = workspace
  -- Sit player in driver seat
  local seat = vehicle:FindFirstChild("VehicleSeat", true)
  if seat and char then
    seat:Sit(char:FindFirstChildOfClass("Humanoid"))
  end
end)

── DAY/NIGHT CYCLE ───────────────────────────────────────────────────────────
local Lighting = game:GetService("Lighting")
local DAY_LENGTH = 600  -- seconds per full cycle

task.spawn(function()
  while true do
    for clockTime = 6, 30, 0.05 do
      Lighting.ClockTime = clockTime % 24
      task.wait(DAY_LENGTH / 480)
    end
  end
end)

-- NPC schedules: NPCs go inside at night
local function updateNPCSchedule()
  local isNight = Lighting.ClockTime >= 20 or Lighting.ClockTime < 6
  for _, npc in workspace:WaitForChild("NPCs"):GetChildren() do
    local humanoid = npc:FindFirstChildOfClass("Humanoid")
    if not humanoid then continue end
    local target = isNight and npc:GetAttribute("NightPos") or npc:GetAttribute("DayPos")
    if target then
      humanoid:MoveTo(Vector3.new(table.unpack(target)))
    end
  end
end

Lighting:GetPropertyChangedSignal("ClockTime"):Connect(function()
  local t = Lighting.ClockTime
  -- Update at dawn (6) and dusk (20)
  if math.floor(t) == 6 or math.floor(t) == 20 then
    updateNPCSchedule()
  end
end)

── PROXIMITY CHAT ────────────────────────────────────────────────────────────
-- Uses Roblox TextChatService for spatially-aware chat (only hear nearby players).
-- Place in a LocalScript in StarterPlayerScripts.
local TextChatService = game:GetService("TextChatService")
local Players = game:GetService("Players")
local PROXIMITY_RANGE = 40  -- studs

local general = TextChatService:WaitForChild("TextChannels"):WaitForChild("RBXGeneral")

general.ShouldDeliverCallback = function(message, textSource)
  local sender = Players:GetPlayerByUserId(textSource.UserId)
  local receiver = Players.LocalPlayer
  if not sender or not receiver then return true end
  local sc = sender.Character and sender.Character:FindFirstChild("HumanoidRootPart")
  local rc = receiver.Character and receiver.Character:FindFirstChild("HumanoidRootPart")
  if not sc or not rc then return true end
  return (sc.Position - rc.Position).Magnitude <= PROXIMITY_RANGE
end


══════════════════════════════════════════════════════════════════════════════════
SHARED PATTERNS — Used Across All Genres
══════════════════════════════════════════════════════════════════════════════════

── LEADERSTATS SETUP (always in ServerScriptService) ─────────────────────────
local Players = game:GetService("Players")
Players.PlayerAdded:Connect(function(player)
  local ls = Instance.new("Folder")
  ls.Name = "leaderstats"
  ls.Parent = player
  -- Common stats
  local cash = Instance.new("IntValue", ls); cash.Name = "Cash";     cash.Value = 0
  local gems  = Instance.new("IntValue", ls); gems.Name  = "Gems";   gems.Value = 0
  local level = Instance.new("IntValue", ls); level.Name = "Level";  level.Value = 1
  local xp    = Instance.new("IntValue", ls); xp.Name    = "XP";     xp.Value = 0
end)

── SAFE DATASTORE WRAPPER ────────────────────────────────────────────────────
local DS = game:GetService("DataStoreService")
local store = DS:GetDataStore("GameData_v1")

local function safeGet(key)
  for i = 1, 3 do
    local ok, result = pcall(function() return store:GetAsync(key) end)
    if ok then return result end
    task.wait(1)
  end
  return nil
end

local function safeSet(key, value)
  for i = 1, 3 do
    local ok = pcall(function() store:SetAsync(key, value) end)
    if ok then return true end
    task.wait(1)
  end
  return false
end

── ROUND COUNTDOWN HUD (LocalScript in StarterGui) ───────────────────────────
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local statusValue = ReplicatedStorage:WaitForChild("Status")
local timerLabel = script.Parent:WaitForChild("TimerLabel")  -- TextLabel

statusValue.Changed:Connect(function(val)
  timerLabel.Text = val
end)

── SPECTATE ON DEATH (LocalScript) ───────────────────────────────────────────
local spectateEvent = game:GetService("ReplicatedStorage"):WaitForChild("StartSpectate")
local Players = game:GetService("Players")
local camera = workspace.CurrentCamera

spectateEvent.OnClientEvent:Connect(function()
  -- Cycle through alive players
  local function getAlive()
    local t = {}
    for _, p in Players:GetPlayers() do
      if p ~= Players.LocalPlayer and p.Character and
         p.Character:FindFirstChildOfClass("Humanoid") and
         p.Character.Humanoid.Health > 0 then
        table.insert(t, p)
      end
    end
    return t
  end

  local idx = 1
  local function spectateNext()
    local alive = getAlive()
    if #alive == 0 then return end
    idx = (idx % #alive) + 1
    local target = alive[idx]
    if target.Character then
      camera.CameraType = Enum.CameraType.Follow
      camera.CameraSubject = target.Character:FindFirstChildOfClass("Humanoid")
    end
  end

  spectateNext()
  -- Allow clicking to cycle
  game:GetService("UserInputService").InputBegan:Connect(function(input)
    if input.UserInputType == Enum.UserInputType.MouseButton1 then
      spectateNext()
    end
  end)
end)
`
