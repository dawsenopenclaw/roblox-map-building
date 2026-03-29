import { TopLoadingBar } from '@/components/TopLoadingBar'

export default function MarketplaceEarningsLoading() {
  return (
    <>
      <TopLoadingBar />
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="h-7 w-36 rounded-xl shimmer-gold mb-2" />
          <div className="h-4 w-48 rounded shimmer" />
        </div>

        {/* Balance card */}
        <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 w-28 rounded shimmer" />
            <div className="h-5 w-20 rounded-full shimmer" />
          </div>
          <div className="h-10 w-36 rounded-xl shimmer-gold mb-1" />
          <div className="h-3 w-32 rounded shimmer mb-4" />
          <div className="h-10 w-40 rounded-xl shimmer" />
        </div>

        {/* Recent sales */}
        <div className="bg-[#141414] border border-white/10 rounded-2xl p-5">
          <div className="h-4 w-28 rounded shimmer-gold mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg shimmer flex-shrink-0" />
                  <div>
                    <div className="h-4 w-40 rounded shimmer mb-1" />
                    <div className="h-3 w-24 rounded shimmer" />
                  </div>
                </div>
                <div className="h-5 w-16 rounded shimmer-gold flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
