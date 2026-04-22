# RPG Game Design for Roblox — Complete Reference

## Overview

RPG games on Roblox combine exploration, combat, quests, and character progression. The core loop: explore world → accept quests → fight enemies → earn XP/loot → level up → unlock new areas. What separates good RPGs from bad ones is the feel of progression and the quality of NPC interactions.

---

## NPC System (Waypoints, Dialogue, Quest Givers)

### NPC Spawning and Idle Behavior

```lua
-- Server Script: NPC Controller
local PathfindingService = game:GetService("PathfindingService")
local NPC_FOLDER = workspace:FindFirstChild("NPCs") or Instance.new("Folder", workspace)
NPC_FOLDER.Name = "NPCs"

local function createNPC(config)
    local npc = Instance.new("Model")
    npc.Name = config.name

    -- Body (simplified humanoid rig)
    local torso = Instance.new("Part")
    torso.Name = "HumanoidRootPart"
    torso.Size = Vector3.new(2, 2, 1)
    torso.CFrame = config.position
    torso.Anchored = true
    torso.CanCollide = true
    torso.Material = Enum.Material.Concrete
    torso.Color = config.color or Color3.fromRGB(180, 140, 100)
    torso.Parent = npc

    local head = Instance.new("Part")
    head.Name = "Head"
    head.Shape = Enum.PartType.Ball
    head.Size = Vector3.new(1.5, 1.5, 1.5)
    head.CFrame = torso.CFrame + Vector3.new(0, 1.75, 0)
    head.Anchored = true
    head.CanCollide = false
    head.Material = Enum.Material.Concrete
    head.Color = Color3.fromRGB(220, 190, 160)
    head.Parent = npc

    -- Name tag
    local bb = Instance.new("BillboardGui")
    bb.Size = UDim2.new(0, 200, 0, 50)
    bb.StudsOffset = Vector3.new(0, 3, 0)
    bb.Parent = head

    local nameLabel = Instance.new("TextLabel")
    nameLabel.Size = UDim2.new(1, 0, 0.5, 0)
    nameLabel.BackgroundTransparency = 1
    nameLabel.Text = config.name
    nameLabel.TextColor3 = Color3.fromRGB(255, 255, 100)
    nameLabel.TextScaled = true
    nameLabel.Font = Enum.Font.GothamBold
    nameLabel.Parent = bb

    local roleLabel = Instance.new("TextLabel")
    roleLabel.Size = UDim2.new(1, 0, 0.4, 0)
    roleLabel.Position = UDim2.new(0, 0, 0.55, 0)
    roleLabel.BackgroundTransparency = 1
    roleLabel.Text = config.role or "Villager"
    roleLabel.TextColor3 = Color3.fromRGB(200, 200, 200)
    roleLabel.TextScaled = true
    roleLabel.Font = Enum.Font.Gotham
    roleLabel.Parent = bb

    -- Quest indicator (! above head)
    if config.hasQuest then
        local questMark = Instance.new("Part")
        questMark.Name = "QuestIndicator"
        questMark.Size = Vector3.new(0.5, 0.8, 0.1)
        questMark.CFrame = head.CFrame + Vector3.new(0, 2, 0)
        questMark.Anchored = true
        questMark.CanCollide = false
        questMark.Material = Enum.Material.Neon
        questMark.Color = Color3.fromRGB(255, 215, 0)
        questMark.Parent = npc

        -- Subtle bob animation
        task.spawn(function()
            local baseY = questMark.Position.Y
            local t = 0
            while questMark.Parent do
                t += task.wait()
                questMark.Position = Vector3.new(questMark.Position.X, baseY + math.sin(t * 2) * 0.3, questMark.Position.Z)
            end
        end)
    end

    -- Interaction prompt
    local prompt = Instance.new("ProximityPrompt")
    prompt.ActionText = "Talk"
    prompt.ObjectText = config.name
    prompt.MaxActivationDistance = 10
    prompt.HoldDuration = 0
    prompt.Parent = torso

    npc.PrimaryPart = torso
    npc.Parent = NPC_FOLDER

    return npc, prompt
end
```

### NPC Dialogue System

