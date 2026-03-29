/**
 * Script agent — generates Luau scripts for Roblox games using Claude.
 * Supports server scripts, local scripts, and module scripts.
 */

import { claudeChat } from '../ai/providers/anthropic'
import { anthropicBreaker } from '../ai/circuit-breaker'
import type { AgentCommand, AgentResult, GameChange } from './types'

// ---------------------------------------------------------------------------
// Script type definitions
// ---------------------------------------------------------------------------

export type ScriptType = 'server' | 'client' | 'module'

const SCRIPT_LOCATIONS: Record<ScriptType, string> = {
  server: 'ServerScriptService',
  client: 'StarterPlayerScripts',
  module: 'ReplicatedStorage.Modules',
}

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

const SCRIPT_SYSTEM_PROMPT = `You are a senior Roblox Luau engineer who writes production-quality scripts for top-rated games. Your code is clean, performant, and follows all current Roblox best practices (2024).

Return ONLY valid JSON with this exact shape:
{
  "scriptName": string,
  "scriptType": "server" | "client" | "module",
  "location": string,
  "code": string,
  "description": string,
  "dependencies": [string],
  "services": [string],
  "remoteEvents": [{"name": string, "direction": "ServerToClient" | "ClientToServer"}],
  "warnings": [string]
}

MANDATORY CODE STANDARDS — every generated script must follow ALL of these:

API CORRECTNESS:
- task.wait(n) not wait(n). task.spawn() not spawn(). task.delay() not delay()
- game:GetService("Players") etc. for all services — never use global Players
- RunService.Heartbeat:Connect() for per-frame logic
- :WaitForChild("Name", timeout) with timeout — never assume children exist
- Instance.new() then set properties then set .Parent last (performance)
- Destroy() not destroy(); Remove() is deprecated

VISUAL QUALITY — when building or placing objects via script:
- Use realistic Color3.fromRGB() values: stone=Color3.fromRGB(160,160,160), wood=Color3.fromRGB(125,84,46), lava=Color3.fromRGB(255,107,0)
- Set .Material = Enum.Material.Cobblestone / .SmoothPlastic / .Brick etc. — NEVER leave default Plastic for structural parts
- Add lighting children: local light = Instance.new("PointLight") light.Brightness=2 light.Range=16 light.Color=Color3.fromRGB(255,165,80) light.Parent=torchPart
- Use TweenService for smooth animations — never abruptly teleport Parts
- Set .CastShadow = true on significant Parts, false on tiny decorative details
- Anchor structural Parts (.Anchored = true)

BUILDING VIA SCRIPT — template to follow when placing Parts:
  local model = Instance.new("Model")
  model.Name = "CastleWallNorth"
  model.Parent = workspace

  local wall = Instance.new("Part")
  wall.Name = "MainWall"
  wall.Size = Vector3.new(4, 24, 80)  -- 4 thick, 24 tall, 80 wide
  wall.CFrame = CFrame.new(0, 12, 0)
  wall.Material = Enum.Material.Cobblestone
  wall.Color = Color3.fromRGB(100, 97, 96)
  wall.Anchored = true
  wall.CastShadow = true
  wall.Parent = model

  local torch = Instance.new("Part")
  torch.Name = "Torch"
  torch.Size = Vector3.new(0.5, 1.5, 0.5)
  torch.CFrame = CFrame.new(0, 13, -38)
  torch.Material = Enum.Material.WoodPlanks
  torch.Color = Color3.fromRGB(125, 84, 46)
  torch.Anchored = true
  torch.Parent = model

  local fire = Instance.new("Fire")
  fire.Color = Color3.fromRGB(255, 140, 0)
  fire.SecondaryColor = Color3.fromRGB(255, 80, 0)
  fire.Heat = 9
  fire.Size = 3
  fire.Parent = torch

  local light = Instance.new("PointLight")
  light.Brightness = 3
  light.Range = 18
  light.Color = Color3.fromRGB(255, 160, 50)
  light.Parent = torch

ATMOSPHERE via script (include when relevant):
  local atmosphere = Instance.new("Atmosphere")
  atmosphere.Density = 0.3
  atmosphere.Offset = 0.15
  atmosphere.Color = Color3.fromRGB(199, 213, 230)
  atmosphere.Glare = 0.1
  atmosphere.Haze = 0.3
  atmosphere.Parent = game.Lighting

  local bloom = Instance.new("BloomEffect")
  bloom.Intensity = 0.4
  bloom.Size = 24
  bloom.Threshold = 0.95
  bloom.Parent = game.Lighting

ERROR HANDLING:
- Wrap DataStore calls in pcall
- Use xpcall for complex error traces
- Check if instances exist before accessing children
- Guard against nil with "if x then" before property access

TYPE SAFETY:
- Use --!strict at top of module scripts
- Add type annotations: local function foo(player: Player, amount: number): boolean
- Use typed tables where practical

PERFORMANCE:
- Debounce Touched events (use a Set/dictionary, not a boolean flag)
- Disconnect event connections when no longer needed
- Use CollectionService tags instead of looping through all workspace descendants
- Cache frequently-used instances in variables at script top

Write COMPLETE scripts — do not write placeholder comments like "-- add logic here". Every function must be fully implemented.`

