import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/status
 *
 * Public-facing system status endpoint. Returns a minimal, non-sensitive
 * view of component health for the public status page. Intentionally
 * strips all latency numbers, error messages, user counts, and anything
 * else that could help an attacker.
 *
 * Do NOT add internal metrics here. Use /api/admin/server-status for
 * anything that requires auth.
 */

// Cache the response at the edge for 30s to avoid hammering upstream
// providers if the status page gets heavy traffic or is auto-refreshed
// by many clients at once.
export const revalidate = 30

type ComponentState = 'operational' | 'degraded' | 'outage'

interface PublicComponent {
  id: string
  name: string
  description: string
  status: ComponentState
}

interface PublicStatusResponse {
  status: ComponentState
  updatedAt: string
  lastIncidentAt: string | null
  components: PublicComponent[]
}

/**
 * Probe an upstream provider with a short timeout. Returns a simple
 * boolean — we deliberately discard latency + error text so the public
 * endpoint never leaks that information.
 */
async function probe(url: string, headers: HeadersInit = {}): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(4000),
    })
    return res.ok
  } catch {
    return false
  }
}

/**
 * Combine N provider health booleans into a coarse status.
 * - all healthy → operational
 * - some healthy → degraded
 * - none healthy (but at least one was checked) → outage
 * - nothing checked → operational (nothing to fail)
 */
function rollup(checks: (boolean | null)[]): ComponentState {
  const active = checks.filter((c): c is boolean => c !== null)
  if (active.length === 0) return 'operational'
  const healthy = active.filter(Boolean).length
  if (healthy === active.length) return 'operational'
  if (healthy === 0) return 'outage'
  return 'degraded'
}

/**
 * Check a single provider only if it's configured. Returns null if the
 * provider is not enabled in this environment (so it doesn't drag the
 * rollup into "outage").
 */
async function checkIfConfigured(
  envKey: string,
  check: () => Promise<boolean>
): Promise<boolean | null> {
  if (!process.env[envKey]) return null
  try {
    return await check()
  } catch {
    return false
  }
}

export async function GET() {
  // --- Database ---
  let dbHealthy = true
  try {
    await db.$queryRawUnsafe('SELECT 1')
  } catch {
    dbHealthy = false
  }

  // --- AI text providers ---
  // Fan out the four provider probes in parallel. Previously these were
  // four sequential `await`s, which compounded the 4s probe timeout into
  // a worst-case ~16s response for the status page.
  const [anthropic, gemini, openai, groq] = await Promise.all([
    checkIfConfigured('ANTHROPIC_API_KEY', () =>
      probe('https://api.anthropic.com/v1/models', {
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      })
    ),
    checkIfConfigured('GEMINI_API_KEY', () =>
      probe(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
      )
    ),
    checkIfConfigured('OPENAI_API_KEY', () =>
      probe('https://api.openai.com/v1/models', {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      })
    ),
    checkIfConfigured('GROQ_API_KEY', () =>
      probe('https://api.groq.com/openai/v1/models', {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      })
    ),
  ])

  const aiGeneration = rollup([anthropic, gemini, openai, groq])

  // --- Image generation (Fal / OpenAI images) ---
  // We don't hit a paid image endpoint, we just confirm a key exists.
  // If you want true liveness, add a cheap HEAD probe here later.
  const imageGeneration: ComponentState =
    process.env.FAL_KEY || process.env.OPENAI_API_KEY ? 'operational' : 'outage'

  // --- 3D generation (Meshy) ---
  const threeDGeneration: ComponentState = process.env.MESHY_API_KEY
    ? 'operational'
    : 'outage'

  // --- Studio plugin bridge ---
  // The plugin bridge is considered operational if we can query the
  // session store without throwing. We don't expose connection counts.
  let studioBridge: ComponentState = 'operational'
  try {
    const { listSessions } = await import('@/lib/studio-session')
    await listSessions()
  } catch {
    studioBridge = 'outage'
  }

  // --- Database component ---
  const database: ComponentState = dbHealthy ? 'operational' : 'outage'

  // --- Web app ---
  // If this handler is running at all, the web tier is up.
  const webApp: ComponentState = 'operational'

  const components: PublicComponent[] = [
    {
      id: 'web',
      name: 'Web Application',
      description: 'forjegames.com and the in-browser editor',
      status: webApp,
    },
    {
      id: 'ai-generation',
      name: 'AI Generation',
      description: 'Claude, Gemini, Groq, and OpenAI text generation',
      status: aiGeneration,
    },
    {
      id: 'database',
      name: 'Database',
      description: 'Primary Postgres datastore',
      status: database,
    },
    {
      id: 'studio-sync',
      name: 'Studio Plugin Sync',
      description: 'HTTP queue between the web editor and Roblox Studio plugin (/api/studio/sync)',
      status: studioBridge,
    },
    {
      id: 'image-generation',
      name: 'Image Generation',
      description: 'Texture and concept art via Fal.ai and OpenAI',
      status: imageGeneration,
    },
    {
      id: '3d-generation',
      name: '3D Generation',
      description: 'Mesh, prop, and character generation via Meshy',
      status: threeDGeneration,
    },
  ]

  // Overall rollup: worst component wins.
  let overall: ComponentState = 'operational'
  for (const c of components) {
    if (c.status === 'outage') {
      overall = 'outage'
      break
    }
    if (c.status === 'degraded') overall = 'degraded'
  }

  // Last incident timestamp. For now we read from an env var so ops can
  // manually set it without a migration. A future iteration can pull from
  // a dedicated Incident table.
  const lastIncidentAt = process.env.LAST_INCIDENT_AT || null

  const body: PublicStatusResponse = {
    status: overall,
    updatedAt: new Date().toISOString(),
    lastIncidentAt,
    components,
  }

  return NextResponse.json(body, {
    headers: {
      // Allow CDNs to cache for 30s and serve stale for another 30s while
      // revalidating in the background. Keeps provider-probe fan-out low.
      'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=30',
    },
  })
}
