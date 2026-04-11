/**
 * Obby Template — 10-stage parkour course with checkpoints and leaderboard.
 */

import type { GameTemplate } from './types'
import type { StructuredCommand } from '@/lib/ai/structured-commands'

const STAGE_COUNT = 10
const STAGE_SPACING = 40

function buildStageCommands(): StructuredCommand[] {
  const cmds: StructuredCommand[] = [
    { type: 'create_folder', name: 'Obby', parentName: 'Workspace' },
    { type: 'create_folder', name: 'Checkpoints', parentName: 'Obby' },
    { type: 'create_folder', name: 'Stages', parentName: 'Obby' },
  ]

  for (let i = 1; i <= STAGE_COUNT; i++) {
    const z = (i - 1) * STAGE_SPACING
    // Checkpoint pad
    cmds.push({
      type: 'create_part',
      name: `Checkpoint_${i}`,
      position: { x: 0, y: 5, z },
      size: { x: 12, y: 1, z: 12 },
      color: i === 1 ? { r: 80, g: 200, b: 120 } : { r: 100, g: 180, b: 255 },
      material: 'Neon',
      anchored: true,
      parentName: 'Checkpoints',
    })
    // Stage obstacle — varies by index
    if (i % 3 === 0) {
      // lava crossing
      cmds.push({
        type: 'create_part',
        name: `Lava_${i}`,
        position: { x: 0, y: 5, z: z + 15 },
        size: { x: 14, y: 1, z: 14 },
        color: { r: 220, g: 60, b: 20 },
        material: 'Neon',
        anchored: true,
        parentName: 'Stages',
      })
      cmds.push({
        type: 'create_part',
        name: `Bridge_${i}`,
        position: { x: 0, y: 6, z: z + 15 },
        size: { x: 3, y: 0.5, z: 14 },
        color: { r: 120, g: 80, b: 50 },
        material: 'Wood',
        anchored: true,
        parentName: 'Stages',
      })
    } else if (i % 2 === 0) {
      // floating block hops
      for (let j = 0; j < 3; j++) {
        cmds.push({
          type: 'create_part',
          name: `Hop_${i}_${j}`,
          position: { x: j % 2 === 0 ? -4 : 4, y: 5, z: z + 10 + j * 6 },
          size: { x: 4, y: 1, z: 4 },
          color: { r: 255, g: 200, b: 0 },
          material: 'Neon',
          anchored: true,
          parentName: 'Stages',
        })
      }
    } else {
      // narrow beam
      cmds.push({
        type: 'create_part',
        name: `Beam_${i}`,
        position: { x: 0, y: 5, z: z + 15 },
        size: { x: 2, y: 1, z: 20 },
        color: { r: 180, g: 180, b: 200 },
        material: 'Metal',
        anchored: true,
        parentName: 'Stages',
      })
    }
  }

  // Finish / win zone
  cmds.push({
    type: 'create_part',
    name: 'WinZone',
    position: { x: 0, y: 5, z: STAGE_COUNT * STAGE_SPACING + 20 },
    size: { x: 30, y: 1, z: 30 },
    color: { r: 255, g: 215, b: 0 },
    material: 'Neon',
    anchored: true,
    parentName: 'Obby',
  })

  return cmds
}

