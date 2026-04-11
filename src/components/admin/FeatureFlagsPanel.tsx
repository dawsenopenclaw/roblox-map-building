'use client'
/**
 * FeatureFlagsPanel — admin dashboard widget.
 *
 * - Lists every flag defined in `FLAGS` with its current PostHog value
 * - Lists every experiment with variants + conversion rates
 * - Lets admins apply a per-browser local override (dev / QA only —
 *   overrides live in localStorage and are never persisted server-side)
 *
 * This component respects the same COPPA gates as the rest of analytics:
 * if PostHog can't be loaded, the panel still renders and simply reports
 * "unavailable" for the live values.
 */

import { useCallback, useEffect, useState } from 'react'
import {
  EXPERIMENTS,
  FLAGS,
  getLocalFlagOverride,
  setLocalFlagOverride,
  snapshotFlags,
  type FlagSnapshot,
} from '@/lib/feature-flags'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExperimentRow {
  constName: string
  key: string
  variants: readonly string[]
  assigned: string | null
  override: string | null
  conversionByVariant: Record<string, { exposures: number; conversions: number }>
}

interface FeatureFlagsPanelProps {
  /**
   * Optional pre-fetched conversion stats keyed by experiment key.
   * Shape: { [experimentKey]: { [variant]: { exposures, conversions } } }
   * When omitted, the panel shows a dash for each cell.
   */
  conversionStats?: Record<string, Record<string, { exposures: number; conversions: number }>>
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRate(exposures: number, conversions: number): string {
  if (!exposures) return '—'
  return `${((conversions / exposures) * 100).toFixed(1)}%`
}

function badgeClass(state: 'on' | 'off' | 'unknown' | 'override'): string {
  switch (state) {
    case 'on':
      return 'bg-green-500/15 text-green-400 border-green-500/30'
    case 'off':
      return 'bg-red-500/15 text-red-400 border-red-500/30'
    case 'override':
      return 'bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/30'
    default:
      return 'bg-[#1c1c1c] text-[#B0B0B0] border-[#2a2a2a]'
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FeatureFlagsPanel({ conversionStats }: FeatureFlagsPanelProps = {}) {
  const [flags, setFlags] = useState<FlagSnapshot[]>([])
  const [experiments, setExperiments] = useState<ExperimentRow[]>([])
  const [loading, setLoading] = useState(true)

  // Load flag + experiment snapshots
  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const snap = await snapshotFlags()
      setFlags(snap)

      // Build experiment rows — assigned variant comes from posthog-js at runtime
      let posthog: typeof import('posthog-js').default | null = null
      if (typeof window !== 'undefined') {
        try {
          posthog = (await import('posthog-js')).default
        } catch {
          posthog = null
        }
      }

      const expRows: ExperimentRow[] = Object.entries(EXPERIMENTS).map(
        ([constName, def]) => {
          const override = getLocalFlagOverride(def.key)
          const rawAssigned = posthog?.getFeatureFlag?.(def.key)
          const assigned =
            typeof rawAssigned === 'string' ? rawAssigned : override ?? null
          const conversionByVariant: ExperimentRow['conversionByVariant'] = {}
          for (const v of def.variants) {
            conversionByVariant[v] = conversionStats?.[def.key]?.[v] ?? {
              exposures: 0,
              conversions: 0,
            }
          }
          return {
            constName,
            key: def.key,
            variants: def.variants,
            assigned,
            override,
            conversionByVariant,
          }
        },
      )
      setExperiments(expRows)
    } finally {
      setLoading(false)
    }
  }, [conversionStats])

  useEffect(() => {
    void refresh()
    const handler = () => {
      void refresh()
    }
    window.addEventListener('forje:ff-override-changed', handler)
    return () => window.removeEventListener('forje:ff-override-changed', handler)
  }, [refresh])

  // ── Handlers ────────────────────────────────────────────────────────────
  const toggleFlagOverride = useCallback((flagKey: string, current: FlagSnapshot) => {
    // Cycle: no override → true → false → no override
    if (current.overrideValue === null) {
      setLocalFlagOverride(flagKey, true)
    } else if (current.overrideValue === 'true') {
      setLocalFlagOverride(flagKey, false)
    } else {
      setLocalFlagOverride(flagKey, null)
    }
  }, [])

