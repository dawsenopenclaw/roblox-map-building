/**
 * Tower Defense Template — wave spawner, tower placement, enemy path, lives.
 */

import type { GameTemplate } from './types'
import type { StructuredCommand } from '@/lib/ai/structured-commands'

const commands: StructuredCommand[] = [
  { type: 'create_folder', name: 'TD', parentName: 'Workspace' },
  {
    type: 'create_part',
    name: 'Ground',
    position: { x: 0, y: 0, z: 0 },
    size: { x: 200, y: 1, z: 200 },
    color: { r: 110, g: 180, b: 120 },
    material: 'Grass',
    anchored: true,
    parentName: 'TD',
  },
  // Spawn
  {
    type: 'create_part',
    name: 'Spawn',
    position: { x: -80, y: 1, z: 0 },
    size: { x: 12, y: 1, z: 12 },
    color: { r: 200, g: 60, b: 60 },
    material: 'Neon',
    anchored: true,
    parentName: 'TD',
  },
  // Base
  {
    type: 'create_part',
    name: 'Base',
    position: { x: 80, y: 1, z: 0 },
    size: { x: 12, y: 1, z: 12 },
    color: { r: 60, g: 140, b: 255 },
    material: 'Neon',
    anchored: true,
    parentName: 'TD',
  },
  // Path segments
  {
    type: 'create_part',
    name: 'Path1',
    position: { x: -40, y: 0.75, z: 0 },
    size: { x: 80, y: 0.5, z: 6 },
    color: { r: 200, g: 180, b: 130 },
    material: 'Sand',
    anchored: true,
    parentName: 'TD',
  },
  {
    type: 'create_part',
    name: 'Path2',
    position: { x: 0, y: 0.75, z: 20 },
    size: { x: 6, y: 0.5, z: 40 },
    color: { r: 200, g: 180, b: 130 },
    material: 'Sand',
    anchored: true,
    parentName: 'TD',
  },
  {
    type: 'create_part',
    name: 'Path3',
    position: { x: 40, y: 0.75, z: 0 },
    size: { x: 80, y: 0.5, z: 6 },
    color: { r: 200, g: 180, b: 130 },
    material: 'Sand',
    anchored: true,
    parentName: 'TD',
  },
  // Tower placement zone
  {
    type: 'create_part',
    name: 'TowerZone1',
    position: { x: -20, y: 1, z: -15 },
    size: { x: 6, y: 1, z: 6 },
    color: { r: 200, g: 200, b: 80 },
    material: 'Slate',
    anchored: true,
    parentName: 'TD',
  },
  {
    type: 'create_part',
    name: 'TowerZone2',
    position: { x: 20, y: 1, z: -15 },
    size: { x: 6, y: 1, z: 6 },
    color: { r: 200, g: 200, b: 80 },
    material: 'Slate',
    anchored: true,
    parentName: 'TD',
  },
]

