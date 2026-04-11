/**
 * Racing Template — checkpoint race with vehicle spawner and finish line.
 */

import type { GameTemplate } from './types'
import type { StructuredCommand } from '@/lib/ai/structured-commands'

const commands: StructuredCommand[] = [
  { type: 'create_folder', name: 'Track', parentName: 'Workspace' },
  {
    type: 'create_part',
    name: 'Ground',
    position: { x: 0, y: 0, z: 0 },
    size: { x: 400, y: 1, z: 400 },
    color: { r: 60, g: 140, b: 60 },
    material: 'Grass',
    anchored: true,
    parentName: 'Track',
  },
  // Straightaway
  {
    type: 'create_part',
    name: 'Straight1',
    position: { x: 0, y: 1, z: 0 },
    size: { x: 30, y: 0.5, z: 200 },
    color: { r: 40, g: 40, b: 40 },
    material: 'Asphalt',
    anchored: true,
    parentName: 'Track',
  },
  {
    type: 'create_part',
    name: 'Turn1',
    position: { x: 50, y: 1, z: 100 },
    size: { x: 70, y: 0.5, z: 30 },
    color: { r: 40, g: 40, b: 40 },
    material: 'Asphalt',
    anchored: true,
    parentName: 'Track',
  },
  {
    type: 'create_part',
    name: 'Straight2',
    position: { x: 80, y: 1, z: 0 },
    size: { x: 30, y: 0.5, z: 200 },
    color: { r: 40, g: 40, b: 40 },
    material: 'Asphalt',
    anchored: true,
    parentName: 'Track',
  },
  {
    type: 'create_part',
    name: 'Turn2',
    position: { x: 40, y: 1, z: -100 },
    size: { x: 100, y: 0.5, z: 30 },
    color: { r: 40, g: 40, b: 40 },
    material: 'Asphalt',
    anchored: true,
    parentName: 'Track',
  },
  // Start / finish line
  {
    type: 'create_part',
    name: 'FinishLine',
    position: { x: 0, y: 1.2, z: -95 },
    size: { x: 30, y: 0.2, z: 4 },
    color: { r: 255, g: 255, b: 255 },
    material: 'Neon',
    anchored: true,
    parentName: 'Track',
  },
  // Checkpoints
  {
    type: 'create_part',
    name: 'CP1',
    position: { x: 0, y: 5, z: 80 },
    size: { x: 30, y: 8, z: 2 },
    color: { r: 80, g: 220, b: 140 },
    material: 'ForceField',
    anchored: true,
    parentName: 'Track',
  },
  {
    type: 'create_part',
    name: 'CP2',
    position: { x: 80, y: 5, z: 80 },
    size: { x: 30, y: 8, z: 2 },
    color: { r: 80, g: 220, b: 140 },
    material: 'ForceField',
    anchored: true,
    parentName: 'Track',
  },
  {
    type: 'create_part',
    name: 'CP3',
    position: { x: 80, y: 5, z: -60 },
    size: { x: 30, y: 8, z: 2 },
    color: { r: 80, g: 220, b: 140 },
    material: 'ForceField',
    anchored: true,
    parentName: 'Track',
  },
  // Vehicle spawner pad
  {
    type: 'create_part',
    name: 'VehicleSpawner',
    position: { x: -20, y: 1.5, z: -95 },
    size: { x: 10, y: 1, z: 20 },
    color: { r: 255, g: 200, b: 0 },
    material: 'Neon',
    anchored: true,
    parentName: 'Track',
  },
]

const raceScript = `-- Racing server
-- Tracks lap times, checkpoint progression, and a global best-lap leaderboard.

local Players = game:GetService("Players")
local Workspace = game:GetService("Workspace")
local DataStoreService = game:GetService("DataStoreService")

local track = Workspace:WaitForChild("Track")
local checkpoints = { track:WaitForChild("CP1"), track:WaitForChild("CP2"), track:WaitForChild("CP3") }
local finish = track:WaitForChild("FinishLine")

local store = DataStoreService:GetDataStore("BestLaps_v1")
local racers = {}

local function setupStats(player)
    local ls = Instance.new("Folder")
    ls.Name = "leaderstats"
    ls.Parent = player

    local bestLap = Instance.new("NumberValue")
    bestLap.Name = "BestLap"
    bestLap.Value = 0
    bestLap.Parent = ls

    local ok, data = pcall(function() return store:GetAsync("lap_" .. player.UserId) end)
    if ok and typeof(data) == "number" then bestLap.Value = data end

    racers[player.UserId] = { cp = 0, lapStart = nil }
end

Players.PlayerAdded:Connect(setupStats)

Players.PlayerRemoving:Connect(function(player)
    local ls = player:FindFirstChild("leaderstats")
    if ls then
        pcall(function() store:SetAsync("lap_" .. player.UserId, ls.BestLap.Value) end)
    end
    racers[player.UserId] = nil
end)

for i, cp in ipairs(checkpoints) do
    cp.Touched:Connect(function(hit)
        local char = hit:FindFirstAncestorOfClass("Model")
        local player = char and Players:GetPlayerFromCharacter(char)
        if not player then return end
        local r = racers[player.UserId]
        if not r then return end
        if r.cp == i - 1 then r.cp = i end
    end)
end

finish.Touched:Connect(function(hit)
    local char = hit:FindFirstAncestorOfClass("Model")
    local player = char and Players:GetPlayerFromCharacter(char)
    if not player then return end
    local r = racers[player.UserId]
    if not r then return end
    if r.lapStart and r.cp == #checkpoints then
        local lapTime = tick() - r.lapStart
        local ls = player.leaderstats
        if ls.BestLap.Value == 0 or lapTime < ls.BestLap.Value then
            ls.BestLap.Value = math.floor(lapTime * 100) / 100
        end
    end
    r.lapStart = tick()
    r.cp = 0
end)

print("[Racing] server started")
`

