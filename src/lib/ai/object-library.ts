/**
 * Object Decomposition Library
 *
 * Real-world objects broken into exact Roblox parts with dimensions,
 * materials, and colors. The AI references this to build objects
 * with real-world accuracy instead of guessing.
 *
 * Each entry is a compact string injected into the prompt ONLY when
 * the user's request matches the object category. This keeps token
 * usage low while providing exact specifications.
 */

export interface ObjectBlueprint {
  keywords: string[]
  category: string
  parts: string // Compact part list for prompt injection
}

// ─── OUTDOOR FURNITURE & INFRASTRUCTURE ────────────────────────────────────

const OBJECTS: ObjectBlueprint[] = [
  // Street furniture
  {
    keywords: ['light pole', 'lamp post', 'street light', 'streetlight', 'lamppost'],
    category: 'street',
    parts: `LIGHT POLE (12 parts): Base(Cyl 3x0.5x3 Concrete 130,130,130), BaseRing(Cyl 2.5x0.3x2.5 Metal 50,50,55), Shaft(Cyl 0.8x12x0.8 Metal 55,55,60), ShaftBand(Cyl 1.2x0.2x1.2 Metal 45,45,50) at Y=10, Arm(P 0.4x0.4x3 Metal 50,50,55 angled 15deg), ArmBracket(P 0.3x0.8x0.3 Metal 50,50,55), LampHousing(P 1.8x0.8x1.2 Metal 40,40,45), GlassCover(P 1.4x0.6x1 Glass 255,240,220 Transp=0.3), Bulb(Ball 0.4 Glass 255,245,230), PointLight(Brightness=3 Range=35 Color=255,200,140), TopCap(Cyl 0.6x0.15x0.6 Metal 45,45,50), ShadowDisc(P 0.1x0.1x0.1 invisible at base for ground contact)`
  },
  {
    keywords: ['bench', 'park bench', 'seat'],
    category: 'street',
    parts: `PARK BENCH (14 parts): LeftLeg(P 0.4x1.6x0.4 Metal 50,50,55), RightLeg(P 0.4x1.6x0.4 Metal 50,50,55), LeftArmrest(P 0.4x0.8x2.2 Metal 50,50,55), RightArmrest(P 0.4x0.8x2.2 Metal 50,50,55), CrossBar(P 0.3x0.3x4.5 Metal 55,55,60), SeatSlat1(P 4.5x0.15x0.5 WoodPlanks 140,95,50), SeatSlat2(P 4.5x0.15x0.5 WoodPlanks 135,90,48), SeatSlat3(P 4.5x0.15x0.5 WoodPlanks 142,97,52), SeatSlat4(P 4.5x0.15x0.5 WoodPlanks 138,92,49), BackSlat1(P 4.5x0.15x0.5 WoodPlanks 140,95,50 angled 100deg), BackSlat2(P 4.5x0.15x0.5 WoodPlanks 136,91,48 angled 100deg), BackSlat3(P 4.5x0.15x0.5 WoodPlanks 143,98,53 angled 100deg), LeftFoot(P 0.6x0.1x0.6 Metal 45,45,50), RightFoot(P 0.6x0.1x0.6 Metal 45,45,50)`
  },
  {
    keywords: ['fire hydrant', 'hydrant'],
    category: 'street',
    parts: `FIRE HYDRANT (8 parts): Base(Cyl 1.2x0.3x1.2 Metal 180,30,30), Body(Cyl 0.8x2.5x0.8 Metal 190,35,35), Cap(Cyl 1x0.2x1 Metal 185,32,32), LeftNozzle(Cyl 0.4x0.8x0.4 Metal 175,28,28 horizontal), RightNozzle(Cyl 0.4x0.8x0.4 Metal 175,28,28 horizontal), TopNut(Cyl 0.5x0.3x0.5 Metal 160,160,45), Chain(P 0.05x0.4x0.05 Metal 120,120,125), CapChain(P 0.05x0.3x0.05 Metal 120,120,125)`
  },
  {
    keywords: ['mailbox', 'post box', 'letter box'],
    category: 'street',
    parts: `MAILBOX (10 parts): Post(P 0.4x3.5x0.4 WoodPlanks 100,70,35), PostBase(P 0.6x0.2x0.6 Concrete 140,140,140), BoxBody(P 1.2x0.8x0.8 Metal 40,80,160), BoxDoor(P 1.2x0.75x0.05 Metal 45,85,165), DoorHandle(P 0.3x0.05x0.05 Metal 180,180,185), Flag(P 0.05x0.3x0.6 Metal 200,40,40), FlagHinge(Cyl 0.1x0.1x0.1 Metal 60,60,65), BoxRoof(W 1.3x0.3x0.9 Metal 38,78,158), NumberPlate(P 0.4x0.2x0.02 Metal 200,200,205), BoxBottom(P 1.2x0.05x0.8 Metal 35,75,155)`
  },
  {
    keywords: ['trash can', 'garbage', 'bin', 'waste'],
    category: 'street',
    parts: `TRASH CAN (7 parts): Body(Cyl 1.5x2.5x1.5 Metal 70,75,70), Rim(Cyl 1.6x0.15x1.6 Metal 65,70,65), Lid(Cyl 1.5x0.1x1.5 Metal 75,80,75), Handle(P 0.6x0.3x0.1 Metal 60,65,60), Liner(Cyl 1.35x2.3x1.35 Plastic 30,30,30), Base(Cyl 1.3x0.1x1.3 Metal 60,65,60), LidKnob(Cyl 0.3x0.15x0.3 Metal 80,85,80)`
  },
  {
    keywords: ['stop sign', 'street sign', 'road sign', 'sign post'],
    category: 'street',
    parts: `STOP SIGN (8 parts): Post(Cyl 0.3x8x0.3 Metal 85,85,90), PostBase(P 0.6x0.1x0.6 Concrete 140,140,140), SignFace(P 2.2x2.2x0.08 Metal 200,30,30), SignBack(P 2.2x2.2x0.05 Metal 120,120,125), SignText(SurfaceGui "STOP" white bold), Bracket(P 0.4x0.3x0.3 Metal 80,80,85), Cap(Cyl 0.35x0.1x0.35 Metal 90,90,95), ReflectorStrip(P 2x0.1x0.05 Metal 255,255,255)`
  },

  // Trees & vegetation
  {
    keywords: ['tree', 'oak', 'pine', 'birch', 'maple'],
    category: 'nature',
    parts: `TREE (12 parts): Trunk(Cyl 1.2x8x1.2 Wood 95,60,30), TrunkBase(Cyl 1.8x1x1.8 Wood 85,50,25 wider), RootFlare1(P 0.6x0.4x1.5 Wood 80,48,22 angled), RootFlare2(P 0.5x0.3x1.3 Wood 82,50,24 angled), Branch1(Cyl 0.4x3x0.4 Wood 90,55,28 angled 30deg), Branch2(Cyl 0.35x2.5x0.35 Wood 88,53,26 angled 45deg other side), MainCanopy(Ball 7 Grass 55,120,45), CanopyLayer2(Ball 5.5 Grass 50,115,40 offset up-left), CanopyLayer3(Ball 4.5 Grass 60,125,50 offset up-right), TopTuft(Ball 3 LeafyGrass 45,110,35 top), ShadowLeaves(Ball 6 Grass 48,108,38 lower translucent), vc all greens by 0.1`
  },
  {
    keywords: ['bush', 'shrub', 'hedge'],
    category: 'nature',
    parts: `BUSH (6 parts): Core(Ball 3 LeafyGrass 50,110,40), Layer2(Ball 2.5 Grass 55,115,45 offset), Layer3(Ball 2 LeafyGrass 45,105,35 offset), TopCluster(Ball 1.5 Grass 60,120,50), Stem(Cyl 0.3x1x0.3 Wood 90,55,28 hidden), GroundRing(Cyl 3.5x0.1x3.5 LeafyGrass 40,95,30)`
  },
  {
    keywords: ['rock', 'boulder', 'stone'],
    category: 'nature',
    parts: `ROCK FORMATION (7 parts): MainBoulder(Ball 4 Rock 130,125,115), SecondRock(Ball 2.5 Rock 125,120,110 offset), SmallRock1(Ball 1.2 Rock 135,130,120 scattered), SmallRock2(Ball 0.8 Rock 128,123,113 scattered), MossPatch(P 1.5x0.05x1.5 LeafyGrass 60,100,45 on top 10% transparent), GravelBase(P 5x0.1x5 Pebble 140,135,125), CrackDetail(P 0.05x1x2 Rock 100,95,85 dark inset)`
  },

  // Vehicles
  {
    keywords: ['car', 'sedan', 'vehicle', 'automobile'],
    category: 'vehicle',
    parts: `CAR (18 parts): Body(P 5x1.2x2.2 Metal 180,30,30), Hood(W 1.8x0.4x2.2 Metal 182,32,32 front angled), Trunk(W 1.2x0.3x2.2 Metal 178,28,28 rear angled), Cabin(P 2.5x1x2 Glass 180,200,220 Transp=0.35), Windshield(P 2.2x0.1x1.8 Glass 190,210,230 Transp=0.4 angled), RearWindow(P 1.8x0.1x1.8 Glass 190,210,230 Transp=0.4 angled), WheelFL(Cyl 0.4x0.8x0.8 Slate 40,40,40), WheelFR(Cyl 0.4x0.8x0.8 Slate 40,40,40), WheelBL(Cyl 0.4x0.8x0.8 Slate 40,40,40), WheelBR(Cyl 0.4x0.8x0.8 Slate 40,40,40), HubFL(Cyl 0.1x0.6x0.6 Metal 200,200,205), HubFR(Cyl 0.1x0.6x0.6 Metal 200,200,205), HubBL(Cyl 0.1x0.6x0.6 Metal 200,200,205), HubBR(Cyl 0.1x0.6x0.6 Metal 200,200,205), HeadlightL(P 0.4x0.3x0.1 Glass 255,250,230 + PointLight), HeadlightR(P 0.4x0.3x0.1 Glass 255,250,230 + PointLight), TaillightL(P 0.3x0.2x0.1 Neon 255,20,20), TaillightR(P 0.3x0.2x0.1 Neon 255,20,20)`
  },

  // Furniture
  {
    keywords: ['chair', 'dining chair', 'wooden chair'],
    category: 'furniture',
    parts: `CHAIR (10 parts): Seat(P 1.6x0.15x1.6 WoodPlanks 140,95,50), LegFL(P 0.15x1.8x0.15 Wood 130,85,40), LegFR(P 0.15x1.8x0.15 Wood 130,85,40), LegBL(P 0.15x3.2x0.15 Wood 130,85,40), LegBR(P 0.15x3.2x0.15 Wood 130,85,40), BackSlat1(P 0.1x1.2x0.4 WoodPlanks 135,90,45), BackSlat2(P 0.1x1.2x0.4 WoodPlanks 138,92,47), BackSlat3(P 0.1x1.2x0.4 WoodPlanks 133,88,43), TopRail(P 0.1x0.15x1.6 Wood 140,95,50), CrossBrace(P 0.1x0.1x1.3 Wood 125,80,38)`
  },
  {
    keywords: ['table', 'dining table', 'desk'],
    category: 'furniture',
    parts: `TABLE (8 parts): Top(P 4x0.2x2.5 WoodPlanks 145,100,55), TopEdge(P 4.1x0.1x2.6 Wood 135,90,45 frame), LegFL(P 0.2x2.8x0.2 Wood 130,85,40), LegFR(P 0.2x2.8x0.2 Wood 130,85,40), LegBL(P 0.2x2.8x0.2 Wood 130,85,40), LegBR(P 0.2x2.8x0.2 Wood 130,85,40), Apron(P 3.6x0.4x0.1 Wood 138,93,48 under top), CrossStretch(P 0.1x0.1x2.1 Wood 125,80,38)`
  },
  {
    keywords: ['bed', 'bedroom', 'mattress'],
    category: 'furniture',
    parts: `BED (12 parts): Frame(P 5x0.8x3.5 Wood 120,75,35), Headboard(P 0.2x2.5x3.5 WoodPlanks 115,70,30), Mattress(P 4.5x0.6x3.2 Fabric 230,225,215), Pillow1(P 1.2x0.3x0.8 Fabric 240,235,225), Pillow2(P 1.2x0.3x0.8 Fabric 238,233,223), Blanket(P 3.5x0.15x3 Fabric 80,110,140), BlanketFold(P 0.3x0.2x3 Fabric 85,115,145 folded edge), LegFL(P 0.2x0.4x0.2 Wood 110,65,25), LegFR(P 0.2x0.4x0.2 Wood 110,65,25), LegBL(P 0.2x0.4x0.2 Wood 110,65,25), LegBR(P 0.2x0.4x0.2 Wood 110,65,25), Footboard(P 0.15x1.5x3.5 Wood 118,73,33)`
  },
]

