/**
 * Intent parser — uses Claude to translate natural language into structured
 * agent commands.
 *
 * Falls back to a keyword-based heuristic when the API key is absent so the
 * chat endpoint always returns something useful in development / demo mode.
 */

import { claudeChat } from '../ai/providers/anthropic'
import type { ParsedIntent, IntentType, AgentType } from './types'

// ---------------------------------------------------------------------------
// Intent → agent routing table
// ---------------------------------------------------------------------------

const INTENT_AGENT_MAP: Record<IntentType, { agents: AgentType[]; canParallelize: boolean }> = {
  build_structure:       { agents: ['building', 'script'], canParallelize: true },
  modify_terrain:        { agents: ['terrain'], canParallelize: false },
  add_npc:               { agents: ['npc', 'script'], canParallelize: true },
  generate_script:       { agents: ['script'], canParallelize: false },
  update_ui:             { agents: ['script'], canParallelize: false },
  add_audio:             { agents: ['script'], canParallelize: false },
  adjust_lighting:       { agents: ['script'], canParallelize: false },
  configure_economy:     { agents: ['script'], canParallelize: false },
  create_quest:          { agents: ['script', 'npc'], canParallelize: true },
  add_combat:            { agents: ['script', 'npc'], canParallelize: true },
  manage_inventory:      { agents: ['script'], canParallelize: false },
  add_vehicle:           { agents: ['building', 'script'], canParallelize: true },
  add_particle:          { agents: ['script'], canParallelize: false },
  add_animation:         { agents: ['script'], canParallelize: false },
  configure_monetization:{ agents: ['script'], canParallelize: false },
  publish_game:          { agents: ['quality'], canParallelize: false },
  scan_dna:              { agents: ['quality'], canParallelize: false },
  search_marketplace:    { agents: ['building'], canParallelize: false },
  check_quality:         { agents: ['quality'], canParallelize: false },
  unknown:               { agents: ['script'], canParallelize: false },
}

// ---------------------------------------------------------------------------
// System prompt for Claude
// ---------------------------------------------------------------------------

const INTENT_SYSTEM_PROMPT = `You are an intent parser for a Roblox game-building AI platform.
Parse the user's message and return ONLY valid JSON with this exact shape:
{
  "intent": "<one of the intents listed below>",
  "label": "<short human-readable label, max 40 chars>",
  "confidence": <0.0 to 1.0>,
  "parameters": {
    <key-value pairs relevant to the intent>
  }
}

Valid intents:
- build_structure   — place a building, object, or structure
- modify_terrain    — change land, water, hills, biomes
- add_npc           — create a character with behaviour/dialogue
- generate_script   — write a Luau script
- update_ui         — create or modify ScreenGui / UI elements
- add_audio         — add sound effects or music
- adjust_lighting   — change ambient light, fog, sky
- configure_economy — set up currency, shops, prices
- create_quest      — design a quest or mission
- add_combat        — implement combat mechanics
- manage_inventory  — build inventory systems
- add_vehicle       — add a drivable vehicle
- add_particle      — add particle effects (fire, sparkles, etc.)
- add_animation     — animate a model or character
- configure_monetization — set up game passes or developer products
- publish_game      — publish or update the game
- scan_dna          — analyse an existing Roblox game
- search_marketplace — find assets on the Roblox marketplace
- check_quality     — run quality/performance checks
- unknown           — cannot determine intent

Parameter hints by intent:
- build_structure: type, style, position, size
- modify_terrain: biome, region, operation (raise/lower/flatten/paint), features
- add_npc: name, description, behavior, dialogue
- generate_script: description, scriptType (server/client/module)
- update_ui: elements, layout, theme
- add_audio: soundType, loop, volume, position
- adjust_lighting: time_of_day, brightness, fog, atmosphere
- configure_economy: currency, prices, shops
- create_quest: name, objectives, rewards, npcGiver
- add_combat: weaponType, mechanics, health
- manage_inventory: categories, maxSlots
- add_vehicle: vehicleType, seats, speed
- add_particle: effectType, color, rate, lifetime
- add_animation: animationType, target, loop
- configure_monetization: productType, price, name
- search_marketplace: query, category
- check_quality: checkType (performance/visual/all)

Respond ONLY with JSON, no prose.`

// ---------------------------------------------------------------------------
// Keyword fallback (no API key)
// ---------------------------------------------------------------------------

