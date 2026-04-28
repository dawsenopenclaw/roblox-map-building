/**
 * Persistent user memory & multi-turn game state tracking.
 *
 * Stores user preferences (theme, style, etc.) learned from conversation
 * and tracks game project state across build phases.
 *
 * Uses raw SQL via Prisma (same pattern as studio-queue-pg.ts).
 * Tables auto-created on first use — no migration needed.
 */

import { getDb } from '../db'

// ── Types ───────────────────────────────────────────────────────────────────

export interface GameState {
  projectName: string
  gameType: string | null
  theme: string | null
  phases: string[]
  completedPhases: string[]
  totalParts: number
  stylePreferences: Record<string, string>
  conversationSummary: string
}

// ── Auto-create tables ──────────────────────────────────────────────────────

let _tablesReady = false

async function ensureTables(): Promise<void> {
  if (_tablesReady) return
  const db = getDb()
  try {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS user_memory (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT now(),
        UNIQUE(user_id, key)
      )
    `)
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS game_project (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        session_id TEXT NOT NULL,
        project_name TEXT DEFAULT 'Untitled Game',
        game_type TEXT,
        theme TEXT,
        phases JSONB DEFAULT '[]',
        completed_phases JSONB DEFAULT '[]',
        total_parts INT DEFAULT 0,
        style_preferences JSONB DEFAULT '{}',
        conversation_summary TEXT DEFAULT '',
        updated_at TIMESTAMPTZ DEFAULT now(),
        UNIQUE(user_id, session_id)
      )
    `)
    await db.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_user_memory_user ON user_memory(user_id)
    `)
    await db.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_game_project_user ON game_project(user_id)
    `)
    _tablesReady = true
  } catch (err) {
    console.error('[user-memory] Failed to create tables:', err instanceof Error ? err.message : err)
  }
}

// ── User Preference Memory ──────────────────────────────────────────────────

/**
 * Save a preference learned from conversation (upsert).
 */
export async function saveUserPreference(
  userId: string,
  key: string,
  value: string,
): Promise<void> {
  await ensureTables()
  const db = getDb()
  try {
    await db.$executeRawUnsafe(
      `INSERT INTO user_memory (user_id, key, value, updated_at)
       VALUES ($1, $2, $3, now())
       ON CONFLICT (user_id, key)
       DO UPDATE SET value = $3, updated_at = now()`,
      userId,
      key,
      value,
    )
  } catch (err) {
    console.warn('[user-memory] saveUserPreference failed:', err instanceof Error ? err.message : err)
  }
}

/**
 * Get all preferences for a user.
 */
export async function getUserPreferences(
  userId: string,
): Promise<Record<string, string>> {
  await ensureTables()
  const db = getDb()
  try {
    const rows = await db.$queryRawUnsafe<Array<{ key: string; value: string }>>(
      `SELECT key, value FROM user_memory WHERE user_id = $1 ORDER BY updated_at DESC`,
      userId,
    )
    const prefs: Record<string, string> = {}
    for (const row of rows) {
      prefs[row.key] = row.value
    }
    return prefs
  } catch (err) {
    console.warn('[user-memory] getUserPreferences failed:', err instanceof Error ? err.message : err)
    return {}
  }
}

// ── Game Project State ──────────────────────────────────────────────────────

/**
 * Save the current game project state (upsert).
 */
export async function saveGameState(
  userId: string,
  sessionId: string,
  state: GameState,
): Promise<void> {
  await ensureTables()
  const db = getDb()
  try {
    await db.$executeRawUnsafe(
      `INSERT INTO game_project (user_id, session_id, project_name, game_type, theme,
         phases, completed_phases, total_parts, style_preferences, conversation_summary, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8, $9::jsonb, $10, now())
       ON CONFLICT (user_id, session_id)
       DO UPDATE SET
         project_name = $3,
         game_type = $4,
         theme = $5,
         phases = $6::jsonb,
         completed_phases = $7::jsonb,
         total_parts = $8,
         style_preferences = $9::jsonb,
         conversation_summary = $10,
         updated_at = now()`,
      userId,
      sessionId,
      state.projectName,
      state.gameType ?? null,
      state.theme ?? null,
      JSON.stringify(state.phases),
      JSON.stringify(state.completedPhases),
      state.totalParts,
      JSON.stringify(state.stylePreferences),
      state.conversationSummary,
    )
  } catch (err) {
    console.warn('[user-memory] saveGameState failed:', err instanceof Error ? err.message : err)
  }
}

/**
 * Load the current game project state.
 */
