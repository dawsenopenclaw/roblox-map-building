/**
 * AI Request Queue — Prevents flooding AI APIs with concurrent requests.
 *
 * Problem: Complex builds (staged pipeline) fire 5-10 AI calls simultaneously.
 * Each hits rate limits → all fail → user gets "catching its breath".
 *
 * Solution: Queue requests with concurrency limit + priority + backoff.
 * High-priority requests (user-facing) jump the queue.
 * Low-priority requests (quality checks, retries) wait.
 */

import 'server-only'

type Priority = 'critical' | 'high' | 'normal' | 'low'

interface QueuedRequest<T> {
  id: string
  priority: Priority
  execute: () => Promise<T>
  resolve: (value: T) => void
  reject: (reason: unknown) => void
  enqueuedAt: number
  timeoutMs: number
}

// Priority weights for sorting (higher = runs first)
const PRIORITY_WEIGHT: Record<Priority, number> = {
  critical: 100,
  high: 50,
  normal: 10,
  low: 1,
}

// ── Queue State ──────────────────────────────────────────────────────────────

const queue: QueuedRequest<unknown>[] = []
let activeCount = 0
const MAX_CONCURRENT = 4 // Max simultaneous AI calls (across all providers)
const MAX_QUEUE_SIZE = 50 // Reject if queue gets too long
let totalProcessed = 0
let totalFailed = 0
let totalTimedOut = 0
let requestIdCounter = 0

// ── Rate Limit Tracking ─────────────────────────────────────────────────────

let lastRateLimitAt = 0
let rateLimitCooldownMs = 0
const RATE_LIMIT_BACKOFF_BASE = 3000 // Start with 3s cooldown
const RATE_LIMIT_BACKOFF_MAX = 30000 // Max 30s cooldown
let consecutiveRateLimits = 0

function isRateLimited(): boolean {
  if (rateLimitCooldownMs === 0) return false
  return Date.now() < lastRateLimitAt + rateLimitCooldownMs
}

export function reportQueueRateLimit() {
  lastRateLimitAt = Date.now()
  consecutiveRateLimits++
  rateLimitCooldownMs = Math.min(
    RATE_LIMIT_BACKOFF_BASE * Math.pow(1.5, consecutiveRateLimits - 1),
    RATE_LIMIT_BACKOFF_MAX
  )
  console.warn(`[ai-queue] Rate limit hit #${consecutiveRateLimits}, cooling down ${(rateLimitCooldownMs / 1000).toFixed(1)}s`)
}

function clearRateLimit() {
  consecutiveRateLimits = Math.max(0, consecutiveRateLimits - 1)
  if (consecutiveRateLimits === 0) rateLimitCooldownMs = 0
}

// ── Queue Processing ────────────────────────────────────────────────────────

function processNext() {
  if (activeCount >= MAX_CONCURRENT) return
  if (queue.length === 0) return
  if (isRateLimited()) {
    // Schedule retry after cooldown
    const waitMs = (lastRateLimitAt + rateLimitCooldownMs) - Date.now()
    setTimeout(processNext, Math.max(100, waitMs))
    return
  }

  // Sort queue by priority (highest first), then by enqueue time (oldest first)
  queue.sort((a, b) => {
    const pDiff = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority]
    if (pDiff !== 0) return pDiff
    return a.enqueuedAt - b.enqueuedAt
  })

  const request = queue.shift()
  if (!request) return

  // Check if request has timed out while waiting in queue
  const waitTime = Date.now() - request.enqueuedAt
  if (waitTime > request.timeoutMs) {
    totalTimedOut++
    request.reject(new Error(`Queue timeout: waited ${(waitTime / 1000).toFixed(1)}s (limit: ${(request.timeoutMs / 1000).toFixed(0)}s)`))
    processNext()
    return
  }

  activeCount++
  const startTime = Date.now()

  request.execute()
    .then(result => {
      clearRateLimit()
      totalProcessed++
      request.resolve(result)
    })
    .catch(err => {
      totalFailed++
      // Detect rate limit errors
      const errMsg = err instanceof Error ? err.message : String(err)
      if (errMsg.includes('429') || errMsg.includes('rate limit') || errMsg.includes('quota')) {
        reportQueueRateLimit()
      }
      request.reject(err)
    })
    .finally(() => {
      activeCount--
      const elapsed = Date.now() - startTime
      if (elapsed < 500) {
        // Fast response — likely cached or error. Process next immediately.
        processNext()
      } else {
        // Add tiny delay between requests to avoid bursts
        setTimeout(processNext, 100)
      }
    })
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Queue an AI request with priority and timeout.
 * Returns a Promise that resolves when the request completes.
 */
export function enqueueAIRequest<T>(
  execute: () => Promise<T>,
  opts: {
    priority?: Priority
    timeoutMs?: number
    label?: string
  } = {}
): Promise<T> {
  const { priority = 'normal', timeoutMs = 55000, label = 'ai-call' } = opts

  if (queue.length >= MAX_QUEUE_SIZE) {
    console.warn(`[ai-queue] Queue full (${queue.length}/${MAX_QUEUE_SIZE}), rejecting ${label}`)
    return Promise.reject(new Error('AI request queue is full. Try again in a few seconds.'))
  }

  return new Promise<T>((resolve, reject) => {
    const id = `${label}-${++requestIdCounter}`
    queue.push({
      id,
      priority,
      execute: execute as () => Promise<unknown>,
      resolve: resolve as (value: unknown) => void,
      reject,
      enqueuedAt: Date.now(),
      timeoutMs,
    })

    if (queue.length % 5 === 0 || priority === 'critical') {
      console.log(`[ai-queue] ${id} queued (pos=${queue.length}, active=${activeCount}/${MAX_CONCURRENT}, priority=${priority})`)
    }

    processNext()
  })
}

/**
 * Get queue stats for monitoring/admin dashboard.
 */
export function getQueueStats() {
  return {
    queueLength: queue.length,
    activeRequests: activeCount,
    maxConcurrent: MAX_CONCURRENT,
    totalProcessed,
    totalFailed,
    totalTimedOut,
    isRateLimited: isRateLimited(),
    rateLimitCooldownMs,
    consecutiveRateLimits,
  }
}

/**
 * Wrap a function to automatically queue it.
 * Use this to wrap AI provider calls.
 */
export function withQueue<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  opts: { priority?: Priority; label?: string } = {}
): (...args: TArgs) => Promise<TResult> {
  return (...args: TArgs) => enqueueAIRequest(() => fn(...args), opts)
}
