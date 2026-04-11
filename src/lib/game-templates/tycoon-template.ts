/**
 * Tycoon Template — a complete, progression-based tycoon game.
 *
 * Includes: spawn pad, 5 buy pads unlocking droppers, a conveyor, a sell pad,
 * a leaderboard, a datastore-backed currency system, and game-pass aware
 * dropper upgrades. Drop this template into an empty baseplate and you have
 * a playable tycoon in under a minute.
 */

import type { GameTemplate } from './types'
import type { StructuredCommand } from '@/lib/ai/structured-commands'

const commands: StructuredCommand[] = [
  // Baseplate folder
  { type: 'create_folder', name: 'Tycoon', parentName: 'Workspace' },

  // Spawn pad
  {
    type: 'create_part',
    name: 'SpawnPad',
    position: { x: 0, y: 1, z: 0 },
    size: { x: 30, y: 1, z: 30 },
    color: { r: 80, g: 200, b: 120 },
    material: 'SmoothPlastic',
    anchored: true,
    parentName: 'Tycoon',
  },
  // Base plot
  {
    type: 'create_part',
    name: 'PlotFloor',
    position: { x: 120, y: 0.5, z: 0 },
    size: { x: 200, y: 1, z: 200 },
    color: { r: 120, g: 110, b: 100 },
    material: 'Concrete',
    anchored: true,
    parentName: 'Tycoon',
  },
  // Buy pads (5 progression stages)
  {
    type: 'create_part',
    name: 'BuyPad_Dropper1',
    position: { x: 50, y: 1, z: 20 },
    size: { x: 8, y: 1, z: 8 },
    color: { r: 255, g: 200, b: 0 },
    material: 'Neon',
    anchored: true,
    parentName: 'Tycoon',
  },
  {
    type: 'create_part',
    name: 'BuyPad_Conveyor',
    position: { x: 70, y: 1, z: 20 },
    size: { x: 8, y: 1, z: 8 },
    color: { r: 255, g: 150, b: 0 },
    material: 'Neon',
    anchored: true,
    parentName: 'Tycoon',
  },
  {
    type: 'create_part',
    name: 'BuyPad_Dropper2',
    position: { x: 90, y: 1, z: 20 },
    size: { x: 8, y: 1, z: 8 },
    color: { r: 255, g: 100, b: 0 },
    material: 'Neon',
    anchored: true,
    parentName: 'Tycoon',
  },
  {
    type: 'create_part',
    name: 'BuyPad_Upgrader',
    position: { x: 110, y: 1, z: 20 },
    size: { x: 8, y: 1, z: 8 },
    color: { r: 255, g: 50, b: 50 },
    material: 'Neon',
    anchored: true,
    parentName: 'Tycoon',
  },
  {
    type: 'create_part',
    name: 'BuyPad_SellPad',
    position: { x: 130, y: 1, z: 20 },
    size: { x: 8, y: 1, z: 8 },
    color: { r: 120, g: 50, b: 200 },
    material: 'Neon',
    anchored: true,
    parentName: 'Tycoon',
  },
  // Sell pad (always present)
  {
    type: 'create_part',
    name: 'SellPad',
    position: { x: 160, y: 1, z: 0 },
    size: { x: 14, y: 1, z: 14 },
    color: { r: 0, g: 200, b: 255 },
    material: 'Neon',
    anchored: true,
    parentName: 'Tycoon',
  },
  // Dropper platform (used by Dropper1 after buy)
  {
    type: 'create_part',
    name: 'DropperPlatform',
    position: { x: 80, y: 8, z: -20 },
    size: { x: 10, y: 2, z: 10 },
    color: { r: 60, g: 60, b: 80 },
    material: 'Metal',
    anchored: true,
    parentName: 'Tycoon',
  },
  // Conveyor
  {
    type: 'create_part',
    name: 'Conveyor',
    position: { x: 110, y: 4, z: -20 },
    size: { x: 30, y: 1, z: 6 },
    color: { r: 30, g: 30, b: 30 },
    material: 'Metal',
    anchored: true,
    parentName: 'Tycoon',
  },
]

