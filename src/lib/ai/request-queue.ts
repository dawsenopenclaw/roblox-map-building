/**
 * AI Request Queue — Key-aware queue for API calls.
 *
 * How it works:
 * 1. User sends a message → request enters the queue
 * 2. Queue checks if any API keys are available (not rate-limited)
 * 3. If a key is free → process immediately
 * 4. If all keys are busy → wait until one frees up (up to timeoutMs)
 * 5. Frontend can poll /api/admin/queue-stats for position
 *
 * This prevents "catching its breath" by WAITING instead of FAILING.
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

const PRIORITY_WEIGHT: Record<Priority, number> = {
  critical: 100, high: 50, normal: 10, low: 1,
}

// ── Queue State ──────────────────────────────────────────────────────────────

const queue: QueuedRequest<unknown>[] = []
let activeCount = 0
// Max concurrent = how many API keys we have available simultaneously
// Gemini: 15 RPM per key. With 10 keys = we can handle ~10 concurrent.
// But safe limit is lower to avoid bursts.
const MAX_CONCURRENT = 6
const MAX_QUEUE_SIZE = 30
let totalProcessed = 0
let totalFailed = 0
let totalQueued = 0
let requestIdCounter = 0

// Track per-request wait times for UX
let avgWaitMs = 0
let waitSamples = 0

// ── Rate Limit Cooldown ─────────────────────────────────────────────────────

let globalCooldownUntil = 0 // unix ms — if ALL keys are limited
let consecutiveFailures = 0

function isInCooldown(): boolean {
  return Date.now() < globalCooldownUntil
}

export function reportQueueRateLimit() {
  consecutiveFailures++
  // Exponential backoff: 2s, 4s, 8s, max 20s
  const cooldownMs = Math.min(2000 * Math.pow(2, consecutiveFailures - 1), 20000)
  globalCooldownUntil = Date.now() + cooldownMs
  console.warn(`[ai-queue] Rate limit #${consecutiveFailures}, cooldown ${(cooldownMs / 1000).toFixed(1)}s`)
}

function clearCooldown() {
  if (consecutiveFailures > 0) consecutiveFailures = Math.max(0, consecutiveFailures - 1)
}

// ── Queue Processing ────────────────────────────────────────────────────────

function processNext() {
  if (activeCount >= MAX_CONCURRENT) return
  if (queue.length === 0) return

  if (isInCooldown()) {
    const waitMs = globalCooldownUntil - Date.now()
    setTimeout(processNext, Math.max(100, waitMs))
    return
  }

  // Sort: highest priority first, then oldest first
  queue.sort((a, b) => {
    const pDiff = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority]
    return pDiff !== 0 ? pDiff : a.enqueuedAt - b.enqueuedAt
  })

  const request = queue.shift()
  if (!request) return

  // Check timeout
  const waitTime = Date.now() - request.enqueuedAt
  if (waitTime > request.timeoutMs) {
    request.reject(new Error(`Queue timeout after ${(waitTime / 1000).toFixed(1)}s`))
    processNext()
    return
  }

  activeCount++

  request.execute()
    .then(result => {
      clearCooldown()
      totalProcessed++
      // Track wait time
      const totalWait = Date.now() - request.enqueuedAt
      waitSamples++
      avgWaitMs = avgWaitMs + (totalWait - avgWaitMs) / waitSamples
      request.resolve(result)
    })
    .catch(err => {
      totalFailed++
      const errMsg = err instanceof Error ? err.message : String(err)
      if (errMsg.includes('429') || errMsg.includes('rate') || errMsg.includes('quota')) {
        reportQueueRateLimit()
      }
      request.reject(err)
    })
    .finally(() => {
      activeCount--
      // Small delay between requests to avoid burst
      setTimeout(processNext, activeCount === 0 ? 0 : 150)
    })
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Queue an AI request. Waits for a slot (API key availability) before executing.
 * Returns a Promise that resolves when the request completes.
 */
export function enqueueAIRequest<T>(
  execute: () => Promise<T>,
  opts: { priority?: Priority; timeoutMs?: number; label?: string } = {}
): Promise<T> {
  const { priority = 'normal', timeoutMs = 55000, label = 'ai-call' } = opts

  if (queue.length >= MAX_QUEUE_SIZE) {
    return Promise.reject(new Error('Build queue is full — try again in a few seconds.'))
  }

  totalQueued++

  return new Promise<T>((resolve, reject) => {
    const id = `${label}-${++requestIdCounter}`
    queue.push({
      id, priority,
      execute: execute as () => Promise<unknown>,
      resolve: resolve as (v: unknown) => void,
      reject,
      enqueuedAt: Date.now(),
      timeoutMs,
    })

    console.log(`[ai-queue] ${id} queued (pos=${queue.length}, active=${activeCount}/${MAX_CONCURRENT})`)
    processNext()
  })
}

/**
 * Get queue stats — exposed via /api/admin/queue-stats AND used by frontend
 * to show queue position to users.
 */
export function getQueueStats() {
  return {
    queueLength: queue.length,
    activeRequests: activeCount,
    maxConcurrent: MAX_CONCURRENT,
    totalProcessed,
    totalFailed,
    totalQueued,
    avgWaitMs: Math.round(avgWaitMs),
    isInCooldown: isInCooldown(),
    cooldownRemainingMs: Math.max(0, globalCooldownUntil - Date.now()),
    estimatedWaitMs: queue.length === 0 ? 0 : Math.round(avgWaitMs * (queue.length / MAX_CONCURRENT)),
  }
}

/**
 * Get a user's position in the queue (for frontend display).
 * Returns 0 if processing, >0 if waiting.
 */
export function getQueuePosition(): number {
  return queue.length
}
