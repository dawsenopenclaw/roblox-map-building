/**
 * src/lib/env-check.ts
 *
 * Startup environment validation. Runs outside the Zod-schema system so it can
 * be called from scripts and plain Node processes (not just Next.js server code).
 *
 * Usage:
 *   import { validateEnvironment } from '@/lib/env-check'
 *   const { valid, missing, warnings } = validateEnvironment()
 */

export interface EnvValidationResult {
  valid: boolean
  missing: string[]
  warnings: string[]
}

interface EnvVarSpec {
  key: string
  required: boolean
  /** Human-readable description shown in warning messages */
  description: string
  /** Feature degraded or disabled when missing */
  fallback?: string
}

const REQUIRED_VARS: EnvVarSpec[] = [
  {
    key: 'ANTHROPIC_API_KEY',
    required: true,
    description: 'Claude AI — core agent engine',
  },
  {
    key: 'CLERK_SECRET_KEY',
    required: true,
    description: 'Clerk auth — server-side operations',
  },
  {
    key: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    required: true,
    description: 'Clerk auth — client-side SDK',
  },
  {
    key: 'STRIPE_SECRET_KEY',
    required: true,
    description: 'Stripe billing — subscriptions and usage',
  },
  {
    key: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    required: true,
    description: 'Stripe billing — frontend Elements',
  },
  {
    key: 'DATABASE_URL',
    required: true,
    description: 'Prisma — primary database connection',
  },
]

const OPTIONAL_VARS: EnvVarSpec[] = [
  {
    key: 'MESHY_API_KEY',
    required: false,
    description: 'Meshy 3D generation',
    fallback: '3D generation will use demo mode',
  },
  {
    key: 'FAL_KEY',
    required: false,
    description: 'fal.ai texture generation',
    fallback: 'texture generation will use demo mode',
  },
  {
    key: 'REDIS_URL',
    required: false,
    description: 'Redis job queue (BullMQ)',
    fallback: 'job queue will be disabled — async generation unavailable',
  },
  {
    key: 'UPSTASH_REDIS_REST_URL',
    required: false,
    description: 'Upstash Redis (alternative to REDIS_URL)',
    fallback: undefined, // paired with REDIS_URL — suppress individual warning
  },
  {
    key: 'ROBLOX_OPEN_CLOUD_API_KEY',
    required: false,
    description: 'Roblox Open Cloud — asset upload',
    fallback: 'Roblox upload will be disabled',
  },
  {
    key: 'RESEND_API_KEY',
    required: false,
    description: 'Resend email delivery',
    fallback: 'transactional emails will be disabled',
  },
  {
    key: 'SENTRY_DSN',
    required: false,
    description: 'Sentry error tracking',
    fallback: 'error tracking will be disabled',
  },
]

function has(key: string): boolean {
  return Boolean(process.env[key]?.trim())
}

/**
 * Validates all required and optional environment variables.
 *
 * - `missing`  — required vars that are not set; prevents startup in production
 * - `warnings` — optional vars that are not set; logs helpful fallback messages
 * - `valid`    — false if any required var is missing
 */
export function validateEnvironment(): EnvValidationResult {
  const missing: string[] = []
  const warnings: string[] = []

  // Required vars — must be present
  for (const spec of REQUIRED_VARS) {
    if (!has(spec.key)) {
      missing.push(spec.key)
    }
  }

  // Optional vars — warn with actionable fallback message
  for (const spec of OPTIONAL_VARS) {
    if (!spec.fallback) continue // suppressed (paired var)
    if (!has(spec.key)) {
      // Special case: Redis — either REDIS_URL or UPSTASH_REDIS_REST_URL is acceptable
      if (spec.key === 'REDIS_URL' && has('UPSTASH_REDIS_REST_URL')) continue
      warnings.push(`${spec.key} not set — ${spec.fallback}`)
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  }
}

/**
 * Runs validateEnvironment() and emits console output.
 * Call this at app startup (e.g. in instrumentation.ts or a server component).
 *
 * In production with missing required vars, throws so the process cannot start.
 */
export function assertEnvironment(): void {
  const { valid, missing, warnings } = validateEnvironment()

  for (const warn of warnings) {
    console.warn(`[env] WARNING: ${warn}`)
  }

  if (!valid) {
    const lines = missing.map((k) => `  - ${k}`).join('\n')
    const message =
      `[env] FATAL: Required environment variables are not set:\n${lines}\n` +
      `Copy .env.example to .env.local and fill in the missing values.`

    if (process.env.NODE_ENV === 'production') {
      throw new Error(message)
    } else {
      console.error(message)
    }
  }
}