```lua
-- Server Script: Dialogue Manager
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local DialogueRemote = Instance.new("RemoteEvent")
DialogueRemote.Name = "DialogueEvent"
DialogueRemote.Parent = ReplicatedStorage

-- Dialogue trees stored as tables
local DIALOGUES = {
    ["Elder Magnus"] = {
        greeting = {
            text = "Welcome, adventurer. These lands have grown dangerous since the Shadow fell upon the northern mountains.",
            options = {
                {text = "Tell me more about the Shadow.", next = "shadow_info"},
                {text = "Do you have any work for me?", next = "quest_offer"},
                {text = "Goodbye.", next = nil}, -- nil = end dialogue
            },
        },
        shadow_info = {
            text = "Dark creatures have been pouring from the caves. Our scouts haven't returned. Someone brave needs to investigate.",
            options = {
                {text = "I'll do it.", next = "quest_accept", action = "accept_quest", questId = "shadow_caves"},
                {text = "Not my problem.", next = nil},
            },
        },
        quest_offer = {
            text = "The village needs 10 Shadow Crystals from the northern caves. Bring them back and I'll reward you well.",
            options = {
                {text = "Consider it done.", next = "quest_accept", action = "accept_quest", questId = "shadow_crystals"},
                {text = "Maybe later.", next = nil},
            },
        },
        quest_accept = {
            text = "Brave soul. Take this torch — you'll need it in the dark. Return when you've gathered what we need.",
            options = {
                {text = "I won't let you down.", next = nil},
            },
        },
    },
}

-- Handle NPC interaction
local function onNPCInteract(player, npcName)
    local dialogue = DIALOGUES[npcName]
    if not dialogue then return end

    -- Check if player has completed quest (show different dialogue)
    local questData = getPlayerQuestData(player)

    -- Send dialogue to client
    DialogueRemote:FireClient(player, {
        npc = npcName,
        node = "greeting",
        text = dialogue.greeting.text,
        options = dialogue.greeting.options,
    })
end
```

### NPC Patrol Waypoints

```lua
-- Server Script: NPC Patrol between waypoints
local function setupPatrol(npc, waypoints, waitTime)
    waitTime = waitTime or 3
    local currentIndex = 1

    task.spawn(function()
        while npc.Parent do
            local target = waypoints[currentIndex]
            local root = npc.PrimaryPart
            if not root or not target then break end

            -- Move to waypoint
            local path = PathfindingService:CreatePath({
                AgentRadius = 2,
                AgentHeight = 5,
                AgentCanJump = false,
            })

            local ok, err = pcall(function()
                path:ComputeAsync(root.Position, target.Position)
            end)

            if ok and path.Status == Enum.PathStatus.Success then
                for _, wp in path:GetWaypoints() do
                    -- Smooth NPC movement via tweening
                    local tween = game:GetService("TweenService"):Create(root, TweenInfo.new(
                        (root.Position - wp.Position).Magnitude / 8, -- speed = 8 studs/sec
                        Enum.EasingStyle.Linear
                    ), {CFrame = CFrame.new(wp.Position)})
                    tween:Play()
                    tween.Completed:Wait()
                end
            end

            -- Wait at waypoint
            task.wait(waitTime)

            -- Next waypoint (loop)
            currentIndex = currentIndex % #waypoints + 1
        end
    end)
end
```

---

## Quest System

### Quest Data Structure

```lua
local QUESTS = {
    shadow_crystals = {
        id = "shadow_crystals",
        name = "Shadow Crystal Collection",
        description = "Collect 10 Shadow Crystals from the northern caves.",
        giver = "Elder Magnus",
        type = "collect", -- collect, kill, explore, escort, deliver
        target = "Shadow Crystal",
        required = 10,
        rewards = {
            xp = 500,
            coins = 200,
            items = {"Iron Sword"},
        },
        prerequisites = {}, -- quest IDs that must be complete first
        repeatable = false,
        level_required = 1,
    },
    slay_goblins = {
        id = "slay_goblins",
        name = "Goblin Menace",
        description = "Defeat 5 Goblins threatening the village farms.",
        giver = "Guard Captain",
        type = "kill",
        target = "Goblin",
        required = 5,
        rewards = {
            xp = 300,
            coins = 150,
            items = {},
        },
        prerequisites = {"shadow_crystals"},
        repeatable = true,
        level_required = 3,
    },
}

-- Player quest state
local function getDefaultQuestState()
    return {
        active = {},    -- {questId = {progress = 0, startedAt = tick()}}
        completed = {}, -- {questId = true}
    }
end
```

