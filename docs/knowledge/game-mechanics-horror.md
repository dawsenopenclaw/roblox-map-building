# Horror Game Design for Roblox — Complete Reference

## Overview

Horror games on Roblox rely on atmosphere over gore. The formula: darkness + sound + isolation + chase = fear. Roblox's audience is young, so horror should be thrilling and spooky, not graphic. Think Doors, Apeirophobia, or The Mimic — tension-based horror with jump scares as punctuation, not the whole sentence.

---

## Lighting for Horror

Horror lighting is the single most important element. The rule: players should only see 20-30% of the environment at any time.

```lua
-- Server Script: Horror Lighting Setup
local Lighting = game:GetService("Lighting")

-- Base horror atmosphere
Lighting.Technology = Enum.Technology.Future
Lighting.Brightness = 0.15 -- nearly dark
Lighting.ClockTime = 0 -- midnight
Lighting.Ambient = Color3.fromRGB(8, 5, 12) -- deep purple-black
Lighting.OutdoorAmbient = Color3.fromRGB(5, 5, 10)
Lighting.GlobalShadows = true
Lighting.ExposureCompensation = -0.5

-- Fog: thick, oppressive, limits vision
local atmo = Instance.new("Atmosphere")
atmo.Density = 0.6
atmo.Offset = 0.2
atmo.Color = Color3.fromRGB(15, 10, 20) -- dark purple fog
atmo.Decay = Color3.fromRGB(10, 8, 15)
atmo.Glare = 0
atmo.Haze = 6 -- thick haze
atmo.Parent = Lighting

-- Subtle color grading: desaturated, cold
local cc = Instance.new("ColorCorrectionEffect")
cc.Brightness = -0.05
cc.Contrast = 0.2
cc.Saturation = -0.4 -- desaturated = creepier
cc.TintColor = Color3.fromRGB(200, 180, 220) -- slight purple tint
cc.Parent = Lighting

-- Depth of field: blurry background adds unease
local dof = Instance.new("DepthOfFieldEffect")
dof.FarIntensity = 0.3
dof.FocusDistance = 20
dof.InFocusRadius = 15
dof.NearIntensity = 0
dof.Parent = Lighting

-- Bloom: just enough to make lights eerie
local bloom = Instance.new("BloomEffect")
bloom.Intensity = 0.8
bloom.Size = 36
bloom.Threshold = 0.6
bloom.Parent = Lighting
```

### Flickering Lights

```lua
-- Script: Attach to any Part with a PointLight child
local light = script.Parent:FindFirstChildOfClass("PointLight")
if not light then return end

local baseBrightness = light.Brightness
local baseRange = light.Range

-- Pattern: random flicker with occasional full blackout
task.spawn(function()
    while script.Parent.Parent do
        -- Normal flicker
        for i = 1, math.random(5, 15) do
            light.Brightness = baseBrightness * (0.6 + math.random() * 0.4)
            light.Range = baseRange * (0.8 + math.random() * 0.2)
            task.wait(0.05 + math.random() * 0.1)
        end

        -- Chance of full blackout (10%)
        if math.random() < 0.1 then
            light.Brightness = 0
            task.wait(0.3 + math.random() * 1.5) -- darkness for 0.3-1.8 seconds
            -- Flash back with a pop
            light.Brightness = baseBrightness * 1.3
            task.wait(0.05)
        end

        -- Stable period
        light.Brightness = baseBrightness
        light.Range = baseRange
        task.wait(2 + math.random() * 5) -- stable for 2-7 seconds
    end
end)
```

---

## Sound Design

Sound creates 70% of horror atmosphere. Layer these categories:

### Ambient Sound Layer