const checkpointScript = `-- Obby checkpoint system
-- Remembers the furthest stage each player has touched and respawns
-- them there on death.

local Players = game:GetService("Players")
local Workspace = game:GetService("Workspace")
local DataStoreService = game:GetService("DataStoreService")

local store = DataStoreService:GetDataStore("ObbyProgress_v1")
local obby = Workspace:WaitForChild("Obby")
local checkpoints = obby:WaitForChild("Checkpoints")

local function setupStats(player)
    local ls = Instance.new("Folder")
    ls.Name = "leaderstats"
    ls.Parent = player

    local stage = Instance.new("IntValue")
    stage.Name = "Stage"
    stage.Value = 1
    stage.Parent = ls

    local ok, data = pcall(function() return store:GetAsync("p_" .. player.UserId) end)
    if ok and type(data) == "number" then stage.Value = data end
end

local function teleportTo(player, stageNum)
    local char = player.Character
    if not char or not char.PrimaryPart then return end
    local cp = checkpoints:FindFirstChild("Checkpoint_" .. stageNum)
    if cp then
        char:PivotTo(cp.CFrame + Vector3.new(0, 4, 0))
    end
end

Players.PlayerAdded:Connect(function(player)
    setupStats(player)
    player.CharacterAdded:Connect(function(char)
        task.wait(0.2)
        teleportTo(player, player.leaderstats.Stage.Value)
    end)
end)

Players.PlayerRemoving:Connect(function(player)
    local ls = player:FindFirstChild("leaderstats")
    if ls then
        pcall(function() store:SetAsync("p_" .. player.UserId, ls.Stage.Value) end)
    end
end)

for _, cp in ipairs(checkpoints:GetChildren()) do
    local num = tonumber(string.match(cp.Name, "%d+"))
    if num then
        cp.Touched:Connect(function(hit)
            local char = hit:FindFirstAncestorOfClass("Model")
            local player = char and Players:GetPlayerFromCharacter(char)
            if player and player.leaderstats.Stage.Value < num then
                player.leaderstats.Stage.Value = num
            end
        end)
    end
end

print("[Obby] checkpoints ready")
`

const lavaScript = `-- Obby lava / kill brick handler
local Workspace = game:GetService("Workspace")
local Players = game:GetService("Players")

local obby = Workspace:WaitForChild("Obby")
local stages = obby:WaitForChild("Stages")

for _, part in ipairs(stages:GetDescendants()) do
    if part:IsA("BasePart") and part.Name:match("^Lava_") then
        part.Touched:Connect(function(hit)
            local hum = hit.Parent and hit.Parent:FindFirstChildOfClass("Humanoid")
            if hum then hum.Health = 0 end
        end)
    end
end

print("[Obby] lava bricks armed")
`

const winZoneScript = `-- Obby win zone — awards a badge (stub) and announces finish.
local Workspace = game:GetService("Workspace")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local obby = Workspace:WaitForChild("Obby")
local winZone = obby:WaitForChild("WinZone")

local winEvent = Instance.new("RemoteEvent")
winEvent.Name = "ObbyWin"
winEvent.Parent = ReplicatedStorage

local cooldown = {}
winZone.Touched:Connect(function(hit)
    local char = hit:FindFirstAncestorOfClass("Model")
    local player = char and Players:GetPlayerFromCharacter(char)
    if not player then return end
    if cooldown[player.UserId] then return end
    cooldown[player.UserId] = true
    winEvent:FireClient(player)
    for _, p in ipairs(Players:GetPlayers()) do
        p:SetAttribute("LastWinner", player.Name)
    end
    task.delay(10, function() cooldown[player.UserId] = nil end)
end)

print("[Obby] win zone armed")
`

const leaderboardScript = `-- Obby global top-10 leaderboard
-- Maintains a sorted-set of best stage reached per player in an OrderedDataStore
-- and renders the top 10 onto a SurfaceGui in the lobby.

local Players = game:GetService("Players")
local DataStoreService = game:GetService("DataStoreService")
local Workspace = game:GetService("Workspace")

local ordered = DataStoreService:GetOrderedDataStore("ObbyTop_v1")

local function updateScore(player)
    local ls = player:FindFirstChild("leaderstats")
    if not ls or not ls:FindFirstChild("Stage") then return end
    pcall(function()
        ordered:SetAsync(tostring(player.UserId), ls.Stage.Value)
    end)
end

local function fetchTop10()
    local list = {}
    local ok, page = pcall(function()
        return ordered:GetSortedAsync(false, 10)
    end)
    if not ok or not page then return list end
    local current = page:GetCurrentPage()
    for _, entry in ipairs(current) do
        local userId = tonumber(entry.key)
        local name = "Unknown"
        if userId then
            local ok2, n = pcall(function() return Players:GetNameFromUserIdAsync(userId) end)
            if ok2 then name = n end
        end
        table.insert(list, { name = name, score = entry.value })
    end
    return list
end

-- Optional: paint the top-10 onto any Part tagged "TopBoard"
local function renderBoard(data)
    local board = Workspace:FindFirstChild("TopBoard", true)
    if not board then return end
    local sg = board:FindFirstChildOfClass("SurfaceGui")
    if not sg then
        sg = Instance.new("SurfaceGui")
        sg.Face = Enum.NormalId.Front
        sg.CanvasSize = Vector2.new(400, 600)
        sg.Parent = board
    end
    sg:ClearAllChildren()
    local layout = Instance.new("UIListLayout")
    layout.Padding = UDim.new(0, 4)
    layout.Parent = sg
    for i, entry in ipairs(data) do
        local label = Instance.new("TextLabel")
        label.Size = UDim2.new(1, 0, 0, 50)
        label.BackgroundTransparency = 1
        label.Font = Enum.Font.GothamBold
        label.TextScaled = true
        label.TextColor3 = Color3.fromRGB(255, 230, 120)
        label.Text = string.format("#%d  %s  — Stage %d", i, entry.name, entry.score)
        label.Parent = sg
    end
end

task.spawn(function()
    while true do
        task.wait(30)
        for _, p in ipairs(Players:GetPlayers()) do updateScore(p) end
        renderBoard(fetchTop10())
    end
end)

print("[Obby] leaderboard sync active")
`