### Quest Tracking

```lua
-- Server Script: Quest progress tracking
local function acceptQuest(player, questId)
    local quest = QUESTS[questId]
    if not quest then return false, "Quest not found" end

    local state = getPlayerQuestData(player)

    -- Check prerequisites
    for _, prereq in quest.prerequisites do
        if not state.completed[prereq] then
            return false, "Complete prerequisite: " .. QUESTS[prereq].name
        end
    end

    -- Check level requirement
    local level = getPlayerLevel(player)
    if level < quest.level_required then
        return false, "Requires level " .. quest.level_required
    end

    -- Check if already active or completed
    if state.active[questId] then return false, "Already active" end
    if state.completed[questId] and not quest.repeatable then return false, "Already completed" end

    -- Accept
    state.active[questId] = {progress = 0, startedAt = tick()}
    return true, "Quest accepted: " .. quest.name
end

local function updateQuestProgress(player, eventType, targetName, amount)
    local state = getPlayerQuestData(player)
    amount = amount or 1

    for questId, progress in state.active do
        local quest = QUESTS[questId]
        if quest and quest.type == eventType and quest.target == targetName then
            progress.progress += amount
            if progress.progress >= quest.required then
                -- Quest complete
                completeQuest(player, questId)
            end
        end
    end
end

local function completeQuest(player, questId)
    local quest = QUESTS[questId]
    local state = getPlayerQuestData(player)

    -- Grant rewards
    grantXP(player, quest.rewards.xp)
    grantCoins(player, quest.rewards.coins)
    for _, itemName in quest.rewards.items do
        grantItem(player, itemName)
    end

    -- Update state
    state.active[questId] = nil
    state.completed[questId] = true

    -- Notify client
    -- FireClient: "Quest Complete: " .. quest.name
end
```

---

## Inventory System

```lua
-- Server Script: Inventory Module
local MAX_SLOTS = 20

local ITEMS = {
    ["Iron Sword"] = {
        type = "weapon",
        slot = "mainhand",
        stats = {damage = 10, speed = 1.0},
        rarity = "Common",
        stackable = false,
        description = "A reliable iron blade.",
    },
    ["Health Potion"] = {
        type = "consumable",
        effect = "heal",
        value = 50,
        rarity = "Common",
        stackable = true,
        maxStack = 20,
        description = "Restores 50 HP.",
    },
    ["Shadow Crystal"] = {
        type = "quest_item",
        rarity = "Uncommon",
        stackable = true,
        maxStack = 99,
        description = "A dark crystal pulsing with shadow energy.",
    },
    ["Dragon Scale Armor"] = {
        type = "armor",
        slot = "chest",
        stats = {defense = 25, health = 50},
        rarity = "Epic",
        stackable = false,
        description = "Forged from the scales of an ancient dragon.",
    },
}

local function addToInventory(player, itemName, quantity)
    quantity = quantity or 1
    local item = ITEMS[itemName]
    if not item then return false, "Item not found" end

    local inv = getPlayerInventory(player) -- returns a table of inventory slots

    if item.stackable then
        -- Find existing stack
        for _, slot in inv do
            if slot.name == itemName and slot.quantity < (item.maxStack or 99) then
                local canAdd = math.min(quantity, (item.maxStack or 99) - slot.quantity)
                slot.quantity += canAdd
                quantity -= canAdd
                if quantity <= 0 then return true end
            end
        end
    end

    -- Add new slots
    while quantity > 0 do
        if #inv >= MAX_SLOTS then return false, "Inventory full" end
        local stackSize = item.stackable and math.min(quantity, item.maxStack or 99) or 1
        table.insert(inv, {name = itemName, quantity = stackSize})
        quantity -= stackSize
    end

    return true
end
```

---

## Combat System

### Melee Combat

