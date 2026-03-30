import { TopLoadingBar } from '@/components/TopLoadingBar'

export default function BusinessLoading() {
  return (
    <>
      <TopLoadingBar />
      <div className="loading-enter max-w-7xl mx-auto px-4 sm:px-0">
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="h-8 w-48 rounded-xl shimmer-gold mb-2" />
          <div className="h-4 w-64 rounded-lg shimmer" />
        </div>

        {/* KPI cards — 4 cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-[#141414] border border-white/10 rounded-2xl p-5">
              <div className="h-3 w-20 rounded-md shimmer mb-3" />
              <div className="h-7 w-24 rounded-lg shimmer-gold mb-2" />
              <div className="h-3 w-16 rounded-md shimmer" />
            </div>
          ))}
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Charts section — 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            {/* Chart 1 */}
            <div className="bg-[#141414] border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-5 w-32 rounded-lg shimmer-gold" />
                <div className="h-4 w-20 rounded-md shimmer" />
              </div>
              <div className="w-full h-64 rounded-xl shimmer" />
            </div>

            {/* Chart 2 */}
            <div className="bg-[#141414] border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-5 w-32 rounded-lg shimmer-gold" />
                <div className="h-4 w-20 rounded-md shimmer" />
              </div>
              <div className="w-full h-64 rounded-xl shimmer" />
            </div>
          </div>

          {/* Sidebar — 1/3 width */}
          <div className="space-y-4">
            {/* Card 1 */}
            <div className="bg-[#141414] border border-white/10 rounded-2xl p-5">
              <div className="h-4 w-24 rounded-md shimmer-gold mb-4" />
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i}>
                    <div className="h-3 w-20 rounded-md shimmer mb-2" />
                    <div className="h-2 w-full rounded-full shimmer" />
                  </div>
                ))}
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-[#141414] border border-white/10 rounded-2xl p-5">
              <div className="h-4 w-20 rounded-md shimmer-gold mb-4" />
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full shimmer flex-shrink-0" />
                    <div className="flex-1">
                      <div className="h-3 w-20 rounded-md shimmer mb-1" />
                      <div className="h-2 w-16 rounded-md shimmer" />
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