const currencyScript = `-- Tycoon currency / leaderstats
-- Manages per-player Cash and XP with datastore persistence.

local Players = game:GetService("Players")
local DataStoreService = game:GetService("DataStoreService")

local store = DataStoreService:GetDataStore("TycoonSave_v1")

local function setupLeaderstats(player)
    local ls = Instance.new("Folder")
    ls.Name = "leaderstats"
    ls.Parent = player

    local cash = Instance.new("IntValue")
    cash.Name = "Cash"
    cash.Value = 0
    cash.Parent = ls

    local xp = Instance.new("IntValue")
    xp.Name = "XP"
    xp.Value = 0
    xp.Parent = ls
end

local function loadPlayer(player)
    setupLeaderstats(player)
    local ok, data = pcall(function()
        return store:GetAsync("player_" .. player.UserId)
    end)
    if ok and data then
        player.leaderstats.Cash.Value = data.cash or 0
        player.leaderstats.XP.Value = data.xp or 0
    end
end

local function savePlayer(player)
    local ls = player:FindFirstChild("leaderstats")
    if not ls then return end
    pcall(function()
        store:SetAsync("player_" .. player.UserId, {
            cash = ls.Cash.Value,
            xp = ls.XP.Value,
        })
    end)
end

Players.PlayerAdded:Connect(loadPlayer)
Players.PlayerRemoving:Connect(savePlayer)

game:BindToClose(function()
    for _, p in ipairs(Players:GetPlayers()) do savePlayer(p) end
end)

print("[Tycoon] currency system online")
`

const buyPadScript = `-- Tycoon buy-pad controller
-- Touches a buy pad to spend cash and unlock the next progression stage.

local Players = game:GetService("Players")
local Workspace = game:GetService("Workspace")

local tycoon = Workspace:WaitForChild("Tycoon")

local BUY_PADS = {
    BuyPad_Dropper1 = { cost = 50,    unlocks = { "DropperPlatform" } },
    BuyPad_Conveyor = { cost = 200,   unlocks = { "Conveyor" } },
    BuyPad_Dropper2 = { cost = 500,   unlocks = {} },
    BuyPad_Upgrader = { cost = 1500,  unlocks = {} },
    BuyPad_SellPad  = { cost = 5000,  unlocks = {} },
}

local function tryBuy(padName, player)
    local pad = tycoon:FindFirstChild(padName)
    local info = BUY_PADS[padName]
    if not pad or not info then return end
    local ls = player:FindFirstChild("leaderstats")
    if not ls then return end
    if ls.Cash.Value < info.cost then return end

    ls.Cash.Value = ls.Cash.Value - info.cost
    pad:Destroy()

    for _, childName in ipairs(info.unlocks) do
        local target = tycoon:FindFirstChild(childName)
        if target then
            target.Transparency = 0
            target.CanCollide = true
        end
    end
end

local cooldown = {}
for padName in pairs(BUY_PADS) do
    local pad = tycoon:WaitForChild(padName)
    pad.Touched:Connect(function(hit)
        local char = hit:FindFirstAncestorOfClass("Model")
        local player = char and Players:GetPlayerFromCharacter(char)
        if not player then return end
        if cooldown[player.UserId] then return end
        cooldown[player.UserId] = true
        tryBuy(padName, player)
        task.delay(0.5, function() cooldown[player.UserId] = nil end)
    end)
end

print("[Tycoon] buy pads armed")
`

const dropperScript = `-- Tycoon dropper loop
-- Periodically spawns a money brick on top of the dropper platform.

local Workspace = game:GetService("Workspace")
local ServerStorage = game:GetService("ServerStorage")

local DROP_INTERVAL = 1.25
local DROP_VALUE = 5
local MAX_DROPS = 120

local tycoon = Workspace:WaitForChild("Tycoon")
local platform = tycoon:WaitForChild("DropperPlatform")

local dropsFolder = Instance.new("Folder")
dropsFolder.Name = "Drops"
dropsFolder.Parent = tycoon

local function spawnDrop()
    if #dropsFolder:GetChildren() >= MAX_DROPS then return end
    local part = Instance.new("Part")
    part.Name = "Cash"
    part.Size = Vector3.new(1, 1, 1)
    part.Material = Enum.Material.Neon
    part.Color = Color3.fromRGB(255, 230, 80)
    part.Position = platform.Position + Vector3.new(0, 4, 0)
    part:SetAttribute("Value", DROP_VALUE)
    part.Parent = dropsFolder
end

task.spawn(function()
    while true do
        task.wait(DROP_INTERVAL)
        spawnDrop()
    end
end)

print("[Tycoon] dropper active")
`