const KEYWORD_MAP: Array<{ patterns: RegExp[]; intent: IntentType }> = [
  { patterns: [/\b(build|place|create|add|spawn)\b.*\b(building|castle|house|tower|wall|bridge|shop|structure)\b/i, /\b(castle|house|tower|wall|bridge|shop)\b/i], intent: 'build_structure' },
  { patterns: [/\b(terrain|land|mountain|hill|valley|biome|grass|water|lake|river|flatten|raise|lower)\b/i], intent: 'modify_terrain' },
  { patterns: [/\b(npc|character|enemy|mob|guard|villager|merchant|quest.?giver)\b/i], intent: 'add_npc' },
  { patterns: [/\b(script|code|luau|function|event|module|server|client)\b/i], intent: 'generate_script' },
  { patterns: [/\b(ui|gui|menu|button|screen|hud|leaderboard|inventory.?ui)\b/i], intent: 'update_ui' },
  { patterns: [/\b(sound|music|audio|sfx|ambience|footstep)\b/i], intent: 'add_audio' },
  { patterns: [/\b(light|fog|sky|ambient|sunrise|sunset|atmosphere|daylight)\b/i], intent: 'adjust_lighting' },
  { patterns: [/\b(economy|shop|currency|coin|token|price|buy|sell|store)\b/i], intent: 'configure_economy' },
  { patterns: [/\b(quest|mission|objective|task|reward|story)\b/i], intent: 'create_quest' },
  { patterns: [/\b(combat|fight|attack|weapon|sword|gun|health|damage|pvp)\b/i], intent: 'add_combat' },
  { patterns: [/\b(inventory|item|backpack|storage|slot|equipment)\b/i], intent: 'manage_inventory' },
  { patterns: [/\b(vehicle|car|truck|boat|plane|bike|drive)\b/i], intent: 'add_vehicle' },
  { patterns: [/\b(particle|fire|smoke|spark|glow|trail|effect)\b/i], intent: 'add_particle' },
  { patterns: [/\b(anim|animation|idle|walk|run|jump|emote)\b/i], intent: 'add_animation' },
  { patterns: [/\b(gamepass|game.?pass|developer.?product|robux|monetize|premium)\b/i], intent: 'configure_monetization' },
  { patterns: [/\b(publish|release|update|deploy)\b/i], intent: 'publish_game' },
  { patterns: [/\b(scan|analyse|analyze|dna|audit)\b/i], intent: 'scan_dna' },
  { patterns: [/\b(search|find|marketplace|asset|model|lookup)\b/i], intent: 'search_marketplace' },
  { patterns: [/\b(quality|performance|check|test|lag|instance|memory)\b/i], intent: 'check_quality' },
]

function keywordFallback(input: string): ParsedIntent {
  for (const entry of KEYWORD_MAP) {
    if (entry.patterns.some((p) => p.test(input))) {
      const routing = INTENT_AGENT_MAP[entry.intent]
      return {
        intent: entry.intent,
        label: entry.intent.replace(/_/g, ' '),
        confidence: 0.6,
        parameters: { rawInput: input },
        agents: routing.agents,
        canParallelize: routing.canParallelize,
      }
    }
  }

  const routing = INTENT_AGENT_MAP.unknown
  return {
    intent: 'unknown',
    label: 'general request',
    confidence: 0.3,
    parameters: { rawInput: input },
    agents: routing.agents,
    canParallelize: false,
  }
}

// ---------------------------------------------------------------------------
// Main parser
// ---------------------------------------------------------------------------

/**
 * Parse natural language input into a structured ParsedIntent.
 * Uses Claude when ANTHROPIC_API_KEY is set; falls back to keyword matching.
 */
export async function parseIntent(
  userInput: string,
  gameContext?: string
): Promise<ParsedIntent> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return keywordFallback(userInput)
  }

  const contextBlock = gameContext
    ? `\nGame context: ${gameContext.slice(0, 200)}`
    : ''

  try {
    const result = await claudeChat(
      [{ role: 'user', content: `Parse this message:${contextBlock}\n\nUser: "${userInput}"` }],
      {
        systemPrompt: INTENT_SYSTEM_PROMPT,
        maxTokens: 500,
        temperature: 0,
      }
    )

    let parsed: { intent: IntentType; label: string; confidence: number; parameters: Record<string, unknown> }

    try {
      // Strip markdown code fences if Claude wraps the response
      const raw = result.content.replace(/```(?:json)?\s*/g, '').replace(/```/g, '').trim()
      parsed = JSON.parse(raw)
    } catch {
      return keywordFallback(userInput)
    }

    const intent = parsed.intent as IntentType
    const routing = INTENT_AGENT_MAP[intent] ?? INTENT_AGENT_MAP.unknown

    return {
      intent,
      label: parsed.label ?? intent.replace(/_/g, ' '),
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.8,
      parameters: parsed.parameters ?? {},
      agents: routing.agents,
      canParallelize: routing.canParallelize,
    }
  } catch {
    return keywordFallback(userInput)
  }
}
