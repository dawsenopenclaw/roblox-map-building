/**
 * API Key Rotator — Cycles through multiple API keys to avoid rate limits.
 *
 * Each Gemini free-tier key gets ~1,500 requests/day and 15 RPM.
 * With 10 keys = 15,000 requests/day, 150 RPM.
 * With 50 keys = 75,000 requests/day, 750 RPM.
 *
 * Keys are stored in env vars as comma-separated lists:
 *   GEMINI_API_KEYS=key1,key2,key3,...
 *   GROQ_API_KEYS=key1,key2,key3,...
 *
 * Falls back to single-key env vars (GEMINI_API_KEY, GROQ_API_KEY)
 * for backwards compatibility.
 */

import 'server-only'

interface KeyState {
  key: string
  failCount: number
  lastFailAt: number
  disabled: boolean // true = key is dead (invalid/expired), skip permanently
  rateLimitedUntil: number // unix ms — skip until this time
}

const keyPools: Record<string, KeyState[]> = {}
const roundRobinIndex: Record<string, number> = {}

/**
 * Initialize a key pool from env var.
 * Reads PROVIDER_API_KEYS (comma-separated) first, falls back to PROVIDER_API_KEY (single).
 */
function initPool(provider: string): KeyState[] {
  if (keyPools[provider]) return keyPools[provider]

  const multiKey = process.env[`${provider}_API_KEYS`] || ''
  const singleKey = process.env[`${provider}_API_KEY`] || process.env[`${provider}_API_KEY_MAIN`] || ''

  const rawKeys = multiKey
    ? multiKey.split(',').map(k => k.trim()).filter(Boolean)
    : singleKey
      ? [singleKey.trim()]
      : []

  const pool = rawKeys.map(key => ({
    key,
    failCount: 0,
    lastFailAt: 0,
    disabled: false,
    rateLimitedUntil: 0,
  }))

  keyPools[provider] = pool
  roundRobinIndex[provider] = 0

  if (pool.length > 1) {
    console.log(`[KeyRotator] ${provider}: ${pool.length} keys loaded`)
  }

  return pool
}

/**
 * Get the next available API key for a provider.
 * Uses round-robin with skip logic for rate-limited/disabled keys.
 */
export function getNextKey(provider: string): string | null {
  const pool = initPool(provider)
  if (pool.length === 0) return null

  const now = Date.now()
  const startIndex = roundRobinIndex[provider] ?? 0

  // Try each key in round-robin order
  for (let i = 0; i < pool.length; i++) {
    const idx = (startIndex + i) % pool.length
    const state = pool[idx]

    // Skip permanently disabled keys
    if (state.disabled) continue

    // Skip temporarily rate-limited keys
    if (state.rateLimitedUntil > now) continue

    // This key is available — advance the index for next call
    roundRobinIndex[provider] = (idx + 1) % pool.length
    return state.key
  }

  // All keys are rate-limited or disabled — return the least-recently-failed one
  const available = pool.filter(k => !k.disabled)
  if (available.length === 0) return null

  // Pick the one whose rate limit expires soonest
  available.sort((a, b) => a.rateLimitedUntil - b.rateLimitedUntil)
  return available[0].key
}

/**
 * Report a 429 rate limit on a key. The key will be skipped for `cooldownMs`.
 */
export function reportRateLimit(provider: string, key: string, cooldownMs: number = 60000): void {
  const pool = initPool(provider)
  const state = pool.find(k => k.key === key)
  if (!state) return

  state.failCount++
  state.lastFailAt = Date.now()
  state.rateLimitedUntil = Date.now() + cooldownMs

  const activeKeys = pool.filter(k => !k.disabled && k.rateLimitedUntil <= Date.now()).length
  console.log(`[KeyRotator] ${provider}: key ...${key.slice(-4)} rate limited for ${cooldownMs / 1000}s (${activeKeys}/${pool.length} keys active)`)
}

/**
 * Report an auth failure (invalid key). Key is permanently disabled.
 */
export function reportAuthFailure(provider: string, key: string): void {
  const pool = initPool(provider)
  const state = pool.find(k => k.key === key)
  if (!state) return

  state.disabled = true
  const activeKeys = pool.filter(k => !k.disabled).length
  console.warn(`[KeyRotator] ${provider}: key ...${key.slice(-4)} DISABLED (auth failure). ${activeKeys}/${pool.length} keys remaining.`)
}

/**
 * Get pool status for monitoring.
 */
export function getPoolStatus(provider: string): {
  total: number
  active: number
  rateLimited: number
  disabled: number
} {
  const pool = initPool(provider)
  const now = Date.now()
  return {
    total: pool.length,
    active: pool.filter(k => !k.disabled && k.rateLimitedUntil <= now).length,
    rateLimited: pool.filter(k => !k.disabled && k.rateLimitedUntil > now).length,
    disabled: pool.filter(k => k.disabled).length,
  }
}
// 28 Gemini keys deployed 1777265517