```lua
-- Script: Horror Ambient Sound Manager (LocalScript in StarterPlayerScripts)
local SoundService = game:GetService("SoundService")

-- Main ambient drone (always playing, very low volume)
local ambientDrone = Instance.new("Sound")
ambientDrone.Name = "AmbientDrone"
ambientDrone.SoundId = "rbxassetid://9114488462" -- deep rumble/drone
ambientDrone.Volume = 0.15
ambientDrone.Looped = true
ambientDrone.Parent = SoundService
ambientDrone:Play()

-- Wind/creaking layer
local wind = Instance.new("Sound")
wind.Name = "Wind"
wind.SoundId = "rbxassetid://5982052959" -- wind through building
wind.Volume = 0.2
wind.Looped = true
wind.Parent = SoundService
wind:Play()

-- Random ambient events (whispers, distant thuds, chains)
local AMBIENT_SOUNDS = {
    {id = "rbxassetid://4813507852", volume = 0.3, name = "whisper"},      -- whisper
    {id = "rbxassetid://5996731565", volume = 0.25, name = "door_creak"},  -- door creak
    {id = "rbxassetid://4590657391", volume = 0.2, name = "chains"},       -- chains
    {id = "rbxassetid://5153734236", volume = 0.15, name = "footsteps"},   -- distant footsteps
    {id = "rbxassetid://5208655541", volume = 0.35, name = "thud"},        -- heavy thud
}

task.spawn(function()
    while true do
        task.wait(math.random(8, 25)) -- random interval between ambient events
        local sound = AMBIENT_SOUNDS[math.random(1, #AMBIENT_SOUNDS)]
        local s = Instance.new("Sound")
        s.SoundId = sound.id
        s.Volume = sound.volume
        s.Parent = SoundService
        s:Play()
        s.Ended:Connect(function() s:Destroy() end)
    end
end)
```

### Spatial Footstep Sounds

```lua
-- LocalScript: Footstep sounds that change with floor material
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local player = Players.LocalPlayer
local char = player.Character or player.CharacterAdded:Wait()
local humanoid = char:WaitForChild("Humanoid")
local root = char:WaitForChild("HumanoidRootPart")

local FOOTSTEP_SOUNDS = {
    Wood = "rbxassetid://9120900210",
    Concrete = "rbxassetid://9120900474",
    Metal = "rbxassetid://9120900666",
    Default = "rbxassetid://9120900474",
}

local stepInterval = 0.45 -- seconds between footsteps (walking)
local lastStep = 0

RunService.Heartbeat:Connect(function()
    if humanoid.MoveDirection.Magnitude < 0.1 then return end
    if tick() - lastStep < stepInterval then return end
    lastStep = tick()

    -- Raycast down to detect floor material
    local ray = workspace:Raycast(root.Position, Vector3.new(0, -5, 0))
    local material = ray and ray.Material and ray.Material.Name or "Default"
    local soundId = FOOTSTEP_SOUNDS[material] or FOOTSTEP_SOUNDS.Default

    local step = Instance.new("Sound")
    step.SoundId = soundId
    step.Volume = 0.4
    step.PlaybackSpeed = 0.9 + math.random() * 0.2 -- slight pitch variation
    step.Parent = root
    step:Play()
    step.Ended:Connect(function() step:Destroy() end)
end)
```

### Heartbeat System (Proximity to Monster)

```lua
-- LocalScript: Heartbeat that speeds up when monster is near
local heartbeat = Instance.new("Sound")
heartbeat.SoundId = "rbxassetid://142376088" -- heartbeat sound
heartbeat.Volume = 0
heartbeat.Looped = true
heartbeat.Parent = game:GetService("SoundService")
heartbeat:Play()

RunService.Heartbeat:Connect(function()
    local monster = workspace:FindFirstChild("Monster")
    if not monster then heartbeat.Volume = 0; return end
    local monsterRoot = monster:FindFirstChild("HumanoidRootPart")
    if not monsterRoot then heartbeat.Volume = 0; return end

    local char = player.Character
    if not char then return end
    local root = char:FindFirstChild("HumanoidRootPart")
    if not root then return end

    local dist = (monsterRoot.Position - root.Position).Magnitude
    local maxDist = 80

    if dist < maxDist then
        local intensity = 1 - (dist / maxDist) -- 0 = far, 1 = close
        heartbeat.Volume = intensity * 0.6
        heartbeat.PlaybackSpeed = 0.8 + intensity * 0.8 -- faster when closer
    else
        heartbeat.Volume = 0
    end
end)
```