```lua
-- Server Script: Sword combat with combos
local COMBO_WINDOW = 1.5 -- seconds to chain next attack
local COMBO_DAMAGE = {10, 15, 25} -- damage per combo hit
local ATTACK_RANGE = 6
local KNOCKBACK_FORCE = 30

local playerCombos = {} -- [userId] = {step = 1, lastAttack = tick()}

local function meleeAttack(player, direction)
    local char = player.Character
    if not char then return end
    local root = char:FindFirstChild("HumanoidRootPart")
    if not root then return end

    local userId = player.UserId
    local combo = playerCombos[userId]
    if not combo then
        combo = {step = 1, lastAttack = 0}
        playerCombos[userId] = combo
    end

    -- Check cooldown (0.4 seconds between swings)
    if tick() - combo.lastAttack < 0.4 then return end

    -- Check combo window
    if tick() - combo.lastAttack > COMBO_WINDOW then
        combo.step = 1
    end

    local damage = COMBO_DAMAGE[combo.step] or COMBO_DAMAGE[1]
    combo.lastAttack = tick()

    -- Raycast forward to detect hits
    local rayParams = RaycastParams.new()
    rayParams.FilterDescendantsInstances = {char}
    rayParams.FilterType = Enum.RaycastFilterType.Exclude

    local result = workspace:Raycast(root.Position, root.CFrame.LookVector * ATTACK_RANGE, rayParams)

    if result and result.Instance then
        local hitModel = result.Instance:FindFirstAncestorOfClass("Model")
        if hitModel then
            local hitHumanoid = hitModel:FindFirstChildOfClass("Humanoid")
            if hitHumanoid and hitHumanoid.Health > 0 then
                -- Apply damage
                hitHumanoid:TakeDamage(damage)

                -- Knockback on final combo hit
                if combo.step == #COMBO_DAMAGE then
                    local hitRoot = hitModel:FindFirstChild("HumanoidRootPart")
                    if hitRoot and not hitRoot.Anchored then
                        local knockDir = (hitRoot.Position - root.Position).Unit
                        hitRoot:ApplyImpulse(knockDir * KNOCKBACK_FORCE + Vector3.new(0, 15, 0))
                    end
                end

                -- Damage number popup (fire to all clients)
                -- FireAllClients("DamageNumber", hitRoot.Position, damage, combo.step == #COMBO_DAMAGE)
            end
        end
    end

    -- Advance combo
    combo.step = (combo.step % #COMBO_DAMAGE) + 1
end
```

### Ranged Combat with Abilities

```lua
-- Ability system with cooldowns and mana costs
local ABILITIES = {
    fireball = {
        name = "Fireball",
        manaCost = 25,
        cooldown = 3,
        damage = 40,
        range = 60,
        aoeRadius = 8,
        projectileSpeed = 50,
    },
    heal = {
        name = "Healing Light",
        manaCost = 30,
        cooldown = 8,
        healAmount = 60,
        aoeRadius = 12,
    },
    dash = {
        name = "Shadow Dash",
        manaCost = 15,
        cooldown = 5,
        distance = 30,
        iFrames = 0.3, -- invincibility frames
    },
}

local playerMana = {} -- [userId] = {current = 100, max = 100, regen = 5}
local playerCooldowns = {} -- [userId] = {abilityName = lastUsedTick}
```

---

## Leveling / XP System

```lua
-- XP curve: each level requires more XP
local function xpForLevel(level)
    return math.floor(100 * (level ^ 1.5))
end

local function grantXP(player, amount)
    local data = getPlayerData(player)
    data.xp += amount

    -- Check for level ups
    while data.xp >= xpForLevel(data.level + 1) do
        data.xp -= xpForLevel(data.level + 1)
        data.level += 1

        -- Grant stat points
        data.statPoints += 3

        -- Notify player
        -- FireClient: "Level Up! You are now level " .. data.level

        -- Unlock checks (new zones, abilities, etc.)
        checkLevelUnlocks(player, data.level)
    end
end

-- Stat allocation
local STATS = {"Strength", "Defense", "Speed", "MaxHP", "MaxMana"}
local function allocateStat(player, statName, points)
    local data = getPlayerData(player)
    if data.statPoints < points then return false end
    if not table.find(STATS, statName) then return false end

    data.statPoints -= points
    data.stats[statName] = (data.stats[statName] or 0) + points
    return true
end
```

---

## Enemy AI (Patrol, Chase, Attack, Respawn)

