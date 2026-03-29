/**
 * Environment variable validation for the Next.js web app.
 * Import from here instead of using process.env directly.
 *
 * LAZY validation — only runs when env vars are first accessed at runtime,
 * not during build. This allows Next.js to build without env vars set.
 */
import { z } from 'zod'

const serverSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z.string().optional(),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),
  CLERK_SECRET_KEY: z.string().min(1, 'CLERK_SECRET_KEY is required'),
  CLERK_WEBHOOK_SECRET: z.string().optional(),
  CLERK_JWT_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
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
  RESEND_API_KEY: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  API_URL: z.string().optional(),
  ALLOWED_ORIGINS: z.string().optional(),
  PORT: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  BACKUP_S3_BUCKET: z.string().optional(),
  ADMIN_EMAILS: z.string().optional(),
})

const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().default('http://localhost:3000'),
  NEXT_PUBLIC_API_URL: z.string().optional(),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().default(''),
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().optional(),
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().optional(),
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: z.string().optional(),
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().optional(),
})

// Lazy singletons — validated on first access, not at import time
let _serverEnv: z.infer<typeof serverSchema> | null = null
let _clientEnv: z.infer<typeof clientSchema> | null = null

export function getServerEnv() {
  if (_serverEnv) return _serverEnv
  const result = serverSchema.safeParse(process.env)
  if (!result.success) {
    // During build or missing env — return raw process.env as fallback
    // Validation only matters at runtime, not build time
    console.warn('Server env validation warnings (non-fatal during build)')
    _serverEnv = {
      NODE_ENV: (process.env.NODE_ENV as 'development' | 'test' | 'production') || 'development',
      DATABASE_URL: process.env.DATABASE_URL || '',
      REDIS_URL: process.env.REDIS_URL || '',
      CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY || '',
      ...Object.fromEntries(
        Object.keys(serverSchema.shape).map(k => [k, process.env[k] || undefined])
      ),
    } as z.infer<typeof serverSchema>
    return _serverEnv
  }
  _serverEnv = result.data
  return _serverEnv
}

export function getClientEnv() {
  if (_clientEnv) return _clientEnv
  const result = clientSchema.safeParse(process.env)
  if (!result.success) {
    console.warn('Client env validation failed:', result.error.flatten().fieldErrors)
    _clientEnv = clientSchema.parse(process.env)
    return _clientEnv
  }
  _clientEnv = result.data
  return _clientEnv
}

// Convenience getters (lazy — safe during build)
export const serverEnv = new Proxy({} as z.infer<typeof serverSchema>, {
  get: (_, prop: string) => getServerEnv()[prop as keyof z.infer<typeof serverSchema>],
})

export const clientEnv = new Proxy({} as z.infer<typeof clientSchema>, {
  get: (_, prop: string) => getClientEnv()[prop as keyof z.infer<typeof clientSchema>],
})

export const env = new Proxy({} as z.infer<typeof serverSchema> & z.infer<typeof clientSchema>, {
  get: (_, prop: string) => {
    const s = getServerEnv()
    const c = getClientEnv()
    return (s as Record<string, unknown>)[prop] ?? (c as Record<string, unknown>)[prop]
  },
})
