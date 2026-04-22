# Simulator Game Design for Roblox — Complete Reference

## Overview

Simulator games are the most popular and highest-grossing genre on Roblox. The core loop is simple: click/tap to earn → fill backpack → sell → upgrade → repeat. What makes them addictive is layered progression: rebirths, pets, zones, and cosmetic flex.

---

## Click/Tap Mechanics

Two primary approaches:

### ClickDetector-Based (Stationary Target)
Players click on a specific object in the world (ore, tree, orb) to earn resources.

```lua
-- Server Script: Click-to-collect orb in a zone
local orb = script.Parent -- A glowing Part in the zone
local CD = Instance.new("ClickDetector")
CD.MaxActivationDistance = 15
CD.Parent = orb

CD.MouseClick:Connect(function(player)
    local ls = player:FindFirstChild("leaderstats")
    if not ls then return end
    local gems = ls:FindFirstChild("Gems")
    if not gems then return end
    -- Apply multiplier from rebirth + pet bonus
    local data = PlayerData.get(player)
    local mult = (data and data.rebirthMultiplier or 1) * (data and data.petBonus or 1)
    local earned = math.floor(10 * mult)
    gems.Value += earned
    -- Visual feedback: brief scale pulse
    local orig = orb.Size
    orb.Size = orig * 1.15
    task.delay(0.1, function() orb.Size = orig end)
end)
```

### Tool-Based (Tap Anywhere)
Player equips a tool and clicks anywhere — each click earns currency. Higher-tier tools earn more.

```lua
-- Server Script inside a Tool (StarterPack)
local tool = script.Parent
local handle = tool:WaitForChild("Handle")
local COOLDOWN = 0.3
local debounce = {}

tool.Activated:Connect(function()
    local player = game.Players:GetPlayerFromCharacter(tool.Parent)
    if not player then return end
    if debounce[player.UserId] then return end
    debounce[player.UserId] = true

    local ls = player:FindFirstChild("leaderstats")
    if ls then
        local coins = ls:FindFirstChild("Coins")
        if coins then
            local toolPower = tool:GetAttribute("Power") or 1
            coins.Value += toolPower
        end
    end

    task.delay(COOLDOWN, function()
        debounce[player.UserId] = nil
    end)
end)
```

---

## Currency Systems

Top simulators use 2-3 currencies:

| Currency | Purpose | Earn Method | Spend On |
|----------|---------|-------------|----------|
| Primary (Coins) | Core loop | Clicking, selling | Tools, zones, rebirths |
| Premium (Gems) | Rare purchases | Quests, daily login, Robux | Pets, cosmetics, skips |
| Event (Candy, Snow) | Limited time | Event zones | Event-exclusive items |

### Multi-Currency Implementation

```lua
-- leaderstats setup (Server Script, ServerScriptService)
local Players = game:GetService("Players")
local DataStoreService = game:GetService("DataStoreService")
local store = DataStoreService:GetDataStore("SimData_v2")

local DEFAULT = {
    Coins = 0,
    Gems = 5, -- starter gems
    Rebirths = 0,
    RebirthMultiplier = 1,
    BackpackSize = 100,
    BackpackFill = 0,
    OwnedPets = {},
    EquippedPets = {},
    UnlockedZones = {1}, -- zone 1 is free
}

Players.PlayerAdded:Connect(function(player)
    local ls = Instance.new("Folder")
    ls.Name = "leaderstats"
    ls.Parent = player

    -- Load saved data
    local saved = nil
    local ok, result = pcall(function()
        return store:GetAsync("player_" .. player.UserId)
    end)
    if ok and type(result) == "table" then saved = result end

    local data = {}
    for k, v in DEFAULT do
        data[k] = (saved and saved[k] ~= nil) and saved[k] or v
    end

    -- Visible leaderstats
    local coins = Instance.new("IntValue")
    coins.Name = "Coins"
    coins.Value = data.Coins
    coins.Parent = ls

    local gems = Instance.new("IntValue")
    gems.Name = "Gems"
    gems.Value = data.Gems
    gems.Parent = ls

    local rebirths = Instance.new("IntValue")
    rebirths.Name = "Rebirths"
    rebirths.Value = data.Rebirths
    rebirths.Parent = ls

    -- Store full data in attribute for server access
    player:SetAttribute("SimData", game:GetService("HttpService"):JSONEncode(data))
end)
```

