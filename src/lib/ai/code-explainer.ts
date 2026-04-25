/**
 * Code Explainer — Generates human-readable explanations of Luau code.
 *
 * When a user clicks "Explain" on generated code, this produces:
 * - Section-by-section breakdown
 * - Pattern identification (debounce, observer, state machine, etc.)
 * - Roblox API usage explanations
 * - Educational value for younger users
 */

import 'server-only'

export interface CodeExplanation {
  summary: string
  sections: ExplanationSection[]
  patterns: string[]
  apisUsed: string[]
}

export interface ExplanationSection {
  title: string
  lines: string // e.g. "1-15"
  explanation: string
}

// ─── Static explanation (no AI call needed) ──────────────────────────────────

const API_DESCRIPTIONS: Record<string, string> = {
  'DataStoreService': 'Saves and loads player data that persists between sessions',
  'ReplicatedStorage': 'Shared storage visible to both server and client — used for RemoteEvents and shared modules',
  'ServerScriptService': 'Server-only scripts — clients cannot see or access these',
  'Players': 'Manages connected players — PlayerAdded, PlayerRemoving events',
  'UserInputService': 'Detects keyboard, mouse, touch, and gamepad input (client only)',
  'RunService': 'Frame-by-frame updates — Heartbeat (server) and RenderStepped (client)',
  'TweenService': 'Smooth property animations — position, color, transparency, etc.',
  'CollectionService': 'Tag-based object grouping — useful for managing many similar objects',
  'ProximityPrompt': 'Built-in interaction system — shows "Press E" prompts near objects',
  'PathfindingService': 'AI navigation — calculates paths around obstacles for NPCs',
  'MarketplaceService': 'In-game purchases — game passes, dev products, Robux transactions',
  'TextService': 'Text filtering — REQUIRED for displaying user-generated text (Roblox policy)',
  'TeleportService': 'Teleports players between places or servers',
  'PhysicsService': 'Collision groups — control which objects can collide with each other',
  'SoundService': 'Audio management — spatial sound, music, SFX',
  'Debris': 'Auto-cleanup — destroys temporary objects after a set time',
  'ChangeHistoryService': 'Undo/redo support in Studio plugins',
  'Lighting': 'Controls time of day, ambient light, post-processing effects',
  'Workspace': 'The 3D world — all visible parts, models, and terrain live here',
}

const PATTERN_DESCRIPTIONS: Record<string, string> = {
  debounce: 'Debounce pattern — prevents an action from firing multiple times in quick succession',
  singleton: 'Singleton pattern — ensures only one instance of a system exists',
  observer: 'Observer pattern — objects react to events without tight coupling',
  'state machine': 'State machine — organizes behavior into distinct states with transitions',
  'module pattern': 'Module pattern — encapsulates functionality in a reusable ModuleScript',
  'factory': 'Factory pattern — creates objects with consistent structure',
  'connection cleanup': 'Connection cleanup — disconnects event listeners to prevent memory leaks',
}

/**
 * Generate a code explanation without an AI call (fast, deterministic).
 */
