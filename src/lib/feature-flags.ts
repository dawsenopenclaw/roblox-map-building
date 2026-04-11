'use client'
/**
 * Feature flags & A/B testing — ForjeGames
 * ─────────────────────────────────────────
 * Thin, COPPA-safe wrapper around PostHog's feature-flag + experiment APIs.
 *
 * All reads go through the same defense-in-depth gates the rest of analytics
 * uses (see src/lib/analytics-client.ts, src/components/PostHogProvider.tsx):
 *
 *   1. Runs only in the browser (typeof window !== 'undefined')
 *   2. `forje_age_verified === 'true'` in localStorage (age gate passed)
 *   3. `isUnder13 !== true` from AnalyticsContext (COPPA: under-13s get defaults)
 *   4. Dynamic import of posthog-js — never in the initial bundle
 *
 * Under-13 users, unverified users, and SSR all resolve to the provided
 * default value / "control" variant and NEVER send any exposure events.
 *
 * Local overrides (via `setLocalFlagOverride` / the admin panel) bypass
 * PostHog entirely and are intended for development & QA only.
 */

import {
  createElement,
  useContext,
  useEffect,
  useState,
  type ComponentType,
} from 'react'
import { AnalyticsContext } from '@/components/AnalyticsProvider'
import { safePostHog, isTrackingAllowed } from '@/lib/posthog-safe'

// ─── Flag & experiment catalogues ────────────────────────────────────────────

/**
 * Boolean / multivariate feature flags defined in PostHog.
 * Keep the keys stable — they are the PostHog flag identifiers.
 */
export const FLAGS = {
  ENABLE_VOICE_INPUT: 'voice-input-enabled',
  ENABLE_CANVAS_EDITOR: 'canvas-editor-enabled',
  SHOW_ROBUX_PAYMENTS: 'robux-payments-shown',
  NEW_PRICING_PAGE: 'new-pricing-page',
  ENABLE_IMAGE_TO_MAP: 'image-to-map-enabled',
  ENABLE_GAME_DNA: 'game-dna-enabled',
  ENABLE_TEAM_WORKSPACES: 'team-workspaces-enabled',
  ENABLE_MARKETPLACE_PAYOUTS: 'marketplace-payouts-enabled',
  SHOW_REFERRAL_PROGRAM: 'referral-program-shown',
  NEW_ONBOARDING_VIDEO: 'onboarding-video-shown',
  ENABLE_PUBLIC_TEMPLATES: 'public-templates-enabled',
  SHOW_ACHIEVEMENT_TOASTS: 'achievement-toasts-shown',
} as const

export type FlagKey = (typeof FLAGS)[keyof typeof FLAGS]

/**
 * Multi-arm experiments. `variants[0]` is always the control / fallback.
 */
export const EXPERIMENTS = {
  ONBOARDING_FLOW: {
    key: 'onboarding-v2',
    variants: ['control', 'simplified', 'video'] as const,
  },
  PRICING_LAYOUT: {
    key: 'pricing-layout',
    variants: ['cards', 'table', 'slider'] as const,
  },
  SIGNUP_CTA_COPY: {
    key: 'signup-cta-copy',
    variants: ['control', 'build-free', 'start-creating'] as const,
  },
  DASHBOARD_HERO: {
    key: 'dashboard-hero',
    variants: ['control', 'video', 'interactive'] as const,
  },
} as const

export type ExperimentKey = (typeof EXPERIMENTS)[keyof typeof EXPERIMENTS]['key']
export type ExperimentDef<V extends readonly string[] = readonly string[]> = {
  key: string
  variants: V
}

// ─── Local overrides (dev / QA only) ──────────────────────────────────────────

const LOCAL_OVERRIDE_PREFIX = 'forje_ff_override:'

function readOverride(key: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(LOCAL_OVERRIDE_PREFIX + key)
  } catch {
    return null
  }
}

export function setLocalFlagOverride(key: string, value: boolean | string | null): void {
  if (typeof window === 'undefined') return
  try {
    if (value === null) {
      window.localStorage.removeItem(LOCAL_OVERRIDE_PREFIX + key)
    } else {
      window.localStorage.setItem(LOCAL_OVERRIDE_PREFIX + key, String(value))
    }
    // Nudge any mounted hooks to re-read
    window.dispatchEvent(new CustomEvent('forje:ff-override-changed', { detail: { key } }))
  } catch {
    /* ignore */
  }
}

export function getLocalFlagOverride(key: string): string | null {
  return readOverride(key)
}

