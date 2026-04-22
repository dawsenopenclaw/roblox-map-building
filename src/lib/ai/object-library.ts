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
