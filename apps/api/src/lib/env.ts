/**
 * Environment variable validation for the Hono API backend.
 * Import from here instead of using process.env directly.
 * Throws a clear error at startup if any required variable is missing.
 */
import { z } from 'zod'

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const apiEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Redis
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),

  // Clerk
  CLERK_SECRET_KEY: z.string().min(1, 'CLERK_SECRET_KEY is required'),
  CLERK_JWT_KEY: z.string().optional(),

  // AI providers
  ANTHROPIC_API_KEY: z.string().optional(),
  DEEPGRAM_API_KEY: z.string().optional(),
  FAL_KEY: z.string().optional(),
  MESHY_API_KEY: z.string().optional(),

  // Email
  RESEND_API_KEY: z.string().optional(),

  // Monitoring
  SENTRY_DSN: z.string().optional(),

  // App
  NEXT_PUBLIC_APP_URL: z.string().min(1, 'NEXT_PUBLIC_APP_URL is required'),
  ALLOWED_ORIGINS: z.string().optional(),
  PORT: z.string().optional(),
})

// ---------------------------------------------------------------------------
// Validation — runs once at module load (startup)
// ---------------------------------------------------------------------------

function formatErrors(errors: z.ZodError): string {
  return errors.issues
    .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
    .join('\n')
}

function validateEnv() {
  const result = apiEnvSchema.safeParse(process.env)
  if (!result.success) {
    throw new Error(
      `Invalid API environment variables:\n${formatErrors(result.error)}\n\nCheck your .env file.`
    )
  }
  return result.data
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

/**
 * Validated, typed environment variables for the Hono API.
 * Access all env vars through this object — never use process.env directly.
 */
export const env = validateEnv()
