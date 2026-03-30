import { TopLoadingBar } from '@/components/TopLoadingBar'

export default function AdminAnalyticsLoading() {
  return (
    <>
      <TopLoadingBar />
      <div className="loading-enter space-y-8 p-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div>
          <div className="h-7 w-28 rounded-xl shimmer-gold mb-2" />
          <div className="h-4 w-56 rounded-md shimmer" />
        </div>

        {/* Key metrics — 4 cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-[#141414] border border-[#1c1c1c] rounded-xl p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="h-3 w-16 rounded shimmer mb-2" />
                  <div className="h-7 w-20 rounded-lg shimmer-gold mb-1" />
                  <div className="h-3 w-24 rounded shimmer" />
                </div>
                <div className="w-10 h-10 rounded-lg shimmer flex-shrink-0" />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* MRR chart */}
          <div className="xl:col-span-2 bg-[#141414] border border-[#1c1c1c] rounded-xl p-6">
            <div className="h-3 w-24 rounded shimmer mb-6" />
            <div className="flex items-end gap-2 h-40">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex-1 flex flex-col items-center justify-end" style={{ height: '100%' }}>
                  <div
                    className="w-full rounded-t shimmer"
                    style={{ height: `${40 + i * 10}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-3 w-8 rounded shimmer" />
              ))}
            </div>
          </div>

          {/* Conversion funnel */}
          <div className="bg-[#141414] border border-[#1c1c1c] rounded-xl p-6">
            <div className="h-3 w-32 rounded shimmer mb-6" />
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between">
                    <div className="h-3 w-16 rounded shimmer" />
                    <div className="h-3 w-20 rounded shimmer" />
                  </div>
                  <div className="h-2 w-full rounded-full shimmer" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Top templates */}
          <div className="bg-[#141414] border border-[#1c1c1c] rounded-xl p-6">
            <div className="h-3 w-40 rounded shimmer mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-4 rounded shimmer" />
                    <div>
                      <div className="h-4 w-36 rounded shimmer mb-1" />
                      <div className="h-3 w-24 rounded shimmer" />
                    </div>
                  </div>
                  <div className="h-4 w-16 rounded shimmer-gold" />
                </div>
              ))}
            </div>
          </div>

          {/* Cohort retention */}
          <div className="bg-[#141414] border border-[#1c1c1c] rounded-xl p-6">
            <div className="h-3 w-32 rounded shimmer mb-4" />
            <div className="space-y-3">
              <div className="flex gap-4">
                {['Cohort', 'Wk 1', 'Wk 2', 'Wk 4', 'Wk 8'].map((_, i) => (
                  <div key={i} className="h-3 w-12 rounded shimmer flex-1" />
                ))}
              </div>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <div key={j} className="h-4 w-12 rounded shimmer flex-1" />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
