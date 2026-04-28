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

FIRST: Analyze the request. Decide what this build NEEDS:
- Is it a prop, structure, scene, or full world? Scale your part count accordingly.
- Does it need lighting? (outdoor scenes, interiors with windows = yes. Simple props = no)
- Does it need terrain? (outdoor on-ground builds = yes. Floating, indoor, vehicle = no)
- Does it need scripts? (ONLY if user asked for behavior/interactivity)
- Does it need UI? (ONLY if user asked for menu/HUD/interface)
- Does it need effects? (torches, fire, magic = yes. A house = no)

BUILD QUALITY RULES:
- Props: 8-30 parts. Structures: 30-150 parts. Scenes: 100-500 parts.
- NEVER SmoothPlastic. Use Concrete, Wood, Brick, Metal, Grass, Cobblestone, Slate, Neon.
- Every part: explicit Color3.fromRGB() with 2-3 color variations per material (not flat single color).
- Multi-part detail: doors have frames+handle, windows have sills+panes, roofs overhang, walls have trim.
- Scale: doors 3x7 studs, ceilings 10-12 high, hallways 6+ wide, tables 3.5 high, chairs 4 high.
- RANDOMIZE multiples: if building 5 trees, vary height (8-15 studs), canopy size, trunk width, lean angle.
- Add 1-3 PointLights per structure (Range 12-20, warm Color3.fromRGB(255,200,150) for cozy, cool for modern).

SCRIPTING RULES (ONLY when scripts are requested):
- Modern Luau: typed variables, task.wait(), task.spawn(), not deprecated wait()/spawn().
- Complete and runnable — no "-- add logic here" placeholders.
- Proper services: Players, ReplicatedStorage, ServerScriptService.
- DataStore: pcall wrapping, retry logic. RemoteEvents for client-server.

UI RULES (ONLY when GUI is requested):
- ScreenGui with ZIndexBehavior.Sibling. UICorner + UIStroke for polish.
- UDim2 with scale values for responsiveness. Consistent color scheme.

OUTPUT: Always output executable Luau code. Never just describe — BUILD it.`,
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

  // Build a set of message words + common singular/plural variants for fuzzy matching
  const messageWordSet = new Set(words)
  for (const w of words) {
    // Add plural/singular variants
    if (w.endsWith('s') && w.length > 3) messageWordSet.add(w.slice(0, -1)) // trees → tree
    if (w.endsWith('es') && w.length > 4) messageWordSet.add(w.slice(0, -2)) // houses → house
    if (w.endsWith('ies') && w.length > 5) messageWordSet.add(w.slice(0, -3) + 'y') // cities → city
    if (!w.endsWith('s')) messageWordSet.add(w + 's') // tree → trees
    // Common suffix variants
    if (w.endsWith('ing') && w.length > 5) messageWordSet.add(w.slice(0, -3)) // building → build
    if (w.endsWith('er') && w.length > 4) messageWordSet.add(w.slice(0, -2)) // builder → build
  }

  const scored: Array<{ specialist: Specialist; score: number }> = []

  for (const { specialist, keywordSet, wordSet } of index) {
    let score = 0

    // Exact phrase match in message
    for (const keyword of keywordSet) {
      if (messageText.includes(keyword)) {
        score += keyword.split(/\s+/).length * 3
      }
    }

    // Word-level match with fuzzy singular/plural
    for (const word of messageWordSet) {
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
 * Build the specialist-enhanced system prompt with comprehension layer.
 * The AI analyzes the prompt and makes intelligent decisions about what to include.
 */
export function applySpecialist(basePrompt: string, specialist: Specialist | Specialist[]): string {
  const specialists = Array.isArray(specialist) ? specialist : [specialist]
  if (specialists.length === 0) return basePrompt

  const specialistBlocks = specialists.map((s, i) =>
    `[SPECIALIST ${i + 1}: ${s.name}]\n${s.prompt}`
  ).join('\n\n---\n\n')

  const comprehensionLayer = `[BUILD COMPREHENSION — READ BEFORE BUILDING]
Before generating code, ANALYZE the user's request and decide what this build ACTUALLY needs.
You have specialist knowledge below — use ONLY the parts that apply. Do NOT blindly include everything.

DECISION CHECKLIST (think through each):
1. SCOPE: Is this a single prop (8-30 parts), a structure (30-150 parts), a scene (100-500 parts), or a world (500+)?
2. OUTDOOR/INDOOR: Does this need terrain, sky, or atmosphere? Or is it an interior/object?
3. LIGHTING: Does the scene benefit from PointLights/SpotLights? Night scenes YES, simple props usually NO.
4. SCRIPTS: Did the user ask for behavior, interactivity, or game logic? If not, DON'T add scripts.
5. UI/GUI: Did the user ask for a menu, HUD, or interface? If not, DON'T add GUI elements.
6. EFFECTS: Does this need particles, fire, smoke, beams? Only if the subject calls for it (torch=yes, house=no).
7. TERRAIN: Is this outdoors on ground? Use FillBlock terrain. Floating/indoor builds skip terrain.
8. SOUND: Did the user mention audio, music, or ambient sound? If not, skip it.
9. DETAIL LEVEL: Match the user's tone. "quick castle" = 30-50 parts. "detailed realistic castle" = 150-400 parts.
10. VARIATION: If building multiples (trees, rocks, buildings), RANDOMIZE sizes, colors, rotations. Never clone identical copies.

RULES:
- If the user says "build X" with no other context, default to a DETAILED version (50-120 parts) with lighting.
- If the user says "simple X" or "quick X", build 15-30 parts with no extras.
- ALWAYS decompose into real components: a house has walls + floor + roof + door + windows + chimney, not one box.
- NEVER output a single Part as the entire build. Minimum 8 parts for the simplest prop.
- VARY materials and colors within a build. A stone wall uses 2-3 shades of grey, not one flat color.
- Position builds relative to camera spawn point (sp variable). Player should see it immediately.

Now apply the relevant specialist knowledge below:`

  return `${comprehensionLayer}

${specialistBlocks}

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
