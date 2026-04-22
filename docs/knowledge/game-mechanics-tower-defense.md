# Tower Defense Game Design for Roblox — Complete Reference

## Overview

Tower defense (TD) is a proven genre on Roblox — games like Tower Defense Simulator and All Star Tower Defense pull millions of players. The core loop: enemies walk a path → player places towers to stop them → earn gold per kill → upgrade towers → survive waves. What makes TD addictive is the strategic depth of tower placement and the satisfaction of mowing down enemy waves.

---

## Path / Waypoint System

Enemies follow a predefined path through the map. The path is defined by an ordered set of waypoints (Parts in workspace).

```lua
-- Server Script: Waypoint path system
local PATH_FOLDER = workspace:WaitForChild("Path") -- Folder of Parts named "1", "2", "3"...

-- Sort waypoints numerically
local waypoints = {}
for _, wp in PATH_FOLDER:GetChildren() do
    if wp:IsA("BasePart") then
        table.insert(waypoints, {part = wp, index = tonumber(wp.Name) or 0})
    end
end
table.sort(waypoints, function(a, b) return a.index < b.index end)

local PATH = {}
for _, wp in waypoints do
    table.insert(PATH, wp.part.Position)
end

-- Visualize path (optional: create a road between waypoints)
local function buildPathVisual()
    for i = 1, #PATH - 1 do
        local p1, p2 = PATH[i], PATH[i + 1]
        local mid = (p1 + p2) / 2
        local dist = (p2 - p1).Magnitude

        local road = Instance.new("Part")
        road.Name = "PathSegment_" .. i
        road.Size = Vector3.new(6, 0.5, dist) -- 6 studs wide road
        road.CFrame = CFrame.new(mid, p2) -- look at next waypoint
        road.Anchored = true
        road.CanCollide = true
        road.Material = Enum.Material.Concrete
        road.Color = Color3.fromRGB(70, 65, 60)
        road.Parent = workspace.PathVisuals
    end
end
```

---

## Enemy Pathfollowing

```lua
-- Server Script: Enemy movement along waypoints
local TweenService = game:GetService("TweenService")

local function createEnemy(config)
    -- config: name, health, speed, reward, model (or default), isBoss, isFlying
    local enemy = Instance.new("Model")
    enemy.Name = config.name

    local body = Instance.new("Part")
    body.Name = "HumanoidRootPart"
    body.Size = config.isBoss and Vector3.new(4, 4, 4) or Vector3.new(2, 2, 2)
    body.Shape = Enum.PartType.Ball
    body.CFrame = CFrame.new(PATH[1])
    body.Anchored = true
    body.CanCollide = false
    body.Material = Enum.Material.Concrete
    body.Color = config.color or Color3.fromRGB(180, 50, 50)
    body.Parent = enemy

    -- Humanoid for health
    local hum = Instance.new("Humanoid")
    hum.MaxHealth = config.health
    hum.Health = config.health
    hum.Parent = enemy

    -- Health bar
    local hpGui = Instance.new("BillboardGui")
    hpGui.Size = UDim2.new(0, 60, 0, 8)
    hpGui.StudsOffset = Vector3.new(0, 2.5, 0)
    hpGui.Parent = body

    local hpBg = Instance.new("Frame")
    hpBg.Size = UDim2.new(1, 0, 1, 0)
    hpBg.BackgroundColor3 = Color3.fromRGB(30, 30, 30)
    hpBg.BorderSizePixel = 0
    hpBg.Parent = hpGui
    Instance.new("UICorner", hpBg).CornerRadius = UDim.new(0, 4)

    local hpFill = Instance.new("Frame")
    hpFill.Name = "Fill"
    hpFill.Size = UDim2.new(1, 0, 1, 0)
    hpFill.BackgroundColor3 = Color3.fromRGB(200, 40, 40)
    hpFill.BorderSizePixel = 0
    hpFill.Parent = hpBg
    Instance.new("UICorner", hpFill).CornerRadius = UDim.new(0, 4)

    -- HP update
    hum.HealthChanged:Connect(function(newHealth)
        local ratio = math.clamp(newHealth / hum.MaxHealth, 0, 1)
        hpFill.Size = UDim2.new(ratio, 0, 1, 0)
        -- Color shifts from green to red
        hpFill.BackgroundColor3 = Color3.fromRGB(200 * (1 - ratio), 200 * ratio, 40)
    end)

    enemy.PrimaryPart = body
    enemy.Parent = workspace.Enemies

    -- Move along path
    task.spawn(function()
        for i = 2, #PATH do
            if hum.Health <= 0 then break end

            local target = PATH[i]
            local dist = (target - body.Position).Magnitude
            local duration = dist / config.speed

            local tween = TweenService:Create(body, TweenInfo.new(duration, Enum.EasingStyle.Linear), {
                CFrame = CFrame.new(target),
            })
            tween:Play()
            tween.Completed:Wait()
        end

        -- Reached the end — deal damage to player lives
        if hum.Health > 0 then
            lives -= 1
            updateLivesDisplay()
            if lives <= 0 then
                gameOver()
            end
        end
        enemy:Destroy()
    end)

    -- Death handler
    hum.Died:Connect(function()
        -- Reward gold to nearest player / all players
        for _, player in game.Players:GetPlayers() do
            local ls = player:FindFirstChild("leaderstats")
            if ls then
                local gold = ls:FindFirstChild("Gold")
                if gold then gold.Value += config.reward end
            end
        end
        enemy:Destroy()
    end)

    return enemy
end
```