### Currency Conversion

```lua
-- Convert coins to gems at a rate (e.g., 10,000 coins = 1 gem)
local CONVERSION_RATE = 10000

local function convertCoinsToGems(player, coinAmount)
    local ls = player:FindFirstChild("leaderstats")
    if not ls then return false end
    local coins = ls:FindFirstChild("Coins")
    local gems = ls:FindFirstChild("Gems")
    if not coins or not gems then return false end

    local gemsToGain = math.floor(coinAmount / CONVERSION_RATE)
    local coinsToSpend = gemsToGain * CONVERSION_RATE

    if coins.Value < coinsToSpend then return false end

    coins.Value -= coinsToSpend
    gems.Value += gemsToGain
    return true
end
```

---

## Pet/Egg System (Gacha Mechanics)

The pet system is the biggest revenue driver in simulators. Players buy eggs, hatch random pets with weighted rarity, and equip pets that provide passive bonuses.

### Rarity Tiers

| Rarity | Weight | Chance | Multiplier | Glow |
|--------|--------|--------|------------|------|
| Common | 600 | ~60% | 1.0x | None |
| Uncommon | 250 | ~25% | 1.5x | None |
| Rare | 100 | ~10% | 2.5x | Subtle |
| Epic | 40 | ~4% | 5.0x | Medium |
| Legendary | 9 | ~0.9% | 12.0x | Strong |
| Mythic | 1 | ~0.1% | 30.0x | Intense + Trail |

### Egg Hatching System

```lua
-- Server Script: Pet Egg Hatching
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local HatchEgg = Instance.new("RemoteFunction")
HatchEgg.Name = "HatchEgg"
HatchEgg.Parent = ReplicatedStorage

-- Egg definitions
local EGGS = {
    StarterEgg = {
        cost = 500,
        currency = "Coins",
        pets = {
            {name = "Dog",       rarity = "Common",    weight = 300, multiplier = 1.0},
            {name = "Cat",       rarity = "Common",    weight = 300, multiplier = 1.0},
            {name = "Fox",       rarity = "Uncommon",  weight = 150, multiplier = 1.5},
            {name = "Owl",       rarity = "Uncommon",  weight = 100, multiplier = 1.5},
            {name = "Dragon",    rarity = "Rare",      weight = 80,  multiplier = 2.5},
            {name = "Phoenix",   rarity = "Epic",      weight = 40,  multiplier = 5.0},
            {name = "Unicorn",   rarity = "Legendary", weight = 9,   multiplier = 12.0},
            {name = "Void Cat",  rarity = "Mythic",    weight = 1,   multiplier = 30.0},
        },
    },
    GalaxyEgg = {
        cost = 50,
        currency = "Gems",
        pets = {
            {name = "Star Pup",    rarity = "Uncommon",  weight = 250, multiplier = 2.0},
            {name = "Moon Bunny",  rarity = "Rare",      weight = 150, multiplier = 3.5},
            {name = "Nebula Fox",  rarity = "Epic",      weight = 60,  multiplier = 7.0},
            {name = "Cosmic Dragon", rarity = "Legendary", weight = 15, multiplier = 15.0},
            {name = "Galaxy Titan", rarity = "Mythic",    weight = 2,  multiplier = 40.0},
        },
    },
}

-- Weighted random selection
local function rollPet(eggName)
    local egg = EGGS[eggName]
    if not egg then return nil end
    local totalWeight = 0
    for _, pet in egg.pets do totalWeight += pet.weight end
    local roll = math.random() * totalWeight
    for _, pet in egg.pets do
        roll -= pet.weight
        if roll <= 0 then return pet end
    end
    return egg.pets[#egg.pets]
end

HatchEgg.OnServerInvoke = function(player, eggName)
    local egg = EGGS[eggName]
    if not egg then return {success = false, reason = "Invalid egg"} end

    -- Check currency
    local ls = player:FindFirstChild("leaderstats")
    if not ls then return {success = false, reason = "No data"} end
    local currency = ls:FindFirstChild(egg.currency)
    if not currency or currency.Value < egg.cost then
        return {success = false, reason = "Not enough " .. egg.currency}
    end

    -- Deduct cost
    currency.Value -= egg.cost

    -- Roll for pet
    local pet = rollPet(eggName)
    if not pet then return {success = false, reason = "Hatch failed"} end

    -- Save pet to player data (simplified — use DataStore in production)
    -- In a real game, append to an OwnedPets array in the player's save data
    return {
        success = true,
        pet = {
            name = pet.name,
            rarity = pet.rarity,
            multiplier = pet.multiplier,
            id = game:GetService("HttpService"):GenerateGUID(false),
        },
    }
end
```