```lua
-- Server Script: Enemy AI State Machine
local RunService = game:GetService("RunService")
local PathfindingService = game:GetService("PathfindingService")

local function createEnemy(config)
    -- config: name, position, health, damage, aggroRange, attackRange, lootTable, respawnTime, patrolPoints

    local enemy = Instance.new("Model")
    enemy.Name = config.name

    local body = Instance.new("Part")
    body.Name = "HumanoidRootPart"
    body.Size = Vector3.new(3, 4, 2)
    body.CFrame = CFrame.new(config.position)
    body.Anchored = true
    body.Material = Enum.Material.Concrete
    body.Color = Color3.fromRGB(80, 40, 40) -- dark red for enemies
    body.Parent = enemy

    local humanoid = Instance.new("Humanoid")
    humanoid.MaxHealth = config.health
    humanoid.Health = config.health
    humanoid.Parent = enemy

    -- Health bar above head
    local hpGui = Instance.new("BillboardGui")
    hpGui.Size = UDim2.new(0, 80, 0, 10)
    hpGui.StudsOffset = Vector3.new(0, 3, 0)
    hpGui.Parent = body

    local hpBg = Instance.new("Frame")
    hpBg.Size = UDim2.new(1, 0, 1, 0)
    hpBg.BackgroundColor3 = Color3.fromRGB(40, 40, 40)
    hpBg.Parent = hpGui

    local hpBar = Instance.new("Frame")
    hpBar.Name = "Fill"
    hpBar.Size = UDim2.new(1, 0, 1, 0)
    hpBar.BackgroundColor3 = Color3.fromRGB(200, 40, 40)
    hpBar.Parent = hpBg

    enemy.PrimaryPart = body
    enemy.Parent = workspace.Enemies

    -- AI state machine
    local state = "idle" -- idle, patrol, chase, attack, dead
    local target = nil
    local spawnPos = config.position
    local patrolIndex = 1
    local lastAttack = 0

    local function findNearestPlayer()
        local nearest, dist = nil, config.aggroRange or 30
        for _, player in game.Players:GetPlayers() do
            local char = player.Character
            if char then
                local root = char:FindFirstChild("HumanoidRootPart")
                if root then
                    local d = (root.Position - body.Position).Magnitude
                    if d < dist then nearest = player; dist = d end
                end
            end
        end
        return nearest
    end

    -- Main AI loop
    task.spawn(function()
        while humanoid.Health > 0 do
            task.wait(0.3) -- AI tick rate

            if state == "idle" or state == "patrol" then
                local player = findNearestPlayer()
                if player then
                    target = player
                    state = "chase"
                elseif config.patrolPoints and #config.patrolPoints > 0 then
                    state = "patrol"
                    -- Move toward patrol point (simplified)
                    local goal = config.patrolPoints[patrolIndex]
                    local dir = (goal - body.Position).Unit
                    body.CFrame = body.CFrame + dir * 4 * 0.3
                    if (goal - body.Position).Magnitude < 3 then
                        patrolIndex = patrolIndex % #config.patrolPoints + 1
                        task.wait(2)
                    end
                end

            elseif state == "chase" then
                if not target or not target.Character then
                    state = "idle"; target = nil; continue
                end
                local tRoot = target.Character:FindFirstChild("HumanoidRootPart")
                if not tRoot then state = "idle"; target = nil; continue end

                local dist = (tRoot.Position - body.Position).Magnitude

                -- Lost aggro
                if dist > (config.aggroRange or 30) * 1.5 then
                    state = "idle"; target = nil; continue
                end

                -- In attack range
                if dist < (config.attackRange or 5) then
                    state = "attack"
                else
                    -- Move toward player
                    local dir = (tRoot.Position - body.Position).Unit
                    body.CFrame = body.CFrame + dir * 6 * 0.3
                end

            elseif state == "attack" then
                if not target or not target.Character then
                    state = "idle"; target = nil; continue
                end
                if tick() - lastAttack > 1.5 then -- attack cooldown
                    lastAttack = tick()
                    local tHum = target.Character:FindFirstChildOfClass("Humanoid")
                    if tHum then
                        tHum:TakeDamage(config.damage or 10)
                    end
                end
                -- Check if still in range
                local tRoot = target.Character:FindFirstChild("HumanoidRootPart")
                if tRoot and (tRoot.Position - body.Position).Magnitude > (config.attackRange or 5) * 1.5 then
                    state = "chase"
                end
            end
        end

        -- Death
        state = "dead"
        dropLoot(body.Position, config.lootTable)

        -- Grant XP to killer
        if target then
            grantXP(target, config.xpReward or 50)
            updateQuestProgress(target, "kill", config.name, 1)
        end

        enemy:Destroy()

        -- Respawn after delay
        task.delay(config.respawnTime or 30, function()
            createEnemy(config)
        end)
    end)

    return enemy
end
```

