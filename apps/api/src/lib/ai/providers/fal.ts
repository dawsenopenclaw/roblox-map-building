/**
 * Fal.ai image and texture generation client
 * Supports: Flux Pro images, PBR texture generation, batch generation
 */

const FAL_API_BASE = 'https://fal.run'
const FAL_QUEUE_BASE = 'https://queue.fal.run'

// Pricing estimates
const FAL_PRICING = {
  'flux-pro': 0.055,          // $0.055 per image (1024x1024)
  'flux-pro-ultra': 0.22,     // $0.22 per image (ultra quality)
  'stable-diffusion-xl': 0.03, // $0.03 per image
  'texture-pbr': 0.08,        // $0.08 per texture set
} as const

export type FalModel = keyof typeof FAL_PRICING

export interface FalImageResult {
  url: string
  width: number
  height: number
  contentType: string
  seed?: number
}

export interface FalGenerationResult {
  images: FalImageResult[]
  costUsd: number
  durationMs: number
  requestId: string
}

export interface FalTextureResult {
  albedo: string       // diffuse texture URL
  normal: string       // normal map URL
  roughness: string    // roughness map URL
  metallic?: string    // metallic map URL
  ao?: string          // ambient occlusion URL
  costUsd: number
  durationMs: number
}

async function falRequest<T>(
  model: string,
  input: Record<string, unknown>,
  useQueue = false
): Promise<{ output: T; requestId: string }> {
  const apiKey = process.env.FAL_KEY
  if (!apiKey) throw new Error('FAL_KEY not configured')

  const base = useQueue ? FAL_QUEUE_BASE : FAL_API_BASE
  const url = `${base}/${model}`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Key ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ input }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Fal API error ${response.status}: ${text}`)
  }

  const data = (await response.json()) as { output?: T; images?: T; request_id?: string }
  return {
    output: (data.output ?? data) as T,
    requestId: data.request_id ?? '',
  }
}

/**
 * Generate images with Flux Pro
 */
export async function generateImages(params: {
  prompt: string
  negativePrompt?: string
  width?: number
  height?: number
  numImages?: number
  seed?: number
  model?: FalModel
  steps?: number
  guidanceScale?: number
}): Promise<FalGenerationResult> {
  const {
    prompt,
    negativePrompt,
    width = 1024,
    height = 1024,
    numImages = 1,
    seed,
    model = 'flux-pro',
    steps = 28,
    guidanceScale = 3.5,
  } = params

  const start = Date.now()

  // Map model to Fal endpoint
  const modelEndpoint =
    model === 'flux-pro'
      ? 'fal-ai/flux-pro'
      : model === 'flux-pro-ultra'
      ? 'fal-ai/flux-pro/v1.1-ultra'
      : 'fal-ai/stable-diffusion-xl'

  const { output, requestId } = await falRequest<{
    images: Array<{ url: string; width: number; height: number; content_type: string }>
    seed?: number
  }>(modelEndpoint, {
    prompt,
    negative_prompt: negativePrompt,
    image_size: { width, height },
    num_images: numImages,
    seed,
    num_inference_steps: steps,
    guidance_scale: guidanceScale,
  })

  const images: FalImageResult[] = (output.images ?? []).map((img) => ({
    url: img.url,
    width: img.width,
    height: img.height,
    contentType: img.content_type ?? 'image/jpeg',
    seed: output.seed,
  }))

  return {
    images,
    costUsd: FAL_PRICING[model] * numImages,
    durationMs: Date.now() - start,
    requestId,
  }
}

/**
 * Generate PBR texture set from a prompt or source image
 */
export async function generateTextures(params: {
  prompt: string
  sourceImageUrl?: string
  resolution?: 512 | 1024 | 2048
}): Promise<FalTextureResult> {
  const { prompt, sourceImageUrl, resolution = 1024 } = params
  const start = Date.now()

  const input: Record<string, unknown> = {
    prompt,
    resolution,
    output_format: 'png',
  }
  if (sourceImageUrl) input.image_url = sourceImageUrl

  const { output } = await falRequest<{
    albedo: { url: string }
    normal: { url: string }
    roughness: { url: string }
    metallic?: { url: string }
    ao?: { url: string }
  }>('fal-ai/stable-diffusion-xl/texture', input)

  return {
    albedo: output.albedo.url,
    normal: output.normal.url,
    roughness: output.roughness.url,
    metallic: output.metallic?.url,
    ao: output.ao?.url,
    costUsd: FAL_PRICING['texture-pbr'],
    durationMs: Date.now() - start,
  }
}

/**
 * Batch generate multiple images in parallel
 * Uses Promise.allSettled for resilience
 */
export async function batchGenerateImages(
  prompts: string[],
  sharedOptions: Omit<Parameters<typeof generateImages>[0], 'prompt'> = {}
): Promise<Array<{ prompt: string; result?: FalGenerationResult; error?: string }>> {
  const results = await Promise.allSettled(
    prompts.map((prompt) => generateImages({ ...sharedOptions, prompt }))
  )

  return results.map((r, i) => ({
    prompt: prompts[i],
    result: r.status === 'fulfilled' ? r.value : undefined,
    error: r.status === 'rejected' ? String(r.reason) : undefined,
  }))
}

/**
 * Estimate generation cost before execution
 */
export function estimateFalCost(
  model: FalModel = 'flux-pro',
  numImages = 1
): { estimatedCostUsd: number; perImage: number } {
  const perImage = FAL_PRICING[model]
  return { estimatedCostUsd: perImage * numImages, perImage }
}