---

## Chase Mechanics (Monster AI)

The monster is the star of a horror game. It needs to feel relentless but fair.

```lua
-- Server Script: Horror Monster AI
local PathfindingService = game:GetService("PathfindingService")
local Players = game:GetService("Players")

local MONSTER_CONFIG = {
    walkSpeed = 14,        -- slower than player sprint (16)
    chaseSpeed = 22,       -- faster than player sprint when chasing
    detectRange = 40,      -- how far it can "see"
    hearRange = 20,        -- how far it can "hear" (detect through walls)
    lineOfSight = true,    -- requires direct line of sight to start chase
    loseDuration = 5,      -- seconds of no sight before giving up chase
    killRange = 4,         -- instant kill when this close
    patrolSpeed = 8,       -- slow patrol speed
}

local monster = workspace:WaitForChild("Monster")
local monsterRoot = monster:WaitForChild("HumanoidRootPart")

local state = "patrol" -- patrol, investigate, chase, kill, reset
local target = nil
local lastSeen = 0
local investigatePos = nil

local function hasLineOfSight(from, to)
    local dir = (to - from).Unit
    local dist = (to - from).Magnitude
    local params = RaycastParams.new()
    params.FilterDescendantsInstances = {monster}
    params.FilterType = Enum.RaycastFilterType.Exclude
    local result = workspace:Raycast(from, dir * dist, params)
    if not result then return true end -- nothing blocking
    -- Check if hit is the target character
    local hitModel = result.Instance:FindFirstAncestorOfClass("Model")
    local targetChar = target and target.Character
    return hitModel == targetChar
end

local function findTarget()
    local closest, closeDist = nil, MONSTER_CONFIG.detectRange
    for _, p in Players:GetPlayers() do
        local char = p.Character
        if not char then continue end
        local root = char:FindFirstChild("HumanoidRootPart")
        if not root then continue end
        -- Skip players in hiding spots
        if char:GetAttribute("Hiding") then continue end

        local dist = (root.Position - monsterRoot.Position).Magnitude

        -- Hearing check (through walls, shorter range)
        if dist < MONSTER_CONFIG.hearRange then
            -- Check if player is running (louder = easier to hear)
            local hum = char:FindFirstChildOfClass("Humanoid")
            if hum and hum.MoveDirection.Magnitude > 0.5 then
                if dist < closeDist then closest = p; closeDist = dist end
            end
        end

        -- Line of sight check (longer range, requires clear path)
        if dist < MONSTER_CONFIG.detectRange then
            if hasLineOfSight(monsterRoot.Position + Vector3.new(0, 2, 0), root.Position + Vector3.new(0, 2, 0)) then
                if dist < closeDist then closest = p; closeDist = dist end
            end
        end
    end
    return closest
end

-- Main AI loop
task.spawn(function()
    while monster.Parent do
        task.wait(0.15) -- AI tick

        if state == "patrol" then
            -- Slow wander through the map
            local detectedPlayer = findTarget()
            if detectedPlayer then
                target = detectedPlayer
                state = "chase"
                lastSeen = tick()
                -- Play alert sound
                local alert = Instance.new("Sound")
                alert.SoundId = "rbxassetid://5208655541" -- heavy thud/growl
                alert.Volume = 1
                alert.Parent = monsterRoot
                alert:Play()
            end

        elseif state == "chase" then
            if not target or not target.Character then
                state = "patrol"; target = nil; continue
            end
            local tRoot = target.Character:FindFirstChild("HumanoidRootPart")
            if not tRoot then state = "patrol"; target = nil; continue end

            -- Check hiding
            if target.Character:GetAttribute("Hiding") then
                if tick() - lastSeen > MONSTER_CONFIG.loseDuration then
                    state = "patrol"; target = nil; continue
                end
            else
                -- Update line of sight
                if hasLineOfSight(monsterRoot.Position, tRoot.Position) then
                    lastSeen = tick()
                end

                -- Lost sight for too long
                if tick() - lastSeen > MONSTER_CONFIG.loseDuration then
                    state = "patrol"; target = nil; continue
                end
            end

            -- Move toward target
            local dir = (tRoot.Position - monsterRoot.Position).Unit
            monsterRoot.CFrame = monsterRoot.CFrame + dir * MONSTER_CONFIG.chaseSpeed * 0.15

            -- Kill check
            local dist = (tRoot.Position - monsterRoot.Position).Magnitude
            if dist < MONSTER_CONFIG.killRange then
                state = "kill"
            end

        elseif state == "kill" then
            if target and target.Character then
                local hum = target.Character:FindFirstChildOfClass("Humanoid")
                if hum then
                    hum.Health = 0
                    -- Jumpscare camera + sound (fire to client)
                    -- RemoteEvent:FireClient(target, "Jumpscare", "monster_kill")
                end
            end
            task.wait(3) -- pause after kill
            state = "patrol"
            target = nil
        end
    end
end)
```