---

## Loot Drops (Rarity Tiers, Drop Tables)

```lua
-- Loot table system with weighted rarity
local LOOT_TABLES = {
    Goblin = {
        {item = "Coins",          weight = 500, min = 5,  max = 15},
        {item = "Health Potion",  weight = 200, min = 1,  max = 2},
        {item = "Goblin Ear",    weight = 300, min = 1,  max = 1}, -- quest item
        {item = "Iron Dagger",   weight = 50,  min = 1,  max = 1},
        {item = "Goblin Crown",  weight = 5,   min = 1,  max = 1}, -- rare drop
    },
    Dragon = {
        {item = "Coins",              weight = 300, min = 100, max = 500},
        {item = "Dragon Scale",       weight = 400, min = 1,   max = 3},
        {item = "Dragon Scale Armor", weight = 20,  min = 1,   max = 1},
        {item = "Legendary Gem",      weight = 10,  min = 1,   max = 1},
        {item = "Dragon Egg",         weight = 2,   min = 1,   max = 1},
    },
}

local function rollLoot(tableName)
    local table_ = LOOT_TABLES[tableName]
    if not table_ then return {} end

    local drops = {}
    -- Roll each item independently (can drop multiple items)
    for _, entry in table_ do
        local roll = math.random(1, 1000)
        if roll <= entry.weight then
            local qty = math.random(entry.min, entry.max)
            table.insert(drops, {item = entry.item, quantity = qty})
        end
    end
    return drops
end

local function dropLoot(position, tableName)
    local drops = rollLoot(tableName)
    for i, drop in drops do
        -- Create visual loot on ground
        local lootPart = Instance.new("Part")
        lootPart.Name = drop.item
        lootPart.Size = Vector3.new(1, 1, 1)
        lootPart.Position = position + Vector3.new(math.random(-3, 3), 2, math.random(-3, 3))
        lootPart.Anchored = true
        lootPart.CanCollide = false
        lootPart.Material = Enum.Material.Neon
        lootPart.Color = Color3.fromRGB(255, 215, 0) -- gold glow
        lootPart.Parent = workspace

        -- Highlight effect
        local hl = Instance.new("Highlight")
        hl.FillColor = Color3.fromRGB(255, 215, 0)
        hl.FillTransparency = 0.5
        hl.OutlineTransparency = 0
        hl.Parent = lootPart

        -- Pickup prompt
        local prompt = Instance.new("ProximityPrompt")
        prompt.ActionText = "Pick Up"
        prompt.ObjectText = drop.item .. " x" .. drop.quantity
        prompt.MaxActivationDistance = 8
        prompt.Parent = lootPart

        prompt.Triggered:Connect(function(player)
            local success = addToInventory(player, drop.item, drop.quantity)
            if success then
                lootPart:Destroy()
            end
        end)

        -- Auto-despawn after 60 seconds
        game:GetService("Debris"):AddItem(lootPart, 60)

        -- Bob animation
        task.spawn(function()
            local baseY = lootPart.Position.Y
            local t = 0
            while lootPart.Parent do
                t += task.wait()
                lootPart.Position = Vector3.new(
                    lootPart.Position.X,
                    baseY + math.sin(t * 2) * 0.3,
                    lootPart.Position.Z
                )
                lootPart.CFrame *= CFrame.Angles(0, math.rad(1), 0)
            end
        end)
    end
end
```

---

## World Building Tips for RPGs

- **Towns** should have an inn (heal/save), shop (buy gear), quest board (view available quests), and blacksmith (upgrade gear).
- **Dungeons** get progressively harder with environmental storytelling — signs of previous adventurers, broken equipment, warning messages on walls.
- **Boss rooms** need a clear arena with no escape, a health bar at the top of the screen, and phase transitions at HP thresholds.
- **Safe zones** should disable PvP and hostile NPCs, give players breathing room to manage inventory and accept quests.
- **Exploration rewards** — hidden chests, secret paths, and Easter eggs keep players looking around corners.

This reference provides every major RPG system needed. Each component is modular — plug them together to create a full RPG experience.
