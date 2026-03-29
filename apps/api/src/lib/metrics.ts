/**
 * In-process metrics store — Prometheus-compatible text exposition format.
 *
 * Counters, gauges, and histograms (via duration buckets) are stored in
 * memory. Use GET /api/metrics to scrape them.
 *
 * This is intentionally zero-dependency and zero-config. For production-scale
 * monitoring, wire in a Prometheus push-gateway or replace this module with
 * prom-client — the call-sites are identical.
 *
 * Usage:
 *   import { incrementCounter, recordDuration, recordGauge } from '../lib/metrics'
 *   incrementCounter('ai_requests_total', { mode: 'terrain', status: 'success' })
 *   recordDuration('ai_pipeline_duration_ms', durationMs, { mode: 'terrain' })
 *   recordGauge('token_balance', balance, { userId })
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Labels = Record<string, string>

interface CounterSeries {
  type: 'counter'
  help?: string
  values: Map<string, { labels: Labels; value: number }>
}

interface GaugeSeries {
  type: 'gauge'
  help?: string
  values: Map<string, { labels: Labels; value: number }>
}

interface HistogramSeries {
  type: 'histogram'
  help?: string
  buckets: number[]
  values: Map<
    string,
    { labels: Labels; count: number; sum: number; bucketCounts: number[] }
  >
}

type Series = CounterSeries | GaugeSeries | HistogramSeries

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const registry = new Map<string, Series>()

// Default histogram buckets (milliseconds)
const DEFAULT_BUCKETS_MS = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000]

function labelKey(labels: Labels): string {
  return Object.entries(labels)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}="${v}"`)
    .join(',')
}

function getOrCreate<T extends Series>(name: string, factory: () => T): T {
  if (!registry.has(name)) {
    registry.set(name, factory())
  }
  return registry.get(name) as T
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Increment a counter by 1 (or by `amount`).
 * Counters only go up. Good for: request counts, error counts, events fired.
 */
export function incrementCounter(name: string, labels: Labels = {}, amount = 1): void {
  const series = getOrCreate<CounterSeries>(name, () => ({
    type: 'counter',
    values: new Map(),
  }))
  const key = labelKey(labels)
  const existing = series.values.get(key)
  if (existing) {
    existing.value += amount
  } else {
    series.values.set(key, { labels, value: amount })
  }
}

/**
 * Record a duration (in milliseconds) as a histogram observation.
 * Good for: endpoint latency, AI pipeline duration, DB query time.
 */
export function recordDuration(name: string, ms: number, labels: Labels = {}): void {
  const series = getOrCreate<HistogramSeries>(name, () => ({
    type: 'histogram',
    buckets: DEFAULT_BUCKETS_MS,
    values: new Map(),
  }))
  const key = labelKey(labels)
  const existing = series.values.get(key)
  if (existing) {
    existing.count++
    existing.sum += ms
    for (let i = 0; i < series.buckets.length; i++) {
      if (ms <= series.buckets[i]) existing.bucketCounts[i]++
    }
  } else {
    const bucketCounts = series.buckets.map((b) => (ms <= b ? 1 : 0))
    series.values.set(key, { labels, count: 1, sum: ms, bucketCounts })
  }
}

/**
 * Set a gauge to a specific value.
 * Good for: current queue depth, token balances, active connections.
 */
export function recordGauge(name: string, value: number, labels: Labels = {}): void {
  const series = getOrCreate<GaugeSeries>(name, () => ({
    type: 'gauge',
    values: new Map(),
  }))
  const key = labelKey(labels)
  series.values.set(key, { labels, value })
}

/**
 * Register help text for a metric (optional, appears in Prometheus output).
 */
export function registerHelp(name: string, help: string): void {
  const series = registry.get(name)
  if (series) series.help = help
}

// ---------------------------------------------------------------------------
// Prometheus text format exposition
// ---------------------------------------------------------------------------

function labelStr(labels: Labels): string {
  const entries = Object.entries(labels)
  if (entries.length === 0) return ''
  return `{${entries.map(([k, v]) => `${k}="${v}"`).join(',')}}`
}

function serializeCounter(name: string, series: CounterSeries): string {
  const lines: string[] = []
  if (series.help) lines.push(`# HELP ${name} ${series.help}`)
  lines.push(`# TYPE ${name} counter`)
  for (const { labels, value } of series.values.values()) {
    lines.push(`${name}${labelStr(labels)} ${value}`)
  }
  return lines.join('\n')
}

