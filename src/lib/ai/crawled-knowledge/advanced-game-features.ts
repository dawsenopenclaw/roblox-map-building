// Advanced Game Features Knowledge
// Covers: Camera Systems, Custom Character, Tool System, Day/Night, Weather, Dialog/Quest, Minimap, Loading Screen
// Distilled from DevForum community tutorials and Roblox Creator Hub docs (Apr 2026)

export const ADVANCED_GAME_FEATURES = `
=== CAMERA SYSTEMS ===

-- THIRD-PERSON FOLLOW CAMERA (LocalScript in StarterPlayerScripts)
local RunService = game:GetService("RunService")
local UserInputService = game:GetService("UserInputService")
local Players = game:GetService("Players")

local player = Players.LocalPlayer
local camera = workspace.CurrentCamera
camera.CameraType = Enum.CameraType.Scriptable

local OFFSET = Vector3.new(2, 3, 8) -- right, up, back
local sensitivity = 0.003
local yaw, pitch = 0, 0
local MIN_PITCH, MAX_PITCH = math.rad(-60), math.rad(70)

UserInputService.MouseBehavior = Enum.MouseBehavior.LockCenter
UserInputService.MouseIconEnabled = false

UserInputService.InputChanged:Connect(function(input)
    if input.UserInputType == Enum.UserInputType.MouseMovement then
        yaw   -= input.Delta.X * sensitivity
        pitch -= input.Delta.Y * sensitivity
        pitch  = math.clamp(pitch, MIN_PITCH, MAX_PITCH)
    end
end)

RunService.RenderStepped:Connect(function()
    local char = player.Character
    if not char then return end
    local root = char:FindFirstChild("HumanoidRootPart")
    if not root then return end

    local baseCF = CFrame.new(root.Position)
        * CFrame.Angles(0, yaw, 0)
        * CFrame.Angles(pitch, 0, 0)
    camera.CFrame = baseCF * CFrame.new(OFFSET.X, OFFSET.Y, OFFSET.Z)
end)

-- TOP-DOWN / ISOMETRIC CAMERA
local function setTopDown(height, angle)
    RunService.RenderStepped:Connect(function()
        local char = Players.LocalPlayer.Character
        if not char or not char:FindFirstChild("HumanoidRootPart") then return end
        local pos = char.HumanoidRootPart.Position
        camera.CameraType = Enum.CameraType.Scriptable
        camera.CFrame = CFrame.new(pos + Vector3.new(0, height, 0))
            * CFrame.Angles(math.rad(-angle), 0, 0)
    end)
end
-- setTopDown(60, 75)  -- 60 studs up, 75-degree angle

-- FIRST-PERSON LOCK
local function enableFirstPerson()
    camera.CameraType = Enum.CameraType.Scriptable
    RunService.RenderStepped:Connect(function()
        local char = Players.LocalPlayer.Character
        if not char then return end
        local head = char:FindFirstChild("Head")
        if not head then return end
        camera.CFrame = CFrame.new(head.Position, head.Position + head.CFrame.LookVector)
    end)
end

-- CUTSCENE CAMERA: Bezier path (LocalScript)
local TweenService = game:GetService("TweenService")

local function bezierPoint(p0, p1, p2, t)
    -- Quadratic Bezier interpolation
    return p0:Lerp(p1, t):Lerp(p1:Lerp(p2, t), t)
end

local function playCutscene(points, duration)
    -- points = {CFrame, CFrame, CFrame, ...} waypoints
    camera.CameraType = Enum.CameraType.Scriptable
    local steps = 60 * duration
    local dt    = 1 / steps
    local t     = 0

    for i = 1, steps do
        t = i * dt
        -- Lerp between first two and last two for smooth arc
        local segIdx = math.clamp(math.floor(t * (#points - 1)) + 1, 1, #points - 1)
        local segT   = (t * (#points - 1)) - (segIdx - 1)
        local a, b   = points[segIdx], points[math.min(segIdx + 1, #points)]
        camera.CFrame = a:Lerp(b, segT)
        task.wait(1/60)
    end
    camera.CameraType = Enum.CameraType.Custom -- restore
end

-- Example usage:
-- playCutscene({
--     CFrame.new(0, 10, 50) * CFrame.Angles(math.rad(-10), 0, 0),
--     CFrame.new(20, 15, 30) * CFrame.Angles(math.rad(-20), math.rad(30), 0),
--     CFrame.new(0,  5, 10) * CFrame.Angles(math.rad(-5),  0, 0),
-- }, 5)

-- CAMERA SHAKE (LocalScript, call on damage)
local shakeMagnitude = 0
local shakeTimer     = 0

local function shakeCamera(magnitude, duration)
    shakeMagnitude = magnitude
    shakeTimer     = duration
end

RunService.RenderStepped:Connect(function(dt)
    if shakeTimer <= 0 then return end
    shakeTimer -= dt
    local offset = Vector3.new(
        math.random(-100, 100) / 100 * shakeMagnitude,
        math.random(-100, 100) / 100 * shakeMagnitude,
        0
    )
    camera.CFrame = camera.CFrame * CFrame.new(offset)
end)

-- Zoom clamp helper
local MIN_ZOOM, MAX_ZOOM = 5, 50
Players.LocalPlayer.CameraMinZoomDistance = MIN_ZOOM
Players.LocalPlayer.CameraMaxZoomDistance = MAX_ZOOM


=== CUSTOM CHARACTER CONTROLLER ===

-- SPRINT + STAMINA (LocalScript in StarterCharacterScripts)
local UserInputService = game:GetService("UserInputService")
local RunService       = game:GetService("RunService")
local TweenService     = game:GetService("TweenService")
local Players          = game:GetService("Players")

local player    = Players.LocalPlayer
local character = player.Character or player.CharacterAdded:Wait()
local humanoid  = character:WaitForChild("Humanoid")

local BASE_SPEED   = 16
local SPRINT_SPEED = 28
local MAX_STAMINA  = 100
local DRAIN_RATE   = 20  -- per second while sprinting
local REGEN_RATE   = 15  -- per second while not sprinting
local stamina      = MAX_STAMINA
local isSprinting  = false

-- Stamina bar UI (assumes ScreenGui/StaminaBar/Fill exists)
local playerGui   = player.PlayerGui
local staminaBar  = playerGui:WaitForChild("StaminaGui"):WaitForChild("StaminaBar")
local staminaFill = staminaBar:WaitForChild("Fill")

local function updateStaminaUI()
    TweenService:Create(staminaFill, TweenInfo.new(0.1), {
        Size = UDim2.new(stamina / MAX_STAMINA, 0, 1, 0)
    }):Play()
    -- Hide bar at full stamina
    staminaBar.Visible = stamina < MAX_STAMINA
end

RunService.Heartbeat:Connect(function(dt)
    local holding = UserInputService:IsKeyDown(Enum.KeyCode.LeftShift)
    local moving  = humanoid.MoveDirection.Magnitude > 0.1

    isSprinting = holding and moving and stamina > 0

    if isSprinting then
        humanoid.WalkSpeed = SPRINT_SPEED
        stamina = math.max(0, stamina - DRAIN_RATE * dt)
    else
        humanoid.WalkSpeed = BASE_SPEED
        if stamina < MAX_STAMINA then
            stamina = math.min(MAX_STAMINA, stamina + REGEN_RATE * dt)
        end
    end
    updateStaminaUI()
end)

-- DOUBLE JUMP (LocalScript in StarterCharacterScripts)
local jumpCount   = 0
local MAX_JUMPS   = 2
local canDoubleJump = false

humanoid.StateChanged:Connect(function(old, new)
    if new == Enum.HumanoidStateType.Jumping then
        jumpCount += 1
    elseif new == Enum.HumanoidStateType.Landed then
        jumpCount = 0
        canDoubleJump = false
    elseif new == Enum.HumanoidStateType.Freefall then
        canDoubleJump = jumpCount < MAX_JUMPS
    end
end)

UserInputService.JumpRequest:Connect(function()
    if canDoubleJump and jumpCount < MAX_JUMPS then
        canDoubleJump = false
        jumpCount += 1
        humanoid:ChangeState(Enum.HumanoidStateType.Jumping)
        -- Give upward impulse
        local rootPart = character:FindFirstChild("HumanoidRootPart")
        if rootPart then
            rootPart.AssemblyLinearVelocity = Vector3.new(
                rootPart.AssemblyLinearVelocity.X,
                humanoid.JumpHeight * 2,
                rootPart.AssemblyLinearVelocity.Z
            )
        end
    end
end)

-- DASH ABILITY (LocalScript)
local DASH_FORCE     = 60
local DASH_DURATION  = 0.15
local DASH_COOLDOWN  = 1.0
local lastDash       = 0

UserInputService.InputBegan:Connect(function(input, gameProcessed)
    if gameProcessed then return end
    if input.KeyCode ~= Enum.KeyCode.Q then return end

    local now = tick()
    if now - lastDash < DASH_COOLDOWN then return end
    lastDash = now

    local rootPart = character:FindFirstChild("HumanoidRootPart")
    if not rootPart then return end

    local dir = humanoid.MoveDirection
    if dir.Magnitude < 0.1 then dir = rootPart.CFrame.LookVector end
    dir = Vector3.new(dir.X, 0, dir.Z).Unit

    -- Disable gravity briefly for clean dash
    local bodyVel = Instance.new("BodyVelocity")
    bodyVel.Velocity = dir * DASH_FORCE
    bodyVel.MaxForce  = Vector3.new(1e5, 0, 1e5)
    bodyVel.Parent    = rootPart
    task.delay(DASH_DURATION, function() bodyVel:Destroy() end)
end)

-- CUSTOM WALK ANIMATION OVERRIDE
local Animator = humanoid:WaitForChild("Animator")

local walkAnim = Instance.new("Animation")
walkAnim.AnimationId = "rbxassetid://YOUR_WALK_ANIMATION_ID"
local walkTrack = Animator:LoadAnimation(walkAnim)
walkTrack.Priority = Enum.AnimationPriority.Movement

RunService.Heartbeat:Connect(function()
    local speed = humanoid.MoveDirection.Magnitude
    if speed > 0.1 and not walkTrack.IsPlaying then
        walkTrack:Play()
    elseif speed <= 0.1 and walkTrack.IsPlaying then
        walkTrack:Stop(0.2)
    end
end)


=== TOOL SYSTEM ===

-- MELEE TOOL with Animation + Damage (Script inside Tool)
-- Tool structure: Tool > Handle (Part) > Script + LocalScript + Animation

-- SERVER SCRIPT inside Tool:
local tool      = script.Parent
local DAMAGE    = 25
local COOLDOWN  = 0.6
local RANGE     = 5
local lastSwing = 0

local hitEvent = Instance.new("RemoteEvent")
hitEvent.Name  = "HitEvent"
hitEvent.Parent = tool

tool.Activated:Connect(function()
    local player = game.Players:GetPlayerFromCharacter(tool.Parent)
    if not player then return end
    local now = tick()
    if now - lastSwing < COOLDOWN then return end
    lastSwing = now

    -- Fire to client for animation
    hitEvent:FireClient(player)

    -- Server-side raycast damage
    local char    = tool.Parent
    local rootPart = char:FindFirstChild("HumanoidRootPart")
    if not rootPart then return end

    local params = RaycastParams.new()
    params.FilterDescendantsInstances = {char}
    params.FilterType = Enum.RaycastFilterType.Exclude

    local result = workspace:Raycast(
        rootPart.Position,
        rootPart.CFrame.LookVector * RANGE,
        params
    )
    if result then
        local hit = result.Instance
        local enemyChar = hit:FindFirstAncestorOfClass("Model")
        if enemyChar then
            local humanoid = enemyChar:FindFirstChildOfClass("Humanoid")
            if humanoid and humanoid.Health > 0 then
                humanoid:TakeDamage(DAMAGE)
            end
        end
    end
end)

-- LOCAL SCRIPT inside Tool (animation):
local tool      = script.Parent
local hitEvent  = tool:WaitForChild("HitEvent")
local character = script.Parent.Parent
local animator  = character:WaitForChild("Humanoid"):WaitForChild("Animator")

local swingAnim = Instance.new("Animation")
swingAnim.AnimationId = "rbxassetid://YOUR_SWING_ANIMATION_ID"
local swingTrack = animator:LoadAnimation(swingAnim)
swingTrack.Priority = Enum.AnimationPriority.Action

hitEvent.OnClientEvent:Connect(function()
    swingTrack:Play()
end)

-- TOOL EVENTS reference:
-- tool.Equipped:Connect(function(mouse) ... end)    -- player equips tool
-- tool.Unequipped:Connect(function() ... end)       -- player unequips
-- tool.Activated:Connect(function() ... end)        -- left-click / tap
-- tool.Deactivated:Connect(function() ... end)      -- release

-- RANGED TOOL: Hitscan gun (Script inside Tool)
local tool      = script.Parent
local DAMAGE    = 30
local RANGE     = 200
local FIRE_RATE = 0.1
local lastFire  = 0

tool.Activated:Connect(function()
    local now = tick()
    if now - lastFire < FIRE_RATE then return end
    lastFire = now

    local player  = game.Players:GetPlayerFromCharacter(tool.Parent)
    if not player then return end
    local char    = tool.Parent
    local head    = char:FindFirstChild("Head")
    if not head then return end

    -- Use character LookVector for server authority (don't trust client CFrame)
    local root    = char:FindFirstChild("HumanoidRootPart")
    local origin  = root.Position + Vector3.new(0, 1.5, 0)
    local dir     = root.CFrame.LookVector

    local params = RaycastParams.new()
    params.FilterDescendantsInstances = {char}
    params.FilterType = Enum.RaycastFilterType.Exclude

    local result = workspace:Raycast(origin, dir * RANGE, params)
    if result then
        local hit     = result.Instance
        local hitChar = hit:FindFirstAncestorOfClass("Model")
        if hitChar then
            local hum = hitChar:FindFirstChildOfClass("Humanoid")
            if hum and hum.Health > 0 then
                hum:TakeDamage(DAMAGE)
            end
        end
        -- Visual hit marker via RemoteEvent to all nearby clients
    end
end)

-- TOOL COOLDOWN UI helper (LocalScript):
local function showCooldown(tool, seconds)
    local gui   = tool:FindFirstChild("CooldownGui")  -- BillboardGui on Handle
    if not gui then return end
    local bar   = gui.Frame.Bar
    local start = tick()
    while tick() - start < seconds do
        local progress = (tick() - start) / seconds
        bar.Size = UDim2.new(progress, 0, 1, 0)
        task.wait()
    end
    bar.Size = UDim2.new(1, 0, 1, 0)
end


=== DAY/NIGHT CYCLE ===

-- SMOOTH DAY/NIGHT CYCLE (Script in ServerScriptService)
local Lighting   = game:GetService("Lighting")
local TweenService = game:GetService("TweenService")

-- 1 real minute = 1 in-game hour (adjust CYCLE_DURATION to taste)
local CYCLE_DURATION = 60  -- seconds for full 24-hour cycle
local TIME_PER_SECOND = 24 / CYCLE_DURATION

-- Lighting presets for key times
local PRESETS = {
    [6]  = { Ambient = Color3.fromRGB(100, 100, 120), Brightness = 1, FogEnd = 10000 },
    [12] = { Ambient = Color3.fromRGB(150, 150, 150), Brightness = 2, FogEnd = 10000 },
    [18] = { Ambient = Color3.fromRGB(120, 80,  60),  Brightness = 1.2, FogEnd = 8000 },
    [22] = { Ambient = Color3.fromRGB(30,  30,  60),  Brightness = 0.3, FogEnd = 5000 },
}

local function applyPreset(preset)
    TweenService:Create(Lighting, TweenInfo.new(3), preset):Play()
end

local lastHour = -1
game:GetService("RunService").Heartbeat:Connect(function(dt)
    Lighting.ClockTime = (Lighting.ClockTime + TIME_PER_SECOND * dt) % 24
    local hour = math.floor(Lighting.ClockTime)
    if hour ~= lastHour and PRESETS[hour] then
        applyPreset(PRESETS[hour])
        lastHour = hour
    end
end)

-- STREETLIGHT AUTO ON/OFF (Script on each streetlight model)
-- Tag all streetlight PointLights with "StreetLight" via CollectionService
local CollectionService = game:GetService("CollectionService")

local function updateStreetLights()
    local hour = game:GetService("Lighting").ClockTime
    local isNight = hour >= 19 or hour < 6

    for _, light in CollectionService:GetTagged("StreetLight") do
        if light:IsA("PointLight") or light:IsA("SpotLight") then
            light.Enabled = isNight
            local part = light.Parent
            if part and part:IsA("BasePart") then
                part.Material = isNight and Enum.Material.Neon or Enum.Material.SmoothPlastic
            end
        end
    end
end

game:GetService("Lighting"):GetPropertyChangedSignal("ClockTime"):Connect(function()
    local hour = math.floor(game:GetService("Lighting").ClockTime)
    if hour == 6 or hour == 19 then updateStreetLights() end
end)
updateStreetLights() -- run on startup

-- NPC SCHEDULE TRIGGER: fire a RemoteEvent at specific hours
local scheduleEvents = {
    [8]  = "WorkersArrive",
    [12] = "LunchBreak",
    [18] = "WorkersLeave",
    [22] = "NightGuardStart",
}

local ScheduleEvent = Instance.new("RemoteEvent")
ScheduleEvent.Name   = "ScheduleEvent"
ScheduleEvent.Parent = game.ReplicatedStorage

local lastFiredHour = -1
game:GetService("RunService").Heartbeat:Connect(function()
    local hour = math.floor(game:GetService("Lighting").ClockTime)
    if hour ~= lastFiredHour and scheduleEvents[hour] then
        lastFiredHour = hour
        ScheduleEvent:FireAllClients(scheduleEvents[hour])
    end
end)


=== WEATHER SYSTEM ===

-- WEATHER MANAGER (ModuleScript in ReplicatedStorage)
local WeatherModule = {}

local TweenService  = game:GetService("TweenService")
local Lighting      = game:GetService("Lighting")

-- Sky Part: a large invisible Part above the map that holds a ParticleEmitter
-- Parent it to workspace, name it "SkyEmitter", 2000x1x2000 studs at Y=300
local function getSkyEmitter()
    return workspace:FindFirstChild("SkyEmitter")
end

function WeatherModule.clear()
    local sky = getSkyEmitter()
    if sky then
        for _, p in sky:GetChildren() do
            if p:IsA("ParticleEmitter") then p.Enabled = false end
            if p:IsA("Sound") then p:Stop() end
        end
    end
    TweenService:Create(Lighting, TweenInfo.new(3), {
        FogEnd    = 10000,
        FogStart  = 5000,
        Brightness = 2,
    }):Play()
    -- Turn off Atmosphere haze
    local atmo = Lighting:FindFirstChildOfClass("Atmosphere")
    if atmo then
        TweenService:Create(atmo, TweenInfo.new(3), { Haze = 0, Density = 0.3 }):Play()
    end
end

function WeatherModule.rain()
    local sky = getSkyEmitter()
    if not sky then return end

    -- Rain particle emitter settings
    local rain = sky:FindFirstChild("Rain") or Instance.new("ParticleEmitter", sky)
    rain.Name         = "Rain"
    rain.Texture      = "rbxasset://textures/particles/sparkles_main.dds"  -- use a rain texture asset
    rain.Color        = ColorSequence.new(Color3.fromRGB(180, 200, 220))
    rain.Transparency = NumberSequence.new({
        NumberSequenceKeypoint.new(0, 0.4),
        NumberSequenceKeypoint.new(1, 1),
    })
    rain.LightEmission  = 0
    rain.LightInfluence = 1
    rain.Rate           = 400
    rain.Lifetime       = NumberRange.new(1.5, 2.5)
    rain.Speed          = NumberRange.new(50, 70)
    rain.SpreadAngle    = Vector2.new(5, 5)
    rain.Direction      = Vector3.new(0, -1, 0)
    rain.RotSpeed       = NumberRange.new(0, 0)
    rain.Rotation       = NumberRange.new(0, 0)
    rain.Size           = NumberSequence.new({
        NumberSequenceKeypoint.new(0, 0.05),
        NumberSequenceKeypoint.new(1, 0.05),
    })
    rain.Enabled = true

    -- Fog + sound
    TweenService:Create(Lighting, TweenInfo.new(3), {
        FogEnd   = 300,
        FogStart = 100,
        Brightness = 1.2,
    }):Play()

    local atmo = Lighting:FindFirstChildOfClass("Atmosphere")
    if atmo then
        TweenService:Create(atmo, TweenInfo.new(3), { Haze = 1.5, Density = 0.6 }):Play()
    end

    local rainSound = sky:FindFirstChild("RainSound")
    if not rainSound then
        rainSound        = Instance.new("Sound", sky)
        rainSound.Name   = "RainSound"
        rainSound.SoundId = "rbxassetid://6042058725"  -- rain sound
        rainSound.Looped = true
        rainSound.Volume = 0.5
    end
    rainSound:Play()
end

function WeatherModule.snow()
    local sky = getSkyEmitter()
    if not sky then return end

    local snow = sky:FindFirstChild("Snow") or Instance.new("ParticleEmitter", sky)
    snow.Name         = "Snow"
    snow.Color        = ColorSequence.new(Color3.fromRGB(240, 245, 255))
    snow.LightEmission  = 0
    snow.LightInfluence = 1
    snow.Rate           = 150
    snow.Lifetime       = NumberRange.new(3, 5)
    snow.Speed          = NumberRange.new(8, 15)
    snow.SpreadAngle    = Vector2.new(30, 30)
    snow.Direction      = Vector3.new(0, -1, 0)
    snow.RotSpeed       = NumberRange.new(-45, 45)
    snow.Size           = NumberSequence.new({
        NumberSequenceKeypoint.new(0, 0.2),
        NumberSequenceKeypoint.new(1, 0.2),
    })
    snow.Enabled = true

    TweenService:Create(Lighting, TweenInfo.new(3), {
        FogEnd   = 500,
        FogStart = 200,
        Brightness = 1.5,
        Ambient = Color3.fromRGB(200, 210, 230),
    }):Play()
end

function WeatherModule.thunder()
    -- Call WeatherModule.rain() first, then call this for lightning flash
    -- LocalScript calls this on client
    local screenFlash = Instance.new("ColorCorrectionEffect", Lighting)
    screenFlash.Brightness = 0.8
    screenFlash.Saturation  = -0.5

    -- Thunder sound
    local thunder = Instance.new("Sound", workspace)
    thunder.SoundId  = "rbxassetid://9120617920"
    thunder.Volume   = 1
    thunder:Play()
    game:GetService("Debris"):AddItem(thunder, 5)

    -- Quick flash then back
    task.delay(0.05, function()
        TweenService:Create(screenFlash, TweenInfo.new(0.4), {
            Brightness = 0, Saturation = 0
        }):Play()
        task.delay(0.5, function() screenFlash:Destroy() end)
    end)
end

-- PUDDLES: When rain starts, enable puddle decals tagged "RainPuddle"
function WeatherModule.togglePuddles(enable)
    local CollectionService = game:GetService("CollectionService")
    for _, decal in CollectionService:GetTagged("RainPuddle") do
        decal.Transparency = enable and 0.3 or 1
    end
end

-- RANDOM WEATHER CYCLE (Script in ServerScriptService):
-- local WeatherModule = require(game.ReplicatedStorage.WeatherModule)
-- local WeatherEvent  = game.ReplicatedStorage.WeatherEvent  -- RemoteEvent
-- local weathers = {"clear", "rain", "snow"}
-- while true do
--     local w = weathers[math.random(1, #weathers)]
--     WeatherEvent:FireAllClients(w)
--     task.wait(math.random(120, 300))
-- end

return WeatherModule


=== DIALOG / QUEST NPC SYSTEM ===

-- NPC DIALOG SYSTEM OVERVIEW:
-- 1. ProximityPrompt on NPC model triggers dialog UI (LocalScript)
-- 2. Dialog UI shows text + choice buttons (branching)
-- 3. Accepting quest fires RemoteEvent to server
-- 4. Server stores active quests in player data
-- 5. Client updates objective tracker UI

-- NPC MODEL SETUP (server, in ServerScriptService or model Script):
-- Each NPC model has: ProximityPrompt, StringValue "DialogId", StringValue "QuestId"

-- DIALOG DATA (ModuleScript in ReplicatedStorage):
local DialogModule = {}

DialogModule.dialogs = {
    NPC_Blacksmith = {
        greeting = "Ahh, a traveler! I need your help.",
        choices  = {
            { text = "What do you need?",  next = "offer_quest" },
            { text = "Goodbye.",           next = "bye" },
        },
        offer_quest = {
            text    = "Collect 5 Iron Ore from the cave. I'll pay well!",
            choices = {
                { text = "I'll do it!",  next = "accept_quest", action = "ACCEPT_QUEST" },
                { text = "No thanks.",   next = "bye" },
            },
        },
        accept_quest = {
            text    = "Wonderful! The cave is north of here. Good luck!",
            choices = { { text = "I'll be back.", next = nil } },
        },
        bye = {
            text    = "Safe travels.",
            choices = {},
        },
    },
}

return DialogModule

-- CLIENT DIALOG HANDLER (LocalScript in StarterPlayerScripts):
-- Wire up ProximityPrompts across all NPCs
local Players            = game:GetService("Players")
local ReplicatedStorage  = game:GetService("ReplicatedStorage")
local DialogModule       = require(ReplicatedStorage.DialogModule)

local player    = Players.LocalPlayer
local playerGui = player.PlayerGui
local dialogGui = playerGui:WaitForChild("DialogGui")  -- ScreenGui
local textLabel = dialogGui:WaitForChild("TextLabel")
local choiceFrame = dialogGui:WaitForChild("ChoiceFrame")

local QuestEvent = ReplicatedStorage:WaitForChild("QuestEvent")  -- RemoteEvent

local function clearChoices()
    for _, c in choiceFrame:GetChildren() do
        if c:IsA("TextButton") then c:Destroy() end
    end
end

local function showDialog(dialogId, nodeKey)
    local npcData = DialogModule.dialogs[dialogId]
    if not npcData then return end

    local node = nodeKey == "greeting" and npcData or npcData[nodeKey]
    if not node then dialogGui.Enabled = false return end

    dialogGui.Enabled = true
    -- Typewriter effect
    textLabel.Text = ""
    local fullText = nodeKey == "greeting" and npcData.greeting or node.text
    for i = 1, #fullText do
        textLabel.Text = fullText:sub(1, i)
        task.wait(0.03)
    end

    clearChoices()
    local choices = nodeKey == "greeting" and npcData.choices or node.choices
    for _, choice in ipairs(choices) do
        local btn         = Instance.new("TextButton", choiceFrame)
        btn.Text          = choice.text
        btn.AutomaticSize = Enum.AutomaticSize.Y

        btn.MouseButton1Click:Connect(function()
            if choice.action == "ACCEPT_QUEST" then
                QuestEvent:FireServer("ACCEPT", dialogId)
            end
            if choice.next then
                showDialog(dialogId, choice.next)
            else
                dialogGui.Enabled = false
            end
        end)
    end
end

-- Attach to all NPC ProximityPrompts
local function hookNPC(npc)
    local prompt = npc:FindFirstChildOfClass("ProximityPrompt")
    if not prompt then return end
    local dialogId = npc:FindFirstChild("DialogId")
    if not dialogId then return end

    prompt.Triggered:Connect(function(player)
        if player == Players.LocalPlayer then
            showDialog(dialogId.Value, "greeting")
        end
    end)
end

for _, npc in workspace:GetDescendants() do
    if npc:IsA("Model") and npc:FindFirstChildOfClass("ProximityPrompt") then
        hookNPC(npc)
    end
end
workspace.DescendantAdded:Connect(function(inst)
    if inst:IsA("Model") then hookNPC(inst) end
end)

-- QUEST SERVER HANDLER (Script in ServerScriptService):
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local QuestEvent        = ReplicatedStorage:WaitForChild("QuestEvent")

local QUEST_DATA = {
    NPC_Blacksmith = {
        objective = "Collect Iron Ore",
        target    = "IronOre",
        count     = 5,
        reward    = { Cash = 100 },
    },
}

local playerQuests = {}  -- {[userId] = {questId=..., progress=0, completed=false}}

QuestEvent.OnServerEvent:Connect(function(player, action, questId)
    local userId = player.UserId
    if action == "ACCEPT" and QUEST_DATA[questId] then
        playerQuests[userId] = { questId = questId, progress = 0, completed = false }
        QuestEvent:FireClient(player, "STARTED", questId, QUEST_DATA[questId].objective)
    end
end)

-- Call this from item collection logic:
local function onItemCollected(player, itemName)
    local uid   = player.UserId
    local quest = playerQuests[uid]
    if not quest or quest.completed then return end

    local qData = QUEST_DATA[quest.questId]
    if qData and qData.target == itemName then
        quest.progress += 1
        QuestEvent:FireClient(player, "PROGRESS", quest.progress, qData.count)

        if quest.progress >= qData.count then
            quest.completed = true
            -- Grant reward
            local ls = player.leaderstats
            if ls and ls:FindFirstChild("Cash") then
                ls.Cash.Value += qData.reward.Cash
            end
            QuestEvent:FireClient(player, "COMPLETE", quest.questId)
        end
    end
end


=== MINIMAP SYSTEM ===

-- MINIMAP using ViewportFrame (LocalScript in StarterPlayerScripts)
-- Overview: render a top-down camera inside a ViewportFrame to show local area
-- UI: ScreenGui > MinimapFrame (corner) > ViewportFrame + PlayerDots Frame

local Players           = game:GetService("Players")
local RunService        = game:GetService("RunService")

local player    = Players.LocalPlayer
local playerGui = player.PlayerGui
local minimapGui    = playerGui:WaitForChild("MinimapGui")
local viewportFrame = minimapGui:WaitForChild("ViewportFrame")  -- square, e.g. 200x200
local dotsFrame     = minimapGui:WaitForChild("DotsFrame")      -- overlay Frame, same size

-- ViewportFrame camera — top-down orthographic approximation
local vpCamera        = Instance.new("Camera")
vpCamera.Parent       = viewportFrame
viewportFrame.CurrentCamera = vpCamera

local MAP_HEIGHT  = 120  -- studs above ground
local MAP_RADIUS  = 80   -- studs radius shown
local ZOOM        = 1    -- increase to zoom out

RunService.RenderStepped:Connect(function()
    local char = player.Character
    if not char then return end
    local root = char:FindFirstChild("HumanoidRootPart")
    if not root then return end

    -- Point camera straight down at player
    vpCamera.CFrame      = CFrame.new(root.Position + Vector3.new(0, MAP_HEIGHT, 0))
        * CFrame.Angles(math.rad(-90), 0, 0)
    vpCamera.FieldOfView = math.deg(2 * math.atan((MAP_RADIUS * ZOOM) / MAP_HEIGHT))

    -- Update player dots
    for _, dot in dotsFrame:GetChildren() do
        if dot:IsA("Frame") then dot:Destroy() end
    end

    for _, p in Players:GetPlayers() do
        local pChar = p.Character
        if not pChar then continue end
        local pRoot = pChar:FindFirstChild("HumanoidRootPart")
        if not pRoot then continue end

        local relPos = pRoot.Position - root.Position
        local normX  = (relPos.X / MAP_RADIUS) * 0.5 + 0.5
        local normY  = (relPos.Z / MAP_RADIUS) * -0.5 + 0.5

        if normX >= 0 and normX <= 1 and normY >= 0 and normY <= 1 then
            local dot         = Instance.new("Frame", dotsFrame)
            dot.Size          = UDim2.fromOffset(8, 8)
            dot.AnchorPoint   = Vector2.new(0.5, 0.5)
            dot.Position      = UDim2.fromScale(normX, normY)
            dot.BackgroundColor3 = p == player
                and Color3.fromRGB(0, 255, 100)  -- self = green
                or  Color3.fromRGB(255, 80, 80)  -- others = red
            dot.BorderSizePixel = 0
            local corner = Instance.new("UICorner", dot)
            corner.CornerRadius = UDim.new(1, 0)
        end
    end
end)

-- POI MARKER helper (call when adding quest markers):
local function addPOIMarker(worldPos, color, icon)
    -- worldPos: Vector3 in workspace
    -- This creates a static dot; connect to RunService to update positions
    local marker = Instance.new("ImageLabel", dotsFrame)
    marker.Size            = UDim2.fromOffset(14, 14)
    marker.AnchorPoint     = Vector2.new(0.5, 0.5)
    marker.BackgroundTransparency = 1
    marker.Image           = icon or "rbxassetid://7734056009"  -- star icon
    marker.ImageColor3     = color or Color3.fromRGB(255, 220, 0)

    -- Update position each frame
    local conn
    conn = RunService.RenderStepped:Connect(function()
        if not marker.Parent then conn:Disconnect() return end
        local char = player.Character
        if not char then return end
        local root = char:FindFirstChild("HumanoidRootPart")
        if not root then return end

        local relPos = worldPos - root.Position
        local normX  = (relPos.X / MAP_RADIUS) * 0.5 + 0.5
        local normY  = (relPos.Z / MAP_RADIUS) * -0.5 + 0.5
        marker.Position = UDim2.fromScale(normX, normY)
        marker.Visible  = normX >= 0 and normX <= 1 and normY >= 0 and normY <= 1
    end)

    return marker  -- caller can destroy it when POI is done
end

-- COMPASS ROTATION: rotate the map frame to follow camera yaw
RunService.RenderStepped:Connect(function()
    local camera = workspace.CurrentCamera
    local _, yaw, _ = camera.CFrame:ToEulerAnglesYXZ()
    minimapGui.MinimapFrame.Rotation = math.deg(-yaw)
end)


=== LOADING SCREEN ===

-- LOADING SCREEN (LocalScript in ReplicatedFirst)
-- Place this LocalScript in ReplicatedFirst (loads before everything else)

local ReplicatedFirst   = game:GetService("ReplicatedFirst")
local ContentProvider   = game:GetService("ContentProvider")
local TweenService      = game:GetService("TweenService")
local Players           = game:GetService("Players")

ReplicatedFirst:RemoveDefaultLoadingScreen()

local player    = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

-- Build loading screen UI programmatically
local screenGui = Instance.new("ScreenGui", playerGui)
screenGui.Name            = "LoadingScreen"
screenGui.IgnoreGuiInset  = true
screenGui.ResetOnSpawn    = false
screenGui.DisplayOrder    = 100

local bg = Instance.new("Frame", screenGui)
bg.Size                = UDim2.fromScale(1, 1)
bg.BackgroundColor3    = Color3.fromRGB(10, 10, 10)
bg.BorderSizePixel     = 0

local logo = Instance.new("TextLabel", bg)
logo.Text              = "YOUR GAME NAME"
logo.Font              = Enum.Font.GothamBold
logo.TextColor3        = Color3.fromRGB(212, 175, 55)  -- ForjeGames gold
logo.TextSize          = 48
logo.BackgroundTransparency = 1
logo.Size              = UDim2.fromScale(1, 0.15)
logo.Position          = UDim2.fromScale(0, 0.3)

local barBg = Instance.new("Frame", bg)
barBg.Size             = UDim2.new(0.5, 0, 0, 8)
barBg.Position         = UDim2.fromScale(0.25, 0.65)
barBg.BackgroundColor3 = Color3.fromRGB(40, 40, 40)
barBg.BorderSizePixel  = 0
Instance.new("UICorner", barBg).CornerRadius = UDim.new(1, 0)

local barFill = Instance.new("Frame", barBg)
barFill.Size             = UDim2.fromScale(0, 1)
barFill.BackgroundColor3 = Color3.fromRGB(212, 175, 55)
barFill.BorderSizePixel  = 0
Instance.new("UICorner", barFill).CornerRadius = UDim.new(1, 0)

local tipLabel = Instance.new("TextLabel", bg)
tipLabel.BackgroundTransparency = 1
tipLabel.TextColor3  = Color3.fromRGB(180, 180, 180)
tipLabel.TextSize    = 16
tipLabel.Font        = Enum.Font.Gotham
tipLabel.Size        = UDim2.new(0.6, 0, 0, 30)
tipLabel.Position    = UDim2.new(0.2, 0, 0.72, 0)

local TIPS = {
    "Tip: Press Q to dash away from danger!",
    "Tip: Talk to NPCs for quests and rewards.",
    "Tip: The weather changes every few minutes.",
    "Tip: Hold Shift to sprint — watch your stamina!",
}

local pctLabel = Instance.new("TextLabel", bg)
pctLabel.BackgroundTransparency = 1
pctLabel.TextColor3  = Color3.fromRGB(212, 175, 55)
pctLabel.TextSize    = 14
pctLabel.Font        = Enum.Font.GothamBold
pctLabel.Size        = UDim2.new(0.5, 0, 0, 20)
pctLabel.Position    = UDim2.new(0.25, 0, 0.67, 0)
pctLabel.Text        = "0%"

-- Collect all assets to preload
local assets = {}
for _, desc in game:GetDescendants() do
    if desc:IsA("BasePart") or desc:IsA("Decal") or desc:IsA("Texture")
        or desc:IsA("Sound") or desc:IsA("Animation") or desc:IsA("MeshPart")
    then
        table.insert(assets, desc)
    end
end

local totalAssets = #assets
local loaded      = 0
local MIN_TIME    = 2  -- minimum seconds to show screen
local startTime   = tick()

-- Tip rotation
local tipIndex = 1
local function rotateTip()
    while screenGui.Parent do
        tipLabel.Text = TIPS[tipIndex]
        tipIndex = tipIndex % #TIPS + 1
        task.wait(3)
    end
end
task.spawn(rotateTip)

-- Preload with progress callback
ContentProvider:PreloadAsync(assets, function(_, status)
    loaded += 1
    local progress = loaded / math.max(totalAssets, 1)
    TweenService:Create(barFill, TweenInfo.new(0.1), {
        Size = UDim2.fromScale(progress, 1)
    }):Play()
    pctLabel.Text = math.floor(progress * 100) .. "%"
end)

-- Ensure minimum display time
local elapsed = tick() - startTime
if elapsed < MIN_TIME then
    task.wait(MIN_TIME - elapsed)
end

-- Fade out
TweenService:Create(bg, TweenInfo.new(0.8), { BackgroundTransparency = 1 }):Play()
for _, child in bg:GetDescendants() do
    if child:IsA("GuiObject") then
        TweenService:Create(child, TweenInfo.new(0.8), {
            BackgroundTransparency = 1,
            TextTransparency       = 1,
            ImageTransparency      = 1,
        }):Play()
    end
end

task.wait(0.9)
screenGui:Destroy()
`

export default ADVANCED_GAME_FEATURES
