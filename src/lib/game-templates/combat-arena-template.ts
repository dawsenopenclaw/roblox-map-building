/**
 * Combat Arena Template — PvP arena with spawn zones, weapons, kill counter.
 */

import type { GameTemplate } from './types'
import type { StructuredCommand } from '@/lib/ai/structured-commands'

const commands: StructuredCommand[] = [
  { type: 'create_folder', name: 'Arena', parentName: 'Workspace' },
  {
    type: 'create_part',
    name: 'Floor',
    position: { x: 0, y: 0, z: 0 },
    size: { x: 220, y: 2, z: 220 },
    color: { r: 80, g: 80, b: 90 },
    material: 'Concrete',
    anchored: true,
    parentName: 'Arena',
  },
  // Walls
  {
    type: 'create_part',
    name: 'WallN',
    position: { x: 0, y: 8, z: 110 },
    size: { x: 220, y: 16, z: 2 },
    color: { r: 120, g: 120, b: 130 },
    material: 'Brick',
    anchored: true,
    parentName: 'Arena',
  },
  {
    type: 'create_part',
    name: 'WallS',
    position: { x: 0, y: 8, z: -110 },
    size: { x: 220, y: 16, z: 2 },
    color: { r: 120, g: 120, b: 130 },
    material: 'Brick',
    anchored: true,
    parentName: 'Arena',
  },
  {
    type: 'create_part',
    name: 'WallE',
    position: { x: 110, y: 8, z: 0 },
    size: { x: 2, y: 16, z: 220 },
    color: { r: 120, g: 120, b: 130 },
    material: 'Brick',
    anchored: true,
    parentName: 'Arena',
  },
  {
    type: 'create_part',
    name: 'WallW',
    position: { x: -110, y: 8, z: 0 },
    size: { x: 2, y: 16, z: 220 },
    color: { r: 120, g: 120, b: 130 },
    material: 'Brick',
    anchored: true,
    parentName: 'Arena',
  },
  // Red spawn
  {
    type: 'create_part',
    name: 'RedSpawn',
    position: { x: -80, y: 1.5, z: 0 },
    size: { x: 18, y: 1, z: 18 },
    color: { r: 220, g: 60, b: 60 },
    material: 'Neon',
    anchored: true,
    parentName: 'Arena',
  },
  // Blue spawn
  {
    type: 'create_part',
    name: 'BlueSpawn',
    position: { x: 80, y: 1.5, z: 0 },
    size: { x: 18, y: 1, z: 18 },
    color: { r: 60, g: 120, b: 255 },
    material: 'Neon',
    anchored: true,
    parentName: 'Arena',
  },
  // Center pickup
  {
    type: 'create_part',
    name: 'WeaponPickup',
    position: { x: 0, y: 4, z: 0 },
    size: { x: 3, y: 3, z: 3 },
    color: { r: 255, g: 220, b: 60 },
    material: 'Neon',
    anchored: true,
    parentName: 'Arena',
  },
  // Cover blocks
  {
    type: 'create_part',
    name: 'Cover1',
    position: { x: -30, y: 3, z: 20 },
    size: { x: 8, y: 6, z: 3 },
    color: { r: 90, g: 90, b: 95 },
    material: 'Metal',
    anchored: true,
    parentName: 'Arena',
  },
  {
    type: 'create_part',
    name: 'Cover2',
    position: { x: 30, y: 3, z: -20 },
    size: { x: 8, y: 6, z: 3 },
    color: { r: 90, g: 90, b: 95 },
    material: 'Metal',
    anchored: true,
    parentName: 'Arena',
  },
]

const combatScript = `-- Arena combat manager
-- Tracks kills, respawns players to their team spawn, awards streak bonuses.

local Players = game:GetService("Players")
local Workspace = game:GetService("Workspace")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local arena = Workspace:WaitForChild("Arena")
local redSpawn = arena:WaitForChild("RedSpawn")
local blueSpawn = arena:WaitForChild("BlueSpawn")

local killEvent = Instance.new("RemoteEvent")
killEvent.Name = "ArenaKill"
killEvent.Parent = ReplicatedStorage

local function setupStats(player)
    local ls = Instance.new("Folder")
    ls.Name = "leaderstats"
    ls.Parent = player

    local kills = Instance.new("IntValue")
    kills.Name = "Kills"
    kills.Parent = ls

    local deaths = Instance.new("IntValue")
    deaths.Name = "Deaths"
    deaths.Parent = ls

    local streak = Instance.new("IntValue")
    streak.Name = "Streak"
    streak.Parent = ls

    -- Random team assignment
    local teams = { "Red", "Blue" }
    player:SetAttribute("Team", teams[math.random(1, 2)])
end

local function teleportToSpawn(player)
    local char = player.Character
    if not char or not char.PrimaryPart then return end
    local team = player:GetAttribute("Team") or "Red"
    local pad = team == "Red" and redSpawn or blueSpawn
    local offset = Vector3.new(math.random(-6, 6), 5, math.random(-6, 6))
    char:PivotTo(CFrame.new(pad.Position + offset))
end

Players.PlayerAdded:Connect(function(player)
    setupStats(player)
    player.CharacterAdded:Connect(function(char)
        task.wait(0.2)
        teleportToSpawn(player)
        local hum = char:WaitForChild("Humanoid")
        hum.Died:Connect(function()
            player.leaderstats.Deaths.Value = player.leaderstats.Deaths.Value + 1
            player.leaderstats.Streak.Value = 0

            -- Credit the killer
            local creatorTag = hum:FindFirstChild("creator")
            if creatorTag and creatorTag.Value then
                local killer = creatorTag.Value
                if killer:IsA("Player") and killer ~= player then
                    killer.leaderstats.Kills.Value = killer.leaderstats.Kills.Value + 1
                    killer.leaderstats.Streak.Value = killer.leaderstats.Streak.Value + 1
                    killEvent:FireAllClients(killer.Name, player.Name, killer.leaderstats.Streak.Value)
                end
            end
        end)
    end)
end)

print("[Arena] combat manager online")
`