// ─── Script Pattern Library ────────────────────────────────────────────────

export interface ScriptPattern {
  keywords: string[]
  category: string
  name: string
  description: string
  code: string // Compact Luau pattern
}

const SCRIPT_PATTERNS: ScriptPattern[] = [
  {
    keywords: ['door', 'open door', 'door open', 'door system', 'interactive door'],
    category: 'interactive',
    name: 'Door System',
    description: 'ProximityPrompt + TweenService rotating door',
    code: `-- Door System: Creates a working door that swings open/closed
local TweenService = game:GetService("TweenService")
local doorPart = --DOOR_PART_REF
local isOpen = false
local closedCF = doorPart.CFrame
local openCF = closedCF * CFrame.new(2, 0, 0) * CFrame.Angles(0, math.rad(90), 0)
local tweenInfo = TweenInfo.new(0.5, Enum.EasingStyle.Back, Enum.EasingDirection.Out)
local prompt = Instance.new("ProximityPrompt")
prompt.ActionText = "Open" prompt.MaxActivationDistance = 8 prompt.Parent = doorPart
prompt.Triggered:Connect(function()
  isOpen = not isOpen
  prompt.ActionText = isOpen and "Close" or "Open"
  TweenService:Create(doorPart, tweenInfo, {CFrame = isOpen and openCF or closedCF}):Play()
  local sound = Instance.new("Sound") sound.SoundId = "rbxassetid://6895079853" sound.Parent = doorPart sound:Play()
  task.delay(1, function() sound:Destroy() end)
end)`
  },
  {
    keywords: ['flicker', 'torch', 'candle', 'flame light', 'fire light', 'campfire light'],
    category: 'lighting',
    name: 'Flickering Light',
    description: 'Randomized PointLight brightness/range for realistic fire lighting',
    code: `-- Flickering Light: Realistic torch/candle effect
local light = --LIGHT_REF (PointLight)
task.spawn(function()
  while light and light.Parent do
    light.Brightness = 2 + math.random() * 1.5
    light.Range = 25 + math.random() * 10
    light.Color = Color3.fromRGB(255, 180 + math.random(40), 100 + math.random(60))
    task.wait(0.05 + math.random() * 0.12)
  end
end)`
  },
  {
    keywords: ['day night', 'day/night', 'time cycle', 'daynight', 'day cycle'],
    category: 'lighting',
    name: 'Day/Night Cycle',
    description: 'Smooth ClockTime animation with ambient color changes',
    code: `-- Day/Night Cycle
local Lighting = game:GetService("Lighting")
local TweenService = game:GetService("TweenService")
local CYCLE_MINUTES = 12 -- real minutes per full cycle
local cc = Lighting:FindFirstChildOfClass("ColorCorrectionEffect")
task.spawn(function()
  while true do
    local t = Lighting.ClockTime
    t = t + (24 / (CYCLE_MINUTES * 60)) -- increment per frame
    if t >= 24 then t = 0 end
    Lighting.ClockTime = t
    -- Adjust ambient based on time
    if t > 6 and t < 18 then -- daytime
      Lighting.Ambient = Color3.fromRGB(80, 80, 90)
      Lighting.OutdoorAmbient = Color3.fromRGB(130, 130, 140)
    else -- nighttime
      Lighting.Ambient = Color3.fromRGB(20, 20, 35)
      Lighting.OutdoorAmbient = Color3.fromRGB(30, 30, 50)
    end
    task.wait(1/30)
  end
end)`
  },
  {
    keywords: ['leaderboard', 'leaderstats', 'score board', 'player stats'],
    category: 'data',
    name: 'Leaderboard + DataStore',
    description: 'Persistent player stats with DataStore saving',
    code: `-- Leaderboard + DataStore Save System
local Players = game:GetService("Players")
local DSS = game:GetService("DataStoreService")
local store = DSS:GetDataStore("PlayerStats_v1")

local function loadData(player: Player): {Coins: number, Wins: number, Level: number}
  local ok, data = pcall(function() return store:GetAsync("user_"..player.UserId) end)
  if ok and type(data) == "table" then return data end
  return {Coins = 0, Wins = 0, Level = 1}
end

local function saveData(player: Player)
  local ls = player:FindFirstChild("leaderstats")
  if not ls then return end
  local data = {}
  for _, v in ls:GetChildren() do data[v.Name] = v.Value end
  pcall(function() store:SetAsync("user_"..player.UserId, data) end)
end

Players.PlayerAdded:Connect(function(player)
  local ls = Instance.new("Folder") ls.Name = "leaderstats" ls.Parent = player
  local saved = loadData(player)
  for name, value in saved do
    local v = Instance.new("IntValue") v.Name = name v.Value = value v.Parent = ls
  end
end)

Players.PlayerRemoving:Connect(saveData)
game:BindToClose(function() for _, p in Players:GetPlayers() do saveData(p) end end)`
  },
  {
    keywords: ['npc', 'npc patrol', 'npc walk', 'guard', 'wandering npc'],
    category: 'npc',
    name: 'NPC Patrol System',
    description: 'PathfindingService NPC that patrols between waypoints',
    code: `-- NPC Patrol System with PathfindingService
local PathfindingService = game:GetService("PathfindingService")
local npc = --NPC_MODEL_REF
local humanoid = npc:FindFirstChildOfClass("Humanoid")
local rootPart = npc:FindFirstChild("HumanoidRootPart")
local waypoints = { Vector3.new(0,0,0), Vector3.new(20,0,0), Vector3.new(20,0,20), Vector3.new(0,0,20) }

task.spawn(function()
  local idx = 1
  while humanoid and humanoid.Health > 0 do
    local target = waypoints[idx]
    local path = PathfindingService:CreatePath({AgentRadius = 2, AgentHeight = 5})
    path:ComputeAsync(rootPart.Position, target)
    if path.Status == Enum.PathStatus.Success then
      for _, wp in path:GetWaypoints() do
        humanoid:MoveTo(wp.Position)
        local reached = humanoid.MoveToFinished:Wait()
        if not reached then break end
      end
    else
      humanoid:MoveTo(target) -- fallback direct move
      humanoid.MoveToFinished:Wait()
    end
    task.wait(1 + math.random() * 2)
    idx = idx % #waypoints + 1
  end
end)`
  },
  {
    keywords: ['shop', 'store', 'buy', 'purchase', 'shop system', 'shop gui'],
    category: 'economy',
    name: 'Shop System',
    description: 'Server-validated shop with GUI and RemoteEvent',
    code: `-- Shop System: Server validation + Client GUI
local RS = game:GetService("ReplicatedStorage")
local Players = game:GetService("Players")
local buyEvent = Instance.new("RemoteEvent") buyEvent.Name = "ShopPurchase" buyEvent.Parent = RS
local ITEMS = {
  SpeedBoost = {price = 100, desc = "2x Speed for 30s"},
  DoubleCoins = {price = 250, desc = "2x Coins for 60s"},
  Shield = {price = 500, desc = "Invincible for 15s"},
  ExtraLife = {price = 1000, desc = "+1 Life"},
}
buyEvent.OnServerEvent:Connect(function(player, itemName)
  if type(itemName) ~= "string" then return end -- validate type
  local item = ITEMS[itemName]
  if not item then return end -- validate item exists
  local coins = player:FindFirstChild("leaderstats") and player.leaderstats:FindFirstChild("Coins")
  if not coins or coins.Value < item.price then return end -- validate funds
  coins.Value -= item.price
  -- Apply item effect here based on itemName
end)`
  },
  {
    keywords: ['kill brick', 'kill part', 'lava', 'death zone', 'kill zone'],
    category: 'gameplay',
    name: 'Kill Brick',
    description: 'Part that kills players on touch',
    code: `-- Kill Brick: Resets character on touch
local killPart = --KILL_PART_REF
local debounce = {}
killPart.Touched:Connect(function(hit)
  local char = hit.Parent
  local humanoid = char and char:FindFirstChildOfClass("Humanoid")
  if not humanoid or humanoid.Health <= 0 then return end
  local player = game:GetService("Players"):GetPlayerFromCharacter(char)
  if not player or debounce[player.UserId] then return end
  debounce[player.UserId] = true
  humanoid.Health = 0
  task.delay(2, function() debounce[player.UserId] = nil end)
end)`
  },
  {
    keywords: ['checkpoint', 'spawn point', 'save point', 'respawn'],
    category: 'gameplay',
    name: 'Checkpoint System',
    description: 'SpawnLocations that save player progress',
    code: `-- Checkpoint System: Updates spawn on touch
local Players = game:GetService("Players")
local checkpoints = workspace:FindFirstChild("Checkpoints")
local playerStages = {}

for i, cp in checkpoints:GetChildren() do
  if cp:IsA("SpawnLocation") then
    cp.Touched:Connect(function(hit)
      local char = hit.Parent
      local humanoid = char and char:FindFirstChildOfClass("Humanoid")
      if not humanoid then return end
      local player = Players:GetPlayerFromCharacter(char)
      if not player then return end
      local stage = tonumber(cp.Name:match("%d+")) or i
      if (playerStages[player.UserId] or 0) >= stage then return end
      playerStages[player.UserId] = stage
      player.RespawnLocation = cp
    end)
  end
end`
  },
  {
    keywords: ['currency', 'coins', 'money', 'cash', 'earn', 'collect'],
    category: 'economy',
    name: 'Currency Collector',
    description: 'Collectible coins that add to leaderstats',
    code: `-- Currency Collector: Touch coins to earn
local coins = workspace:FindFirstChild("Coins")
local RESPAWN_TIME = 10

for _, coin in coins:GetChildren() do
  if coin:IsA("BasePart") then
    local originalCF = coin.CFrame
    coin.Touched:Connect(function(hit)
      if not coin.Parent then return end
      local char = hit.Parent
      local humanoid = char and char:FindFirstChildOfClass("Humanoid")
      if not humanoid then return end
      local player = game:GetService("Players"):GetPlayerFromCharacter(char)
      if not player then return end
      local ls = player:FindFirstChild("leaderstats")
      local cv = ls and ls:FindFirstChild("Coins")
      if not cv then return end
      cv.Value += coin:GetAttribute("Value") or 1
      coin.Parent = nil -- hide
      task.delay(RESPAWN_TIME, function()
        coin.CFrame = originalCF
        coin.Parent = coins
      end)
    end)
  end
end`
  },
  {
    keywords: ['teleport', 'portal', 'zone', 'transport', 'warp'],
    category: 'gameplay',
    name: 'Teleport Portal',
    description: 'Touch portal to teleport to destination',
    code: `-- Teleport Portal
local portal = --PORTAL_PART_REF
local destination = --DESTINATION_POSITION (Vector3)
local cooldown = {}
portal.Touched:Connect(function(hit)
  local char = hit.Parent
  local humanoid = char and char:FindFirstChildOfClass("Humanoid")
  if not humanoid then return end
  local player = game:GetService("Players"):GetPlayerFromCharacter(char)
  if not player or cooldown[player.UserId] then return end
  cooldown[player.UserId] = true
  local root = char:FindFirstChild("HumanoidRootPart")
  if root then root.CFrame = CFrame.new(destination) end
  task.delay(3, function() cooldown[player.UserId] = nil end)
end)`
  },

  // ─── SCRIPTED LIGHTING EFFECTS ──────────────────────────────────────────

  {
    keywords: ['neon sign', 'neon flicker', 'neon light', 'sign flicker', 'buzzing sign'],
    category: 'lighting',
    name: 'Neon Sign Flicker',
    description: 'Neon sign that flickers on/off with buzzing randomness',
    code: `-- Neon Sign Flicker: realistic buzzing neon effect
local neonPart = --NEON_PART_REF (Material = Neon)
local light = neonPart:FindFirstChildOfClass("PointLight") or Instance.new("PointLight")
light.Brightness = 3 light.Range = 20 light.Color = neonPart.Color light.Parent = neonPart
local onTransparency = 0
local offTransparency = 0.9
task.spawn(function()
  while neonPart and neonPart.Parent do
    -- Random flicker pattern
    if math.random() < 0.15 then
      -- Quick double-flicker
      neonPart.Transparency = offTransparency light.Enabled = false
      task.wait(0.05 + math.random() * 0.05)
      neonPart.Transparency = onTransparency light.Enabled = true
      task.wait(0.03)
      neonPart.Transparency = offTransparency light.Enabled = false
      task.wait(0.05 + math.random() * 0.08)
      neonPart.Transparency = onTransparency light.Enabled = true
    elseif math.random() < 0.05 then
      -- Long off period (dying bulb feel)
      neonPart.Transparency = offTransparency light.Enabled = false
      task.wait(0.3 + math.random() * 0.5)
      neonPart.Transparency = onTransparency light.Enabled = true
    end
    task.wait(0.5 + math.random() * 2)
  end
end)`
  },
  {
    keywords: ['color pulse', 'color change', 'rgb light', 'rainbow light', 'color cycle'],
    category: 'lighting',
    name: 'Color Pulse Light',
    description: 'PointLight that smoothly cycles through colors',
    code: `-- Color Pulse: smooth color cycling on a PointLight
local TweenService = game:GetService("TweenService")
local light = --POINTLIGHT_REF
local colors = {
  Color3.fromRGB(255, 100, 100), -- red
  Color3.fromRGB(100, 255, 100), -- green
  Color3.fromRGB(100, 100, 255), -- blue
  Color3.fromRGB(255, 255, 100), -- yellow
  Color3.fromRGB(255, 100, 255), -- magenta
  Color3.fromRGB(100, 255, 255), -- cyan
}
local tweenInfo = TweenInfo.new(1.5, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut)
task.spawn(function()
  local idx = 1
  while light and light.Parent do
    local nextIdx = idx % #colors + 1
    TweenService:Create(light, tweenInfo, {Color = colors[nextIdx]}):Play()
    -- Also tween the parent part color if it's Neon
    local parent = light.Parent
    if parent and parent:IsA("BasePart") and parent.Material == Enum.Material.Neon then
      TweenService:Create(parent, tweenInfo, {Color = colors[nextIdx]}):Play()
    end
    task.wait(1.5)
    idx = nextIdx
  end
end)`
  },
  {
    keywords: ['lightning', 'thunder', 'storm', 'lightning flash', 'thunderstorm'],
    category: 'lighting',
    name: 'Lightning Storm',
    description: 'Lightning flashes with thunder sound and atmosphere changes',
    code: `-- Lightning Storm: flashes + thunder + rain atmosphere
local Lighting = game:GetService("Lighting")
local TweenService = game:GetService("TweenService")
-- Set storm atmosphere
local atm = Lighting:FindFirstChildOfClass("Atmosphere")
if atm then atm.Density = 0.5 atm.Color = Color3.fromRGB(80, 85, 100) atm.Haze = 4 end
Lighting.Brightness = 0.5 Lighting.ClockTime = 21
local cc = Lighting:FindFirstChildOfClass("ColorCorrectionEffect")
if cc then cc.Saturation = -0.3 cc.Contrast = 0.2 end

task.spawn(function()
  while true do
    task.wait(5 + math.random() * 15) -- random delay between strikes
    -- Flash sequence
    local origBright = Lighting.Brightness
    Lighting.Brightness = 5
    task.wait(0.05)
    Lighting.Brightness = origBright
    task.wait(0.1)
    Lighting.Brightness = 3
    task.wait(0.05)
    Lighting.Brightness = origBright
    -- Thunder sound (delayed by distance)
    task.wait(0.5 + math.random() * 2)
    local thunder = Instance.new("Sound")
    thunder.SoundId = "rbxassetid://12222058" -- thunder rumble
    thunder.Volume = 0.5 + math.random() * 0.5
    thunder.Parent = workspace
    thunder:Play()
    thunder.Ended:Once(function() thunder:Destroy() end)
  end
end)`
  },
  {
    keywords: ['streetlight auto', 'auto light', 'light sensor', 'light on at night', 'smart light'],
    category: 'lighting',
    name: 'Auto Streetlights',
    description: 'Streetlights that turn on at dusk and off at dawn',
    code: `-- Auto Streetlights: enable at night, disable during day
local Lighting = game:GetService("Lighting")
local TweenService = game:GetService("TweenService")
local streetlights = {} -- collect all streetlight PointLights/SpotLights
for _, desc in workspace:GetDescendants() do
  if (desc:IsA("PointLight") or desc:IsA("SpotLight")) and desc.Parent and desc.Parent.Name:lower():find("lamp") then
    table.insert(streetlights, desc)
  end
end
local tweenInfo = TweenInfo.new(2, Enum.EasingStyle.Sine)
task.spawn(function()
  while true do
    local hour = Lighting.ClockTime
    local shouldBeOn = hour < 6 or hour > 18.5
    for _, light in streetlights do
      if shouldBeOn and not light.Enabled then
        light.Enabled = true
        TweenService:Create(light, tweenInfo, {Brightness = 3}):Play()
      elseif not shouldBeOn and light.Enabled then
        local fadeOut = TweenService:Create(light, tweenInfo, {Brightness = 0})
        fadeOut:Play()
        fadeOut.Completed:Once(function() light.Enabled = false end)
      end
    end
    task.wait(1)
  end
end)`
  },
  {
    keywords: ['campfire', 'bonfire', 'fire pit', 'camp fire'],
    category: 'lighting',
    name: 'Campfire Effect',
    description: 'Campfire with flickering light, fire particles, smoke, crackling sound',
    code: `-- Campfire: light + fire + smoke + embers + sound
local firePart = --FIRE_PART_REF (the base/pit part)
-- Warm flickering light
local light = Instance.new("PointLight")
light.Color = Color3.fromRGB(255, 160, 80) light.Brightness = 3 light.Range = 30 light.Parent = firePart
-- Fire effect
local fire = Instance.new("Fire")
fire.Size = 6 fire.Heat = 12 fire.Color = Color3.fromRGB(255, 150, 50) fire.SecondaryColor = Color3.fromRGB(255, 80, 20) fire.Parent = firePart
-- Smoke
local smoke = Instance.new("Smoke")
smoke.Size = 4 smoke.Opacity = 0.15 smoke.RiseVelocity = 5 smoke.Color = Color3.fromRGB(80, 80, 85) smoke.Parent = firePart
-- Embers (particle emitter)
local embers = Instance.new("ParticleEmitter")
embers.Rate = 8
embers.Speed = NumberRange.new(3, 8)
embers.Lifetime = NumberRange.new(1.5, 3)
embers.SpreadAngle = Vector2.new(15, 15)
embers.Size = NumberSequence.new({NumberSequenceKeypoint.new(0, 0.15), NumberSequenceKeypoint.new(0.5, 0.1), NumberSequenceKeypoint.new(1, 0)})
embers.Color = ColorSequence.new({ColorSequenceKeypoint.new(0, Color3.fromRGB(255, 200, 80)), ColorSequenceKeypoint.new(1, Color3.fromRGB(255, 50, 10))})
embers.Transparency = NumberSequence.new({NumberSequenceKeypoint.new(0, 0), NumberSequenceKeypoint.new(0.8, 0.3), NumberSequenceKeypoint.new(1, 1)})
embers.LightEmission = 1
embers.Parent = firePart
-- Crackling sound
local sound = Instance.new("Sound")
sound.SoundId = "rbxassetid://5765826065" sound.Volume = 0.4 sound.Looped = true sound.Parent = firePart sound:Play()
-- Flicker loop
task.spawn(function()
  while light and light.Parent do
    light.Brightness = 2.5 + math.random() * 1.5
    light.Range = 25 + math.random() * 10
    fire.Size = 5 + math.random() * 3
    task.wait(0.06 + math.random() * 0.1)
  end
end)`
  },
  {
    keywords: ['disco', 'party light', 'dance floor', 'club light', 'rave'],
    category: 'lighting',
    name: 'Disco Party Lights',
    description: 'Multiple colored SpotLights rotating through colors with offset timing',
    code: `-- Disco Party Lights: colored SpotLights cycling on offset timers
local TweenService = game:GetService("TweenService")
local discoColors = {
  Color3.fromRGB(255, 50, 80), Color3.fromRGB(50, 100, 255),
  Color3.fromRGB(50, 255, 100), Color3.fromRGB(255, 200, 50),
  Color3.fromRGB(200, 50, 255), Color3.fromRGB(255, 100, 200),
}
local lights = {} -- Create 4 SpotLights on ceiling
local ceilingY = --CEILING_Y_POSITION
for i = 1, 4 do
  local att = Instance.new("Part")
  att.Name = "DiscoMount_"..i
  att.Size = Vector3.new(0.5, 0.2, 0.5) att.Anchored = true att.CanCollide = false
  att.Material = Enum.Material.Metal att.Color = Color3.fromRGB(30, 30, 35)
  att.CFrame = CFrame.new(sp.X + (i-2.5)*6, ceilingY, sp.Z) att.Parent = m
  local spot = Instance.new("SpotLight")
  spot.Face = Enum.NormalId.Bottom spot.Brightness = 4 spot.Range = 40 spot.Angle = 45
  spot.Color = discoColors[i] spot.Parent = att
  table.insert(lights, spot)
end
-- Cycle colors with offset
local tweenInfo = TweenInfo.new(0.8, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut)
task.spawn(function()
  local offset = 0
  while #lights > 0 and lights[1].Parent do
    for i, light in lights do
      local colorIdx = ((offset + i) % #discoColors) + 1
      TweenService:Create(light, tweenInfo, {Color = discoColors[colorIdx]}):Play()
    end
    offset += 1
    task.wait(0.8)
  end
end)`
  },
  {
    keywords: ['emergency light', 'police light', 'siren', 'alarm light', 'red blue'],
    category: 'lighting',
    name: 'Emergency Lights',
    description: 'Alternating red/blue PointLights like police sirens',
    code: `-- Emergency Lights: alternating red/blue
local redLight = --RED_POINTLIGHT_REF
local blueLight = --BLUE_POINTLIGHT_REF
redLight.Color = Color3.fromRGB(255, 0, 0) redLight.Brightness = 5 redLight.Range = 30
blueLight.Color = Color3.fromRGB(0, 50, 255) blueLight.Brightness = 5 blueLight.Range = 30
task.spawn(function()
  while redLight and redLight.Parent do
    redLight.Enabled = true blueLight.Enabled = false
    task.wait(0.3)
    redLight.Enabled = false blueLight.Enabled = true
    task.wait(0.3)
    redLight.Enabled = false blueLight.Enabled = false
    task.wait(0.1)
  end
end)`
  },
  {
    keywords: ['sunrise', 'sunset', 'golden hour', 'time lapse', 'sky color'],
    category: 'lighting',
    name: 'Sunrise/Sunset Tint System',
    description: 'ColorCorrection tint that changes with time of day',
    code: `-- Sunrise/Sunset Tint: CC tint matches time of day
local Lighting = game:GetService("Lighting")
local TweenService = game:GetService("TweenService")
local cc = Lighting:FindFirstChildOfClass("ColorCorrectionEffect") or Instance.new("ColorCorrectionEffect")
cc.Parent = Lighting
local tints = {
  {time = 5, color = Color3.fromRGB(255, 180, 140), sat = 0.1, bright = -0.05},  -- dawn
  {time = 8, color = Color3.fromRGB(255, 250, 240), sat = 0, bright = 0.02},       -- morning
  {time = 12, color = Color3.fromRGB(255, 255, 255), sat = 0.05, bright = 0.05},   -- noon
  {time = 17, color = Color3.fromRGB(255, 220, 180), sat = 0.15, bright = 0.03},   -- golden hour
  {time = 19, color = Color3.fromRGB(255, 150, 100), sat = 0.2, bright = -0.02},   -- sunset
  {time = 21, color = Color3.fromRGB(150, 140, 200), sat = -0.2, bright = -0.1},   -- twilight
  {time = 0, color = Color3.fromRGB(120, 130, 180), sat = -0.3, bright = -0.15},   -- night
}
local tweenInfo = TweenInfo.new(3, Enum.EasingStyle.Sine)
task.spawn(function()
  while true do
    local hour = Lighting.ClockTime
    -- Find closest tint
    local best = tints[1]
    local bestDist = 24
    for _, t in tints do
      local dist = math.abs(t.time - hour)
      if dist > 12 then dist = 24 - dist end
      if dist < bestDist then bestDist = dist best = t end
    end
    TweenService:Create(cc, tweenInfo, {
      TintColor = best.color,
      Saturation = best.sat,
      Brightness = best.bright,
    }):Play()
    task.wait(2)
  end
end)`
  },

  // ─── SPECIAL EFFECTS ────────────────────────────────────────────────────

  {
    keywords: ['rain', 'raining', 'rainfall', 'rainy'],
    category: 'weather',
    name: 'Rain Effect',
    description: 'ParticleEmitter rain with splash effects and atmosphere',
    code: `-- Rain System: particles + atmosphere + splash sound
local Lighting = game:GetService("Lighting")
-- Darken atmosphere
local atm = Lighting:FindFirstChildOfClass("Atmosphere")
if atm then atm.Density = 0.45 atm.Color = Color3.fromRGB(140, 145, 155) atm.Haze = 3 end
Lighting.Brightness = 1 Lighting.ClockTime = 15
local cc = Lighting:FindFirstChildOfClass("ColorCorrectionEffect")
if cc then cc.Saturation = -0.2 cc.Contrast = 0.1 cc.Brightness = -0.05 end
-- Rain emitter (attach to a large invisible part above the scene)
local rainPart = Instance.new("Part")
rainPart.Name = "RainEmitter" rainPart.Size = Vector3.new(200, 1, 200) rainPart.Anchored = true
rainPart.Transparency = 1 rainPart.CanCollide = false
rainPart.CFrame = CFrame.new(sp.X, sp.Y + 80, sp.Z) rainPart.Parent = workspace
local rain = Instance.new("ParticleEmitter")
rain.Rate = 300 rain.Speed = NumberRange.new(50, 70) rain.Lifetime = NumberRange.new(1.5, 2.5)
rain.SpreadAngle = Vector2.new(5, 5)
rain.Size = NumberSequence.new(0.05)
rain.Color = ColorSequence.new(Color3.fromRGB(180, 190, 210))
rain.Transparency = NumberSequence.new({NumberSequenceKeypoint.new(0, 0.3), NumberSequenceKeypoint.new(1, 0.8)})
rain.EmissionDirection = Enum.NormalId.Bottom
rain.Acceleration = Vector3.new(0, -20, 0)
rain.Parent = rainPart
-- Rain ambient sound
local sound = Instance.new("Sound")
sound.SoundId = "rbxassetid://6677463" sound.Volume = 0.3 sound.Looped = true
sound.Parent = workspace sound:Play()`
  },
  {
    keywords: ['snow', 'snowing', 'snowfall', 'winter', 'blizzard'],
    category: 'weather',
    name: 'Snow Effect',
    description: 'Gentle snowfall with particle emitter and cold atmosphere',
    code: `-- Snow System: particles + cold atmosphere
local Lighting = game:GetService("Lighting")
local atm = Lighting:FindFirstChildOfClass("Atmosphere")
if atm then atm.Density = 0.35 atm.Color = Color3.fromRGB(210, 220, 240) atm.Haze = 2.5 end
local cc = Lighting:FindFirstChildOfClass("ColorCorrectionEffect")
if cc then cc.TintColor = Color3.fromRGB(220, 230, 255) cc.Saturation = -0.15 end
local snowPart = Instance.new("Part")
snowPart.Name = "SnowEmitter" snowPart.Size = Vector3.new(200, 1, 200) snowPart.Anchored = true
snowPart.Transparency = 1 snowPart.CanCollide = false
snowPart.CFrame = CFrame.new(sp.X, sp.Y + 60, sp.Z) snowPart.Parent = workspace
local snow = Instance.new("ParticleEmitter")
snow.Rate = 80 snow.Speed = NumberRange.new(2, 6) snow.Lifetime = NumberRange.new(8, 15)
snow.SpreadAngle = Vector2.new(30, 30)
snow.Size = NumberSequence.new({NumberSequenceKeypoint.new(0, 0.2), NumberSequenceKeypoint.new(0.5, 0.35), NumberSequenceKeypoint.new(1, 0.15)})
snow.Color = ColorSequence.new(Color3.fromRGB(240, 245, 255))
snow.Transparency = NumberSequence.new({NumberSequenceKeypoint.new(0, 0.1), NumberSequenceKeypoint.new(0.8, 0.2), NumberSequenceKeypoint.new(1, 1)})
snow.EmissionDirection = Enum.NormalId.Bottom
snow.RotSpeed = NumberRange.new(-30, 30)
snow.Rotation = NumberRange.new(0, 360)
snow.Acceleration = Vector3.new(math.random(-2,2), -1, math.random(-2,2)) -- slight drift
snow.Parent = snowPart
-- Wind ambient
local wind = Instance.new("Sound")
wind.SoundId = "rbxassetid://5982176858" wind.Volume = 0.15 wind.Looped = true wind.Parent = workspace wind:Play()`
  },
  {
    keywords: ['fog', 'mist', 'foggy', 'misty', 'haze'],
    category: 'weather',
    name: 'Ground Fog',
    description: 'Low-lying fog using Atmosphere + transparent Parts',
    code: `-- Ground Fog: thick Atmosphere + transparent fog layers
local Lighting = game:GetService("Lighting")
local atm = Lighting:FindFirstChildOfClass("Atmosphere") or Instance.new("Atmosphere")
atm.Density = 0.6 atm.Offset = 0 -- fog starts at feet
atm.Color = Color3.fromRGB(180, 185, 195) atm.Decay = Color3.fromRGB(140, 145, 155)
atm.Glare = 0 atm.Haze = 6 atm.Parent = Lighting
-- Low fog layers (Glass parts at ground level)
for i = 1, 5 do
  local fogLayer = Instance.new("Part")
  fogLayer.Name = "FogLayer_"..i
  fogLayer.Size = Vector3.new(100 + i*20, 0.5, 100 + i*20)
  fogLayer.CFrame = CFrame.new(sp.X, sp.Y + i*1.5, sp.Z)
  fogLayer.Material = Enum.Material.Glass
  fogLayer.Color = Color3.fromRGB(200, 205, 215)
  fogLayer.Transparency = 0.85 + i*0.02
  fogLayer.Anchored = true fogLayer.CanCollide = false fogLayer.CastShadow = false
  fogLayer.Parent = workspace
end
Lighting.Brightness = 1.2 Lighting.ClockTime = 7 -- early morning`
  },
  {
    keywords: ['beam', 'light beam', 'light ray', 'god ray', 'light shaft', 'sunbeam'],
    category: 'effects',
    name: 'Light Beam / God Ray',
    description: 'Beam effect between two points for dramatic light shafts',
    code: `-- Light Beam: dramatic light shaft through window/opening
local topPart = --TOP_PART_REF (where light enters)
local bottomPart = --BOTTOM_PART_REF (where light hits floor)
local att0 = Instance.new("Attachment") att0.Parent = topPart
local att1 = Instance.new("Attachment") att1.Parent = bottomPart
local beam = Instance.new("Beam")
beam.Attachment0 = att0 beam.Attachment1 = att1
beam.Width0 = 3 beam.Width1 = 6 -- spreads as it descends
beam.Color = ColorSequence.new(Color3.fromRGB(255, 240, 200))
beam.Transparency = NumberSequence.new({NumberSequenceKeypoint.new(0, 0.5), NumberSequenceKeypoint.new(0.5, 0.7), NumberSequenceKeypoint.new(1, 0.95)})
beam.LightEmission = 0.8 beam.LightInfluence = 0.3
beam.Segments = 20 beam.Parent = topPart
-- Dust motes in the beam
local dustEmitter = Instance.new("ParticleEmitter")
dustEmitter.Rate = 5 dustEmitter.Speed = NumberRange.new(0.3, 1) dustEmitter.Lifetime = NumberRange.new(5, 12)
dustEmitter.Size = NumberSequence.new({NumberSequenceKeypoint.new(0, 0.05), NumberSequenceKeypoint.new(0.5, 0.15), NumberSequenceKeypoint.new(1, 0.05)})
dustEmitter.Color = ColorSequence.new(Color3.fromRGB(255, 245, 220))
dustEmitter.Transparency = NumberSequence.new({NumberSequenceKeypoint.new(0, 0.5), NumberSequenceKeypoint.new(0.5, 0.2), NumberSequenceKeypoint.new(1, 1)})
dustEmitter.LightEmission = 1 dustEmitter.SpreadAngle = Vector2.new(20, 20)
dustEmitter.Parent = topPart`
  },
  {
    keywords: ['waterfall', 'water fall', 'cascade', 'water stream'],
    category: 'effects',
    name: 'Waterfall Effect',
    description: 'ParticleEmitter waterfall with mist and splash',
    code: `-- Waterfall: cascading particles + mist at base + splash sound
local topPart = --TOP_OF_WATERFALL (Part at the top edge)
local basePart = --BASE_OF_WATERFALL (Part at the bottom)
-- Main water flow
local water = Instance.new("ParticleEmitter")
water.Rate = 150 water.Speed = NumberRange.new(15, 25) water.Lifetime = NumberRange.new(1, 2)
water.EmissionDirection = Enum.NormalId.Bottom
water.Size = NumberSequence.new({NumberSequenceKeypoint.new(0, 1), NumberSequenceKeypoint.new(0.5, 1.5), NumberSequenceKeypoint.new(1, 0.5)})
water.Color = ColorSequence.new(Color3.fromRGB(160, 200, 230), Color3.fromRGB(200, 225, 245))
water.Transparency = NumberSequence.new({NumberSequenceKeypoint.new(0, 0.2), NumberSequenceKeypoint.new(0.7, 0.4), NumberSequenceKeypoint.new(1, 1)})
water.Acceleration = Vector3.new(0, -30, 0)
water.SpreadAngle = Vector2.new(8, 8)
water.Parent = topPart
-- Mist at base
local mist = Instance.new("ParticleEmitter")
mist.Rate = 15 mist.Speed = NumberRange.new(1, 4) mist.Lifetime = NumberRange.new(3, 6)
mist.Size = NumberSequence.new({NumberSequenceKeypoint.new(0, 2), NumberSequenceKeypoint.new(0.5, 6), NumberSequenceKeypoint.new(1, 0)})
mist.Color = ColorSequence.new(Color3.fromRGB(220, 230, 240))
mist.Transparency = NumberSequence.new({NumberSequenceKeypoint.new(0, 0.6), NumberSequenceKeypoint.new(0.3, 0.4), NumberSequenceKeypoint.new(1, 1)})
mist.SpreadAngle = Vector2.new(60, 60)
mist.Parent = basePart
-- Water sound
local snd = Instance.new("Sound") snd.SoundId = "rbxassetid://6677463" snd.Volume = 0.5 snd.Looped = true snd.Parent = basePart snd:Play()`
  },
  {
    keywords: ['fountain', 'water fountain', 'spray', 'water jet'],
    category: 'effects',
    name: 'Water Fountain',
    description: 'Upward water spray with ParticleEmitter and mist',
    code: `-- Water Fountain: upward spray + falling droplets + mist ring
local nozzle = --NOZZLE_PART_REF (center of fountain)
local spray = Instance.new("ParticleEmitter")
spray.Rate = 60 spray.Speed = NumberRange.new(15, 22) spray.Lifetime = NumberRange.new(1, 2)
spray.EmissionDirection = Enum.NormalId.Top
spray.Size = NumberSequence.new({NumberSequenceKeypoint.new(0, 0.3), NumberSequenceKeypoint.new(0.3, 0.5), NumberSequenceKeypoint.new(1, 0.1)})
spray.Color = ColorSequence.new(Color3.fromRGB(180, 210, 240))
spray.Transparency = NumberSequence.new({NumberSequenceKeypoint.new(0, 0.1), NumberSequenceKeypoint.new(0.5, 0.3), NumberSequenceKeypoint.new(1, 1)})
spray.Acceleration = Vector3.new(0, -40, 0) -- gravity pulls water down
spray.SpreadAngle = Vector2.new(8, 8)
spray.LightEmission = 0.3
spray.Parent = nozzle
-- Mist ring at base
local mist = Instance.new("ParticleEmitter")
mist.Rate = 10 mist.Speed = NumberRange.new(2, 5) mist.Lifetime = NumberRange.new(2, 4)
mist.Size = NumberSequence.new({NumberSequenceKeypoint.new(0, 1), NumberSequenceKeypoint.new(0.5, 4), NumberSequenceKeypoint.new(1, 0)})
mist.Transparency = NumberSequence.new({NumberSequenceKeypoint.new(0, 0.7), NumberSequenceKeypoint.new(0.3, 0.5), NumberSequenceKeypoint.new(1, 1)})
mist.SpreadAngle = Vector2.new(180, 180) mist.Color = ColorSequence.new(Color3.fromRGB(210, 225, 240))
mist.Parent = nozzle
-- Splash sound
local snd = Instance.new("Sound") snd.SoundId = "rbxassetid://6677463" snd.Volume = 0.3 snd.Looped = true snd.Parent = nozzle snd:Play()`
  },
  {
    keywords: ['magic', 'spell', 'enchant', 'aura', 'glow effect', 'magical'],
    category: 'effects',
    name: 'Magic Aura Effect',
    description: 'Glowing particles + Highlight + Beam orbit for magical objects',
    code: `-- Magic Aura: orbiting particles + glow highlight + sparkles
local magicPart = --MAGIC_PART_REF
-- Highlight glow
local hl = Instance.new("Highlight")
hl.FillColor = Color3.fromRGB(100, 50, 255) hl.FillTransparency = 0.7
hl.OutlineColor = Color3.fromRGB(180, 120, 255) hl.OutlineTransparency = 0.3
hl.Parent = magicPart
-- Sparkle particles
local sparkles = Instance.new("ParticleEmitter")
sparkles.Rate = 12 sparkles.Speed = NumberRange.new(1, 3) sparkles.Lifetime = NumberRange.new(1, 2.5)
sparkles.Size = NumberSequence.new({NumberSequenceKeypoint.new(0, 0), NumberSequenceKeypoint.new(0.3, 0.3), NumberSequenceKeypoint.new(1, 0)})
sparkles.Color = ColorSequence.new({ColorSequenceKeypoint.new(0, Color3.fromRGB(180, 140, 255)), ColorSequenceKeypoint.new(1, Color3.fromRGB(100, 200, 255))})
sparkles.Transparency = NumberSequence.new({NumberSequenceKeypoint.new(0, 0.2), NumberSequenceKeypoint.new(0.7, 0.5), NumberSequenceKeypoint.new(1, 1)})
sparkles.LightEmission = 1 sparkles.SpreadAngle = Vector2.new(180, 180)
sparkles.RotSpeed = NumberRange.new(-180, 180)
sparkles.Parent = magicPart
-- Soft PointLight
local glow = Instance.new("PointLight")
glow.Color = Color3.fromRGB(140, 100, 255) glow.Brightness = 2 glow.Range = 15
glow.Parent = magicPart
-- Pulse the glow
task.spawn(function()
  while glow and glow.Parent do
    glow.Brightness = 1.5 + math.sin(tick() * 2) * 1
    glow.Range = 12 + math.sin(tick() * 1.5) * 5
    hl.FillTransparency = 0.6 + math.sin(tick() * 3) * 0.15
    task.wait(1/30)
  end
end)`
  },

  // ─── INTERACTIVE SYSTEMS ────────────────────────────────────────────────

  {
    keywords: ['conveyor', 'conveyor belt', 'treadmill', 'moving floor'],
    category: 'gameplay',
    name: 'Conveyor Belt',
    description: 'Part that pushes objects/players in a direction',
    code: `-- Conveyor Belt: pushes anything touching in a direction
local belt = --BELT_PART_REF
local SPEED = 20 -- studs per second
local DIRECTION = belt.CFrame.LookVector -- forward direction of the belt part
belt.CustomPhysicalProperties = PhysicalProperties.new(0.7, 0, 0, 0, 0) -- low friction
-- Surface velocity approach (most reliable)
belt.AssemblyLinearVelocity = DIRECTION * SPEED -- this only works on unanchored parts
-- For anchored belt, use Touched + BodyVelocity on touching parts:
belt.Touched:Connect(function(hit)
  if hit.Anchored then return end
  local existing = hit:FindFirstChild("ConveyorForce")
  if existing then return end
  local bv = Instance.new("BodyVelocity")
  bv.Name = "ConveyorForce" bv.Velocity = DIRECTION * SPEED
  bv.MaxForce = Vector3.new(1e4, 0, 1e4) bv.P = 1250
  bv.Parent = hit
end)
belt.TouchEnded:Connect(function(hit)
  local bv = hit:FindFirstChild("ConveyorForce")
  if bv then bv:Destroy() end
end)`
  },
  {
    keywords: ['elevator', 'lift', 'platform lift', 'moving platform'],
    category: 'gameplay',
    name: 'Elevator / Moving Platform',
    description: 'Platform that moves between two positions with TweenService',
    code: `-- Elevator: moves between bottom and top positions
local TweenService = game:GetService("TweenService")
local platform = --PLATFORM_PART_REF
local bottomPos = platform.Position
local topPos = bottomPos + Vector3.new(0, 20, 0) -- 20 studs up
local moving = false
local atTop = false
local tweenInfo = TweenInfo.new(3, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut)
local prompt = Instance.new("ProximityPrompt")
prompt.ActionText = "Go Up" prompt.MaxActivationDistance = 10 prompt.Parent = platform
prompt.Triggered:Connect(function()
  if moving then return end
  moving = true
  local target = atTop and bottomPos or topPos
  prompt.Enabled = false
  TweenService:Create(platform, tweenInfo, {Position = target}):Play()
  task.wait(3)
  atTop = not atTop
  prompt.ActionText = atTop and "Go Down" or "Go Up"
  prompt.Enabled = true
  moving = false
end)`
  },
  {
    keywords: ['trap', 'spike trap', 'hidden trap', 'trap door', 'trapdoor'],
    category: 'gameplay',
    name: 'Spike Trap',
    description: 'Spikes that pop up on a timer or proximity trigger',
    code: `-- Spike Trap: spikes emerge from floor on timer
local TweenService = game:GetService("TweenService")
local trapBase = --TRAP_BASE_PART_REF
local spikeParts = {} -- create spike parts
for i = 1, 4 do
  local spike = Instance.new("WedgePart")
  spike.Name = "Spike_"..i spike.Size = Vector3.new(0.4, 2, 0.4)
  spike.Material = Enum.Material.Metal spike.Color = Color3.fromRGB(120, 120, 125)
  spike.Anchored = true spike.CanCollide = true
  local offset = Vector3.new((i-2.5)*0.8, -2, 0) -- hidden below floor
  spike.CFrame = trapBase.CFrame * CFrame.new(offset) * CFrame.Angles(0, 0, math.rad(180))
  spike.Parent = trapBase.Parent
  table.insert(spikeParts, {part = spike, hiddenCF = spike.CFrame, raisedCF = spike.CFrame + Vector3.new(0, 2.5, 0)})
end
local tweenInfo = TweenInfo.new(0.15, Enum.EasingStyle.Back, Enum.EasingDirection.Out)
local retractInfo = TweenInfo.new(0.5, Enum.EasingStyle.Sine)
-- Trigger loop
task.spawn(function()
  while trapBase and trapBase.Parent do
    task.wait(3 + math.random() * 2)
    -- Raise spikes
    for _, s in spikeParts do TweenService:Create(s.part, tweenInfo, {CFrame = s.raisedCF}):Play() end
    -- Damage anyone on the trap
    for _, s in spikeParts do
      s.part.Touched:Once(function(hit)
        local h = hit.Parent and hit.Parent:FindFirstChildOfClass("Humanoid")
        if h and h.Health > 0 then h:TakeDamage(30) end
      end)
    end
    task.wait(1.5)
    -- Retract
    for _, s in spikeParts do TweenService:Create(s.part, retractInfo, {CFrame = s.hiddenCF}):Play() end
  end
end)`
  },
  {
    keywords: ['treasure', 'chest', 'loot box', 'reward box', 'collectible chest'],
    category: 'interactive',
    name: 'Treasure Chest',
    description: 'Openable chest with ProximityPrompt, lid animation, and reward',
    code: `-- Treasure Chest: open lid + sparkles + coin reward
local TweenService = game:GetService("TweenService")
local chest = --CHEST_MODEL_REF (Model with Base and Lid parts)
local lid = chest:FindFirstChild("Lid")
local base = chest:FindFirstChild("Base") or chest.PrimaryPart
local closedCF = lid.CFrame
local openCF = closedCF * CFrame.Angles(math.rad(-110), 0, 0)
local isOpen = false
local prompt = Instance.new("ProximityPrompt")
prompt.ActionText = "Open Chest" prompt.MaxActivationDistance = 8 prompt.Parent = base
-- Sparkle effect (visible when closed)
local sparkles = Instance.new("Sparkles")
sparkles.SparkleColor = Color3.fromRGB(255, 215, 0)
sparkles.Parent = base
-- Gold glow
local glow = Instance.new("PointLight")
glow.Color = Color3.fromRGB(255, 200, 80) glow.Brightness = 1 glow.Range = 10
glow.Enabled = false glow.Parent = base
prompt.Triggered:Connect(function(player)
  if isOpen then return end
  isOpen = true prompt.Enabled = false
  -- Open lid
  TweenService:Create(lid, TweenInfo.new(0.6, Enum.EasingStyle.Back), {CFrame = openCF}):Play()
  sparkles:Destroy() glow.Enabled = true
  -- Reward
  local coins = player:FindFirstChild("leaderstats") and player.leaderstats:FindFirstChild("Coins")
  if coins then coins.Value += 50 end
  -- Re-close after delay
  task.wait(5)
  TweenService:Create(lid, TweenInfo.new(0.4, Enum.EasingStyle.Sine), {CFrame = closedCF}):Play()
  glow.Enabled = false
  task.wait(30) -- respawn timer
  isOpen = false prompt.Enabled = true
  local newSparkles = Instance.new("Sparkles") newSparkles.SparkleColor = Color3.fromRGB(255, 215, 0) newSparkles.Parent = base
end)`
  },
]

