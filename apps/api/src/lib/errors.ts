/**
 * Standardized API error classes and error-handler middleware for Hono.
 *
 * Usage in routes:
 *   throw new AppError('NOT_FOUND', 'Template not found', 404)
 *
 * Usage in index.ts:
 *   app.onError(errorHandler)
 */

import type { Context } from 'hono'
import { ZodError } from 'zod'

// ---------------------------------------------------------------------------
// Error codes
// ---------------------------------------------------------------------------

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'RATE_LIMITED'
  | 'CONFLICT'
  | 'PAYMENT_REQUIRED'
  | 'UNPROCESSABLE'
  | 'BAD_GATEWAY'
  | 'INTERNAL_ERROR'

// Default HTTP status for each code
const DEFAULT_STATUS: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  NOT_FOUND: 404,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  RATE_LIMITED: 429,
  CONFLICT: 409,
  PAYMENT_REQUIRED: 402,
  UNPROCESSABLE: 422,
  BAD_GATEWAY: 502,
  INTERNAL_ERROR: 500,
}

// ---------------------------------------------------------------------------
// AppError class
// ---------------------------------------------------------------------------

export class AppError extends Error {
  public readonly code: ErrorCode
  public readonly status: number
  public readonly details?: unknown

  constructor(
    code: ErrorCode,
    message: string,
    status?: number,
    details?: unknown
  ) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.status = status ?? DEFAULT_STATUS[code]
    this.details = details
  }
}

// ---------------------------------------------------------------------------
// Helpers — throw-safe constructors
// ---------------------------------------------------------------------------

export function notFound(resource = 'Resource'): AppError {
  return new AppError('NOT_FOUND', `${resource} not found`, 404)
}

export function unauthorized(message = 'Authentication required'): AppError {
  return new AppError('UNAUTHORIZED', message, 401)
}

export function forbidden(message = 'Insufficient permissions'): AppError {
  return new AppError('FORBIDDEN', message, 403)
}

export function conflict(message: string): AppError {
  return new AppError('CONFLICT', message, 409)
}

export function validationError(message: string, details?: unknown): AppError {
  return new AppError('VALIDATION_ERROR', message, 400, details)
}

// ---------------------------------------------------------------------------
// Zod error formatter
// ---------------------------------------------------------------------------

export function formatZodError(err: ZodError): { field: string; message: string }[] {
  return err.errors.map((e) => ({
    field: e.path.join('.') || '_root',
    message: e.message,
  }))
}

// ---------------------------------------------------------------------------
// Global error handler middleware
// ---------------------------------------------------------------------------

export function errorHandler(err: Error, c: Context): Response {
  // AppError — known, structured
  if (err instanceof AppError) {
    return c.json(
      {
        error: {
          code: err.code,
          message: err.message,
          ...(err.details !== undefined ? { details: err.details } : {}),
        },
      },
      err.status as Parameters<typeof c.json>[1]
    )
  }

  // ZodError — validation failure bubbled up without going through zValidator
  if (err instanceof ZodError) {
    return c.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: formatZodError(err),
        },
      },
      400
    )
  }

  // Unknown errors
  const isDev = process.env.NODE_ENV !== 'production'
  console.error('[errorHandler]', err)

  return c.json(
    {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        ...(isDev ? { stack: err.stack } : {}),
      },
    },
    500
  )
}
