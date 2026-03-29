/**
 * POST /api/ai/mesh
 *
 * Generates a 3D mesh/model from a text description.
 *
 * REAL mode  (MESHY_API_KEY set): calls Meshy API text-to-3D endpoint.
 * DEMO mode  (no key):            returns placeholder data instantly.
 *
 * Body:    { prompt: string; quality?: "draft" | "standard" | "premium" }
 * Returns: { meshUrl, thumbnailUrl, polygonCount, status, message?, taskId? }
 */

import { NextRequest, NextResponse } from 'next/server'

type Quality = 'draft' | 'standard' | 'premium'

interface MeshyTask {
  id: string
  status: string
  model_urls?: { glb?: string; fbx?: string; usdz?: string }
  thumbnail_url?: string
  polygon_count?: number
  progress?: number
}

// ── Meshy helpers ────────────────────────────────────────────────────────────

const MESHY_BASE = 'https://api.meshy.ai'

async function createMeshyTask(
  prompt: string,
  quality: Quality,
  apiKey: string,
): Promise<string> {
  const artStyle = 'realistic'
  const negativePrompt = 'low quality, blurry, distorted'

  const body = {
    mode: quality === 'draft' ? 'preview' : 'refine',
    prompt,
    art_style: artStyle,
    negative_prompt: negativePrompt,
    ...(quality === 'premium' ? { enable_pbr: true } : {}),
  }

  const res = await fetch(`${MESHY_BASE}/v2/text-to-3d`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Meshy task creation failed (${res.status}): ${err}`)
  }

  const data = (await res.json()) as { result: string }
  return data.result
}

async function pollMeshyTask(
  taskId: string,
  apiKey: string,
  maxAttempts = 30,
  intervalMs = 3_000,
): Promise<MeshyTask> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, intervalMs))

    const res = await fetch(`${MESHY_BASE}/v2/text-to-3d/${taskId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(10_000),
    })

    if (!res.ok) continue

    const task = (await res.json()) as MeshyTask

    if (task.status === 'SUCCEEDED') return task
    if (task.status === 'FAILED') throw new Error('Meshy task failed')
  }

  // Return in-progress state after exhausting poll attempts (task still running)
  return { id: taskId, status: 'IN_PROGRESS' }
}

// ── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  let prompt: string
  let quality: Quality

  try {
    const body = (await req.json()) as { prompt?: unknown; quality?: unknown }

    if (typeof body.prompt !== 'string' || !body.prompt.trim()) {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 })
    }

    prompt = body.prompt.trim()
    quality =
      body.quality === 'draft' || body.quality === 'premium'
        ? (body.quality as Quality)
        : 'standard'
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const apiKey = process.env.MESHY_API_KEY

  // ── DEMO MODE ─────────────────────────────────────────────────────────────
  if (!apiKey) {
    return NextResponse.json({
      meshUrl: null,
      thumbnailUrl: '/demo/mesh-preview.svg',
      polygonCount: null,
      status: 'demo',
      message: 'In production, this generates a real 3D model via Meshy AI',
    })
  }

  // ── REAL MODE ─────────────────────────────────────────────────────────────
  try {
    const taskId = await createMeshyTask(prompt, quality, apiKey)
    const task = await pollMeshyTask(taskId, apiKey)

    if (task.status === 'IN_PROGRESS') {
      // Generation is async and still running — return taskId so client can poll
      return NextResponse.json({
        meshUrl: null,
        thumbnailUrl: null,
        polygonCount: null,
        status: 'pending',
        taskId,
        message: '3D model is being generated. Poll /api/ai/mesh/status?taskId=' + taskId,
      })
    }

    return NextResponse.json({
      meshUrl: task.model_urls?.glb ?? task.model_urls?.fbx ?? null,
      thumbnailUrl: task.thumbnail_url ?? null,
      polygonCount: task.polygon_count ?? null,
      status: 'complete',
      taskId,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: 'Meshy generation failed', detail: message }, { status: 502 })
  }
}
