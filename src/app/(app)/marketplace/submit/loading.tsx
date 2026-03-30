import { TopLoadingBar } from '@/components/TopLoadingBar'

export default function MarketplaceSubmitLoading() {
  return (
    <>
      <TopLoadingBar />
      <div className="loading-enter max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="h-7 w-40 rounded-xl shimmer-gold mb-2" />
          <div className="h-4 w-64 rounded shimmer" />
        </div>

        {/* Form card */}
        <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 space-y-5">
          {/* Title + category row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="h-3 w-12 rounded shimmer mb-2" />
              <div className="h-10 w-full rounded-xl shimmer" />
            </div>
            <div>
              <div className="h-3 w-20 rounded shimmer mb-2" />
              <div className="h-10 w-full rounded-xl shimmer" />
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="h-3 w-24 rounded shimmer mb-2" />
            <div className="h-24 w-full rounded-xl shimmer" />
          </div>

          {/* Price + tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="h-3 w-20 rounded shimmer mb-2" />
              <div className="h-10 w-full rounded-xl shimmer" />
            </div>
            <div>
              <div className="h-3 w-12 rounded shimmer mb-2" />
              <div className="h-10 w-full rounded-xl shimmer" />
            </div>
          </div>

          {/* File + thumbnail upload */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i}>
                <div className="h-3 w-24 rounded shimmer mb-2" />
                <div className="h-24 w-full rounded-xl border-2 border-dashed border-white/10 shimmer" />
              </div>
            ))}
          </div>

          {/* Submit button */}
          <div className="h-11 w-full rounded-xl shimmer-gold" />
        </div>
      </div>
    </>
  )
}