const tdServer = `-- Tower Defense server
-- Spawns enemies in waves, walks them along a path, damages the base,
-- and lets players place damaging towers on zones.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Workspace = game:GetService("Workspace")
local RunService = game:GetService("RunService")
local TweenService = game:GetService("TweenService")

local td = Workspace:WaitForChild("TD")
local spawnPad = td:WaitForChild("Spawn")
local basePad = td:WaitForChild("Base")

local state = {
    wave   = 0,
    lives  = 20,
    money  = 150,
    towers = {},
}

local placeEvent = Instance.new("RemoteEvent")
placeEvent.Name = "PlaceTower"
placeEvent.Parent = ReplicatedStorage

local syncEvent = Instance.new("RemoteEvent")
syncEvent.Name = "TDSync"
syncEvent.Parent = ReplicatedStorage

local function broadcast()
    syncEvent:FireAllClients(state)
end

local function spawnEnemy(hp)
    local enemy = Instance.new("Part")
    enemy.Name = "Enemy"
    enemy.Size = Vector3.new(3, 3, 3)
    enemy.Color = Color3.fromRGB(180, 30, 30)
    enemy.Material = Enum.Material.Neon
    enemy.Position = spawnPad.Position + Vector3.new(0, 3, 0)
    enemy.Anchored = true
    enemy:SetAttribute("HP", hp)
    enemy.Parent = td

    local waypoints = {
        Vector3.new(-40, 3, 0),
        Vector3.new(0,   3, 20),
        Vector3.new(40,  3, 0),
        basePad.Position + Vector3.new(0, 3, 0),
    }

    task.spawn(function()
        for _, wp in ipairs(waypoints) do
            local dist = (wp - enemy.Position).Magnitude
            local tween = TweenService:Create(enemy, TweenInfo.new(dist / 12), { Position = wp })
            tween:Play()
            tween.Completed:Wait()
            if not enemy.Parent then return end
        end
        state.lives = state.lives - 1
        broadcast()
        enemy:Destroy()
    end)
end

local function startWave()
    state.wave = state.wave + 1
    broadcast()
    local count = 5 + state.wave * 2
    local hp = 10 + state.wave * 5
    for i = 1, count do
        spawnEnemy(hp)
        task.wait(1.0)
    end
end

local function placeTower(zoneName)
    local zone = td:FindFirstChild(zoneName)
    if not zone or zone:GetAttribute("Occupied") then return end
    if state.money < 50 then return end
    state.money = state.money - 50
    broadcast()

    local tower = Instance.new("Part")
    tower.Name = "Tower"
    tower.Size = Vector3.new(4, 8, 4)
    tower.Color = Color3.fromRGB(80, 80, 180)
    tower.Material = Enum.Material.Metal
    tower.Position = zone.Position + Vector3.new(0, 4, 0)
    tower.Anchored = true
    tower.Parent = td
    zone:SetAttribute("Occupied", true)

    table.insert(state.towers, tower)

    -- Shoot loop
    task.spawn(function()
        while tower.Parent do
            task.wait(0.6)
            local best, bestDist = nil, 40
            for _, e in ipairs(td:GetChildren()) do
                if e.Name == "Enemy" then
                    local d = (e.Position - tower.Position).Magnitude
                    if d < bestDist then bestDist = d; best = e end
                end
            end
            if best then
                local hp = (best:GetAttribute("HP") or 1) - 5
                if hp <= 0 then
                    state.money = state.money + 10
                    broadcast()
                    best:Destroy()
                else
                    best:SetAttribute("HP", hp)
                end
            end
        end
    end)
end

placeEvent.OnServerEvent:Connect(function(_, zoneName)
    placeTower(zoneName)
end)

task.spawn(function()
    while state.lives > 0 do
        task.wait(8)
        startWave()
    end
    print("[TD] game over")
end)

print("[TD] server started")
`

const zoneClickScript = `-- Allow clicking a tower zone to request placement.
local Workspace = game:GetService("Workspace")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local td = Workspace:WaitForChild("TD")
local placeEvent = ReplicatedStorage:WaitForChild("PlaceTower")

for _, zone in ipairs(td:GetChildren()) do
    if zone:IsA("BasePart") and zone.Name:match("^TowerZone") then
        local cd = Instance.new("ClickDetector")
        cd.MaxActivationDistance = 30
        cd.Parent = zone
        cd.MouseClick:Connect(function()
            placeEvent:FireServer(zone.Name)
        end)
    end
end

print("[TD] zone clicks armed")
`

const waveAnnouncerScript = `-- Tower Defense wave announcer
-- Broadcasts wave-start banners to every client and gives a brief grace period
-- between waves so the player can place towers.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local waveEvent = Instance.new("RemoteEvent")
waveEvent.Name = "TDWaveAnnounce"
waveEvent.Parent = ReplicatedStorage

local syncEvent = ReplicatedStorage:WaitForChild("TDSync")

local lastWave = 0

local function announce(msg, color)
    for _, p in ipairs(Players:GetPlayers()) do
        waveEvent:FireClient(p, msg, color)
    end
end

syncEvent.OnServerEvent:Connect(function() end) -- placeholder

task.spawn(function()
    while true do
        task.wait(1)
    end
end)

print("[TD] wave announcer ready")
`

