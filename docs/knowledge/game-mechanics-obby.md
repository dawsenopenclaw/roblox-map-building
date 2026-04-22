# Obby Game Mechanics for Roblox

Complete reference for building obstacle course (obby) games — the second most popular genre on Roblox.

## Core Obby Systems

### 1. Checkpoint System

Checkpoints save player progress so they don't restart from the beginning on death.

**How it works:**
- Each checkpoint is a `SpawnLocation` part with `TeamColor` matching the player's team
- When a player touches a checkpoint, their `RespawnLocation` is updated
- On death, they respawn at their last touched checkpoint
- Checkpoints are numbered (Stage 1, Stage 2, etc.)
- A stage counter GUI shows current progress

**Key properties for SpawnLocation:**
- `AllowTeamChangeOnTouch = true` (auto-assigns checkpoint)
- `Neutral = false` (requires team matching)
- `TeamColor` matches the corresponding Team
- `Duration = 0` (instant respawn, no forced sit)

### 2. Kill Bricks

Kill bricks are parts that instantly kill the player on touch.

**Types:**
- **Static kill bricks** — red parts on the ground/walls
- **Moving kill bricks** — sweep across platforms on a timer
- **Falling kill bricks** — drop when player steps nearby
- **Growing kill bricks** — expand to fill space over time
- **Invisible kill bricks** — transparent until touched (hard mode)

### 3. Moving Platforms

Platforms that move between two points, requiring timing to jump on/off.

**Movement patterns:**
- **Linear** — back and forth between two points
- **Circular** — orbiting around a center point
- **Vertical** — moving up and down
- **Disappearing** — platforms that vanish and reappear on a cycle
- **Spinning** — rotating around their center axis

### 4. Difficulty Progression

Obby stages should escalate in difficulty:

**Easy stages (1-5):**
- Large platforms (6x1x6 to 8x1x8)
- Short gaps (4-6 studs)
- No moving elements
- Generous checkpoints

**Medium stages (6-12):**
- Smaller platforms (4x1x4)
- Longer gaps (6-10 studs)
- Moving platforms (slow)
- Kill bricks between platforms
- Tightrope/balance beams

**Hard stages (13-20):**
- Tiny platforms (2x1x2)
- Long gaps (10-14 studs)
- Fast moving platforms
- Wall jumps
- Spinning obstacles
- Combined hazards

### 5. Timer / Speedrun System

Tracks how fast players complete the course.

**Components:**
- Start timer on first checkpoint touch
- Display running time in GUI (MM:SS.ms)
- Stop timer at final platform
- Save best time to DataStore
- Leaderboard of fastest runs

### 6. Stage Counter GUI

A persistent GUI showing the player's current stage.

**Displays:**
- Current stage number / total stages
- Best time for current run
- Total deaths counter
- Personal best time

### 7. Win Zone

The final platform with celebration effects.

**Features:**
- Large platform with gold/rainbow Neon
- ParticleEmitter confetti burst
- Congratulations text (BillboardGui)
- Sound effect (fanfare)
- Teleport back to lobby option
- Badge award

## Complete Working Obby Code

### Server Script — Checkpoint and Death System