### Pet Following System

```lua
-- Server Script: Make equipped pets follow the player
local RunService = game:GetService("RunService")

local function createPetModel(petData, player)
    local char = player.Character
    if not char then return nil end

    local pet = Instance.new("Model")
    pet.Name = petData.name

    -- Simple pet body (ball + eyes)
    local body = Instance.new("Part")
    body.Name = "Body"
    body.Shape = Enum.PartType.Ball
    body.Size = Vector3.new(2, 2, 2)
    body.Material = Enum.Material.Concrete
    body.Color = Color3.fromRGB(180, 130, 255) -- varies by pet
    body.Anchored = true
    body.CanCollide = false
    body.Parent = pet

    -- Rarity glow
    if petData.rarity == "Legendary" or petData.rarity == "Mythic" then
        local pl = Instance.new("PointLight")
        pl.Brightness = 2
        pl.Range = 8
        pl.Color = Color3.fromRGB(255, 215, 0)
        pl.Parent = body
    end

    -- Name tag
    local bb = Instance.new("BillboardGui")
    bb.Size = UDim2.new(0, 100, 0, 30)
    bb.StudsOffset = Vector3.new(0, 1.5, 0)
    bb.Parent = body
    local label = Instance.new("TextLabel")
    label.Size = UDim2.new(1, 0, 1, 0)
    label.BackgroundTransparency = 1
    label.Text = petData.name
    label.TextColor3 = Color3.fromRGB(255, 255, 255)
    label.TextScaled = true
    label.Font = Enum.Font.GothamBold
    label.Parent = bb

    pet.PrimaryPart = body
    pet.Parent = workspace

    return pet
end

-- Smooth follow behavior
local function updatePetPosition(pet, player, index)
    local char = player.Character
    if not char then return end
    local root = char:FindFirstChild("HumanoidRootPart")
    if not root then return end
    local body = pet.PrimaryPart
    if not body then return end

    -- Orbit position: offset behind and to the side
    local angle = math.rad(index * 120 + tick() * 30)
    local offset = Vector3.new(math.cos(angle) * 4, 2 + math.sin(tick() * 2) * 0.3, math.sin(angle) * 4)
    local target = root.Position + offset

    -- Smooth lerp
    body.CFrame = body.CFrame:Lerp(CFrame.new(target), 0.1)
end
```

---

## Rebirth System (Prestige)

Rebirths reset primary currency and progress but grant permanent multipliers.

