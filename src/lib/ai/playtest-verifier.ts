/**
 * playtest-verifier.ts
 *
 * Verifies that a build actually created what the user asked for by checking
 * the Studio game tree returned by the plugin's get_game_tree command.
 *
 * Flow:
 *   1. generateExpectations() maps user prompt + intent → list of Expectations
 *   2. fetchGameTree() pulls the live game tree from Studio via API
 *   3. verifyExpectations() checks each expectation against the flattened tree
 *   4. Returns a VerificationResult with score, passed/failed, and warnings
 */

import 'server-only'

// ── Types ──────────────────────────────────────────────────────────────────

export interface Expectation {
  type: 'instance_exists' | 'script_loaded' | 'gui_created' | 'terrain_modified' | 'remote_exists' | 'part_count_minimum'
  path: string           // e.g., "ServerScriptService.*Shop*|*Economy*"
  description: string    // Human-readable
  critical: boolean
}

export interface VerificationResult {
  passed: Expectation[]
  failed: Expectation[]
  warnings: string[]
  score: number          // 0-100
}

/** Game tree node from Studio plugin's get_game_tree command */
interface GameTreeNode {
  name: string
  className: string
  children?: GameTreeNode[]
}

interface FlatNode {
  path: string
  className: string
}

// ── Path Matching ──────────────────────────────────────────────────────────

/**
 * Fuzzy path matcher. Pattern like "ServerScriptService.*Shop*|*Economy*"
 * is split by | for OR alternatives. Each alternative has * replaced with .*
 * and is tested as a case-insensitive regex against the full tree path.
 */
export function matchesPath(treePath: string, pattern: string): boolean {
  const alternatives = pattern.split('|')
  for (const alt of alternatives) {
    try {
      // Escape regex-special chars except *, then replace * with .*
      const escaped = alt
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
        .replace(/\*/g, '.*')
      const re = new RegExp(escaped, 'i')
      if (re.test(treePath)) return true
    } catch {
      // Invalid regex — skip this alternative
      if (treePath.toLowerCase().includes(alt.toLowerCase())) return true
    }
  }
  return false
}

// ── Tree Flattening ────────────────────────────────────────────────────────

/**
 * Recursively flatten game tree into a searchable array of {path, className}.
 * Paths are dot-separated: "Workspace.ForjeAI_Build.Part"
 */
export function flattenTree(node: GameTreeNode, parentPath?: string): FlatNode[] {
  const currentPath = parentPath ? `${parentPath}.${node.name}` : node.name
  const result: FlatNode[] = [{ path: currentPath, className: node.className }]
  if (node.children) {
    for (const child of node.children) {
      result.push(...flattenTree(child, currentPath))
    }
  }
  return result
}

// ── Expectation Generation ─────────────────────────────────────────────────

