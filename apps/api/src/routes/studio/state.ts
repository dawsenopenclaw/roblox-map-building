/**
 * Studio game-state sync
 * GET  /api/studio/state  — returns current game object tree
 * State is populated by POST /api/studio/update (existing route in studio.ts)
 * which pushes StudioChange records into Redis.
 */

import { Hono } from 'hono'
import { requireAuth } from '../../middleware/auth'
import { redis } from '../../lib/redis'

export const stateRoutes = new Hono()

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface TerrainState {
  material?: string
  size?: { x: number; y: number; z: number }
  [key: string]: unknown
}

export interface GameObjectNode {
  id: string
  name: string
  className: string
  position?: { x: number; y: number; z: number }
  size?: { x: number; y: number; z: number }
  properties?: Record<string, unknown>
  children?: GameObjectNode[]
}

export interface GameState {
  workspace: {
    terrain: TerrainState
    buildings: GameObjectNode[]
    npcs: GameObjectNode[]
    scripts: GameObjectNode[]
    ui: GameObjectNode[]
    other: GameObjectNode[]
  }
  capturedAt: number | null
  connected: boolean
}

// ---------------------------------------------------------------------------
// Redis key
// ---------------------------------------------------------------------------
function gameStateKey(userId: string): string {
  return `studio:state:${userId}`
}

// ---------------------------------------------------------------------------
// Auth on all routes
// ---------------------------------------------------------------------------
stateRoutes.use('*', requireAuth)

// ---------------------------------------------------------------------------
// GET /api/studio/state
// Returns the last-known game state for the authenticated user.
// Falls back to an empty scaffold when no state has been pushed yet.
// ---------------------------------------------------------------------------
stateRoutes.get('/', async (c) => {
  const userId = c.get('userId') as string

  let raw: string | null = null

  try {
    raw = await redis.get(gameStateKey(userId))
  } catch (err) {
    console.error('[studio/state] Redis read error:', err)
  }

  if (!raw) {
    // Return an empty scaffold — frontend shows demo data when connected=false
    const empty: GameState = {
      workspace: {
        terrain: {},
        buildings: [],
        npcs: [],
        scripts: [],
        ui: [],
        other: [],
      },
      capturedAt: null,
      connected: false,
    }
    return c.json(empty, 200)
  }

  try {
    const state = JSON.parse(raw) as GameState
    return c.json(state, 200)
  } catch {
    return c.json({ error: 'Corrupted state data' }, 500)
  }
})

// ---------------------------------------------------------------------------
// POST /api/studio/state (internal helper used by studio.ts update handler)
// Overwrites the stored game state for a user.
// ---------------------------------------------------------------------------
export async function persistGameState(userId: string, state: GameState): Promise<void> {
  const key = gameStateKey(userId)
  await redis.set(key, JSON.stringify(state), 'EX', 3600)
}
