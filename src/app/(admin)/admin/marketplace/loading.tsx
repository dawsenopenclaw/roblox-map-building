import { TopLoadingBar } from '@/components/TopLoadingBar'

export default function AdminMarketplaceLoading() {
  return (
    <>
      <TopLoadingBar />
      <div className="loading-enter space-y-6 p-6 max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="h-7 w-56 rounded-xl shimmer-gold mb-2" />
            <div className="h-4 w-36 rounded shimmer" />
          </div>
          <div className="h-9 w-24 rounded-lg shimmer" />
        </div>

        {/* Submission cards */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="bg-[#141414] border border-[#1c1c1c] rounded-xl overflow-hidden flex flex-col sm:flex-row"
          >
            {/* Thumbnail */}
            <div className="w-full sm:w-40 h-36 sm:h-auto flex-shrink-0 shimmer" />
            {/* Body */}
            <div className="flex-1 p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-48 rounded shimmer-gold" />
                  <div className="h-3 w-full rounded shimmer" />
                  <div className="h-3 w-3/4 rounded shimmer" />
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <div className="h-5 w-24 rounded-full shimmer" />
                  <div className="h-4 w-12 rounded shimmer" />
                </div>
              </div>
              <div className="flex gap-1">
                {Array.from({ length: 3 }).map((__, j) => (
                  <div key={j} className="h-5 w-16 rounded shimmer" />
                ))}
              </div>
              <div className="flex gap-4">
                <div className="h-3 w-40 rounded shimmer" />
                <div className="h-3 w-28 rounded shimmer" />
              </div>
              <div className="flex gap-2 pt-1">
                <div className="h-8 w-24 rounded-lg shimmer" />
                <div className="h-8 w-20 rounded-lg shimmer" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
