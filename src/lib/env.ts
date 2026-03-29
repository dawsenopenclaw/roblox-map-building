/**
 * Environment variable validation for the Next.js web app.
 * Import from here instead of using process.env directly.
 *
 * Server-only vars: never exported to the browser.
 * NEXT_PUBLIC_ vars: safe on both server and client.
 */
import { z } from 'zod'

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const serverSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z.string().optional(),

  // Redis
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),

  // Clerk (server)
  CLERK_SECRET_KEY: z.string().min(1, 'CLERK_SECRET_KEY is required'),
  CLERK_WEBHOOK_SECRET: z.string().optional(),
  CLERK_JWT_KEY: z.string().optional(),

  // Stripe
  STRIPE_SECRET_KEY: z
    .string()
    .optional()
    .refine(
      (val) => process.env.NODE_ENV !== 'production' || (val && val.length > 0),
      'STRIPE_SECRET_KEY is required in production'
    ),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_FREE_PRICE_ID: z.string().optional(),
  STRIPE_HOBBY_PRICE_ID: z.string().optional(),
  STRIPE_HOBBY_YEARLY_PRICE_ID: z.string().optional(),
  STRIPE_CREATOR_PRICE_ID: z.string().optional(),
  STRIPE_CREATOR_YEARLY_PRICE_ID: z.string().optional(),
  STRIPE_STUDIO_PRICE_ID: z.string().optional(),
  STRIPE_STUDIO_YEARLY_PRICE_ID: z.string().optional(),
  STRIPE_TOKEN_STARTER_PRICE_ID: z.string().optional(),
  STRIPE_TOKEN_CREATOR_PRICE_ID: z.string().optional(),
  STRIPE_TOKEN_PRO_PRICE_ID: z.string().optional(),
  STRIPE_CHARITY_ACCOUNT_ID: z.string().optional(),

  // Email
  RESEND_API_KEY: z.string().optional(),

  // Monitoring
  SENTRY_DSN: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),

  // Internal
  CRON_SECRET: z.string().optional(),
  API_URL: z.string().optional(),
  ALLOWED_ORIGINS: z.string().optional(),
  PORT: z.string().optional(),

  // AWS (backup)
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  BACKUP_S3_BUCKET: z.string().optional(),
})

const clientSchema = z.object({
  // App
  NEXT_PUBLIC_APP_URL: z.string().min(1, 'NEXT_PUBLIC_APP_URL is required'),
  NEXT_PUBLIC_API_URL: z.string().optional(),

  // Clerk (public)
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z
    .string()
    .min(1, 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required'),
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().optional(),
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().optional(),
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: z.string().optional(),
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: z.string().optional(),

  // Stripe (public)
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),

  // Monitoring (public)
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().optional(),
})

// ---------------------------------------------------------------------------
// Validation — runs once at module load
// ---------------------------------------------------------------------------

function formatErrors(errors: z.ZodError): string {
  return errors.issues
    .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
    .join('\n')
}

function validateServerEnv() {
  const result = serverSchema.safeParse(process.env)
  if (!result.success) {
    throw new Error(
      `Invalid server environment variables:\n${formatErrors(result.error)}\n\nCheck your .env.local file.`
    )
  }
  return result.data
}

function validateClientEnv() {
  const result = clientSchema.safeParse(process.env)
  if (!result.success) {
    throw new Error(
      `Invalid client environment variables:\n${formatErrors(result.error)}\n\nCheck your .env.local file.`
    )
  }
  return result.data
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

/**
 * Server-only environment variables.
 * Only import this in server components, API routes, or server actions.
 * Will throw at import time if required vars are missing.
 */
export const serverEnv = validateServerEnv()

/**
 * Public (NEXT_PUBLIC_) environment variables.
 * Safe to import on both server and client.
 */
export const clientEnv = validateClientEnv()

/**
 * Combined typed env — server context only.
 * Provides a single import for most server-side usage.
 */
export const env = { ...serverEnv, ...clientEnv }
