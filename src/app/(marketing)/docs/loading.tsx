import { TopLoadingBar } from '@/components/TopLoadingBar'

export default function DocsLoading() {
  return (
    <>
      <TopLoadingBar />
      <div className="max-w-6xl mx-auto px-4 py-12 flex gap-8">
        {/* Sidebar nav */}
        <aside className="w-56 flex-shrink-0 hidden lg:block space-y-1">
          <div className="h-4 w-20 rounded shimmer mb-4" />
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-8 w-full rounded-lg shimmer" />
          ))}
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 space-y-8">
          {/* Page title */}
          <div>
            <div className="h-9 w-56 rounded-xl shimmer-gold mb-2" />
            <div className="h-4 w-80 rounded shimmer" />
          </div>

          {/* Endpoint blocks */}
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-[#141414] border border-white/10 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-6 w-12 rounded shimmer flex-shrink-0" />
                <div className="h-6 w-48 rounded shimmer font-mono" />
              </div>
              <div className="h-4 w-full rounded shimmer" />
              <div className="h-4 w-3/4 rounded shimmer" />
              {/* Code block */}
              <div className="bg-[#0d0d0d] rounded-xl p-4 space-y-1.5">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="h-4 rounded shimmer" style={{ width: `${50 + j * 10}%` }} />
                ))}
              </div>
            </div>
          ))}
        </main>
      </div>
    </>
  )
}