---

## Jumpscare Triggers

```lua
-- Script: Region-based jumpscare trigger
local Players = game:GetService("Players")
local triggerZone = script.Parent -- a transparent Part marking the scare area
local fired = {} -- track per-player so it only fires once

triggerZone.Touched:Connect(function(hit)
    local char = hit:FindFirstAncestorOfClass("Model")
    if not char then return end
    local player = Players:GetPlayerFromCharacter(char)
    if not player or fired[player.UserId] then return end
    fired[player.UserId] = true

    -- Fire jumpscare to that specific client
    game.ReplicatedStorage.JumpscareEvent:FireClient(player, {
        type = "flash",           -- flash, figure, sound, or combined
        duration = 0.8,           -- how long the scare lasts
        image = "rbxassetid://0", -- optional scare image
        sound = "rbxassetid://5153734236", -- loud scare sound
        shakeIntensity = 0.15,    -- camera shake
    })
end)

-- Client-side jumpscare handler (LocalScript)
--[[
JumpscareEvent.OnClientEvent:Connect(function(data)
    -- Play sound
    local s = Instance.new("Sound")
    s.SoundId = data.sound
    s.Volume = 1.5
    s.Parent = SoundService
    s:Play()

    -- Camera shake
    local cam = workspace.CurrentCamera
    local baseCF = cam.CFrame
    task.spawn(function()
        for i = 1, math.floor(data.duration / 0.03) do
            local shake = CFrame.new(
                (math.random() - 0.5) * data.shakeIntensity,
                (math.random() - 0.5) * data.shakeIntensity,
                0
            )
            cam.CFrame = baseCF * shake
            task.wait(0.03)
        end
        cam.CFrame = baseCF
    end)

    -- Flash effect (white frame that fades)
    if data.type == "flash" then
        local sg = Instance.new("ScreenGui")
        sg.Parent = player.PlayerGui
        local f = Instance.new("Frame")
        f.Size = UDim2.new(1, 0, 1, 0)
        f.BackgroundColor3 = Color3.new(1, 1, 1)
        f.BackgroundTransparency = 0
        f.Parent = sg
        TweenService:Create(f, TweenInfo.new(data.duration), {BackgroundTransparency = 1}):Play()
        task.delay(data.duration + 0.1, function() sg:Destroy() end)
    end
end)
]]
```

---

## Inventory / Key System (Find Keys, Unlock Doors)

