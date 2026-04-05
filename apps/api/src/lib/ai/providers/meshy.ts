/**
 * Meshy 3D model generation client
 * Supports: text-to-3D, image-to-3D, async job polling, .fbx/.glb output
 */

const MESHY_API_BASE = 'https://api.meshy.ai/v3'

// Pricing estimates
const MESHY_PRICING = {
  'text-to-3d': 0.2,    // $0.20 per model (preview + refine)
  'image-to-3d': 0.4,   // $0.40 per model
} as const

export type MeshyJobStatus = 'PENDING' | 'IN_PROGRESS' | 'SUCCEEDED' | 'FAILED' | 'EXPIRED'
export type MeshyOutputFormat = 'fbx' | 'glb' | 'usdz' | 'obj'

export interface MeshyJobResult {
  jobId: string
  status: MeshyJobStatus
  modelUrls?: {
    fbx?: string
    glb?: string
    usdz?: string
    obj?: string
  }
  thumbnailUrl?: string
  videoUrl?: string
  polygonCount?: number
  vertexCount?: number
  costUsd: number
  durationMs: number
}

async function meshyRequest<T>(
  path: string,
  options: { method?: string; body?: unknown } = {}
): Promise<T> {
  const apiKey = process.env.MESHY_API_KEY
  if (!apiKey) throw new Error('MESHY_API_KEY not configured')

  const response = await fetch(`${MESHY_API_BASE}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Meshy API error ${response.status}: ${text}`)
  }

  return response.json() as Promise<T>
}

/**
 * Create a text-to-3D job (preview stage)
 */
export async function createTextTo3D(params: {
  prompt: string
  negativePrompt?: string
  artStyle?: 'realistic' | 'sculpture' | 'pbr' | 'voxel'
  topology?: 'quad' | 'triangle'
  targetPolycount?: number
  outputFormat?: MeshyOutputFormat
}): Promise<{ jobId: string }> {
  const result = await meshyRequest<{ result: string }>('/text-to-3d', {
    method: 'POST',
    body: {
      mode: 'preview',
      prompt: params.prompt,
      negative_prompt: params.negativePrompt ?? 'low quality, blurry, distorted',
      art_style: params.artStyle ?? 'realistic',
      topology: params.topology ?? 'quad',
      target_polycount: params.targetPolycount ?? 30000,
    },
  })
  return { jobId: result.result }
}

/**
 * Create an image-to-3D job
 */
export async function createImageTo3D(params: {
  imageUrl: string
  enablePbr?: boolean
  outputFormat?: MeshyOutputFormat
  topology?: 'quad' | 'triangle'
  targetPolycount?: number
}): Promise<{ jobId: string }> {
  const result = await meshyRequest<{ result: string }>('/image-to-3d', {
    method: 'POST',
    body: {
      image_url: params.imageUrl,
      enable_pbr: params.enablePbr ?? true,
      topology: params.topology ?? 'quad',
      target_polycount: params.targetPolycount ?? 30000,
    },
  })
  return { jobId: result.result }
}

interface MeshyJobResponse {
  id: string
  status: MeshyJobStatus
  model_urls?: {
    fbx?: string
    glb?: string
    usdz?: string
    obj?: string
  }
  thumbnail_url?: string
  video_url?: string
  polygon_count?: number
  vertex_count?: number
}

/**
 * Get job status
 */
export async function getJobStatus(jobId: string, jobType: 'text-to-3d' | 'image-to-3d'): Promise<MeshyJobResponse> {
  const path = jobType === 'text-to-3d' ? `/text-to-3d/${jobId}` : `/image-to-3d/${jobId}`
  return meshyRequest<MeshyJobResponse>(path)
}

/**
 * Poll job until completion or timeout
 * Polls every 5 seconds, times out at 10 minutes
 */
export async function pollJobToCompletion(
  jobId: string,
  jobType: 'text-to-3d' | 'image-to-3d',
  onProgress?: (status: MeshyJobStatus, progress?: number) => void
): Promise<MeshyJobResult> {
  const start = Date.now()
  const timeoutMs = 10 * 60 * 1000 // 10 minutes
  const pollIntervalMs = 5000

  while (Date.now() - start < timeoutMs) {
    const job = await getJobStatus(jobId, jobType)

    onProgress?.(job.status)

    if (job.status === 'SUCCEEDED') {
      return {
        jobId,
        status: 'SUCCEEDED',
        modelUrls: job.model_urls,
        thumbnailUrl: job.thumbnail_url,
        videoUrl: job.video_url,
        polygonCount: job.polygon_count,
        vertexCount: job.vertex_count,
        costUsd: MESHY_PRICING[jobType],
        durationMs: Date.now() - start,
      }
    }

    if (job.status === 'FAILED' || job.status === 'EXPIRED') {
      throw new Error(`Meshy job ${jobId} ended with status: ${job.status}`)
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs))
  }

  throw new Error(`Meshy job ${jobId} timed out after 10 minutes`)
}

/**
 * Full text-to-3D pipeline: create job → poll → return result
 */
export async function textTo3DComplete(
  params: Parameters<typeof createTextTo3D>[0],
  onProgress?: (status: MeshyJobStatus) => void
): Promise<MeshyJobResult> {
  const { jobId } = await createTextTo3D(params)
  return pollJobToCompletion(jobId, 'text-to-3d', onProgress)
}

/**
 * Full image-to-3D pipeline: create job → poll → return result
 */
export async function imageTo3DComplete(
  params: Parameters<typeof createImageTo3D>[0],
  onProgress?: (status: MeshyJobStatus) => void
): Promise<MeshyJobResult> {
  const { jobId } = await createImageTo3D(params)
  return pollJobToCompletion(jobId, 'image-to-3d', onProgress)
}

/**
 * Estimate cost before generation
 */
export function estimateMeshyCost(jobType: 'text-to-3d' | 'image-to-3d'): number {
  return MESHY_PRICING[jobType]
}