export function explainCode(code: string): CodeExplanation {
  const lines = code.split('\n')

  // Detect APIs used
  const apisUsed: string[] = []
  for (const [api, desc] of Object.entries(API_DESCRIPTIONS)) {
    if (code.includes(api)) {
      apisUsed.push(`**${api}**: ${desc}`)
    }
  }

  // Detect patterns
  const patterns: string[] = []
  if (code.includes('debounce') || (code.includes('if') && code.includes('return') && code.includes('= true'))) {
    patterns.push(PATTERN_DESCRIPTIONS.debounce)
  }
  if (code.includes('module') || code.includes('return {') || code.includes('local M = {}')) {
    patterns.push(PATTERN_DESCRIPTIONS['module pattern'])
  }
  if (code.includes(':Disconnect()') || code.includes(':Destroy()')) {
    patterns.push(PATTERN_DESCRIPTIONS['connection cleanup'])
  }
  if (code.includes('state') && (code.includes('elseif') || code.includes('== "')) ) {
    patterns.push(PATTERN_DESCRIPTIONS['state machine'])
  }

  // Build sections from code structure
  const sections: ExplanationSection[] = []
  let currentSection: { title: string; startLine: number; endLine: number } | null = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Detect section boundaries
    if (line.startsWith('-- ') && line.length > 5 && !line.startsWith('-- ') ) {
      if (currentSection) {
        sections.push({
          title: currentSection.title,
          lines: `${currentSection.startLine}-${i}`,
          explanation: generateSectionExplanation(lines.slice(currentSection.startLine - 1, i).join('\n')),
        })
      }
      currentSection = { title: line.replace(/^--+\s*/, ''), startLine: i + 1, endLine: i + 1 }
    }

    // Detect service definitions
    if (line.includes('GetService') && !currentSection) {
      currentSection = { title: 'Service Setup', startLine: i + 1, endLine: i + 1 }
    }

    // Detect function definitions
    if ((line.startsWith('local function') || line.startsWith('function')) && !currentSection) {
      const funcName = line.match(/function\s+(\w+)/)?.[1] || 'Function'
      currentSection = { title: funcName, startLine: i + 1, endLine: i + 1 }
    }
  }

  // Close last section
  if (currentSection) {
    sections.push({
      title: currentSection.title,
      lines: `${currentSection.startLine}-${lines.length}`,
      explanation: generateSectionExplanation(lines.slice(currentSection.startLine - 1).join('\n')),
    })
  }

  // If no sections detected, create a single "Overview" section
  if (sections.length === 0) {
    sections.push({
      title: 'Overview',
      lines: `1-${lines.length}`,
      explanation: generateSectionExplanation(code),
    })
  }

  // Build summary
  const scriptType = code.includes('LocalPlayer') || code.includes('UserInputService')
    ? 'LocalScript (runs on the client/player)'
    : code.includes('OnServerEvent') || code.includes('ServerScriptService')
    ? 'Script (runs on the server)'
    : code.includes('return {') || code.includes('local M = {}')
    ? 'ModuleScript (shared utility)'
    : 'Luau script'

  const summary = `This is a ${scriptType} with ${lines.length} lines. It uses ${apisUsed.length} Roblox API${apisUsed.length !== 1 ? 's' : ''}.`

  return { summary, sections, patterns, apisUsed }
}

function generateSectionExplanation(code: string): string {
  const explanations: string[] = []

  if (code.includes('GetService')) explanations.push('Sets up references to Roblox services needed by this script.')
  if (code.includes('PlayerAdded')) explanations.push('Runs code when a player joins the game.')
  if (code.includes('PlayerRemoving')) explanations.push('Runs code when a player leaves — usually for saving data.')
  if (code.includes('Heartbeat')) explanations.push('Runs every frame (60 times per second) — used for continuous updates.')
  if (code.includes('RenderStepped')) explanations.push('Runs before each frame renders — used for smooth visual effects.')
  if (code.includes('pcall')) explanations.push('Uses pcall() for error handling — catches failures without crashing.')
  if (code.includes('RemoteEvent')) explanations.push('Communicates between server and client using RemoteEvents.')
  if (code.includes('Instance.new')) explanations.push('Creates new game objects programmatically.')
  if (code.includes(':Connect(')) explanations.push('Connects to events to react when things happen in the game.')
  if (code.includes('task.wait')) explanations.push('Pauses execution for a specified duration.')
  if (code.includes(':WaitForChild')) explanations.push('Waits for a child object to load — prevents race conditions.')

  return explanations.length > 0
    ? explanations.join(' ')
    : 'This section contains game logic.'
}

/**
 * Format explanation for display in chat.
 */
export function formatExplanation(explanation: CodeExplanation): string {
  const parts: string[] = [explanation.summary, '']

  if (explanation.patterns.length > 0) {
    parts.push('**Patterns used:**')
    explanation.patterns.forEach(p => parts.push(`- ${p}`))
    parts.push('')
  }

  if (explanation.apisUsed.length > 0) {
    parts.push('**Roblox APIs:**')
    explanation.apisUsed.forEach(a => parts.push(`- ${a}`))
    parts.push('')
  }

  if (explanation.sections.length > 0) {
    parts.push('**Code breakdown:**')
    explanation.sections.forEach(s => {
      parts.push(`\n**${s.title}** (lines ${s.lines})`)
      parts.push(s.explanation)
    })
  }

  return parts.join('\n')
}