```lua
-- Server Script: Key & Lock puzzle system
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local KEYS = {
    red_key = {name = "Red Key", color = Color3.fromRGB(200, 40, 40), door = "RedDoor"},
    blue_key = {name = "Blue Key", color = Color3.fromRGB(40, 40, 200), door = "BlueDoor"},
    master_key = {name = "Master Key", color = Color3.fromRGB(212, 175, 55), door = "FinalDoor"},
}

local playerInventory = {} -- [userId] = {keyId = true}

-- Key pickup
local function setupKeyPickup(keyPart, keyId)
    local keyData = KEYS[keyId]
    keyPart.Color = keyData.color
    keyPart.Material = Enum.Material.Neon

    -- Glow + bob
    local pl = Instance.new("PointLight")
    pl.Brightness = 2; pl.Range = 8; pl.Color = keyData.color
    pl.Parent = keyPart

    local prompt = Instance.new("ProximityPrompt")
    prompt.ActionText = "Pick Up"
    prompt.ObjectText = keyData.name
    prompt.MaxActivationDistance = 6
    prompt.Parent = keyPart

    prompt.Triggered:Connect(function(player)
        playerInventory[player.UserId] = playerInventory[player.UserId] or {}
        playerInventory[player.UserId][keyId] = true
        keyPart:Destroy()
        -- Notify client: "Picked up " .. keyData.name
    end)
end

-- Locked door
local function setupLockedDoor(doorPart, requiredKeyId)
    local keyData = KEYS[requiredKeyId]
    local prompt = Instance.new("ProximityPrompt")
    prompt.ActionText = "Unlock"
    prompt.ObjectText = "Requires: " .. keyData.name
    prompt.MaxActivationDistance = 8
    prompt.Parent = doorPart

    prompt.Triggered:Connect(function(player)
        local inv = playerInventory[player.UserId]
        if inv and inv[requiredKeyId] then
            -- Unlock: tween door open
            local ts = game:GetService("TweenService")
            local openCF = doorPart.CFrame * CFrame.Angles(0, math.rad(90), 0)
            ts:Create(doorPart, TweenInfo.new(1), {CFrame = openCF}):Play()
            prompt:Destroy()
            -- Play unlock sound
        else
            -- "You need the " .. keyData.name .. " to open this door."
        end
    end)
end
```

---

## Flashlight Mechanics

```lua
-- LocalScript: Flashlight Tool with battery drain
local Players = game:GetService("Players")
local player = Players.LocalPlayer
local mouse = player:GetMouse()
local RunService = game:GetService("RunService")

local tool = script.Parent -- Tool in StarterPack
local handle = tool:WaitForChild("Handle")
local spotlight = handle:FindFirstChildOfClass("SpotLight")
if not spotlight then
    spotlight = Instance.new("SpotLight")
    spotlight.Brightness = 3
    spotlight.Range = 40
    spotlight.Angle = 35
    spotlight.Color = Color3.fromRGB(255, 240, 200) -- warm flashlight
    spotlight.Face = Enum.NormalId.Front
    spotlight.Shadows = true
    spotlight.Parent = handle
end

local MAX_BATTERY = 100
local DRAIN_RATE = 2 -- per second
local RECHARGE_RATE = 0.5 -- per second when off
local battery = MAX_BATTERY
local isOn = false

tool.Activated:Connect(function()
    isOn = not isOn
    spotlight.Enabled = isOn
    -- Toggle click sound
end)

RunService.Heartbeat:Connect(function(dt)
    if isOn then
        battery = math.max(0, battery - DRAIN_RATE * dt)
        if battery <= 0 then
            isOn = false
            spotlight.Enabled = false
            -- Flashlight dies sound effect
        end
        -- Flicker when battery low (<20%)
        if battery < 20 then
            spotlight.Brightness = 3 * (0.3 + math.random() * 0.7)
        end
    else
        battery = math.min(MAX_BATTERY, battery + RECHARGE_RATE * dt)
    end

    -- Update battery UI
    -- (Fire event to update a ScreenGui battery bar)
end)

-- Aim flashlight at mouse position
RunService.RenderStepped:Connect(function()
    if not isOn then return end
    local char = player.Character
    if not char then return end
    local root = char:FindFirstChild("HumanoidRootPart")
    if not root then return end

    -- Point handle toward mouse hit
    local targetPos = mouse.Hit.Position
    handle.CFrame = CFrame.new(root.Position + Vector3.new(0, 1.5, 0), targetPos)
end)
```

---

## Hiding Spots