// ─── COPPA / consent gate ─────────────────────────────────────────────────────

/**
 * Returns true when it is safe to read from PostHog. Defers to the single
 * source of truth in posthog-safe.ts (age gate + cookie consent + env key)
 * and additionally blocks if the caller already knows the user is under 13.
 */
function canUsePostHog(isUnder13: boolean | undefined): boolean {
  if (isUnder13 === true) return false
  return isTrackingAllowed()
}

// ─── Exposure tracking ────────────────────────────────────────────────────────

/**
 * Manually fire a `$feature_flag_called` / `experiment_viewed` event.
 * No-op for SSR, under-13 users, and users who haven't passed the age gate.
 */
export function trackExperimentExposure(
  experimentKey: string,
  variant: string,
  userContext?: { isUnder13?: boolean },
): void {
  if (!canUsePostHog(userContext?.isUnder13)) return
  // Route through safePostHog so the capture goes through the same COPPA
  // age-gate / cookie-consent / lazy-init chain as every other event.
  safePostHog.capture('experiment_viewed', {
    $app: 'ForjeGames',
    experiment_key: experimentKey,
    variant,
  })
}

// ─── useFeatureFlag ───────────────────────────────────────────────────────────

/**
 * React hook that reads a boolean feature flag from PostHog.
 *
 * Returns `defaultValue` during SSR, before PostHog has loaded, for under-13
 * users, and for any user who has not passed the age gate. Local overrides
 * (set via the admin panel) take precedence over PostHog and the default.
 */
export function useFeatureFlag(flagKey: string, defaultValue = false): boolean {
  const ctx = useContext(AnalyticsContext)
  const isUnder13 = ctx?.userContext?.isUnder13

  const [value, setValue] = useState<boolean>(() => {
    const override = readOverride(flagKey)
    if (override !== null) return override === 'true'
    return defaultValue
  })

  useEffect(() => {
    let cancelled = false

    // 1. Local override wins
    const override = readOverride(flagKey)
    if (override !== null) {
      setValue(override === 'true')
      return
    }

    // 2. COPPA / consent gate — fall back to default
    if (!canUsePostHog(isUnder13)) {
      setValue(defaultValue)
      return
    }

    // 3. Read from PostHog
    import('posthog-js')
      .then(({ default: posthog }) => {
        if (cancelled) return
        const ph = posthog.isFeatureEnabled?.(flagKey)
        setValue(typeof ph === 'boolean' ? ph : defaultValue)

        // Re-read when PostHog flushes new flag values
        const off = posthog.onFeatureFlags?.(() => {
          if (cancelled) return
          const fresh = posthog.isFeatureEnabled?.(flagKey)
          setValue(typeof fresh === 'boolean' ? fresh : defaultValue)
        })

        if (typeof off === 'function') {
          // Store cleanup on the cancelled-guard via closure
          const origCancel = () => {
            cancelled = true
            try {
              off()
            } catch {
              /* ignore */
            }
          }
          ;(window as unknown as { __forje_ff_cleanups?: Array<() => void> }).__forje_ff_cleanups ??= []
          ;(window as unknown as { __forje_ff_cleanups: Array<() => void> }).__forje_ff_cleanups.push(origCancel)
        }
      })
      .catch(() => {
        if (!cancelled) setValue(defaultValue)
      })

    // Listen for local-override changes from the admin panel
    const onOverrideChange = (e: Event) => {
      const detail = (e as CustomEvent<{ key: string }>).detail
      if (detail?.key !== flagKey) return
      const next = readOverride(flagKey)
      setValue(next === null ? defaultValue : next === 'true')
    }
    window.addEventListener('forje:ff-override-changed', onOverrideChange)

    return () => {
      cancelled = true
      window.removeEventListener('forje:ff-override-changed', onOverrideChange)
    }
  }, [flagKey, defaultValue, isUnder13])

  return value
}

// ─── useExperiment ────────────────────────────────────────────────────────────

/**
 * React hook that resolves an A/B experiment to a single variant.
 *
 * - `variants[0]` is always the control / fallback
 * - Fires `experiment_viewed` exactly once per mount (after PostHog assigns)
 * - SSR / under-13 / unverified users always receive the control variant
 *   and NEVER fire an exposure event
 */
