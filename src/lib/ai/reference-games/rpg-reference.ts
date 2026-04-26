/**
 * Production-quality reference RPG game.
 * Returns complete, working Luau code following real DevForum best practices.
 * Stats, combat, enemies, quests, NPC dialogue, loot drops, DataStore.
 */
export function rpgReferenceCode(): string {
  return `--[[
  ============================================================================
  COMPLETE RPG GAME — SERVER SCRIPT (ServerScriptService)
  ============================================================================
  Architecture:
    - Stat system (HP, ATK, DEF, XP, Level) stored in DataStore
    - Damage formula: max(1, ATK - DEF/2) with random variance
    - XP scaling: requiredXP = 50 * level^1.5
    - 3 enemy spawn points (Part + Humanoid, auto-respawn on death)
    - Quest system: 3 quests with state machine (inactive -> active -> complete)
    - NPC with ProximityPrompt dialogue
    - Loot drops on enemy death (random item)
    - Server-authoritative combat (client sends attack intent, server validates)

  Folder Structure Expected:
    Workspace/
      Enemies/
        SpawnPoint1 (Part — position where enemy spawns)
        SpawnPoint2 (Part)
        SpawnPoint3 (Part)
      NPCs/
        QuestGiver (Model with Humanoid + HumanoidRootPart)
      LootPickups/ (folder — server places loot drops here)
    ServerStorage/
      EnemyTemplates/
        Goblin (Model with Humanoid)
        Skeleton (Model with Humanoid)
        DarkKnight (Model with Humanoid)
    ReplicatedStorage/
      Remotes/
  ============================================================================
--]]

-- Services
local Players = game:GetService("Players")
local ServerStorage = game:GetService("ServerStorage")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local DataStoreService = game:GetService("DataStoreService")
local Debris = game:GetService("Debris")

----------------------------------------------------------------------------
-- CONSTANTS
----------------------------------------------------------------------------
local SAVE_INTERVAL = 60
local DATASTORE_KEY_PREFIX = "RPGV1_"
local RATE_LIMIT = 0.5 -- min seconds between attack actions
local BASE_PLAYER_HP = 100
local BASE_PLAYER_ATK = 10
local BASE_PLAYER_DEF = 5
local HP_PER_LEVEL = 15
local ATK_PER_LEVEL = 3
local DEF_PER_LEVEL = 2
local DAMAGE_VARIANCE = 0.2 -- +/- 20% random variance on damage
local ENEMY_RESPAWN_TIME = 15 -- seconds before enemy respawns

-- XP curve: requiredXP = 50 * level^1.5
-- This creates a smooth exponential curve. Level 1->2 needs 50 XP,
-- level 10->11 needs ~158 XP, level 50->51 needs ~1768 XP.
-- The exponent 1.5 is gentler than quadratic (^2) so players don't
-- hit a brick wall but still feel progression slowing.
local function getRequiredXP(level: number): number
  return math.floor(50 * math.pow(level, 1.5))
end

-- Enemy definitions: name -> { hp, atk, def, xpReward, lootTable }
local ENEMY_DEFS: { [string]: {
  hp: number,
  atk: number,
  def: number,
  xpReward: number,
  lootTable: { { itemName: string, dropChance: number } },
}} = {
  Goblin = {
    hp = 50,
    atk = 8,
    def = 3,
    xpReward = 25,
    lootTable = {
      { itemName = "Wooden Sword", dropChance = 0.3 },
      { itemName = "Health Potion", dropChance = 0.5 },
      { itemName = "Gold Coin", dropChance = 0.8 },
    },
  },
  Skeleton = {
    hp = 100,
    atk = 15,
    def = 8,
    xpReward = 60,
    lootTable = {
      { itemName = "Iron Sword", dropChance = 0.2 },
      { itemName = "Bone Shield", dropChance = 0.15 },
      { itemName = "Health Potion", dropChance = 0.6 },
      { itemName = "Gold Coin", dropChance = 0.9 },
    },
  },
  DarkKnight = {
    hp = 250,
    atk = 30,
    def = 20,
    xpReward = 150,
    lootTable = {
      { itemName = "Dark Blade", dropChance = 0.1 },
      { itemName = "Knight Armor", dropChance = 0.08 },
      { itemName = "Large Health Potion", dropChance = 0.4 },
      { itemName = "Gold Coin", dropChance = 1.0 },
    },
  },
}

-- Spawn point -> enemy type mapping
local SPAWN_CONFIG: { [string]: string } = {
  SpawnPoint1 = "Goblin",
  SpawnPoint2 = "Skeleton",
  SpawnPoint3 = "DarkKnight",
}

-- Quest definitions: questId -> quest data
-- State machine: "inactive" (not started) -> "active" (in progress) -> "complete" (done)
-- Requirements define what the player must do. Rewards are given on completion.
type QuestDef = {
  name: string,
  description: string,
  requirement: { type: string, target: string?, count: number },
  rewards: { xp: number, items: { string }? },
  dialogueStart: string,
  dialogueComplete: string,
}

local QUEST_DEFS: { [string]: QuestDef } = {
  quest_goblin_slayer = {
    name = "Goblin Slayer",
    description = "Defeat 3 Goblins terrorizing the village.",
    requirement = { type = "kill", target = "Goblin", count = 3 },
    rewards = { xp = 100, items = { "Iron Sword" } },
    dialogueStart = "Goblins are attacking the village! Please defeat 3 of them. You'll be rewarded handsomely.",
    dialogueComplete = "You did it! The village is safe. Take this sword as thanks.",
  },
  quest_skeleton_hunt = {
    name = "Skeleton Hunt",
    description = "Defeat 5 Skeletons in the dark caves.",
    requirement = { type = "kill", target = "Skeleton", count = 5 },
    rewards = { xp = 250, items = { "Bone Shield" } },
    dialogueStart = "The caves are overrun with undead. Can you clear out 5 Skeletons for us?",
    dialogueComplete = "The caves are safer now. This shield was forged from the bones you collected.",
  },
  quest_dark_knight = {
    name = "The Dark Knight",
    description = "Defeat the fearsome Dark Knight.",
    requirement = { type = "kill", target = "DarkKnight", count = 1 },
    rewards = { xp = 500, items = { "Dark Blade", "Knight Armor" } },
    dialogueStart = "A Dark Knight terrorizes the land. Only a true hero can defeat it. Are you brave enough?",
    dialogueComplete = "Incredible! You've defeated the Dark Knight! You are a true champion. Take these as your reward.",
  },
}

-- Item stat bonuses (applied when in inventory)
local ITEM_BONUSES: { [string]: { atk: number?, def: number?, hp: number? } } = {
  ["Wooden Sword"] = { atk = 3 },
  ["Iron Sword"] = { atk = 8 },
  ["Dark Blade"] = { atk = 20 },
  ["Bone Shield"] = { def = 10 },
  ["Knight Armor"] = { def = 25, hp = 50 },
  ["Health Potion"] = { hp = 25 },
  ["Large Health Potion"] = { hp = 75 },
  ["Gold Coin"] = {},
}

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

local AttackEnemyRemote = getOrCreateRemote("AttackEnemy", "RemoteEvent") :: RemoteEvent
local InteractNPCRemote = getOrCreateRemote("InteractNPC", "RemoteEvent") :: RemoteEvent
local AcceptQuestRemote = getOrCreateRemote("AcceptQuest", "RemoteEvent") :: RemoteEvent
local PickupLootRemote = getOrCreateRemote("PickupLoot", "RemoteEvent") :: RemoteEvent
local UpdateUIRemote = getOrCreateRemote("UpdateUI", "RemoteEvent") :: RemoteEvent
local DialogueRemote = getOrCreateRemote("ShowDialogue", "RemoteEvent") :: RemoteEvent

----------------------------------------------------------------------------
-- DATASTORE
----------------------------------------------------------------------------
local rpgStore: DataStore? = nil
do
  local ok, store = pcall(function()
    return DataStoreService:GetDataStore("RPGSaveData")
  end)
  if ok then
    rpgStore = store
  else
    warn("[RPG] DataStore unavailable:", store)
  end
end

type QuestProgress = {
  state: string, -- "inactive" | "active" | "complete"
  progress: number, -- kills/collects toward goal
}

type PlayerData = {
  level: number,
  xp: number,
  maxHP: number,
  atk: number,
  def: number,
  inventory: { string },
  quests: { [string]: QuestProgress },
  totalKills: number,
}

local DEFAULT_DATA: PlayerData = {
  level = 1,
  xp = 0,
  maxHP = BASE_PLAYER_HP,
  atk = BASE_PLAYER_ATK,
  def = BASE_PLAYER_DEF,
  inventory = {},
  quests = {},
  totalKills = 0,
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
local playerCurrentHP: { [number]: number } = {} -- live HP (not saved, resets on join)
local lastAttackTime: { [number]: number } = {}

-- Active enemy instances and their current HP
local activeEnemies: { [Model]: { hp: number, maxHP: number, enemyType: string } } = {}

----------------------------------------------------------------------------
-- STAT CALCULATION
-- Stats scale with level AND equipped items. This creates a compound
-- progression: leveling up AND getting better loot both matter.
----------------------------------------------------------------------------
local function getEffectiveStats(data: PlayerData): (number, number, number)
  -- Base stats from level
  local hp = BASE_PLAYER_HP + (data.level - 1) * HP_PER_LEVEL
  local atk = BASE_PLAYER_ATK + (data.level - 1) * ATK_PER_LEVEL
  local def = BASE_PLAYER_DEF + (data.level - 1) * DEF_PER_LEVEL

  -- Item bonuses (all items in inventory contribute)
  for _, itemName in data.inventory do
    local bonus = ITEM_BONUSES[itemName]
    if bonus then
      hp += (bonus.hp or 0)
      atk += (bonus.atk or 0)
      def += (bonus.def or 0)
    end
  end

  return hp, atk, def
end

----------------------------------------------------------------------------
-- DATA LOAD / SAVE
----------------------------------------------------------------------------
local function loadPlayerData(player: Player): PlayerData
  local data = deepCopy(DEFAULT_DATA)
  if not rpgStore then return data end

  local key = DATASTORE_KEY_PREFIX .. tostring(player.UserId)
  local success, result = pcall(function()
    return (rpgStore :: DataStore):GetAsync(key)
  end)

  if success and result then
    for k, v in result :: any do
      if (data :: any)[k] ~= nil then
        (data :: any)[k] = v
      end
    end
  elseif not success then
    warn("[RPG] Load failed for", player.Name, ":", result)
    task.wait(1)
    local ok2, res2 = pcall(function()
      return (rpgStore :: DataStore):GetAsync(key)
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
  if not rpgStore then return false end
  local data = playerData[userId]
  if not data then return false end

  local key = DATASTORE_KEY_PREFIX .. tostring(userId)
  local success, err = pcall(function()
    (rpgStore :: DataStore):SetAsync(key, data)
  end)

  if not success then
    warn("[RPG] Save failed for userId", userId, ":", err)
    task.wait(0.5)
    local ok2, err2 = pcall(function()
      (rpgStore :: DataStore):SetAsync(key, data)
    end)
    if not ok2 then
      warn("[RPG] Retry save failed:", err2)
      return false
    end
  end

  return true
end

----------------------------------------------------------------------------
-- LEADERSTATS
----------------------------------------------------------------------------
local function setupLeaderstats(player: Player)
  local leaderstats = Instance.new("Folder")
  leaderstats.Name = "leaderstats"
  leaderstats.Parent = player

  local levelVal = Instance.new("IntValue")
  levelVal.Name = "Level"
  levelVal.Value = 1
  levelVal.Parent = leaderstats

  local killsVal = Instance.new("IntValue")
  killsVal.Name = "Kills"
  killsVal.Value = 0
  killsVal.Parent = leaderstats
end

local function syncPlayerUI(player: Player)
  local data = playerData[player.UserId]
  if not data then return end

  local hp, atk, def = getEffectiveStats(data)
  local currentHP = playerCurrentHP[player.UserId] or hp

  local leaderstats = player:FindFirstChild("leaderstats")
  if leaderstats then
    local levelVal = leaderstats:FindFirstChild("Level")
    if levelVal and levelVal:IsA("IntValue") then
      levelVal.Value = data.level
    end
    local killsVal = leaderstats:FindFirstChild("Kills")
    if killsVal and killsVal:IsA("IntValue") then
      killsVal.Value = data.totalKills
    end
  end

  -- Build quest progress summary for UI
  local questSummary: { [string]: { name: string, state: string, progress: number, required: number } } = {}
  for questId, questDef in QUEST_DEFS do
    local qp = data.quests[questId]
    questSummary[questId] = {
      name = questDef.name,
      state = if qp then qp.state else "inactive",
      progress = if qp then qp.progress else 0,
      required = questDef.requirement.count,
    }
  end

  UpdateUIRemote:FireClient(player, {
    level = data.level,
    xp = data.xp,
    xpRequired = getRequiredXP(data.level),
    currentHP = currentHP,
    maxHP = hp,
    atk = atk,
    def = def,
    inventory = data.inventory,
    quests = questSummary,
    totalKills = data.totalKills,
  })
end

----------------------------------------------------------------------------
-- LEVEL UP SYSTEM
-- Checks if the player has enough XP to level up. Can level multiple
-- times in one check (e.g., from a big XP reward).
----------------------------------------------------------------------------
local function checkLevelUp(player: Player)
  local data = playerData[player.UserId]
  if not data then return end

  local leveled = false
  while data.xp >= getRequiredXP(data.level) do
    data.xp -= getRequiredXP(data.level)
    data.level += 1
    leveled = true
  end

  if leveled then
    -- Recalculate stats with new level
    local hp, atk, def = getEffectiveStats(data)
    data.maxHP = hp
    data.atk = atk
    data.def = def

    -- Full heal on level up (reward for progressing)
    playerCurrentHP[player.UserId] = hp

    -- Also heal the character's Humanoid so it's visible
    local character = player.Character
    if character then
      local humanoid = character:FindFirstChildOfClass("Humanoid")
      if humanoid then
        humanoid.MaxHealth = hp
        humanoid.Health = hp
      end
    end

    syncPlayerUI(player)
  end
end

----------------------------------------------------------------------------
-- DAMAGE FORMULA
-- max(1, ATK - DEF/2) with random variance.
-- DEF is halved so it mitigates damage without ever fully blocking.
-- The max(1, ...) ensures you always deal at least 1 damage (no stalemates).
-- Variance adds +/- 20% randomness to make combat feel dynamic.
----------------------------------------------------------------------------
local function calculateDamage(attackerATK: number, defenderDEF: number): number
  local baseDamage = math.max(1, attackerATK - defenderDEF / 2)
  -- Random variance: multiply by (1 - VARIANCE) to (1 + VARIANCE)
  local variance = 1 + (math.random() * 2 - 1) * DAMAGE_VARIANCE
  return math.floor(baseDamage * variance)
end

----------------------------------------------------------------------------
-- ENEMY SPAWN SYSTEM
-- Enemies spawn from templates in ServerStorage. Each spawn point
-- creates an enemy that fights back and respawns after death.
-- Enemy AI is simple: attack the nearest player within range.
----------------------------------------------------------------------------
local enemiesFolder = workspace:FindFirstChild("Enemies")
local lootFolder = workspace:FindFirstChild("LootPickups")
if not lootFolder then
  lootFolder = Instance.new("Folder")
  lootFolder.Name = "LootPickups"
  lootFolder.Parent = workspace
end

local function createHealthBar(enemy: Model, maxHP: number)
  -- BillboardGui health bar above the enemy's head
  local hrp = enemy:FindFirstChild("HumanoidRootPart") or enemy.PrimaryPart
  if not hrp then return end

  local billboard = Instance.new("BillboardGui")
  billboard.Name = "HealthBar"
  billboard.Size = UDim2.new(4, 0, 0.5, 0)
  billboard.StudsOffset = Vector3.new(0, 3, 0)
  billboard.AlwaysOnTop = true
  billboard.Parent = hrp

  -- Background bar
  local bgBar = Instance.new("Frame")
  bgBar.Name = "Background"
  bgBar.Size = UDim2.new(1, 0, 1, 0)
  bgBar.BackgroundColor3 = Color3.fromRGB(50, 50, 50)
  bgBar.BorderSizePixel = 0
  bgBar.Parent = billboard

  local bgCorner = Instance.new("UICorner")
  bgCorner.CornerRadius = UDim.new(0, 4)
  bgCorner.Parent = bgBar

  -- Health fill bar
  local hpBar = Instance.new("Frame")
  hpBar.Name = "Fill"
  hpBar.Size = UDim2.new(1, 0, 1, 0) -- 100% at start
  hpBar.BackgroundColor3 = Color3.fromRGB(200, 50, 50)
  hpBar.BorderSizePixel = 0
  hpBar.Parent = bgBar

  local hpCorner = Instance.new("UICorner")
  hpCorner.CornerRadius = UDim.new(0, 4)
  hpCorner.Parent = hpBar

  -- Enemy name label
  local nameLabel = Instance.new("TextLabel")
  nameLabel.Size = UDim2.new(1, 0, 1, 0)
  nameLabel.Position = UDim2.new(0, 0, -1.5, 0)
  nameLabel.BackgroundTransparency = 1
  nameLabel.Text = enemy.Name .. " (Lv. " .. tostring(maxHP) .. " HP)"
  nameLabel.TextColor3 = Color3.fromRGB(255, 100, 100)
  nameLabel.TextStrokeTransparency = 0.5
  nameLabel.TextScaled = true
  nameLabel.Font = Enum.Font.GothamBold
  nameLabel.Parent = billboard
end

local function updateHealthBar(enemy: Model, currentHP: number, maxHP: number)
  local hrp = enemy:FindFirstChild("HumanoidRootPart") or enemy.PrimaryPart
  if not hrp then return end

  local billboard = hrp:FindFirstChild("HealthBar")
  if not billboard then return end

  local bgBar = billboard:FindFirstChild("Background")
  if not bgBar then return end

  local fill = bgBar:FindFirstChild("Fill")
  if fill and fill:IsA("GuiObject") then
    local ratio = math.clamp(currentHP / maxHP, 0, 1)
    fill.Size = UDim2.new(ratio, 0, 1, 0)

    -- Color shifts from green to yellow to red based on HP
    if ratio > 0.5 then
      fill.BackgroundColor3 = Color3.fromRGB(50, 200, 50)
    elseif ratio > 0.25 then
      fill.BackgroundColor3 = Color3.fromRGB(200, 200, 50)
    else
      fill.BackgroundColor3 = Color3.fromRGB(200, 50, 50)
    end
  end
end

local function dropLoot(position: Vector3, enemyType: string)
  local def = ENEMY_DEFS[enemyType]
  if not def then return end

  for _, lootEntry in def.lootTable do
    -- Roll for each item independently
    if math.random() <= lootEntry.dropChance then
      -- Create a loot pickup part
      local lootPart = Instance.new("Part")
      lootPart.Name = "Loot_" .. lootEntry.itemName
      lootPart.Size = Vector3.new(1.5, 1.5, 1.5)
      lootPart.Shape = Enum.PartType.Ball
      lootPart.Material = Enum.Material.Neon
      lootPart.BrickColor = BrickColor.new("Bright yellow")
      lootPart.Anchored = true
      lootPart.CanCollide = false
      lootPart.Position = position + Vector3.new(
        math.random(-3, 3), 2, math.random(-3, 3)
      )

      -- Store item name as attribute for pickup
      lootPart:SetAttribute("ItemName", lootEntry.itemName)

      -- Floating animation using a simple bobbing loop
      -- We use attributes + task.spawn instead of TweenService because
      -- this needs to loop indefinitely until picked up.
      local baseY = lootPart.Position.Y
      task.spawn(function()
        local t = 0
        while lootPart and lootPart.Parent do
          t += 0.05
          lootPart.Position = Vector3.new(
            lootPart.Position.X,
            baseY + math.sin(t * 3) * 0.5,
            lootPart.Position.Z
          )
          task.wait(0.03)
        end
      end)

      -- BillboardGui label showing item name
      local billboard = Instance.new("BillboardGui")
      billboard.Size = UDim2.new(3, 0, 1, 0)
      billboard.StudsOffset = Vector3.new(0, 2, 0)
      billboard.Parent = lootPart

      local label = Instance.new("TextLabel")
      label.Size = UDim2.new(1, 0, 1, 0)
      label.BackgroundTransparency = 1
      label.Text = lootEntry.itemName
      label.TextColor3 = Color3.fromRGB(255, 215, 0)
      label.TextStrokeTransparency = 0
      label.TextScaled = true
      label.Font = Enum.Font.GothamBold
      label.Parent = billboard

      -- ProximityPrompt to pick up
      local prompt = Instance.new("ProximityPrompt")
      prompt.ActionText = "Pick Up"
      prompt.ObjectText = lootEntry.itemName
      prompt.HoldDuration = 0
      prompt.MaxActivationDistance = 8
      prompt.Parent = lootPart

      prompt.Triggered:Connect(function(player: Player)
        local data = playerData[player.UserId]
        if not data then return end

        -- Add item to inventory
        table.insert(data.inventory, lootEntry.itemName)

        -- Apply immediate stat bonuses
        local hp, atk, def2 = getEffectiveStats(data)
        data.maxHP = hp
        data.atk = atk
        data.def = def2

        -- Heal for potion items
        local bonus = ITEM_BONUSES[lootEntry.itemName]
        if bonus and bonus.hp then
          local currentHP = playerCurrentHP[player.UserId] or hp
          playerCurrentHP[player.UserId] = math.min(currentHP + bonus.hp, hp)
        end

        lootPart:Destroy()
        syncPlayerUI(player)
      end)

      lootPart.Parent = lootFolder

      -- Auto-despawn loot after 30 seconds to prevent clutter
      Debris:AddItem(lootPart, 30)
    end
  end
end

local function spawnEnemy(spawnPoint: BasePart, enemyType: string)
  local templatesFolder = ServerStorage:FindFirstChild("EnemyTemplates")
  if not templatesFolder then
    warn("[RPG] ServerStorage/EnemyTemplates folder missing!")
    return
  end

  local template = templatesFolder:FindFirstChild(enemyType)
  if not template then
    warn("[RPG] Enemy template not found:", enemyType)
    return
  end

  local enemy = template:Clone()
  enemy.Name = enemyType

  -- Position at spawn point
  if enemy:IsA("Model") and enemy.PrimaryPart then
    enemy:PivotTo(spawnPoint.CFrame + Vector3.new(0, 3, 0))
  end

  -- Set materials (never SmoothPlastic)
  for _, part in enemy:GetDescendants() do
    if part:IsA("BasePart") then
      if part.Material == Enum.Material.SmoothPlastic then
        part.Material = Enum.Material.Concrete
      end
    end
  end

  local def = ENEMY_DEFS[enemyType]
  if not def then return end

  -- Track enemy state
  activeEnemies[enemy] = {
    hp = def.hp,
    maxHP = def.hp,
    enemyType = enemyType,
  }

  -- Create health bar billboard
  createHealthBar(enemy, def.hp)

  -- Set Humanoid properties
  local humanoid = enemy:FindFirstChildOfClass("Humanoid")
  if humanoid then
    humanoid.MaxHealth = def.hp
    humanoid.Health = def.hp
  end

  enemy.Parent = workspace

  -- Simple AI: attack nearest player within 20 studs every 2 seconds.
  -- Real games would use pathfinding (PathfindingService) but this
  -- keeps the reference simple and focused on the RPG systems.
  task.spawn(function()
    while enemy and enemy.Parent and activeEnemies[enemy] do
      local enemyState = activeEnemies[enemy]
      if not enemyState or enemyState.hp <= 0 then break end

      local hrp = enemy:FindFirstChild("HumanoidRootPart") or enemy.PrimaryPart
      if not hrp or not hrp:IsA("BasePart") then break end

      -- Find nearest player
      local nearestPlayer: Player? = nil
      local nearestDist = 20

      for _, player in Players:GetPlayers() do
        local character = player.Character
        if not character then continue end
        local playerHRP = character:FindFirstChild("HumanoidRootPart")
        if not playerHRP or not playerHRP:IsA("BasePart") then continue end

        local dist = (playerHRP.Position - hrp.Position).Magnitude
        if dist < nearestDist then
          nearestDist = dist
          nearestPlayer = player
        end
      end

      -- Attack nearest player
      if nearestPlayer then
        local data = playerData[nearestPlayer.UserId]
        if data then
          local _, _, playerDef = getEffectiveStats(data)
          local damage = calculateDamage(def.atk, playerDef)
          local currentHP = playerCurrentHP[nearestPlayer.UserId] or data.maxHP
          currentHP -= damage
          playerCurrentHP[nearestPlayer.UserId] = currentHP

          if currentHP <= 0 then
            -- Player dies
            playerCurrentHP[nearestPlayer.UserId] = 0
            local character = nearestPlayer.Character
            if character then
              local hum = character:FindFirstChildOfClass("Humanoid")
              if hum then
                hum.Health = 0
              end
            end
          else
            -- Update player character HP for visual feedback
            local character = nearestPlayer.Character
            if character then
              local hum = character:FindFirstChildOfClass("Humanoid")
              if hum then
                local maxHP, _, _ = getEffectiveStats(data)
                hum.MaxHealth = maxHP
                hum.Health = currentHP
              end
            end
          end

          syncPlayerUI(nearestPlayer)
        end
      end

      task.wait(2)
    end
  end)

  -- Handle enemy death via Humanoid
  if humanoid then
    humanoid.Died:Connect(function()
      -- Enemy is already dead, clean up and schedule respawn
      local state = activeEnemies[enemy]
      if state then
        activeEnemies[enemy] = nil
      end

      -- Drop loot at enemy position
      local hrp = enemy:FindFirstChild("HumanoidRootPart") or enemy.PrimaryPart
      if hrp and hrp:IsA("BasePart") then
        dropLoot(hrp.Position, enemyType)
      end

      -- Destroy enemy model after a delay (so death animation plays)
      task.delay(3, function()
        if enemy and enemy.Parent then
          enemy:Destroy()
        end
      end)

      -- Respawn after ENEMY_RESPAWN_TIME
      task.delay(ENEMY_RESPAWN_TIME, function()
        if spawnPoint and spawnPoint.Parent then
          spawnEnemy(spawnPoint, enemyType)
        end
      end)
    end)
  end
end

-- Initialize enemy spawn points
local function setupEnemySpawns()
  if not enemiesFolder then
    warn("[RPG] Workspace/Enemies folder not found!")
    return
  end

  for spawnName, enemyType in SPAWN_CONFIG do
    local spawnPoint = enemiesFolder:FindFirstChild(spawnName)
    if spawnPoint and spawnPoint:IsA("BasePart") then
      -- Make spawn point visible as a marker
      spawnPoint.Material = Enum.Material.Concrete
      spawnPoint.BrickColor = BrickColor.new("Dark stone grey")
      spawnPoint.Transparency = 0.5

      spawnEnemy(spawnPoint, enemyType)
    end
  end
end

setupEnemySpawns()

----------------------------------------------------------------------------
-- COMBAT SYSTEM (Player attacks enemy)
-- Client sends attack intent + target enemy model reference.
-- Server validates distance, rate limit, then applies damage.
----------------------------------------------------------------------------
AttackEnemyRemote.OnServerEvent:Connect(function(player: Player, targetEnemy: unknown)
  -- Type validation
  if not targetEnemy or typeof(targetEnemy) ~= "Instance" then return end
  if not (targetEnemy :: Instance):IsA("Model") then return end

  local enemy = targetEnemy :: Model

  -- Rate limit
  local now = tick()
  local last = lastAttackTime[player.UserId] or 0
  if (now - last) < RATE_LIMIT then return end
  lastAttackTime[player.UserId] = now

  local data = playerData[player.UserId]
  if not data then return end

  -- Distance check: player must be within 10 studs of enemy
  local character = player.Character
  if not character then return end
  local playerHRP = character:FindFirstChild("HumanoidRootPart")
  if not playerHRP or not playerHRP:IsA("BasePart") then return end

  local enemyHRP = enemy:FindFirstChild("HumanoidRootPart") or enemy.PrimaryPart
  if not enemyHRP or not enemyHRP:IsA("BasePart") then return end

  local distance = (playerHRP.Position - enemyHRP.Position).Magnitude
  if distance > 10 then return end -- too far away

  -- Get enemy state
  local enemyState = activeEnemies[enemy]
  if not enemyState or enemyState.hp <= 0 then return end

  -- Calculate and apply damage
  local _, playerATK, _ = getEffectiveStats(data)
  local damage = calculateDamage(playerATK, ENEMY_DEFS[enemyState.enemyType].def)

  enemyState.hp -= damage
  updateHealthBar(enemy, enemyState.hp, enemyState.maxHP)

  -- Also update the Humanoid so death animations trigger naturally
  local humanoid = enemy:FindFirstChildOfClass("Humanoid")
  if humanoid then
    humanoid.Health = math.max(0, enemyState.hp)
  end

  -- Check if enemy is dead
  if enemyState.hp <= 0 then
    local enemyType = enemyState.enemyType
    local def = ENEMY_DEFS[enemyType]

    -- Award XP
    if def then
      data.xp += def.xpReward
      data.totalKills += 1
    end

    -- Update quest progress for kill quests
    for questId, questDef in QUEST_DEFS do
      local qp = data.quests[questId]
      if qp and qp.state == "active" then
        if questDef.requirement.type == "kill" and questDef.requirement.target == enemyType then
          qp.progress += 1

          -- Check if quest is complete
          if qp.progress >= questDef.requirement.count then
            qp.state = "complete"
          end
        end
      end
    end

    -- Check for level ups
    checkLevelUp(player)
    syncPlayerUI(player)

    -- The Humanoid.Died event handles cleanup and respawn
    -- (see spawnEnemy function above)
  end
end)

----------------------------------------------------------------------------
-- NPC QUEST SYSTEM
-- NPC with ProximityPrompt. Interacting opens dialogue.
-- Dialogue flow: show quest description -> accept -> track kills -> complete.
----------------------------------------------------------------------------
local npcsFolder = workspace:FindFirstChild("NPCs")

local function setupNPCs()
  if not npcsFolder then return end

  local questGiver = npcsFolder:FindFirstChild("QuestGiver")
  if not questGiver then return end

  -- Material for NPC parts (never SmoothPlastic)
  for _, part in questGiver:GetDescendants() do
    if part:IsA("BasePart") and part.Material == Enum.Material.SmoothPlastic then
      part.Material = Enum.Material.Concrete
    end
  end

  -- Name tag billboard
  local hrp = questGiver:FindFirstChild("HumanoidRootPart")
    or (questGiver:IsA("Model") and questGiver.PrimaryPart)
  if hrp and hrp:IsA("BasePart") then
    local billboard = Instance.new("BillboardGui")
    billboard.Size = UDim2.new(4, 0, 1, 0)
    billboard.StudsOffset = Vector3.new(0, 4, 0)
    billboard.Parent = hrp

    local label = Instance.new("TextLabel")
    label.Size = UDim2.new(1, 0, 1, 0)
    label.BackgroundTransparency = 1
    label.Text = "Quest Giver"
    label.TextColor3 = Color3.fromRGB(255, 215, 0)
    label.TextStrokeTransparency = 0
    label.TextScaled = true
    label.Font = Enum.Font.GothamBold
    label.Parent = billboard

    -- ProximityPrompt for interaction
    local prompt = Instance.new("ProximityPrompt")
    prompt.ActionText = "Talk"
    prompt.ObjectText = "Quest Giver"
    prompt.HoldDuration = 0
    prompt.MaxActivationDistance = 10
    prompt.Parent = hrp

    prompt.Triggered:Connect(function(player: Player)
      local data = playerData[player.UserId]
      if not data then return end

      -- Find the best quest to offer:
      -- 1. A completed quest (turn in rewards)
      -- 2. An active quest (show progress)
      -- 3. An inactive quest (offer new quest)
      local questToShow: string? = nil
      local dialogueText = "I have no quests for you right now. Come back later!"

      -- Priority 1: completed quests (turn in)
      for questId, questDef in QUEST_DEFS do
        local qp = data.quests[questId]
        if qp and qp.state == "complete" then
          -- Give rewards
          data.xp += questDef.rewards.xp
          if questDef.rewards.items then
            for _, itemName in questDef.rewards.items do
              table.insert(data.inventory, itemName)
            end
          end

          -- Mark as turned in (remove from active quests)
          qp.state = "turned_in"
          dialogueText = questDef.dialogueComplete
          checkLevelUp(player)
          syncPlayerUI(player)

          DialogueRemote:FireClient(player, {
            npcName = "Quest Giver",
            text = dialogueText,
            questId = questId,
            action = "complete",
          })
          return
        end
      end

      -- Priority 2: active quests (show progress)
      for questId, questDef in QUEST_DEFS do
        local qp = data.quests[questId]
        if qp and qp.state == "active" then
          dialogueText = questDef.description .. " (Progress: " .. tostring(qp.progress) .. "/" .. tostring(questDef.requirement.count) .. ")"
          DialogueRemote:FireClient(player, {
            npcName = "Quest Giver",
            text = dialogueText,
            questId = questId,
            action = "progress",
          })
          return
        end
      end

      -- Priority 3: new quest to offer
      for questId, questDef in QUEST_DEFS do
        local qp = data.quests[questId]
        if not qp or qp.state == "inactive" then
          dialogueText = questDef.dialogueStart
          DialogueRemote:FireClient(player, {
            npcName = "Quest Giver",
            text = dialogueText,
            questId = questId,
            action = "offer",
          })
          return
        end
      end

      -- No quests available
      DialogueRemote:FireClient(player, {
        npcName = "Quest Giver",
        text = dialogueText,
        action = "none",
      })
    end)
  end
end

setupNPCs()

-- Accept quest remote
AcceptQuestRemote.OnServerEvent:Connect(function(player: Player, questId: unknown)
  if type(questId) ~= "string" then return end
  local questStr = questId :: string

  local questDef = QUEST_DEFS[questStr]
  if not questDef then return end

  local data = playerData[player.UserId]
  if not data then return end

  -- Can only accept if inactive or not started
  local qp = data.quests[questStr]
  if qp and qp.state ~= "inactive" then return end

  -- Start the quest
  data.quests[questStr] = {
    state = "active",
    progress = 0,
  }

  syncPlayerUI(player)
end)

----------------------------------------------------------------------------
-- PLAYER JOIN / LEAVE
----------------------------------------------------------------------------
Players.PlayerAdded:Connect(function(player: Player)
  local data = loadPlayerData(player)
  playerData[player.UserId] = data

  -- Initialize HP based on stats
  local hp, _, _ = getEffectiveStats(data)
  playerCurrentHP[player.UserId] = hp

  setupLeaderstats(player)
  syncPlayerUI(player)

  -- Set character HP when they spawn
  player.CharacterAdded:Connect(function(character: Model)
    local humanoid = character:WaitForChild("Humanoid", 5)
    if humanoid and humanoid:IsA("Humanoid") then
      local maxHP, _, _ = getEffectiveStats(data)
      humanoid.MaxHealth = maxHP
      humanoid.Health = playerCurrentHP[player.UserId] or maxHP
    end

    -- Respawn restores some HP (50%) so death isn't too punishing
    local currentHP = playerCurrentHP[player.UserId] or 0
    if currentHP <= 0 then
      local maxHP, _, _ = getEffectiveStats(data)
      playerCurrentHP[player.UserId] = math.floor(maxHP * 0.5)
    end
  end)
end)

Players.PlayerRemoving:Connect(function(player: Player)
  local userId = player.UserId
  savePlayerData(userId)

  playerData[userId] = nil
  playerCurrentHP[userId] = nil
  lastAttackTime[userId] = nil
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

print("[RPG] Server script loaded successfully!")
`;
}