// Keyword → expectations mapping. Each entry is [keywords[], expectations[]]
const INTENT_RULES: Array<{
  keywords: string[]
  expectations: Expectation[]
}> = [
  {
    keywords: ['building', 'terrain', 'map', 'landscape', 'world', 'house', 'castle', 'city'],
    expectations: [
      {
        type: 'instance_exists',
        path: 'Workspace.*ForjeAI*|Workspace.*Build*',
        description: 'Build model exists in Workspace',
        critical: true,
      },
      {
        type: 'part_count_minimum',
        path: '20',
        description: 'At least 20 parts in the build',
        critical: true,
      },
    ],
  },
  {
    keywords: ['script', 'economy', 'shop', 'store', 'purchase', 'buy'],
    expectations: [
      {
        type: 'script_loaded',
        path: 'ServerScriptService.*Shop*|ServerScriptService.*Economy*|ServerScriptService.*Store*',
        description: 'Shop/Economy script in ServerScriptService',
        critical: true,
      },
      {
        type: 'remote_exists',
        path: 'ReplicatedStorage.*Purchase*|ReplicatedStorage.*Buy*',
        description: 'Purchase RemoteEvent exists',
        critical: false,
      },
    ],
  },
  {
    keywords: ['leaderboard', 'leaderstats', 'scoreboard'],
    expectations: [
      {
        type: 'script_loaded',
        path: 'ServerScriptService.*Leaderboard*|ServerScriptService.*leaderstats*',
        description: 'Leaderboard script in ServerScriptService',
        critical: true,
      },
    ],
  },
  {
    keywords: ['pet', 'pets'],
    expectations: [
      {
        type: 'script_loaded',
        path: 'ServerScriptService.*Pet*',
        description: 'Pet server script',
        critical: true,
      },
      {
        type: 'remote_exists',
        path: 'ReplicatedStorage.*Pet*',
        description: 'Pet RemoteEvents exist',
        critical: true,
      },
      {
        type: 'gui_created',
        path: 'StarterGui.*Pet*|StarterPlayer.*Pet*',
        description: 'Pet GUI exists',
        critical: false,
      },
    ],
  },
  {
    keywords: ['hud', 'health', 'healthbar', 'health bar'],
    expectations: [
      {
        type: 'gui_created',
        path: 'StarterGui.*Health*|StarterGui.*HUD*|StarterGui.*ScreenGui*',
        description: 'ScreenGui with health/HUD elements',
        critical: true,
      },
    ],
  },
  {
    keywords: ['combat', 'fight', 'weapon', 'sword', 'damage'],
    expectations: [
      {
        type: 'script_loaded',
        path: 'ServerScriptService.*Combat*|ServerScriptService.*Damage*|ServerScriptService.*Weapon*',
        description: 'Combat script in ServerScriptService',
        critical: true,
      },
      {
        type: 'remote_exists',
        path: 'ReplicatedStorage.*Damage*|ReplicatedStorage.*Combat*|ReplicatedStorage.*Attack*',
        description: 'Damage/Combat RemoteEvent exists',
        critical: false,
      },
    ],
  },
  {
    keywords: ['inventory', 'backpack', 'items'],
    expectations: [
      {
        type: 'script_loaded',
        path: 'ServerScriptService.*Inventory*|ServerScriptService.*Item*',
        description: 'Inventory script in ServerScriptService',
        critical: true,
      },
      {
        type: 'gui_created',
        path: 'StarterGui.*Inventory*|StarterGui.*Backpack*',
        description: 'Inventory GUI exists',
        critical: false,
      },
    ],
  },
  {
    keywords: ['npc', 'dialog', 'dialogue', 'quest'],
    expectations: [
      {
        type: 'script_loaded',
        path: 'ServerScriptService.*NPC*|ServerScriptService.*Dialog*|ServerScriptService.*Quest*',
        description: 'NPC/Dialog script exists',
        critical: true,
      },
    ],
  },
  {
    keywords: ['obby', 'obstacle', 'parkour', 'checkpoint'],
    expectations: [
      {
        type: 'instance_exists',
        path: 'Workspace.*Checkpoint*|Workspace.*Obby*|Workspace.*Stage*',
        description: 'Checkpoint/Obby parts in Workspace',
        critical: true,
      },
      {
        type: 'script_loaded',
        path: 'ServerScriptService.*Timer*|ServerScriptService.*Checkpoint*|ServerScriptService.*Obby*',
        description: 'Timer/Checkpoint script exists',
        critical: false,
      },
    ],
  },
  {
    keywords: ['tycoon', 'dropper', 'factory'],
    expectations: [
      {
        type: 'script_loaded',
        path: 'ServerScriptService.*Tycoon*|ServerScriptService.*Dropper*',
        description: 'Tycoon script in ServerScriptService',
        critical: true,
      },
      {
        type: 'instance_exists',
        path: 'Workspace.*Dropper*|Workspace.*Tycoon*|Workspace.*Conveyor*',
        description: 'Dropper/Tycoon parts in Workspace',
        critical: false,
      },
    ],
  },
]