```lua
--!strict
-- [ServerScriptService/ObbyServer]
-- Complete Obby System — Server Script
local Players = game:GetService("Players")
local Teams = game:GetService("Teams")
local RS = game:GetService("ReplicatedStorage")
local DataStoreService = game:GetService("DataStoreService")

local obbyStore = DataStoreService:GetDataStore("ObbyData_v1")

local CONFIG = table.freeze({
  TOTAL_STAGES = 15,
  KILL_BRICK_TAG = "KillBrick",
  CHECKPOINT_TAG = "Checkpoint",
})

type ObbyData = {
  bestTime: number,
  highestStage: number,
  totalDeaths: number,
}

local playerData: { [number]: ObbyData } = {}
local playerTimers: { [number]: number } = {} -- start time per player
local playerStages: { [number]: number } = {} -- current stage per player

-- Remote events
local stageUpdate = Instance.new("RemoteEvent")
stageUpdate.Name = "StageUpdate"
stageUpdate.Parent = RS

local timerUpdate = Instance.new("RemoteEvent")
timerUpdate.Name = "TimerUpdate"
timerUpdate.Parent = RS

local winEvent = Instance.new("RemoteEvent")
winEvent.Name = "ObbyWin"
winEvent.Parent = RS

-- ── DATA ─────────────────────────────────────────────────────────────────
local function loadData(player: Player): ObbyData
  local success, data = pcall(function()
    return obbyStore:GetAsync("obby_" .. player.UserId)
  end)
  if success and type(data) == "table" then
    return {
      bestTime = data.bestTime or 999999,
      highestStage = data.highestStage or 0,
      totalDeaths = data.totalDeaths or 0,
    }
  end
  return { bestTime = 999999, highestStage = 0, totalDeaths = 0 }
end

local function saveData(player: Player)
  local data = playerData[player.UserId]
  if not data then return end
  pcall(function()
    obbyStore:SetAsync("obby_" .. player.UserId, data)
  end)
end

-- ── KILL BRICKS ──────────────────────────────────────────────────────────
local function setupKillBrick(part: Part)
  part.Touched:Connect(function(hit: BasePart)
    local character = hit.Parent :: Model
    local humanoid = character:FindFirstChildOfClass("Humanoid")
    if not humanoid or humanoid.Health <= 0 then return end

    local player = Players:GetPlayerFromCharacter(character)
    if player then
      local data = playerData[player.UserId]
      if data then
        data.totalDeaths += 1
      end
    end

    humanoid.Health = 0
  end)
end

-- Setup all kill bricks in workspace
for _, part in workspace:GetDescendants() do
  if part:IsA("BasePart") and part:GetAttribute("KillBrick") then
    setupKillBrick(part)
  end
end

-- ── CHECKPOINTS ──────────────────────────────────────────────────────────
local function setupCheckpoint(spawnPart: SpawnLocation, stageNumber: number)
  spawnPart.Touched:Connect(function(hit: BasePart)
    local character = hit.Parent :: Model
    local humanoid = character:FindFirstChildOfClass("Humanoid")
    if not humanoid then return end

    local player = Players:GetPlayerFromCharacter(character)
    if not player then return end

    local currentStage = playerStages[player.UserId] or 0
    if stageNumber <= currentStage then return end -- already passed this stage

    -- Update stage
    playerStages[player.UserId] = stageNumber
    player.RespawnLocation = spawnPart

    -- Start timer on first checkpoint
    if stageNumber == 1 and not playerTimers[player.UserId] then
      playerTimers[player.UserId] = os.clock()
    end

    -- Update personal best stage
    local data = playerData[player.UserId]
    if data and stageNumber > data.highestStage then
      data.highestStage = stageNumber
    end

    -- Notify client
    stageUpdate:FireClient(player, stageNumber, CONFIG.TOTAL_STAGES)

    -- Check for win
    if stageNumber >= CONFIG.TOTAL_STAGES then
      local startTime = playerTimers[player.UserId]
      if startTime then
        local elapsed = os.clock() - startTime
        if data and elapsed < data.bestTime then
          data.bestTime = elapsed
        end
        playerTimers[player.UserId] = nil
        winEvent:FireClient(player, elapsed, data and data.bestTime or elapsed)
        saveData(player)
      end
    end
  end)
end

-- Find and setup all checkpoints
for i = 1, CONFIG.TOTAL_STAGES do
  local checkpoint = workspace:FindFirstChild("Checkpoint_" .. i) :: SpawnLocation?
  if checkpoint then
    setupCheckpoint(checkpoint, i)
  end
end

-- ── MOVING PLATFORMS ─────────────────────────────────────────────────────
local TweenService = game:GetService("TweenService")

local function setupMovingPlatform(platform: Part, pointA: Vector3, pointB: Vector3, duration: number)
  local tweenInfo = TweenInfo.new(duration, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, -1, true)
  local tween = TweenService:Create(platform, tweenInfo, {
    CFrame = CFrame.new(pointB),
  })
  platform.CFrame = CFrame.new(pointA)
  tween:Play()
end

-- Setup moving platforms tagged with "MovingPlatform" attribute
for _, part in workspace:GetDescendants() do
  if part:IsA("BasePart") and part:GetAttribute("MovingPlatform") then
    local endPos = part:GetAttribute("EndPosition") :: Vector3?
    local duration = part:GetAttribute("MoveDuration") :: number? or 3
    if endPos then
      setupMovingPlatform(part, part.Position, endPos, duration)
    end
  end
end

-- ── DISAPPEARING PLATFORMS ───────────────────────────────────────────────
local function setupDisappearingPlatform(platform: Part, visibleTime: number, hiddenTime: number, offset: number)
  task.spawn(function()
    task.wait(offset) -- stagger timing
    while platform.Parent do
      platform.Transparency = 0
      platform.CanCollide = true
      task.wait(visibleTime)
      -- Fade out
      for i = 0, 1, 0.2 do
        platform.Transparency = i
        task.wait(0.05)
      end
      platform.CanCollide = false
      platform.Transparency = 1
      task.wait(hiddenTime)
    end
  end)
end

-- ── SPINNING OBSTACLE ────────────────────────────────────────────────────
local function setupSpinner(part: Part, speed: number)
  local RunService = game:GetService("RunService")
  local center = part.CFrame
  local angle = 0
  RunService.Heartbeat:Connect(function(dt: number)
    angle += speed * dt
    part.CFrame = center * CFrame.Angles(0, angle, 0)
  end)
end

-- ── PLAYER SETUP ─────────────────────────────────────────────────────────
Players.PlayerAdded:Connect(function(player: Player)
  local data = loadData(player)
  playerData[player.UserId] = data
  playerStages[player.UserId] = 0

  local leaderstats = Instance.new("Folder")
  leaderstats.Name = "leaderstats"
  leaderstats.Parent = player

  local stageStat = Instance.new("IntValue")
  stageStat.Name = "Stage"
  stageStat.Value = 0
  stageStat.Parent = leaderstats

  local deathsStat = Instance.new("IntValue")
  deathsStat.Name = "Deaths"
  deathsStat.Value = data.totalDeaths
  deathsStat.Parent = leaderstats
end)

Players.PlayerRemoving:Connect(function(player: Player)
  saveData(player)
  playerData[player.UserId] = nil
  playerTimers[player.UserId] = nil
  playerStages[player.UserId] = nil
end)

game:BindToClose(function()
  for _, player in Players:GetPlayers() do
    saveData(player)
  end
end)
```

