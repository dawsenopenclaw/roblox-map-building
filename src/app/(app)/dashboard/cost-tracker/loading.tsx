import { TopLoadingBar } from '@/components/TopLoadingBar'

export default function CostTrackerLoading() {
  return (
    <>
      <TopLoadingBar />
      <div className="loading-enter max-w-4xl mx-auto">
        {/* Header */}
        <div className="h-7 w-40 rounded-xl shimmer-gold mb-2" />
        <div className="h-4 w-72 rounded shimmer mb-6" />

        {/* Summary stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-[#141414] border border-white/10 rounded-2xl p-5">
              <div className="h-3 w-24 rounded shimmer mb-2" />
              <div className="h-7 w-20 rounded-lg shimmer-gold mb-1" />
              <div className="h-3 w-16 rounded shimmer" />
            </div>
          ))}
        </div>

        {/* Bar chart area */}
        <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 mb-6">
          <div className="h-4 w-32 rounded shimmer mb-4" />
          <div className="flex items-end gap-2 h-48">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex-1 rounded-t shimmer" style={{ height: `${35 + i * 7}%` }} />
            ))}
          </div>
        </div>

        {/* Per-provider breakdown */}
        <div className="bg-[#141414] border border-white/10 rounded-2xl p-6">
          <div className="h-4 w-36 rounded shimmer mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full shimmer flex-shrink-0" />
                  <div className="h-4 w-24 rounded shimmer" />
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-2 w-32 rounded-full shimmer" />
                  <div className="h-4 w-16 rounded shimmer-gold" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