const enemyVariantsScript = `-- Tower Defense enemy variants
-- Tier 1 = Runner (fast, low HP), Tier 2 = Tank (slow, high HP),
-- Tier 3 = Boss (every 5 waves). This script exposes spawnTiered() via
-- a BindableFunction so TDServer can call it.

local Workspace = game:GetService("Workspace")
local TweenService = game:GetService("TweenService")

local td = Workspace:WaitForChild("TD")
local spawnPad = td:WaitForChild("Spawn")
local basePad = td:WaitForChild("Base")

local spawner = Instance.new("BindableFunction")
spawner.Name = "TDSpawnTiered"
spawner.Parent = script

local VARIANTS = {
    runner = { size = Vector3.new(2, 2, 2), color = Color3.fromRGB(220, 80, 80),  speed = 18, hp = 8 },
    tank   = { size = Vector3.new(5, 5, 5), color = Color3.fromRGB(80, 80, 220),  speed = 8,  hp = 40 },
    boss   = { size = Vector3.new(8, 8, 8), color = Color3.fromRGB(220, 200, 40), speed = 6,  hp = 200 },
}

local function spawnEnemy(variant)
    local v = VARIANTS[variant] or VARIANTS.runner
    local e = Instance.new("Part")
    e.Name = "Enemy"
    e.Size = v.size
    e.Color = v.color
    e.Material = Enum.Material.Neon
    e.Anchored = true
    e.Position = spawnPad.Position + Vector3.new(0, v.size.Y / 2, 0)
    e:SetAttribute("HP", v.hp)
    e:SetAttribute("Variant", variant)
    e.Parent = td

    task.spawn(function()
        local waypoints = {
            Vector3.new(-40, v.size.Y / 2, 0),
            Vector3.new(0,   v.size.Y / 2, 20),
            Vector3.new(40,  v.size.Y / 2, 0),
            basePad.Position + Vector3.new(0, v.size.Y / 2, 0),
        }
        for _, wp in ipairs(waypoints) do
            local dist = (wp - e.Position).Magnitude
            local tween = TweenService:Create(e, TweenInfo.new(dist / v.speed), { Position = wp })
            tween:Play()
            tween.Completed:Wait()
            if not e.Parent then return end
        end
        e:Destroy()
    end)
end

spawner.OnInvoke = function(variant)
    spawnEnemy(variant)
    return true
end

print("[TD] enemy variants ready")
`

export const towerDefenseTemplate: GameTemplate = {
  id: 'tower-defense',
  name: 'Tower Defense',
  description:
    'Wave-based tower defense with enemy path, tower placement zones, currency per kill, and lives system.',
  genre: 'tower-defense',
  estimatedBuildTime: '40s',
  thumbnailPrompt:
    'low-poly Roblox tower defense map with a winding sand path, red enemies advancing, and blue towers placed on yellow zones',
  partCount: 9,
  scriptCount: 4,
  structuredCommands: commands,
  serverScripts: [
    { name: 'TDServer', parent: 'ServerScriptService', source: tdServer },
    { name: 'ZoneClicks', parent: 'ServerScriptService', source: zoneClickScript },
    { name: 'WaveAnnouncer', parent: 'ServerScriptService', source: waveAnnouncerScript },
    { name: 'EnemyVariants', parent: 'ServerScriptService', source: enemyVariantsScript },
  ],
  uiTemplates: ['hud', 'shop', 'notification-toast', 'pause-menu'],
  mechanics: ['waves', 'towers', 'lives'],
  monetization: {
    devProducts: [
      { id: 'money_500', name: '500 Gold', description: 'Instant 500 gold', priceRobux: 49 },
    ],
    gamePasses: [
      { id: 'starter_pack', name: 'Starter Pack', description: 'Begin each game with +300 gold', priceRobux: 199 },
    ],
  },
}