/**
 * Maps user intent → expected outcomes using keyword matching.
 * Scans both the prompt and intent string for matching keywords.
 */
export function generateExpectations(prompt: string, intent: string): Expectation[] {
  const combined = `${prompt} ${intent}`.toLowerCase()
  const expectations: Expectation[] = []
  const seen = new Set<string>()

  for (const rule of INTENT_RULES) {
    const matched = rule.keywords.some((kw) => combined.includes(kw))
    if (matched) {
      for (const exp of rule.expectations) {
        const key = `${exp.type}:${exp.path}`
        if (!seen.has(key)) {
          seen.add(key)
          expectations.push(exp)
        }
      }
    }
  }

  // Default: at least check something exists in Workspace
  if (expectations.length === 0) {
    expectations.push({
      type: 'instance_exists',
      path: 'Workspace.*',
      description: 'Something exists in Workspace',
      critical: true,
    })
  }

  return expectations
}

// ── Verification ───────────────────────────────────────────────────────────

const BASE_PART_CLASSES = new Set([
  'Part', 'MeshPart', 'WedgePart', 'CornerWedgePart', 'TrussPart',
  'SpawnLocation', 'Seat', 'VehicleSeat', 'SkateboardPlatform', 'Terrain',
  'UnionOperation', 'NegateOperation', 'IntersectOperation',
])

/**
 * Check each expectation against the flattened game tree.
 * Score = 80% critical pass rate + 20% total pass rate.
 */
export function verifyExpectations(
  gameTree: GameTreeNode[],
  expectations: Expectation[],
): VerificationResult {
  // Flatten all root nodes
  const flat: FlatNode[] = []
  for (const root of gameTree) {
    flat.push(...flattenTree(root))
  }

  const passed: Expectation[] = []
  const failed: Expectation[] = []
  const warnings: string[] = []

  for (const exp of expectations) {
    let ok = false

    switch (exp.type) {
      case 'part_count_minimum': {
        const min = parseInt(exp.path, 10) || 1
        const count = flat.filter((n) => BASE_PART_CLASSES.has(n.className)).length
        ok = count >= min
        if (!ok) {
          warnings.push(`Part count ${count} is below minimum ${min}`)
        }
        break
      }

      case 'instance_exists':
      case 'script_loaded':
      case 'gui_created':
      case 'remote_exists':
      case 'terrain_modified': {
        ok = flat.some((n) => matchesPath(n.path, exp.path))
        break
      }

      default:
        warnings.push(`Unknown expectation type: ${(exp as Expectation).type}`)
    }

    if (ok) {
      passed.push(exp)
    } else {
      failed.push(exp)
    }
  }

  // Score: 80% critical pass rate + 20% total pass rate
  const criticalTotal = expectations.filter((e) => e.critical).length
  const criticalPassed = passed.filter((e) => e.critical).length
  const criticalRate = criticalTotal > 0 ? criticalPassed / criticalTotal : 1
  const totalRate = expectations.length > 0 ? passed.length / expectations.length : 1
  const score = Math.round(criticalRate * 80 + totalRate * 20)

  return { passed, failed, warnings, score }
}

// ── Game Tree Fetch ────────────────────────────────────────────────────────

/**
 * Fetch game tree from Studio via the execute API.
 * Returns the tree nodes or null on failure.
 */
export async function fetchGameTree(sessionId: string): Promise<GameTreeNode[] | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://forjegames.com'
    const res = await fetch(`${baseUrl}/api/studio/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        commands: [{ type: 'get_game_tree' }],
      }),
    })

    if (!res.ok) return null

    const data = await res.json() as { results?: Array<{ data?: GameTreeNode[] }> }
    const treeData = data?.results?.[0]?.data
    if (!Array.isArray(treeData)) return null

    return treeData
  } catch {
    return null
  }
}