---

## Tower Placement System

### Grid Snap + Validation

```lua
-- Server Script: Tower placement with grid snapping
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local PlaceTower = Instance.new("RemoteFunction")
PlaceTower.Name = "PlaceTower"
PlaceTower.Parent = ReplicatedStorage

local GRID_SIZE = 4 -- snap to 4-stud grid
local PLACEMENT_ZONES = workspace:WaitForChild("PlacementZones") -- Parts where towers can go

local function snapToGrid(position)
    return Vector3.new(
        math.round(position.X / GRID_SIZE) * GRID_SIZE,
        position.Y,
        math.round(position.Z / GRID_SIZE) * GRID_SIZE
    )
end

local function isValidPlacement(position, towerSize)
    -- Check 1: Is position on a placement zone?
    local onZone = false
    for _, zone in PLACEMENT_ZONES:GetChildren() do
        local zoneMin = zone.Position - zone.Size / 2
        local zoneMax = zone.Position + zone.Size / 2
        if position.X >= zoneMin.X and position.X <= zoneMax.X
            and position.Z >= zoneMin.Z and position.Z <= zoneMax.Z then
            onZone = true
            break
        end
    end
    if not onZone then return false, "Must place on valid ground" end

    -- Check 2: Not overlapping another tower
    for _, existing in workspace.Towers:GetChildren() do
        local dist = (existing.PrimaryPart.Position - position).Magnitude
        if dist < GRID_SIZE then
            return false, "Too close to another tower"
        end
    end

    -- Check 3: Not on the path
    for i = 1, #PATH - 1 do
        local p1, p2 = PATH[i], PATH[i + 1]
        -- Simple distance-to-line-segment check
        local seg = p2 - p1
        local t = math.clamp((position - p1):Dot(seg) / seg:Dot(seg), 0, 1)
        local closest = p1 + seg * t
        if (position - closest).Magnitude < 5 then
            return false, "Cannot place on path"
        end
    end

    return true
end

PlaceTower.OnServerInvoke = function(player, towerType, rawPosition)
    -- Validate tower type
    local towerData = TOWER_TYPES[towerType]
    if not towerData then return {success = false, reason = "Invalid tower"} end

    -- Check gold
    local ls = player:FindFirstChild("leaderstats")
    if not ls then return {success = false, reason = "No data"} end
    local gold = ls:FindFirstChild("Gold")
    if not gold or gold.Value < towerData.cost then
        return {success = false, reason = "Not enough gold (" .. towerData.cost .. " needed)"}
    end

    -- Snap and validate
    local snapped = snapToGrid(rawPosition)
    local valid, reason = isValidPlacement(snapped, towerData.size)
    if not valid then return {success = false, reason = reason} end

    -- Deduct gold
    gold.Value -= towerData.cost

    -- Create tower
    local tower = buildTower(towerType, snapped, player)
    return {success = true, towerId = tower.Name}
end
```

---

## Tower Types

