/**
 * Simulator Template — clicker simulator with pet companion and prestige.
 */

import type { GameTemplate } from './types'
import type { StructuredCommand } from '@/lib/ai/structured-commands'

const commands: StructuredCommand[] = [
  { type: 'create_folder', name: 'Simulator', parentName: 'Workspace' },
  {
    type: 'create_part',
    name: 'Floor',
    position: { x: 0, y: 0, z: 0 },
    size: { x: 200, y: 1, z: 200 },
    color: { r: 120, g: 220, b: 140 },
    material: 'Grass',
    anchored: true,
    parentName: 'Simulator',
  },
  {
    type: 'create_part',
    name: 'ClickOrb',
    position: { x: 0, y: 8, z: 0 },
    size: { x: 6, y: 6, z: 6 },
    color: { r: 255, g: 200, b: 40 },
    material: 'Neon',
    anchored: true,
    parentName: 'Simulator',
  },
  {
    type: 'create_part',
    name: 'Pedestal',
    position: { x: 0, y: 3, z: 0 },
    size: { x: 8, y: 4, z: 8 },
    color: { r: 120, g: 80, b: 200 },
    material: 'Marble',
    anchored: true,
    parentName: 'Simulator',
  },
  {
    type: 'create_part',
    name: 'PrestigePortal',
    position: { x: 40, y: 6, z: 0 },
    size: { x: 8, y: 12, z: 2 },
    color: { r: 200, g: 80, b: 255 },
    material: 'ForceField',
    anchored: true,
    parentName: 'Simulator',
  },
]

const simServer = `-- Simulator server
-- Tracks Taps, Coins, Pets, and Rebirths per player with datastore saves.

local Players = game:GetService("Players")
local DataStoreService = game:GetService("DataStoreService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Workspace = game:GetService("Workspace")

local store = DataStoreService:GetDataStore("Simulator_v1")

local tapEvent = Instance.new("RemoteEvent")
tapEvent.Name = "SimTap"
tapEvent.Parent = ReplicatedStorage

local prestigeEvent = Instance.new("RemoteEvent")
prestigeEvent.Name = "SimPrestige"
prestigeEvent.Parent = ReplicatedStorage

local BASE_TAP = 1
local PRESTIGE_REQ = 10000

local function setupStats(player)
    local ls = Instance.new("Folder")
    ls.Name = "leaderstats"
    ls.Parent = player

    local coins = Instance.new("IntValue")
    coins.Name = "Coins"
    coins.Parent = ls

    local taps = Instance.new("IntValue")
    taps.Name = "Taps"
    taps.Parent = ls

    local rebirths = Instance.new("IntValue")
    rebirths.Name = "Rebirths"
    rebirths.Parent = ls

    local ok, data = pcall(function() return store:GetAsync("s_" .. player.UserId) end)
    if ok and data then
        coins.Value = data.coins or 0
        taps.Value = data.taps or 0
        rebirths.Value = data.rebirths or 0
    end
end

Players.PlayerAdded:Connect(setupStats)

Players.PlayerRemoving:Connect(function(player)
    local ls = player:FindFirstChild("leaderstats")
    if not ls then return end
    pcall(function()
        store:SetAsync("s_" .. player.UserId, {
            coins = ls.Coins.Value,
            taps  = ls.Taps.Value,
            rebirths = ls.Rebirths.Value,
        })
    end)
end)

tapEvent.OnServerEvent:Connect(function(player)
    local ls = player:FindFirstChild("leaderstats")
    if not ls then return end
    local mult = 1 + ls.Rebirths.Value * 0.5
    local gain = math.floor(BASE_TAP * mult)
    ls.Taps.Value = ls.Taps.Value + 1
    ls.Coins.Value = ls.Coins.Value + gain
end)

prestigeEvent.OnServerEvent:Connect(function(player)
    local ls = player:FindFirstChild("leaderstats")
    if not ls then return end
    if ls.Coins.Value >= PRESTIGE_REQ then
        ls.Coins.Value = 0
        ls.Rebirths.Value = ls.Rebirths.Value + 1
    end
end)

print("[Simulator] server online")
`

const tapClient = `-- Simulator tap client
-- Clicking the orb fires the tap event, animates the orb, and spawns FX.

local Players = game:GetService("Players")
local Workspace = game:GetService("Workspace")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")
local UserInputService = game:GetService("UserInputService")

local player = Players.LocalPlayer
local tapEvent = ReplicatedStorage:WaitForChild("SimTap")
local prestigeEvent = ReplicatedStorage:WaitForChild("SimPrestige")

local sim = Workspace:WaitForChild("Simulator")
local orb = sim:WaitForChild("ClickOrb")
local portal = sim:WaitForChild("PrestigePortal")

local clickDetector = Instance.new("ClickDetector")
clickDetector.MaxActivationDistance = 24
clickDetector.Parent = orb

clickDetector.MouseClick:Connect(function()
    tapEvent:FireServer()
    local goal = orb.Size * 0.8
    TweenService:Create(orb, TweenInfo.new(0.1), { Size = goal }):Play()
    task.delay(0.1, function()
        TweenService:Create(orb, TweenInfo.new(0.1), { Size = Vector3.new(6, 6, 6) }):Play()
    end)
end)

portal.Touched:Connect(function(hit)
    if hit.Parent == player.Character then
        prestigeEvent:FireServer()
    end
end)

print("[Simulator] client ready")
`

