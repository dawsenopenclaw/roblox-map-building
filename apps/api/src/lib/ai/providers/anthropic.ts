/**
 * Anthropic Claude API client wrapper
 * Supports: chat completion, streaming, vision analysis, token counting, cost calculation
 */

import Anthropic from '@anthropic-ai/sdk'

// Lazy singleton — checked at call time so missing key fails fast at the call
// site with a clear error, not at server startup.
let _anthropicClient: Anthropic | null = null

export function getAnthropicClient(): Anthropic {
  if (!_anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured')
    _anthropicClient = new Anthropic({ apiKey })
  }
  return _anthropicClient
}

/** @deprecated use getAnthropicClient() — kept for existing direct references */
export const anthropicClient = new Proxy({} as Anthropic, {
  get(_target, prop) {
    return (getAnthropicClient() as never as Record<string | symbol, unknown>)[prop]
  },
})

// Pricing per million tokens (as of Claude 3.5 Sonnet)
const CLAUDE_PRICING = {
  'claude-3-5-sonnet-20241022': { inputPerM: 3.0, outputPerM: 15.0 },
  'claude-3-5-haiku-20241022': { inputPerM: 0.8, outputPerM: 4.0 },
  'claude-3-opus-20240229': { inputPerM: 15.0, outputPerM: 75.0 },
} as const

export type ClaudeModel = keyof typeof CLAUDE_PRICING
export const DEFAULT_MODEL: ClaudeModel = 'claude-3-5-sonnet-20241022'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string | Anthropic.ContentBlockParam[]
}

export interface ChatOptions {
  model?: ClaudeModel
  maxTokens?: number
  systemPrompt?: string
  temperature?: number
}

export interface ChatResult {
  content: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  costUsd: number
  model: ClaudeModel
  durationMs: number
}

export interface VisionResult extends ChatResult {
  analysis: unknown
}

/**
 * Calculate cost for a given model and token counts
 */
export function calculateClaudeCost(
  model: ClaudeModel,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = CLAUDE_PRICING[model]
  return (inputTokens / 1_000_000) * pricing.inputPerM + (outputTokens / 1_000_000) * pricing.outputPerM
}

/**
 * Estimate tokens for a prompt (rough: 1 token ≈ 4 chars)
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

/**
 * Estimate cost before execution
 */
export function estimateChatCost(
  prompt: string,
  model: ClaudeModel = DEFAULT_MODEL,
  expectedOutputTokens = 1000
): { estimatedTokens: number; estimatedCostUsd: number } {
  const inputTokens = estimateTokens(prompt)
  const costUsd = calculateClaudeCost(model, inputTokens, expectedOutputTokens)
  return { estimatedTokens: inputTokens + expectedOutputTokens, estimatedCostUsd: costUsd }
}

/**
 * Chat completion with retry on transient errors
 */
const DEFAULT_TIMEOUT_MS = 30_000

async function withTimeout<T>(promise: Promise<T>, ms = DEFAULT_TIMEOUT_MS, label = 'request'): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Anthropic ${label} timed out after ${ms}ms`)), ms)
  })
  try {
    return await Promise.race([promise, timeout])
  } finally {
    clearTimeout(timer)
  }
}

export async function claudeChat(
  messages: ChatMessage[],
  options: ChatOptions = {}
): Promise<ChatResult> {
  const model = options.model ?? DEFAULT_MODEL
  const maxTokens = options.maxTokens ?? 4096
  const start = Date.now()

  const response = await withTimeout(
    getAnthropicClient().messages.create({
      model,
      max_tokens: maxTokens,
      system: options.systemPrompt,
      messages: messages as Anthropic.MessageParam[],
    }),
    DEFAULT_TIMEOUT_MS,
    'chat'
  )

  const inputTokens = response.usage.input_tokens
  const outputTokens = response.usage.output_tokens
  const content = response.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as Anthropic.TextBlock).text)
    .join('')

  return {
    content,
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    costUsd: calculateClaudeCost(model, inputTokens, outputTokens),
    model,
    durationMs: Date.now() - start,
  }
}

/**
 * Streaming chat completion — yields text chunks
 */
export async function* claudeChatStream(
  messages: ChatMessage[],
  options: ChatOptions = {}
): AsyncGenerator<string> {
  const model = options.model ?? DEFAULT_MODEL
  const maxTokens = options.maxTokens ?? 4096

  const stream = getAnthropicClient().messages.stream({
    model,
    max_tokens: maxTokens,
    system: options.systemPrompt,
    messages: messages as Anthropic.MessageParam[],
  })

  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta'
    ) {
      yield event.delta.text
    }
  }
}

/**
 * Vision analysis — accepts base64 image or URL
 */
export async function claudeVision(
  imageData: { base64: string; mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' } | { url: string },
  prompt: string,
  options: ChatOptions = {}
): Promise<VisionResult> {
  const model = options.model ?? DEFAULT_MODEL
  const maxTokens = options.maxTokens ?? 4096
  const start = Date.now()

  const imageContent: Anthropic.ImageBlockParam =
    'url' in imageData
      ? { type: 'image', source: { type: 'url', url: imageData.url } }
      : {
          type: 'image',
          source: {
            type: 'base64',
            media_type: imageData.mediaType,
            data: imageData.base64,
          },
        }

  const response = await withTimeout(
    getAnthropicClient().messages.create({
      model,
      max_tokens: maxTokens,
      system: options.systemPrompt,
      messages: [
        {
          role: 'user',
          content: [imageContent, { type: 'text', text: prompt }],
        },
      ],
    }),
    DEFAULT_TIMEOUT_MS,
    'vision'
  )

  const inputTokens = response.usage.input_tokens
  const outputTokens = response.usage.output_tokens
  const content = response.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as Anthropic.TextBlock).text)
    .join('')

  let analysis: unknown = content
  try {
    analysis = JSON.parse(content)
  } catch {
    // leave as string if not valid JSON
  }

  return {
    content,
    analysis,
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    costUsd: calculateClaudeCost(model, inputTokens, outputTokens),
    model,
    durationMs: Date.now() - start,
  }
}