### Client Script — Stage Counter and Timer GUI

```lua
--!strict
-- [StarterPlayerScripts/ObbyGui]
-- Client-side obby HUD
local Players = game:GetService("Players")
local RS = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local player = Players.LocalPlayer
local stageUpdate = RS:WaitForChild("StageUpdate") :: RemoteEvent
local timerUpdate = RS:WaitForChild("TimerUpdate") :: RemoteEvent
local winEvent = RS:WaitForChild("ObbyWin") :: RemoteEvent

-- ── CREATE GUI ───────────────────────────────────────────────────────────
local gui = Instance.new("ScreenGui")
gui.Name = "ObbyHUD"
gui.ResetOnSpawn = false
gui.Parent = player.PlayerGui

-- Stage counter (top center)
local stageFrame = Instance.new("Frame")
stageFrame.Size = UDim2.new(0, 200, 0, 50)
stageFrame.Position = UDim2.new(0.5, -100, 0, 10)
stageFrame.BackgroundColor3 = Color3.fromRGB(20, 20, 30)
stageFrame.BackgroundTransparency = 0.3
stageFrame.Parent = gui

local stageCorner = Instance.new("UICorner")
stageCorner.CornerRadius = UDim.new(0, 12)
stageCorner.Parent = stageFrame

local stageLabel = Instance.new("TextLabel")
stageLabel.Size = UDim2.new(1, 0, 1, 0)
stageLabel.Text = "Stage 0 / 15"
stageLabel.Font = Enum.Font.GothamBold
stageLabel.TextSize = 22
stageLabel.TextColor3 = Color3.new(1, 1, 1)
stageLabel.BackgroundTransparency = 1
stageLabel.Parent = stageFrame

-- Timer (top center, below stage)
local timerFrame = Instance.new("Frame")
timerFrame.Size = UDim2.new(0, 160, 0, 36)
timerFrame.Position = UDim2.new(0.5, -80, 0, 65)
timerFrame.BackgroundColor3 = Color3.fromRGB(20, 20, 30)
timerFrame.BackgroundTransparency = 0.3
timerFrame.Parent = gui

local timerCorner = Instance.new("UICorner")
timerCorner.CornerRadius = UDim.new(0, 10)
timerCorner.Parent = timerFrame

local timerLabel = Instance.new("TextLabel")
timerLabel.Size = UDim2.new(1, 0, 1, 0)
timerLabel.Text = "00:00.00"
timerLabel.Font = Enum.Font.Code
timerLabel.TextSize = 20
timerLabel.TextColor3 = Color3.fromRGB(100, 255, 100)
timerLabel.BackgroundTransparency = 1
timerLabel.Parent = timerFrame

-- ── UPDATE HANDLERS ──────────────────────────────────────────────────────
local timerRunning = false
local startTime = 0

stageUpdate.OnClientEvent:Connect(function(stage: number, total: number)
  stageLabel.Text = "Stage " .. stage .. " / " .. total
  if stage == 1 then
    timerRunning = true
    startTime = os.clock()
  end
end)

-- Timer tick
RunService.Heartbeat:Connect(function()
  if not timerRunning then return end
  local elapsed = os.clock() - startTime
  local minutes = math.floor(elapsed / 60)
  local seconds = elapsed % 60
  timerLabel.Text = string.format("%02d:%05.2f", minutes, seconds)
end)

-- Win celebration
winEvent.OnClientEvent:Connect(function(finalTime: number, bestTime: number)
  timerRunning = false
  local minutes = math.floor(finalTime / 60)
  local seconds = finalTime % 60

  stageLabel.Text = "COMPLETE!"
  stageLabel.TextColor3 = Color3.fromRGB(255, 215, 0)
  timerLabel.Text = string.format("%02d:%05.2f", minutes, seconds)

  if finalTime <= bestTime then
    timerLabel.TextColor3 = Color3.fromRGB(255, 215, 0)
    timerLabel.Text = "NEW BEST! " .. timerLabel.Text
  end
end)
```

