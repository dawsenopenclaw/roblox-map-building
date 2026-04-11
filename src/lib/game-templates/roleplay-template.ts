/**
 * Roleplay Template — village with NPCs, jobs, money, housing.
 */

import type { GameTemplate } from './types'
import type { StructuredCommand } from '@/lib/ai/structured-commands'

const commands: StructuredCommand[] = [
  { type: 'create_folder', name: 'Village', parentName: 'Workspace' },
  {
    type: 'create_part',
    name: 'VillageGround',
    position: { x: 0, y: 0, z: 0 },
    size: { x: 300, y: 1, z: 300 },
    color: { r: 100, g: 160, b: 90 },
    material: 'Grass',
    anchored: true,
    parentName: 'Village',
  },
  // Town square
  {
    type: 'create_part',
    name: 'Square',
    position: { x: 0, y: 0.6, z: 0 },
    size: { x: 60, y: 0.3, z: 60 },
    color: { r: 140, g: 120, b: 100 },
    material: 'Cobblestone',
    anchored: true,
    parentName: 'Village',
  },
  {
    type: 'create_part',
    name: 'Fountain',
    position: { x: 0, y: 2, z: 0 },
    size: { x: 10, y: 3, z: 10 },
    color: { r: 120, g: 120, b: 140 },
    material: 'Marble',
    anchored: true,
    parentName: 'Village',
  },
  // Houses
  {
    type: 'create_part',
    name: 'House1',
    position: { x: -50, y: 6, z: 40 },
    size: { x: 24, y: 12, z: 24 },
    color: { r: 200, g: 180, b: 150 },
    material: 'Plastic',
    anchored: true,
    parentName: 'Village',
  },
  {
    type: 'create_part',
    name: 'House2',
    position: { x: 50, y: 6, z: 40 },
    size: { x: 24, y: 12, z: 24 },
    color: { r: 180, g: 150, b: 120 },
    material: 'Plastic',
    anchored: true,
    parentName: 'Village',
  },
  {
    type: 'create_part',
    name: 'House3',
    position: { x: -50, y: 6, z: -40 },
    size: { x: 24, y: 12, z: 24 },
    color: { r: 220, g: 200, b: 170 },
    material: 'Plastic',
    anchored: true,
    parentName: 'Village',
  },
  // Job NPCs (farmer, miner, merchant)
  {
    type: 'create_part',
    name: 'Farmer',
    position: { x: -80, y: 4, z: 0 },
    size: { x: 4, y: 8, z: 2 },
    color: { r: 120, g: 180, b: 60 },
    material: 'SmoothPlastic',
    anchored: true,
    parentName: 'Village',
  },
  {
    type: 'create_part',
    name: 'Miner',
    position: { x: 80, y: 4, z: 0 },
    size: { x: 4, y: 8, z: 2 },
    color: { r: 100, g: 100, b: 120 },
    material: 'SmoothPlastic',
    anchored: true,
    parentName: 'Village',
  },
  {
    type: 'create_part',
    name: 'Merchant',
    position: { x: 0, y: 4, z: 80 },
    size: { x: 4, y: 8, z: 2 },
    color: { r: 200, g: 160, b: 60 },
    material: 'SmoothPlastic',
    anchored: true,
    parentName: 'Village',
  },
  // Housing claim pad
  {
    type: 'create_part',
    name: 'HouseClaim1',
    position: { x: -50, y: 1, z: 28 },
    size: { x: 6, y: 1, z: 6 },
    color: { r: 120, g: 220, b: 140 },
    material: 'Neon',
    anchored: true,
    parentName: 'Village',
  },
]

const jobScript = `-- Roleplay job system
-- Walking up to a job NPC assigns a role. Each role earns a passive salary.

local Players = game:GetService("Players")
local Workspace = game:GetService("Workspace")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local village = Workspace:WaitForChild("Village")

local JOBS = {
    Farmer = { wage = 8 },
    Miner  = { wage = 12 },
    Merchant = { wage = 10 },
}

local function setupStats(player)
    local ls = Instance.new("Folder")
    ls.Name = "leaderstats"
    ls.Parent = player

    local money = Instance.new("IntValue")
    money.Name = "Money"
    money.Value = 50
    money.Parent = ls

    local job = Instance.new("StringValue")
    job.Name = "Job"
    job.Value = "Unemployed"
    job.Parent = ls
end

Players.PlayerAdded:Connect(setupStats)

for jobName in pairs(JOBS) do
    local npc = village:FindFirstChild(jobName)
    if npc then
        npc.Touched:Connect(function(hit)
            local char = hit:FindFirstAncestorOfClass("Model")
            local player = char and Players:GetPlayerFromCharacter(char)
            if player and player.leaderstats then
                player.leaderstats.Job.Value = jobName
            end
        end)
    end
end

-- Passive wage loop
task.spawn(function()
    while true do
        task.wait(10)
        for _, player in ipairs(Players:GetPlayers()) do
            local ls = player:FindFirstChild("leaderstats")
            if ls then
                local job = JOBS[ls.Job.Value]
                if job then
                    ls.Money.Value = ls.Money.Value + job.wage
                end
            end
        end
    end
end)

print("[Roleplay] jobs ready")
`

