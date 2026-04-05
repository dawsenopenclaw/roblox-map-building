import { TopLoadingBar } from '@/components/TopLoadingBar'

export default function GiftsLoading() {
  return (
    <>
      <TopLoadingBar />
      <div className="loading-enter max-w-7xl mx-auto px-4 sm:px-0">
        {/* Page heading skeleton */}
        <div className="mb-8">
          <div className="h-8 w-40 rounded-xl shimmer-gold mb-2" />
          <div className="h-4 w-56 rounded-lg shimmer" />
        </div>

        {/* Stat cards — 2 cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {Array.from({ length: 2 }).map((_, i) => (
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

        {/* Gift item list */}
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-[#141414] border border-white/10 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl shimmer flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 rounded-md shimmer-gold" />
                <div className="h-3 w-56 rounded-md shimmer" />
              </div>
              <div className="h-8 w-24 rounded-lg shimmer" />
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
