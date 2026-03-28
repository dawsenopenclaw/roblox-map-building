/**
 * Quality validation gates for AI-generated content
 * Checks polygon count, image artifacts, confidence thresholds
 * Auto-retries with enhanced prompts on failure
 */

import type { MeshyJobResult } from './providers/meshy'
import type { FalGenerationResult } from './providers/fal'

export type QualityStatus = 'PASS' | 'FAIL' | 'WARN'

export interface QualityCheckResult {
  status: QualityStatus
  checks: QualityCheck[]
  score: number // 0-1
  shouldRetry: boolean
  enhancedPrompt?: string
  failReasons: string[]
  warnReasons: string[]
}

export interface QualityCheck {
  name: string
  status: QualityStatus
  value?: number | string
  threshold?: number | string
  message: string
}

// Thresholds
const MAX_POLYGON_COUNT = 50_000      // Roblox performance limit
const WARN_POLYGON_COUNT = 30_000     // Warn if above this
const MIN_CONFIDENCE = 0.75           // Min transcript confidence
const ARTIFACT_SCORE_THRESHOLD = 0.3  // Max acceptable artifact score
const MIN_IMAGE_RESOLUTION = 256      // Min image dimension in pixels

/**
 * Validate a 3D model from Meshy
 */
export function validate3DModel(result: MeshyJobResult): QualityCheckResult {
  const checks: QualityCheck[] = []
  const failReasons: string[] = []
  const warnReasons: string[] = []

  // Check polygon count
  const polyCount = result.polygonCount ?? 0
  if (polyCount > MAX_POLYGON_COUNT) {
    checks.push({
      name: 'polygon-count',
      status: 'FAIL',
      value: polyCount,
      threshold: MAX_POLYGON_COUNT,
      message: `Polygon count ${polyCount} exceeds Roblox limit of ${MAX_POLYGON_COUNT}`,
    })
    failReasons.push(`Too many polygons: ${polyCount} (max ${MAX_POLYGON_COUNT})`)
  } else if (polyCount > WARN_POLYGON_COUNT) {
    checks.push({
      name: 'polygon-count',
      status: 'WARN',
      value: polyCount,
      threshold: WARN_POLYGON_COUNT,
      message: `Polygon count ${polyCount} is high — may impact performance`,
    })
    warnReasons.push(`High polygon count: ${polyCount}`)
  } else {
    checks.push({
      name: 'polygon-count',
      status: 'PASS',
      value: polyCount,
      message: `Polygon count ${polyCount} is within limits`,
    })
  }

  // Check output URLs exist
  const hasOutput = Boolean(result.modelUrls?.glb || result.modelUrls?.fbx)
  checks.push({
    name: 'output-urls',
    status: hasOutput ? 'PASS' : 'FAIL',
    message: hasOutput ? 'Model output URLs present' : 'No model output URLs returned',
  })
  if (!hasOutput) failReasons.push('Missing model output files')

  const failCount = checks.filter((c) => c.status === 'FAIL').length
  const warnCount = checks.filter((c) => c.status === 'WARN').length
  const score = 1 - (failCount * 0.5 + warnCount * 0.1)

  return {
    status: failCount > 0 ? 'FAIL' : warnCount > 0 ? 'WARN' : 'PASS',
    checks,
    score: Math.max(0, score),
    shouldRetry: failCount > 0,
    enhancedPrompt: failCount > 0
      ? buildEnhanced3DPrompt(polyCount)
      : undefined,
    failReasons,
    warnReasons,
  }
}

/**
 * Validate an image generation result from Fal
 */
export function validateImageResult(result: FalGenerationResult): QualityCheckResult {
  const checks: QualityCheck[] = []
  const failReasons: string[] = []
  const warnReasons: string[] = []

  // Check at least one image returned
  if (!result.images || result.images.length === 0) {
    checks.push({
      name: 'image-count',
      status: 'FAIL',
      message: 'No images returned from generation',
    })
    failReasons.push('No images generated')
    return { status: 'FAIL', checks, score: 0, shouldRetry: true, failReasons, warnReasons }
  }

  // Check image dimensions
  for (const image of result.images) {
    const minDim = Math.min(image.width, image.height)
    if (minDim < MIN_IMAGE_RESOLUTION) {
      checks.push({
        name: 'resolution',
        status: 'FAIL',
        value: minDim,
        threshold: MIN_IMAGE_RESOLUTION,
        message: `Image resolution ${image.width}x${image.height} too low`,
      })
      failReasons.push(`Low resolution: ${image.width}x${image.height}`)
    } else {
      checks.push({
        name: 'resolution',
        status: 'PASS',
        value: minDim,
        message: `Image resolution ${image.width}x${image.height} acceptable`,
      })
    }

    // Check image URL is present
    if (!image.url) {
      checks.push({ name: 'url', status: 'FAIL', message: 'Image URL missing' })
      failReasons.push('Missing image URL')
    } else {
      checks.push({ name: 'url', status: 'PASS', message: 'Image URL present' })
    }
  }

  const failCount = checks.filter((c) => c.status === 'FAIL').length
  const warnCount = checks.filter((c) => c.status === 'WARN').length
  const score = 1 - (failCount * 0.5 + warnCount * 0.1)

  return {
    status: failCount > 0 ? 'FAIL' : warnCount > 0 ? 'WARN' : 'PASS',
    checks,
    score: Math.max(0, score),
    shouldRetry: failCount > 0,
    failReasons,
    warnReasons,
  }
}

/**
 * Validate a transcript from Deepgram
 */