// ---------------------------------------------------------------------------
// Common script templates for demo mode
// ---------------------------------------------------------------------------

const SCRIPT_TEMPLATES: Record<string, string> = {
  door: `--!strict
-- AnimatedDoor (Server) — smooth tween door with ProximityPrompt
-- Attach this Script inside a door Part or Model with a Part named "DoorPart"

local TweenService = game:GetService("TweenService")

local model = script.Parent
local door: BasePart = model:WaitForChild("DoorPart") :: BasePart
local prompt: ProximityPrompt = model:WaitForChild("ProximityPrompt") :: ProximityPrompt

local OPEN_ANGLE_RAD = math.rad(100)
local TWEEN_TIME = 0.45
local TWEEN_INFO = TweenInfo.new(TWEEN_TIME, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)

local closedCFrame = door.CFrame
local openCFrame = door.CFrame * CFrame.new(0, 0, door.Size.Z * 0.5)
  * CFrame.Angles(0, OPEN_ANGLE_RAD, 0)
  * CFrame.new(0, 0, -door.Size.Z * 0.5)

local isOpen = false
local isTweening = false

local function setDoor(open: boolean)
  if isTweening then return end
  isTweening = true
  isOpen = open

  local target = open and openCFrame or closedCFrame
  local tween = TweenService:Create(door, TWEEN_INFO, { CFrame = target })
  tween:Play()

  -- Play a creak sound if one exists
  local sound = door:FindFirstChildOfClass("Sound")
  if sound then sound:Play() end

  tween.Completed:Connect(function()
    isTweening = false
    prompt.ActionText = open and "Close" or "Open"
  end)
end

prompt.Triggered:Connect(function(_player: Player)
  setDoor(not isOpen)
end)`,

  leaderstats: `--!strict
-- Leaderstats (Server) — coins + level with auto-save via DataStoreService
-- Place in ServerScriptService

local Players = game:GetService("Players")
local DataStoreService = game:GetService("DataStoreService")
local RunService = game:GetService("RunService")

local playerDataStore = DataStoreService:GetDataStore("PlayerData_v1")

local DEFAULT_DATA = {
  coins = 0,
  level = 1,
  xp = 0,
}

local function loadData(userId: number): typeof(DEFAULT_DATA)
  local success, result = pcall(function()
    return playerDataStore:GetAsync(tostring(userId))
  end)
  if success and result then
    return result
  end
  return table.clone(DEFAULT_DATA)
end

local function saveData(userId: number, data: typeof(DEFAULT_DATA))
  local success, err = pcall(function()
    playerDataStore:SetAsync(tostring(userId), data)
  end)
  if not success then
    warn("[Leaderstats] Save failed for", userId, ":", err)
  end
end

local function setupLeaderstats(player: Player)
  local data = loadData(player.UserId)

  -- Leaderstats folder (shown on the leaderboard)
  local leaderstats = Instance.new("Folder")
  leaderstats.Name = "leaderstats"
  leaderstats.Parent = player

  local coins = Instance.new("IntValue")
  coins.Name = "Coins"
  coins.Value = data.coins
  coins.Parent = leaderstats

  local level = Instance.new("IntValue")
  level.Name = "Level"
  level.Value = data.level
  level.Parent = leaderstats

  -- Hidden stats (not on leaderboard)
  local statsFolder = Instance.new("Folder")
  statsFolder.Name = "Stats"
  statsFolder.Parent = player

  local xp = Instance.new("IntValue")
  xp.Name = "XP"
  xp.Value = data.xp
  xp.Parent = statsFolder

  -- Auto-save every 60 seconds
  local saveConnection: RBXScriptConnection
  saveConnection = RunService.Heartbeat:Connect(function()
    -- Disconnect when player leaves
    if not player.Parent then
      saveConnection:Disconnect()
      return
    end
  end)

  task.spawn(function()
    while player.Parent do
      task.wait(60)
      saveData(player.UserId, {
        coins = coins.Value,
        level = level.Value,
        xp = xp.Value,
      })
    end
  end)
end

Players.PlayerAdded:Connect(setupLeaderstats)

Players.PlayerRemoving:Connect(function(player: Player)
  local leaderstats = player:FindFirstChild("leaderstats")
  local stats = player:FindFirstChild("Stats")
  if leaderstats and stats then
    local coins = leaderstats:FindFirstChild("Coins") :: IntValue?
    local level = leaderstats:FindFirstChild("Level") :: IntValue?
    local xp = stats:FindFirstChild("XP") :: IntValue?
    saveData(player.UserId, {
      coins = coins and coins.Value or 0,
      level = level and level.Value or 1,
      xp = xp and xp.Value or 0,
    })
  end
end)

-- Handle players who joined before the script loaded (Studio test mode)
for _, player in Players:GetPlayers() do
  task.spawn(setupLeaderstats, player)
end`,

  shop: `--!strict
-- ShopModule (ModuleScript) — item shop with purchase validation
-- Place in ReplicatedStorage.Modules

local ShopModule = {}

export type Product = {
  id: number,
  name: string,
  price: number,
  itemType: string,
  description: string,
}

local PRODUCTS: { Product } = {
  { id = 1, name = "Iron Sword",     price = 100, itemType = "Tool",      description = "A sturdy iron sword." },
  { id = 2, name = "Oak Shield",     price = 150, itemType = "Accessory", description = "A round wooden shield." },
  { id = 3, name = "Speed Potion",   price = 75,  itemType = "Consumable", description = "Doubles speed for 30s." },
  { id = 4, name = "Leather Armour", price = 200, itemType = "Accessory", description = "Light armour set." },
  { id = 5, name = "Dragon Staff",   price = 500, itemType = "Tool",      description = "A powerful magic staff." },
}

function ShopModule.getProducts(): { Product }
  return PRODUCTS
end

function ShopModule.getProductById(id: number): Product?
  for _, product in PRODUCTS do
    if product.id == id then return product end
  end
  return nil
end

function ShopModule.purchase(player: Player, productId: number): (boolean, string)
  local product = ShopModule.getProductById(productId)
  if not product then
    return false, "Product not found."
  end

  local leaderstats = player:FindFirstChild("leaderstats")
  if not leaderstats then
    return false, "Leaderstats not found."
  end

  local coins = leaderstats:FindFirstChild("Coins") :: IntValue?
  if not coins then
    return false, "Currency not found."
  end

  if coins.Value < product.price then
    return false, string.format("Need %d coins (you have %d).", product.price, coins.Value)
  end

  coins.Value -= product.price

  -- Grant the item from ServerStorage or a tool template
  local storage = game:GetService("ServerStorage")
  local template = storage:FindFirstChild(product.name, true)
  if template then
    local clone = template:Clone()
    clone.Parent = player.Backpack or player:FindFirstChild("Backpack")
  end

  return true, product.name .. " purchased!"
end

return ShopModule`,

  torch: `--!strict
-- TorchSpawner (Server) — spawns lit torches with flickering PointLight
-- Place in ServerScriptService; edit TORCH_POSITIONS for your map

local TweenService = game:GetService("TweenService")

-- ── Configuration ────────────────────────────────────────────────────────────
local TORCH_POSITIONS: { CFrame } = {
  CFrame.new(10, 5, 10),
  CFrame.new(-10, 5, 10),
  CFrame.new(10, 5, -10),
  CFrame.new(-10, 5, -10),
}

local TORCH_COLOR  = Color3.fromRGB(125, 84, 46)   -- wood brown
local FIRE_COLOR_1 = Color3.fromRGB(255, 140, 0)   -- orange flame
local FIRE_COLOR_2 = Color3.fromRGB(255, 60, 0)    -- red-orange base
local LIGHT_COLOR  = Color3.fromRGB(255, 160, 50)  -- warm amber glow

-- ── Torch factory ─────────────────────────────────────────────────────────────
local function createTorch(cf: CFrame): Model
  local model = Instance.new("Model")
  model.Name = "WallTorch"

  -- Wooden handle
  local handle = Instance.new("Part")
  handle.Name       = "Handle"
  handle.Size       = Vector3.new(0.35, 1.5, 0.35)
  handle.CFrame     = cf
  handle.Material   = Enum.Material.WoodPlanks
  handle.Color      = TORCH_COLOR
  handle.Anchored   = true
  handle.CastShadow = false
  handle.Parent     = model

  -- Torch head (slightly wider)
  local head = Instance.new("Part")
  head.Name       = "Head"
  head.Size       = Vector3.new(0.5, 0.5, 0.5)
  head.CFrame     = cf * CFrame.new(0, 1.0, 0)
  head.Material   = Enum.Material.SmoothRock
  head.Color      = Color3.fromRGB(60, 55, 50)
  head.Anchored   = true
  head.CastShadow = false
  head.Parent     = model
  model.PrimaryPart = head

  -- Fire particle
  local fire = Instance.new("Fire")
  fire.Color          = FIRE_COLOR_1
  fire.SecondaryColor = FIRE_COLOR_2
  fire.Heat           = 8
  fire.Size           = 2.5
  fire.Parent         = head

  -- Point light (will be animated)
  local light = Instance.new("PointLight")
  light.Name       = "FlameLight"
  light.Brightness = 2.5
  light.Range      = 16
  light.Color      = LIGHT_COLOR
  light.Parent     = head

  model.Parent = workspace

  -- Flicker animation — random brightness variation
  task.spawn(function()
    local tweenIn  = TweenService:Create(light, TweenInfo.new(0.08, Enum.EasingStyle.Sine), { Brightness = 3.2, Range = 18 })
    local tweenOut = TweenService:Create(light, TweenInfo.new(0.12, Enum.EasingStyle.Sine), { Brightness = 1.8, Range = 14 })
    while model.Parent do
      tweenIn:Play()
      task.wait(0.08 + math.random() * 0.12)
      tweenOut:Play()
      task.wait(0.12 + math.random() * 0.18)
    end
  end)

  return model
end

-- ── Spawn all torches ──────────────────────────────────────────────────────────
for _, cf in TORCH_POSITIONS do
  createTorch(cf)
end`,
}

