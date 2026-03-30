/**
 * Environment variable validation for the Next.js web app.
 * Import from here instead of using process.env directly.
 *
 * Strategy:
 *   - Build time (NEXT_PHASE=phase-production-build): lazy, non-throwing
 *   - Runtime production: hard throw on missing critical vars
 *   - Runtime dev/test: warn and fall back so local boot still works
 */
import { z } from 'zod'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns true when running inside a Next.js production build (not actual server runtime). */
function isBuildPhase(): boolean {
  return process.env.NEXT_PHASE === 'phase-production-build'
}

/** Required in production at runtime, optional elsewhere. */
function prodRequired(label: string) {
  return z.string().optional().transform((val, ctx) => {
    if (!val && process.env.NODE_ENV === 'production' && !isBuildPhase()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${label} is required in production`,
        fatal: true,
      })
      return z.NEVER
    }
    return val ?? ''
  })
}

// ---------------------------------------------------------------------------
// Server-side schema
// ---------------------------------------------------------------------------

const serverSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // ── Database ──────────────────────────────────────────────────────────────
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z.string().optional(),

  // ── Redis / Upstash ───────────────────────────────────────────────────────
  // Accept either classic REDIS_URL or Upstash REST credentials
  REDIS_URL: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // ── Auth — Clerk ──────────────────────────────────────────────────────────
  CLERK_SECRET_KEY: z.string().min(1, 'CLERK_SECRET_KEY is required'),
  CLERK_WEBHOOK_SECRET: z.string().optional(),
  CLERK_JWT_KEY: z.string().optional(),

  // ── Payments — Stripe ─────────────────────────────────────────────────────
  STRIPE_SECRET_KEY: prodRequired('STRIPE_SECRET_KEY'),
  STRIPE_RESTRICTED_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: prodRequired('STRIPE_WEBHOOK_SECRET'),
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

  // ── AI Providers ──────────────────────────────────────────────────────────
  ANTHROPIC_API_KEY: prodRequired('ANTHROPIC_API_KEY'),
  GEMINI_API_KEY: z.string().optional(),
  MESHY_API_KEY: z.string().optional(),
  /** fal.ai SDK reads FAL_KEY specifically — do not rename */
  FAL_KEY: z.string().optional(),
  DEEPGRAM_API_KEY: z.string().optional(),
  ELEVENLABS_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),

  // ── Email ─────────────────────────────────────────────────────────────────
  RESEND_API_KEY: prodRequired('RESEND_API_KEY'),

  // ── Analytics / Monitoring ────────────────────────────────────────────────
  SENTRY_DSN: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
  /** Server-side PostHog key (distinct from the NEXT_PUBLIC_ client key) */
  POSTHOG_API_KEY: z.string().optional(),
  POSTHOG_HOST: z.string().optional().default('https://app.posthog.com'),
  BETTER_UPTIME_API_KEY: z.string().optional(),

  // ── Security / Infra ──────────────────────────────────────────────────────
  CRON_SECRET: prodRequired('CRON_SECRET'),
  ADMIN_EMAILS: z.string().optional(),
  ALLOWED_ORIGINS: z.string().optional(),

  // ── App routing ───────────────────────────────────────────────────────────
  API_URL: z.string().optional(),
  PORT: z.string().optional(),

  // ── AWS / Backups ─────────────────────────────────────────────────────────
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  BACKUP_S3_BUCKET: z.string().optional(),

  // ── Feature flags ─────────────────────────────────────────────────────────
  DEMO_MODE: z.string().optional().transform((v) => v === 'true'),
})

// ---------------------------------------------------------------------------
// Client-side (NEXT_PUBLIC_*) schema
// ---------------------------------------------------------------------------

const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().default('https://forjegames.com'),
  NEXT_PUBLIC_API_URL: z.string().optional(),

  // Clerk
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1, 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required'),
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().optional().default('/sign-in'),
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().optional().default('/sign-up'),
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: z.string().optional().default('/editor'),
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: z.string().optional().default('/onboarding'),

  // Stripe
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),

  // Monitoring
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().optional().default('https://app.posthog.com'),

  // Feature flags
  NEXT_PUBLIC_DEMO_MODE: z.string().optional().transform((v) => v === 'true'),
})

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ServerEnv = z.infer<typeof serverSchema>
type ClientEnv = z.infer<typeof clientSchema>

// ---------------------------------------------------------------------------
// Lazy singletons — validated on first access, never at import/build time
// ---------------------------------------------------------------------------

let _serverEnv: ServerEnv | null = null
let _clientEnv: ClientEnv | null = null

export function getServerEnv(): ServerEnv {
  if (_serverEnv) return _serverEnv

  const result = serverSchema.safeParse(process.env)

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors
    const errorMessages = Object.entries(errors)
      .map(([k, v]) => `  ${k}: ${(v as string[])?.join(', ')}`)
      .join('\n')

    if (process.env.NODE_ENV === 'production' && !isBuildPhase()) {
      // Hard crash in production — misconfigured servers must not silently serve broken state
      throw new Error(
        `[env] Critical environment variables missing or invalid in production:\n${errorMessages}\n\nFix your deployment config and redeploy.`
      )
    }

    // Dev / test / build — continue with best-effort fallback values
    _serverEnv = {
      ...Object.fromEntries(
        Object.keys(serverSchema.shape).map((k) => [k, process.env[k]])
      ),
      NODE_ENV: (process.env.NODE_ENV as 'development' | 'test' | 'production') ?? 'development',
      DATABASE_URL: process.env.DATABASE_URL ?? '',
      CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY ?? '',
      DEMO_MODE: process.env.DEMO_MODE === 'true',
      POSTHOG_HOST: process.env.POSTHOG_HOST ?? 'https://app.posthog.com',
      // prodRequired fields default to empty string when absent in non-prod
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ?? '',
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ?? '',
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? '',
      RESEND_API_KEY: process.env.RESEND_API_KEY ?? '',
      CRON_SECRET: process.env.CRON_SECRET ?? '',
    } as ServerEnv
    return _serverEnv
  }

  _serverEnv = result.data
  return _serverEnv
}

export function getClientEnv(): ClientEnv {
  if (_clientEnv) return _clientEnv

  const result = clientSchema.safeParse(process.env)

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors
    const errorMessages = Object.entries(errors)
      .map(([k, v]) => `  ${k}: ${(v as string[])?.join(', ')}`)
      .join('\n')

    if (process.env.NODE_ENV === 'production' && !isBuildPhase()) {
      throw new Error(
        `[env] Critical client environment variables missing in production:\n${errorMessages}`
      )
    }

    _clientEnv = {
      ...Object.fromEntries(
        Object.keys(clientSchema.shape).map((k) => [k, process.env[k]])
      ),
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? 'https://forjegames.com',
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '',
      NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? '/sign-in',
      NEXT_PUBLIC_CLERK_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL ?? '/sign-up',
      NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL ?? '/editor',
      NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL ?? '/onboarding',
      NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com',
      NEXT_PUBLIC_DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE === 'true',
    } as ClientEnv
    return _clientEnv
  }

  _clientEnv = result.data
  return _clientEnv
}

// ---------------------------------------------------------------------------
// Convenience proxy exports — lazy, safe during build
// ---------------------------------------------------------------------------

export const serverEnv = new Proxy({} as ServerEnv, {
  get: (_, prop: string) => getServerEnv()[prop as keyof ServerEnv],
})

export const clientEnv = new Proxy({} as ClientEnv, {
  get: (_, prop: string) => getClientEnv()[prop as keyof ClientEnv],
})

/** Combined proxy — server vars take precedence over client vars on name collision */
export const env = new Proxy({} as ServerEnv & ClientEnv, {
  get: (_, prop: string) => {
    const s = getServerEnv()
    const c = getClientEnv()
    return (s as Record<string, unknown>)[prop] ?? (c as Record<string, unknown>)[prop]
  },
})

export type { ServerEnv, ClientEnv }
