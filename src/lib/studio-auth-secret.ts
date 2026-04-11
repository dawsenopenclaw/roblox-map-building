/**
 * Single source of truth for the HMAC secret used to sign/verify
 * Studio plugin JWTs.
 *
 * Historically the three studio routes (`auth`, `sync`, `execute`) each
 * resolved their own secret via an IIFE at module load time, with
 * subtly different fallback logic:
 *
 *   - auth/route.ts     used STUDIO_AUTH_SECRET ?? CLERK_SECRET_KEY
 *   - sync/route.ts     used STUDIO_AUTH_SECRET only (random fallback)
 *   - execute/route.ts  used STUDIO_AUTH_SECRET only (random fallback)
 *
 * That divergence is a silent foot-gun: a production deploy that set
 * CLERK_SECRET_KEY but forgot STUDIO_AUTH_SECRET would have `auth`
 * issue JWTs signed with the Clerk key, while `sync`/`execute` generated
 * per-lambda random secrets and rejected every one of those JWTs. The
 * user-visible symptom is "my Studio plugin pairs successfully but
 * every build command times out" — the classic "works for some, not for
 * all" Studio bug the session brief calls out.
 *
 * Additionally, reading env vars at module top-level can resolve before
 * Vercel has injected the runtime env on certain cold-start paths. All
 * callers go through `getStudioAuthSecret()` which reads lazily on first
 * use.
 *
 * Security note on the CLERK_SECRET_KEY fallback: execute/route.ts
 * previously argued (correctly) that a Clerk API key should not double
 * as an HMAC secret — if it leaks, blast radius widens beyond Studio.
 * We still accept it as a **dev-only** fallback to unblock local setups
 * that haven't configured STUDIO_AUTH_SECRET, but in production (NODE_ENV
 * === 'production') we fail loud instead.
 */

import crypto from 'crypto'

let cached: string | null = null

export function getStudioAuthSecret(): string {
  if (cached) return cached

  const explicit = process.env.STUDIO_AUTH_SECRET
  if (explicit && explicit.length >= 32) {
    cached = explicit
    return cached
  }

  const isProd = process.env.NODE_ENV === 'production'

  if (isProd) {
    // Fail loud. Silent per-lambda random secrets in production are a
    // footgun that breaks the Studio pairing flow for every user.
    if (explicit && explicit.length < 32) {
      throw new Error(
        '[studio-auth-secret] STUDIO_AUTH_SECRET is set but is shorter than 32 characters. ' +
          'Generate a fresh 32-byte secret (e.g. `openssl rand -hex 32`) and update the Vercel env var.',
      )
    }
    throw new Error(
      '[studio-auth-secret] STUDIO_AUTH_SECRET is not set. ' +
        'This must be a stable 32-byte secret shared across all lambdas or ' +
        'JWTs issued by one route will be rejected by another. ' +
        'Generate one with `openssl rand -hex 32` and set it in Vercel env vars.',
    )
  }

  // Development fallback. Prefer an explicit (short) STUDIO_AUTH_SECRET so
  // a dev can still choose their own value; otherwise derive a stable
  // secret from the Clerk key if present (keeps tokens stable across
  // `next dev` reloads); otherwise last-resort per-process random.
  if (explicit) {
    console.warn(
      '[studio-auth-secret] STUDIO_AUTH_SECRET is shorter than 32 chars. ' +
        'Acceptable in dev, rejected in production.',
    )
    cached = explicit
    return cached
  }

  const clerk = process.env.CLERK_SECRET_KEY
  if (clerk) {
    console.warn(
      '[studio-auth-secret] STUDIO_AUTH_SECRET is not set — deriving a dev secret from CLERK_SECRET_KEY. ' +
        'Set STUDIO_AUTH_SECRET for production.',
    )
    // Derive a 32-byte secret so the Clerk key itself never becomes the HMAC key.
    cached = crypto.createHash('sha256').update('forjegames:studio-auth:' + clerk).digest('hex')
    return cached
  }

  console.warn(
    '[studio-auth-secret] No STUDIO_AUTH_SECRET or CLERK_SECRET_KEY available — ' +
      'using a per-process random secret. Plugin pairings will not survive dev-server restarts.',
  )
  cached = crypto.randomBytes(32).toString('hex')
  return cached
}

/**
 * Test helper — resets the cached secret so tests can inject a fresh env.
 * Not exported from the package's public surface; prefer dependency
 * injection where possible.
 */
export function __resetStudioAuthSecretCache(): void {
  cached = null
}