const vipPerksScript = `-- Obby VIP perks
-- Players who own the VIP gamepass get a trail, double XP, and a chat tag.

local MarketplaceService = game:GetService("MarketplaceService")
local Players = game:GetService("Players")
local HttpService = game:GetService("HttpService")

local VIP_ID = 0 -- set this to your real gamepass id

local function addTrail(player)
    local char = player.Character or player.CharacterAdded:Wait()
    local root = char:FindFirstChild("HumanoidRootPart")
    if not root then return end

    local a0 = Instance.new("Attachment")
    a0.Name = "TrailAttach0"
    a0.Position = Vector3.new(0, 2, 0)
    a0.Parent = root

    local a1 = Instance.new("Attachment")
    a1.Name = "TrailAttach1"
    a1.Position = Vector3.new(0, -2, 0)
    a1.Parent = root

    local trail = Instance.new("Trail")
    trail.Attachment0 = a0
    trail.Attachment1 = a1
    trail.Lifetime = 0.6
    trail.Color = ColorSequence.new({
        ColorSequenceKeypoint.new(0, Color3.fromRGB(255, 220, 60)),
        ColorSequenceKeypoint.new(1, Color3.fromRGB(255, 80, 200)),
    })
    trail.Parent = root
end

local function isVip(player)
    if VIP_ID == 0 then return false end
    local ok, owns = pcall(function()
        return MarketplaceService:UserOwnsGamePassAsync(player.UserId, VIP_ID)
    end)
    return ok and owns
end

Players.PlayerAdded:Connect(function(player)
    player.CharacterAdded:Connect(function()
        task.wait(0.4)
        if isVip(player) then addTrail(player) end
    end)
end)

print("[Obby] VIP perks ready")
`

export const obbyTemplate: GameTemplate = {
  id: 'obby',
  name: '10-Stage Obby',
  description:
    '10-stage parkour course with lava, floating platforms, narrow beams, saving checkpoints, and a win zone.',
  genre: 'obby',
  estimatedBuildTime: '30s',
  thumbnailPrompt:
    'colorful low-poly Roblox obby with checkered checkpoints, floating yellow hop blocks, a lava trench, and a gold win platform',
  partCount: 45,
  scriptCount: 5,
  structuredCommands: buildStageCommands(),
  serverScripts: [
    { name: 'Checkpoints', parent: 'ServerScriptService', source: checkpointScript },
    { name: 'LavaBricks', parent: 'ServerScriptService', source: lavaScript },
    { name: 'WinZone', parent: 'ServerScriptService', source: winZoneScript },
    { name: 'TopLeaderboard', parent: 'ServerScriptService', source: leaderboardScript },
    { name: 'VipPerks', parent: 'ServerScriptService', source: vipPerksScript },
  ],
  uiTemplates: ['hud', 'leaderboard', 'notification-toast'],
  mechanics: ['checkpoints', 'leaderstats'],
  monetization: {
    devProducts: [
      { id: 'skip_stage', name: 'Skip Stage', description: 'Skip one obby stage', priceRobux: 49 },
    ],
    gamePasses: [
      { id: 'vip',        name: 'VIP',         description: 'Double XP and particle trail',   priceRobux: 199 },
      { id: 'gravity',    name: 'Low Gravity', description: 'Higher jumps on every stage',    priceRobux: 149 },
    ],
  },
}
