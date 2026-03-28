import Link from 'next/link'
import { requireAuthUser } from '@/lib/clerk'
import { TokenBalanceWidget } from '@/components/TokenBalanceWidget'
import { StreakWidget } from '@/components/StreakWidget'

// Placeholder projects — real data connected when Projects API built
const RECENT_PROJECTS = [
  {
    id: '1',
    name: 'Medieval Castle',
    thumbnail: null,
    lastEdited: '2 hours ago',
    buildType: 'Voice Build',
    tokensUsed: 240,
  },
  {
    id: '2',
    name: 'Tropical Island Map',
    thumbnail: null,
    lastEdited: '1 day ago',
    buildType: 'Image to Map',
    tokensUsed: 380,
  },
  {
    id: '3',
    name: 'Racing Track',
    thumbnail: null,
    lastEdited: '3 days ago',
    buildType: 'Voice Build',
    tokensUsed: 180,
  },
]

const QUICK_ACTIONS = [
  {
    href: '/voice',
    icon: '🎙️',
    label: 'Voice Build',
    description: 'Speak to build',
    color: '#FFB81C',
  },
  {
    href: '/image-to-map',
    icon: '🗺️',
    label: 'Image to Map',
    description: 'Upload reference',
    color: '#60A5FA',
  },
  {
    href: '/projects/new',
    icon: '✨',
    label: 'New Project',
    description: 'Blank canvas',
    color: '#A78BFA',
  },
  {
    href: '/marketplace',
    icon: '🛒',
    label: 'Templates',
    description: 'Browse library',
    color: '#34D399',
  },
]

export default async function DashboardPage() {
  const user = await requireAuthUser()

  return (
    <div className="max-w-7xl mx-auto">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          Welcome back{user.email ? `, ${user.email.split('@')[0]}` : ''} 👋
        </h1>
        <p className="text-gray-400 mt-1 text-sm">
          What are you building today?
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {QUICK_ACTIONS.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="bg-[#0D1231] border border-white/10 rounded-xl p-4 hover:border-white/20 transition-colors group"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3"
              style={{ background: `${action.color}15`, border: `1px solid ${action.color}30` }}
            >
              {action.icon}
            </div>
            <p className="text-white text-sm font-semibold group-hover:text-[#FFB81C] transition-colors">
              {action.label}
            </p>
            <p className="text-gray-500 text-xs mt-0.5">{action.description}</p>
          </Link>
        ))}
      </div>

      {/* Widgets row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <TokenBalanceWidget />
        <StreakWidget />
        {/* Subscription widget */}
        <div className="bg-[#0D1231] border border-white/10 rounded-xl p-4">
          <p className="text-gray-400 text-sm font-medium uppercase tracking-wide">Plan</p>
          <p className="text-3xl font-bold text-white mt-1">
            {user.subscription?.tier || 'FREE'}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <Link
              href="/billing"
              className="text-xs text-[#FFB81C] hover:underline"
            >
              Manage billing →
            </Link>
          </div>
        </div>
      </div>

      {/* Recent projects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Recent Projects</h2>
          <Link href="/projects" className="text-sm text-[#FFB81C] hover:underline">
            View all →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {RECENT_PROJECTS.map((project) => (
            <div
              key={project.id}
              className="bg-[#0D1231] border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-colors group"
            >
              {/* Thumbnail placeholder */}
              <div className="h-36 bg-[#111640] flex items-center justify-center">
                <div className="text-4xl opacity-30">🎮</div>
              </div>
              <div className="p-4">
                <p className="text-white font-semibold text-sm group-hover:text-[#FFB81C] transition-colors">
                  {project.name}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500">{project.lastEdited}</span>
                  <span className="text-xs bg-white/5 text-gray-400 px-2 py-0.5 rounded-full">
                    {project.buildType}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-xs text-[#FFB81C]">⚡</span>
                  <span className="text-xs text-gray-500">{project.tokensUsed} tokens used</span>
                </div>
              </div>
            </div>
          ))}

          {/* New project card */}
          <Link
            href="/projects/new"
            className="bg-[#0D1231] border border-dashed border-white/20 rounded-xl h-full min-h-[180px] flex flex-col items-center justify-center hover:border-[#FFB81C]/40 transition-colors group"
          >
            <div className="w-12 h-12 rounded-full bg-white/5 group-hover:bg-[#FFB81C]/10 flex items-center justify-center mb-3 transition-colors">
              <svg className="w-6 h-6 text-gray-500 group-hover:text-[#FFB81C] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <p className="text-gray-500 group-hover:text-[#FFB81C] text-sm font-medium transition-colors">
              New Project
            </p>
          </Link>
        </div>
      </div>
    </div>
  )
}
