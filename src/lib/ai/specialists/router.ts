/**
 * Specialist Router — picks the best specialist agent for a user's request.
 *
 * Strategy: keyword matching with scoring. Each specialist has keywords;
 * we score each specialist against the user's message and pick the top match.
 * If no specialist scores above the threshold, falls back to a general builder.
 *
 * The registry is lazy-loaded on first use to avoid bloating serverless
 * function bundles (the 200 specialist prompts are ~155KB of data).
 */

import 'server-only'
import type { Specialist } from './types'

export type { Specialist }

/**
 * Fallback specialist — activates when no specialist keyword matches.
 * Ensures every build/game prompt gets quality instructions instead of bare defaults.
 */
const GENERAL_BUILDER_FALLBACK: Specialist = {
  id: 'general-builder',
  name: 'General Roblox Builder',
  description: 'All-purpose Roblox game builder — handles any build, script, UI, or game request',
  keywords: [],
  ragCategories: ['pattern', 'api', 'luau', 'service', 'building', 'dev'],
  prompt: `You are a General Roblox Builder — an expert at building ANYTHING in Roblox Studio.

BUILD QUALITY RULES:
- Minimum 15 parts per build. Simple props 8-15 parts, structures 25-60+, environments 50-200+.
- NEVER use SmoothPlastic material. Prefer Concrete, Wood, Brick, Metal, Grass, Cobblestone.
- Every part needs explicit Color3.fromRGB() — no default grey parts.
- Add PointLights or SpotLights for atmosphere (Range 8-20, warm tones for interiors, cool for exteriors).
- Multi-part detail: doors have frames, windows have sills, roofs have overhangs, walls have baseboards.
- Scale matters: doors 3x7 studs, ceilings 10-12 studs high, hallways 6+ studs wide.

SCRIPTING RULES (when scripts are requested):
- Use modern Luau patterns: typed variables, task.wait() not wait(), Players:GetPlayers() patterns.
- Scripts must be complete and runnable — no placeholder comments like "-- add logic here".
- Use proper Roblox services: Players, ReplicatedStorage, ServerScriptService, Workspace.
- DataStore patterns: pcall wrapping, retry logic, session locking.
- RemoteEvents for client-server communication, never trust the client.

UI RULES (when GUI is requested):
- ScreenGui with proper ZIndexBehavior.Sibling.
- Use UICorner, UIStroke, UIListLayout, UIPadding for polished look.
- Responsive sizing with UDim2.new(scale, offset, scale, offset).
- Consistent color scheme — don't use random colors.
- Always set BackgroundTransparency, Font, TextSize explicitly.

OUTPUT: Always output structured build commands the Studio plugin can execute. Never just describe — BUILD it.`,
}

// Lazy-loaded specialist index — initialized on first findSpecialist() call
let specialistIndex: Array<{
  specialist: Specialist
  keywordSet: Set<string>
  wordSet: Set<string>
}> | null = null

async function getIndex() {
  if (specialistIndex) return specialistIndex

  // Dynamic import keeps the 155KB of specialist data out of the initial bundle
  const { SPECIALISTS } = await import('./registry')

  specialistIndex = SPECIALISTS.map(s => ({
    specialist: s,
    keywordSet: new Set(s.keywords.map(k => k.toLowerCase())),
    wordSet: new Set(s.keywords.flatMap(k => k.toLowerCase().split(/[\s-]+/))),
  }))
  return specialistIndex
}

/**
 * Find the best specialist for a given user message.
 * Returns null if no specialist matches above threshold.
 * @deprecated Use findSpecialists() for multi-specialist activation.
 */
export async function findSpecialist(userMessage: string): Promise<Specialist | null> {
  const matches = await findSpecialists(userMessage)
  return matches.length > 0 ? matches[0] : null
}

/**
 * Find the TOP 3 specialists that match a user message above threshold.
 * Multiple specialists combine their expertise — e.g. a "tycoon game with
 * combat" request gets both the tycoon specialist AND the combat specialist.
 *
 * IMPORTANT: Every build/script/game prompt should get at least one specialist.
 * Even single-word prompts like "castle" or "obby" activate specialists.
 * When nothing matches, a General Roblox Builder fallback is returned.
 */
export async function findSpecialists(userMessage: string, maxCount: number = 3): Promise<Specialist[]> {
  const index = await getIndex()
  const words = userMessage.toLowerCase().replace(/[^a-z0-9\s-]/g, '').split(/\s+/).filter(w => w.length > 0)
  const messageText = userMessage.toLowerCase()

  const scored: Array<{ specialist: Specialist; score: number }> = []

  for (const { specialist, keywordSet, wordSet } of index) {
    let score = 0

    for (const keyword of keywordSet) {
      if (messageText.includes(keyword)) {
        score += keyword.split(/\s+/).length * 3
      }
    }

    for (const word of words) {
      if (word.length < 2) continue
      if (wordSet.has(word)) {
        score += 1
      }
    }

    if (score >= 1) {
      scored.push({ specialist, score })
    }
  }

  // Sort by score descending, take top N
  scored.sort((a, b) => b.score - a.score)
  const results = scored.slice(0, maxCount).map(s => s.specialist)

  // Fallback: if no specialist matched, use the General Roblox Builder
  // so every build/game prompt gets quality instructions
  if (results.length === 0) {
    results.push(GENERAL_BUILDER_FALLBACK)
  }

  return results
}

/**
 * Build the specialist-enhanced system prompt.
 * Supports single specialist (legacy) or array of specialists.
 */
export function applySpecialist(basePrompt: string, specialist: Specialist | Specialist[]): string {
  const specialists = Array.isArray(specialist) ? specialist : [specialist]
  if (specialists.length === 0) return basePrompt

  const specialistBlocks = specialists.map((s, i) =>
    `[SPECIALIST ${i + 1}: ${s.name}]\n${s.prompt}`
  ).join('\n\n---\n\n')

  return `${specialistBlocks}

${basePrompt}`
}

/**
 * Get RAG categories to use based on the specialists' domains.
 * Accepts single specialist, array, or null.
 */
export function getSpecialistRAGCategories(specialist: Specialist | Specialist[] | null): string[] {
  const defaults = ['pattern', 'api', 'luau', 'service', 'building', 'dev']
  if (!specialist) return defaults
  const specialists = Array.isArray(specialist) ? specialist : [specialist]
  const allCategories = specialists.flatMap(s => s.ragCategories)
  return [...new Set([...allCategories, ...defaults])]
}
