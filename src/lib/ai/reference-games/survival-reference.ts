/**
 * Production-quality reference survival game systems.
 * Modeled after: Booga Booga, Stranded, Natural Disaster Survival.
 * Systems: Resource gathering, crafting, hunger/thirst, base building, threats, fishing.
 */

export function getSurvivalReference(): string {
  const parts: string[] = [];
  parts.push(`-- ============================================================
-- SURVIVAL GAME REFERENCE
-- Modeled after: Booga Booga, Stranded, Natural Disaster Survival
-- Systems: Resource Gathering, Crafting, Needs, Base Building, Threats, Fishing
-- ============================================================

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local DataStoreService = game:GetService("DataStoreService")
local RunService = game:GetService("RunService")
local PathfindingService = game:GetService("PathfindingService")

local ResourceDS = DataStoreService:GetDataStore("SurvivalResources_v1")
local Remotes = ReplicatedStorage:WaitForChild("Remotes")
local GatherResource = Remotes:WaitForChild("GatherResource")
local CraftItem      = Remotes:WaitForChild("CraftItem")
local PlaceStructure = Remotes:WaitForChild("PlaceStructure")
local UpdateNeeds    = Remotes:WaitForChild("UpdateNeeds")
local ConsumeItem    = Remotes:WaitForChild("ConsumeItem")
local UseItem        = Remotes:WaitForChild("UseItem")
local SpawnCreature  = Remotes:WaitForChild("SpawnCreature")
local StartFishing   = Remotes:WaitForChild("StartFishing")
local FishingResult  = Remotes:WaitForChild("FishingResult")
local ReelIn         = Remotes:WaitForChild("ReelIn")

-- ============================================================
-- SYSTEM 1: RESOURCE NODES
-- ============================================================
local RESOURCE_NODES = {
  tree      = { name="Tree",       drops={{item="wood",min=2,max=5}},                                     tool="axe",     gatherTime=3, respawnTime=60,  health=3 },
  rock      = { name="Rock",       drops={{item="stone",min=2,max=4},{item="flint",min=0,max=1}},          tool="pickaxe", gatherTime=4, respawnTime=90,  health=4 },
  bush      = { name="Berry Bush", drops={{item="berries",min=3,max=6}},                                  tool=nil,       gatherTime=1, respawnTime=30,  health=1 },
  ore_iron  = { name="Iron Ore",   drops={{item="iron_ore",min=1,max=3}},                                 tool="pickaxe", gatherTime=5, respawnTime=120, health=5 },
  mushroom  = { name="Mushroom",   drops={{item="mushroom",min=1,max=2}},                                 tool=nil,       gatherTime=1, respawnTime=45,  health=1 },
  vine_plant= { name="Vine",       drops={{item="vine",min=2,max=4}},                                     tool=nil,       gatherTime=2, respawnTime=60,  health=1 },
}

local nodeRegistry = {}

local function setupResourceNodes()
  for _, obj in ipairs(workspace:GetDescendants()) do
    if obj:IsA("Model") and obj:GetAttribute("ResourceType") then
      local nodeType = obj:GetAttribute("ResourceType")
      local def = RESOURCE_NODES[nodeType]
      if not def then continue end
      nodeRegistry[obj] = { nodeType=nodeType, health=def.health, depleted=false, respawnTimer=0 }
      local anchor = obj.PrimaryPart or obj:FindFirstChildWhichIsA("BasePart")
      if not anchor then continue end
      local prompt = Instance.new("ProximityPrompt")
      prompt.ActionText=def.name; prompt.ObjectText="Gather"`);
  parts.push(`      prompt.HoldDuration=def.gatherTime; prompt.MaxActivationDistance=8
      prompt.Parent = anchor
      prompt.Triggered:Connect(function(player)
        local data = nodeRegistry[obj]
        if not data or data.depleted then return end
        if def.tool then
          local char = player.Character
          local equipped = char and char:FindFirstChildWhichIsA("Tool")
          if not equipped or equipped:GetAttribute("ToolType") ~= def.tool then
            GatherResource:FireClient(player, false, "Requires "..def.tool); return
          end
        end
        for _, drop in ipairs(def.drops) do
          local qty = math.random(drop.min, drop.max)
          if qty > 0 then GatherResource:FireClient(player, true, drop.item, qty) end
        end
        data.health -= 1
        if data.health <= 0 then
          data.depleted = true
          if obj.PrimaryPart then obj.PrimaryPart.Transparency = 0.8 end
          prompt.Enabled = false
        end
      end)
    end
  end
end

RunService.Heartbeat:Connect(function(dt)
  for obj, data in pairs(nodeRegistry) do
    if data.depleted then
      data.respawnTimer += dt
      local def = RESOURCE_NODES[data.nodeType]
      if def and data.respawnTimer >= def.respawnTime then
        data.health=def.health; data.depleted=false; data.respawnTimer=0
        if obj.PrimaryPart then obj.PrimaryPart.Transparency = 0 end
        local p = obj:FindFirstChildWhichIsA("ProximityPrompt", true)
        if p then p.Enabled = true end
      end
    end
  end
end)

-- ============================================================
-- SYSTEM 2: CRAFTING
-- ============================================================
local RECIPES = {
  campfire     = { requires={wood=5,stone=3},        produces={item="campfire",qty=1},     category="Structures" },
  axe          = { requires={wood=2,flint=1},        produces={item="axe",qty=1},          category="Tools" },
  pickaxe      = { requires={wood=2,stone=2},        produces={item="pickaxe",qty=1},      category="Tools" },
  wooden_wall  = { requires={wood=8},                produces={item="wooden_wall",qty=1},  category="Structures" },`);
  parts.push(`  wooden_floor = { requires={wood=5},                produces={item="wooden_floor",qty=1}, category="Structures" },
  cooked_meat  = { requires={raw_meat=1},            produces={item="cooked_meat",qty=1},  category="Food",      requiresStructure="campfire" },
  iron_ingot   = { requires={iron_ore=3},            produces={item="iron_ingot",qty=1},   category="Materials", requiresStructure="furnace" },
  iron_sword   = { requires={iron_ingot=3,wood=1},   produces={item="iron_sword",qty=1},   category="Weapons",   requiresStructure="anvil" },
  bandage      = { requires={cloth=2},               produces={item="bandage",qty=2},      category="Medicine" },
  rope         = { requires={vine=3},                produces={item="rope",qty=1},         category="Materials" },
  raft         = { requires={wood=20,rope=5},        produces={item="raft",qty=1},         category="Vehicles" },
  torch        = { requires={wood=1,flint=1},        produces={item="torch",qty=2},        category="Tools" },
  fishing_rod  = { requires={wood=3,rope=2},         produces={item="fishing_rod",qty=1},  category="Tools" },
}

local playerInventory = {}
local function getInv(player)
  if not playerInventory[player.UserId] then playerInventory[player.UserId]={} end
  return playerInventory[player.UserId]
end
local function hasItems(player, req)
  local inv = getInv(player)
  for item, qty in pairs(req) do if (inv[item] or 0) < qty then return false end end
  return true
end
local function deductItems(player, req)
  local inv = getInv(player)
  for item, qty in pairs(req) do inv[item]=(inv[item] or 0)-qty end
end
local function addItem(player, itemName, qty)
  local inv = getInv(player)
  inv[itemName] = (inv[itemName] or 0) + qty
end

GatherResource.OnServerEvent:Connect(function(player, success, itemName, qty)
  if success and itemName and qty then addItem(player, itemName, qty) end
end)

CraftItem.OnServerEvent:Connect(function(player, recipeName)
  local recipe = RECIPES[recipeName]
  if not recipe then return end
  if not hasItems(player, recipe.requires) then
    CraftItem:FireClient(player, false, "Missing materials"); return
  end
  deductItems(player, recipe.requires)
  addItem(player, recipe.produces.item, recipe.produces.qty)
  CraftItem:FireClient(player, true, recipe.produces.item, recipe.produces.qty)
end)

-- ============================================================
-- SYSTEM 3: HUNGER, THIRST, TEMPERATURE
-- ============================================================
local playerNeeds = {}
local DRAIN = { hunger=1.5, thirst=2.0 }`);
  parts.push(`
local FOOD_ITEMS = {
  berries     = { hunger=15, thirst=5   },
  mushroom    = { hunger=20, thirst=0   },
  cooked_meat = { hunger=60, thirst=-10 },
  water       = { hunger=0,  thirst=40  },
  raw_meat    = { hunger=25, thirst=-5, sicknessChance=0.3 },
  small_fish  = { hunger=25, thirst=0   },
  medium_fish = { hunger=40, thirst=0   },
  large_fish  = { hunger=60, thirst=0   },
}

Players.PlayerAdded:Connect(function(player)
  playerNeeds[player.UserId] = { hunger=100, thirst=100, temperature=37 }
  local saved
  pcall(function() saved = ResourceDS:GetAsync("inv_"..player.UserId) end)
  if saved then playerInventory[player.UserId] = saved end

  task.spawn(function()
    while player.Parent do
      task.wait(1)
      local needs = playerNeeds[player.UserId]
      if not needs then break end
      needs.hunger = math.max(0, needs.hunger - DRAIN.hunger/60)
      needs.thirst = math.max(0, needs.thirst - DRAIN.thirst/60)
      if needs.hunger <= 0 or needs.thirst <= 0 then
        local char = player.Character
        local hum = char and char:FindFirstChild("Humanoid")
        if hum then hum.Health = math.max(0, hum.Health - 2) end
      end
      UpdateNeeds:FireClient(player, needs)
    end
  end)
end)

ConsumeItem.OnServerEvent:Connect(function(player, itemName)
  local food = FOOD_ITEMS[itemName]
  if not food then return end
  local inv = getInv(player)
  if (inv[itemName] or 0) <= 0 then ConsumeItem:FireClient(player, false, "No "..itemName); return end
  inv[itemName] -= 1
  local needs = playerNeeds[player.UserId]
  if needs then
    needs.hunger = math.min(100, needs.hunger+(food.hunger or 0))
    needs.thirst = math.min(100, needs.thirst+(food.thirst or 0))
    UpdateNeeds:FireClient(player, needs)
  end
  if food.sicknessChance and math.random() < food.sicknessChance then
    local char = player.Character
    local hum = char and char:FindFirstChild("Humanoid")`);
  parts.push(`    if hum then
      hum.WalkSpeed = 8
      task.delay(30, function() if hum and hum.Parent then hum.WalkSpeed = 16 end end)
    end
    ConsumeItem:FireClient(player, true, itemName, "sick")
  else
    ConsumeItem:FireClient(player, true, itemName)
  end
end)

UseItem.OnServerEvent:Connect(function(player, itemName)
  local inv = getInv(player)
  if (inv[itemName] or 0) <= 0 then return end
  if itemName == "bandage" then
    inv["bandage"] -= 1
    local char = player.Character
    local hum = char and char:FindFirstChild("Humanoid")
    if hum then hum.Health = math.min(hum.MaxHealth, hum.Health + 30) end
    UseItem:FireClient(player, true, itemName)
  elseif itemName == "torch" then
    inv["torch"] -= 1
    local char = player.Character
    local hand = char and char:FindFirstChild("RightHand")
    if hand then
      local light = Instance.new("PointLight")
      light.Brightness=3; light.Range=20; light.Color=Color3.fromRGB(255,180,100)
      light.Parent = hand
      task.delay(300, function() if light and light.Parent then light:Destroy() end end)
    end
    UseItem:FireClient(player, true, itemName)
  end
end)

-- ============================================================
-- SYSTEM 4: BASE BUILDING
-- ============================================================
local BASE_STRUCTURES = {
  wooden_wall  = { health=150, size=Vector3.new(6,8,0.5),  material=Enum.Material.Wood,  cost={wood=8}   },
  wooden_floor = { health=200, size=Vector3.new(6,0.5,6),  material=Enum.Material.Wood,  cost={wood=5}   },
  wooden_roof  = { health=120, size=Vector3.new(6,0.5,6),  material=Enum.Material.Wood,  cost={wood=6}   },
  stone_wall   = { health=400, size=Vector3.new(6,8,0.5),  material=Enum.Material.Brick, cost={stone=10} },
  campfire     = { health=50,  size=Vector3.new(3,1,3),    material=Enum.Material.Metal, cost={wood=5,stone=3} },
  storage_box  = { health=200, size=Vector3.new(4,3,4),    material=Enum.Material.Wood,  cost={wood=10}  },
  watchtower   = { health=300, size=Vector3.new(4,12,4),   material=Enum.Material.Wood,  cost={wood=20,rope=2} },
  fence        = { health=80,  size=Vector3.new(6,3,0.4),  material=Enum.Material.Wood,  cost={wood=4}   },
}

PlaceStructure.OnServerEvent:Connect(function(player, structureType, cf)
  local def = BASE_STRUCTURES[structureType]
  if not def then return end`);
  parts.push(`  if not hasItems(player, def.cost) then
    PlaceStructure:FireClient(player, false, "Missing materials"); return
  end
  deductItems(player, def.cost)

  local part = Instance.new("Part")
  part.Size=def.size; part.Material=def.material
  part.BrickColor=BrickColor.new("Reddish brown")
  part.Anchored=true; part.CFrame=cf; part.Parent=workspace

  local hpVal = Instance.new("NumberValue")
  hpVal.Name="StructureHealth"; hpVal.Value=def.health; hpVal.Parent=part

  local ownerVal = Instance.new("StringValue")
  ownerVal.Name="Owner"; ownerVal.Value=tostring(player.UserId); ownerVal.Parent=part

  PlaceStructure:FireClient(player, true, structureType)

  if structureType == "campfire" then
    task.spawn(function()
      while part.Parent do
        task.wait(5)
        for _, p in ipairs(Players:GetPlayers()) do
          local char = p.Character
          if char and char.PrimaryPart then
            local d = (char.PrimaryPart.Position - part.Position).Magnitude
            if d < 20 then
              local needs = playerNeeds[p.UserId]
              if needs then
                needs.temperature = math.min(37, needs.temperature+0.5)
                UpdateNeeds:FireClient(p, needs)
              end
            end
          end
        end
      end
    end)
  end
end)

-- ============================================================
-- SYSTEM 5: NIGHT THREATS
-- ============================================================
local THREATS = {
  wolf   = { health=60,  damage=12, speed=18, model="Wolf"   },
  zombie = { health=80,  damage=8,  speed=12, model="Zombie" },
  bear   = { health=200, damage=25, speed=14, model="Bear"   },
  spider = { health=40,  damage=6,  speed=20, model="Spider" },
}
`);
  parts.push(`local activeCreatures = {}

local function spawnThreat(creatureType, spawnPos)
  local def = THREATS[creatureType]
  if not def then return end
  local npcFolder = ReplicatedStorage:FindFirstChild("NPCModels")
  local template  = npcFolder and npcFolder:FindFirstChild(def.model)
  if not template then return end

  local creature = template:Clone()
  creature.Parent = workspace
  creature.PrimaryPart.CFrame = CFrame.new(spawnPos)

  local hum = creature:FindFirstChild("Humanoid")
  if hum then hum.MaxHealth=def.health; hum.Health=def.health; hum.WalkSpeed=def.speed end

  SpawnCreature:FireAllClients(creatureType, spawnPos)

  task.spawn(function()
    while creature.Parent and hum and hum.Health > 0 do
      local nearest, nearDist = nil, math.huge
      for _, p in ipairs(Players:GetPlayers()) do
        local char = p.Character
        if char and char.PrimaryPart then
          local d = (char.PrimaryPart.Position - creature.PrimaryPart.Position).Magnitude
          if d < nearDist then nearest=p; nearDist=d end
        end
      end

      if nearest and nearDist < 80 then
        local path = PathfindingService:CreatePath({AgentHeight=5,AgentRadius=2})
        pcall(function() path:ComputeAsync(creature.PrimaryPart.Position, nearest.Character.PrimaryPart.Position) end)
        if path.Status == Enum.PathStatus.Success then
          for _, wp in ipairs(path:GetWaypoints()) do
            if not creature.Parent or hum.Health <= 0 then break end
            if wp.Action == Enum.PathWaypointAction.Jump then hum.Jump = true end
            hum:MoveTo(wp.Position)
            hum.MoveToFinished:Wait(3)
          end
        end
        if nearDist < 5 then
          local tChar = nearest.Character
          local tHum = tChar and tChar:FindFirstChild("Humanoid")
          if tHum then tHum.Health = math.max(0, tHum.Health - def.damage) end
          task.wait(1.5)
        end
      else
        task.wait(2)
      end
    end`);
  parts.push(`    if creature.Parent then creature:Destroy() end
  end)

  table.insert(activeCreatures, creature)
  return creature
end

local function startNightWave()
  local spawnRadius = 200
  local types = {"wolf","wolf","zombie","bear","spider"}
  for i = 1, 6 do
    local angle = math.random() * math.pi * 2
    local pos = Vector3.new(math.cos(angle)*spawnRadius, 5, math.sin(angle)*spawnRadius)
    spawnThreat(types[math.random(1,#types)], pos)
    task.wait(3)
  end
end

-- ============================================================
-- SYSTEM 6: FISHING MINIGAME
-- ============================================================
local FISH_TABLE = {
  { item="small_fish",  weight=50 },
  { item="medium_fish", weight=30 },
  { item="large_fish",  weight=15 },
  { item="boot",        weight=5  },
}

StartFishing.OnServerEvent:Connect(function(player)
  local inv = getInv(player)
  if (inv["fishing_rod"] or 0) <= 0 then
    FishingResult:FireClient(player, false, "No fishing rod"); return
  end
  local biteTime = 5 + math.random() * 10
  task.wait(biteTime)
  FishingResult:FireClient(player, "bite")

  local reeledIn = false
  local conn
  conn = ReelIn.OnServerEvent:Connect(function(p)
    if p == player then reeledIn = true end
    conn:Disconnect()
  end)
  task.wait(3)
  conn:Disconnect()

  if reeledIn then
    local roll = math.random(1, 100)
    local cumulative = 0
    local caught = FISH_TABLE[1]`);
  parts.push(`    for _, fish in ipairs(FISH_TABLE) do
      cumulative += fish.weight
      if roll <= cumulative then caught = fish; break end
    end
    addItem(player, caught.item, 1)
    FishingResult:FireClient(player, true, caught.item)
  else
    FishingResult:FireClient(player, false, "Fish got away")
  end
end)

-- ============================================================
-- DATA PERSISTENCE
-- ============================================================
Players.PlayerRemoving:Connect(function(player)
  local inv = playerInventory[player.UserId]
  if inv then pcall(function() ResourceDS:SetAsync("inv_"..player.UserId, inv) end) end
  playerNeeds[player.UserId]     = nil
  playerInventory[player.UserId] = nil
end)

game:BindToClose(function()
  for _, p in ipairs(Players:GetPlayers()) do
    local inv = playerInventory[p.UserId]
    if inv then pcall(function() ResourceDS:SetAsync("inv_"..p.UserId, inv) end) end
  end
end)

task.spawn(setupResourceNodes)
`);
  return parts.join("\n");
}