// ---------------------------------------------------------------------------
// Agent implementation
// ---------------------------------------------------------------------------

export async function runScriptAgent(command: AgentCommand): Promise<AgentResult> {
  const start = Date.now()
  const { parameters } = command

  const description = (parameters.description as string | undefined) ?? 'generic game script'
  const scriptType = ((parameters.scriptType as string | undefined) ?? 'server') as ScriptType
  const context = command.context

  // Demo fallback
  if (!process.env.ANTHROPIC_API_KEY) {
    return demoScriptResult(description, scriptType, start)
  }

  const recentHistory = context.sessionHistory.slice(-3).map((e) => `- ${e.intent}: ${e.description}`).join('\n')

  const prompt = `Generate a Luau ${scriptType} script for: ${description}
${recentHistory ? `\nRecent session context:\n${recentHistory}` : ''}
Location: ${SCRIPT_LOCATIONS[scriptType]}`

  try {
    const result = await anthropicBreaker.execute(() =>
      claudeChat(
        [{ role: 'user', content: prompt }],
        { systemPrompt: SCRIPT_SYSTEM_PROMPT, maxTokens: 6000, temperature: 0.2 }
      )
    )

    let scriptPlan: Record<string, unknown> = {}
    try {
      const raw = result.content.replace(/```(?:json)?\s*/g, '').replace(/```/g, '').trim()
      scriptPlan = JSON.parse(raw)
    } catch {
      // If not valid JSON, treat the whole response as code
      scriptPlan = {
        scriptName: 'GeneratedScript',
        scriptType,
        location: SCRIPT_LOCATIONS[scriptType],
        code: result.content,
        description,
        dependencies: [],
        services: [],
        remoteEvents: [],
        warnings: [],
      }
    }

    const changes: GameChange[] = [
      {
        type: 'other',
        description: `${scriptPlan.scriptType ?? scriptType} script "${scriptPlan.scriptName ?? 'Script'}" → ${scriptPlan.location ?? SCRIPT_LOCATIONS[scriptType]}`,
        metadata: {
          services: scriptPlan.services,
          remoteEvents: scriptPlan.remoteEvents,
          warnings: scriptPlan.warnings,
          codeLength: typeof scriptPlan.code === 'string' ? scriptPlan.code.length : 0,
        },
      },
    ]

    return {
      success: true,
      message: `${scriptPlan.scriptType ?? scriptType} script "${scriptPlan.scriptName ?? 'Script'}" generated. ${scriptPlan.description ?? description}`,
      tokensUsed: result.totalTokens,
      changes,
      duration: Date.now() - start,
      agent: 'script',
      data: scriptPlan,
    }
  } catch (err) {
    return {
      success: false,
      message: `Script agent failed: ${err instanceof Error ? err.message : String(err)}`,
      tokensUsed: 0,
      changes: [],
      duration: Date.now() - start,
      agent: 'script',
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

/**
 * generate_script(description, type) — public API
 */
export async function generateScript(
  description: string,
  type: ScriptType,
  context: AgentCommand['context']
): Promise<AgentResult> {
  return runScriptAgent({
    intent: 'generate_script',
    parameters: { description, scriptType: type },
    context,
  })
}

// ---------------------------------------------------------------------------
// Demo helper
// ---------------------------------------------------------------------------

function demoScriptResult(description: string, scriptType: ScriptType, start: number): AgentResult {
  const lower = description.toLowerCase()
  let code = SCRIPT_TEMPLATES.leaderstats
  let scriptName = 'GeneratedScript'

  if (lower.includes('door') || lower.includes('gate')) {
    code = SCRIPT_TEMPLATES.door
    scriptName = 'AnimatedDoor'
  } else if (lower.includes('shop') || lower.includes('store') || lower.includes('buy')) {
    code = SCRIPT_TEMPLATES.shop
    scriptName = 'ShopModule'
  } else if (lower.includes('torch') || lower.includes('light') || lower.includes('fire') || lower.includes('lantern')) {
    code = SCRIPT_TEMPLATES.torch
    scriptName = 'TorchSpawner'
  } else if (lower.includes('leaderboard') || lower.includes('coins') || lower.includes('points') || lower.includes('stats')) {
    code = SCRIPT_TEMPLATES.leaderstats
    scriptName = 'LeaderboardScript'
  }

  return {
    success: true,
    message: `[Demo] ${scriptType} script "${scriptName}" generated for: ${description}. Set ANTHROPIC_API_KEY for custom script generation.`,
    tokensUsed: 0,
    changes: [
      {
        type: 'other',
        description: `${scriptType} script "${scriptName}" → ${SCRIPT_LOCATIONS[scriptType]}`,
        metadata: { scriptName, scriptType, location: SCRIPT_LOCATIONS[scriptType], codeLength: code.length },
      },
    ],
    duration: Date.now() - start,
    agent: 'script',
    data: { demo: true, scriptName, scriptType, location: SCRIPT_LOCATIONS[scriptType], code },
  }
}
