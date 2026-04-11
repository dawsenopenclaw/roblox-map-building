/**
 * Slow query detector — wraps a Prisma client with a $use-style middleware
 * that logs (and reports to Sentry) any query exceeding a threshold.
 *
 * Usage:
 *   import { db } from '@/lib/db'
 *   import { attachSlowQueryDetector } from '@/lib/observability/slow-query-detector'
 *   attachSlowQueryDetector(db, { thresholdMs: 500 })
 *
 * The detector is designed to be attached *once* near app startup. Attaching
 * twice is a no-op because each Prisma client is flagged after the first call.
 */

import { metrics } from './metrics'

export interface SlowQueryOptions {
  /** Duration above which a query is considered slow. Default: 500ms. */
  thresholdMs: number
  /** Whether to emit metrics for slow queries. Default: true. */
  emitMetrics: boolean
  /** Whether to send warnings to Sentry. Default: true. */
  reportToSentry: boolean
  /** Max length of the query string captured in payload. Default: 2_000. */
  maxQueryLength: number
  /** Optional sink for custom logging (e.g. structured logger). */
  sink?: (event: SlowQueryEvent) => void
}

export interface SlowQueryEvent {
  model: string | undefined
  action: string
  durationMs: number
  params: unknown
  stack: string | undefined
  at: number
}

// Narrow Prisma client surface so this module doesn't need a direct dep on
// @prisma/client types (which would couple tests to generated output).
interface PrismaLike {
  $use: (
    middleware: (
      params: { model?: string; action: string; args: unknown },
      next: (p: { model?: string; action: string; args: unknown }) => Promise<unknown>,
    ) => Promise<unknown>,
  ) => void
}

const FLAG = Symbol.for('forjegames.slowQueryDetectorAttached')

const DEFAULTS: SlowQueryOptions = {
  thresholdMs: 500,
  emitMetrics: true,
  reportToSentry: true,
  maxQueryLength: 2_000,
}

export function attachSlowQueryDetector(
  client: PrismaLike,
  opts: Partial<SlowQueryOptions> = {},
): void {
  const flagged = client as unknown as Record<symbol, boolean>
  if (flagged[FLAG]) return
  flagged[FLAG] = true

  const config: SlowQueryOptions = { ...DEFAULTS, ...opts }

  client.$use(async (params, next) => {
    const started = Date.now()
    try {
      return await next(params)
    } finally {
      const duration = Date.now() - started
      if (duration >= config.thresholdMs) {
        const event: SlowQueryEvent = {
          model: params.model,
          action: params.action,
          durationMs: duration,
          params: truncate(params.args, config.maxQueryLength),
          stack: captureStack(),
          at: Date.now(),
        }
        handle(event, config)
      }
    }
  })
}

function truncate(value: unknown, maxLength: number): unknown {
  try {
    const json = JSON.stringify(value)
    if (json && json.length > maxLength) {
      return `${json.slice(0, maxLength)}…[truncated ${json.length - maxLength}b]`
    }
    return value
  } catch {
    return '[unserializable]'
  }
}

function captureStack(): string | undefined {
  const holder: { stack?: string } = {}
  Error.captureStackTrace?.(holder, attachSlowQueryDetector)
  if (!holder.stack) return undefined
  // Drop the first two frames that belong to the middleware itself.
  return holder.stack
    .split('\n')
    .slice(2)
    .join('\n')
}

function handle(event: SlowQueryEvent, config: SlowQueryOptions): void {
  if (config.emitMetrics) {
    metrics.histogram('db.query.slow_ms', event.durationMs, {
      model: event.model ?? 'unknown',
      action: event.action,
    })
    metrics.counter('db.query.slow_count', 1, {
      model: event.model ?? 'unknown',
      action: event.action,
    })
  }

  if (config.reportToSentry) {
    void reportToSentry(event).catch(() => undefined)
  }

  config.sink?.(event)
}

async function reportToSentry(event: SlowQueryEvent): Promise<void> {
  try {
    const sentry = (await import('@sentry/nextjs').catch(() => null)) as
      | { captureMessage?: (msg: string, ctx?: unknown) => void }
      | null
    if (!sentry?.captureMessage) return
    sentry.captureMessage(
      `Slow Prisma query: ${event.model ?? 'unknown'}.${event.action} (${event.durationMs}ms)`,
      {
        level: 'warning',
        tags: {
          slow_query: 'true',
          model: event.model ?? 'unknown',
          action: event.action,
        },
        extra: {
          durationMs: event.durationMs,
          params: event.params,
          stack: event.stack,
        },
      },
    )
  } catch {
    // Best effort — never throw from the detector.
  }
}
