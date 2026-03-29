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

const SCRIPT_SYSTEM_PROMPT = `You are an expert Roblox Luau developer. Generate production-quality Luau scripts.

Return ONLY valid JSON:
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

Rules:
- Use task.wait() not wait()
- Use game:GetService() for all Roblox services
- Handle pcall/xpcall for error-prone operations
- Use :WaitForChild() when accessing instances that may not be loaded
- Server scripts: ServerScriptService or workspace
- Client scripts: StarterPlayerScripts or StarterCharacterScripts
- Module scripts: ReplicatedStorage or ServerStorage
- Never use deprecated APIs (e.g., Touched without params, BindableEvent for cross-boundary)
- Add type annotations where helpful
- Keep code under 200 lines unless complexity demands more`

// ---------------------------------------------------------------------------
// Common script templates for demo mode
// ---------------------------------------------------------------------------

const SCRIPT_TEMPLATES: Record<string, string> = {
  door: `-- Door Script (Server)
local door = script.Parent
local isOpen = false
local debounce = false

local function toggleDoor()
  if debounce then return end
  debounce = true
  isOpen = not isOpen
  local targetCFrame = isOpen
    and door.CFrame * CFrame.Angles(0, math.rad(90), 0)
    or door.CFrame * CFrame.Angles(0, math.rad(-90), 0)
  local tween = game:GetService("TweenService"):Create(
    door,
    TweenInfo.new(0.5, Enum.EasingStyle.Quad),
    { CFrame = targetCFrame }
  )
  tween:Play()
  tween.Completed:Connect(function() debounce = false end)
end

local prompt = door:FindFirstChildOfClass("ProximityPrompt")
if prompt then
  prompt.Triggered:Connect(toggleDoor)
end`,

  leaderstats: `-- Leaderboard (Server)
local Players = game:GetService("Players")

Players.PlayerAdded:Connect(function(player)
  local leaderstats = Instance.new("Folder")
  leaderstats.Name = "leaderstats"
  leaderstats.Parent = player

  local coins = Instance.new("IntValue")
  coins.Name = "Coins"
  coins.Value = 0
  coins.Parent = leaderstats

  local level = Instance.new("IntValue")
  level.Name = "Level"
  level.Value = 1
  level.Parent = leaderstats
end)`,

  shop: `-- Shop Module
local ShopModule = {}

local products = {
  { id = 1, name = "Sword",  price = 100, itemType = "Tool" },
  { id = 2, name = "Shield", price = 150, itemType = "Accessory" },
}

function ShopModule.getProducts()
  return products
end

function ShopModule.purchase(player, productId)
  local product = nil
  for _, p in ipairs(products) do
    if p.id == productId then product = p break end
  end
  if not product then return false, "Product not found" end

  local coins = player.leaderstats and player.leaderstats:FindFirstChild("Coins")
  if not coins then return false, "No currency" end
  if coins.Value < product.price then return false, "Insufficient funds" end

  coins.Value -= product.price
  return true, product.name .. " purchased!"
end

return ShopModule`,
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
        { systemPrompt: SCRIPT_SYSTEM_PROMPT, maxTokens: 3000, temperature: 0.2 }
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
    scriptName = 'DoorScript'
  } else if (lower.includes('shop') || lower.includes('store') || lower.includes('buy')) {
    code = SCRIPT_TEMPLATES.shop
    scriptName = 'ShopModule'
  } else if (lower.includes('leaderboard') || lower.includes('coins') || lower.includes('points')) {
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