```lua
local TOWER_TYPES = {
    Archer = {
        name = "Archer Tower",
        cost = 100,
        size = Vector3.new(3, 6, 3),
        range = 25,
        damage = 10,
        fireRate = 1.0, -- attacks per second
        targetType = "single", -- single, splash, slow, buff
        upgrades = {
            {cost = 150, damage = 15, range = 28, fireRate = 1.2, name = "Marksman"},
            {cost = 350, damage = 25, range = 32, fireRate = 1.5, name = "Sniper"},
            {cost = 800, damage = 50, range = 40, fireRate = 2.0, name = "Elite Sniper"},
        },
    },
    Cannon = {
        name = "Cannon Tower",
        cost = 200,
        size = Vector3.new(4, 5, 4),
        range = 18,
        damage = 30,
        fireRate = 0.5,
        targetType = "splash",
        splashRadius = 8,
        upgrades = {
            {cost = 250, damage = 50, splashRadius = 10, name = "Mortar"},
            {cost = 500, damage = 80, splashRadius = 12, name = "Howitzer"},
            {cost = 1200, damage = 150, splashRadius = 16, name = "Nuke Launcher"},
        },
    },
    Ice = {
        name = "Ice Tower",
        cost = 150,
        size = Vector3.new(3, 5, 3),
        range = 20,
        damage = 5,
        fireRate = 0.8,
        targetType = "slow",
        slowPercent = 0.3, -- 30% slow
        slowDuration = 2,
        upgrades = {
            {cost = 200, slowPercent = 0.5, range = 24, name = "Frost Tower"},
            {cost = 450, slowPercent = 0.7, damage = 15, name = "Blizzard Tower"},
            {cost = 1000, slowPercent = 0.9, damage = 30, name = "Absolute Zero"},
        },
    },
    Commander = {
        name = "Commander Tower",
        cost = 300,
        size = Vector3.new(3, 7, 3),
        range = 15,
        damage = 0,
        fireRate = 0,
        targetType = "buff",
        buffPercent = 0.2, -- 20% damage boost to nearby towers
        buffRange = 20,
        upgrades = {
            {cost = 400, buffPercent = 0.35, buffRange = 25, name = "Captain"},
            {cost = 700, buffPercent = 0.5, buffRange = 30, name = "General"},
            {cost = 1500, buffPercent = 0.75, buffRange = 35, name = "Supreme Commander"},
        },
    },
}
```

### Tower Attack Logic

```lua
-- Server Script: Tower targeting and attacking
local function towerAttackLoop(tower, towerData)
    local towerPos = tower.PrimaryPart.Position
    local fireInterval = 1 / towerData.fireRate
    local currentUpgrade = 0

    while tower.Parent do
        task.wait(fireInterval)

        -- Find target in range
        local bestTarget, bestDist = nil, towerData.range + 1
        for _, enemyModel in workspace.Enemies:GetChildren() do
            local eRoot = enemyModel:FindFirstChild("HumanoidRootPart")
            local eHum = enemyModel:FindFirstChildOfClass("Humanoid")
            if not eRoot or not eHum or eHum.Health <= 0 then continue end

            local dist = (eRoot.Position - towerPos).Magnitude
            if dist < bestDist then
                bestTarget = enemyModel
                bestDist = dist
            end
        end

        if not bestTarget then continue end

        local eRoot = bestTarget:FindFirstChild("HumanoidRootPart")
        local eHum = bestTarget:FindFirstChildOfClass("Humanoid")

        if towerData.targetType == "single" then
            eHum:TakeDamage(towerData.damage)
            -- Visual: beam/projectile from tower to enemy
            createProjectile(towerPos + Vector3.new(0, 3, 0), eRoot.Position)

        elseif towerData.targetType == "splash" then
            -- Damage all enemies in splash radius
            for _, otherEnemy in workspace.Enemies:GetChildren() do
                local otherRoot = otherEnemy:FindFirstChild("HumanoidRootPart")
                local otherHum = otherEnemy:FindFirstChildOfClass("Humanoid")
                if otherRoot and otherHum and otherHum.Health > 0 then
                    if (otherRoot.Position - eRoot.Position).Magnitude < towerData.splashRadius then
                        otherHum:TakeDamage(towerData.damage)
                    end
                end
            end
            -- Visual: explosion at target position
            createExplosionEffect(eRoot.Position)

        elseif towerData.targetType == "slow" then
            eHum:TakeDamage(towerData.damage)
            -- Apply slow effect (reduce walk speed attribute)
            bestTarget:SetAttribute("SlowPercent", towerData.slowPercent)
            bestTarget:SetAttribute("SlowExpires", tick() + towerData.slowDuration)
            -- Visual: ice effect
            createIceEffect(eRoot.Position)

        elseif towerData.targetType == "buff" then
            -- Boost nearby towers (handled separately in buff loop)
        end
    end
end

-- Projectile visual
local function createProjectile(from, to)
    local projectile = Instance.new("Part")
    projectile.Size = Vector3.new(0.3, 0.3, 0.3)
    projectile.Shape = Enum.PartType.Ball
    projectile.CFrame = CFrame.new(from)
    projectile.Anchored = true
    projectile.CanCollide = false
    projectile.Material = Enum.Material.Neon
    projectile.Color = Color3.fromRGB(255, 200, 50)
    projectile.Parent = workspace.Effects

    local tween = TweenService:Create(projectile, TweenInfo.new(0.2, Enum.EasingStyle.Linear), {
        CFrame = CFrame.new(to),
    })
    tween:Play()
    tween.Completed:Connect(function() projectile:Destroy() end)
end
```