```lua
-- Server Script: Rebirth System
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RebirthRemote = Instance.new("RemoteFunction")
RebirthRemote.Name = "Rebirth"
RebirthRemote.Parent = ReplicatedStorage

local REBIRTH_COSTS = {
    [1] = 10000,
    [2] = 50000,
    [3] = 250000,
    [4] = 1000000,
    [5] = 5000000,
    [6] = 25000000,
    [7] = 100000000,
    [8] = 500000000,
    [9] = 2500000000,
    [10] = 10000000000,
}

-- Multiplier per rebirth: 1 + (rebirths * 0.5) so rebirth 10 = 6x
local function getMultiplier(rebirths)
    return 1 + (rebirths * 0.5)
end

-- Permanent upgrades unlocked at specific rebirth levels
local REBIRTH_UNLOCKS = {
    [1] = "Auto-Collect (passive earn 1/sec)",
    [3] = "Zone 4 Access",
    [5] = "+1 Pet Equip Slot",
    [7] = "Exclusive Aura",
    [10] = "Mythic Egg Access",
}

RebirthRemote.OnServerInvoke = function(player)
    local ls = player:FindFirstChild("leaderstats")
    if not ls then return {success = false} end

    local coins = ls:FindFirstChild("Coins")
    local rebirths = ls:FindFirstChild("Rebirths")
    if not coins or not rebirths then return {success = false} end

    local nextRebirth = rebirths.Value + 1
    local cost = REBIRTH_COSTS[nextRebirth]
    if not cost then return {success = false, reason = "Max rebirth reached"} end
    if coins.Value < cost then return {success = false, reason = "Need " .. cost .. " coins"} end

    -- Execute rebirth
    coins.Value = 0
    rebirths.Value = nextRebirth

    -- Update multiplier in player data
    local newMult = getMultiplier(nextRebirth)

    -- Reset backpack, keep pets, keep gems
    -- (In real game: reset zone progress, tool tier, etc.)

    local unlock = REBIRTH_UNLOCKS[nextRebirth]

    return {
        success = true,
        newRebirth = nextRebirth,
        multiplier = newMult,
        unlock = unlock,
    }
end
```

---

## Leaderboard Integration (OrderedDataStore)

```lua
-- Server Script: Global leaderboard updating every 60 seconds
local DataStoreService = game:GetService("DataStoreService")
local Players = game:GetService("Players")
local lbStore = DataStoreService:GetOrderedDataStore("TopCoins_v1")

local BOARD_PART = workspace:FindFirstChild("LeaderboardDisplay") -- SurfaceGui target

local function updateLeaderboard()
    -- Upload current player scores
    for _, player in Players:GetPlayers() do
        local ls = player:FindFirstChild("leaderstats")
        if ls then
            local coins = ls:FindFirstChild("Coins")
            if coins then
                pcall(function()
                    lbStore:SetAsync(tostring(player.UserId), coins.Value)
                end)
            end
        end
    end

    -- Read top 10
    local ok, pages = pcall(function()
        return lbStore:GetSortedAsync(false, 10)
    end)
    if not ok or not pages then return end

    local entries = pages:GetCurrentPage()
    -- Update SurfaceGui or BillboardGui with results
    for rank, entry in entries do
        local userId = tonumber(entry.key)
        local score = entry.value
        local name = "[Unknown]"
        local nameOk, nameResult = pcall(function()
            return Players:GetNameFromUserIdAsync(userId)
        end)
        if nameOk then name = nameResult end
        -- Update display (SurfaceGui TextLabels)
        print("#" .. rank .. " " .. name .. ": " .. score)
    end
end

-- Update every 60 seconds
task.spawn(function()
    while true do
        updateLeaderboard()
        task.wait(60)
    end
end)
```

---

## Trading System Between Players

```lua
-- Server Script: Secure trading (both players must confirm)
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Trades = {}

local InitTrade = Instance.new("RemoteEvent")
InitTrade.Name = "InitTrade"; InitTrade.Parent = ReplicatedStorage
local ConfirmTrade = Instance.new("RemoteEvent")
ConfirmTrade.Name = "ConfirmTrade"; ConfirmTrade.Parent = ReplicatedStorage

InitTrade.OnServerEvent:Connect(function(sender, targetPlayer, offeredPets, requestedPets)
    -- Validate both players exist and are in-game
    if not sender or not targetPlayer then return end
    if not sender.Parent or not targetPlayer.Parent then return end

    -- Validate ownership of offered pets (check player's save data)
    -- Create trade session
    local tradeId = sender.UserId .. "_" .. targetPlayer.UserId .. "_" .. tick()
    Trades[tradeId] = {
        sender = sender,
        target = targetPlayer,
        senderOffer = offeredPets,
        targetOffer = requestedPets,
        senderConfirmed = false,
        targetConfirmed = false,
    }

    -- Notify target player of trade request
    -- (fire a RemoteEvent to show trade UI on target's screen)
end)

ConfirmTrade.OnServerEvent:Connect(function(player, tradeId)
    local trade = Trades[tradeId]
    if not trade then return end

    if player == trade.sender then
        trade.senderConfirmed = true
    elseif player == trade.target then
        trade.targetConfirmed = true
    end

    -- Both confirmed — execute swap
    if trade.senderConfirmed and trade.targetConfirmed then
        -- Transfer pets between player data stores
        -- Remove offered pets from sender, add to target
        -- Remove requested pets from target, add to sender
        -- Fire success events to both clients
        Trades[tradeId] = nil
    end
end)
```

