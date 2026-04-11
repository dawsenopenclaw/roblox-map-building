/**
 * Structured JSON logger compatible with Vercel log drains.
 *
 * Each log line is a single-line JSON object with:
 *   ts, level, event, msg, requestId, userId, correlationId, ...fields
 *
 * Request context (requestId, userId, correlationId, route) is attached
 * automatically via AsyncLocalStorage. Call `runWithLogContext` at the top of
 * a request handler or middleware; every subsequent `log.*` call within that
 * async scope inherits the context without explicit threading.
 */

import { AsyncLocalStorage } from 'node:async_hooks'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogContext {
  requestId?: string
  userId?: string
  correlationId?: string
  route?: string
  region?: string
}

export type LogFields = Record<
  string,
  string | number | boolean | null | undefined | Record<string, unknown>
>

interface LogRecord {
  ts: string
  level: LogLevel
  event: string
  msg?: string
  requestId?: string
  userId?: string
  correlationId?: string
  route?: string
  region?: string
  err?: { name: string; message: string; stack?: string; code?: string | number }
  [key: string]: unknown
}

const als = new AsyncLocalStorage<LogContext>()

const LEVELS: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 }

const MIN_LEVEL: LogLevel = (() => {
  const env =
    typeof process !== 'undefined' ? process.env?.LOG_LEVEL?.toLowerCase() : undefined
  if (env && env in LEVELS) return env as LogLevel
  return 'info'
})()

function shouldEmit(level: LogLevel): boolean {
  return LEVELS[level] >= LEVELS[MIN_LEVEL]
}

function nowIso(): string {
  return new Date().toISOString()
}

function serializeError(
  err: unknown,
): { name: string; message: string; stack?: string; code?: string | number } | undefined {
  if (!err) return undefined
  if (err instanceof Error) {
    const e = err as Error & { code?: string | number }
    return { name: e.name, message: e.message, stack: e.stack, code: e.code }
  }
  return { name: 'NonError', message: String(err) }
}

function emit(level: LogLevel, event: string, fields?: LogFields, err?: unknown): void {
  if (!shouldEmit(level)) return
  const ctx = als.getStore() ?? {}
  const record: LogRecord = {
    ts: nowIso(),
    level,
    event,
    ...ctx,
    ...fields,
  }
  if (err !== undefined) {
    const serialized = serializeError(err)
    if (serialized) record.err = serialized
  }
  const line = safeStringify(record)
  // Vercel log drains parse stdout/stderr line-by-line.
  if (level === 'error') {
    // eslint-disable-next-line no-console
    console.error(line)
  } else if (level === 'warn') {
    // eslint-disable-next-line no-console
    console.warn(line)
  } else {
    // eslint-disable-next-line no-console
    console.log(line)
  }
}

function safeStringify(obj: unknown): string {
  try {
    return JSON.stringify(obj)
  } catch {
    try {
      return JSON.stringify({ ts: nowIso(), level: 'error', event: 'log.serialize_failed' })
    } catch {
      return '{"event":"log.serialize_failed"}'
    }
  }
}

/**
 * Run `fn` inside a logging context. All `log.*` calls inside `fn` — including
 * awaited async work — will automatically carry these fields.
 */
export function runWithLogContext<T>(ctx: LogContext, fn: () => T): T {
  return als.run(ctx, fn)
}

/** Merge additional context onto the current scope for the remainder of `fn`. */
export function withLogContext<T>(extra: LogContext, fn: () => T): T {
  const current = als.getStore() ?? {}
  return als.run({ ...current, ...extra }, fn)
}

/** Inspect (or mutate) the current log context. Returns undefined outside a scope. */
export function getLogContext(): LogContext | undefined {
  return als.getStore()
}

export const log = {
  debug: (event: string, fields?: LogFields): void => emit('debug', event, fields),
  info: (event: string, fields?: LogFields): void => emit('info', event, fields),
  warn: (event: string, fields?: LogFields, err?: unknown): void =>
    emit('warn', event, fields, err),
  error: (event: string, fields?: LogFields, err?: unknown): void =>
    emit('error', event, fields, err),
}

/** Generate a short request ID (not cryptographically secure). */
export function newRequestId(): string {
  const rand = Math.random().toString(36).slice(2, 10)
  const t = Date.now().toString(36)
  return `${t}-${rand}`
}
