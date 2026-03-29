/**
 * Hono middleware factory for Zod body validation.
 *
 * Usage:
 *   import { validate } from '../middleware/validate'
 *   import { mySchema } from '../lib/validators'
 *
 *   router.post('/', validate(mySchema), async (c) => {
 *     const body = c.get('validatedBody') as z.infer<typeof mySchema>
 *     ...
 *   })
 *
 * Behaviour:
 *   - Parses JSON body (returns 400 if unparseable)
 *   - Strips unknown fields via Zod .strip()
 *   - Transforms types (string ISO dates → Date objects) as declared in schemas
 *   - On failure: returns 400 with structured { error: { code, message, details } }
 *   - On success: stores parsed+transformed value in context as 'validatedBody'
 */

import type { Context, Next } from 'hono'
import { z, ZodTypeAny } from 'zod'
import { formatZodError } from '../lib/errors'

export function validate<T extends ZodTypeAny>(schema: T) {
  return async (c: Context, next: Next): Promise<Response | void> => {
    // Parse raw JSON — surface parse errors as 400 not 500
    let raw: unknown
    try {
      raw = await c.req.json()
    } catch {
      return c.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request body must be valid JSON',
            details: [],
          },
        },
        400
      )
    }

    // Run Zod — strip() drops extra keys, transform() coerces types
    const result = schema.safeParse(raw)

    if (!result.success) {
      return c.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: formatZodError(result.error),
          },
        },
        400
      )
    }

    // Store the clean, transformed value for the route handler
    c.set('validatedBody', result.data as z.infer<T>)
    await next()
  }
}

/**
 * Validate query string parameters against a Zod schema.
 * Stores parsed value in context as 'validatedQuery'.
 *
 * Usage:
 *   router.get('/', validateQuery(paginationSchema), async (c) => {
 *     const { page, limit } = c.get('validatedQuery')
 *   })
 */
export function validateQuery<T extends ZodTypeAny>(schema: T) {
  return async (c: Context, next: Next): Promise<Response | void> => {
    // c.req.query() returns Record<string, string>
    const raw = c.req.query()

    const result = schema.safeParse(raw)

    if (!result.success) {
      return c.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Query parameter validation failed',
            details: formatZodError(result.error),
          },
        },
        400
      )
    }

    c.set('validatedQuery', result.data as z.infer<T>)
    await next()
  }
}