export async function loadGameState(
  userId: string,
  sessionId: string,
): Promise<GameState | null> {
  await ensureTables()
  const db = getDb()
  try {
    const rows = await db.$queryRawUnsafe<Array<{
      project_name: string
      game_type: string | null
      theme: string | null
      phases: string | object
      completed_phases: string | object
      total_parts: number
      style_preferences: string | object
      conversation_summary: string
    }>>(
      `SELECT project_name, game_type, theme, phases, completed_phases,
              total_parts, style_preferences, conversation_summary
       FROM game_project WHERE user_id = $1 AND session_id = $2 LIMIT 1`,
      userId,
      sessionId,
    )
    if (rows.length === 0) return null
    const row = rows[0]
    return {
      projectName: row.project_name,
      gameType: row.game_type,
      theme: row.theme,
      phases: typeof row.phases === 'string' ? JSON.parse(row.phases) : (row.phases as string[]),
      completedPhases: typeof row.completed_phases === 'string' ? JSON.parse(row.completed_phases) : (row.completed_phases as string[]),
      totalParts: Number(row.total_parts),
      stylePreferences: typeof row.style_preferences === 'string' ? JSON.parse(row.style_preferences) : (row.style_preferences as Record<string, string>),
      conversationSummary: row.conversation_summary,
    }
  } catch (err) {
    console.warn('[user-memory] loadGameState failed:', err instanceof Error ? err.message : err)
    return null
  }
}

// ── Prompt Formatting ───────────────────────────────────────────────────────

/**
 * Format preferences as context for the AI prompt.
 */
export async function formatPreferencesForPrompt(
  userId: string,
): Promise<string> {
  const prefs = await getUserPreferences(userId)
  const entries = Object.entries(prefs)
  if (entries.length === 0) return ''

  const lines = entries.map(([key, value]) => `- ${key}: ${value}`)
  return `\nUSER PREFERENCES (learned from past conversations — respect these unless overridden):\n${lines.join('\n')}\n`
}

/**
 * Format game state as continuation context for the AI prompt.
 */
export function formatGameStateForPrompt(state: GameState): string {
  const parts: string[] = []
  parts.push(`CONTINUING GAME PROJECT: "${state.projectName}"`)
  if (state.gameType) parts.push(`Type: ${state.gameType}`)
  if (state.theme) parts.push(`Theme: ${state.theme}`)
  if (state.completedPhases.length > 0) {
    parts.push(`ALREADY BUILT: ${state.completedPhases.join(', ')}`)
  }
  if (state.phases.length > state.completedPhases.length) {
    const nextIdx = state.completedPhases.length
    parts.push(`NOW BUILD: ${state.phases[nextIdx]}`)
  }
  if (state.totalParts > 0) {
    parts.push(`Parts placed so far: ${state.totalParts}`)
  }
  parts.push('Build on top of what already exists — do NOT rebuild previous phases.')
  return '\n' + parts.join('\n') + '\n'
}

// ── Preference Extraction ───────────────────────────────────────────────────

interface ExtractedPreference {
  key: string
  value: string
}

/**
 * Extract user preferences from a message using simple pattern matching.
 * Returns an array of preferences to save. Fast — no AI call.
 */
