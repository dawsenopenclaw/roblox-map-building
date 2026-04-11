/**
 * Redis adapter for the circuit breaker.
 *
 * Kept in a separate module so the breaker state shape (and any future
 * serialization logic such as compression or schema versioning) can evolve
 * without touching the core state machine.
 *
 * When Redis is unavailable every function in this module no-ops and the
 * breaker transparently falls back to its in-process state.
 */

import 'server-only'
import { getRedis } from '../redis'
import type { CircuitState } from './circuit-breaker'

/**
 * Redis-serialized breaker state. Keys are short to keep the payload small
 * since breaker state is read on every outbound API call.
 */
export interface BreakerRedisState {
  s: CircuitState
  f: number
  lf: number
  oa: number
  hs: number
  u: number
}

const KEY_PREFIX = 'cb:v1:'
const SCHEMA_VERSION = 1

function key(service: string): string {
  return `${KEY_PREFIX}${service}`
}

/**
 * Load the latest breaker state for a service from Redis.
 * Returns null when Redis is unavailable or the key is missing.
 */
export async function loadBreakerStateFromRedis(
  service: string,
): Promise<BreakerRedisState | null> {
  const redis = getRedis()
  if (!redis) return null
  try {
    const raw = await redis.get(key(service))
    if (!raw) return null
    const parsed = JSON.parse(raw) as { v?: number } & BreakerRedisState
    if (parsed.v !== SCHEMA_VERSION) return null
    if (!isValidState(parsed.s)) return null
    return {
      s: parsed.s,
      f: numberOr(parsed.f, 0),
      lf: numberOr(parsed.lf, 0),
      oa: numberOr(parsed.oa, 0),
      hs: numberOr(parsed.hs, 0),
      u: numberOr(parsed.u, Date.now()),
    }
  } catch {
    return null
  }
}

/**
 * Persist the breaker state to Redis.
 *
 * We set a TTL longer than `recoveryMs` so that state naturally evicts when
 * traffic stops, but short enough that stale state can't linger across
 * multi-day incidents.
 */
export async function saveBreakerStateToRedis(
  service: string,
  state: BreakerRedisState,
  recoveryMs: number,
): Promise<void> {
  const redis = getRedis()
  if (!redis) return
  try {
    const ttlSeconds = Math.max(60, Math.ceil((recoveryMs * 8) / 1000))
    const payload = JSON.stringify({ v: SCHEMA_VERSION, ...state })
    await redis.set(key(service), payload, 'EX', ttlSeconds)
  } catch {
    // fail-open: in-memory state still works
  }
}

/** Remove persisted breaker state (used by tests and admin reset). */
export async function clearBreakerStateInRedis(service: string): Promise<void> {
  const redis = getRedis()
  if (!redis) return
  try {
    await redis.del(key(service))
  } catch {
    // ignore
  }
}

function isValidState(s: unknown): s is CircuitState {
  return s === 'closed' || s === 'open' || s === 'half-open'
}

function numberOr(v: unknown, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback
}
