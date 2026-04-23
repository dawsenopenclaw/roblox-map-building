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

  // ─── ADVANCED GAMEPLAY SYSTEMS ──────────────────────────────────────────

  {
    keywords: ['stamina', 'stamina bar', 'stamina system', 'sprint bar', 'energy bar', 'endurance'],
    category: 'gameplay',
    name: 'Stamina Bar System',
    description: 'ScreenGui stamina bar that depletes when sprinting (Shift), regenerates when idle, color transitions green→yellow→red with smooth TweenService animations',
    code: `-- Stamina Bar System: depletes on sprint, regenerates idle, color shifts
local Players = game:GetService("Players")
local UserInputService = game:GetService("UserInputService")
local TweenService = game:GetService("TweenService")
local RunService = game:GetService("RunService")
local player = Players.LocalPlayer
local character = player.Character or player.CharacterAdded:Wait()
local humanoid = character:WaitForChild("Humanoid")

local MAX_STAMINA: number = 100
local stamina: number = MAX_STAMINA
local DRAIN_RATE: number = 20 -- per second
local REGEN_RATE: number = 10 -- per second
local SPRINT_SPEED: number = 32
local WALK_SPEED: number = 16
local isSprinting: boolean = false

-- GUI setup
local gui = Instance.new("ScreenGui")
gui.Name = "StaminaGui"
gui.ResetOnSpawn = false
gui.Parent = player.PlayerGui

local bg = Instance.new("Frame")
bg.Name = "StaminaBG"
bg.Size = UDim2.new(0.25, 0, 0.03, 0)
bg.Position = UDim2.new(0.375, 0, 0.92, 0)
bg.BackgroundColor3 = Color3.fromRGB(30, 30, 30)
bg.BorderSizePixel = 0
bg.Parent = gui
local bgCorner = Instance.new("UICorner")
bgCorner.CornerRadius = UDim.new(0, 6)
bgCorner.Parent = bg

local fill = Instance.new("Frame")
fill.Name = "StaminaFill"
fill.Size = UDim2.new(1, 0, 1, 0)
fill.BackgroundColor3 = Color3.fromRGB(0, 200, 0)
fill.BorderSizePixel = 0
fill.Parent = bg
local fillCorner = Instance.new("UICorner")
fillCorner.CornerRadius = UDim.new(0, 6)
fillCorner.Parent = fill

local gradient = Instance.new("UIGradient")
gradient.Color = ColorSequence.new({
  ColorSequenceKeypoint.new(0, Color3.fromRGB(0, 255, 50)),
  ColorSequenceKeypoint.new(1, Color3.fromRGB(0, 180, 0))
})
gradient.Parent = fill

local label = Instance.new("TextLabel")
label.Size = UDim2.new(1, 0, 1, 0)
label.BackgroundTransparency = 1
label.Text = "STAMINA"
label.TextColor3 = Color3.fromRGB(255, 255, 255)
label.TextScaled = true
label.Font = Enum.Font.GothamBold
label.Parent = bg

local function getStaminaColor(pct: number): Color3
  if pct > 0.5 then
    return Color3.fromRGB(0, 200, 0):Lerp(Color3.fromRGB(255, 255, 0), (1 - pct) * 2)
  else
    return Color3.fromRGB(255, 255, 0):Lerp(Color3.fromRGB(255, 40, 40), (0.5 - pct) * 2)
  end
end

UserInputService.InputBegan:Connect(function(input, processed)
  if processed then return end
  if input.KeyCode == Enum.KeyCode.LeftShift and stamina > 0 then
    isSprinting = true
    humanoid.WalkSpeed = SPRINT_SPEED
  end
end)

UserInputService.InputEnded:Connect(function(input)
  if input.KeyCode == Enum.KeyCode.LeftShift then
    isSprinting = false
    humanoid.WalkSpeed = WALK_SPEED
  end
end)

RunService.Heartbeat:Connect(function(dt: number)
  if isSprinting and humanoid.MoveDirection.Magnitude > 0 then
    stamina = math.max(0, stamina - DRAIN_RATE * dt)
    if stamina <= 0 then
      isSprinting = false
      humanoid.WalkSpeed = WALK_SPEED
    end
  else
    stamina = math.min(MAX_STAMINA, stamina + REGEN_RATE * dt)
  end
  local pct = stamina / MAX_STAMINA
  TweenService:Create(fill, TweenInfo.new(0.15), {
    Size = UDim2.new(pct, 0, 1, 0),
    BackgroundColor3 = getStaminaColor(pct)
  }):Play()
end)

player.CharacterAdded:Connect(function(char)
  character = char
  humanoid = char:WaitForChild("Humanoid")
  stamina = MAX_STAMINA
end)`
  },
  {
    keywords: ['settings', 'settings ui', 'settings menu', 'options menu', 'brightness slider', 'fov slider', 'volume slider', 'toggle switch'],
    category: 'ui',
    name: 'Settings UI',
    description: 'Dark-themed settings ScreenGui with brightness, FOV, and music volume sliders plus animated toggle switches',
    code: `-- Settings UI: dark theme, sliders for brightness/FOV/volume, toggle switches
local Players = game:GetService("Players")
local TweenService = game:GetService("TweenService")
local Lighting = game:GetService("Lighting")
local UserInputService = game:GetService("UserInputService")
local player = Players.LocalPlayer
local camera = workspace.CurrentCamera

local gui = Instance.new("ScreenGui")
gui.Name = "SettingsGui"
gui.ResetOnSpawn = false
gui.Parent = player.PlayerGui

local main = Instance.new("Frame")
main.Name = "SettingsFrame"
main.Size = UDim2.new(0.35, 0, 0.55, 0)
main.Position = UDim2.new(0.325, 0, 0.225, 0)
main.BackgroundColor3 = Color3.fromRGB(25, 25, 30)
main.BorderSizePixel = 0
main.Visible = false
main.Parent = gui
Instance.new("UICorner", main).CornerRadius = UDim.new(0, 12)

local title = Instance.new("TextLabel")
title.Size = UDim2.new(1, 0, 0.12, 0)
title.BackgroundTransparency = 1
title.Text = "SETTINGS"
title.TextColor3 = Color3.fromRGB(255, 255, 255)
title.TextScaled = true
title.Font = Enum.Font.GothamBold
title.Parent = main

local function createSlider(parent: Frame, yPos: number, labelText: string, min: number, max: number, default: number, callback: (value: number) -> ())
  local container = Instance.new("Frame")
  container.Size = UDim2.new(0.85, 0, 0.12, 0)
  container.Position = UDim2.new(0.075, 0, yPos, 0)
  container.BackgroundTransparency = 1
  container.Parent = parent

  local lbl = Instance.new("TextLabel")
  lbl.Size = UDim2.new(0.4, 0, 1, 0)
  lbl.BackgroundTransparency = 1
  lbl.Text = labelText
  lbl.TextColor3 = Color3.fromRGB(200, 200, 200)
  lbl.TextScaled = true
  lbl.Font = Enum.Font.Gotham
  lbl.TextXAlignment = Enum.TextXAlignment.Left
  lbl.Parent = container

  local track = Instance.new("Frame")
  track.Size = UDim2.new(0.5, 0, 0.15, 0)
  track.Position = UDim2.new(0.45, 0, 0.425, 0)
  track.BackgroundColor3 = Color3.fromRGB(60, 60, 70)
  track.BorderSizePixel = 0
  track.Parent = container
  Instance.new("UICorner", track).CornerRadius = UDim.new(1, 0)

  local knob = Instance.new("TextButton")
  knob.Size = UDim2.new(0, 18, 0, 18)
  knob.Position = UDim2.new((default - min) / (max - min), -9, 0.5, -9)
  knob.BackgroundColor3 = Color3.fromRGB(80, 160, 255)
  knob.Text = ""
  knob.BorderSizePixel = 0
  knob.Parent = track
  Instance.new("UICorner", knob).CornerRadius = UDim.new(1, 0)

  local valLabel = Instance.new("TextLabel")
  valLabel.Size = UDim2.new(0.1, 0, 1, 0)
  valLabel.Position = UDim2.new(0.9, 0, 0, 0)
  valLabel.BackgroundTransparency = 1
  valLabel.Text = tostring(math.floor(default))
  valLabel.TextColor3 = Color3.fromRGB(180, 180, 180)
  valLabel.TextScaled = true
  valLabel.Font = Enum.Font.Gotham
  valLabel.Parent = container

  local dragging = false
  knob.MouseButton1Down:Connect(function() dragging = true end)
  UserInputService.InputEnded:Connect(function(input)
    if input.UserInputType == Enum.UserInputType.MouseButton1 then dragging = false end
  end)
  UserInputService.InputChanged:Connect(function(input)
    if dragging and input.UserInputType == Enum.UserInputType.MouseMovement then
      local absPos = track.AbsolutePosition.X
      local absSize = track.AbsoluteSize.X
      local rel = math.clamp((input.Position.X - absPos) / absSize, 0, 1)
      knob.Position = UDim2.new(rel, -9, 0.5, -9)
      local value = min + (max - min) * rel
      valLabel.Text = tostring(math.floor(value))
      callback(value)
    end
  end)
end

local function createToggle(parent: Frame, yPos: number, labelText: string, default: boolean, callback: (state: boolean) -> ())
  local container = Instance.new("Frame")
  container.Size = UDim2.new(0.85, 0, 0.1, 0)
  container.Position = UDim2.new(0.075, 0, yPos, 0)
  container.BackgroundTransparency = 1
  container.Parent = parent

  local lbl = Instance.new("TextLabel")
  lbl.Size = UDim2.new(0.6, 0, 1, 0)
  lbl.BackgroundTransparency = 1
  lbl.Text = labelText
  lbl.TextColor3 = Color3.fromRGB(200, 200, 200)
  lbl.TextScaled = true
  lbl.Font = Enum.Font.Gotham
  lbl.TextXAlignment = Enum.TextXAlignment.Left
  lbl.Parent = container

  local bg = Instance.new("TextButton")
  bg.Size = UDim2.new(0, 44, 0, 22)
  bg.Position = UDim2.new(0.8, 0, 0.5, -11)
  bg.BackgroundColor3 = default and Color3.fromRGB(80, 160, 255) or Color3.fromRGB(60, 60, 70)
  bg.Text = ""
  bg.BorderSizePixel = 0
  bg.Parent = container
  Instance.new("UICorner", bg).CornerRadius = UDim.new(1, 0)

  local circle = Instance.new("Frame")
  circle.Size = UDim2.new(0, 18, 0, 18)
  circle.Position = default and UDim2.new(1, -20, 0.5, -9) or UDim2.new(0, 2, 0.5, -9)
  circle.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
  circle.BorderSizePixel = 0
  circle.Parent = bg
  Instance.new("UICorner", circle).CornerRadius = UDim.new(1, 0)

  local state = default
  bg.MouseButton1Click:Connect(function()
    state = not state
    TweenService:Create(circle, TweenInfo.new(0.2, Enum.EasingStyle.Quad), {
      Position = state and UDim2.new(1, -20, 0.5, -9) or UDim2.new(0, 2, 0.5, -9)
    }):Play()
    TweenService:Create(bg, TweenInfo.new(0.2), {
      BackgroundColor3 = state and Color3.fromRGB(80, 160, 255) or Color3.fromRGB(60, 60, 70)
    }):Play()
    callback(state)
  end)
end

createSlider(main, 0.15, "Brightness", 0, 3, Lighting.Brightness, function(v) Lighting.Brightness = v end)
createSlider(main, 0.30, "FOV", 40, 120, camera.FieldOfView, function(v) camera.FieldOfView = v end)
createSlider(main, 0.45, "Music Volume", 0, 100, 50, function(v)
  for _, s in workspace:GetDescendants() do
    if s:IsA("Sound") and s.Looped then s.Volume = v / 100 end
  end
end)
createToggle(main, 0.62, "Shadows", true, function(s) Lighting.GlobalShadows = s end)
createToggle(main, 0.74, "Fullbright", false, function(s)
  Lighting.Ambient = s and Color3.fromRGB(200, 200, 200) or Color3.fromRGB(50, 50, 50)
end)

-- Close button
local closeBtn = Instance.new("TextButton")
closeBtn.Size = UDim2.new(0.08, 0, 0.08, 0)
closeBtn.Position = UDim2.new(0.9, 0, 0.02, 0)
closeBtn.BackgroundTransparency = 1
closeBtn.Text = "X"
closeBtn.TextColor3 = Color3.fromRGB(200, 200, 200)
closeBtn.TextScaled = true
closeBtn.Font = Enum.Font.GothamBold
closeBtn.Parent = main
closeBtn.MouseButton1Click:Connect(function() main.Visible = false end)

-- Toggle with M key
UserInputService.InputBegan:Connect(function(input, processed)
  if processed then return end
  if input.KeyCode == Enum.KeyCode.M then main.Visible = not main.Visible end
end)`
  },
  {
    keywords: ['vehicle selection', 'vehicle ui', 'car select', 'vehicle menu', 'vehicle picker', 'spawn vehicle'],
    category: 'ui',
    name: 'Vehicle Selection UI',
    description: 'ScreenGui grid of vehicle previews, click to select, spawns vehicle at pad and despawns previous',
    code: `-- Vehicle Selection UI: grid of vehicles, spawn at pad, despawn previous
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")
local player = Players.LocalPlayer

local VEHICLES: {{name: string, modelName: string, color: Color3}} = {
  {name = "Sedan", modelName = "Sedan", color = Color3.fromRGB(200, 50, 50)},
  {name = "SUV", modelName = "SUV", color = Color3.fromRGB(50, 100, 200)},
  {name = "Truck", modelName = "Truck", color = Color3.fromRGB(80, 80, 80)},
  {name = "Sports Car", modelName = "SportsCar", color = Color3.fromRGB(255, 200, 0)},
  {name = "Van", modelName = "Van", color = Color3.fromRGB(255, 255, 255)},
  {name = "Motorcycle", modelName = "Motorcycle", color = Color3.fromRGB(30, 30, 30)},
}

local spawnPad = workspace:FindFirstChild("VehicleSpawnPad") -- Part in workspace
local currentVehicle: Model? = nil

local gui = Instance.new("ScreenGui")
gui.Name = "VehicleSelectGui"
gui.ResetOnSpawn = false
gui.Parent = player.PlayerGui

local mainFrame = Instance.new("Frame")
mainFrame.Name = "VehiclePanel"
mainFrame.Size = UDim2.new(0.5, 0, 0.5, 0)
mainFrame.Position = UDim2.new(0.25, 0, 0.25, 0)
mainFrame.BackgroundColor3 = Color3.fromRGB(20, 20, 25)
mainFrame.BorderSizePixel = 0
mainFrame.Visible = false
mainFrame.Parent = gui
Instance.new("UICorner", mainFrame).CornerRadius = UDim.new(0, 10)

local titleLabel = Instance.new("TextLabel")
titleLabel.Size = UDim2.new(1, 0, 0.12, 0)
titleLabel.BackgroundTransparency = 1
titleLabel.Text = "SELECT VEHICLE"
titleLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
titleLabel.TextScaled = true
titleLabel.Font = Enum.Font.GothamBold
titleLabel.Parent = mainFrame

local grid = Instance.new("Frame")
grid.Size = UDim2.new(0.9, 0, 0.8, 0)
grid.Position = UDim2.new(0.05, 0, 0.15, 0)
grid.BackgroundTransparency = 1
grid.Parent = mainFrame
local gridLayout = Instance.new("UIGridLayout")
gridLayout.CellSize = UDim2.new(0.3, -8, 0.45, -8)
gridLayout.CellPadding = UDim2.new(0, 8, 0, 8)
gridLayout.Parent = grid

for _, vData in VEHICLES do
  local card = Instance.new("TextButton")
  card.BackgroundColor3 = Color3.fromRGB(35, 35, 45)
  card.BorderSizePixel = 0
  card.Text = ""
  card.Parent = grid
  Instance.new("UICorner", card).CornerRadius = UDim.new(0, 8)

  local preview = Instance.new("Frame")
  preview.Size = UDim2.new(0.8, 0, 0.5, 0)
  preview.Position = UDim2.new(0.1, 0, 0.05, 0)
  preview.BackgroundColor3 = vData.color
  preview.BorderSizePixel = 0
  preview.Parent = card
  Instance.new("UICorner", preview).CornerRadius = UDim.new(0, 6)

  local nameLabel = Instance.new("TextLabel")
  nameLabel.Size = UDim2.new(0.9, 0, 0.2, 0)
  nameLabel.Position = UDim2.new(0.05, 0, 0.58, 0)
  nameLabel.BackgroundTransparency = 1
  nameLabel.Text = vData.name
  nameLabel.TextColor3 = Color3.fromRGB(220, 220, 220)
  nameLabel.TextScaled = true
  nameLabel.Font = Enum.Font.GothamBold
  nameLabel.Parent = card

  local selectBtn = Instance.new("TextLabel")
  selectBtn.Size = UDim2.new(0.7, 0, 0.15, 0)
  selectBtn.Position = UDim2.new(0.15, 0, 0.8, 0)
  selectBtn.BackgroundColor3 = Color3.fromRGB(60, 140, 255)
  selectBtn.Text = "SPAWN"
  selectBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
  selectBtn.TextScaled = true
  selectBtn.Font = Enum.Font.GothamBold
  selectBtn.BorderSizePixel = 0
  selectBtn.Parent = card
  Instance.new("UICorner", selectBtn).CornerRadius = UDim.new(0, 4)

  card.MouseEnter:Connect(function()
    TweenService:Create(card, TweenInfo.new(0.15), {BackgroundColor3 = Color3.fromRGB(50, 50, 65)}):Play()
  end)
  card.MouseLeave:Connect(function()
    TweenService:Create(card, TweenInfo.new(0.15), {BackgroundColor3 = Color3.fromRGB(35, 35, 45)}):Play()
  end)

  card.MouseButton1Click:Connect(function()
    if currentVehicle then currentVehicle:Destroy() end
    local template = ReplicatedStorage:FindFirstChild("Vehicles") and ReplicatedStorage.Vehicles:FindFirstChild(vData.modelName)
    if template and spawnPad then
      currentVehicle = template:Clone()
      currentVehicle:PivotTo(spawnPad.CFrame * CFrame.new(0, 5, 0))
      currentVehicle.Parent = workspace
    end
    mainFrame.Visible = false
  end)
end

-- Toggle with V key
local UserInputService = game:GetService("UserInputService")
UserInputService.InputBegan:Connect(function(input, processed)
  if processed then return end
  if input.KeyCode == Enum.KeyCode.V then mainFrame.Visible = not mainFrame.Visible end
end)`
  },
  {
    keywords: ['farming', 'crop', 'plant', 'harvest', 'agriculture', 'farm system', 'grow crops'],
    category: 'gameplay',
    name: 'Farming/Crop System',
    description: 'Click dirt plots to plant crops with BillboardGui selection, growth timer with visual changes, harvest for currency reward',
    code: `-- Farming/Crop System: click dirt to plant, grow over time, harvest for coins
local Players = game:GetService("Players")
local TweenService = game:GetService("TweenService")

local CROPS: {{name: string, growTime: number, reward: number, color: Color3}} = {
  {name = "Wheat", growTime = 30, reward = 10, color = Color3.fromRGB(220, 190, 80)},
  {name = "Carrot", growTime = 45, reward = 20, color = Color3.fromRGB(255, 140, 30)},
  {name = "Corn", growTime = 60, reward = 35, color = Color3.fromRGB(255, 220, 60)},
  {name = "Tomato", growTime = 90, reward = 50, color = Color3.fromRGB(220, 50, 30)},
}

local function setupPlot(plot: BasePart)
  local state: string = "empty" -- empty | selecting | growing | ready
  local chosenCrop = nil
  local growthStart: number = 0
  local cropVisual: BasePart? = nil

  local clickDetector = Instance.new("ClickDetector")
  clickDetector.MaxActivationDistance = 12
  clickDetector.Parent = plot

  local billboard: BillboardGui? = nil

  local function showCropMenu(player: Player)
    if billboard then billboard:Destroy() end
    billboard = Instance.new("BillboardGui")
    billboard.Size = UDim2.new(4, 0, 3, 0)
    billboard.StudsOffset = Vector3.new(0, 3, 0)
    billboard.AlwaysOnTop = true
    billboard.Parent = plot

    local bg = Instance.new("Frame")
    bg.Size = UDim2.new(1, 0, 1, 0)
    bg.BackgroundColor3 = Color3.fromRGB(30, 30, 35)
    bg.BorderSizePixel = 0
    bg.Parent = billboard
    Instance.new("UICorner", bg).CornerRadius = UDim.new(0, 8)

    local layout = Instance.new("UIListLayout")
    layout.FillDirection = Enum.FillDirection.Vertical
    layout.Padding = UDim.new(0, 4)
    layout.HorizontalAlignment = Enum.HorizontalAlignment.Center
    layout.Parent = bg

    local header = Instance.new("TextLabel")
    header.Size = UDim2.new(0.9, 0, 0.18, 0)
    header.BackgroundTransparency = 1
    header.Text = "Select Crop"
    header.TextColor3 = Color3.fromRGB(255, 255, 255)
    header.TextScaled = true
    header.Font = Enum.Font.GothamBold
    header.Parent = bg

    for _, crop in CROPS do
      local btn = Instance.new("TextButton")
      btn.Size = UDim2.new(0.85, 0, 0.17, 0)
      btn.BackgroundColor3 = crop.color
      btn.Text = crop.name .. " (" .. crop.growTime .. "s) +$" .. crop.reward
      btn.TextColor3 = Color3.fromRGB(255, 255, 255)
      btn.TextScaled = true
      btn.Font = Enum.Font.GothamBold
      btn.BorderSizePixel = 0
      btn.Parent = bg
      Instance.new("UICorner", btn).CornerRadius = UDim.new(0, 4)

      btn.MouseButton1Click:Connect(function()
        chosenCrop = crop
        state = "growing"
        growthStart = tick()
        if billboard then billboard:Destroy() billboard = nil end
        -- Change dirt color to planted
        TweenService:Create(plot, TweenInfo.new(0.3), {Color = Color3.fromRGB(80, 55, 30)}):Play()
        -- Create crop visual
        cropVisual = Instance.new("Part")
        cropVisual.Size = Vector3.new(1, 0.2, 1)
        cropVisual.Position = plot.Position + Vector3.new(0, plot.Size.Y / 2 + 0.1, 0)
        cropVisual.Color = Color3.fromRGB(50, 140, 50)
        cropVisual.Anchored = true
        cropVisual.CanCollide = false
        cropVisual.Material = Enum.Material.Grass
        cropVisual.Parent = plot

        -- Growth loop
        task.spawn(function()
          while state == "growing" and cropVisual do
            local elapsed = tick() - growthStart
            local pct = math.clamp(elapsed / chosenCrop.growTime, 0, 1)
            cropVisual.Size = Vector3.new(1, 0.2 + pct * 2.5, 1)
            cropVisual.Position = plot.Position + Vector3.new(0, plot.Size.Y / 2 + cropVisual.Size.Y / 2, 0)
            cropVisual.Color = Color3.fromRGB(50, 140, 50):Lerp(chosenCrop.color, pct)
            if pct >= 1 then
              state = "ready"
              -- Sparkle to indicate ready
              local sparkle = Instance.new("Sparkles")
              sparkle.SparkleColor = Color3.fromRGB(255, 255, 100)
              sparkle.Parent = cropVisual
            end
            task.wait(0.5)
          end
        end)
      end)
    end
  end

  clickDetector.MouseClick:Connect(function(player: Player)
    if state == "empty" then
      showCropMenu(player)
    elseif state == "ready" then
      -- Harvest
      local coins = player:FindFirstChild("leaderstats") and player.leaderstats:FindFirstChild("Coins")
      if coins and chosenCrop then coins.Value += chosenCrop.reward end
      if cropVisual then cropVisual:Destroy() cropVisual = nil end
      TweenService:Create(plot, TweenInfo.new(0.3), {Color = Color3.fromRGB(120, 85, 50)}):Play()
      state = "empty"
      chosenCrop = nil
    end
  end)
end

-- Setup all plots tagged or named "FarmPlot"
for _, part in workspace:GetDescendants() do
  if part:IsA("BasePart") and part.Name == "FarmPlot" then
    setupPlot(part)
  end
end`
  },
  {
    keywords: ['premium shop', 'shop gui', 'item shop', 'store ui', 'buy menu', 'purchase gui', 'shop system'],
    category: 'ui',
    name: 'Premium Shop GUI',
    description: 'Dark ScreenGui with item cards in grid, icon/name/price, buy button with hover effects, RemoteEvent purchase validation',
    code: `-- Premium Shop GUI: dark theme grid shop with purchase validation
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")
local UserInputService = game:GetService("UserInputService")
local player = Players.LocalPlayer

-- RemoteEvent for server validation
local purchaseEvent = ReplicatedStorage:FindFirstChild("PurchaseItem")
if not purchaseEvent then
  purchaseEvent = Instance.new("RemoteEvent")
  purchaseEvent.Name = "PurchaseItem"
  purchaseEvent.Parent = ReplicatedStorage
end

local ITEMS: {{name: string, price: number, icon: string, desc: string}} = {
  {name = "Speed Boost", price = 100, icon = "rbxassetid://6023426926", desc = "2x speed for 60s"},
  {name = "Jump Pack", price = 150, icon = "rbxassetid://6023426926", desc = "3x jump power"},
  {name = "Shield", price = 250, icon = "rbxassetid://6023426926", desc = "Block 1 hit"},
  {name = "Double Coins", price = 500, icon = "rbxassetid://6023426926", desc = "2x coins for 5 min"},
  {name = "Pet Egg", price = 750, icon = "rbxassetid://6023426926", desc = "Random pet hatch"},
  {name = "VIP Pass", price = 1000, icon = "rbxassetid://6023426926", desc = "Exclusive area access"},
}

local gui = Instance.new("ScreenGui")
gui.Name = "ShopGui"
gui.ResetOnSpawn = false
gui.Parent = player.PlayerGui

local mainFrame = Instance.new("Frame")
mainFrame.Size = UDim2.new(0.55, 0, 0.65, 0)
mainFrame.Position = UDim2.new(0.225, 0, 0.175, 0)
mainFrame.BackgroundColor3 = Color3.fromRGB(18, 18, 24)
mainFrame.BorderSizePixel = 0
mainFrame.Visible = false
mainFrame.Parent = gui
Instance.new("UICorner", mainFrame).CornerRadius = UDim.new(0, 12)
local stroke = Instance.new("UIStroke")
stroke.Color = Color3.fromRGB(60, 60, 80)
stroke.Thickness = 2
stroke.Parent = mainFrame

local header = Instance.new("TextLabel")
header.Size = UDim2.new(1, 0, 0.1, 0)
header.BackgroundTransparency = 1
header.Text = "PREMIUM SHOP"
header.TextColor3 = Color3.fromRGB(255, 215, 0)
header.TextScaled = true
header.Font = Enum.Font.GothamBold
header.Parent = mainFrame

local balanceLabel = Instance.new("TextLabel")
balanceLabel.Size = UDim2.new(0.3, 0, 0.06, 0)
balanceLabel.Position = UDim2.new(0.65, 0, 0.02, 0)
balanceLabel.BackgroundTransparency = 1
balanceLabel.TextColor3 = Color3.fromRGB(180, 180, 180)
balanceLabel.TextScaled = true
balanceLabel.Font = Enum.Font.Gotham
balanceLabel.Parent = mainFrame
local function updateBalance()
  local coins = player:FindFirstChild("leaderstats") and player.leaderstats:FindFirstChild("Coins")
  balanceLabel.Text = "Coins: " .. (coins and coins.Value or 0)
end
updateBalance()

local scrollFrame = Instance.new("ScrollingFrame")
scrollFrame.Size = UDim2.new(0.9, 0, 0.8, 0)
scrollFrame.Position = UDim2.new(0.05, 0, 0.12, 0)
scrollFrame.BackgroundTransparency = 1
scrollFrame.ScrollBarThickness = 6
scrollFrame.ScrollBarImageColor3 = Color3.fromRGB(80, 80, 100)
scrollFrame.BorderSizePixel = 0
scrollFrame.CanvasSize = UDim2.new(0, 0, 0, 0)
scrollFrame.AutomaticCanvasSize = Enum.AutomaticSize.Y
scrollFrame.Parent = mainFrame

local gridLayout = Instance.new("UIGridLayout")
gridLayout.CellSize = UDim2.new(0.3, -8, 0, 140)
gridLayout.CellPadding = UDim2.new(0, 8, 0, 8)
gridLayout.SortOrder = Enum.SortOrder.LayoutOrder
gridLayout.Parent = scrollFrame

for i, item in ITEMS do
  local card = Instance.new("Frame")
  card.BackgroundColor3 = Color3.fromRGB(30, 30, 40)
  card.BorderSizePixel = 0
  card.LayoutOrder = i
  card.Parent = scrollFrame
  Instance.new("UICorner", card).CornerRadius = UDim.new(0, 8)

  local icon = Instance.new("ImageLabel")
  icon.Size = UDim2.new(0.5, 0, 0.35, 0)
  icon.Position = UDim2.new(0.25, 0, 0.03, 0)
  icon.BackgroundTransparency = 1
  icon.Image = item.icon
  icon.Parent = card

  local nameLabel = Instance.new("TextLabel")
  nameLabel.Size = UDim2.new(0.9, 0, 0.15, 0)
  nameLabel.Position = UDim2.new(0.05, 0, 0.4, 0)
  nameLabel.BackgroundTransparency = 1
  nameLabel.Text = item.name
  nameLabel.TextColor3 = Color3.fromRGB(240, 240, 240)
  nameLabel.TextScaled = true
  nameLabel.Font = Enum.Font.GothamBold
  nameLabel.Parent = card

  local descLabel = Instance.new("TextLabel")
  descLabel.Size = UDim2.new(0.9, 0, 0.12, 0)
  descLabel.Position = UDim2.new(0.05, 0, 0.56, 0)
  descLabel.BackgroundTransparency = 1
  descLabel.Text = item.desc
  descLabel.TextColor3 = Color3.fromRGB(150, 150, 160)
  descLabel.TextScaled = true
  descLabel.Font = Enum.Font.Gotham
  descLabel.Parent = card

  local buyBtn = Instance.new("TextButton")
  buyBtn.Size = UDim2.new(0.7, 0, 0.16, 0)
  buyBtn.Position = UDim2.new(0.15, 0, 0.73, 0)
  buyBtn.BackgroundColor3 = Color3.fromRGB(50, 180, 80)
  buyBtn.Text = "$" .. item.price
  buyBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
  buyBtn.TextScaled = true
  buyBtn.Font = Enum.Font.GothamBold
  buyBtn.BorderSizePixel = 0
  buyBtn.Parent = card
  Instance.new("UICorner", buyBtn).CornerRadius = UDim.new(0, 6)

  buyBtn.MouseEnter:Connect(function()
    TweenService:Create(buyBtn, TweenInfo.new(0.15), {BackgroundColor3 = Color3.fromRGB(70, 220, 100)}):Play()
  end)
  buyBtn.MouseLeave:Connect(function()
    TweenService:Create(buyBtn, TweenInfo.new(0.15), {BackgroundColor3 = Color3.fromRGB(50, 180, 80)}):Play()
  end)
  buyBtn.MouseButton1Click:Connect(function()
    purchaseEvent:FireServer(item.name, item.price)
    buyBtn.Text = "Bought!"
    TweenService:Create(buyBtn, TweenInfo.new(0.2), {BackgroundColor3 = Color3.fromRGB(80, 80, 80)}):Play()
    task.wait(1.5)
    buyBtn.Text = "$" .. item.price
    TweenService:Create(buyBtn, TweenInfo.new(0.2), {BackgroundColor3 = Color3.fromRGB(50, 180, 80)}):Play()
    updateBalance()
  end)
end

-- Close button
local closeBtn = Instance.new("TextButton")
closeBtn.Size = UDim2.new(0.06, 0, 0.06, 0)
closeBtn.Position = UDim2.new(0.92, 0, 0.02, 0)
closeBtn.BackgroundTransparency = 1
closeBtn.Text = "X"
closeBtn.TextColor3 = Color3.fromRGB(200, 200, 200)
closeBtn.TextScaled = true
closeBtn.Font = Enum.Font.GothamBold
closeBtn.Parent = mainFrame
closeBtn.MouseButton1Click:Connect(function() mainFrame.Visible = false end)

UserInputService.InputBegan:Connect(function(input, processed)
  if processed then return end
  if input.KeyCode == Enum.KeyCode.B then mainFrame.Visible = not mainFrame.Visible; updateBalance() end
end)

-- SERVER SCRIPT (put in ServerScriptService):
-- local ReplicatedStorage = game:GetService("ReplicatedStorage")
-- local purchaseEvent = ReplicatedStorage:WaitForChild("PurchaseItem")
-- purchaseEvent.OnServerEvent:Connect(function(player, itemName, price)
--   local coins = player:FindFirstChild("leaderstats") and player.leaderstats:FindFirstChild("Coins")
--   if not coins or coins.Value < price then return end
--   coins.Value -= price
--   -- Grant item logic here
-- end)`
  },
  {
    keywords: ['health bar', 'npc health', 'billboard health', 'health display', 'hp bar', 'enemy health'],
    category: 'ui',
    name: 'Health Bar BillboardGui',
    description: 'BillboardGui above NPC head showing health bar with red/green gradient and smooth TweenService width change on damage',
    code: `-- Health Bar BillboardGui: above NPC, smooth HP transitions
local TweenService = game:GetService("TweenService")

local function addHealthBar(npc: Model)
  local humanoid = npc:FindFirstChildOfClass("Humanoid")
  local head = npc:FindFirstChild("Head")
  if not humanoid or not head then return end

  local billboard = Instance.new("BillboardGui")
  billboard.Name = "HealthBarGui"
  billboard.Size = UDim2.new(4, 0, 0.5, 0)
  billboard.StudsOffset = Vector3.new(0, 2.5, 0)
  billboard.AlwaysOnTop = true
  billboard.MaxDistance = 50
  billboard.Parent = head

  local bgFrame = Instance.new("Frame")
  bgFrame.Size = UDim2.new(1, 0, 1, 0)
  bgFrame.BackgroundColor3 = Color3.fromRGB(40, 40, 40)
  bgFrame.BorderSizePixel = 0
  bgFrame.Parent = billboard
  Instance.new("UICorner", bgFrame).CornerRadius = UDim.new(0, 4)

  local fillFrame = Instance.new("Frame")
  fillFrame.Name = "HealthFill"
  fillFrame.Size = UDim2.new(1, 0, 1, 0)
  fillFrame.BackgroundColor3 = Color3.fromRGB(0, 200, 0)
  fillFrame.BorderSizePixel = 0
  fillFrame.Parent = bgFrame
  Instance.new("UICorner", fillFrame).CornerRadius = UDim.new(0, 4)

  local gradient = Instance.new("UIGradient")
  gradient.Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0, Color3.fromRGB(0, 255, 80)),
    ColorSequenceKeypoint.new(1, Color3.fromRGB(0, 180, 0))
  })
  gradient.Parent = fillFrame

  local damageFlash = Instance.new("Frame")
  damageFlash.Size = UDim2.new(1, 0, 1, 0)
  damageFlash.BackgroundColor3 = Color3.fromRGB(255, 80, 80)
  damageFlash.BackgroundTransparency = 1
  damageFlash.BorderSizePixel = 0
  damageFlash.Parent = bgFrame
  Instance.new("UICorner", damageFlash).CornerRadius = UDim.new(0, 4)

  local nameLabel = Instance.new("TextLabel")
  nameLabel.Size = UDim2.new(1, 0, 1, 0)
  nameLabel.BackgroundTransparency = 1
  nameLabel.Text = npc.Name
  nameLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
  nameLabel.TextScaled = true
  nameLabel.Font = Enum.Font.GothamBold
  nameLabel.Parent = bgFrame

  humanoid.HealthChanged:Connect(function(newHealth: number)
    local pct = math.clamp(newHealth / humanoid.MaxHealth, 0, 1)
    local healthColor: Color3
    if pct > 0.5 then
      healthColor = Color3.fromRGB(255, 255, 0):Lerp(Color3.fromRGB(0, 200, 0), (pct - 0.5) * 2)
    else
      healthColor = Color3.fromRGB(200, 0, 0):Lerp(Color3.fromRGB(255, 255, 0), pct * 2)
    end
    TweenService:Create(fillFrame, TweenInfo.new(0.3, Enum.EasingStyle.Quad), {
      Size = UDim2.new(pct, 0, 1, 0),
      BackgroundColor3 = healthColor
    }):Play()
    -- Damage flash
    damageFlash.BackgroundTransparency = 0.3
    TweenService:Create(damageFlash, TweenInfo.new(0.4), {BackgroundTransparency = 1}):Play()
  end)

  humanoid.Died:Connect(function()
    TweenService:Create(fillFrame, TweenInfo.new(0.5), {Size = UDim2.new(0, 0, 1, 0)}):Play()
    task.wait(2)
    billboard:Destroy()
  end)
end

-- Apply to all NPCs in a folder
local npcFolder = workspace:FindFirstChild("NPCs")
if npcFolder then
  for _, npc in npcFolder:GetChildren() do
    if npc:IsA("Model") and npc:FindFirstChildOfClass("Humanoid") then
      addHealthBar(npc)
    end
  end
  npcFolder.ChildAdded:Connect(function(child)
    if child:IsA("Model") then
      task.wait(0.1)
      addHealthBar(child)
    end
  end)
end`
  },
  {
    keywords: ['barrier', 'push back', 'push barrier', 'force field barrier', 'invisible wall', 'repel'],
    category: 'gameplay',
    name: 'Push-Back Barrier',
    description: 'Invisible Part with Touched event that uses BodyVelocity to push players away from center with visual feedback',
    code: `-- Push-Back Barrier: invisible part pushes players away on touch
local TweenService = game:GetService("TweenService")

local function setupBarrier(barrierPart: BasePart, pushForce: number?)
  local force: number = pushForce or 80
  barrierPart.Transparency = 1
  barrierPart.CanCollide = false

  -- Visual indicator (optional red shimmer)
  local particles = Instance.new("ParticleEmitter")
  particles.Rate = 5
  particles.Speed = NumberRange.new(0.5, 1)
  particles.Lifetime = NumberRange.new(0.5, 1)
  particles.Size = NumberSequence.new({NumberSequenceKeypoint.new(0, 0), NumberSequenceKeypoint.new(0.5, 0.3), NumberSequenceKeypoint.new(1, 0)})
  particles.Color = ColorSequence.new(Color3.fromRGB(255, 50, 50))
  particles.Transparency = NumberSequence.new({NumberSequenceKeypoint.new(0, 0.8), NumberSequenceKeypoint.new(1, 1)})
  particles.LightEmission = 0.5
  particles.Parent = barrierPart

  local cooldowns: {[Player]: boolean} = {}

  barrierPart.Touched:Connect(function(hit: BasePart)
    local character = hit.Parent
    if not character then return end
    local humanoid = character:FindFirstChildOfClass("Humanoid")
    local rootPart = character:FindFirstChild("HumanoidRootPart")
    if not humanoid or not rootPart or humanoid.Health <= 0 then return end

    local player = game:GetService("Players"):GetPlayerFromCharacter(character)
    if player and cooldowns[player] then return end
    if player then cooldowns[player] = true end

    -- Calculate push direction (away from barrier center)
    local direction = (rootPart.Position - barrierPart.Position).Unit
    direction = Vector3.new(direction.X, 0.3, direction.Z).Unit -- slight upward

    -- Apply BodyVelocity
    local bv = Instance.new("BodyVelocity")
    bv.Velocity = direction * force
    bv.MaxForce = Vector3.new(math.huge, math.huge, math.huge)
    bv.P = 10000
    bv.Parent = rootPart

    -- Visual flash
    local flash = Instance.new("Part")
    flash.Size = Vector3.new(0.5, 0.5, 0.5)
    flash.Position = hit.Position
    flash.Anchored = true
    flash.CanCollide = false
    flash.Material = Enum.Material.Neon
    flash.Color = Color3.fromRGB(255, 80, 80)
    flash.Transparency = 0.3
    flash.Shape = Enum.PartType.Ball
    flash.Parent = workspace
    TweenService:Create(flash, TweenInfo.new(0.4), {Size = Vector3.new(3, 3, 3), Transparency = 1}):Play()

    task.delay(0.15, function() bv:Destroy() end)
    task.delay(0.5, function() flash:Destroy() end)
    task.delay(0.8, function()
      if player then cooldowns[player] = nil end
    end)
  end)
end

-- Apply to all parts named "Barrier"
for _, part in workspace:GetDescendants() do
  if part:IsA("BasePart") and part.Name == "Barrier" then
    setupBarrier(part)
  end
end`
  },
  {
    keywords: ['pressure plate', 'plate trigger', 'step trigger', 'floor button', 'weight plate', 'trigger plate'],
    category: 'interactive',
    name: 'Pressure Plate Trigger',
    description: 'Part that sinks when stepped on with TweenService, fires BindableEvent to trigger connected doors/gates/traps',
    code: `-- Pressure Plate: sinks on step, triggers connected objects via BindableEvent
local TweenService = game:GetService("TweenService")
local Players = game:GetService("Players")

local function setupPressurePlate(plate: BasePart)
  local originalCF = plate.CFrame
  local pressedCF = originalCF - Vector3.new(0, plate.Size.Y * 0.6, 0)
  local isPressed = false
  local touchCount = 0

  plate.Material = Enum.Material.Metal
  plate.Color = Color3.fromRGB(160, 160, 170)

  -- BindableEvent for other scripts to listen
  local triggerEvent = Instance.new("BindableEvent")
  triggerEvent.Name = "PlateTriggered"
  triggerEvent.Parent = plate

  local pressSound = Instance.new("Sound")
  pressSound.SoundId = "rbxassetid://5853930042"
  pressSound.Volume = 0.5
  pressSound.Parent = plate

  local function pressDown()
    if isPressed then return end
    isPressed = true
    pressSound:Play()
    TweenService:Create(plate, TweenInfo.new(0.2, Enum.EasingStyle.Back, Enum.EasingDirection.In), {
      CFrame = pressedCF,
      Color = Color3.fromRGB(100, 200, 100)
    }):Play()
    triggerEvent:Fire(true) -- activated

    -- If connected to a door, open it
    local connectedDoor = plate:FindFirstChild("ConnectedDoor")
    if connectedDoor and connectedDoor:IsA("ObjectValue") and connectedDoor.Value then
      local door = connectedDoor.Value
      local doorOpen = door.CFrame * CFrame.new(0, door.Size.Y, 0)
      TweenService:Create(door, TweenInfo.new(0.5, Enum.EasingStyle.Quad), {CFrame = doorOpen}):Play()
    end
  end

  local function releaseUp()
    if not isPressed then return end
    isPressed = false
    TweenService:Create(plate, TweenInfo.new(0.3, Enum.EasingStyle.Bounce), {
      CFrame = originalCF,
      Color = Color3.fromRGB(160, 160, 170)
    }):Play()
    triggerEvent:Fire(false) -- deactivated

    local connectedDoor = plate:FindFirstChild("ConnectedDoor")
    if connectedDoor and connectedDoor:IsA("ObjectValue") and connectedDoor.Value then
      local door = connectedDoor.Value
      local doorClosed = door.CFrame * CFrame.new(0, -door.Size.Y, 0)
      TweenService:Create(door, TweenInfo.new(0.5, Enum.EasingStyle.Quad), {CFrame = doorClosed}):Play()
    end
  end

  plate.Touched:Connect(function(hit: BasePart)
    local character = hit.Parent
    if not character then return end
    if not Players:GetPlayerFromCharacter(character) then return end
    touchCount += 1
    pressDown()
  end)

  plate.TouchEnded:Connect(function(hit: BasePart)
    local character = hit.Parent
    if not character then return end
    if not Players:GetPlayerFromCharacter(character) then return end
    touchCount = math.max(0, touchCount - 1)
    if touchCount == 0 then
      releaseUp()
    end
  end)
end

for _, part in workspace:GetDescendants() do
  if part:IsA("BasePart") and part.Name == "PressurePlate" then
    setupPressurePlate(part)
  end
end`
  },
  {
    keywords: ['sprint', 'sprint system', 'run faster', 'shift to sprint', 'camera sprint', 'fov sprint', 'sprint effect'],
    category: 'gameplay',
    name: 'Sprint System with Camera Effects',
    description: 'UserInputService Shift to sprint with increased WalkSpeed, smooth FOV change, and optional screen effects',
    code: `-- Sprint System with Camera Effects: Shift to sprint, FOV zoom, speed lines
local Players = game:GetService("Players")
local UserInputService = game:GetService("UserInputService")
local TweenService = game:GetService("TweenService")
local RunService = game:GetService("RunService")
local player = Players.LocalPlayer
local camera = workspace.CurrentCamera

local WALK_SPEED: number = 16
local SPRINT_SPEED: number = 32
local NORMAL_FOV: number = 70
local SPRINT_FOV: number = 85
local isSprinting: boolean = false

local character = player.Character or player.CharacterAdded:Wait()
local humanoid = character:WaitForChild("Humanoid")

-- Speed lines effect (ScreenGui)
local gui = Instance.new("ScreenGui")
gui.Name = "SprintEffectsGui"
gui.ResetOnSpawn = false
gui.Parent = player.PlayerGui

local vignette = Instance.new("Frame")
vignette.Size = UDim2.new(1, 0, 1, 0)
vignette.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
vignette.BackgroundTransparency = 1
vignette.BorderSizePixel = 0
vignette.Parent = gui
local vignetteGradient = Instance.new("UIGradient")
vignetteGradient.Transparency = NumberSequence.new({
  NumberSequenceKeypoint.new(0, 0),
  NumberSequenceKeypoint.new(0.4, 1),
  NumberSequenceKeypoint.new(0.6, 1),
  NumberSequenceKeypoint.new(1, 0)
})
vignetteGradient.Parent = vignette

-- Sprint breathing sound
local breathSound = Instance.new("Sound")
breathSound.SoundId = "rbxassetid://9120258440"
breathSound.Volume = 0
breathSound.Looped = true
breathSound.Parent = player.PlayerGui
breathSound:Play()

local function startSprint()
  if isSprinting then return end
  isSprinting = true
  humanoid.WalkSpeed = SPRINT_SPEED
  TweenService:Create(camera, TweenInfo.new(0.4, Enum.EasingStyle.Quad), {FieldOfView = SPRINT_FOV}):Play()
  TweenService:Create(vignette, TweenInfo.new(0.3), {BackgroundTransparency = 0.7}):Play()
  TweenService:Create(breathSound, TweenInfo.new(0.5), {Volume = 0.15}):Play()
end

local function stopSprint()
  if not isSprinting then return end
  isSprinting = false
  humanoid.WalkSpeed = WALK_SPEED
  TweenService:Create(camera, TweenInfo.new(0.3, Enum.EasingStyle.Quad), {FieldOfView = NORMAL_FOV}):Play()
  TweenService:Create(vignette, TweenInfo.new(0.3), {BackgroundTransparency = 1}):Play()
  TweenService:Create(breathSound, TweenInfo.new(0.5), {Volume = 0}):Play()
end

UserInputService.InputBegan:Connect(function(input, processed)
  if processed then return end
  if input.KeyCode == Enum.KeyCode.LeftShift then startSprint() end
end)

UserInputService.InputEnded:Connect(function(input)
  if input.KeyCode == Enum.KeyCode.LeftShift then stopSprint() end
end)

-- Camera tilt while sprinting and moving
RunService.RenderStepped:Connect(function(dt: number)
  if isSprinting and humanoid.MoveDirection.Magnitude > 0 then
    local tilt = math.sin(tick() * 8) * 0.3
    camera.CFrame = camera.CFrame * CFrame.Angles(0, 0, math.rad(tilt))
  end
end)

player.CharacterAdded:Connect(function(char)
  character = char
  humanoid = char:WaitForChild("Humanoid")
  isSprinting = false
  humanoid.WalkSpeed = WALK_SPEED
end)`
  },
  {
    keywords: ['round system', 'wave system', 'rounds', 'waves', 'wave spawner', 'enemy waves', 'intermission'],
    category: 'gameplay',
    name: 'Round/Wave System',
    description: 'Intermission timer, spawn enemies in escalating waves, track kills, wave completion triggers next wave, win condition on final wave',
    code: `-- Round/Wave System: intermission, escalating waves, kill tracking, win condition
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local INTERMISSION_TIME: number = 15
local TOTAL_WAVES: number = 10
local BASE_ENEMIES: number = 3
local ENEMIES_PER_WAVE: number = 2 -- additional per wave
local ENEMY_HEALTH_SCALE: number = 1.15 -- multiplier per wave

local currentWave: number = 0
local enemiesAlive: number = 0
local gameActive: boolean = false

local spawnPoints: {BasePart} = {}
for _, part in workspace:GetDescendants() do
  if part:IsA("BasePart") and part.Name == "EnemySpawn" then
    table.insert(spawnPoints, part)
  end
end

local statusValue = Instance.new("StringValue")
statusValue.Name = "GameStatus"
statusValue.Value = "Waiting..."
statusValue.Parent = ReplicatedStorage

local function spawnEnemy(spawnPoint: BasePart, healthMultiplier: number)
  local template = ReplicatedStorage:FindFirstChild("EnemyTemplate")
  if not template then
    -- Create basic enemy if no template
    local enemy = Instance.new("Model")
    enemy.Name = "Enemy"
    local torso = Instance.new("Part")
    torso.Name = "HumanoidRootPart"
    torso.Size = Vector3.new(2, 2, 1)
    torso.Color = Color3.fromRGB(200, 50, 50)
    torso.Material = Enum.Material.Metal
    torso.Position = spawnPoint.Position + Vector3.new(0, 3, 0)
    torso.Anchored = false
    torso.Parent = enemy
    enemy.PrimaryPart = torso
    local head = Instance.new("Part")
    head.Name = "Head"
    head.Size = Vector3.new(1.5, 1.5, 1.5)
    head.Shape = Enum.PartType.Ball
    head.Color = Color3.fromRGB(200, 50, 50)
    head.Material = Enum.Material.Metal
    head.Position = torso.Position + Vector3.new(0, 1.75, 0)
    head.Anchored = false
    head.Parent = enemy
    local humanoid = Instance.new("Humanoid")
    humanoid.MaxHealth = 100 * healthMultiplier
    humanoid.Health = 100 * healthMultiplier
    humanoid.Parent = enemy
    enemy.Parent = workspace:FindFirstChild("Enemies") or workspace
    humanoid.Died:Connect(function()
      enemiesAlive -= 1
      task.wait(2)
      enemy:Destroy()
    end)
    return
  end
  local enemy = template:Clone()
  enemy:PivotTo(spawnPoint.CFrame * CFrame.new(0, 3, 0))
  local hum = enemy:FindFirstChildOfClass("Humanoid")
  if hum then
    hum.MaxHealth = hum.MaxHealth * healthMultiplier
    hum.Health = hum.MaxHealth
    hum.Died:Connect(function()
      enemiesAlive -= 1
      task.wait(2)
      enemy:Destroy()
    end)
  end
  enemy.Parent = workspace:FindFirstChild("Enemies") or workspace
end

local function startWave(waveNum: number)
  currentWave = waveNum
  local enemyCount = BASE_ENEMIES + (waveNum - 1) * ENEMIES_PER_WAVE
  local healthMult = ENEMY_HEALTH_SCALE ^ (waveNum - 1)
  enemiesAlive = enemyCount
  statusValue.Value = "Wave " .. waveNum .. "/" .. TOTAL_WAVES .. " - " .. enemyCount .. " enemies!"

  for i = 1, enemyCount do
    local sp = spawnPoints[math.random(1, #spawnPoints)]
    if sp then
      spawnEnemy(sp, healthMult)
      task.wait(0.5) -- stagger spawns
    end
  end

  -- Wait for all enemies killed
  while enemiesAlive > 0 do
    statusValue.Value = "Wave " .. waveNum .. " - " .. enemiesAlive .. " remaining"
    task.wait(1)
  end

  statusValue.Value = "Wave " .. waveNum .. " Complete!"
  task.wait(3)
end

local function startGame()
  gameActive = true
  for wave = 1, TOTAL_WAVES do
    -- Intermission
    for t = INTERMISSION_TIME, 1, -1 do
      statusValue.Value = "Wave " .. wave .. " starts in " .. t .. "s"
      task.wait(1)
    end
    startWave(wave)
  end
  statusValue.Value = "YOU WIN! All waves cleared!"
  gameActive = false
end

-- Start when enough players
task.spawn(function()
  while true do
    if #Players:GetPlayers() >= 1 and not gameActive then
      startGame()
    end
    task.wait(5)
  end
end)`
  },
  {
    keywords: ['inventory', 'inventory system', 'inventory gui', 'backpack system', 'item inventory', 'inventory ui'],
    category: 'gameplay',
    name: 'Inventory System',
    description: 'Table-based per-player inventory with add/remove functions, ScreenGui grid display, and RemoteEvent sync between client and server',
    code: `-- Inventory System: per-player table inventory, GUI display, RemoteEvent sync
-- SERVER SCRIPT (ServerScriptService):
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local inventoryEvent = Instance.new("RemoteEvent")
inventoryEvent.Name = "InventoryEvent"
inventoryEvent.Parent = ReplicatedStorage

local inventories: {[number]: {{name: string, quantity: number, icon: string}}} = {}

local function getInventory(userId: number): {{name: string, quantity: number, icon: string}}
  if not inventories[userId] then
    inventories[userId] = {}
  end
  return inventories[userId]
end

local function addItem(userId: number, itemName: string, qty: number?, icon: string?)
  local inv = getInventory(userId)
  for _, entry in inv do
    if entry.name == itemName then
      entry.quantity += (qty or 1)
      return
    end
  end
  table.insert(inv, {name = itemName, quantity = qty or 1, icon = icon or ""})
end

local function removeItem(userId: number, itemName: string, qty: number?): boolean
  local inv = getInventory(userId)
  for i, entry in inv do
    if entry.name == itemName then
      entry.quantity -= (qty or 1)
      if entry.quantity <= 0 then
        table.remove(inv, i)
      end
      return true
    end
  end
  return false
end

local function syncInventory(player: Player)
  inventoryEvent:FireClient(player, "sync", getInventory(player.UserId))
end

inventoryEvent.OnServerEvent:Connect(function(player: Player, action: string, ...)
  if action == "requestSync" then
    syncInventory(player)
  elseif action == "drop" then
    local itemName: string = ...
    if removeItem(player.UserId, itemName) then
      syncInventory(player)
    end
  end
end)

Players.PlayerAdded:Connect(function(player: Player)
  -- Give starter items
  addItem(player.UserId, "Wooden Sword", 1, "rbxassetid://6023426926")
  addItem(player.UserId, "Health Potion", 3, "rbxassetid://6023426926")
  addItem(player.UserId, "Gold Coin", 10, "rbxassetid://6023426926")
  task.wait(2)
  syncInventory(player)
end)

Players.PlayerRemoving:Connect(function(player: Player)
  inventories[player.UserId] = nil
end)

-- CLIENT SCRIPT (StarterPlayerScripts):
--[[
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")
local UserInputService = game:GetService("UserInputService")
local player = Players.LocalPlayer
local inventoryEvent = ReplicatedStorage:WaitForChild("InventoryEvent")

local gui = Instance.new("ScreenGui")
gui.Name = "InventoryGui"
gui.ResetOnSpawn = false
gui.Parent = player.PlayerGui

local mainFrame = Instance.new("Frame")
mainFrame.Size = UDim2.new(0.4, 0, 0.5, 0)
mainFrame.Position = UDim2.new(0.3, 0, 0.25, 0)
mainFrame.BackgroundColor3 = Color3.fromRGB(20, 20, 28)
mainFrame.BorderSizePixel = 0
mainFrame.Visible = false
mainFrame.Parent = gui
Instance.new("UICorner", mainFrame).CornerRadius = UDim.new(0, 10)

local title = Instance.new("TextLabel")
title.Size = UDim2.new(1, 0, 0.1, 0)
title.BackgroundTransparency = 1
title.Text = "INVENTORY"
title.TextColor3 = Color3.fromRGB(255, 255, 255)
title.TextScaled = true
title.Font = Enum.Font.GothamBold
title.Parent = mainFrame

local scrollFrame = Instance.new("ScrollingFrame")
scrollFrame.Size = UDim2.new(0.9, 0, 0.85, 0)
scrollFrame.Position = UDim2.new(0.05, 0, 0.12, 0)
scrollFrame.BackgroundTransparency = 1
scrollFrame.ScrollBarThickness = 4
scrollFrame.BorderSizePixel = 0
scrollFrame.AutomaticCanvasSize = Enum.AutomaticSize.Y
scrollFrame.Parent = mainFrame
local grid = Instance.new("UIGridLayout")
grid.CellSize = UDim2.new(0.22, -4, 0, 70)
grid.CellPadding = UDim2.new(0, 4, 0, 4)
grid.Parent = scrollFrame

local function renderInventory(items)
  for _, child in scrollFrame:GetChildren() do
    if child:IsA("Frame") then child:Destroy() end
  end
  for _, item in items do
    local slot = Instance.new("Frame")
    slot.BackgroundColor3 = Color3.fromRGB(35, 35, 50)
    slot.BorderSizePixel = 0
    slot.Parent = scrollFrame
    Instance.new("UICorner", slot).CornerRadius = UDim.new(0, 6)
    local nameL = Instance.new("TextLabel")
    nameL.Size = UDim2.new(1, 0, 0.5, 0)
    nameL.Position = UDim2.new(0, 0, 0.3, 0)
    nameL.BackgroundTransparency = 1
    nameL.Text = item.name
    nameL.TextColor3 = Color3.fromRGB(220, 220, 220)
    nameL.TextScaled = true
    nameL.Font = Enum.Font.Gotham
    nameL.Parent = slot
    local qtyL = Instance.new("TextLabel")
    qtyL.Size = UDim2.new(0.3, 0, 0.25, 0)
    qtyL.Position = UDim2.new(0.65, 0, 0.02, 0)
    qtyL.BackgroundColor3 = Color3.fromRGB(60, 60, 80)
    qtyL.Text = "x" .. item.quantity
    qtyL.TextColor3 = Color3.fromRGB(255, 255, 100)
    qtyL.TextScaled = true
    qtyL.Font = Enum.Font.GothamBold
    qtyL.BorderSizePixel = 0
    qtyL.Parent = slot
    Instance.new("UICorner", qtyL).CornerRadius = UDim.new(0, 3)
  end
end

inventoryEvent.OnClientEvent:Connect(function(action, data)
  if action == "sync" then renderInventory(data) end
end)

UserInputService.InputBegan:Connect(function(input, processed)
  if processed then return end
  if input.KeyCode == Enum.KeyCode.I then
    mainFrame.Visible = not mainFrame.Visible
    if mainFrame.Visible then inventoryEvent:FireServer("requestSync") end
  end
end)
]]`
  },
  {
    keywords: ['daily reward', 'daily login', 'login reward', 'streak', 'daily bonus', 'claim reward'],
    category: 'gameplay',
    name: 'Daily Reward System',
    description: 'DataStore-backed daily rewards with streak counter, escalating reward table, and ScreenGui claim popup',
    code: `-- Daily Reward System: DataStore streak tracking, escalating rewards, claim GUI
local Players = game:GetService("Players")
local DataStoreService = game:GetService("DataStoreService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local rewardEvent = Instance.new("RemoteEvent")
rewardEvent.Name = "DailyRewardEvent"
rewardEvent.Parent = ReplicatedStorage

local REWARDS: {number} = {50, 75, 100, 150, 200, 300, 500} -- day 1-7
local SECONDS_IN_DAY: number = 86400

local function getRewardStore()
  local ok, store = pcall(function()
    return DataStoreService:GetDataStore("DailyRewards_v1")
  end)
  return ok and store or nil
end

Players.PlayerAdded:Connect(function(player: Player)
  local store = getRewardStore()
  if not store then return end

  local key = "player_" .. player.UserId
  local ok, data = pcall(function()
    return store:GetAsync(key)
  end)
  if not ok then data = nil end

  local rewardData = data or {lastClaim = 0, streak = 0}
  local now = os.time()
  local timeSince = now - (rewardData.lastClaim or 0)
  local canClaim = timeSince >= SECONDS_IN_DAY

  -- Reset streak if missed a day (over 48h)
  if timeSince > SECONDS_IN_DAY * 2 then
    rewardData.streak = 0
  end

  if canClaim then
    local day = math.min(rewardData.streak + 1, #REWARDS)
    local reward = REWARDS[day]
    rewardEvent:FireClient(player, "show", {
      canClaim = true,
      streak = rewardData.streak,
      reward = reward,
      day = day,
      maxDay = #REWARDS,
    })
  else
    local timeLeft = SECONDS_IN_DAY - timeSince
    rewardEvent:FireClient(player, "show", {
      canClaim = false,
      streak = rewardData.streak,
      reward = 0,
      timeLeft = timeLeft,
    })
  end

  rewardEvent.OnServerEvent:Connect(function(claimPlayer: Player, action: string)
    if claimPlayer ~= player or action ~= "claim" then return end
    local nowClaim = os.time()
    local timeSinceClaim = nowClaim - (rewardData.lastClaim or 0)
    if timeSinceClaim < SECONDS_IN_DAY then return end -- Already claimed

    if timeSinceClaim > SECONDS_IN_DAY * 2 then
      rewardData.streak = 0
    end

    rewardData.streak += 1
    rewardData.lastClaim = nowClaim

    local day = math.min(rewardData.streak, #REWARDS)
    local reward = REWARDS[day]

    -- Give coins
    local coins = claimPlayer:FindFirstChild("leaderstats") and claimPlayer.leaderstats:FindFirstChild("Coins")
    if coins then coins.Value += reward end

    pcall(function()
      store:SetAsync(key, rewardData)
    end)

    rewardEvent:FireClient(claimPlayer, "claimed", {reward = reward, streak = rewardData.streak})
  end)
end)

-- CLIENT SCRIPT (StarterPlayerScripts):
--[[
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")
local player = Players.LocalPlayer
local rewardEvent = ReplicatedStorage:WaitForChild("DailyRewardEvent")

local gui = Instance.new("ScreenGui")
gui.Name = "DailyRewardGui"
gui.ResetOnSpawn = false
gui.Parent = player.PlayerGui

local popup = Instance.new("Frame")
popup.Size = UDim2.new(0.3, 0, 0.35, 0)
popup.Position = UDim2.new(0.35, 0, 0.325, 0)
popup.BackgroundColor3 = Color3.fromRGB(20, 20, 30)
popup.BorderSizePixel = 0
popup.Visible = false
popup.Parent = gui
Instance.new("UICorner", popup).CornerRadius = UDim.new(0, 12)
local stroke = Instance.new("UIStroke", popup)
stroke.Color = Color3.fromRGB(255, 200, 50)
stroke.Thickness = 2

local titleL = Instance.new("TextLabel")
titleL.Size = UDim2.new(1, 0, 0.2, 0)
titleL.BackgroundTransparency = 1
titleL.Text = "DAILY REWARD"
titleL.TextColor3 = Color3.fromRGB(255, 215, 0)
titleL.TextScaled = true
titleL.Font = Enum.Font.GothamBold
titleL.Parent = popup

local rewardL = Instance.new("TextLabel")
rewardL.Size = UDim2.new(1, 0, 0.25, 0)
rewardL.Position = UDim2.new(0, 0, 0.22, 0)
rewardL.BackgroundTransparency = 1
rewardL.TextColor3 = Color3.fromRGB(255, 255, 255)
rewardL.TextScaled = true
rewardL.Font = Enum.Font.GothamBold
rewardL.Parent = popup

local streakL = Instance.new("TextLabel")
streakL.Size = UDim2.new(1, 0, 0.12, 0)
streakL.Position = UDim2.new(0, 0, 0.48, 0)
streakL.BackgroundTransparency = 1
streakL.TextColor3 = Color3.fromRGB(180, 180, 180)
streakL.TextScaled = true
streakL.Font = Enum.Font.Gotham
streakL.Parent = popup

local claimBtn = Instance.new("TextButton")
claimBtn.Size = UDim2.new(0.5, 0, 0.15, 0)
claimBtn.Position = UDim2.new(0.25, 0, 0.7, 0)
claimBtn.BackgroundColor3 = Color3.fromRGB(50, 180, 80)
claimBtn.Text = "CLAIM"
claimBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
claimBtn.TextScaled = true
claimBtn.Font = Enum.Font.GothamBold
claimBtn.BorderSizePixel = 0
claimBtn.Parent = popup
Instance.new("UICorner", claimBtn).CornerRadius = UDim.new(0, 8)

local closeBtn = Instance.new("TextButton")
closeBtn.Size = UDim2.new(0.08, 0, 0.12, 0)
closeBtn.Position = UDim2.new(0.9, 0, 0.02, 0)
closeBtn.BackgroundTransparency = 1
closeBtn.Text = "X"
closeBtn.TextColor3 = Color3.fromRGB(200, 200, 200)
closeBtn.TextScaled = true
closeBtn.Font = Enum.Font.GothamBold
closeBtn.Parent = popup
closeBtn.MouseButton1Click:Connect(function() popup.Visible = false end)

rewardEvent.OnClientEvent:Connect(function(action, data)
  if action == "show" then
    popup.Visible = true
    popup.Position = UDim2.new(0.35, 0, 1.5, 0)
    TweenService:Create(popup, TweenInfo.new(0.5, Enum.EasingStyle.Back), {Position = UDim2.new(0.35, 0, 0.325, 0)}):Play()
    if data.canClaim then
      rewardL.Text = "+" .. data.reward .. " Coins!"
      streakL.Text = "Day " .. data.day .. "/" .. data.maxDay .. " | Streak: " .. data.streak
      claimBtn.Visible = true
      claimBtn.Text = "CLAIM"
      claimBtn.BackgroundColor3 = Color3.fromRGB(50, 180, 80)
    else
      local h = math.floor(data.timeLeft / 3600)
      local m = math.floor((data.timeLeft % 3600) / 60)
      rewardL.Text = "Come back in " .. h .. "h " .. m .. "m"
      streakL.Text = "Current streak: " .. data.streak
      claimBtn.Visible = false
    end
  elseif action == "claimed" then
    rewardL.Text = "Claimed +" .. data.reward .. " Coins!"
    streakL.Text = "Streak: " .. data.streak
    claimBtn.Text = "CLAIMED!"
    claimBtn.BackgroundColor3 = Color3.fromRGB(80, 80, 80)
    claimBtn.Visible = true
  end
end)

claimBtn.MouseButton1Click:Connect(function()
  rewardEvent:FireServer("claim")
end)
]]`
  },
  {
    keywords: ['voting', 'map vote', 'map selection', 'vote system', 'map picker', 'vote map'],
    category: 'gameplay',
    name: 'Voting/Map Selection',
    description: 'ScreenGui with map options, players click to vote, timer countdown, most votes wins, teleport to selected map',
    code: `-- Voting/Map Selection: 3 map options, vote, countdown, teleport winner
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")
local TeleportService = game:GetService("TeleportService")

local voteEvent = Instance.new("RemoteEvent")
voteEvent.Name = "MapVoteEvent"
voteEvent.Parent = ReplicatedStorage

local MAPS: {{name: string, placeId: number, image: string, color: Color3}} = {
  {name = "Desert Arena", placeId = 0, image = "", color = Color3.fromRGB(220, 180, 80)},
  {name = "Snow Mountain", placeId = 0, image = "", color = Color3.fromRGB(200, 220, 255)},
  {name = "Lava Island", placeId = 0, image = "", color = Color3.fromRGB(255, 80, 30)},
}

local VOTE_TIME: number = 20
local votes: {[number]: number} = {} -- playerUserId -> mapIndex
local voteCounts: {number} = {0, 0, 0}

local function getWinner(): number
  local maxVotes = 0
  local winner = 1
  for i, count in voteCounts do
    if count > maxVotes then
      maxVotes = count
      winner = i
    end
  end
  return winner
end

local function broadcastVotes()
  for _, player in Players:GetPlayers() do
    voteEvent:FireClient(player, "updateVotes", voteCounts)
  end
end

voteEvent.OnServerEvent:Connect(function(player: Player, action: string, mapIndex: number?)
  if action == "vote" and mapIndex and mapIndex >= 1 and mapIndex <= #MAPS then
    -- Remove previous vote
    if votes[player.UserId] then
      voteCounts[votes[player.UserId]] -= 1
    end
    votes[player.UserId] = mapIndex
    voteCounts[mapIndex] += 1
    broadcastVotes()
  end
end)

local function startVoting()
  -- Reset
  votes = {}
  voteCounts = {0, 0, 0}

  -- Show UI to all players
  for _, player in Players:GetPlayers() do
    voteEvent:FireClient(player, "startVote", {maps = MAPS, time = VOTE_TIME})
  end

  -- Countdown
  for t = VOTE_TIME, 1, -1 do
    for _, player in Players:GetPlayers() do
      voteEvent:FireClient(player, "timer", t)
    end
    task.wait(1)
  end

  -- Determine winner
  local winner = getWinner()
  for _, player in Players:GetPlayers() do
    voteEvent:FireClient(player, "result", {winner = winner, name = MAPS[winner].name})
  end

  task.wait(3)

  -- Teleport if placeId is set
  local winnerMap = MAPS[winner]
  if winnerMap.placeId > 0 then
    local playerList = Players:GetPlayers()
    pcall(function()
      TeleportService:TeleportAsync(winnerMap.placeId, playerList)
    end)
  end
end

-- CLIENT SCRIPT (StarterPlayerScripts):
--[[
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")
local player = Players.LocalPlayer
local voteEvent = ReplicatedStorage:WaitForChild("MapVoteEvent")

local gui = Instance.new("ScreenGui")
gui.Name = "VoteGui"
gui.ResetOnSpawn = false
gui.Parent = player.PlayerGui

local mainFrame = Instance.new("Frame")
mainFrame.Size = UDim2.new(0.6, 0, 0.3, 0)
mainFrame.Position = UDim2.new(0.2, 0, 0.65, 0)
mainFrame.BackgroundColor3 = Color3.fromRGB(20, 20, 25)
mainFrame.BorderSizePixel = 0
mainFrame.Visible = false
mainFrame.Parent = gui
Instance.new("UICorner", mainFrame).CornerRadius = UDim.new(0, 10)

local timerLabel = Instance.new("TextLabel")
timerLabel.Size = UDim2.new(1, 0, 0.2, 0)
timerLabel.BackgroundTransparency = 1
timerLabel.Text = "VOTE FOR MAP"
timerLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
timerLabel.TextScaled = true
timerLabel.Font = Enum.Font.GothamBold
timerLabel.Parent = mainFrame

local mapButtons = {}

voteEvent.OnClientEvent:Connect(function(action, data)
  if action == "startVote" then
    mainFrame.Visible = true
    for _, btn in mapButtons do btn:Destroy() end
    mapButtons = {}
    for i, map in data.maps do
      local card = Instance.new("TextButton")
      card.Size = UDim2.new(0.28, 0, 0.7, 0)
      card.Position = UDim2.new(0.04 + (i-1) * 0.33, 0, 0.25, 0)
      card.BackgroundColor3 = map.color
      card.Text = map.name .. "\n0 votes"
      card.TextColor3 = Color3.fromRGB(255, 255, 255)
      card.TextScaled = true
      card.Font = Enum.Font.GothamBold
      card.BorderSizePixel = 0
      card.Parent = mainFrame
      Instance.new("UICorner", card).CornerRadius = UDim.new(0, 8)
      card.MouseButton1Click:Connect(function()
        voteEvent:FireServer("vote", i)
      end)
      table.insert(mapButtons, card)
    end
  elseif action == "updateVotes" then
    for i, btn in mapButtons do
      local lines = string.split(btn.Text, "\n")
      btn.Text = lines[1] .. "\n" .. data[i] .. " votes"
    end
  elseif action == "timer" then
    timerLabel.Text = "VOTE FOR MAP - " .. data .. "s"
  elseif action == "result" then
    timerLabel.Text = data.name .. " WINS!"
    task.wait(3)
    mainFrame.Visible = false
  end
end)
]]`
  },
  {
    keywords: ['first person', 'first person camera', 'fps camera', 'camera lock', 'first person lock'],
    category: 'gameplay',
    name: 'First Person Camera Lock',
    description: 'Camera.CameraType Scriptable, CFrame follows Head, mouse controls look direction, optional arms visible',
    code: `-- First Person Camera Lock: head-locked camera, mouse look, visible arms
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local UserInputService = game:GetService("UserInputService")
local player = Players.LocalPlayer
local camera = workspace.CurrentCamera
local mouse = player:GetMouse()

local SENSITIVITY: number = 0.003
local isFirstPerson: boolean = true
local pitch: number = 0
local yaw: number = 0

local character = player.Character or player.CharacterAdded:Wait()
local head = character:WaitForChild("Head")
local humanoidRootPart = character:WaitForChild("HumanoidRootPart")
local humanoid = character:WaitForChild("Humanoid")

local function enableFirstPerson()
  isFirstPerson = true
  camera.CameraType = Enum.CameraType.Scriptable
  UserInputService.MouseBehavior = Enum.MouseBehavior.LockCenter

  -- Hide body parts except arms
  for _, part in character:GetDescendants() do
    if part:IsA("BasePart") and part.Name ~= "Head" then
      if part.Name == "Left Arm" or part.Name == "Right Arm"
        or part.Name == "LeftHand" or part.Name == "RightHand"
        or part.Name == "LeftLowerArm" or part.Name == "RightLowerArm"
        or part.Name == "LeftUpperArm" or part.Name == "RightUpperArm" then
        part.LocalTransparencyModifier = 0
      else
        part.LocalTransparencyModifier = 1
      end
    end
  end
  head.LocalTransparencyModifier = 1
end

local function disableFirstPerson()
  isFirstPerson = false
  camera.CameraType = Enum.CameraType.Custom
  UserInputService.MouseBehavior = Enum.MouseBehavior.Default
  for _, part in character:GetDescendants() do
    if part:IsA("BasePart") then
      part.LocalTransparencyModifier = 0
    end
  end
end

-- Mouse delta for looking
UserInputService.InputChanged:Connect(function(input)
  if not isFirstPerson then return end
  if input.UserInputType == Enum.UserInputType.MouseMovement then
    yaw -= input.Delta.X * SENSITIVITY
    pitch = math.clamp(pitch - input.Delta.Y * SENSITIVITY, -math.rad(80), math.rad(80))
  end
end)

RunService.RenderStepped:Connect(function()
  if not isFirstPerson or not head or not head.Parent then return end
  local headPos = head.Position + Vector3.new(0, 0.2, 0)
  local lookCF = CFrame.new(headPos) * CFrame.Angles(0, yaw, 0) * CFrame.Angles(pitch, 0, 0)
  camera.CFrame = lookCF
  -- Rotate character body to match yaw
  humanoidRootPart.CFrame = CFrame.new(humanoidRootPart.Position) * CFrame.Angles(0, yaw, 0)
end)

-- Toggle with F5
UserInputService.InputBegan:Connect(function(input, processed)
  if processed then return end
  if input.KeyCode == Enum.KeyCode.F5 then
    if isFirstPerson then disableFirstPerson() else enableFirstPerson() end
  end
end)

enableFirstPerson()

player.CharacterAdded:Connect(function(char)
  character = char
  head = char:WaitForChild("Head")
  humanoidRootPart = char:WaitForChild("HumanoidRootPart")
  humanoid = char:WaitForChild("Humanoid")
  pitch = 0
  yaw = 0
  if isFirstPerson then enableFirstPerson() end
end)`
  },
  {
    keywords: ['ragdoll', 'ragdoll death', 'physics death', 'ragdoll on death', 'limp body', 'ragdoll system'],
    category: 'gameplay',
    name: 'Ragdoll on Death',
    description: 'Humanoid.Died replaces Motor6D joints with BallSocketConstraints, enables physics ragdoll on all limbs',
    code: `-- Ragdoll on Death: replace Motor6D with BallSocketConstraint on death
local Players = game:GetService("Players")

local function setupRagdoll(character: Model)
  local humanoid = character:FindFirstChildOfClass("Humanoid")
  if not humanoid then return end

  humanoid.BreakJointsOnDeath = false

  humanoid.Died:Connect(function()
    -- Disable animator
    local animator = humanoid:FindFirstChildOfClass("Animator")
    if animator then animator:Destroy() end

    -- Convert Motor6D to BallSocket
    for _, joint in character:GetDescendants() do
      if joint:IsA("Motor6D") then
        local part0 = joint.Part0
        local part1 = joint.Part1
        if part0 and part1 then
          -- Create attachment on part0
          local att0 = Instance.new("Attachment")
          att0.CFrame = joint.C0
          att0.Parent = part0

          -- Create attachment on part1
          local att1 = Instance.new("Attachment")
          att1.CFrame = joint.C1
          att1.Parent = part1

          -- Create BallSocketConstraint
          local ballSocket = Instance.new("BallSocketConstraint")
          ballSocket.Attachment0 = att0
          ballSocket.Attachment1 = att1
          ballSocket.LimitsEnabled = true
          ballSocket.TwistLimitsEnabled = true
          ballSocket.UpperAngle = 90
          ballSocket.TwistLowerAngle = -45
          ballSocket.TwistUpperAngle = 45
          ballSocket.Parent = part0

          -- Disable the motor
          joint.Enabled = false
        end
      end
    end

    -- Unanchor all parts and enable physics
    for _, part in character:GetDescendants() do
      if part:IsA("BasePart") then
        part.CanCollide = true
        part.Anchored = false
      end
    end

    -- Apply slight upward impulse for dramatic effect
    local rootPart = character:FindFirstChild("HumanoidRootPart")
    if rootPart then
      rootPart.CanCollide = false -- root doesn't collide
      rootPart:ApplyImpulse(Vector3.new(
        math.random(-50, 50),
        math.random(100, 200),
        math.random(-50, 50)
      ))
    end

    -- Cleanup after 10 seconds
    task.delay(10, function()
      if character and character.Parent then
        character:Destroy()
      end
    end)
  end)
end

-- Apply to all players
Players.PlayerAdded:Connect(function(player: Player)
  player.CharacterAdded:Connect(function(char)
    task.wait(0.1)
    setupRagdoll(char)
  end)
  if player.Character then setupRagdoll(player.Character) end
end)

-- Apply to existing players
for _, player in Players:GetPlayers() do
  if player.Character then setupRagdoll(player.Character) end
  player.CharacterAdded:Connect(function(char)
    task.wait(0.1)
    setupRagdoll(char)
  end)
end`
  },
  {
    keywords: ['trading', 'trade system', 'player trade', 'trading gui', 'trade items', 'trade menu'],
    category: 'gameplay',
    name: 'Trading System',
    description: 'Two-player ProximityPrompt trade with ScreenGui showing both inventories, confirm/cancel flow, RemoteEvent validation',
    code: `-- Trading System: ProximityPrompt to open trade, dual inventory display, confirm/cancel
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local tradeEvent = Instance.new("RemoteEvent")
tradeEvent.Name = "TradeEvent"
tradeEvent.Parent = ReplicatedStorage

-- Server-side trade state
type TradeSession = {
  player1: Player,
  player2: Player,
  offer1: {string},
  offer2: {string},
  confirmed1: boolean,
  confirmed2: boolean,
}

local activeTrades: {[number]: TradeSession} = {} -- indexed by player1 userId
local tradeRequests: {[number]: number} = {} -- requester userId -> target userId

-- Add ProximityPrompt to all player characters
Players.PlayerAdded:Connect(function(player: Player)
  player.CharacterAdded:Connect(function(char)
    task.wait(1)
    local rootPart = char:FindFirstChild("HumanoidRootPart")
    if rootPart then
      local prompt = Instance.new("ProximityPrompt")
      prompt.ActionText = "Trade"
      prompt.ObjectText = player.Name
      prompt.MaxActivationDistance = 8
      prompt.RequiresLineOfSight = false
      prompt.Parent = rootPart

      prompt.Triggered:Connect(function(otherPlayer: Player)
        if otherPlayer == player then return end
        tradeEvent:FireClient(player, "tradeRequest", otherPlayer.Name)
        tradeRequests[otherPlayer.UserId] = player.UserId
        tradeEvent:FireClient(otherPlayer, "incomingRequest", player.Name)
      end)
    end
  end)
end)

tradeEvent.OnServerEvent:Connect(function(player: Player, action: string, ...)
  if action == "acceptTrade" then
    local requesterUserId = tradeRequests[player.UserId]
    if not requesterUserId then return end
    local requester = Players:GetPlayerByUserId(requesterUserId)
    if not requester then return end

    local session: TradeSession = {
      player1 = requester,
      player2 = player,
      offer1 = {},
      offer2 = {},
      confirmed1 = false,
      confirmed2 = false,
    }
    activeTrades[requester.UserId] = session

    tradeEvent:FireClient(requester, "openTrade", player.Name)
    tradeEvent:FireClient(player, "openTrade", requester.Name)
    tradeRequests[player.UserId] = nil

  elseif action == "declineTrade" then
    local requesterUserId = tradeRequests[player.UserId]
    if requesterUserId then
      local requester = Players:GetPlayerByUserId(requesterUserId)
      if requester then
        tradeEvent:FireClient(requester, "declined", player.Name)
      end
      tradeRequests[player.UserId] = nil
    end

  elseif action == "addItem" then
    local itemName: string = ...
    for _, session in activeTrades do
      if session.player1 == player then
        table.insert(session.offer1, itemName)
        tradeEvent:FireClient(session.player2, "updateOffer", "them", session.offer1)
        break
      elseif session.player2 == player then
        table.insert(session.offer2, itemName)
        tradeEvent:FireClient(session.player1, "updateOffer", "them", session.offer2)
        break
      end
    end

  elseif action == "confirm" then
    for uid, session in activeTrades do
      if session.player1 == player then
        session.confirmed1 = true
      elseif session.player2 == player then
        session.confirmed2 = true
      end
      if session.confirmed1 and session.confirmed2 then
        -- Execute trade (swap items in inventories)
        tradeEvent:FireClient(session.player1, "tradeComplete", session.offer2)
        tradeEvent:FireClient(session.player2, "tradeComplete", session.offer1)
        activeTrades[uid] = nil
      end
    end

  elseif action == "cancel" then
    for uid, session in activeTrades do
      if session.player1 == player or session.player2 == player then
        tradeEvent:FireClient(session.player1, "tradeCancelled")
        tradeEvent:FireClient(session.player2, "tradeCancelled")
        activeTrades[uid] = nil
        break
      end
    end
  end
end)

Players.PlayerRemoving:Connect(function(player: Player)
  -- Cancel any active trade
  for uid, session in activeTrades do
    if session.player1 == player or session.player2 == player then
      local other = session.player1 == player and session.player2 or session.player1
      tradeEvent:FireClient(other, "tradeCancelled")
      activeTrades[uid] = nil
    end
  end
  tradeRequests[player.UserId] = nil
end)`
  },
  {
    keywords: ['pet', 'pet follow', 'pet system', 'companion', 'pet equip', 'follow pet'],
    category: 'gameplay',
    name: 'Pet Follow System',
    description: 'Small Model follows player at offset using CFrame lerp, equip/unequip toggle, orbit idle animation',
    code: `-- Pet Follow System: model follows player, equip/unequip, orbit idle
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local TweenService = game:GetService("TweenService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local PET_OFFSET: Vector3 = Vector3.new(3, 2, -1)
local FOLLOW_SPEED: number = 0.15
local ORBIT_SPEED: number = 2
local ORBIT_RADIUS: number = 3

local function createDefaultPet(): Model
  local pet = Instance.new("Model")
  pet.Name = "Pet"
  local body = Instance.new("Part")
  body.Name = "Body"
  body.Size = Vector3.new(1.5, 1.5, 1.5)
  body.Shape = Enum.PartType.Ball
  body.Color = Color3.fromRGB(255, 200, 80)
  body.Material = Enum.Material.SmoothPlastic
  body.Anchored = true
  body.CanCollide = false
  body.Parent = pet
  pet.PrimaryPart = body

  -- Eyes
  local leftEye = Instance.new("Part")
  leftEye.Size = Vector3.new(0.3, 0.35, 0.15)
  leftEye.Color = Color3.fromRGB(40, 40, 40)
  leftEye.Material = Enum.Material.SmoothPlastic
  leftEye.Anchored = true
  leftEye.CanCollide = false
  leftEye.Parent = pet

  local rightEye = leftEye:Clone()
  rightEye.Parent = pet

  -- Glow
  local glow = Instance.new("PointLight")
  glow.Color = Color3.fromRGB(255, 200, 80)
  glow.Brightness = 0.5
  glow.Range = 6
  glow.Parent = body

  -- Sparkle trail
  local particles = Instance.new("ParticleEmitter")
  particles.Rate = 8
  particles.Speed = NumberRange.new(0.5, 1)
  particles.Lifetime = NumberRange.new(0.5, 1)
  particles.Size = NumberSequence.new({NumberSequenceKeypoint.new(0, 0.2), NumberSequenceKeypoint.new(1, 0)})
  particles.Color = ColorSequence.new(Color3.fromRGB(255, 220, 100))
  particles.Transparency = NumberSequence.new({NumberSequenceKeypoint.new(0, 0.3), NumberSequenceKeypoint.new(1, 1)})
  particles.LightEmission = 1
  particles.Parent = body

  return pet
end

local function equipPet(player: Player, petModel: Model?)
  local character = player.Character
  if not character then return end
  local rootPart = character:FindFirstChild("HumanoidRootPart")
  if not rootPart then return end

  local pet = petModel or createDefaultPet()
  pet.Parent = character
  local body = pet.PrimaryPart

  local equipped = true
  local conn: RBXScriptConnection

  conn = RunService.Heartbeat:Connect(function(dt: number)
    if not equipped or not rootPart or not rootPart.Parent then
      conn:Disconnect()
      return
    end

    local t = tick()
    local orbitX = math.cos(t * ORBIT_SPEED) * ORBIT_RADIUS
    local orbitZ = math.sin(t * ORBIT_SPEED) * ORBIT_RADIUS
    local bobY = math.sin(t * 3) * 0.3

    local targetPos = rootPart.Position + Vector3.new(orbitX, PET_OFFSET.Y + bobY, orbitZ)
    local currentPos = body.Position
    local newPos = currentPos:Lerp(targetPos, FOLLOW_SPEED)

    -- Face movement direction
    local lookDir = (targetPos - currentPos)
    if lookDir.Magnitude > 0.1 then
      local lookCF = CFrame.lookAt(newPos, newPos + lookDir)
      body.CFrame = body.CFrame:Lerp(lookCF, FOLLOW_SPEED)
    else
      body.CFrame = CFrame.new(newPos) * (body.CFrame - body.CFrame.Position)
    end

    -- Update eye positions relative to body
    for _, part in pet:GetChildren() do
      if part:IsA("BasePart") and part ~= body then
        if part.Name == "leftEye" then
          part.CFrame = body.CFrame * CFrame.new(-0.3, 0.15, -0.65)
        elseif part.Name == "rightEye" then
          part.CFrame = body.CFrame * CFrame.new(0.3, 0.15, -0.65)
        end
      end
    end
  end)

  -- Return unequip function
  return function()
    equipped = false
    conn:Disconnect()
    pet:Destroy()
  end
end

-- Auto-equip pet for local player
local player = Players.LocalPlayer
local unequipFn = nil

local function onCharacter(char: Model)
  task.wait(1)
  if unequipFn then unequipFn() end
  unequipFn = equipPet(player)
end

if player.Character then onCharacter(player.Character) end
player.CharacterAdded:Connect(onCharacter)`
  },
  {
    keywords: ['notification', 'toast', 'toast notification', 'popup notification', 'alert system', 'notification queue'],
    category: 'ui',
    name: 'Notification System',
    description: 'ScreenGui toast notifications that slide in from top, auto-dismiss with TweenService, queue system for stacking',
    code: `-- Notification System: toast slide-in from top, auto-dismiss, queue
local Players = game:GetService("Players")
local TweenService = game:GetService("TweenService")
local player = Players.LocalPlayer

local gui = Instance.new("ScreenGui")
gui.Name = "NotificationGui"
gui.ResetOnSpawn = false
gui.DisplayOrder = 100
gui.Parent = player.PlayerGui

local container = Instance.new("Frame")
container.Size = UDim2.new(0.3, 0, 1, 0)
container.Position = UDim2.new(0.69, 0, 0, 0)
container.BackgroundTransparency = 1
container.Parent = gui
local listLayout = Instance.new("UIListLayout")
listLayout.FillDirection = Enum.FillDirection.Vertical
listLayout.Padding = UDim.new(0, 6)
listLayout.VerticalAlignment = Enum.VerticalAlignment.Top
listLayout.SortOrder = Enum.SortOrder.LayoutOrder
listLayout.Parent = container
local padding = Instance.new("UIPadding")
padding.PaddingTop = UDim.new(0, 10)
padding.Parent = container

local notifQueue: {{title: string, message: string, color: Color3, duration: number}} = {}
local activeCount: number = 0
local MAX_VISIBLE: number = 5
local orderCounter: number = 0

local COLORS = {
  info = Color3.fromRGB(60, 130, 255),
  success = Color3.fromRGB(50, 180, 80),
  warning = Color3.fromRGB(255, 180, 30),
  error = Color3.fromRGB(220, 50, 50),
}

local function showNotification(title: string, message: string, notifType: string?, duration: number?)
  local color = COLORS[notifType or "info"] or COLORS.info
  local dur = duration or 4

  orderCounter += 1
  local notif = Instance.new("Frame")
  notif.Size = UDim2.new(1, 0, 0, 70)
  notif.BackgroundColor3 = Color3.fromRGB(25, 25, 35)
  notif.BorderSizePixel = 0
  notif.LayoutOrder = orderCounter
  notif.Parent = container
  Instance.new("UICorner", notif).CornerRadius = UDim.new(0, 8)

  -- Color accent bar
  local accent = Instance.new("Frame")
  accent.Size = UDim2.new(0.01, 0, 0.8, 0)
  accent.Position = UDim2.new(0.02, 0, 0.1, 0)
  accent.BackgroundColor3 = color
  accent.BorderSizePixel = 0
  accent.Parent = notif
  Instance.new("UICorner", accent).CornerRadius = UDim.new(0, 2)

  local titleLabel = Instance.new("TextLabel")
  titleLabel.Size = UDim2.new(0.85, 0, 0.4, 0)
  titleLabel.Position = UDim2.new(0.06, 0, 0.05, 0)
  titleLabel.BackgroundTransparency = 1
  titleLabel.Text = title
  titleLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
  titleLabel.TextScaled = true
  titleLabel.Font = Enum.Font.GothamBold
  titleLabel.TextXAlignment = Enum.TextXAlignment.Left
  titleLabel.Parent = notif

  local msgLabel = Instance.new("TextLabel")
  msgLabel.Size = UDim2.new(0.85, 0, 0.4, 0)
  msgLabel.Position = UDim2.new(0.06, 0, 0.48, 0)
  msgLabel.BackgroundTransparency = 1
  msgLabel.Text = message
  msgLabel.TextColor3 = Color3.fromRGB(180, 180, 190)
  msgLabel.TextScaled = true
  msgLabel.Font = Enum.Font.Gotham
  msgLabel.TextXAlignment = Enum.TextXAlignment.Left
  msgLabel.Parent = notif

  -- Close button
  local closeBtn = Instance.new("TextButton")
  closeBtn.Size = UDim2.new(0, 20, 0, 20)
  closeBtn.Position = UDim2.new(1, -25, 0, 5)
  closeBtn.BackgroundTransparency = 1
  closeBtn.Text = "X"
  closeBtn.TextColor3 = Color3.fromRGB(150, 150, 150)
  closeBtn.TextScaled = true
  closeBtn.Font = Enum.Font.GothamBold
  closeBtn.Parent = notif

  -- Slide in
  notif.Position = UDim2.new(1.1, 0, 0, 0)
  notif.BackgroundTransparency = 0.3
  TweenService:Create(notif, TweenInfo.new(0.3, Enum.EasingStyle.Back, Enum.EasingDirection.Out), {
    BackgroundTransparency = 0
  }):Play()

  activeCount += 1

  local function dismiss()
    TweenService:Create(notif, TweenInfo.new(0.25, Enum.EasingStyle.Quad), {
      BackgroundTransparency = 1
    }):Play()
    -- Fade children
    for _, child in notif:GetDescendants() do
      if child:IsA("TextLabel") or child:IsA("TextButton") then
        TweenService:Create(child, TweenInfo.new(0.25), {TextTransparency = 1}):Play()
      elseif child:IsA("Frame") then
        TweenService:Create(child, TweenInfo.new(0.25), {BackgroundTransparency = 1}):Play()
      end
    end
    task.wait(0.3)
    notif:Destroy()
    activeCount -= 1
  end

  closeBtn.MouseButton1Click:Connect(dismiss)
  task.delay(dur, dismiss)
end

-- Public API: call showNotification from other scripts
-- Examples:
-- showNotification("Level Up!", "You reached level 5!", "success", 5)
-- showNotification("Warning", "Low health!", "warning")
-- showNotification("Error", "Could not save data", "error")
-- showNotification("Quest", "New quest available", "info")

-- Demo notifications
task.spawn(function()
  task.wait(2)
  showNotification("Welcome!", "Press I for inventory", "info", 5)
  task.wait(3)
  showNotification("Achievement", "First Steps - Walk 100 studs", "success")
  task.wait(2)
  showNotification("Tip", "Hold Shift to sprint", "warning")
end)`
  },
  {
    keywords: ['dialogue', 'npc dialogue', 'dialogue system', 'conversation', 'typewriter', 'npc talk', 'dialogue box'],
    category: 'interactive',
    name: 'Dialogue System',
    description: 'ProximityPrompt on NPC, ScreenGui dialogue box with typewriter text effect, choice buttons, branching responses',
    code: `-- Dialogue System: ProximityPrompt NPC, typewriter text, branching choices
local Players = game:GetService("Players")
local TweenService = game:GetService("TweenService")
local player = Players.LocalPlayer

type DialogueNode = {
  speaker: string,
  text: string,
  choices: {{text: string, next: string}}?, -- nil = end of conversation
}

type DialogueTree = {[string]: DialogueNode}

-- Example dialogue tree
local DIALOGUES: {[string]: DialogueTree} = {
  ["QuestGiver"] = {
    start = {
      speaker = "Old Wizard",
      text = "Greetings, adventurer! I have a quest for you. Will you help me find the lost crystal?",
      choices = {
        {text = "I'll help!", next = "accept"},
        {text = "Tell me more first", next = "info"},
        {text = "Not interested", next = "decline"},
      },
    },
    accept = {
      speaker = "Old Wizard",
      text = "Wonderful! The crystal was last seen in the Dark Forest to the east. Be careful, monsters lurk there. Return it to me for a great reward!",
      choices = {
        {text = "I'm on my way!", next = "farewell"},
      },
    },
    info = {
      speaker = "Old Wizard",
      text = "The Crystal of Light keeps our village safe from darkness. Without it, monsters have been attacking more frequently. It's worth 500 gold to retrieve it!",
      choices = {
        {text = "I'll do it!", next = "accept"},
        {text = "Too dangerous", next = "decline"},
      },
    },
    decline = {
      speaker = "Old Wizard",
      text = "A shame... perhaps another brave soul will help. Return if you change your mind.",
      choices = nil,
    },
    farewell = {
      speaker = "Old Wizard",
      text = "May the light guide your path! Return when you have the crystal.",
      choices = nil,
    },
  },
}

local gui = Instance.new("ScreenGui")
gui.Name = "DialogueGui"
gui.ResetOnSpawn = false
gui.DisplayOrder = 50
gui.Parent = player.PlayerGui

local dialogueFrame = Instance.new("Frame")
dialogueFrame.Size = UDim2.new(0.6, 0, 0.25, 0)
dialogueFrame.Position = UDim2.new(0.2, 0, 0.72, 0)
dialogueFrame.BackgroundColor3 = Color3.fromRGB(15, 15, 22)
dialogueFrame.BorderSizePixel = 0
dialogueFrame.Visible = false
dialogueFrame.Parent = gui
Instance.new("UICorner", dialogueFrame).CornerRadius = UDim.new(0, 10)
local stroke = Instance.new("UIStroke", dialogueFrame)
stroke.Color = Color3.fromRGB(60, 60, 80)
stroke.Thickness = 2

local speakerLabel = Instance.new("TextLabel")
speakerLabel.Size = UDim2.new(0.3, 0, 0.2, 0)
speakerLabel.Position = UDim2.new(0.03, 0, 0.05, 0)
speakerLabel.BackgroundColor3 = Color3.fromRGB(60, 50, 100)
speakerLabel.TextColor3 = Color3.fromRGB(255, 220, 100)
speakerLabel.TextScaled = true
speakerLabel.Font = Enum.Font.GothamBold
speakerLabel.BorderSizePixel = 0
speakerLabel.Parent = dialogueFrame
Instance.new("UICorner", speakerLabel).CornerRadius = UDim.new(0, 6)

local textLabel = Instance.new("TextLabel")
textLabel.Size = UDim2.new(0.9, 0, 0.4, 0)
textLabel.Position = UDim2.new(0.05, 0, 0.3, 0)
textLabel.BackgroundTransparency = 1
textLabel.TextColor3 = Color3.fromRGB(220, 220, 230)
textLabel.TextScaled = true
textLabel.Font = Enum.Font.Gotham
textLabel.TextXAlignment = Enum.TextXAlignment.Left
textLabel.TextYAlignment = Enum.TextYAlignment.Top
textLabel.TextWrapped = true
textLabel.Text = ""
textLabel.Parent = dialogueFrame

local choicesFrame = Instance.new("Frame")
choicesFrame.Size = UDim2.new(0.9, 0, 0.25, 0)
choicesFrame.Position = UDim2.new(0.05, 0, 0.72, 0)
choicesFrame.BackgroundTransparency = 1
choicesFrame.Parent = dialogueFrame
local choicesLayout = Instance.new("UIListLayout")
choicesLayout.FillDirection = Enum.FillDirection.Horizontal
choicesLayout.Padding = UDim.new(0, 8)
choicesLayout.Parent = choicesFrame

local isTyping: boolean = false

local function typewriterEffect(label: TextLabel, fullText: string, speed: number?)
  local charDelay = speed or 0.03
  isTyping = true
  label.Text = ""
  for i = 1, #fullText do
    if not isTyping then break end
    label.Text = string.sub(fullText, 1, i)
    task.wait(charDelay)
  end
  label.Text = fullText
  isTyping = false
end

local function clearChoices()
  for _, child in choicesFrame:GetChildren() do
    if child:IsA("TextButton") then child:Destroy() end
  end
end

local inDialogue: boolean = false

local function showNode(tree: DialogueTree, nodeKey: string)
  local node = tree[nodeKey]
  if not node then
    dialogueFrame.Visible = false
    inDialogue = false
    return
  end

  clearChoices()
  speakerLabel.Text = " " .. node.speaker
  typewriterEffect(textLabel, node.text, 0.03)

  if node.choices then
    for _, choice in node.choices do
      local btn = Instance.new("TextButton")
      btn.Size = UDim2.new(1 / #node.choices - 0.02, 0, 1, 0)
      btn.BackgroundColor3 = Color3.fromRGB(40, 40, 60)
      btn.Text = choice.text
      btn.TextColor3 = Color3.fromRGB(200, 200, 220)
      btn.TextScaled = true
      btn.Font = Enum.Font.GothamBold
      btn.BorderSizePixel = 0
      btn.Parent = choicesFrame
      Instance.new("UICorner", btn).CornerRadius = UDim.new(0, 6)

      btn.MouseEnter:Connect(function()
        TweenService:Create(btn, TweenInfo.new(0.15), {BackgroundColor3 = Color3.fromRGB(70, 60, 110)}):Play()
      end)
      btn.MouseLeave:Connect(function()
        TweenService:Create(btn, TweenInfo.new(0.15), {BackgroundColor3 = Color3.fromRGB(40, 40, 60)}):Play()
      end)
      btn.MouseButton1Click:Connect(function()
        isTyping = false
        showNode(tree, choice.next)
      end)
    end
  else
    -- End of dialogue, auto-close
    task.delay(2, function()
      if inDialogue then
        dialogueFrame.Visible = false
        inDialogue = false
      end
    end)
  end
end

local function startDialogue(npcName: string)
  local tree = DIALOGUES[npcName]
  if not tree then return end
  inDialogue = true
  dialogueFrame.Visible = true
  dialogueFrame.Position = UDim2.new(0.2, 0, 1.2, 0)
  TweenService:Create(dialogueFrame, TweenInfo.new(0.3, Enum.EasingStyle.Back), {
    Position = UDim2.new(0.2, 0, 0.72, 0)
  }):Play()
  task.wait(0.3)
  showNode(tree, "start")
end

-- Attach ProximityPrompts to NPCs
for _, npc in workspace:GetDescendants() do
  if npc:IsA("Model") and DIALOGUES[npc.Name] then
    local root = npc:FindFirstChild("HumanoidRootPart") or npc.PrimaryPart
    if root then
      local prompt = Instance.new("ProximityPrompt")
      prompt.ActionText = "Talk"
      prompt.ObjectText = npc.Name
      prompt.MaxActivationDistance = 8
      prompt.Parent = root
      prompt.Triggered:Connect(function()
        if not inDialogue then startDialogue(npc.Name) end
      end)
    end
  end
end`
  },
  {
    keywords: ['obby', 'checkpoint', 'obby checkpoint', 'obby timer', 'stage', 'obby stage', 'speedrun timer'],
    category: 'gameplay',
    name: 'Obby Checkpoint System with Timer',
    description: 'SpawnLocation checkpoints, global timer display, stage counter, DataStore best time save',
    code: `-- Obby Checkpoint System: checkpoints, timer, stage counter, best time save
local Players = game:GetService("Players")
local DataStoreService = game:GetService("DataStoreService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local obbyEvent = Instance.new("RemoteEvent")
obbyEvent.Name = "ObbyEvent"
obbyEvent.Parent = ReplicatedStorage

local function getObbyStore()
  local ok, store = pcall(function()
    return DataStoreService:GetDataStore("ObbyTimes_v1")
  end)
  return ok and store or nil
end

-- Gather checkpoints sorted by name (Stage1, Stage2, etc.)
local checkpoints: {SpawnLocation} = {}
for _, part in workspace:GetDescendants() do
  if part:IsA("SpawnLocation") and part.Name:match("^Stage") then
    table.insert(checkpoints, part)
  end
end
table.sort(checkpoints, function(a, b)
  local numA = tonumber(a.Name:match("%d+")) or 0
  local numB = tonumber(b.Name:match("%d+")) or 0
  return numA < numB
end)

type PlayerData = {
  currentStage: number,
  startTime: number,
  bestTime: number?,
}

local playerData: {[number]: PlayerData} = {}

Players.PlayerAdded:Connect(function(player: Player)
  local store = getObbyStore()
  local bestTime: number? = nil
  if store then
    local ok, val = pcall(function()
      return store:GetAsync("best_" .. player.UserId)
    end)
    if ok and val then bestTime = val end
  end

  playerData[player.UserId] = {
    currentStage = 1,
    startTime = tick(),
    bestTime = bestTime,
  }

  -- Set spawn to first checkpoint
  if checkpoints[1] then
    player.RespawnLocation = checkpoints[1]
  end

  obbyEvent:FireClient(player, "init", {
    totalStages = #checkpoints,
    currentStage = 1,
    bestTime = bestTime,
  })

  player.CharacterAdded:Connect(function(char)
    task.wait(1)
    local humanoid = char:FindFirstChildOfClass("Humanoid")
    if not humanoid then return end

    -- Detect checkpoint touches
    for stageNum, checkpoint in checkpoints do
      checkpoint.Touched:Connect(function(hit: BasePart)
        if hit.Parent ~= char then return end
        local data = playerData[player.UserId]
        if not data then return end
        if stageNum <= data.currentStage then return end

        data.currentStage = stageNum
        player.RespawnLocation = checkpoint

        if stageNum == #checkpoints then
          -- Finished!
          local elapsed = tick() - data.startTime
          local isNewBest = not data.bestTime or elapsed < data.bestTime

          if isNewBest then
            data.bestTime = elapsed
            if store then
              pcall(function()
                store:SetAsync("best_" .. player.UserId, elapsed)
              end)
            end
          end

          obbyEvent:FireClient(player, "finished", {
            time = elapsed,
            bestTime = data.bestTime,
            isNewBest = isNewBest,
          })

          -- Reset for replay
          task.wait(5)
          data.currentStage = 1
          data.startTime = tick()
          player.RespawnLocation = checkpoints[1]
          obbyEvent:FireClient(player, "reset", {totalStages = #checkpoints})
        else
          obbyEvent:FireClient(player, "checkpoint", {
            stage = stageNum,
            totalStages = #checkpoints,
            elapsed = tick() - data.startTime,
          })
        end
      end)
    end
  end)
end)

Players.PlayerRemoving:Connect(function(player: Player)
  playerData[player.UserId] = nil
end)

-- CLIENT SCRIPT (StarterPlayerScripts):
--[[
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")
local RunService = game:GetService("RunService")
local player = Players.LocalPlayer
local obbyEvent = ReplicatedStorage:WaitForChild("ObbyEvent")

local gui = Instance.new("ScreenGui")
gui.Name = "ObbyGui"
gui.ResetOnSpawn = false
gui.Parent = player.PlayerGui

local timerLabel = Instance.new("TextLabel")
timerLabel.Size = UDim2.new(0.15, 0, 0.05, 0)
timerLabel.Position = UDim2.new(0.425, 0, 0.02, 0)
timerLabel.BackgroundColor3 = Color3.fromRGB(20, 20, 30)
timerLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
timerLabel.TextScaled = true
timerLabel.Font = Enum.Font.Code
timerLabel.Text = "0.00s"
timerLabel.BorderSizePixel = 0
timerLabel.Parent = gui
Instance.new("UICorner", timerLabel).CornerRadius = UDim.new(0, 6)

local stageLabel = Instance.new("TextLabel")
stageLabel.Size = UDim2.new(0.12, 0, 0.04, 0)
stageLabel.Position = UDim2.new(0.44, 0, 0.075, 0)
stageLabel.BackgroundTransparency = 1
stageLabel.TextColor3 = Color3.fromRGB(180, 180, 200)
stageLabel.TextScaled = true
stageLabel.Font = Enum.Font.GothamBold
stageLabel.Text = "Stage 1/?"
stageLabel.Parent = gui

local bestLabel = Instance.new("TextLabel")
bestLabel.Size = UDim2.new(0.12, 0, 0.03, 0)
bestLabel.Position = UDim2.new(0.44, 0, 0.115, 0)
bestLabel.BackgroundTransparency = 1
bestLabel.TextColor3 = Color3.fromRGB(255, 215, 0)
bestLabel.TextScaled = true
bestLabel.Font = Enum.Font.Gotham
bestLabel.Text = ""
bestLabel.Parent = gui

local startTime = tick()
local running = true

RunService.Heartbeat:Connect(function()
  if running then
    timerLabel.Text = string.format("%.2fs", tick() - startTime)
  end
end)

obbyEvent.OnClientEvent:Connect(function(action, data)
  if action == "init" then
    stageLabel.Text = "Stage 1/" .. data.totalStages
    bestLabel.Text = data.bestTime and ("Best: " .. string.format("%.2fs", data.bestTime)) or ""
    startTime = tick()
    running = true
  elseif action == "checkpoint" then
    stageLabel.Text = "Stage " .. data.stage .. "/" .. data.totalStages
  elseif action == "finished" then
    running = false
    timerLabel.Text = string.format("%.2fs", data.time)
    if data.isNewBest then
      timerLabel.TextColor3 = Color3.fromRGB(255, 215, 0)
      bestLabel.Text = "NEW BEST!"
    end
  elseif action == "reset" then
    startTime = tick()
    running = true
    timerLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
    stageLabel.Text = "Stage 1/" .. data.totalStages
  end
end)
]]`
  },
  {
    keywords: ['gun', 'raycast weapon', 'raycast gun', 'shoot', 'fps weapon', 'gun system', 'bullet'],
    category: 'gameplay',
    name: 'Gun/Raycast Weapon',
    description: 'Tool with Activated event, workspace:Raycast hit detection, Humanoid damage, muzzle flash PointLight, bullet trail beam',
    code: `-- Gun/Raycast Weapon: Tool, raycast hit, damage, muzzle flash, bullet trail
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")

local DAMAGE: number = 25
local FIRE_RATE: number = 0.15 -- seconds between shots
local MAX_RANGE: number = 300
local AMMO_MAX: number = 30
local RELOAD_TIME: number = 2

local tool = script.Parent :: Tool
local handle = tool:WaitForChild("Handle") :: BasePart
local player = Players.LocalPlayer
local mouse = player:GetMouse()

local ammo: number = AMMO_MAX
local canShoot: boolean = true
local isReloading: boolean = false

-- Damage RemoteEvent (create if needed)
local damageEvent = ReplicatedStorage:FindFirstChild("GunDamageEvent")
if not damageEvent then
  damageEvent = Instance.new("RemoteEvent")
  damageEvent.Name = "GunDamageEvent"
  damageEvent.Parent = ReplicatedStorage
end

-- Muzzle flash
local muzzleLight = Instance.new("PointLight")
muzzleLight.Color = Color3.fromRGB(255, 200, 50)
muzzleLight.Brightness = 5
muzzleLight.Range = 10
muzzleLight.Enabled = false
muzzleLight.Parent = handle

-- Fire sound
local fireSound = Instance.new("Sound")
fireSound.SoundId = "rbxassetid://5853930042"
fireSound.Volume = 0.4
fireSound.Parent = handle

-- Reload sound
local reloadSound = Instance.new("Sound")
reloadSound.SoundId = "rbxassetid://5853930042"
reloadSound.Volume = 0.3
reloadSound.PlaybackSpeed = 0.8
reloadSound.Parent = handle

local function createBulletTrail(origin: Vector3, destination: Vector3)
  local distance = (destination - origin).Magnitude
  local trail = Instance.new("Part")
  trail.Size = Vector3.new(0.1, 0.1, distance)
  trail.CFrame = CFrame.lookAt(origin, destination) * CFrame.new(0, 0, -distance / 2)
  trail.Anchored = true
  trail.CanCollide = false
  trail.Material = Enum.Material.Neon
  trail.Color = Color3.fromRGB(255, 220, 80)
  trail.Transparency = 0.3
  trail.Parent = workspace

  TweenService:Create(trail, TweenInfo.new(0.15), {
    Transparency = 1,
    Size = Vector3.new(0.02, 0.02, distance)
  }):Play()

  task.delay(0.2, function() trail:Destroy() end)
end

local function createHitEffect(position: Vector3)
  local hit = Instance.new("Part")
  hit.Size = Vector3.new(0.3, 0.3, 0.3)
  hit.Position = position
  hit.Shape = Enum.PartType.Ball
  hit.Anchored = true
  hit.CanCollide = false
  hit.Material = Enum.Material.Neon
  hit.Color = Color3.fromRGB(255, 100, 50)
  hit.Parent = workspace

  TweenService:Create(hit, TweenInfo.new(0.3), {
    Size = Vector3.new(1.5, 1.5, 1.5),
    Transparency = 1
  }):Play()

  task.delay(0.35, function() hit:Destroy() end)
end

local function reload()
  if isReloading or ammo == AMMO_MAX then return end
  isReloading = true
  canShoot = false
  reloadSound:Play()
  task.wait(RELOAD_TIME)
  ammo = AMMO_MAX
  isReloading = false
  canShoot = true
end

local function shoot()
  if not canShoot or ammo <= 0 then
    if ammo <= 0 then reload() end
    return
  end
  canShoot = false
  ammo -= 1

  -- Muzzle flash
  muzzleLight.Enabled = true
  fireSound:Play()
  task.delay(0.05, function() muzzleLight.Enabled = false end)

  -- Raycast
  local character = player.Character
  if not character then canShoot = true return end
  local head = character:FindFirstChild("Head")
  if not head then canShoot = true return end

  local origin = handle.Position
  local direction = (mouse.Hit.Position - origin).Unit * MAX_RANGE

  local rayParams = RaycastParams.new()
  rayParams.FilterType = Enum.RaycastFilterType.Exclude
  rayParams.FilterDescendantsInstances = {character}

  local result = workspace:Raycast(origin, direction, rayParams)

  if result then
    createBulletTrail(origin, result.Position)
    createHitEffect(result.Position)

    -- Check if hit a humanoid
    local hitPart = result.Instance
    local hitModel = hitPart:FindFirstAncestorOfClass("Model")
    if hitModel then
      local humanoid = hitModel:FindFirstChildOfClass("Humanoid")
      if humanoid then
        damageEvent:FireServer(hitModel, DAMAGE)
      end
    end
  else
    createBulletTrail(origin, origin + direction)
  end

  task.wait(FIRE_RATE)
  canShoot = true
end

tool.Activated:Connect(shoot)

-- R to reload
local UserInputService = game:GetService("UserInputService")
UserInputService.InputBegan:Connect(function(input, processed)
  if processed then return end
  if input.KeyCode == Enum.KeyCode.R then reload() end
end)

-- SERVER SCRIPT for damage validation:
-- damageEvent.OnServerEvent:Connect(function(player, targetModel, damage)
--   local humanoid = targetModel and targetModel:FindFirstChildOfClass("Humanoid")
--   if humanoid then humanoid:TakeDamage(math.min(damage, 50)) end -- cap damage
-- end)`
  },
  {
    keywords: ['tycoon', 'dropper', 'conveyor', 'collector', 'tycoon system', 'factory', 'money maker'],
    category: 'gameplay',
    name: 'Tycoon Dropper + Conveyor + Collector',
    description: 'Dropper spawns parts on timer, conveyor belt moves with BodyVelocity, collector destroys parts and adds cash to player',
    code: `-- Tycoon: Dropper + Conveyor + Collector system
local Players = game:GetService("Players")
local TweenService = game:GetService("TweenService")

type TycoonConfig = {
  dropInterval: number,
  dropValue: number,
  conveyorSpeed: number,
  dropColor: Color3,
  dropMaterial: Enum.Material,
}

local DEFAULT_CONFIG: TycoonConfig = {
  dropInterval = 2,
  dropValue = 5,
  conveyorSpeed = 10,
  dropColor = Color3.fromRGB(200, 170, 50),
  dropMaterial = Enum.Material.Metal,
}

local function setupTycoon(owner: Player, dropper: BasePart, conveyor: BasePart, collector: BasePart, config: TycoonConfig?)
  local cfg = config or DEFAULT_CONFIG
  local isActive: boolean = true

  -- Setup conveyor surface velocity
  conveyor.CustomPhysicalProperties = PhysicalProperties.new(0.5, 0.3, 0.1, 1, 1)
  -- Use Velocity property for conveyor effect
  local bodyVelocity = Instance.new("BodyVelocity")
  bodyVelocity.Velocity = conveyor.CFrame.LookVector * cfg.conveyorSpeed
  bodyVelocity.MaxForce = Vector3.new(0, 0, 0) -- conveyor itself doesn't move
  bodyVelocity.Parent = conveyor

  -- Conveyor texture animation
  local texture = Instance.new("Texture")
  texture.Texture = "rbxassetid://6023426926"
  texture.Face = Enum.NormalId.Top
  texture.StudsPerTileU = 2
  texture.StudsPerTileV = 2
  texture.Parent = conveyor

  -- Visual dropper indicator
  local dropperLight = Instance.new("PointLight")
  dropperLight.Color = cfg.dropColor
  dropperLight.Brightness = 1
  dropperLight.Range = 6
  dropperLight.Parent = dropper

  -- Collector effect
  local collectorParticles = Instance.new("ParticleEmitter")
  collectorParticles.Rate = 0
  collectorParticles.Speed = NumberRange.new(3, 5)
  collectorParticles.Lifetime = NumberRange.new(0.3, 0.5)
  collectorParticles.Size = NumberSequence.new({NumberSequenceKeypoint.new(0, 0.5), NumberSequenceKeypoint.new(1, 0)})
  collectorParticles.Color = ColorSequence.new(Color3.fromRGB(80, 255, 80))
  collectorParticles.LightEmission = 1
  collectorParticles.Parent = collector

  -- Cash display
  local billboardGui = Instance.new("BillboardGui")
  billboardGui.Size = UDim2.new(3, 0, 1, 0)
  billboardGui.StudsOffset = Vector3.new(0, 3, 0)
  billboardGui.AlwaysOnTop = true
  billboardGui.Parent = collector
  local cashLabel = Instance.new("TextLabel")
  cashLabel.Size = UDim2.new(1, 0, 1, 0)
  cashLabel.BackgroundTransparency = 1
  cashLabel.TextColor3 = Color3.fromRGB(80, 255, 80)
  cashLabel.TextScaled = true
  cashLabel.Font = Enum.Font.GothamBold
  cashLabel.Parent = billboardGui

  local function updateCashDisplay()
    local coins = owner:FindFirstChild("leaderstats") and owner.leaderstats:FindFirstChild("Coins")
    cashLabel.Text = "$" .. (coins and coins.Value or 0)
  end

  -- Collector detection
  collector.Touched:Connect(function(hit: BasePart)
    if hit.Name == "TycoonDrop" then
      -- Add cash
      local coins = owner:FindFirstChild("leaderstats") and owner.leaderstats:FindFirstChild("Coins")
      if coins then coins.Value += cfg.dropValue end
      -- Effect
      collectorParticles:Emit(5)
      updateCashDisplay()
      hit:Destroy()
    end
  end)

  -- Dropper loop
  task.spawn(function()
    while isActive and dropper and dropper.Parent do
      local drop = Instance.new("Part")
      drop.Name = "TycoonDrop"
      drop.Size = Vector3.new(1, 1, 1)
      drop.Color = cfg.dropColor
      drop.Material = cfg.dropMaterial
      drop.Position = dropper.Position - Vector3.new(0, dropper.Size.Y / 2 + 0.5, 0)
      drop.Anchored = false
      drop.CanCollide = true
      drop.Parent = workspace

      -- Apply conveyor force to drop
      local dropVel = Instance.new("BodyVelocity")
      dropVel.Velocity = conveyor.CFrame.LookVector * cfg.conveyorSpeed
      dropVel.MaxForce = Vector3.new(cfg.conveyorSpeed * 10, 0, cfg.conveyorSpeed * 10)
      dropVel.Parent = drop

      -- Auto-cleanup after 15 seconds if not collected
      task.delay(15, function()
        if drop and drop.Parent then drop:Destroy() end
      end)

      -- Flash dropper light
      dropperLight.Brightness = 3
      TweenService:Create(dropperLight, TweenInfo.new(0.3), {Brightness = 1}):Play()

      task.wait(cfg.dropInterval)
    end
  end)

  updateCashDisplay()

  return function() isActive = false end -- cleanup function
end

-- Auto-setup: find Dropper, Conveyor, Collector parts in workspace
local dropper = workspace:FindFirstChild("Dropper")
local conveyor = workspace:FindFirstChild("Conveyor")
local collector = workspace:FindFirstChild("Collector")
if dropper and conveyor and collector then
  Players.PlayerAdded:Connect(function(player: Player)
    task.wait(2)
    setupTycoon(player, dropper, conveyor, collector)
  end)
end`
  },
  {
    keywords: ['car', 'driving', 'vehicle', 'car system', 'drive car', 'vehicle seat', 'car controls'],
    category: 'gameplay',
    name: 'Car Driving System',
    description: 'VehicleSeat with BodyVelocity and BodyGyro, WASD controls, speed display HUD, enter/exit with ProximityPrompt',
    code: `-- Car Driving System: VehicleSeat + BodyVelocity + BodyGyro, WASD, speed HUD
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local UserInputService = game:GetService("UserInputService")
local TweenService = game:GetService("TweenService")

local MAX_SPEED: number = 80
local ACCELERATION: number = 2
local BRAKE_FORCE: number = 4
local TURN_SPEED: number = 2.5
local REVERSE_SPEED: number = 30

local function setupCar(carModel: Model)
  local seat = carModel:FindFirstChildOfClass("VehicleSeat")
  if not seat then return end

  local bodyVelocity = Instance.new("BodyVelocity")
  bodyVelocity.MaxForce = Vector3.new(0, 0, 0) -- disabled when empty
  bodyVelocity.Velocity = Vector3.new(0, 0, 0)
  bodyVelocity.P = 5000
  bodyVelocity.Parent = seat

  local bodyGyro = Instance.new("BodyGyro")
  bodyGyro.MaxTorque = Vector3.new(0, 0, 0) -- disabled when empty
  bodyGyro.P = 10000
  bodyGyro.D = 500
  bodyGyro.CFrame = seat.CFrame
  bodyGyro.Parent = seat

  -- Prompt to enter
  local prompt = Instance.new("ProximityPrompt")
  prompt.ActionText = "Drive"
  prompt.ObjectText = carModel.Name
  prompt.MaxActivationDistance = 10
  prompt.Parent = seat

  local currentSpeed: number = 0
  local currentDriver: Player? = nil
  local drivingConn: RBXScriptConnection? = nil

  -- Engine sound
  local engineSound = Instance.new("Sound")
  engineSound.SoundId = "rbxassetid://9120258440"
  engineSound.Volume = 0.3
  engineSound.Looped = true
  engineSound.Parent = seat

  seat:GetPropertyChangedSignal("Occupant"):Connect(function()
    local humanoid = seat.Occupant
    if humanoid then
      local character = humanoid.Parent
      local player = Players:GetPlayerFromCharacter(character)
      if not player then return end

      currentDriver = player
      bodyVelocity.MaxForce = Vector3.new(math.huge, 0, math.huge)
      bodyGyro.MaxTorque = Vector3.new(0, math.huge, 0)
      prompt.Enabled = false
      engineSound:Play()

      -- Speed display GUI
      local gui = Instance.new("ScreenGui")
      gui.Name = "SpeedGui"
      gui.ResetOnSpawn = false
      gui.Parent = player.PlayerGui

      local speedLabel = Instance.new("TextLabel")
      speedLabel.Size = UDim2.new(0.12, 0, 0.06, 0)
      speedLabel.Position = UDim2.new(0.44, 0, 0.9, 0)
      speedLabel.BackgroundColor3 = Color3.fromRGB(20, 20, 30)
      speedLabel.TextColor3 = Color3.fromRGB(0, 255, 100)
      speedLabel.TextScaled = true
      speedLabel.Font = Enum.Font.Code
      speedLabel.Text = "0 MPH"
      speedLabel.BorderSizePixel = 0
      speedLabel.Parent = gui
      Instance.new("UICorner", speedLabel).CornerRadius = UDim.new(0, 6)

      local gearLabel = Instance.new("TextLabel")
      gearLabel.Size = UDim2.new(0.06, 0, 0.04, 0)
      gearLabel.Position = UDim2.new(0.47, 0, 0.86, 0)
      gearLabel.BackgroundTransparency = 1
      gearLabel.TextColor3 = Color3.fromRGB(200, 200, 200)
      gearLabel.TextScaled = true
      gearLabel.Font = Enum.Font.GothamBold
      gearLabel.Text = "D"
      gearLabel.Parent = gui

      drivingConn = RunService.Heartbeat:Connect(function(dt: number)
        local throttle = seat.ThrottleFloat -- -1 to 1
        local steer = seat.SteerFloat -- -1 to 1

        -- Accelerate / brake
        if throttle > 0 then
          currentSpeed = math.min(MAX_SPEED, currentSpeed + ACCELERATION * throttle)
          gearLabel.Text = "D"
        elseif throttle < 0 then
          if currentSpeed > 1 then
            currentSpeed = math.max(0, currentSpeed - BRAKE_FORCE)
          else
            currentSpeed = math.max(-REVERSE_SPEED, currentSpeed + ACCELERATION * throttle)
            gearLabel.Text = "R"
          end
        else
          -- Coast / decelerate
          if currentSpeed > 0 then
            currentSpeed = math.max(0, currentSpeed - 1)
          elseif currentSpeed < 0 then
            currentSpeed = math.min(0, currentSpeed + 1)
          end
        end

        -- Apply velocity
        local lookVector = seat.CFrame.LookVector
        bodyVelocity.Velocity = lookVector * currentSpeed

        -- Steering
        if math.abs(currentSpeed) > 1 then
          local turnAmount = steer * TURN_SPEED * (currentSpeed / MAX_SPEED)
          bodyGyro.CFrame = bodyGyro.CFrame * CFrame.Angles(0, -turnAmount * dt, 0)
        end

        -- Update HUD
        speedLabel.Text = math.floor(math.abs(currentSpeed)) .. " MPH"
        engineSound.PlaybackSpeed = 0.5 + (math.abs(currentSpeed) / MAX_SPEED) * 1.5
      end)
    else
      -- Exited
      if drivingConn then drivingConn:Disconnect() drivingConn = nil end
      bodyVelocity.MaxForce = Vector3.new(0, 0, 0)
      bodyVelocity.Velocity = Vector3.new(0, 0, 0)
      bodyGyro.MaxTorque = Vector3.new(0, 0, 0)
      currentSpeed = 0
      engineSound:Stop()
      prompt.Enabled = true

      if currentDriver then
        local speedGui = currentDriver.PlayerGui:FindFirstChild("SpeedGui")
        if speedGui then speedGui:Destroy() end
        currentDriver = nil
      end
    end
  end)
end

-- Setup all cars in workspace
for _, model in workspace:GetDescendants() do
  if model:IsA("Model") and model:FindFirstChildOfClass("VehicleSeat") then
    setupCar(model)
  end
end`
  },
  {
    keywords: ['day night', 'day night cycle', 'lighting cycle', 'auto lighting', 'streetlights', 'time cycle'],
    category: 'environment',
    name: 'Day/Night with Auto Lighting',
    description: 'ClockTime cycles smoothly, PointLights auto-enable at night, streetlights turn on, ambient colors shift',
    code: `-- Day/Night Cycle: smooth time, auto streetlights, ambient shifts
local Lighting = game:GetService("Lighting")
local TweenService = game:GetService("TweenService")
local RunService = game:GetService("RunService")

local CYCLE_DURATION: number = 720 -- seconds for full day (12 minutes)
local DAWN_HOUR: number = 6
local DUSK_HOUR: number = 18
local isNight: boolean = false

-- Lighting presets
local DAY_AMBIENT = Color3.fromRGB(140, 140, 140)
local NIGHT_AMBIENT = Color3.fromRGB(30, 30, 50)
local DAY_OUTDOOR = Color3.fromRGB(140, 140, 140)
local NIGHT_OUTDOOR = Color3.fromRGB(50, 50, 80)
local DAWN_COLOR = Color3.fromRGB(255, 180, 100)
local NOON_COLOR = Color3.fromRGB(255, 255, 255)
local DUSK_COLOR = Color3.fromRGB(255, 140, 80)
local NIGHT_COLOR = Color3.fromRGB(100, 120, 180)

-- Gather all light sources to toggle
local streetLights: {{part: BasePart, light: PointLight | SpotLight}} = {}
for _, obj in workspace:GetDescendants() do
  if (obj:IsA("PointLight") or obj:IsA("SpotLight")) and obj.Parent:IsA("BasePart") then
    local parentName = obj.Parent.Name:lower()
    if parentName:find("street") or parentName:find("lamp") or parentName:find("light")
      or parentName:find("lantern") or parentName:find("post") then
      table.insert(streetLights, {part = obj.Parent, light = obj})
      obj.Enabled = false
    end
  end
end

local function setLightsEnabled(enabled: boolean)
  for _, entry in streetLights do
    entry.light.Enabled = enabled
    -- Toggle neon material
    if enabled then
      if entry.part.Material ~= Enum.Material.Neon then
        entry.part.Material = Enum.Material.Neon
      end
    else
      if entry.part.Material == Enum.Material.Neon then
        entry.part.Material = Enum.Material.Metal
      end
    end
  end
end

local function getTimeColor(hour: number): Color3
  if hour >= 6 and hour < 8 then
    local t = (hour - 6) / 2
    return DAWN_COLOR:Lerp(NOON_COLOR, t)
  elseif hour >= 8 and hour < 16 then
    return NOON_COLOR
  elseif hour >= 16 and hour < 18 then
    local t = (hour - 16) / 2
    return NOON_COLOR:Lerp(DUSK_COLOR, t)
  elseif hour >= 18 and hour < 20 then
    local t = (hour - 18) / 2
    return DUSK_COLOR:Lerp(NIGHT_COLOR, t)
  else
    return NIGHT_COLOR
  end
end

local startTime = tick()

RunService.Heartbeat:Connect(function()
  local elapsed = tick() - startTime
  local dayProgress = (elapsed % CYCLE_DURATION) / CYCLE_DURATION
  local hour = dayProgress * 24

  Lighting.ClockTime = hour

  -- Ambient lighting
  local isDark = hour < DAWN_HOUR or hour > DUSK_HOUR
  if isDark and not isNight then
    isNight = true
    TweenService:Create(Lighting, TweenInfo.new(3), {
      Ambient = NIGHT_AMBIENT,
      OutdoorAmbient = NIGHT_OUTDOOR,
    }):Play()
    setLightsEnabled(true)
  elseif not isDark and isNight then
    isNight = false
    TweenService:Create(Lighting, TweenInfo.new(3), {
      Ambient = DAY_AMBIENT,
      OutdoorAmbient = DAY_OUTDOOR,
    }):Play()
    setLightsEnabled(false)
  end

  -- Sun color tinting
  local sunColor = getTimeColor(hour)
  Lighting.ColorShift_Top = sunColor

  -- Stars at night (via atmosphere)
  local atmo = Lighting:FindFirstChildOfClass("Atmosphere")
  if atmo then
    local nightDensity = isDark and 0.5 or 0.3
    atmo.Density = nightDensity
  end
end)`
  },
  {
    keywords: ['click to place', 'building system', 'placement', 'grid snap', 'build mode', 'place blocks', 'sandbox build'],
    category: 'gameplay',
    name: 'Click-to-Place Building System',
    description: 'Mouse.Hit position for placement, ghost preview Part follows mouse, click to place, grid snapping, rotate with R',
    code: `-- Click-to-Place Building System: ghost preview, grid snap, R to rotate, click to place
local Players = game:GetService("Players")
local UserInputService = game:GetService("UserInputService")
local RunService = game:GetService("RunService")
local TweenService = game:GetService("TweenService")
local player = Players.LocalPlayer
local mouse = player:GetMouse()
local camera = workspace.CurrentCamera

local GRID_SIZE: number = 4
local BUILD_HEIGHT: number = 2
local MAX_RANGE: number = 50
local isBuilding: boolean = false
local rotation: number = 0

type BuildBlock = {
  name: string,
  size: Vector3,
  color: Color3,
  material: Enum.Material,
}

local BLOCKS: {BuildBlock} = {
  {name = "Wall", size = Vector3.new(4, 8, 1), color = Color3.fromRGB(160, 160, 160), material = Enum.Material.Concrete},
  {name = "Floor", size = Vector3.new(4, 1, 4), color = Color3.fromRGB(140, 140, 140), material = Enum.Material.Concrete},
  {name = "Pillar", size = Vector3.new(2, 8, 2), color = Color3.fromRGB(180, 180, 180), material = Enum.Material.Concrete},
  {name = "Ramp", size = Vector3.new(4, 4, 4), color = Color3.fromRGB(150, 150, 150), material = Enum.Material.Concrete},
  {name = "Window", size = Vector3.new(4, 4, 0.5), color = Color3.fromRGB(180, 220, 255), material = Enum.Material.Glass},
}

local selectedBlock: number = 1
local ghostPart: BasePart? = nil
local placedParts: {BasePart} = {}

-- Build GUI
local gui = Instance.new("ScreenGui")
gui.Name = "BuildGui"
gui.ResetOnSpawn = false
gui.Parent = player.PlayerGui

local toolbar = Instance.new("Frame")
toolbar.Size = UDim2.new(0.5, 0, 0.08, 0)
toolbar.Position = UDim2.new(0.25, 0, 0.9, 0)
toolbar.BackgroundColor3 = Color3.fromRGB(20, 20, 30)
toolbar.BorderSizePixel = 0
toolbar.Visible = false
toolbar.Parent = gui
Instance.new("UICorner", toolbar).CornerRadius = UDim.new(0, 8)
local toolbarLayout = Instance.new("UIListLayout")
toolbarLayout.FillDirection = Enum.FillDirection.Horizontal
toolbarLayout.Padding = UDim.new(0, 4)
toolbarLayout.HorizontalAlignment = Enum.HorizontalAlignment.Center
toolbarLayout.VerticalAlignment = Enum.VerticalAlignment.Center
toolbarLayout.Parent = toolbar

for i, block in BLOCKS do
  local btn = Instance.new("TextButton")
  btn.Size = UDim2.new(0, 60, 0, 40)
  btn.BackgroundColor3 = block.color
  btn.Text = block.name
  btn.TextColor3 = Color3.fromRGB(255, 255, 255)
  btn.TextScaled = true
  btn.Font = Enum.Font.GothamBold
  btn.BorderSizePixel = 0
  btn.Parent = toolbar
  Instance.new("UICorner", btn).CornerRadius = UDim.new(0, 6)

  btn.MouseButton1Click:Connect(function()
    selectedBlock = i
    if ghostPart then
      ghostPart.Size = block.size
      ghostPart.Color = block.color
      ghostPart.Material = block.material
    end
  end)
end

local modeLabel = Instance.new("TextLabel")
modeLabel.Size = UDim2.new(0.15, 0, 0.04, 0)
modeLabel.Position = UDim2.new(0.425, 0, 0.85, 0)
modeLabel.BackgroundTransparency = 1
modeLabel.TextColor3 = Color3.fromRGB(100, 200, 255)
modeLabel.TextScaled = true
modeLabel.Font = Enum.Font.GothamBold
modeLabel.Text = ""
modeLabel.Visible = false
modeLabel.Parent = gui

local function snapToGrid(pos: Vector3): Vector3
  return Vector3.new(
    math.round(pos.X / GRID_SIZE) * GRID_SIZE,
    math.round(pos.Y / BUILD_HEIGHT) * BUILD_HEIGHT + BUILD_HEIGHT / 2,
    math.round(pos.Z / GRID_SIZE) * GRID_SIZE
  )
end

local function createGhost()
  local block = BLOCKS[selectedBlock]
  ghostPart = Instance.new("Part")
  ghostPart.Size = block.size
  ghostPart.Color = block.color
  ghostPart.Material = block.material
  ghostPart.Transparency = 0.5
  ghostPart.Anchored = true
  ghostPart.CanCollide = false
  ghostPart.Parent = workspace

  local highlight = Instance.new("SelectionBox")
  highlight.Adornee = ghostPart
  highlight.Color3 = Color3.fromRGB(100, 200, 255)
  highlight.LineThickness = 0.03
  highlight.Parent = ghostPart
end

local function destroyGhost()
  if ghostPart then ghostPart:Destroy() ghostPart = nil end
end

local function toggleBuildMode()
  isBuilding = not isBuilding
  toolbar.Visible = isBuilding
  modeLabel.Visible = isBuilding
  modeLabel.Text = isBuilding and "BUILD MODE (B to exit, R to rotate)" or ""
  if isBuilding then
    createGhost()
  else
    destroyGhost()
  end
end

-- Update ghost position
RunService.RenderStepped:Connect(function()
  if not isBuilding or not ghostPart then return end

  local rayParams = RaycastParams.new()
  rayParams.FilterType = Enum.RaycastFilterType.Exclude
  rayParams.FilterDescendantsInstances = {ghostPart, player.Character}

  local unitRay = camera:ScreenPointToRay(mouse.X, mouse.Y)
  local result = workspace:Raycast(unitRay.Origin, unitRay.Direction * MAX_RANGE, rayParams)

  if result then
    local snapped = snapToGrid(result.Position)
    ghostPart.Position = snapped
    ghostPart.Orientation = Vector3.new(0, rotation, 0)
    ghostPart.Color = BLOCKS[selectedBlock].color
    ghostPart.Transparency = 0.5
  end
end)

-- Place block on click
mouse.Button1Down:Connect(function()
  if not isBuilding or not ghostPart then return end

  local block = BLOCKS[selectedBlock]
  local placed = Instance.new("Part")
  placed.Size = block.size
  placed.Color = block.color
  placed.Material = block.material
  placed.Position = ghostPart.Position
  placed.Orientation = ghostPart.Orientation
  placed.Anchored = true
  placed.Parent = workspace

  table.insert(placedParts, placed)

  -- Place effect
  placed.Transparency = 0.5
  TweenService:Create(placed, TweenInfo.new(0.2), {Transparency = 0}):Play()
end)

-- Keyboard controls
UserInputService.InputBegan:Connect(function(input, processed)
  if processed then return end
  if input.KeyCode == Enum.KeyCode.B then toggleBuildMode() end
  if input.KeyCode == Enum.KeyCode.R and isBuilding then
    rotation = (rotation + 90) % 360
  end
  -- Undo last placed
  if input.KeyCode == Enum.KeyCode.Z and isBuilding then
    if #placedParts > 0 then
      local last = table.remove(placedParts)
      if last then last:Destroy() end
    end
  end
  -- Number keys to select blocks
  local num = tonumber(input.KeyCode.Name)
  if num and num >= 1 and num <= #BLOCKS and isBuilding then
    selectedBlock = num
    if ghostPart then
      ghostPart.Size = BLOCKS[num].size
      ghostPart.Color = BLOCKS[num].color
      ghostPart.Material = BLOCKS[num].material
    end
  end
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