---

## Auto-Farming / Idle Mechanics

```lua
-- Server Script: Auto-collect unlocked at Rebirth 1
-- Passively earns currency every second based on equipped pet multipliers

local Players = game:GetService("Players")
local RunService = game:GetService("RunService")

local AUTO_COLLECT_BASE = 1 -- coins per second base rate
local AUTO_COLLECT_INTERVAL = 1 -- seconds between collections

task.spawn(function()
    while true do
        task.wait(AUTO_COLLECT_INTERVAL)
        for _, player in Players:GetPlayers() do
            local ls = player:FindFirstChild("leaderstats")
            if not ls then continue end
            local rebirths = ls:FindFirstChild("Rebirths")
            if not rebirths or rebirths.Value < 1 then continue end -- need rebirth 1

            local coins = ls:FindFirstChild("Coins")
            if not coins then continue end

            -- Calculate auto-earn rate
            local mult = 1 + (rebirths.Value * 0.5)
            -- Add pet bonuses (sum of equipped pet multipliers)
            local petBonus = 1.0 -- would be calculated from equipped pets
            local earned = math.floor(AUTO_COLLECT_BASE * mult * petBonus)
            coins.Value += earned
        end
    end
end)
```

---

## Zone/World Unlock System

```lua
-- Zone gates: ProximityPrompt that checks currency and unlocks
local ZONES = {
    {name = "Starter Meadow", cost = 0,      currency = "Coins"},
    {name = "Crystal Cave",   cost = 5000,    currency = "Coins"},
    {name = "Lava Mountain",  cost = 50000,   currency = "Coins"},
    {name = "Sky Islands",    cost = 500000,  currency = "Coins"},
    {name = "Void Realm",     cost = 100,     currency = "Gems"},
}
```

---

## Complete Working Simulator (Minimal)

A basic but functional simulator with clicking, selling, backpack, rebirth, and leaderstats:

```lua
-- Complete Simulator Server Script (ServerScriptService)
local Players = game:GetService("Players")
local DataStoreService = game:GetService("DataStoreService")
local store = DataStoreService:GetDataStore("MiniSim_v1")

-- Setup leaderstats + data
Players.PlayerAdded:Connect(function(player)
    local ls = Instance.new("Folder"); ls.Name = "leaderstats"; ls.Parent = player
    local coins = Instance.new("IntValue"); coins.Name = "Coins"; coins.Value = 0; coins.Parent = ls
    local rebirths = Instance.new("IntValue"); rebirths.Name = "Rebirths"; rebirths.Value = 0; rebirths.Parent = ls

    -- Load from DataStore
    local ok, data = pcall(function() return store:GetAsync("p_" .. player.UserId) end)
    if ok and type(data) == "table" then
        coins.Value = data.Coins or 0
        rebirths.Value = data.Rebirths or 0
    end
end)

-- Save on leave
Players.PlayerRemoving:Connect(function(player)
    local ls = player:FindFirstChild("leaderstats")
    if not ls then return end
    pcall(function()
        store:SetAsync("p_" .. player.UserId, {
            Coins = ls.Coins.Value,
            Rebirths = ls.Rebirths.Value,
        })
    end)
end)

-- Save on shutdown
game:BindToClose(function()
    for _, player in Players:GetPlayers() do
        local ls = player:FindFirstChild("leaderstats")
        if not ls then continue end
        pcall(function()
            store:SetAsync("p_" .. player.UserId, {
                Coins = ls.Coins.Value,
                Rebirths = ls.Rebirths.Value,
            })
        end)
    end
end)
```

This reference covers every major system needed for a production simulator. Each component is independent and composable — mix and match based on the game design.