// ─── Lookup Functions ──────────────────────────────────────────────────────

/**
 * Find matching object blueprints for a user prompt.
 * Returns compact part descriptions to inject into the AI prompt.
 */
export function findObjectBlueprints(prompt: string, limit = 3): ObjectBlueprint[] {
  const lower = prompt.toLowerCase()
  const matches: Array<{ blueprint: ObjectBlueprint; score: number }> = []

  for (const obj of OBJECTS) {
    let score = 0
    for (const kw of obj.keywords) {
      if (lower.includes(kw)) score += kw.split(' ').length // multi-word = higher score
    }
    if (score > 0) matches.push({ blueprint: obj, score })
  }

  return matches
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(m => m.blueprint)
}

/**
 * Find matching script patterns for a user prompt.
 * Returns code patterns to inject into the AI prompt.
 */
export function findScriptPatterns(prompt: string, limit = 3): ScriptPattern[] {
  const lower = prompt.toLowerCase()
  const matches: Array<{ pattern: ScriptPattern; score: number }> = []

  for (const sp of SCRIPT_PATTERNS) {
    let score = 0
    for (const kw of sp.keywords) {
      if (lower.includes(kw)) score += kw.split(' ').length
    }
    if (score > 0) matches.push({ pattern: sp, score })
  }

  return matches
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(m => m.pattern)
}

/**
 * Format object blueprints as prompt context.
 */
export function formatBlueprintsForPrompt(blueprints: ObjectBlueprint[]): string {
  if (blueprints.length === 0) return ''
  return '\n\nREFERENCE BLUEPRINTS (use these EXACT part decompositions):\n' +
    blueprints.map(b => b.parts).join('\n\n')
}

/**
 * Format script patterns as prompt context.
 */
export function formatScriptPatternsForPrompt(patterns: ScriptPattern[]): string {
  if (patterns.length === 0) return ''
  return '\n\nSCRIPT REFERENCE PATTERNS (adapt these for the user\'s request):\n' +
    patterns.map(p => `${p.name}: ${p.description}\n${p.code}`).join('\n\n')
}
