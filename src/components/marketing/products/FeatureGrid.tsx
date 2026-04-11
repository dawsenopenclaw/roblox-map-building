'use client'

/**
 * FeatureGrid — responsive feature grid with icon + headline + body.
 * Renders 3×2 on desktop, 2×3 on tablet, 1×6 on mobile.
 *
 * Icons are resolved by name from lucide-react (already a dependency).
 * Accessible: each card is a <article> with an aria-labelledby heading link.
 */

import * as Lucide from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface Feature {
  title: string
  body: string
  /** lucide-react icon name, e.g. "Zap", "Layers". Falls back to Sparkles. */
  icon: string
}

export interface FeatureGridProps {
  eyebrow?: string
  title: string
  subtitle?: string
  features: Feature[]
  /** Default: 3 columns on desktop. */
  columns?: 2 | 3
}

function resolveIcon(name: string): LucideIcon {
  // Safely look up the icon at runtime. If the name is wrong, fall back to Sparkles.
  const lib = Lucide as unknown as Record<string, LucideIcon>
  return lib[name] ?? Lucide.Sparkles
}

export default function FeatureGrid({
  eyebrow,
  title,
  subtitle,
  features,
  columns = 3,
}: FeatureGridProps) {
  const gridCols = columns === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'

  return (
    <section className="relative py-20 md:py-28" aria-labelledby="feature-grid-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          {eyebrow && (
            <span
              className="inline-block text-xs font-semibold uppercase tracking-[0.2em]"
              style={{ color: '#D4AF37' }}
            >
              {eyebrow}
            </span>
          )}
          <h2
            id="feature-grid-heading"
            className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl"
          >
            {title}
          </h2>
          {subtitle && (
            <p className="mt-4 text-base leading-relaxed text-zinc-400 md:text-lg">
              {subtitle}
            </p>
          )}
        </div>

        <div className={`mt-14 grid gap-5 ${gridCols}`}>
          {features.map((feature, idx) => {
            const Icon = resolveIcon(feature.icon)
            const headingId = `feature-${idx}-heading`
            return (
              <article
                key={feature.title}
                aria-labelledby={headingId}
                className="group relative rounded-2xl border border-white/10 bg-white/[0.02] p-7 transition-colors hover:border-[#D4AF37]/40 hover:bg-white/[0.04]"
              >
                <div
                  className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl border transition-colors"
                  style={{
                    borderColor: 'rgba(212,175,55,0.35)',
                    background: 'rgba(212,175,55,0.08)',
                  }}
                  aria-hidden="true"
                >
                  <Icon size={22} color="#D4AF37" />
                </div>
                <h3
                  id={headingId}
                  className="text-lg font-semibold text-white"
                >
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  {feature.body}
                </p>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
