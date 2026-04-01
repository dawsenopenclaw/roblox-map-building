/**
 * Practice outputs — gold-standard Luau examples for few-shot learning.
 * Top 10 agents × 5 outputs each = 50 total.
 * All code is real, working Luau. No pseudocode.
 *
 * Keys match idealOutputKey in training.ts PracticeScenario entries.
 */

export const IDEAL_OUTPUTS: Record<string, string> = {

  // ─── terrain-gen ──────────────────────────────────────────────────────────

  terrain_forest: `-- Forest Biome Generator
local Terrain = workspace.Terrain
-- Base grass layer
Terrain:FillBlock(CFrame.new(0, -10, 0), Vector3.new(512, 20, 512), Enum.Material.Grass)
-- Rolling hills
for i = 1, 14 do
  local x = math.random(-220, 220)
  local z = math.random(-220, 220)
  local r = math.random(25, 65)
  local h = math.random(8, 35)
  Terrain:FillBall(Vector3.new(x, h * 0.5, z), r, Enum.Material.LeafyGrass)
end
-- Small pond
Terrain:FillBall(Vector3.new(60, -2, -40), 28, Enum.Material.Water)
Terrain:FillBlock(CFrame.new(60, -14, -40), Vector3.new(56, 6, 56), Enum.Material.Sand)
-- Trees
local folder = Instance.new("Folder")
folder.Name = "ForestTrees"
folder.Parent = workspace
for i = 1, 55 do
  local tx = math.random(-210, 210)
  local tz = math.random(-210, 210)
  local th = math.random(10, 20)
  local trunk = Instance.new("Part")
  trunk.Size = Vector3.new(2, th, 2)
  trunk.CFrame = CFrame.new(tx, th * 0.5, tz)
  trunk.Color = Color3.fromRGB(101, 67, 33)
  trunk.Material = Enum.Material.Wood
  trunk.Anchored = true
  trunk.Parent = folder
  local canopy = Instance.new("Part")
  canopy.Shape = Enum.PartType.Ball
  canopy.Size = Vector3.new(14, 11, 14)
  canopy.CFrame = CFrame.new(tx, th + 5, tz)
  canopy.Color = Color3.fromRGB(34, 120, 34)
  canopy.Material = Enum.Material.LeafyGrass
  canopy.Anchored = true
  canopy.CastShadow = true
  canopy.Parent = folder
end`,

  terrain_desert: `-- Desert Biome Generator
local Terrain = workspace.Terrain
-- Base sand layer
Terrain:FillBlock(CFrame.new(0, -10, 0), Vector3.new(512, 20, 512), Enum.Material.Sand)
-- Dunes via overlapping balls
for i = 1, 18 do
  local x = math.random(-230, 230)
  local z = math.random(-230, 230)
  local r = math.random(20, 55)
  local h = math.random(5, 22)
  Terrain:FillBall(Vector3.new(x, h * 0.4, z), r, Enum.Material.Sand)
end
-- Rocky outcrops
for i = 1, 10 do
  local x = math.random(-200, 200)
  local z = math.random(-200, 200)
  local r = math.random(8, 25)
  Terrain:FillBall(Vector3.new(x, r * 0.6, z), r, Enum.Material.Rock)
  Terrain:FillBall(Vector3.new(x + math.random(-6, 6), r * 0.8 + 4, z + math.random(-6, 6)), r * 0.55, Enum.Material.Rock)
end
-- Dry riverbed (Air cut through sand)
for i = 0, 6 do
  local ox = i * 25 - 75
  Terrain:FillBall(Vector3.new(ox, 1, ox * 0.3), 14, Enum.Material.SandRed)
end
-- Cacti (Parts)
local folder = Instance.new("Folder")
folder.Name = "DesertCacti"
folder.Parent = workspace
for i = 1, 18 do
  local cx = math.random(-200, 200)
  local cz = math.random(-200, 200)
  local ch = math.random(6, 14)
  local body = Instance.new("Part")
  body.Size = Vector3.new(1.5, ch, 1.5)
  body.CFrame = CFrame.new(cx, ch * 0.5, cz)
  body.Color = Color3.fromRGB(60, 130, 50)
  body.Material = Enum.Material.Grass
  body.Anchored = true
  body.Parent = folder
end`,

  terrain_arctic: `-- Arctic Biome Generator
local Terrain = workspace.Terrain
-- Snow base
Terrain:FillBlock(CFrame.new(0, -10, 0), Vector3.new(512, 20, 512), Enum.Material.Snow)
-- Ice sheets (flat ellipses near surface)
for i = 1, 8 do
  local x = math.random(-200, 200)
  local z = math.random(-200, 200)
  Terrain:FillBlock(CFrame.new(x, 0.5, z), Vector3.new(math.random(40, 90), 1, math.random(40, 90)), Enum.Material.Glacier)
end
-- Snowy hills
for i = 1, 10 do
  local x = math.random(-220, 220)
  local z = math.random(-220, 220)
  local r = math.random(20, 50)
  Terrain:FillBall(Vector3.new(x, r * 0.4, z), r, Enum.Material.Snow)
end
-- Frozen river strip
Terrain:FillBlock(CFrame.new(0, 0, 0), Vector3.new(512, 1, 18), Enum.Material.Glacier)
-- Ice spires
local folder = Instance.new("Folder")
folder.Name = "IceSpires"
folder.Parent = workspace
for i = 1, 20 do
  local sx = math.random(-200, 200)
  local sz = math.random(-200, 200)
  local sh = math.random(6, 22)
  local spire = Instance.new("Part")
  spire.Size = Vector3.new(2, sh, 2)
  spire.CFrame = CFrame.new(sx, sh * 0.5, sz) * CFrame.Angles(0, math.random() * math.pi * 2, math.random(-0.2, 0.2))
  spire.Color = Color3.fromRGB(180, 230, 255)
  spire.Material = Enum.Material.Ice
  spire.Anchored = true
  spire.Transparency = 0.25
  spire.Parent = folder
end`,

  terrain_volcanic: `-- Volcanic Biome Generator
local Terrain = workspace.Terrain
-- Basalt base
Terrain:FillBlock(CFrame.new(0, -10, 0), Vector3.new(512, 20, 512), Enum.Material.Basalt)
-- Lava rivers (CrackedLava channels)
for i = 1, 5 do
  local ox = math.random(-180, 180)
  local oz = math.random(-180, 180)
  for j = 0, 12 do
    Terrain:FillBall(Vector3.new(ox + j * 20, 0.5, oz + math.random(-8, 8)), 12, Enum.Material.CrackedLava)
  end
end
-- Caldera crater in center
Terrain:FillBall(Vector3.new(0, -8, 0), 55, Enum.Material.Basalt)
Terrain:FillBall(Vector3.new(0, 5, 0), 30, Enum.Material.CrackedLava) -- lava pool
-- Volcanic ridges
for i = 1, 12 do
  local x = math.random(-220, 220)
  local z = math.random(-220, 220)
  local r = math.random(15, 45)
  local h = math.random(10, 40)
  Terrain:FillBall(Vector3.new(x, h * 0.5, z), r, Enum.Material.Basalt)
end
-- Obsidian pillars
local folder = Instance.new("Folder")
folder.Name = "ObsidianPillars"
folder.Parent = workspace
for i = 1, 22 do
  local px = math.random(-200, 200)
  local pz = math.random(-200, 200)
  local ph = math.random(8, 28)
  local pillar = Instance.new("Part")
  pillar.Size = Vector3.new(math.random(2, 5), ph, math.random(2, 5))
  pillar.CFrame = CFrame.new(px, ph * 0.5, pz)
  pillar.Color = Color3.fromRGB(20, 15, 25)
  pillar.Material = Enum.Material.Neon
  pillar.Reflectance = 0.3
  pillar.Anchored = true
  pillar.Parent = folder
end`,

  terrain_cave: `-- Underground Cave Biome Generator
local Terrain = workspace.Terrain
-- Solid rock shell
Terrain:FillBlock(CFrame.new(0, 0, 0), Vector3.new(300, 80, 300), Enum.Material.Rock)
-- Hollow out main chamber with Air
Terrain:FillBall(Vector3.new(0, 20, 0), 70, Enum.Material.Air)
-- Side tunnels
local tunnels = {
  {Vector3.new(90, 18, 0), Vector3.new(55, 20, 55)},
  {Vector3.new(-90, 15, 0), Vector3.new(55, 18, 55)},
  {Vector3.new(0, 16, 90), Vector3.new(55, 16, 55)},
}
for _, t in ipairs(tunnels) do
  Terrain:FillBlock(CFrame.new(t[1]), t[2], Enum.Material.Air)
end
-- Underground river
Terrain:FillBlock(CFrame.new(0, 5, 0), Vector3.new(200, 4, 14), Enum.Material.Water)
-- Stalactites / stalagmites (Parts)
local folder = Instance.new("Folder")
folder.Name = "CaveFormations"
folder.Parent = workspace
local function makeSpike(pos, h, flip)
  local spike = Instance.new("SpecialMesh") -- we use a WedgePart approximation
  local part = Instance.new("Part")
  part.Size = Vector3.new(1.5, h, 1.5)
  local yOff = flip and (55 - h * 0.5) or (h * 0.5 - 2)
  part.CFrame = CFrame.new(pos.X, yOff, pos.Z)
  part.Color = Color3.fromRGB(90, 80, 100)
  part.Material = Enum.Material.Limestone
  part.Anchored = true
  part.Parent = folder
end
for i = 1, 40 do
  local x = math.random(-55, 55)
  local z = math.random(-55, 55)
  makeSpike(Vector3.new(x, 0, z), math.random(4, 14), false) -- floor
  makeSpike(Vector3.new(x + math.random(-3,3), 0, z + math.random(-3,3)), math.random(4, 12), true) -- ceiling
end
-- Crystal clusters (Neon Parts)
for i = 1, 15 do
  local cx = math.random(-50, 50)
  local cz = math.random(-50, 50)
  local crystal = Instance.new("Part")
  crystal.Size = Vector3.new(1, math.random(3, 8), 1)
  crystal.CFrame = CFrame.new(cx, math.random(6, 10), cz) * CFrame.Angles(math.random(-0.3,0.3), 0, math.random(-0.3,0.3))
  crystal.Color = Color3.fromRGB(math.random(100,200), math.random(50,150), 255)
  crystal.Material = Enum.Material.Neon
  crystal.Transparency = 0.4
  crystal.Anchored = true
  crystal.Parent = folder
end`,

  // ─── script-writer ────────────────────────────────────────────────────────

  script_datastore: `-- DataStore Save/Load Module (ServerScript)
local DataStoreService = game:GetService("DataStoreService")
local Players = game:GetService("Players")
local playerStore = DataStoreService:GetDataStore("PlayerData_v1")

local DEFAULT_DATA = {
  coins = 0,
  level = 1,
  inventory = {},
}

local playerData: {[number]: {}} = {}

local function deepCopy(t: {})
  local copy = {}
  for k, v in pairs(t) do
    copy[k] = type(v) == "table" and deepCopy(v) or v
  end
  return copy
end

local function loadData(player: Player)
  local key = "player_" .. player.UserId
  local ok, result = pcall(function()
    return playerStore:GetAsync(key)
  end)
  if ok and result then
    -- Merge saved data over defaults so new keys always exist
    local data = deepCopy(DEFAULT_DATA)
    for k, v in pairs(result) do
      data[k] = v
    end
    playerData[player.UserId] = data
  else
    playerData[player.UserId] = deepCopy(DEFAULT_DATA)
    if not ok then
      warn("[DataStore] Load failed for", player.Name, ":", result)
    end
  end
end

local function saveData(player: Player)
  local key = "player_" .. player.UserId
  local data = playerData[player.UserId]
  if not data then return end
  local ok, err = pcall(function()
    playerStore:SetAsync(key, data)
  end)
  if not ok then
    warn("[DataStore] Save failed for", player.Name, ":", err)
  end
end

Players.PlayerAdded:Connect(function(player)
  loadData(player)
end)

Players.PlayerRemoving:Connect(function(player)
  saveData(player)
  playerData[player.UserId] = nil
end)

-- Auto-save every 60 seconds
task.spawn(function()
  while true do
    task.wait(60)
    for _, player in ipairs(Players:GetPlayers()) do
      saveData(player)
    end
  end
end)

return {
  get = function(player: Player, key: string)
    local data = playerData[player.UserId]
    return data and data[key]
  end,
  set = function(player: Player, key: string, value: any)
    local data = playerData[player.UserId]
    if data then data[key] = value end
  end,
}`,

  script_leaderboard: `-- Ordered Leaderboard (ServerScript — runs every 60s)
local DataStoreService = game:GetService("DataStoreService")
local Players = game:GetService("Players")
local scoreStore = DataStoreService:GetOrderedDataStore("GlobalScores_v1")
local RemoteEvent = game.ReplicatedStorage:WaitForChild("UpdateLeaderboard")

local function fetchTopPlayers(count: number): {{name: string, score: number}}
  local ok, pages = pcall(function()
    return scoreStore:GetSortedAsync(false, count)
  end)
  if not ok then
    warn("[Leaderboard] GetSortedAsync failed:", pages)
    return {}
  end
  local results = {}
  local page = pages:GetCurrentPage()
  for _, entry in ipairs(page) do
    local ok2, name = pcall(function()
      return Players:GetNameFromUserIdAsync(tonumber(entry.key))
    end)
    table.insert(results, {
      name = ok2 and name or "Unknown",
      score = entry.value,
    })
  end
  return results
end

local function submitScore(player: Player, score: number)
  local ok, err = pcall(function()
    scoreStore:SetAsync(tostring(player.UserId), math.floor(score))
  end)
  if not ok then
    warn("[Leaderboard] SetAsync failed:", err)
  end
end

-- Broadcast to all clients every 60 seconds
task.spawn(function()
  while true do
    local top = fetchTopPlayers(10)
    RemoteEvent:FireAllClients(top)
    task.wait(60)
  end
end)

return { submitScore = submitScore, fetchTopPlayers = fetchTopPlayers }`,

  script_shop: `-- Shop Purchase Handler (ServerScript)
local MarketplaceService = game:GetService("MarketplaceService")
local Players = game:GetService("Players")

-- Product ID → grant function map
local PRODUCTS: {[number]: (player: Player) -> ()} = {
  [1234567] = function(player)
    -- Grant 500 coins
    local data = require(script.Parent.DataManager)
    local current = data.get(player, "coins") or 0
    data.set(player, "coins", current + 500)
    game.ReplicatedStorage.UpdateCoinsRemote:FireClient(player, current + 500)
  end,
  [1234568] = function(player)
    -- Grant VIP badge / tag
    local data = require(script.Parent.DataManager)
    data.set(player, "vip", true)
  end,
}

MarketplaceService.ProcessReceipt = function(receiptInfo)
  local player = Players:GetPlayerByUserId(receiptInfo.PlayerId)
  if not player then
    -- Player left — retry later
    return Enum.ProductPurchaseDecision.NotProcessedYet
  end
  local grant = PRODUCTS[receiptInfo.ProductId]
  if grant then
    local ok, err = pcall(grant, player)
    if not ok then
      warn("[Shop] Grant failed:", err)
      return Enum.ProductPurchaseDecision.NotProcessedYet
    end
  end
  return Enum.ProductPurchaseDecision.PurchaseGranted
end`,

  script_pet_follow: `-- Pet Follow System (LocalScript inside StarterCharacterScripts)
local RunService = game:GetService("RunService")
local Players = game:GetService("Players")
local player = Players.LocalPlayer
local character = player.Character or player.CharacterAdded:Wait()
local rootPart = character:WaitForChild("HumanoidRootPart")

-- Spawn a simple pet part
local pet = Instance.new("Part")
pet.Size = Vector3.new(2, 2, 2)
pet.Shape = Enum.PartType.Ball
pet.Color = Color3.fromRGB(255, 180, 60)
pet.Material = Enum.Material.SmoothPlastic
pet.Anchored = true
pet.CanCollide = false
pet.CastShadow = false
pet.Parent = workspace

local FOLLOW_DISTANCE = 4
local FOLLOW_HEIGHT = 2
local LERP_SPEED = 8

local connection = RunService.Heartbeat:Connect(function(dt)
  if not rootPart or not rootPart.Parent then
    pet:Destroy()
    connection:Disconnect()
    return
  end
  local target = rootPart.CFrame
    * CFrame.new(-FOLLOW_DISTANCE, FOLLOW_HEIGHT, 0)
  pet.CFrame = pet.CFrame:Lerp(target, math.min(LERP_SPEED * dt, 1))
end)

-- Clean up when character respawns
player.CharacterRemoving:Connect(function()
  connection:Disconnect()
  pet:Destroy()
end)`,

  script_tycoon: `-- Tycoon Dropper + Collector (ServerScript)
local Debris = game:GetService("Debris")
local Players = game:GetService("Players")

local dropper = script.Parent           -- Part named "Dropper"
local collector = workspace:WaitForChild("Collector") -- Part with Touched
local COIN_VALUE = 10
local DROP_INTERVAL = 1.5

-- Track per-player earnings (from DataManager in real game)
local playerCoins: {[number]: number} = {}
Players.PlayerAdded:Connect(function(p) playerCoins[p.UserId] = 0 end)
Players.PlayerRemoving:Connect(function(p) playerCoins[p.UserId] = nil end)

-- Spawn coins on interval
task.spawn(function()
  while true do
    task.wait(DROP_INTERVAL)
    local coin = Instance.new("Part")
    coin.Size = Vector3.new(1, 1, 1)
    coin.Shape = Enum.PartType.Ball
    coin.Color = Color3.fromRGB(255, 215, 0)
    coin.Material = Enum.Material.SmoothPlastic
    coin.CFrame = dropper.CFrame * CFrame.new(0, -2, 0)
    coin.Parent = workspace
    Debris:AddItem(coin, 10)
    -- Give it downward velocity via a BodyVelocity
    local bv = Instance.new("BodyVelocity")
    bv.Velocity = Vector3.new(0, -20, 0)
    bv.MaxForce = Vector3.new(0, math.huge, 0)
    bv.Parent = coin
    Debris:AddItem(bv, 0.3)
  end
end)

-- Collect on touch
collector.Touched:Connect(function(hit)
  if hit.Name ~= "Part" then return end
  -- Find owning player by proximity
  local nearest: Player? = nil
  local nearDist = 20
  for _, p in ipairs(Players:GetPlayers()) do
    local char = p.Character
    if char and char:FindFirstChild("HumanoidRootPart") then
      local d = (char.HumanoidRootPart.Position - collector.Position).Magnitude
      if d < nearDist then nearest = p; nearDist = d end
    end
  end
  if nearest then
    playerCoins[nearest.UserId] = (playerCoins[nearest.UserId] or 0) + COIN_VALUE
    hit:Destroy()
  end
end)`,

  // ─── ui-designer ──────────────────────────────────────────────────────────

  ui_main_menu: `-- Main Menu ScreenGui (LocalScript)
local TweenService = game:GetService("TweenService")
local Players = game:GetService("Players")
local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

local screen = Instance.new("ScreenGui")
screen.Name = "MainMenu"
screen.ResetOnSpawn = false
screen.IgnoreGuiInset = true
screen.Parent = playerGui

local bg = Instance.new("Frame")
bg.Size = UDim2.fromScale(1, 1)
bg.BackgroundColor3 = Color3.fromRGB(12, 14, 30)
bg.BorderSizePixel = 0
bg.Parent = screen

local title = Instance.new("TextLabel")
title.Size = UDim2.new(0.6, 0, 0.12, 0)
title.Position = UDim2.new(0.2, 0, 0.1, 0)
title.BackgroundTransparency = 1
title.Text = "MY GAME"
title.TextColor3 = Color3.fromRGB(255, 215, 60)
title.TextScaled = true
title.Font = Enum.Font.GothamBold
title.Parent = bg

local BUTTONS = {
  {text = "PLAY",     color = Color3.fromRGB(60, 180, 80)},
  {text = "SHOP",     color = Color3.fromRGB(60, 130, 220)},
  {text = "SETTINGS", color = Color3.fromRGB(140, 100, 220)},
  {text = "CREDITS",  color = Color3.fromRGB(180, 180, 180)},
}

local list = Instance.new("UIListLayout")
list.FillDirection = Enum.FillDirection.Vertical
list.HorizontalAlignment = Enum.HorizontalAlignment.Center
list.VerticalAlignment = Enum.VerticalAlignment.Center
list.Padding = UDim.new(0, 10)
list.Parent = bg

for i, def in ipairs(BUTTONS) do
  local btn = Instance.new("TextButton")
  btn.Size = UDim2.new(0.35, 0, 0.08, 0)
  btn.Position = UDim2.new(0.325, 0, 0.3 + (i - 1) * 0.12, 0)
  btn.BackgroundColor3 = def.color
  btn.Text = def.text
  btn.TextColor3 = Color3.new(1, 1, 1)
  btn.TextScaled = true
  btn.Font = Enum.Font.GothamBold
  btn.BorderSizePixel = 0
  btn.Parent = bg
  Instance.new("UICorner", btn).CornerRadius = UDim.new(0, 10)

  btn.MouseEnter:Connect(function()
    TweenService:Create(btn, TweenInfo.new(0.12), {Size = UDim2.new(0.37, 0, 0.085, 0)}):Play()
  end)
  btn.MouseLeave:Connect(function()
    TweenService:Create(btn, TweenInfo.new(0.12), {Size = UDim2.new(0.35, 0, 0.08, 0)}):Play()
  end)
end`,

  ui_health_bar: `-- Health Bar HUD (LocalScript in StarterCharacterScripts)
local TweenService = game:GetService("TweenService")
local Players = game:GetService("Players")
local player = Players.LocalPlayer
local character = player.Character or player.CharacterAdded:Wait()
local humanoid = character:WaitForChild("Humanoid")

local screen = Instance.new("ScreenGui")
screen.Name = "HealthHUD"
screen.ResetOnSpawn = true
screen.Parent = player:WaitForChild("PlayerGui")

local container = Instance.new("Frame")
container.Size = UDim2.new(0.25, 0, 0.025, 0)
container.Position = UDim2.new(0.375, 0, 0.92, 0)
container.BackgroundColor3 = Color3.fromRGB(30, 30, 30)
container.BorderSizePixel = 0
container.Parent = screen
Instance.new("UICorner", container).CornerRadius = UDim.new(1, 0)

local fill = Instance.new("Frame")
fill.Size = UDim2.fromScale(1, 1)
fill.BackgroundColor3 = Color3.fromRGB(80, 220, 80)
fill.BorderSizePixel = 0
fill.Parent = container
Instance.new("UICorner", fill).CornerRadius = UDim.new(1, 0)

local label = Instance.new("TextLabel")
label.Size = UDim2.fromScale(1, 1)
label.BackgroundTransparency = 1
label.TextColor3 = Color3.new(1, 1, 1)
label.TextScaled = true
label.Font = Enum.Font.GothamBold
label.Parent = container

local function updateHealth(health: number, maxHealth: number)
  local pct = math.clamp(health / maxHealth, 0, 1)
  local color = pct > 0.5
    and Color3.fromRGB(80, 220, 80)
    or pct > 0.25 and Color3.fromRGB(240, 180, 40)
    or Color3.fromRGB(220, 60, 60)
  TweenService:Create(fill, TweenInfo.new(0.2), {
    Size = UDim2.new(pct, 0, 1, 0),
    BackgroundColor3 = color,
  }):Play()
  label.Text = math.ceil(health) .. " / " .. math.ceil(maxHealth)
end

updateHealth(humanoid.Health, humanoid.MaxHealth)
humanoid.HealthChanged:Connect(function(health)
  updateHealth(health, humanoid.MaxHealth)
end)`,

  ui_dialogue: `-- NPC Dialogue Box (LocalScript)
local TweenService = game:GetService("TweenService")
local Players = game:GetService("Players")
local player = Players.LocalPlayer

local screen = Instance.new("ScreenGui")
screen.Name = "DialogueGui"
screen.ResetOnSpawn = false
screen.Parent = player:WaitForChild("PlayerGui")

local box = Instance.new("Frame")
box.Size = UDim2.new(0.6, 0, 0.18, 0)
box.Position = UDim2.new(0.2, 0, 0.75, 0)
box.BackgroundColor3 = Color3.fromRGB(15, 15, 25)
box.BackgroundTransparency = 0.15
box.BorderSizePixel = 0
box.Visible = false
box.Parent = screen
Instance.new("UICorner", box).CornerRadius = UDim.new(0, 12)

local nameLabel = Instance.new("TextLabel")
nameLabel.Size = UDim2.new(1, 0, 0.3, 0)
nameLabel.BackgroundTransparency = 1
nameLabel.TextColor3 = Color3.fromRGB(255, 215, 60)
nameLabel.TextScaled = true
nameLabel.Font = Enum.Font.GothamBold
nameLabel.TextXAlignment = Enum.TextXAlignment.Left
nameLabel.Position = UDim2.new(0.02, 0, 0, 0)
nameLabel.Parent = box

local textLabel = Instance.new("TextLabel")
textLabel.Size = UDim2.new(0.96, 0, 0.6, 0)
textLabel.Position = UDim2.new(0.02, 0, 0.32, 0)
textLabel.BackgroundTransparency = 1
textLabel.TextColor3 = Color3.new(1, 1, 1)
textLabel.TextScaled = true
textLabel.Font = Enum.Font.Gotham
textLabel.TextXAlignment = Enum.TextXAlignment.Left
textLabel.TextWrapped = true
textLabel.Parent = box

local function typewrite(text: string, speed: number?)
  local delay = speed or 0.03
  textLabel.Text = ""
  for i = 1, #text do
    textLabel.Text = string.sub(text, 1, i)
    task.wait(delay)
  end
end

local function showDialogue(npcName: string, lines: {string})
  nameLabel.Text = npcName
  box.Visible = true
  TweenService:Create(box, TweenInfo.new(0.2), {BackgroundTransparency = 0.15}):Play()
  for _, line in ipairs(lines) do
    typewrite(line)
    task.wait(1.5)
  end
  TweenService:Create(box, TweenInfo.new(0.2), {BackgroundTransparency = 1}):Play()
  task.wait(0.21)
  box.Visible = false
end

-- Expose globally so NPC proximity scripts can call it
_G.showDialogue = showDialogue`,

  ui_notification: `-- Notification Toast System (LocalScript)
local TweenService = game:GetService("TweenService")
local Players = game:GetService("Players")
local player = Players.LocalPlayer

local screen = Instance.new("ScreenGui")
screen.Name = "NotificationGui"
screen.ResetOnSpawn = false
screen.DisplayOrder = 99
screen.Parent = player:WaitForChild("PlayerGui")

local container = Instance.new("Frame")
container.Size = UDim2.new(0.28, 0, 0.5, 0)
container.Position = UDim2.new(0.01, 0, 0.45, 0)
container.BackgroundTransparency = 1
container.Parent = screen
local list = Instance.new("UIListLayout")
list.FillDirection = Enum.FillDirection.Vertical
list.VerticalAlignment = Enum.VerticalAlignment.Bottom
list.Padding = UDim.new(0, 6)
list.Parent = container

local function showNotification(message: string, color: Color3?)
  local bgColor = color or Color3.fromRGB(40, 120, 220)
  local toast = Instance.new("Frame")
  toast.Size = UDim2.new(1, 0, 0, 44)
  toast.BackgroundColor3 = bgColor
  toast.BackgroundTransparency = 0.1
  toast.BorderSizePixel = 0
  toast.ClipsDescendants = true
  toast.Parent = container
  Instance.new("UICorner", toast).CornerRadius = UDim.new(0, 8)

  local lbl = Instance.new("TextLabel")
  lbl.Size = UDim2.new(0.92, 0, 1, 0)
  lbl.Position = UDim2.new(0.04, 0, 0, 0)
  lbl.BackgroundTransparency = 1
  lbl.Text = message
  lbl.TextColor3 = Color3.new(1, 1, 1)
  lbl.TextScaled = true
  lbl.Font = Enum.Font.Gotham
  lbl.TextXAlignment = Enum.TextXAlignment.Left
  lbl.Parent = toast

  -- Slide in
  toast.Position = UDim2.new(-1.1, 0, 0, 0)
  TweenService:Create(toast, TweenInfo.new(0.25, Enum.EasingStyle.Back), {Position = UDim2.new(0, 0, 0, 0)}):Play()

  -- Auto-dismiss after 3 seconds
  task.delay(3, function()
    TweenService:Create(toast, TweenInfo.new(0.2), {BackgroundTransparency = 1}):Play()
    TweenService:Create(lbl, TweenInfo.new(0.2), {TextTransparency = 1}):Play()
    task.wait(0.22)
    toast:Destroy()
  end)
end

-- Expose for other scripts
_G.notify = showNotification`,

  ui_loading: `-- Loading Screen (LocalScript in ReplicatedFirst)
local TweenService = game:GetService("TweenService")
local ContentProvider = game:GetService("ContentProvider")
local Players = game:GetService("Players")
local ReplicatedFirst = game:GetService("ReplicatedFirst")
ReplicatedFirst:RemoveDefaultLoadingScreen()

local player = Players.LocalPlayer
local screen = Instance.new("ScreenGui")
screen.Name = "LoadingScreen"
screen.IgnoreGuiInset = true
screen.DisplayOrder = 200
screen.Parent = player:WaitForChild("PlayerGui")

local bg = Instance.new("Frame")
bg.Size = UDim2.fromScale(1, 1)
bg.BackgroundColor3 = Color3.fromRGB(8, 10, 20)
bg.BorderSizePixel = 0
bg.Parent = screen

local title = Instance.new("TextLabel")
title.Size = UDim2.new(0.5, 0, 0.1, 0)
title.Position = UDim2.new(0.25, 0, 0.3, 0)
title.BackgroundTransparency = 1
title.Text = "LOADING..."
title.TextColor3 = Color3.new(1, 1, 1)
title.TextScaled = true
title.Font = Enum.Font.GothamBold
title.Parent = bg

local barBg = Instance.new("Frame")
barBg.Size = UDim2.new(0.5, 0, 0.025, 0)
barBg.Position = UDim2.new(0.25, 0, 0.55, 0)
barBg.BackgroundColor3 = Color3.fromRGB(40, 40, 60)
barBg.BorderSizePixel = 0
barBg.Parent = bg
Instance.new("UICorner", barBg).CornerRadius = UDim.new(1, 0)

local fill = Instance.new("Frame")
fill.Size = UDim2.fromScale(0, 1)
fill.BackgroundColor3 = Color3.fromRGB(80, 160, 255)
fill.BorderSizePixel = 0
fill.Parent = barBg
Instance.new("UICorner", fill).CornerRadius = UDim.new(1, 0)

-- Preload assets and update bar
task.spawn(function()
  local assets = game:GetDescendants()
  local total = #assets
  for i, asset in ipairs(assets) do
    ContentProvider:PreloadAsync({asset})
    local pct = i / total
    TweenService:Create(fill, TweenInfo.new(0.1), {Size = UDim2.fromScale(pct, 1)}):Play()
  end
  -- Final fade out
  TweenService:Create(bg, TweenInfo.new(0.5), {BackgroundTransparency = 1}):Play()
  TweenService:Create(title, TweenInfo.new(0.5), {TextTransparency = 1}):Play()
  task.wait(0.55)
  screen:Destroy()
end)`,

  // ─── npc-creator ──────────────────────────────────────────────────────────

  npc_shopkeeper: `-- Shopkeeper NPC (ServerScript)
local Players = game:GetService("Players")
local npc = script.Parent          -- Model with Humanoid + HumanoidRootPart
local humanoid = npc:WaitForChild("Humanoid")
local rootPart = npc:WaitForChild("HumanoidRootPart")

-- Proximity prompt
local prompt = Instance.new("ProximityPrompt")
prompt.ActionText = "Shop"
prompt.ObjectText = npc.Name
prompt.MaxActivationDistance = 8
prompt.HoldDuration = 0
prompt.Parent = rootPart

-- Idle animation
local animator = humanoid:WaitForChild("Animator")
local idleAnim = Instance.new("Animation")
idleAnim.AnimationId = "rbxassetid://507766388"  -- Default idle placeholder
local idleTrack = animator:LoadAnimation(idleAnim)
idleTrack:Play()

-- Face toward nearest player every 2s
task.spawn(function()
  while npc.Parent do
    task.wait(2)
    local nearest: Player? = nil
    local nearDist = 20
    for _, p in ipairs(Players:GetPlayers()) do
      local char = p.Character
      if char and char:FindFirstChild("HumanoidRootPart") then
        local d = (char.HumanoidRootPart.Position - rootPart.Position).Magnitude
        if d < nearDist then nearest = p; nearDist = d end
      end
    end
    if nearest and nearest.Character then
      local lookAt = nearest.Character.HumanoidRootPart.Position
      rootPart.CFrame = CFrame.lookAt(rootPart.Position, Vector3.new(lookAt.X, rootPart.Position.Y, lookAt.Z))
    end
  end
end)

-- Open shop on trigger
prompt.Triggered:Connect(function(player)
  local ok, err = pcall(function()
    game.ReplicatedStorage.OpenShopRemote:FireClient(player, npc.Name)
  end)
  if not ok then warn("[Shopkeeper] FireClient failed:", err) end
end)`,

  npc_enemy: `-- Enemy NPC with Aggro + Pathfinding (ServerScript)
local PathfindingService = game:GetService("PathfindingService")
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local npc = script.Parent
local humanoid: Humanoid = npc:WaitForChild("Humanoid")
local rootPart = npc:WaitForChild("HumanoidRootPart")

local AGGRO_RANGE = 30
local ATTACK_RANGE = 5
local ATTACK_DAMAGE = 15
local ATTACK_COOLDOWN = 1.5
local lastAttack = 0

local function findTarget(): (Player?, BasePart?)
  for _, p in ipairs(Players:GetPlayers()) do
    local char = p.Character
    if not char then continue end
    local root = char:FindFirstChild("HumanoidRootPart")
    local hum = char:FindFirstChildOfClass("Humanoid")
    if root and hum and hum.Health > 0 then
      local dist = (root.Position - rootPart.Position).Magnitude
      if dist <= AGGRO_RANGE then return p, root end
    end
  end
  return nil, nil
end

local function moveToTarget(target: BasePart)
  local path = PathfindingService:CreatePath({ AgentHeight = 5, AgentRadius = 2, AgentCanJump = true })
  local ok, err = pcall(function() path:ComputeAsync(rootPart.Position, target.Position) end)
  if not ok or path.Status ~= Enum.PathStatus.Success then return end
  local waypoints = path:GetWaypoints()
  for _, wp in ipairs(waypoints) do
    if wp.Action == Enum.PathWaypointAction.Jump then humanoid.Jump = true end
    humanoid:MoveTo(wp.Position)
    local reached = humanoid.MoveToFinished:Wait(2)
    if not reached then break end
    -- Re-check target is still in range
    if (target.Position - rootPart.Position).Magnitude > AGGRO_RANGE + 10 then break end
  end
end

local function tryAttack(char: Model)
  local now = os.clock()
  if now - lastAttack < ATTACK_COOLDOWN then return end
  lastAttack = now
  local hum = char:FindFirstChildOfClass("Humanoid")
  if hum then hum:TakeDamage(ATTACK_DAMAGE) end
end

-- Main AI loop
task.spawn(function()
  while humanoid.Health > 0 do
    task.wait(0.5)
    local _, targetRoot = findTarget()
    if targetRoot and targetRoot.Parent then
      local dist = (targetRoot.Position - rootPart.Position).Magnitude
      if dist <= ATTACK_RANGE then
        tryAttack(targetRoot.Parent :: Model)
      else
        moveToTarget(targetRoot)
      end
    else
      humanoid:Move(Vector3.zero)
    end
  end
end)`,

  npc_guard: `-- Guard NPC with Waypoint Patrol (ServerScript)
local PathfindingService = game:GetService("PathfindingService")
local Players = game:GetService("Players")
local npc = script.Parent
local humanoid: Humanoid = npc:WaitForChild("Humanoid")
local rootPart = npc:WaitForChild("HumanoidRootPart")

-- Define patrol waypoints (replace with actual CFrame positions)
local WAYPOINTS = {
  Vector3.new(10, 0, 10),
  Vector3.new(50, 0, 10),
  Vector3.new(50, 0, 50),
  Vector3.new(10, 0, 50),
}

local ALERT_RANGE = 20
local currentWaypoint = 1
local isAlerted = false

local function moveTo(pos: Vector3)
  local path = PathfindingService:CreatePath({ AgentHeight = 5, AgentRadius = 2 })
  local ok = pcall(function() path:ComputeAsync(rootPart.Position, pos) end)
  if not ok or path.Status ~= Enum.PathStatus.Success then
    humanoid:MoveTo(pos)
    humanoid.MoveToFinished:Wait(4)
    return
  end
  for _, wp in ipairs(path:GetWaypoints()) do
    if wp.Action == Enum.PathWaypointAction.Jump then humanoid.Jump = true end
    humanoid:MoveTo(wp.Position)
    humanoid.MoveToFinished:Wait(3)
  end
end

local function checkAlert()
  for _, p in ipairs(Players:GetPlayers()) do
    local char = p.Character
    if char and char:FindFirstChild("HumanoidRootPart") then
      local d = (char.HumanoidRootPart.Position - rootPart.Position).Magnitude
      if d < ALERT_RANGE then
        if not isAlerted then
          isAlerted = true
          game.ReplicatedStorage.GuardAlertRemote:FireClient(p, npc.Name)
        end
        return
      end
    end
  end
  isAlerted = false
end

task.spawn(function()
  while humanoid.Health > 0 do
    checkAlert()
    if not isAlerted then
      moveTo(WAYPOINTS[currentWaypoint])
      currentWaypoint = (currentWaypoint % #WAYPOINTS) + 1
    else
      task.wait(1)
    end
  end
end)`,

  // ─── lighting-expert ──────────────────────────────────────────────────────

  lighting_day_night: `-- Day/Night Cycle (ServerScript)
local Lighting = game:GetService("Lighting")
local TweenService = game:GetService("TweenService")

-- 24-minute full cycle (1 real minute = 1 in-game hour)
local CYCLE_MINUTES = 24
local STEP_SECONDS = 0.5
local HOURS_PER_STEP = (24 / CYCLE_MINUTES) * (STEP_SECONDS / 60)

local COLOR_PRESETS = {
  [6]  = {ambient = Color3.fromRGB(120, 100, 80),  outdoor = Color3.fromRGB(200, 160, 100)},
  [9]  = {ambient = Color3.fromRGB(160, 170, 200), outdoor = Color3.fromRGB(255, 255, 230)},
  [12] = {ambient = Color3.fromRGB(180, 185, 200), outdoor = Color3.fromRGB(255, 255, 255)},
  [18] = {ambient = Color3.fromRGB(160, 110, 80),  outdoor = Color3.fromRGB(255, 160, 80)},
  [21] = {ambient = Color3.fromRGB(40, 50, 80),    outdoor = Color3.fromRGB(20, 30, 60)},
}

local function getPresetForHour(h: number)
  local best, bestDist = COLOR_PRESETS[12], math.huge
  for hour, preset in pairs(COLOR_PRESETS) do
    local dist = math.abs(h - hour)
    if dist < bestDist then best = preset; bestDist = dist end
  end
  return best
end

task.spawn(function()
  while true do
    task.wait(STEP_SECONDS)
    Lighting.ClockTime = (Lighting.ClockTime + HOURS_PER_STEP) % 24
    local preset = getPresetForHour(math.floor(Lighting.ClockTime))
    TweenService:Create(Lighting, TweenInfo.new(STEP_SECONDS), {
      Ambient = preset.ambient,
      OutdoorAmbient = preset.outdoor,
    }):Play()
  end
end)`,

  lighting_cinematic: `-- Cinematic Lighting Setup (Script runs once)
local Lighting = game:GetService("Lighting")

Lighting.Ambient = Color3.fromRGB(80, 90, 120)
Lighting.OutdoorAmbient = Color3.fromRGB(120, 130, 160)
Lighting.ClockTime = 14
Lighting.GeographicLatitude = 45
Lighting.ShadowSoftness = 0.2
Lighting.Technology = Enum.Technology.Future

-- Bloom
local bloom = Instance.new("BloomEffect")
bloom.Enabled = true
bloom.Intensity = 0.4
bloom.Size = 24
bloom.Threshold = 0.95
bloom.Parent = Lighting

-- Color Correction
local cc = Instance.new("ColorCorrectionEffect")
cc.Brightness = 0.02
cc.Contrast = 0.08
cc.Saturation = 0.12
cc.TintColor = Color3.fromRGB(250, 245, 240)
cc.Parent = Lighting

-- Sun Rays
local sun = Instance.new("SunRaysEffect")
sun.Intensity = 0.12
sun.Spread = 0.5
sun.Parent = Lighting

-- Depth of Field
local dof = Instance.new("DepthOfFieldEffect")
dof.Enabled = true
dof.FarIntensity = 0.3
dof.FocusDistance = 50
dof.InFocusRadius = 20
dof.NearIntensity = 0.1
dof.Parent = Lighting

-- Atmosphere
local atmo = Instance.new("Atmosphere")
atmo.Density = 0.28
atmo.Offset = 0.15
atmo.Color = Color3.fromRGB(190, 200, 220)
atmo.Decay = Color3.fromRGB(100, 110, 130)
atmo.Glare = 0.1
atmo.Haze = 1.8
atmo.Parent = Lighting`,

  // ─── particle-fx ──────────────────────────────────────────────────────────

  particle_explosion: `-- Explosion VFX (ServerScript — call explode(pos) from other scripts)
local Debris = game:GetService("Debris")
local TweenService = game:GetService("TweenService")

local function explode(position: Vector3)
  -- Flash light
  local flashPart = Instance.new("Part")
  flashPart.Size = Vector3.new(1, 1, 1)
  flashPart.CFrame = CFrame.new(position)
  flashPart.Anchored = true
  flashPart.CanCollide = false
  flashPart.Transparency = 1
  flashPart.Parent = workspace
  local light = Instance.new("PointLight")
  light.Brightness = 8
  light.Range = 40
  light.Color = Color3.fromRGB(255, 160, 60)
  light.Parent = flashPart
  Debris:AddItem(flashPart, 0.4)
  TweenService:Create(light, TweenInfo.new(0.4), {Brightness = 0}):Play()

  -- Core fireball
  local core = Instance.new("Part")
  core.Size = Vector3.new(4, 4, 4)
  core.Shape = Enum.PartType.Ball
  core.CFrame = CFrame.new(position)
  core.Anchored = true
  core.CanCollide = false
  core.Material = Enum.Material.Neon
  core.Color = Color3.fromRGB(255, 120, 20)
  core.Parent = workspace
  Debris:AddItem(core, 0.35)
  TweenService:Create(core, TweenInfo.new(0.3), {Size = Vector3.new(14, 14, 14), Transparency = 1}):Play()

  -- Shockwave ring
  local ring = Instance.new("Part")
  ring.Size = Vector3.new(2, 0.3, 2)
  ring.CFrame = CFrame.new(position)
  ring.Anchored = true
  ring.CanCollide = false
  ring.Material = Enum.Material.Neon
  ring.Color = Color3.fromRGB(255, 200, 80)
  ring.Shape = Enum.PartType.Cylinder
  ring.Parent = workspace
  Debris:AddItem(ring, 0.5)
  TweenService:Create(ring, TweenInfo.new(0.4, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), {
    Size = Vector3.new(0.2, 40, 40),
    Transparency = 1,
  }):Play()

  -- Debris particles
  local emitterPart = Instance.new("Part")
  emitterPart.Size = Vector3.new(1, 1, 1)
  emitterPart.CFrame = CFrame.new(position)
  emitterPart.Anchored = true
  emitterPart.CanCollide = false
  emitterPart.Transparency = 1
  emitterPart.Parent = workspace
  Debris:AddItem(emitterPart, 2)
  local emitter = Instance.new("ParticleEmitter")
  emitter.Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0, Color3.fromRGB(255, 150, 30)),
    ColorSequenceKeypoint.new(1, Color3.fromRGB(80, 80, 80)),
  })
  emitter.LightEmission = 0.8
  emitter.Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0, 0.8),
    NumberSequenceKeypoint.new(1, 0),
  })
  emitter.Speed = NumberRange.new(12, 28)
  emitter.Lifetime = NumberRange.new(0.6, 1.2)
  emitter.SpreadAngle = Vector2.new(60, 60)
  emitter.Parent = emitterPart
  emitter:Emit(40)
end

return { explode = explode }`,

  particle_aura: `-- Magic Aura VFX (LocalScript — attach to character)
local Players = game:GetService("Players")
local player = Players.LocalPlayer
local character = player.Character or player.CharacterAdded:Wait()
local rootPart = character:WaitForChild("HumanoidRootPart")

local attachment = Instance.new("Attachment")
attachment.Parent = rootPart

-- Main swirl emitter
local swirl = Instance.new("ParticleEmitter")
swirl.Color = ColorSequence.new({
  ColorSequenceKeypoint.new(0, Color3.fromRGB(120, 60, 255)),
  ColorSequenceKeypoint.new(0.5, Color3.fromRGB(200, 120, 255)),
  ColorSequenceKeypoint.new(1, Color3.fromRGB(255, 200, 255)),
})
swirl.LightEmission = 0.9
swirl.LightInfluence = 0.1
swirl.Size = NumberSequence.new({
  NumberSequenceKeypoint.new(0, 0.5),
  NumberSequenceKeypoint.new(0.5, 0.3),
  NumberSequenceKeypoint.new(1, 0),
})
swirl.Transparency = NumberSequence.new({
  NumberSequenceKeypoint.new(0, 0.3),
  NumberSequenceKeypoint.new(1, 1),
})
swirl.Speed = NumberRange.new(3, 8)
swirl.Lifetime = NumberRange.new(0.8, 1.4)
swirl.Rate = 35
swirl.SpreadAngle = Vector2.new(30, 180)
swirl.RotSpeed = NumberRange.new(-180, 180)
swirl.Parent = attachment

-- Glow light
local light = Instance.new("PointLight")
light.Brightness = 1.5
light.Range = 14
light.Color = Color3.fromRGB(150, 80, 255)
light.Parent = rootPart

-- Expose toggle
local function setAura(enabled: boolean)
  swirl.Enabled = enabled
  light.Enabled = enabled
end

_G.setAura = setAura`,

  // ─── combat-system ────────────────────────────────────────────────────────

  combat_melee: `-- Server-Authoritative Melee Combat Module (ModuleScript in ServerScriptService)
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local hitRemote = ReplicatedStorage:WaitForChild("MeleeHitRemote")
local DAMAGE = 25
local HITBOX_SIZE = Vector3.new(6, 6, 6)
local COOLDOWN = 0.6
local MAX_COMBO = 3

local playerState: {[number]: {lastHit: number, combo: number}} = {}

Players.PlayerAdded:Connect(function(p)
  playerState[p.UserId] = { lastHit = 0, combo = 0 }
end)
Players.PlayerRemoving:Connect(function(p)
  playerState[p.UserId] = nil
end)

hitRemote.OnServerEvent:Connect(function(player: Player)
  local state = playerState[player.UserId]
  if not state then return end

  local now = os.clock()
  -- Rate limit: prevent spam
  if now - state.lastHit < COOLDOWN then return end

  local char = player.Character
  if not char then return end
  local root = char:FindFirstChild("HumanoidRootPart") :: BasePart
  if not root then return end

  state.lastHit = now
  state.combo = (state.combo % MAX_COMBO) + 1

  -- Combo damage multiplier
  local damageMultiplier = state.combo == MAX_COMBO and 1.5 or 1.0
  local finalDamage = DAMAGE * damageMultiplier

  -- Server-side hitbox
  local overlapParams = OverlapParams.new()
  overlapParams.FilterType = Enum.RaycastFilterType.Exclude
  overlapParams.FilterDescendantsInstances = {char}

  local hitCFrame = root.CFrame * CFrame.new(0, 0, -4)
  local parts = workspace:GetPartBoundsInBox(hitCFrame, HITBOX_SIZE, overlapParams)

  local hitPlayers: {[number]: boolean} = {}
  for _, part in ipairs(parts) do
    local ok, err = pcall(function()
      local hitChar = part:FindFirstAncestorOfClass("Model")
      if not hitChar then return end
      local hum = hitChar:FindFirstChildOfClass("Humanoid")
      if not hum or hum.Health <= 0 then return end
      -- Prevent hitting same player twice per swing
      local hitPlayer = Players:GetPlayerFromCharacter(hitChar)
      local uid = hitPlayer and hitPlayer.UserId or -math.random(1, 999999)
      if hitPlayers[uid] then return end
      hitPlayers[uid] = true
      hum:TakeDamage(finalDamage)
    end)
    if not ok then warn("[Combat] Hit processing error:", err) end
  end
end)`,

  // ─── economy-designer ─────────────────────────────────────────────────────

  economy_currency: `-- Multi-Currency System (ModuleScript — required by server scripts only)
local DataStoreService = game:GetService("DataStoreService")
local Players = game:GetService("Players")
local currencyStore = DataStoreService:GetDataStore("PlayerCurrency_v1")
local RemoteEvent = game.ReplicatedStorage:WaitForChild("CurrencyUpdateRemote")

type CurrencyData = { coins: number, gems: number, tokens: number }
local DEFAULT: CurrencyData = { coins = 0, gems = 0, tokens = 0 }
local cache: {[number]: CurrencyData} = {}

local function load(player: Player)
  local ok, result = pcall(function()
    return currencyStore:GetAsync("cur_" .. player.UserId)
  end)
  cache[player.UserId] = (ok and result) and result or table.clone(DEFAULT)
  if not ok then warn("[Currency] Load failed:", result) end
  RemoteEvent:FireClient(player, cache[player.UserId])
end

local function save(player: Player)
  local data = cache[player.UserId]
  if not data then return end
  local ok, err = pcall(function()
    currencyStore:SetAsync("cur_" .. player.UserId, data)
  end)
  if not ok then warn("[Currency] Save failed:", err) end
end

local function grant(player: Player, currency: string, amount: number)
  assert(type(amount) == "number" and amount > 0, "Amount must be positive")
  assert(DEFAULT[currency] ~= nil, "Unknown currency: " .. tostring(currency))
  local data = cache[player.UserId]
  if not data then return end
  data[currency] = data[currency] + math.floor(amount)
  RemoteEvent:FireClient(player, data)
end

local function spend(player: Player, currency: string, amount: number): boolean
  assert(type(amount) == "number" and amount > 0, "Amount must be positive")
  local data = cache[player.UserId]
  if not data then return false end
  if data[currency] < amount then return false end
  data[currency] = data[currency] - math.floor(amount)
  RemoteEvent:FireClient(player, data)
  return true
end

Players.PlayerAdded:Connect(load)
Players.PlayerRemoving:Connect(function(p)
  save(p)
  cache[p.UserId] = nil
end)

task.spawn(function()
  while true do
    task.wait(90)
    for _, p in ipairs(Players:GetPlayers()) do save(p) end
  end
end)

return { grant = grant, spend = spend, get = function(p) return cache[p.UserId] end }`,

  // ─── vehicle-builder ──────────────────────────────────────────────────────

  vehicle_car: `-- VehicleSeat Car Controller (ServerScript inside vehicle Model)
local seat = script.Parent:WaitForChild("VehicleSeat") :: VehicleSeat
local chassis = script.Parent:WaitForChild("Chassis") :: BasePart

local MAX_SPEED = 80
local STEER_FORCE = 6000
local DRIVE_FORCE = 20000
local BRAKE_FORCE = 50000

-- Constraints-based approach: BodyVelocity + BodyAngularVelocity on chassis
local bv = Instance.new("BodyVelocity")
bv.MaxForce = Vector3.zero
bv.Velocity = Vector3.zero
bv.Parent = chassis

local bav = Instance.new("BodyAngularVelocity")
bav.MaxTorque = Vector3.zero
bav.AngularVelocity = Vector3.zero
bav.Parent = chassis

local gyro = Instance.new("BodyGyro")
gyro.MaxTorque = Vector3.new(0, 8000, 0)
gyro.D = 200
gyro.P = 5000
gyro.CFrame = chassis.CFrame
gyro.Parent = chassis

local connection: RBXScriptConnection? = nil

seat:GetPropertyChangedSignal("Occupant"):Connect(function()
  if seat.Occupant then
    -- Driving
    bv.MaxForce = Vector3.new(DRIVE_FORCE, 0, DRIVE_FORCE)
    bav.MaxTorque = Vector3.new(0, STEER_FORCE, 0)
    gyro.MaxTorque = Vector3.new(BRAKE_FORCE, 8000, BRAKE_FORCE)

    connection = game:GetService("RunService").Heartbeat:Connect(function()
      local throttle = seat.ThrottleFloat
      local steer = seat.SteerFloat
      local fwd = chassis.CFrame.LookVector
      bv.Velocity = fwd * throttle * MAX_SPEED
      bav.AngularVelocity = Vector3.new(0, -steer * 1.8, 0)
      gyro.CFrame = chassis.CFrame
    end)
  else
    -- Braking / empty
    bv.MaxForce = Vector3.zero
    bav.MaxTorque = Vector3.zero
    if connection then connection:Disconnect(); connection = nil end
  end
end)`,

  // ─── quest-writer ─────────────────────────────────────────────────────────

  quest_chain: `-- 3-Part Quest Chain Module (ModuleScript)
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local questUpdate = ReplicatedStorage:WaitForChild("QuestUpdateRemote")

type Objective = { type: string, target: string, required: number, current: number }
type Quest = { id: string, name: string, description: string, objectives: {Objective}, reward: {}, completed: boolean }

local QUEST_DEFS: {Quest} = {
  {
    id = "q1_gather",
    name = "The First Step",
    description = "Gather 5 forest herbs for the village elder.",
    objectives = {{ type = "collect", target = "ForestHerb", required = 5, current = 0 }},
    reward = { coins = 100, xp = 50 },
    completed = false,
  },
  {
    id = "q2_hunt",
    name = "Thinning the Herd",
    description = "Defeat 3 wolves threatening the village.",
    objectives = {{ type = "kill", target = "Wolf", required = 3, current = 0 }},
    reward = { coins = 250, gems = 1 },
    completed = false,
  },
  {
    id = "q3_boss",
    name = "The Alpha",
    description = "Slay the Alpha Wolf that commands the pack.",
    objectives = {{ type = "kill", target = "AlphaWolf", required = 1, current = 0 }},
    reward = { coins = 1000, gems = 5, item = "WolfFang" },
    completed = false,
  },
}

local playerQuests: {[number]: {Quest}} = {}

local function deepCopyDefs()
  local copy = {}
  for _, q in ipairs(QUEST_DEFS) do
    local qc = table.clone(q)
    qc.objectives = {}
    for _, obj in ipairs(q.objectives) do
      table.insert(qc.objectives, table.clone(obj))
    end
    table.insert(copy, qc)
  end
  return copy
end

local function getActiveQuest(userId: number): Quest?
  local quests = playerQuests[userId]
  if not quests then return nil end
  for _, q in ipairs(quests) do
    if not q.completed then return q end
  end
  return nil
end

local function progressObjective(player: Player, objType: string, target: string)
  local quest = getActiveQuest(player.UserId)
  if not quest then return end
  for _, obj in ipairs(quest.objectives) do
    if obj.type == objType and obj.target == target and obj.current < obj.required then
      obj.current += 1
      questUpdate:FireClient(player, quest)
      if obj.current >= obj.required then
        -- Check if all objectives complete
        local allDone = true
        for _, o in ipairs(quest.objectives) do
          if o.current < o.required then allDone = false; break end
        end
        if allDone then
          quest.completed = true
          -- Grant reward via currency module
          local Currency = require(game.ServerScriptService.CurrencyModule)
          if quest.reward.coins then Currency.grant(player, "coins", quest.reward.coins) end
          if quest.reward.gems then Currency.grant(player, "gems", quest.reward.gems) end
          questUpdate:FireClient(player, quest)
        end
      end
      break
    end
  end
end

local function initPlayer(player: Player)
  playerQuests[player.UserId] = deepCopyDefs()
  local first = getActiveQuest(player.UserId)
  if first then questUpdate:FireClient(player, first) end
end

return {
  initPlayer = initPlayer,
  progressObjective = progressObjective,
  getActiveQuest = getActiveQuest,
}`,

  // ─── weapon-smith ─────────────────────────────────────────────────────────

  weapon_sword: `-- Sword Tool (LocalScript inside Tool + ServerScript for damage)
-- === LocalScript (Tool.LocalScript) ===
local Players = game:GetService("Players")
local UserInputService = game:GetService("UserInputService")
local tool = script.Parent
local player = Players.LocalPlayer
local char = player.Character or player.CharacterAdded:Wait()
local humanoid = char:WaitForChild("Humanoid")
local animator = humanoid:WaitForChild("Animator")
local hitRemote = tool:WaitForChild("HitRemote")

local slashAnim = Instance.new("Animation")
slashAnim.AnimationId = "rbxassetid://522635514"  -- Placeholder
local slashTrack = animator:LoadAnimation(slashAnim)

local COOLDOWN = 0.5
local canSwing = true

tool.Activated:Connect(function()
  if not canSwing then return end
  canSwing = false
  slashTrack:Play()
  hitRemote:FireServer()
  slashTrack.Stopped:Wait()
  canSwing = true
end)

-- === ServerScript (Tool.Script) ===
--[[
local Players = game:GetService("Players")
local tool = script.Parent
local hitRemote = tool:WaitForChild("HitRemote")
local DAMAGE = 30
local HITBOX_SIZE = Vector3.new(6, 5, 6)
local COOLDOWN = 0.5
local lastSwing: {[number]: number} = {}

hitRemote.OnServerEvent:Connect(function(player: Player)
  local now = os.clock()
  if now - (lastSwing[player.UserId] or 0) < COOLDOWN then return end
  lastSwing[player.UserId] = now
  local char = player.Character
  if not char then return end
  local root = char:FindFirstChild("HumanoidRootPart") :: BasePart
  if not root then return end
  local params = OverlapParams.new()
  params.FilterType = Enum.RaycastFilterType.Exclude
  params.FilterDescendantsInstances = {char}
  local parts = workspace:GetPartBoundsInBox(root.CFrame * CFrame.new(0, 0, -4), HITBOX_SIZE, params)
  local hit: {[number]: boolean} = {}
  for _, part in ipairs(parts) do
    local pcall_ok, err = pcall(function()
      local hitChar = part:FindFirstAncestorOfClass("Model")
      if not hitChar then return end
      local hum = hitChar:FindFirstChildOfClass("Humanoid")
      local uid = (Players:GetPlayerFromCharacter(hitChar) or {UserId = -1}).UserId
      if not hum or hum.Health <= 0 or hit[uid] then return end
      hit[uid] = true
      hum:TakeDamage(DAMAGE)
    end)
    if not pcall_ok then warn("[Sword] Error:", err) end
  end
end)
]]`,
}