---

## Wave System

```lua
-- Server Script: Wave Manager
local WAVES = {
    -- Wave 1: easy, few enemies
    {
        enemies = {
            {type = "Basic",  count = 5,  delay = 1.5},
        },
        reward = 50, -- bonus gold for clearing wave
    },
    -- Wave 2: more enemies
    {
        enemies = {
            {type = "Basic",  count = 8,  delay = 1.2},
        },
        reward = 75,
    },
    -- Wave 3: introduce fast enemies
    {
        enemies = {
            {type = "Basic",  count = 6,  delay = 1.0},
            {type = "Fast",   count = 4,  delay = 0.8},
        },
        reward = 100,
    },
    -- Wave 5: first tank enemy
    {
        enemies = {
            {type = "Basic",  count = 10, delay = 1.0},
            {type = "Fast",   count = 5,  delay = 0.8},
            {type = "Tank",   count = 2,  delay = 3.0},
        },
        reward = 200,
    },
    -- Wave 10: BOSS WAVE
    {
        enemies = {
            {type = "Basic",  count = 15, delay = 0.8},
            {type = "Fast",   count = 8,  delay = 0.6},
            {type = "Tank",   count = 4,  delay = 2.0},
            {type = "Boss",   count = 1,  delay = 5.0},
        },
        reward = 500,
        isBoss = true,
    },
}

-- Enemy type definitions
local ENEMY_TYPES = {
    Basic  = {name = "Zombie",      health = 50,   speed = 10, reward = 10,  color = Color3.fromRGB(120, 180, 80)},
    Fast   = {name = "Runner",      health = 25,   speed = 20, reward = 15,  color = Color3.fromRGB(80, 150, 220)},
    Tank   = {name = "Brute",       health = 200,  speed = 6,  reward = 30,  color = Color3.fromRGB(160, 80, 60)},
    Flying = {name = "Bat",         health = 40,   speed = 14, reward = 20,  color = Color3.fromRGB(80, 40, 120), isFlying = true},
    Boss   = {name = "Mega Zombie", health = 1000, speed = 5,  reward = 100, color = Color3.fromRGB(200, 40, 40), isBoss = true},
}

local currentWave = 0
local waveInProgress = false
local lives = 100

local function startWave(waveNum)
    if waveInProgress then return end
    waveInProgress = true
    currentWave = waveNum

    local wave = WAVES[waveNum]
    if not wave then
        -- Victory! All waves cleared
        announceVictory()
        return
    end

    -- Announce wave
    announceWave(waveNum, wave.isBoss)

    -- Spawn enemies
    task.spawn(function()
        for _, group in wave.enemies do
            local enemyConfig = ENEMY_TYPES[group.type]
            if not enemyConfig then continue end

            -- Scale difficulty with wave number
            local hpScale = 1 + (waveNum - 1) * 0.15 -- 15% more HP per wave
            local scaledConfig = {
                name = enemyConfig.name,
                health = math.floor(enemyConfig.health * hpScale),
                speed = enemyConfig.speed,
                reward = enemyConfig.reward,
                color = enemyConfig.color,
                isBoss = enemyConfig.isBoss,
                isFlying = enemyConfig.isFlying,
            }

            for i = 1, group.count do
                createEnemy(scaledConfig)
                task.wait(group.delay)
            end
        end

        -- Wait for all enemies to die or reach end
        while #workspace.Enemies:GetChildren() > 0 do
            task.wait(0.5)
        end

        -- Wave cleared
        waveInProgress = false
        for _, player in game.Players:GetPlayers() do
            local ls = player:FindFirstChild("leaderstats")
            if ls then
                local gold = ls:FindFirstChild("Gold")
                if gold then gold.Value += wave.reward end
            end
        end

        announceWaveCleared(waveNum)

        -- Auto-start next wave after delay
        task.delay(10, function()
            if not waveInProgress then
                startWave(waveNum + 1)
            end
        end)
    end)
end
```

---

## Tower Upgrade System