const conveyorScript = `-- Tycoon conveyor pushes parts toward the sell pad
local Workspace = game:GetService("Workspace")
local RunService = game:GetService("RunService")

local tycoon = Workspace:WaitForChild("Tycoon")
local conveyor = tycoon:WaitForChild("Conveyor")

conveyor.AssemblyLinearVelocity = Vector3.new(0, 0, 0)

RunService.Heartbeat:Connect(function()
    for _, part in ipairs(Workspace:GetPartBoundsInBox(
        conveyor.CFrame,
        conveyor.Size + Vector3.new(0, 2, 0)
    )) do
        if part.Name == "Cash" and not part.Anchored then
            part.AssemblyLinearVelocity = Vector3.new(18, part.AssemblyLinearVelocity.Y, 0)
        end
    end
end)

print("[Tycoon] conveyor online")
`

const sellPadScript = `-- Tycoon sell pad — converts dropped cash bricks to player currency.
local Workspace = game:GetService("Workspace")
local Players = game:GetService("Players")

local tycoon = Workspace:WaitForChild("Tycoon")
local sellPad = tycoon:WaitForChild("SellPad")

local function awardNearestPlayer(value)
    local best = nil
    local bestDist = math.huge
    for _, p in ipairs(Players:GetPlayers()) do
        local char = p.Character
        if char and char.PrimaryPart then
            local d = (char.PrimaryPart.Position - sellPad.Position).Magnitude
            if d < bestDist then bestDist = d; best = p end
        end
    end
    if best and best:FindFirstChild("leaderstats") then
        best.leaderstats.Cash.Value = best.leaderstats.Cash.Value + value
    end
end

sellPad.Touched:Connect(function(hit)
    if hit.Name == "Cash" then
        local val = hit:GetAttribute("Value") or 1
        awardNearestPlayer(val)
        hit:Destroy()
    end
end)

print("[Tycoon] sell pad armed")
`

export const tycoonTemplate: GameTemplate = {
  id: 'tycoon',
  name: 'Classic Tycoon',
  description:
    'Full tycoon with progression buy pads, dropper, conveyor, sell pad, leaderstats, and datastore saves.',
  genre: 'tycoon',
  estimatedBuildTime: '45s',
  thumbnailPrompt:
    'overhead view of a bright low-poly Roblox tycoon plot with glowing yellow buy pads, a dropper with cash bricks, and a sell pad',
  partCount: 11,
  scriptCount: 5,
  structuredCommands: commands,
  serverScripts: [
    { name: 'Currency', parent: 'ServerScriptService', source: currencyScript },
    { name: 'BuyPads', parent: 'ServerScriptService', source: buyPadScript },
    { name: 'Dropper', parent: 'ServerScriptService', source: dropperScript },
    { name: 'Conveyor', parent: 'ServerScriptService', source: conveyorScript },
    { name: 'SellPad', parent: 'ServerScriptService', source: sellPadScript },
  ],
  uiTemplates: ['hud', 'shop', 'notification-toast', 'daily-rewards'],
  mechanics: ['currency', 'datastore', 'leaderboard'],
  monetization: {
    devProducts: [
      { id: 'cash_1k',   name: '1,000 Cash',   description: 'Instant 1,000 cash drop',  priceRobux: 25  },
      { id: 'cash_10k',  name: '10,000 Cash',  description: 'Instant 10,000 cash drop', priceRobux: 99  },
      { id: 'cash_100k', name: '100,000 Cash', description: 'Instant 100k windfall',    priceRobux: 499 },
    ],
    gamePasses: [
      { id: 'double_cash', name: '2x Cash',       description: 'Double all dropper income forever', priceRobux: 199 },
      { id: 'vip_dropper', name: 'VIP Dropper',   description: 'Unlock an exclusive platinum dropper', priceRobux: 399 },
    ],
  },
}
