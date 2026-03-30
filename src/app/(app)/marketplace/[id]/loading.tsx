import { TopLoadingBar } from '@/components/TopLoadingBar'

export default function MarketplaceItemLoading() {
  return (
    <>
      <TopLoadingBar />
      <div className="loading-enter max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left — main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Thumbnail */}
            <div className="aspect-video w-full rounded-2xl shimmer" />

            {/* Screenshots */}
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="w-20 h-14 rounded-lg shimmer flex-shrink-0" />
              ))}
            </div>

            {/* Title + meta */}
            <div>
              <div className="h-7 w-64 rounded-xl shimmer-gold mb-2" />
              <div className="flex items-center gap-3 mb-3">
                <div className="h-5 w-20 rounded-full shimmer" />
                <div className="h-4 w-24 rounded shimmer" />
              </div>
              <div className="h-4 w-full rounded shimmer mb-1" />
              <div className="h-4 w-3/4 rounded shimmer" />
            </div>

            {/* Tags */}
            <div className="flex gap-2 flex-wrap">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-6 w-16 rounded-full shimmer" />
              ))}
            </div>

            {/* Reviews */}
            <div className="bg-[#141414] border border-white/10 rounded-2xl p-5">
              <div className="h-4 w-20 rounded shimmer-gold mb-4" />
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-9 h-9 rounded-full shimmer flex-shrink-0" />
                    <div className="flex-1">
                      <div className="h-4 w-32 rounded shimmer mb-1" />
                      <div className="h-3 w-full rounded shimmer mb-1" />
                      <div className="h-3 w-2/3 rounded shimmer" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right — purchase sidebar */}
          <div className="space-y-4">
            <div className="bg-[#141414] border border-white/10 rounded-2xl p-5 sticky top-4">
              <div className="h-8 w-24 rounded-xl shimmer-gold mb-1" />
              <div className="h-3 w-20 rounded shimmer mb-4" />
              <div className="h-11 w-full rounded-xl shimmer mb-3" />
              <div className="h-9 w-full rounded-xl shimmer" />
              <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <div className="h-3 w-20 rounded shimmer" />
                    <div className="h-3 w-16 rounded shimmer" />
                  </div>
                ))}
              </div>
            </div>

            {/* Creator card */}
            <div className="bg-[#141414] border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full shimmer flex-shrink-0" />
                <div>
                  <div className="h-4 w-28 rounded shimmer mb-1" />
                  <div className="h-3 w-16 rounded shimmer" />
                </div>
              </div>
              <div className="h-8 w-full rounded-lg shimmer" />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
