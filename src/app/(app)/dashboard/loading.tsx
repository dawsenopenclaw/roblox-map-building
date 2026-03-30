import { TopLoadingBar } from '@/components/TopLoadingBar'

export default function DashboardLoading() {
  return (
    <>
      <TopLoadingBar />
      <div className="loading-enter max-w-7xl mx-auto px-4 sm:px-0">
        {/* Greeting skeleton — gold tint on headline */}
        <div className="mb-8">
          <div className="h-8 w-56 rounded-xl shimmer-gold mb-2" />
          <div className="h-4 w-36 rounded-lg shimmer" />
        </div>

        {/* Stat cards — 3 cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-[#141414] border border-white/10 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="h-3 w-24 rounded-md shimmer" />
                <div className="w-8 h-8 rounded-xl shimmer" />
              </div>
              <div className="h-7 w-20 rounded-lg shimmer-gold mb-1" />
              <div className="h-3 w-16 rounded-md shimmer" />
            </div>
          ))}
        </div>

        {/* Quick action bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-[#141414] border border-white/10 rounded-2xl p-4">
              <div className="w-10 h-10 rounded-xl shimmer mb-3" />
              <div className="h-4 w-20 rounded-md shimmer-gold mb-1" />
              <div className="h-3 w-32 rounded-md shimmer" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Project cards grid — 6 cards (2/3 width) */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div className="h-5 w-32 rounded-lg shimmer-gold" />
              <div className="h-4 w-20 rounded-md shimmer" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-[#141414] border border-white/10 rounded-2xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="h-4 w-32 rounded-md shimmer" />
                    <div className="h-5 w-16 rounded-full shimmer" />
                  </div>
                  <div className="h-3 w-24 rounded-md shimmer mb-3" />
                  <div className="flex items-center justify-between">
                    <div className="h-3 w-20 rounded-md shimmer" />
                    <div className="h-3 w-12 rounded-md shimmer" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            {/* Token widget — circle + text */}
            <div className="bg-[#141414] border border-white/10 rounded-2xl p-5">
              <div className="h-4 w-24 rounded-md shimmer-gold mb-4" />
              <div className="flex items-center gap-4">
                {/* Circle */}
                <div className="w-16 h-16 rounded-full shimmer flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-20 rounded-md shimmer-gold" />
                  <div className="h-3 w-28 rounded-md shimmer" />
                  <div className="h-2 w-full rounded-full shimmer" />
                </div>
              </div>
            </div>

            {/* Activity feed — 5 items */}
            <div className="bg-[#141414] border border-white/10 rounded-2xl p-5">
              <div className="h-4 w-28 rounded-md shimmer-gold mb-4" />
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full shimmer flex-shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-full rounded-md shimmer" />
                      <div className="h-3 w-2/3 rounded-md shimmer" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
