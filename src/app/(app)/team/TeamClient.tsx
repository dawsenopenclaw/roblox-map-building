'use client'

import { Users, GitBranch, Lock, Activity, UserPlus, Shield, Wand2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const FEATURES = [
  {
    icon: Users,
    title: 'Shared Projects',
    desc: 'All team projects in one workspace. Shared token pool, shared asset library.',
  },
  {
    icon: Shield,
    title: 'Role Permissions',
    desc: 'Owner, Editor, and Viewer roles. Fine-grained control over who can publish.',
  },
  {
    icon: GitBranch,
    title: 'Version History',
    desc: 'Full audit log of who built what and when. Roll back to any point.',
  },
  {
    icon: Activity,
    title: 'Real-time Collab',
    desc: 'Multiple builders in the same project simultaneously — no conflicts.',
  },
]

const STAT_PILLS = [
  { label: 'Seats per workspace', value: 'Up to 10' },
  { label: 'Shared token pool', value: 'Yes' },
  { label: 'Roles', value: '3 levels' },
  { label: 'Version history', value: 'Unlimited' },
]

export default function TeamClient() {
  return (
    <div className="max-w-3xl mx-auto pb-16 pt-2 px-4">

      {/* Back link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#D4AF37] transition-colors mb-8 group"
      >
        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
        Dashboard
      </Link>

      {/* Hero */}
      <div
        className="relative rounded-2xl overflow-hidden p-8 sm:p-12 mb-8 text-center"
        style={{
          background: 'linear-gradient(135deg, rgba(212,175,55,0.07) 0%, rgba(5,8,16,0) 60%)',
          border: '1px solid rgba(212,175,55,0.12)',
        }}
      >
        {/* Glow */}
        <div
          aria-hidden="true"
          className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)' }}
        />

        <div className="relative z-10">
          {/* Icon cluster */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
              <Users className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
              <GitBranch className="w-5 h-5 text-white/40" />
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
              <Lock className="w-5 h-5 text-white/40" />
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
              <Activity className="w-5 h-5 text-white/40" />
            </div>
          </div>

          <span className="inline-block text-xs font-bold px-3 py-1 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/25 mb-4">
            Coming Soon
          </span>

          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Team{' '}
            <span
              className="text-[#D4AF37]"
              style={{ textShadow: '0 0 30px rgba(212,175,55,0.35)' }}
            >
              Features
            </span>
          </h1>
          <p className="text-gray-400 max-w-md mx-auto leading-relaxed">
            Invite collaborators, manage roles, and build Roblox games together
            in real time. Multi-seat workspaces are in active development.
          </p>

          {/* Stat pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
            {STAT_PILLS.map(({ label, value }) => (
              <div
                key={label}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <span className="text-gray-500">{label}:</span>
                <span className="text-[#D4AF37] font-semibold">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feature grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        {FEATURES.map((feat) => {
          const Icon = feat.icon
          return (
            <div
              key={feat.title}
              className="group rounded-2xl p-5 transition-all duration-200 hover:scale-[1.02]"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                style={{
                  background: 'rgba(212,175,55,0.08)',
                  border: '1px solid rgba(212,175,55,0.18)',
                }}
              >
                <Icon className="w-4 h-4 text-[#D4AF37]" />
              </div>
              <p className="text-white font-semibold text-sm mb-1">{feat.title}</p>
              <p className="text-gray-400 text-xs leading-relaxed">{feat.desc}</p>
            </div>
          )
        })}
      </div>

      {/* CTA row */}
      <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
        <a
          href="mailto:hello@forjegames.com?subject=Team%20Features%20Waitlist"
          className="inline-flex items-center gap-2.5 px-7 py-3 rounded-xl font-bold text-sm text-[#050810] transition-all hover:scale-[1.03] active:scale-100"
          style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #F5D878 50%, #B8962E 100%)' }}
        >
          <UserPlus className="w-4 h-4" />
          Join Waitlist
        </a>
        <Link
          href="/billing"
          className="inline-flex items-center gap-2 px-7 py-3 rounded-xl font-bold text-sm text-white/70 hover:text-white transition-all hover:scale-[1.02]"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <Wand2 className="w-4 h-4 text-[#D4AF37]" />
          View Plans
        </Link>
      </div>
    </div>
  )
}