```lua
-- Server Script: Tower upgrade handler
local UpgradeTower = Instance.new("RemoteFunction")
UpgradeTower.Name = "UpgradeTower"
UpgradeTower.Parent = ReplicatedStorage

UpgradeTower.OnServerInvoke = function(player, towerId)
    local tower = workspace.Towers:FindFirstChild(towerId)
    if not tower then return {success = false, reason = "Tower not found"} end

    -- Verify ownership
    if tower:GetAttribute("Owner") ~= player.UserId then
        return {success = false, reason = "Not your tower"}
    end

    local towerType = tower:GetAttribute("TowerType")
    local currentLevel = tower:GetAttribute("Level") or 0
    local towerData = TOWER_TYPES[towerType]
    if not towerData then return {success = false, reason = "Invalid tower type"} end

    local nextUpgrade = towerData.upgrades[currentLevel + 1]
    if not nextUpgrade then return {success = false, reason = "Max level"} end

    -- Check gold
    local ls = player:FindFirstChild("leaderstats")
    local gold = ls and ls:FindFirstChild("Gold")
    if not gold or gold.Value < nextUpgrade.cost then
        return {success = false, reason = "Need " .. nextUpgrade.cost .. " gold"}
    end

    -- Apply upgrade
    gold.Value -= nextUpgrade.cost
    tower:SetAttribute("Level", currentLevel + 1)

    -- Update tower stats
    for key, value in nextUpgrade do
        if key ~= "cost" and key ~= "name" then
            tower:SetAttribute(key, value)
        end
    end

    -- Visual upgrade: change color, add effects
    local body = tower.PrimaryPart
    if body then
        -- Glow brighter with each upgrade
        local pl = body:FindFirstChildOfClass("PointLight")
        if pl then
            pl.Brightness += 1
            pl.Range += 5
        end
        -- Size increase
        body.Size = body.Size * 1.1
    end

    return {
        success = true,
        newLevel = currentLevel + 1,
        name = nextUpgrade.name,
    }
end
```

---

## Economy (Earn Gold Per Kill, Spend on Towers)

```lua
-- Gold management
local function setupEconomy(player)
    local ls = Instance.new("Folder"); ls.Name = "leaderstats"; ls.Parent = player
    local gold = Instance.new("IntValue"); gold.Name = "Gold"; gold.Value = 500; gold.Parent = ls -- starting gold
    local wave = Instance.new("IntValue"); wave.Name = "Wave"; wave.Value = 0; wave.Parent = ls
end

-- Interest system: earn 5% interest on gold between waves (rewards saving)
local function grantInterest()
    for _, player in game.Players:GetPlayers() do
        local ls = player:FindFirstChild("leaderstats")
        if ls then
            local gold = ls:FindFirstChild("Gold")
            if gold then
                local interest = math.floor(gold.Value * 0.05)
                gold.Value += interest
            end
        end
    end
end
```

---

## Map Layout Best Practices

- **Path should be visible from spawn** — players need to see where enemies walk to plan tower placement.
- **Multiple valid strategies** — don't make one tower spot obviously optimal. Create intersections and curves that reward creative placement.
- **Placement zones clearly marked** — use a different ground material/color where towers can be placed.
- **Bottleneck points** — narrow path sections where splash towers excel, wide areas where single-target is better.
- **Elevation** — some platforms higher than others; towers on hills get range bonus.
- **Path length** — longer paths = more time to kill = more forgiving. Short paths = harder maps.

### Typical TD Map Layout

```
[Spawn] → straight → curve left → long straight → S-bend → curve right → [Exit/Base]
          ^                          ^                ^
     placement zone            placement zone    placement zone
     (early game)              (mid game)        (late game defense)
```

---

## Sell Towers (Refund System)

```lua
-- Sell tower for 70% of total invested gold
local SellTower = Instance.new("RemoteFunction")
SellTower.Name = "SellTower"
SellTower.Parent = ReplicatedStorage

SellTower.OnServerInvoke = function(player, towerId)
    local tower = workspace.Towers:FindFirstChild(towerId)
    if not tower then return {success = false} end
    if tower:GetAttribute("Owner") ~= player.UserId then return {success = false} end

    -- Calculate total invested
    local towerType = tower:GetAttribute("TowerType")
    local level = tower:GetAttribute("Level") or 0
    local data = TOWER_TYPES[towerType]
    local totalInvested = data.cost
    for i = 1, level do
        totalInvested += (data.upgrades[i] and data.upgrades[i].cost or 0)
    end

    local refund = math.floor(totalInvested * 0.7)
    local ls = player:FindFirstChild("leaderstats")
    if ls then
        local gold = ls:FindFirstChild("Gold")
        if gold then gold.Value += refund end
    end

    tower:Destroy()
    return {success = true, refund = refund}
end
```

This reference covers every major tower defense system. Each component is modular and can be scaled up for production-quality TD games.