export function useExperiment<V extends readonly string[]>(
  experimentKey: string,
  variants: V,
): V[number] {
  const ctx = useContext(AnalyticsContext)
  const isUnder13 = ctx?.userContext?.isUnder13
  const control = variants[0] as V[number]

  const [variant, setVariant] = useState<V[number]>(() => {
    const override = readOverride(experimentKey)
    if (override !== null && (variants as readonly string[]).includes(override)) {
      return override as V[number]
    }
    return control
  })

  useEffect(() => {
    let cancelled = false
    let exposureFired = false

    const fireExposure = (assigned: V[number]) => {
      if (exposureFired) return
      exposureFired = true
      trackExperimentExposure(experimentKey, assigned, { isUnder13 })
    }

    // 1. Local override wins — still fire exposure so test traffic shows up
    const override = readOverride(experimentKey)
    if (override !== null && (variants as readonly string[]).includes(override)) {
      const assigned = override as V[number]
      setVariant(assigned)
      fireExposure(assigned)
      return
    }

    // 2. COPPA / consent — hand back control, do NOT fire exposure
    if (!canUsePostHog(isUnder13)) {
      setVariant(control)
      return
    }

    // 3. Ask PostHog for the assigned variant
    import('posthog-js')
      .then(({ default: posthog }) => {
        if (cancelled) return
        const raw = posthog.getFeatureFlag?.(experimentKey)
        const assigned =
          typeof raw === 'string' && (variants as readonly string[]).includes(raw)
            ? (raw as V[number])
            : control
        setVariant(assigned)
        fireExposure(assigned)
      })
      .catch(() => {
        if (!cancelled) setVariant(control)
      })

    const onOverrideChange = (e: Event) => {
      const detail = (e as CustomEvent<{ key: string }>).detail
      if (detail?.key !== experimentKey) return
      const next = readOverride(experimentKey)
      if (next !== null && (variants as readonly string[]).includes(next)) {
        setVariant(next as V[number])
      } else {
        setVariant(control)
      }
    }
    window.addEventListener('forje:ff-override-changed', onOverrideChange)

    return () => {
      cancelled = true
      window.removeEventListener('forje:ff-override-changed', onOverrideChange)
    }
    // variants is treated as stable by convention — it's a `const` tuple at the call site
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [experimentKey, isUnder13])

  return variant
}

// ─── withFeatureFlag HOC ──────────────────────────────────────────────────────

/**
 * Higher-order component that only renders `Component` when the named flag
 * resolves truthy. Optional `FallbackComponent` is rendered otherwise.
 *
 * Usage:
 *   const VoiceBuildButton = withFeatureFlag(
 *     FLAGS.ENABLE_VOICE_INPUT,
 *     VoiceBuildButtonImpl,
 *     VoiceBuildButtonLegacy,
 *   )
 */
export function withFeatureFlag<P extends object>(
  flagKey: string,
  Component: ComponentType<P>,
  FallbackComponent?: ComponentType<P>,
): ComponentType<P> {
  const Wrapped = (props: P) => {
    const enabled = useFeatureFlag(flagKey, false)
    if (enabled) return createElement(Component, props)
    if (FallbackComponent) return createElement(FallbackComponent, props)
    return null
  }
  Wrapped.displayName = `withFeatureFlag(${Component.displayName || Component.name || 'Component'})`
  return Wrapped
}

// ─── Utilities used by the admin panel ────────────────────────────────────────

export interface FlagSnapshot {
  key: string
  constName: string
  posthogValue: boolean | string | undefined
  overrideValue: string | null
  effective: boolean | string
}

/**
 * Dump the current state of every registered flag (PostHog value + local
 * override). Safe to call during SSR — returns defaults in that case.
 */
export async function snapshotFlags(): Promise<FlagSnapshot[]> {
  const entries = Object.entries(FLAGS) as Array<[keyof typeof FLAGS, FlagKey]>

  if (typeof window === 'undefined') {
    return entries.map(([constName, key]) => ({
      key,
      constName,
      posthogValue: undefined,
      overrideValue: null,
      effective: false,
    }))
  }

  let posthog: typeof import('posthog-js').default | null = null
  try {
    posthog = (await import('posthog-js')).default
  } catch {
    posthog = null
  }

  return entries.map(([constName, key]) => {
    const override = readOverride(key)
    const posthogValue =
      posthog && typeof posthog.isFeatureEnabled === 'function'
        ? posthog.isFeatureEnabled(key)
        : undefined
    const effective: boolean | string =
      override !== null
        ? override === 'true'
          ? true
          : override === 'false'
            ? false
            : override
        : posthogValue ?? false
    return { key, constName, posthogValue, overrideValue: override, effective }
  })
}
