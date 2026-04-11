#!/usr/bin/env tsx
/**
 * verify-clerk-keys.ts
 *
 * Checks that NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (and CLERK_SECRET_KEY if present)
 * are production keys when running in a production environment.
 *
 * Behavior:
 *   - If the publishable key starts with `pk_live_`, logs success and exits 0.
 *   - If it starts with `pk_test_`:
 *       * In any environment: logs a colored warning.
 *       * If NODE_ENV=production or VERCEL_ENV=production: exits with code 1.
 *   - If the key is missing entirely: logs an error and exits 1.
 *
 * Usage:
 *   npm run verify:clerk
 *
 * See docs/CLERK_PRODUCTION_SETUP.md for how to obtain production keys.
 */

// ANSI color helpers — no external deps so this runs in any environment.
const RESET = '\x1b[0m'
const BOLD = '\x1b[1m'
const RED = '\x1b[31m'
const YELLOW = '\x1b[33m'
const GREEN = '\x1b[32m'
const CYAN = '\x1b[36m'
const GRAY = '\x1b[90m'

function color(code: string, text: string): string {
  // Respect NO_COLOR (https://no-color.org) and non-TTY stdout.
  if (process.env.NO_COLOR || !process.stdout.isTTY) return text
  return `${code}${text}${RESET}`
}

function info(msg: string): void {
  console.log(color(CYAN, '[verify:clerk] ') + msg)
}

function success(msg: string): void {
  console.log(color(GREEN, '[verify:clerk] ') + msg)
}

function warn(msg: string): void {
  console.warn(color(YELLOW, `${BOLD}[verify:clerk] WARNING:${RESET} `) + color(YELLOW, msg))
}

function error(msg: string): void {
  console.error(color(RED, `${BOLD}[verify:clerk] ERROR:${RESET} `) + color(RED, msg))
}

interface KeyCheck {
  name: string
  value: string | undefined
  livePrefix: string
  testPrefix: string
}

function stripWrappingQuotes(raw: string): string {
  // Env vars in .env.prod sometimes contain literal `\n` or wrapping quotes when copied manually.
  return raw
    .replace(/\\n$/, '')
    .replace(/^"|"$/g, '')
    .trim()
}

function checkKey(check: KeyCheck): 'live' | 'test' | 'missing' | 'unknown' {
  if (!check.value) return 'missing'
  const value = stripWrappingQuotes(check.value)
  if (value.startsWith(check.livePrefix)) return 'live'
  if (value.startsWith(check.testPrefix)) return 'test'
  return 'unknown'
}

function main(): void {
  const nodeEnv = process.env.NODE_ENV ?? 'development'
  const vercelEnv = process.env.VERCEL_ENV
  const isProduction = nodeEnv === 'production' || vercelEnv === 'production'

  info(
    `Checking Clerk keys (NODE_ENV=${color(BOLD, nodeEnv)}${
      vercelEnv ? `, VERCEL_ENV=${color(BOLD, vercelEnv)}` : ''
    })`,
  )

  const publishable: KeyCheck = {
    name: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    value: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    livePrefix: 'pk_live_',
    testPrefix: 'pk_test_',
  }

  const secret: KeyCheck = {
    name: 'CLERK_SECRET_KEY',
    value: process.env.CLERK_SECRET_KEY,
    livePrefix: 'sk_live_',
    testPrefix: 'sk_test_',
  }

  let failed = false
  let sawTestKey = false

  for (const check of [publishable, secret]) {
    const result = checkKey(check)

    switch (result) {
      case 'live':
        success(`${check.name} is a production key (${check.livePrefix}…)`)
        break
      case 'test':
        sawTestKey = true
        warn(
          `${check.name} is a ${color(BOLD, 'development')} key (${check.testPrefix}…). ` +
            `Replace with a ${check.livePrefix} key from https://dashboard.clerk.com.`,
        )
        info(color(GRAY, '  See docs/CLERK_PRODUCTION_SETUP.md for the full swap procedure.'))
        if (isProduction) failed = true
        break
      case 'missing':
        // Only the publishable key is strictly required for a check to run; the secret
        // key may not be present in local dev shells but must exist in production.
        if (check.name === 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY' || isProduction) {
          error(`${check.name} is not set.`)
          failed = true
        } else {
          info(color(GRAY, `${check.name} is not set (skipping — non-production env).`))
        }
        break
      case 'unknown':
        warn(
          `${check.name} does not match any known Clerk prefix ` +
            `(expected ${check.livePrefix} or ${check.testPrefix}).`,
        )
        if (isProduction) failed = true
        break
    }
  }

  if (failed) {
    error('Clerk key verification failed.')
    process.exit(1)
  }

  if (sawTestKey) {
    warn('Test keys detected but NODE_ENV is not production — not failing the build.')
    process.exit(0)
  }

  success('All Clerk keys look good.')
  process.exit(0)
}

main()
