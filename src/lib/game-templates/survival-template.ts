/**
 * Survival Template — open map with hunger/thirst, day-night, monster spawner.
 */

import type { GameTemplate } from './types'
import type { StructuredCommand } from '@/lib/ai/structured-commands'

const commands: StructuredCommand[] = [
  { type: 'create_folder', name: 'Survival', parentName: 'Workspace' },
  {
    type: 'create_part',
    name: 'Ground',
    position: { x: 0, y: 0, z: 0 },
    size: { x: 500, y: 2, z: 500 },
    color: { r: 90, g: 150, b: 80 },
    material: 'Grass',
    anchored: true,
    parentName: 'Survival',
  },
  // Watering hole
  {
    type: 'create_part',
    name: 'Water',
    position: { x: 100, y: 0.5, z: 0 },
    size: { x: 60, y: 1, z: 60 },
    color: { r: 40, g: 120, b: 220 },
    material: 'Water',
    anchored: true,
    parentName: 'Survival',
  },
  // Berry bush
  {
    type: 'create_part',
    name: 'BerryBush',
    position: { x: -60, y: 2, z: 30 },
    size: { x: 6, y: 4, z: 6 },
    color: { r: 180, g: 40, b: 60 },
    material: 'Grass',
    anchored: true,
    parentName: 'Survival',
  },
  // Campfire
  {
    type: 'create_part',
    name: 'Campfire',
    position: { x: 0, y: 1.5, z: 0 },
    size: { x: 5, y: 2, z: 5 },
    color: { r: 255, g: 120, b: 40 },
    material: 'Neon',
    anchored: true,
    parentName: 'Survival',
  },
  // Monster spawn
  {
    type: 'create_part',
    name: 'MonsterSpawn',
    position: { x: -150, y: 1.5, z: -150 },
    size: { x: 10, y: 1, z: 10 },
    color: { r: 60, g: 20, b: 20 },
    material: 'Slate',
    anchored: true,
    parentName: 'Survival',
  },
  // Shelter walls
  {
    type: 'create_part',
    name: 'ShelterWall1',
    position: { x: 30, y: 4, z: 30 },
    size: { x: 12, y: 8, z: 1 },
    color: { r: 140, g: 90, b: 50 },
    material: 'Wood',
    anchored: true,
    parentName: 'Survival',
  },
  {
    type: 'create_part',
    name: 'ShelterWall2',
    position: { x: 36, y: 4, z: 36 },
    size: { x: 1, y: 8, z: 12 },
    color: { r: 140, g: 90, b: 50 },
    material: 'Wood',
    anchored: true,
    parentName: 'Survival',
  },
]

const survivalScript = `-- Survival stats manager
-- Each player has a Hunger and Thirst stat that drains over time.
-- Drinking water or eating berries restores them. Reaching 0 deals damage.

local Players = game:GetService("Players")
local Workspace = game:GetService("Workspace")
local RunService = game:GetService("RunService")

local survival = Workspace:WaitForChild("Survival")
local water = survival:WaitForChild("Water")
local bush = survival:WaitForChild("BerryBush")

local DRAIN_INTERVAL = 6  -- seconds per -1

local stats = {}

local function attachStats(player)
    local ls = Instance.new("Folder")
    ls.Name = "leaderstats"
    ls.Parent = player

    local hunger = Instance.new("IntValue")
    hunger.Name = "Hunger"
    hunger.Value = 100
    hunger.Parent = ls

    local thirst = Instance.new("IntValue")
    thirst.Name = "Thirst"
    thirst.Value = 100
    thirst.Parent = ls

    stats[player.UserId] = { hunger = hunger, thirst = thirst, last = tick() }
end

Players.PlayerAdded:Connect(attachStats)
Players.PlayerRemoving:Connect(function(p) stats[p.UserId] = nil end)

RunService.Heartbeat:Connect(function()
    for _, player in ipairs(Players:GetPlayers()) do
        local entry = stats[player.UserId]
        if entry and tick() - entry.last > DRAIN_INTERVAL then
            entry.last = tick()
            entry.hunger.Value = math.max(0, entry.hunger.Value - 1)
            entry.thirst.Value = math.max(0, entry.thirst.Value - 1)
            if entry.hunger.Value == 0 or entry.thirst.Value == 0 then
                local char = player.Character
                local hum = char and char:FindFirstChildOfClass("Humanoid")
                if hum then hum:TakeDamage(2) end
            end
        end
    end
end)

water.Touched:Connect(function(hit)
    local char = hit:FindFirstAncestorOfClass("Model")
    local player = char and Players:GetPlayerFromCharacter(char)
    if player and stats[player.UserId] then
        stats[player.UserId].thirst.Value = 100
    end
end)

bush.Touched:Connect(function(hit)
    local char = hit:FindFirstAncestorOfClass("Model")
    local player = char and Players:GetPlayerFromCharacter(char)
    if player and stats[player.UserId] then
        stats[player.UserId].hunger.Value = math.min(100, stats[player.UserId].hunger.Value + 25)
        bush.Transparency = 1
        task.delay(10, function() bush.Transparency = 0 end)
    end
end)

print("[Survival] stats manager online")
`

