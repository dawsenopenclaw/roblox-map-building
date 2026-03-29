/**
 * NPC agent — creates characters with behaviour trees and dialogue scripts.
 */

import { claudeChat } from '../ai/providers/anthropic'
import { anthropicBreaker } from '../ai/circuit-breaker'
import type { AgentCommand, AgentResult, GameChange } from './types'

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

const NPC_SYSTEM_PROMPT = `You are a Roblox NPC designer. Return ONLY valid JSON:
{
  "npc": {
    "name": string,
    "description": string,
    "appearance": {"bodyColor": string, "clothing": string, "accessories": []},
    "behavior": {
      "type": "idle" | "patrol" | "aggressive" | "merchant" | "quest_giver" | "follower",
      "patrolRadius": number,
      "aggroRange": number,
      "fleeHealth": number
    },
    "dialogue": {
      "greeting": string,
      "idle": [string],
      "combat": [string],
      "trade": string,
      "farewell": string
    },
    "stats": {"health": number, "walkSpeed": number, "damage": number},
    "drops": [{"item": string, "chance": number}]
  },
  "behaviorScript": string,
  "dialogueScript": string,
  "instanceCount": number
}

Rules:
- behaviorScript: valid Luau code snippet for the NPC behavior
- dialogueScript: valid Luau code for dialogue (uses ProximityPrompt or BillboardGui)
- Health range: 50–5000. WalkSpeed: 8–50. Damage: 5–200
- Dialogue strings: keep short and in-character`

// ---------------------------------------------------------------------------
// Behavior tree templates
// ---------------------------------------------------------------------------

const BEHAVIOR_TEMPLATES: Record<string, string> = {
  idle: `-- Idle NPC behavior
local npc = script.Parent
local humanoid = npc:WaitForChild("Humanoid")
humanoid.WalkSpeed = 0
-- Play idle animations if available
local idleAnim = npc:FindFirstChild("IdleAnimation")
if idleAnim then
  humanoid.Animator:LoadAnimation(idleAnim):Play()
end`,

  patrol: `-- Patrol NPC behavior
local npc = script.Parent
local humanoid = npc:WaitForChild("Humanoid")
local waypoints = workspace:FindFirstChild("Waypoints")
if not waypoints then return end
local points = waypoints:GetChildren()
local index = 1
while true do
  humanoid:MoveTo(points[index].Position)
  humanoid.MoveToFinished:Wait()
  index = (index % #points) + 1
  task.wait(1)
end`,

  merchant: `-- Merchant NPC behavior
local npc = script.Parent
local prompt = Instance.new("ProximityPrompt")
prompt.ActionText = "Shop"
prompt.ObjectText = npc.Name
prompt.Parent = npc.PrimaryPart or npc:FindFirstChild("HumanoidRootPart")
prompt.Triggered:Connect(function(player)
  -- Open shop GUI
  local gui = player.PlayerGui:FindFirstChild("ShopGui")
  if gui then gui.Enabled = true end
end)`,
}

// ---------------------------------------------------------------------------
// Agent implementation
// ---------------------------------------------------------------------------

export async function runNpcAgent(command: AgentCommand): Promise<AgentResult> {
  const start = Date.now()
  const { parameters } = command

  const description = (parameters.description as string | undefined) ?? 'generic NPC'
  const behavior = (parameters.behavior as string | undefined) ?? 'idle'
  const dialogue = (parameters.dialogue as string | undefined) ?? ''
  const name = (parameters.name as string | undefined) ?? 'NPC'

  // Demo fallback
  if (!process.env.ANTHROPIC_API_KEY) {
    return demoNpcResult(name, description, behavior, start)
  }

  const prompt = `Create a Roblox NPC named "${name}". Description: ${description}. Behavior type: ${behavior}. ${dialogue ? `Sample dialogue: ${dialogue}` : ''}`

  try {
    const result = await anthropicBreaker.execute(() =>
      claudeChat(
        [{ role: 'user', content: prompt }],
        { systemPrompt: NPC_SYSTEM_PROMPT, maxTokens: 2500, temperature: 0.4 }
      )
    )

    let npcPlan: Record<string, unknown> = {}
    try {
      const raw = result.content.replace(/```(?:json)?\s*/g, '').replace(/```/g, '').trim()
      npcPlan = JSON.parse(raw)
    } catch {
      npcPlan = { raw: result.content }
    }

    const npc = npcPlan.npc as Record<string, unknown> | undefined

    const changes: GameChange[] = [
      {
        type: 'npc',
        description: `${npc?.name ?? name} (${npc?.behavior?.type ?? behavior}) — ${npc?.stats?.health ?? 100} HP`,
        metadata: {
          appearance: npc?.appearance,
          behavior: npc?.behavior,
          dialogue: npc?.dialogue,
          hasBehaviorScript: !!npcPlan.behaviorScript,
          hasDialogueScript: !!npcPlan.dialogueScript,
        },
      },
    ]

    return {
      success: true,
      message: `NPC "${npc?.name ?? name}" created: ${npc?.behavior?.type ?? behavior} behavior, ${(npc?.dialogue as Record<string, unknown>)?.greeting ?? 'no greeting set'}.`,
      tokensUsed: result.totalTokens,
      changes,
      duration: Date.now() - start,
      agent: 'npc',
      data: npcPlan,
    }
  } catch (err) {
    return {
      success: false,
      message: `NPC agent failed: ${err instanceof Error ? err.message : String(err)}`,
      tokensUsed: 0,
      changes: [],
      duration: Date.now() - start,
      agent: 'npc',
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

/**
 * create_npc(description, behavior, dialogue) — public API
 */
export async function createNpc(
  description: string,
  behavior: string,
  dialogue: string,
  context: AgentCommand['context']
): Promise<AgentResult> {
  return runNpcAgent({
    intent: 'add_npc',
    parameters: { description, behavior, dialogue },
    context,
  })
}

// ---------------------------------------------------------------------------
// Demo helper
// ---------------------------------------------------------------------------

function demoNpcResult(
  name: string,
  description: string,
  behavior: string,
  start: number
): AgentResult {
  const scriptTemplate = BEHAVIOR_TEMPLATES[behavior] ?? BEHAVIOR_TEMPLATES.idle
  return {
    success: true,
    message: `[Demo] NPC "${name}" created: ${description}. Behavior: ${behavior}. Set ANTHROPIC_API_KEY for AI-generated dialogue and custom behavior trees.`,
    tokensUsed: 0,
    changes: [
      {
        type: 'npc',
        description: `${name} (${behavior})`,
        metadata: {
          description,
          behavior: { type: behavior },
          dialogue: { greeting: `Hello, traveller! I am ${name}.` },
          behaviorScript: scriptTemplate,
        },
      },
    ],
    duration: Date.now() - start,
    agent: 'npc',
    data: { demo: true, name, description, behavior, scriptSnippet: scriptTemplate },
  }
}