const petScript = `-- Simulator pet companion
-- Spawns a small floating pet above every player that follows them around.

local Players = game:GetService("Players")
local RunService = game:GetService("RunService")

local function makePet(player)
    local pet = Instance.new("Part")
    pet.Name = "CompanionPet"
    pet.Size = Vector3.new(2, 2, 2)
    pet.Material = Enum.Material.Neon
    pet.Color = Color3.fromRGB(255, 180, 255)
    pet.Shape = Enum.PartType.Ball
    pet.CanCollide = false
    pet.Anchored = true
    pet.Parent = workspace

    RunService.Heartbeat:Connect(function()
        local char = player.Character
        if char and char.PrimaryPart then
            local target = char.PrimaryPart.Position + Vector3.new(3, 2, 3)
            pet.CFrame = pet.CFrame:Lerp(CFrame.new(target), 0.1)
        end
    end)

    player.AncestryChanged:Connect(function(_, parent)
        if not parent then pet:Destroy() end
    end)
end

Players.PlayerAdded:Connect(function(player)
    player.CharacterAdded:Connect(function() task.wait(0.5); makePet(player) end)
end)

print("[Simulator] pets ready")
`

const upgradeShopScript = `-- Simulator upgrade shop
-- Server-side validation for a simple "click multiplier" upgrade ladder.
-- Each upgrade multiplies coin-per-tap by 1.25. Cost scales exponentially.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local buyEvent = Instance.new("RemoteEvent")
buyEvent.Name = "SimBuyUpgrade"
buyEvent.Parent = ReplicatedStorage

local UPGRADES = {
    { id = "mult_1",  name = "Sharp Tap",      baseCost = 100,    mult = 1.25 },
    { id = "mult_2",  name = "Power Fist",     baseCost = 500,    mult = 1.25 },
    { id = "mult_3",  name = "Lightning Claw", baseCost = 2500,   mult = 1.25 },
    { id = "mult_4",  name = "Meteor Punch",   baseCost = 12500,  mult = 1.25 },
    { id = "mult_5",  name = "Galaxy Grip",    baseCost = 62500,  mult = 1.25 },
}

local function findUpgrade(id)
    for _, u in ipairs(UPGRADES) do
        if u.id == id then return u end
    end
    return nil
end

local function ensureMult(player)
    local mult = player:FindFirstChild("TapMult")
    if not mult then
        mult = Instance.new("NumberValue")
        mult.Name = "TapMult"
        mult.Value = 1
        mult.Parent = player
    end
    return mult
end

Players.PlayerAdded:Connect(function(player) ensureMult(player) end)

buyEvent.OnServerEvent:Connect(function(player, upgradeId)
    local u = findUpgrade(upgradeId)
    if not u then return end
    local ls = player:FindFirstChild("leaderstats")
    if not ls or not ls:FindFirstChild("Coins") then return end
    if ls.Coins.Value < u.baseCost then return end

    ls.Coins.Value = ls.Coins.Value - u.baseCost
    local mult = ensureMult(player)
    mult.Value = mult.Value * u.mult

    local toastEvent = ReplicatedStorage:FindFirstChild("ShowToast")
    if toastEvent then
        toastEvent:FireClient(player, {
            type = "success",
            title = "Upgrade!",
            message = u.name .. " unlocked",
        })
    end
end)

print("[Simulator] upgrade shop ready")
`

const autoSaveScript = `-- Simulator autosave loop
-- Saves all player data every 60 seconds so a server crash loses at most a minute.

local Players = game:GetService("Players")
local DataStoreService = game:GetService("DataStoreService")
local store = DataStoreService:GetDataStore("Simulator_v1")

local SAVE_INTERVAL = 60

local function savePlayer(player)
    local ls = player:FindFirstChild("leaderstats")
    if not ls then return end
    pcall(function()
        store:SetAsync("s_" .. player.UserId, {
            coins = ls.Coins.Value,
            taps  = ls.Taps.Value,
            rebirths = ls.Rebirths.Value,
        })
    end)
end

task.spawn(function()
    while true do
        task.wait(SAVE_INTERVAL)
        for _, p in ipairs(Players:GetPlayers()) do savePlayer(p) end
    end
end)

print("[Simulator] autosave loop running")
`

export const simulatorTemplate: GameTemplate = {
  id: 'simulator',
  name: 'Clicker Simulator',
  description:
    'Tap-to-earn simulator with floating pet companions, coin progression, and rebirth/prestige portal.',
  genre: 'simulator',
  estimatedBuildTime: '25s',
  thumbnailPrompt:
    'cartoony low-poly Roblox clicker scene with a glowing yellow orb on a purple pedestal and a pink pet floating nearby',
  partCount: 5,
  scriptCount: 5,
  structuredCommands: commands,
  serverScripts: [
    { name: 'SimServer', parent: 'ServerScriptService', source: simServer },
    { name: 'SimClient', parent: 'ReplicatedStorage', source: tapClient },
    { name: 'Pets', parent: 'ServerScriptService', source: petScript },
    { name: 'UpgradeShop', parent: 'ServerScriptService', source: upgradeShopScript },
    { name: 'AutoSave', parent: 'ServerScriptService', source: autoSaveScript },
  ],
  uiTemplates: ['hud', 'shop', 'daily-rewards', 'notification-toast'],
  mechanics: ['currency', 'prestige', 'pets'],
  monetization: {
    devProducts: [
      { id: 'coins_5k', name: '5k Coins', description: 'Instant 5,000 coins', priceRobux: 49 },
      { id: 'coins_50k', name: '50k Coins', description: 'Instant 50,000 coins', priceRobux: 299 },
    ],
    gamePasses: [
      { id: 'x2_taps', name: '2x Taps',  description: 'Every tap gives double coins',    priceRobux: 199 },
      { id: 'auto_tap', name: 'Auto-Tap', description: 'Automatically taps for you',     priceRobux: 349 },
    ],
  },
}
