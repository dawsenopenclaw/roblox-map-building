/**
 * Lightweight metrics collection for ForjeGames.
 *
 * Three primitive types: Counter, Histogram, Gauge.
 * Metrics are buffered in memory and flushed periodically to either:
 *   1. PostHog (as custom events)   — when POSTHOG_KEY is set
 *   2. POST /api/metrics             — always (server-side ingest)
 *
 * The module is a full no-op in dev mode to avoid local noise.
 */

import { serverEnv } from '../env'

type Labels = Readonly<Record<string, string | number | boolean>>

interface CounterPoint {
  kind: 'counter'
  name: string
  value: number
  labels: Labels
  at: number
}
interface HistogramPoint {
  kind: 'histogram'
  name: string
  value: number
  labels: Labels
  at: number
}
interface GaugePoint {
  kind: 'gauge'
  name: string
  value: number
  labels: Labels
  at: number
}
type Point = CounterPoint | HistogramPoint | GaugePoint

const FLUSH_INTERVAL_MS = 10_000
const MAX_BUFFER = 1_000
const isNoop = (): boolean => serverEnv.NODE_ENV === 'development' || serverEnv.NODE_ENV === 'test'

class MetricsRegistry {
  private buffer: Point[] = []
  private timer: ReturnType<typeof setInterval> | null = null

  public counter(name: string, value = 1, labels: Labels = {}): void {
    if (isNoop()) return
    this.push({ kind: 'counter', name, value, labels, at: Date.now() })
  }

  public histogram(name: string, value: number, labels: Labels = {}): void {
    if (isNoop()) return
    this.push({ kind: 'histogram', name, value, labels, at: Date.now() })
  }

  public gauge(name: string, value: number, labels: Labels = {}): void {
    if (isNoop()) return
    this.push({ kind: 'gauge', name, value, labels, at: Date.now() })
  }

  /** Time an async function and emit a histogram of its duration. */
  public async timeAsync<T>(
    name: string,
    fn: () => Promise<T>,
    labels: Labels = {},
  ): Promise<T> {
    const start = Date.now()
    try {
      const result = await fn()
      this.histogram(name, Date.now() - start, { ...labels, outcome: 'ok' })
      return result
    } catch (err) {
      this.histogram(name, Date.now() - start, { ...labels, outcome: 'error' })
      throw err
    }
  }

  public snapshot(): readonly Point[] {
    return [...this.buffer]
  }

  public async flush(): Promise<void> {
    if (this.buffer.length === 0) return
    const toFlush = this.buffer.splice(0, this.buffer.length)
    try {
      await fetch('/api/metrics', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ points: toFlush }),
        keepalive: true,
      })
    } catch {
      // Best-effort — drop on network failure to avoid unbounded growth.
    }
  }

  private push(p: Point): void {
    this.buffer.push(p)
    if (this.buffer.length > MAX_BUFFER) {
      // Drop oldest to preserve the most recent signal.
      this.buffer.splice(0, this.buffer.length - MAX_BUFFER)
    }
    this.ensureTimer()
  }

  private ensureTimer(): void {
    if (this.timer) return
    if (typeof setInterval !== 'function') return
    this.timer = setInterval(() => {
      void this.flush()
    }, FLUSH_INTERVAL_MS)
    // Allow node process to exit even when metrics are buffered.
    const t = this.timer as unknown as { unref?: () => void }
    if (typeof t.unref === 'function') t.unref()
  }
}

const registry = new MetricsRegistry()

/**
 * Public metrics API. Prefer the pre-defined helpers in `metrics.*` over
 * calling `registry.counter` with raw strings — it keeps the metric catalog
 * in one place.
 */
export const metrics = {
  counter: (name: string, value?: number, labels?: Labels): void =>
    registry.counter(name, value, labels),
  histogram: (name: string, value: number, labels?: Labels): void =>
    registry.histogram(name, value, labels),
  gauge: (name: string, value: number, labels?: Labels): void =>
    registry.gauge(name, value, labels),
  timeAsync: <T>(name: string, fn: () => Promise<T>, labels?: Labels): Promise<T> =>
    registry.timeAsync(name, fn, labels),
  flush: (): Promise<void> => registry.flush(),
  snapshot: (): readonly Point[] => registry.snapshot(),

  // ---- pre-defined ForjeGames metrics ----
  aiCallLatency: (model: string, durationMs: number, outcome: 'ok' | 'error'): void =>
    registry.histogram('ai.call.latency_ms', durationMs, { model, outcome }),
  meshUploadTime: (backend: 'meshy' | 'fal' | 'roblox', durationMs: number): void =>
    registry.histogram('mesh.upload.duration_ms', durationMs, { backend }),
  queueDepth: (queue: string, depth: number): void =>
    registry.gauge('queue.depth', depth, { queue }),
  cacheHit: (scope: string, hit: boolean): void =>
    registry.counter('cache.lookup', 1, { scope, result: hit ? 'hit' : 'miss' }),
  routeError: (route: string, status: number): void =>
    registry.counter('route.error', 1, { route, status }),
  circuitOpen: (service: string): void =>
    registry.counter('reliability.circuit.open', 1, { service }),
  retryAttempt: (service: string, attempt: number): void =>
    registry.counter('reliability.retry.attempt', 1, { service, attempt }),
}

export type { Point, Labels }