```lua
-- Server Script: Hiding spot system (closets, under beds, lockers)
local function setupHidingSpot(part, exitOffset)
    local prompt = Instance.new("ProximityPrompt")
    prompt.ActionText = "Hide"
    prompt.ObjectText = ""
    prompt.MaxActivationDistance = 6
    prompt.HoldDuration = 0.5
    prompt.Parent = part

    prompt.Triggered:Connect(function(player)
        local char = player.Character
        if not char then return end
        local root = char:FindFirstChild("HumanoidRootPart")
        local hum = char:FindFirstChildOfClass("Humanoid")
        if not root or not hum then return end

        -- Enter hiding spot
        char:SetAttribute("Hiding", true)
        root.Anchored = true
        root.CFrame = part.CFrame -- move inside the hiding spot
        -- Make character invisible
        for _, p in char:GetDescendants() do
            if p:IsA("BasePart") then
                p.Transparency = 1
            end
        end

        -- Change prompt to "Leave"
        prompt.ActionText = "Leave"
        prompt.HoldDuration = 0

        -- Wait for player to click again to leave
        local conn
        conn = prompt.Triggered:Connect(function(leavingPlayer)
            if leavingPlayer ~= player then return end
            conn:Disconnect()
            char:SetAttribute("Hiding", false)
            root.Anchored = false
            root.CFrame = part.CFrame + (exitOffset or Vector3.new(0, 0, 3))
            for _, p in char:GetDescendants() do
                if p:IsA("BasePart") and p.Name ~= "HumanoidRootPart" then
                    p.Transparency = 0
                end
            end
            prompt.ActionText = "Hide"
            prompt.HoldDuration = 0.5
        end)
    end)
end
```

---

## Progressive Intensity

Each area of the horror game should escalate tension:

| Zone | Lighting | Sound | Threat | Mechanic |
|------|----------|-------|--------|----------|
| Entrance | Dim but visible | Subtle ambient | None | Exploration, find flashlight |
| Hallway | Flickering | Footsteps, creaks | Minor (shadow glimpses) | Find first key |
| Library | Very dark | Whispers, book thuds | Jump scare trigger | Puzzle: arrange books |
| Basement | Near-black | Heartbeat, dripping | Monster patrols | Stealth + hiding |
| Final Room | Strobe/red | Intense music, growls | Monster chase | Sprint to exit, use master key |

### Intensity Manager

```lua
-- Server Script: Progressive horror intensity by zone
local ZONES = {
    {name = "Entrance", brightness = 0.3, fogDensity = 0.3, monsterActive = false},
    {name = "Hallway", brightness = 0.15, fogDensity = 0.45, monsterActive = false},
    {name = "Library", brightness = 0.08, fogDensity = 0.5, monsterActive = false},
    {name = "Basement", brightness = 0.03, fogDensity = 0.65, monsterActive = true},
    {name = "FinalRoom", brightness = 0.01, fogDensity = 0.8, monsterActive = true},
}

-- When player enters a zone, update their lighting
local function applyZone(player, zoneIndex)
    local zone = ZONES[zoneIndex]
    -- Fire client event to smoothly transition lighting
    game.ReplicatedStorage.ZoneChange:FireClient(player, {
        brightness = zone.brightness,
        fogDensity = zone.fogDensity,
    })
    -- Activate/deactivate monster
    if zone.monsterActive then
        -- Enable monster AI
    end
end
```

---

## Design Principles for Roblox Horror

1. **Less is more** — the scariest moment is before the jumpscare, not during it. Build anticipation with sound and lighting changes.
2. **Safe rooms matter** — give players moments to breathe. A well-lit room with a save point makes the dark areas scarier by contrast.
3. **Sound sells the horror** — a perfectly lit room with creepy audio is scarier than a dark room with no sound.
4. **Chase sequences need fairness** — the monster should be faster than walking but slower than sprinting. Give players escape options (hiding spots, alternate routes).
5. **Environmental storytelling** — notes, blood trails, broken furniture, scratches on walls. Let the environment tell the story without exposition.
6. **Stamina creates tension** — limited sprint + flashlight battery = constant resource management = stress.
7. **One jumpscare per 3-5 minutes max** — overuse kills the effect. Space them out and vary the type (visual, audio, chase trigger).

This reference covers every horror system needed for Roblox. Combine these components to build a complete horror experience.