const weaponPickupScript = `-- Arena weapon pickup — gives the toucher a simple sword that respawns.
local Players = game:GetService("Players")
local Workspace = game:GetService("Workspace")
local ServerStorage = game:GetService("ServerStorage")

local arena = Workspace:WaitForChild("Arena")
local pickup = arena:WaitForChild("WeaponPickup")

local function giveSword(player)
    local backpack = player:FindFirstChildOfClass("Backpack")
    if not backpack then return end
    if backpack:FindFirstChild("ArenaSword") then return end

    local tool = Instance.new("Tool")
    tool.Name = "ArenaSword"
    tool.RequiresHandle = true
    tool.CanBeDropped = false

    local handle = Instance.new("Part")
    handle.Name = "Handle"
    handle.Size = Vector3.new(0.5, 5, 0.5)
    handle.Color = Color3.fromRGB(220, 220, 240)
    handle.Material = Enum.Material.Metal
    handle.Parent = tool

    local damage = 25

    tool.Activated:Connect(function()
        local char = tool.Parent
        if not char then return end
        for _, p in ipairs(Players:GetPlayers()) do
            if p.Character and p.Character ~= char and p.Character:FindFirstChild("Humanoid") then
                local dist = (p.Character.PrimaryPart.Position - char.PrimaryPart.Position).Magnitude
                if dist < 8 then
                    local hum = p.Character.Humanoid
                    local tag = Instance.new("ObjectValue")
                    tag.Name = "creator"
                    tag.Value = player
                    tag.Parent = hum
                    game.Debris:AddItem(tag, 3)
                    hum:TakeDamage(damage)
                end
            end
        end
    end)

    tool.Parent = backpack
end

pickup.Touched:Connect(function(hit)
    local char = hit:FindFirstAncestorOfClass("Model")
    local player = char and Players:GetPlayerFromCharacter(char)
    if player then
        giveSword(player)
        pickup.Transparency = 1
        pickup.CanCollide = false
        task.delay(6, function()
            pickup.Transparency = 0
            pickup.CanCollide = true
        end)
    end
end)

print("[Arena] weapon pickup armed")
`

const roundManagerScript = `-- Arena round manager
-- Runs a 120-second round. At the end the winning team (highest total kills)
-- is announced and everyone is teleported back to their spawn for round 2.

local Players = game:GetService("Players")
local Workspace = game:GetService("Workspace")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local ROUND_LENGTH = 120
local INTERMISSION = 10

local roundEvent = Instance.new("RemoteEvent")
roundEvent.Name = "ArenaRound"
roundEvent.Parent = ReplicatedStorage

local function teamKills(team)
    local total = 0
    for _, p in ipairs(Players:GetPlayers()) do
        if p:GetAttribute("Team") == team then
            local ls = p:FindFirstChild("leaderstats")
            if ls and ls:FindFirstChild("Kills") then
                total = total + ls.Kills.Value
            end
        end
    end
    return total
end

local function resetAllPlayers()
    for _, p in ipairs(Players:GetPlayers()) do
        local ls = p:FindFirstChild("leaderstats")
        if ls then
            ls.Kills.Value = 0
            ls.Streak.Value = 0
        end
        if p.Character then
            p.Character:BreakJoints()
        end
    end
end

task.spawn(function()
    while true do
        roundEvent:FireAllClients({ phase = "round", length = ROUND_LENGTH })
        task.wait(ROUND_LENGTH)

        local red = teamKills("Red")
        local blue = teamKills("Blue")
        local winner = red == blue and "Draw"
            or (red > blue and "Red" or "Blue")

        roundEvent:FireAllClients({ phase = "end", winner = winner, red = red, blue = blue })
        task.wait(INTERMISSION)

        resetAllPlayers()
    end
end)

print("[Arena] round manager started")
`

export const combatArenaTemplate: GameTemplate = {
  id: 'combat-arena',
  name: 'Combat Arena',
  description:
    'PvP arena with team spawns, walls, cover blocks, respawning weapon pickups, kill streak tracker.',
  genre: 'combat-arena',
  estimatedBuildTime: '35s',
  thumbnailPrompt:
    'low-poly Roblox arena with red and blue spawn platforms, grey cover blocks, walled boundaries, and a glowing weapon pickup in the center',
  partCount: 11,
  scriptCount: 3,
  structuredCommands: commands,
  serverScripts: [
    { name: 'ArenaCombat', parent: 'ServerScriptService', source: combatScript },
    { name: 'WeaponPickup', parent: 'ServerScriptService', source: weaponPickupScript },
    { name: 'RoundManager', parent: 'ServerScriptService', source: roundManagerScript },
  ],
  uiTemplates: ['hud', 'leaderboard', 'notification-toast', 'pause-menu'],
  mechanics: ['pvp', 'weapons', 'killstreaks'],
  monetization: {
    devProducts: [
      { id: 'revive', name: 'Revive', description: 'Respawn instantly', priceRobux: 29 },
    ],
    gamePasses: [
      { id: 'gold_sword', name: 'Golden Sword', description: 'Unlocks a +50% damage golden sword', priceRobux: 299 },
    ],
  },
}
