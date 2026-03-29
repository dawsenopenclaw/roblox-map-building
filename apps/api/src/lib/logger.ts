/**
 * Structured JSON logger.
 * Production: JSON to stdout (one line per entry, parseable by log aggregators).
 * Development: Pretty-printed with colors via console methods.
 *
 * Usage:
 *   import { createLogger } from '../lib/logger'
 *   const log = createLogger('my-module')
 *   log.info('request started', { userId, requestId })
 *   log.error('pipeline failed', { error: err.message })
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  module: string
  requestId?: string
  userId?: string
  durationMs?: number
  metadata?: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const IS_PROD = process.env.NODE_ENV === 'production'
const IS_TEST = process.env.NODE_ENV === 'test'

const LEVEL_RANK: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 }

// Minimum level to emit. In production default to 'info', dev to 'debug'.
// Override via LOG_LEVEL env var.
const MIN_LEVEL: LogLevel = (() => {
  const raw = process.env.LOG_LEVEL?.toLowerCase() as LogLevel | undefined
  if (raw && raw in LEVEL_RANK) return raw
  return IS_PROD ? 'info' : 'debug'
})()

const LEVEL_COLORS: Record<LogLevel, string> = {
  debug: '\x1b[90m', // grey
  info: '\x1b[36m',  // cyan
  warn: '\x1b[33m',  // yellow
  error: '\x1b[31m', // red
}
const RESET = '\x1b[0m'
const DIM = '\x1b[2m'

function buildEntry(
  level: LogLevel,
  module: string,
  message: string,
  context: Partial<Pick<LogEntry, 'requestId' | 'userId' | 'durationMs'>> & {
    metadata?: Record<string, unknown>
  } = {}
): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    module,
    ...(context.requestId ? { requestId: context.requestId } : {}),
    ...(context.userId ? { userId: context.userId } : {}),
    ...(context.durationMs !== undefined ? { durationMs: context.durationMs } : {}),
    ...(context.metadata && Object.keys(context.metadata).length > 0
      ? { metadata: context.metadata }
      : {}),
  }
}

function emitPretty(entry: LogEntry): void {
  if (IS_TEST) return
  const color = LEVEL_COLORS[entry.level]
  const levelTag = `${color}[${entry.level.toUpperCase().padEnd(5)}]${RESET}`
  const mod = `${DIM}${entry.module}${RESET}`
  const ts = `${DIM}${entry.timestamp.replace('T', ' ').replace('Z', '')}${RESET}`
  const context: string[] = []
  if (entry.requestId) context.push(`req=${entry.requestId.slice(0, 8)}`)
  if (entry.userId) context.push(`uid=${entry.userId.slice(0, 8)}`)
  if (entry.durationMs !== undefined) context.push(`${entry.durationMs}ms`)
  const ctxStr = context.length ? ` ${DIM}(${context.join(' ')})${RESET}` : ''
  const meta =
    entry.metadata && Object.keys(entry.metadata).length > 0
      ? `\n  ${DIM}${JSON.stringify(entry.metadata)}${RESET}`
      : ''

  const line = `${ts} ${levelTag} ${mod} ${entry.message}${ctxStr}${meta}`

  switch (entry.level) {
    case 'debug':
      console.debug(line)
      break
    case 'warn':
      console.warn(line)
      break
    case 'error':
      console.error(line)
      break
    default:
      console.log(line)
  }
}

function emitJson(entry: LogEntry): void {
  const line = JSON.stringify(entry)
  switch (entry.level) {
    case 'error':
    case 'warn':
      process.stderr.write(line + '\n')
      break
    default:
      process.stdout.write(line + '\n')
  }
}

function emit(entry: LogEntry): void {
  if (LEVEL_RANK[entry.level] < LEVEL_RANK[MIN_LEVEL]) return
  if (IS_PROD) {
    emitJson(entry)
  } else {
    emitPretty(entry)
  }
}

// ---------------------------------------------------------------------------
// Logger interface
// ---------------------------------------------------------------------------

export interface Logger {
  debug(message: string, context?: LogContext): void
  info(message: string, context?: LogContext): void
  warn(message: string, context?: LogContext): void
  error(message: string, context?: LogContext): void
  /** Returns a child logger with pre-bound requestId / userId. */
  child(bindings: { requestId?: string; userId?: string }): Logger
}

export type LogContext = {
  requestId?: string
  userId?: string
  durationMs?: number
} & Record<string, unknown>

function buildLogger(module: string, bindings: { requestId?: string; userId?: string } = {}): Logger {
  function log(level: LogLevel, message: string, context: LogContext = {}): void {
    const { requestId, userId, durationMs, ...rest } = context
    emit(
      buildEntry(level, module, message, {
        requestId: requestId ?? bindings.requestId,
        userId: userId ?? bindings.userId,
        durationMs,
        metadata: Object.keys(rest).length > 0 ? (rest as Record<string, unknown>) : undefined,
      })
    )
  }

  return {
    debug: (msg, ctx) => log('debug', msg, ctx),
    info: (msg, ctx) => log('info', msg, ctx),
    warn: (msg, ctx) => log('warn', msg, ctx),
    error: (msg, ctx) => log('error', msg, ctx),
    child: (b) => buildLogger(module, { ...bindings, ...b }),
  }
}

// ---------------------------------------------------------------------------
// Public factory
// ---------------------------------------------------------------------------

/**
 * Creates a named logger for a module.
 * @param module - Short identifier shown in every log line, e.g. 'ai:generate'
 */
export function createLogger(module: string): Logger {
  return buildLogger(module)
}

// ---------------------------------------------------------------------------
// Default app-level logger (convenience)
// ---------------------------------------------------------------------------
export const logger = createLogger('app')