export function validateTranscript(transcript: string, confidence: number): QualityCheckResult {
  const checks: QualityCheck[] = []
  const failReasons: string[] = []
  const warnReasons: string[] = []

  // Check confidence score
  if (confidence < MIN_CONFIDENCE) {
    checks.push({
      name: 'confidence',
      status: 'FAIL',
      value: confidence,
      threshold: MIN_CONFIDENCE,
      message: `Transcription confidence ${(confidence * 100).toFixed(1)}% below ${MIN_CONFIDENCE * 100}% threshold`,
    })
    failReasons.push(`Low confidence: ${(confidence * 100).toFixed(1)}%`)
  } else {
    checks.push({
      name: 'confidence',
      status: 'PASS',
      value: confidence,
      message: `Transcription confidence ${(confidence * 100).toFixed(1)}% is acceptable`,
    })
  }

  // Check transcript has content
  const wordCount = transcript.trim().split(/\s+/).length
  if (wordCount < 2) {
    checks.push({
      name: 'content',
      status: 'FAIL',
      value: wordCount,
      message: 'Transcript too short — likely empty audio or noise',
    })
    failReasons.push('Transcript too short')
  } else {
    checks.push({
      name: 'content',
      status: 'PASS',
      value: wordCount,
      message: `${wordCount} words transcribed`,
    })
  }

  const failCount = checks.filter((c) => c.status === 'FAIL').length
  const warnCount = checks.filter((c) => c.status === 'WARN').length
  const score = 1 - (failCount * 0.5 + warnCount * 0.1)

  return {
    status: failCount > 0 ? 'FAIL' : warnCount > 0 ? 'WARN' : 'PASS',
    checks,
    score: Math.max(0, score),
    shouldRetry: failCount > 0,
    failReasons,
    warnReasons,
  }
}

/**
 * Validate Claude-generated game commands/layouts
 */
export function validateAIResponse(
  response: string,
  expectedType: 'json' | 'commands' | 'layout'
): QualityCheckResult {
  const checks: QualityCheck[] = []
  const failReasons: string[] = []
  const warnReasons: string[] = []

  // Check non-empty
  if (!response.trim()) {
    checks.push({ name: 'content', status: 'FAIL', message: 'Empty AI response' })
    failReasons.push('Empty response')
    return { status: 'FAIL', checks, score: 0, shouldRetry: true, failReasons, warnReasons }
  }

  // Check JSON validity if expected
  if (expectedType === 'json' || expectedType === 'commands') {
    try {
      JSON.parse(response)
      checks.push({ name: 'json-valid', status: 'PASS', message: 'Valid JSON response' })
    } catch {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = response.match(/```(?:json)?\s*([\s\S]+?)```/)
      if (jsonMatch) {
        try {
          JSON.parse(jsonMatch[1])
          checks.push({ name: 'json-valid', status: 'WARN', message: 'JSON in code block — needs extraction' })
          warnReasons.push('JSON wrapped in code block')
        } catch {
          checks.push({ name: 'json-valid', status: 'FAIL', message: 'Invalid JSON in response' })
          failReasons.push('Invalid JSON format')
        }
      } else {
        checks.push({ name: 'json-valid', status: 'FAIL', message: 'Response is not valid JSON' })
        failReasons.push('Non-JSON response when JSON expected')
      }
    }
  }

  // Check minimum length
  const charCount = response.length
  if (charCount < 50) {
    checks.push({ name: 'length', status: 'WARN', value: charCount, message: 'Response is very short' })
    warnReasons.push('Short response')
  } else {
    checks.push({ name: 'length', status: 'PASS', value: charCount, message: `Response length ${charCount} chars` })
  }

  const failCount = checks.filter((c) => c.status === 'FAIL').length
  const warnCount = checks.filter((c) => c.status === 'WARN').length
  const score = 1 - (failCount * 0.5 + warnCount * 0.1)

  return {
    status: failCount > 0 ? 'FAIL' : warnCount > 0 ? 'WARN' : 'PASS',
    checks,
    score: Math.max(0, score),
    shouldRetry: failCount > 0,
    enhancedPrompt: failCount > 0 ? buildEnhancedTextPrompt() : undefined,
    failReasons,
    warnReasons,
  }
}

/**
 * Retry a generation with quality gating — up to 2 retries
 */
export async function withQualityGate<TInput, TResult>(
  fn: (input: TInput) => Promise<TResult>,
  validate: (result: TResult) => QualityCheckResult,
  input: TInput,
  enhanceInput: (input: TInput, gate: QualityCheckResult) => TInput,
  maxRetries = 2
): Promise<{ result: TResult; gate: QualityCheckResult; attempts: number }> {
  let currentInput = input
  let lastResult: TResult | undefined
  let lastGate: QualityCheckResult | undefined

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    lastResult = await fn(currentInput)
    lastGate = validate(lastResult)

    if (lastGate.status !== 'FAIL') {
      return { result: lastResult, gate: lastGate, attempts: attempt }
    }

    if (attempt <= maxRetries) {
      console.warn(`[quality-gate] FAIL on attempt ${attempt}/${maxRetries + 1}: ${lastGate.failReasons.join(', ')}`)
      currentInput = enhanceInput(currentInput, lastGate)
    }
  }

  // Return last result even if failed — caller can decide what to do
  return { result: lastResult!, gate: lastGate!, attempts: maxRetries + 1 }
}

// --- Prompt enhancement helpers ---

function buildEnhanced3DPrompt(polyCount: number): string {
  if (polyCount > MAX_POLYGON_COUNT) {
    return 'Generate a low-poly 3D model suitable for real-time rendering. Target polygon count under 10,000. Use clean topology with quad-dominant geometry. Simplified details, no excessive geometry.'
  }
  return 'Generate a clean 3D model with simple geometry. Focus on silhouette and major features only.'
}

function buildEnhancedTextPrompt(): string {
  return 'Respond ONLY with valid JSON. No markdown, no code blocks, no explanation. Pure JSON object.'
}