## Obby World Builder (Visual Parts)

For the physical environment, generate these components:

### Start Platform (8 parts)
- Base platform (20x1x20, Grass, green)
- SpawnLocation on top
- Welcome arch (3 parts, Marble)
- "GO!" sign (SurfaceGui, green arrow)
- Lamp posts (2)
- Decorative border (thin Neon strip)

### Jump Platforms (3-5 parts each, x15)
- Platform part (sized by difficulty)
- Edge trim (thin colored Neon, green/yellow/red by difficulty)
- Shadow beneath (Part, dark, Transparency 0.6)
- Number indicator (BillboardGui with stage number)

### Kill Bricks (1-3 parts each)
- Kill brick (thin red Neon, `CanCollide = true`)
- Attribute: `KillBrick = true`
- Optional glow (PointLight red, Brightness 1, Range 8)

### Moving Platforms (2-3 parts each)
- Platform part (4x1x4, Metal)
- Arrow indicators on surface
- Attribute: `MovingPlatform = true`, `EndPosition = Vector3`, `MoveDuration = number`

### Checkpoints (4-5 parts each)
- SpawnLocation (6x1x6, glowing pad)
- Arch or flag marker
- Stage number display (BillboardGui)
- PointLight (green, Brightness 2)
- Sparkles when first reached

### Win Platform (10 parts)
- Large platform (16x1x16, Gold Neon)
- Trophy model (5 parts: base + cup)
- Confetti ParticleEmitters (3, different colors)
- "WINNER!" sign (SurfaceGui or BillboardGui)
- Celebration PointLights (multicolored)
- Teleport back button (ProximityPrompt)

## Design Tips

1. **Visible path** — players should always see the next 3-4 platforms
2. **Death recovery** — checkpoints every 3-4 stages so death isn't too punishing
3. **Visual difficulty cues** — green platforms = easy, yellow = medium, red = hard
4. **Rhythm** — alternate between precision jumps and timing challenges
5. **Rest spots** — large safe platforms between hard sections
6. **Theme progression** — change scenery every 5 stages (grass -> lava -> ice -> space)
7. **Satisfying movement** — moving platforms should have smooth easing (Sine), not jerky linear motion
8. **Kill brick visibility** — always clearly red/glowing so deaths feel fair, not cheap
9. **Sound cues** — checkpoint sound, death sound, win fanfare
10. **Speedrun incentive** — display personal best timer to encourage replay