const housingScript = `-- Housing claim system
-- Touch a HouseClaim pad and you own that house until you leave.

local Players = game:GetService("Players")
local Workspace = game:GetService("Workspace")

local village = Workspace:WaitForChild("Village")

local owned = {}

local function claim(padName, player)
    if owned[padName] then return end
    owned[padName] = player
    player:SetAttribute("House", padName)
    local pad = village:FindFirstChild(padName)
    if pad then pad.Color = Color3.fromRGB(255, 200, 0) end
end

Players.PlayerRemoving:Connect(function(player)
    local house = player:GetAttribute("House")
    if house then
        owned[house] = nil
        local pad = village:FindFirstChild(house)
        if pad then pad.Color = Color3.fromRGB(120, 220, 140) end
    end
end)

for _, pad in ipairs(village:GetChildren()) do
    if pad.Name:match("^HouseClaim") then
        pad.Touched:Connect(function(hit)
            local char = hit:FindFirstAncestorOfClass("Model")
            local player = char and Players:GetPlayerFromCharacter(char)
            if player then claim(pad.Name, player) end
        end)
    end
end

print("[Roleplay] housing system ready")
`

const chatScript = `-- Simple proximity chat announcement over NPCs when clicked.
local Players = game:GetService("Players")
local Workspace = game:GetService("Workspace")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local village = Workspace:WaitForChild("Village")

local showDialogue = ReplicatedStorage:FindFirstChild("ShowDialogue")
if not showDialogue then
    showDialogue = Instance.new("RemoteEvent")
    showDialogue.Name = "ShowDialogue"
    showDialogue.Parent = ReplicatedStorage
end

local DIALOGUES = {
    Farmer   = "Ahh, the soil's good today. Fancy earning a wage?",
    Miner    = "Best pickaxe in the land, mate. Join my crew!",
    Merchant = "Coins always welcome. Spend wisely, traveler.",
}

for name, text in pairs(DIALOGUES) do
    local npc = village:FindFirstChild(name)
    if npc then
        local cd = Instance.new("ClickDetector")
        cd.MaxActivationDistance = 20
        cd.Parent = npc
        cd.MouseClick:Connect(function(player)
            showDialogue:FireClient(player, {
                speaker = name,
                text = text,
                choices = { "Accept job", "Goodbye" },
            })
        end)
    end
end

print("[Roleplay] chat system ready")
`

export const roleplayTemplate: GameTemplate = {
  id: 'roleplay',
  name: 'Village Roleplay',
  description:
    'Town square with fountain, three houses, job NPCs (Farmer/Miner/Merchant), housing claims, and dialogue.',
  genre: 'roleplay',
  estimatedBuildTime: '40s',
  thumbnailPrompt:
    'cozy low-poly Roblox village square at dusk with a central stone fountain, three wood-and-plaster houses, and NPC characters standing near their workplaces',
  partCount: 11,
  scriptCount: 3,
  structuredCommands: commands,
  serverScripts: [
    { name: 'Jobs', parent: 'ServerScriptService', source: jobScript },
    { name: 'Housing', parent: 'ServerScriptService', source: housingScript },
    { name: 'NPCChat', parent: 'ServerScriptService', source: chatScript },
  ],
  uiTemplates: ['hud', 'dialogue', 'inventory', 'shop', 'quest-tracker', 'notification-toast'],
  mechanics: ['jobs', 'housing', 'dialogue'],
  monetization: {
    devProducts: [
      { id: 'starter_cash', name: '500 Starter Money', description: '500 bonus money', priceRobux: 49 },
    ],
    gamePasses: [
      { id: 'landlord', name: 'Landlord', description: 'Own up to 3 houses at once', priceRobux: 299 },
    ],
  },
}
