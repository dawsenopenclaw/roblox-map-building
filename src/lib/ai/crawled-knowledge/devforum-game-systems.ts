// DevForum Game Systems Knowledge
// Distilled from Roblox Developer Forum community posts
// Covers: Tycoon, Simulator, Inventory, Pet, Trading, Quest patterns

export const DEVFORUM_GAME_SYSTEMS = `
=== TYCOON GAME PATTERNS ===

// Pattern from DevForum: Tycoon Framework/System
// Auto-assign plots to players on join. Never require manual claiming.

-- TYCOON OWNERSHIP SYSTEM (OOP approach)
local TycoonClass = {}
TycoonClass.__index = TycoonClass

function TycoonClass.new(player, plotModel)
    local self = setmetatable({}, TycoonClass)
    self.Player = player
    self.Plot = plotModel
    self.Buildings = {}
    self.Income = 0
    self.IncomeRate = 1 -- studs per second
    return self
end

function TycoonClass:AddBuilding(buildingName, model)
    local clone = model:Clone()
    clone.Parent = self.Plot.Buildings
    self.Buildings[buildingName] = clone
    self.IncomeRate += clone:GetAttribute("IncomeBonus") or 0
end

function TycoonClass:Clear()
    for _, building in self.Plot.Buildings:GetChildren() do
        building:Destroy()
    end
    self.Buildings = {}
    self.IncomeRate = 1
end

-- SERVER: assign tycoon slots on join
local Tycoons = {}
local Plots = workspace.Plots:GetChildren()
local nextPlot = 1

game.Players.PlayerAdded:Connect(function(player)
    local plot = Plots[nextPlot]
    nextPlot = (nextPlot % #Plots) + 1
    Tycoons[player.UserId] = TycoonClass.new(player, plot)
    plot:SetAttribute("Owner", player.UserId)
end)

game.Players.PlayerRemoving:Connect(function(player)
    if Tycoons[player.UserId] then
        Tycoons[player.UserId]:Clear()
        Tycoons[player.UserId] = nil
    end
end)

-- PURCHASE BUTTON SYSTEM
-- Buttons are Parts in workspace with attributes: Cost, BuildingName, Purchased
local function setupButton(button)
    local cost = button:GetAttribute("Cost")
    local buildingName = button:GetAttribute("BuildingName")

    button.Touched:Connect(function(hit)
        local character = hit.Parent
        local player = game.Players:GetPlayerFromCharacter(character)
        if not player then return end

        local tycoon = Tycoons[player.UserId]
        if not tycoon then return end
        if button:GetAttribute("Purchased") then return end

        local cash = player.leaderstats.Cash.Value
        if cash >= cost then
            player.leaderstats.Cash.Value -= cost
            button:SetAttribute("Purchased", true)
            button.Parent = nil -- remove button
            tycoon:AddBuilding(buildingName, ServerStorage.Buildings[buildingName])
        end
    end)
end

-- INCOME LOOP (server-side, runs every second)
task.spawn(function()
    while true do
        task.wait(1)
        for userId, tycoon in Tycoons do
            local player = game.Players:GetPlayerByUserId(userId)
            if player then
                player.leaderstats.Cash.Value += tycoon.IncomeRate
            end
        end
    end
end)

-- SAVE PATTERN for tycoon state
local function saveTycoonData(player)
    local tycoon = Tycoons[player.UserId]
    if not tycoon then return end
    local saveData = {
        Buildings = {},
        Cash = player.leaderstats.Cash.Value,
    }
    for name, _ in tycoon.Buildings do
        table.insert(saveData.Buildings, name)
    end
    return saveData
end

=== SIMULATOR GAME PATTERNS ===

// Pattern from DevForum: The Basic Element of A Simulator Game (Part 1)
// Leaderstats + click loop + RemoteEvent cooldown = core simulator loop

-- LEADERSTATS SETUP (ServerScript in ServerScriptService)
local function setupLeaderstats(player)
    local leaderstats = Instance.new("Folder")
    leaderstats.Name = "leaderstats"
    leaderstats.Parent = player

    local points = Instance.new("IntValue")
    points.Name = "Points"
    points.Value = 0
    points.Parent = leaderstats

    local gems = Instance.new("IntValue")
    gems.Name = "Gems"
    gems.Value = 0
    gems.Parent = leaderstats

    local rebirths = Instance.new("IntValue")
    rebirths.Name = "Rebirths"
    rebirths.Value = 0
    rebirths.Parent = leaderstats
end
game.Players.PlayerAdded:Connect(setupLeaderstats)

-- CLICK TOOL (LocalScript in Tool)
local tool = script.Parent
local remote = game.ReplicatedStorage:WaitForChild("AddPoints")
local cooldown = false

tool.Activated:Connect(function()
    if cooldown then return end
    cooldown = true
    remote:FireServer()
    task.wait(0.5) -- click cooldown
    cooldown = false
end)

-- SERVER HANDLER
local AddPoints = game.ReplicatedStorage.AddPoints
local POINTS_PER_CLICK = 1

AddPoints.OnServerEvent:Connect(function(player)
    local rebirths = player.leaderstats.Rebirths.Value
    local multiplier = 1 + (rebirths * 0.5) -- 50% bonus per rebirth
    player.leaderstats.Points.Value += math.floor(POINTS_PER_CLICK * multiplier)
end)

-- REBIRTH SYSTEM
local RebirthRemote = game.ReplicatedStorage.Rebirth
local REBIRTH_COST = 1000

RebirthRemote.OnServerEvent:Connect(function(player)
    if player.leaderstats.Points.Value >= REBIRTH_COST then
        player.leaderstats.Points.Value = 0
        player.leaderstats.Rebirths.Value += 1
        -- Reset pets, tools, etc. as needed
    end
end)

-- AUTO-COLLECT ZONE (for idle simulators)
local function setupAutoCollect(zone, player)
    zone.Touched:Connect(function(hit)
        local char = hit.Parent
        if game.Players:GetPlayerFromCharacter(char) == player then
            -- collect orbs/items in zone
            for _, orb in zone:GetChildren() do
                if orb:IsA("Part") and orb:GetAttribute("Value") then
                    player.leaderstats.Points.Value += orb:GetAttribute("Value")
                    orb:Destroy()
                end
            end
        end
    end)
end

=== OOP INVENTORY SYSTEM ===

// Pattern from DevForum: OOP Inventory System (Community Tutorial)
// Double-wrapped metatables for clean inheritance between DataClass and InvClass

-- DATA CLASS (handles persistence)
local DataStore = game:GetService("DataStoreService"):GetDataStore("PlayerInventory")

local DataClass = {}
DataClass.__index = DataClass

function DataClass.new(player)
    local self = setmetatable({}, DataClass)
    self.Player = player
    self.Data = {} -- { itemName = count }
    return self
end

function DataClass:LoadData()
    local success, result = pcall(function()
        return DataStore:GetAsync(self.Player.UserId)
    end)
    if success and result then
        self.Data = result
    else
        -- Default starter inventory
        self.Data = { ["StarterSword"] = 1, ["Gold"] = 100 }
    end
end

function DataClass:SaveData()
    local success, err = pcall(function()
        DataStore:UpdateAsync(self.Player.UserId, function()
            return self.Data
        end)
    end)
    if not success then
        warn("Failed to save inventory for", self.Player.Name, err)
    end
end

-- INVENTORY CLASS (inherits from DataClass)
local InvClass = {}
InvClass.__index = InvClass

function InvClass.new(player, dataClass)
    dataClass:LoadData()
    local self = setmetatable({}, {__index = function(t, k)
        return InvClass[k] or dataClass[k]
    end})
    self.Player = player
    self._data = dataClass
    return self
end

function InvClass:AddItem(itemName, amount)
    amount = amount or 1
    local data = self._data.Data
    data[itemName] = (data[itemName] or 0) + amount
end

function InvClass:RemoveItem(itemName, amount)
    amount = amount or 1
    local data = self._data.Data
    if (data[itemName] or 0) < amount then
        return false -- not enough
    end
    data[itemName] -= amount
    if data[itemName] <= 0 then
        data[itemName] = nil
    end
    return true
end

function InvClass:HasItem(itemName, amount)
    amount = amount or 1
    return (self._data.Data[itemName] or 0) >= amount
end

function InvClass:GetItems()
    return self._data.Data
end

function InvClass:Save()
    self._data:SaveData()
end

-- USAGE
local PlayerInventories = {}

game.Players.PlayerAdded:Connect(function(player)
    local dc = DataClass.new(player)
    PlayerInventories[player.UserId] = InvClass.new(player, dc)
end)

game.Players.PlayerRemoving:Connect(function(player)
    local inv = PlayerInventories[player.UserId]
    if inv then
        inv:Save()
        PlayerInventories[player.UserId] = nil
    end
end)

=== PET SYSTEM (SIMULATOR STYLE) ===

// Pattern from DevForum: Pet follow module [Simulator style]
// Client-only, circular orbit via RunService, no physics bodies

-- PET MODULE (LocalScript / ModuleScript for client)
local RunService = game:GetService("RunService")
local Players = game:GetService("Players")

local PetModule = {}
local activePets = {} -- { player = { {model, angle} } }

local CONFIG = {
    Radius = 4,           -- studs from player center
    Responsiveness = 0.1, -- lerp speed (0=no follow, 1=instant)
    YDrift = 1.5,         -- max vertical oscillation in studs
    YDriftSpeed = 2,      -- oscillation speed
}

local function getOrbitPosition(playerChar, index, total, t)
    local root = playerChar:FindFirstChild("HumanoidRootPart")
    if not root then return Vector3.new() end

    local angleOffset = (2 * math.pi / math.max(total, 1)) * (index - 1)
    local angle = t * 0.5 + angleOffset -- slowly rotate orbit

    local x = math.cos(angle) * CONFIG.Radius
    local z = math.sin(angle) * CONFIG.Radius
    local y = math.sin(t * CONFIG.YDriftSpeed + angleOffset) * CONFIG.YDrift + 3

    return root.Position + Vector3.new(x, y, z)
end

function PetModule.AddPet(player, petModelTemplate)
    if not activePets[player] then
        activePets[player] = {}
    end
    local clone = petModelTemplate:Clone()
    clone.Parent = workspace.Pets
    -- Disable shadows for perf
    for _, part in clone:GetDescendants() do
        if part:IsA("BasePart") then
            part.CastShadow = false
        end
    end
    table.insert(activePets[player], { model = clone, offset = #activePets[player] })
    return clone
end

function PetModule.RemovePet(player, petModel)
    if not activePets[player] then return end
    for i, entry in activePets[player] do
        if entry.model == petModel then
            entry.model:Destroy()
            table.remove(activePets[player], i)
            break
        end
    end
end

-- Update loop — runs on RenderStep for smooth movement
RunService:BindToRenderStep("PetUpdate", Enum.RenderPriority.Last.Value, function(dt)
    local t = tick()
    for player, pets in activePets do
        local char = player.Character
        if not char then continue end
        local total = #pets
        for i, entry in ipairs(pets) do
            local targetPos = getOrbitPosition(char, i, total, t)
            local currentCF = entry.model.PrimaryPart and entry.model.PrimaryPart.CFrame
                              or CFrame.new(targetPos)
            local newCF = currentCF:Lerp(CFrame.new(targetPos), CONFIG.Responsiveness)
            entry.model:PivotTo(newCF)
        end
    end
end)

-- Listen for pets added to player folder (server syncs via attributes or folders)
local function watchPlayerPets(player)
    local petsFolder = player:WaitForChild("Pets", 10)
    if not petsFolder then return end
    petsFolder.ChildAdded:Connect(function(child)
        local template = game.ReplicatedStorage.PetModels:FindFirstChild(child.Name)
        if template then
            PetModule.AddPet(player, template)
        end
    end)
    petsFolder.ChildRemoved:Connect(function(child)
        -- find and remove matching pet
    end)
end

game.Players.PlayerAdded:Connect(watchPlayerPets)

=== TRADING SYSTEM ===

// Pattern from DevForum: Live Trading System architecture
// State machine: Idle → Requested → InTrade → Confirmed → Complete

-- TRADE STATE MANAGER (ServerScript)
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Remotes = ReplicatedStorage.TradeRemotes

-- States: "Idle" | "Requested" | "InTrade" | "Confirmed"
local TradeStates = {} -- { userId = { state, partner, offer } }

local function getState(player)
    return TradeStates[player.UserId] or { state = "Idle" }
end

local function setState(player, state, data)
    TradeStates[player.UserId] = table.merge({ state = state }, data or {})
end

-- REQUEST TRADE
Remotes.RequestTrade.OnServerEvent:Connect(function(sender, targetPlayer)
    if getState(sender).state ~= "Idle" then return end
    if getState(targetPlayer).state ~= "Idle" then
        Remotes.TradeResponse:FireClient(sender, false, "PlayerBusy")
        return
    end

    setState(sender, "Requested", { partner = targetPlayer })
    Remotes.TradeRequested:FireClient(targetPlayer, sender)
end)

-- ACCEPT TRADE
Remotes.AcceptTrade.OnServerEvent:Connect(function(accepter, requester)
    if getState(requester).state ~= "Requested" then return end
    if getState(requester).partner ~= accepter then return end

    setState(accepter, "InTrade", { partner = requester, offer = {} })
    setState(requester, "InTrade", { partner = accepter, offer = {} })

    -- Notify both clients to open trade UI
    Remotes.TradeOpened:FireClient(accepter, requester)
    Remotes.TradeOpened:FireClient(requester, accepter)
end)

-- UPDATE OFFER
Remotes.UpdateOffer.OnServerEvent:Connect(function(player, items)
    local state = getState(player)
    if state.state ~= "InTrade" then return end

    -- Validate player actually has items
    local inv = PlayerInventories[player.UserId]
    for itemName, count in items do
        if not inv:HasItem(itemName, count) then
            Remotes.TradeError:FireClient(player, "InvalidItem")
            return
        end
    end

    state.offer = items
    -- Notify partner of updated offer
    Remotes.OfferUpdated:FireClient(state.partner, items)
end)

-- CONFIRM TRADE (both must confirm to complete)
local ConfirmedPlayers = {}
Remotes.ConfirmTrade.OnServerEvent:Connect(function(player)
    local state = getState(player)
    if state.state ~= "InTrade" then return end
    ConfirmedPlayers[player.UserId] = true

    local partnerState = getState(state.partner)
    if ConfirmedPlayers[state.partner.UserId] then
        -- Both confirmed — execute trade
        local invA = PlayerInventories[player.UserId]
        local invB = PlayerInventories[state.partner.UserId]

        for item, count in state.offer do
            invA:RemoveItem(item, count)
            invB:AddItem(item, count)
        end
        for item, count in partnerState.offer do
            invB:RemoveItem(item, count)
            invA:AddItem(item, count)
        end

        invA:Save()
        invB:Save()

        Remotes.TradeComplete:FireClient(player)
        Remotes.TradeComplete:FireClient(state.partner)

        ConfirmedPlayers[player.UserId] = nil
        ConfirmedPlayers[state.partner.UserId] = nil
        setState(player, "Idle")
        setState(state.partner, "Idle")
    else
        Remotes.PartnerConfirmed:FireClient(state.partner) -- show "Waiting for partner"
    end
end)

=== QUEST / OBJECTIVE SYSTEM ===

// Pattern: Generic quest tracker with objectives and rewards

-- QUEST DEFINITIONS (ModuleScript)
local QuestLibrary = {
    CollectWood = {
        Name = "Lumberjack",
        Description = "Collect 50 wood",
        Objectives = {
            { type = "Collect", item = "Wood", amount = 50 }
        },
        Rewards = { { type = "Currency", currency = "Gold", amount = 100 } }
    },
    DefeatEnemies = {
        Name = "Warrior",
        Description = "Defeat 10 enemies",
        Objectives = {
            { type = "Kill", enemy = "Goblin", amount = 10 }
        },
        Rewards = { { type = "Item", item = "IronSword", amount = 1 } }
    }
}

-- QUEST MANAGER (ServerScript)
local PlayerQuests = {} -- { userId = { questId = { progress, completed } } }

local function initPlayerQuests(player)
    PlayerQuests[player.UserId] = {}
end

local function acceptQuest(player, questId)
    local questDef = QuestLibrary[questId]
    if not questDef then return false end
    if PlayerQuests[player.UserId][questId] then return false end -- already active

    PlayerQuests[player.UserId][questId] = {
        Progress = {},
        Completed = false,
    }
    for _, obj in questDef.Objectives do
        PlayerQuests[player.UserId][questId].Progress[obj.item or obj.enemy] = 0
    end
    return true
end

local function updateQuestProgress(player, progressType, key, amount)
    for questId, questData in PlayerQuests[player.UserId] do
        if questData.Completed then continue end
        local questDef = QuestLibrary[questId]
        for _, obj in questDef.Objectives do
            if obj.type == progressType and (obj.item == key or obj.enemy == key) then
                questData.Progress[key] = (questData.Progress[key] or 0) + amount
                -- Check completion
                local allDone = true
                for _, o in questDef.Objectives do
                    local k = o.item or o.enemy
                    if (questData.Progress[k] or 0) < o.amount then
                        allDone = false
                        break
                    end
                end
                if allDone then
                    questData.Completed = true
                    -- Grant rewards
                    for _, reward in questDef.Rewards do
                        if reward.type == "Currency" then
                            player.leaderstats[reward.currency].Value += reward.amount
                        elseif reward.type == "Item" then
                            local inv = PlayerInventories[player.UserId]
                            if inv then inv:AddItem(reward.item, reward.amount) end
                        end
                    end
                    game.ReplicatedStorage.QuestCompleted:FireClient(player, questId)
                end
            end
        end
    end
end

game.Players.PlayerAdded:Connect(initPlayerQuests)
`;