const dayNightScript = `-- Day/night cycle
local Lighting = game:GetService("Lighting")
local RunService = game:GetService("RunService")

local DAY_LENGTH_SECONDS = 240
local HOURS_PER_SECOND = 24 / DAY_LENGTH_SECONDS

RunService.Heartbeat:Connect(function(dt)
    Lighting.ClockTime = (Lighting.ClockTime + dt * HOURS_PER_SECOND) % 24
end)

print("[Survival] day/night cycle running")
`

const monsterScript = `-- Monster spawner
-- Spawns hostile NPCs that wander toward the nearest player at night.

local Players = game:GetService("Players")
local Workspace = game:GetService("Workspace")
local Lighting = game:GetService("Lighting")

local survival = Workspace:WaitForChild("Survival")
local spawnPad = survival:WaitForChild("MonsterSpawn")

local MAX_MONSTERS = 6
local monsters = {}

local function spawnMonster()
    if #monsters >= MAX_MONSTERS then return end

    local model = Instance.new("Model")
    model.Name = "Monster"

    local hrp = Instance.new("Part")
    hrp.Name = "HumanoidRootPart"
    hrp.Size = Vector3.new(4, 6, 2)
    hrp.Color = Color3.fromRGB(80, 20, 100)
    hrp.Material = Enum.Material.SmoothPlastic
    hrp.Position = spawnPad.Position + Vector3.new(0, 6, 0)
    hrp.Parent = model

    local hum = Instance.new("Humanoid")
    hum.WalkSpeed = 10
    hum.MaxHealth = 60
    hum.Health = 60
    hum.Parent = model

    model.PrimaryPart = hrp
    model.Parent = Workspace
    table.insert(monsters, model)

    task.spawn(function()
        while model.Parent and hum.Health > 0 do
            task.wait(1)
            local best, bestDist = nil, 80
            for _, p in ipairs(Players:GetPlayers()) do
                if p.Character and p.Character.PrimaryPart then
                    local d = (p.Character.PrimaryPart.Position - hrp.Position).Magnitude
                    if d < bestDist then bestDist = d; best = p end
                end
            end
            if best and best.Character then
                hum:MoveTo(best.Character.PrimaryPart.Position)
            end
        end
        model:Destroy()
        for i, m in ipairs(monsters) do if m == model then table.remove(monsters, i); break end end
    end)
end

task.spawn(function()
    while true do
        task.wait(8)
        local hour = Lighting.ClockTime
        if hour < 6 or hour > 20 then spawnMonster() end
    end
end)

print("[Survival] monster spawner active")
`

export const survivalTemplate: GameTemplate = {
  id: 'survival',
  name: 'Open-World Survival',
  description:
    'Hunger, thirst, day/night cycle, shelter, water pond, berry bush, and night-spawning monsters.',
  genre: 'survival',
  estimatedBuildTime: '45s',
  thumbnailPrompt:
    'low-poly Roblox survival scene with a grassy plain, a small blue water pond, a red berry bush, and a wooden shelter at dusk',
  partCount: 8,
  scriptCount: 3,
  structuredCommands: commands,
  serverScripts: [
    { name: 'SurvivalStats', parent: 'ServerScriptService', source: survivalScript },
    { name: 'DayNight', parent: 'ServerScriptService', source: dayNightScript },
    { name: 'MonsterSpawner', parent: 'ServerScriptService', source: monsterScript },
  ],
  uiTemplates: ['hud', 'inventory', 'notification-toast', 'quest-tracker'],
  mechanics: ['hunger', 'thirst', 'day-night', 'monsters'],
  monetization: {
    devProducts: [
      { id: 'food_pack', name: 'Food Pack', description: 'Instant +100 hunger', priceRobux: 29 },
    ],
    gamePasses: [
      { id: 'infinite_water', name: 'Infinite Water', description: 'Thirst never drains', priceRobux: 199 },
    ],
  },
}