  const setExperimentOverride = useCallback((key: string, variant: string | null) => {
    setLocalFlagOverride(key, variant)
  }, [])

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      {/* ─── Flags ──────────────────────────────────────────────────────── */}
      <section className="bg-[#141414] border border-[#1c1c1c] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Feature flags</h2>
            <p className="text-xs text-[#B0B0B0] mt-0.5">
              PostHog-backed. Local overrides live in this browser only.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void refresh()}
            className="text-xs px-3 py-1.5 rounded-md border border-[#2a2a2a] text-[#B0B0B0] hover:text-white hover:border-[#D4AF37]/50 transition"
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-[#B0B0B0] border-b border-[#1c1c1c]">
                <th className="text-left py-2 pr-4 font-medium">Constant</th>
                <th className="text-left py-2 pr-4 font-medium">PostHog key</th>
                <th className="text-left py-2 pr-4 font-medium">PostHog</th>
                <th className="text-left py-2 pr-4 font-medium">Override</th>
                <th className="text-left py-2 pr-4 font-medium">Effective</th>
                <th className="text-right py-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {flags.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-[#B0B0B0]">
                    No flags registered.
                  </td>
                </tr>
              )}
              {flags.map((f) => {
                const effectiveOn = f.effective === true
                return (
                  <tr key={f.key} className="border-b border-[#1c1c1c] last:border-0">
                    <td className="py-3 pr-4 font-mono text-xs text-white">
                      {f.constName}
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs text-[#B0B0B0]">
                      {f.key}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] border ${badgeClass(
                          f.posthogValue === true ? 'on' : f.posthogValue === false ? 'off' : 'unknown',
                        )}`}
                      >
                        {f.posthogValue === undefined
                          ? 'unavailable'
                          : f.posthogValue === true
                            ? 'on'
                            : f.posthogValue === false
                              ? 'off'
                              : String(f.posthogValue)}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      {f.overrideValue === null ? (
                        <span className="text-xs text-[#B0B0B0]">—</span>
                      ) : (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] border ${badgeClass('override')}`}
                        >
                          {f.overrideValue}
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] border ${badgeClass(
                          effectiveOn ? 'on' : 'off',
                        )}`}
                      >
                        {effectiveOn ? 'on' : 'off'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        type="button"
                        onClick={() => toggleFlagOverride(f.key, f)}
                        className="text-xs px-2.5 py-1 rounded-md border border-[#2a2a2a] text-[#B0B0B0] hover:text-white hover:border-[#D4AF37]/50 transition"
                      >
                        {f.overrideValue === null
                          ? 'Override on'
                          : f.overrideValue === 'true'
                            ? 'Set off'
                            : 'Clear'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── Experiments ────────────────────────────────────────────────── */}
      <section className="bg-[#141414] border border-[#1c1c1c] rounded-xl p-5">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-white">Experiments</h2>
          <p className="text-xs text-[#B0B0B0] mt-0.5">
            A/B tests resolve to one variant per user. Conversion rates are
            rolling 30-day from PostHog.
          </p>
        </div>

        <div className="space-y-5">
          {experiments.map((exp) => (
            <div
              key={exp.key}
              className="border border-[#1c1c1c] rounded-lg p-4 bg-[#0f0f0f]"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-white font-mono">
                    {exp.constName}
                  </h3>
                  <p className="text-[11px] text-[#B0B0B0] font-mono mt-0.5">
                    {exp.key}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider text-[#B0B0B0]">
                    Your variant
                  </p>
                  <p className="text-xs text-white font-mono mt-0.5">
                    {exp.assigned ?? 'unassigned'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {exp.variants.map((variant) => {
                  const stats = exp.conversionByVariant[variant]
                  const isOverride = exp.override === variant
                  const isAssigned = exp.assigned === variant
                  return (
                    <button
                      key={variant}
                      type="button"
                      onClick={() =>
                        setExperimentOverride(exp.key, isOverride ? null : variant)
                      }
                      className={`text-left p-3 rounded-md border transition ${
                        isOverride
                          ? 'border-[#D4AF37]/50 bg-[#D4AF37]/5'
                          : isAssigned
                            ? 'border-[#2a2a2a] bg-[#141414]'
                            : 'border-[#1c1c1c] bg-[#0a0a0a] hover:border-[#2a2a2a]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-white">{variant}</span>
                        {isOverride && (
                          <span className="text-[10px] text-[#D4AF37]">OVERRIDE</span>
                        )}
                        {!isOverride && isAssigned && (
                          <span className="text-[10px] text-green-400">ACTIVE</span>
                        )}
                      </div>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-lg font-semibold text-white">
                          {formatRate(stats?.exposures ?? 0, stats?.conversions ?? 0)}
                        </span>
                        <span className="text-[10px] text-[#B0B0B0]">
                          {stats?.conversions ?? 0}/{stats?.exposures ?? 0}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>

              {exp.override && (
                <button
                  type="button"
                  onClick={() => setExperimentOverride(exp.key, null)}
                  className="mt-3 text-[11px] text-[#B0B0B0] hover:text-white transition"
                >
                  Clear override
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