export function extractPreferencesFromMessage(message: string): ExtractedPreference[] {
  const prefs: ExtractedPreference[] = []
  const lower = message.toLowerCase()

  // "I like [theme/style]" patterns
  const likeMatch = lower.match(/i (?:like|love|prefer|enjoy|want)\s+(?:a?\s*)?(?:the\s+)?(medieval|modern|futuristic|sci-?fi|fantasy|rustic|japanese|pirate|western|tropical|underwater|space|steampunk|gothic|victorian|art deco|minimalist|cozy|dark|bright|colorful|neon|retro|vintage|cyberpunk|fairy tale|enchanted|spooky|haunted|cartoon|realistic|anime|pixel|voxel|low poly|industrial|tropical)\b/)
  if (likeMatch) {
    prefs.push({ key: 'Preferred theme', value: likeMatch[1] })
  }

  // "my style is [style]"
  const styleMatch = lower.match(/my (?:style|aesthetic|vibe) is\s+(.{3,40})(?:\.|,|$)/i)
  if (styleMatch) {
    prefs.push({ key: 'Style', value: styleMatch[1].trim() })
  }

  // "make it [style]" — style preference
  const makeItMatch = lower.match(/make (?:it|everything|things|builds?)\s+(medieval|modern|futuristic|sci-?fi|fantasy|rustic|japanese|pirate|western|tropical|underwater|space|steampunk|gothic|victorian|minimalist|cozy|dark|bright|colorful|neon|retro|cyberpunk|realistic|anime|cartoon|spooky|industrial)\b/)
  if (makeItMatch) {
    prefs.push({ key: 'Preferred theme', value: makeItMatch[1] })
  }

  // Color preferences
  const colorPref = lower.match(/(?:i (?:like|love|prefer|want)|my (?:favorite|fav) color is|use)\s+(red|blue|green|yellow|purple|orange|pink|black|white|gold|silver|brown|cyan|teal|navy|crimson|emerald)\b.*(?:color|theme|scheme|palette)?/)
  if (colorPref) {
    prefs.push({ key: 'Preferred color', value: colorPref[1] })
  }

  // Material preferences
  const matPref = lower.match(/(?:i (?:like|love|prefer)|use)\s+(wood(?:en)?|stone|brick|metal(?:lic)?|glass|marble|concrete|crystal|obsidian)\b.*(?:material|texture)?/)
  if (matPref) {
    prefs.push({ key: 'Preferred material', value: matPref[1] })
  }

  // Game type preference
  const gamePref = lower.match(/(?:i (?:like|love|prefer|play|enjoy|want to (?:make|build)|(?:'?m|am) (?:making|building)))\s+(?:a?\s*)?(rpg|obby|tycoon|simulator|horror|battle royale|racing|survival|tower defense|roleplay|adventure|puzzle|fighting|fps|mmo|sandbox)\b/i)
  if (gamePref) {
    prefs.push({ key: 'Preferred game type', value: gamePref[1] })
  }

  // Detail level
  const detailMatch = lower.match(/(?:i (?:like|want|prefer))\s+(?:very\s+)?(?:detailed|simple|minimal|complex|realistic|low.?poly|high.?poly)\b/)
  if (detailMatch) {
    const detail = detailMatch[0].replace(/^i (?:like|want|prefer)\s+/, '').trim()
    prefs.push({ key: 'Detail preference', value: detail })
  }

  // Interior preference
  if (/(?:i (?:like|want|prefer|always want)|make sure (?:to )?(?:include|add))\s+(?:interiors?|furniture|furnished|rooms? inside)/.test(lower)) {
    prefs.push({ key: 'Interior preference', value: 'always include interiors and furniture' })
  }

  // Lighting preference
  const lightPref = lower.match(/(?:i (?:like|prefer|want))\s+(?:warm|cool|dark|bright|moody|sunset|sunrise|neon|dim|dramatic)\s+lighting/)
  if (lightPref) {
    const lightStyle = lightPref[0].replace(/^i (?:like|prefer|want)\s+/, '').trim()
    prefs.push({ key: 'Lighting preference', value: lightStyle })
  }

  return prefs
}

/**
 * Extract game state updates from a build response.
 * Detects phase completions and part counts.
 */
export function extractGameStateFromResponse(
  response: string,
  currentState: GameState | null,
  partCount?: number,
): Partial<GameState> {
  const updates: Partial<GameState> = {}

  // Detect phase completion
  const phaseComplete = response.match(/Phase\s+(\d+)\s+(?:complete|done|finished|built)/i)
  if (phaseComplete && currentState) {
    const phaseNum = parseInt(phaseComplete[1], 10)
    const phaseName = currentState.phases[phaseNum - 1]
    if (phaseName && !currentState.completedPhases.includes(phaseName)) {
      updates.completedPhases = [...currentState.completedPhases, phaseName]
    }
  }

  // Track total parts
  if (partCount && partCount > 0) {
    updates.totalParts = (currentState?.totalParts ?? 0) + partCount
  }

  return updates
}

/**
 * Extract game plan phases from a gameplan response.
 */
export function extractPhasesFromPlan(planText: string): string[] {
  const phases: string[] = []
  const phaseMatches = planText.matchAll(/\*?\*?Phase\s+\d+[:\s]+(.+?)(?:\*?\*?\s*\(|$)/gim)
  for (const match of phaseMatches) {
    const phaseName = match[1].replace(/\*+/g, '').trim()
    if (phaseName) phases.push(phaseName)
  }
  return phases
}

/**
 * Extract game type and theme from a gameplan response.
 */
export function extractGameInfoFromPlan(planText: string): { gameType: string | null; theme: string | null; projectName: string } {
  let gameType: string | null = null
  let theme: string | null = null
  let projectName = 'Untitled Game'

  // "GAME PLAN: [Name]"
  const nameMatch = planText.match(/GAME PLAN:\s*(.+?)(?:\n|\*|$)/i)
  if (nameMatch) {
    projectName = nameMatch[1].replace(/\*+/g, '').trim()
  }

  // "Type: [type]"
  const typeMatch = planText.match(/Type:\s*([^|*\n]+)/i)
  if (typeMatch) {
    gameType = typeMatch[1].trim()
  }

  // "Theme: [theme]"
  const themeMatch = planText.match(/Theme:\s*([^|*\n]+)/i)
  if (themeMatch) {
    theme = themeMatch[1].trim()
  }

  return { gameType, theme, projectName }
}
