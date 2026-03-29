'use client'

import { type ReactNode } from 'react'

export type EmptyStateVariant =
  | 'no_projects'
  | 'no_templates'
  | 'no_activity'
  | 'no_team'
  | 'no_scans'

interface EmptyStateProps {
  variant: EmptyStateVariant
  /** Override default title */
  title?: string
  /** Override default description */
  description?: string
  /** CTA label */
  ctaLabel?: string
  /** CTA handler */
  onCta?: () => void
  /** Optional extra content below CTA */
  children?: ReactNode
  className?: string
}

interface VariantConfig {
  icon: JSX.Element
  badge: string
  title: string
  description: string
  cta: string
  hint: string
}

const VARIANTS: Record<EmptyStateVariant, VariantConfig> = {
  no_projects: {
    icon: (
      <svg className="w-10 h-10 text-[#FFB81C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v8.25A2.25 2.25 0 0 0 4.5 16.5h15a2.25 2.25 0 0 0 2.25-2.25V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
      </svg>
    ),
    badge: 'Projects',
    title: 'No projects yet',
    description: 'Create your first Roblox map project and let AI build it for you in minutes.',
    cta: 'New project',
    hint: 'Start with a template or describe your map in plain English',
  },
  no_templates: {
    icon: (
      <svg className="w-10 h-10 text-[#FFB81C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75.125v-5.25C2.25 12.004 2.754 11.5 3.375 11.5h.375m0 8v-8M6 18.375v-8.625M6 9.75h12.375c.621 0 1.125.504 1.125 1.125V18.375c0 .621-.504 1.125-1.125 1.125H6M9.75 9.75v9" />
      </svg>
    ),
    badge: 'Templates',
    title: 'No templates saved',
    description: 'Save a project as a template to reuse it across future builds with one click.',
    cta: 'Browse templates',
    hint: 'Templates speed up your workflow by 3× on repeat map types',
  },
  no_activity: {
    icon: (
      <svg className="w-10 h-10 text-[#FFB81C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
      </svg>
    ),
    badge: 'Activity',
    title: 'No activity yet',
    description: 'Recent builds, scans, and exports will appear here as you work.',
    cta: 'Start building',
    hint: 'Build your first map — it takes under 60 seconds',
  },
  no_team: {
    icon: (
      <svg className="w-10 h-10 text-[#FFB81C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
      </svg>
    ),
    badge: 'Team',
    title: 'Building solo?',
    description: 'Invite collaborators to build maps together, share assets, and review builds in real time.',
    cta: 'Invite team',
    hint: 'Teams ship maps 2× faster with shared asset libraries',
  },
  no_scans: {
    icon: (
      <svg className="w-10 h-10 text-[#FFB81C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 15.75-2.489-2.489m0 0a3.375 3.375 0 1 0-4.773-4.773 3.375 3.375 0 0 0 4.774 4.774ZM21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
    badge: 'Scans',
    title: 'No scans yet',
    description: 'Upload an image or sketch a scene to generate your first AI-powered map scan.',
    cta: 'New scan',
    hint: 'Image-to-map converts any photo into a playable Roblox world',
  },
}

export function EmptyState({
  variant,
  title,
  description,
  ctaLabel,
  onCta,
  children,
  className = '',
}: EmptyStateProps) {
  const config = VARIANTS[variant]

  return (
    <div
      className={`relative flex flex-col items-center justify-center text-center py-16 px-6 ${className}`}
    >
      {/* Subtle dot-grid background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: 'radial-gradient(circle, #FFB81C 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Soft radial glow behind icon */}
      <div className="pointer-events-none absolute inset-0 flex items-start justify-center pt-8">
        <div className="w-48 h-48 rounded-full bg-[#FFB81C]/6 blur-[60px]" />
      </div>

      <div className="relative">
        {/* Icon */}
        <div className="relative mb-5">
          <div className="absolute inset-0 rounded-full bg-[#FFB81C]/5 animate-ping" style={{ animationDuration: '3s' }} />
          <div className="relative w-20 h-20 rounded-full bg-[#242424] border border-[#FFB81C]/20 flex items-center justify-center shadow-xl">
            <div className="animate-[float_3s_ease-in-out_infinite]">
              {config.icon}
            </div>
          </div>
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 bg-[#FFB81C]/10 border border-[#FFB81C]/20 rounded-full px-2.5 py-0.5 mb-4">
          <span className="w-1 h-1 rounded-full bg-[#FFB81C]" />
          <span className="text-[#FFB81C] text-[10px] font-semibold uppercase tracking-widest">{config.badge}</span>
        </div>

        <h3 className="text-lg font-bold text-white mb-2">{title ?? config.title}</h3>
        <p className="text-gray-400 text-sm mb-2 max-w-xs leading-relaxed">
          {description ?? config.description}
        </p>

        {/* Hint chip */}
        <p className="text-[#FFB81C]/60 text-xs mb-6 max-w-xs leading-relaxed">
          {config.hint}
        </p>

        {onCta && (
          <button
            onClick={onCta}
            className="inline-flex items-center gap-2 bg-[#FFB81C] hover:bg-[#E6A519] text-black font-bold px-6 py-2.5 rounded-xl transition-all text-sm shadow-lg shadow-[#FFB81C]/20 hover:shadow-[#FFB81C]/30 hover:-translate-y-0.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            {ctaLabel ?? config.cta}
          </button>
        )}

        {children}
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-7px); }
        }
      `}</style>
    </div>
  )
}
