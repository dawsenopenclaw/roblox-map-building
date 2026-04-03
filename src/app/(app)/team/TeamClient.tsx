'use client'

export default function TeamClient() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 pt-2">

      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#D4AF37]/70 uppercase tracking-widest">Collaboration</span>
          <span className="w-1 h-1 rounded-full bg-white/20" />
          <span className="text-xs text-gray-400">Team Management</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
          Your{' '}
          <span className="text-[#D4AF37] drop-shadow-[0_0_20px_rgba(212,175,55,0.4)]">
            Team
          </span>
        </h1>
        <p className="text-gray-300 text-base max-w-xl leading-relaxed">
          Invite collaborators, manage roles, and build Roblox games together in real time.
        </p>
      </div>

      {/* Coming soon card */}
      <div className="bg-[#141414] border border-white/[0.08] rounded-2xl p-8 flex flex-col items-center text-center gap-5">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #B8962E 100%)' }}
        >
          <svg className="w-8 h-8 text-[#0a0a0a]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
          </svg>
        </div>
        <div>
          <p className="text-white font-semibold text-lg">Team features coming soon</p>
          <p className="text-gray-400 text-sm mt-2 max-w-sm leading-relaxed">
            Multi-seat workspaces, role-based permissions, and shared asset libraries
            are in active development. Upgrade to a paid plan to be first in line.
          </p>
        </div>
        <a
          href="/billing"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-[#0a0a0a] transition-all"
          style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #F5D878 50%, #B8962E 100%)' }}
        >
          View Plans
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </a>
      </div>

      {/* Planned features */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          {
            title: 'Invite Members',
            desc: 'Send email invites and manage seats from one dashboard. Remove or reassign any time.',
            accent: 'gold' as const,
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            ),
          },
          {
            title: 'Role Permissions',
            desc: 'Owner, Editor, and Viewer roles. Fine-grained control over who can publish or modify assets.',
            accent: 'royal' as const,
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            ),
          },
          {
            title: 'Shared Workspace',
            desc: 'All team projects in one place. Shared token pool, shared marketplace assets.',
            accent: 'gold' as const,
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            ),
          },
          {
            title: 'Activity History',
            desc: 'Full audit log of who built what, when. Roll back changes from any point.',
            accent: 'royal' as const,
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
          },
          {
            title: 'Build Comments',
            desc: 'Leave inline comments on any scene object or script. Keep feedback in context.',
            accent: 'gold' as const,
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            ),
          },
          {
            title: 'Concurrent Builds',
            desc: 'Multiple team members building in the same project simultaneously without conflicts.',
            accent: 'royal' as const,
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            ),
          },
        ].map((feat) => {
          const isRoyal = feat.accent === 'royal'
          return (
            <div key={feat.title} className="bg-[#141414] border border-white/[0.08] rounded-xl p-5 space-y-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{
                  background: isRoyal ? 'rgba(124,58,237,0.1)' : 'rgba(212,175,55,0.1)',
                  border: isRoyal ? '1px solid rgba(124,58,237,0.2)' : '1px solid rgba(212,175,55,0.2)',
                  color: isRoyal ? '#A78BFA' : '#D4AF37',
                }}
              >
                {feat.icon}
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{feat.title}</p>
                <p className="text-gray-400 text-xs mt-1 leading-relaxed">{feat.desc}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