function serializeGauge(name: string, series: GaugeSeries): string {
  const lines: string[] = []
  if (series.help) lines.push(`# HELP ${name} ${series.help}`)
  lines.push(`# TYPE ${name} gauge`)
  for (const { labels, value } of series.values.values()) {
    lines.push(`${name}${labelStr(labels)} ${value}`)
  }
  return lines.join('\n')
}

function serializeHistogram(name: string, series: HistogramSeries): string {
  const lines: string[] = []
  if (series.help) lines.push(`# HELP ${name} ${series.help}`)
  lines.push(`# TYPE ${name} histogram`)
  for (const { labels, count, sum, bucketCounts } of series.values.values()) {
    const ls = labelStr(labels)
    // Emit bucket counts as cumulative
    let cumulative = 0
    for (let i = 0; i < series.buckets.length; i++) {
      cumulative += bucketCounts[i]
      const bucketLabels = Object.keys(labels).length > 0
        ? `{${Object.entries(labels).map(([k, v]) => `${k}="${v}"`).join(',')},le="${series.buckets[i]}"}`
        : `{le="${series.buckets[i]}"}`
      lines.push(`${name}_bucket${bucketLabels} ${cumulative}`)
    }
    const infLabels = Object.keys(labels).length > 0
      ? `{${Object.entries(labels).map(([k, v]) => `${k}="${v}"`).join(',')},le="+Inf"}`
      : `{le="+Inf"}`
    lines.push(`${name}_bucket${infLabels} ${count}`)
    lines.push(`${name}_sum${ls} ${sum}`)
    lines.push(`${name}_count${ls} ${count}`)
  }
  return lines.join('\n')
}

/**
 * Returns the full Prometheus text format for all registered metrics.
 * Wire to GET /api/metrics.
 */
export function getMetricsText(): string {
  const parts: string[] = []
  for (const [name, series] of registry.entries()) {
    switch (series.type) {
      case 'counter':
        parts.push(serializeCounter(name, series))
        break
      case 'gauge':
        parts.push(serializeGauge(name, series))
        break
      case 'histogram':
        parts.push(serializeHistogram(name, series))
        break
    }
  }
  return parts.join('\n\n') + '\n'
}

/**
 * Returns all metrics as a plain JS object (for JSON endpoint / debugging).
 */
export function getMetricsJson(): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [name, series] of registry.entries()) {
    if (series.type === 'counter' || series.type === 'gauge') {
      out[name] = {
        type: series.type,
        series: Array.from(series.values.values()),
      }
    } else {
      out[name] = {
        type: 'histogram',
        series: Array.from(series.values.values()).map((v) => ({
          labels: v.labels,
          count: v.count,
          sum: v.sum,
          avg: v.count > 0 ? Math.round(v.sum / v.count) : 0,
        })),
      }
    }
  }
  return out
}

/**
 * Reset all metrics (useful in tests).
 */
export function resetMetrics(): void {
  registry.clear()
}

// ---------------------------------------------------------------------------
// Pre-register well-known metrics with help text
// ---------------------------------------------------------------------------
;(function preregister() {
  const helpTexts: Record<string, string> = {
    http_requests_total: 'Total HTTP requests',
    http_request_duration_ms: 'HTTP request duration in milliseconds',
    http_errors_total: 'Total HTTP error responses (4xx and 5xx)',
    rate_limit_hits_total: 'Total rate limit rejections',
    ai_requests_total: 'Total AI generation requests',
    ai_request_duration_ms: 'AI pipeline duration in milliseconds',
    ai_cache_hits_total: 'Total AI cache hits',
    ai_cache_misses_total: 'Total AI cache misses',
    auth_events_total: 'Auth events (signup, login, failed_login)',
    payment_events_total: 'Payment events (checkout, webhook, token_earned)',
    marketplace_events_total: 'Marketplace events (submit, purchase, review)',
    token_balance_current: 'Current token balance gauge per user',
  }
  for (const [name, help] of Object.entries(helpTexts)) {
    if (!registry.has(name)) {
      // Touch the series so help gets attached on first real write
      registerHelp(name, help)
    }
    // Store help separately for pre-registration before first write
    registry.set(name, {
      type: name.endsWith('_ms') ? 'histogram' : name.endsWith('_current') ? 'gauge' : 'counter',
      help,
      buckets: DEFAULT_BUCKETS_MS,
      values: new Map(),
    } as Series)
  }
})()