const vehicleSpawnerScript = `-- Vehicle spawner — clicking the pad spawns a simple truck model for the player.
local Workspace = game:GetService("Workspace")
local Players = game:GetService("Players")

local track = Workspace:WaitForChild("Track")
local pad = track:WaitForChild("VehicleSpawner")

local cd = Instance.new("ClickDetector")
cd.MaxActivationDistance = 30
cd.Parent = pad

cd.MouseClick:Connect(function(player)
    local old = Workspace:FindFirstChild("Kart_" .. player.UserId)
    if old then old:Destroy() end

    local model = Instance.new("Model")
    model.Name = "Kart_" .. player.UserId

    local seat = Instance.new("VehicleSeat")
    seat.Size = Vector3.new(4, 1, 6)
    seat.Position = pad.Position + Vector3.new(0, 3, 0)
    seat.Color = Color3.fromRGB(255, 80, 80)
    seat.Material = Enum.Material.Metal
    seat.Parent = model

    for i = 1, 4 do
        local wheel = Instance.new("Part")
        wheel.Shape = Enum.PartType.Cylinder
        wheel.Size = Vector3.new(1.6, 2.5, 2.5)
        wheel.Material = Enum.Material.Concrete
        wheel.Color = Color3.fromRGB(20, 20, 20)
        local xs = (i % 2 == 0) and 2 or -2
        local zs = (i < 3) and -2 or 2
        wheel.Position = seat.Position + Vector3.new(xs, -1, zs)
        wheel.Parent = model
        local weld = Instance.new("WeldConstraint")
        weld.Part0 = seat
        weld.Part1 = wheel
        weld.Parent = seat
    end

    seat.Torque = 3
    seat.MaxSpeed = 50
    seat.HeadsUpDisplay = true

    model.Parent = Workspace

    local char = player.Character
    if char and char:FindFirstChild("Humanoid") then
        seat:Sit(char.Humanoid)
    end
end)

print("[Racing] vehicle spawner armed")
`

const lapHUDScript = `-- Racing lap HUD updater
-- Pushes the current lap time and player rank to a simple SurfaceGui every
-- frame so players can see their timer without opening any menu.

local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local Workspace = game:GetService("Workspace")

local track = Workspace:WaitForChild("Track")

local function formatTime(t)
    if not t or t <= 0 then return "--:--.--" end
    local m = math.floor(t / 60)
    local s = t - m * 60
    return string.format("%02d:%05.2f", m, s)
end

local startTimes = {}

local cp1 = track:WaitForChild("CP1")
cp1.Touched:Connect(function(hit)
    local char = hit:FindFirstAncestorOfClass("Model")
    local player = char and Players:GetPlayerFromCharacter(char)
    if player and not startTimes[player.UserId] then
        startTimes[player.UserId] = tick()
    end
end)

Players.PlayerRemoving:Connect(function(p) startTimes[p.UserId] = nil end)

RunService.Heartbeat:Connect(function()
    for _, player in ipairs(Players:GetPlayers()) do
        local start = startTimes[player.UserId]
        if start then
            player:SetAttribute("CurrentLapTime", tick() - start)
        end
    end
end)

print("[Racing] lap HUD updater active")
`

export const racingTemplate: GameTemplate = {
  id: 'racing',
  name: 'Checkpoint Racing',
  description:
    'Loop race track with checkpoints, vehicle spawner, best-lap leaderboard, and finish line.',
  genre: 'racing',
  estimatedBuildTime: '40s',
  thumbnailPrompt:
    'low-poly Roblox race track with black asphalt, green checkpoint beams, a checkered finish line, and a yellow vehicle spawner pad',
  partCount: 10,
  scriptCount: 3,
  structuredCommands: commands,
  serverScripts: [
    { name: 'RaceServer', parent: 'ServerScriptService', source: raceScript },
    { name: 'VehicleSpawner', parent: 'ServerScriptService', source: vehicleSpawnerScript },
    { name: 'LapHUD', parent: 'ServerScriptService', source: lapHUDScript },
  ],
  uiTemplates: ['hud', 'leaderboard', 'notification-toast', 'main-menu'],
  mechanics: ['checkpoints', 'vehicles', 'lap-timer'],
  monetization: {
    devProducts: [
      { id: 'turbo', name: 'Turbo Boost', description: 'One-use nitro', priceRobux: 39 },
    ],
    gamePasses: [
      { id: 'fast_kart', name: 'Fast Kart', description: 'Unlock a 1.5x faster vehicle', priceRobux: 299 },
    ],
  },
}
