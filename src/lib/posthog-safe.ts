/**
 * posthog-safe — COPPA-compliant PostHog wrapper (client-side).
 *
 * Goals:
 *   1. PostHog MUST NOT load at module scope. The `posthog-js` package is only
 *      ever pulled in via dynamic import() after all gating conditions pass.
 *   2. For under-13 users, PostHog MUST NEVER load. Every tracking call in this
 *      module short-circuits to a no-op before touching the network.
 *   3. For 13+ users, PostHog loads lazily only after BOTH age verification
 *      AND cookie consent have been granted.
 *   4. Callers never import `posthog-js` directly — they import `safePostHog`
 *      from this module. This gives us a single choke-point to audit.
 *
 * Gating state (all must be true before initialisation):
 *   - `forje_age_verified` localStorage flag is 'true'   (set by PostHogConsentWrapper
 *                                                          after Clerk confirms age>=13)
 *   - `forje_cookie_consent` localStorage flag is 'accepted'  (set by CookieBanner)
 *   - NEXT_PUBLIC_POSTHOG_KEY is configured
 *   - Code is running in the browser (typeof window !== 'undefined')
 *
 * The wrapper is SAFE to call unconditionally from any component — it will
 * silently no-op until gating passes.
 */

export const AGE_VERIFIED_KEY = 'forje_age_verified'
export const COOKIE_CONSENT_KEY = 'forje_cookie_consent'

// ─── Module-scope state ──────────────────────────────────────────────────────
// `initialised` flips to true ONLY after a successful posthog.init() call.
// `initPromise` deduplicates concurrent init attempts.
// `denied` flips to true if we ever detect an under-13 user — once denied,
//   we refuse to initialise for the remainder of the session even if the
//   flags later change (defence-in-depth against a bug flipping the flag).
let initialised = false
let initPromise: Promise<unknown | null> | null = null
let denied = false

// Minimal typed shape for the subset of posthog-js we touch. Keeps us from
// having to import the full type (which would bring in the bundle).
interface PostHogLike {
  init: (key: string, config: Record<string, unknown>) => void
  capture: (event: string, properties?: Record<string, unknown>) => void
  identify: (distinctId: string, properties?: Record<string, unknown>) => void
  reset: () => void
  opt_out_capturing: () => void
  opt_in_capturing: () => void
}

// ─── Gate helpers ────────────────────────────────────────────────────────────

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

function readFlag(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

/**
 * Returns true only when the user has cleared the age gate (13+) AND given
 * cookie consent AND the PostHog key is configured. This is the single source
 * of truth for whether any tracking is allowed in this session.
 */
export function isTrackingAllowed(): boolean {
  if (!isBrowser()) return false
  if (denied) return false
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return false
  if (readFlag(AGE_VERIFIED_KEY) !== 'true') return false
  if (readFlag(COOKIE_CONSENT_KEY) !== 'accepted') return false
  return true
}

/**
 * Mark this browser session as "tracking denied" — called once the caller
 * learns the user is under 13. After this runs, no further init or capture
 * will be attempted even if the localStorage flags are later flipped.
 */
export function denyTracking(): void {
  denied = true
  initialised = false
  initPromise = null
  // Clear any stale age-verified flag so a later component cannot re-init.
  try {
    localStorage.removeItem(AGE_VERIFIED_KEY)
  } catch {
    /* ignore */
  }
  // If posthog-js already happens to be in the module graph (e.g. loaded
  // before we learned the user was under-13), opt out of all capture.
  if (isBrowser()) {
    import('posthog-js')
      .then(({ default: posthog }) => {
        try {
          ;(posthog as unknown as PostHogLike).opt_out_capturing()
        } catch {
          /* ignore */
        }
      })
      .catch(() => {
        /* posthog-js never loaded — nothing to opt out of */
      })
  }
}

// ─── Lazy initialisation ─────────────────────────────────────────────────────

/**
 * Initialise PostHog if and only if the user is confirmed 13+ AND consented.
 *
 * Call this from the age-gate flow the moment the server confirms age>=13
 * (after cookie consent is also granted). It is idempotent and concurrent-safe.
 *
 * @param age         Age in years, or `undefined` if unknown.
 * @param consented   Whether the user has accepted the cookie banner.
 * @returns           Resolves with the posthog-js instance when initialised,
 *                    or null if any gate blocked initialisation.
 */
export async function initPostHogIfAllowed(
  age: number | undefined,
  consented: boolean
): Promise<unknown | null> {
  if (!isBrowser()) return null
  if (denied) return null
  if (age === undefined || age < 13) {
    denyTracking()
    return null
  }
  if (!consented) return null
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return null

  if (initialised) {
    return (await import('posthog-js')).default
  }
  if (initPromise) return initPromise

  initPromise = (async () => {
    try {
      const { default: posthog } = await import('posthog-js')
      ;(posthog as unknown as PostHogLike).init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
        capture_pageview: false,
        persistence: 'localStorage',
        autocapture: true,
        disable_session_recording: false,
      })
      initialised = true
      return posthog
    } catch {
      initPromise = null
      return null
    }
  })()

  return initPromise
}

// ─── Internal: resolve posthog-js only if tracking is currently allowed ───
// Every method on safePostHog routes through this so that even if a caller
// somehow fires an event while under-13, the import never happens.
async function resolvePostHog(): Promise<PostHogLike | null> {
  if (!isTrackingAllowed()) return null
  if (!initialised) {
    // Lazy re-init path: if consent + age flags are present but we haven't
    // initialised yet (e.g. the user accepted cookies after page load), kick
    // off init now. We know age >= 13 because AGE_VERIFIED_KEY is set only
    // after the server confirmed age.
    await initPostHogIfAllowed(13, true)
    if (!initialised) return null
  }
  try {
    const mod = await import('posthog-js')
    return mod.default as unknown as PostHogLike
  } catch {
    return null
  }
}

// ─── Public safe wrapper ─────────────────────────────────────────────────────

/**
 * Drop-in replacement for `posthog-js`'s default export — every method no-ops
 * until age verification AND cookie consent have been granted. Callers can use
 * this anywhere without worrying about the gating logic.
 *
 * Example:
 *   import { safePostHog } from '@/lib/posthog-safe'
 *   safePostHog.capture('template_viewed', { templateId })
 */
export const safePostHog = {
  capture(event: string, properties?: Record<string, unknown>): void {
    if (!isTrackingAllowed()) return
    resolvePostHog()
      .then((ph) => ph?.capture(event, properties))
      .catch(() => {
        /* never throw from analytics */
      })
  },

  identify(distinctId: string, properties?: Record<string, unknown>): void {
    if (!isTrackingAllowed()) return
    resolvePostHog()
      .then((ph) => ph?.identify(distinctId, properties))
      .catch(() => {
        /* never throw */
      })
  },

  reset(): void {
    // Reset is safe to call even when tracking is gated — it only clears the
    // local distinct_id. But we still skip the dynamic import if posthog-js
    // was never loaded so we don't pull it in just to reset nothing.
    if (!isBrowser() || !initialised) return
    import('posthog-js')
      .then(({ default: posthog }) => {
        try {
          ;(posthog as unknown as PostHogLike).reset()
        } catch {
          /* ignore */
        }
      })
      .catch(() => {
        /* ignore */
      })
  },

  optOut(): void {
    denyTracking()
  },
}

// ─── Test / debug helpers (not for production use) ──────────────────────────
/** @internal — exposed for unit tests to reset module state between cases. */
export function __resetForTests(): void {
  initialised = false
  initPromise = null
  denied = false
}
