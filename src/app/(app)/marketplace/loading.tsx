import { TopLoadingBar } from '@/components/TopLoadingBar'

export default function MarketplaceLoading() {
  return (
    <>
      <TopLoadingBar />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="h-8 w-40 rounded-xl shimmer-gold mb-2" />
            <div className="h-4 w-64 rounded-md shimmer" />
          </div>
          <div className="h-9 w-36 rounded-xl shimmer" />
        </div>

        {/* Search + filter bar */}
        <div className="bg-[#0D1231] border border-white/10 rounded-xl p-4 mb-6">
          <div className="flex gap-3 mb-4">
            <div className="flex-1 h-10 rounded-xl shimmer" />
            <div className="h-10 w-20 rounded-xl shimmer" />
          </div>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="h-7 rounded-full shimmer"
                style={{ width: `${60 + i * 12}px` }}
              />
            ))}
            <div className="ml-auto h-7 w-32 rounded-xl shimmer" />
          </div>
        </div>

        {/* Results count placeholder */}
        <div className="h-4 w-32 rounded-md shimmer mb-4" />

        {/* Template card grid — 8 cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-[#0D1231] border border-white/10 rounded-xl overflow-hidden"
            >
              {/* Image placeholder */}
              <div className="h-40 shimmer" />
              <div className="p-3 space-y-2">
                {/* Title */}
                <div className="h-3.5 w-3/4 rounded-md shimmer-gold" />
                {/* Creator */}
                <div className="h-3 w-1/2 rounded-md shimmer" />
                {/* Stars + price row */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <div key={j} className="w-3 h-3 rounded-sm shimmer" />
                    ))}
                  </div>
                  <div className="h-3.5 w-10 rounded-md shimmer" />
                </div>
                {/* Downloads */}
                <div className="h-3 w-24 rounded-md shimmer" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
