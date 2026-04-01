/**
 * Shared Meshy AI helpers.
 *
 * Extracted from src/app/api/ai/3d-generate/route.ts so the worker process
 * can import them without pulling in Next.js route infrastructure.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export interface MeshyTask {
  id: string
  status: 'PENDING' | 'IN_PROGRESS' | 'SUCCEEDED' | 'FAILED' | 'EXPIRED'
  model_urls?: { glb?: string; fbx?: string; obj?: string }
  thumbnail_url?: string
  polygon_count?: number
  vertex_count?: number
  progress?: number
}

export interface DownloadedMesh {
  buffer: Buffer
  url: string
  format: 'glb' | 'fbx' | 'obj'
}

// ── Constants ─────────────────────────────────────────────────────────────────

const MESHY_BASE = 'https://api.meshy.ai'

function getApiKey(): string {
  const key = process.env.MESHY_API_KEY
  if (!key) throw new Error('MESHY_API_KEY is not configured')
  return key
}

// ── createMeshyTask ───────────────────────────────────────────────────────────

/**
 * Submits a text-to-3D task to Meshy and returns the task ID.
 */
export async function createMeshyTask(params: {
  prompt: string
  polyTarget: number
  artStyle: string
  apiKey?: string
}): Promise<string> {
  const apiKey = params.apiKey ?? getApiKey()

  const res = await fetch(`${MESHY_BASE}/v2/text-to-3d`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      mode:             'preview',
      prompt:           params.prompt,
      negative_prompt:  'low quality, blurry, distorted, floating parts, disconnected mesh, NSFW',
      art_style:        params.artStyle,
      topology:         'quad',
      target_polycount: params.polyTarget,
    }),
    signal: AbortSignal.timeout(15_000),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Meshy task creation failed (${res.status}): ${err}`)
  }

  const data = (await res.json()) as { result: string }
  return data.result
}

// ── pollMeshyTask ─────────────────────────────────────────────────────────────

/**
 * Polls a Meshy task until it succeeds, fails, or hits maxAttempts.
 *
 * Returns the task object. Caller should check `task.status` —
 * it will be 'SUCCEEDED' on completion, 'IN_PROGRESS' if polling timed out.
 */
export async function pollMeshyTask(params: {
  taskId: string
  apiKey?: string
  maxAttempts?: number
  intervalMs?: number
  onProgress?: (progress: number) => void
}): Promise<MeshyTask> {
  const {
    taskId,
    maxAttempts = 35,
    intervalMs  = 4_000,
    onProgress,
  } = params
  const apiKey = params.apiKey ?? getApiKey()

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise<void>((r) => setTimeout(r, i === 0 ? 3_000 : intervalMs))

    const res = await fetch(`${MESHY_BASE}/v2/text-to-3d/${taskId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal:  AbortSignal.timeout(10_000),
    })

    if (!res.ok) continue

    const task = (await res.json()) as MeshyTask

    if (onProgress && typeof task.progress === 'number') {
      onProgress(task.progress)
    }

    if (task.status === 'SUCCEEDED') return task

    if (task.status === 'FAILED' || task.status === 'EXPIRED') {
      throw new Error(`Meshy task ${taskId} ended with status: ${task.status}`)
    }
  }

  // Return partial — caller treats status 'IN_PROGRESS' as still-running
  return { id: taskId, status: 'IN_PROGRESS' }
}

// ── downloadMeshyAsset ────────────────────────────────────────────────────────

/**
 * Downloads the GLB (preferred) or FBX/OBJ fallback from a completed Meshy task.
 * Returns the file buffer and the source URL.
 */
export async function downloadMeshyAsset(task: MeshyTask): Promise<DownloadedMesh> {
  const urls = task.model_urls
  if (!urls) throw new Error(`Meshy task ${task.id} has no model_urls`)

  let url: string | undefined
  let format: 'glb' | 'fbx' | 'obj'

  if (urls.glb) {
    url    = urls.glb
    format = 'glb'
  } else if (urls.fbx) {
    url    = urls.fbx
    format = 'fbx'
  } else if (urls.obj) {
    url    = urls.obj
    format = 'obj'
  } else {
    throw new Error(`Meshy task ${task.id} has no downloadable model URL`)
  }

  const res = await fetch(url, { signal: AbortSignal.timeout(60_000) })

  if (!res.ok) {
    throw new Error(`Failed to download mesh from ${url} (${res.status})`)
  }

  const arrayBuffer = await res.arrayBuffer()
  return { buffer: Buffer.from(arrayBuffer), url, format }
}
